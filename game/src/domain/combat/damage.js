import { DARKNESS, elementMultiplier, FIRE } from './elements';
import { defenseOf } from './monster';
import { formatShort } from './numberFormat';

//  The attacker until characters exist: a fire clicker with a 10 % chance of a double-damage critical hit.
//  Chances and defenses are percentages.
export const PLAYER = { element: FIRE, baseDamage: 1, critChance: 10, critMultiplier: 2 };

//  The critical chance a strike really has against a resistance (spec talent-tree-rework): the resistance is subtracted, 0 to 100
export const effectiveCritChance = (critChance, critResistance) => Math.min(100, Math.max(0, critChance - critResistance));

//  The points of critical chance past 100 after the resistance; each one adds 1 % of critical damage to a critical strike
export const critOverflow = (critChance, critResistance) => Math.max(0, critChance - critResistance - 100);

//  What a click deals to `defender` ({ element, defense, critResistance }). Every hit meets the
//  same defense: an attacker's `damageType` is ignored (spec unified-damage).
//  `random` returns a number in [0, 1); it decides the critical hit, whose chance is the attacker's minus the defender's critical resistance
//  (`effectiveCritChance`); a critical strike adds the chance past 100 as critical damage (`critOverflow`). `boss` is true against a miniboss or a chapter boss.
//  The attacker may carry `armorPierce` (percent of the defense ignored, at most 100) and `bossDamage` (percent more damage against a boss).
//  The attacker may also carry `darknessDamagePct` (percent more damage against a DARKNESS defender, the Cajado da Consciência Negra).
//  `forceCritical` makes the hit critical whatever the roll and the defender's critical resistance (the aimed shot); it still adds the overflow.
//  A defense of 100 or more deals 0, never a negative damage. The result is not rounded.
export const calculateDamage = ({ attacker = PLAYER, defender, random, boss = false, forceCritical = false }) =>
{
    const defense = defenseOf(defender) * (1 - Math.min(100, attacker.armorPierce ?? 0) / 100);
    const resistance = defender.critResistance ?? 0;
    const critical = forceCritical || random() * 100 < effectiveCritChance(attacker.critChance, resistance);
    //  The Cajado da Consciência Negra (spec black-awareness-staff): `darknessDamagePct` percent more against a DARKNESS defender
    const darkness = defender.element === DARKNESS ? 1 + (attacker.darknessDamagePct ?? 0) / 100 : 1;
    const damage = attacker.baseDamage
        * elementMultiplier(attacker.element, defender.element)
        * Math.max(0, 1 - defense / 100)
        * (critical ? attacker.critMultiplier + critOverflow(attacker.critChance, resistance) / 100 : 1)
        * (boss ? 1 + (attacker.bossDamage ?? 0) / 100 : 1)
        * darkness;

    return { damage, critical };
};

//  The damage number on screen: at most one decimal, no trailing zero; from 1 000 the short format (spec campaign-chapters)
export const formatDamage = (damage) =>
{
    const rounded = Math.round(damage * 10) / 10;

    return rounded >= 1000 ? formatShort(rounded) : String(rounded);
};
