import axios from 'axios';
import { config } from './config';
import { ApiError } from './ApiError';

//  Dedicated client without auth interceptors: a failing refresh must never trigger another refresh.
//  This module must not import httpClient (httpClient -> sessionManager -> authApi).
export const authClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeoutMs,
    headers: { 'Content-Type': 'application/json' }
});

authClient.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(ApiError.from(error))
);

//  Wraps the backend AuthController (/auth). refresh responds with the same AuthResponse as login.
export const authApi = {
    refresh: async (refreshToken) =>
        (await authClient.post('/auth/refresh', { refreshToken })).data,

    logout: async (refreshToken) =>
    {
        await authClient.post('/auth/logout', { refreshToken });
    }
};
