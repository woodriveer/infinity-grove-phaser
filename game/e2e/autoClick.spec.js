import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Monsters of 1000 health so the auto click never kills one while a test watches it
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000 } ]
};

const startGame = async (page, chapter) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER, progress: { yan: { chapter } } });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('chapter-hud')).toHaveText(`Capítulo ${chapter}`);

    return menu;
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

test.describe('Auto click', () => {
    test('in chapter 2 the monster loses health with no click', async ({ page }) => {
        await startGame(page, 2);

        await expect.poll(() => health(page), { timeout: 5000 }).toBeLessThan(1000);
    });

    //  Spec background-fight: the fight runs behind the hero screens
    for (const [ screen, title ] of [ [ 'talents', 'Talentos' ], [ 'equipment', 'Equipamento' ] ])
    {
        test(`keeps hitting while the ${title} screen is open`, async ({ page }) => {
            await startGame(page, 2);

            await page.getByTestId(`hud-${screen}`).click();
            await expect(page.locator('.hero-title')).toHaveText(title);
            const opened = await health(page);

            await expect.poll(() => health(page), { timeout: 5000 }).toBeLessThan(opened);
        });
    }

    test('shows 500 ms, Cristais: 0 and a disabled Melhorar: 250 ms (10 cristais)', async ({ page }) => {
        await startGame(page, 2);

        await expect(page.getByTestId('auto-click-toggle')).toBeChecked();
        await expect(page.getByTestId('auto-click-interval')).toHaveText('500 ms');
        await expect(page.getByTestId('auto-click-crystals')).toHaveText('Cristais: 0');
        await expect(page.getByTestId('auto-click-upgrade')).toHaveText('Melhorar: 250 ms (10 cristais)');
        await expect(page.getByTestId('auto-click-upgrade')).toBeDisabled();
    });

    test('unchecking Auto clique stops it, without the click hitting the monster', async ({ page }) => {
        await startGame(page, 2);
        //  Counts the hits of the pointer: the click on the switch must not reach the canvas
        await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');
            const hit = scene.hitMonster.bind(scene);

            window.__pointerHits = 0;
            scene.hitMonster = (pointer) => { window.__pointerHits += 1; hit(pointer); };
        });

        await page.getByTestId('auto-click-toggle').click();
        await expect(page.getByTestId('auto-click-toggle')).not.toBeChecked();
        expect(await page.evaluate(() => window.__pointerHits)).toBe(0);
        const stopped = await health(page);
        await page.waitForTimeout(1500);

        expect(await health(page)).toBe(stopped);
    });

    test('in chapter 1 there is no Auto clique switch and no hit without a click', async ({ page }) => {
        await startGame(page, 1);

        await expect(page.getByTestId('auto-click-toggle')).toBeHidden();
        await page.waitForTimeout(1500);

        expect(await health(page)).toBe(1000);
    });
});

//  Spec background-fight. A headless page is never hidden: the test stops the Phaser loop, as the browser does by holding
//  requestAnimationFrame, and reports the page hidden or visible again.
const setHidden = (page, hidden) => page.evaluate((value) => {
    const game = window.__PHASER_GAME__;

    game.loop.sleep();
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
}, hidden);

test.describe('Auto click in a hidden tab', () => {
    test('keeps hitting the monster while the page is hidden and the Phaser loop is stopped', async ({ page }) => {
        await startGame(page, 2);
        await setHidden(page, true);
        const frame = await page.evaluate(() => window.__PHASER_GAME__.loop.frame);
        const hidden = await health(page);

        await expect.poll(() => health(page), { timeout: 5000 }).toBeLessThan(hidden);
        expect(await page.evaluate(() => window.__PHASER_GAME__.loop.frame)).toBe(frame);
    });

    test('fires no auto click while the fight is paused with Esc and the page is hidden', async ({ page }) => {
        await startGame(page, 2);
        await page.keyboard.press('Escape');
        await expect(page.locator('.pause-menu')).toBeVisible();
        await setHidden(page, true);
        const paused = await health(page);

        await page.waitForTimeout(2500);

        expect(await health(page)).toBe(paused);
    });

    test('stops the background ticker once the page is visible again', async ({ page }) => {
        await startGame(page, 2);
        await setHidden(page, true);
        const hidden = await health(page);
        await expect.poll(() => health(page), { timeout: 5000 }).toBeLessThan(hidden);

        //  The Phaser loop stays asleep, so only the ticker could still hit
        await setHidden(page, false);
        const shown = await health(page);
        await page.waitForTimeout(2500);

        expect(await health(page)).toBe(shown);
    });
});
