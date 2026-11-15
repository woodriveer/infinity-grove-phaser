#!/usr/bin/env node
//  Discrimination sensor runner (tlc-spec-driven validate.md § 5, file-copy fallback).
//
//  node scripts/sensor.mjs <mutants.json> [--only M1,M2] [--json <out.json>]
//
//  mutants.json: { "mutants": [ {
//      "id": "M9",                               unique id, used in the report
//      "file": "game/public/style.css",          path from the repo root
//      "find": "font-weight: 800;",              exact text to replace
//      "replace": "",                            text put in its place
//      "occurrence": 2,                          optional: which match (1-based) when "find" is not unique
//      "run": "npx vitest run src/x.test.js",    command whose failure kills the mutant
//      "cwd": "game",                            optional: where "run" runs, from the repo root
//      "timeoutSec": 600,                        optional, default 600
//      "note": "gold chip weight"                optional, copied to the report
//  } ] }
//
//  For each mutant: the original bytes of the file are kept in memory, the fault is
//  written, the command runs, and the original bytes are written back (also on an
//  exception, Ctrl+C or SIGTERM). Before the first and after the last mutant the
//  `git status --porcelain` of the repo (graphify-out/ ignored) must match, or the run
//  is invalid. Run it in a checkout no other agent is testing in at the same time.
//
//  Exit: 0 every mutant killed, 1 a mutant survived, 2 invalid run (bad mutant,
//  dirty tree after cleanup, bad arguments).

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export class MutantError extends Error {}

//  The content with the chosen match of `find` replaced, or a MutantError
export const applyMutant = (content, { find, replace, occurrence }) =>
{
    if (typeof find !== 'string' || find === '') throw new MutantError('"find" must be a non-empty string');
    if (typeof replace !== 'string') throw new MutantError('"replace" must be a string');

    const positions = [];
    for (let at = content.indexOf(find); at !== -1; at = content.indexOf(find, at + find.length)) positions.push(at);

    if (positions.length === 0) throw new MutantError(`"${find}" not found`);
    if (occurrence === undefined && positions.length > 1)
        throw new MutantError(`"${find}" found ${positions.length} times; set "occurrence"`);

    const index = (occurrence ?? 1) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= positions.length)
        throw new MutantError(`occurrence ${occurrence} out of range (1 to ${positions.length})`);

    const at = positions[index];
    return content.slice(0, at) + replace + content.slice(at + find.length);
};

const IGNORED = /^.. graphify-out\//;

export const gitPorcelain = (root) =>
{
    const result = spawnSync('git', [ 'status', '--porcelain' ], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new MutantError(`git status failed: ${result.stderr}`);
    return result.stdout.split('\n').filter((line) => line && !IGNORED.test(line)).sort().join('\n');
};

export const shellRun = (command, cwd, timeoutSec) =>
{
    const result = spawnSync(command, { cwd, shell: true, stdio: 'ignore', timeout: timeoutSec * 1000 });
    if (result.error?.code === 'ETIMEDOUT') return 'timeout';
    return result.status === 0 ? 'passed' : 'failed';
};

//  Runs every mutant; `run(command, cwd, timeoutSec)` answers 'passed', 'failed' or 'timeout'
export const runSensor = ({ mutants, root, run = shellRun, porcelain = gitPorcelain, log = () => {} }) =>
{
    const ids = new Set();
    for (const mutant of mutants)
    {
        if (!mutant.id || ids.has(mutant.id)) throw new MutantError(`missing or repeated id "${mutant.id}"`);
        if (!mutant.file || !mutant.run) throw new MutantError(`${mutant.id}: "file" and "run" are required`);
        ids.add(mutant.id);
    }

    const baseline = porcelain(root);
    const results = [];
    let pending = null;
    const restore = () =>
    {
        if (pending) writeFileSync(pending.path, pending.original);
        pending = null;
    };
    const onSignal = (signal) =>
    {
        restore();
        process.exit(signal === 'SIGINT' ? 130 : 143);
    };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);

    try
    {
        for (const mutant of mutants)
        {
            const path = join(root, mutant.file);
            const original = readFileSync(path);
            let outcome;
            try
            {
                const mutated = applyMutant(original.toString('utf8'), mutant);
                pending = { path, original };
                writeFileSync(path, mutated);
                const answer = run(mutant.run, join(root, mutant.cwd ?? '.'), mutant.timeoutSec ?? 600);
                outcome = answer === 'passed' ? 'survived' : answer === 'timeout' ? 'killed (timeout)' : 'killed';
            }
            catch (error)
            {
                if (!(error instanceof MutantError)) throw error;
                outcome = `invalid: ${error.message}`;
            }
            finally
            {
                restore();
            }
            results.push({ id: mutant.id, file: mutant.file, note: mutant.note ?? '', outcome });
            log(`${mutant.id} ${outcome}`);
        }
    }
    finally
    {
        restore();
        process.off('SIGINT', onSignal);
        process.off('SIGTERM', onSignal);
    }

    const isolated = porcelain(root) === baseline;
    return { results, isolated };
};

export const summary = ({ results, isolated }) =>
{
    const killed = results.filter((r) => r.outcome.startsWith('killed')).length;
    const survived = results.filter((r) => r.outcome === 'survived').length;
    const invalid = results.length - killed - survived;
    const rows = results.map((r) => `| ${r.id} | \`${r.file}\` | ${r.note} | ${r.outcome} |`);
    const table = [ '| Mutant | File | Note | Outcome |', '| --- | --- | --- | --- |', ...rows ].join('\n');
    const line = `**Result**: ${results.length} mutants, ${killed} killed, ${survived} survived, ${invalid} invalid; isolation ${isolated ? 'ok' : 'BROKEN'}`;
    const exitCode = !isolated || invalid > 0 ? 2 : survived > 0 ? 1 : 0;
    return { text: `${table}\n\n${line}`, killed, survived, invalid, exitCode };
};

const main = (argv) =>
{
    const args = [ ...argv ];
    const file = args.shift();
    const onlyAt = args.indexOf('--only');
    const jsonAt = args.indexOf('--json');
    if (!file) throw new MutantError('usage: node scripts/sensor.mjs <mutants.json> [--only M1,M2] [--json out.json]');

    const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
    let { mutants } = JSON.parse(readFileSync(resolve(file), 'utf8'));
    if (onlyAt !== -1)
    {
        const only = new Set(args[onlyAt + 1].split(','));
        mutants = mutants.filter((m) => only.has(m.id));
    }

    const outcome = runSensor({ mutants, root, log: (line) => console.error(line) });
    const report = summary(outcome);
    console.log(report.text);
    if (jsonAt !== -1) writeFileSync(resolve(args[jsonAt + 1]), JSON.stringify({ ...outcome, ...report }, null, 2));
    return report.exitCode;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    try
    {
        process.exitCode = main(process.argv.slice(2));
    }
    catch (error)
    {
        console.error(error.message);
        process.exitCode = 2;
    }
}
