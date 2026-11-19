//  The skills of the leader in one fight: cooldowns per (hero, slot), the effects on the player and on each monster, and the damage over
//  time. The scene feeds it the frame time through `advance`; it holds no timer. Pure JavaScript: no Phaser, so every rule is unit-tested.
//  It damages the `Monster`s it is given and returns the hits (and the monster each landed on) so the scene can show their numbers and
//  handle a kill.
import { clickDamage, hitDamage, tickDamage } from './skillDamage';
import { skillOf } from './skillCatalog';
import { levelFactor } from './skillLevel';

const TICK_MS = 1000;
const NO_USE = { used: false, hits: [], targets: [], countdown: { extendMs: 0 } };

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
        //  Effects on each monster of the fight (spec miniboss-adds): Monster -> { debuffs, dots }. Debuffs: { id, label, remainingMs, seq,
        //  factor, heroId, slot }; dots: { id, label, percent, attacker, stacks, maxStacks, remainingMs, untilTickMs, seq, heroId, slot }
        this.marks = new Map();
        //  The main monster of the fight: the miniboss of a fight with adds, else the one monster. The aimed shot and the Stun/Root stop
        //  belong to the fight and end with it.
        this.main = null;
        //  The aimed shot being cast: { key, remainingMs, skill, attacker, boss }; it belongs to the main monster
        this.cast = null;
        //  Milliseconds the boss countdown stays stopped (Stun and Root do not add up)
        this.freezeMs = 0;
        //  The start order of the effects, for the tags
        this.sequence = 0;
    }

    //  Another main, a dead one or none ends every effect on every monster, the aimed shot and the stop; a dead add loses only its own
    follow (main)
    {
        if (main !== this.main || !main || main.dead)
        {
            this.marks.clear();
            this.cast = null;
            this.freezeMs = 0;
        }

        this.main = main && !main.dead ? main : null;

        for (const monster of [ ...this.marks.keys() ])
        {
            if (monster.dead)
            {
                this.marks.delete(monster);
            }
        }
    }

    //  The effects on `monster`, created empty on first use
    marksOf (monster)
    {
        if (!this.marks.has(monster))
        {
            this.marks.set(monster, { debuffs: [], dots: [] });
        }

        return this.marks.get(monster);
    }

    debuffsOf (monster) { return this.marks.get(monster)?.debuffs ?? []; }

    dotsOf (monster) { return this.marks.get(monster)?.dots ?? []; }

    //  Every debuff and damage over time of every monster, for the time cutting of `advance`
    markedEffects () { return [ ...this.marks.values() ].flatMap(({ debuffs, dots }) => [ ...debuffs, ...dots ]); }

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

    //  The level factor of each running effect on the player and on `monster`, by effect id (an id not listed is 1)
    factors (monster = this.main)
    {
        return Object.fromEntries([ ...this.buffs, ...this.debuffsOf(monster) ].map((effect) => [ effect.id, effect.factor ?? 1 ]));
    }

    //  Starts a damage over time on `monster`, or restarts it; a stacking one gains a stack up to its maximum. `factor` scales its percent.
    startDot (monster, skill, attacker, owner = {}, factor = 1)
    {
        const { dots } = this.marksOf(monster);
        const { id, count, maxStacks = 1 } = skill.ticks;
        const percent = skill.ticks.percent * factor;
        const running = dots.find((dot) => dot.id === id);
        const ms = count * TICK_MS;

        if (running)
        {
            Object.assign(running, { attacker, percent, remainingMs: ms, stacks: Math.min(maxStacks, running.stacks + 1) });
        }
        else
        {
            dots.push({
                id, label: skill.label, percent, attacker, stacks: 1, maxStacks, remainingMs: ms, untilTickMs: TICK_MS, seq: this.sequence++, ...owner
            });
        }
    }

    //  The running effects as tags, in the order they started, with whole seconds left
    effects ()
    {
        return this.effectsWithOwner().map(({ label, seconds }) => ({ label, seconds }));
    }

    //  The player's buffs and the debuffs and damage over time of `focus` (the target), in start order, with the hero and slot of the
    //  skill that started each, for the tooltip of its tag
    effectsWithOwner (focus = this.main)
    {
        this.follow(this.main);

        return [ ...this.buffs, ...this.debuffsOf(focus), ...this.dotsOf(focus) ]
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

    debuffIds (monster = this.main)
    {
        return this.debuffsOf(monster).map((debuff) => debuff.id);
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

    //  A click of the leader's attacker under the running effects; damages `monster`, which is `main` unless the click lands on another
    //  monster of the same fight. `multiplier` is the combo of the click and `forceCritical` makes it a critical hit (the double click of Lyra).
    click ({ attacker, monster, main = monster, boss, multiplier = 1, forceCritical = false })
    {
        this.follow(main);

        const result = clickDamage({
            attacker, buffs: this.buffIds(), debuffs: this.debuffIds(monster), defender: this.statsOf(monster), random: this.random, boss, multiplier, forceCritical,
            factors: this.factors(monster)
        });

        monster.hit(result.damage);

        return result;
    }

    //  One ally hit on `monster` (spec hero-team): the ally's attacker through the strike of a tick at 100 %, so it is never critical, gets
    //  no click bonus and meets the one defense, Brado, Prisão and Bênção like every strike (spec unified-damage); damages the monster
    allyHit ({ attacker, monster, main = monster, boss })
    {
        this.follow(main);

        const damage = tickDamage({
            attacker, percent: 100, buffs: this.buffIds(), debuffs: this.debuffIds(monster), defender: this.statsOf(monster), boss, factors: this.factors(monster)
        });

        monster.hit(damage);

        return { damage, critical: false };
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
        const victims = [ monster ];

        if (skill.buff)
        {
            this.start(this.buffs, skill.buff.id, skill.label, skill.buff.ms, owner, factor);
        }

        if (skill.debuff)
        {
            for (const victim of victims)
            {
                this.start(this.marksOf(victim).debuffs, skill.debuff.id, skill.label, skill.debuff.ms, owner, factor);
            }
        }

        const hits = [];
        const targets = [];

        for (const victim of victims)
        {
            for (const { percent, armorPierce } of skill.hits)
            {
                if (victim.dead)
                {
                    break;
                }

                const result = hitDamage({
                    attacker, percent: percent * factor, armorPierce, vsDarkness: skill.vsDarkness,
                    buffs: this.buffIds(), debuffs: this.debuffIds(victim), defender: this.statsOf(victim), random: this.random, boss,
                    factors: this.factors(victim)
                });

                victim.hit(result.damage);
                hits.push(result);
                targets.push(victim);
            }
        }

        if (skill.ticks)
        {
            for (const victim of victims.filter((item) => !item.dead))
            {
                this.startDot(victim, skill, attacker, owner, factor);
            }
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

        return { used: true, hits, targets, countdown: { extendMs: boss ? (skill.countdownExtendMs ?? 0) * factor : 0 } };
    }

    //  The part of a frame of `ms` the boss countdown runs; call it before `advance`, which uses up the stop
    countdownMs (ms)
    {
        return Math.max(0, ms - this.freezeMs);
    }

    //  Moves the clock by `ms`: cooldowns and effects run down and the damage over time ticks once per second. Returns the ticks that
    //  landed and the monster each landed on. The time is cut at every tick and every end of an effect so each tick sees the effects that
    //  run at that moment.
    advance (ms, { monster = null, boss = false } = {})
    {
        this.follow(monster);

        for (const [ key, left ] of this.cooldowns)
        {
            this.cooldowns.set(key, Math.max(0, left - ms));
        }

        this.freezeMs = Math.max(0, this.freezeMs - ms);

        const hits = [];
        const targets = [];
        const victims = monster ? [ monster ] : [];
        let left = ms;

        while (left > 0 && (this.buffs.length || this.markedEffects().length || this.cast))
        {
            const running = [ ...this.buffs, ...this.markedEffects() ];
            const dots = [ ...this.marks.values() ].flatMap((mark) => mark.dots);
            const step = Math.min(
                left, ...running.map((effect) => effect.remainingMs), ...dots.map((dot) => dot.untilTickMs), ...(this.cast ? [ this.cast.remainingMs ] : [])
            );

            if (this.cast)
            {
                this.cast.remainingMs -= step;
            }

            running.forEach((effect) =>
            {
                effect.remainingMs -= step;
            });

            dots.forEach((dot) =>
            {
                dot.untilTickMs -= step;
            });

            for (const victim of victims)
            {
                for (const dot of this.dotsOf(victim))
                {
                    if (dot.untilTickMs <= 0 && !victim.dead && !monster.dead)
                    {
                        dot.untilTickMs = TICK_MS;
                        hits.push(this.tickHit(dot, victim, boss));
                        targets.push(victim);
                    }
                }
            }

            //  A dot on a monster the caller did not hand over cannot tick; it waits a second instead of freezing the clock at 0 ms
            dots.forEach((dot) =>
            {
                dot.untilTickMs = dot.untilTickMs <= 0 ? TICK_MS : dot.untilTickMs;
            });

            if (this.cast && this.cast.remainingMs <= 0)
            {
                //  A tick of this same step may have killed the monster: the shot is lost
                if (monster && !monster.dead)
                {
                    const landed = this.landCast(victims, boss);

                    hits.push(...landed.hits);
                    targets.push(...landed.targets);
                }
                else
                {
                    this.cast = null;
                }
            }

            this.buffs = this.buffs.filter((effect) => effect.remainingMs > 0);

            for (const mark of this.marks.values())
            {
                mark.debuffs = mark.debuffs.filter((effect) => effect.remainingMs > 0);
                mark.dots = mark.dots.filter((dot) => dot.remainingMs > 0);
            }

            left -= step;
            this.follow(monster);
        }

        return { hits, targets };
    }

    //  The cast ends: the shot lands as a critical hit on every victim that is still alive, which are on screen here
    landCast (victims, boss)
    {
        const { skill, attacker, factor } = this.cast;
        const hits = [];
        const targets = [];

        this.cast = null;

        for (const victim of victims)
        {
            if (victim.dead)
            {
                continue;
            }

            const result = hitDamage({
                attacker, percent: skill.cast.hit.percent * factor, forceCritical: true,
                buffs: this.buffIds(), debuffs: this.debuffIds(victim), defender: this.statsOf(victim), random: this.random, boss,
                factors: this.factors(victim)
            });

            victim.hit(result.damage);
            hits.push(result);
            targets.push(victim);
        }

        return { hits, targets };
    }

    //  One tick of a damage over time on `monster`: `stacks` times its percent of the base damage it was cast with
    tickHit (dot, monster, boss)
    {
        const damage = tickDamage({
            attacker: dot.attacker, percent: dot.percent * dot.stacks,
            buffs: this.buffIds(), debuffs: this.debuffIds(monster), defender: this.statsOf(monster), boss, factors: this.factors(monster)
        });

        monster.hit(damage);

        return { damage, critical: false };
    }
}
