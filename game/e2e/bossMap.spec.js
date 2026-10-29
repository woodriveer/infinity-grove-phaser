import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Stage 4 of the chapter with the minibosses 1 to 3 beaten
const AT_STAGE_4 = { yan: { stage: 4, encounter: 'PHASE', phase: 2 } };

const startGame = async (page, options = {}) => {
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, progress: AT_STAGE_4, ...options });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-farm')).toBeVisible();

    return backend;
};

const openMap = async (page) => {
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-map')).toBeVisible();
};

//  The painted map: a 1 x 1 picture when it loads, a 404 when it does not exist (the real file may or may not be on disk)
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const paintedMap = (page, exists) => page.route('**/boss-map.jpg', (route) =>
    (exists ? route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }) : route.fulfill({ status: 404, body: '' })));

const states = (page) => page.locator('.farm-map .map-node').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-state')));

test.describe('Chapter map', () => {
    test('at stage 4 shows three defeated stops, the current one and the rest locked, under the title of the chapter', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 1');
        expect(await states(page)).toEqual([ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]);
        await expect(page.locator('.farm-map .map-node')).toHaveCount(11);
        await expect(page.getByTestId('map-node-miniboss-4')).toHaveAttribute('aria-label', 'Miniboss 4');
        await expect(page.getByTestId('map-node-chapter-boss')).toHaveText(/Chefe/);
    });

    test('a click on a beaten stop starts the farm fight of that boss, and a locked stop does nothing', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        await page.getByTestId('map-node-miniboss-8').click({ force: true });
        await expect(page.getByTestId('farm-map')).toBeVisible();

        await page.getByTestId('farm-entry-miniboss-2').click();

        await expect(page.locator('.hero-panel')).toBeHidden();
        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 2');
    });

    test('draws the dashed trail and the gradient while the painted map does not exist, and puts the stops at the table positions', async ({ page }) => {
        await paintedMap(page, false);
        await startGame(page);
        await openMap(page);

        await expect(page.getByTestId('farm-map')).toHaveClass(/is-fallback/);
        await expect(page.locator('.farm-trail')).toBeVisible();

        const board = await page.getByTestId('farm-map').boundingBox();
        const first = await page.getByTestId('farm-entry-miniboss-1').boundingBox();
        const boss = await page.getByTestId('map-node-chapter-boss').boundingBox();

        //  Stop 1 sits at 10 % / 84 % of the map and the chapter boss at 84 % / 16 %
        expect((first.x + first.width / 2 - board.x) / board.width).toBeCloseTo(0.1, 1);
        expect((first.y + first.height / 2 - board.y) / board.height).toBeCloseTo(0.84, 1);
        expect((boss.x + boss.width / 2 - board.x) / board.width).toBeCloseTo(0.84, 1);
        expect((boss.y + boss.height / 2 - board.y) / board.height).toBeCloseTo(0.16, 1);
    });

    test('shows the painted map at 880 x 495, or scaled down with the same ratio, without the dashed trail once the image loads', async ({ page }) => {
        await paintedMap(page, true);
        await startGame(page);
        await openMap(page);

        await expect(page.locator('.farm-map-image')).toBeVisible();
        await expect(page.getByTestId('farm-map')).not.toHaveClass(/is-fallback/);
        await expect(page.locator('.farm-trail')).toBeHidden();

        //  The layout size: 880 wide when the window has room, else the room it has, and always 16:9
        const [ width, height, room ] = await page.getByTestId('farm-map').evaluate((board) => {
            const parent = getComputedStyle(board.parentElement);

            return [ board.offsetWidth, board.offsetHeight, board.parentElement.clientWidth - parseFloat(parent.paddingLeft) - parseFloat(parent.paddingRight) ];
        });

        expect(width).toBe(Math.min(880, room));
        expect(Math.abs(height - width * 9 / 16)).toBeLessThanOrEqual(1);

        //  With room to spare the map keeps its full size
        const roomy = await page.getByTestId('farm-map').evaluate((board) => {
            Object.assign(board.parentElement.style, { width: '1200px', maxWidth: 'none' });

            return [ board.offsetWidth, board.offsetHeight ];
        });

        expect(roomy).toEqual([ 880, 495 ]);
    });

    test('shows the map with every stop locked or current and the empty text at the start of the campaign', async ({ page }) => {
        await startGame(page, { progress: {} });
        await openMap(page);

        await expect(page.getByTestId('farm-empty')).toHaveText('Nenhum chefe derrotado ainda.');
        expect(await states(page)).toEqual([ 'current', ...Array(10).fill('locked') ]);
    });

    test('keeps the fight running while the map is open and after it closes', async ({ page }) => {
        await startGame(page);
        await openMap(page);

        expect(await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').paused)).toBe(false);

        await page.getByTestId('hero-close').click();

        expect(await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').paused)).toBe(false);
    });
});
