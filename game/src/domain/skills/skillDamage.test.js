import { describe, expect, it } from 'vitest';
import { PLAYER } from '../combat/damage';
import { clickDamage, hitDamage, tickDamage } from './skillDamage';

const enemy = (element = 'FIRE', defense = 0, critResistance = 0) => ({ element, defense, critResistance });
const never = () => 0.99;
const always = () => 0;
const none = { buffs: [], debuffs: [] };

describe('hitDamage', () => {
    it('deals 9.75 with Corte Dimensional (1500 %, pierce 30) on base 1 against defense 50', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 1500, armorPierce: 30, defender: enemy('FIRE', 50), random: never, ...none }))
            .toEqual({ damage: 9.75, critical: false });
    });

    it('adds the skill pierce to the pierce of the attacker, at most 100', () => {
        const attacker = { ...PLAYER, armorPierce: 80 };

        expect(hitDamage({ attacker, percent: 100, armorPierce: 30, defender: enemy('FIRE', 50), random: never, ...none }).damage).toBe(1);
    });

    it('meets the one defense with every hit: 2500 % against physicalDefense 90 deals 2.5', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 2500, defender: enemy('FIRE', 90), random: never, ...none }).damage).toBeCloseTo(2.5, 10);
    });

    it('deals 1.5 times more with vsDarkness against a darkness monster, and the same against another element', () => {
        const base = { attacker: PLAYER, percent: 800, vsDarkness: 1.5, random: never, ...none };

        expect(hitDamage({ ...base, defender: enemy('FIRE') }).damage).toBe(8);
        expect(hitDamage({ ...base, defender: enemy('DARKNESS') }).damage).toBeCloseTo(8 * 0.9 * 1.5, 10);
    });

    it('rolls the critical per hit and doubles a critical', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 300, defender: enemy(), random: always, ...none })).toEqual({ damage: 6, critical: true });
    });

    it('forces a critical of 3000 % against critical resistance 100', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 3000, forceCritical: true, defender: enemy('FIRE', 0, 100), random: never, ...none }))
            .toEqual({ damage: 60, critical: true });
    });

    it('a forced hit with a critical chance of 150 against resistance 20 deals 2.3 times its base', () => {
        const attacker = { ...PLAYER, critChance: 150 };
        const result = hitDamage({ attacker, percent: 100, forceCritical: true, defender: enemy('FIRE', 0, 20), random: never, ...none });

        expect(result.damage).toBeCloseTo(2.3, 10);
        expect(result.critical).toBe(true);
    });

    it('applies the boss damage of the attacker on a boss', () => {
        const attacker = { ...PLAYER, bossDamage: 50 };

        expect(hitDamage({ attacker, percent: 400, defender: enemy(), random: never, boss: true, ...none }).damage).toBe(6);
    });
});

describe('buffs', () => {
    it('adds Ventos Ligeiros 50 % to a click', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos' ], debuffs: [] }).damage).toBe(1.5);
    });

    it('adds the click bonuses of Ventos and Bênção and multiplies by the Bênção bonus: 1 x 1.75 x 1.3 = 2.275', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos', 'bencao' ], debuffs: [] }).damage).toBeCloseTo(2.275, 10);
    });

    it('makes a Base 1 click under Bênção level 1 alone 1.625: 1.25 x 1.3 (E10)', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [] }).damage).toBeCloseTo(1.625, 10);
    });

    it('multiplies every skill hit by 1.3 under Bênção and gives it no click bonus', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [] };

        expect(hitDamage(base).damage).toBeCloseTo(1.3, 10);
        expect(hitDamage({ ...base, percent: 800, vsDarkness: 1.5 }).damage).toBeCloseTo(10.4, 10);
    });

    it('multiplies a 200 % tick by 1.3 under Bênção: 2.6', () => {
        expect(tickDamage({ attacker: PLAYER, percent: 200, defender: enemy(), buffs: [ 'bencao' ], debuffs: [] })).toBeCloseTo(2.6, 10);
    });

    it('adds 15 critical points under Fumaça: a roll of 20 crits at 25 % and not at 10 %', () => {
        const roll = () => 0.2;

        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: roll, ...none }).critical).toBe(false);
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: roll, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(true);
    });

    it('Fumaça adds 15 points with no cap: 95 + 15 crits on a roll of 0.999 and adds 10 % critical damage (2.1)', () => {
        const attacker = { ...PLAYER, critChance: 95 };
        const result = clickDamage({ attacker, defender: enemy(), random: () => 0.999, buffs: [ 'fumaca' ], debuffs: [] });

        expect(result.critical).toBe(true);
        expect(result.damage).toBeCloseTo(2.1, 10);
    });

    it('adds Fumaça before the critical resistance: 95 + 15 against 50 crits on a roll of 0.59 and not on 0.60', () => {
        const attacker = { ...PLAYER, critChance: 95 };

        expect(clickDamage({ attacker, defender: enemy('FIRE', 0, 50), random: () => 0.60, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(false);
        expect(clickDamage({ attacker, defender: enemy('FIRE', 0, 50), random: () => 0.59, buffs: [ 'fumaca' ], debuffs: [] }).critical).toBe(true);
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
        expect(clickDamage({ attacker: PLAYER, defender: enemy('FIRE', 0, 100), random: never, ...none, forceCritical: true })).toEqual({ damage: 2, critical: true });
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
    it('lowers the defense by 30 points under Brado, never below 0', () => {
        const brado = { buffs: [], debuffs: [ 'brado' ] };

        expect(clickDamage({ attacker: PLAYER, defender: enemy('FIRE', 50), random: never, ...brado }).damage).toBe(0.8);
        expect(clickDamage({ attacker: PLAYER, defender: enemy('FIRE', 10), random: never, ...brado }).damage).toBe(1);
    });

    it('lowers the defense under Brado for a skill hit too: Chuva de Meteoros on defense 50 deals 20', () => {
        expect(hitDamage({ attacker: PLAYER, percent: 2500, defender: enemy('FIRE', 50), random: never, buffs: [], debuffs: [ 'brado' ] }).damage).toBe(20);
    });

    it('multiplies every strike by 1.25 under Prisão', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ] };

        expect(hitDamage(base).damage).toBe(1.25);
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ] }).damage).toBe(1.25);
        expect(tickDamage({ attacker: PLAYER, percent: 200, defender: enemy(), buffs: [], debuffs: [ 'prisao' ] })).toBe(2.5);
    });

    it('multiplies a Base 1.4 click by 1.25 under Prisão: 1.75', () => {
        expect(clickDamage({ attacker: { ...PLAYER, baseDamage: 1.4 }, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ] }).damage).toBeCloseTo(1.75, 10);
    });

    it('Prisão and Bênção together make a click 2.03125', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [ 'prisao' ] }).damage).toBeCloseTo(2.03125, 10);
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

    it('Ventos at 1.25 and Bênção at 1.5 add 62.5 and 37.5 and multiply by 1.45: 2.9', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'ventos', 'bencao' ], debuffs: [], factors: { ventos: 1.25, bencao: 1.5 } }).damage)
            .toBeCloseTo(2.9, 9);
    });

    it('Bênção at factor 1.5 multiplies every hit by 1.45', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [], factors: { bencao: 1.5 } };

        expect(hitDamage(base).damage).toBeCloseTo(1.45, 9);
        expect(hitDamage({ ...base, percent: 800, vsDarkness: 1.5, defender: enemy('DARKNESS') }).damage).toBeCloseTo(15.66, 9);
    });

    it('Bênção at factor 1.5 makes a click 1.99375', () => {
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [], factors: { bencao: 1.5 } }).damage).toBeCloseTo(1.99375, 9);
    });

    it('Fumaça at factor 1.5 adds 22.5 critical points: a roll of 0.32 crits and 0.33 does not', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), buffs: [ 'fumaca' ], debuffs: [], factors: { fumaca: 1.5 } };

        expect(hitDamage({ ...base, random: () => 0.32 })).toEqual({ damage: 2, critical: true });
        expect(hitDamage({ ...base, random: () => 0.33 })).toEqual({ damage: 1, critical: false });
        expect(hitDamage({ ...base, factors: { fumaca: 1 }, random: () => 0.32 }).critical).toBe(false);
    });

    it('Brado at factor 1.5 removes 45 defense, never below 0', () => {
        const brado = { attacker: PLAYER, percent: 100, buffs: [], debuffs: [ 'brado' ], random: never, factors: { brado: 1.5 } };

        expect(hitDamage({ ...brado, defender: enemy('FIRE', 50) }).damage).toBeCloseTo(0.95, 9);
        expect(hitDamage({ ...brado, defender: enemy('FIRE', 40) }).damage).toBe(1);
    });

    it('Prisão at factor 1.25 multiplies every strike by 1.3125', () => {
        const base = { attacker: PLAYER, percent: 100, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ], factors: { prisao: 1.25 } };

        expect(hitDamage(base).damage).toBeCloseTo(1.3125, 9);
        expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ], factors: { prisao: 1.25 } }).damage).toBeCloseTo(1.3125, 9);
    });

    it('a tick reads the factor of Bênção at the tick: 100 % at factor 1.5 is 1.45', () => {
        expect(tickDamage({ attacker: PLAYER, percent: 100, buffs: [ 'bencao' ], debuffs: [], defender: enemy(), factors: { bencao: 1.5 } }))
            .toBeCloseTo(1.45, 9);
    });
});

describe('tickDamage', () => {
    it('is percent of the base damage and never critical, whatever the attacker chance', () => {
        const attacker = { ...PLAYER, critChance: 100 };

        expect(tickDamage({ attacker, percent: 200, defender: enemy(), ...none })).toBe(2);
    });

    it('a tick never crits, even with a critical chance of 250', () => {
        const attacker = { ...PLAYER, critChance: 250 };

        expect(tickDamage({ attacker, percent: 100, buffs: [], debuffs: [], defender: enemy('FIRE', 0), boss: false })).toBe(1);
    });

    it('follows the defense, Bênção and Prisão at the tick', () => {
        expect(tickDamage({ attacker: PLAYER, percent: 100, defender: enemy('FIRE', 50), buffs: [ 'bencao' ], debuffs: [ 'brado' ] })).toBeCloseTo(0.8 * 1.3, 10);
        expect(tickDamage({ attacker: PLAYER, percent: 100, defender: enemy(), buffs: [], debuffs: [ 'prisao' ] })).toBe(1.25);
        expect(tickDamage({ attacker: PLAYER, percent: 100, defender: enemy(), buffs: [ 'bencao' ], debuffs: [ 'prisao' ] })).toBeCloseTo(1.625, 10);
    });
});

describe('the staff against DARKNESS', () => {
    const staffer = { element: 'FIRE', baseDamage: 10, critChance: 0, critMultiplier: 2, darknessDamagePct: 200 };
    const dark = { element: 'DARKNESS', defense: 0, critResistance: 0 };

    it('a click with the staff on DARKNESS deals 27', () => {
        expect(clickDamage({ attacker: staffer, buffs: [], debuffs: [], defender: dark, random: never, boss: false }).damage).toBeCloseTo(27, 10);
    });

    it('a 600 % skill hit with the staff on DARKNESS deals 162', () => {
        expect(hitDamage({ attacker: staffer, percent: 600, buffs: [], debuffs: [], defender: dark, random: never, boss: false }).damage).toBeCloseTo(162, 10);
    });

    it('a 150 % tick with the staff on DARKNESS deals 40.5', () => {
        expect(tickDamage({ attacker: staffer, percent: 150, buffs: [], debuffs: [], defender: dark, boss: false })).toBeCloseTo(40.5, 10);
    });

    it('Luz Divina with the staff deals 4.5 times on DARKNESS: 324', () => {
        const light = { ...staffer, element: 'LIGHT' };

        expect(hitDamage({ attacker: light, percent: 800, vsDarkness: 1.5, buffs: [], debuffs: [], defender: dark, random: never, boss: false }).damage)
            .toBeCloseTo(324, 10);
    });

    it('a forced critical aimed shot with the staff is 3 times the same shot without it', () => {
        const shot = (attacker) => hitDamage({ attacker, percent: 3000, forceCritical: true, buffs: [], debuffs: [], defender: dark, random: never, boss: false }).damage;

        expect(shot(staffer)).toBeCloseTo(1620, 10);
        expect(shot({ ...staffer, darknessDamagePct: undefined })).toBeCloseTo(540, 10);
    });
});
