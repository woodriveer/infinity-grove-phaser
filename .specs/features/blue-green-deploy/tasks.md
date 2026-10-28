# Blue-Green Deploy Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/blue-green-deploy/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `CLAUDE.md` (release report: unit and e2e coverage), `backend/build.gradle.kts` (JaCoCo), `game/vitest.config.js` (v8). The `deploy/` folder is new and has no runner yet: it uses Node's built-in `node --test` (no new dependency), with fakes for `exec` and `fetch` like the game's injected gateways.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Deploy modules (`deploy/lib/*.mjs`, `deploy/watcher.mjs`, `deploy/deploy.mjs`) | unit | Every branch; 1:1 to the spec ACs and edge cases they own; every log text asserted verbatim | `deploy/**/*.test.mjs` | `node --test "deploy/**/*.test.mjs"` |
| Regression suite (`deploy/regression.mjs`) | unit + live | Every check, the `FALHOU` and `Regressão OK` lines, cleanup on pass and on fail, exit codes; one run against the real local backend | `deploy/regression.test.mjs` | `node --test "deploy/**/*.test.mjs"` and `node deploy/regression.mjs http://localhost:<port>` |
| Container config (`backend/Dockerfile`, compose, nginx conf) | none (build gate) | The image builds from `git archive`, the stack comes up, the slot answers 401 | - | `docker build`, `docker compose --profile deploy config`, `curl` |
| Launchers (`publish.sh`, `deploy.sh`) | e2e (live, on the real stack) | The Independent Tests of US-1, US-3 and US-4 run on the real stack, with the output recorded in the task's commit body | - | `./publish.sh`, a pushed commit, `./deploy.sh --rollback` |
| Backend and game code | none | Not changed by this feature | - | - |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `node --test "deploy/**/*.test.mjs"` |
| Full | After tasks with live checks | `node --test "deploy/**/*.test.mjs"` plus the live command named in the task |
| Build | After a phase, or config-only tasks | `node --test "deploy/**/*.test.mjs"` and `docker compose -f backend/docker-compose.yml --profile deploy config -q` and `cd backend && ./gradlew ktlintCheck` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Containers

```
T1 → T2
```

### Phase 2: Deploy building blocks

```
T3 → T4 → T5 → T6 → T7
```

### Phase 3: Regression

```
T8 → T9
```

### Phase 4: Orchestration

```
T10 → T11 → T12 → T13 → T14
```

### Phase 5: Launch and docs

```
T15 → T16
```

---

## Task Breakdown

### T1: Backend image built from a commit tree

**What**: A multi-stage `backend/Dockerfile` (Gradle `bootJar` on JDK 25, run on JRE 25, port 8080) plus a `.dockerignore` for `build/` and `.gradle/`.
**Where**: `backend/Dockerfile`
**Depends on**: None
**Reuses**: The `backend/build.gradle.kts` toolchain (Java 25), `gradlew`
**Requirement**: BG-01

**Tools**:

- MCP: `context7` (Docker / Spring Boot container docs)
- Skill: NONE

**Done when**:

- [x] `git archive --format=tar HEAD:backend | docker build -t infinity-grove-backend:test -` succeeds with no file from the working tree
- [x] The image tags are pinned to versions pulled during the task
- [x] A container of the image on the compose network, with `SPRING_DATASOURCE_URL` and `JWT_SECRET` set, answers 401 on `/progress`

**Tests**: none
**Gate**: build

**Commit**: `build(backend): add a docker image built from a commit tree`

---

### T2: Deploy services in the compose file

**What**: The `deploy` profile with `backend-blue`, `backend-green`, `proxy` and `dozzle` as in the design, plus `deploy/nginx/` (`.gitkeep`, the generated `default.conf` gitignored) and `.deploy-state` / `.deploy.lock` in the root `.gitignore`.
**Where**: `backend/docker-compose.yml`
**Depends on**: T1
**Reuses**: The existing `postgres` service and its volume
**Requirement**: BG-02, BG-13

**Tools**:

- MCP: `context7` (Dozzle, nginx, Compose profiles)
- Skill: NONE

**Done when**:

- [x] `docker compose --profile deploy config -q` passes, and `start.sh` still starts only postgres and pgadmin
- [x] With a hand-written conf, `up -d --wait postgres dozzle backend-blue proxy` makes `localhost:8080/progress` answer 401
- [x] `http://127.0.0.1:8888` shows the `infinity-grove-*` containers; ports 8888, 18081 and 18082 are bound to `127.0.0.1` only (`docker ps` output in the commit body)

**Tests**: none
**Gate**: build

**Commit**: `build: add the blue-green slots, the proxy and dozzle to the compose file`

---

### T3: Command runner

**What**: `run(command, args, { cwd, env, input })` returning `{ status, stdout, stderr }`.
**Where**: `deploy/lib/run.mjs`
**Depends on**: None
**Reuses**: The `spawnSync` use in `game/scripts/deploy.mjs`
**Requirement**: BG-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: status and stdout of `node -e`, a non-zero status, `input` piped to stdin, `env` merged over `process.env`
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): add the command runner`

---

### T4: Deploy state and lock

**What**: `readState`, `writeState`, `acquireLock`, `releaseLock`, `clearStaleLock`.
**Where**: `deploy/lib/state.mjs`
**Depends on**: T3
**Reuses**: None
**Requirement**: BG-05, BG-09, BG-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: a missing file reads `null`, a round trip keeps every field of the data model, a second `acquireLock` is refused until `releaseLock`, `clearStaleLock` frees it
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): keep the deploy state and lock`

---

### T5: What a commit range changes

**What**: `classify(files)` and `changedFiles(exec, from, to)`.
**Where**: `deploy/lib/changes.mjs`
**Depends on**: T4
**Reuses**: The game paths of `publish.sh` `game_fingerprint`
**Requirement**: BG-09, BG-10

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: `backend/src/...` is backend only; `game/src/a.js` and `game/wrangler.jsonc` are game; `game/src/a.test.js`, `game/e2e/x.js` and `README.md` are neither; a mixed list is both; `changedFiles` calls `git diff --name-only <from> <to>`
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): classify the files a commit range changes`

---

### T6: Proxy switch

**What**: `renderConf(slot)`, `writeConf(dir, slot)`, `switchTo(exec, dir, slot)`.
**Where**: `deploy/lib/proxy.mjs`
**Depends on**: T5
**Reuses**: None
**Requirement**: BG-03

**Tools**:

- MCP: `context7` (nginx upstream and reload)
- Skill: NONE

**Done when**:

- [x] Tests: the conf names only `backend-<slot>:8080`; `switchTo` runs `nginx -t` before `nginx -s reload`; a failed `nginx -t` writes the old conf back and returns false without a reload
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): point the proxy at a slot`

---

### T7: Slot lifecycle

**What**: `SLOTS`, `otherSlot`, `imageOf`, `buildImage`, `startSlot`, `stopSlot`, `removeSlot`, `slotExists`, `removeImage`, `waitReady`.
**Where**: `deploy/lib/slots.mjs`
**Depends on**: T6
**Reuses**: `run.mjs`
**Requirement**: BG-01, BG-02, BG-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: `buildImage` pipes the `git archive --format=tar <hash>:backend` output into `docker build -t infinity-grove-backend:<hash> -`; `startSlot` sets `<SLOT>_IMAGE` and recreates only that service; `waitReady` is true on the first 401, keeps polling on a refused connection and on 5xx, and is false at 180 s (fake clock)
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): build, start, wait for and remove a backend slot`

---

### T8: API regression suite

**What**: `runSuite(baseUrl, deps)` with the 12 checks of the design, cleanup in `finally`, and the CLI.
**Where**: `deploy/regression.mjs`
**Depends on**: None (runs after the previous phase)
**Reuses**: The API contract of the controllers
**Requirement**: BG-06, BG-07

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd` (read only, for the contracts)

**Done when**:

- [x] Tests on a fake `fetch`: the happy path prints `Regressão OK: 12 verificações em <s> s` and deletes the user; a wrong status in each of `reset bloqueado`, `reset` and `auto clique após reset` prints `FALHOU: <check>: <expected> / <received>`, stops there and still deletes the user; a failed delete fails the run; the CLI exits 0/1
- [x] Live: `node deploy/regression.mjs http://localhost:8080` against `start.sh` exits 0, and `GET /users` shows no `regression-` user afterwards (output in the commit body)
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: full

**Commit**: `test(deploy): add the api regression suite`

---

### T9: Run the suite of a commit in a container

**What**: `runRegression(exec, root, hash, slot)`.
**Where**: `deploy/lib/regressionRun.mjs`
**Depends on**: T8
**Reuses**: `run.mjs`
**Requirement**: BG-06, BG-13

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: the suite comes from `git show <hash>:deploy/regression.mjs` and falls back to the working tree file when the commit has none; the `docker run` names `infinity-grove-regression-<short hash>`, uses `--network backend_default` and targets `http://backend-<slot>:8080`; a non-zero status returns false
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): run the regression suite of a commit in a container`

---

### T10: Blue-green deploy of one commit

**What**: `deployBackend(deps)` as in steps 1 to 6 of the design.
**Where**: `deploy/lib/backendDeploy.mjs`
**Depends on**: None (runs after the previous phase)
**Reuses**: `slots.mjs`, `proxy.mjs`, `regressionRun.mjs`
**Requirement**: BG-01, BG-02, BG-03, BG-04, BG-05, BG-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests with fakes: success switches to the idle slot, logs `Deploy <h> ativo no slot <slot>`, waits 10 s, stops the old slot, and sets `active`, `previous` (with `stoppedAt`) and `handled`; a build failure, a readiness timeout, a failed suite and a failed switch each log their exact text, remove the new slot (except the build failure, where no slot exists), never stop the active one, and set only `handled`
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): deploy a commit to the idle slot and switch when the suite passes`

---

### T11: Sweep and rollback of the previous slot

**What**: `sweepPrevious(deps)` and `rollback(deps)`.
**Where**: `deploy/lib/previous.mjs`
**Depends on**: T10
**Reuses**: `slots.mjs`, `proxy.mjs`
**Requirement**: BG-04, BG-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: the sweep keeps a previous slot stopped 4 min 59 s ago and removes the container and its image at 5 min; a rollback starts the previous container, waits for 401, switches, stops the other slot, logs `Rollback para <h> no slot <slot>` and keeps `handled`; with no previous container it returns false with `Sem versão anterior para voltar (removida após 5 min)`
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): remove the previous slot after 5 minutes and roll back to it`

---

### T12: Worker of a commit

**What**: `publishWorker(deps)`.
**Where**: `deploy/lib/workerPublish.mjs`
**Depends on**: T11
**Reuses**: `game/scripts/deploy.mjs` through `npm run deploy`
**Requirement**: BG-10, BG-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tests: it extracts `git archive <hash> game` into a temp dir, runs `npm ci` then `npm run deploy` there with `BACKEND_URL=<tunnel>`, removes the dir on success and on failure, and logs `Publicação do Worker <h> falhou` on a non-zero status
- [x] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): publish the worker built from a commit tree`

---

### T13: Watcher

**What**: `tick(deps)` and the 60 s loop CLI.
**Where**: `deploy/watcher.mjs`
**Depends on**: T12
**Reuses**: Every module of Phase 2 to 4
**Requirement**: BG-09, BG-10, BG-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests: Docker down and fetch failure log their exact text and change nothing; the same target does nothing but sweep; a README-only range sets `handled` with no build; a backend range deploys; a game range publishes the Worker; a mixed range publishes only after a passed deploy; a taken lock skips the tick; two commits since `handled` deploy only the newest; the lock is released on every path
- [ ] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): watch origin/main and deploy each new commit`

---

### T14: Manual rollback entry

**What**: `deploy/deploy.mjs` (`--rollback` under the lock), and `deploy.sh` that runs it.
**Where**: `deploy/deploy.mjs`
**Depends on**: T13
**Reuses**: `previous.mjs`, `state.mjs`
**Requirement**: BG-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Tests: `--rollback` saves the new state and exits 0; with no previous slot it exits 1; with the lock taken it exits 1 with `Um deploy está em andamento; tente de novo em instantes`; an unknown flag prints the usage and exits 1
- [ ] Gate check passes: `node --test "deploy/**/*.test.mjs"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(deploy): add the manual rollback command`

---

### T15: `publish.sh` on the blue-green stack

**What**: The rewrite of the design: compose stack, tunnel, Worker of the handled commit, watcher; `.publish-state` removed.
**Where**: `publish.sh`
**Depends on**: None (runs after the previous phase)
**Reuses**: `tunnel_alive`, `listening`, the cloudflared parsing of the current script
**Requirement**: BG-05, BG-09, BG-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Live, recorded in the commit body: the first run with no state builds `origin/main` into `blue` and publishes the Worker; a backend commit pushed afterwards goes live while a 100 ms `/progress` poller sees no failure, and the tunnel address does not change; a README-only commit builds nothing; a commit whose `/account/reset` answers 500 (local throwaway branch fast-forwarded and reverted) is refused with the old slot serving; `./deploy.sh --rollback` within 5 min brings the old commit back; the old container is gone after 5 min
- [ ] Gate check passes: `node --test "deploy/**/*.test.mjs"` (live checks above)

**Tests**: e2e
**Gate**: full

**Commit**: `build: run publish on the blue-green stack with the deploy watcher`

---

### T16: Docs and project decision

**What**: The CLAUDE.md Deploy section (watcher, commit tree only, `deploy.sh --rollback`, Dozzle at `localhost:8888`, `node --test "deploy/**/*.test.mjs"` in the coverage line), the `game/readme.md` deploy notes, and AD-016 in `.specs/STATE.md`.
**Where**: `CLAUDE.md`
**Depends on**: T15
**Reuses**: None
**Requirement**: BG-05, BG-11

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] CLAUDE.md no longer mentions `.publish-state`; AD-016 states the expand/contract rule
- [ ] `python <skill-dir>/scripts/validate_state.py` passes on the existing features

**Tests**: none
**Gate**: build

**Commit**: `docs: describe the blue-green deploy and the migration rule`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 → T2
Phase 2:  T3 → T4 → T5 → T6 → T7
Phase 3:  T8 → T9
Phase 4:  T10 → T11 → T12 → T13 → T14
Phase 5:  T15 → T16
```

Batches (~7 tasks, whole phases): A = Phase 1 + 2 (T1 to T7), B = Phase 3 + 4 (T8 to T14), C = Phase 5 (T15, T16).
