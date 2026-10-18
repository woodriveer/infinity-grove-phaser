import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../ApiError';
import { createEquipmentCollection } from './equipmentCollection';

const piece = (id, extra = {}) => ({ id, slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [], sellPrice: 100, ...extra });
const equipment = (...pieces) => ({ capacity: 100, pieces });
const wallet = { gold: 0, silver: 1, copper: 0 };

describe('equipmentCollection', () => {
    let gateway;
    let collection;
    let changes;
    let wallets;

    beforeEach(() => {
        gateway = {
            list: vi.fn().mockResolvedValue(equipment(piece('a'), piece('b'))),
            equip: vi.fn(),
            unequip: vi.fn(),
            refine: vi.fn(),
            reroll: vi.fn(),
            sell: vi.fn()
        };
        collection = createEquipmentCollection({ gateway });
        changes = vi.fn();
        wallets = vi.fn();
        collection.onChange(changes);
        collection.onWallet(wallets);
    });

    describe('load', () => {
        it('is empty and not loaded at first', () => {
            expect(collection.loaded).toBe(false);
            expect(collection.pieces()).toEqual([]);
            expect(collection.capacity()).toBeNull();
        });

        it('stores the pieces and the capacity and fires onChange once', async () => {
            await collection.load();

            expect(collection.loaded).toBe(true);
            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'b' ]);
            expect(collection.capacity()).toBe(100);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('starts no second request while one is pending', async () => {
            await Promise.all([ collection.load(), collection.load() ]);

            expect(gateway.list).toHaveBeenCalledTimes(1);
        });

        it('rejects and keeps what it had when the backend cannot be reached', async () => {
            await collection.load();
            gateway.list.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.load()).rejects.toBeInstanceOf(ApiError);

            expect(collection.loaded).toBe(true);
            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'b' ]);
        });

        it('can be tried again after a failure', async () => {
            gateway.list.mockRejectedValueOnce(new ApiError('down', { status: 500 }));
            await expect(collection.load()).rejects.toBeInstanceOf(ApiError);

            await collection.load();

            expect(collection.loaded).toBe(true);
        });
    });

    describe('equip and unequip', () => {
        beforeEach(async () => {
            await collection.load();
            changes.mockClear();
        });

        it('equip sends the piece and the hero and takes the pieces from the answer', async () => {
            gateway.equip.mockResolvedValue(equipment(piece('a', { heroId: 'kael' }), piece('b')));

            await collection.equip('a', 'kael');

            expect(gateway.equip).toHaveBeenCalledWith('a', 'kael');
            expect(collection.pieces()[0].heroId).toBe('kael');
            expect(changes).toHaveBeenCalledTimes(1);
            expect(wallets).not.toHaveBeenCalled();
        });

        it('unequip sends the piece and takes the pieces from the answer', async () => {
            gateway.unequip.mockResolvedValue(equipment(piece('a'), piece('b')));

            await collection.unequip('a');

            expect(gateway.unequip).toHaveBeenCalledWith('a');
            expect(collection.pieces()[0].heroId).toBeUndefined();
        });

        it('a refusal rejects and changes nothing', async () => {
            gateway.equip.mockRejectedValue(new ApiError('conflict', { status: 409 }));

            await expect(collection.equip('a', 'vex')).rejects.toBeInstanceOf(ApiError);

            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'b' ]);
            expect(changes).not.toHaveBeenCalled();
        });
    });

    describe('refine, reroll and sell', () => {
        beforeEach(async () => {
            await collection.load();
            changes.mockClear();
        });

        it('refine takes the pieces from the answer and reports the wallet', async () => {
            gateway.refine.mockResolvedValue({ equipment: equipment(piece('a', { refine: 1 }), piece('b')), wallet });

            await collection.refine('a');

            expect(gateway.refine).toHaveBeenCalledWith('a');
            expect(collection.pieces()[0].refine).toBe(1);
            expect(wallets).toHaveBeenCalledWith(wallet);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('reroll sends the affix index, takes the pieces and reports the wallet', async () => {
            gateway.reroll.mockResolvedValue({ equipment: equipment(piece('a', { refine: 5 }), piece('b')), wallet });

            await collection.reroll('a', 1);

            expect(gateway.reroll).toHaveBeenCalledWith('a', 1);
            expect(collection.pieces()[0].refine).toBe(5);
            expect(wallets).toHaveBeenCalledWith(wallet);
        });

        it('sell drops the piece from the list and reports the wallet', async () => {
            gateway.sell.mockResolvedValue({ equipment: equipment(piece('b')), wallet });

            await collection.sell('a');

            expect(gateway.sell).toHaveBeenCalledWith('a');
            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'b' ]);
            expect(wallets).toHaveBeenCalledWith(wallet);
        });

        it('a refusal rejects, reports no wallet and changes nothing', async () => {
            gateway.refine.mockRejectedValue(new ApiError('conflict', { status: 409 }));

            await expect(collection.refine('a')).rejects.toBeInstanceOf(ApiError);

            expect(wallets).not.toHaveBeenCalled();
            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'b' ]);
            expect(changes).not.toHaveBeenCalled();
        });
    });

    describe('applyDrop', () => {
        it('adds a dropped piece to the list at once and fires onChange', async () => {
            await collection.load();
            changes.mockClear();

            collection.applyDrop({ piece: piece('c'), sold: false });

            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'b', 'c' ]);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('adds nothing for a piece that was sold because the bag was full', async () => {
            await collection.load();
            changes.mockClear();

            collection.applyDrop({ piece: piece('c'), sold: true });

            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'b' ]);
            expect(changes).not.toHaveBeenCalled();
        });

        it('leaves the list alone before it has loaded (the load brings the piece)', () => {
            collection.applyDrop({ piece: piece('c'), sold: false });

            expect(collection.pieces()).toEqual([]);
            expect(changes).not.toHaveBeenCalled();
        });

        it('loads again when a piece dropped while the list was on its way', async () => {
            gateway.list
                .mockResolvedValueOnce(equipment(piece('a')))
                .mockResolvedValueOnce(equipment(piece('a'), piece('c')));
            const loading = collection.load();

            collection.applyDrop({ piece: piece('c'), sold: false });
            await loading;

            expect(gateway.list).toHaveBeenCalledTimes(2);
            expect(collection.pieces().map(({ id }) => id)).toEqual([ 'a', 'c' ]);
        });
    });
});
