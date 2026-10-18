export const DAMAGE_PER_CLICK = 1;
export const MONSTER_MAX_HEALTH = 10;

//  A monster without attributes: fire, no defense, no critical resistance
export const DEFAULT_STATS = { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 };

//  Fractional damage leaves float dust (10 - 0.1 x 100 is not 0); health is kept to 6 decimals so a monster can reach 0
const HEALTH_PRECISION = 1e6;

export class Monster
{
    constructor (maxHealth = MONSTER_MAX_HEALTH, level = 1, stats = DEFAULT_STATS)
    {
        this.maxHealth = maxHealth;
        this.level = level;
        this.stats = stats;
        this.health = maxHealth;
    }

    get dead ()
    {
        return this.health === 0;
    }

    //  Applies damage and returns whether it landed; a dead monster cannot be hit
    hit (damage = DAMAGE_PER_CLICK)
    {
        if (this.dead)
        {
            return false;
        }

        this.health = Math.max(0, Math.round((this.health - damage) * HEALTH_PRECISION) / HEALTH_PRECISION);

        return true;
    }

    respawn ()
    {
        this.health = this.maxHealth;
    }
}
