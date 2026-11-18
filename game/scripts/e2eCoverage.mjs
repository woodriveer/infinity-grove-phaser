//  Runs the Playwright suite against an instrumented dev server and writes the e2e coverage of the game code to coverage/e2e.
//  Usage: npm run test:e2e:coverage [-- [--keep] <playwright args>]   The exit code is the one of Playwright, after the report is written.
//  --keep: do not reset .nyc_output first, so the report covers every part of a suite split across several runs (the first part runs without it). It is not passed on to Playwright.
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const rawDir = '.nyc_output';
const env = { ...process.env, VITE_COVERAGE: 'true', E2E_COVERAGE_DIR: rawDir };

const keep = process.argv.slice(2).includes('--keep');
const playwrightArgs = process.argv.slice(2).filter((arg) => arg !== '--keep');

if (!keep) rmSync(rawDir, { recursive: true, force: true });

const run = (command, args) => spawnSync(command, args, { stdio: 'inherit', shell: true, env }).status ?? 1;

const status = run('npx', [ 'playwright', 'test', ...playwrightArgs ]);

run('npx', [ 'nyc', 'report', '--temp-dir', rawDir, '--report-dir', 'coverage/e2e', '--reporter=text-summary', '--reporter=json-summary', '--reporter=html' ]);

process.exit(status);
