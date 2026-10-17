//  Wraps the backend ProgressController (/progress). Both calls carry the Bearer token through httpClient.
//  get -> { chapter, stage, encounter, phase, completed, definition: { bossHealth, bossTimeLimitMs, stages: [...] } }
//  report(position, outcome) -> the same shape. outcome is 'CLEARED' or 'FAILED'; position is the one being left.
//  A 409 (the position is not the stored one) rejects with an ApiError whose `body.progress` is the stored progress.
export const createProgressApi = (httpClient) => ({
    get: async () => (await httpClient.get('/progress')).data,

    report: async ({ chapter, stage, encounter, phase }, outcome) =>
        (await httpClient.post('/progress/outcome', { chapter, stage, encounter, phase, outcome })).data
});
