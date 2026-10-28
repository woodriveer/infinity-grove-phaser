import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changedFiles, classify } from './changes.mjs';

test('a backend file is backend only', () =>
{
    assert.deepEqual(classify(['backend/src/main/kotlin/App.kt']), { backend: true, game: false });
});

test('game source and the worker config are game only', () =>
{
    assert.deepEqual(classify(['game/src/a.js']), { backend: false, game: true });
    assert.deepEqual(classify(['game/wrangler.jsonc']), { backend: false, game: true });
});

test('every publish.sh game path counts as game', () =>
{
    const paths = [
        'game/public/style.css',
        'game/worker/index.js',
        'game/index.html',
        'game/vite.config.js',
        'game/package.json',
        'game/scripts/deploy.mjs',
        'game/.env',
        'game/.env.pages',
        'game/.env.production'
    ];

    for (const path of paths)
    {
        assert.deepEqual(classify([path]), { backend: false, game: true }, path);
    }
});

test('game tests, e2e files and the readme are neither', () =>
{
    assert.deepEqual(classify(['game/src/a.test.js']), { backend: false, game: false });
    assert.deepEqual(classify(['game/e2e/x.js']), { backend: false, game: false });
    assert.deepEqual(classify(['README.md']), { backend: false, game: false });
});

test('a mixed list is both', () =>
{
    assert.deepEqual(classify(['README.md', 'backend/build.gradle.kts', 'game/src/a.js']), { backend: true, game: true });
});

test('changedFiles lists the names git diff gives for the range', () =>
{
    const calls = [];
    const exec = (command, args) =>
    {
        calls.push([command, ...args]);

        return { status: 0, stdout: 'backend/a.kt\ngame/src/b.js\n', stderr: '' };
    };

    assert.deepEqual(changedFiles(exec, 'aaa', 'bbb'), ['backend/a.kt', 'game/src/b.js']);
    assert.deepEqual(calls, [['git', 'diff', '--name-only', 'aaa', 'bbb']]);
});

test('changedFiles fails when git diff fails', () =>
{
    const exec = () => ({ status: 128, stdout: '', stderr: 'bad revision' });

    assert.throws(() => changedFiles(exec, 'aaa', 'bbb'), /bad revision/);
});
