//  Wraps the backend TalentController (/talents). All calls carry the Bearer token through httpClient.
//  list -> { talents: [ { id, branch, label, unit, perLevel, maxLevel, level, value, nextCost } ], points: { earned, spent, available } }
//  (nextCost is the cost of the next level in talent points, null at the top level)
//  upgrade(talentId, fromLevel, levels = 1) -> { talents, points } as list does; fromLevel is the level the player saw. The body holds `levels` only for 2 or more
//  (spec ui-polish UIP-09); a backend that ignores it buys one level.
//  reset() -> { talents, points } as list does, every level taken back and the points earned all available again.
//  A refusal rejects with an ApiError: 400 INVALID_TALENT_REQUEST, 404 TALENT_NOT_FOUND, 409 NOT_ENOUGH_TALENT_POINTS, TALENT_LEVEL_MISMATCH, TALENT_MAX_LEVEL.
export const createTalentApi = (httpClient) => ({
    list: async () => (await httpClient.get('/talents')).data,

    reset: async () => (await httpClient.post('/talents/reset')).data,

    upgrade: async (talentId, fromLevel, levels = 1) =>
        (await httpClient.post(`/talents/${encodeURIComponent(talentId)}/upgrade`, levels === 1 ? { fromLevel } : { fromLevel, levels })).data
});
