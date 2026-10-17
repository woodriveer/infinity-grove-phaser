import { ApiError } from '../ApiError';

//  Orchestrates the stored session: start, restore on boot, single-flight refresh, logout.
//  Ports (ADR 0007):
//    store        { fromAuthResponse(response), save(session), load(), clear() }  persistence of the session
//    authGateway  { refresh(refreshToken), logout(refreshToken) }                  the backend /auth calls, rejecting with ApiError
export const createSessionManager = ({ store, authGateway }) =>
{
    let session = null;
    let inFlightRefresh = null;

    const forget = () =>
    {
        session = null;
        store.clear();
    };

    const doRefresh = async () =>
    {
        if (!session)
        {
            throw new ApiError('No active session', { status: 401 });
        }

        try
        {
            const response = await authGateway.refresh(session.refreshToken);
            session = store.fromAuthResponse(response);
            store.save(session);
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

    const manager = {
        start: (authResponse) =>
        {
            session = store.fromAuthResponse(authResponse);
            store.save(session);
        },

        restore: async (now = Date.now()) =>
        {
            session = store.load();

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
                await manager.refresh();
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
                await authGateway.logout(refreshToken);
            }
            catch
            {
                //  The local session is already gone; the token will expire on its own.
            }
        }
    };

    return manager;
};
