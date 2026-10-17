import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async () => {
    vi.resetModules();
    return (await import('./config')).config;
};

describe('config', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('reads values from the VITE_ environment variables', async () => {
        vi.stubEnv('VITE_APP_ENV', 'staging');
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
        vi.stubEnv('VITE_API_TIMEOUT_MS', '2500');

        expect(await loadConfig()).toEqual({
            env: 'staging',
            apiBaseUrl: 'https://api.example.com',
            apiTimeoutMs: 2500
        });
    });

    it('uses defaults when variables are not set', async () => {
        vi.stubEnv('VITE_APP_ENV', undefined);
        vi.stubEnv('VITE_API_BASE_URL', undefined);
        vi.stubEnv('VITE_API_TIMEOUT_MS', undefined);

        expect(await loadConfig()).toEqual({ env: 'development', apiBaseUrl: '/api', apiTimeoutMs: 10000 });
    });
});
