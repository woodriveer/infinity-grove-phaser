import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Chapter 3, stage 4: the minibosses 1 to 3 of chapter 3 are beaten, chapters 1 and 2 are cleared
const AT_CHAPTER_3 = { yan: { chapter: 3, stage: 4, encounter: 'PHASE', phase: 1 } };
const nature = { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 };
//  Chapter 2 as the farm answers it: every boss has 2 health and is nature, so one fire click wins; the miniboss time limit is 45 s
const CHAPTER_2 = {
    bossHealth: 2, bossTimeLimitMs: 50_000, boss: nature, bossDropRuleId: 6,
    stages: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 2,
        minibossTimeLimitMs: 45_000, monster: nature, miniboss: nature, monsterDropRuleId: 4, minibossDropRuleId: 5 }))
};
const today = () => new Date().toISOString().slice(0, 10);

//  The campaign (`definition`) stays the default seed, whose miniboss 3 has 60 health, so `HP 2/2` proves the chapter 2 numbers
const startGame = async (page, options = {}) => {
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, progress: AT_CHAPTER_3, lastChapter: 15, chapterDefinitions: { 2: CHAPTER_2 }, ...options });
    //  The auto click is unlocked from chapter 2 and would win the 2 health bosses before the click of the test
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-farm')).toBeVisible();

    return { backend, menu };
};

const openMap = async (page) => {
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-map')).toBeVisible();
};

const states = (page) => page.locator('.farm-map .map-node').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-state')));
const farmCalls = (backend) => backend.calls.filter((call) => call.path === '/farm/outcome');
const farmLabel = (page) => page.locator('.stage-hud');

test.describe('Rever chefes: escolher capítulo', () => {
    test('at chapter 3 the selector lists chapters 1 to 3 with chapter 3 pressed and its map', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        await expect(page.getByTestId('farm-chapters')).toBeVisible();
        await expect(page.getByTestId('farm-chapters')).toContainText('Capítulo');
        await expect(page.getByTestId('farm-chapter-1')).toBeVisible();
        await expect(page.getByTestId('farm-chapter-2')).toBeVisible();
        await expect(page.getByTestId('farm-chapter-3')).toBeVisible();
        await expect(page.getByTestId('farm-chapter-4')).toHaveCount(0);
        await expect(page.getByTestId('farm-chapter-3')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('farm-chapter-3')).toHaveClass(/is-current/);
        await expect(page.getByTestId('farm-chapter-3')).toHaveAttribute('title', 'Capítulo atual');
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 3');
        expect(await states(page)).toEqual([ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]);
    });

    test('choosing chapter 2 shows every boss of chapter 2 beaten and no current stop', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        await page.getByTestId('farm-chapter-2').click();

        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');
        expect(await states(page)).toEqual(Array(11).fill('defeated'));
        await expect(page.getByTestId('farm-chapter-2')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('10 vitórias restantes hoje');
    });

    test('a chapter 2 miniboss fights with the numbers of chapter 2 and its win is reported for chapter 2', async ({ page }) => {
        const { backend, menu } = await startGame(page, { chances: [ 0 ] });
        await openMap(page);
        await page.getByTestId('farm-chapter-2').click();

        await page.getByTestId('farm-entry-miniboss-3').click();

        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 3 (Capítulo 2)');
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 2/2');
        await expect(page.locator('.boss-timer')).toHaveText('Time: 45');

        await menu.canvas.click();

        await expect(page.getByTestId('card-notice')).toHaveText('Carta: Lyra Folhaveloz');
        expect(farmCalls(backend).map((call) => call.body)).toEqual([ { boss: { kind: 'MINIBOSS', stage: 3 }, outcome: 'CLEARED', chapter: 2 } ]);
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 3 (Capítulo 2)');
        expect(backend.progresses.get('yan')).toMatchObject({ chapter: 3, stage: 4, encounter: 'PHASE' });
    });

    test('the chapter boss of chapter 2 is labelled with its chapter', async ({ page }) => {
        await startGame(page);
        await openMap(page);
        await page.getByTestId('farm-chapter-2').click();

        await page.getByTestId('farm-entry-chapter-boss').click();

        await expect(farmLabel(page)).toHaveText('Rever chefe: Chefe do capítulo (Capítulo 2)');
        await expect(page.locator('.boss-timer')).toHaveText('Time: 50');
    });

    test('a fight of the current chapter is reported without a chapter', async ({ page }) => {
        //  The campaign's own definition is chapter 2's, so the campaign's miniboss 1 has 2 health and is nature
        const { backend, menu } = await startGame(page, { chances: [ 0 ], definition: CHAPTER_2 });
        await openMap(page);

        await page.getByTestId('farm-entry-miniboss-1').click();
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 1');

        await menu.canvas.click();

        await expect.poll(() => farmCalls(backend).length).toBe(1);
        expect(farmCalls(backend).map((call) => call.body)).toEqual([ { boss: { kind: 'MINIBOSS', stage: 1 }, outcome: 'CLEARED' } ]);
    });

    test('the last daily win spent on the chapter 2 boss reopens Rever chefes on chapter 2', async ({ page }) => {
        const { menu } = await startGame(page, { cards: { yan: { cleared: [ 1, 2 ], winsDay: today(), winsToday: 9 } } });
        await openMap(page);
        await page.getByTestId('farm-chapter-2').click();
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('1 vitórias restantes hoje');

        await page.getByTestId('farm-entry-chapter-boss').click();
        await menu.canvas.click();

        await expect(page.locator('.hero-panel')).toBeVisible();
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');
        await expect(page.getByTestId('farm-chapter-2')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('farm-entry-chapter-boss')).toBeDisabled();
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('0 vitórias restantes hoje');
    });

    test('the chapter bosses of every chapter share the daily wins', async ({ page }) => {
        await startGame(page, { cards: { yan: { cleared: [ 1, 2 ], winsDay: today(), winsToday: 10 } } });
        await openMap(page);

        //  At chapter 3 the chapter boss is still locked: its stop is not a button
        await expect(page.getByTestId('farm-entry-chapter-boss')).toHaveCount(0);
        await expect(page.getByTestId('map-node-chapter-boss')).toHaveAttribute('data-state', 'locked');

        await page.getByTestId('farm-chapter-1').click();

        await expect(page.getByTestId('farm-entry-chapter-boss')).toBeDisabled();
        await expect(page.getByTestId('farm-entry-chapter-boss')).toContainText('0 vitórias restantes hoje');
    });

    test('reopening Rever chefes shows the current chapter again', async ({ page }) => {
        await startGame(page);
        await openMap(page);
        await page.getByTestId('farm-chapter-2').click();
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');

        await page.getByTestId('hero-close').click();
        await openMap(page);

        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 3');
        await expect(page.getByTestId('farm-chapter-3')).toHaveAttribute('aria-pressed', 'true');
    });

    test('a failed chapter load keeps the map and says Não foi possível carregar.', async ({ page }) => {
        await startGame(page);
        //  Registered after the backend's routes, so it answers the request for chapter 1 first
        await page.route((url) => url.pathname === '/api/farm' && url.searchParams.get('chapter') === '1', (route) => route.fulfill({ status: 500, body: '' }));
        await openMap(page);

        await page.getByTestId('farm-chapter-1').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível carregar.');
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 3');
        await expect(page.getByTestId('farm-chapter-3')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('farm-chapter-1')).toBeEnabled();
    });

    test('a player in chapter 1 sees no chapter selector', async ({ page }) => {
        await startGame(page, { progress: { yan: { stage: 4, encounter: 'PHASE', phase: 1 } } });

        await openMap(page);

        await expect(page.getByTestId('farm-chapters')).toHaveCount(0);
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 1');
    });

    test('a player in chapter 2 at its start sees chapter 2 empty and chapter 1 all beaten', async ({ page }) => {
        await startGame(page, { progress: { yan: { chapter: 2, stage: 1, encounter: 'PHASE', phase: 1 } } });
        await openMap(page);

        await expect(page.locator('.farm-chapter')).toHaveText([ '1', '2' ]);
        await expect(page.getByTestId('farm-empty')).toHaveText('Nenhum chefe derrotado ainda.');

        await page.getByTestId('farm-chapter-1').click();
        //  The stops are read once the chapter 1 map is drawn: the title is set with the map
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 1');

        expect(await states(page)).toEqual(Array(11).fill('defeated'));
    });

    test('a completed campaign lists chapters 1 to 15 inside the map width', async ({ page }) => {
        await startGame(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } } });
        await openMap(page);

        await expect(page.locator('.farm-chapter')).toHaveCount(15);
        await expect(page.getByTestId('farm-chapter-16')).toHaveCount(0);

        const board = await page.getByTestId('farm-map').boundingBox();

        for (const chip of await page.locator('.farm-chapter').all()) {
            const box = await chip.boundingBox();

            expect(box.x + box.width).toBeLessThanOrEqual(board.x + board.width);
        }
    });

    test('the chapter chips use the Grove colours', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        const chip1 = page.getByTestId('farm-chapter-1');
        await expect(chip1).toHaveCSS('background-color', 'rgb(43, 29, 20)');
        await expect(chip1).toHaveCSS('border-top-color', 'rgb(176, 122, 58)');
        await expect(chip1).toHaveCSS('color', 'rgb(244, 230, 200)');
        await expect(chip1).toHaveCSS('height', '32px');
        await expect(chip1).toHaveCSS('font-family', /Cinzel/);

        const chip3 = page.getByTestId('farm-chapter-3');
        await expect(chip3).toHaveCSS('background-color', 'rgb(168, 67, 26)');
        await expect(chip3).toHaveCSS('border-top-color', 'rgb(224, 180, 90)');
        expect(await chip3.evaluate((node) => getComputedStyle(node, '::after').backgroundColor)).toBe('rgb(224, 180, 90)');

        await expect(page.locator('.farm-chapters-label')).toHaveCSS('color', 'rgb(107, 74, 43)');
        await expect(page.locator('.farm-chapters-label')).toHaveCSS('font-family', /Figtree/);
    });
});
