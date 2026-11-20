import { elementMultiplier, FIRE } from './elements';
import { defenseOf } from './monster';
import { formatShort } from './numberFormat';

//  The attacker until characters exist: a fire clicker with a 10 % chance of a double-damage critical hit.
//  Chances and defenses are percentages.
export const PLAYER = { element: FIRE, baseDamage: 1, critChance: 10, critMultiplier: 2 };

//  What a click deals to `defender` ({ element, defense, critResistance }; `defenseOf` also reads an older payload). Every hit meets the
//  same defense: an attacker's `damageType` is ignored (spec unified-damage).
//  `random` returns a number in [0, 1); it decides the critical hit. `boss` is true against a miniboss or a chapter boss.
//  The attacker may carry `armorPierce` (percent of the defense ignored, at most 100) and `bossDamage` (percent more damage against a boss).
//  `forceCritical` makes the hit critical whatever the roll and the defender's critical resistance (the aimed shot).
//  A defense of 100 or more deals 0, never a negative damage. The result is not rounded.
export const calculateDamage = ({ attacker = PLAYER, defender, random, boss = false, forceCritical = false }) =>
{
    const defense = defenseOf(defender) * (1 - Math.min(100, attacker.armorPierce ?? 0) / 100);
    const critChance = attacker.critChance * (1 - defender.critResistance / 100);
    const critical = forceCritical || random() * 100 < critChance;
    const damage = attacker.baseDamage
        * elementMultiplier(attacker.element, defender.element)
        * Math.max(0, 1 - defense / 100)
        * (critical ? attacker.critMultiplier : 1)
        * (boss ? 1 + (attacker.bossDamage ?? 0) / 100 : 1);

    return { damage, critical };
};

//  The damage number on screen: at most one decimal, no trailing zero; from 1 000 the short format (spec campaign-chapters)
export const formatDamage = (damage) =>
{
    const rounded = Math.round(damage * 10) / 10;

    return rounded >= 1000 ? formatShort(rounded) : String(rounded);
};
