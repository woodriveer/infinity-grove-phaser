# Rankings Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T20) and the `ui-artist` review (T21) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/rankings/spec.md`
**Design**: `.specs/features/rankings/design.md`
**Status**: Approved by the owner on 2026-11-28 with the recommended answers to Q1 to Q14 (nick = username, story time on the real clock, every default as written). Execution started.

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`. `main/` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `test/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`.
- Before reading code, run `graphify query "<question>"` (CLAUDE.md § graphify); read raw files only for the lines the graph or this file located. After changing code, run `graphify update .`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text or the test name when the line moved.
- **Branch.** Every task works on the branch `ci/rankings`. The first task (T1) creates it: `git fetch origin && git switch -c ci/rankings origin/main`. Every later task starts with `git switch ci/rankings && git pull --rebase origin ci/rankings`. Push right after each commit: `git push origin HEAD:ci/rankings`. No task pushes to `main`; `gitops` merges once T20's CI run is green and T21 is APROVADO.
- One task = one commit with the message under **Commit**, checked with `py -3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's files and `graphify-out/`, which no task stages.
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- **Local gates only.** Locally run only the gate of the task: one backend test class that needs no Testcontainers (`cd backend && ./gradlew ktlintCheck test --tests <Class>`), Vitest (`cd game && npm test`), or the one Playwright file of the task. A class that extends `IntegrationTestBase` (name ends in `IT`) needs Docker: do not run it locally; push and run `node scripts/ci-wait.mjs ci/rankings` once in the foreground with `timeout: 600000` (exit 0 green, 1 red; a timed-out call is repeated once, it reattaches). No suite runs in the background; never two suites at once.
- **Re-pinning existing tests.** A task changes an existing test only where its table lists it, only to the name and value given. Name every re-pinned test in the commit body. If a test the task does not list fails, stop and report it to the orchestrator; do not change it.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times.
- Kotlin style: ktlint (the gate runs `ktlintCheck`), KDoc on every public type and function, an SLF4J logger per class (`LoggerFactory.getLogger(X::class.java)`) with `key={}` pairs as the existing services do. Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces, imports pointing inward only (AD-003). Player text in Portuguese exactly as spec § Player-Facing Texts, with its accents; files stay UTF-8.
- The desktop is the target. No task adds phone behaviour.

**Constructor changes (T6, T7, T8).** `ProgressService`, `FarmService` and `AccountResetService` get `private val records: RecordKeeping` as their **last** constructor parameter. Every test that builds one of them passes `NoRecordKeeping` (T5 adds it to `test/Fakes.kt`) as the last argument, except the new hook cases that pass a `RecordingRecordKeeping`. Find them with `grep -rn "ProgressService(\|FarmService(\|AccountResetService(" backend/src/test`; today: `ProgressServiceTest.kt:73`, `:292`, `:490`, `:580`, `FarmServiceTest.kt:60`, `AccountResetServiceTest.kt:35`. This is a wiring change, not a re-pin: no asserted value changes.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour; heavy suites only in CI), `.claude/agents/test-engineer.md` (author check, mutants with `scripts/sensor.mjs`), `backend/build.gradle.kts` (JUnit 5, Testcontainers `postgres:17`, ktlint), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome, fake backend). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend migration (`V21__rankings.sql`) | integration | Trigger insert/rise/fall/equal, backfill, cascade, every check; previous release starts on the schema | `test/adapter/repository/RankingsMigrationIT.kt`, `PreviousBackendCompatibilityIT.kt` | CI (`node scripts/ci-wait.mjs ci/rankings`) |
| Backend domain (`Rankings.kt`, `ClickPower.kt`) | unit | Every clock transition, floor, run start, chapter check; C1 to C6 and the refine case; 1:1 to spec Boss AC 1 to 9, Story AC 1 to 6, Power AC 1 | `test/domain/RankingsTest.kt`, `test/domain/ClickPowerTest.kt` | `cd backend && ./gradlew ktlintCheck test --tests '*RankingsTest' --tests '*ClickPowerTest'` |
| Backend repository (`RankingRepository.kt`) | integration | Clock read/write, the three upserts keep the better value, board order, ties, limit, `me`, fortune 0 | `test/adapter/repository/RankingRepositoryIT.kt` | CI |
| Backend services (`RecordKeeper`, hooks, `RankingService`) | unit (in-memory fakes, `MutableClock`) | Every Boss, Story and Power AC and Edge Case with exact ms; the hook calls of `ProgressService`, `FarmService`, `AccountResetService`; board page and refresh | `test/service/*Test.kt` | `cd backend && ./gradlew ktlintCheck test --tests '<Class>'` |
| Backend web (`RankingController`, `ApiExceptionHandler`) | integration | Every Boards API AC (shape, order, `me`, JSON integer vs number, 400, 404, 401) and one real boss-time flow | `test/adapter/web/RankingControllerIT.kt` | CI |
| Game domain (`rankings.js`) | unit | Every example of spec § Value Formats; `rankingRows` own row, gap, pinned, none, empty, medals | `game/src/domain/rankings/rankings.test.js` | `cd game && npm test` |
| Game http and application (`rankingApi.js`, `rankingBoard.js`) | unit | Paths and bodies; default chapter; generation (late answers); failure keeps nothing; click power failure ignored | `game/src/adapters/http/rankingApi.test.js`, `game/src/application/rankings/rankingBoard.test.js` | `cd game && npm test` |
| Game view (`rankingView.js`, `style.css`) | unit + e2e | Every element and test id of the view contract; text-only username | `game/src/adapters/phaser/views/rankingView.test.js`, `game/e2e/rankings.spec.js` | `cd game && npm test`, `npx playwright test e2e/rankings.spec.js` |
| Game screen (`HeroUi.js`, `ClickerGame.js`, `composition.js`) | unit | Rail order, open flow, tab and chip flow, failure, cancel; wiring | `HeroUi.test.js`, `ClickerGame.test.js`, `composition.test.js` | `cd game && npm test` |
| Formula parity | unit (both suites read one fixture) | C1 to C6 in Kotlin and in JavaScript | `backend/src/test/resources/ranking/click-power-cases.json`, `ClickPowerTest.kt`, `game/src/domain/combat/clickPowerParity.test.js` | both gates |
| Player-visible behaviour | e2e | Every AC of Ranking screen, Rows and formats, Loading and failure; the UI Edge Cases | `game/e2e/rankings.spec.js` | `cd game && npx playwright test e2e/rankings.spec.js` |
| E2E support (`fakeBackend.js`) | none (support code; exercised by `rankings.spec.js`) | - | `game/e2e/support/fakeBackend.js` | the gate of T18 |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/rankings.shots.js` | `cd game && npm run ui:shots -- rankings` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend unit | T2, T3, T5 to T9 | `cd backend && ./gradlew ktlintCheck test --tests '<the test classes of the task>'` |
| Backend CI | T1, T4, T10 (Testcontainers) | `git push origin HEAD:ci/rankings` then `node scripts/ci-wait.mjs ci/rankings` (foreground, `timeout: 600000`), job `backend` green |
| Quick | T11 to T17 | `cd game && npm test && npm run build` |
| E2E file | T18, T19 | `cd game && npm test && npx playwright test e2e/<one file>` (one file per run, every file of the task in turn) |
| CI | T20 | `node scripts/ci-wait.mjs ci/rankings` exits 0 (every job) |

---

## Execution Plan

### Phase 1: Backend storage and rules (kotlin-backend-dev)

```
T1 → T4
T2 → T4
T3
```

### Phase 2: Backend records and API (kotlin-backend-dev)

```
T5 → T6 → T10
T5 → T7 → T10
T5 → T8 → T10
T5 → T9 → T10
```

### Phase 3: Game (game-dev)

```
T11 → T13 → T15 → T16
T11 → T14 → T15
T12 → T16
```

### Phase 4: Tests in the browser and author check (test-engineer)

```
T17 → T20
T18 → T20
T19 → T20
```

### Phase 5: UI review (ui-artist)

```
T21
```

---

## Task Breakdown

### Phase 1: Backend storage and rules

#### T1: V21 migration: ranking tables and the fortune trigger [x]

**Owner**: kotlin-backend-dev
**Goal**: The five ranking tables exist, the fortune peak follows every wallet write, the existing wallets start their peak, and the previous release still starts (RNK-04, RNK-06; spec Fortune AC 1 to 5, Storage AC 1 to 4).
**Where**: `backend/src/main/resources/db/migration/V21__rankings.sql` (new)
**Files**:
- Also creates: `test/adapter/repository/RankingsMigrationIT.kt`
- Also changes: `test/adapter/repository/PreviousBackendCompatibilityIT.kt`
- Read first: `V18__reset_legacy.sql` (style), `V19__enemy_defense_expand.sql` (a trigger in this project, if it has one; else this task's SQL is the pattern), `PreviousBackendCompatibilityIT.kt:200-300`, `test/IntegrationTestBase.kt:90-160` (`users(...)`, cleanup deletes users), `test/adapter/repository/LegacyRepositoryIT.kt` (an IT on one table)
**Depends on**: None
**Requirement**: RNK-04, RNK-06

**Contract** (the whole file, exactly):

```sql
-- Rankings (spec rankings, AD-037). Expand only (AD-016): the previous backend never reads these tables, and the trigger keeps the
-- fortune peak for every wallet write, the previous backend's included.
create table if not exists player_run_clock (
    username        varchar(255) not null primary key references users (username) on delete cascade,
    run_started_at  bigint,
    boss_reached_at bigint
);

create table if not exists player_boss_times (
    username    varchar(255) not null references users (username) on delete cascade,
    chapter     integer      not null check (chapter between 1 and 15),
    best_ms     bigint       not null check (best_ms >= 0),
    achieved_at bigint       not null,
    primary key (username, chapter)
);

create index if not exists idx_player_boss_times_board on player_boss_times (chapter, best_ms, achieved_at);

create table if not exists player_story_times (
    username    varchar(255) not null primary key references users (username) on delete cascade,
    best_ms     bigint       not null check (best_ms >= 0),
    achieved_at bigint       not null
);

create index if not exists idx_player_story_times_board on player_story_times (best_ms, achieved_at);

create table if not exists player_click_power (
    username    varchar(255)     not null primary key references users (username) on delete cascade,
    best_power  double precision not null check (best_power > 0),
    achieved_at bigint           not null
);

create index if not exists idx_player_click_power_board on player_click_power (best_power desc, achieved_at);

create table if not exists player_fortune (
    username    varchar(255) not null primary key references users (username) on delete cascade,
    peak_copper bigint       not null check (peak_copper >= 0),
    achieved_at bigint       not null
);

create index if not exists idx_player_fortune_board on player_fortune (peak_copper desc, achieved_at);

-- The peak copper of a wallet (spec rankings, Fortune): every insert and every copper change keeps the larger value
create or replace function record_peak_copper() returns trigger as $$
begin
    insert into player_fortune (username, peak_copper, achieved_at)
    values (new.username, new.copper, (extract(epoch from clock_timestamp()) * 1000)::bigint)
    on conflict (username) do update
        set peak_copper = excluded.peak_copper, achieved_at = excluded.achieved_at
        where excluded.peak_copper > player_fortune.peak_copper;
    return new;
end;
$$ language plpgsql;

drop trigger if exists wallets_peak_copper on wallets;

create trigger wallets_peak_copper
    after insert or update of copper on wallets
    for each row execute function record_peak_copper();

-- Every existing wallet starts its peak at its current copper (spec Q12)
insert into player_fortune (username, peak_copper, achieved_at)
select username, copper, (extract(epoch from clock_timestamp()) * 1000)::bigint from wallets
on conflict (username) do nothing;
```

**Steps**:

1. Create the branch (§ Rules).
2. Create `V21__rankings.sql` with the Contract.
3. In `PreviousBackendCompatibilityIT.kt` apply the re-pin table below and add the new case after the V20 one.
4. Create `RankingsMigrationIT.kt` (`class RankingsMigrationIT : IntegrationTestBase()`, `@Autowired lateinit var jdbc: JdbcTemplate`, `@Autowired lateinit var dataSource: DataSource`) with the cases below; write rows with `jdbc.update(...)` SQL, read with `jdbc.queryForObject(...)`.
5. Push and run the CI gate.

**Re-pins** (`PreviousBackendCompatibilityIT.kt`; only `futureMigrations` changes, each +1):

| Case | Old | New |
| --- | --- | --- |
| `the previous release starts on the migrated schema and its validation ignores V13` | `lastVersion = 12, futureMigrations = 8` | `futureMigrations = 9` |
| `the release before the black awareness staff ... ignores V14` | 13, 7 | 8 |
| `the release before the talent tree rework ... ignores V15` | 14, 6 | 7 |
| `the release before the early game rebalance ... ignores V16 and V17` | 15, 5 | 6 |
| `the release before the reset legacy ... ignores V18` | 17, 3 | 4 |
| `the release before the defense contract ... ignores V19` | 18, 2 | 3 |
| `the release 1 of the defense contract ... ignores V20` | 19, 1 | 2 |
| new: `the release before the rankings starts on the migrated schema and its validation ignores V21` | - | `previousReleaseStartsOnMigratedSchema(lastVersion = 20, futureMigrations = 1)` |

**Tests**: integration
**Test cases** (`RankingsMigrationIT.kt`; `users("ana")` first in each case; `peak()` = `select peak_copper from player_fortune where username = 'ana'`):

1. `a wallet created with 700 copper starts its peak at 700`: `insert into wallets (username, copper) values ('ana', 700)` -> `peak()` 700.
2. `a copper rise moves the peak and a fall keeps it`: insert 0, `update wallets set copper = 500 where username = 'ana'`, then `= 200` -> `peak()` 500 (Fortune AC 1, 2, 5: plain SQL is what the previous backend's JPA update sends).
3. `the same copper again keeps the instant the peak was first reached`: insert 500, read `achieved_at` as `a`, `Thread.sleep(5)`, `update ... set copper = 500` -> `achieved_at` still `a`.
4. `a deleted user takes its rows of the five ranking tables with it`: insert one row in each of `player_run_clock` (`'ana', 1, 2`), `player_boss_times` (`'ana', 3, 12345, 1`), `player_story_times` (`'ana', 3600000, 1`), `player_click_power` (`'ana', 41.0, 1`), wallet 10 (fortune by the trigger); `delete from wallets where username = 'ana'`; `delete from users where username = 'ana'` -> each of the five `select count(*)` is 0.
5. `the boss table refuses chapter 0 and chapter 16`: two inserts -> each throws `DataIntegrityViolationException`.
6. `the time tables refuse a negative time`: `player_boss_times` best_ms -1 and `player_story_times` best_ms -1 -> each throws `DataIntegrityViolationException`.
7. `the power table refuses a power of 0`: best_power 0 -> `DataIntegrityViolationException`.
8. `the migration starts the peak of a wallet that existed before it at its copper` (Fortune AC 4): `Flyway.configure().dataSource(dataSource).schemas("rankings_backfill").createSchemas(true).locations("classpath:db/migration").target("20").load().migrate()`; `insert into rankings_backfill.users (username, password, created_at, last_login_at) values ('old', 'x', 1, 1)`; `insert into rankings_backfill.wallets (username, copper) values ('old', 1234)`; then the same Flyway with `.target("21")` `.migrate()`; `select peak_copper from rankings_backfill.player_fortune where username = 'old'` -> 1234; finally `drop schema rankings_backfill cascade` (in a `finally`).

**Gate**: `git push origin HEAD:ci/rankings` then `node scripts/ci-wait.mjs ci/rankings`: the `backend` job passes `RankingsMigrationIT`, `PreviousBackendCompatibilityIT` and `SchemaValidationIT`.
**Done when**:

- [x] The 8 cases and the 8 compatibility cases pass in CI; no other backend test fails.

**Commit**: `feat(backend): add the ranking tables and the fortune peak trigger`

---

#### T2: Ranking domain: boards, clocks and floors [x]

**Owner**: kotlin-backend-dev
**Goal**: The pure rules of the boss clock, the run start, the floors and the board ids (RNK-01, RNK-02, RNK-05; spec Boss AC 4 to 9, Story AC 3, 4, 6, Boards API AC 8, 9).
**Where**: `main/domain/Rankings.kt` (new)
**Files**:
- Also creates: `test/domain/RankingsTest.kt`
- Read first: `main/domain/Progress.kt` (whole), `main/domain/Chapter.kt:70-125` (`StageDefinition.phasesPerStage`, `ChapterDefinition.stages`), `main/domain/BusinessException.kt`, `test/domain/ResetLegacyTest.kt` (style)
**Depends on**: None
**Requirement**: RNK-01, RNK-02, RNK-05

**Contract** (`package br.com.woodriver.infinity_grove_ws.domain`):

```kotlin
/** The four boards of spec rankings. [id] is the path segment of `GET /rankings/{board}`; [chaptered] boards need a chapter 1 to 15. */
enum class RankingBoard(
    val id: String,
    val lowerIsBetter: Boolean,
    val chaptered: Boolean,
) {
    BOSS_TIME("boss-time", lowerIsBetter = true, chaptered = true),
    STORY_TIME("story-time", lowerIsBetter = true, chaptered = false),
    CLICK_POWER("click-power", lowerIsBetter = false, chaptered = false),
    FORTUNE("fortune", lowerIsBetter = false, chaptered = false),
    ;

    companion object {
        /** The board of [id]; any other id is [RankingNotFoundException]. */
        fun fromId(id: String): RankingBoard = entries.firstOrNull { it.id == id } ?: throw RankingNotFoundException(id)
    }
}

class RankingNotFoundException(
    board: String,
) : BusinessException("RANKING_NOT_FOUND", "Ranking '$board' not found")

class InvalidRankingRequestException(
    reason: String,
) : BusinessException("INVALID_RANKING_REQUEST", reason)

/** One row of a board: position 1..n, the username and the value (ms, power or copper). */
data class RankingEntry(
    val position: Int,
    val username: String,
    val value: Double,
)

/** The caller's own row. */
data class RankingMe(
    val position: Int,
    val username: String,
    val value: Double,
)

/** One board as `GET /rankings/{board}` answers it; [chapter] is null outside BOSS_TIME. */
data class RankingPage(
    val board: RankingBoard,
    val chapter: Int?,
    val entries: List<RankingEntry>,
    val me: RankingMe?,
)

/** The power `POST /rankings/click-power` computed now ([value], null without cards) and the stored best after the call. */
data class ClickPowerResult(
    val value: Double?,
    val best: Double?,
)

/** One player's clocks (spec rankings, Record Rules): the start of the run and the moment the chapter boss was reached; null = unknown/stopped. */
data class RunClock(
    val username: String,
    val runStartedAt: Long? = null,
    val bossReachedAt: Long? = null,
) {
    /** `GET /progress`: a load while standing at the chapter boss restarts the boss clock. */
    fun afterLoad(progress: Progress, now: Long): RunClock = if (atBoss(progress)) copy(bossReachedAt = now) else this

    /**
     * An accepted outcome reported from [reported] that moved the campaign to [next]: a FAILED or CLEARED chapter boss stops the boss
     * clock; a CLEARED that reaches the chapter boss starts it; anything else changes nothing.
     */
    fun afterOutcome(reported: ProgressPosition, outcome: Outcome, next: Progress, now: Long): RunClock =
        when {
            reported.encounter == Encounter.CHAPTER_BOSS -> copy(bossReachedAt = null)
            outcome == Outcome.CLEARED && atBoss(next) -> copy(bossReachedAt = now)
            else -> this
        }

    /** An accepted farm win while the campaign stands at the chapter boss restarts the boss clock. */
    fun afterFarmWin(campaign: Progress, now: Long): RunClock = if (atBoss(campaign)) copy(bossReachedAt = now) else this

    /** An account reset starts a new run and stops the boss clock. */
    fun afterReset(now: Long): RunClock = copy(runStartedAt = now, bossReachedAt = null)

    /** The boss time of a chapter boss win at [now]; null while the boss clock is stopped. */
    fun bossTime(now: Long): Long? = bossReachedAt?.let { now - it }

    private companion object {
        fun atBoss(progress: Progress) = !progress.completed && progress.position.encounter == Encounter.CHAPTER_BOSS
    }
}

/** The floors and limits of spec rankings. */
object RecordRules {
    const val BOSS_FLOOR_MS = 1_000L
    const val ENCOUNTER_FLOOR_MS = 1_000L
    const val TOP = 10
    const val CHAPTER_MESSAGE = "chapter must be an integer between 1 and ${ChapterOrder.MAX_CHAPTER}"

    fun bossTimePlausible(ms: Long): Boolean = ms >= BOSS_FLOOR_MS

    /** 1 000 ms per encounter of [chapters]: each stage's phases and miniboss, plus the chapter boss (1 365 000 for the seed). */
    fun storyFloorMs(chapters: List<ChapterDefinition>): Long =
        chapters.sumOf { chapter -> chapter.stages.sumOf { it.phasesPerStage + 1 }.toLong() + 1 } * ENCOUNTER_FLOOR_MS

    fun storyTimePlausible(ms: Long, floorMs: Long): Boolean = ms >= floorMs

    /** The start of the run: the stored one, else the registration of a player who never reset, else unknown (null). */
    fun runStart(clock: RunClock, resets: Int, createdAt: Long): Long? = clock.runStartedAt ?: if (resets == 0) createdAt else null

    /** The chapter a request for [board] is about: null for a board without chapters, else [chapter] 1 to 15 or [InvalidRankingRequestException]. */
    fun chapterOf(board: RankingBoard, chapter: Int?): Int? =
        if (!board.chaptered) null else chapter?.takeIf { it in 1..ChapterOrder.MAX_CHAPTER } ?: throw InvalidRankingRequestException(CHAPTER_MESSAGE)
}
```

**Steps**:

1. Create `Rankings.kt` with the Contract.
2. Create `RankingsTest.kt` with the cases below (`pos(chapter, stage, encounter, phase = 1)` = `ProgressPosition(...)`, `at(position, completed = false)` = `Progress("ana", position, completed)`).
3. Run the gate.

**Tests**: unit
**Test cases** (`RankingsTest.kt`):

1. `the last miniboss win starts the boss clock`: `RunClock("ana").afterOutcome(pos(3, 10, MINIBOSS), CLEARED, at(pos(3, 10, CHAPTER_BOSS)), 10_000)` -> `bossReachedAt` 10 000.
2. `a phase win and a miniboss win before the last change nothing`: from `RunClock("ana", 5, null)`, `afterOutcome(pos(3, 2, PHASE, 4), CLEARED, at(pos(3, 2, PHASE, 5)), 9)` and `afterOutcome(pos(3, 2, MINIBOSS), CLEARED, at(pos(3, 3, PHASE)), 9)` -> both equal to the input.
3. `a chapter boss win stops the clock and bossTime measures it`: `RunClock("ana", null, 10_000)`: `bossTime(22_345)` 12 345; `afterOutcome(pos(3, 10, CHAPTER_BOSS), CLEARED, at(pos(4, 1, PHASE)), 22_345).bossReachedAt` null.
4. `a failed chapter boss stops the clock`: `RunClock("ana", null, 0).afterOutcome(pos(3, 10, CHAPTER_BOSS), FAILED, at(pos(3, 10, PHASE, 8)), 90_000).bossReachedAt` null.
5. `a stopped clock has no boss time`: `RunClock("ana").bossTime(5)` null.
6. `a load at the chapter boss restarts the clock and elsewhere changes nothing`: `RunClock("ana", null, 0).afterLoad(at(pos(3, 10, CHAPTER_BOSS)), 50_000).bossReachedAt` 50 000; `.afterLoad(at(pos(3, 4, PHASE)), 50_000).bossReachedAt` 0.
7. `a completed campaign is not at the boss`: `RunClock("ana").afterLoad(at(pos(15, 10, CHAPTER_BOSS), completed = true), 7).bossReachedAt` null.
8. `a farm win at the chapter boss restarts the clock and elsewhere changes nothing`: `RunClock("ana", null, 0).afterFarmWin(at(pos(3, 10, CHAPTER_BOSS)), 30_000).bossReachedAt` 30 000; `.afterFarmWin(at(pos(3, 2, PHASE)), 30_000).bossReachedAt` 0.
9. `a reset starts the run and stops the boss clock`: `RunClock("ana", 1, 2).afterReset(1_000_000)` == `RunClock("ana", 1_000_000, null)`.
10. `the boss floor is 1000 ms`: `bossTimePlausible(999)` false, `(1_000)` true.
11. `the story floor of the seeded chapters is 1365000 ms`: `storyFloorMs((1..15).map(ChapterDefinition::of))` 1 365 000; `storyTimePlausible(1_364_999, 1_365_000)` false, `(1_365_000, 1_365_000)` true.
12. `the run start is the stored one, else the registration of a player who never reset`: `runStart(RunClock("ana", 1_000_000), 2, 0)` 1 000 000; `runStart(RunClock("ana"), 0, 7)` 7; `runStart(RunClock("ana"), 1, 7)` null.
13. `a board id reads its board and an unknown one is RANKING_NOT_FOUND`: `fromId("boss-time")` BOSS_TIME, ..., `fromId("fortune")` FORTUNE; `fromId("gold")` throws `RankingNotFoundException` with `code` `RANKING_NOT_FOUND`.
14. `the boss board needs a chapter from 1 to 15 and the others ignore it`: `chapterOf(BOSS_TIME, 3)` 3, `(BOSS_TIME, 1)` 1, `(BOSS_TIME, 15)` 15; `(BOSS_TIME, null)`, `(BOSS_TIME, 0)`, `(BOSS_TIME, 16)` throw `InvalidRankingRequestException` (`code` `INVALID_RANKING_REQUEST`); `chapterOf(STORY_TIME, 3)` null.

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*RankingsTest'`
**Done when**:

- [x] The 14 cases pass; ktlint passes.

**Commit**: `feat(backend): add the ranking boards, clocks and floors`

---

#### T3: ClickPower domain and the shared fixture [x]

**Owner**: kotlin-backend-dev
**Goal**: The backend computes `Dano de clique` + `Dano da equipe por clique` exactly as the game, proven by one fixture file both suites read (RNK-03; spec Power AC 1, § Power Examples).
**Where**: `main/domain/ClickPower.kt` (new)
**Files**:
- Also creates: `backend/src/test/resources/ranking/click-power-cases.json`, `test/domain/ClickPowerTest.kt`
- Read first: spec § Click power and § Power Examples; `main/domain/Equipment.kt:1-122` (`Slot`, `AffixType`, `Affix`, `Rarity`, `Piece.value`, `Piece.clickDamage`); `main/domain/Talents.kt:15-125` (`TalentDefinition.baseId`, `valueAt`, `TalentCatalog.all`); `main/domain/Team.kt:9-20`; `game/src/domain/combat/leaderAttacker.js`, `allyAttacker.js`, `game/src/domain/heroes/starBonus.js` (the formulas being mirrored)
**Depends on**: None
**Requirement**: RNK-03

**Contract** (`package br.com.woodriver.infinity_grove_ws.domain`):

```kotlin
/**
 * The click power of spec rankings: the leader's `Dano de clique` plus the team's `Dano da equipe por clique`, from the stored pieces,
 * stars, talents and team. Mirrors `leaderAttacker` and `allyDamagePerClick` of the game; `click-power-cases.json` pins both.
 */
object ClickPower {
    /** Click damage percent of the leader's stars, 0 to 9 (game `STAR_BONUS[stars].clickDamagePct`). */
    val STAR_CLICK_PCT: List<Int> = listOf(0, 10, 20, 40, 70, 100, 130, 160, 190, 220)

    /** Multiplier of an ally's stars, 0 to 9 (game `ALLY_STAR_MULTIPLIER`). */
    val ALLY_STAR_MULTIPLIER: List<Int> = listOf(2, 4, 6, 8, 10, 12, 14, 16, 18, 20)

    const val TEAM_FIRST_CHAPTER = 5
    const val TEAM_BOOSTER = "seraphine"
    const val TEAM_BOOST = 1.25

    /** A hero as the power reads it: its stars and the pieces it wears. */
    data class Member(
        val heroId: String,
        val stars: Int,
        val pieces: List<Piece>,
    )

    /** `leaderClick + teamClick` of spec § Click power. [talentLevels] is talent id -> level (all grades). */
    fun of(
        leader: Member,
        allies: List<Member>,
        talentLevels: Map<String, Int>,
        teamActive: Boolean,
    ): Double {
        val leaderClick =
            (1 + weapon(leader) + talentValue(talentLevels, "CLICK_FLAT_DAMAGE")) *
                (1 + (clickPct(leader) + STAR_CLICK_PCT.getOrElse(leader.stars) { 0 } + talentValue(talentLevels, "CLICK_DAMAGE")) / 100.0)
        val factor = if (teamActive && allies.any { it.heroId == TEAM_BOOSTER }) TEAM_BOOST else 1.0
        val teamClick =
            allies.sumOf { ally ->
                (1 + weapon(ally)) * (1 + clickPct(ally) / 100.0) * ALLY_STAR_MULTIPLIER.getOrElse(ally.stars) { ALLY_STAR_MULTIPLIER[0] } * factor
            }
        return leaderClick + teamClick
    }

    /** The heroes of ally slots 1 to `boughtSlots`, in slot order. */
    fun allies(team: Team): List<String> = team.allies.take(team.boughtSlots).filterNotNull()

    /** The team fights from chapter 5 and in a completed campaign (game `teamActive`). */
    fun teamActive(progress: Progress): Boolean = progress.completed || progress.position.chapter >= TEAM_FIRST_CHAPTER

    /** The sum of `valueAt(level)` over the grades of [baseId]; ids the catalog does not know add nothing. */
    fun talentValue(talentLevels: Map<String, Int>, baseId: String): Int =
        talentLevels.entries.sumOf { (id, level) ->
            TalentCatalog.all.firstOrNull { it.id == id && it.baseId == baseId }?.valueAt(level) ?: 0
        }

    private fun weapon(member: Member): Double = member.pieces.firstOrNull { it.slot == Slot.WEAPON }?.clickDamage() ?: 0.0

    private fun clickPct(member: Member): Int =
        member.pieces.sumOf { piece -> piece.affixes.filter { it.type == AffixType.CLICK_DAMAGE_PCT }.sumOf { piece.value(it) } }
}
```

**Fixture** (`backend/src/test/resources/ranking/click-power-cases.json`, exactly; a piece is `{ "slot", "click" }` for a weapon (base click, refine 0) or `{ "slot", "clickDamagePct" }` for a ring or amulet (one `CLICK_DAMAGE_PCT` affix of that base, refine 0); `talentLevels` are grade 1 levels, `talentValues` the same talents as values: `CLICK_FLAT_DAMAGE` 1 a level, `CLICK_DAMAGE` 5 a level):

```json
[
  { "name": "C1 no gear", "chapter": 1, "completed": false,
    "leader": { "heroId": "kael", "stars": 0, "pieces": [] },
    "talentLevels": {}, "talentValues": {}, "boughtSlots": 0, "allies": [], "expected": 1 },
  { "name": "C2 leader gear, stars and talents", "chapter": 1, "completed": false,
    "leader": { "heroId": "kael", "stars": 3, "pieces": [ { "slot": "WEAPON", "click": 6 }, { "slot": "RING", "clickDamagePct": 10 } ] },
    "talentLevels": { "CLICK_FLAT_DAMAGE": 3, "CLICK_DAMAGE": 3 }, "talentValues": { "CLICK_FLAT_DAMAGE": 3, "CLICK_DAMAGE": 15 },
    "boughtSlots": 0, "allies": [], "expected": 16.5 },
  { "name": "C3 active team with Seraphine", "chapter": 6, "completed": false,
    "leader": { "heroId": "kael", "stars": 0, "pieces": [] },
    "talentLevels": {}, "talentValues": {}, "boughtSlots": 2,
    "allies": [ { "heroId": "lyra", "stars": 2, "pieces": [ { "slot": "WEAPON", "click": 4 } ] }, { "heroId": "seraphine", "stars": 0, "pieces": [] } ],
    "expected": 41 },
  { "name": "C4 the same team inactive", "chapter": 3, "completed": false,
    "leader": { "heroId": "kael", "stars": 0, "pieces": [] },
    "talentLevels": {}, "talentValues": {}, "boughtSlots": 2,
    "allies": [ { "heroId": "lyra", "stars": 2, "pieces": [ { "slot": "WEAPON", "click": 4 } ] }, { "heroId": "seraphine", "stars": 0, "pieces": [] } ],
    "expected": 33 },
  { "name": "C5 nine stars and every click source", "chapter": 1, "completed": false,
    "leader": { "heroId": "kael", "stars": 9, "pieces": [ { "slot": "WEAPON", "click": 20 }, { "slot": "RING", "clickDamagePct": 25 }, { "slot": "AMULET", "clickDamagePct": 30 } ] },
    "talentLevels": { "CLICK_FLAT_DAMAGE": 10, "CLICK_DAMAGE": 10 }, "talentValues": { "CLICK_FLAT_DAMAGE": 10, "CLICK_DAMAGE": 50 },
    "boughtSlots": 0, "allies": [], "expected": 131.75 },
  { "name": "C6 completed campaign, one ally of nine stars", "chapter": 15, "completed": true,
    "leader": { "heroId": "kael", "stars": 0, "pieces": [] },
    "talentLevels": {}, "talentValues": {}, "boughtSlots": 1,
    "allies": [ { "heroId": "orina", "stars": 9, "pieces": [ { "slot": "WEAPON", "click": 9 }, { "slot": "RING", "clickDamagePct": 20 } ] } ],
    "expected": 241 }
]
```

**Steps**:

1. Create `ClickPower.kt` with the Contract.
2. Create the fixture file with the exact JSON above.
3. Create `ClickPowerTest.kt`. Read the fixture with `ClickPowerTest::class.java.getResource("/ranking/click-power-cases.json")!!.readText()` and parse it with `tools.jackson.module.kotlin.jacksonObjectMapper()` and `readValue<List<Map<String, Any?>>>(text)` (both from `tools.jackson.module.kotlin`); if `jacksonObjectMapper` does not resolve, use `tools.jackson.databind.json.JsonMapper.builder().addModule(tools.jackson.module.kotlin.KotlinModule.Builder().build()).build()`. Build each piece as `Piece(id = "<case>-<n>", username = "ana", slot = Slot.valueOf(slot), rarity = Rarity.LEGENDARY, baseClick = click (weapon) or null, refine = 0, affixes = if clickDamagePct present listOf(Affix(AffixType.CLICK_DAMAGE_PCT, it)) else emptyList(), heroId = <member heroId>)`; `teamActive` = `ClickPower.teamActive(Progress("ana", ProgressPosition(chapter, 1, Encounter.PHASE, 1), completed))`; the allies list in file order.
4. Run the gate.

**Tests**: unit
**Test cases** (`ClickPowerTest.kt`):

1. `the shared fixture gives 1, 16_5, 41, 33, 131_75 and 241` (Power AC 1): for each case `assertEquals(expected, ClickPower.of(...), 1e-9)`, message = case name; assert the file holds 6 cases.
2. `refined values count: a weapon of base 5 at +2 and a ring of base 7 at +3 give 7_63`: leader pieces `Piece(..., WEAPON, LEGENDARY, baseClick = 5, refine = 2, ...)`, `Piece(..., RING, LEGENDARY, null, refine = 3, listOf(Affix(CLICK_DAMAGE_PCT, 7)))`, stars 0, no talents -> 7.63 (1e-9).
3. `talent grades add up and unknown ids add nothing`: levels `{ "CLICK_DAMAGE": 10, "CLICK_DAMAGE_G2": 2, "NOPE": 5 }` -> `talentValue(levels, "CLICK_DAMAGE")` 50 + 20 = 70 (grade 2 is 10 a level).
4. `only the bought slots are allies, in slot order`: `ClickPower.allies(Team(2, listOf("lyra", null, null, null)))` `["lyra"]`; `ClickPower.allies(Team(3, listOf("lyra", "orina", "vex", null)))` `["lyra", "orina", "vex"]`.
5. `the team is active from chapter 5 and when completed`: chapter 4 false, chapter 5 true, chapter 3 completed true.
6. `a star count outside 0 to 9 reads 0 percent for the leader and x2 for an ally`: leader stars 12 no pieces -> 1.0; ally stars 12 no pieces, team inactive -> 1 + 2 = 3.0.
7. `Seraphine lifts the team only while it is active`: covered by C3 and C4; also a team without Seraphine active (lyra 2 stars weapon 4, chapter 6) -> 1 + 30 = 31.0.

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*ClickPowerTest'`
**Done when**:

- [x] The 7 cases pass; the fixture file is exactly the JSON above.

**Commit**: `feat(backend): compute the click power of the rankings`

---

#### T4: Ranking repository (JDBC) [ ]

**Owner**: kotlin-backend-dev
**Goal**: The clocks read and write, the records keep the better value in one SQL statement, and each board answers its top 10 and the caller's position (RNK-05, RNK-06; spec Boards API AC 1 to 7, Edge Cases on ties).
**Where**: `main/adapter/repository/RankingRepository.kt` (new)
**Files**:
- Also creates: `main/port/RankingRepositoryPort.kt`, `test/adapter/repository/RankingRepositoryIT.kt`
- Also changes: `test/Fakes.kt` (`InMemoryRankingRepository`)
- Read first: `main/adapter/repository/JdbcDatabaseHealth.kt` (JDBC adapter), `main/port/LegacyRepositoryPort.kt` (port style), `main/adapter/repository/LegacyRepository.kt` (`@Repository`, logging), `test/adapter/repository/LegacyRepositoryIT.kt`, `test/Fakes.kt:356-375` (`InMemoryLegacyRepository`, `InMemoryTeamRepository`)
**Depends on**: T1, T2
**Requirement**: RNK-05, RNK-06

**Contract**:

```kotlin
package br.com.woodriver.infinity_grove_ws.port

interface RankingRepositoryPort {
    /** The clocks of [username]; both null when the player has no row. */
    fun clock(username: String): RunClock

    /** Writes both clocks of [clock] (insert or update). */
    fun saveClock(clock: RunClock)

    /** Stores [ms] as the boss time of [chapter] at [at] when the player has none or a larger one; true when it was stored. */
    fun improveBossTime(username: String, chapter: Int, ms: Long, at: Long): Boolean

    /** Stores [ms] as the story time when the player has none or a larger one; true when it was stored. */
    fun improveStoryTime(username: String, ms: Long, at: Long): Boolean

    /** Stores [power] when the player has none or a smaller one; true when it was stored. */
    fun improveClickPower(username: String, power: Double, at: Long): Boolean

    /** The stored best click power; null when none. */
    fun clickPower(username: String): Double?

    /** The first [limit] rows of [board] ([chapter] only for BOSS_TIME), positions 1..n in board order. */
    fun top(board: RankingBoard, chapter: Int?, limit: Int): List<RankingEntry>

    /** The caller's row on [board]; null when they have none (a fortune peak of 0 is none). */
    fun me(board: RankingBoard, chapter: Int?, username: String): RankingMe?
}
```

`@Repository class RankingRepository(private val jdbc: NamedParameterJdbcTemplate) : RankingRepositoryPort` (Spring Boot auto-configures `NamedParameterJdbcTemplate`). Every method is `@Transactional` (joins the caller's transaction). Null parameters use `MapSqlParameterSource().addValue("run", clock.runStartedAt, java.sql.Types.BIGINT)`.

SQL, exactly:

| Method | SQL |
| --- | --- |
| `clock` | `select run_started_at, boss_reached_at from player_run_clock where username = :username` (no row -> `RunClock(username)`; read with `rs.getObject("run_started_at") as Long?`) |
| `saveClock` | `insert into player_run_clock (username, run_started_at, boss_reached_at) values (:username, :run, :boss) on conflict (username) do update set run_started_at = excluded.run_started_at, boss_reached_at = excluded.boss_reached_at` |
| `improveBossTime` | `insert into player_boss_times (username, chapter, best_ms, achieved_at) values (:username, :chapter, :ms, :at) on conflict (username, chapter) do update set best_ms = excluded.best_ms, achieved_at = excluded.achieved_at where excluded.best_ms < player_boss_times.best_ms` -> `update(...) == 1` |
| `improveStoryTime` | same on `player_story_times` with `on conflict (username)` and `where excluded.best_ms < player_story_times.best_ms` |
| `improveClickPower` | same on `player_click_power (username, best_power, achieved_at)`, `where excluded.best_power > player_click_power.best_power` |
| `clickPower` | `select best_power from player_click_power where username = :username` |

Board sources (a private `data class Source(val table: String, val column: String, val filter: String, val ascending: Boolean)` chosen by `when (board)`):

| Board | table | column | filter | ascending |
| --- | --- | --- | --- | --- |
| BOSS_TIME | `player_boss_times` | `best_ms` | `chapter = :chapter` | true |
| STORY_TIME | `player_story_times` | `best_ms` | `true` | true |
| CLICK_POWER | `player_click_power` | `best_power` | `true` | false |
| FORTUNE | `player_fortune` | `peak_copper` | `peak_copper > 0` | false |

- `top`: `select username, cast(<column> as double precision) as value from <table> where <filter> order by <column> <asc|desc>, achieved_at asc, username collate "C" asc limit :limit`; positions are the row index + 1.
- `me`: `select <column> as raw, cast(<column> as double precision) as value, achieved_at from <table> where <filter> and username = :username` (none -> null); then `select count(*) from <table> where <filter> and (<column> <op> :raw or (<column> = :raw and (achieved_at < :at or (achieved_at = :at and username collate "C" < :username))))` with `<op>` `<` when ascending, `>` otherwise; `position = count + 1`. Bind `:raw` with the column's type (`Long` for `best_ms` and `peak_copper`, `Double` for `best_power`).

`InMemoryRankingRepository` (`test/Fakes.kt`): `val clocks = mutableMapOf<String, RunClock>()`, `val bossTimes = mutableMapOf<Pair<String, Int>, Pair<Long, Long>>()` (ms, at), `val storyTimes = mutableMapOf<String, Pair<Long, Long>>()`, `val powers = mutableMapOf<String, Pair<Double, Long>>()`, `val fortunes = mutableMapOf<String, Pair<Long, Long>>()` (tests fill it; no trigger in memory); the same keep-the-better rules; `top` and `me` sort by value (board direction), then `at`, then username by `String.compareTo` (code points).

**Steps**:

1. Create the port, the adapter and the fake as above.
2. Create `RankingRepositoryIT.kt` (`: IntegrationTestBase()`, `@Autowired lateinit var rankings: RankingRepositoryPort`, `@Autowired lateinit var jdbc: JdbcTemplate`; fortune rows by `jdbc.update("insert into player_fortune (username, peak_copper, achieved_at) values (?, ?, ?)", ...)`).
3. Push and run the CI gate.

**Tests**: integration
**Test cases** (`RankingRepositoryIT.kt`; `users(...)` first):

1. `a player without a clock row has both clocks null`: `clock("ana")` == `RunClock("ana")`.
2. `a saved clock reads back and the next save overwrites both values`: save `RunClock("ana", 5, 7)` -> reads `(5, 7)`; save `RunClock("ana", 5, null)` -> reads `(5, null)`.
3. `a first boss time is stored and a smaller one replaces it`: `improveBossTime("ana", 3, 12_345, 1)` true; `(…, 9_000, 2)` true; `top(BOSS_TIME, 3, 10)` == `[RankingEntry(1, "ana", 9000.0)]`.
4. `an equal or larger boss time is not stored`: after 12 345: `15_000` false, `12_345` false; value stays 12 345.0 and `achieved_at` the first.
5. `the story time and the click power keep the better value`: story 3 600 000 true, 4 000 000 false, 3 000 000 true; power 41.0 true, 33.0 false, 50.0 true; `clickPower("ana")` 50.0; `clickPower("bob")` null.
6. `the boss board lists one chapter in ascending time, at most the limit`: users `p01` .. `p12` with chapter 3 times 1 000 x n (n = 1 .. 12, at = n); `bob` in chapter 4 with 500 -> `top(BOSS_TIME, 3, 10)` has 10 entries, positions 1..10, usernames `p01`..`p10`, values 1000.0 .. 10000.0; `bob` absent.
7. `a tie goes to the earlier record, then to the username in code-point order`: chapter 3: `ana` 5 000 at 20, `cid` 5 000 at 10, `Bob` 5 000 at 20 -> order `cid`, `Bob`, `ana` (`B` 66 < `a` 97).
8. `the power and fortune boards list the largest first and the fortune board leaves out 0`: powers `ana` 41.0, `bob` 16.5; fortunes `ana` 500, `bob` 0, `cid` 700 -> `top(CLICK_POWER, null, 10)` values `[41.0, 16.5]`; `top(FORTUNE, null, 10)` usernames `[cid, ana]`.
9. `me gives the caller's position and value`: case 6 data -> `me(BOSS_TIME, 3, "p12")` == `RankingMe(12, "p12", 12000.0)`; `me(BOSS_TIME, 3, "p01")` position 1.
10. `me is null without a record and for a fortune peak of 0`: `me(STORY_TIME, null, "ana")` null with no story row; `me(FORTUNE, null, "bob")` null with peak 0.
11. `the story board orders ascending`: `ana` 3 600 000, `bob` 1 365 000 -> usernames `[bob, ana]`.

**Gate**: `git push origin HEAD:ci/rankings` then `node scripts/ci-wait.mjs ci/rankings`: `RankingRepositoryIT` passes in the `backend` job.
**Done when**:

- [ ] The 11 cases pass in CI; ktlint passes.

**Commit**: `feat(backend): store and read the ranking records`

---

### Phase 2: Backend records and API

#### T5: RecordKeeper turns game events into clocks and records [ ]

**Owner**: kotlin-backend-dev
**Goal**: One component applies spec § Record Rules for every event: loads, outcomes, farm wins, resets and the click power (RNK-01, RNK-02, RNK-03).
**Where**: `main/service/RecordKeeper.kt` (new)
**Files**:
- Also creates: `main/usecase/RecordKeeping.kt`, `test/service/RecordKeeperTest.kt`
- Also changes: `test/Fakes.kt` (`NoRecordKeeping`, `RecordingRecordKeeping`)
- Read first: T2 and T3 contracts; `main/service/CardRewards.kt` (a `@Component` with a `Clock`), `main/port/HeroPorts.kt:21-31`, `main/port/EquipmentRepositoryPort.kt`, `main/port/TeamRepositoryPort.kt`, `main/port/TalentRepositoryPort.kt`, `main/port/ResetRepositoryPort.kt`, `main/port/UserRepositoryPort.kt`, `main/port/ProgressPorts.kt:18`; `test/Fakes.kt:106-115` (`MutableClock`); `test/service/AccountResetServiceTest.kt:20-40` (fake setup)
**Depends on**: T2, T3, T4
**Requirement**: RNK-01, RNK-02, RNK-03

**Contract**:

```kotlin
package br.com.woodriver.infinity_grove_ws.usecase

/** The events the rankings listen to (spec rankings, Record Rules). Each runs inside the caller's transaction, after the caller saved its state. */
interface RecordKeeping {
    /** `GET /progress` answered [progress]. */
    fun onProgressLoaded(username: String, progress: Progress)

    /** `POST /progress/outcome` accepted [outcome] reported from [reported] and moved the campaign to [next]. */
    fun onOutcome(username: String, reported: ProgressPosition, outcome: Outcome, next: Progress)

    /** `POST /farm/outcome` accepted a CLEARED while the campaign stands at [campaign]. */
    fun onFarmWin(username: String, campaign: Progress)

    /** `POST /account/reset` succeeded. */
    fun onReset(username: String)
}
```

```kotlin
package br.com.woodriver.infinity_grove_ws.service

@Component
class RecordKeeper(
    private val rankings: RankingRepositoryPort,
    private val users: UserRepositoryPort,
    private val resets: ResetRepositoryPort,
    private val chapters: ChapterRepositoryPort,
    private val playerCards: PlayerCardsRepositoryPort,
    private val equipment: EquipmentRepositoryPort,
    private val teams: TeamRepositoryPort,
    private val talents: TalentRepositoryPort,
    private val clock: Clock,
) : RecordKeeping {
    /** Computes the click power of [username] from the stored state at [progress], keeps it when bigger, and returns it; null with no cards row. */
    fun recordClickPower(username: String, progress: Progress): Double?
}
```

Behaviour (`now = clock.millis()` once per call):

1. `onProgressLoaded`: `val c = rankings.clock(username); val u = c.afterLoad(progress, now); if (u != c) rankings.saveClock(u)`.
2. `onOutcome`:
   - `bossEvent = reported.encounter == CHAPTER_BOSS || (outcome == CLEARED && !next.completed && next.position.encounter == CHAPTER_BOSS)`. When false, skip to the power step (no clock read).
   - When true: `val c = rankings.clock(username)`. If `outcome == CLEARED && reported.encounter == CHAPTER_BOSS`: `c.bossTime(now)?.let { recordBoss(username, reported.chapter, it, now) }`, then `if (next.completed) recordStory(username, c, now)`. Then `val u = c.afterOutcome(reported, outcome, next, now); if (u != c) rankings.saveClock(u)`.
   - Power step: `if (outcome == CLEARED && reported.encounter != PHASE) recordClickPower(username, next)`.
3. `onFarmWin`: clock as step 1 with `afterFarmWin(campaign, now)`; then `recordClickPower(username, campaign)`.
4. `onReset`: `rankings.saveClock(rankings.clock(username).afterReset(now))`.
5. `recordBoss(username, chapter, ms, now)`: `if (!RecordRules.bossTimePlausible(ms))` -> `logger.warn("Boss time refused as implausible username={} chapter={} ms={}", ...)` and return; else `val stored = rankings.improveBossTime(username, chapter, ms, now)` and `logger.info("Boss time username={} chapter={} ms={} stored={}", ...)`.
6. `recordStory(username, c, now)`: `val user = users.findByUsername(username) ?: return`; `val start = RecordRules.runStart(c, resets.count(username), user.createdAt)`; null -> `logger.info("Story time not recorded, run start unknown username={}", username)` and return; `ms = now - start`; `floor = RecordRules.storyFloorMs((1..ChapterOrder.MAX_CHAPTER).mapNotNull { chapters.findByNumber(it) })`; below -> warn `"Story time refused as implausible username={} ms={} floorMs={}"` and return; else `improveStoryTime` and info `"Story time username={} ms={} stored={}"`.
7. `recordClickPower(username, progress)`: `val cards = playerCards.findForUpdate(username) ?: return null`; `val pieces = equipment.findAll(username)`; `val member = { id: String -> ClickPower.Member(id, cards.starsOf(id), pieces.filter { it.heroId == id }) }`; `val power = ClickPower.of(member(cards.leaderId), ClickPower.allies(teams.find(username)).map(member), talents.findAll(username), ClickPower.teamActive(progress))`; `val stored = rankings.improveClickPower(username, power, now)`; info `"Click power username={} power={} stored={}"`; return `power`.

Fakes (`test/Fakes.kt`): `object NoRecordKeeping : RecordKeeping` (every method does nothing); `class RecordingRecordKeeping : RecordKeeping { val events = mutableListOf<String>() }` appending `"loaded:<chapter>:<encounter>"`, `"outcome:<reported.encounter>:<outcome>:<next.position.encounter>:<next.completed>"`, `"farm:<campaign.position.encounter>"`, `"reset"`.

**Steps**:

1. Create `RecordKeeping.kt`, `RecordKeeper.kt` and the fakes.
2. Create `RecordKeeperTest.kt`: `MutableClock(0)`, `InMemoryRankingRepository`, `InMemoryUserRepository` with `User("ana", "h", createdAt = 0, lastLoginAt = 0)`, `InMemoryResetRepository`, `InMemoryChapterRepository(*(1..15).map(ChapterDefinition::of).toTypedArray())`, `InMemoryPlayerCardsRepository` with `PlayerCards("ana", Element.FIRE, "kael", mapOf(CopyKey("kael", 0) to 1))`, `InMemoryEquipmentRepository`, `InMemoryTeamRepository`, `InMemoryTalentRepository`. Helpers: `lastMiniboss(c)` = `onOutcome("ana", pos(c, 10, MINIBOSS), CLEARED, at(pos(c, 10, CHAPTER_BOSS)))`; `bossWin(c)` = `onOutcome("ana", pos(c, 10, CHAPTER_BOSS), CLEARED, if (c < 15) at(pos(c + 1, 1, PHASE)) else at(pos(15, 10, CHAPTER_BOSS), completed = true))`.
3. Run the gate.

**Tests**: unit
**Test cases** (`RecordKeeperTest.kt`; `clock.millis = t` before each call):

1. `a chapter 3 boss won 12345 ms after the last miniboss records 12345` (Boss AC 1): t 10 000 `lastMiniboss(3)`, t 22 345 `bossWin(3)` -> `bossTimes["ana" to 3]` first 12 345; clock `bossReachedAt` null.
2. `a slower win keeps the record and a faster one replaces it` (Boss AC 2, 3): record 12 345 as case 1; then 100 000 / 115 000 -> 12 345; then 200 000 / 209 000 -> 9 000.
3. `a win 999 ms after the miniboss is refused and one of 1000 ms is kept` (Boss AC 4): 0 / 999 -> no row; 5 000 / 6 000 -> 1 000.
4. `a page load at the boss restarts the clock` (Boss AC 5): t 0 `lastMiniboss(3)`; t 50 000 `onProgressLoaded("ana", at(pos(3, 10, CHAPTER_BOSS)))`; t 62 000 `bossWin(3)` -> 12 000.
5. `a farm win at the boss restarts the clock` (Boss AC 6): t 0 `lastMiniboss(3)`; t 30 000 `onFarmWin("ana", at(pos(3, 10, CHAPTER_BOSS)))`; t 41 500 `bossWin(3)` -> 11 500.
6. `a failed boss stops the clock and the next attempt is timed from its own start` (Boss AC 7): t 0 `lastMiniboss(3)`; t 90 000 `onOutcome(pos(3, 10, CHAPTER_BOSS), FAILED, at(pos(3, 10, PHASE, 8)))` -> clock null; t 200 000 `lastMiniboss(3)`; t 210 000 `bossWin(3)` -> 10 000.
7. `a boss win with the clock stopped records nothing` (Boss AC 8): no `lastMiniboss`; t 5 000 `bossWin(3)` -> no boss row.
8. `a reset stops the boss clock, starts the run and keeps the boss times` (Boss AC 9): case 1 data, then t 0 `lastMiniboss(4)`; t 1 000 000 `onReset("ana")` -> clock `RunClock("ana", 1_000_000, null)`; `bossTimes["ana" to 3]` still 12 345.
9. `a player who never reset is timed from the registration` (Story AC 1): user `createdAt` 0; t 7 199 000 `lastMiniboss(15)`; t 7 200 000 `bossWin(15)` -> story 7 200 000; boss chapter 15 1 000.
10. `a run after a reset is timed from the reset` (Story AC 2): `resets.save("ana", 1)`; t 1 000 000 `onReset`; t 4 590 000 `lastMiniboss(15)`; t 4 600 000 `bossWin(15)` -> story 3 600 000.
11. `a story shorter than 1365000 ms is refused and 1365000 is kept` (Story AC 3): reset at t 0; boss win at t 1 364 999 (miniboss at 1 360 000) -> no story row; reset at t 10 000 000; miniboss at 11 360 000, win at 11 365 000 -> 1 365 000.
12. `a player who reset before the rankings has no run start and no story time` (Story AC 4): `resets.save("ana", 1)` (no clock row); miniboss t 7 000 000, win t 7 200 000 -> no story row.
13. `a slower run keeps the story time and a faster one replaces it` (Story AC 5): stored 3 600 000 (as case 10); next run reset t 10 000 000, win t 14 000 000 -> 3 600 000; next reset t 20 000 000, win t 23 000 000 -> 3 000 000.
14. `a phase win and an ordinary miniboss win touch no clock`: `onOutcome(pos(3, 2, PHASE, 3), CLEARED, at(pos(3, 2, PHASE, 4)))` and `onOutcome(pos(3, 2, MINIBOSS), CLEARED, at(pos(3, 3, PHASE)))` -> `clocks` empty.
15. `a miniboss win records the click power and a phase win does not` (Power AC 3, 5): leader kael 0 stars, a weapon `Piece("w", "ana", WEAPON, COMMON, 5, 0, emptyList(), heroId = "kael")` -> after the phase win `powers` empty; after `onOutcome(pos(1, 1, MINIBOSS), CLEARED, at(pos(1, 2, PHASE)))` `powers["ana"]` 6.0.
16. `a farm win records the click power` (Power AC 4): same gear, `onFarmWin("ana", at(pos(1, 3, PHASE)))` -> 6.0.
17. `a lower power keeps the best` (Power AC 7 rule): store 41.0 first (`rankings.improveClickPower("ana", 41.0, 0)`), gear giving 6.0, `recordClickPower("ana", at(pos(1, 1, PHASE)))` returns 6.0 and `powers["ana"]` stays 41.0.
18. `no cards row gives no power` (Power AC 8): remove the cards -> `recordClickPower` null, `powers` empty.
19. `the power reads the leader's stars, the team and the talents`: cards copies `kael:3`, `lyra:2`, `seraphine:0`; team `Team(2, listOf("lyra", "seraphine", null, null))`; lyra wears a weapon base 4; talents `CLICK_DAMAGE` level 3; progress chapter 6 -> `(1) x (1 + (40 + 15) / 100) + 5 x 6 x 1.25 + 1 x 2 x 1.25` = 1.55 + 37.5 + 2.5 = 41.55 (1e-9).

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*RecordKeeperTest'`
**Done when**:

- [ ] The 19 cases pass; ktlint passes.

**Commit**: `feat(backend): keep the ranking clocks and records`

---

#### T6: ProgressService reports loads and outcomes to the records [ ]

**Owner**: kotlin-backend-dev
**Goal**: Every `GET /progress` and every accepted outcome reaches `RecordKeeping`, after the progress is saved, and a refused report reaches nothing (RNK-01, RNK-02, RNK-03; spec Boss AC 5, 10).
**Where**: `main/service/ProgressService.kt`
**Files**:
- Also changes: `test/service/ProgressServiceTest.kt`
- Read first: `ProgressService.kt` (whole, `get` at `:40`, `report` at `:45`), `test/service/ProgressServiceTest.kt:46-100` (fixture) and the four construction sites (§ Constructor changes)
**Depends on**: T5
**Requirement**: RNK-01, RNK-02, RNK-03

**Contract**:

- Constructor: add `private val records: RecordKeeping,` as the last parameter (import `br.com.woodriver.infinity_grove_ws.usecase.RecordKeeping`).
- `get`: after `val progress = load(username)` add `records.onProgressLoaded(username, progress)`.
- `report`: after the line `val talentPoints = ...` add `records.onOutcome(username, position, outcome, next)`. A `ProgressConflictException` from `progress.report` is thrown before it, so a refused report never reaches it.

**Steps**:

1. Edit `ProgressService.kt` as in the Contract.
2. In `ProgressServiceTest.kt` pass `NoRecordKeeping` as the last argument at every construction site; add a second builder `serviceWith(records: RecordKeeping)` that builds the same service with `records`.
3. Add the cases below.
4. Run the gate.

**Tests**: unit
**Test cases** (`ProgressServiceTest.kt`, new `@Nested inner class Records` or plain cases with `records = RecordingRecordKeeping()`):

1. `a progress load is reported to the records with the loaded position`: store the fixture player's progress at chapter 3 stage 10 `CHAPTER_BOSS`; `get(<that player>)` -> `records.events` == `["loaded:3:CHAPTER_BOSS"]`.
2. `an accepted outcome is reported with the reported position and the next progress`: progress chapter 1 stage 1 phase 1; `report(... PHASE 1, CLEARED)` -> `["outcome:PHASE:CLEARED:PHASE:false"]`.
3. `a last miniboss win is reported as reaching the chapter boss`: progress at chapter 1 stage 10 `MINIBOSS`; `report(..., CLEARED)` -> last event `"outcome:MINIBOSS:CLEARED:CHAPTER_BOSS:false"`.
4. `a refused report reaches no record` (Boss AC 10): report from a position other than the stored one -> `ProgressConflictException` and `records.events` empty.

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*ProgressServiceTest'`
**Done when**:

- [ ] The 4 new cases and every existing case of `ProgressServiceTest` pass.

**Commit**: `feat(backend): report progress loads and outcomes to the rankings`

---

#### T7: FarmService reports farm wins to the records [ ]

**Owner**: kotlin-backend-dev
**Goal**: An accepted farm `CLEARED` reaches `RecordKeeping.onFarmWin` with the campaign progress; a `FAILED` or refused farm report does not (RNK-01, RNK-03; spec Boss AC 6, Power AC 4).
**Where**: `main/service/FarmService.kt`
**Files**:
- Also changes: `test/service/FarmServiceTest.kt`
- Read first: `FarmService.kt:27-95` (`report`), `test/service/FarmServiceTest.kt:40-80` (fixture and the construction at `:60`)
**Depends on**: T5
**Requirement**: RNK-01, RNK-03

**Contract**: last constructor parameter `private val records: RecordKeeping`; in `report`, right after `playerCardsRepository.save(updated)`, add `records.onFarmWin(username, progress)`.

**Steps**:

1. Edit `FarmService.kt`.
2. `FarmServiceTest.kt`: pass `NoRecordKeeping` at `:60`; add a way to build it with a `RecordingRecordKeeping` (a `records` field the builder reads).
3. Add the cases; run the gate.

**Tests**: unit
**Test cases** (`FarmServiceTest.kt`):

1. `a farm win is reported to the records with the campaign position`: a player whose campaign stands at chapter 1 stage 2 `PHASE` (miniboss 1 beaten) wins `FarmBoss(MINIBOSS, 1)` -> `records.events` == `["farm:PHASE"]`.
2. `a failed farm fight reaches no record`: the same with `Outcome.FAILED` -> events empty.
3. `a refused farm report reaches no record`: a boss not beaten -> `BossNotAvailableException`, events empty.

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*FarmServiceTest'`
**Done when**:

- [ ] The 3 new cases and every existing case pass.

**Commit**: `feat(backend): report farm wins to the rankings`

---

#### T8: AccountResetService reports resets to the records [ ]

**Owner**: kotlin-backend-dev
**Goal**: A successful reset reaches `RecordKeeping.onReset`; a refused one does not (RNK-01, RNK-02; spec Boss AC 9, Story AC 2).
**Where**: `main/service/AccountResetService.kt`
**Files**:
- Also changes: `test/service/AccountResetServiceTest.kt`
- Read first: `AccountResetService.kt:28-72`, `test/service/AccountResetServiceTest.kt:20-60`
**Depends on**: T5
**Requirement**: RNK-01, RNK-02

**Contract**: last constructor parameter `private val records: RecordKeeping`; in `reset`, right after `legacyRepository.save(legacy)`, add `records.onReset(username)`.

**Steps**:

1. Edit `AccountResetService.kt`.
2. `AccountResetServiceTest.kt:35`: `AccountResetService(progress, chapters, users, talents, crystals, resets, legacies, records)` with `private val records = RecordingRecordKeeping()` (the existing cases do not read it).
3. Add the cases; run the gate.

**Tests**: unit
**Test cases** (`AccountResetServiceTest.kt`):

1. `a reset is reported to the records`: a reset from chapter 3 -> `records.events` == `["reset"]`.
2. `a refused reset reaches no record`: a reset from chapter 1 (409 `RESET_LOCKED`) and a reset with the wrong `fromChapter` (409 `RESET_CHAPTER_MISMATCH`) -> events empty.

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*AccountResetServiceTest'`
**Done when**:

- [ ] The 2 new cases and every existing case pass.

**Commit**: `feat(backend): report account resets to the rankings`

---

#### T9: RankingService answers boards and refreshes the click power [ ]

**Owner**: kotlin-backend-dev
**Goal**: The two use cases behind the endpoints: one board page with the top 10 and the caller, and the click power refresh (RNK-03, RNK-05; spec Power AC 6 to 8, Boards API AC 1 to 5, 8, 9).
**Where**: `main/service/RankingService.kt` (new)
**Files**:
- Also creates: `main/usecase/RankingUseCase.kt`, `test/service/RankingServiceTest.kt`
- Read first: `main/usecase/FarmUseCase.kt` (use case style), `main/service/FarmService.kt:79-86` (`loadProgress`), T2, T4, T5 contracts
**Depends on**: T5
**Requirement**: RNK-03, RNK-05

**Contract**:

```kotlin
package br.com.woodriver.infinity_grove_ws.usecase

interface GetRankingUseCase {
    /** The top 10 of [board] and the caller's row; [chapter] is checked by `RecordRules.chapterOf`. */
    fun board(username: String, board: RankingBoard, chapter: Int?): RankingPage
}

interface RefreshClickPowerUseCase {
    /** Computes and keeps the caller's click power now. */
    fun refreshClickPower(username: String): ClickPowerResult
}
```

```kotlin
@Service
@Transactional
class RankingService(
    private val rankings: RankingRepositoryPort,
    private val records: RecordKeeper,
    private val progressRepository: ProgressRepositoryPort,
    private val userRepository: UserRepositoryPort,
) : GetRankingUseCase, RefreshClickPowerUseCase
```

- `board`: `val shown = RecordRules.chapterOf(board, chapter)` (throws first, before any read); `RankingPage(board, shown, rankings.top(board, shown, RecordRules.TOP), rankings.me(board, shown, username))`; `@Transactional(readOnly = true)`; info log `"Ranking board username={} board={} chapter={}"`.
- `refreshClickPower`: `if (!userRepository.existsByUsername(username)) throw UserNotFoundException(username)`; `val progress = progressRepository.findForUpdate(username)?.withNextChapterOpen() ?: Progress.start(username)` (takes the progress row lock first, the lock order of the other services); `val value = records.recordClickPower(username, progress)`; `return ClickPowerResult(value, rankings.clickPower(username))`.

**Steps**:

1. Create the use case file and the service.
2. Create `RankingServiceTest.kt` with a real `RecordKeeper` over the fakes of T5 and the service over the same `InMemoryRankingRepository`.
3. Run the gate.

**Tests**: unit
**Test cases** (`RankingServiceTest.kt`):

1. `a boss board answers the chapter, at most 10 entries and the caller` (Boards API AC 1, 4): 12 players in chapter 3 (1 000 x n ms), caller `p12` -> page chapter 3, 10 entries `p01`..`p10`, `me` == `RankingMe(12, "p12", 12000.0)`.
2. `a board without chapters ignores the chapter` (Edge Case): `board("ana", STORY_TIME, 3).chapter` null.
3. `a caller without a record has no own row` (Boards API AC 5): `me` null.
4. `a boss board without a valid chapter is INVALID_RANKING_REQUEST` (Boards API AC 9): `board("ana", BOSS_TIME, null)`, `(…, 16)` throw `InvalidRankingRequestException`.
5. `the refresh answers the current power and the best after the call` (Power AC 6): gear giving 6.0, no stored best -> `ClickPowerResult(6.0, 6.0)`.
6. `the refresh keeps a bigger best` (Power AC 7): stored 41.0, gear giving 33.0 (C4 team in chapter 3) -> `ClickPowerResult(33.0, 41.0)`.
7. `the refresh without a cards row answers no value and the stored best` (Power AC 8): no cards, stored best 41.0 -> `ClickPowerResult(null, 41.0)`; with no stored best -> `ClickPowerResult(null, null)`.
8. `the refresh of an unknown user is USER_NOT_FOUND`: -> `UserNotFoundException`.

**Gate**: `cd backend && ./gradlew ktlintCheck test --tests '*RankingServiceTest'`
**Done when**:

- [ ] The 8 cases pass.

**Commit**: `feat(backend): answer ranking boards and refresh the click power`

---

#### T10: RankingController and its errors [ ]

**Owner**: kotlin-backend-dev
**Goal**: `GET /rankings/{board}` and `POST /rankings/click-power` answer the spec shapes, errors and integer values, and a real boss flow lands on the board (RNK-03, RNK-05; spec Boards API AC 1 to 10, Power AC 6).
**Where**: `main/adapter/web/RankingController.kt` (new)
**Files**:
- Also changes: `main/adapter/web/ApiExceptionHandler.kt`
- Also creates: `test/adapter/web/RankingControllerIT.kt`
- Read first: `FarmController.kt` (whole: `Principal`, `@RequestParam` text parsing), `ApiExceptionHandler.kt` (pattern of each handler), `test/adapter/web/AccountResetControllerIT.kt:34-100` (register a player, `asUser()`, `atChapter`), `test/adapter/web/EquipmentControllerIT.kt` (how a piece is stored for a player), `test/adapter/web/ProgressControllerIT.kt` (the `POST /progress/outcome` body), `test/adapter/web/FarmControllerIT.kt` (the `POST /farm/outcome` setup)
**Depends on**: T6, T7, T8, T9
**Requirement**: RNK-03, RNK-05

**Contract**:

```kotlin
data class RankingEntryResponse(val position: Int, val username: String, val value: Number)

data class RankingMeResponse(val position: Int, val username: String, val value: Number)

data class RankingPageResponse(val board: String, val chapter: Int?, val entries: List<RankingEntryResponse>, val me: RankingMeResponse?) {
    companion object {
        /** `value` is a Long for every board but CLICK_POWER (spec Boards API AC 6). */
        fun from(page: RankingPage): RankingPageResponse
    }
}

data class ClickPowerResponse(val value: Double?, val best: Double?)

@RestController
@RequestMapping("/rankings")
class RankingController(private val getRanking: GetRankingUseCase, private val refreshClickPower: RefreshClickPowerUseCase) {
    @GetMapping("/{board}")
    fun board(principal: Principal, @PathVariable board: String, @RequestParam(name = "chapter", required = false) chapter: String?): RankingPageResponse
    @PostMapping("/click-power")
    fun clickPower(principal: Principal): ClickPowerResponse
}
```

- `board`: `val parsed = RankingBoard.fromId(board)`; `val number = chapter?.let { it.toIntOrNull() ?: throw InvalidRankingRequestException(RecordRules.CHAPTER_MESSAGE) }`; `RankingPageResponse.from(getRanking.board(principal.name, parsed, number))`. `chapter` (null or not) is passed for every board; the service drops it outside BOSS_TIME.
- `from`: `fun number(v: Double): Number = if (page.board == RankingBoard.CLICK_POWER) v else v.toLong()`; `board = page.board.id`.
- `ApiExceptionHandler`: `@ExceptionHandler(RankingNotFoundException::class) fun rankingNotFound(e: RankingNotFoundException) = problem(HttpStatus.NOT_FOUND, e)` and `@ExceptionHandler(InvalidRankingRequestException::class) fun rankingRequest(e: InvalidRankingRequestException) = problem(HttpStatus.BAD_REQUEST, e)`.

**Steps**:

1. Create the controller and the responses; add the two handlers.
2. Create `RankingControllerIT.kt`; seed rows with `JdbcTemplate` inserts (`users(...)` first) except where a case says a real flow.
3. Push and run the CI gate.

**Tests**: integration
**Test cases** (`RankingControllerIT.kt`):

1. `the boss board of chapter 3 answers the top 10 in ascending time with integer values` (AC 1, 6): 12 users with chapter 3 times 1 000 x n -> status 200, `board` `"boss-time"`, `chapter` 3, `entries.size()` 10, `entries[0]` `{ position: 1, username: "p01", value: 1000 }` (`value` read as an `Integer`/`Long`, not `1000.0`), `me` null for the caller `test-caller`.
2. `the caller 12th of the boss board gets its own row` (AC 4): as `p12` -> `me` `{ position: 12, username: "p12", value: 12000 }`.
3. `the story board orders ascending and answers chapter null` (AC 2): `GET /rankings/story-time?chapter=3` -> `chapter` null, values `[1365000, 3600000]`.
4. `the click power board answers a JSON number largest first` (AC 2, 6): powers 41.0 and 16.5 -> values `[41.0, 16.5]` (`value` of the second is `16.5`).
5. `the fortune board lists the peaks largest first without 0` (AC 2, 7): wallets of 500, 0 and 700 copper (insert into `wallets`, the trigger fills the peaks) -> usernames of the 700 and 500 wallets, values `[700, 500]`.
6. `a tie goes to the earlier record` (AC 3): two chapter 3 times of 5 000 at 10 and 20 -> the one at 10 first.
7. `an unknown board is 404 RANKING_NOT_FOUND` (AC 8): `GET /rankings/gold` -> 404, `code` `RANKING_NOT_FOUND`.
8. `a boss board without a chapter, with 16 or with abc is 400 INVALID_RANKING_REQUEST` (AC 9): three requests -> 400 each, `code` `INVALID_RANKING_REQUEST`.
9. `the boards need a token` (AC 10): `GET /rankings/fortune` and `POST /rankings/click-power` with no header -> 401.
10. `a real boss fight lands on the board` (Boss AC 1 end to end): register `yan` (POST /users as `AccountResetControllerIT.registerPlayer`), set the progress to chapter 3 stage 10 `MINIBOSS` (`jpaProgressRepository`), `POST /progress/outcome` CLEARED from that position, `Thread.sleep(1_100)`, `POST /progress/outcome` CLEARED from chapter 3 stage 10 `CHAPTER_BOSS` -> `GET /rankings/boss-time?chapter=3` `me.value` >= 1100 and < 10000, `me.position` 1.
11. `the click power refresh answers the value and the best` (Power AC 6): register `yan` (leader of 0 stars, no piece) -> `POST /rankings/click-power` `{ value: 1.0, best: 1.0 }`; then `GET /rankings/click-power` lists `yan` with 1.0.
12. `a farm win records the click power` (Power AC 4 end to end): `yan` with the miniboss 1 of chapter 1 beaten (progress chapter 1 stage 2), `POST /farm/outcome` `{ boss: { kind: "MINIBOSS", stage: 1 }, outcome: "CLEARED" }` -> `GET /rankings/click-power` lists `yan`.

**Gate**: `git push origin HEAD:ci/rankings` then `node scripts/ci-wait.mjs ci/rankings`: the `backend` job is green with `RankingControllerIT`.
**Done when**:

- [ ] The 12 cases pass in CI; the whole backend job is green (every other suite unchanged).

**Commit**: `feat(backend): serve the ranking boards`

---

### Phase 3: Game

#### T11: Ranking domain: boards, formats and rows [x]

**Owner**: game-dev
**Goal**: One pure module holds the four boards (names, subtitles, value labels), every value format and the rows a page shows (RNK-08; spec § The Four Rankings, § Value Formats, Rows AC 1 to 6).
**Where**: `game/src/domain/rankings/rankings.js` (new)
**Files**:
- Also creates: `game/src/domain/rankings/rankings.test.js`
- Read first: `game/src/domain/combat/numberFormat.js`, `game/src/domain/combat/damage.js:40-46` (`formatDamage`), `game/src/domain/campaign/resetLegacy.js` (a small pure module with its texts), spec § Player-Facing Texts and § Value Formats
**Depends on**: None
**Requirement**: RNK-08

**Contract**:

```js
//  The four rankings of spec rankings: ids, names, subtitles, value formats and the rows of one board answer. Pure JavaScript: no Phaser.
import { formatDamage } from '../combat/damage';
import { formatShort } from '../combat/numberFormat';

export const BOSS_TIME = 'boss-time';
export const STORY_TIME = 'story-time';
export const CLICK_POWER = 'click-power';
export const FORTUNE = 'fortune';
export const LAST_CHAPTER = 15;
//  1 to 15
export const RANKING_CHAPTERS = Object.freeze(Array.from({ length: LAST_CHAPTER }, (_, index) => index + 1));
export const MEDALS = Object.freeze([ 'gold', 'silver', 'copper' ]);

export const BOARDS = Object.freeze([
    Object.freeze({ id: BOSS_TIME, name: 'Caçada Relâmpago', subtitle: 'O menor tempo para derrotar o chefe de cada capítulo, contado desde a vitória sobre o último miniboss.', valueLabel: 'Tempo', chaptered: true }),
    Object.freeze({ id: STORY_TIME, name: 'Travessia do Bosque', subtitle: 'O menor tempo para concluir a história, do início da jornada (ou do último reset) até a vitória sobre o chefe do capítulo 15.', valueLabel: 'Tempo', chaptered: false }),
    Object.freeze({ id: CLICK_POWER, name: 'Fúria da Aliança', subtitle: 'O maior Dano de clique somado ao Dano da equipe por clique que você já alcançou.', valueLabel: 'Dano por clique', chaptered: false }),
    Object.freeze({ id: FORTUNE, name: 'Tesouro do Bosque', subtitle: 'A maior fortuna em moedas que você já teve guardada de uma vez.', valueLabel: 'Moedas', chaptered: false })
]);

export const EMPTY_TEXT = 'Ninguém entrou neste ranking ainda.';
export const NONE_TEXT = 'Você ainda não entrou neste ranking.';
export const LOADING_TEXT = 'Carregando...';

//  The board of `id`; an unknown id is the boss board
export const boardOf = (id) => ...;

//  The boss board chapter for a campaign chapter: an integer clamped to 1..15, anything else 1
export const rankingChapter = (chapter) => ...;

//  "mm:ss" below one hour, "hh:mm:ss" from it (hours at least two digits, never cut); `tenths` appends ".d"; every part truncated
export const formatDuration = (ms, { tenths = false } = {}) => ...;

//  Copper as the HUD coins: gold through formatShort, silver and copper as plain numbers (strings)
export const coinParts = (copper) => ({ gold, silver, copper });

//  The value of a row: { coins } for FORTUNE, else { text } (boss-time with tenths, story-time without, click-power formatDamage)
export const rankingValue = (boardId, value) => ...;

//  The rows of one board answer `page` = { board, chapter, entries: [ { position, username, value } ], me: { position, username, value } | null }:
//  { rows: [ row ], pinned: row | null, none: boolean, empty: boolean },
//  row = { position, positionText: '<n>º', username, value: rankingValue(...), me: boolean, medal: 'gold' | 'silver' | 'copper' | null }
//  A row is `me` when its position is me.position; `pinned` is the own row when `me` is set and not among the entries; `none` when `me` is
//  null and there are entries; `empty` when there is no entry. A missing `me` field counts as null.
export const rankingRows = (page) => ...;
```

Rules: `formatDuration`: `total = floor(ms / 1000)`, `hours = floor(total / 3600)`, `minutes = floor(total / 60) mod 60`, `seconds = total mod 60`, two-digit pad with `padStart(2, '0')`; without hours `mm:ss`, with hours `hh:mm:ss`; with `tenths` append `.` + `floor(ms / 100) mod 10`. `coinParts`: gold `formatShort(floor(c / 10000))`, silver `String(floor(c / 100) % 100)`, copper `String(c % 100)`. `medal` = `MEDALS[position - 1] ?? null`.

**Steps**:

1. Create `rankings.js` with the Contract and the Rules.
2. Create `rankings.test.js` with the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`rankings.test.js`):

1. `the four boards in order with their names, subtitles and value labels`: `BOARDS.map((b) => [ b.id, b.name, b.valueLabel, b.chaptered ])` equals the four rows of spec § The Four Rankings with labels `Tempo`, `Tempo`, `Dano por clique`, `Moedas` and `chaptered` only for boss-time; each `subtitle` equals the spec text exactly.
2. `boardOf reads a board and falls back to the boss board`: `boardOf('fortune').name` `Tesouro do Bosque`; `boardOf('gold').id` `boss-time`.
3. `rankingChapter clamps the campaign chapter`: 4 -> 4, 0 -> 1, 20 -> 15, `undefined` -> 1, 2.5 -> 1.
4. `boss times read mm:ss.d and hh:mm:ss.d`: 1 000 -> `00:01.0`, 12 345 -> `00:12.3`, 61 050 -> `01:01.0`, 359 999 -> `05:59.9`, 3 600 000 -> `01:00:00.0`.
5. `story times read mm:ss and hh:mm:ss`: 1 365 000 -> `22:45`, 3 599 999 -> `59:59`, 3 600 000 -> `01:00:00`, 7 384 000 -> `02:03:04`, 360 000 000 -> `100:00:00`.
6. `click power reads as a damage number`: `rankingValue('click-power', v).text` for 1 -> `1`, 16.5 -> `16.5`, 131.75 -> `131.8`, 12 500 -> `12.5K`, 1 234 567 -> `1.2M`.
7. `fortune reads as gold, silver and copper`: `rankingValue('fortune', 1234567)` `{ coins: { gold: '123', silver: '45', copper: '67' } }`; 123 456 789 -> `{ gold: '12.3K', silver: '67', copper: '89' }`; 5 -> `{ gold: '0', silver: '0', copper: '5' }`.
8. `a row reads its position with º and the top three carry a medal`: entries at 1, 2, 3, 4 -> `positionText` `1º` .. `4º`, `medal` `gold`, `silver`, `copper`, null.
9. `the own row inside the entries is marked and nothing is pinned`: 10 entries, `me.position` 3 -> `rows[2].me` true, the other rows false, `pinned` null, `none` false.
10. `the own row at 10th stays in the list`: `me.position` 10 -> `rows[9].me` true, `pinned` null.
11. `the own row outside the entries is pinned with its position`: 10 entries, `me` `{ position: 11, username: 'yan', value: 5 }` on fortune -> `pinned` `{ position: 11, positionText: '11º', username: 'yan', value: { coins: { gold: '0', silver: '0', copper: '5' } }, me: true, medal: null }`.
12. `a player without a record reads none`: 3 entries, `me` null -> `none` true, `empty` false, `pinned` null.
13. `a board with no entry is empty`: entries `[]`, `me` null -> `empty` true, `none` false.
14. `a page without a me field counts as no record`: `{ board: 'fortune', chapter: null, entries: [ one ] }` -> `none` true.
15. `the texts of the states`: `EMPTY_TEXT`, `NONE_TEXT`, `LOADING_TEXT` equal the spec texts.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 15 cases pass; `architecture.test.js` passes (no import outward).

**Commit**: `feat(game): add the ranking boards and value formats`

---

#### T12: Ranking http adapter [ ]

**Owner**: game-dev
**Goal**: The game calls `GET /rankings/<board>` (with `chapter` for boss-time) and `POST /rankings/click-power` through the authenticated client (RNK-07).
**Where**: `game/src/adapters/http/rankingApi.js` (new)
**Files**:
- Also creates: `game/src/adapters/http/rankingApi.test.js`
- Read first: `game/src/adapters/http/farmApi.js`, `farmApi.test.js`, `giftApi.js` (a POST without body)
**Depends on**: None
**Requirement**: RNK-07

**Contract**:

```js
//  Wraps the backend RankingController (/rankings, spec rankings). Both calls carry the Bearer token through httpClient.
//  get(board, chapter) -> { board, chapter, entries: [ { position, username, value } ], me: { position, username, value } | null };
//    `chapter` is sent only for boss-time. recordClickPower() -> { value, best }. A failure rejects with an ApiError.
export const createRankingApi = (httpClient) => ({
    get: async (board, chapter) => (await httpClient.get(board === 'boss-time' ? `/rankings/boss-time?chapter=${chapter}` : `/rankings/${board}`)).data,
    recordClickPower: async () => (await httpClient.post('/rankings/click-power')).data
});
```

**Steps**: create the file and the test; run the gate.

**Tests**: unit
**Test cases** (`rankingApi.test.js`, `httpClient = { get: vi.fn(), post: vi.fn() }`):

1. `get of the boss board asks the chapter`: `get('boss-time', 3)` -> `httpClient.get` called with `/rankings/boss-time?chapter=3`; resolves the response `data`.
2. `get of another board sends no chapter`: `get('fortune', 3)` -> `/rankings/fortune`; `get('story-time')` -> `/rankings/story-time`; `get('click-power')` -> `/rankings/click-power`.
3. `recordClickPower posts with no body`: -> `httpClient.post` called with exactly `('/rankings/click-power')`; resolves `{ value: 1, best: 1 }`.
4. `a failure rejects`: `httpClient.get` rejects with `new Error('x')` -> `get('fortune')` rejects with it.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 4 cases pass.

**Commit**: `feat(game): call the ranking endpoints`

---

#### T13: Ranking board application service [ ]

**Owner**: game-dev
**Goal**: The screen's state: the board and chapter shown, the last page, the click power poke before each open and late answers dropped (RNK-07, RNK-09; spec Ranking screen AC 2, 3, 7, 8, Loading AC 3).
**Where**: `game/src/application/rankings/rankingBoard.js` (new)
**Files**:
- Also creates: `game/src/application/rankings/rankingBoard.test.js`
- Read first: `game/src/application/farm/farmSession.js` (generation and `cancel`), `farmSession.test.js` (deferred promises), T11 contract
**Depends on**: T11
**Requirement**: RNK-07, RNK-09

**Contract**:

```js
//  The Ranking screen's state (spec rankings): the board and chapter shown, the last page answered, and a generation that drops late answers.
//  Port (ADR 0007):
//    gateway { get(board, chapter) -> page, recordClickPower() -> { value, best } }: the backend /rankings calls; a failure rejects.
import { BOSS_TIME, boardOf, rankingChapter } from '../../domain/rankings/rankings';

export const createRankingBoard = ({ gateway }) => ({
    board: () => string,          // the board shown, BOSS_TIME at first
    chapter: () => number | null, // the boss board chapter, null before the first open
    page: () => page | null,      // the last page answered by the newest load, null before it or after a failed one
    open: async (campaignChapter) => boolean,
    select: async (board, chapter) => boolean,
    cancel: () => void
});
```

Rules:

- `load()` (private): `const started = ++generation;` `await gateway.get(board, board === BOSS_TIME ? chapter : undefined)`. If `started !== generation` afterwards: resolve `false` (answer or failure ignored). Else on success `page = answer` and resolve `true`; on failure `page = null` and reject with the error.
- `open(campaignChapter)`: when `chapter === null`, `chapter = rankingChapter(campaignChapter)`; then `await gateway.recordClickPower()` inside `try`/`catch` that ignores a failure; then `return load()`.
- `select(nextBoard, nextChapter)`: `board = boardOf(nextBoard).id`; when `nextChapter !== undefined`, `chapter = rankingChapter(nextChapter)`; `return load()`.
- `cancel()`: `generation += 1`.

**Steps**: create the file and the test; run the gate.

**Tests**: unit
**Test cases** (`rankingBoard.test.js`; `gateway = { get: vi.fn(), recordClickPower: vi.fn() }`, a `deferred()` helper):

1. `the first open records the click power, then loads the boss board of the campaign chapter`: `open(4)` -> call order `recordClickPower` then `get('boss-time', 4)` (check with `mock.invocationCallOrder`); resolves true; `board()` `boss-time`, `chapter()` 4, `page()` the answer.
2. `the campaign chapter is clamped`: fresh boards: `open(20)` -> `get('boss-time', 15)`; `open(0)` -> 1.
3. `a later open keeps the board and the chapter shown last` (Screen AC 7): `open(4)`, `select('fortune')`, `open(9)` -> last call `get('fortune', undefined)`; `chapter()` 4.
4. `a failed click power record still loads the board` (Loading AC 3): `recordClickPower` rejects -> `open(4)` resolves true and `get` was called.
5. `select loads another board without a chapter`: `select('story-time')` -> `get('story-time', undefined)`.
6. `select with a chapter loads that boss chapter`: after `open(4)`, `select('boss-time', 7)` -> `get('boss-time', 7)`, `chapter()` 7.
7. `an unknown board selects the boss board`: `select('gold')` -> `board()` `boss-time`.
8. `a late answer is dropped` (Screen AC 8): `select('story-time')` (deferred A), `select('fortune')` (deferred B); resolve B with page B, then A with page A -> `page()` page B; the first select resolved false.
9. `cancel drops the pending answer`: after a loaded page P, `select('fortune')` (deferred), `cancel()`, resolve -> resolves false, `page()` P.
10. `a failed newest load clears the page and rejects`: after page P, `get` rejects -> `select('fortune')` rejects, `page()` null.
11. `a failed dropped load resolves false and keeps the newer page`: `select('story-time')` (deferred A), `select('fortune')` resolves page B; A rejects -> first resolves false, `page()` page B.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 11 cases pass.

**Commit**: `feat(game): keep the ranking board state`

---

#### T14: Ranking view and its styles [ ]

**Owner**: game-dev
**Goal**: The DOM of the Ranking screen: tabs, heading, subtitle, chapter row, header and rows with medals, the own row, gap, pinned row, empty, none and loading states, styled in the Grove theme (RNK-08, RNK-09; spec Screen AC 4, 6, Rows AC 1 to 7, Loading AC 1).
**Where**: `game/src/adapters/phaser/views/rankingView.js` (new)
**Files**:
- Also creates: `game/src/adapters/phaser/views/rankingView.test.js`
- Also changes: `game/public/style.css` (block appended at the end)
- Read first: `views/dom.js:1-25` (`el`), `views/farmView.js:55-80` (`renderChapters`: the chip row to copy), `ClickerGame.js:1599-1610` (`refreshWalletText`: coin spans), `game/public/style.css:258-290` (`.sr-only`, `.coin*`), `:1493` (`.hero-empty`), `:3190-3258` (`.farm-chapters`, `.farm-chapter`), T11 contract
**Depends on**: T11
**Requirement**: RNK-08, RNK-09

**Contract**:

```js
//  The Ranking screen (spec rankings). model = { boardId, chapter, campaignChapter, page, loading }:
//    boardId the board shown, chapter the boss chapter shown, campaignChapter the campaign's own (marked on its chip),
//    page the last answer or null (nothing under the header area), loading true while a load runs.
//  handlers = { onBoard(id), onChapter(n) }: a click on another tab or chip; the pressed one does nothing.
export const renderRanking = (model, { onBoard, onChapter }) => HTMLElement
```

DOM, in order (all text through `el`, never `innerHTML`):

1. `div.ranking-screen` `data-testid="ranking-screen"`.
2. `div.ranking-tabs` `role="group"` `aria-label="Escolher ranking"` `data-testid="ranking-tabs"` with one `button.ranking-tab` per `BOARDS` entry: `type="button"`, `data-testid="ranking-tab-<id>"`, text = name, `aria-pressed` `"true"` for `boardId` else `"false"`; a click on a not-pressed tab calls `onBoard(id)`.
3. `h3.ranking-name` `data-testid="ranking-name"` = board name; `p.ranking-subtitle` `data-testid="ranking-subtitle"` = board subtitle.
4. Only for a `chaptered` board: `div.farm-chapters.ranking-chapters` `role="group"` `aria-label="Escolher capítulo"` `data-testid="ranking-chapters"`: `span.farm-chapters-label` `Capítulo`, then for n in `RANKING_CHAPTERS` a `button.farm-chapter` (plus ` is-current` when n is `campaignChapter`) `type="button"` `data-testid="ranking-chapter-<n>"` `aria-label="Capítulo <n>"` `aria-pressed` (`"true"` for `chapter`), `title="Capítulo atual"` on the current one; a click on a not-pressed chip calls `onChapter(n)`.
5. Then exactly one of:
   - `loading`: `p.ranking-loading` `data-testid="ranking-loading"` `Carregando...`.
   - `page === null`: nothing.
   - `rankingRows(page).empty`: `p.hero-empty` `data-testid="ranking-empty"` `Ninguém entrou neste ranking ainda.`
   - else `div.ranking-table` `data-testid="ranking-table"`: `div.ranking-head` with three `span`s `Posição`, `Jogador`, value label; `ol.ranking-list` `data-testid="ranking-list"` with one `li.ranking-row` per row (`is-me` added for the own row) `data-testid="ranking-row-<position>"`; when `pinned`: `li.ranking-gap` `aria-hidden="true"` `data-testid="ranking-gap"` `⋯`, then the pinned `li.ranking-row.is-me`; after the list, when `none`: `p.ranking-none` `data-testid="ranking-none"` `Você ainda não entrou neste ranking.`
6. A row: `span.ranking-position` (plus ` is-gold`, ` is-silver` or ` is-copper` from `medal`) with `positionText`; `span.ranking-player` holding `span.ranking-player-name` (text username, `title` username) and, for the own row, `span.ranking-you` `Você`; `span.ranking-value` with `value.text`, or for coins three groups like the HUD: `span.sr-only` `Ouro: ` + `span.coin.coin-gold` gold, `span.sr-only` `Prata: ` + `span.coin.coin-silver` silver, `span.sr-only` `Cobre: ` + `span.coin.coin-copper` copper.

Layout targets (the `ui-artist` checks them): the window is the existing 920 px `.hero-window`; four tabs share one 40 px row; the 10 rows of 34 px plus the header, the chapter row and the pinned row fit the 708 px window without a scroll bar; the value column is 240 px, right-aligned; a name is cut at 360 px.

CSS (append to `game/public/style.css`, exactly these rules; tokens of AD-022):

```css
/* ══ Ranking (spec rankings): four tabs, the board heading, the boss chapter row and the top 10 ══ */
.ranking-screen { display: flex; flex-direction: column; gap: 12px; }
.ranking-tabs { display: flex; gap: 8px; }
.ranking-tab {
    flex: 1 1 0;
    height: 40px;
    padding: 0 12px 3px;
    font-family: var(--font-heading);
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    color: var(--parchment-100);
    background: var(--btn-bg);
    background-color: var(--wood-800);
    border: 2px solid var(--bronze-500);
    border-radius: 999px;
    box-shadow: var(--btn-shadow);
    cursor: pointer;
}
.ranking-tab[aria-pressed="true"] { background: var(--btn-primary-bg); background-color: var(--ember-700); border-color: var(--gold-400); }
.ranking-tab:hover { filter: brightness(1.15); }
.ranking-tab:active { filter: brightness(0.9); }
.ranking-tab:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.ranking-name { margin: 4px 0 0; font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--ink-900); }
.ranking-subtitle { margin: 0; font-family: var(--font-body); font-size: 15px; line-height: 1.4; color: var(--ink-600); }
.ranking-table { display: flex; flex-direction: column; gap: 4px; }
.ranking-head,
.ranking-row { display: grid; grid-template-columns: 64px minmax(0, 1fr) 240px; align-items: center; column-gap: 12px; padding: 0 12px; }
.ranking-head { font-family: var(--font-body); font-size: 13px; font-weight: 700; color: var(--ink-600); }
.ranking-head span:last-child { justify-self: end; }
.ranking-list { display: flex; flex-direction: column; gap: 2px; margin: 0; padding: 0; list-style: none; }
.ranking-row { height: 34px; border-radius: var(--radius-md); font-family: var(--font-body); font-size: 16px; font-weight: 600; color: var(--ink-900); }
.ranking-row:nth-child(odd) { background: rgb(90 61 38 / 0.10); }
.ranking-row.is-me { background: color-mix(in srgb, var(--ember-500) 24%, transparent); box-shadow: inset 0 0 0 2px var(--ember-700); }
.ranking-position { font-family: var(--font-heading); font-size: 15px; font-weight: 700; color: var(--ink-600); }
.ranking-position.is-gold,
.ranking-position.is-silver,
.ranking-position.is-copper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    font-size: 13px;
    color: var(--wood-900);
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--wood-900), inset 0 -2px 0 rgb(0 0 0 / 0.3);
}
.ranking-position.is-gold { background: radial-gradient(circle at 35% 30%, #fff1b0, #e0b45a 55%, #8a5a12); }
.ranking-position.is-silver { background: radial-gradient(circle at 35% 30%, #ffffff, #c9ccd1 55%, #6f747b); }
.ranking-position.is-copper { background: radial-gradient(circle at 35% 30%, #f6c08f, #b8652d 55%, #5e2c10); }
.ranking-player { display: flex; align-items: center; min-width: 0; }
.ranking-player-name { max-width: 360px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ranking-you { flex: none; margin-left: 8px; padding: 1px 8px; font-size: 12px; font-weight: 700; color: var(--parchment-100); background: var(--ember-700); border-radius: 999px; }
.ranking-value { justify-self: end; font-family: var(--font-heading); font-size: 16px; font-weight: 700; white-space: nowrap; }
/* the coins are children 2, 4 and 6 (each after its .sr-only label, which is out of the flow) */
.ranking-value .coin:nth-child(n + 4) { margin-left: 12px; }
.ranking-gap { height: 20px; font-weight: 700; text-align: center; color: var(--ink-600); }
.ranking-none,
.ranking-loading { margin: 8px 0 0; font-family: var(--font-body); font-size: 15px; font-weight: 600; text-align: center; color: var(--ink-600); }
```

**Steps**:

1. Create `rankingView.js` (imports from `./dom` and `../../../domain/rankings/rankings`).
2. Append the CSS block.
3. Create `rankingView.test.js` (jsdom; build pages with a helper `page(board, entries, me = null)`, entries `{ position, username, value }`).
4. Run the gate.

**Tests**: unit
**Test cases** (`rankingView.test.js`):

1. `the four tabs in order with the shown one pressed`: model boss-time -> tab texts `[ 'Caçada Relâmpago', 'Travessia do Bosque', 'Fúria da Aliança', 'Tesouro do Bosque' ]`, `aria-pressed` `[ 'true', 'false', 'false', 'false' ]`; the group has `aria-label` `Escolher ranking`.
2. `a click on another tab calls onBoard with its id and the pressed tab does nothing`: click `ranking-tab-fortune` -> `onBoard('fortune')`; click `ranking-tab-boss-time` -> not called.
3. `the heading and subtitle of each board`: for each of the four boards `ranking-name` = name and `ranking-subtitle` = subtitle.
4. `the boss board shows chapters 1 to 15 with the shown one pressed and the campaign one marked`: chapter 7, campaignChapter 4 -> 15 chips with texts `1`..`15`, label `Capítulo`; chip 7 `aria-pressed` `true`; chip 4 has class `is-current` and `title` `Capítulo atual`; chip 1 `aria-label` `Capítulo 1`.
5. `a click on another chip calls onChapter and the pressed one does nothing`: click chip 9 -> `onChapter(9)`; chip 7 -> not called.
6. `the other boards have no chapter row`: story-time, click-power, fortune -> `ranking-chapters` absent.
7. `loading shows Carregando... and no table`: `loading: true` -> `ranking-loading` text `Carregando...`, `ranking-table` absent, tabs present.
8. `no page shows no table and no state line`: `page: null`, `loading: false` -> no `ranking-table`, `ranking-empty`, `ranking-loading`.
9. `an empty board shows only Ninguém entrou neste ranking ainda.`: entries `[]` -> `ranking-empty` text exact; no `.ranking-head`.
10. `the header and one row per entry with position, name and value`: boss-time entries `(1, 'ana', 12345)`, `(2, 'bob', 61050)` -> head texts `[ 'Posição', 'Jogador', 'Tempo' ]`; row 1 texts `1º`, `ana`, `00:12.3`; row 2 `2º`, `bob`, `01:01.0`.
11. `the value label of each board`: story-time `Tempo`, click-power `Dano por clique`, fortune `Moedas`.
12. `the top three positions carry the medal classes`: 4 entries -> `.ranking-position` classes contain `is-gold`, `is-silver`, `is-copper`, and the 4th none of them.
13. `the own row in the list is highlighted with Você`: `me` position 2 -> `ranking-row-2` has `is-me` and a `.ranking-you` `Você`; other rows have neither; no `ranking-gap`.
14. `the own row outside the list is pinned under the gap row`: 10 entries, `me` `{ position: 27, username: 'yan', value: 5 }` on fortune -> 12 `li` in the list in order: rows 1..10, `ranking-gap` (`⋯`, `aria-hidden` `true`), `ranking-row-27` with `is-me`, `27º`, `yan`, `Você`, coin texts `0`, `0`, `5`.
15. `a player without a record reads Você ainda não entrou neste ranking.`: 3 entries, `me` null -> `ranking-none` text exact.
16. `fortune values are three coins with assistive labels`: entry value 1 234 567 -> `.coin-gold` `123`, `.coin-silver` `45`, `.coin-copper` `67`; the `.sr-only` texts `Ouro: `, `Prata: `, `Cobre: `.
17. `a username is written as text with its full name as title`: username `<b>x</b>` -> `.ranking-player-name` `textContent` `<b>x</b>`, no `b` element inside, `title` `<b>x</b>`.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 17 cases pass; the CSS block is appended as given.

**Commit**: `feat(game): draw the ranking screen`

---

#### T15: The Ranking rail button and screen [ ]

**Owner**: game-dev
**Goal**: A seventh rail button opens the Ranking screen; tabs and chips load through the ranking board with `Carregando...`, a failure shows the error line, and closing drops pending loads (RNK-07, RNK-09; spec Screen AC 1 to 8, Loading AC 1, 2, 4).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Files**:
- Also changes: `game/src/adapters/phaser/HeroUi.test.js`
- Read first: `HeroUi.js:24-140` (`ICONS`, `SCREENS`, `RAIL`, constructor), `:196-300` (`show`, `close`, `dropFarmLoad`, `setError`), the `render_farm` and `selectFarmChapter` methods (pattern of a screen with chips); `HeroUi.test.js:1-110` (`createUi`, `open`, the rail test at `:95`), `:3110-3135` (rail cases); T13 and T14 contracts
**Depends on**: T13, T14
**Requirement**: RNK-07, RNK-09

**Contract** (`HeroUi.js`):

- `ICONS.rankings` = `icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>')` (Lucide `trophy`).
- `SCREENS` gains, last: `{ id: 'rankings', label: 'Ranking', title: 'Ranking' }`. Update the comments that say "six" (above `RAIL` and above the class) to "seven" and list Ranking.
- Constructor: destructure an optional `rankings` collaborator (`{ heroes, equipment, talents, farm, rankings = null, startFarm, ... }`), keep `this.rankings = rankings` and `this.rankingLoading = false`; add `rankings` to the collaborator list of the class comment.
- `show`: in the load `try`, a new branch before the final `else`: `else if (screen === 'rankings') { await this.rankings.open(this.campaignChapter()); }`. A failure falls into the existing `catch` (`setError(LOAD_FAILED)`). Reset `this.rankingLoading = false` with the other per-screen resets.
- New `campaignChapter()`: `const map = this.hooks.mapPosition?.() ?? DEFAULT_POSITION; return map.completed ? 15 : map.chapter;`.
- New `dropRankingLoad()` called right after `dropFarmLoad()` in `show` and `close` (it reads the screen being left): `if (this.screen === 'rankings') { this.rankings?.cancel(); this.rankingLoading = false; }`.
- New `render_rankings()`: `this.body.replaceChildren(renderRanking({ boardId: this.rankings.board(), chapter: this.rankings.chapter(), campaignChapter: this.campaignChapter(), page: this.rankings.page(), loading: this.rankingLoading }, { onBoard: (id) => this.selectRanking(id), onChapter: (n) => this.selectRanking(this.rankings.board(), n) }))`.
- New `async selectRanking(board, chapter)`: `const view = this.view; this.rankingLoading = true; this.setError(''); this.render_rankings();` then `try { const fresh = await this.rankings.select(board, chapter); if (!fresh || view !== this.view) { return; } this.rankingLoading = false; this.render_rankings(); } catch { if (view === this.view) { this.rankingLoading = false; this.setError(LOAD_FAILED); this.render_rankings(); } }`.

**Steps**:

1. Edit `HeroUi.js` as in the Contract (import `renderRanking` from `./views/rankingView`).
2. `HeroUi.test.js`: in `createUi` add `const rankingGateway = { get: vi.fn(async (board, chapter) => ({ board, chapter: board === 'boss-time' ? chapter : null, entries: [], me: null })), recordClickPower: vi.fn(async () => ({ value: 1, best: 1 })) };`, `const rankings = createRankingBoard({ gateway: rankingGateway });`, pass `rankings` to `new HeroUi`, return `rankings` and `rankingGateway` in the context.
3. Apply the re-pin table; add the new cases.
4. Run the gate.

**Re-pins** (`HeroUi.test.js`):

| Old name | New name | Change |
| --- | --- | --- |
| `shows the six buttons Heróis, Mochila, Equipe, Equipamento, Talentos and Mapa` | `shows the seven buttons Heróis, Mochila, Equipe, Equipamento, Talentos, Mapa and Ranking` | ids list + `'rankings'`, labels + `'Ranking'` |
| `the rail has the six buttons with Equipe in third place while the team is locked` | `the rail has the seven buttons with Equipe in third place while the team is locked` | expected ids + `'hud-rankings'` last |
| `the rail keeps the same six buttons once the team is unlocked` | `the rail keeps the same seven buttons once the team is unlocked` | expected ids + `'hud-rankings'` last |

**Tests**: unit
**Test cases** (`HeroUi.test.js`, new `describe('HeroUi Ranking')`; `position` of `createUi` sets `mapPosition`):

1. `the Ranking button carries the trophy icon and its label`: `testid('hud-rankings').textContent` `Ranking`; it holds one `svg`.
2. `the Ranking button records the click power and opens the boss board of the campaign chapter` (Screen AC 2, 3): position chapter 4 -> after `open(ctx, 'rankings')`: `recordClickPower` called once, `get` called with `('boss-time', 4)`, `.hero-title` `Ranking`, `ranking-tab-boss-time` `aria-pressed` `true`, `ranking-chapter-4` pressed.
3. `a completed campaign opens chapter 15`: position `{ chapter: 15, stage: 10, kind: 'CHAPTER_BOSS', stageCount: 10, completed: true }` -> `get('boss-time', 15)`.
4. `a tab click shows Carregando... and then the board` (Screen AC 5, Loading AC 1): `get` deferred for fortune; click `ranking-tab-fortune` -> `ranking-loading` shown and the tabs still present; resolve -> `ranking-name` `Tesouro do Bosque`, no `ranking-loading`.
5. `a chapter chip click loads that chapter` (Screen AC 6): click `ranking-chapter-9` -> `get('boss-time', 9)`; chip 9 pressed after the answer.
6. `a failed open shows Não foi possível carregar.` (Loading AC 2): `get` rejects -> `.hero-error` visible with `Não foi possível carregar.`.
7. `a failed tab load shows the error line and no rows, and a later success hides it` (Loading AC 2, 4): click fortune with `get` rejecting -> error line visible, no `ranking-table`; click story-time resolving -> error line hidden, `ranking-name` `Travessia do Bosque`.
8. `closing during a tab load drops its answer` (Screen AC 8): click fortune (deferred), `ui.close()`, resolve -> `ui.isOpen` false and the body empty.
9. `opening another screen during a tab load drops its answer`: click fortune (deferred), open `talents`, resolve -> `.hero-title` `Talentos`, no `ranking-screen`.
10. `reopening shows the board and chapter shown last` (Screen AC 7): select fortune, close, `open(ctx, 'rankings')` -> last `get` call `('fortune', undefined)` and `ranking-tab-fortune` pressed.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 10 new cases and the 3 re-pinned cases pass; every other `HeroUi.test.js` case passes unchanged.

**Commit**: `feat(game): open the rankings from the rail`

---

#### T16: Wire the ranking board into the game [ ]

**Owner**: game-dev
**Goal**: The composition builds the ranking api and one board per scene, and the scene hands it to the hero screens (RNK-07).
**Where**: `game/src/composition.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.js` (`create`: `this.rankings`; `createHeroUi`: `rankings`), `game/src/adapters/phaser/ClickerGame.test.js` (services mock), `game/src/composition.test.js`
- Read first: `composition.js` (whole), `ClickerGame.js:185-195` (`services.createFarmSession()`), `:637-649` (`new HeroUi`), `ClickerGame.test.js:40-70` (services mock), `composition.test.js:1-60`
**Depends on**: T12, T15
**Requirement**: RNK-07

**Contract**:

- `composition.js`: `import { createRankingApi } from './adapters/http/rankingApi';`, `import { createRankingBoard as createRankingBoardService } from './application/rankings/rankingBoard';`, `export const rankingApi = createRankingApi(httpClient);`, `export const createRankingBoard = () => createRankingBoardService({ gateway: rankingApi });`, and `createRankingBoard` in `services` (after `createFarmSession`).
- `ClickerGame.js`: after `this.farm = services.createFarmSession();` add `this.rankings = services.createRankingBoard();`; in `new HeroUi(this, { ... })` add `rankings: this.rankings,` after `farm: this.farm,`.
- `ClickerGame.test.js`: the services mock gains `createRankingBoard: () => createRankingBoard({ gateway: rankingGateway })` with `const rankingGateway = { get: vi.fn(async () => ({ board: 'boss-time', chapter: 1, entries: [], me: null })), recordClickPower: vi.fn(async () => ({ value: 1, best: 1 })) };` and the import of `createRankingBoard`.

**Re-pins** (`composition.test.js`):

| Old name | New name | Change |
| --- | --- | --- |
| `hands the scenes the session, the user api and one factory per game service` | unchanged | the sorted key list gains `'createRankingBoard'` after `'createHeroCollection'` |

**Tests**: unit
**Test cases**:

1. `composition.test.js` `builds a fresh ranking board with its own state on every call`: two calls -> different objects; `first.board()` `boss-time`, `first.chapter()` null, `first.page()` null; `typeof first.open` `function`.
2. `ClickerGame.test.js` `the scene hands its ranking board to the hero screens`: after `createScene()`, `ctx.scene.heroUi.rankings` is `ctx.scene.rankings` and not null.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 2 cases and the re-pinned case pass; every other case of the two test files passes.

**Commit**: `feat(game): wire the ranking board into the scene`

---

### Phase 4: Tests in the browser and author check

#### T17: The game formulas give the fixture values [ ]

**Owner**: test-engineer
**Goal**: The game's `leaderAttacker` and `allyDamagePerClick` give the six values of the shared fixture, so a damage change in the game that the backend does not follow fails `npm test` (RNK-03; spec Power AC 2).
**Where**: `game/src/domain/combat/clickPowerParity.test.js` (new)
**Files**:
- Read first: `backend/src/test/resources/ranking/click-power-cases.json` (T3), `game/src/domain/combat/leaderAttacker.js`, `allyAttacker.js`, `game/src/domain/heroes/team.js:40-120` (`teamActive`, `teamPassives`), `game/src/storyAssets.test.js` (a test that reads files with `node:fs`)
**Depends on**: T3
**Requirement**: RNK-03

**Contract** (test only, no production change):

- Read the fixture with `readFileSync(fileURLToPath(new URL('../../../../backend/src/test/resources/ranking/click-power-cases.json', import.meta.url)), 'utf8')` (`node:fs`, `node:url`) and `JSON.parse`.
- Per case: `piece(p)` = `p.slot === 'WEAPON' ? { slot: 'WEAPON', clickDamage: p.click, affixes: [] } : { slot: p.slot, affixes: [ { type: 'CLICK_DAMAGE_PCT', value: p.clickDamagePct } ] }`; `talents` = `Object.entries(c.talentValues).map(([ id, value ]) => ({ id, value }))`; `allies` = `c.allies.slice(0, c.boughtSlots)`; `active` = `teamActive({ chapter: c.chapter, completed: c.completed })`; `allyFactor` = `teamPassives(active ? allies.map((a) => a.heroId) : []).allyFactor`; `power` = `leaderAttacker({ leader: { element: 'FIRE', stars: c.leader.stars }, pieces: c.leader.pieces.map(piece), talents }).baseDamage + sum of allyDamagePerClick({ ally: { stars: a.stars }, pieces: a.pieces.map(piece), allyFactor })`.

**Steps**: create the test; run the gate.

**Tests**: unit
**Test cases** (`clickPowerParity.test.js`):

1. `the fixture holds the six cases of the spec`: names start with `C1` .. `C6`; `expected` `[ 1, 16.5, 41, 33, 131.75, 241 ]`.
2. `the game computes every fixture case like the backend` (`it.each` over the cases, title `%s`): `expect(power).toBeCloseTo(c.expected, 9)`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 2 tests (7 assertions of value) pass.

**Commit**: `test(game): pin the click power formula to the backend fixture`

---

#### T18: Ranking scenarios in the browser [ ]

**Owner**: test-engineer
**Goal**: Every player-visible AC of the Ranking screen, the rows, the formats and the states runs in Chrome against the fake backend (RNK-07, RNK-08, RNK-09; spec Screen AC 1 to 8, Rows AC 1 to 7, Loading AC 1 to 4, the UI Edge Cases).
**Where**: `game/e2e/rankings.spec.js` (new)
**Files**:
- Also changes: `game/e2e/support/fakeBackend.js` (rankings routes and controls)
- Read first: `game/e2e/resetLegacy.spec.js:1-60` (start helper, a feature spec), `game/e2e/support/fakeBackend.js:255-300` (options comment and signature), `:497-536` (`handleAccountReset`: an `authenticated` handler with `problem`), `:1120-1215` (the dispatch and `page.route` list), `game/e2e/bossReplayChapters.spec.js` (`holdFarm` use), T14 DOM contract
**Depends on**: T16
**Requirement**: RNK-07, RNK-08, RNK-09

**Fake backend contract** (`mockBackend(page, { ..., rankings = {}, rankingsEndpoint = true, failClickPower = false })`; document the three options in the options comment):

- `rankings`: `{ 'boss-time:<n>': { entries, me }, 'story-time': {...}, 'click-power': {...}, 'fortune': {...} }`; a missing key answers `{ entries: [], me: null }`.
- `GET /rankings/<board>[?chapter=<n>]` (authenticated): an id other than the four -> `problem(404, ..., 'RANKING_NOT_FOUND')`; `boss-time` without an integer chapter 1 to 15 -> `problem(400, ..., 'INVALID_RANKING_REQUEST')`; else `{ board, chapter: board === 'boss-time' ? n : null, entries, me }`.
- `POST /rankings/click-power` (authenticated): `{ value: 1, best: 1 }`, or `problem(500, 'Failed')` with `failClickPower`.
- `rankingsEndpoint: false`: every `/rankings` path answers `problem(404, 'Not found')`.
- Route: `await page.route('**/api/rankings/**', handler);` and a dispatch line `if (path.startsWith('/rankings/')) { return handleRankings(route, method, path, body, now); }`; rankings requests are kept out of `calls`.
- Controls added to the returned object: `rankingCalls()` -> `[ { method, path, chapter } ]` in arrival order (`chapter` the query number or null); `holdRankings(board)` -> `release()` holds every GET of that board until `release()` is called; `failNextRanking()` makes the next GET answer `problem(500, 'Failed')`.

**Steps**:

1. Extend `fakeBackend.js` as above.
2. Create `rankings.spec.js` with a `startGame(page, { chapter = 4, completed = false, ...options })` helper (as `resetLegacy.spec.js`: `users: { yan: 'secret123' }`, `progress: { yan: { chapter, completed } }`), `openRanking(page)` = `page.getByTestId('hud-rankings').click()` then `expect(page.getByTestId('ranking-screen')).toBeVisible()`, and `entries(n, value)` building `n` entries `{ position: i, username: 'p' + pad(i), value: value(i) }`.
3. Add the scenarios below; run the gate.

**Tests**: e2e
**Test cases** (`rankings.spec.js`, `test.describe('Rankings')`):

1. `the rail shows Ranking as its seventh button` (Screen AC 1): ids of `.hero-hud button[data-testid^="hud-"]` equal `[ 'hud-heroes', 'hud-bag', 'hud-team', 'hud-equipment', 'hud-talents', 'hud-farm', 'hud-rankings' ]`; `hud-rankings` text `Ranking`.
2. `opening Ranking records the click power, then shows the boss board of the campaign chapter` (Screen AC 2, 3, 4): chapter 4 -> `rankingCalls()` `[ { method: 'POST', path: '/rankings/click-power', chapter: null }, { method: 'GET', path: '/rankings/boss-time', chapter: 4 } ]`; `.hero-title` `Ranking`; `ranking-tab-boss-time` `aria-pressed` `true`; `ranking-name` `Caçada Relâmpago`; `ranking-subtitle` = the spec subtitle; `ranking-chapter-4` `aria-pressed` `true` and class `is-current`.
3. `a completed campaign opens the chapter 15 board`: `completed: true`, chapter 15 -> the GET has `chapter` 15.
4. `the four tabs read the four names in order and each shows its own subtitle` (Screen AC 4, 5): tab texts in order; click each of story-time, click-power, fortune -> GET of that path with `chapter` null, `ranking-name` and `ranking-subtitle` of that board, `ranking-chapters` count 0.
5. `a chapter chip loads that chapter` (Screen AC 6): click `ranking-chapter-7` -> GET `chapter` 7, chip 7 pressed, chip 4 still `is-current`.
6. `boss rows read position, nick and mm:ss.d` (Rows AC 1): `'boss-time:4'` entries `(1, 'ana', 1000)`, `(2, 'bob', 12345)`, `(3, 'cid', 3600000)` -> rows read `1º ana 00:01.0`, `2º bob 00:12.3`, `3º cid 01:00:00.0`; head `Posição`, `Jogador`, `Tempo`.
7. `story rows read mm:ss and hh:mm:ss` (Rows AC 1): `'story-time'` 1 365 000 and 7 384 000 -> `22:45`, `02:03:04`.
8. `power rows read damage numbers` (Rows AC 1): `'click-power'` 16.5 and 12 500 -> `16.5`, `12.5K`; head `Dano por clique`.
9. `fortune rows read gold, silver and copper coins` (Rows AC 1): `'fortune'` 1 234 567 and 123 456 789 -> row 1 coins `123`, `45`, `67`; row 2 `12.3K`, `67`, `89`; head `Moedas`.
10. `the top three positions sit on gold, silver and copper discs` (Rows AC 2): 4 entries -> classes `is-gold`, `is-silver`, `is-copper`, none on the 4th.
11. `the own row inside the top 10 is highlighted with Você` (Rows AC 3): 10 entries, `me` `{ position: 3, username: 'p03', value: 3000 }` -> `ranking-row-3` has `is-me` and `Você`; no `ranking-gap`; 10 rows.
12. `the own row at 10th stays in the list` (Edge Case): `me.position` 10 -> `ranking-row-10` `is-me`; no gap; 10 rows.
13. `the own row at 11th is pinned under the gap row` (Rows AC 4, Edge Case): 10 entries, `me` position 11 -> 10 rows, `ranking-gap` `⋯`, then `ranking-row-11` with `11º` and `Você`.
14. `the own row at 27th is pinned with its fortune` (Rows AC 4): fortune, `me` `{ position: 27, username: 'yan', value: 5 }` -> `ranking-row-27` `27º`, `yan`, coins `0`, `0`, `5`.
15. `a player without a record reads Você ainda não entrou neste ranking.` (Rows AC 5): 3 entries, `me` null -> `ranking-none` text exact; 3 rows (Edge Case: 3 entries show 3 rows).
16. `an empty board reads Ninguém entrou neste ranking ainda. and shows no header` (Rows AC 6): -> `ranking-empty` text exact; `.ranking-head` count 0.
17. `a username is written as text and a long one ends in an ellipsis on one line` (Rows AC 7, Edge Case): usernames `<b>x</b>` and `'a'.repeat(255)` -> the first row's name text `<b>x</b>` with no `b` element; the long name: `scrollWidth > clientWidth`, `title` the 255 characters, and the row's height equals the height of the first row.
18. `Carregando... shows while a tab loads and the tabs stay clickable` (Loading AC 1): `holdRankings('fortune')`, click fortune -> `ranking-loading` `Carregando...`, `ranking-tab-story-time` enabled; `release()` -> rows of fortune, no `ranking-loading`.
19. `the answer of a tab left before it arrived is ignored` (Screen AC 8): `holdRankings('story-time')`, click story-time, click fortune (answers) -> `ranking-name` `Tesouro do Bosque`; `release()`; after the story answer lands (`expect.poll` on `rankingCalls().length`), `ranking-name` still `Tesouro do Bosque`.
20. `reopening the screen shows the board shown last` (Screen AC 7): select fortune, close (`hero-close`), open Ranking -> the last GET is `/rankings/fortune`, `ranking-tab-fortune` pressed.
21. `a backend without rankings shows Não foi possível carregar.` (Loading AC 2): `rankingsEndpoint: false` -> `.hero-error` `Não foi possível carregar.`; `ranking-table` count 0.
22. `a failed click power record still shows the board` (Loading AC 3): `failClickPower: true`, `'boss-time:4'` with one entry -> `ranking-row-1` visible; no error line.
23. `a load that succeeds after a failed one hides the error line` (Loading AC 4): open, `failNextRanking()`, click fortune -> error line visible; click story-time -> error line hidden, `ranking-name` `Travessia do Bosque`.

**Gate**: `cd game && npm test && npx playwright test e2e/rankings.spec.js`
**Done when**:

- [ ] The 23 scenarios pass in Chrome; the other e2e files that use `mockBackend` are untouched in behaviour (the new options default to the old answers).

**Commit**: `test(game): rankings in the browser`

---

#### T19: Re-pin the e2e rail to seven buttons [ ]

**Owner**: test-engineer
**Goal**: The three e2e files that pin six rail buttons pin seven, with Ranking last (RNK-07; spec Screen AC 1).
**Where**: `game/e2e/heroTeam.spec.js`
**Files**:
- Also changes: `game/e2e/equipment.spec.js`, `game/e2e/heroBagCards.spec.js`
- Read first: `game/e2e/equipment.spec.js:40-48`, `game/e2e/heroBagCards.spec.js:405-416`, `game/e2e/heroTeam.spec.js:80-96`
**Depends on**: T16
**Requirement**: RNK-07

**Re-pins**:

| File | Old name | New name | Change |
| --- | --- | --- | --- |
| `equipment.spec.js` | the test around `:45` (name unchanged) | unchanged | `toHaveCount(6)` -> `toHaveCount(7)` |
| `heroBagCards.spec.js` | `the rail has six buttons and no Fusão` | `the rail has seven buttons and no Fusão` | ids + `'hud-rankings'` last |
| `heroTeam.spec.js` | `the Equipe button is in the rail before the chapter 5 boss is won and the rail keeps six buttons` | `the Equipe button is in the rail before the chapter 5 boss is won and the rail keeps seven buttons` | `toHaveCount(6)` -> `toHaveCount(7)` |
| `heroTeam.spec.js` | `the Equipe button sits right after Mochila once the chapter 5 boss is won and the rail stays above the battle bar` | unchanged | ids + `'hud-rankings'` last; its "rail above the battle bar" assertion stays as written |

**Steps**: apply the table; run the gate for each file in turn.

**Tests**: e2e
**Gate**: `cd game && npx playwright test e2e/equipment.spec.js`, then `e2e/heroBagCards.spec.js`, then `e2e/heroTeam.spec.js` (one file per run)
**Done when**:

- [ ] The three files pass; the commit body lists the four re-pinned tests.

**Commit**: `test(game): the rail has seven buttons`

---

#### T20: Author check of the rankings [ ]

**Owner**: test-engineer
**Goal**: Every AC and Edge Case of the spec maps to an exact assertion, the riskiest code kills its mutants, and the whole CI run of the branch is green (the feature's test gate).
**Where**: `.specs/features/rankings/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (§ Author check), the spec, the tests of T1 to T19, `scripts/sensor.mjs` (format at its top), `CLAUDE.md` § Agent team 4 (CI and mutants), `.specs/features/team-click-damage/tasks.md` § Author check (format)
**Depends on**: T17, T18, T19
**Requirement**: RNK-01 to RNK-09

**Steps**:

1. Build the AC to assertion table (backend unit, backend IT, game unit and e2e columns, `file:line`, exact value), including every Edge Case.
2. Write a scratch `mutants.json` (not committed) with at least: (M1) `RunClock.afterOutcome` without the `CHAPTER_BOSS -> null` branch (`RecordKeeperTest` case 6); (M2) `BOSS_FLOOR_MS = 0` (case 3); (M3) `storyFloorMs` without the `+ 1` of the chapter boss (`RankingsTest` 11); (M4) `runStart` with `resets >= 0` (`RecordKeeperTest` 12); (M5) `ClickPower.of` boosting with Seraphine while the team is inactive (C4 in `ClickPowerTest` and `clickPowerParity.test.js`); (M6) `STAR_CLICK_PCT[3] = 30` (C2); (M7) `improveBossTime` with `excluded.best_ms > player_boss_times.best_ms` (`RankingRepositoryIT` 3, 4); (M8) `top` ordering `achieved_at desc` (`RankingRepositoryIT` 7); (M9) `RankingPageResponse.from` without `toLong()` (`RankingControllerIT` 1); (M10) `formatDuration` with `Math.round` for the tenths (`rankings.test.js` 4, 359 999); (M11) `rankingRows` pinning the own row even when listed (`rankings.test.js` 9); (M12) `rankingBoard.open` without `recordClickPower` (`rankingBoard.test.js` 1, e2e 2); (M13) `HeroUi.selectRanking` without the `view !== this.view` check (`HeroUi.test.js` 8, 9); (M14) `ProgressService.get` without `onProgressLoaded` (`ProgressServiceTest` new case 1); (M15) `record_peak_copper` with `>=` (`RankingsMigrationIT` 3); (M16) `RecordKeeper.onOutcome` computing the power on a phase win (`RecordKeeperTest` 15).
3. Push (`git push origin HEAD:ci/rankings`), run the mutants in CI: `gh workflow run tests.yml --ref ci/rankings -f mutants="$(cat mutants.json)" -f suites=false`, then `node scripts/ci-wait.mjs ci/rankings --event workflow_dispatch` (foreground, `timeout: 600000`).
4. Run `node scripts/ci-wait.mjs ci/rankings` (foreground, `timeout: 600000`) for the push run of the branch head: every job green (backend, game unit, e2e 12 shards, deploy).
5. Append § Author check with the table, the mutant results, the CI run ids and the suite totals; any surviving mutant, AC without an exact assertion or red job becomes a fix task listed there with its owner.

**Tests**: e2e + unit + integration (runs the suites in CI, writes no production code)
**Gate**: `node scripts/ci-wait.mjs ci/rankings` exits 0
**Done when**:

- [ ] Every AC and Edge Case maps to a test; every mutant is killed or a fix task is listed; the CI run of the branch head is green.

**Commit**: `test: author check of the rankings`

---

### Phase 5: UI review

#### T21: UI review of the Ranking screen [ ]

**Owner**: ui-artist
**Goal**: The seventh rail button fits, the four tabs, the heading and the rows read clearly in the Grove theme, the own row stands out and the window needs no scroll bar (RNK-08; spec § Player-Facing Texts, § Value Formats, Rows AC 1 to 7).
**Where**: `game/ui-review/rankings.shots.js` (new)
**Files**:
- Also creates: `.specs/features/rankings/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/rankings/ui-review/*.png`
- Read first: `game/ui-review/resetLegacy.shots.js` (a shots file with `mockBackend`), `game/ui-review/bossReplayChapters.shots.js` (chapter chips), `game/ui-review/support/shots.js`, the T18 fake backend options, spec § Player-Facing Texts and § Value Formats
**Depends on**: T20
**Requirement**: RNK-08

**Shots** (desktop 1280 x 720 only; player `yan` in chapter 4 unless said):

- `01-rail`: the battle with the seven-button rail.
- `02-boss-board`: Caçada Relâmpago chapter 4, 10 entries (1 000 to 95 000 ms), `me` at 3.
- `03-boss-pinned`: the same with `me` at 27 (gap and pinned row): the tallest content.
- `04-story-board`: Travessia do Bosque, values 1 365 000, 7 384 000, 360 000 000.
- `05-power-board`: Fúria da Aliança, values 1, 16.5, 12 500, 1 234 567.
- `06-fortune-board`: Tesouro do Bosque, values 5, 1 234 567, 123 456 789.
- `07-long-names`: names of 255 `a`, of 40 characters and `<b>x</b>`.
- `08-empty`: an empty board.
- `09-none`: 3 entries, `me` null.
- `10-loading`: `Carregando...` (held fortune answer).
- `11-error`: `Não foi possível carregar.` (`rankingsEndpoint: false`).
- `12-chapter-15`: completed campaign, chip 15 pressed and marked.

**Check against**: the rail stays inside the canvas and above the battle bar (shot 01); the four tabs fit one row with no clipped name (`Travessia do Bosque` is the longest); shot 03 shows the 10 rows, the gap and the pinned row with no scroll bar in the 708 px window; the subtitle wraps to at most 2 lines; the value column is right-aligned and the coins of a row line up; contrast measured on the shots: row text on the zebra and on the `is-me` tint at least 4.5:1, the `Você` chip text at least 4.5:1, the position numerals on the gold, silver and copper discs at least 4.5:1 (13 px bold is normal text); the long name ends in an ellipsis on one line; compare the Mapa chips (`.specs/features/boss-replay-chapters/ui-review/`) with the ranking chips: same look. Write the measured contrast ratios.

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- rankings`
**Done when**:

- [ ] `ui-review.html` lists the 12 shots with `APROVADO`, or each finding as a new task in this file with its owner.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: V21 migration | 1 migration + its IT and the compatibility re-pin | ✅ Granular (one schema change) |
| T2: Ranking domain | 1 file of pure rules | ✅ Granular |
| T3: ClickPower | 1 formula + its fixture | ✅ Granular |
| T4: Ranking repository | 1 port + 1 adapter + fake | ⚠️ OK, cohesive (one data-access seam) |
| T5: RecordKeeper | 1 component + its interface + fakes | ⚠️ OK, cohesive |
| T6: ProgressService hooks | 1 service | ✅ Granular |
| T7: FarmService hook | 1 service | ✅ Granular |
| T8: AccountResetService hook | 1 service | ✅ Granular |
| T9: RankingService | 1 service + use case | ✅ Granular |
| T10: RankingController | 1 endpoint pair + 2 handlers | ✅ Granular |
| T11: rankings.js | 1 pure module | ✅ Granular |
| T12: rankingApi.js | 1 adapter | ✅ Granular |
| T13: rankingBoard.js | 1 application service | ✅ Granular |
| T14: rankingView.js + CSS | 1 view and its style block | ⚠️ OK, cohesive |
| T15: HeroUi screen | 1 file | ✅ Granular |
| T16: wiring | 3 small edits of one wiring seam | ⚠️ OK, cohesive |
| T17: parity test | 1 test file | ✅ Granular |
| T18: e2e | 1 spec + its fake routes | ⚠️ OK, cohesive |
| T19: e2e re-pins | 3 one-line re-pins | ⚠️ OK, cohesive |
| T20: author check | review | ✅ |
| T21: UI review | review | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | none | ✅ Match |
| T2 | None | none | ✅ Match |
| T3 | None | none | ✅ Match |
| T4 | T1, T2 | T1 → T4, T2 → T4 | ✅ Match |
| T5 | T2, T3, T4 (Phase 1) | start of Phase 2 | ✅ Match (cross-phase, backward) |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T5 | T5 → T7 | ✅ Match |
| T8 | T5 | T5 → T8 | ✅ Match |
| T9 | T5 | T5 → T9 | ✅ Match |
| T10 | T6, T7, T8, T9 | T6/T7/T8/T9 → T10 | ✅ Match |
| T11 | None | none | ✅ Match |
| T12 | None | none | ✅ Match |
| T13 | T11 | T11 → T13 | ✅ Match |
| T14 | T11 | T11 → T14 | ✅ Match |
| T15 | T13, T14 | T13 → T15, T14 → T15 | ✅ Match |
| T16 | T12, T15 | T12 → T16, T15 → T16 | ✅ Match |
| T17 | T3 (Phase 1) | start of Phase 4 | ✅ Match (cross-phase, backward) |
| T18 | T16 (Phase 3) | start of Phase 4 | ✅ Match (cross-phase, backward) |
| T19 | T16 (Phase 3) | start of Phase 4 | ✅ Match (cross-phase, backward) |
| T20 | T17, T18, T19 | T17/T18/T19 → T20 | ✅ Match |
| T21 | T20 (Phase 4) | Phase 5 | ✅ Match (cross-phase, backward) |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend migration | integration | integration | ✅ OK |
| T2 | Backend domain | unit | unit | ✅ OK |
| T3 | Backend domain + parity fixture | unit | unit | ✅ OK |
| T4 | Backend repository | integration | integration | ✅ OK |
| T5 | Backend service | unit | unit | ✅ OK |
| T6 | Backend service | unit | unit | ✅ OK |
| T7 | Backend service | unit | unit | ✅ OK |
| T8 | Backend service | unit | unit | ✅ OK |
| T9 | Backend service | unit | unit | ✅ OK |
| T10 | Backend web | integration | integration | ✅ OK |
| T11 | Game domain | unit | unit | ✅ OK |
| T12 | Game http | unit | unit | ✅ OK |
| T13 | Game application | unit | unit | ✅ OK |
| T14 | Game view + CSS | unit + e2e | unit (the e2e of the screen is T18: the view is reachable in the browser only after T15 and T16 wire it, merge-forward rule) | ✅ OK |
| T15 | Game screen | unit | unit | ✅ OK |
| T16 | Game wiring | unit | unit | ✅ OK |
| T17 | Formula parity (test only) | unit | unit | ✅ OK |
| T18 | Player-visible behaviour + e2e support | e2e | e2e | ✅ OK |
| T19 | e2e re-pins | e2e | e2e | ✅ OK |
| T20 | none (runs suites) | - | e2e + unit + integration | ✅ OK |
| T21 | UI review artifact | none | none | ✅ OK |
