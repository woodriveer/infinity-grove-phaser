import { expect, test } from '@playwright/test';
import { STORY_SCENES } from '../src/domain/story/storyCatalog.js';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Regression check of the talent-icon-fit patch: bag tiles (plain and legendary staff) and HUD icons, with every .icon measured against its picture.
process.env.FEATURE = 'talent-icon-fit';
const piece = (id, slot, rarity, heroId = null) => ({ id, slot, rarity, refine: 0, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId });

test('bag and hud icons', async ({ page }, testInfo) => {
    await mockBackend(page, { users: { yan: 'secret123' }, wallets: { yan: 50 }, cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } },
        equipment: { yan: [ piece('w1', 'WEAPON', 'RARE', 'kael'), piece('l1', 'WEAPON', 'LEGENDARY'), piece('e1', 'RING', 'EPIC'), piece('c1', 'AMULET', 'COMMON') ] }, gifts: { yan: true } });
    await page.addInitScript((seen) => { localStorage.setItem('infinity-grove.auto-click', 'off'); localStorage.setItem('infinity-grove.story-seen', seen); }, JSON.stringify(STORY_SCENES.map((scene) => scene.id)));
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await page.waitForTimeout(800);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '07-hud');
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '08-bag');

    const bad = await page.evaluate(() => [ ...document.querySelectorAll('.icon') ].map((icon) => {
        const box = icon.getBoundingClientRect();
        const image = icon.querySelector('img')?.getBoundingClientRect();

        return { cls: icon.parentElement.className, w: box.width, h: box.height, iw: image?.width, ih: image?.height };
    }));

    console.log('ICONS ' + JSON.stringify(bad));
});
