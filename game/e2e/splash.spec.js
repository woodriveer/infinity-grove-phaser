import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';

//  The start of the game: no black screen waiting for a click. The loading bar hands over to a splash
//  (a tree grows, crystals light up around it, the logo fades in) that moves on to the login form by itself.
//  Durations are read as splash time (the frame deltas its tweens run on): headless Chromium draws the scenes at
//  a few frames per second, so wall-clock time says little about what the player sees.
const SPLASH_END_MS = 3300;
const BOOT_TIMEOUT = 30_000;

const waitForSplash = (page) =>
    page.waitForFunction(() => window.__PHASER_GAME__?.scene.isActive('Splash'), null, { timeout: BOOT_TIMEOUT });

const splashState = (page) => page.evaluate(() => {
    const splash = window.__PHASER_GAME__.scene.getScene('Splash');
    return {
        crystals: splash.crystals.length,
        logo: splash.logo.texture.key,
        logoAlpha: splash.logo.alpha,
        lasted: splash.endedAt
    };
});

test.describe('Splash screen', () => {
    test('plays on its own and ends on the login form with no click', async ({ page }) => {
        await mockBackend(page);
        await page.goto('/');
        await waitForSplash(page);

        expect(await splashState(page)).toMatchObject({ crystals: 7, logo: 'logo', logoAlpha: 0, lasted: null });

        //  The logo fades in while the splash plays, still with no input from the player
        await expect.poll(async () => (await splashState(page)).logoAlpha, { timeout: BOOT_TIMEOUT }).toBe(1);

        await expect(page.locator('.auth-form')).toBeVisible({ timeout: BOOT_TIMEOUT });
        //  The splash fades out over the start screen, then is gone
        await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__.scene.isActive('Splash')), { timeout: BOOT_TIMEOUT }).toBe(false);
        //  It ran its full length: nothing skipped it
        expect((await splashState(page)).lasted).toBeGreaterThan(SPLASH_END_MS * 0.9);
    });

    test('a click skips the splash', async ({ page }) => {
        await mockBackend(page);
        await page.goto('/');
        await waitForSplash(page);

        await page.locator('#game-container canvas').click();

        //  It leaves on the click, well before its own end
        await expect.poll(async () => (await splashState(page)).lasted, { timeout: 5_000 }).not.toBeNull();
        expect((await splashState(page)).lasted).toBeLessThan(SPLASH_END_MS / 2);
        await expect(page.locator('.auth-form')).toBeVisible({ timeout: BOOT_TIMEOUT });
    });

    test.describe('with reduced motion', () => {
        test.use({ reducedMotion: 'reduce' });

        test('shows the finished picture at once and moves on in under a second', async ({ page }) => {
            await mockBackend(page);
            await page.goto('/');
            await waitForSplash(page);

            expect((await splashState(page)).logoAlpha).toBe(1);

            await expect(page.locator('.auth-form')).toBeVisible({ timeout: BOOT_TIMEOUT });

            const { lasted } = await splashState(page);

            expect(lasted).toBeGreaterThan(0);
            expect(lasted).toBeLessThan(1000);
        });
    });

    test.describe('on a phone', () => {
        test.use({ viewport: { width: 390, height: 844 } });

        test('plays and reaches the login form with no click', async ({ page }) => {
            await mockBackend(page);
            await page.goto('/');
            await waitForSplash(page);

            await expect(page.locator('.auth-form')).toBeVisible({ timeout: BOOT_TIMEOUT });
            expect((await splashState(page)).lasted).toBeGreaterThan(SPLASH_END_MS * 0.9);
        });
    });
});
