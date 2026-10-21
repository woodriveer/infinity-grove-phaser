//  Wraps the backend TalentController (/talents). All calls carry the Bearer token through httpClient.
//  list -> { talents: [ { id, branch, label, unit, perLevel, maxLevel, level, value, nextCost } ] } (nextCost is null at the top level)
//  upgrade(talentId, fromLevel) -> { talents: [ the same list ], wallet: { gold, silver, copper } }; fromLevel is the level the player saw.
//  A refusal rejects with an ApiError: 400 INVALID_TALENT_REQUEST, 404 TALENT_NOT_FOUND, 409 NOT_ENOUGH_COPPER, TALENT_LEVEL_MISMATCH, TALENT_MAX_LEVEL.
export const createTalentApi = (httpClient) => ({
    list: async () => (await httpClient.get('/talents')).data,

    upgrade: async (talentId, fromLevel) => (await httpClient.post(`/talents/${encodeURIComponent(talentId)}/upgrade`, { fromLevel })).data
});
