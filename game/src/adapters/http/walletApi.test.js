import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWalletApi } from './walletApi';

const httpClient = { get: vi.fn(), post: vi.fn() };
const walletApi = createWalletApi(httpClient);

const walletResponse = {
    wallet: { gold: 1, silver: 2, copper: 3 },
    drops: { 1: [3, 1, 5] }
};

describe('walletApi', () => {
    beforeEach(() => {
        vi.mocked(httpClient.get).mockReset();
        vi.mocked(httpClient.post).mockReset();
    });

    it('get calls GET /wallet with auth and returns the response body', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: walletResponse });

        await expect(walletApi.get()).resolves.toEqual(walletResponse);
        expect(httpClient.get).toHaveBeenCalledWith('/wallet');
    });

    it('sync posts the kills per level to /wallet/sync with auth and returns the response body', async () => {
        const synced = { ...walletResponse, accepted: { 1: 3 } };
        vi.mocked(httpClient.post).mockResolvedValue({ data: synced });

        await expect(walletApi.sync({ 1: 3 })).resolves.toEqual(synced);
        expect(httpClient.post).toHaveBeenCalledWith('/wallet/sync', { kills: { 1: 3 } });
    });

    it('propagates errors from the client on get and sync', async () => {
        const error = new Error('down');
        vi.mocked(httpClient.get).mockImplementation(async () => { throw error; });
        vi.mocked(httpClient.post).mockImplementation(async () => { throw error; });

        await expect(walletApi.get()).rejects.toThrow('down');
        await expect(walletApi.sync({ 1: 1 })).rejects.toThrow('down');
    });
});
