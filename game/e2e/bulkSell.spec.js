import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

//  Kael wears a rare weapon; the bag holds two commons (100 each), an uncommon (200) and an epic (400)
const PIECES = [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('c1', 'RING', 'COMMON'), piece('c2', 'AMULET', 'COMMON'), piece('u1', 'RING', 'UNCOMMON'), piece('e1', 'ARMOR', 'EPIC') ];
const walletText = (page) => page.locator('.wallet');
const sellCalls = (calls) => calls.filter(({ method, path }) => method === 'POST' && path === '/equipment/sell');

//  Starts with 50 copper and the owned heroes Kael and Lyra; returns the fake backend (its `calls` and `equipmentOf`)
const startGame = async (page, equipment = PIECES) => {
    const backend = await mockBackend(page, {
        users: { yan: 'secret123' }, wallets: { yan: 50 }, cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } }, equipment: { yan: equipment }
    });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-equipment')).toBeVisible();

    return backend;
};

const openEquipment = async (page) => {
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
};

const startSelling = async (page) => {
    await page.getByTestId('bulk-sell-start').click();
    await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
};

test.describe('Bulk sell', () => {
    test('selects two pieces and sells them in one request', async ({ page }) => {
        const backend = await startGame(page);
        await openEquipment(page);

        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 0 Copper: 50');
        await expect(page.getByTestId('bulk-sell-start')).toBeVisible();

        await startSelling(page);
        //  Clicked out of bag order on purpose: the request follows the bag, not the clicks (D11)
        await page.getByTestId('equip-piece-u1').click();
        await page.getByTestId('equip-piece-c1').click();

        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 2 · Total: 3 prata');
        await expect(page.getByTestId('equip-piece-c1')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('equip-piece-c1').locator('.piece-check')).toHaveText('✓');
        await expect(page.getByTestId('equip-piece-e1')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('equip-piece-e1').locator('.piece-check')).toHaveCount(0);

        await page.getByTestId('bulk-sell-submit').click();
        await expect(page.getByTestId('bulk-sell-question')).toHaveText('Vender 2 peças por 3 prata?');
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(page.getByTestId('equip-sell-notice')).toHaveText('2 peças vendidas por 3 prata');
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (2)');
        await expect(page.getByTestId('equip-piece-c1')).toHaveCount(0);
        await expect(page.getByTestId('equip-piece-u1')).toHaveCount(0);
        await expect(page.getByTestId('bulk-sell-start')).toBeVisible();
        await expect(page.getByTestId('bulk-sell-bar')).toHaveCount(0);
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 3 Copper: 50');

        expect(sellCalls(backend.calls)).toHaveLength(1);
        expect(sellCalls(backend.calls)[0].body).toEqual({ pieceIds: [ 'c1', 'u1' ] });
    });

    test('a click on a tile in selection mode does not open the piece and a second click unselects it', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await expect(page.getByTestId('bulk-sell-start')).toHaveCount(0);
        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 0 · Total: 0 cobre');

        await page.getByTestId('equip-piece-e1').click();

        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 1 · Total: 4 prata');

        await page.getByTestId('equip-piece-e1').click();

        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 0 · Total: 0 cobre');
        await expect(page.getByTestId('bulk-sell-submit')).toBeDisabled();
    });

    test('worn pieces cannot be selected and Transferir conjunto hides', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await expect(page.getByTestId('equip-transfer-kael')).toBeVisible();

        await startSelling(page);

        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toBeDisabled();
        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toHaveClass(/is-locked/);
        await expect(page.getByTestId('equip-transfer-kael')).toHaveCount(0);
    });

    test('Cancelar leaves selection mode and a click opens the piece again', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-cancel').click();

        await expect(page.getByTestId('bulk-sell-bar')).toHaveCount(0);
        await expect(page.getByTestId('bulk-sell-start')).toBeVisible();
        await expect(page.getByTestId('equip-piece-c1')).not.toHaveAttribute('aria-pressed');

        await page.getByTestId('equip-piece-c1').click();

        await expect(page.getByTestId('piece-detail')).toBeVisible();
    });

    test('closing the window leaves selection mode', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('hero-close').click();
        await openEquipment(page);

        await expect(page.getByTestId('bulk-sell-bar')).toHaveCount(0);
        await expect(page.getByTestId('bulk-sell-start')).toBeVisible();
        await expect(page.getByTestId('equip-piece-c1')).not.toHaveClass(/is-selected/);
    });

    test('Não keeps the selection and sends nothing', async ({ page }) => {
        const backend = await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-no').click();

        await expect(page.getByTestId('bulk-sell-confirm')).toHaveCount(0);
        await expect(page.getByTestId('equip-piece-c1')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('bulk-sell-submit')).toBeVisible();
        expect(sellCalls(backend.calls)).toHaveLength(0);
    });

    test('the tiles and the rarity buttons are disabled while the question shows', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-submit').click();

        await expect(page.getByTestId('equip-piece-c2')).toBeDisabled();
        await expect(page.getByTestId('bulk-sell-rarity-COMMON')).toBeDisabled();
        await expect(page.getByTestId('bulk-sell-cancel')).toHaveCount(0);
    });

    test('a refused sale keeps the pieces and the selection and shows the error', async ({ page }) => {
        await startGame(page);
        await page.route('**/api/equipment/sell', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }));
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('equip-piece-u1').click();
        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível concluir a ação.');
        await expect(page.getByTestId('equip-piece-c1')).toBeVisible();
        await expect(page.getByTestId('equip-piece-c1')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 0 Copper: 50');
    });

    test('a piece sold in another tab fails the sale, leaves the bag and keeps the others selected', async ({ page }) => {
        const backend = await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('equip-piece-u1').click();

        //  Another tab sells c1 after this window loaded the bag
        const bag = backend.equipmentOf('yan');

        bag.splice(bag.findIndex((candidate) => candidate.id === 'c1'), 1);

        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível concluir a ação.');
        await expect(page.getByTestId('equip-piece-c1')).toHaveCount(0);
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (3)');
        await expect(page.getByTestId('equip-piece-u1')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 1 · Total: 2 prata');
        await expect(page.getByTestId('bulk-sell-question')).toHaveCount(0);
        await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 0 Copper: 50');
    });

    test('rarity buttons select and unselect every bag piece of a rarity', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await startSelling(page);
        await expect(page.getByTestId('bulk-sell-rarity-LEGENDARY')).toBeDisabled();

        await page.getByTestId('bulk-sell-rarity-COMMON').click();

        await expect(page.getByTestId('equip-piece-c1')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('equip-piece-c2')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('equip-piece-u1')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 2 · Total: 2 prata');
        await expect(page.getByTestId('bulk-sell-rarity-COMMON')).toHaveAttribute('aria-pressed', 'true');

        await page.getByTestId('bulk-sell-rarity-COMMON').click();

        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 0 · Total: 0 cobre');
    });

    test('the bar shows the five rarity buttons in order', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await startSelling(page);

        await expect(page.locator('.bulk-sell-rarity')).toHaveText([ 'Comum', 'Incomum', 'Raro', 'Épico', 'Lendário' ]);
        expect(await page.locator('.bulk-sell-rarity').evaluateAll((buttons) => buttons.map((button) => button.dataset.testid)))
            .toEqual([ 'bulk-sell-rarity-COMMON', 'bulk-sell-rarity-UNCOMMON', 'bulk-sell-rarity-RARE', 'bulk-sell-rarity-EPIC', 'bulk-sell-rarity-LEGENDARY' ]);
    });

    test('selling every common takes four clicks', async ({ page }) => {
        const backend = await startGame(page);
        await openEquipment(page);

        await page.getByTestId('bulk-sell-start').click();
        await page.getByTestId('bulk-sell-rarity-COMMON').click();
        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(page.getByTestId('equip-sell-notice')).toHaveText('2 peças vendidas por 2 prata');
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (2)');
        await expect(walletText(page)).toHaveText('Gold: 0 Silver: 2 Copper: 50');
        expect(sellCalls(backend.calls).map(({ body }) => body)).toEqual([ { pieceIds: [ 'c1', 'c2' ] } ]);
    });

    test('while the sale runs every button of the screen is disabled and a second confirmation sends nothing', async ({ page }) => {
        const backend = await startGame(page);

        //  Holds the answer of the sale until the test releases it; the fake backend then answers as usual
        let release;
        const held = new Promise((resolve) => { release = resolve; });

        await page.route('**/api/equipment/sell', async (route) => {
            await held;
            await route.fallback();
        });
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        const buttons = page.locator('[data-testid="equipment-list"] button');

        await expect(buttons.first()).toBeDisabled();

        const count = await buttons.count();

        for (let index = 0; index < count; index += 1) {
            await expect(buttons.nth(index)).toBeDisabled();
        }

        release();

        await expect(page.getByTestId('equip-sell-notice')).toHaveText('1 peça vendida por 1 prata');
        expect(sellCalls(backend.calls)).toHaveLength(1);
    });

    test('selling the last bag piece while a hero wears one shows Mochila (0) without Vender várias', async ({ page }) => {
        await startGame(page, [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('c1', 'RING', 'COMMON') ]);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(page.getByTestId('equip-sell-notice')).toHaveText('1 peça vendida por 1 prata');
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (0)');
        await expect(page.getByTestId('bulk-sell-start')).toHaveCount(0);
        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
    });

    test('selling the last piece shows the empty text with the notice', async ({ page }) => {
        await startGame(page, [ piece('c1', 'RING', 'COMMON') ]);
        await openEquipment(page);

        await startSelling(page);
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(page.getByTestId('equip-sell-notice')).toHaveText('1 peça vendida por 1 prata');
        await expect(page.getByTestId('equipment-empty')).toHaveText('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
    });
});
