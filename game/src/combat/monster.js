export const DAMAGE_PER_CLICK = 1;
export const MONSTER_MAX_HEALTH = 10;

export class Monster
{
    constructor (maxHealth = MONSTER_MAX_HEALTH)
    {
        this.maxHealth = maxHealth;
        this.health = maxHealth;
    }

    //  Applies damage; a monster that reaches 0 respawns at once with full health
    hit (damage = DAMAGE_PER_CLICK)
    {
        this.health = Math.max(0, this.health - damage);

        if (this.health === 0)
        {
            this.health = this.maxHealth;
        }
    }
}
