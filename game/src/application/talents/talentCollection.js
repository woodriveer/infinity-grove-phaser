//  The talents of the player as the backend sees them, kept in step with every upgrade.
//  Port (ADR 0007):
//    gateway  { list(), upgrade(talentId, fromLevel), reset() }  the backend /talents calls.
//             list and upgrade resolve with { talents: [ { id, level, value, nextCost, ... } ], points: { earned, spent, available } }.
//             Each rejects with an ApiError.
export const createTalentCollection = ({ gateway }) =>
{
    let talents = [];
    let points = { earned: 0, spent: 0, available: 0 };
    let loaded = false;
    let loading = null;
    const listeners = [];

    const adopt = (tree) =>
    {
        talents = tree.talents;
        points = tree.points ?? points;
        loaded = true;
        listeners.forEach((listener) => listener());
    };

    const load = () =>
    {
        loading ??= gateway.list()
            .then((tree) =>
            {
                adopt(tree);
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

        //  The talent points as last read: what the first clears paid, what the levels took and what is left
        points: () => points,

        levelOf: (talentId) => talents.find((talent) => talent.id === talentId)?.level ?? 0,

        //  Fired after every change: a load or an upgrade
        onChange: (listener) =>
        {
            listeners.push(listener);
        },

        //  Reads the tree from the backend (one request at a time); rejects and keeps what it had when the backend cannot be reached
        load,

        //  Takes back every level; the points they cost become available again
        reset: async () =>
        {
            adopt(await gateway.reset());
        },

        //  Buys the next level of a talent; `fromLevel` is the level the player saw. After a 409 the tree is read again (it is the truth) and
        //  the refusal still rejects so the screen can say why.
        upgrade: async (talentId, fromLevel) =>
        {
            try
            {
                adopt(await gateway.upgrade(talentId, fromLevel));
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
