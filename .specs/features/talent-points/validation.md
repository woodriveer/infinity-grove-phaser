# Talent Points Validation

**Date**: 2026-10-22
**Spec**: `.specs/features/talent-points/spec.md`
**Diff range**: `6b49ab8..HEAD` (a9ad3df ... 7eb26a9), only the files of this feature. Commit 9fec6d7 also holds the owner's uncommitted `application.yaml` drop-rate edits (known, not part of the feature).
**Verifier**: independent sub-agent (author != verifier)
**Verdict**: PASS (re-verified after iteration 1: the surviving mutant h, removing the progress lock of the upgrade, is now killed 3 of 3 runs by the TalentControllerIT race tests, which pre-create the progress row; the P2 AC6 wording was fixed in spec.md)

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T3 | Done | One commit 9fec6d7 (documented in tasks.md) |
| T4 | Done | 4c5f8ca |
| T5 | Done | 5c3a5a9 |
| T6 | Done | 5e05b14 |
| T7 | Done | bad9c9a |
| T8 | Done | 7eb26a9 (e2e, fake backend, ADR 0011, AD-013) |

---

## Spec-Anchored Acceptance Criteria

Backend test paths are under `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, game paths under `game/`.

### P1: Earn talent points

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 phase first clear | `talentPoints` 1, earned +1 | `service/ProgressServiceTest.kt:204` `assertEquals(1, result.talentPoints)`; `:205` `assertEquals(1, earned())`; `adapter/web/ProgressControllerIT.kt:442` `.body("talentPoints", equalTo(1))` | PASS |
| AC2 miniboss | 2 | `service/ProgressServiceTest.kt:214` `assertEquals(2, result.talentPoints)`; `adapter/web/ProgressControllerIT.kt:456` `equalTo(2)`; `domain/TalentsTest.kt:56` `assertEquals(2, rules.award(...MINIBOSS...).points)` | PASS |
| AC3 chapter boss | 5 | `service/ProgressServiceTest.kt:224` `assertEquals(5, result.talentPoints)`; `adapter/web/ProgressControllerIT.kt:460` `equalTo(5)` | PASS |
| AC4 replay after failed miniboss | `talentPoints` 0, earned stays 1 | `service/ProgressServiceTest.kt:251` `assertEquals(0, replay.talentPoints)`; `:252` `assertEquals(1, earned())`; `adapter/web/ProgressControllerIT.kt:444` `equalTo(0)` | PASS |
| AC5 farm win | no points | `adapter/web/FarmControllerIT.kt:257` `assertEquals(0, talentRepository.earnedPoints("yan"))` | PASS |
| AC6 FAILED | 0 points | `service/ProgressServiceTest.kt:259` `assertEquals(0, service.report(...FAILED).talentPoints)`; `adapter/web/ProgressControllerIT.kt:471` `equalTo(0)` | PASS |
| AC7 409 refused | no points | `service/ProgressServiceTest.kt:270` `assertEquals(0, earned())`; `adapter/web/ProgressControllerIT.kt:472` `statusCode(409)` and `:475` `assertEquals(0, talentRepository.earnedPoints("yan"))` | PASS |
| AC8 per-player rows, cascade | isolation, FK cascade | `adapter/repository/TalentRepositoryIT.kt:62` (`earned points count only the awards of that player`) `assertEquals(1, ...)`/`assertEquals(5, ...)`; `:71` `assertFailsWith<DataAccessException>`; `:76` `assertEquals(0, repository.earnedPoints("yan"))` after `deleteById` | PASS |
| AC9 V5 legacy grant (levels 7 -> earned 7, available 0) | earned 7 | `adapter/repository/TalentPointsMigrationIT.kt:34` `assertEquals(7, repository.earnedPoints("yan"))` and the `legacy` row = 7. It runs only the INSERT of V5 against the schema Flyway built; `available` 0 is derived (`spent` = sum of levels) and not asserted in this test | PASS (indirect, noted) |

### P1: Spend points

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 tree of 9 + points | 9 talents, COMBO fields, `points` | `adapter/web/TalentControllerIT.kt:68` `talents.size() equalTo(9)`; `:92-94` label/unit/perLevel; `:95-97` `points.earned/spent/available` | PASS |
| AC2 new player | level 0, nextCost 1, points 0,0,0 | `adapter/web/TalentControllerIT.kt:85` `equalTo(List(9){0})`, `:87` `equalTo(List(9){1})`, `:95-97` | PASS |
| AC3 upgrade COMBO with 3 | level 1, value 5, spent 1, available 2 | `adapter/web/TalentControllerIT.kt:106-111` `equalTo(1)`, `equalTo(5)`, `equalTo(1)`, `equalTo(3)`, `equalTo(1)`, `equalTo(2)` | PASS |
| AC4 0 available | 409 `NOT_ENOUGH_TALENT_POINTS`, unchanged | `adapter/web/TalentControllerIT.kt:165` `.body("code", equalTo("NOT_ENOUGH_TALENT_POINTS"))`; `:167` `assertEquals(0, level("CLICK_DAMAGE"))` | PASS |
| AC5 wallet unchanged, no `wallet` | no wallet field | `adapter/web/TalentControllerIT.kt:112` `.body("wallet", nullValue())`; `:124` `assertEquals(5_000L, copper())` | PASS |
| AC6 mismatch | 409 `TALENT_LEVEL_MISMATCH` | `adapter/web/TalentControllerIT.kt:156` `equalTo("TALENT_LEVEL_MISMATCH")`; `:158` `assertEquals(3, level("CLICK_DAMAGE"))` | PASS |
| AC7 level 10 | 409 `TALENT_MAX_LEVEL`, nextCost null | `adapter/web/TalentControllerIT.kt:176` `equalTo("TALENT_MAX_LEVEL")`; `:183` `nullValue()`; `:185` `points.available equalTo(10)` | PASS |
| AC8 404 / 400 / 401 | codes | `adapter/web/TalentControllerIT.kt:192` `statusCode(404)` + `TALENT_NOT_FOUND`; `:200` `statusCode(400)` + `INVALID_TALENT_REQUEST`; `:216`, `:222` `statusCode(401)` | PASS |
| AC9 race | exactly one accepted; never overspend | `adapter/web/TalentControllerIT.kt:239` `assertEquals(listOf(200, 409), statuses.sorted())`; `:259` same for different talents. These do not pin the progress lock: see mutant h | PASS for the outcome, GAP for the lock |
| AC10 level 10 value | 50 | `adapter/web/TalentControllerIT.kt:147` `.body("talents[8].value", equalTo(50))` | PASS |

### P1: Combo cap in combat

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 level 4, streak 30 | 20 % | `game/src/domain/combat/combo.test.js:98` `expect(long.bonus).toBe(20)`; `game/src/adapters/phaser/ClickerGame.test.js:3136` `expect(comboHud(ctx)).toBe('Combo x30 · +20%')` and `:3139` `toBe('1.2')`; `game/src/domain/talents/talents.test.js:28` `expect(talentComboCap(tree({ COMBO: 4 }))).toBe(20)` | PASS |
| AC2 level 4, streak 12 | 12 % | `game/src/domain/combat/combo.test.js:99` `expect(short.bonus).toBe(12)`; `ClickerGame.test.js:3147` `toBe('Combo x12 · +12%')` | PASS |
| AC3 level 10, streak 60 | 50 % | `combo.test.js:107` `expect(combo.bonus).toBe(50)`; `ClickerGame.test.js:3155` `toBe('Combo x60 · +50%')` | PASS |
| AC4 level 0 / not loaded | 0 %, HUD empty | `combo.test.js:113` `expect(clicks(combo, 5)).toEqual([0,0,0,0,0])`; `ClickerGame.test.js:3163` `expect(comboHud(ctx)).toBe('')`, `:3164` `toBe('1')`; `:3173` not-loaded `toBe('')`; `talents.test.js:33-34` `talentComboCap(tree()).toBe(0)`, `talentComboCap([]).toBe(0)`; `game/e2e/talents.spec.js:140` `toHaveText('')` | PASS |
| AC5 upgrade keeps streak | new cap on next click | `combo.test.js:123-124` `expect(combo.streak).toBe(20)`, `expect(combo.bonus).toBe(10)`; `ClickerGame.test.js:3186` `toBe('1.1')`, `:3187` `toBe('Combo x11 · +10%')` | PASS |
| AC6 HUD text | `Combo x30 · +20%` at level 4 | `ClickerGame.test.js:3136` `toBe('Combo x30 · +20%')`; `game/e2e/talents.spec.js:149` `toHaveText('Combo x30 · +10%')` at COMBO 2 | PASS |

### P2: Talentos screen

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AC1 points line, 4 columns, COMBO card | texts | `game/src/adapters/phaser/views/talentsView.test.js:27` `toEqual(['Tempo','Quebra de defesa','Poder do clique','Combo'])`; `:44` `toBe('Pontos de talento: 7')`; `:38` `toBe('Limite de dano do combo')` | PASS |
| AC2 label, Nível, Efeito, button | texts | `talentsView.test.js:74` `toBe('Melhorar (1 ponto)')`; `:48-49` `'Efeito: nenhum'`, `'Efeito: +25%'` | PASS |
| AC3 buy with 1 point | fromLevel 0, `Nível 1/10`, `Pontos de talento: 0` | `game/src/adapters/phaser/HeroUi.test.js:433-436` `toHaveBeenCalledWith('COMBO', 0)`, `'Nível 1/10'`, `'Efeito: +5%'`, `'Pontos de talento: 0'`; `game/e2e/talents.spec.js:172-174` | PASS |
| AC4 0 points disables all | disabled whatever the wallet | `HeroUi.test.js:447` `.every((button) => button.disabled)).toBe(true)` with `wallet: 1_000_000`; `talentsView.test.js:100`; `e2e/talents.spec.js:97-98` `toBeDisabled()` | PASS |
| AC5 level 10 | `Nível máximo`, no button | `talentsView.test.js:111-112` `'Nível máximo'`, `toBeNull()`; `e2e/talents.spec.js:107-109` | PASS |
| AC6 failure texts and reload | texts; reload | `HeroUi.test.js:473` `'Pontos de talento insuficientes'`; `:489` `'Não foi possível melhorar o talento.'`, `:490` `list toHaveBeenCalledTimes(2)` after a 409, `:499` `toHaveBeenCalledTimes(1)` after a 500 | Spec-precision gap (below) |
| AC7 busy disables | all disabled | `HeroUi.test.js:456` `every(button => button.disabled) toBe(true)`; `talentsView.test.js:104` | PASS |
| AC8 tree unavailable | `Talentos indisponíveis` | `HeroUi.test.js:523` `toBe('Talentos indisponíveis')` | PASS |
| AC9 award notice | `+2 pontos de talento`, `+1 ponto de talento`, none for 0, tree reloaded | `ClickerGame.test.js:2381` `toBe('+2 pontos de talento')`, `:2382` `list.mock.calls.length toBe(reads + 1)`; `:2394` `'+1 ponto de talento'`; `:2406` `hidden toBe(true)`; `game/src/application/campaign/campaignSession.test.js:409` `expect(received).toEqual([ 2 ])`; replacement by a drop only as ordering: `campaignSession.test.js:~445` `expect(order).toEqual([ 'points', 'card', 'piece' ])` | PASS (the replace rule has no scene-level test) |
| AC10 no wallet price | none | `talentsView.test.js:81` `textContent not.toMatch(/prata\|cobre\|ouro/)` | PASS |

### Edge cases

- Chapter boss 5, then phase 1 of the next chapter pays 1: `service/ProgressServiceTest.kt:282` `assertEquals(1, result.talentPoints)`, `:283` `assertEquals(5 + 1, earned())` PASS.
- Two talents quickly, one request at a time: `HeroUi.test.js:456` PASS.

**Status**: all ACs covered; 1 spec-precision gap and 1 lock-pinning gap.

**Spec-precision gap (P2 AC6)**: the AC text says the tree reloads after "any other failure", but the Assumptions row and the tests (`HeroUi.test.js:490`, `:499`) reload only after a 409. The behavior matches the Assumptions row and the older `talents` spec; the AC wording is the imprecise part.

---

## Discrimination Sensor

Scratch: detached git worktree `D:\Developer\scratch-verify-tp` (node_modules junction), removed afterwards; `git status --porcelain` of the real tree is identical before and after.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| a | `backend/src/main/kotlin/.../domain/Talents.kt` (`TalentRules.award`) | MINIBOSS pays `pointsPerPhase` | Killed (5 failed: TalentsTest x2, ProgressServiceTest x3) |
| b | `backend/src/main/kotlin/.../service/ProgressService.kt:70` | `return award.points`, ignoring `paid` | Killed (ProgressServiceTest "last phase replayed after a failed miniboss pays nothing") |
| c | `backend/src/main/kotlin/.../domain/Talents.kt` (`PlayerTalents.upgrade`) | `if (available < cost)` -> `if (false)` | Killed (5 failed: TalentControllerIT x2, TalentsTest, TalentServiceTest x2) |
| d | `game/src/domain/combat/combo.js:20` | `Math.min(50, ...)` instead of `maxPercent` | Killed (combo.test.js, 4 failed) |
| e | `game/src/domain/talents/talents.js:43` | `talentComboCap` reads `CRIT_DAMAGE` | Killed (talents.test.js 1 failed; ClickerGame.test.js 16 failed) |
| f | `game/src/adapters/phaser/views/talentsView.js:27` | `button.disabled = busy` (ignores points) | Killed (talentsView.test.js "enables every button with 1 available point and disables every one with 0") |
| g | `backend/src/main/kotlin/.../service/ProgressService.kt:56` | award also on FAILED | Killed (2 failed in ProgressServiceTest) |
| h | `backend/src/main/kotlin/.../service/TalentService.kt:48` | remove `progressRepository.findForUpdate(username)` | **Survived** (`./gradlew test --tests '*Talent*' --tests '*ProgressServiceTest*'` BUILD SUCCESSFUL) |

Mutant h detail: the `TalentControllerIT` race tests (`:226`, `:245`) register a fresh player whose `progress` row does not exist yet, so the first `createIfAbsent` insert makes the other request wait on the unique key and serialises them by accident. With the row pre-created (a `GET /progress` before the race) and the lock removed, "two upgrades of different talents with one point accept exactly one" FAILED in 3 of 3 runs (points overspent), so the lock matters and the committed tests do not pin it. The in-memory fake (`Fakes.kt:139`) cannot observe a lock, and `TalentServiceTest.kt:84` only asserts the progress row exists.

**Sensor depth**: lightweight plus extras (8 mutants). **Result**: PASS, 8/8 killed after iteration 1 (mutant h killed 3 of 3 runs once the race tests pre-create the progress row).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code, no scope creep | PASS (the talent flow lost `onWallet`, `base-cost` and `growth`; no leftovers found) |
| Matches patterns (ports, use cases, ADR 0007 and 0010) | PASS |
| Spec-anchored outcome check | PASS except the AC6 precision gap |
| Every test maps to an AC | PASS |
| Guidelines | `kotlin-backend-ddd` layering followed; no project guideline file beyond the ADRs |
| A test pins the lock the spec promises (Lock row, spend AC9) | FAIL (mutant h) |

## Known design risks checked

- **Lock order**: `TalentService.upgrade` does `createIfAbsent` + `findForUpdate` on `progress` and afterwards touches only `player_talents` and `talent_point_awards`; `ProgressService.report` holds `progress` first and then `player_cards`. Same direction, no cycle, no `wallets` taken by talents. No defect, but the lock is untested (mutant h).
- **Award idempotency**: `TalentRepository.award` is `existsById` then `save`, not an atomic insert; it is safe only because `report` holds the `progress` row lock. A future caller outside that lock would hit the primary key instead of returning false. Low risk today.
- **V5 legacy grant**: key `legacy` cannot collide with position keys; `sum(level)` assumes cost 1 per level, which matches `cost-per-level` 1. The IT runs only the INSERT of V5 (the table comes from Flyway at context start), acceptable.
- **`talentPoints` only on the outcome response**: `ProgressControllerIT.kt:473` `getProgress()...body("talentPoints", nullValue())`.
- **Farm pays nothing**: `FarmControllerIT.kt:257` PASS; `FarmService` has no award call.

---

## Gate Check

- **Backend**: `APP_EQUIPMENT_MINIBOSSRATE=0.25 APP_CARDS_MINIBOSSRATEPERSTAGE=0.02 APP_CARDS_CHAPTERBOSSRATE=0.30 ./gradlew build` BUILD SUCCESSFUL (ktlint included); forced re-run of all tests (`./gradlew test --rerun`, 4m22s): 736 tests, 0 failed, 0 skipped, 0 errors.
- **Game unit**: `npm test` 57 files, 1151 tests passed, 0 failed.
- **e2e (subset)**: `npx playwright test e2e/talents.spec.js e2e/clickPower.spec.js e2e/heroes.spec.js` 25 passed.
- Test count before the feature was not measured; every touched test file has more insertions than deletions in `git diff --stat`.
- **Skipped**: none. **Failures**: none.

---

## Fix Plans

### Fix 1: Pin the progress lock of the talent upgrade (Major)

- **Root cause**: both race ITs start with no `progress` row, so the unique-key wait hides a missing `findForUpdate`.
- **Fix task**: in `TalentControllerIT.kt` create the progress first (`GET /progress` or `progressRepository.createIfAbsent`) before the two race tests (`:226`, `:245`). Verify by removing `progressRepository.findForUpdate(username)` in `TalentService.kt:48`: the test must fail.
- **Priority**: Major (data integrity: overspent points).

### Fix 2: Reword P2 AC6 (Minor, spec-precision)

State "reload after a 409" instead of "any other failure" in `spec.md`, to match the Assumptions row and the tests.

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| TPT-01, TPT-02, TPT-03, TPT-04, TPT-06, TPT-07 | Pending | Verified |
| TPT-05 (spend, refusals, race) | Pending | Needs Fix (lock not pinned, mutant h) |

---

## Summary

**Overall**: FAIL (not ready until Fix 1)

**Spec-anchored check**: all ACs matched the spec outcome; 1 spec-precision gap (P2 AC6)
**Sensor**: 7/8 mutations killed
**Gate**: backend 736 passed, game 1151 passed, e2e subset 25 passed

**What works**: first-clear awards (1/2/5, replay, failed, farm, refusal), the V5 legacy grant, the points-based spend with all refusals, the combo cap in the scene and the HUD, the Talentos screen and the award notice.

**Issues found**: mutant h (lock of the upgrade untested); AC6 wording.

**Next steps**: Fix 1, then re-verify.
