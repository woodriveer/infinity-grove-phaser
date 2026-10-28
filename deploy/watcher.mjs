//  The watcher: every 60 s it fetches origin/main and deploys the newest commit it has not handled (backend blue-green, then the Worker)
//  Usage: node deploy/watcher.mjs, with JWT_SECRET in the env (publish.sh exports it; compose hands it to the slots)
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deployBackend as realDeployBackend } from './lib/backendDeploy.mjs';
import { changedFiles, classify } from './lib/changes.mjs';
import { sweepPrevious as realSweepPrevious } from './lib/previous.mjs';
import { run } from './lib/run.mjs';
import { acquireLock, readState, releaseLock, writeState } from './lib/state.mjs';
import { publishWorker as realPublishWorker } from './lib/workerPublish.mjs';

export const POLL_MS = 60000;

export const tick = async ({
    exec,
    fetch,
    root,
    stateFile,
    lockFile,
    log,
    sleep,
    now,
    deployBackend = realDeployBackend,
    publishWorker = realPublishWorker,
    sweepPrevious = realSweepPrevious
}) =>
{
    if (exec('docker', ['info']).status !== 0)
    {
        log('Docker indisponível; nova tentativa em 60 s');

        return readState(stateFile);
    }

    const fetched = exec('git', ['fetch', 'origin', 'main'], { cwd: root });
    const target = fetched.status === 0 ? exec('git', ['rev-parse', 'origin/main'], { cwd: root }) : fetched;

    if (target.status !== 0)
    {
        log('Não foi possível buscar origin/main; nova tentativa em 60 s');

        return readState(stateFile);
    }

    const hash = target.stdout.trim();

    //  One deploy at a time: a commit that lands meanwhile waits for the next poll
    if (!acquireLock(lockFile))
    {
        return readState(stateFile);
    }

    try
    {
        let state = readState(stateFile);

        //  First start with no state: what runs now is origin/main in blue (publish.sh started it), nothing to deploy
        if (!state)
        {
            state = { active: { slot: 'blue', commit: hash }, previous: null, handled: hash, tunnel: null };
            writeState(stateFile, state);

            return state;
        }

        const swept = sweepPrevious({ exec, root, state, now, log });

        if (swept !== state)
        {
            state = swept;
            writeState(stateFile, state);
        }

        //  A rollback leaves handled alone, so the commit rolled back from is not deployed again
        if (hash === state.handled)
        {
            return state;
        }

        //  The whole range since handled decides; only its newest commit is deployed
        const { backend, game } = classify(changedFiles(exec, state.handled, hash));
        let backendOk = true;

        if (backend)
        {
            const result = await deployBackend({ exec, fetch, root, state, hash, log, sleep, now });
            backendOk = result.ok;
            state = result.state;
            writeState(stateFile, state);
        }

        if (game && backendOk)
        {
            publishWorker({ exec, root, hash, tunnel: state.tunnel, log });
        }

        state = { ...state, handled: hash };
        writeState(stateFile, state);

        return state;
    }
    finally
    {
        releaseLock(lockFile);
    }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    if (!process.env.JWT_SECRET)
    {
        console.log('Defina JWT_SECRET antes de iniciar o watcher (o publish.sh exporta)');
        process.exit(1);
    }

    const root = dirname(dirname(fileURLToPath(import.meta.url)));
    const log = (line) => console.log(`${new Date().toISOString()} ${line}`);
    const deps = {
        exec: run,
        fetch: globalThis.fetch,
        root,
        stateFile: join(root, '.deploy-state'),
        lockFile: join(root, '.deploy.lock'),
        log,
        sleep: wait,
        now: Date.now
    };

    for (;;)
    {
        try
        {
            await tick(deps);
        }
        catch (error)
        {
            log(`Falha no watcher: ${error.message}; nova tentativa em 60 s`);
        }

        await wait(POLL_MS);
    }
}
