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

    describe('transferSet', () => {
        //  The backend rule of equip: the piece goes to the hero and the piece the hero wore in that slot goes back to the bag
        const serverEquip = (state) => async (pieceId, heroId) =>
        {
            const moved = state.find((piece) => piece.id === pieceId);

            state.forEach((piece) =>
            {
                if (piece.heroId === heroId && piece.slot === moved.slot) { piece.heroId = null; }
            });
            moved.heroId = heroId;

            return equipment(...state.map((piece) => ({ ...piece })));
        };
        const worn = (id, slot, heroId) => piece(id, { slot, heroId });

        it('equips each worn piece of the source on the target in the order Arma, Armadura, Anel, Amuleto', async () => {
            const state = [ worn('amulet', 'AMULET', 'kael'), worn('ring', 'RING', 'kael'), worn('weapon', 'WEAPON', 'kael'), worn('armor', 'ARMOR', 'kael') ];

            gateway.list.mockResolvedValue(equipment(...state.map((p) => ({ ...p }))));
            gateway.equip.mockImplementation(serverEquip(state));
            await collection.load();

            await collection.transferSet('kael', 'lyra');

            expect(gateway.equip.mock.calls).toEqual([ [ 'weapon', 'lyra' ], [ 'armor', 'lyra' ], [ 'ring', 'lyra' ], [ 'amulet', 'lyra' ] ]);
            expect(collection.pieces().filter((p) => p.heroId === 'lyra').map((p) => p.id).sort()).toEqual([ 'amulet', 'armor', 'ring', 'weapon' ]);
            expect(collection.pieces().filter((p) => p.heroId === 'kael')).toEqual([]);
        });

        it('sends one request for a source that wears only a ring', async () => {
            const state = [ worn('ring', 'RING', 'kael'), piece('bagged') ];

            gateway.list.mockResolvedValue(equipment(...state.map((p) => ({ ...p }))));
            gateway.equip.mockImplementation(serverEquip(state));
            await collection.load();

            await collection.transferSet('kael', 'lyra');

            expect(gateway.equip).toHaveBeenCalledTimes(1);
            expect(gateway.equip).toHaveBeenCalledWith('ring', 'lyra');
        });

        it('sends the piece the target wore in the same slot back to the bag', async () => {
            const state = [ worn('kaelRing', 'RING', 'kael'), worn('lyraRing', 'RING', 'lyra') ];

            gateway.list.mockResolvedValue(equipment(...state.map((p) => ({ ...p }))));
            gateway.equip.mockImplementation(serverEquip(state));
            await collection.load();

            await collection.transferSet('kael', 'lyra');

            expect(collection.pieces().find((p) => p.id === 'kaelRing').heroId).toBe('lyra');
            expect(collection.pieces().find((p) => p.id === 'lyraRing').heroId).toBeNull();
        });

        it('fires onChange once per piece moved', async () => {
            const state = [ worn('weapon', 'WEAPON', 'kael'), worn('ring', 'RING', 'kael') ];

            gateway.list.mockResolvedValue(equipment(...state.map((p) => ({ ...p }))));
            gateway.equip.mockImplementation(serverEquip(state));
            await collection.load();
            changes.mockClear();

            await collection.transferSet('kael', 'lyra');

            expect(changes).toHaveBeenCalledTimes(2);
        });

        it('stops at the first failure, reads the list again and rejects', async () => {
            const state = [ worn('weapon', 'WEAPON', 'kael'), worn('armor', 'ARMOR', 'kael'), worn('ring', 'RING', 'kael') ];
            const ok = serverEquip(state);

            gateway.list.mockResolvedValue(equipment(...state.map((p) => ({ ...p }))));
            gateway.equip.mockImplementationOnce(ok).mockRejectedValueOnce(new ApiError('down', { status: 500 }));
            await collection.load();

            await expect(collection.transferSet('kael', 'lyra')).rejects.toThrow('down');

            expect(gateway.equip).toHaveBeenCalledTimes(2);
            expect(gateway.list).toHaveBeenCalledTimes(2);
        });

        it('still rejects with the failure when the list cannot be read again either', async () => {
            const state = [ worn('weapon', 'WEAPON', 'kael') ];

            gateway.list.mockResolvedValueOnce(equipment(...state.map((p) => ({ ...p }))));
            await collection.load();
            gateway.equip.mockRejectedValue(new ApiError('Hero not owned', { status: 409, code: 'HERO_NOT_OWNED' }));
            gateway.list.mockRejectedValue(new ApiError('down', { status: 500 }));

            await expect(collection.transferSet('kael', 'lyra')).rejects.toMatchObject({ code: 'HERO_NOT_OWNED' });
        });

        it('sends nothing for a source that wears nothing and for the same hero', async () => {
            gateway.list.mockResolvedValue(equipment(piece('bagged'), worn('ring', 'RING', 'kael')));
            await collection.load();

            await collection.transferSet('vex', 'lyra');
            await collection.transferSet('kael', 'kael');

            expect(gateway.equip).not.toHaveBeenCalled();
        });
    });
});
