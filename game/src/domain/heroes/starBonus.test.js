import { describe, expect, it } from 'vitest';
import { starBonus, starPowerText } from './starBonus';

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

    it('adds nothing for a star count above 9 or missing', () => {
        expect(starBonus(undefined)).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
        expect(starBonus(10)).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
    });

    it.each([
        [ 4, { clickDamagePct: 70, critChance: 35, critDamagePct: 75 } ],
        [ 5, { clickDamagePct: 100, critChance: 40, critDamagePct: 100 } ],
        [ 6, { clickDamagePct: 130, critChance: 45, critDamagePct: 125 } ],
        [ 7, { clickDamagePct: 160, critChance: 50, critDamagePct: 150 } ],
        [ 8, { clickDamagePct: 190, critChance: 55, critDamagePct: 175 } ],
        [ 9, { clickDamagePct: 220, critChance: 60, critDamagePct: 200 } ]
    ])('adds the rows 4 to 9 of the spec: %i stars', (stars, row) => {
        expect(starBonus(stars)).toEqual(row);
    });
});

describe('starPowerText', () => {
    it('reads every star count', () => {
        expect(starPowerText(0)).toBe('');
        expect(starPowerText(1)).toBe('Poder das estrelas: +10% de dano de clique');
        expect(starPowerText(2)).toBe('Poder das estrelas: +20% de dano de clique, +20% de dano crítico');
        expect(starPowerText(3)).toBe('Poder das estrelas: +40% de dano de clique, +30 de chance de crítico, +50% de dano crítico');
        expect(starPowerText(4)).toBe('Poder das estrelas: +70% de dano de clique, +35 de chance de crítico, +75% de dano crítico');
        expect(starPowerText(5)).toBe('Poder das estrelas: +100% de dano de clique, +40 de chance de crítico, +100% de dano crítico');
        expect(starPowerText(6)).toBe('Poder das estrelas: +130% de dano de clique, +45 de chance de crítico, +125% de dano crítico');
        expect(starPowerText(7)).toBe('Poder das estrelas: +160% de dano de clique, +50 de chance de crítico, +150% de dano crítico');
        expect(starPowerText(8)).toBe('Poder das estrelas: +190% de dano de clique, +55 de chance de crítico, +175% de dano crítico');
        expect(starPowerText(9)).toBe('Poder das estrelas: +220% de dano de clique, +60 de chance de crítico, +200% de dano crítico');
    });
});
