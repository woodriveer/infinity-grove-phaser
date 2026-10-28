import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rollback, sweepPrevious } from './previous.mjs';
import { renderConf } from './proxy.mjs';

const OLD = 'aaaaaaa1111111111111111111111111111111111';
const NEW = 'bbbbbbb2222222222222222222222222222222222';
const STOPPED_AT = 1_000_000;
const STATE = {
    active: { slot: 'green', commit: NEW },
    previous: { slot: 'blue', commit: OLD, stoppedAt: STOPPED_AT },
    handled: NEW,
    tunnel: null
};

const repo = () =>
{
    const root = mkdtempSync(join(tmpdir(), 'deploy-previous-'));
    mkdirSync(join(root, 'deploy', 'nginx'), { recursive: true });
    writeFileSync(join(root, 'deploy', 'nginx', 'default.conf'), renderConf('green'));

    return root;
};

//  Commands and sleeps on one timeline; a command matching a failing pattern exits 1
const machine = ({ failing = [], ready = true, time = STOPPED_AT + 60000 } = {}) =>
{
    const timeline = [];
    const lines = [];
    const exec = (command, args) =>
    {
        const line = [command, ...args].join(' ');
        timeline.push(line);

        return { status: failing.some((pattern) => line.includes(pattern)) ? 1 : 0, stdout: '', stderr: '' };
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

    return { timeline, lines, deps: { exec, fetch, sleep, now: () => time, log: (line) => lines.push(line), state: STATE } };
};

test('the sweep keeps a previous slot stopped 4 min 59 s ago', () =>
{
    const { timeline, deps } = machine({ time: STOPPED_AT + 299000 });

    assert.deepEqual(sweepPrevious({ ...deps, root: repo() }), STATE);
    assert.deepEqual(timeline, []);
});

test('the sweep removes the previous container and its image at 5 min', () =>
{
    const { timeline, deps } = machine({ time: STOPPED_AT + 300000 });

    assert.deepEqual(sweepPrevious({ ...deps, root: repo() }), { ...STATE, previous: null });
    assert.deepEqual(timeline, [
        'docker compose -f backend/docker-compose.yml --profile deploy rm -sf backend-blue',
        'docker image rm infinity-grove-backend:aaaaaaa'
    ]);
});

test('the sweep does nothing without a previous slot', () =>
{
    const { timeline, deps } = machine({ time: STOPPED_AT + 900000 });
    const state = { ...STATE, previous: null };

    assert.equal(sweepPrevious({ ...deps, root: repo(), state }), state);
    assert.deepEqual(timeline, []);
});

test('a rollback starts the previous container, waits for 401, switches, stops the other slot and keeps handled', async () =>
{
    const root = repo();
    const { timeline, lines, deps } = machine();

    const { ok, state } = await rollback({ ...deps, root });

    assert.equal(ok, true);
    assert.deepEqual(lines, ['Rollback para aaaaaaa no slot blue']);
    assert.deepEqual(timeline, [
        'docker container inspect infinity-grove-backend-blue',
        'docker start infinity-grove-backend-blue',
        'fetch http://127.0.0.1:18081/progress',
        'docker exec infinity-grove-proxy nginx -t',
        'docker exec infinity-grove-proxy nginx -s reload',
        'sleep 10000',
        'docker stop infinity-grove-backend-green'
    ]);
    assert.equal(readFileSync(join(root, 'deploy', 'nginx', 'default.conf'), 'utf8'), renderConf('blue'));
    assert.deepEqual(state, {
        active: { slot: 'blue', commit: OLD },
        previous: { slot: 'green', commit: NEW, stoppedAt: STOPPED_AT + 70000 },
        handled: NEW,
        tunnel: null
    });
});

test('with no previous container the rollback returns false with its text and starts nothing', async () =>
{
    const { timeline, lines, deps } = machine({ failing: ['container inspect'] });

    const { ok, state } = await rollback({ ...deps, root: repo() });

    assert.equal(ok, false);
    assert.deepEqual(lines, ['Sem versão anterior para voltar (removida após 5 min)']);
    assert.equal(state, STATE);
    assert.deepEqual(timeline, ['docker container inspect infinity-grove-backend-blue']);
});

test('with no previous slot in the state the rollback returns false with the same text', async () =>
{
    const { timeline, lines, deps } = machine();
    const state = { ...STATE, previous: null };

    const result = await rollback({ ...deps, root: repo(), state });

    assert.equal(result.ok, false);
    assert.deepEqual(lines, ['Sem versão anterior para voltar (removida após 5 min)']);
    assert.deepEqual(timeline, []);
});

test('a previous slot that does not come up leaves the proxy and the active slot alone', async () =>
{
    const root = repo();
    const { timeline, lines, deps } = machine({ ready: false });

    const { ok, state } = await rollback({ ...deps, root });

    assert.equal(ok, false);
    assert.deepEqual(lines, ['Rollback para aaaaaaa falhou: o backend não ficou pronto em 180 s']);
    assert.equal(state, STATE);
    assert.deepEqual(timeline.filter((line) => line.includes('docker stop')), ['docker stop infinity-grove-backend-blue']);
    assert.deepEqual(timeline.filter((line) => line.includes('infinity-grove-proxy')), []);
    assert.equal(readFileSync(join(root, 'deploy', 'nginx', 'default.conf'), 'utf8'), renderConf('green'));
});

test('a failed switch stops the previous slot again and keeps the active one', async () =>
{
    const root = repo();
    const { timeline, lines, deps } = machine({ failing: ['nginx -t'] });

    const { ok, state } = await rollback({ ...deps, root });

    assert.equal(ok, false);
    assert.deepEqual(lines, ['Rollback para aaaaaaa falhou na troca do proxy; o slot green continua ativo']);
    assert.equal(state, STATE);
    assert.deepEqual(timeline.filter((line) => line.includes('docker stop')), ['docker stop infinity-grove-backend-blue']);
    assert.equal(readFileSync(join(root, 'deploy', 'nginx', 'default.conf'), 'utf8'), renderConf('green'));
});
