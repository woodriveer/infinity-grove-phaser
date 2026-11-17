import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeroesApi } from './heroesApi';
import { ApiError } from '../../application/ApiError';

const hero = { id: 'kael', name: 'Kael Raizférrea', stars: 1, copies: { 0: 0, 1: 1, 2: 0, 3: 0 } };
const heroes = { leaderId: 'kael', heroes: [ hero ] };

describe('heroesApi', () => {
    const httpClient = { get: vi.fn(), post: vi.fn(), put: vi.fn() };
    const heroesApi = createHeroesApi(httpClient);

    beforeEach(() => {
        httpClient.get.mockReset();
        httpClient.post.mockReset();
        httpClient.put.mockReset();
    });

    it('list calls GET /heroes and returns the response body', async () => {
        httpClient.get.mockResolvedValue({ data: heroes });

        await expect(heroesApi.list()).resolves.toEqual(heroes);
        expect(httpClient.get).toHaveBeenCalledWith('/heroes');
    });

    it('fuse posts the stars to /heroes/{id}/fuse and returns the hero', async () => {
        httpClient.post.mockResolvedValue({ data: hero });

        await expect(heroesApi.fuse('kael', 0)).resolves.toEqual(hero);
        expect(httpClient.post).toHaveBeenCalledWith('/heroes/kael/fuse', { stars: 0 });
    });

    it('fuse encodes the hero id in the path', async () => {
        httpClient.post.mockResolvedValue({ data: hero });

        await heroesApi.fuse('a/b', 2);

        expect(httpClient.post).toHaveBeenCalledWith('/heroes/a%2Fb/fuse', { stars: 2 });
    });

    it('fuseAll posts an empty body to /heroes/<id>/fuse-all and resolves with hero and fusions', async () => {
        httpClient.post.mockResolvedValue({ data: { hero: { id: 'kael', stars: 3 }, fusions: 22 } });

        await expect(heroesApi.fuseAll('kael')).resolves.toEqual({ hero: { id: 'kael', stars: 3 }, fusions: 22 });
        expect(httpClient.post).toHaveBeenCalledWith('/heroes/kael/fuse-all', {});
    });

    it('fuseAll encodes the hero id', async () => {
        httpClient.post.mockResolvedValue({ data: { hero, fusions: 1 } });

        await heroesApi.fuseAll('a b');

        expect(httpClient.post).toHaveBeenCalledWith('/heroes/a%20b/fuse-all', {});
    });

    it('fuseAll rejects with the error of the client', async () => {
        const error = new ApiError('x', { status: 409, code: 'NOTHING_TO_FUSE' });
        httpClient.post.mockRejectedValue(error);

        await expect(heroesApi.fuseAll('kael')).rejects.toBe(error);
    });

    it('setLeader puts the hero id to /leader and returns the response body', async () => {
        httpClient.put.mockResolvedValue({ data: { leaderId: 'lyra' } });

        await expect(heroesApi.setLeader('lyra')).resolves.toEqual({ leaderId: 'lyra' });
        expect(httpClient.put).toHaveBeenCalledWith('/leader', { heroId: 'lyra' });
    });

    it('propagates errors from the client', async () => {
        const error = new Error('not enough cards');
        httpClient.post.mockImplementation(async () => { throw error; });

        await expect(heroesApi.fuse('kael', 0)).rejects.toThrow('not enough cards');
    });
});
