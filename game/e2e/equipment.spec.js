import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  One stage that a fire click clears fast: phase monsters of 20 health and a nature miniboss of 2 (fire hits nature for double)
const SMALL_CHAPTER = {
    bossHealth: 100,
    bossTimeLimitMs: 60_000,
    boss: { element: 'DARKNESS', physicalDefense: 30, magicalDefense: 30, critResistance: 30 },
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 2, minibossTimeLimitMs: 60_000,
        monster: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
        miniboss: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 }
    } ]
};

const WEAPON = { id: 'w1', slot: 'WEAPON', rarity: 'RARE', baseClick: 3, refine: 0, affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId: null };
const RING = { id: 'r1', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [ { type: 'CLICK_DAMAGE_PCT', base: 7 } ], heroId: null };

const startGame = async (page, options) => {
    const menu = await openMainMenu(page, options);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return menu;
};

const monsterHealth = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const walletText = (page) => page.locator('.wallet');

test.describe('Equipment', () => {
    test('the Equipamento button sits with the other six inside the game and opens an empty screen', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await startGame(page);

        const canvas = await page.locator('#game-container canvas').boundingBox();
        const hud = await page.locator('.hero-hud').boundingBox();

        await expect(page.locator('.hero-hud button')).toHaveCount(7);
        await expect(page.getByTestId('hud-equipment')).toHaveText('Equipamento');
        expect(hud.y).toBeGreaterThanOrEqual(canvas.y);
        expect(hud.y + hud.height).toBeLessThanOrEqual(canvas.y + canvas.height);

        await page.getByTestId('hud-equipment').click();

        await expect(page.locator('.hero-title')).toHaveText('Equipamento');
        await expect(page.getByTestId('equipment-empty')).toHaveText('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
    });

    test('a weapon worn by the leader adds its click damage to every click', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, equipment: { yan: [ WEAPON ] } });
        const menu = await startGame(page);
        const before = await monsterHealth(page);

        await menu.canvas.click();
        expect(before - await monsterHealth(page)).toBe(1);

        await page.getByTestId('hud-equipment').click();
        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toBeDisabled();
        await page.getByTestId('equip-piece-w1').click();
        await expect(page.getByTestId('piece-line-0')).toHaveText('Dano de clique: 3.0');
        await expect(page.getByTestId('piece-worn')).toHaveText('Na mochila');
        await page.getByTestId('piece-equip-kael').click();

        await expect(page.getByTestId('piece-worn')).toHaveText('Equipado em Kael Raizférrea');

        await page.getByTestId('hero-close').click();
        //  The combo of the first click lapses after 1.5 s of play, so the next click is a plain one
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, 1600));
        const worn = await monsterHealth(page);
        await menu.canvas.click();

        expect(worn - await monsterHealth(page)).toBe(4);
    });

    test('refining spends copper, raises the level and updates the wallet and the next cost', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, wallets: { yan: 600 }, equipment: { yan: [ RING ] } });
        await startGame(page);
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 6 Copper: 0');

        await page.getByTestId('hud-equipment').click();
        await page.getByTestId('equip-piece-r1').click();
        await expect(page.getByTestId('piece-refine')).toHaveText('Refinar (5 prata)');
        await page.getByTestId('piece-refine').click();

        await expect(page.locator('.hero-name')).toHaveText('Comum Anel +1');
        await expect(page.getByTestId('piece-line-0')).toHaveText('Dano de clique +7%');
        await expect(page.getByTestId('piece-refine')).toHaveText('Refinar (8 prata 50 cobre)');
        await expect(page.getByTestId('piece-refine')).toBeDisabled();
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 1 Copper: 0');
    });

    test('selling a piece adds its price to the wallet and takes it out of the bag', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, wallets: { yan: 50 }, equipment: { yan: [ RING ] } });
        await startGame(page);

        await page.getByTestId('hud-equipment').click();
        await page.getByTestId('equip-piece-r1').click();
        await expect(page.getByTestId('piece-sell')).toHaveText('Vender (1 prata)');
        await page.getByTestId('piece-sell').click();

        await expect(page.getByTestId('equipment-empty')).toBeVisible();
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 1 Copper: 50');
    });

    test('a piece dropped by a won miniboss shows the notice and joins the bag', async ({ page }) => {
        await mockBackend(page, {
            users: { yan: 'secret123' },
            definition: SMALL_CHAPTER,
            progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } },
            equipmentDrops: [ { id: 'drop1', slot: 'WEAPON', rarity: 'RARE', baseClick: 4, refine: 0, affixes: [ { type: 'BOSS_TIME_SECONDS', base: 2 } ] } ]
        });
        const menu = await startGame(page);
        await expect.poll(() => monsterHealth(page)).toBe(2);

        await menu.canvas.click();
        //  The report leaves with the 10 s tick; run it now
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').tick());

        await expect(page.getByTestId('card-notice')).toHaveText('Equipamento encontrado: Raro Arma');
        await expect(page.getByTestId('card-notice')).toBeHidden({ timeout: 8_000 });

        await page.getByTestId('hud-equipment').click();

        await expect(page.getByTestId('equip-piece-drop1')).toHaveAttribute('aria-label', 'Raro Arma +0');
    });
});
