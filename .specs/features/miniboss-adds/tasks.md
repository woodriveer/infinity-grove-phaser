# Miniboss Adds Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/miniboss-adds/spec.md`
**Design**: `.specs/features/miniboss-adds/design.md`
**Status**: Approved by the owner (2026-11-19), with Q47 to Q52 answered as the recommended defaults; no task changes. Written on the recommended defaults against `main` at `3e8ff62`; line numbers below were read that day.

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root. `<main>` is `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `<test>` is `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`.
- `graphify-out/graph.json` exists: run `graphify query "<question>"` before your first search of the code, and read raw files only for the lines the graph or this file located (`CLAUDE.md`).
- Line numbers drift once an earlier task edits a file: find each edit by the test name or the exact text quoted here, not by the number alone.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`; never stage `graphify-out/`. If a file you must change already has changes you did not make, STOP and report it.
- Mark the task `[x]` in this file in the same commit. Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- **If a test that the task does not name fails, STOP and report its file, name and failure. Do not edit it.** Never weaken, skip or delete a test.
- Decimal expectations use `toBeCloseTo(value, 9)` in Vitest and `toBeCloseTo(value, 5)` in Playwright unless the task gives another precision; Kotlin uses exact integers here.
- Every new player-facing text is Portuguese and copied from spec § Player-Facing Texts, character for character (AD-007, L-010). The target chip separator is ` · ` (space, U+00B7, space).
- Words used below: **adds fight** = an encounter whose `adds` list is not empty (a chapter 11 to 15 miniboss); **main** = the miniboss of an adds fight, or the one monster of any other fight (`this.monster` in the scene); **guarded defense** = `min(own defense + buffs of the living adds, 90)` (spec § Add Table).

---

## Owner Questions (open)

The owner confirmed the recommended defaults of spec Q47 to Q52 on 2026-11-19, so the tasks stand as written. Kept for traceability:

| Question | Default used | Tasks that change with another answer |
| --- | --- | --- |
| Q47 Counterplay | A: no new rule; kill the adds or lower the capped defense with what exists | B (2 x health): T1 `ADD_HEALTH_FACTOR`, T2 migration, T3, T13 values. C (Brado suspends the buff): T6, T9, T10, T15. D (cap 80): T6 `MAX_GUARDED_DEFENSE` and every 90-based value in T6, T9 to T15 |
| Q48 Buff values | A: +30, +35, +40, +45, +50 per add | B (+20, +22, +25 in 13 to 15): T1 `ADD_BUFFS`, T2 migration values and tests, T3 tests |
| Q49 Target name and HP | A: target chip in the enemy box; the big bar stays the miniboss's | B or C: T10 (chip, `updateHealthBar`), T11, T14, T16 |
| Q50 Skill order | Adds first, then the miniboss | Miniboss first: T9 (`victims` order and E7, E10 values), T12, T15 (the 17.5 cases) |
| Q51 Click on no monster | Hits the target | T11 (`hitMonster` last branch), T14 |
| Q52 Effect tags | The target's debuffs and damage over time | T12 (`refreshSkillUi`), T15 |

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit for service/domain, e2e for every player-visible behaviour), `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), `game/ui-review.config.js` (shots at 1280x720 and 390x844). No coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`StageAdd`, `StageDefinition`, `ChapterDefinition.of`) | unit | Every bound (lower and upper, L-022), every row of the Add Table, chapters 1 to 10 empty | `<test>/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository and migration | integration (Testcontainers) | Round trip, replace on save, table bounds and constraints, the migration on stored stages, re-run, the previous release on the migrated schema (L-080) | `<test>/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Backend web | integration | The `adds` field in `GET /progress`, `POST /progress/outcome` and `GET /farm` | `<test>/adapter/web/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain | unit | Every AC with a number (AC 4 to 7, E1 to E10), every skill family, every edge case of the spec (L-039) | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game scene | unit (jsdom) | Every position, size, colour and text of § Fight Layout, every target rule, every kill path, one test per trigger (L-098) | `game/src/adapters/phaser/ClickerGame.test.js` | `cd game && npm test` |
| e2e | e2e (Playwright, fake backend) | Every player-visible AC and edge case of the spec | `game/e2e/minibossAdds*.spec.js` | `cd game && npx playwright test e2e/minibossAdds` |
| Docs (`backend/docs/adr/0014-miniboss-adds.md`) | none | Read by the product owner | - | build gate only |
| UI review | none | `ui-artist` review (T16) | `.specs/features/miniboss-adds/ui-review.html` | `cd game && npm run ui:shots -- minibossAdds` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After game tasks with unit tests only | `cd game && npm test` |
| Full | After backend tasks and e2e tasks | backend: `cd backend && ./gradlew ktlintCheck test`; e2e: `cd game && npm test && npx playwright test e2e/<file>` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. The backend chain (T1 to T4) and the game chain (T5 to T12) do not depend on each other (design § Deploy Order: either order is safe), so the orchestrator may run them in two worktrees; the e2e chain starts after T12. Every commit is safe to deploy alone.

### Phase 1: Backend data

```
T1 → T2 → T3 → T4
```

### Phase 2: Game combat domain

```
T5 → T6 → T7 → T8 → T9
```

### Phase 3: Game combat scene

```
T9 → T10 → T11 → T12
```

### Phase 4: e2e

```
T12 → T13 → T14 → T15
```

### Phase 5: Visual review

```
T15 → T16
```

---

## Task Breakdown

### T1: Seed the adds of the chapter 11 to 15 minibosses [ ]

**Owner**: kotlin-backend-dev
**Goal**: The chapter domain carries 0 to 2 adds per stage and seeds 2 adds with the Add Table buff and 3 times the phase monster health on every stage of chapters 11 to 15 (ADDS-01, spec Adds AC 2).
**Where**: `<main>/domain/Chapter.kt`
**Also changes**: `<test>/domain/ChapterTest.kt`
**Read first**: `<main>/domain/Chapter.kt` (whole file: `EnemyStats.MAX_DEFENSE` at `:17`, `StageDefinition` at `:26`, `ChapterDefinition.of` at `:149`), `<test>/domain/ChapterTest.kt:1-60` and `:173-200` (style of the rejection and chapter table tests), spec § Add Table, design § Backend `StageAdd`
**Depends on**: None
**Requirement**: ADDS-01

**Contract**:

```kotlin
/** One add of a miniboss (spec miniboss-adds): its health and the points it adds to the miniboss's defense while it lives. */
data class StageAdd(
    val health: Long,
    val defenseBuff: Int,
) {
    init {
        require(health >= 1) { "add health $health must be at least 1" }
        require(defenseBuff in 0..EnemyStats.MAX_DEFENSE) { "add defense-buff $defenseBuff must be between 0 and ${EnemyStats.MAX_DEFENSE}" }
    }
}

// StageDefinition: a new last constructor parameter
//     val adds: List<StageAdd> = emptyList(),
// in init, after the existing checks:
//     require(adds.size <= MAX_ADDS) { "Stage $number: at most $MAX_ADDS adds, got ${adds.size}" }
// and a companion object:
//     companion object { const val MAX_ADDS = 2 }

// ChapterDefinition companion object, next to the other constants:
//     private const val ADDS_PER_MINIBOSS = 2
//     private const val ADD_HEALTH_FACTOR = 3
//     /** The buff of each add by chapter (spec miniboss-adds, Add Table); chapters not listed have no adds. */
//     private val ADD_BUFFS = mapOf(11 to 30, 12 to 35, 13 to 40, 14 to 45, 15 to 50)
//
//     /** The adds of a stage of chapter [number] whose phase monster has [monsterHealth]: two of 3 times that health from chapter 11 to 15. */
//     fun addsOf(number: Int, monsterHealth: Long): List<StageAdd> =
//         ADD_BUFFS[number]?.let { buff -> List(ADDS_PER_MINIBOSS) { StageAdd(monsterHealth * ADD_HEALTH_FACTOR, buff) } } ?: emptyList()
//
// in of(number), the StageDefinition(...) call gains: adds = addsOf(number, monsterHealth),
```

**Steps**:

1. Add `StageAdd` right above `StageDefinition`.
2. Add `adds`, its check and `MAX_ADDS` to `StageDefinition`.
3. Add the constants and `addsOf` to the `ChapterDefinition` companion and pass `adds` in `of`.
4. Add the test cases below to `ChapterTest.kt`.
5. Run the gate.

**Tests**: unit
**Test cases** (`ChapterTest.kt`, exact names):

- `an add with health 0 is rejected`: `assertFailsWith<IllegalArgumentException> { StageAdd(0, 30) }`, message `add health 0 must be at least 1`.
- `an add with health 1 is accepted`: `StageAdd(1, 30).health == 1L`.
- `an add buff of -1 or 91 is rejected and 0 and 90 are accepted`: `StageAdd(5, -1)` and `StageAdd(5, 91)` throw (message `add defense-buff 91 must be between 0 and 90` for 91); `StageAdd(5, 0)` and `StageAdd(5, 90)` build.
- `a stage with 3 adds is rejected and names the stage`: a `StageDefinition(number = 1, phasesPerStage = 5, monsterHealth = 10, minibossHealth = 50, minibossTimeLimitMs = 30_000, adds = List(3) { StageAdd(1, 0) })` throws with message `Stage 1: at most 2 adds, got 3`; with 2 adds it builds.
- `a stage without adds has an empty list`: the same stage without `adds` has `adds == emptyList<StageAdd>()`.
- `chapters 1 to 10 seed no adds`: for every chapter 1 to 10, every stage of `ChapterDefinition.of(n)` has an empty `adds`.
- `chapter 11 seeds two adds of 30 with 3 times the phase monster health on every stage`: `of(11).stage(1).adds == listOf(StageAdd(1_966_080, 30), StageAdd(1_966_080, 30))`; `of(11).stage(10).adds == listOf(StageAdd(3_735_552, 30), StageAdd(3_735_552, 30))`; every stage of chapter 11 has 2 adds of `3 * monsterHealth`.
- `chapters 12 to 15 seed buffs of 35, 40, 45 and 50`: every add of every stage of `of(12)`, `of(13)`, `of(14)`, `of(15)` has `defenseBuff` 35, 40, 45, 50; each stage has 2 adds of `3 * monsterHealth`.
- `chapter 15 stage 1 seeds adds of 31457280 health`: `of(15).stage(1).adds == listOf(StageAdd(31_457_280, 50), StageAdd(31_457_280, 50))`.
- `addsOf of a chapter outside 11 to 15 is empty`: `ChapterDefinition.addsOf(10, 100)`, `addsOf(16, 100)` and `addsOf(1, 100)` are empty.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 10 cases pass and every existing backend test passes.

**Commit**: `feat(backend): seed the adds of the chapter 11 to 15 minibosses`

---

### T2: Store the adds in `stage_adds` [ ]

**Owner**: kotlin-backend-dev
**Goal**: A new table holds the adds of each stage; the migration fills the stored chapters 11 to 15, the repository reads and writes them with the stages, and the previous backend keeps working (ADDS-01, spec Adds AC 2, AD-016).
**Where**: `backend/src/main/resources/db/migration/V13__miniboss_adds.sql` (new)
**Also changes**: `<main>/adapter/repository/ChapterEntities.kt`, `<main>/adapter/repository/ChapterRepository.kt`, `<test>/adapter/repository/ChapterRepositoryIT.kt`, `<test>/adapter/repository/StageAddsMigrationIT.kt` (new), `<test>/adapter/config/ChapterSeederIT.kt`, `<test>/adapter/repository/PreviousBackendCompatibilityIT.kt`
**Read first**: `<main>/adapter/repository/ChapterEntities.kt` (whole: `StageEntity` at `:91`, `idOf` at `:130`), `<main>/adapter/repository/ChapterRepository.kt` (whole), `backend/src/main/resources/db/migration/V12__hero_team.sql`, `<test>/adapter/repository/ChapterRepositoryIT.kt:1-130`, `<test>/adapter/repository/UnifiedDamageMigrationIT.kt:1-30` and `:96-118` (re-running a migration with `jdbc.execute`), `<test>/adapter/repository/PreviousBackendCompatibilityIT.kt:18-24`, `:170-223`, `<test>/adapter/config/ChapterSeederIT.kt:30-46`, design § Backend persistence
**Depends on**: T1
**Requirement**: ADDS-01

**Contract** - migration (exactly this file):

```sql
-- The adds of a miniboss (spec miniboss-adds): 0 to 2 per stage, each with its health and the points it adds to the miniboss's defense.
-- Expand only (AD-016): the previous backend never reads this table. Stages of chapters 1 to 10 have no row. Every statement can run
-- again (StageAddsMigrationIT re-runs the file).
create table if not exists stage_adds (
    id           varchar(255) primary key,
    stage_id     varchar(255) not null references stages (id) on delete restrict,
    slot         integer      not null check (slot between 1 and 2),
    hit_points   bigint       not null check (hit_points >= 1),
    defense_buff integer      not null check (defense_buff between 0 and 90),
    constraint uk_stage_adds_stage_slot unique (stage_id, slot)
);

create index if not exists idx_stage_adds_stage on stage_adds (stage_id);

-- ChapterSeeder never overwrites a stored chapter, so the stored stages of chapters 11 to 15 get their two adds here: health 3 times the
-- phase monster health the stage holds now, the buff of the chapter. A new database has no stage yet; the seeder writes its adds.
insert into stage_adds (id, stage_id, slot, hit_points, defense_buff)
select s.id || '/' || a.slot, s.id, a.slot, 3 * s.monster_hit_points, b.buff
  from stages s
  join (values (11, 30), (12, 35), (13, 40), (14, 45), (15, 50)) as b (chapter, buff) on b.chapter = s.chapter
 cross join (values (1), (2)) as a (slot)
 where s.monster_hit_points is not null
on conflict (id) do nothing;
```

Contract - entity (in `ChapterEntities.kt`, after `StageEntity`):

```kotlin
/** One add of a stage (spec miniboss-adds), keyed `chapter/stage/slot`; `(stage_id, slot)` is unique. */
@Entity
@Table(
    name = "stage_adds",
    uniqueConstraints = [UniqueConstraint(name = "uk_stage_adds_stage_slot", columnNames = ["stage_id", "slot"])],
)
class StageAddEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var id: String,
    @Column(name = "stage_id", nullable = false, updatable = false)
    var stageId: String,
    @Column(nullable = false, updatable = false)
    var slot: Int,
    @Column(nullable = false)
    var hitPoints: Long,
    @Column(nullable = false)
    var defenseBuff: Int,
) {
    fun toDomain() = StageAdd(hitPoints, defenseBuff)

    companion object {
        fun idOf(chapter: Int, stage: Int, slot: Int) = "$chapter/$stage/$slot"

        fun from(chapter: Int, stage: Int, slot: Int, add: StageAdd) =
            StageAddEntity(idOf(chapter, stage, slot), StageEntity.idOf(chapter, stage), slot, add.health, add.defenseBuff)
    }
}
```

- `StageEntity.toDomain(enemies: Map<Long, EnemyStats>, adds: List<StageAdd> = emptyList())` passes `adds = adds` to `StageDefinition`.
- `ChapterEntity.toDomain(stages, enemies, adds: Map<String, List<StageAdd>> = emptyMap())` maps each stage with `it.toDomain(enemies, adds[it.id] ?: emptyList())`.
- `ChapterRepository.kt`: `interface JpaStageAddRepository : JpaRepository<StageAddEntity, String> { fun findAllByStageIdIn(stageIds: Collection<String>): List<StageAddEntity> }`; `ChapterRepository` gains the constructor parameter `private val jpaStageAddRepository: JpaStageAddRepository`.
  - `findByNumber`: after reading the stages, `val adds = jpaStageAddRepository.findAllByStageIdIn(stages.map { it.id }).groupBy { it.stageId }.mapValues { (_, rows) -> rows.sortedBy { it.slot }.map { it.toDomain() } }` and `chapter.toDomain(stages, enemies, adds)`.
  - `save`: after `jpaStageRepository.saveAll(...)`:

```kotlin
val stageIds = chapter.stages.map { StageEntity.idOf(chapter.number, it.number) }
val wanted = chapter.stages.flatMap { stage -> stage.adds.mapIndexed { index, add -> StageAddEntity.from(chapter.number, stage.number, index + 1, add) } }
val wantedIds = wanted.map { it.id }.toSet()
// a save replaces the adds of the chapter: rows of a slot the new chapter no longer has are deleted, the others are written over
jpaStageAddRepository.deleteAll(jpaStageAddRepository.findAllByStageIdIn(stageIds).filterNot { it.id in wantedIds })
jpaStageAddRepository.saveAll(wanted)
```

- `PreviousBackendCompatibilityIT`: `PREVIOUS_LAST_VERSION = 12`; rename the test `the previous release starts on the migrated schema and its validation ignores V12` to `the previous release starts on the migrated schema and its validation ignores V13`; in the class KDoc and the `previousMigrations` KDoc, `V12` becomes `V13`, `V11` becomes `V12` and "the V11-era backend" becomes "the hero-team backend". No other change.
- `ChapterRepositoryIT`: `clean()` first runs `jdbc.update("delete from stage_adds where stage_id like ?", "$number/%")`; the `chapter(...)` helper gains a parameter `adds: List<StageAdd> = emptyList()` passed to every stage.
- `ChapterSeederIT`: autowire `JdbcTemplate jdbc`; `removeChapter(number)` first runs `jdbc.update("delete from stage_adds where stage_id in (select id from stages where chapter = ?)", number)`.

**Steps**:

1. Write `V13__miniboss_adds.sql` as above.
2. Add `StageAddEntity` and the `toDomain` parameters in `ChapterEntities.kt`.
3. Add `JpaStageAddRepository` and the read and write of the adds in `ChapterRepository.kt`.
4. Change `PreviousBackendCompatibilityIT`, `ChapterRepositoryIT` and `ChapterSeederIT` as above, then add the cases below.
5. Run the gate. `SchemaValidationIT` checks the new entity against the table; it must pass unchanged.

**Tests**: integration
**Test cases** (exact names):

`ChapterRepositoryIT.kt`:

- `a chapter with two adds per stage reads back equal, adds in slot order`: save `chapter(adds = listOf(StageAdd(500, 30), StageAdd(600, 40)))`; `repository.findByNumber(90)` equals it; stage 1 `adds == listOf(StageAdd(500, 30), StageAdd(600, 40))`.
- `saving a chapter again with one add per stage keeps only that add`: save with the two adds above, then with `listOf(StageAdd(700, 10))`; stage 1 reads `listOf(StageAdd(700, 10))`; `select count(*) from stage_adds where stage_id like '90/%'` is 3.
- `saving a chapter again without adds deletes its add rows`: save with two adds, then without; the count above is 0 and every stage reads an empty list.
- `an add of 3000000000 health round-trips in the hit point column`: `StageAdd(3_000_000_000, 90)` reads back equal.
- `the seeded chapters 11 to 15 read two adds on every stage and chapters 1 to 10 none`: `findByNumber(11)!!.stage(1).adds == listOf(StageAdd(1_966_080, 30), StageAdd(1_966_080, 30))`; `findByNumber(15)!!.stage(1).adds == listOf(StageAdd(31_457_280, 50), StageAdd(31_457_280, 50))`; every stage of `findByNumber(10)` has none; `select count(*) from stage_adds` is 100.

`StageAddsMigrationIT.kt` (new, `IntegrationTestBase`, `JdbcTemplate jdbc`; `private fun migrate() = jdbc.execute(ClassPathResource("db/migration/V13__miniboss_adds.sql").getContentAsString(Charsets.UTF_8))`; `@AfterTest fun restore()` runs `delete from stage_adds`, `update stages set monster_hit_points = 1572864 where id = '12/3'`, then `migrate()`, which rebuilds the 100 seeded rows):

- `the migration gives every stored stage of chapters 11 to 15 two adds with 3 times its phase monster health`: `delete from stage_adds`; `migrate()`; count 100; row `11/1/1`: `stage_id` `11/1`, `slot` 1, `hit_points` 1966080, `defense_buff` 30; row `15/10/2`: `hit_points` 59768832, `defense_buff` 50; row `13/5/1`: `defense_buff` 40.
- `the migration gives no add to chapters 1 to 10`: after `delete` and `migrate()`, `select count(*) from stage_adds a join stages s on s.id = a.stage_id where s.chapter <= 10` is 0.
- `the migration uses the phase monster health the stage holds now`: `delete from stage_adds`; `update stages set monster_hit_points = 1000 where id = '12/3'`; `migrate()`; row `12/3/1` has `hit_points` 3000 and `defense_buff` 35.
- `running the migration twice keeps 100 rows and a buff tuned in the database`: `update stage_adds set defense_buff = 10 where id = '11/1/1'`; `migrate()`; `migrate()`; count 100; row `11/1/1` `defense_buff` 10.
- `an add slot of 0 or 3 is refused and 1 and 2 are accepted`: on stage `1/1`, inserts with slot 0 and slot 3 throw `DataIntegrityViolationException`; slots 1 and 2 insert (ids `t/1`, `t/2`).
- `an add of 0 hit points is refused and 1 is accepted`: on stage `1/2`.
- `an add buff of -1 or 91 is refused and 0 and 90 are accepted`: on stages `1/3`, `1/4`.
- `an add of a stage that does not exist is refused`: `stage_id` `99/1` throws.
- `a second add in the same slot of a stage is refused`: a row `x/1` with `stage_id` `11/1`, `slot` 1 throws (unique `uk_stage_adds_stage_slot`).
- `a stage with adds cannot be deleted`: `delete from stages where id = '11/1'` throws and row `11/1/1` is still there.

`ChapterSeederIT.kt`:

- `a missing chapter 11 is seeded on start with two adds on each of its 10 stages`: `removeChapter(11)`; `seeder.seed()`; `repository.findByNumber(11) == ChapterDefinition.of(11)`; `select count(*) from stage_adds where stage_id like '11/%'` is 20.

`PreviousBackendCompatibilityIT.kt`: the renamed test passes with `PREVIOUS_LAST_VERSION = 12`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 16 new cases and the renamed case pass, `SchemaValidationIT` and `ChapterSeederIT` `application start seeds chapters 1 to 15` pass unchanged, and every existing backend test passes.
- [ ] `V13__miniboss_adds.sql` creates one table and one index and inserts only into it (no `alter`, no `drop`, no `update`).

**Commit**: `feat(backend): store the miniboss adds in stage_adds`

---

### T3: Answer the adds in the progress and farm payloads [ ]

**Owner**: kotlin-backend-dev
**Goal**: Every stage of `GET /progress`, `POST /progress/outcome` and `GET /farm` carries `adds` (ADDS-01, spec Adds AC 1).
**Where**: `<main>/adapter/web/ProgressController.kt`
**Also changes**: `<test>/adapter/web/ProgressControllerIT.kt`, `<test>/adapter/web/FarmControllerIT.kt`
**Read first**: `<main>/adapter/web/ProgressController.kt:24-75` (`EnemyStatsResponse`, `StageResponse`), `<main>/adapter/web/FarmController.kt:30-50` (reuses `ChapterResponse`), `<test>/adapter/web/ProgressControllerIT.kt:30-96` (helpers `user`, `getProgress`, `store`, `report`), `<test>/adapter/web/FarmControllerIT.kt:30-60`, `:287-308`, spec § Data row, design § Backend web
**Depends on**: T2
**Requirement**: ADDS-01

**Contract**:

```kotlin
/** One add of a miniboss in the progress and farm payloads (spec miniboss-adds). */
data class AddResponse(
    val health: Long,
    val defenseBuff: Int,
) {
    companion object {
        fun from(add: StageAdd) = AddResponse(add.health, add.defenseBuff)
    }
}

// StageResponse gains a last field
//     val adds: List<AddResponse>,
// filled in StageResponse.from by
//     adds = stage.adds.map(AddResponse::from),
```

JSON of chapter 11 stage 1: `"adds": [ { "health": 1966080, "defenseBuff": 30 }, { "health": 1966080, "defenseBuff": 30 } ]`; chapters 1 to 10: `"adds": []`.

**Steps**:

1. Add `AddResponse` above `StageResponse` and the `adds` field.
2. Add the cases below. A progress at chapter 11 is stored with `jpaProgressRepository.save(ProgressEntity("yan", 11, 1, "MINIBOSS", 1, false))`, as the `progressAt` helper of `FarmControllerIT.kt:36` does.
3. Run the gate.

**Tests**: integration
**Test cases** (exact names):

`ProgressControllerIT.kt`:

- `GET progress answers an empty adds list on every stage of chapter 1`: `definition.stages[0].adds` and `definition.stages[9].adds` have size 0.
- `GET progress at chapter 11 answers two adds of 30 with 1966080 health on stage 1`: `definition.stages[0].adds` size 2; `[0].health` 1966080, `[0].defenseBuff` 30, `[1].health` 1966080, `[1].defenseBuff` 30; `definition.stages[9].adds[0].health` 3735552.
- `GET progress at chapter 15 answers adds of 31457280 health and 50 defense`: progress at chapter 15 stage 1 PHASE; `definition.stages[0].adds[1].health` 31457280, `defenseBuff` 50.
- `a reported miniboss win at chapter 11 answers the next stage with its adds`: progress chapter 11 stage 1 MINIBOSS; `report(body(1, "MINIBOSS", 1, "CLEARED", chapter = 11))` answers 200, `stage` 2, `encounter` `PHASE`, `definition.stages[1].adds` size 2, `definition.stages[1].adds[0].defenseBuff` 30.

`FarmControllerIT.kt`:

- `GET farm of chapter 11 answers the adds of its minibosses`: `progressAt(1, "PHASE", chapter = 12)`; `GET /farm?chapter=11` answers `definition.stages[0].adds` size 2, `[0].health` 1966080, `[0].defenseBuff` 30.
- `GET farm of chapter 2 answers empty adds`: `progressAt(4, "PHASE", chapter = 3)`; `GET /farm?chapter=2` answers `definition.stages[0].adds` size 0.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 6 cases pass and every existing backend test passes.

**Commit**: `feat(backend): answer the adds of each stage in the progress and farm payloads`

---

### T4: Record the miniboss adds in ADR 0014 [ ]

**Owner**: kotlin-backend-dev
**Goal**: The backend ADRs record where the adds live, how they are seeded and that the server never sees an add (ADDS-01).
**Where**: `backend/docs/adr/0014-miniboss-adds.md` (new)
**Read first**: `backend/docs/adr/0013-hero-team.md` (format), design § Backend persistence, § Deploy Order and Compatibility
**Depends on**: T3
**Requirement**: ADDS-01

**Contract** - sections and facts, in English, the format of ADR 0013:

- Title `# ADR 0014: Miniboss adds (one row per add, seeded by migration and seeder)`; `Status: Accepted`; `Date:` the commit date.
- **Context**: from chapter 11 a miniboss fights with 2 adds that raise its one defense (spec `miniboss-adds`, AD-021); combat runs in the browser (AD-002).
- **Decision**: table `stage_adds(id, stage_id, slot, hit_points, defense_buff)` in `V13__miniboss_adds.sql`, checks (slot 1 to 2, hit points at least 1, buff 0 to 90), unique `(stage_id, slot)`, `stage_id` references `stages` on delete restrict (AD-010); the migration fills the stored stages of chapters 11 to 15 (buffs 30, 35, 40, 45, 50; health 3 times the stored phase monster health) and `ChapterSeeder` writes the adds of a chapter it seeds; `ChapterRepository.save` replaces the adds of a chapter; `StageResponse.adds` in `GET /progress`, `POST /progress/outcome` and `GET /farm`.
- **Expand only**: the previous backend never reads the table (`PreviousBackendCompatibilityIT`, last previous migration V12); either deploy order is safe.
- **Consequences**: the server never sees an add, a target or an add kill; the guarded defense and the target are game rules; tuning an add is a row update.

**Steps**:

1. Write the file.
2. Run the gate.

**Tests**: none
**Gate**: build - `cd backend && ./gradlew ktlintCheck test` (unchanged)
**Done when**:

- [ ] The file holds the five parts above and names `V13__miniboss_adds.sql`, `stage_adds` and the five buffs.

**Commit**: `docs(backend): record the miniboss adds storage`

---

### T5: Read the adds of a stage [x]

**Owner**: game-dev
**Goal**: A pure function turns the `adds` of a stage of the payload into at most 2 valid adds with the stage's phase monster stats (ADDS-02, spec Adds AC 9, 10).
**Where**: `game/src/domain/combat/adds.js` (new)
**Also changes**: `game/src/domain/combat/adds.test.js` (new)
**Read first**: `game/src/domain/combat/monster.js` (`DEFAULT_STATS`), `game/src/domain/campaign/campaign.js:1-12` (payload shape), spec § Assumptions "Invalid add data in the game", design § Game `adds.js`
**Depends on**: None
**Requirement**: ADDS-02

**Contract**:

```js
//  The adds of a miniboss (spec miniboss-adds) as the progress and farm payloads carry them: `stage.adds` is a list of
//  { health, defenseBuff } in slot order. Pure JavaScript: no Phaser.
import { DEFAULT_STATS } from './monster';

export const MAX_ADDS = 2;
export const MAX_ADD_BUFF = 90;

const validHealth = (health) => typeof health === 'number' && Number.isFinite(health) && health >= 1;
const validBuff = (buff) => Number.isInteger(buff) && buff >= 0 && buff <= MAX_ADD_BUFF;

//  The adds of `stage`: [ { health, defenseBuff, stats } ], where stats are the stage's phase monster stats. A missing stage or a
//  missing or non-list `adds` gives none; an entry with a bad health or buff is skipped; only the first MAX_ADDS valid entries count.
export const addsOf = (stage) =>
{
    const list = Array.isArray(stage?.adds) ? stage.adds : [];
    const stats = stage?.monster ?? DEFAULT_STATS;

    return list
        .filter((add) => validHealth(add?.health) && validBuff(add?.defenseBuff))
        .slice(0, MAX_ADDS)
        .map(({ health, defenseBuff }) => ({ health, defenseBuff, stats }));
};
```

**Steps**:

1. Write `adds.js` from the contract.
2. Write the tests below.
3. Run the gate.

**Tests**: unit
**Test cases** (`adds.test.js`, exact names; `const WATER = { element: 'WATER', defense: 0, critResistance: 0 }`):

- `a stage without adds has none`: `addsOf({ monster: WATER })` → `[]`.
- `adds that are not a list give none`: `adds` `'x'`, `null`, `{}` → `[]` each.
- `a missing stage gives none`: `addsOf(undefined)` → `[]`.
- `two valid adds keep their order, health, buff and the stage's phase monster stats`: `{ monster: WATER, adds: [ { health: 1966080, defenseBuff: 30 }, { health: 20, defenseBuff: 0 } ] }` → `[ { health: 1966080, defenseBuff: 30, stats: WATER }, { health: 20, defenseBuff: 0, stats: WATER } ]`.
- `a stage without a phase monster gives its adds the default stats`: `stats` is `DEFAULT_STATS`.
- `an add of health 0, 0.5, a string or no health is skipped`: each with `defenseBuff: 30` → `[]`.
- `an add of health 1 is kept`.
- `a health above 2^31 is kept`: `3000000000`.
- `a buff of -1, 91, 30.5, a string or no buff is skipped and 0 and 90 are kept`.
- `only the first 2 valid adds count`: three valid → the first two; `[ invalid, valid A, valid B, valid C ]` → `[ A, B ]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 10 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): read the adds of a stage`

---

### T6: Keep the monsters and the target of one fight [ ]

**Owner**: game-dev
**Goal**: A pure `Fight` holds the main monster, its adds as `Monster`s, the target and the guarded defense of the main (ADDS-03, ADDS-04, spec Adds AC 4 to 6, Target AC 1, 2, 6).
**Where**: `game/src/domain/combat/fight.js` (new)
**Also changes**: `game/src/domain/combat/fight.test.js` (new)
**Read first**: `game/src/domain/combat/monster.js` (whole), `game/src/domain/combat/damage.js` (`calculateDamage`, `PLAYER`), `game/src/domain/talents/talents.js:24-31` (`monsterAfterBreak`), spec § Add Table, § Target and Skill Rules, design § Game `Fight`
**Depends on**: T5
**Requirement**: ADDS-03, ADDS-04

**Contract**:

```js
//  The monsters of one encounter (spec miniboss-adds): the main monster, its adds in slot order and the target the player picked. A
//  living add raises the main's one defense by its buff, at most MAX_GUARDED_DEFENSE. Pure JavaScript: no Phaser.
import { DEFAULT_STATS, defenseOf, Monster } from './monster';

export const MAX_GUARDED_DEFENSE = 90;
export const MAIN_NAME = 'Miniboss';
export const addName = (slot) => `Lacaio ${slot}`;

//  The defense of a main monster guarded by `bonus` points: capped at 90 once there is a bonus, unchanged without one
export const guardedDefense = (defense, bonus) => (bonus > 0 ? Math.min(defense + bonus, MAX_GUARDED_DEFENSE) : defense);

export class Fight
{
    //  `adds` are the entries of `addsOf` ({ health, defenseBuff, stats }); each becomes a Monster with no drop rule
    constructor (main, adds = [])
    {
        this.main = main;
        this.adds = adds.map((add, index) => ({
            slot: index + 1, name: addName(index + 1), defenseBuff: add.defenseBuff, monster: new Monster(add.health, null, add.stats ?? DEFAULT_STATS)
        }));
        this.chosen = main;
    }

    get hasAdds () { return this.adds.length > 0; }

    livingAdds () { return this.adds.filter((add) => !add.monster.dead); }

    livingAddMonsters () { return this.livingAdds().map((add) => add.monster); }

    //  The monster the auto click and the allies hit: the chosen one while it lives, else the main (also once the main is dead)
    get target ()
    {
        if (this.chosen.dead)
        {
            this.chosen = this.main;
        }

        return this.chosen;
    }

    //  Makes `monster` the target when it is the main or a living add of this fight; returns whether it did
    choose (monster)
    {
        if (monster !== this.main && !this.livingAdds().some((add) => add.monster === monster))
        {
            return false;
        }

        this.chosen = monster;

        return true;
    }

    addOf (monster) { return this.adds.find((add) => add.monster === monster) ?? null; }

    nameOf (monster) { return monster === this.main ? MAIN_NAME : (this.addOf(monster)?.name ?? null); }

    defenseBonus () { return this.livingAdds().reduce((sum, add) => sum + add.defenseBuff, 0); }

    //  The stats a hit on `monster` meets before the breaks: the main with its guarded defense, any other monster its own stats
    statsOf (monster)
    {
        if (monster !== this.main)
        {
            return monster.stats;
        }

        const bonus = this.defenseBonus();

        return bonus > 0 ? { ...monster.stats, defense: guardedDefense(defenseOf(monster.stats), bonus) } : monster.stats;
    }
}
```

**Steps**:

1. Write `fight.js` from the contract.
2. Write the tests below. Helpers: `const MAIN_STATS = { element: 'FIRE', defense: 49, critResistance: 20 }`; `const add = (health = 30, defenseBuff = 30) => ({ health, defenseBuff, stats: DEFAULT_STATS })`; `const kill = (monster) => monster.hit(monster.health)`.
3. Run the gate.

**Tests**: unit
**Test cases** (`fight.test.js`, exact names):

- `a fight without adds has no adds and targets its main monster`: `hasAdds` false, `adds` `[]`, `target` is the main.
- `the adds become monsters named Lacaio 1 and Lacaio 2 with their health, buff and stats and no drop rule`: two adds `add(1966080, 30)` → `adds[0]` `{ slot: 1, name: 'Lacaio 1', defenseBuff: 30 }`, `monster.maxHealth` 1966080, `monster.dropRuleId` null, `monster.stats` `DEFAULT_STATS`; `adds[1].slot` 2, `name` `Lacaio 2`.
- `the miniboss is the target when the fight starts`.
- `choosing a living add makes it the target`: `choose(adds[0].monster)` → true; `target` is that monster.
- `choosing the main makes it the target again`.
- `choosing the target again keeps it`: `choose(adds[0].monster)` twice → true, target unchanged.
- `choosing a dead add, a monster of another fight or null changes nothing and answers false`.
- `a dead target add hands the target back to the main`: choose add 1, `kill` it → `target` is the main.
- `the target stays the main monster when it is dead`: kill the main → `target` is the main.
- `defenseBonus sums the buffs of the living adds`: two adds of 30 → 60; one killed → 30; both → 0.
- `E1: the chapter 11 stage 1 miniboss defends 90, 79 and 49 with 2, 1 and 0 adds alive`: main `new Monster(3276800, 5, MAIN_STATS)`, adds `add(1966080, 30)` twice → `statsOf(main).defense` 90; kill add 1 → 79; kill add 2 → 49; `element` FIRE and `critResistance` 20 in each.
- `E2: the chapter 15 stage 1 miniboss defends 90 with one add of 50 alive and 61 with none`: main defense 61, adds of 50 → 90; kill add 1 → 90; kill add 2 → 61.
- `E3: two adds of 35 on defense 52 give 90, not 122`.
- `statsOf of the main without a living add is its own stats object`: `toBe(main.stats)` with no adds and after both adds died.
- `statsOf reads a legacy physicalDefense payload`: main stats `{ element: 'FIRE', physicalDefense: 49, magicalDefense: 49, critResistance: 0 }`, one add of 30 → `defense` 79.
- `statsOf of an add is the add's own stats`.
- `guardedDefense caps at 90 and keeps a defense without bonus`: `(49, 60)` 90, `(49, 30)` 79, `(49, 0)` 49, `(90, 0)` 90.
- `livingAddMonsters lists the living add monsters in slot order`.
- `nameOf names the main Miniboss and each add Lacaio n, and anything else null`.
- `addOf finds the add entry of a monster and null for the main`.
- `E4: a Base-1 hit on the guarded chapter 11 miniboss deals 0.1, 0.21 and 0.51`: `calculateDamage({ attacker: PLAYER, defender: monsterAfterBreak(fight.statsOf(main), null), random: () => 0.99 }).damage` is 0.1 with 2 adds, 0.21 with 1, 0.51 with none.
- `E5: Quebra de defesa 5 lowers the capped 90 to 85`: `monsterAfterBreak(fight.statsOf(main), [ { id: 'PHYSICAL_BREAK', baseId: 'PHYSICAL_BREAK', value: 5 } ]).defense` 85; the hit of E4 deals 0.15.
- `E6: Erosão Arcana lowers the capped 90 to 75`: `monsterAfterBreak(fight.statsOf(main), null, { defenseBreak: 15 }).defense` 75.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 23 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): keep the monsters and the target of a fight`

---

### T7: Carry the adds on every encounter [ ]

**Owner**: game-dev
**Goal**: Every encounter of the campaign and the farm carries `adds`: the stage's adds for a miniboss, `[]` for anything else (ADDS-02, ADDS-08, spec Adds AC 3, 9, Fight end AC 4).
**Where**: `game/src/domain/campaign/campaign.js`
**Also changes**: `game/src/domain/campaign/campaign.test.js`
**Read first**: `game/src/domain/campaign/campaign.js:26-55` (`farmEncounterOf`), `:92-142` (`encounter`), `game/src/domain/campaign/campaign.test.js:1-40` (helpers `at`, `definition`), `:92-97`, `:186-215`, `:250-282` (the five `toEqual` tests below), design § Game `campaign.js`
**Depends on**: T6
**Requirement**: ADDS-02, ADDS-08

**Contract**:

```js
import { addsOf } from '../combat/adds';

// farmEncounterOf: `let adds = [];` next to `let timeLimitMs;`; the MINIBOSS branch sets `adds = addsOf(stageDefinition);`;
//   the returned object becomes { kind: FARM, boss, phase: 1, health, stats, dropRuleId: null, timeLimitMs, label: farmLabel(boss), adds }
// Campaign.encounter(): the PHASE object gains `adds: []`, the MINIBOSS object `adds: addsOf(stage)`, the CHAPTER_BOSS object `adds: []`
// The header comment gains: "and each stage may carry adds: [{ health, defenseBuff }] (spec miniboss-adds)"
```

**Steps**:

1. Change `campaign.js` as above.
2. In `campaign.test.js`, add `adds: []` (and nothing else) to the expected object of exactly these five tests, which now fail because the encounter carries a new field: `a phase monster has the health of its stage, no time limit and the Stage/Phase label`, `a miniboss uses the health, stats and time limit of its stage and is labelled for the farm`, `the chapter boss uses the boss health, stats and time limit`, `farmEncounterOf builds a miniboss fight from the given definition`, `farmEncounterOf builds the chapter boss fight from the given definition`.
3. Add the cases below. Fixture: `const WATER = { element: 'WATER', defense: 0, critResistance: 0 }`; `const ADD = { health: 30, defenseBuff: 30 }`; `const withAdds = { ...definition, stages: definition.stages.map((stage) => (stage.number === 1 ? { ...stage, monster: WATER, adds: [ ADD, ADD ] } : stage)) }`; a campaign is `Campaign.fromProgress({ chapter: 11, stage: 1, encounter: MINIBOSS, phase: 1, completed: false, definition: withAdds })`.
4. Run the gate.

**Tests**: unit
**Test cases** (`campaign.test.js`, exact names):

- `a miniboss carries the adds of its stage with the phase monster stats`: `encounter().adds` equals `[ { health: 30, defenseBuff: 30, stats: WATER }, { health: 30, defenseBuff: 30, stats: WATER } ]`.
- `a miniboss of a stage without adds carries an empty list`: stage 2 miniboss → `adds` `[]`.
- `a phase monster and the chapter boss carry no adds even when the stage has some`: stage 1 PHASE → `[]`; CHAPTER_BOSS → `[]`.
- `a farmed miniboss carries the adds of its stage`: `campaign.farmEncounter({ kind: MINIBOSS, stage: 1 }).adds` and `farmEncounterOf(withAdds, { kind: MINIBOSS, stage: 1, chapter: 11 }).adds` both equal the two adds above.
- `a farmed chapter boss carries no adds`: `farmEncounterOf(withAdds, { kind: CHAPTER_BOSS }).adds` → `[]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 5 new cases pass, the five named tests pass with `adds: []` as their only change, and the whole Vitest suite passes.

**Commit**: `feat(game): carry the adds on every encounter`

---

### T8: Keep the skill effects of each monster apart [ ]

**Owner**: game-dev
**Goal**: `SkillCombat` keeps debuffs and damage over time per monster and follows the main monster of the fight, so a hit on an add never ends the miniboss's effects, the aimed shot or the Stun/Root stop (ADDS-07, spec Damage skills AC 8, 10).
**Where**: `game/src/domain/skills/skillCombat.js`
**Also changes**: `game/src/domain/skills/skillCombat.test.js`
**Read first**: `game/src/domain/skills/skillCombat.js` (whole), `game/src/domain/skills/skillCombat.test.js:1-60` (helpers `stats`, `never`, `monsterOf`, `combat`, `use`), design § Game `SkillCombat`
**Depends on**: T7
**Requirement**: ADDS-07

**Contract** - replace the state and methods below; every other line of the class stays. The victims are still the one `monster` here; T9 adds the adds.

```js
//  in the constructor, replacing `this.debuffs = [];`, `this.dots = [];` and `this.target = null;`:
//  Effects on each monster of the fight (spec miniboss-adds): Monster -> { debuffs, dots }. Debuffs: { id, label, remainingMs, seq,
//  factor, heroId, slot }; dots: { id, label, percent, attacker, stacks, maxStacks, remainingMs, untilTickMs, seq, heroId, slot }
this.marks = new Map();
//  The main monster of the fight: the miniboss of a fight with adds, else the one monster. The aimed shot and the Stun/Root stop
//  belong to the fight and end with it.
this.main = null;

//  Another main, a dead one or none ends every effect on every monster, the aimed shot and the stop; a dead add loses only its own
follow (main)
{
    if (main !== this.main || !main || main.dead)
    {
        this.marks.clear();
        this.cast = null;
        this.freezeMs = 0;
    }

    this.main = main && !main.dead ? main : null;

    for (const monster of [ ...this.marks.keys() ])
    {
        if (monster.dead)
        {
            this.marks.delete(monster);
        }
    }
}

//  The effects on `monster`, created empty on first use
marksOf (monster)
{
    if (!this.marks.has(monster))
    {
        this.marks.set(monster, { debuffs: [], dots: [] });
    }

    return this.marks.get(monster);
}

debuffsOf (monster) { return this.marks.get(monster)?.debuffs ?? []; }

dotsOf (monster) { return this.marks.get(monster)?.dots ?? []; }

//  Every debuff and damage over time of every monster, for the time cutting of `advance`
markedEffects () { return [ ...this.marks.values() ].flatMap(({ debuffs, dots }) => [ ...debuffs, ...dots ]); }

factors (monster = this.main) { return Object.fromEntries([ ...this.buffs, ...this.debuffsOf(monster) ].map((effect) => [ effect.id, effect.factor ?? 1 ])); }

debuffIds (monster = this.main) { return this.debuffsOf(monster).map((debuff) => debuff.id); }

//  startDot gains a first parameter `monster` and pushes to / restarts in this.marksOf(monster).dots instead of this.dots
startDot (monster, skill, attacker, owner = {}, factor = 1) { /* body of today with this.marksOf(monster).dots */ }

//  The player's buffs and the debuffs and damage over time of `focus` (the target), in start order
effectsWithOwner (focus = this.main)
{
    this.follow(this.main);

    return [ ...this.buffs, ...this.debuffsOf(focus), ...this.dotsOf(focus) ]
        .sort((a, b) => a.seq - b.seq)
        .map(/* unchanged */);
}

//  click and allyHit gain `main = monster`: follow(main); the hit uses debuffIds(monster), statsOf(monster), factors(monster)
click ({ attacker, monster, main = monster, boss, multiplier = 1, forceCritical = false }) { /* ... */ }
allyHit ({ attacker, monster, main = monster, boss }) { /* ... */ }

//  use(): `this.follow(monster)`; `const victims = [ monster ];` (T9 adds the adds); a debuff goes to this.marksOf(victim).debuffs for
//  each victim; each hit uses debuffIds(victim), statsOf(victim), factors(victim) and pushes the victim to `targets`; damage over time
//  starts with this.startDot(victim, ...) on each victim still alive; returns { used: true, hits, targets, countdown }.
//  NO_USE becomes { used: false, hits: [], targets: [], countdown: { extendMs: 0 } }

//  advance(ms, { monster = null, boss = false } = {}) returns { hits, targets }:
//    this.follow(monster); cooldowns and freezeMs as today; const victims = monster ? [ monster ] : [];
//    while (left > 0 && (this.buffs.length || this.markedEffects().length || this.cast)):
//      const running = [ ...this.buffs, ...this.markedEffects() ];
//      const dots = [ ...this.marks.values() ].flatMap((mark) => mark.dots);
//      step = Math.min(left, ...running.map((e) => e.remainingMs), ...dots.map((d) => d.untilTickMs), ...(this.cast ? [ this.cast.remainingMs ] : []))
//      cast.remainingMs -= step; every running effect remainingMs -= step; every dot untilTickMs -= step
//      for each victim in order, for each dot of this.dotsOf(victim): if dot.untilTickMs <= 0 && !victim.dead && !monster.dead:
//        dot.untilTickMs = TICK_MS; hits.push(this.tickHit(dot, victim, boss)); targets.push(victim)
//      if the cast ended: when monster && !monster.dead, const landed = this.landCast(victims, boss) and push its hits and targets;
//        else this.cast = null
//      expire buffs; for every mark: mark.debuffs and mark.dots keep remainingMs > 0
//      left -= step; this.follow(monster)

//  landCast(victims, boss) -> { hits, targets }: takes skill, attacker and factor from this.cast, sets this.cast = null, then for each
//  victim that is not dead lands hitDamage({ ..., forceCritical: true, debuffs: this.debuffIds(victim), defender: this.statsOf(victim),
//  factors: this.factors(victim) }) on it
//  tickHit(dot, monster, boss): debuffIds(monster) and factors(monster)
```

**Steps**:

1. Change the constructor, `follow`, the new helpers, `factors`, `debuffIds`, `startDot`, `effectsWithOwner`, `click`, `allyHit`, `use`, `advance`, `landCast` and `tickHit` as above. Nothing in the class keeps a reference to `this.debuffs`, `this.dots` or `this.target`.
2. Add `describe('effects per monster', ...)` with the cases below. Helpers: `const main = monsterOf(1000, stats('FIRE', 40))`, `const other = monsterOf(100, stats('FIRE', 40))`; `use(skills, main, heroId, slot, extra)` as the file defines it.
3. Run the gate: every existing case of `skillCombat.test.js` (105 cases) must pass unchanged.

**Tests**: unit
**Test cases** (`skillCombat.test.js`, `describe('effects per monster')`, exact names):

- `a click on another monster of the fight keeps the debuffs of the main`: Brado (kael 3) on `main`; `skills.click({ attacker: PLAYER, monster: other, main, boss: false })`; `skills.effects()` equals `[ { label: 'Brado Aterrador', seconds: 10 } ]`.
- `a click on another monster meets that monster's own debuffs`: Brado on `main`; the click on `other` deals 0.6 (defense 40, no Brado); a click on `main` deals 0.9 (40 - 30 = 10).
- `an ally hit on another monster keeps the effects of the main`: Brado on `main`; `allyHit({ attacker: PLAYER, monster: other, main, boss: false })` deals 0.6; `effects()` still has Brado.
- `a click on a monster of another fight ends every effect on the old one`: Brado on `main`; `skills.click({ attacker: PLAYER, monster: other, boss: false })` (no `main`) → `effects()` `[]`.
- `effectsWithOwner of a monster without effects shows only the player's buffs`: Ventos (lyra 3) and Brado on `main`; `effectsWithOwner(other).map((e) => e.label)` `[ 'Ventos Ligeiros' ]`; `effectsWithOwner(main)` has both.
- `the Stun of the main survives a click on another monster`: `use(skills, main, 'kael', 2, { boss: true })`; click on `other` with `main`; `skills.countdownMs(1000)` 0.
- `the aimed shot keeps flying while the player clicks another monster`: Lyra 2 on `main`; click on `other` with `main`; `skills.advance(2000, { monster: main }).hits` `[ { damage: 36, critical: true } ]` (3000 % x 2 critical x (1 - 0.4)) and `targets` `[ main ]`.
- `use returns the monster each hit landed on`: Corte (kael 1) on `main` → `targets` `[ main ]`; a refused use (cooling) → `{ used: false, hits: [], targets: [], countdown: { extendMs: 0 } }`.
- `advance returns the monster each tick landed on`: Tempestade (orina 2) on `main`; `advance(1000, { monster: main })` → `targets` `[ main ]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 9 cases pass, every existing `skillCombat.test.js` case passes unchanged, and the whole Vitest suite passes.

**Commit**: `feat(game): keep the skill effects of each monster apart`

---

### T9: Land skills, ticks and the aimed shot on every living monster [ ]

**Owner**: game-dev
**Goal**: `use` and `advance` take the living adds and land every damage skill, debuff, tick and aimed shot on each monster in the order adds then main (ADDS-06, ADDS-07, spec Damage skills AC 1 to 8, Adds AC 7, Edge Cases).
**Where**: `game/src/domain/skills/skillCombat.js`
**Also changes**: `game/src/domain/skills/skillCombat.test.js`
**Read first**: `game/src/domain/skills/skillCombat.js` after T8 (`use`, `advance`, `landCast`), `game/src/domain/skills/skillCatalog.js` (percents), `game/src/domain/combat/fight.js` (T6), spec § Target and Skill Rules, design § Game `SkillCombat`
**Depends on**: T8
**Requirement**: ADDS-06, ADDS-07

**Contract**:

```js
//  use({ heroId, slot, unlocked, level = 1, attacker, monster, adds = [], boss }): `adds` are the living add monsters of the fight
//  in slot order (spec miniboss-adds); the skill lands on each add, then on the main `monster`, all hits of one monster before the next
//    const victims = [ ...adds.filter((add) => add && add !== monster && !add.dead), monster ];
//  every hit loop: `for (const victim of victims) { for (const { percent, armorPierce } of skill.hits) { if (victim.dead) break; ... } }`

//  advance(ms, { monster = null, adds = [], boss = false } = {}):
//    const victims = monster ? [ ...adds.filter((add) => add && add !== monster && !add.dead), monster ] : [];
//  (everything else of T8 stays: the dots of each victim tick in victim order, the cast lands on every living victim)
```

The domain cases use `PLAYER` (FIRE, base 1, critical 10 %, multiplier 2) and FIRE monsters, so the element multiplier is 1. A guarded main uses `new SkillCombat({ random, statsOf: (m) => fight.statsOf(m) })` with `fight = new Fight(main, [ { health, defenseBuff, stats: DEFAULT_STATS }, ... ])` and passes `adds: fight.livingAddMonsters()`. Helper: `const rolls = (...values) => { let i = 0; return () => values[i++ % values.length]; }`.

**Steps**:

1. Add `adds` to `use` and `advance` as above.
2. Add `describe('skills on every monster', ...)` with the cases below; `a1`, `a2` are `monsterOf(1000)` unless the case says otherwise and `main` is `monsterOf(1000)`.
3. Run the gate.

**Tests**: unit
**Test cases** (`skillCombat.test.js`, exact names):

- `Chuva de Meteoros hits Lacaio 1, Lacaio 2 and the miniboss in that order for 25 each`: `use(skills, main, 'orina', 3, { adds: [ a1, a2 ] })` → `hits` `[ 25, 25, 25 ]` (no critical), `targets` `[ a1, a2, main ]`, each health 975.
- `Corte Dimensional, Investida do Baluarte, Luz Divina and Golpe Sangrento land one hit on each living monster`: 3 hits each: Corte 15, Investida 4, Luz Divina 8, Golpe Sangrento 6.
- `a skill skips a dead add`: `a1` killed first → Chuva `targets` `[ a2, main ]`.
- `E7: Chuva kills both guarding adds first and meets the miniboss unguarded: 25, 25 and 12.75`: main `new Monster(1000, null, { element: 'FIRE', defense: 49, critResistance: 0 })`, adds of 20 health and +30 → `hits` damages 25, 25, 12.75; main health 987.25.
- `E8: Chuva on a guarded miniboss whose adds survive deals 2.5 to it`: adds of 1000 health and +30 → 25, 25, 2.5.
- `E9: Brado Aterrador level 1 on the guarded chapter 11 miniboss: a click deals 0.4`: main defense 49, adds of 30 health and +30; `use(..., 'kael', 3, { adds })`; `skills.click({ attacker: PLAYER, monster: main, main, boss: false }).damage` 0.4.
- `Brado Aterrador and Prisão de Espinhos go on every living monster`: Brado with `adds: [ a1, a2 ]` → `effectsWithOwner(a1)` and `effectsWithOwner(a2)` hold `Brado Aterrador`; in a new combat, Prisão (orina 1) with adds → a click on `a1` with `main` deals 1.25.
- `Flecha Dupla shoots two arrows at each monster: six hits of 3`: `targets` `[ a1, a1, a2, a2, main, main ]`.
- `each arrow of Flecha Dupla rolls its own critical`: `combat(rolls(0, 0.99, 0.99, 0, 0.99, 0.99))` → criticals `[ true, false, false, true, false, false ]`, damages `[ 6, 3, 3, 6, 3, 3 ]`.
- `a first arrow that kills an add stops its second arrow`: `a1 = monsterOf(2)` → 5 hits, `targets` `[ a1, a2, a2, main, main ]`.
- `Tiro Preciso lands a critical 60 on every monster alive at the end of the cast`: lyra 2 with adds; `advance(2000, { monster: main, adds: [ a1, a2 ] })` → `hits` three `{ damage: 60, critical: true }`, `targets` `[ a1, a2, main ]`.
- `Tiro Preciso skips an add that died during the cast`: kill `a1` after the use → 2 hits, `targets` `[ a2, main ]`.
- `Tiro Preciso is lost when the miniboss dies during the cast`: kill `main` after the use → `advance(2000, ...)` `hits` `[]`.
- `Tempestade Arcana ticks 2 on each monster every second`: `advance(1000, { monster: main, adds })` → `[ 2, 2, 2 ]`, `targets` `[ a1, a2, main ]`; six `advance(1000)` give 6 ticks per monster, a seventh none.
- `Tempestade stops on an add that dies and keeps ticking on the others`: after the first tick kill `a1` → next `advance(1000)` → `[ 2, 2 ]`, `targets` `[ a2, main ]`.
- `a tick that kills both adds drops their buff for the miniboss tick of the same second`: guarded main defense 49, adds of 2 health and +30; Tempestade; `advance(1000)` → damages 2, 2, 1.02.
- `Bomba de Veneno adds one stack to every living monster`: vex 1 with adds → `effectsWithOwner(a1)` label `Bomba de Veneno x1`; `advance(1000)` → `[ 1, 1, 1 ]`.
- `Golpe Sangrento starts a Bleed on every monster it hit`: vex 3 → hits `[ 6, 6, 6 ]`; `advance(1000)` → `[ 1.5, 1.5, 1.5 ]`.
- `Golpe Sangrento starts no Bleed on an add it killed`: `a1 = monsterOf(6)` → after the use `a1` is dead; `advance(1000)` → `[ 1.5, 1.5 ]`, `targets` `[ a2, main ]`.
- `a dead add loses only its own effects`: Brado with adds; kill `a1`; `advance(1, { monster: main, adds: [ a2 ] })`; `effectsWithOwner(a1)` has no Brado; `effectsWithOwner(main)` and `effectsWithOwner(a2)` have it.
- `the Stun of Investida stops the countdown once in a fight with adds`: `use(skills, main, 'kael', 2, { adds: [ a1, a2 ], boss: true })` → `countdownMs(1000)` 0; after `advance(3000, { monster: main, adds: [ a1, a2 ], boss: true })`, `countdownMs(1000)` 1000.
- `a skill with no adds lands on the one monster as before`: Chuva without `adds` → `hits` `[ 25 ]`, `targets` `[ main ]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 22 cases pass, every existing `skillCombat.test.js` case passes unchanged, and the whole Vitest suite passes.

**Commit**: `feat(game): land every damage skill on every living monster`

---

### T10: Spawn the adds and guard the miniboss in the combat scene [ ]

**Owner**: game-dev
**Goal**: The scene builds a `Fight` per encounter, draws the adds, the marker and the target chip at the places of the Fight Layout, makes every hit meet the guarded defense, fades a dead add and removes every add when the fight ends (ADDS-02, ADDS-03, ADDS-05, ADDS-08, spec Adds AC 3 to 6, 8, 9, Target AC 7 to 9, Fight end AC 1 to 4, 6).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`, `game/public/style.css`
**Read first**: `game/src/adapters/phaser/ClickerGame.js:42-45` (`MONSTER`, `HEALTH_BAR`, `DEATH`), `:74`, `:93` (`ENEMY_STATS`, `ENEMY_STATS_HTML`), `:135-232` (`create`), `:806-878` (`showEncounter`, `refreshEnemyStats`, `showEnemyStats`, `clearEnemyStats`), `:880-892` (`completeChapter`), `:1125-1134` (`bossTimedOut`), `:1296-1312` (`afterDamage`), `:1509-1532` (`updateHealthBar`, `fadeOutMonster`); `game/src/adapters/phaser/ClickerGame.test.js:47-216` (fixtures, `createScene`), `:1123-1140` (`killAll`, `advance` of `describe('ClickerGame stages')`); `game/public/style.css:527-551` (`.hud-enemy`, `.weak-chip`); spec § Fight Layout, § Player-Facing Texts; design § Game `ClickerGame`
**Depends on**: T9
**Requirement**: ADDS-02, ADDS-03, ADDS-05, ADDS-08

**Contract**:

```js
import { Fight } from '../../domain/combat/fight';

// constants, after DEATH
//  The adds of a miniboss (spec miniboss-adds, Q38): half the miniboss size, in a column between the formation (x 410 or less) and the
//  miniboss (x 560 or more); each with a small health bar 10 px above it and its buff above the bar
const ADD_SIZE = { width: 110, height: 125 };
const ADD_BOXES = { 1: { x: 480, y: 360 }, 2: { x: 480, y: 540 } };
const ADD_BAR = { width: 100, height: 8, gap: 10 };
const ADD_BUFF_FONT = { fontFamily: 'Figtree', fontStyle: '700', fontSize: 12, color: '#ffffff', stroke: '#2a1408', strokeThickness: 3 };
const ADD_BUFF_GAP = 3;
//  The gold triangle over the target (Q25): its tip 6 px above the miniboss's bar, or 21 px above an add's bar (clear of the buff text);
//  drawn under the damage numbers
const TARGET_MARKER = { width: 16, height: 10, color: 0xffd24a, depth: 0.9, gap: 6, addGap: 21 };
//  The light-blue ally number on an add stands right of its centre
const ADD_ALLY_TEXT_OFFSET = 40;
// ENEMY_STATS_HTML becomes
//   '<div class="hud-box hud-enemy"><div class="target-chip" data-testid="target-chip"></div><div class="weak-chip" data-testid="weak-chip"></div><div class="enemy-stats"></div></div>'

// create():
//   statsOf of SkillCombat: (monster) => monsterAfterBreak(this.statsFor(monster), this.talents.talents(), this.passives())
//   next to `this.monster = null;`: this.fight = null; this.addParts = new Map(); this.marker = null;
//   after `const barY = ...`: this.healthBarTop = barY;
//   after `this.weakChip = ...`: this.targetChip = this.enemyStats.parentElement.querySelector('.target-chip');

//  The stats a hit on `monster` meets before the breaks: the guarded defense of the main of an adds fight (spec miniboss-adds)
statsFor (monster) { return this.fight ? this.fight.statsOf(monster) : monster.stats; }

//  The monster the auto click and the allies hit: the target of the fight, the one monster otherwise
currentTarget () { return this.fight?.target ?? this.monster; }

livingAddMonsters () { return this.fight ? this.fight.livingAddMonsters() : []; }

addBarTop (slot) { return ADD_BOXES[slot].y - ADD_SIZE.height / 2 - ADD_BAR.gap - ADD_BAR.height; }

//  showEncounter(encounter), right after `this.monster = new Monster(...)` and before `this.updateHealthBar()`:
//      this.clearAdds();
//      this.fight = new Fight(this.monster, encounter.adds ?? []);
//      this.showAdds();
//  and the two lines `this.monsterStats = encounter.stats;` and `this.showEnemyStats(monsterAfterBreak(encounter.stats, ...))` become
//      this.refreshEnemyStats();

//  The body, bar, fill and buff text of every add, and the marker over the main; nothing for a fight without adds
showAdds ()
{
    // for each add of this.fight.adds:
    //   const box = ADD_BOXES[add.slot]; const barTop = this.addBarTop(add.slot);
    //   body  = this.add.rectangle(box.x, box.y, ADD_SIZE.width, ADD_SIZE.height, MONSTER.color, MONSTER.fillAlpha)
    //   back  = this.add.rectangle(box.x - ADD_BAR.width / 2, barTop, ADD_BAR.width, ADD_BAR.height, HEALTH_BAR.backColor).setOrigin(0, 0)
    //   fill  = this.add.rectangle(box.x - ADD_BAR.width / 2, barTop, ADD_BAR.width, ADD_BAR.height, HEALTH_BAR.fillColor).setOrigin(0, 0)
    //   label = this.add.text(box.x, barTop - ADD_BUFF_GAP, `+${add.defenseBuff} de defesa`, ADD_BUFF_FONT).setOrigin(0.5, 1)
    //   this.addParts.set(add.slot, { body, back, fill, label })
    // if this.fight.hasAdds:
    //   this.marker = this.add.triangle(0, 0, 0, 0, TARGET_MARKER.width, 0, TARGET_MARKER.width / 2, TARGET_MARKER.height, TARGET_MARKER.color)
    //       .setDepth(TARGET_MARKER.depth);
    //   this.placeMarker();
}

//  The marker stands over the target: a Phaser triangle is centred on its 16 x 10 box, so its centre is 5 px above the tip
placeMarker ()
{
    // if (!this.marker) return;
    // const add = this.fight.addOf(this.currentTarget());
    // const tipX = add ? ADD_BOXES[add.slot].x : MONSTER.x;
    // const tipY = add ? this.addBarTop(add.slot) - TARGET_MARKER.addGap : this.healthBarTop - TARGET_MARKER.gap;
    // this.marker.setPosition(tipX, tipY - TARGET_MARKER.height / 2);
}

//  Every add part and the marker go at once (a new encounter, a timeout, the chapter end)
clearAdds ()
{
    // for every parts of this.addParts: this.tweens.killTweensOf(each of body, back, fill, label) and destroy() each; this.addParts.clear()
    // if this.marker: this.tweens.killTweensOf(this.marker); this.marker.destroy(); this.marker = null
    // this.fight = null; this.targetChip.textContent = ''
}

//  The adds still standing fade out with the dead miniboss, then go (500 ms); nothing for a fight without adds
fadeOutAdds ()
{
    // const parts = [ ...this.addParts.values() ].flatMap(({ body, back, fill, label }) => [ body, back, fill, label ]);
    // if (this.marker) parts.push(this.marker);
    // this.addParts.clear(); this.marker = null;
    // if (parts.length === 0) return;
    // this.tweens.add({ targets: parts, alpha: 0, duration: DEATH.fadeDuration, onComplete: () => parts.forEach((part) => part.destroy()) });
}

//  An add that died since the last hit fades out (500 ms) and goes; the marker and the enemy line follow the new target and defense
settleAdds ()
{
    // if (!this.fight || !this.monster || this.monster.dead) return;
    // let died = false;
    // this.fight.adds.forEach((add) => {
    //   const parts = this.addParts.get(add.slot);
    //   if (!add.monster.dead || !parts) return;
    //   this.addParts.delete(add.slot); died = true;
    //   const list = [ parts.body, parts.back, parts.fill, parts.label ];
    //   this.tweens.add({ targets: list, alpha: 0, duration: DEATH.fadeDuration, onComplete: () => list.forEach((part) => part.destroy()) });
    // });
    // if (died) { this.placeMarker(); this.refreshEnemyStats(); }
}

updateAddBars ()
{
    // for each add of this.fight?.adds ?? []: const parts = this.addParts.get(add.slot); if parts:
    //   parts.fill.setSize(ADD_BAR.width * add.monster.health / add.monster.maxHealth, ADD_BAR.height)
}

//  "Alvo: Lacaio 1 · HP 2M/2M" while an adds fight runs; empty otherwise (spec miniboss-adds, Q49)
showTargetChip ()
{
    // const target = this.currentTarget();
    // this.targetChip.textContent = this.fight?.hasAdds && target ? `Alvo: ${this.fight.nameOf(target)} · ${healthText(target)}` : '';
}

// refreshEnemyStats() becomes
//     if (this.monster && !this.monster.dead && this.fight)
//     {
//         this.showEnemyStats(monsterAfterBreak(this.fight.statsOf(this.currentTarget()), this.talents.talents(), this.passives()));
//         this.showTargetChip();
//     }
// clearEnemyStats() also sets this.targetChip.textContent = ''
// updateHealthBar() keeps its two lines and adds: this.updateAddBars(); this.showTargetChip();
// bossTimedOut(): after `this.monster = null;` add `this.clearAdds();`
// completeChapter(): after `this.monster = null;` add `this.clearAdds();`
// afterDamage() becomes
//     this.updateHealthBar();
//     if (this.monster.dead)
//     {
//         this.clearEnemyStats();
//         //  The adds still standing fade out with the miniboss; their tween goes first, so the miniboss fade stays the last one
//         this.fadeOutAdds();
//         if (!this.farmBoss) { this.dropCoins(); }
//         this.fadeOutMonster(this.clearEncounter());
//         return;
//     }
//     this.settleAdds();
```

CSS, in `style.css` right after `.weak-chip:empty`:

```css
/* "Alvo: Lacaio 1 · HP 2M/2M": the target of a miniboss fight with adds, first row of the enemy box (spec miniboss-adds, Q49) */
.target-chip {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    white-space: pre;
    color: var(--parchment-100);
    border-radius: 999px;
    background: var(--chip-bg);
    border: 1px solid var(--gold-400);
}

.target-chip:empty {
    display: none;
}
```

Test harness changes in `createScene` (`ClickerGame.test.js`): the fake `rectangle` gains `destroy: vi.fn()` and `setDepth`; the fake `text` gains `setOrigin = (ox, oy) => { obj.originX = ox; obj.originY = oy; return obj; }` (it returns `obj` as today); a new `triangle: vi.fn((x, y, x1, y1, x2, y2, x3, y3, color) => { const tri = { x, y, points: [ x1, y1, x2, y2, x3, y3 ], color, alpha: 1, destroy: vi.fn() }; tri.setDepth = (d) => { tri.depth = d; return tri; }; tri.setPosition = (px, py) => { tri.x = px; tri.y = py; return tri; }; tri.setAlpha = (a) => { tri.alpha = a; return tri; }; triangles.push(tri); return tri; })`; `createScene` returns `triangles`. Existing cases must keep passing (no add part is created for an encounter without adds, so `rectangles` stays 3 at start).

Fixtures (top of the new describe): `const ADD = { health: 30, defenseBuff: 30 }`; `const addsDefinition = ({ adds = [ ADD, ADD ], miniboss = { element: 'FIRE', defense: 49, critResistance: 0 }, minibossHealth = 100 } = {}) => ({ ...definition, stages: definition.stages.map((stage) => (stage.number === 1 ? { ...stage, minibossHealth, miniboss, monster: { element: 'FIRE', defense: 0, critResistance: 0 }, adds } : stage)) })`; `const addsStart = (options) => ({ ...progress(1, 'MINIBOSS', 1), chapter: 11, definition: addsDefinition(options) })`. Every case creates the scene with `createScene({ start: addsStart(...), talents: [], autoClickOn: false })` unless it says otherwise, then `await flush()`. Helpers: `const killAdd = (ctx, slot) => { const { monster } = ctx.scene.fight.adds[slot - 1]; monster.hit(monster.health); ctx.scene.afterDamage(); }`; `const onMiniboss = { x: 670, y: 440 }`.

**Steps**:

1. Add the import, constants, state and methods; change `create`, `showEncounter`, `refreshEnemyStats`, `clearEnemyStats`, `updateHealthBar`, `afterDamage`, `bossTimedOut`, `completeChapter` and `ENEMY_STATS_HTML` as above. The encounter already carries its adds (T7), so the scene does not import `addsOf`.
2. Add the CSS.
3. Extend the harness, add the fixtures and the cases below in `describe('ClickerGame miniboss adds')`.
4. Run the gate.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, exact names):

- `a miniboss with two adds draws two add bodies of 110 x 125 at (480, 360) and (480, 540)`: `byColor(0xf5ead8)` has 3 entries; entries 1 and 2 have `x` 480, `y` 360 and 540, `width` 110, `height` 125.
- `each add has a 100 x 8 bar with its top-left at (430, 279.5) and (430, 459.5)`: `byColor(0x2a1410)[1]` and `[2]`, `byColor(0xc0392b)[1]` and `[2]`: `originX` 0, `originY` 0, `x` 430, `y` 279.5 and 459.5, `width` 100, `height` 8.
- `each add shows +30 de defesa at (480, 276.5) and (480, 456.5) in Figtree 700 12 px white with a dark outline`: two `texts` with `text` `+30 de defesa`, `x` 480, `y` 276.5 and 456.5, origin (0.5, 1), `style` `{ fontFamily: 'Figtree', fontStyle: '700', fontSize: 12, color: '#ffffff', stroke: '#2a1408', strokeThickness: 3 }`.
- `the add monsters have 30 health and no drop rule`: `scene.fight.adds[0].monster.maxHealth` 30, `dropRuleId` null; names `Lacaio 1`, `Lacaio 2`.
- `a phase monster, a miniboss without adds and the chapter boss draw no add`: `progress(1, 'PHASE', 1)`, `progress(1, 'MINIBOSS', 1)` and `progress(10, 'CHAPTER_BOSS', 1)` of the default definition: `byColor(0xf5ead8)` 1 entry, `rectangles` 3, `triangles` 0, `.target-chip` text `''`.
- `the enemy line of the guarded miniboss reads Defesa 90%`: `.enemy-stats` text `Fire  Defesa 90%  Crit res 0%`.
- `a click on the guarded miniboss deals 0.1, then 0.21 after one add died and 0.51 after both`: `click(onMiniboss)` → `monster.health` 99.9; `killAdd(ctx, 1)`; click → 99.69; `killAdd(ctx, 2)`; click → 99.18.
- `an add death changes the enemy line to Defesa 79%`.
- `an add death fades its body, bar, fill and text over 500 ms and destroys them`: after `killAdd(ctx, 1)` the last tween has `targets` `[ body, back, fill, label ]` of slot 1, `alpha` 0, `duration` 500; after its `onComplete()` each part's `destroy` was called; `scene.addParts.has(1)` false; `scene.addParts.has(2)` true.
- `an add death drops no coin and sends no report`: `walletResponse()` loaded; `killAdd(ctx, 1)` → `sprites` length unchanged, `campaignGateway.report` not called.
- `the target chip reads Alvo: Miniboss · HP 100/100 and follows its HP`: chip `Alvo: Miniboss · HP 100/100`; after `click(onMiniboss)` `Alvo: Miniboss · HP 99.9/100`.
- `the marker is a gold 16 x 10 triangle with its tip at (670, 275), depth 0.9`: `triangles[0]`: `color` 0xffd24a, `points` `[ 0, 0, 16, 0, 8, 10 ]`, `x` 670, `y` 270, `depth` 0.9.
- `the marker and the chip stay on the miniboss after both adds died`: `killAdd` 1 and 2 → `triangles[0]` at (670, 270) and not destroyed; chip `Alvo: Miniboss · HP 100/100`.
- `the add bars follow the add health`: `scene.fight.adds[0].monster.hit(15)`, `scene.updateHealthBar()` → slot 1 fill `width` 50.
- `the miniboss's death fades the living adds before the miniboss and wins once`: `minibossHealth: 0.1`, `click(onMiniboss)` kills it; the tween with `targets` holding every add part and the marker comes before the tween whose `targets` is `scene.monsterParts`; `campaignGateway.report` called once with `outcome` `CLEARED`; after that add tween's `onComplete()` every add part and the marker were destroyed.
- `the countdown removes every add at once and reports FAILED`: `scene.update(0, 30000)` → every add part and the marker destroyed, chip `''`, `scene.fight` null; `await ctx.loops[0].callback(); await flush();` → `campaignGateway.report` called once with `outcome` `FAILED`.
- `leaving the fight from the pause menu removes every add at once`: `scene.pauseFight(); scene.leaveFight();` → every add part destroyed, `scene.fight` null.
- `a realignment removes the old adds at once and draws the new adds`: `scene.realign(scene.session.encounter())` → the first four parts of slot 1 destroyed; `byColor(0xf5ead8)` now 5 entries (2 new bodies).
- `a farm fight of the chapter 11 miniboss draws its adds`: `scene.startFarm({ kind: 'MINIBOSS', stage: 1 })` → `scene.fight.adds` length 2, new bodies at (480, 360) and (480, 540).
- `a stage with an invalid add spawns only the valid one`: `adds: [ { health: 0, defenseBuff: 30 }, ADD ]` → `scene.fight.adds` length 1, named `Lacaio 1`, body at (480, 360).
- `a hit on an add meets its own defense, not the guard`: `scene.skills.click({ attacker: scene.leaderAttacker(), monster: scene.fight.adds[0].monster, main: scene.monster, boss: true })` deals 1 (add health 29).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 21 cases pass, every existing `ClickerGame` case passes unchanged, and the whole Vitest suite passes.

**Commit**: `feat(game): spawn the miniboss adds and guard the miniboss`

---

### T11: Let the player pick the target [ ]

**Owner**: game-dev
**Goal**: A click on a monster hits it and makes it the target, a click on no monster hits the target, the auto click and the allies hit the target, and the numbers stand at the monster they landed on (ADDS-04, ADDS-05, spec Target AC 1 to 7, 10, 11, Edge Cases).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `game/src/adapters/phaser/ClickerGame.js` after T10: `autoClickFrame` (`:518`), `allyFrame` (`:1044`), `hitMonster` (`:1248`), `strike` (`:1259`), `damageTextX` (`:1535`), `showDamage` (`:1543`); `game/src/domain/combat/allyCombat.js` (whole); `ClickerGame.test.js` fixtures `teamHeroes`, `heroEntry` (`:66-80`) and the T10 fixtures; spec § Target and Skill Rules, § Fight Layout
**Depends on**: T10
**Requirement**: ADDS-04, ADDS-05

**Contract**:

```js
//  The living add whose body holds the pointer, or null
addAt (pointer)
{
    return this.fight?.livingAdds().find(({ slot }) =>
        Math.abs(pointer.x - ADD_BOXES[slot].x) <= ADD_SIZE.width / 2 && Math.abs(pointer.y - ADD_BOXES[slot].y) <= ADD_SIZE.height / 2) ?? null;
}

onMiniboss (pointer) { return Math.abs(pointer.x - MONSTER.x) <= MONSTER.width / 2 && Math.abs(pointer.y - MONSTER.y) <= MONSTER.height / 2; }

//  Makes `monster` the target; the marker and the enemy line follow only when the target changed
chooseTarget (monster)
{
    const before = this.currentTarget();

    if (this.fight?.choose(monster) && monster !== before)
    {
        this.placeMarker();
        this.refreshEnemyStats();
    }
}

//  Where the numbers of a hit on `monster` stand (spec miniboss-adds, Fight Layout)
centreXOf (monster) { const add = this.fight?.addOf(monster); return add ? ADD_BOXES[add.slot].x : MONSTER.x; }
numberYOf (monster) { const add = this.fight?.addOf(monster); return add ? ADD_BOXES[add.slot].y : this.damageTextY; }
allyNumberXOf (monster) { const add = this.fight?.addOf(monster); return add ? ADD_BOXES[add.slot].x + ADD_ALLY_TEXT_OFFSET : MONSTER.x + ALLY_TEXT_OFFSET; }

//  hitMonster(pointer): after the existing early return
//      const add = this.addAt(pointer);
//      if (add) { this.chooseTarget(add.monster); this.strike(pointer.x, add.monster); return; }
//      if (this.onMiniboss(pointer)) { this.chooseTarget(this.monster); this.strike(pointer.x, this.monster); return; }
//      //  A click on no monster hits the target (spec miniboss-adds, Q51)
//      const target = this.currentTarget();
//      this.strike(this.centreXOf(target), target);

//  strike(x, monster = this.currentTarget()): every `this.monster` inside the click loop becomes `monster`; the click is
//      this.skills.click({ attacker: this.leaderAttacker(), monster, main: this.monster, boss: this.countdown !== null, multiplier, forceCritical: hits === 2 })
//  and its number: this.showDamage(formatDamage(damage), x + hit * DOUBLE_HIT_OFFSET, critical, null, this.numberYOf(monster));
//  `this.showCombo(); this.afterDamage();` stay

//  showDamage(damage, x, critical = false, style = null, y = this.damageTextY): the text is created at (x, y)

//  autoClickFrame: the loop body becomes
//      const target = this.currentTarget();
//      this.strike(this.centreXOf(target), target);

//  allyFrame(delta):
//      const landed = [];
//      const { ticks } = this.allies.advance(delta, {
//          monster,
//          allies: this.allyAttackers(),
//          //  Each ally hit asks for the target right before it lands (hero-team seam, spec miniboss-adds)
//          target: () => this.currentTarget(),
//          hit: (attacker, target) =>
//          {
//              const { damage } = this.skills.allyHit({ attacker, monster: target, main: this.monster, boss });
//              landed.push({ target, damage });
//              return damage;
//          }
//      });
//      let next = 0;
//      ticks.forEach(({ slots }) =>
//      {
//          //  One number per monster the tick hit, with the sum of its hits there, in the order the monsters were first hit
//          const sums = new Map();
//          landed.slice(next, next + slots.length).forEach(({ target, damage }) => sums.set(target, (sums.get(target) ?? 0) + damage));
//          next += slots.length;
//          sums.forEach((damage, target) => this.showDamage(formatDamage(damage), this.allyNumberXOf(target), false, ALLY_TEXT, this.numberYOf(target)));
//          this.onAllyTick(slots);
//      });
//      return ticks.length;
```

`damageTextX` stays as it is. Fixtures as in T10; an ally case uses `createScene({ start: addsStart(), heroes: teamHeroes([ 'lyra', null, null, null ]), talents: [], autoClickOn: false })`. Constants: `const lacaio1 = { x: 480, y: 360 }`, `const lacaio2 = { x: 480, y: 540 }`.

**Steps**:

1. Add `addAt`, `onMiniboss`, `chooseTarget`, `centreXOf`, `numberYOf`, `allyNumberXOf`; change `hitMonster`, `strike`, `showDamage`, `autoClickFrame` and `allyFrame` as above.
2. Add the cases below in `describe('ClickerGame miniboss target')`.
3. Run the gate.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, exact names):

- `a click on Lacaio 1 hits it for 1 and makes it the target`: `click(lacaio1)` → add 1 health 29, `scene.fight.target` is its monster, chip `Alvo: Lacaio 1 · HP 29/30`, `.enemy-stats` `Fire  Defesa 0%  Crit res 0%`.
- `a click on an add shows its number where it landed, at y 360`: `click({ x: 500, y: 380 })` → last text `1` at `x` 500, `y` 360.
- `a click on Lacaio 2 shows its number at y 540 and makes it the target`.
- `the marker moves over Lacaio 1 and Lacaio 2`: after `click(lacaio1)` `triangles[0]` at (480, 253.5); after `click(lacaio2)` at (480, 433.5).
- `a click on the miniboss makes it the target again`: `click(lacaio1)`, then `click({ x: 670, y: 440 })` → target is `scene.monster`, marker (670, 270), main health 99.9.
- `a click on the target again keeps it`: `click(lacaio1)` twice → target add 1, health 28.
- `a click on no monster hits the target with its number at the target's centre x`: `click(lacaio1)`; `click({ x: 100, y: 100 })` → add 1 health 28, last text `x` 480, `y` 360.
- `a click where a dead add stood hits the target`: `killAdd(ctx, 1)` (target back to the main); `click(lacaio1)` → main health 99.79 (79 defense), add 2 untouched.
- `the target goes back to the miniboss when the target add dies`: `click(lacaio1)`; `killAdd(ctx, 1)` → target is `scene.monster`, marker (670, 270), chip `Alvo: Miniboss · HP 100/100`.
- `the auto click hits the target add at its centre x`: `autoClickOn: true`; `click(lacaio1)` (29); `scene.update(0, 500)` → 28; last text `x` 480, `y` 360.
- `an auto click burst that kills the target add moves on to the miniboss`: `adds: [ { health: 2, defenseBuff: 30 }, ADD ]`, `autoClickOn: true`; `click(lacaio1)` (1 left); `scene.update(0, 1000)` → add 1 dead, main health 99.79, target is the main.
- `a click on an add counts one step of the combo`: `talents: [ COMBO_MAXED ]`; `click(lacaio1)` → `scene.combo.streak` 1, `.combo-hud` `Combo x1 · +1%`; `click({ x: 670, y: 440 })` → `Combo x2 · +2%`.
- `Lyra's double critical click lands both hits on the clicked add`: heroes `{ leaderId: 'lyra', heroes: [ heroEntry('lyra', { 0: 1 }) ] }`, `ctx.dice.value = 0`; `click({ x: 500, y: 380 })` → add 1 health 26; the last two texts `2` at `x` 500 and 536, `y` 360, `color` `#ff8a1f`.
- `an ally meets the guarded miniboss: Lyra deals 0.2 at x 740`: no click; `scene.update(0, 1000)` → main health 99.8; last text `0.2` at (740, 273), `color` `#7fd4ff`.
- `an ally hits the target add for 2 with its number at (520, 360)`: `click(lacaio1)` (29); `scene.update(0, 1000)` → 27; last text `2` at (520, 360), `color` `#7fd4ff`.
- `an ally tick that kills the target add lands its later hits on the miniboss with one number each`: heroes `teamHeroes([ 'lyra', 'orina', null, null ])`, `adds: [ { health: 2, defenseBuff: 30 }, ADD ]`; `click(lacaio1)` (1 left); `scene.update(0, 1000)` → add 1 dead, main health 99.58; the two new light-blue texts are `2` at (520, 360) and `0.4` at (740, 273).
- `the ally clock does not restart when the target changes`: `scene.update(0, 600)`; `click(lacaio1)` (29); `scene.update(0, 400)` → 27.
- `no target change and no hit while the pause menu is open`: `scene.pauseFight()`; `click(lacaio1)` → add 1 health 30, target the main.
- `no target change and no hit while a hero screen is open`: `await scene.heroUi.show('heroes')`; `click(lacaio1)` → unchanged.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 19 cases pass, every existing `ClickerGame` case passes unchanged (the hero-team ally cases included), and the whole Vitest suite passes.

**Commit**: `feat(game): let the player pick the target of a miniboss fight`

---

### T12: Land the skills and their ticks on every monster in the scene [ ]

**Owner**: game-dev
**Goal**: The scene passes the living adds to every skill use and every skill frame, shows each number at the monster it landed on, settles add deaths after skills and ticks, and shows the target's effects in the tags (ADDS-06, ADDS-07, spec Damage skills AC 1 to 10, Edge Cases).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `game/src/adapters/phaser/ClickerGame.js` after T11: `update` (`:927`), `refreshSkillUi` (`:974`), `useSkill` (`:1082`); `ClickerGame.test.js` T10 fixtures; spec § Target and Skill Rules; design § Game `ClickerGame`
**Depends on**: T11
**Requirement**: ADDS-06, ADDS-07

**Contract**:

```js
// update(): the skill frame becomes
//     const { hits, targets } = this.skills.advance(delta, { monster: this.monster, adds: this.livingAddMonsters(), boss: this.countdown !== null });
//     hits.forEach(({ damage, critical }, index) => this.showDamage(formatDamage(damage), this.centreXOf(targets[index]), critical, null, this.numberYOf(targets[index])));
//     //  Any damage settles the dead adds and the health bars; a dead main runs the kill path once
//     if (alive && (this.monster.dead || hits.length > 0 || allyTicks > 0)) { this.afterDamage(); }
//   (it replaces the `if (alive && this.monster.dead) ... else if (...) { this.updateHealthBar(); }` pair)

// useSkill(): the use gains `adds: this.livingAddMonsters()`; the numbers become
//     result.hits.forEach(({ damage, critical }, index) =>
//         this.showDamage(formatDamage(damage), this.centreXOf(result.targets[index]), critical, null, this.numberYOf(result.targets[index])));
//   and the end `this.updateHealthBar(); this.refreshSkillUi(); if (this.monster.dead) { this.afterDamage(); }` becomes
//     this.refreshSkillUi();
//     this.afterDamage();

// refreshSkillUi(): const effects = this.skills.effectsWithOwner(this.currentTarget());
```

Fixtures: a 3-star leader has every skill unlocked at level 1 and a click base of 1.4 (+40 %), critical chance 40 % (`ctx.dice` stays 0.99, so no critical): `const leader3 = (id) => ({ leaderId: id, heroes: [ heroEntry(id, { 3: 1 }, 3) ] })` (every `heroEntry` is FIRE, like the monsters, so the element multiplier is 1). The skill cases use `addsStart({ miniboss: { element: 'FIRE', defense: 50, critResistance: 0 }, adds: [ BIG, BIG ] })` with `const BIG = { health: 100, defenseBuff: 30 }` unless the case says otherwise; the guarded defense is then 90 with both adds and 50 with none.

**Steps**:

1. Change `update`, `useSkill` and `refreshSkillUi` as above.
2. Add the cases below in `describe('ClickerGame miniboss skills')`.
3. Run the gate.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, exact names):

- `Chuva de Meteoros shows 35 on each add and 3.5 on the guarded miniboss`: `leader3('orina')`; `scene.useSkill(3)` → the last three texts `35` at (480, 360), `35` at (480, 540), `3.5` at (670, 273); main health 96.5.
- `Chuva kills both adds of 30 first and meets the miniboss at defense 50 for 17.5`: `adds: [ ADD, ADD ]` → texts `35`, `35`, `17.5`; main health 82.5; after the add tweens' `onComplete()` every add part was destroyed.
- `a skill that kills both adds and the miniboss wins once`: `adds: [ ADD, ADD ]`, `minibossHealth: 10` → `campaignGateway.report` called once with `outcome` `CLEARED`.
- `Flecha Dupla shows six numbers: 4.2 twice on each add and 0.4 twice on the miniboss`: `leader3('lyra')`, `scene.useSkill(1)` → texts `4.2` (480, 360) twice, `4.2` (480, 540) twice, `0.4` (670, 273) twice; `ctx.dice.value` stays 0.99.
- `Tempestade Arcana ticks show one number per monster each second`: `leader3('orina')`, `useSkill(2)`, `scene.update(0, 1000)` → three new texts `2.8` (480, 360), `2.8` (480, 540), `0.3` (670, 273).
- `a tick that kills the last adds lowers the miniboss defense in the same frame`: `adds: [ { health: 2, defenseBuff: 30 }, { health: 2, defenseBuff: 30 } ]`; Tempestade; `update(0, 1000)` → texts `2.8`, `2.8`, `1.4`; both adds dead; enemy line `Fire  Defesa 50%  Crit res 0%`.
- `Bomba de Veneno ticks on every monster`: `leader3('vex')`, `useSkill(1)`, `update(0, 1000)` → `1.4` (480, 360), `1.4` (480, 540), `0.1` (670, 273).
- `Tiro Preciso lands a critical on every monster at the end of its cast`: `leader3('lyra')`, `adds: [ { health: 200, defenseBuff: 30 }, { health: 200, defenseBuff: 30 } ]`, `useSkill(2)`, `update(0, 2000)` → texts `105` (480, 360), `105` (480, 540), `10.5` (670, 273), each `color` `#ff8a1f`.
- `Brado Aterrador on every monster shows in the tags of the target add`: `leader3('kael')`, `useSkill(3)`, `click({ x: 480, y: 360 })`, `scene.update(0, 16)` → `.effect-tags` text contains `Brado Aterrador`; a click on the miniboss then deals 0.56 (1.4 x (1 - 0.6)).
- `the effect tags read the effects of the target`: `const spy = vi.spyOn(scene.skills, 'effectsWithOwner')`; `click({ x: 480, y: 360 })`; `scene.update(0, 16)` → the last call's argument is `scene.fight.adds[0].monster`.
- `a skill in a fight without adds shows its one number at x 670 as before`: `leader3('orina')` on `progress(1, 'MINIBOSS', 1)` of the default definition; `useSkill(3)` → one new text at (670, 273).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 11 cases pass, every existing `ClickerGame` case passes unchanged, and the whole Vitest suite passes.

**Commit**: `feat(game): land the skills on every monster of a miniboss fight`

---

### T13: Cover the adds, the guard and the end of the fight in the browser [ ]

**Owner**: test-engineer
**Goal**: e2e scenarios pin the spawn, the guarded defense, add deaths, the win, the countdown, the farm, the reload and fights without adds (ADDS-02, ADDS-03, ADDS-08; spec Adds AC 3 to 6, 8 to 10, Fight end AC 1 to 6, Edge Cases).
**Where**: `game/e2e/minibossAdds.spec.js` (new)
**Read first**: `game/e2e/heroTeamCombat.spec.js:1-90` (helpers `monsterOf`, `scene`, `advance`, `freeze`, `wake`, `startTeam`), `game/e2e/stages.spec.js:1-30`, `:84-102` (`outcomeCalls`, the reload pattern), `game/e2e/support/fakeBackend.js:236-256` (options `definition`, `progress`, `cards`, `team`, `talents`), `game/e2e/support/game.js` (`openMainMenu`, `fillCredentials`), spec § Add Table, § Fight Layout, Fight end
**Depends on**: T12
**Requirement**: ADDS-02, ADDS-03, ADDS-08

**Contract** - helpers at the top of the file (copy `scene`, `advance`, `freeze`, `wake` and `monsterOf` of `heroTeamCombat.spec.js`):

```js
const ADD = { health: 30, defenseBuff: 30 };
//  Two stages: phase monsters of 10, a miniboss of `minibossHealth` with `defense`, its adds; the chapter boss 1000 (spec miniboss-adds)
const addsChapter = ({ adds = [ ADD, ADD ], defense = 49, minibossHealth = 100, element = 'FIRE' } = {}) => ({
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: monsterOf(element, 30, 30), bossDropRuleId: 3,
    stages: [ 1, 2 ].map((number) => ({
        number, phasesPerStage: 5, monsterHealth: 10, minibossHealth, minibossTimeLimitMs: 30_000,
        monster: monsterOf(element), miniboss: monsterOf(element, defense), monsterDropRuleId: 1, minibossDropRuleId: 2, adds
    }))
});
//  Logs in at chapter 11 stage 1 MINIBOSS (or `progress`), every hero owned with one blank card (`stars` adds a card of that many stars),
//  Kael as leader, the auto click off, and puts the loop to sleep unless `stop` is false
const startAdds = async (page, { definition = addsChapter(), progress = { chapter: 11, stage: 1, encounter: 'MINIBOSS', phase: 1 }, leader = 'kael', stars = {}, team, talents, autoClick = 'off', stop = true, roll } = {}) => { /* as startTeam, waiting for the skill slot and for the miniboss health */ };
const state = (page) => scene(page, '(s) => ({ main: s.monster?.health, adds: s.fight?.adds.map((a) => a.monster.health) ?? [], target: s.fight ? s.fight.nameOf(s.fight.target) : null, drawn: s.addParts?.size ?? 0, marker: s.marker ? [ s.marker.x, s.marker.y ] : null })');
const hitAt = (page, x, y, times = 1) => page.evaluate(([ px, py, n ]) => { const s = window.__PHASER_GAME__.scene.getScene('ClickerGame'); for (let i = 0; i < n; i++) { s.hitMonster({ x: px, y: py }); } }, [ x, y, times ]);
const outcomeCalls = (backend) => backend.calls.filter((call) => call.path === '/progress/outcome');
```

**Steps**:

1. Write the helpers and the scenarios below in `test.describe('Miniboss adds')`.
2. Run the gate twice; a failure that passes alone twice with `--workers=1` is a load flake (STATE.md Handoff note 1) and is reported, not hidden.

**Tests**: e2e
**Scenarios** (exact names):

- `a chapter 11 miniboss appears with two adds of 30 health and Defesa 90%`: `state` → `main` 100, `adds` `[ 30, 30 ]`, `target` `Miniboss`, `drawn` 2; `.enemy-stats` `Fire  Defesa 90%  Crit res 0%`; `target-chip` `Alvo: Miniboss · HP 100/100`; two Text objects `+30 de defesa`.
- `a click on the guarded miniboss deals 0.1, then 0.21 after one add died and 0.51 after both`: `hitAt(670, 440)` → `monster-hp` `HP 99.9/100`; `hitAt(480, 360, 30)` → `.enemy-stats` contains `Defesa 79%`; `hitAt(670, 440)` → `main` close to 99.69; `hitAt(480, 540, 30)` → `Defesa 49%`; `hitAt(670, 440)` → `main` close to 99.18.
- `a dead add fades out and never comes back`: `hitAt(480, 360, 30)`; `wake`; `state().drawn` polls to 1; `freeze`; `advance(5000)` → `adds[0]` 0 and `drawn` 1.
- `an add death drops no coin and sends no report`: after `hitAt(480, 360, 30)`, `outcomeCalls` length 0 and no Sprite whose texture key starts with `coin_` in the scene.
- `killing the miniboss with both adds alive wins once: stage 2 phase 1 and one CLEARED report`: `addsChapter({ minibossHealth: 1 })`; `hitAt(670, 440, 10)`; `wake`; `.stage-hud` `Stage 2/2 Phase 1/5`; `outcomeCalls` exactly one with `outcome` `CLEARED`, `encounter` `MINIBOSS`, `chapter` 11; `state().drawn` 0, `marker` null.
- `the countdown fails the fight after both adds died: phase 5 returns and one FAILED report`: kill both adds; `advance(30_000)`; `wake`; `.stage-hud` `Stage 1/2 Phase 5/5`; one `FAILED` report.
- `the countdown with both adds alive removes them at once`: `advance(30_000)` → `drawn` 0, `marker` null, `target-chip` hidden.
- `leaving from the pause menu removes the adds and reports FAILED`: `scene.pauseFight()`, `scene.leaveFight()` via `evaluate` → `drawn` 0; `wake`; one `FAILED` report.
- `a farm fight of the chapter 11 miniboss spawns its adds`: progress chapter 11 stage 2 PHASE; `evaluate` `startFarm({ kind: 'MINIBOSS', stage: 1 })` → `adds` `[ 30, 30 ]`, `.stage-hud` `Rever chefe: Miniboss 1`, `Defesa 90%`.
- `a reload during the fight restarts the miniboss and both adds at full health with a full countdown`: `hitAt(480, 360, 5)`, `hitAt(670, 440)`; reload as `stages.spec.js:97` does (`openMainMenu(page, { state: 'welcome' })`, canvas click, `ClickerGame` active); `state` → `main` 100, `adds` `[ 30, 30 ]`; `.boss-timer` `Time: 30`.
- `a chapter 1 miniboss has no adds, no marker and no target chip`: default seeded definition, progress chapter 1 stage 1 MINIBOSS → `adds` `[]`, `drawn` 0, `marker` null, `target-chip` hidden, `.enemy-stats` `Fire  Defesa 11%  Crit res 12%`.
- `a stage with an invalid add spawns only the valid one`: `addsChapter({ adds: [ { health: 0, defenseBuff: 30 }, ADD ] })` → `adds` `[ 30 ]`, `Defesa 79%`.
- `the guarded chapter 15 miniboss stays at Defesa 90% with one add of 50 alive`: `addsChapter({ defense: 61, adds: [ { health: 30, defenseBuff: 50 }, { health: 30, defenseBuff: 50 } ] })`; kill add 1 → `Defesa 90%`; kill add 2 → `Defesa 61%`.

**Gate**: full - `cd game && npm test && npx playwright test e2e/minibossAdds.spec.js`
**Done when**:

- [ ] The 13 scenarios pass twice in a row, and `npx playwright test e2e/stages.spec.js e2e/farm.spec.js e2e/heroTeamCombat.spec.js` passes.

**Commit**: `test(game): cover the miniboss adds in the browser`

---

### T14: Cover the target choice in the browser [ ]

**Owner**: test-engineer
**Goal**: e2e scenarios pin the target rules, the marker, the target chip, the add layout, the auto click and the allies on the target (ADDS-04, ADDS-05; spec Target AC 1 to 11, Edge Cases).
**Where**: `game/e2e/minibossAddsTarget.spec.js` (new)
**Read first**: `game/e2e/minibossAdds.spec.js` (T13 helpers: copy them), `game/e2e/bossReplayChapters.spec.js:51-62` (scene px of a DOM box), `game/e2e/heroTeamCombat.spec.js:27-30` (`allyTexts`), spec § Fight Layout, § Target and Skill Rules
**Depends on**: T13
**Requirement**: ADDS-04, ADDS-05

**Contract** - one more helper, a real mouse click at scene px:

```js
const clickAt = async (page, x, y) => {
    const box = await page.locator('canvas').boundingBox();

    await page.mouse.click(box.x + (x * box.width) / 1024, box.y + (y * box.height) / 768);
};
//  The numbers of clicks, skills and ticks on screen, oldest first
const numbers = (page) => scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && [ "#ffd35c", "#ff8a1f", "#7fd4ff" ].includes(o.style.color)).map((o) => ({ text: o.text, x: o.x, y: o.y, color: o.style.color }))');
```

**Steps**:

1. Copy the T13 helpers, add `clickAt` and `numbers`, and write the scenarios below in `test.describe('Miniboss target')`.
2. Run the gate twice.

**Tests**: e2e
**Scenarios** (exact names):

- `a real click on Lacaio 1 makes it the target and moves the marker over it`: `startAdds(page, { stop: false })`; `clickAt(480, 360)`; `state` polls to `target` `Lacaio 1`, `adds[0]` 29, `marker` `[ 480, 253.5 ]`; `target-chip` `Alvo: Lacaio 1 · HP 29/30`; `.enemy-stats` `Fire  Defesa 0%  Crit res 0%`.
- `a click on the miniboss makes it the target again`: `hitAt(480, 360)`, `hitAt(670, 440)` → `target` `Miniboss`, `marker` `[ 670, 270 ]`.
- `a click on Lacaio 2 moves the marker to (480, 438.5)`: `marker` `[ 480, 433.5 ]`, chip `Alvo: Lacaio 2 · HP 29/30`.
- `a click on no monster hits the target with its number at x 480`: `hitAt(480, 360)`, `hitAt(100, 100)` → `adds[0]` 28; the last of `numbers` at `x` 480, `y` 360.
- `a click where a dead add stood hits the target`: kill add 1 (`hitAt(480, 360, 30)`) → `target` `Miniboss`; `hitAt(480, 360)` → `main` close to 99.79.
- `the auto click hits the target add`: `autoClick: 'on'`; `hitAt(480, 360)`; `advance(500)` → `adds[0]` 28; the last number at `x` 480.
- `the auto click moves on to the miniboss when the target add dies`: `addsChapter({ adds: [ { health: 2, defenseBuff: 30 }, ADD ] })`, `autoClick: 'on'`; `hitAt(480, 360)`; `advance(1000)` → `adds[0]` 0, `target` `Miniboss`, `main` close to 99.79.
- `an ally hits the guarded miniboss for 0.2 and the target add for 2`: `team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }`, `cards` cleared `[ 5 ]`; `advance(1000)` → `main` close to 99.8, last light-blue number `0.2` at `x` 740; `hitAt(480, 360)`; `advance(1000)` → `adds[0]` 27, last light-blue number `2` at (520, 360).
- `an ally tick that kills the target add lands its later hit on the miniboss`: allies Lyra and Orina (`boughtSlots: 2`), `adds: [ { health: 2, defenseBuff: 30 }, ADD ]`; `hitAt(480, 360)`; `advance(1000)` → `adds[0]` 0, `main` close to 99.58, light-blue numbers `2` at (520, 360) and `0.4` at (740, 273).
- `a click on an add counts for the combo`: `talents: { COMBO: 10 }`; `hitAt(480, 360)` → `combo-hud` `Combo x1 · +1%`; `hitAt(670, 440)` → `Combo x2 · +2%`.
- `Lyra's double critical click lands both hits on the add`: `leader: 'lyra'`, `roll: 0`, `addsChapter({ element: 'NATURE' })`; `hitAt(500, 380)` → `adds[0]` 26; the last two numbers `2` at `x` 500 and 536, `y` 360, `#ff8a1f`.
- `no target change and no hit while the pause menu is open`: `evaluate` `pauseFight()`; `hitAt(480, 360)` → `adds[0]` 30, `target` `Miniboss`.
- `the add bodies, bars and buff texts stand at the layout places`: read `s.addParts.get(1)` and `get(2)`: bodies (480, 360) and (480, 540), 110 x 125; bars `x` 430, `y` 279.5 and 459.5, 100 x 8; labels `+30 de defesa` at (480, 276.5) and (480, 456.5), `fontSize` `12px`, `color` `#ffffff`.
- `the target chip is a gold-bordered 12 px chip and no enemy box row touches Lacaio 2`: computed style of `target-chip`: `font-size` `12px`, `font-weight` `700`, `border-top-color` `rgb(224, 180, 90)`; in scene px (canvas mapping of `bossReplayChapters.spec.js:51`) none of the boxes of `target-chip`, `weak-chip` and `.enemy-stats` intersects Lacaio 2's body (x 425 to 535, y 477.5 to 602.5), and the bottom of `.enemy-stats` is above 624. Check it for the target `Miniboss` and for the target `Lacaio 2`.

**Gate**: full - `cd game && npm test && npx playwright test e2e/minibossAddsTarget.spec.js`
**Done when**:

- [ ] The 14 scenarios pass twice in a row.

**Commit**: `test(game): cover the miniboss target in the browser`

---

### T15: Cover the skills on every monster in the browser [ ]

**Owner**: test-engineer
**Goal**: e2e scenarios pin that every damage skill and debuff lands on every living monster in the order adds then miniboss, with the right numbers (ADDS-06, ADDS-07; spec Damage skills AC 1 to 10).
**Where**: `game/e2e/minibossAddsSkills.spec.js` (new)
**Read first**: `game/e2e/minibossAddsTarget.spec.js` (T14 helpers: copy them), `game/e2e/heroTeamCombat.spec.js:84-95` (`useSkill`, `useThenAdvance`), `game/src/domain/skills/skillCatalog.js` (percents), spec § Target and Skill Rules
**Depends on**: T14
**Requirement**: ADDS-06, ADDS-07

**Contract** - every scenario uses a 3-star leader (`stars: { <id>: 3 }`, `leader: '<id>'`): click base 1.4, critical 40 % (the default roll 0.99 never crits), every skill level 1. The monsters take the leader's element so the multiplier is 1: Kael `FIRE`, Lyra `NATURE`, Orina `WATER`, Seraphine `LIGHT`, Vex `DARKNESS`. The miniboss has defense 50 (`addsChapter({ defense: 50, element, adds })`): 90 with both adds alive, 50 with none. `BIG = { health: 200, defenseBuff: 30 }`.

**Steps**:

1. Copy the T14 helpers, add `useSkill` and `useThenAdvance` of `heroTeamCombat.spec.js`, and write the scenarios below in `test.describe('Miniboss skills')`.
2. Run the gate twice.

**Tests**: e2e
**Scenarios** (exact names):

- `Chuva de Meteoros shows 35 on each add and 3.5 on the miniboss`: Orina, `adds: [ BIG, BIG ]`; `useSkill(3)` → the last three numbers `35` (480, 360), `35` (480, 540), `3.5` (670, 273).
- `Chuva de Meteoros kills both adds first and hits the miniboss at defense 50 for 17.5`: `adds: [ ADD, ADD ]` → `35`, `35`, `17.5`; `main` close to 182.5 with `minibossHealth: 200`; `.enemy-stats` `Water  Defesa 50%  Crit res 0%`.
- `a skill that kills both adds and the miniboss wins once`: `adds: [ ADD, ADD ]`, `minibossHealth: 10`; `useSkill(3)`; `wake` → exactly one `CLEARED` report and `.stage-hud` `Stage 2/2 Phase 1/5`.
- `Flecha Dupla shows six numbers`: Lyra, `adds: [ BIG, BIG ]`; `useSkill(1)` → `4.2` twice at (480, 360), twice at (480, 540), `0.4` twice at (670, 273).
- `Tiro Preciso lands a critical 105 on each add and 10.5 on the miniboss`: Lyra, `adds: [ BIG, BIG ]`; `useSkill(2)`; `advance(2000)` → `105`, `105`, `10.5`, each `#ff8a1f`.
- `Tempestade Arcana ticks 2.8 on each add and 0.3 on the miniboss each second`: Orina; `useSkill(2)`; `advance(1000)` → three numbers.
- `Bomba de Veneno puts a stack on every monster`: Vex; `useSkill(1)`; `hitAt(480, 360)` (target add 1); `.effect-tags` contains `Bomba de Veneno x1`; `advance(1000)` → `1.4` (480, 360), `1.4` (480, 540), `0.1` (670, 273).
- `Golpe Sangrento hits each monster for 8.4 and bleeds each for 2.1`: Vex; `useSkill(3)` → `8.4`, `8.4`, `0.8`; `advance(1000)` → `2.1`, `2.1`, `0.2`.
- `Brado Aterrador lowers every monster: a click on the guarded miniboss deals 0.56`: Kael; `useSkill(3)`; `hitAt(670, 440)` → `main` close to 99.44; `hitAt(480, 360)` → `.effect-tags` contains `Brado Aterrador`.
- `Prisão de Espinhos goes on every monster: a click on an add deals 1.75`: Orina; `evaluate`: `useSkill(1)` then `hitMonster({ x: 480, y: 360 })` in one call → `adds[0]` close to 198.25 with `adds: [ BIG, BIG ]`.
- `Corte Dimensional lands 21 on each add and 7.8 on the miniboss`: Kael; `useSkill(1)` → `21`, `21`, `7.8` (30 % armor pierce: 21 x (1 - 0.63)).
- `Investida do Baluarte lands 5.6 on each add and 0.6 on the miniboss`: Kael; `useSkill(2)`.
- `Luz Divina lands 11.2 on each add and 1.1 on the miniboss`: Seraphine; `useSkill(2)`.
- `a skill in a chapter 1 fight shows one number at x 670 as before`: Orina, default seeded definition, chapter 1 stage 1 MINIBOSS; `useSkill(3)` → one new number at `x` 670.

**Gate**: full - `cd game && npm test && npx playwright test e2e/minibossAddsSkills.spec.js`
**Done when**:

- [ ] The 14 scenarios pass twice in a row, and `npx playwright test e2e/skills.spec.js e2e/skillsAll.spec.js e2e/unifiedDamage.spec.js` passes.

**Commit**: `test(game): cover the skills on every monster in the browser`

---

### T16: Review the miniboss fight screens [ ]

**Owner**: ui-artist
**Goal**: Check every changed screen against spec § Fight Layout and § Player-Facing Texts and record the verdict in `ui-review.html` (ADDS-05).
**Where**: `.specs/features/miniboss-adds/ui-review.html` (new)
**Also changes**: `game/ui-review/minibossAdds.shots.js` (new), `.specs/features/miniboss-adds/ui-review/*.png` (screenshots)
**Read first**: `.claude/agents/ui-artist.md`, `.claude/templates/ui-review.html`, `game/ui-review/heroTeam.shots.js` (pattern), `game/ui-review/support/`, `game/ui-review.config.js` (projects `desktop` 1280x720 and `phone` 390x844), `game/e2e/minibossAddsTarget.spec.js` (helpers), spec § Fight Layout, § Player-Facing Texts
**Depends on**: T15
**Requirement**: ADDS-05

**Contract** - screens and shots (desktop and phone each):

| # | Screen | State | Shot name |
| --- | --- | --- | --- |
| S1 | Combat | chapter 11 miniboss, both adds, marker on the miniboss, chip `Alvo: Miniboss · ...`, `Defesa 90%` | `01-adds-fight-start` |
| S2 | Combat | target Lacaio 1 (marker, chip, `Defesa 0%`) | `02-adds-target-lacaio-1` |
| S3 | Combat | target Lacaio 2 | `03-adds-target-lacaio-2` |
| S4 | Combat | Lacaio 1 dead and gone, `Defesa 79%` | `04-adds-one-dead` |
| S5 | Combat | Chuva de Meteoros numbers on the three monsters | `05-adds-skill-numbers` |
| S6 | Combat | four allies in the formation beside both adds, light-blue numbers on an add | `06-adds-with-team` |
| S7 | Combat | chapter 1 miniboss: no add, no marker, no chip | `07-no-adds` |

Checks per screen: every size, position, colour and text of § Fight Layout; no overlap of the adds with the formation (x 410 or less), the miniboss (x 560 or more), the enemy box chips, the battle bar (y 624) or each other; the marker, bar and buff text of each add do not overlap; the marker over the miniboss stays readable under the damage numbers; the contrast of the buff text (white with outline on the forest) and of the target chip on `--chip-bg`. The phone shots are judged only against TD-010 (known), not as findings.

**Steps**:

1. Write `game/ui-review/minibossAdds.shots.js` with one `test` per screen, using `mockBackend` with the `addsChapter` definition of T13, `openMainMenu`, `fillCredentials` and the `shot` helper as `heroTeam.shots.js` does.
2. Run `cd game && npm run ui:shots -- minibossAdds`.
3. Fill `ui-review.html` from the template (Portuguese, AD-007): one section per screen with its shots, the checks marked pass or fail, each failure as a finding with the object, the observed value and the expected value. Verdict `APROVADO` or `MUDANÇAS PEDIDAS`.
4. Add each finding to this file as a new task `T17`, `T18`, ... (owner `game-dev`, with Where, Contract, Tests, Gate, Done when).

**Tests**: none
**Gate**: build - `cd game && npm run ui:shots -- minibossAdds` exits 0
**Done when**:

- [ ] `ui-review.html` holds the 7 screens with desktop and phone shots and a verdict.
- [ ] Every finding is a task in this file.

**Commit**: `docs(miniboss-adds): add the ui review`

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: `StageAdd` + seed | 1 value and its seed rule (one file) | ✅ Granular |
| T2: `stage_adds` storage | 1 table, its entity and its repository paths | ⚠️ cohesive (migration + adapter of the same table, as hero-team T2) |
| T3: `adds` in the payload | 1 response field | ✅ Granular |
| T4: ADR 0014 | docs | ✅ Granular |
| T5: `adds.js` | 1 function | ✅ Granular |
| T6: `Fight` | 1 class | ✅ Granular |
| T7: encounters carry adds | 1 module | ✅ Granular |
| T8: effects per monster | 1 class, state refactor | ✅ Granular |
| T9: skills on every monster | 2 methods of 1 class | ✅ Granular |
| T10: scene adds and guard | 1 scene concern (spawn, draw, death) + its CSS rule | ⚠️ cohesive |
| T11: scene target | 1 scene concern (who is hit) | ✅ Granular |
| T12: scene skills | 1 scene concern (skill numbers) | ✅ Granular |
| T13 to T15: e2e files | 1 file each | ✅ Granular |
| T16: ui review | 1 review | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | (start of Phase 2) | ✅ Match |
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

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend repository and migration | integration | integration | ✅ OK |
| T3 | Backend web | integration | integration | ✅ OK |
| T4 | Docs | none | none | ✅ OK |
| T5 to T9 | Game domain | unit | unit | ✅ OK |
| T10 to T12 | Game scene (and one CSS rule) | unit (jsdom) | unit | ✅ OK |
| T13 to T15 | e2e | e2e | e2e | ✅ OK |
| T16 | UI review | none | none | ✅ OK |

Player-visible behaviour is unit-tested in T10 to T12 by its author and covered in the browser by T13 to T15 (owner `test-engineer`, L-062, L-099); every player-visible AC and edge case of the spec maps to a named scenario there. The CSS of the target chip (T10) is checked in the browser by T14 (`the target chip is a gold-bordered 12 px chip ...`).

## Task Count by Owner

| Owner | Tasks | Count |
| --- | --- | --- |
| kotlin-backend-dev | T1 to T4 | 4 |
| game-dev | T5 to T12 | 8 |
| test-engineer | T13 to T15 | 3 |
| ui-artist | T16 | 1 |
