//  Wraps the backend FarmController (/farm). Both calls carry the Bearer token through httpClient.
//  get(chapter?) -> { chapter, chapters, bosses: [ { kind: 'MINIBOSS', stage } | { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft, definition }
//    (a previous backend answers only bosses and chapterBossWinsLeft); `chapter` is asked for only when given.
//  win({ kind, stage?, chapter? }) -> { drop: { heroId, heroName, stars } | null, chapterBossWinsLeft, equipmentDrop }; boss is one entry of
//    `bosses`; `chapter` is sent only when it is an integer (a boss of another chapter than the campaign's).
//  A 409 (DAILY_LIMIT_REACHED, BOSS_NOT_AVAILABLE, FARM_TOO_FAST) rejects with an ApiError.
export const createFarmApi = (httpClient) => ({
    get: async (chapter) => (await httpClient.get(chapter === undefined ? '/farm' : `/farm?chapter=${chapter}`)).data,

    win: async ({ kind, stage, chapter }) =>
        (await httpClient.post('/farm/outcome', {
            boss: stage === undefined ? { kind } : { kind, stage },
            outcome: 'CLEARED',
            ...(Number.isInteger(chapter) ? { chapter } : {})
        })).data
});
