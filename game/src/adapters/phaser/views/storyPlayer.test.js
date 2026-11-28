import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORY_SCENES } from '../../../domain/story/storyCatalog';
import { playStory, setStoryMuted, storyMuted } from './storyPlayer';

const [ PROLOGUE, CHAPTER_1 ] = STORY_SCENES;

const audios = [];
let playResult = () => Promise.resolve();
const createAudio = (src) =>
{
    const audio = { src, preload: '', currentTime: 0, muted: false, play: vi.fn(() => playResult()), pause: vi.fn(), onended: null, onerror: null };

    audios.push(audio);

    return audio;
};
let clock = 0;
const frames = [];
const runFrames = () => frames.splice(0).forEach((callback) => callback());
const timers = new Map();
let timerId = 0;
const options = (extra = {}) => ({
    root: document.body,
    createAudio,
    now: () => clock,
    requestFrame: (callback) =>
    {
        frames.push(callback);

        return frames.length;
    },
    cancelFrame: () =>
    {
        frames.length = 0;
    },
    setTimer: (callback, ms) =>
    {
        timers.set(++timerId, { cb: callback, ms });

        return timerId;
    },
    clearTimer: (id) => timers.delete(id),
    viewport: () => ({ width: 1280, height: 720 }),
    window: new EventTarget(),
    ...extra
});
const hit = () => document.querySelector('[data-testid="story-hit"]');
const overlay = () => document.querySelector('[data-testid="story-overlay"]');
const shown = () => document.querySelector('.story-shown').textContent;
const label = () => hit().getAttribute('aria-label');
const key = (init, target = document) => target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
const tick = () => Promise.resolve().then(() => Promise.resolve());

//  Click through to the complete state of line `n` (1-based) from the title card
const toLine = (n) =>
{
    hit().click();

    for (let i = 1; i < n; i++)
    {
        hit().click();
        hit().click();
    }
};

describe('storyPlayer', () => {
    beforeEach(() => {
        audios.length = 0;
        frames.length = 0;
        timers.clear();
        clock = 0;
        playResult = () => Promise.resolve();
    });

    afterEach(() => {
        setStoryMuted(false);
        document.body.replaceChildren();
    });

    it('opens on the title card in the root and focuses the hit button', () => {
        playStory(PROLOGUE, options());

        expect(overlay().parentNode).toBe(document.body);
        expect(document.querySelector('.story-kicker')).not.toBeNull();
        expect(document.activeElement).toBe(hit());
    });

    it('sets the stage scale from the viewport', () => {
        playStory(PROLOGUE, options());
        expect(document.querySelector('[data-testid="story-stage"]').style.getPropertyValue('--story-scale')).toBe('1');
        document.body.replaceChildren();

        playStory(PROLOGUE, options({ viewport: () => ({ width: 390, height: 844 }) }));
        expect(document.querySelector('[data-testid="story-stage"]').style.getPropertyValue('--story-scale')).toBe('0.3046875');
    });

    it('creates one audio per line with its file', () => {
        playStory(PROLOGUE, options());

        expect(audios.map((audio) => audio.src)).toEqual([ 1, 2, 3, 4, 5, 6 ].map((n) => `assets/story/prologue-0${n}.mp4`));
        expect(audios.every((audio) => audio.preload === 'auto')).toBe(true);
        expect(audios.every((audio) => audio.play.mock.calls.length === 0)).toBe(true);
    });

    it('a click on the title card plays line 1 from 0', () => {
        playStory(PROLOGUE, options());
        audios[0].currentTime = 9;

        hit().click();

        expect(audios[0].play).toHaveBeenCalledTimes(1);
        expect(audios[0].currentTime).toBe(0);
    });

    it('the text follows the audio time', () => {
        playStory(PROLOGUE, options());
        hit().click();

        audios[0].currentTime = 3.51;
        runFrames();

        expect(shown()).toHaveLength(43);
    });

    it('a click while typing shows the whole line, pauses the audio and waits', () => {
        playStory(PROLOGUE, options());
        hit().click();

        hit().click();

        expect(shown()).toHaveLength(138);
        expect(audios[0].pause).toHaveBeenCalled();
        expect(document.querySelector('.story-next').hidden).toBe(false);
        expect(label()).toBe('Próxima fala');
        expect(timers.size).toBe(0);
    });

    it('a click on a complete line plays the next line', () => {
        playStory(PROLOGUE, options());
        toLine(1);
        hit().click();

        hit().click();

        expect(audios[1].play).toHaveBeenCalledTimes(1);
    });

    it('the audio end completes the line and moves on after 1200 ms', () => {
        playStory(PROLOGUE, options());
        hit().click();

        audios[0].onended();

        expect(shown()).toHaveLength(138);
        expect([ ...timers.values() ].map((timer) => timer.ms)).toEqual([ 1200 ]);

        [ ...timers.values() ][0].cb();

        expect(audios[1].play).toHaveBeenCalledTimes(1);
    });

    it('a click before the auto-advance moves on once', () => {
        playStory(PROLOGUE, options());
        hit().click();
        audios[0].onended();

        hit().click();

        expect(audios[1].play).toHaveBeenCalledTimes(1);
        expect(timers.size).toBe(0);
    });

    it('a rejected play types by the clock and ends at the duration', async () => {
        playStory(PROLOGUE, options());
        toLine(1);
        hit().click();
        playResult = () => Promise.reject(new Error('NotAllowedError'));
        hit().click();
        await tick();

        clock = 1140;
        runFrames();
        expect(shown()).toHaveLength(14);

        clock = 3470;
        runFrames();
        expect(shown()).toHaveLength(38);
        expect([ ...timers.values() ].map((timer) => timer.ms)).toEqual([ 1200 ]);
    });

    it('an audio error types by the clock', () => {
        playStory(PROLOGUE, options());
        hit().click();

        clock = 1000;
        audios[0].onerror();
        clock = 4510;
        runFrames();

        expect(shown()).toHaveLength(43);
    });

    it('a play that throws types by the clock', () => {
        playStory(PROLOGUE, options());
        audios[0].play.mockImplementation(() =>
        {
            throw new Error('unsupported');
        });

        hit().click();
        clock = 12360;
        runFrames();

        expect(shown()).toHaveLength(138);
        expect(timers.size).toBe(1);
    });

    it('the last line clicked complete shows the end card', () => {
        playStory(PROLOGUE, options());
        toLine(6);
        hit().click();

        hit().click();

        expect(document.querySelector('.story-endtitle').textContent).toBe('Ato 1 — Bosque Desperto');
        expect(audios.every((audio) => audio.pause.mock.calls.length > 0)).toBe(true);
    });

    it('a click on the end card closes the overlay and resolves', async () => {
        const done = playStory(PROLOGUE, options());
        toLine(6);
        hit().click();
        hit().click();

        hit().click();

        await expect(done).resolves.toBeUndefined();
        expect(overlay()).toBeNull();
    });

    it('Pular on the title card closes and resolves', async () => {
        const done = playStory(PROLOGUE, options());

        document.querySelector('[data-testid="story-skip"]').click();

        await expect(done).resolves.toBeUndefined();
        expect(overlay()).toBeNull();
    });

    it('Pular during a line closes, pauses the audio and resolves', async () => {
        const done = playStory(PROLOGUE, options());
        hit().click();
        audios[0].pause.mockClear();

        document.querySelector('[data-testid="story-skip"]').click();

        await expect(done).resolves.toBeUndefined();
        expect(overlay()).toBeNull();
        expect(audios[0].pause).toHaveBeenCalled();
        expect(audios[0].onended).toBeNull();
    });

    it('Pular on the end card closes and resolves', async () => {
        const done = playStory(PROLOGUE, options());
        toLine(6);
        hit().click();
        hit().click();

        document.querySelector('[data-testid="story-skip"]').click();

        await expect(done).resolves.toBeUndefined();
        expect(overlay()).toBeNull();
    });

    it('Escape closes, and the key never reaches the window', async () => {
        const window = vi.fn();
        const done = playStory(PROLOGUE, options());

        globalThis.addEventListener('keydown', window);
        const proceeded = key({ key: 'Escape' });
        globalThis.removeEventListener('keydown', window);

        await expect(done).resolves.toBeUndefined();
        expect(overlay()).toBeNull();
        expect(window).not.toHaveBeenCalled();
        expect(proceeded).toBe(false);
    });

    it.each([ 'shiftKey', 'ctrlKey', 'altKey', 'metaKey' ])('Escape with %s held keeps the scene open and never reaches the window', (modifier) => {
        const window = vi.fn();

        playStory(PROLOGUE, options());
        globalThis.addEventListener('keydown', window);
        const proceeded = key({ key: 'Escape', [modifier]: true });
        globalThis.removeEventListener('keydown', window);

        expect(overlay()).not.toBeNull();
        expect(window).not.toHaveBeenCalled();
        expect(proceeded).toBe(false);
    });

    it('a repeated Escape keeps the scene open and never reaches the window', () => {
        const window = vi.fn();

        playStory(PROLOGUE, options());
        globalThis.addEventListener('keydown', window);
        key({ key: 'Escape', repeat: true });
        globalThis.removeEventListener('keydown', window);

        expect(overlay()).not.toBeNull();
        expect(window).not.toHaveBeenCalled();
    });

    it('another key does nothing', () => {
        playStory(PROLOGUE, options());

        key({ key: 'a' });

        expect(overlay()).not.toBeNull();
    });

    it('mute mutes every audio and the next scene starts muted', () => {
        playStory(PROLOGUE, options());
        const mute = document.querySelector('[data-testid="story-mute"]');

        mute.click();

        expect(audios.every((audio) => audio.muted)).toBe(true);
        expect(mute.getAttribute('aria-label')).toBe('Ativar som');
        expect(storyMuted()).toBe(true);

        document.querySelector('[data-testid="story-skip"]').click();
        audios.length = 0;
        playStory(PROLOGUE, options());

        expect(audios.every((audio) => audio.muted)).toBe(true);
    });

    it('a second mute click unmutes', () => {
        playStory(PROLOGUE, options());
        const mute = document.querySelector('[data-testid="story-mute"]');

        mute.click();
        mute.click();

        expect(audios.every((audio) => !audio.muted)).toBe(true);
        expect(mute.getAttribute('aria-label')).toBe('Silenciar');
    });

    it('a resize sets the new scale', () => {
        let size = { width: 1280, height: 720 };
        const settings = options({ viewport: () => size });

        playStory(PROLOGUE, settings);
        size = { width: 1920, height: 1080 };
        settings.window.dispatchEvent(new Event('resize'));

        expect(document.querySelector('[data-testid="story-stage"]').style.getPropertyValue('--story-scale')).toBe('1.5');
    });

    it('close gives the focus back', () => {
        const opener = document.createElement('button');

        document.body.append(opener);
        opener.focus();
        playStory(PROLOGUE, options());

        document.querySelector('[data-testid="story-skip"]').click();

        expect(document.activeElement).toBe(opener);
    });

    it('closing twice resolves once and later audio events do nothing', () => {
        playStory(PROLOGUE, options());
        hit().click();
        const skip = document.querySelector('[data-testid="story-skip"]');

        skip.click();

        expect(() => skip.click()).not.toThrow();
        expect(audios[0].onended).toBeNull();
        expect(overlay()).toBeNull();
        expect(timers.size).toBe(0);
    });

    it('the chapter 1 scene creates one audio per line with its file', () => {
        playStory(CHAPTER_1, options());

        expect(audios.map((audio) => audio.src)).toEqual([ 1, 2, 3, 4, 5, 6, 7 ].map((n) => `assets/story/chapter-01-0${n}.mp4`));
        expect(label()).toBe('Começar a cena');
    });

    it('a scene with no title card starts on line 1', () => {
        playStory({ ...PROLOGUE, title: undefined }, options());

        expect(audios[0].play).toHaveBeenCalledTimes(1);
    });
});
