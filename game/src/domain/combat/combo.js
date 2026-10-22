//  The click combo (spec click-power): consecutive clicks without a pause build +1 % click damage per click up to a cap, lost after 1.5 s
//  with no click. The cap is the COMBO talent (spec talent-points): 5 % a level, 50 % at level 10, none without it. Pure JavaScript: no
//  Phaser. The scene feeds it the frame time, so a pause that stops the frames freezes it.
export const COMBO_STEP_PERCENT = 1;
export const COMBO_IDLE_MS = 1500;

export class Combo
{
    //  `maxPercent` is the cap of the bonus; the scene sets it from the talent before every click
    constructor (maxPercent = 0)
    {
        this.streak = 0;
        this.idleMs = 0;
        this.maxPercent = maxPercent;
    }

    //  The bonus percent the next click gets
    get bonus ()
    {
        return Math.min(this.maxPercent, this.streak * COMBO_STEP_PERCENT);
    }

    //  A click on a living monster: returns the bonus percent this click gets, then counts it in the streak
    click ()
    {
        const { bonus } = this;

        this.streak += 1;
        this.idleMs = 0;

        return bonus;
    }

    //  `ms` pass with no click; the streak ends when the idle time reaches the limit
    advance (ms)
    {
        if (this.streak === 0)
        {
            return;
        }

        this.idleMs += ms;

        if (this.idleMs >= COMBO_IDLE_MS)
        {
            this.streak = 0;
            this.idleMs = 0;
        }
    }
}

//  "Combo x11 · +11%", empty without a streak or while the cap is 0 (no COMBO talent)
export const comboText = ({ streak, bonus, maxPercent }) => (streak === 0 || maxPercent === 0 ? '' : `Combo x${streak} · +${bonus}%`);
