import { describe, expect, it } from 'vitest';
import { PLAYER } from '../combat/damage';
import { clickDamage, hitDamage, tickDamage } from './skillDamage';

const enemy = (element = 'FIRE', physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });
const never = () => 0.99;
const always = () => 0;
const none = { buffs: [], debuffs: [] };

describe('hitDamage', () => {
    it('deals 9.75 with Corte Dimensional (1500 %, pierce 30) on base 1 against physical defense 50', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 1500, damageType: 'PHYSICAL', armorPierce: 30, defender: enemy('FIRE', 50), random: never, ...none }))
            .toEqual({ damage: 9.75, critical: false });
    });

    it('adds the skill pierce to the pierce of the attacker, at most 100', () => {
        const attacker = { ...PLAYER, armorPierce: 80 };

        expect(hitDamage({ attacker, percent: 100, damageType: 'PHYSICAL', armorPierce: 30, defender: enemy('FIRE', 50), random: never, ...none }).damage).toBe(1);
    });

    it('uses the magical defense for magical hits', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 2500, damageType: 'MAGICAL', defender: enemy('FIRE', 90, 20), random: never, ...none }).damage).toBe(20);
    });

    it('deals 1.5 times more with vsDarkness against a darkness monster, and the same against another element', () => {
        const base = { attacker: PLAYER, percent: 800, damageType: 'MAGICAL', vsDarkness: 1.5, random: never, ...none };

        expect(hitDamage({ ...base, defender: enemy('FIRE') }).damage).toBe(8);
        expect(hitDamage({ ...base, defender: enemy('DARKNESS') }).damage).toBeCloseTo(8 * 0.9 * 1.5, 10);
    });

    it('rolls the critical per hit and doubles a critical', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 300, damageType: 'PHYSICAL', defender: enemy(), random: always, ...none })).toEqual({ damage: 6, critical: true });
    });

    it('forces a critical of 3000 % against critical resistance 100', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 3000, damageType: 'PHYSICAL', forceCritical: true, defender: enemy('FIRE', 0, 0, 100), random: never, ...none }))
            .toEqual({ damage: 60, critical: true });
    });

    it('applies the boss damage of the attacker on a boss', () => {
        const attacker = { ...PLAYER, bossDamage: 50 };

        expect(hitDamage({ attacker, percent: 400, damageType: 'PHYSICAL', defender: enemy(), random: never, boss: true, ...none }).damage).toBe(6);
    });
});

describe('buffs', () => {
    it('adds Ventos Ligeiros 50 % to a click', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos' ], debuffs: [] }).damage).toBe(1.5);
    });

    it('adds the click bonuses of Ventos and Bênção and multiplies the physical bonus: 1 x 1.75 x 1.3 = 2.275', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos', 'bencao' ], debuffs: [] }).damage).toBeCloseTo(2.275, 10);
    });

    it('multiplies physical hits by 1.3 under Bênção but not magical ones, and gives them no click bonus', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [] };

        expect(hitDamage({ ...base, damageType: 'PHYSICAL' }).damage).toBeCloseTo(1.3, 10);
        expect(hitDamage({ ...base, damageType: 'MAGICAL' }).damage).toBe(1);
    });

    it('adds 15 critical points under Fumaça: a roll of 20 crits at 25 % and not at 10 %', () => {
        const roll = () => 0.2;

        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: roll, ...none }).critical).toBe(false);
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: roll, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(true);
    });

    it('caps the critical chance at 100 under Fumaça', () => {
        const attacker = { ...PLAYER, critChance: 95 };

        expect(clickDamage({ attacker, defender: enemy(), random: () => 0.999, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(true);
    });

    it('caps 95 + 15 at 100 before the critical resistance: against resistance 50 a roll of 52 does not crit', () => {
        const attacker = { ...PLAYER, critChance: 95 };

        expect(clickDamage({ attacker, defender: enemy('FIRE', 0, 0, 50), random: () => 0.52, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(false);
        expect(clickDamage({ attacker, defender: enemy('FIRE', 0, 0, 50), random: () => 0.49, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(true);
    });
});

describe('click multiplier and forced critical', () => {
    it('multiplies the final click damage by the combo: x1.1 makes 1.1', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, ...none, multiplier: 1.1 }).damage).toBeCloseTo(1.1, 10);
    });

    it('multiplies a critical click too: x1.5 on a critical click of 2 makes 3', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: always, ...none, multiplier: 1.5 })).toEqual({ damage: 3, critical: true });
    });

    it('multiplies after the click buffs: Ventos (x1.5) and a combo of x1.1 make 1.65', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos' ], debuffs: [], multiplier: 1.1 }).damage).toBeCloseTo(1.65, 10);
    });

    it('makes the click critical whatever the roll and the critical resistance', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy('FIRE', 0, 0, 100), random: never, ...none, forceCritical: true })).toEqual({ damage: 2, critical: true });
    });

    it('does not roll the dice for a forced critical', () => {
        let rolls = 0;

        clickDamage({ attacker: PLAYER, defender: enemy(), random: () => { rolls += 1; return 0.99; }, ...none, forceCritical: true });

        expect(rolls).toBe(0);
    });

    it('leaves a plain click alone: multiplier 1 and no forced critical', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, ...none })).toEqual({ damage: 1, critical: false });
    });
});

describe('debuffs', () => {
    it('lowers the physical defense by 30 points under Brado, never below 0', () => {
        const brado = { buffs: [], debuffs: [ 'brado' ] };

        expect(clickDamage({ attacker: PLAYER, defender: enemy('FIRE', 50), random: never, ...brado }).damage).toBe(0.8);
        expect(clickDamage({ attacker: PLAYER, defender: enemy('FIRE', 10), random: never, ...brado }).damage).toBe(1);
    });

    it('leaves the magical defense alone under Brado', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 100, damageType: 'MAGICAL', defender: enemy('FIRE', 0, 50), random: never, buffs: [], debuffs: [ 'brado' ] }).damage).toBe(0.5);
    });

    it('multiplies magical damage by 1.25 under Prisão and leaves physical alone', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ] };

        expect(hitDamage({ ...base, damageType: 'MAGICAL' }).damage).toBe(1.25);
        expect(hitDamage({ ...base, damageType: 'PHYSICAL' }).damage).toBe(1);
    });
});

describe('effect factors', () => {
    it('an empty factors map deals what the effects deal today', () => {
        const base = { attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos' ], debuffs: [] };

        expect(clickDamage(base).damage).toBe(1.5);
        expect(clickDamage({ ...base, factors: {} }).damage).toBe(1.5);
    });

    it('Ventos at factor 1.25 adds 62.5 % to a click', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos' ], debuffs: [], factors: { ventos: 1.25 } }).damage)
            .toBeCloseTo(1.625, 9);
    });

    it('Ventos at 1.25 and Bênção at 1.5 add 62.5 and 37.5 and multiply physical by 1.45: 2.9', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos', 'bencao' ], debuffs: [], factors: { ventos: 1.25, bencao: 1.5 } }).damage)
            .toBeCloseTo(2.9, 9);
    });

    it('Bênção at factor 1.5 multiplies a physical hit by 1.45 and leaves a magical hit alone', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [], factors: { bencao: 1.5 } };

        expect(hitDamage({ ...base, damageType: 'PHYSICAL' }).damage).toBeCloseTo(1.45, 9);
        expect(hitDamage({ ...base, damageType: 'MAGICAL' }).damage).toBe(1);
    });

    it('Fumaça at factor 1.5 adds 22.5 critical points: a roll of 0.32 crits and 0.33 does not', () => {
        const base = { attacker: PLAYER, percent: 100, damageType: 'PHYSICAL', defender: enemy(), buffs: [ 'fumaca' ], debuffs: [], factors: { fumaca: 1.5 } };

        expect(hitDamage({ ...base, random: () => 0.32 })).toEqual({ damage: 2, critical: true });
        expect(hitDamage({ ...base, random: () => 0.33 })).toEqual({ damage: 1, critical: false });
        expect(hitDamage({ ...base, factors: { fumaca: 1 }, random: () => 0.32 }).critical).toBe(false);
    });

    it('Brado at factor 1.5 removes 45 physical defense, never below 0', () => {
        const brado = { attacker: PLAYER, percent: 100, damageType: 'PHYSICAL', buffs: [], debuffs: [ 'brado' ], random: never, factors: { brado: 1.5 } };

        expect(hitDamage({ ...brado, defender: enemy('FIRE', 50) }).damage).toBeCloseTo(0.95, 9);
        expect(hitDamage({ ...brado, defender: enemy('FIRE', 40) }).damage).toBe(1);
    });

    it('Prisão at factor 1.25 multiplies magical damage by 1.3125', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ], factors: { prisao: 1.25 } };

        expect(hitDamage({ ...base, damageType: 'MAGICAL' }).damage).toBeCloseTo(1.3125, 9);
        expect(hitDamage({ ...base, damageType: 'PHYSICAL' }).damage).toBe(1);
    });

    it('a tick reads the factor of Bênção at the tick: 100 % physical at factor 1.5 is 1.45', () => {
        expect(tickDamage({ attacker: PLAYER, percent: 100, damageType: 'PHYSICAL', buffs: [ 'bencao' ], debuffs: [], defender: enemy(), factors: { bencao: 1.5 } }))
            .toBeCloseTo(1.45, 9);
    });
});

describe('tickDamage', () => {
    it('is percent of the base damage and never critical, whatever the attacker chance', () => {
        const attacker = { ...PLAYER, critChance: 100 };

        expect(tickDamage({ attacker, percent: 200, damageType: 'MAGICAL', defender: enemy(), ...none })).toBe(2);
    });

    it('follows the defense, Bênção and Prisão at the tick', () => {
        expect(tickDamage({ attacker: PLAYER, percent: 100, damageType: 'PHYSICAL', defender: enemy('FIRE', 50), buffs: [ 'bencao' ], debuffs: [ 'brado' ] })).toBeCloseTo(0.8 * 1.3, 10);
        expect(tickDamage({ attacker: PLAYER, percent: 100, damageType: 'MAGICAL', defender: enemy(), buffs: [], debuffs: [ 'prisao' ] })).toBe(1.25);
    });
});
