//  Builds the game and publishes it to Cloudflare Workers (free *.workers.dev address).
//  Usage: BACKEND_URL=https://<tunnel>.trycloudflare.com/api npm run deploy
import { spawnSync } from 'node:child_process';

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl)
{
    console.error('Set BACKEND_URL to the backend base the Worker should proxy /api to, e.g. https://<tunnel>.trycloudflare.com/api');
    process.exit(1);
}

const run = (command, args) =>
{
    const result = spawnSync(command, args, { stdio: 'inherit', shell: true });

    if (result.status !== 0)
    {
        process.exit(result.status ?? 1);
    }
};

run('npx', [ 'vite', 'build', '--mode', 'pages' ]);
run('npx', [ 'wrangler', 'deploy', '--var', `BACKEND_URL:${backendUrl}` ]);
