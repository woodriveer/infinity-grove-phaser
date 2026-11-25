import { test } from '@playwright/test';
import { ARMORED, REGENERATION, SHELL, SHIELD, affixChapter, advance, clickMonster, startFight } from '../e2e/support/affixFight';
import { mockBackend } from '../e2e/support/fakeBackend';
import { fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the early-game-rebalance review (.specs/features/early-game-rebalance/ui-review/): the monster affix chip of each type and state, the talent
//  cards with the new values and the 8-phase stage label. The fights are those of e2e/support/affixFight.js (loop asleep, time moves with advance()); nothing is stubbed.
const MINIBOSS = { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 };
const BOSS = { chapter: 1, stage: 1, encounter: 'CHAPTER_BOSS', phase: 1 };

const snap = async (page, testInfo, name) => {
    await page.waitForFunction(() => [ ...document.images ].every((img) => img.complete && img.naturalWidth > 0));
    await page.evaluate(() => window.__PHASER_GAME__.loop.wake());
    await page.waitForTimeout(80);
    await shot(page, testInfo, name);
    await page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
};

test('01 shell miniboss', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ affix: SHELL(6) }), progress: MINIBOSS });
    await snap(page, testInfo, '01-shell-miniboss');
});

test('02 and 03 shield', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ affix: SHIELD(10), minibossHealth: 1000 }), progress: MINIBOSS });
    await clickMonster(page, 3);
    await snap(page, testInfo, '02-shield-full');
    await clickMonster(page, 7);
    await advance(page, 100);
    await snap(page, testInfo, '03-shield-down');
});

test('04 regeneration miniboss', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ affix: REGENERATION(50) }), progress: MINIBOSS });
    await snap(page, testInfo, '04-regeneration-miniboss');
});

test('05 regeneration boss', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ bossAffix: REGENERATION(25) }), progress: BOSS });
    await snap(page, testInfo, '05-regeneration-boss');
});

test('06 armored miniboss', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ affix: ARMORED(20), defense: 33 }), progress: MINIBOSS });
    await snap(page, testInfo, '06-armored-miniboss');
});

test('07 shell 1200', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ affix: SHELL(1200), minibossHealth: 100_000 }), progress: MINIBOSS });
    await snap(page, testInfo, '07-shell-1200');
});

test('08 no affix', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter(), progress: MINIBOSS });
    await snap(page, testInfo, '08-no-affix');
});

test('09 boss affix chapter 11', async ({ page }, testInfo) => {
    await startFight(page, { definition: affixChapter({ bossAffix: SHIELD(30) }), progress: { ...BOSS, chapter: 11 } });
    await snap(page, testInfo, '09-boss-affix-chapter-11');
});

const monster = { element: 'FIRE', defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance: 0 };
const talentGame = async (page, talents, progress) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: {
            bossHealth: 1000, bossTimeLimitMs: 90_000, boss: monster,
            stages: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, phasesPerStage: 8, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 45_000, monster, miniboss: monster }))
        },
        talents: { yan: talents },
        ...(progress && { progress: { yan: progress } })
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await menu.canvas.click();
    await page.waitForFunction(() => window.__PHASER_GAME__.scene.getScene('ClickerGame')?.monster?.health > 0);
    await page.getByTestId('skill-slot-1').waitFor();
};
const openCard = async (page, id) => {
    await page.getByTestId('hud-talents').click();
    await page.getByTestId('talent-tree').waitFor();
    await page.getByTestId(`talent-${id}`).click();
    await page.getByTestId(`talent-effect-${id}`).waitFor();
    await page.waitForTimeout(300);
};

test('10 talent card flat', async ({ page }, testInfo) => {
    await talentGame(page, { CLICK_FLAT_DAMAGE: 10 });
    await openCard(page, 'CLICK_FLAT_DAMAGE');
    await shot(page, testInfo, '10-talent-card-flat');
});

test('11 talent card crit', async ({ page }, testInfo) => {
    await talentGame(page, { CRIT_CHANCE: 10, CRIT_DAMAGE: 10 });
    await openCard(page, 'CRIT_CHANCE');
    await shot(page, testInfo, '11-talent-card-crit-chance');
    await page.getByTestId('talent-CRIT_DAMAGE').click();
    await page.waitForTimeout(300);
    await shot(page, testInfo, '11-talent-card-crit-damage');
});

//  The chapter 1 fixture (8 phases, miniboss 45 s, chapter boss 90 s) as the game shows it
test('12 stage label and timers', async ({ page }, testInfo) => {
    await talentGame(page, {}, { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1 });
    await snap(page, testInfo, '12-stage-label-8-phases');
});

test('13 chapter 1 miniboss timer', async ({ page }, testInfo) => {
    await talentGame(page, {}, MINIBOSS);
    await snap(page, testInfo, '13-chapter-1-miniboss-45s');
});

test('14 chapter 1 boss timer', async ({ page }, testInfo) => {
    await talentGame(page, {}, BOSS);
    await snap(page, testInfo, '14-chapter-1-boss-90s');
});
