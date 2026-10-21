//  What the stars of the leader add to the click (spec click-power). Totals for the star count, not cumulative:
//  clickDamagePct is added to the click damage percent of the equipment, critDamagePct to the critical multiplier like CRIT_DAMAGE_PCT
//  (+20 is +0.2) and critChance is points of critical chance. Pure JavaScript: no Phaser.
const NO_BONUS = { clickDamagePct: 0, critChance: 0, critDamagePct: 0 };

export const STAR_BONUS = {
    0: NO_BONUS,
    1: { clickDamagePct: 10, critChance: 0, critDamagePct: 0 },
    2: { clickDamagePct: 20, critChance: 0, critDamagePct: 20 },
    3: { clickDamagePct: 40, critChance: 30, critDamagePct: 50 }
};

export const starBonus = (stars) => STAR_BONUS[stars] ?? NO_BONUS;
