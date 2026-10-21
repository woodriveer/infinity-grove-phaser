import { describe, expect, it } from 'vitest';
import { leaderStats } from './leaderStats';

const kael = (stars = 0) => ({ id: 'kael', element: 'FIRE', stars });
const lyra = (stars = 0) => ({ id: 'lyra', element: 'NATURE', stars });
const piece = (affixes, extra = {}) => ({ id: 'p', slot: 'RING', rarity: 'COMMON', refine: 0, sellPrice: 1, heroId: 'kael', affixes, ...extra });
const affix = (type, value) => ({ type, value });
const talents = (levels) => Object.entries(levels).map(([ id, value ]) => ({ id, value }));
const lines = (input) => Object.fromEntries(leaderStats(input).map(({ id, text }) => [ id, text ]));

describe('leaderStats', () => {
    it('gives the lines in the order of the spec', () => {
        expect(leaderStats({ leader: kael() }).map(({ id }) => id)).toEqual([
            'element', 'damageType', 'clickDamage', 'critChance', 'critDamage', 'armorPierce', 'bossDamage', 'minibossTime', 'bossTime',
            'breakPhysical', 'breakMagical', 'breakCrit'
        ]);
    });

    it('reads Kael with 0 stars, no equipment and no talents as the base attacker', () => {
        const kaelLines = lines({ leader: kael() });

        expect(kaelLines.element).toBe('Elemento: Fogo');
        expect(kaelLines.damageType).toBe('Tipo de dano: Físico');
        expect(kaelLines.clickDamage).toBe('Dano de clique: 1.0');
        expect(kaelLines.critChance).toBe('Chance de crítico: 10%');
        expect(kaelLines.critDamage).toBe('Dano crítico: x2');
        expect(kaelLines.armorPierce).toBe('Perfuração de armadura: 0%');
        expect(kaelLines.bossDamage).toBe('Dano em chefes: 0%');
        expect(kaelLines.minibossTime).toBe('Tempo extra de miniboss: 0s');
        expect(kaelLines.bossTime).toBe('Tempo extra de chefe: 0s');
    });

    it('reads Lyra with 3 stars as 1.4, 40% and x2.5, in her element', () => {
        const lyraLines = lines({ leader: lyra(3) });

        expect(lyraLines.element).toBe('Elemento: Natureza');
        expect(lyraLines.clickDamage).toBe('Dano de clique: 1.4');
        expect(lyraLines.critChance).toBe('Chance de crítico: 40%');
        expect(lyraLines.critDamage).toBe('Dano crítico: x2.5');
    });

    it('reads a weapon of 3.3 and a ring of +12 % click damage as 4.8', () => {
        const worn = [ piece([], { slot: 'WEAPON', clickDamage: 3.3 }), piece([ affix('CLICK_DAMAGE_PCT', 12) ]) ];

        expect(lines({ leader: kael(), pieces: worn }).clickDamage).toBe('Dano de clique: 4.8');
    });

    it('reads the critical, pierce and boss damage affixes of the pieces', () => {
        const worn = [ piece([ affix('CRIT_CHANCE', 7), affix('CRIT_DAMAGE_PCT', 25), affix('ARMOR_PIERCE_PCT', 12), affix('BOSS_DAMAGE_PCT', 9) ]) ];
        const result = lines({ leader: kael(), pieces: worn });

        expect(result.critChance).toBe('Chance de crítico: 17%');
        expect(result.critDamage).toBe('Dano crítico: x2.25');
        expect(result.armorPierce).toBe('Perfuração de armadura: 12%');
        expect(result.bossDamage).toBe('Dano em chefes: 9%');
    });

    it('caps the critical chance at 100%', () => {
        expect(lines({ leader: lyra(3), pieces: [ piece([ affix('CRIT_CHANCE', 80) ]) ] }).critChance).toBe('Chance de crítico: 100%');
    });

    it('adds the power talents to the numbers: CLICK_DAMAGE 20, CRIT_CHANCE 4 and CRIT_DAMAGE 30 read 1.2, 14% and x2.3', () => {
        const result = lines({ leader: kael(), talents: talents({ CLICK_DAMAGE: 20, CRIT_CHANCE: 4, CRIT_DAMAGE: 30 }) });

        expect(result.clickDamage).toBe('Dano de clique: 1.2');
        expect(result.critChance).toBe('Chance de crítico: 14%');
        expect(result.critDamage).toBe('Dano crítico: x2.3');
    });

    it('adds the time of the pieces to the time talents: 5 s of pieces and MINIBOSS_TIME 4 read 9s and 5s', () => {
        const result = lines({ leader: kael(), pieces: [ piece([ affix('BOSS_TIME_SECONDS', 5) ]) ], talents: talents({ MINIBOSS_TIME: 4 }) });

        expect(result.minibossTime).toBe('Tempo extra de miniboss: 9s');
        expect(result.bossTime).toBe('Tempo extra de chefe: 5s');
    });

    it('reads BOSS_TIME on the chapter boss line only', () => {
        const result = lines({ leader: kael(), talents: talents({ BOSS_TIME: 12 }) });

        expect(result.minibossTime).toBe('Tempo extra de miniboss: 0s');
        expect(result.bossTime).toBe('Tempo extra de chefe: 12s');
    });

    it('reads the three break talents', () => {
        const result = lines({ leader: kael(), talents: talents({ PHYSICAL_BREAK: 3, MAGICAL_BREAK: 4, CRIT_RESIST_BREAK: 8 }) });

        expect(result.breakPhysical).toBe('Quebra de defesa física: 3');
        expect(result.breakMagical).toBe('Quebra de defesa mágica: 4');
        expect(result.breakCrit).toBe('Quebra de resistência a crítico: 8');
    });

    it('reads 0 for every break without talents', () => {
        const result = lines({ leader: kael() });

        expect([ result.breakPhysical, result.breakMagical, result.breakCrit ]).toEqual([
            'Quebra de defesa física: 0', 'Quebra de defesa mágica: 0', 'Quebra de resistência a crítico: 0'
        ]);
    });

    it('does not read the pieces of another hero: only the pieces it is given count', () => {
        expect(lines({ leader: kael(), pieces: [] }).clickDamage).toBe('Dano de clique: 1.0');
    });
});
