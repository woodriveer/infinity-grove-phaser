# Boss Replay Chapters Validation

**Verdict**: FAIL (round 2 of 3, TD-009 scope: § Round 2 at the end of this file). Round 1: PASS.
**Date**: 2026-11-17
**Spec**: `.specs/features/boss-replay-chapters/spec.md` (with the PO rulings of `3be7bbe` phone chip row and `e4575da` two-line plate, timer placement and dot gap; T18 bound changed by the orchestrator ruling recorded in `tasks.md` T18)
**Diff range**: `9633d0f..b398ce6` (spec `021f33d` to the T19 tick `b398ce6`). Feature commits: `1a3c3d6 7c74035 19aab04 67f0f68 b55ff63 95553ea 9a2f6c7 3e6dab5 50d3039 40037ba 1dcc5ab 26d1747 46dd914 8224d6f 81df831 457c537 6ff9ee8 6f69802 e26eced 2cbfc1a b80c826 db5db80`, plus the docs commits `5f1b5e5 b4a4c16 3be7bbe e4575da f31884d b398ce6`. Commits of other features in the range (`ac3108f`, `de08ebe`, `caa2490`, `4cbad4c`, `fa225c5`, `1aa7901`, ui-redesign docs) are out of scope.
**Verifier**: independent sub-agent (author != verifier). No code or test was changed.

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1 to T13 | Done | `[x]` in `tasks.md`; one commit each (listed above) |
| T14 | Done | `b4a4c16`, findings #1 (high) and #2 (low) |
| T15 to T17 | Done | `e26eced`, `2cbfc1a`, `b80c826` |
| T18 | Done | `db5db80`; bound `chapterLine.top >= firstLineBaseline` by orchestrator ruling (Cinzel's content box reaches ~6.7 px under the baseline) |
| T19 | Done | `f31884d` re-review approved, `b398ce6` tick |

---

## Spec-Anchored Acceptance Criteria

Paths: `FBT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/domain/FarmBossTest.kt`, `FST` = `.../service/FarmServiceTest.kt`, `FCIT` = `.../adapter/web/FarmControllerIT.kt`, `e2e` = `game/e2e/bossReplayChapters.spec.js`, game unit files under `game/src/`.

### P1: Choose an earlier chapter on the map

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 | group `farm-chapters`, `aria-label="Escolher capítulo"`, text `Capítulo`, buttons 1-3, 3 pressed, 1-2 not | `e2e:99-107` `farm-chapter-3` `aria-pressed` `'true'`, `farm-chapter-4` count 0; `e2e:291-295` `role` `group`, `aria-label` `Escolher capítulo`, label `Capítulo`, chips 1 and 2 `'false'`; `adapters/phaser/views/farmView.test.js:182` `aria-pressed` `['false','false','true']` | PASS |
| 2 | chapter 1: no `farm-chapters` | `e2e:234` `farm-chapters` `toHaveCount(0)`; `farmView.test.js:177` `toBeNull()` for `[]` and `[1]` | PASS |
| 3 | completed: chips 1-15, no 16 | `e2e:256-257` `.farm-chapter` count 15, `farm-chapter-16` count 0; `FST:442` `(1..15).toList()` | PASS |
| 4 | click 2: `GET /farm?chapter=2`, title `Caminho do Capítulo 2`, 2 pressed | `e2e:306-308` method `GET`, search `?chapter=2`, title; `e2e:118-120`; `adapters/phaser/HeroUi.test.js:396` last `get` call `[2]`; `adapters/http/farmApi.test.js:53` `'/farm?chapter=2'` | PASS |
| 5 | earlier map: 11 `defeated`, no `current` | `e2e:119` `Array(11).fill('defeated')`; `domain/campaign/bossMap.test.js:85`; `farmView.test.js:231` | PASS |
| 6 | current map: MAP-01 states unchanged | `e2e:109` `['defeated' x3, 'current', 'locked' x7]`; `FBT:20` stages `[1,2,3]`; `e2e/bossMap.spec.js` unchanged in the range, 6/6 pass | PASS |
| 7 | current chip: `is-current`, `title="Capítulo atual"` | `e2e:106-107`; `farmView.test.js:195` (and not on chip 2) | PASS |
| 8 | HUD opening shows the current chapter | `e2e:211-212` title `Caminho do Capítulo 3`, chip 3 pressed after a chapter 2 visit; `HeroUi.test.js:474` last `get` call `[]` | PASS |
| 9 | pending: every chip disabled, previous map kept | `e2e:337-343` chips 1-3 disabled, opacity `0.45`, `not-allowed`, title chapter 3, chapter 3 states; `HeroUi.test.js:410`; `farmView.test.js:215` | PASS |
| 10 | failure: `Não foi possível carregar.`, map and pressed chip kept, chips enabled | `e2e:223-226`; `HeroUi.test.js:427` | PASS |
| 11 | pressed chip: no request | `e2e:321` `/farm` calls `before + 1` after pressed + chapter 2 clicks; `farmView.test.js:204` `onChapter` called once with 1 | PASS |
| 12 | earlier chapter boss: `<n> vitórias restantes hoje` shared, disabled at 0 | `e2e:198-199` chapter 1 boss disabled, `0 vitórias restantes hoje` with 10 spent; `e2e:121` `10 vitórias restantes hoje`; `farmView.test.js:239` | PASS |
| 13 | dot top 23 px, >= 2 px under the numeral baseline, one baseline on every chip (`padding-bottom: 3px`) | `e2e:553-555` `dotTop` `23`, `dotTop - baseline >= 2`, `|chip1.baseline - chip3.baseline| <= 0.5`; `e2e:402` `padding-bottom` `3px`; `e2e:420` `::after bottom` `1px` | PASS |

### P1: Fight an earlier chapter boss with its numbers and rewards

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 | health, defense, crit resistance, element, time limit of the chapter 2 definition | `e2e:132` `HP 2/2` (campaign miniboss 3 has 60), `e2e:134` `countdown.limitMs` `45_000`, `e2e:137-139` one fire click wins the nature boss; `domain/campaign/campaign.test.js:256` `farmEncounterOf` `toEqual` with `health 73`, `stats: S3`, `timeLimitMs 45_000`; `adapters/phaser/ClickerGame.test.js:2589` `maxHealth` `77`, `Time: 45` | PASS |
| 2 | `Rever chefe: Miniboss <s> (Capítulo <n>)` / `Rever chefe: Chefe do capítulo (Capítulo <n>)` | `e2e:131`, `e2e:152`; `campaign.test.js:251`; `ClickerGame.test.js:2589`, `:2659` | PASS |
| 3 | body `{ boss: { kind, stage }, outcome: 'CLEARED', chapter: n }`, same boss back | `e2e:140-141` exact body `chapter: 2`, label kept; `farmApi.test.js:60`, `:68` (no stage for the chapter boss); `ClickerGame.test.js:2613` `win` with `{ kind: 'MINIBOSS', stage: 3, chapter: 1 }`, health `77` after `advance` | PASS |
| 4 | current chapter: body without `chapter` | `e2e:169` exact body without `chapter`; `farmApi.test.js:76` `'chapter' in body` `false`; `HeroUi.test.js:454` `startFarm` with `{ kind, stage }` only | PASS |
| 5 | miniboss of stage s of chapter c: hero of c at `min(1, rate x s)` | `FST:465` `CardDrop("lyra", ...)`; `FST:593` `CardDrop("lyra", ...)` at a roll of 0.0599 and `FST:602` `assertNull` at 0.06, the exact boundary `0.02 x 3` of the test rates (`FST:49` `minibossRatePerStage = 0.02`); `FCIT:334` `drop.heroId` `lyra` | PASS |
| 6 | chapter boss of c: hero of `min(c + 1, 15)` at `chapter-boss-rate`, certain when c is not cleared | `FST:484` `orina` for chapter 2, wins left 9; `FST:496` `assertNull` at a roll of 0.30, the test `chapterBossRate` (`FST:49`), for a cleared chapter; `FST:507` certain card and `cleared` `{1, 2}`; `FST:622` chapter 15 drops `seraphine` (no chapter 16); `FCIT:350` | PASS |
| 7 | piece with the rarity tier of chapter c | `FST:516` `Rarity.UNCOMMON` for chapter 2 at chapter 3; `FST:526` `LEGENDARY` at chapter 15 with the same rolls; `FST:611` | PASS |
| 8 | one daily limit (10) over every chapter | `FST:539` `0` left after wins over chapters, `FST:542` `DailyLimitReachedException` on chapter 2; `FCIT:350` win of chapter 1 leaves 9, `GET /farm?chapter=2` answers 9; `e2e:188` | PASS |
| 9 | 409 `FARM_TOO_FAST` within 5000 ms whatever the chapter | `FST:551` `FarmTooFastException` for a chapter 2 win after a chapter 3 win; exception to 409 code pinned by the existing `FCIT:180` `code` `FARM_TOO_FAST` | PASS |
| 10 | chapter above current: 409 `BOSS_NOT_AVAILABLE`, nothing changes | `FST:560-564` exception, no card, no piece, wins left 10; `FCIT:374` status 409, `code` `BOSS_NOT_AVAILABLE`, `FCIT:381` one card copy (unchanged) | PASS |
| 11 | non-integer or < 1: 400 `chapter must be an integer of at least 1`, nothing changes | `FCIT:320` GET `0`, `-1`, `abc`, `2.5` `detail` exact; `FCIT:385` POST `0`, `"2"`, `2.5`; `FCIT:398` no card; `FST:447`, `FST:575`; `FBT:58` message text | PASS |
| 12 | position, completed flag, talent points never change | `FST:589` `assertEquals(atChapter3, ...)`; `FCIT:346` `[3, 4, "PHASE", false]`; `FCIT:416-418` `earnedPoints` 0 and position kept; `e2e:142` | PASS |
| 13 | last daily win of an earlier chapter: farm ends, reopens on that chapter, boss disabled, `0 vitórias restantes hoje` | `e2e:181-185`; `ClickerGame.test.js:2641` `farmBoss` null, last `get` `[1]`, title `Caminho do Capítulo 1`, disabled, `0 vitórias restantes hoje` | PASS |
| 14 | first line `Rever chefe: ...`, ` (Capítulo <n>)` in `span.stage-hud-chapter` on a second line, left-aligned, text = full label, plate <= 56 px tall, centre y 44 | `e2e:475-489` label text, span `' (Capítulo 2)'`, 14px, `rgb(107, 74, 43)`, plate left 156, centre y 44 +- 1, height <= 56, chapter line under the first line's baseline (T18 ruling), left edges within 1 px, both lines inside the plate; `e2e:501-508` for `(Capítulo 14)`; `views/stageLabel.test.js:24`, `:35`; `ClickerGame.test.js:2602` | PASS |
| 15 | timer left edge `max(512 - w/2, plateRight + 12)` +- 1, never over the plate, right edge left of `.wallet` | `e2e:76-80` `expectTimerBesidePlate`, used at `e2e:490`, `:509`, `:527`; `ClickerGame.test.js:1276` `0px`, `:1284` `15px`, `:1292` `83px`, `:1300` re-placed on a text change, `:1313` not re-placed within a second, `:1325`/`:1335` removed; UIR-04 AC 7 anchor `game/e2e/uiRedesign.spec.js:1781` passed | PASS |

Note on AC 5 and 6 rows: `FarmServiceTest` runs with `CardDropRates(minibossRatePerStage = 0.02, chapterBossRate = 0.30)` (`FST:49`), so the rolls at 0.0599 / 0.06 and 0.30 sit on the exact `rate x s` and `chapter-boss-rate` boundaries; the production values of `application.yaml` are pinned by the existing `CardRewards` tests.

### P2: Farm state per chapter on the API

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 | no `chapter`: `chapter` = current, `chapters` = `[1..current]`, `bosses`, `chapterBossWinsLeft`, `definition` in the `/progress` shape | `FCIT:277-282` `chapter` 3, `chapters` `[1,2,3]`, `bosses.stage` `[1,2,3]`, `definition.bossHealth` 32000, 10 stages, `stages[0].minibossHealth` 3200; `FST:406-409` | PASS |
| 2 | 1 <= c < current: `chapter` = c, minibosses 1-10 then the chapter boss | `FCIT:287` 11 bosses, `bosses[10].kind` `CHAPTER_BOSS`, `definition.bossHealth` 8000, `boss.element` `FIRE`, defense 35; `FST:413`; `FBT:10` stages `1..10` then the chapter boss | PASS |
| 3 | c > current: as for current | `FCIT:307` `chapter` 3 for `?chapter=9`; `FST:427` | PASS |
| 4 | c = current: today's `FarmBoss.beaten` | `FBT:20`; `FST:408`; existing `FCIT:80` unchanged | PASS |

### P2: Compatibility both ways

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| 1 | previous game without `chapter`: current chapter as before | `FCIT:365` `orina`; `FCIT:422` `null` chapter; `FST:476`; existing `FCIT:62`, `:80`, `:93` unchanged in the range and passing | PASS |
| 2 | previous backend: no selector, current chapter fights as today | `HeroUi.test.js:488` `farm-chapters` null, stop present; `application/farm/farmSession.test.js:115` chapter null, chapters `[]` | PASS |
| 3 | no Flyway migration | `git diff --name-only 021f33d b398ce6 -- backend/src/main/resources/db/migration` lists 0 files | PASS |

**Status**: 35/35 ACs covered with `file:line` evidence; 0 spec-precision gaps on the ACs (one on an unspecified interaction, below).

---

## Edge Cases

- [x] Chapter 2 at stage 1: chips `1`, `2`, chapter 2 empty, chapter 1 all defeated: `e2e:242-249`; `FBT:33`.
- [x] Completed at chapter 15: 11 defeated, no current: `e2e:357-358`; `FBT:41`.
- [x] Completed at 5, opened to 6: `GET /farm?chapter=5` 11 bosses: `FST:455` (`chapter` 5, 11 bosses).
- [x] `chapter` 2 with miniboss stage 11: 409: `FST:568-571` `BossNotAvailableException`.
- [x] Reset in another tab: next win 409, farm ends and reloads: `e2e:438-441`; backend side `FST:555`, `FCIT:374`.
- [x] 390 px phone: 15 chips inside the scaled map: `e2e:370-376` (left and right edges).
- [x] No definition of the picked chapter: no fight: `ClickerGame.test.js:2632` `farmBoss` null, campaign label kept.

---

## Discrimination Sensor

Run: `node scripts/sensor.mjs <scratchpad>/mutants.json --json <scratchpad>/sensor-out.json` from the repo root. Every command was first run on the unmutated tree and passed (Vitest files 9, 13, 125, 27, 412, 6 tests; the three Playwright scenarios 1 passed each; the four Gradle class filters `BUILD SUCCESSFUL`), so a kill is a test failure, not a broken command. A first attempt was invalid (exit 2: multi-line `find` strings missed the CRLF working tree, and `gradlew.bat` is not found by `cmd` without `.\`); its numbers are discarded and the run below is the valid one.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| B1 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Farm.kt` | the current chapter is treated as passed: every boss of it listed (P2-State AC 4, P1-Choose AC 6) | killed |
| B2 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/FarmService.kt` | GET /farm above the reached chapter is not clamped (P2-State AC 3) | killed |
| B3 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/FarmService.kt` | the card rolls the current chapter, not the fought one (P1-Fight AC 5, 6) | killed |
| B4 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/FarmService.kt` | the piece rolls the rarity of the current chapter (P1-Fight AC 7) | killed |
| B5 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/FarmController.kt` | POST /farm/outcome ignores the body chapter (P1-Fight AC 3, 10, 11) | killed |
| B6 | `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/FarmService.kt` | no explicit refusal of a chapter above the current one; a chapter above 15 reaches chapterOf (P1-Fight AC 10) | killed |
| G1 | `game/src/adapters/http/farmApi.js` | the win body always carries a chapter key (P1-Fight AC 4) | killed |
| G2 | `game/src/application/farm/farmSession.js` | the loaded chapter definition is not kept | killed |
| G3 | `game/src/adapters/phaser/HeroUi.js` | a stop of an earlier chapter starts the fight without its chapter (P1-Fight AC 1, 3) | killed |
| G4 | `game/src/adapters/phaser/HeroUi.js` | a failed chapter load shows no error (P1-Choose AC 10) | killed |
| G5 | `game/src/adapters/phaser/HeroUi.js` | the chips are not redrawn disabled while a chapter loads (P1-Choose AC 9) | killed |
| G6 | `game/src/adapters/phaser/views/farmView.js` | the pressed chip also asks for its chapter (P1-Choose AC 11) | killed |
| G7 | `game/src/adapters/phaser/views/farmView.js` | chapter 1 alone shows the selector (P1-Choose AC 2) | killed |
| G8 | `game/src/adapters/phaser/ClickerGame.js` | the last daily win reopens the current chapter, not the fought one (P1-Fight AC 13) | killed |
| G9 | `game/src/adapters/phaser/ClickerGame.js` | an earlier chapter boss fights with the campaign definition (P1-Fight AC 1) | killed |
| G10 | `game/src/adapters/phaser/ClickerGame.js` | the boss that comes back after a win uses the campaign definition (P1-Fight AC 3) | killed |
| G11 | `game/src/adapters/phaser/ClickerGame.js` | the timer push stays after the countdown hides (Visual Spec, timer row) | killed |
| G12 | `game/src/adapters/phaser/views/stageLabel.js` | a two-digit chapter stays on one line (P1-Fight AC 14) | killed |
| E1 | `game/public/style.css` | the dot back at 3px, touching the numeral (P1-Choose AC 13) | killed |
| E2 | `game/public/style.css` | the chapter tag on the same line as the label (P1-Fight AC 14) | killed |
| E3 | `game/public/style.css` | the timer is never pushed beside the plate (P1-Fight AC 15) | killed |

**Result**: 21 mutants, 21 killed, 0 survived, 0 invalid; isolation ok

Mutation detail and test command per mutant: B1 `Farm.kt:33` `<` to `<=` (`FarmBossTest`); B2 `FarmService.kt:45` drop the `minOf` clamp, B3 `:71` and B4 `:73` pass `progress.position.chapter` instead of `fought` (`FarmServiceTest`); B5 `FarmController.kt:86` chapter forced to null (`FarmControllerIT`); B6 `FarmService.kt:60` drop `fought > progress.position.chapter ||` (`FarmServiceTest` + `FarmControllerIT`); G-mutants one Vitest file each (`farmApi`, `farmSession`, `HeroUi`, `farmView`, `ClickerGame`, `stageLabel`); E1 `style.css:2714` `bottom: 1px` to `3px`, E2 `style.css:617` `column` to `row`, E3 `left: var(--timer-shift, 0px)` to `0px` (one `bossReplayChapters.spec.js` scenario each, `-g`).

B6 is killed by the three-chapter fixture of `FarmServiceTest` (`FST:78`): chapter 4 is not in it, so without the guard the report throws `ChapterNotFoundException` instead of `BossNotAvailableException`. Against the full seed (chapters 1 to 15) the guard only matters for a chapter above 15; no test sends one. Not a gap (AC 10 holds), recorded as context.

**Sensor depth**: lightweight plus (21 mutants over every new branch of the backend and the game, three CSS rules through e2e).
**Result**: 21/21 killed - PASS

---

## Gate Check

| Suite | Command | Result |
| --- | --- | --- |
| Backend | `cd backend && ./gradlew test --rerun` (the first `./gradlew test` was `UP-TO-DATE`, so it was rerun to execute) | 991 tests, 991 passed, 0 failed, 0 skipped (JUnit XML); `FarmBossTest` 7, `FarmServiceTest` 52, `FarmControllerIT` 27 |
| Game unit | `cd game && npm test` | 74 files, 1657 tests passed, 0 failed |
| e2e | `cd game && npx playwright test <files>` in 9 runs by spec file (uiRedesign split with `--shard=1/3..3/3`), project config, 3 workers, one run at a time | 343 tests: 342 passed, 1 failed (load flake, below), 0 skipped. Runs: feature + `farm` + `bossMap` 41/41 (7.0 min; `bossReplayChapters.spec.js` 26/26, `farm.spec.js` 9/9, `bossMap.spec.js` 6/6); `uiRedesign` 39 + 37 + 39; `dragEquip` + `accountReset` + `drops` + `elements` 37/38; `heroAscension` + `bulkSell` 39; `skillsAll` + `talents` + `auth` 42; `campaignChapters` + `autoClick` + `heroes` + `session` + `stages` 40; `clickPower` + `combatHud` + `equipment` + `equipmentUi` + `skills` + `wake` 28 |

- **Failures not caused by the feature**: `game/e2e/dragEquip.spec.js:586` `scrolls the window while a piece is held near its top edge` (expected `scrollTop` 0, got 172) in the 3-worker run; rerun alone twice with `--workers=1`: 1 passed (22.4 s), 1 passed (22.2 s). Load flake on the known list; the feature does not touch drag-to-equip.
- **Test count delta (from the feature commits' diffs)**: backend +42 (`FarmBossTest` 7, `FarmServiceTest` 19 + 4, `FarmControllerIT` 10 + 2; the second number of each is `8224d6f`), game unit +57 (`farmApi` 4, `farmSession` 7, `campaign` 6, `bossMap` 3, `farmView` 8, `HeroUi` 9, `ClickerGame` 14, `stageLabel` 6), e2e +26 (`bossReplayChapters.spec.js`). No test was deleted or weakened: `farm.spec.js` and `bossMap.spec.js` have no commit in the range; the only changed existing e2e line is `dot[2]` `'3px'` to `'1px'` (`e2e:420`), the spec's amended value.
- **Coverage percentages**: not measured by the Verifier (project rule: `gitops` measures them for `report.html`).

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | PASS: the chapter is threaded through the existing reward calls; `farmEncounterOf` is the moved body of `Campaign.farmEncounter` (same stage lookup) |
| Surgical changes | PASS: `mapLayout.js` untouched by the feature (only `ac3108f`, another fix); no migration; `deploy/regression.mjs` untouched |
| No scope creep | PASS |
| Matches patterns | PASS: `el()` views, `view` counter guard in `HeroUi`, ProblemDetail 400 via `IllegalArgumentException` |
| Spec-anchored outcome check | PASS (35/35) |
| Per-layer coverage expectation | PASS: domain branches of `beaten` 1:1 (`FBT`), service ACs 1:1 (`FST`), both routes happy + clamp + 400 + 409 (`FCIT`), every visible AC in e2e |
| Every test maps to a requirement | PASS: each new test names an AC, edge case or Visual Spec row |
| Documented guidelines followed | `CLAUDE.md`, `.claude/agents/verifier.md`, `tasks.md` Test Coverage Matrix |

---

## Finding outside the ACs (non-blocking, spec-precision gap)

**F1. A chapter load still pending when the panel is closed and reopened can leave the chips disabled.** `game/src/adapters/phaser/HeroUi.js:726-751` (`selectFarmChapter`): the chip load sets `this.farmBusy = true`; `close()` (`HeroUi.js:236`) and the HUD `show('farm')` (`HeroUi.js:154`) bump `this.view`. When the HUD load answers first, `render_farm` draws the chips with `busy: true`; when the old chapter load then answers, the `finally` clears `farmBusy` but skips the re-render (`view !== this.view`), so the chips stay disabled until the panel is reopened. The old answer also overwrites the session's `bosses`/`chapter` (`game/src/application/farm/farmSession.js:47-59`) under a map of the current chapter. The spec (P1-Choose AC 8, 9) does not say what a close does to a pending chapter load, and no test closes the panel during one. Severity: minor (closing and reopening the panel recovers). Proposed fix task for `game-dev` after a PO ruling: drop the stale answer (load guarded by the view, or `farmBusy` reset in `close()`/`show()`), with a `HeroUi.test.js` case "closing during a chapter load and reopening leaves the chips enabled on the current chapter".

---

## Requirement Traceability Update (for the product owner to apply in `spec.md`)

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| BRC-01 to BRC-09 | Pending | Verified |

---

## Summary

**Overall**: Ready. Every acceptance criterion and edge case has a test that asserts the spec's value, all suites pass (one known load flake, cleared by two solo reruns) and the sensor killed 21 of 21 mutants.

**Spec-anchored check**: 35/35 ACs matched the spec outcome; 0 spec-precision gaps on the ACs; 1 on an unspecified interaction (F1).
**Sensor**: 21/21 killed.
**Gate**: backend 991/991, game unit 1657/1657, e2e 342/343 (the 1 is the `dragEquip.spec.js:586` load flake).

**Next steps**: `product-owner` accepts against the spec and rules on F1 (fix task for `game-dev`, or accept as is); then `gitops`.

---

# Round 2 (TD-009 re-verification, BRC-10)

**Round 2 result**: FAIL (round 2 of 3)
**Date**: 2026-11-17
**Scope**: BRC-10, spec P1-Choose AC 14 and 15 and the five TD-009 edge cases (`2a271cc`), against T20 `37860dc` (`game/src/application/farm/farmSession.js`, `game/src/adapters/phaser/HeroUi.js`, `farmSession.test.js`, `HeroUi.test.js`) and T21 `4990872` (`game/e2e/support/fakeBackend.js`, three scenarios in `game/e2e/bossReplayChapters.spec.js`).
**Diff range**: `2a271cc..4990872`. Production code (`git diff --numstat`): `game/src/application/farm/farmSession.js` +17/-1, `game/src/adapters/phaser/HeroUi.js` +27/-8. No `backend/` file; `ClickerGame.js` unchanged.
**Verifier**: independent sub-agent (author != verifier). No code or test was changed. Abbreviations: `HUT` = `game/src/adapters/phaser/HeroUi.test.js`, `FST` = `game/src/application/farm/farmSession.test.js`, `E2E` = `game/e2e/bossReplayChapters.spec.js`.

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T20 | Done | `37860dc`; `git show --stat` lists only `farmSession.js`, `farmSession.test.js`, `HeroUi.js`, `HeroUi.test.js`, `tasks.md` (Done-when 3 holds) |
| T21 | Done | `4990872`; lists only `bossReplayChapters.spec.js`, `fakeBackend.js`, `tasks.md` |

## Pre-T20 check (the new tests must fail on the code before the fix)

Scratch worktree `git worktree add --detach .claude/worktrees/verifier-td009 HEAD`, then `git checkout 37860dc~1 -- game/src/application/farm/farmSession.js game/src/adapters/phaser/HeroUi.js` inside it (the T20 and T21 tests stay at HEAD), `game/node_modules` linked by a junction. Removed afterwards (junction first, then `git worktree remove --force`); the main tree's porcelain is unchanged.

| Run on pre-T20 code | Outcome |
| --- | --- |
| `npx playwright test e2e/bossReplayChapters.spec.js -g "<the three TD-009 scenarios>"` | 3 failed, 0 passed. `E2E:567` fails at `E2E:581` (`farm-chapter-1` disabled after the reopen), `E2E:595` at `E2E:614` (`farm-chapter-1` disabled after the late answer), `E2E:631` at `E2E:650` (`farm-chapter-1` disabled after Esc and the reopen) |
| `npx vitest run src/adapters/phaser/HeroUi.test.js src/application/farm/farmSession.test.js` | 10 of the 11 new cases fail (all 5 `FST` `cancel` cases, 5 of the 6 `HUT` cases); 139 passed. The one that passes, `HUT:619` `closing another screen keeps a farm load the scene started`, guards that the fix does not cancel too much, so it passes on the old code by design |

Every new e2e scenario discriminates the bug it was written for.

## Spec-Anchored Acceptance Criteria (BRC-10)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| P1-Choose AC 14, trigger `hero-close` | reopened map: `farm-chapter-3` pressed, every chip enabled, current chapter shown | `HUT:497` `chipsOf(ctx).some((chip) => chip.disabled)` false, title `Caminho do Capítulo 3`, `farm-chapter-3` `aria-pressed` `'true'`; `E2E:567` chips 1 to 3 `toBeEnabled()` (`E2E:581`), title, pressed, `states` equals `CURRENT_STOPS` (`E2E:583`) | PASS |
| P1-Choose AC 14, trigger Esc | same | `E2E:631` `page.keyboard.press('Escape')`, then chips 1 to 3 `toBeEnabled()` (`E2E:650`), title and `farm-chapter-3` pressed | PASS |
| P1-Choose AC 14, trigger "the game opens a panel screen over it" (scene `show('farm')`) | load dropped, chips enabled, current chapter | `HUT:600` `await ctx.ui.show('farm', {})`, chips enabled, title `Caminho do Capítulo 3`, `ctx.farm.chapter()` 3 after the late answer | PASS |
| P1-Choose AC 14, trigger: the player opens another panel screen over Rever chefes (HUD button; switching screens keeps the panel open, `HUT:121`) | the chapter request is dropped (`HeroUi.js:247-248` comment of `dropFarmLoad`: "Leaving Rever chefes or opening a screen over it") | no test; mutant S9 survives | GAP (G1) |
| P1-Choose AC 14, trigger: a click on a stop during the load | the request is dropped (the stop calls `close()`, `HeroUi.js:725`) | no test clicks a stop during a load; covered only through the shared `close()` path (S7, S10 killed) | GAP (G3, minor) |
| P1-Choose AC 15, success answer | farm state (bosses, wins left, chapter, chapters, definitions), title, stops, pressed chip, chip states, error line unchanged | `FST:142` `bosses` `[]`, `winsLeft` null, `chapter` null, `chapters` `[]`, `definitionOf(2)` null; `HUT:521` `farm.chapter()` 3, `bosses` `state3.bosses`, `definitionOf(2)` null, title, `farm-chapter-3` pressed, `farm-chapter-2` `'false'`; `E2E:595` pressed (`E2E:612`), `states` `CURRENT_STOPS` (`E2E:613`), `farm-chapter-1` enabled (`E2E:614`), session check by the busy render of chip 1 (`E2E:622`) | PASS |
| P1-Choose AC 15, failure answer | no error line, chips enabled, map kept | `FST:192` rejects with `ApiError`, state kept; `HUT:541` `.hero-error` hidden and `''`, chips enabled, title; `E2E:646` `.hero-error` `toBeHidden()` | PASS |

## Edge Cases (TD-009)

- [x] EC1 `hero-close` while chapter 2 is pending, reopen, late answer: `HUT:497`, `E2E:567` (before and after the answer, `E2E:581`, `E2E:590`); the later `farm-chapter-1` click keeps `Caminho do Capítulo 3` while chapter 1 loads: `E2E:595` (`E2E:622`, then `Caminho do Capítulo 1` at `E2E:626`).
- [x] EC2 failure after Esc: `E2E:631` (`E2E:646`, `E2E:650`); unit with `hero-close`: `HUT:541`.
- [x] EC3 a new request on the reopened map before the late answer: chips stay disabled until it answers, then the new chapter: `HUT:559` (chips all disabled after the stale answer, `selectFarmChapter(2)` sends nothing, then `Caminho do Capítulo 1`, pressed, chips enabled). No e2e scenario (G2).
- [x] EC4 the game reopens Rever chefes itself during a pending request: `HUT:600`. No e2e scenario (G2).
- [x] EC5 a scene reload after a refused farm win survives opening and closing another screen: `HUT:619` (`farm.chapter()` 3, `bosses` `state3.bosses`). Not player-visible by itself.

## Discrimination Sensor

Run: `node scripts/sensor.mjs <scratchpad>/mutants.json --json <scratchpad>/sensor-out.json` from the repo root, 12 mutants on the T20 code. S10 to S12 run through the T21 scenarios (`npx playwright test e2e/bossReplayChapters.spec.js -g "<scenario>"`), the others through one Vitest file (`HeroUi.test.js` or `farmSession.test.js`). Exit 1 (one survivor), isolation ok.

| Mutant | File | Note | Outcome |
| --- | --- | --- | --- |
| S1 | `game/src/application/farm/farmSession.js` | load keeps a late answer (generation check off) | killed |
| S2 | `game/src/application/farm/farmSession.js` | cancel() does nothing | killed |
| S3 | `game/src/adapters/phaser/HeroUi.js` | dropFarmLoad keeps farmBusy | killed |
| S4 | `game/src/adapters/phaser/HeroUi.js` | dropFarmLoad cancels when leaving any screen | killed |
| S5 | `game/src/adapters/phaser/HeroUi.js` | dropFarmLoad never cancels the session load | killed |
| S6 | `game/src/adapters/phaser/HeroUi.js` | show() does not drop the load | killed |
| S7 | `game/src/adapters/phaser/HeroUi.js` | close() does not drop the load | killed |
| S8 | `game/src/adapters/phaser/HeroUi.js` | chip finally ignores the view (stale load clears farmBusy, renders) | killed |
| S9 | `game/src/adapters/phaser/HeroUi.js` | show() drops after this.screen changes (reads the new screen) | survived |
| S10 | `game/src/adapters/phaser/HeroUi.js` | S7 through e2e | killed |
| S11 | `game/src/adapters/phaser/HeroUi.js` | S3 through e2e (Esc path) | killed |
| S12 | `game/src/application/farm/farmSession.js` | S1 through e2e | killed |

**S9** moves `this.dropFarmLoad()` in `show()` (`HeroUi.js:156`) below `this.screen = screen;`, so it reads the screen being opened instead of the one being left. With it, opening any other screen from the HUD while a chapter load is pending resets `farmBusy` but does not call `farm.cancel()`, and the late answer writes the chapter 2 `bosses`, `winsLeft`, `chapter`, `chapters` and definition into the session, which AC 15 says stay as they were. Every test passes because the only `show()`-over-farm test (`HUT:600`) opens `farm` over `farm`, where both orders cancel. The mutant is not equivalent: the trigger is reachable (`HUT:121` switches screens with the panel open; the HUD buttons call `this.show(id)`, `HeroUi.js:110`) and the comment of `dropFarmLoad` names this case.

**Sensor depth**: lightweight plus (12 mutants over every new branch of T20: the generation check, `cancel`, both `dropFarmLoad` calls and its two statements, the `finally` view check and the call order in `show()`; three repeated through e2e).
**Sensor**: 12 mutants, 11 killed, 1 survived (S9).

## Gate Check (round 2 scope)

| Suite | Command | Outcome |
| --- | --- | --- |
| Game unit | `cd game && npm test` | 74 files, 1668 tests passed, 0 failed (round 1: 1657; +11 = 5 `FST` + 6 `HUT`, the counts of T20 Done-when 1) |
| e2e (feature scope) | `cd game && npx playwright test e2e/bossReplayChapters.spec.js e2e/farm.spec.js e2e/bossMap.spec.js` (project config, 3 workers) | 44 passed, 0 failed (7.8 min): `bossReplayChapters.spec.js` 29 (26 + 3 new), `farm.spec.js` 9, `bossMap.spec.js` 6 |
| Backend | not run this round | no `backend/` file in `2a271cc..4990872`; round 1 991/991 |
| Full e2e | not run this round | the round returns FAIL; the full suites run once, in the round that returns PASS |

- **Failures not caused by the feature**: none.
- **Test integrity**: no existing test changed or deleted (the T20 and T21 diffs only add cases; `farm.spec.js` and `bossMap.spec.js` untouched).

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | PASS: a generation counter in the session and one `dropFarmLoad()` in `HeroUi`, as the T20 contract says |
| Surgical changes | PASS: only the files of the T20 and T21 contracts; `ClickerGame.js` unchanged |
| No scope creep | PASS |
| Matches patterns | PASS: reuses the `view` counter guard; `holdFarm` follows the other fake backend controls |
| Spec-anchored outcome check | PASS for every covered trigger and outcome; G1 and G3 are untested triggers of AC 14 |
| Every test maps to a requirement | PASS: each of the 14 new tests names AC 14, AC 15 or a TD-009 edge case |
| Documented guidelines followed | `CLAUDE.md`, `.claude/agents/verifier.md`, `tasks.md` Test Coverage Matrix |

## Gaps (ranked)

1. **G1 (surviving mutant S9, AC 14 and 15)**, owner `test-engineer`: add a `HeroUi.test.js` case in `describe('choosing a chapter')`, e.g. `opening another screen over Rever chefes during a chapter load drops that load`: open `farm`, click `farm-chapter-2` with the answer held, `await open(ctx, 'heroes')` (or click `hud-heroes`), resolve the chapter 2 answer, `await flush()`, then `expect(ctx.farm.chapter()).toBe(3)`, `expect(ctx.farm.bosses()).toEqual(state3.bosses)`, `expect(ctx.farm.definitionOf(2)).toBeNull()`. On S9 it must fail at `farm.chapter()`. No production change.
2. **G2 (spec success criterion "the player-visible ones an e2e scenario")**, owner `product-owner` to rule, then `test-engineer`: EC3 (a new chip load on the reopened map before the late answer) and EC4 (the game reopening Rever chefes after the last daily win during a chapter load) are player-visible and have unit tests only (`HUT:559`, `HUT:600`). T21 scoped e2e to EC1 and EC2. Either add the two scenarios (EC3 is a short extension of `E2E:595`: click `farm-chapter-1` under `holdFarm(1)` before `releaseChapter2()`) or record in the spec that unit coverage suffices for them.
3. **G3 (AC 14 trigger "a click on a stop")**, owner `test-engineer`, minor: no test clicks a stop while a chapter load is pending; the path is `onPick` then `close()` (`HeroUi.js:723-727`), whose drop S7 and S10 cover. One `HUT` case (click `farm-entry-miniboss-1` during a held chapter 2 load, resolve it, assert `farm.chapter()` 3 and `hooks.startFarm` called with a chapter 3 boss and no `chapter` field) closes it and can share the setup of G1.

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| --- | --- | --- |
| BRC-10 | Pending | Needs fix (G1; G2 waits for a PO ruling) |

## Summary

**Overall**: Not ready. The TD-009 fix works: the three new e2e scenarios fail on the code before T20 and pass on it, and 10 of the 11 new unit cases fail before T20. One trigger of AC 14, the player opening another screen over Rever chefes during a chapter load, has no test, and the sensor shows it (S9 survives).

**Spec-anchored check**: AC 15 and the `hero-close`, Esc and scene `show('farm')` triggers of AC 14 match the spec outcome; 2 triggers of AC 14 untested (G1, G3); 2 visible edge cases without e2e (G2).
**Sensor**: 11/12 killed (S9 survived).
**Gate**: game unit 1668/1668, e2e 44/44 (feature scope); backend not run (no backend change).

**Next steps**: `test-engineer` adds the G1 case (and G3 if bundled); `product-owner` rules on G2; then Verifier round 3: S9 re-run plus 1 to 3 new mutants, the game unit suite, the feature e2e files, and the full backend and e2e suites as the final gate.
