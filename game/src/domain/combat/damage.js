import { elementMultiplier, FIRE } from './elements';

export const PHYSICAL = 'PHYSICAL';
export const MAGICAL = 'MAGICAL';

//  The attacker until characters exist: a fire, physical clicker with a 10 % chance of a double-damage critical hit.
//  Chances and defenses are percentages.
export const PLAYER = { element: FIRE, damageType: PHYSICAL, baseDamage: 1, critChance: 10, critMultiplier: 2 };

//  What a click deals to `defender` ({ element, physicalDefense, magicalDefense, critResistance }).
//  `random` returns a number in [0, 1); it decides the critical hit. The result is not rounded.
export const calculateDamage = ({ attacker = PLAYER, defender, random }) =>
{
    const defense = attacker.damageType === MAGICAL ? defender.magicalDefense : defender.physicalDefense;
    const critChance = attacker.critChance * (1 - defender.critResistance / 100);
    const critical = random() * 100 < critChance;
    const damage = attacker.baseDamage
        * elementMultiplier(attacker.element, defender.element)
        * (1 - defense / 100)
        * (critical ? attacker.critMultiplier : 1);

    return { damage, critical };
};

//  The damage number on screen: at most one decimal, no trailing zero
export const formatDamage = (damage) => String(Math.round(damage * 10) / 10);
