import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEquipmentApi } from './equipmentApi';

const equipment = { capacity: 100, pieces: [ { id: 'p1', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [], sellPrice: 100 } ] };
const change = { equipment, wallet: { gold: 0, silver: 1, copper: 0 } };

describe('equipmentApi', () => {
    const httpClient = { get: vi.fn(), post: vi.fn() };
    const equipmentApi = createEquipmentApi(httpClient);

    beforeEach(() => {
        httpClient.get.mockReset();
        httpClient.post.mockReset();
    });

    it('list calls GET /equipment and returns the response body', async () => {
        httpClient.get.mockResolvedValue({ data: equipment });

        await expect(equipmentApi.list()).resolves.toEqual(equipment);
        expect(httpClient.get).toHaveBeenCalledWith('/equipment');
    });

    it('equip posts the hero id to /equipment/{id}/equip', async () => {
        httpClient.post.mockResolvedValue({ data: equipment });

        await expect(equipmentApi.equip('p1', 'kael')).resolves.toEqual(equipment);
        expect(httpClient.post).toHaveBeenCalledWith('/equipment/p1/equip', { heroId: 'kael' });
    });

    it('unequip posts to /equipment/{id}/unequip without a body', async () => {
        httpClient.post.mockResolvedValue({ data: equipment });

        await expect(equipmentApi.unequip('p1')).resolves.toEqual(equipment);
        expect(httpClient.post).toHaveBeenCalledWith('/equipment/p1/unequip');
    });

    it('refine posts to /equipment/{id}/refine and returns the equipment with the wallet', async () => {
        httpClient.post.mockResolvedValue({ data: change });

        await expect(equipmentApi.refine('p1')).resolves.toEqual(change);
        expect(httpClient.post).toHaveBeenCalledWith('/equipment/p1/refine');
    });

    it('reroll posts the affix index to /equipment/{id}/reroll', async () => {
        httpClient.post.mockResolvedValue({ data: change });

        await expect(equipmentApi.reroll('p1', 2)).resolves.toEqual(change);
        expect(httpClient.post).toHaveBeenCalledWith('/equipment/p1/reroll', { affix: 2 });
    });

    it('sell posts to /equipment/{id}/sell and returns the equipment with the wallet', async () => {
        httpClient.post.mockResolvedValue({ data: change });

        await expect(equipmentApi.sell('p1')).resolves.toEqual(change);
        expect(httpClient.post).toHaveBeenCalledWith('/equipment/p1/sell');
    });

    it('encodes the piece id in the path', async () => {
        httpClient.post.mockResolvedValue({ data: change });

        await equipmentApi.sell('a/b');

        expect(httpClient.post).toHaveBeenCalledWith('/equipment/a%2Fb/sell');
    });

    it('lets a refusal reach the caller', async () => {
        const refusal = Object.assign(new Error('conflict'), { status: 409 });
        httpClient.post.mockRejectedValue(refusal);

        await expect(equipmentApi.refine('p1')).rejects.toBe(refusal);
    });
});
