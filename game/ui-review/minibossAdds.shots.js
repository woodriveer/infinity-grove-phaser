import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the miniboss-adds review (.specs/features/miniboss-adds/ui-review/). Fake backend with an `addsChapter` definition (as e2e/minibossAddsTarget.spec.js);
//  nothing is stubbed. The loop sleeps between shots; snap() wakes it for a few frames so the canvas, the DOM and the fading numbers are drawn.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const monsterOf = (element, defense = 0, critResistance = 0) => ({ element, defense, critResistance });
const ADD = { health: 30, defenseBuff: 30 };
const addsChapter = ({ adds = [ ADD, ADD ], defense = 49, minibossHealth = 100, element = 'FIRE' } = {}) => ({
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: monsterOf(element, 30, 30), bossDropRuleId: 3,
    stages: [ 1, 2 ].map((number) => ({
        number, phasesPerStage: 5, monsterHealth: 10, minibossHealth, minibossTimeLimitMs: 30_000,
        monster: monsterOf(element), miniboss: monsterOf(element, defense), monsterDropRuleId: 1, minibossDropRuleId: 2, adds
    }))
});

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const freeze = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
const hitAt = (page, x, y, times = 1) => page.evaluate(([ px, py, n ]) => {
    const s = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    for (let i = 0; i < n; i++)
    {
        s.hitMonster({ x: px, y: py });
    }
}, [ x, y, times ]);
const useSkill = (page, slot) => page.evaluate((n) => window.__PHASER_GAME__.scene.getScene('ClickerGame').useSkill(n), slot);

const start = async (page, { definition = addsChapter(), progress = { chapter: 11, stage: 1, encounter: 'MINIBOSS', phase: 1 }, leader = 'kael', stars = {}, team } = {}) => {
    const copies = { ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])), ...Object.fromEntries(Object.entries(stars).map(([ id, n ]) => [ `${id}:${n}`, 1 ])) };

    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition,
        cards: { yan: { leader, cleared: [ 5 ], copies } },
        progress: { yan: { phase: 1, ...progress } },
        team: team ? { yan: team } : {}
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await expect.poll(() => scene(page, '(s) => s.monster?.health ?? 0')).toBeGreaterThan(0);
    await page.waitForTimeout(800);
    await freeze(page);
};

const snap = async (page, testInfo, name, { ms = 60 } = {}) => {
    await page.waitForFunction(() => [ ...document.images ].every((img) => img.complete && img.naturalWidth > 0));
    await page.evaluate(() => window.__PHASER_GAME__.loop.wake());
    await page.waitForTimeout(ms);
    await shot(page, testInfo, name);
    await freeze(page);
};

const rects = (page) => page.evaluate(() => {
    const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [ r.x, r.y, r.right, r.bottom ].map((v) => Math.round(v * 10) / 10); };
    const c = document.querySelector('canvas').getBoundingClientRect();
    return { canvas: [ c.x, c.y, c.width, c.height ], chip: box('.target-chip'), enemyBox: box('.enemy-box') ?? box('.enemy-stats') };
});

test('01 fight start', async ({ page }, testInfo) => {
    await start(page);
    await snap(page, testInfo, '01-adds-fight-start');
    console.log('RECTS', testInfo.project.name, JSON.stringify(await rects(page)));
});

test('02 target lacaio 1', async ({ page }, testInfo) => {
    await start(page);
    await hitAt(page, 480, 360);
    await snap(page, testInfo, '02-adds-target-lacaio-1');
});

test('03 target lacaio 2', async ({ page }, testInfo) => {
    await start(page);
    await hitAt(page, 480, 540);
    await snap(page, testInfo, '03-adds-target-lacaio-2');
});

test('04 one dead', async ({ page }, testInfo) => {
    await start(page);
    await hitAt(page, 480, 360, 60);
    await page.evaluate(() => window.__PHASER_GAME__.loop.wake());
    await page.waitForTimeout(900);
    await freeze(page);
    await snap(page, testInfo, '04-adds-one-dead');
});

test('05 skill numbers', async ({ page }, testInfo) => {
    await start(page, { leader: 'orina', stars: { orina: 3 }, definition: addsChapter({ defense: 50, element: 'WATER', adds: [ { health: 200, defenseBuff: 30 }, { health: 200, defenseBuff: 30 } ], minibossHealth: 200 }) });
    await useSkill(page, 3);
    await snap(page, testInfo, '05-adds-skill-numbers', { ms: 40 });
});

test('06 with team', async ({ page }, testInfo) => {
    await start(page, { team: { boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] } });
    await hitAt(page, 480, 360);
    await page.evaluate(() => window.__PHASER_GAME__.loop.wake());
    await page.waitForTimeout(150);
    await shot(page, testInfo, '06-adds-with-team');
    await freeze(page);
});

test('07 no adds', async ({ page }, testInfo) => {
    await start(page, { definition: addsChapter({ adds: [], defense: 0 }), progress: { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 } });
    await snap(page, testInfo, '07-no-adds');
});
