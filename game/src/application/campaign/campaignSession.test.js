import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCampaignSession } from './campaignSession';
import { ApiError } from '../ApiError';

const flush = () => new Promise((resolve) => setTimeout(resolve));

const definition = {
    bossHealth: 300,
    bossTimeLimitMs: 60000,
    stages: [
        { number: 1, phasesPerStage: 2, monsterHealth: 10, minibossHealth: 50, minibossTimeLimitMs: 30000 },
        { number: 2, phasesPerStage: 2, monsterHealth: 11, minibossHealth: 55, minibossTimeLimitMs: 30000 }
    ]
};

const progress = (stage, encounter, phase = 1, completed = false) => ({ chapter: 1, stage, encounter, phase, completed, definition });
const position = (stage, encounter, phase = 1) => ({ chapter: 1, stage, encounter, phase });

const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => { resolve = done; reject = fail; });

    return { promise, resolve, reject };
};

describe('campaignSession', () => {
    let gateway;
    let session;

    beforeEach(() => {
        gateway = { get: vi.fn().mockResolvedValue(progress(1, 'PHASE', 1)), report: vi.fn().mockResolvedValue(progress(1, 'PHASE', 2)) };
        session = createCampaignSession({ gateway });
    });

    const loaded = async () => {
        await session.load();
        return session;
    };

    describe('load', () => {
        it('asks the gateway for the progress and resolves with the first encounter', async () => {
            const encounter = await session.load();

            expect(gateway.get).toHaveBeenCalledTimes(1);
            expect(encounter).toMatchObject({ kind: 'PHASE', stage: 1, phase: 1, health: 10 });
            expect(session.loaded).toBe(true);
            expect(session.encounter()).toEqual(encounter);
        });

        it('starts at the stored position', async () => {
            gateway.get.mockResolvedValue(progress(2, 'MINIBOSS'));

            expect(await session.load()).toMatchObject({ kind: 'MINIBOSS', stage: 2, health: 55, timeLimitMs: 30000 });
        });

        it('rejects and stays unloaded when the gateway fails, then loads on a later call', async () => {
            gateway.get.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));

            await expect(session.load()).rejects.toBeInstanceOf(ApiError);
            expect(session.loaded).toBe(false);
            expect(session.encounter()).toBeNull();

            await expect(session.load()).resolves.toMatchObject({ kind: 'PHASE' });
        });

        it('shares one request among concurrent loads', async () => {
            await Promise.all([ session.load(), session.load() ]);

            expect(gateway.get).toHaveBeenCalledTimes(1);
        });

        it('has nothing to play before it has loaded', async () => {
            expect(session.loaded).toBe(false);
            expect(() => session.clear()).toThrow();
        });
    });

    describe('moving', () => {
        it('clear moves to the next encounter at once and queues one CLEARED report with the position it left', async () => {
            await loaded();

            const next = session.clear();
            await session.flush();

            expect(next).toMatchObject({ kind: 'PHASE', stage: 1, phase: 2 });
            expect(gateway.report).toHaveBeenCalledTimes(1);
            expect(gateway.report).toHaveBeenCalledWith(position(1, 'PHASE', 1), 'CLEARED');
        });

        it('clearing the last phase leads to the miniboss with its health and time limit', async () => {
            gateway.get.mockResolvedValue(progress(1, 'PHASE', 2));
            await loaded();

            expect(session.clear()).toMatchObject({ kind: 'MINIBOSS', health: 50, timeLimitMs: 30000 });
        });

        it('fail returns to the last phase of the stage and queues one FAILED report with the boss position', async () => {
            gateway.get.mockResolvedValue(progress(2, 'MINIBOSS'));
            await loaded();

            const next = session.fail();
            await session.flush();

            expect(next).toMatchObject({ kind: 'PHASE', stage: 2, phase: 2 });
            expect(gateway.report).toHaveBeenCalledWith(position(2, 'MINIBOSS'), 'FAILED');
        });

        it('clearing the chapter boss completes the campaign: no encounter, and the CLEARED report is queued', async () => {
            gateway.get.mockResolvedValue(progress(2, 'CHAPTER_BOSS'));
            await loaded();

            const next = session.clear();
            await session.flush();

            expect(next).toBeNull();
            expect(session.completed).toBe(true);
            expect(gateway.report).toHaveBeenCalledWith(position(2, 'CHAPTER_BOSS'), 'CLEARED');
        });
    });

    describe('flush', () => {
        it('sends the queued reports in order, one request at a time', async () => {
            await loaded();
            session.clear();
            session.clear();
            const first = deferred();
            gateway.report.mockReturnValueOnce(first.promise);

            const flushing = session.flush();
            await flush();

            expect(gateway.report).toHaveBeenCalledTimes(1);
            first.resolve(progress(1, 'PHASE', 2));
            await flushing;
            expect(gateway.report).toHaveBeenCalledTimes(2);
            expect(gateway.report).toHaveBeenNthCalledWith(1, position(1, 'PHASE', 1), 'CLEARED');
            expect(gateway.report).toHaveBeenNthCalledWith(2, position(1, 'PHASE', 2), 'CLEARED');
        });

        it('starts no second flush while one is in flight', async () => {
            await loaded();
            session.clear();
            const pending = deferred();
            gateway.report.mockReturnValue(pending.promise);

            const first = session.flush();
            await session.flush();
            pending.resolve(progress(1, 'PHASE', 2));
            await first;

            expect(gateway.report).toHaveBeenCalledTimes(1);
        });

        it('sends a report queued while one is in flight after it, in order', async () => {
            await loaded();
            session.clear();
            const pending = deferred();
            gateway.report.mockReturnValueOnce(pending.promise);

            const flushing = session.flush();
            session.clear();
            pending.resolve(progress(1, 'PHASE', 2));
            await flushing;

            expect(gateway.report).toHaveBeenCalledTimes(2);
            expect(gateway.report).toHaveBeenNthCalledWith(2, position(1, 'PHASE', 2), 'CLEARED');
        });

        it('sends nothing without queued reports', async () => {
            await loaded();

            await session.flush();

            expect(gateway.report).not.toHaveBeenCalled();
        });

        it('does not send a report twice once it succeeded', async () => {
            await loaded();
            session.clear();

            await session.flush();
            await session.flush();

            expect(gateway.report).toHaveBeenCalledTimes(1);
        });

        it('keeps a failed report first and the ones behind it, and resends them in order on the next flush', async () => {
            await loaded();
            session.clear();
            session.clear();
            gateway.report.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));

            await session.flush();
            expect(gateway.report).toHaveBeenCalledTimes(1);

            await session.flush();
            expect(gateway.report).toHaveBeenCalledTimes(3);
            expect(gateway.report).toHaveBeenNthCalledWith(2, position(1, 'PHASE', 1), 'CLEARED');
            expect(gateway.report).toHaveBeenNthCalledWith(3, position(1, 'PHASE', 2), 'CLEARED');
        });

        it('keeps playing from the local position while a report fails', async () => {
            await loaded();
            gateway.report.mockRejectedValue(new ApiError('boom', { status: 500 }));
            session.clear();

            await session.flush();

            expect(session.encounter()).toMatchObject({ kind: 'PHASE', phase: 2 });
        });
    });

    describe('409 realignment', () => {
        const conflict = (stored) => new ApiError('Reported position does not match the stored progress', { status: 409, code: 'PROGRESS_CONFLICT', body: { progress: stored } });

        it('drops the queue, adopts the stored progress and tells the scene which encounter to show', async () => {
            await loaded();
            session.clear();
            session.clear();
            const onRealign = vi.fn();
            session.onRealign(onRealign);
            gateway.report.mockRejectedValueOnce(conflict(progress(1, 'PHASE', 2)));

            await session.flush();

            expect(onRealign).toHaveBeenCalledTimes(1);
            expect(onRealign).toHaveBeenCalledWith(expect.objectContaining({ kind: 'PHASE', stage: 1, phase: 2 }));
            expect(session.encounter()).toMatchObject({ kind: 'PHASE', stage: 1, phase: 2 });
            await session.flush();
            expect(gateway.report).toHaveBeenCalledTimes(1);
        });

        it('realigns to a later stored position too (another tab was ahead)', async () => {
            await loaded();
            session.clear();
            gateway.report.mockRejectedValueOnce(conflict(progress(2, 'MINIBOSS')));

            await session.flush();

            expect(session.encounter()).toMatchObject({ kind: 'MINIBOSS', stage: 2 });
        });

        it('reloads the progress when the 409 carries no body, and then adopts it', async () => {
            await loaded();
            session.clear();
            gateway.report.mockRejectedValueOnce(new ApiError('conflict', { status: 409 }));
            gateway.get.mockResolvedValue(progress(1, 'PHASE', 2));
            const onRealign = vi.fn();
            session.onRealign(onRealign);

            await session.flush();

            expect(gateway.get).toHaveBeenCalledTimes(2);
            expect(onRealign).toHaveBeenCalledTimes(1);
        });
    });

    describe('card drops', () => {
        const drop = { heroId: 'kael', heroName: 'Kael Raizférrea', stars: 0 };

        it('onDrop fires with the card of an accepted report, after it left the queue', async () => {
            const received = [];

            await loaded();
            session.onDrop((card) => received.push(card));
            gateway.report.mockResolvedValue({ ...progress(1, 'PHASE', 2), drop });
            session.clear();

            await session.flush();

            expect(received).toEqual([ drop ]);
        });

        it('fires once per report that dropped a card and not for the others', async () => {
            const received = [];

            await loaded();
            session.onDrop((card) => received.push(card));
            gateway.report
                .mockResolvedValueOnce({ ...progress(1, 'PHASE', 2) })
                .mockResolvedValueOnce({ ...progress(1, 'PHASE', 2), drop: null })
                .mockResolvedValueOnce({ ...progress(1, 'MINIBOSS'), drop });
            session.clear();
            session.clear();
            session.clear();

            await session.flush();

            expect(gateway.report).toHaveBeenCalledTimes(3);
            expect(received).toEqual([ drop ]);
        });

        it('a failed report fires nothing and stays first in the queue', async () => {
            const received = [];

            await loaded();
            session.onDrop((card) => received.push(card));
            gateway.report.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));
            session.clear();

            await session.flush();
            expect(received).toEqual([]);

            gateway.report.mockResolvedValueOnce({ ...progress(1, 'PHASE', 2), drop });
            await session.flush();

            expect(received).toEqual([ drop ]);
        });

        it('a win with no callback registered is not an error', async () => {
            await loaded();
            gateway.report.mockResolvedValue({ ...progress(1, 'PHASE', 2), drop });
            session.clear();

            await expect(session.flush()).resolves.toBeUndefined();
        });
    });

    describe('farm encounters', () => {
        it('builds the encounter of a beaten boss without touching the position or the queue', async () => {
            gateway.get.mockResolvedValue(progress(2, 'PHASE', 1));
            await session.load();

            const encounter = session.farmEncounter({ kind: 'MINIBOSS', stage: 1 });

            expect(encounter).toMatchObject({ kind: 'FARM', health: 50, timeLimitMs: 30000, label: 'Rever chefe: Miniboss 1' });
            expect(session.encounter()).toMatchObject({ kind: 'PHASE', stage: 2, phase: 1 });
            await session.flush();
            expect(gateway.report).not.toHaveBeenCalled();
        });

        it('throws before the campaign has loaded', () => {
            expect(() => session.farmEncounter({ kind: 'CHAPTER_BOSS' })).toThrow('The campaign has not loaded');
        });
    });

    describe('flushOnExit', () => {
        it('sends every queued report once, in order', async () => {
            await loaded();
            session.clear();
            session.clear();

            session.flushOnExit();
            await flush();

            expect(gateway.report).toHaveBeenCalledTimes(2);
            expect(gateway.report).toHaveBeenNthCalledWith(1, position(1, 'PHASE', 1), 'CLEARED');
            expect(gateway.report).toHaveBeenNthCalledWith(2, position(1, 'PHASE', 2), 'CLEARED');
        });

        it('stops at the first failure and does not retry', async () => {
            await loaded();
            session.clear();
            session.clear();
            gateway.report.mockRejectedValue(new ApiError('down'));

            session.flushOnExit();
            await flush();
            await session.flush();

            expect(gateway.report).toHaveBeenCalledTimes(1);
        });

        it('sends nothing without queued reports', async () => {
            await loaded();

            session.flushOnExit();
            await flush();

            expect(gateway.report).not.toHaveBeenCalled();
        });

        it('does not send the report that is already in flight a second time', async () => {
            await loaded();
            session.clear();
            session.clear();
            const pending = deferred();
            gateway.report.mockReturnValueOnce(pending.promise);
            const flushing = session.flush();

            session.flushOnExit();
            await flush();
            pending.resolve(progress(1, 'PHASE', 2));
            await flushing;

            expect(gateway.report).toHaveBeenCalledTimes(2);
            expect(gateway.report).toHaveBeenNthCalledWith(2, position(1, 'PHASE', 2), 'CLEARED');
        });
    });
});
