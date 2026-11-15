import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyMutant, MutantError, runSensor, summary } from './sensor.mjs';

const workspace = (files) =>
{
    const root = mkdtempSync(join(tmpdir(), 'sensor-'));
    for (const [ name, content ] of Object.entries(files)) writeFileSync(join(root, name), content);
    return root;
};
const clean = () => '';

test('applyMutant replaces the only match', () =>
{
    assert.equal(applyMutant('a > b', { find: '>', replace: '>=' }), 'a >= b');
});

test('applyMutant replaces the chosen occurrence', () =>
{
    assert.equal(applyMutant('x; x; x', { find: 'x', replace: 'y', occurrence: 2 }), 'x; y; x');
});

test('applyMutant refuses a missing, ambiguous or out of range match', () =>
{
    assert.throws(() => applyMutant('abc', { find: 'z', replace: '' }), MutantError);
    assert.throws(() => applyMutant('x x', { find: 'x', replace: '' }), /found 2 times/);
    assert.throws(() => applyMutant('x x', { find: 'x', replace: '', occurrence: 3 }), /out of range/);
    assert.throws(() => applyMutant('x', { find: '', replace: '' }), MutantError);
});

test('a failing command kills the mutant and the file is restored', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    let seen;
    const { results, isolated } = runSensor({
        root,
        porcelain: clean,
        mutants: [ { id: 'M1', file: 'a.js', find: '1', replace: '0', run: 'test' } ],
        run: () => { seen = readFileSync(join(root, 'a.js'), 'utf8'); return 'failed'; }
    });
    assert.equal(seen, 'return 0;');
    assert.equal(results[0].outcome, 'killed');
    assert.equal(readFileSync(join(root, 'a.js'), 'utf8'), 'return 1;');
    assert.equal(isolated, true);
});

test('a passing command means the mutant survived', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    const outcome = runSensor({ root, porcelain: clean, run: () => 'passed', mutants: [ { id: 'M1', file: 'a.js', find: '1', replace: '0', run: 't' } ] });
    assert.equal(outcome.results[0].outcome, 'survived');
    assert.equal(summary(outcome).exitCode, 1);
});

test('a timeout counts as killed and is labelled', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    const outcome = runSensor({ root, porcelain: clean, run: () => 'timeout', mutants: [ { id: 'M1', file: 'a.js', find: '1', replace: '0', run: 't' } ] });
    assert.equal(outcome.results[0].outcome, 'killed (timeout)');
    assert.equal(summary(outcome).exitCode, 0);
});

test('the file is restored when the runner throws', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    assert.throws(() => runSensor({
        root,
        porcelain: clean,
        run: () => { throw new Error('boom'); },
        mutants: [ { id: 'M1', file: 'a.js', find: '1', replace: '0', run: 't' } ]
    }), /boom/);
    assert.equal(readFileSync(join(root, 'a.js'), 'utf8'), 'return 1;');
});

test('a bad mutant is invalid, the others still run, and the exit code is 2', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    const outcome = runSensor({
        root,
        porcelain: clean,
        run: () => 'failed',
        mutants: [
            { id: 'M1', file: 'a.js', find: 'nope', replace: '', run: 't' },
            { id: 'M2', file: 'a.js', find: '1', replace: '2', run: 't' }
        ]
    });
    assert.match(outcome.results[0].outcome, /^invalid: /);
    assert.equal(outcome.results[1].outcome, 'killed');
    assert.equal(summary(outcome).exitCode, 2);
});

test('a tree that changed during the run breaks isolation', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    let calls = 0;
    const outcome = runSensor({
        root,
        porcelain: () => (calls++ === 0 ? '' : ' M other.js'),
        run: () => 'failed',
        mutants: [ { id: 'M1', file: 'a.js', find: '1', replace: '0', run: 't' } ]
    });
    assert.equal(outcome.isolated, false);
    assert.equal(summary(outcome).exitCode, 2);
});

test('repeated ids are refused before any file changes', () =>
{
    const root = workspace({ 'a.js': 'return 1;' });
    assert.throws(() => runSensor({
        root,
        porcelain: clean,
        run: () => 'failed',
        mutants: [ { id: 'M1', file: 'a.js', find: '1', replace: '0', run: 't' }, { id: 'M1', file: 'a.js', find: '1', replace: '2', run: 't' } ]
    }), /repeated id/);
    assert.equal(readFileSync(join(root, 'a.js'), 'utf8'), 'return 1;');
});
