//  The monsters of one encounter (spec miniboss-adds): the main monster, its adds in slot order and the target the player picked. A
//  living add raises the main's one defense by its buff, at most MAX_GUARDED_DEFENSE. Pure JavaScript: no Phaser.
import { DEFAULT_STATS, defenseOf, Monster } from './monster';

export const MAX_GUARDED_DEFENSE = 2000;
export const MAIN_NAME = 'Miniboss';
export const addName = (slot) => `Lacaio ${slot}`;

//  The defense of a main monster guarded by `bonus` points: capped at MAX_GUARDED_DEFENSE once there is a bonus, unchanged without one.
//  From 100 on a hit deals 0 (calculateDamage), so the miniboss takes no damage until enough adds die.
export const guardedDefense = (defense, bonus) => (bonus > 0 ? Math.min(defense + bonus, MAX_GUARDED_DEFENSE) : defense);

export class Fight
{
    //  `adds` are the entries of `addsOf` ({ health, defenseBuff, stats }); each becomes a Monster with no drop rule
    constructor (main, adds = [])
    {
        this.main = main;
        this.adds = adds.map((add, index) => ({
            slot: index + 1, name: addName(index + 1), defenseBuff: add.defenseBuff, monster: new Monster(add.health, null, add.stats ?? DEFAULT_STATS)
        }));
        this.chosen = main;
    }

    get hasAdds () { return this.adds.length > 0; }

    livingAdds () { return this.adds.filter((add) => !add.monster.dead); }

    livingAddMonsters () { return this.livingAdds().map((add) => add.monster); }

    //  The monster the auto click and the allies hit: the chosen one while it lives, else the main (also once the main is dead)
    get target ()
    {
        if (this.chosen.dead)
        {
            this.chosen = this.main;
        }

        return this.chosen;
    }

    //  Makes `monster` the target when it is the main or a living add of this fight; returns whether it did
    choose (monster)
    {
        if (monster !== this.main && !this.livingAdds().some((add) => add.monster === monster))
        {
            return false;
        }

        this.chosen = monster;

        return true;
    }

    addOf (monster) { return this.adds.find((add) => add.monster === monster) ?? null; }

    nameOf (monster) { return monster === this.main ? MAIN_NAME : (this.addOf(monster)?.name ?? null); }

    defenseBonus () { return this.livingAdds().reduce((sum, add) => sum + add.defenseBuff, 0); }

    //  The stats a hit on `monster` meets before the breaks: the main with its guarded defense, any other monster its own stats
    statsOf (monster)
    {
        if (monster !== this.main)
        {
            return monster.stats;
        }

        const bonus = this.defenseBonus();

        return bonus > 0 ? { ...monster.stats, defense: guardedDefense(defenseOf(monster.stats), bonus) } : monster.stats;
    }
}
