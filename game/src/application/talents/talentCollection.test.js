import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../ApiError';
import { createTalentCollection } from './talentCollection';

const talent = (id, level = 0, extra = {}) => ({ id, level, value: level * 3, nextCost: 1, ...extra });
const points = (earned, spent) => ({ earned, spent, available: earned - spent });

describe('talentCollection', () => {
    let gateway;
    let collection;
    let changes;

    beforeEach(() => {
        gateway = {
            list: vi.fn().mockResolvedValue({ talents: [ talent('CLICK_DAMAGE'), talent('CRIT_CHANCE', 4) ], points: points(6, 4) }),
            upgrade: vi.fn()
        };
        collection = createTalentCollection({ gateway });
        changes = vi.fn();
        collection.onChange(changes);
    });

    describe('load', () => {
        it('is empty, not loaded and without points at first', () => {
            expect(collection.loaded).toBe(false);
            expect(collection.talents()).toEqual([]);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(0);
            expect(collection.points()).toEqual({ earned: 0, spent: 0, available: 0 });
        });

        it('stores the tree and the points and fires onChange once', async () => {
            await collection.load();

            expect(collection.loaded).toBe(true);
            expect(collection.talents().map(({ id }) => id)).toEqual([ 'CLICK_DAMAGE', 'CRIT_CHANCE' ]);
            expect(collection.levelOf('CRIT_CHANCE')).toBe(4);
            expect(collection.points()).toEqual({ earned: 6, spent: 4, available: 2 });
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
            expect(collection.points().available).toBe(2);
        });

        it('can try again after a failure', async () => {
            gateway.list.mockRejectedValueOnce(new ApiError('down', { status: 500 }));

            await expect(collection.load()).rejects.toThrow('down');
            await collection.load();

            expect(collection.loaded).toBe(true);
        });
    });

    describe('upgrade', () => {
        it('sends the level the player saw and adopts the tree and the points', async () => {
            await collection.load();
            gateway.upgrade.mockResolvedValue({ talents: [ talent('CLICK_DAMAGE', 1), talent('CRIT_CHANCE', 4) ], points: points(6, 5) });

            await collection.upgrade('CLICK_DAMAGE', 0);

            expect(gateway.upgrade).toHaveBeenCalledWith('CLICK_DAMAGE', 0);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(1);
            expect(collection.points()).toEqual({ earned: 6, spent: 5, available: 1 });
            expect(changes).toHaveBeenCalledTimes(2);
        });

        it('reads the tree again after a 409 and still rejects with the refusal', async () => {
            await collection.load();
            gateway.upgrade.mockRejectedValue(new ApiError('Mismatch', { status: 409, code: 'TALENT_LEVEL_MISMATCH' }));
            gateway.list.mockResolvedValue({ talents: [ talent('CLICK_DAMAGE', 2), talent('CRIT_CHANCE', 4) ], points: points(6, 6) });

            await expect(collection.upgrade('CLICK_DAMAGE', 0)).rejects.toMatchObject({ code: 'TALENT_LEVEL_MISMATCH' });

            expect(gateway.list).toHaveBeenCalledTimes(2);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(2);
            expect(collection.points().available).toBe(0);
        });

        it('still rejects with the refusal when the reload after a 409 fails too', async () => {
            await collection.load();
            gateway.upgrade.mockRejectedValue(new ApiError('Not enough', { status: 409, code: 'NOT_ENOUGH_TALENT_POINTS' }));
            gateway.list.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.upgrade('CLICK_DAMAGE', 0)).rejects.toMatchObject({ code: 'NOT_ENOUGH_TALENT_POINTS' });
        });

        it('does not reload after another failure and keeps the tree and the points', async () => {
            await collection.load();
            gateway.upgrade.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.upgrade('CLICK_DAMAGE', 0)).rejects.toThrow('down');

            expect(gateway.list).toHaveBeenCalledTimes(1);
            expect(collection.levelOf('CLICK_DAMAGE')).toBe(0);
            expect(collection.points().available).toBe(2);
        });
    });
});
