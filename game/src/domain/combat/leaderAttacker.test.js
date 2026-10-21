import { describe, expect, it } from 'vitest';
import { leaderAttacker } from './leaderAttacker';
import { PLAYER } from './damage';

const piece = (affixes, extra = {}) => ({ id: 'p', slot: 'RING', rarity: 'COMMON', refine: 0, affixes, sellPrice: 1, heroId: 'kael', ...extra });
const affix = (type, value) => ({ type, value });

describe('leaderAttacker', () => {
    it('is the default attacker before the heroes load', () => {
        expect(leaderAttacker({ leader: null })).toBe(PLAYER);
    });

    it('takes the element of the leader', () => {
        expect(leaderAttacker({ leader: { element: 'NATURE', stars: 0 } }).element).toBe('NATURE');
    });

    it('adds no star bonus at 0 stars', () => {
        const attacker = leaderAttacker({ leader: { element: 'FIRE', stars: 0 } });

        expect(attacker.baseDamage).toBe(1);
        expect(attacker.critChance).toBe(10);
        expect(attacker.critMultiplier).toBe(2);
    });

    it('gives a leader with 3 stars and no equipment 1.4 damage, 40 critical chance and x2.5', () => {
        const attacker = leaderAttacker({ leader: { element: 'NATURE', stars: 3 } });

        expect(attacker.baseDamage).toBeCloseTo(1.4, 10);
        expect(attacker.critChance).toBe(40);
        expect(attacker.critMultiplier).toBeCloseTo(2.5, 10);
    });

    it('adds the star click damage to the click damage percent of the equipment: 2 stars and +10 % make base x 1.3', () => {
        const attacker = leaderAttacker({ leader: { element: 'FIRE', stars: 2 }, pieces: [ piece([ affix('CLICK_DAMAGE_PCT', 10) ]) ] });

        expect(attacker.baseDamage).toBeCloseTo(1.3, 10);
    });

    it('adds the star critical damage to the equipment critical damage: 2 stars and +30 % make x2.5', () => {
        const attacker = leaderAttacker({ leader: { element: 'FIRE', stars: 2 }, pieces: [ piece([ affix('CRIT_DAMAGE_PCT', 30) ]) ] });

        expect(attacker.critMultiplier).toBeCloseTo(2.5, 10);
    });

    it('caps the critical chance at 100: 3 stars and 80 points of equipment', () => {
        const attacker = leaderAttacker({ leader: { element: 'FIRE', stars: 3 }, pieces: [ piece([ affix('CRIT_CHANCE', 80) ]) ] });

        expect(attacker.critChance).toBe(100);
    });

    it('keeps the weapon damage under the star percent: a weapon of 3 and 1 star hit for 4 x 1.1', () => {
        const attacker = leaderAttacker({ leader: { element: 'FIRE', stars: 1 }, pieces: [ piece([], { slot: 'WEAPON', clickDamage: 3 }) ] });

        expect(attacker.baseDamage).toBeCloseTo(4.4, 10);
    });
});
