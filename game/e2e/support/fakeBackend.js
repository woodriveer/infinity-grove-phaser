//  In-memory stand-in for the Kotlin backend UserController, mirroring its status codes and ProblemDetail bodies.
const MIN_PASSWORD_LENGTH = 8;

const problem = (status, detail, code) => ({
    status,
    contentType: 'application/problem+json',
    json: { status, detail, ...(code && { code }) }
});

const authResponse = (user, now) => ({
    user,
    accessToken: `access-${now}`,
    refreshToken: `refresh-${now}`,
    accessTokenExpiresAt: now + 24 * 60 * 60 * 1000,
    refreshTokenExpiresAt: now + 30 * 24 * 60 * 60 * 1000
});

export async function mockBackend (page, { users = {}, delayMs = 0 } = {}) {
    const store = new Map(Object.entries(users));
    const calls = [];

    await page.route('**/api/users**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace(/^\/api/, '');
        const body = request.postDataJSON() ?? {};
        const now = Date.now();

        calls.push({ method: request.method(), path, body });

        if (delayMs) { await new Promise((resolve) => setTimeout(resolve, delayMs)); }

        if (request.method() === 'POST' && path === '/users') {
            const username = String(body.username ?? '').trim();

            if (!username) { return route.fulfill(problem(400, 'Username must not be blank')); }
            if (String(body.password ?? '').length < MIN_PASSWORD_LENGTH) {
                return route.fulfill(problem(400, `Password must have at least ${MIN_PASSWORD_LENGTH} characters`));
            }
            if (store.has(username)) {
                return route.fulfill(problem(409, `User '${username}' already exists`, 'USER_ALREADY_EXISTS'));
            }

            store.set(username, body.password);
            return route.fulfill({ status: 201, json: authResponse({ username, createdAt: now, lastLoginAt: now }, now) });
        }

        if (request.method() === 'POST' && path === '/users/login') {
            const { username, password } = body;

            if (!store.has(username)) {
                return route.fulfill(problem(404, `User '${username}' does not exist`, 'LOGIN_USER_NOT_FOUND'));
            }
            if (store.get(username) !== password) {
                return route.fulfill(problem(401, 'Password is invalid', 'LOGIN_INVALID_PASSWORD'));
            }

            return route.fulfill({ json: authResponse({ username, createdAt: now, lastLoginAt: now }, now) });
        }

        return route.fulfill(problem(404, 'Not found'));
    });

    return { calls, users: store };
}

export const serverDown = (page) => page.route('**/api/users**', (route) => route.abort('connectionrefused'));
