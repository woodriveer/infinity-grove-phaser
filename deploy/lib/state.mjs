//  .deploy-state (JSON: active, previous, handled, tunnel) and the .deploy.lock that keeps one deploy at a time
import { closeSync, existsSync, openSync, readFileSync, renameSync, rmSync, writeFileSync, writeSync } from 'node:fs';

export const readState = (file) =>
{
    if (!existsSync(file))
    {
        return null;
    }

    return JSON.parse(readFileSync(file, 'utf8'));
};

//  Written to a temp file first, so a crash never leaves half a state
export const writeState = (file, state) =>
{
    writeFileSync(`${file}.tmp`, `${JSON.stringify(state, null, 2)}\n`);
    renameSync(`${file}.tmp`, file);
};

export const acquireLock = (file) =>
{
    try
    {
        const fd = openSync(file, 'wx');
        writeSync(fd, `${process.pid}\n`);
        closeSync(fd);

        return true;
    }
    catch (error)
    {
        if (error.code === 'EEXIST')
        {
            return false;
        }

        throw error;
    }
};

export const releaseLock = (file) =>
{
    rmSync(file, { force: true });
};

//  A lock left by a run that died (machine restart); true when there was one
export const clearStaleLock = (file) =>
{
    const stale = existsSync(file);
    rmSync(file, { force: true });

    return stale;
};
