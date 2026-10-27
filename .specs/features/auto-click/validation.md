# auto-click Validation

**Date**: 2026-10-27
**Spec**: `.specs/features/auto-click/spec.md`
**Diff range**: `24bd85d..aa849f2` on main (7dae8ba, 5d21680, 803178a, 7e18969, de1e8fe, 031f38e, 8321ffd, 424cfda, 2b9b06e, fixes 8f4acde, 34e0132, docs aa849f2); verified at aa849f2 in a detached scratch worktree
**Verifier**: independent sub-agent (author != verifier)
**Iteration**: 2 of 3
**Verdict**: FAIL

---

## Iteration 1 gaps: re-check

| # | Gap (iteration 1) | Evidence now | Closed? |
| - | ----------------- | ------------ | ------- |
| 1 | G8 survived: the burst kept going after the kill | `game/src/adapters/phaser/ClickerGame.test.js:3818` `combo.streak).toBe(3)`, `:3819` `kills).toHaveBeenCalledTimes(1)` (spy on `clearEncounter`, `:3813`). G8 re-run: **killed** by "fires 5 clicks for a 10 s frame and stops the burst at the kill" | ✅ |
| 2 | AUTO-06 AC12 logs had no test and the refusals omitted the crystals | Code: `backend/.../domain/AutoClick.kt:67-73` (mismatch: sent, stored, crystals), `:80` (max level), `:85` (locked), `:89-96` (crystals, level, price), `:100-108` info (from, to, price, crystals left). Test: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/domain/AutoClickTest.kt:133` exact INFO line, `:146-151` exact four WARN lines, via `LogCapture.warns` (`LogCapture.kt:26`). Log mutants B11 (crystals dropped from the locked warn) and B12 (crystals dropped from the info) **killed** | ✅ |
| 3 | e2e switch click did not prove AUTO-04 AC6 | `game/e2e/autoClick.spec.js:49-55` wraps `scene.hitMonster`, which the pointer listener resolves late (`ClickerGame.js:155` `(pointer) => this.hitMonster(pointer)`), so the wrapper sees every canvas hit; `:59` `__pointerHits).toBe(0)`. Mutant E1a (switch `change` also calls `hitMonster`) **killed by the e2e** (Expected 0, Received 1) and by the unit test | ✅ |
| 4 | Boss FAILED edge case had no test | `ClickerGame.test.js:3822-3836`: miniboss of 1000 health runs out of time, FAILED realign fires (`timers.at(-1).callback()`), `:3833` `dead).toBe(false)`, `:3835` `texts.length).toBe(before + 1)` after 500 ms | ✅ |

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T8 | ✅ Done | as in iteration 1 |
| T9 Pin the burst kill | ✅ Done | 8f4acde |
| T10 Log crystals, assert logs | ✅ Done | 34e0132 |
| T11 e2e switch click + boss FAILED test | ✅ Done | 8f4acde |

---

## Spec-Anchored Acceptance Criteria

Paths: `CG.test` = `game/src/adapters/phaser/ClickerGame.test.js`; `AC.test` = `game/src/domain/combat/autoClick.test.js`; `ST.test` = `game/src/application/autoClick/autoClickState.test.js`; `PR.test` = `game/src/adapters/storage/autoClickPreference.test.js`; `VW.test` = `game/src/adapters/phaser/views/autoClickView.test.js`; `API.test` = `game/src/adapters/http/autoClickApi.test.js`; `e2e` = `game/e2e/autoClick.spec.js`; `DOM.test` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/domain/AutoClickTest.kt`; `IT` = `.../adapter/web/AutoClickControllerIT.kt`; `REPO.IT` = `.../adapter/repository/AutoClickRepositoryIT.kt`; `SVC.test` = `.../service/AutoClickServiceTest.kt`. All line numbers at aa849f2.

### P1: Auto click after chapter 1 (AUTO-01, AUTO-02, AUTO-03)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 one auto click per 500 ms | 0 at 499 ms, 1 at 500, 2 per 1000 | `AC.test:8-9`; `AC.test:25` `advance(1000)).toBe(2)`; `CG.test:3721` `texts).toHaveLength(2)`; `CG.test:3763` `health).toBe(10)` at 499 ms; `CG.test:3790` completed campaign; `e2e:33` | ✅ PASS |
| AC2 chapter 1: none, switch hidden | 0 hits, hidden | `CG.test:3771-3772`; `e2e:65`, `e2e:68` `health).toBe(1000)` | ✅ PASS |
| AC3 same hit as a manual click | equal damage, combo +1, crit 48, Lyra 2 crits | `CG.test:3736` `toBe(byHand)`; `CG.test:3723` `streak).toBe(2)`; `CG.test:3745`; `CG.test:3754-3755` | ✅ PASS |
| AC4 number at monster centre x | 670 | `CG.test:3722` `toEqual([670, 670])` | ✅ PASS |
| AC5 paused: no time, no click | 0 paused; 499 ms after resume still 0 | `CG.test:3798`, `:3802`, `:3804` | ✅ PASS |
| AC6 no monster **or** dead monster: no click | 0 further clicks in both states | Dead monster: `CG.test:3845` `texts).toHaveLength(1)`; burst stops at the kill `CG.test:3817-3819`. **No monster: no test.** Mutant N8 (drop `!this.monster` from the guard at `ClickerGame.js:293`) survives every auto click test; with it, every unlocked frame with `monster = null` throws a `TypeError` on `this.monster.dead` in the loop at `ClickerGame.js:302` once 500 ms accumulate: the respawn delay after a boss runs out of time (`bossTimedOut`, `ClickerGame.js:759`) and a completed campaign (`completeChapter`, `ClickerGame.js:608`) | ❌ GAP (no-monster half) |
| AC7 > 5 per frame: 5, keep the rest | 5, rest 7500 ms | `AC.test:31-36`; `CG.test:3810` | ✅ PASS |
| AC8 manual click kept, time not reset | 2 texts after 300 + click + 200 ms | `CG.test:3855` | ✅ PASS |
| AC9 ch 1 boss beaten → switch + auto click | visible, +1 hit at 500 ms | `CG.test:3946`, `:3957`, `:3959` | ✅ PASS |

### P1: Switch on the HUD (AUTO-04)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 checkbox `Auto clique` | visible, ` Auto clique` | `CG.test:3778-3779`; `VW.test:18` | ✅ PASS |
| AC2 on the first time | checked | `PR.test:15`; `CG.test:3780`; `e2e:39` | ✅ PASS |
| AC3 off → no click until on | 0 hits; 1 after back on | `CG.test:3864`; `CG.test:3876`; `e2e:63` `health).toBe(stopped)` | ✅ PASS |
| AC4 stored, restored on next open | `off` in `infinity-grove.auto-click`; next scene off | `PR.test:21-22`, `:31`; `CG.test:3865` `stored).toEqual([false])`; `CG.test:3877`; `CG.test:3885` | ✅ PASS |
| AC5 storage fails → on, keeps playing | `enabled()` true, no throw | `PR.test:37-38`, `:44` | ✅ PASS |
| AC6 the switch click does not hit | 0 hits from the switch | `CG.test:3864` `health).toBe(10)` after `change`; `e2e:59` `__pointerHits).toBe(0)` | ✅ PASS |

### P2: Crystals and speed upgrades (AUTO-05, AUTO-06)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 balance and level stored, 0 for all | 0 / 0 | `REPO.IT:29-31`; `IT:61-72` | ✅ PASS |
| AC2 GET answers the state, next null at 4 | `{0, 4, 500, 0, {1, 250, 10}}`; null at 4 | `IT:61-72`; `IT:76-89`; `IT:111-121`; `DOM.test:35` | ✅ PASS |
| AC3 intervals 500/250/150/100/50 | exact | `DOM.test:22`; `SVC.test:124-127` | ✅ PASS |
| AC4 prices 10/25/50/100 | exact | `DOM.test:27-30`; `IT:72`, `:89`, `:104` | ✅ PASS |
| AC5 upgrade takes price, level +1 | level 1, 250, 0, next `{2,150,25}` | `IT:93-107`; `DOM.test:55-64`; `SVC.test:62-69` | ✅ PASS |
| AC6 409 `NOT_ENOUGH_CRYSTALS`, unchanged | 409 + code, 9 crystals kept | `IT:125-132`; `DOM.test:93` | ✅ PASS |
| AC7 409 `AUTO_CLICK_MAX_LEVEL` | 409, unchanged | `IT:136-144`; `DOM.test:79` | ✅ PASS |
| AC8 409 `AUTO_CLICK_LOCKED` | 409, unchanged | `IT:148-155`; `DOM.test:86`, `:122-124` | ✅ PASS |
| AC9 409 `AUTO_CLICK_LEVEL_MISMATCH` + stored state | 409 + `autoClick` | `IT:159-173`; `DOM.test:69-74` | ✅ PASS |
| AC10 missing / negative → 400 | 400 `INVALID_AUTO_CLICK_REQUEST` | `IT:177-186` | ✅ PASS |
| AC11 racing upgrades → exactly one | `[200, 409]`, level 1, 990 | `IT:201-217` | ✅ PASS |
| AC12 log username, levels, crystals (info applied / warn rejected) | exact lines | `DOM.test:133` `assertEquals(listOf("Auto click upgraded username=yan from=1 to=2 price=25 crystals=5"), logs.infos)`; `DOM.test:146-151` the four refusal lines with username, level(s), crystals | ✅ PASS (note: a 400 `INVALID_AUTO_CLICK_REQUEST` logs only `upgrade requested username fromLevel` at info, `AutoClickService.kt:43`, and the generic `Business exception code=` warn; it is a malformed request, not one of the four refusals, so not counted as a gap) |
| AC13 game uses the answered interval | 50 ms → 2 hits per 100 ms | `CG.test:3902`, `:3906`; `ST.test:31` | ✅ PASS |

### P2: Crystals and upgrade on the HUD (AUTO-07)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| AC1 `<interval> ms` | `500 ms` | `CG.test:3781`; `VW.test:30`; `e2e:40` | ✅ PASS |
| AC2 `Cristais: <n>` | `Cristais: 0` | `CG.test:3782`; `VW.test:31`; `e2e:41` | ✅ PASS |
| AC3 `Melhorar: <ms> ms (<price> cristais)` | `Melhorar: 250 ms (10 cristais)` | `CG.test:3783`; `VW.test:32`; `e2e:42`; `CG.test:3924` | ✅ PASS |
| AC4 disabled while short | disabled 0/10, enabled 10/10 | `CG.test:3784`; `VW.test:33`, `:39`; `e2e:43` | ✅ PASS |
| AC5 no button at 4 | absent | `CG.test:3903`; `VW.test:53` | ✅ PASS |
| AC6 send shown level, disable, adopt answer | `upgrade(0)`, disabled, `250 ms`, 1 hit / 250 ms | `CG.test:3917`, `:3918`, `:3923`, `:3926`; `VW.test:45` | ✅ PASS |
| AC7 409 → backend state, its interval | `500 ms`, `Cristais: 4` | `CG.test:3938-3940`; `ST.test:75-76`, `:86-88` | ✅ PASS |
| AC8 load failure → 500 ms, nothing else | `500 ms`, no crystals, no button | `CG.test:3891-3896`; `ST.test:40-41`; `VW.test:59-61` | ✅ PASS |

**Status**: ❌ 1 AC partially without evidence (AUTO-01 AC6, "no monster" half); 41/42 ACs matched the spec outcome; 0 spec-precision gaps.

---

## Edge Cases

- [x] Monster dies mid-burst → no further click: `CG.test:3816-3819` (combo 3, one `clearEncounter`); G8 killed.
- [x] Leaving the scene stops the auto click: by construction, it runs only from `update` (`ClickerGame.js:639`). No test (Phaser stops calling `update`).
- [x] Boss FAILED → keeps running on the new monster: `CG.test:3822-3836`.
- [x] Chapter 2+ answered after chapter 1 → switch on next realign: `CG.test:3957`; N11 killed.

---

## Discrimination Sensor

Detached worktree of aa849f2 under the session scratchpad, `game/node_modules` junctioned (unlinked before removal). Game mutants ran against the 7 auto click test files (`ClickerGame.test.js`, `autoClick.test.js`, `autoClickState.test.js`, `autoClickPreference.test.js`, `autoClickView.test.js`, `autoClickApi.test.js`, `composition.test.js`; the 3 known farm failures excluded), switch mutants also against `npx playwright test e2e/autoClick.spec.js`. Backend mutants: `gradlew.bat test --tests *AutoClick*` (47 tests); a no-op control mutant survived as expected (runner valid).

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| G8 | `game/src/adapters/phaser/ClickerGame.js:302` | `&& !this.monster.dead` removed from the burst loop | ✅ (CG burst kill test) |
| E1a | `ClickerGame.js:222` | switch `change` also calls `hitMonster` | ✅ unit (2) + **e2e** (`e2e:59`) |
| E1b | `ClickerGame.js:222` | switch `change` also calls `strike(MONSTER.x)` | ✅ unit (2); e2e survives (it watches the pointer path only; the unit test pins this) |
| N1 | `game/src/domain/combat/autoClick.js:8` | completed campaign not unlocked | ✅ |
| N2 | `autoClick.js:25` | leftover time dropped after a click | ✅ |
| N3 | `ClickerGame.js:298` | interval from the backend not applied | ✅ |
| N4 | `game/src/application/autoClick/autoClickState.js` | 409 body state not adopted | ✅ |
| N5 | `game/src/adapters/storage/autoClickPreference.js` | always stores `on` | ✅ |
| N6 | `game/src/adapters/phaser/views/autoClickView.js:30` | disabled at crystals == price | ✅ |
| N7 | `ClickerGame.js:263` | in-flight upgrade guard removed | ⚪ Survived, equivalent for the spec: AUTO-07 AC6 asks for a disabled button, pinned at `CG.test:3918`; a disabled button gets no user click; backend AC11 also dedupes |
| N8 | `ClickerGame.js:293` | `!this.monster` dropped from the guard | ❌ **Survived** (AUTO-01 AC6 "no monster"; crashes `update` during the respawn delay after a boss timeout and on a completed campaign) |
| N9 | `game/src/adapters/http/autoClickApi.js:9` | body `{ level }` instead of `{ fromLevel }` | ✅ |
| N10 | `autoClickState.js` `load` | concurrent loads not shared (`??=` → `=`) | ⚪ Survived, no spec outcome (design comment only, "one request at a time") |
| N11 | `ClickerGame.js:235` | visibility follows the switch, not the unlock | ✅ |
| N12 | `autoClickView.js:24` | crystals shown only while a next upgrade exists (hidden at level 4) | ✅ |
| B11 | `backend/.../domain/AutoClick.kt:85` | crystals dropped from the locked warn | ✅ (DOM.test warn log) |
| B12 | `AutoClick.kt:101` | crystals dropped from the applied info | ✅ (DOM.test info log) |
| B13 | `AutoClick.kt:36` | completed campaign not unlocked | ✅ |
| B14 | `AutoClick.kt:16` | equal intervals accepted | ✅ |
| B15 | `AutoClick.kt:53` | `>=` → `>` for the top level | ✅ (6) |
| B16 | `service/AutoClickService.kt:50` | level not saved | ✅ (4) |
| B17 | `AutoClickService.kt:48` | chapter lock ignored (`unlocked = true`) | ✅ (3) |
| B18 | `adapter/web/AutoClickController.kt:59` | missing `fromLevel` defaults to 0 | ✅ |
| B19 | `adapter/web/ApiExceptionHandler.kt` | mismatch body without `autoClick` | ✅ |
| B20 | `adapter/repository/CrystalRepository.kt:30` | missing row reads 1 crystal | ✅ (3) |
| B21 | `AutoClickController.kt:36` | `maxLevel` = current level | ✅ |

**Sensor depth**: lightweight+ (currency path; every upgrade branch covered in iteration 1 and resampled here)
**Result**: 26 mutants, 23 killed, 1 survived with spec impact (N8), 2 survived as spec-equivalent (N7, N10) - FAIL ❌ (N8)

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (fix commits touch only the log lines and tests) |
| No scope creep | ✅ |
| Matches patterns | ✅ (`LogCapture` reused, `warns` added beside `infos`) |
| Spec-anchored outcome check | ⚠️ AUTO-01 AC6 no-monster half without evidence |
| Per-layer Coverage Expectation met | ⚠️ scene guard for a missing monster not tested |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed: `backend/build.gradle.kts` (ktlint), `game/vitest.config.js`, `game/playwright.config.js` | ✅ |

---

## Gate Check

- **Backend** `./gradlew build` (scratch, aa849f2): BUILD SUCCESSFUL; 797 tests, 0 failed, 0 skipped (iteration 1: 795; +2 log tests).
- **Game** `npx vitest run`: 1215 passed, 3 failed, 0 skipped (1218; iteration 1: 1217, +1 boss FAILED test). The 3 failures are the known farm tests that fail at HEAD independent of this feature.
- **Game** `npm run build`: exit 0 (chunk-size warning only).
- **e2e** `npx playwright test e2e/autoClick.spec.js`: 4 passed.
- **Test integrity**: fixes only add assertions and tests; nothing weakened.

---

## Fix Plans

### Fix 1 (Minor): pin "no monster" for AUTO-01 AC6 (surviving mutant N8)

- **Root cause**: the scene tests cover a dead monster (`CG.test:3838-3846`) but never run `update` while `this.monster` is null and the auto click is unlocked. That state exists during the respawn delay after a boss timeout (`bossTimedOut`, `ClickerGame.js:759`) and after a completed campaign (`completeChapter`, `ClickerGame.js:608`). The boss FAILED test (`CG.test:3822-3836`) fires the respawn callback right after the countdown ends, with no frame in between.
- **Fix task**: in `CG.test` 'keeps hitting the next monster after a boss runs out of time', before `ctx.timers.at(-1).callback()`, assert `ctx.scene.monster` is null, then `expect(() => ctx.scene.update(0, 1000)).not.toThrow()` and that `ctx.texts.length` did not grow.
- **Done when**: removing `!this.monster ||` from `ClickerGame.js:293` fails that test.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| AUTO-01 | ❌ Needs Fix (G8) | ❌ Needs Fix (AC6 no monster, N8); G8 closed |
| AUTO-02 | ✅ Verified | ✅ Verified |
| AUTO-03 | ✅ Verified | ✅ Verified |
| AUTO-04 | ✅ Verified (e2e AC6 weak) | ✅ Verified |
| AUTO-05 | ✅ Verified | ✅ Verified |
| AUTO-06 | ❌ Needs Fix (AC12) | ✅ Verified |
| AUTO-07 | ✅ Verified | ✅ Verified |

---

## Summary

**Overall**: ❌ Not Ready (one minor test gap)

**Spec-anchored check**: 41/42 ACs matched the spec outcome; AUTO-01 AC6 "no monster" without evidence; 0 spec-precision gaps
**Sensor**: 26 mutants, 23 killed, N8 survived (gap), N7 and N10 survived as spec-equivalent
**Gate**: backend 797 passed; game 1215 passed (3 known farm failures); e2e 4 passed; builds OK

**What works**: all four iteration 1 gaps are closed (G8 killed, AC12 logs exact and mutation-checked, e2e pointer counter kills the switch mutant, boss FAILED test).

**Issues found**: Fix 1 (no-monster guard untested).

**Next steps**: route Fix 1 to an implementer, then re-verify (iteration 3 of 3).
