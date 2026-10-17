import { expect, test } from '@playwright/test';
import { mockBackend, serverDown } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu, registryValue } from './support/game';

test.describe('Sign up', () => {
    test('creates an account and greets the new player', async ({ page }) => {
        const backend = await mockBackend(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'newbie', 'secret123');
        await menu.signupButton.click();

        await expect(menu.message).toHaveText('Account created, newbie!');
        await expect(menu.message).not.toHaveClass(/error/);
        await expect(page.locator('.auth-form')).toHaveCount(0);
        await expect(menu.welcomeTitle).toHaveText('Hello, newbie!');
        expect(await registryValue(page, 'user')).toMatchObject({ username: 'newbie' });
        expect(backend.calls).toEqual([{ method: 'POST', path: '/users', body: { username: 'newbie', password: 'secret123' } }]);
        expect(backend.users.has('newbie')).toBe(true);
    });

    test('rejects a username that already exists', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'another-pass');
        await menu.signupButton.click();

        await expect(menu.message).toHaveText("User 'yan' already exists");
        await expect(menu.signupButton).toBeEnabled();
        expect(await registryValue(page, 'user')).toBeUndefined();
    });

    test('rejects a password that is too short', async ({ page }) => {
        await mockBackend(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'newbie', 'short');
        await menu.signupButton.click();

        await expect(menu.message).toHaveText('Password must have at least 8 characters');
        expect(await registryValue(page, 'user')).toBeUndefined();
    });
});

test.describe('Login', () => {
    test('logs in an existing player and shows the greeting', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Welcome back, yan!');
        await expect(page.locator('.auth-form')).toHaveCount(0);
        await expect(menu.welcomeTitle).toHaveText('Hello, yan!');
        expect(await registryValue(page, 'user')).toMatchObject({ username: 'yan' });
        expect(backend.calls).toEqual([{ method: 'POST', path: '/users/login', body: { username: 'yan', password: 'secret123' } }]);
    });

    test('rejects a wrong password', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'wrong-pass');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Password is invalid');
        await expect(menu.message).toBeVisible();
        await expect(menu.message).toHaveClass(/error/);
        await expect(page.locator('.auth-form')).toBeVisible();
        expect(await registryValue(page, 'user')).toBeUndefined();
    });

    test('rejects an unknown user', async ({ page }) => {
        await mockBackend(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'ghost', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText("User 'ghost' does not exist");
    });

    test('does not call the backend when fields are empty', async ({ page }) => {
        const backend = await mockBackend(page);
        const menu = await openMainMenu(page);

        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Enter username and password');
        expect(backend.calls).toHaveLength(0);
    });

    test('disables the buttons while the request is in flight', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, delayMs: 500 });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.loginButton).toBeDisabled();
        await expect(menu.signupButton).toBeDisabled();
        await expect(menu.message).toHaveText('Welcome back, yan!');
    });

    test('tells the player when the server is unreachable', async ({ page }) => {
        await serverDown(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Cannot reach the server. Try again later.');
        await expect(menu.loginButton).toBeEnabled();
    });
});

test.describe('Sign up then login', () => {
    test('a new player can sign up, then log in with the same credentials after a reload', async ({ page }) => {
        const backend = await mockBackend(page);
        let menu = await openMainMenu(page);

        await fillCredentials(menu, 'newbie', 'secret123');
        await menu.signupButton.click();
        await expect(menu.message).toHaveText('Account created, newbie!');

        //  The session now persists across reloads (persistent-session); drop it to get the form back
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        menu = await openMainMenu(page);

        await fillCredentials(menu, 'newbie', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Welcome back, newbie!');
        expect(backend.calls.map((c) => c.path)).toEqual(['/users', '/users/login']);
    });

    test('a logged in player starts the game with a click', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Welcome back, yan!');

        await menu.canvas.click();

        await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    });
});
