import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Fire monsters (a fire click is neutral) of 1000 health with physical defense 20, and a miniboss that takes 30 s
const ARMORED = { element: 'FIRE', physicalDefense: 20, magicalDefense: 0, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};

const startGame = async (page, options = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER, ...options });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return menu;
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const dealt = async (page) => 1000 - await health(page);

test.describe('Talents in combat', () => {
    test('PHYSICAL_BREAK 5 lowers the defense of the monster: a click deals 0.85 instead of 0.8', async ({ page }) => {
        const menu = await startGame(page, { talents: { yan: { PHYSICAL_BREAK: 5 } } });

        await expect(page.locator('.enemy-stats')).toContainText('Physical def 15%');
        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(0.85, 5);
    });

    test('without talents the same click deals 0.8', async ({ page }) => {
        const menu = await startGame(page);

        await expect(page.locator('.enemy-stats')).toContainText('Physical def 20%');
        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(0.8, 5);
    });

    test('CLICK_DAMAGE 5 adds 15 % to a click', async ({ page }) => {
        const menu = await startGame(page, { talents: { yan: { CLICK_DAMAGE: 5 } } });

        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(1.15 * 0.8, 5);
    });

    test('MINIBOSS_TIME 5 gives a miniboss 40 s instead of 30', async ({ page }) => {
        await startGame(page, { talents: { yan: { MINIBOSS_TIME: 5 } }, progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } } });

        await expect(page.locator('.boss-timer')).toHaveText(/Time: (40|39)/);
    });
});
