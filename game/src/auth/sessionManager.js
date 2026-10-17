import { sessionStore } from './sessionStore';
import { authApi } from '../api/authApi';
import { ApiError } from '../api/ApiError';

//  Orchestrates the stored session: start, restore on boot, single-flight refresh, logout.
//  Imports authApi (own axios client), never httpClient, so httpClient can depend on this module.
let session = null;
let inFlightRefresh = null;

const forget = () =>
{
    session = null;
    sessionStore.clear();
};

const doRefresh = async () =>
{
    if (!session)
    {
        throw new ApiError('No active session', { status: 401 });
    }

    try
    {
        const response = await authApi.refresh(session.refreshToken);
        session = sessionStore.fromAuthResponse(response);
        sessionStore.save(session);
        return session.accessToken;
    }
    catch (error)
    {
        if (error?.status === 401)
        {
            forget();
        }

        throw error;
    }
};

export const sessionManager = {
    start: (authResponse) =>
    {
        session = sessionStore.fromAuthResponse(authResponse);
        sessionStore.save(session);
    },

    restore: async (now = Date.now()) =>
    {
        session = sessionStore.load();

        if (!session)
        {
            return { status: 'none' };
        }

        if (now < session.accessTokenExpiresAt)
        {
            return { status: 'active', user: session.user };
        }

        if (now >= session.refreshTokenExpiresAt)
        {
            forget();
            return { status: 'none' };
        }

        try
        {
            await sessionManager.refresh();
            return { status: 'active', user: session.user };
        }
        catch (error)
        {
            if (error?.status === 401)
            {
                return { status: 'none' };
            }

            return { status: 'offline', message: error?.message ?? 'Cannot reach the server. Try again later.' };
        }
    },

    //  Concurrent callers share one request. Resolves with the new access token.
    refresh: () =>
    {
        inFlightRefresh ??= doRefresh().finally(() =>
        {
            inFlightRefresh = null;
        });

        return inFlightRefresh;
    },

    accessToken: () => session?.accessToken ?? null,

    //  Best effort on the server, always clears locally.
    logout: async () =>
    {
        const refreshToken = session?.refreshToken;
        forget();

        if (!refreshToken)
        {
            return;
        }

        try
        {
            await authApi.logout(refreshToken);
        }
        catch
        {
            //  The local session is already gone; the token will expire on its own.
        }
    },

    //  Drops in-memory state (test isolation).
    reset: () =>
    {
        session = null;
        inFlightRefresh = null;
    }
};
