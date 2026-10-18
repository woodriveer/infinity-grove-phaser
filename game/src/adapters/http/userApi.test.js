import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserApi } from './userApi';

const httpClient = { post: vi.fn() };
const userApi = createUserApi(httpClient);

const user = { username: 'yan', createdAt: 1, lastLoginAt: 1 };
const authResponse = {
    user,
    accessToken: 'access',
    refreshToken: 'refresh',
    accessTokenExpiresAt: 10,
    refreshTokenExpiresAt: 20
};

describe('userApi', () => {
    beforeEach(() => {
        vi.mocked(httpClient.post).mockReset();
    });

    it('signUp posts credentials and the starting element to /users without auth and returns the auth response', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: authResponse });

        await expect(userApi.signUp('yan', 'secret123', 'WATER')).resolves.toEqual(authResponse);
        expect(httpClient.post).toHaveBeenCalledWith('/users', { username: 'yan', password: 'secret123', startingElement: 'WATER' }, { skipAuth: true });
    });

    it('login posts credentials to /users/login without auth and returns the auth response', async () => {
        vi.mocked(httpClient.post).mockResolvedValue({ data: authResponse });

        await expect(userApi.login('yan', 'secret123')).resolves.toEqual(authResponse);
        expect(httpClient.post).toHaveBeenCalledWith('/users/login', { username: 'yan', password: 'secret123' }, { skipAuth: true });
    });

    it('propagates errors from the client', async () => {
        const error = new Error('conflict');
        vi.mocked(httpClient.post).mockImplementation(async () => { throw error; });

        await expect(userApi.signUp('yan', 'x', 'FIRE')).rejects.toThrow('conflict');
    });
});
