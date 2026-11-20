//  The attacker of one ally hit (spec hero-team, Ally Damage): Ally Base (1 + weapon click damage, times the click damage percent of its
//  own pieces) times the star multiplier and the team factor, the element of the leader, the armor pierce and boss damage of its pieces,
//  never critical, and the `darknessDamagePct` of a staff it wears (spec black-awareness-staff). Pure JavaScript: no Phaser.
import { attackerFor } from '../equipment/equipment';
import { PLAYER } from './damage';

export const ALLY_STAR_MULTIPLIER = Object.freeze([ 2, 4, 6, 8, 10, 12, 14, 16, 18, 20 ]);

//  The multiplier of `stars` 0 to 9; anything else reads the 0-star multiplier
export const allyStarMultiplier = (stars) => ALLY_STAR_MULTIPLIER[stars] ?? ALLY_STAR_MULTIPLIER[0];

export const allyAttacker = ({ ally, pieces = [], leaderElement, allyFactor = 1 }) =>
{
    const worn = attackerFor({ ...PLAYER, element: leaderElement }, pieces);

    return {
        element: leaderElement,
        baseDamage: worn.baseDamage * allyStarMultiplier(ally.stars) * allyFactor,
        critChance: 0,
        critMultiplier: 1,
        armorPierce: worn.armorPierce ?? 0,
        bossDamage: worn.bossDamage ?? 0,
        ...(worn.darknessDamagePct ? { darknessDamagePct: worn.darknessDamagePct } : {})
    };
};

//  What the Equipe screen shows as `Dano: <n>/s`: the base of the attacker, before element, defense and boss factor
export const allyDamagePerSecond = ({ ally, pieces = [], allyFactor = 1 }) => allyAttacker({ ally, pieces, leaderElement: PLAYER.element, allyFactor }).baseDamage;
