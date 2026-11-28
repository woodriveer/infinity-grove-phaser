import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the reset-legacy-drops review (.specs/features/reset-legacy-drops/ui-review/): the legacy line and detail in the auto click window
//  and the three cases of the reset dialog line. The fake backend has no GET /account/legacy, so this file stubs it (and the reset answer, which must
//  carry `legacy`) with page.route; everything else is the fake backend.
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000 } ]
};

const NONE = { chapters: [], best: null, afterReset: { chapter: 3, percent: 50, best: { chapter: 3, percent: 50 } } };
const FULL_5 = { chapters: [ { chapter: 5, percent: 100 } ], best: { chapter: 5, percent: 100 }, afterReset: { chapter: 5, percent: 100, best: { chapter: 5, percent: 100 } } };
const CASE_B = { chapters: [ { chapter: 10, percent: 50 } ], best: { chapter: 10, percent: 50 }, afterReset: { chapter: 5, percent: 50, best: { chapter: 10, percent: 50 } } };
const AFTER = { chapters: [ { chapter: 3, percent: 50 } ], best: { chapter: 3, percent: 50 }, afterReset: { chapter: 1, percent: 50, best: { chapter: 3, percent: 50 } } };

const start = async (page, chapter, legacy, { legacyStatus = 200 } = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: CHAPTER, progress: { yan: { chapter } } });
    await page.route('**/api/account/legacy', (route) => (legacyStatus === 200
        ? route.fulfill({ json: legacy })
        : route.fulfill({ status: legacyStatus, json: { status: legacyStatus, error: 'Not found' } })));
    await page.route('**/api/account/reset', (route) => route.fulfill({
        json: { reward: chapter, crystals: chapter, resets: 1, progress: { chapter: 1, definition: CHAPTER }, legacy }
    }));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect(page.getByTestId('chapter-hud')).toHaveText(`Capítulo ${chapter}`);
    await page.getByTestId('auto-click-button').click();
    await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    await page.waitForFunction(() => [ ...document.images ].every((img) => img.complete && img.naturalWidth > 0));
};

test('01 window with no legacy', async ({ page }, testInfo) => {
    await start(page, 3, NONE);
    await expect(page.getByTestId('legacy-line')).toHaveText('Legado: nenhum');
    await shot(page, testInfo, '01-window-no-legacy');
});

test('02 window with the legacy of chapter 5', async ({ page }, testInfo) => {
    await start(page, 5, FULL_5);
    await expect(page.getByTestId('legacy-line')).toHaveText('Legado: 100% do capítulo 5');
    await shot(page, testInfo, '02-window-legacy-100-ch5');
    await shot(page.getByTestId('auto-click-popover'), testInfo, '02b-window-legacy-popover');
});

test('03 dialog case A', async ({ page }, testInfo) => {
    await start(page, 3, NONE);
    await page.getByTestId('reset-account').click();
    await expect(page.getByTestId('reset-legacy')).toHaveText('Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).');
    await shot(page, testInfo, '03-dialog-case-a-none');
});

test('04 dialog case B', async ({ page }, testInfo) => {
    await start(page, 5, CASE_B);
    await page.getByTestId('reset-account').click();
    await expect(page.getByTestId('reset-legacy')).toContainText('O melhor legado continua 50% do capítulo 10.');
    await shot(page, testInfo, '04-dialog-case-b');
});

test('05 dialog case C', async ({ page }, testInfo) => {
    await start(page, 5, FULL_5);
    await page.getByTestId('reset-account').click();
    await expect(page.getByTestId('reset-legacy')).toContainText('já está em 100%');
    await shot(page, testInfo, '05-dialog-case-c');
});

test('06 window after the reset', async ({ page }, testInfo) => {
    await start(page, 3, AFTER);
    await page.getByTestId('reset-account').click();
    await page.getByTestId('reset-confirm').click();
    await expect(page.getByTestId('reset-dialog')).toBeHidden();
    await page.getByTestId('auto-click-button').click();
    await expect(page.getByTestId('legacy-line')).toHaveText('Legado: 50% do capítulo 3');
    await shot(page, testInfo, '06-window-after-reset');
});

test('07 window with the endpoint down', async ({ page }, testInfo) => {
    await start(page, 3, null, { legacyStatus: 404 });
    await expect(page.getByTestId('legacy-line')).toHaveCount(0);
    await shot(page, testInfo, '07-window-no-endpoint');
});
