import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { publishWorker } from './workerPublish.mjs';

const HASH = 'ccccccc3333333333333333333333333333333333';
const ROOT = '/repo';
const TUNNEL = 'https://abc.trycloudflare.com';

//  A fake exec: git archive writes the tar it is told to, tar unpacks a game tree (with a package-lock.json unless told not to);
//  a command matching a failing pattern exits 1
const fakeExec = (failing = [], { lock = true } = {}) =>
{
    const calls = [];
    const exec = (command, args, options = {}) =>
    {
        calls.push({ line: [command, ...args].join(' '), options });

        if (command === 'git')
        {
            const output = args.find((arg) => arg.startsWith('--output=')).slice('--output='.length);
            writeFileSync(output, 'tar');
        }

        if (command === 'tar')
        {
            mkdirSync(join(options.cwd, 'game'));
            writeFileSync(join(options.cwd, 'game', 'package.json'), '{}');

            if (lock)
            {
                writeFileSync(join(options.cwd, 'game', 'package-lock.json'), '{}');
            }
        }

        return { status: failing.some((pattern) => calls.at(-1).line.includes(pattern)) ? 1 : 0, stdout: '', stderr: '' };
    };

    return { exec, calls };
};

const publish = (exec) =>
{
    const lines = [];
    const ok = publishWorker({ exec, root: ROOT, hash: HASH, tunnel: TUNNEL, log: (line) => lines.push(line) });

    return { ok, lines };
};

test('it extracts the commit game tree into a temp dir, then runs npm ci and npm run deploy there with BACKEND_URL', () =>
{
    const { exec, calls } = fakeExec();

    const { ok, lines } = publish(exec);

    assert.equal(ok, true);
    assert.deepEqual(lines, []);

    const tar = calls[0].line.match(/--output=(\S+)/)[1];
    const dir = dirname(tar);
    assert.equal(calls[0].line, `git archive --format=tar --output=${join(dir, 'game.tar')} ${HASH} game`);
    assert.equal(calls[0].options.cwd, ROOT);
    assert.deepEqual(calls.slice(1).map((call) => [call.line, call.options.cwd]), [
        ['tar -xf game.tar', dir],
        ['npm ci', join(dir, 'game')],
        ['npm run deploy', join(dir, 'game')]
    ]);
    assert.equal(calls[2].options.shell, true);
    assert.deepEqual(calls[3].options.env, { BACKEND_URL: TUNNEL });
    assert.equal(calls[3].options.shell, true);
    assert.equal(existsSync(dir), false);
});

for (const step of ['git archive', 'tar -xf', 'npm ci', 'npm run deploy'])
{
    test(`a failed ${step} logs the Worker failure, stops there and removes the dir`, () =>
    {
        const { exec, calls } = fakeExec([step]);

        const { ok, lines } = publish(exec);

        assert.equal(ok, false);
        assert.deepEqual(lines, ['Publicação do Worker ccccccc falhou']);
        assert.equal(calls.at(-1).line.includes(step), true);
        assert.equal(existsSync(dirname(calls[0].line.match(/--output=(\S+)/)[1])), false);
    });
}

//  game/package-lock.json is gitignored, so a commit tree usually has none and npm ci would refuse to run
test('a commit tree with no package-lock.json installs with npm install', () =>
{
    const { exec, calls } = fakeExec([], { lock: false });

    const { ok } = publish(exec);

    assert.equal(ok, true);
    assert.deepEqual(calls.slice(2).map((call) => call.line), ['npm install', 'npm run deploy']);
    assert.equal(calls[2].options.shell, true);
});
