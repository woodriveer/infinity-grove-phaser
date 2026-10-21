//  The attacker of the leader's click and skills: its element on the default attacker, then every source of click power it has
//  (equipment pieces and the star bonus). The combat and the attribute panel both read it, so their numbers cannot drift.
//  Pure JavaScript: no Phaser. `leader` is a hero of the heroes payload ({ element, stars }) or null before they load.
import { attackerFor } from '../equipment/equipment';
import { starBonus } from '../heroes/starBonus';
import { PLAYER } from './damage';

export const leaderAttacker = ({ leader, pieces = [] }) =>
{
    const base = leader ? { ...PLAYER, element: leader.element } : PLAYER;

    return attackerFor(base, pieces, starBonus(leader?.stars ?? 0));
};
