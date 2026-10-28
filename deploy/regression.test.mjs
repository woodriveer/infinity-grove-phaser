import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { runSuite } from './regression.mjs';

//  Chapter 1 as a fake campaign: two stages of two phases and a miniboss, then the chapter boss
const CHAPTER_ONE = [
    [1, 'PHASE', 1], [1, 'PHASE', 2], [1, 'MINIBOSS', 1],
    [2, 'PHASE', 1], [2, 'PHASE', 2], [2, 'MINIBOSS', 1],
    [2, 'CHAPTER_BOSS', 1]
].map(([stage, encounter, phase]) => ({ chapter: 1, stage, encounter, phase }));
const CHAPTER_TWO = { chapter: 2, stage: 1, encounter: 'PHASE', phase: 1 };

//  A fake backend: users, tokens and one campaign per user; faults replace the answer of one route ("POST /account/reset")
const fakeBackend = ({ faults = {}, stuck = false } = {}) =>
{
    const users = new Map();
    const requests = [];

    const handle = (method, path, body, auth) =>
    {
        const route = `${method} ${path.replace(/^\/users\/(?!login).+$/, '/users/{username}')}`;
        requests.push(route);

        if (faults[route])
        {
            return faults[route];
        }

        if (route === 'POST /users')
        {
            users.set(body.username, { password: body.password, step: 0, chapter: 1, resets: 0, crystals: 0 });

            return { status: 201, body: { user: { username: body.username }, accessToken: `token-${body.username}` } };
        }

        if (route === 'POST /users/login')
        {
            const user = users.get(body.username);

            return user && user.password === body.password
                ? { status: 200, body: { accessToken: `token-${body.username}` } }
                : { status: 401, body: { code: 'LOGIN_FAILED' } };
        }

        const username = auth?.replace(/^Bearer token-/, '');
        const user = users.get(username);

        if (!user)
        {
            return { status: 401, body: { code: 'AUTH_UNAUTHENTICATED' } };
        }

        const position = () => (user.chapter === 2 ? CHAPTER_TWO : CHAPTER_ONE[user.step]);

        switch (route)
        {
            case 'GET /progress':
                return { status: 200, body: { ...position(), completed: false } };
            case 'GET /wallet':
            case 'GET /talents':
            case 'GET /heroes':
            case 'GET /equipment':
                return { status: 200, body: {} };
            case 'GET /auto-click':
                return { status: 200, body: { level: 0, resets: user.resets, crystals: user.crystals } };
            case 'POST /progress/outcome':
            {
                const { outcome, ...sent } = body;

                if (outcome !== 'CLEARED' || JSON.stringify(sent) !== JSON.stringify(position()))
                {
                    return { status: 409, body: { code: 'PROGRESS_POSITION_MISMATCH' } };
                }

                if (!stuck)
                {
                    user.step += 1;
                    user.chapter = user.step === CHAPTER_ONE.length ? 2 : 1;
                }

                return { status: 200, body: { ...position(), completed: false } };
            }
            case 'POST /account/reset':
                if (body.fromChapter !== user.chapter)
                {
                    return { status: 409, body: { code: 'RESET_CHAPTER_MISMATCH' } };
                }

                if (user.chapter === 1)
                {
                    return { status: 409, body: { code: 'RESET_LOCKED' } };
                }

                Object.assign(user, { step: 0, chapter: 1, resets: user.resets + 1, crystals: user.crystals + 2 });

                return { status: 200, body: { reward: 2, crystals: user.crystals, resets: user.resets, progress: position() } };
            case 'DELETE /users/{username}':
                users.delete(decodeURIComponent(path.slice('/users/'.length)));

                return { status: 204, body: null };
            default:
                return { status: 404, body: null };
        }
    };

    const fetch = async (url, { method, headers, body }) =>
    {
        const answer = handle(method, new URL(url).pathname, body ? JSON.parse(body) : undefined, headers.Authorization);

        return { status: answer.status, text: async () => (answer.body === null ? '' : JSON.stringify(answer.body)) };
    };

    return { users, requests, fetch, handle };
};

//  A clock that moves 4.2 s between the start and the end of the run
const fakeClock = () =>
{
    const times = [1000, 5200];

    return () => times.shift() ?? 5200;
};

const suite = (backend, extra = {}) =>
{
    const lines = [];
    const run = runSuite('http://backend-green:8080', {
        fetch: backend.fetch,
        log: (line) => lines.push(line),
        now: fakeClock(),
        commit: 'abc1234',
        random: () => 'f00d',
        ...extra
    });

    return run.then((result) => ({ ...result, lines }));
};

test('the happy path runs the 12 checks in order, prints the OK line and deletes the user', async () =>
{
    const backend = fakeBackend();
    const { ok, checks, lines } = await suite(backend);

    assert.equal(ok, true);
    assert.equal(checks, 12);
    assert.deepEqual(lines, ['Regressão OK: 12 verificações em 4.2 s']);
    assert.deepEqual(backend.requests, [
        'POST /users',
        'POST /users/login',
        'GET /progress',
        'GET /wallet',
        'GET /talents',
        'GET /heroes',
        'GET /equipment',
        'GET /auto-click',
        'POST /account/reset',
        ...CHAPTER_ONE.map(() => 'POST /progress/outcome'),
        'POST /account/reset',
        'GET /auto-click',
        'DELETE /users/{username}'
    ]);
    assert.equal(backend.users.size, 0);
});

test('the user is named regression-<commit>-<random> and registered with FIRE', async () =>
{
    const backend = fakeBackend();
    const bodies = [];
    const fetch = (url, options) =>
    {
        bodies.push(options.body && JSON.parse(options.body));

        return backend.fetch(url, options);
    };

    await suite({ ...backend, fetch });

    assert.equal(bodies[0].username, 'regression-abc1234-f00d');
    assert.equal(bodies[0].startingElement, 'FIRE');
});

test('without a commit the user is named regression-local-<random>', async () =>
{
    const backend = fakeBackend();
    const names = [];
    const fetch = (url, options) =>
    {
        names.push(JSON.parse(options.body ?? '{}').username);

        return backend.fetch(url, options);
    };

    await runSuite('http://x', { fetch, log: () => {}, random: () => 'beef' });

    assert.equal(names[0], 'regression-local-beef');
});

const failures = [
    {
        check: 'reset bloqueado',
        faults: { 'POST /account/reset': { status: 500, body: { code: 'INTERNAL' } } },
        line: 'FALHOU: reset bloqueado: 409 RESET_LOCKED / 500 INTERNAL',
        route: 'POST /account/reset',
        checks: 8
    },
    {
        check: 'reset',
        faults: {},
        reset: { status: 500, body: null },
        line: 'FALHOU: reset: 200 / 500',
        route: 'POST /account/reset',
        checks: 10
    },
    {
        check: 'auto clique após reset',
        faults: {},
        afterReset: { status: 503, body: null },
        line: 'FALHOU: auto clique após reset: 200 / 503',
        route: 'GET /auto-click',
        checks: 11
    }
];

//  Every check before the chapter: a fault in its route stops the run there
const early = [
    ['cadastro', 'POST /users', { status: 201, body: { user: {} } }, 'FALHOU: cadastro: 201 com accessToken / 201 sem accessToken', 0],
    ['login', 'POST /users/login', { status: 500, body: null }, 'FALHOU: login: 200 / 500', 1],
    ['progresso inicial', 'GET /progress', { status: 200, body: { chapter: 2, stage: 1 } }, 'FALHOU: progresso inicial: capítulo 1 etapa 1 / capítulo 2 etapa 1', 2],
    ['carteira', 'GET /wallet', { status: 500, body: null }, 'FALHOU: carteira: 200 / 500', 3],
    ['talentos', 'GET /talents', { status: 500, body: null }, 'FALHOU: talentos: 200 / 500', 4],
    ['heróis', 'GET /heroes', { status: 500, body: null }, 'FALHOU: heróis: 200 / 500', 5],
    ['equipamentos', 'GET /equipment', { status: 500, body: null }, 'FALHOU: equipamentos: 200 / 500', 6],
    ['auto clique inicial', 'GET /auto-click', { status: 200, body: { level: 0, resets: 1 } }, 'FALHOU: auto clique inicial: nível 0 e resets 0 / nível 0 e resets 1', 7]
];

for (const [check, route, answer, line, checks] of early)
{
    test(`a wrong answer in "${check}" prints FALHOU and stops there`, async () =>
    {
        const backend = fakeBackend({ faults: { [route]: answer } });
        const { ok, lines, ...result } = await suite(backend);

        assert.equal(ok, false);
        assert.equal(result.checks, checks);
        assert.deepEqual(lines, [line]);
        assert.equal(backend.requests.at(-1), check === 'cadastro' ? route : 'DELETE /users/{username}');
    });
}

test('a wrong level in "auto clique inicial" fails it too', async () =>
{
    const backend = fakeBackend({ faults: { 'GET /auto-click': { status: 200, body: { level: 1, resets: 0 } } } });
    const { lines } = await suite(backend);

    assert.deepEqual(lines, ['FALHOU: auto clique inicial: nível 0 e resets 0 / nível 1 e resets 0']);
});

test('a wrong stage in "progresso inicial" fails it too', async () =>
{
    const backend = fakeBackend({ faults: { 'GET /progress': { status: 200, body: { chapter: 1, stage: 2 } } } });
    const { lines } = await suite(backend);

    assert.deepEqual(lines, ['FALHOU: progresso inicial: capítulo 1 etapa 1 / capítulo 1 etapa 2']);
});

//  The second reset and the second auto click fail only after the first one answered, so the fault is applied by count
const countedFault = (backend, route, nth, answer) =>
{
    let seen = 0;
    const fetch = async (url, options) =>
    {
        const path = new URL(url).pathname;

        if (`${options.method} ${path}` === route && ++seen === nth)
        {
            backend.requests.push(route);

            return { status: answer.status, text: async () => (answer.body === null ? '' : JSON.stringify(answer.body)) };
        }

        return backend.fetch(url, options);
    };

    return { ...backend, fetch };
};

for (const failure of failures)
{
    test(`a wrong answer in "${failure.check}" prints FALHOU, stops there and still deletes the user`, async () =>
    {
        let backend = fakeBackend({ faults: failure.faults });

        if (failure.reset)
        {
            backend = countedFault(backend, 'POST /account/reset', 2, failure.reset);
        }

        if (failure.afterReset)
        {
            backend = countedFault(backend, 'GET /auto-click', 2, failure.afterReset);
        }

        const { ok, checks, lines } = await suite(backend);

        assert.equal(ok, false);
        assert.equal(checks, failure.checks);
        assert.deepEqual(lines, [failure.line]);
        assert.deepEqual(backend.requests.slice(-2), [failure.route, 'DELETE /users/{username}']);
        assert.equal(backend.users.size, 0);
    });
}

test('a reset that answers 200 with another reward fails "reset" with the expected and the received values', async () =>
{
    const backend = countedFault(fakeBackend(), 'POST /account/reset', 2, {
        status: 200,
        body: { reward: 1, progress: { chapter: 1 } }
    });
    const { ok, lines } = await suite(backend);

    assert.equal(ok, false);
    assert.deepEqual(lines, ['FALHOU: reset: reward 2 e capítulo 1 / reward 1 e capítulo 1']);
    assert.equal(backend.users.size, 0);
});

test('an auto click after the reset without the resets and crystals fails with both values', async () =>
{
    const backend = countedFault(fakeBackend(), 'GET /auto-click', 2, { status: 200, body: { resets: 0, crystals: 0 } });
    const { lines } = await suite(backend);

    assert.deepEqual(lines, ['FALHOU: auto clique após reset: resets 1 e crystals 2 / resets 0 e crystals 0']);
});

test('chapter 1 that never ends fails "capítulo 1" after 200 outcomes', async () =>
{
    const backend = fakeBackend({ stuck: true });
    const { ok, checks, lines } = await suite(backend);

    assert.equal(ok, false);
    assert.equal(checks, 9);
    assert.deepEqual(lines, ['FALHOU: capítulo 1: capítulo 2 em até 200 vitórias / capítulo 1 etapa 1']);
    assert.equal(backend.requests.filter((route) => route === 'POST /progress/outcome').length, 200);
    assert.equal(backend.users.size, 0);
});

test('a failed delete prints the cleanup failure and fails the run', async () =>
{
    const backend = fakeBackend({ faults: { 'DELETE /users/{username}': { status: 500, body: null } } });
    const { ok, checks, lines } = await suite(backend);

    assert.equal(ok, false);
    assert.equal(checks, 12);
    assert.deepEqual(lines, ['FALHOU: limpeza: 204 / 500']);
});

//  The CLI against the fake backend served over http, run as its own process
const serve = (backend) => new Promise((resolve) =>
{
    const server = createServer((request, response) =>
    {
        let data = '';
        request.on('data', (chunk) =>
        {
            data += chunk;
        });
        request.on('end', () =>
        {
            const answer = backend.handle(request.method, request.url, data ? JSON.parse(data) : undefined, request.headers.authorization);
            response.writeHead(answer.status, { 'Content-Type': 'application/json' });
            response.end(answer.body === null ? '' : JSON.stringify(answer.body));
        });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
});

const cli = (args) => new Promise((resolve) =>
{
    const script = fileURLToPath(new URL('./regression.mjs', import.meta.url));
    execFile(process.execPath, [script, ...args], (error, stdout) => resolve({ code: error ? error.code : 0, stdout }));
});

test('the CLI exits 0 when every check passes', async () =>
{
    const backend = fakeBackend();
    const server = await serve(backend);

    try
    {
        const { code, stdout } = await cli([`http://127.0.0.1:${server.address().port}`]);

        assert.equal(code, 0);
        assert.match(stdout, /^Regressão OK: 12 verificações em \d+\.\d s\n$/);
        assert.equal(backend.users.size, 0);
    }
    finally
    {
        server.close();
    }
});

test('the CLI with no base URL prints the usage and exits 1', async () =>
{
    const { code, stdout } = await cli([]);

    assert.equal(code, 1);
    assert.equal(stdout, 'Uso: node regression.mjs <url base>\n');
});

test('the CLI exits 1 when a check fails', async () =>
{
    const backend = fakeBackend({ faults: { 'POST /account/reset': { status: 500, body: null } } });
    const server = await serve(backend);

    try
    {
        const { code, stdout } = await cli([`http://127.0.0.1:${server.address().port}`]);

        assert.equal(code, 1);
        assert.equal(stdout, 'FALHOU: reset bloqueado: 409 RESET_LOCKED / 500\n');
        assert.equal(backend.users.size, 0);
    }
    finally
    {
        server.close();
    }
});
