import { describe, expect, it } from 'vitest';
import { skillOf, SKILLS } from './skillCatalog';

//  Cooldown seconds, in slot order, as seeded in the backend HeroSeed
const COOLDOWNS = { kael: [ 20, 25, 30 ], lyra: [ 8, 30, 40 ], orina: [ 18, 35, 45 ], seraphine: [ 30, 25, 45 ], vex: [ 15, 35, 20 ] };

describe('skillCatalog', () => {
    it('holds three skills for each of the five heroes', () => {
        expect(Object.keys(SKILLS).sort()).toEqual([ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ]);
        Object.values(SKILLS).forEach((skills) => expect(Object.keys(skills)).toEqual([ '1', '2', '3' ]));
    });

    it.each(Object.entries(COOLDOWNS))('gives %s the cooldowns of the hero seed', (heroId, seconds) => {
        expect([ 1, 2, 3 ].map((slot) => skillOf(heroId, slot).cooldownMs / 1000)).toEqual(seconds);
    });

    it('pins the damage type of every skill: Kael, Lyra and Vex physical, Orina and Seraphine magical', () => {
        const types = (heroId) => [ 1, 2, 3 ].map((slot) => skillOf(heroId, slot).damageType);

        expect(types('kael')).toEqual([ 'PHYSICAL', 'PHYSICAL', 'PHYSICAL' ]);
        expect(types('lyra')).toEqual([ 'PHYSICAL', 'PHYSICAL', 'PHYSICAL' ]);
        expect(types('orina')).toEqual([ 'MAGICAL', 'MAGICAL', 'MAGICAL' ]);
        expect(types('seraphine')).toEqual([ 'MAGICAL', 'MAGICAL', 'MAGICAL' ]);
        expect(types('vex')).toEqual([ 'PHYSICAL', 'PHYSICAL', 'PHYSICAL' ]);
    });

    it('pins the instant hits of the table', () => {
        expect(skillOf('kael', 1)).toMatchObject({ damageType: 'PHYSICAL', hits: [ { percent: 1500, armorPierce: 30 } ] });
        expect(skillOf('kael', 2)).toMatchObject({ damageType: 'PHYSICAL', hits: [ { percent: 400 } ], stunMs: 3000 });
        expect(skillOf('lyra', 1).hits).toEqual([ { percent: 300 }, { percent: 300 } ]);
        expect(skillOf('orina', 3)).toMatchObject({ damageType: 'MAGICAL', hits: [ { percent: 2500 } ] });
        expect(skillOf('seraphine', 2)).toMatchObject({ damageType: 'MAGICAL', hits: [ { percent: 800 } ], vsDarkness: 1.5 });
        expect(skillOf('vex', 3)).toMatchObject({ damageType: 'PHYSICAL', hits: [ { percent: 600 } ] });
    });

    it('pins the timed effects of the table', () => {
        expect(skillOf('kael', 3).debuff).toEqual({ id: 'brado', ms: 10000 });
        expect(skillOf('lyra', 3).buff).toEqual({ id: 'ventos', ms: 12000 });
        expect(skillOf('orina', 1)).toMatchObject({ debuff: { id: 'prisao', ms: 2000 }, rootMs: 2000 });
        expect(skillOf('seraphine', 1).buff).toEqual({ id: 'bencao', ms: 15000 });
        expect(skillOf('seraphine', 3).countdownExtendMs).toBe(4000);
        expect(skillOf('vex', 2).buff).toEqual({ id: 'fumaca', ms: 10000 });
    });

    it('pins the cast and the damage over time of the table', () => {
        expect(skillOf('lyra', 2).cast).toEqual({ ms: 2000, hit: { percent: 3000 } });
        expect(skillOf('orina', 2).ticks).toEqual({ id: 'tempestade', percent: 200, count: 6 });
        expect(skillOf('vex', 1).ticks).toEqual({ id: 'veneno', percent: 100, count: 8, maxStacks: 3 });
        expect(skillOf('vex', 3).ticks).toEqual({ id: 'sangramento', percent: 150, count: 6 });
    });

    it('returns null for an unknown hero or slot', () => {
        expect(skillOf('nobody', 1)).toBeNull();
        expect(skillOf('kael', 4)).toBeNull();
    });
});
