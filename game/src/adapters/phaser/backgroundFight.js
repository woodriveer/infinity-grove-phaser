//  The fight in a hidden tab (spec background-fight): the browser stops requestAnimationFrame, so Phaser stops stepping. While the page is
//  hidden a ticker wakes the game once a second and steps the scenes by the real time that passed, in slices of the fastest auto click
//  interval so a slice fires at most one auto click. Nothing is drawn: nobody sees it.
//  Ports:
//    document           { hidden, addEventListener('visibilitychange') }
//    startTicker(ms, onTick) -> stop()   calls onTick every `ms`
//    now()              the time in ms (performance.now)
//    loopFrame()        the frame count of the Phaser loop: a change means it still runs, and the tick leaves the time to it
//    step(time, delta)  steps every running scene
export const BACKGROUND_TICK_MS = 1000;
export const BACKGROUND_STEP_MS = 50;
//  After the computer slept the gap is hours long; only one minute of it is played
export const BACKGROUND_MAX_MS = 60_000;

export const runInBackground = ({ document, startTicker, now, loopFrame, step }) =>
{
    let stop = null;
    let last = 0;
    let frame = 0;

    const tick = () =>
    {
        const time = now();
        const elapsed = Math.min(time - last, BACKGROUND_MAX_MS);

        last = time;

        if (loopFrame() !== frame)
        {
            frame = loopFrame();
            return;
        }

        for (let done = 0; done < elapsed; done += BACKGROUND_STEP_MS)
        {
            const delta = Math.min(BACKGROUND_STEP_MS, elapsed - done);

            step(time - elapsed + done + delta, delta);
        }
    };

    const follow = () =>
    {
        if (document.hidden && !stop)
        {
            last = now();
            frame = loopFrame();
            stop = startTicker(BACKGROUND_TICK_MS, tick);
        }
        else if (!document.hidden && stop)
        {
            stop();
            stop = null;
        }
    };

    document.addEventListener('visibilitychange', follow);
    follow();
};

//  Calls onTick every `ms` from a dedicated worker, whose timers the browser throttles less than the page's; setInterval without workers
export const startTicker = (ms, onTick, { Worker = globalThis.Worker, URL = globalThis.URL } = {}) =>
{
    if (!Worker)
    {
        const id = setInterval(onTick, ms);

        return () => clearInterval(id);
    }

    const url = URL.createObjectURL(new Blob([ `setInterval(() => postMessage(0), ${ms});` ], { type: 'text/javascript' }));
    const worker = new Worker(url);

    worker.onmessage = () => onTick();

    return () =>
    {
        worker.terminate();
        URL.revokeObjectURL(url);
    };
};
