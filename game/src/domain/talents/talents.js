//  The effects of the talents the player bought (spec talents). `talents` is the list the backend answers
//  ({ id, branch, label, unit, perLevel, maxLevel, level, value, nextCost }); the game types no number of the catalog, it reads `value`.
//  Pure JavaScript: no Phaser. A missing list means no talent: the fight has no talent effect until they load.
import { FARM, MINIBOSS } from '../campaign/campaign';
import { COMBO_STEP_PERCENT } from '../combat/combo';
import { defenseOf } from '../combat/monster';

const SECOND = 1000;

//  What the talent `id` adds now, 0 when it is missing: the values of all its grades added (grade N is `<id>_G<N>`, with `baseId` = `id`)
export const talentValue = (talents, id) => (talents ?? [])
    .filter((talent) => (talent.baseId ?? talent.id) === id)
    .reduce((sum, talent) => sum + talent.value, 0);

//  The six numbers of the leader attacker the talents raise (see `attackerFor`): flat click damage, percent of click damage, points of
//  critical chance, percent of critical damage, percent of armor pierce (ARMOR_PIERCE) and percent of boss damage (BOSS_DAMAGE)
export const talentAttackerBonus = (talents) => ({
    clickDamageFlat: talentValue(talents, 'CLICK_FLAT_DAMAGE'),
    clickDamagePct: talentValue(talents, 'CLICK_DAMAGE'),
    critChance: talentValue(talents, 'CRIT_CHANCE'),
    critDamagePct: talentValue(talents, 'CRIT_DAMAGE'),
    armorPierce: talentValue(talents, 'ARMOR_PIERCE'),
    bossDamage: talentValue(talents, 'BOSS_DAMAGE')
});

//  The stats of a monster after the break talents and the team passives: points off the one defense (PHYSICAL_BREAK, all grades, and the
//  Erosão Arcana of Orina, `passives.defenseBreak`) and off the critical resistance (the Lâminas Sombrias of Vex, `passives.critResistBreak`
//  only: the critical resistance break left the tree with talent-tree-rework), none below 0. Every other field is kept as received.
export const monsterAfterBreak = (stats, talents, passives = {}) => ({
    ...stats,
    defense: Math.max(0, defenseOf(stats) - talentValue(talents, 'PHYSICAL_BREAK') - (passives.defenseBreak ?? 0)),
    critResistance: Math.max(0, stats.critResistance - (passives.critResistBreak ?? 0))
});

//  The milliseconds MINIBOSS_TIME adds to the limit of an encounter: a miniboss (campaign, or the boss a farm fight replays) gets it; no
//  talent adds time to a chapter boss since talent-tree-rework, and a phase monster has no limit
export const talentTimeBonusMs = (talents, encounter) =>
{
    const kind = encounter.kind === FARM ? encounter.boss.kind : encounter.kind;

    return kind === MINIBOSS ? talentValue(talents, 'MINIBOSS_TIME') * SECOND : 0;
};

//  The cap of the combo bonus in percent (spec talent-points): 5 per level of COMBO, 0 without the talent or before the talents load
export const talentComboCap = (talents) => talentValue(talents, 'COMBO');

//  The combo bonus a click adds (spec talent-tree-rework): 1 % plus the value of Fúria crescente
export const talentComboStep = (talents) => COMBO_STEP_PERCENT + talentValue(talents, 'COMBO_FURY');

//  The sum of two attacker bonuses (the stars and the talents)
export const addBonuses = (a, b) => ({
    clickDamageFlat: (a.clickDamageFlat ?? 0) + (b.clickDamageFlat ?? 0),
    clickDamagePct: a.clickDamagePct + b.clickDamagePct,
    critChance: a.critChance + b.critChance,
    critDamagePct: a.critDamagePct + b.critDamagePct,
    armorPierce: (a.armorPierce ?? 0) + (b.armorPierce ?? 0),
    bossDamage: (a.bossDamage ?? 0) + (b.bossDamage ?? 0)
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

//  The file of the icon of a talent in assets (the names of PROMPTS_ASSETS_UI.md)
const ICON_NAMES = {
    MINIBOSS_TIME: 'miniboss-time',
    BOSS_TIME: 'boss-time',
    PHYSICAL_BREAK: 'break-physical',
    CRIT_RESIST_BREAK: 'break-crit',
    CLICK_DAMAGE: 'click-damage',
    CRIT_CHANCE: 'crit-chance',
    CRIT_DAMAGE: 'crit-damage',
    COMBO: 'combo',
    CLICK_FLAT_DAMAGE: 'click-flat-damage'
};

//  Grade 1 keeps the plain file; grades 2 and 3 have their own file with the suffix `-g2` / `-g3`
export const talentIconName = (talentId, grade = 1) =>
    `talent-${ICON_NAMES[talentId] ?? talentId.toLowerCase()}${grade > 1 ? `-g${grade}` : ''}`;
