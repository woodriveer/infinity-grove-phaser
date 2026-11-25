import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The chains on their painted boughs, the smaller nodes and Fúria crescente after its chain (spec talent-tree-branches: P1 Branches, P1 Sizes, P2 Fúria and the
//  Edge Cases). Every test routes every `talent-*` file as missing (404) or present (a valid 1 x 1 picture), so the art on disk never changes the result (L-051).
//  Positions are read in board px (1024 x 576) from the `talent-tree` rect, so the 1280 x 720 desktop project (the canvas scaled) measures the same board.
const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const artMissing = (page) => page.route('**/assets/talent-*', (route) => route.fulfill({ status: 404, body: '' }));
const artPresent = (page) => page.route('**/assets/talent-*', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));

const CHAPTER_ARMOR = { element: 'FIRE', physicalDefense: 20, magicalDefense: 0, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: CHAPTER_ARMOR,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: CHAPTER_ARMOR, miniboss: CHAPTER_ARMOR } ]
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

//  The board px (1024 x 576) of the centre of every `.talent-node`, by test id (for example `talent-CLICK_DAMAGE`)
const centres = (page) => page.evaluate(() =>
{
    const tree = document.querySelector('[data-testid="talent-tree"]').getBoundingClientRect();

    return Object.fromEntries([ ...document.querySelectorAll('.talent-node') ].map((node) =>
    {
        const box = node.getBoundingClientRect();

        return [ node.dataset.testid, { x: (box.x + box.width / 2 - tree.x) * (1024 / tree.width), y: (box.y + box.height / 2 - tree.y) * (576 / tree.height) } ];
    }));
});

//  The trunk fork (50 %, 58 %) of the board in board px
const FORK = { x: 512, y: 334.08 };
const distance = (centre) => Math.hypot(centre.x - FORK.x, centre.y - FORK.y);

const CHAINS = [ 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE', 'COMBO' ];
const grades = (id) => [ `talent-${id}`, `talent-${id}_G2`, `talent-${id}_G3` ];
const near = (actual, expected) => ({ x: Math.abs(actual.x - expected[0]) <= 1, y: Math.abs(actual.y - expected[1]) <= 1 });

//  The 27 graded talents of the backend catalog in the shape of GET /talents, without Fúria crescente: the list of an older backend
const BRANCH_OF = {
    MINIBOSS_TIME: 'TIME', BOSS_DAMAGE: 'TIME', PHYSICAL_BREAK: 'BREAK', ARMOR_PIERCE: 'BREAK', CLICK_DAMAGE: 'POWER', CLICK_FLAT_DAMAGE: 'POWER', CRIT_CHANCE: 'POWER',
    CRIT_DAMAGE: 'POWER', COMBO: 'COMBO'
};
const withoutFury = () => ({
    talents: [ 1, 2, 3 ].flatMap((grade) => CHAINS.map((baseId) => ({
        id: grade === 1 ? baseId : `${baseId}_G${grade}`, baseId, grade, branch: BRANCH_OF[baseId], label: baseId, unit: '%', perLevel: grade, maxLevel: 10, level: 0, value: 0,
        nextCost: grade, unlocked: grade === 1, requiredId: grade === 1 ? null : `${baseId}${grade === 2 ? '' : '_G2'}`, requiredLevel: grade === 1 ? null : 10
    }))),
    points: { earned: 0, spent: 0, available: 0 }
});

test.describe('Talentos branches: where the chains sit', () => {
    test('centres the nodes on the painted boughs', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const at = await centres(page);
        const expected = {
            'talent-CLICK_DAMAGE': [ 542.72, 285.12 ],
            'talent-MINIBOSS_TIME': [ 445.44, 334.08 ],
            'talent-COMBO_FURY': [ 778.24, 357.12 ],
            'talent-ARMOR_PIERCE_G3': [ 389.12, 63.36 ],
            'talent-CRIT_DAMAGE_G3': [ 855.04, 46.08 ],
            'talent-COMBO_G3': [ 880.64, 241.92 ]
        };

        expect(Object.keys(at)).toHaveLength(28);

        for (const [ id, point ] of Object.entries(expected))
        {
            expect({ id, ...near(at[id], point) }).toEqual({ id, x: true, y: true });
        }
    });

    test('every chain climbs away from the trunk fork, grade 1 nearest and grade 3 farthest', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const at = await centres(page);

        for (const id of CHAINS)
        {
            const [ first, second, third ] = grades(id).map((testId) => distance(at[testId]));

            expect({ id, grows: first < second && second < third }).toEqual({ id, grows: true });
        }

        //  The values of the design for Dano de clique (%): 57.8, 133.4 and 209.6 px
        expect(distance(at['talent-CLICK_DAMAGE'])).toBeCloseTo(57.8, 0);
        expect(distance(at['talent-CLICK_DAMAGE_G2'])).toBeCloseTo(133.4, 0);
        expect(distance(at['talent-CLICK_DAMAGE_G3'])).toBeCloseTo(209.6, 0);
    });

    test('TIME and BREAK grow left of the trunk, POWER and COMBO right of it', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const at = await centres(page);
        const branch = (name) => page.locator(`.talent-node[data-branch="${name}"]`).evaluateAll((nodes) => nodes.map((node) => node.dataset.testid));

        const left = [ ...await branch('TIME'), ...await branch('BREAK') ];
        const right = [ ...await branch('POWER'), ...await branch('COMBO') ];

        expect(left).toHaveLength(12);
        expect(right).toHaveLength(16);
        expect(left.filter((id) => at[id].x >= 512)).toEqual([]);
        expect(right.filter((id) => at[id].x <= 512)).toEqual([]);

        //  BREAK and POWER grade 3 climb high (y below 25 % = 144 px); TIME and COMBO grade 1 sit low by the trunk base (y above 55 % = 316.8 px)
        const high = [ 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].map((id) => `talent-${id}_G3`);

        expect(high.filter((id) => at[id].y >= 144)).toEqual([]);
        expect([ 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'COMBO' ].filter((id) => at[`talent-${id}`].y <= 316.8)).toEqual([]);
    });

    test('no node, caption or banner touches another or a fixed part of the screen', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const report = await page.evaluate(() =>
        {
            const rect = (node) => node.getBoundingClientRect();
            const touching = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
            const name = (node) => node.dataset.testid ?? node.className;
            const nodes = [ ...document.querySelectorAll('.talent-node') ];
            const captions = [ ...document.querySelectorAll('.talent-node-caption') ];
            const banners = [ ...document.querySelectorAll('.talent-banner') ];
            const fixed = [ 'talent-title', 'hero-close', 'talent-detail', 'talent-points', 'talent-reset' ].map((id) => document.querySelector(`[data-testid="${id}"]`));
            const tree = rect(document.querySelector('[data-testid="talent-tree"]'));
            const pairs = [];
            const hit = (a, others) => others.filter((other) => other !== a && touching(rect(a), rect(other))).forEach((other) => pairs.push(`${name(a)} ${name(other)}`));

            nodes.forEach((node) => hit(node, nodes));
            captions.forEach((caption) =>
            {
                const own = caption.closest('.talent-node');

                hit(caption, [ ...nodes.filter((node) => node !== own), ...captions, ...banners, ...fixed ]);
            });
            [ ...nodes, ...banners ].forEach((node) => hit(node, fixed));
            nodes.forEach((node) => hit(node, banners));

            const outside = [ ...nodes, ...captions, ...banners ].filter((node) =>
            {
                const box = rect(node);

                return box.left < tree.left || box.right > tree.right || box.top < tree.top || box.bottom > tree.bottom;
            }).map(name);

            return { counts: [ nodes.length, captions.length, banners.length, fixed.filter(Boolean).length ], pairs, outside };
        });

        expect(report.counts).toEqual([ 28, 10, 4, 5 ]);
        expect(report.pairs).toEqual([]);
        expect(report.outside).toEqual([]);
    });

    test('a click at the centre of every node lands on that node', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const covered = await page.evaluate(() => [ ...document.querySelectorAll('.talent-node') ].filter((node) =>
        {
            const box = node.getBoundingClientRect();
            const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);

            return top?.closest('.talent-node') !== node;
        }).map((node) => node.dataset.testid));

        expect(covered).toEqual([]);

        for (const [ id, name ] of [ [ 'COMBO_FURY', 'Fúria crescente' ], [ 'ARMOR_PIERCE_G3', 'Perfuração de armadura (Grau 3)' ], [ 'CRIT_DAMAGE_G3', 'Dano crítico (Grau 3)' ] ])
        {
            const box = await page.getByTestId(`talent-${id}`).boundingBox();

            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            await expect(page.getByTestId('talent-detail-name')).toHaveText(name);
            await expect(page.getByTestId(`talent-${id}`)).toHaveAttribute('aria-pressed', 'true');
        }
    });
});

test.describe('Talentos branches: banners, lit veins and fallback veins', () => {
    test('the banners sit on their foliage', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const banners = await page.evaluate(() =>
        {
            const tree = document.querySelector('[data-testid="talent-tree"]').getBoundingClientRect();

            return Object.fromEntries([ 'TIME', 'BREAK', 'POWER', 'COMBO' ].map((branch) =>
            {
                const box = document.querySelector(`[data-testid="talent-branch-${branch}"]`).getBoundingClientRect();

                return [ branch, { x: (box.x + box.width / 2 - tree.x) * (1024 / tree.width), y: (box.y + box.height / 2 - tree.y) * (576 / tree.height) } ];
            }));
        });
        const expected = { TIME: [ 138.24, 172.8 ], BREAK: [ 245.76, 34.56 ], POWER: [ 680.96, 20.16 ], COMBO: [ 901.12, 334.08 ] };

        for (const [ branch, point ] of Object.entries(expected))
        {
            expect({ branch, ...near(banners[branch], point) }).toEqual({ branch, x: true, y: true });
            expect(await size(page.getByTestId(`talent-branch-${branch}`))).toEqual([ 140, 34 ]);
        }
    });

    test('the lit veins follow the new paths', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const ellipse = (branch) => page.getByTestId(`talent-lit-${branch}`).evaluate((node) => [ '--cx', '--cy', '--rx', '--ry' ].map((name) => node.style.getPropertyValue(name)));

        expect(await ellipse('TIME')).toEqual([ '29%', '52%', '18%', '17%' ]);
        expect(await ellipse('BREAK')).toEqual([ '38%', '27%', '14%', '21%' ]);
        expect(await ellipse('POWER')).toEqual([ '68%', '28%', '19%', '24%' ]);
        expect(await ellipse('COMBO')).toEqual([ '71%', '58%', '18%', '17%' ]);
    });

    test('with the art missing 11 dashed veins follow the chains and reach Fúria crescente from Limite de dano do combo', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        await expect(page.getByTestId('talent-tree-veins')).toBeVisible();

        const points = await page.getByTestId('talent-tree-veins').locator('polyline').evaluateAll((lines) => lines.map((line) => line.getAttribute('points')));

        expect(points).toEqual([
            '50,100 50,58',
            '50,58 43.5,58 33,43.5 20,40',
            '50,58 35.5,60.5 28.5,55 16.5,52.5',
            '50,58 40.5,40.5 34.5,29 28,18',
            '50,58 47,33 43,22 38,11',
            '50,58 53,49.5 55.5,37 58,24.5',
            '50,58 61.5,44 64,31.5 66.5,19',
            '50,58 70,38.5 72.5,26 75,13.5',
            '50,58 78.5,33 81,20.5 83.5,8',
            '50,58 60,61 69.5,56 86,42',
            '60,61 76,62'
        ]);
    });
});

test.describe('Talentos branches: node sizes', () => {
    test('nodes are 44 px with 28 px icons and Fúria crescente 56 px with a 36 px icon', async ({ page }) => {
        await startGame(page, { art: 'present' });
        await openTalents(page);

        expect(await size(page.getByTestId('talent-CLICK_DAMAGE'))).toEqual([ 44, 44 ]);
        expect(await size(page.getByTestId('talent-CLICK_DAMAGE').locator('.talent-node-icon'))).toEqual([ 28, 28 ]);
        expect(await size(page.getByTestId('talent-COMBO_FURY'))).toEqual([ 56, 56 ]);
        expect(await size(page.getByTestId('talent-COMBO_FURY').locator('.talent-node-icon'))).toEqual([ 36, 36 ]);

        //  Every other node is 44 px: only Fúria crescente is large
        const sizes = await page.locator('.talent-node:not(.is-large)').evaluateAll((nodes) => nodes.map((node) => `${node.offsetWidth}x${node.offsetHeight}`));

        expect(sizes).toHaveLength(27);
        expect(sizes.filter((value) => value !== '44x44')).toEqual([]);
    });

    test('the marks shrink with the nodes', async ({ page }) => {
        await startGame(page, { art: 'present', talents: { CLICK_DAMAGE: 10 }, points: 1 });
        await openTalents(page);

        const badge = page.getByTestId('talent-node-grade-CLICK_DAMAGE_G2');
        const seal = (id, property) => page.getByTestId(`talent-${id}`).evaluate((node, name) => getComputedStyle(node, '::after').getPropertyValue(name), property);

        expect(await size(badge)).toEqual([ 18, 18 ]);
        await expect(badge).toHaveCSS('font-size', '10px');
        await expect(badge).toHaveCSS('top', '-4px');
        await expect(badge).toHaveCSS('right', '-4px');

        //  The seal of a maxed (star) and of an available (plus) node
        await expect(page.getByTestId('talent-CLICK_DAMAGE')).toHaveAttribute('data-state', 'maxed');
        await expect(page.getByTestId('talent-CRIT_CHANCE')).toHaveAttribute('data-state', 'available');

        for (const id of [ 'CLICK_DAMAGE', 'CRIT_CHANCE' ])
        {
            expect(await seal(id, 'width')).toBe('18px');
            expect(await seal(id, 'height')).toBe('18px');
            expect(await seal(id, 'top')).toBe('-6px');
            expect(await seal(id, 'left')).toBe('-6px');
        }

        expect(await seal('CLICK_DAMAGE', 'font-size')).toBe('11px');
        expect(await seal('CRIT_CHANCE', 'font-size')).toBe('14px');

        //  The lock of a locked node
        const lock = page.getByTestId('talent-CLICK_DAMAGE_G3');

        await expect(lock).toHaveAttribute('data-state', 'locked');
        expect(await size(lock.locator('.talent-node-lock'))).toEqual([ 20, 20 ]);
        await expect(lock.locator('.talent-node-lock')).toHaveCSS('top', '-7px');
        await expect(lock.locator('.talent-node-lock')).toHaveCSS('left', '-7px');
        await expect(lock.locator('.talent-node-lock')).toHaveCSS('font-size', '12px');

        //  The chip and the caption keep their size
        await expect(page.getByTestId('talent-node-level-CLICK_DAMAGE')).toHaveCSS('font-size', '11px');
        expect((await size(page.getByTestId('talent-caption-CLICK_DAMAGE')))[0]).toBe(80);
        await expect(page.getByTestId('talent-caption-CLICK_DAMAGE')).toHaveCSS('font-size', '12px');
    });
});

test.describe('Talentos branches: Fúria crescente', () => {
    test('Fúria crescente comes after the chain that opens it', async ({ page }) => {
        await startGame(page, { art: 'missing' });
        await openTalents(page);

        const at = await centres(page);

        expect(distance(at['talent-COMBO_FURY'])).toBeGreaterThan(distance(at['talent-COMBO']));
        expect(distance(at['talent-COMBO_FURY'])).toBeCloseTo(267.2, 0);
        expect(distance(at['talent-COMBO'])).toBeCloseTo(103.8, 0);

        const order = await page.locator('.talent-node[data-branch="COMBO"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid));

        expect(order).toEqual([ 'talent-COMBO', 'talent-COMBO_G2', 'talent-COMBO_G3', 'talent-COMBO_FURY' ]);

        await page.getByTestId('talent-COMBO_G3').focus();
        await page.keyboard.press('Tab');
        await expect(page.getByTestId('talent-COMBO_FURY')).toBeFocused();
    });

    test('Fúria crescente stays locked until Limite de dano do combo reaches level 10', async ({ page, browser }) => {
        await startGame(page, { art: 'missing', talents: { COMBO: 9 }, points: 2 });
        await openTalents(page);

        await expect(page.getByTestId('talent-COMBO_FURY')).toHaveAttribute('data-state', 'locked');
        await select(page, 'COMBO_FURY');
        await expect(page.getByTestId('talent-locked-COMBO_FURY')).toHaveText('Bloqueado: chegue ao nível 10 de Limite de dano do combo');

        //  A second start of the game, with its own context, with COMBO at level 10 and the 2 points of the first level
        const context = await browser.newContext();
        const other = await context.newPage();

        await startGame(other, { art: 'missing', talents: { COMBO: 10 }, points: 2 });
        await openTalents(other);

        await expect(other.getByTestId('talent-COMBO_FURY')).toHaveAttribute('data-state', 'available');
        await context.close();
    });
});

test.describe('Talentos branches: an older backend', () => {
    test('a talent list without Fúria crescente draws 27 nodes and the same 11 veins', async ({ page }) => {
        const errors = [];

        page.on('pageerror', (error) => errors.push(error.message));
        await startGame(page, {
            art: 'missing',
            routes: (target) => target.route('**/api/talents', (route) => (route.request().method() === 'GET' ? route.fulfill({ json: withoutFury() }) : route.fallback()))
        });
        await openTalents(page);

        await expect(page.locator('.talent-node')).toHaveCount(27);
        await expect(page.getByTestId('talent-COMBO_FURY')).toHaveCount(0);
        await expect(page.getByTestId('talent-COMBO')).toBeVisible();
        await expect(page.getByTestId('talent-tree-veins').locator('polyline')).toHaveCount(11);
        expect(errors).toEqual([]);
    });
});
