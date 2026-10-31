import { defineConfig } from '@playwright/test';

const port = 5175;

//  `npm run ui:shots -- bulkSell`: runs ui-review/bulkSell.shots.js on desktop and phone and saves the screenshots of the
//  ui-artist's review into .specs/features/<feature>/ui-review/. These are not tests of the game and never run in the e2e suite.
export default defineConfig({
    testDir: './ui-review',
    testMatch: '**/*.shots.js',
    timeout: 120_000,
    workers: 2,
    reporter: 'list',
    use: { baseURL: `http://localhost:${port}`, browserName: 'chromium' },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1280, height: 720 } } },
        { name: 'phone', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } }
    ],
    webServer: {
        command: `npm run dev -- --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        reuseExistingServer: true,
        timeout: 60_000
    }
});
