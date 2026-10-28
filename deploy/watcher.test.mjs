import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readState, writeState } from './lib/state.mjs';
import { tick } from './watcher.mjs';

const HANDLED = 'aaaaaaa1111111111111111111111111111111111';
const MIDDLE = 'bbbbbbb2222222222222222222222222222222222';
const TARGET = 'ccccccc3333333333333333333333333333333333';
const TUNNEL = 'https://abc.trycloudflare.com';
const STATE = { active: { slot: 'blue', commit: HANDLED }, previous: null, handled: HANDLED, tunnel: TUNNEL };

//  The machine: docker and git answer from the options; deploy, publish and sweep are recorded fakes
const machine = ({ docker = true, fetch = true, target = TARGET, files = ['README.md'], deployOk = true, state = STATE, lockTaken = false } = {}) =>
{
    const dir = mkdtempSync(join(tmpdir(), 'deploy-watcher-'));
    const stateFile = join(dir, '.deploy-state');
    const lockFile = join(dir, '.deploy.lock');
    const events = [];
    const lines = [];

    if (state)
    {
        writeState(stateFile, state);
    }

    if (lockTaken)
    {
        writeFileSync(lockFile, '1\n');
    }

    const exec = (command, args) =>
    {
        const line = [command, ...args].join(' ');
        events.push(line);

        if (line === 'docker info')
        {
            return { status: docker ? 0 : 1, stdout: '', stderr: '' };
        }

        if (line === 'git fetch origin main')
        {
            return { status: fetch ? 0 : 128, stdout: '', stderr: '' };
        }

        if (line === 'git rev-parse origin/main')
        {
            return { status: 0, stdout: `${target}\n`, stderr: '' };
        }

        if (line.startsWith('git diff --name-only'))
        {
            return { status: 0, stdout: `${files.join('\n')}\n`, stderr: '' };
        }

        return { status: 0, stdout: '', stderr: '' };
    };

    const deps = {
        exec,
        fetch: async () => ({ status: 401 }),
        root: '/repo',
        stateFile,
        lockFile,
        log: (line) => lines.push(line),
        sleep: async () => {},
        now: () => 5_000_000,
        sweepPrevious: ({ state: current }) =>
        {
            events.push('sweep');

            return current;
        },
        deployBackend: async ({ state: current, hash }) =>
        {
            events.push(`deploy ${hash} lock=${existsSync(lockFile)}`);
            const next = deployOk
                ? { ...current, active: { slot: 'green', commit: hash }, previous: { slot: 'blue', commit: current.active.commit, stoppedAt: 1 }, handled: hash }
                : { ...current, handled: hash };

            return { ok: deployOk, state: next };
        },
        publishWorker: ({ hash, tunnel }) =>
        {
            events.push(`publish ${hash} ${tunnel}`);

            return true;
        }
    };

    return { deps, events, lines, stateFile, lockFile };
};

const acted = (events) => events.filter((event) => /^(deploy|publish|sweep)/.test(event));

test('Docker down logs its text and changes nothing', async () =>
{
    const { deps, events, lines, stateFile } = machine({ docker: false });

    await tick(deps);

    assert.deepEqual(lines, ['Docker indisponível; nova tentativa em 60 s']);
    assert.deepEqual(events, ['docker info']);
    assert.deepEqual(readState(stateFile), STATE);
});

test('a failed fetch logs its text and changes nothing', async () =>
{
    const { deps, events, lines, stateFile } = machine({ fetch: false });

    await tick(deps);

    assert.deepEqual(lines, ['Não foi possível buscar origin/main; nova tentativa em 60 s']);
    assert.deepEqual(acted(events), []);
    assert.deepEqual(readState(stateFile), STATE);
});

test('the same target does nothing but sweep', async () =>
{
    const { deps, events, stateFile } = machine({ target: HANDLED });

    await tick(deps);

    assert.deepEqual(acted(events), ['sweep']);
    assert.equal(events.some((event) => event.startsWith('git diff')), false);
    assert.deepEqual(readState(stateFile), STATE);
});

test('the sweep result is saved', async () =>
{
    const { deps, stateFile } = machine({
        target: HANDLED,
        state: { ...STATE, previous: { slot: 'green', commit: MIDDLE, stoppedAt: 0 } }
    });
    deps.sweepPrevious = ({ state }) => ({ ...state, previous: null });

    await tick(deps);

    assert.equal(readState(stateFile).previous, null);
});

test('a README-only range sets handled with no build and no Worker', async () =>
{
    const { deps, events, stateFile } = machine({ files: ['README.md'] });

    await tick(deps);

    assert.deepEqual(acted(events), ['sweep']);
    assert.deepEqual(readState(stateFile), { ...STATE, handled: TARGET });
});

test('a backend range deploys the target and saves the deploy state', async () =>
{
    const { deps, events, stateFile } = machine({ files: ['backend/src/main/kotlin/A.kt'] });

    await tick(deps);

    assert.deepEqual(acted(events), ['sweep', `deploy ${TARGET} lock=true`]);
    assert.deepEqual(readState(stateFile), {
        active: { slot: 'green', commit: TARGET },
        previous: { slot: 'blue', commit: HANDLED, stoppedAt: 1 },
        handled: TARGET,
        tunnel: TUNNEL
    });
});

test('a game range publishes the Worker of the target through the tunnel', async () =>
{
    const { deps, events, stateFile } = machine({ files: ['game/src/a.js'] });

    await tick(deps);

    assert.deepEqual(acted(events), ['sweep', `publish ${TARGET} ${TUNNEL}`]);
    assert.deepEqual(readState(stateFile), { ...STATE, handled: TARGET });
});

test('a mixed range publishes the Worker after a passed deploy', async () =>
{
    const { deps, events } = machine({ files: ['backend/build.gradle.kts', 'game/src/a.js'] });

    await tick(deps);

    assert.deepEqual(acted(events), ['sweep', `deploy ${TARGET} lock=true`, `publish ${TARGET} ${TUNNEL}`]);
});

test('a mixed range does not publish the Worker after a failed deploy, and the commit is handled', async () =>
{
    const { deps, events, stateFile } = machine({ files: ['backend/build.gradle.kts', 'game/src/a.js'], deployOk: false });

    await tick(deps);

    assert.deepEqual(acted(events), ['sweep', `deploy ${TARGET} lock=true`]);
    assert.deepEqual(readState(stateFile), { ...STATE, handled: TARGET });
});

test('a taken lock skips the tick and leaves the lock to its owner', async () =>
{
    const { deps, events, stateFile, lockFile } = machine({ files: ['backend/a.kt'], lockTaken: true });

    await tick(deps);

    assert.deepEqual(acted(events), []);
    assert.deepEqual(readState(stateFile), STATE);
    assert.equal(existsSync(lockFile), true);
});

test('two commits since handled deploy only the newest, over the whole range', async () =>
{
    const { deps, events } = machine({ files: ['backend/a.kt'] });

    await tick(deps);

    assert.deepEqual(events.filter((event) => event.startsWith('git diff')), [`git diff --name-only ${HANDLED} ${TARGET}`]);
    assert.deepEqual(events.filter((event) => event.startsWith('deploy')), [`deploy ${TARGET} lock=true`]);
    assert.equal(events.some((event) => event.includes(MIDDLE)), false);
});

test('the lock is released on every path', async () =>
{
    const paths = [
        { target: HANDLED },
        { files: ['README.md'] },
        { files: ['backend/a.kt'] },
        { files: ['backend/a.kt', 'game/src/a.js'], deployOk: false },
        { state: null }
    ];

    for (const options of paths)
    {
        const { deps, lockFile } = machine(options);

        await tick(deps);

        assert.equal(existsSync(lockFile), false, JSON.stringify(options));
    }

    const { deps, lockFile } = machine({ files: ['backend/a.kt'] });
    deps.deployBackend = async () =>
    {
        throw new Error('docker exploded');
    };

    await assert.rejects(tick(deps), /docker exploded/);
    assert.equal(existsSync(lockFile), false);
});

test('a first start with no state records origin/main as handled and blue as active, without deploying', async () =>
{
    const { deps, events, stateFile } = machine({ state: null, files: ['backend/a.kt'] });

    await tick(deps);

    assert.deepEqual(acted(events), []);
    assert.deepEqual(readState(stateFile), {
        active: { slot: 'blue', commit: TARGET },
        previous: null,
        handled: TARGET,
        tunnel: null
    });
});
