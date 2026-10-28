//  Publishes the Worker built from a commit's game tree, never the working tree, through the live tunnel
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const publishWorker = ({ exec, root, hash, tunnel, log }) =>
{
    const dir = mkdtempSync(join(tmpdir(), 'infinity-grove-worker-'));
    const game = join(dir, 'game');

    //  The tar goes through a file (the game tree is tens of MB) and is unpacked by a relative name, which every tar on Windows reads
    const steps = [
        () => exec('git', ['archive', '--format=tar', `--output=${join(dir, 'game.tar')}`, hash, 'game'], { cwd: root }),
        () => exec('tar', ['-xf', 'game.tar'], { cwd: dir }),
        //  game/package-lock.json is gitignored: npm ci needs one, so a tree without it installs from package.json
        () => exec(existsSync(join(game, 'package-lock.json')) ? 'npm ci' : 'npm install', [], { cwd: game, shell: true }),
        () => exec('npm run deploy', [], { cwd: game, env: { BACKEND_URL: tunnel }, shell: true })
    ];

    try
    {
        if (steps.every((step) => step().status === 0))
        {
            return true;
        }

        log(`Publicação do Worker ${hash.slice(0, 7)} falhou`);

        return false;
    }
    finally
    {
        rmSync(dir, { recursive: true, force: true });
    }
};
