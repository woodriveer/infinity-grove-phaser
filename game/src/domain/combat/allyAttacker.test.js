import { describe, expect, it } from 'vitest';
import { tickDamage } from '../skills/skillDamage';
import { allyAttacker, allyDamagePerClick, allyStarMultiplier } from './allyAttacker';

const weapon = (clickDamage) => ({ id: 'w', slot: 'WEAPON', clickDamage, affixes: [] });
const ring = (...affixes) => ({ id: 'r', slot: 'RING', affixes });
const affix = (type, value) => ({ type, value });

describe('allyAttacker', () => {
    it('the star multiplier is 2, 4, 6, 8, 10, 12, 14, 16, 18 and 20 for 0 to 9 stars', () => {
        expect(allyStarMultiplier(0)).toBe(2);
        expect(allyStarMultiplier(1)).toBe(4);
        expect(allyStarMultiplier(2)).toBe(6);
        expect(allyStarMultiplier(3)).toBe(8);
        expect(allyStarMultiplier(4)).toBe(10);
        expect(allyStarMultiplier(5)).toBe(12);
        expect(allyStarMultiplier(6)).toBe(14);
        expect(allyStarMultiplier(7)).toBe(16);
        expect(allyStarMultiplier(8)).toBe(18);
        expect(allyStarMultiplier(9)).toBe(20);
    });

    it('a star count outside 0 to 9 reads 2', () => {
        expect(allyStarMultiplier(10)).toBe(2);
        expect(allyStarMultiplier(-1)).toBe(2);
        expect(allyStarMultiplier(undefined)).toBe(2);
    });

    it('an ally with no pieces at 0 stars hits for 2 with the leader\'s element, no critical, no pierce and no boss damage', () => {
        expect(allyAttacker({ ally: { stars: 0 }, leaderElement: 'WATER' })).toEqual({
            element: 'WATER', baseDamage: 2, critChance: 0, critMultiplier: 1, armorPierce: 0, bossDamage: 0
        });
    });

    it('Orina 3 stars with a 10 click weapon at +0 and a ring of +20 % click damage has base 105.6 (E3)', () => {
        const attacker = allyAttacker({
            ally: { stars: 3 }, pieces: [ weapon(10), ring(affix('CLICK_DAMAGE_PCT', 20)) ], leaderElement: 'NATURE'
        });

        expect(attacker.baseDamage).toBeCloseTo(105.6, 9);
    });

    it('the team factor 1.25 makes Lyra 0 stars 2.5', () => {
        expect(allyAttacker({ ally: { stars: 0 }, leaderElement: 'FIRE', allyFactor: 1.25 }).baseDamage).toBeCloseTo(2.5, 9);
    });

    it('a 9 star ally without pieces has base 20 (E12)', () => {
        expect(allyAttacker({ ally: { stars: 9 }, leaderElement: 'FIRE' }).baseDamage).toBeCloseTo(20, 9);
    });

    it('armor pierce and boss damage come from the ally\'s pieces', () => {
        const amulet = { id: 'a', slot: 'AMULET', affixes: [ affix('BOSS_DAMAGE_PCT', 20) ] };
        const attacker = allyAttacker({ ally: { stars: 0 }, pieces: [ ring(affix('ARMOR_PIERCE_PCT', 50)), amulet ], leaderElement: 'FIRE' });

        expect(attacker.armorPierce).toBe(50);
        expect(attacker.bossDamage).toBe(20);
    });

    it('critical chance and critical damage pieces do not make an ally critical', () => {
        const attacker = allyAttacker({
            ally: { stars: 0 }, pieces: [ ring(affix('CRIT_CHANCE', 50), affix('CRIT_DAMAGE_PCT', 100)) ], leaderElement: 'FIRE'
        });

        expect(attacker.critChance).toBe(0);
        expect(attacker.critMultiplier).toBe(1);
        expect(attacker.baseDamage).toBeCloseTo(2, 9);
    });

    it('allyDamagePerClick reads 2, 105.6, 2.5 and 12500', () => {
        expect(allyDamagePerClick({ ally: { stars: 0 } })).toBeCloseTo(2, 9);
        expect(allyDamagePerClick({ ally: { stars: 3 }, pieces: [ weapon(10), ring(affix('CLICK_DAMAGE_PCT', 20)) ] })).toBeCloseTo(105.6, 9);
        expect(allyDamagePerClick({ ally: { stars: 0 }, allyFactor: 1.25 })).toBeCloseTo(2.5, 9);
        expect(allyDamagePerClick({ ally: { stars: 9 }, pieces: [ weapon(624) ] })).toBeCloseTo(12500, 9);
    });
});

describe('allyAttacker wearing the Cajado da Consciência Negra', () => {
    const STAFF10 = { id: 's', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, clickDamage: 10, affixes: [], special: 'BLACK_AWARENESS_STAFF' };

    it('an ally of 0 stars wearing the staff carries darknessDamagePct 200 and base 22', () => {
        expect(allyAttacker({ ally: { stars: 0 }, pieces: [ STAFF10 ], leaderElement: 'FIRE' })).toEqual({
            element: 'FIRE', baseDamage: 22, critChance: 0, critMultiplier: 1, armorPierce: 0, bossDamage: 0, darknessDamagePct: 200
        });
    });

    it('its hit on a DARKNESS monster of defense 0 is 59.4', () => {
        const attacker = allyAttacker({ ally: { stars: 0 }, pieces: [ STAFF10 ], leaderElement: 'FIRE' });
        const defender = { element: 'DARKNESS', defense: 0, critResistance: 0 };

        expect(tickDamage({ attacker, percent: 100, buffs: [], debuffs: [], defender, boss: false })).toBeCloseTo(59.4, 10);
    });

    it('an ally without the staff has no darknessDamagePct field', () => {
        const attacker = allyAttacker({ ally: { stars: 0 }, pieces: [ { ...STAFF10, special: undefined } ], leaderElement: 'FIRE' });

        expect('darknessDamagePct' in attacker).toBe(false);
    });
});
