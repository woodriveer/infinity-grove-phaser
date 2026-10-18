import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  One stage that a fire click clears fast: phase monsters of 20 health and a nature miniboss of 2 (fire hits nature for double)
const SMALL_CHAPTER = {
    bossHealth: 100,
    bossTimeLimitMs: 60_000,
    boss: { element: 'DARKNESS', physicalDefense: 30, magicalDefense: 30, critResistance: 30 },
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 2, minibossTimeLimitMs: 60_000,
        monster: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
        miniboss: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 }
    } ]
};

const startGame = async (page, options) => {
    const menu = await openMainMenu(page, options);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return menu;
};

const fightPaused = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').paused);

test.describe('Hero screens', () => {
    test('the catalog shows the owned hero in colour and the other four in grey, with every skill of a grey hero locked', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await startGame(page);

        await page.getByTestId('hud-heroes').click();

        await expect(page.locator('.hero-card')).toHaveCount(5);
        await expect(page.locator('.hero-card.is-grey')).toHaveCount(4);
        await expect(page.getByTestId('hero-card-kael')).not.toHaveClass(/is-grey/);
        await expect(page.getByTestId('hero-card-vex')).toHaveClass(/is-grey/);
        expect(await fightPaused(page)).toBe(true);

        await page.getByTestId('hero-card-vex').click();

        await expect(page.locator('.hero-name')).toHaveText('Vex Sombraespinho');
        await expect(page.locator('.skill-row')).toHaveCount(3);
        await expect(page.locator('.skill-row.is-locked')).toHaveCount(3);
        await expect(page.locator('.hero-element')).toHaveText('Elemento: Escuridão');

        await page.getByTestId('hero-close').click();

        expect(await fightPaused(page)).toBe(false);
        await expect(page.locator('.hero-panel')).toBeHidden();
    });

    test('the bag lists the cards and leads to the fusion, which fuses three blank cards into a one star card and unlocks the first skill', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { copies: { 'kael:0': 3 } } } });
        await startGame(page);
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'false');

        await page.getByTestId('hud-bag').click();
        await expect(page.getByTestId('bag-entry-kael-0')).toContainText('x3');
        await page.getByTestId('bag-entry-kael-0').click();

        await expect(page.getByTestId('bag-entry-detail')).toContainText('Para fundir: 3/3');
        await expect(page.locator('.skill-row.is-locked')).toHaveCount(3);

        await page.getByTestId('bag-go-fusion').click();

        await expect(page.getByTestId('fusion-row-kael-0')).toHaveClass(/is-selected/);
        await expect(page.getByTestId('fusion-button-kael-0')).toBeEnabled();
        await expect(page.getByTestId('fusion-row-kael-1')).toHaveCount(0);

        await page.getByTestId('fusion-button-kael-0').click();

        await expect(page.getByTestId('fusion-result')).toHaveText('Nova carta: Kael Raizférrea 1★');
        await expect(page.getByTestId('fusion-row-kael-0')).toHaveCount(0);
        await expect(page.getByTestId('fusion-empty')).toHaveText('Nenhuma fusão disponível');
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'true');
        await expect(page.getByTestId('skill-slot-2')).toHaveAttribute('data-unlocked', 'false');

        await page.getByTestId('hero-close').click();
        await page.getByTestId('hud-bag').click();

        await expect(page.getByTestId('bag-entry-kael-1')).toContainText('x1');
        await expect(page.getByTestId('bag-entry-kael-0')).toHaveCount(0);
    });

    test('27 blank cards fuse step by step into a three star hero with every skill unlocked', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { copies: { 'kael:0': 27 } } } });
        await startGame(page);
        await page.getByTestId('hud-fusion').click();

        //  `copies` cards of that stars level are fused three at a time; the row counts down after each click
        const fuseAll = async (stars, copies) => {
            for (let left = copies - 3; left >= 0; left -= 3) {
                await page.getByTestId(`fusion-button-kael-${stars}`).click();

                //  a row with fewer than 3 cards left is no longer a fusion
                if (left >= 3)
                {
                    await expect(page.getByTestId(`fusion-row-kael-${stars}`).locator('.fusion-copies')).toHaveText(`${left}/3`);
                }
                else
                {
                    await expect(page.getByTestId(`fusion-row-kael-${stars}`)).toHaveCount(0);
                }
            }
        };

        await fuseAll(0, 27);
        await fuseAll(1, 9);
        await fuseAll(2, 3);

        await expect(page.getByTestId('fusion-result')).toHaveText('Nova carta: Kael Raizférrea 3★');
        await expect(page.getByTestId('skill-slot-3')).toHaveAttribute('data-unlocked', 'true');
        await expect(page.locator('.skill-slot.is-locked')).toHaveCount(0);

        await page.getByTestId('hero-close').click();
        await page.getByTestId('hud-bag').click();

        await expect(page.getByTestId('bag-entry-kael-3')).toContainText('x1');
        await expect(page.getByTestId('bag-entry-kael-0')).toHaveCount(0);
        await page.getByTestId('bag-entry-kael-3').click();
        await expect(page.getByTestId('bag-go-fusion')).toHaveCount(0);
    });

    test('a failed fusion shows the Portuguese error and leaves the bag as it was', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { copies: { 'kael:0': 3 } } } });
        await startGame(page);
        await page.getByTestId('hud-fusion').click();
        await expect(page.getByTestId('fusion-button-kael-0')).toBeVisible();

        //  The backend lost two cards (another tab fused them) since the screen loaded
        backend.cardsOf('yan').copies['kael:0'] = 1;
        await page.getByTestId('fusion-button-kael-0').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível fundir as cartas.');
        await expect(page.getByTestId('fusion-row-kael-0').locator('.fusion-copies')).toHaveText('3/3');
        await expect(page.getByTestId('fusion-result')).toHaveCount(0);
    });

    test('the leader picker changes the leader and the skill bar shows the skills of the new one', async ({ page }) => {
        const backend = await mockBackend(page, {
            users: { yan: 'secret123' },
            cards: { yan: { copies: { 'kael:0': 1, 'lyra:1': 1 } } }
        });
        await startGame(page);
        await expect(page.getByTestId('skill-slot-1').locator('img')).toHaveAttribute('src', 'assets/heroes/kael_dimensional_cut.jpg');
        await expect(page.locator('.skill-slot.is-locked')).toHaveCount(3);

        await page.getByTestId('hud-leader').click();
        await expect(page.getByTestId('leader-entry-kael')).toHaveClass(/is-current/);
        await expect(page.getByTestId('leader-entry-vex')).toHaveCount(0);
        await page.getByTestId('leader-entry-lyra').click();

        await expect(page.getByTestId('leader-entry-lyra')).toHaveClass(/is-current/);
        await expect(page.getByTestId('skill-slot-1').locator('img')).toHaveAttribute('src', 'assets/heroes/lyra_double_shot.jpg');
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'true');
        await expect(page.locator('.skill-slot.is-locked')).toHaveCount(2);
        expect(backend.cardsOf('yan').leader).toBe('lyra');
    });

    test('clicking a skill slot does not change the fight', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, definition: SMALL_CHAPTER });
        await startGame(page);
        const health = () => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
        await expect.poll(health).toBe(20);

        await page.getByTestId('skill-slot-1').click({ force: true });

        expect(await health()).toBe(20);
    });

    test('Esc closes a hero screen without opening the pause menu', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await startGame(page);
        await page.getByTestId('hud-heroes').click();
        await expect(page.locator('.hero-panel')).toBeVisible();

        await page.keyboard.press('Escape');

        await expect(page.locator('.hero-panel')).toBeHidden();
        await expect(page.locator('.pause-menu')).toBeHidden();
        expect(await fightPaused(page)).toBe(false);
    });

    test('a card dropped by a won miniboss shows the notice and joins the bag', async ({ page }) => {
        await mockBackend(page, {
            users: { yan: 'secret123' },
            definition: SMALL_CHAPTER,
            progress: { yan: { stage: 1, encounter: 'MINIBOSS', phase: 1 } },
            chances: [ 0 ]
        });
        const menu = await startGame(page);
        const sceneHealth = () => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
        await expect.poll(sceneHealth).toBe(2);

        await menu.canvas.click();
        //  The report leaves with the 10 s tick; run it now
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').tick());

        await expect(page.getByTestId('card-notice')).toHaveText('Carta: Kael Raizférrea');
        await expect(page.getByTestId('card-notice')).toBeHidden({ timeout: 8_000 });

        await page.getByTestId('hud-bag').click();

        await expect(page.getByTestId('bag-entry-kael-0')).toContainText('x2');
    });
});
