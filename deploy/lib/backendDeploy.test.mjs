import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deployBackend } from './backendDeploy.mjs';
import { renderConf } from './proxy.mjs';

const OLD = 'aaaaaaa1111111111111111111111111111111111';
const NEW = 'bbbbbbb2222222222222222222222222222222222';
const STATE = {
    active: { slot: 'blue', commit: OLD },
    previous: null,
    handled: OLD,
    tunnel: 'https://x.trycloudflare.com'
};

//  A repo root with the proxy conf of the active slot and a working tree suite
const repo = () =>
{
    const root = mkdtempSync(join(tmpdir(), 'deploy-backend-'));
    mkdirSync(join(root, 'deploy', 'nginx'), { recursive: true });
    writeFileSync(join(root, 'deploy', 'nginx', 'default.conf'), renderConf('blue'));
    writeFileSync(join(root, 'deploy', 'regression.mjs'), '//\n');

    return root;
};

//  The machine as fakes: every command and every sleep goes on one timeline; a command matching a failing pattern exits 1
const machine = ({ failing = [], ready = true } = {}) =>
{
    const timeline = [];
    let time = 1_000_000;
    const exec = (command, args) =>
    {
        const line = [command, ...args].join(' ');
        timeline.push(line);
        const failed = failing.some((pattern) => line.includes(pattern));

        return { status: failed ? 1 : 0, stdout: command === 'git' ? Buffer.from('x') : '', stderr: '' };
    };
    const fetch = async (url) =>
    {
        timeline.push(`fetch ${url}`);

        if (!ready)
        {
            throw new TypeError('fetch failed');
        }

        return { status: 401 };
    };
    const sleep = async (ms) =>
    {
        timeline.push(`sleep ${ms}`);
        time += ms;
    };
    const lines = [];

    return { timeline, lines, deps: { exec, fetch, sleep, now: () => time, log: (line) => lines.push(line), hash: NEW, state: STATE } };
};

const commands = (timeline, part) => timeline.filter((line) => line.includes(part));

test('a passing deploy switches to the idle slot, drains 10 s, stops the old slot and records the state', async () =>
{
    const root = repo();
    const { timeline, lines, deps } = machine();

    const { ok, state } = await deployBackend({ ...deps, root });

    assert.equal(ok, true);
    assert.deepEqual(lines, ['Deploy bbbbbbb ativo no slot green']);
    assert.deepEqual(timeline, [
        `git archive --format=tar ${NEW}:backend`,
        'docker build -t infinity-grove-backend:bbbbbbb -',
        'docker compose -f backend/docker-compose.yml --profile deploy up -d --no-deps --force-recreate backend-green',
        'fetch http://127.0.0.1:18082/progress',
        `git show ${NEW}:deploy/regression.mjs`,
        timeline[5],
        'docker exec infinity-grove-proxy nginx -t',
        'docker exec infinity-grove-proxy nginx -s reload',
        'sleep 10000',
        'docker stop infinity-grove-backend-blue'
    ]);
    assert.match(timeline[5], /^docker run --rm --name infinity-grove-regression-bbbbbbb .* http:\/\/backend-green:8080$/);
    assert.equal(readFileSync(join(root, 'deploy', 'nginx', 'default.conf'), 'utf8'), renderConf('green'));
    assert.deepEqual(state, {
        active: { slot: 'green', commit: NEW },
        previous: { slot: 'blue', commit: OLD, stoppedAt: 1_010_000 },
        handled: NEW,
        tunnel: 'https://x.trycloudflare.com'
    });
});

test('a deploy from green goes to blue', async () =>
{
    const { lines, deps } = machine();
    const state = { ...STATE, active: { slot: 'green', commit: OLD } };

    const result = await deployBackend({ ...deps, root: repo(), state });

    assert.deepEqual(lines, ['Deploy bbbbbbb ativo no slot blue']);
    assert.deepEqual(result.state.active, { slot: 'blue', commit: NEW });
    assert.equal(result.state.previous.slot, 'green');
});

const failures = [
    {
        name: 'a build failure',
        options: { failing: ['docker build'] },
        line: 'Deploy bbbbbbb falhou no build da imagem',
        removed: false
    },
    {
        name: 'a readiness timeout',
        options: { ready: false },
        line: 'Deploy bbbbbbb falhou: o backend não ficou pronto em 180 s',
        removed: true
    },
    {
        name: 'a failed suite',
        options: { failing: ['docker run'] },
        line: 'Deploy bbbbbbb falhou na regressão; o slot blue continua ativo',
        removed: true
    },
    {
        name: 'a failed switch',
        options: { failing: ['nginx -t'] },
        line: 'Deploy bbbbbbb falhou na troca do proxy; o slot blue continua ativo',
        removed: true
    }
];

for (const failure of failures)
{
    test(`${failure.name} logs its text, keeps the active slot and the proxy, and sets only handled`, async () =>
    {
        const root = repo();
        const { timeline, lines, deps } = machine(failure.options);

        const { ok, state } = await deployBackend({ ...deps, root });

        assert.equal(ok, false);
        assert.deepEqual(lines, [failure.line]);
        assert.deepEqual(state, { ...STATE, handled: NEW });
        assert.deepEqual(commands(timeline, 'docker stop'), []);
        assert.deepEqual(commands(timeline, 'nginx -s reload'), []);
        assert.equal(readFileSync(join(root, 'deploy', 'nginx', 'default.conf'), 'utf8'), renderConf('blue'));
        assert.deepEqual(
            commands(timeline, ' rm -sf '),
            failure.removed ? ['docker compose -f backend/docker-compose.yml --profile deploy rm -sf backend-green'] : []
        );
    });
}

test('a readiness timeout gives up at 180 s and runs no suite', async () =>
{
    const { timeline, deps } = machine({ ready: false });
    const start = deps.now();

    await deployBackend({ ...deps, root: repo() });

    assert.equal(deps.now() - start, 180000);
    assert.deepEqual(commands(timeline, 'docker run'), []);
});

test('a failed suite never touches the proxy', async () =>
{
    const { timeline, deps } = machine({ failing: ['docker run'] });

    await deployBackend({ ...deps, root: repo() });

    assert.deepEqual(commands(timeline, 'infinity-grove-proxy'), []);
});

//  A deploy within 5 min of the last one lands in the slot still kept as previous: that container is recreated, so its image goes too
test('a deploy into the slot kept as previous removes that older image', async () =>
{
    const PREV = 'ccccccc3333333333333333333333333333333333';
    const { timeline, deps } = machine();
    const state = { ...STATE, previous: { slot: 'green', commit: PREV, stoppedAt: 999_000 } };

    const result = await deployBackend({ ...deps, root: repo(), state });

    assert.deepEqual(commands(timeline, 'docker image rm'), ['docker image rm infinity-grove-backend:ccccccc']);
    assert.deepEqual(result.state.previous, { slot: 'blue', commit: OLD, stoppedAt: 1_010_000 });
});

test('a deploy of the commit kept as previous keeps its image', async () =>
{
    const { timeline, deps } = machine();
    const state = { ...STATE, previous: { slot: 'green', commit: NEW, stoppedAt: 999_000 } };

    await deployBackend({ ...deps, root: repo(), state });

    assert.deepEqual(commands(timeline, 'docker image rm'), []);
});
