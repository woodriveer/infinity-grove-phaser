//  Runs the regression suite of a commit in its own container on the compose network, against the slot's internal address
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const REGRESSION_IMAGE = 'node:22.19.0-alpine';
const NETWORK = 'backend_default';
const SUITE = 'deploy/regression.mjs';

//  The commit's own suite, so a commit that changes the API ships its checks; the working tree copy when the commit has none
const writeSuite = (exec, root, hash, dir) =>
{
    const file = join(dir, 'regression.mjs');
    const shown = exec('git', ['show', `${hash}:${SUITE}`], { cwd: root, encoding: 'buffer' });

    if (shown.status === 0)
    {
        writeFileSync(file, shown.stdout);
    }
    else
    {
        copyFileSync(join(root, SUITE), file);
    }
};

export const runRegression = (exec, root, hash, slot) =>
{
    const short = hash.slice(0, 7);
    const dir = mkdtempSync(join(tmpdir(), 'infinity-grove-regression-'));

    try
    {
        writeSuite(exec, root, hash, dir);

        return exec('docker', [
            'run', '--rm',
            '--name', `infinity-grove-regression-${short}`,
            '--network', NETWORK,
            '-e', `REGRESSION_COMMIT=${short}`,
            '-v', `${dir}:/suite:ro`,
            REGRESSION_IMAGE,
            'node', '/suite/regression.mjs', `http://backend-${slot}:8080`
        ], { cwd: root }).status === 0;
    }
    finally
    {
        rmSync(dir, { recursive: true, force: true });
    }
};
