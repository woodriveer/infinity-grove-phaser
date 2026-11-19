//  The clock of the team (spec hero-team): every fighting ally hits once each 1000 ms of fight time, in slot order; the first tick lands
//  1000 ms after a monster appears. It holds no damage rule: `hit` lands each hit. Pure JavaScript: no Phaser.
export const ALLY_TICK_MS = 1000;

export class AllyCombat
{
    constructor ()
    {
        this.monster = null;
        this.untilTickMs = ALLY_TICK_MS;
    }

    //  Moves the clock by `ms`.
    //    monster  the monster of the encounter; null or dead lands nothing and puts the clock back at 1000 ms; another monster than
    //             the last call restarts the clock at 1000 ms
    //    allies   [ { slot, attacker } ] in slot order; empty lands nothing and puts the clock back at 1000 ms
    //    hit(attacker, target) -> damage   lands one hit
    //    target() the monster the next hit lands on, read before every hit (miniboss-adds); null or dead ends the tick
    //  Returns { ticks: [ { slots, damage } ] }: one entry per elapsed 1000 ms in which at least one hit landed.
    advance (ms, { monster, allies, hit, target = () => monster })
    {
        if (monster !== this.monster)
        {
            this.monster = monster;
            this.untilTickMs = ALLY_TICK_MS;
        }

        if (!monster || monster.dead || allies.length === 0)
        {
            this.untilTickMs = ALLY_TICK_MS;

            return { ticks: [] };
        }

        const ticks = [];

        this.untilTickMs -= ms;

        while (this.untilTickMs <= 0 && !monster.dead)
        {
            this.untilTickMs += ALLY_TICK_MS;

            const tick = this.land(allies, hit, target);

            if (tick.slots.length > 0)
            {
                ticks.push(tick);
            }
        }

        if (monster.dead)
        {
            this.untilTickMs = ALLY_TICK_MS;
        }

        return { ticks };
    }

    //  One tick: every ally in order hits the target read right before its hit; a missing or dead target ends the tick
    land (allies, hit, target)
    {
        const tick = { slots: [], damage: 0 };

        for (const { slot, attacker } of allies)
        {
            const aim = target();

            if (!aim || aim.dead)
            {
                break;
            }

            tick.damage += hit(attacker, aim);
            tick.slots.push(slot);
        }

        return tick;
    }
}
