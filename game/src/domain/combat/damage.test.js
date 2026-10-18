import { describe, expect, it } from 'vitest';
import { calculateDamage, formatDamage, MAGICAL, PLAYER } from './damage';

const enemy = (element, physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });
const never = () => 0.99;
const always = () => 0;

describe('the player', () => {
    it('is a fire, physical attacker with 1 base damage, 10 % critical chance and a double critical', () => {
        expect(PLAYER).toEqual({ element: 'FIRE', damageType: 'PHYSICAL', baseDamage: 1, critChance: 10, critMultiplier: 2 });
    });
});

describe('calculateDamage', () => {
    it('deals 0.9 to a darkness monster before defense and critical', () => {
        expect(calculateDamage({ defender: enemy('DARKNESS'), random: never }).damage).toBeCloseTo(0.9, 10);
    });

    it('deals 2 to a nature monster before defense and critical', () => {
        expect(calculateDamage({ defender: enemy('NATURE'), random: never }).damage).toBe(2);
    });

    it('deals 1 to a fire monster', () => {
        expect(calculateDamage({ defender: enemy('FIRE'), random: never })).toEqual({ damage: 1, critical: false });
    });

    it('multiplies by 1 minus the physical defense in percent', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 50, 0), random: never }).damage).toBe(0.5);
    });

    it('ignores the magical defense for a physical click', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 0, 80), random: never }).damage).toBe(1);
    });

    it('uses the magical defense, and not the physical one, for magical damage', () => {
        const attacker = { ...PLAYER, damageType: MAGICAL };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 80, 20), random: never }).damage).toBeCloseTo(0.8, 10);
    });

    it('deals 1 against nature with physical defense 50 and no critical (2 x 0.5)', () => {
        expect(calculateDamage({ defender: enemy('NATURE', 50), random: never }).damage).toBe(1);
    });

    it('doubles the damage on a critical hit and reports it', () => {
        expect(calculateDamage({ defender: enemy('NATURE', 50), random: always })).toEqual({ damage: 2, critical: true });
    });

    it('is critical just below the chance and not at it (10 %)', () => {
        expect(calculateDamage({ defender: enemy('FIRE'), random: () => 0.0999 }).critical).toBe(true);
        expect(calculateDamage({ defender: enemy('FIRE'), random: () => 0.1 }).critical).toBe(false);
    });

    it('lowers the critical chance by the critical resistance: 50 resistance makes it 5 %', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 0, 0, 50), random: () => 0.0499 }).critical).toBe(true);
        expect(calculateDamage({ defender: enemy('FIRE', 0, 0, 50), random: () => 0.05 }).critical).toBe(false);
    });

    it('never crits a monster with critical resistance 100, not even on the lowest roll', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 0, 0, 100), random: always }).critical).toBe(false);
    });

    it('does not round: defense 90 against a half-damage element deals 0.05', () => {
        expect(calculateDamage({ defender: enemy('WATER', 90), random: never }).damage).toBeCloseTo(0.05, 10);
    });

    it('combines element, defense and critical: darkness, defense 30, critical = 0.9 x 0.7 x 2', () => {
        expect(calculateDamage({ defender: enemy('DARKNESS', 30), random: always }).damage).toBeCloseTo(1.26, 10);
    });

    it('rolls the random source once per click', () => {
        let rolls = 0;

        calculateDamage({ defender: enemy('FIRE'), random: () => { rolls += 1; return 0.5; } });

        expect(rolls).toBe(1);
    });

    it('throws when the monster element is missing instead of dealing 1.0', () => {
        expect(() => calculateDamage({ defender: enemy(undefined), random: never })).toThrow('Unknown element');
    });
});

describe('formatDamage', () => {
    it('keeps one decimal', () => {
        expect(formatDamage(0.9)).toBe('0.9');
        expect(formatDamage(1.8)).toBe('1.8');
    });

    it('drops a trailing zero', () => {
        expect(formatDamage(2)).toBe('2');
        expect(formatDamage(1.0000001)).toBe('1');
    });

    it('rounds to one decimal', () => {
        expect(formatDamage(1.26)).toBe('1.3');
        expect(formatDamage(1.24)).toBe('1.2');
    });

    it('shows 0 below 0.05', () => {
        expect(formatDamage(0.04)).toBe('0');
        expect(formatDamage(0.0450000001)).toBe('0');
    });
});
