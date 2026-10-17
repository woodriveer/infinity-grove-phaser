import { defineConfig, devices } from '@playwright/test';

const port = 5174;

export default defineConfig({
    testDir: './e2e',
    //  Booting the game takes ~15 s under parallel load; reload scenarios boot it twice
    timeout: 60_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: `http://localhost:${port}`,
        trace: 'on-first-retry'
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    //  The backend is faked per test (e2e/support/fakeBackend.js), so only the game is served.
    webServer: {
        command: `npm run dev -- --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000
    }
});
