import { describe, expect, it, vi } from 'vitest';
import { BACKGROUND_TICK_MS, runInBackground, startTicker } from './backgroundFight';

//  A page whose visibility the test flips, a ticker the test fires by hand and a clock the test moves
const createPage = () =>
{
    const listeners = [];
    const page = {
        hidden: false,
        addEventListener: (type, listener) => type === 'visibilitychange' && listeners.push(listener),
        set: (hidden) =>
        {
            page.hidden = hidden;
            listeners.forEach((listener) => listener());
        }
    };

    return page;
};

const createWorld = () =>
{
    const document = createPage();
    const tickers = [];
    const clock = { ms: 1000 };
    const loop = { frame: 7 };
    const steps = [];

    runInBackground({
        document,
        startTicker: (ms, onTick) =>
        {
            const ticker = { ms, onTick, stopped: false };

            tickers.push(ticker);

            return () => { ticker.stopped = true; };
        },
        now: () => clock.ms,
        loopFrame: () => loop.frame,
        step: (time, delta) => steps.push([ time, delta ])
    });

    const running = () => tickers.filter((ticker) => !ticker.stopped);
    const tick = (ms) =>
    {
        clock.ms += ms;
        running().forEach((ticker) => ticker.onTick());
    };

    return { document, tickers, running, tick, clock, loop, steps };
};

const total = (steps) => steps.reduce((sum, [ , delta ]) => sum + delta, 0);

describe('runInBackground', () => {
    it('starts no ticker while the page is visible', () => {
        const world = createWorld();

        expect(world.tickers).toHaveLength(0);
    });

    it('starts a ticker of 1000 ms when the page becomes hidden', () => {
        const world = createWorld();

        world.document.set(true);

        expect(world.running()).toHaveLength(1);
        expect(world.running()[0].ms).toBe(1000);
        expect(BACKGROUND_TICK_MS).toBe(1000);
    });

    it('steps the real time elapsed since the page became hidden, in steps of 50 ms', () => {
        const world = createWorld();

        world.document.set(true);
        world.tick(1000);

        expect(world.steps).toHaveLength(20);
        expect(world.steps.every(([ , delta ]) => delta === 50)).toBe(true);
        expect(total(world.steps)).toBe(1000);
        //  The time of each step is the moment its slice ends
        expect(world.steps[0][0]).toBe(1050);
        expect(world.steps.at(-1)[0]).toBe(2000);
    });

    it('steps the time since the previous tick, with a last step shorter than 50 ms when the time is not a multiple', () => {
        const world = createWorld();

        world.document.set(true);
        world.tick(1000);
        world.steps.length = 0;
        world.tick(1030);

        expect(total(world.steps)).toBe(1030);
        expect(world.steps).toHaveLength(21);
        expect(world.steps.at(-1)[1]).toBe(30);
    });

    it('steps only 60000 ms when more time passed since the previous tick', () => {
        const world = createWorld();

        world.document.set(true);
        world.tick(3_600_000);

        expect(total(world.steps)).toBe(60_000);
    });

    it('steps nothing when the Phaser loop ran a frame since the previous tick', () => {
        const world = createWorld();

        world.document.set(true);
        world.loop.frame += 1;
        world.tick(1000);

        expect(world.steps).toHaveLength(0);

        //  The loop stopped again: the next tick counts only its own second
        world.tick(1000);

        expect(total(world.steps)).toBe(1000);
    });

    it('steps nothing when no time elapsed', () => {
        const world = createWorld();

        world.document.set(true);
        world.tick(0);

        expect(world.steps).toHaveLength(0);
    });

    it('stops the ticker when the page becomes visible', () => {
        const world = createWorld();

        world.document.set(true);
        world.document.set(false);
        world.tick(1000);

        expect(world.running()).toHaveLength(0);
        expect(world.steps).toHaveLength(0);
    });

    it('runs a single ticker when the page is hidden and shown several times', () => {
        const world = createWorld();

        world.document.set(true);
        world.document.set(true);
        world.document.set(false);
        world.document.set(true);
        world.document.set(true);

        expect(world.running()).toHaveLength(1);

        world.tick(1000);

        expect(total(world.steps)).toBe(1000);
    });
});

describe('startTicker', () => {
    it('ticks from a Worker that posts every 1000 ms, and terminates it on stop', () => {
        const workers = [];
        class FakeWorker
        {
            constructor (url)
            {
                this.url = url;
                this.terminated = false;
                workers.push(this);
            }

            terminate () { this.terminated = true; }
        }
        const sources = [];
        const urls = {
            createObjectURL: (blob) => { sources.push(blob); return 'blob:ticker'; },
            revokeObjectURL: vi.fn()
        };
        const onTick = vi.fn();

        const stop = startTicker(1000, onTick, { Worker: FakeWorker, URL: urls });

        expect(workers).toHaveLength(1);
        expect(workers[0].url).toBe('blob:ticker');
        expect(sources[0]).toBeInstanceOf(Blob);

        workers[0].onmessage();

        expect(onTick).toHaveBeenCalledTimes(1);

        stop();

        expect(workers[0].terminated).toBe(true);
        expect(urls.revokeObjectURL).toHaveBeenCalledWith('blob:ticker');
    });

    it('the worker source posts a message every 1000 ms', async () => {
        const sources = [];
        class FakeWorker { terminate () {} }

        startTicker(1000, () => {}, { Worker: FakeWorker, URL: { createObjectURL: (blob) => { sources.push(blob); return 'blob:x'; }, revokeObjectURL: () => {} } });

        expect(await sources[0].text()).toBe('setInterval(() => postMessage(0), 1000);');
    });

    it('ticks with setInterval every 1000 ms when Worker does not exist', () => {
        vi.useFakeTimers();
        try
        {
            const onTick = vi.fn();
            const stop = startTicker(1000, onTick, { Worker: undefined, URL });

            vi.advanceTimersByTime(999);
            expect(onTick).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(onTick).toHaveBeenCalledTimes(1);

            stop();
            vi.advanceTimersByTime(5000);
            expect(onTick).toHaveBeenCalledTimes(1);
        }
        finally
        {
            vi.useRealTimers();
        }
    });
});
