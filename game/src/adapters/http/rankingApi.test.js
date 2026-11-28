import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRankingApi } from './rankingApi';

describe('rankingApi', () =>
{
    const httpClient = { get: vi.fn(), post: vi.fn() };
    const rankingApi = createRankingApi(httpClient);

    beforeEach(() =>
    {
        httpClient.get.mockReset();
        httpClient.post.mockReset();
    });

    it('get of the boss board asks the chapter', async () =>
    {
        const answer = { board: 'boss-time', chapter: 3, entries: [], me: null };
        httpClient.get.mockResolvedValue({ data: answer });

        await expect(rankingApi.get('boss-time', 3)).resolves.toEqual(answer);
        expect(httpClient.get).toHaveBeenCalledWith('/rankings/boss-time?chapter=3');
    });

    it('get of another board sends no chapter', async () =>
    {
        httpClient.get.mockResolvedValue({ data: {} });

        await rankingApi.get('fortune', 3);
        await rankingApi.get('story-time');
        await rankingApi.get('click-power');

        expect(httpClient.get.mock.calls.map((call) => call[0])).toEqual([
            '/rankings/fortune', '/rankings/story-time', '/rankings/click-power'
        ]);
    });

    it('recordClickPower posts with no body', async () =>
    {
        httpClient.post.mockResolvedValue({ data: { value: 1, best: 1 } });

        await expect(rankingApi.recordClickPower()).resolves.toEqual({ value: 1, best: 1 });
        expect(httpClient.post.mock.calls).toEqual([ [ '/rankings/click-power' ] ]);
    });

    it('a failure rejects', async () =>
    {
        const error = new Error('x');
        httpClient.get.mockRejectedValue(error);

        await expect(rankingApi.get('fortune')).rejects.toBe(error);
    });
});
