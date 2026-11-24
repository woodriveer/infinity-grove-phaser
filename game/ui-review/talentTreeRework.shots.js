import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the talent-tree-rework review (.specs/features/talent-tree-rework/ui-review/). Fake backend; every `talent-*` asset is routed as missing (the way the
//  feature ships) except in the art-present scenario, which routes a 1 x 1 picture to show the layout with art.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const ARMORED = { element: 'FIRE', physicalDefense: 20, magicalDefense: 0, critResistance: 30 };
const ADD = { health: 30, defenseBuff: 30 };
const chapter = (adds = []) => ({
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: ARMORED,
    stages: [ 1, 2 ].map((number) => ({ number, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED, adds }))
});
const POWER_AT_10 = Object.fromEntries([ 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].flatMap((id) => [ id, `${id}_G2`, `${id}_G3` ]).map((id) => [ id, 10 ]));

const problems = new WeakMap();
const watch = (page) => {
    const list = [];

    problems.set(page, list);
    page.on('console', (m) => { if (m.type() === 'error') { list.push(`console.error: ${m.text()}`); } });
    page.on('pageerror', (e) => list.push(`pageerror: ${e.message}`));
    page.on('response', (r) => { if (r.status() >= 400) { list.push(`http ${r.status()}: ${r.url()}`); } });
};

const start = async (page, { art = 'missing', talents, points = 0, progress, definition = chapter() } = {}) => {
    watch(page);
    if (art !== 'real') { await page.route('**/assets/talent-*', (route) => (art === 'missing' ? route.fulfill({ status: 404, body: '' }) : route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }))); }
    await mockBackend(page, {
        users: { yan: 'secret123' }, definition,
        ...(talents && { talents: { yan: talents } }),
        ...(points > 0 && { talentPoints: { yan: points } }),
        ...(progress && { progress: { yan: { phase: 1, ...progress } } })
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
};

const openTalents = async (page) => {
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
    await page.waitForTimeout(300);
};
const select = async (page, id) => { await page.getByTestId(`talent-${id}`).click(); await page.waitForTimeout(100); };

const metrics = (page) => page.evaluate(() => {
    const r = (sel) => { const e = document.querySelector(sel); if (!e) { return null; } const b = e.getBoundingClientRect(); return [ b.x, b.y, b.width, b.height ].map(Math.round); };
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const nodes = [ ...document.querySelectorAll('.talent-node') ].map((n) => n.getBoundingClientRect());
    const caps = [ ...document.querySelectorAll('.talent-node-caption') ];
    const overlaps = [];

    nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => { if (hit(a, b)) { overlaps.push('node-node'); } }));
    const capBoxes = caps.map((c) => [ c.getAttribute('data-testid'), c.getBoundingClientRect() ]);
    capBoxes.forEach(([ id, c ], i) => {
        capBoxes.slice(i + 1).forEach(([ id2, c2 ]) => { if (hit(c, c2)) { overlaps.push(`cap-cap ${id} ${id2}`); } });
    });
    const banners = [ ...document.querySelectorAll('.talent-branch') ].map((e) => e.getBoundingClientRect());
    const title = document.querySelector('[data-testid="talent-title"]').getBoundingClientRect();
    const cap = caps[0];

    return {
        overlaps, bannerOverTitle: banners.filter((b) => hit(b, title)).length, bannerOverNode: banners.flatMap((b) => nodes.filter((n) => hit(b, n))).length,
        tree: r('[data-testid="talent-tree"]'), detail: r('[data-testid="talent-detail"]'), points: r('[data-testid="talent-points"]'),
        reset: r('[data-testid="talent-reset"]'), close: r('[data-testid="hero-close"]'), title: r('[data-testid="talent-title"]'),
        captionFont: cap && getComputedStyle(cap).fontSize, zoom: getComputedStyle(document.querySelector('[data-testid="talent-tree"]')).zoom,
        dpr: window.devicePixelRatio, vw: innerWidth, vh: innerHeight
    };
});

test('01 tree empty fallback', async ({ page }, testInfo) => {
    await start(page);
    await openTalents(page);
    await shot(page, testInfo, '01-tree-empty');
    console.log('METRICS', testInfo.project.name, JSON.stringify(await metrics(page)));
    console.log('PROBLEMS', testInfo.project.name, JSON.stringify(problems.get(page)));
});

test('02 node states and card', async ({ page }, testInfo) => {
    await start(page, { talents: { CLICK_DAMAGE: 10, CRIT_CHANCE: 3, BOSS_DAMAGE: 10, COMBO: 10 }, points: 3 });
    await openTalents(page);
    await select(page, 'CRIT_CHANCE');
    await shot(page, testInfo, '02-states-open-selected');
    await select(page, 'CLICK_DAMAGE');
    await shot(page, testInfo, '03-card-maxed');
    await select(page, 'CLICK_DAMAGE_G2');
    await shot(page, testInfo, '04-card-open-grade2');
});

test('03 locked cards', async ({ page }, testInfo) => {
    await start(page);
    await openTalents(page);
    await select(page, 'CLICK_DAMAGE_G2');
    await shot(page, testInfo, '05-card-locked-grade');
    await select(page, 'COMBO_FURY');
    await shot(page, testInfo, '06-card-fury-locked');
});

test('04 fury level 4', async ({ page }, testInfo) => {
    await start(page, { talents: { COMBO: 10, COMBO_FURY: 4 } });
    await openTalents(page);
    await select(page, 'COMBO_FURY');
    await shot(page, testInfo, '07-card-fury-level-4');
});

test('05 fury available', async ({ page }, testInfo) => {
    await start(page, { talents: { COMBO: 10 }, points: 4 });
    await openTalents(page);
    await select(page, 'COMBO_FURY');
    await shot(page, testInfo, '08-card-fury-available');
});

test('06 veins', async ({ page }, testInfo) => {
    await start(page, { talents: { MINIBOSS_TIME: 5, COMBO: 10, ...POWER_AT_10 }, points: 2 });
    await openTalents(page);
    await shot(page, testInfo, '09-veins-0-27-44-100');
});

test('07 art present', async ({ page }, testInfo) => {
    await start(page, { art: 'present', talents: { CLICK_DAMAGE: 10 }, points: 2 });
    await openTalents(page);
    await select(page, 'CRIT_CHANCE');
    await shot(page, testInfo, '10-art-present-placeholder');
});

test('11 real art', async ({ page }, testInfo) => {
    await start(page, { art: 'real', talents: { MINIBOSS_TIME: 5, COMBO: 10, ...POWER_AT_10 }, points: 2 });
    await openTalents(page);
    await select(page, 'CRIT_CHANCE');
    await shot(page, testInfo, '11-real-art');
    console.log('PROBLEMS', testInfo.project.name, JSON.stringify(problems.get(page)));
});

test('08 enemy chip miniboss', async ({ page }, testInfo) => {
    await start(page, { progress: { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 } });
    await page.waitForTimeout(800);
    await shot(page, testInfo, '11-chip-miniboss');
    console.log('CHIP', testInfo.project.name, await page.locator('.enemy-stats [data-stat="crit"]').textContent());
});

test('09 enemy chip with adds', async ({ page }, testInfo) => {
    await start(page, { progress: { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 }, definition: chapter([ ADD, ADD ]) });
    await page.waitForTimeout(800);
    await shot(page, testInfo, '12-chip-adds');
    console.log('CHIPRECTS', testInfo.project.name, JSON.stringify(await page.evaluate(() => {
        const b = (s) => { const e = document.querySelector(s); if (!e) { return null; } const r = e.getBoundingClientRect(); return [ r.x, r.y, r.right, r.bottom ].map(Math.round); };

        return { stats: b('.enemy-stats'), crit: b('.enemy-stats [data-stat="crit"]'), canvas: b('canvas') };
    })));
});

test('10 equipment panel', async ({ page }, testInfo) => {
    await start(page, { talents: { BOSS_DAMAGE: 5 } });
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('leader-stats')).toBeVisible();
    await page.waitForTimeout(300);
    await shot(page, testInfo, '13-equipment-attributes');
    console.log('STATS', testInfo.project.name, JSON.stringify(await page.getByTestId('leader-stats').innerText()));
});
