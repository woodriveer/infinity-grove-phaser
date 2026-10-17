import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWalletSync } from './walletSync';

const flush = () => new Promise((resolve) => setTimeout(resolve));

const walletResponse = (wallet = { gold: 2, silver: 14, copper: 37 }, drops = { 1: [3, 1, 5, 2, 4] }) => ({ wallet, drops });
const synced = (wallet, drops) => ({ wallet, accepted: {}, drops });

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => { resolve = done; reject = fail; });

    return { promise, resolve, reject };
};

describe('walletSync', () => {
    let gateway;
    let wallet;

    beforeEach(() => {
        gateway = { get: vi.fn().mockResolvedValue(walletResponse()), sync: vi.fn() };
        wallet = createWalletSync({ gateway });
    });

    const loaded = async () => {
        await wallet.load();
        return wallet;
    };

    describe('load', () => {
        it('asks the gateway for the wallet and shows its values', async () => {
            await expect(wallet.load()).resolves.toBe(true);

            expect(gateway.get).toHaveBeenCalledTimes(1);
            expect(wallet.loaded).toBe(true);
            expect(wallet.display()).toEqual({ gold: 2, silver: 14, copper: 37 });
        });

        it('is not loaded and resolves false when the gateway fails', async () => {
            gateway.get.mockRejectedValue(new Error('down'));

            await expect(wallet.load()).resolves.toBe(false);

            expect(wallet.loaded).toBe(false);
        });

        it('starts no second request while one is pending', async () => {
            const pending = deferred();
            gateway.get.mockReturnValue(pending.promise);

            wallet.load();
            await expect(wallet.load()).resolves.toBe(false);

            expect(gateway.get).toHaveBeenCalledTimes(1);
        });

        it('drops nothing before the wallet has loaded', () => {
            expect(wallet.takeDrop(1)).toBeNull();
        });
    });

    describe('drops', () => {
        it('takes the queued values of the level in order and none for an unknown level', async () => {
            await loaded();

            expect(wallet.takeDrop(1)).toMatchObject({ value: 3 });
            expect(wallet.takeDrop(1)).toMatchObject({ value: 1 });
            expect(wallet.takeDrop(7)).toBeNull();
        });

        it('adds 1 copper to the display for each coin that lands', async () => {
            await loaded();
            const drop = wallet.takeDrop(1);

            wallet.land(drop.id);
            wallet.land(drop.id);

            expect(wallet.display()).toEqual({ gold: 2, silver: 14, copper: 39 });
        });
    });

    describe('tick', () => {
        it('asks for the wallet again while it has not loaded, and resolves true once it arrives', async () => {
            gateway.get.mockRejectedValueOnce(new Error('down'));
            await wallet.load();

            await expect(wallet.tick()).resolves.toBe(true);

            expect(gateway.get).toHaveBeenCalledTimes(2);
            expect(wallet.loaded).toBe(true);
        });

        it('stops asking for the wallet once it has loaded', async () => {
            await loaded();

            await wallet.tick();

            expect(gateway.get).toHaveBeenCalledTimes(1);
        });

        it('sends nothing and resolves false without unreported kills', async () => {
            await loaded();

            await expect(wallet.tick()).resolves.toBe(false);

            expect(gateway.sync).not.toHaveBeenCalled();
        });

        it('sends the unreported kills of each level', async () => {
            await loaded();
            wallet.takeDrop(1);
            wallet.takeDrop(1);
            gateway.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 41 }, { 1: [5, 2, 4] }));

            await expect(wallet.tick()).resolves.toBe(true);

            expect(gateway.sync).toHaveBeenCalledWith({ 1: 2 });
        });

        it('does not count a kill that dropped nothing', async () => {
            await loaded();
            wallet.takeDrop(9);

            await wallet.tick();

            expect(gateway.sync).not.toHaveBeenCalled();
        });

        it('starts no second sync while one is in flight', async () => {
            await loaded();
            wallet.takeDrop(1);
            const pending = deferred();
            gateway.sync.mockReturnValue(pending.promise);

            wallet.tick();
            wallet.takeDrop(1);
            await wallet.tick();

            expect(gateway.sync).toHaveBeenCalledTimes(1);
        });

        it('sends a kill made during a sync with the next sync, not the current one', async () => {
            await loaded();
            wallet.takeDrop(1);
            const pending = deferred();
            gateway.sync.mockReturnValueOnce(pending.promise);

            wallet.tick();
            wallet.takeDrop(1);
            pending.resolve(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [1, 5, 2, 4] }));
            await flush();
            gateway.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 41 }, { 1: [5, 2, 4] }));
            await wallet.tick();

            expect(gateway.sync).toHaveBeenNthCalledWith(1, { 1: 1 });
            expect(gateway.sync).toHaveBeenNthCalledWith(2, { 1: 1 });
        });

        it('shows the response wallet after a successful sync', async () => {
            await loaded();
            wallet.takeDrop(1);
            gateway.sync.mockResolvedValue(synced({ gold: 3, silver: 0, copper: 5 }, { 1: [1, 5, 2, 4, 3] }));

            await wallet.tick();

            expect(wallet.display()).toEqual({ gold: 3, silver: 0, copper: 5 });
        });

        it('adds the landed coins the response does not cover on top of the response wallet', async () => {
            await loaded();
            const covered = wallet.takeDrop(1);
            const pending = deferred();
            gateway.sync.mockReturnValue(pending.promise);
            const tick = wallet.tick();
            const uncovered = wallet.takeDrop(1);
            wallet.land(covered.id);
            wallet.land(uncovered.id);
            pending.resolve(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [5, 2, 4] }));
            await tick;

            expect(wallet.display()).toEqual({ gold: 2, silver: 14, copper: 41 });
        });

        it('takes the next drops from the server queue after a successful sync', async () => {
            await loaded();
            wallet.takeDrop(1);
            gateway.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [9, 8, 7] }));

            await wallet.tick();

            expect(wallet.takeDrop(1)).toMatchObject({ value: 9 });
        });

        it('skips the drops taken since the request was sent when replacing the queue', async () => {
            await loaded();
            wallet.takeDrop(1);
            const pending = deferred();
            gateway.sync.mockReturnValue(pending.promise);
            const tick = wallet.tick();
            wallet.takeDrop(1);
            pending.resolve(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [9, 8, 7] }));
            await tick;

            expect(wallet.takeDrop(1)).toMatchObject({ value: 8 });
        });

        it('keeps the kills, resolves false and sends the same kills again on the next tick after a failed sync', async () => {
            await loaded();
            wallet.takeDrop(1);
            gateway.sync.mockRejectedValueOnce(new Error('down'));

            await expect(wallet.tick()).resolves.toBe(false);
            gateway.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [1, 5, 2, 4] }));
            await wallet.tick();

            expect(gateway.sync).toHaveBeenNthCalledWith(1, { 1: 1 });
            expect(gateway.sync).toHaveBeenNthCalledWith(2, { 1: 1 });
        });
    });

    describe('syncOnExit', () => {
        it('sends one final sync with the unreported kills', async () => {
            await loaded();
            wallet.takeDrop(1);
            gateway.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [1, 5, 2, 4] }));

            wallet.syncOnExit();

            expect(gateway.sync).toHaveBeenCalledTimes(1);
            expect(gateway.sync).toHaveBeenCalledWith({ 1: 1 });
        });

        it('does not retry the final sync when it fails', async () => {
            await loaded();
            wallet.takeDrop(1);
            gateway.sync.mockRejectedValue(new Error('down'));

            wallet.syncOnExit();
            await flush();

            expect(gateway.sync).toHaveBeenCalledTimes(1);
        });

        it('sends nothing without unreported kills', async () => {
            await loaded();

            wallet.syncOnExit();

            expect(gateway.sync).not.toHaveBeenCalled();
        });
    });
});
