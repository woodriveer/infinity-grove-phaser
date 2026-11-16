# Supabase Postgres Design

**Spec**: `.specs/features/supabase-postgres/spec.md`
**Status**: Draft (awaiting owner approval and answers Q1 to Q8)

---

## Architecture Overview

The backend code does not change, apart from the Hikari pool size. Spring already reads `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD`. What changes is where those values come from and what checks them:

- A repo-root `.env` (gitignored) holds the three values. Compose hands it to both slots with `env_file`, so the password never goes through a command line or through compose interpolation.
- One pure Node module, `deploy/lib/databaseEnv.mjs`, decides whether a `.env` is usable and in which mode (`local` = the compose `postgres` service, `supabase` = the Session pooler). `publish.sh` (through `deploy/dbcheck.mjs`), the watcher and the copy script all call it, so every rule lives in one place and is tested once.
- The local `postgres` and `pgadmin` move to the compose profile `local-db`. The deploy stack starts the local `postgres` only in `local` mode (development and the way back).
- A one-time copy script, `deploy/db/copyToSupabase.mjs` (`check`, `copy`, `verify`), runs `pg_dump`, `pg_restore` and `psql` in throwaway `postgres:<major>` containers on the compose network. It passes every connection value through `PG*` environment variables named with `-e NAME`.

```mermaid
graph TD
    ENV[.env at repo root - gitignored] -->|env_file ../.env| B[backend-blue]
    ENV -->|env_file ../.env| G[backend-green]
    ENV -->|loadDatabaseEnv| DC[deploy/dbcheck.mjs]
    ENV -->|loadDatabaseEnv| W[deploy/watcher.mjs tick]
    ENV -->|readDotenv + checkDatabaseEnv| CP[deploy/db/copyToSupabase.mjs]
    DC -->|mode local or supabase, else exit 1| PS[publish.sh]
    PS -->|mode local only| PG[(postgres - profile local-db)]
    B -->|Session pooler :5432 sslmode=require, Hikari max 5| SP[(Supabase Postgres - public)]
    G -->|Session pooler :5432, Hikari max 5| SP
    CP -->|docker run postgres:major pg_dump| PG
    CP -->|docker run postgres:major pg_restore, psql| SP
    T[./gradlew test] -->|@ServiceConnection| TC[(Testcontainers postgres:17)]
```

### Connection budget

| Client | Connections | When |
| --- | --- | --- |
| Active slot (Hikari `maximum-pool-size: 5`, Flyway borrows from the same pool) | 5 | always |
| New slot during a blue-green switch | 5 | from `startSlot` until `stopSlot` of the old one (about 10 s drain plus suite time) |
| `copyToSupabase.mjs verify` (`psql`, one at a time) | 1 | by hand |
| Supabase dashboard SQL editor | 1 | by hand |
| **Peak** | **12** | below the Session pooler pool size 15 of Nano and Micro (`compute-and-disk` table: "Default Pool Size 15") |

In session mode every client connection holds one server connection until it closes, so the pool size is also the client ceiling. A stopped slot holds no connection. The regression container talks only HTTP to the slot. If the owner's Pool Size (Q2) is below 12, T8 sets `floor((poolSize - 2) / 2)`.

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| `run` (spawnSync wrapper, merges `env` into `process.env`) | `deploy/lib/run.mjs:4` | The copy CLI's real `exec`. `-e PGPASSWORD` with no value makes `docker run` read the value from that merged environment. |
| Fake `exec` pattern (records calls, answers by command) | `deploy/lib/slots.test.mjs:9`, `deploy/lib/backendDeploy.test.mjs:31` | Every new `deploy/**` test |
| `tick` dependency injection with defaults | `deploy/watcher.mjs:14` | Add `checkEnv = () => loadDatabaseEnv(root)` the same way as `deployBackend = realDeployBackend` |
| Watcher test `machine()` | `deploy/watcher.test.mjs:16` | Gains an `envCheck` option. The default `{ ok: true }` keeps the 15 existing tests unchanged. |
| `docker run --rm --network backend_default -v <tmp>:/suite` | `deploy/lib/regressionRun.mjs:26` | The same shape for the `postgres:<major>` tool containers, including a Windows host path in `-v` |
| `IntegrationTestBase` + `PostgresTestConfiguration` (`@ServiceConnection`) | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/IntegrationTestBase.kt:30` | Base of `DatabasePoolConfigIT` and `TestDatabaseIsolationIT` |
| Config assertion style | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/SchemaValidationIT.kt:29` | `environment.getProperty(...)` check, L-023 |
| CLI entry guard `import.meta.url === pathToFileURL(process.argv[1]).href` | `deploy/watcher.mjs` (bottom), `deploy/deploy.mjs` | `deploy/dbcheck.mjs` and `deploy/db/copyToSupabase.mjs` |

### Integration Points

| System | Integration Method |
| --- | --- |
| Spring Boot datasource | Relaxed binding of the three env vars (already). New `spring.datasource.hikari.maximum-pool-size: 5`, overridable by `SPRING_DATASOURCE_HIKARI_MAXIMUMPOOLSIZE`. |
| Flyway | Unchanged. After the copy, `flyway_schema_history` holds V1 to V10 with their checksums, so the first slot on Supabase validates and applies nothing. |
| Docker Compose | `env_file` with `path` and `required` (Compose 2.24+; this machine has v5.7.0). The relative path resolves against the compose file's directory `backend/`, so `../.env` is the repo root. |
| Supabase | Session pooler only. No SDK, no keys, no Data API. |

---

## Components

### `deploy/lib/dotenv.mjs` (T1)

- **Purpose**: Parse a `.env` the way Compose's `env_file` reads plain values.
- **Interfaces**:
  - `parseDotenv(text: string): Record<string, string>`. Lines are split on `\r?\n`. A line that is empty after trim, or whose trimmed start is `#`, is skipped. A line with no `=`, or with `=` at index 0, is skipped. Key = text before the first `=`, trimmed. Value = everything after the first `=`, untouched. A later key overwrites an earlier one.
  - `readDotenv(path: string): Record<string, string> | null`. `null` when the file does not exist (`existsSync`), else `parseDotenv(readFileSync(path, 'utf8'))`.
- **Dependencies**: `node:fs`.

### `deploy/lib/databaseEnv.mjs` (T2)

- **Purpose**: The one set of rules that says whether a `.env` may reach a slot.
- **Interfaces**:
  - `SUPABASE_PROJECT_REF = 'jnqlrdnwwqslihncszej'`
  - `DATABASE_VARS = ['SPRING_DATASOURCE_URL', 'SPRING_DATASOURCE_USERNAME', 'SPRING_DATASOURCE_PASSWORD']`
  - `jdbcParts(url: string): { host: string, port: number, database: string, params: Record<string, string> } | null`. Regex `^jdbc:postgresql:\/\/([^/:?#]+):(\d+)\/([^/?#]+)(?:\?(.*))?$`. Params split on `&`, then on the first `=`, with keys lower-cased.
  - `checkDatabaseEnv(vars: Record<string, string>): { ok: boolean, mode: 'local' | 'supabase' | null, errors: string[] }`. Algorithm in T2.
  - `loadDatabaseEnv(root: string)`: same shape, reads `join(root, '.env')`.
- **Dependencies**: `dotenv.mjs`, `node:path`.

### `deploy/dbcheck.mjs` (T4)

- **Purpose**: Shell-friendly gate for `publish.sh`. Prints the mode on stdout, or the error on stderr with exit 1.
- **Interfaces**: `main(root: string, { out, err }): 0 | 1`.

### Watcher check (T5)

- **Purpose**: Pause deploys while `.env` is unusable, without marking any commit handled.
- **Location**: `deploy/watcher.mjs` `tick`, right after the `docker info` check and before `git fetch`.

### `publish.sh` (T6) and compose and `start.sh` (T7)

See the tasks for exact text.

### `deploy/db/pgTools.mjs` (T10)

- **Purpose**: Build every `docker run postgres:<major> ...` call and hold every SQL text of the copy.
- **Interfaces**: `NETWORK`, `PROBE_IMAGE`, `LOCAL_CONTAINER`, `LOCAL_TARGET`, `PG_ENV_NAMES`, `toolImage(major)`, `supabaseTarget(vars)`, `pgEnv(target)`, `pgRun(exec, root, { image, target, mount, command })`, `psql(exec, root, image, target, sql)`, `SQL`, `filterRestoreList(text)`.

### `deploy/db/snapshot.mjs` (T11)

- **Purpose**: Read the counts, sequences, Flyway history and Data API grants of one database, and compare two snapshots into the exact `verify` lines.
- **Interfaces**: `parsePairs(stdout)`, `takeSnapshot(exec, root, image, target, { grants })`, `compareSnapshots(local, remote)`.

### `deploy/db/copyToSupabase.mjs` (T12, T13)

- **Purpose**: The one-time copy CLI.
- **Interfaces**: `preflight(deps)`, `check(deps)`, `verify(deps)`, `copy(deps)`, `main(args, deps)`. `deps = { exec, root, vars, log, now }`.

---

## Data Models

### `.env` (repo root, gitignored)

```
SPRING_DATASOURCE_URL=jdbc:postgresql://aws-<N>-<region>.pooler.supabase.com:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.jnqlrdnwwqslihncszej
SPRING_DATASOURCE_PASSWORD=<24 letters and digits>
```

Local mode (the content of `.env.example`, also the way back):

```
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/infinity_grove
SPRING_DATASOURCE_USERNAME=infinity
SPRING_DATASOURCE_PASSWORD=infinity
```

### Copy target

```typescript
interface Target {
  host: string      // 'postgres' or the pooler host
  port: number      // 5432
  database: string  // 'infinity_grove' or 'postgres'
  user: string
  password: string
  sslmode: string   // 'disable' (local) or the URL's sslmode
}
```

### Snapshot

```typescript
interface Snapshot {
  ok: boolean
  tables: Map<string, string>     // table name -> row count, from SQL.tableCounts
  sequences: Map<string, string>  // sequence name -> last_value (0 when never used)
  flyway: string[]                // 'version|checksum' of each successful migration, by installed_rank
  grants: number | null           // Supabase only: Data API grants left in public
}
```

---

## Cutover runbook (T15)

Run from Git Bash at the repository root of the owner's checkout `C:\Users\Internal.IT\Developer\infinity-grove-phaser`. The owner types the password into `.env` with an editor; it never goes into a chat, a command line or a file other than `.env`.

**Before the window (any day):**

1. Supabase Dashboard > Connect > Session pooler: copy the host `aws-<N>-<region>.pooler.supabase.com` (Q1).
2. Database Settings: if the password has a space, `#`, `$`, a quote or `\`, reset it to 24 letters and digits (Q6). Note the Pool Size (Q2).
3. Integrations > Data API: turn **Enable Data API** off (Q5).
4. Make sure every commit of this feature is on `origin/main` and the working tree has it (`git status`, `git log -1`).

**In the window:**

5. Log in to the game with one existing account. Write down its chapter, stage and copper.
6. Ctrl+C in the `publish.sh` terminal. The watcher, the tunnel, the proxy, Dozzle and the slots stop, and the site goes offline.
7. `docker ps -a --filter name=infinity-grove-backend- --format '{{.Names}} {{.State}}'`, then `docker rm <each name listed>`. The images stay; `publish.sh` recreates the active slot from its image.
8. `docker compose -f backend/docker-compose.yml --profile local-db up -d --wait postgres`.
9. Edit `.env` and put in the three Supabase lines (Data Models).
10. `node deploy/db/copyToSupabase.mjs check`. **Go/no-go 1**: the output ends with `Pronto para copiar`.
11. `node deploy/db/copyToSupabase.mjs copy`. **Go/no-go 2**: the output ends with `Verificação OK: <t> tabela(s), <n> linha(s)` and includes `Permissões do Data API: 0 OK`.
12. `./publish.sh`. It prints `Starting Dozzle and backend-<slot> (...) on the supabase database...`, then the tunnel and `Published: ...`.
13. The checks of T16.

**Way back A (step 10 or 11 failed; nothing reached players on Supabase):** `cp .env.example .env`, then `./publish.sh`. If step 11 failed after the restore (`Verificação FALHOU`), the Supabase `public` schema keeps the copied tables. Before a new try, empty it in the Supabase SQL editor:

```sql
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop table public.%I cascade', t);
  end loop;
end $$;
```

**Way back B (step 12 or 13 failed):** Ctrl+C, `docker ps -a --filter name=infinity-grove-backend- --format '{{.Names}}'` and `docker rm` each, `cp .env.example .env`, `./publish.sh`. Writes made on Supabase since step 12 are not in the local database (spec Q3); write that in the report.

**After:** never run `docker compose down -v` on this machine while the Q3 period lasts. Keep `backups/infinity_grove-*.dump`.

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| `.env` missing or invalid at `publish.sh` | `dbcheck.mjs` exit 1 with `Configuração do banco inválida: ...`; nothing starts | Owner sees the reason; site stays as it was |
| `.env` missing or invalid while the watcher runs | `Deploy pausado: ...; nova tentativa em 60 s`, state untouched | New commits wait; the active slot keeps serving |
| Wrong Supabase password at a deploy | Spring fails at Hikari init, the container restarts, no 401 in 180 s, existing `não ficou pronto` path removes the slot | None; the active slot keeps serving |
| Supabase down while a slot runs | Requests that need the database fail (existing 500 handling); Hikari reconnects when the pooler is back | Players see errors until Supabase returns; there is no fallback (spec Out of Scope) |
| Pooler client limit reached | Hikari waits `connection-timeout` (30 s default), then the request fails | Slow or failed requests; the 12-connection peak stays below 15 |
| Restore fails mid-way | `--single-transaction` rolls back; `public` stays empty | None; the cutover goes back (way back A) |
| A failing commit's Flyway migration | Runs on Supabase before the suite and is not undone (AD-016) | Same rule as today, now on the managed production database |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| --- | --- | --- | --- |
| Data API exposes `public` tables to the project's public key: Supabase grants `select, insert, update, delete, ...` on new `public` tables to `anon`, `authenticated` and `service_role` by default, and the tables have no RLS | Supabase default privileges (`securing-your-api` guide) | Anyone with the publishable key could read `users` (password hashes) and `refresh_tokens` | `copy` revokes the default privileges **before** the restore and every grant **after** it (T13). `verify` requires `Permissões do Data API: 0 OK`. The Data API is disabled in the dashboard (Q5, M7). |
| A stopped slot container keeps the old `SPRING_DATASOURCE_*` it was created with, and `./deploy.sh --rollback` restarts it with `docker start` | `deploy/lib/slots.mjs:34` (`resumeSlot`) | After the cutover, a rollback would bring a backend back on the local database, and writes would split between two databases | `check` and `copy` refuse while any `infinity-grove-backend-*` container exists (T12). The runbook removes them (step 7). |
| Compose reads `env_file` from the working tree, not from the commit | `backend/docker-compose.yml` is read from the checkout by `deploy/lib/slots.mjs:4` | A wrong `.env` would reach the next deploy | The watcher checks `.env` on every tick before it deploys (T5) |
| The slot env holds the password; `docker inspect infinity-grove-backend-<slot>` shows it | Docker engine | Anyone with access to this machine's Docker can read it | Same trust boundary as Dozzle and the Docker socket (blue-green-deploy). Never paste `docker inspect` output into a report. |
| `backend/readme.md` tells the reader to run `docker compose down -v` | `backend/readme.md:13` | Deletes the way-back database | T14 rewrites that section with a warning |
| Latency: each query crosses the internet to the pooler region | — | Endpoints with several queries (outcome report under row locks) get slower; more time under the `progress` lock | Pick the region closest to the backend (Q1). The regression suite (M4) and the owner's play (M5) are the check. The Render move will choose a region next to the project. |
| Free plan pauses an inactive project after 7 days and has no managed backup | Supabase plan | The game stops when the project pauses; data can be lost | Q2; TD-003. The cutover dump stays in `backups/`. |
| Pre-existing deploy test failures on this machine: `deploy/regression.test.mjs` "the CLI exits 0 when every check passes" and "the CLI exits 1 when a check fails" exit `3221226505` (Windows `STATUS_STACK_BUFFER_OVERRUN` of the child node) | `deploy/regression.test.mjs:421` | A task gate on the full deploy suite would fail for a reason that is not this feature | The deploy gate accepts exactly these 2 failures and nothing else (tasks, Gate Check Commands) |
| Hikari pool 5 under the integration tests: the widest concurrency test uses 4 threads plus the test thread | `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ProgressRepositoryIT.kt:68` | A test that needs more than 5 connections at once would wait 30 s and fail | The full backend gate of T8 is the proof. If it fails there, T8 sets `spring.datasource.hikari.maximum-pool-size=10` only in `IntegrationTestBase` properties and says so in the commit. |
| `pg_dump` of a custom-format dump may or may not carry a `SCHEMA - public` entry, depending on version | Postgres 15+ public schema ownership | `pg_restore` would stop on `schema "public" already exists` | `filterRestoreList` removes the `SCHEMA - public` and `COMMENT - SCHEMA public` TOC lines when they exist (T10) |
| Supabase docs list the direct connection for `pg_dump` and restore | `connecting-to-postgres` guide, "Choose a connection method" | The direct connection needs IPv6 | Session mode is a full session (prepared statements, advisory locks, `SET`), so `pg_dump`, `pg_restore` and Flyway work through it. If the copy ever fails only through the pooler, the IPv6 direct host is the fallback by hand. |

---

## Tech Decisions (only non-obvious ones)

| Decision | Choice | Rationale |
| --- | --- | --- |
| How the slot gets the secret | Compose `env_file` | No interpolation of the value, nothing on a command line, and the watcher's `startSlot` call does not change |
| Where the rules live | One pure module, `databaseEnv.mjs`, used by shell, watcher and copy | Haiku-sized tests; the rule set cannot drift between three callers |
| Copy tool | `pg_dump`/`pg_restore` custom format in Docker, not `supabase db dump` or `psql < plain.sql` | No local Postgres client needed; the client version matches the server; one transaction; the TOC can be filtered |
| Tool image | `postgres:<Supabase major>` (probe with `postgres:17`) | `pg_dump` N reads a 16 server; `pg_restore` N writes into an N server |
| Schema | `public` | Flyway, Hibernate, Testcontainers and the dump already use it. Exposure is closed by REVOKE and by disabling the Data API. A `game` schema would need a rename during the copy and changes in Flyway, Hibernate and the tests. |
| Way back | `.env.example` is the local `.env` | One copy command; the example is tested to be valid (T3) |

> **Project-level decision:** AD-023 in `.specs/STATE.md` (proposed).

---

## CLAUDE.md (owner edit, Q8)

Suggested replacement of the first sentence of the "Deploy" section, for the owner to apply after the cutover:

> The backend and the game go live from `origin/main` while `./publish.sh` runs. From the repository root it checks the repo-root `.env` (database of the slots, gitignored), starts the blue-green stack in Docker (the active backend slot on the Supabase Postgres of `.env`, the Traefik proxy on `localhost:8080`, Dozzle; the local Postgres only when `.env` names it), opens the `cloudflared` quick tunnel to the proxy, publishes the game Worker through that tunnel and starts the deploy watcher (`deploy/watcher.mjs`).
