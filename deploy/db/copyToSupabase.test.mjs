import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check, copy, main, verify } from './copyToSupabase.mjs';
import { SQL } from './pgTools.mjs';

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

const PASSWORD = 'Fake0Password1ForTests';

//  A fake machine: the docker answers come from its options, every call is recorded, every line the CLI prints is kept
const machine = ({ vars = SUPABASE, containers = [], localRunning = true, version = '170004', versionStatus = 0, publicTables = '0', localCounts = 'users|3\n', remoteCounts = 'users|3\n', failing = [], list = '' } = {}) =>
{
    const root = mkdtempSync(join(tmpdir(), 'copy-'));
    const calls = [];
    const lines = [];

    const answerTool = (side, tool) =>
    {
        const none = { status: 0, stdout: '', stderr: '' };

        if (tool[0] === 'psql')
        {
            const sql = tool.at(-1);

            if (sql === SQL.version)
            {
                return { status: versionStatus, stdout: `${version}\n`, stderr: '' };
            }

            if (sql === SQL.tableCount)
            {
                return { status: 0, stdout: `${publicTables}\n`, stderr: '' };
            }

            if (sql === SQL.tableCounts)
            {
                return { status: failing.includes(`${side}Snapshot`) ? 2 : 0, stdout: side === 'local' ? localCounts : remoteCounts, stderr: '' };
            }

            if (sql === SQL.sequences)
            {
                return { status: 0, stdout: 'refresh_tokens_id_seq|7\n', stderr: '' };
            }

            if (sql === SQL.flyway)
            {
                return { status: 0, stdout: '1|111\n10|999\n', stderr: '' };
            }

            if (sql === SQL.dataApiGrants)
            {
                return { status: 0, stdout: '0\n', stderr: '' };
            }

            if (sql === SQL.revokeDefaults)
            {
                return { status: failing.includes('revokeDefaults') ? 2 : 0, stdout: '', stderr: '' };
            }

            if (sql === SQL.revokeExisting)
            {
                return { status: failing.includes('revokeExisting') ? 2 : 0, stdout: '', stderr: '' };
            }

            return none;
        }

        if (tool[0] === 'pg_dump')
        {
            return { status: failing.includes('pg_dump') ? 2 : 0, stdout: '', stderr: '' };
        }

        if (tool[0] === 'pg_restore' && tool[1] === '--list')
        {
            return { status: failing.includes('list') ? 2 : 0, stdout: list, stderr: '' };
        }

        if (tool[0] === 'pg_restore')
        {
            return { status: failing.includes('restore') ? 2 : 0, stdout: '', stderr: '' };
        }

        return none;
    };

    const exec = (command, args, options = {}) =>
    {
        calls.push({ command, args, env: options.env });

        if (args[0] === 'ps')
        {
            return { status: 0, stdout: containers.join('\n'), stderr: '' };
        }

        if (args[0] === 'inspect')
        {
            return { status: 0, stdout: localRunning ? 'true\n' : 'false\n', stderr: '' };
        }

        if (args[0] === 'run')
        {
            const side = options.env.PGHOST === 'postgres' ? 'local' : 'supabase';
            const tool = args.slice(args.findIndex((arg) => arg.startsWith('postgres:')) + 1);

            return answerTool(side, tool);
        }

        return { status: 0, stdout: '', stderr: '' };
    };

    return {
        deps: { exec, root, vars, log: (line) => lines.push(line), now: () => Date.UTC(2026, 10, 15, 14, 30, 0) },
        calls,
        lines
    };
};

test('check passes on a ready machine', () =>
{
    const m = machine();

    assert.equal(check(m.deps), 0);
    assert.deepEqual(m.lines, ['Supabase: Postgres 17, schema public vazio', 'Pronto para copiar']);
});

test('check refuses a missing .env', () =>
{
    const m = machine({ vars: null });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: arquivo .env não encontrado na raiz do repositório']);
});

test('check refuses the local .env without talking to Supabase', () =>
{
    const m = machine({ vars: LOCAL });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia']);
    assert.equal(m.calls.some((call) => call.args[0] === 'run'), false);
});

test('check refuses an invalid .env', () =>
{
    const m = machine({ vars: { ...SUPABASE, SPRING_DATASOURCE_URL: 'jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require' } });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o .env não está pronto para o Supabase: a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)']);
});

test('check refuses a running slot', () =>
{
    const m = machine({ containers: ['infinity-grove-backend-blue|running'] });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: pare o publish.sh antes da cópia: infinity-grove-backend-blue está rodando']);
});

test('check refuses a stopped slot', () =>
{
    const m = machine({ containers: ['infinity-grove-backend-green|exited'] });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: remova o container parado infinity-grove-backend-green antes da cópia (docker rm infinity-grove-backend-green): um rollback o ligaria no banco antigo']);
});

test('check refuses a stopped local Postgres', () =>
{
    const m = machine({ localRunning: false });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o Postgres local não está rodando: docker compose -f backend/docker-compose.yml up -d --wait postgres']);
});

test('check refuses an unreachable Supabase', () =>
{
    const m = machine({ versionStatus: 2 });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env']);
});

test('check refuses a Supabase older than 16', () =>
{
    const m = machine({ version: '150008' });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o Supabase roda Postgres 15; a cópia precisa de 16 ou mais']);
});

test('check accepts a Supabase on Postgres 16, the first major the copy supports', () =>
{
    const m = machine({ version: '160004' });

    assert.equal(check(m.deps), 0);
    assert.deepEqual(m.lines, ['Supabase: Postgres 16, schema public vazio', 'Pronto para copiar']);
});

test('check refuses a Supabase public schema with tables', () =>
{
    const m = machine({ publicTables: '12' });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o schema public do Supabase já tem 12 tabelas; a cópia só roda num banco vazio']);
});

test('check refuses a Supabase public schema with exactly one table', () =>
{
    const m = machine({ publicTables: '1' });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o schema public do Supabase já tem 1 tabelas; a cópia só roda num banco vazio']);
});

test('check refuses a Supabase on Postgres 16 whose public schema has tables', () =>
{
    const m = machine({ version: '160004', publicTables: '3' });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o schema public do Supabase já tem 3 tabelas; a cópia só roda num banco vazio']);
});

test('the version probe runs on postgres:17 and the rest on the Supabase major', () =>
{
    const m = machine({ version: '180001' });

    assert.equal(check(m.deps), 0);

    const probe = m.calls.find((call) => call.args.at(-1) === SQL.version);
    const count = m.calls.find((call) => call.args.at(-1) === SQL.tableCount);

    assert.ok(probe.args.includes('postgres:17'));
    assert.ok(count.args.includes('postgres:18'));
    assert.equal(m.lines[0], 'Supabase: Postgres 18, schema public vazio');
});

test('verify prints the comparison and returns 0 on equal data', () =>
{
    const m = machine();

    assert.equal(verify(m.deps), 0);
    assert.deepEqual(m.lines, [
        'users: local 3, supabase 3 OK',
        'sequência refresh_tokens_id_seq: local 7, supabase 7 OK',
        'Histórico do Flyway: 2 migrações, última 10 OK',
        'Permissões do Data API: 0 OK',
        'Verificação OK: 1 tabela(s), 3 linha(s)'
    ]);
});

test('verify returns 1 on a difference', () =>
{
    const m = machine({ remoteCounts: 'users|2\n' });

    assert.equal(verify(m.deps), 1);
    assert.ok(m.lines.includes('users: local 3, supabase 2 DIFERENTE'));
    assert.equal(m.lines.at(-1), 'Verificação FALHOU: 1 diferença(s)');
});

test('verify runs while the slots are up', () =>
{
    const m = machine({ containers: ['infinity-grove-backend-blue|running'] });

    assert.equal(verify(m.deps), 0);
    assert.equal(m.calls.some((call) => call.args[0] === 'ps'), false);
});

test('verify reports an unreadable Supabase', () =>
{
    const m = machine({ failing: ['supabaseSnapshot'] });

    assert.equal(verify(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: não foi possível ler o Supabase');
});

test('verify reports an unreadable local Postgres', () =>
{
    const m = machine({ failing: ['localSnapshot'] });

    assert.equal(verify(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: não foi possível ler o Postgres local');
});

test('main prints the usage for an unknown command', () =>
{
    const m = machine();

    assert.equal(main([], m.deps), 1);
    assert.deepEqual(m.lines, ['Uso: node deploy/db/copyToSupabase.mjs check | copy | verify']);
});

test('no docker argument carries the password', () =>
{
    const m = machine();

    check(m.deps);
    verify(m.deps);

    assert.equal(m.calls.some((call) => call.args.some((arg) => arg.includes(PASSWORD))), false);
});

const STAMP = 'infinity_grove-20261115T143000Z';

const TOC = [';', '5; 2615 2200 SCHEMA - public pg_database_owner', '218; 1259 16385 TABLE public users infinity', ''].join('\n');

//  The docker run calls only, with the tool arguments that follow the postgres image
const runs = (calls) => calls.filter((call) => call.args[0] === 'run');

const toolOf = (call) => call.args.slice(call.args.findIndex((arg) => arg.startsWith('postgres:')) + 1);

//  Each tool call as a step name: the SQL for psql, the pg_restore mode, else the tool name; the preflight probes are left out
const steps = (calls) => runs(calls)
    .map((call) =>
    {
        const tool = toolOf(call);

        if (tool[0] === 'psql')
        {
            return tool.at(-1);
        }

        if (tool[0] === 'pg_restore')
        {
            return `pg_restore ${tool[1]}`;
        }

        return tool[0];
    })
    .filter((step) => step !== SQL.version && step !== SQL.tableCount);

test('a copy dumps, lists, revokes the defaults, restores, revokes the grants and verifies, in that order', () =>
{
    const m = machine({ list: TOC });

    assert.equal(copy(m.deps), 0);

    const order = steps(m.calls);

    assert.deepEqual(order.slice(0, 5), ['pg_dump', 'pg_restore --list', SQL.revokeDefaults, 'pg_restore --no-owner', SQL.revokeExisting]);
    assert.equal(order[5], SQL.tableCounts);
    assert.deepEqual(m.lines, [
        `Dump salvo em backups/${STAMP}.dump`,
        'Restaurado no Supabase (Postgres 17)',
        'users: local 3, supabase 3 OK',
        'sequência refresh_tokens_id_seq: local 7, supabase 7 OK',
        'Histórico do Flyway: 2 migrações, última 10 OK',
        'Permissões do Data API: 0 OK',
        'Verificação OK: 1 tabela(s), 3 linha(s)'
    ]);
});

test('the dump reads only the public schema of the local database, without owners or grants', () =>
{
    const m = machine({ list: TOC });

    copy(m.deps);

    const dump = runs(m.calls).find((call) => toolOf(call)[0] === 'pg_dump');

    assert.deepEqual(toolOf(dump), ['pg_dump', '--format=custom', '--schema=public', '--no-owner', '--no-privileges', `--file=/backups/${STAMP}.dump`]);
    assert.equal(dump.env.PGHOST, 'postgres');
    assert.equal(dump.env.PGDATABASE, 'infinity_grove');
});

test('the restore is one transaction that stops at the first error', () =>
{
    const m = machine({ list: TOC });

    copy(m.deps);

    const restore = runs(m.calls).find((call) => toolOf(call)[0] === 'pg_restore' && toolOf(call)[1] === '--no-owner');

    assert.deepEqual(toolOf(restore), ['pg_restore', '--no-owner', '--no-privileges', '--exit-on-error', '--single-transaction', `--use-list=/backups/${STAMP}.list`, '--dbname=postgres', `/backups/${STAMP}.dump`]);
    assert.equal(restore.env.PGHOST, 'aws-0-sa-east-1.pooler.supabase.com');
});

test('the restore list leaves out the public schema entry', () =>
{
    const m = machine({ list: TOC });

    copy(m.deps);

    assert.equal(readFileSync(join(m.deps.root, 'backups', `${STAMP}.list`), 'utf8'), [';', '218; 1259 16385 TABLE public users infinity', ''].join('\n'));
});

test('a failed dump writes nothing to Supabase', () =>
{
    const m = machine({ failing: ['pg_dump'] });

    assert.equal(copy(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: pg_dump falhou; nada foi escrito no Supabase');
    assert.equal(steps(m.calls).some((step) => step.startsWith('pg_restore') || step === SQL.revokeDefaults || step === SQL.revokeExisting), false);
});

test('a failed restore list writes nothing to Supabase', () =>
{
    const m = machine({ failing: ['list'] });

    assert.equal(copy(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: pg_restore --list falhou; nada foi escrito no Supabase');
    assert.equal(steps(m.calls).includes(SQL.revokeDefaults), false);
});

test('a failed default-privilege revoke stops before the restore', () =>
{
    const m = machine({ failing: ['revokeDefaults'] });

    assert.equal(copy(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: não foi possível revogar as permissões padrão do Data API; nada foi restaurado');
    assert.equal(steps(m.calls).includes('pg_restore --no-owner'), false);
});

test('a failed restore says the transaction was undone', () =>
{
    const m = machine({ failing: ['restore'] });

    assert.equal(copy(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: pg_restore falhou; a transação foi desfeita e o schema public do Supabase continua vazio');
    assert.equal(steps(m.calls).includes(SQL.revokeExisting), false);
});

test('a failed grant revoke stops before the verify', () =>
{
    const m = machine({ failing: ['revokeExisting'] });

    assert.equal(copy(m.deps), 1);
    assert.equal(m.lines.at(-1), 'ERRO: não foi possível revogar as permissões do Data API nas tabelas copiadas');
    assert.equal(steps(m.calls).includes(SQL.tableCounts), false);
});

test('a failed preflight copies nothing', () =>
{
    const m = machine({ containers: ['infinity-grove-backend-blue|running'] });

    assert.equal(copy(m.deps), 1);
    assert.equal(steps(m.calls).includes('pg_dump'), false);
});

test('the backups folder is created under the repository root', () =>
{
    const m = machine({ list: TOC });

    copy(m.deps);

    assert.equal(existsSync(join(m.deps.root, 'backups')), true);
});

test('main runs copy', () =>
{
    const m = machine({ list: TOC });

    assert.equal(main(['copy'], m.deps), 0);
});
