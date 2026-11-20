import { expect, test } from './support/coverage';
import { GIFT_STAFF, mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

const GIFT = 'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!';
const SPECIAL_LINE = 'Especial: +200% de dano contra Escuridão';
const LINES = [ 'Dano de clique: 11.0', 'Dano em chefes +28%', 'Tempo extra de chefe +6s', 'Dano crítico +55%', 'Perfuração de armadura +28%', SPECIAL_LINE ];
const TITLE = 'Cajado da Consciência Negra +0';

const notice = (page) => page.getByTestId('card-notice');
const tile = (page) => page.getByTestId('equip-piece-gift-staff');
const monsterHealth = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

//  Opens the battle of `yan` (the account the fake backend knows) from the form; returns the fake backend and the menu
const startGame = async (page, options = {}) => {
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, ...options });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return { backend, menu };
};

const openEquipment = async (page) => {
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
};

const lineTexts = (page, count) => Promise.all(Array.from({ length: count }, (_, index) => page.getByTestId(`piece-line-${index}`).textContent()));

test.describe('Black awareness staff', () => {
    test('a player entering on the gift day sees the gift notice and finds the staff in the bag', async ({ page }) => {
        const { backend } = await startGame(page, { gifts: { yan: true } });

        await expect(notice(page)).toHaveText(GIFT);
        await expect(page.getByTestId('equipment-badge')).toBeVisible();
        expect(backend.giftCalls()).toEqual([ 'yan' ]);

        await openEquipment(page);

        await expect(tile(page)).toBeVisible();
        await expect(tile(page)).toHaveAttribute('data-special', 'BLACK_AWARENESS_STAFF');
    });

    test('the gift notice is still up after 3.5 s and gone by 7 s', async ({ page }) => {
        await startGame(page, { gifts: { yan: true } });

        await expect(notice(page)).toBeVisible();
        await expect(notice(page)).toHaveText(GIFT);
        //  The notice closes on a timer of the game clock, which runs behind the wall clock when frames are slow (here about 20 per second, the timer
        //  took 8.5 s of wall time): the 6 s are read from the running timer, the wall clock only bounds the notice from below and above
        expect(await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').time._active.map((timer) => timer.delay))).toContain(6000);
        await page.waitForTimeout(3500);

        await expect(notice(page)).toBeVisible();
        await expect(notice(page)).toHaveText(GIFT);
        await expect(notice(page)).toBeHidden({ timeout: 12_000 });
    });

    test('a second start the same day shows no gift notice and one staff', async ({ page }) => {
        const { backend } = await startGame(page, { gifts: { yan: true } });

        await expect(notice(page)).toHaveText(GIFT);

        await page.reload();

        const menu = await openMainMenu(page, { state: 'welcome' });

        await menu.canvas.click();
        await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
        await expect(page.getByTestId('skill-slot-1')).toBeVisible();
        await expect.poll(() => backend.giftCalls()).toEqual([ 'yan', 'yan' ]);

        await expect(notice(page)).not.toHaveText(GIFT);

        await openEquipment(page);

        await expect(page.getByTestId('equipment-bag').locator('[data-special]')).toHaveCount(1);
        await expect(notice(page)).not.toHaveText(GIFT);
    });

    test('a player without the gift sees no gift notice', async ({ page }) => {
        const { backend } = await startGame(page);

        await expect.poll(() => backend.giftCalls()).toEqual([ 'yan' ]);
        await expect(notice(page)).toBeHidden();
        await expect(page.getByTestId('equipment-badge')).toBeHidden();
    });

    test('a failing claim shows no notice and the battle keeps running', async ({ page }) => {
        const { backend, menu } = await startGame(page, { gifts: { yan: 'fail' } });

        await expect.poll(() => backend.giftCalls()).toEqual([ 'yan' ]);
        await expect(notice(page)).toBeHidden();

        const before = await monsterHealth(page);

        await menu.canvas.click();

        expect(await monsterHealth(page)).toBeLessThan(before);
    });

    test('the staff tile shows its art, the gold frame and its name', async ({ page }) => {
        await startGame(page, { equipment: { yan: [ GIFT_STAFF ] } });
        await openEquipment(page);

        await expect(tile(page)).toHaveAttribute('data-rarity', 'LEGENDARY');
        await expect(tile(page)).toHaveAttribute('data-gems', '4');
        await expect(tile(page)).toHaveAttribute('aria-label', TITLE);
        await expect(tile(page)).toHaveCSS('border-top-width', '3px');
        await expect(tile(page)).toHaveCSS('border-top-color', 'rgb(217, 165, 33)');

        const image = tile(page).locator('img');

        await expect(image).toHaveAttribute('src', /staff_black_awares_day\.png/);
        await expect.poll(() => image.evaluate((node) => node.naturalWidth)).toBe(2048);

        const icon = tile(page).locator('.icon');

        await expect(icon).toHaveCSS('width', '52px');
        await expect(icon).toHaveCSS('height', '52px');
        await expect(icon).toHaveCSS('border-radius', '10px');
    });

    test('the tooltip shows the name and the special line last', async ({ page }) => {
        await startGame(page, { equipment: { yan: [ GIFT_STAFF ] } });
        await openEquipment(page);
        await tile(page).hover();

        const tooltip = page.getByTestId('piece-tooltip');

        await expect(tooltip).toBeVisible();
        await expect(tooltip.locator('.piece-tooltip-title')).toHaveText(TITLE);
        await expect(tooltip.locator('.piece-tooltip-line')).toHaveText(LINES);
    });

    test('the detail shows the same lines and keeps the special after a refine', async ({ page }) => {
        await startGame(page, { equipment: { yan: [ GIFT_STAFF ] }, wallets: { yan: 10000 } });
        await openEquipment(page);
        await tile(page).click();

        await expect(page.getByTestId('piece-detail').locator('.hero-name')).toHaveText(TITLE);
        await expect(page.getByTestId('piece-line-5')).toHaveText(SPECIAL_LINE);
        expect(await lineTexts(page, 6)).toEqual(LINES);

        await page.getByTestId('piece-refine').click();

        await expect(page.getByTestId('piece-detail').locator('.hero-name')).toHaveText('Cajado da Consciência Negra +1');
        await expect(page.getByTestId('piece-line-0')).toHaveText('Dano de clique: 12.1');
        await expect(page.getByTestId('piece-line-5')).toHaveText(SPECIAL_LINE);
    });

    test('rerolling an affix keeps the special and offers only the four affixes', async ({ page }) => {
        await startGame(page, { equipment: { yan: [ { ...GIFT_STAFF, refine: 5 } ] }, wallets: { yan: 10000 } });
        await openEquipment(page);
        await tile(page).click();

        await expect(page.getByTestId('piece-detail')).toBeVisible();
        await expect(page.locator('[data-testid^="piece-reroll-"]')).toHaveCount(4);
        await expect(page.getByTestId('piece-line-5')).toHaveText(SPECIAL_LINE);

        await page.getByTestId('piece-reroll-0').click();

        //  The 5000 copper of the reroll leave the wallet; the detail is drawn again with the special still last
        await expect(page.locator('.wallet')).toHaveText('Gold: 0 Silver: 50 Copper: 0');
        await expect(page.locator('[data-testid^="piece-reroll-"]')).toHaveCount(4);
        await expect(page.getByTestId('piece-line-5')).toHaveText(SPECIAL_LINE);
    });

    test('selling the staff pays 500 copper and removes it', async ({ page }) => {
        await startGame(page, { equipment: { yan: [ GIFT_STAFF ] }, wallets: { yan: 50 } });
        await openEquipment(page);

        await expect(page.locator('.wallet')).toHaveText('Gold: 0 Silver: 0 Copper: 50');

        await tile(page).click();
        await expect(page.getByTestId('piece-sell')).toHaveText('Vender (5 prata)');
        await page.getByTestId('piece-sell').click();

        await expect(page.getByTestId('equipment-empty')).toBeVisible();
        await expect(tile(page)).toHaveCount(0);
        await expect(page.locator('.wallet')).toHaveText('Gold: 0 Silver: 5 Copper: 50');
    });

    test('the bulk sale sells the staff for 500 copper and sends its id', async ({ page }) => {
        const { backend } = await startGame(page, { equipment: { yan: [ GIFT_STAFF ] }, wallets: { yan: 50 } });
        await openEquipment(page);

        await page.getByTestId('bulk-sell-start').click();
        await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
        await tile(page).click();

        await expect(page.getByTestId('bulk-sell-summary')).toHaveText('Selecionadas: 1 · Total: 5 prata');

        await page.getByTestId('bulk-sell-submit').click();
        await page.getByTestId('bulk-sell-confirm-yes').click();

        await expect(tile(page)).toHaveCount(0);
        await expect(page.locator('.wallet')).toHaveText('Gold: 0 Silver: 5 Copper: 50');
        expect(backend.calls.filter(({ method, path }) => method === 'POST' && path === '/equipment/sell').map(({ body }) => body)).toEqual([ { pieceIds: [ 'gift-staff' ] } ]);
    });

    test('a piece with an unknown special shows as a plain legendary weapon', async ({ page }) => {
        await startGame(page, { equipment: { yan: [ { ...GIFT_STAFF, special: 'FROST_RUNE' } ] } });
        await openEquipment(page);

        await expect(tile(page)).toHaveAttribute('aria-label', 'Lendário Arma +0');
        await expect(tile(page)).not.toHaveAttribute('data-special', /.*/);
        await expect(tile(page).locator('img')).toHaveAttribute('src', /slot-weapon\.png/);

        await tile(page).hover();

        const lines = page.getByTestId('piece-tooltip').locator('.piece-tooltip-line');

        await expect(lines).toHaveCount(5);

        for (const text of await lines.allTextContents()) { expect(text.startsWith('Especial')).toBe(false); }
    });
});
