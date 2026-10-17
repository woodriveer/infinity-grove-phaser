import axios from 'axios';
import { config } from './config';
import { ApiError } from './ApiError';
import { sessionManager } from '../auth/sessionManager';

export const httpClient = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeoutMs,
    headers: { 'Content-Type': 'application/json' }
});

//  Requests flagged with `skipAuth: true` (login, sign-up) never get a Bearer and never trigger a refresh.
httpClient.interceptors.request.use((request) =>
{
    const token = request.skipAuth ? null : sessionManager.accessToken();

    if (token)
    {
        request.headers.Authorization = `Bearer ${token}`;
        request.sentBearer = token;
    }

    return request;
});

const retryWithFreshToken = async (error) =>
{
    const request = error.config;
    request.retried = true;

    //  Another request may already have rotated the tokens; only refresh if ours is still the current one.
    const current = sessionManager.accessToken();
    let token = current;

    if (!current || current === request.sentBearer)
    {
        try
        {
            token = await sessionManager.refresh();
        }
        catch (refreshError)
        {
            throw refreshError instanceof ApiError ? refreshError : ApiError.from(refreshError);
        }
    }

    request.headers.Authorization = `Bearer ${token}`;
    request.sentBearer = token;
    return httpClient.request(request);
};

httpClient.interceptors.response.use(
    (response) => response,
    (error) =>
    {
        const request = error.config;

        if (error.response?.status === 401 && request?.sentBearer && !request.retried && !request.skipAuth)
        {
            return retryWithFreshToken(error).catch((retryError) =>
                Promise.reject(retryError instanceof ApiError ? retryError : ApiError.from(retryError)));
        }

        return Promise.reject(ApiError.from(error));
    }
);
