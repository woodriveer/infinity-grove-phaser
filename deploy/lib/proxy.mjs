//  Points the nginx proxy at one slot: the conf names only that slot, and nginx -s reload lets requests in flight finish
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PROXY = 'infinity-grove-proxy';

export const renderConf = (slot) => `upstream backend {
    server backend-${slot}:8080;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

export const writeConf = (dir, slot) =>
{
    writeFileSync(join(dir, 'default.conf'), renderConf(slot));
};

const nginx = (exec, args) => exec('docker', ['exec', PROXY, 'nginx', ...args]).status === 0;

//  On a failed check or reload the previous conf is written back, so a later reload never picks up the bad one
export const switchTo = (exec, dir, slot) =>
{
    const file = join(dir, 'default.conf');
    const before = existsSync(file) ? readFileSync(file, 'utf8') : null;

    writeConf(dir, slot);

    if (nginx(exec, ['-t']) && nginx(exec, ['-s', 'reload']))
    {
        return true;
    }

    if (before === null)
    {
        rmSync(file, { force: true });
    }
    else
    {
        writeFileSync(file, before);
    }

    return false;
};
