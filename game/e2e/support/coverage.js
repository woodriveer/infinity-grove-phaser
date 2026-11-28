//  The Playwright `test` and `expect` of every spec. During `npm run test:e2e:coverage` (VITE_COVERAGE=true) the dev server instruments
//  the game, and after each test the page's window.__coverage__ is written to E2E_COVERAGE_DIR for nyc to merge. A page reloaded inside a
//  test loses what it counted before the reload, so the e2e number is a lower bound.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test as base } from '@playwright/test';
import { STORY_SCENES } from '../../src/domain/story/storyCatalog.js';

const collecting = process.env.VITE_COVERAGE === 'true';
const SEEN = JSON.stringify(STORY_SCENES.map((scene) => scene.id));

export const test = base.extend({
    //  Every spec starts with every catalog scene seen (spec story-scenes D23), so a chapter 1 battle opens on the fight;
    //  the story specs turn it off with test.use({ storySeen: false }). A value the test wrote itself is kept.
    storySeen: [ true, { option: true } ],
    page: async ({ page, storySeen }, use, testInfo) => {
        if (storySeen) {
            await page.addInitScript((seen) => {
                if (localStorage.getItem('infinity-grove.story-seen') === null) {
                    localStorage.setItem('infinity-grove.story-seen', seen);
                }
            }, SEEN);
        }

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
