import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the version label (.specs/features/game-version/ui-review/). Everything runs on the fake backend;
//  the only stub is the held background.png that keeps the loading bar on screen.
test('game version label on every screen', async ({ page }, testInfo) => {
    const problems = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(m.text()); });
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()} ${r.url()}`); });
    let release;
    const held = new Promise((resolve) => { release = resolve; });

    await page.route('**/assets/background.png', async (route) => {
        await held;
        await route.continue();
    });
    await mockBackend(page, { users: { yan: 'secret123' } });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__?.scene.getScene('Preloader')?.children.list.length)).toBeGreaterThan(0);
    await expect(page.getByTestId('game-version')).toBeVisible();
    await shot(page, testInfo, '01-loading');

    release();
    await page.waitForFunction(() => window.__PHASER_GAME__?.scene.isActive('Splash'), null, { timeout: 30_000 });
    await page.waitForTimeout(1200);
    await shot(page, testInfo, '02-splash');

    //  A reload skips the held route and reaches the login form the way the e2e specs do
    await page.unroute('**/assets/background.png');
    const menu = await openMainMenu(page);
    await shot(page, testInfo, '03-login');

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-farm')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '04-battle');

    await page.getByTestId('hud-bag').click();
    await page.waitForTimeout(500);
    await shot(page, testInfo, '05-battle-bag');

    if (testInfo.project.name === 'desktop') {
        await page.getByTestId('hero-close').click();
        await page.mouse.move(0, 0);
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(500);
        await shot(page, testInfo, '06-battle-4x3');
    }
    console.log(`CONSOLE-REPORT (${testInfo.project.name}): ${problems.length ? problems.join(' | ') : 'clean'}`);
});
