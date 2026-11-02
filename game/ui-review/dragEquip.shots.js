import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the drag-equip review (.specs/features/drag-equip/ui-review/). Drives the drag with the mouse (pointer events);
//  on the phone project the same mouse path is used, so it does not prove the touch path.
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

const WORN = [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('w2', 'ARMOR', 'EPIC', 2, 'kael'), piece('w3', 'RING', 'UNCOMMON', 0, 'lyra') ];
const BAG = [ piece('b1', 'WEAPON', 'EPIC'), piece('b2', 'ARMOR', 'COMMON'), piece('b3', 'RING', 'RARE'), piece('b4', 'AMULET', 'UNCOMMON'), piece('b5', 'WEAPON', 'LEGENDARY') ];

test('drag equip', async ({ page }, testInfo) => {
    await mockBackend(page, {
        users: { yan: 'secret123' }, wallets: { yan: 50 }, cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } },
        equipment: { yan: [ ...WORN, ...BAG ] }
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
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '01-rest');

    const center = async (locator) => {
        await locator.scrollIntoViewIfNeeded();
        const box = await locator.boundingBox();

        return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };

    //  The hero block that is a valid target for b1 (a weapon): lyra's, since kael's block holds the equipped weapon
    const lyra = page.locator('[data-drop-hero="lyra"]');
    const tile = page.getByTestId('equip-piece-b1');
    const from = await center(tile);

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 20, from.y + 20, { steps: 4 });

    const target = await center(lyra);

    await page.mouse.move(target.x, target.y, { steps: 10 });
    await page.waitForTimeout(150);
    await shot(page, testInfo, '02-drag-over-hero');

    //  The ghost must be the topmost element at the pointer (Phaser DOM container risk)
    const stack = await page.evaluate(() => {
        const ghost = document.querySelector('[data-testid="piece-drag-ghost"]');
        const box = ghost.getBoundingClientRect();
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        const container = document.querySelector('#game-container');
        const dom = [ ...document.querySelectorAll('div') ].find((node) => node.style.zIndex === '' && getComputedStyle(node).position === 'absolute' && node.querySelector('.hero-window'));

        return {
            ghostParent: ghost.parentElement.tagName,
            ghostZ: getComputedStyle(ghost).zIndex,
            containerZ: container && getComputedStyle(container).zIndex,
            containerPos: container && getComputedStyle(container).position,
            containerTransform: container && getComputedStyle(container).transform,
            domContainerZ: dom && getComputedStyle(dom).zIndex,
            topAtPointer: document.elementsFromPoint(cx, cy).slice(0, 3).map((node) => node.tagName + '.' + node.className)
        };
    });

    console.log(`STACK (${testInfo.project.name}): ${JSON.stringify(stack)}`);

    //  Kael wears a weapon: a valid target that replaces it (dashed slot); then a spot that is no hero block
    const kael = page.locator('[data-drop-hero="kael"]');
    const kaelCenter = await center(kael);

    await page.mouse.move(kaelCenter.x, kaelCenter.y, { steps: 6 });
    await page.waitForTimeout(100);
    await shot(page, testInfo, '03-drag-over-replace');

    const bar = page.getByTestId('equipment-list');
    const barBox = await bar.boundingBox();

    await page.mouse.move(barBox.x + 4, barBox.y + 4, { steps: 6 });
    await page.waitForTimeout(100);
    await shot(page, testInfo, '04-drag-invalid-spot');

    await page.mouse.move(target.x, target.y, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    await shot(page, testInfo, '05-after-drop');

    console.log(`CONSOLE-REPORT (${testInfo.project.name}): ${problems.length ? problems.join(' | ') : 'clean'}`);
});
