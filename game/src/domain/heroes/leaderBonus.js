//  The leader bonuses the game applies (spec click-power). Only Lyra has one so far; the other four are a later feature.
//  Pure JavaScript: no Phaser.
export const LYRA_DOUBLE_CLICK_CHANCE = 30;

//  How many hits a click of `heroId` lands: Lyra rolls a double critical click once per click with `random` in [0, 1); any other hero
//  hits once and never touches `random`
export const clickHits = (heroId, random) => (heroId === 'lyra' && random() * 100 < LYRA_DOUBLE_CLICK_CHANCE ? 2 : 1);
