import { describe, expect, it } from 'vitest';
import { levelFactor, MAX_SKILL_LEVEL, raisedSkillSlot, skillLevelOf, skillLevelText } from './skillLevel';

describe('levelFactor', () => {
    it('is 1, 1.25 and 1.5 for levels 1 to 3, and 1 below 1', () => {
        expect(levelFactor(1)).toBe(1);
        expect(levelFactor(2)).toBe(1.25);
        expect(levelFactor(3)).toBe(1.5);
        expect(levelFactor(0)).toBe(1);
        expect(MAX_SKILL_LEVEL).toBe(3);
    });
});

describe('skillLevelOf', () => {
    it('is 0 for a locked skill even with a level', () => {
        expect(skillLevelOf({ unlocked: false, level: 3 })).toBe(0);
        expect(skillLevelOf(null)).toBe(0);
        expect(skillLevelOf(undefined)).toBe(0);
    });

    it('reads the level of an unlocked skill', () => {
        expect(skillLevelOf({ unlocked: true, level: 2 })).toBe(2);
        expect(skillLevelOf({ unlocked: true, level: 3 })).toBe(3);
    });

    it('is 1 for an unlocked skill without a valid level', () => {
        expect(skillLevelOf({ unlocked: true })).toBe(1);
        expect(skillLevelOf({ unlocked: true, level: 0 })).toBe(1);
        expect(skillLevelOf({ unlocked: true, level: '2' })).toBe(1);
        expect(skillLevelOf({ unlocked: true, level: 1.5 })).toBe(1);
    });
});

describe('raisedSkillSlot', () => {
    it('names the slot each star from 4 to 9 raised, and 0 for 0 to 3 stars', () => {
        expect([ 4, 5, 6, 7, 8, 9 ].map(raisedSkillSlot)).toEqual([ 1, 2, 3, 1, 2, 3 ]);
        expect([ 0, 1, 2, 3 ].map(raisedSkillSlot)).toEqual([ 0, 0, 0, 0 ]);
    });
});

describe('skillLevelText', () => {
    it('reads the spec texts', () => {
        expect(skillLevelText(0)).toBe('');
        expect(skillLevelText(1)).toBe('Nível 1');
        expect(skillLevelText(2)).toBe('Nível 2 · +25% de poder');
        expect(skillLevelText(3)).toBe('Nível 3 · +50% de poder');
    });
});
