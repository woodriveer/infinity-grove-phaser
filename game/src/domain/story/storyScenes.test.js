import { describe, expect, it } from 'vitest';
import { replayableScenes, sceneToPlay, validateCatalog, validateScene } from './storyScenes';

const BACKDROPS = { forest: { image: 'a.png', motion: 'drift' } };
const BACKDROPS_CAM = {
    ...BACKDROPS,
    clearing: { image: 'c.jpg', motion: 'still', cameras: { kael: { x: -551, y: -350, scale: 1.75 } } }
};
const line = (extra) => ({ kind: 'narrator', speaker: 'N', backdrop: 'forest', tints: [], audio: 'a.mp4', duration: 2, cues: [ [ 0, 1, 'Olá.' ] ], ...extra });
const scene = (extra) => ({ id: 'chapter-1', label: 'Capítulo 1', trigger: { kind: 'chapter-boss', chapter: 1 }, lines: [ line() ], ...extra });
const PROLOGUE = scene({ id: 'prologue', label: 'Prólogo', trigger: { kind: 'chapter-start', chapter: 1 } });
const CH1 = scene();
const CH2 = scene({ id: 'chapter-2', label: 'Capítulo 2', trigger: { kind: 'chapter-boss', chapter: 2 } });
const CATALOG = [ PROLOGUE, CH1, CH2 ];

const errorsOf = (extra, backdrops = BACKDROPS) => validateScene(scene(extra), backdrops);

describe('validateScene', () => {
    it('a valid scene has no error', () => {
        expect(validateScene(scene(), BACKDROPS)).toEqual([]);
        expect(validateScene(scene({
            title: { kicker: 'k', cta: 'c' },
            end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd' },
            lines: [ line({ kind: 'character', speaker: 'Kael', portrait: 'p.png' }) ]
        }), BACKDROPS)).toEqual([]);
    });

    it('chapter-1: id must be lowercase letters, digits and dashes', () => {
        expect(errorsOf({ id: 'Capítulo 1' })).toEqual([ 'Capítulo 1: id must be lowercase letters, digits and dashes' ]);
        expect(errorsOf({ id: 7 })).toEqual([ '?: id must be lowercase letters, digits and dashes' ]);
    });

    it('chapter-1: label is missing', () => {
        expect(errorsOf({ label: '' })).toEqual([ 'chapter-1: label is missing' ]);
    });

    it('chapter-1: trigger must be chapter-start or chapter-boss with a chapter of at least 1', () => {
        const message = 'chapter-1: trigger must be chapter-start or chapter-boss with a chapter of at least 1';

        expect(errorsOf({ trigger: { kind: 'boss', chapter: 1 } })).toEqual([ message ]);
        expect(errorsOf({ trigger: { kind: 'chapter-boss', chapter: 0 } })).toEqual([ message ]);
        expect(errorsOf({ trigger: { kind: 'chapter-boss', chapter: 1.5 } })).toEqual([ message ]);
    });

    it('chapter-1: title needs kicker and cta', () => {
        expect(errorsOf({ title: { kicker: 'k' } })).toEqual([ 'chapter-1: title needs kicker and cta' ]);
    });

    it('chapter-1: end needs kicker, title, subtitle and cta', () => {
        expect(errorsOf({ end: { kicker: 'a', title: 'b', subtitle: 'c' } })).toEqual([ 'chapter-1: end needs kicker, title, subtitle and cta' ]);
    });

    it('chapter-1: a scene needs at least one line', () => {
        expect(errorsOf({ lines: [] })).toEqual([ 'chapter-1: a scene needs at least one line' ]);
    });

    it('chapter-1 line 2: kind must be narrator, voice or character', () => {
        expect(errorsOf({ lines: [ line(), line({ kind: 'sera' }) ] })).toEqual([ 'chapter-1 line 2: kind must be narrator, voice or character' ]);
    });

    it('chapter-1 line 1: speaker is missing', () => {
        expect(errorsOf({ lines: [ line({ kind: 'voice', speaker: '' }) ] })).toEqual([ 'chapter-1 line 1: speaker is missing' ]);
        expect(errorsOf({ lines: [ line({ speaker: undefined }) ] })).toEqual([]);
    });

    it('a character line needs a portrait or a face, not both', () => {
        const base = { kind: 'character', speaker: 'Kael' };

        expect(errorsOf({ lines: [ line(base) ] })).toEqual([ 'chapter-1 line 1: a character line needs a portrait or a face' ]);
        expect(errorsOf({ lines: [ line({ ...base, portrait: 'p.png', face: 'f.jpg' }) ] }))
            .toEqual([ 'chapter-1 line 1: a character line takes a portrait or a face, not both' ]);
        expect(errorsOf({ lines: [ line({ ...base, face: 'f.jpg' }) ] })).toEqual([]);
    });

    it('chapter-1: title backdrop or tints are unknown', () => {
        expect(errorsOf({ title: { kicker: 'k', cta: 'c', backdrop: 'cave' } })).toEqual([ 'chapter-1: title backdrop or tints are unknown' ]);
        expect(errorsOf({ end: { kicker: 'a', title: 'b', subtitle: 'c', cta: 'd', tints: [ 'blue' ] } })).toEqual([ 'chapter-1: end backdrop or tints are unknown' ]);
    });

    it('chapter-1: letterbox must be true or false', () => {
        expect(errorsOf({ letterbox: 'yes' })).toEqual([ 'chapter-1: letterbox must be true or false' ]);
        expect(errorsOf({ letterbox: true })).toEqual([]);
    });

    it('chapter-1: motes must be [left, top, delay, duration] numbers', () => {
        const message = 'chapter-1: motes must be [left, top, delay, duration] numbers';

        expect(errorsOf({ motes: [ [ 1, 2, 3 ] ] })).toEqual([ message ]);
        expect(errorsOf({ motes: [ [ 1, 2, 3, 0 ] ] })).toEqual([ message ]);
        expect(errorsOf({ motes: [ [ 1, 2, 3, 4 ] ] })).toEqual([]);
    });

    it('chapter-1 line 1: unknown camera', () => {
        const clearing = (extra) => errorsOf({ lines: [ line({ backdrop: 'clearing', ...extra }) ] }, BACKDROPS_CAM);

        expect(clearing({ camera: 'lyra' })).toEqual([ 'chapter-1 line 1: unknown camera lyra for backdrop clearing' ]);
        expect(clearing({ camera: 'kael' })).toEqual([]);
        expect(clearing({ camera: 'wide' })).toEqual([]);
        expect(errorsOf({ lines: [ line({ camera: 'kael' }) ] }, BACKDROPS_CAM)).toEqual([ 'chapter-1 line 1: unknown camera kael for backdrop forest' ]);
    });

    it('chapter-1 line 1: unknown backdrop cave', () => {
        expect(errorsOf({ lines: [ line({ backdrop: 'cave' }) ] })).toEqual([ 'chapter-1 line 1: unknown backdrop cave' ]);
    });

    it('chapter-1 line 1: unknown tint', () => {
        expect(errorsOf({ lines: [ line({ tints: [ 'dawn', 'veins' ] }) ] })).toEqual([]);
        expect(errorsOf({ lines: [ line({ tints: [ 'dark', 'blue', 'pink' ] }) ] }))
            .toEqual([ 'chapter-1 line 1: unknown tint blue', 'chapter-1 line 1: unknown tint pink' ]);
    });

    it('chapter-1 line 1: tintAt names a tint the line does not use', () => {
        expect(errorsOf({ lines: [ line({ tints: [ 'dark' ], tintAt: { red: 1 } }) ] }))
            .toEqual([ 'chapter-1 line 1: tintAt names a tint the line does not use: red' ]);
    });

    it('chapter-1 line 1: audio is missing', () => {
        expect(errorsOf({ lines: [ line({ audio: '' }) ] })).toEqual([ 'chapter-1 line 1: audio is missing' ]);
    });

    it('chapter-1 line 1: duration must be above 0', () => {
        expect(errorsOf({ lines: [ line({ duration: 0 }) ] })).toEqual([ 'chapter-1 line 1: duration must be above 0' ]);
    });

    it('chapter-1 line 1: a line needs at least one cue', () => {
        expect(errorsOf({ lines: [ line({ cues: [] }) ] })).toEqual([ 'chapter-1 line 1: a line needs at least one cue' ]);
    });

    it.each([
        [ 'cues that overlap', [ [ 0, 1, 'a' ], [ 0.5, 1.5, 'b' ] ] ],
        [ 'a cue that starts after it ends', [ [ 0, 1, 'a' ], [ 1.5, 1.2, 'b' ] ] ],
        [ 'a cue past the duration', [ [ 0, 1, 'a' ], [ 1, 2.5, 'b' ] ] ],
        [ 'a cue with no text', [ [ 0, 1, 'a' ], [ 1, 2, '' ] ] ]
    ])('chapter-1 line 1 cue 2: %s', (name, cues) => {
        expect(errorsOf({ lines: [ line({ cues }) ] })).toEqual([ 'chapter-1 line 1 cue 2: cues must be in order, inside the duration and carry text' ]);
    });

    it('a scene with several broken rules lists every message in rule order', () => {
        expect(errorsOf({ label: '', lines: [ line({ audio: '' }) ] })).toEqual([ 'chapter-1: label is missing', 'chapter-1 line 1: audio is missing' ]);
    });
});

describe('validateCatalog', () => {
    it('lists a backdrop with no image', () => {
        expect(validateCatalog([], { cave: { motion: 'still' } })).toEqual([ 'backdrop cave: image is missing' ]);
    });

    it('lists a backdrop of an unknown motion', () => {
        expect(validateCatalog([], { cave: { image: 'c.png', motion: 'spin' } })).toEqual([ 'backdrop cave: motion must be drift, pan or still' ]);
    });

    it('lists a repeated id once', () => {
        const errors = validateCatalog([ CH1, CH1, CH1 ], BACKDROPS);

        expect(errors.filter((error) => error === 'duplicate scene id chapter-1')).toHaveLength(1);
        expect(errors.filter((error) => error === 'two scenes share the trigger chapter-boss 1')).toHaveLength(1);
    });

    it('of a valid catalog is empty', () => {
        expect(validateCatalog(CATALOG, BACKDROPS)).toEqual([]);
    });

    it('lists a broken camera', () => {
        const message = (name) => `backdrop clearing camera ${name}: needs x, y and a scale above 0`;
        const clearing = (cameras) => validateCatalog([], { clearing: { image: 'c.jpg', motion: 'still', cameras } });

        expect(clearing({ kael: { x: 0, y: 0, scale: 0 } })).toEqual([ message('kael') ]);
        expect(clearing({ lyra: { x: 0, scale: 1 } })).toEqual([ message('lyra') ]);
        expect(clearing({ kael: { x: 0, y: 0, scale: 1, ms: 0 } })).toEqual([ message('kael') ]);
    });

    it('refuses a camera named wide', () => {
        expect(validateCatalog([], { clearing: { image: 'c.jpg', motion: 'still', cameras: { wide: { x: 0, y: 0, scale: 1 } } } }))
            .toEqual([ 'backdrop clearing camera wide: wide is reserved' ]);
    });

    it('lists the backdrop errors before the scene errors', () => {
        expect(validateCatalog([ scene({ label: '' }) ], { forest: { motion: 'drift' } }))
            .toEqual([ 'backdrop forest: image is missing', 'chapter-1: label is missing' ]);
    });
});

describe('sceneToPlay', () => {
    const play = (from, to, seen = []) => sceneToPlay(CATALOG, { from, to, seen });

    it('the first encounter at chapter 1 opens the prologue', () => {
        expect(play(null, 1)).toBe(PROLOGUE);
    });

    it('a seen prologue opens nothing', () => {
        expect(play(null, 1, [ 'prologue' ])).toBeNull();
    });

    it('the first encounter at chapter 2 opens nothing', () => {
        expect(play(null, 2)).toBeNull();
    });

    it('a completed campaign on load opens nothing', () => {
        expect(play(null, null)).toBeNull();
    });

    it('moving from chapter 1 to 2 opens the chapter 1 boss scene', () => {
        expect(play(1, 2)).toBe(CH1);
    });

    it('completing the campaign at chapter 1 opens the chapter 1 boss scene', () => {
        expect(play(1, null)).toBe(CH1);
    });

    it('a seen boss scene opens nothing', () => {
        expect(play(1, 2, [ 'chapter-1' ])).toBeNull();
    });

    it('a reset from chapter 3 to 1 opens nothing', () => {
        expect(play(3, 1)).toBeNull();
    });

    it('staying in chapter 2 opens nothing', () => {
        expect(play(2, 2)).toBeNull();
    });

    it('a jump from chapter 1 to 3 opens nothing', () => {
        expect(play(1, 3)).toBeNull();
    });

    it('a chapter with no boss scene opens nothing', () => {
        expect(play(3, 4)).toBeNull();
    });
});

describe('replayableScenes', () => {
    it('lists the prologue when nothing was seen', () => {
        expect(replayableScenes(CATALOG, [], null)).toEqual([ PROLOGUE ]);
    });

    it('lists a seen boss scene after the prologue', () => {
        expect(replayableScenes(CATALOG, [ 'chapter-2' ], null)).toEqual([ PROLOGUE, CH2 ]);
    });

    it('keeps the catalog order, not the seen order', () => {
        expect(replayableScenes(CATALOG, [ 'chapter-2', 'chapter-1' ], null)).toEqual([ PROLOGUE, CH1, CH2 ]);
    });

    it('lists the boss scenes of the chapters the campaign passed', () => {
        expect(replayableScenes(CATALOG, [], { chapter: 2, completed: false })).toEqual([ PROLOGUE, CH1 ]);
        expect(replayableScenes(CATALOG, [], { chapter: 3, completed: false })).toEqual([ PROLOGUE, CH1, CH2 ]);
    });

    it('does not list the boss scene of the current chapter', () => {
        expect(replayableScenes(CATALOG, [], { chapter: 1, completed: false })).toEqual([ PROLOGUE ]);
    });

    it('a completed campaign lists the boss scene of its last chapter', () => {
        expect(replayableScenes(CATALOG, [], { chapter: 2, completed: true })).toEqual([ PROLOGUE, CH1, CH2 ]);
    });

    it('a reset back to chapter 1 lists only what was seen', () => {
        expect(replayableScenes(CATALOG, [ 'chapter-2' ], { chapter: 1, completed: false })).toEqual([ PROLOGUE, CH2 ]);
    });
});
