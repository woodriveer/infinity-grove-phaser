//  The level of a hero skill (spec hero-ascension, Skill Levels). Pure JavaScript: no Phaser.
//  Level 0 is locked and 1 is the skill as in hero-skills. Each star from 4 to 9 raises one skill in slot order (4 slot 1, 5 slot 2,
//  6 slot 3, 7 slot 1, 8 slot 2, 9 slot 3), so the highest level is 3. The backend answers the level; every level above 1 adds 25 % to
//  the skill's damage percents and effect strength.
export const SKILL_LEVEL_STEP_PERCENT = 25;
export const MAX_SKILL_LEVEL = 3;

//  1, 1.25, 1.5 for levels 1 to 3; a level below 1 counts as 1
export const levelFactor = (level) => 1 + SKILL_LEVEL_STEP_PERCENT * (Math.max(1, level) - 1) / 100;

//  The level of a skill of the heroes payload: 0 when locked, its `level` when it is an integer of 1 or more, else 1 (the previous backend
//  sends no level)
export const skillLevelOf = (skill) =>
{
    if (!skill?.unlocked)
    {
        return 0;
    }

    return Number.isInteger(skill.level) && skill.level >= 1 ? skill.level : 1;
};

//  The slot whose level a star from 4 to 9 raised (1, 2, 3, 1, 2, 3); 0 for 0 to 3 stars
export const raisedSkillSlot = (stars) => (stars >= 4 ? ((stars - 4) % 3) + 1 : 0);

//  '' (locked), 'Nível 1', 'Nível 2 · +25% de poder', 'Nível 3 · +50% de poder'
export const skillLevelText = (level) =>
{
    if (level < 1)
    {
        return '';
    }

    return level === 1 ? 'Nível 1' : `Nível ${level} · +${SKILL_LEVEL_STEP_PERCENT * (level - 1)}% de poder`;
};
