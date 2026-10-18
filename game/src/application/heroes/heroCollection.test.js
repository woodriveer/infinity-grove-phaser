import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeroCollection } from './heroCollection';
import { ApiError } from '../ApiError';

const hero = (id, copies = {}, extra = {}) => ({
    id, name: `Hero ${id}`, owned: Object.values(copies).some((n) => n > 0), stars: 0, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies }, ...extra
});

const payload = () => ({ leaderId: 'kael', heroes: [ hero('kael', { 0: 3 }), hero('lyra') ] });

describe('heroCollection', () => {
    let gateway;
    let collection;
    let changes;

    beforeEach(() => {
        gateway = { list: vi.fn().mockResolvedValue(payload()), fuse: vi.fn(), setLeader: vi.fn() };
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
