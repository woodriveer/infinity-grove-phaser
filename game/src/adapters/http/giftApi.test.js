import { describe, expect, it, vi } from 'vitest';
import { createGiftApi } from './giftApi';

describe('giftApi', () => {
    it('claim posts to /gifts/claim with no body and resolves the answer', async () => {
        const answer = { granted: true, gift: 'BLACK_AWARENESS_STAFF', piece: { id: 's' } };
        const httpClient = { post: vi.fn().mockResolvedValue({ data: answer }) };

        await expect(createGiftApi(httpClient).claim()).resolves.toEqual(answer);
        expect(httpClient.post).toHaveBeenCalledTimes(1);
        expect(httpClient.post.mock.calls[0]).toEqual([ '/gifts/claim' ]);
    });

    it('claim rejects when the request fails', async () => {
        const failure = new Error('offline');
        const httpClient = { post: vi.fn().mockRejectedValue(failure) };

        await expect(createGiftApi(httpClient).claim()).rejects.toBe(failure);
    });
});
