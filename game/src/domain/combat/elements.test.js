import { describe, expect, it } from 'vitest';
import { ELEMENTS, elementMultiplier } from './elements';

//  The whole table of the spec, written out pair by pair: rows attack, columns defend
//             FIRE  WATER NATURE LIGHT DARKNESS
const TABLE = {
    FIRE:     [ 1,   0.5,  2,     0.9,  0.9 ],
    WATER:    [ 2,   1,    0.5,   0.9,  0.9 ],
    NATURE:   [ 0.5, 2,    1,     0.9,  0.9 ],
    LIGHT:    [ 1.8, 1.8,  1.8,   1,    0.9 ],
    DARKNESS: [ 1.8, 1.8,  1.8,   0.9,  1 ]
};

describe('elementMultiplier', () => {
    it('lists the five elements', () => {
        expect(ELEMENTS).toEqual([ 'FIRE', 'WATER', 'NATURE', 'LIGHT', 'DARKNESS' ]);
    });

    for (const attacker of Object.keys(TABLE))
    {
        ELEMENTS.forEach((defender, column) => {
            it(`${attacker} against ${defender} multiplies by ${TABLE[attacker][column]}`, () => {
                expect(elementMultiplier(attacker, defender)).toBe(TABLE[attacker][column]);
            });
        });
    }

    it('covers all 25 attacker and defender pairs', () => {
        expect(Object.values(TABLE).flat()).toHaveLength(25);
    });

    it('throws for an unknown attacker', () => {
        expect(() => elementMultiplier('PLASMA', 'FIRE')).toThrow('Unknown element: PLASMA');
    });

    it('throws for an unknown or missing defender instead of dealing 1.0', () => {
        expect(() => elementMultiplier('FIRE', 'PLASMA')).toThrow('Unknown element: PLASMA');
        expect(() => elementMultiplier('FIRE', undefined)).toThrow('Unknown element');
    });
});
