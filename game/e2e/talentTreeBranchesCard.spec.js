import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The detail card of the talent tree: the description, the icon in its ring, the size and the kept texts (spec talent-tree-branches, P1 Card). The 10 texts are
//  written out here, not read from the game. Every test routes every `talent-*` file as missing (404) or present (a valid 1 x 1 picture), so the art on disk never
//  changes the result (L-051).
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const artMissing = (page) => page.route('**/assets/talent-*', (route) => route.fulfill({ status: 404, body: '' }));
const artPresent = (page) => page.route('**/assets/talent-*', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));

const ARMORED = { element: 'FIRE', defense: 20, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};

//  `art` is 'missing' or 'present'; `talents` are the starting levels, `points` the unspent talent points on top of them, `routes(page)` adds routes after the
//  fake backend (the later route wins)
const startGame = async (page, { art, talents, points = 0, routes } = {}) => {
    expect([ 'missing', 'present' ]).toContain(art);

    await (art === 'missing' ? artMissing(page) : artPresent(page));
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: CHAPTER,
        ...(talents && { talents: { yan: talents } }),
        ...(points > 0 && { talentPoints: { yan: points } })
    });
    await routes?.(page);

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return menu;
};

const openTalents = async (page) =>
{
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
};

const size = (locator) => locator.evaluate((node) => [ node.offsetWidth, node.offsetHeight ]);
const select = (page, id) => page.getByTestId(`talent-${id}`).click();

//  What each talent does, in the player's words (spec P1 Card AC 1)
const DESCRIPTIONS = {
    MINIBOSS_TIME: 'Você ganha mais segundos para derrotar cada miniboss antes que o tempo acabe.',
    BOSS_DAMAGE: 'Os golpes do seu líder causam mais dano em minibosses e chefes de capítulo.',
    PHYSICAL_BREAK: 'Diminui a defesa dos inimigos, então cada golpe tira mais vida deles.',
    ARMOR_PIERCE: 'Os golpes do seu líder ignoram uma parte da defesa que ainda resta no inimigo.',
    CLICK_DAMAGE: 'Aumenta em porcentagem o dano de cada clique e de cada habilidade do seu líder.',
    CLICK_FLAT_DAMAGE: 'Soma um valor fixo ao dano de cada clique do seu líder, antes dos bônus em porcentagem.',
    CRIT_CHANCE: 'Aumenta a chance de um golpe do seu líder ser crítico; o que passar de 100% contra o inimigo vira dano crítico.',
    CRIT_DAMAGE: 'Os golpes críticos do seu líder causam ainda mais dano.',
    COMBO: 'Cliques seguidos somam um bônus de dano; este talento aumenta o limite desse bônus.',
    COMBO_FURY: 'Cada clique soma mais bônus de combo, então você chega ao limite com menos cliques.'
};

//  The branch colours of the ring (spec P1 Card AC 3)
const RING = { TIME: 'rgb(59, 154, 166)', BREAK: 'rgb(196, 73, 47)', POWER: 'rgb(201, 154, 31)', COMBO: 'rgb(138, 91, 214)' };

const icon = (page) => page.getByTestId('talent-detail-icon');

test.describe('Talentos card: the description', () => {
    test('the card explains each of the 10 talents in the player\'s words', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        for (const [ id, text ] of Object.entries(DESCRIPTIONS))
        {
            await select(page, id);
            await expect(page.getByTestId(`talent-description-${id}`)).toHaveText(text);
            await expect(page.locator('[data-testid^="talent-description-"]')).toHaveCount(1);
        }
    });

    test('grades 2 and 3 read the text of grade 1', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await select(page, 'CLICK_DAMAGE_G2');
        await expect(page.getByTestId('talent-description-CLICK_DAMAGE_G2')).toHaveText(DESCRIPTIONS.CLICK_DAMAGE);

        await select(page, 'COMBO_G3');
        await expect(page.getByTestId('talent-description-COMBO_G3')).toHaveText(DESCRIPTIONS.COMBO);
    });

    test('changing the selection changes the icon and the description', async ({ page }) => {
        await startGame(page, { art: 'present' });
        await openTalents(page);

        await select(page, 'CLICK_DAMAGE');
        await expect(page.getByTestId('talent-description-CLICK_DAMAGE')).toHaveText(DESCRIPTIONS.CLICK_DAMAGE);
        await expect(icon(page).locator('img')).toHaveAttribute('src', /assets\/talent-click-damage\.png$/);
        await expect(icon(page)).toHaveCSS('border-top-color', RING.POWER);

        await select(page, 'COMBO_FURY');
        await expect(page.getByTestId('talent-description-COMBO_FURY')).toHaveText(DESCRIPTIONS.COMBO_FURY);
        await expect(page.getByTestId('talent-description-CLICK_DAMAGE')).toHaveCount(0);
        await expect(icon(page).locator('img')).toHaveAttribute('src', /assets\/talent-combo-fury\.png$/);
        await expect(icon(page)).toHaveCSS('border-top-color', RING.COMBO);
    });
});

test.describe('Talentos card: the icon ring', () => {
    test('the card shows the talent icon in a ring of the branch colour', async ({ page }) => {
        await startGame(page, { art: 'present', talents: { CLICK_DAMAGE: 10 } });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');

        expect(await size(icon(page))).toEqual([ 88, 88 ]);
        await expect(icon(page)).toHaveCSS('border-top-width', '3px');
        await expect(icon(page)).toHaveCSS('border-top-style', 'solid');
        await expect(icon(page)).toHaveCSS('border-top-color', 'rgb(201, 154, 31)');
        await expect(icon(page)).toHaveCSS('border-radius', '50%');

        const shadow = await icon(page).evaluate((node) => getComputedStyle(node).boxShadow);

        expect(shadow).toContain('rgb(28, 18, 12) 0px 0px 0px 2px');
        expect(shadow).toContain('rgb(201, 154, 31) 0px 0px 14px 4px');
        expect(await size(icon(page).locator('.talent-detail-art'))).toEqual([ 64, 64 ]);
        await expect(icon(page).locator('.talent-detail-art img')).toHaveAttribute('src', /assets\/talent-click-damage\.png$/);

        //  The ring sits at the right of the text column, inside the card
        const boxes = await page.evaluate(() =>
        {
            const read = (id) => document.querySelector(`[data-testid="${id}"]`).getBoundingClientRect();
            const { left: ringLeft, right: ringRight } = read('talent-detail-icon');

            return { ringLeft, ringRight, bodyRight: read('talent-detail-body').right, cardRight: read('talent-detail').right };
        });

        expect(boxes.ringLeft).toBeGreaterThan(boxes.bodyRight);
        expect(boxes.ringRight).toBeLessThanOrEqual(boxes.cardRight);

        //  The colour follows the branch
        for (const [ id, colour ] of [ [ 'MINIBOSS_TIME', RING.TIME ], [ 'PHYSICAL_BREAK', RING.BREAK ], [ 'COMBO', RING.COMBO ] ])
        {
            await select(page, id);
            await expect(icon(page)).toHaveCSS('border-top-color', colour);
        }

        //  A grade 2 talent shows the file of its grade
        await select(page, 'CLICK_DAMAGE_G2');
        await expect(icon(page).locator('img')).toHaveAttribute('src', /assets\/talent-click-damage-g2\.png$/);
    });

    test('a missing grade icon falls back to the grade 1 file', async ({ page }) => {
        await startGame(page, {
            art: 'present',
            talents: { CLICK_DAMAGE: 10 },
            routes: (target) => target.route('**/assets/talent-click-damage-g2.png', (route) => route.fulfill({ status: 404, body: '' }))
        });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE_G2');

        await expect(icon(page).locator('img')).toHaveAttribute('src', /assets\/talent-click-damage\.png$/);
        await expect.poll(() => icon(page).locator('img').evaluate((image) => image.naturalWidth)).toBe(1);
    });

    test('with the icons missing the card shows the branch glyph in the ring', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        for (const [ id, glyph ] of [ [ 'CLICK_DAMAGE', '⚔' ], [ 'MINIBOSS_TIME', '⏳' ], [ 'PHYSICAL_BREAK', '🛡' ], [ 'COMBO_FURY', '✦' ] ])
        {
            await select(page, id);

            const fallback = icon(page).locator('.icon-fallback');

            await expect(fallback).toHaveText(glyph);
            await expect(fallback).toHaveCSS('font-size', '34px');
            await expect(fallback).toHaveCSS('color', 'rgb(244, 230, 200)');
            expect(await size(icon(page))).toEqual([ 88, 88 ]);
        }
    });
});

test.describe('Talentos card: size and layout', () => {
    test('the card is 460 x 136, 8 px above the bottom and centred, level and effect on one row', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');

        expect(await size(page.getByTestId('talent-detail'))).toEqual([ 460, 136 ]);
        await expect(page.getByTestId('talent-detail')).toHaveCSS('bottom', '8px');

        //  Centred on the window (L-073): the centre of the card is the centre of `.hero-window`
        const centres = await page.evaluate(() =>
        {
            const middle = (node) => { const box = node.getBoundingClientRect(); return box.x + box.width / 2; };

            return [ middle(document.querySelector('[data-testid="talent-detail"]')), middle(document.querySelector('.hero-window')) ];
        });

        expect(Math.abs(centres[0] - centres[1])).toBeLessThanOrEqual(1);

        const tops = await page.evaluate(() => [ 'talent-level-CLICK_DAMAGE', 'talent-effect-CLICK_DAMAGE' ]
            .map((id) => document.querySelector(`[data-testid="${id}"]`).getBoundingClientRect().top));

        expect(Math.abs(tops[0] - tops[1])).toBeLessThanOrEqual(0.5);
    });

    test('no text of the card is clipped', async ({ page }) => {
        //  CLICK_DAMAGE at level 9 with 1 point: the button, then the max text after the purchase; its grade 3 is locked
        await startGame(page, { art: 'missing', talents: { CLICK_DAMAGE: 9 }, points: 1 });
        await openTalents(page);

        const fits = async (id, action) =>
        {
            await select(page, id);
            await expect(page.getByTestId(`talent-description-${id}`)).toBeVisible();
            await expect(page.getByTestId(action)).toBeVisible();

            return page.evaluate((key) =>
            {
                const body = document.querySelector('[data-testid="talent-detail-body"]');

                return {
                    clipped: body.scrollHeight > body.clientHeight,
                    description: document.querySelector(`[data-testid="talent-description-${key}"]`).offsetHeight
                };
            }, id);
        };

        const states = [];

        states.push([ 'CLICK_DAMAGE button', await fits('CLICK_DAMAGE', 'talent-upgrade-CLICK_DAMAGE') ]);
        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();
        await expect(page.getByTestId('talent-max-CLICK_DAMAGE')).toHaveText('Nível máximo');
        states.push([ 'CLICK_DAMAGE max', await fits('CLICK_DAMAGE', 'talent-max-CLICK_DAMAGE') ]);
        states.push([ 'CLICK_DAMAGE_G3 locked', await fits('CLICK_DAMAGE_G3', 'talent-locked-CLICK_DAMAGE_G3') ]);
        states.push([ 'COMBO_FURY locked', await fits('COMBO_FURY', 'talent-locked-COMBO_FURY') ]);
        await expect(page.getByTestId('talent-locked-COMBO_FURY')).toHaveText('Bloqueado: chegue ao nível 10 de Limite de dano do combo');
        states.push([ 'CRIT_CHANCE longest', await fits('CRIT_CHANCE', 'talent-upgrade-CRIT_CHANCE') ]);

        expect(states.filter(([ , state ]) => state.clipped).map(([ name ]) => name)).toEqual([]);
        expect(states.filter(([ , state ]) => state.description > 30).map(([ name ]) => name)).toEqual([]);
    });

    test('with nothing selected the card shows only the hint', async ({ page }) => {
        await startGame(page, { art: 'present' });
        await openTalents(page);

        await expect(page.getByTestId('talent-detail-empty')).toHaveText('Escolha um talento na árvore para ver os detalhes.');
        await expect(page.getByTestId('talent-detail-icon')).toHaveCount(0);
        await expect(page.getByTestId('talent-detail-body')).toHaveCount(0);
        await expect(page.locator('[data-testid^="talent-description-"]')).toHaveCount(0);
        expect(await size(page.getByTestId('talent-detail'))).toEqual([ 460, 136 ]);
    });
});

test.describe('Talentos card: the text styles', () => {
    test('the card text keeps the fonts, sizes and colours of the spec', async ({ page }) => {
        await startGame(page, { art: 'present' });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');

        //  The name in Cinzel 16 px; the level and the effect at 13 px, 12 px apart on one row; the description in Figtree 12 px on a 15 px line in --ink-900
        const name = page.getByTestId('talent-detail-name');
        const description = page.getByTestId('talent-description-CLICK_DAMAGE');

        await expect(name).toHaveCSS('font-size', '16px');
        expect(await name.evaluate((node) => getComputedStyle(node).fontFamily)).toContain('Cinzel');
        await expect(page.getByTestId('talent-level-CLICK_DAMAGE')).toHaveCSS('font-size', '13px');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveCSS('font-size', '13px');
        await expect(page.locator('.talent-detail-stats')).toHaveCSS('column-gap', '12px');
        await expect(description).toHaveCSS('font-size', '12px');
        await expect(description).toHaveCSS('line-height', '15px');
        await expect(description).toHaveCSS('color', 'rgb(42, 26, 16)');
        expect(await description.evaluate((node) => getComputedStyle(node).fontFamily)).toContain('Figtree');

        //  The ring on the wood: a radial wood background
        expect(await icon(page).evaluate((node) => getComputedStyle(node).backgroundImage)).toContain('radial-gradient');
    });
});

test.describe('Talentos card: the kept texts', () => {
    test('the card keeps its texts and its button', async ({ page }) => {
        await startGame(page, { art: 'missing', points: 1 });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');

        await expect(page.getByTestId('talent-detail-name')).toHaveText('Dano de clique (%)');
        await expect(page.getByTestId('talent-level-CLICK_DAMAGE')).toHaveText('Nível 0/10');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveText('Efeito: nenhum');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toHaveText('Melhorar (1 ponto)');

        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();

        await expect(page.getByTestId('talent-level-CLICK_DAMAGE')).toHaveText('Nível 1/10');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveText('Efeito: +5%');
        await expect(page.getByTestId('talent-description-CLICK_DAMAGE')).toHaveText(DESCRIPTIONS.CLICK_DAMAGE);
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toBeDisabled();
    });
});
