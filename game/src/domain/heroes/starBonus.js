//  What the stars of the leader add to the click (spec click-power). Totals for the star count, not cumulative:
//  clickDamagePct is added to the click damage percent of the equipment, critDamagePct to the critical multiplier like CRIT_DAMAGE_PCT
//  (+20 is +0.2) and critChance is points of critical chance. Pure JavaScript: no Phaser.
const NO_BONUS = { clickDamagePct: 0, critChance: 0, critDamagePct: 0 };

export const STAR_BONUS = {
    0: NO_BONUS,
    1: { clickDamagePct: 10, critChance: 0, critDamagePct: 0 },
    2: { clickDamagePct: 20, critChance: 0, critDamagePct: 20 },
    3: { clickDamagePct: 40, critChance: 30, critDamagePct: 50 },
    4: { clickDamagePct: 70, critChance: 35, critDamagePct: 75 },
    5: { clickDamagePct: 100, critChance: 40, critDamagePct: 100 },
    6: { clickDamagePct: 130, critChance: 45, critDamagePct: 125 },
    7: { clickDamagePct: 160, critChance: 50, critDamagePct: 150 },
    8: { clickDamagePct: 190, critChance: 55, critDamagePct: 175 },
    9: { clickDamagePct: 220, critChance: 60, critDamagePct: 200 }
};

export const starBonus = (stars) => STAR_BONUS[stars] ?? NO_BONUS;

//  The hero detail line (spec hero-ascension ASC-08): the non-zero parts of the row, '' when there is none
export const starPowerText = (stars) =>
{
    const { clickDamagePct, critChance, critDamagePct } = starBonus(stars);
    const parts = [
        ...(clickDamagePct ? [ `+${clickDamagePct}% de dano de clique` ] : []),
        ...(critChance ? [ `+${critChance} de chance de crítico` ] : []),
        ...(critDamagePct ? [ `+${critDamagePct}% de dano crítico` ] : [])
    ];

    return parts.length ? `Poder das estrelas: ${parts.join(', ')}` : '';
};
