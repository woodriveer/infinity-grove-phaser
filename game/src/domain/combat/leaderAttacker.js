//  The attacker of the leader's click and skills: its element on the default attacker, then every source of click power it has
//  (equipment pieces, the star bonus and the power talents). The combat and the attribute panel both read it, so their numbers cannot drift.
//  Pure JavaScript: no Phaser. `leader` is a hero of the heroes payload ({ element, stars }) or null before they load; `talents` is the list
//  of the backend or null before it loads.
import { attackerFor } from '../equipment/equipment';
import { starBonus } from '../heroes/starBonus';
import { NO_PASSIVES } from '../heroes/team';
import { addBonuses, talentAttackerBonus } from '../talents/talents';
import { PLAYER } from './damage';

//  `passives` are the team passives that apply now (spec hero-team); only `critChance` (Lyra) reaches the leader attacker
export const leaderAttacker = ({ leader, pieces = [], talents = null, passives = NO_PASSIVES }) =>
{
    const base = leader ? { ...PLAYER, element: leader.element } : PLAYER;
    const team = { clickDamageFlat: 0, clickDamagePct: 0, critChance: passives.critChance ?? 0, critDamagePct: 0 };

    return attackerFor(base, pieces, addBonuses(addBonuses(starBonus(leader?.stars ?? 0), talentAttackerBonus(talents)), team));
};
