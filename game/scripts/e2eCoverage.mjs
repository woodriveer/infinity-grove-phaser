//  Runs the Playwright suite against an instrumented dev server and writes the e2e coverage of the game code to coverage/e2e.
//  Usage: npm run test:e2e:coverage [-- <playwright args>]   The exit code is the one of Playwright, after the report is written.
import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const rawDir = '.nyc_output';
const env = { ...process.env, VITE_COVERAGE: 'true', E2E_COVERAGE_DIR: rawDir };

rmSync(rawDir, { recursive: true, force: true });

const run = (command, args) => spawnSync(command, args, { stdio: 'inherit', shell: true, env }).status ?? 1;

const status = run('npx', [ 'playwright', 'test', ...process.argv.slice(2) ]);

run('npx', [ 'nyc', 'report', '--temp-dir', rawDir, '--report-dir', 'coverage/e2e', '--reporter=text-summary', '--reporter=json-summary', '--reporter=html' ]);

process.exit(status);
