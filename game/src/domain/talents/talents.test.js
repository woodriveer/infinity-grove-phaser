import { describe, expect, it } from 'vitest';
import { CHAPTER_BOSS, FARM, MINIBOSS, PHASE } from '../campaign/campaign';
import {
    addBonuses, BRANCH_TITLES, BRANCHES, branchGlow, describeTalentEffect, monsterAfterBreak, talentAttackerBonus, talentComboCap, talentComboStep, talentFullName, talentIconName,
    TALENT_DESCRIPTIONS, talentDescription, talentLockText, talentTimeBonusMs, talentValue
} from './talents';

//  The tree as the backend answers it: value is level x perLevel
const tree = (levels = {}) => [
    [ 'MINIBOSS_TIME', 2 ], [ 'BOSS_DAMAGE', 2 ], [ 'PHYSICAL_BREAK', 1 ], [ 'ARMOR_PIERCE', 1 ],
    [ 'CLICK_DAMAGE', 5 ], [ 'CRIT_CHANCE', 1 ], [ 'CRIT_DAMAGE', 5 ], [ 'COMBO', 5 ], [ 'CLICK_FLAT_DAMAGE', 2 ]
].map(([ id, perLevel ]) => {
    const level = levels[id] ?? 0;

    return { id, perLevel, level, value: level === 0 ? 0 : perLevel * level - (id === 'CLICK_FLAT_DAMAGE' ? 1 : 0) };
});

const monster = (defense = 0, critResistance = 0) => ({ element: 'FIRE', defense, critResistance });

describe('talentValue', () => {
    it('reads the value the backend sent', () => {
        expect(talentValue(tree({ CLICK_DAMAGE: 5 }), 'CLICK_DAMAGE')).toBe(25);
    });

    it('adds the values of every grade of the talent', () => {
        const grades = [
            { id: 'CLICK_FLAT_DAMAGE', baseId: 'CLICK_FLAT_DAMAGE', grade: 1, value: 19 },
            { id: 'CLICK_FLAT_DAMAGE_G2', baseId: 'CLICK_FLAT_DAMAGE', grade: 2, value: 6 },
            { id: 'CLICK_DAMAGE', baseId: 'CLICK_DAMAGE', grade: 1, value: 50 }
        ];

        expect(talentValue(grades, 'CLICK_FLAT_DAMAGE')).toBe(25);
        expect(talentAttackerBonus(grades)).toMatchObject({ clickDamageFlat: 25, clickDamagePct: 50 });
    });

    it('is 0 for a talent at level 0, a talent that is not in the list and a list that has not loaded', () => {
        expect(talentValue(tree(), 'CLICK_DAMAGE')).toBe(0);
        expect(talentValue([], 'CLICK_DAMAGE')).toBe(0);
        expect(talentValue(null, 'CLICK_DAMAGE')).toBe(0);
        expect(talentValue(undefined, 'CLICK_DAMAGE')).toBe(0);
    });
});

describe('talentComboCap', () => {
    it('is 5 per level of COMBO: 20 at level 4, 50 at level 10', () => {
        expect(talentComboCap(tree({ COMBO: 4 }))).toBe(20);
        expect(talentComboCap(tree({ COMBO: 10 }))).toBe(50);
    });

    it('is 0 at level 0 and before the talents load', () => {
        expect(talentComboCap(tree())).toBe(0);
        expect(talentComboCap([])).toBe(0);
        expect(talentComboCap(undefined)).toBe(0);
    });
});

describe('talentAttackerBonus', () => {
    it('gives CLICK_DAMAGE 5, CRIT_CHANCE 4 and CRIT_DAMAGE 6 as +25 %, +4 points and +30 %', () => {
        expect(talentAttackerBonus(tree({ CLICK_DAMAGE: 5, CRIT_CHANCE: 4, CRIT_DAMAGE: 6 })))
            .toEqual({ clickDamageFlat: 0, clickDamagePct: 25, critChance: 4, critDamagePct: 30, armorPierce: 0, bossDamage: 0 });
    });

    it('gives ARMOR_PIERCE 10 and BOSS_DAMAGE 10 as 10 points of armor pierce and 20 % boss damage', () => {
        const bonus = talentAttackerBonus(tree({ ARMOR_PIERCE: 10, BOSS_DAMAGE: 10 }));

        expect(bonus.armorPierce).toBe(10);
        expect(bonus.bossDamage).toBe(20);
    });

    it('adds the grades of the boss damage: BOSS_DAMAGE 10 and BOSS_DAMAGE_G2 value 20 read 40', () => {
        const grades = [
            { id: 'BOSS_DAMAGE', baseId: 'BOSS_DAMAGE', value: 20 },
            { id: 'BOSS_DAMAGE_G2', baseId: 'BOSS_DAMAGE', value: 20 }
        ];

        expect(talentAttackerBonus(grades).bossDamage).toBe(40);
    });

    it('gives CLICK_FLAT_DAMAGE 3 as +5 flat damage', () => {
        expect(talentAttackerBonus(tree({ CLICK_FLAT_DAMAGE: 3 })).clickDamageFlat).toBe(5);
    });

    it('gives nothing without talents', () => {
        expect(talentAttackerBonus(null)).toEqual({ clickDamageFlat: 0, clickDamagePct: 0, critChance: 0, critDamagePct: 0, armorPierce: 0, bossDamage: 0 });
    });

    it('does not read MINIBOSS_TIME and PHYSICAL_BREAK', () => {
        expect(talentAttackerBonus(tree({ MINIBOSS_TIME: 9, PHYSICAL_BREAK: 9 })))
            .toEqual({ clickDamageFlat: 0, clickDamagePct: 0, critChance: 0, critDamagePct: 0, armorPierce: 0, bossDamage: 0 });
    });
});

describe('talentComboStep', () => {
    it('is 1 without Fúria crescente and before the talents load', () => {
        expect(talentComboStep([])).toBe(1);
        expect(talentComboStep(null)).toBe(1);
    });

    it('is 1 plus the value of Fúria crescente: 2 at level 1, 5 at level 4', () => {
        expect(talentComboStep([ { id: 'COMBO_FURY', baseId: 'COMBO_FURY', value: 1 } ])).toBe(2);
        expect(talentComboStep([ { id: 'COMBO_FURY', baseId: 'COMBO_FURY', value: 4 } ])).toBe(5);
    });
});

describe('addBonuses', () => {
    it('adds the three numbers', () => {
        expect(addBonuses({ clickDamagePct: 10, critChance: 1, critDamagePct: 2 }, { clickDamageFlat: 3, clickDamagePct: 5, critChance: 4, critDamagePct: 6 }))
            .toEqual({ clickDamageFlat: 3, clickDamagePct: 15, critChance: 5, critDamagePct: 8, armorPierce: 0, bossDamage: 0 });
    });

    it('adds armor pierce and boss damage, reading a missing one as 0', () => {
        const zero = { clickDamageFlat: 0, clickDamagePct: 0, critChance: 0, critDamagePct: 0 };
        const sum = addBonuses({ ...zero, armorPierce: 3 }, { ...zero, bossDamage: 4 });

        expect(sum.armorPierce).toBe(3);
        expect(sum.bossDamage).toBe(4);
    });
});

describe('monsterAfterBreak', () => {
    it('lowers the defense by 3 points with PHYSICAL_BREAK 3 and leaves the rest', () => {
        expect(monsterAfterBreak(monster(10, 10), tree({ PHYSICAL_BREAK: 3 }))).toEqual(monster(7, 10));
    });

    it('ignores a MAGICAL_BREAK entry of an older talent list', () => {
        expect(monsterAfterBreak(monster(10, 10), [ { id: 'MAGICAL_BREAK', value: 3 } ])).toEqual(monster(10, 10));
    });

    it('ignores a CRIT_RESIST_BREAK entry of an older list: critical resistance 20 stays 20', () => {
        const older = [ { id: 'CRIT_RESIST_BREAK', baseId: 'CRIT_RESIST_BREAK', value: 8 } ];

        expect(monsterAfterBreak(monster(10, 20), older)).toEqual(monster(10, 20));
    });

    it('never goes below 0', () => {
        expect(monsterAfterBreak(monster(2, 0), tree({ PHYSICAL_BREAK: 5 }))).toEqual(monster(0, 0));
    });

    it('keeps the element and changes nothing without talents', () => {
        expect(monsterAfterBreak({ ...monster(10, 10), element: 'WATER' }, null)).toEqual({ ...monster(10, 10), element: 'WATER' });
    });

    it('does not change the stats it was given', () => {
        const stats = monster(10, 10);

        monsterAfterBreak(stats, tree({ PHYSICAL_BREAK: 3 }));

        expect(stats).toEqual(monster(10, 10));
    });

    it('reads physicalDefense of an old payload and writes defense', () => {
        expect(monsterAfterBreak({ element: 'FIRE', physicalDefense: 20, magicalDefense: 20, critResistance: 0 }, tree({ PHYSICAL_BREAK: 5 })))
            .toEqual({ element: 'FIRE', physicalDefense: 20, magicalDefense: 20, critResistance: 0, defense: 15 });
    });

    it('takes the defense to 0, not below, when the break is larger: defense 10 and PHYSICAL_BREAK 15', () => {
        expect(monsterAfterBreak(monster(10, 0), tree({ PHYSICAL_BREAK: 15 }))).toEqual(monster(0, 0));
    });

    it('adds the grades of the break: PHYSICAL_BREAK 10 and PHYSICAL_BREAK_G2 value 4 take defense 20 to 6', () => {
        const talents = [ { id: 'PHYSICAL_BREAK', value: 10 }, { id: 'PHYSICAL_BREAK_G2', baseId: 'PHYSICAL_BREAK', value: 4 } ];

        expect(monsterAfterBreak(monster(20, 0), talents)).toEqual(monster(6, 0));
    });
});

describe('talentTimeBonusMs', () => {
    it('adds 10 s to a miniboss with MINIBOSS_TIME 5', () => {
        expect(talentTimeBonusMs(tree({ MINIBOSS_TIME: 5 }), { kind: MINIBOSS })).toBe(10_000);
    });

    it('gives the chapter boss nothing, even with BOSS_TIME 4 of an older list', () => {
        const older = [ { id: 'BOSS_TIME', baseId: 'BOSS_TIME', value: 12 } ];

        expect(talentTimeBonusMs(older, { kind: CHAPTER_BOSS })).toBe(0);
    });

    it('does not add the seconds of one to the other', () => {
        const talents = tree({ MINIBOSS_TIME: 5, BOSS_DAMAGE: 4 });

        expect(talentTimeBonusMs(talents, { kind: MINIBOSS })).toBe(10_000);
        expect(talentTimeBonusMs(talents, { kind: CHAPTER_BOSS })).toBe(0);
        expect(talentTimeBonusMs(tree({ BOSS_DAMAGE: 4 }), { kind: MINIBOSS })).toBe(0);
        expect(talentTimeBonusMs(tree({ MINIBOSS_TIME: 5 }), { kind: CHAPTER_BOSS })).toBe(0);
    });

    it('gives a farm fight the bonus of the boss it replays', () => {
        const talents = tree({ MINIBOSS_TIME: 5, BOSS_DAMAGE: 4 });

        expect(talentTimeBonusMs(talents, { kind: FARM, boss: { kind: MINIBOSS, stage: 3 } })).toBe(10_000);
        expect(talentTimeBonusMs(talents, { kind: FARM, boss: { kind: CHAPTER_BOSS } })).toBe(0);
    });

    it('gives a phase monster and a list that has not loaded nothing', () => {
        expect(talentTimeBonusMs(tree({ MINIBOSS_TIME: 5, BOSS_DAMAGE: 4 }), { kind: PHASE })).toBe(0);
        expect(talentTimeBonusMs(null, { kind: MINIBOSS })).toBe(0);
    });
});

describe('describeTalentEffect', () => {
    it('reads seconds as +6 s, percent as +9% and points as +3 pontos', () => {
        expect(describeTalentEffect({ branch: 'TIME', unit: 's', value: 6 })).toBe('+6 s');
        expect(describeTalentEffect({ branch: 'POWER', unit: '%', value: 9 })).toBe('+9%');
        expect(describeTalentEffect({ branch: 'POWER', unit: 'points', value: 3 })).toBe('+3 pontos');
        expect(describeTalentEffect({ branch: 'POWER', unit: 'dmg', value: 5 })).toBe('+5 de dano');
    });

    it('reads the points of a break talent as a reduction: -3 pontos', () => {
        expect(describeTalentEffect({ branch: 'BREAK', unit: 'points', value: 3 })).toBe('-3 pontos');
    });

    it('reads nenhum at level 0 whatever the unit', () => {
        expect(describeTalentEffect({ branch: 'TIME', unit: 's', value: 0 })).toBe('nenhum');
        expect(describeTalentEffect({ branch: 'BREAK', unit: 'points', value: 0 })).toBe('nenhum');
        expect(describeTalentEffect({ branch: 'POWER', unit: '%', value: 0 })).toBe('nenhum');
    });

    it('reads the maximum of Dano de clique, 10 levels of 5 %, as +50%', () => {
        expect(describeTalentEffect({ branch: 'POWER', unit: '%', value: 50 })).toBe('+50%');
    });

    it('reads Fúria crescente as +2% por clique at level 1 and +5% por clique at level 4', () => {
        expect(describeTalentEffect({ branch: 'COMBO', unit: 'combo-step', value: 1 })).toBe('+2% por clique');
        expect(describeTalentEffect({ branch: 'COMBO', unit: 'combo-step', value: 4 })).toBe('+5% por clique');
        expect(describeTalentEffect({ branch: 'COMBO', unit: 'combo-step', value: 0 })).toBe('nenhum');
    });

    it('reads boss damage and armor pierce as percents: +20%', () => {
        expect(describeTalentEffect({ branch: 'TIME', unit: '%', value: 20 })).toBe('+20%');
        expect(describeTalentEffect({ branch: 'BREAK', unit: '%', value: 20 })).toBe('+20%');
    });
});

describe('talentIconName and the branch titles', () => {
    it('names the 7 icons as the asset prompts do', () => {
        expect([ 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].map((id) => talentIconName(id))).toEqual([
            'talent-miniboss-time', 'talent-boss-damage', 'talent-break-physical', 'talent-armor-pierce', 'talent-click-damage', 'talent-crit-chance', 'talent-crit-damage'
        ]);
    });

    it('names the icons of boss damage, armor pierce and Fúria crescente and suffixes grades 2 and 3', () => {
        expect([ talentIconName('BOSS_DAMAGE'), talentIconName('BOSS_DAMAGE', 2), talentIconName('ARMOR_PIERCE', 3), talentIconName('COMBO_FURY') ]).toEqual([
            'talent-boss-damage', 'talent-boss-damage-g2', 'talent-armor-pierce-g3', 'talent-combo-fury'
        ]);
    });

    it('names the icons of the combo and flat click damage talents and suffixes grades 2 and 3', () => {
        expect([ talentIconName('COMBO'), talentIconName('CLICK_FLAT_DAMAGE', 1), talentIconName('COMBO', 2), talentIconName('CLICK_FLAT_DAMAGE', 3) ]).toEqual([
            'talent-combo', 'talent-click-flat-damage', 'talent-combo-g2', 'talent-click-flat-damage-g3'
        ]);
    });

    it('titles the four branches Caça aos chefes, Quebra de defesa, Poder do clique and Combo', () => {
        expect(BRANCH_TITLES).toEqual({ TIME: 'Caça aos chefes', BREAK: 'Quebra de defesa', POWER: 'Poder do clique', COMBO: 'Combo' });
    });
});

describe('talentFullName', () => {
    it('adds the grade from grade 2', () => {
        expect(talentFullName({ label: 'Dano de clique (%)', grade: 1 })).toBe('Dano de clique (%)');
        expect(talentFullName({ label: 'Dano de clique (%)', grade: 2 })).toBe('Dano de clique (%) (Grau 2)');
        expect(talentFullName({ label: 'Dano de clique (%)' })).toBe('Dano de clique (%)');
    });
});

describe('talentLockText', () => {
    it('of a grade names the grade before', () => {
        expect(talentLockText({ grade: 2, requiredLevel: 10, maxLevel: 10 }, [])).toBe('Bloqueado: chegue ao nível 10 do Grau 1');
        expect(talentLockText({ grade: 3, maxLevel: 10 }, [])).toBe('Bloqueado: chegue ao nível 10 do Grau 2');
    });

    it('of Fúria crescente names Limite de dano do combo', () => {
        const fury = { id: 'COMBO_FURY', grade: 1, requiredId: 'COMBO', requiredLevel: 10, maxLevel: 4 };

        expect(talentLockText(fury, [ { id: 'COMBO', label: 'Limite de dano do combo' } ])).toBe('Bloqueado: chegue ao nível 10 de Limite de dano do combo');
        expect(talentLockText(fury, [])).toBe('Bloqueado: chegue ao nível 10 do talento anterior');
    });
});

describe('branchGlow', () => {
    const GRADED = [
        [ 'MINIBOSS_TIME', 'TIME' ], [ 'BOSS_DAMAGE', 'TIME' ], [ 'PHYSICAL_BREAK', 'BREAK' ], [ 'ARMOR_PIERCE', 'BREAK' ], [ 'CLICK_DAMAGE', 'POWER' ],
        [ 'CRIT_CHANCE', 'POWER' ], [ 'CRIT_DAMAGE', 'POWER' ], [ 'COMBO', 'COMBO' ], [ 'CLICK_FLAT_DAMAGE', 'POWER' ]
    ];
    //  The 28 talents of the backend contract with the levels given by id
    const full = (levels = {}) => [
        ...[ 1, 2, 3 ].flatMap((grade) => GRADED.map(([ baseId, branch ]) => {
            const id = grade === 1 ? baseId : `${baseId}_G${grade}`;

            return { id, baseId, grade, branch, level: levels[id] ?? 0, maxLevel: 10 };
        })),
        { id: 'COMBO_FURY', baseId: 'COMBO_FURY', grade: 1, branch: 'COMBO', level: levels.COMBO_FURY ?? 0, maxLevel: 4 }
    ];

    it('is 0 for a branch without a level', () => {
        expect(BRANCHES.map((branch) => branchGlow(full(), branch))).toEqual([ 0, 0, 0, 0 ]);
    });

    it('of TIME with only MINIBOSS_TIME 5 is 0.27', () => {
        expect(full().filter((talent) => talent.branch === 'TIME')).toHaveLength(6);
        expect(branchGlow(full({ MINIBOSS_TIME: 5 }), 'TIME')).toBe(0.27);
    });

    it('of COMBO with only COMBO 10 is 0.44, 0.47 without Fúria crescente', () => {
        const talents = full({ COMBO: 10 });

        expect(branchGlow(talents, 'COMBO')).toBe(0.44);
        expect(branchGlow(talents.filter((talent) => talent.id !== 'COMBO_FURY'), 'COMBO')).toBe(0.47);
    });

    it('of POWER is 0.21 with one level and 1 with its 12 talents at 10', () => {
        const power = full().filter((talent) => talent.branch === 'POWER');
        const maxed = Object.fromEntries(power.map((talent) => [ talent.id, 10 ]));

        expect(power).toHaveLength(12);
        expect(branchGlow(full({ CLICK_DAMAGE: 1 }), 'POWER')).toBe(0.21);
        expect(branchGlow(full(maxed), 'POWER')).toBe(1);
    });
});

describe('monsterAfterBreak with the team passives', () => {
    it('Orina\'s passive lowers the defense by 15 after the break talent: 40 with PHYSICAL_BREAK 5 reads 20', () => {
        expect(monsterAfterBreak(monster(40, 0), tree({ PHYSICAL_BREAK: 5 }), { defenseBreak: 15 })).toEqual(monster(20, 0));
    });

    it('Orina\'s passive on defense 10 reads 0', () => {
        expect(monsterAfterBreak(monster(10, 0), null, { defenseBreak: 15 })).toEqual(monster(0, 0));
    });

    it('Vex\'s passive lowers the critical resistance by 15: 30 reads 15', () => {
        expect(monsterAfterBreak(monster(10, 30), null, { critResistBreak: 15 })).toEqual(monster(10, 15));
    });

    it('Vex\'s passive on critical resistance 10 reads 0', () => {
        expect(monsterAfterBreak(monster(10, 10), null, { critResistBreak: 15 })).toEqual(monster(10, 0));
    });

    it('an old payload with physicalDefense 50 and Orina\'s passive reads defense 35', () => {
        expect(monsterAfterBreak({ element: 'FIRE', physicalDefense: 50, magicalDefense: 50, critResistance: 0 }, null, { defenseBreak: 15 }).defense)
            .toBe(35);
    });

    it('no passives argument keeps the result of before', () => {
        const stats = monster(40, 30);

        expect(monsterAfterBreak(stats, tree({ PHYSICAL_BREAK: 5 }))).toEqual(monsterAfterBreak(stats, tree({ PHYSICAL_BREAK: 5 }), {}));
    });
});

describe('talentDescription', () => {
    it('describes each of the 10 talents in the player\'s words', () => {
        const texts = {
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
        };

        expect(Object.keys(texts)).toHaveLength(10);

        for (const [ id, text ] of Object.entries(texts))
        {
            expect(talentDescription({ id, baseId: id })).toBe(text);
        }
    });

    it('gives grades 2 and 3 the text of grade 1', () => {
        expect(talentDescription({ id: 'CLICK_DAMAGE_G3', baseId: 'CLICK_DAMAGE', grade: 3 }))
            .toBe('Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.');
        expect(talentDescription({ id: 'COMBO_G2', baseId: 'COMBO', grade: 2 }))
            .toBe('Cliques seguidos somam um bônus de dano; este talento aumenta o limite desse bônus.');
    });

    it('reads the id when the talent has no baseId', () => {
        expect(talentDescription({ id: 'COMBO_FURY' })).toBe('Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.');
    });

    it('answers null for a talent it does not know', () => {
        expect(talentDescription({ id: 'NEW_ONE', baseId: 'NEW_ONE' })).toBeNull();
    });

    it('writes no catalog number in any text', () => {
        expect(Object.keys(TALENT_DESCRIPTIONS)).toHaveLength(10);

        for (const text of Object.values(TALENT_DESCRIPTIONS))
        {
            expect(text.replace('100%', '')).not.toMatch(/\d/);
        }
    });
});
