# Account Reset Validation

**Date**: 2026-10-27
**Spec**: `.specs/features/account-reset/spec.md`
**Diff range**: `7c9dd48..fbfbaed` (9 commits: 95a41bd docs spec, 05b341f T1, 8fdb539 T2, 77509bb T3, b370077 T4, f908a82 T5, dbd9464 T6, 8af1e01 T7, fbfbaed T8)
**Verifier**: independent sub-agent (author ≠ verifier)

**Verdict**: PASS

Every AC has a `file:line` citation whose asserted value is the spec outcome. Nothing blocks the feature. Three evidence gaps are flagged below (indirect or view-level evidence, plus one spec-precision gap). All of them are follow-ups.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 domain rules (backend) | ✅ Done | 05b341f |
| T2 reset count store + V7 migration | ✅ Done | 8fdb539 |
| T3 AccountResetService + AutoClickService resets | ✅ Done | 77509bb |
| T4 controller, error mapping, `resets` in GET /auto-click | ✅ Done | b370077 |
| T5 game reward rule + unlock with resets | ✅ Done | f908a82 |
| T6 game gateway + application service + session restart | ✅ Done | dbd9464 |
| T7 HUD button + dialog | ✅ Done | 8af1e01 |
| T8 e2e | ✅ Done | fbfbaed |

---

## Spec-Anchored Acceptance Criteria

Paths are short. `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`. `CG` = `game/src/adapters/phaser/ClickerGame.test.js`. Line numbers are at `fbfbaed`.

### P1: Reset the account for crystals (backend)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Chapter N (2..5) reset with fromChapter N | +N crystals | `BT/domain/AccountResetTest.kt:23-25` - `assertEquals(2/3/5, AccountReset.reward(at(2/3/5)))`; `BT/adapter/web/AccountResetControllerIT.kt:93-94` - `body("reward", equalTo(3))`, `body("crystals", equalTo(7))` (4 + 3); `BT/service/AccountResetServiceTest.kt:146` (232 there: `reward=4 crystals=5` from 1) | ✅ PASS |
| 2 | Completed campaign, fromChapter 5 | +5 | `AccountResetTest.kt:30` - `assertEquals(5, reward(at(5, completed = true)))`; `AccountResetControllerIT.kt:172` - `reward 5, crystals 5` | ✅ PASS |
| 3 | Progress to 1-1, first phase, not completed | chapter 1, stage 1, PHASE 1, completed false | `AccountResetControllerIT.kt:96-100` - `progress.chapter 1`, `stage 1`, `encounter "PHASE"`, `phase 1`, `completed false`; `:106-107` GET /progress chapter 1 stage 1; `AccountResetServiceTest.kt:149` - stored progress `== start` | ✅ PASS |
| 4 | Every talent level deleted | all levels 0 | `AccountResetControllerIT.kt:120` - `talents.level.sum() == 0`; `AccountResetServiceTest.kt:160` - `findAll == emptyMap()` | ✅ PASS |
| 5 | Every award deleted, including `legacy` | available 0, first clears pay again | `AccountResetControllerIT.kt:121-122` - `points.earned 0`, `points.available 0`; `AccountResetServiceTest.kt:161` - `earnedPoints == 0` (seed includes `legacy` award, :134) | ✅ PASS ("pays again" follows from earned 0 and no awards; not exercised directly) |
| 6 | Coins, equipment, cards, auto click level and existing crystals kept | 900 copper, piece p1, heroes unchanged, level 1, 4+3 | `AccountResetControllerIT.kt:143-145` - `gold 0, silver 9, copper 0`; `:150` - `pieces.id == ["p1"]`; `:151-159` - `/heroes` body before == after; `:164-165` - `level 1`, `crystals 7`; `AccountResetServiceTest.kt:170` - `autoClick.level == 1` | ✅ PASS |
| 7 | Reset count +1 | resets 1, then 2 | `AccountResetControllerIT.kt:95` - `resets 1`; `AccountResetServiceTest.kt:146,151` - `resets 2` from 1 | ✅ PASS |
| 8 | 200 `{ reward, crystals, resets, progress }`, progress same shape as /progress | all four fields | `AccountResetControllerIT.kt:92-100` | ✅ PASS |
| 9 | Chapter 1, not completed | 409 `RESET_LOCKED`, nothing changed | `AccountResetControllerIT.kt:180` - `statusCode(409)`, `code "RESET_LOCKED"`; `:182-183` - crystals 4, resets 0; `AccountResetServiceTest.kt:194-196` - `assertUnchanged` (progress, crystals, resets, talents, points) | ✅ PASS |
| 10 | fromChapter ≠ stored | 409 `RESET_CHAPTER_MISMATCH` + stored progress, nothing changed | `AccountResetControllerIT.kt:191-195` - `409`, `code`, `progress.chapter 3`, `stage 2`, `MINIBOSS`; `:197-201` - chapter, crystals, resets, talents, points unchanged | ✅ PASS |
| 11 | fromChapter missing or not an integer | 400 `INVALID_RESET_REQUEST` | `AccountResetControllerIT.kt:208-209` - `reset(null)` and `reset("3")` → `400`, `code "INVALID_RESET_REQUEST"` | ✅ PASS (an absent key and `null` share one code path, `body["fromChapter"] as? Int`. A literal absent key and a float like `3.5` are not sent) |
| 12 | Two concurrent resets with the same fromChapter | exactly one applies, the other answers 409 MISMATCH | `AccountResetControllerIT.kt:239-242` - statuses `[200, 409]`, code `RESET_CHAPTER_MISMATCH`, crystals 3 (paid once), resets 1 | ✅ PASS |
| 13 | Logs | info: username, chapter, reward, crystals, resets. warn: username, reason, stored chapter | `AccountResetServiceTest.kt:232` - `"Account reset username=yan chapter=4 reward=4 crystals=5 resets=3" in logs.infos`; `AccountResetTest.kt:77-82` - warns `"...chapter mismatch username=yan sent=3 stored=1"`, `"...locked username=yan stored=1"` | ✅ PASS |

### P1: Reset button with confirmation (game)

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | Chapter ≥ 2 or completed: button in auto click box | `Resetar conta (+N cristais)`, N = min(chapter,5) | `CG:3997` - `toBe('Resetar conta (+4 cristais)')`; `CG:4004` - `(+5 cristais)` completed; `game/e2e/accountReset.spec.js:31` - `(+3 cristais)`; `game/src/domain/campaign/accountReset.test.js:12-18` | ✅ PASS |
| 2 | Chapter 1 not completed: hidden | no button | `CG:4010` - `resetButton(ctx)).toBeUndefined()`; `CG:4079` (after the reset); `accountReset.test.js:7` - `toBeNull()` | ✅ PASS |
| 3 | Press: dialog with the exact text + `Resetar` / `Cancelar` | the full sentence with N | `CG:4021-4024` - `question` toBe the full spec sentence with `4`, `confirm` text `Resetar`, `cancel` text `Cancelar`; `e2e/accountReset.spec.js:33` | ✅ PASS |
| 4 | `Cancelar` closes, sends nothing | hidden, no request | `CG:4033-4034` - `dialog.hidden true`, `resetGateway.reset not called`; `e2e/accountReset.spec.js:36-37` | ✅ PASS |
| 5 | `Resetar` sends the chapter shown and is disabled until the answer | `reset(4)`, disabled, one request | `CG:4056-4059` - `toHaveBeenCalledWith(4)`, `disabled true`, second click → `toHaveBeenCalledTimes(1)`; `game/src/application/accountReset/accountReset.test.js:58`; `game/src/adapters/http/accountResetApi.test.js:115` - `post('/account/reset', { fromChapter: 3 })` | ✅ PASS |
| 6 | 200: close, `Cristais: <crystals>`, notice `+N cristais` for 3 s, fight restarted at the answered progress | answered values | `CG:4072-4078` - `hidden true`, `'Cristais: 4'`, `'+4 cristais'`, `delay 3000`, `'Capítulo 1'`, encounter PHASE 1/1; `e2e/accountReset.spec.js:54-57` | ✅ PASS |
| 7 | 200: Talentos screen and red dot show level 0 and 0 points | screen + badge | `CG:4092-4093` - `talents.talents() == [wiped]`, `points() == {0,0,0}`; `accountReset.test.js:66` - `talents.load` called once | ⚠️ Indirect: the asserts check the talent collection that the screen and the badge render. The rendered Talentos screen and `talents-badge` are not checked after a reset |
| 8 | 409 MISMATCH or LOCKED: close, realign to the stored progress, keep the crystals | hidden, stored chapter, crystals unchanged | `CG:4119-4122` - `hidden true`, `'Capítulo 5'`, `'Cristais: 6'`; `CG:4133-4134` LOCKED closes, chapter 4 kept; `accountReset.test.js:81-83,92-93` | ✅ PASS (⚠️ spec-precision: a `RESET_LOCKED` answer has no `progress` body, so "realign" does nothing there. It is harmless because the mismatch check runs first, so LOCKED means the stored and shown chapters are both 1) |
| 9 | Network/5xx: dialog stays open, `Resetar` enabled, error text | `Não foi possível resetar. Tente de novo.` | `CG:4145-4148` - `hidden false`, `error toBe('Não foi possível resetar. Tente de novo.')`, `disabled false`, chapter unchanged | ✅ PASS |
| 10 | A click in the dialog does not hit the monster | no hit | `game/e2e/accountReset.spec.js:43-60` - real pointer clicks on button + Resetar, `__pointerHits == 0`; `CG:4044` (jsdom, weaker) | ✅ PASS |

### P1: Auto click after a reset

| # | Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| - | --------- | -------------------- | ----------------------- | ------ |
| 1 | GET auto click answers `resets` | `resets` field | `AccountResetControllerIT.kt:252,261` - `resets 0` then `1`; `BT/service/AutoClickServiceTest.kt:130` - `PlayerAutoClick("yan",0,0,2)` | ✅ PASS |
| 2 | Game: resets ≥ 1 opens the auto click in chapter 1 (switch + clicks at the interval) | visible, monster damaged | `CG:4156-4158` - box visible, health `< 1000` after 500 ms; `accountReset.test.js:24` (domain) - `true` | ✅ PASS |
| 3 | Backend: resets ≥ 1, chapter 1 → upgrade accepted | 200 level 1, 250 ms | `AccountResetControllerIT.kt:266-269` - `200`, `level 1`, `intervalMs 250` (spec independent test); `AutoClickServiceTest.kt:141-142` | ✅ PASS |
| 4 | resets 0, chapter 1 → locked in game and backend | locked | Backend: `AutoClickServiceTest.kt:93` - `assertFailsWith<AutoClickLockedException>` (resets 0); `AccountResetTest.kt:68`. Game: `CG:4010-4011` - box not visible; `accountReset.test.js:28-29`; `game/e2e/autoClick.spec.js:66` | ✅ PASS |
| 5 | After a 200 the auto click keeps running in chapter 1 without a reload | monster damaged in chapter 1 | `CG:4104-4106` - visible, health `< 1000`; `e2e/accountReset.spec.js:58,64` - toggle visible, health drops | ✅ PASS |

### Edge cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| Chapter 5, boss not beaten, pays 5 | `AccountResetTest.kt:25` - `reward(at(5)) == 5`; `game/src/domain/campaign/accountReset.test.js:14` | ✅ |
| A second reset leaves `resets` 2 | `AccountResetServiceTest.kt:146` - `resets == 2` from 1; `BT/adapter/repository/ResetRepositoryIT.kt:306` | ✅ |
| No `player_crystals` row, so the reward creates it | `AccountResetControllerIT.kt:172` (real DB, no crystal row, `crystals 5`); `AccountResetServiceTest.kt:179` | ✅ |
| No talent or award rows: reset succeeds | `AccountResetControllerIT.kt:172` (completed player with no talents → 200) | ✅ |
| After a reset with the farm open, the farm lists only chapter 1 bosses | Indirect only: the reset stores 1-1 PHASE 1 (`AccountResetControllerIT.kt:106-107`), and the existing `BT/service/FarmServiceTest.kt:101` "state has no boss at the start of the campaign" lists bosses from the stored progress. The game reloads the farm state from the backend. No test in the diff covers this | ⚠️ Indirect |

**Status**: ✅ All P1 ACs covered with spec-exact assertions. ⚠️ Two criteria have only indirect evidence (button AC-7, farm edge case) and one has a spec-precision gap (button AC-8, LOCKED realign).

---

## Discrimination Sensor

The sensor ran in the scratch worktree `git worktree add <scratchpad>/vwt fbfbaed`. `game/node_modules` was a junction to the real one. Every mutant was applied with an exact-match replacement and reverted with `git checkout -- <file>` inside the worktree. Game runs use `npx vitest run <scope>`. Backend runs use `./gradlew test --tests '*Reset*' --tests '*AutoClick*'`. Game runs in the clean worktree also show the 3 known pre-existing `ClickerGame farm mode` failures. A game mutant counts as killed only when a feature test (named below) failed too.

| # | File | Mutation | Killed by | Killed? |
| - | ---- | -------- | --------- | ------- |
| G1 | `game/src/domain/campaign/accountReset.js` | completed campaign reward `RESET_MAX_REWARD` → `4` | `accountReset.test.js` "pays 5 for a completed campaign" | ✅ Killed |
| G2 | `game/src/domain/combat/autoClick.js` | unlock ignores resets (`resets >= 1 \|\|` → `false \|\|`) | "opens in chapter 1 once the player has reset" (+ ClickerGame chapter 1 tests) | ✅ Killed |
| G3 | `game/src/application/campaign/campaignSession.js` | `restart` keeps the queued reports (no `queue = []`) | campaignSession "restart ... voids the queued reports" | ✅ Killed |
| G4 | `game/src/adapters/phaser/ClickerGame.js` | dialog not closed on 409 (`if (false)`) | CG "closes the dialog, realigns ... after a 409 mismatch" | ✅ Killed |
| G5 | `game/src/adapters/phaser/views/resetView.js` | `Resetar` never disabled (`disabled = false`) | CG "sends the reset ... and disables Resetar" | ✅ Killed |
| G6 | `game/src/application/accountReset/accountReset.js` | talents not reloaded after 200 | accountReset.test "restarts the campaign ... and reads the talents again" | ✅ Killed |
| G7 | `game/src/application/accountReset/accountReset.js` | sends `session.chapter + 1` | accountReset.test "sends the reset from the chapter of the session" | ✅ Killed |
| G8 | `game/src/application/accountReset/accountReset.js` | 409 mismatch does not realign | accountReset.test "restarts the campaign at the stored progress of a chapter mismatch" | ✅ Killed |
| B1 | `backend/.../domain/AccountReset.kt:17` | completed reward `MAX_REWARD` → `MAX_REWARD - 1` | AccountResetTest, AccountResetServiceTest, AccountResetControllerIT "a completed campaign pays 5" | ✅ Killed |
| B2 | `backend/.../domain/AccountReset.kt:32` | check order swapped: locked checked before mismatch | AccountResetTest mismatch + warn logs, ServiceTest "repeated reset", ControllerIT "two racing resets" | ✅ Killed |
| B3 | `backend/.../adapter/repository/TalentRepository.kt:111` | talent point awards not deleted | ControllerIT "a reset wipes every talent level and talent point" | ✅ Killed |
| B4 | `backend/.../service/AccountResetService.kt:52` | resets not incremented (`maxOf(1, count)`) | ServiceTest "reset from chapter 3 ... resets 2", info-log test | ✅ Killed |
| B5 | `backend/.../service/AutoClickService.kt:51` | upgrade unlock ignores resets | AutoClickServiceTest "upgrade in chapter 1 applies once the player has reset", ControllerIT auto click test | ✅ Killed |
| B6 | `backend/.../adapter/web/ApiExceptionHandler.kt:104` | mismatch 409 body without `progress` | ControllerIT "409 RESET_CHAPTER_MISMATCH with the stored progress" | ✅ Killed |
| B7 | `backend/.../service/AccountResetService.kt:50` | existing crystals dropped (`crystals = reward`) | ControllerIT 200 answer + kept state, ServiceTest crystals 7 | ✅ Killed |
| B8 | `backend/.../domain/AutoClick.kt:42` | domain `autoClickUnlocked` ignores resets | AccountResetTest unlock, AutoClickServiceTest, ControllerIT | ✅ Killed |

Backend baseline in the worktree (`--tests '*Reset*' --tests '*AutoClick*'`, unmutated): exit 0. B6 first matched twice (another handler has the same expression) and did not apply. It was re-run with a unique anchor and killed. After every revert, `git status --porcelain` in the worktree was empty.

**Sensor depth**: expanded (≥5, this feature touches data integrity: crystals and a destructive reset)
**Result**: 16/16 killed (8 game, 8 backend), 0 survived - PASS ✅

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ It reuses `TalentRepositoryPort.deleteByUsername`, the progress lock and `ProgressResponse` |
| Surgical changes | ✅ Only reset files, `AutoClick*` unlock and wiring changed |
| No scope creep | ✅ No cooldown, no undo, no art |
| Matches patterns | ✅ Same `fromX` idempotency and 409 problem-body pattern as auto click and progress. Ports and adapters follow ADR 0007 |
| Spec-anchored outcome check | ✅ Exact texts, codes and values asserted (see tables) |
| Per-layer coverage | ✅ Domain 1:1, service, repository IT, controller IT (happy, 400, 409×2, 401, race), game unit and e2e |
| Every test maps to a requirement | ✅ The 401 test maps to the existing auth contract |
| Documented guidelines | ✅ kotlin-backend-ddd (domain/service tests, loggers in service/domain), CLAUDE.md |

Observation (not a spec AC): if a pre-reset outcome report is in flight when `restart` voids the queue, its late success runs `queue.shift()` on the new queue. This is the same exposure as the existing 409 realign path, and the server-side lock order keeps the backend consistent.

---

## Gate Check

- **Backend build**: `cd backend && ./gradlew cleanTest build` (forced rerun, the first run was cached). BUILD SUCCESSFUL, exit 0, ktlint clean. **832 tests, 0 failed, 0 errors, 0 skipped**. The feature suites: AccountResetTest 8, AccountResetServiceTest 10, ResetRepositoryIT 5, AccountResetControllerIT 10, AutoClickServiceTest 12, AutoClickControllerIT 11, AutoClickTest 19, AutoClickRepositoryIT 7.
- **Game unit**: `cd game && npx vitest run` (real tree): **65 files, 1250 passed, 0 failed**.
- **Game e2e**: `npx playwright test e2e/accountReset.spec.js e2e/autoClick.spec.js`: **6 passed, 0 failed**.
- **Test count delta (from the diff)**: backend +35 (8 + 10 + 5 + 10 + 2). Game +30 (domain 5, application 6, api 1, session 1, autoClickState 2, composition 1, ClickerGame 14). No test was removed. The only test edits are the `AutoClickServiceTest` constructor wiring and the `composition.test.js` key list, and both are additive.
- **Excluded pre-existing failures** (not this feature, at 7c9dd48): in a clean checkout, 3 `ClickerGame farm mode` unit tests (seen in the worktree sensor runs) and `e2e/farm.spec.js:82,109`. In the real tree, `e2e/bossMap.spec.js:54` and `talents.spec.js:111` fail because of the owner's untracked art. None of these were in the gate suites run here.

---

## Fix Plans (non-blocking follow-ups)

1. **Button AC-7 view-level evidence.** Add a ClickerGame assertion that after a 200 the `talents-badge` is hidden and the Talentos screen renders level 0 / 0 points. Priority: Minor.
2. **Farm edge case.** Add an IT that resets a chapter 3 player and then checks `GET /farm` lists no chapter 2+ boss (or a game test that opens the farm after a reset). Priority: Minor.
3. **Button AC-8 spec precision.** Reword the AC so that `RESET_LOCKED` carries no progress and needs no realignment, or add `progress` to the LOCKED body. Priority: Cosmetic.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| RESET-01 … RESET-10 | Implementing | ✅ Verified |
| RESET-11 | Implementing | ✅ Verified (AC-7 indirect, follow-up 1) |
| RESET-12 | Implementing | ✅ Verified (AC-8 spec-precision note) |
| RESET-13, RESET-14 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready (PASS). The minor follow-ups above are not blocking.

**Spec-anchored check**: 28/28 P1 ACs matched the spec outcome. Two criteria have indirect evidence (button AC-7, farm edge case) and one has a spec-precision gap (button AC-8 LOCKED).
**Sensor**: 16 mutations injected, 16 killed, 0 survived
**Gate**: backend 832/832, game unit 1250/1250, e2e 6/6
