//  The damage of a click, a skill hit and a skill tick under the running effects. Pure JavaScript: no Phaser.
//  `buffs` and `debuffs` are lists of the ids of the running effects: ventos, bencao and fumaca on the player; brado and prisao on the monster.
//  `attacker` is the click attacker of the leader (element, base damage, critical chance, armor pierce and boss damage of its pieces).
import { calculateDamage, MAGICAL, PHYSICAL } from '../combat/damage';

const VENTOS_CLICK_PERCENT = 50;
const BENCAO_CLICK_PERCENT = 25;
const BENCAO_PHYSICAL = 1.3;
const FUMACA_CRIT_POINTS = 15;
const BRADO_DEFENSE_POINTS = 30;
const PRISAO_MAGICAL = 1.25;

//  One strike: `percent` of the attacker's base damage through the click formula, then the modifiers of the effects
const strike = ({ attacker, percent = 100, damageType, armorPierce = 0, critChance, forceCritical = false, vsDarkness = 1, multiplier = 1, buffs, debuffs, defender, random, boss }) =>
{
    const hitter = {
        ...attacker,
        damageType,
        baseDamage: attacker.baseDamage * percent / 100,
        armorPierce: Math.min(100, (attacker.armorPierce ?? 0) + armorPierce),
        critChance: critChance ?? Math.min(100, attacker.critChance + (buffs.includes('fumaca') ? FUMACA_CRIT_POINTS : 0))
    };
    const target = debuffs.includes('brado') ? { ...defender, physicalDefense: Math.max(0, defender.physicalDefense - BRADO_DEFENSE_POINTS) } : defender;
    const { damage, critical } = calculateDamage({ attacker: hitter, defender: target, random, boss, forceCritical });
    const physicalBuff = damageType === PHYSICAL && buffs.includes('bencao') ? BENCAO_PHYSICAL : 1;
    const magicalDebuff = damageType === MAGICAL && debuffs.includes('prisao') ? PRISAO_MAGICAL : 1;
    const darkness = defender.element === 'DARKNESS' ? vsDarkness : 1;

    return { damage: damage * physicalBuff * magicalDebuff * darkness * multiplier, critical };
};

//  A click: the click bonuses of Ventos Ligeiros and Bênção add up and multiply the base damage. `multiplier` is the combo (1.1 for +10 %),
//  applied to the final damage; `forceCritical` makes the hit critical whatever the roll (the double click of Lyra).
export const clickDamage = ({ attacker, buffs, debuffs, defender, random, boss, multiplier = 1, forceCritical = false }) =>
{
    const bonus = (buffs.includes('ventos') ? VENTOS_CLICK_PERCENT : 0) + (buffs.includes('bencao') ? BENCAO_CLICK_PERCENT : 0);

    return strike({ attacker, percent: 100 + bonus, damageType: PHYSICAL, buffs, debuffs, defender, random, boss, multiplier, forceCritical });
};

//  A skill hit of `percent` % of the base damage
export const hitDamage = (options) => strike(options);

//  One tick of a damage over time: never critical
export const tickDamage = ({ attacker, percent, damageType, buffs, debuffs, defender, boss }) =>
    strike({ attacker, percent, damageType, critChance: 0, buffs, debuffs, defender, random: () => 0, boss }).damage;
