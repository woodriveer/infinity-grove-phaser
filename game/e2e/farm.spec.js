import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Every boss has 2 health and is nature, so one fire click (double damage) wins a fight
const FAST_BOSSES = {
    bossHealth: 2,
    bossTimeLimitMs: 60_000,
    boss: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 2, minibossTimeLimitMs: 60_000,
        monster: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
        miniboss: { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 }
    } ]
};

const COMPLETED = { stage: 1, encounter: 'CHAPTER_BOSS', phase: 1, completed: true };
const today = () => new Date().toISOString().slice(0, 10);

const startGame = async (page, backendOptions) => {
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, definition: FAST_BOSSES, progress: { yan: COMPLETED }, ...backendOptions });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return { backend, menu };
};

const farmCalls = (backend) => backend.calls.filter((call) => call.path === '/farm/outcome');
const openFarm = (page) => page.getByTestId('hud-farm').click();
const farmLabel = (page) => page.locator('.stage-hud');
const bossHealth = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

test.describe('Rever chefes', () => {
    test('lists the minibosses and the chapter boss with ten wins left once the campaign is completed', async ({ page }) => {
        await startGame(page);

        await openFarm(page);

        await expect(page.getByTestId('farm-entry-miniboss-1')).toHaveAttribute('aria-label', 'Miniboss 1');
        await expect(page.getByTestId('farm-entry-miniboss-1')).toHaveText('1');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toHaveAttribute('aria-label', 'Chefe do capítulo');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('Chefe');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('10 vitórias restantes hoje');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toBeEnabled();
    });

    test('says no boss was beaten while the campaign is at its start', async ({ page }) => {
        await startGame(page, { progress: {} });

        await openFarm(page);

        await expect(page.getByTestId('farm-empty')).toHaveText('Nenhum chefe derrotado ainda.');
    });

    test('a won farm fight reports the win, shows the dropped card, brings the boss back and leaves the campaign alone', async ({ page }) => {
        const { backend, menu } = await startGame(page, { chances: [ 0 ] });
        await openFarm(page);

        await page.getByTestId('farm-entry-miniboss-1').click();

        await expect(page.locator('.hero-panel')).toBeHidden();
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 1');
        await expect(page.locator('.boss-timer')).toHaveText('Time: 60');

        await menu.canvas.click();

        await expect(page.getByTestId('card-notice')).toHaveText('Carta: Kael Raizférrea');
        expect(farmCalls(backend).map((call) => call.body)).toEqual([ { boss: { kind: 'MINIBOSS', stage: 1 }, outcome: 'CLEARED' } ]);
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 1');
        await expect(page.locator('.boss-timer')).toHaveText('Time: 60');
        expect(backend.progresses.get('yan')).toMatchObject(COMPLETED);
        expect(backend.calls.filter((call) => call.path === '/progress/outcome')).toEqual([]);
        expect(backend.cardsOf('yan').copies['kael:0']).toBe(2);
    });

    test('the chapter boss pays ten wins a day and its button is disabled at zero', async ({ page }) => {
        const { backend, menu } = await startGame(page, { cards: { yan: { cleared: [ 1 ], winsDay: today(), winsToday: 9 } } });
        await openFarm(page);
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('1 vitórias restantes hoje');

        await page.getByTestId('farm-entry-chapter-boss').click();
        await expect(farmLabel(page)).toHaveText('Rever chefe: Chefe do capítulo');
        await menu.canvas.click();

        //  The tenth win ends the loop: the campaign view is back and the list shows zero wins left
        await expect(page.locator('.hero-panel')).toBeVisible();
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('0 vitórias restantes hoje');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toBeDisabled();
        await expect(page.getByTestId('farm-entry-miniboss-1')).toBeEnabled();
        await expect(page.locator('.stage-message')).toHaveText('Chapter complete!');
        expect(farmCalls(backend)).toHaveLength(1);
    });

    test('the chapter boss cannot be fought when the ten wins of the day are used', async ({ page }) => {
        await startGame(page, { cards: { yan: { cleared: [ 1 ], winsDay: today(), winsToday: 10 } } });

        await openFarm(page);

        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('0 vitórias restantes hoje');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toBeDisabled();
    });

    test('a win the backend refuses ends the farm without a notice', async ({ page }) => {
        const { backend, menu } = await startGame(page, { farmMinIntervalMs: 600_000 });
        await openFarm(page);
        await page.getByTestId('farm-entry-miniboss-1').click();

        await menu.canvas.click();
        await expect.poll(() => farmCalls(backend).length).toBe(1);
        //  The boss fades and comes back after about 1.5 s
        await expect.poll(() => bossHealth(page), { timeout: 10_000 }).toBe(2);
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 1');
        await menu.canvas.click();

        await expect.poll(() => farmCalls(backend).length).toBe(2);
        await expect(page.locator('.stage-message')).toHaveText('Chapter complete!');
        await expect(page.getByTestId('card-notice')).toBeHidden();
        expect(backend.progresses.get('yan')).toMatchObject(COMPLETED);
    });

    test('Leave fight in a farm fight returns to the campaign without reporting anything', async ({ page }) => {
        const { backend } = await startGame(page);
        await openFarm(page);
        await page.getByTestId('farm-entry-miniboss-1').click();
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 1');

        await page.keyboard.press('Escape');
        await page.locator('.pause-leave').click();
        await page.locator('.pause-confirm-yes').click();

        await expect(page.locator('.stage-message')).toHaveText('Chapter complete!');
        await expect(page.locator('.pause-menu')).toBeHidden();
        expect(farmCalls(backend)).toEqual([]);
        expect(backend.calls.filter((call) => call.path === '/progress/outcome')).toEqual([]);
    });
});
