import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, authClient } from './authApi';
import { httpClient } from './httpClient';
import { ApiError } from './ApiError';

const authResponse = {
    user: { username: 'yan', createdAt: 1, lastLoginAt: 2 },
    accessToken: 'a',
    refreshToken: 'r',
    accessTokenExpiresAt: 10,
    refreshTokenExpiresAt: 20
};

//  Replaces the network; records the requests that reach the adapter.
const fakeAdapter = (status, data) => vi.fn((config) => {
    const response = { status, data, headers: {}, config, request: {} };

    return status >= 200 && status < 300
        ? Promise.resolve(response)
        : Promise.reject(Object.assign(new Error(`status ${status}`), { config, response, isAxiosError: true }));
});

describe('authApi', () => {
    beforeEach(() => {
        authClient.defaults.adapter = fakeAdapter(200, authResponse);
    });

    it('uses its own client with the same defaults as httpClient and no auth request interceptor', () => {
        expect(authClient).not.toBe(httpClient);
        expect(authClient.defaults.baseURL).toBe(httpClient.defaults.baseURL);
        expect(authClient.defaults.timeout).toBe(httpClient.defaults.timeout);
        expect(authClient.defaults.headers['Content-Type']).toBe('application/json');
        expect(authClient.interceptors.request.handlers.filter(Boolean)).toHaveLength(0);
    });

    it('refresh posts the refresh token to /auth/refresh and returns the response data', async () => {
        await expect(authApi.refresh('old-refresh')).resolves.toEqual(authResponse);

        const request = authClient.defaults.adapter.mock.calls[0][0];
        expect(request.method).toBe('post');
        expect(request.url).toBe('/auth/refresh');
        expect(JSON.parse(request.data)).toEqual({ refreshToken: 'old-refresh' });
        expect(request.headers.Authorization).toBeUndefined();
    });

    it('logout posts the refresh token to /auth/logout', async () => {
        authClient.defaults.adapter = fakeAdapter(204, '');

        await authApi.logout('old-refresh');

        const request = authClient.defaults.adapter.mock.calls[0][0];
        expect(request.method).toBe('post');
        expect(request.url).toBe('/auth/logout');
        expect(JSON.parse(request.data)).toEqual({ refreshToken: 'old-refresh' });
    });

    it('rejects a 401 with an ApiError carrying the status and code', async () => {
        authClient.defaults.adapter = fakeAdapter(401, { detail: 'Refresh token is invalid', code: 'AUTH_INVALID_REFRESH_TOKEN' });

        const error = await authApi.refresh('bad').catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 401, code: 'AUTH_INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid' });
        expect(authClient.defaults.adapter).toHaveBeenCalledTimes(1);
    });

    it('rejects a network failure with an ApiError of status 0', async () => {
        authClient.defaults.adapter = (config) =>
            Promise.reject(Object.assign(new Error('Network Error'), { config, request: {}, isAxiosError: true }));

        await expect(authApi.refresh('r')).rejects.toMatchObject({ name: 'ApiError', status: 0, message: 'Cannot reach the server. Try again later.' });
        await expect(authApi.logout('r')).rejects.toMatchObject({ name: 'ApiError', status: 0 });
    });
});
