import { expect, test } from '@playwright/test';
import { STORY_SCENES } from '../src/domain/story/storyCatalog.js';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the talent-icon-fit patch (.specs/features/talent-icon-fit/ui-review/): the detail panel of every talent with its real art, so a
//  tall picture (Fúria crescente, Tempo do mini chefe, Dano contra chefe) shows whether it stays inside the ring.
const IDS = [ 'COMBO_FURY', 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'CLICK_DAMAGE', 'COMBO', 'CRIT_CHANCE' ];

const start = async (page) => {
    await mockBackend(page, { users: { yan: 'secret123' } });
    await page.addInitScript((seen) => { localStorage.setItem('infinity-grove.auto-click', 'off'); localStorage.setItem('infinity-grove.story-seen', seen); }, JSON.stringify(STORY_SCENES.map((scene) => scene.id)));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-tree')).toBeVisible();
};

test('detail icons stay inside the ring', async ({ page }, testInfo) => {
    await start(page);

    await page.waitForTimeout(600);
    await shot(page.getByTestId('talent-tree'), testInfo, '00-tree');

    for (const [ index, id ] of IDS.entries())
    {
        await page.getByTestId(`talent-${id}`).click();
        await page.waitForTimeout(600);

        const icon = page.getByTestId('talent-detail-icon');
        await shot(icon, testInfo, `${String(index + 1).padStart(2, '0')}-${id.toLowerCase().replaceAll('_', '-')}`);
    }
});
