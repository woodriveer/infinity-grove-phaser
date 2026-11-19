import { describe, expect, it } from 'vitest';
import { calculateDamage, PLAYER } from './damage';
import { addName, Fight, guardedDefense, MAIN_NAME } from './fight';
import { DEFAULT_STATS, Monster } from './monster';
import { monsterAfterBreak } from '../talents/talents';

const MAIN_STATS = { element: 'FIRE', defense: 49, critResistance: 20 };
const add = (health = 30, defenseBuff = 30) => ({ health, defenseBuff, stats: DEFAULT_STATS });
const kill = (monster) => monster.hit(monster.health);
const mainMonster = (stats = MAIN_STATS, health = 3276800) => new Monster(health, 5, stats);
const twoAdds = (main = mainMonster(), buff = 30, health = 1966080) => new Fight(main, [ add(health, buff), add(health, buff) ]);

describe('Fight', () => {
    it('a fight without adds has no adds and targets its main monster', () => {
        const main = mainMonster();
        const fight = new Fight(main);

        expect(fight.hasAdds).toBe(false);
        expect(fight.adds).toEqual([]);
        expect(fight.target).toBe(main);
    });

    it('the adds become monsters named Lacaio 1 and Lacaio 2 with their health, buff and stats and no drop rule', () => {
        const fight = new Fight(mainMonster(), [ add(1966080, 30), add(1966080, 30) ]);

        expect(fight.hasAdds).toBe(true);
        expect(fight.adds[0]).toMatchObject({ slot: 1, name: 'Lacaio 1', defenseBuff: 30 });
        expect(fight.adds[0].monster.maxHealth).toBe(1966080);
        expect(fight.adds[0].monster.dropRuleId).toBeNull();
        expect(fight.adds[0].monster.stats).toBe(DEFAULT_STATS);
        expect(fight.adds[1].slot).toBe(2);
        expect(fight.adds[1].name).toBe('Lacaio 2');
    });

    it('the miniboss is the target when the fight starts', () => {
        const fight = twoAdds();

        expect(fight.target).toBe(fight.main);
    });

    it('choosing a living add makes it the target', () => {
        const fight = twoAdds();

        expect(fight.choose(fight.adds[0].monster)).toBe(true);
        expect(fight.target).toBe(fight.adds[0].monster);
    });

    it('choosing the main makes it the target again', () => {
        const fight = twoAdds();

        fight.choose(fight.adds[1].monster);

        expect(fight.choose(fight.main)).toBe(true);
        expect(fight.target).toBe(fight.main);
    });

    it('choosing the target again keeps it', () => {
        const fight = twoAdds();

        expect(fight.choose(fight.adds[0].monster)).toBe(true);
        expect(fight.choose(fight.adds[0].monster)).toBe(true);
        expect(fight.target).toBe(fight.adds[0].monster);
    });

    it('choosing a dead add, a monster of another fight or null changes nothing and answers false', () => {
        const fight = twoAdds();

        fight.choose(fight.adds[1].monster);
        kill(fight.adds[0].monster);

        expect(fight.choose(fight.adds[0].monster)).toBe(false);
        expect(fight.choose(new Monster(10))).toBe(false);
        expect(fight.choose(null)).toBe(false);
        expect(fight.target).toBe(fight.adds[1].monster);
    });

    it('a dead target add hands the target back to the main', () => {
        const fight = twoAdds();

        fight.choose(fight.adds[0].monster);
        kill(fight.adds[0].monster);

        expect(fight.target).toBe(fight.main);
    });

    it('the target stays the main monster when it is dead', () => {
        const fight = twoAdds();

        kill(fight.main);

        expect(fight.target).toBe(fight.main);
    });

    it('defenseBonus sums the buffs of the living adds', () => {
        const fight = twoAdds();

        expect(fight.defenseBonus()).toBe(60);

        kill(fight.adds[0].monster);
        expect(fight.defenseBonus()).toBe(30);

        kill(fight.adds[1].monster);
        expect(fight.defenseBonus()).toBe(0);
    });

    it('an add of buff 1 raises the guarded defense by 1 and one of buff 0 by nothing', () => {
        const small = new Fight(mainMonster(), [ add(30, 1), add(30, 0) ]);

        expect(small.defenseBonus()).toBe(1);
        expect(small.statsOf(small.main).defense).toBe(50);
        const none = new Fight(mainMonster(), [ add(30, 0), add(30, 0) ]);

        expect(none.statsOf(none.main)).toBe(none.main.stats);
    });

    it('E1: the chapter 11 stage 1 miniboss defends 90, 79 and 49 with 2, 1 and 0 adds alive', () => {
        const fight = twoAdds();

        expect(fight.statsOf(fight.main)).toEqual({ element: 'FIRE', defense: 90, critResistance: 20 });

        kill(fight.adds[0].monster);
        expect(fight.statsOf(fight.main)).toEqual({ element: 'FIRE', defense: 79, critResistance: 20 });

        kill(fight.adds[1].monster);
        expect(fight.statsOf(fight.main)).toEqual({ element: 'FIRE', defense: 49, critResistance: 20 });
    });

    it('E2: the chapter 15 stage 1 miniboss defends 90 with one add of 50 alive and 61 with none', () => {
        const main = mainMonster({ element: 'FIRE', defense: 61, critResistance: 0 });
        const fight = twoAdds(main, 50);

        expect(fight.statsOf(main).defense).toBe(90);

        kill(fight.adds[0].monster);
        expect(fight.statsOf(main).defense).toBe(90);

        kill(fight.adds[1].monster);
        expect(fight.statsOf(main).defense).toBe(61);
    });

    it('E3: two adds of 35 on defense 52 give 90, not 122', () => {
        const main = mainMonster({ element: 'FIRE', defense: 52, critResistance: 0 });
        const fight = twoAdds(main, 35);

        expect(fight.statsOf(main).defense).toBe(90);
    });

    it("statsOf of the main without a living add is its own stats object", () => {
        const noAdds = new Fight(mainMonster());
        const fight = twoAdds();

        expect(noAdds.statsOf(noAdds.main)).toBe(noAdds.main.stats);

        kill(fight.adds[0].monster);
        kill(fight.adds[1].monster);

        expect(fight.statsOf(fight.main)).toBe(fight.main.stats);
    });

    it('statsOf reads a legacy physicalDefense payload', () => {
        const main = mainMonster({ element: 'FIRE', physicalDefense: 49, magicalDefense: 49, critResistance: 0 });
        const fight = new Fight(main, [ add(30, 30) ]);

        expect(fight.statsOf(main).defense).toBe(79);
    });

    it("statsOf of an add is the add's own stats", () => {
        const fight = twoAdds();

        expect(fight.statsOf(fight.adds[0].monster)).toBe(fight.adds[0].monster.stats);
    });

    it('guardedDefense caps at 90 and keeps a defense without bonus', () => {
        expect(guardedDefense(49, 60)).toBe(90);
        expect(guardedDefense(49, 30)).toBe(79);
        expect(guardedDefense(49, 0)).toBe(49);
        expect(guardedDefense(90, 0)).toBe(90);
    });

    it('livingAddMonsters lists the living add monsters in slot order', () => {
        const fight = twoAdds();
        const [ first, second ] = fight.adds.map((entry) => entry.monster);

        expect(fight.livingAddMonsters()).toEqual([ first, second ]);
        expect(fight.livingAddMonsters()[0]).toBe(first);

        kill(first);

        expect(fight.livingAddMonsters()).toHaveLength(1);
        expect(fight.livingAddMonsters()[0]).toBe(second);
    });

    it('nameOf names the main Miniboss and each add Lacaio n, and anything else null', () => {
        const fight = twoAdds();

        expect(MAIN_NAME).toBe('Miniboss');
        expect(addName(2)).toBe('Lacaio 2');
        expect(fight.nameOf(fight.main)).toBe('Miniboss');
        expect(fight.nameOf(fight.adds[0].monster)).toBe('Lacaio 1');
        expect(fight.nameOf(fight.adds[1].monster)).toBe('Lacaio 2');
        expect(fight.nameOf(new Monster(10))).toBeNull();
    });

    it('addOf finds the add entry of a monster and null for the main', () => {
        const fight = twoAdds();

        expect(fight.addOf(fight.adds[1].monster)).toBe(fight.adds[1]);
        expect(fight.addOf(fight.main)).toBeNull();
    });

    it('E4: a Base-1 hit on the guarded chapter 11 miniboss deals 0.1, 0.21 and 0.51', () => {
        const fight = twoAdds();
        const hit = () => calculateDamage({ attacker: PLAYER, defender: monsterAfterBreak(fight.statsOf(fight.main), null), random: () => 0.99 }).damage;

        expect(hit()).toBeCloseTo(0.1, 9);

        kill(fight.adds[0].monster);
        expect(hit()).toBeCloseTo(0.21, 9);

        kill(fight.adds[1].monster);
        expect(hit()).toBeCloseTo(0.51, 9);
    });

    it('E5: Quebra de defesa 5 lowers the capped 90 to 85', () => {
        const fight = twoAdds();
        const breaks = [ { id: 'PHYSICAL_BREAK', baseId: 'PHYSICAL_BREAK', value: 5 } ];
        const defender = monsterAfterBreak(fight.statsOf(fight.main), breaks);

        expect(defender.defense).toBe(85);
        expect(calculateDamage({ attacker: PLAYER, defender, random: () => 0.99 }).damage).toBeCloseTo(0.15, 9);
    });

    it('E6: Erosão Arcana lowers the capped 90 to 75', () => {
        const fight = twoAdds();

        expect(monsterAfterBreak(fight.statsOf(fight.main), null, { defenseBreak: 15 }).defense).toBe(75);
    });
});
