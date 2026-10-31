import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Monsters of 1000 health, no defense and the element of Kael (fire), so a Kael hit is neutral and can be read exactly
const bare = (element) => ({ element, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });

const chapter = (monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster } ]
});

//  Logs in as yan, whose bag is `copies` and whose leader is Kael; resolves with the menu and the fake backend
const startAs = async (page, { copies }) => {
    const backend = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(bare('FIRE')),
        cards: { yan: { leader: 'kael', copies } }
    });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('leader-card')).toContainText('Kael');
    await expect.poll(() => health(page)).toBe(1000);

    return { ...menu, backend };
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const colorOf = (locator, property) => locator.evaluate((node, name) => getComputedStyle(node)[name], property);

test.describe('Hero ascension', () => {
    test('three 3-star Kael cards fuse into a 4-star Kael with Corte Dimensional at level 2', async ({ page }) => {
        await startAs(page, { copies: { 'kael:3': 3 } });
        await page.getByTestId('hud-fusion').click();

        await expect(page.getByTestId('fusion-row-kael-3').locator('.fusion-name')).toHaveText('Kael Raizférrea 3★ → 4★');
        await expect(page.getByTestId('fusion-row-kael-3').locator('.fusion-copies')).toHaveText('3/3');

        //  A reload would drop this marker: the fusion must update the screens in place
        await page.evaluate(() => { window.__ascensionMarker = 'kept'; });
        await page.getByTestId('fusion-button-kael-3').click();

        await expect(page.getByTestId('fusion-result')).toHaveText('Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2');
        await page.getByTestId('hero-close').click();
        await expect(page.getByTestId('skill-level-1')).toHaveText('Nv. 2');
        await expect(page.getByTestId('skill-level-1')).toHaveAttribute('data-level', '2');
        await expect(page.getByTestId('skill-level-2')).toHaveCount(0);
        await expect(page.getByTestId('skill-level-3')).toHaveCount(0);
        expect(await page.evaluate(() => window.__ascensionMarker)).toBe('kept');
    });

    test('three 8-star Kael cards fuse into a 9-star Kael with every skill at level 3', async ({ page }) => {
        await startAs(page, { copies: { 'kael:8': 3 } });
        await page.getByTestId('hud-fusion').click();

        await expect(page.getByTestId('fusion-row-kael-8').locator('.fusion-name')).toHaveText('Kael Raizférrea 8★ → 9★');
        await expect(page.getByTestId('fusion-button-kael-8')).toHaveText('Fundir');
        await page.getByTestId('fusion-button-kael-8').click();

        await expect(page.getByTestId('fusion-result')).toHaveText('Nova carta: Kael Raizférrea 9★ · Brado Aterrador no nível 3');
        await page.getByTestId('hero-close').click();
        await expect(page.getByTestId('skill-level-1')).toHaveText('Nv. 3');
        await expect(page.getByTestId('skill-level-2')).toHaveText('Nv. 3');
        await expect(page.getByTestId('skill-level-3')).toHaveText('Nv. 3');
        expect(await colorOf(page.getByTestId('skill-level-3'), 'backgroundColor')).toBe('rgb(217, 165, 33)');
    });

    test('a 3-star leader shows no level badge', async ({ page }) => {
        await startAs(page, { copies: { 'kael:3': 1 } });

        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'true');
        await expect(page.locator('.skill-level-badge')).toHaveCount(0);
    });

    // waits for T9
    test.fixme('a 4-star Kael\'s Corte Dimensional deals 31.875 (level 2 x 1.25 x the 1.7 click damage)', async ({ page }) => {
        await startAs(page, { copies: { 'kael:4': 1 } });

        await page.keyboard.press('1');

        await expect.poll(() => health(page)).toBeCloseTo(968.125, 5);
    });

    // waits for T9
    test.fixme('a 9-star Kael\'s Corte Dimensional deals 72 (level 3 x 1.5 x the 3.2 click damage)', async ({ page }) => {
        await startAs(page, { copies: { 'kael:9': 1 } });

        await page.keyboard.press('1');

        await expect.poll(() => health(page)).toBeCloseTo(928, 5);
    });

    test('a 9-star Kael clicks for 3.2 (the 220 % star bonus)', async ({ page }) => {
        const menu = await startAs(page, { copies: { 'kael:9': 1 } });

        await menu.canvas.click();

        await expect.poll(() => health(page)).toBeCloseTo(996.8, 5);
    });

    test('the attribute panel of a 4-star leader reads 1.7, 45% and x2.75', async ({ page }) => {
        await startAs(page, { copies: { 'kael:4': 1 } });
        await page.getByTestId('hud-equipment').click();

        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 1.7');
        await expect(page.getByTestId('stat-critChance')).toHaveText('Chance de crítico: 45%');
        await expect(page.getByTestId('stat-critDamage')).toHaveText('Dano crítico: x2.75');
    });

    test('the attribute panel of a 9-star leader reads 3.2, 70% and x4', async ({ page }) => {
        await startAs(page, { copies: { 'kael:9': 1 } });
        await page.getByTestId('hud-equipment').click();

        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 3.2');
        await expect(page.getByTestId('stat-critChance')).toHaveText('Chance de crítico: 70%');
        await expect(page.getByTestId('stat-critDamage')).toHaveText('Dano crítico: x4');
    });

    test('a 5-star hero shows purple stars, levels 2, 2 and 1 and its star power', async ({ page }) => {
        await startAs(page, { copies: { 'kael:5': 1 } });
        await page.getByTestId('hud-heroes').click();

        const stars = page.getByTestId('hero-card-kael').locator('.hero-stars');

        await expect(stars).toHaveText('5★');
        await expect(stars).toHaveClass(/is-ascended/);
        expect(await colorOf(stars, 'color')).toBe('rgb(122, 63, 160)');

        await page.getByTestId('hero-card-kael').click();

        await expect(page.getByTestId('skill-row-1').locator('.skill-level')).toHaveText('Nível 2 · +25% de poder');
        await expect(page.getByTestId('skill-row-2').locator('.skill-level')).toHaveText('Nível 2 · +25% de poder');
        await expect(page.getByTestId('skill-row-3').locator('.skill-level')).toHaveText('Nível 1');
        await expect(page.getByTestId('hero-star-power')).toHaveText('Poder das estrelas: +100% de dano de clique, +40 de chance de crítico, +100% de dano crítico');

        await page.getByTestId('hero-close').click();
        await expect(page.getByTestId('skill-level-1')).toHaveText('Nv. 2');
        await expect(page.getByTestId('skill-level-2')).toHaveText('Nv. 2');
        await expect(page.getByTestId('skill-level-3')).toHaveCount(0);
    });

    test('an 8-star hero shows gold stars and levels 3, 3 and 2', async ({ page }) => {
        await startAs(page, { copies: { 'kael:8': 1 } });
        await page.getByTestId('hud-heroes').click();

        const stars = page.getByTestId('hero-card-kael').locator('.hero-stars');

        await expect(stars).toHaveText('8★');
        await expect(stars).toHaveClass(/is-exalted/);
        expect(await colorOf(stars, 'backgroundColor')).toBe('rgb(217, 165, 33)');
        expect(await colorOf(stars, 'color')).toBe('rgb(32, 30, 29)');

        await page.getByTestId('hero-card-kael').click();

        await expect(page.getByTestId('skill-row-1').locator('.skill-level')).toHaveText('Nível 3 · +50% de poder');
        await expect(page.getByTestId('skill-row-2').locator('.skill-level')).toHaveText('Nível 3 · +50% de poder');
        await expect(page.getByTestId('skill-row-3').locator('.skill-level')).toHaveText('Nível 2 · +25% de poder');
    });

    test('a 1-star hero shows Nível 1 on its unlocked skill and no level on the locked ones', async ({ page }) => {
        await startAs(page, { copies: { 'kael:1': 1 } });
        await page.getByTestId('hud-heroes').click();
        await page.getByTestId('hero-card-kael').click();

        await expect(page.getByTestId('skill-row-1').locator('.skill-level')).toHaveText('Nível 1');
        await expect(page.getByTestId('skill-row-2').locator('.skill-level')).toHaveCount(0);
        await expect(page.getByTestId('skill-row-3').locator('.skill-level')).toHaveCount(0);
        await expect(page.getByTestId('hero-star-power')).toHaveText('Poder das estrelas: +10% de dano de clique');
    });

    test('a 9-star bag entry cannot be fused', async ({ page }) => {
        await startAs(page, { copies: { 'kael:9': 1 } });
        await page.getByTestId('hud-bag').click();

        await expect(page.getByTestId('bag-entry-kael-9')).toContainText('Kael Raizférrea 9★');
        await expect(page.getByTestId('bag-entry-kael-9')).toContainText('x1');
        await page.getByTestId('bag-entry-kael-9').click();

        await expect(page.getByTestId('bag-entry-detail').locator('.bag-needed')).toHaveText('Estrela máxima: não pode ser fundida');
        await expect(page.getByTestId('bag-go-fusion')).toHaveCount(0);
    });

    test('a 3-star bag entry with 3 copies leads to the fusion', async ({ page }) => {
        await startAs(page, { copies: { 'kael:3': 3 } });
        await page.getByTestId('hud-bag').click();
        await page.getByTestId('bag-entry-kael-3').click();

        await expect(page.getByTestId('bag-entry-detail')).toContainText('Para fundir: 3/3');
        await page.getByTestId('bag-go-fusion').click();

        await expect(page.getByTestId('fusion-row-kael-3')).toHaveClass(/is-selected/);
    });

    test('a failed 4-star fusion shows the error and keeps the row', async ({ page }) => {
        const { backend } = await startAs(page, { copies: { 'kael:4': 3 } });
        await page.getByTestId('hud-fusion').click();
        await expect(page.getByTestId('fusion-button-kael-4')).toBeVisible();

        //  The backend lost two cards (another tab fused them) since the screen loaded
        backend.cardsOf('yan').copies['kael:4'] = 1;
        await page.getByTestId('fusion-button-kael-4').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível fundir as cartas.');
        await expect(page.getByTestId('fusion-row-kael-4').locator('.fusion-copies')).toHaveText('3/3');
        await expect(page.getByTestId('fusion-result')).toHaveCount(0);
    });

    test('the level badge sits on the top right corner of the slot art', async ({ page }) => {
        await startAs(page, { copies: { 'kael:4': 1 } });

        const badge = await page.getByTestId('skill-level-1').boundingBox();
        const art = await page.getByTestId('skill-slot-1').locator('img').boundingBox();

        expect(Math.abs(art.x + art.width - (badge.x + badge.width))).toBeLessThanOrEqual(8);
        expect(Math.abs(badge.y - art.y)).toBeLessThanOrEqual(8);
    });
});
