import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

const piece = (id, slot, rarity, refine = 0, heroId = null, extra = {}) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CLICK_DAMAGE_PCT', base: 7 } ], heroId, ...extra
});

//  Kael and Lyra are owned; Kael wears a weapon and a ring, Lyra a ring; an epic amulet and a legendary armor wait in the bag
const PIECES = [
    piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('r1', 'RING', 'COMMON', 0, 'kael'), piece('r2', 'RING', 'UNCOMMON', 0, 'lyra'),
    piece('a1', 'AMULET', 'EPIC', 3), piece('m1', 'ARMOR', 'LEGENDARY', 0), piece('c1', 'AMULET', 'COMMON', 0), piece('u1', 'RING', 'UNCOMMON', 0)
];

const startGame = async (page, equipment = PIECES) => {
    await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } }, equipment: { yan: equipment } });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-equipment')).toBeVisible();

    return menu;
};

const openEquipment = async (page) =>
{
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
};

test.describe('Equipment UI', () => {
    test('shows the attributes of the leader and follows the gear', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await expect(page.getByTestId('leader-stats').locator('.leader-stats-title')).toHaveText('Atributos de Kael Raizférrea');
        await expect(page.getByTestId('stat-element')).toHaveText('Elemento: Fogo');
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 4.6');
        await expect(page.getByTestId('stat-critChance')).toHaveText('Chance de crítico: 10%');
        await expect(page.getByTestId('stat-critDamage')).toHaveText('Dano crítico: x2');

        await page.getByTestId('equip-slot-kael-WEAPON').click();
        await page.getByTestId('piece-unequip').click();

        //  The weapon is off; the ring of +7 % stays: 1 x 1.07
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 1.1');
        await expect(page.getByTestId('piece-detail')).toBeVisible();
    });

    test('shows the bag as tiles with a frame per rarity', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await expect(page.getByTestId('equip-piece-c1')).toHaveAttribute('data-gems', '0');
        await expect(page.getByTestId('equip-piece-u1')).toHaveAttribute('data-gems', '1');
        await expect(page.getByTestId('equip-piece-a1')).toHaveAttribute('data-gems', '3');
        await expect(page.getByTestId('equip-piece-m1')).toHaveAttribute('data-gems', '4');
        await expect(page.getByTestId('equip-piece-a1')).toHaveAttribute('data-effect', 'fantasy');
        await expect(page.getByTestId('equip-piece-m1')).not.toHaveAttribute('data-effect', 'fantasy');
        await expect(page.getByTestId('equip-piece-a1').locator('.piece-refine')).toHaveText('+3');
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (4)');
    });

    test('hover shows the tooltip with no button, a click opens the actions', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await page.getByTestId('equip-piece-a1').hover();

        const tooltip = page.getByTestId('piece-tooltip');

        await expect(tooltip).toBeVisible();
        await expect(tooltip.locator('.piece-tooltip-title')).toHaveText('Épico Amuleto +3');
        await expect(tooltip.locator('.piece-tooltip-line').first()).toHaveText('Dano de clique +9%');
        await expect(tooltip.locator('.piece-tooltip-worn')).toHaveText('Na mochila');
        await expect(tooltip.locator('button')).toHaveCount(0);
        await expect(page.getByTestId('piece-sell')).toHaveCount(0);

        const box = await tooltip.boundingBox();
        const panel = await page.locator('.hero-panel').boundingBox();

        expect(box.x).toBeGreaterThanOrEqual(panel.x);
        expect(box.x + box.width).toBeLessThanOrEqual(panel.x + panel.width);

        await page.getByTestId('equip-piece-a1').click();

        await expect(page.getByTestId('piece-detail')).toBeVisible();
        await expect(page.getByTestId('piece-sell')).toBeVisible();
    });

    test('the tooltip of a worn tile names the hero and goes away on leave', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await page.getByTestId('equip-slot-kael-WEAPON').hover();
        await expect(page.getByTestId('piece-tooltip').locator('.piece-tooltip-worn')).toHaveText('Equipado em Kael Raizférrea');

        await page.getByTestId('hero-close').hover();
        await expect(page.getByTestId('piece-tooltip')).toHaveCount(0);
    });

    test('transfers the whole set of Kael to Lyra: pieces under her, Kael empty, her old ring in the bag', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await page.getByTestId('equip-transfer-kael').click();
        await page.getByTestId('equip-transfer-kael-to-lyra').click();

        await expect(page.getByTestId('equip-transfer-notice')).toHaveText('Conjunto transferido para Lyra Folhaveloz');
        await expect(page.getByTestId('equip-slot-lyra-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
        await expect(page.getByTestId('equip-slot-lyra-RING')).toHaveAttribute('aria-label', 'Comum Anel +0');
        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toContainText('vazio');
        await expect(page.getByTestId('equip-slot-kael-RING')).toContainText('vazio');
        await expect(page.getByTestId('equip-piece-r2')).toBeVisible();
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 1.0');
    });
});
