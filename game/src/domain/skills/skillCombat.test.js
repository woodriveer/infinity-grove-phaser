import { describe, expect, it } from 'vitest';
import { Monster } from '../combat/monster';
import { PLAYER } from '../combat/damage';
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

    it('lands Chuva de Meteoros as one magical hit of 25 and Golpe Sangrento as 6', () => {
        const meteors = monsterOf(1000, stats('FIRE', 90, 20));

        expect(use(combat(), meteors, 'orina', 3).hits).toEqual([ { damage: 20, critical: false } ]);
        expect(use(combat(), monsterOf(), 'vex', 3).hits).toEqual([ { damage: 6, critical: false } ]);
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

    it('lowers the physical defense by 30 points for 10 s with Brado Aterrador', () => {
        const skills = combat();
        const monster = monsterOf(1000, stats('FIRE', 50));

        use(skills, monster, 'kael', 3);
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(0.8);

        skills.advance(10000, { monster });
        expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(0.5);
    });

    it('adds 25 % magical damage for 2 s with Prisão de Espinhos', () => {
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

    it('lands 6 magical ticks of 2 with Tempestade Arcana, the first 1 s after the cast, then stops', () => {
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
