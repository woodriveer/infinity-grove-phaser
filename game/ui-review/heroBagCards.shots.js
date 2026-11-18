import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the hero-bag-cards review (.specs/features/hero-bag-cards/ui-review/). Runs on the fake backend, which already
//  has POST /heroes/:id/fuse-all and equipment; the held and failed requests are stubbed here with page.route.
const LAYERS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const KAEL_LADDER = { 'kael:0': 45, 'kael:1': 1, 'kael:2': 2 };
const FULL_BAG = Object.fromEntries([ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ].flatMap((id) => LAYERS.map((stars) => [ `${id}:${stars}`, 45 ])));
const MIXED = { ...KAEL_LADDER, 'lyra:4': 1, 'orina:7': 1 };

const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

const startWith = async (page, copies, { equipment = [] } = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { leader: 'kael', copies: { ...copies } } }, equipment: { yan: equipment } });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.waitForTimeout(400);
};

const openBag = async (page) => {
    await page.getByTestId('hud-bag').click();
    await expect(page.getByTestId('bag-list')).toBeVisible();
    await page.mouse.move(0, 0);
};

const openHero = async (page, id) => {
    await openBag(page);
    await page.getByTestId(`bag-card-${id}`).click();
    await expect(page.getByTestId('bag-entry-detail')).toBeVisible();
    await page.mouse.move(0, 0);
};

test('bag grid', async ({ page }, testInfo) => {
    await startWith(page, MIXED);
    await openBag(page);
    await shot(page, testInfo, '01-bag-grid');
});

test('bag grid full', async ({ page }, testInfo) => {
    await startWith(page, FULL_BAG);
    await openBag(page);
    await shot(page, testInfo, '02-bag-grid-full');
    console.log(`PROBE noScroll (${testInfo.project.name}): ${await page.locator('.hero-window').evaluate((n) => `${n.scrollHeight}<=${n.clientHeight}`)}`);
});

test('card hover and focus', async ({ page }, testInfo) => {
    await startWith(page, MIXED);
    await openBag(page);
    await page.getByTestId('bag-card-kael').hover();
    await shot(page, testInfo, '03-card-hover');
    await page.mouse.move(0, 0);
    await page.getByTestId('bag-card-kael').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await shot(page, testInfo, '04-card-focus');
});

test('ladder', async ({ page }, testInfo) => {
    await startWith(page, KAEL_LADDER);
    await openHero(page, 'kael');
    await shot(page, testInfo, '05-ladder-45-1-2');
});

test('ladder ready row', async ({ page }, testInfo) => {
    await startWith(page, { 'kael:0': 3 });
    await openHero(page, 'kael');
    await shot(page, testInfo, '06-ladder-ready-row');
});

test('ladder 9 star', async ({ page }, testInfo) => {
    await startWith(page, { 'kael:9': 1 });
    await openHero(page, 'kael');
    await shot(page, testInfo, '07-ladder-9-star');
});

test('fuse all', async ({ page }, testInfo) => {
    await startWith(page, KAEL_LADDER);
    await openHero(page, 'kael');
    await page.getByTestId('fusion-all').click();
    await expect(page.getByTestId('fusion-all-confirm')).toBeVisible();
    await shot(page, testInfo, '08-fuse-all-confirm');
    const probe = (id) => page.getByTestId(id).evaluate((n) => `${n.scrollWidth}/${n.clientWidth}`);

    console.log(`PROBE preview (${testInfo.project.name}): before ${await probe('fusion-all-before')} after ${await probe('fusion-all-after')}`);
    await page.getByTestId('fusion-all-yes').click();
    await expect(page.getByTestId('fusion-result')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '09-fuse-all-result');
});

test('fuse all raised', async ({ page }, testInfo) => {
    await startWith(page, { 'kael:3': 9 });
    await openHero(page, 'kael');
    await page.getByTestId('fusion-all').click();
    await page.getByTestId('fusion-all-yes').click();
    await expect(page.getByTestId('fusion-result')).toContainText('nível 2');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '10-fuse-all-raised');
});

test('busy', async ({ page }, testInfo) => {
    await startWith(page, { 'kael:0': 6 });

    let release;
    const held = new Promise((resolve) => { release = resolve; });

    await page.route('**/api/heroes/kael/fuse', async (route) => {
        await held;
        await route.fallback();
    });
    await openHero(page, 'kael');
    await page.getByTestId('fusion-button-kael-0').click();
    await expect(page.getByTestId('fusion-button-kael-0')).toBeDisabled();
    await expect(page.getByTestId('fusion-button-kael-0')).toHaveText('Fundindo...');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '11-fusion-busy');
    release();
});

test('fuse all busy', async ({ page }, testInfo) => {
    await startWith(page, KAEL_LADDER);

    let release;
    const held = new Promise((resolve) => { release = resolve; });

    await page.route('**/api/heroes/kael/fuse-all', async (route) => {
        await held;
        await route.fallback();
    });
    await openHero(page, 'kael');
    await page.getByTestId('fusion-all').click();
    await page.getByTestId('fusion-all-yes').click();
    await expect(page.getByTestId('fusion-all')).toHaveText('Fundindo...');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '17-fuse-all-busy');
    release();
});

test('error', async ({ page }, testInfo) => {
    await startWith(page, KAEL_LADDER);
    await page.route('**/api/heroes/kael/fuse-all', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }));
    await openHero(page, 'kael');
    await page.getByTestId('fusion-all').click();
    await page.getByTestId('fusion-all-yes').click();
    await expect(page.locator('.hero-error')).toHaveText('Não foi possível fundir as cartas.');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '12-fusion-error');
});

test('rail', async ({ page }, testInfo) => {
    await startWith(page, { 'kael:0': 1 });
    await shot(page, testInfo, '13-rail-six');
});

test('gems', async ({ page }, testInfo) => {
    const equipment = [
        piece('b1', 'RING', 'COMMON'), piece('b2', 'AMULET', 'UNCOMMON'), piece('b3', 'ARMOR', 'RARE', 1),
        piece('b4', 'RING', 'EPIC', 2), piece('b5', 'AMULET', 'LEGENDARY', 3),
        piece('w1', 'WEAPON', 'EPIC', 0, 'kael'), piece('w2', 'ARMOR', 'LEGENDARY', 2, 'kael')
    ];

    await startWith(page, { 'kael:0': 1 }, { equipment });
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '14-gems-bag');
    await shot(page, testInfo, '15-gems-slots');
    await page.getByTestId('bulk-sell-start').click();
    await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
    await shot(page, testInfo, '16-gems-bulk-sell');
});
