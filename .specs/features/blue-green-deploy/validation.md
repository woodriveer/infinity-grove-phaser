# Blue-Green Deploy Validation

**Date**: 2026-10-28
**Spec**: `.specs/features/blue-green-deploy/spec.md` (updated in `37f3132`)
**Diff range**: round 1 `0ee314b..dc803b2` (25 commits: d73282c docs, ca7bf41 T1, 08dd35f T2, 6a8e858 T3, 68973d1 T4, c9de3b6 T5, 01c0421 T6, 4f0bd9e T7, 2e29bc3 docs, 4585351 T8, 90e5b82 T9, 0622f68 T10, 4905672 T11, 60393e6 T12, 1c3fd10 T13, 1179abe T14, 1b119fd fix, 4ca7feb chore, 837ca2d fix, 05e98aa fix, 439c76a / 4ea7667 / 32b6928 live gate commits, d05c174 T15, dc803b2 T16). Round 2 adds `19da347` (fix: readiness only on 401, FALHOU tests for the early checks, CLI with no argument, a failed deploy removes the refused image) and `37f3132` (spec: FALHOU texts, rollback failure texts US-4 AC 4, short hash). `ce25ebe` is the round-1 report.
**Verifier**: independent sub-agent (author ≠ verifier), re-verification round 2 of 3

**Verdict**: FAIL

The 4 surviving mutants of round 1 (M1, M1b, M11, M12) are all killed now, and so are the 6 new mutants on the round-2 code (removal of the refused image, the rollback failure texts). The spec now states the FALHOU wordings, the rollback failure texts and the short hash, so the three spec-precision notes of round 1 are closed.

The verdict is still FAIL because of **one new surviving mutant, M27**. The `login` check (US-2 AC 2, "log in (200)") is the only one of the 12 checks with no failing-case test. 19da347 added failing cases for `cadastro`, `progresso inicial`, `carteira`, `talentos`, `heróis`, `equipamentos` and `auto clique inicial`, but not for `login`. Removing `expectStatus(response, 200)` from `login` (`deploy/regression.mjs:80`) leaves all 117 tests passing. The mutant is not equivalent: the next line falls back to the `cadastro` token (`token = response.body?.accessToken ?? token`), so a backend whose `POST /users/login` answers 500 would pass the whole suite and take traffic. The fix is one test case. No production change is needed.

A second probe (M26) survives but is equivalent in production (see the sensor section). The restart edge case has code and launcher-level evidence only. It does not block.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 backend image | ✅ Done | ca7bf41 |
| T2 compose deploy profile | ✅ Done | 08dd35f |
| T3 command runner | ✅ Done | 6a8e858 |
| T4 state and lock | ✅ Done | 68973d1 |
| T5 classify changes | ✅ Done | c9de3b6 |
| T6 proxy switch | ✅ Done | 01c0421, keep-alive fix 05e98aa |
| T7 slot lifecycle | ✅ Done | 4f0bd9e, hang fix 837ca2d; readiness tests 19da347 |
| T8 regression suite | ⚠️ Partial | 4585351; failing cases 19da347, still none for `login` (M27) |
| T9 suite in a container | ✅ Done | 90e5b82 |
| T10 blue-green deploy | ✅ Done | 0622f68; refused image removed 19da347 |
| T11 sweep and rollback | ✅ Done | 4905672; SPEC_DEVIATION marker removed 19da347 (texts now in the spec) |
| T12 Worker of a commit | ✅ Done | 60393e6, 1b119fd |
| T13 watcher | ✅ Done | 1c3fd10 |
| T14 rollback entry | ✅ Done | 1179abe |
| T15 publish.sh | ✅ Done | d05c174 (live run in the body) |
| T16 docs, AD-016 | ✅ Done | dc803b2 |

---

## Spec-Anchored Acceptance Criteria

Paths are relative to `deploy/`. Line numbers are at `37f3132`. "Live" means the evidence in the commit body named (the author's run on the real stack). It is accepted as recorded evidence and is not a unit test.

### P1: Deploy a new backend with no downtime

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | New backend commit → image from the commit tree | `infinity-grove-backend:<short hash>` from `git archive <hash>:backend` | `lib/slots.test.mjs:32` - `imageOf(HASH) == 'infinity-grove-backend:0123456'`; `:43` - `['archive','--format=tar',`${HASH}:backend`]`; `:47-48` - `docker build -t infinity-grove-backend:0123456 -` with `input == tar`; `lib/backendDeploy.test.mjs:75-76` | ✅ PASS |
| 2 | Start in the idle slot, wait for 401 on `/progress`, at most 180 s | ready only on a 401; false at 180 s | `lib/backendDeploy.test.mjs:77-78` - compose `up ... backend-green`, then fetch `http://127.0.0.1:18082/progress`; `lib/slots.test.mjs:73-77` - only `backend-green`; `:149-150` - true on the first 401 after a 503; `:187-195` - answers `[200, 403, 404, 401]`: true, `answers.length == 0`, `clock.now() == 6000`; `:198-204` - only 200s: false at `180000`; `:182-183` - false at `180000` | ✅ PASS (M1, M1b killed in round 2) |
| 3 | Not ready in 180 s → remove the new slot, proxy kept, log | `Deploy <hash> falhou: o backend não ficou pronto em 180 s` | `lib/backendDeploy.test.mjs:118` (text verbatim) via `:145` - `lines == [failure.line]`; `:147-149` no stop, no reload, conf `renderConf('blue')`; `:150-153` - `rm -sf backend-green`; `:154` - `docker image rm infinity-grove-backend:bbbbbbb`; `:175` - gives up at exactly `180000` | ✅ PASS |
| 4 | Suite against the slot's internal address, never the proxy | `http://backend-<slot>:8080` | `lib/backendDeploy.test.mjs:86` - `docker run ... http://backend-green:8080$`; `lib/regressionRun.test.mjs:60-68` - args incl. `--network backend_default`; `lib/backendDeploy.test.mjs:185` - a failed suite runs no proxy command | ✅ PASS |
| 5 | Suite passes → `nginx -s reload` onto the new slot, log | `Deploy <hash> ativo no slot <slot>` | `lib/backendDeploy.test.mjs:73` - `['Deploy bbbbbbb ativo no slot green']`; `:81-82` - `nginx -t` then `nginx -s reload`; `:87` - conf `renderConf('green')`; `lib/proxy.test.mjs:53-64` | ✅ PASS |
| 6 | No request refused or reset during the switch | 0 failed requests | `lib/proxy.test.mjs:41-44` - `keepalive_timeout 0;`. Live (d05c174): poller 1807/1807, 3345/3345, 4113/4113, 4409/4409, 7548/7548 answered 401 | ✅ PASS (live only; a unit test cannot prove it) |
| 7 | Stop the old slot, keep it 5 min, then remove it | stop after the switch; removed at 5 min | `lib/backendDeploy.test.mjs:83-84` - `sleep 10000` then `docker stop infinity-grove-backend-blue`; `lib/previous.test.mjs:64-65` - kept at 4 min 59 s; `:72-76` - `rm -sf backend-blue` + `image rm` at 5 min; live (d05c174) 09:14:42 green gone | ✅ PASS |
| 8 | State after any outcome | active, previous, handled (and tunnel) | `lib/backendDeploy.test.mjs:88-93` - full state on success; `:146` - `{ ...STATE, handled: NEW }` on each failure; `watcher.test.mjs:152`, `:162-167`, `:177`, `:196`; `lib/state.test.mjs:20-33` | ✅ PASS |
| 9 | Tunnel and Worker unchanged by a backend deploy | same tunnel, no Worker publish | `lib/backendDeploy.test.mjs:92` - `tunnel` unchanged; `watcher.test.mjs:161` - `deploy` only, no `publish`; live (d05c174) same tunnel before and after | ✅ PASS |

### P1: Regression suite against the new backend

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Base URL as only argument; exit 0 / 1 | 0 all pass, 1 otherwise | `regression.test.mjs:395-396` - code `0` + OK line; `:420-421` - code `1` + FALHOU line; `:403-408` - no argument: code `1`, stdout `'Uso: node regression.mjs <url base>\n'` | ✅ PASS (round-1 note closed) |
| 2 | The 12 checks in order with their values | the 12 checks of the spec | `regression.test.mjs:142-165` - exact request order, `checks == 12`. Failing cases: `cadastro` `:229`; `progresso inicial` `:230`, `:260`; `carteira` / `talentos` / `heróis` / `equipamentos` `:231-234`; `auto clique inicial` `:235`, `:252`; `reset bloqueado` `:205`; `capítulo 1` `:343`; `reset` `:213`, `:324`; `auto clique após reset` `:221`, `:333`. Each early case asserts `ok == false`, the stop count, the single line and the delete (`:245-248`). **`login` (200) has no failing case** | ❌ GAP: **mutant M27 survived**. Removing the `login` status check (`regression.mjs:80`) passes every test, and the cadastro token fallback (`regression.mjs:81`) lets a broken login pass the suite |
| 3 | A failed check prints the line and stops | `FALHOU: <check>: <expected> / <received>`, with the wordings now in the spec | Spec examples, all asserted verbatim: `200 / 500` `:213`, `:231-234`; `capítulo 1 etapa 1 / capítulo 2 etapa 1` `:230`; `nível 0 e resets 0 / nível 0 e resets 1` `:235`; `409 RESET_LOCKED / 500` `:421` (a 500 whose body has a `code` adds it: `500 INTERNAL` `:205`); `reward 2 e capítulo 1 / reward 1 e capítulo 1` `:324`; `resets 1 e crystals 2 / resets 0 e crystals 0` `:333`; `201 com accessToken / 201 sem accessToken` `:229`; `limpeza: 204 / <status>` `:355`. Stop: `checks` count `:246`, `:308` | ✅ PASS (round-1 spec-precision note closed) |
| 4 | Delete every created user, pass or fail | `DELETE /users/{username}`, none left | `regression.test.mjs:163-165` - DELETE last, `users.size == 0`; `:248` and `:310-311` on each failure; `:355` failed delete fails the run; live (4585351, d05c174) 0 `regression-` users | ✅ PASS |
| 5 | All pass → summary | `Regressão OK: <n> verificações em <s> s` | `regression.test.mjs:149` - `'Regressão OK: 12 verificações em 4.2 s'`; `:396` CLI regex | ✅ PASS |
| 6 | Suite fails → remove the new slot, proxy kept, log | `Deploy <hash> falhou na regressão; o slot <slot> continua ativo` | `lib/backendDeploy.test.mjs:124` (verbatim) via `:145-154`; `:185`; live (d05c174) `Deploy 4ea7667 falhou na regressão; o slot blue continua ativo` | ✅ PASS |

### P1: Watcher on `main`

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | `git fetch origin main` every 60 s | 60 s loop | `watcher.mjs:12` `POLL_MS = 60000`; the loop `watcher.mjs:131-143` has no unit test. Live (d05c174): pushed commits picked up | ⚠️ Live only (launcher level, as the Test Coverage Matrix plans) |
| 2 | New target ≠ handled → deploy it | deploy of the target | `watcher.test.mjs:161` - `deploy ${TARGET} lock=true`; `:127-129` - same target only sweeps | ✅ PASS |
| 3 | Neither backend nor game → handled only | handled moved, nothing built | `watcher.test.mjs:151-152`; `lib/changes.test.mjs:36-41`; live (d05c174) | ✅ PASS |
| 4 | Game paths → Worker of the commit tree, after a passed backend deploy only | publish after deploy, not after a failed one | `watcher.test.mjs:176`, `:186`, `:195`; `lib/workerPublish.test.mjs:62`, `:70`; `lib/changes.test.mjs:16-34` | ✅ PASS |
| 5 | One deploy at a time | taken lock skips | `watcher.test.mjs:205-207`, `:161`, `:237`, `:247`; `lib/state.test.mjs:45-55` | ✅ PASS |
| 6 | `git fetch` fails → log and keep running | `Não foi possível buscar origin/main; nova tentativa em 60 s` | `watcher.test.mjs:116-118` - text verbatim, no action, state unchanged; loop part live only | ✅ PASS |
| 7 | Commit tree only | no working-tree file in the image or the Worker | `lib/slots.test.mjs:43`; `lib/workerPublish.test.mjs:62`; `publish.sh:119` (`git archive "$COMMIT:backend"`) | ✅ PASS |

### P2: Manual rollback

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Previous container exists → start, wait, switch, stop the other, log | `Rollback para <hash> no slot <slot>` | `lib/previous.test.mjs:96` - `['Rollback para aaaaaaa no slot blue']`; `:97-106`; `deploy.test.mjs:68-77`; live (d05c174) 09:08:37 | ✅ PASS |
| 2 | No previous container → exit 1 | `Sem versão anterior para voltar (removida após 5 min)` | `deploy.test.mjs:83-84` - exit `1`, text verbatim; `lib/previous.test.mjs:122`, `:135` | ✅ PASS |
| 3 | Rolled-back-from commit not redeployed | `handled` kept | `lib/previous.test.mjs:110` - `handled: NEW`; `deploy.test.mjs:73`; `watcher.test.mjs:127` | ✅ PASS |
| 4 (new) | Previous slot not ready in 180 s → stop it, keep the proxy, log; proxy switch fails → log | `Rollback para <hash> falhou: o backend não ficou pronto em 180 s`; `Rollback para <hash> falhou na troca do proxy; o slot <slot> continua ativo` | `lib/previous.test.mjs:147` (verbatim), `:148` state unchanged, `:149` only `docker stop infinity-grove-backend-blue`, `:150` no proxy command, `:151` conf still `renderConf('green')`; `:162` (verbatim, `<slot>` is the active `green`), `:163-165`; the 180 s bound is the shared `waitReady` (`lib/slots.test.mjs:182-183`, `:198-204`) | ✅ PASS (M23, M24, M25 killed) |

The `// SPEC_DEVIATION` marker that round 1 found at `lib/previous.mjs:38` was removed in 19da347, because the texts are now in the spec.

### P2: Live logs in Dozzle

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Dozzle at `localhost:8888` with the live logs | every container | `backend/docker-compose.yml:76-87` (`DOZZLE_FILTER=name=infinity-grove`); live (08dd35f) | ✅ PASS (config + live) |
| 2 | `127.0.0.1` only | bound to loopback | `backend/docker-compose.yml:84` - `"127.0.0.1:8888:8080"`; `lib/proxy.test.mjs:34-35` names only `backend-<slot>:8080` | ✅ PASS |
| 3 | Suite in `infinity-grove-regression-<hash>` | 7-character short hash (spec, Assumptions note) | `lib/regressionRun.test.mjs:62` - `'--name', 'infinity-grove-regression-0123456'` | ✅ PASS (round-1 spec-precision note closed) |

### Edge cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| No `.deploy-state` at start | `watcher.test.mjs:256-262`; `publish.sh:109-113`; live (d05c174) "First run, no state" | ✅ |
| Docker down | `watcher.test.mjs:105-107` - text verbatim | ✅ |
| Build fails | `lib/backendDeploy.test.mjs:112-113` via `:145-154` - no `rm -sf`, no `image rm`, no stop, no reload | ✅ |
| Two commits between polls | `watcher.test.mjs:216-218` | ✅ |
| Restart during a deploy → next `publish.sh` starts the recorded slot and removes a stale lock | `publish.sh:100` - `rm -f .deploy.lock`; `publish.sh:105-108` - `SLOT` / `COMMIT` from `state_get active.*`; `publish.sh:125` - `up -d --wait postgres dozzle "backend-$SLOT"`. Launchers are covered live by the Test Coverage Matrix (tasks.md:25). The d05c174 body shows publish.sh runs that went on from an existing `.deploy-state` across the bug-fix restarts. It records no run cut off during a deploy with a lock left behind | ⚠️ Code + launcher-level evidence; this exact case is not recorded. Non-blocking (Minor) |

**Status**: ❌ 28 of 29 ACs covered. US-2 AC 2 has a gap (`login`, M27). Two ACs are live only (US-1 AC 6, the US-3 AC 1 loop). One edge case has code-level evidence only (restart). No spec-precision gaps left.

---

## Discrimination Sensor

### Round 2 (at `37f3132`)

The sensor ran in scratch worktrees (`git worktree add <scratchpad>/vwt2 HEAD`, then `<scratchpad>/vwt3` for M27). A Node script applied each mutant as an exact replacement that had to match once, ran `node --test "deploy/**/*.test.mjs"` in the worktree, and wrote the original file back. Baseline in the worktree with no mutant: 117 pass. After each run the worktree `git status --porcelain` was empty, and the worktree was removed with `git worktree remove --force`. The real tree `git status --porcelain` (36 lines, the owner's uncommitted files) was identical before and after both runs.

| # | File:line | Mutation | Killed by | Killed? |
| - | --------- | -------- | --------- | ------- |
| M1 | `lib/slots.mjs:62` | readiness accepts `200` as well as `401` | `slots.test.mjs:187`, `:198` | ✅ Killed (2 tests) |
| M1b | `lib/slots.mjs:62` | readiness accepts any status `< 500` | `slots.test.mjs:187`, `:198` | ✅ Killed (2 tests) |
| M11 | `regression.mjs:100` | `auto clique inicial` ignores `resets` | `regression.test.mjs:240` (case `:235`) | ✅ Killed |
| M12 | `regression.mjs:88` | `progresso inicial` chapter/stage not checked | `regression.test.mjs:240` (case `:230`), `:260` | ✅ Killed (2 tests) |
| M21 | `lib/backendDeploy.mjs:25` | a failed deploy never removes the refused image | readiness, suite and switch failure tests (`backendDeploy.test.mjs:154`) | ✅ Killed (3 tests) |
| M22 | `lib/backendDeploy.mjs:23` | the image is removed even when a kept slot runs it (`if (true)`) | `backendDeploy.test.mjs:158` | ✅ Killed |
| M22b | `lib/backendDeploy.mjs:23` | guard checks only `active.commit` (removes the image when `previous.commit === hash`) | `backendDeploy.test.mjs:158` | ✅ Killed |
| M23 | `lib/previous.mjs:41` | rollback readiness text `pronto` → `ativo` | `previous.test.mjs:139` | ✅ Killed |
| M24 | `lib/previous.mjs:49` | rollback switch text `continua ativo` → `segue ativo` | `previous.test.mjs:154` | ✅ Killed |
| M25 | `lib/previous.mjs:49` | rollback switch text names `previous.slot` instead of the active slot | `previous.test.mjs:154` | ✅ Killed |
| M27 | `regression.mjs:80` | `login` status not checked (`expectStatus(response, 200)` removed) | - | ❌ Survived → Fix 1 |
| M26 (probe) | `lib/backendDeploy.mjs:23` | guard checks only `previous.commit` (removes the image when `hash === active.commit`) | - | ⚪ Survived, equivalent |

M26 is equivalent in production. `hash === active.commit` happens only if `origin/main` is moved back to the commit the active slot runs. In that case `removeImage` (`lib/slots.mjs:41`, `docker image rm` without `-f`) targets the image that the running active container uses, and Docker refuses to remove it. Nothing observable changes; only the fake `exec` log differs. It is not counted (optional Fix 3).

M27 is not equivalent. When `POST /users/login` answers 500, `regression.mjs:81` keeps the `cadastro` token, and the remaining 10 checks pass on the fake backend and on a real backend whose only fault is login.

**Sensor depth**: expanded (the feature controls what reaches players and runs on the real database)
**Result (round 2)**: 11 injected, 10 killed, 1 survived (M27), plus 1 equivalent probe (M26) - FAIL ❌

### Round 1 (history, at `dc803b2`)

| # | File:line | Mutation | Killed by | Killed? |
| - | --------- | -------- | --------- | ------- |
| M1 | `lib/slots.mjs:62` | readiness accepts `200` as well as `401` | - | ❌ Survived → fixed in 19da347 |
| M1b | `lib/slots.mjs:62` | readiness accepts any status `< 500` | - | ❌ Survived → fixed in 19da347 |
| M2 | `lib/proxy.mjs:39` | reload without `nginx -t` | backendDeploy failed switch; previous rollback | ✅ Killed |
| M3 | `lib/backendDeploy.mjs:20` | failure path also stops the active slot | backendDeploy failure tests | ✅ Killed |
| M4 | `lib/previous.mjs:13` | sweep `<` → `<=` | "removes the previous container and its image at 5 min" | ✅ Killed |
| M4b | `lib/previous.mjs:13` | sweep 1 s early | "keeps a previous slot stopped 4 min 59 s ago" | ✅ Killed |
| M5 | `watcher.mjs:75` | watcher acts when target == handled | "the same target does nothing but sweep" | ✅ Killed |
| M6 | `watcher.mjs:92` | Worker published after a failed backend deploy | "a mixed range does not publish the Worker after a failed deploy" | ✅ Killed |
| M7 | `regression.mjs:157` | cleanup skipped when a check failed | the "still deletes the user" tests | ✅ Killed |
| M8 | `watcher.mjs:104` | lock released only on one path | "the lock is released on every path" | ✅ Killed |
| M8b | `deploy.mjs:46` | rollback entry never releases the lock | deploy.test rollback tests | ✅ Killed |
| M9 | `lib/changes.mjs:15` | `*.test.js` counted as game | "game tests, e2e files and the readme are neither" | ✅ Killed |
| M10 | `lib/previous.mjs:65` | rollback sets `handled` to the rolled-back-to commit | previous rollback test, deploy.test | ✅ Killed |
| M11 | `regression.mjs:100` | `auto clique inicial` ignores `resets` | - | ❌ Survived → fixed in 19da347 |
| M12 | `regression.mjs:88` | `progresso inicial` chapter/stage not checked | - | ❌ Survived → fixed in 19da347 |
| M13 | `lib/backendDeploy.mjs:51` | no 10 s drain before stopping the old slot | backendDeploy passing deploy timeline | ✅ Killed |
| M14 | `lib/regressionRun.mjs:42` | suite targets `http://proxy:80` | regressionRun args, backendDeploy timeline | ✅ Killed |
| M15 | `lib/backendDeploy.mjs:33` | new image started in the active slot | backendDeploy passing deploy timeline | ✅ Killed |
| M16 | `lib/workerPublish.mjs:17` | Worker published without `BACKEND_URL` | workerPublish npm run deploy test | ✅ Killed |
| M17 | `lib/previous.mjs:19` | sweep keeps the old image | sweep at 5 min test | ✅ Killed |
| M18 | `regression.mjs:188` | CLI exits 0 on failure | "the CLI exits 1 when a check fails" | ✅ Killed |
| M19 | `lib/backendDeploy.mjs:25` | a failed commit is not marked handled | the failure tests | ✅ Killed |
| M20 | `regression.mjs:150` | suite does not stop at the first failed check | FALHOU tests | ✅ Killed |

Round 1 result: 22 injected, 18 killed, 4 survived - FAIL ❌ (line numbers at `dc803b2`).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ The round-2 production change is 6 lines (`lib/backendDeploy.mjs:21-26`) |
| Surgical changes | ✅ 19da347 touches only `deploy/`; no backend or game file |
| No scope creep | ✅ The refused-image removal was the optional item of round-1 Fix 4 (a resource leak). It is guarded so an image that a kept slot runs is never removed (`lib/backendDeploy.test.mjs:158-165`). `clearStaleLock` (`lib/state.mjs:48`) is still exported and unused (cosmetic) |
| Matches patterns | ✅ Same injected-`exec` fakes and table-driven failure tests as round 1 |
| Spec-anchored outcome check | ✅ Every log and FALHOU text named in the spec is asserted verbatim |
| Per-layer coverage | ❌ One of the 12 suite checks (`login`) has no failing case (M27). The launchers and the watcher loop are live-only, as the Test Coverage Matrix plans |
| Every test maps to a requirement | ✅ The 13 new tests map to US-1 AC 2, US-2 AC 1-3 and the refused-image guard |
| Documented guidelines | ✅ CLAUDE.md, tasks.md Test Coverage Matrix |

---

## Gate Check

- **Gate command** (Build level, tasks.md): `node --test "deploy/**/*.test.mjs"` and `docker compose -f backend/docker-compose.yml --profile deploy config -q` and `cd backend && ./gradlew ktlintCheck`
- **Deploy tests**: 117 tests, 117 passed, 0 failed, 0 skipped, 0 cancelled (Node v22.19.0, real tree, `37f3132`)
- **Compose config**: exit 0
- **ktlintCheck**: not re-run in round 2. No backend file changed since round 1 (`git diff --stat dc803b2..37f3132 -- backend` is empty), and round 1 was BUILD SUCCESSFUL
- **Test count before feature**: 0; **round 1**: 104; **round 2**: 117 (+13: 2 readiness, 9 suite failure cases, 1 CLI with no argument, 1 kept image)
- **Skipped tests**: none
- **Failures**: none
- **Live stack**: not touched by the verifier (no compose up/down/rm, no publish.sh or deploy.sh)
- **Real tree isolation**: `git status --porcelain` identical before and after each sensor run

---

## Fix Plans

### Fix 1: A failing case for `login` (M27) - Major

- **Root cause**: the `early` table in `deploy/regression.test.mjs:228-236` skips `login`, and `regression.mjs:81` falls back to the `cadastro` token, so nothing else fails when login is broken.
- **Fix task**: add `['login', 'POST /users/login', { status: 500, body: null }, 'FALHOU: login: 200 / 500', 1]` to the `early` table (the loop at `:238-250` already asserts `ok`, the stop count, the single line and the delete).
- **Done when**: M27 (`expectStatus(response, 200)` removed from `login`) is killed, and each of the 12 checks has a failing-case test.

### Fix 2: Restart edge case evidence - Minor (non-blocking)

- Record a live run in a commit body: stop `publish.sh` while `.deploy-state` names `green` and a `.deploy.lock` exists, then run `./publish.sh` and show that `backend-green` starts and the lock is gone. Or move the start-up choice into a tested Node helper. Use `clearStaleLock` there, or delete it.

### Fix 3: Optional test for M26 - Cosmetic

- In `deploy/lib/backendDeploy.test.mjs`, add a test where a failed deploy whose `hash` equals `state.active.commit` runs no `docker image rm`. Docker already refuses that removal, so this test only pins intent.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| BG-01 | ✅ Verified | ✅ Verified |
| BG-02 | ❌ Needs Fix | ✅ Verified (M1, M1b killed) |
| BG-03 | ✅ Verified | ✅ Verified (AC 6 live only) |
| BG-04, BG-05 | ✅ Verified | ✅ Verified |
| BG-06 | ❌ Needs Fix | ❌ Needs Fix (Fix 1, `login`; M11 and M12 killed) |
| BG-07, BG-08 | ✅ Verified | ✅ Verified |
| BG-09 | ✅ Verified | ✅ Verified (AC 1 loop live only) |
| BG-10, BG-11, BG-13 | ✅ Verified | ✅ Verified |
| BG-12 | ✅ Verified | ✅ Verified (AC 4 added in the spec, covered) |
| BG-14 | ⚠️ restart case | ⚠️ Verified except the restart case, which has code and launcher-level evidence only (Fix 2, non-blocking) |

---

## Summary

**Overall**: ❌ Not Ready (FAIL), because of one surviving mutant (M27, `login`). The production code needs no change; one test case closes it.

**Spec-anchored check**: 28 of 29 ACs matched the spec outcome (US-1 AC 6 and the US-3 AC 1 loop are live only). US-2 AC 2 has a gap (`login`). No spec-precision gaps are left. The restart edge case has code-level evidence only.
**Sensor**: round 2: 11 injected, 10 killed, 1 survived (M27), plus 1 equivalent probe (M26). Round 1: 22 injected, 18 killed, 4 survived, and all 4 are now killed.
**Gate**: 117 deploy tests passed, compose config ok.

**What works**: everything listed in round 1. On top of that: readiness only on a 401; a failing case with the exact FALHOU text for 11 of the 12 checks; the CLI with no argument; removal of a refused image unless a kept slot runs it; and the rollback failure texts verbatim.

**Next steps**: Fix 1 (one test case), then re-verify (round 3 of 3) on M27.
