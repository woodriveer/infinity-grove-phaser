import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLOTS, buildImage, imageOf, otherSlot, removeImage, removeSlot, slotExists, startSlot, stopSlot, waitReady } from './slots.mjs';

const HASH = '0123456789abcdef0123456789abcdef01234567';
const ROOT = '/repo';

//  A fake exec that records every call and answers from the given handler
const fakeExec = (answer = () => ({ status: 0, stdout: '', stderr: '' })) =>
{
    const calls = [];
    const exec = (command, args, options = {}) =>
    {
        calls.push({ command, args, options });

        return answer(command, args, options);
    };

    return { exec, calls };
};

test('the slots use ports 18081 and 18082 and swap with each other', () =>
{
    assert.deepEqual(SLOTS, { blue: { port: 18081 }, green: { port: 18082 } });
    assert.equal(otherSlot('blue'), 'green');
    assert.equal(otherSlot('green'), 'blue');
});

test('the image is tagged with the short hash', () =>
{
    assert.equal(imageOf(HASH), 'infinity-grove-backend:0123456');
});

test('buildImage pipes the git archive of the commit backend tree into docker build', () =>
{
    const tar = Buffer.from('tar bytes');
    const { exec, calls } = fakeExec((command) => ({ status: 0, stdout: command === 'git' ? tar : '', stderr: '' }));

    assert.equal(buildImage(exec, ROOT, HASH), true);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].command, 'git');
    assert.deepEqual(calls[0].args, ['archive', '--format=tar', `${HASH}:backend`]);
    assert.equal(calls[0].options.cwd, ROOT);
    assert.equal(calls[0].options.encoding, 'buffer');
    assert.equal(calls[1].command, 'docker');
    assert.deepEqual(calls[1].args, ['build', '-t', 'infinity-grove-backend:0123456', '-']);
    assert.equal(calls[1].options.input, tar);
});

test('buildImage fails when git archive fails, without building', () =>
{
    const { exec, calls } = fakeExec((command) => ({ status: command === 'git' ? 128 : 0, stdout: '', stderr: '' }));

    assert.equal(buildImage(exec, ROOT, HASH), false);
    assert.equal(calls.length, 1);
});

test('buildImage fails when docker build fails', () =>
{
    const { exec } = fakeExec((command) => ({ status: command === 'docker' ? 1 : 0, stdout: Buffer.alloc(0), stderr: '' }));

    assert.equal(buildImage(exec, ROOT, HASH), false);
});

test('startSlot sets the slot image and recreates only that service', () =>
{
    const { exec, calls } = fakeExec();

    assert.equal(startSlot(exec, ROOT, 'green', 'infinity-grove-backend:0123456'), true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].command, 'docker');
    assert.deepEqual(calls[0].args, [
        'compose', '-f', 'backend/docker-compose.yml', '--profile', 'deploy',
        'up', '-d', '--no-deps', '--force-recreate', 'backend-green'
    ]);
    assert.deepEqual(calls[0].options.env, { GREEN_IMAGE: 'infinity-grove-backend:0123456' });
    assert.equal(calls[0].options.cwd, ROOT);
});

test('startSlot of blue sets BLUE_IMAGE', () =>
{
    const { exec, calls } = fakeExec();

    startSlot(exec, ROOT, 'blue', 'infinity-grove-backend:abc1234');

    assert.deepEqual(calls[0].options.env, { BLUE_IMAGE: 'infinity-grove-backend:abc1234' });
    assert.equal(calls[0].args.at(-1), 'backend-blue');
});

test('startSlot fails when compose fails', () =>
{
    const { exec } = fakeExec(() => ({ status: 1, stdout: '', stderr: '' }));

    assert.equal(startSlot(exec, ROOT, 'green', 'x'), false);
});

test('stop, remove, exists and image removal name the slot container and the image', () =>
{
    const { exec, calls } = fakeExec();

    assert.equal(stopSlot(exec, 'blue'), true);
    assert.equal(removeSlot(exec, ROOT, 'green'), true);
    assert.equal(slotExists(exec, 'blue'), true);
    assert.equal(removeImage(exec, 'infinity-grove-backend:0123456'), true);

    assert.deepEqual(calls.map((call) => [call.command, ...call.args].join(' ')), [
        'docker stop infinity-grove-backend-blue',
        'docker compose -f backend/docker-compose.yml --profile deploy rm -sf backend-green',
        'docker container inspect infinity-grove-backend-blue',
        'docker image rm infinity-grove-backend:0123456'
    ]);
    assert.equal(calls[1].options.cwd, ROOT);
});

test('slotExists is false when docker has no such container', () =>
{
    const { exec } = fakeExec(() => ({ status: 1, stdout: '', stderr: 'No such container' }));

    assert.equal(slotExists(exec, 'green'), false);
});

//  A fake clock: sleep moves the time forward
const fakeClock = () =>
{
    let time = 0;

    return {
        now: () => time,
        sleep: async (ms) =>
        {
            time += ms;
        }
    };
};

test('waitReady is true on the first 401 of the slot /progress', async () =>
{
    const clock = fakeClock();
    const urls = [];
    const answers = [503, 401, 401];
    const fetch = async (url) =>
    {
        urls.push(url);

        return { status: answers.shift() };
    };

    assert.equal(await waitReady(fetch, 'green', clock), true);
    assert.deepEqual(urls, ['http://127.0.0.1:18082/progress', 'http://127.0.0.1:18082/progress']);
});

test('waitReady keeps polling on a refused connection and on a 5xx', async () =>
{
    const clock = fakeClock();
    let calls = 0;
    const fetch = async () =>
    {
        calls += 1;

        if (calls <= 2)
        {
            throw new TypeError('fetch failed: ECONNREFUSED');
        }

        return { status: calls <= 4 ? 500 : 401 };
    };

    assert.equal(await waitReady(fetch, 'blue', clock), true);
    assert.equal(calls, 5);
    assert.equal(clock.now(), 8000);
});

test('waitReady is false at 180 s', async () =>
{
    const clock = fakeClock();
    const fetch = async () =>
    {
        throw new TypeError('fetch failed');
    };

    assert.equal(await waitReady(fetch, 'green', clock), false);
    assert.equal(clock.now(), 180000);
});

test('waitReady still takes a 401 that comes just before 180 s', async () =>
{
    const clock = fakeClock();
    const fetch = async () => ({ status: clock.now() >= 178000 ? 401 : 502 });

    assert.equal(await waitReady(fetch, 'green', clock), true);
    assert.equal(clock.now(), 178000);
});
