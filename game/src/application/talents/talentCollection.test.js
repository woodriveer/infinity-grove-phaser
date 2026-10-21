import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../ApiError';
import { createTalentCollection } from './talentCollection';

const talent = (id, level = 0, extra = {}) => ({ id, level, value: level * 3, nextCost: 300, ...extra });
const wallet = { gold: 0, silver: 1, copper: 0 };

describe('talentCollection', () => {
    let gateway;
    let collection;
    let changes;
    let wallets;

    beforeEach(() => {
        gateway = {
            list: vi.fn().mockResolvedValue({ talents: [ talent('CLICK_DAMAGE'), talent('CRIT_CHANCE', 4) ] }),
            upgrade: vi.fn()
        };
        collection = createTalentCollection({ gateway });
        changes = vi.fn();
        wallets = vi.fn();
        collection.onChange(changes);
        collection.onWallet(wallets);
    });

    describe('load', () => {
        it('is empty and not loaded at first', () => {
            expect(collection.loaded).toBe(false);
            expect(collection.talents()).toEqual([]);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(0);
        });

        it('stores the tree and fires onChange once', async () => {
            await collection.load();

            expect(collection.loaded).toBe(true);
            expect(collection.talents().map(({ id }) => id)).toEqual([ 'CLICK_DAMAGE', 'CRIT_CHANCE' ]);
            expect(collection.levelOf('CRIT_CHANCE')).toBe(4);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('starts no second request while one is pending', async () => {
            await Promise.all([ collection.load(), collection.load() ]);

            expect(gateway.list).toHaveBeenCalledTimes(1);
        });

        it('rejects and keeps the tree it had when the backend cannot be reached', async () => {
            await collection.load();
            gateway.list.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.load()).rejects.toThrow('down');

            expect(collection.talents()).toHaveLength(2);
        });

        it('can try again after a failure', async () => {
            gateway.list.mockRejectedValueOnce(new ApiError('down', { status: 500 }));

            await expect(collection.load()).rejects.toThrow('down');
            await collection.load();

            expect(collection.loaded).toBe(true);
        });
    });

    describe('upgrade', () => {
        it('sends the level the player saw, adopts the tree and tells the wallet', async () => {
            await collection.load();
            gateway.upgrade.mockResolvedValue({ talents: [ talent('CLICK_DAMAGE', 1), talent('CRIT_CHANCE', 4) ], wallet });

            await collection.upgrade('CLICK_DAMAGE', 0);

            expect(gateway.upgrade).toHaveBeenCalledWith('CLICK_DAMAGE', 0);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(1);
            expect(wallets).toHaveBeenCalledWith(wallet);
            expect(changes).toHaveBeenCalledTimes(2);
        });

        it('reads the tree again after a 409 and still rejects with the refusal', async () => {
            await collection.load();
            gateway.upgrade.mockRejectedValue(new ApiError('Mismatch', { status: 409, code: 'TALENT_LEVEL_MISMATCH' }));
            gateway.list.mockResolvedValue({ talents: [ talent('CLICK_DAMAGE', 2), talent('CRIT_CHANCE', 4) ] });

            await expect(collection.upgrade('CLICK_DAMAGE', 0)).rejects.toMatchObject({ code: 'TALENT_LEVEL_MISMATCH' });

            expect(gateway.list).toHaveBeenCalledTimes(2);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(2);
            expect(wallets).not.toHaveBeenCalled();
        });

        it('still rejects with the refusal when the reload after a 409 fails too', async () => {
            await collection.load();
            gateway.upgrade.mockRejectedValue(new ApiError('Not enough', { status: 409, code: 'NOT_ENOUGH_COPPER' }));
            gateway.list.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.upgrade('CLICK_DAMAGE', 0)).rejects.toMatchObject({ code: 'NOT_ENOUGH_COPPER' });
        });

        it('does not reload after another failure and keeps the tree', async () => {
            await collection.load();
            gateway.upgrade.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.upgrade('CLICK_DAMAGE', 0)).rejects.toThrow('down');

            expect(gateway.list).toHaveBeenCalledTimes(1);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(0);
            expect(wallets).not.toHaveBeenCalled();
        });
    });
});
