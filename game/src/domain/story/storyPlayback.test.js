import { describe, expect, it } from 'vitest';
import {
    AUTO_ADVANCE_MS, advanceStory, cameraOf, cameraTransform, endLine, hitLabel, progressDots, sceneLook, skipStory, startStory, storyScale
} from './storyPlayback';

const L = (extra) => ({ kind: 'narrator', backdrop: 'forest', tints: [], cues: [ [ 0, 1, 'x' ] ], duration: 1, ...extra });
const FULL = { title: { kicker: 'k', cta: 'c' }, end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd' }, lines: [ L(), L() ] };
const BARE = { lines: [ L() ] };
const SIX = { lines: Array.from({ length: 6 }, () => L()) };
const RED = L({ tints: [ 'dark', 'red' ], tintAt: { red: 6.1 } });
const MAP = L({ backdrop: 'map', tints: [ 'gold' ] });
const CAMS = { clearing: { image: 'c.jpg', motion: 'still', cameras: { kael: { x: -551, y: -350, scale: 1.75 }, narr: { x: 0, y: -129, scale: 1.18, ms: 6000 } } } };
const CARDS = {
    title: { kicker: 'k', cta: 'c', action: 'Começar a cena', backdrop: 'clearing', tints: [ 'dark' ] },
    end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd', backdrop: 'clearing', tints: [ 'dark', 'dawn' ] },
    lines: [ L({ backdrop: 'clearing', camera: 'kael' }) ]
};

const TITLE = { phase: 'title', index: 0, complete: false };
const line = (index, complete = false) => ({ phase: 'line', index, complete });
const END = { phase: 'end', index: 1, complete: false };

describe('storyPlayback', () => {
    it('starts on the title card when the scene has one', () => {
        expect(startStory(FULL)).toEqual(TITLE);
    });

    it('starts on line 1 when the scene has no title', () => {
        expect(startStory(BARE)).toEqual(line(0));
    });

    it('a click on the title card starts line 1', () => {
        expect(advanceStory(FULL, TITLE)).toEqual(line(0));
    });

    it('a click on a typing line completes it', () => {
        expect(advanceStory(FULL, line(0))).toEqual(line(0, true));
    });

    it('a click on a complete line starts the next one', () => {
        expect(advanceStory(FULL, line(0, true))).toEqual(line(1));
    });

    it('a click on the complete last line shows the end card', () => {
        expect(advanceStory(FULL, line(1, true))).toEqual(END);
    });

    it('a click on the complete last line of a scene with no end card ends it', () => {
        expect(advanceStory(BARE, line(0, true))).toEqual({ phase: 'done', index: 0, complete: false });
    });

    it('a click on the end card ends the scene', () => {
        expect(advanceStory(FULL, END)).toEqual({ phase: 'done', index: 1, complete: false });
    });

    it('a click on a done scene changes nothing', () => {
        const done = { phase: 'done', index: 1, complete: false };

        expect(advanceStory(FULL, done)).toEqual(done);
    });

    it('does not change the state it is given', () => {
        const state = line(0);

        advanceStory(FULL, state);
        skipStory(state);

        expect(state).toEqual(line(0));
    });

    it('the audio end completes a typing line', () => {
        expect(endLine(line(0))).toEqual(line(0, true));
    });

    it('the audio end changes no other state', () => {
        expect(endLine(line(0, true))).toEqual(line(0, true));
        expect(endLine(TITLE)).toEqual(TITLE);
        expect(endLine(END)).toEqual(END);
    });

    it('skip ends the scene from the title card, a line and the end card', () => {
        expect(skipStory(TITLE).phase).toBe('done');
        expect(skipStory(line(0)).phase).toBe('done');
        expect(skipStory(END).phase).toBe('done');
    });

    it('the hit label of each state', () => {
        expect(hitLabel(TITLE, FULL)).toBe('Começar a história');
        expect(hitLabel(line(0), FULL)).toBe('Mostrar fala completa');
        expect(hitLabel(line(0, true), FULL)).toBe('Próxima fala');
        expect(hitLabel(END, FULL)).toBe('Continuar');
        expect(hitLabel({ phase: 'done', index: 1, complete: false }, FULL)).toBe('');
    });

    it('dots light up to the current line', () => {
        expect(progressDots(SIX, line(2))).toEqual([ true, true, true, false, false, false ]);
    });

    it('no dot is lit on the title and end cards', () => {
        expect(progressDots(SIX, TITLE)).toEqual(Array(6).fill(false));
        expect(progressDots(SIX, END)).toEqual(Array(6).fill(false));
    });

    it('the title and end cards look like the dark forest', () => {
        const look = { backdrop: 'forest', tints: [ 'dark' ], camera: 'wide' };

        expect(sceneLook(FULL, TITLE, 0)).toEqual(look);
        expect(sceneLook(FULL, END, 0)).toEqual(look);
    });

    it('a line with no tint shows its backdrop only', () => {
        expect(sceneLook(BARE, line(0), 0)).toEqual({ backdrop: 'forest', tints: [], camera: 'wide' });
    });

    it('the red tint waits for its second', () => {
        const scene = { lines: [ RED ] };

        expect(sceneLook(scene, line(0), 6.0).tints).toEqual([ 'dark' ]);
        expect(sceneLook(scene, line(0), 6.1).tints).toEqual([ 'dark', 'red' ]);
    });

    it('the red tint shows on a complete line whatever the second', () => {
        expect(sceneLook({ lines: [ RED ] }, line(0, true), 0).tints).toEqual([ 'dark', 'red' ]);
    });

    it('a map line shows the map and the gold tint', () => {
        expect(sceneLook({ lines: [ MAP ] }, line(0), 0)).toEqual({ backdrop: 'map', tints: [ 'gold' ], camera: 'wide' });
    });

    it.each([
        [ 1280, 720, 1 ], [ 1920, 1080, 1.5 ], [ 1024, 768, 0.8 ], [ 390, 844, 0.3046875 ]
    ])('the stage scale of %sx%s is %s', (width, height, scale) => {
        expect(storyScale(width, height)).toBe(scale);
    });

    it('auto-advance waits 1200 ms', () => {
        expect(AUTO_ADVANCE_MS).toBe(1200);
    });

    it('the title card label comes from its action', () => {
        expect(hitLabel(TITLE, CARDS)).toBe('Começar a cena');
        expect(hitLabel(TITLE, FULL)).toBe('Começar a história');
    });

    it('a card takes its backdrop and tints from the data', () => {
        expect(sceneLook(CARDS, TITLE, 0)).toEqual({ backdrop: 'clearing', tints: [ 'dark' ], camera: 'wide' });
        expect(sceneLook(CARDS, { phase: 'end', index: 0, complete: false }, 0)).toEqual({ backdrop: 'clearing', tints: [ 'dark', 'dawn' ], camera: 'wide' });
    });

    it('a line names its camera', () => {
        expect(sceneLook(CARDS, line(0), 0).camera).toBe('kael');
    });

    it('cameraOf finds the preset with the default 1800 ms', () => {
        expect(cameraOf(CAMS, { backdrop: 'clearing', camera: 'kael' })).toEqual({ x: -551, y: -350, scale: 1.75, ms: 1800 });
        expect(cameraOf(CAMS, { backdrop: 'clearing', camera: 'narr' })).toEqual({ x: 0, y: -129, scale: 1.18, ms: 6000 });
    });

    it('cameraOf of wide or an unknown camera is the identity', () => {
        const identity = { x: 0, y: 0, scale: 1, ms: 1800 };

        expect(cameraOf(CAMS, { backdrop: 'clearing', camera: 'wide' })).toEqual(identity);
        expect(cameraOf(CAMS, { backdrop: 'forest', camera: 'kael' })).toEqual(identity);
    });

    it('cameraTransform writes the CSS transform', () => {
        expect(cameraTransform({ x: -551, y: -350, scale: 1.75 })).toBe('translate(-551px, -350px) scale(1.75)');
        expect(cameraTransform(cameraOf(CAMS, { backdrop: 'forest', camera: 'wide' }))).toBe('translate(0px, 0px) scale(1)');
    });
});
