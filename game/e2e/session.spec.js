import { expect, test } from '@playwright/test';
import { mockBackend, serverDown } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu, registryValue, SESSION_KEY, storedSession } from './support/game';

const paths = (backend) => backend.calls.map((call) => call.path);

//  Logs in through the UI so the game stores a real session
const logIn = async (page, username = 'yan') => {
    const menu = await openMainMenu(page);

    await fillCredentials(menu, username, 'secret123');
    await menu.loginButton.click();
    await expect(menu.welcomeTitle).toHaveText(`Hello, ${username}!`);

    return menu;
};

//  Moves the stored access token expiry into the past, as if 24 h had gone by
const expireStoredAccessToken = (page) =>
    page.evaluate((key) => {
        const session = JSON.parse(localStorage.getItem(key));
        session.accessTokenExpiresAt = Date.now() - 1000;
        localStorage.setItem(key, JSON.stringify(session));
    }, SESSION_KEY);

test.describe('Persistent session', () => {
    test('a reload after login shows the welcome without the form or a login call', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });
        await logIn(page);
        const callsBeforeReload = backend.calls.length;

        await page.reload();
        const menu = await openMainMenu(page, { state: 'welcome' });

        await expect(menu.welcomeTitle).toHaveText('Hello, yan!');
        await expect(page.locator('.auth-form')).toHaveCount(0);
        expect(backend.calls.slice(callsBeforeReload)).toEqual([]);
        expect(paths(backend)).toEqual(['/users/login']);
        expect(await registryValue(page, 'user')).toMatchObject({ username: 'yan' });
        expect(JSON.parse(await storedSession(page))).toMatchObject({ user: { username: 'yan' } });
    });

    test('an expired access token is renewed with exactly one refresh call', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });
        await logIn(page);
        const before = JSON.parse(await storedSession(page));
        await expireStoredAccessToken(page);

        await page.reload();
        const menu = await openMainMenu(page, { state: 'welcome' });

        await expect(menu.welcomeTitle).toHaveText('Hello, yan!');
        await expect(page.locator('.auth-form')).toHaveCount(0);
        expect(paths(backend).filter((path) => path === '/auth/refresh')).toHaveLength(1);
        const after = JSON.parse(await storedSession(page));
        expect(after.accessToken).not.toBe(before.accessToken);
        expect(after.refreshToken).not.toBe(before.refreshToken);
        expect(after.user.username).toBe('yan');
    });

    test('a rejected refresh removes the stored session and shows the form', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });
        await logIn(page);
        await expireStoredAccessToken(page);
        backend.revokeAllRefreshTokens();

        await page.reload();
        const menu = await openMainMenu(page);

        await expect(menu.loginButton).toBeVisible();
        expect(await storedSession(page)).toBeNull();
        expect(await registryValue(page, 'user')).toBeUndefined();
        expect(paths(backend).filter((path) => path === '/auth/refresh')).toHaveLength(1);
    });

    test('with the server down on reload the session is kept and the form explains why', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await logIn(page);
        await expireStoredAccessToken(page);
        const kept = await storedSession(page);
        await serverDown(page);

        await page.reload();
        const menu = await openMainMenu(page);

        await expect(menu.message).toHaveText('Cannot reach the server. Try again later.');
        await expect(menu.message).toHaveClass(/error/);
        expect(await storedSession(page)).toBe(kept);
    });

    test('corrupt stored JSON is removed and the form shows', async ({ page }) => {
        await mockBackend(page);
        await page.goto('/');
        await page.evaluate((key) => localStorage.setItem(key, '{not valid json'), SESSION_KEY);

        const menu = await openMainMenu(page);

        await expect(menu.loginButton).toBeVisible();
        expect(await storedSession(page)).toBeNull();
    });

    test('logout clears the session, calls the backend once and does not start the game', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });
        let menu = await logIn(page);
        const { refreshToken } = JSON.parse(await storedSession(page));

        await menu.logoutButton.click();

        await expect(page.locator('.auth-form')).toBeVisible();
        await expect(page.locator('.welcome')).toHaveCount(0);
        await expect(menu.logoutButton).toHaveCount(0);
        expect(await storedSession(page)).toBeNull();
        expect(await registryValue(page, 'user')).toBeUndefined();
        expect(backend.calls.filter((call) => call.path === '/auth/logout')).toEqual([
            { method: 'POST', path: '/auth/logout', body: { refreshToken } }
        ]);

        //  A later canvas click must not start the game either
        await menu.canvas.click({ position: { x: 20, y: 20 } });
        expect(await activeSceneKeys(page)).not.toContain('ClickerGame');

        await page.reload();
        menu = await openMainMenu(page);
        await expect(menu.loginButton).toBeVisible();
    });

    test('the logo is 400 px wide', async ({ page }) => {
        await mockBackend(page);
        await openMainMenu(page);

        const width = await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('MainMenu');
            return scene.children.list.find((child) => child.texture?.key === 'logo').displayWidth;
        });

        expect(width).toBeCloseTo(400, 1);
    });
});
