import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRankingBoard } from './rankingBoard';

const deferred = () =>
{
    const result = {};

    result.promise = new Promise((resolve, reject) =>
    {
        result.resolve = resolve;
        result.reject = reject;
    });

    return result;
};

const answer = (board, chapter = null) => ({ board, chapter, entries: [], me: null });

describe('rankingBoard', () =>
{
    const gateway = { get: vi.fn(), recordClickPower: vi.fn() };
    let rankings;

    beforeEach(() =>
    {
        gateway.get.mockReset();
        gateway.recordClickPower.mockReset();
        gateway.get.mockImplementation(async (board, chapter) => answer(board, chapter ?? null));
        gateway.recordClickPower.mockResolvedValue({ value: 1, best: 1 });
        rankings = createRankingBoard({ gateway });
    });

    it('the first open records the click power, then loads the boss board of the campaign chapter', async () =>
    {
        await expect(rankings.open(4)).resolves.toBe(true);

        expect(gateway.recordClickPower.mock.invocationCallOrder[0]).toBeLessThan(gateway.get.mock.invocationCallOrder[0]);
        expect(gateway.get).toHaveBeenCalledWith('boss-time', 4);
        expect(rankings.board()).toBe('boss-time');
        expect(rankings.chapter()).toBe(4);
        expect(rankings.page()).toEqual(answer('boss-time', 4));
    });

    it('the campaign chapter is clamped', async () =>
    {
        await rankings.open(20);
        expect(gateway.get).toHaveBeenLastCalledWith('boss-time', 15);

        await createRankingBoard({ gateway }).open(0);
        expect(gateway.get).toHaveBeenLastCalledWith('boss-time', 1);
    });

    it('a later open keeps the board and the chapter shown last', async () =>
    {
        await rankings.open(4);
        await rankings.select('fortune');
        await rankings.open(9);

        expect(gateway.get).toHaveBeenLastCalledWith('fortune', undefined);
        expect(rankings.chapter()).toBe(4);
    });

    it('a failed click power record still loads the board', async () =>
    {
        gateway.recordClickPower.mockRejectedValue(new Error('down'));

        await expect(rankings.open(4)).resolves.toBe(true);
        expect(gateway.get).toHaveBeenCalledWith('boss-time', 4);
    });

    it('select loads another board without a chapter', async () =>
    {
        await rankings.select('story-time');

        expect(gateway.get).toHaveBeenCalledWith('story-time', undefined);
    });

    it('select with a chapter loads that boss chapter', async () =>
    {
        await rankings.open(4);
        await rankings.select('boss-time', 7);

        expect(gateway.get).toHaveBeenLastCalledWith('boss-time', 7);
        expect(rankings.chapter()).toBe(7);
    });

    it('an unknown board selects the boss board', async () =>
    {
        await rankings.select('gold');

        expect(rankings.board()).toBe('boss-time');
    });

    it('a late answer is dropped', async () =>
    {
        const a = deferred();
        const b = deferred();
        gateway.get.mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise);

        const first = rankings.select('story-time');
        const second = rankings.select('fortune');

        b.resolve(answer('fortune'));
        a.resolve(answer('story-time'));

        await expect(second).resolves.toBe(true);
        await expect(first).resolves.toBe(false);
        expect(rankings.page()).toEqual(answer('fortune'));
    });

    it('cancel drops the pending answer', async () =>
    {
        await rankings.select('story-time');
        const loaded = rankings.page();
        const pending = deferred();
        gateway.get.mockReturnValueOnce(pending.promise);

        const load = rankings.select('fortune');
        rankings.cancel();
        pending.resolve(answer('fortune'));

        await expect(load).resolves.toBe(false);
        expect(rankings.page()).toBe(loaded);
    });

    it('a failed newest load clears the page and rejects', async () =>
    {
        await rankings.select('story-time');
        expect(rankings.page()).not.toBeNull();
        gateway.get.mockRejectedValueOnce(new Error('down'));

        await expect(rankings.select('fortune')).rejects.toThrow('down');
        expect(rankings.page()).toBeNull();
    });

    it('a failed dropped load resolves false and keeps the newer page', async () =>
    {
        const a = deferred();
        gateway.get.mockReturnValueOnce(a.promise);

        const first = rankings.select('story-time');
        await rankings.select('fortune');
        a.reject(new Error('down'));

        await expect(first).resolves.toBe(false);
        expect(rankings.page()).toEqual(answer('fortune'));
    });
});
