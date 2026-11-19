import { describe, expect, it } from 'vitest';
import { addsOf } from './adds';
import { DEFAULT_STATS } from './monster';

const WATER = { element: 'WATER', defense: 0, critResistance: 0 };
const valid = (health, defenseBuff = 30) => ({ health, defenseBuff });

describe('addsOf', () => {
    it('a stage without adds has none', () => {
        expect(addsOf({ monster: WATER })).toEqual([]);
    });

    it('adds that are not a list give none', () => {
        expect(addsOf({ monster: WATER, adds: 'x' })).toEqual([]);
        expect(addsOf({ monster: WATER, adds: null })).toEqual([]);
        expect(addsOf({ monster: WATER, adds: {} })).toEqual([]);
    });

    it('a missing stage gives none', () => {
        expect(addsOf(undefined)).toEqual([]);
    });

    it("two valid adds keep their order, health, buff and the stage's phase monster stats", () => {
        const adds = addsOf({ monster: WATER, adds: [ valid(1966080, 30), valid(20, 0) ] });

        expect(adds).toEqual([
            { health: 1966080, defenseBuff: 30, stats: WATER },
            { health: 20, defenseBuff: 0, stats: WATER }
        ]);
    });

    it('a stage without a phase monster gives its adds the default stats', () => {
        const adds = addsOf({ adds: [ valid(20) ] });

        expect(adds[0].stats).toBe(DEFAULT_STATS);
    });

    it('an add of health 0, 0.5, a string or no health is skipped', () => {
        const adds = [ { health: 0 }, { health: 0.5 }, { health: '30' }, {} ].map((add) => ({ ...add, defenseBuff: 30 }));

        expect(addsOf({ monster: WATER, adds })).toEqual([]);
    });

    it('an add of health 1 is kept', () => {
        expect(addsOf({ monster: WATER, adds: [ valid(1) ] })).toEqual([ { health: 1, defenseBuff: 30, stats: WATER } ]);
    });

    it('a health above 2^31 is kept', () => {
        expect(addsOf({ monster: WATER, adds: [ valid(3000000000) ] })[0].health).toBe(3000000000);
    });

    it('a buff of -1, 91, 30.5, a string or no buff is skipped and 0 and 90 are kept', () => {
        const bad = [ { health: 30, defenseBuff: -1 }, { health: 30, defenseBuff: 91 }, { health: 30, defenseBuff: 30.5 }, { health: 30, defenseBuff: '30' }, { health: 30 } ];

        expect(addsOf({ monster: WATER, adds: bad })).toEqual([]);
        expect(addsOf({ monster: WATER, adds: [ valid(30, 0), valid(30, 90) ] }).map((add) => add.defenseBuff)).toEqual([ 0, 90 ]);
    });

    it('only the first 2 valid adds count', () => {
        const [ a, b, c ] = [ valid(10), valid(20), valid(30) ];

        expect(addsOf({ monster: WATER, adds: [ a, b, c ] }).map((add) => add.health)).toEqual([ 10, 20 ]);
        expect(addsOf({ monster: WATER, adds: [ valid(0), a, b, c ] }).map((add) => add.health)).toEqual([ 10, 20 ]);
    });
});
