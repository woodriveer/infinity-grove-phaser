//  The auto click of the player as the backend sees it (spec auto-click): the level, its interval, the crystals and the next upgrade.
//  Port (ADR 0007):
//    gateway  { get(), upgrade(fromLevel) }  the backend /auto-click calls; both resolve with
//             { level, maxLevel, intervalMs, crystals, next: { level, intervalMs, price } | null, resets } and reject with an ApiError.
import { AUTO_CLICK_BASE_MS } from '../../domain/combat/autoClick';

export const createAutoClickState = ({ gateway }) =>
{
    let state = null;
    let loading = null;
    const listeners = [];

    const adopt = (answer) =>
    {
        state = answer;
        listeners.forEach((listener) => listener());
    };

    const load = () =>
    {
        loading ??= gateway.get()
            .then(adopt)
            .finally(() =>
            {
                loading = null;
            });

        return loading;
    };

    return {
        get loaded () { return state !== null; },

        //  The state as last read; null until the first load succeeds
        state: () => state,

        //  The interval the auto click runs at: 500 ms until the state loads, and after a failed load
        intervalMs: () => state?.intervalMs ?? AUTO_CLICK_BASE_MS,

        //  Fired after every change: a load or an upgrade
        onChange: (listener) =>
        {
            listeners.push(listener);
        },

        //  Reads the state from the backend (one request at a time); rejects and keeps what it had when the backend cannot be reached
        load,

        //  An account reset paid crystals (spec account-reset): its balance and reset count replace the ones held. Before the first load
        //  there is nothing to change, so the state is read instead.
        adoptReset: ({ crystals, resets }) =>
        {
            if (state)
            {
                adopt({ ...state, crystals, resets });
            }
            else
            {
                load().catch(() => {});
            }
        },

        //  Buys the next level from the level held. After a 409 the state the backend stored is adopted (it is the truth) and the refusal
        //  still rejects so the screen can say why.
        upgrade: async () =>
        {
            try
            {
                adopt(await gateway.upgrade(state.level));
            }
            catch (error)
            {
                if (error.status === 409)
                {
                    if (error.body?.autoClick)
                    {
                        adopt(error.body.autoClick);
                    }
                    else
                    {
                        await load().catch(() => {});
                    }
                }

                throw error;
            }
        }
    };
};
