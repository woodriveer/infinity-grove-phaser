import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressApi } from './progressApi';
import { createHttpClient } from './httpClient';
import { ApiError } from '../../application/ApiError';

const progress = { chapter: 1, stage: 2, encounter: 'PHASE', phase: 3, completed: false, definition: { bossHealth: 300, bossTimeLimitMs: 60000, stages: [] } };
const position = { chapter: 1, stage: 2, encounter: 'PHASE', phase: 3 };

describe('progressApi', () => {
    describe('over a mocked http client', () => {
        const httpClient = { get: vi.fn(), post: vi.fn() };
        const progressApi = createProgressApi(httpClient);

        beforeEach(() => {
            httpClient.get.mockReset();
            httpClient.post.mockReset();
        });

        it('get calls GET /progress and returns the response body', async () => {
            httpClient.get.mockResolvedValue({ data: progress });

            await expect(progressApi.get()).resolves.toEqual(progress);
            expect(httpClient.get).toHaveBeenCalledWith('/progress');
        });

        it('report posts the position and the outcome to /progress/outcome and returns the response body', async () => {
            httpClient.post.mockResolvedValue({ data: progress });

            await expect(progressApi.report(position, 'CLEARED')).resolves.toEqual(progress);
            expect(httpClient.post).toHaveBeenCalledWith('/progress/outcome', {
                chapter: 1, stage: 2, encounter: 'PHASE', phase: 3, outcome: 'CLEARED'
            });
        });

        it('report sends only the position fields, not extra ones', async () => {
            httpClient.post.mockResolvedValue({ data: progress });

            await progressApi.report({ ...position, label: 'Stage 2/10  Phase 3/5' }, 'FAILED');

            expect(httpClient.post.mock.calls[0][1]).toEqual({ ...position, outcome: 'FAILED' });
        });

        it('passes a rejection through', async () => {
            const error = new ApiError('down');
            httpClient.get.mockRejectedValue(error);

            await expect(progressApi.get()).rejects.toBe(error);
        });
    });

    describe('over the real http client', () => {
        it('a 409 rejects with an ApiError whose body carries the stored progress', async () => {
            const httpClient = createHttpClient({ session: { accessToken: () => 'token', refresh: vi.fn() } });
            httpClient.defaults.adapter = (config) => {
                const response = {
                    status: 409,
                    data: { detail: 'Reported position does not match the stored progress', code: 'PROGRESS_CONFLICT', progress },
                    headers: {},
                    config,
                    request: {}
                };

                return Promise.reject(Object.assign(new Error('status 409'), { config, response, isAxiosError: true }));
            };

            const error = await createProgressApi(httpClient).report(position, 'CLEARED').catch((e) => e);

            expect(error).toBeInstanceOf(ApiError);
            expect(error.status).toBe(409);
            expect(error.code).toBe('PROGRESS_CONFLICT');
            expect(error.body.progress).toEqual(progress);
        });
    });
});
