import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from './deploy.mjs';
import { renderConf } from './lib/proxy.mjs';
import { readState, writeState } from './lib/state.mjs';

const OLD = 'aaaaaaa1111111111111111111111111111111111';
const NEW = 'bbbbbbb2222222222222222222222222222222222';
const STATE = {
    active: { slot: 'green', commit: NEW },
    previous: { slot: 'blue', commit: OLD, stoppedAt: 1000 },
    handled: NEW,
    tunnel: 'https://abc.trycloudflare.com'
};

//  A repo root with the state, the proxy conf and a docker that has (or has not) the previous container
const machine = ({ state = STATE, previousContainer = true, lockTaken = false } = {}) =>
{
    const root = mkdtempSync(join(tmpdir(), 'deploy-main-'));
    mkdirSync(join(root, 'deploy', 'nginx'), { recursive: true });
    writeFileSync(join(root, 'deploy', 'nginx', 'default.conf'), renderConf('green'));
    const stateFile = join(root, '.deploy-state');
    const lockFile = join(root, '.deploy.lock');
    const lines = [];
    const calls = [];

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
        calls.push(line);

        return { status: line.includes('container inspect') && !previousContainer ? 1 : 0, stdout: '', stderr: '' };
    };

    const deps = {
        exec,
        fetch: async () => ({ status: 401 }),
        root,
        stateFile,
        lockFile,
        log: (line) => lines.push(line),
        sleep: async () => {},
        now: () => 2000
    };

    return { deps, lines, calls, stateFile, lockFile };
};

test('--rollback saves the new state and exits 0', async () =>
{
    const { deps, lines, stateFile, lockFile } = machine();

    assert.equal(await main(['--rollback'], deps), 0);
    assert.deepEqual(lines, ['Rollback para aaaaaaa no slot blue']);
    assert.deepEqual(readState(stateFile), {
        active: { slot: 'blue', commit: OLD },
        previous: { slot: 'green', commit: NEW, stoppedAt: 2000 },
        handled: NEW,
        tunnel: 'https://abc.trycloudflare.com'
    });
    assert.equal(existsSync(lockFile), false);
});

test('with no previous slot it exits 1 and keeps the state', async () =>
{
    const { deps, lines, stateFile, lockFile } = machine({ previousContainer: false });

    assert.equal(await main(['--rollback'], deps), 1);
    assert.deepEqual(lines, ['Sem versão anterior para voltar (removida após 5 min)']);
    assert.deepEqual(readState(stateFile), STATE);
    assert.equal(existsSync(lockFile), false);
});

test('with no state at all it exits 1 with the same text', async () =>
{
    const { deps, lines } = machine({ state: null });

    assert.equal(await main(['--rollback'], deps), 1);
    assert.deepEqual(lines, ['Sem versão anterior para voltar (removida após 5 min)']);
});

test('with the lock taken it exits 1 with its text, touches nothing and leaves the lock', async () =>
{
    const { deps, lines, calls, stateFile, lockFile } = machine({ lockTaken: true });

    assert.equal(await main(['--rollback'], deps), 1);
    assert.deepEqual(lines, ['Um deploy está em andamento; tente de novo em instantes']);
    assert.deepEqual(calls, []);
    assert.deepEqual(readState(stateFile), STATE);
    assert.equal(existsSync(lockFile), true);
});

for (const args of [['--force'], [], ['--rollback', 'extra']])
{
    test(`the arguments ${JSON.stringify(args)} print the usage and exit 1`, async () =>
    {
        const { deps, lines, calls } = machine();

        assert.equal(await main(args, deps), 1);
        assert.deepEqual(lines, ['Uso: ./deploy.sh --rollback']);
        assert.deepEqual(calls, []);
    });
}

test('the CLI exits 1 with the usage on an unknown flag', async () =>
{
    const script = fileURLToPath(new URL('./deploy.mjs', import.meta.url));
    const { code, stdout } = await new Promise((resolve) =>
    {
        execFile(process.execPath, [script, '--nope'], (error, out) => resolve({ code: error ? error.code : 0, stdout: out }));
    });

    assert.equal(code, 1);
    assert.equal(stdout, 'Uso: ./deploy.sh --rollback\n');
});
