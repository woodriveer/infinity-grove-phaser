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
