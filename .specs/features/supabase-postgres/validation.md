# Supabase Postgres Validation

**Date**: 2026-11-16
**Spec**: `.specs/features/supabase-postgres/spec.md` (revision 3)
**Diff range**: `0adb119..origin/main` (`53729a5`), plus T1 to T3 at `afccf64`, `ea5014f`, `f407d25`. Scope: Phases 1 to 6 (T1 to T19) and the review fix `3d92e79`. Phase 7 (T20, T21) and Phase 8 (T22) are out of scope.
**Verifier**: independent sub-agent (author ≠ verifier), round 1 of 3

**Verdict: FAIL** — every suite is green and no requirement is broken, but 4 of 29 mutants survived (C5, W1, D1, D2). Each one is a spec outcome that a test does not pin. All four are test-only fixes for `test-engineer`, listed under "Fix Plans".

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1, T2, T3 | ✅ Done | Earlier commits `afccf64`, `ea5014f`, `f407d25`. |
| T4 | ✅ Done | `38d0f59`. The `grep -c 'authorize(HttpMethod.GET, "/health", permitAll)'` gate prints `1`. |
| T5 | ✅ Done | `59e04f0`. The `grep -c 'port: ${PORT:8080}'` gate prints `1`. |
| T6 | ✅ Done | `15f0c0b`. |
| T7 | ✅ Done | `f29e79a`. The total is 245, not 190, because T14 to T17 landed first (see the ruling below). |
| T8 | ✅ Done | `ded1559`. Total 259, not 204 (same reason). |
| T9 | ✅ Done | `fd782e6`. Total 279, not 224. Its last Done-when line is still `[ ]`, but it is met: run `43910950673` (push of `fd782e6`) shows `conclusion: skipped`, with jobs `backend skipped` and `game skipped` (`gh run view 43910950673 --json jobs`). Every later push run is also `skipped` (`43911099521`, `43912619203`, `43914841566`, `43926334594`). |
| T10, T11 | ✅ Done | `d8dc57e`, `420c8bb`. |
| T12 | ✅ Done | `da171ee`. The four PNGs are in `ui-review/`. |
| T13 | ✅ Done | `45bfd00`. Finding #1 was fixed in `3d92e79` and re-reviewed in `53729a5`. Finding #2 (Low) is still open (see the ruling below). |
| T14 to T17 | ✅ Done | `b9b874e`, `80b745e`, `09df986`, `2616493`. The `# tests 237/249/267/279` lines are still `[ ]` (see the ruling below). |
| T18 | ✅ Done | `4966ede`. Re-run now: `git diff --check` is clean, `grep -c "docker compose down -v" backend/readme.md` prints `1`, and the Fly grep prints `0`. |
| T19 | ✅ Done | `203e4f6`. Re-run now: `publish.sh` 0, `run.app` 1, `CLOUD_RUN_PRODUCTION` 1, the Fly grep 0. |
| T20, T21, T22 | ⏭️ Out of scope | These are the cutover, the production checks and `publish.sh`. They need the owner's cloud setup. |

### Rulings on the open Done-when lines

- **T14 to T17 `# tests N` lines: met.** Those numbers assumed that Phase 3 ran before Phase 5. In fact Phase 5 landed first, so the counts after each task were 178, 190, 208 and 220, not 237, 249, 267 and 279. The arithmetic now adds up exactly. The baseline was 165 after T3. The feature files count 13 tests in `pgTools`, 12 in `snapshot`, 30 in `copyToSupabase` (18 + 12), 39 in `cloudRunRelease` and 20 in `workflow`, and `secrets` gained 1. That makes 165 + 13 + 12 + 30 + 39 + 20 + 1 = **280**, which is the `# tests 280` this round measured. The only failures are the 2 known ones. What the criteria actually ask for is "the task's tests pass, and nothing else fails". That holds. The literal totals were never reachable in the order the tasks really ran. Tick them with that note; no code change is needed.
- **T9 "Deploy run skipped": met** (run `43910950673`, see above).
- **ui-review finding #2 (Low, landscape phone about 7.6 px): does not block.** No acceptance criterion in the spec sets a font size. RUN-06 AC 3 asks only for the exact text and no error style, and both are met. The ui-artist marked it "Aceitável por ora" ("acceptable for now"). The tagline and the form fields on the start screen share the same canvas scale. It goes to `product-owner` as a follow-up, not as a fix for this round.

---

## Spec-Anchored Acceptance Criteria

Legend: ✅ the test asserts the outcome the spec defines · ⚠️ partial or spec-precision gap · ❌ gap (a mutant survived, or there is no evidence) · ⏭️ manual (M1 to M15, checked against production in T20 and T21, still pending)

### SUPA-01: Session pooler, pool (US-1 AC 1 to 3)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `maximum-pool-size: 5` | `backend/src/test/kotlin/.../adapter/repository/DatabasePoolConfigIT.kt:108` `assertEquals(5, ...maximumPoolSize)` and `:118` (yaml `"5"`); mutant B3 was killed | ✅ |
| 2 | `minimum-idle: 1` | `DatabasePoolConfigIT.kt:113` `assertEquals(1, ...minimumIdle)` and `:123` | ✅ |
| 3 | URL, user and password come from `SPRING_DATASOURCE_*`, with the local defaults | The defaults are in `backend/src/main/resources/application.yaml` (`spring.datasource.*`). No test proves that the environment variables override them. Spring Boot's relaxed binding does this. `.github/workflows/deploy.yml:94` relies on it for the runner regression. | ⚠️ config only, no test (Low) |

### SUPA-02: `checkDatabaseEnv` (US-1 AC 4 to 18; T1 and T2, done before this range)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 4 | `{ ok: true, mode: 'supabase', errors: [] }` | `deploy/lib/databaseEnv.test.mjs:24` deepEqual | ✅ |
| 5 | `{ ok: true, mode: 'local', errors: [] }` | `databaseEnv.test.mjs:29` | ✅ |
| 6 | Other pooler index and region; `verify-ca`; `verify-full` | `databaseEnv.test.mjs:34`, `:42`, `:50` | ✅ |
| 7 | `falta <NOME> no .env`, in order | `databaseEnv.test.mjs:58`, `:67` | ✅ |
| 8 | Refused characters | `databaseEnv.test.mjs:175` (8 characters, one test each), `:185`, `:192` | ✅ |
| 9 | Non-JDBC URL, `mode: null` | `databaseEnv.test.mjs:157` | ✅ |
| 10 | `user` or `password` in the URL | `databaseEnv.test.mjs:139`, `:148` | ✅ |
| 11 | Direct connection is IPv6 only, `mode: null` | `databaseEnv.test.mjs:94` | ✅ |
| 12 | Port 6543, or another port | `databaseEnv.test.mjs:76`, `:85` | ✅ |
| 13 | Database is not `postgres` | `databaseEnv.test.mjs:121` | ✅ |
| 14 | `sslmode` | `databaseEnv.test.mjs:103`, `:112` | ✅ |
| 15 | Pooler user | `databaseEnv.test.mjs:130` | ✅ |
| 16 | Unknown host, `mode: null` | `databaseEnv.test.mjs:166` | ✅ |
| 17 | `loadDatabaseEnv` without `.env` | `databaseEnv.test.mjs:215` | ✅ |
| 18 | No message carries the password | `databaseEnv.test.mjs:199` | ✅ |

### SUPA-06: Secrets in the repository (US-6 AC 1 to 5)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `.env` and `backups/` are ignored | `deploy/lib/secrets.test.mjs:16`, `:21` (`git check-ignore`) | ✅ |
| 2 | `.env.example` password placeholder | `secrets.test.mjs:49` | ✅ |
| 3 | Exactly 5 tracked `.env` files; no `SPRING_DATASOURCE` in `game/.env.*` | `secrets.test.mjs:26`, `:33`; `git ls-files` lists exactly these 5 | ✅ |
| 4 | Connection values go by name only (`-e PGPASSWORD`) | `deploy/db/pgTools.test.mjs:72`, `deploy/db/copyToSupabase.test.mjs:281`; mutant D6 was killed | ✅ |
| 5 | `.env.example` passes in `local` mode | `secrets.test.mjs:41` | ✅ |

### SUPA-07: Copy preflight and `check` (US-7 AC 1 to 7, 18, 20)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `Supabase: Postgres <n>, schema public vazio` and `Pronto para copiar`, exit 0 | `copyToSupabase.test.mjs:131` deepEqual lines | ✅ |
| 2 | Local, invalid or missing `.env`: exact message, no Supabase call, exit 1 | `copyToSupabase.test.mjs:139`, `:147` (no `docker run`), `:156`. Covered for `check`; `copy` shares `preflight` (`:420`). | ✅ |
| 3 | Slot running or stopped | `copyToSupabase.test.mjs:164`, `:172` | ✅ |
| 4 | Local Postgres is not running | `copyToSupabase.test.mjs:180`. Tested on `check` only; `verify` shares `preflight`. | ✅ |
| 5 | Supabase unreachable | `copyToSupabase.test.mjs:188` | ✅ |
| 6 | Supabase major version below 16 is refused | `copyToSupabase.test.mjs:196` uses `150008`. **Mutant D2 (`< 16` changed to `<= 16`) survived**: no test proves that 16 is accepted. | ❌ |
| 7 | `public` already has tables | `copyToSupabase.test.mjs:204` uses `12`. **Mutant D1 (`> 0` changed to `> 1`) survived**: a schema with exactly 1 table passes as empty. | ❌ |
| 18 | Usage line | `copyToSupabase.test.mjs:273` | ✅ |
| 20 | Tool image `postgres:<major>`, probe `postgres:17` | `copyToSupabase.test.mjs:212` | ✅ |

### SUPA-08: `copy` (US-7 AC 8 to 13, 19)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 8 | Order: dump, print, list without the `SCHEMA - public` and `COMMENT - SCHEMA public` entries, revoke defaults, restore with the exact flags, revoke grants, print, verify | `copyToSupabase.test.mjs:320` (order and lines), `:341` (dump args), `:354` (restore args), `:366` (list file), `pgTools.test.mjs:124`, `:163`; mutants D3, D4 and D7 were killed | ✅ |
| 9 | `pg_dump` fails | `copyToSupabase.test.mjs:375` | ✅ |
| 10 | `pg_restore --list` fails | `copyToSupabase.test.mjs:384` | ✅ |
| 11 | Revoking the defaults fails, so no restore | `copyToSupabase.test.mjs:393` | ✅ |
| 12 | `pg_restore` fails | `copyToSupabase.test.mjs:402` | ✅ |
| 13 | Revoking the grants fails | `copyToSupabase.test.mjs:411` | ✅ |
| 19 | The SQL names only `public` | `pgTools.test.mjs:150` | ✅ |

### SUPA-09: `verify` (US-7 AC 14 to 17)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 14 | Per-table, sequence, Flyway and grants lines, alphabetical order, `-` on a missing side | `deploy/db/snapshot.test.mjs:79`, `:94`, `:103`, `:110`, `:118`, `:125`, `:134` | ✅ |
| 15 | `Verificação OK: ...` or `Verificação FALHOU: <n> diferença(s)`, with the exit code | `copyToSupabase.test.mjs:226`, `:240`; mutant D8 was killed | ✅ |
| 16 | One side cannot be read | `copyToSupabase.test.mjs:257`, `:265` | ✅ |
| 17 | Runs while the slots are up, with no container check | `copyToSupabase.test.mjs:249`; mutant D5 was killed. Read-only by construction: `verify` runs only `select` queries (`snapshot.mjs`). | ✅ |

### SUPA-10: Tests never reach Supabase (US-8)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `jdbcUrl` equals `JdbcConnectionDetails` and holds the mapped port, even with a Supabase URL property | `backend/src/test/kotlin/.../adapter/repository/TestDatabaseIsolationIT.kt:182` | ✅ |
| 2 | `jdbcUrl` never contains `supabase` | `TestDatabaseIsolationIT.kt:189` | ✅ |

### SUPA-11: Cutover (US-9 AC 1 to 10) — ⏭️ T20 and T21, out of scope (M1 to M5, M14, M15 pending)

### SUPA-12: Documentation (US-11)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | ADR 0012 with the decisions and the rejected alternatives | `backend/docs/adr/0012-production-on-cloud-run-and-supabase.md:13-29` (decisions), `:39-48` (Fly.io, Render, direct connection, Transaction pooler, Cloud Build, JSON key, `--min-instances=1`) | ✅ (docs, no test) |
| 2 | Backend README: Cloud Run, logs, `update-traffic`, the copy, the `down -v` warning | `backend/readme.md` sections Production, "Copy to Supabase", "Never `docker compose down -v`" | ✅ (docs) |
| 3 | Game README: the workflow publishes with `BACKEND_URL`, plus the by-hand publish | `game/readme.md` Deploy section | ✅ (docs) |

### RUN-01: `GET /health` (US-2)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | 200, `{"status":"UP","commit":"<app.commit>"}`, JSON, no token | `backend/src/test/kotlin/.../adapter/web/HealthIT.kt:56` (status, content type, both fields), `HealthControllerTest.kt:16`; mutants B1 and B2 were killed | ✅ |
| 2 | 503 `{"status":"DOWN",...}` when `select 1` fails | `HealthControllerTest.kt:24` (503 and body), `JdbcDatabaseHealthTest.kt:136` (unreachable is false); mutant B4 was killed | ✅ |
| 3 | `app.commit: ${APP_COMMIT:unknown}` | `HealthControllerTest.kt:32` | ✅ |
| 4 | `POST /health` without a token is 401 `AUTH_UNAUTHENTICATED` | `SecurityIT.kt:216` with `assertUnauthenticated` (`:34-42`, `code` equals `AUTH_UNAUTHENTICATED`) | ✅ |
| 5 | Existing routes unchanged | `git diff 0adb119..origin/main -- .../SecurityIT.kt` only adds 2 tests, and every `SecurityIT` test passes | ✅ |

### RUN-02: The Cloud Run service (US-3)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Service, region, image `.../infinity-grove/backend:<commit>`, `backend/Dockerfile` unchanged | `deploy/cloudrun/workflow.test.mjs:107`; `git diff 0adb119..origin/main -- backend/Dockerfile` is empty | ✅ |
| 2 | The flags | `workflow.test.mjs:117` | ✅ |
| 3 | Startup and liveness probes | `workflow.test.mjs:117` | ✅ |
| 4 | `APP_COMMIT`, `JAVA_TOOL_OPTIONS`, `env_vars_update_strategy: overwrite` | `workflow.test.mjs:132` | ✅ |
| 5 | `server.port: ${PORT:8080}` | `backend/src/test/kotlin/.../adapter/web/ServerPortConfigTest.kt:85` | ✅ |
| 6, 7 | `allUsers` invoker; runtime account with only `secretAccessor` | — | ⏭️ M11 |

### RUN-03: `plan`, `inspect`, `image`, usage (US-4 AC 1 to 5, 12 to 14)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | `git log -1 --format=%H -- backend`, `/health` with a **90 s** timeout, the 4 outputs, `tag=c-<7>` | `deploy/cloudrun/cloudRunRelease.test.mjs:96`, `:153`. The test checks that the exported `HEALTH_TIMEOUT_MS` is 90000 and that some `AbortSignal` is passed. **Mutant C5 (`AbortSignal.timeout(1000)` at the call site) survived**: nothing proves that the 90 s reaches the request. | ❌ |
| 2 | `deploy=false` plus the message | `cloudRunRelease.test.mjs:110`; mutant C1 was killed | ✅ |
| 3 | `deploy=true`, `live=none` (no answer, 503, HTML, not a hash) | `cloudRunRelease.test.mjs:119`, `:128`, `:137`, `:145` | ✅ |
| 4 | `git log` fails | `cloudRunRelease.test.mjs:173` | ✅ |
| 5 | `BACKEND_URL` is missing, so nothing runs | `cloudRunRelease.test.mjs:183`, `:457` | ✅ |
| 12 | `inspect` lines, and the describe error | `cloudRunRelease.test.mjs:215`, `:226`, `:236` | ✅ |
| 13 | `image`: the args, `prebuilt=true/false`, both messages, a missing `IMAGE` | `cloudRunRelease.test.mjs:290`, `:302`, `:311` | ✅ |
| 14 | Usage line for anything else | `cloudRunRelease.test.mjs:252`, `:261`, `:322` | ✅ |

### RUN-04: `release` (US-4 AC 6 to 11)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 6 | Describe args; candidate by tag; the revision at 100 % | `cloudRunRelease.test.mjs:338`, `:193`, `:201`; mutant C6 was killed | ✅ |
| 7 | Describe fails or has no `status.traffic`; tag missing | `cloudRunRelease.test.mjs:362`, `:209`, `:372` | ✅ |
| 8 | Tag `/health` is not the target, so remove the tag, exact message, no regression, no switch | `cloudRunRelease.test.mjs:382`, `:393`; mutant C2 was killed. The 90 s wait has the same C5 gap as RUN-03 AC 1. | ⚠️ (see C5) |
| 9 | Regression with `REGRESSION_COMMIT=<7>`; on failure, remove the tag | `cloudRunRelease.test.mjs:338` (`env`), `:402`, `:413`; mutants C3 and C7 were killed | ✅ |
| 10 | `--to-revisions <cand>=100 --clear-tags`; a failed switch; success | `cloudRunRelease.test.mjs:338`, `:421`, `:351` | ✅ |
| 11 | Way back passes, fails, or there is no previous revision | `cloudRunRelease.test.mjs:430`, `:439`, `:447`; mutant C4 was killed | ✅ |

### RUN-05: The workflow (US-4 AC 15 to 24)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 15 | Push paths plus `workflow_dispatch` `mode` | `workflow.test.mjs:17`, `:23`, `:48` | ✅ |
| 16 | Group `production`, `cancel-in-progress: false` | `workflow.test.mjs:36`; mutant W2 was killed | ✅ |
| 17 | `CLOUD_RUN_PRODUCTION` gate; build-only and rehearsal exception | `workflow.test.mjs:42` | ✅ |
| 18 | Order: sign-in, image, tests, build, regression, push, revision (`no_traffic`), release | `workflow.test.mjs:66`, `:58`, `:107`; mutant W3 was killed | ✅ |
| 19 | `prebuilt=true` skips tests, build, regression and push | `workflow.test.mjs:58` (5 `prebuilt == 'false'` gates) | ✅ |
| 20 | Tag is always the 40-character commit, never `latest` | `workflow.test.mjs:153` | ✅ |
| 21, 22 | build-only and rehearsal: no revision, no Worker; rehearsal runs `inspect` | `workflow.test.mjs:190`, `:58` | ✅ |
| 23 | The `game` job **publishes the Worker** with `BACKEND_URL` after a green deploy run | `workflow.test.mjs:163` checks `needs`, `result == 'success'`, the mode and `BACKEND_URL`. **Mutant W1 (`run: npm run deploy` changed to `run: echo no publish`) survived**: no test checks that the job publishes. | ❌ |
| 24 | The candidate runs on `ci-postgres`, never on a secret | `workflow.test.mjs:89` | ✅ |

### RUN-06: The game waits for the server (US-5)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | One `GET /api/health`, no token, 60 s, before any session call | `game/src/adapters/http/healthApi.test.js:12` (`toHaveBeenCalledWith('/health', { skipAuth: true, timeout: 60000 })`), `game/src/adapters/phaser/MainMenu.test.js:366` (call order); e2e `game/e2e/wake.spec.js:45`, `:53` (`healthCalls()` is 1); mutants G3 and G5 were killed | ✅ |
| 2 | `...` for the first 2 s | `MainMenu.test.js:375` (at 1999 ms); mutant G1 was killed | ✅ |
| 3 | `Acordando o servidor, aguarde...` after 2 s, no error style | `MainMenu.test.js:387` (`{ text: WAKE, isError: false }` at 2000 ms); e2e `wake.spec.js:34-35`; mutant G4 was killed | ✅ |
| 4 | Restore as today: form, welcome, or the server-down message with the error style | `MainMenu.test.js:399`, `:426`; e2e `wake.spec.js:36-37`, `:68` | ✅ |
| 5 | A failed call goes on with no retry | `healthApi.test.js:20`, `:26`; `MainMenu.test.js:426`; e2e `wake.spec.js:57-69` (under 15 s with the server down) | ✅ |
| 6 | Scene left while pending: no restore, no notice | `MainMenu.test.js:437`; mutant G2 was killed | ✅ |
| 7 | User already in the registry: no `/api/health` | `MainMenu.test.js:455` | ✅ |
| 8 | `services.backend.wake()` resolves true or false and never rejects | `game/src/composition.test.js:7`, `:11`; `healthApi.test.js:12-30`; mutant G6 was killed | ✅ |

### RUN-07: Secrets in CI and the cloud (US-6 AC 6 to 12)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 6 | WIF auth, `id-token: write`, Cloudflare only from `secrets.*`; no `credentials_json`, `private_key`, `supabase` or `run.app` | `workflow.test.mjs:95`, `:171` | ✅ |
| 7 | 4 secrets from Secret Manager `:latest`, `secrets_update_strategy: overwrite` | `workflow.test.mjs:132` | ✅ |
| 10 | `.env.example` names the copy and `gcloud secrets create`; no `env_file`, slots or Fly | `secrets.test.mjs:57` | ✅ |
| 11 | `gha-creds-*.json` is ignored | `workflow.test.mjs:213` | ✅ |
| 8, 9, 12 | Owner-only secrets; no datasource secret before `Verificação OK`; no SA keys | — | ⏭️ M11 |

### RUN-08: `publish.sh` is only the way back — ⏭️ T22, out of scope

### RUN-09: Cost (US-12)

| AC | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| 1 | Exactly the two cleanup policies | `workflow.test.mjs:205` deepEqual of the JSON | ✅ |
| 6 | The prebuilt image is safe from cleanup | Follows from AC 1 and RUN-05 AC 20 (`workflow.test.mjs:153`) | ✅ (by construction) |
| 2 to 5 | Policy active, budget, at most 6 secret versions, the first-month bill | — | ⏭️ M12, M13 |

**Status**: ❌ 4 gaps (C5: RUN-03 AC 1 and RUN-04 AC 8; W1: RUN-05 AC 23; D1: SUPA-07 AC 7; D2: SUPA-07 AC 6), plus 1 Low config-only item (SUPA-01 AC 3). The manual checks M1 to M15 are pending, not failed.

---

## Discrimination Sensor

Depth: **P0** (data copy, deploy gating, secrets), 29 behavior-level mutants. Each mutant ran with `node scripts/sensor.mjs` against the narrowest test command (one node test file, one Gradle test class, one Vitest file or one Playwright spec). The deploy mutants ran in a temporary worktree of `53729a5` (removed afterwards) while the main checkout ran e2e. The backend and game mutants ran in the main checkout after every suite had finished. Isolation (`git status --porcelain` before and after) was ok in every run.

Run 1, deploy mutants (temporary worktree of `53729a5`), printed table:

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| C1 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-03 AC2/3: plan deploys when live differs (flipped) | killed |
| C2 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-04 AC8: tag not removed when the tag URL health fails | killed |
| C3 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-04 AC9: a failed regression is ignored and traffic switches | killed |
| C4 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-04 AC11: way back targets the candidate instead of the previous revision | killed |
| C5 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-03 AC1 / RUN-04 AC8: /health waits 1 s instead of 90 s | survived |
| C6 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-04 AC6: a 50 % split counts as the serving revision | killed |
| C7 | `deploy/cloudrun/cloudRunRelease.mjs` | RUN-04 AC9: REGRESSION_COMMIT is the full commit, not the 7 | killed |
| W1 | `.github/workflows/deploy.yml` | RUN-05 AC23: the game job no longer publishes the Worker | survived |
| W2 | `.github/workflows/deploy.yml` | RUN-05 AC16: a running deploy is cancelled halfway | killed |
| W3 | `.github/workflows/deploy.yml` | RUN-05 AC18: the revision takes traffic before the checks | killed |
| D1 | `deploy/db/copyToSupabase.mjs` | SUPA-07 AC7: a public schema with 1 table passes as empty | survived |
| D2 | `deploy/db/copyToSupabase.mjs` | SUPA-07 AC6: Postgres 16 refused (boundary) | survived |
| D3 | `deploy/db/copyToSupabase.mjs` | SUPA-08 AC8/12: restore not in one transaction | killed |
| D4 | `deploy/db/copyToSupabase.mjs` | SUPA-08 AC8: copy skips the verify | killed |
| D5 | `deploy/db/copyToSupabase.mjs` | SUPA-09 AC17: verify refuses running slots / non-empty Supabase | killed |
| D6 | `deploy/db/pgTools.mjs` | SUPA-06 AC4: the password goes on the docker command line | killed |
| D7 | `deploy/db/pgTools.mjs` | SUPA-08 AC8: restore list keeps COMMENT - SCHEMA public | killed |
| D8 | `deploy/db/snapshot.mjs` | SUPA-09 AC15: a Flyway difference does not fail the verify | killed |

**Result**: 18 mutants, 14 killed, 4 survived, 0 invalid; isolation ok

Run 2, backend and game mutants (main checkout):

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| B1 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/HealthController.kt` | RUN-01 AC1/2: UP and DOWN swapped | killed |
| B2 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/security/SecurityConfig.kt` | RUN-01 AC1: /health no longer public | killed |
| B3 | `backend/src/main/resources/application.yaml` | SUPA-01 AC1: pool of 10 | killed |
| B4 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/JdbcDatabaseHealth.kt` | RUN-01 AC2: unreachable database reported as reachable | killed |
| G1 | `game/src/adapters/phaser/MainMenu.js` | RUN-06 AC2/3: notice after 1 s | killed |
| G2 | `game/src/adapters/phaser/MainMenu.js` | RUN-06 AC6: restore runs after the scene was left | killed |
| G3 | `game/src/adapters/phaser/MainMenu.js` | RUN-06 AC1: no wake-up call | killed |
| G4 | `game/src/adapters/phaser/MainMenu.js` | RUN-06 AC3: notice with the error style | killed |
| G5 | `game/src/adapters/http/healthApi.js` | RUN-06 AC1: wake sends the token | killed |
| G6 | `game/src/adapters/http/healthApi.js` | RUN-06 AC8: wake resolves true on error | killed |
| G7 | `game/public/style.css` | 3d92e79 fix: phone notice back to about 6 px | killed |

**Result**: 15 mutants, 15 killed, 0 survived, 0 invalid; isolation ok. G1 to G7 come from the first app run (`11 mutants`, isolation ok), where the Vitest and Playwright commands were valid. B1 to B4 come from their rerun (`4 mutants, 4 killed`, isolation ok).

Control: every kill command was run once on the unmutated tree and passed. That covers the four `.\gradlew.bat test --tests "*<Class>"` commands (`BUILD SUCCESSFUL`), both Vitest files (status 0), `npx playwright test e2e/wake.spec.js --workers=1` (status 0) and the deploy test files (green in the full suite). The first B1 to B4 run is **discarded**. It called `gradlew.bat` without `.\`, which `cmd` on this machine cannot find in the current directory. The control gave the same exit 1 on the clean tree, so its "killed" lines proved nothing. B1 to B4 were rerun with `.\gradlew.bat`, and the table above shows that rerun.

**Total: 29 mutants, 25 killed, 4 survived (C5, W1, D1, D2)**. Result: ❌ FAIL (surviving mutants become fix tasks).

---

## Edge Cases

- [x] `copy` again after a successful copy stops on "public já tem <n> tabelas" (`copyToSupabase.test.mjs:204`). Mutant D1 shows that n = 1 is untested.
- [x] A `pg_restore` that fails midway leaves `public` empty: `--single-transaction --exit-on-error` (`copyToSupabase.test.mjs:354`, mutant D3 killed) and the message (`:402`).
- [x] A revision that fails the startup probe: `deploy-cloudrun` fails and `release` never runs. This follows from the step order (`workflow.test.mjs:66`) and the default stop-on-failure behavior. The real behavior is M9 and M4.
- [⏭️] A deploy before the `spring-datasource-*` secrets exist is refused by Cloud Run. This is cloud behavior (M11).
- [x] Two pushes during a run: `concurrency` `production`, `cancel-in-progress: false` (`workflow.test.mjs:36`). `plan` reads the newest backend commit (`cloudRunRelease.test.mjs:96`).
- [x] A backend commit after the prebuild: the tag is the newest commit (`workflow.test.mjs:153`), and a missing tag means `prebuilt=false` (`cloudRunRelease.test.mjs:302`).
- [x] build-only or rehearsal again for the same commit: `prebuilt=true` skips everything (`cloudRunRelease.test.mjs:290`, `workflow.test.mjs:58`).
- [x] A game-only push: `deploy=false` (`cloudRunRelease.test.mjs:110`), and `game` needs only `result == 'success'` (`workflow.test.mjs:163`). Whether the job actually publishes is the W1 gap.
- [x] Backend and game in one push: `game` has `needs: backend` (`workflow.test.mjs:165`).
- [x] The sample image answers HTML, so `live=none` (`cloudRunRelease.test.mjs:137`).
- [x] Health fails at once: the server-down message shows with no 60 s wait (e2e `wake.spec.js:57-69`, under 15 s).
- [x] Supabase down while the service runs: `/health` answers 503 (`HealthControllerTest.kt:24`, `JdbcDatabaseHealthTest.kt:136`). The liveness restart is cloud behavior (M3, M6).

---

## Gate Check

| Suite | Command (run now, foreground, one at a time) | Result |
| --- | --- | --- |
| Deploy | `node --test --test-reporter=tap "deploy/**/*.test.mjs"` | `# tests 280`, `# pass 278`, `# fail 2`. The only `not ok` lines are 263 `the CLI exits 0 when every check passes` and 265 `the CLI exits 1 when a check fails` (`deploy/regression.test.mjs`, the known child exit 3221226505). As expected. |
| Backend | `cd backend && ./gradlew ktlintCheck test --rerun` (Docker up; `--rerun` because the first call reported `:test UP-TO-DATE`) | BUILD SUCCESSFUL in 1m 54s. ktlint is clean. **949 tests, 0 failures, 0 errors, 0 skipped** (90 result files in `build/test-results/test`). |
| Game unit | `cd game && npm test` | **73 files, 1599 tests passed**, 0 failed (78.3 s). |
| e2e | `cd game && npx playwright test --workers=2` | **314 tests: 311 passed, 3 failed** (56.0 min). None of the 3 is in a file this feature touched (`git diff 0adb119..origin/main` does not change `dragEquip.spec.js` or `uiRedesign.spec.js`). Under the tasks.md flake rule, each was rerun alone twice with `--workers=1`, and each passed both times, so all 3 count as load flakes: `dragEquip.spec.js:586` (edge scroll top, `scrollTop` 28 instead of 0; reruns 19.1 s and 24.5 s), `dragEquip.spec.js:640` (edge scroll bottom, 272 instead of at least 275; reruns 20.9 s and 21.4 s), `uiRedesign.spec.js:1231` (focus back on `auto-click-toggle`; reruns 15.0 s and 14.6 s). The feature's own `wake.spec.js` passed 5 of 5 in the full run (tests 310 to 314). |

- **Test count delta of the feature** (tests added in the range; none were removed or weakened): deploy +162 (from 118 before T1 to 280), backend +16 `@Test`, game unit +12 `it(`, e2e +5 (`wake.spec.js`). `SecurityIT` only gained tests. The `composition.test.js` key list gained `backend`.
- **Skipped tests**: none.

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | ✅ Modules are small and single-purpose (`pgTools`, `snapshot`, `copyToSupabase`, `cloudRunRelease`). The health port and adapter follow the existing hexagonal layout. |
| Surgical changes | ✅ `backend/Dockerfile` is untouched. `SecurityConfig` gains one line. `MainMenu` gains one awaited call and a timer. |
| No scope creep | ✅ Nothing outside the spec. `loadDatabaseEnv` stays without a caller, as the spec allows. |
| Matches patterns | ✅ `run.mjs` exec injection and `node:test` fakes, like the watcher modules. Vitest scene stand-ins. Testcontainers `IntegrationTestBase`. |
| Spec-anchored outcome check | ❌ 4 surviving mutants (above). |
| Per-layer coverage expectation | ⚠️ Deploy modules: every message and every guard has a test except the boundaries in D1 and D2. Workflow: the game job's command (W1) is not checked. |
| Every test maps to a requirement | ✅ Each new test names a spec AC, an edge case or a Done-when line. |
| Documented guidelines followed | ✅ `CLAUDE.md`, `.claude/agents/test-engineer.md`, the tasks.md Test Coverage Matrix |

Observations (not gaps, for `product-owner` to triage):

1. `deploy/db/copyToSupabase.mjs:91` reads a failed `select count(*)` as `Number('') = 0`, so a failed table count counts as an empty schema. The single-transaction restore would still fail on any conflict, so no data is at risk. But `check` could print `Pronto para copiar` on a query that failed.
2. `3d92e79` sets `.auth-message { font-size: 30px }` under `max-width: 640px` for every start-screen message, not only the wake notice. The phone screenshots show the notice and the empty message. The longer error lines (`Cannot reach the server. Try again later.`, the login errors) at 30 px on the phone were not captured.
3. `backend/readme.md` ("Way back") and ADR 0012 already name `./publish.sh --way-back`, which only arrives in T22. Until T22 the way back is a plain `./publish.sh` (spec Assumptions, "Voltar atrás").
4. Secrets scan: no password, token, `JWT_SECRET`, tunnel host, real `run.app` URL or project number is committed (`git grep` over `origin/main`). The only tracked `.env` files are the 5 allowed ones, and `.env` was not read. The project ref `jnqlrdnwwqslihncszej` appears outside `spec.md` in `deploy/lib/databaseEnv.mjs:5,112`, its tests, `deploy/db/*.test.mjs`, `.env.example:11`, `backend/readme.md:19`, ADR 0012 `:21`, `design.md`, `tasks.md` and `.specs/STATE.md`. That is by design: SUPA-02 AC 15 makes the ref part of an exact message. It is an identifier, not a credential. The real pooler host `aws-1-sa-east-1.pooler.supabase.com` appears only in `spec.md` and `design.md:194`. The spec says "O host fica fora do repositório" ("the host stays out of the repository") while naming it itself. The host is a shared regional pooler name, not a secret, but the owner may want `design.md:194` turned into `aws-<N>-<region>`.

---

## Fix Plans

All four are test-only fixes for **`test-engineer`**. No production code changes.

### Fix 1 (C5, RUN-03 AC 1 / RUN-04 AC 8): the 90 s health timeout reaches the request
- **Root cause**: `cloudRunRelease.test.mjs:153-162` asserts the exported constant and `signal instanceof AbortSignal`, never the timeout carried by the signal the call site builds.
- **Fix task**: in `deploy/cloudrun/cloudRunRelease.test.mjs`, add one test that replaces `AbortSignal.timeout` with a spy (`t.mock.method(AbortSignal, 'timeout')`), runs `plan` and `release`, and asserts that every call received `90000`.
- **Done when**: mutant C5 (`AbortSignal.timeout(HEALTH_TIMEOUT_MS)` changed to `AbortSignal.timeout(1000)`) is killed.
- **Priority**: Major. A shorter wait would deploy a candidate on a cold start, or send traffic back.

### Fix 2 (W1, RUN-05 AC 23): the game job publishes the Worker
- **Fix task**: in `deploy/cloudrun/workflow.test.mjs`, assert that the `game` slice includes `        run: npm run deploy` with `working-directory: game`, and that the publish step's env has `CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}` and `CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`.
- **Done when**: mutant W1 (`run: npm run deploy` changed to `run: echo no publish`) is killed.
- **Priority**: Major. Without it the cutover would leave the Worker pointing at the tunnel.

### Fix 3 (D1, SUPA-07 AC 7): a single table makes `public` non-empty
- **Fix task**: in `deploy/db/copyToSupabase.test.mjs`, add `check refuses a Supabase public schema with one table`: `machine({ publicTables: '1' })` expects exit 1 and exactly `['ERRO: o schema public do Supabase já tem 1 tabelas; a cópia só roda num banco vazio']`.
- **Done when**: mutant D1 (`tables > 0` changed to `tables > 1`) is killed.
- **Priority**: Major (data integrity: copying into a non-empty schema).

### Fix 4 (D2, SUPA-07 AC 6): Postgres 16 is accepted
- **Fix task**: in `deploy/db/copyToSupabase.test.mjs`, add `check accepts Supabase on Postgres 16`: `machine({ version: '160004' })` expects exit 0 and `'Supabase: Postgres 16, schema public vazio'`.
- **Done when**: mutant D2 (`major < 16` changed to `major <= 16`) is killed.
- **Priority**: Minor. Supabase runs 17 today, but this is the boundary the spec states.

### Optional (Low, SUPA-01 AC 3)
- An integration test with `@TestPropertySource(properties = ["SPRING_DATASOURCE_USERNAME=..."])` cannot prove environment binding while `@ServiceConnection` wins. Accept it as covered by Spring Boot and checked by M3 and M4, or record it as a spec-precision note. `product-owner` rules.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| SUPA-01 | Pending | ✅ Verified (AC 3 config only) |
| SUPA-02 | Implementing | ✅ Verified |
| SUPA-06 | Implementing | ✅ Verified |
| SUPA-07 | Pending | ❌ Needs Fix (D1, D2 test gaps) |
| SUPA-08 | Pending | ✅ Verified |
| SUPA-09 | Pending | ✅ Verified |
| SUPA-10 | Pending | ✅ Verified |
| SUPA-11 | Pending | ⏭️ Pending (T20, T21) |
| SUPA-12 | Pending | ✅ Verified |
| RUN-01 | Pending | ✅ Verified |
| RUN-02 | Pending | ✅ Verified (AC 6, 7 pending M11) |
| RUN-03 | Pending | ❌ Needs Fix (C5) |
| RUN-04 | Pending | ❌ Needs Fix (C5, AC 8 timeout) |
| RUN-05 | Pending | ❌ Needs Fix (W1) |
| RUN-06 | Pending | ✅ Verified |
| RUN-07 | Pending | ✅ Verified (AC 8, 9, 12 pending M11) |
| RUN-08 | Pending | ⏭️ Pending (T22) |
| RUN-09 | Pending | ✅ Verified (AC 2 to 5 pending M12, M13) |

The spec.md rows are not edited by the Verifier. `product-owner` or `gitops` moves them.

---

## Lessons Recorded

Candidates were added with `lessons.py add`. They are grounded in the surviving mutants:

- L-092 (C5): Assert the value a timeout reaches at its call site, not only the exported constant that names it.
- L-093 (W1): Assert the command each workflow job runs, not only its conditions, needs and environment.
- L-094 (D1, D2): Test a numeric threshold at the boundary value itself, not only with a value far past it.

`validate_state.py supabase-postgres` exits 1 ("verdict is FAIL"), as expected for this round.

---

## Summary

**Overall**: ❌ Not ready, round 1 of 3. Four test-only fixes are needed, then a round-2 re-verification scoped to them.

**Spec-anchored check**: 4 ACs have a surviving-mutant gap. SUPA-01 AC 3 is config-only. Every other in-scope AC matches the spec's outcome.
**Sensor**: 29 mutants, 25 killed, 4 survived (C5, W1, D1, D2)
**Gate**: deploy 278/280 (the 2 known failures), backend 949/949 with ktlint clean, game unit 1599/1599, e2e 311/314, with the 3 failures load flakes outside the feature (each passed 2 of 2 alone); `wake.spec.js` 5/5

**What works**: the env check, the copy tool (every failure path and the order), the `release` path with tag, health, regression, switch and way back, the workflow gates and the WIF-only sign-in, `/health` UP, DOWN and public, the pool of 5 and 1, the Testcontainers isolation, and the start-screen wake-up (unit and e2e, desktop and phone).

**Pending (not failures)**: M1 to M15 (T20, T21), RUN-08 (T22), and ui-review finding #2 (Low, follow-up).

**Next steps**: `test-engineer` writes Fixes 1 to 4, then the Verifier runs round 2. That round re-runs C5, W1, D1 and D2 plus 1 to 3 new mutants, the game unit suite and `wake.spec.js`. The full backend and e2e suites run only when that round is about to return PASS.
