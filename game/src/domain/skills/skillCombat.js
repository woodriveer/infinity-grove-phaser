//  The skills of the leader in one fight: cooldowns per (hero, slot), the effects on the player and on the monster, and the damage over
//  time. The scene feeds it the frame time through `advance`; it holds no timer. Pure JavaScript: no Phaser, so every rule is unit-tested.
//  It damages the `Monster` it is given and returns the hits so the scene can show their numbers and handle a kill.
import { clickDamage, hitDamage, tickDamage } from './skillDamage';
import { skillOf } from './skillCatalog';

const TICK_MS = 1000;
const NO_USE = { used: false, hits: [], countdown: { extendMs: 0 } };

export class SkillCombat
{
    constructor ({ random })
    {
        this.random = random;
        //  Milliseconds left of each cooldown, by `heroId:slot`
        this.cooldowns = new Map();
        //  Effects on the player: { id, label, remainingMs, seq }
        this.buffs = [];
        //  Effects on the monster: same shape; they belong to `this.target` and end with it
        this.debuffs = [];
        //  Damage over time on the monster: { id, label, percent, damageType, attacker, stacks, maxStacks, remainingMs, untilTickMs, seq }
        this.dots = [];
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
        }

        this.target = monster && !monster.dead ? monster : null;
    }

    //  Starts an effect, or restarts its duration without stacking it
    start (list, id, label, ms)
    {
        const running = list.find((effect) => effect.id === id);

        if (running)
        {
            running.remainingMs = ms;
        }
        else
        {
            list.push({ id, label, remainingMs: ms, seq: this.sequence++ });
        }
    }

    //  Starts a damage over time on the monster, or restarts it; a stacking one gains a stack up to its maximum
    startDot (skill, attacker)
    {
        const { id, percent, count, maxStacks = 1 } = skill.ticks;
        const running = this.dots.find((dot) => dot.id === id);
        const ms = count * TICK_MS;

        if (running)
        {
            Object.assign(running, { attacker, remainingMs: ms, stacks: Math.min(maxStacks, running.stacks + 1) });
        }
        else
        {
            this.dots.push({
                id, label: skill.label, percent, damageType: skill.damageType, attacker, stacks: 1, maxStacks, remainingMs: ms, untilTickMs: TICK_MS, seq: this.sequence++
            });
        }
    }

    //  The running effects as tags, in the order they started, with whole seconds left
    effects ()
    {
        this.follow(this.target);

        return [ ...this.buffs, ...this.debuffs, ...this.dots ]
            .sort((a, b) => a.seq - b.seq)
            .map(({ label, remainingMs, maxStacks, stacks }) => ({
                label: maxStacks > 1 ? `${label} x${stacks}` : label,
                seconds: Math.ceil(remainingMs / 1000)
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

        const left = this.cooldowns.get(`${heroId}:${slot}`) ?? 0;

        return left > 0 ? { state: 'cooling', seconds: Math.ceil(left / 1000) } : { state: 'ready', seconds: 0 };
    }

    //  A click of the leader's attacker under the running effects; damages the monster
    click ({ attacker, monster, boss })
    {
        this.follow(monster);

        const result = clickDamage({
            attacker, buffs: this.buffIds(), debuffs: this.debuffIds(), defender: monster.stats, random: this.random, boss
        });

        monster.hit(result.damage);

        return result;
    }

    //  Uses a skill: refused while locked, cooling or without a living monster; otherwise it lands its hits and starts the cooldown
    use ({ heroId, slot, unlocked, attacker, monster, boss })
    {
        const skill = skillOf(heroId, slot);

        if (!skill || this.slotState(heroId, slot, unlocked).state !== 'ready' || !monster || monster.dead)
        {
            return NO_USE;
        }

        this.follow(monster);
        this.cooldowns.set(`${heroId}:${slot}`, skill.cooldownMs);

        if (skill.buff)
        {
            this.start(this.buffs, skill.buff.id, skill.label, skill.buff.ms);
        }

        if (skill.debuff)
        {
            this.start(this.debuffs, skill.debuff.id, skill.label, skill.debuff.ms);
        }

        const hits = [];

        for (const { percent, armorPierce } of skill.hits)
        {
            if (monster.dead)
            {
                break;
            }

            const result = hitDamage({
                attacker, percent, armorPierce, damageType: skill.damageType, vsDarkness: skill.vsDarkness,
                buffs: this.buffIds(), debuffs: this.debuffIds(), defender: monster.stats, random: this.random, boss
            });

            monster.hit(result.damage);
            hits.push(result);
        }

        if (skill.ticks && !monster.dead)
        {
            this.startDot(skill, attacker);
        }

        return { used: true, hits, countdown: { extendMs: 0 } };
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

        const hits = [];
        let left = ms;

        while (left > 0 && (this.buffs.length || this.debuffs.length || this.dots.length))
        {
            const running = [ ...this.buffs, ...this.debuffs, ...this.dots ];
            const step = Math.min(left, ...running.map((effect) => effect.remainingMs), ...this.dots.map((dot) => dot.untilTickMs));

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

    //  One tick of a damage over time on the monster: `stacks` times its percent of the base damage it was cast with
    tickHit (dot, monster, boss)
    {
        const damage = tickDamage({
            attacker: dot.attacker, percent: dot.percent * dot.stacks, damageType: dot.damageType,
            buffs: this.buffIds(), debuffs: this.debuffIds(), defender: monster.stats, boss
        });

        monster.hit(damage);

        return { damage, critical: false };
    }
}
