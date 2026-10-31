import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the bulk-sell review (.specs/features/bulk-sell/ui-review/). The sale is stubbed here with page.route
//  (POST /equipment/sell) so these shots do not depend on the sell route of the fake backend.
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

const SLOTS = [ 'WEAPON', 'ARMOR', 'RING', 'AMULET' ];
const WORN = [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('w2', 'ARMOR', 'EPIC', 2, 'kael'), piece('w3', 'RING', 'UNCOMMON', 0, 'lyra') ];
const BAG_RARITIES = [ 'COMMON', 'COMMON', 'COMMON', 'COMMON', 'UNCOMMON', 'UNCOMMON', 'UNCOMMON', 'RARE', 'RARE', 'RARE', 'EPIC', 'EPIC', 'LEGENDARY', 'COMMON' ];
const BAG = BAG_RARITIES.map((rarity, index) => piece(`b${index + 1}`, SLOTS[index % 4], rarity, index % 3));
const START_COPPER = 50;
const coins = (copper) => ({ gold: Math.floor(copper / 10_000), silver: Math.floor(copper / 100) % 100, copper: copper % 100 });

test('bulk sell', async ({ page }, testInfo) => {
    await mockBackend(page, {
        users: { yan: 'secret123' }, wallets: { yan: START_COPPER }, cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } },
        equipment: { yan: [ ...WORN, ...BAG ] }
    });

    //  Remembers the last bag the backend sent, to answer the stubbed sale with the remaining pieces
    let lastBag = { capacity: 100, pieces: [] };

    page.on('response', async (response) => {
        if (response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/equipment') {
            lastBag = await response.json();
        }
    });

    await page.route('**/api/equipment/sell', async (route) => {
        const ids = route.request().postDataJSON().pieceIds;
        const sold = lastBag.pieces.filter((candidate) => ids.includes(candidate.id));
        const earned = sold.reduce((sum, candidate) => sum + candidate.sellPrice, 0);

        lastBag = { ...lastBag, pieces: lastBag.pieces.filter((candidate) => !ids.includes(candidate.id)) };
        await route.fulfill({ json: { equipment: lastBag, wallet: coins(START_COPPER + earned), sold: sold.length, earned } });
    });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
    await page.waitForTimeout(500);

    await shot(page, testInfo, '01-bag');

    await page.getByTestId('bulk-sell-start').click();
    await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '02-selection-empty');

    await page.getByTestId('equip-piece-b1').click();
    await page.getByTestId('equip-piece-b5').click();
    await page.getByTestId('equip-piece-b8').click();
    await shot(page, testInfo, '03-selected');

    await page.getByTestId('equip-slot-kael-WEAPON').click({ force: true });
    await shot(page, testInfo, '04-worn-locked');

    await page.getByTestId('equip-piece-b11').hover();
    await expect(page.getByTestId('piece-tooltip')).toBeVisible();
    await shot(page, testInfo, '05-tooltip');
    await page.mouse.move(0, 0);

    await page.getByTestId('bulk-sell-rarity-RARE').click();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '06-rarity-pressed');

    await page.getByTestId('bulk-sell-submit').click();
    await expect(page.getByTestId('bulk-sell-question')).toBeVisible();
    await shot(page, testInfo, '07-confirmation');

    await page.getByTestId('bulk-sell-confirm-yes').click();
    await expect(page.getByTestId('equip-sell-notice')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '08-success');
});
