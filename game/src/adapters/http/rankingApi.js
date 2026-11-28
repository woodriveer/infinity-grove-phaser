//  Wraps the backend RankingController (/rankings, spec rankings). Both calls carry the Bearer token through httpClient.
//  get(board, chapter) -> { board, chapter, entries: [ { position, username, value } ], me: { position, username, value } | null };
//    `chapter` is sent only for boss-time. recordClickPower() -> { value, best }. A failure rejects with an ApiError.
export const createRankingApi = (httpClient) => ({
    get: async (board, chapter) => (await httpClient.get(board === 'boss-time' ? `/rankings/boss-time?chapter=${chapter}` : `/rankings/${board}`)).data,
    recordClickPower: async () => (await httpClient.post('/rankings/click-power')).data
});
