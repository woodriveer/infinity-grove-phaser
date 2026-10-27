import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Monsters of 1000 health so the auto click never kills one while a test watches it
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000 } ]
};

const startGame = async (page, chapter) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER, progress: { yan: { chapter } } });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('chapter-hud')).toHaveText(`Capítulo ${chapter}`);
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

test.describe('Account reset', () => {
    test('in chapter 3 the button offers 3 crystals and Cancelar keeps the chapter', async ({ page }) => {
        await startGame(page, 3);

        await expect(page.getByTestId('reset-account')).toHaveText('Resetar conta (+3 cristais)');
        await page.getByTestId('reset-account').click();
        await expect(page.getByTestId('reset-question')).toContainText('Você ganha 3 cristais.');
        await page.getByTestId('reset-cancel').click();

        await expect(page.getByTestId('reset-dialog')).toBeHidden();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 3');
    });

    test('Resetar brings chapter 1, Cristais: 3, the +3 cristais notice and the auto click switch', async ({ page }) => {
        await startGame(page, 3);
        //  Counts the hits of the pointer: the clicks in the dialog must not reach the canvas
        await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');
            const hit = scene.hitMonster.bind(scene);

            window.__pointerHits = 0;
            scene.hitMonster = (pointer) => { window.__pointerHits += 1; hit(pointer); };
        });

        await page.getByTestId('reset-account').click();
        await page.getByTestId('reset-confirm').click();

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await expect(page.getByTestId('auto-click-crystals')).toHaveText('Cristais: 3');
        await expect(page.getByTestId('card-notice')).toHaveText('+3 cristais');
        await expect(page.getByTestId('reset-dialog')).toBeHidden();
        await expect(page.getByTestId('auto-click-toggle')).toBeVisible();
        await expect(page.getByTestId('reset-account')).toHaveCount(0);
        expect(await page.evaluate(() => window.__pointerHits)).toBe(0);

        const before = await health(page);

        await expect.poll(() => health(page), { timeout: 5000 }).toBeLessThan(before);
    });
});
