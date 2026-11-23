import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The painted talent tree (spec talent-tree-rework, P2 Tree and P2 Fúria AC 8, AC 9). Every test routes every `talent-*` file as missing (404) or present
//  (a valid 1 x 1 picture), so the art that happens to be on disk never changes the result (L-051).
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const artMissing = (page) => page.route('**/assets/talent-*', (route) => route.fulfill({ status: 404, body: '' }));
const artPresent = (page) => page.route('**/assets/talent-*', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));

const ARMORED = { element: 'FIRE', physicalDefense: 20, magicalDefense: 0, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};

//  `art` is 'missing' or 'present'; `talents` are the starting levels, `points` the unspent talent points on top of them, `viewport` a phone size,
//  `routes(page)` adds routes after the fake backend (the later route wins)
const startGame = async (page, { art, talents, points = 0, viewport, routes } = {}) => {
    expect([ 'missing', 'present' ]).toContain(art);

    await (art === 'missing' ? artMissing(page) : artPresent(page));
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: CHAPTER,
        ...(talents && { talents: { yan: talents } }),
        ...(points > 0 && { talentPoints: { yan: points } })
    });
    await routes?.(page);

    if (viewport)
    {
        await page.setViewportSize(viewport);
    }

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
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

//  The 12 talents of the POWER branch at level 10
const POWER_AT_10 = Object.fromEntries([ 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ]
    .flatMap((id) => [ id, `${id}_G2`, `${id}_G3` ]).map((id) => [ id, 10 ]));

//  The 9 talents of the backend before talent-tree-rework, with BOSS_TIME and CRIT_RESIST_BREAK, in 3 grades and no COMBO_FURY: the list of an older backend
const OLD_CATALOG = [
    [ 'MINIBOSS_TIME', 'TIME', 's' ], [ 'BOSS_TIME', 'TIME', 's' ], [ 'PHYSICAL_BREAK', 'BREAK', 'points' ], [ 'CRIT_RESIST_BREAK', 'BREAK', 'points' ],
    [ 'CLICK_DAMAGE', 'POWER', '%' ], [ 'CRIT_CHANCE', 'POWER', 'points' ], [ 'CRIT_DAMAGE', 'POWER', '%' ], [ 'COMBO', 'COMBO', '%' ], [ 'CLICK_FLAT_DAMAGE', 'POWER', 'dmg' ]
];
const olderBackendTalents = () => ({
    talents: [ 1, 2, 3 ].flatMap((grade) => OLD_CATALOG.map(([ baseId, branch, unit ]) => ({
        id: grade === 1 ? baseId : `${baseId}_G${grade}`, baseId, grade, branch, label: baseId, unit, perLevel: grade, maxLevel: 10, level: 0, value: 0, nextCost: grade, unlocked: grade === 1
    }))),
    points: { earned: 0, spent: 0, available: 0 }
});

const problem = (status, code) => ({ status, contentType: 'application/problem+json', json: { status, detail: code, code } });

test.describe('Talentos tree: the window', () => {
    test('opens a 1024 x 576 window with the tree, the plaques and the empty card', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        expect(await size(page.locator('.hero-window'))).toEqual([ 1024, 576 ]);
        await expect(page.getByTestId('talent-title')).toHaveText('Talentos');
        expect(await size(page.getByTestId('talent-title'))).toEqual([ 192, 64 ]);
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 0');
        await expect(page.getByTestId('talent-points')).toHaveCSS('left', '12px');
        await expect(page.getByTestId('talent-points')).toHaveCSS('bottom', '12px');
        await expect(page.getByTestId('talent-reset')).toHaveText('Reiniciar pontos');
        await expect(page.getByTestId('talent-reset')).toBeDisabled();
        await expect(page.getByTestId('talent-reset')).toHaveCSS('right', '12px');
        await expect(page.getByTestId('talent-reset')).toHaveCSS('bottom', '12px');
        expect((await size(page.getByTestId('talent-detail')))[0]).toBe(380);
        await expect(page.getByTestId('talent-detail-empty')).toHaveText('Escolha um talento na árvore para ver os detalhes.');
        await expect(page.getByTestId('hero-close')).toBeVisible();

        //  The window is centred on the canvas, full width
        const window = await page.locator('.hero-window').boundingBox();
        const canvas = await page.locator('#game-container canvas').boundingBox();

        expect(Math.abs((window.y + window.height / 2) - (canvas.y + canvas.height / 2))).toBeLessThanOrEqual(2);
        expect(Math.abs(window.width - canvas.width)).toBeLessThanOrEqual(2);
    });

    test('opening the screen again clears the selection', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('talent-detail-empty')).toHaveCount(0);

        await page.getByTestId('hero-close').click();
        await openTalents(page);

        await expect(page.getByTestId('talent-detail-empty')).toBeVisible();
        await expect(page.locator('.talent-node[aria-pressed="true"]')).toHaveCount(0);
    });
});

test.describe('Talentos tree: nodes', () => {
    test('draws 28 nodes at their map coordinates, Fúria crescente bigger', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await expect(page.locator('.talent-node')).toHaveCount(28);
        expect((await size(page.getByTestId('talent-CLICK_DAMAGE')))[0]).toBe(60);
        expect((await size(page.getByTestId('talent-COMBO_FURY')))[0]).toBe(88);

        //  CLICK_DAMAGE sits at 55 % x 1024 and 46 % x 576 of the board
        const centre = await page.getByTestId('talent-CLICK_DAMAGE').evaluate((node) =>
        {
            const tree = document.querySelector('[data-testid="talent-tree"]').getBoundingClientRect();
            const box = node.getBoundingClientRect();

            return [ (box.x + box.width / 2 - tree.x) * (1024 / tree.width), (box.y + box.height / 2 - tree.y) * (576 / tree.height) ];
        });

        expect(Math.abs(centre[0] - 563)).toBeLessThanOrEqual(1);
        expect(Math.abs(centre[1] - 265)).toBeLessThanOrEqual(1);
    });

    test('captions grade 1 nodes and badges grades 2 and 3', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await expect(page.getByTestId('talent-caption-BOSS_DAMAGE')).toHaveText('Dano contra chefes');
        await expect(page.getByTestId('talent-caption-ARMOR_PIERCE')).toHaveText('Perfuração de armadura');
        await expect(page.getByTestId('talent-caption-COMBO_FURY')).toHaveText('Fúria crescente');
        await expect(page.getByTestId('talent-node-grade-BOSS_DAMAGE_G2')).toHaveText('II');
        await expect(page.getByTestId('talent-node-grade-BOSS_DAMAGE_G3')).toHaveText('III');
        await expect(page.getByTestId('talent-caption-BOSS_DAMAGE')).toHaveCSS('font-size', '12px');
        await expect(page.getByTestId('talent-node-grade-BOSS_DAMAGE_G2')).toHaveCSS('font-size', '11px');

        //  Grades 2 and 3 carry a badge and no caption; grade 1 carries no badge
        await expect(page.getByTestId('talent-caption-BOSS_DAMAGE_G2')).toHaveCount(0);
        await expect(page.getByTestId('talent-caption-BOSS_DAMAGE_G3')).toHaveCount(0);
        await expect(page.getByTestId('talent-node-grade-BOSS_DAMAGE')).toHaveCount(0);
        await expect(page.locator('.talent-node-caption')).toHaveCount(10);
        await expect(page.locator('.talent-node-grade')).toHaveCount(18);
    });

    test('names each node with a title and an aria-label', async ({ page }) => {
        await startGame(page, { art: 'missing', talents: { CLICK_DAMAGE: 3 } });
        await openTalents(page);

        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('title', 'Dano de clique (%)');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('aria-label', 'Dano de clique (%), nível 3 de 10');
        await expect(page.getByTestId('talent-BOSS_DAMAGE_G2')).toHaveAttribute('title', 'Dano contra chefes (Grau 2)');
        await expect(page.getByTestId('talent-BOSS_DAMAGE_G2')).toHaveAttribute('aria-label', 'Dano contra chefes (Grau 2), nível 0 de 10');
        await expect(page.getByTestId('talent-COMBO_FURY')).toHaveAttribute('aria-label', 'Fúria crescente, nível 0 de 4');
    });

    test('marks a locked node grey with the lock', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const locked = page.getByTestId('talent-CLICK_DAMAGE_G2');

        await expect(locked).toHaveAttribute('data-state', 'locked');
        await expect(locked.locator('.talent-node-icon')).toHaveCSS('filter', 'grayscale(1) brightness(0.55)');
        await expect(locked.locator('.talent-node-lock')).toBeVisible();
        await expect(page.getByTestId('talent-CLICK_DAMAGE').locator('.talent-node-lock')).toHaveCount(0);
        await expect(page.getByTestId('talent-CLICK_DAMAGE').locator('.talent-node-icon')).toHaveCSS('filter', 'none');
    });

    test('marks a maxed node with the gold ring', async ({ page }) => {
        await startGame(page, { art: 'present', talents: { CLICK_DAMAGE: 10 } });
        await openTalents(page);

        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('data-state', 'maxed');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveCSS('box-shadow', 'rgb(28, 18, 12) 0px 0px 0px 2px, rgb(243, 213, 138) 0px 0px 0px 5px');
        await expect(page.getByTestId('talent-node-level-CLICK_DAMAGE')).toHaveText('10/10');
        await expect(page.getByTestId('talent-node-level-CLICK_DAMAGE')).toHaveCSS('color', 'rgb(224, 180, 90)');
    });

    test('marks a maxed node of every branch with the double ring and the star seal, never in the branch colour', async ({ page }) => {
        const maxed = { MINIBOSS_TIME: 10, PHYSICAL_BREAK: 10, CLICK_DAMAGE: 10, COMBO: 10 };

        await startGame(page, { art: 'present', talents: maxed });
        await openTalents(page);

        for (const id of Object.keys(maxed))
        {
            const node = page.getByTestId(`talent-${id}`);

            await expect(node).toHaveAttribute('data-state', 'maxed');
            await expect(node).toHaveCSS('box-shadow', 'rgb(28, 18, 12) 0px 0px 0px 2px, rgb(243, 213, 138) 0px 0px 0px 5px');
            expect(await node.evaluate((element) => getComputedStyle(element, '::after').content)).toBe('"★"');
            expect(await node.evaluate((element) => getComputedStyle(element, '::after').backgroundColor)).toBe('rgb(243, 213, 138)');
        }

        //  A node that is not maxed carries no star
        await expect(page.getByTestId('talent-CLICK_DAMAGE_G2')).toHaveCSS('box-shadow', 'none');
        expect(await page.getByTestId('talent-CLICK_DAMAGE_G2').evaluate((element) => getComputedStyle(element, '::after').content)).toBe('none');
    });

    test('marks an available node with the branch glow and an open one without it', async ({ page }) => {
        //  CLICK_DAMAGE at its maximum opens grade 2, whose level costs 2 points: with 1 point it is open, not available
        await startGame(page, { art: 'present', talents: { CLICK_DAMAGE: 10 }, points: 1 });
        await openTalents(page);

        await expect(page.getByTestId('talent-CRIT_CHANCE')).toHaveAttribute('data-state', 'available');
        expect(await page.getByTestId('talent-CRIT_CHANCE').evaluate((node) => getComputedStyle(node).boxShadow)).toContain('rgb(201, 154, 31) 0px 0px 0px 3px');
        await expect(page.getByTestId('talent-CLICK_DAMAGE_G2')).toHaveAttribute('data-state', 'open');
        await expect(page.getByTestId('talent-CLICK_DAMAGE_G2')).toHaveCSS('box-shadow', 'none');
        await expect(page.getByTestId('talent-CLICK_DAMAGE_G3')).toHaveAttribute('data-state', 'locked');
    });
});

test.describe('Talentos tree: the detail card', () => {
    test('selecting a node sends no request and outlines it', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const requests = [];

        page.on('request', (request) => { if (request.url().includes('/api/talents')) { requests.push(`${request.method()} ${request.url()}`); } });

        await select(page, 'CLICK_DAMAGE');

        await expect(page.getByTestId('talent-detail-name')).toHaveText('Dano de clique (%)');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveCSS('outline-style', 'solid');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveCSS('outline-width', '3px');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveCSS('outline-color', 'rgb(244, 230, 200)');
        await expect(page.getByTestId('talent-CRIT_CHANCE')).toHaveAttribute('aria-pressed', 'false');
        expect(requests).toEqual([]);

        //  Another node takes the selection
        await select(page, 'CRIT_CHANCE');

        await expect(page.getByTestId('talent-detail-name')).toHaveText('Chance de crítico');
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('talent-CRIT_CHANCE')).toHaveAttribute('aria-pressed', 'true');
        expect(requests).toEqual([]);
    });

    test('buying a level keeps the node selected and updates the card, the chip, the medallion and the veins', async ({ page }) => {
        await startGame(page, { art: 'missing', points: 1 });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');

        await expect(page.getByTestId('talent-lit-POWER')).toHaveCSS('opacity', '0');
        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();

        await expect(page.getByTestId('talent-level-CLICK_DAMAGE')).toHaveText('Nível 1/10');
        await expect(page.getByTestId('talent-effect-CLICK_DAMAGE')).toHaveText('Efeito: +5%');
        await expect(page.getByTestId('talent-node-level-CLICK_DAMAGE')).toHaveText('1/10');
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 0');
        await expect(page.getByTestId('talent-lit-POWER')).toHaveCSS('opacity', '0.21');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toBeDisabled();
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('aria-pressed', 'true');
    });

    test('names the price of the button: 1 ponto, 2 pontos', async ({ page }) => {
        await startGame(page, { art: 'missing', talents: { CLICK_DAMAGE: 10 }, points: 5 });
        await openTalents(page);

        await select(page, 'CRIT_CHANCE');
        await expect(page.getByTestId('talent-upgrade-CRIT_CHANCE')).toHaveText('Melhorar (1 ponto)');
        await select(page, 'CLICK_DAMAGE_G2');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE_G2')).toHaveText('Melhorar (2 pontos)');
    });

    test('shows the lock text of a grade and of Fúria crescente with no button', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await select(page, 'CLICK_DAMAGE_G2');
        await expect(page.getByTestId('talent-locked-CLICK_DAMAGE_G2')).toHaveText('Bloqueado: chegue ao nível 10 do Grau 1');
        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE_G2')).toHaveCount(0);

        await select(page, 'COMBO_FURY');
        await expect(page.getByTestId('talent-locked-COMBO_FURY')).toHaveText('Bloqueado: chegue ao nível 10 de Limite de dano do combo');
        await expect(page.getByTestId('talent-upgrade-COMBO_FURY')).toHaveCount(0);
        await expect(page.getByTestId('talent-detail-name')).toHaveText('Fúria crescente');
    });

    test('Fúria crescente opens at COMBO 10, costs 2 points and reads +2% por clique', async ({ page }) => {
        await startGame(page, { art: 'missing', talents: { COMBO: 10 }, points: 2 });
        await openTalents(page);
        await select(page, 'COMBO_FURY');

        await expect(page.getByTestId('talent-level-COMBO_FURY')).toHaveText('Nível 0/4');
        await expect(page.getByTestId('talent-effect-COMBO_FURY')).toHaveText('Efeito: nenhum');
        await expect(page.getByTestId('talent-upgrade-COMBO_FURY')).toHaveText('Melhorar (2 pontos)');
        await expect(page.getByTestId('talent-COMBO_FURY')).toHaveAttribute('data-state', 'available');

        await page.getByTestId('talent-upgrade-COMBO_FURY').click();

        await expect(page.getByTestId('talent-level-COMBO_FURY')).toHaveText('Nível 1/4');
        await expect(page.getByTestId('talent-effect-COMBO_FURY')).toHaveText('Efeito: +2% por clique');
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 0');
        await expect(page.getByTestId('talent-node-level-COMBO_FURY')).toHaveText('1/4');
    });

    test('Fúria crescente at level 4 reads +5% por clique and Nível máximo', async ({ page }) => {
        await startGame(page, { art: 'missing', talents: { COMBO: 10, COMBO_FURY: 4 } });
        await openTalents(page);
        await select(page, 'COMBO_FURY');

        await expect(page.getByTestId('talent-level-COMBO_FURY')).toHaveText('Nível 4/4');
        await expect(page.getByTestId('talent-effect-COMBO_FURY')).toHaveText('Efeito: +5% por clique');
        await expect(page.getByTestId('talent-max-COMBO_FURY')).toHaveText('Nível máximo');
        await expect(page.getByTestId('talent-upgrade-COMBO_FURY')).toHaveCount(0);
        await expect(page.getByTestId('talent-COMBO_FURY')).toHaveAttribute('data-state', 'maxed');
    });
});

test.describe('Talentos tree: banners and lit veins', () => {
    test('the banners read the branch titles in the branch ink at 140 x 34', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await expect(page.locator('.talent-branch-title')).toHaveText([ 'Caça aos chefes', 'Quebra de defesa', 'Poder do clique', 'Combo' ]);
        expect(await size(page.getByTestId('talent-branch-TIME'))).toEqual([ 140, 34 ]);
        await expect(page.getByTestId('talent-branch-TIME').locator('.talent-branch-title')).toHaveCSS('color', 'rgb(36, 93, 100)');
        await expect(page.getByTestId('talent-branch-BREAK').locator('.talent-branch-title')).toHaveCSS('color', 'rgb(149, 55, 36)');
        await expect(page.getByTestId('talent-branch-POWER').locator('.talent-branch-title')).toHaveCSS('color', 'rgb(108, 83, 17)');
        await expect(page.getByTestId('talent-branch-COMBO').locator('.talent-branch-title')).toHaveCSS('color', 'rgb(106, 49, 197)');
    });

    test('the lit veins follow the levels: 0, 0.27, 0.44 and 1', async ({ page }) => {
        await startGame(page, { art: 'missing', talents: { MINIBOSS_TIME: 5, COMBO: 10, ...POWER_AT_10 } });
        await openTalents(page);

        await expect(page.getByTestId('talent-lit-BREAK')).toHaveCSS('opacity', '0');
        await expect(page.getByTestId('talent-lit-TIME')).toHaveCSS('opacity', '0.27');
        await expect(page.getByTestId('talent-lit-COMBO')).toHaveCSS('opacity', '0.44');
        await expect(page.getByTestId('talent-lit-POWER')).toHaveCSS('opacity', '1');
    });
});

test.describe('Talentos tree: the art', () => {
    test('with every art file missing the tree draws its fallbacks and still sells a level', async ({ page }) => {
        await startGame(page, { art: 'missing', points: 1 });
        await openTalents(page);

        await expect(page.getByTestId('talent-tree')).toHaveClass(/is-fallback/);
        await expect(page.getByTestId('talent-tree-veins')).toBeVisible();
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveClass(/no-frame/);
        expect(await page.getByTestId('talent-CLICK_DAMAGE').evaluate((node) => getComputedStyle(node).boxShadow)).toContain('rgb(201, 154, 31) 0px 0px 0px 4px inset');
        await expect(page.getByTestId('talent-CLICK_DAMAGE').locator('.icon-fallback')).toBeVisible();
        await expect(page.getByTestId('talent-branch-TIME')).toHaveClass(/no-art/);
        await expect(page.getByTestId('talent-branch-TIME')).toHaveCSS('background-color', 'rgb(244, 230, 200)');
        await expect(page.getByTestId('talent-branch-TIME')).toHaveCSS('border-top-color', 'rgb(90, 61, 38)');
        await expect(page.getByTestId('talent-title')).toHaveClass(/no-art/);
        await expect(page.getByTestId('talent-title')).toHaveCSS('background-color', 'rgb(244, 230, 200)');
        await expect(page.getByTestId('talent-points').locator('.talent-round-art')).toHaveCount(0);
        await expect(page.getByTestId('talent-points').locator('.talent-pill')).toHaveCSS('background-color', 'rgba(28, 18, 12, 0.85)');
        await expect(page.locator('.hero-close-art')).toHaveCount(0);
        await expect(page.getByTestId('hero-close')).toHaveText('Fechar');
        await expect(page.getByTestId('hero-close')).toBeVisible();

        await select(page, 'CLICK_DAMAGE');
        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();

        await expect(page.getByTestId('talent-level-CLICK_DAMAGE')).toHaveText('Nível 1/10');
    });

    test('with every art file present the tree draws the art', async ({ page }) => {
        await startGame(page, { art: 'present' });
        await openTalents(page);

        //  The picture has loaded, so no error handler is still to run
        await expect.poll(() => page.locator('.talent-tree-image').evaluate((image) => image.naturalWidth)).toBe(1);
        await expect(page.getByTestId('talent-tree')).not.toHaveClass(/is-fallback/);
        await expect(page.getByTestId('talent-tree-veins')).toBeHidden();
        await expect(page.locator('.talent-node.no-frame')).toHaveCount(0);
        await expect(page.locator('.talent-node-frame')).toHaveCount(28);
        await expect(page.locator('.hero-close-art')).toBeVisible();
        expect(await size(page.getByTestId('hero-close'))).toEqual([ 120, 40 ]);
        await expect(page.getByTestId('hero-close').locator('.hero-close-text')).toHaveText('Fechar');
        await expect(page.getByTestId('hero-close').locator('.hero-close-text')).toBeVisible();
        expect(await size(page.getByTestId('talent-points').locator('.talent-round-art'))).toEqual([ 56, 56 ]);
        await expect(page.getByTestId('talent-title').locator('.talent-plaque-art')).toBeVisible();
        await expect(page.getByTestId('talent-title')).not.toHaveClass(/no-art/);
    });
});

test.describe('Talentos tree: phones and desktops', () => {
    test('on a 390 x 844 phone the tree is zoomed twice, opens centred and keeps the scroll', async ({ page }) => {
        await startGame(page, { art: 'missing', viewport: { width: 390, height: 844 } });
        await openTalents(page);

        const scroll = page.getByTestId('talent-tree-scroll');
        const read = (property) => scroll.evaluate((node, name) => node[name], property);

        await expect(page.getByTestId('talent-tree')).toHaveCSS('zoom', '2');
        expect(await read('scrollWidth')).toBe(2048);
        expect(await read('scrollHeight')).toBe(1152);
        expect(await read('scrollLeft')).toBe(512);
        expect(await read('scrollTop')).toBe(288);

        //  A node in view is selected: the scroll the player chose stays
        await scroll.evaluate((node) => { node.scrollLeft = 200; });
        await select(page, 'CLICK_DAMAGE');

        await expect(page.getByTestId('talent-detail-name')).toHaveText('Dano de clique (%)');
        expect(await read('scrollLeft')).toBe(200);
        expect(await read('scrollTop')).toBe(288);
        expect((await page.getByTestId('talent-points').evaluate((node) => node.offsetLeft))).toBe(12);
        expect((await size(page.getByTestId('talent-detail')))[0]).toBe(380);
    });

    test('on the desktop the tree is not zoomed and does not scroll', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await expect(page.getByTestId('talent-tree')).toHaveCSS('zoom', '1');

        const metrics = await page.getByTestId('talent-tree-scroll').evaluate((node) => [ node.scrollWidth, node.clientWidth ]);

        expect(metrics).toEqual([ 1024, 1024 ]);
    });
});

test.describe('Talentos tree: an older backend and failures', () => {
    test('a talent list of an older backend draws its nodes and no error', async ({ page }) => {
        const errors = [];

        page.on('pageerror', (error) => errors.push(error.message));
        await startGame(page, {
            art: 'missing',
            routes: (target) => target.route('**/api/talents', (route) => (route.request().method() === 'GET' ? route.fulfill({ json: olderBackendTalents() }) : route.fallback()))
        });
        await openTalents(page);

        await expect(page.locator('.talent-node')).toHaveCount(21);
        await expect(page.getByTestId('talent-BOSS_TIME')).toHaveCount(0);
        await expect(page.getByTestId('talent-CRIT_RESIST_BREAK')).toHaveCount(0);
        await expect(page.getByTestId('talent-BOSS_DAMAGE')).toHaveCount(0);
        await expect(page.getByTestId('talent-COMBO_FURY')).toHaveCount(0);
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toBeVisible();
        expect(errors).toEqual([]);
    });

    test('says Pontos de talento insuficientes when the backend refuses for points', async ({ page }) => {
        await startGame(page, {
            art: 'missing',
            points: 1,
            routes: (target) => target.route('**/api/talents/CLICK_DAMAGE/upgrade', (route) => route.fulfill(problem(409, 'NOT_ENOUGH_TALENT_POINTS')))
        });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');
        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();

        await expect(page.locator('.hero-error')).toHaveText('Pontos de talento insuficientes');
        await expect(page.locator('.hero-error')).toBeVisible();

        //  The message is drawn over the tree, not under it
        const over = await page.locator('.hero-error').evaluate((node) =>
        {
            const box = node.getBoundingClientRect();
            const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);

            return node.contains(top);
        });

        expect(over).toBe(true);
    });

    test('says Não foi possível melhorar o talento. and reads the tree again after another 409', async ({ page }) => {
        await startGame(page, {
            art: 'missing',
            points: 1,
            routes: (target) => target.route('**/api/talents/CLICK_DAMAGE/upgrade', (route) => route.fulfill(problem(409, 'TALENT_LEVEL_MISMATCH')))
        });
        await openTalents(page);
        await select(page, 'CLICK_DAMAGE');

        const reads = [];

        page.on('request', (request) => { if (request.method() === 'GET' && new URL(request.url()).pathname === '/api/talents') { reads.push(request.url()); } });
        await page.getByTestId('talent-upgrade-CLICK_DAMAGE').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível melhorar o talento.');
        await expect.poll(() => reads.length).toBe(1);
    });

    test('says Não foi possível reiniciar os talentos. when the reset fails', async ({ page }) => {
        await startGame(page, {
            art: 'missing',
            talents: { CLICK_DAMAGE: 1 },
            routes: (target) => target.route('**/api/talents/reset', (route) => route.fulfill(problem(500, 'INTERNAL')))
        });
        await openTalents(page);
        await expect(page.getByTestId('talent-reset')).toBeEnabled();
        await page.getByTestId('talent-reset').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível reiniciar os talentos.');
    });

    test('says Talentos indisponíveis when the tree cannot load', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await page.route('**/api/talents', (route) => route.fulfill(problem(500, 'INTERNAL')));
        await page.getByTestId('hud-talents').click();

        await expect(page.getByTestId('talents-unavailable')).toBeVisible();
        await expect(page.getByTestId('talents-unavailable')).toHaveText('Talentos indisponíveis');
    });
});
