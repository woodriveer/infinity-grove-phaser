import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

const KILL_CLICKS = 10;

const syncCalls = (backend) => backend.calls.filter((call) => call.path === '/wallet/sync');

//  Logs in through the UI and starts the game with the click the welcome screen waits for
const startGame = async (page, { state = 'form' } = {}) => {
    const menu = await openMainMenu(page, { state });

    if (state === 'form')
    {
        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Welcome back, yan!');
    }

    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');

    return menu;
};

//  Any click on the canvas hits the monster; ten of them kill it
const killMonster = async (canvas) => {
    for (let i = 0; i < KILL_CLICKS; i++)
    {
        await canvas.click();
    }
};

test.describe('Monster drops', () => {
    test('a kill drops coins into the wallet text, syncs once, and the wallet survives a reload', async ({ page }) => {
        test.setTimeout(120_000);
        const backend = await mockBackend(page, { users: { yan: 'secret123' }, drops: [ 3, 1, 5, 2, 4 ] });
        const menu = await startGame(page);
        const wallet = page.locator('.wallet');

        await expect(wallet).toHaveText('Gold: 0 Silver: 0 Copper: 0');

        await killMonster(menu.canvas);

        await expect(wallet).toHaveText('Gold: 0 Silver: 0 Copper: 3');
        await expect.poll(() => syncCalls(backend).length, { timeout: 20_000 }).toBe(1);
        expect(syncCalls(backend)[0].body).toEqual({ kills: { 1: 1 } });
        expect(backend.wallets.get('yan').copper).toBe(3);

        await page.reload();
        await startGame(page, { state: 'welcome' });

        await expect(wallet).toHaveText('Gold: 0 Silver: 0 Copper: 3');
    });

    test('99 copper plus a drop of 2 shows 1 silver and 1 copper', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, wallets: { yan: 99 }, drops: [ 2 ] });
        const menu = await startGame(page);
        const wallet = page.locator('.wallet');
        await expect(wallet).toHaveText('Gold: 0 Silver: 0 Copper: 99');

        await killMonster(menu.canvas);

        await expect(wallet).toHaveText('Gold: 0 Silver: 1 Copper: 1');
    });
});
