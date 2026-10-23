import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTalentApi } from './talentApi';

const talents = [ { id: 'CLICK_DAMAGE', branch: 'POWER', label: 'Dano de clique', unit: '%', perLevel: 3, maxLevel: 10, level: 0, value: 0, nextCost: 300 } ];

describe('talentApi', () => {
    const httpClient = { get: vi.fn(), post: vi.fn() };
    const talentApi = createTalentApi(httpClient);

    beforeEach(() => {
        httpClient.get.mockReset();
        httpClient.post.mockReset();
    });

    it('list calls GET /talents and returns the response body', async () => {
        httpClient.get.mockResolvedValue({ data: { talents } });

        await expect(talentApi.list()).resolves.toEqual({ talents });
        expect(httpClient.get).toHaveBeenCalledWith('/talents');
    });

    it('upgrade posts the level the player saw to /talents/{id}/upgrade and returns the tree with the wallet', async () => {
        const change = { talents, wallet: { gold: 0, silver: 0, copper: 0 } };

        httpClient.post.mockResolvedValue({ data: change });

        await expect(talentApi.upgrade('CLICK_DAMAGE', 0)).resolves.toEqual(change);
        expect(httpClient.post).toHaveBeenCalledWith('/talents/CLICK_DAMAGE/upgrade', { fromLevel: 0 });
    });

    it('reset posts to /talents/reset and returns the tree', async () => {
        httpClient.post.mockResolvedValue({ data: { talents } });

        await expect(talentApi.reset()).resolves.toEqual({ talents });
        expect(httpClient.post).toHaveBeenCalledWith('/talents/reset');
    });

    it('sends a fromLevel of 0 as 0, not as a missing field', async () => {
        httpClient.post.mockResolvedValue({ data: { talents, wallet: {} } });

        await talentApi.upgrade('CRIT_CHANCE', 0);

        expect(httpClient.post.mock.calls[0][1]).toStrictEqual({ fromLevel: 0 });
    });

    it('lets a refusal reject', async () => {
        httpClient.post.mockRejectedValue(new Error('409'));

        await expect(talentApi.upgrade('CLICK_DAMAGE', 0)).rejects.toThrow('409');
    });
});
