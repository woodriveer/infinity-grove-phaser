//  The API regression suite: drives a real backend with a throwaway user, check by check, and deletes the user at the end
//  Usage: node regression.mjs <base url>; REGRESSION_COMMIT names the commit in the username (default: local)
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const CHECKS = 12;
const MAX_OUTCOMES = 200;

class CheckFailed extends Error
{
    constructor(expected, received)
    {
        super(`${expected} / ${received}`);
    }
}

const expect = (condition, expected, received) =>
{
    if (!condition)
    {
        throw new CheckFailed(expected, received);
    }
};

const expectStatus = (response, status) => expect(response.status === status, status, response.status);

export const runSuite = async (baseUrl, {
    fetch = globalThis.fetch,
    log = console.log,
    now = Date.now,
    commit = 'local',
    random = () => randomBytes(4).toString('hex')
} = {}) =>
{
    const start = now();
    const username = `regression-${commit}-${random()}`;
    const password = `regression-${random()}`;
    let token = null;
    let position = null;
    let checks = 0;
    let ok = true;

    const call = async (method, path, body) =>
    {
        const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(30000)
        });
        const text = await response.text();
        let json = null;

        try
        {
            json = text ? JSON.parse(text) : null;
        }
        catch
        {
            //  not JSON; the checks only read the status then
        }

        return { status: response.status, body: json };
    };

    const steps = [
        ['cadastro', async () =>
        {
            const response = await call('POST', '/users', { username, password, startingElement: 'FIRE' });
            expectStatus(response, 201);
            expect(Boolean(response.body?.accessToken), '201 com accessToken', '201 sem accessToken');
            token = response.body.accessToken;
        }],
        ['login', async () =>
        {
            const response = await call('POST', '/users/login', { username, password });
            expectStatus(response, 200);
            token = response.body?.accessToken ?? token;
        }],
        ['progresso inicial', async () =>
        {
            const response = await call('GET', '/progress');
            expectStatus(response, 200);
            const { chapter, stage } = response.body ?? {};
            expect(chapter === 1 && stage === 1, 'capítulo 1 etapa 1', `capítulo ${chapter} etapa ${stage}`);
            position = response.body;
        }],
        ['carteira', async () => expectStatus(await call('GET', '/wallet'), 200)],
        ['talentos', async () => expectStatus(await call('GET', '/talents'), 200)],
        ['heróis', async () => expectStatus(await call('GET', '/heroes'), 200)],
        ['equipamentos', async () => expectStatus(await call('GET', '/equipment'), 200)],
        ['auto clique inicial', async () =>
        {
            const response = await call('GET', '/auto-click');
            expectStatus(response, 200);
            const { level, resets } = response.body ?? {};
            expect(level === 0 && resets === 0, 'nível 0 e resets 0', `nível ${level} e resets ${resets}`);
        }],
        ['reset bloqueado', async () =>
        {
            const response = await call('POST', '/account/reset', { fromChapter: 1 });
            const received = [response.status, response.body?.code].filter(Boolean).join(' ');
            expect(response.status === 409 && response.body?.code === 'RESET_LOCKED', '409 RESET_LOCKED', received);
        }],
        ['capítulo 1', async () =>
        {
            for (let posts = 0; position.chapter === 1; posts += 1)
            {
                expect(posts < MAX_OUTCOMES, `capítulo 2 em até ${MAX_OUTCOMES} vitórias`, `capítulo ${position.chapter} etapa ${position.stage}`);
                const { chapter, stage, encounter, phase } = position;
                const response = await call('POST', '/progress/outcome', { chapter, stage, encounter, phase, outcome: 'CLEARED' });
                expectStatus(response, 200);
                position = response.body;
            }

            expect(position.chapter === 2, 'capítulo 2', `capítulo ${position.chapter}`);
        }],
        ['reset', async () =>
        {
            const response = await call('POST', '/account/reset', { fromChapter: 2 });
            expectStatus(response, 200);
            const reward = response.body?.reward;
            const chapter = response.body?.progress?.chapter;
            expect(reward === 2 && chapter === 1, 'reward 2 e capítulo 1', `reward ${reward} e capítulo ${chapter}`);
        }],
        ['auto clique após reset', async () =>
        {
            const response = await call('GET', '/auto-click');
            expectStatus(response, 200);
            const { resets, crystals } = response.body ?? {};
            expect(resets === 1 && crystals === 2, 'resets 1 e crystals 2', `resets ${resets} e crystals ${crystals}`);
        }]
    ];

    try
    {
        for (const [name, check] of steps)
        {
            try
            {
                await check();
                checks += 1;
            }
            catch (error)
            {
                log(`FALHOU: ${name}: ${error instanceof CheckFailed ? error.message : `resposta / ${error.message}`}`);
                ok = false;
                break;
            }
        }
    }
    finally
    {
        if (token)
        {
            const status = await call('DELETE', `/users/${encodeURIComponent(username)}`).then((response) => response.status, (error) => error.message);

            if (status !== 204)
            {
                log(`FALHOU: limpeza: 204 / ${status}`);
                ok = false;
            }
        }
    }

    if (ok)
    {
        log(`Regressão OK: ${CHECKS} verificações em ${((now() - start) / 1000).toFixed(1)} s`);
    }

    return { ok, checks };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    const [baseUrl] = process.argv.slice(2);

    if (!baseUrl)
    {
        console.log('Uso: node regression.mjs <url base>');
        process.exit(1);
    }

    const { ok } = await runSuite(baseUrl.replace(/\/$/, ''), { commit: process.env.REGRESSION_COMMIT || 'local' });
    process.exit(ok ? 0 : 1);
}
