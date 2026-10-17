//  The game-side mirror of the player's campaign position and its transition rules. The backend is the source of
//  truth (ADR 0006); the game applies the same rules at once so play never waits for the network.
//  Pure JavaScript: no Phaser, so every rule is unit-tested.
//
//  Built from the backend progress payload:
//  { chapter, stage, encounter, phase, completed,
//    definition: { bossHealth, bossTimeLimitMs, stages: [{ number, phasesPerStage, monsterHealth, minibossHealth, minibossTimeLimitMs }] } }
export const PHASE = 'PHASE';
export const MINIBOSS = 'MINIBOSS';
export const CHAPTER_BOSS = 'CHAPTER_BOSS';

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

    //  What to spawn now: its health, its time limit (null for a phase monster) and the HUD label. Null once completed.
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
                timeLimitMs: stage.minibossTimeLimitMs,
                label: `Stage ${this.stage}/${this.stageCount}  Miniboss`
            };
        }

        return {
            kind: CHAPTER_BOSS,
            stage: this.stage,
            phase: 1,
            health: this.definition.bossHealth,
            timeLimitMs: this.definition.bossTimeLimitMs,
            label: 'Chapter Boss'
        };
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
