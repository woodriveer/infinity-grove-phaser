//  The team of the player (spec hero-team): the payload of the backend, when the allies fight, who fights, the passives they bring and
//  what each ally slot shows. Pure JavaScript: no Phaser.
export const TEAM_FIRST_CHAPTER = 5;
export const ALLY_SLOTS = [ 1, 2, 3, 4 ];
const COPPER_PER_GOLD = 10000;

export const LOCKED_TEAM = Object.freeze({
    unlocked: false,
    openSlots: 0,
    boughtSlots: 0,
    slotPrices: Object.freeze([ 10000, 20000, 30000, 40000 ]),
    allies: Object.freeze([ null, null, null, null ])
});

const isSlotCount = (value) => Number.isInteger(value) && value >= 0 && value <= ALLY_SLOTS.length;

const isValidTeam = (payload) => Boolean(payload) && typeof payload === 'object'
    && typeof payload.unlocked === 'boolean'
    && isSlotCount(payload.openSlots)
    && isSlotCount(payload.boughtSlots)
    && Array.isArray(payload.slotPrices)
    && payload.slotPrices.length === ALLY_SLOTS.length
    && payload.slotPrices.every((price) => Number.isInteger(price) && price > 0)
    && Array.isArray(payload.allies)
    && payload.allies.length === ALLY_SLOTS.length
    && payload.allies.every((entry) => entry === null || typeof entry === 'string');

//  The team of a heroes payload; a missing or malformed `team` (a backend before this feature) is the locked team
export const normalizeTeam = (payload) =>
{
    if (!isValidTeam(payload))
    {
        return LOCKED_TEAM;
    }

    return {
        unlocked: payload.unlocked,
        openSlots: payload.openSlots,
        boughtSlots: payload.boughtSlots,
        slotPrices: [ ...payload.slotPrices ],
        allies: [ ...payload.allies ]
    };
};

//  The allies fight while the campaign is at chapter 5 or later, or completed; `position` is { chapter, completed } or null before it loads
export const teamActive = (position) => Boolean(position) && (position.completed === true || (position.chapter ?? 0) >= TEAM_FIRST_CHAPTER);

//  The heroes of the bought, filled ally slots, in slot order: [ { slot, hero } ]; none while the team is inactive. The leader, an id of
//  a slot that is not bought and an id missing from `heroes` are skipped.
export const fightingAllies = ({ team, heroes, leaderId, active }) =>
{
    if (!active)
    {
        return [];
    }

    return ALLY_SLOTS
        .filter((slot) => slot <= team.boughtSlots)
        .map((slot) => ({ slot, hero: heroes.find((hero) => hero.id === team.allies[slot - 1]) }))
        .filter(({ hero }) => hero !== undefined && hero.id !== leaderId);
};

export const PASSIVES = Object.freeze({
    kael: Object.freeze({ name: 'Guarda do Baluarte', text: '+5 s no tempo dos chefes' }),
    lyra: Object.freeze({ name: 'Olho do Falcão', text: '+10 de chance de crítico' }),
    orina: Object.freeze({ name: 'Erosão Arcana', text: '-15 de defesa dos inimigos' }),
    vex: Object.freeze({ name: 'Lâminas Sombrias', text: '-15 de resistência a crítico dos inimigos' }),
    seraphine: Object.freeze({ name: 'Graça da Aurora', text: '+25% de dano da equipe' })
});

export const passiveOf = (heroId) => PASSIVES[heroId] ?? null;

//  "Graça da Aurora: +25% de dano da equipe"; '' for a hero without a passive
export const passiveLine = (heroId) =>
{
    const passive = passiveOf(heroId);

    return passive ? `${passive.name}: ${passive.text}` : '';
};

export const NO_PASSIVES = Object.freeze({ bossTimeMs: 0, critChance: 0, defenseBreak: 0, critResistBreak: 0, allyFactor: 1 });

//  What the fighting allies `heroIds` bring: Kael 5000 ms on the boss time limit, Lyra 10 points of critical chance, Orina 15 points
//  off the defense, Vex 15 points off the critical resistance, Seraphine x1.25 on every ally hit
export const teamPassives = (heroIds) =>
{
    const passives = { ...NO_PASSIVES };

    heroIds.forEach((heroId) =>
    {
        if (heroId === 'kael')
        {
            passives.bossTimeMs += 5000;
        }
        else if (heroId === 'lyra')
        {
            passives.critChance += 10;
        }
        else if (heroId === 'orina')
        {
            passives.defenseBreak += 15;
        }
        else if (heroId === 'vex')
        {
            passives.critResistBreak += 15;
        }
        else if (heroId === 'seraphine')
        {
            passives.allyFactor *= 1.25;
        }
    });

    return passives;
};

//  The passives that apply now
export const activePassives = ({ team, heroes, leaderId, position }) =>
    teamPassives(fightingAllies({ team, heroes, leaderId, active: teamActive(position) }).map(({ hero }) => hero.id));

const slotState = (team, slot) =>
{
    if (slot <= team.boughtSlots)
    {
        return team.allies[slot - 1] ? 'filled' : 'empty';
    }

    if (slot === team.boughtSlots + 1 && slot <= team.openSlots)
    {
        return 'buyable';
    }

    return slot <= team.openSlots ? 'waiting' : 'locked';
};

//  Ally slots 1 to 4 as the Equipe screen shows them: { slot, state, heroId, priceGold, chapter }, state one of
//  filled | empty | buyable | waiting | locked (spec Equipe Screen Layout)
export const slotStates = (team) => ALLY_SLOTS.map((slot) =>
{
    const state = slotState(team, slot);

    return {
        slot,
        state,
        heroId: state === 'filled' ? team.allies[slot - 1] : null,
        priceGold: team.slotPrices[slot - 1] / COPPER_PER_GOLD,
        chapter: TEAM_FIRST_CHAPTER - 1 + slot
    };
});

//  The owned heroes outside the team (not the leader, not in a bought slot), in catalog order
export const availableHeroes = ({ team, heroes, leaderId }) =>
{
    const inTeam = team.allies.slice(0, team.boughtSlots);

    return heroes.filter((hero) => hero.owned && hero.id !== leaderId && !inTeam.includes(hero.id));
};
