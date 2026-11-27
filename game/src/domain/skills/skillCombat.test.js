import { describe, expect, it } from 'vitest';
import { allyAttacker } from '../combat/allyAttacker';
import { leaderAttacker } from '../combat/leaderAttacker';
import { Fight } from '../combat/fight';
import { DEFAULT_STATS, Monster } from '../combat/monster';
import { AffixState, affixDefense } from '../combat/monsterAffix';
import { PLAYER } from '../combat/damage';
import { monsterAfterBreak } from '../talents/talents';
import { SkillCombat } from './skillCombat';

const stats = (element = 'FIRE', physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });
const never = () => 0.99;
const monsterOf = (health = 1000, defender = stats()) => new Monster(health, null, defender);
const combat = (random = never) => new SkillCombat({ random });
const use = (skills, monster, heroId, slot, extra = {}) => skills.use({ heroId, slot, unlocked: true, attacker: PLAYER, monster, boss: false, ...extra });

describe('using a skill', () => {
    it('lands Corte Dimensional as 15 damage on base 1 and starts a 20 s cooldown', () => {
        const skills = combat();
        const monster = monsterOf();

        const result = use(skills, monster, 'kael', 1);

        expect(result.used).toBe(true);
        expect(result.hits).toEqual([ { damage: 15, critical: false } ]);
        expect(monster.health).toBe(985);
        expect(skills.slotState('kael', 1, true)).toEqual({ state: 'cooling', seconds: 20 });
    });

    it('lands Flecha Dupla as two hits of 3 with a critical roll each', () => {
        const rolls = [ 0, 0.99 ];
        const skills = combat(() => rolls.shift());
        const monster = monsterOf();

        const result = use(skills, monster, 'lyra', 1);

        expect(result.hits).toEqual([ { damage: 6, critical: true }, { damage: 3, critical: false } ]);
        expect(monster.health).toBe(991);
    });

    it('does not land the second arrow of Flecha Dupla when the first kills the monster', () => {
        const skills = combat();
        const monster = monsterOf(3);

        const result = use(skills, monster, 'lyra', 1);

        expect(result.hits).toHaveLength(1);
        expect(monster.dead).toBe(true);
    });

    it('lands Chuva de Meteoros as one hit of 25 (20 on defense 20) and Golpe Sangrento as 6', () => {
        const meteors = monsterOf(1000, stats('FIRE', 20));

        expect(use(combat(), meteors, 'orina', 3).hits).toEqual([ { damage: 20, critical: false } ]);
        expect(use(combat(), monsterOf(), 'vex', 3).hits).toEqual([ { damage: 6, critical: false } ]);
    });

    it('meets the one defense of an older payload with every Orina hit: physicalDefense 50 and magicalDefense 10 make Chuva de Meteoros 12.5 (E2)', () => {
        const monster = monsterOf(1000, stats('FIRE', 50, 10));

        expect(use(combat(), monster, 'orina', 3).hits).toEqual([ { damage: 12.5, critical: false } ]);
    });

    it('lands Luz Divina of a Seraphine 3 star (base 1.4) as 14.56 under her Bênção level 1: 8 x 1.4 x 1.3 (E9)', () => {
        const skills = combat();
        const monster = monsterOf();
        const attacker = { ...PLAYER, baseDamage: 1.4 };

        use(skills, monster, 'seraphine', 1, { attacker });

        expect(use(skills, monster, 'seraphine', 2, { attacker }).hits[0].damage).toBeCloseTo(14.56, 9);
    });

    it('lands Investida do Baluarte as 4 and Luz Divina as 8, 1.5 times more on a darkness monster', () => {
        expect(use(combat(), monsterOf(), 'kael', 2).hits[0].damage).toBe(4);
        expect(use(combat(), monsterOf(), 'seraphine', 2).hits[0].damage).toBe(8);
        expect(use(combat(), monsterOf(1000, stats('DARKNESS')), 'seraphine', 2).hits[0].damage).toBeCloseTo(8 * 0.9 * 1.5, 10);
    });

    it('refuses a locked skill and leaves the monster and the cooldown alone', () => {
        const skills = combat();
        const monster = monsterOf();

        const result = use(skills, monster, 'kael', 1, { unlocked: false });

        expect(result.used).toBe(false);
        expect(monster.health).toBe(1000);
        expect(skills.slotState('kael', 1, true).state).toBe('ready');
    });

    it('refuses a skill that is cooling', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'kael', 1);

        expect(use(skills, monster, 'kael', 1).used).toBe(false);
        expect(monster.health).toBe(985);
    });

    it('refuses a skill without a monster or against a dead one, keeping the cooldown unstarted', () => {
        const skills = combat();
        const dead = monsterOf(1);

        dead.hit(1);

        expect(use(skills, null, 'kael', 1).used).toBe(false);
        expect(use(skills, dead, 'kael', 1).used).toBe(false);
        expect(skills.slotState('kael', 1, true).state).toBe('ready');
    });

    it('refuses an unknown hero', () => {
        expect(use(combat(), monsterOf(), 'nobody', 1).used).toBe(false);
    });
});

describe('cooldowns', () => {
    it('show whole seconds rounded up, run down with the clock and end ready', () => {
        const skills = combat();

        use(skills, monsterOf(), 'kael', 1);
        skills.advance(1);
        expect(skills.slotState('kael', 1, true)).toEqual({ state: 'cooling', seconds: 20 });

        skills.advance(1000);
        expect(skills.slotState('kael', 1, true)).toEqual({ state: 'cooling', seconds: 19 });

        skills.advance(19000);
        expect(skills.slotState('kael', 1, true)).toEqual({ state: 'ready', seconds: 0 });
    });

    it('belong to the hero and slot: another hero or slot is ready, and the cooldown is kept when the hero is the leader again', () => {
        const skills = combat();

        use(skills, monsterOf(), 'kael', 1);

        expect(skills.slotState('kael', 2, true).state).toBe('ready');
        expect(skills.slotState('lyra', 1, true).state).toBe('ready');
        expect(skills.slotState('kael', 1, true).state).toBe('cooling');
    });

    it('show a slot the hero has not unlocked as locked', () => {
        expect(combat().slotState('kael', 3, false)).toEqual({ state: 'locked', seconds: 0 });
    });

    it('keep running between monsters', () => {
        const skills = combat();

        use(skills, monsterOf(), 'kael', 1);
        skills.advance(5000);

        expect(skills.slotState('kael', 1, true).seconds).toBe(15);
    });
});

describe('click', () => {
    it('damages the monster by the click formula', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(skills.click({ attacker: PLAYER, monster, boss: false })).toEqual({ damage: 1, critical: false });
        expect(monster.health).toBe(999);
    });
});

describe('break talents', () => {
    const breaks = (levels) => Object.entries(levels).map(([ id, value ]) => ({ id, value }));
    const withBreak = (levels, random = never) => new SkillCombat({ random, statsOf: (monster) => monsterAfterBreak(monster.stats, breaks(levels)) });
    const base100 = { ...PLAYER, baseDamage: 100 };

    it('lets a Base 100 click against defense 20 deal 85 under PHYSICAL_BREAK 5 and 80 without it', () => {
        const broken = monsterOf(1000, stats('FIRE', 20));
        const plain = monsterOf(1000, stats('FIRE', 20));

        expect(withBreak({ PHYSICAL_BREAK: 5 }).click({ attacker: base100, monster: broken, boss: false }).damage).toBe(85);
        expect(combat().click({ attacker: base100, monster: plain, boss: false }).damage).toBe(80);
    });

    it('leaves the stats of the monster itself alone', () => {
        const monster = monsterOf(1000, stats('FIRE', 20));

        withBreak({ PHYSICAL_BREAK: 5 }).click({ attacker: base100, monster, boss: false });

        expect(monster.stats.physicalDefense).toBe(20);
    });

    it('lowers the one defense of every hit with PHYSICAL_BREAK: Chuva de Meteoros 2250 and Investida 360 against defense 20 with PHYSICAL_BREAK 10', () => {
        const magic = monsterOf(100000, stats('FIRE', 20, 20));
        const physical = monsterOf(100000, stats('FIRE', 20, 20));

        withBreak({ PHYSICAL_BREAK: 10 }).use({ heroId: 'orina', slot: 3, unlocked: true, attacker: base100, monster: magic, boss: false });
        withBreak({ PHYSICAL_BREAK: 10 }).use({ heroId: 'kael', slot: 2, unlocked: true, attacker: base100, monster: physical, boss: false });

        //  Chuva de Meteoros: 2500 % of 100 against defense 20 - 10 = 10 %; Investida: 400 % against the same 10 %
        expect(100000 - magic.health).toBeCloseTo(2250, 6);
        expect(100000 - physical.health).toBeCloseTo(360, 6);
    });

    it('applies the break to a damage tick: Tempestade Arcana on defense 20 with PHYSICAL_BREAK 5 ticks 200 x 0.85', () => {
        const skills = withBreak({ PHYSICAL_BREAK: 5 });
        const monster = monsterOf(100000, stats('FIRE', 20));

        skills.use({ heroId: 'orina', slot: 2, unlocked: true, attacker: base100, monster, boss: false });
        const { hits } = skills.advance(1000, { monster });

        expect(hits[0].damage).toBeCloseTo(100 * 2 * 0.85, 6);
    });

    it('applies the break to the aimed shot when the cast lands: 3000 % critical of Base 100 against defense 20 - 5 deals 5100', () => {
        const skills = withBreak({ PHYSICAL_BREAK: 5 });
        const monster = monsterOf(1000000, stats('FIRE', 20));

        use(skills, monster, 'lyra', 2, { attacker: base100 });
        const { hits } = skills.advance(2000, { monster });

        expect(hits[0].damage).toBeCloseTo(5100, 6);
    });

    it('never takes the defense below 0 together with Brado Aterrador: defense 10, break 4 and Brado deal full damage', () => {
        const skills = withBreak({ PHYSICAL_BREAK: 4 });
        const monster = monsterOf(100000, stats('FIRE', 10));

        use(skills, monster, 'kael', 3, { attacker: base100 });

        expect(skills.click({ attacker: base100, monster, boss: false }).damage).toBe(100);
    });

    it('ignores CRIT_RESIST_BREAK of an older list: resistance 5 and CRIT_RESIST_BREAK 20 leave a roll of 9 plain at 10 %', () => {
        const monster = monsterOf(1000, stats('FIRE', 0, 0, 5));
        const roll = () => 0.09;

        expect(withBreak({ CRIT_RESIST_BREAK: 20 }, roll).click({ attacker: PLAYER, monster, boss: false })).toEqual({ damage: 1, critical: false });
        expect(new SkillCombat({ random: roll }).click({ attacker: PLAYER, monster: monsterOf(1000, stats('FIRE', 0, 0, 0)), boss: false }).critical).toBe(true);
    });
});

describe('click with a multiplier and a forced critical', () => {
    it('lands the combo multiplier on the monster', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(skills.click({ attacker: PLAYER, monster, boss: false, multiplier: 1.5 }).damage).toBe(1.5);
        expect(monster.health).toBe(998.5);
    });

    it('lands a forced critical click of 2', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(skills.click({ attacker: PLAYER, monster, boss: false, forceCritical: true })).toEqual({ damage: 2, critical: true });
        expect(monster.health).toBe(998);
    });
});

describe('effect owners', () => {
    it('names the hero and the slot of the skill that started each effect, in start order', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3);
        use(skills, monster, 'vex', 1);

        expect(skills.effectsWithOwner()).toEqual([
            { label: 'Ventos Ligeiros', seconds: 12, heroId: 'lyra', slot: 3 },
            { label: 'Bomba de Veneno x1', seconds: 8, heroId: 'vex', slot: 1 }
        ]);
    });
});

describe('timed effects', () => {
    it('adds Ventos Ligeiros 50 % to clicks for 12 s, then ends', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3);
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1.5);

        skills.advance(11999, { monster });
        expect(skills.effects()).toEqual([ { label: 'Ventos Ligeiros', seconds: 1 } ]);

        skills.advance(1, { monster });
        expect(skills.effects()).toEqual([]);
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1);
    });

    it('runs Bênção da Grande Árvore for 15 s and Bomba de Fumaça for 10 s', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1);
        use(skills, monster, 'vex', 2);
        skills.advance(10000, { monster });

        expect(skills.effects()).toEqual([ { label: 'Bênção da Grande Árvore', seconds: 5 } ]);
    });

    it('adds the click bonuses of Ventos and Bênção: a click deals 2.275', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3);
        use(skills, monster, 'seraphine', 1);

        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBeCloseTo(2.275, 10);
    });

    it('lowers the defense by 30 points for 10 s with Brado Aterrador', () => {
        const skills = combat();
        const monster = monsterOf(1000, stats('FIRE', 50));

        use(skills, monster, 'kael', 3);
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(0.8);

        skills.advance(10000, { monster });
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(0.5);
    });

    it('adds 25 % damage for 2 s with Prisão de Espinhos', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 1);
        expect(use(skills, monster, 'orina', 3).hits[0].damage).toBe(31.25);

        skills.advance(2000, { monster });
        expect(skills.effects()).toEqual([]);
    });

    it('restarts a running effect without stacking it', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3);
        skills.advance(5000, { monster });
        skills.cooldowns.clear();
        use(skills, monster, 'lyra', 3);

        expect(skills.effects()).toEqual([ { label: 'Ventos Ligeiros', seconds: 12 } ]);
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1.5);
    });

    it('keeps the buffs on the player when the monster dies, but ends the effects on the monster', () => {
        const skills = combat();
        const monster = monsterOf(2);

        use(skills, monster, 'lyra', 3);
        use(skills, monster, 'kael', 3);
        monster.hit(2);

        expect(skills.effects()).toEqual([ { label: 'Ventos Ligeiros', seconds: 12 } ]);
    });

    it('ends the effects on the monster when another monster is on screen, and keeps the buffs', () => {
        const skills = combat();
        const first = monsterOf(1000, stats('FIRE', 50));
        const second = monsterOf(1000, stats('FIRE', 50));

        use(skills, first, 'kael', 3);
        use(skills, first, 'lyra', 3);
        skills.advance(1000, { monster: second });

        expect(skills.effects()).toEqual([ { label: 'Ventos Ligeiros', seconds: 11 } ]);
        expect(skills.click({ attacker: PLAYER, monster: second, boss: false }).damage).toBe(0.75);
    });

    it('ends the effects on the monster when no monster is on screen', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'kael', 3);
        skills.advance(1000, { monster: null });

        expect(skills.effects()).toEqual([]);
    });

    it('lists the tags in the order the effects started, with seconds rounded up', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1);
        use(skills, monster, 'kael', 3);
        use(skills, monster, 'lyra', 3);
        skills.advance(500, { monster });

        expect(skills.effects()).toEqual([
            { label: 'Bênção da Grande Árvore', seconds: 15 },
            { label: 'Brado Aterrador', seconds: 10 },
            { label: 'Ventos Ligeiros', seconds: 12 }
        ]);
    });

    it('keeps the buffs and the cooldowns when the leader changes (the heroes share one combat)', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3);

        expect(use(skills, monster, 'kael', 1).used).toBe(true);
        expect(skills.effects()).toEqual([ { label: 'Ventos Ligeiros', seconds: 12 } ]);
        expect(skills.slotState('lyra', 3, true).state).toBe('cooling');
    });
});

describe('damage over time', () => {
    const advanceBy = (skills, monster, seconds, boss = false) => {
        const ticks = [];

        for (let i = 0; i < seconds; i++) {
            ticks.push(skills.advance(1000, { monster, boss }).hits);
        }

        return ticks;
    };

    it('lands 6 ticks of 2 with Tempestade Arcana, the first 1 s after the cast, then stops', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 2);
        expect(skills.advance(999, { monster }).hits).toEqual([]);

        const ticks = [ skills.advance(1, { monster }).hits, ...advanceBy(skills, monster, 7) ];

        expect(ticks.map((hits) => hits.length)).toEqual([ 1, 1, 1, 1, 1, 1, 0, 0 ]);
        expect(ticks[0]).toEqual([ { damage: 2, critical: false } ]);
        expect(monster.health).toBe(988);
        expect(skills.effects()).toEqual([]);
    });

    it('lands every tick a long frame crosses', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 2);

        expect(skills.advance(4500, { monster }).hits).toHaveLength(4);
        expect(skills.advance(10000, { monster }).hits).toHaveLength(2);
    });

    it('never rolls a critical on a tick, even with a critical chance of 100', () => {
        const skills = combat(() => 0);
        const monster = monsterOf();

        use(skills, monster, 'vex', 1, { attacker: { ...PLAYER, critChance: 100 } });

        expect(skills.advance(1000, { monster }).hits).toEqual([ { damage: 1, critical: false } ]);
    });

    it('lands Bomba de Veneno as 1 per second for 8 s, with the tag showing x1', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'vex', 1);
        expect(skills.effects()).toEqual([ { label: 'Bomba de Veneno x1', seconds: 8 } ]);

        const ticks = advanceBy(skills, monster, 9);

        expect(ticks.map((hits) => hits.length)).toEqual([ 1, 1, 1, 1, 1, 1, 1, 1, 0 ]);
        expect(monster.health).toBe(992);
    });

    it('stacks the poison up to 3, ticks 1 per stack and restarts the 8 s', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'vex', 1);
        skills.cooldowns.clear();
        use(skills, monster, 'vex', 1);
        skills.cooldowns.clear();
        use(skills, monster, 'vex', 1);
        skills.cooldowns.clear();
        use(skills, monster, 'vex', 1);

        expect(skills.effects()).toEqual([ { label: 'Bomba de Veneno x3', seconds: 8 } ]);
        expect(skills.advance(1000, { monster }).hits).toEqual([ { damage: 3, critical: false } ]);
    });

    it('lands Golpe Sangrento as a hit of 6 and then 6 ticks of 1.5 over 6 s', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(use(skills, monster, 'vex', 3).hits).toEqual([ { damage: 6, critical: false } ]);

        const ticks = advanceBy(skills, monster, 7);

        expect(ticks.map((hits) => hits.length)).toEqual([ 1, 1, 1, 1, 1, 1, 0 ]);
        expect(ticks[0]).toEqual([ { damage: 1.5, critical: false } ]);
        expect(monster.health).toBe(1000 - 6 - 9);
    });

    it('starts no bleed when the hit of Golpe Sangrento kills', () => {
        const skills = combat();
        const monster = monsterOf(5);

        use(skills, monster, 'vex', 3);

        expect(monster.dead).toBe(true);
        expect(skills.effects()).toEqual([]);
    });

    it('ends the ticks when the monster dies or another monster comes', () => {
        const skills = combat();
        const monster = monsterOf(1.5);

        use(skills, monster, 'orina', 2);

        expect(skills.advance(5000, { monster }).hits).toEqual([ { damage: 2, critical: false } ]);
        expect(monster.dead).toBe(true);
        expect(skills.effects()).toEqual([]);

        const other = monsterOf();

        use(skills, other, 'vex', 1);
        expect(skills.advance(3000, { monster: monsterOf() }).hits).toEqual([]);
    });

    it('fixes the base damage at the cast but reads the defense at each tick', () => {
        const skills = combat();
        const monster = monsterOf(1000, stats('FIRE', 50));

        use(skills, monster, 'vex', 1, { attacker: { ...PLAYER, baseDamage: 10 } });
        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(5);

        use(skills, monster, 'kael', 3);
        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(8);
    });

    it('follows Bênção at the tick: the tick at the second it ends still gets 1.3, the next one does not', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1);
        skills.advance(14000, { monster });
        use(skills, monster, 'vex', 1);

        expect(skills.advance(1000, { monster }).hits[0].damage).toBeCloseTo(1.3, 10);
        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(1);
    });

    it('follows Bênção at the tick for a Tempestade Arcana tick too: 2.6 at the second it ends, then 2', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1);
        skills.advance(14000, { monster });
        use(skills, monster, 'orina', 2);

        expect(skills.advance(1000, { monster }).hits[0].damage).toBeCloseTo(2.6, 10);
        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(2);
    });

    it('follows Prisão at the tick: Tempestade Arcana ticks 2.5 at 1 s and at 2 s, when Prisão ends, then 2', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 1);
        use(skills, monster, 'orina', 2);

        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(2.5);
        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(2.5);
        expect(skills.advance(1000, { monster }).hits[0].damage).toBe(2);
    });

    it('ends Bênção after 15 s: Luz Divina deals 10.4 under it and 8 after', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1);
        expect(use(skills, monster, 'seraphine', 2).hits[0].damage).toBeCloseTo(10.4, 10);

        skills.advance(25000, { monster });
        expect(use(skills, monster, 'seraphine', 2).hits[0].damage).toBe(8);
    });

    it('ends Prisão after 2 s: a click deals 1.25 under it and 1 after', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 1);
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1.25);

        skills.advance(2000, { monster });
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1);
    });

    it('applies the boss damage of the attacker to a tick on a boss', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 2, { attacker: { ...PLAYER, bossDamage: 50 } });

        expect(skills.advance(1000, { monster, boss: true }).hits[0].damage).toBe(3);
    });
});

describe('the aimed shot', () => {
    it('shows the slot as casting for 2 s and lands a critical hit of 30 afterwards, then the slot cools', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(use(skills, monster, 'lyra', 2).hits).toEqual([]);
        expect(skills.slotState('lyra', 2, true).state).toBe('casting');

        expect(skills.advance(1999, { monster }).hits).toEqual([]);
        expect(skills.slotState('lyra', 2, true).state).toBe('casting');

        expect(skills.advance(1, { monster }).hits).toEqual([ { damage: 60, critical: true } ]);
        expect(monster.health).toBe(940);
        expect(skills.slotState('lyra', 2, true)).toEqual({ state: 'cooling', seconds: 28 });
    });

    it('is critical against critical resistance 100 and applies the boss damage', () => {
        const skills = combat();
        const monster = monsterOf(1000, stats('FIRE', 0, 0, 100));

        use(skills, monster, 'lyra', 2, { attacker: { ...PLAYER, bossDamage: 50 }, boss: true });

        expect(skills.advance(2000, { monster, boss: true }).hits).toEqual([ { damage: 90, critical: true } ]);
    });

    it('lands 75 under Prisão de Espinhos level 1 (30 x 2 critical x 1.25), which still runs at the 2 s the cast ends', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 1);
        use(skills, monster, 'lyra', 2);

        expect(skills.advance(1999, { monster }).hits).toEqual([]);
        expect(skills.advance(1, { monster }).hits).toEqual([ { damage: 75, critical: true } ]);
    });

    it('lands 78 under Bênção da Grande Árvore level 1 (30 x 2 critical x 1.3)', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1);
        use(skills, monster, 'lyra', 2);

        expect(skills.advance(1999, { monster }).hits).toEqual([]);

        const { hits } = skills.advance(1, { monster });

        expect(hits).toHaveLength(1);
        expect(hits[0].critical).toBe(true);
        expect(hits[0].damage).toBeCloseTo(78, 10);
    });

    it('is lost when the monster dies before the cast ends, and the cooldown keeps running', () => {
        const skills = combat();
        const monster = monsterOf(5);

        use(skills, monster, 'lyra', 2);
        monster.hit(5);

        expect(skills.advance(2000, { monster }).hits).toEqual([]);
        expect(skills.slotState('lyra', 2, true)).toEqual({ state: 'cooling', seconds: 28 });
    });

    it('is lost when another monster is on screen or none', () => {
        const skills = combat();
        const other = monsterOf();

        use(skills, monsterOf(), 'lyra', 2);
        expect(skills.advance(2000, { monster: other }).hits).toEqual([]);
        expect(other.health).toBe(1000);

        skills.cooldowns.clear();
        use(skills, other, 'lyra', 2);
        expect(skills.advance(2000, { monster: null }).hits).toEqual([]);
    });

    it('is lost when a tick of the same step kills the monster', () => {
        const skills = combat();
        const monster = monsterOf(1);

        use(skills, monster, 'orina', 2);
        use(skills, monster, 'lyra', 2);

        expect(skills.advance(2000, { monster }).hits).toEqual([ { damage: 2, critical: false } ]);
        expect(monster.dead).toBe(true);
    });
});

describe('boss control and the time shield', () => {
    it('stops the countdown for 3 s with Investida do Baluarte on a boss: a frame of 1000 ms runs 0 ms', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'kael', 2, { boss: true });

        expect(skills.countdownMs(1000)).toBe(0);
        skills.advance(1000, { monster, boss: true });
        expect(skills.countdownMs(1000)).toBe(0);
        skills.advance(1000, { monster, boss: true });
        expect(skills.countdownMs(1000)).toBe(0);
        skills.advance(1000, { monster, boss: true });
        expect(skills.countdownMs(1000)).toBe(1000);
    });

    it('runs the part of a frame after the stop ends', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'kael', 2, { boss: true });

        expect(skills.countdownMs(4000)).toBe(1000);
    });

    it('stops the countdown for 2 s with Prisão de Espinhos on a boss', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 1, { boss: true });

        expect(skills.countdownMs(2500)).toBe(500);
    });

    it('keeps a stun and a root together stopped until the later ends, without adding', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'kael', 2, { boss: true });
        skills.advance(1000, { monster, boss: true });
        use(skills, monster, 'orina', 1, { boss: true });

        expect(skills.countdownMs(2500)).toBe(500);
    });

    it('leaves the countdown running on a phase monster', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'kael', 2, { boss: false });
        use(skills, monster, 'orina', 1, { boss: false });

        expect(skills.countdownMs(1000)).toBe(1000);
    });

    it('ends the stop when the boss dies', () => {
        const skills = combat();
        const monster = monsterOf(1);

        use(skills, monster, 'orina', 1, { boss: true });
        monster.hit(1);
        skills.advance(0, { monster, boss: true });

        expect(skills.countdownMs(1000)).toBe(1000);
    });

    it('adds 4 s to the countdown with Carrilhão da Aurora on a boss each time, and nothing on a phase monster', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(use(skills, monster, 'seraphine', 3, { boss: true }).countdown).toEqual({ extendMs: 4000 });
        skills.advance(45000, { monster, boss: true });
        expect(use(skills, monster, 'seraphine', 3, { boss: true }).countdown).toEqual({ extendMs: 4000 });
        skills.advance(45000, { monster, boss: true });
        expect(use(skills, monster, 'seraphine', 3, { boss: false }).countdown).toEqual({ extendMs: 0 });
    });

    it('freezes nothing and extends nothing for the other skills', () => {
        expect(use(combat(), monsterOf(), 'kael', 1, { boss: true }).countdown).toEqual({ extendMs: 0 });
    });
});

describe('skill levels', () => {
    const hitsOf = (skills, monster, heroId, slot, extra = {}) => use(skills, monster, heroId, slot, extra).hits;
    const clickOf = (skills, monster) => skills.click({ attacker: PLAYER, monster, boss: false });

    it('Corte Dimensional lands 18.75 at level 2 and 22.5 at level 3', () => {
        expect(hitsOf(combat(), monsterOf(), 'kael', 1, { level: 2 })).toEqual([ { damage: 18.75, critical: false } ]);
        expect(hitsOf(combat(), monsterOf(), 'kael', 1, { level: 3 })).toEqual([ { damage: 22.5, critical: false } ]);
    });

    it('Corte Dimensional keeps its +30 armor pierce at level 2: 12.1875 against defense 50', () => {
        const [ hit ] = hitsOf(combat(), monsterOf(1000, stats('FIRE', 50)), 'kael', 1, { level: 2 });

        expect(hit.damage).toBeCloseTo(12.1875, 9);
    });

    it('Investida do Baluarte lands 6 at level 3 and still stops a boss countdown for 3 s', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(hitsOf(skills, monster, 'kael', 2, { level: 3, boss: true })).toEqual([ { damage: 6, critical: false } ]);
        expect(skills.countdownMs(5000)).toBe(2000);
    });

    it('Flecha Dupla lands two hits of 3.75 at level 2', () => {
        expect(hitsOf(combat(), monsterOf(), 'lyra', 1, { level: 2 })).toEqual([ { damage: 3.75, critical: false }, { damage: 3.75, critical: false } ]);
    });

    it('Tiro Preciso at level 2 lands an aimed critical hit of 75 after its 2 s cast', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 2, { level: 2 });

        expect(skills.advance(1999, { monster }).hits).toEqual([]);
        expect(skills.advance(1, { monster }).hits).toEqual([ { damage: 75, critical: true } ]);
    });

    it('Chuva de Meteoros lands 31.25 at level 2 and 37.5 at level 3', () => {
        expect(hitsOf(combat(), monsterOf(), 'orina', 3, { level: 2 })).toEqual([ { damage: 31.25, critical: false } ]);
        expect(hitsOf(combat(), monsterOf(), 'orina', 3, { level: 3 })).toEqual([ { damage: 37.5, critical: false } ]);
    });

    it('Luz Divina lands 10 at level 2 and 16.2 at level 3 on a DARKNESS monster', () => {
        expect(hitsOf(combat(), monsterOf(), 'seraphine', 2, { level: 2 })[0].damage).toBeCloseTo(10, 9);
        expect(hitsOf(combat(), monsterOf(1000, stats('DARKNESS')), 'seraphine', 2, { level: 3 })[0].damage).toBeCloseTo(12 * 0.9 * 1.5, 9);
    });

    it('Golpe Sangrento at level 3 lands 9, then six Bleed ticks of 2.25', () => {
        const skills = combat();
        const monster = monsterOf();

        expect(hitsOf(skills, monster, 'vex', 3, { level: 3 }).map((hit) => hit.damage)).toEqual([ 9 ]);

        const ticks = skills.advance(6000, { monster }).hits.map((hit) => hit.damage);

        expect(ticks).toHaveLength(6);
        ticks.forEach((damage) => expect(damage).toBeCloseTo(2.25, 9));
        expect(skills.advance(1000, { monster }).hits).toEqual([]);
    });

    it('Tempestade Arcana at level 3 lands six ticks of 3 and no seventh', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 2, { level: 3 });

        const ticks = skills.advance(10000, { monster }).hits.map((hit) => hit.damage);

        expect(ticks).toHaveLength(6);
        ticks.forEach((damage) => expect(damage).toBeCloseTo(3, 9));
    });

    it('Bomba de Veneno at level 2 ticks 1.25 per stack for 8 ticks', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'vex', 1, { level: 2 });

        const ticks = skills.advance(8000, { monster }).hits.map((hit) => hit.damage);

        expect(ticks).toHaveLength(8);
        ticks.forEach((damage) => expect(damage).toBeCloseTo(1.25, 9));
    });

    it('Ventos Ligeiros at level 2 makes a Base-1 click 1.625 for 12 s', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3, { level: 2 });

        expect(clickOf(skills, monster).damage).toBeCloseTo(1.625, 9);
        skills.advance(11999, { monster });
        expect(clickOf(skills, monster).damage).toBeCloseTo(1.625, 9);
        skills.advance(1, { monster });
        expect(clickOf(skills, monster).damage).toBe(1);
    });

    it('Bênção da Grande Árvore at level 3 makes a Base-1 click 1.99375 (1.375 x 1.45)', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'seraphine', 1, { level: 3 });

        expect(clickOf(skills, monster).damage).toBeCloseTo(1.99375, 9);
    });

    it('Bomba de Fumaça at level 3 adds 22.5 critical points', () => {
        const hit = combat(() => 0.32);
        const monster = monsterOf();

        use(hit, monster, 'vex', 2, { level: 3 });

        expect(clickOf(hit, monster)).toEqual({ damage: 2, critical: true });

        const miss = combat(() => 0.33);
        const other = monsterOf();

        use(miss, other, 'vex', 2, { level: 3 });

        expect(clickOf(miss, other).critical).toBe(false);
    });

    it('Brado Aterrador at level 3 removes 45 defense: a click on defense 50 deals 0.95, and 0.8 at level 1', () => {
        const high = combat();
        const highMonster = monsterOf(1000, stats('FIRE', 50));

        use(high, highMonster, 'kael', 3, { level: 3 });

        expect(clickOf(high, highMonster).damage).toBeCloseTo(0.95, 9);

        const low = combat();
        const lowMonster = monsterOf(1000, stats('FIRE', 50));

        use(low, lowMonster, 'kael', 3, { level: 1 });

        expect(clickOf(low, lowMonster).damage).toBeCloseTo(0.8, 9);
    });

    it('Prisão de Espinhos at level 2 multiplies Chuva de Meteoros at level 2 by 1.3125: 41.015625', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'orina', 1, { level: 2 });

        expect(hitsOf(skills, monster, 'orina', 3, { level: 2 })[0].damage).toBeCloseTo(41.015625, 9);
    });

    it('Carrilhão da Aurora adds 5000 ms at level 2 and 6000 ms at level 3 on a boss, and nothing on a phase monster', () => {
        expect(use(combat(), monsterOf(), 'seraphine', 3, { level: 2, boss: true }).countdown.extendMs).toBe(5000);
        expect(use(combat(), monsterOf(), 'seraphine', 3, { level: 3, boss: true }).countdown.extendMs).toBe(6000);
        expect(use(combat(), monsterOf(), 'seraphine', 3, { level: 2, boss: false }).countdown.extendMs).toBe(0);
    });

    it('a skill used without a level is level 1', () => {
        expect(hitsOf(combat(), monsterOf(), 'kael', 1)).toEqual([ { damage: 15, critical: false } ]);
    });

    it('the cooldown, the duration, the cast, the Root and the tick count do not change with the level', () => {
        const corte = combat();

        use(corte, monsterOf(), 'kael', 1, { level: 3 });
        expect(corte.slotState('kael', 1, true)).toEqual({ state: 'cooling', seconds: 20 });

        const ventos = combat();
        const ventosMonster = monsterOf();

        use(ventos, ventosMonster, 'lyra', 3, { level: 3 });
        expect(ventos.effects()).toEqual([ { label: 'Ventos Ligeiros', seconds: 12 } ]);

        const prisao = combat();

        use(prisao, monsterOf(), 'orina', 1, { level: 3, boss: true });
        expect(prisao.countdownMs(5000)).toBe(3000);

        const tempestade = combat();
        const tempestadeMonster = monsterOf();

        use(tempestade, tempestadeMonster, 'orina', 2, { level: 3 });
        expect(tempestade.advance(10000, { monster: tempestadeMonster }).hits).toHaveLength(6);
    });

    it('a restarted effect takes the factor of the restart', () => {
        const skills = combat();

        skills.start(skills.buffs, 'ventos', 'Ventos Ligeiros', 12000, {}, 1.25);
        skills.start(skills.buffs, 'ventos', 'Ventos Ligeiros', 12000, {}, 1.5);

        expect(skills.buffs).toHaveLength(1);
        expect(skills.factors()).toEqual({ ventos: 1.5 });
    });

    it('an effect keeps the factor it was cast with when the next skill is used at another level', () => {
        const skills = combat();
        const monster = monsterOf();

        use(skills, monster, 'lyra', 3, { level: 1 });
        use(skills, monster, 'lyra', 1, { level: 3 });

        expect(clickOf(skills, monster).damage).toBeCloseTo(1.5, 9);
    });
});

describe('allyHit', () => {
    //  A 3 star leader unlocks every skill; the allies are built apart from it
    const leader = leaderAttacker({ leader: { element: 'FIRE', stars: 3 } });
    const ally = (stars = 0, pieces = [], allyFactor = 1, leaderElement = 'FIRE') => allyAttacker({ ally: { stars }, pieces, leaderElement, allyFactor });
    const monsterWith = (element = 'FIRE', defense = 0) => new Monster(1000, null, { element, defense, critResistance: 0 });
    const piece = (slot, affixes, extra = {}) => ({ id: slot, slot, affixes, ...extra });
    const start = (skills, monster, heroId, slot) => skills.use({ heroId, slot, unlocked: true, level: 1, attacker: leader, monster, boss: false });

    //  Lands one ally hit and reads the damage both from the answer and from the health of the monster
    const land = (skills, monster, attacker, boss = false) =>
    {
        const before = monster.health;
        const result = skills.allyHit({ attacker, monster, boss });

        expect(before - monster.health).toBeCloseTo(result.damage, 9);

        return result.damage;
    };

    it('E1: Lyra 0 stars deals 2 to a FIRE monster with defense 0', () => {
        expect(land(combat(), monsterWith('FIRE', 0), ally())).toBeCloseTo(2, 9);
    });

    it('E2: Lyra 0 stars deals 1 to a FIRE monster with defense 50', () => {
        expect(land(combat(), monsterWith('FIRE', 50), ally())).toBeCloseTo(1, 9);
    });

    it('E3: Lyra 3 stars, an ally without a defense passive, with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50', () => {
        const pieces = [ piece('WEAPON', [], { clickDamage: 10 }), piece('RING', [ { type: 'CLICK_DAMAGE_PCT', value: 20 } ]) ];

        expect(land(combat(), monsterWith('NATURE', 50), ally(3, pieces))).toBeCloseTo(105.6, 9);
    });

    it('E4: Lyra 0 stars with +20 % boss damage deals 2.16 to a FIRE miniboss with defense 10', () => {
        const pieces = [ piece('AMULET', [ { type: 'BOSS_DAMAGE_PCT', value: 20 } ]) ];

        expect(land(combat(), monsterWith('FIRE', 10), ally(0, pieces), true)).toBeCloseTo(2.16, 9);
    });

    it('E5: Lyra and Seraphine 0 stars with the team factor deal 2.5 each', () => {
        const skills = combat();
        const monster = monsterWith();

        expect(land(skills, monster, ally(0, [], 1.25))).toBeCloseTo(2.5, 9);
        expect(land(skills, monster, ally(0, [], 1.25))).toBeCloseTo(2.5, 9);
        expect(1000 - monster.health).toBeCloseTo(5, 9);
    });

    it('E6: Vex 0 stars with 50 % armor pierce deals 1.6 to a FIRE monster with defense 40', () => {
        const pieces = [ piece('RING', [ { type: 'ARMOR_PIERCE_PCT', value: 50 } ]) ];

        expect(land(combat(), monsterWith('FIRE', 40), ally(0, pieces))).toBeCloseTo(1.6, 9);
    });

    it('E7: Prisão de Espinhos raises an ally hit to 2.5', () => {
        const skills = combat();
        const monster = monsterWith();

        start(skills, monster, 'orina', 1);

        expect(land(skills, monster, ally())).toBeCloseTo(2.5, 9);
    });

    it('E8: Bênção da Grande Árvore raises an ally hit to 2.6', () => {
        const skills = combat();
        const monster = monsterWith();

        start(skills, monster, 'seraphine', 1);

        expect(land(skills, monster, ally())).toBeCloseTo(2.6, 9);
    });

    it('E9: Brado Aterrador lowers the defense 40 an ally meets to 10: 1.8', () => {
        const skills = combat();
        const monster = monsterWith('FIRE', 40);

        start(skills, monster, 'kael', 3);

        expect(land(skills, monster, ally())).toBeCloseTo(1.8, 9);
    });

    it('E10: PHYSICAL_BREAK 5 lowers the defense 40 an ally meets to 35: 1.3', () => {
        const skills = new SkillCombat({
            random: never, statsOf: (m) => monsterAfterBreak(m.stats, [ { id: 'PHYSICAL_BREAK', baseId: 'PHYSICAL_BREAK', value: 5 } ])
        });

        expect(land(skills, monsterWith('FIRE', 40), ally())).toBeCloseTo(1.3, 9);
    });

    it('E11: Orina\'s passive lowers the defense 40 two allies meet to 25: 1.5 each', () => {
        const skills = new SkillCombat({ random: never, statsOf: (m) => monsterAfterBreak(m.stats, null, { defenseBreak: 15 }) });
        const monster = monsterWith('FIRE', 40);

        expect(land(skills, monster, ally())).toBeCloseTo(1.5, 9);
        expect(land(skills, monster, ally())).toBeCloseTo(1.5, 9);
    });

    it('E12: Lyra 9 stars deals 20', () => {
        expect(land(combat(), monsterWith(), ally(9))).toBeCloseTo(20, 9);
    });

    it('E13: critical pieces, Ventos Ligeiros and Bomba de Fumaça leave an ally hit at 2', () => {
        const skills = combat(() => 0);
        const monster = monsterWith();
        const pieces = [ piece('RING', [ { type: 'CRIT_CHANCE', value: 50 }, { type: 'CRIT_DAMAGE_PCT', value: 100 } ]) ];

        start(skills, monster, 'lyra', 3);
        start(skills, monster, 'vex', 2);

        expect(land(skills, monster, ally(0, pieces))).toBeCloseTo(2, 9);
    });

    it('E14: a 3 star leader with CLICK_DAMAGE 20 casts Corte Dimensional for 24, not 21, and an ally hit after it still deals 2', () => {
        const strong = leaderAttacker({ leader: { element: 'FIRE', stars: 3 }, talents: [ { id: 'CLICK_DAMAGE', value: 20 } ] });
        //  The skill of the leader on a fresh monster: the skills (with their running effects) and the monster come back with its damage
        const cast = (attacker) =>
        {
            const skills = combat();
            const monster = monsterWith();

            return { skills, monster, damage: skills.use({ heroId: 'kael', slot: 1, unlocked: true, level: 1, attacker, monster, boss: false }).hits[0].damage };
        };
        const plain = cast(leader);
        const boosted = cast(strong);

        expect(strong.baseDamage).toBeGreaterThan(leader.baseDamage);
        expect([ plain.damage, boosted.damage ]).toEqual([ expect.closeTo(21, 9), expect.closeTo(24, 9) ]);
        expect(land(boosted.skills, boosted.monster, ally())).toBeCloseTo(2, 9);
    });

    it('E15: the leader\'s element decides: FIRE deals 4 and WATER deals 1 to a NATURE monster', () => {
        expect(land(combat(), monsterWith('NATURE', 0), ally(0, [], 1, 'FIRE'))).toBeCloseTo(4, 9);
        expect(land(combat(), monsterWith('NATURE', 0), ally(0, [], 1, 'WATER'))).toBeCloseTo(1, 9);
    });

    it('an ally hit is never critical even when random returns 0', () => {
        const skills = combat(() => 0);
        const result = skills.allyHit({ attacker: ally(), monster: monsterWith(), boss: false });

        expect(result.critical).toBe(false);
        expect(result.damage).toBeCloseTo(2, 9);
    });

    it('an ally hit after Prisão ended deals 2 again', () => {
        const skills = combat();
        const monster = monsterWith();

        start(skills, monster, 'orina', 1);
        skills.advance(2000, { monster });

        expect(land(skills, monster, ally())).toBeCloseTo(2, 9);
    });

    it('an ally hit on a dead monster deals nothing', () => {
        const skills = combat();
        const monster = new Monster(1, null, { element: 'FIRE', defense: 0, critResistance: 0 });

        skills.allyHit({ attacker: ally(), monster, boss: false });
        skills.allyHit({ attacker: ally(), monster, boss: false });

        expect(monster.health).toBe(0);
        expect(monster.dead).toBe(true);
    });
});

describe('effects per monster', () => {
    const main = () => monsterOf(1000, stats('FIRE', 40));
    const other = () => monsterOf(100, stats('FIRE', 40));
    const click = (skills, monster, mainMonster) => skills.click({ attacker: PLAYER, monster, ...(mainMonster ? { main: mainMonster } : {}), boss: false });

    it('a click on another monster of the fight keeps the debuffs of the main', () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'kael', 3);
        click(skills, other(), boss);

        expect(skills.effects()).toEqual([ { label: 'Brado Aterrador', seconds: 10 } ]);
    });

    it("a click on another monster meets that monster's own debuffs", () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'kael', 3);

        expect(click(skills, other(), boss).damage).toBeCloseTo(0.6, 9);
        expect(click(skills, boss, boss).damage).toBeCloseTo(0.9, 9);
    });

    it('an ally hit on another monster keeps the effects of the main', () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'kael', 3);

        const hit = skills.allyHit({ attacker: PLAYER, monster: other(), main: boss, boss: false });

        expect(hit.damage).toBeCloseTo(0.6, 9);
        expect(skills.effects().map((effect) => effect.label)).toEqual([ 'Brado Aterrador' ]);
    });

    it('a click on a monster of another fight ends every effect on the old one', () => {
        const skills = combat();

        use(skills, main(), 'kael', 3);
        click(skills, other());

        expect(skills.effects()).toEqual([]);
    });

    it("effectsWithOwner of a monster without effects shows only the player's buffs", () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'lyra', 3);
        use(skills, boss, 'kael', 3);

        expect(skills.effectsWithOwner(other()).map((effect) => effect.label)).toEqual([ 'Ventos Ligeiros' ]);
        expect(skills.effectsWithOwner(boss).map((effect) => effect.label)).toEqual([ 'Ventos Ligeiros', 'Brado Aterrador' ]);
    });

    it('the Stun of the main survives a click on another monster', () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'kael', 2, { boss: true });
        click(skills, other(), boss);

        expect(skills.countdownMs(1000)).toBe(0);
    });

    it('the aimed shot keeps flying while the player clicks another monster', () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'lyra', 2);
        click(skills, other(), boss);

        const { hits, targets } = skills.advance(2000, { monster: boss });

        expect(hits).toEqual([ { damage: 36, critical: true } ]);
        expect(targets).toEqual([ boss ]);
    });

    it('use returns the monster each hit landed on', () => {
        const skills = combat();
        const boss = main();

        expect(use(skills, boss, 'kael', 1).targets).toEqual([ boss ]);
        expect(use(skills, boss, 'kael', 1)).toEqual({ used: false, hits: [], targets: [], countdown: { extendMs: 0 } });
    });

    it('advance returns the monster each tick landed on', () => {
        const skills = combat();
        const boss = main();

        use(skills, boss, 'orina', 2);

        expect(skills.advance(1000, { monster: boss }).targets).toEqual([ boss ]);
    });
});

describe('skills on every monster', () => {
    const rolls = (...values) => { let i = 0; return () => values[i++ % values.length]; };
    const damages = (hits) => hits.map((hit) => hit.damage);
    const kill = (monster) => monster.hit(monster.health);
    const fresh = () => ({ main: monsterOf(1000), a1: monsterOf(1000), a2: monsterOf(1000) });
    const guarded = (health, buff = 30, mainHealth = 1000) =>
    {
        const main = new Monster(mainHealth, null, { element: 'FIRE', defense: 49, critResistance: 0 });
        const fight = new Fight(main, [ { health, defenseBuff: buff, stats: DEFAULT_STATS }, { health, defenseBuff: buff, stats: DEFAULT_STATS } ]);
        const skills = new SkillCombat({ random: never, statsOf: (monster) => fight.statsOf(monster) });

        return { fight, skills, main, a1: fight.adds[0].monster, a2: fight.adds[1].monster };
    };

    it('Chuva de Meteoros hits Lacaio 1, Lacaio 2 and the miniboss in that order for 25 each', () => {
        const { main, a1, a2 } = fresh();
        const result = use(combat(), main, 'orina', 3, { adds: [ a1, a2 ] });

        expect(result.hits).toEqual([ { damage: 25, critical: false }, { damage: 25, critical: false }, { damage: 25, critical: false } ]);
        expect(result.targets).toEqual([ a1, a2, main ]);
        expect([ a1.health, a2.health, main.health ]).toEqual([ 975, 975, 975 ]);
    });

    it('Corte Dimensional, Investida do Baluarte, Luz Divina and Golpe Sangrento land one hit on each living monster', () => {
        const run = (heroId, slot) =>
        {
            const { main, a1, a2 } = fresh();

            return use(combat(), main, heroId, slot, { adds: [ a1, a2 ] });
        };

        expect(damages(run('kael', 1).hits)).toEqual([ 15, 15, 15 ]);
        expect(damages(run('kael', 2).hits)).toEqual([ 4, 4, 4 ]);
        expect(damages(run('seraphine', 2).hits)).toEqual([ 8, 8, 8 ]);
        expect(damages(run('vex', 3).hits)).toEqual([ 6, 6, 6 ]);
    });

    it('a skill skips a dead add', () => {
        const { main, a1, a2 } = fresh();

        kill(a1);

        expect(use(combat(), main, 'orina', 3, { adds: [ a1, a2 ] }).targets).toEqual([ a2, main ]);
    });

    it('E7: Chuva kills both guarding adds first and meets the miniboss unguarded: 25, 25 and 12.75', () => {
        const { fight, skills, main, a1, a2 } = guarded(20);
        const result = use(skills, main, 'orina', 3, { adds: fight.livingAddMonsters() });

        expect(damages(result.hits)[0]).toBeCloseTo(25, 9);
        expect(damages(result.hits)[1]).toBeCloseTo(25, 9);
        expect(damages(result.hits)[2]).toBeCloseTo(12.75, 9);
        expect(main.health).toBeCloseTo(987.25, 9);
        expect([ a1.dead, a2.dead ]).toEqual([ true, true ]);
    });

    it('E8: Chuva on a guarded miniboss whose adds survive deals 0 to it (defense 109)', () => {
        const { fight, skills, main } = guarded(1000);
        const result = use(skills, main, 'orina', 3, { adds: fight.livingAddMonsters() });

        expect(damages(result.hits)[0]).toBeCloseTo(25, 9);
        expect(damages(result.hits)[1]).toBeCloseTo(25, 9);
        expect(damages(result.hits)[2]).toBe(0);
    });

    it('E9: Brado Aterrador level 1 lowers the guarded chapter 11 miniboss from 109 to 79: a click deals 0.21', () => {
        const { fight, skills, main } = guarded(30);

        use(skills, main, 'kael', 3, { adds: fight.livingAddMonsters() });

        expect(skills.click({ attacker: PLAYER, monster: main, main, boss: false }).damage).toBeCloseTo(0.21, 9);
    });

    it('Brado Aterrador and Prisão de Espinhos go on every living monster', () => {
        const brado = fresh();
        const skills = combat();

        use(skills, brado.main, 'kael', 3, { adds: [ brado.a1, brado.a2 ] });

        expect(skills.effectsWithOwner(brado.a1).map((effect) => effect.label)).toEqual([ 'Brado Aterrador' ]);
        expect(skills.effectsWithOwner(brado.a2).map((effect) => effect.label)).toEqual([ 'Brado Aterrador' ]);

        const prisao = fresh();
        const other = combat();

        use(other, prisao.main, 'orina', 1, { adds: [ prisao.a1, prisao.a2 ] });

        expect(other.click({ attacker: PLAYER, monster: prisao.a1, main: prisao.main, boss: false }).damage).toBeCloseTo(1.25, 9);
    });

    it('Flecha Dupla shoots two arrows at each monster: six hits of 3', () => {
        const { main, a1, a2 } = fresh();
        const result = use(combat(), main, 'lyra', 1, { adds: [ a1, a2 ] });

        expect(damages(result.hits)).toEqual([ 3, 3, 3, 3, 3, 3 ]);
        expect(result.targets).toEqual([ a1, a1, a2, a2, main, main ]);
    });

    it('each arrow of Flecha Dupla rolls its own critical', () => {
        const { main, a1, a2 } = fresh();
        const result = use(combat(rolls(0, 0.99, 0.99, 0, 0.99, 0.99)), main, 'lyra', 1, { adds: [ a1, a2 ] });

        expect(result.hits.map((hit) => hit.critical)).toEqual([ true, false, false, true, false, false ]);
        expect(damages(result.hits)).toEqual([ 6, 3, 3, 6, 3, 3 ]);
    });

    it('a first arrow that kills an add stops its second arrow', () => {
        const { main, a2 } = fresh();
        const a1 = monsterOf(2);
        const result = use(combat(), main, 'lyra', 1, { adds: [ a1, a2 ] });

        expect(result.hits).toHaveLength(5);
        expect(result.targets).toEqual([ a1, a2, a2, main, main ]);
    });

    it('Tiro Preciso lands a critical 60 on every monster alive at the end of the cast', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        use(skills, main, 'lyra', 2, { adds: [ a1, a2 ] });

        const { hits, targets } = skills.advance(2000, { monster: main, adds: [ a1, a2 ] });

        expect(hits).toEqual([ { damage: 60, critical: true }, { damage: 60, critical: true }, { damage: 60, critical: true } ]);
        expect(targets).toEqual([ a1, a2, main ]);
    });

    it('Tiro Preciso skips an add that died during the cast', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        use(skills, main, 'lyra', 2, { adds: [ a1, a2 ] });
        kill(a1);

        const { hits, targets } = skills.advance(2000, { monster: main, adds: [ a1, a2 ] });

        expect(hits).toHaveLength(2);
        expect(targets).toEqual([ a2, main ]);
    });

    it('Tiro Preciso is lost when the miniboss dies during the cast', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        use(skills, main, 'lyra', 2, { adds: [ a1, a2 ] });
        kill(main);

        expect(skills.advance(2000, { monster: main, adds: [ a1, a2 ] }).hits).toEqual([]);
    });

    it('Tempestade Arcana ticks 2 on each monster every second', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();
        const options = { monster: main, adds: [ a1, a2 ] };

        use(skills, main, 'orina', 2, { adds: [ a1, a2 ] });

        const first = skills.advance(1000, options);

        expect(damages(first.hits)).toEqual([ 2, 2, 2 ]);
        expect(first.targets).toEqual([ a1, a2, main ]);

        for (let tick = 2; tick <= 6; tick++)
        {
            expect(skills.advance(1000, options).hits).toHaveLength(3);
        }

        expect(skills.advance(1000, options).hits).toEqual([]);
        expect(main.health).toBe(988);
    });

    it('Tempestade stops on an add that dies and keeps ticking on the others', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();
        const options = { monster: main, adds: [ a1, a2 ] };

        use(skills, main, 'orina', 2, { adds: [ a1, a2 ] });
        skills.advance(1000, options);
        kill(a1);

        const next = skills.advance(1000, options);

        expect(damages(next.hits)).toEqual([ 2, 2 ]);
        expect(next.targets).toEqual([ a2, main ]);
    });

    it('Tempestade ticks three times in one advance and the add that dies on the second tick takes no third', () => {
        const { main, a2 } = fresh();
        const dying = monsterOf(3);
        const skills = combat();
        const options = { monster: main, adds: [ dying, a2 ] };

        use(skills, main, 'orina', 2, { adds: [ dying, a2 ] });

        const { hits, targets } = skills.advance(3000, options);

        //  Tick 1: dying 3 -> 1, a2, main. Tick 2: dying is killed (dealt 2), a2, main. Tick 3: a2 and main only
        expect(targets).toEqual([ dying, a2, main, dying, a2, main, a2, main ]);
        expect(damages(hits)).toEqual([ 2, 2, 2, 2, 2, 2, 2, 2 ]);
        expect(dying.dead).toBe(true);
        expect(a2.health).toBe(994);
    });

    it('two damage over time effects on an add that the first one kills: the second one lands nothing on the dead add', () => {
        const { main } = fresh();
        const dying = monsterOf(1);
        const skills = combat();
        const options = { monster: main, adds: [ dying ] };

        use(skills, main, 'orina', 2, { adds: [ dying ] });
        use(skills, main, 'vex', 1, { adds: [ dying ] });

        const { targets } = skills.advance(1000, options);

        expect(dying.dead).toBe(true);
        expect(targets.filter((target) => target === dying)).toHaveLength(1);
        expect(targets.filter((target) => target === main)).toHaveLength(2);
    });

    it('a tick that kills both adds drops their buff for the miniboss tick of the same second', () => {
        const { fight, skills, main } = guarded(2);
        const options = { monster: main, adds: fight.livingAddMonsters() };

        use(skills, main, 'orina', 2, { adds: fight.livingAddMonsters() });

        const result = skills.advance(1000, options);

        expect(damages(result.hits)[0]).toBeCloseTo(2, 9);
        expect(damages(result.hits)[1]).toBeCloseTo(2, 9);
        expect(damages(result.hits)[2]).toBeCloseTo(1.02, 9);
    });

    it('Bomba de Veneno adds one stack to every living monster', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        use(skills, main, 'vex', 1, { adds: [ a1, a2 ] });

        expect(skills.effectsWithOwner(a1).map((effect) => effect.label)).toEqual([ 'Bomba de Veneno x1' ]);
        expect(damages(skills.advance(1000, { monster: main, adds: [ a1, a2 ] }).hits)).toEqual([ 1, 1, 1 ]);
    });

    it('Golpe Sangrento starts a Bleed on every monster it hit', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        expect(damages(use(skills, main, 'vex', 3, { adds: [ a1, a2 ] }).hits)).toEqual([ 6, 6, 6 ]);
        expect(damages(skills.advance(1000, { monster: main, adds: [ a1, a2 ] }).hits)).toEqual([ 1.5, 1.5, 1.5 ]);
    });

    it('Golpe Sangrento starts no Bleed on an add it killed', () => {
        const { main, a2 } = fresh();
        const a1 = monsterOf(6);
        const skills = combat();

        use(skills, main, 'vex', 3, { adds: [ a1, a2 ] });

        expect(a1.dead).toBe(true);

        const result = skills.advance(1000, { monster: main, adds: [ a1, a2 ] });

        expect(damages(result.hits)).toEqual([ 1.5, 1.5 ]);
        expect(result.targets).toEqual([ a2, main ]);
    });

    it('a dead add loses only its own effects', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        use(skills, main, 'kael', 3, { adds: [ a1, a2 ] });
        kill(a1);
        skills.advance(1, { monster: main, adds: [ a2 ] });

        expect(skills.effectsWithOwner(a1).map((effect) => effect.label)).not.toContain('Brado Aterrador');
        expect(skills.effectsWithOwner(main).map((effect) => effect.label)).toContain('Brado Aterrador');
        expect(skills.effectsWithOwner(a2).map((effect) => effect.label)).toContain('Brado Aterrador');
    });

    it('the Stun of Investida stops the countdown once in a fight with adds', () => {
        const { main, a1, a2 } = fresh();
        const skills = combat();

        use(skills, main, 'kael', 2, { adds: [ a1, a2 ], boss: true });

        expect(skills.countdownMs(1000)).toBe(0);

        skills.advance(3000, { monster: main, adds: [ a1, a2 ], boss: true });

        expect(skills.countdownMs(1000)).toBe(1000);
    });

    it('a skill with no adds lands on the one monster as before', () => {
        const main = monsterOf(1000);
        const result = use(combat(), main, 'orina', 3);

        expect(result.hits).toEqual([ { damage: 25, critical: false } ]);
        expect(result.targets).toEqual([ main ]);
    });
});

describe('affixes', () => {
    const withAffix = (affix, health = 1000) =>
    {
        const monster = monsterOf(health);

        monster.affix = new AffixState(affix);

        return monster;
    };
    const shell = (amount) => ({ type: 'SHELL', amount, periodMs: null });
    const shield = (amount) => ({ type: 'HIT_SHIELD', amount, periodMs: 6000 });

    it('a click on a Carapaça monster returns and deals the damage minus the shell', () => {
        const monster = withAffix(shell(6));

        expect(combat().click({ attacker: { ...PLAYER, baseDamage: 10 }, monster, boss: false })).toEqual({ damage: 4, critical: false });
        expect(monster.health).toBe(996);
    });

    it('an ally hit on a shielded monster takes a charge and returns 0', () => {
        const attacker = allyAttacker({ ally: { stars: 0 }, pieces: [], leaderElement: 'FIRE', allyFactor: 1 });
        const monster = withAffix(shield(1));
        const skills = combat();

        expect(skills.allyHit({ attacker, monster, boss: false })).toEqual({ damage: 0, critical: false });
        expect(monster.health).toBe(1000);
        expect(monster.affix.charges).toBe(0);
        expect(skills.allyHit({ attacker, monster, boss: false }).damage).toBe(2);
        expect(monster.health).toBe(998);
    });

    it('each hit of Flecha Dupla takes one charge in order', () => {
        const monster = withAffix(shield(1));

        const result = use(combat(), monster, 'lyra', 1);

        expect(result.hits).toEqual([ { damage: 0, critical: false }, { damage: 3, critical: false } ]);
        expect(monster.health).toBe(997);
    });

    it('a damage-over-time tick on a Carapaça monster returns the tick minus the shell, 0 when the tick is smaller', () => {
        const skills = combat();
        const monster = withAffix(shell(1));

        use(skills, monster, 'orina', 2);

        expect(skills.advance(1000, { monster }).hits).toEqual([ { damage: 1, critical: false } ]);
        expect(monster.health).toBe(999);

        const heavy = withAffix(shell(5));
        const other = combat();

        use(other, heavy, 'orina', 2);

        expect(other.advance(1000, { monster: heavy }).hits).toEqual([ { damage: 0, critical: false } ]);
        expect(heavy.health).toBe(1000);
    });

    it('the aimed shot of Tiro Preciso goes through Carapaça', () => {
        const skills = combat();
        const monster = withAffix(shell(16));

        use(skills, monster, 'lyra', 2);

        expect(skills.advance(2000, { monster }).hits).toEqual([ { damage: 44, critical: true } ]);
        expect(monster.health).toBe(956);
    });

    it('a Blindado +20 monster of seeded defense 33 takes 0.47 from a Base-1 click and one of seeded defense 80 takes 0', () => {
        const armor = { type: 'ARMORED', amount: 20, periodMs: null };
        const light = monsterOf(1000, affixDefense(stats('FIRE', 33, 33), armor));
        const heavy = monsterOf(1000, affixDefense(stats('FIRE', 80, 80), armor));

        expect(combat().click({ attacker: PLAYER, monster: light, boss: false }).damage).toBeCloseTo(0.47, 10);
        expect(light.health).toBeCloseTo(999.53, 6);
        expect(combat().click({ attacker: PLAYER, monster: heavy, boss: false })).toEqual({ damage: 0, critical: false });
        expect(heavy.health).toBe(1000);
    });

    it('the double click of Lyra on a shield with 1 charge takes the charge with the first hit and lands the second', () => {
        const monster = withAffix(shield(1));
        const skills = combat();

        expect(skills.click({ attacker: PLAYER, monster, boss: false, forceCritical: true })).toEqual({ damage: 0, critical: true });
        expect(skills.click({ attacker: PLAYER, monster, boss: false, forceCritical: true })).toEqual({ damage: 2, critical: true });
        expect(monster.health).toBe(998);
    });

    it('without an affix every result is unchanged', () => {
        const monster = monsterOf();

        expect(combat().click({ attacker: PLAYER, monster, boss: false })).toEqual({ damage: 1, critical: false });
        expect(monster.health).toBe(999);
    });
});
