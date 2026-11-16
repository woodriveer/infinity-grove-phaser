//  What the copy compares between the local Postgres and Supabase: row counts, sequences, the Flyway history and Data API grants
import { SQL, psql } from './pgTools.mjs';

export const parsePairs = (stdout) =>
{
    const pairs = new Map();

    for (const line of stdout.split(/\r?\n/))
    {
        if (line.trim() === '')
        {
            continue;
        }

        const i = line.indexOf('|');

        pairs.set(line.slice(0, i), line.slice(i + 1));
    }

    return pairs;
};

export const takeSnapshot = (exec, root, image, target, { grants = false } = {}) =>
{
    const counts = psql(exec, root, image, target, SQL.tableCounts);

    if (counts.status !== 0)
    {
        return { ok: false };
    }

    const sequences = psql(exec, root, image, target, SQL.sequences);

    if (sequences.status !== 0)
    {
        return { ok: false };
    }

    const flyway = psql(exec, root, image, target, SQL.flyway);

    if (flyway.status !== 0)
    {
        return { ok: false };
    }

    const granted = grants ? psql(exec, root, image, target, SQL.dataApiGrants) : null;

    if (granted !== null && granted.status !== 0)
    {
        return { ok: false };
    }

    return {
        ok: true,
        tables: parsePairs(counts.stdout),
        sequences: parsePairs(sequences.stdout),
        flyway: flyway.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== ''),
        grants: granted === null ? null : Number(granted.stdout.trim())
    };
};

export const compareSnapshots = (local, remote) =>
{
    const lines = [];
    let differences = 0;

    const tableNames = [...new Set([...local.tables.keys(), ...remote.tables.keys()])].sort((a, b) => a.localeCompare(b));

    for (const name of tableNames)
    {
        const l = local.tables.get(name) ?? '-';
        const r = remote.tables.get(name) ?? '-';
        const same = l !== '-' && l === r;

        lines.push(`${name}: local ${l}, supabase ${r} ${same ? 'OK' : 'DIFERENTE'}`);
        differences += same ? 0 : 1;
    }

    const sequenceNames = [...new Set([...local.sequences.keys(), ...remote.sequences.keys()])].sort((a, b) => a.localeCompare(b));

    for (const name of sequenceNames)
    {
        const l = local.sequences.get(name) ?? '-';
        const r = remote.sequences.get(name) ?? '-';
        const same = l !== '-' && l === r;

        lines.push(`sequência ${name}: local ${l}, supabase ${r} ${same ? 'OK' : 'DIFERENTE'}`);
        differences += same ? 0 : 1;
    }

    const flywaySame = local.flyway.length === remote.flyway.length && local.flyway.every((item, i) => item === remote.flyway[i]);

    if (flywaySame)
    {
        const last = local.flyway.length ? local.flyway.at(-1).split('|')[0] : '-';

        lines.push(`Histórico do Flyway: ${local.flyway.length} migrações, última ${last} OK`);
    }
    else
    {
        lines.push(`Histórico do Flyway: local ${local.flyway.length} migrações, supabase ${remote.flyway.length} DIFERENTE`);
        differences += 1;
    }

    if (remote.grants === 0)
    {
        lines.push('Permissões do Data API: 0 OK');
    }
    else
    {
        lines.push(`Permissões do Data API: ${remote.grants} concessões para anon, authenticated ou service_role DIFERENTE`);
        differences += 1;
    }

    const tables = tableNames.length;
    const rows = [...local.tables.values()].reduce((sum, value) => sum + Number(value), 0);

    lines.push(differences === 0 ? `Verificação OK: ${tables} tabela(s), ${rows} linha(s)` : `Verificação FALHOU: ${differences} diferença(s)`);

    return { lines, differences, tables, rows };
};
