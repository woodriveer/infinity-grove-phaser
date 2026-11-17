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
//  The limit of the running boss countdown in ms, null while no boss counts down (the same read as skillsAll.spec.js)
const countdownLimit = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').countdown?.limitMs ?? null);

//  The computed value of a token of the page: a probe element with the same declaration resolves it the way a chip does
const tokenValue = (page, property, value) => page.evaluate(([ name, declared ]) => {
    const probe = document.createElement('div');

    probe.style.setProperty(name, declared);
    document.body.append(probe);
    const computed = getComputedStyle(probe).getPropertyValue(name);

    probe.remove();
    return computed;
}, [ property, value ]);

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
        //  The limit is the chapter 2 boss time limit, exact; the display ticks down from it, so it is read as a number from 45 to 50
        await expect.poll(() => countdownLimit(page)).toBe(50_000);
        await expect(page.locator('.boss-timer')).toHaveText(/^Time: (4[5-9]|50)$/);
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
    test('the selector is a group labelled Escolher capítulo and only the shown chapter is pressed', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        await expect(page.getByTestId('farm-chapters')).toHaveAttribute('role', 'group');
        await expect(page.getByTestId('farm-chapters')).toHaveAttribute('aria-label', 'Escolher capítulo');
        await expect(page.locator('.farm-chapters-label')).toHaveText('Capítulo');
        await expect(page.getByTestId('farm-chapter-1')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('farm-chapter-2')).toHaveAttribute('aria-pressed', 'false');
    });

    test('choosing chapter 2 asks the farm for GET /farm?chapter=2', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        const request = page.waitForRequest((candidate) => new URL(candidate.url()).pathname === '/api/farm' && new URL(candidate.url()).searchParams.has('chapter'));
        await page.getByTestId('farm-chapter-2').click();

        const sent = await request;
        expect(sent.method()).toBe('GET');
        expect(new URL(sent.url()).search).toBe('?chapter=2');
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');
    });

    test('clicking the pressed chapter button sends no request', async ({ page }) => {
        const { backend } = await startGame(page);
        await openMap(page);
        const before = backend.calls.filter((call) => call.path === '/farm').length;

        await page.getByTestId('farm-chapter-3').click();
        //  The next chapter's answer is the first request after the pressed click: one more call proves the pressed one sent none
        await page.getByTestId('farm-chapter-2').click();
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');

        expect(backend.calls.filter((call) => call.path === '/farm').length).toBe(before + 1);
    });

    test('while a chapter loads every chapter button is disabled, dimmed and shows the map shown before', async ({ page }) => {
        await startGame(page);
        let release = () => {};
        const held = new Promise((resolve) => { release = resolve; });
        //  Registered after the backend's routes: holds the answer for chapter 2 until the test releases it, then the backend answers
        await page.route((url) => url.pathname === '/api/farm' && url.searchParams.get('chapter') === '2', async (route) => {
            await held;
            await route.fallback();
        });
        await openMap(page);

        await page.getByTestId('farm-chapter-2').click();

        for (const number of [ 1, 2, 3 ]) {
            await expect(page.getByTestId(`farm-chapter-${number}`)).toBeDisabled();
        }
        await expect(page.getByTestId('farm-chapter-1')).toHaveCSS('opacity', '0.45');
        await expect(page.getByTestId('farm-chapter-1')).toHaveCSS('cursor', 'not-allowed');
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 3');
        expect(await states(page)).toEqual([ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]);

        release();

        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 2');
        for (const number of [ 1, 2, 3 ]) {
            await expect(page.getByTestId(`farm-chapter-${number}`)).toBeEnabled();
        }
    });

    test('the map of a completed campaign at chapter 15 shows 11 defeated stops and no current stop', async ({ page }) => {
        await startGame(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } } });
        await openMap(page);

        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 15');
        expect(await states(page)).toEqual(Array(11).fill('defeated'));
    });

    //  The HUD is one 1024 px layout scaled to the phone (style.css, the comment above the 640 px query), so the row never reflows here:
    //  the observable edge is that every chip stays inside the scaled map at 390 px
    test('on a phone all 15 chapter chips stay inside the scaled map and none passes its edge', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await startGame(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } } });
        await openMap(page);

        const board = await page.getByTestId('farm-map').boundingBox();

        expect(board.width).toBeLessThanOrEqual(390);
        for (const chip of await page.locator('.farm-chapter').all()) {
            const box = await chip.boundingBox();

            expect(box.x).toBeGreaterThanOrEqual(board.x);
            expect(box.x + box.width).toBeLessThanOrEqual(board.x + board.width);
        }
    });

    test('the chips and the label carry the Visual Spec sizes, weights, borders, radius, padding and shadow', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        const row = page.getByTestId('farm-chapters');
        await expect(row).toHaveCSS('display', 'flex');
        await expect(row).toHaveCSS('flex-wrap', 'wrap');
        await expect(row).toHaveCSS('align-items', 'center');
        await expect(row).toHaveCSS('row-gap', '6px');
        await expect(row).toHaveCSS('column-gap', '6px');

        const label = page.locator('.farm-chapters-label');
        await expect(label).toHaveCSS('font-size', '14px');
        await expect(label).toHaveCSS('font-weight', '600');
        await expect(label).toHaveCSS('margin-right', '4px');

        const chip = page.getByTestId('farm-chapter-1');
        await expect(chip).toHaveCSS('font-size', '15px');
        await expect(chip).toHaveCSS('font-weight', '700');
        await expect(chip).toHaveCSS('min-width', '40px');
        await expect(chip).toHaveCSS('padding-top', '0px');
        await expect(chip).toHaveCSS('padding-right', '10px');
        await expect(chip).toHaveCSS('padding-left', '10px');
        await expect(chip).toHaveCSS('border-top-width', '2px');
        await expect(chip).toHaveCSS('border-top-style', 'solid');
        await expect(chip).toHaveCSS('border-radius', '999px');
        await expect(chip).toHaveCSS('position', 'relative');
        //  The token values come from the page itself: a probe element with the same var() resolves the same computed value
        expect(await chip.evaluate((node) => getComputedStyle(node).boxShadow)).toBe(await tokenValue(page, 'box-shadow', 'var(--btn-shadow)'));
        expect(await chip.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe(await tokenValue(page, 'background-image', 'var(--btn-bg)'));

        const pressed = page.getByTestId('farm-chapter-3');
        expect(await pressed.evaluate((node) => getComputedStyle(node).backgroundImage)).toBe(await tokenValue(page, 'background-image', 'var(--btn-primary-bg)'));

        const dot = await pressed.evaluate((node) => {
            const after = getComputedStyle(node, '::after');

            return [ after.width, after.height, after.bottom, after.marginLeft, after.left ];
        });
        expect(dot.slice(0, 2)).toEqual([ '6px', '6px' ]);
        expect(dot[2]).toBe('3px');
        expect(dot[3]).toBe('-3px');
        expect(await pressed.evaluate((node) => getComputedStyle(node, '::after').borderTopLeftRadius)).toBe('50%');
    });

    test('an account reset in another tab makes the next win of an earlier chapter answer 409, the farm ends and reloads', async ({ page }) => {
        const { backend, menu } = await startGame(page, { chances: [ 0 ] });
        await openMap(page);
        await page.getByTestId('farm-chapter-2').click();
        await page.getByTestId('farm-entry-miniboss-3').click();
        await expect(farmLabel(page)).toHaveText('Rever chefe: Miniboss 3 (Capítulo 2)');

        //  The reset in another tab: the campaign is back to chapter 1, so chapter 2 is no longer reached
        backend.progresses.set('yan', { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false });
        const loads = backend.calls.filter((call) => call.path === '/farm').length;

        await menu.canvas.click();

        await expect.poll(() => farmCalls(backend).length).toBe(1);
        await expect.poll(() => backend.calls.filter((call) => call.path === '/farm').length).toBeGreaterThan(loads);
        await expect(farmLabel(page)).not.toHaveText('Rever chefe: Miniboss 3 (Capítulo 2)');
        await expect(page.getByTestId('card-notice')).toBeHidden();
    });

    test('the chips react to hover, press and keyboard focus as the Visual Spec says', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        await page.getByTestId('farm-chapter-1').hover();
        await expect(page.getByTestId('farm-chapter-1')).toHaveCSS('filter', 'brightness(1.15)');

        //  The pressed chip stays enabled: a press on it sends no request, so the press is read without a load
        await page.getByTestId('farm-chapter-3').hover();
        await page.mouse.down();
        await expect(page.getByTestId('farm-chapter-3')).toHaveCSS('filter', 'brightness(0.9)');
        await page.mouse.up();

        //  Tab and Shift+Tab bring the focus back to chip 1 by the keyboard, so the focus ring is the :focus-visible one
        await page.getByTestId('farm-chapter-1').focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        const chip = page.getByTestId('farm-chapter-1');
        await expect(chip).toBeFocused();
        await expect(chip).toHaveCSS('outline-style', 'solid');
        await expect(chip).toHaveCSS('outline-width', '2px');
        await expect(chip).toHaveCSS('outline-color', 'rgb(204, 78, 26)');
        await expect(chip).toHaveCSS('outline-offset', '2px');
    });
});
