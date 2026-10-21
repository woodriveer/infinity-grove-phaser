//  The skills of the leader in one fight: cooldowns per (hero, slot), the effects on the player and on the monster, and the damage over
//  time. The scene feeds it the frame time through `advance`; it holds no timer. Pure JavaScript: no Phaser, so every rule is unit-tested.
//  It damages the `Monster` it is given and returns the hits so the scene can show their numbers and handle a kill.
import { clickDamage, hitDamage } from './skillDamage';
import { skillOf } from './skillCatalog';

const NO_USE = { used: false, hits: [], countdown: { extendMs: 0 } };

export class SkillCombat
{
    constructor ({ random })
    {
        this.random = random;
        //  Milliseconds left of each cooldown, by `heroId:slot`
        this.cooldowns = new Map();
        //  Effects on the player: { id, label, remainingMs }
        this.buffs = [];
        //  Effects on the monster: { id, label, remainingMs }; they belong to `this.target`
        this.debuffs = [];
        this.target = null;
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

        this.cooldowns.set(`${heroId}:${slot}`, skill.cooldownMs);

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

        return { used: true, hits, countdown: { extendMs: 0 } };
    }

    //  Moves the clock by `ms`: cooldowns run down. Returns the hits that landed in that time.
    advance (ms)
    {
        for (const [ key, left ] of this.cooldowns)
        {
            this.cooldowns.set(key, Math.max(0, left - ms));
        }

        return { hits: [] };
    }
}
