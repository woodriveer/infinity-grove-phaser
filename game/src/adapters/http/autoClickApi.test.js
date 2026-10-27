import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutoClickApi } from './autoClickApi';

const state = { level: 0, maxLevel: 4, intervalMs: 500, crystals: 0, next: { level: 1, intervalMs: 250, price: 10 } };

describe('autoClickApi', () => {
    const httpClient = { get: vi.fn(), post: vi.fn() };
    const autoClickApi = createAutoClickApi(httpClient);

    beforeEach(() => {
        httpClient.get.mockReset();
        httpClient.post.mockReset();
    });

    it('get calls GET /auto-click and returns the response body', async () => {
        httpClient.get.mockResolvedValue({ data: state });

        await expect(autoClickApi.get()).resolves.toEqual(state);
        expect(httpClient.get).toHaveBeenCalledWith('/auto-click');
    });

    it('upgrade posts the level the player saw to /auto-click/upgrade and returns the new state', async () => {
        const upgraded = { ...state, level: 1, intervalMs: 250 };

        httpClient.post.mockResolvedValue({ data: upgraded });

        await expect(autoClickApi.upgrade(0)).resolves.toEqual(upgraded);
        expect(httpClient.post).toHaveBeenCalledWith('/auto-click/upgrade', { fromLevel: 0 });
    });
});
