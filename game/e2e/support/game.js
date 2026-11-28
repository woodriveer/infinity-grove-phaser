import { expect } from '@playwright/test';

//  The splash plays on its own after the loading bar (spec: no click before the start screen). Tests skip it with a
//  click once it runs, which also exercises the skip; e2e/splash.spec.js checks that it moves on with no click.
export async function skipSplash (page) {
    await page.waitForFunction(() => window.__PHASER_GAME__?.scene.isActive('Splash'), null, { timeout: 30_000 });
    await page.locator('#game-container canvas').click();
}

//  Boots the game through Boot -> Preloader -> Splash and waits until MainMenu has rendered its DOM form
//  (state 'form', default) or the welcome block of a restored session (state 'welcome').
export async function openMainMenu (page, { state = 'form', random = 0.99 } = {}) {
    await page.goto('/');

    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible();

    //  The critical roll is fixed (0.99 never crits a default monster) so click counts are deterministic
    await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('services'));
    await page.evaluate((roll) => { window.__PHASER_GAME__.registry.get('services').random = () => roll; }, random);
    await skipSplash(page);

    await expect(page.locator(state === 'welcome' ? '.welcome' : '.auth-form')).toBeVisible({ timeout: 15_000 });

    //  MainMenu input stays disabled until the Splash fade-out transition ends
    await page.waitForFunction(() => {
        const game = window.__PHASER_GAME__;
        return game.scene.getScene('MainMenu').input.enabled && !game.scene.isActive('Preloader') && !game.scene.isActive('Splash');
    });

    return {
        canvas,
        username: page.locator('.auth-form input[name="username"]'),
        password: page.locator('.auth-form input[name="password"]'),
        loginButton: page.getByRole('button', { name: 'Entrar', exact: true }),
        signupButton: page.getByRole('button', { name: 'Criar conta', exact: true }),
        pathTitle: page.locator('.path-title'),
        pathHint: page.locator('.path-hint'),
        heroChoices: page.locator('.path-option'),
        //  Picks the first hero on the screen after Criar conta: FIRE, WATER or NATURE; the pick creates the account
        chooseHero: (element) => page.locator(`.path-option[data-element="${element}"]`).click(),
        message: page.getByRole('alert'),
        welcomeTitle: page.locator('.welcome-title'),
        logoutButton: page.getByRole('button', { name: 'Sair', exact: true })
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
