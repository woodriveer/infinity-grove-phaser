import { describe, expect, it } from 'vitest';
import { PLAYER } from '../combat/damage';
import {
    applyEquipmentDrop, attackerFor, bossTimeBonusMs, describeAffix, describeClickDamage, dropLabel, formatCopper, pieceTitle, walletCopper, wornBy
} from './equipment';

const piece = (extra = {}) => ({
    id: 'p1', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [], sellPrice: 100, heroId: null, ...extra
});
const affix = (type, value) => ({ type, value });
const weapon = (clickDamage, affixes = [], extra = {}) => piece({ id: 'w', slot: 'WEAPON', clickDamage, affixes, ...extra });

describe('wornBy', () => {
    it('keeps only the pieces worn by the hero', () => {
        const pieces = [ piece({ id: 'a', heroId: 'kael' }), piece({ id: 'b', heroId: 'lyra' }), piece({ id: 'c' }) ];

        expect(wornBy(pieces, 'kael').map(({ id }) => id)).toEqual([ 'a' ]);
        expect(wornBy(pieces, 'vex')).toEqual([]);
    });
});

describe('attackerFor', () => {
    it('is the base attacker itself when the hero wears nothing', () => {
        expect(attackerFor(PLAYER, [])).toBe(PLAYER);
    });

    it('adds the three numbers of a bonus to the ones of the pieces, and still caps the critical chance at 100', () => {
        const ring = piece({ affixes: [ affix('CLICK_DAMAGE_PCT', 10), affix('CRIT_CHANCE', 80), affix('CRIT_DAMAGE_PCT', 30) ] });
        const attacker = attackerFor(PLAYER, [ ring ], { clickDamagePct: 20, critChance: 30, critDamagePct: 20 });

        expect(attacker.baseDamage).toBeCloseTo(1.3, 10);
        expect(attacker.critChance).toBe(100);
        expect(attacker.critMultiplier).toBeCloseTo(2.5, 10);
    });

    it('applies a bonus even when the hero wears nothing', () => {
        const attacker = attackerFor(PLAYER, [], { clickDamagePct: 10 });

        expect(attacker.baseDamage).toBeCloseTo(1.1, 10);
        expect(attacker.armorPierce).toBe(0);
    });

    it('adds the weapon click damage to the base damage: a +0 weapon of 3 hits for 4', () => {
        expect(attackerFor(PLAYER, [ weapon(3) ]).baseDamage).toBe(4);
    });

    it('multiplies the damage by the click damage percent of the other pieces: a ring of 10 % makes 4.4', () => {
        const ring = piece({ affixes: [ affix('CLICK_DAMAGE_PCT', 10) ] });

        expect(attackerFor(PLAYER, [ weapon(3), ring ]).baseDamage).toBeCloseTo(4.4, 10);
    });

    it('sums the click damage percent of every piece', () => {
        const pieces = [ piece({ id: 'a', affixes: [ affix('CLICK_DAMAGE_PCT', 10) ] }), piece({ id: 'b', slot: 'ARMOR', affixes: [ affix('CLICK_DAMAGE_PCT', 5) ] }) ];

        expect(attackerFor(PLAYER, pieces).baseDamage).toBeCloseTo(1.15, 10);
    });

    it('uses the refined click damage the server sent', () => {
        expect(attackerFor(PLAYER, [ weapon(3.3) ]).baseDamage).toBeCloseTo(4.3, 10);
    });

    it('adds the crit chance points to the 10 % base and caps it at 100', () => {
        expect(attackerFor(PLAYER, [ piece({ affixes: [ affix('CRIT_CHANCE', 4) ] }) ]).critChance).toBe(14);
        expect(attackerFor(PLAYER, [ piece({ affixes: [ affix('CRIT_CHANCE', 95) ] }) ]).critChance).toBe(100);
    });

    it('adds the critical damage percent to the x2 multiplier', () => {
        expect(attackerFor(PLAYER, [ piece({ affixes: [ affix('CRIT_DAMAGE_PCT', 30) ] }) ]).critMultiplier).toBeCloseTo(2.3, 10);
    });

    it('carries the armor pierce and the boss damage', () => {
        const attacker = attackerFor(PLAYER, [ piece({ affixes: [ affix('ARMOR_PIERCE_PCT', 12), affix('BOSS_DAMAGE_PCT', 7) ] }) ]);

        expect(attacker.armorPierce).toBe(12);
        expect(attacker.bossDamage).toBe(7);
    });

    it('keeps the element and damage type of the base attacker', () => {
        const attacker = attackerFor({ ...PLAYER, element: 'WATER' }, [ weapon(3) ]);

        expect(attacker.element).toBe('WATER');
        expect(attacker.damageType).toBe('PHYSICAL');
    });

    it('does not change the base attacker', () => {
        attackerFor(PLAYER, [ weapon(3) ]);

        expect(PLAYER.baseDamage).toBe(1);
    });
});

describe('bossTimeBonusMs', () => {
    it('is a thousand milliseconds per second of extra boss time', () => {
        const pieces = [ piece({ affixes: [ affix('BOSS_TIME_SECONDS', 2) ] }), piece({ id: 'b', affixes: [ affix('BOSS_TIME_SECONDS', 1) ] }) ];

        expect(bossTimeBonusMs(pieces)).toBe(3000);
    });

    it('is 0 without the affix or without pieces', () => {
        expect(bossTimeBonusMs([ piece({ affixes: [ affix('CRIT_CHANCE', 2) ] }) ])).toBe(0);
        expect(bossTimeBonusMs([])).toBe(0);
    });
});

describe('labels', () => {
    it('names every affix in Portuguese with its unit', () => {
        expect(describeAffix(affix('CLICK_DAMAGE_PCT', 12))).toBe('Dano de clique +12%');
        expect(describeAffix(affix('CRIT_CHANCE', 3))).toBe('Chance de crítico +3%');
        expect(describeAffix(affix('CRIT_DAMAGE_PCT', 20))).toBe('Dano crítico +20%');
        expect(describeAffix(affix('BOSS_DAMAGE_PCT', 9))).toBe('Dano em chefes +9%');
        expect(describeAffix(affix('BOSS_TIME_SECONDS', 2))).toBe('Tempo extra de chefe +2s');
        expect(describeAffix(affix('ARMOR_PIERCE_PCT', 8))).toBe('Perfuração de armadura +8%');
    });

    it('shows the weapon click damage with one decimal', () => {
        expect(describeClickDamage(weapon(3.3))).toBe('Dano de clique: 3.3');
        expect(describeClickDamage(weapon(6))).toBe('Dano de clique: 6.0');
    });

    it('names rarity and slot for the drop notice', () => {
        expect(dropLabel(piece({ rarity: 'RARE', slot: 'WEAPON' }))).toBe('Raro Arma');
        expect(dropLabel(piece({ rarity: 'COMMON', slot: 'ARMOR' }))).toBe('Comum Armadura');
        expect(dropLabel(piece({ rarity: 'UNCOMMON', slot: 'RING' }))).toBe('Incomum Anel');
        expect(dropLabel(piece({ rarity: 'EPIC', slot: 'AMULET' }))).toBe('Épico Amuleto');
        expect(dropLabel(piece({ rarity: 'LEGENDARY', slot: 'WEAPON' }))).toBe('Lendário Arma');
    });
});

describe('copper', () => {
    it('adds a wallet up to copper', () => {
        expect(walletCopper({ gold: 1, silver: 2, copper: 3 })).toBe(10203);
        expect(walletCopper({ gold: 0, silver: 0, copper: 0 })).toBe(0);
    });

    it('writes an amount in gold, silver and copper and leaves the zero parts out', () => {
        expect(formatCopper(10203)).toBe('1 ouro 2 prata 3 cobre');
        expect(formatCopper(850)).toBe('8 prata 50 cobre');
        expect(formatCopper(500)).toBe('5 prata');
        expect(formatCopper(5)).toBe('5 cobre');
        expect(formatCopper(0)).toBe('0 cobre');
        expect(formatCopper(20000)).toBe('2 ouro');
    });
});

describe('applyEquipmentDrop', () => {
    it('adds the dropped piece to the end without changing the list it got', () => {
        const pieces = [ piece({ id: 'a' }) ];
        const result = applyEquipmentDrop(pieces, { piece: piece({ id: 'b' }), sold: false });

        expect(result.map(({ id }) => id)).toEqual([ 'a', 'b' ]);
        expect(pieces).toHaveLength(1);
    });

    it('adds nothing for a piece that was sold because the bag was full', () => {
        expect(applyEquipmentDrop([ piece({ id: 'a' }) ], { piece: piece({ id: 'b' }), sold: true }).map(({ id }) => id)).toEqual([ 'a' ]);
    });
});

describe('pieceTitle', () => {
    it('reads the rarity, the slot and the refine: Raro Arma +3', () => {
        expect(pieceTitle(piece({ slot: 'WEAPON', rarity: 'RARE', refine: 3 }))).toBe('Raro Arma +3');
    });

    it('reads +0 at refine 0 and names every rarity and slot', () => {
        expect(pieceTitle(piece({ slot: 'RING', rarity: 'COMMON', refine: 0 }))).toBe('Comum Anel +0');
        expect(pieceTitle(piece({ slot: 'AMULET', rarity: 'LEGENDARY', refine: 10 }))).toBe('Lendário Amuleto +10');
        expect(pieceTitle(piece({ slot: 'ARMOR', rarity: 'EPIC', refine: 1 }))).toBe('Épico Armadura +1');
        expect(pieceTitle(piece({ slot: 'ARMOR', rarity: 'UNCOMMON', refine: 2 }))).toBe('Incomum Armadura +2');
    });
});
