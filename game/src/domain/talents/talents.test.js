import { describe, expect, it } from 'vitest';
import { CHAPTER_BOSS, FARM, MINIBOSS, PHASE } from '../campaign/campaign';
import { addBonuses, BRANCH_TITLES, describeTalentEffect, monsterAfterBreak, talentAttackerBonus, talentIconName, talentTimeBonusMs, talentValue } from './talents';

//  The tree as the backend answers it: value is level x perLevel
const tree = (levels = {}) => [
    [ 'MINIBOSS_TIME', 2 ], [ 'BOSS_TIME', 3 ], [ 'PHYSICAL_BREAK', 1 ], [ 'MAGICAL_BREAK', 1 ], [ 'CRIT_RESIST_BREAK', 1 ],
    [ 'CLICK_DAMAGE', 3 ], [ 'CRIT_CHANCE', 1 ], [ 'CRIT_DAMAGE', 5 ]
].map(([ id, perLevel ]) => ({ id, perLevel, level: levels[id] ?? 0, value: (levels[id] ?? 0) * perLevel }));

const monster = (physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element: 'FIRE', physicalDefense, magicalDefense, critResistance });

describe('talentValue', () => {
    it('reads the value the backend sent', () => {
        expect(talentValue(tree({ CLICK_DAMAGE: 5 }), 'CLICK_DAMAGE')).toBe(15);
    });

    it('is 0 for a talent at level 0, a talent that is not in the list and a list that has not loaded', () => {
        expect(talentValue(tree(), 'CLICK_DAMAGE')).toBe(0);
        expect(talentValue([], 'CLICK_DAMAGE')).toBe(0);
        expect(talentValue(null, 'CLICK_DAMAGE')).toBe(0);
        expect(talentValue(undefined, 'CLICK_DAMAGE')).toBe(0);
    });
});

describe('talentAttackerBonus', () => {
    it('gives CLICK_DAMAGE 5, CRIT_CHANCE 4 and CRIT_DAMAGE 6 as +15 %, +4 points and +30 %', () => {
        expect(talentAttackerBonus(tree({ CLICK_DAMAGE: 5, CRIT_CHANCE: 4, CRIT_DAMAGE: 6 }))).toEqual({ clickDamagePct: 15, critChance: 4, critDamagePct: 30 });
    });

    it('gives nothing without talents', () => {
        expect(talentAttackerBonus(null)).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
    });

    it('does not read the time or break talents', () => {
        expect(talentAttackerBonus(tree({ BOSS_TIME: 9, PHYSICAL_BREAK: 9 }))).toEqual({ clickDamagePct: 0, critChance: 0, critDamagePct: 0 });
    });
});

describe('addBonuses', () => {
    it('adds the three numbers', () => {
        expect(addBonuses({ clickDamagePct: 10, critChance: 1, critDamagePct: 2 }, { clickDamagePct: 5, critChance: 4, critDamagePct: 6 }))
            .toEqual({ clickDamagePct: 15, critChance: 5, critDamagePct: 8 });
    });
});

describe('monsterAfterBreak', () => {
    it('lowers the physical defense by 3 points with PHYSICAL_BREAK 3 and leaves the rest', () => {
        expect(monsterAfterBreak(monster(10, 10, 10), tree({ PHYSICAL_BREAK: 3 }))).toEqual(monster(7, 10, 10));
    });

    it('lowers the magical defense by 3 points with MAGICAL_BREAK 3 and leaves the rest', () => {
        expect(monsterAfterBreak(monster(10, 10, 10), tree({ MAGICAL_BREAK: 3 }))).toEqual(monster(10, 7, 10));
    });

    it('lowers the critical resistance by 8 points with CRIT_RESIST_BREAK 8', () => {
        expect(monsterAfterBreak(monster(10, 10, 20), tree({ CRIT_RESIST_BREAK: 8 }))).toEqual(monster(10, 10, 12));
    });

    it('never goes below 0', () => {
        expect(monsterAfterBreak(monster(2, 1, 0), tree({ PHYSICAL_BREAK: 5, MAGICAL_BREAK: 5, CRIT_RESIST_BREAK: 5 }))).toEqual(monster(0, 0, 0));
    });

    it('keeps the element and changes nothing without talents', () => {
        expect(monsterAfterBreak({ ...monster(10, 10, 10), element: 'WATER' }, null)).toEqual({ ...monster(10, 10, 10), element: 'WATER' });
    });

    it('does not change the stats it was given', () => {
        const stats = monster(10, 10, 10);

        monsterAfterBreak(stats, tree({ PHYSICAL_BREAK: 3 }));

        expect(stats).toEqual(monster(10, 10, 10));
    });
});

describe('talentTimeBonusMs', () => {
    it('adds 10 s to a miniboss with MINIBOSS_TIME 5', () => {
        expect(talentTimeBonusMs(tree({ MINIBOSS_TIME: 5 }), { kind: MINIBOSS })).toBe(10_000);
    });

    it('adds 12 s to the chapter boss with BOSS_TIME 4', () => {
        expect(talentTimeBonusMs(tree({ BOSS_TIME: 4 }), { kind: CHAPTER_BOSS })).toBe(12_000);
    });

    it('does not add the seconds of one to the other', () => {
        const talents = tree({ MINIBOSS_TIME: 5, BOSS_TIME: 4 });

        expect(talentTimeBonusMs(talents, { kind: MINIBOSS })).toBe(10_000);
        expect(talentTimeBonusMs(talents, { kind: CHAPTER_BOSS })).toBe(12_000);
        expect(talentTimeBonusMs(tree({ BOSS_TIME: 4 }), { kind: MINIBOSS })).toBe(0);
        expect(talentTimeBonusMs(tree({ MINIBOSS_TIME: 5 }), { kind: CHAPTER_BOSS })).toBe(0);
    });

    it('gives a farm fight the bonus of the boss it replays', () => {
        const talents = tree({ MINIBOSS_TIME: 5, BOSS_TIME: 4 });

        expect(talentTimeBonusMs(talents, { kind: FARM, boss: { kind: MINIBOSS, stage: 3 } })).toBe(10_000);
        expect(talentTimeBonusMs(talents, { kind: FARM, boss: { kind: CHAPTER_BOSS } })).toBe(12_000);
    });

    it('gives a phase monster and a list that has not loaded nothing', () => {
        expect(talentTimeBonusMs(tree({ MINIBOSS_TIME: 5, BOSS_TIME: 4 }), { kind: PHASE })).toBe(0);
        expect(talentTimeBonusMs(null, { kind: MINIBOSS })).toBe(0);
    });
});

describe('describeTalentEffect', () => {
    it('reads seconds as +6 s, percent as +9% and points as +3 pontos', () => {
        expect(describeTalentEffect({ branch: 'TIME', unit: 's', value: 6 })).toBe('+6 s');
        expect(describeTalentEffect({ branch: 'POWER', unit: '%', value: 9 })).toBe('+9%');
        expect(describeTalentEffect({ branch: 'POWER', unit: 'points', value: 3 })).toBe('+3 pontos');
    });

    it('reads the points of a break talent as a reduction: -3 pontos', () => {
        expect(describeTalentEffect({ branch: 'BREAK', unit: 'points', value: 3 })).toBe('-3 pontos');
    });

    it('reads nenhum at level 0 whatever the unit', () => {
        expect(describeTalentEffect({ branch: 'TIME', unit: 's', value: 0 })).toBe('nenhum');
        expect(describeTalentEffect({ branch: 'BREAK', unit: 'points', value: 0 })).toBe('nenhum');
        expect(describeTalentEffect({ branch: 'POWER', unit: '%', value: 0 })).toBe('nenhum');
    });

    it('reads the maximum of Dano de clique as +30%', () => {
        expect(describeTalentEffect({ branch: 'POWER', unit: '%', value: 30 })).toBe('+30%');
    });
});

describe('talentIconName and the branch titles', () => {
    it('names the 8 icons as the asset prompts do', () => {
        expect([ 'MINIBOSS_TIME', 'BOSS_TIME', 'PHYSICAL_BREAK', 'MAGICAL_BREAK', 'CRIT_RESIST_BREAK', 'CLICK_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].map(talentIconName)).toEqual([
            'talent-miniboss-time', 'talent-boss-time', 'talent-break-physical', 'talent-break-magical', 'talent-break-crit', 'talent-click-damage', 'talent-crit-chance', 'talent-crit-damage'
        ]);
    });

    it('titles the three branches Tempo, Quebra de defesa and Poder do clique', () => {
        expect(BRANCH_TITLES).toEqual({ TIME: 'Tempo', BREAK: 'Quebra de defesa', POWER: 'Poder do clique' });
    });
});
