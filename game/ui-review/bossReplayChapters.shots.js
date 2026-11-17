import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the boss-replay-chapters review (.specs/features/boss-replay-chapters/ui-review/), same setup as the e2e spec.
const AT_CHAPTER_3 = { yan: { chapter: 3, stage: 4, encounter: 'PHASE', phase: 1 } };
const nature = { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 };
const CHAPTER_2 = {
    bossHealth: 2, bossTimeLimitMs: 50_000, boss: nature, bossDropRuleId: 6,
    stages: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 2,
        minibossTimeLimitMs: 45_000, monster: nature, miniboss: nature, monsterDropRuleId: 4, minibossDropRuleId: 5 }))
};

const start = async (page, options = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, progress: AT_CHAPTER_3, lastChapter: 15, chapterDefinitions: { 2: CHAPTER_2 }, ...options });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-farm')).toBeVisible();
};

const openMap = async (page) => {
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-map')).toBeVisible();
};

test('01-02 chapter 3 current and chapter 2 all beaten', async ({ page }, testInfo) => {
    await start(page);
    await openMap(page);
    await shot(page, testInfo, '01-chapter-3-current');
    await page.getByTestId('farm-chapter-2').click();
    await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');
    await shot(page, testInfo, '02-chapter-2-all-beaten');
    await page.getByTestId('farm-entry-miniboss-3').click();
    await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 3 (Capítulo 2)');
    await shot(page, testInfo, '03-chapter-2-fight-label');
});

test('04 chips disabled during a load', async ({ page }, testInfo) => {
    await start(page);
    await openMap(page);
    let release;
    const gate = new Promise((resolve) => { release = resolve; });

    await page.route((url) => url.pathname === '/api/farm' && url.searchParams.get('chapter') === '1', async (route) => { await gate; await route.fallback(); });
    await page.getByTestId('farm-chapter-1').click();
    await expect(page.getByTestId('farm-chapter-2')).toBeDisabled();
    await shot(page, testInfo, '04-chips-loading');
    release();
});

test('05 load failed', async ({ page }, testInfo) => {
    await start(page);
    await page.route((url) => url.pathname === '/api/farm' && url.searchParams.get('chapter') === '1', (route) => route.fulfill({ status: 500, body: '' }));
    await openMap(page);
    await page.getByTestId('farm-chapter-1').click();
    await expect(page.locator('.hero-error')).toHaveText('Não foi possível carregar.');
    await shot(page, testInfo, '05-load-failed');
});

test('06 fifteen chapters', async ({ page }, testInfo) => {
    await start(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } } });
    await openMap(page);
    await expect(page.locator('.farm-chapter')).toHaveCount(15);
    await shot(page, testInfo, '06-fifteen-chapters');
});

test('07 chip focus', async ({ page }, testInfo) => {
    await start(page);
    await openMap(page);
    await page.getByTestId('farm-chapter-2').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('farm-chapter-2')).toBeFocused();
    await shot(page, testInfo, '07-chip-focus');
});

test('08 chapter 14 boss label', async ({ page }, testInfo) => {
    await start(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } }, chapterDefinitions: { 14: CHAPTER_2 } });
    await openMap(page);
    await page.getByTestId('farm-chapter-14').click();
    await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 14');
    await page.getByTestId('farm-entry-chapter-boss').click();
    await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Chefe do capítulo (Capítulo 14)');
    await expect(page.locator('.boss-timer')).toBeVisible();
    await shot(page, testInfo, '08-chapter-14-boss-label');
});

test('09 current chapter fight label', async ({ page }, testInfo) => {
    await start(page, { definition: CHAPTER_2 });
    await openMap(page);
    await page.getByTestId('farm-entry-miniboss-1').click();
    await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1');
    await expect(page.locator('.boss-timer')).toBeVisible();
    await shot(page, testInfo, '09-current-chapter-fight-label');
});

test('10 campaign boss timer stays centred', async ({ page }, testInfo) => {
    await start(page, { progress: { yan: { chapter: 3, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 } }, chapterDefinitions: { 3: CHAPTER_2 } });
    await expect(page.locator('.boss-timer')).toBeVisible();
    const box = await page.locator('.boss-timer').boundingBox();
    const canvas = await page.locator('canvas').first().boundingBox();
    console.log('TIMER centre offset', box.x + box.width / 2 - (canvas.x + canvas.width / 2), 'label', await page.locator('.stage-hud').textContent());
    await shot(page, testInfo, '10-campaign-boss-timer');
});
