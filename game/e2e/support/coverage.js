//  The Playwright `test` and `expect` of every spec. During `npm run test:e2e:coverage` (VITE_COVERAGE=true) the dev server instruments
//  the game, and after each test the page's window.__coverage__ is written to E2E_COVERAGE_DIR for nyc to merge. A page reloaded inside a
//  test loses what it counted before the reload, so the e2e number is a lower bound.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test as base } from '@playwright/test';

const collecting = process.env.VITE_COVERAGE === 'true';

export const test = base.extend({
    page: async ({ page }, use, testInfo) => {
        await use(page);

        if (!collecting) { return; }

        const coverage = await page.evaluate(() => window.__coverage__ ?? null).catch(() => null);

        if (coverage) {
            const dir = process.env.E2E_COVERAGE_DIR ?? '.nyc_output';

            mkdirSync(dir, { recursive: true });
            writeFileSync(join(dir, `${testInfo.testId}.json`), JSON.stringify(coverage));
        }
    }
});

export { expect };
