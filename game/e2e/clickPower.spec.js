import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Monsters of 1000 health, no defense and the element of the leader (neutral), so a click can be read exactly
const ELEMENT_OF = { kael: 'FIRE', lyra: 'NATURE' };
const bare = (element) => ({ element, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });

const chapter = (monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster } ]
});

const startAs = async (page, heroId, { stars = 0, roll } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(bare(ELEMENT_OF[heroId])),
        cards: { yan: { leader: heroId, copies: { [`${heroId}:${stars}`]: 1 } } }
    });

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('leader-card')).toContainText(heroId === 'lyra' ? 'Lyra' : 'Kael');
    await expect.poll(() => health(page)).toBe(1000);

    return menu;
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const dealt = async (page) => 1000 - await health(page);

test.describe('Click power', () => {
    test('a streak of 11 clicks reads Combo x11 · +11% and ends after 1.5 s without a click', async ({ page }) => {
        const menu = await startAs(page, 'kael');

        for (let i = 0; i < 11; i++)
        {
            await menu.canvas.click();
        }

        await expect(page.getByTestId('combo-hud')).toHaveText('Combo x11 · +11%');
        //  1 + 1.01 + ... + 1.10 for the 11 clicks
        expect(await dealt(page)).toBeCloseTo(11 + 0.01 * (0 + 10) * 11 / 2, 5);

        await expect(page.getByTestId('combo-hud')).toHaveText('', { timeout: 4_000 });
    });

    test('a leader with 3 stars clicks for 1.4 (the 40 % star bonus)', async ({ page }) => {
        const menu = await startAs(page, 'kael', { stars: 3 });

        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(1.4, 5);
    });

    test('Lyra on a roll of 0.29 clicks twice, both critical: 4 damage and two numbers', async ({ page }) => {
        const menu = await startAs(page, 'lyra', { roll: 0.29 });

        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(4, 5);
    });

    test('Lyra on a roll of 0.3 clicks once: 1 damage', async ({ page }) => {
        const menu = await startAs(page, 'lyra', { roll: 0.3 });

        await menu.canvas.click();

        expect(await dealt(page)).toBeCloseTo(1, 5);
    });
});
