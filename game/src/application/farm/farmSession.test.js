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

    it('a refused win rejects with the error and keeps the wins left', async () => {
        await farm.load();
        const refusal = new ApiError('The chapter boss was already won 10 times today', { status: 409, code: 'DAILY_LIMIT_REACHED' });
        gateway.win.mockRejectedValue(refusal);

        await expect(farm.win({ kind: 'CHAPTER_BOSS' })).rejects.toBe(refusal);

        expect(farm.winsLeft()).toBe(7);
    });
});
