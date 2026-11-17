# Boss Replay Chapters Validation

**Verdict**: PASS (round 1 of 3)
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
