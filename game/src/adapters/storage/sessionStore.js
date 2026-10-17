//  Persists the session in localStorage, falling back to memory when storage is unavailable.
const STORAGE_KEY = 'infinity-grove.session';
const NUMERIC_FIELDS = ['accessTokenExpiresAt', 'refreshTokenExpiresAt'];
const STRING_FIELDS = ['accessToken', 'refreshToken'];

let memorySession = null;
let memoryOnly = false;

const isValid = (session) =>
    session !== null &&
    typeof session === 'object' &&
    session.user !== null && typeof session.user === 'object' &&
    STRING_FIELDS.every((field) => typeof session[field] === 'string' && session[field] !== '') &&
    NUMERIC_FIELDS.every((field) => typeof session[field] === 'number' && Number.isFinite(session[field]));

const removeStored = () =>
{
    try
    {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch
    {
        //  Storage unavailable: nothing to remove.
    }
};

export const sessionStore = {
    fromAuthResponse: (response) => ({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        accessTokenExpiresAt: response.accessTokenExpiresAt,
        refreshTokenExpiresAt: response.refreshTokenExpiresAt
    }),

    save: (session) =>
    {
        memorySession = session;

        try
        {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            memoryOnly = false;
        }
        catch
        {
            memoryOnly = true;
            //  Storage unavailable: the in-memory copy keeps the session until page unload.
        }
    },

    load: () =>
    {
        let raw = null;

        try
        {
            raw = localStorage.getItem(STORAGE_KEY);
        }
        catch
        {
            return memorySession;
        }

        if (raw === null)
        {
            //  An empty entry only means "no session" unless the last save could not reach storage.
            return memoryOnly ? memorySession : null;
        }

        try
        {
            const session = JSON.parse(raw);

            if (isValid(session))
            {
                return session;
            }
        }
        catch
        {
            //  Corrupt JSON is treated like any other invalid entry.
        }

        memorySession = null;
        removeStored();
        return null;
    },

    clear: () =>
    {
        memorySession = null;
        memoryOnly = false;
        removeStored();
    }
};
