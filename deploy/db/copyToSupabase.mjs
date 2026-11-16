//  One-time copy of the local Postgres (public schema) to Supabase, run by hand during the cutover (spec supabase-postgres)
//  Usage: node deploy/db/copyToSupabase.mjs check | copy | verify   (reads the repo-root .env; prints no secret)
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkDatabaseEnv } from '../lib/databaseEnv.mjs';
import { readDotenv } from '../lib/dotenv.mjs';
import { run } from '../lib/run.mjs';
import { LOCAL_CONTAINER, LOCAL_TARGET, PROBE_IMAGE, SQL, psql, supabaseTarget, toolImage } from './pgTools.mjs';
import { compareSnapshots, takeSnapshot } from './snapshot.mjs';

export const preflight = ({ exec, root, vars, forCopy }) =>
{
    const errors = [];
    let major = null;
    let target = null;
    let env = null;

    if (vars === null)
    {
        errors.push('arquivo .env não encontrado na raiz do repositório');
    }
    else
    {
        env = checkDatabaseEnv(vars);

        if (!env.ok)
        {
            errors.push(`o .env não está pronto para o Supabase: ${env.errors.join('; ')}`);
        }
        else if (env.mode === 'local')
        {
            errors.push('o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia');
        }
    }

    const supabaseReady = vars !== null && env.ok && env.mode === 'supabase';

    if (forCopy)
    {
        const containers = exec('docker', ['ps', '-a', '--filter', 'name=infinity-grove-backend-', '--format', '{{.Names}}|{{.State}}']);

        for (const line of String(containers.stdout).split(/\r?\n/))
        {
            if (line.trim() === '')
            {
                continue;
            }

            const [name, state] = line.split('|');

            if (state === 'running')
            {
                errors.push(`pare o publish.sh antes da cópia: ${name} está rodando`);
            }
            else
            {
                errors.push(`remova o container parado ${name} antes da cópia (docker rm ${name}): um rollback o ligaria no banco antigo`);
            }
        }
    }

    if (exec('docker', ['inspect', '-f', '{{.State.Running}}', LOCAL_CONTAINER]).stdout.trim() !== 'true')
    {
        errors.push('o Postgres local não está rodando: docker compose -f backend/docker-compose.yml up -d --wait postgres');
    }

    if (supabaseReady)
    {
        target = supabaseTarget(vars);

        const probe = psql(exec, root, PROBE_IMAGE, target, SQL.version);

        if (probe.status !== 0)
        {
            errors.push('não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env');
        }
        else
        {
            major = Math.floor(Number(probe.stdout.trim()) / 10000);

            if (major < 16)
            {
                errors.push(`o Supabase roda Postgres ${major}; a cópia precisa de 16 ou mais`);
            }
        }
    }

    if (forCopy && major !== null && major >= 16)
    {
        const tables = Number(psql(exec, root, toolImage(major), target, SQL.tableCount).stdout.trim());

        if (tables > 0)
        {
            errors.push(`o schema public do Supabase já tem ${tables} tabelas; a cópia só roda num banco vazio`);
        }
    }

    return { ok: errors.length === 0, major, target, errors };
};

export const check = (deps) =>
{
    const p = preflight({ ...deps, forCopy: true });

    if (!p.ok)
    {
        p.errors.forEach((error) => deps.log(`ERRO: ${error}`));

        return 1;
    }

    deps.log(`Supabase: Postgres ${p.major}, schema public vazio`);
    deps.log('Pronto para copiar');

    return 0;
};

export const verify = (deps) =>
{
    const { exec, root, log } = deps;
    const p = preflight({ ...deps, forCopy: false });

    if (!p.ok)
    {
        p.errors.forEach((error) => log(`ERRO: ${error}`));

        return 1;
    }

    const image = toolImage(p.major);
    const local = takeSnapshot(exec, root, image, LOCAL_TARGET);

    if (!local.ok)
    {
        log('ERRO: não foi possível ler o Postgres local');

        return 1;
    }

    const remote = takeSnapshot(exec, root, image, p.target, { grants: true });

    if (!remote.ok)
    {
        log('ERRO: não foi possível ler o Supabase');

        return 1;
    }

    const result = compareSnapshots(local, remote);

    result.lines.forEach((line) => log(line));

    return result.differences === 0 ? 0 : 1;
};

export const main = (args, deps) =>
{
    if (args[0] === 'check')
    {
        return check(deps);
    }

    if (args[0] === 'verify')
    {
        return verify(deps);
    }

    deps.log('Uso: node deploy/db/copyToSupabase.mjs check | copy | verify');

    return 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

    process.exit(main(process.argv.slice(2), { exec: run, root, vars: readDotenv(join(root, '.env')), log: console.log, now: Date.now }));
}
