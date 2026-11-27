import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Chapter 1 of the early game rebalance (spec early-game-rebalance, Chapter Table): 8 phases a stage, the phase monster health 69 to 898, a miniboss of 3 times that
//  health with 45 seconds, the chapter boss of 6000 health with 90 seconds, and the critical resistances 0 to 9 of the minibosses and 5 of the boss. The numbers are
//  written out here, not read from the game.
const PHASE_HEALTH = [ 69, 92, 122, 162, 216, 287, 382, 508, 676, 898 ];
const ELEMENTS = [ 'FIRE', 'WATER', 'NATURE', 'LIGHT', 'DARKNESS' ];

const monsterOf = (element, defense, critResistance) => ({ element, defense, critResistance });

//  The payload of chapter 1: no affix field, as the backend of before the affixes sends it
const chapterOne = () => ({
    bossHealth: 6000,
    bossTimeLimitMs: 90_000,
    boss: monsterOf('DARKNESS', 30, 5),
    stages: PHASE_HEALTH.map((monsterHealth, index) => {
        const number = index + 1;
        const element = ELEMENTS[index % ELEMENTS.length];

        return {
            number, phasesPerStage: 8, monsterHealth, minibossHealth: 3 * monsterHealth, minibossTimeLimitMs: 45_000,
            monster: monsterOf(element, 0, 0), miniboss: monsterOf(element, 10 + number, number - 1)
        };
    })
});

//  `progress` is the starting position of the player; the leader is a blank Kael with no talent
const startGame = async (page, progress) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapterOne(),
        cards: { yan: { leader: 'kael', copies: { 'kael:0': 1 } } },
        progress: { yan: { chapter: 1, phase: 1, ...progress } }
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health ?? 0)).toBeGreaterThan(0);

    return menu;
};

//  The loop stops and the countdown starts over, so the text is the limit alone and not the limit minus the time the test took to load
const restartCountdown = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const scene = game.scene.getScene('ClickerGame');

    game.loop.sleep();
    scene.countdown.elapsedMs = 0;
    scene.showCountdown();

    return scene.countdown.limitMs;
});

test.describe('Chapter 1 of the fitted curve', () => {
    test('miniboss 1-1 starts at HP 207/207 with Time: 45', async ({ page }) => {
        await startGame(page, { stage: 1, encounter: 'MINIBOSS' });

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 207/207');
        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/10  Miniboss');

        expect(await restartCountdown(page)).toBe(45_000);
        await expect(page.locator('.boss-timer')).toHaveText('Time: 45');
    });

    test('the chapter boss starts at HP 6K/6K with Time: 90', async ({ page }) => {
        await startGame(page, { stage: 10, encounter: 'CHAPTER_BOSS' });

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 6K/6K');

        expect(await restartCountdown(page)).toBe(90_000);
        await expect(page.locator('.boss-timer')).toHaveText('Time: 90');
    });

    test('a leader with no critical bonus reads Seu crítico: 10% against miniboss 1-1', async ({ page }) => {
        await startGame(page, { stage: 1, encounter: 'MINIBOSS' });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');
    });

    test('the same leader reads Seu crítico: 1% against miniboss 1-10', async ({ page }) => {
        await startGame(page, { stage: 10, encounter: 'MINIBOSS' });

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 2.7K/2.7K');
        expect(await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster.maxHealth)).toBe(2694);
        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 1%');
    });

    test('a phase monster of stage 1 starts at HP 69/69 and the label reads Stage 1/10  Phase 1/8', async ({ page }) => {
        await startGame(page, { stage: 1, encounter: 'PHASE' });

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 69/69');
        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/10  Phase 1/8');
    });

    test('phase 8 of stage 1 is the last phase before the miniboss', async ({ page }) => {
        await startGame(page, { stage: 1, encounter: 'PHASE', phase: 8 });

        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/10  Phase 8/8');
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 69/69');

        //  The clicks are calls of the scene with the loop asleep, so no frame adds a tick; the monster fades out on the loop, which wakes once it is dead
        await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.getScene('ClickerGame');

            game.loop.sleep();

            for (let i = 0; i < 200 && !scene.monster.dead; i++)
            {
                scene.hitMonster({ x: 0, y: 0 });
            }

            game.loop.wake();
        });

        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/10  Miniboss');
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 207/207');
    });
});
