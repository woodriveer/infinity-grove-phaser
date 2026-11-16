//  The rules a .env must pass before a backend slot may start on it (spec supabase-postgres, SUPA-02)
import { join } from 'node:path';
import { readDotenv } from './dotenv.mjs';

export const SUPABASE_PROJECT_REF = 'jnqlrdnwwqslihncszej';
export const DATABASE_VARS = ['SPRING_DATASOURCE_URL', 'SPRING_DATASOURCE_USERNAME', 'SPRING_DATASOURCE_PASSWORD'];

const JDBC_URL = /^jdbc:postgresql:\/\/([^/:?#]+):(\d+)\/([^/?#]+)(?:\?(.*))?$/;
const UNSAFE_CHARS = /[\s#$"'`\\]/;

export const jdbcParts = (url) =>
{
    const match = JDBC_URL.exec(url);

    if (match === null)
    {
        return null;
    }

    const params = Object.fromEntries(
        (match[4] ?? '')
            .split('&')
            .filter((part) => part !== '')
            .map((part) =>
            {
                const i = part.indexOf('=');

                return i === -1 ? [part.toLowerCase(), ''] : [part.slice(0, i).toLowerCase(), part.slice(i + 1)];
            })
    );

    return { host: match[1], port: Number(match[2]), database: match[3], params };
};

export const checkDatabaseEnv = (vars) =>
{
    const errors = [];
    let mode = null;

    for (const name of DATABASE_VARS)
    {
        if (!vars[name])
        {
            errors.push(`falta ${name} no .env`);
        }
    }

    for (const name of DATABASE_VARS)
    {
        if (vars[name] && UNSAFE_CHARS.test(vars[name]))
        {
            errors.push(`${name} contém espaço, #, $, aspas ou barra invertida`);
        }
    }

    const url = vars.SPRING_DATASOURCE_URL;

    if (!url)
    {
        return { ok: false, mode: null, errors };
    }

    const parts = jdbcParts(url);

    if (parts === null)
    {
        errors.push('SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>');

        return { ok: false, mode: null, errors };
    }

    const { host, port, database, params } = parts;

    if ('user' in params || 'password' in params)
    {
        errors.push('SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD');
    }

    if (host === 'postgres')
    {
        mode = 'local';
    }
    else if (/^db\.[a-z0-9]+\.supabase\.co$/.test(host))
    {
        errors.push('a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)');
    }
    else if (/^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(host))
    {
        mode = 'supabase';

        if (port === 6543)
        {
            errors.push('a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)');
        }
        else if (port !== 5432)
        {
            errors.push(`o Session pooler do Supabase usa a porta 5432, não ${port}`);
        }

        if (database !== 'postgres')
        {
            errors.push(`o banco do Supabase se chama postgres, não ${database}`);
        }

        if (!['require', 'verify-ca', 'verify-full'].includes(params.sslmode))
        {
            errors.push('SPRING_DATASOURCE_URL precisa de sslmode=require');
        }

        if (vars.SPRING_DATASOURCE_USERNAME && vars.SPRING_DATASOURCE_USERNAME !== `postgres.${SUPABASE_PROJECT_REF}`)
        {
            errors.push('SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej');
        }
    }
    else
    {
        errors.push(`o host ${host} não é o Session pooler do Supabase nem o postgres local`);
    }

    return { ok: errors.length === 0, mode, errors };
};

export const loadDatabaseEnv = (root) =>
{
    const vars = readDotenv(join(root, '.env'));

    if (vars === null)
    {
        return { ok: false, mode: null, errors: ['arquivo .env não encontrado na raiz do repositório'] };
    }

    return checkDatabaseEnv(vars);
};
