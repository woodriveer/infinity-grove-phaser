import { defineConfig, devices } from '@playwright/test';

const port = 5174;

export default defineConfig({
    testDir: './e2e',
    //  Booting the game takes ~15 s under parallel load; reload scenarios boot it twice
    timeout: 60_000,
    fullyParallel: true,
    //  Every test boots the whole game in a real browser; more than 3 at once starves the boot and flakes unrelated scenarios
    workers: 3,
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
        //  A coverage run needs its own instrumented server, never one already running
        reuseExistingServer: !process.env.CI && process.env.VITE_COVERAGE !== 'true',
        timeout: 60_000
    }
});
