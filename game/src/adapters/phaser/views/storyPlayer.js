import { STORY_BACKDROPS } from '../../../domain/story/storyCatalog';
import { AUTO_ADVANCE_MS, advanceStory, endLine, startStory, storyScale } from '../../../domain/story/storyPlayback';
import { charsAt, lineText } from '../../../domain/story/storyText';
import { createStoryStage } from './storyStage';

//  The sound choice outlives a scene: the next one starts as the player left it (spec story-scenes D13)
let muted = false;

export const storyMuted = () => muted;

export const setStoryMuted = (on) =>
{
    muted = on;
};

//  Plays a scene in the story overlay (spec story-scenes) and resolves when it closes (end card, Pular or Escape).
//  Every browser API comes through `options` so the tests drive time, frames and audio by hand.
export const playStory = (scene, options = {}) =>
{
    const {
        root = document.body,
        backdrops = STORY_BACKDROPS,
        createAudio = (src) => new Audio(src),
        now = () => performance.now(),
        requestFrame = (callback) => requestAnimationFrame(callback),
        cancelFrame = (id) => cancelAnimationFrame(id),
        setTimer = (callback, ms) => setTimeout(callback, ms),
        clearTimer = (id) => clearTimeout(id),
        viewport = () => ({ width: window.innerWidth, height: window.innerHeight }),
        window: view = globalThis.window
    } = options;
    const doc = root.ownerDocument;
    const previousFocus = doc.activeElement;
    const audios = scene.lines.map((line) =>
    {
        const audio = createAudio(line.audio);

        audio.preload = 'auto';
        audio.muted = muted;

        return audio;
    });
    let state = startStory(scene);
    let shown = 0;
    let t = 0;
    let frame = null;
    let timer = null;
    let useClock = false;
    let clockStart = 0;
    let closed = false;
    let resolveClosed;
    const closedPromise = new Promise((resolve) =>
    {
        resolveClosed = resolve;
    });

    const stage = createStoryStage({
        scene,
        backdrops,
        onHit: () => hit(),
        onSkip: () => close(),
        onMute: () => toggleMute()
    });

    const paint = () => stage.update({ state, shown, t, muted });

    const setScale = () =>
    {
        const { width, height } = viewport();

        stage.stage.style.setProperty('--story-scale', String(storyScale(width, height)));
    };

    const stopTicking = () =>
    {
        if (frame !== null)
        {
            cancelFrame(frame);
            frame = null;
        }

        if (timer !== null)
        {
            clearTimer(timer);
            timer = null;
        }
    };

    //  The audio cannot play (blocked, missing, unsupported): the text types by the clock from now on
    const fallBack = () =>
    {
        if (!useClock)
        {
            useClock = true;
            clockStart = now();
        }
    };

    const line = () => scene.lines[state.index];

    const finishLine = (auto) =>
    {
        if (closed || state.phase !== 'line' || state.complete)
        {
            return;
        }

        if (frame !== null)
        {
            cancelFrame(frame);
            frame = null;
        }

        audios[state.index].pause();
        state = endLine(state);
        shown = lineText(line()).length;
        t = line().duration;
        paint();

        if (auto)
        {
            timer = setTimer(next, AUTO_ADVANCE_MS);
        }
    };

    const tick = () =>
    {
        frame = null;
        t = useClock ? (now() - clockStart) / 1000 : audios[state.index].currentTime;

        if (useClock && t >= line().duration)
        {
            finishLine(true);

            return;
        }

        shown = charsAt(line(), t);
        paint();
        frame = requestFrame(tick);
    };

    const playLine = () =>
    {
        stopTicking();
        audios.forEach((audio) =>
        {
            audio.pause();
            audio.onended = null;
            audio.onerror = null;
        });

        const audio = audios[state.index];

        useClock = false;
        clockStart = now();
        shown = 0;
        t = 0;
        paint();
        audio.currentTime = 0;
        audio.onended = () => finishLine(true);
        audio.onerror = () => fallBack();

        try
        {
            const result = audio.play();

            if (result && typeof result.catch === 'function')
            {
                result.catch(() => fallBack());
            }
        }
        catch
        {
            fallBack();
        }

        frame = requestFrame(tick);
    };

    const next = () =>
    {
        if (timer !== null)
        {
            clearTimer(timer);
            timer = null;
        }

        state = advanceStory(scene, state);

        if (state.phase === 'line')
        {
            playLine();
        }
        else if (state.phase === 'end')
        {
            audios.forEach((audio) => audio.pause());
            shown = 0;
            t = 0;
            paint();
        }
        else
        {
            close();
        }
    };

    const hit = () =>
    {
        if (state.phase === 'title')
        {
            state = advanceStory(scene, state);
            playLine();
        }
        else if (state.phase === 'line' && !state.complete)
        {
            finishLine(false);
        }
        else
        {
            next();
        }
    };

    const toggleMute = () =>
    {
        setStoryMuted(!muted);
        audios.forEach((audio) =>
        {
            audio.muted = muted;
        });
        paint();
    };

    //  Escape is ours while the scene is open: the page never sees it, and only a plain press closes (key rule of AD-034)
    const onKey = (event) =>
    {
        if (event.key !== 'Escape')
        {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey)
        {
            close();
        }
    };

    const close = () =>
    {
        if (closed)
        {
            return;
        }

        closed = true;
        stopTicking();
        audios.forEach((audio) =>
        {
            audio.pause();
            audio.onended = null;
            audio.onerror = null;
        });
        view.removeEventListener('resize', setScale);
        doc.removeEventListener('keydown', onKey);
        stage.root.remove();

        if (previousFocus && doc.contains(previousFocus))
        {
            previousFocus.focus();
        }

        resolveClosed();
    };

    root.append(stage.root);
    setScale();
    view.addEventListener('resize', setScale);
    doc.addEventListener('keydown', onKey);
    paint();
    stage.hit.focus();

    if (state.phase === 'line')
    {
        playLine();
    }

    return closedPromise;
};
