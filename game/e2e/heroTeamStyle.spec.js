import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Hero team (spec hero-team, Equipe Screen Layout): the computed style of every size, font, colour, border and gap the spec names.
//  The Grove tokens in rgb: --ember-700 #a8431a, --ember-500 #e8742a, --ink-900 #2a1a10, --ink-600 #6b4a2b, --wood-600 #5a3d26,
//  --gold-400 #e0b45a, --parchment-100 #f4e6c8.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

const EMBER_700 = 'rgb(168, 67, 26)';
const INK_900 = 'rgb(42, 26, 16)';
const INK_600 = 'rgb(107, 74, 43)';
const WOOD_600 = 'rgb(90, 61, 38)';
const GOLD_400 = 'rgb(224, 180, 90)';
const PARCHMENT_100 = 'rgb(244, 230, 200)';

const startTeam = async (page, { chapter = 5, cleared = [ 5 ], copper = 0, team } = {}) => {
    const copies = Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ]));
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        cards: { yan: { leader: 'kael', cleared, copies } },
        progress: { yan: { chapter, stage: 1, encounter: 'PHASE', phase: 1 } },
        wallets: { yan: copper },
        team: team ? { yan: team } : {}
    });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return handle;
};

const openTeam = async (page) => {
    await page.getByTestId('hud-team').click();
    await expect(page.getByTestId('team-screen')).toBeVisible();
};

//  The box of a DOM element in scene px (the scene is 1024 px wide)
const sceneBox = async (page, locator) => {
    const canvas = await page.locator('#game-container canvas').boundingBox();

    await locator.waitFor({ state: 'visible' });

    const box = await locator.boundingBox();
    const scale = canvas.width / 1024;

    return { x: (box.x - canvas.x) / scale, y: (box.y - canvas.y) / scale, width: box.width / scale, height: box.height / scale };
};

const near = (actual, expected) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

//  Asserts every property of `style` on `locator`; a RegExp value matches a part of the computed text
const hasStyle = async (locator, style) => {
    for (const [ property, value ] of Object.entries(style))
    {
        await expect(locator, property).toHaveCSS(property, value);
    }
};

const slot = (page, index) => page.getByTestId(`team-slot-${index}`);
const FONT_BODY = /Figtree/;
const FONT_HEADING = /Cinzel/;

test.describe('Hero team: computed style of the Equipe screen', () => {
    test('the screen blocks: status, team damage, slot row and available title', async ({ page }) => {
        await startTeam(page, { chapter: 3, cleared: [ 5 ] });
        await openTeam(page);

        await hasStyle(page.getByTestId('team-status'), {
            'font-family': FONT_BODY, 'font-weight': '600', 'font-size': '14px', color: EMBER_700
        });
        await hasStyle(page.getByTestId('team-dps'), {
            'font-family': FONT_HEADING, 'font-weight': '700', 'font-size': '18px', color: INK_900
        });
        await hasStyle(page.locator('.team-available-title'), {
            'font-family': FONT_HEADING, 'font-weight': '700', 'font-size': '16px', color: INK_900
        });
        await hasStyle(page.getByTestId('team-screen'), { 'row-gap': '12px', 'align-items': 'center' });
        await hasStyle(page.getByTestId('team-slots'), { 'column-gap': '16px' });
        await hasStyle(page.getByTestId('team-available'), { 'column-gap': '12px', 'row-gap': '12px' });

        const row = await sceneBox(page, page.getByTestId('team-slots'));

        near(row.width, 724);
    });

    test('every slot card has 8 px padding and radius, a column gap of 4 px and the border of its state', async ({ page }) => {
        //  Slot 1 filled, slot 2 empty, slot 3 buyable, slot 4 locked
        await startTeam(page, { cleared: [ 5, 6, 7 ], team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] } });
        await openTeam(page);

        for (let index = 0; index <= 4; index++)
        {
            await hasStyle(slot(page, index), {
                'box-sizing': 'border-box',
                'padding-top': '8px',
                'padding-right': '8px',
                'padding-bottom': '8px',
                'padding-left': '8px',
                'border-top-left-radius': '8px',
                'border-bottom-right-radius': '8px',
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'row-gap': '4px'
            });
        }

        await expect(slot(page, 0)).toHaveAttribute('data-state', 'leader');
        await hasStyle(slot(page, 0), { 'background-color': PARCHMENT_100, 'border-top-width': '3px', 'border-top-style': 'solid', 'border-top-color': 'rgb(232, 182, 76)' });

        await expect(slot(page, 1)).toHaveAttribute('data-state', 'filled');
        await hasStyle(slot(page, 1), { 'background-color': PARCHMENT_100, 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-color': WOOD_600 });

        await expect(slot(page, 2)).toHaveAttribute('data-state', 'empty');
        await hasStyle(slot(page, 2), { 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-width': '2px', 'border-top-style': 'dashed', 'border-top-color': WOOD_600 });

        await expect(slot(page, 3)).toHaveAttribute('data-state', 'buyable');
        await hasStyle(slot(page, 3), { 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-color': GOLD_400, opacity: '1' });

        await expect(slot(page, 4)).toHaveAttribute('data-state', 'locked');
        await hasStyle(slot(page, 4), { 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-color': WOOD_600, opacity: '0.5' });
    });

    test('a waiting slot has the wood border and half opacity', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6, 7 ] });
        await openTeam(page);

        await expect(slot(page, 2)).toHaveAttribute('data-state', 'waiting');
        await hasStyle(slot(page, 2), { 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-color': WOOD_600, opacity: '0.5' });
    });

    test('the texts inside the cards: label, name, stars, damage, passive, leader bonus, vazio, coin, price and lock text', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6, 7 ], team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] } });
        await openTeam(page);

        const leader = slot(page, 0);
        const ally = slot(page, 1);

        await hasStyle(leader.locator('.team-slot-label'), { 'font-family': FONT_HEADING, 'font-weight': '700', 'font-size': '12px', color: INK_600 });
        await hasStyle(ally.locator('.team-slot-label'), { 'font-family': FONT_HEADING, 'font-weight': '700', 'font-size': '12px', color: INK_600 });

        for (const card of [ leader, ally ])
        {
            await hasStyle(card.locator('.team-portrait'), { width: '80px', height: '80px', 'object-fit': 'contain' });
            await hasStyle(card.locator('.team-name'), {
                'font-family': FONT_BODY, 'font-weight': '700', 'font-size': '13px', color: INK_900,
                'white-space': 'nowrap', 'text-overflow': 'ellipsis', overflow: 'hidden'
            });
            await hasStyle(card.locator('.team-stars'), { 'font-family': FONT_BODY, 'font-weight': '600', 'font-size': '12px' });
        }

        await hasStyle(leader.locator('.team-bonus'), {
            'font-family': FONT_BODY, 'font-weight': '500', 'font-size': '11px', color: INK_600, '-webkit-line-clamp': '2'
        });
        await hasStyle(ally.locator('.team-dps-line'), { 'font-family': FONT_BODY, 'font-weight': '600', 'font-size': '12px', color: EMBER_700 });
        await expect(ally.locator('.team-dps-line')).toHaveText('Dano: 2/s');
        await hasStyle(ally.locator('.team-passive'), {
            'font-family': FONT_BODY, 'font-weight': '500', 'font-size': '11px', color: INK_600, '-webkit-line-clamp': '2'
        });
        await expect(ally.locator('.team-passive')).toHaveText('Olho do Falcão: +10 de chance de crítico');

        await hasStyle(slot(page, 2).locator('.team-empty'), {
            'font-family': FONT_BODY, 'font-weight': '500', 'font-style': 'italic', 'font-size': '13px', color: INK_600
        });

        const buyable = slot(page, 3);

        await hasStyle(buyable.locator('.team-coin'), { width: '32px', height: '32px', 'border-radius': '50%', 'background-image': /rgb\(255, 241, 176\).*rgb\(224, 180, 90\) 55%.*rgb\(138, 90, 18\)/ });
        await hasStyle(buyable.locator('.team-price'), { 'font-family': FONT_HEADING, 'font-weight': '700', 'font-size': '22px', color: INK_900 });
        await expect(buyable.locator('.team-price')).toHaveText('3');

        const locked = slot(page, 4);

        await hasStyle(locked.locator('.team-lock-text'), { 'font-family': FONT_BODY, 'font-weight': '500', 'font-size': '11px', color: INK_600 });
        await hasStyle(locked.locator('.team-coin'), { width: '32px', height: '32px' });
        await hasStyle(locked.locator('.team-price'), { 'font-family': FONT_HEADING, 'font-weight': '700', 'font-size': '22px', color: INK_900 });
    });

    test('a selected card has a 3 px ember outline 2 px away', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] } });
        await openTeam(page);
        await slot(page, 1).click();

        await expect(slot(page, 1)).toHaveAttribute('data-selected', 'true');
        await hasStyle(slot(page, 1), { 'outline-width': '3px', 'outline-style': 'solid', 'outline-color': 'rgb(232, 116, 42)', 'outline-offset': '2px' });
        await expect(slot(page, 0)).toHaveAttribute('data-selected', 'false');
        await expect(slot(page, 0)).toHaveCSS('outline-style', 'none');
    });

    test('the available entries: 200 x 80, padding 8, parchment, radius 8 and the text sizes', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });
        await openTeam(page);

        const entry = page.getByTestId('team-available-lyra');
        const box = await sceneBox(page, entry);

        near(box.width, 200);
        near(box.height, 80);
        await hasStyle(entry, {
            'box-sizing': 'border-box',
            'padding-top': '8px',
            'padding-left': '8px',
            'background-color': PARCHMENT_100,
            'border-top-left-radius': '8px',
            'border-top-width': '1px',
            'border-top-style': 'solid'
        });
        await hasStyle(entry.locator('.team-hero-portrait'), { width: '64px', height: '64px' });
        await hasStyle(entry.locator('.team-hero-name'), { 'font-family': FONT_BODY, 'font-weight': '700', 'font-size': '13px' });
        await hasStyle(entry.locator('.team-hero-stars'), { 'font-family': FONT_BODY, 'font-weight': '600', 'font-size': '12px' });
        await hasStyle(entry.locator('.team-hero-passive'), { 'font-family': FONT_BODY, 'font-weight': '500', 'font-size': '11px', color: INK_600 });
    });

    test('the actions are secondary fusion buttons, 12 px apart', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });
        await openTeam(page);

        for (const [ id, text ] of [ [ 'team-remove', 'Remover' ], [ 'team-make-leader', 'Tornar líder' ] ])
        {
            await expect(page.getByTestId(id)).toHaveText(text);
            await expect(page.getByTestId(id)).toHaveClass(/fusion-button/);
            await expect(page.getByTestId(id)).toHaveClass(/is-secondary/);
        }

        const remove = await sceneBox(page, page.getByTestId('team-remove'));
        const makeLeader = await sceneBox(page, page.getByTestId('team-make-leader'));

        near(makeLeader.x - (remove.x + remove.width), 12);
    });

    test('the purchase dialog: parchment, 8 px radius, 12 x 16 padding, texts and buttons', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], copper: 5_000 });
        await openTeam(page);
        await slot(page, 1).click();

        await hasStyle(page.getByTestId('team-buy-dialog'), {
            'box-sizing': 'border-box',
            'background-color': PARCHMENT_100,
            'border-top-left-radius': '8px',
            'padding-top': '12px',
            'padding-bottom': '12px',
            'padding-left': '16px',
            'padding-right': '16px',
            'border-top-width': '1px',
            'border-top-style': 'solid'
        });
        await hasStyle(page.getByTestId('team-buy-question'), { 'font-family': FONT_BODY, 'font-weight': '600', 'font-size': '14px' });
        await hasStyle(page.locator('.team-buy-short'), { 'font-family': FONT_BODY, 'font-weight': '600', 'font-size': '13px', color: EMBER_700 });
        await expect(page.getByTestId('team-buy-confirm')).toHaveClass(/fusion-button/);
        await expect(page.getByTestId('team-buy-confirm')).not.toHaveClass(/is-secondary/);
        await expect(page.getByTestId('team-buy-cancel')).toHaveClass(/is-secondary/);
        await expect(page.getByTestId('team-buy-confirm')).toHaveText('Comprar');
        await expect(page.getByTestId('team-buy-cancel')).toHaveText('Cancelar');
    });

    test('the purchase notice is Figtree 700 14 px in ink and the flash is gold', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], copper: 10_000 });
        await openTeam(page);
        await slot(page, 1).click();
        await page.getByTestId('team-buy-confirm').click();

        await expect(page.getByTestId('team-notice')).toBeVisible();
        await hasStyle(page.getByTestId('team-notice'), { 'font-family': FONT_BODY, 'font-weight': '700', 'font-size': '14px', color: INK_900 });
        await expect(page.getByTestId('team-notice')).toHaveText('Vaga de aliado comprada!');
    });
});
