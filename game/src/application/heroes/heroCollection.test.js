import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeroCollection } from './heroCollection';
import { ApiError } from '../ApiError';
import { LOCKED_TEAM } from '../../domain/heroes/team';

const hero = (id, copies = {}, extra = {}) => ({
    id, name: `Hero ${id}`, owned: Object.values(copies).some((n) => n > 0), stars: 0, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies }, ...extra
});

const payload = () => ({ leaderId: 'kael', heroes: [ hero('kael', { 0: 3 }), hero('lyra') ] });

describe('heroCollection', () => {
    let gateway;
    let collection;
    let changes;

    beforeEach(() => {
        gateway = { list: vi.fn().mockResolvedValue(payload()), fuse: vi.fn(), fuseAll: vi.fn(), setLeader: vi.fn() };
        collection = createHeroCollection({ gateway });
        changes = vi.fn();
        collection.onChange(changes);
    });

    describe('load', () => {
        it('stores the heroes and the leader and fires onChange once', async () => {
            await collection.load();

            expect(collection.loaded).toBe(true);
            expect(collection.heroes()).toEqual(payload().heroes);
            expect(collection.leaderId()).toBe('kael');
            expect(collection.leader()).toEqual(payload().heroes[0]);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('has no heroes and no leader before it loads', () => {
            expect(collection.loaded).toBe(false);
            expect(collection.heroes()).toEqual([]);
            expect(collection.leader()).toBeNull();
        });

        it('sends one request while another is in flight', async () => {
            await Promise.all([ collection.load(), collection.load() ]);

            expect(gateway.list).toHaveBeenCalledTimes(1);
        });

        it('rejects and keeps the previous state when the backend fails, and loads on a later call', async () => {
            await collection.load();
            changes.mockClear();
            gateway.list.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));

            await expect(collection.load()).rejects.toBeInstanceOf(ApiError);

            expect(collection.heroes()).toEqual(payload().heroes);
            expect(changes).not.toHaveBeenCalled();

            gateway.list.mockResolvedValueOnce({ leaderId: 'lyra', heroes: [ hero('lyra', { 0: 1 }) ] });
            await collection.load();

            expect(collection.leaderId()).toBe('lyra');
        });
    });

    describe('fuse', () => {
        it('asks the backend, replaces that hero with the answer and fires onChange', async () => {
            await collection.load();
            changes.mockClear();
            const fused = hero('kael', { 1: 1 }, { stars: 1, owned: true });
            gateway.fuse.mockResolvedValue(fused);

            await expect(collection.fuse('kael', 0)).resolves.toEqual(fused);

            expect(gateway.fuse).toHaveBeenCalledWith('kael', 0);
            expect(collection.heroes()).toEqual([ fused, payload().heroes[1] ]);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('rejects and leaves the bag unchanged when the backend refuses', async () => {
            await collection.load();
            changes.mockClear();
            gateway.fuse.mockRejectedValue(new ApiError('Fewer than 3 cards', { status: 409 }));

            await expect(collection.fuse('kael', 1)).rejects.toBeInstanceOf(ApiError);

            expect(collection.heroes()).toEqual(payload().heroes);
            expect(changes).not.toHaveBeenCalled();
        });
    });

    describe('fuseAll', () => {
        it('fuseAll replaces the hero, fires the listeners and resolves with hero and fusions', async () => {
            await collection.load();
            changes.mockClear();
            const fused = hero('kael', { 1: 1 }, { stars: 1, owned: true });
            gateway.fuseAll.mockResolvedValue({ hero: fused, fusions: 1 });

            await expect(collection.fuseAll('kael')).resolves.toEqual({ hero: fused, fusions: 1 });

            expect(gateway.fuseAll).toHaveBeenCalledWith('kael');
            expect(collection.heroes()[0].stars).toBe(1);
            expect(collection.heroes()).toEqual([ fused, payload().heroes[1] ]);
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('fuseAll that fails keeps the heroes and fires nothing', async () => {
            await collection.load();
            changes.mockClear();
            const error = new ApiError('Nothing to fuse', { status: 409, code: 'NOTHING_TO_FUSE' });
            gateway.fuseAll.mockRejectedValue(error);

            await expect(collection.fuseAll('kael')).rejects.toBe(error);

            expect(collection.heroes()).toEqual(payload().heroes);
            expect(changes).not.toHaveBeenCalled();
        });
    });

    describe('setLeader', () => {
        it('changes the leader after the backend accepts it and fires onChange', async () => {
            await collection.load();
            changes.mockClear();
            gateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });

            await collection.setLeader('lyra');

            expect(gateway.setLeader).toHaveBeenCalledWith('lyra');
            expect(collection.leaderId()).toBe('lyra');
            expect(changes).toHaveBeenCalledTimes(1);
        });

        it('keeps the old leader when the backend refuses', async () => {
            await collection.load();
            changes.mockClear();
            gateway.setLeader.mockRejectedValue(new ApiError('Hero is not owned', { status: 409 }));

            await expect(collection.setLeader('lyra')).rejects.toBeInstanceOf(ApiError);

            expect(collection.leaderId()).toBe('kael');
            expect(changes).not.toHaveBeenCalled();
        });
    });

    describe('applyDrop', () => {
        it('adds the blank card locally without a request and fires onChange', async () => {
            await collection.load();
            changes.mockClear();

            collection.applyDrop({ heroId: 'lyra', heroName: 'Hero lyra', stars: 0 });

            expect(collection.heroes()[1]).toMatchObject({ owned: true, copies: { 0: 1 } });
            expect(gateway.list).toHaveBeenCalledTimes(1);
            expect(changes).toHaveBeenCalledTimes(1);
        });
    });
});

describe('heroCollection team', () => {
    const PRICES = [ 10000, 20000, 30000, 40000 ];
    const teamOf = (overrides = {}) => ({ unlocked: true, openSlots: 1, boughtSlots: 1, slotPrices: PRICES, allies: [ 'lyra', null, null, null ], ...overrides });
    let gateway;
    let collection;
    let changes;

    beforeEach(() => {
        gateway = {
            list: vi.fn().mockResolvedValue({ ...payload(), team: teamOf() }),
            fuse: vi.fn(), fuseAll: vi.fn(), setLeader: vi.fn(), setTeam: vi.fn(), buySlot: vi.fn()
        };
        collection = createHeroCollection({ gateway });
        changes = vi.fn();
        collection.onChange(changes);
    });

    it('team is the locked team before the load', () => {
        expect(collection.team()).toEqual(LOCKED_TEAM);
    });

    it('load stores the team of the payload', async () => {
        await collection.load();

        expect(collection.team()).toEqual(teamOf());
    });

    it('load of a payload without team gives the locked team', async () => {
        gateway.list.mockResolvedValue(payload());

        await collection.load();

        expect(collection.team()).toEqual(LOCKED_TEAM);
    });

    it('setTeam stores the leader and the team of the answer and fires onChange once', async () => {
        await collection.load();
        changes.mockClear();
        const answer = { leaderId: 'kael', team: teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] }) };
        gateway.setTeam.mockResolvedValue(answer);

        await expect(collection.setTeam([ 'lyra', 'orina', null, null ])).resolves.toEqual(answer.team);

        expect(gateway.setTeam).toHaveBeenCalledWith([ 'lyra', 'orina', null, null ]);
        expect(collection.team()).toEqual(answer.team);
        expect(collection.leaderId()).toBe('kael');
        expect(changes).toHaveBeenCalledTimes(1);
    });

    it('setTeam that fails keeps the team and fires nothing', async () => {
        await collection.load();
        changes.mockClear();
        gateway.setTeam.mockRejectedValue(new ApiError('Locked', { status: 409, code: 'TEAM_LOCKED' }));

        await expect(collection.setTeam([ null, null, null, null ])).rejects.toBeInstanceOf(ApiError);

        expect(collection.team()).toEqual(teamOf());
        expect(changes).not.toHaveBeenCalled();
    });

    it('buySlot stores the team, hands the wallet to the wallet listeners, fires onChange and resolves with team and wallet', async () => {
        await collection.load();
        changes.mockClear();
        const wallet = { gold: 0, silver: 50, copper: 0 };
        const bought = teamOf({ openSlots: 2, boughtSlots: 2, allies: [ 'lyra', null, null, null ] });
        const walletListener = vi.fn();
        collection.onWallet(walletListener);
        gateway.buySlot.mockResolvedValue({ team: bought, wallet });

        await expect(collection.buySlot(1)).resolves.toEqual({ team: bought, wallet });

        expect(gateway.buySlot).toHaveBeenCalledWith(1);
        expect(collection.team()).toEqual(bought);
        expect(walletListener).toHaveBeenCalledWith(wallet);
        expect(changes).toHaveBeenCalledTimes(1);
    });

    it('buySlot that fails keeps the team and fires no listener', async () => {
        await collection.load();
        changes.mockClear();
        const walletListener = vi.fn();
        collection.onWallet(walletListener);
        gateway.buySlot.mockRejectedValue(new ApiError('Not enough copper', { status: 409, code: 'NOT_ENOUGH_COPPER' }));

        await expect(collection.buySlot(1)).rejects.toBeInstanceOf(ApiError);

        expect(collection.team()).toEqual(teamOf());
        expect(walletListener).not.toHaveBeenCalled();
        expect(changes).not.toHaveBeenCalled();
    });

    it('setLeader stores the team of the answer', async () => {
        await collection.load();
        const swapped = teamOf({ allies: [ 'kael', null, null, null ] });
        gateway.setLeader.mockResolvedValue({ leaderId: 'lyra', team: swapped });

        await collection.setLeader('lyra');

        expect(collection.leaderId()).toBe('lyra');
        expect(collection.team()).toEqual(swapped);
    });

    it('setLeader of an answer without team keeps the team', async () => {
        await collection.load();
        gateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });

        await collection.setLeader('lyra');

        expect(collection.leaderId()).toBe('lyra');
        expect(collection.team()).toEqual(teamOf());
    });
});
