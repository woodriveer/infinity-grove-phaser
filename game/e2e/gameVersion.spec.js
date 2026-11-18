import { readFileSync } from 'node:fs';
import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The label reads the version of game/package.json (spec game-version, GV-07); gitops bumps it on every release, so no literal here
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const LABEL = `v${version.trim()}`;
const BOOT_TIMEOUT = 30_000;
const SPLASH_END_MS = 3300;

const label = (page) => page.getByTestId('game-version');
const canvasBox = (page) => page.locator('#game-container canvas').boundingBox();
const waitForScene = (page, key) =>
    page.waitForFunction((k) => window.__PHASER_GAME__?.scene.isActive(k), key, { timeout: BOOT_TIMEOUT });
const splashEndedAt = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Splash').endedAt);

//  The label is visible, reads the version and is the only one on the page
const expectOneLabel = async (page) => {
    await expect(label(page)).toBeVisible();
    await expect(label(page)).toHaveText(LABEL);
    await expect(label(page)).toHaveCount(1);
};

//  Right edge 8 px and bottom edge 4 px from the viewport edges, ±1 px (GV-09)
const expectInCorner = async (page) => {
    const box = await label(page).boundingBox();
    const viewport = page.viewportSize();

    expect(Math.abs(viewport.width - (box.x + box.width) - 8)).toBeLessThanOrEqual(1);
    expect(Math.abs(viewport.height - (box.y + box.height) - 4)).toBeLessThanOrEqual(1);

    return box;
};

const startGame = async (page) => {
    await mockBackend(page, { users: { yan: 'secret123' } });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-farm')).toBeVisible();
};

//  The computed style the spec names for the label (GV-12), read in one evaluate
const expectGroveStyle = async (page) => {
    const style = await label(page).evaluate((element) => {
        const computed = getComputedStyle(element);

        return {
            position: computed.position,
            fontFamily: computed.fontFamily,
            fontWeight: computed.fontWeight,
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            color: computed.color,
            opacity: computed.opacity,
            textShadow: computed.textShadow,
            whiteSpace: computed.whiteSpace,
            zIndex: computed.zIndex,
            pointerEvents: computed.pointerEvents,
            userSelect: computed.userSelect
        };
    });

    expect(style.fontFamily).toMatch(/^"?Figtree"?,/);
    expect(style).toMatchObject({
        position: 'fixed',
        fontWeight: '600',
        fontSize: '12px',
        lineHeight: '12px',
        letterSpacing: '0.48px',
        color: 'rgb(230, 208, 162)',
        opacity: '0.6',
        textShadow: 'rgb(28, 18, 12) 0px 1px 2px',
        whiteSpace: 'nowrap',
        zIndex: '10',
        pointerEvents: 'none',
        userSelect: 'none'
    });
};

test.describe('Game version', () => {
    test('shows the version on the loading screen', async ({ page }) => {
        //  The background image is held, so the loading bar stays on screen while the label is read
        let release;
        const held = new Promise((resolve) => { release = resolve; });
        await page.route('**/assets/background.png', async (route) => {
            await held;
            await route.continue();
        });

        await mockBackend(page);
        await page.goto('/');
        //  The Preloader is still loading (held by the route), so it is not an active scene yet: its bar is what the test waits for
        await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__?.scene.getScene('Preloader')?.children.list.length)).toBeGreaterThan(0);

        await expectOneLabel(page);

        release();
        await waitForScene(page, 'Splash');
    });

    test('shows the version on the splash', async ({ page }) => {
        await mockBackend(page);
        await page.goto('/');
        await waitForScene(page, 'Splash');

        await expectOneLabel(page);
    });

    test('shows the version on the login form, right of the canvas', async ({ page }) => {
        await mockBackend(page);
        await openMainMenu(page);

        await expectOneLabel(page);
        const box = await expectInCorner(page);
        const canvas = await canvasBox(page);

        expect(box.x).toBeGreaterThanOrEqual(canvas.x + canvas.width);
    });

    test('shows the version in the battle, right of the canvas', async ({ page }) => {
        await startGame(page);

        await expectOneLabel(page);
        const box = await expectInCorner(page);
        const canvas = await canvasBox(page);

        expect(box.x).toBeGreaterThanOrEqual(canvas.x + canvas.width);
    });

    test('draws the version small, dim and click-through in the Grove style', async ({ page }) => {
        await mockBackend(page);
        await openMainMenu(page);

        await expectGroveStyle(page);
    });
});

test.describe('Game version on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('shows the version below the canvas at full size', async ({ page }) => {
        await mockBackend(page);
        await openMainMenu(page);

        await expectOneLabel(page);
        const box = await expectInCorner(page);
        const canvas = await canvasBox(page);

        expect(box.y).toBeGreaterThanOrEqual(canvas.y + canvas.height);
        expect(Math.abs(box.height - 12)).toBeLessThanOrEqual(1);
        await expectGroveStyle(page);
    });
});

test.describe('Game version on a 4:3 screen', () => {
    test.use({ viewport: { width: 1024, height: 768 } });

    test('lets a click on the label through to the game', async ({ page }) => {
        await mockBackend(page);
        await page.goto('/');
        await waitForScene(page, 'Splash');

        const box = await expectInCorner(page);
        const canvas = await canvasBox(page);

        //  No letterbox: the label lies over the canvas
        expect(box.x).toBeGreaterThanOrEqual(canvas.x);
        expect(box.y + box.height).toBeLessThanOrEqual(canvas.y + canvas.height);

        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        const hit = await page.evaluate(([px, py]) => {
            const element = document.elementFromPoint(px, py);

            return { tag: element.tagName, inGame: !!element.closest('#game-container') };
        }, [x, y]);

        expect(hit).toEqual({ tag: 'CANVAS', inGame: true });

        //  The click on the label skips the splash
        await page.mouse.click(x, y);
        await expect.poll(() => splashEndedAt(page), { timeout: 5_000 }).not.toBeNull();
        expect(await splashEndedAt(page)).toBeLessThan(SPLASH_END_MS / 2);
        await expect(page.locator('.auth-form')).toBeVisible({ timeout: BOOT_TIMEOUT });
    });
});
