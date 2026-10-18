//  Wraps the backend FarmController (/farm). Both calls carry the Bearer token through httpClient.
//  get -> { bosses: [ { kind: 'MINIBOSS', stage } | { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft }
//  win(boss) -> { drop: { heroId, heroName, stars } | null, chapterBossWinsLeft }; boss is one entry of `bosses`.
//  A 409 (DAILY_LIMIT_REACHED, BOSS_NOT_AVAILABLE, FARM_TOO_FAST) rejects with an ApiError.
export const createFarmApi = (httpClient) => ({
    get: async () => (await httpClient.get('/farm')).data,

    win: async ({ kind, stage }) =>
        (await httpClient.post('/farm/outcome', { boss: stage === undefined ? { kind } : { kind, stage }, outcome: 'CLEARED' })).data
});
