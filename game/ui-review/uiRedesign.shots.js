import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { SESSION_KEY, activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the Grove theme review (.specs/features/ui-redesign/ui-review/, design § Review Screenshots). Everything runs on the
//  fake backend; the only stub is the held vex sprite that keeps the Preloader on screen.
const bare = (element, physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });

const chapter = (monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster } ]
});

//  Equipment of bulkSell.shots.js: worn pieces of Kael and Lyra, and a bag of 14 pieces of every rarity
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});
const SLOTS = [ 'WEAPON', 'ARMOR', 'RING', 'AMULET' ];
const WORN = [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('w2', 'ARMOR', 'EPIC', 2, 'kael'), piece('w3', 'RING', 'UNCOMMON', 0, 'lyra') ];
const BAG_RARITIES = [ 'COMMON', 'COMMON', 'COMMON', 'COMMON', 'UNCOMMON', 'UNCOMMON', 'UNCOMMON', 'RARE', 'RARE', 'RARE', 'EPIC', 'EPIC', 'LEGENDARY', 'COMMON' ];
const BAG = BAG_RARITIES.map((rarity, index) => piece(`b${index + 1}`, SLOTS[index % 4], rarity, index % 3));

//  Console, page errors and failed requests of the whole run, printed at the end for the report
const watch = (page) => {
    const problems = [];

    page.on('console', (message) => {
        if ([ 'error', 'warning' ].includes(message.type())) {
            problems.push(`console.${message.type()}: ${message.text()}`);
        }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`));
    page.on('response', (response) => {
        if (response.status() >= 400) {
            problems.push(`http ${response.status()}: ${response.url()}`);
        }
    });

    return problems;
};

const report = (testInfo, label, problems) => console.log(`CONSOLE-REPORT ${label} (${testInfo.project.name}): ${problems.length ? problems.join(' | ') : 'clean'}`);

//  Logs in as yan with Kael as leader and waits for the fight
const startAs = async (page, { monster = bare('FIRE'), copies, progress, talents, talentPoints, equipment } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monster),
        cards: { yan: { leader: 'kael', copies } },
        ...(progress && { progress: { yan: progress } }),
        ...(talents && { talents: { yan: talents } }),
        ...(talentPoints !== undefined && { talentPoints: { yan: talentPoints } }),
        ...(equipment && { equipment: { yan: equipment } })
    });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('leader-card')).toContainText('Kael');
    await page.waitForTimeout(500);
};

const tabTo = async (page, locator) => {
    for (let i = 0; i < 40; i++)
    {
        if (await locator.evaluate((node) => node === document.activeElement)) { return; }
        await page.keyboard.press('Tab');
    }
};

//  Starts every lazy image and waits until each image of the page has loaded or failed, so no shot catches a half-loaded screen (review finding 8)
const settleImages = async (page) => {
    await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; }));
    await page.waitForFunction(() => [ ...document.images ].every((img) => img.complete));
};

test('menu and preloader', async ({ page }, testInfo) => {
    const problems = watch(page);
    let release;
    const held = new Promise((resolve) => { release = resolve; });

    await mockBackend(page, { users: { yan: 'secret123' } });
    await page.route('**/assets/heroes/vex_sprite.png', async (route) => { await held; await route.continue(); });
    await page.goto('/');
    await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));
    await page.locator('#game-container canvas').click();
    //  The Preloader is still loading (the route holds the sprite): its bar is drawn, the scene is not running yet
    await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list.length)).toBeGreaterThan(0);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '01-preloader');

    //  Once the sprite arrives the Preloader hands over to the menu form of the same page (no reload: a reload would keep the session)
    release();
    const menu = {
        username: page.locator('.auth-form input[name="username"]'),
        password: page.locator('.auth-form input[name="password"]'),
        loginButton: page.getByRole('button', { name: 'Login' }),
        message: page.getByRole('alert')
    };

    await expect(menu.username).toBeVisible({ timeout: 15_000 });
    await page.waitForFunction(() => window.__PHASER_GAME__.scene.getScene('MainMenu').input.enabled);
    await tabTo(page, menu.username);
    await settleImages(page);
    await shot(page, testInfo, '02-menu-login');

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '03-menu-welcome');

    //  The path choice needs no session: without it the menu shows the form again
    await page.evaluate((key) => localStorage.removeItem(key), SESSION_KEY);
    const signup = await openMainMenu(page);

    await fillCredentials(signup, 'novo', 'secret123');
    await signup.signupButton.click();
    await expect(page.locator('.path-choice')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '04-path-choice');

    report(testInfo, 'menu and preloader', problems);
});

test('battle', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, {
        monster: bare('FIRE', 10, 20, 30),
        copies: { 'kael:3': 1 },
        progress: { chapter: 3, stage: 1, encounter: 'MINIBOSS', phase: 1 },
        talents: { COMBO: 10 }
    });
    await page.waitForTimeout(2000);
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '05-battle-boss');

    const canvas = page.locator('#game-container canvas');

    for (let i = 0; i < 5; i++) { await canvas.click(); }
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '06-battle-combo');

    await page.getByTestId('skill-slot-1').hover();
    await settleImages(page);
    await shot(page, testInfo, '09-skill-tooltip');

    await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.showNotice('Carta: Lyra Folhaveloz'));
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '10-notice');

    await page.keyboard.press('Escape');
    await expect(page.locator('.pause-menu')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '11-pause');

    await page.getByRole('button', { name: '1. Continue' }).click();
    await page.keyboard.press('a');
    await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    await expect(page.getByTestId('auto-click-toggle')).toBeFocused();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '14-auto-click-window');

    await page.getByTestId('reset-account').click();
    await expect(page.getByTestId('reset-dialog')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '12-reset-dialog');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await page.locator('.farm-toggle input').evaluate((node) => { node.checked = true; });
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '13-farm-on');

    await page.keyboard.press('a');
    await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    await page.getByTestId('auto-click-toggle').uncheck();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('auto-click-popover')).toBeHidden();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '15-auto-click-off');

    report(testInfo, 'battle', problems);
});

test('light enemy and locked skills', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, { monster: bare('LIGHT'), copies: { 'kael:1': 1 } });
    await page.waitForTimeout(1000);
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '07-battle-light');

    await expect(page.getByTestId('skill-slot-2')).toBeVisible();
    await settleImages(page);
    await shot(page, testInfo, '08-battle-locked');

    report(testInfo, 'light enemy and locked skills', problems);
});

test('hero screens', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, {
        copies: { 'kael:5': 1, 'kael:1': 3, 'lyra:4': 1, 'orina:7': 1, 'seraphine:2': 1, 'vex:6': 1 },
        equipment: [ ...WORN, ...BAG ],
        talentPoints: 3
    });

    await page.getByTestId('hud-heroes').click();
    await expect(page.getByTestId('hero-card-kael')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '20-heroes');

    await page.getByTestId('hero-card-kael').click();
    await expect(page.getByTestId('hero-detail')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '21-hero-detail');

    await page.getByTestId('hero-back').click();
    for (const [ hero, name ] of [ [ 'lyra', '34-hero-detail-lyra' ], [ 'orina', '35-hero-detail-orina' ], [ 'seraphine', '36-hero-detail-seraphine' ], [ 'vex', '37-hero-detail-vex' ] ])
    {
        await page.getByTestId(`hero-card-${hero}`).click();
        await expect(page.getByTestId('hero-detail')).toBeVisible();
        await page.mouse.move(0, 0);
        await settleImages(page);
        await shot(page, testInfo, name);
        await page.getByTestId('hero-back').click();
    }
    await page.getByTestId('hero-close').click();

    await page.getByTestId('hud-bag').click();
    await expect(page.getByTestId('bag-entry-kael-1')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '22-bag');

    await page.getByTestId('bag-entry-kael-1').click();
    await expect(page.getByTestId('bag-entry-detail')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '23-bag-detail');
    await page.getByTestId('bag-go-fusion').click();
    await expect(page.getByTestId('fusion-row-kael-1')).toHaveClass(/is-selected/);
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '32-fusion-selected');

    await page.getByTestId('hero-close').click();
    await page.getByTestId('hud-fusion').click();
    await expect(page.getByTestId('fusion-button-kael-1')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '24-fusion');

    await page.getByTestId('hero-close').click();
    await page.getByTestId('hud-leader').click();
    await expect(page.getByTestId('leader-entry-lyra')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '26-leader');

    await page.getByTestId('hero-close').click();
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equip-piece-b1')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '27-equipment');

    await page.getByTestId('equip-piece-b1').hover();
    await expect(page.getByTestId('piece-tooltip')).toBeVisible();
    await settleImages(page);
    await shot(page, testInfo, '28-piece-tooltip');

    await page.mouse.move(0, 0);
    await page.getByTestId('bulk-sell-start').click();
    await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
    await page.getByTestId('equip-piece-b1').click();
    await page.getByTestId('equip-piece-b5').click();
    await page.getByTestId('equip-piece-b8').click();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '29-bulk-sell');
    await page.getByTestId('bulk-sell-cancel').click();
    await page.getByTestId('equip-piece-b1').click();
    await expect(page.getByTestId('piece-refine')).toBeDisabled();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '33-equip-disabled');
    await page.getByTestId('hero-close').click();

    await page.getByTestId('hud-talents').click();
    await expect(page.locator('.talent-card').first()).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '30-talents');

    await page.getByTestId('hero-close').click();
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-map')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '31-boss-map');

    report(testInfo, 'hero screens', problems);
});

test('fusion error', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, { copies: { 'kael:4': 3 } });
    await page.getByTestId('hud-fusion').click();
    await expect(page.getByTestId('fusion-button-kael-4')).toBeVisible();

    await page.route('**/api/heroes/*/fuse', (route) => route.fulfill({ status: 500, json: { detail: 'fusion failed' } }));
    await page.getByTestId('fusion-button-kael-4').click();
    await expect(page.locator('.hero-error')).toBeVisible();
    await page.mouse.move(0, 0);
    await settleImages(page);
    await shot(page, testInfo, '25-fusion-error');

    report(testInfo, 'fusion error', problems);
});
