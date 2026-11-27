import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Shift buys the most levels the points pay (spec ui-polish, UIP-09 to UIP-11): the button text and ring while Shift is held, the exact body of the request and the tree it answers,
//  the Shift mode that follows the key, the window and the pointer, and the hint on the button.
const ARMORED = { element: 'FIRE', defense: 20, critResistance: 0 };
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: ARMORED,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster: ARMORED, miniboss: ARMORED } ]
};
const GOLD_RING = 'rgb(224, 180, 90) 0px 0px 0px 2px';

//  `talents` are the starting levels and `points` the unspent talent points on top of them; the selected talent is opened on its card
const startGame = async (page, { talents, points = 0, select, ...options } = {}) => {
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

    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();

    if (select)
    {
        await pick(page, select);
    }

    return { menu, fake, button: page.getByTestId(`talent-upgrade-${select}`) };
};

const pick = async (page, id) => {
    await page.getByTestId(`talent-${id}`).click();
    await expect(page.getByTestId('talent-detail-name')).toBeVisible();
};

const points = (page) => page.getByTestId('talent-points');

test.describe('Shift buys the most (UIP-09)', () => {
    test('E1: Shift shows Melhorar até o nível 5 (5 pontos) with the gold ring', async ({ page }) => {
        const { button } = await startGame(page, { points: 5, select: 'COMBO' });

        await expect(button).toHaveText('Melhorar (1 ponto)');
        await page.keyboard.down('Shift');

        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await expect(button).toHaveAttribute('data-max', 'true');
        await expect(button).toHaveCSS('box-shadow', GOLD_RING);
    });

    test('E1: releasing Shift brings back Melhorar (1 ponto) on the same button', async ({ page }) => {
        const { button } = await startGame(page, { points: 5, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await button.evaluate((node) => { window.__button = node; });

        await page.keyboard.up('Shift');

        await expect(button).toHaveText('Melhorar (1 ponto)');
        await expect(button).toHaveAttribute('data-max', 'false');
        await expect(button).toHaveCSS('box-shadow', 'none');
        expect(await button.evaluate((node) => node === window.__button)).toBe(true);
    });

    test('E1: a Shift click buys 5 levels with one request', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 5, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await button.click();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 5/10');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO', body: { fromLevel: 0, levels: 5 } } ]);
        await expect(page.getByTestId('talent-effect-COMBO')).toHaveText('Efeito: +25%');
        await expect(points(page)).toHaveText('Pontos de talento: 0');
        await expect(button).toBeDisabled();
        //  Shift is still held and the points pay no level: the text is the normal one with the cost of one level (Edge 3)
        await expect(button).toHaveText('Melhorar (1 ponto)');
    });

    test('a click with the Shift modifier buys the same', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 5, select: 'COMBO' });

        await button.click({ modifiers: [ 'Shift' ] });

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 5/10');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO', body: { fromLevel: 0, levels: 5 } } ]);
    });

    test('E2: the top level stops the purchase', async ({ page }) => {
        const { fake, button } = await startGame(page, { talents: { CLICK_DAMAGE: 7 }, points: 20, select: 'CLICK_DAMAGE' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 10 (3 pontos)');
        await button.click();

        await expect(page.getByTestId('talent-max-CLICK_DAMAGE')).toHaveText('Nível máximo');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'CLICK_DAMAGE', body: { fromLevel: 7, levels: 3 } } ]);
        await expect(points(page)).toHaveText('Pontos de talento: 17');
    });

    test('E3: a grade 2 talent buys 2 levels for 4', async ({ page }) => {
        const { fake, button } = await startGame(page, { talents: { COMBO: 10 }, points: 5, select: 'COMBO_G2' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 2 (4 pontos)');
        await button.click();

        await expect(page.getByTestId('talent-level-COMBO_G2')).toHaveText('Nível 2/10');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO_G2', body: { fromLevel: 0, levels: 2 } } ]);
        await expect(points(page)).toHaveText('Pontos de talento: 1');
        await expect(button).toBeDisabled();
    });

    test('E4: no affordable level keeps Melhorar (2 pontos), disabled, without the ring', async ({ page }) => {
        const { button } = await startGame(page, { talents: { COMBO: 10 }, points: 1, select: 'COMBO_G2' });

        await page.keyboard.down('Shift');
        //  The mode is on once the key event reached the page: the next pointer move proves it without changing the text
        await page.mouse.move(5, 5);

        await expect(button).toHaveText('Melhorar (2 pontos)');
        await expect(button).toBeDisabled();
        await expect(button).toHaveAttribute('data-max', 'false');
        await expect(button).toHaveCSS('box-shadow', 'none');
    });

    test('E5: one affordable level sends only fromLevel', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 1, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 1 (1 ponto)');
        await button.click();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO', body: { fromLevel: 0 } } ]);
        await expect(points(page)).toHaveText('Pontos de talento: 0');
    });

    test('E6: Fúria crescente buys its 4 levels', async ({ page }) => {
        const { fake, button } = await startGame(page, { talents: { COMBO: 10 }, points: 9, select: 'COMBO_FURY' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 4 (8 pontos)');
        await button.click();

        await expect(page.getByTestId('talent-max-COMBO_FURY')).toHaveText('Nível máximo');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO_FURY', body: { fromLevel: 0, levels: 4 } } ]);
        await expect(points(page)).toHaveText('Pontos de talento: 1');
    });

    test('E7: the longest text fits on one line', async ({ page }) => {
        const { button } = await startGame(page, { talents: { CLICK_DAMAGE: 10, CLICK_DAMAGE_G2: 10 }, points: 30, select: 'CLICK_DAMAGE_G3' });

        await expect(button).toHaveText('Melhorar (3 pontos)');

        const heightBefore = await button.evaluate((node) => node.getBoundingClientRect().height);

        await page.keyboard.down('Shift');

        await expect(button).toHaveText('Melhorar até o nível 10 (30 pontos)');
        expect(await button.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
        expect(await button.evaluate((node) => node.getBoundingClientRect().height)).toBe(heightBefore);
    });

    test('a click without Shift buys one level', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 5, select: 'COMBO' });

        await button.click();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO', body: { fromLevel: 0 } } ]);
    });

    test('a backend without levels buys one level and shows no error', async ({ page }) => {
        const { button } = await startGame(page, { points: 5, select: 'COMBO', talentLevels: false });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await button.click();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');
        await expect(points(page)).toHaveText('Pontos de talento: 4');
        await expect(page.locator('.hero-error')).toBeHidden();
    });

    test('a refused Shift purchase says why', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 5, select: 'COMBO' });

        fake.failNextTalentRequest({ status: 409, code: 'NOT_ENOUGH_TALENT_POINTS' });
        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await button.click();

        await expect(page.locator('.hero-error')).toHaveText('Pontos de talento insuficientes');
    });

    test('a second Shift click while the request runs sends nothing', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 5, select: 'COMBO' });
        const release = fake.holdTalents();

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await button.click();
        await expect(button).toHaveAttribute('aria-disabled', 'true');
        await button.click({ force: true });

        expect(fake.talentUpgrades()).toHaveLength(1);
        release();
        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 5/10');
    });

    test('Shift keeps the lock text and Nível máximo', async ({ page }) => {
        await startGame(page, { talents: { COMBO: 5, CLICK_DAMAGE: 10 }, points: 5, select: 'COMBO_G2' });

        await page.keyboard.down('Shift');
        await page.mouse.move(5, 5);

        await expect(page.getByTestId('talent-locked-COMBO_G2')).toBeVisible();
        await expect(page.getByTestId('talent-upgrade-COMBO_G2')).toHaveCount(0);

        await pick(page, 'CLICK_DAMAGE');

        await expect(page.getByTestId('talent-max-CLICK_DAMAGE')).toHaveText('Nível máximo');
    });
});

test.describe('The Shift mode (UIP-10)', () => {
    test('leaving the window ends the Shift mode', async ({ page }) => {
        const { fake, button } = await startGame(page, { points: 5, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');

        await page.evaluate(() => window.dispatchEvent(new Event('blur')));

        await expect(button).toHaveText('Melhorar (1 ponto)');

        //  The Playwright keyboard still holds Shift: release it so the plain click carries no Shift key
        await page.keyboard.up('Shift');
        await button.click();

        await expect(page.getByTestId('talent-level-COMBO')).toHaveText('Nível 1/10');
        expect(fake.talentUpgrades()).toStrictEqual([ { id: 'COMBO', body: { fromLevel: 0 } } ]);
    });

    test('a hidden tab ends the Shift mode', async ({ page }) => {
        const { button } = await startGame(page, { points: 5, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');

        await page.evaluate(() => {
            Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });

        await expect(button).toHaveText('Melhorar (1 ponto)');
    });

    test('a pointer move with Shift turns it on', async ({ page }) => {
        const { button } = await startGame(page, { points: 5, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        await page.keyboard.up('Shift');
        await expect(button).toHaveText('Melhorar (1 ponto)');

        await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointermove', { shiftKey: true })));

        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');
    });

    test('Shift held, choosing another talent shows its Shift text', async ({ page }) => {
        await startGame(page, { points: 5, select: 'COMBO' });

        await page.keyboard.down('Shift');
        await pick(page, 'CLICK_DAMAGE');

        await expect(page.getByTestId('talent-upgrade-CLICK_DAMAGE')).toHaveText('Melhorar até o nível 5 (5 pontos)');
    });
});

test.describe('The hint (UIP-11)', () => {
    test('the button carries Segure Shift para melhorar até o máximo with and without Shift', async ({ page }) => {
        const { button } = await startGame(page, { points: 5, select: 'COMBO' });

        await expect(button).toHaveAttribute('title', 'Segure Shift para melhorar até o máximo');

        await page.keyboard.down('Shift');
        await expect(button).toHaveText('Melhorar até o nível 5 (5 pontos)');

        await expect(button).toHaveAttribute('title', 'Segure Shift para melhorar até o máximo');
    });
});
