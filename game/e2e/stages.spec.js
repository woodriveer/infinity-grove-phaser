import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  A small chapter so a scenario takes seconds: 2 stages of 5 phases, monsters and minibosses die in 2 clicks,
//  the miniboss has 3 s, the chapter boss 3 clicks and 6 s. The 10 stage seed is covered by the unit tests.
const QUICK_CHAPTER = {
    bossHealth: 3,
    bossTimeLimitMs: 6000,
    stages: [ 1, 2 ].map((number) => ({ number, phasesPerStage: 5, monsterHealth: 2, minibossHealth: 2, minibossTimeLimitMs: 3000 }))
};

const outcomeCalls = (backend) => backend.calls.filter((call) => call.path === '/progress/outcome');

//  Logs in through the UI and starts the game with the click the welcome screen waits for
const startGame = async (page, { state = 'form' } = {}) => {
    const menu = await openMainMenu(page, { state });

    if (state === 'form')
    {
        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Welcome back, yan!');
    }

    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');

    return menu;
};

//  Any click on the canvas hits the monster
const hit = async (canvas, times) => {
    for (let i = 0; i < times; i++)
    {
        await canvas.click();
    }
};

test.describe('Stages', () => {
    test('five kills walk phases 1 to 5, then the miniboss appears with a countdown', async ({ page }) => {
        test.setTimeout(120_000);
        await mockBackend(page, { users: { yan: 'secret123' }, definition: QUICK_CHAPTER });
        const menu = await startGame(page);
        const hud = page.locator('.stage-hud');

        for (let phase = 1; phase <= 5; phase++)
        {
            await expect(hud).toHaveText(`Stage 1/2 Phase ${phase}/5`, { timeout: 15_000 });
            await hit(menu.canvas, 2);
        }

        await expect(hud).toHaveText('Stage 1/2 Miniboss', { timeout: 15_000 });
        await expect(page.locator('.boss-timer')).toHaveText(/^Time: [23]$/);
    });

    test('a miniboss that survives its time sends the player back to phase 5, and killing it in time reaches stage 2', async ({ page }) => {
        test.setTimeout(120_000);
        const backend = await mockBackend(page, {
            users: { yan: 'secret123' },
            definition: QUICK_CHAPTER,
            progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } }
        });
        const menu = await startGame(page);
        const hud = page.locator('.stage-hud');

        await expect(hud).toHaveText('Stage 1/2 Miniboss', { timeout: 15_000 });
        await expect(hud).toHaveText('Stage 1/2 Phase 5/5', { timeout: 15_000 });

        await hit(menu.canvas, 2);
        await expect(hud).toHaveText('Stage 1/2 Miniboss', { timeout: 15_000 });
        await hit(menu.canvas, 2);
        await expect(hud).toHaveText('Stage 2/2 Phase 1/5', { timeout: 15_000 });

        await expect.poll(() => outcomeCalls(backend).length, { timeout: 25_000 }).toBe(3);
        expect(outcomeCalls(backend).map((call) => [ call.body.encounter, call.body.phase, call.body.outcome ])).toEqual([
            [ 'MINIBOSS', 1, 'FAILED' ],
            [ 'PHASE', 5, 'CLEARED' ],
            [ 'MINIBOSS', 1, 'CLEARED' ]
        ]);
        expect(backend.progresses.get('yan')).toEqual({ stage: 2, encounter: 'PHASE', phase: 1, completed: false });
    });

    test('a reload resumes at the stored position', async ({ page }) => {
        test.setTimeout(120_000);
        const backend = await mockBackend(page, { users: { yan: 'secret123' }, definition: QUICK_CHAPTER });
        const menu = await startGame(page);
        const hud = page.locator('.stage-hud');

        await expect(hud).toHaveText('Stage 1/2 Phase 1/5', { timeout: 15_000 });
        await hit(menu.canvas, 2);
        await expect(hud).toHaveText('Stage 1/2 Phase 2/5', { timeout: 15_000 });
        await hit(menu.canvas, 2);
        await expect(hud).toHaveText('Stage 1/2 Phase 3/5', { timeout: 15_000 });
        await expect.poll(() => outcomeCalls(backend).length, { timeout: 25_000 }).toBe(2);

        await page.reload();
        await startGame(page, { state: 'welcome' });

        await expect(hud).toHaveText('Stage 1/2 Phase 3/5', { timeout: 15_000 });
    });

    test('beating the chapter boss shows the completion message, saves it, and a reload shows it again', async ({ page }) => {
        test.setTimeout(120_000);
        const backend = await mockBackend(page, {
            users: { yan: 'secret123' },
            definition: QUICK_CHAPTER,
            progress: { yan: { stage: 2, encounter: 'CHAPTER_BOSS', phase: 1 } }
        });
        const menu = await startGame(page);

        await expect(page.locator('.stage-hud')).toHaveText('Chapter Boss', { timeout: 15_000 });
        await hit(menu.canvas, 3);

        await expect(page.locator('.stage-message')).toHaveText('Chapter complete!', { timeout: 15_000 });
        await expect.poll(() => backend.progresses.get('yan').completed, { timeout: 25_000 }).toBe(true);

        await page.reload();
        await startGame(page, { state: 'welcome' });

        await expect(page.locator('.stage-message')).toHaveText('Chapter complete!', { timeout: 15_000 });
    });
});
