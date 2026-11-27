#!/usr/bin/env node
//  Waits for the Tests workflow (.github/workflows/tests.yml) of one commit and prints only what an agent needs:
//  the jobs with their result and time, each job's summary (totals, failed test names, coverage) and, on failure,
//  the failed log trimmed to the failing tests. One blocking call: agents never poll `gh run list` or sleep in a loop.
//
//  node scripts/ci-wait.mjs [<commit|branch>] [--workflow tests.yml] [--event push|workflow_dispatch] [--appear 180] [--out <dir>]
//
//  <commit|branch>: default HEAD. A branch name uses origin/<branch> when it exists (what CI runs is what was pushed).
//  --appear: seconds to wait for GitHub to start the run after a push (default 180).
//  --event: only runs started by that event (a sensor run by hand is `workflow_dispatch`); default: the newest run of any event.
//  --out: download every artifact of the run there (coverage JSON, JaCoCo XML, JUnit XML, Playwright report), e.g. for report.html.
//         Without it only the job summaries are fetched, into a temp dir removed at the end.
//  Exit: 0 green, 1 red or cancelled, 3 no run for the commit (not pushed, or a docs-only push skipped by paths-ignore), 2 bad usage.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const run = (command, args, options = {}) =>
    spawnSync(command, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, ...options });

const sleep = (seconds) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, seconds * 1000);

const ANSI = /\x1b\[[0-9;]*[A-Za-z]/g;
const FAILURE = /(✘|✗|×|FAILED|FAIL\b|failed|Error|error:|expected|Expected|Received|assert|not ok|Exception|Caused by|›|at .*\.(kt|js|mjs):\d+|Tests? .* failed|BUILD FAILED|\d+ failed)/;

//  The --log-failed output trimmed: per job and step, the lines that look like a failure (at most `matched`) plus the last `tail` lines
export const trimFailedLog = (log, { matched = 60, tail = 15, total = 250 } = {}) =>
{
    const groups = new Map();
    for (const raw of log.split('\n'))
    {
        const [job, step, ...rest] = raw.split('\t');
        if (rest.length === 0) continue;
        const text = rest.join('\t').replace(ANSI, '').replace(/^﻿?\d{4}-\d\d-\d\dT[\d:.]+Z ?/, '').trimEnd();
        const key = `${job} / ${step}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(text);
    }
    const out = [];
    for (const [key, lines] of groups)
    {
        const keep = new Set();
        let hits = 0;
        lines.forEach((line, index) =>
        {
            if (hits < matched && FAILURE.test(line) && !/^##\[group\]|^##\[endgroup\]/.test(line)) { keep.add(index); hits += 1; }
        });
        for (let index = Math.max(0, lines.length - tail); index < lines.length; index += 1) keep.add(index);
        out.push(`--- ${key}`);
        let last = -1;
        for (const index of [...keep].sort((a, b) => a - b))
        {
            if (last !== -1 && index > last + 1) out.push('  …');
            if (lines[index].trim()) out.push(lines[index]);
            last = index;
        }
    }
    return out.length > total ? [...out.slice(0, total), `… (${out.length - total} more lines: gh run view --log-failed)`].join('\n') : out.join('\n');
};

const duration = ({ startedAt, completedAt }) =>
{
    if (!startedAt || !completedAt) return '';
    const seconds = Math.max(0, Math.round((Date.parse(completedAt) - Date.parse(startedAt)) / 1000));
    return `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`;
};

const resolveCommit = (ref) =>
{
    if (ref !== 'HEAD')
    {
        const remote = run('git', [ 'rev-parse', '--verify', '--quiet', `refs/remotes/origin/${ref}` ]);
        if (remote.status === 0) return remote.stdout.trim();
    }
    const local = run('git', [ 'rev-parse', '--verify', '--quiet', `${ref}^{commit}` ]);
    if (local.status !== 0) throw new Error(`unknown commit or branch: ${ref}`);
    return local.stdout.trim();
};

const findRun = (workflow, sha, event) =>
{
    const filter = event ? [ '--event', event ] : [];
    const list = run('gh', [ 'run', 'list', '--workflow', workflow, '--commit', sha, ...filter, '--limit', '5', '--json', 'databaseId,createdAt' ]);
    if (list.status !== 0) throw new Error(`gh run list failed: ${list.stderr.trim()}`);
    const runs = JSON.parse(list.stdout || '[]').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return runs[0]?.databaseId;
};

const printSummaries = (id, dir, everything) =>
{
    const download = run('gh', [ 'run', 'download', String(id), ...(everything ? [] : [ '--pattern', 'summary-*' ]), '--dir', dir ]);
    if (download.status !== 0) { console.log(`(no artifacts downloaded: ${download.stderr.trim()})`); return; }
    if (everything) console.log(`Artifacts of run ${id} saved in ${dir}
`);
    for (const name of readdirSync(dir).filter((entry) => entry.startsWith('summary-')).sort())
    {
        const folder = join(dir, name);
        if (!statSync(folder).isDirectory()) continue;
        const file = join(folder, 'summary.md');
        if (existsSync(file)) console.log(readFileSync(file, 'utf8').trim(), '\n');
    }
};

export const parseArgs = (argv) =>
{
    const options = { ref: 'HEAD', workflow: 'tests.yml', event: null, appear: 180, out: null };
    for (let i = 0; i < argv.length; i += 1)
    {
        const arg = argv[i];
        if ([ '--workflow', '--event', '--appear', '--out' ].includes(arg))
        {
            const value = argv[++i];
            if (value === undefined) throw new Error(`missing value for ${arg}`);
            options[arg.slice(2)] = arg === '--appear' ? Number(value) : value;
        }
        else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
        else options.ref = arg;
    }
    if (!Number.isFinite(options.appear) || options.appear < 0) throw new Error('--appear must be a number of seconds');
    return options;
};

const main = (argv) =>
{
    const { ref, workflow, event, appear, out } = parseArgs(argv);
    const sha = resolveCommit(ref);

    let id = findRun(workflow, sha, event);
    for (let waited = 0; !id && waited < appear; waited += 10)
    {
        sleep(10);
        id = findRun(workflow, sha, event);
    }
    if (!id)
    {
        console.log(`No ${workflow} run for ${sha.slice(0, 10)} after ${appear}s: the commit is not pushed, or every file it changes is in paths-ignore (docs/specs only).`);
        return 3;
    }

    //  The live table of `gh run watch` is noise for an agent; only its exit status matters
    run('gh', [ 'run', 'watch', String(id), '--exit-status', '--interval', '20' ], { stdio: [ 'ignore', 'ignore', 'inherit' ] });

    const view = run('gh', [ 'run', 'view', String(id), '--json', 'conclusion,url,headBranch,jobs' ]);
    if (view.status !== 0) throw new Error(`gh run view failed: ${view.stderr.trim()}`);
    const { conclusion, url, headBranch, jobs } = JSON.parse(view.stdout);

    console.log(`${workflow} ${conclusion?.toUpperCase() ?? '?'} for ${sha.slice(0, 10)} (${headBranch}), run ${id}: ${url}`);
    for (const job of jobs) console.log(`- ${job.name}: ${job.conclusion || job.status} ${duration(job)}`);
    console.log('');

    const dir = out ?? mkdtempSync(join(tmpdir(), 'ci-wait-'));
    try { printSummaries(id, dir, Boolean(out)); }
    finally { if (!out) rmSync(dir, { recursive: true, force: true }); }

    if (conclusion === 'success') return 0;
    const failed = run('gh', [ 'run', 'view', String(id), '--log-failed' ]);
    if (failed.status === 0 && failed.stdout.trim()) console.log(`Failed log (trimmed):\n${trimFailedLog(failed.stdout)}`);
    return 1;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
{
    try { process.exitCode = main(process.argv.slice(2)); }
    catch (error)
    {
        console.error(error.message);
        process.exitCode = 2;
    }
}
