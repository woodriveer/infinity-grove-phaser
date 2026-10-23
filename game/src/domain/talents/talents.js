//  The effects of the talents the player bought (spec talents). `talents` is the list the backend answers
//  ({ id, branch, label, unit, perLevel, maxLevel, level, value, nextCost }); the game types no number of the catalog, it reads `value`.
//  Pure JavaScript: no Phaser. A missing list means no talent: the fight has no talent effect until they load.
import { CHAPTER_BOSS, FARM, MINIBOSS } from '../campaign/campaign';

const SECOND = 1000;

//  What the talent `id` adds now, 0 when it is missing: the values of all its grades added (grade N is `<id>_G<N>`, with `baseId` = `id`)
export const talentValue = (talents, id) => (talents ?? [])
    .filter((talent) => (talent.baseId ?? talent.id) === id)
    .reduce((sum, talent) => sum + talent.value, 0);

//  The four numbers of the leader attacker the power talents raise (see `attackerFor`): flat click damage, percent of click damage, points
//  of critical chance and percent of critical damage
export const talentAttackerBonus = (talents) => ({
    clickDamageFlat: talentValue(talents, 'CLICK_FLAT_DAMAGE'),
    clickDamagePct: talentValue(talents, 'CLICK_DAMAGE'),
    critChance: talentValue(talents, 'CRIT_CHANCE'),
    critDamagePct: talentValue(talents, 'CRIT_DAMAGE')
});

//  The stats of a monster after the break talents: points off the physical defense, the magical defense and the critical resistance, none
//  below 0. The damage type of a hit picks the defense it meets, so the physical talent works for clicks and the magical one for magic.
export const monsterAfterBreak = (stats, talents) => ({
    ...stats,
    physicalDefense: Math.max(0, stats.physicalDefense - talentValue(talents, 'PHYSICAL_BREAK')),
    magicalDefense: Math.max(0, stats.magicalDefense - talentValue(talents, 'MAGICAL_BREAK')),
    critResistance: Math.max(0, stats.critResistance - talentValue(talents, 'CRIT_RESIST_BREAK'))
});

//  The milliseconds the time talents add to the limit of an encounter: a miniboss gets MINIBOSS_TIME, the chapter boss BOSS_TIME, and a
//  fight of a beaten boss (a farm fight) the talent of the boss it replays. A phase monster has no limit.
export const talentTimeBonusMs = (talents, encounter) =>
{
    const kind = encounter.kind === FARM ? encounter.boss.kind : encounter.kind;

    if (kind === MINIBOSS)
    {
        return talentValue(talents, 'MINIBOSS_TIME') * SECOND;
    }

    return kind === CHAPTER_BOSS ? talentValue(talents, 'BOSS_TIME') * SECOND : 0;
};

//  The cap of the combo bonus in percent (spec talent-points): 5 per level of COMBO, 0 without the talent or before the talents load
export const talentComboCap = (talents) => talentValue(talents, 'COMBO');

//  The sum of two attacker bonuses (the stars and the talents)
export const addBonuses = (a, b) => ({
    clickDamageFlat: (a.clickDamageFlat ?? 0) + (b.clickDamageFlat ?? 0),
    clickDamagePct: a.clickDamagePct + b.clickDamagePct,
    critChance: a.critChance + b.critChance,
    critDamagePct: a.critDamagePct + b.critDamagePct
});

export const BRANCH_TITLES = { TIME: 'Tempo', BREAK: 'Quebra de defesa', POWER: 'Poder do clique', COMBO: 'Combo' };
export const BRANCHES = [ 'TIME', 'BREAK', 'POWER', 'COMBO' ];

//  "+6 s", "-3 pontos", "+9%", "+3 pontos"; "nenhum" at level 0. A BREAK talent lowers a stat, so its points read as a reduction.
export const describeTalentEffect = ({ branch, unit, value }) =>
{
    if (value === 0)
    {
        return 'nenhum';
    }

    if (unit === '%')
    {
        return `+${value}%`;
    }

    if (unit === 'dmg')
    {
        return `+${value} de dano`;
    }

    if (unit === 's')
    {
        return `+${value} s`;
    }

    return `${branch === 'BREAK' ? '-' : '+'}${value} pontos`;
};

//  The file of the icon of a talent in assets/ui (the names of PROMPTS_ASSETS_UI.md)
const ICON_NAMES = {
    MINIBOSS_TIME: 'miniboss-time',
    BOSS_TIME: 'boss-time',
    PHYSICAL_BREAK: 'break-physical',
    MAGICAL_BREAK: 'break-magical',
    CRIT_RESIST_BREAK: 'break-crit',
    CLICK_DAMAGE: 'click-damage',
    CRIT_CHANCE: 'crit-chance',
    CRIT_DAMAGE: 'crit-damage',
    COMBO: 'combo',
    CLICK_FLAT_DAMAGE: 'click-flat-damage'
};

export const talentIconName = (talentId) => `talent-${ICON_NAMES[talentId] ?? talentId.toLowerCase()}`;
