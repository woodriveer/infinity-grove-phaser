//  One blue-green deploy: build the commit, start it in the idle slot, wait for it, run its suite, switch the proxy, stop the old slot
import { join } from 'node:path';
import { switchTo } from './proxy.mjs';
import { runRegression } from './regressionRun.mjs';
import { buildImage, imageOf, otherSlot, removeImage, removeSlot, startSlot, stopSlot, waitReady } from './slots.mjs';

const DRAIN_MS = 10000;

export const deployBackend = async ({ exec, fetch, root, state, hash, log, sleep, now }) =>
{
    const short = hash.slice(0, 7);
    const active = state.active.slot;
    const idle = otherSlot(active);

    //  A failed deploy leaves the active slot and the proxy alone; only the commit is marked handled, so it is not retried
    const fail = (message, { remove = true } = {}) =>
    {
        if (remove)
        {
            removeSlot(exec, root, idle);
        }

        log(message);

        return { ok: false, state: { ...state, handled: hash } };
    };

    if (!buildImage(exec, root, hash))
    {
        return fail(`Deploy ${short} falhou no build da imagem`, { remove: false });
    }

    if (!startSlot(exec, root, idle, imageOf(hash)) || !await waitReady(fetch, idle, { now, sleep }))
    {
        return fail(`Deploy ${short} falhou: o backend não ficou pronto em 180 s`);
    }

    if (!runRegression(exec, root, hash, idle))
    {
        return fail(`Deploy ${short} falhou na regressão; o slot ${active} continua ativo`);
    }

    if (!switchTo(exec, join(root, 'deploy', 'nginx'), idle))
    {
        return fail(`Deploy ${short} falhou na troca do proxy; o slot ${active} continua ativo`);
    }

    log(`Deploy ${short} ativo no slot ${idle}`);

    //  Requests still on the old upstream finish before it stops
    await sleep(DRAIN_MS);
    stopSlot(exec, active);

    //  The idle slot was still the previous one (a deploy within 5 min): its container was recreated, so its image would never be swept
    if (state.previous && imageOf(state.previous.commit) !== imageOf(hash))
    {
        removeImage(exec, imageOf(state.previous.commit));
    }

    return {
        ok: true,
        state: {
            ...state,
            active: { slot: idle, commit: hash },
            previous: { slot: active, commit: state.active.commit, stoppedAt: now() },
            handled: hash
        }
    };
};
