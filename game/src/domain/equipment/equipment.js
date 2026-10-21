//  The rules the game applies to the equipment payload of the backend (GET /equipment). Pure JavaScript: no Phaser, so every rule is unit-tested.
//  A piece is { id, slot, rarity, refine, clickDamage?, affixes: [ { type, value } ], heroId?, refineCost?, rerollCost?, sellPrice }.
//  Every value is already refined by the server; the game only sums them.
export const MAX_REFINE = 10;
export const REROLL_MIN_REFINE = 5;

export const SLOT_LABELS = { WEAPON: 'Arma', ARMOR: 'Armadura', RING: 'Anel', AMULET: 'Amuleto' };
export const SLOTS = Object.keys(SLOT_LABELS);
export const RARITY_LABELS = { COMMON: 'Comum', UNCOMMON: 'Incomum', RARE: 'Raro', EPIC: 'Épico', LEGENDARY: 'Lendário' };

const AFFIXES = {
    CLICK_DAMAGE_PCT: { label: 'Dano de clique', unit: '%' },
    CRIT_CHANCE: { label: 'Chance de crítico', unit: '%' },
    CRIT_DAMAGE_PCT: { label: 'Dano crítico', unit: '%' },
    BOSS_DAMAGE_PCT: { label: 'Dano em chefes', unit: '%' },
    BOSS_TIME_SECONDS: { label: 'Tempo extra de chefe', unit: 's' },
    ARMOR_PIERCE_PCT: { label: 'Perfuração de armadura', unit: '%' }
};

//  "Dano de clique +12%"
export const describeAffix = ({ type, value }) => `${AFFIXES[type].label} +${value}${AFFIXES[type].unit}`;

//  "Dano de clique: 3.3" for a weapon (one decimal, trailing zero kept so a refine always shows)
export const describeClickDamage = (piece) => `Dano de clique: ${piece.clickDamage.toFixed(1)}`;

//  The text lines of a piece: the weapon click damage first, then one line per affix
export const pieceLines = (piece) => [
    ...(piece.clickDamage == null ? [] : [ describeClickDamage(piece) ]),
    ...piece.affixes.map(describeAffix)
];

//  "Raro Arma +3": the title of a piece on the screens
export const pieceTitle = (piece) => `${RARITY_LABELS[piece.rarity]} ${SLOT_LABELS[piece.slot]} +${piece.refine}`;

//  "Raro Arma", the text of the drop notice
export const dropLabel = (piece) => `${RARITY_LABELS[piece.rarity]} ${SLOT_LABELS[piece.slot]}`;

//  The pieces worn by a hero
export const wornBy = (pieces, heroId) => pieces.filter((piece) => piece.heroId === heroId);

const sumOf = (pieces, type) => pieces.reduce((total, piece) => total
    + piece.affixes.filter((affix) => affix.type === type).reduce((sum, affix) => sum + affix.value, 0), 0);

//  The attacker of a click for a hero wearing `pieces`, built on `base`: base damage (base + weapon click damage) times the click damage
//  percent, the critical chance (at most 100) and multiplier, the armor pierce and the boss damage. With no pieces and no bonus it is `base` itself.
//  `bonus` carries more sources of the same three numbers (the stars of the leader): clickDamagePct and critDamagePct add to the pieces'
//  percents, critChance adds points.
export const attackerFor = (base, pieces, { clickDamagePct = 0, critChance = 0, critDamagePct = 0 } = {}) =>
{
    if (pieces.length === 0 && !clickDamagePct && !critChance && !critDamagePct)
    {
        return base;
    }

    const weaponDamage = pieces.find((piece) => piece.slot === 'WEAPON')?.clickDamage ?? 0;

    return {
        ...base,
        baseDamage: (base.baseDamage + weaponDamage) * (1 + (sumOf(pieces, 'CLICK_DAMAGE_PCT') + clickDamagePct) / 100),
        critChance: Math.min(100, base.critChance + sumOf(pieces, 'CRIT_CHANCE') + critChance),
        critMultiplier: base.critMultiplier + (sumOf(pieces, 'CRIT_DAMAGE_PCT') + critDamagePct) / 100,
        armorPierce: sumOf(pieces, 'ARMOR_PIERCE_PCT'),
        bossDamage: sumOf(pieces, 'BOSS_DAMAGE_PCT')
    };
};

//  The milliseconds `pieces` add to the time limit of a boss
export const bossTimeBonusMs = (pieces) => sumOf(pieces, 'BOSS_TIME_SECONDS') * 1000;

const COPPER_PER_SILVER = 100;
const COPPER_PER_GOLD = 10000;

//  A wallet ({ gold, silver, copper }) as copper
export const walletCopper = ({ gold, silver, copper }) => gold * COPPER_PER_GOLD + silver * COPPER_PER_SILVER + copper;

//  "1 ouro 2 prata 5 cobre"; the parts that are zero are left out, and 0 is "0 cobre"
export const formatCopper = (total) =>
{
    const parts = [
        [ Math.floor(total / COPPER_PER_GOLD), 'ouro' ],
        [ Math.floor(total / COPPER_PER_SILVER) % 100, 'prata' ],
        [ total % COPPER_PER_SILVER, 'cobre' ]
    ].filter(([ amount ]) => amount > 0);

    return parts.length === 0 ? '0 cobre' : parts.map(([ amount, label ]) => `${amount} ${label}`).join(' ');
};

//  A dropped piece added to the list unless the bag was full and it was sold
export const applyEquipmentDrop = (pieces, { piece, sold }) => (sold ? pieces : [ ...pieces, piece ]);
