//  The attribute lines of the leader for the Equipamento screen (spec equipment-ui): the numbers a click uses, from the same
//  `leaderAttacker` as the combat, without the combo and the skill buffs. Pure JavaScript: no Phaser.
//  `leader` is a hero of the heroes payload, `pieces` the pieces it wears and `talents` the list of the backend (or null).
import { leaderAttacker } from '../combat/leaderAttacker';
import { ELEMENT_LABELS } from '../heroes/heroes';
import { talentValue } from '../talents/talents';
import { bossTimeBonusMs } from './equipment';

//  At most one decimal without a trailing zero (a percent or a number of seconds)
const one = (value) => String(Math.round(value * 10) / 10);

//  At most two decimals without a trailing zero (the critical multiplier)
const two = (value) => String(Math.round(value * 100) / 100);

export const leaderStats = ({ leader, pieces = [], talents = null }) =>
{
    const attacker = leaderAttacker({ leader, pieces, talents });
    const equipmentSeconds = bossTimeBonusMs(pieces) / 1000;

    return [
        { id: 'element', text: `Elemento: ${ELEMENT_LABELS[leader.element]}` },
        { id: 'damageType', text: 'Tipo de dano: Físico' },
        { id: 'clickDamage', text: `Dano de clique: ${attacker.baseDamage.toFixed(1)}` },
        { id: 'critChance', text: `Chance de crítico: ${one(attacker.critChance)}%` },
        { id: 'critDamage', text: `Dano crítico: x${two(attacker.critMultiplier)}` },
        { id: 'armorPierce', text: `Perfuração de armadura: ${one(attacker.armorPierce ?? 0)}%` },
        { id: 'bossDamage', text: `Dano em chefes: ${one(attacker.bossDamage ?? 0)}%` },
        { id: 'minibossTime', text: `Tempo extra de miniboss: ${one(equipmentSeconds + talentValue(talents, 'MINIBOSS_TIME'))}s` },
        { id: 'bossTime', text: `Tempo extra de chefe: ${one(equipmentSeconds + talentValue(talents, 'BOSS_TIME'))}s` },
        { id: 'breakPhysical', text: `Quebra de defesa física: ${talentValue(talents, 'PHYSICAL_BREAK')}` },
        { id: 'breakMagical', text: `Quebra de defesa mágica: ${talentValue(talents, 'MAGICAL_BREAK')}` },
        { id: 'breakCrit', text: `Quebra de resistência a crítico: ${talentValue(talents, 'CRIT_RESIST_BREAK')}` }
    ];
};
