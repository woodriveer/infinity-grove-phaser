import { describe, expect, it, vi } from 'vitest';
import { createAccountResetApi } from './accountResetApi';

describe('accountResetApi', () => {
    it('reset posts the chapter the player saw to /account/reset and returns the response body', async () => {
        const answer = { reward: 3, crystals: 7, resets: 1, progress: { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false } };
        const httpClient = { post: vi.fn().mockResolvedValue({ data: answer }) };

        await expect(createAccountResetApi(httpClient).reset(3)).resolves.toEqual(answer);
        expect(httpClient.post).toHaveBeenCalledWith('/account/reset', { fromChapter: 3 });
    });
});
