//  Wraps the backend AutoClickController (/auto-click). All calls carry the Bearer token through httpClient.
//  get -> { level, maxLevel, intervalMs, crystals, next: { level, intervalMs, price } } (next is null at the top level)
//  upgrade(fromLevel) -> the same shape after the upgrade; fromLevel is the level the player saw.
//  A refusal rejects with an ApiError: 400 INVALID_AUTO_CLICK_REQUEST, 409 NOT_ENOUGH_CRYSTALS, AUTO_CLICK_MAX_LEVEL, AUTO_CLICK_LOCKED,
//  AUTO_CLICK_LEVEL_MISMATCH (its body carries the stored state in `autoClick`).
export const createAutoClickApi = (httpClient) => ({
    get: async () => (await httpClient.get('/auto-click')).data,

    upgrade: async (fromLevel) => (await httpClient.post('/auto-click/upgrade', { fromLevel })).data
});
