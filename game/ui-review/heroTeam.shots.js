import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the hero-team review (.specs/features/hero-team/ui-review/). Runs on the fake backend with its `team` option; nothing is stubbed.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const monsterOf = (element) => ({ element, defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });
const definition = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monsterOf('FIRE'),
    bossDropRuleId: 3,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster: monsterOf('FIRE'), miniboss: monsterOf('FIRE'), monsterDropRuleId: 1, minibossDropRuleId: 2 } ]
};
const FOUR = { boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] };

const start = async (page, { chapter = 5, cleared = [ 5 ], copper = 0, team, leader = 'kael', freeze = false } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition,
        cards: { yan: { leader, cleared, copies: Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])) } },
        progress: { yan: { chapter, stage: 1, encounter: 'PHASE', phase: 1 } },
        wallets: { yan: copper },
        team: team ? { yan: team } : {}
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.waitForTimeout(600);

    if (freeze)
    {
        await page.evaluate(() => {
            window.__PHASER_GAME__.loop.sleep();
            window.__PHASER_GAME__.scene.getScene('ClickerGame').allies.untilTickMs = 1000;
        });
    }
};

const loaded = (page) => page.waitForFunction(() => [ ...document.images ].every((img) => img.complete && img.naturalWidth > 0));
const openTeam = async (page) => {
    await page.getByTestId('hud-team').click();
    await expect(page.getByTestId('team-screen')).toBeVisible();
    await loaded(page);
    await page.mouse.move(0, 0);
};
const slot = (page, index) => page.getByTestId(`team-slot-${index}`);
const probe = async (page, testInfo, label) => console.log(`PROBE ${label} (${testInfo.project.name}): ${await page.locator('.hero-window').first().evaluate((n) => `${n.scrollHeight}/${n.clientHeight}`).catch(() => 'n/a')}`);

test('rail locked', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 1, 2, 3, 4 ] });
    await shot(page, testInfo, '01-rail-locked');
});

test('rail unlocked', async ({ page }, testInfo) => {
    await start(page);
    await shot(page, testInfo, '02-rail-unlocked');
});

test('team buyable', async ({ page }, testInfo) => {
    await start(page, { copper: 10_000 });
    await openTeam(page);
    await shot(page, testInfo, '03-team-buyable');
    await probe(page, testInfo, 'buyable');
});

test('dialogs', async ({ page }, testInfo) => {
    await start(page, { copper: 10_000 });
    await openTeam(page);
    await slot(page, 1).click();
    await expect(page.getByTestId('team-buy-dialog')).toBeVisible();
    await shot(page, testInfo, '04-team-dialog');
});

test('dialog short', async ({ page }, testInfo) => {
    await start(page, { copper: 5_000 });
    await openTeam(page);
    await slot(page, 1).click();
    await expect(page.getByTestId('team-buy-dialog')).toBeVisible();
    await shot(page, testInfo, '05-team-dialog-short');
});

test('bought', async ({ page }, testInfo) => {
    await start(page, { copper: 10_000 });
    await openTeam(page);
    await slot(page, 1).click();
    await page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
    await page.getByTestId('team-buy-confirm').click();
    await expect(page.getByTestId('team-notice')).toBeVisible();
    await shot(page, testInfo, '06-team-bought');
    await page.evaluate(() => {
        const clock = window.__PHASER_GAME__.scene.getScene('ClickerGame').time;

        clock.preUpdate();
        clock.update(clock.now, 450);
        clock.preUpdate();
    });
    await shot(page, testInfo, '06b-team-bought-after-flash');
});

test('full', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6, 7, 8 ], team: FOUR });
    await openTeam(page);
    await slot(page, 2).click();
    await shot(page, testInfo, '07-team-full');
    await probe(page, testInfo, 'full');
    await page.getByTestId('team-remove').click();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '07b-team-one-removed');
});

test('full scrolled', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6 ], team: { boughtSlots: 1, allies: [ null, null, null, null ] } });
    await openTeam(page);
    await slot(page, 1).click();
    await page.evaluate(() => document.querySelectorAll('.hero-window, .hero-panel, [data-testid=team-screen]').forEach((n) => { n.scrollTop = n.scrollHeight; }));
    await page.waitForTimeout(150);
    await shot(page, testInfo, '07c-team-available-scrolled');
});

test('inactive', async ({ page }, testInfo) => {
    await start(page, { chapter: 3, cleared: [ 5, 6, 7 ], team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] } });
    await openTeam(page);
    await shot(page, testInfo, '08-team-inactive');
});

test('field formation', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6, 7, 8 ], team: FOUR, leader: 'lyra', freeze: true });
    await shot(page, testInfo, '09-field-formation');
    await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, 1000));
    await page.waitForTimeout(150);
    await shot(page, testInfo, '09b-field-ally-hit');
});

test('field Kael', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6, 7, 8 ], team: FOUR, leader: 'kael', freeze: true });
    await shot(page, testInfo, '10-field-kael');
});

test('attribute panel', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6, 7, 8 ], leader: 'seraphine', team: { boughtSlots: 4, allies: [ 'lyra', 'kael', 'orina', 'vex' ] } });
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('leader-stats')).toBeVisible();
    await loaded(page);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '11-attributes-passives');
    await probe(page, testInfo, 'attributes');
});
