import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Kael holds a 1 star card (click damage +10 %: a click deals 1.1 and Corte Dimensional 16.5)
//  One stage of fire monsters with 100 health and no defense, so a skill damage and the HP text can be read exactly
const HUD_CHAPTER = {
    bossHealth: 100,
    bossTimeLimitMs: 60_000,
    boss: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 100, minibossHealth: 2, minibossTimeLimitMs: 60_000,
        monster: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
        miniboss: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 }
    } ]
};

const KAEL_ONE_STAR = { yan: { copies: { 'kael:1': 1 } } };

const startGame = async (page, options = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: HUD_CHAPTER, cards: KAEL_ONE_STAR, ...options });

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

test.describe('Combat HUD', () => {
    test('shows the chapter and the monster HP, which follows the damage', async ({ page }) => {
        const menu = await startGame(page);

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 100/100');

        await menu.canvas.click();

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 98.9/100');
    });

    test('draws the element wheel on screen and lets a click through to the monster', async ({ page }) => {
        const menu = await startGame(page);
        const wheel = page.getByTestId('element-wheel');
        const canvas = await page.locator('#game-container canvas').boundingBox();
        const box = await wheel.boundingBox();

        await expect(wheel).toBeVisible();
        await expect(wheel.locator('.wheel-arrow-label')).toHaveText([ 'x2', 'x2', 'x2' ]);
        await expect(wheel.locator('.wheel-vs-triad')).toHaveText('x1,8');
        await expect(wheel.locator('.wheel-pair-link')).toHaveText('x0,9');
        expect(box.x).toBeGreaterThanOrEqual(canvas.x);
        expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height);

        const before = await monsterHealth(page);

        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        expect(before - await monsterHealth(page)).toBeCloseTo(1.1, 5);
        await menu.canvas.hover();
    });

    test('shows the skill card on hover over a slot', async ({ page }) => {
        await startGame(page);

        await page.getByTestId('skill-slot-1').hover();

        const tooltip = page.getByTestId('skill-tooltip');

        await expect(tooltip).toBeVisible();
        await expect(tooltip.locator('.skill-name')).toHaveText('Corte Dimensional');
        await expect(tooltip.locator('.skill-cooldown')).toHaveText('Recarga: 20s');
        await expect(tooltip.locator('.skill-state')).toHaveText('Liberada');

        await page.getByTestId('skill-slot-2').hover();

        await expect(page.getByTestId('skill-tooltip').locator('.skill-state')).toHaveText('Bloqueada');
    });

    test('Q uses the skill of slot 1 and each slot shows its key', async ({ page }) => {
        await startGame(page);
        await expect.poll(() => monsterHealth(page)).toBe(100);
        await expect(page.getByTestId('skill-key-1')).toHaveText('Q');

        await page.keyboard.press('q');

        await expect.poll(() => monsterHealth(page)).toBe(83.5);
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-state', 'cooling');
    });

    test('lights a red dot on Equipamento when a piece drops and clears it when the screen opens', async ({ page }) => {
        const menu = await startGame(page, {
            progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } },
            equipmentDrops: [ { id: 'drop1', slot: 'WEAPON', rarity: 'RARE', baseClick: 4, refine: 0, affixes: [] } ]
        });

        await expect.poll(() => monsterHealth(page)).toBe(2);
        await expect(page.getByTestId('equipment-badge')).toBeHidden();

        await menu.canvas.click();
        await menu.canvas.click();
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').tick());

        await expect(page.getByTestId('card-notice')).toHaveText('Equipamento encontrado: Raro Arma');
        await expect(page.getByTestId('equipment-badge')).toBeVisible();

        await page.getByTestId('hud-equipment').click();

        await expect(page.getByTestId('equipment-badge')).toBeHidden();
    });
});
