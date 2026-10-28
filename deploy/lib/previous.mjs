//  The previous slot: kept stopped for 5 minutes after a switch so ./deploy.sh --rollback can bring it back, then removed with its image
import { join } from 'node:path';
import { switchTo } from './proxy.mjs';
import { imageOf, removeImage, removeSlot, resumeSlot, slotExists, stopSlot, waitReady } from './slots.mjs';

export const KEEP_MS = 5 * 60 * 1000;
const DRAIN_MS = 10000;

export const sweepPrevious = ({ exec, root, state, now }) =>
{
    const { previous } = state;

    if (!previous || now() - previous.stoppedAt < KEEP_MS)
    {
        return state;
    }

    removeSlot(exec, root, previous.slot);
    removeImage(exec, imageOf(previous.commit));

    return { ...state, previous: null };
};

//  handled is kept, so the watcher does not deploy again the commit rolled back from (US-4 AC 3)
export const rollback = async ({ exec, fetch, root, state, log, sleep, now }) =>
{
    const { active, previous } = state;

    if (!previous || !slotExists(exec, previous.slot))
    {
        log('Sem versão anterior para voltar (removida após 5 min)');

        return { ok: false, state };
    }

    const short = previous.commit.slice(0, 7);

    //  SPEC_DEVIATION: the spec names no text for a rollback that does not come up or does not switch; these follow the deploy texts
    if (!resumeSlot(exec, previous.slot) || !await waitReady(fetch, previous.slot, { now, sleep }))
    {
        stopSlot(exec, previous.slot);
        log(`Rollback para ${short} falhou: o backend não ficou pronto em 180 s`);

        return { ok: false, state };
    }

    if (!switchTo(exec, join(root, 'deploy', 'nginx'), previous.slot))
    {
        stopSlot(exec, previous.slot);
        log(`Rollback para ${short} falhou na troca do proxy; o slot ${active.slot} continua ativo`);

        return { ok: false, state };
    }

    log(`Rollback para ${short} no slot ${previous.slot}`);

    await sleep(DRAIN_MS);
    stopSlot(exec, active.slot);

    return {
        ok: true,
        state: {
            ...state,
            active: { slot: previous.slot, commit: previous.commit },
            previous: { slot: active.slot, commit: active.commit, stoppedAt: now() }
        }
    };
};
