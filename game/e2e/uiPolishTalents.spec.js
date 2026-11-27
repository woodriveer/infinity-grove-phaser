import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The Talentos screen changes in place and its buttons never dim while a request runs (spec ui-polish, UIP-06 and UIP-07). The elements the player sees are marked in the page
//  before an action; after it the same elements must still be there (`===`) and the MutationObserver must have seen no image leave the screen.
const ARMORED = { element: 'FIRE', defense: 20, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};

//  `talents` are the starting levels and `points` the unspent talent points on top of them
const startGame = async (page, { talents, points = 0, ...options } = {}) => {
    const fake = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: CHAPTER,
        ...(talents && { talents: { yan: talents } }),
        ...(points > 0 && { talentPoints: { yan: points } }),
        ...options
    });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText(/yan/);
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return { menu, fake };
};

const openTalents = async (page) => {
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
};

const pick = async (page, id) => {
    await page.getByTestId(`talent-${id}`).click();
    await expect(page.getByTestId(`talent-level-${id}`)).toBeVisible();
};

//  Stores the elements of the screen in the page and counts every image removed from it from now on
const mark = (page) => page.evaluate(() => {
    const screen = document.querySelector('[data-testid="talent-screen"]');
    const find = (id) => document.querySelector(`[data-testid="${id}"]`);
    const imagesIn = (node) => (node.nodeName === 'IMG' ? 1 : node.querySelectorAll?.('img').length ?? 0);

    window.__marks = {
        board: screen.querySelector('.talent-tree-image'),
        node: find('talent-COMBO'),
        card: find('talent-detail'),
        icon: find('talent-detail-icon')?.querySelector('img') ?? null
    };
    window.__removedImages = 0;
    window.__observer?.disconnect();
    window.__observer = new MutationObserver((records) => records.forEach((record) => record.removedNodes.forEach((node) => {
        window.__removedImages += imagesIn(node);
    })));
    window.__observer.observe(screen, { childList: true, subtree: true });

    return { board: window.__marks.board !== null, card: window.__marks.card !== null, icon: window.__marks.icon !== null };
});

//  Whether each marked element is still the one on the screen
const same = (page) => page.evaluate(() => {
    const screen = document.querySelector('[data-testid="talent-screen"]');
    const find = (id) => document.querySelector(`[data-testid="${id}"]`);

    return {
        board: screen.querySelector('.talent-tree-image') === window.__marks.board,
        node: find('talent-COMBO') === window.__marks.node,
        card: find('talent-detail') === window.__marks.card,
        icon: (find('talent-detail-icon')?.querySelector('img') ?? null) === window.__marks.icon
    };
});

const removedImages = (page) => page.evaluate(() => window.__removedImages);

//  The opacity of the lit veins of each branch (0 without a level, else 0.2 + 0.8 x levels / max levels of the branch)
const litOpacities = (page) => page.evaluate(() => Object.fromEntries(
    [ ...document.querySelectorAll('[data-testid^="talent-lit-"]') ].map((node) => [ node.dataset.branch, node.style.opacity ])));
const ALL_SAME = { board: true, node: true, card: true, icon: true };

//  Every one of the 28 nodes and its frame, to prove none was rebuilt
const markNodes = (page) => page.evaluate(() => {
    window.__nodes = [ ...document.querySelectorAll('[data-testid^="talent-"].talent-node') ];

    return window.__nodes.length;
});

const nodesSame = (page) => page.evaluate(() => window.__nodes.every((node, index) =>
    document.querySelectorAll('[data-testid^="talent-"].talent-node')[index] === node));

test.describe('Talentos in place (UIP-06)', () => {
    test('a level bought keeps the board, the nodes, the card and its icon, and removes no image', async ({ page }) => {
        await startGame(page, { points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        expect(await mark(page)).toEqual({ board: true, card: true, icon: true });
        expect(await markNodes(page)).toBe(28);

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');

        expect(await same(page)).toEqual(ALL_SAME);
        expect(await nodesSame(page)).toBe(true);
        expect(await removedImages(page)).toBe(0);
    });

    test('the answer shows the values a fresh open shows', async ({ page }) => {
        await startGame(page, { points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');
        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');

        const values = async () => {
            await expect(page.getByTestId('talent-node-level-COMBO')).toHaveText('1/10');
            await expect(page.getByTestId('talent-COMBO')).toHaveAttribute('data-state', 'available');
            await expect(page.getByTestId('talent-COMBO')).toHaveAttribute('aria-label', 'Limite de dano do combo, nível 1 de 10');
            await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 1');
            await expect(page.getByTestId('talent-effect-COMBO')).toHaveText('Efeito: +5%');
            await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveText('Melhorar (1 ponto)');
            await expect(page.getByTestId('talent-upgrade-COMBO')).toBeEnabled();
            await expect(page.getByTestId('talent-reset')).toBeEnabled();
        };

        await values();

        //  COMBO holds 1 level of the 34 of its branch (3 grades of 10 and Fúria crescente 4): 0.2 + 0.8 x 1 / 34, two decimals; the other branches are dark
        const lit = { TIME: '0', BREAK: '0', POWER: '0', COMBO: '0.22' };

        expect(await litOpacities(page)).toEqual(lit);

        await page.getByTestId('hero-close').click();
        await openTalents(page);
        await pick(page, 'COMBO');

        await values();
        expect(await litOpacities(page)).toEqual(lit);
    });

    test('choosing another node replaces only the card', async ({ page }) => {
        await startGame(page, { points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');
        await mark(page);
        await markNodes(page);

        const images = await page.getByTestId('talent-detail').locator('img').count();

        await pick(page, 'CLICK_DAMAGE');

        expect(await same(page)).toEqual({ board: true, node: true, card: false, icon: false });
        expect(await nodesSame(page)).toBe(true);
        expect(await removedImages(page)).toBe(images);
    });

    test('clicking the selected node again keeps the card', async ({ page }) => {
        await startGame(page, { points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');
        await mark(page);

        await page.getByTestId('talent-COMBO').click();
        await expect(page.getByTestId('talent-level-COMBO')).toBeVisible();

        expect((await same(page)).card).toBe(true);
        expect(await removedImages(page)).toBe(0);
    });

    test('Reiniciar pontos keeps the board and locks the grades again', async ({ page }) => {
        await startGame(page, { talents: { COMBO: 10, COMBO_G2: 1 } });
        await openTalents(page);
        await pick(page, 'COMBO');
        await mark(page);
        await markNodes(page);

        await page.getByTestId('talent-reset').click();
        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 12');

        expect((await same(page)).board).toBe(true);
        expect((await same(page)).node).toBe(true);
        expect(await nodesSame(page)).toBe(true);
        await expect(page.getByTestId('talent-COMBO_G2')).toHaveAttribute('data-state', 'locked');
        await expect(page.getByTestId('talent-COMBO_G2').locator('.talent-node-lock')).toHaveCount(1);
        await expect(page.getByTestId('talent-reset')).toBeDisabled();
        expect(await litOpacities(page)).toEqual({ TIME: '0', BREAK: '0', POWER: '0', COMBO: '0' });
    });

    test('a node that opens loses its lock and keeps its art', async ({ page }) => {
        await startGame(page, { talents: { COMBO: 9 }, points: 1 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const next = page.getByTestId('talent-COMBO_G2');

        await expect(next.locator('.talent-node-lock')).toHaveCount(1);
        await page.evaluate(() => {
            const node = document.querySelector('[data-testid="talent-COMBO_G2"]');

            window.__art = [ node.querySelector('.talent-node-frame'), node.querySelector('.talent-node-icon') ];
        });

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-max-COMBO')).toBeVisible();

        await expect(next.locator('.talent-node-lock')).toHaveCount(0);
        await expect(next).toHaveAttribute('data-state', 'open');
        expect(await page.evaluate(() => {
            const node = document.querySelector('[data-testid="talent-COMBO_G2"]');

            return [ node.querySelector('.talent-node-frame') === window.__art[0], node.querySelector('.talent-node-icon') === window.__art[1] ];
        })).toEqual([ true, true ]);
    });

    test('the button becoming Nível máximo replaces only the action', async ({ page }) => {
        await startGame(page, { talents: { COMBO: 9 }, points: 1 });
        await openTalents(page);
        await pick(page, 'COMBO');
        await page.evaluate(() => {
            const find = (id) => document.querySelector(`[data-testid="${id}"]`);

            window.__kept = [ find('talent-detail-name'), find('talent-level-COMBO'), find('talent-detail-icon') ];
        });

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-max-COMBO')).toHaveText('Nível máximo');

        expect(await page.evaluate(() => {
            const find = (id) => document.querySelector(`[data-testid="${id}"]`);

            return [ find('talent-detail-name') === window.__kept[0], find('talent-level-COMBO') === window.__kept[1], find('talent-detail-icon') === window.__kept[2] ];
        })).toEqual([ true, true, true ]);
    });

    test('points paid while Talentos is open keep the board', async ({ page }) => {
        const { fake } = await startGame(page);
        await openTalents(page);
        await pick(page, 'COMBO');
        await mark(page);
        await markNodes(page);

        fake.grantTalentPoints('yan', 3);
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.showTalentPoints());

        await expect(page.getByTestId('talent-points')).toHaveText('Pontos de talento: 3');
        expect(await same(page)).toEqual(ALL_SAME);
        expect(await nodesSame(page)).toBe(true);
        expect(await removedImages(page)).toBe(0);
    });

    test('a refused upgrade keeps the board and says why', async ({ page }) => {
        const { fake } = await startGame(page, { points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');
        await mark(page);
        await markNodes(page);

        fake.failNextTalentRequest({ status: 409, code: 'NOT_ENOUGH_TALENT_POINTS' });
        await page.getByTestId('talent-upgrade-COMBO').click();

        await expect(page.locator('.hero-error')).toHaveText('Pontos de talento insuficientes');
        expect((await same(page)).board).toBe(true);
        expect((await same(page)).node).toBe(true);
        expect(await nodesSame(page)).toBe(true);
    });

    test('closing Talentos while a request runs and opening it again builds the screen afresh, and the late answer changes only the collection', async ({ page }) => {
        const { fake } = await startGame(page, { talents: { COMBO: 1 }, points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const release = fake.holdTalents();

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveAttribute('aria-disabled', 'true');
        await page.getByTestId('hero-close').click();
        await openTalents(page);

        await expect(page.getByTestId('talent-detail-empty')).toHaveText('Escolha um talento na árvore para ver os detalhes.');
        //  The request still runs, so the new screen is built with both buttons waiting (UIP-07 AC 1)
        await expect(page.getByTestId('talent-reset')).toHaveAttribute('aria-disabled', 'true');
        await mark(page);
        release();

        const available = () => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.talents.points().available);

        await expect.poll(available).toBe(1);

        //  The screen that was open when the answer landed is the one built before it: the answer changed no element of it
        await expect(page.getByTestId('talent-detail-empty')).toBeVisible();
        await expect(page.getByTestId('talent-node-level-COMBO')).toHaveText('1/10');
        expect((await same(page)).board).toBe(true);
        expect(await removedImages(page)).toBe(0);
    });

    //  FIX TASK F1 (tasks.md § Author check): HeroUi.upgradeTalent repaints only when its `view` is still the current one, so a screen opened while the request ran keeps
    //  both buttons aria-disabled "true" after the answer. UIP-07 AC 3 says both give aria-disabled "false" when the request ends. Remove `test.fail` once F1 is done.
    test.fail('a screen opened while a request ran gives both buttons aria-disabled false when the request ends (UIP-07 AC 3)', async ({ page }) => {
        const { fake } = await startGame(page, { talents: { COMBO: 1 }, points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const release = fake.holdTalents();

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveAttribute('aria-disabled', 'true');
        await page.getByTestId('hero-close').click();
        await openTalents(page);
        await pick(page, 'COMBO');
        release();

        const available = () => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.talents.points().available);

        await expect.poll(available).toBe(1);

        await expect(page.getByTestId('talent-reset')).toHaveAttribute('aria-disabled', 'false', { timeout: 2000 });
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveAttribute('aria-disabled', 'false', { timeout: 2000 });
    });

    test('opening Talentos again starts with no node selected', async ({ page }) => {
        await startGame(page, { points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');
        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');

        await page.getByTestId('hero-close').click();
        await openTalents(page);

        await expect(page.getByTestId('talent-detail-empty')).toHaveText('Escolha um talento na árvore para ver os detalhes.');
    });
});

test.describe('No dimming (UIP-07)', () => {
    const buttonsRunning = async (page) => {
        for (const id of [ 'talent-upgrade-COMBO', 'talent-reset' ])
        {
            const button = page.getByTestId(id);

            await expect(button).toHaveAttribute('aria-disabled', 'true');
            await expect(button).toHaveCSS('opacity', '1');
            await expect(button).toHaveCSS('cursor', 'progress');
        }
    };

    test('while a level request runs both buttons keep their look and say wait', async ({ page }) => {
        const { fake } = await startGame(page, { talents: { COMBO: 1 }, points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const release = fake.holdTalents();

        await page.getByTestId('talent-upgrade-COMBO').click();

        await buttonsRunning(page);
        release();
    });

    test('clicks while it runs send nothing', async ({ page }) => {
        const { fake } = await startGame(page, { talents: { COMBO: 1 }, points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const release = fake.holdTalents();

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveAttribute('aria-disabled', 'true');
        await page.getByTestId('talent-upgrade-COMBO').click({ force: true });
        await page.getByTestId('talent-reset').click({ force: true });

        //  The first request reaches the backend, the two clicks after it add none
        await expect.poll(() => fake.talentUpgrades().length).toBe(1);
        await page.waitForTimeout(300);

        expect(fake.talentUpgrades()).toHaveLength(1);
        expect(fake.talentResets()).toBe(0);
        release();
    });

    test('after the answer the buttons take clicks again', async ({ page }) => {
        const { fake } = await startGame(page, { talents: { COMBO: 1 }, points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const release = fake.holdTalents();

        await page.getByTestId('talent-upgrade-COMBO').click();
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveAttribute('aria-disabled', 'true');
        release();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 2/10');
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveAttribute('aria-disabled', 'false');
        await expect(page.getByTestId('talent-reset')).toHaveAttribute('aria-disabled', 'false');
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveCSS('cursor', 'pointer');
    });

    test('while Reiniciar pontos runs both buttons keep their look', async ({ page }) => {
        const { fake } = await startGame(page, { talents: { COMBO: 1 }, points: 2 });
        await openTalents(page);
        await pick(page, 'COMBO');

        const release = fake.holdTalents();

        await page.getByTestId('talent-reset').click();

        await buttonsRunning(page);
        release();
    });

    test('the card button dims only when the points do not pay a level', async ({ page }) => {
        await startGame(page);
        await openTalents(page);
        await pick(page, 'COMBO');

        await expect(page.getByTestId('talent-upgrade-COMBO')).toBeDisabled();
        await expect(page.getByTestId('talent-upgrade-COMBO')).toHaveCSS('opacity', '0.45');
    });
});
