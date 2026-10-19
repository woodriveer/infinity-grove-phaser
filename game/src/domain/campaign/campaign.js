//  The game-side mirror of the player's campaign position and its transition rules. The backend is the source of
//  truth (ADR 0006); the game applies the same rules at once so play never waits for the network.
//  Pure JavaScript: no Phaser, so every rule is unit-tested.
//
//  Built from the backend progress payload:
//  { chapter, stage, encounter, phase, completed,
//    definition: { bossHealth, bossTimeLimitMs, boss, bossDropRuleId,
//                  stages: [{ number, phasesPerStage, monsterHealth, minibossHealth, minibossTimeLimitMs, monster, miniboss, monsterDropRuleId, minibossDropRuleId }] } }
//  where boss, monster and miniboss are { element, physicalDefense, magicalDefense, critResistance }; a payload
//  without them (an older backend) means DEFAULT_STATS. The drop rule ids name the wallet queue a kill takes its copper from
import { DEFAULT_STATS } from '../combat/monster';
import { bossLabel } from '../heroes/heroes';

export const PHASE = 'PHASE';
export const MINIBOSS = 'MINIBOSS';
export const CHAPTER_BOSS = 'CHAPTER_BOSS';

//  The kind of an encounter that fights a defeated boss again; it never moves the campaign
export const FARM = 'FARM';

export class Campaign
{
    static fromProgress (progress)
    {
        return new Campaign(progress);
    }

    constructor ({ chapter, stage, encounter, phase, completed, definition })
    {
        this.chapter = chapter;
        this.stage = stage;
        this.kind = encounter;
        this.phase = phase;
        this.completed = completed;
        this.definition = definition;
    }

    get stageCount ()
    {
        return this.definition.stages.length;
    }

    stageDefinition (number = this.stage)
    {
        return this.definition.stages.find((stage) => stage.number === number);
    }

    //  The position the next outcome report leaves: the same fields the backend compares
    position ()
    {
        return { chapter: this.chapter, stage: this.stage, encounter: this.kind, phase: this.phase };
    }

    //  What to spawn now: its health, its drop rule, its time limit (null for a phase monster) and the HUD label. Null once completed.
    encounter ()
    {
        if (this.completed)
        {
            return null;
        }

        const stage = this.stageDefinition();

        if (this.kind === PHASE)
        {
            return {
                kind: PHASE,
                stage: this.stage,
                phase: this.phase,
                health: stage.monsterHealth,
                stats: stage.monster ?? DEFAULT_STATS,
                dropRuleId: stage.monsterDropRuleId ?? null,
                timeLimitMs: null,
                label: `Stage ${this.stage}/${this.stageCount}  Phase ${this.phase}/${stage.phasesPerStage}`
            };
        }

        if (this.kind === MINIBOSS)
        {
            return {
                kind: MINIBOSS,
                stage: this.stage,
                phase: 1,
                health: stage.minibossHealth,
                stats: stage.miniboss ?? DEFAULT_STATS,
                dropRuleId: stage.minibossDropRuleId ?? null,
                timeLimitMs: stage.minibossTimeLimitMs,
                label: `Stage ${this.stage}/${this.stageCount}  Miniboss`
            };
        }

        return {
            kind: CHAPTER_BOSS,
            stage: this.stage,
            phase: 1,
            health: this.definition.bossHealth,
            stats: this.definition.boss ?? DEFAULT_STATS,
            dropRuleId: this.definition.bossDropRuleId ?? null,
            timeLimitMs: this.definition.bossTimeLimitMs,
            label: 'Chapter Boss'
        };
    }

    //  A boss already beaten, fought again: the numbers of the campaign boss, labelled for the farm and tagged with the boss it is.
    //  It has no drop rule: farm fights drop no copper
    farmEncounter (boss)
    {
        const { kind, stage } = boss;
        let health;
        let stats;
        let timeLimitMs;

        if (kind === MINIBOSS)
        {
            const definition = this.stageDefinition(stage);

            if (!definition)
            {
                throw new Error(`Unknown stage: ${stage}`);
            }

            ({ minibossHealth: health, minibossTimeLimitMs: timeLimitMs } = definition);
            stats = definition.miniboss ?? DEFAULT_STATS;
        }
        else if (kind === CHAPTER_BOSS)
        {
            ({ bossHealth: health, bossTimeLimitMs: timeLimitMs } = this.definition);
            stats = this.definition.boss ?? DEFAULT_STATS;
        }
        else
        {
            throw new Error(`Unknown boss: ${kind}`);
        }

        return { kind: FARM, boss, phase: 1, health, stats, dropRuleId: null, timeLimitMs, label: `Rever chefe: ${bossLabel(boss)}` };
    }

    //  The encounter was won: the campaign after it
    cleared ()
    {
        if (this.completed)
        {
            throw new Error('A completed campaign has nothing to clear');
        }

        if (this.kind === PHASE)
        {
            return this.phase < this.stageDefinition().phasesPerStage ? this.moved({ phase: this.phase + 1 }) : this.moved({ encounter: MINIBOSS, phase: 1 });
        }

        if (this.kind === MINIBOSS)
        {
            return this.stage < this.stageCount ? this.moved({ stage: this.stage + 1, encounter: PHASE, phase: 1 }) : this.moved({ encounter: CHAPTER_BOSS, phase: 1 });
        }

        return this.moved({ completed: true });
    }

    //  The boss timer ran out: back to the last phase of the same stage
    failed ()
    {
        if (this.completed || this.kind === PHASE)
        {
            throw new Error('Only a boss can be failed');
        }

        return this.moved({ encounter: PHASE, phase: this.stageDefinition().phasesPerStage });
    }

    moved (changes)
    {
        return new Campaign({
            chapter: this.chapter,
            stage: this.stage,
            encounter: this.kind,
            phase: this.phase,
            completed: this.completed,
            definition: this.definition,
            ...changes
        });
    }
}
