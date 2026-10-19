import { describe, expect, it } from 'vitest';
import { CHAPTER_BOSS, Campaign, FARM, MINIBOSS, PHASE } from './campaign';
import { DEFAULT_STATS } from '../combat/monster';

//  3 stages; stage 2 has 3 phases so rules must use the current stage's phase count
//  Drop rule ids differ per stage and per kind so a rule taken from the wrong place shows
const definition = {
    bossHealth: 300,
    bossTimeLimitMs: 60000,
    bossDropRuleId: 30,
    stages: [
        { number: 1, phasesPerStage: 2, monsterHealth: 10, minibossHealth: 50, minibossTimeLimitMs: 30000, monsterDropRuleId: 11, minibossDropRuleId: 21 },
        { number: 2, phasesPerStage: 3, monsterHealth: 11, minibossHealth: 55, minibossTimeLimitMs: 31000, monsterDropRuleId: 12, minibossDropRuleId: 22 },
        { number: 3, phasesPerStage: 2, monsterHealth: 12, minibossHealth: 60, minibossTimeLimitMs: 32000, monsterDropRuleId: 13, minibossDropRuleId: 23 }
    ]
};

const at = (stage, encounter, phase = 1, completed = false) =>
    Campaign.fromProgress({ chapter: 1, stage, encounter, phase, completed, definition });

const state = (campaign) => ({ ...campaign.position(), completed: campaign.completed });

describe('Campaign transitions (same table as the backend)', () => {
    it('clearing a phase below the last moves to the next phase of the same stage', () => {
        expect(state(at(2, PHASE, 1).cleared())).toEqual(state(at(2, PHASE, 2)));
        expect(state(at(2, PHASE, 2).cleared())).toEqual(state(at(2, PHASE, 3)));
    });

    it('clearing the last phase moves to the miniboss of the same stage, using that stage\'s phase count', () => {
        expect(state(at(2, PHASE, 3).cleared())).toEqual(state(at(2, MINIBOSS)));
        expect(state(at(1, PHASE, 2).cleared())).toEqual(state(at(1, MINIBOSS)));
    });

    it('clearing a miniboss below the last stage moves to phase 1 of the next stage', () => {
        expect(state(at(1, MINIBOSS).cleared())).toEqual(state(at(2, PHASE, 1)));
        expect(state(at(2, MINIBOSS).cleared())).toEqual(state(at(3, PHASE, 1)));
    });

    it('clearing the miniboss of the last stage moves to the chapter boss', () => {
        expect(state(at(3, MINIBOSS).cleared())).toEqual(state(at(3, CHAPTER_BOSS)));
    });

    it('clearing the chapter boss completes the campaign and keeps the position', () => {
        const done = at(3, CHAPTER_BOSS).cleared();

        expect(done.completed).toBe(true);
        expect(done.position()).toEqual({ chapter: 1, stage: 3, encounter: CHAPTER_BOSS, phase: 1 });
    });

    it('failing a miniboss returns to the last phase of the same stage', () => {
        expect(state(at(2, MINIBOSS).failed())).toEqual(state(at(2, PHASE, 3)));
        expect(state(at(1, MINIBOSS).failed())).toEqual(state(at(1, PHASE, 2)));
    });

    it('failing the chapter boss returns to the last phase of the last stage', () => {
        expect(state(at(3, CHAPTER_BOSS).failed())).toEqual(state(at(3, PHASE, 2)));
    });

    it('does not change the campaign it was called on', () => {
        const start = at(1, PHASE, 1);

        start.cleared();

        expect(state(start)).toEqual(state(at(1, PHASE, 1)));
    });

    it('rejects failing a phase and clearing or failing a completed campaign', () => {
        expect(() => at(1, PHASE, 1).failed()).toThrow();
        expect(() => at(3, CHAPTER_BOSS, 1, true).cleared()).toThrow();
        expect(() => at(3, CHAPTER_BOSS, 1, true).failed()).toThrow();
    });

    it('takes 61 clears from the start of a 10 stage, 5 phase chapter to completion', () => {
        const stages = Array.from({ length: 10 }, (_, i) => (
            { number: i + 1, phasesPerStage: 5, monsterHealth: 10 + i, minibossHealth: 50 + 5 * i, minibossTimeLimitMs: 30000 }));
        let campaign = Campaign.fromProgress({
            chapter: 1, stage: 1, encounter: PHASE, phase: 1, completed: false, definition: { bossHealth: 300, bossTimeLimitMs: 60000, stages }
        });
        let clears = 0;

        while (!campaign.completed)
        {
            campaign = campaign.cleared();
            clears += 1;
        }

        expect(clears).toBe(61);
        expect(campaign.position()).toMatchObject({ stage: 10, encounter: CHAPTER_BOSS });
    });
});

describe('Campaign encounter', () => {
    it('a phase monster has the health of its stage, no time limit and the Stage/Phase label', () => {
        expect(at(2, PHASE, 3).encounter()).toEqual({
            kind: PHASE, stage: 2, phase: 3, health: 11, stats: DEFAULT_STATS, dropRuleId: 12, timeLimitMs: null, label: 'Stage 2/3  Phase 3/3'
        });
    });

    describe('drop rule', () => {
        it('a phase monster carries the monster drop rule of its stage', () => {
            expect(at(2, PHASE, 3).encounter().dropRuleId).toBe(12);
            expect(at(3, PHASE, 1).encounter().dropRuleId).toBe(13);
        });

        it('a miniboss carries the miniboss drop rule of its stage', () => {
            expect(at(2, MINIBOSS).encounter().dropRuleId).toBe(22);
            expect(at(1, MINIBOSS).encounter().dropRuleId).toBe(21);
        });

        it('the chapter boss carries the boss drop rule of the chapter', () => {
            expect(at(3, CHAPTER_BOSS).encounter().dropRuleId).toBe(30);
        });

        it('a farm encounter carries no drop rule', () => {
            const done = at(3, CHAPTER_BOSS, 1, true);

            expect(done.farmEncounter({ kind: MINIBOSS, stage: 2 }).dropRuleId).toBeNull();
            expect(done.farmEncounter({ kind: CHAPTER_BOSS }).dropRuleId).toBeNull();
        });
    });

    describe('enemy stats', () => {
        const monster = { element: 'WATER', physicalDefense: 1, magicalDefense: 2, critResistance: 3 };
        const miniboss = { element: 'LIGHT', physicalDefense: 21, magicalDefense: 22, critResistance: 23 };
        const boss = { element: 'DARKNESS', physicalDefense: 31, magicalDefense: 32, critResistance: 33 };
        const withStats = {
            ...definition,
            boss,
            stages: definition.stages.map((stage) => ({ ...stage, monster: { ...monster, physicalDefense: stage.number }, miniboss }))
        };
        const statsAt = (stage, encounter) => Campaign.fromProgress({ chapter: 1, stage, encounter, phase: 1, completed: false, definition: withStats }).encounter().stats;

        it('a phase monster carries the monster stats of its stage', () => {
            expect(statsAt(2, PHASE)).toEqual({ ...monster, physicalDefense: 2 });
        });

        it('a miniboss carries the miniboss stats of its stage', () => {
            expect(statsAt(2, MINIBOSS)).toEqual(miniboss);
        });

        it('the chapter boss carries the boss stats of the chapter', () => {
            expect(statsAt(3, CHAPTER_BOSS)).toEqual(boss);
        });

        it('a payload without stats means fire, no defense, no resistance', () => {
            expect(at(1, PHASE).encounter().stats).toEqual({ element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 });
            expect(at(1, MINIBOSS).encounter().stats).toEqual(DEFAULT_STATS);
            expect(at(3, CHAPTER_BOSS).encounter().stats).toEqual(DEFAULT_STATS);
        });
    });

    it('the label counts the stages and the phases of the chapter definition', () => {
        expect(at(1, PHASE, 1).encounter().label).toBe('Stage 1/3  Phase 1/2');
    });

    it('a miniboss has the miniboss health and time limit of its stage and the Miniboss label', () => {
        expect(at(2, MINIBOSS).encounter()).toMatchObject({
            kind: MINIBOSS, stage: 2, health: 55, timeLimitMs: 31000, label: 'Stage 2/3  Miniboss'
        });
    });

    it('the chapter boss has the boss health and time limit and the Chapter Boss label', () => {
        expect(at(3, CHAPTER_BOSS).encounter()).toMatchObject({
            kind: CHAPTER_BOSS, health: 300, timeLimitMs: 60000, label: 'Chapter Boss'
        });
    });

    it('there is no encounter once the campaign is completed', () => {
        expect(at(3, CHAPTER_BOSS, 1, true).encounter()).toBeNull();
    });

    it('position carries the chapter, stage, encounter and phase of the payload', () => {
        expect(at(2, PHASE, 3).position()).toEqual({ chapter: 1, stage: 2, encounter: PHASE, phase: 3 });
    });
});

describe('Campaign farm encounters', () => {
    const farmDefinition = {
        ...definition,
        boss: { element: 'DARKNESS', physicalDefense: 30, magicalDefense: 30, critResistance: 30 },
        stages: definition.stages.map((stage) => ({ ...stage, miniboss: { element: 'WATER', physicalDefense: 11, magicalDefense: 12, critResistance: 13 } }))
    };
    const done = Campaign.fromProgress({ chapter: 1, stage: 3, encounter: CHAPTER_BOSS, phase: 1, completed: true, definition: farmDefinition });

    it('a miniboss uses the health, stats and time limit of its stage and is labelled for the farm', () => {
        expect(done.farmEncounter({ kind: MINIBOSS, stage: 2 })).toEqual({
            kind: FARM,
            boss: { kind: MINIBOSS, stage: 2 },
            phase: 1,
            health: 55,
            stats: { element: 'WATER', physicalDefense: 11, magicalDefense: 12, critResistance: 13 },
            dropRuleId: null,
            timeLimitMs: 31000,
            label: 'Rever chefe: Miniboss 2'
        });
    });

    it('the chapter boss uses the boss health, stats and time limit', () => {
        expect(done.farmEncounter({ kind: CHAPTER_BOSS })).toEqual({
            kind: FARM,
            boss: { kind: CHAPTER_BOSS },
            phase: 1,
            health: 300,
            stats: { element: 'DARKNESS', physicalDefense: 30, magicalDefense: 30, critResistance: 30 },
            dropRuleId: null,
            timeLimitMs: 60000,
            label: 'Rever chefe: Chefe do capítulo'
        });
    });

    it('a definition without enemy stats falls back to the default stats', () => {
        expect(at(3, CHAPTER_BOSS).farmEncounter({ kind: MINIBOSS, stage: 1 }).stats).toEqual(DEFAULT_STATS);
        expect(at(3, CHAPTER_BOSS).farmEncounter({ kind: CHAPTER_BOSS }).stats).toEqual(DEFAULT_STATS);
    });

    it('an unknown stage or kind throws', () => {
        expect(() => done.farmEncounter({ kind: MINIBOSS, stage: 9 })).toThrow('Unknown stage');
        expect(() => done.farmEncounter({ kind: PHASE })).toThrow('Unknown boss');
    });

    it('does not move the campaign', () => {
        const before = state(done);

        done.farmEncounter({ kind: MINIBOSS, stage: 1 });

        expect(state(done)).toEqual(before);
    });
});
