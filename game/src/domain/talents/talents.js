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

export const BRANCH_TITLES = { TIME: 'Caça aos chefes', BREAK: 'Quebra de defesa', POWER: 'Poder do clique', COMBO: 'Combo' };
export const BRANCHES = [ 'TIME', 'BREAK', 'POWER', 'COMBO' ];

//  What each talent does, in the player's words (spec talent-tree-branches P1 Card AC 1): one text per talent, the same for its three grades.
//  No catalog number here (AD-011): the effect line of the card shows the value.
export const TALENT_DESCRIPTIONS = Object.freeze({
    MINIBOSS_TIME: 'Você ganha mais segundos para derrotar cada miniboss antes que o tempo acabe.',
    BOSS_DAMAGE: 'Os golpes do seu líder causam mais dano em minibosses e chefes de capítulo.',
    PHYSICAL_BREAK: 'Diminui a defesa dos inimigos, então cada golpe tira mais vida deles.',
    ARMOR_PIERCE: 'Os golpes do seu líder ignoram uma parte da defesa que ainda resta no inimigo.',
    CLICK_DAMAGE: 'Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.',
    CLICK_FLAT_DAMAGE: 'Soma um valor fixo ao dano de cada clique do seu líder, antes dos bônus em porcentagem.',
    CRIT_CHANCE: 'Aumenta a chance de um golpe do seu líder ser crítico; o que passar de 100% contra o inimigo vira dano crítico.',
    CRIT_DAMAGE: 'Os golpes críticos do seu líder causam ainda mais dano.',
    COMBO: 'Cliques seguidos somam um bônus de dano; este talento aumenta o limite desse bônus.',
    COMBO_FURY: 'Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.'
});

//  The description of `talent` (by `baseId`, or `id` when there is none), or null when the game has none for it (a talent of a newer backend)
export const talentDescription = (talent) => TALENT_DESCRIPTIONS[talent.baseId ?? talent.id] ?? null;

//  "+6 s", "-3 pontos", "+9%", "+3 pontos"; "nenhum" at level 0. A BREAK talent lowers a stat, so its points read as a reduction.
export const describeTalentEffect = ({ branch, unit, value }) =>
{
    if (value === 0)
    {
        return 'nenhum';
    }

    //  Fúria crescente (spec talent-tree-rework): the combo adds 1 % a click plus its value
    if (unit === 'combo-step')
    {
        return `+${COMBO_STEP_PERCENT + value}% por clique`;
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
    BOSS_DAMAGE: 'boss-damage',
    PHYSICAL_BREAK: 'break-physical',
    ARMOR_PIERCE: 'armor-pierce',
    CLICK_DAMAGE: 'click-damage',
    CRIT_CHANCE: 'crit-chance',
    CRIT_DAMAGE: 'crit-damage',
    COMBO: 'combo',
    CLICK_FLAT_DAMAGE: 'click-flat-damage',
    COMBO_FURY: 'combo-fury'
};

//  Grade 1 keeps the plain file; grades 2 and 3 have their own file with the suffix `-g2` / `-g3`
export const talentIconName = (talentId, grade = 1) =>
    `talent-${ICON_NAMES[talentId] ?? talentId.toLowerCase()}${grade > 1 ? `-g${grade}` : ''}`;

//  "Dano de clique (%)" for grade 1 and a single talent, "Dano de clique (%) (Grau 2)" for grade 2
export const talentFullName = (talent) => ((talent.grade ?? 1) > 1 ? `${talent.label} (Grau ${talent.grade})` : talent.label);

//  Why a locked talent cannot be bought: a grade waits for the grade before, a single talent for its prerequisite (`talents` is the list)
export const talentLockText = (talent, talents) =>
{
    const level = talent.requiredLevel ?? talent.maxLevel;

    if ((talent.grade ?? 1) > 1)
    {
        return `Bloqueado: chegue ao nível ${level} do Grau ${talent.grade - 1}`;
    }

    const required = (talents ?? []).find((other) => other.id === talent.requiredId);

    return required ? `Bloqueado: chegue ao nível ${level} de ${required.label}` : `Bloqueado: chegue ao nível ${level} do talento anterior`;
};

//  The opacity of the lit veins of `branch` (spec talent-tree-rework D17): 0 without a level, else 0.2 + 0.8 x levels / max levels, two decimals
export const branchGlow = (talents, branch) =>
{
    const mine = (talents ?? []).filter((talent) => talent.branch === branch);
    const levels = mine.reduce((sum, talent) => sum + talent.level, 0);
    const max = mine.reduce((sum, talent) => sum + talent.maxLevel, 0);

    return levels === 0 || max === 0 ? 0 : Math.round((0.2 + 0.8 * levels / max) * 100) / 100;
};

//  "1 ponto", "5 pontos"
const pointsText = (n) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`;

//  The most levels the points buy at once (spec ui-polish UIP-09): none when the talent is locked or at its top level, else as many as the points pay
//  and the top level allows, each at the price of the next level. `targetLevel` is the level after the purchase.
export const maxPurchase = (talent, available) =>
{
    if (talent.unlocked === false || talent.nextCost == null)
    {
        return { levels: 0, cost: 0, targetLevel: talent.level };
    }

    const levels = Math.max(0, Math.min(talent.maxLevel - talent.level, Math.floor(available / talent.nextCost)));

    return { levels, cost: levels * talent.nextCost, targetLevel: talent.level + levels };
};

//  The text of the card button: T2 while Shift is held and a level is affordable, else T1 (spec ui-polish).
//  T1 = "Melhorar (<price of one level>)"; T2 = "Melhorar até o nível <target> (<total price>)"
export const upgradeButtonText = (talent, available, shiftHeld) =>
{
    const purchase = maxPurchase(talent, available);

    return shiftHeld && purchase.levels >= 1
        ? `Melhorar até o nível ${purchase.targetLevel} (${pointsText(purchase.cost)})`
        : `Melhorar (${pointsText(talent.nextCost)})`;
};
