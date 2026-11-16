# Supabase Postgres Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/supabase-postgres/spec.md`
**Design**: `.specs/features/supabase-postgres/design.md`
**Status**: Approved 2026-11-16, revision 3 (backend on Google Cloud Run), with the recommended defaults of Q9 to Q11 and Q13 to Q15. T1 to T3 done.

Rules for every task:

- Read the files under **Read first** before editing. Line numbers can drift: find the edit by its content.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` (on this machine `py -3` instead of `python3`). End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`).
- Mark the task `[x]` in this file in the same commit.
- Push right after the commit (`git pull --rebase origin main && git push origin HEAD:main`). Until the cutover (T20), backend commits still go live through the local watcher while `publish.sh` runs, and the Deploy workflow skips every job because the variable `CLOUD_RUN_PRODUCTION` is not `true`.
- **Secrets and cloud settings**: never write a real password, token or `JWT_SECRET` anywhere; never print a `.env` value. Never run a `gcloud` command that creates, changes or deletes anything, never `gcloud secrets versions access`, never `gh secret set`, `gh variable set`, `gh workflow run`, `fly ...` or `git push origin --delete`: those are owner steps (design, "Owner steps", lists the read-only checks an agent may run). Never `git add .env`, anything under `backups/` or a `gha-creds-*.json`. Tests use only the fake password `Fake0Password1ForTests`, the fake pooler host `aws-0-sa-east-1.pooler.supabase.com`, the fake project number `123456789012`, the fake service URL `https://infinity-grove-backend-123456789012.southamerica-east1.run.app`, the fake image repository `southamerica-east1-docker.pkg.dev/infinity-grove-prod/infinity-grove/backend` and the fake commits `'a'.repeat(40)` and `'b'.repeat(40)`. No task of Phases 2 to 6 contacts the real Supabase, Google Cloud or GitHub settings.
- Never weaken, skip or delete a test to make a gate pass. Never run two suites at once in the same checkout, and never leave one running in the background.
- Run `graphify update .` after a code task (AST only, no cost).
- Order: Phases 2 to 6 are code. When T19 is committed, the Verifier runs and `product-owner` accepts. Phase 7 (T20, T21) changes production. It starts only after that acceptance, the owner steps O1 to O15 of the design (O15 prebuilds the image that goes live), and an explicit go-ahead from the owner in the conversation (blast radius rule). Phase 8 (T22) runs after T21, with a Verifier round scoped to it.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (suites and coverage commands), `.claude/agents/test-engineer.md` (suite table), `backend/build.gradle.kts` (JUnit 5, Testcontainers, RestAssured, ktlint, JaCoCo), `game/package.json` (Vitest, Playwright), the `deploy/**/*.test.mjs` pattern (node:test with fake `exec`). No coverage thresholds, so strong defaults apply. Lessons applied: L-010 (exact on-screen text), L-039 (one test per edge case), L-023 (a config value has a test that fails when it changes), L-044 (exact text on every failure path), L-045 (the default wiring has its own test).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Deploy modules (`deploy/lib/*.mjs`, `deploy/db/*.mjs`, `deploy/cloudrun/cloudRunRelease.mjs`) | unit (node:test, fake `exec` and `fetch`) | Every rule and every exact message of the spec; one test per guard state; no argument carries a secret | `deploy/**/*.test.mjs` | `node --test "deploy/**/*.test.mjs"` |
| Repo config (`.gitignore`, `.env.example`, `.github/workflows/deploy.yml`, `deploy/cloudrun/artifact-cleanup.json`) | unit (text, JSON and `git` checks) | Each spec AC of the file has one test that fails when the value changes | `deploy/lib/secrets.test.mjs`, `deploy/cloudrun/workflow.test.mjs` | same |
| `publish.sh` | none (shell glue) | `bash -n` plus greps of the exact lines | - | `bash -n publish.sh` |
| Backend web, port and adapter (`HealthController`, `JdbcDatabaseHealth`, `SecurityConfig`) | unit + integration | UP, DOWN, public GET, protected POST, the commit default | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/**` | `cd backend && ./gradlew ktlintCheck test` |
| Backend config (`application.yaml`: pool, `server.port`) and the test datasource | unit + integration (Testcontainers) | Pool sizes; the port default; Testcontainers wins over a Supabase URL | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/**` | same |
| Game http adapter and composition (`healthApi.js`, `composition.js`) | unit (Vitest) | 2xx true, every error false, the timeout, the `services` keys | `game/src/**/*.test.js` | `cd game && npm test` |
| Game scene (`MainMenu.js`) | unit (Vitest) + e2e (Playwright) | Every AC of RUN-06 in unit; the notice, the form and the server-down path in e2e | `game/src/adapters/phaser/MainMenu.test.js`, `game/e2e/wake.spec.js` | `cd game && npm test`, `cd game && npx playwright test e2e/wake.spec.js` |
| e2e support (`game/e2e/support/fakeBackend.js`) and review shots | e2e | The whole e2e suite still passes with the new route | `game/e2e/**`, `game/ui-review/*.shots.js` | `cd game && npx playwright test --workers=2` |
| UI review | none (the `ui-artist` report is the check) | Every item of T13 | `.specs/features/supabase-postgres/ui-review.html` | `cd game && npm run ui:shots -- supabasePostgres` |
| Docs (`backend/readme.md`, `game/readme.md`, ADR) | none | - | - | `git diff --check` |
| Cutover (production) | manual | M1 to M14 of the spec | - | commands in T20 and T21 |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick (deploy) | After a deploy task, on its own test file | `node --test <the task's test file>` from the repository root. Every test passes. |
| Full (deploy) | After every deploy task | `node --test --test-reporter=tap "deploy/**/*.test.mjs" \| grep -E "^# (tests\|pass\|fail)\|^not ok"` from the repository root. Expected: `# tests <the count the task names>`, `# fail 2`, and only these two `not ok` lines, which already failed before this feature on this machine (child node exits `3221226505`): `the CLI exits 0 when every check passes` and `the CLI exits 1 when a check fails` (both `deploy/regression.test.mjs`). Any other failure blocks the task. |
| Backend | After a backend task | `cd backend && ./gradlew ktlintCheck test` (Docker must run for Testcontainers). Count the `<testcase` elements in `backend/build/test-results/test/*.xml` before and after the task. |
| Game unit | After a game task | `cd game && npm test && npm run build`. Count the tests in the Vitest summary before and after the task. |
| Game e2e | After an e2e task | `cd game && npx playwright test e2e/wake.spec.js e2e/session.spec.js e2e/auth.spec.js`, then `cd game && npx playwright test --workers=2`. A failing test is rerun alone twice with `--workers=1` and counts as a load flake only when it passes both (`.specs/STATE.md` Handoff note 1). |
| Build | After each phase | Every gate the phase's tasks named |

Deploy suite baseline measured on 2026-11-16 after T3: `# tests 165`, `# pass 163`, `# fail 2`. The counts in each task assume the phase order below.

---

## Execution Plan

Phases run in order; tasks inside a phase run in order.

### Phase 1: The `.env` rules (done)

```
T1 → T2 → T3
```

### Phase 2: Backend for Cloud Run

```
T4 → T5 → T6
```

### Phase 3: The release script and the Deploy workflow

```
T7 → T8 → T9
```

### Phase 4: The game waits for the server

```
T10 → T11 → T12 → T13
```

### Phase 5: The copy tool

```
T14 → T15 → T16 → T17
```

### Phase 6: Docs

```
T18 → T19
```

### Phase 7: Cutover (production; after the Verifier PASS, the product-owner acceptance, the owner steps and the owner's explicit go-ahead)

```
T20 → T21
```

### Phase 8: After the cutover

```
T22
```

Cross-phase dependencies (already satisfied by the phase order):

```
T4 → T7
T4 → T10
T2 → T14
T6 → T18
T9 → T18
T17 → T18
T13 → T20
T19 → T20
T21 → T22
```

---

## Task Breakdown

### T1: `.env` parser [x]

**Owner**: kotlin-backend-dev
**What**: A pure parser that reads a `.env` the way Compose `env_file` reads plain values (SUPA-02, SUPA-06; spec Assumptions "Formato do `.env`").
**Where**: `deploy/lib/dotenv.mjs` (new)
**Also changes**: `deploy/lib/dotenv.test.mjs` (new)
**Read first**: `deploy/lib/state.mjs` (style of a small fs module), `deploy/lib/state.test.mjs` (temp dirs in tests)
**Depends on**: None
**Requirement**: SUPA-02

**Contract**:

```js
//  The repo-root .env as Compose env_file reads plain values: NAME=value per line, no quotes, # lines and blank lines skipped
import { existsSync, readFileSync } from 'node:fs';

export const parseDotenv = (text) => /* Record<string, string> */;
export const readDotenv = (path) => /* Record<string, string> | null */;
```

- `parseDotenv`: split `text` on `/\r?\n/`. For each line: skip it when `line.trim() === ''` or `line.trimStart().startsWith('#')`. `const i = line.indexOf('=')`; skip it when `i <= 0`. Key = `line.slice(0, i).trim()`, value = `line.slice(i + 1)` (no trim). Assign `result[key] = value`, so a later key overwrites an earlier one. Return a plain object.
- `readDotenv`: `existsSync(path) ? parseDotenv(readFileSync(path, 'utf8')) : null`.

**Steps**:

1. Create `deploy/lib/dotenv.mjs` with the header comment and the two exports above. Follow the brace style of `deploy/lib/state.mjs` (Allman, 4 spaces).
2. Create `deploy/lib/dotenv.test.mjs` with the test cases below (`import { test } from 'node:test'`, `assert from 'node:assert/strict'`).

**Tests**: unit
**Test cases** (`deploy/lib/dotenv.test.mjs`, one `test` each, `assert.deepEqual` on the whole object):

1. `parses NAME=value lines`: `'A=1\nB=two'` → `{ A: '1', B: 'two' }`
2. `skips blank lines and lines that start with #`: `'\n# c\n  # d\nA=1\n'` → `{ A: '1' }`
3. `splits at the first = only`: `'SPRING_DATASOURCE_URL=jdbc:postgresql://h:5432/db?sslmode=require'` → `{ SPRING_DATASOURCE_URL: 'jdbc:postgresql://h:5432/db?sslmode=require' }`
4. `reads CRLF line ends`: `'A=1\r\nB=2\r\n'` → `{ A: '1', B: '2' }`
5. `keeps the spaces of a value`: `'A= x '` → `{ A: ' x ' }`
6. `skips a line with no = or an empty name`: `'junk\n=v\nA=1'` → `{ A: '1' }`
7. `the last of two equal names wins`: `'A=1\nA=2'` → `{ A: '2' }`
8. `readDotenv returns null for a missing file`: `readDotenv(join(mkdtempSync(join(tmpdir(), 'dotenv-')), '.env'))` → `null`
9. `readDotenv parses an existing file`: write `'A=1\n'` to a temp `.env` → `{ A: '1' }`

**Gate**: Quick `node --test deploy/lib/dotenv.test.mjs`, then Full (deploy) with `# tests 127`.
**Done when**:

- [x] The 9 cases pass.
- [x] Full (deploy) shows `# tests 127`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): parse the repo-root .env`

---

### T2: Database `.env` rules [x]

**Owner**: kotlin-backend-dev
**What**: One pure module that says whether a `.env` may reach a slot, and in which mode (SUPA-02; spec US-1 AC 3 to 17, section Mensagens).
**Where**: `deploy/lib/databaseEnv.mjs` (new)
**Also changes**: `deploy/lib/databaseEnv.test.mjs` (new)
**Read first**: `deploy/lib/dotenv.mjs` (T1), spec US-1 and the Mensagens table
**Depends on**: T1
**Requirement**: SUPA-02

**Contract**:

```js
//  The rules a .env must pass before a backend slot may start on it (spec supabase-postgres, SUPA-02)
import { join } from 'node:path';
import { readDotenv } from './dotenv.mjs';

export const SUPABASE_PROJECT_REF = 'jnqlrdnwwqslihncszej';
export const DATABASE_VARS = ['SPRING_DATASOURCE_URL', 'SPRING_DATASOURCE_USERNAME', 'SPRING_DATASOURCE_PASSWORD'];
export const jdbcParts = (url) => /* { host, port, database, params } | null */;
export const checkDatabaseEnv = (vars) => /* { ok, mode, errors } */;
export const loadDatabaseEnv = (root) => /* { ok, mode, errors } */;
```

`jdbcParts(url)`: match `/^jdbc:postgresql:\/\/([^/:?#]+):(\d+)\/([^/?#]+)(?:\?(.*))?$/`. No match → `null`. Else `{ host: m[1], port: Number(m[2]), database: m[3], params }`, where `params` comes from `m[4]` split on `&`; each part splits at its first `=` into `[key.toLowerCase(), value]` (no `=` → value `''`); empty parts are skipped.

`checkDatabaseEnv(vars)`: `errors = []`, `mode = null`. In this order:

1. For each `name` of `DATABASE_VARS`: when `!vars[name]` push `` `falta ${name} no .env` ``.
2. For each `name` of `DATABASE_VARS`: when `vars[name]` and `` /[\s#$"'`\\]/.test(vars[name]) `` push `` `${name} contém espaço, #, $, aspas ou barra invertida` ``.
3. `url = vars.SPRING_DATASOURCE_URL`. When it is falsy, return `{ ok: false, mode: null, errors }`.
4. `parts = jdbcParts(url)`. When `null`: push `'SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>'` and return `{ ok: false, mode: null, errors }`.
5. When `'user' in parts.params || 'password' in parts.params`: push `'SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD'`.
6. Host:
   - `host === 'postgres'` → `mode = 'local'`.
   - `/^db\.[a-z0-9]+\.supabase\.co$/.test(host)` → push `'a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)'` (literal text), mode stays `null`.
   - `/^aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(host)` → `mode = 'supabase'`, then:
     - `port === 6543` → push `'a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)'`; else when `port !== 5432` → push `` `o Session pooler do Supabase usa a porta 5432, não ${port}` ``.
     - `database !== 'postgres'` → push `` `o banco do Supabase se chama postgres, não ${database}` ``.
     - `!['require', 'verify-ca', 'verify-full'].includes(params.sslmode)` → push `'SPRING_DATASOURCE_URL precisa de sslmode=require'`.
     - ``vars.SPRING_DATASOURCE_USERNAME && vars.SPRING_DATASOURCE_USERNAME !== `postgres.${SUPABASE_PROJECT_REF}` `` → push `'SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej'`.
   - any other host → push `` `o host ${host} não é o Session pooler do Supabase nem o postgres local` ``, mode stays `null`.
7. Return `{ ok: errors.length === 0, mode, errors }`. `mode` is the host kind even when `ok` is false.

`loadDatabaseEnv(root)`: `vars = readDotenv(join(root, '.env'))`. `null` → `{ ok: false, mode: null, errors: ['arquivo .env não encontrado na raiz do repositório'] }`; else `checkDatabaseEnv(vars)`.

No message ever contains the value of `SPRING_DATASOURCE_PASSWORD`.

**Steps**:

1. Create `deploy/lib/databaseEnv.mjs` with the exports above.
2. Create `deploy/lib/databaseEnv.test.mjs`. At the top define:
   - `SUPABASE = { SPRING_DATASOURCE_URL: 'jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require', SPRING_DATASOURCE_USERNAME: 'postgres.jnqlrdnwwqslihncszej', SPRING_DATASOURCE_PASSWORD: 'Fake0Password1ForTests' }`
   - `LOCAL = { SPRING_DATASOURCE_URL: 'jdbc:postgresql://postgres:5432/infinity_grove', SPRING_DATASOURCE_USERNAME: 'infinity', SPRING_DATASOURCE_PASSWORD: 'infinity' }`
   - `const pooler = (url) => ({ ...SUPABASE, SPRING_DATASOURCE_URL: url })`
3. Write the test cases below.

**Tests**: unit
**Test cases** (`deploy/lib/databaseEnv.test.mjs`; "→" is `assert.deepEqual(checkDatabaseEnv(input), expected)` unless stated):

1. `a Session pooler config is ok in supabase mode`: `SUPABASE` → `{ ok: true, mode: 'supabase', errors: [] }`
2. `the compose postgres is ok in local mode`: `LOCAL` → `{ ok: true, mode: 'local', errors: [] }`
3. `another pooler index and region is ok`: `pooler('jdbc:postgresql://aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require')` → `{ ok: true, mode: 'supabase', errors: [] }`
4. `sslmode verify-ca is accepted`: URL with `?sslmode=verify-ca` → `{ ok: true, mode: 'supabase', errors: [] }`
5. `sslmode verify-full is accepted`: URL with `?sslmode=verify-full` → `{ ok: true, mode: 'supabase', errors: [] }`
6. `every missing variable is named in order`: `{}` → `{ ok: false, mode: null, errors: ['falta SPRING_DATASOURCE_URL no .env', 'falta SPRING_DATASOURCE_USERNAME no .env', 'falta SPRING_DATASOURCE_PASSWORD no .env'] }`
7. `an empty value counts as missing`: `{ ...SUPABASE, SPRING_DATASOURCE_PASSWORD: '' }` → `{ ok: false, mode: 'supabase', errors: ['falta SPRING_DATASOURCE_PASSWORD no .env'] }`
8. `port 6543 is the Transaction pooler`: `...pooler.supabase.com:6543/postgres?sslmode=require` → `{ ok: false, mode: 'supabase', errors: ['a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)'] }`
9. `another port is refused`: `:5433` → errors `['o Session pooler do Supabase usa a porta 5432, não 5433']`, mode `'supabase'`
10. `the direct connection is IPv6 only`: `pooler('jdbc:postgresql://db.jnqlrdnwwqslihncszej.supabase.co:5432/postgres?sslmode=require')` → `{ ok: false, mode: null, errors: ['a conexão direta do Supabase (db.<ref>.supabase.co) é só IPv6; use o Session pooler (aws-N-<região>.pooler.supabase.com:5432)'] }`
11. `a pooler URL without sslmode is refused`: `...:5432/postgres` → errors `['SPRING_DATASOURCE_URL precisa de sslmode=require']`
12. `sslmode disable is refused`: `?sslmode=disable` → errors `['SPRING_DATASOURCE_URL precisa de sslmode=require']`
13. `the Supabase database is postgres`: `...:5432/infinity_grove?sslmode=require` → errors `['o banco do Supabase se chama postgres, não infinity_grove']`
14. `the pooler user carries the project ref`: `{ ...SUPABASE, SPRING_DATASOURCE_USERNAME: 'postgres' }` → errors `['SPRING_DATASOURCE_USERNAME do Session pooler é postgres.jnqlrdnwwqslihncszej']`
15. `a password in the URL is refused`: `?sslmode=require&password=x` → errors `['SPRING_DATASOURCE_URL não pode trazer usuário ou senha; use SPRING_DATASOURCE_USERNAME e SPRING_DATASOURCE_PASSWORD']`
16. `a user in the URL is refused`: `?sslmode=require&user=postgres` → same single error as case 15
17. `a non-JDBC URL is refused`: `pooler('postgresql://aws-0-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require')` → `{ ok: false, mode: null, errors: ['SPRING_DATASOURCE_URL não é jdbc:postgresql://<host>:<porta>/<banco>'] }`
18. `an unknown host is refused`: `pooler('jdbc:postgresql://localhost:5432/postgres?sslmode=require')` → `{ ok: false, mode: null, errors: ['o host localhost não é o Session pooler do Supabase nem o postgres local'] }`
19 to 26. One `test` per character, eight tests in all, generated by this loop:

```js
for (const [label, c] of [['space', ' '], ['tab', '\t'], ['#', '#'], ['$', '$'], ['double quote', '"'], ['single quote', "'"], ['backtick', '`'], ['backslash', '\\']])
{
    test(`the password refuses a ${label}`, () =>
    {
        assert.deepEqual(checkDatabaseEnv({ ...SUPABASE, SPRING_DATASOURCE_PASSWORD: `Fake0${c}Password` }), {
            ok: false, mode: 'supabase', errors: ['SPRING_DATASOURCE_PASSWORD contém espaço, #, $, aspas ou barra invertida']
        });
    });
}
```

27. `the user name refuses a #`: `{ ...SUPABASE, SPRING_DATASOURCE_USERNAME: 'postgres.jnqlrdnwwqslihncszej#' }` → `errors` includes `'SPRING_DATASOURCE_USERNAME contém espaço, #, $, aspas ou barra invertida'` (`assert.ok(result.errors.includes(...))`)
28. `the URL refuses a space`: URL `SUPABASE.SPRING_DATASOURCE_URL + ' '` → `errors` includes `'SPRING_DATASOURCE_URL contém espaço, #, $, aspas ou barra invertida'`
29. `no message carries the password`: for each of `{ ...SUPABASE, SPRING_DATASOURCE_PASSWORD: 'Secret#1' }` and `{ ...pooler('jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:6543/x'), SPRING_DATASOURCE_PASSWORD: 'Secret1' }`, every string of `errors` does not include `'Secret'`
30. `loadDatabaseEnv names a missing .env`: `loadDatabaseEnv(mkdtempSync(join(tmpdir(), 'dbenv-')))` → `{ ok: false, mode: null, errors: ['arquivo .env não encontrado na raiz do repositório'] }`
31. `loadDatabaseEnv reads the .env of the root`: temp dir with `.env` holding the three `SUPABASE` lines (`NAME=value\n`) → `{ ok: true, mode: 'supabase', errors: [] }`
32. `jdbcParts reads host, port, database and lower-cased params`: `jdbcParts('jdbc:postgresql://postgres:5432/infinity_grove?SSLMode=require&x')` → `{ host: 'postgres', port: 5432, database: 'infinity_grove', params: { sslmode: 'require', x: '' } }`

**Gate**: Quick `node --test deploy/lib/databaseEnv.test.mjs`, then Full (deploy) with `# tests 159`.
**Done when**:

- [x] The 32 tests pass (cases 19 to 26 are 8 separate tests).
- [x] Full (deploy) shows `# tests 159`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): check the database settings of .env`

---

### T3: `.env.example`, ignored backups and the secret guard [x]

**Owner**: kotlin-backend-dev
**What**: Ship a local-mode `.env.example`, ignore `backups/`, create the owner's local `.env`, and pin the secret rules with tests (SUPA-06; spec US-6).
**Where**: `.env.example` (new)
**Also changes**: `.gitignore`, `deploy/lib/secrets.test.mjs` (new); creates the untracked file `C:\Users\Internal.IT\Developer\infinity-grove-phaser\.env`
**Read first**: `.gitignore`, `deploy/lib/databaseEnv.mjs` (T2), `deploy/lib/dotenv.mjs` (T1)
**Depends on**: T2
**Requirement**: SUPA-06

**Contract**:

`.env.example`, exactly:

```
# Database of the backend slots, read by backend/docker-compose.yml (env_file) and checked by deploy/lib/databaseEnv.mjs.
# Copy this file to .env at the repository root. .env is gitignored: never commit it, never paste its values anywhere.
# Local Postgres of backend/docker-compose.yml (profile local-db): development and the way back after the Supabase cutover.
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/infinity_grove
SPRING_DATASOURCE_USERNAME=infinity
SPRING_DATASOURCE_PASSWORD=infinity
# Supabase (Dashboard > Connect > Session pooler). Replace the three lines above with:
# SPRING_DATASOURCE_URL=jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require
# SPRING_DATASOURCE_USERNAME=postgres.jnqlrdnwwqslihncszej
# SPRING_DATASOURCE_PASSWORD=<database password: letters and digits only>
```

`.gitignore`: append one line `backups/` after the last line.

**Steps**:

1. Create `.env.example` with the exact text above.
2. Append `backups/` to `.gitignore`.
3. In the owner's checkout `C:\Users\Internal.IT\Developer\infinity-grove-phaser`, when `.env` does **not** exist, run `cp .env.example .env`. Never overwrite an existing `.env`. Never `git add` it. (Revision 1 needed it for the slots; in revision 2 the `.env` is the input of the copy, and the owner has put it in Supabase mode.)
4. Create `deploy/lib/secrets.test.mjs`. `ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')`. Run git with `spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' })`.
5. Write the test cases below.

**Tests**: unit
**Test cases** (`deploy/lib/secrets.test.mjs`):

1. `.env is ignored by git`: `git check-ignore -q .env` → status `0`
2. `backups are ignored by git`: `git check-ignore -q backups/infinity_grove-20261115T000000Z.dump` → status `0`
3. `the tracked env files are the example and the game build modes`: lines of `git ls-files` matching `/(^|\/)\.env(\.|$)/`, sorted → `['.env.example', 'game/.env.development', 'game/.env.pages', 'game/.env.production', 'game/.env.staging']`
4. `no game env file names a datasource variable`: for each tracked `game/.env.*`, `readFileSync(join(ROOT, f), 'utf8').includes('SPRING_DATASOURCE')` is `false`
5. `.env.example passes the database check in local mode`: `checkDatabaseEnv(parseDotenv(readFileSync(join(ROOT, '.env.example'), 'utf8')))` → `{ ok: true, mode: 'local', errors: [] }`
6. `.env.example carries no Supabase password`: the file has the line `# SPRING_DATASOURCE_PASSWORD=<database password: letters and digits only>`, and `parseDotenv(...).SPRING_DATASOURCE_PASSWORD === 'infinity'`

**Gate**: Quick `node --test deploy/lib/secrets.test.mjs` (after `git add .env.example .gitignore`, so case 3 sees the example as tracked; commit before the Full gate), then Full (deploy) with `# tests 165`.
**Done when**:

- [x] The 6 tests pass.
- [x] `test -f C:/Users/Internal.IT/Developer/infinity-grove-phaser/.env` succeeds and `git status --porcelain .env` prints nothing.
- [x] Full (deploy) shows `# tests 165`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `chore(deploy): add .env.example and ignore database backups`

---

### T4: Public `GET /health` with the database check and the commit [x]

**Owner**: kotlin-backend-dev
**What**: A public health route that answers 200 UP or 503 DOWN after `select 1` and names the commit of the running image (RUN-01; spec US-2 AC 1 to 5).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/HealthController.kt` (new)
**Also changes**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/port/HealthPorts.kt` (new), `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/JdbcDatabaseHealth.kt` (new), `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/SecurityConfig.kt`, `backend/src/main/resources/application.yaml`, `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/HealthControllerTest.kt` (new), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/HealthIT.kt` (new), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/JdbcDatabaseHealthTest.kt` (new), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/SecurityIT.kt`
**Read first**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/SecurityConfig.kt:39-62` (public routes), `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/AutoClickController.kt` (controller style), `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/port/UserRepositoryPort.kt` (port style), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/SecurityIT.kt:18-60` (`assertUnauthenticated`, RestAssured `given()`), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/IntegrationTestBase.kt`
**Depends on**: None
**Requirement**: RUN-01

**Contract**:

`port/HealthPorts.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.port

/** Whether the database answers a trivial query now (spec supabase-postgres, RUN-01). */
interface DatabaseHealthPort {
    fun reachable(): Boolean
}
```

`adapter/repository/JdbcDatabaseHealth.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.port.DatabaseHealthPort
import org.slf4j.LoggerFactory
import org.springframework.dao.DataAccessException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component

/** `select 1` through the application pool; any data access failure means the database is not reachable. */
@Component
class JdbcDatabaseHealth(
    private val jdbc: JdbcTemplate,
) : DatabaseHealthPort {
    override fun reachable(): Boolean =
        try {
            jdbc.queryForObject("select 1", Int::class.java) == 1
        } catch (e: DataAccessException) {
            logger.warn("Database health check failed: {}", e.message)
            false
        }

    companion object {
        private val logger = LoggerFactory.getLogger(JdbcDatabaseHealth::class.java)
    }
}
```

`adapter/web/HealthController.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.adapter.web

import br.com.woodriver.infinity_grove_ws.port.DatabaseHealthPort
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

/** What the Cloud Run probes and the Deploy workflow read: UP or DOWN, and the commit of the running image (APP_COMMIT). */
data class HealthResponse(
    val status: String,
    val commit: String,
)

/** Public `GET /health` (spec supabase-postgres, RUN-01): 200 UP when the database answers `select 1`, else 503 DOWN. */
@RestController
class HealthController(
    private val database: DatabaseHealthPort,
    @Value("\${app.commit}") private val commit: String,
) {
    @GetMapping("/health")
    fun health(): ResponseEntity<HealthResponse> =
        if (database.reachable()) {
            ResponseEntity.ok(HealthResponse(UP, commit))
        } else {
            ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(HealthResponse(DOWN, commit))
        }

    companion object {
        const val UP = "UP"
        const val DOWN = "DOWN"
    }
}
```

`application.yaml`: the `app:` block starts with these two lines, before `security:`:

```yaml
app:
  # commit of the running image, set by the Deploy workflow (env_vars APP_COMMIT=<commit> of the Cloud Run revision); GET /health answers it
  commit: ${APP_COMMIT:unknown}
  security:
```

`SecurityConfig.kt`: right after `authorize(HttpMethod.POST, "/auth/logout", permitAll)` add `authorize(HttpMethod.GET, "/health", permitAll)`. The class KDoc becomes `/** Stateless JWT resource server. Only sign-up, login, refresh, logout and the health check are public. */`.

**Steps**:

1. Create `port/HealthPorts.kt`.
2. Create `adapter/repository/JdbcDatabaseHealth.kt`.
3. Create `adapter/web/HealthController.kt`.
4. Add the `commit` line to `application.yaml`.
5. Add the permit line and the KDoc to `SecurityConfig.kt`.
6. Create the three test files and add the two tests to `SecurityIT.kt`.

**Tests**: unit + integration
**Test cases**:

`adapter/web/HealthControllerTest.kt` (unit, no Spring; a private fake `class FixedDatabaseHealth(private val up: Boolean) : DatabaseHealthPort { override fun reachable() = up }`):

1. `` `health answers 200 UP with the commit when the database answers` ``: `HealthController(FixedDatabaseHealth(true), "abc").health()` → `statusCode.value()` is `200`, `body` equals `HealthResponse("UP", "abc")`
2. `` `health answers 503 DOWN with the commit when the database does not answer` ``: `FixedDatabaseHealth(false)` → `503`, `HealthResponse("DOWN", "abc")`
3. `` `the shipped yaml reads the commit from APP_COMMIT with unknown as default` ``: `HealthControllerTest::class.java.getResource("/application.yaml")!!.readText()` contains `"commit: \${APP_COMMIT:unknown}"`

`adapter/repository/JdbcDatabaseHealthTest.kt` (unit):

4. `` `a database that cannot be reached is not healthy` ``: `JdbcDatabaseHealth(JdbcTemplate(DriverManagerDataSource("jdbc:postgresql://127.0.0.1:1/none", "x", "y"))).reachable()` is `false` (`org.springframework.jdbc.datasource.DriverManagerDataSource`)

`adapter/web/HealthIT.kt` (integration, extends `IntegrationTestBase`, annotated `@TestPropertySource(properties = ["app.commit=0123456789abcdef0123456789abcdef01234567"])`):

5. `` `GET health without a token answers 200 UP and the commit` ``: `given().get("/health")` → status `200`, content type contains `application/json`, `status` equals `"UP"`, `commit` equals `"0123456789abcdef0123456789abcdef01234567"`
6. `` `the database adapter reaches the test database` ``: `@Autowired lateinit var health: JdbcDatabaseHealth`; `health.reachable()` is `true`

`adapter/web/SecurityIT.kt` (two new tests):

7. `` `the health check is public` ``: `given().get("/health")` without `Authorization` → status `200`
8. `` `POST health without a token is 401` ``: `assertUnauthenticated(given().contentType(ContentType.JSON).post("/health"))`

**Gate**: Quick `cd backend && ./gradlew test --tests '*Health*' --tests '*SecurityIT'`, then Backend `cd backend && ./gradlew ktlintCheck test`.
**Done when**:

- [x] The 8 tests pass, and the existing `SecurityIT` tests pass unchanged.
- [x] `./gradlew ktlintCheck test` passes with 8 more `<testcase` elements than before the task.
- [x] `grep -c 'authorize(HttpMethod.GET, "/health", permitAll)' backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/SecurityConfig.kt` prints `1`.

**Commit**: `feat(backend): add a public health check with the database and the commit`

---

### T5: Hikari pool of 5 connections, 1 idle, and the port from `PORT` [ ]

**Owner**: kotlin-backend-dev
**What**: Cap the backend at 5 database connections and keep 1 idle, so the serving instance and the new revision's fit the Session pooler's 15, and listen on `PORT` with 8080 as default (SUPA-01, RUN-02; spec US-1 AC 1 to 3, US-3 AC 5, design "Connection budget" and "Pool and port").
**Where**: `backend/src/main/resources/application.yaml` (modify)
**Also changes**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/DatabasePoolConfigIT.kt` (new), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/ServerPortConfigTest.kt` (new)
**Read first**: `backend/src/main/resources/application.yaml:1-8`, `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/SchemaValidationIT.kt:19-32` (config assertion style), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/IntegrationTestBase.kt`, `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/HealthControllerTest.kt` (T4, reading `/application.yaml` as text)
**Depends on**: T4
**Requirement**: SUPA-01, RUN-02

**Contract**: two edits of `application.yaml`.

1. Before the first line `spring:`, insert (top-level key, 2-space indent):

```yaml
server:
  # Cloud Run sends requests to $PORT (8080 unless the deploy says otherwise); Spring Boot reads SERVER_PORT, not PORT
  port: ${PORT:8080}
```

2. Under `spring.datasource`, right after `driver-class-name: org.postgresql.Driver`, add (4-space indent for `hikari`, as a child of `datasource`):

```yaml
    hikari:
      # Supabase Session pooler (pool size 15): each client connection holds a server connection. The serving Cloud Run
      # instance plus the one of a new revision take at most 2 x 5 = 10; one idle connection keeps little open between requests
      maximum-pool-size: 5
      minimum-idle: 1
```

**Steps**:

1. Apply edit 1 to `application.yaml`.
2. Apply edit 2 to `application.yaml`.
3. Create `DatabasePoolConfigIT.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.env.Environment
import javax.sql.DataSource
import kotlin.test.Test
import kotlin.test.assertEquals

/** SUPA-01: the serving Cloud Run instance and the new revision's share the Supabase Session pooler, so each holds at most 5 connections. */
class DatabasePoolConfigIT : IntegrationTestBase() {
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var environment: Environment

    @Test
    fun `the connection pool holds at most 5 connections`() {
        assertEquals(5, dataSource.unwrap(HikariDataSource::class.java).maximumPoolSize)
    }

    @Test
    fun `the connection pool keeps 1 idle connection`() {
        assertEquals(1, dataSource.unwrap(HikariDataSource::class.java).minimumIdle)
    }

    @Test
    fun `the shipped yaml sets the pool size to 5`() {
        assertEquals("5", environment.getProperty("spring.datasource.hikari.maximum-pool-size"))
    }

    @Test
    fun `the shipped yaml sets the idle minimum to 1`() {
        assertEquals("1", environment.getProperty("spring.datasource.hikari.minimum-idle"))
    }
}
```

4. Create `ServerPortConfigTest.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.adapter.web

import kotlin.test.Test
import kotlin.test.assertTrue

/** RUN-02: Cloud Run injects PORT and sends requests there; without PORT (compose, bootRun) the backend stays on 8080. */
class ServerPortConfigTest {
    private val yaml = ServerPortConfigTest::class.java.getResource("/application.yaml")!!.readText()

    @Test
    fun `the shipped yaml listens on PORT with 8080 as default`() {
        assertTrue(yaml.contains("server:\n  # Cloud Run sends requests to \$PORT") && yaml.contains("  port: \${PORT:8080}"))
    }
}
```

(If the file is checked out with CRLF line ends, read it with `.replace("\r\n", "\n")` before the check.)

5. Run the Backend gate. If a concurrency test fails only because it waits for a connection (a `SQLTransientConnectionException` after 30 s), stop and report it (design, Risks); do not change other tests.

**Tests**: unit + integration
**Test cases**: the 4 tests of `DatabasePoolConfigIT` and the 1 test of `ServerPortConfigTest` above, plus the whole existing backend suite passing with the pool of 5 (the integration tests run on a random port, so `server.port` does not reach them).
**Gate**: Quick `cd backend && ./gradlew test --tests '*DatabasePoolConfigIT' --tests '*ServerPortConfigTest'`, then Backend `cd backend && ./gradlew ktlintCheck test`.
**Done when**:

- [ ] The 5 new tests pass.
- [ ] `./gradlew ktlintCheck test` passes with 5 more `<testcase` elements than after T4.
- [ ] `grep -c 'port: ${PORT:8080}' backend/src/main/resources/application.yaml` prints `1`.

**Commit**: `feat(backend): cap the database pool at 5 and listen on the Cloud Run port`

---

### T6: The tests never reach Supabase [ ]

**Owner**: test-engineer
**What**: Prove that the integration tests connect to the Testcontainers Postgres even when the datasource properties name a Supabase host (SUPA-10; spec US-8).
**Where**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/TestDatabaseIsolationIT.kt` (new)
**Read first**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/IntegrationTestBase.kt:30` (`PostgresTestConfiguration`, `@ServiceConnection`), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/SchemaValidationIT.kt:10` (`JdbcConnectionDetails` import path)
**Depends on**: T5
**Requirement**: SUPA-10

**Contract**:

```kotlin
package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.jdbc.autoconfigure.JdbcConnectionDetails
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.test.context.TestPropertySource
import org.testcontainers.postgresql.PostgreSQLContainer
import javax.sql.DataSource
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * SUPA-10: test properties outrank environment variables, so if @ServiceConnection wins over this Supabase URL it also wins over a
 * SPRING_DATASOURCE_URL in the shell or the CI runner. The host ends in .invalid, so a broken isolation fails on DNS and never reaches Supabase.
 */
@TestPropertySource(
    properties = [
        "spring.datasource.url=jdbc:postgresql://aws-0-test.pooler.supabase.invalid:5432/postgres?sslmode=require",
        "spring.datasource.username=postgres.jnqlrdnwwqslihncszej",
        "spring.datasource.password=not-a-real-password",
    ],
)
class TestDatabaseIsolationIT : IntegrationTestBase() {
    @Autowired private lateinit var dataSource: DataSource
    @Autowired private lateinit var connection: JdbcConnectionDetails
    @Autowired private lateinit var postgres: PostgreSQLContainer
    @Autowired private lateinit var jdbc: JdbcTemplate
    // tests below
}
```

(Format the `@Autowired` fields one per line like `SchemaValidationIT` so ktlint passes.)

**Steps**:

1. Create the file with the header above.
2. Write the 3 tests below.

**Tests**: integration
**Test cases** (`TestDatabaseIsolationIT.kt`):

1. `` `the tests connect to the Testcontainers Postgres even when the datasource names Supabase` ``: `val url = dataSource.unwrap(HikariDataSource::class.java).jdbcUrl`; `assertEquals(connection.jdbcUrl, url)`; `assertTrue(url.contains(":${postgres.getMappedPort(5432)}/"))`
2. `` `the test database url never names Supabase` ``: `assertFalse(dataSource.unwrap(HikariDataSource::class.java).jdbcUrl.contains("supabase"))`
3. `` `the test database answers a query` ``: `assertEquals(1, jdbc.queryForObject("select 1", Int::class.java))`

**Gate**: Quick `cd backend && ./gradlew test --tests '*TestDatabaseIsolationIT'`, then Backend `cd backend && ./gradlew ktlintCheck test`.
**Done when**:

- [ ] The 3 tests pass.
- [ ] Mutation check by hand: with `@ServiceConnection` removed from `PostgresTestConfiguration.postgres()` in `IntegrationTestBase.kt`, `./gradlew test --tests '*TestDatabaseIsolationIT'` fails (the context tries the `.invalid` host). Revert the change before the commit and do not commit it.
- [ ] `./gradlew ktlintCheck test` passes with 3 more `<testcase` elements than after T5.

**Commit**: `test(backend): pin the integration tests to the Testcontainers Postgres`

---

### T7: `deploy/cloudrun/cloudRunRelease.mjs`: `plan`, `inspect`, `image` and the traffic reader [x]

**Owner**: kotlin-backend-dev
**What**: The CLI the Deploy workflow calls first: `plan` decides whether the newest `backend/` commit must go to Cloud Run, `inspect` prints the traffic and the tags of the service, `image` says whether the image of that commit is already in Artifact Registry (so a prebuilt image skips tests, build and push), and the helpers read `gcloud run services describe` (RUN-03; spec US-4 AC 1 to 5, 12, 13, 14).
**Where**: `deploy/cloudrun/cloudRunRelease.mjs` (new)
**Also changes**: `deploy/cloudrun/cloudRunRelease.test.mjs` (new)
**Read first**: `deploy/lib/run.mjs` (the default `exec` and its `shell` option), `deploy/lib/backendDeploy.test.mjs:21-70` (fake machine pattern), spec US-4 and the Mensagens table, design "A deploy, step by step"
**Depends on**: T4
**Requirement**: RUN-03

**Contract**: `deploy/cloudrun/cloudRunRelease.mjs`, exactly (T8 adds `release` and its `main` branch):

```js
//  The Cloud Run release of the backend, run by .github/workflows/deploy.yml (spec supabase-postgres, RUN-03, RUN-04)
//  Usage: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | release <commit>   (BACKEND_URL: the service URL)
import { appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { run } from '../lib/run.mjs';

export const SERVICE = 'infinity-grove-backend';
export const REGION = 'southamerica-east1';
export const HEALTH_TIMEOUT_MS = 90000;
export const USAGE = 'Uso: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | image <commit> | release <commit>';
export const MISSING_URL = 'ERRO: falta a variável BACKEND_URL (URL do serviço do Cloud Run)';
export const MISSING_IMAGE = 'ERRO: falta a variável IMAGE (repositório do Artifact Registry)';
export const DESCRIBE_ERROR = `ERRO: não foi possível ler o serviço ${SERVICE} no Cloud Run (gcloud run services describe)`;
export const DESCRIBE_ARGS = ['run', 'services', 'describe', SERVICE, '--region', REGION, '--format', 'json'];

//  The Windows gcloud is a .cmd, which spawnSync only finds through a shell (the reason run.mjs has the option)
export const GCLOUD_SHELL = process.platform === 'win32';

export const isCommit = (value) => /^[0-9a-f]{40}$/.test(String(value));
export const short = (commit) => commit.slice(0, 7);

//  A Cloud Run traffic tag is a lower-case DNS label that starts with a letter; a commit may start with a digit
export const revisionTag = (commit) => `c-${short(commit)}`;

//  gcloud run services update-traffic of this service, followed by the given flags
export const trafficArgs = (...flags) => ['run', 'services', 'update-traffic', SERVICE, '--region', REGION, ...flags];

//  gcloud artifacts docker images describe of the image of one commit; only its exit status is read
export const imageArgs = (image, commit) => ['artifacts', 'docker', 'images', 'describe', `${image}:${commit}`, '--format', 'value(image_summary.digest)'];

//  The commit a backend answers on <baseUrl>/health, or null when it does not answer 2xx JSON naming a full commit
export const healthCommit = async (fetch, baseUrl) =>
{
    try
    {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });

        if (!response.ok)
        {
            return null;
        }

        const { commit } = await response.json();

        return isCommit(commit) ? commit : null;
    }
    catch
    {
        return null;
    }
};

//  Step outputs of GitHub Actions: one name=value line per output, appended to the file GITHUB_OUTPUT names
export const githubOutput = (path) => (values) =>
    appendFileSync(path, Object.entries(values).map(([name, value]) => `${name}=${value}\n`).join(''));

export const printLines = (log, result) =>
    `${result.stdout ?? ''}\n${result.stderr ?? ''}`.split(/\r?\n/).filter((line) => line.trim()).forEach((line) => log(line));

//  status.traffic of gcloud run services describe --format json (Knative serving v1): the revision holding 100 % and the tagged ones
export const parseTraffic = (text) =>
{
    let traffic;

    try
    {
        traffic = JSON.parse(text)?.status?.traffic;
    }
    catch
    {
        return null;
    }

    if (!Array.isArray(traffic))
    {
        return null;
    }

    const serving = traffic.find((target) => target.percent === 100 && target.revisionName);

    return {
        serving: serving ? serving.revisionName : null,
        tags: traffic.filter((target) => target.tag).map((target) => ({ tag: target.tag, revision: target.revisionName, url: target.url }))
    };
};

export const describeService = (exec, root) =>
{
    const result = exec('gcloud', DESCRIBE_ARGS, { cwd: root, shell: GCLOUD_SHELL });
    const traffic = result.status === 0 ? parseTraffic(String(result.stdout)) : null;

    return traffic ? { ok: true, ...traffic } : { ok: false };
};

//  Deploy only when the newest commit that touched backend/ is not the one the service answers; a dropped pending run loses nothing
export const plan = async ({ exec, fetch, root, log, output, backendUrl }) =>
{
    if (!backendUrl)
    {
        log(MISSING_URL);

        return 1;
    }

    const newest = exec('git', ['log', '-1', '--format=%H', '--', 'backend'], { cwd: root });
    const target = String(newest.stdout).trim();

    if (newest.status !== 0 || !isCommit(target))
    {
        log('ERRO: não foi possível ler o último commit de backend/');

        return 1;
    }

    const live = await healthCommit(fetch, backendUrl);
    const deploy = live !== target;

    output({ deploy: String(deploy), target, live: live ?? 'none', tag: revisionTag(target) });
    log(deploy
        ? `Backend ${short(target)} vai para o Cloud Run (no ar: ${live ? short(live) : 'nenhum'})`
        : `Backend ${short(target)} já está no Cloud Run; nada a fazer`);

    return 0;
};

//  Read only: which revision holds the traffic and which tags exist (the rehearsal proves the sign-in and this reader)
export const inspect = ({ exec, root, log }) =>
{
    const service = describeService(exec, root);

    if (!service.ok)
    {
        log(DESCRIBE_ERROR);

        return 1;
    }

    log(`Tráfego: ${service.serving ?? 'nenhuma revisão com 100%'}`);
    service.tags.forEach(({ tag, revision, url }) => log(`Tag ${tag}: ${revision} ${url}`));

    return 0;
};

//  An image reaches the registry under its commit only after the tests and the runner regression of that commit passed,
//  and only the workflow pushes, so a tag that exists needs no new build. Any gcloud failure counts as missing: it only costs a rebuild.
export const imageCheck = ({ exec, root, log, output, image }, target) =>
{
    if (!image)
    {
        log(MISSING_IMAGE);

        return 1;
    }

    const found = exec('gcloud', imageArgs(image, target), { cwd: root, shell: GCLOUD_SHELL }).status === 0;

    output({ prebuilt: String(found) });
    log(found
        ? `Imagem ${short(target)} já está no Artifact Registry; testes, build, regressão e push não rodam de novo`
        : `Imagem ${short(target)} não está no Artifact Registry; testes, build, regressão e push rodam agora`);

    return 0;
};

export const main = async (args, deps) =>
{
    if (args.length === 1 && args[0] === 'plan')
    {
        return plan(deps);
    }

    if (args.length === 1 && args[0] === 'inspect')
    {
        return inspect(deps);
    }

    if (args.length === 2 && args[0] === 'image' && isCommit(args[1]))
    {
        return imageCheck(deps, args[1]);
    }

    deps.log(USAGE);

    return 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
    const output = process.env.GITHUB_OUTPUT
        ? githubOutput(process.env.GITHUB_OUTPUT)
        : (values) => console.log(Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n'));

    process.exit(await main(process.argv.slice(2), {
        exec: run, fetch: globalThis.fetch, root, log: console.log, output, backendUrl: process.env.BACKEND_URL, image: process.env.IMAGE
    }));
}
```

**Steps**:

1. Create the folder `deploy/cloudrun/` and the file `deploy/cloudrun/cloudRunRelease.mjs` with the code above.
2. Create `deploy/cloudrun/cloudRunRelease.test.mjs` (`import { test } from 'node:test'`, `assert from 'node:assert/strict'`). Constants:
   - `T = 'a'.repeat(40)`, `L = 'b'.repeat(40)`
   - `URL = 'https://infinity-grove-backend-123456789012.southamerica-east1.run.app'`
   - `TAG_URL = 'https://c-aaaaaaa---infinity-grove-backend-123456789012.southamerica-east1.run.app'`
   - `PREVIOUS = 'infinity-grove-backend-00007-abc'`, `CANDIDATE = 'infinity-grove-backend-00008-def'`
   - `traffic = (entries) => JSON.stringify({ apiVersion: 'serving.knative.dev/v1', kind: 'Service', metadata: { name: 'infinity-grove-backend' }, status: { url: URL, traffic: entries } })`
   - `DESCRIBE = traffic([{ revisionName: PREVIOUS, percent: 100 }, { revisionName: CANDIDATE, tag: 'c-aaaaaaa', url: TAG_URL }])`
   - `up = (commit) => ({ ok: true, body: { status: 'UP', commit } })`
   - `IMAGE = 'southamerica-east1-docker.pkg.dev/infinity-grove-prod/infinity-grove/backend'`
3. Helper `machine({ backendLog = { status: 0, stdout: `${T}\n` }, health = {}, describe = { status: 0, stdout: DESCRIBE }, trafficStatus = [], imageStatus = 0, regression = 0, regressionOut = '', backendUrl = URL, image = IMAGE } = {})` returns `{ deps, calls, fetches, outputs, lines }` (T8 reuses it):
   - `answers = { [URL]: up(L), [TAG_URL]: up(T), ...health }`.
   - `exec(command, args, options = {})` pushes `{ command, args, options }` to `calls` and answers: `'git'` → `{ stderr: '', ...backendLog }`; `'gcloud'` with `args[0] === 'artifacts'` → `{ status: imageStatus, stdout: '', stderr: '' }`; `'gcloud'` with `args[2] === 'describe'` → `{ stderr: '', ...describe }`; `'gcloud'` with `args[2] === 'update-traffic'` → `{ status: trafficStatus.length ? trafficStatus.shift() : 0, stdout: '', stderr: '' }`; `'node'` → `{ status: regression, stdout: regressionOut, stderr: '' }`.
   - `fetch(url, options)` pushes `{ url, options }` to `fetches`; `answer = answers[url.replace(/\/health$/, '')]`; `undefined` or `'fail'` → throws `new Error('fetch failed')`; `'html'` → returns `{ ok: true, json: async () => { throw new SyntaxError("Unexpected token '<'"); } }`; else returns `{ ok: answer.ok, json: async () => answer.body }`.
   - `deps = { exec, fetch, root: '/repo', log: (line) => lines.push(line), output: (values) => outputs.push(values), backendUrl, image }`.
4. Write the test cases below.

**Tests**: unit
**Test cases** (`deploy/cloudrun/cloudRunRelease.test.mjs`):

1. `plan deploys the newest backend commit when Cloud Run runs another one`: `await plan(deps)` → `0`; `outputs` deepEqual `[{ deploy: 'true', target: T, live: L, tag: 'c-aaaaaaa' }]`; `lines` deepEqual `['Backend aaaaaaa vai para o Cloud Run (no ar: bbbbbbb)']`; the `git` call has `args` deepEqual `['log', '-1', '--format=%H', '--', 'backend']` and `options.cwd === '/repo'`
2. `plan skips when Cloud Run already runs the newest backend commit`: `health: { [URL]: up(T) }` → `outputs` deepEqual `[{ deploy: 'false', target: T, live: T, tag: 'c-aaaaaaa' }]`; `lines` deepEqual `['Backend aaaaaaa já está no Cloud Run; nada a fazer']`
3. `plan deploys when the service does not answer`: `health: { [URL]: 'fail' }` → `outputs` deepEqual `[{ deploy: 'true', target: T, live: 'none', tag: 'c-aaaaaaa' }]`; `lines` deepEqual `['Backend aaaaaaa vai para o Cloud Run (no ar: nenhum)']`
4. `plan deploys when the service answers 503`: `health: { [URL]: { ok: false, body: { status: 'DOWN', commit: L } } }` → `outputs[0].live === 'none'` and `outputs[0].deploy === 'true'`
5. `plan treats the sample image of the owner steps as no commit`: `health: { [URL]: 'html' }` → `outputs[0].live === 'none'`
6. `plan treats a commit that is not a full hash as unknown`: `health: { [URL]: up('unknown') }` → `outputs[0].live === 'none'`
7. `plan asks /health of BACKEND_URL with a timeout`: `fetches[0].url === `${URL}/health``; `fetches[0].options.signal instanceof AbortSignal`; `HEALTH_TIMEOUT_MS === 90000`
8. `plan drops a trailing slash of BACKEND_URL`: `backendUrl: `${URL}/`` → `fetches[0].url === `${URL}/health``
9. `plan fails when git cannot read the backend history`: `backendLog: { status: 128, stdout: '' }` → `1`; `lines` deepEqual `['ERRO: não foi possível ler o último commit de backend/']`; `outputs` deepEqual `[]`; `fetches` deepEqual `[]`
10. `plan fails without BACKEND_URL and runs nothing`: `backendUrl: ''` → `1`; `lines` deepEqual `['ERRO: falta a variável BACKEND_URL (URL do serviço do Cloud Run)']`; `calls` and `fetches` deepEqual `[]`
11. `parseTraffic reads the serving revision and the tags`: `parseTraffic(DESCRIBE)` deepEqual `{ serving: PREVIOUS, tags: [{ tag: 'c-aaaaaaa', revision: CANDIDATE, url: TAG_URL }] }`
12. `parseTraffic finds no serving revision in a split`: `parseTraffic(traffic([{ revisionName: PREVIOUS, percent: 50 }, { revisionName: CANDIDATE, percent: 50 }]))` deepEqual `{ serving: null, tags: [] }`
13. `parseTraffic refuses text that is not a service`: `parseTraffic('not json') === null` and `parseTraffic(JSON.stringify({ status: {} })) === null`
14. `inspect prints the traffic and every tag`: `inspect(deps)` → `0`; `lines` deepEqual `['Tráfego: infinity-grove-backend-00007-abc', `Tag c-aaaaaaa: infinity-grove-backend-00008-def ${TAG_URL}`]`; `calls[0].command === 'gcloud'`; `calls[0].args` deepEqual `['run', 'services', 'describe', 'infinity-grove-backend', '--region', 'southamerica-east1', '--format', 'json']`; `calls[0].options.cwd === '/repo'`
15. `inspect says when no revision holds all the traffic`: `describe: { status: 0, stdout: traffic([{ revisionName: CANDIDATE, percent: 0, tag: 'probe', url: 'https://probe---x.run.app' }]) }` → `lines` deepEqual `['Tráfego: nenhuma revisão com 100%', 'Tag probe: infinity-grove-backend-00008-def https://probe---x.run.app']`
16. `inspect fails when gcloud cannot read the service`: `describe: { status: 1, stdout: '' }` → `1`; `lines` deepEqual `[DESCRIBE_ERROR]`; `DESCRIBE_ERROR === 'ERRO: não foi possível ler o serviço infinity-grove-backend no Cloud Run (gcloud run services describe)'`
17. `the tag and the traffic command follow the commit and the service`: `revisionTag(T) === 'c-aaaaaaa'`; `revisionTag('0123456789abcdef0123456789abcdef01234567') === 'c-0123456'`; `trafficArgs('--clear-tags')` deepEqual `['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--clear-tags']`
18. `main prints the usage for an unknown command`: `await main([], deps)` → `1`; `lines` deepEqual `[USAGE]`; `USAGE === 'Uso: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | image <commit> | release <commit>'`
19. `main refuses a release target that is not a full commit`: `await main(['release', 'abc1234'], deps)` → `1`; `lines` deepEqual `[USAGE]`; `calls` deepEqual `[]`
20. `main runs plan and inspect`: `await main(['plan'], deps)` → `0`; on a fresh machine `await main(['inspect'], deps)` → `0`
21. `githubOutput appends one name=value line per output`: `path = join(mkdtempSync(join(tmpdir(), 'gh-output-')), 'out')`; `githubOutput(path)({ deploy: 'true', target: T })` → `readFileSync(path, 'utf8') === `deploy=true\ntarget=${T}\n``
22. `image finds the prebuilt image of the commit`: `imageCheck(deps, T)` → `0`; `calls[0].command === 'gcloud'`; `calls[0].args` deepEqual `['artifacts', 'docker', 'images', 'describe', `${IMAGE}:${T}`, '--format', 'value(image_summary.digest)']`; `calls[0].options.cwd === '/repo'`; `outputs` deepEqual `[{ prebuilt: 'true' }]`; `lines` deepEqual `['Imagem aaaaaaa já está no Artifact Registry; testes, build, regressão e push não rodam de novo']`
23. `image asks for a build when the tag of the commit is missing`: `imageStatus: 1` → `0`; `outputs` deepEqual `[{ prebuilt: 'false' }]`; `lines` deepEqual `['Imagem aaaaaaa não está no Artifact Registry; testes, build, regressão e push rodam agora']`
24. `image fails without IMAGE and runs nothing`: `image: ''` → `1`; `lines` deepEqual `[MISSING_IMAGE]`; `MISSING_IMAGE === 'ERRO: falta a variável IMAGE (repositório do Artifact Registry)'`; `calls` and `outputs` deepEqual `[]`
25. `main runs image only for a full commit`: `await main(['image', T], deps)` → `0`; on a fresh machine `await main(['image', 'abc1234'], deps)` → `1` with `lines` deepEqual `[USAGE]` and `calls` deepEqual `[]`

**Gate**: Quick `node --test deploy/cloudrun/cloudRunRelease.test.mjs`, then Full (deploy) with `# tests 190`.
**Done when**:

- [x] The 25 tests pass.
- [x] Full (deploy) shows `# tests 245` (the task's order gives 190; T14 to T17 landed first), `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): plan the Cloud Run release and read the service traffic`

---

### T8: `release`: check the tagged revision, switch the traffic, go back [ ]

**Owner**: kotlin-backend-dev
**What**: `release <commit>` finds the revision the workflow just created with no traffic, checks `/health` and runs the regression on its tag URL, sends it 100 % of the traffic and checks the service URL, and sends the traffic back to the previous revision on failure (RUN-04; spec US-4 AC 6 to 11).
**Where**: `deploy/cloudrun/cloudRunRelease.mjs` (modify)
**Also changes**: `deploy/cloudrun/cloudRunRelease.test.mjs`
**Read first**: `deploy/cloudrun/cloudRunRelease.mjs` (T7), `deploy/cloudrun/cloudRunRelease.test.mjs` (T7 `machine`), `deploy/regression.mjs:177-190` (its CLI and `REGRESSION_COMMIT`), spec US-4 AC 6 to 11 and the Mensagens table
**Depends on**: T7
**Requirement**: RUN-04

**Contract**: add, right before `export const main`:

```js
const BY_HAND = `veja gcloud run revisions list --service ${SERVICE} --region ${REGION}`;
const servingName = (previous) => previous ?? 'nenhuma revisão';

//  Health and regression on the tag URL of the revision deployed with no traffic, then all the traffic to it, then the
//  service URL; a failure before the switch leaves the traffic alone, a failure after it sends the traffic back
export const release = async ({ exec, fetch, root, log, backendUrl }, target) =>
{
    if (!backendUrl)
    {
        log(MISSING_URL);

        return 1;
    }

    const gcloud = (args) =>
    {
        const result = exec('gcloud', args, { cwd: root, shell: GCLOUD_SHELL });
        printLines(log, result);

        return result;
    };
    const tag = revisionTag(target);
    const service = describeService(exec, root);

    if (!service.ok)
    {
        log(DESCRIBE_ERROR);

        return 1;
    }

    const previous = service.serving;
    const candidate = service.tags.find((entry) => entry.tag === tag && entry.revision && entry.url);

    if (!candidate)
    {
        log(`ERRO: a revisão de ${short(target)} (tag ${tag}) não está no serviço; o tráfego continua em ${servingName(previous)}`);

        return 1;
    }

    if (await healthCommit(fetch, candidate.url) !== target)
    {
        gcloud(trafficArgs('--remove-tags', tag));
        log(`ERRO: a revisão ${candidate.revision} de ${short(target)} não respondeu UP com o commit em ${candidate.url}/health; o tráfego continua em ${servingName(previous)}`);

        return 1;
    }

    const regression = exec('node', ['deploy/regression.mjs', candidate.url], { cwd: root, env: { REGRESSION_COMMIT: short(target) } });
    printLines(log, regression);

    if (regression.status !== 0)
    {
        gcloud(trafficArgs('--remove-tags', tag));
        log(`ERRO: a regressão falhou em ${short(target)}; o tráfego continua em ${servingName(previous)}`);

        return 1;
    }

    if (gcloud(trafficArgs('--to-revisions', `${candidate.revision}=100`, '--clear-tags')).status !== 0)
    {
        log(`ERRO: não foi possível mandar o tráfego para ${candidate.revision}; o tráfego continua em ${servingName(previous)}`);

        return 1;
    }

    if (await healthCommit(fetch, backendUrl) === target)
    {
        log(`Backend ${short(target)} no ar no Cloud Run (${candidate.revision})`);

        return 0;
    }

    if (!previous)
    {
        log(`ERRO: o serviço não respondeu ${short(target)} no /health depois da troca e não há revisão anterior; ${BY_HAND}`);

        return 1;
    }

    const back = trafficArgs('--to-revisions', `${previous}=100`);

    log(gcloud(back).status === 0
        ? `ERRO: o serviço não respondeu ${short(target)} no /health depois da troca; o tráfego voltou para ${previous}`
        : `ERRO: o serviço não respondeu ${short(target)} no /health depois da troca e a volta para ${previous} falhou; rode gcloud ${back.join(' ')}`);

    return 1;
};
```

and in `main`, after the `image` branch and before `deps.log(USAGE);`:

```js
    if (args.length === 2 && args[0] === 'release' && isCommit(args[1]))
    {
        return release(deps, args[1]);
    }
```

**Steps**:

1. Add `BY_HAND`, `servingName` and `release` to `cloudRunRelease.mjs`.
2. Add the `release` branch to `main`.
3. Add the test cases below to `cloudRunRelease.test.mjs`, reusing `machine`. `updates(calls)` = the calls with `command === 'gcloud'` and `args[2] === 'update-traffic'`.

**Tests**: unit
**Test cases** (`deploy/cloudrun/cloudRunRelease.test.mjs`, new):

1. `release checks the tagged revision, runs the regression on its URL and switches all the traffic`: `machine({ health: { [URL]: up(T) } })`; `await release(deps, T)` → `0`; `calls.map((c) => c.command)` deepEqual `['gcloud', 'node', 'gcloud']`; `calls[0].args` deepEqual `DESCRIBE_ARGS`; `calls[1].args` deepEqual `['deploy/regression.mjs', TAG_URL]` and `calls[1].options.env` deepEqual `{ REGRESSION_COMMIT: 'aaaaaaa' }`; `calls[2].args` deepEqual `['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--to-revisions', 'infinity-grove-backend-00008-def=100', '--clear-tags']`; `lines.at(-1) === 'Backend aaaaaaa no ar no Cloud Run (infinity-grove-backend-00008-def)'`
2. `release asks the tag URL before the switch and the service URL after it`: same machine → `fetches.map((f) => f.url)` deepEqual `[`${TAG_URL}/health`, `${URL}/health`]`; both `options.signal instanceof AbortSignal`
3. `release stops when the service cannot be read`: `describe: { status: 1, stdout: '' }` → `1`; `lines` deepEqual `[DESCRIBE_ERROR]`; `calls.length === 1`; `fetches` deepEqual `[]`
4. `release stops when the revision of the commit has no tag`: `describe: { status: 0, stdout: traffic([{ revisionName: PREVIOUS, percent: 100 }]) }` → `1`; `lines` deepEqual `['ERRO: a revisão de aaaaaaa (tag c-aaaaaaa) não está no serviço; o tráfego continua em infinity-grove-backend-00007-abc']`; `fetches` deepEqual `[]`
5. `a tagged revision that answers another commit gets no traffic and loses its tag`: `health: { [TAG_URL]: up(L) }` → `1`; `updates(calls)` has exactly one call, with `args` deepEqual `['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--remove-tags', 'c-aaaaaaa']`; `lines.at(-1) === `ERRO: a revisão infinity-grove-backend-00008-def de aaaaaaa não respondeu UP com o commit em ${TAG_URL}/health; o tráfego continua em infinity-grove-backend-00007-abc``; no call has `command === 'node'`
6. `a tagged revision that does not answer gets no traffic`: `health: { [TAG_URL]: 'fail' }` → `1`; same last line as case 5; no call has `command === 'node'`
7. `a failed regression keeps the traffic and drops the tag`: `regression: 1` → `1`; `calls.map((c) => c.command)` deepEqual `['gcloud', 'node', 'gcloud']`; `calls[2].args` deepEqual the `--remove-tags` args of case 5; `lines.at(-1) === 'ERRO: a regressão falhou em aaaaaaa; o tráfego continua em infinity-grove-backend-00007-abc'`; no call's `args` includes `'--to-revisions'`
8. `the regression output reaches the log`: `health: { [URL]: up(T) }`, `regressionOut: 'Regressão OK: 12 verificações em 3.0 s\n'` → `lines` deepEqual `['Regressão OK: 12 verificações em 3.0 s', 'Backend aaaaaaa no ar no Cloud Run (infinity-grove-backend-00008-def)']`
9. `a failed switch says where the traffic stays`: `trafficStatus: [1]` → `1`; `lines.at(-1) === 'ERRO: não foi possível mandar o tráfego para infinity-grove-backend-00008-def; o tráfego continua em infinity-grove-backend-00007-abc'`; `fetches.length === 1`
10. `a service that does not answer the new commit after the switch goes back to the previous revision`: default health (the service answers `L`) → `1`; `updates(calls).at(-1).args` deepEqual `['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--to-revisions', 'infinity-grove-backend-00007-abc=100']`; `lines.at(-1) === 'ERRO: o serviço não respondeu aaaaaaa no /health depois da troca; o tráfego voltou para infinity-grove-backend-00007-abc'`
11. `a failed way back names the command to run by hand`: `trafficStatus: [0, 1]` → `1`; `lines.at(-1) === 'ERRO: o serviço não respondeu aaaaaaa no /health depois da troca e a volta para infinity-grove-backend-00007-abc falhou; rode gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions infinity-grove-backend-00007-abc=100'`
12. `with no previous revision a failed check only explains`: `describe: { status: 0, stdout: traffic([{ revisionName: CANDIDATE, tag: 'c-aaaaaaa', url: TAG_URL }]) }` → `1`; `updates(calls).length === 1` (the switch); `lines.at(-1) === 'ERRO: o serviço não respondeu aaaaaaa no /health depois da troca e não há revisão anterior; veja gcloud run revisions list --service infinity-grove-backend --region southamerica-east1'`
13. `release fails without BACKEND_URL and runs nothing`: `backendUrl: ''` → `1`; `lines` deepEqual `[MISSING_URL]`; `calls` and `fetches` deepEqual `[]`
14. `main runs release`: `machine({ health: { [URL]: up(T) } })`; `await main(['release', T], deps)` → `0`

**Gate**: Quick `node --test deploy/cloudrun/cloudRunRelease.test.mjs` (39 tests), then Full (deploy) with `# tests 204`.
**Done when**:

- [ ] The 14 new tests and the 25 of T7 pass.
- [ ] Full (deploy) shows `# tests 204`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): release a tagged Cloud Run revision and switch the traffic back on failure`

---

### T9: The Deploy workflow and the image cleanup policy [ ]

**Owner**: kotlin-backend-dev
**What**: The GitHub Actions workflow that replaces the watcher (Workload Identity Federation sign-in, the image lookup, and only when the image of the commit is missing: backend tests, the regression on a throwaway database and the push; then a revision with no traffic, `release` and the Worker), gated by `CLOUD_RUN_PRODUCTION`, with the manual modes `build-only` (prebuild the image, deploy nothing) and `rehearsal`; plus the Artifact Registry cleanup policy and the ignored credential file of the auth action (RUN-05, RUN-02, RUN-07, RUN-09; spec US-3 AC 1 to 4, US-4 AC 15 to 24, US-6 AC 6, 7, 11, US-12 AC 1, 6).
**Where**: `.github/workflows/deploy.yml` (new)
**Also changes**: `deploy/cloudrun/artifact-cleanup.json` (new), `.gitignore`, `deploy/cloudrun/workflow.test.mjs` (new)
**Read first**: `deploy/cloudrun/cloudRunRelease.mjs` (T8), `deploy/lib/changes.mjs:2-12` (the game paths the watcher shipped), `game/scripts/deploy.mjs` (what `npm run deploy` runs), `deploy/lib/secrets.test.mjs` (git checks with `spawnSync`), design "A deploy, step by step" and "Connection budget"
**Depends on**: T8
**Requirement**: RUN-05, RUN-02, RUN-07, RUN-09

**Contract**:

`.github/workflows/deploy.yml`, exactly (two-space YAML indentation):

```yaml
# Production deploy (AD-023): the backend goes to Google Cloud Run, then the game Worker to Cloudflare.
# Every job waits for the repository variable CLOUD_RUN_PRODUCTION=true, which the owner sets at the cutover. A run by hand in
# mode build-only tests, builds and pushes the image of the newest backend commit (tag = the commit) and deploys nothing;
# rehearsal does the same and reads the service. Any run first looks for that image and skips tests, build and push when it exists.
name: Deploy

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
      - 'game/src/**'
      - 'game/public/**'
      - 'game/worker/**'
      - 'game/index.html'
      - 'game/vite.config.js'
      - 'game/package.json'
      - 'game/wrangler.jsonc'
      - 'game/scripts/deploy.mjs'
      - 'game/.env.pages'
      - 'deploy/cloudrun/**'
      - 'deploy/regression.mjs'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:
    inputs:
      mode:
        description: 'deploy: the release; build-only: test and push the image of the newest backend commit; rehearsal: build-only plus reading the service'
        type: choice
        options: [ deploy, build-only, rehearsal ]
        default: deploy

# One production run at a time; a newer run waits and the running one is never cancelled halfway
concurrency:
  group: production
  cancel-in-progress: false

env:
  IMAGE: southamerica-east1-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/infinity-grove/backend

jobs:
  backend:
    if: vars.CLOUD_RUN_PRODUCTION == 'true' || inputs.mode == 'build-only' || inputs.mode == 'rehearsal'
    runs-on: ubuntu-latest
    timeout-minutes: 45
    # id-token: the GitHub OIDC token that Workload Identity Federation trades for a short-lived Google token (no JSON key)
    permissions:
      contents: read
      id-token: write
    env:
      BACKEND_URL: ${{ vars.BACKEND_URL }}
      # a push has no inputs and deploys
      MODE: ${{ inputs.mode || 'deploy' }}
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - id: plan
        name: Plan (newest backend commit against the one live on Cloud Run)
        run: node deploy/cloudrun/cloudRunRelease.mjs plan
      - name: Sign in to Google Cloud (Workload Identity Federation, no key)
        if: steps.plan.outputs.deploy == 'true'
        uses: google-github-actions/auth@v3
        with:
          project_id: ${{ vars.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}
          service_account: ${{ vars.GCP_DEPLOY_SA }}
      - if: steps.plan.outputs.deploy == 'true'
        uses: google-github-actions/setup-gcloud@v3
      - id: image
        name: Look for the image of this commit in Artifact Registry
        if: steps.plan.outputs.deploy == 'true'
        run: node deploy/cloudrun/cloudRunRelease.mjs image ${{ steps.plan.outputs.target }}
      - if: steps.image.outputs.prebuilt == 'false'
        uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: 25
      - name: Backend tests
        if: steps.image.outputs.prebuilt == 'false'
        working-directory: backend
        run: chmod +x gradlew && ./gradlew ktlintCheck test --no-daemon
      - name: Build the candidate image
        if: steps.image.outputs.prebuilt == 'false'
        run: docker build -t "$IMAGE:${{ steps.plan.outputs.target }}" backend
      - name: Regression on a throwaway database
        if: steps.image.outputs.prebuilt == 'false'
        run: |
          docker network create ci
          docker run -d --name ci-postgres --network ci -e POSTGRES_DB=infinity_grove -e POSTGRES_USER=infinity -e POSTGRES_PASSWORD=infinity postgres:16
          until docker exec ci-postgres pg_isready -U infinity -d infinity_grove; do sleep 1; done
          docker run -d --name ci-backend --network ci -p 8080:8080 -e SPRING_DATASOURCE_URL=jdbc:postgresql://ci-postgres:5432/infinity_grove -e JWT_SECRET=ci-only-throwaway-secret-0123456789abcdef "$IMAGE:${{ steps.plan.outputs.target }}"
          for i in $(seq 1 60); do curl -fsS http://127.0.0.1:8080/health && break; sleep 3; done
          node deploy/regression.mjs http://127.0.0.1:8080
      - name: Candidate logs
        if: failure()
        run: docker logs ci-backend || true
      - name: Push the candidate image to Artifact Registry
        if: steps.image.outputs.prebuilt == 'false'
        run: gcloud auth configure-docker southamerica-east1-docker.pkg.dev --quiet && docker push "$IMAGE:${{ steps.plan.outputs.target }}"
      - name: Read the Cloud Run service (rehearsal)
        if: steps.plan.outputs.deploy == 'true' && env.MODE == 'rehearsal'
        run: node deploy/cloudrun/cloudRunRelease.mjs inspect
      - name: Deploy the revision without traffic (tag c-<commit>)
        if: steps.plan.outputs.deploy == 'true' && env.MODE == 'deploy'
        uses: google-github-actions/deploy-cloudrun@v3
        with:
          service: infinity-grove-backend
          region: southamerica-east1
          image: ${{ env.IMAGE }}:${{ steps.plan.outputs.target }}
          tag: ${{ steps.plan.outputs.tag }}
          no_traffic: true
          env_vars: |-
            APP_COMMIT=${{ steps.plan.outputs.target }}
            JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60
          env_vars_update_strategy: overwrite
          secrets: |-
            JWT_SECRET=jwt-secret:latest
            SPRING_DATASOURCE_URL=spring-datasource-url:latest
            SPRING_DATASOURCE_USERNAME=spring-datasource-username:latest
            SPRING_DATASOURCE_PASSWORD=spring-datasource-password:latest
          secrets_update_strategy: overwrite
          flags: >-
            --port=8080 --cpu=1 --memory=1Gi --cpu-boost --concurrency=80 --timeout=120
            --min-instances=0 --max-instances=1 --max=1
            --service-account=${{ vars.GCP_RUNTIME_SA }}
            --startup-probe=httpGet.path=/health,initialDelaySeconds=5,periodSeconds=5,timeoutSeconds=4,failureThreshold=36
            --liveness-probe=httpGet.path=/health,periodSeconds=60,timeoutSeconds=5,failureThreshold=3
      - name: Release on Cloud Run (health and regression on the tag URL, traffic, way back on failure)
        if: steps.plan.outputs.deploy == 'true' && env.MODE == 'deploy'
        run: node deploy/cloudrun/cloudRunRelease.mjs release ${{ steps.plan.outputs.target }}

  game:
    needs: backend
    if: vars.CLOUD_RUN_PRODUCTION == 'true' && (inputs.mode || 'deploy') == 'deploy' && needs.backend.result == 'success'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - name: Install
        working-directory: game
        run: npm install
      - name: Publish the Worker (proxies /api to Cloud Run)
        working-directory: game
        run: npm run deploy
        env:
          BACKEND_URL: ${{ vars.BACKEND_URL }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

`deploy/cloudrun/artifact-cleanup.json`, exactly (applied by the owner in O6):

```json
[
  {
    "name": "delete-older-than-30-days",
    "action": { "type": "Delete" },
    "condition": { "tagState": "any", "olderThan": "30d" }
  },
  {
    "name": "keep-3-most-recent",
    "action": { "type": "Keep" },
    "mostRecentVersions": { "keepCount": 3 }
  }
]
```

`.gitignore`: append one line `gha-creds-*.json` after the last line, with the comment line `# short-lived credential file of google-github-actions/auth (Deploy workflow)` right above it.

**Steps**:

1. Create the folder `.github/workflows/` and the file `.github/workflows/deploy.yml` with the exact text above.
2. Create `deploy/cloudrun/artifact-cleanup.json` with the exact text above.
3. Append the two lines to `.gitignore`.
4. Create `deploy/cloudrun/workflow.test.mjs`: `ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')`; `const yaml = readFileSync(join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8').replace(/\r\n/g, '\n')`; `const count = (text) => yaml.split(text).length - 1`; `const backend = yaml.slice(yaml.indexOf('\n  backend:'), yaml.indexOf('\n  game:'))`; `const game = yaml.slice(yaml.indexOf('\n  game:'))`; git with `spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' })`.
5. Write the test cases below.

**Tests**: unit
**Test cases** (`deploy/cloudrun/workflow.test.mjs`, one `test` each; "has" is `assert.ok(yaml.includes(<text>))`, "lacks" is `assert.ok(!yaml.includes(<text>))`):

1. `runs on every push to main and by hand`: has `    branches: [ main ]` and `  workflow_dispatch:`
2. `the trigger paths cover the backend, every game path the watcher shipped, the release script and itself`: for each of `backend/**`, `game/src/**`, `game/public/**`, `game/worker/**`, `game/index.html`, `game/vite.config.js`, `game/package.json`, `game/wrangler.jsonc`, `game/scripts/deploy.mjs`, `game/.env.pages`, `deploy/cloudrun/**`, `deploy/regression.mjs`, `.github/workflows/deploy.yml`: has `      - '<path>'`
3. `one production run at a time, never cancelled halfway`: has `  group: production` and `  cancel-in-progress: false`
4. `both jobs wait for the cutover variable, except a build-only or rehearsal backend run`: `count("vars.CLOUD_RUN_PRODUCTION == 'true'") === 2`; has `    if: vars.CLOUD_RUN_PRODUCTION == 'true' || inputs.mode == 'build-only' || inputs.mode == 'rehearsal'`
5. `a run by hand chooses deploy, build-only or rehearsal, and a push deploys`: has `      mode:`, `        type: choice`, `        options: [ deploy, build-only, rehearsal ]` and `        default: deploy`; `backend` includes `      MODE: ${{ inputs.mode || 'deploy' }}`; lacks `inputs.rehearsal`
6. `the steps are gated by plan, by the image lookup and by the mode`: `count("if: steps.plan.outputs.deploy == 'true'") === 6`, `count("if: steps.image.outputs.prebuilt == 'false'") === 5`, `count("steps.plan.outputs.deploy == 'true' && env.MODE == 'deploy'") === 2` and `count("steps.plan.outputs.deploy == 'true' && env.MODE == 'rehearsal'") === 1`
7. `the gate runs in order: sign-in, image lookup, tests, candidate regression, push, revision, release`: the indexes of `google-github-actions/auth@v3`, `node deploy/cloudrun/cloudRunRelease.mjs image`, `./gradlew ktlintCheck test`, `node deploy/regression.mjs http://127.0.0.1:8080`, `docker push`, `google-github-actions/deploy-cloudrun@v3`, `node deploy/cloudrun/cloudRunRelease.mjs release` are all `!== -1` and strictly increasing
8. `the candidate runs on the runner's throwaway Postgres`: has `postgres:16` and `-e SPRING_DATASOURCE_URL=jdbc:postgresql://ci-postgres:5432/infinity_grove`
9. `the backend job signs in with Workload Identity Federation and no key`: `backend` includes `      id-token: write`, `google-github-actions/auth@v3`, `workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}` and `service_account: ${{ vars.GCP_DEPLOY_SA }}`; `yaml` lacks `credentials_json`, `private_key` and `GOOGLE_CREDENTIALS`; `game` lacks `id-token`
10. `the revision is created with no traffic and the commit tag`: has `          service: infinity-grove-backend`, `          region: southamerica-east1`, `          image: ${{ env.IMAGE }}:${{ steps.plan.outputs.target }}`, `          tag: ${{ steps.plan.outputs.tag }}` and `          no_traffic: true`; has `  IMAGE: southamerica-east1-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/infinity-grove/backend`
11. `the service size, scale and probes are pinned`: has each of `--port=8080`, `--cpu=1 `, `--memory=1Gi`, `--cpu-boost`, `--concurrency=80`, `--timeout=120`, `--min-instances=0`, `--max-instances=1`, `--max=1`, `--service-account=${{ vars.GCP_RUNTIME_SA }}`, `--startup-probe=httpGet.path=/health,initialDelaySeconds=5,periodSeconds=5,timeoutSeconds=4,failureThreshold=36` and `--liveness-probe=httpGet.path=/health,periodSeconds=60,timeoutSeconds=5,failureThreshold=3`
12. `the environment and the secrets come from the workflow and Secret Manager only`: has `            APP_COMMIT=${{ steps.plan.outputs.target }}`, `            JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60`, `          env_vars_update_strategy: overwrite`, `            JWT_SECRET=jwt-secret:latest`, `            SPRING_DATASOURCE_URL=spring-datasource-url:latest`, `            SPRING_DATASOURCE_USERNAME=spring-datasource-username:latest`, `            SPRING_DATASOURCE_PASSWORD=spring-datasource-password:latest` and `          secrets_update_strategy: overwrite`; `count('SPRING_DATASOURCE_PASSWORD') === 1`
13. `the image is looked up, built, pushed and deployed under the commit plan chose, never latest`: has `      - id: image` and `        run: node deploy/cloudrun/cloudRunRelease.mjs image ${{ steps.plan.outputs.target }}`; `count('"$IMAGE:${{ steps.plan.outputs.target }}"') === 3` (build, runner regression, push); has `          image: ${{ env.IMAGE }}:${{ steps.plan.outputs.target }}`; lacks `backend:latest` and `$IMAGE:latest`
14. `the Worker waits for a green backend job of a deploy run and proxies to the service URL`: `game` includes `    needs: backend`, `needs.backend.result == 'success'`, `(inputs.mode || 'deploy') == 'deploy'` and `          BACKEND_URL: ${{ vars.BACKEND_URL }}`
15. `the only GitHub secrets are the Cloudflare ones and no address is hard-coded`: `[...new Set(yaml.match(/secrets\.[A-Z_]+/g))].sort()` deepEqual `['secrets.CLOUDFLARE_ACCOUNT_ID', 'secrets.CLOUDFLARE_API_TOKEN']`; `yaml.toLowerCase().includes('supabase')` is `false`; lacks `run.app` and `jdbc:postgresql://aws`
16. `the plan step reads the whole history and the service URL`: has `          fetch-depth: 0`, `      - id: plan` and `        run: node deploy/cloudrun/cloudRunRelease.mjs plan`; `backend` includes `      BACKEND_URL: ${{ vars.BACKEND_URL }}`
17. `build-only and rehearsal never reach the revision step`: has `        run: node deploy/cloudrun/cloudRunRelease.mjs inspect`; has `"        if: steps.plan.outputs.deploy == 'true' && env.MODE == 'deploy'\n        uses: google-github-actions/deploy-cloudrun@v3"`; the index of `cloudRunRelease.mjs inspect` is lower than the index of `deploy-cloudrun@v3`
18. `the actions run on their current major versions`: has `actions/checkout@v7`, `actions/setup-node@v7`, `actions/setup-java@v6` and `google-github-actions/setup-gcloud@v3`
19. `the image cleanup deletes after 30 days and keeps the 3 newest`: `JSON.parse(readFileSync(join(ROOT, 'deploy', 'cloudrun', 'artifact-cleanup.json'), 'utf8'))` deepEqual `[{ name: 'delete-older-than-30-days', action: { type: 'Delete' }, condition: { tagState: 'any', olderThan: '30d' } }, { name: 'keep-3-most-recent', action: { type: 'Keep' }, mostRecentVersions: { keepCount: 3 } }]`
20. `the credential file of the auth action is ignored by git`: `git check-ignore -q gha-creds-0123abcd.json` → status `0`

**Gate**: Quick `node --test deploy/cloudrun/workflow.test.mjs`, then Full (deploy) with `# tests 224`. The workflow itself first runs in the owner's rehearsal and prebuild (design O14 and O15, spec M9 and M15).
**Done when**:

- [ ] The 20 tests pass.
- [ ] Full (deploy) shows `# tests 224`, `# fail 2`, only the two known `not ok` lines.
- [ ] After the push, the GitHub Actions run of this commit shows both jobs as skipped (`CLOUD_RUN_PRODUCTION` is not set): `gh run list --workflow deploy.yml --limit 1 --json conclusion --jq '.[0].conclusion'` prints `skipped` or `success` with both jobs skipped in `gh run view`.

**Commit**: `ci: deploy the backend to Cloud Run and the Worker after tests and regression`

---

### T10: Health adapter and the `backend` service of the game [x]

**Owner**: game-dev
**What**: An http adapter whose `wake()` asks `GET /health` once with a 60 s timeout and never rejects, handed to the scenes as `services.backend` (RUN-06; spec US-5 AC 1, 5, 8).
**Where**: `game/src/adapters/http/healthApi.js` (new)
**Also changes**: `game/src/adapters/http/healthApi.test.js` (new), `game/src/composition.js`, `game/src/composition.test.js`
**Read first**: `game/src/adapters/http/userApi.js` (adapter shape, `skipAuth`), `game/src/adapters/http/userApi.test.js` (fake `httpClient`), `game/src/adapters/http/httpClient.js` (per-request options), `game/src/composition.js:25-62`, `game/src/composition.test.js:5-11`
**Depends on**: T4
**Requirement**: RUN-06

**Contract**: `game/src/adapters/http/healthApi.js`, exactly:

```js
//  Wraps the backend HealthController (GET /health, public). Cloud Run may be starting the backend from zero (spec supabase-postgres, RUN-06):
//  wake() asks once and waits up to WAKE_TIMEOUT_MS. It resolves true when the backend answered 2xx and false on any error; it never rejects.
export const WAKE_TIMEOUT_MS = 60000;

export const createHealthApi = (httpClient) => ({
    wake: async () =>
    {
        try
        {
            await httpClient.get('/health', { skipAuth: true, timeout: WAKE_TIMEOUT_MS });

            return true;
        }
        catch
        {
            return false;
        }
    }
});
```

`game/src/composition.js`:

- add `import { createHealthApi } from './adapters/http/healthApi';` in alphabetical order of the adapter imports (after `createFarmApi`, before `createHeroesApi`);
- after `export const accountResetApi = createAccountResetApi(httpClient);` add `export const healthApi = createHealthApi(httpClient);`;
- in `services`, after `users: userApi,` add `backend: healthApi,`, and the comment above `services` becomes `//  What the scenes receive through the game registry (see main.js); backend.wake() waits for a backend Cloud Run is starting`.

`game/src/composition.test.js`, first test: the sorted key list becomes `['autoClickPreference', 'backend', 'createAccountReset', 'createAutoClickState', 'createCampaignSession', 'createEquipmentCollection', 'createFarmSession', 'createHeroCollection', 'createTalentCollection', 'createWalletSync', 'session', 'users']`, and it also checks `expect(typeof services.backend.wake).toBe('function')`.

**Steps**:

1. Create `healthApi.js`.
2. Edit `composition.js`.
3. Create `healthApi.test.js` with a fake `httpClient = { get: vi.fn() }`.
4. Edit the first test of `composition.test.js`.

**Tests**: unit
**Test cases** (`game/src/adapters/http/healthApi.test.js`):

1. `wake asks GET /health once, without a token, with a 60 s timeout, and resolves true`: `get` resolves `{ data: { status: 'UP', commit: 'x' } }` → `await wake()` is `true`; `get` called once with `('/health', { skipAuth: true, timeout: 60000 })`
2. `wake resolves false when the request fails`: `get` rejects `new Error('Network Error')` → `false`
3. `wake resolves false when the backend answers 503`: `get` rejects `Object.assign(new Error('Service Unavailable'), { status: 503 })` → `false`
4. `the wake timeout is 60 s`: `WAKE_TIMEOUT_MS === 60000`

`game/src/composition.test.js`: the edited first test (new key `backend`, `services.backend.wake` is a function).

**Gate**: Game unit `cd game && npm test && npm run build`.
**Done when**:

- [x] The 4 new tests and the edited composition test pass.
- [x] `npm test` reports 4 more tests than before the task, with none failing; `npm run build` exits 0.

**Commit**: `feat(game): add the backend wake-up call`

---

### T11: The start screen waits for the server [ ]

**Owner**: game-dev
**What**: `MainMenu` calls `backend.wake()` before the session restore and shows `Acordando o servidor, aguarde...` after 2 s of waiting (RUN-06; spec US-5 AC 1 to 7).
**Where**: `game/src/adapters/phaser/MainMenu.js` (modify)
**Also changes**: `game/src/adapters/phaser/MainMenu.test.js`
**Read first**: `game/src/adapters/phaser/MainMenu.js:70-142` (`create`, `restoreSession`), `:290-294` (`showMessage`), `game/src/adapters/phaser/MainMenu.test.js:1-100` (`createScene`, `flush`, `open`, `beforeEach`), `:295-350` (session restore tests)
**Depends on**: T10
**Requirement**: RUN-06

**Contract** (`MainMenu.js`, three edits):

1. Below `const TAGLINE_TEXT = ...;` add:

```js
//  Cloud Run may be starting the backend from zero (spec supabase-postgres, RUN-06): after this long without an answer the message says so
const WAKE_TEXT = 'Acordando o servidor, aguarde...';
const WAKE_NOTICE_MS = 2000;
```

2. In `create()`, the destructuring becomes `({ session: this.session, users: this.users, backend: this.backend } = this.registry.get('services'));`.

3. `restoreSession()` becomes:

```js
    async restoreSession ()
    {
        this.showMessage('...');

        //  One wake-up call before any session call; the notice only shows when the backend takes longer than WAKE_NOTICE_MS
        const notice = setTimeout(() =>
        {
            if (this.sys.isActive()) { this.showMessage(WAKE_TEXT); }
        }, WAKE_NOTICE_MS);

        await this.backend.wake();
        clearTimeout(notice);

        //  Scene may have been left while the wake-up was in flight
        if (!this.sys.isActive()) { return; }

        this.showMessage('...');

        const result = await this.session.restore();
```

followed by the rest of the current method unchanged (from `//  Scene may have been left while the restore was in flight` to the end).

`MainMenu.test.js`: add `const backend = { wake: vi.fn() };` next to `sessionManager`; `createScene` puts it in `services` (`services: { session: sessionManager, users: userApi, backend }`); `beforeEach` adds `vi.mocked(backend.wake).mockReset().mockResolvedValue(true);`; add `afterEach(() => vi.useRealTimers());` (import `afterEach` from `vitest`).

**Steps**:

1. Apply the three edits to `MainMenu.js`.
2. Apply the setup edits to `MainMenu.test.js`; the existing tests must pass unchanged.
3. Add the new `describe('MainMenu backend wake-up', ...)` with the test cases below.

**Tests**: unit
**Test cases** (`MainMenu.test.js`, new `describe('MainMenu backend wake-up')`; `WAKE = 'Acordando o servidor, aguarde...'`):

1. `asks the backend to wake up once, before the session restore`: `await open(scene)` → `backend.wake` called once; `backend.wake.mock.invocationCallOrder[0] < sessionManager.restore.mock.invocationCallOrder[0]`
2. `keeps the pending dots for the first 2 s`: `vi.useFakeTimers()`; `backend.wake.mockReturnValue(new Promise(() => {}))`; `scene.create()`; `vi.advanceTimersByTime(1999)` → `message()` deepEqual `{ text: '...', isError: false }`; `sessionManager.restore` not called
3. `shows the wake-up notice after 2 s without the error style`: as case 2, then `vi.advanceTimersByTime(1)` → `message()` deepEqual `{ text: WAKE, isError: false }`
4. `restores the session once the backend answers after the notice`: fake timers; `let resolveWake; backend.wake.mockReturnValue(new Promise((r) => { resolveWake = r; }))`; `scene.create()`; `vi.advanceTimersByTime(2000)`; `resolveWake(true)`; `await vi.runAllTimersAsync()` → `sessionManager.restore` called once; `message()` deepEqual `{ text: '', isError: false }`; `form.getChildByName('login')` is not `null` (restore answered `{ status: 'none' }`)
5. `shows no notice when the backend answers within 2 s`: fake timers; `const shown = vi.spyOn(scene, 'showMessage')` before `scene.create()`; wake resolves at once; `await vi.advanceTimersByTimeAsync(5000)` → no call of `shown` has first argument `WAKE`
6. `still restores the session when the backend cannot be reached`: `backend.wake.mockResolvedValue(false)`; `sessionManager.restore.mockResolvedValue({ status: 'offline', message: 'Cannot reach the server. Try again later.' })`; `await open(scene)` → `message()` deepEqual `{ text: 'Cannot reach the server. Try again later.', isError: true }`; the login form is shown
7. `does nothing when the scene is left while the backend wakes up`: fake timers; pending wake as in case 4; `scene.create()`; `scene.sys.isActive.mockReturnValue(false)`; `vi.advanceTimersByTime(3000)` → `message().text === '...'`; `resolveWake(true)`; `await vi.runAllTimersAsync()` → `sessionManager.restore` not called
8. `does not wake the backend when a user is already in the registry`: `createScene({ highscore: 0, user: { username: 'yan', createdAt: 1, lastLoginAt: 2 } })`; `await open(scene)` → `backend.wake` not called

**Gate**: Game unit `cd game && npm test && npm run build`.
**Done when**:

- [ ] The 8 new tests and every existing `MainMenu.test.js` test pass.
- [ ] `npm test` reports 8 more tests than after T10, with none failing; `npm run build` exits 0.

**Commit**: `feat(game): wait for the backend to wake up on the start screen`

---

### T12: e2e of the wake-up and the review screenshots [ ]

**Owner**: test-engineer
**What**: The fake backend answers `/api/health` (with an optional delay, outside `calls`), an e2e spec covers the notice, the single call and the server-down path, and a shots file captures the screens for the `ui-artist` (RUN-06; spec US-5 AC 1 to 5).
**Where**: `game/e2e/wake.spec.js` (new)
**Also changes**: `game/e2e/support/fakeBackend.js`, `game/ui-review/supabasePostgres.shots.js` (new)
**Read first**: `game/e2e/support/fakeBackend.js:225-240` (`mockBackend` options and doc comment), `:768-778` (`handler`, `calls`, `delayMs`), `:857-885` (routes and the returned object), `:904-907` (`serverDown`); `game/e2e/session.spec.js:1-30` and `:76-90` (`logIn`, `expireStoredAccessToken`, the server-down reload); `game/e2e/support/game.js:4-45` (`openMainMenu`); `game/ui-review/heroAscension.shots.js:1-40` (`watch`, `report`); `game/ui-review/support/shots.js` (`shot`)
**Depends on**: T11
**Requirement**: RUN-06

**Contract**:

`fakeBackend.js`:

- `mockBackend` gets the option `healthDelayMs = 0` (last in the destructuring) and the doc comment gains: `healthDelayMs delays the answer of GET /api/health (the backend wake-up of spec supabase-postgres), which is counted by healthCalls() and kept out of calls.`
- inside `mockBackend`, before the other `page.route` calls:

```js
    let healthCalls = 0;

    //  GET /health of HealthController: UP with a fixed commit, after healthDelayMs; outside `calls` so the API call lists stay the same
    await page.route('**/api/health', async (route) => {
        healthCalls += 1;

        if (healthDelayMs) { await new Promise((resolve) => setTimeout(resolve, healthDelayMs)); }

        return route.fulfill({ json: { status: 'UP', commit: 'e2e' } });
    });
```

- the returned object gains `healthCalls: () => healthCalls,`.
- `serverDown` gains a third line: `await page.route('**/api/health', (route) => route.abort('connectionrefused'));`.

`game/e2e/wake.spec.js`: imports `{ expect, test }` from `./support/coverage`, `{ mockBackend, serverDown }` from `./support/fakeBackend`, `{ fillCredentials, openMainMenu, SESSION_KEY }` from `./support/game`; copies `logIn` and `expireStoredAccessToken` from `session.spec.js`. `WAKE = 'Acordando o servidor, aguarde...'`.

`game/ui-review/supabasePostgres.shots.js`: one `test('start screen while the server wakes up', ...)` that starts with `const problems = watch(page)` and ends with `report(testInfo, 'start screen', problems)` (copy both helpers from `heroAscension.shots.js`); `mockBackend(page, { healthDelayMs: 8000 })`; `page.goto('/')`; wait for `window.__PHASER_GAME__?.registry.has('highscore')`; click the canvas; wait until `page.getByRole('alert')` has text `Acordando o servidor, aguarde...`; `page.mouse.move(0, 0)`; `shot(page, testInfo, '01-wake-notice')`; wait for `.auth-form` visible (timeout 15 s); `shot(page, testInfo, '02-form-after-wake')`.

**Steps**:

1. Edit `fakeBackend.js` as above.
2. Create `wake.spec.js` with the test cases below.
3. Create `supabasePostgres.shots.js`.
4. Run the Game e2e gate, then `cd game && npm run ui:shots -- supabasePostgres`.

**Tests**: e2e
**Test cases** (`game/e2e/wake.spec.js`):

1. `while the server wakes up the start screen says so, then shows the form` (US-5 AC 2 to 4): `mockBackend(page, { healthDelayMs: 4000 })`; `page.goto('/')`; wait for the registry `highscore`; click `#game-container canvas`; `await expect(page.getByRole('alert')).toHaveText(WAKE, { timeout: 5000 })`; `await expect(page.getByRole('alert')).not.toHaveClass(/error/)`; `await expect(page.locator('.auth-form')).toBeVisible({ timeout: 10000 })`; `await expect(page.getByRole('alert')).toHaveText('')`
2. `a server that answers at once shows the form with no notice` (AC 2): `const backend = await mockBackend(page)`; `const menu = await openMainMenu(page)`; `await expect(menu.message).toHaveText('')`; `expect(backend.healthCalls()).toBe(1)`
3. `the start screen asks the server once and keeps it out of the API calls` (AC 1): `const backend = await mockBackend(page, { users: { yan: 'secret123' } })`; `await logIn(page)` → `expect(backend.healthCalls()).toBe(1)`; `expect(backend.calls.some((call) => call.path === '/health')).toBe(false)`
4. `with the server down the form explains why without waiting for the wake-up timeout` (AC 5): `mockBackend(page, { users: { yan: 'secret123' } })`; `logIn`; `expireStoredAccessToken`; `serverDown(page)`; `const started = Date.now()`; `page.reload()`; `const menu = await openMainMenu(page)`; `await expect(menu.message).toHaveText('Cannot reach the server. Try again later.')`; `expect(Date.now() - started).toBeLessThan(15000)`

**Gate**: Game e2e `cd game && npx playwright test e2e/wake.spec.js e2e/session.spec.js e2e/auth.spec.js`, then `cd game && npx playwright test --workers=2`; then `cd game && npm run ui:shots -- supabasePostgres`.
**Done when**:

- [ ] The 4 tests of `wake.spec.js` pass, and `session.spec.js` and `auth.spec.js` pass unchanged.
- [ ] The full e2e suite passes (flake rule of the Game e2e gate).
- [ ] `.specs/features/supabase-postgres/ui-review/` holds `01-wake-notice-desktop.png`, `01-wake-notice-phone.png`, `02-form-after-wake-desktop.png` and `02-form-after-wake-phone.png`, and the run prints `CONSOLE-REPORT start screen (desktop): clean` and `CONSOLE-REPORT start screen (phone): clean`.

**Commit**: `test(game): cover the backend wake-up on the start screen`

---

### T13: UI review of the wake-up notice [ ]

**Owner**: ui-artist
**What**: Review the start screen while the server wakes up and after, on desktop and phone, and write the report (RUN-06; spec US-5 AC 2 to 4).
**Where**: `.specs/features/supabase-postgres/ui-review.html` (new; copy the template named under **Read first**)
**Read first**: `.claude/templates/ui-review.html`, `.specs/features/supabase-postgres/ui-review/*.png` (T12), `game/public/style.css:324-341` (`.auth-message`), `game/src/adapters/phaser/MainMenu.js:5-10` (column and oval), spec US-5 and the Mensagens table
**Depends on**: T12
**Requirement**: RUN-06

**Contract** (each item is pass or a finding, with the screenshot that shows it):

1. The notice reads exactly `Acordando o servidor, aguarde...` (three dots, no ellipsis character).
2. It sits in the message slot of the parchment oval (`.auth-message`, DOM at x 230, y 560 of the 1024 x 768 canvas), on one line inside its 340 px width, on both desktop (1280 x 720) and phone (390 x 844).
3. It uses the non-error style: 15 px, weight 700, colour `var(--color-accent-2-800)`, not `var(--ember-800)`.
4. Its contrast against the parchment `#ead6ad` is at least 4.5:1 (state the ratio).
5. Nothing overlaps it: the tagline (y 300), the logo (y 150) and the hero lineup on the right stay where they are.
6. After the wake-up the form shows and the message is empty (`02-form-after-wake`).
7. The console report of both projects is `clean`.

**Steps**:

1. Run `cd game && npm run ui:shots -- supabasePostgres` if the PNGs are missing or older than the last commit of `MainMenu.js`.
2. Check items 1 to 7 and write `ui-review.html` with the verdict (approved or findings).

**Tests**: none (review; the report is the check)
**Gate**: `.specs/features/supabase-postgres/ui-review.html` exists, names the verdict and links the four PNGs.
**Done when**:

- [ ] Each of the 7 items has a result and a screenshot in the report.
- [ ] Every finding is listed with the exact change it asks for; `product-owner` turns findings into tasks before the Verifier.

**Commit**: `docs(review): review the start screen while the server wakes up`

---

### T14: Postgres tool runner and the copy SQL [x]

**Owner**: kotlin-backend-dev
**What**: Build every `docker run postgres:<major>` call of the copy, passing connection values only by variable name, and hold every SQL text of the copy (SUPA-06, SUPA-08; spec US-6 AC 4, US-7 AC 8, 19, 20).
**Where**: `deploy/db/pgTools.mjs` (new)
**Also changes**: `deploy/db/pgTools.test.mjs` (new)
**Read first**: `deploy/lib/regressionRun.mjs` (`docker run --rm --network backend_default -v`), `deploy/lib/run.mjs` (how `env` merges), `deploy/lib/databaseEnv.mjs` (`jdbcParts`)
**Depends on**: T2
**Requirement**: SUPA-08

**Contract**:

```js
//  The Postgres tools of the Supabase copy run in throwaway postgres:<major> containers on the compose network; every connection
//  value goes in by variable name (-e PGPASSWORD), never as an argument, so no process list or log shows the password
import { join } from 'node:path';
import { jdbcParts } from '../lib/databaseEnv.mjs';

export const NETWORK = 'backend_default';
export const PROBE_IMAGE = 'postgres:17';
export const LOCAL_CONTAINER = 'infinity-grove-postgres';
export const LOCAL_TARGET = { host: 'postgres', port: 5432, database: 'infinity_grove', user: 'infinity', password: 'infinity', sslmode: 'disable' };
export const PG_ENV_NAMES = ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGSSLMODE'];

export const toolImage = (major) => `postgres:${major}`;

export const supabaseTarget = (vars) =>
{
    const { host, port, database, params } = jdbcParts(vars.SPRING_DATASOURCE_URL);

    return { host, port, database, user: vars.SPRING_DATASOURCE_USERNAME, password: vars.SPRING_DATASOURCE_PASSWORD, sslmode: params.sslmode };
};

export const pgEnv = (target) => ({
    PGHOST: target.host,
    PGPORT: String(target.port),
    PGDATABASE: target.database,
    PGUSER: target.user,
    PGPASSWORD: target.password,
    PGSSLMODE: target.sslmode
});

export const pgRun = (exec, root, { image, target, mount = false, command }) =>
    exec('docker', [
        'run', '--rm', '--network', NETWORK,
        ...PG_ENV_NAMES.flatMap((name) => ['-e', name]),
        ...(mount ? ['-v', `${join(root, 'backups')}:/backups`] : []),
        image,
        ...command
    ], { cwd: root, env: pgEnv(target) });

export const psql = (exec, root, image, target, sql) =>
    pgRun(exec, root, { image, target, command: ['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql] });

export const SQL = {
    version: 'show server_version_num',
    tableCount: "select count(*) from pg_tables where schemaname = 'public'",
    tableCounts: "select tablename || '|' || (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', tablename), false, true, '')))[1]::text from pg_tables where schemaname = 'public' order by tablename",
    sequences: "select sequencename || '|' || coalesce(last_value, 0) from pg_sequences where schemaname = 'public' order by sequencename",
    flyway: "select coalesce(version, 'R') || '|' || coalesce(checksum::text, '') from public.flyway_schema_history where success order by installed_rank",
    dataApiGrants: "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join lateral aclexplode(c.relacl) a join pg_roles r on r.oid = a.grantee where n.nspname = 'public' and r.rolname in ('anon', 'authenticated', 'service_role')",
    revokeDefaults: 'alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role; alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role; alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated, service_role',
    revokeExisting: 'revoke all on all tables in schema public from anon, authenticated, service_role; revoke all on all sequences in schema public from anon, authenticated, service_role; revoke all on all functions in schema public from anon, authenticated, service_role'
};

//  Supabase already has the public schema: its CREATE and COMMENT entries leave the restore list
export const filterRestoreList = (text) =>
    text.split(/\r?\n/)
        .filter((line) => !/ SCHEMA - public( |$)/.test(line) && !/ COMMENT - SCHEMA public( |$)/.test(line))
        .join('\n');
```

**Steps**:

1. Create the folder `deploy/db/` and the file `deploy/db/pgTools.mjs` with the code above.
2. Create `deploy/db/pgTools.test.mjs` with a fake `exec` that records `{ command, args, options }` and answers `{ status: 0, stdout: '', stderr: '' }` (pattern: `deploy/lib/slots.test.mjs:9`). `ROOT = '/repo'`. `VARS` = the `SUPABASE` object of T2.

**Tests**: unit
**Test cases** (`deploy/db/pgTools.test.mjs`):

1. `the tool image follows the Supabase major`: `toolImage(17) === 'postgres:17'` and `toolImage(18) === 'postgres:18'`
2. `supabaseTarget reads host, port, database and sslmode from the URL`: `supabaseTarget(VARS)` → `{ host: 'aws-0-sa-east-1.pooler.supabase.com', port: 5432, database: 'postgres', user: 'postgres.jnqlrdnwwqslihncszej', password: 'Fake0Password1ForTests', sslmode: 'require' }`
3. `pgEnv maps a Supabase target to the libpq variables`: → `{ PGHOST: 'aws-0-sa-east-1.pooler.supabase.com', PGPORT: '5432', PGDATABASE: 'postgres', PGUSER: 'postgres.jnqlrdnwwqslihncszej', PGPASSWORD: 'Fake0Password1ForTests', PGSSLMODE: 'require' }`
4. `pgEnv maps the local target`: `pgEnv(LOCAL_TARGET)` → `{ PGHOST: 'postgres', PGPORT: '5432', PGDATABASE: 'infinity_grove', PGUSER: 'infinity', PGPASSWORD: 'infinity', PGSSLMODE: 'disable' }`
5. `pgRun passes every connection value by name, never as an argument`: `pgRun(exec, ROOT, { image: 'postgres:17', target: supabaseTarget(VARS), command: ['psql', '-c', 'select 1'] })` → `args` deepEqual `['run', '--rm', '--network', 'backend_default', '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGDATABASE', '-e', 'PGUSER', '-e', 'PGPASSWORD', '-e', 'PGSSLMODE', 'postgres:17', 'psql', '-c', 'select 1']`; no element of `args` includes `'Fake0Password1ForTests'`; `options.env.PGPASSWORD === 'Fake0Password1ForTests'`; `options.cwd === ROOT`
6. `pgRun mounts backups only when asked`: with `mount: true`, `args` contains `'-v'` followed by `` `${join(ROOT, 'backups')}:/backups` ``, right before `'postgres:17'`; with `mount: false` (case 5), `args` has no `'-v'`
7. `psql runs one command with ON_ERROR_STOP, tuples only and unaligned`: `psql(exec, ROOT, 'postgres:17', LOCAL_TARGET, 'select 1')` → the arguments after `'postgres:17'` deepEqual `['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', 'select 1']`
8. `the local target and constants name the compose postgres`: `LOCAL_TARGET` deepEqual the contract object; `NETWORK === 'backend_default'`; `PROBE_IMAGE === 'postgres:17'`; `LOCAL_CONTAINER === 'infinity-grove-postgres'`
9. `filterRestoreList drops the public schema entry and its comment`: input `[';', '; Archive created at 2026-11-15 14:30:00 UTC', '5; 2615 2200 SCHEMA - public pg_database_owner', '4180; 0 0 COMMENT - SCHEMA public pg_database_owner', '218; 1259 16385 TABLE public users infinity', ''].join('\n')` → `[';', '; Archive created at 2026-11-15 14:30:00 UTC', '218; 1259 16385 TABLE public users infinity', ''].join('\n')`
10. `filterRestoreList keeps a list with no schema entry unchanged`: `'218; 1259 16385 TABLE public users infinity\n219; 1259 16390 TABLE public wallets infinity\n'` → same string
11. `no SQL names a schema other than public`: for every value of `SQL`: `/\b(auth|storage|extensions|realtime|graphql|graphql_public|vault|pgsodium|cron|net|supabase_\w+)\./.test(sql)` is `false`, and every match of `/in schema (\w+)/g` has group 1 `'public'`
12. `the default privileges are revoked for tables, sequences and functions`: `SQL.revokeDefaults` equals the contract string
13. `the existing grants are revoked on tables, sequences and functions`: `SQL.revokeExisting` equals the contract string

**Gate**: Quick `node --test deploy/db/pgTools.test.mjs`, then Full (deploy) with `# tests 237`.
**Done when**:

- [x] The 13 tests pass.
- [ ] Full (deploy) shows `# tests 237`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): run the Postgres tools of the Supabase copy in containers`

---

### T15: Database snapshot and comparison [x]

**Owner**: kotlin-backend-dev
**What**: Read row counts, sequences, Flyway history and Data API grants of one database, and compare two snapshots into the exact `verify` lines (SUPA-09; spec US-7 AC 14, 15).
**Where**: `deploy/db/snapshot.mjs` (new)
**Also changes**: `deploy/db/snapshot.test.mjs` (new)
**Read first**: `deploy/db/pgTools.mjs` (T14), spec US-7 AC 14 and 15
**Depends on**: T14
**Requirement**: SUPA-09

**Contract**:

```js
//  What the copy compares between the local Postgres and Supabase: row counts, sequences, the Flyway history and Data API grants
import { SQL, psql } from './pgTools.mjs';

export const parsePairs = (stdout) => /* Map<string, string> */;
export const takeSnapshot = (exec, root, image, target, { grants = false } = {}) => /* Snapshot */;
export const compareSnapshots = (local, remote) => /* { lines, differences, tables, rows } */;
```

- `parsePairs(stdout)`: split on `/\r?\n/`, skip lines that are empty after trim; each line splits at its **first** `|` into `[name, value]`; return a `Map` in input order.
- `takeSnapshot`: run `psql(exec, root, image, target, sql)` for `SQL.tableCounts`, then `SQL.sequences`, then `SQL.flyway`, then (only when `grants`) `SQL.dataApiGrants`. When any status is not 0, return `{ ok: false }` right away. Else return `{ ok: true, tables: parsePairs(counts.stdout), sequences: parsePairs(seq.stdout), flyway: <flyway.stdout split on /\r?\n/, trimmed, empty lines dropped>, grants: grants ? Number(g.stdout.trim()) : null }`.
- `compareSnapshots(local, remote)`: `lines = []`, `differences = 0`.
  1. Tables: `names` = the union of the keys of both `tables`, sorted with `localeCompare`. For each: `l = local.tables.get(n) ?? '-'`, `r = remote.tables.get(n) ?? '-'`, `same = l !== '-' && l === r`. Push `` `${n}: local ${l}, supabase ${r} ${same ? 'OK' : 'DIFERENTE'}` ``; `differences += same ? 0 : 1`.
  2. Sequences: the same over `sequences`, with the line `` `sequência ${n}: local ${l}, supabase ${r} ${same ? 'OK' : 'DIFERENTE'}` ``.
  3. Flyway: `same` when both arrays have the same length and the same items in order. Same → `` `Histórico do Flyway: ${local.flyway.length} migrações, última ${local.flyway.length ? local.flyway.at(-1).split('|')[0] : '-'} OK` ``; else `` `Histórico do Flyway: local ${local.flyway.length} migrações, supabase ${remote.flyway.length} DIFERENTE` `` and `differences += 1`.
  4. Grants: `remote.grants === 0` → `'Permissões do Data API: 0 OK'`; else `` `Permissões do Data API: ${remote.grants} concessões para anon, authenticated ou service_role DIFERENTE` `` and `differences += 1`.
  5. `tables = names.length`; `rows` = the sum of `Number(v)` over `local.tables` values.
  6. Last line: `differences === 0` → `` `Verificação OK: ${tables} tabela(s), ${rows} linha(s)` ``; else `` `Verificação FALHOU: ${differences} diferença(s)` ``.
  7. Return `{ lines, differences, tables, rows }`.

**Steps**:

1. Create `deploy/db/snapshot.mjs`.
2. Create `deploy/db/snapshot.test.mjs`. Helper `snap(tables, sequences, flyway, grants)` builds `{ ok: true, tables: new Map(tables), sequences: new Map(sequences), flyway, grants }`. `EQUAL = snap([['users', '3'], ['wallets', '2']], [['refresh_tokens_id_seq', '7']], ['1|111', '10|999'], 0)`. Fake `exec` answers by the last argument (the SQL): `SQL.tableCounts` → `'users|3\nwallets|2\n'`, `SQL.sequences` → `'refresh_tokens_id_seq|7\n'`, `SQL.flyway` → `'1|111\n10|999\n'`, `SQL.dataApiGrants` → `'0\n'`.

**Tests**: unit
**Test cases** (`deploy/db/snapshot.test.mjs`):

1. `parsePairs reads name|value lines and skips blank ones`: `'users|3\n\nwallets|2\n'` → `new Map([['users', '3'], ['wallets', '2']])`
2. `parsePairs reads CRLF output`: `'users|3\r\nwallets|2\r\n'` → same Map
3. `takeSnapshot with grants runs four queries in order`: the last argument of each call, in order, equals `[SQL.tableCounts, SQL.sequences, SQL.flyway, SQL.dataApiGrants]`; the result has `ok: true`, `tables` Map `users→3, wallets→2`, `sequences` Map `refresh_tokens_id_seq→7`, `flyway` `['1|111', '10|999']`, `grants` `0`
4. `takeSnapshot without grants runs three queries and leaves grants null`: 3 calls; `grants === null`
5. `takeSnapshot fails when a query fails`: the fake answers status `2` for `SQL.sequences` → result `{ ok: false }` and no `SQL.flyway` call is made
6. `equal snapshots print OK lines and the total`: `compareSnapshots(EQUAL, EQUAL).lines` → `['users: local 3, supabase 3 OK', 'wallets: local 2, supabase 2 OK', 'sequência refresh_tokens_id_seq: local 7, supabase 7 OK', 'Histórico do Flyway: 2 migrações, última 10 OK', 'Permissões do Data API: 0 OK', 'Verificação OK: 2 tabela(s), 5 linha(s)']`; `differences === 0`
7. `a count difference is DIFERENTE`: remote `wallets` `'1'` → lines include `'wallets: local 2, supabase 1 DIFERENTE'`; last line `'Verificação FALHOU: 1 diferença(s)'`
8. `a table missing on Supabase is DIFERENTE`: remote without `wallets` → `'wallets: local 2, supabase - DIFERENTE'`
9. `a table only on Supabase is DIFERENTE`: remote with `['extra', '0']` added → `'extra: local -, supabase 0 DIFERENTE'` and it comes first (sorted)
10. `a sequence difference is DIFERENTE`: remote sequence `'1'` → `'sequência refresh_tokens_id_seq: local 7, supabase 1 DIFERENTE'`
11. `a Flyway checksum difference is DIFERENTE`: remote flyway `['1|111', '10|998']` → `'Histórico do Flyway: local 2 migrações, supabase 2 DIFERENTE'`; `differences === 1`
12. `grants left on Supabase are DIFERENTE`: remote `grants` `4` → `'Permissões do Data API: 4 concessões para anon, authenticated ou service_role DIFERENTE'`; `differences === 1`

**Gate**: Quick `node --test deploy/db/snapshot.test.mjs`, then Full (deploy) with `# tests 249`.
**Done when**:

- [x] The 12 tests pass.
- [ ] Full (deploy) shows `# tests 249`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): compare the local and Supabase databases`

---

### T16: Copy CLI: preflight, `check` and `verify` [x]

**Owner**: kotlin-backend-dev
**What**: The CLI `node deploy/db/copyToSupabase.mjs check | verify` with every preflight refusal of the spec (SUPA-07, SUPA-09; spec US-7 AC 1 to 7, 14 to 18, 20).
**Where**: `deploy/db/copyToSupabase.mjs` (new)
**Also changes**: `deploy/db/copyToSupabase.test.mjs` (new)
**Read first**: `deploy/deploy.mjs` (CLI shape), `deploy/db/pgTools.mjs` (T14), `deploy/db/snapshot.mjs` (T15), `deploy/lib/databaseEnv.mjs` (T2), spec US-7
**Depends on**: T15
**Requirement**: SUPA-07

**Contract**:

```js
//  One-time copy of the local Postgres (public schema) to Supabase, run by hand during the cutover (spec supabase-postgres)
//  Usage: node deploy/db/copyToSupabase.mjs check | copy | verify   (reads the repo-root .env; prints no secret)
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkDatabaseEnv } from '../lib/databaseEnv.mjs';
import { readDotenv } from '../lib/dotenv.mjs';
import { run } from '../lib/run.mjs';
import { LOCAL_CONTAINER, LOCAL_TARGET, PROBE_IMAGE, SQL, psql, supabaseTarget, toolImage } from './pgTools.mjs';
import { compareSnapshots, takeSnapshot } from './snapshot.mjs';

export const preflight = ({ exec, root, vars, forCopy }) => /* { ok, major, target, errors } */;
export const check = (deps) => /* 0 | 1 */;
export const verify = (deps) => /* 0 | 1 */;
export const main = (args, deps) => /* 0 | 1 */;
```

`deps = { exec, root, vars, log, now }`; `vars` is `readDotenv(join(root, '.env'))` (may be `null`).

`preflight`: `errors = []`, `major = null`, `target = null`. In this order, collecting every error:

1. `vars === null` → push `'arquivo .env não encontrado na raiz do repositório'`. Else `env = checkDatabaseEnv(vars)`: `!env.ok` → push `` `o .env não está pronto para o Supabase: ${env.errors.join('; ')}` ``; else `env.mode === 'local'` → push `'o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia'`. `supabaseReady = vars !== null && env.ok && env.mode === 'supabase'`.
2. Only when `forCopy`: `exec('docker', ['ps', '-a', '--filter', 'name=infinity-grove-backend-', '--format', '{{.Names}}|{{.State}}'])`. For each non-empty stdout line `name|state`: `state === 'running'` → push `` `pare o publish.sh antes da cópia: ${name} está rodando` ``; else push `` `remova o container parado ${name} antes da cópia (docker rm ${name}): um rollback o ligaria no banco antigo` ``.
3. `exec('docker', ['inspect', '-f', '{{.State.Running}}', LOCAL_CONTAINER]).stdout.trim() !== 'true'` → push `'o Postgres local não está rodando: docker compose -f backend/docker-compose.yml up -d --wait postgres'`.
4. Only when `supabaseReady`: `target = supabaseTarget(vars)`; `v = psql(exec, root, PROBE_IMAGE, target, SQL.version)`. `v.status !== 0` → push `'não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env'`. Else `major = Math.floor(Number(v.stdout.trim()) / 10000)`; `major < 16` → push `` `o Supabase roda Postgres ${major}; a cópia precisa de 16 ou mais` ``.
5. Only when `forCopy` and step 4 connected with `major >= 16`: `n = Number(psql(exec, root, toolImage(major), target, SQL.tableCount).stdout.trim())`; `n > 0` → push `` `o schema public do Supabase já tem ${n} tabelas; a cópia só roda num banco vazio` ``.
6. Return `{ ok: errors.length === 0, major, target, errors }`.

`check(deps)`: `p = preflight({ ...deps, forCopy: true })`. Not ok → `` log(`ERRO: ${e}`) `` for each error, return `1`. Ok → `` log(`Supabase: Postgres ${p.major}, schema public vazio`) ``, `log('Pronto para copiar')`, return `0`.

`verify(deps)`: `p = preflight({ ...deps, forCopy: false })`. Not ok → log each `ERRO: ...`, return `1`. `image = toolImage(p.major)`; `local = takeSnapshot(exec, root, image, LOCAL_TARGET)`; `!local.ok` → `log('ERRO: não foi possível ler o Postgres local')`, return `1`. `remote = takeSnapshot(exec, root, image, p.target, { grants: true })`; `!remote.ok` → `log('ERRO: não foi possível ler o Supabase')`, return `1`. `result = compareSnapshots(local, remote)`; log each of `result.lines`; return `result.differences === 0 ? 0 : 1`.

`main(args, deps)`: `args[0] === 'check'` → `check(deps)`; `'verify'` → `verify(deps)`; anything else → `log('Uso: node deploy/db/copyToSupabase.mjs check | copy | verify')`, return `1`. (T17 adds `'copy'`.)

Entry:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

    process.exit(main(process.argv.slice(2), { exec: run, root, vars: readDotenv(join(root, '.env')), log: console.log, now: Date.now }));
}
```

**Steps**:

1. Create `deploy/db/copyToSupabase.mjs` with the contract above.
2. Create `deploy/db/copyToSupabase.test.mjs` with this fake machine (T17 reuses it):
   - `machine({ vars = SUPABASE, containers = [], localRunning = true, version = '170004', versionStatus = 0, publicTables = '0', localCounts = 'users|3\n', remoteCounts = 'users|3\n', failing = [], list = '' } = {})` returns `{ deps, calls, lines }`. `root` is a fresh `mkdtempSync(join(tmpdir(), 'copy-'))`. `now = () => Date.UTC(2026, 10, 15, 14, 30, 0)`.
   - `exec(command, args, options = {})` pushes `{ command, args, env: options.env }` to `calls` and answers:
     - `args[0] === 'ps'` → `{ status: 0, stdout: containers.join('\n') }`
     - `args[0] === 'inspect'` → `{ status: 0, stdout: localRunning ? 'true\n' : 'false\n' }`
     - `args[0] === 'run'`: `side = options.env.PGHOST === 'postgres' ? 'local' : 'supabase'`; `tool = args.slice(args.findIndex((a) => a.startsWith('postgres:')) + 1)`. Then:
       - `tool[0] === 'psql'`, with `sql = tool.at(-1)`: `SQL.version` → `` { status: versionStatus, stdout: `${version}\n` } ``; `SQL.tableCount` → `publicTables`; `SQL.tableCounts` → `side === 'local' ? localCounts : remoteCounts` (status 2 when `failing` includes `` `${side}Snapshot` ``); `SQL.sequences` → `'refresh_tokens_id_seq|7\n'`; `SQL.flyway` → `'1|111\n10|999\n'`; `SQL.dataApiGrants` → `'0\n'`; `SQL.revokeDefaults` → status 2 when `failing` includes `'revokeDefaults'`, else 0; `SQL.revokeExisting` → status 2 when `failing` includes `'revokeExisting'`, else 0
       - `tool[0] === 'pg_dump'` → status 2 when `failing` includes `'pg_dump'`, else 0
       - `tool[0] === 'pg_restore' && tool[1] === '--list'` → `{ status: failing.includes('list') ? 2 : 0, stdout: list }`
       - `tool[0] === 'pg_restore'` → status 2 when `failing` includes `'restore'`, else 0
     - Every answer carries `stderr: ''` and `stdout: ''` when not set.
   - `deps = { exec, root, vars, log: (line) => lines.push(line), now }`.
   - `SUPABASE` and `LOCAL` as in T2.
3. Write the test cases below.

**Tests**: unit
**Test cases** (`deploy/db/copyToSupabase.test.mjs`):

1. `check passes on a ready machine`: `check(deps)` → `0`; `lines` deepEqual `['Supabase: Postgres 17, schema public vazio', 'Pronto para copiar']`
2. `check refuses a missing .env`: `vars: null` → `1`; `lines` deepEqual `['ERRO: arquivo .env não encontrado na raiz do repositório']`
3. `check refuses the local .env without talking to Supabase`: `vars: LOCAL` → `1`; `lines` deepEqual `['ERRO: o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia']`; no call has `args[0] === 'run'`
4. `check refuses an invalid .env`: `vars: { ...SUPABASE, SPRING_DATASOURCE_URL: 'jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require' }` → `lines` deepEqual `['ERRO: o .env não está pronto para o Supabase: a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler)']`
5. `check refuses a running slot`: `containers: ['infinity-grove-backend-blue|running']` → `lines` deepEqual `['ERRO: pare o publish.sh antes da cópia: infinity-grove-backend-blue está rodando']`
6. `check refuses a stopped slot`: `containers: ['infinity-grove-backend-green|exited']` → `lines` deepEqual `['ERRO: remova o container parado infinity-grove-backend-green antes da cópia (docker rm infinity-grove-backend-green): um rollback o ligaria no banco antigo']`
7. `check refuses a stopped local Postgres`: `localRunning: false` → `lines` deepEqual `['ERRO: o Postgres local não está rodando: docker compose -f backend/docker-compose.yml up -d --wait postgres']`
8. `check refuses an unreachable Supabase`: `versionStatus: 2` → `lines` deepEqual `['ERRO: não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env']`
9. `check refuses a Supabase older than 16`: `version: '150008'` → `lines` deepEqual `['ERRO: o Supabase roda Postgres 15; a cópia precisa de 16 ou mais']`
10. `check refuses a Supabase public schema with tables`: `publicTables: '12'` → `lines` deepEqual `['ERRO: o schema public do Supabase já tem 12 tabelas; a cópia só roda num banco vazio']`
11. `the version probe runs on postgres:17 and the rest on the Supabase major`: `version: '180001'` → the call whose last arg is `SQL.version` has `'postgres:17'` in `args`; the call whose last arg is `SQL.tableCount` has `'postgres:18'`; `lines[0] === 'Supabase: Postgres 18, schema public vazio'`
12. `verify prints the comparison and returns 0 on equal data`: `verify(deps)` → `0`; `lines` deepEqual `['users: local 3, supabase 3 OK', 'sequência refresh_tokens_id_seq: local 7, supabase 7 OK', 'Histórico do Flyway: 2 migrações, última 10 OK', 'Permissões do Data API: 0 OK', 'Verificação OK: 1 tabela(s), 3 linha(s)']`
13. `verify returns 1 on a difference`: `remoteCounts: 'users|2\n'` → `1`; `lines` include `'users: local 3, supabase 2 DIFERENTE'`; last line `'Verificação FALHOU: 1 diferença(s)'`
14. `verify runs while the slots are up`: `containers: ['infinity-grove-backend-blue|running']` → `0`; no call has `args[0] === 'ps'`
15. `verify reports an unreadable Supabase`: `failing: ['supabaseSnapshot']` → `1`; last line `'ERRO: não foi possível ler o Supabase'`
16. `verify reports an unreadable local Postgres`: `failing: ['localSnapshot']` → `1`; last line `'ERRO: não foi possível ler o Postgres local'`
17. `main prints the usage for an unknown command`: `main([], deps)` → `1`; `lines` deepEqual `['Uso: node deploy/db/copyToSupabase.mjs check | copy | verify']`
18. `no docker argument carries the password`: after `check(deps)` and `verify(deps)` on the same machine, no string in any `calls[i].args` includes `'Fake0Password1ForTests'`

**Gate**: Quick `node --test deploy/db/copyToSupabase.test.mjs`, then Full (deploy) with `# tests 267`.
**Done when**:

- [x] The 18 tests pass.
- [x] No command of this task ran against the owner's `.env`: it is in Supabase mode, and no task before the cutover contacts the real Supabase.
- [ ] Full (deploy) shows `# tests 267`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): check and verify the Supabase copy`

---

### T17: Copy CLI: `copy` [x]

**Owner**: kotlin-backend-dev
**What**: The `copy` command: dump the local `public` schema, restore it into Supabase in one transaction with the Data API grants revoked before and after, then verify (SUPA-08; spec US-7 AC 8 to 13).
**Where**: `deploy/db/copyToSupabase.mjs` (modify)
**Also changes**: `deploy/db/copyToSupabase.test.mjs`
**Read first**: `deploy/db/copyToSupabase.mjs` (T16), `deploy/db/pgTools.mjs` (`pgRun`, `filterRestoreList`, `SQL`)
**Depends on**: T16
**Requirement**: SUPA-08

**Contract**:

```js
export const copy = (deps) => /* 0 | 1 */;
```

Add `mkdirSync, writeFileSync` from `node:fs` and `pgRun, filterRestoreList` from `./pgTools.mjs` to the imports. The function, exactly:

```js
//  Dump the local public schema, restore it into Supabase in one transaction with the Data API grants revoked before and after, verify
export const copy = (deps) =>
{
    const { exec, root, log, now } = deps;
    const p = preflight({ ...deps, forCopy: true });

    if (!p.ok)
    {
        p.errors.forEach((error) => log(`ERRO: ${error}`));

        return 1;
    }

    const image = toolImage(p.major);
    const stamp = `infinity_grove-${new Date(now()).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`;
    mkdirSync(join(root, 'backups'), { recursive: true });

    const dump = pgRun(exec, root, {
        image, target: LOCAL_TARGET, mount: true,
        command: ['pg_dump', '--format=custom', '--schema=public', '--no-owner', '--no-privileges', `--file=/backups/${stamp}.dump`]
    });

    if (dump.status !== 0)
    {
        log('ERRO: pg_dump falhou; nada foi escrito no Supabase');

        return 1;
    }

    log(`Dump salvo em backups/${stamp}.dump`);

    const list = pgRun(exec, root, { image, target: LOCAL_TARGET, mount: true, command: ['pg_restore', '--list', `/backups/${stamp}.dump`] });

    if (list.status !== 0)
    {
        log('ERRO: pg_restore --list falhou; nada foi escrito no Supabase');

        return 1;
    }

    writeFileSync(join(root, 'backups', `${stamp}.list`), filterRestoreList(String(list.stdout)));

    if (psql(exec, root, image, p.target, SQL.revokeDefaults).status !== 0)
    {
        log('ERRO: não foi possível revogar as permissões padrão do Data API; nada foi restaurado');

        return 1;
    }

    const restore = pgRun(exec, root, {
        image, target: p.target, mount: true,
        command: ['pg_restore', '--no-owner', '--no-privileges', '--exit-on-error', '--single-transaction',
            `--use-list=/backups/${stamp}.list`, `--dbname=${p.target.database}`, `/backups/${stamp}.dump`]
    });

    if (restore.status !== 0)
    {
        log('ERRO: pg_restore falhou; a transação foi desfeita e o schema public do Supabase continua vazio');

        return 1;
    }

    if (psql(exec, root, image, p.target, SQL.revokeExisting).status !== 0)
    {
        log('ERRO: não foi possível revogar as permissões do Data API nas tabelas copiadas');

        return 1;
    }

    log(`Restaurado no Supabase (Postgres ${p.major})`);

    return verify(deps);
};
```

`main`: add `args[0] === 'copy'` → `copy(deps)`.

**Steps**:

1. Add `copy` and the `main` branch.
2. Add the test cases below to `deploy/db/copyToSupabase.test.mjs`, reusing `machine` of T16. The stamp of `now` is `infinity_grove-20261115T143000Z`. `TOC = [';', '5; 2615 2200 SCHEMA - public pg_database_owner', '218; 1259 16385 TABLE public users infinity', ''].join('\n')`. Helper `tools(calls)` maps each `run` call to its tool arguments (after the `postgres:` image).

**Tests**: unit
**Test cases** (`deploy/db/copyToSupabase.test.mjs`, new):

1. `a copy dumps, lists, revokes the defaults, restores, revokes the grants and verifies, in that order`: `machine({ list: TOC })`, `copy(deps)` → `0`. Map every `run` call to a step name: `psql` → its SQL, `pg_restore` → `` `pg_restore ${tool[1]}` ``, else `tool[0]`. Drop the steps equal to `SQL.version` or `SQL.tableCount` (preflight). The first five remaining steps deepEqual `['pg_dump', 'pg_restore --list', SQL.revokeDefaults, 'pg_restore --no-owner', SQL.revokeExisting]`, and the next one is `SQL.tableCounts` (the verify). `lines` deepEqual `['Dump salvo em backups/infinity_grove-20261115T143000Z.dump', 'Restaurado no Supabase (Postgres 17)', 'users: local 3, supabase 3 OK', 'sequência refresh_tokens_id_seq: local 7, supabase 7 OK', 'Histórico do Flyway: 2 migrações, última 10 OK', 'Permissões do Data API: 0 OK', 'Verificação OK: 1 tabela(s), 3 linha(s)']`
2. `the dump reads only the public schema of the local database, without owners or grants`: the `pg_dump` tool arguments deepEqual `['pg_dump', '--format=custom', '--schema=public', '--no-owner', '--no-privileges', '--file=/backups/infinity_grove-20261115T143000Z.dump']`; its `env.PGHOST === 'postgres'` and `env.PGDATABASE === 'infinity_grove'`
3. `the restore is one transaction that stops at the first error`: the restore tool arguments deepEqual `['pg_restore', '--no-owner', '--no-privileges', '--exit-on-error', '--single-transaction', '--use-list=/backups/infinity_grove-20261115T143000Z.list', '--dbname=postgres', '/backups/infinity_grove-20261115T143000Z.dump']`; its `env.PGHOST === 'aws-0-sa-east-1.pooler.supabase.com'`
4. `the restore list leaves out the public schema entry`: `readFileSync(join(root, 'backups', 'infinity_grove-20261115T143000Z.list'), 'utf8')` equals `[';', '218; 1259 16385 TABLE public users infinity', ''].join('\n')`
5. `a failed dump writes nothing to Supabase`: `failing: ['pg_dump']` → `1`; last line `'ERRO: pg_dump falhou; nada foi escrito no Supabase'`; no call runs `pg_restore`, `SQL.revokeDefaults` or `SQL.revokeExisting`
6. `a failed restore list writes nothing to Supabase`: `failing: ['list']` → `1`; last line `'ERRO: pg_restore --list falhou; nada foi escrito no Supabase'`; no call runs `SQL.revokeDefaults`
7. `a failed default-privilege revoke stops before the restore`: `failing: ['revokeDefaults']` → `1`; last line `'ERRO: não foi possível revogar as permissões padrão do Data API; nada foi restaurado'`; no `pg_restore --no-owner` call
8. `a failed restore says the transaction was undone`: `failing: ['restore']` → `1`; last line `'ERRO: pg_restore falhou; a transação foi desfeita e o schema public do Supabase continua vazio'`; no `SQL.revokeExisting` call
9. `a failed grant revoke stops before the verify`: `failing: ['revokeExisting']` → `1`; last line `'ERRO: não foi possível revogar as permissões do Data API nas tabelas copiadas'`; no `SQL.tableCounts` call after it
10. `a failed preflight copies nothing`: `containers: ['infinity-grove-backend-blue|running']` → `1`; no `pg_dump` call
11. `the backups folder is created under the repository root`: after case 1, `existsSync(join(root, 'backups'))` is `true`
12. `main runs copy`: `main(['copy'], deps)` on a ready machine → `0`

**Gate**: Quick `node --test deploy/db/copyToSupabase.test.mjs` (30 tests), then Full (deploy) with `# tests 279`.
**Done when**:

- [x] The 12 new tests and the 18 of T16 pass.
- [ ] Full (deploy) shows `# tests 279`, `# pass 277`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): copy the local database to Supabase`

---

### T18: ADR 0012, the backend README and `.env.example` [ ]

**Owner**: kotlin-backend-dev
**What**: Record the decision as ADR 0012, rewrite the backend README for production on Cloud Run and Supabase (removing the `docker compose down -v` advice without a warning), and reword the `.env.example` comments for its new use (SUPA-12, RUN-07; spec US-11 AC 1, 2, US-6 AC 10).
**Where**: `backend/docs/adr/0012-production-on-cloud-run-and-supabase.md` (new)
**Also changes**: `backend/readme.md`, `.env.example`, `deploy/lib/secrets.test.mjs`
**Read first**: `backend/docs/adr/0011-talent-points.md` (format), `backend/readme.md` (whole, 32 lines), `.env.example`, `deploy/lib/secrets.test.mjs` (cases 5 and 6), `.specs/features/supabase-postgres/design.md`
**Depends on**: T6, T9, T17
**Requirement**: SUPA-12, RUN-07

**Contract**:

`backend/docs/adr/0012-production-on-cloud-run-and-supabase.md`, exactly (with the commit date):

```markdown
# ADR 0012: Production on Google Cloud Run and Supabase Postgres

- Status: Accepted
- Date: <date of the commit, YYYY-MM-DD>
- Extends: ADR 0009 (Flyway owns the schema); keeps the expand/contract rule of AD-016 and replaces its local blue-green deploy

## Context

The backend ran as two blue-green Docker slots on the owner's machine, on the local Postgres, behind a Cloudflare quick tunnel; the site worked only while `publish.sh` ran. Both move off the machine in one cutover, with the players' data.

## Decision

**Cloud Run, scale to zero.** Service `infinity-grove-backend` in `southamerica-east1`, built from `backend/Dockerfile`, image in Artifact Registry (`southamerica-east1-docker.pkg.dev/<project>/infinity-grove/backend:<commit>`). 1 vCPU, 1 GiB, startup CPU boost, request-based billing, `--min-instances=0`. At most one instance serves (`--max=1`) and each revision has at most one (`--max-instances=1`), because the instance of a new revision doubles the database connections. The container listens on `PORT` (`server.port: ${PORT:8080}`).

**Health check and release.** Public `GET /health` answers 200 `{"status":"UP","commit":...}` when `select 1` works and 503 `DOWN` when it does not; the startup and liveness probes call it. Each deploy creates a revision with no traffic and the tag `c-<commit>`. The workflow checks `/health` and runs the API regression on the tag URL, then sends 100 % of the traffic to the new revision and checks the service URL, and sends the traffic back to the previous revision when that check fails.

**Flyway at boot.** The first instance of a new revision migrates the production database while the previous revision serves. A failed revision or a traffic rollback does not undo a migration, so every migration keeps the previous backend working (AD-016).

**Deploy workflow.** `.github/workflows/deploy.yml` deploys the newest commit of `backend/` when it differs from the commit `/health` answers: `./gradlew ktlintCheck test`, the image with the API regression on a throwaway Postgres, a Workload Identity Federation sign-in (no service account key), a push to Artifact Registry, the revision, and `deploy/cloudrun/cloudRunRelease.mjs release`. Then it publishes the game Worker with `BACKEND_URL` set to the service URL. The repository variable `CLOUD_RUN_PRODUCTION` turns it on.

**Supabase Session pooler.** `aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require`. Hikari `maximum-pool-size: 5`, `minimum-idle: 1`: the serving instance and the new revision's take at most 10 of the pooler's 15.

**Secrets.** `JWT_SECRET` and `SPRING_DATASOURCE_*` are Secret Manager secrets (`jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`), read by the runtime service account as environment variables; `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are GitHub secrets. Only the owner creates them, piping the values from the gitignored repo-root `.env`. The datasource secrets were created only after the copy was verified, so no revision could migrate the empty Supabase.

**Schema `public`, closed to the Data API.** The copy revokes every grant of `anon`, `authenticated` and `service_role` there, and the project's Data API is off.

**One-time copy.** `node deploy/db/copyToSupabase.mjs check | copy | verify` dumps the local `public` schema with `pg_dump` and restores it with `pg_restore --single-transaction`, and compares row counts, sequences, the Flyway history and the grants.

**Cost guard.** An Artifact Registry cleanup policy (`deploy/cloudrun/artifact-cleanup.json`) keeps the 3 newest images and deletes older ones after 30 days; a billing budget mails at 10 %, 50 % and 100 %.

## Consequences

- The site no longer depends on the owner's machine. `publish.sh --way-back` brings back the local stack for 30 days after the cutover.
- An idle service scales to zero; the next visit pays a JVM start, and the start screen waits up to 60 s for `/health`.
- With the expected traffic, compute, requests, images and secrets stay in the free tier; internet egress to South America has no free allowance (a few cents a month).
- The integration tests still run on Testcontainers (`TestDatabaseIsolationIT`), also on the GitHub runner.
- The Free plan has no managed backup (TD-003), and `sslmode=require` does not verify the server certificate (TD-004).

## Alternatives considered

- Fly.io: dropped by the owner; its app never reached Supabase.
- Render: dropped by the owner.
- Cloud Build or the console's continuous deployment: no test gate before traffic.
- A service account JSON key in a GitHub secret: a long-lived credential; Workload Identity Federation gives short-lived tokens.
- `--min-instances=1`: no cold start, about US$ 18 a month in `southamerica-east1`.
- Direct connection `db.<ref>.supabase.co`: IPv6 only.
- Transaction pooler (6543): no prepared statements, no session state for Flyway.
- A `game` schema: needs a rename during the copy and changes in Flyway, Hibernate and the tests; the grants already close `public`.
```

`backend/readme.md`: replace everything from the line `## Database` to the end of the file with:

````markdown
## Production

The backend runs on Google Cloud Run: service `infinity-grove-backend`, region `southamerica-east1`, 1 vCPU and 1 GiB, scaled to zero when idle (ADR 0012). Its URL is the GitHub variable `BACKEND_URL` (`https://infinity-grove-backend-<project number>.southamerica-east1.run.app`). `GET /health` (public) answers `{"status":"UP","commit":"<commit>"}` once `select 1` works; the startup and liveness probes call it.

Every push to `main` runs `.github/workflows/deploy.yml`: `./gradlew ktlintCheck test`, the image built from `Dockerfile` with the API regression (`deploy/regression.mjs`) on a throwaway Postgres, a push to Artifact Registry, a new revision with no traffic, `/health` and the regression on its tag URL, then all the traffic and a check of the service URL, with the traffic sent back to the previous revision when it fails. Nothing deploys while the repository variable `CLOUD_RUN_PRODUCTION` is not `true`.

- Logs: `gcloud run services logs read infinity-grove-backend --region southamerica-east1 --limit 200`.
- Rollback by hand: `gcloud run revisions list --service infinity-grove-backend --region southamerica-east1`, then `gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions <revision>=100`. A rollback does not undo a migration: every Flyway migration keeps the previous backend working (expand/contract, AD-016).
- Secrets (`jwt-secret`, `spring-datasource-url`, `spring-datasource-username`, `spring-datasource-password`) live in Secret Manager and are created by the owner only, never in a file of the repository.

## Database

Production uses the Supabase Postgres of project `jnqlrdnwwqslihncszej` through the Session pooler (`aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require`), with a Hikari pool of 5 and 1 idle connection (ADR 0012).

Locally, `docker compose up -d` starts PostgreSQL 16 on `localhost:5432` (database, user and password `infinity_grove` / `infinity` / `infinity`); `./gradlew bootRun` and `start.sh` use it.

Flyway owns the schema: on startup it applies the migrations in `src/main/resources/db/migration`, and Hibernate only validates the entities against them (ADR 0009). The seeders then fill the heroes, chapters, enemies and drop rules.

### Copy to Supabase

`node deploy/db/copyToSupabase.mjs check`, then `copy`, from the repository root, with the repo-root `.env` in Supabase mode (template `.env.example`), `publish.sh` stopped and no backend slot container left. `verify` compares both databases at any time. The cutover runbook is in `.specs/features/supabase-postgres/design.md`.

### Never `docker compose down -v` on the deploy machine

The local volume `backend_postgres_data` is the way back for 30 days after the cutover, and `down -v` deletes it with every player. A database created before Flyway (Hibernate `ddl-auto: update`) has tables but no Flyway history; recreate it only on a development machine.

## Tests

```sh
./gradlew ktlintCheck test
```

Integration tests start their own PostgreSQL with Testcontainers (Docker must run) and apply the same migrations. They never reach Supabase, even with `SPRING_DATASOURCE_URL` set (`TestDatabaseIsolationIT`).

## Way back

Until 30 days after the cutover, `./publish.sh --way-back` at the repository root brings back the local blue-green stack (slots `backend-blue` and `backend-green` behind Traefik on `localhost:8080`, the local Postgres, a Cloudflare tunnel and the watcher). Set the GitHub variable `CLOUD_RUN_PRODUCTION` to `false` first.
````

`.env.example`, exactly:

```
# Database settings of the one-time copy (deploy/db/copyToSupabase.mjs), checked by deploy/lib/databaseEnv.mjs.
# Copy this file to .env at the repository root. .env is gitignored: never commit it, never paste its values anywhere.
# The owner feeds the Secret Manager secrets from it without typing them, for example:
# grep '^SPRING_DATASOURCE_PASSWORD=' .env | cut -d= -f2- | tr -d '\r\n' | gcloud secrets create spring-datasource-password --replication-policy=automatic --data-file=-
# Local Postgres of backend/docker-compose.yml (the values below): local development only; the copy refuses them.
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/infinity_grove
SPRING_DATASOURCE_USERNAME=infinity
SPRING_DATASOURCE_PASSWORD=infinity
# Supabase (Dashboard > Connect > Session pooler), the mode the copy needs. Replace the three lines above with:
# SPRING_DATASOURCE_URL=jdbc:postgresql://aws-<N>-<region>.pooler.supabase.com:5432/postgres?sslmode=require
# SPRING_DATASOURCE_USERNAME=postgres.jnqlrdnwwqslihncszej
# SPRING_DATASOURCE_PASSWORD=<database password: letters and digits only>
```

`deploy/lib/secrets.test.mjs`: one new test (case 7 below). Cases 1 to 6 stay unchanged and must pass.

**Steps**:

1. Create the ADR with the text above and the commit date.
2. Replace the README section.
3. Replace `.env.example` with the text above. Do not touch the untracked `.env`.
4. Add case 7 to `deploy/lib/secrets.test.mjs`.

**Tests**: unit
**Test cases** (`deploy/lib/secrets.test.mjs`, new):

7. `.env.example names the copy and gcloud secrets create, not env_file, the slots or Fly`: the text of `.env.example` includes `deploy/db/copyToSupabase.mjs` and `gcloud secrets create`, and `text.toLowerCase()` includes none of `env_file`, `slot`, `fly.io` and `fly secrets`

**Gate**: Quick `node --test deploy/lib/secrets.test.mjs` (7 tests), then Full (deploy) with `# tests 280`; `git diff --check` prints nothing; `grep -c "docker compose down -v" backend/readme.md` prints `1` (only the warning heading); `grep -c -E "Fly.io|fly.toml|fly (deploy|logs|secrets)" backend/readme.md` prints `0`.
**Done when**:

- [ ] The ADR, the README and `.env.example` match the contract.
- [ ] Full (deploy) shows `# tests 280`, `# fail 2`, only the two known `not ok` lines.
- [ ] The three text gate commands give the values above.

**Commit**: `docs(backend): record production on Cloud Run and Supabase`

---

### T19: The game README describes the Cloud Run deploy [ ]

**Owner**: game-dev
**What**: Rewrite the Deploy section of the game README: the workflow publishes the Worker after the backend, the Worker proxies to the Cloud Run service, the start screen waits, and the by-hand publish (SUPA-12; spec US-11 AC 3).
**Where**: `game/readme.md` (modify)
**Read first**: `game/readme.md` (whole, 35 lines), `.github/workflows/deploy.yml` (T9)
**Depends on**: T18
**Requirement**: SUPA-12

**Contract**: replace everything from the line `## Deploy` to the end of the file with:

````markdown
## Deploy

The game is served by a Cloudflare Worker at `https://infinity-grove.yan-tapajos.workers.dev/`. It forwards `/api/*` to the backend on Google Cloud Run, whose address is the repository variable `BACKEND_URL` (`https://infinity-grove-backend-<project number>.southamerica-east1.run.app`; the backend has no `/api` prefix, the Worker strips it), so the game stays same-origin and needs no CORS.

Every push to `main` that changes the game or the backend runs `.github/workflows/deploy.yml`. After the backend job passes (tests, regression, a Cloud Run revision checked before it takes traffic), the `game` job runs `npm run deploy` with `BACKEND_URL` from the repository variable and builds the Worker from the commit tree, never the working tree. Nothing deploys while the repository variable `CLOUD_RUN_PRODUCTION` is not `true`.

The start screen calls `GET /api/health` once (60 s timeout) before the session restore, because Cloud Run may be starting the backend from zero; after 2 s the message reads `Acordando o servidor, aguarde...`.

To publish by hand from `game/` (needs `npx wrangler login` and `gh auth login`):

```
BACKEND_URL="$(gh variable get BACKEND_URL)" npm run deploy
```

`BACKEND_URL` is the bare backend address, without `/api`. This publishes the working tree, uncommitted changes included.
````

**Steps**:

1. Replace the section.

**Tests**: none (docs)
**Gate**: `git diff --check` prints nothing; `grep -c "publish.sh" game/readme.md` prints `0`; `grep -c "run.app" game/readme.md` prints `1`; `grep -c "CLOUD_RUN_PRODUCTION" game/readme.md` prints `1`; `grep -c -E "Fly.io|fly.dev|fly (deploy|logs|secrets)" game/readme.md` prints `0`.
**Done when**:

- [ ] The section matches the contract.
- [ ] The five gate commands give the values above.

**Commit**: `docs(game): describe the Worker deploy to Cloud Run`

---

### T20: Cutover to Cloud Run and Supabase [ ]

**Owner**: gitops (with the owner at the keyboard; the owner types every secret and changes every Google Cloud, GitHub and Fly setting)
**What**: Move production to Cloud Run and Supabase with the data, following the runbook, with three go/no-go points and the two ways back (SUPA-11, RUN-07; spec US-9 AC 1 to 8, US-6 AC 8, 9).
**Where**: production (the owner's checkout `C:\Users\Internal.IT\Developer\infinity-grove-phaser`, Docker, the Supabase project, the Google Cloud project, the GitHub repository)
**Read first**: `.specs/features/supabase-postgres/design.md` sections "Owner steps" and "Cutover runbook", spec US-9, `CLAUDE.md` "Deploy"
**Depends on**: T19, T13
**Requirement**: SUPA-11, RUN-07

**Preconditions** (stop and report if one is missing): `validation.md` of this feature says PASS; `product-owner` accepted; the owner answered Q9 to Q15 and said "go" for the cutover in the conversation; the owner confirms O1 to O15 of the design are done; the rehearsal run of O14 is green and its `inspect` step printed `Tráfego:` and `Tag probe:` (M9); the build-only run of O15 is green and its build time is written down (M15); `gcloud secrets list --format="value(name)"` prints only `jwt-secret` (spec US-6 AC 9); `git ls-remote --heads origin flyio-new-files` prints nothing (M14); Docker runs.

**Contract**: the commands of the runbook, steps 1 to 14, in order, from Git Bash with the session variables of "Owner steps". The window (site offline) runs from step 3 to step 12, about 15 minutes with the prebuilt image (design, runbook estimate table). The texts that decide:

- Step 1 (before the window): `gcloud artifacts docker images list "southamerica-east1-docker.pkg.dev/$PROJECT_ID/infinity-grove/backend" --include-tags --format="value(tags)" | grep -c "$(git log -1 --format=%H origin/main -- backend)"` prints `1`. If it prints `0`, the owner decides: run O15 again before the window, or go on with a window longer by the build time recorded in O15. Either way the way-back triggers below stay the same.
- Step 6 (go/no-go 1): the last line is `Pronto para copiar`.
- Step 7 (go/no-go 2): the output includes `Permissões do Data API: 0 OK` and the last line starts with `Verificação OK:`.
- Step 8: `gcloud secrets list --format="value(name)"` prints exactly `jwt-secret`, `spring-datasource-password`, `spring-datasource-url`, `spring-datasource-username`.
- Step 10 (go/no-go 3): the job `backend` log has `Imagem <7> já está no Artifact Registry; testes, build, regressão e push não rodam de novo` (or, after a `0` in step 1, `Imagem <7> não está no Artifact Registry; testes, build, regressão e push rodam agora`), `Regressão OK` and `Backend <7> no ar no Cloud Run (<revision>)`, and the job `game` is green.
- Step 11: `curl -s "<BACKEND_URL>/health"` prints `{"status":"UP","commit":"<the output of git log -1 --format=%H -- backend>"}`.
- Step 13: `node deploy/cloudrun/cloudRunRelease.mjs inspect` prints `Tráfego: <the revision of step 10>` and no line that starts with `Tag`.

**Steps**:

1. Runbook step 1 (the image check, `docker pull postgres:17`) and the preconditions.
2. Step 2: the owner writes down chapter, stage and copper of one existing account.
3. Steps 3 to 5. Write down the time of step 3.
4. Step 6. On failure: way back A, stop, report.
5. Step 7. On failure: way back A (with the SQL-editor cleanup when the restore went through), stop, report.
6. Steps 8 and 9 (owner).
7. Steps 10 to 13. Write down the time of step 12. On failure: way back B, stop, report.
8. Step 14: run T21.

**Tests**: none (manual operation on production)
**Gate**: step 7 (`copy`, which runs `verify` with no slot up and no datasource secret in Google Cloud) exits 0 and ends with `Verificação OK:`, and step 11 prints the `UP` line. After step 10 players write again, so a later `verify` may show `DIFERENTE` rows; those are not a failure of the copy.
**Done when**:

- [ ] Go/no-go 1, 2 and 3 passed with the texts above.
- [ ] The site answers with `publish.sh` stopped, and the account of step 2 shows the same chapter, stage and copper.
- [ ] Step 13 printed one serving revision and no tag.
- [ ] The window (step 3 to step 12) and whether step 10 used the prebuilt image are recorded for `report.html`.
- [ ] `docker volume inspect backend_postgres_data` still succeeds.
- [ ] The commands' output is kept for `report.html` with no secret in it.

**Commit**: none (no repository change; `gitops` commits only `report.html` and the changelog afterwards)

---

### T21: Production checks after the cutover [ ]

**Owner**: gitops
**What**: Run the manual checks M3 to M8, M10 to M12 and M15 of the spec on production, M6 again at the next backend deploy, and M13 one month later (SUPA-11, RUN-02, RUN-07, RUN-09; spec section Checagens).
**Where**: production
**Read first**: spec section "O que só se confere contra a produção", design "Owner steps" (the read-only commands an agent may run)
**Depends on**: T20
**Requirement**: SUPA-11, RUN-02, RUN-07, RUN-09

**Contract** (each check passes with exactly this outcome; every `gcloud` command here is read-only and runs with the owner's login):

- M3: `gcloud run services logs read infinity-grove-backend --region southamerica-east1 --limit 500` shows, for the revision of the cutover, `Schema "public" is up to date. No migration necessary.` and no `HikariPool-1 - Exception during pool initialization`. Write down the time from the first log line of that instance to `Started` (the boot time, design Risks).
- M4: the job `backend` of the cutover run printed `Regressão OK: <n> verificações em <s> s` and `Backend <7> no ar no Cloud Run (<revision>)`; `curl -s "$(gh variable get BACKEND_URL)/health"` prints `{"status":"UP","commit":"<git log -1 --format=%H -- backend>"}`.
- M5: logged in as the account of T20 step 2, the site shows the same chapter, stage and copper, with `publish.sh` stopped.
- M6: Supabase Dashboard > Observability > Shared Pooler (Supavisor) client connections shows at most 5 with the service up; during the next backend deploy, at most 10.
- M7: Dashboard > Integrations > Data API shows the Data API disabled.
- M8 (repository): from the repository root,

```bash
node --input-type=module -e "import { readDotenv } from './deploy/lib/dotenv.mjs'; import { execFileSync } from 'node:child_process'; import { existsSync, readFileSync } from 'node:fs'; const p = readDotenv('.env').SPRING_DATASOURCE_PASSWORD; const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => f && existsSync(f)); const hit = files.filter((f) => readFileSync(f).includes(p)); console.log(hit.length === 0 ? 'senha fora do repositório' : 'SENHA ENCONTRADA EM ' + hit.length + ' ARQUIVO(S) VERSIONADO(S)');"
```

  prints `senha fora do repositório`. Run it again after writing `report.html`, before its commit.
- M8 (logs): from the repository root, the Cloud Run logs of 7 days and the log of the cutover run go to temporary files, the check prints only the verdict, and the files are deleted:

```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="infinity-grove-backend"' --freshness=7d --limit=100000 --format=json > "$TEMP/cloudrun-logs.json"
gh run view <cutover run id> --log > "$TEMP/workflow-log.txt"
node --input-type=module -e "import { readDotenv } from './deploy/lib/dotenv.mjs'; import { readFileSync } from 'node:fs'; const p = readDotenv('.env').SPRING_DATASOURCE_PASSWORD; const hit = process.argv.slice(1).some((f) => readFileSync(f, 'utf8').includes(p)); console.log(hit ? 'SENHA ENCONTRADA NOS LOGS' : 'senha fora dos logs');" "$TEMP/cloudrun-logs.json" "$TEMP/workflow-log.txt"
rm "$TEMP/cloudrun-logs.json" "$TEMP/workflow-log.txt"
```

  prints `senha fora dos logs`.
- M10: with nobody playing for 20 minutes, Console > Cloud Run > `infinity-grove-backend` > Metrics > "Container instance count" reaches 0; the next visit reaches the form in under 60 s. If it never reaches 0, record it for the owner's Q9 decision.
- M11: `gcloud secrets list --format="value(name)"` prints the four names of T20 step 8; `gcloud run services get-iam-policy infinity-grove-backend --region southamerica-east1` shows `allUsers` with `roles/run.invoker`; `gcloud projects get-iam-policy "$PROJECT_ID" --flatten=bindings --filter="bindings.members:infinity-grove-run@" --format="value(bindings.role)"` prints only `roles/secretmanager.secretAccessor`; `gcloud iam service-accounts keys list --iam-account="github-deployer@$PROJECT_ID.iam.gserviceaccount.com" --managed-by=user` prints nothing.
- M12: `gcloud artifacts repositories describe infinity-grove --location southamerica-east1` shows the policies `delete-older-than-30-days` and `keep-3-most-recent`; `gcloud billing budgets list --billing-account="$BILLING_ACCOUNT" --format="value(displayName)"` prints `infinity-grove`; `gcloud secrets versions list <name> --filter="state:(ENABLED OR DISABLED)" --format="value(name)"` over the four secrets prints at most 6 lines in all.
- M13: one month after the cutover, Console > Billing > Reports, filtered to the project, shows at most US$ 1 (or the equivalent in the account currency).
- M15: the step 1 `grep` printed `1`, the cutover run printed `Imagem <7> já está no Artifact Registry; testes, build, regressão e push não rodam de novo`, and the window of T20 (step 3 to step 12) is about 15 minutes; a longer window names its cause (rebuild or a failed step).

**Steps**:

1. M3, M4, M5, M7, M8, M11, M12, M15 right after T20.
2. M10 after 20 idle minutes.
3. M6 with the service up now; M6 again during the next backend deploy the workflow runs (any later backend commit).
4. M13 one month later, in the release notes of the first feature after that date if this one is closed.
5. Any failure within the window: way back B of the runbook, then report.

**Tests**: none (manual checks on production)
**Gate**: M4 shows the `UP` line and both M8 commands print the "fora" texts.
**Done when**:

- [ ] M3 to M8, M10 to M12 and M15 give the outcomes above, recorded in `report.html` (no secret in it).
- [ ] The spec's Requirement Traceability rows move to Verified in the gitops release commit.

**Commit**: none (gitops writes `report.html`, the changelog and the tag per `CLAUDE.md`)

---

### T22: `publish.sh` only runs as the way back [ ]

**Owner**: kotlin-backend-dev
**What**: `publish.sh` refuses to start without `--way-back` and reminds to turn `CLOUD_RUN_PRODUCTION` off when it runs, so the Worker never points back to the local stack by habit (RUN-08; spec US-10 AC 1, 2).
**Where**: `publish.sh` (modify)
**Read first**: `publish.sh` (whole file: the header comment, the `for arg in "$@"` loop, the first `echo` after it)
**Depends on**: T21
**Requirement**: RUN-08

**Contract** (two edits, nothing else changes):

1. The header line `# Usage: ./publish.sh [--no-deploy] [--force]` becomes `# Usage: ./publish.sh --way-back [--no-deploy] [--force]`, and right after it comes the new line:

```bash
#   --way-back   required: production runs on Google Cloud Run since the cutover of spec supabase-postgres; this script is only the way back
```

2. Right after the line `set -eo pipefail`, insert (the arguments loop below ignores unknown flags, so `--way-back` needs no other change):

```bash

# Production runs on Google Cloud Run since the cutover of spec supabase-postgres: without --way-back nothing starts (only shell builtins run here)
case " $* " in
  *" --way-back "*) echo "Way back: set the GitHub variable CLOUD_RUN_PRODUCTION to false first, or the next push republishes the Worker to Cloud Run." ;;
  *) echo "Production runs on Google Cloud Run since the cutover of spec supabase-postgres. publish.sh only brings back the local stack as the way back: ./publish.sh --way-back"; exit 1 ;;
esac
```

**Steps**:

1. Apply edit 1.
2. Apply edit 2.

**Tests**: none (shell glue; the check is the greps and the runs below)
**Gate**: `bash -n publish.sh` exits 0; `grep -c 'Production runs on Google Cloud Run' publish.sh` prints `2` (the comment and the `echo`); `grep -c 'CLOUD_RUN_PRODUCTION to false first' publish.sh` prints `1`; from the repository root, `env PATH=/nonexistent /usr/bin/bash ./publish.sh; echo "exit=$?"` prints the Cloud Run line of edit 2 and `exit=1` (with an empty `PATH` no external command can run, so this run starts nothing even if the guard were wrong); `env PATH=/nonexistent /usr/bin/bash ./publish.sh --way-back 2>&1 | head -1` prints the `Way back:` line.
**Done when**:

- [ ] `bash -n`, the greps and the two runs give the values above.
- [ ] `git diff publish.sh` shows only the two edits.

**Commit**: `feat(deploy): run publish.sh only as the way back`

---

## Phase Execution Map

```
Phase 1 (done) → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Verifier → product-owner acceptance → owner steps O1 to O15 → owner go-ahead → Phase 7 → Phase 8 → scoped Verifier round

Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5 → T6
Phase 3:  T7 → T8 → T9
Phase 4:  T10 → T11 → T12 → T13
Phase 5:  T14 → T15 → T16 → T17
Phase 6:  T18 → T19
Phase 7:  T20 → T21
Phase 8:  T22
```

Sub-agent packing: 16 code and review tasks (T4 to T19) pack into three batches by owner and phase: Phases 2 and 3 (`kotlin-backend-dev`, with T6 by `test-engineer`), Phase 4 (`game-dev`, `test-engineer`, `ui-artist`), Phases 5 and 6 (`kotlin-backend-dev`, with T19 by `game-dev`). Phases 4 and 5 touch different files and may run in parallel worktrees (`CLAUDE.md` "Agent team"); then the deploy counts of T14 to T18 still hold, because Phase 4 adds no deploy test. The owner steps O1 to O14 may start any time after T9 is on `main` (O6 applies its cleanup file, O14 runs its workflow); O15 runs after the last `backend/` commit of the feature, at most 7 days before the window. Phase 7 is the `gitops` run with the owner; Phase 8 is one task.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 module (2 functions) | ✅ Granular |
| T2 | 1 module (one rule set) | ✅ Granular |
| T3 | 1 example file + 1 ignore line + their guard test | ⚠️ Cohesive, one concept (secret handling) |
| T4 | 1 endpoint (port, adapter, controller, permit line, commit property) | ⚠️ Cohesive, one endpoint |
| T5 | 3 config keys of one file (pool and port) | ✅ Granular |
| T6 | 1 test class | ✅ Granular |
| T7 | 1 module (plan, inspect and the traffic reader) | ✅ Granular |
| T8 | 1 function in the same module | ✅ Granular |
| T9 | 1 workflow + its cleanup policy and ignore line + their text test | ⚠️ Cohesive, one deploy pipeline |
| T10 | 1 adapter + 1 composition key | ⚠️ Cohesive, one service |
| T11 | 1 scene method | ✅ Granular |
| T12 | 1 e2e spec + its fake route + its shots file | ⚠️ Cohesive, one behavior under test |
| T13 | 1 review | ✅ Granular |
| T14 | 1 module | ✅ Granular |
| T15 | 1 module | ✅ Granular |
| T16 | 1 CLI (preflight, check, verify) | ⚠️ Cohesive, one file |
| T17 | 1 function in the same CLI | ✅ Granular |
| T18 | 1 ADR + 1 README section + 1 example file | ⚠️ Cohesive, one decision |
| T19 | 1 README section | ✅ Granular |
| T20 | 1 operation | ✅ Granular |
| T21 | 1 checklist | ✅ Granular |
| T22 | 1 script, 2 edits | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None | start of Phase 2 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T4 | T4 → T7 (cross-phase block) | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T4 | T4 → T10 (cross-phase block) | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T2 | T2 → T14 (cross-phase block) | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T6, T9, T17 | T6 → T18, T9 → T18, T17 → T18 (cross-phase block) | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19, T13 | T19 → T20, T13 → T20 (cross-phase block) | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | T21 | T21 → T22 (cross-phase block) | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Deploy module | unit | unit | ✅ |
| T2 | Deploy module | unit | unit | ✅ |
| T3 | Repo config | unit | unit | ✅ |
| T4 | Backend web, port and adapter | unit + integration | unit + integration | ✅ |
| T5 | Backend config | unit + integration | unit + integration | ✅ |
| T6 | Test datasource | integration | integration | ✅ |
| T7 | Deploy module | unit | unit | ✅ |
| T8 | Deploy module | unit | unit | ✅ |
| T9 | Repo config (workflow, cleanup policy, `.gitignore`) | unit | unit | ✅ |
| T10 | Game http adapter and composition | unit | unit | ✅ |
| T11 | Game scene | unit + e2e | unit (the e2e of this behavior is T12, the next task, because the fake route is test support owned by `test-engineer`) | ⚠️ Accepted: T11's gate keeps the e2e suite green (an unrouted `/api/health` fails fast and the scene goes on), and T12 lands the e2e before any other task |
| T12 | e2e support and shots | e2e | e2e | ✅ |
| T13 | UI review | none | none | ✅ |
| T14 | Deploy module | unit | unit | ✅ |
| T15 | Deploy module | unit | unit | ✅ |
| T16 | Deploy module | unit | unit | ✅ |
| T17 | Deploy module | unit | unit | ✅ |
| T18 | Docs + repo config (`.env.example`) | unit (repo config) | unit | ✅ |
| T19 | Docs | none | none | ✅ |
| T20 | Cutover | manual | none (manual) | ✅ |
| T21 | Cutover | manual | none (manual) | ✅ |
| T22 | `publish.sh` | none | none | ✅ |

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| SUPA-01 | T5 |
| SUPA-02 | T1, T2 |
| SUPA-06 | T1, T3, T14 |
| SUPA-07 | T16 |
| SUPA-08 | T14, T17 |
| SUPA-09 | T15, T16 |
| SUPA-10 | T6 |
| SUPA-11 | T20, T21 |
| SUPA-12 | T18, T19 |
| RUN-01 | T4 |
| RUN-02 | T5, T9, T21 |
| RUN-03 | T7 |
| RUN-04 | T8 |
| RUN-05 | T9 |
| RUN-06 | T10, T11, T12, T13 |
| RUN-07 | T9, T18, T20, T21 |
| RUN-08 | T22 |
| RUN-09 | T9, T21 |
