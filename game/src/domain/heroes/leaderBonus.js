//  The leader bonuses the game applies (spec click-power). Only Lyra has one so far; the other four are a later feature.
//  Pure JavaScript: no Phaser.
export const LYRA_DOUBLE_CLICK_CHANCE = 30;

//  The leader bonus the player reads: a bonus the game does not apply yet says so, so the screen promises nothing it does not do
export const leaderBonusText = (hero) => (hero.id === 'lyra' ? hero.leaderBonus : `${hero.leaderBonus} (em breve)`);

//  How many hits a click of `heroId` lands: Lyra rolls a double critical click once per click with `random` in [0, 1); any other hero
//  hits once and never touches `random`
export const clickHits = (heroId, random) => (heroId === 'lyra' && random() * 100 < LYRA_DOUBLE_CLICK_CHANCE ? 2 : 1);
