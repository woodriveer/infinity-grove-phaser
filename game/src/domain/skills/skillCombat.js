//  The skills of the leader in one fight: cooldowns per (hero, slot), the effects on the player and on the monster, and the damage over
//  time. The scene feeds it the frame time through `advance`; it holds no timer. Pure JavaScript: no Phaser, so every rule is unit-tested.
//  It damages the `Monster` it is given and returns the hits so the scene can show their numbers and handle a kill.
import { clickDamage, hitDamage, tickDamage } from './skillDamage';
import { skillOf } from './skillCatalog';
import { levelFactor } from './skillLevel';

const TICK_MS = 1000;
const NO_USE = { used: false, hits: [], countdown: { extendMs: 0 } };

export class SkillCombat
{
    //  `statsOf(monster)` gives the stats a hit meets; the scene passes the monster stats after the break talents, read at the moment of the hit
    constructor ({ random, statsOf = (monster) => monster.stats })
    {
        this.random = random;
        this.statsOf = statsOf;
        //  Milliseconds left of each cooldown, by `heroId:slot`
        this.cooldowns = new Map();
        //  Effects on the player: { id, label, remainingMs, seq }
        this.buffs = [];
        //  Effects on the monster: same shape; they belong to `this.target` and end with it
        this.debuffs = [];
        //  Damage over time on the monster: { id, label, percent, damageType, attacker, stacks, maxStacks, remainingMs, untilTickMs, seq }
        this.dots = [];
        //  The aimed shot being cast: { key, remainingMs, skill, attacker, boss }; it belongs to `this.target`
        this.cast = null;
        //  Milliseconds the boss countdown stays stopped (Stun and Root do not add up)
        this.freezeMs = 0;
        this.target = null;
        //  The start order of the effects, for the tags
        this.sequence = 0;
    }

    //  The monster the effects on it belong to: another monster, a dead one or none ends them all
    follow (monster)
    {
        if (monster !== this.target || !monster || monster.dead)
        {
            this.debuffs = [];
            this.dots = [];
            this.cast = null;
            this.freezeMs = 0;
        }

        this.target = monster && !monster.dead ? monster : null;
    }

    //  Starts an effect, or restarts its duration without stacking it; `factor` is the level factor it is cast with
    start (list, id, label, ms, owner = {}, factor = 1)
    {
        const running = list.find((effect) => effect.id === id);

        if (running)
        {
            running.remainingMs = ms;
            running.factor = factor;
        }
        else
        {
            list.push({ id, label, remainingMs: ms, seq: this.sequence++, factor, ...owner });
        }
    }

    //  The level factor of each running effect on the player and the monster, by effect id (an id not listed is 1)
    factors ()
    {
        return Object.fromEntries([ ...this.buffs, ...this.debuffs ].map((effect) => [ effect.id, effect.factor ?? 1 ]));
    }

    //  Starts a damage over time on the monster, or restarts it; a stacking one gains a stack up to its maximum. `factor` scales its percent.
    startDot (skill, attacker, owner = {}, factor = 1)
    {
        const { id, count, maxStacks = 1 } = skill.ticks;
        const percent = skill.ticks.percent * factor;
        const running = this.dots.find((dot) => dot.id === id);
        const ms = count * TICK_MS;

        if (running)
        {
            Object.assign(running, { attacker, percent, remainingMs: ms, stacks: Math.min(maxStacks, running.stacks + 1) });
        }
        else
        {
            this.dots.push({
                id, label: skill.label, percent, damageType: skill.damageType, attacker, stacks: 1, maxStacks, remainingMs: ms, untilTickMs: TICK_MS, seq: this.sequence++, ...owner
            });
        }
    }

    //  The running effects as tags, in the order they started, with whole seconds left
    effects ()
    {
        return this.effectsWithOwner().map(({ label, seconds }) => ({ label, seconds }));
    }

    //  The same effects with the hero and slot of the skill that started each, for the tooltip of its tag
    effectsWithOwner ()
    {
        this.follow(this.target);

        return [ ...this.buffs, ...this.debuffs, ...this.dots ]
            .sort((a, b) => a.seq - b.seq)
            .map(({ label, remainingMs, maxStacks, stacks, heroId, slot }) => ({
                label: maxStacks > 1 ? `${label} x${stacks}` : label,
                seconds: Math.ceil(remainingMs / 1000),
                heroId,
                slot
            }));
    }

    buffIds ()
    {
        return this.buffs.map((buff) => buff.id);
    }

    debuffIds ()
    {
        return this.debuffs.map((debuff) => debuff.id);
    }

    //  The state of a slot: locked (not unlocked by the hero's stars), cooling with whole seconds left, or ready
    slotState (heroId, slot, unlocked)
    {
        if (!unlocked)
        {
            return { state: 'locked', seconds: 0 };
        }

        if (this.cast?.key === `${heroId}:${slot}`)
        {
            return { state: 'casting', seconds: Math.ceil(this.cast.remainingMs / 1000) };
        }

        const left = this.cooldowns.get(`${heroId}:${slot}`) ?? 0;

        return left > 0 ? { state: 'cooling', seconds: Math.ceil(left / 1000) } : { state: 'ready', seconds: 0 };
    }

    //  A click of the leader's attacker under the running effects; damages the monster. `multiplier` is the combo of the click and
    //  `forceCritical` makes it a critical hit (the double click of Lyra).
    click ({ attacker, monster, boss, multiplier = 1, forceCritical = false })
    {
        this.follow(monster);

        const result = clickDamage({
            attacker, buffs: this.buffIds(), debuffs: this.debuffIds(), defender: this.statsOf(monster), random: this.random, boss, multiplier, forceCritical,
            factors: this.factors()
        });

        monster.hit(result.damage);

        return result;
    }

    //  Uses a skill: refused while locked, cooling or without a living monster; otherwise it lands its hits and starts the cooldown.
    //  `level` (1 to 3) scales the hits, the effects, the damage over time, the aimed shot and the countdown extension.
    use ({ heroId, slot, unlocked, level = 1, attacker, monster, boss })
    {
        const skill = skillOf(heroId, slot);

        if (!skill || this.slotState(heroId, slot, unlocked).state !== 'ready' || !monster || monster.dead)
        {
            return NO_USE;
        }

        this.follow(monster);
        this.cooldowns.set(`${heroId}:${slot}`, skill.cooldownMs);

        const owner = { heroId, slot };
        const factor = levelFactor(level);

        if (skill.buff)
        {
            this.start(this.buffs, skill.buff.id, skill.label, skill.buff.ms, owner, factor);
        }

        if (skill.debuff)
        {
            this.start(this.debuffs, skill.debuff.id, skill.label, skill.debuff.ms, owner, factor);
        }

        const hits = [];

        for (const { percent, armorPierce } of skill.hits)
        {
            if (monster.dead)
            {
                break;
            }

            const result = hitDamage({
                attacker, percent: percent * factor, armorPierce, damageType: skill.damageType, vsDarkness: skill.vsDarkness,
                buffs: this.buffIds(), debuffs: this.debuffIds(), defender: this.statsOf(monster), random: this.random, boss,
                factors: this.factors()
            });

            monster.hit(result.damage);
            hits.push(result);
        }

        if (skill.ticks && !monster.dead)
        {
            this.startDot(skill, attacker, owner, factor);
        }

        if (skill.cast)
        {
            this.cast = { key: `${heroId}:${slot}`, remainingMs: skill.cast.ms, skill, attacker, boss, factor };
        }

        //  Stun and Root stop the countdown of a boss only; a phase monster has none
        if (boss)
        {
            this.freezeMs = Math.max(this.freezeMs, skill.stunMs ?? 0, skill.rootMs ?? 0);
        }

        return { used: true, hits, countdown: { extendMs: boss ? (skill.countdownExtendMs ?? 0) * factor : 0 } };
    }

    //  The part of a frame of `ms` the boss countdown runs; call it before `advance`, which uses up the stop
    countdownMs (ms)
    {
        return Math.max(0, ms - this.freezeMs);
    }

    //  Moves the clock by `ms`: cooldowns and effects run down and the damage over time ticks once per second. Returns the ticks that landed.
    //  The time is cut at every tick and every end of an effect so each tick sees the effects that run at that moment.
    advance (ms, { monster = null, boss = false } = {})
    {
        this.follow(monster);

        for (const [ key, left ] of this.cooldowns)
        {
            this.cooldowns.set(key, Math.max(0, left - ms));
        }

        this.freezeMs = Math.max(0, this.freezeMs - ms);

        const hits = [];
        let left = ms;

        while (left > 0 && (this.buffs.length || this.debuffs.length || this.dots.length || this.cast))
        {
            const running = [ ...this.buffs, ...this.debuffs, ...this.dots ];
            const step = Math.min(
                left, ...running.map((effect) => effect.remainingMs), ...this.dots.map((dot) => dot.untilTickMs), ...(this.cast ? [ this.cast.remainingMs ] : [])
            );

            if (this.cast)
            {
                this.cast.remainingMs -= step;
            }

            running.forEach((effect) =>
            {
                effect.remainingMs -= step;
            });

            for (const dot of this.dots)
            {
                dot.untilTickMs -= step;

                if (dot.untilTickMs <= 0 && !monster?.dead)
                {
                    dot.untilTickMs = TICK_MS;
                    hits.push(this.tickHit(dot, monster, boss));
                }
            }

            if (this.cast && this.cast.remainingMs <= 0)
            {
                //  A tick of this same step may have killed the monster: the shot is lost
                if (monster && !monster.dead)
                {
                    hits.push(this.landCast(monster, boss));
                }
                else
                {
                    this.cast = null;
                }
            }

            this.buffs = this.buffs.filter((effect) => effect.remainingMs > 0);
            this.debuffs = this.debuffs.filter((effect) => effect.remainingMs > 0);
            this.dots = this.dots.filter((dot) => dot.remainingMs > 0);
            left -= step;

            if (monster?.dead)
            {
                this.follow(monster);
            }
        }

        return { hits };
    }

    //  The cast ends: the shot lands as a critical hit on the monster it was aimed at, which is on screen and alive here
    landCast (monster, boss)
    {
        const { skill, attacker } = this.cast;
        const result = hitDamage({
            attacker, percent: skill.cast.hit.percent * this.cast.factor, damageType: skill.damageType, forceCritical: true,
            buffs: this.buffIds(), debuffs: this.debuffIds(), defender: this.statsOf(monster), random: this.random, boss,
            factors: this.factors()
        });

        this.cast = null;
        monster.hit(result.damage);

        return result;
    }

    //  One tick of a damage over time on the monster: `stacks` times its percent of the base damage it was cast with
    tickHit (dot, monster, boss)
    {
        const damage = tickDamage({
            attacker: dot.attacker, percent: dot.percent * dot.stacks, damageType: dot.damageType,
            buffs: this.buffIds(), debuffs: this.debuffIds(), defender: this.statsOf(monster), boss, factors: this.factors()
        });

        monster.hit(damage);

        return { damage, critical: false };
    }
}
