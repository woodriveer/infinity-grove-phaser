import { describe, expect, it } from 'vitest';
import { calculateDamage, critOverflow, effectiveCritChance, formatDamage, PLAYER } from './damage';

const enemy = (element, defense = 0, critResistance = 0) => ({ element, defense, critResistance });
const never = () => 0.99;
const always = () => 0;

describe('the player', () => {
    it('is a fire attacker with 1 base damage, 10 % critical chance and a double critical', () => {
        expect(PLAYER).toEqual({ element: 'FIRE', baseDamage: 1, critChance: 10, critMultiplier: 2 });
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

    it('multiplies by 1 minus the defense in percent', () => {
        expect(calculateDamage({ defender: { element: 'FIRE', defense: 50, critResistance: 0 }, random: never }).damage).toBe(0.5);
    });

    it('never reads magicalDefense: a payload with only magicalDefense 80 deals 1', () => {
        const defender = { element: 'FIRE', magicalDefense: 80, critResistance: 0 };

        expect(calculateDamage({ defender, random: never }).damage).toBe(1);
    });

    it('meets the same defense whatever damageType an older attacker carries: defense 80 deals 0.2', () => {
        const attacker = { ...PLAYER, damageType: 'MAGICAL' };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 80), random: never }).damage).toBeCloseTo(0.2, 10);
    });

    it('reads defense before physicalDefense: defense 40 and physicalDefense 70 deal 0.6', () => {
        const defender = { element: 'FIRE', defense: 40, physicalDefense: 70, magicalDefense: 70, critResistance: 0 };

        expect(calculateDamage({ defender, random: never }).damage).toBeCloseTo(0.6, 10);
    });

    it('ignores physicalDefense of an old payload: physicalDefense 80 alone deals 1', () => {
        const defender = { element: 'FIRE', physicalDefense: 80, magicalDefense: 80, critResistance: 0 };

        expect(calculateDamage({ defender, random: never }).damage).toBe(1);
    });

    it('meets defense 0 when the stats carry no defense field', () => {
        expect(calculateDamage({ defender: { element: 'FIRE', critResistance: 0 }, random: never }).damage).toBe(1);
    });

    it('deals 1 against nature with defense 50 and no critical (2 x 0.5)', () => {
        expect(calculateDamage({ defender: enemy('NATURE', 50), random: never }).damage).toBe(1);
    });

    it('doubles the damage on a critical hit and reports it', () => {
        expect(calculateDamage({ defender: enemy('NATURE', 50), random: always })).toEqual({ damage: 2, critical: true });
    });

    it('is critical just below the chance and not at it (10 %)', () => {
        expect(calculateDamage({ defender: enemy('FIRE'), random: () => 0.0999 }).critical).toBe(true);
        expect(calculateDamage({ defender: enemy('FIRE'), random: () => 0.1 }).critical).toBe(false);
    });

    it('effectiveCritChance subtracts the resistance and stays between 0 and 100', () => {
        expect(effectiveCritChance(40, 30)).toBe(10);
        expect(effectiveCritChance(30, 50)).toBe(0);
        expect(effectiveCritChance(130, 10)).toBe(100);
        expect(effectiveCritChance(100, 0)).toBe(100);
    });

    it('critOverflow is the chance past 100 after the resistance', () => {
        expect(critOverflow(130, 10)).toBe(20);
        expect(critOverflow(110, 10)).toBe(0);
        expect(critOverflow(111, 10)).toBe(1);
        expect(critOverflow(40, 30)).toBe(0);
        expect(critOverflow(250, 100)).toBe(50);
    });

    it('40 against resistance 30 crits on a roll of 0.09 and not on 0.10', () => {
        const attacker = { ...PLAYER, critChance: 40 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 0, 30), random: () => 0.09 })).toEqual({ damage: 2, critical: true });
        expect(calculateDamage({ attacker, defender: enemy('FIRE', 0, 30), random: () => 0.10 })).toEqual({ damage: 1, critical: false });
    });

    it('never crits on a roll when the resistance reaches the chance: 30 against 50 on a roll of 0', () => {
        const attacker = { ...PLAYER, critChance: 30 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 0, 50), random: always })).toEqual({ damage: 1, critical: false });
    });

    it('adds the chance past 100 as critical damage: 130 against 10 with a x2.5 critical deals 2.7', () => {
        const attacker = { ...PLAYER, critChance: 130, critMultiplier: 2.5 };
        const result = calculateDamage({ attacker, defender: enemy('FIRE', 0, 10), random: never });

        expect(result.damage).toBeCloseTo(2.7, 10);
        expect(result.critical).toBe(true);
    });

    it('adds no overflow at exactly 100 after the resistance: 110 against 10 deals 2', () => {
        const attacker = { ...PLAYER, critChance: 110 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 0, 10), random: never }).damage).toBe(2);
    });

    it('adds 1 % for one point of overflow: 111 against 10 deals 2.01', () => {
        const attacker = { ...PLAYER, critChance: 111 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 0, 10), random: never }).damage).toBeCloseTo(2.01, 10);
    });

    it('clamps the chance at 100 and keeps the overflow: 250 against 100 deals 2.5', () => {
        const attacker = { ...PLAYER, critChance: 250 };
        const result = calculateDamage({ attacker, defender: enemy('FIRE', 0, 100), random: never });

        expect(result.damage).toBeCloseTo(2.5, 10);
        expect(result.critical).toBe(true);
    });

    it('a forced critical keeps the overflow: 150 against 20 deals 2.3', () => {
        const attacker = { ...PLAYER, critChance: 150 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 0, 20), random: never, forceCritical: true }).damage).toBeCloseTo(2.3, 10);
    });

    it('reads a missing critical resistance as 0: 40 crits on a roll of 0.39', () => {
        const attacker = { ...PLAYER, critChance: 40 };

        expect(calculateDamage({ attacker, defender: { element: 'FIRE', defense: 0 }, random: () => 0.39 }).critical).toBe(true);
    });

    it('never crits a monster with critical resistance 100, not even on the lowest roll', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 0, 100), random: always }).critical).toBe(false);
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

    it('abbreviates 5000 to 5K', () => {
        expect(formatDamage(5000)).toBe('5K');
    });

    it('rounds to 1000 first, so 999.96 reads 1K', () => {
        expect(formatDamage(999.96)).toBe('1K');
    });

    it('keeps 999.94 at one decimal below 1000', () => {
        expect(formatDamage(999.94)).toBe('999.9');
    });

    it('abbreviates 1234567 to 1.2M', () => {
        expect(formatDamage(1234567)).toBe('1.2M');
    });
});

describe('armor pierce', () => {
    it('ignores the given percent of the defense: 50 % of a 50 defense leaves 25', () => {
        const attacker = { ...PLAYER, armorPierce: 50 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 50), random: never }).damage).toBe(0.75);
    });

    it('ignores the whole defense at 100 % and never goes past it', () => {
        expect(calculateDamage({ attacker: { ...PLAYER, armorPierce: 100 }, defender: enemy('FIRE', 50), random: never }).damage).toBe(1);
        expect(calculateDamage({ attacker: { ...PLAYER, armorPierce: 150 }, defender: enemy('FIRE', 50), random: never }).damage).toBe(1);
    });

    it('applies to the one defense whatever damageType an older attacker carries: pierce 50 on defense 40 deals 0.8', () => {
        const attacker = { ...PLAYER, damageType: 'MAGICAL', armorPierce: 50 };

        expect(calculateDamage({ attacker, defender: { element: 'FIRE', defense: 40, critResistance: 0 }, random: never }).damage).toBe(0.8);
    });

    it('changes nothing when the attacker has none', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 50), random: never }).damage).toBe(0.5);
    });
});

describe('boss damage', () => {
    const attacker = { ...PLAYER, bossDamage: 20 };

    it('adds the percent against a boss', () => {
        expect(calculateDamage({ attacker, defender: enemy('FIRE'), random: never, boss: true }).damage).toBe(1.2);
    });

    it('adds nothing against any other monster', () => {
        expect(calculateDamage({ attacker, defender: enemy('FIRE'), random: never }).damage).toBe(1);
        expect(calculateDamage({ attacker, defender: enemy('FIRE'), random: never, boss: false }).damage).toBe(1);
    });

    it('does nothing for an attacker without it, even against a boss', () => {
        expect(calculateDamage({ defender: enemy('FIRE'), random: never, boss: true }).damage).toBe(1);
    });

    it('multiplies with the critical hit', () => {
        expect(calculateDamage({ attacker, defender: enemy('FIRE'), random: always, boss: true })).toEqual({ damage: 2.4, critical: true });
    });
});

describe('calculateDamage at a defense of 100 or more', () => {
    it('deals 0 at defense 100 and above, never a negative damage', () => {
        expect(calculateDamage({ defender: enemy('FIRE', 100), random: never }).damage).toBe(0);
        expect(calculateDamage({ defender: enemy('FIRE', 122), random: always }).damage).toBe(0);
        expect(calculateDamage({ defender: enemy('FIRE', 2000), random: never, boss: true }).damage).toBe(0);
    });

    it('deals damage again once armor pierce brings the defense under 100', () => {
        const attacker = { ...PLAYER, armorPierce: 50 };

        expect(calculateDamage({ attacker, defender: enemy('FIRE', 120), random: never }).damage).toBeCloseTo(0.4, 10);
    });
});

describe('calculateDamage with a forced critical', () => {
    it('is critical against a defender with critical resistance 100, which never crits otherwise', () => {
        const defender = enemy('FIRE', 0, 100);

        expect(calculateDamage({ defender, random: always }).critical).toBe(false);
        expect(calculateDamage({ defender, random: never, forceCritical: true })).toEqual({ damage: 2, critical: true });
    });

    it('leaves the roll in charge when it is not forced', () => {
        expect(calculateDamage({ defender: enemy('FIRE'), random: never, forceCritical: false })).toEqual({ damage: 1, critical: false });
    });
});

describe('calculateDamage with the darkness bonus of the staff', () => {
    const staffer = { element: 'FIRE', baseDamage: 10, critChance: 0, critMultiplier: 2, darknessDamagePct: 200 };
    const target = (element, defense = 0) => ({ element, defense, critResistance: 0 });

    it('a darkness bonus of 200 deals 3 times against DARKNESS: 27', () => {
        expect(calculateDamage({ attacker: staffer, defender: target('DARKNESS'), random: never }).damage).toBeCloseTo(27, 10);
    });

    it('the same attacker without the field deals 9 against DARKNESS', () => {
        expect(calculateDamage({ attacker: { ...staffer, darknessDamagePct: undefined }, defender: target('DARKNESS'), random: never }).damage).toBeCloseTo(9, 10);
    });

    it('the bonus does nothing against WATER: 5', () => {
        expect(calculateDamage({ attacker: staffer, defender: target('WATER'), random: never }).damage).toBeCloseTo(5, 10);
    });

    it('the bonus does nothing against LIGHT: 9', () => {
        expect(calculateDamage({ attacker: staffer, defender: target('LIGHT'), random: never }).damage).toBeCloseTo(9, 10);
    });

    it('the bonus multiplies with defense, a critical and boss damage: 40.5', () => {
        const attacker = { ...staffer, bossDamage: 50 };

        expect(calculateDamage({ attacker, defender: target('DARKNESS', 50), random: never, forceCritical: true, boss: true }).damage).toBeCloseTo(40.5, 10);
    });

    it('a defense of 100 still deals 0 with the bonus', () => {
        expect(calculateDamage({ attacker: staffer, defender: target('DARKNESS', 100), random: never }).damage).toBe(0);
    });
});
