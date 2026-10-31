//  Wraps the backend EquipmentController (/equipment). All calls carry the Bearer token through httpClient.
//  list -> { capacity, pieces: [ { id, slot, rarity, refine, clickDamage?, affixes: [ { type, value } ], heroId?, refineCost?, rerollCost?, sellPrice } ] }
//  equip(pieceId, heroId) and unequip(pieceId) -> the same body.
//  refine(pieceId), reroll(pieceId, affix) and sell(pieceId) -> { equipment: <the same body>, wallet: { gold, silver, copper } }.
//  sellMany([pieceId]) -> { equipment, wallet, sold, earned }: one sale of every listed piece (all or nothing).
//  A refusal rejects with an ApiError: 404 EQUIPMENT_NOT_FOUND, 409 HERO_NOT_OWNED, NOT_ENOUGH_COPPER, MAX_REFINE, REFINE_TOO_LOW, 400 INVALID_AFFIX, INVALID_SELL_BATCH.
export const createEquipmentApi = (httpClient) =>
{
    const path = (pieceId, action) => `/equipment/${encodeURIComponent(pieceId)}/${action}`;

    return {
        list: async () => (await httpClient.get('/equipment')).data,

        equip: async (pieceId, heroId) => (await httpClient.post(path(pieceId, 'equip'), { heroId })).data,

        unequip: async (pieceId) => (await httpClient.post(path(pieceId, 'unequip'))).data,

        refine: async (pieceId) => (await httpClient.post(path(pieceId, 'refine'))).data,

        reroll: async (pieceId, affix) => (await httpClient.post(path(pieceId, 'reroll'), { affix })).data,

        sell: async (pieceId) => (await httpClient.post(path(pieceId, 'sell'))).data,

        sellMany: async (pieceIds) => (await httpClient.post('/equipment/sell', { pieceIds })).data
    };
};
