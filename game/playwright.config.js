import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

//  The main checkout serves on 5174. A git worktree (agents run in parallel, AD-003 workflow in CLAUDE.md)
//  gets its own port from its path, so its tests never reuse the dev server of another checkout.
//  E2E_PORT overrides both.
const portOf = (dir) =>
{
    if (!/[\\/]\.claude[\\/]worktrees[\\/]/.test(dir)) return 5174;
    let hash = 0;
    for (const char of dir) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return 5200 + (hash % 700);
};
const port = Number(process.env.E2E_PORT) || portOf(fileURLToPath(new URL('.', import.meta.url)));

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
