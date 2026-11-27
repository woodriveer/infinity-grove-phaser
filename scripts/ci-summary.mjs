#!/usr/bin/env node
//  Markdown summary of one CI job (.github/workflows/tests.yml), written for $GITHUB_STEP_SUMMARY and the job's summary artifact,
//  so an agent reads totals, failed test names and coverage with scripts/ci-wait.mjs instead of downloading logs.
//
//  node scripts/ci-summary.mjs --title <job> [--junit <file|dir>]... [--jacoco <xml>] [--istanbul <coverage-summary.json>] [--lcov <lcov.info>] [--out <summary.md>]
//
//  Without --out the markdown goes to stdout. With --out it is written to that file and appended to $GITHUB_STEP_SUMMARY (when set),
//  and stdout gets a one-line `::notice` (or `::error` when a test failed) that `gh run view` shows as an annotation.
//  A missing report file is reported as "not produced" (the suite did not get that far), never as zero.

import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (text) => text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (whole, code) =>
{
    if (code[0] !== '#') return ENTITIES[code] ?? whole;
    return String.fromCodePoint(code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1)));
});

const attributes = (text) =>
{
    const found = {};
    for (const [, name, value] of text.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) found[name] = decode(value);
    return found;
};

//  Every <testcase> of a JUnit XML: { name, suite, outcome: passed | failed | skipped, message }
export const parseJunit = (xml) =>
{
    const cases = [];
    for (const [, head, body = ''] of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g))
    {
        const { name = '?', classname = '' } = attributes(head);
        const problem = body.match(/<(failure|error)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/);
        const skipped = /<skipped\b/.test(body);
        let message = '';
        if (problem)
        {
            const { message: attr = '' } = attributes(problem[2]);
            const text = attr || decode((problem[3] ?? '').replace(/<!\[CDATA\[|\]\]>/g, ''));
            message = text.split('\n').map((line) => line.trim()).find((line) => line) ?? '';
        }
        cases.push({ name, suite: classname, outcome: problem ? 'failed' : skipped ? 'skipped' : 'passed', message });
    }
    return cases;
};

//  The report-level LINE and BRANCH counters of a JaCoCo XML, as { lines, branches } percentages
export const parseJacoco = (xml) =>
{
    const tail = xml.slice(Math.max(0, xml.lastIndexOf('</package>')));
    const pct = (type) =>
    {
        const counter = tail.match(new RegExp(`<counter type="${type}" missed="(\\d+)" covered="(\\d+)"`));
        if (!counter) return null;
        const [missed, covered] = [Number(counter[1]), Number(counter[2])];
        return missed + covered === 0 ? 100 : (100 * covered) / (missed + covered);
    };
    return { lines: pct('LINE'), branches: pct('BRANCH') };
};

//  The totals of an istanbul / v8 coverage-summary.json
export const parseIstanbul = (json) =>
{
    const { total } = JSON.parse(json);
    return { lines: total?.lines?.pct ?? null, branches: total?.branches?.pct ?? null };
};

//  The sums of LF/LH and BRF/BRH over every file of an lcov report
export const parseLcov = (text) =>
{
    const sum = (key) => [...text.matchAll(new RegExp(`^${key}:(\\d+)`, 'gm'))].reduce((total, [, n]) => total + Number(n), 0);
    const pct = (found, hit) => (found === 0 ? null : (100 * hit) / found);
    return { lines: pct(sum('LF'), sum('LH')), branches: pct(sum('BRF'), sum('BRH')) };
};

//  The file system the summary reads; tests pass their own
const disk = {
    read: (path) => readFileSync(path, 'utf8'),
    exists: (path) => existsSync(path),
    xmlFiles: (path) => (statSync(path).isDirectory()
        ? readdirSync(path).filter((name) => name.endsWith('.xml')).map((name) => join(path, name))
        : [ path ])
};

const percent = (value) => (value === null || value === undefined ? 'n/a' : `${Number(value).toFixed(2)}%`);

export const summarize = ({ title, junit = [], jacoco, istanbul, lcov }, io = disk) =>
{
    const lines = [`### ${title}`, ''];
    let cases = [];
    const missing = [];
    for (const path of junit)
    {
        const files = io.exists(path) ? io.xmlFiles(path) : [];
        if (files.length === 0) missing.push(path);
        else for (const file of files) cases = cases.concat(parseJunit(io.read(file)));
    }

    const count = (outcome) => cases.filter((c) => c.outcome === outcome).length;
    const failed = cases.filter((c) => c.outcome === 'failed');
    let headline;
    if (junit.length > 0)
    {
        headline = missing.length === junit.length
            ? 'tests: report not produced'
            : `tests: ${cases.length} total, ${count('passed')} passed, ${failed.length} failed, ${count('skipped')} skipped`;
        lines.push(`**Tests**: ${headline.replace(/^tests: /, '')}`);
        for (const path of missing) lines.push(`- report not produced: \`${path}\``);
    }

    const coverage = [];
    const addCoverage = (label, path, parse) =>
    {
        if (!path) return;
        if (!io.exists(path)) { coverage.push(`${label}: not produced`); return; }
        const { lines: l, branches: b } = parse(io.read(path));
        coverage.push(`${label}: lines ${percent(l)}, branches ${percent(b)}`);
    };
    addCoverage('JaCoCo', jacoco, parseJacoco);
    addCoverage('Coverage', istanbul, parseIstanbul);
    addCoverage('Coverage (lcov)', lcov, parseLcov);
    for (const entry of coverage) lines.push(`**${entry.replace(':', '**:')}`);

    if (failed.length > 0)
    {
        lines.push('', '**Failed tests**:', '');
        for (const c of failed.slice(0, 50))
            lines.push(`- \`${c.suite ? `${c.suite} › ` : ''}${c.name}\`${c.message ? `: ${c.message.slice(0, 300)}` : ''}`);
        if (failed.length > 50) lines.push(`- … and ${failed.length - 50} more`);
    }

    const oneLine = [headline, ...coverage].filter(Boolean).join('; ');
    const level = failed.length > 0 || (junit.length > 0 && missing.length === junit.length) ? 'error' : 'notice';
    return { markdown: `${lines.join('\n')}\n`, annotation: `::${level} title=${title}::${oneLine}`, failed: failed.length };
};

export const parseArgs = (argv) =>
{
    const options = { junit: [] };
    for (let i = 0; i < argv.length; i += 2)
    {
        const [flag, value] = [argv[i], argv[i + 1]];
        if (value === undefined) throw new Error(`missing value for ${flag}`);
        if (flag === '--junit') options.junit.push(value);
        else if ([ '--title', '--jacoco', '--istanbul', '--lcov', '--out' ].includes(flag)) options[flag.slice(2)] = value;
        else throw new Error(`unknown option ${flag}`);
    }
    if (!options.title) throw new Error('usage: node scripts/ci-summary.mjs --title <job> [--junit <file|dir>]... [--jacoco <xml>] [--istanbul <json>] [--lcov <file>]');
    return options;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
{
    try
    {
        const options = parseArgs(process.argv.slice(2));
        const { markdown, annotation } = summarize(options);
        if (!options.out) process.stdout.write(markdown);
        else
        {
            mkdirSync(dirname(options.out), { recursive: true });
            writeFileSync(options.out, markdown);
            if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
            console.log(annotation);
        }
    }
    catch (error)
    {
        console.error(error.message);
        process.exitCode = 2;
    }
}
