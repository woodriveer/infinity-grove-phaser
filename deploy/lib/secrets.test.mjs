import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDatabaseEnv } from './databaseEnv.mjs';
import { parseDotenv } from './dotenv.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });

const trackedFiles = () => git(['ls-files']).stdout.split(/\r?\n/).filter((file) => file !== '');

test('.env is ignored by git', () =>
{
    assert.equal(git(['check-ignore', '-q', '.env']).status, 0);
});

test('backups are ignored by git', () =>
{
    assert.equal(git(['check-ignore', '-q', 'backups/infinity_grove-20261115T000000Z.dump']).status, 0);
});

test('the tracked env files are the example and the game build modes', () =>
{
    const envFiles = trackedFiles().filter((file) => /(^|\/)\.env(\.|$)/.test(file)).sort();

    assert.deepEqual(envFiles, ['.env.example', 'game/.env.development', 'game/.env.pages', 'game/.env.production', 'game/.env.staging']);
});

test('no game env file names a datasource variable', () =>
{
    for (const file of trackedFiles().filter((tracked) => /^game\/\.env\..+/.test(tracked)))
    {
        assert.equal(readFileSync(join(ROOT, file), 'utf8').includes('SPRING_DATASOURCE'), false, file);
    }
});

test('.env.example passes the database check in local mode', () =>
{
    assert.deepEqual(
        checkDatabaseEnv(parseDotenv(readFileSync(join(ROOT, '.env.example'), 'utf8'))),
        { ok: true, mode: 'local', errors: [] }
    );
});

test('.env.example carries no Supabase password', () =>
{
    const lines = readFileSync(join(ROOT, '.env.example'), 'utf8').split(/\r?\n/);

    assert.ok(lines.includes('# SPRING_DATASOURCE_PASSWORD=<database password: letters and digits only>'));
    assert.equal(parseDotenv(readFileSync(join(ROOT, '.env.example'), 'utf8')).SPRING_DATASOURCE_PASSWORD, 'infinity');
});

test('.env.example names the copy and gcloud secrets create, not env_file, the slots or Fly', () =>
{
    const text = readFileSync(join(ROOT, '.env.example'), 'utf8');

    assert.ok(text.includes('deploy/db/copyToSupabase.mjs'));
    assert.ok(text.includes('gcloud secrets create'));

    for (const word of ['env_file', 'slot', 'fly.io', 'fly secrets'])
    {
        assert.equal(text.toLowerCase().includes(word), false, word);
    }
});
