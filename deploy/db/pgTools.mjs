//  The Postgres tools of the Supabase copy run in throwaway postgres:<major> containers on the compose network; every connection
//  value goes in by variable name (-e PGPASSWORD), never as an argument, so no process list or log shows the password
import { join } from 'node:path';
import { jdbcParts } from '../lib/databaseEnv.mjs';

export const NETWORK = 'backend_default';
export const PROBE_IMAGE = 'postgres:17';
export const LOCAL_CONTAINER = 'infinity-grove-postgres';
export const LOCAL_TARGET = { host: 'postgres', port: 5432, database: 'infinity_grove', user: 'infinity', password: 'infinity', sslmode: 'disable' };
export const PG_ENV_NAMES = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGSSLMODE'];

export const toolImage = (major) => `postgres:${major}`;

export const supabaseTarget = (vars) =>
{
    const { host, port, database, params } = jdbcParts(vars.SPRING_DATASOURCE_URL);

    return { host, port, database, user: vars.SPRING_DATASOURCE_USERNAME, password: vars.SPRING_DATASOURCE_PASSWORD, sslmode: params.sslmode };
};

export const pgEnv = (target) => ({
    PGHOST: target.host,
    PGPORT: String(target.port),
    PGDATABASE: target.database,
    PGUSER: target.user,
    PGPASSWORD: target.password,
    PGSSLMODE: target.sslmode
});

export const pgRun = (exec, root, { image, target, mount = false, command }) =>
    exec('docker', [
        'run', '--rm', '--network', NETWORK,
        ...PG_ENV_NAMES.flatMap((name) => ['-e', name]),
        ...(mount ? ['-v', `${join(root, 'backups')}:/backups`] : []),
        image,
        ...command
    ], { cwd: root, env: pgEnv(target) });

export const psql = (exec, root, image, target, sql) =>
    pgRun(exec, root, { image, target, command: ['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql] });

export const SQL = {
    version: 'show server_version_num',
    tableCount: "select count(*) from pg_tables where schemaname = 'public'",
    tableCounts: "select tablename || '|' || (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', tablename), false, true, '')))[1]::text from pg_tables where schemaname = 'public' order by tablename",
    sequences: "select sequencename || '|' || coalesce(last_value, 0) from pg_sequences where schemaname = 'public' order by sequencename",
    flyway: "select coalesce(version, 'R') || '|' || coalesce(checksum::text, '') from public.flyway_schema_history where success order by installed_rank",
    dataApiGrants: "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join lateral aclexplode(c.relacl) a join pg_roles r on r.oid = a.grantee where n.nspname = 'public' and r.rolname in ('anon', 'authenticated', 'service_role')",
    revokeDefaults: 'alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role; alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role; alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role',
    revokeExisting: 'revoke all on all tables in schema public from anon, authenticated, service_role; revoke all on all sequences in schema public from anon, authenticated, service_role; revoke all on all functions in schema public from anon, authenticated, service_role'
};

//  Supabase already has the public schema: its CREATE and COMMENT entries leave the restore list
export const filterRestoreList = (text) =>
    text.split(/\r?\n/)
        .filter((line) => !/ SCHEMA - public( |$)/.test(line) && !/ COMMENT - SCHEMA public( |$)/.test(line))
        .join('\n');
