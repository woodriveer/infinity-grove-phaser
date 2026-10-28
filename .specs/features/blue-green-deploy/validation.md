# Blue-Green Deploy Validation

**Date**: 2026-10-28
**Spec**: `.specs/features/blue-green-deploy/spec.md`
**Diff range**: `0ee314b..dc803b2` (25 commits: d73282c docs, ca7bf41 T1, 08dd35f T2, 6a8e858 T3, 68973d1 T4, c9de3b6 T5, 01c0421 T6, 4f0bd9e T7, 2e29bc3 docs, 4585351 T8, 90e5b82 T9, 0622f68 T10, 4905672 T11, 60393e6 T12, 1c3fd10 T13, 1179abe T14, 1b119fd fix, 4ca7feb chore, 837ca2d fix, 05e98aa fix, 439c76a / 4ea7667 / 32b6928 live gate commits, d05c174 T15, dc803b2 T16)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: FAIL

The implementation does what the spec asks, and the live runs recorded in `d05c174` show it working: no failed request in 7548 polls, the tunnel unchanged, the broken commit refused, the rollback, and the slot gone after 5 minutes. The verdict is FAIL because the discrimination sensor found **4 surviving mutants in 2 behaviors** (readiness accepts any status, and two content checks of the regression suite never fail in a test). validate.md says a feature with surviving mutants is not done. Both fixes only add tests; no production code has to change. Two smaller evidence gaps and three spec-precision gaps are listed below. They do not block.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 backend image | ✅ Done | ca7bf41 |
| T2 compose deploy profile | ✅ Done | 08dd35f (docker ps in the body) |
| T3 command runner | ✅ Done | 6a8e858 |
| T4 state and lock | ✅ Done | 68973d1 |
| T5 classify changes | ✅ Done | c9de3b6 |
| T6 proxy switch | ✅ Done | 01c0421, keep-alive fix 05e98aa |
| T7 slot lifecycle | ✅ Done | 4f0bd9e, hang fix 837ca2d |
| T8 regression suite | ✅ Done | 4585351 (live run in the body) |
| T9 suite in a container | ✅ Done | 90e5b82 |
| T10 blue-green deploy | ✅ Done | 0622f68 |
| T11 sweep and rollback | ✅ Done | 4905672 |
| T12 Worker of a commit | ✅ Done | 60393e6, npm install fix 1b119fd |
| T13 watcher | ✅ Done | 1c3fd10 |
| T14 rollback entry | ✅ Done | 1179abe |
| T15 publish.sh | ✅ Done | d05c174 (live run in the body) |
| T16 docs, AD-016 | ✅ Done | dc803b2 |

---

## Spec-Anchored Acceptance Criteria

Paths are relative to `deploy/`. Line numbers are at `dc803b2`. "Live" means the evidence recorded in the commit body named (the author's run on the real stack). It is accepted as recorded evidence and is not a unit test.

### P1: Deploy a new backend with no downtime

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | New backend commit → image from the commit tree | `infinity-grove-backend:<short hash>` from `git archive <hash>:backend` | `lib/slots.test.mjs:32` - `imageOf(HASH) == 'infinity-grove-backend:0123456'`; `:43` - git args `['archive','--format=tar',`${HASH}:backend`]`; `:47-48` - `docker build -t infinity-grove-backend:0123456 -` with `input == tar`; `lib/backendDeploy.test.mjs:75-76` | ✅ PASS |
| 2 | Start in the idle slot, wait for 401 on `/progress`, at most 180 s | idle slot recreated, first 401 is ready, false at 180 s | `lib/backendDeploy.test.mjs:77-78` - compose `up ... backend-green` then `fetch http://127.0.0.1:18082/progress`; `lib/slots.test.mjs:73-77` - `GREEN_IMAGE`, only `backend-green`; `:149-150` - true on the first 401 after a 503; `:182-183` - false at `180000`; `:191-192` - a 401 at 178 s still counts | ⚠️ PASS on the asserted path, but **mutants M1/M1b survived**: no test shows that a 200, 403 or 404 keeps polling, so "ready only on 401" is not pinned |
| 3 | Not ready in 180 s → remove the new slot, proxy kept, log | `Deploy <hash> falhou: o backend não ficou pronto em 180 s` | `lib/backendDeploy.test.mjs:118` (text verbatim) via `:145` - `lines == [failure.line]`; `:147` no `docker stop`; `:148` no reload; `:149` conf still `renderConf('blue')`; `:150-153` - `rm -sf backend-green`; `:164` - gives up at exactly `180000` | ✅ PASS |
| 4 | Suite against the slot's internal address, never the proxy | `http://backend-<slot>:8080` | `lib/backendDeploy.test.mjs:86` - `docker run ... http://backend-green:8080$`; `lib/regressionRun.test.mjs:60-68` - full args incl. `--network backend_default`; `:86` blue; `lib/backendDeploy.test.mjs:174` - a failed suite runs no proxy command (M14 killed) | ✅ PASS |
| 5 | Suite passes → `nginx -s reload` onto the new slot, log | `Deploy <hash> ativo no slot <slot>` | `lib/backendDeploy.test.mjs:73` - `['Deploy bbbbbbb ativo no slot green']`; `:81-82` - `nginx -t` then `nginx -s reload`; `:87` - conf `renderConf('green')`; `:103` - blue from green; `lib/proxy.test.mjs:53-64` | ✅ PASS |
| 6 | No request refused or reset during the switch | 0 failed requests | Config: `lib/proxy.test.mjs:41-44` - `keepalive_timeout 0;` (the fix for the one reset seen live, 05e98aa). Live (d05c174): poller 1807/1807, 3345/3345, 4113/4113, 4409/4409, 7548/7548 answered 401 | ✅ PASS (live only; a unit test cannot prove it) |
| 7 | Stop the old slot, keep it 5 min, then remove it | stop after the switch; removed at 5 min | `lib/backendDeploy.test.mjs:83-84` - `sleep 10000` then `docker stop infinity-grove-backend-blue`; `:90` - `stoppedAt` recorded; `lib/previous.test.mjs:64-65` - kept at 4 min 59 s; `:72-76` - `rm -sf backend-blue` + `image rm` at 5 min; live (d05c174) 09:14:42 green gone | ✅ PASS (M4, M4b, M13, M17 killed) |
| 8 | State after any outcome | active, previous, handled (and tunnel) | `lib/backendDeploy.test.mjs:88-93` - full state on success; `:146` - `{ ...STATE, handled: NEW }` on each failure; `watcher.test.mjs:162-167`, `:152`, `:177`, `:196` - state saved on every path; `lib/state.test.mjs:20-33` round trip (M19 killed) | ✅ PASS |
| 9 | Tunnel and Worker unchanged by a backend deploy | same tunnel, no Worker publish | `lib/backendDeploy.test.mjs:92` - `tunnel` unchanged; `watcher.test.mjs:161` - a backend range runs `deploy` only, no `publish`; live (d05c174) tunnel `separately-cultural-progress-cottage` before and after | ✅ PASS |

### P1: Regression suite against the new backend

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Base URL as only argument; exit 0 / 1 | 0 all pass, 1 otherwise | `regression.test.mjs:352-353` - code `0` + OK line; `:371-372` - code `1` + FALHOU line (M18 killed) | ⚠️ PASS; the no-argument branch (`regression.mjs:181-185`) has no test (coverage shows 183-185 uncovered) |
| 2 | Checks in order (register 201 + token … auto click resets 1, crystals 2) | the 12 checks with their values | `regression.test.mjs:150-164` - exact request order; `:148` - `checks == 12`; `:182` - `FIRE`; value checks that fail in a test: `reset bloqueado` `:205`, `reset` `:213`, `:283`, `auto clique após reset` `:221`, `:292`, `capítulo 1` `:302` | ❌ GAP: **mutants M11 and M12 survived**. The `progresso inicial` (chapter 1 stage 1) and `auto clique inicial` (level 0, resets 0) value checks can be removed and every test passes. `cadastro` without `accessToken` and the status checks of `/wallet`, `/talents`, `/heroes`, `/equipment` also have no failing test (only the happy path order) |
| 3 | A failed check prints the line and stops | `FALHOU: <check>: <expected> / <received>` | `regression.test.mjs:205` - `'FALHOU: reset bloqueado: 409 RESET_LOCKED / 500 INTERNAL'`; `:213` - `'FALHOU: reset: 200 / 500'`; `:221`; `:267` - `checks` stops at 8/10/11; `:302` (M20 killed) | ✅ PASS (⚠️ spec-precision: the `<expected>`/`<received>` wording, e.g. `reward 2 e capítulo 1`, is chosen by the author; the spec defines only the frame) |
| 4 | Delete every created user, pass or fail | `DELETE /users/{username}`, none left | `regression.test.mjs:163,165` - DELETE last, `users.size == 0`; `:269-270` on each failure; `:284`, `:304`; `:314` - failed delete prints `FALHOU: limpeza: 204 / 500` and fails (M7 killed); live (4585351, d05c174) 0 `regression-` users | ✅ PASS |
| 5 | All pass → summary | `Regressão OK: <n> verificações em <s> s` | `regression.test.mjs:149` - `'Regressão OK: 12 verificações em 4.2 s'`; `:353` CLI regex | ✅ PASS |
| 6 | Suite fails → remove the new slot, proxy kept, log | `Deploy <hash> falhou na regressão; o slot <slot> continua ativo` | `lib/backendDeploy.test.mjs:124` (verbatim) via `:145-153`; `:174`; live (d05c174) `Deploy 4ea7667 falhou na regressão; o slot blue continua ativo` | ✅ PASS (M3 killed) |

### P1: Watcher on `main`

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | `git fetch origin main` every 60 s | 60 s loop | `watcher.mjs:12` `POLL_MS = 60000` and the loop at `watcher.mjs:131-143` are not covered by a test (coverage: 111-144 uncovered). Live (d05c174): pushed commits were picked up | ⚠️ Live only |
| 2 | New target ≠ handled → deploy it | deploy of the target | `watcher.test.mjs:161` - `deploy ${TARGET} lock=true`; `:127-129` - same target only sweeps, no `git diff` (M5 killed) | ✅ PASS |
| 3 | Neither backend nor game → handled only | handled moved, nothing built | `watcher.test.mjs:151-152` - only `sweep`, state `{ ...STATE, handled: TARGET }`; `lib/changes.test.mjs:36-41` (M9 killed); live (d05c174) deploy/-only commits | ✅ PASS |
| 4 | Game paths → Worker of the commit tree through the tunnel, after a passed backend deploy only | publish after deploy, not after a failed one | `watcher.test.mjs:176` - `publish ${TARGET} ${TUNNEL}`; `:186` - deploy then publish; `:195` - no publish after a failed deploy (M6 killed); `lib/workerPublish.test.mjs:62` - `git archive ... ${HASH} game`; `:70` - `BACKEND_URL: TUNNEL` (M16 killed); `lib/changes.test.mjs:16-34` - every `publish.sh` game path | ✅ PASS |
| 5 | One deploy at a time | taken lock skips | `watcher.test.mjs:205-207` - nothing acted, lock left; `:161` - lock held during the deploy; `:237,247` - released on every path, also on a throw (M8 killed); `lib/state.test.mjs:45-55` | ✅ PASS |
| 6 | `git fetch` fails → log and keep running | `Não foi possível buscar origin/main; nova tentativa em 60 s` | `watcher.test.mjs:116-118` - text verbatim, no action, state unchanged. "Keeps running" rests on `tick` returning and on the untested `try/catch` loop at `watcher.mjs:131-143` | ✅ PASS (loop part live only) |
| 7 | Commit tree only | no modified or untracked file in the image or the Worker | `lib/slots.test.mjs:43` (`<hash>:backend`); `lib/workerPublish.test.mjs:62` (`git archive <hash> game` into a temp dir); `publish.sh:119` (`git archive "$COMMIT:backend"`). The suite falls back to the working tree copy only when the commit has none (`lib/regressionRun.test.mjs:71-78`, as designed; it reaches neither the image nor the Worker) | ✅ PASS |

### P2: Manual rollback

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Previous container exists → start, wait, switch, stop the other, log | `Rollback para <hash> no slot <slot>` | `lib/previous.test.mjs:96` - `['Rollback para aaaaaaa no slot blue']`; `:97-105` - inspect, start, fetch 18081, `nginx -t`, reload, sleep, stop green; `:106` conf blue; `deploy.test.mjs:68-77` exit 0 + saved state; live (d05c174) 09:08:37 | ✅ PASS |
| 2 | No previous container → exit 1 | `Sem versão anterior para voltar (removida após 5 min)` | `deploy.test.mjs:83-84` - exit `1`, text verbatim; `lib/previous.test.mjs:122,135` | ✅ PASS |
| 3 | Rolled-back-from commit not redeployed | `handled` kept | `lib/previous.test.mjs:110` - `handled: NEW`; `deploy.test.mjs:73`; `watcher.test.mjs:127` - target == handled only sweeps (M10, M5 killed) | ✅ PASS |

The rollback failure texts (`Rollback para <h> falhou: ...`, `... falhou na troca do proxy; ...`, `lib/previous.test.mjs:147,162`) are not in the spec. They are marked `// SPEC_DEVIATION` at `lib/previous.mjs:38` ⚠️.

### P2: Live logs in Dozzle

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Dozzle at `localhost:8888` with the live logs | every container | `backend/docker-compose.yml:76-87` (`DOZZLE_FILTER=name=infinity-grove`); live (08dd35f) the event stream listed every `infinity-grove-*` container | ✅ PASS (config + live) |
| 2 | `127.0.0.1` only, not through the tunnel or the proxy | bound to loopback | `backend/docker-compose.yml:84` - `"127.0.0.1:8888:8080"`; verifier `docker ps`: `infinity-grove-dozzle 127.0.0.1:8888->8080/tcp`; the proxy conf names only `backend-<slot>:8080` (`lib/proxy.test.mjs:34-35`) | ✅ PASS |
| 3 | Suite in `infinity-grove-regression-<hash>` | named container | `lib/regressionRun.test.mjs:62` - `'--name', 'infinity-grove-regression-0123456'` (short hash, per the design rule "logs keep the short hash") | ✅ PASS |

### Edge cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| No `.deploy-state` at start → origin/main handled, blue active, no deploy | `watcher.test.mjs:256-262`; `publish.sh:109-113` writes the same on the first run (live d05c174 "First run, no state") | ✅ |
| Docker down → `Docker indisponível; nova tentativa em 60 s` | `watcher.test.mjs:105-107` - text verbatim, only `docker info` ran, state unchanged | ✅ |
| Build fails → `Deploy <hash> falhou no build da imagem`, nothing changed | `lib/backendDeploy.test.mjs:112-113` via `:145-153` - no `rm -sf`, no stop, no reload; `lib/slots.test.mjs:51-64` | ✅ |
| Two commits between polls → only the newest | `watcher.test.mjs:216-218` - one `git diff HANDLED TARGET`, one deploy, the middle commit never named | ✅ |
| Restart during a deploy → next `publish.sh` starts the recorded slot and removes a stale lock | Code only: `publish.sh:100` (`rm -f .deploy.lock`), `:105-108`, `:125`. No test, and no live record of this case in any commit body. `lib/state.mjs:48` `clearStaleLock` is tested (`lib/state.test.mjs:57-64`) but nothing calls it | ⚠️ No evidence (code review only) |

**Status**: ❌ One AC gap (US-2 AC 2, surviving mutants M11/M12). One AC passes on the asserted path but has surviving mutants (US-1 AC 2, M1/M1b). Two criteria have live evidence only (US-1 AC 6, US-3 AC 1). One edge case has no evidence (restart). Three spec-precision notes: FALHOU expected/received wording, rollback failure texts, short hash in names.

---

## Discrimination Sensor

The sensor ran in a scratch worktree (`git worktree add <scratchpad>/vwt HEAD`, at `dc803b2`). A script applied each mutant with an exact-match replacement that had to match once, ran `node --test "deploy/**/*.test.mjs"` in the worktree, and reverted with `git checkout -- <file>`. The worktree files have CRLF endings, so multi-line anchors were converted before matching. Baseline in the worktree with no mutant: exit 0, 104 pass. After the run the worktree `git status --porcelain` was empty. The worktree was then removed with `git worktree remove --force`.

| # | File:line | Mutation | Killed by | Killed? |
| - | --------- | -------- | --------- | ------- |
| M1 | `lib/slots.mjs:62` | readiness accepts `200` as well as `401` | - | ❌ Survived |
| M1b | `lib/slots.mjs:62` | readiness accepts any status `< 500` | - | ❌ Survived |
| M2 | `lib/proxy.mjs:39` | reload without `nginx -t` | backendDeploy passing deploy, failed switch; previous rollback | ✅ Killed |
| M3 | `lib/backendDeploy.mjs:20` | failure path also stops the active slot | backendDeploy build / readiness / suite failure tests | ✅ Killed |
| M4 | `lib/previous.mjs:13` | sweep `<` → `<=` (kept at exactly 5 min) | "removes the previous container and its image at 5 min" | ✅ Killed |
| M4b | `lib/previous.mjs:13` | sweep 1 s early | "keeps a previous slot stopped 4 min 59 s ago" | ✅ Killed |
| M5 | `watcher.mjs:75` | watcher acts when target == handled | "the same target does nothing but sweep" | ✅ Killed |
| M6 | `watcher.mjs:92` | Worker published after a failed backend deploy | "a mixed range does not publish the Worker after a failed deploy" | ✅ Killed |
| M7 | `regression.mjs:157` | cleanup skipped when a check failed | the three "prints FALHOU ... still deletes the user" tests | ✅ Killed |
| M8 | `watcher.mjs:104` | lock released only when active == handled (kept on failed or non-backend paths) | "the lock is released on every path" | ✅ Killed |
| M8b | `deploy.mjs:46` | rollback entry never releases the lock | deploy.test `--rollback saves...`, `no previous slot...` | ✅ Killed |
| M9 | `lib/changes.mjs:15` | `*.test.js` counted as game | "game tests, e2e files and the readme are neither" | ✅ Killed |
| M10 | `lib/previous.mjs:65` | rollback sets `handled` to the rolled-back-to commit | previous rollback test, deploy.test `--rollback saves...` | ✅ Killed |
| M11 | `regression.mjs:100` | `auto clique inicial` ignores `resets` | - | ❌ Survived |
| M12 | `regression.mjs:88` | `progresso inicial` chapter/stage not checked | - | ❌ Survived |
| M13 | `lib/backendDeploy.mjs:51` | no 10 s drain before stopping the old slot | backendDeploy passing deploy timeline | ✅ Killed |
| M14 | `lib/regressionRun.mjs:42` | suite targets `http://proxy:80` | regressionRun args, backendDeploy timeline | ✅ Killed |
| M15 | `lib/backendDeploy.mjs:33` | new image started in the active slot | backendDeploy passing deploy timeline | ✅ Killed |
| M16 | `lib/workerPublish.mjs:17` | Worker published without `BACKEND_URL` | workerPublish "runs npm ci and npm run deploy there with BACKEND_URL" | ✅ Killed |
| M17 | `lib/previous.mjs:19` | sweep keeps the old image | "removes the previous container and its image at 5 min" | ✅ Killed |
| M18 | `regression.mjs:188` | CLI exits 0 on failure | "the CLI exits 1 when a check fails" | ✅ Killed |
| M19 | `lib/backendDeploy.mjs:25` | a failed commit is not marked handled (retried) | the four failure tests (`state == { ...STATE, handled: NEW }`) | ✅ Killed |
| M20 | `regression.mjs:150` | suite does not stop at the first failed check | FALHOU tests (`checks` count, single line) | ✅ Killed |

**Sensor depth**: expanded (22 mutants; the feature controls what reaches players and runs on the real database)
**Result**: 18/22 killed, 4 survived (M1, M1b, M11, M12) - FAIL ❌

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ Small modules with injected `exec`/`fetch`, no new dependency |
| Surgical changes | ✅ Backend touched only by a comment and the live gate commits (4ea7667 broke `/account/reset`, 32b6928 restored it; net diff is one comment line) |
| No scope creep | ⚠️ One extra behavior beyond the spec, stated in d05c174: a deploy into the slot still kept as previous removes that older image (`lib/backendDeploy.mjs:55-58`, tested `lib/backendDeploy.test.mjs:178-198`). It is needed so that image is ever removed. `clearStaleLock` (`lib/state.mjs:48`) is exported and tested but unused, because `publish.sh:100` uses `rm -f` |
| Matches patterns | ✅ Injected gateways like the game's adapters; logs in Portuguese like the rest of the player-facing text |
| Spec-anchored outcome check | ⚠️ Every log text in the spec is asserted verbatim. Two value checks of the suite are not pinned (M11, M12) |
| Per-layer coverage | ⚠️ `node --test --experimental-test-coverage`: all files 98.08 % lines, 96.41 % branches; `watcher.mjs` 76.39 % (CLI loop 111-144 untested), `regression.mjs` 96.83 % (no-argument CLI branch) |
| Every test maps to a requirement | ✅ The tests outside the ACs map to Done-when items (run.mjs, state round trip, hang regression 837ca2d, npm install 1b119fd) |
| Documented guidelines | ✅ CLAUDE.md (Deploy section updated, `.publish-state` gone, deploy coverage command), tasks.md Test Coverage Matrix |

Observations (outside the spec, non-blocking):

- A deploy that fails after the image build (readiness, suite or switch) removes the slot but leaves `infinity-grove-backend:<hash>`. The sweep only removes the previous slot's image, so failed images pile up. The spec does not ask for removal, so this is a resource leak, not an AC failure.
- `runRegression` runs `docker run --rm` through `run`, which captures the output and does not print it. The `FALHOU` line shows in Dozzle only while the container lives. The watcher log keeps only `Deploy <h> falhou na regressão; ...`. Goal 2 ("the failure is visible in the logs") is met by that line. The cause of the failure is lost once the container is gone.
- If `cadastro` answered 201 without a token, the created user would not be deleted (cleanup needs the token). The real backend always returns one.

---

## Gate Check

- **Gate command** (Build level, tasks.md): `node --test "deploy/**/*.test.mjs"` and `docker compose -f backend/docker-compose.yml --profile deploy config -q` and `cd backend && ./gradlew ktlintCheck`
- **Deploy tests**: 104 tests, 104 passed, 0 failed, 0 skipped, 0 cancelled (Node v22.19.0, real tree)
- **Compose config**: exit 0
- **ktlintCheck**: BUILD SUCCESSFUL
- **Test count before feature**: 0 (`deploy/` did not exist at `0ee314b`)
- **Test count after feature**: 104
- **Delta**: +104
- **Skipped tests**: none
- **Failures**: none
- **Live stack**: not touched by the verifier. `docker ps` (read-only) showed `infinity-grove-backend-blue 127.0.0.1:18081`, `infinity-grove-proxy 127.0.0.1:8080`, `infinity-grove-dozzle 127.0.0.1:8888`, `infinity-grove-postgres`
- **Real tree isolation**: `git status --porcelain` before the sensor (36 lines, the owner's uncommitted files) was identical after it

---

## Fix Plans

### Fix 1: Readiness must take only a 401 (M1, M1b) - Major

- **Root cause**: `lib/slots.test.mjs` only feeds 401, 5xx and refused connections, so a looser condition still passes.
- **Fix task**: In `deploy/lib/slots.test.mjs`, add a test where `fetch` answers `200`, `403`, `404`, then `401`: `waitReady` is true only on the fourth call. Add one where every answer is `200`: false at `180000`. No production change.
- **Done when**: M1 and M1b are killed.

### Fix 2: Pin every value check of the suite (M11, M12) - Major

- **Root cause**: the fake backend always answers chapter 1 stage 1 and level 0 / resets 0, and no test makes those checks fail.
- **Fix task**: In `deploy/regression.test.mjs`, add failure cases: `GET /progress` answering chapter 2 → `FALHOU: progresso inicial: capítulo 1 etapa 1 / capítulo 2 etapa 1`; the first `GET /auto-click` answering `resets 1` → `FALHOU: auto clique inicial: nível 0 e resets 0 / nível 0 e resets 1`; `POST /users` 201 with no token → `FALHOU: cadastro: 201 com accessToken / 201 sem accessToken`; one of `/wallet`, `/talents`, `/heroes`, `/equipment` answering 500 → `FALHOU: carteira: 200 / 500` (or a loop over the four). Each case stops there.
- **Done when**: M11 and M12 are killed and every one of the 12 checks has a failing-case test.

### Fix 3: Evidence for the restart edge case - Minor

- **Fix task**: Record a live run in a commit body: stop `publish.sh` while `.deploy-state` names `green`, leave a `.deploy.lock`, run `./publish.sh`, and show that `backend-green` starts and the lock is gone. Or move the start-up choice into a tested Node helper. Optionally use `clearStaleLock` there, or delete it.
- **Done when**: the edge case has a `file:line` or a recorded live run.

### Fix 4: Small test gaps - Cosmetic

- `deploy/regression.test.mjs`: CLI with no argument exits 1 with `Uso: node regression.mjs <url base>`.
- Optional: remove the image of a deploy that fails after the build (`fail()` in `lib/backendDeploy.mjs`), with a test.

### Fix 5: Spec precision - Cosmetic

- Write in spec.md the `<expected>`/`<received>` renderings of each check, the two rollback failure texts (now `SPEC_DEVIATION`), and that `<hash>` in container names and logs is the 7-character short hash.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| BG-01 | Pending | ✅ Verified |
| BG-02 | Pending | ❌ Needs Fix (Fix 1, readiness 401 only) |
| BG-03 | Pending | ✅ Verified (AC 6 live only) |
| BG-04, BG-05 | Pending | ✅ Verified |
| BG-06 | Pending | ❌ Needs Fix (Fix 2, value checks) |
| BG-07, BG-08 | Pending | ✅ Verified |
| BG-09 | Pending | ✅ Verified (AC 1 loop live only) |
| BG-10, BG-11, BG-12, BG-13 | Pending | ✅ Verified |
| BG-14 | Pending | ⚠️ Verified except the restart case (Fix 3) |

---

## Summary

**Overall**: ❌ Not Ready (FAIL), because of surviving mutants. The behavior is right: it was shown live and the production code needs no change. Only the tests have to be strengthened (Fixes 1 and 2).

**Spec-anchored check**: 26 of 28 ACs matched the spec outcome (two of them live only). US-2 AC 2 has a gap, US-1 AC 2 has surviving mutants, the restart edge case has no evidence, and there are 3 spec-precision notes.
**Sensor**: 22 mutations injected, 18 killed, 4 survived (M1, M1b, M11, M12)
**Gate**: 104 deploy tests passed, compose config ok, ktlint ok

**What works**: commit-tree builds, idle-slot start, readiness timeout, suite in a named container on the internal address, `nginx -t` before the reload, 10 s drain, 5 min sweep, rollback that keeps `handled`, lock on every path, Worker only after a passed backend deploy, every spec log text verbatim.

**Next steps**: implement Fixes 1 and 2 (tests only), re-run the sensor on M1, M1b, M11, M12, then re-verify.
