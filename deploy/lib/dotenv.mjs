//  The repo-root .env as Compose env_file reads plain values: NAME=value per line, no quotes, # lines and blank lines skipped
import { existsSync, readFileSync } from 'node:fs';

export const parseDotenv = (text) =>
{
    const result = {};

    for (const line of text.split(/\r?\n/))
    {
        if (line.trim() === '' || line.trimStart().startsWith('#'))
        {
            continue;
        }

        const i = line.indexOf('=');

        if (i <= 0)
        {
            continue;
        }

        result[line.slice(0, i).trim()] = line.slice(i + 1);
    }

    return result;
};

export const readDotenv = (path) => (existsSync(path) ? parseDotenv(readFileSync(path, 'utf8')) : null);
