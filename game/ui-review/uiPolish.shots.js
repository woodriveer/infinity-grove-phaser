import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the ui-polish review (.specs/features/ui-polish/ui-review/). Fake backend, real art; desktop only matters.
const ARMORED = { element: 'FIRE', defense: 20, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const BLANK_HEROES = Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ]));

const start = async (page, { talents, points = 0, cards, progress, team, definition = CHAPTER } = {}) => {
    const fake = await mockBackend(page, {
        users: { yan: 'secret123' }, definition,
        ...(talents && { talents: { yan: talents } }),
        ...(points > 0 && { talentPoints: { yan: points } }),
        ...(cards && { cards: { yan: cards } }),
        ...(progress && { progress: { yan: progress } }),
        ...(team && { team: { yan: team } })
    });

    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText(/yan/);
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return { menu, fake };
};

const iconsLoaded = (page) => page.waitForFunction(() => [ ...document.querySelectorAll('[data-testid="talent-tree"] img') ].every((img) => img.complete));
const frame = (page) => page.evaluate(() => new Promise(requestAnimationFrame));
const blur = (page) => page.evaluate(() => document.activeElement?.blur());
const detail = (page) => page.getByTestId('talent-detail');

const openTalent = async (page, id) => {
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
    await iconsLoaded(page);
    await page.getByTestId(`talent-${id}`).click();
    await expect(page.getByTestId('talent-detail-name')).toBeVisible();
    await page.waitForTimeout(300);
};

test.describe('talents', () => {
    test('01 and 02 the Shift button', async ({ page }, testInfo) => {
        await start(page, { points: 5 });
        await openTalent(page, 'COMBO');
        await shot(page, testInfo, '01-card-normal');
        await page.keyboard.down('Shift');
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await shot(page, testInfo, '02-card-shift');
        await shot(detail(page), testInfo, '02b-card-shift-detail');
    });

    test('03 longest text', async ({ page }, testInfo) => {
        await start(page, { talents: { CLICK_DAMAGE: 10, CLICK_DAMAGE_G2: 10 }, points: 30 });
        await openTalent(page, 'CLICK_DAMAGE_G3');
        await page.keyboard.down('Shift');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE_G3')).toHaveText('Melhorar até o nível 10 (30 pontos)');
        await shot(page, testInfo, '03-card-shift-longest');
        await shot(detail(page), testInfo, '03b-card-shift-longest-detail');
    });

    test('04 unaffordable', async ({ page }, testInfo) => {
        await start(page, { talents: { COMBO: 10 }, points: 1 });
        await openTalent(page, 'COMBO_G2');
        await page.keyboard.down('Shift');
        await expect(page.getByTestId('talent-upgrade-COMBO_G2')).toHaveText('Melhorar (2 pontos)');
        await shot(page, testInfo, '04-card-shift-unaffordable');
    });

    test('05 busy', async ({ page }, testInfo) => {
        const { fake } = await start(page, { talents: { COMBO: 1 }, points: 2 });

        await openTalent(page, 'COMBO');
        const release = fake.holdTalents();

        await page.getByTestId('talent-upgrade-COMBO').click();
        await page.waitForTimeout(300);
        await shot(page, testInfo, '05-card-busy');
        await shot(detail(page), testInfo, '05b-card-busy-detail');
        release();
    });

    test('06 after the Shift purchase', async ({ page }, testInfo) => {
        await start(page, { points: 5 });
        await openTalent(page, 'COMBO');
        await page.keyboard.down('Shift');
        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 5/10');
        await frame(page);
        await shot(page, testInfo, '06-after-shift-purchase');
    });
});

test.describe('page guards', () => {
    test('07 start screen Ctrl+A', async ({ page }, testInfo) => {
        await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER });
        await openMainMenu(page);
        await blur(page);
        await page.keyboard.press('Control+a');
        await shot(page, testInfo, '07-start-ctrl-a');
    });

    test('08 battle Ctrl+A and 09 username selected', async ({ page }, testInfo) => {
        await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await page.locator('input').first().focus();
        await page.keyboard.press('Control+a');
        await shot(page, testInfo, '09-username-selected');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText(/yan/);
        await menu.canvas.click();
        await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
        await expect(page.getByTestId('skill-slot-1')).toBeVisible();
        await blur(page);
        await page.keyboard.press('Control+a');
        await shot(page, testInfo, '08-battle-ctrl-a');
    });
});

test.describe('hud and equipe', () => {
    test('10 rail keys', async ({ page }, testInfo) => {
        await start(page, { points: 3 });
        await page.waitForTimeout(300);
        await shot(page, testInfo, '10-rail-keys');
    });

    test('11 to 13 the leader card and list', async ({ page }, testInfo) => {
        await start(page, { cards: { leader: 'kael', cleared: [], copies: { 'kael:0': 1, 'lyra:1': 1 } }, progress: { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1 } });
        await page.getByTestId('hud-team').click();
        await expect(page.getByTestId('team-screen')).toBeVisible();
        await page.waitForTimeout(300);
        await page.mouse.move(5, 5);
        await shot(page, testInfo, '11-equipe-chapter-1');
        await page.getByTestId('team-slot-0').hover();
        await shot(page, testInfo, '11b-equipe-leader-hover');
        await page.getByTestId('team-slot-0').click();
        await expect(page.getByTestId('leader-list')).toBeVisible();
        await page.waitForTimeout(300);
        await page.mouse.move(5, 5);
        await shot(page, testInfo, '12-leader-list');
        await page.getByTestId('leader-entry-lyra').click();
        await expect(page.getByTestId('leader-entry-lyra')).toHaveClass(/is-current/);
        await page.getByTestId('hero-back').click();
        await expect(page.getByTestId('leader-card')).toContainText('Lyra');
        await page.mouse.move(5, 5);
        await page.waitForTimeout(300);
        await shot(page, testInfo, '13-equipe-after-pick');
    });

    test('14 equipe chapter 5', async ({ page }, testInfo) => {
        await start(page, {
            cards: { leader: 'kael', cleared: [ 5 ], copies: BLANK_HEROES }, progress: { chapter: 5, stage: 1, encounter: 'PHASE', phase: 1 },
            team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }
        });
        await page.getByTestId('hud-team').click();
        await expect(page.getByTestId('team-screen')).toBeVisible();
        await page.waitForTimeout(300);
        await page.mouse.move(5, 5);
        await shot(page, testInfo, '14-equipe-chapter-5');
    });
});
