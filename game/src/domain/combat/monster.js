export const DAMAGE_PER_CLICK = 1;
export const MONSTER_MAX_HEALTH = 10;

export class Monster
{
    constructor (maxHealth = MONSTER_MAX_HEALTH, level = 1)
    {
        this.maxHealth = maxHealth;
        this.level = level;
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

        this.health = Math.max(0, this.health - damage);

        return true;
    }

    respawn ()
    {
        this.health = this.maxHealth;
    }
}
