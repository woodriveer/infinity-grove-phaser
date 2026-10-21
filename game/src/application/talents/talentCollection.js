//  The talents of the player as the backend sees them, kept in step with every upgrade.
//  Port (ADR 0007):
//    gateway  { list(), upgrade(talentId, fromLevel) }  the backend /talents calls.
//             list resolves with { talents: [ { id, level, value, nextCost, ... } ] }; upgrade with { talents, wallet }.
//             Each rejects with an ApiError.
export const createTalentCollection = ({ gateway }) =>
{
    let talents = [];
    let loaded = false;
    let loading = null;
    const listeners = [];
    let walletChanged = () => {};

    const adopt = (list) =>
    {
        talents = list;
        loaded = true;
        listeners.forEach((listener) => listener());
    };

    const load = () =>
    {
        loading ??= gateway.list()
            .then(({ talents: list }) =>
            {
                adopt(list);
            })
            .finally(() =>
            {
                loading = null;
            });

        return loading;
    };

    return {
        get loaded () { return loaded; },

        //  The tree as last read; empty until the first load
        talents: () => talents,

        levelOf: (talentId) => talents.find((talent) => talent.id === talentId)?.level ?? 0,

        //  Fired after every change: a load or an upgrade
        onChange: (listener) =>
        {
            listeners.push(listener);
        },

        //  Fired with the wallet the backend answered after an upgrade
        onWallet: (listener) =>
        {
            walletChanged = listener;
        },

        //  Reads the tree from the backend (one request at a time); rejects and keeps what it had when the backend cannot be reached
        load,

        //  Buys the next level of a talent; `fromLevel` is the level the player saw. After a 409 the tree is read again (it is the truth) and
        //  the refusal still rejects so the screen can say why.
        upgrade: async (talentId, fromLevel) =>
        {
            try
            {
                const change = await gateway.upgrade(talentId, fromLevel);

                adopt(change.talents);
                walletChanged(change.wallet);
            }
            catch (error)
            {
                if (error.status === 409)
                {
                    await load().catch(() => {});
                }

                throw error;
            }
        }
    };
};
