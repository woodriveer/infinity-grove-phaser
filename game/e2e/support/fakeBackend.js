//  In-memory stand-in for the Kotlin backend (UserController + AuthController + JWT security chain),
//  mirroring its status codes, ProblemDetail bodies and token contract.
const MIN_PASSWORD_LENGTH = 8;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const problem = (status, detail, code) => ({
    status,
    contentType: 'application/problem+json',
    json: { status, detail, ...(code && { code }) }
});

const unauthenticated = () => problem(401, 'Authentication is required', 'AUTH_UNAUTHENTICATED');
const invalidRefreshToken = () => problem(401, 'Refresh token is invalid', 'AUTH_INVALID_REFRESH_TOKEN');

//  Wallet contract (WalletController): level 1 only, a queue of 20 pre-rolled drops, the first k are credited per sync
const QUEUE_SIZE = 20;
const DEFAULT_DROPS = [ 3, 1, 5, 2, 4 ];

const coins = (copper) => ({ gold: Math.floor(copper / 10_000), silver: Math.floor(copper / 100) % 100, copper: copper % 100 });

const isPublic = (method, path) => method === 'POST' && (path === '/users' || path === '/users/login');

//  Options: users {name: password}, delayMs, accessTtlMs (default 24 h), refreshTtlMs (default 30 days),
//  wallets {name: copper} (starting totals) and drops (the repeating list the wallet queues are rolled from).
//  Returns the recorded `calls` (users, auth and wallet routes), the `users` and `wallets` stores and test controls over issued tokens.
export async function mockBackend (page, {
    users = {}, delayMs = 0, accessTtlMs = DAY_MS, refreshTtlMs = 30 * DAY_MS, wallets: startingWallets = {}, drops = DEFAULT_DROPS
} = {}) {
    const store = new Map(Object.entries(users));
    const calls = [];
    const sessions = { access: new Map(), refresh: new Map() };
    let counter = 0;
    const wallets = new Map();
    let rolled = 0;

    const nextDrop = () => drops[rolled++ % drops.length];
    const walletOf = (username) => {
        if (!wallets.has(username)) {
            wallets.set(username, { copper: startingWallets[username] ?? 0, queue: Array.from({ length: QUEUE_SIZE }, nextDrop) });
        }

        return wallets.get(username);
    };

    const issue = (user, now) => {
        counter += 1;
        const accessToken = `access-${counter}`;
        const refreshToken = `refresh-${counter}`;
        const accessTokenExpiresAt = now + accessTtlMs;
        const refreshTokenExpiresAt = now + refreshTtlMs;

        sessions.access.set(accessToken, { username: user.username, expiresAt: accessTokenExpiresAt });
        sessions.refresh.set(refreshToken, { user, expiresAt: refreshTokenExpiresAt, revoked: false });

        return { user, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
    };

    const hasValidBearer = (request, now) => {
        const token = (request.headers().authorization ?? '').replace(/^Bearer /, '');
        const entry = sessions.access.get(token);

        return Boolean(entry) && now < entry.expiresAt;
    };

    const bearerUsername = (request) => sessions.access.get((request.headers().authorization ?? '').replace(/^Bearer /, ''))?.username;

    const handleWallet = (route, method, path, body, now) => {
        const request = route.request();

        if (!hasValidBearer(request, now)) { return route.fulfill(unauthenticated()); }

        const username = bearerUsername(request);

        if (!store.has(username)) { return route.fulfill(problem(404, `User '${username}' not found`, 'USER_NOT_FOUND')); }

        const wallet = walletOf(username);

        if (method === 'GET' && path === '/wallet') {
            return route.fulfill({ json: { wallet: coins(wallet.copper), drops: { 1: [ ...wallet.queue ] } } });
        }

        if (method === 'POST' && path === '/wallet/sync') {
            const kills = body.kills;
            const entries = kills && typeof kills === 'object' && !Array.isArray(kills) ? Object.entries(kills) : null;

            if (!entries || entries.some(([ , count ]) => !Number.isInteger(count) || count < 0)) {
                return route.fulfill(problem(400, 'Kills are invalid', 'WALLET_INVALID_KILLS'));
            }
            if (entries.some(([ level ]) => level !== '1')) {
                return route.fulfill(problem(400, 'Monster level is unknown', 'WALLET_UNKNOWN_LEVEL'));
            }

            const accepted = Math.min(Number(kills['1'] ?? 0), QUEUE_SIZE);
            const credited = wallet.queue.splice(0, accepted);

            wallet.copper += credited.reduce((sum, value) => sum + value, 0);
            wallet.queue.push(...Array.from({ length: accepted }, nextDrop));

            return route.fulfill({ json: { wallet: coins(wallet.copper), accepted: { 1: accepted }, drops: { 1: [ ...wallet.queue ] } } });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    const handler = async (route) => {
        const request = route.request();
        const method = request.method();
        const path = new URL(request.url()).pathname.replace(/^\/api/, '');
        const body = request.postDataJSON() ?? {};
        const now = Date.now();

        calls.push({ method, path, body });

        if (delayMs) { await new Promise((resolve) => setTimeout(resolve, delayMs)); }

        if (method === 'POST' && path === '/users') {
            const username = String(body.username ?? '').trim();

            if (!username) { return route.fulfill(problem(400, 'Username must not be blank')); }
            if (String(body.password ?? '').length < MIN_PASSWORD_LENGTH) {
                return route.fulfill(problem(400, `Password must have at least ${MIN_PASSWORD_LENGTH} characters`));
            }
            if (store.has(username)) {
                return route.fulfill(problem(409, `User '${username}' already exists`, 'USER_ALREADY_EXISTS'));
            }

            store.set(username, body.password);
            return route.fulfill({ status: 201, json: issue({ username, createdAt: now, lastLoginAt: now }, now) });
        }

        if (method === 'POST' && path === '/users/login') {
            const { username, password } = body;

            if (!store.has(username)) {
                return route.fulfill(problem(404, `User '${username}' does not exist`, 'LOGIN_USER_NOT_FOUND'));
            }
            if (store.get(username) !== password) {
                return route.fulfill(problem(401, 'Password is invalid', 'LOGIN_INVALID_PASSWORD'));
            }

            return route.fulfill({ json: issue({ username, createdAt: now, lastLoginAt: now }, now) });
        }

        if (method === 'POST' && path === '/auth/refresh') {
            if (!String(body.refreshToken ?? '').trim()) { return route.fulfill(problem(400, 'Refresh token must not be blank')); }

            const entry = sessions.refresh.get(body.refreshToken);

            if (!entry || entry.revoked || now >= entry.expiresAt || !store.has(entry.user.username)) {
                return route.fulfill(invalidRefreshToken());
            }

            //  Rotation: the presented token is spent
            entry.revoked = true;
            return route.fulfill({ json: issue(entry.user, now) });
        }

        if (method === 'POST' && path === '/auth/logout') {
            if (!String(body.refreshToken ?? '').trim()) { return route.fulfill(problem(400, 'Refresh token must not be blank')); }

            const entry = sessions.refresh.get(body.refreshToken);

            if (entry) { entry.revoked = true; }

            return route.fulfill({ status: 204 });
        }

        if (path === '/wallet' || path === '/wallet/sync') { return handleWallet(route, method, path, body, now); }

        if (path.startsWith('/users') && !isPublic(method, path)) {
            if (!hasValidBearer(request, now)) { return route.fulfill(unauthenticated()); }

            const username = decodeURIComponent(path.split('/')[2] ?? '');

            if (method === 'GET' && store.has(username)) { return route.fulfill({ json: { username } }); }
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    await page.route('**/api/users**', handler);
    await page.route('**/api/auth/**', handler);
    //  Not `**/api/wallet**`: that would also catch Vite's module request for /src/api/walletApi.js
    await page.route('**/api/wallet', handler);
    await page.route('**/api/wallet/**', handler);

    return {
        calls,
        users: store,
        wallets,
        sessions,
        //  Makes every issued access token expired, as if 24 h had passed
        expireAccessTokens: () => {
            sessions.access.forEach((entry) => { entry.expiresAt = Date.now() - 1; });
        },
        //  Server-side revocation of every refresh token (e.g. password change)
        revokeAllRefreshTokens: () => {
            sessions.refresh.forEach((entry) => { entry.revoked = true; });
        }
    };
}

export const serverDown = async (page) => {
    await page.route('**/api/users**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/auth/**', (route) => route.abort('connectionrefused'));
};
