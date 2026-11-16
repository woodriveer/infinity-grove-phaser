import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check, main, verify } from './copyToSupabase.mjs';
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

test('check refuses a Supabase public schema with tables', () =>
{
    const m = machine({ publicTables: '12' });

    assert.equal(check(m.deps), 1);
    assert.deepEqual(m.lines, ['ERRO: o schema public do Supabase já tem 12 tabelas; a cópia só roda num banco vazio']);
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
