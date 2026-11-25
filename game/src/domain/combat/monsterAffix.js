//  Monster affixes (spec early-game-rebalance, Affix Rules): one per miniboss or chapter boss, from the payload's `minibossAffix` / `bossAffix`
//  ({ type, amount, periodMs }). Pure JavaScript: no Phaser.
import { defenseOf } from './monster';
import { formatShort } from './numberFormat';

export const SHELL = 'SHELL';
export const HIT_SHIELD = 'HIT_SHIELD';
export const REGENERATION = 'REGENERATION';
export const ARMORED = 'ARMORED';
export const AFFIX_TYPES = [ SHELL, HIT_SHIELD, REGENERATION, ARMORED ];

//  Fractional heals leave float dust: health is kept to 6 decimals, as Monster.hit does
const HEALTH_PRECISION = 1e6;

const validAmount = (amount) => Number.isInteger(amount) && amount >= 1;

//  The affix of the payload, or null when it is missing or malformed: an unknown type, an amount that is not an integer of at least 1, or a
//  shield without an integer periodMs of at least 1. Only a shield keeps its periodMs.
export const affixOf = (payload) =>
{
    if (!payload || !AFFIX_TYPES.includes(payload.type) || !validAmount(payload.amount))
    {
        return null;
    }

    if (payload.type !== HIT_SHIELD)
    {
        return { type: payload.type, amount: payload.amount, periodMs: null };
    }

    if (!validAmount(payload.periodMs))
    {
        return null;
    }

    return { type: payload.type, amount: payload.amount, periodMs: payload.periodMs };
};

//  The stats of a monster with `affix`: Blindado adds its amount to the one defense (defenseOf); any other affix or none keeps `stats`
export const affixDefense = (stats, affix) =>
{
    if (affix?.type !== ARMORED)
    {
        return stats;
    }

    return { ...stats, defense: defenseOf(stats) + affix.amount };
};

export class AffixState
{
    constructor (affix)
    {
        this.affix = affix;
        this.charges = affix.type === HIT_SHIELD ? affix.amount : 0;
        this.rechargeMs = 0;
    }

    //  The damage of a strike that lands through the affix
    land (damage)
    {
        const { type, amount, periodMs } = this.affix;

        if (type === SHELL)
        {
            return Math.max(0, damage - amount);
        }

        if (type === HIT_SHIELD && this.charges > 0)
        {
            this.charges -= 1;

            if (this.charges === 0)
            {
                this.rechargeMs = periodMs;
            }

            return 0;
        }

        return damage;
    }

    //  `ms` of countdown time pass: a broken shield recharges, a regenerating monster heals. Returns the health added to `monster`.
    advance (ms, monster)
    {
        const { type, amount } = this.affix;

        if (type === HIT_SHIELD && this.charges === 0)
        {
            this.rechargeMs -= ms;

            if (this.rechargeMs <= 0)
            {
                this.charges = amount;
                this.rechargeMs = 0;
            }

            return 0;
        }

        if (type !== REGENERATION || monster.dead || monster.health >= monster.maxHealth)
        {
            return 0;
        }

        const before = monster.health;
        const heal = monster.maxHealth * amount / 10000 * ms / 1000;

        monster.health = Math.min(monster.maxHealth, Math.round((before + heal) * HEALTH_PRECISION) / HEALTH_PRECISION);

        return Math.round((monster.health - before) * HEALTH_PRECISION) / HEALTH_PRECISION;
    }
}

//  The chip text of `state` (spec Player-Facing Texts)
export const affixText = (state) =>
{
    const { type, amount } = state.affix;

    if (type === SHELL)
    {
        return `Carapaça: -${formatShort(amount)} por golpe`;
    }

    if (type === HIT_SHIELD)
    {
        return state.charges > 0
            ? `Escudo de golpes: ${state.charges}/${amount}`
            : `Escudo de golpes: volta em ${Math.ceil(state.rechargeMs / 1000)} s`;
    }

    if (type === REGENERATION)
    {
        return `Regeneração: ${String(amount / 100).replace('.', ',')}% da vida/s`;
    }

    return `Blindado: +${amount} de defesa`;
};
