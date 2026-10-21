//  The skill mechanics of the five heroes (spec hero-skills, Skill Mechanics table). Pure data: no Phaser.
//  A definition holds only the parts the skill uses:
//    hits           instant hits in order, { percent, armorPierce? } (percent of the click's base damage)
//    vsDarkness     multiplier of the hits against a DARKNESS monster
//    cast           { ms, hit } a delayed hit that is lost when its monster is gone; the hit is always critical
//    buff           { id, ms } on the player; debuff { id, ms } on the monster (both show a tag with the skill's label)
//    stunMs/rootMs  time the boss countdown stops
//    ticks          { id, percent, count, maxStacks? } damage once per second
//    countdownExtendMs  time added to the boss countdown at once
import { MAGICAL, PHYSICAL } from '../combat/damage';

const SECOND = 1000;

export const SKILLS = {
    kael: {
        1: { label: 'Corte Dimensional', cooldownMs: 20 * SECOND, damageType: PHYSICAL, hits: [ { percent: 1500, armorPierce: 30 } ] },
        2: { label: 'Investida do Baluarte', cooldownMs: 25 * SECOND, damageType: PHYSICAL, hits: [ { percent: 400 } ], stunMs: 3 * SECOND },
        3: { label: 'Brado Aterrador', cooldownMs: 30 * SECOND, damageType: PHYSICAL, hits: [], debuff: { id: 'brado', ms: 10 * SECOND } }
    },
    lyra: {
        1: { label: 'Flecha Dupla', cooldownMs: 8 * SECOND, damageType: PHYSICAL, hits: [ { percent: 300 }, { percent: 300 } ] },
        2: { label: 'Tiro Preciso', cooldownMs: 30 * SECOND, damageType: PHYSICAL, hits: [], cast: { ms: 2 * SECOND, hit: { percent: 3000 } } },
        3: { label: 'Ventos Ligeiros', cooldownMs: 40 * SECOND, damageType: PHYSICAL, hits: [], buff: { id: 'ventos', ms: 12 * SECOND } }
    },
    orina: {
        1: { label: 'Prisão de Espinhos', cooldownMs: 18 * SECOND, damageType: MAGICAL, hits: [], debuff: { id: 'prisao', ms: 2 * SECOND }, rootMs: 2 * SECOND },
        2: { label: 'Tempestade Arcana', cooldownMs: 35 * SECOND, damageType: MAGICAL, hits: [], ticks: { id: 'tempestade', percent: 200, count: 6 } },
        3: { label: 'Chuva de Meteoros', cooldownMs: 45 * SECOND, damageType: MAGICAL, hits: [ { percent: 2500 } ] }
    },
    seraphine: {
        1: { label: 'Bênção da Grande Árvore', cooldownMs: 30 * SECOND, damageType: MAGICAL, hits: [], buff: { id: 'bencao', ms: 15 * SECOND } },
        2: { label: 'Luz Divina', cooldownMs: 25 * SECOND, damageType: MAGICAL, hits: [ { percent: 800 } ], vsDarkness: 1.5 },
        3: { label: 'Carrilhão da Aurora', cooldownMs: 45 * SECOND, damageType: MAGICAL, hits: [], countdownExtendMs: 4 * SECOND }
    },
    vex: {
        1: { label: 'Bomba de Veneno', cooldownMs: 15 * SECOND, damageType: PHYSICAL, hits: [], ticks: { id: 'veneno', percent: 100, count: 8, maxStacks: 3 } },
        2: { label: 'Bomba de Fumaça', cooldownMs: 35 * SECOND, damageType: PHYSICAL, hits: [], buff: { id: 'fumaca', ms: 10 * SECOND } },
        3: { label: 'Golpe Sangrento', cooldownMs: 20 * SECOND, damageType: PHYSICAL, hits: [ { percent: 600 } ], ticks: { id: 'sangramento', percent: 150, count: 6 } }
    }
};

//  The definition of a hero's skill slot (1 to 3), or null when there is none
export const skillOf = (heroId, slot) => SKILLS[heroId]?.[slot] ?? null;
