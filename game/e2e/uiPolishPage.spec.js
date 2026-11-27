import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The page guards (spec ui-polish, UIP-01 to UIP-05): nothing outside the two text fields of the start screen is selected, dragged as a ghost or opened in the browser
//  menu, plain text shows the arrow cursor and the focus ring follows the keyboard only.
const ARMORED = { element: 'FIRE', defense: 20, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};

const startGame = async (page, options = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER, ...options });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText(/yan/);
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return menu;
};

//  The start screen: the fake backend answers the health check, nobody is signed in
const startScreen = async (page) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER });

    return openMainMenu(page);
};

const selection = (page) => page.evaluate(() => window.getSelection().toString());
const blur = (page) => page.evaluate(() => document.activeElement?.blur());

//  Opens Talentos and picks COMBO, so the card name and the upgrade button exist
const openTalents = async (page) => {
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
};

const pickCombo = async (page) => {
    await openTalents(page);
    await page.getByTestId('talent-COMBO').click();
    await expect(page.getByTestId('talent-detail-name')).toBeVisible();
};

test.describe('No selection (UIP-01)', () => {
    test('html and body have user-select none', async ({ page }) => {
        await startScreen(page);

        await expect(page.locator('html')).toHaveCSS('user-select', 'none');
        await expect(page.locator('body')).toHaveCSS('user-select', 'none');
    });

    test('Ctrl+A on the start screen selects nothing', async ({ page }) => {
        await startScreen(page);
        await blur(page);
        await page.keyboard.press('Control+A');

        expect(await selection(page)).toBe('');
    });

    test('Ctrl+A on the battle screen selects nothing', async ({ page }) => {
        await startGame(page);
        await blur(page);
        await page.keyboard.press('Control+A');

        expect(await selection(page)).toBe('');
    });

    test('Ctrl+A on Talentos selects nothing', async ({ page }) => {
        await startGame(page);
        await openTalents(page);
        await blur(page);
        await page.keyboard.press('Control+A');

        expect(await selection(page)).toBe('');
    });

    test('a double click on the points pill or the card name selects nothing', async ({ page }) => {
        await startGame(page, { talentPoints: { yan: 5 } });
        await pickCombo(page);

        await page.getByTestId('talent-points').locator('.talent-pill').dblclick();
        expect(await selection(page)).toBe('');

        await page.getByTestId('talent-detail-name').dblclick();
        expect(await selection(page)).toBe('');
    });

    test('a drag across the Talentos window selects nothing', async ({ page }) => {
        await startGame(page);
        await openTalents(page);

        const box = await page.locator('.hero-window').boundingBox();

        await page.mouse.move(box.x + 4, box.y + 4);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, { steps: 10 });
        await page.mouse.up();

        expect(await selection(page)).toBe('');
    });

    test('the username field still selects its text', async ({ page }) => {
        const menu = await startScreen(page);

        await menu.username.click();
        await page.keyboard.type('yan');
        await page.keyboard.press('Control+A');

        expect(await menu.username.evaluate((input) => [ input.selectionStart, input.selectionEnd ])).toEqual([ 0, 3 ]);
        await expect(menu.username).toHaveCSS('user-select', 'text');
    });

    test('the password field keeps user-select text', async ({ page }) => {
        const menu = await startScreen(page);

        await expect(menu.password).toHaveCSS('user-select', 'text');
    });
});

test.describe('No drag ghost (UIP-02)', () => {
    test('every image of Talentos has -webkit-user-drag none', async ({ page }) => {
        await startGame(page);
        await openTalents(page);

        const drags = await page.getByTestId('talent-screen').evaluate((screen) =>
            [ ...screen.querySelectorAll('img') ].map((img) => getComputedStyle(img).getPropertyValue('-webkit-user-drag')));

        expect(drags.length).toBeGreaterThanOrEqual(60);
        expect(drags.filter((drag) => drag !== 'none')).toEqual([]);
    });

    test('dragstart on a node icon is cancelled', async ({ page }) => {
        await startGame(page);
        await openTalents(page);

        const cancelled = await page.locator('[data-testid="talent-COMBO"] img').first().evaluate((img) => {
            const event = new DragEvent('dragstart', { bubbles: true, cancelable: true });

            img.dispatchEvent(event);

            return event.defaultPrevented;
        });

        expect(cancelled).toBe(true);
    });

    test('dragstart on the username field is not cancelled', async ({ page }) => {
        const menu = await startScreen(page);

        const cancelled = await menu.username.evaluate((input) => {
            const event = new DragEvent('dragstart', { bubbles: true, cancelable: true });

            input.dispatchEvent(event);

            return event.defaultPrevented;
        });

        expect(cancelled).toBe(false);
    });
});

test.describe('No browser menu (UIP-03)', () => {
    test('contextmenu on the canvas is cancelled', async ({ page }) => {
        const menu = await startGame(page);

        const cancelled = await menu.canvas.evaluate((canvas) => {
            const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

            canvas.dispatchEvent(event);

            return event.defaultPrevented;
        });

        expect(cancelled).toBe(true);
    });

    test('a real right click on a talent node is cancelled', async ({ page }) => {
        await startGame(page);
        await openTalents(page);
        await page.evaluate(() => {
            window.addEventListener('contextmenu', (event) => { window.__menuCancelled = event.defaultPrevented; });
        });

        await page.getByTestId('talent-COMBO').click({ button: 'right' });

        expect(await page.evaluate(() => window.__menuCancelled)).toBe(true);
    });

    test('contextmenu on the username field is not cancelled', async ({ page }) => {
        const menu = await startScreen(page);

        const cancelled = await menu.username.evaluate((input) => {
            const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });

            input.dispatchEvent(event);

            return event.defaultPrevented;
        });

        expect(cancelled).toBe(false);
    });
});

test.describe('Arrow cursor (UIP-04)', () => {
    test('plain text shows the arrow', async ({ page }) => {
        await startGame(page);
        await pickCombo(page);

        await expect(page.locator('body')).toHaveCSS('cursor', 'default');
        await expect(page.getByTestId('talent-detail-name')).toHaveCSS('cursor', 'default');
        await expect(page.getByTestId('talent-points').locator('.talent-pill')).toHaveCSS('cursor', 'default');
    });

    test('the text fields show the I-beam', async ({ page }) => {
        const menu = await startScreen(page);

        await expect(menu.username).toHaveCSS('cursor', 'text');
        await expect(menu.password).toHaveCSS('cursor', 'text');
    });

    test('controls keep the hand', async ({ page }) => {
        await startGame(page, { talentPoints: { yan: 5 } });
        await pickCombo(page);

        await expect(page.getByTestId('talent-COMBO')).toHaveCSS('cursor', 'pointer');
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveCSS('cursor', 'pointer');
    });
});

test.describe('Keyboard focus ring (UIP-05)', () => {
    test('a mouse click leaves no ring', async ({ page }) => {
        await startGame(page);
        await page.getByTestId('hud-talents').click();

        await expect(page.getByTestId('hud-talents')).toHaveCSS('outline-style', 'none');
    });

    test('Tab and Shift+Tab bring the ring back', async ({ page }) => {
        await startGame(page);

        const button = page.getByTestId('hud-talents');

        await button.click();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');

        expect(await button.evaluate((node) => node === document.activeElement && node.matches(':focus-visible'))).toBe(true);
        await expect(button).toHaveCSS('outline-style', 'solid');
        await expect(button).toHaveCSS('outline-color', 'rgb(204, 78, 26)');
    });
});
