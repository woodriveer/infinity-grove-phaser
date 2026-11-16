import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_TARGET, SQL } from './pgTools.mjs';
import { compareSnapshots, parsePairs, takeSnapshot } from './snapshot.mjs';

const ROOT = '/repo';

const ANSWERS = {
    [SQL.tableCounts]: 'users|3\nwallets|2\n',
    [SQL.sequences]: 'refresh_tokens_id_seq|7\n',
    [SQL.flyway]: '1|111\n10|999\n',
    [SQL.dataApiGrants]: '0\n'
};

//  A fake exec that answers by the SQL in the last argument and fails the one named by `failing`
const fakeExec = (failing = '') =>
{
    const calls = [];
    const exec = (command, args) =>
    {
        const sql = args.at(-1);

        calls.push(sql);

        return { status: sql === failing ? 2 : 0, stdout: ANSWERS[sql] ?? '', stderr: '' };
    };

    return { exec, calls };
};

const snap = (tables, sequences, flyway, grants) => ({ ok: true, tables: new Map(tables), sequences: new Map(sequences), flyway, grants });

const EQUAL = snap([['users', '3'], ['wallets', '2']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|999'], 0);

test('parsePairs reads name|value lines and skips blank ones', () =>
{
    assert.deepEqual(parsePairs('users|3\n\nwallets|2\n'), new Map([['users', '3'], ['wallets', '2']]));
});

test('parsePairs reads CRLF output', () =>
{
    assert.deepEqual(parsePairs('users|3\r\nwallets|2\r\n'), new Map([['users', '3'], ['wallets', '2']]));
});

test('takeSnapshot with grants runs four queries in order', () =>
{
    const { exec, calls } = fakeExec();

    const result = takeSnapshot(exec, ROOT, 'postgres:17', LOCAL_TARGET, { grants: true });

    assert.deepEqual(calls, [SQL.tableCounts, SQL.sequences, SQL.flyway, SQL.dataApiGrants]);
    assert.deepEqual(result, {
        ok: true,
        tables: new Map([['users', '3'], ['wallets', '2']]),
        sequences: new Map([['refresh_tokens_id_seq', '7']]),
        flyway: ['1|111', '10|999'],
        grants: 0
    });
});

test('takeSnapshot without grants runs three queries and leaves grants null', () =>
{
    const { exec, calls } = fakeExec();

    const result = takeSnapshot(exec, ROOT, 'postgres:17', LOCAL_TARGET);

    assert.equal(calls.length, 3);
    assert.equal(result.grants, null);
});

test('takeSnapshot fails when a query fails', () =>
{
    const { exec, calls } = fakeExec(SQL.sequences);

    assert.deepEqual(takeSnapshot(exec, ROOT, 'postgres:17', LOCAL_TARGET, { grants: true }), { ok: false });
    assert.equal(calls.includes(SQL.flyway), false);
});

test('equal snapshots print OK lines and the total', () =>
{
    const result = compareSnapshots(EQUAL, EQUAL);

    assert.deepEqual(result.lines, [
        'users: local 3, supabase 3 OK',
        'wallets: local 2, supabase 2 OK',
        'sequência refresh_tokens_id_seq: local 7, supabase 7 OK',
        'Histórico do Flyway: 2 migrações, última 10 OK',
        'Permissões do Data API: 0 OK',
        'Verificação OK: 2 tabela(s), 5 linha(s)'
    ]);
    assert.equal(result.differences, 0);
});

test('a count difference is DIFERENTE', () =>
{
    const remote = snap([['users', '3'], ['wallets', '1']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|999'], 0);
    const result = compareSnapshots(EQUAL, remote);

    assert.ok(result.lines.includes('wallets: local 2, supabase 1 DIFERENTE'));
    assert.equal(result.lines.at(-1), 'Verificação FALHOU: 1 diferença(s)');
});

test('a table missing on Supabase is DIFERENTE', () =>
{
    const remote = snap([['users', '3']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|999'], 0);

    assert.ok(compareSnapshots(EQUAL, remote).lines.includes('wallets: local 2, supabase - DIFERENTE'));
});

test('a table only on Supabase is DIFERENTE and sorts first', () =>
{
    const remote = snap([['extra', '0'], ['users', '3'], ['wallets', '2']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|999'], 0);
    const result = compareSnapshots(EQUAL, remote);

    assert.equal(result.lines[0], 'extra: local -, supabase 0 DIFERENTE');
});

test('a sequence difference is DIFERENTE', () =>
{
    const remote = snap([['users', '3'], ['wallets', '2']], [['refresh_tokens_id_seq', '1']], ['1|111', '10|999'], 0);

    assert.ok(compareSnapshots(EQUAL, remote).lines.includes('sequência refresh_tokens_id_seq: local 7, supabase 1 DIFERENTE'));
});

test('a Flyway checksum difference is DIFERENTE', () =>
{
    const remote = snap([['users', '3'], ['wallets', '2']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|998'], 0);
    const result = compareSnapshots(EQUAL, remote);

    assert.ok(result.lines.includes('Histórico do Flyway: local 2 migrações, supabase 2 DIFERENTE'));
    assert.equal(result.differences, 1);
});

test('grants left on Supabase are DIFERENTE', () =>
{
    const remote = snap([['users', '3'], ['wallets', '2']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|999'], 4);
    const result = compareSnapshots(EQUAL, remote);

    assert.ok(result.lines.includes('Permissões do Data API: 4 concessões para anon, authenticated ou service_role DIFERENTE'));
    assert.equal(result.differences, 1);
});
