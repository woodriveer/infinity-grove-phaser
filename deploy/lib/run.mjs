//  The one place that runs a command: no shell unless asked (npm is a .cmd on Windows), output captured, the exit status never null
import { spawnSync } from 'node:child_process';

export const run = (command, args = [], { cwd, env, input, encoding = 'utf8', shell = false } = {}) =>
{
    const result = spawnSync(command, args, {
        cwd,
        env: { ...process.env, ...env },
        input,
        encoding,
        shell,
        maxBuffer: 64 * 1024 * 1024
    });

    return {
        status: result.status ?? 1,
        stdout: result.stdout ?? '',
        stderr: result.error ? String(result.error.message) : result.stderr ?? ''
    };
};
