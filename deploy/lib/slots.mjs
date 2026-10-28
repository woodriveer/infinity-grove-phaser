//  The two backend slots: build the image of a commit, start it in a slot, wait until it answers, stop and remove it
export const SLOTS = { blue: { port: 18081 }, green: { port: 18082 } };

const COMPOSE = ['compose', '-f', 'backend/docker-compose.yml', '--profile', 'deploy'];

export const otherSlot = (slot) => (slot === 'blue' ? 'green' : 'blue');

export const imageOf = (hash) => `infinity-grove-backend:${hash.slice(0, 7)}`;

const containerOf = (slot) => `infinity-grove-backend-${slot}`;

//  The tar of the commit's backend tree, never the working tree, is the build context
export const buildImage = (exec, root, hash) =>
{
    const archive = exec('git', ['archive', '--format=tar', `${hash}:backend`], { cwd: root, encoding: 'buffer' });

    if (archive.status !== 0)
    {
        return false;
    }

    return exec('docker', ['build', '-t', imageOf(hash), '-'], { cwd: root, input: archive.stdout }).status === 0;
};

export const startSlot = (exec, root, slot, image) =>
    exec('docker', [...COMPOSE, 'up', '-d', '--no-deps', '--force-recreate', `backend-${slot}`], {
        cwd: root,
        env: { [`${slot.toUpperCase()}_IMAGE`]: image }
    }).status === 0;

export const stopSlot = (exec, slot) => exec('docker', ['stop', containerOf(slot)]).status === 0;

//  Starts the slot's stopped container as it is, image and all (a rollback)
export const resumeSlot = (exec, slot) => exec('docker', ['start', containerOf(slot)]).status === 0;

export const removeSlot = (exec, root, slot) =>
    exec('docker', [...COMPOSE, 'rm', '-sf', `backend-${slot}`], { cwd: root }).status === 0;

export const slotExists = (exec, slot) => exec('docker', ['container', 'inspect', containerOf(slot)]).status === 0;

export const removeImage = (exec, image) => exec('docker', ['image', 'rm', image]).status === 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//  Ready on the first 401 from /progress (Spring and security are up, no token sent); a refused connection or a 5xx keeps polling.
//  The request timer is a plain setTimeout, not AbortSignal.timeout: Docker Desktop accepts a connection before the backend
//  listens, and with only an unref'd timer pending Node ends the run on an unsettled await
export const waitReady = async (fetch, slot, { timeoutMs = 180000, intervalMs = 2000, requestTimeoutMs = 10000, now = Date.now, sleep = wait } = {}) =>
{
    const url = `http://127.0.0.1:${SLOTS[slot].port}/progress`;
    const start = now();

    for (;;)
    {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

        try
        {
            const response = await fetch(url, { signal: controller.signal });

            if (response.status === 401)
            {
                return true;
            }
        }
        catch
        {
            //  not listening yet
        }
        finally
        {
            clearTimeout(timer);
        }

        if (now() - start >= timeoutMs)
        {
            return false;
        }

        await sleep(intervalMs);
    }
};
