//  The auto click (spec auto-click): after chapter 1 the game clicks for the player once every interval of fight time (500 ms at level 0,
//  faster with the upgrades the backend sells for crystals). Pure JavaScript: no Phaser. The scene feeds it the frame time only while the
//  auto click may hit, so a pause, a dead monster or a switched-off auto click adds nothing.
export const AUTO_CLICK_BASE_MS = 500;
export const AUTO_CLICK_MAX_PER_FRAME = 5;

//  Open once the chapter 1 boss is beaten: chapter 2 or later, or a completed campaign; closed before the campaign loads
export const autoClickUnlocked = ({ chapter, completed }) => completed === true || (chapter ?? 0) >= 2;

export class AutoClicker
{
    constructor (intervalMs = AUTO_CLICK_BASE_MS)
    {
        this.intervalMs = intervalMs;
        this.elapsedMs = 0;
    }

    //  `ms` of fight time pass: returns how many auto clicks fire now, at most 5, and keeps the time of the ones still owed
    advance (ms)
    {
        this.elapsedMs += ms;

        const clicks = Math.min(AUTO_CLICK_MAX_PER_FRAME, Math.floor(this.elapsedMs / this.intervalMs));

        this.elapsedMs -= clicks * this.intervalMs;

        return clicks;
    }
}
