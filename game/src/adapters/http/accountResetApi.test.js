import { describe, expect, it, vi } from 'vitest';
import { createAccountResetApi } from './accountResetApi';

describe('accountResetApi', () => {
    it('reset posts the chapter the player saw to /account/reset and returns the response body', async () => {
        const answer = { reward: 3, crystals: 7, resets: 1, progress: { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false } };
        const httpClient = { post: vi.fn().mockResolvedValue({ data: answer }) };

        await expect(createAccountResetApi(httpClient).reset(3)).resolves.toEqual(answer);
        expect(httpClient.post).toHaveBeenCalledWith('/account/reset', { fromChapter: 3 });
    });

    it('legacy reads GET /account/legacy and returns the response body', async () => {
        const answer = { chapters: [ { chapter: 5, percent: 100 } ], best: { chapter: 5, percent: 100 }, afterReset: null };
        const httpClient = { get: vi.fn().mockResolvedValue({ data: answer }) };

        await expect(createAccountResetApi(httpClient).legacy()).resolves.toEqual(answer);
        expect(httpClient.get).toHaveBeenCalledWith('/account/legacy');
    });
});
