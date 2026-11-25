import { expect } from '@playwright/test';
import { mockBackend } from './fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './game';

//  A fight against a monster with an affix (spec early-game-rebalance), shared by monsterAffixes.spec.js and monsterAffixesHud.spec.js. The chapter is small: phase monsters of 10
//  health, one miniboss of 100 health and 120 s with defense 0 and critical resistance 100 (a blank Kael click deals exactly 1, never critical), a chapter boss of 1000 health.
//  The auto click is switched off and the Phaser loop is put to sleep once the game has loaded: time moves only with advance(page, ms) and every click is a call of the
//  scene (the pattern of minibossAdds.spec.js, L-112).
export const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

//  A monster of the payload: the defense and both legacy columns equal
export const monsterOf = (element = 'FIRE', defense = 0, critResistance = 100) => ({ element, defense, physicalDefense: defense, magicalDefense: defense, critResistance });

export const SHIELD = (amount) => ({ type: 'HIT_SHIELD', amount, periodMs: 6000 });
export const SHELL = (amount) => ({ type: 'SHELL', amount, periodMs: null });
export const REGENERATION = (amount) => ({ type: 'REGENERATION', amount, periodMs: null });
export const ARMORED = (amount) => ({ type: 'ARMORED', amount, periodMs: null });

//  `affix` is the miniboss affix of stage 1 and `bossAffix` the chapter boss one; the string 'omit' leaves the field out of the payload, as the backend of before the affixes does
export const affixChapter = ({
    affix = null, bossAffix = null, element = 'FIRE', defense = 0, critResistance = 100, minibossHealth = 100, minibossTimeLimitMs = 120_000, bossHealth = 1000
} = {}) => ({
    bossHealth,
    bossTimeLimitMs: 120_000,
    boss: monsterOf(element, defense, critResistance),
    ...(bossAffix !== 'omit' && { bossAffix }),
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 10, minibossHealth, minibossTimeLimitMs,
        monster: monsterOf(element, 0, critResistance), miniboss: monsterOf(element, defense, critResistance),
        ...(affix !== 'omit' && { minibossAffix: affix })
    } ]
});

export const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
export const health = (page) => scene(page, '(s) => s.monster?.health');
export const advance = (page, ms) => page.evaluate((delta) => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, delta), ms);

//  Stops the loop and puts the ally clock back at 1000 ms, as it stands when a monster appears
export const freeze = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__;

    game.loop.sleep();
    game.scene.getScene('ClickerGame').allies.untilTickMs = 1000;
});

//  The body of the miniboss and of the chapter boss: a click in its middle hits it (MONSTER of ClickerGame.js)
export const MONSTER_CENTRE = [ 670, 440 ];
export const clickMonster = (page, times = 1) => page.evaluate(([ x, y, count ]) => {
    const s = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    for (let i = 0; i < count; i++)
    {
        s.hitMonster({ x, y });
    }
}, [ ...MONSTER_CENTRE, times ]);

//  The gold damage numbers on the canvas (a normal strike), oldest first; they stay while the loop sleeps
export const damageTexts = (page) => scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "#ffd35c").map((o) => o.text)');

export const chip = (page) => page.getByTestId('affix-chip');
export const hp = (page) => page.getByTestId('monster-hp');

//  Logs in with every hero owned (one blank card each; the leader holds one card of `stars`), at `progress`, and waits for the first monster. `definition` is the payload of the chapter
//  (`affixChapter()` by default), `team` the starting team (the allies need chapter 5 and `cleared: [5]`), `stop` puts the loop to sleep (false for a test that needs real frames) and `monster: false` skips the wait for the first monster (a completed campaign shows none).
export const startFight = async (page, {
    definition = affixChapter(), progress = { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 }, leader = 'kael', stars = 0, talents, team, cleared = [ 5 ], stop = true, monster = true, roll
} = {}) => {
    const copies = Object.fromEntries(HERO_IDS.map((id) => [ `${id}:${id === leader ? stars : 0}`, 1 ]));
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition,
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: progress },
        team: team ? { yan: team } : {},
        ...(talents && { talents: { yan: talents } })
    });

    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    if (monster)
    {
        await expect.poll(() => health(page)).toBeGreaterThan(0);
    }

    if (stop)
    {
        await freeze(page);
    }

    return { backend: handle, menu };
};
