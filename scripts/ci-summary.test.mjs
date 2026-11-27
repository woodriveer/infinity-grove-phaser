import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, parseIstanbul, parseJacoco, parseJunit, parseLcov, summarize } from './ci-summary.mjs';

const JUNIT = `<?xml version="1.0"?>
<testsuites>
  <testsuite name="a">
    <testcase name="adds &amp; keeps" classname="MathTest" time="0.1"/>
    <testcase name="fails" classname="MathTest"><failure message="expected 2 but was 3" type="AssertionError">stack</failure></testcase>
    <testcase name="breaks" classname="MathTest"><error type="Boom"><![CDATA[
      boom happened
      at line 1]]></error></testcase>
    <testcase name="later" classname="MathTest"><skipped/></testcase>
  </testsuite>
</testsuites>`;

test('every testcase is read with its outcome and the first line of its failure', () =>
{
    assert.deepEqual(parseJunit(JUNIT), [
        { name: 'adds & keeps', suite: 'MathTest', outcome: 'passed', message: '' },
        { name: 'fails', suite: 'MathTest', outcome: 'failed', message: 'expected 2 but was 3' },
        { name: 'breaks', suite: 'MathTest', outcome: 'failed', message: 'boom happened' },
        { name: 'later', suite: 'MathTest', outcome: 'skipped', message: '' }
    ]);
});

test('the JaCoCo report-level counters are used, not the ones of a package', () =>
{
    const xml = `<report><package name="p"><counter type="LINE" missed="9" covered="1"/></package>
      <counter type="INSTRUCTION" missed="1" covered="1"/><counter type="BRANCH" missed="1" covered="3"/><counter type="LINE" missed="1" covered="9"/></report>`;
    assert.deepEqual(parseJacoco(xml), { lines: 90, branches: 75 });
});

test('istanbul totals and lcov sums give line and branch percentages', () =>
{
    assert.deepEqual(parseIstanbul(JSON.stringify({ total: { lines: { pct: 81.5 }, branches: { pct: 70 } } })), { lines: 81.5, branches: 70 });
    assert.deepEqual(parseLcov('SF:a\nLF:10\nLH:5\nBRF:4\nBRH:4\nend_of_record\nSF:b\nLF:10\nLH:10\nend_of_record\n'), { lines: 75, branches: 100 });
});

test('the summary lists totals, coverage and failed test names, and flags the job with an error annotation', () =>
{
    const files = { 'r/junit.xml': JUNIT, 'c.json': JSON.stringify({ total: { lines: { pct: 50 }, branches: { pct: 25 } } }) };
    const { markdown, annotation, failed } = summarize({ title: 'game-unit', junit: [ 'r/junit.xml' ], istanbul: 'c.json' }, {
        read: (path) => files[path], exists: (path) => path in files, xmlFiles: (path) => [ path ]
    });
    assert.equal(failed, 2);
    assert.match(markdown, /\*\*Tests\*\*: 4 total, 1 passed, 2 failed, 1 skipped/);
    assert.match(markdown, /`MathTest › fails`: expected 2 but was 3/);
    assert.equal(annotation, '::error title=game-unit::tests: 4 total, 1 passed, 2 failed, 1 skipped; Coverage: lines 50.00%, branches 25.00%');
});

test('a report the suite never wrote is "not produced", never zero', () =>
{
    const { markdown, annotation } = summarize({ title: 'e2e', junit: [ 'no/such/file.xml' ], istanbul: 'no/such.json' });
    assert.match(markdown, /\*\*Tests\*\*: report not produced/);
    assert.match(markdown, /\*\*Coverage\*\*: not produced/);
    assert.match(annotation, /^::error /);
});

test('options are read in pairs and --title is required', () =>
{
    assert.deepEqual(parseArgs([ '--title', 'x', '--junit', 'a', '--junit', 'b', '--out', 'o.md' ]), { title: 'x', junit: [ 'a', 'b' ], out: 'o.md' });
    assert.throws(() => parseArgs([ '--junit', 'a' ]), /usage/);
    assert.throws(() => parseArgs([ '--bogus', 'a' ]), /unknown option/);
});
