import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFarmSession } from './farmSession';
import { ApiError } from '../ApiError';

const state = { bosses: [ { kind: 'MINIBOSS', stage: 1 }, { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft: 7 };

describe('farmSession', () => {
    let gateway;
    let farm;

    beforeEach(() => {
        gateway = { get: vi.fn().mockResolvedValue(state), win: vi.fn() };
        farm = createFarmSession({ gateway });
    });

    it('has no bosses and unknown wins left before it loads', () => {
        expect(farm.bosses()).toEqual([]);
        expect(farm.winsLeft()).toBeNull();
    });

    it('load keeps the bosses and the wins left', async () => {
        await farm.load();

        expect(farm.bosses()).toEqual(state.bosses);
        expect(farm.winsLeft()).toBe(7);
    });

    it('a failed load rejects and keeps the previous state', async () => {
        await farm.load();
        gateway.get.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));

        await expect(farm.load()).rejects.toBeInstanceOf(ApiError);

        expect(farm.bosses()).toEqual(state.bosses);
        expect(farm.winsLeft()).toBe(7);
    });

    it('win sends one request, updates the wins left and resolves with the answer', async () => {
        await farm.load();
        const answer = { drop: { heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 }, chapterBossWinsLeft: 6 };
        gateway.win.mockResolvedValue(answer);

        await expect(farm.win({ kind: 'CHAPTER_BOSS' })).resolves.toEqual(answer);

        expect(gateway.win).toHaveBeenCalledTimes(1);
        expect(gateway.win).toHaveBeenCalledWith({ kind: 'CHAPTER_BOSS' });
        expect(farm.winsLeft()).toBe(6);
    });

    it('win keeps the equipment drop of the answer', async () => {
        await farm.load();
        const answer = { drop: null, chapterBossWinsLeft: 6, equipmentDrop: { piece: { id: 'p1', slot: 'RING', rarity: 'COMMON' }, sold: false } };
        gateway.win.mockResolvedValue(answer);

        const result = await farm.win({ kind: 'CHAPTER_BOSS' });

        expect(result.equipmentDrop).toEqual(answer.equipmentDrop);
    });

    it('a refused win rejects with the error and keeps the wins left', async () => {
        await farm.load();
        const refusal = new ApiError('The chapter boss was already won 10 times today', { status: 409, code: 'DAILY_LIMIT_REACHED' });
        gateway.win.mockRejectedValue(refusal);

        await expect(farm.win({ kind: 'CHAPTER_BOSS' })).rejects.toBe(refusal);

        expect(farm.winsLeft()).toBe(7);
    });

    describe('chapters', () => {
        const D2 = { bossHealth: 2 };
        const D3 = { bossHealth: 3 };

        it('before it loads the chapter is null, the chapters are empty and no definition is known', () => {
            expect(farm.chapter()).toBeNull();
            expect(farm.chapters()).toEqual([]);
            expect(farm.definitionOf(1)).toBeNull();
        });

        it('load without a chapter calls get with no argument', async () => {
            await farm.load();

            expect(gateway.get.mock.calls[0]).toEqual([]);
        });

        it('load with a chapter asks the gateway for that chapter', async () => {
            await farm.load(2);

            expect(gateway.get).toHaveBeenCalledWith(2);
        });

        it('load keeps the chapter, the chapters and the definition of the answer', async () => {
            gateway.get.mockResolvedValueOnce({ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 10, definition: D2 });

            await farm.load(2);

            expect(farm.chapter()).toBe(2);
            expect(farm.chapters()).toEqual([ 1, 2, 3 ]);
            expect(farm.definitionOf(2)).toBe(D2);
        });

        it('the definition of every loaded chapter stays known', async () => {
            gateway.get.mockResolvedValueOnce({ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 10, definition: D2 });
            gateway.get.mockResolvedValueOnce({ chapter: 3, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 10, definition: D3 });

            await farm.load(2);
            await farm.load(3);

            expect(farm.definitionOf(2)).toBe(D2);
            expect(farm.definitionOf(3)).toBe(D3);
            expect(farm.definitionOf(1)).toBeNull();
            expect(farm.chapter()).toBe(3);
        });

        it('an answer without the new fields means no chapter and no chapters', async () => {
            gateway.get.mockResolvedValueOnce({ bosses: [ { kind: 'MINIBOSS', stage: 1 } ], chapterBossWinsLeft: 10 });

            await farm.load();

            expect(farm.chapter()).toBeNull();
            expect(farm.chapters()).toEqual([]);
            expect(farm.definitionOf(1)).toBeNull();
            expect(farm.bosses()).toHaveLength(1);
        });

        it('a failed load keeps the chapter, the chapters and the definitions', async () => {
            gateway.get.mockResolvedValueOnce({ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 10, definition: D2 });
            await farm.load(2);
            gateway.get.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));

            await expect(farm.load(1)).rejects.toBeInstanceOf(ApiError);

            expect(farm.chapter()).toBe(2);
            expect(farm.chapters()).toEqual([ 1, 2, 3 ]);
            expect(farm.definitionOf(2)).toBe(D2);
        });
    });

    describe('cancel', () => {
        const answerOf2 = { chapter: 2, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 4, definition: { bossHealth: 2 } };

        it('cancel drops the answer of a load still pending', async () => {
            let answer;
            gateway.get.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));
            const pending = farm.load(2);
            farm.cancel();

            answer({ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [ { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft: 4, definition: { bossHealth: 2 } });
            await pending;

            expect(farm.bosses()).toEqual([]);
            expect(farm.winsLeft()).toBeNull();
            expect(farm.chapter()).toBeNull();
            expect(farm.chapters()).toEqual([]);
            expect(farm.definitionOf(2)).toBeNull();
        });

        it('cancel keeps the state already loaded', async () => {
            await farm.load();

            farm.cancel();

            expect(farm.bosses()).toEqual(state.bosses);
            expect(farm.winsLeft()).toBe(7);
        });

        it('a load started after cancel keeps its answer', async () => {
            farm.cancel();

            await farm.load();

            expect(farm.bosses()).toEqual(state.bosses);
            expect(farm.winsLeft()).toBe(7);
        });

        it('cancel drops only the loads started before it', async () => {
            let answer;
            gateway.get.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));
            const first = farm.load(2);
            farm.cancel();

            await farm.load();
            answer(answerOf2);
            await first;

            expect(farm.bosses()).toEqual(state.bosses);
            expect(farm.winsLeft()).toBe(7);
            expect(farm.chapter()).toBeNull();
            expect(farm.definitionOf(2)).toBeNull();
        });

        it('a load pending across a cancel still rejects with its failure and keeps the state', async () => {
            await farm.load();
            let fail;
            gateway.get.mockReturnValueOnce(new Promise((_, reject) => { fail = reject; }));
            const pending = farm.load(1);
            farm.cancel();

            fail(new ApiError('Cannot reach the server. Try again later.'));

            await expect(pending).rejects.toBeInstanceOf(ApiError);
            expect(farm.bosses()).toEqual(state.bosses);
            expect(farm.winsLeft()).toBe(7);
        });
    });
});
