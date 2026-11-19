import { describe, expect, it } from 'vitest';
import {
    LOCKED_TEAM, NO_PASSIVES, PASSIVES, activePassives, availableHeroes, fightingAllies, normalizeTeam, passiveLine, passiveOf, slotStates,
    teamActive, teamPassives
} from './team';

const hero = (id, owned = true) => ({ id, owned });
const kael = hero('kael');
const lyra = hero('lyra');
const orina = hero('orina');
const seraphine = hero('seraphine');
const vex = hero('vex');
const HEROES = [ kael, lyra, orina, seraphine, vex ];

const PRICES = [ 10000, 20000, 30000, 40000 ];
const teamOf = (overrides = {}) => ({
    unlocked: true, openSlots: 4, boughtSlots: 4, slotPrices: PRICES, allies: [ null, null, null, null ], ...overrides
});

describe('normalizeTeam', () => {
    const valid = { unlocked: true, openSlots: 2, boughtSlots: 1, slotPrices: [ 10000, 20000, 30000, 40000 ], allies: [ 'lyra', null, null, null ] };

    it('keeps a valid team payload', () => {
        expect(normalizeTeam(valid)).toEqual(valid);
    });

    it('gives the locked team for a missing payload', () => {
        expect(normalizeTeam(undefined)).toBe(LOCKED_TEAM);
        expect(normalizeTeam(null)).toBe(LOCKED_TEAM);
    });

    it('gives the locked team when unlocked is not a boolean', () => {
        expect(normalizeTeam({ ...valid, unlocked: 'yes' })).toBe(LOCKED_TEAM);
    });

    it('gives the locked team when openSlots is 5', () => {
        expect(normalizeTeam({ ...valid, openSlots: 5 })).toBe(LOCKED_TEAM);
    });

    it('gives the locked team when boughtSlots is -1', () => {
        expect(normalizeTeam({ ...valid, boughtSlots: -1 })).toBe(LOCKED_TEAM);
    });

    it('gives the locked team when slotPrices has 3 entries', () => {
        expect(normalizeTeam({ ...valid, slotPrices: [ 10000, 20000, 30000 ] })).toBe(LOCKED_TEAM);
    });

    it('gives the locked team when allies has 3 entries', () => {
        expect(normalizeTeam({ ...valid, allies: [ 'lyra', null, null ] })).toBe(LOCKED_TEAM);
    });

    it('gives the locked team when an ally entry is a number', () => {
        expect(normalizeTeam({ ...valid, allies: [ 1, null, null, null ] })).toBe(LOCKED_TEAM);
    });
});

describe('teamActive', () => {
    it('is false before the campaign loads', () => {
        expect(teamActive(null)).toBe(false);
    });

    it('is false at chapter 4 and true at chapters 5 and 15', () => {
        expect(teamActive({ chapter: 4, completed: false })).toBe(false);
        expect(teamActive({ chapter: 5, completed: false })).toBe(true);
        expect(teamActive({ chapter: 15, completed: false })).toBe(true);
    });

    it('is true for a completed campaign', () => {
        expect(teamActive({ chapter: 1, completed: true })).toBe(true);
    });
});

describe('fightingAllies', () => {
    it('is empty while the team is inactive', () => {
        const team = teamOf({ boughtSlots: 1, allies: [ 'lyra', null, null, null ] });

        expect(fightingAllies({ team, heroes: HEROES, leaderId: 'kael', active: false })).toEqual([]);
    });

    it('lists the heroes of bought filled slots with their slot numbers', () => {
        const team = teamOf({ boughtSlots: 4, allies: [ null, 'lyra', null, 'orina' ] });

        expect(fightingAllies({ team, heroes: HEROES, leaderId: 'kael', active: true })).toEqual([
            { slot: 2, hero: lyra },
            { slot: 4, hero: orina }
        ]);
    });

    it('skips an entry in a slot that is not bought', () => {
        const team = teamOf({ boughtSlots: 1, allies: [ 'lyra', 'orina', null, null ] });

        expect(fightingAllies({ team, heroes: HEROES, leaderId: 'kael', active: true })).toEqual([ { slot: 1, hero: lyra } ]);
    });

    it('skips the leader', () => {
        const team = teamOf({ boughtSlots: 1, allies: [ 'lyra', null, null, null ] });

        expect(fightingAllies({ team, heroes: HEROES, leaderId: 'lyra', active: true })).toEqual([]);
    });

    it('skips a hero missing from the heroes list', () => {
        const team = teamOf({ boughtSlots: 1, allies: [ 'lyra', null, null, null ] });

        expect(fightingAllies({ team, heroes: [], leaderId: 'kael', active: true })).toEqual([]);
    });
});

describe('passives', () => {
    it('each passive has its name and text', () => {
        expect(PASSIVES.kael).toEqual({ name: 'Guarda do Baluarte', text: '+5 s no tempo dos chefes' });
        expect(PASSIVES.lyra).toEqual({ name: 'Olho do Falcão', text: '+10 de chance de crítico' });
        expect(PASSIVES.orina).toEqual({ name: 'Erosão Arcana', text: '-15 de defesa dos inimigos' });
        expect(PASSIVES.vex).toEqual({ name: 'Lâminas Sombrias', text: '-15 de resistência a crítico dos inimigos' });
        expect(PASSIVES.seraphine).toEqual({ name: 'Graça da Aurora', text: '+25% de dano da equipe' });
    });

    it('passiveLine joins the name and the text', () => {
        expect(passiveLine('seraphine')).toBe('Graça da Aurora: +25% de dano da equipe');
        expect(passiveLine('ghost')).toBe('');
        expect(passiveOf('ghost')).toBeNull();
    });

    it('teamPassives of no ally is NO_PASSIVES', () => {
        expect(teamPassives([])).toEqual(NO_PASSIVES);
    });

    it('Kael brings 5000 ms of boss time', () => {
        expect(teamPassives([ 'kael' ])).toEqual({ ...NO_PASSIVES, bossTimeMs: 5000 });
    });

    it('Lyra brings 10 points of critical chance', () => {
        expect(teamPassives([ 'lyra' ])).toEqual({ ...NO_PASSIVES, critChance: 10 });
    });

    it('Orina brings 15 points off the defense', () => {
        expect(teamPassives([ 'orina' ])).toEqual({ ...NO_PASSIVES, defenseBreak: 15 });
    });

    it('Vex brings 15 points off the critical resistance', () => {
        expect(teamPassives([ 'vex' ])).toEqual({ ...NO_PASSIVES, critResistBreak: 15 });
    });

    it('Seraphine brings the team factor 1.25', () => {
        expect(teamPassives([ 'seraphine' ]).allyFactor).toBeCloseTo(1.25, 9);
        expect(teamPassives([ 'seraphine' ])).toMatchObject({ bossTimeMs: 0, critChance: 0, defenseBreak: 0, critResistBreak: 0 });
    });

    it('all five passives add up', () => {
        const passives = teamPassives([ 'kael', 'lyra', 'orina', 'vex', 'seraphine' ]);

        expect(passives).toMatchObject({ bossTimeMs: 5000, critChance: 10, defenseBreak: 15, critResistBreak: 15 });
        expect(passives.allyFactor).toBeCloseTo(1.25, 9);
    });
});

describe('activePassives', () => {
    const team = teamOf({ boughtSlots: 1, allies: [ 'kael', null, null, null ] });
    const heroes = [ hero('seraphine'), kael ];

    it('is NO_PASSIVES below chapter 5', () => {
        expect(activePassives({ team, heroes, leaderId: 'seraphine', position: { chapter: 4, completed: false } })).toEqual(NO_PASSIVES);
    });

    it('applies Kael at chapter 5', () => {
        const passives = activePassives({ team, heroes, leaderId: 'seraphine', position: { chapter: 5, completed: false } });

        expect(passives.bossTimeMs).toBe(5000);
    });
});

describe('slotStates', () => {
    const states = (team) => slotStates(team).map(({ state }) => state);

    it('of a locked team shows four locked slots with their chapter and price', () => {
        expect(slotStates(LOCKED_TEAM)).toEqual([
            { slot: 1, state: 'locked', heroId: null, priceGold: 1, chapter: 5 },
            { slot: 2, state: 'locked', heroId: null, priceGold: 2, chapter: 6 },
            { slot: 3, state: 'locked', heroId: null, priceGold: 3, chapter: 7 },
            { slot: 4, state: 'locked', heroId: null, priceGold: 4, chapter: 8 }
        ]);
    });

    it('with slot 1 open shows it buyable and the rest locked', () => {
        expect(states(teamOf({ openSlots: 1, boughtSlots: 0 }))).toEqual([ 'buyable', 'locked', 'locked', 'locked' ]);
    });

    it('with three open and none bought shows buyable, waiting, waiting, locked', () => {
        expect(states(teamOf({ openSlots: 3, boughtSlots: 0 }))).toEqual([ 'buyable', 'waiting', 'waiting', 'locked' ]);
    });

    it('with one bought of two open shows empty, buyable, locked, locked', () => {
        expect(states(teamOf({ openSlots: 2, boughtSlots: 1 }))).toEqual([ 'empty', 'buyable', 'locked', 'locked' ]);
    });

    it('with four bought shows filled and empty slots with their heroes', () => {
        const slots = slotStates(teamOf({ allies: [ 'lyra', null, 'orina', null ] }));

        expect(slots.map(({ state }) => state)).toEqual([ 'filled', 'empty', 'filled', 'empty' ]);
        expect(slots.map(({ heroId }) => heroId)).toEqual([ 'lyra', null, 'orina', null ]);
    });
});

describe('availableHeroes', () => {
    it('lists the owned heroes outside the team in catalog order', () => {
        const heroes = [ kael, lyra, orina, hero('seraphine', false), vex ];
        const team = teamOf({ boughtSlots: 1, allies: [ 'lyra', null, null, null ] });

        expect(availableHeroes({ team, heroes, leaderId: 'kael' })).toEqual([ orina, vex ]);
    });

    it('lists a hero whose entry sits in a slot that is not bought', () => {
        const team = teamOf({ boughtSlots: 1, allies: [ 'lyra', 'orina', null, null ] });

        expect(availableHeroes({ team, heroes: HEROES, leaderId: 'kael' }).map(({ id }) => id)).toContain('orina');
    });
});
