//  The time left to beat a miniboss or the chapter boss. The scene feeds it the frame time; it holds no timer.
//  Pure JavaScript: no Phaser, so the rule is unit-tested.
export class BossCountdown
{
    constructor (limitMs)
    {
        this.limitMs = limitMs;
        this.elapsedMs = 0;
    }

    advance (ms)
    {
        this.elapsedMs = Math.min(this.limitMs, this.elapsedMs + Math.max(0, ms));
    }

    //  Adds time left, beyond the starting limit; an expired countdown that gains time is live again
    extend (ms)
    {
        this.limitMs += Math.max(0, ms);
    }

    get remainingMs ()
    {
        return this.limitMs - this.elapsedMs;
    }

    //  Whole seconds shown to the player, rounded up so "1" lasts until the very end
    get seconds ()
    {
        return Math.ceil(this.remainingMs / 1000);
    }

    get expired ()
    {
        return this.remainingMs <= 0;
    }
}
