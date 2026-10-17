import { expect } from '@playwright/test';

//  Boots the game through Boot -> Preloader and waits until MainMenu has rendered its DOM form
//  (state 'form', default) or the welcome block of a restored session (state 'welcome').
export async function openMainMenu (page, { state = 'form' } = {}) {
    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    //  Boot only listens for the click once its create() ran; an earlier click would be lost
    await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));
    await canvas.click();

    await expect(page.locator(state === 'welcome' ? '.welcome' : '.auth-form')).toBeVisible({ timeout: 15_000 });

    //  MainMenu input stays disabled until the Preloader fade-out transition ends
    await page.waitForFunction(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('MainMenu');
        return scene.input.enabled && !window.__PHASER_GAME__.scene.isActive('Preloader');
    });

    return {
        canvas,
        username: page.locator('.auth-form input[name="username"]'),
        password: page.locator('.auth-form input[name="password"]'),
        loginButton: page.getByRole('button', { name: 'Login' }),
        signupButton: page.getByRole('button', { name: 'Sign up' }),
        message: page.getByRole('alert'),
        welcomeTitle: page.locator('.welcome-title'),
        logoutButton: page.getByRole('button', { name: 'Logout' })
    };
}

export async function fillCredentials (menu, username, password) {
    await menu.username.fill(username);
    await menu.password.fill(password);
}

//  Game state that has no DOM representation is read from the Phaser game exposed in dev (see src/main.js).
export const registryValue = (page, key) =>
    page.evaluate((k) => window.__PHASER_GAME__.registry.get(k), key);

export const activeSceneKeys = (page) =>
    page.evaluate(() => window.__PHASER_GAME__.scene.getScenes(true).map((scene) => scene.sys.settings.key));

export const SESSION_KEY = 'infinity-grove.session';

//  Raw localStorage entry of the persistent session (null when absent)
export const storedSession = (page) =>
    page.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
