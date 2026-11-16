import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDatabaseEnv, jdbcParts, loadDatabaseEnv } from './databaseEnv.mjs';

const SUPABASE = {
    SPRING_DATASOURCE_URL: 'jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
    SPRING_DATASOURCE_USERNAME: 'postgres.jnqlrdnwwqslihncszej',
    SPRING_DATASOURCE_PASSWORD: 'Fake0Password1ForTests'
};

const LOCAL = {
    SPRING_DATASOURCE_URL: 'jdbc:postgresql://postgres:5432/infinity_grove',
    SPRING_DATASOURCE_USERNAME: 'infinity',
    SPRING_DATASOURCE_PASSWORD: 'infinity'
};

const pooler = (url) => ({ ...SUPABASE, SPRING_DATASOURCE_URL: url });

const POOLER_HOST = 'jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com';

test('a Session pooler config is ok in supabase mode', () =>
{
    assert.deepEqual(checkDatabaseEnv(SUPABASE), { ok: true, mode: 'supabase', errors: [] });
});

test('the compose postgres is ok in local mode', () =>
{
    assert.deepEqual(checkDatabaseEnv(LOCAL), { ok: true, mode: 'local', errors: [] });
});

test('another pooler index and region is ok', () =>
{
    assert.deepEqual(
        checkDatabaseEnv(pooler('jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require')),
        { ok: true, mode: 'supabase', errors: [] }
    );
});

test('sslmode verify-ca is accepted', () =>
{
    assert.deepEqual(
        checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/postgres?sslmode=verify-ca`)),
        { ok: true, mode: 'supabase', errors: [] }
    );
});

test('sslmode verify-full is accepted', () =>
{
    assert.deepEqual(
        checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/postgres?sslmode=verify-full`)),
        { ok: true, mode: 'supabase', errors: [] }
    );
});

test('every missing variable is named in order', () =>
{
    assert.deepEqual(checkDatabaseEnv({}), {
        ok: false,
        mode: null,
        errors: ['falta SPRING_DATASOURCE_URL no .env', 'falta SPRING_DATASOURCE_USERNAME no .env', 'falta SPRING_DATASOURCE_PASSWORD no .env']
    });
});

test('an empty value counts as missing', () =>
{
    assert.deepEqual(checkDatabaseEnv({ ...SUPABASE, SPRING_DATASOURCE_PASSWORD: '' }), {
        ok: false,
        mode: 'supabase',
        errors: ['falta SPRING_DATASOURCE_PASSWORD no .env']
    });
});

test('port 6543 is the Transaction pooler', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:6543/postgres?sslmode=require`)), {
        ok: false,
        mode: 'supabase',
        errors: ['a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)']
    });
});

test('another port is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:5433/postgres?sslmode=require`)), {
        ok: false,
        mode: 'supabase',
        errors: ['o Session pooler do Supabase usa a porta 5432, não 5433']
    });
});

test('the direct connection is IPv6 only', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler('jdbc:postgresql://db.jnqlrdnwwqslihncszej.supabase.co:5432/postgres?sslmode=require')), {
        ok: false,
        mode: null,
        errors: ['a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)']
    });
});

test('a pooler URL without sslmode is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/postgres`)), {
        ok: false,
        mode: 'supabase',
        errors: ['SPRING_DATASOURCE_URL precisa de sslmode=require']
    });
});

test('sslmode disable is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/postgres?sslmode=disable`)), {
        ok: false,
        mode: 'supabase',
        errors: ['SPRING_DATASOURCE_URL precisa de sslmode=require']
    });
});

test('the Supabase database is postgres', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/infinity_grove?sslmode=require`)), {
        ok: false,
        mode: 'supabase',
        errors: ['o banco do Supabase se chama postgres, não infinity_grove']
    });
});

test('the pooler user carries the project ref', () =>
{
    assert.deepEqual(checkDatabaseEnv({ ...SUPABASE, SPRING_DATASOURCE_USERNAME: 'postgres' }), {
        ok: false,
        mode: 'supabase',
        errors: ['SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej']
    });
});

test('a password in the URL is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/postgres?sslmode=require&password=x`)), {
        ok: false,
        mode: 'supabase',
        errors: ['SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD']
    });
});

test('a user in the URL is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler(`${POOLER_HOST}:5432/postgres?sslmode=require&user=postgres`)), {
        ok: false,
        mode: 'supabase',
        errors: ['SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD']
    });
});

test('a non-JDBC URL is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler('postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require')), {
        ok: false,
        mode: null,
        errors: ['SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>']
    });
});

test('an unknown host is refused', () =>
{
    assert.deepEqual(checkDatabaseEnv(pooler('jdbc:postgresql://localhost:5432/postgres?sslmode=require')), {
        ok: false,
        mode: null,
        errors: ['o host localhost não é o Session pooler do Supabase nem o postgres local']
    });
});

for (const [label, c] of [['space', ' '], ['tab', '\t'], ['#', '#'], ['$', '$'], ['double quote', '"'], ['single quote', "'"], ['backtick', '`'], ['backslash', '\\']])
{
    test(`the password refuses a ${label}`, () =>
    {
        assert.deepEqual(checkDatabaseEnv({ ...SUPABASE, SPRING_DATASOURCE_PASSWORD: `Fake0${c}Password` }), {
            ok: false, mode: 'supabase', errors: ['SPRING_DATASOURCE_PASSWORD contém espaço, #, $, aspas ou barra invertida']
        });
    });
}

test('the user name refuses a #', () =>
{
    const result = checkDatabaseEnv({ ...SUPABASE, SPRING_DATASOURCE_USERNAME: 'postgres.jnqlrdnwwqslihncszej#' });

    assert.ok(result.errors.includes('SPRING_DATASOURCE_USERNAME contém espaço, #, $, aspas ou barra invertida'));
});

test('the URL refuses a space', () =>
{
    const result = checkDatabaseEnv({ ...SUPABASE, SPRING_DATASOURCE_URL: `${SUPABASE.SPRING_DATASOURCE_URL} ` });

    assert.ok(result.errors.includes('SPRING_DATASOURCE_URL contém espaço, #, $, aspas ou barra invertida'));
});

test('no message carries the password', () =>
{
    const cases = [
        { ...SUPABASE, SPRING_DATASOURCE_PASSWORD: 'Secret#1' },
        { ...pooler(`${POOLER_HOST}:6543/x`), SPRING_DATASOURCE_PASSWORD: 'Secret1' }
    ];

    for (const vars of cases)
    {
        for (const message of checkDatabaseEnv(vars).errors)
        {
            assert.ok(!message.includes('Secret'), message);
        }
    }
});

test('loadDatabaseEnv names a missing .env', () =>
{
    assert.deepEqual(loadDatabaseEnv(mkdtempSync(join(tmpdir(), 'dbenv-'))), {
        ok: false,
        mode: null,
        errors: ['arquivo .env não encontrado na raiz do repositório']
    });
});

test('loadDatabaseEnv reads the .env of the root', () =>
{
    const root = mkdtempSync(join(tmpdir(), 'dbenv-'));
    writeFileSync(join(root, '.env'), Object.entries(SUPABASE).map(([name, value]) => `${name}=${value}\n`).join(''));

    assert.deepEqual(loadDatabaseEnv(root), { ok: true, mode: 'supabase', errors: [] });
});

test('jdbcParts reads host, port, database and lower-cased params', () =>
{
    assert.deepEqual(jdbcParts('jdbc:postgresql://postgres:5432/infinity_grove?SSLMode=require&x'), {
        host: 'postgres',
        port: 5432,
        database: 'infinity_grove',
        params: { sslmode: 'require', x: '' }
    });
});
