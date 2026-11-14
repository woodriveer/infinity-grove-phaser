import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the campaign-chapters review (.specs/features/campaign-chapters/ui-review/): abbreviated HP, damage numbers,
//  chapters past 5 on the HUD plaque and the map title, and the reset label at +15 cristais.
const bare = { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 };
const chapter = (bossHealth) => ({
    bossHealth, bossTimeLimitMs: 600_000, boss: bare,
    stages: Array.from({ length: 10 }, (_, index) => ({
        number: index + 1, phasesPerStage: 5, monsterHealth: 10_000, minibossHealth: 10_000, minibossTimeLimitMs: 30_000, monster: bare, miniboss: bare
    }))
});
const weapon = (baseClick) => ({ id: 'w1', slot: 'WEAPON', rarity: 'RARE', baseClick, refine: 0, affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId: 'kael' });

const start = async (page, { progress, definition = chapter(1), equipment }) => {
    await mockBackend(page, {
        users: { yan: 'secret123' }, definition, progress: { yan: progress },
        cards: { yan: { leader: 'kael', copies: { 'kael:0': 1 } } }, lastChapter: 15, ...(equipment && { equipment })
    });
    const menu = await openMainMenu(page, { random: 0.99 });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('leader-card')).toContainText('Kael');

    return menu;
};

const boss = (n) => ({ chapter: n, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 });

test('campaign chapters', async ({ page }, testInfo) => {
    //  Shortest HP text
    await start(page, { progress: boss(1), definition: chapter(999) });
    await expect(page.getByTestId('monster-hp')).toHaveText('HP 999/999');
    await shot(page, testInfo, '01-hp-999');
    await page.reload();
});

test('hp 1K', async ({ page }, testInfo) => {
    await start(page, { progress: boss(1), definition: chapter(1000) });
    await expect(page.getByTestId('monster-hp')).toHaveText('HP 1K/1K');
    await shot(page, testInfo, '02-hp-1k');
});

test('hp 1.5B/3B and a late chapter', async ({ page }, testInfo) => {
    const menu = await start(page, {
        progress: boss(15), definition: chapter(3_000_000_000), equipment: { yan: [ weapon(499_999_999) ] }
    });
    await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 15');
    await expect(page.getByTestId('monster-hp')).toHaveText('HP 3B/3B');
    await shot(page, testInfo, '03-hp-3b-chapter-15');
    await menu.canvas.click();
    await expect(page.getByTestId('monster-hp')).toContainText('1.5B/3B');
    await page.waitForTimeout(150);
    await shot(page, testInfo, '04-hp-1-5b-damage-number');
});

test('damage 5K and chapter 12', async ({ page }, testInfo) => {
    const menu = await start(page, {
        progress: { chapter: 12, stage: 1, encounter: 'PHASE', phase: 1 }, equipment: { yan: [ weapon(4999) ] }
    });
    await menu.canvas.click();
    await expect(page.getByTestId('monster-hp')).toHaveText('HP 5K/10K');
    await page.waitForTimeout(100);
    await shot(page, testInfo, '05-damage-5k-chapter-12');
});

test('map title and reset label', async ({ page }, testInfo) => {
    await start(page, { progress: { chapter: 15, stage: 4, encounter: 'PHASE', phase: 2, completed: false } });
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-map')).toBeVisible();
    await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 15');
    await shot(page, testInfo, '06-map-chapter-15');
    await page.getByTestId('farm-map').press('Escape').catch(() => {});
    await page.reload();
});

test('reset label 15', async ({ page }, testInfo) => {
    await start(page, { progress: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } });
    await page.getByTestId('auto-click-button').click();
    await expect(page.getByTestId('reset-account')).toHaveText('Resetar conta (+15 cristais)');
    await shot(page, testInfo, '07-reset-label-15');
});
