import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, trimFailedLog } from './ci-wait.mjs';

test('the failed log keeps the failure lines and the tail of each step, without timestamps or colours', () =>
{
    const noise = Array.from({ length: 40 }, (_, i) => `e2e\tRun\t2026-11-27T10:00:${String(i).padStart(2, '0')}.0000000Z downloading chunk ${i}`);
    const log = [
        ...noise.slice(0, 20),
        'e2e\tRun\t2026-11-27T10:01:00.0000000Z \x1b[31m  ✘  3 [chromium] › e2e/shop.spec.js:12 › buys a sword\x1b[0m',
        ...noise.slice(20),
        'e2e\tRun\t2026-11-27T10:02:00.0000000Z   1 failed'
    ].join('\n');
    const trimmed = trimFailedLog(log, { tail: 3 }).split('\n');
    assert.equal(trimmed[0], '--- e2e / Run');
    assert.ok(trimmed.includes('  ✘  3 [chromium] › e2e/shop.spec.js:12 › buys a sword'));
    assert.ok(trimmed.includes('  1 failed'));
    assert.ok(!trimmed.some((line) => line.includes('chunk 5')));
    assert.ok(trimmed.length < 10);
});

test('a very long failed log is cut with a pointer to the full one', () =>
{
    const log = Array.from({ length: 500 }, (_, i) => `backend\tTest\t2026-11-27T10:00:00.0000000Z FAILED test ${i}`).join('\n');
    const trimmed = trimFailedLog(log, { matched: 1000, total: 50 }).split('\n');
    assert.equal(trimmed.length, 51);
    assert.match(trimmed.at(-1), /more lines: gh run view --log-failed/);
});

test('the ref is positional and the options take values', () =>
{
    assert.deepEqual(parseArgs([]), { ref: 'HEAD', workflow: 'tests.yml', appear: 180, out: null });
    assert.deepEqual(parseArgs([ 'ci/x', '--appear', '30', '--out', 'd' ]), { ref: 'ci/x', workflow: 'tests.yml', appear: 30, out: 'd' });
    assert.throws(() => parseArgs([ '--appear' ]), /missing value/);
    assert.throws(() => parseArgs([ '--nope' ]), /unknown option/);
});
