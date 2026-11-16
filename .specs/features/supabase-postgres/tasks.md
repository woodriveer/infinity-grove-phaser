# Supabase Postgres Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/supabase-postgres/spec.md`
**Design**: `.specs/features/supabase-postgres/design.md`
**Status**: Draft (awaiting owner approval and answers Q1 to Q8 of the spec)

Rules for every task:

- Read the files under **Read first** before editing. Line numbers can drift: find the edit by its content.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` (on this machine `py -3` instead of `python3`). End the message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`).
- Mark the task `[x]` in this file in the same commit.
- Push right after the commit (`git pull --rebase origin main && git push origin HEAD:main`). Every commit that changes `backend/**` goes live through the watcher while `publish.sh` runs.
- **Secrets**: never write a real Supabase password anywhere, never print a `.env` value, never `git add .env` or anything under `backups/`. Tests use only the fake password `Fake0Password1ForTests` and the fake pooler host `aws-0-sa-east-1.pooler.supabase.com`. No task of Phases 1 to 5 connects to the real Supabase.
- Never weaken, skip or delete a test to make a gate pass. Never run two suites at once in the same checkout, and never leave one running in the background.
- Run `graphify update .` after a code task (AST only, no cost).
- Order: Phases 1 to 5 are code. When T14 is committed, the Verifier runs and `product-owner` accepts. Phase 6 (T15, T16) changes the production database. It starts only after that acceptance and an explicit go-ahead from the owner in the conversation (blast radius rule).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (suites and coverage commands), `.claude/agents/test-engineer.md` (suite table), `backend/build.gradle.kts` (JUnit 5, Testcontainers, ktlint, JaCoCo), the `deploy/**/*.test.mjs` pattern (node:test with fake `exec`). No coverage thresholds, so strong defaults apply. Lessons applied: L-037 (one test per guard state), L-039 (one test per edge case), L-023 (a config mode has a test that fails when it changes), L-044 (exact text on every failure path), L-045 (the default wiring has its own test).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Deploy modules (`deploy/lib/dotenv.mjs`, `databaseEnv.mjs`, `deploy/dbcheck.mjs`, `deploy/watcher.mjs`, `deploy/db/*.mjs`) | unit (node:test, fake `exec`) | Every rule and every exact message of the spec; one test per guard state; no argument carries a `.env` value | `deploy/**/*.test.mjs` | `node --test "deploy/**/*.test.mjs"` |
| Repo config (`backend/docker-compose.yml`, `start.sh`, `.gitignore`, `.env.example`) | unit (text and `git` checks) | Each service rule per service; each ignore rule; the example passes the check | `deploy/lib/compose.test.mjs`, `deploy/lib/secrets.test.mjs` | same |
| `publish.sh` | none (shell glue; the decision is in `deploy/dbcheck.mjs`, tested in T4) | Syntax check plus the manual check M3 | - | `bash -n publish.sh` |
| Backend config (`application.yaml`) and the test datasource | integration (Testcontainers) | Pool size 5; Testcontainers wins over a Supabase URL | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/*IT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Docs (`backend/readme.md`, ADR) | none | - | - | `git diff --check` |
| Cutover (production) | manual | M1 to M9 of the spec | - | commands in T15 and T16 |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After a deploy task, on its own test file | `node --test <the task's test file>` from the repository root. Every test passes. |
| Full (deploy) | After every deploy task | `node --test --test-reporter=tap "deploy/**/*.test.mjs" \| grep -E "^# (tests\|pass\|fail)\|^not ok"` from the repository root. Expected: `# tests <the count the task names>`, `# fail 2`, and only these two `not ok` lines, which already failed before this feature on this machine (child node exits `3221226505`): `the CLI exits 0 when every check passes` and `the CLI exits 1 when a check fails` (both `deploy/regression.test.mjs`). Any other failure blocks the task. |
| Backend | After a backend task | `cd backend && ./gradlew ktlintCheck test` (Docker must run for Testcontainers) |
| Build | After each phase | Full (deploy) and, from Phase 3 on, Backend |

Deploy suite baseline before T1: `# tests 118`, `# pass 116`, `# fail 2`.

---

## Execution Plan

Phases run in order; tasks inside a phase run in order.

### Phase 1: The `.env` rules

```
T1 → T2 → T3
```

### Phase 2: The stack reads the database from `.env`

The checks (T4 to T6) land before the compose change (T7). T3 has already created the local `.env`, so a slot started after T7 still finds the local database.

```
T4 → T5 → T6 → T7
```

### Phase 3: Backend

```
T8 → T9
```

### Phase 4: The copy tool

```
T10 → T11 → T12 → T13
```

### Phase 5: Docs

```
T14
```

### Phase 6: Cutover (production; after the Verifier PASS, the product-owner acceptance and the owner's explicit go-ahead)

```
T15 → T16
```

Cross-phase dependencies (already satisfied by the phase order):

```
T3 → T4
T2 → T10
T9 → T14
T13 → T14
T14 → T15
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
**What**: Ship a local-mode `.env.example`, ignore `backups/`, create the owner's local `.env`, and pin the secret rules with tests (SUPA-06; spec US-3).
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
3. In the owner's checkout `C:\Users\Internal.IT\Developer\infinity-grove-phaser`, when `.env` does **not** exist, run `cp .env.example .env`. Never overwrite an existing `.env`. Never `git add` it. (This keeps the next slot start on the local database once T7 lands.)
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

### T4: `deploy/dbcheck.mjs` for `publish.sh` [ ]

**Owner**: kotlin-backend-dev
**What**: A small CLI that prints the database mode of `.env` or fails with the reason, for `publish.sh` to call (SUPA-04; spec US-2 AC 4, 5).
**Where**: `deploy/dbcheck.mjs` (new)
**Also changes**: `deploy/dbcheck.test.mjs` (new)
**Read first**: `deploy/deploy.mjs` (entry guard and `main` shape), `deploy/lib/databaseEnv.mjs` (T2)
**Depends on**: T3
**Requirement**: SUPA-04

**Contract**:

```js
//  publish.sh gate: prints the database mode of the repo-root .env (local or supabase) or explains on stderr why it cannot start
//  Usage: MODE="$(node deploy/dbcheck.mjs)" || exit 1
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadDatabaseEnv } from './lib/databaseEnv.mjs';

export const main = (root, { out = (text) => process.stdout.write(text), err = (text) => console.error(text) } = {}) =>
{
    const result = loadDatabaseEnv(root);

    if (!result.ok)
    {
        err(`Configuração do banco inválida: ${result.errors.join('; ')}`);

        return 1;
    }

    out(result.mode);

    return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    process.exit(main(dirname(dirname(fileURLToPath(import.meta.url)))));
}
```

**Steps**:

1. Create `deploy/dbcheck.mjs` with the code above.
2. Create `deploy/dbcheck.test.mjs`. Each test makes a temp root (`mkdtempSync(join(tmpdir(), 'dbcheck-'))`), writes a `.env` when the case needs one, and collects `out` and `err` calls into arrays.

**Tests**: unit
**Test cases** (`deploy/dbcheck.test.mjs`):

1. `prints supabase and returns 0 for a Session pooler .env`: `.env` with the three `SUPABASE` values of T2 → return `0`, out `['supabase']`, err `[]`
2. `prints local and returns 0 for the local .env`: `.env` = the content of `.env.example` → return `0`, out `['local']`, err `[]`
3. `returns 1 and names a missing .env on stderr only`: no `.env` → return `1`, out `[]`, err `['Configuração do banco inválida: arquivo .env não encontrado na raiz do repositório']`
4. `joins every error with "; "`: `.env` with URL `jdbc:postgresql://aws-0-sa-east-1.pooler.supabase.com:6543/postgres` and the `SUPABASE` user and password → return `1`, err `['Configuração do banco inválida: a porta 6543 é o Transaction pooler, que quebra o Flyway; use a porta 5432 (Session pooler); SPRING_DATASOURCE_URL precisa de sslmode=require']`

**Gate**: Quick `node --test deploy/dbcheck.test.mjs`, then Full (deploy) with `# tests 169`.
**Done when**:

- [ ] The 4 tests pass.
- [ ] `node deploy/dbcheck.mjs` in the owner's checkout prints `local` (the `.env` of T3).
- [ ] Full (deploy) shows `# tests 169`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): add the database check for publish.sh`

---

### T5: The watcher pauses on an unusable `.env` [ ]

**Owner**: kotlin-backend-dev
**What**: Each watcher tick checks `.env` after the Docker check and, when it is unusable, logs the reason and does nothing else, so the waiting commit deploys once `.env` is fixed (SUPA-05; spec US-2 AC 8, 9).
**Where**: `deploy/watcher.mjs` (modify)
**Also changes**: `deploy/watcher.test.mjs`
**Read first**: `deploy/watcher.mjs:14` (`tick` and its injected defaults), `deploy/watcher.test.mjs:16` (`machine`)
**Depends on**: T4
**Requirement**: SUPA-05

**Contract**:

- New import: `import { loadDatabaseEnv } from './lib/databaseEnv.mjs';`
- New `tick` parameter, last in the destructuring: `checkEnv = () => loadDatabaseEnv(root)`.
- Right after the `if (exec('docker', ['info']).status !== 0) { ... }` block, before `const fetched = ...`:

```js
    //  The slots read the database from .env: while it is unusable nothing is fetched, locked or deployed, so the commit waits
    const env = checkEnv();

    if (!env.ok)
    {
        log(`Deploy pausado: ${env.errors.join('; ')}; nova tentativa em 60 s`);

        return readState(stateFile);
    }
```

- Line 2 of the file header becomes: `//  Usage: node deploy/watcher.mjs, with JWT_SECRET in the env (publish.sh exports it; compose hands it to the slots) and the database in .env`

**Steps**:

1. Edit `deploy/watcher.mjs` as above.
2. In `deploy/watcher.test.mjs`, add the option `envCheck = { ok: true, mode: 'supabase', errors: [] }` to the destructuring of `machine(...)` and `checkEnv: () => envCheck` to its `deps`. The 15 existing tests must pass unchanged.
3. Add the test cases below.

**Tests**: unit
**Test cases** (`deploy/watcher.test.mjs`, new):

1. `an unusable .env pauses the tick: no fetch, no lock, no deploy, state unchanged`: `machine({ envCheck: { ok: false, mode: null, errors: ['falta SPRING_DATASOURCE_PASSWORD no .env'] }, files: ['backend/a.kt'] })`, `await tick(deps)` → `lines` deepEqual `['Deploy pausado: falta SPRING_DATASOURCE_PASSWORD no .env; nova tentativa em 60 s']`; `events` deepEqual `['docker info']`; `readState(stateFile)` deepEqual `STATE`; `existsSync(lockFile)` is `false`
2. `the pause line joins every error with "; "`: errors `['a', 'b']` → `lines` deepEqual `['Deploy pausado: a; b; nova tentativa em 60 s']`
3. `the commit that waited deploys on the next tick once the .env is fixed`: first tick with an unusable `envCheck` and `files: ['backend/a.kt']`; then `deps.checkEnv = () => ({ ok: true, mode: 'supabase', errors: [] })` and a second tick → `events` includes `` `deploy ${TARGET} lock=true` `` and `readState(stateFile).handled === TARGET`
4. `by default the tick reads the .env of its root`: `machine({ files: ['backend/a.kt'] })`, then `delete deps.checkEnv` and `deps.root = mkdtempSync(join(tmpdir(), 'watcher-env-'))` → `lines` deepEqual `['Deploy pausado: arquivo .env não encontrado na raiz do repositório; nova tentativa em 60 s']`

**Gate**: Quick `node --test deploy/watcher.test.mjs` (19 tests), then Full (deploy) with `# tests 173`.
**Done when**:

- [ ] The 4 new tests and the 15 existing ones pass.
- [ ] Full (deploy) shows `# tests 173`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): pause the watcher while .env is unusable`

---

### T6: `publish.sh` checks `.env` and starts the local Postgres only in local mode [ ]

**Owner**: kotlin-backend-dev
**What**: `publish.sh` refuses to start on an unusable `.env` and starts the local `postgres` only when `.env` names it (SUPA-04; spec US-2 AC 6, 7).
**Where**: `publish.sh` (modify)
**Read first**: `publish.sh` (whole file), `deploy/dbcheck.mjs` (T4)
**Depends on**: T5
**Requirement**: SUPA-04

**Contract** (three edits, nothing else changes):

1. Replace the header comment lines 2 to 4 (from `# Starts the blue-green stack (Postgres, the active backend slot, ...` to `... Only commit trees go out, never the working tree.`) with:

```bash
# Checks the database of the repo-root .env (deploy/dbcheck.mjs), starts the blue-green stack (the local Postgres only when .env
# names it, the active backend slot, the Traefik proxy, Dozzle), opens a public Cloudflare quick tunnel to the proxy, publishes the
# Worker of the last handled commit through it and starts the deploy watcher, which deploys every new commit on origin/main
# (deploy/watcher.mjs). Only commit trees go out, never the working tree.
```

2. Right after the block that ends with `echo "Port $PROXY_PORT is in use by another process; stop it first (an old bootRun?)."` / `exit 1` / `fi`, and before `cleanup() {`, insert:

```bash

# The slots read the database from .env; nothing starts on a missing or invalid one (deploy/lib/databaseEnv.mjs)
DB_MODE="$(node deploy/dbcheck.mjs)" || exit 1
```

3. Replace the two lines

```bash
echo "Starting Postgres, Dozzle and backend-$SLOT ($IMAGE)..."
env "$IMAGE_VAR=$IMAGE" "${COMPOSE[@]}" up -d --wait postgres dozzle "backend-$SLOT"
```

with

```bash
if [ "$DB_MODE" = local ]; then
  echo "Starting the local Postgres (profile local-db)..."
  "${COMPOSE[@]}" --profile local-db up -d --wait postgres
fi
echo "Starting Dozzle and backend-$SLOT ($IMAGE) on the $DB_MODE database..."
env "$IMAGE_VAR=$IMAGE" "${COMPOSE[@]}" up -d --wait dozzle "backend-$SLOT"
```

**Steps**:

1. Apply edit 1.
2. Apply edit 2.
3. Apply edit 3.

**Tests**: none (shell glue; the decision is `deploy/dbcheck.mjs`, tested in T4; the run is manual check M3)
**Gate**: `bash -n publish.sh` exits 0; `grep -c 'node deploy/dbcheck.mjs' publish.sh` prints `1`; `grep -c 'up -d --wait postgres dozzle' publish.sh` prints `0`; Full (deploy) with `# tests 173`.
**Done when**:

- [ ] The three greps and `bash -n` give the values above.
- [ ] `git diff publish.sh` shows only the three edits.

**Commit**: `feat(deploy): start the stack on the database of .env`

---

### T7: Slots read `.env`, the local Postgres moves to the `local-db` profile [ ]

**Owner**: kotlin-backend-dev
**What**: The slots get the database from the repo-root `.env` by `env_file` and stop depending on the local `postgres`, which moves with `pgadmin` to the profile `local-db`. `start.sh` uses that profile (SUPA-03; spec US-2 AC 1, 2, 3).
**Where**: `backend/docker-compose.yml` (modify)
**Also changes**: `start.sh`, `deploy/lib/compose.test.mjs` (new)
**Read first**: `backend/docker-compose.yml`, `start.sh`, `deploy/lib/slots.mjs:4` (how compose is called)
**Depends on**: T6
**Requirement**: SUPA-03

**Contract**: `backend/docker-compose.yml` becomes exactly:

```yaml
services:
  # Local Postgres and pgAdmin (profile local-db): development (start.sh) and the local mode of .env (.env.example).
  # The deploy stack starts postgres only when .env names host postgres (publish.sh); never run `docker compose down -v` here.
  postgres:
    image: postgres:16
    container_name: infinity-grove-postgres
    profiles: [ local-db ]
    restart: unless-stopped
    environment:
      POSTGRES_DB: infinity_grove
      POSTGRES_USER: infinity
      POSTGRES_PASSWORD: infinity
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U infinity -d infinity_grove"]
      interval: 5s
      timeout: 5s
      retries: 10

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: infinity-grove-pgadmin
    profiles: [ local-db ]
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@infinitygrove.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      postgres:
        condition: service_healthy

  # Blue-green deploy (profile deploy): two backend slots behind the proxy, and Dozzle for the logs.
  # The slots and Dozzle bind to 127.0.0.1 only; the tunnel reaches the backend through the proxy.
  # The slots read SPRING_DATASOURCE_URL, _USERNAME and _PASSWORD from the repo-root .env (gitignored), which
  # deploy/lib/databaseEnv.mjs checks before publish.sh or the watcher starts a slot.
  backend-blue:
    image: ${BLUE_IMAGE:-infinity-grove-backend:blue}
    container_name: infinity-grove-backend-blue
    profiles: [ deploy ]
    restart: unless-stopped
    env_file:
      - path: ../.env
        required: false
    environment:
      JWT_SECRET: ${JWT_SECRET:-}
    ports:
      - "127.0.0.1:18081:8080"

  backend-green:
    image: ${GREEN_IMAGE:-infinity-grove-backend:green}
    container_name: infinity-grove-backend-green
    profiles: [ deploy ]
    restart: unless-stopped
    env_file:
      - path: ../.env
        required: false
    environment:
      JWT_SECRET: ${JWT_SECRET:-}
    ports:
      - "127.0.0.1:18082:8080"
```

followed by the `proxy`, `dozzle` and `volumes` blocks **unchanged** (copy them from the current file, from the comment `# deploy/lib/proxy.mjs writes the active slot ...` to the end).

`start.sh`: the line `(cd "$ROOT/backend" && docker compose stop)` becomes `(cd "$ROOT/backend" && docker compose --profile local-db stop)`, and the line `(cd "$ROOT/backend" && docker compose up -d --wait)` becomes `(cd "$ROOT/backend" && docker compose --profile local-db up -d --wait)`.

**Steps**:

1. Rewrite `backend/docker-compose.yml` as above.
2. Edit the two lines of `start.sh`.
3. Create `deploy/lib/compose.test.mjs`: `ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')`, read `backend/docker-compose.yml` and `start.sh` as text, and add this helper:

```js
//  The lines of one top-level service, from the line after `  <name>:` to the next service or top-level key
const serviceBlock = (text, name) =>
{
    const lines = text.split(/\r?\n/);
    const start = lines.indexOf(`  ${name}:`);
    assert.notEqual(start, -1, `service ${name} not found`);
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => /^ {2}[a-z][a-z0-9-]*:$/.test(line) || /^[a-z]/.test(line));

    return (end === -1 ? rest : rest.slice(0, end)).join('\n');
};
```

4. Write the test cases below.

**Tests**: unit
**Test cases** (`deploy/lib/compose.test.mjs`, one `test` each):

1. `backend-blue reads the repo-root .env`: block includes `'      - path: ../.env'` and `'        required: false'`
2. `backend-green reads the repo-root .env`: same for `backend-green`
3. `backend-blue does not set a datasource variable`: block does not include `'SPRING_DATASOURCE'`
4. `backend-green does not set a datasource variable`: same for `backend-green`
5. `backend-blue does not depend on the local postgres`: block does not include `'depends_on'`
6. `backend-green does not depend on the local postgres`: same for `backend-green`
7. `postgres runs only under the local-db profile`: block of `postgres` includes `'    profiles: [ local-db ]'`
8. `pgadmin runs only under the local-db profile`: block of `pgadmin` includes `'    profiles: [ local-db ]'`
9. `start.sh starts the local-db profile`: `start.sh` includes `'docker compose --profile local-db up -d --wait'`
10. `start.sh stops the local-db profile`: `start.sh` includes `'docker compose --profile local-db stop'`

**Gate**: Quick `node --test deploy/lib/compose.test.mjs`, then Full (deploy) with `# tests 183`. When Docker runs, also `docker compose -f backend/docker-compose.yml --profile deploy config --services` lists `backend-blue`, `backend-green`, `proxy`, `dozzle` and not `postgres`.
**Done when**:

- [ ] The 10 tests pass.
- [ ] `git diff backend/docker-compose.yml` touches only the two profile lines, the comments, and the `environment`/`env_file`/`depends_on` of the two slots.
- [ ] Full (deploy) shows `# tests 183`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): read the slot database from .env and move the local Postgres to a profile`

---

### T8: Hikari pool of 5 connections [ ]

**Owner**: kotlin-backend-dev
**What**: Cap the backend at 5 database connections, so two slots fit the Session pooler's pool during a switch (SUPA-01; spec US-1 AC 1, design "Connection budget").
**Where**: `backend/src/main/resources/application.yaml` (modify)
**Also changes**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/DatabasePoolConfigIT.kt` (new)
**Read first**: `backend/src/main/resources/application.yaml:4`, `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/SchemaValidationIT.kt:29` (config assertion style), `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/IntegrationTestBase.kt`
**Depends on**: None
**Requirement**: SUPA-01

**Contract**: under `spring.datasource`, right after `driver-class-name: org.postgresql.Driver`, add (4-space indent for `hikari`, as a child of `datasource`):

```yaml
    hikari:
      # Supabase Session pooler: each client connection holds one of the pooler's server connections (pool size 15 on Nano
      # and Micro); two slots run at once during a blue-green switch, so 2 x 5 = 10 leaves room for psql and the dashboard
      maximum-pool-size: 5
```

If the owner's answer to Q2 gives a Pool Size `P` below 12, use `floor((P - 2) / 2)` instead of 5 and update the test and the comment to that number.

**Steps**:

1. Edit `application.yaml`.
2. Create `DatabasePoolConfigIT.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import com.zaxxer.hikari.HikariDataSource
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.env.Environment
import javax.sql.DataSource
import kotlin.test.Test
import kotlin.test.assertEquals

/** SUPA-01: two slots share the Supabase Session pooler during a switch, so each holds at most 5 connections. */
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
    fun `the shipped yaml sets the pool size to 5`() {
        assertEquals("5", environment.getProperty("spring.datasource.hikari.maximum-pool-size"))
    }
}
```

3. Run the Backend gate. If a concurrency test fails only because it waits for a connection (a `SQLTransientConnectionException` after 30 s), stop and report it (design, Risks); do not change other tests.

**Tests**: integration
**Test cases**: the 2 tests above, plus the whole existing backend suite passing with the pool of 5.
**Gate**: Quick `cd backend && ./gradlew test --tests '*DatabasePoolConfigIT'`, then Backend `cd backend && ./gradlew ktlintCheck test`.
**Done when**:

- [ ] Both new tests pass.
- [ ] `./gradlew ktlintCheck test` passes, with 2 more tests than before the task (count the `<testcase` elements in `backend/build/test-results/test/*.xml` before and after).

**Commit**: `feat(backend): cap the database pool at 5 connections for the Supabase session pooler`

---

### T9: The tests never reach Supabase [ ]

**Owner**: test-engineer
**What**: Prove that the integration tests connect to the Testcontainers Postgres even when the datasource properties name a Supabase host (SUPA-10; spec US-5).
**Where**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/TestDatabaseIsolationIT.kt` (new)
**Read first**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/IntegrationTestBase.kt:30` (`PostgresTestConfiguration`, `@ServiceConnection`), `SchemaValidationIT.kt:10` (`JdbcConnectionDetails` import path)
**Depends on**: T8
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
 * SPRING_DATASOURCE_URL in the shell. The host ends in .invalid, so a broken isolation fails on DNS and never reaches Supabase.
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
- [ ] `./gradlew ktlintCheck test` passes with 3 more tests than after T8.

**Commit**: `test(backend): pin the integration tests to the Testcontainers Postgres`

---

### T10: Postgres tool runner and the copy SQL [ ]

**Owner**: kotlin-backend-dev
**What**: Build every `docker run postgres:<major>` call of the copy, passing connection values only by variable name, and hold every SQL text of the copy (SUPA-06, SUPA-08; spec US-3 AC 4, US-4 AC 8, 19, 20).
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

**Gate**: Quick `node --test deploy/db/pgTools.test.mjs`, then Full (deploy) with `# tests 196`.
**Done when**:

- [ ] The 13 tests pass.
- [ ] Full (deploy) shows `# tests 196`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): run the Postgres tools of the Supabase copy in containers`

---

### T11: Database snapshot and comparison [ ]

**Owner**: kotlin-backend-dev
**What**: Read row counts, sequences, Flyway history and Data API grants of one database, and compare two snapshots into the exact `verify` lines (SUPA-09; spec US-4 AC 14, 15).
**Where**: `deploy/db/snapshot.mjs` (new)
**Also changes**: `deploy/db/snapshot.test.mjs` (new)
**Read first**: `deploy/db/pgTools.mjs` (T10), spec US-4 AC 14 and 15
**Depends on**: T10
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

**Gate**: Quick `node --test deploy/db/snapshot.test.mjs`, then Full (deploy) with `# tests 208`.
**Done when**:

- [ ] The 12 tests pass.
- [ ] Full (deploy) shows `# tests 208`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): compare the local and Supabase databases`

---

### T12: Copy CLI: preflight, `check` and `verify` [ ]

**Owner**: kotlin-backend-dev
**What**: The CLI `node deploy/db/copyToSupabase.mjs check | verify` with every preflight refusal of the spec (SUPA-07, SUPA-09; spec US-4 AC 1 to 7, 14 to 18, 20).
**Where**: `deploy/db/copyToSupabase.mjs` (new)
**Also changes**: `deploy/db/copyToSupabase.test.mjs` (new)
**Read first**: `deploy/deploy.mjs` (CLI shape), `deploy/db/pgTools.mjs` (T10), `deploy/db/snapshot.mjs` (T11), `deploy/lib/databaseEnv.mjs` (T2), spec US-4
**Depends on**: T11
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
3. `exec('docker', ['inspect', '-f', '{{.State.Running}}', LOCAL_CONTAINER]).stdout.trim() !== 'true'` → push `'o Postgres local não está rodando: docker compose -f backend/docker-compose.yml --profile local-db up -d --wait postgres'`.
4. Only when `supabaseReady`: `target = supabaseTarget(vars)`; `v = psql(exec, root, PROBE_IMAGE, target, SQL.version)`. `v.status !== 0` → push `'não foi possível conectar ao Supabase pelo Session pooler; confira host, usuário e senha no .env'`. Else `major = Math.floor(Number(v.stdout.trim()) / 10000)`; `major < 16` → push `` `o Supabase roda Postgres ${major}; a cópia precisa de 16 ou mais` ``.
5. Only when `forCopy` and step 4 connected with `major >= 16`: `n = Number(psql(exec, root, toolImage(major), target, SQL.tableCount).stdout.trim())`; `n > 0` → push `` `o schema public do Supabase já tem ${n} tabelas; a cópia só roda num banco vazio` ``.
6. Return `{ ok: errors.length === 0, major, target, errors }`.

`check(deps)`: `p = preflight({ ...deps, forCopy: true })`. Not ok → `` log(`ERRO: ${e}`) `` for each error, return `1`. Ok → `` log(`Supabase: Postgres ${p.major}, schema public vazio`) ``, `log('Pronto para copiar')`, return `0`.

`verify(deps)`: `p = preflight({ ...deps, forCopy: false })`. Not ok → log each `ERRO: ...`, return `1`. `image = toolImage(p.major)`; `local = takeSnapshot(exec, root, image, LOCAL_TARGET)`; `!local.ok` → `log('ERRO: não foi possível ler o Postgres local')`, return `1`. `remote = takeSnapshot(exec, root, image, p.target, { grants: true })`; `!remote.ok` → `log('ERRO: não foi possível ler o Supabase')`, return `1`. `result = compareSnapshots(local, remote)`; log each of `result.lines`; return `result.differences === 0 ? 0 : 1`.

`main(args, deps)`: `args[0] === 'check'` → `check(deps)`; `'verify'` → `verify(deps)`; anything else → `log('Uso: node deploy/db/copyToSupabase.mjs check | copy | verify')`, return `1`. (T13 adds `'copy'`.)

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
2. Create `deploy/db/copyToSupabase.test.mjs` with this fake machine (T13 reuses it):
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
7. `check refuses a stopped local Postgres`: `localRunning: false` → `lines` deepEqual `['ERRO: o Postgres local não está rodando: docker compose -f backend/docker-compose.yml --profile local-db up -d --wait postgres']`
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

**Gate**: Quick `node --test deploy/db/copyToSupabase.test.mjs`, then Full (deploy) with `# tests 226`.
**Done when**:

- [ ] The 18 tests pass.
- [ ] `node deploy/db/copyToSupabase.mjs check` in the owner's checkout (local `.env` of T3) prints `ERRO: o .env aponta para o postgres local; ponha a conexão do Supabase (Session pooler) antes da cópia` and exits 1, without contacting Supabase.
- [ ] Full (deploy) shows `# tests 226`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): check and verify the Supabase copy`

---

### T13: Copy CLI: `copy` [ ]

**Owner**: kotlin-backend-dev
**What**: The `copy` command: dump the local `public` schema, restore it into Supabase in one transaction with the Data API grants revoked before and after, then verify (SUPA-08; spec US-4 AC 8 to 13).
**Where**: `deploy/db/copyToSupabase.mjs` (modify)
**Also changes**: `deploy/db/copyToSupabase.test.mjs`
**Read first**: `deploy/db/copyToSupabase.mjs` (T12), `deploy/db/pgTools.mjs` (`pgRun`, `filterRestoreList`, `SQL`)
**Depends on**: T12
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
2. Add the test cases below to `deploy/db/copyToSupabase.test.mjs`, reusing `machine` of T12. The stamp of `now` is `infinity_grove-20261115T143000Z`. `TOC = [';', '5; 2615 2200 SCHEMA - public pg_database_owner', '218; 1259 16385 TABLE public users infinity', ''].join('\n')`. Helper `tools(calls)` maps each `run` call to its tool arguments (after the `postgres:` image).

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

**Gate**: Quick `node --test deploy/db/copyToSupabase.test.mjs` (30 tests), then Full (deploy) with `# tests 238`.
**Done when**:

- [ ] The 12 new tests and the 18 of T12 pass.
- [ ] Full (deploy) shows `# tests 238`, `# pass 236`, `# fail 2`, only the two known `not ok` lines.

**Commit**: `feat(deploy): copy the local database to Supabase`

---

### T14: ADR 0012 and the backend README [ ]

**Owner**: kotlin-backend-dev
**What**: Record the decision as ADR 0012 and rewrite the README's Database section, removing the `docker compose down -v` advice without a warning (SUPA-12; spec US-7).
**Where**: `backend/docs/adr/0012-supabase-postgres.md` (new)
**Also changes**: `backend/readme.md`
**Read first**: `backend/docs/adr/0011-talent-points.md` (format), `backend/readme.md`, `.specs/features/supabase-postgres/design.md`
**Depends on**: T9, T13
**Requirement**: SUPA-12

**Contract**: `backend/docs/adr/0012-supabase-postgres.md`, exactly:

```markdown
# ADR 0012: Production database on Supabase Postgres

- Status: Accepted
- Date: <date of the commit, YYYY-MM-DD>
- Extends: ADR 0009 (Flyway owns the schema); keeps AD-016 (expand/contract)

## Context

The database was the local Docker Postgres of `backend/docker-compose.yml`, and both blue-green slots depended on it. The backend will later move to a host with IPv4 outbound only, so the database moves first to the managed Postgres of the Supabase project `jnqlrdnwwqslihncszej`, with the players' data.

## Decision

**Session pooler.** The slots connect to `aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require`. The direct connection is IPv6 only, and the Transaction pooler (6543) breaks Flyway and JDBC prepared statements.

**Pool of 5.** `spring.datasource.hikari.maximum-pool-size: 5`. In session mode each client connection holds one of the pooler's server connections (15 on Nano and Micro); two slots during a switch take 10.

**Secrets in `.env`.** The repo-root `.env` (gitignored) holds `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`. Compose passes it to the slots with `env_file`. `deploy/lib/databaseEnv.mjs` checks it before `publish.sh` or the watcher starts a slot.

**Local Postgres under `local-db`.** `postgres` and `pgadmin` run only under the compose profile `local-db`, for development and for the way back (`cp .env.example .env`).

**Schema `public`, closed to the Data API.** The game tables stay in `public`. The copy revokes every grant of `anon`, `authenticated` and `service_role` there, and the project's Data API is off.

**One-time copy.** `node deploy/db/copyToSupabase.mjs check | copy | verify` dumps the local `public` schema with `pg_dump` and restores it with `pg_restore --single-transaction`. Both run in `postgres:<major>` containers, and the copy compares row counts, sequences, the Flyway history and the grants.

## Consequences

- The integration tests still run on Testcontainers (`TestDatabaseIsolationIT`).
- A failing commit's migration runs on the Supabase database and is not undone (AD-016).
- Every query crosses the internet to the pooler region.
- The Free plan has no managed backup (TD-003), and `sslmode=require` does not verify the server certificate (TD-004).

## Alternatives considered

- Direct connection `db.<ref>.supabase.co`: IPv6 only.
- Transaction pooler (6543): no prepared statements, no session state for Flyway.
- A `game` schema: needs a rename during the copy and changes in Flyway, Hibernate and the tests; the grants already close `public`.
```

`backend/readme.md`: replace everything from the line `## Database` up to, but not including, the line `## Tests` with:

```markdown
## Database

The slots of the deploy read the database from the repo-root `.env` (gitignored; template `.env.example`). `deploy/lib/databaseEnv.mjs` checks it, and it has two modes:

- **Supabase** (production): Session pooler `aws-<N>-<region>.pooler.supabase.com:5432`, user `postgres.jnqlrdnwwqslihncszej`, database `postgres`, `sslmode=require` (ADR 0012). The password has letters and digits only.
- **Local**: the compose `postgres` (PostgreSQL 16, database, user and password `infinity_grove` / `infinity` / `infinity`), started with `docker compose --profile local-db up -d` from `backend/`. `start.sh` and `./gradlew bootRun` use it on `localhost:5432`.

Flyway owns the schema: on startup it applies the migrations in `src/main/resources/db/migration`, and Hibernate only validates the entities against them (ADR 0009). The seeders then fill the heroes, chapters, enemies and drop rules.

### Copy to Supabase

`node deploy/db/copyToSupabase.mjs check`, then `copy`, from the repository root, with `publish.sh` stopped and no backend slot container left. `verify` compares both databases at any time. The cutover runbook is in `.specs/features/supabase-postgres/design.md`.

### Never `docker compose down -v` on the deploy machine

The local volume `backend_postgres_data` is the way back after the Supabase cutover. `down -v` deletes it with every player. A database created before Flyway (Hibernate `ddl-auto: update`) has tables but no Flyway history; recreate it only on a development machine.
```

**Steps**:

1. Create the ADR with the text above and today's date.
2. Replace the README section.

**Tests**: none (docs)
**Gate**: `git diff --check` prints nothing; `grep -c "docker compose down -v" backend/readme.md` prints `1` (only in the warning heading).
**Done when**:

- [ ] Both files match the contract.
- [ ] The two gate commands give the values above.

**Commit**: `docs(backend): record the Supabase database decision`

---

### T15: Cutover to Supabase [ ]

**Owner**: gitops (with the owner at the keyboard; the owner types the password)
**What**: Move production to Supabase with the data, following the runbook, with two go/no-go points and the way back (SUPA-11; spec US-6 AC 1 to 6).
**Where**: production (the owner's checkout `C:\Users\Internal.IT\Developer\infinity-grove-phaser`, Docker, the Supabase project)
**Read first**: `.specs/features/supabase-postgres/design.md` section "Cutover runbook", spec US-6, CLAUDE.md "Deploy"
**Depends on**: T14
**Requirement**: SUPA-11

**Preconditions** (stop and report if one is missing): `validation.md` of this feature says PASS; `product-owner` accepted; the owner answered Q1, Q2, Q3, Q4, Q5, Q6 and said "go" for the cutover in the conversation; Docker, `cloudflared` and `npx wrangler login` are available.

**Contract**: the commands of the runbook, steps 1 to 13, in order. The texts that decide:

- Step 10: the last line is `Pronto para copiar`.
- Step 11: the output includes `Permissões do Data API: 0 OK` and the last line starts with `Verificação OK:`.
- Step 12: `publish.sh` prints `Starting Dozzle and backend-<slot> (infinity-grove-backend:<hash>) on the supabase database...` and `Published: https://infinity-grove.yan-tapajos.workers.dev/`.

**Steps**:

1. Runbook steps 1 to 4 (dashboard and repo). Write down the Pool Size and the Postgres version the dashboard shows.
2. Step 5: the owner writes down chapter, stage and copper of one existing account.
3. Steps 6 to 9.
4. Step 10. On failure: way back A, stop, report.
5. Step 11. On failure: way back A (with the SQL-editor cleanup when the restore went through), stop, report.
6. Step 12. On failure: way back B, stop, report.
7. Run T16.

**Tests**: none (manual operation on production)
**Gate**: step 11 (`copy`, which runs `verify` with no slot up) exits 0 and ends with `Verificação OK:`. After step 12 players write again, so a later `verify` may show `DIFERENTE` rows; those are not a failure of the copy.
**Done when**:

- [ ] Go/no-go 1 and 2 passed with the texts above.
- [ ] The site answers through the new tunnel, with the active slot on Supabase.
- [ ] `docker volume inspect backend_postgres_data` still succeeds.
- [ ] The commands' output is kept for `report.html` with no `.env` value in it.

**Commit**: none (no repository change; `gitops` commits only `report.html` and the changelog afterwards)

---

### T16: Production checks after the cutover [ ]

**Owner**: gitops
**What**: Run the manual checks M3 to M7 and M9 of the spec on production, and M6 again at the next backend deploy (SUPA-11; spec section Checagens).
**Where**: production
**Read first**: spec section "O que só se confere contra o projeto real"
**Depends on**: T15
**Requirement**: SUPA-11

**Contract** (each check passes with exactly this outcome):

- M3: Dozzle (`http://localhost:8888`) shows, in the active slot's log, the Flyway line `Schema "public" is up to date. No migration necessary.` and no `HikariPool-1 - Exception during pool initialization`.
- M4: `node deploy/regression.mjs http://127.0.0.1:18081` (blue active) or `http://127.0.0.1:18082` (green) prints `Regressão OK: <n> verificações em <s> s` and exits 0.
- M5: logged in as the account of T15 step 5, the site shows the same chapter, stage and copper.
- M6: Supabase Dashboard > Observability > Shared Pooler (Supavisor) Client Connections shows at most 5 with one slot; during the next backend deploy, at most 10.
- M7: Dashboard > Integrations > Data API shows the Data API disabled.
- M9 (repository): from the repository root,

```bash
node --input-type=module -e "import { readDotenv } from './deploy/lib/dotenv.mjs'; import { execFileSync } from 'node:child_process'; import { existsSync, readFileSync } from 'node:fs'; const p = readDotenv('.env').SPRING_DATASOURCE_PASSWORD; const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((f) => f && existsSync(f)); const hit = files.filter((f) => readFileSync(f).includes(p)); console.log(hit.length === 0 ? 'senha fora do repositório' : 'SENHA ENCONTRADA EM ' + hit.length + ' ARQUIVO(S) VERSIONADO(S)');"
```

  prints `senha fora do repositório`. Run it again after writing `report.html`, before its commit.
- M9 (logs):

```bash
node --input-type=module -e "import { readDotenv } from './deploy/lib/dotenv.mjs'; import { spawnSync } from 'node:child_process'; const p = readDotenv('.env').SPRING_DATASOURCE_PASSWORD; const names = spawnSync('docker', ['ps', '-a', '--filter', 'name=infinity-grove-', '--format', '{{.Names}}'], { encoding: 'utf8' }).stdout.split('\n').filter(Boolean); const hit = names.filter((n) => { const r = spawnSync('docker', ['logs', n], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }); return (r.stdout + r.stderr).includes(p); }); console.log(hit.length === 0 ? 'senha fora dos logs' : 'SENHA ENCONTRADA NOS LOGS DE ' + hit.join(', '));"
```

  prints `senha fora dos logs`.

**Steps**:

1. M3, M4, M5, M7, M9 right after T15.
2. M6 with one slot now; M6 again during the next backend deploy the watcher runs (any later backend commit).
3. Any failure within 5 minutes of the cutover: way back B of the runbook, then report.

**Tests**: none (manual checks on production)
**Gate**: M4 exits 0 and both M9 commands print the "fora" texts.
**Done when**:

- [ ] M3 to M7 and M9 give the outcomes above, recorded in `report.html` (no secret in it).
- [ ] The spec's Requirement Traceability rows move to Verified in the gitops release commit.

**Commit**: none (gitops writes `report.html`, the changelog and the tag per `CLAUDE.md`)

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Verifier → product-owner acceptance → owner go-ahead → Phase 6

Phase 1:  T1 → T2 → T3
Phase 2:  T4 → T5 → T6 → T7
Phase 3:  T8 → T9
Phase 4:  T10 → T11 → T12 → T13
Phase 5:  T14
Phase 6:  T15 → T16
```

Sub-agent packing: 14 code tasks pack into two batches, Phases 1 to 2 (7 tasks) and Phases 3 to 5 (7 tasks). Phase 6 is the `gitops` run.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 module (2 functions) | ✅ Granular |
| T2 | 1 module (one rule set) | ✅ Granular |
| T3 | 1 example file + 1 ignore line + their guard test | ⚠️ Cohesive, one concept (secret handling) |
| T4 | 1 CLI | ✅ Granular |
| T5 | 1 function change | ✅ Granular |
| T6 | 1 script, 3 edits | ✅ Granular |
| T7 | 1 compose file + 2 lines of `start.sh` that follow its profile | ⚠️ Cohesive, one concept |
| T8 | 1 config key | ✅ Granular |
| T9 | 1 test class | ✅ Granular |
| T10 | 1 module | ✅ Granular |
| T11 | 1 module | ✅ Granular |
| T12 | 1 CLI (preflight, check, verify) | ⚠️ Cohesive, one file |
| T13 | 1 function in the same CLI | ✅ Granular |
| T14 | 1 ADR + 1 README section | ⚠️ Cohesive, one decision |
| T15 | 1 operation | ✅ Granular |
| T16 | 1 checklist | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 (cross-phase block) | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | None | start of Phase 3 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T2 | T2 → T10 (cross-phase block) | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T9, T13 | T9 → T14, T13 → T14 (cross-phase block) | ✅ Match |
| T15 | T14 | T14 → T15 (cross-phase block) | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Deploy module | unit | unit | ✅ |
| T2 | Deploy module | unit | unit | ✅ |
| T3 | Repo config | unit | unit | ✅ |
| T4 | Deploy module | unit | unit | ✅ |
| T5 | Deploy module | unit | unit | ✅ |
| T6 | `publish.sh` | none | none | ✅ |
| T7 | Repo config | unit | unit | ✅ |
| T8 | Backend config | integration | integration | ✅ |
| T9 | Test datasource | integration | integration | ✅ |
| T10 | Deploy module | unit | unit | ✅ |
| T11 | Deploy module | unit | unit | ✅ |
| T12 | Deploy module | unit | unit | ✅ |
| T13 | Deploy module | unit | unit | ✅ |
| T14 | Docs | none | none | ✅ |
| T15 | Cutover | manual | none (manual) | ✅ |
| T16 | Cutover | manual | none (manual) | ✅ |

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| SUPA-01 | T8 |
| SUPA-02 | T1, T2 |
| SUPA-03 | T7 |
| SUPA-04 | T4, T6 |
| SUPA-05 | T5 |
| SUPA-06 | T1, T3, T10 |
| SUPA-07 | T12 |
| SUPA-08 | T10, T13 |
| SUPA-09 | T11, T12 |
| SUPA-10 | T9 |
| SUPA-11 | T15, T16 |
| SUPA-12 | T14 |
