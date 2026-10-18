import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  One stage whose phase monsters are nature (the fire player deals double) and whose miniboss is darkness with
//  defense 50: health is large enough that a few clicks never kill, so the damage can be read after each click.
const ELEMENTS_CHAPTER = {
    bossHealth: 100,
    bossTimeLimitMs: 60_000,
    boss: { element: 'DARKNESS', physicalDefense: 30, magicalDefense: 30, critResistance: 30 },
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 100, minibossTimeLimitMs: 60_000,
        monster: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
        miniboss: { element: 'DARKNESS', physicalDefense: 50, magicalDefense: 10, critResistance: 100 }
    } ]
};

const startGame = async (page, options) => {
    const menu = await openMainMenu(page, options);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');

    return menu;
};

const monsterHealth = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

test.describe('Elements', () => {
    test('shows the element and defenses of the monster, and a fire click deals double to nature', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, definition: ELEMENTS_CHAPTER });
        const menu = await startGame(page);

        await expect(page.locator('.enemy-stats')).toHaveText('Nature  Physical def 0%  Magical def 0%  Crit res 0%');
        await expect.poll(() => monsterHealth(page)).toBe(20);

        await menu.canvas.click();

        await expect.poll(() => monsterHealth(page)).toBe(18);
    });

    test('a critical roll doubles the click', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, definition: ELEMENTS_CHAPTER });
        const menu = await startGame(page, { random: 0 });

        await menu.canvas.click();

        await expect.poll(() => monsterHealth(page)).toBe(16);
    });

    test('a darkness miniboss with defense 50 takes 0.45 per click and never crits at resistance 100', async ({ page }) => {
        await mockBackend(page, {
            users: { yan: 'secret123' },
            definition: ELEMENTS_CHAPTER,
            progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } }
        });
        const menu = await startGame(page, { random: 0 });

        await expect(page.locator('.enemy-stats')).toHaveText('Darkness  Physical def 50%  Magical def 10%  Crit res 100%');
        await expect.poll(() => monsterHealth(page)).toBe(100);

        await menu.canvas.click();

        await expect.poll(() => monsterHealth(page)).toBe(99.55);
    });
});
