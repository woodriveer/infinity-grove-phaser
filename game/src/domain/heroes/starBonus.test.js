import { describe, expect, it } from 'vitest';
import { starBonus } from './starBonus';

describe('starBonus', () => {
    it('adds nothing at 0 stars', () => {
        expect(starBonus(0)).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
    });

    it('adds 10 % click damage at 1 star', () => {
        expect(starBonus(1)).toEqual({ clickDamagePct: 10, critChance: 0, critDamagePct: 0 });
    });

    it('adds 20 % click damage and 20 % critical damage at 2 stars, as totals not on top of 1 star', () => {
        expect(starBonus(2)).toEqual({ clickDamagePct: 20, critChance: 0, critDamagePct: 20 });
    });

    it('adds 40 % click damage, 50 % critical damage and 30 points of critical chance at 3 stars', () => {
        expect(starBonus(3)).toEqual({ clickDamagePct: 40, critChance: 30, critDamagePct: 50 });
    });

    it('adds nothing for a star count the game does not know', () => {
        expect(starBonus(undefined)).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
        expect(starBonus(4)).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
    });
});
