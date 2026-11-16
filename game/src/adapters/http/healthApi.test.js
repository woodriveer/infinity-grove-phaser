import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHealthApi, WAKE_TIMEOUT_MS } from './healthApi';

const httpClient = { get: vi.fn() };
const healthApi = createHealthApi(httpClient);

describe('healthApi', () => {
    beforeEach(() => {
        vi.mocked(httpClient.get).mockReset();
    });

    it('wake asks GET /health once, without a token, with a 60 s timeout, and resolves true', async () => {
        vi.mocked(httpClient.get).mockResolvedValue({ data: { status: 'UP', commit: 'x' } });

        await expect(healthApi.wake()).resolves.toBe(true);
        expect(httpClient.get).toHaveBeenCalledTimes(1);
        expect(httpClient.get).toHaveBeenCalledWith('/health', { skipAuth: true, timeout: 60000 });
    });

    it('wake resolves false when the request fails', async () => {
        vi.mocked(httpClient.get).mockRejectedValue(new Error('Network Error'));

        await expect(healthApi.wake()).resolves.toBe(false);
    });

    it('wake resolves false when the backend answers 503', async () => {
        vi.mocked(httpClient.get).mockRejectedValue(Object.assign(new Error('Service Unavailable'), { status: 503 }));

        await expect(healthApi.wake()).resolves.toBe(false);
    });

    it('the wake timeout is 60 s', () => {
        expect(WAKE_TIMEOUT_MS).toBe(60000);
    });
});
