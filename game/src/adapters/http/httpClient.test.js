import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHttpClient } from './httpClient';
import { ApiError } from '../../application/ApiError';

//  The session port the client is built with
const sessionManager = { accessToken: vi.fn(() => null), refresh: vi.fn() };
const httpClient = createHttpClient({ session: sessionManager });

//  Replaces the network with a fake adapter; interceptors and defaults still run.
const respondWith = (status, data) => (config) => {
    const response = { status, data, headers: {}, config, request: {} };

    return status >= 200 && status < 300
        ? Promise.resolve(response)
        : Promise.reject(Object.assign(new Error(`status ${status}`), { config, response, isAxiosError: true }));
};

describe('httpClient', () => {
    it('is configured with JSON content type and the configured base URL', () => {
        expect(httpClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL ?? '/api');
        expect(httpClient.defaults.headers['Content-Type']).toBe('application/json');
        expect(httpClient.defaults.timeout).toBeGreaterThan(0);
    });

    it('rejects failed responses with an ApiError', async () => {
        httpClient.defaults.adapter = respondWith(401, { detail: 'Password is invalid', code: 'LOGIN_INVALID_PASSWORD' });

        await expect(httpClient.post('/users/login', {})).rejects.toMatchObject({
            name: 'ApiError',
            status: 401,
            code: 'LOGIN_INVALID_PASSWORD',
            message: 'Password is invalid'
        });
        await expect(httpClient.post('/users/login', {})).rejects.toBeInstanceOf(ApiError);
    });

    it('rejects with an ApiError when the server is unreachable', async () => {
        httpClient.defaults.adapter = (config) =>
            Promise.reject(Object.assign(new Error('Network Error'), { config, request: {}, isAxiosError: true }));

        await expect(httpClient.get('/users')).rejects.toMatchObject({ status: 0, message: 'Cannot reach the server. Try again later.' });
    });

    it('passes successful responses through untouched', async () => {
        httpClient.defaults.adapter = respondWith(200, { username: 'yan' });

        expect((await httpClient.get('/users/yan')).data).toEqual({ username: 'yan' });
    });
});

describe('httpClient auth interceptors', () => {
    let token;
    let refreshImpl;
    let calls;

    //  Fake backend: 200 when the Bearer matches `validToken`, 401 otherwise.
    const backend = (validToken) => (config) => {
        calls.push({ url: config.url, authorization: config.headers.Authorization });
        const ok = config.headers.Authorization === `Bearer ${validToken}`;
        const status = ok ? 200 : 401;
        const response = { status, data: ok ? { ok: true } : { detail: 'Unauthenticated', code: 'AUTH_UNAUTHENTICATED' }, headers: {}, config, request: {} };

        return ok
            ? Promise.resolve(response)
            : Promise.reject(Object.assign(new Error('status 401'), { config, response, isAxiosError: true }));
    };

    beforeEach(() => {
        token = null;
        calls = [];
        vi.mocked(sessionManager.accessToken).mockImplementation(() => token);
        refreshImpl = vi.fn(async () => {
            token = 'new';
            return 'new';
        });
        vi.mocked(sessionManager.refresh).mockImplementation(refreshImpl);
    });

    it('attaches the Bearer header when a session exists', async () => {
        token = 'abc';
        httpClient.defaults.adapter = backend('abc');

        await httpClient.get('/users');

        expect(calls[0].authorization).toBe('Bearer abc');
    });

    it('sends no Authorization header without a session', async () => {
        httpClient.defaults.adapter = backend('whatever');

        await httpClient.get('/users').catch(() => {});

        expect(calls[0].authorization).toBeUndefined();
        expect(refreshImpl).not.toHaveBeenCalled();
    });

    it('sends no Authorization header on skipAuth requests', async () => {
        token = 'abc';
        httpClient.defaults.adapter = backend('abc');

        await httpClient.post('/users/login', {}, { skipAuth: true }).catch(() => {});

        expect(calls[0].authorization).toBeUndefined();
    });

    it('refreshes once and retries once with the new token on a 401', async () => {
        token = 'old';
        httpClient.defaults.adapter = backend('new');

        const response = await httpClient.get('/users');

        expect(response.data).toEqual({ ok: true });
        expect(refreshImpl).toHaveBeenCalledTimes(1);
        expect(calls.map((c) => c.authorization)).toEqual(['Bearer old', 'Bearer new']);
    });

    it('rejects with an ApiError and does not refresh again when the retry also returns 401', async () => {
        token = 'old';
        httpClient.defaults.adapter = backend('never');

        await expect(httpClient.get('/users')).rejects.toMatchObject({ name: 'ApiError', status: 401, code: 'AUTH_UNAUTHENTICATED' });

        expect(refreshImpl).toHaveBeenCalledTimes(1);
        expect(calls).toHaveLength(2);
    });

    it('rejects with the refresh ApiError when the refresh fails', async () => {
        token = 'old';
        const failure = new ApiError('Refresh token is invalid', { status: 401, code: 'AUTH_INVALID_REFRESH_TOKEN' });
        refreshImpl.mockRejectedValue(failure);
        httpClient.defaults.adapter = backend('new');

        await expect(httpClient.get('/users')).rejects.toBe(failure);

        expect(calls).toHaveLength(1);
    });

    it('rejects with the refresh ApiError when the server is unreachable during refresh', async () => {
        token = 'old';
        const failure = new ApiError('Cannot reach the server. Try again later.');
        refreshImpl.mockRejectedValue(failure);
        httpClient.defaults.adapter = backend('new');

        await expect(httpClient.get('/users')).rejects.toMatchObject({ status: 0, message: 'Cannot reach the server. Try again later.' });
    });

    it('does not refresh on a 401 for a skipAuth request', async () => {
        token = 'abc';
        httpClient.defaults.adapter = backend('never');

        await expect(httpClient.post('/users/login', {}, { skipAuth: true })).rejects.toMatchObject({ status: 401 });

        expect(refreshImpl).not.toHaveBeenCalled();
        expect(calls).toHaveLength(1);
    });

    it('does not refresh on a 401 for a request that carried no Bearer', async () => {
        httpClient.defaults.adapter = backend('never');

        await expect(httpClient.get('/users')).rejects.toMatchObject({ status: 401 });

        expect(refreshImpl).not.toHaveBeenCalled();
    });

    it('does not refresh on non-401 failures', async () => {
        token = 'abc';
        httpClient.defaults.adapter = respondWith(500, { detail: 'boom' });

        await expect(httpClient.get('/users')).rejects.toMatchObject({ status: 500 });

        expect(refreshImpl).not.toHaveBeenCalled();
    });

    it('two concurrent 401s cause one refresh call and both requests are retried', async () => {
        token = 'old';
        httpClient.defaults.adapter = backend('new');
        let release;
        const gate = new Promise((resolve) => { release = resolve; });
        let inFlight = null;
        let refreshRequests = 0;
        //  Single-flight like the real sessionManager.
        refreshImpl.mockImplementation(() => {
            inFlight ??= gate.then(() => {
                refreshRequests += 1;
                token = 'new';
                return 'new';
            });

            return inFlight;
        });

        const first = httpClient.get('/a');
        const second = httpClient.get('/b');
        await new Promise((resolve) => setTimeout(resolve, 0));
        release();
        const results = await Promise.all([first, second]);

        expect(results.map((r) => r.data)).toEqual([{ ok: true }, { ok: true }]);
        expect(refreshRequests).toBe(1);
        expect(calls.filter((c) => c.authorization === 'Bearer new')).toHaveLength(2);
    });

    it('retries without refreshing when the tokens were already rotated since the request was sent', async () => {
        token = 'old';
        httpClient.defaults.adapter = (config) => {
            if (config.url === '/slow') {
                //  The session rotates (another request refreshed) before this 401 comes back.
                token = 'new';
            }

            return backend('new')(config);
        };

        const response = await httpClient.get('/slow');

        expect(response.data).toEqual({ ok: true });
        expect(refreshImpl).not.toHaveBeenCalled();
        expect(calls.map((c) => c.authorization)).toEqual(['Bearer old', 'Bearer new']);
    });
});
