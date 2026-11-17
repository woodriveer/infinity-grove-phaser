import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

const LAYERS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const KAEL_LADDER = { 'kael:0': 45, 'kael:1': 1, 'kael:2': 2 };
const FULL_BAG = Object.fromEntries([ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ].flatMap((id) => LAYERS.map((stars) => [ `${id}:${stars}`, 45 ])));

//  Logs in as yan with a copy of the bag `copies` (the fake backend edits it in place; Kael leads) and optional `equipment`; resolves with the fake backend
const startWith = async (page, copies, { equipment = [] } = {}) => {
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { leader: 'kael', copies: { ...copies } } }, equipment: { yan: equipment } });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return backend;
};

const openBag = async (page) => {
    await page.getByTestId('hud-bag').click();
    await expect(page.getByTestId('bag-list')).toBeVisible();
};

const openHero = async (page, id) => {
    await openBag(page);
    await page.getByTestId(`bag-card-${id}`).click();
    await expect(page.getByTestId('bag-entry-detail')).toBeVisible();
};

const chips = (page, id) => page.getByTestId(`bag-card-${id}`).locator('.bag-card-chip');
const copiesText = (page, id, stars) => page.getByTestId(`fusion-row-${id}-${stars}`).locator('.fusion-copies');

//  Records every POST to the given API path
const posts = (page, path) => {
    const list = [];

    page.on('request', (request) => {
        if (request.method() === 'POST' && new URL(request.url()).pathname === `/api${path}`) { list.push(request); }
    });

    return list;
};

const noScroll = (page) => page.locator('.hero-window').evaluate((node) => node.scrollHeight <= node.clientHeight);

const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

test.describe('Mochila hero cards', () => {
    test('shows one framed card per hero with the best star, the chips and the Fundir badge', async ({ page }) => {
        await startWith(page, { ...KAEL_LADDER, 'lyra:4': 1, 'orina:7': 1 });
        await openBag(page);

        await expect(page.locator('[data-testid^="bag-card-"][data-frame]')).toHaveCount(5);
        const ids = await page.locator('[data-testid^="bag-card-"][data-frame]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid));

        expect(ids).toEqual([ 'bag-card-kael', 'bag-card-lyra', 'bag-card-orina', 'bag-card-seraphine', 'bag-card-vex' ]);

        const kael = page.getByTestId('bag-card-kael');

        await expect(kael).toHaveAttribute('data-frame', 'wood');
        await expect(page.getByTestId('bag-card-star-kael')).toHaveText('2★');
        await expect(chips(page, 'kael')).toHaveText([ '0★×45', '1★×1', '2★×2' ]);
        await expect(page.getByTestId('bag-card-fuse-kael')).toHaveText('Fundir');
        await expect(kael.locator('.bag-card-ribbon')).toHaveText('Kael Raizférrea');
        await expect(kael.locator('img.bag-card-portrait')).toHaveAttribute('src', /kael_sprite\.png/);

        const lyra = page.getByTestId('bag-card-lyra');

        await expect(lyra).toHaveAttribute('data-frame', 'silver');
        await expect(page.getByTestId('bag-card-star-lyra')).toHaveText('4★');
        await expect(page.getByTestId('bag-card-star-lyra')).toHaveClass(/is-ascended/);
        await expect(page.getByTestId('bag-card-fuse-lyra')).toHaveCount(0);

        await expect(page.getByTestId('bag-card-orina')).toHaveAttribute('data-frame', 'gold');
        await expect(page.getByTestId('bag-card-star-orina')).toHaveText('7★');
        await expect(page.getByTestId('bag-card-star-orina')).toHaveClass(/is-exalted/);

        for (const id of [ 'seraphine', 'vex' ])
        {
            const card = page.getByTestId(`bag-card-${id}`);

            await expect(card).toBeDisabled();
            await expect(card).toHaveClass(/is-grey/);
            await expect(card.locator('.bag-card-missing')).toHaveText('Não encontrado');
            await expect(page.getByTestId(`bag-card-star-${id}`)).toHaveCount(0);
        }

        await expect(page.locator('[data-testid^="bag-entry-"]')).toHaveCount(0);
    });

    test('a card the player does not own opens nothing', async ({ page }) => {
        await startWith(page, { 'kael:0': 1 });
        await openBag(page);

        await expect(page.getByTestId('bag-card-vex')).toBeDisabled();
        await page.getByTestId('bag-card-vex').click({ force: true });

        await expect(page.getByTestId('bag-entry-detail')).toHaveCount(0);
        await expect(page.getByTestId('bag-list')).toBeVisible();
    });

    test('the Mochila shows no scrollbar with every layer of every hero filled on desktop', async ({ page }) => {
        await startWith(page, FULL_BAG);
        await openBag(page);

        expect(await noScroll(page)).toBe(true);

        for (const id of [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ])
        {
            await expect(chips(page, id)).toHaveCount(10);
        }
    });

    test('the Mochila shows no scrollbar on a phone', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await startWith(page, FULL_BAG);
        await openBag(page);

        expect(await noScroll(page)).toBe(true);
        await expect(page.locator('[data-testid^="bag-entry-kael-"]')).toHaveCount(0);
    });

    test('a card opens the ladder with the owned layers and the next reachable one', async ({ page }) => {
        await startWith(page, { 'kael:0': 3 });
        await openHero(page, 'kael');

        await expect(page.getByTestId('hero-back')).toBeVisible();
        await expect(page.getByTestId('bag-detail-card-kael')).toBeVisible();
        await expect(page.getByTestId('skill-list').locator('.skill-row')).toHaveCount(3);
        await expect(page.getByTestId('fusion-all')).toHaveText('Fundir tudo');
        await expect(page.getByTestId('fusion-all')).toBeEnabled();

        await expect(page.getByTestId('fusion-row-kael-0').locator('.fusion-name')).toHaveText('0★');
        await expect(copiesText(page, 'kael', 0)).toHaveText('3/3');
        await expect(page.getByTestId('fusion-row-kael-0').locator('.fusion-bar')).toHaveAttribute('aria-valuenow', '3');
        await expect(page.getByTestId('fusion-button-kael-0')).toHaveText('0★→1★');
        await expect(page.getByTestId('fusion-button-kael-0')).toBeEnabled();

        await expect(copiesText(page, 'kael', 1)).toHaveText('0/3');
        await expect(page.getByTestId('fusion-row-kael-1').locator('.fusion-bar')).toHaveAttribute('aria-valuenow', '0');
        await expect(page.getByTestId('fusion-button-kael-1')).toHaveText('1★→2★');
        await expect(page.getByTestId('fusion-button-kael-1')).toBeDisabled();

        await expect(page.getByTestId('fusion-row-kael-2')).toHaveCount(0);
    });

    test('a 9-star row cannot be fused', async ({ page }) => {
        await startWith(page, { 'kael:9': 1 });
        await openBag(page);

        await expect(page.getByTestId('bag-card-kael')).toHaveAttribute('data-frame', 'gold');
        await expect(page.getByTestId('bag-card-fuse-kael')).toHaveCount(0);

        await page.getByTestId('bag-card-kael').click();

        await expect(page.getByTestId('fusion-row-kael-9').locator('.fusion-max')).toHaveText('Estrela máxima: não pode ser fundida');
        await expect(copiesText(page, 'kael', 9)).toHaveText('Cópias: 1');
        await expect(page.getByTestId('fusion-button-kael-9')).toHaveCount(0);
        await expect(page.getByTestId('fusion-all')).toBeDisabled();
    });

    test('a row button fuses once and the ladder and the cards follow', async ({ page }) => {
        await startWith(page, { 'kael:0': 3 });
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'false');

        const calls = posts(page, '/heroes/kael/fuse');

        await openHero(page, 'kael');
        await page.getByTestId('fusion-button-kael-0').click();

        await expect(page.getByTestId('fusion-result')).toHaveText('Nova carta: Kael Raizférrea 1★');
        await expect(page.getByTestId('fusion-row-kael-0')).toHaveCount(0);
        await expect(copiesText(page, 'kael', 1)).toHaveText('1/3');
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'true');
        expect(calls).toHaveLength(1);
        expect(calls[0].postDataJSON()).toEqual({ stars: 0 });

        await page.getByTestId('hero-back').click();

        await expect(chips(page, 'kael')).toHaveText([ '1★×1' ]);
        await expect(page.getByTestId('bag-card-star-kael')).toHaveText('1★');
        await expect(page.getByTestId('bag-card-fuse-kael')).toHaveCount(0);
    });

    test('a fusion in flight disables the ladder and keeps Voltar', async ({ page }) => {
        await startWith(page, { 'kael:0': 6 });

        let release;
        const held = new Promise((resolve) => { release = resolve; });

        await page.route('**/api/heroes/kael/fuse', async (route) => {
            await held;
            await route.fallback();
        });

        await openHero(page, 'kael');
        await page.getByTestId('fusion-button-kael-0').click();

        await expect(page.getByTestId('fusion-button-kael-0')).toBeDisabled();
        await expect(page.getByTestId('fusion-all')).toBeDisabled();
        await expect(page.getByTestId('hero-back')).toBeEnabled();

        release();

        await expect(page.getByTestId('fusion-result')).toHaveText('Nova carta: Kael Raizférrea 1★');
        await expect(page.getByTestId('fusion-button-kael-0')).toBeEnabled();
        await expect(copiesText(page, 'kael', 0)).toHaveText('3/3');
    });

    test('a failed row fusion keeps the ladder', async ({ page }) => {
        const backend = await startWith(page, { 'kael:0': 3 });

        await openHero(page, 'kael');
        //  The server now holds fewer copies than the screen shows, so it refuses
        backend.cardsOf('yan').copies['kael:0'] = 1;
        await page.getByTestId('fusion-button-kael-0').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível fundir as cartas.');
        await expect(copiesText(page, 'kael', 0)).toHaveText('3/3');
        await expect(page.getByTestId('fusion-result')).toHaveCount(0);
    });

    test('Fundir tudo previews the cascade and Não sends nothing', async ({ page }) => {
        await startWith(page, KAEL_LADDER);

        const calls = posts(page, '/heroes/kael/fuse-all');

        await openHero(page, 'kael');
        await page.getByTestId('fusion-all').click();

        await expect(page.getByTestId('fusion-all-question')).toHaveText('Fazer 22 fusões?');
        await expect(page.getByTestId('fusion-all-preview')).toHaveText('45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★');
        await expect(page.getByTestId('fusion-button-kael-0')).toBeDisabled();
        await expect(page.getByTestId('fusion-all')).toBeDisabled();

        await page.getByTestId('fusion-all-no').click();

        await expect(page.getByTestId('fusion-all-confirm')).toHaveCount(0);
        await expect(copiesText(page, 'kael', 0)).toHaveText('45/3');
        expect(calls).toHaveLength(0);
    });

    test('Sim, fundir fuses the whole ladder in one request', async ({ page }) => {
        await startWith(page, KAEL_LADDER);

        const calls = posts(page, '/heroes/kael/fuse-all');

        await openHero(page, 'kael');
        await page.getByTestId('fusion-all').click();
        await page.getByTestId('fusion-all-yes').click();

        await expect(page.getByTestId('fusion-result')).toHaveText('22 fusões. Melhor carta: Kael Raizférrea 3★');
        expect(calls).toHaveLength(1);
        await expect(page.getByTestId('fusion-row-kael-0')).toHaveCount(0);
        await expect(copiesText(page, 'kael', 1)).toHaveText('1/3');
        await expect(copiesText(page, 'kael', 2)).toHaveText('1/3');
        await expect(copiesText(page, 'kael', 3)).toHaveText('2/3');
        await expect(page.getByTestId('skill-slot-3')).toHaveAttribute('data-unlocked', 'true');

        await page.getByTestId('hero-back').click();

        await expect(chips(page, 'kael')).toHaveText([ '1★×1', '2★×1', '3★×2' ]);
        await expect(page.getByTestId('bag-card-star-kael')).toHaveText('3★');
        await expect(page.getByTestId('bag-card-fuse-kael')).toHaveCount(0);
    });

    test('Fundir tudo names the skills it raised', async ({ page }) => {
        await startWith(page, { 'kael:3': 9 });
        await openHero(page, 'kael');
        await page.getByTestId('fusion-all').click();

        await expect(page.getByTestId('fusion-all-question')).toHaveText('Fazer 4 fusões?');

        await page.getByTestId('fusion-all-yes').click();

        await expect(page.getByTestId('fusion-result')).toHaveText('4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2');

        await page.getByTestId('hero-back').click();

        await expect(page.getByTestId('bag-card-kael')).toHaveAttribute('data-frame', 'silver');
    });

    test('a failed Fundir tudo changes nothing', async ({ page }) => {
        await startWith(page, KAEL_LADDER);
        await page.route('**/api/heroes/kael/fuse-all', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }));

        await openHero(page, 'kael');
        await page.getByTestId('fusion-all').click();
        await page.getByTestId('fusion-all-yes').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível fundir as cartas.');
        await expect(copiesText(page, 'kael', 0)).toHaveText('45/3');
        await expect(page.getByTestId('fusion-result')).toHaveCount(0);
        await expect(page.getByTestId('fusion-all-confirm')).toHaveCount(0);
    });

    test('the rail has six buttons and no Fusão', async ({ page }) => {
        await startWith(page, { 'kael:0': 1 });

        const ids = await page.locator('.hero-hud [data-testid^="hud-"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid));

        expect(ids).toEqual([ 'hud-heroes', 'hud-bag', 'hud-leader', 'hud-equipment', 'hud-talents', 'hud-farm' ]);
        await expect(page.getByTestId('hud-fusion')).toHaveCount(0);
    });

    test('the rarity gems sit centered on the top edge of every piece tile', async ({ page }) => {
        await startWith(page, { 'kael:0': 1 }, { equipment: [ piece('m1', 'RING', 'LEGENDARY', 2), piece('w1', 'WEAPON', 'EPIC', 0, 'kael') ] });
        await page.getByTestId('hud-equipment').click();
        await expect(page.getByTestId('equipment-list')).toBeVisible();

        const centered = async (testid) => {
            const locator = page.getByTestId(testid);
            const tile = await locator.boundingBox();
            const gems = await locator.locator('.piece-gems').boundingBox();

            expect(Math.abs((gems.x + gems.width / 2) - (tile.x + tile.width / 2))).toBeLessThanOrEqual(1);
            expect(gems.y).toBeLessThan(tile.y);
        };

        await centered('equip-piece-m1');
        await centered('equip-slot-kael-WEAPON');

        await expect(page.getByTestId('equip-piece-m1')).toHaveAttribute('data-gems', '4');
        await expect(page.getByTestId('equip-piece-m1').locator('.piece-refine')).toHaveText('+2');

        //  The refine badge keeps `right: 2px; bottom: 1px` (BAG-02), measured from the padding box of the 3 px border
        await expect(page.getByTestId('equip-piece-m1').locator('.piece-refine')).toHaveCSS('right', '2px');
        await expect(page.getByTestId('equip-piece-m1').locator('.piece-refine')).toHaveCSS('bottom', '1px');

        const tile = await page.getByTestId('equip-piece-m1').boundingBox();
        const refine = await page.getByTestId('equip-piece-m1').locator('.piece-refine').boundingBox();
        //  The window is scaled to the viewport: the 60 px tile tells the factor
        const scale = tile.width / 60;

        expect(Math.abs(((tile.x + tile.width) - (refine.x + refine.width)) / scale - 5)).toBeLessThanOrEqual(0.5);

        await page.getByTestId('bulk-sell-start').click();
        await expect(page.getByTestId('bulk-sell-bar')).toBeVisible();
        await centered('equip-piece-m1');
    });
});
