import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { acquireLock, clearStaleLock, readState, releaseLock, writeState } from './state.mjs';

let dir;

beforeEach(() =>
{
    dir = mkdtempSync(join(tmpdir(), 'deploy-state-'));
});

test('a missing state file reads null', () =>
{
    assert.equal(readState(join(dir, '.deploy-state')), null);
});

test('a written state reads back with every field', () =>
{
    const file = join(dir, '.deploy-state');
    const state = {
        active: { slot: 'green', commit: 'b'.repeat(40) },
        previous: { slot: 'blue', commit: 'a'.repeat(40), stoppedAt: 1761638400000 },
        handled: 'c'.repeat(40),
        tunnel: 'https://example-words.trycloudflare.com'
    };

    writeState(file, state);

    assert.deepEqual(readState(file), state);
});

test('a state with no previous slot and no tunnel keeps the nulls', () =>
{
    const file = join(dir, '.deploy-state');
    const state = { active: { slot: 'blue', commit: 'a'.repeat(40) }, previous: null, handled: 'a'.repeat(40), tunnel: null };

    writeState(file, state);

    assert.deepEqual(readState(file), state);
});

test('a second lock is refused until the first is released', () =>
{
    const lock = join(dir, '.deploy.lock');

    assert.equal(acquireLock(lock), true);
    assert.equal(acquireLock(lock), false);

    releaseLock(lock);

    assert.equal(acquireLock(lock), true);
});

test('clearing a stale lock frees it', () =>
{
    const lock = join(dir, '.deploy.lock');
    acquireLock(lock);

    assert.equal(clearStaleLock(lock), true);
    assert.equal(acquireLock(lock), true);
});

test('clearing when there is no lock reports none', () =>
{
    assert.equal(clearStaleLock(join(dir, '.deploy.lock')), false);
});
