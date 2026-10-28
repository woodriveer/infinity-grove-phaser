import { test } from 'node:test';
import assert from 'node:assert/strict';
import { run } from './run.mjs';

test('returns the status and the stdout of the command', () =>
{
    const result = run(process.execPath, ['-e', 'process.stdout.write("hello")']);

    assert.equal(result.status, 0);
    assert.equal(result.stdout, 'hello');
});

test('returns a non-zero status and the stderr', () =>
{
    const result = run(process.execPath, ['-e', 'process.stderr.write("bad"); process.exit(3)']);

    assert.equal(result.status, 3);
    assert.equal(result.stderr, 'bad');
});

test('a command that does not exist has a non-zero status', () =>
{
    const result = run('infinity-grove-no-such-command', []);

    assert.equal(result.status, 1);
});

test('pipes input to stdin, also as a buffer', () =>
{
    const echo = ['-e', 'process.stdin.pipe(process.stdout)'];

    assert.equal(run(process.execPath, echo, { input: 'piped text' }).stdout, 'piped text');

    const bytes = Buffer.from([0, 255, 1, 128]);
    const result = run(process.execPath, echo, { input: bytes, encoding: 'buffer' });

    assert.deepEqual(result.stdout, bytes);
});

test('merges env over process.env', () =>
{
    const result = run(process.execPath, ['-e', 'process.stdout.write(process.env.DEPLOY_TEST_VAR + " " + (process.env.PATH ? "path" : "no path"))'], {
        env: { DEPLOY_TEST_VAR: 'set' }
    });

    assert.equal(result.stdout, 'set path');
});

test('runs in the given cwd', () =>
{
    const dir = process.platform === 'win32' ? process.env.SystemRoot : '/';
    const result = run(process.execPath, ['-e', 'process.stdout.write(process.cwd())'], { cwd: dir });

    assert.equal(result.stdout.toLowerCase(), dir.toLowerCase());
});
