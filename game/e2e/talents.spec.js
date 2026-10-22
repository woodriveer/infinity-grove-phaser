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

    test('CLICK_DAMAGE 5 adds 25 % to a click', async ({ page }) => {
        const menu = await startGame(page, { talents: { yan: { CLICK_DAMAGE: 5 } } });

        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(1.25 * 0.8, 5);
    });

    test('MINIBOSS_TIME 5 gives a miniboss 40 s instead of 30', async ({ page }) => {
        await startGame(page, { talents: { yan: { MINIBOSS_TIME: 5 } }, progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } } });

        await expect(page.locator('.boss-timer')).toHaveText(/Time: (40|39)/);
    });
});

test.describe('Talentos screen', () => {
    test('buying a level with a point shows Nível 1/10, spends the point and counts from the next click', async ({ page }) => {
        const menu = await startGame(page, { talentPoints: { yan: 1 } });

        await page.getByTestId('hud-talents').click();

        await expect(page.locator('.hero-title')).toHaveText('Talentos');
        await expect(page.locator('.talent-branch-title')).toHaveText([ 'Tempo', 'Quebra de defesa', 'Poder do clique', 'Combo' ]);
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 1');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveText('Efeito: nenhum');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toHaveText('Melhorar (1 ponto)');

        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();

        await expect(page.getByTestId('talent-level-CLICK_DAMAGE')).toHaveText('Nível 1/10');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveText('Efeito: +5%');
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 0');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toBeDisabled();

        await page.getByTestId('hero-close').click();
        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(1.05 * 0.8, 5);
    });

    test('every button is disabled with 0 points even when the wallet is rich', async ({ page }) => {
        await startGame(page, { wallets: { yan: 1_000_000 } });

        await page.getByTestId('hud-talents').click();

        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 0');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toBeDisabled();
        await expect(page.getByTestId('talent-upgrade-COMBO')).toBeDisabled();
    });

    test('a talent already at level 10 shows Nível máximo and no button', async ({ page }) => {
        await startGame(page, { talents: { yan: { CLICK_DAMAGE: 10 } } });

        await page.getByTestId('hud-talents').click();

        await expect(page.getByTestId('talent-max-CLICK_DAMAGE')).toHaveText('Nível máximo');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveText('Efeito: +50%');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toHaveCount(0);
    });

    test('draws a mark in place of the icons while the art does not exist', async ({ page }) => {
        await startGame(page);

        await page.getByTestId('hud-talents').click();

        await expect(page.locator('[data-testid="talent-CLICK_DAMAGE"] .icon-fallback')).toBeVisible();
        await expect(page.locator('[data-testid="talent-COMBO"] .icon-fallback')).toBeVisible();
    });

    test('pauses the fight while the window is open', async ({ page }) => {
        await startGame(page);

        await page.getByTestId('hud-talents').click();
        await expect(page.locator('.hero-panel')).toBeVisible();

        expect(await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').paused)).toBe(true);
    });
});

test.describe('Talent points and the combo talent', () => {
    const rapidClicks = async (menu, times) => {
        for (let i = 0; i < times; i++) {
            await menu.canvas.click();
        }
    };

    test('without COMBO the combo HUD stays empty and every click deals the same', async ({ page }) => {
        const menu = await startGame(page);

        await rapidClicks(menu, 11);

        await expect(page.getByTestId('combo-hud')).toHaveText('');
        expect(await dealt(page)).toBeCloseTo(11 * 0.8, 5);
    });

    test('COMBO 2 caps a streak of 30 clicks at +10%', async ({ page }) => {
        const menu = await startGame(page, { talents: { yan: { COMBO: 2 } } });

        await rapidClicks(menu, 30);

        await expect(page.getByTestId('combo-hud')).toHaveText('Combo x30 · +10%');
    });

    test('a first clear pays a point that buys a COMBO level: Nível 1/10, Efeito: +5% and 0 points left', async ({ page }) => {
        const menu = await startGame(page);

        //  Phase 1 of stage 1 has a monster of 1000 health; a skill-less kill is long, so clear it through the scene
        await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');

            scene.monster.health = 0.01;
        });
        await menu.canvas.click();
        //  The report leaves with the 10 s tick; run it now
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').tick());
        await expect(page.getByTestId('card-notice')).toHaveText('+1 ponto de talento');

        await page.getByTestId('hud-talents').click();
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 1');
        await page.getByTestId('talent-upgrade-COMBO').click();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');
        await expect(page.getByTestId('talent-effect-COMBO')).toHaveText('Efeito: +5%');
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 0');
        await expect(page.getByTestId('talent-upgrade-COMBO')).toBeDisabled();
    });
});
