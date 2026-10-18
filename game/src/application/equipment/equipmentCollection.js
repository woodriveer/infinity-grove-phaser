import { applyEquipmentDrop } from '../../domain/equipment/equipment';

//  The pieces of the player as the backend sees them (worn and in the bag), kept in step with every action.
//  Port (ADR 0007):
//    gateway  { list(), equip(pieceId, heroId), unequip(pieceId), refine(pieceId), reroll(pieceId, affix), sell(pieceId) }  the backend /equipment calls.
//             list, equip and unequip resolve with { capacity, pieces }; refine, reroll and sell with { equipment, wallet }.
//             Each rejects with an ApiError.
export const createEquipmentCollection = ({ gateway }) =>
{
    let pieces = [];
    let capacity = null;
    let loaded = false;
    let loading = null;
    let droppedWhileLoading = false;
    const listeners = [];
    let walletChanged = () => {};

    const changed = () =>
    {
        listeners.forEach((listener) => listener());
    };

    const adopt = (equipment) =>
    {
        pieces = equipment.pieces;
        capacity = equipment.capacity;
        loaded = true;
        changed();
    };

    //  An action that spends or earns copper answers with the new wallet as well
    const adoptChange = ({ equipment, wallet }) =>
    {
        adopt(equipment);
        walletChanged(wallet);
    };

    const load = () =>
    {
        loading ??= gateway.list()
            .then((equipment) =>
            {
                adopt(equipment);
            })
            .finally(() =>
            {
                loading = null;
            })
            .then(() =>
            {
                //  A piece dropped while the list was on its way may be missing from it
                if (droppedWhileLoading)
                {
                    droppedWhileLoading = false;
                    return load();
                }

                return undefined;
            });

        return loading;
    };

    return {
        get loaded () { return loaded; },

        pieces: () => pieces,

        capacity: () => capacity,

        //  Fired after every change: a load, an action or a dropped piece
        onChange: (listener) =>
        {
            listeners.push(listener);
        },

        //  Fired with the wallet the backend answered after a refine, a reroll or a sale
        onWallet: (listener) =>
        {
            walletChanged = listener;
        },

        //  Reads the pieces from the backend (one request at a time); rejects and keeps what it had when the backend cannot be reached
        load,

        equip: async (pieceId, heroId) =>
        {
            adopt(await gateway.equip(pieceId, heroId));
        },

        unequip: async (pieceId) =>
        {
            adopt(await gateway.unequip(pieceId));
        },

        refine: async (pieceId) =>
        {
            adoptChange(await gateway.refine(pieceId));
        },

        reroll: async (pieceId, affix) =>
        {
            adoptChange(await gateway.reroll(pieceId, affix));
        },

        sell: async (pieceId) =>
        {
            adoptChange(await gateway.sell(pieceId));
        },

        //  A piece the backend dropped joins the list at once, without another request; one sold because the bag was full does not
        applyDrop: (drop) =>
        {
            if (loading)
            {
                droppedWhileLoading = true;
            }

            if (!loaded || drop.sold)
            {
                return;
            }

            pieces = applyEquipmentDrop(pieces, drop);
            changed();
        }
    };
};
