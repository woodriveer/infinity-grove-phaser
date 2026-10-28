//  The manual entry: ./deploy.sh --rollback brings back the previous slot, under the same lock as the watcher
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { rollback } from './lib/previous.mjs';
import { run } from './lib/run.mjs';
import { acquireLock, readState, releaseLock, writeState } from './lib/state.mjs';

export const main = async (args, { exec, fetch, root, stateFile, lockFile, log, sleep, now }) =>
{
    if (args.length !== 1 || args[0] !== '--rollback')
    {
        log('Uso: ./deploy.sh --rollback');

        return 1;
    }

    if (!acquireLock(lockFile))
    {
        log('Um deploy está em andamento; tente de novo em instantes');

        return 1;
    }

    try
    {
        const state = readState(stateFile);

        if (!state)
        {
            log('Sem versão anterior para voltar (removida após 5 min)');

            return 1;
        }

        const result = await rollback({ exec, fetch, root, state, log, sleep, now });

        if (result.ok)
        {
            writeState(stateFile, result.state);
        }

        return result.ok ? 0 : 1;
    }
    finally
    {
        releaseLock(lockFile);
    }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    const root = dirname(dirname(fileURLToPath(import.meta.url)));

    process.exit(await main(process.argv.slice(2), {
        exec: run,
        fetch: globalThis.fetch,
        root,
        stateFile: join(root, '.deploy-state'),
        lockFile: join(root, '.deploy.lock'),
        log: console.log,
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        now: Date.now
    }));
}
