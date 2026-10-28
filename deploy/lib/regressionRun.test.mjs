import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runRegression } from './regressionRun.mjs';

const HASH = '0123456789abcdef0123456789abcdef01234567';

//  A repo root whose working tree holds its own copy of the suite
const repo = () =>
{
    const root = mkdtempSync(join(tmpdir(), 'deploy-regression-root-'));
    mkdirSync(join(root, 'deploy'));
    writeFileSync(join(root, 'deploy', 'regression.mjs'), '// working tree suite\n');

    return root;
};

//  A fake exec: git show answers the commit's suite (or fails), docker run records the suite it was given through the mount
const fakeExec = ({ shown = '// commit suite\n', dockerStatus = 0 } = {}) =>
{
    const calls = [];
    const seen = {};
    const exec = (command, args, options = {}) =>
    {
        calls.push({ command, args, options });

        if (command === 'git')
        {
            return shown === null
                ? { status: 128, stdout: Buffer.alloc(0), stderr: 'fatal: path does not exist' }
                : { status: 0, stdout: Buffer.from(shown), stderr: '' };
        }

        const mount = args[args.indexOf('-v') + 1];
        seen.dir = mount.slice(0, mount.lastIndexOf(':/suite:ro'));
        seen.suite = readFileSync(join(seen.dir, 'regression.mjs'), 'utf8');

        return { status: dockerStatus, stdout: '', stderr: '' };
    };

    return { exec, calls, seen };
};

test('the suite comes from git show of the commit and runs in its named container on the compose network against the slot', () =>
{
    const root = repo();
    const { exec, calls, seen } = fakeExec();

    assert.equal(runRegression(exec, root, HASH, 'green'), true);

    assert.equal(calls[0].command, 'git');
    assert.deepEqual(calls[0].args, ['show', `${HASH}:deploy/regression.mjs`]);
    assert.equal(calls[0].options.cwd, root);
    assert.equal(seen.suite, '// commit suite\n');

    const run = calls[1];
    assert.equal(run.command, 'docker');
    assert.deepEqual(run.args, [
        'run', '--rm',
        '--name', 'infinity-grove-regression-0123456',
        '--network', 'backend_default',
        '-e', 'REGRESSION_COMMIT=0123456',
        '-v', `${seen.dir}:/suite:ro`,
        'node:22.19.0-alpine',
        'node', '/suite/regression.mjs', 'http://backend-green:8080'
    ]);
});

test('a commit without the suite falls back to the working tree file', () =>
{
    const root = repo();
    const { exec, seen } = fakeExec({ shown: null });

    assert.equal(runRegression(exec, root, HASH, 'blue'), true);
    assert.equal(seen.suite, '// working tree suite\n');
});

test('the blue slot is targeted by its internal name', () =>
{
    const { exec, calls } = fakeExec();

    runRegression(exec, repo(), HASH, 'blue');

    assert.equal(calls[1].args.at(-1), 'http://backend-blue:8080');
});

test('a non-zero status returns false', () =>
{
    const { exec } = fakeExec({ dockerStatus: 1 });

    assert.equal(runRegression(exec, repo(), HASH, 'green'), false);
});

test('the temp dir of the suite is removed after the run, passed or failed', () =>
{
    for (const dockerStatus of [0, 1])
    {
        const { exec, seen } = fakeExec({ dockerStatus });

        runRegression(exec, repo(), HASH, 'green');

        assert.equal(existsSync(seen.dir), false);
    }
});
