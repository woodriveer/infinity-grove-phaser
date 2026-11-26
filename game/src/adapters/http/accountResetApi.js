//  Wraps the backend AccountResetController (/account). The call carries the Bearer token through httpClient.
//  reset(fromChapter) -> { reward, crystals, resets, progress } where progress has the shape of GET /progress; fromChapter is the chapter
//  the player saw. A refusal rejects with an ApiError: 400 INVALID_RESET_REQUEST, 409 RESET_LOCKED, RESET_CHAPTER_MISMATCH (its body
//  carries the stored progress in `progress`). The success answer also carries `legacy`.
//  legacy() -> { chapters: [{ chapter, percent }], best, afterReset } (spec reset-legacy-drops); an old backend answers 404.
export const createAccountResetApi = (httpClient) => ({
    reset: async (fromChapter) => (await httpClient.post('/account/reset', { fromChapter })).data,
    legacy: async () => (await httpClient.get('/account/legacy')).data
});
