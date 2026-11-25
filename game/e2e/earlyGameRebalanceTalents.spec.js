import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The flat and critical talents of the early game rebalance (spec early-game-rebalance, Talent Change): Dano direto de clique gives 1 a level, Chance de crítico
//  5 points and Dano crítico 15 %, each times its grade. The leader is a blank Kael (fire) against a fire monster with no defense, so a number is read as the change of
//  the monster's health. The fake backend answers `value = level x perLevel x grade` like `TalentDefinition.valueAt`.
const MONSTER_HEALTH = 1000;
const monsterOf = (critResistance = 0) => ({ element: 'FIRE', defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance });

const chapter = (monster) => ({
    bossHealth: MONSTER_HEALTH,
    bossTimeLimitMs: 90_000,
    boss: monster,
    stages: Array.from({ length: 10 }, (_, index) => ({
        number: index + 1, phasesPerStage: 8, monsterHealth: MONSTER_HEALTH, minibossHealth: MONSTER_HEALTH, minibossTimeLimitMs: 45_000, monster, miniboss: monster
    }))
});

const startGame = async (page, { talents, talentPoints, critResistance = 0 } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monsterOf(critResistance)),
        ...(talents && { talents: { yan: talents } }),
        ...(talentPoints && { talentPoints: { yan: talentPoints } })
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await expect.poll(() => health(page)).toBe(MONSTER_HEALTH);

    return menu;
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const dealt = async (page) => MONSTER_HEALTH - await health(page);

const openTalents = async (page) => {
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
};

const effectOf = async (page, id) => {
    await page.getByTestId(`talent-${id}`).click();

    return page.getByTestId(`talent-effect-${id}`);
};

test.describe('Dano direto de clique', () => {
    test('the card of Dano direto de clique at level 10 reads +10 de dano', async ({ page }) => {
        await startGame(page, { talents: { CLICK_FLAT_DAMAGE: 10 } });
        await openTalents(page);

        await expect(await effectOf(page, 'CLICK_FLAT_DAMAGE')).toHaveText('Efeito: +10 de dano');
    });

    test('grade 2 at level 10 reads +20 de dano and grade 3 +30 de dano', async ({ page }) => {
        await startGame(page, { talents: { CLICK_FLAT_DAMAGE: 10, CLICK_FLAT_DAMAGE_G2: 10, CLICK_FLAT_DAMAGE_G3: 10 } });
        await openTalents(page);

        await expect(await effectOf(page, 'CLICK_FLAT_DAMAGE_G2')).toHaveText('Efeito: +20 de dano');
        await expect(await effectOf(page, 'CLICK_FLAT_DAMAGE_G3')).toHaveText('Efeito: +30 de dano');
    });

    test('Kael with Dano direto de clique at 10 deals 11 to a FIRE monster with defense 0 and critical resistance 100', async ({ page }) => {
        const menu = await startGame(page, { talents: { CLICK_FLAT_DAMAGE: 10 }, critResistance: 100 });

        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(11, 5);
    });
});

test.describe('Chance de crítico and Dano crítico', () => {
    test('the card of Chance de crítico at level 10 reads +50 pontos and Dano crítico +150%', async ({ page }) => {
        await startGame(page, { talents: { CRIT_CHANCE: 10, CRIT_DAMAGE: 10 } });
        await openTalents(page);

        await expect(await effectOf(page, 'CRIT_CHANCE')).toHaveText('Efeito: +50 pontos');
        await expect(await effectOf(page, 'CRIT_DAMAGE')).toHaveText('Efeito: +150%');
    });

    test('one level of Chance de crítico moves the chip from Seu crítico: 10% to Seu crítico: 15%', async ({ page }) => {
        await startGame(page, { talentPoints: 1 });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');

        await openTalents(page);
        await page.getByTestId('talent-CRIT_CHANCE').click();
        await page.getByTestId('talent-upgrade-CRIT_CHANCE').click();
        await expect(page.getByTestId('talent-level-CRIT_CHANCE')).toHaveText('Nível 1/10');
        await page.getByTestId('hero-close').click();

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 15%');
    });
});
