import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { LOCAL_CONTAINER, LOCAL_TARGET, NETWORK, PROBE_IMAGE, SQL, filterRestoreList, pgEnv, pgRun, psql, supabaseTarget, toolImage } from './pgTools.mjs';

const ROOT = '/repo';

const SUPABASE = {
    SPRING_DATASOURCE_URL: 'jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
    SPRING_DATASOURCE_USERNAME: 'postgres.jnqlrdnwwqslihncszej',
    SPRING_DATASOURCE_PASSWORD: 'Fake0Password1ForTests'
};

const VARS = SUPABASE;

//  A fake exec that records every call and answers an empty success
const fakeExec = () =>
{
    const calls = [];
    const exec = (command, args, options = {}) =>
    {
        calls.push({ command, args, options });

        return { status: 0, stdout: '', stderr: '' };
    };

    return { exec, calls };
};

test('the tool image follows the Supabase major', () =>
{
    assert.equal(toolImage(17), 'postgres:17');
    assert.equal(toolImage(18), 'postgres:18');
});

test('supabaseTarget reads host, port, database and sslmode from the URL', () =>
{
    assert.deepEqual(supabaseTarget(VARS), {
        host: 'aws-0-sa-east-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.jnqlrdnwwqslihncszej',
        password: 'Fake0Password1ForTests',
        sslmode: 'require'
    });
});

test('pgEnv maps a Supabase target to the libpq variables', () =>
{
    assert.deepEqual(pgEnv(supabaseTarget(VARS)), {
        PGHOST: 'aws-0-sa-east-1.pooler.supabase.com',
        PGPORT: '5432',
        PGDATABASE: 'postgres',
        PGUSER: 'postgres.jnqlrdnwwqslihncszej',
        PGPASSWORD: 'Fake0Password1ForTests',
        PGSSLMODE: 'require'
    });
});

test('pgEnv maps the local target', () =>
{
    assert.deepEqual(pgEnv(LOCAL_TARGET), {
        PGHOST: 'postgres',
        PGPORT: '5432',
        PGDATABASE: 'infinity_grove',
        PGUSER: 'infinity',
        PGPASSWORD: 'infinity',
        PGSSLMODE: 'disable'
    });
});

test('pgRun passes every connection value by name, never as an argument', () =>
{
    const { exec, calls } = fakeExec();

    pgRun(exec, ROOT, { image: 'postgres:17', target: supabaseTarget(VARS), command: ['psql', '-c', 'select 1'] });

    const [{ args, options }] = calls;

    assert.deepEqual(args, [
        'run', '--rm', '--network', 'backend_default',
        '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGDATABASE', '-e', 'PGUSER', '-e', 'PGPASSWORD', '-e', 'PGSSLMODE',
        'postgres:17', 'psql', '-c', 'select 1'
    ]);
    assert.equal(args.some((arg) => arg.includes('Fake0Password1ForTests')), false);
    assert.equal(options.env.PGPASSWORD, 'Fake0Password1ForTests');
    assert.equal(options.cwd, ROOT);
});

test('pgRun mounts backups only when asked', () =>
{
    const mounted = fakeExec();
    const plain = fakeExec();

    pgRun(mounted.exec, ROOT, { image: 'postgres:17', target: LOCAL_TARGET, mount: true, command: ['pg_dump'] });
    pgRun(plain.exec, ROOT, { image: 'postgres:17', target: LOCAL_TARGET, command: ['psql', '-c', 'select 1'] });

    const mountedArgs = mounted.calls[0].args;
    const at = mountedArgs.indexOf('postgres:17');

    assert.deepEqual(mountedArgs.slice(at - 2, at), ['-v', `${join(ROOT, 'backups')}:/backups`]);
    assert.equal(plain.calls[0].args.includes('-v'), false);
});

test('psql runs one command with ON_ERROR_STOP, tuples only and unaligned', () =>
{
    const { exec, calls } = fakeExec();

    psql(exec, ROOT, 'postgres:17', LOCAL_TARGET, 'select 1');

    const args = calls[0].args;

    assert.deepEqual(args.slice(args.indexOf('postgres:17') + 1), ['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', 'select 1']);
});

test('the local target and constants name the compose postgres', () =>
{
    assert.deepEqual(LOCAL_TARGET, { host: 'postgres', port: 5432, database: 'infinity_grove', user: 'infinity', password: 'infinity', sslmode: 'disable' });
    assert.equal(NETWORK, 'backend_default');
    assert.equal(PROBE_IMAGE, 'postgres:17');
    assert.equal(LOCAL_CONTAINER, 'infinity-grove-postgres');
});

test('filterRestoreList drops the public schema entry and its comment', () =>
{
    const input = [
        ';',
        '; Archive created at 2026-11-15 14:30:00 UTC',
        '5; 2615 2200 SCHEMA - public pg_database_owner',
        '4180; 0 0 COMMENT - SCHEMA public pg_database_owner',
        '218; 1259 16385 TABLE public users infinity',
        ''
    ].join('\n');

    assert.equal(filterRestoreList(input), [
        ';',
        '; Archive created at 2026-11-15 14:30:00 UTC',
        '218; 1259 16385 TABLE public users infinity',
        ''
    ].join('\n'));
});

test('filterRestoreList keeps a list with no schema entry unchanged', () =>
{
    const list = '218; 1259 16385 TABLE public users infinity\n219; 1259 16390 TABLE public wallets infinity\n';

    assert.equal(filterRestoreList(list), list);
});

test('no SQL names a schema other than public', () =>
{
    for (const sql of Object.values(SQL))
    {
        assert.equal(/\b(auth|storage|extensions|realtime|graphql|graphql_public|vault|pgsodium|cron|net|supabase_\w+)\./.test(sql), false, sql);

        for (const match of sql.matchAll(/in schema (\w+)/g))
        {
            assert.equal(match[1], 'public', sql);
        }
    }
});

test('the default privileges are revoked for tables, sequences and functions', () =>
{
    assert.equal(SQL.revokeDefaults, 'alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role; alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role; alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role');
});

test('the existing grants are revoked on tables, sequences and functions', () =>
{
    assert.equal(SQL.revokeExisting, 'revoke all on all tables in schema public from anon, authenticated, service_role; revoke all on all sequences in schema public from anon, authenticated, service_role; revoke all on all functions in schema public from anon, authenticated, service_role');
});
