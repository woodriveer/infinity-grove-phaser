import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFarmApi } from './farmApi';

const state = { bosses: [ { kind: 'MINIBOSS', stage: 1 }, { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft: 10 };

describe('farmApi', () => {
    const httpClient = { get: vi.fn(), post: vi.fn() };
    const farmApi = createFarmApi(httpClient);

    beforeEach(() => {
        httpClient.get.mockReset();
        httpClient.post.mockReset();
    });

    it('get calls GET /farm and returns the response body', async () => {
        httpClient.get.mockResolvedValue({ data: state });

        await expect(farmApi.get()).resolves.toEqual(state);
        expect(httpClient.get).toHaveBeenCalledWith('/farm');
    });

    it('win posts a miniboss with its stage and the CLEARED outcome to /farm/outcome', async () => {
        const result = { drop: { heroId: 'kael', heroName: 'Kael Raizférrea', stars: 0 }, chapterBossWinsLeft: 10 };
        httpClient.post.mockResolvedValue({ data: result });

        await expect(farmApi.win({ kind: 'MINIBOSS', stage: 3 })).resolves.toEqual(result);
        expect(httpClient.post).toHaveBeenCalledWith('/farm/outcome', { boss: { kind: 'MINIBOSS', stage: 3 }, outcome: 'CLEARED' });
    });

    it('win posts the chapter boss without a stage', async () => {
        httpClient.post.mockResolvedValue({ data: { drop: null, chapterBossWinsLeft: 9 } });

        await farmApi.win({ kind: 'CHAPTER_BOSS' });

        expect(httpClient.post).toHaveBeenCalledWith('/farm/outcome', { boss: { kind: 'CHAPTER_BOSS' }, outcome: 'CLEARED' });
    });

    it('win sends only the kind and the stage of the boss', async () => {
        httpClient.post.mockResolvedValue({ data: { drop: null, chapterBossWinsLeft: 10 } });

        await farmApi.win({ kind: 'MINIBOSS', stage: 2, label: 'Miniboss 2' });

        expect(httpClient.post.mock.calls[0][1].boss).toEqual({ kind: 'MINIBOSS', stage: 2 });
    });

    it('propagates errors from the client', async () => {
        const error = new Error('too fast');
        httpClient.post.mockImplementation(async () => { throw error; });

        await expect(farmApi.win({ kind: 'CHAPTER_BOSS' })).rejects.toThrow('too fast');
    });

    it('get with a chapter calls GET /farm?chapter=<n> and returns the body', async () => {
        httpClient.get.mockResolvedValue({ data: state });

        await expect(farmApi.get(2)).resolves.toEqual(state);
        expect(httpClient.get).toHaveBeenCalledWith('/farm?chapter=2');
    });

    it('win of a miniboss with a chapter sends the chapter beside the boss', async () => {
        httpClient.post.mockResolvedValue({ data: { drop: null, chapterBossWinsLeft: 10 } });

        await farmApi.win({ kind: 'MINIBOSS', stage: 3, chapter: 2 });

        expect(httpClient.post).toHaveBeenCalledWith('/farm/outcome', { boss: { kind: 'MINIBOSS', stage: 3 }, outcome: 'CLEARED', chapter: 2 });
    });

    it('win of the chapter boss with a chapter sends no stage and the chapter', async () => {
        httpClient.post.mockResolvedValue({ data: { drop: null, chapterBossWinsLeft: 9 } });

        await farmApi.win({ kind: 'CHAPTER_BOSS', chapter: 1 });

        expect(httpClient.post).toHaveBeenCalledWith('/farm/outcome', { boss: { kind: 'CHAPTER_BOSS' }, outcome: 'CLEARED', chapter: 1 });
    });

    it('win without a chapter sends no chapter key', async () => {
        httpClient.post.mockResolvedValue({ data: { drop: null, chapterBossWinsLeft: 10 } });

        await farmApi.win({ kind: 'MINIBOSS', stage: 2, chapter: undefined });

        expect('chapter' in httpClient.post.mock.calls[0][1]).toBe(false);
    });
});
