//  The attribute lines of the leader for the Equipamento screen (spec equipment-ui): the numbers a click uses, from the same
//  `leaderAttacker` as the combat, without the combo and the skill buffs. Pure JavaScript: no Phaser.
//  `leader` is a hero of the heroes payload, `pieces` the pieces it wears and `talents` the list of the backend (or null).
import { leaderAttacker } from '../combat/leaderAttacker';
import { ELEMENT_LABELS } from '../heroes/heroes';
import { NO_PASSIVES } from '../heroes/team';
import { talentValue } from '../talents/talents';
import { bossTimeBonusMs } from './equipment';

//  At most one decimal without a trailing zero (a percent or a number of seconds)
const one = (value) => String(Math.round(value * 10) / 10);

//  At most two decimals without a trailing zero (the critical multiplier)
const two = (value) => String(Math.round(value * 100) / 100);

//  `passives`: the team passives that apply now (spec hero-team): Lyra in the critical chance, Kael in both time lines, Orina in the
//  defense break line and Vex alone in the critical resistance break line (no talent adds chapter boss time or breaks the critical
//  resistance since talent-tree-rework)
export const leaderStats = ({ leader, pieces = [], talents = null, passives = NO_PASSIVES }) =>
{
    const attacker = leaderAttacker({ leader, pieces, talents, passives });
    const equipmentSeconds = bossTimeBonusMs(pieces) / 1000 + passives.bossTimeMs / 1000;

    return [
        { id: 'element', text: `Elemento: ${ELEMENT_LABELS[leader.element]}` },
        { id: 'clickDamage', text: `Dano de clique: ${attacker.baseDamage.toFixed(1)}` },
        { id: 'critChance', text: `Chance de crítico: ${one(attacker.critChance)}%` },
        { id: 'critDamage', text: `Dano crítico: x${two(attacker.critMultiplier)}` },
        { id: 'armorPierce', text: `Perfuração de armadura: ${one(attacker.armorPierce ?? 0)}%` },
        { id: 'bossDamage', text: `Dano em chefes: ${one(attacker.bossDamage ?? 0)}%` },
        { id: 'minibossTime', text: `Tempo extra de miniboss: ${one(equipmentSeconds + talentValue(talents, 'MINIBOSS_TIME'))}s` },
        { id: 'bossTime', text: `Tempo extra de chefe: ${one(equipmentSeconds)}s` },
        { id: 'breakDefense', text: `Quebra de defesa: ${talentValue(talents, 'PHYSICAL_BREAK') + passives.defenseBreak}` },
        { id: 'breakCrit', text: `Quebra de resistência a crítico: ${passives.critResistBreak}` }
    ];
};
