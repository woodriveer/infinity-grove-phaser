import { expect, test } from './support/coverage';
import { mockBackend, serverDown } from './support/fakeBackend';
import { fillCredentials, openMainMenu, SESSION_KEY } from './support/game';

//  The backend wake-up of spec supabase-postgres (RUN-06): the start screen asks GET /api/health once before the session restore
const WAKE = 'Acordando o servidor, aguarde...';

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

test.describe('Backend wake-up on the start screen', () => {
    test('while the server wakes up the start screen says so, then shows the form', async ({ page }) => {
        await mockBackend(page, { healthDelayMs: 4000 });
        await page.goto('/');
        await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));
        await page.locator('#game-container canvas').click();

        await expect(page.getByRole('alert')).toHaveText(WAKE, { timeout: 5000 });
        await expect(page.getByRole('alert')).not.toHaveClass(/error/);
        await expect(page.locator('.auth-form')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('alert')).toHaveText('');
    });

    test('a server that answers at once shows the form with no notice', async ({ page }) => {
        const backend = await mockBackend(page);
        const menu = await openMainMenu(page);

        await expect(menu.message).toHaveText('');
        expect(backend.healthCalls()).toBe(1);
    });

    test('the start screen asks the server once and keeps it out of the API calls', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });

        await logIn(page);

        expect(backend.healthCalls()).toBe(1);
        expect(backend.calls.some((call) => call.path === '/health')).toBe(false);
    });

    test('with the server down the form explains why without waiting for the wake-up timeout', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await logIn(page);
        await expireStoredAccessToken(page);
        await serverDown(page);

        const started = Date.now();

        await page.reload();
        const menu = await openMainMenu(page);

        await expect(menu.message).toHaveText('Cannot reach the server. Try again later.');
        expect(Date.now() - started).toBeLessThan(15000);
    });
});
