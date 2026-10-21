//  The attacker of the leader's click and skills: its element on the default attacker, then every source of click power it has
//  (equipment pieces, the star bonus and the power talents). The combat and the attribute panel both read it, so their numbers cannot drift.
//  Pure JavaScript: no Phaser. `leader` is a hero of the heroes payload ({ element, stars }) or null before they load; `talents` is the list
//  of the backend or null before it loads.
import { attackerFor } from '../equipment/equipment';
import { starBonus } from '../heroes/starBonus';
import { addBonuses, talentAttackerBonus } from '../talents/talents';
import { PLAYER } from './damage';

export const leaderAttacker = ({ leader, pieces = [], talents = null }) =>
{
    const base = leader ? { ...PLAYER, element: leader.element } : PLAYER;

    return attackerFor(base, pieces, addBonuses(starBonus(leader?.stars ?? 0), talentAttackerBonus(talents)));
};
