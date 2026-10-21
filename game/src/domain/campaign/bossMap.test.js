import { describe, expect, it } from 'vitest';
import { bossMapStops, stopId } from './bossMap';
import { CHAPTER_BOSS, MINIBOSS } from './campaign';

const minibosses = (...stages) => stages.map((stage) => ({ kind: MINIBOSS, stage }));
const states = (stops) => stops.map(({ state }) => state);
const at = (stage, kind = 'PHASE', completed = false) => ({ stage, kind, completed });

describe('bossMapStops', () => {
    it('lists the minibosses 1 to 10 and then the chapter boss, in path order', () => {
        const stops = bossMapStops({ bosses: [], position: at(1), stageCount: 10 });

        expect(stops.map(({ id }) => id)).toEqual([ ...Array.from({ length: 10 }, (_, i) => `miniboss-${i + 1}`), 'chapter-boss' ]);
        expect(stops.at(-1)).toMatchObject({ kind: CHAPTER_BOSS, id: 'chapter-boss' });
        expect(stops[3]).toMatchObject({ kind: MINIBOSS, stage: 4 });
    });

    it('at stage 4 with the minibosses 1 to 3 beaten: three defeated, stop 4 current, the rest locked', () => {
        const stops = bossMapStops({ bosses: minibosses(1, 2, 3), position: at(4, 'PHASE'), stageCount: 10 });

        expect(states(stops)).toEqual([ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]);
    });

    it('treats the miniboss fight of the current stage like the phases before it: the same stop is current', () => {
        const stops = bossMapStops({ bosses: minibosses(1, 2, 3), position: at(4, 'MINIBOSS'), stageCount: 10 });

        expect(stops[3].state).toBe('current');
    });

    it('at the chapter boss with the 10 minibosses beaten: stops 1 to 10 defeated and the chapter boss current', () => {
        const stops = bossMapStops({ bosses: minibosses(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), position: at(10, CHAPTER_BOSS), stageCount: 10 });

        expect(states(stops)).toEqual([ ...Array(10).fill('defeated'), 'current' ]);
    });

    it('at stage 1 with nothing beaten: stop 1 current and every other stop locked', () => {
        const stops = bossMapStops({ bosses: [], position: at(1), stageCount: 10 });

        expect(states(stops)).toEqual([ 'current', ...Array(10).fill('locked') ]);
    });

    it('once the campaign is completed: the chapter boss defeated and no stop current', () => {
        const stops = bossMapStops({
            bosses: [ ...minibosses(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), { kind: CHAPTER_BOSS } ],
            position: at(10, CHAPTER_BOSS, true),
            stageCount: 10
        });

        expect(states(stops)).toEqual(Array(11).fill('defeated'));
        expect(states(stops)).not.toContain('current');
    });

    it('keeps a stop defeated when it is also the next boss', () => {
        expect(bossMapStops({ bosses: minibosses(2), position: at(2), stageCount: 3 })[1].state).toBe('defeated');
    });

    it('follows the stage count of the chapter', () => {
        const stops = bossMapStops({ bosses: [], position: at(1), stageCount: 3 });

        expect(stops.map(({ id }) => id)).toEqual([ 'miniboss-1', 'miniboss-2', 'miniboss-3', 'chapter-boss' ]);
    });
});

describe('stopId', () => {
    it('names a miniboss by its stage and the chapter boss alone', () => {
        expect(stopId({ kind: MINIBOSS, stage: 7 })).toBe('miniboss-7');
        expect(stopId({ kind: CHAPTER_BOSS })).toBe('chapter-boss');
    });
});
