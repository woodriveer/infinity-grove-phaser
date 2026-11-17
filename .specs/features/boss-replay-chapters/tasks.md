# Boss Replay Chapters Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/boss-replay-chapters/spec.md`
**Design**: `.specs/features/boss-replay-chapters/design.md`
**Status**: Approved by the owner on 2026-11-17 ("Aprovo os padrões"): every default of Q1 to Q8 accepted. T1 to T19 done (Phases 1 to 7): the T14 review asked for changes (finding #1 high, #2 low), fixed by T15 to T19 under the PO rulings of the spec Assumptions table (rows "UI review #1" and "UI review #2"). Verifier round 1 PASS (`5259af2`); accepted by the product owner on 2026-11-17 (§ Acceptance). Follow-up Phase 8 (TD-009, owner 2026-11-17 "Sim, corrija"): T20 (`game-dev`) and T21 (`test-engineer`) open, for BRC-10 (spec P1-Choose AC 14, 15).

Rules for every task:

- When `graphify-out/graph.json` exists, run `graphify query "<question>"` before the first search or source read; read raw files only for the lines the graph or the **Read first** list names. Paths are from the repository root. `<main>` is `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `<test>` is `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`.
- Line numbers drift: locate an edit by the function name or the exact text quoted, then use the number only as a hint.
- One task = one commit with the message under **Commit**, checked with `py -3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`. Never stage `CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/`, or `game/e2e/uiRedesign.spec.js` (the owner's uncommitted edits). If a file you must change already has uncommitted edits you did not make, STOP and report it.
- Never edit `game/src/adapters/phaser/views/mapLayout.js` and never assert a stop position number: a separate fix is recalibrating them.
- Mark the task `[x]` in this file in the same commit. Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main`.
- Never delete, skip or weaken an existing test. Every existing test named "unchanged" below must pass without an edit.
- Player-facing text is Portuguese and must match the spec character for character (`Capítulo`, `Escolher capítulo`, `Capítulo atual`, `Caminho do Capítulo <n>`, `Rever chefe: Miniboss <s> (Capítulo <n>)`, `Rever chefe: Chefe do capítulo (Capítulo <n>)`, `Não foi possível carregar.`, `<n> vitórias restantes hoje`).
- The 400 detail text is exactly `chapter must be an integer of at least 1`.
- Hero of each chapter for a FIRE start (every test below registers FIRE): chapter 1 `kael` "Kael Raizférrea", 2 `lyra` "Lyra Folhaveloz", 3 `orina` "Orina Brumaestrela", 4 `vex` "Vex Sombraespinho", 5 `seraphine` "Seraphine Aurora"; chapters 6 to 15 repeat that order.
- Seeded numbers used below (`ChapterDefinition.of(n)`): chapter 2 boss health 8000, boss defense 35, boss element FIRE, stage 1 miniboss health 800, drop rules 4/5/6; chapter 3 boss health 32000, stage 1 miniboss health 3200.

---

## Acceptance (product-owner, 2026-11-17)

**Verdict: ACCEPTED.** All 19 tasks are done, the Verifier round 1 gives PASS and the ui-artist re-review (T19) gives APROVADO. No new task of this feature.

**Evidence read**: `validation.md` round 1 (`5259af2`, diff range `9633d0f..b398ce6`): 35 of 35 ACs covered with `file:line` evidence, 7 of 7 edge cases, sensor 21 mutants and 21 killed (0 survived, 0 invalid, isolation ok), 0 spec-precision gaps on the ACs. Backend 991/991, game unit 1657/1657, e2e 342/343: the 1 failure (`dragEquip.spec.js:586`) passed alone twice with `--workers=1`, a load flake on the known list of `STATE.md` Handoff. No Flyway migration in the range. `ui-review.html` round 2 (`f31884d`): APROVADO, findings #1 (plate on two lines, timer beside it) and #2 (dot clear of the numeral) resolved on shots 03, 08, 09 and 01, 06, 07; 20 PNG files (10 shots x 2 projects).

**Spec goals** (`spec.md`, Goals):

| Goal | Evidence | Status |
| --- | --- | --- |
| 1. Chapters 1 to N on Rever chefes, any of them opens, the screen opens on the current chapter | P1-Choose AC 1 to 4, 8 (`e2e:99-120`, `:211-212`, `:256-257`, `:291-308`) | Met |
| 2. On an earlier chapter map, 10 minibosses and the chapter boss `defeated` and fightable | P1-Choose AC 5, 12 (`e2e:119`, `:121`, `:198-199`); `FCIT:287` 11 bosses | Met |
| 3. An earlier boss fights with its chapter's numbers and pays its chapter's rolls | P1-Fight AC 1, 5, 6, 7 (`e2e:132-139`, `FST:465`, `:484`, `:516`); sensor B3, B4, G9, G10 killed | Met |
| 4. One daily limit (10) and one 5 s interval over every chapter | P1-Fight AC 8, 9 (`FST:539-542`, `:551`, `FCIT:350`) | Met |
| 5. No migration; old game on new backend and new game on old backend both work | P2-Compat AC 1 to 3 (`FCIT:365`, `:422`, `HeroUi.test.js:488`, `farmSession.test.js:115`; 0 files under `db/migration`); `farm.spec.js` 9/9 and `bossMap.spec.js` 6/6 unchanged | Met |

**Success criteria**: chapter 2 miniboss 3 reached from the HUD through Rever chefes, chip `2`, stop `3` (`e2e:131`); every AC has a named test and every visible one a scenario in `bossReplayChapters.spec.js` (26 scenarios); `farm.spec.js`, `bossMap.spec.js`, `FarmServiceTest` and `FarmControllerIT` existing cases pass unchanged. All three met.

**Ruling on Verifier finding F1** (`HeroUi.js` `selectFarmChapter`, close the panel during a pending chapter load and reopen: the chips can stay disabled and the late answer overwrites the farm session; closing and reopening again clears it): not a gap of this spec, which says nothing about a close during a load. It does not block the release: it needs a close during a load, the panel recovers on the next reopen, and the late answer can only start a fight of a reached chapter that the backend accepts at that chapter's lower rewards. Logged as **TD-009** in `STATE.md` with the rule "closing Rever chefes cancels a pending chapter load; a late answer is ignored", for a `game-dev` fix task with a `HeroUi.test.js` case `closing during a chapter load and reopening leaves the chips enabled on the current chapter`.

**Edits made at acceptance**:

1. Spec traceability BRC-01 to BRC-09 set to Verified; Goals and Success Criteria ticked.
2. Spec Assumptions Q1 to Q8 set to confirmed: the owner accepted every default on 2026-11-17 ("Aprovo os padrões", AD-024); the Open questions line says so.
3. Spec Assumptions row "Verifier finding F1" added with the ruling above.

**Waiting for the owner's confirmation**: the F1 ruling (ship now, fix as TD-009). Nothing else: Q1 to Q8 are confirmed.

**Next step**: `gitops` releases `ui-redesign` and `boss-replay-chapters`: deploy check, `report.html` of each, `CHANGELOG.md`, release tag.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), the agent rules in `CLAUDE.md` and `.claude/agents/` (unit for service/domain, e2e for every player-visible behaviour), confirmed lessons L-010 (exact on-screen text) and L-039 (each edge case its own test). No coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Farm.kt`) | unit | Every branch of `beaten` (below, equal, above the current chapter, completed) and `reachedChapters` | `<test>/domain/FarmBossTest.kt` | `cd backend && ./gradlew test` |
| Backend service (`FarmService`) | unit | 1:1 to spec AC P1-Fight 5-12 and P2-State 1-4; every edge case of the spec that reaches the backend | `<test>/service/FarmServiceTest.kt` | `cd backend && ./gradlew test` |
| Backend web (`FarmController`) | integration (Testcontainers) | Both routes: happy path per chapter, clamp, every 400 and 409 of the design table | `<test>/adapter/web/FarmControllerIT.kt` | `cd backend && ./gradlew test` |
| Game http and application (`farmApi`, `farmSession`) | unit | Every request shape and every field of the answer, with and without the new fields | `game/src/adapters/http/farmApi.test.js`, `game/src/application/farm/farmSession.test.js` | `cd game && npm test` |
| Game domain (`campaign.js`, `bossMap.js`) | unit | Every label text; every branch of `farmEncounterOf` and `farmMapPosition` | `game/src/domain/campaign/*.test.js` | `cd game && npm test` |
| Game views and scene (`farmView`, `HeroUi`, `ClickerGame`) | unit (jsdom) | Every text, attribute, class, test id and state of the spec | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| Game CSS (`style.css`) | none | Checked by computed styles in T13 and by the `ui-artist` review (T14) | `game/public/style.css` | build gate |
| e2e | e2e (Playwright, fake backend) | Every player-visible AC of P1 (both stories) and the spec edge cases a player can see | `game/e2e/bossReplayChapters.spec.js` | `cd game && npx playwright test e2e/bossReplayChapters.spec.js` |
| UI review artefacts (`game/ui-review/*.shots.js`, `ui-review.html`) | none | Screenshots for the `ui-artist`; never part of the e2e suite (`ui-review.config.js`) | `game/ui-review/` | `cd game && npm run ui:shots -- bossReplayChapters` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After game tasks with unit tests only | `cd game && npm test` |
| Full | After backend tasks and e2e tasks | backend: `cd backend && ./gradlew ktlintCheck test`; e2e: `cd game && npx playwright test e2e/bossReplayChapters.spec.js e2e/farm.spec.js e2e/bossMap.spec.js` |
| Build | After each phase | `cd backend && ./gradlew build` (Phase 1); `cd game && npm test && npm run build` (Phases 2 to 4) |

Never run two suites at once in the same checkout, and never leave a suite running in the background.

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Phase 1 (backend) is pushed before any game task (design, Deploy Order).

### Phase 1: Backend farm per chapter

```
T1 → T2 → T3
```

### Phase 2: Game data and pure rules

```
T3 → T4 → T5 → T6 → T7
```

### Phase 3: Game screen and fight

```
T7 → T8 → T9 → T10 → T11
```

### Phase 4: e2e

```
T11 → T12 → T13
```

### Phase 5: UI review

```
T13 → T14
```

### Phase 6: UI review fixes (game)

```
T14 → T15 → T16 → T17
```

### Phase 7: UI review fixes (e2e and re-review)

```
T17 → T18 → T19
```

### Phase 8: TD-009 (a pending chapter load dropped on close)

```
T19 → T20 → T21
```

---

## Task Breakdown

### T1: Beaten bosses of any chapter and the reached chapters [x]

**Owner**: kotlin-backend-dev
**Goal**: `FarmBoss.beaten` answers the bosses of any chapter number, and a new `FarmBoss.reachedChapters` lists chapters 1 to the current one (BRC-01; spec P2-State AC 2-4).
**Where**: `<main>/domain/Farm.kt`
**Also changes**: `<test>/domain/FarmBossTest.kt` (new)
**Read first**: `<main>/domain/Farm.kt` (whole file, 52 lines), `<main>/domain/Progress.kt:10-35` (`ProgressPosition`, `Progress`), `<main>/domain/Chapter.kt:49-68` (`ChapterDefinition`, `stageCount`), `<test>/domain/BossRecordTest.kt` (domain test style)
**Depends on**: None
**Requirement**: BRC-01

**Contract**:

```kotlin
// Farm.kt, FarmBoss companion object (replaces beaten, adds the rest)
/** The 400 detail of a farm chapter that is not an integer of at least 1. */
const val CHAPTER_MESSAGE = "chapter must be an integer of at least 1"

/**
 * The bosses of [chapter] the player has beaten, in stage order. A chapter above the current one: none. A chapter below the current one,
 * or any chapter of a completed campaign: every miniboss, then the chapter boss. The current chapter: the miniboss of every stage below
 * the current one, and the miniboss of the current stage once the chapter boss is next.
 */
fun beaten(progress: Progress, chapter: ChapterDefinition): List<FarmBoss>

/** The chapters the player may farm: 1 to the current chapter of [progress]. */
fun reachedChapters(progress: Progress): List<Int> = (1..progress.position.chapter).toList()
```

`beaten` body:

```kotlin
val position = progress.position
if (chapter.number > position.chapter) return emptyList()
val passed = progress.completed || chapter.number < position.chapter
val minibosses =
    (1..chapter.stageCount).filter { stage ->
        passed || stage < position.stage || (stage == position.stage && position.encounter == Encounter.CHAPTER_BOSS)
    }
val chapterBoss = if (passed) listOf(FarmBoss(Encounter.CHAPTER_BOSS)) else emptyList()
return minibosses.map { FarmBoss(Encounter.MINIBOSS, it) } + chapterBoss
```

`FarmState` and `FarmResult` do not change in this task.

**Steps**:

1. Add `CHAPTER_MESSAGE` to the `FarmBoss` companion object.
2. Replace the body and the KDoc of `beaten` with the contract above.
3. Add `reachedChapters` below `beaten`.
4. Create `FarmBossTest.kt` (package `br.com.woodriver.infinity_grove_ws.domain`) with the cases below.

**Tests**: unit
**Test cases** (`<test>/domain/FarmBossTest.kt`; `at3 = Progress("yan", ProgressPosition(3, 4, Encounter.PHASE, 1))`):

- `a chapter below the current one has every miniboss and the chapter boss beaten`: `FarmBoss.beaten(at3, ChapterDefinition.of(2))` has size 11, `take(10).map { it.stage } == (1..10).toList()`, every one of the 10 has kind `MINIBOSS`, and `last() == FarmBoss(Encounter.CHAPTER_BOSS)`.
- `the current chapter keeps the rule of the stage`: `FarmBoss.beaten(at3, ChapterDefinition.of(3)).map { it.stage } == listOf(1, 2, 3)`, all `MINIBOSS`.
- `a chapter above the current one has no boss beaten`: `FarmBoss.beaten(at3, ChapterDefinition.of(4)) == emptyList<FarmBoss>()`.
- `the current chapter at its first phase has no boss beaten but the chapter before has all eleven`: `p = Progress("yan", ProgressPosition(2, 1, Encounter.PHASE, 1))`; `beaten(p, of(2))` is empty and `beaten(p, of(1))` has size 11.
- `a completed campaign has all eleven bosses of chapter 15 and of chapter 14 beaten`: `p = Progress("yan", ProgressPosition(15, 10, Encounter.CHAPTER_BOSS, 1), completed = true)`; `beaten(p, of(15)).size == 11` and `beaten(p, of(14)).size == 11`.
- `the reached chapters run from 1 to the current chapter`: `reachedChapters(at3) == listOf(1, 2, 3)`; `reachedChapters(Progress.start("yan")) == listOf(1)`; for the completed `p` above `(1..15).toList()`.
- `the chapter message is the 400 detail of the spec`: `FarmBoss.CHAPTER_MESSAGE == "chapter must be an integer of at least 1"`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 7 new cases pass; every existing `FarmServiceTest` and `FarmControllerIT` case passes unchanged.
- [x] `git diff --stat` lists only `Farm.kt`, `FarmBossTest.kt` and `tasks.md`.

**Commit**: `feat(backend): list the beaten bosses of any reached chapter`

---

### T2: Farm state and farm report of a chosen chapter [x]

**Owner**: kotlin-backend-dev
**Goal**: `FarmService.state` answers any reached chapter with its definition, and `FarmService.report` rolls the card and the piece of the fought chapter, with one shared daily limit and one farm interval (BRC-01, BRC-02; spec P1-Fight AC 5-12, P2-State AC 1-4).
**Where**: `<main>/service/FarmService.kt`
**Also changes**: `<main>/domain/Farm.kt` (`FarmState`), `<main>/usecase/FarmUseCase.kt`, `<test>/service/FarmServiceTest.kt`
**Read first**: `FarmService.kt` (whole file, 89 lines), `FarmUseCase.kt` (whole), `<main>/service/CardRewards.kt:36-65`, `<main>/service/EquipmentRewards.kt:26-48`, `<test>/service/FarmServiceTest.kt:43-92` (fixture: `farmWith`, `player`, `at`, `blank`) and `:336-391` (equipment cases)
**Depends on**: T1
**Requirement**: BRC-02

**Contract**:

```kotlin
// Farm.kt
/** The bosses of [chapter] to choose from, the chapter boss wins left today, the chapters the player may farm and the chapter's numbers. */
data class FarmState(
    val bosses: List<FarmBoss>,
    val chapterBossWinsLeft: Int,
    val chapter: Int,
    val chapters: List<Int>,
    val definition: ChapterDefinition,
)

// FarmUseCase.kt
interface GetFarmUseCase {
    /** The farm of [chapter] (null: the current chapter; above the current one: the current one). */
    fun state(username: String, chapter: Int? = null): FarmState
}
interface ReportFarmUseCase {
    /** Applies the [outcome] of a farm fight against [boss] of [chapter] (null: the current chapter). The campaign position never changes. */
    fun report(username: String, boss: FarmBoss, outcome: Outcome, chapter: Int? = null): FarmResult
}

// FarmService.kt (overrides declare no default; they inherit it)
override fun state(username: String, chapter: Int?): FarmState
override fun report(username: String, boss: FarmBoss, outcome: Outcome, chapter: Int?): FarmResult
```

Rules, in this order:

- Both methods start with `require(chapter == null || chapter >= 1) { FarmBoss.CHAPTER_MESSAGE }`.
- `state`: `progress = loadProgress(username)`, `cards = loadCards(username)`, `current = progress.position.chapter`, `listed = minOf(chapter ?: current, current)`, `definition = chapterOf(listed)`; return `FarmState(FarmBoss.beaten(progress, definition), winsLeft(cards), listed, FarmBoss.reachedChapters(progress), definition)`.
- `report`: `fought = chapter ?: progress.position.chapter`. If `fought > progress.position.chapter || boss !in FarmBoss.beaten(progress, chapterOf(fought))` log the warn and throw `BossNotAvailableException(boss.label())` (the `>` check comes first, so chapter 16 never reaches the repository). Everything after is today's code with `progress.position.chapter` replaced by `fought` in `rewards.award(...)` and `equipmentRewards.award(...)`.
- `chapterOf(progress: Progress)` becomes `chapterOf(number: Int)`: `chapterRepository.findByNumber(number) ?: throw ChapterNotFoundException(number)`.
- Logs: `"Getting farm state username={} chapter={}"`, `"Reporting farm outcome username={} boss={} chapter={} outcome={}"`, `"Farm report rejected, boss not beaten username={} boss={} chapter={}"` (the last one with `fought`).

**Steps**:

1. Add the three fields to `FarmState` (`Farm.kt`) as above.
2. Add the `chapter` parameters with the KDoc to both interfaces in `FarmUseCase.kt`.
3. Change `chapterOf` to take a number, then rewrite `state` and `report` in `FarmService.kt` per the rules.
4. In `FarmServiceTest.kt` add `private val atChapter3 = Progress("yan", ProgressPosition(3, 4, Encounter.PHASE, 1))`, `private val firstThree get() = farmWith(ChapterDefinition.of(1), ChapterDefinition.of(2), ChapterDefinition.of(3))` and `private fun cleared() = playerCards.cards.getValue("yan").bosses.clearedChapters`, then the cases below. Import `Rarity` if needed.
5. `cd backend && ./gradlew ktlintCheck test`; `FarmController` compiles unchanged because the use case parameters have defaults.

**Tests**: unit
**Test cases** (`<test>/service/FarmServiceTest.kt`; unless stated, `player(atChapter3, BossRecord(clearedChapters = setOf(1, 2)))` and the service is `firstThree`):

- `state lists the current chapter by default with every reached chapter`: `state("yan")` has `chapter == 3`, `chapters == listOf(1, 2, 3)`, `bosses.map { it.stage } == listOf(1, 2, 3)`, `definition == ChapterDefinition.of(3)`.
- `state of an earlier chapter lists its ten minibosses, its chapter boss and its definition`: `state("yan", 2)` has `chapter == 2`, `chapters == listOf(1, 2, 3)`, `bosses.size == 11`, `bosses.last() == chapterBoss`, `definition == ChapterDefinition.of(2)`, `chapterBossWinsLeft == 10`.
- `state of a chapter above the reached one answers the reached chapter`: `state("yan", 9)` has `chapter == 3` and `bosses.map { it.stage } == listOf(1, 2, 3)`.
- `state of a completed campaign reaches chapters 1 to 15`: `player()` (completed fixture) with `service`; `state("yan")` has `chapters == (1..15).toList()` and `chapter == 15`.
- `state refuses a chapter below 1`: `assertFailsWith<IllegalArgumentException> { firstThree.state("yan", 0) }.message == "chapter must be an integer of at least 1"`.
- `a player opened from chapter 5 to chapter 6 farms all eleven bosses of chapter 5`: `player(Progress("yan", ProgressPosition(5, 10, Encounter.CHAPTER_BOSS, 1), completed = true))`, `farmWith(ChapterDefinition.of(5), ChapterDefinition.of(6)).state("yan", 5)` has `chapter == 5` and `bosses.size == 11`.
- `an earlier chapter miniboss farm win drops the hero of that chapter`: `chance = SequenceChanceRoller(0.0)`; `report("yan", miniboss3, Outcome.CLEARED, 2).drop == CardDrop("lyra", "Lyra Folhaveloz", 0)` and `blank("lyra") == 1`.
- `a report without a chapter fights the current chapter`: `chance = SequenceChanceRoller(0.0)`; `report("yan", miniboss3, Outcome.CLEARED).drop?.heroId == "orina"`.
- `an earlier chapter boss farm win drops the hero of the next chapter and counts for today`: `chance = SequenceChanceRoller(0.2999)`; `report("yan", chapterBoss, Outcome.CLEARED, 2)` has `drop?.heroId == "orina"` and `chapterBossWinsLeft == 9`; `cleared() == setOf(1, 2)`.
- `an earlier chapter boss farm win at a roll of thirty percent drops nothing`: `chance = SequenceChanceRoller(0.30)`; `report("yan", chapterBoss, Outcome.CLEARED, 2).drop` is null and `chapterBossWinsLeft == 9`.
- `an earlier chapter boss missing from the cleared chapters drops its card for certain and is recorded`: `player(atChapter3, BossRecord(clearedChapters = setOf(1)))`, `chance = SequenceChanceRoller(0.99)`; `report("yan", chapterBoss, Outcome.CLEARED, 2).drop?.heroId == "orina"` and `cleared() == setOf(1, 2)`.
- `an earlier chapter boss rolls the rarity of that chapter`: `equipmentChance = SequenceChanceRoller(0.0, 0.99)`; `report("yan", chapterBoss, Outcome.CLEARED, 2).equipmentDrop!!.piece.rarity == Rarity.UNCOMMON`.
- `the same rolls at chapter 15 give a legendary piece`: `player()`, `equipmentChance = SequenceChanceRoller(0.0, 0.99)`; `service.report("yan", chapterBoss, Outcome.CLEARED).equipmentDrop!!.piece.rarity == Rarity.LEGENDARY`.
- `chapter boss wins of every chapter share one daily limit`: `player(atChapter3, BossRecord(setOf(1, 2), today, 9, null))`; `report("yan", chapterBoss, Outcome.CLEARED, 1).chapterBossWinsLeft == 0`; then `clock.millis += 5000` and `assertFailsWith<DailyLimitReachedException> { report("yan", chapterBoss, Outcome.CLEARED, 2) }`.
- `the farm interval spans chapters`: `report("yan", miniboss3, Outcome.CLEARED, 1)`; `clock.millis += 4999`; `assertFailsWith<FarmTooFastException> { report("yan", miniboss3, Outcome.CLEARED, 2) }`.
- `a boss of a chapter above the current one is not available and changes nothing`: `chance = SequenceChanceRoller(0.0)`, `equipmentChance = SequenceChanceRoller(0.0)`; `assertFailsWith<BossNotAvailableException> { report("yan", miniboss3, Outcome.CLEARED, 4) }`; then `blank("vex") == 0`, `equipment.pieces.isEmpty()`, `state("yan").chapterBossWinsLeft == 10`.
- `a miniboss of stage 11 of an earlier chapter is not available`: `assertFailsWith<BossNotAvailableException> { report("yan", FarmBoss(Encounter.MINIBOSS, 11), Outcome.CLEARED, 2) }`.
- `a report refuses a chapter below 1`: `assertFailsWith<IllegalArgumentException> { report("yan", miniboss3, Outcome.CLEARED, 0) }.message == "chapter must be an integer of at least 1"`.
- `an earlier chapter farm report never changes the campaign position`: `report("yan", miniboss3, Outcome.CLEARED, 2)`; `progresses.findForUpdate("yan") == atChapter3`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 19 new cases pass; every existing `FarmServiceTest` case passes unchanged (including `a player completed at chapter 5 cannot report a chapter 5 boss win as a farm win once chapter 6 is open`, which still sends no chapter).
- [x] `git diff` touches no file under `backend/src/main/resources/db/migration`.

**Commit**: `feat(backend): farm the bosses of any reached chapter with its rewards`

---

### T3: `chapter` on both farm routes [x]

**Owner**: kotlin-backend-dev
**Goal**: `GET /farm?chapter=<n>` and `POST /farm/outcome` with `"chapter": <n>` reach the T2 service, and `GET /farm` answers `chapter`, `chapters` and `definition` (BRC-01, BRC-02, BRC-07; spec P2-State AC 1-4, P1-Fight AC 10-11, P2-Compatibility AC 1).
**Where**: `<main>/adapter/web/FarmController.kt`
**Also changes**: `<test>/adapter/web/FarmControllerIT.kt`
**Read first**: `FarmController.kt` (whole, 85 lines), `<main>/adapter/web/ProgressController.kt:68-86` (`ChapterResponse`), `FarmControllerIT.kt:19-60` (helpers `register`, `asUser`, `progressAt`, `win`) and `:177-198` (malformed body case)
**Depends on**: T2
**Requirement**: BRC-01

**Contract**:

```kotlin
data class FarmStateResponse(
    val chapter: Int,
    val chapters: List<Int>,
    val bosses: List<FarmBossResponse>,
    val chapterBossWinsLeft: Int,
    val definition: ChapterResponse,
) {
    companion object {
        fun from(state: FarmState) =
            FarmStateResponse(
                chapter = state.chapter,
                chapters = state.chapters,
                bosses = state.bosses.map(FarmBossResponse::from),
                chapterBossWinsLeft = state.chapterBossWinsLeft,
                definition = ChapterResponse.from(state.definition),
            )
    }
}

@GetMapping
fun get(principal: Principal, @RequestParam(name = "chapter", required = false) chapter: String?) =
    FarmStateResponse.from(getFarm.state(principal.name, parseQueryChapter(chapter)))

// outcome(): reportFarm.report(principal.name, boss, outcome, parseBodyChapter(body["chapter"]))

private fun parseQueryChapter(text: String?): Int? =
    text?.let { it.toIntOrNull()?.takeIf { number -> number >= 1 } ?: throw IllegalArgumentException(FarmBoss.CHAPTER_MESSAGE) }

private fun parseBodyChapter(value: Any?): Int? =
    when (value) {
        null -> null
        is Int -> value.also { require(it >= 1) { FarmBoss.CHAPTER_MESSAGE } }
        else -> throw IllegalArgumentException(FarmBoss.CHAPTER_MESSAGE)
    }
```

`FarmResultResponse` does not change. Import `org.springframework.web.bind.annotation.RequestParam`.

**Steps**:

1. Replace `FarmStateResponse` as above.
2. Add the `chapter` parameter to `get` and the two parse functions; pass `parseBodyChapter(body["chapter"])` in `outcome`.
3. In `FarmControllerIT.kt` add a parameter `chapter: Any? = null` to `win(...)`: the body becomes `{"boss":$boss,"outcome":"$outcome"}` when null, else `{"boss":$boss,"outcome":"$outcome","chapter":$chapter}` (pass `"\"2\""` for a string, `2.5` for a decimal).
4. Write the cases below; `progressAt(4, "PHASE", chapter = 3)` is the chapter 3 player.

**Tests**: integration
**Test cases** (`<test>/adapter/web/FarmControllerIT.kt`):

- `GET farm answers the current chapter, the reached chapters and the chapter definition`: `register()`, `progressAt(4, "PHASE", chapter = 3)`; `GET /farm` 200 with `chapter` 3, `chapters` `[1, 2, 3]`, `bosses.stage` `[1, 2, 3]`, `definition.bossHealth` 32000, `definition.stages` size 10, `definition.stages[0].minibossHealth` 3200.
- `GET farm of an earlier chapter answers its eleven bosses and its definition`: same player; `GET /farm?chapter=2` 200 with `chapter` 2, `bosses` size 11, `bosses[10].kind` `CHAPTER_BOSS`, `bosses[10].stage` null, `definition.bossHealth` 8000, `definition.stages[0].minibossHealth` 800, `definition.boss.element` `FIRE`, `definition.boss.physicalDefense` 35, `chapterBossWinsLeft` 10.
- `GET farm above the reached chapter answers the reached chapter`: `GET /farm?chapter=9` 200 with `chapter` 3 and `bosses.stage` `[1, 2, 3]`.
- `GET farm with a chapter that is not an integer of at least 1 answers 400`: each of `?chapter=0`, `?chapter=-1`, `?chapter=abc`, `?chapter=2.5` answers 400 with `detail` `chapter must be an integer of at least 1`.
- `an earlier chapter miniboss win drops the hero of that chapter and leaves the campaign`: `chance.value = 0.0`; `win(token, miniboss3, chapter = 2)` 200 with `drop.heroId` `lyra`, `drop.heroName` `Lyra Folhaveloz`; the stored progress row is chapter 3, stage 4, `PHASE`, completed false.
- `an earlier chapter boss win uses one of the shared daily wins`: `chance.value = 0.0`; `win(token, chapterBoss, chapter = 1)` 200 with `drop.heroId` `lyra` and `chapterBossWinsLeft` 9; then `GET /farm?chapter=2` answers `chapterBossWinsLeft` 9.
- `a win without a chapter still fights the current chapter`: `chance.value = 0.0`; `win(token, miniboss3)` 200 with `drop.heroId` `orina`.
- `a win of a chapter above the current one answers 409 BOSS_NOT_AVAILABLE`: `chance.value = 0.0`; `win(token, miniboss3, chapter = 4)` 409 with `code` `BOSS_NOT_AVAILABLE`; `jpaCardCopyRepository.findAllByUsername("yan")` still has 1 row.
- `a win with a chapter that is not an integer of at least 1 answers 400`: `chapter = 0`, `chapter = "\"2\""`, `chapter = 2.5` each answer 400 with `detail` `chapter must be an integer of at least 1`.
- `a win with a null chapter fights the current chapter`: body `{"boss":{"kind":"MINIBOSS","stage":3},"outcome":"CLEARED","chapter":null}` with `chance.value = 0.0` answers 200 with `drop.heroId` `orina`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`, then build `cd backend && ./gradlew build`
**Done when**:

- [x] The 10 new cases pass; every existing `FarmControllerIT` and `CardsFlowIT` case passes unchanged (the old `GET farm ...` cases still read `bosses` and `chapterBossWinsLeft`).
- [x] `node deploy/regression.mjs` is not changed (it calls no `/farm` route).

**Commit**: `feat(backend): choose the farm chapter on the farm routes`

---

### T4: Farm client sends and asks for a chapter [x]

**Owner**: game-dev
**Goal**: `farmApi.get(chapter)` asks for one chapter and `farmApi.win` sends `chapter` only when the boss carries one (BRC-03; spec P1-Fight AC 3-4).
**Where**: `game/src/adapters/http/farmApi.js`
**Also changes**: `game/src/adapters/http/farmApi.test.js`
**Read first**: `farmApi.js` (whole, 10 lines), `farmApi.test.js` (whole)
**Depends on**: T3
**Requirement**: BRC-03

**Contract**:

```js
//  get(chapter?) -> { chapter, chapters, bosses, chapterBossWinsLeft, definition } (a previous backend answers only bosses and chapterBossWinsLeft)
//  win({ kind, stage?, chapter? }) -> { drop, chapterBossWinsLeft, equipmentDrop }; `chapter` is sent only when it is an integer
get: async (chapter) => (await httpClient.get(chapter === undefined ? '/farm' : `/farm?chapter=${chapter}`)).data,

win: async ({ kind, stage, chapter }) =>
    (await httpClient.post('/farm/outcome', {
        boss: stage === undefined ? { kind } : { kind, stage },
        outcome: 'CLEARED',
        ...(Number.isInteger(chapter) ? { chapter } : {})
    })).data
```

Update the header comment lines 2-3 to describe `chapter`.

**Steps**:

1. Replace `get` and `win` as above and update the header comment.
2. Add the cases below; leave the existing five cases as they are.

**Tests**: unit
**Test cases** (`farmApi.test.js`):

- `get with a chapter calls GET /farm?chapter=<n> and returns the body`: `farmApi.get(2)` resolves the mocked body and `httpClient.get` was called with `'/farm?chapter=2'`.
- `win of a miniboss with a chapter sends the chapter beside the boss`: `win({ kind: 'MINIBOSS', stage: 3, chapter: 2 })` posts `('/farm/outcome', { boss: { kind: 'MINIBOSS', stage: 3 }, outcome: 'CLEARED', chapter: 2 })`.
- `win of the chapter boss with a chapter sends no stage and the chapter`: `win({ kind: 'CHAPTER_BOSS', chapter: 1 })` posts `{ boss: { kind: 'CHAPTER_BOSS' }, outcome: 'CLEARED', chapter: 1 }`.
- `win without a chapter sends no chapter key`: `win({ kind: 'MINIBOSS', stage: 2, chapter: undefined })`; `'chapter' in httpClient.post.mock.calls[0][1]` is `false`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 4 new cases pass; `get calls GET /farm and returns the response body` and `win sends only the kind and the stage of the boss` pass unchanged.

**Commit**: `feat(game): ask the farm for a chapter and report its wins`

---

### T5: Farm session keeps the chapter, the chapters and each definition [x]

**Owner**: game-dev
**Goal**: `farmSession.load(chapter)` keeps the listed chapter, the reached chapters and the definition of every chapter it loaded (BRC-03; spec P1-Choose AC 4, P1-Fight AC 1, P2-Compatibility AC 2).
**Where**: `game/src/application/farm/farmSession.js`
**Also changes**: `game/src/application/farm/farmSession.test.js`
**Read first**: `farmSession.js` (whole, 36 lines), `farmSession.test.js` (whole)
**Depends on**: T4
**Requirement**: BRC-03

**Contract**:

```js
let chapter = null;
let chapters = [];
const definitions = new Map();

//  The chapter of the last load; null before it, or when the backend does not answer one (previous version)
chapter: () => chapter,
//  The chapters the player may pick, ascending; empty before the first load or from a previous backend
chapters: () => chapters,
//  The definition of a chapter loaded before, kept for the page's life; null when that chapter was never loaded
definitionOf: (number) => definitions.get(number) ?? null,

//  Reads the farm state of `selected` (undefined: the current chapter); rejects and keeps the previous state on failure
load: async (selected) =>
{
    const state = await (selected === undefined ? gateway.get() : gateway.get(selected));

    bosses = state.bosses;
    winsLeft = state.chapterBossWinsLeft;
    chapter = Number.isInteger(state.chapter) ? state.chapter : null;
    chapters = Array.isArray(state.chapters) ? state.chapters : [];

    if (chapter !== null && state.definition)
    {
        definitions.set(chapter, state.definition);
    }
},
```

`win` does not change. Update the port comment (lines 2-4): `get(chapter?) -> { chapter?, chapters?, bosses, chapterBossWinsLeft, definition? }`.

**Steps**:

1. Add the three variables, the three readers and the new `load` as above.
2. Update the port comment.
3. Add the cases below.

**Tests**: unit
**Test cases** (`farmSession.test.js`; `D2` and `D3` are two distinct objects `{ bossHealth: 2 }` and `{ bossHealth: 3 }`):

- `before it loads the chapter is null, the chapters are empty and no definition is known`: `chapter()` null, `chapters()` `[]`, `definitionOf(1)` null.
- `load without a chapter calls get with no argument`: `gateway.get.mock.calls[0]` equals `[]`.
- `load with a chapter asks the gateway for that chapter`: `load(2)`; `gateway.get` called with `2`.
- `load keeps the chapter, the chapters and the definition of the answer`: answer `{ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 10, definition: D2 }`; `chapter()` 2, `chapters()` `[ 1, 2, 3 ]`, `definitionOf(2)` is `D2` (`toBe`).
- `the definition of every loaded chapter stays known`: `load(2)` answers `D2` for chapter 2, then `load(3)` answers `D3` for chapter 3; `definitionOf(2)` is `D2`, `definitionOf(3)` is `D3`, `definitionOf(1)` null, `chapter()` 3.
- `an answer without the new fields means no chapter and no chapters`: answer `{ bosses: [ { kind: 'MINIBOSS', stage: 1 } ], chapterBossWinsLeft: 10 }`; `chapter()` null, `chapters()` `[]`, `definitionOf(1)` null, `bosses()` has 1 entry.
- `a failed load keeps the chapter, the chapters and the definitions`: `load(2)` succeeds with `D2`, then the gateway rejects and `load(1)` rejects; `chapter()` 2, `chapters()` `[ 1, 2, 3 ]`, `definitionOf(2)` is `D2`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 7 new cases pass; the 6 existing cases pass unchanged.

**Commit**: `feat(game): keep the farm chapter and its definition`

---

### T6: Farm fight of a given definition and its label [x]

**Owner**: game-dev
**Goal**: A pure `farmEncounterOf(definition, boss)` builds a farm fight from any chapter definition, labelled by `farmLabel(boss)` with `(Capítulo <n>)` when the boss carries a chapter (BRC-06; spec P1-Fight AC 1-2).
**Where**: `game/src/domain/campaign/campaign.js`
**Also changes**: `game/src/domain/campaign/campaign.test.js`
**Read first**: `campaign.js:1-20` (imports, constants) and `:102-136` (`farmEncounter`), `campaign.test.js:105-120` and `:185-215` (farm encounter cases)
**Depends on**: T5
**Requirement**: BRC-06

**Contract**:

```js
//  The HUD label of a farm fight: `Rever chefe: <boss>`, plus ` (Capítulo <n>)` when the boss belongs to another chapter than the campaign's
export const farmLabel = (boss) => `Rever chefe: ${bossLabel(boss)}${Number.isInteger(boss.chapter) ? ` (Capítulo ${boss.chapter})` : ''}`;

//  A boss already beaten, fought again with the numbers of `definition` (the payload shape of the header comment). No drop rule: farm
//  fights drop no copper. Throws `Unknown stage: <n>` / `Unknown boss: <kind>` like Campaign.farmEncounter did.
export const farmEncounterOf = (definition, boss) => { /* the body of today's Campaign.farmEncounter, reading `definition` and
    `definition.stages.find((stage) => stage.number === boss.stage)`, label: farmLabel(boss) */ };

// Campaign
farmEncounter (boss)
{
    return farmEncounterOf(this.definition, boss);
}
```

The returned object is exactly `{ kind: FARM, boss, phase: 1, health, stats, dropRuleId: null, timeLimitMs, label }`.

**Steps**:

1. Add `farmLabel` and `farmEncounterOf` as exported functions after the constants (before `class Campaign`), moving the body of `farmEncounter` into `farmEncounterOf`.
2. Make `Campaign.farmEncounter` delegate as above.
3. Add the cases below.

**Tests**: unit
**Test cases** (`campaign.test.js`; `S3 = { element: 'NATURE', physicalDefense: 7, magicalDefense: 7, critResistance: 9 }`, `SB = { element: 'FIRE', physicalDefense: 35, magicalDefense: 35, critResistance: 35 }`, `D2 = { bossHealth: 4321, bossTimeLimitMs: 50_000, boss: SB, stages: [ 1, 2, 3 ].map((number) => ({ number, phasesPerStage: 5, monsterHealth: 1, minibossHealth: 70 + number, minibossTimeLimitMs: 45_000, miniboss: S3 })) }`):

- `farmLabel of a boss without a chapter keeps today's labels`: `farmLabel({ kind: 'MINIBOSS', stage: 3 })` is `'Rever chefe: Miniboss 3'`; `farmLabel({ kind: 'CHAPTER_BOSS' })` is `'Rever chefe: Chefe do capítulo'`.
- `farmLabel of a boss of another chapter adds the chapter`: `{ kind: 'MINIBOSS', stage: 3, chapter: 2 }` gives `'Rever chefe: Miniboss 3 (Capítulo 2)'`; `{ kind: 'CHAPTER_BOSS', chapter: 1 }` gives `'Rever chefe: Chefe do capítulo (Capítulo 1)'`.
- `farmEncounterOf builds a miniboss fight from the given definition`: `farmEncounterOf(D2, { kind: 'MINIBOSS', stage: 3, chapter: 2 })` equals `{ kind: 'FARM', boss: { kind: 'MINIBOSS', stage: 3, chapter: 2 }, phase: 1, health: 73, stats: S3, dropRuleId: null, timeLimitMs: 45_000, label: 'Rever chefe: Miniboss 3 (Capítulo 2)' }`.
- `farmEncounterOf builds the chapter boss fight from the given definition`: `farmEncounterOf(D2, { kind: 'CHAPTER_BOSS', chapter: 2 })` equals `{ kind: 'FARM', boss: { kind: 'CHAPTER_BOSS', chapter: 2 }, phase: 1, health: 4321, stats: SB, dropRuleId: null, timeLimitMs: 50_000, label: 'Rever chefe: Chefe do capítulo (Capítulo 2)' }`.
- `farmEncounterOf of a stage the definition does not have throws`: `farmEncounterOf(D2, { kind: 'MINIBOSS', stage: 11 })` throws `'Unknown stage: 11'`.
- `farmEncounterOf without stats uses the default stats`: a copy of `D2` without `boss` gives `stats` equal to `DEFAULT_STATS` for the chapter boss.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 6 new cases pass; every existing `Campaign` farm case (`a farm encounter carries no drop rule`, `a miniboss uses the health, stats and time limit of its stage and is labelled for the farm`, and the rest of that `describe`) passes unchanged.

**Commit**: `feat(game): build a farm fight from any chapter definition`

---

### T7: Map position of an earlier chapter [x]

**Owner**: game-dev
**Goal**: A pure `farmMapPosition(current, listedChapter, stageCount)` gives the map of an earlier chapter a completed position, so every stop comes from the boss list and none is `current` (BRC-05; spec P1-Choose AC 5-6).
**Where**: `game/src/domain/campaign/bossMap.js`
**Also changes**: `game/src/domain/campaign/bossMap.test.js`
**Read first**: `bossMap.js` (whole, 40 lines), `bossMap.test.js` (whole)
**Depends on**: T6
**Requirement**: BRC-05

**Contract**:

```js
//  The position the map is drawn from: `current` (the campaign: { chapter, stage, kind, stageCount, completed }) for the current chapter,
//  or a completed position of `listedChapter` for an earlier one. A null `listedChapter` (a previous backend) means the current chapter.
export const farmMapPosition = (current, listedChapter, stageCount) =>
    (listedChapter === null || listedChapter === undefined || listedChapter === current.chapter
        ? current
        : { chapter: listedChapter, stage: stageCount, kind: CHAPTER_BOSS, stageCount, completed: true });
```

**Steps**:

1. Add `farmMapPosition` after `bossMapStops`.
2. Add the cases below.

**Tests**: unit
**Test cases** (`bossMap.test.js`; `AT3 = { chapter: 3, stage: 4, kind: 'PHASE', stageCount: 10, completed: false }`; `ELEVEN` = minibosses 1 to 10 then `{ kind: 'CHAPTER_BOSS' }`):

- `the current chapter, or no listed chapter, keeps the campaign position`: `farmMapPosition(AT3, 3, 10)`, `farmMapPosition(AT3, null, 10)` and `farmMapPosition(AT3, undefined, 10)` are each `AT3` (`toBe`).
- `an earlier chapter is drawn as completed`: `farmMapPosition(AT3, 2, 10)` equals `{ chapter: 2, stage: 10, kind: 'CHAPTER_BOSS', stageCount: 10, completed: true }`.
- `the stops of an earlier chapter are all defeated and none is current`: `bossMapStops({ bosses: ELEVEN, position: farmMapPosition(AT3, 2, 10), stageCount: 10 }).map((stop) => stop.state)` equals `Array(11).fill('defeated')`.

**Gate**: quick - `cd game && npm test`, then build `cd game && npm test && npm run build`
**Done when**:

- [x] The 3 new cases pass; every existing `bossMapStops` case passes unchanged.

**Commit**: `feat(game): draw the map of an earlier chapter as cleared`

---

### T8: Chapter chips on the map screen [x]

**Owner**: game-dev
**Goal**: `renderFarm` draws the row of chapter chips between the title and the map, with the shown chapter pressed, the current campaign chapter marked and every chip disabled while busy (BRC-04; spec P1-Choose AC 1-2, 7, 9, 11; Visual Spec "Placement").
**Where**: `game/src/adapters/phaser/views/farmView.js`
**Also changes**: `game/src/adapters/phaser/views/farmView.test.js`
**Read first**: `farmView.js` (whole, 106 lines), `farmView.test.js:1-40` (helpers `show`, `find`, `stops`), `game/src/adapters/phaser/views/dom.js:1-25` (`el`)
**Depends on**: T7
**Requirement**: BRC-04

**Contract**:

```js
//  The chapters the player may pick, as one numbered button each: the shown one pressed, the campaign's own one marked `is-current`.
//  A click on another chapter calls onChapter(n); the pressed one does nothing; `busy` disables them all while a chapter loads.
const renderChapters = ({ chapters, chapter, currentChapter, busy, onChapter }) =>
{
    const row = el('div', 'farm-chapters', '', { testid: 'farm-chapters', role: 'group', 'aria-label': 'Escolher capítulo' });

    row.append(el('span', 'farm-chapters-label', 'Capítulo'));
    chapters.forEach((number) =>
    {
        const current = number === currentChapter;
        const button = el('button', `farm-chapter${current ? ' is-current' : ''}`, String(number), {
            type: 'button', testid: `farm-chapter-${number}`, 'aria-label': `Capítulo ${number}`, 'aria-pressed': String(number === chapter),
            ...(current ? { title: 'Capítulo atual' } : {})
        });

        button.disabled = busy;
        if (number !== chapter)
        {
            button.addEventListener('click', () => onChapter(number));
        }
        row.append(button);
    });

    return row;
};

export const renderFarm = (bosses, winsLeft, { onPick, map, chapters = [], chapter = null, currentChapter = null, busy = false, onChapter = () => {} }) => { ... };
```

In `renderFarm`, right after `screen.append(el('h3', 'farm-map-title', ...))`, add `if (chapters.length >= 2) { screen.append(renderChapters({ chapters, chapter, currentChapter, busy, onChapter })); }`. The title, the stops, the empty text and the extra row keep their code. Update the comment above `renderFarm` to name the new options.

**Steps**:

1. Add `renderChapters` above `renderFarm`.
2. Add the new options to `renderFarm` and append the row after the title.
3. Add the cases below.

**Tests**: unit (jsdom)
**Test cases** (`farmView.test.js`; `chipsOf = (screen) => [ ...screen.querySelectorAll('.farm-chapter') ]`; `EARLIER = { chapter: 2, stage: 10, kind: 'CHAPTER_BOSS', stageCount: 10, completed: true }`):

- `shows no chapter row without chapters or with a single chapter`: `show()` and `show(minibosses(1), 10, { chapters: [ 1 ], chapter: 1, currentChapter: 1 })` have no `farm-chapters`.
- `shows the label Capítulo and one button per chapter with the shown one pressed`: `show(minibosses(1, 2, 3), 10, { chapters: [ 1, 2, 3 ], chapter: 3, currentChapter: 3 })`: `farm-chapters` has `role="group"` and `aria-label="Escolher capítulo"`; `.farm-chapters-label` text `Capítulo`; chip texts `[ '1', '2', '3' ]`; `aria-pressed` `[ 'false', 'false', 'true' ]`; `farm-chapter-2` has `aria-label="Capítulo 2"` and `type="button"`.
- `marks the current campaign chapter with is-current and the title Capítulo atual`: `{ chapters: [ 1, 2, 3 ], chapter: 2, currentChapter: 3 }`: `farm-chapter-3` has class `is-current` and `title="Capítulo atual"`; `farm-chapter-2` has neither (`getAttribute('title')` null).
- `a click on another chapter calls onChapter with its number and the pressed one calls nothing`: `onChapter = vi.fn()`, `chapter: 3`; clicking `farm-chapter-1` calls `onChapter` once with `1`; clicking `farm-chapter-3` adds no call.
- `busy disables every chapter button`: `busy: true` gives `disabled === true` on all three chips; `busy: false` on none.
- `the row sits between the title and the map`: with `chapters: [ 1, 2 ]` and `minibosses(1)`, the class names of `screen.children` are `[ 'farm-map-title', 'farm-chapters', 'farm-map' ]`; with `bosses = []` they are `[ 'farm-map-title', 'farm-chapters', 'hero-empty', 'farm-map' ]`.
- `the map of an earlier chapter is titled with that chapter and every stop is defeated`: `renderFarm(ELEVEN, 10, { onPick: vi.fn(), map: EARLIER, chapters: [ 1, 2, 3 ], chapter: 2, currentChapter: 3 })`: title `Caminho do Capítulo 2`; the 11 `data-state` values are all `defeated`; `farm-entry-chapter-boss` contains `10 vitórias restantes hoje`.
- `the chapter boss of an earlier chapter is disabled at 0 wins left`: same as above with `winsLeft = 0`: `farm-entry-chapter-boss` is disabled and contains `0 vitórias restantes hoje`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 8 new cases pass; every existing `renderFarm` case passes unchanged.

**Commit**: `feat(game): show the chapter chips on the boss map`

---

### T9: Grove style of the chapter chips [x]

**Owner**: game-dev
**Goal**: The chips follow the Visual Spec of the spec in the Grove theme (BRC-04; spec Visual Spec; AD-022).
**Where**: `game/public/style.css`
**Read first**: `style.css:82-88` (`--btn-*`, `--chip-bg`), `:180-206` (hover, active, disabled), `:1747-1770` (`.equip-button`, the refine button's primary colours), `:2633-2660` (`.farm-screen`, `.farm-map-title`)
**Depends on**: T8
**Requirement**: BRC-04

**Contract** (add after the `.farm-map-title` rule; nothing else in the file changes):

```css
/* Rever chefes: the chapters the player may pick, under the map title (spec boss-replay-chapters) */
.farm-chapters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.farm-chapters-label {
    margin-right: 4px;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    color: var(--ink-600);
}

.farm-chapter {
    position: relative;
    min-width: 40px;
    height: 32px;
    padding: 0 10px;
    font-family: var(--font-heading);
    font-size: 15px;
    font-weight: 700;
    color: var(--parchment-100);
    background: var(--btn-bg);
    background-color: var(--wood-800);
    border: 2px solid var(--bronze-500);
    border-radius: 999px;
    box-shadow: var(--btn-shadow);
    cursor: pointer;
}

.farm-chapter[aria-pressed="true"] {
    background: var(--btn-primary-bg);
    background-color: var(--ember-700);
    border-color: var(--gold-400);
}

/* The campaign's own chapter: a gold dot under the number */
.farm-chapter.is-current::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: 3px;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    border-radius: 50%;
    background: var(--gold-400);
}

.farm-chapter:hover:not(:disabled) {
    filter: brightness(1.15);
}

.farm-chapter:active:not(:disabled) {
    filter: brightness(0.9);
}

.farm-chapter:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
}
```

The disabled look comes from the existing global `button:disabled` rule (opacity 0.45, `cursor: not-allowed`).

**Steps**:

1. Paste the block above after `.farm-map-title { ... }`.
2. Run the build gate.

**Tests**: none (Test Coverage Matrix: CSS is checked by computed styles in T13 and by the `ui-artist` in T14)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] `npm test` and `npm run build` pass; `git diff --stat` lists only `style.css` and `tasks.md`.

**Commit**: `style(game): draw the chapter chips in the Grove theme`

---

### T10: Rever chefes loads, switches and reopens chapters [x]

**Owner**: game-dev
**Goal**: `HeroUi` opens Rever chefes on the current chapter, switches chapters from the chips with the chips disabled while loading, keeps the map and shows `Não foi possível carregar.` on a failed load, passes the chapter of an earlier chapter to the fight, and opens a given chapter through `show('farm', { chapter })` (BRC-04, BRC-05; spec P1-Choose AC 4, 8-10, P1-Fight AC 13, P2-Compatibility AC 2).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js:40-60` (`DEFAULT_POSITION`, messages), `:85-100` (constructor), `:150-215` (`show`), `:688-700` (`render_farm`), `HeroUi.test.js:30-88` (`createUi`, `open`) and `:337-366` (the `HeroUi Rever chefes` cases)
**Depends on**: T9
**Requirement**: BRC-04

**Contract**:

```js
import { farmMapPosition } from '../../domain/campaign/bossMap';

// constructor: this.farmBusy = false;

// show(): the farm load becomes
if (screen === 'farm')
{
    await this.farm.load(options.chapter);
}

render_farm ()
{
    this.setError('');

    const current = this.hooks.mapPosition?.() ?? DEFAULT_POSITION;
    const listed = this.farm.chapter();
    const definition = listed === null ? null : this.farm.definitionOf(listed);
    const map = farmMapPosition(current, listed, definition?.stages?.length ?? current.stageCount);
    //  The fight of another chapter than the campaign's carries that chapter; the current chapter's fight stays as it was
    const other = listed !== null && listed !== current.chapter;

    this.body.replaceChildren(renderFarm(this.farm.bosses(), this.farm.winsLeft(), {
        map,
        chapters: this.farm.chapters(),
        chapter: listed,
        currentChapter: current.chapter,
        busy: this.farmBusy,
        onChapter: (chapter) => this.selectFarmChapter(chapter),
        onPick: (boss) =>
        {
            this.close();
            this.hooks.startFarm(other ? { ...boss, chapter: listed } : boss);
        }
    }));
}

//  Loads another chapter of Rever chefes; the chips are disabled meanwhile and a failure keeps the map shown before
async selectFarmChapter (chapter)
{
    if (this.farmBusy)
    {
        return;
    }

    const view = this.view;
    let failed = false;

    this.farmBusy = true;
    this.render_farm();

    try
    {
        await this.farm.load(chapter);
    }
    catch
    {
        failed = true;
    }
    finally
    {
        this.farmBusy = false;

        if (view === this.view && this.screen === 'farm')
        {
            this.render_farm();

            //  After the render: render_farm clears the error line first
            if (failed)
            {
                this.setError(LOAD_FAILED);
            }
        }
    }
}
```

The HUD button keeps calling `show('farm')` with no options, so every opening from the HUD loads the current chapter (`load(undefined)`).

**Steps**:

1. Import `farmMapPosition`; add `this.farmBusy = false` in the constructor.
2. Pass `options.chapter` to `this.farm.load` in `show`.
3. Replace `render_farm` and add `selectFarmChapter` as above.
4. Add the cases below to `describe('HeroUi Rever chefes')`. Use `AT3 = { chapter: 3, stage: 4, kind: 'PHASE', stageCount: 10, completed: false }` and set `ctx.ui.hooks.mapPosition = () => AT3` before opening; `state3 = { chapter: 3, chapters: [ 1, 2, 3 ], bosses: minibosses 1 to 3, chapterBossWinsLeft: 10, definition: DEF3 }`, `state2 = { chapter: 2, chapters: [ 1, 2, 3 ], bosses: the 10 minibosses and the chapter boss, chapterBossWinsLeft: 10, definition: DEF2 }`, where `DEF2`/`DEF3` hold 10 stages each; `ctx.farmGateway.get.mockImplementation((chapter) => Promise.resolve(chapter === 2 ? state2 : state3))`.

**Tests**: unit (jsdom)
**Test cases** (`HeroUi.test.js`):

- `opening Rever chefes loads the current chapter and shows the chapter buttons of the answer`: `open(ctx, 'farm')`; `ctx.farmGateway.get.mock.calls[0]` equals `[]`; `farm-chapter-3` has `aria-pressed="true"`; `farm-map-title` text `Caminho do Capítulo 3`.
- `a chapter button loads that chapter and draws its map with every stop defeated`: open, click `farm-chapter-2`, `await flush()`; the last `get` call is `[ 2 ]`; title `Caminho do Capítulo 2`; the 11 `.map-node` `data-state` values are all `defeated`; `farm-chapter-2` has `aria-pressed="true"`.
- `the chapter buttons are disabled while the chapter loads`: the chapter 2 `get` returns a promise resolved by hand; after the click every `.farm-chapter` is disabled and the title is still `Caminho do Capítulo 3`; after resolving and `flush()` none is disabled.
- `a failed chapter load keeps the map and says Não foi possível carregar.`: the chapter 2 `get` rejects with `new ApiError('Cannot reach the server. Try again later.')`; after the click and `flush()`: `.hero-error` text `Não foi possível carregar.`, title `Caminho do Capítulo 3`, `farm-chapter-3` pressed, no chip disabled.
- `a stop of an earlier chapter starts the farm fight with that chapter`: after showing chapter 2, click `farm-entry-miniboss-3`; `ctx.hooks.startFarm` was called with `{ kind: 'MINIBOSS', stage: 3, chapter: 2 }` and `ctx.ui.isOpen` is `false`.
- `a stop of the current chapter starts the farm fight without a chapter`: on chapter 3 click `farm-entry-miniboss-1`; `startFarm` called with `{ kind: 'MINIBOSS', stage: 1 }`.
- `show farm with a chapter loads that chapter`: `await ctx.ui.show('farm', { chapter: 2 })`; `get` called with `2`; title `Caminho do Capítulo 2`.
- `opening from the HUD again shows the current chapter`: open, click `farm-chapter-2`, flush, click `hero-close`, open again; the last `get` call is `[]` and the title is `Caminho do Capítulo 3`.
- `a farm answer without the new fields shows no chapter buttons`: default `createUi()` (answer without `chapter`); `open(ctx, 'farm')`; `farm-chapters` is null and `farm-entry-miniboss-1` exists.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 9 new cases pass; the 3 existing `HeroUi Rever chefes` cases pass unchanged.

**Commit**: `feat(game): pick the chapter on Rever chefes`

---

### T11: Earlier chapter farm fight in the scene [x]

**Owner**: game-dev
**Goal**: `ClickerGame` fights a boss that carries a chapter with that chapter's definition from the farm session, repeats it with the same numbers, reports it with its chapter, and reopens Rever chefes on that chapter when its last daily chapter boss win is spent (BRC-06; spec P1-Fight AC 1-3, 13; edge case "no definition").
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `ClickerGame.js` - search `startFarm (boss)`, `nextFarmEncounter ()`, `async reportFarmWin (boss)` (about lines 1183-1267) and the import of `../../domain/campaign/campaign`; `ClickerGame.test.js:58` (`progress`), `:84` (`createScene`), `:2286-2490` (`describe('ClickerGame farm mode')`)
**Depends on**: T10
**Requirement**: BRC-06

**Contract**:

```js
import { farmEncounterOf /* , existing names */ } from '../../domain/campaign/campaign';

//  The fight of a farmed boss: a boss of another chapter fights with the definition the farm loaded for that chapter, any other with the
//  campaign's. Null when that chapter's definition was never loaded.
farmEncounterFor (boss)
{
    if (!Number.isInteger(boss.chapter))
    {
        return this.session.farmEncounter(boss);
    }

    const definition = this.farm.definitionOf(boss.chapter);

    return definition ? farmEncounterOf(definition, boss) : null;
}

startFarm (boss)
{
    if (!this.session.loaded)
    {
        return;
    }

    const encounter = this.farmEncounterFor(boss);

    if (!encounter)
    {
        return;
    }

    this.farmBoss = boss;
    // ... the rest as today, ending with this.showEncounter(encounter);
}

// nextFarmEncounter(): the last line becomes  return this.farmEncounterFor(this.farmBoss);

// reportFarmWin(): the reopen at 0 wins becomes
this.leaveFarm();
this.heroUi.show('farm', Number.isInteger(boss.chapter) ? { chapter: boss.chapter } : {});
```

`winFarm`, `leaveFarm` and the `Farm boss` switch code do not change (the switch's boss has no chapter).

**Steps**:

1. Import `farmEncounterOf`.
2. Add `farmEncounterFor` above `startFarm`.
3. Rewrite `startFarm` and the last line of `nextFarmEncounter`, and the `heroUi.show('farm')` call in `reportFarmWin`, as above.
4. In `describe('ClickerGame farm mode')` add `const atChapter2 = () => ({ ...progress(3, 'PHASE', 1), chapter: 2 })`, `const earlier = { ...definition, bossHealth: 60, bossTimeLimitMs: 50_000, stages: definition.stages.map((stage) => ({ ...stage, minibossHealth: 77, minibossTimeLimitMs: 45_000 })) }`, `const ELEVEN = [ ...Array.from({ length: 10 }, (_, i) => ({ kind: 'MINIBOSS', stage: i + 1 })), { kind: 'CHAPTER_BOSS' } ]` and `const chapterOne = (winsLeft = 10) => ({ chapter: 1, chapters: [ 1, 2 ], bosses: ELEVEN, chapterBossWinsLeft: winsLeft, definition: earlier })`, then the cases below.

**Tests**: unit (jsdom)
**Test cases** (`ClickerGame.test.js`, `describe('ClickerGame farm mode')`):

- `a boss of an earlier chapter fights with the numbers of that chapter and its label`: `createScene({ start: atChapter2() })`; `farmGateway.get.mockResolvedValue(chapterOne())`; `await ctx.scene.farm.load(1)`; `ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 })`; `label(ctx)` is `'Rever chefe: Miniboss 3 (Capítulo 1)'`, `ctx.scene.monster.maxHealth` is 77, `.boss-timer` text `Time: 45`, `campaignGateway.report` not called.
- `a win of an earlier chapter boss reports its chapter and brings the same boss of that chapter back`: as above, `farmGateway.win.mockResolvedValue(farmWin())`; `killAll(ctx)`, `await flush()`; `farmGateway.win` called once with `{ kind: 'MINIBOSS', stage: 3, chapter: 1 }`; `advance(ctx)`; label still `'Rever chefe: Miniboss 3 (Capítulo 1)'`, `ctx.scene.monster.health` is 77.
- `an earlier chapter boss whose chapter was never loaded starts no fight`: `createScene({ start: atChapter2() })`; `ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 })` without a load; `ctx.scene.farmBoss` is null and `label(ctx)` is `'Stage 3/10  Phase 1/5'`.
- `the earlier chapter boss that spends the last daily win reopens Rever chefes on that chapter`: `createScene({ start: atChapter2() })`; `farmGateway.get.mockImplementation((chapter) => Promise.resolve(chapterOne(0)))`; `await ctx.scene.farm.load(1)`; `farmGateway.win.mockResolvedValue(farmWin(null, 0))`; `ctx.scene.startFarm({ kind: 'CHAPTER_BOSS', chapter: 1 })`; `killAll(ctx)`, `await flush()`; `ctx.scene.farmBoss` is null, `ctx.scene.heroUi.isOpen` is true, the last `farmGateway.get` call is `[ 1 ]`, `farm-map-title` text `Caminho do Capítulo 1`, `farm-entry-chapter-boss` disabled and containing `0 vitórias restantes hoje`.
- `a chapter boss of an earlier chapter is labelled with its chapter`: `startFarm({ kind: 'CHAPTER_BOSS', chapter: 1 })` after `load(1)` gives `label(ctx)` `'Rever chefe: Chefe do capítulo (Capítulo 1)'`, `maxHealth` 60 and `.boss-timer` `Time: 50`.

**Gate**: quick - `cd game && npm test`, then build `cd game && npm test && npm run build`
**Done when**:

- [x] The 5 new cases pass; every existing `ClickerGame farm mode` case passes unchanged (`fights the beaten boss with its numbers and the farm label...`, `a chapter boss win that leaves 0 wins today ends the farm and shows the list with 0 left`, the switch cases that expect `win` called with `{ kind: 'MINIBOSS', stage: 1 }`).

**Commit**: `feat(game): fight an earlier chapter boss with its own numbers`

---

### T12: Fake backend farm per chapter [x]

**Owner**: test-engineer
**Goal**: The e2e fake backend answers `GET /farm[?chapter=n]` and `POST /farm/outcome` with `chapter` like the T3 backend, with an optional definition per chapter (BRC-07 for the e2e harness; design API Contract).
**Where**: `game/e2e/support/fakeBackend.js`
**Read first**: `fakeBackend.js:149-156` (`beatenBosses`), `:215-232` (options comment and `mockBackend` signature), `:534-556` (`awardCards`), `:689-716` (`handleFarm`), `:771-775` (`handler`, `path`), `:870-882` (route registration)
**Depends on**: T11
**Requirement**: BRC-07

**Contract**:

- New option `chapterDefinitions = {}` (`{ [chapter]: definition }`); `const definitionOf = (number) => chapterDefinitions[number] ?? definition;`. Document it in the options comment: `chapterDefinitions {n: definition} (the definition GET /farm answers for chapter n, default definition)`.
- `beatenBosses(progress, definition, chapter = progress.chapter ?? 1)`: when `chapter < (progress.chapter ?? 1)` return the 10 minibosses of `definition.stages` and `{ kind: 'CHAPTER_BOSS' }`; else today's rule.
- `const CHAPTER_MESSAGE = 'chapter must be an integer of at least 1';`
- `GET /farm`: `const raw = new URL(route.request().url()).searchParams.get('chapter');` If `raw !== null` and (`!/^\d+$/.test(raw)` or `Number(raw) < 1`) answer `problem(400, CHAPTER_MESSAGE)`. `reached = progressOf(username).chapter ?? 1`; `listed = raw === null ? reached : Math.min(Number(raw), reached)`. Answer `{ chapter: listed, chapters: Array.from({ length: reached }, (_, i) => i + 1), bosses: beatenBosses(progress, definitionOf(listed), listed), chapterBossWinsLeft: winsLeft(cards), definition: definitionOf(listed) }`.
- `POST /farm/outcome`: `body.chapter` `undefined` or `null` means `reached`; any other value that is not an integer of at least 1 answers `problem(400, CHAPTER_MESSAGE)`; a value above `reached` answers `problem(409, 'Boss has not been beaten yet', 'BOSS_NOT_AVAILABLE')`; the beaten check uses `beatenBosses(progress, definitionOf(fought), fought)`; `awardCards(cards, boss.kind, fought, true)` (today it passes `1`).
- Route: replace `await page.route('**/api/farm', handler);` with `await page.route((url) => url.pathname === '/api/farm', handler);` (a string glob does not match the query string); keep `'**/api/farm/**'`.

**Steps**:

1. Add the option, `definitionOf`, `CHAPTER_MESSAGE` and the `beatenBosses` parameter.
2. Rewrite the two branches of `handleFarm` per the contract.
3. Replace the `/api/farm` route registration.
4. Run the gate: the existing farm and map e2e prove the default (chapter 1) answers are unchanged.

**Tests**: e2e (the existing `farm.spec.js` and `bossMap.spec.js` exercise this fake; the new behaviour is exercised by T13)
**Gate**: full - `cd game && npx playwright test e2e/farm.spec.js e2e/bossMap.spec.js e2e/drops.spec.js`
**Done when**:

- [x] Every test of the three specs passes unchanged (a failing test is rerun alone twice with `--workers=1` and counts as a load flake only when it passes both).
- [x] `git diff --stat` lists only `fakeBackend.js` and `tasks.md`.

**Commit**: `test(e2e): let the fake backend farm any reached chapter`

---

### T13: e2e scenarios of the chapter selector [x]

**Owner**: test-engineer
**Goal**: One Playwright scenario per player-visible AC of the two P1 stories and per visible edge case (BRC-04, BRC-05, BRC-06; L-062, L-084).
**Where**: `game/e2e/bossReplayChapters.spec.js` (new)
**Read first**: `game/e2e/bossMap.spec.js:1-35` (start, `openMap`, `states`), `game/e2e/farm.spec.js:1-40` (fast bosses, auto click off, `farmCalls`), `game/e2e/support/fakeBackend.js` options comment (T12)
**Depends on**: T12
**Requirement**: BRC-04

**Contract** (setup shared by every scenario):

```js
//  Chapter 3, stage 4: the minibosses 1 to 3 of chapter 3 are beaten, chapters 1 and 2 are cleared
const AT_CHAPTER_3 = { yan: { chapter: 3, stage: 4, encounter: 'PHASE', phase: 1 } };
const nature = { element: 'NATURE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 };
//  Chapter 2 as the farm answers it: every boss has 2 health and is nature, so one fire click wins; the miniboss time limit is 45 s
const CHAPTER_2 = {
    bossHealth: 2, bossTimeLimitMs: 50_000, boss: nature, bossDropRuleId: 6,
    stages: Array.from({ length: 10 }, (_, i) => ({ number: i + 1, phasesPerStage: 5, monsterHealth: 20, minibossHealth: 2,
        minibossTimeLimitMs: 45_000, monster: nature, miniboss: nature, monsterDropRuleId: 4, minibossDropRuleId: 5 }))
};
// mockBackend(page, { users: { yan: 'secret123' }, progress: AT_CHAPTER_3, lastChapter: 15, chapterDefinitions: { 2: CHAPTER_2 }, ...options })
// page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'))  -- the auto click is unlocked from chapter 2
```

The campaign (`definition` option) stays the default seed, whose miniboss 3 has 60 health, so `HP 2/2` proves the chapter 2 numbers.

**Steps**:

1. Create the file with the setup above (log in, click the canvas, wait for `ClickerGame` like `bossMap.spec.js`), an `openMap` helper (`hud-farm` click, `farm-map` visible) and a `states` helper.
2. Write the scenarios below, each a `test(...)` with that exact name.

**Tests**: e2e
**Test cases** (`test.describe('Rever chefes: escolher capítulo')`):

- `at chapter 3 the selector lists chapters 1 to 3 with chapter 3 pressed and its map`: `farm-chapters` visible with text containing `Capítulo`; `farm-chapter-1`, `-2`, `-3` visible, `farm-chapter-4` count 0; `farm-chapter-3` `aria-pressed="true"`, class `/is-current/`, `title="Capítulo atual"`; title `Caminho do Capítulo 3`; states `[ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]`.
- `choosing chapter 2 shows every boss of chapter 2 beaten and no current stop`: click `farm-chapter-2`; title `Caminho do Capítulo 2`; states `Array(11).fill('defeated')`; `farm-chapter-2` pressed; `farm-entry-chapter-boss` contains `10 vitórias restantes hoje`.
- `a chapter 2 miniboss fights with the numbers of chapter 2 and its win is reported for chapter 2`: `chances: [ 0 ]`; chapter 2, click `farm-entry-miniboss-3`; `.stage-hud` `Rever chefe: Miniboss 3 (Capítulo 2)`; `monster-hp` `HP 2/2`; `.boss-timer` `Time: 45`; click the canvas; `card-notice` `Carta: Lyra Folhaveloz`; the `/farm/outcome` call bodies equal `[ { boss: { kind: 'MINIBOSS', stage: 3 }, outcome: 'CLEARED', chapter: 2 } ]`; `.stage-hud` still `Rever chefe: Miniboss 3 (Capítulo 2)`; `backend.progresses.get('yan')` matches `{ chapter: 3, stage: 4, encounter: 'PHASE' }`.
- `the chapter boss of chapter 2 is labelled with its chapter`: chapter 2, click `farm-entry-chapter-boss`; `.stage-hud` `Rever chefe: Chefe do capítulo (Capítulo 2)` and `.boss-timer` `Time: 50`.
- `a fight of the current chapter is reported without a chapter`: `chances: [ 0 ]` and `definition: CHAPTER_2` (so the campaign's miniboss 1 has 2 health and is nature); on chapter 3 click `farm-entry-miniboss-1`, `.stage-hud` `Rever chefe: Miniboss 1`, click the canvas; the `/farm/outcome` bodies equal `[ { boss: { kind: 'MINIBOSS', stage: 1 }, outcome: 'CLEARED' } ]`.
- `the last daily win spent on the chapter 2 boss reopens Rever chefes on chapter 2`: `cards: { yan: { cleared: [ 1, 2 ], winsDay: today(), winsToday: 9 } }` (`today()` as in `farm.spec.js`); chapter 2, `farm-entry-chapter-boss` contains `1 vitórias restantes hoje`; click it, click the canvas; `.hero-panel` visible, title `Caminho do Capítulo 2`, `farm-chapter-2` pressed, `farm-entry-chapter-boss` disabled with `0 vitórias restantes hoje`.
- `the chapter bosses of every chapter share the daily wins`: `cards: { yan: { cleared: [ 1, 2 ], winsDay: today(), winsToday: 10 } }`; on chapter 3 `farm-entry-chapter-boss` has count 0 (its stop is `map-node-chapter-boss`, locked); choose chapter 1: `farm-entry-chapter-boss` disabled with `0 vitórias restantes hoje`.
- `reopening Rever chefes shows the current chapter again`: choose chapter 2, click `hero-close`, open again; title `Caminho do Capítulo 3` and `farm-chapter-3` pressed.
- `a failed chapter load keeps the map and says Não foi possível carregar.`: after `mockBackend`, `page.route((url) => url.pathname === '/api/farm' && url.searchParams.get('chapter') === '1', (route) => route.fulfill({ status: 500, body: '' }))`; click `farm-chapter-1`; `.hero-error` `Não foi possível carregar.`; title `Caminho do Capítulo 3`; `farm-chapter-3` pressed; `farm-chapter-1` enabled.
- `a player in chapter 1 sees no chapter selector`: `progress: { yan: { stage: 4, encounter: 'PHASE', phase: 1 } }`; `farm-chapters` count 0; title `Caminho do Capítulo 1`.
- `a player in chapter 2 at its start sees chapter 2 empty and chapter 1 all beaten`: `progress: { yan: { chapter: 2, stage: 1, encounter: 'PHASE', phase: 1 } }`; chips `1` and `2`; `farm-empty` `Nenhum chefe derrotado ainda.`; choose `1`: states `Array(11).fill('defeated')`.
- `a completed campaign lists chapters 1 to 15 inside the map width`: `progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } }`; 15 `.farm-chapter` buttons, `farm-chapter-16` count 0; the right edge of every chip's bounding box is at most the right edge of `farm-map`'s.
- `the chapter chips use the Grove colours`: computed styles on chapter 3: `farm-chapter-1` `background-color` `rgb(43, 29, 20)`, `border-top-color` `rgb(176, 122, 58)`, `color` `rgb(244, 230, 200)`, `height` `32px`, `font-family` matching `/Cinzel/`; `farm-chapter-3` `background-color` `rgb(168, 67, 26)` and `border-top-color` `rgb(224, 180, 90)`; `.farm-chapters-label` `color` `rgb(107, 74, 43)` and `font-family` matching `/Figtree/`; `farm-chapter-3` `::after` `background-color` `rgb(224, 180, 90)` (read with `getComputedStyle(node, '::after')`).

**Gate**: full - `cd game && npx playwright test e2e/bossReplayChapters.spec.js e2e/farm.spec.js e2e/bossMap.spec.js`
**Done when**:

- [x] The 13 scenarios pass, and `farm.spec.js` and `bossMap.spec.js` pass unchanged.
- [x] No scenario asserts a stop position number.

**Commit**: `test(e2e): cover choosing an earlier chapter in Rever chefes`

---

### T14: UI review of the chapter selector [x]

**Owner**: ui-artist
**Goal**: Screenshots and a review of every changed screen against the spec's Visual Spec and the Grove theme (AD-022); findings become new tasks.
**Where**: `game/ui-review/bossReplayChapters.shots.js` (new)
**Also changes**: `.specs/features/boss-replay-chapters/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/boss-replay-chapters/ui-review/*.png`
**Read first**: `game/ui-review/campaignChapters.shots.js` (setup with `mockBackend` and `shot`), `game/ui-review.config.js`, spec section "Visual Spec"
**Depends on**: T13
**Requirement**: BRC-04

**Contract**: shots (desktop 1280 x 720 and phone 390 x 844, both projects of `ui-review.config.js`), with the T13 setup:

1. `01-chapter-3-current` - chapter 3 open, chip 3 pressed with the gold dot.
2. `02-chapter-2-all-beaten` - chapter 2 chosen, 11 defeated stops.
3. `03-chapter-2-fight-label` - the HUD during `Rever chefe: Miniboss 3 (Capítulo 2)`.
4. `04-chips-loading` - chips disabled during a load held open with `page.route` (fulfil after the shot).
5. `05-load-failed` - `Não foi possível carregar.` with chapter 3 still shown.
6. `06-fifteen-chapters` - completed campaign, 15 chips (the phone shot shows the 15 chips in one row inside the scaled map).
7. `07-chip-focus` - keyboard focus on chip 2 (`Tab` to it).

**Steps**:

1. Write the shots file; run `cd game && npm run ui:shots -- bossReplayChapters`.
2. Check each shot against the Visual Spec table (sizes, colours, fonts, placement, the phone row inside the scaled map, focus ring, disabled look, contrast of `--parchment-100` on `--wood-800` and on `--ember-700`, and of `--ink-600` on the parchment panel).
3. Write `ui-review.html` with the verdict (APROVADO or REPROVADO) and each finding with severity; every finding the `product-owner` accepts becomes a task in this file.

**Tests**: none (review task; the screenshots are not tests)
**Gate**: build - `cd game && npm run ui:shots -- bossReplayChapters` exits 0
**Done when**:

- [x] 14 PNG files (7 shots x 2 projects) are under `.specs/features/boss-replay-chapters/ui-review/`.
- [x] `ui-review.html` names a verdict and lists every finding with its shot.

Result (`b4a4c16`): MUDANÇAS PEDIDAS. Finding #1 (high): the timer covers the end of `Rever chefe: Miniboss 3 (Capítulo 2)`, desktop and phone, shot 03 → T15, T16, T18. Finding #2 (low): the gold dot touches the numeral of the current chip, shots 01, 06, 07 → T17, T18. Both re-reviewed in T19. The two suggestions (focus offset 3px, phone letterbox) are not taken: the focus ring meets the Visual Spec and the letterbox is outside this feature.

**Commit**: `docs(boss-replay-chapters): review the chapter selector UI`

---

### T15: Chapter tag on the second line of the stage plate [x]

**Owner**: game-dev
**Goal**: The ` (Capítulo <n>)` tag of an earlier chapter fight draws on a second, smaller line of the stage plate, so the plate stays narrow while its text stays the full label (BRC-08; spec P1-Fight AC 14; UI review #1).
**Where**: `game/src/adapters/phaser/views/stageLabel.js` (new)
**Also changes**: `game/src/adapters/phaser/views/stageLabel.test.js` (new), `game/src/adapters/phaser/ClickerGame.js`, `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `game/src/adapters/phaser/views/dom.js` (`el`), `ClickerGame.js` - search `this.stageHud.textContent = encounter.label;` in `showEncounter (encounter)` (about line 758) and the import `import { el } from './views/dom';` (about line 20); `style.css` - search `.stage-hud:empty {` (about line 610); `ClickerGame.test.js` - `describe('ClickerGame stages')` (about line 1111, helpers `label`, `bossStart`) and `describe('a boss of an earlier chapter')` (about line 2489, helpers `atChapter2`, `chapterOne`)
**Depends on**: T14
**Requirement**: BRC-08

**Contract**:

`game/src/adapters/phaser/views/stageLabel.js`, the whole file:

```js
import { el } from './dom';

//  The stage plate of the HUD (spec boss-replay-chapters, UI review #1). A farm label of an earlier chapter ends with ` (Capítulo <n>)`:
//  that tag goes in a span drawn on a second, smaller line (style.css .stage-hud-chapter), so the plate stays narrow. The plate's
//  textContent is always the label unchanged.
const CHAPTER_TAG = / \(Capítulo \d+\)$/;

export const renderStageLabel = (node, label) =>
{
    const match = CHAPTER_TAG.exec(label);

    if (!match)
    {
        node.textContent = label;

        return;
    }

    node.replaceChildren(label.slice(0, match.index), el('span', 'stage-hud-chapter', match[0]));
};
```

`ClickerGame.js`: add `import { renderStageLabel } from './views/stageLabel';` after the `./views/skillEffects` import, and in `showEncounter (encounter)` replace

```js
        this.stageHud.textContent = encounter.label;
```

with

```js
        renderStageLabel(this.stageHud, encounter.label);
```

Nothing else in `ClickerGame.js` changes (`completeChapter` keeps `this.stageHud.textContent = '';`).

`style.css`: insert right after the `.stage-hud:empty { display: none; }` rule (nothing else changes):

```css
/* A farm fight of an earlier chapter: the tag ` (Capítulo <n>)` on a second, smaller line, so the plate stays narrow
   and the boss timer has room (spec boss-replay-chapters, UI review #1) */
.stage-hud:has(.stage-hud-chapter) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    padding-top: 4px;
    padding-bottom: 4px;
}

.stage-hud-chapter {
    font-size: 14px;
    line-height: 1.2;
    color: var(--ink-600);
    white-space: nowrap;
}
```

`white-space: nowrap` drops the leading space of the span at the start of its line; the span's `textContent` keeps it.

**Steps**:

1. Create `stageLabel.js` with the contract above.
2. Create `stageLabel.test.js` with the cases below (`import { describe, expect, it } from 'vitest';`, `import { renderStageLabel } from './stageLabel';`, each case builds `const node = document.createElement('div');`).
3. Add the import and replace the one line in `showEncounter` of `ClickerGame.js`.
4. Add the two `ClickerGame.test.js` cases below.
5. Paste the CSS block after `.stage-hud:empty`.
6. Run the gate.

**Tests**: unit (jsdom)
**Test cases**:

`game/src/adapters/phaser/views/stageLabel.test.js`, `describe('renderStageLabel')`:

- `writes a campaign label as one text`: `renderStageLabel(node, 'Stage 3/10  Miniboss')`; `node.textContent` is `'Stage 3/10  Miniboss'`, `node.childNodes.length` is 1, `node.querySelector('.stage-hud-chapter')` is null.
- `writes a current chapter farm label as one text`: `renderStageLabel(node, 'Rever chefe: Chefe do capítulo')`; `node.textContent` is `'Rever chefe: Chefe do capítulo'`, `node.querySelector('.stage-hud-chapter')` is null.
- `puts the chapter of an earlier chapter miniboss on its own line`: `renderStageLabel(node, 'Rever chefe: Miniboss 3 (Capítulo 2)')`; `node.textContent` is `'Rever chefe: Miniboss 3 (Capítulo 2)'`, `node.childNodes.length` is 2, `node.firstChild.nodeValue` is `'Rever chefe: Miniboss 3'`, `node.querySelector('.stage-hud-chapter').textContent` is `' (Capítulo 2)'` (leading space included).
- `puts a two digit chapter of an earlier chapter boss on its own line`: `renderStageLabel(node, 'Rever chefe: Chefe do capítulo (Capítulo 14)')`; `node.firstChild.nodeValue` is `'Rever chefe: Chefe do capítulo'`, `node.querySelector('.stage-hud-chapter').textContent` is `' (Capítulo 14)'`.
- `replaces the two lines when the next label has no chapter`: render `'Rever chefe: Miniboss 3 (Capítulo 2)'`, then `renderStageLabel(node, 'Stage 1/10  Phase 1/5')`; `node.textContent` is `'Stage 1/10  Phase 1/5'`, `node.childNodes.length` is 1, `node.querySelector('.stage-hud-chapter')` is null.
- `leaves no child for an empty label`: render `'Rever chefe: Miniboss 3 (Capítulo 2)'`, then `renderStageLabel(node, '')`; `node.childNodes.length` is 0 (so `.stage-hud:empty` hides the plate).

`game/src/adapters/phaser/ClickerGame.test.js`:

- in `describe('ClickerGame stages')`, `a campaign boss label has no chapter line`: `createScene({ start: bossStart() })`; `label(ctx)` is `'Stage 1/10  Miniboss'` and `ctx.hud('.stage-hud .stage-hud-chapter')` is undefined.
- in `describe('a boss of an earlier chapter')`, `an earlier chapter fight draws its chapter on the second line of the plate`: `createScene({ start: atChapter2() })`; `farmGateway.get.mockResolvedValue(chapterOne())`; `await ctx.scene.farm.load(1)`; `ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 })`; `label(ctx)` is `'Rever chefe: Miniboss 3 (Capítulo 1)'` and `ctx.hud('.stage-hud .stage-hud-chapter').textContent` is `' (Capítulo 1)'`.

**Gate**: quick - `cd game && npm test`, then build `cd game && npm test && npm run build`
**Done when**:

- [x] The 6 `stageLabel.test.js` cases and the 2 new `ClickerGame.test.js` cases pass.
- [x] Every existing `ClickerGame.test.js` case passes unchanged, among them `a boss of an earlier chapter fights with the numbers of that chapter and its label` and `a chapter boss of an earlier chapter is labelled with its chapter` (they read `.stage-hud` `textContent`, which is unchanged).
- [x] `git diff --stat` lists only `stageLabel.js`, `stageLabel.test.js`, `ClickerGame.js`, `ClickerGame.test.js`, `style.css` and `tasks.md`.

**Commit**: `fix(game): draw the chapter of an earlier chapter fight on a second plate line`

---

### T16: Boss timer beside the stage plate [x]

**Owner**: game-dev
**Goal**: The boss timer stays centred on x 512 while the stage plate leaves room, and otherwise starts 12 px after the plate's right edge, so it never covers the label (BRC-08; spec P1-Fight AC 15; UI review #1).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `ClickerGame.js` - the constants `const STAGE_HUD = { x: 356, y: 44 };` (about line 42) and `const BOSS_TIMER = { x: 512, y: 44 };` (about line 55), `showEncounter (encounter)` (the `if (encounter.timeLimitMs)` block, about line 764), `showCountdown ()` and `hideCountdown ()` (about lines 820-832); `style.css` - the `.boss-timer {` rule (about line 661) and `.hud-stage` / `.hud-timer` (about lines 481 and 522: the plate's box is 400 px wide centred on x 356, so the plate starts at x 156; the timer's box is 240 px wide centred on x 512); `ClickerGame.test.js` - `describe('ClickerGame stages')` helpers `killAll`, `timer`, `left`, `bossStart` and the case `removes --timer-left when the boss is beaten` (about line 1245)
**Depends on**: T15
**Requirement**: BRC-08

**Contract**:

Constants, right after `const BOSS_TIMER = { x: 512, y: 44 };`:

```js
//  The stage plate starts at the left edge of its 400 px box (style.css .hud-stage); the timer keeps 12 px clear of the plate
const STAGE_HUD_LEFT = STAGE_HUD.x - 200;
const BOSS_TIMER_GAP = 12;
```

New method, right after `showCountdown ()`:

```js
    //  The timer stays centred on x 512 while the stage plate ends 12 px before it; a longer plate pushes it right, 12 px after the plate
    //  (spec boss-replay-chapters, UI review #1). offsetWidth is in scene px: Phaser scales the DOM layer with a transform
    placeBossTimer ()
    {
        const plateEnd = STAGE_HUD_LEFT + this.stageHud.offsetWidth + BOSS_TIMER_GAP;
        const timerStart = BOSS_TIMER.x - this.bossTimer.offsetWidth / 2;

        this.bossTimer.style.setProperty('--timer-shift', `${Math.max(0, Math.ceil(plateEnd - timerStart))}px`);
    }
```

`showCountdown ()` becomes (the `--timer-left` line is unchanged):

```js
    showCountdown ()
    {
        const text = `Time: ${this.countdown.seconds}`;

        //  The pill's width follows its text, so the timer is placed again only when the text changes, not on every frame
        if (this.bossTimer.textContent !== text)
        {
            this.bossTimer.textContent = text;
            this.placeBossTimer();
        }

        //  The ring of the timer fills with the share of the time left, 3 decimals (spec ui-redesign UIR-06)
        this.bossTimer.style.setProperty('--timer-left', Math.min(1, Math.max(0, this.countdown.remainingMs / this.countdown.limitMs)).toFixed(3));
    }
```

In `showEncounter (encounter)`, inside `if (encounter.timeLimitMs) { ... }`, add `this.placeBossTimer();` as the line right after `this.showCountdown();` (a new label with the same timer text must still move the timer).

In `hideCountdown ()`, add `this.bossTimer.style.removeProperty('--timer-shift');` right after `this.bossTimer.style.removeProperty('--timer-left');`.

`style.css`: add these two declarations as the last two lines inside the existing `.boss-timer { ... }` rule (nothing else changes):

```css
    /* Pushed right by the scene when the stage plate would reach it (spec boss-replay-chapters, UI review #1) */
    position: relative;
    left: var(--timer-shift, 0px);
```

Worked numbers (scene px; widths measured in Chromium with Cinzel): plate 262 + timer 152 → `0px`; plate 283 (`Miniboss 3` + `(Capítulo 2)` on two lines) + timer 152 → `15px`; plate 346 (`Chefe do capítulo` + `(Capítulo 14)`) + timer 162 → `83px`.

**Steps**:

1. Add the two constants.
2. Add `placeBossTimer ()` after `showCountdown ()`.
3. Rewrite `showCountdown ()` as above.
4. Add the `this.placeBossTimer();` line in `showEncounter` and the `removeProperty('--timer-shift')` line in `hideCountdown`.
5. Add the two CSS declarations to `.boss-timer`.
6. Add the test block below to `ClickerGame.test.js` and run the gate.

**Tests**: unit (jsdom)
**Test cases** (`ClickerGame.test.js`, inside `describe('ClickerGame stages')`, after the case `sets no --timer-left on a phase monster`, in a nested `describe('boss timer beside the stage plate', () => { ... })`). jsdom has no layout (`offsetWidth` is 0), so the block stubs it by class name:

```js
        const widths = { 'stage-hud': 0, 'boss-timer': 0 };
        const shift = (ctx) => ctx.hud('.boss-timer').style.getPropertyValue('--timer-shift');

        beforeEach(() => {
            vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () { return widths[this.className] ?? 0; });
        });
        afterEach(() => vi.restoreAllMocks());
```

Each case sets `widths['stage-hud']` and `widths['boss-timer']` before `createScene`:

- `keeps the timer centred when the plate ends 12 px before it`: widths 262 / 152; `createScene({ start: bossStart() })`; `shift(ctx)` is `'0px'`.
- `pushes the timer to 12 px after a plate that reaches it`: widths 283 / 152; `createScene({ start: bossStart() })`; `shift(ctx)` is `'15px'`.
- `pushes the timer after the widest earlier chapter plate`: widths 346 / 162; `createScene({ start: bossStart() })`; `shift(ctx)` is `'83px'`.
- `places the timer again when its text changes`: widths 262 / 152; `createScene({ start: bossStart() })`; `shift(ctx)` is `'0px'`; set `widths['stage-hud'] = 300`; `ctx.scene.update(0, 1001)`; `timer(ctx)` is `'Time: 29'` and `shift(ctx)` is `'32px'` (156 + 300 + 12 - 436).
- `does not place the timer again on a frame whose seconds do not change`: widths 262 / 152; `createScene({ start: bossStart() })`; set `widths['stage-hud'] = 300`; `ctx.scene.update(0, 100)`; `timer(ctx)` is `'Time: 30'` and `shift(ctx)` is `'0px'`.
- `removes --timer-shift when the boss is beaten`: widths 283 / 152; `createScene({ start: bossStart() })`; `killAll(ctx)`; `shift(ctx)` is `''`.
- `removes --timer-shift when the boss runs out of time`: widths 283 / 152; `createScene({ start: bossStart() })`; `ctx.scene.update(0, 30000)`; `shift(ctx)` is `''` and `timer(ctx)` is `''`.

**Gate**: quick - `cd game && npm test`, then build `cd game && npm test && npm run build`
**Done when**:

- [x] The 7 new cases pass.
- [x] Every existing `ClickerGame.test.js` case passes unchanged, among them `counts the boss time down in whole seconds as the scene updates`, `sets --timer-left to 0.750 after 7.5 s of a 30 s countdown`, `removes --timer-left when the boss runs out of time` and `makes the stage position text click-through`.
- [x] `git diff --stat` lists only `ClickerGame.js`, `ClickerGame.test.js`, `style.css` and `tasks.md`.

**Commit**: `fix(game): keep the boss timer clear of a long stage plate`

---

### T17: Gold dot clear of the chip numeral [x]

**Owner**: game-dev
**Goal**: The gold dot of the current chapter's chip sits 3 px under the numeral, and every chip's numeral keeps one baseline (BRC-09; spec P1-Choose AC 13; Visual Spec rows Chip and Current campaign chapter; UI review #2).
**Where**: `game/public/style.css`
**Read first**: `style.css` - search `.farm-chapter {` (about line 2668) and `.farm-chapter.is-current::after {` (about line 2689)
**Depends on**: T16
**Requirement**: BRC-09

**Contract**: two value edits, nothing else in the file changes.

In `.farm-chapter { ... }` replace

```css
    padding: 0 10px;
```

with

```css
    /* 3px at the bottom lifts every numeral to a baseline 20px below the top edge, clear of the current chapter's dot (UI review #2) */
    padding: 0 10px 3px;
```

In `.farm-chapter.is-current::after { ... }` replace

```css
    bottom: 3px;
```

with

```css
    bottom: 1px;
```

Result (measured in Chromium with Cinzel 700 15px in a 32px chip with a 2px border): numeral baseline 20px below the chip's top edge, dot from 23px to 29px, 1px clear of the border's inner edge. The dot keeps 6 x 6px, `--gold-400`, `left: 50%`, `margin-left: -3px`.

**Steps**:

1. Make the two edits.
2. Run the gate.

**Tests**: none (Test Coverage Matrix: CSS is checked by computed styles and geometry in T18 and by the `ui-artist` in T19)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] `npm test` and `npm run build` pass.
- [x] `git diff` of `style.css` shows exactly the two changed declarations and the one comment line.
- [x] `git diff --stat` lists only `style.css` and `tasks.md`.

**Commit**: `fix(game): lift the chip numerals clear of the current chapter dot`

---

### T18: e2e of the plate, the timer and the dot [x]

**Owner**: test-engineer
**Goal**: Playwright pins what the player sees after T15 to T17: the whole earlier chapter label on two lines, the timer clear of the plate and of the wallet, the current chapter label still on one line, and the dot clear of the numeral (BRC-08, BRC-09; spec P1-Fight AC 14, 15; P1-Choose AC 13).
**Where**: `game/e2e/bossReplayChapters.spec.js`
**Read first**: `game/e2e/bossReplayChapters.spec.js:1-55` (setup, `startGame`, `openMap`, `farmLabel`, `CHAPTER_2`), the scenario `the chips and the label carry the Visual Spec sizes, weights, borders, radius, padding and shadow` (about line 341), `game/e2e/uiRedesign.spec.js` - the scenario `keeps the battle HUD on the scene anchors of the baseline` (about line 1778: the one-read `page.evaluate` of every box and the `scene()` conversion to the 1024 x 768 scene)
**Depends on**: T17
**Requirement**: BRC-08

**Before starting**: another agent was editing `bossReplayChapters.spec.js` when this task was written. Run `git pull --rebase origin main` first; if `git status --short game/e2e/bossReplayChapters.spec.js` still shows edits you did not make, STOP and report it.

**Contract**: one helper added after `countdownLimit` at the top of the file, reading every box in one synchronous step and converting it to scene px:

```js
//  The HUD boxes in the 1024 x 768 scene, read in one step: the plate, its first text line, its chapter line, the timer and the wallet
const hudBoxes = (page) => page.evaluate(() => {
    const canvas = document.querySelector('#game-container canvas').getBoundingClientRect();
    const scene = (rect) => rect && {
        left: ((rect.x - canvas.x) * 1024) / canvas.width,
        right: ((rect.x + rect.width - canvas.x) * 1024) / canvas.width,
        top: ((rect.y - canvas.y) * 768) / canvas.height,
        bottom: ((rect.y + rect.height - canvas.y) * 768) / canvas.height,
        centreY: ((rect.y + rect.height / 2 - canvas.y) * 768) / canvas.height,
        width: (rect.width * 1024) / canvas.width,
        height: (rect.height * 768) / canvas.height
    };
    const plate = document.querySelector('.stage-hud');
    const range = document.createRange();

    range.selectNodeContents(plate.firstChild);

    return {
        plate: scene(plate.getBoundingClientRect()),
        firstLine: scene(range.getBoundingClientRect()),
        chapterLine: scene(document.querySelector('.stage-hud .stage-hud-chapter')?.getBoundingClientRect()),
        timer: scene(document.querySelector('.boss-timer').getBoundingClientRect()),
        wallet: scene(document.querySelector('.wallet').getBoundingClientRect())
    };
});
//  Spec P1-Fight AC 15: the timer's left edge is max(512 - width / 2, plate right + 12), within 1 scene px
const expectTimerBesidePlate = ({ plate, timer, wallet }) => {
    expect(Math.abs(timer.left - Math.max(512 - timer.width / 2, plate.right + 12))).toBeLessThanOrEqual(1);
    expect(timer.left).toBeGreaterThanOrEqual(plate.right + 11);
    expect(timer.right).toBeLessThan(wallet.left);
};
```

**Steps**:

1. Pull and check the file as said above.
2. Add `hudBoxes` and `expectTimerBesidePlate`.
3. In the existing scenario `the chips and the label carry the Visual Spec sizes, weights, borders, radius, padding and shadow`, change `expect(dot[2]).toBe('3px');` to `expect(dot[2]).toBe('1px');` (the spec amended the value: Visual Spec row "Current campaign chapter") and add `await expect(chip).toHaveCSS('padding-bottom', '3px');` after the `padding-left` line. No other existing line changes.
4. Add the four scenarios below inside `test.describe('Rever chefes: escolher capítulo')`, each a `test(...)` with that exact name. Wait for the label with `await expect(farmLabel(page)).toHaveText(...)` and for the timer with `await expect(page.locator('.boss-timer')).toBeVisible()` before calling `hudBoxes`.

**Tests**: e2e
Bound changed by orchestrator ruling 2026-11-17: Cinzel's content box extends ~6.7 px below the baseline, so the chapter line is compared with the first line's baseline
**Test cases**:

- `the chapter 2 fight label shows whole on two lines and the timer stands clear of it`: `startGame(page)`; `openMap`; click `farm-chapter-2`; click `farm-entry-miniboss-3`; `farmLabel(page)` has text `Rever chefe: Miniboss 3 (Capítulo 2)`; `page.locator('.stage-hud .stage-hud-chapter')` evaluated `(node) => node.textContent` is `' (Capítulo 2)'`; `page.locator('.stage-hud .stage-hud-chapter')` has CSS `font-size` `14px` and `color` `rgb(107, 74, 43)`; then `const boxes = await hudBoxes(page)`: `Math.abs(boxes.plate.left - 156) <= 1`, `Math.abs(boxes.plate.centreY - 44) <= 1`, `boxes.plate.height <= 56`, `boxes.chapterLine.top >= boxes.firstLineBaseline` (second line), `Math.abs(boxes.chapterLine.left - boxes.firstLine.left) <= 1` (left-aligned), `boxes.chapterLine.right <= boxes.plate.right` and `boxes.firstLine.right <= boxes.plate.right` (both lines inside the plate); `expectTimerBesidePlate(boxes)`.
- `the longest earlier chapter label keeps the timer clear of the plate and the wallet`: `startGame(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } }, chapterDefinitions: { 14: CHAPTER_2 } })`; `openMap`; click `farm-chapter-14`; title `farm-map-title` `Caminho do Capítulo 14`; click `farm-entry-chapter-boss`; `farmLabel(page)` has text `Rever chefe: Chefe do capítulo (Capítulo 14)`; the chapter line's `textContent` is `' (Capítulo 14)'`; `const boxes = await hudBoxes(page)`: `boxes.plate.height <= 56`, `boxes.chapterLine.top >= boxes.firstLineBaseline`; `expectTimerBesidePlate(boxes)`.
- `a current chapter fight keeps its label on one line and the timer clear of it`: `startGame(page, { definition: CHAPTER_2 })`; `openMap`; click `farm-entry-miniboss-1`; `farmLabel(page)` has text `Rever chefe: Miniboss 1`; `page.locator('.stage-hud .stage-hud-chapter')` has count 0; `farmLabel(page)` has CSS `font-size` `19px`; `const boxes = await hudBoxes(page)`: `boxes.chapterLine` is undefined, `Math.abs(boxes.plate.left - 156) <= 1`; `expectTimerBesidePlate(boxes)`.
- `the gold dot of the current chip sits under the numeral, clear of it`: `startGame(page)`; `openMap`; for `farm-chapter-1` and `farm-chapter-3` read, in one `evaluate` each:
  ```js
  (node) => {
      const probe = document.createElement('span');

      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      node.append(probe);
      const chip = node.getBoundingClientRect();
      const scale = chip.height / node.offsetHeight;
      const baseline = (probe.getBoundingClientRect().top - chip.top) / scale;

      probe.remove();
      const after = getComputedStyle(node, '::after');

      return { baseline, dotTop: node.offsetHeight - parseFloat(getComputedStyle(node).borderBottomWidth) - parseFloat(after.bottom) - parseFloat(after.height) };
  }
  ```
  `farm-chapter-3` `dotTop` is `23`; `farm-chapter-3` `dotTop - baseline >= 2`; `Math.abs(chip1.baseline - chip3.baseline) <= 0.5` (one baseline across the row); `farm-chapter-3` text is still `3` after the read (the probe is gone).

**Gate**: full - `cd game && npx playwright test e2e/bossReplayChapters.spec.js e2e/farm.spec.js e2e/bossMap.spec.js`, then `cd game && npx playwright test e2e/uiRedesign.spec.js -g "scene anchors"` (UIR-04 AC 7: the timer still centred on x 512 in a campaign boss fight)
**Done when**:

- [x] The 4 new scenarios pass, and every other scenario of `bossReplayChapters.spec.js`, `farm.spec.js` and `bossMap.spec.js` passes.
- [x] `keeps the battle HUD on the scene anchors of the baseline` passes unchanged.
- [x] The only changed existing lines are the `dot[2]` value (`'3px'` to `'1px'`) and the added `padding-bottom` line; `git diff --stat` lists only `bossReplayChapters.spec.js` and `tasks.md`.

**Commit**: `test(e2e): pin the two-line chapter plate, the timer beside it and the chip dot`

---

### T19: UI re-review of the plate, the timer and the dot [x]

**Owner**: ui-artist
**Goal**: Check findings #1 and #2 of the T14 review against the amended Visual Spec on new screenshots; a pass closes the review, any finding becomes a task (BRC-08, BRC-09; AD-022).
**Where**: `game/ui-review/bossReplayChapters.shots.js`
**Also changes**: `.specs/features/boss-replay-chapters/ui-review.html`, `.specs/features/boss-replay-chapters/ui-review/*.png`
**Read first**: spec Visual Spec rows "Chip", "Current campaign chapter", "HUD plate of an earlier chapter fight", "Boss timer beside the plate"; spec Assumptions rows "UI review #1" and "UI review #2"; the T14 `ui-review.html` (findings #1 and #2)
**Depends on**: T18
**Requirement**: BRC-08

**Contract**: shots 01 to 07 are taken again unchanged (same names, they overwrite the T14 files), plus two new tests in `bossReplayChapters.shots.js`, both projects of `ui-review.config.js`:

8. `08-chapter-14-boss-label` - `start(page, { progress: { yan: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } }, chapterDefinitions: { 14: CHAPTER_2 } })`, open the map, click `farm-chapter-14`, click `farm-entry-chapter-boss`, wait for `.stage-hud` text `Rever chefe: Chefe do capítulo (Capítulo 14)`, shot. The longest label: two lines, timer pushed right, clear of the wallet.
9. `09-current-chapter-fight-label` - `start(page, { definition: CHAPTER_2 })`, open the map, click `farm-entry-miniboss-1`, wait for `.stage-hud` text `Rever chefe: Miniboss 1`, shot. A current chapter label on one 19px line with the timer beside it.

**Steps**:

1. Add tests 08 and 09; run `cd game && npm run ui:shots -- bossReplayChapters`.
2. Check shots 03, 08, 09 (desktop and phone): the whole label is readable, the chapter line sits under the first line, left-aligned, 14px `--ink-600`; the timer starts 12px after the plate and never covers it; the timer ends before the wallet; the plate stays inside the top row (no overlap with the `Capítulo` tag at y 96 or the effects row).
3. Check shots 01, 06, 07: the dot sits under the numeral with a visible gap; numerals of all chips on one line; the focus ring of 07 unchanged.
4. Rewrite `ui-review.html` from `.claude/templates/ui-review.html` as the round 2 review: verdict (APROVADO or REPROVADO), findings #1 and #2 marked resolved with their shots, any new finding with severity and shot.

**Tests**: none (review task; the screenshots are not tests)
**Gate**: build - `cd game && npm run ui:shots -- bossReplayChapters` exits 0
**Done when**:

- [x] 18 PNG files (9 shots x 2 projects) are under `.specs/features/boss-replay-chapters/ui-review/`. (20 delivered in `f31884d`: the ui-artist added shot 10, the campaign boss timer still centred.)
- [x] `ui-review.html` names a verdict and states, for findings #1 and #2, resolved or not with the shot that shows it.

**Commit**: `docs(ui-review): re-review the chapter plate, the boss timer and the chip dot`

---

### T20: Closing Rever chefes drops a pending chapter load [ ]

**Owner**: game-dev
**Goal**: Closing Rever chefes, or opening a panel screen over it, drops a pending chapter load: the chips are enabled on the next opening and the late answer, a success or a failure, changes neither the farm session nor the panel (BRC-10; spec P1-Choose AC 14, 15 and the five TD-009 edge cases; `STATE.md` TD-009).
**Where**: `game/src/application/farm/farmSession.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.js`, `game/src/application/farm/farmSession.test.js`, `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `farmSession.js:1-56` (whole file); `HeroUi.js` - search `async show (screen, options = {})` (about line 151), `close ()` (about line 229) and `async selectFarmChapter (chapter)` (about line 717); `farmSession.test.js:1-14` (`state`, `beforeEach`) and `:70-72` (`D2`); `HeroUi.test.js:9` (`flush`), `:30-88` (`createUi`, `open`) and `:366-497` (`describe('choosing a chapter')`: `AT3`, `minibosses`, `ELEVEN`, `tenStages`, `state2`, `state3`, `chipsOf`, `title`, `setup`)
**Depends on**: T19
**Requirement**: BRC-10

**Why it breaks today**: `selectFarmChapter` sets `this.farmBusy = true` and awaits `this.farm.load(chapter)`. `close()` bumps `this.view` but leaves `farmBusy` true, so the reopened map (`show('farm')` then `render_farm`) draws every chip disabled. When the chapter answer arrives, `farmSession.load` writes `bosses`, `winsLeft`, `chapter`, `chapters` and the definition even though the panel shows the current chapter, and the `finally` clears `farmBusy` without a render (the view changed), so the chips stay disabled until the panel is opened again.

**Mechanism**: a generation counter in the farm session (`cancel()` bumps it; `load` drops an answer whose generation is old) plus, in `HeroUi`, a `dropFarmLoad()` called by `show()` and `close()` that resets `farmBusy` and cancels the session load when the screen being left is Rever chefes. `HeroUi`'s existing view counter (`this.view`, bumped by every `show()` and `close()`) is the token of a chip load: a `finally` whose captured view is old does nothing, so it never clears the `farmBusy` of a newer load.

**Contract**:

`farmSession.js` (the only changes; `bosses`, `winsLeft`, `chapter`, `chapters`, `definitionOf` and `win` stay as they are):

```js
export const createFarmSession = ({ gateway }) =>
{
    let bosses = [];
    let winsLeft = null;
    let chapter = null;
    let chapters = [];
    const definitions = new Map();
    //  Bumped by cancel(): the answer of a load started before the last cancel changes nothing (TD-009)
    let generation = 0;

    return {
        // ... bosses, winsLeft, chapter, chapters, definitionOf unchanged ...

        //  Reads the farm state of `selected` (undefined: the current chapter); rejects and keeps the previous state on failure.
        //  An answer that arrives after cancel() is ignored; a failure still rejects.
        load: async (selected) =>
        {
            const started = generation;
            const state = await (selected === undefined ? gateway.get() : gateway.get(selected));

            if (started !== generation)
            {
                return;
            }

            bosses = state.bosses;
            winsLeft = state.chapterBossWinsLeft;
            chapter = Number.isInteger(state.chapter) ? state.chapter : null;
            chapters = Array.isArray(state.chapters) ? state.chapters : [];

            if (chapter !== null && state.definition)
            {
                definitions.set(chapter, state.definition);
            }
        },

        //  Drops the answer of every load still pending; the state already loaded stays
        cancel: () =>
        {
            generation += 1;
        },

        // ... win unchanged ...
    };
};
```

Also add `cancel()` to the port comment at the top of the file: after the `gateway` lines add the line `//  cancel() drops the answer of every pending load (closing Rever chefes, TD-009).`

`HeroUi.js`:

```js
// show(): the first two lines become
const { title } = SCREENS.find(({ id }) => id === screen);
const view = ++this.view;

this.dropFarmLoad();

// close(): the body becomes
if (!this.open)
{
    return;
}

this.view += 1;
this.dropFarmLoad();
this.open = false;
this.screen = null;
this.sellMode = null;
this.panel.hidden = true;
this.body.replaceChildren();

// new method, right after close()
//  Leaving Rever chefes or opening a screen over it drops a pending chapter load (TD-009): the chips are enabled again and the
//  farm session ignores its late answer. Runs before `this.screen` changes, so it reads the screen being left.
dropFarmLoad ()
{
    this.farmBusy = false;

    if (this.screen === 'farm')
    {
        this.farm.cancel();
    }
}

// selectFarmChapter(): the comment and the finally block become
//  Loads another chapter of Rever chefes; the chips are disabled meanwhile and a failure keeps the map shown before.
//  A load dropped by show() or close() changes nothing when it ends: its view is old and farmBusy may belong to a newer load.
async selectFarmChapter (chapter)
{
    // ... unchanged down to the catch ...
    finally
    {
        if (view === this.view)
        {
            this.farmBusy = false;

            if (this.screen === 'farm')
            {
                this.render_farm();

                //  After the render: render_farm clears the error line first
                if (failed)
                {
                    this.setError(LOAD_FAILED);
                }
            }
        }
    }
}
```

`render_farm`, `render_*` of the other screens, the constructor and `ClickerGame.js` do not change. No player-facing text changes.

**Steps**:

1. `farmSession.js`: add `let generation = 0;`, the `started` check in `load`, the `cancel` method and the port comment line.
2. `HeroUi.js`: add `this.dropFarmLoad();` in `show()` right after `const view = ++this.view;`.
3. `HeroUi.js`: add `this.dropFarmLoad();` in `close()` right after `this.view += 1;`.
4. `HeroUi.js`: add the `dropFarmLoad ()` method right after `close ()`.
5. `HeroUi.js`: replace the comment above `selectFarmChapter` and its `finally` block as above.
6. Add the 5 `farmSession.test.js` cases in a new `describe('cancel', () => { ... })` at the end of `describe('farmSession')`.
7. Add the 6 `HeroUi.test.js` cases at the end of `describe('choosing a chapter')` (after `a farm answer without the new fields shows no chapter buttons`).
8. Run the gate.

**Tests**: unit (jsdom)
**Test cases** (`farmSession.test.js`, `describe('cancel')`; `gateway`, `farm` and `state` are the file's, `ApiError` is imported already):

- `cancel drops the answer of a load still pending`: `let answer; gateway.get.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));` `const pending = farm.load(2); farm.cancel();` `answer({ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [ { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft: 4, definition: { bossHealth: 2 } }); await pending;` then `farm.bosses()` equals `[]`, `farm.winsLeft()` is `null`, `farm.chapter()` is `null`, `farm.chapters()` equals `[]`, `farm.definitionOf(2)` is `null`.
- `cancel keeps the state already loaded`: `await farm.load(); farm.cancel();` then `farm.bosses()` equals `state.bosses` and `farm.winsLeft()` is `7`.
- `a load started after cancel keeps its answer`: `farm.cancel(); await farm.load();` then `farm.bosses()` equals `state.bosses` and `farm.winsLeft()` is `7`.
- `cancel drops only the loads started before it`: `let answer; gateway.get.mockReturnValueOnce(new Promise((resolve) => { answer = resolve; }));` `const first = farm.load(2); farm.cancel(); await farm.load();` (the second call gets the default `state`) `answer({ chapter: 2, chapters: [ 1, 2, 3 ], bosses: [], chapterBossWinsLeft: 4, definition: { bossHealth: 2 } }); await first;` then `farm.bosses()` equals `state.bosses`, `farm.winsLeft()` is `7`, `farm.chapter()` is `null`, `farm.definitionOf(2)` is `null`.
- `a load pending across a cancel still rejects with its failure and keeps the state`: `await farm.load(); let fail; gateway.get.mockReturnValueOnce(new Promise((_, reject) => { fail = reject; }));` `const pending = farm.load(1); farm.cancel(); fail(new ApiError('Cannot reach the server. Try again later.'));` `await expect(pending).rejects.toBeInstanceOf(ApiError);` then `farm.bosses()` equals `state.bosses` and `farm.winsLeft()` is `7`.

**Test cases** (`HeroUi.test.js`, inside `describe('choosing a chapter')`; every case starts with `const ctx = createUi();`; "reopen" means `ctx.testid('hero-close').click(); await open(ctx, 'farm');`; "the chapter 2 click" means `ctx.testid('farm-chapter-2').click();` with no `flush`):

- `closing during a chapter load and reopening leaves the chips enabled on the current chapter`: `let resolveChapter2; setup(ctx, () => new Promise((resolve) => { resolveChapter2 = resolve; })); await open(ctx, 'farm');` the chapter 2 click; `expect(chipsOf(ctx).every((chip) => chip.disabled)).toBe(true)`; reopen; `chipsOf(ctx).some((chip) => chip.disabled)` is `false`, `title(ctx)` is `Caminho do Capítulo 3`, `farm-chapter-3` `aria-pressed` is `true`; then `resolveChapter2(state2); await flush();` and the same three expectations hold again.
- `a chapter answer that arrives after closing and reopening changes neither the farm session nor the map`: same setup, open, the chapter 2 click, reopen, `resolveChapter2(state2); await flush();` then `ctx.farm.chapter()` is `3`, `ctx.farm.bosses()` equals `state3.bosses`, `ctx.farm.definitionOf(2)` is `null`, `title(ctx)` is `Caminho do Capítulo 3`, `farm-chapter-3` `aria-pressed` is `true`, `farm-chapter-2` `aria-pressed` is `false`.
- `a chapter load that fails after closing and reopening shows no error`: `let rejectChapter2; setup(ctx, () => new Promise((_, reject) => { rejectChapter2 = reject; }));` open, the chapter 2 click, reopen, `rejectChapter2(new ApiError('Cannot reach the server. Try again later.')); await flush();` then `ctx.query('.hero-error').hidden` is `true`, `ctx.query('.hero-error').textContent` is `''`, `chipsOf(ctx).some((chip) => chip.disabled)` is `false`, `title(ctx)` is `Caminho do Capítulo 3`.
- `a late answer of a dropped chapter load leaves the chips of a newer load disabled`: inside the test `const state1 = { chapter: 1, chapters: [ 1, 2, 3 ], bosses: ELEVEN, chapterBossWinsLeft: 10, definition: { bossHealth: 10, bossTimeLimitMs: 40_000, stages: tenStages() } }; let resolveChapter1; let resolveChapter2; ctx.ui.hooks.mapPosition = () => AT3;` `ctx.farmGateway.get.mockImplementation((chapter) => { if (chapter === 2) { return new Promise((resolve) => { resolveChapter2 = resolve; }); } if (chapter === 1) { return new Promise((resolve) => { resolveChapter1 = resolve; }); } return Promise.resolve(state3); });` open, the chapter 2 click, reopen, `ctx.testid('farm-chapter-1').click();` `resolveChapter2(state2); await flush();` then `chipsOf(ctx).every((chip) => chip.disabled)` is `true` and `title(ctx)` is `Caminho do Capítulo 3`; the chapter 1 load still holds the busy flag: `const asked = ctx.farmGateway.get.mock.calls.length; ctx.ui.selectFarmChapter(2);` and `ctx.farmGateway.get.mock.calls.length` is still `asked` (a disabled button cannot be clicked in jsdom, so the method is called directly); then `resolveChapter1(state1); await flush();` and `title(ctx)` is `Caminho do Capítulo 1`, `farm-chapter-1` `aria-pressed` is `true`, `chipsOf(ctx).some((chip) => chip.disabled)` is `false`, `ctx.farm.definitionOf(2)` is `null`.
- `the scene reopening Rever chefes during a chapter load drops that load`: `let resolveChapter2; setup(ctx, () => new Promise((resolve) => { resolveChapter2 = resolve; })); await open(ctx, 'farm');` the chapter 2 click; `await ctx.ui.show('farm', {});` then `chipsOf(ctx).some((chip) => chip.disabled)` is `false` and `title(ctx)` is `Caminho do Capítulo 3`; then `resolveChapter2(state2); await flush();` and `title(ctx)` is `Caminho do Capítulo 3` and `ctx.farm.chapter()` is `3`.
- `closing another screen keeps a farm load the scene started`: `let resolveCurrent; ctx.ui.hooks.mapPosition = () => AT3; ctx.farmGateway.get.mockImplementation(() => new Promise((resolve) => { resolveCurrent = resolve; }));` `const pending = ctx.farm.load();` (the reload `ClickerGame.reportFarmWin` starts after a refused win) `await open(ctx, 'heroes'); ctx.testid('hero-close').click();` `resolveCurrent(state3); await pending;` then `ctx.farm.chapter()` is `3` and `ctx.farm.bosses()` equals `state3.bosses`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 5 new `farmSession.test.js` cases and the 6 new `HeroUi.test.js` cases pass.
- [ ] Every existing case passes unchanged, among them `the chapter buttons are disabled while the chapter loads`, `a failed chapter load keeps the map and says Não foi possível carregar.` and `opening from the HUD again shows the current chapter`.
- [ ] `git diff --stat` lists only `farmSession.js`, `farmSession.test.js`, `HeroUi.js`, `HeroUi.test.js` and `tasks.md`; `ClickerGame.js` is unchanged.

**Commit**: `fix(game): drop a pending chapter load when Rever chefes closes`

---

### T21: e2e of closing Rever chefes during a chapter load [ ]

**Owner**: test-engineer
**Goal**: The fake backend can hold the answer of `GET /farm?chapter=n` until the test releases it, and three Playwright scenarios prove what the player sees when Rever chefes is closed during a chapter load and reopened (BRC-10; spec P1-Choose AC 14, 15 and the TD-009 edge cases "close with `hero-close`" and "fails after Esc").
**Where**: `game/e2e/bossReplayChapters.spec.js`
**Also changes**: `game/e2e/support/fakeBackend.js`
**Read first**: `fakeBackend.js:220-245` (options comment, `mockBackend` signature, the first `const` lines), `:804-813` (`handler` down to the `delayMs` line), `:923-950` (the returned controls); `bossReplayChapters.spec.js:1-40` (`startGame`, `openMap`, `states`), `:324-352` (`while a chapter loads every chapter button is disabled, dimmed and shows the map shown before`: how a held answer is asserted) and the last test of the file (`the gold dot of the current chip sits under the numeral, clear of it`)
**Depends on**: T20
**Requirement**: BRC-10

**Contract**:

`fakeBackend.js`:

```js
// inside mockBackend, right after `const rolled = new Map();`
//  GET /farm?chapter=n requests held by holdFarm(n), keyed by the query value: { released, fail }
const farmHolds = new Map();

// inside handler, right after the line `if (delayMs) { await new Promise((resolve) => setTimeout(resolve, delayMs)); }`
//  holdFarm: a held chapter answers only once the test releases it, from the state at that moment, or 500 when it was held with fail
const hold = method === 'GET' && path === '/farm' ? farmHolds.get(new URL(request.url()).searchParams.get('chapter')) : undefined;

if (hold) {
    await hold.released;

    if (hold.fail) { return route.fulfill({ status: 500, body: '' }); }
}

// in the returned object, right after `revokeAllRefreshTokens`
//  Holds every GET /farm?chapter=<chapter> until the returned release() runs; GET /farm without a chapter is never held
holdFarm: (chapter, { fail = false } = {}) => {
    let release = () => {};
    const released = new Promise((resolve) => { release = resolve; });

    farmHolds.set(String(chapter), { released, fail });
    return () => {
        farmHolds.delete(String(chapter));
        release();
    };
}
```

Extend the comment line above `export async function mockBackend` that starts `//  Returns the recorded` so it ends: `... test controls over issued tokens, and holdFarm(chapter, { fail }) -> release() to hold the answer of GET /farm?chapter=n.` A held request is still recorded in `calls` (the push happens before the hold).

`bossReplayChapters.spec.js`, a helper after `states`:

```js
//  Resolves once the game has read the answer of GET /farm?chapter=<chapter>: the response is complete, then one frame and one task pass.
//  Call it before releasing the hold, so the response is not missed.
const farmAnswerRead = (page, chapter) => page.waitForResponse((response) => new URL(response.url()).pathname === '/api/farm'
    && new URL(response.url()).searchParams.get('chapter') === String(chapter))
    .then((response) => response.finished())
    .then(() => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)))));
```

The chapter 3 map's stop states (the campaign at chapter 3 stage 4), used below as `CURRENT_STOPS`: `[ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]`. Declare it as a `const` next to the helper.

**Steps**:

1. `fakeBackend.js`: add `farmHolds`, the hold check in `handler`, the `holdFarm` control and the comment.
2. `bossReplayChapters.spec.js`: add `farmAnswerRead` and `CURRENT_STOPS` after `states`.
3. Add the three scenarios below at the end of `test.describe('Rever chefes: escolher capítulo')`, after `the gold dot of the current chip sits under the numeral, clear of it`. Every scenario releases its hold before it ends.
4. Run the gate.

**Tests**: e2e
**Test cases** (`bossReplayChapters.spec.js`; every scenario starts with `const { backend } = await startGame(page);`):

- `closing during a chapter load and reopening leaves the chips enabled on the current chapter`: `const releaseChapter2 = backend.holdFarm(2); await openMap(page);` click `farm-chapter-2`; `farm-chapter-2` `toBeDisabled()`; click `hero-close`; `.hero-panel` `toBeHidden()`; `await openMap(page);` then `farm-map-title` `toHaveText('Caminho do Capítulo 3')`, `farm-chapter-3` `toHaveAttribute('aria-pressed', 'true')`, `farm-chapter-1`, `farm-chapter-2` and `farm-chapter-3` each `toBeEnabled()`, `await states(page)` equals `CURRENT_STOPS`; then `const read = farmAnswerRead(page, 2); releaseChapter2(); await read;` and the three chips are each still `toBeEnabled()` and the title still `Caminho do Capítulo 3`.
- `a chapter answer that arrives after closing and reopening does not change the shown chapter`: `const releaseChapter2 = backend.holdFarm(2); await openMap(page);` click `farm-chapter-2`; `farm-chapter-2` `toBeDisabled()`; click `hero-close`; `await openMap(page);` title `Caminho do Capítulo 3`; `const read = farmAnswerRead(page, 2); releaseChapter2(); await read;` then title `Caminho do Capítulo 3`, `farm-chapter-3` pressed, `farm-chapter-2` `toHaveAttribute('aria-pressed', 'false')`, `await states(page)` equals `CURRENT_STOPS`, `farm-chapter-1` `toBeEnabled()`. Then, the check that the farm session kept no chapter 2 state (the busy render of a new chip draws the session's chapter): `const releaseChapter1 = backend.holdFarm(1);` click `farm-chapter-1`; `farm-chapter-1` `toBeDisabled()`; title `Caminho do Capítulo 3`; `farm-chapter-3` pressed; `await states(page)` equals `CURRENT_STOPS`; `releaseChapter1();` then title `toHaveText('Caminho do Capítulo 1')`, `farm-chapter-1` pressed, `await states(page)` equals `Array(11).fill('defeated')`.
- `a chapter load that fails after Esc closed Rever chefes shows no error on the reopened map`: `const releaseChapter1 = backend.holdFarm(1, { fail: true }); await openMap(page);` click `farm-chapter-1`; `farm-chapter-1` `toBeDisabled()`; `await page.keyboard.press('Escape');` `.hero-panel` `toBeHidden()`; `await openMap(page);` `const read = farmAnswerRead(page, 1); releaseChapter1(); await read;` then `.hero-error` `toBeHidden()`, title `Caminho do Capítulo 3`, `farm-chapter-3` pressed, `farm-chapter-1`, `-2`, `-3` each `toBeEnabled()`.

**Gate**: full - `cd game && npx playwright test e2e/bossReplayChapters.spec.js e2e/farm.spec.js e2e/bossMap.spec.js`
**Done when**:

- [ ] The 3 new scenarios pass, and every other scenario of `bossReplayChapters.spec.js`, `farm.spec.js` and `bossMap.spec.js` passes unchanged (a failing test is rerun alone twice with `--workers=1` and counts as a load flake only when it passes both).
- [ ] Each of the 3 new scenarios asserts at least one chip `toBeEnabled()` after the reopen (on the code before T20 the reopened chips stay disabled, so every one of them fails there).
- [ ] No scenario asserts a stop position number; `git diff --stat` lists only `fakeBackend.js`, `bossReplayChapters.spec.js` and `tasks.md`.

**Commit**: `test(e2e): cover closing Rever chefes during a chapter load`

No `ui-artist` task: T20 adds no element, text, style or state the player has not seen; the enabled and the disabled chips were reviewed in T14 and T19. The `verifier` re-verifies scoped to BRC-10 (T20, T21), with mutants on `farmSession.load`'s generation check, `cancel`, `dropFarmLoad` and the `finally` view check.

---

## If the owner changes a default

| Answer | Tasks that change before execution |
| --- | --- |
| Q1: chapters survive a reset (use `cleared_chapters`) | T1 (`reachedChapters` from `BossRecord.clearedChapters` + current), T2, T3, T12, T13 |
| Q2: one daily limit per chapter | New expand migration `V11__boss_wins_per_chapter.sql` (table `boss_daily_wins(username, chapter, wins_day, wins_today)`), `BossRecord`, T2, T3, T12, T13; Q2 alone turns this into a schema feature |
| Q5: arrows instead of chips | T8, T9, T13, T14 |
| Q6: remember the last chapter | T10 (HUD opening passes the last chapter), T13 |
| Q7: chapter always in the label | T6, T11, T13, and the existing label assertions get renamed per L-054 |

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

Phase 1:  T1 ------→ T2 ------→ T3                    kotlin-backend-dev
Phase 2:  T4 ------→ T5 ------→ T6 ------→ T7         game-dev
Phase 3:  T8 ------→ T9 ------→ T10 -----→ T11        game-dev
Phase 4:  T12 -----→ T13                              test-engineer
Phase 5:  T14                                         ui-artist
Phase 6:  T15 -----→ T16 -----→ T17                   game-dev
Phase 7:  T18 -----→ T19                              test-engineer, ui-artist
Phase 8:  T20 -----→ T21                              game-dev, test-engineer
```

14 tasks: batches by whole phases (~7 tasks each): batch 1 = Phases 1 (backend worker), batch 2 = Phases 2 and 3 (game worker, 8 tasks, one tight chain), batch 3 = Phases 4 and 5. Then the `verifier` runs.

UI review fixes (T15 to T19): one game worker runs Phase 6 (3 tasks, one chain: T15 and T16 both edit `ClickerGame.js` and `style.css`, T17 edits `style.css`), then the `test-engineer` runs T18 and the `ui-artist` T19. The `verifier` re-verifies scoped to BRC-08 and BRC-09 and these five tasks, then runs the full suites for the final PASS round.

TD-009 (T20, T21): the `game-dev` runs T20, then the `test-engineer` runs T21 (its author check first, `.claude/agents/test-engineer.md`). The `verifier` re-verifies scoped to BRC-10 and these two tasks, then runs the full suites for the final PASS round; then the `product-owner` accepts against P1-Choose AC 14, 15 and the TD-009 edge cases.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: beaten / reachedChapters | 1 domain object | ✅ Granular |
| T2: farm service per chapter | 1 service (+ its data class and use case signatures) | ⚠️ 3 related files, cohesive: the use case and state change only to carry the service's new parameter |
| T3: farm controller | 1 controller | ✅ Granular |
| T4: farm client | 1 module | ✅ Granular |
| T5: farm session | 1 module | ✅ Granular |
| T6: farm encounter + label | 2 functions, 1 file | ✅ Granular |
| T7: map position | 1 function | ✅ Granular |
| T8: chapter chips view | 1 view function | ✅ Granular |
| T9: chip CSS | 1 rule block | ✅ Granular |
| T10: HeroUi farm screen | 2 methods, 1 file | ✅ Granular |
| T11: scene farm fight | 1 method + 3 call sites, 1 file | ✅ Granular |
| T12: fake backend farm | 1 handler | ✅ Granular |
| T13: e2e spec | 1 spec file | ✅ Granular |
| T14: UI review | 1 shots file + report | ✅ Granular |
| T15: chapter line of the plate | 1 view function + 1 call site + 1 CSS block | ✅ Granular |
| T16: timer beside the plate | 1 method + 3 call sites, 1 file (+ 2 CSS lines) | ✅ Granular |
| T17: chip dot spacing | 2 CSS values | ✅ Granular |
| T18: e2e of plate, timer, dot | 1 spec file | ✅ Granular |
| T19: UI re-review | 1 shots file + report | ✅ Granular |
| T20: drop a pending chapter load | 1 session method + 1 HeroUi method + 3 call sites, 2 source files | ⚠️ 2 related files, cohesive: the HeroUi call is useless without the session's `cancel` |
| T21: e2e of the close during a load | 1 fake backend control + 1 spec file | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend service | unit | unit | ✅ OK |
| T3 | Backend web | integration | integration | ✅ OK |
| T4 | Game http | unit | unit | ✅ OK |
| T5 | Game application | unit | unit | ✅ OK |
| T6 | Game domain | unit | unit | ✅ OK |
| T7 | Game domain | unit | unit | ✅ OK |
| T8 | Game view | unit (jsdom) | unit (jsdom) | ✅ OK |
| T9 | Game CSS | none | none | ✅ OK |
| T10 | Game view (HeroUi) | unit (jsdom) | unit (jsdom) | ✅ OK |
| T11 | Game scene | unit (jsdom) | unit (jsdom) | ✅ OK |
| T12 | e2e support | e2e | e2e | ✅ OK |
| T13 | e2e | e2e | e2e | ✅ OK |
| T14 | Review artefacts | none | none | ✅ OK |
| T15 | Game view + scene + CSS | unit (jsdom) | unit (jsdom) | ✅ OK |
| T16 | Game scene + CSS | unit (jsdom) | unit (jsdom) | ✅ OK |
| T17 | Game CSS | none | none (checked in T18 and T19) | ✅ OK |
| T18 | e2e | e2e | e2e | ✅ OK |
| T19 | Review artefacts | none | none | ✅ OK |
| T20 | Game application + view (HeroUi) | unit (jsdom) | unit (jsdom) | ✅ OK |
| T21 | e2e support + e2e | e2e | e2e | ✅ OK |
