import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  One stage whose phase monsters are fire (a fire hit is neutral) with 100 health and no defense: a skill damage can be read exactly
const SKILLS_CHAPTER = {
    bossHealth: 100,
    bossTimeLimitMs: 60_000,
    boss: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 100, minibossHealth: 100, minibossTimeLimitMs: 60_000,
        monster: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
        miniboss: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 }
    } ]
};

//  Kael holds a one star card: his first skill, Corte Dimensional, is unlocked
const KAEL_ONE_STAR = { yan: { copies: { 'kael:1': 1 } } };

const startGame = async (page) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: SKILLS_CHAPTER, cards: KAEL_ONE_STAR });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'true');

    return menu;
};

const monsterHealth = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

test.describe('Hero skills', () => {
    test('the key 1 uses Corte Dimensional for 15 damage and starts its 20 s cooldown', async ({ page }) => {
        await startGame(page);
        await expect.poll(() => monsterHealth(page)).toBe(100);

        await page.keyboard.press('1');

        await expect.poll(() => monsterHealth(page)).toBe(85);
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-state', 'cooling');
        await expect(page.getByTestId('skill-slot-1').locator('.skill-slot-cooldown')).toHaveText('20s');
    });

    test('a second press while the skill cools does nothing, and the cooldown runs down', async ({ page }) => {
        await startGame(page);
        await expect.poll(() => monsterHealth(page)).toBe(100);

        await page.keyboard.press('1');
        await expect.poll(() => monsterHealth(page)).toBe(85);
        await page.keyboard.press('1');

        await expect(page.getByTestId('skill-slot-1').locator('.skill-slot-cooldown')).not.toHaveText('20s');
        expect(await monsterHealth(page)).toBe(85);
    });

    test('a click on the slot uses the skill without hitting the monster with a click', async ({ page }) => {
        await startGame(page);
        await expect.poll(() => monsterHealth(page)).toBe(100);

        await page.getByTestId('skill-slot-1').click();

        await expect.poll(() => monsterHealth(page)).toBe(85);
    });
});
