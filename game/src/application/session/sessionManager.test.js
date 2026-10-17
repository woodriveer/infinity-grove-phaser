import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSessionManager } from './sessionManager';
import { ApiError } from '../ApiError';

const NOW = 1_000_000;
const user = { username: 'yan', createdAt: 1, lastLoginAt: 2 };

const authResponse = (overrides = {}) => ({
    user,
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    accessTokenExpiresAt: NOW + 1000,
    refreshTokenExpiresAt: NOW + 100_000,
    ...overrides
});

//  Fake store port: keeps the session in a variable, maps responses like the real one
const createStore = () => {
    const store = {
        saved: null,
        fromAuthResponse: (response) => ({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            accessTokenExpiresAt: response.accessTokenExpiresAt,
            refreshTokenExpiresAt: response.refreshTokenExpiresAt
        }),
        save: (session) => { store.saved = session; },
        load: () => store.saved,
        clear: () => { store.saved = null; }
    };

    return store;
};

describe('sessionManager', () => {
    let sessionStore;
    let authApi;
    let sessionManager;

    const stored = () => sessionStore.saved;

    beforeEach(() => {
        sessionStore = createStore();
        authApi = { refresh: vi.fn(), logout: vi.fn().mockResolvedValue(undefined) };
        sessionManager = createSessionManager({ store: sessionStore, authGateway: authApi });
    });

    describe('start / accessToken', () => {
        it('accessToken is null without a session', () => {
            expect(sessionManager.accessToken()).toBeNull();
        });

        it('start stores the session and exposes the access token', () => {
            sessionManager.start(authResponse());

            expect(sessionManager.accessToken()).toBe('access-1');
            expect(stored()).toEqual(authResponse());
        });

        it('start keeps only the session fields', () => {
            sessionManager.start({ ...authResponse(), extra: 'x' });

            expect(stored()).not.toHaveProperty('extra');
        });
    });

    describe('restore', () => {
        it('returns active with the stored user and makes no request while the access token is unexpired', async () => {
            sessionStore.save(sessionStore.fromAuthResponse(authResponse()));

            await expect(sessionManager.restore(NOW)).resolves.toEqual({ status: 'active', user });
            expect(authApi.refresh).not.toHaveBeenCalled();
            expect(sessionManager.accessToken()).toBe('access-1');
        });

        it('refreshes once and stores the new tokens when only the access token has expired', async () => {
            sessionStore.save(sessionStore.fromAuthResponse(authResponse({ accessTokenExpiresAt: NOW - 1 })));
            const renewed = authResponse({
                accessToken: 'access-2',
                refreshToken: 'refresh-2',
                accessTokenExpiresAt: NOW + 5000,
                refreshTokenExpiresAt: NOW + 200_000
            });
            vi.mocked(authApi.refresh).mockResolvedValue(renewed);

            await expect(sessionManager.restore(NOW)).resolves.toEqual({ status: 'active', user });

            expect(authApi.refresh).toHaveBeenCalledTimes(1);
            expect(authApi.refresh).toHaveBeenCalledWith('refresh-1');
            expect(stored()).toEqual(renewed);
            expect(sessionManager.accessToken()).toBe('access-2');
        });

        it('treats an access token expiring exactly now as expired', async () => {
            sessionStore.save(sessionStore.fromAuthResponse(authResponse({ accessTokenExpiresAt: NOW })));
            vi.mocked(authApi.refresh).mockResolvedValue(authResponse({ accessToken: 'access-2' }));

            await sessionManager.restore(NOW);

            expect(authApi.refresh).toHaveBeenCalledTimes(1);
        });

        it('returns none, clears storage and makes no request when both tokens have expired', async () => {
            sessionStore.save(sessionStore.fromAuthResponse(authResponse({
                accessTokenExpiresAt: NOW - 10,
                refreshTokenExpiresAt: NOW - 1
            })));

            await expect(sessionManager.restore(NOW)).resolves.toEqual({ status: 'none' });

            expect(authApi.refresh).not.toHaveBeenCalled();
            expect(stored()).toBeNull();
            expect(sessionManager.accessToken()).toBeNull();
        });

        it('returns none when nothing is stored', async () => {
            await expect(sessionManager.restore(NOW)).resolves.toEqual({ status: 'none' });
            expect(authApi.refresh).not.toHaveBeenCalled();
        });

        it('returns none and clears storage when the refresh is rejected with 401', async () => {
            sessionStore.save(sessionStore.fromAuthResponse(authResponse({ accessTokenExpiresAt: NOW - 1 })));
            vi.mocked(authApi.refresh).mockRejectedValue(new ApiError('bad', { status: 401, code: 'AUTH_INVALID_REFRESH_TOKEN' }));

            await expect(sessionManager.restore(NOW)).resolves.toEqual({ status: 'none' });

            expect(stored()).toBeNull();
            expect(sessionManager.accessToken()).toBeNull();
        });

        it('returns offline with the error message and keeps storage when the server is unreachable', async () => {
            const session = sessionStore.fromAuthResponse(authResponse({ accessTokenExpiresAt: NOW - 1 }));
            sessionStore.save(session);
            vi.mocked(authApi.refresh).mockRejectedValue(new ApiError('Cannot reach the server. Try again later.'));

            await expect(sessionManager.restore(NOW)).resolves.toEqual({
                status: 'offline',
                message: 'Cannot reach the server. Try again later.'
            });

            expect(stored()).toEqual(session);
        });

        it('defaults to the current time', async () => {
            sessionStore.save(sessionStore.fromAuthResponse(authResponse({
                accessTokenExpiresAt: Date.now() + 60_000,
                refreshTokenExpiresAt: Date.now() + 120_000
            })));

            await expect(sessionManager.restore()).resolves.toMatchObject({ status: 'active' });
        });
    });

    describe('refresh', () => {
        it('returns the new access token and stores the new pair', async () => {
            sessionManager.start(authResponse());
            vi.mocked(authApi.refresh).mockResolvedValue(authResponse({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

            await expect(sessionManager.refresh()).resolves.toBe('access-2');

            expect(authApi.refresh).toHaveBeenCalledWith('refresh-1');
            expect(stored()).toMatchObject({ accessToken: 'access-2', refreshToken: 'refresh-2' });
        });

        it('shares one request among three concurrent calls', async () => {
            sessionManager.start(authResponse());
            let resolve;
            vi.mocked(authApi.refresh).mockReturnValue(new Promise((r) => { resolve = r; }));

            const calls = [sessionManager.refresh(), sessionManager.refresh(), sessionManager.refresh()];
            resolve(authResponse({ accessToken: 'access-2' }));

            await expect(Promise.all(calls)).resolves.toEqual(['access-2', 'access-2', 'access-2']);
            expect(authApi.refresh).toHaveBeenCalledTimes(1);
        });

        it('starts a new request once the previous one has settled', async () => {
            sessionManager.start(authResponse());
            vi.mocked(authApi.refresh)
                .mockResolvedValueOnce(authResponse({ accessToken: 'access-2', refreshToken: 'refresh-2' }))
                .mockResolvedValueOnce(authResponse({ accessToken: 'access-3', refreshToken: 'refresh-3' }));

            await sessionManager.refresh();
            await expect(sessionManager.refresh()).resolves.toBe('access-3');

            expect(authApi.refresh).toHaveBeenNthCalledWith(2, 'refresh-2');
        });

        it('clears the session and rejects with the ApiError on 401', async () => {
            sessionManager.start(authResponse());
            const error = new ApiError('bad', { status: 401, code: 'AUTH_INVALID_REFRESH_TOKEN' });
            vi.mocked(authApi.refresh).mockRejectedValue(error);

            await expect(sessionManager.refresh()).rejects.toBe(error);

            expect(stored()).toBeNull();
            expect(sessionManager.accessToken()).toBeNull();
        });

        it('keeps the session and rejects with the ApiError on a network failure', async () => {
            sessionManager.start(authResponse());
            const error = new ApiError('Cannot reach the server. Try again later.');
            vi.mocked(authApi.refresh).mockRejectedValue(error);

            await expect(sessionManager.refresh()).rejects.toBe(error);

            expect(stored()).toEqual(authResponse());
            expect(sessionManager.accessToken()).toBe('access-1');
        });

        it('allows a new request after a failed one', async () => {
            sessionManager.start(authResponse());
            vi.mocked(authApi.refresh)
                .mockRejectedValueOnce(new ApiError('down'))
                .mockResolvedValueOnce(authResponse({ accessToken: 'access-2' }));

            await expect(sessionManager.refresh()).rejects.toBeInstanceOf(ApiError);
            await expect(sessionManager.refresh()).resolves.toBe('access-2');
        });

        it('rejects with a 401 ApiError without a request when there is no session', async () => {
            await expect(sessionManager.refresh()).rejects.toMatchObject({ name: 'ApiError', status: 401 });
            expect(authApi.refresh).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('calls the api with the refresh token and clears the session', async () => {
            sessionManager.start(authResponse());

            await sessionManager.logout();

            expect(authApi.logout).toHaveBeenCalledTimes(1);
            expect(authApi.logout).toHaveBeenCalledWith('refresh-1');
            expect(stored()).toBeNull();
            expect(sessionManager.accessToken()).toBeNull();
        });

        it('still clears the session and resolves when the call rejects', async () => {
            sessionManager.start(authResponse());
            vi.mocked(authApi.logout).mockRejectedValue(new ApiError('Cannot reach the server. Try again later.'));

            await expect(sessionManager.logout()).resolves.toBeUndefined();

            expect(stored()).toBeNull();
            expect(sessionManager.accessToken()).toBeNull();
        });

        it('resolves without a request when there is no session', async () => {
            await expect(sessionManager.logout()).resolves.toBeUndefined();
            expect(authApi.logout).not.toHaveBeenCalled();
        });
    });
});
