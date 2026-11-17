# Boss Replay Chapters Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/boss-replay-chapters/spec.md`
**Design**: `.specs/features/boss-replay-chapters/design.md`
**Status**: Approved by the owner on 2026-11-17 ("Aprovo os padrões"): every default of Q1 to Q8 accepted. T1 to T14 pending.

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

### T4: Farm client sends and asks for a chapter [ ]

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

- [ ] The 4 new cases pass; `get calls GET /farm and returns the response body` and `win sends only the kind and the stage of the boss` pass unchanged.

**Commit**: `feat(game): ask the farm for a chapter and report its wins`

---

### T5: Farm session keeps the chapter, the chapters and each definition [ ]

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

- [ ] The 7 new cases pass; the 6 existing cases pass unchanged.

**Commit**: `feat(game): keep the farm chapter and its definition`

---

### T6: Farm fight of a given definition and its label [ ]

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

- [ ] The 6 new cases pass; every existing `Campaign` farm case (`a farm encounter carries no drop rule`, `a miniboss uses the health, stats and time limit of its stage and is labelled for the farm`, and the rest of that `describe`) passes unchanged.

**Commit**: `feat(game): build a farm fight from any chapter definition`

---

### T7: Map position of an earlier chapter [ ]

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

- [ ] The 3 new cases pass; every existing `bossMapStops` case passes unchanged.

**Commit**: `feat(game): draw the map of an earlier chapter as cleared`

---

### T8: Chapter chips on the map screen [ ]

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

- [ ] The 8 new cases pass; every existing `renderFarm` case passes unchanged.

**Commit**: `feat(game): show the chapter chips on the boss map`

---

### T9: Grove style of the chapter chips [ ]

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

- [ ] `npm test` and `npm run build` pass; `git diff --stat` lists only `style.css` and `tasks.md`.

**Commit**: `style(game): draw the chapter chips in the Grove theme`

---

### T10: Rever chefes loads, switches and reopens chapters [ ]

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

- [ ] The 9 new cases pass; the 3 existing `HeroUi Rever chefes` cases pass unchanged.

**Commit**: `feat(game): pick the chapter on Rever chefes`

---

### T11: Earlier chapter farm fight in the scene [ ]

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

- [ ] The 5 new cases pass; every existing `ClickerGame farm mode` case passes unchanged (`fights the beaten boss with its numbers and the farm label...`, `a chapter boss win that leaves 0 wins today ends the farm and shows the list with 0 left`, the switch cases that expect `win` called with `{ kind: 'MINIBOSS', stage: 1 }`).

**Commit**: `feat(game): fight an earlier chapter boss with its own numbers`

---

### T12: Fake backend farm per chapter [ ]

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

- [ ] Every test of the three specs passes unchanged (a failing test is rerun alone twice with `--workers=1` and counts as a load flake only when it passes both).
- [ ] `git diff --stat` lists only `fakeBackend.js` and `tasks.md`.

**Commit**: `test(e2e): let the fake backend farm any reached chapter`

---

### T13: e2e scenarios of the chapter selector [ ]

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

- [ ] The 13 scenarios pass, and `farm.spec.js` and `bossMap.spec.js` pass unchanged.
- [ ] No scenario asserts a stop position number.

**Commit**: `test(e2e): cover choosing an earlier chapter in Rever chefes`

---

### T14: UI review of the chapter selector [ ]

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
6. `06-fifteen-chapters` - completed campaign, 15 chips (the phone shot shows the wrap).
7. `07-chip-focus` - keyboard focus on chip 2 (`Tab` to it).

**Steps**:

1. Write the shots file; run `cd game && npm run ui:shots -- bossReplayChapters`.
2. Check each shot against the Visual Spec table (sizes, colours, fonts, placement, wrap, focus ring, disabled look, contrast of `--parchment-100` on `--wood-800` and on `--ember-700`, and of `--ink-600` on the parchment panel).
3. Write `ui-review.html` with the verdict (APROVADO or REPROVADO) and each finding with severity; every finding the `product-owner` accepts becomes a task in this file.

**Tests**: none (review task; the screenshots are not tests)
**Gate**: build - `cd game && npm run ui:shots -- bossReplayChapters` exits 0
**Done when**:

- [ ] 14 PNG files (7 shots x 2 projects) are under `.specs/features/boss-replay-chapters/ui-review/`.
- [ ] `ui-review.html` names a verdict and lists every finding with its shot.

**Commit**: `docs(boss-replay-chapters): review the chapter selector UI`

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
```

14 tasks: batches by whole phases (~7 tasks each): batch 1 = Phases 1 (backend worker), batch 2 = Phases 2 and 3 (game worker, 8 tasks, one tight chain), batch 3 = Phases 4 and 5. Then the `verifier` runs.

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
