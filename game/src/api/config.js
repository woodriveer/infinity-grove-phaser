//  Single place where build-time environment variables are read (see .env.* files).
export const config = {
    env: import.meta.env.VITE_APP_ENV ?? 'development',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
    apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000)
};
