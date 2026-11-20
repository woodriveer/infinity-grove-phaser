import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the black-awareness-staff review (.specs/features/black-awareness-staff/ui-review/). The gift comes from the
//  fake backend (gifts: { yan: true }), so the staff reaches the bag the way it does in the game: the claim at the battle start.
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

const PIECES = [
    piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('l1', 'WEAPON', 'LEGENDARY'), piece('l2', 'ARMOR', 'LEGENDARY'), piece('e1', 'RING', 'EPIC'), piece('c1', 'AMULET', 'COMMON')
];

const center = async (locator) => {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();

    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test('black awareness staff', async ({ page }, testInfo) => {
    await mockBackend(page, {
        users: { yan: 'secret123' }, wallets: { yan: 50 }, cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } },
        equipment: { yan: PIECES }, gifts: { yan: true }
    });

    const problems = [];

    page.on('console', (message) => {
        if ([ 'error', 'warning' ].includes(message.type())) {
            problems.push(`console.${message.type()}: ${message.text()}`);
        }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
        if (response.status() >= 400) {
            problems.push(`http ${response.status()}: ${response.url()}`);
        }
    });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('card-notice')).toContainText('Presente do Dia da Consciência Negra');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '01-gift-notice');

    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '02-bag-with-staff');

    const staff = page.locator('[data-special="BLACK_AWARENESS_STAFF"]').first();

    await expect(staff).toBeVisible();
    await shot(staff, testInfo, '03-staff-tile');
    await shot(page.getByTestId('equip-piece-l1'), testInfo, '04-plain-legendary-tile');

    await staff.hover();
    await expect(page.getByTestId('piece-tooltip')).toBeVisible();
    await shot(page, testInfo, '05-tooltip');
    await shot(page.getByTestId('piece-tooltip'), testInfo, '06-tooltip-closeup');

    //  Drag copy
    const from = await center(staff);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 4 });
    await page.mouse.move(from.x + 40, from.y + 40, { steps: 4 });
    await page.waitForTimeout(150);
    await shot(page, testInfo, '07-dragging');
    console.log(`GHOST (${testInfo.project.name}): ${await page.getByTestId('piece-drag-ghost').count()}`);

    //  Drop on the hero block that accepts it (lyra has no weapon)
    const target = await center(page.locator('[data-drop-hero="lyra"]'));

    await page.mouse.move(target.x, target.y, { steps: 10 });
    await page.waitForTimeout(150);
    await shot(page, testInfo, '07b-drag-over-hero');
    await page.mouse.up();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '08-worn');

    const slot = page.getByTestId('equip-slot-lyra-WEAPON');

    if (await slot.count()) {
        await shot(slot, testInfo, '09-worn-slot');
        await slot.hover();
        await page.waitForTimeout(200);
        await shot(page, testInfo, '10-worn-tooltip');
    }

    console.log(`CONSOLE-REPORT (${testInfo.project.name}): ${problems.length ? problems.join(' | ') : 'clean'}`);
});
