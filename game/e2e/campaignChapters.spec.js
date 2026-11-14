import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Chapters past 5 (CHAP-03, CHAP-06, CHAP-07): every monster has no defense and the element of Kael (fire), so a click is neutral and
//  reads exactly. The chapter boss has the health of the test; the phase monsters and minibosses have 10 000 health
const bare = { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 };
const chapter = (bossHealth) => ({
    bossHealth,
    bossTimeLimitMs: 60_000,
    boss: bare,
    stages: Array.from({ length: 10 }, (_, index) => ({
        number: index + 1, phasesPerStage: 5, monsterHealth: 10_000, minibossHealth: 10_000, minibossTimeLimitMs: 30_000, monster: bare, miniboss: bare
    }))
});

//  Kael at 0 stars adds no click bonus, so a weapon of baseClick 4999 makes a click of 1 + 4999 = 5000
const WEAPON = { id: 'w1', slot: 'WEAPON', rarity: 'RARE', baseClick: 3, refine: 0, affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId: null };

const startGame = async (page, { progress, definition = chapter(1), equipment, lastChapter = 1 }) => {
    const backend = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition,
        progress: { yan: progress },
        cards: { yan: { leader: 'kael', copies: { 'kael:0': 1 } } },
        lastChapter,
        ...(equipment && { equipment })
    });
    const menu = await openMainMenu(page, { random: 0.99 });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('leader-card')).toContainText('Kael');

    return { backend, menu };
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const sceneTexts = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').children.list.filter((o) => o.type === 'Text').map((o) => o.text));

//  The auto click controls live in the window of the round button (spec ui-redesign D1)
const openAutoClick = async (page) => {
    await page.getByTestId('auto-click-button').click();
    await expect(page.getByTestId('auto-click-popover')).toBeVisible();
};

test.describe('Campaign chapters', () => {
    test('beating the chapter 5 boss opens chapter 6', async ({ page }) => {
        const { backend, menu } = await startGame(page, {
            progress: { chapter: 5, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }, definition: chapter(1), lastChapter: 15
        });

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 5');
        await menu.canvas.click();

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 6', { timeout: 15_000 });
        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/10  Phase 1/5', { timeout: 15_000 });
        await expect.poll(() => backend.progresses.get('yan'), { timeout: 15_000 }).toMatchObject({ chapter: 6, stage: 1, encounter: 'PHASE', phase: 1, completed: false });
    });

    test('beating the chapter 15 boss completes the campaign', async ({ page }) => {
        const { backend, menu } = await startGame(page, {
            progress: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }, definition: chapter(1), lastChapter: 15
        });

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 15');
        await menu.canvas.click();

        await expect(page.locator('.stage-message')).toHaveText('Chapter complete!', { timeout: 15_000 });
        await expect.poll(() => backend.progresses.get('yan').completed, { timeout: 25_000 }).toBe(true);
    });

    test('the reset button pays 12 crystals at chapter 12', async ({ page }) => {
        await startGame(page, { progress: { chapter: 12, stage: 1, encounter: 'PHASE', phase: 1 } });
        await openAutoClick(page);

        await expect(page.getByTestId('reset-account')).toHaveText('Resetar conta (+12 cristais)');
    });

    test('a completed campaign offers 15 crystals', async ({ page }) => {
        await startGame(page, { progress: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } });
        await openAutoClick(page);

        await expect(page.getByTestId('reset-account')).toHaveText('Resetar conta (+15 cristais)');
    });

    test('the HP of a 2000 health boss reads 2K', async ({ page }) => {
        await startGame(page, { progress: { chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }, definition: chapter(2000) });

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 2K/2K');
        expect(await health(page)).toBe(2000);
    });

    test('a click of 5000 damage shows 5K', async ({ page }) => {
        const { menu } = await startGame(page, {
            progress: { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1 },
            equipment: { yan: [ { ...WEAPON, baseClick: 4999, heroId: 'kael' } ] }
        });

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 10K/10K');
        await menu.canvas.click();

        await expect.poll(() => health(page)).toBe(5000);
        await expect.poll(() => sceneTexts(page)).toContain('5K');
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 5K/10K');
    });
});
