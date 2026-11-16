import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { shot } from './support/shots';

//  Screenshots of the backend wake-up review (.specs/features/supabase-postgres/ui-review/): the start screen while GET /api/health
//  takes 8 s, then the form. Everything runs on the fake backend; the wake-up answer is the only stubbed route.
const WAKE = 'Acordando o servidor, aguarde...';

//  Chromium's GPU process warns about ReadPixels when a headless screenshot reads the canvas; it is not a page problem (see the other review reports)
const GPU_STALL = /GPU stall due to ReadPixels/;

//  Console, page errors and failed requests of the whole run, printed at the end for the report
const watch = (page) => {
    const problems = [];

    page.on('console', (message) => {
        if ([ 'error', 'warning' ].includes(message.type()) && !GPU_STALL.test(message.text())) {
            problems.push(`console.${message.type()}: ${message.text()}`);
        }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`));
    page.on('response', (response) => {
        if (response.status() >= 400) {
            problems.push(`http ${response.status()}: ${response.url()}`);
        }
    });

    return problems;
};

const report = (testInfo, label, problems) => console.log(`CONSOLE-REPORT ${label} (${testInfo.project.name}): ${problems.length ? problems.join(' | ') : 'clean'}`);

test('start screen while the server wakes up', async ({ page }, testInfo) => {
    const problems = watch(page);

    await mockBackend(page, { healthDelayMs: 8000 });
    await page.goto('/');
    await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));
    await page.locator('#game-container canvas').click();

    await expect(page.getByRole('alert')).toHaveText(WAKE, { timeout: 5000 });
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '01-wake-notice');

    await expect(page.locator('.auth-form')).toBeVisible({ timeout: 15000 });
    await shot(page, testInfo, '02-form-after-wake');
    report(testInfo, 'start screen', problems);
});
