# Defense Contract Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author checks (T8, T10) close Execute (`CLAUDE.md` § Agent team). There is no ui review: no change is visible to the player (spec Out of Scope).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/defense-contract/spec.md`
**Design**: `.specs/features/defense-contract/design.md`
**Status**: Approved by the owner on 2026-11-26 (recommended defaults: spec Q1 to Q8). Runs after `tech-debt-polish` and before `portuguese-text`.

Rules for every task: the rules block of `.specs/features/early-game-rebalance/tasks.md` (§ Rules for every task) applies word for word: paths from the repository root, `main/` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `test/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `migration/` = `backend/src/main/resources/db/migration/`, graphify first, the files under **Read first** before editing, one commit per task checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"` and ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, files added by path only (never `git add -A` or `git add .`), the task ticked `[x]` here and its requirement rows in `spec.md` § Requirement Traceability set to `Implementing` in the same commit, push with `git pull --rebase origin main && git push origin HEAD:main`, re-pins only where a task lists them, never delete a test unless the task's **Removals allowed** names it, an e2e flake rerun alone twice with `--workers=1`, never the full e2e suite, desktop only. Kotlin: ktlint (`./gradlew ktlintCheck`), the KDoc style of `Chapter.kt`. Game: 4-space indent, `//  ` comments with two spaces.

**Deploys.** Every commit that changes `backend/**` outside `backend/src/test/**` is deployed by the watcher within about a minute (`CLAUDE.md` § Deploy). T1, T2 and T3 are each safe with the backend before them (design § Architecture Overview). T9 is the contract: it runs only when its precondition holds and is pushed alone.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md`, `.claude/agents/test-engineer.md`, `backend/build.gradle.kts` (JUnit 5, Testcontainers PostgreSQL, ktlint), `game/vitest.config.js`, `game/playwright.config.js`. No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend migrations (V19, V20) | integration (Testcontainers) | DEF-01 AC 1 to 8, DEF-06 AC 1, 2, 4; the previous release replayed (L-080) | `test/adapter/repository/EnemyDefenseMigrationIT.kt`, `PreviousBackendCompatibilityIT.kt`, `EarlyGameRebalanceMigrationIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend repository | integration | DEF-02 AC 1 to 3 | `test/adapter/repository/EnemyRepositoryIT.kt`, `ChapterRepositoryIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend web | integration | DEF-03 AC 1 to 3 | `test/adapter/web/ProgressControllerIT.kt`, `FarmControllerIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Game domain and application | unit | DEF-04 AC 1, 3, 4 | `game/src/**/*.test.js` | `cd game && npm test` |
| Game in the browser | e2e | DEF-04 AC 2, 3 | `game/e2e/unifiedDamage.spec.js`, `game/e2e/heroTeamCombat.spec.js` | `cd game && npx playwright test e2e/<file>` |
| Test fixtures | unit + e2e (behaviour kept) | DEF-05 AC 1 to 3 | the files of T4, T5, T6 | the gate of each task |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | Every backend task | `cd backend && ./gradlew ktlintCheck test` |
| Quick | Game unit tasks | `cd game && npm test` |
| Full | Game tasks with e2e files | `cd game && npm test && npm run build && npx playwright test <files of the task>` |

---

## Execution Plan

### Phase 1: Release 1, expand (kotlin-backend-dev)

```
T1 → T2 → T3
```

### Phase 2: Backend test SQL (test-engineer)

```
T4
```

### Phase 3: Game (test-engineer, then game-dev)

```
T5 → T6 → T7
```

### Phase 4: Author check of release 1 and the game (test-engineer)

```
T8
```

### Phase 5: Contract (kotlin-backend-dev, deferred until release 1 is live; then test-engineer)

Start only when `./publish.sh` runs and the precondition of T9 holds. If it cannot be met, stop and report the contract as pending; the feature works without it (TD-002 stays "in progress" until T9 and T10 are done).

```
T9 → T10
```

---

## Task Breakdown

### Phase 1: Release 1, expand

#### T1: V19 adds the defense column and the trigger that bridges the old backend [x]

**Owner**: kotlin-backend-dev
**Goal**: The `enemies` table gets `defense`, filled for every row and every insert of either backend, with its check and unique key (DEF-01; spec One defense column AC 1 to 8, Edge 1, 2, 4).
**Where**: `migration/V19__enemy_defense_expand.sql` (new)
**Files**:
- Also creates: `test/adapter/repository/EnemyDefenseMigrationIT.kt`
- Also changes: `test/adapter/repository/PreviousBackendCompatibilityIT.kt`
- Read first: design § V19 (the whole SQL), `migration/V1__schema.sql:55-61`, `test/adapter/repository/HealthHitPointsMigrationIT.kt` (style of a migration IT), `test/adapter/repository/SchemaConstraintsIT.kt:30-41` (`sqlStateOf`, `assertRejected`), `test/adapter/repository/PreviousBackendCompatibilityIT.kt` (whole), `main/adapter/repository/EnemyRepository.kt` (the insert and find of the backend before this feature, which this task replays)
**Depends on**: None
**Requirement**: DEF-01

**Contract**: the SQL of design § V19, byte for byte. No file under `backend/src/main/kotlin` changes in this task.

`EnemyDefenseMigrationIT` (extends `IntegrationTestBase`, like the other repository ITs) works on a scratch schema `defense_expand_check` for every case that needs a database state other than the test database's, so its cases stay valid after V20:

```kotlin
/** Migrates the scratch schema to [version] (a string such as "18" or "19"); the main test schema is left alone. */
private fun scratchAt(version: String) =
    Flyway
        .configure()
        .dataSource(dataSource)
        .schemas(SCRATCH)
        .createSchemas(true)
        .locations("classpath:db/migration")
        .target(version)
        .load()
        .migrate()

@AfterTest
fun dropScratch() {
    jdbc.execute("drop schema if exists $SCRATCH cascade")
}

private companion object {
    const val SCRATCH = "defense_expand_check"
}
```

Rows inserted in the scratch schema name it (`insert into defense_expand_check.enemies ...`). The scratch schema has no seed (the seeder writes only the main schema).

**Steps**:

1. Write `V19__enemy_defense_expand.sql` from design § V19.
2. Write `EnemyDefenseMigrationIT` with the cases below. KDoc of the class: `` `V19__enemy_defense_expand.sql` (spec defense-contract, TD-002): the one defense gets its own column; a trigger keeps it and the two old columns equal while the backend before this feature can still run (AD-016). The scratch schema cases migrate to V19 only, so they keep holding after V20. ``
3. `PreviousBackendCompatibilityIT`:
   - Class KDoc becomes: `AD-016: the release before V19 (the backend before defense-contract, commit 171f518, last migration V18) must keep starting and serving on the database after V19. Its entities are the current ones except EnemyEntity, which maps physical_defense and magical_defense; these checks replay its column types, its enemy read and write paths and Flyway's validation of its own migrations V1 to V18. The older releases' validation cases stay. Booting a previous image itself is not executed here.`
   - `the previous entities pass the schema check of the migrated database`: add a fourth entry `"enemies" to mapOf("id" to "bigint", "element" to "character varying", "physical_defense" to "integer", "magical_defense" to "integer", "crit_resistance" to "integer")`.
   - Add the case `the previous backend writes and reads enemies through physical_defense and magical_defense` (below).
   - Every existing `previousReleaseStartsOnMigratedSchema` call gets `futureMigrations` + 1: `lastVersion = 12` -> 7, `13` -> 6, `14` -> 5, `15` -> 4, `17` -> 2.
   - Add `the release before the defense contract starts on the migrated schema and its validation ignores V19`: `previousReleaseStartsOnMigratedSchema(lastVersion = 18, futureMigrations = 1)`.
4. Run the gate.

**Tests**: integration
**Test cases** (`EnemyDefenseMigrationIT`):

- `V19 copies physical_defense into defense on a database seeded before it` (DEF-01 AC 1): `scratchAt("18")`; insert `('WATER', 12, 12, 3)` and `('FIRE', 40, 55, 9)` into `defense_expand_check.enemies (element, physical_defense, magical_defense, crit_resistance)`; `scratchAt("19")`; `select defense from defense_expand_check.enemies order by id` is `[12, 40]`.
- `the backend before this feature inserts the old columns and the row gets defense` (AC 2): `scratchAt("19")`; run the insert of the backend before this feature with values `('LIGHT', 86, 86, 96)`: `insert into defense_expand_check.enemies (element, physical_defense, magical_defense, crit_resistance) values (?, ?, ?, ?) on conflict (element, physical_defense, magical_defense, crit_resistance) do nothing`; `defense` of that row is 86.
- `the new backend inserts only defense and the old columns get it` (AC 3, AC 7): `scratchAt("19")`; `insert into defense_expand_check.enemies (element, defense, crit_resistance) values ('LIGHT', 87, 97) on conflict (element, defense, crit_resistance) do nothing`; then the read of the backend before this feature, `select physical_defense, magical_defense from defense_expand_check.enemies where element = 'LIGHT' and physical_defense = 87 and magical_defense = 87 and crit_resistance = 97`, returns one row with 87 and 87.
- `defense is a not null integer with its check and unique key` (AC 1): on the main schema, `information_schema.columns` for `enemies.defense` has `data_type` `integer` and `is_nullable` `NO`; `select conname from pg_constraint where conrelid = 'enemies'::regclass` contains `ck_enemies_defense` and `uk_enemies_defense`.
- `a defense of 91 or -1 is rejected` (AC 4): on the main schema, `insert into enemies (element, defense, crit_resistance) values ('FIRE', ?, 0)` with 91 and with -1 each fail with SQL state `23514`.
- `a second enemy with the same element, defense and critical resistance is rejected` (AC 5): on the main schema, `insert into enemies (element, defense, crit_resistance) select element, defense, crit_resistance from enemies order by id limit 1` fails with `23505`.
- `V19 fails and leaves V18 on a database with two enemies of the same element, physical defense and critical resistance` (AC 8): `scratchAt("18")`; insert `('FIRE', 10, 10, 5)` and `('FIRE', 10, 20, 5)`; `scratchAt("19")` throws `org.flywaydb.core.api.FlywayException` (use `assertFailsWith<FlywayException>`); afterwards `select count(*) from information_schema.columns where table_schema = 'defense_expand_check' and table_name = 'enemies' and column_name = 'defense'` is 0, and `select count(*) from defense_expand_check.flyway_schema_history where version = '19' and success` is 0.

**Test cases** (`PreviousBackendCompatibilityIT`):

- `the previous entities pass the schema check of the migrated database`: the four tables, `enemies` as in step 3.
- `the previous backend writes and reads enemies through physical_defense and magical_defense` (AC 2, 7, Edge 1): inside `rolledBack { }`: `jdbc.update("insert into enemies (element, physical_defense, magical_defense, crit_resistance) values (?, ?, ?, ?) on conflict (element, physical_defense, magical_defense, crit_resistance) do nothing", "NATURE", 88, 88, 98)` returns 1; `select id from enemies where element = ? and physical_defense = ? and magical_defense = ? and crit_resistance = ?` with the same values returns one id; the seeded chapter 1 boss read the old way, `select e.physical_defense from enemies e join chapters c on c.boss_enemy_id = e.id where c.number = 1`, is 30.
- `the release before the defense contract starts on the migrated schema and its validation ignores V19`: `lastVersion = 18`, `futureMigrations = 1`.
- The five existing validation cases with the new counts of step 3.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The backend suite passes, including `SchemaValidationIT`, `EnemyRepositoryIT`, `ChapterRepositoryIT`, `SchemaConstraintsIT`, `EarlyGameRebalanceMigrationIT` (they still use the old columns, which the trigger keeps filled).
- [x] The commit touches exactly the migration, the 2 test files and this file; no Kotlin file under `backend/src/main` changes.
- [x] After the push, the watcher deploys it (`node -e "console.log(JSON.parse(require('fs').readFileSync('.deploy-state','utf8')).active.commit)"` prints this commit or a later one within 5 minutes), or the deploy is reported pending with the reason.

**Commit**: `feat(backend): add the enemy defense column with a bridge for the previous backend`

---

#### T2: The backend maps and writes only `defense` [x]

**Owner**: kotlin-backend-dev
**Goal**: `EnemyEntity` and `EnemyRepository` know one defense column (DEF-02; spec Backend AC 1 to 4).
**Where**: `main/adapter/repository/ChapterEntities.kt` (`EnemyEntity`)
**Files**:
- Also changes: `main/adapter/repository/EnemyRepository.kt`, `test/adapter/repository/EnemyRepositoryIT.kt`, `test/adapter/repository/ChapterRepositoryIT.kt`
- Read first: design § Backend entity and repository, `ChapterEntities.kt:19-45`, `EnemyRepository.kt` (whole), `EnemyRepositoryIT.kt` (whole), `ChapterRepositoryIT.kt` cases `rows written by SQL read the enemies and drop rules they point at, with physical_defense as the defense`, `a saved chapter writes each defense to both columns`, `the 50 seeded stages share 5 phase monsters, one per element with no defense and no resistance`
**Depends on**: T1
**Requirement**: DEF-02

**Contract**: design § Backend entity and repository, exactly.

**Removals allowed**: in `ChapterRepositoryIT`, the `magical_defense` assertions of `the 50 seeded stages share ...` (`assertEquals(0, it["magical_defense"])`) and of `a saved chapter writes each defense to both columns` (`assertEquals(55, boss["magical_defense"])`): the backend no longer writes that column; the trigger copy is pinned by `EnemyDefenseMigrationIT`.

**Steps**:

1. `ChapterEntities.kt`: replace `EnemyEntity` and its KDoc with the design version (drop "The one defense is `physical_defense` (TD-002)").
2. `EnemyRepository.kt`: replace `JpaEnemyRepository` with the design version; `idOf` calls `insertIfAbsent(element, stats.defense, stats.critResistance)` and `findByElementAndDefenseAndCritResistance(element, stats.defense, stats.critResistance)`.
3. `EnemyRepositoryIT.kt`:
   - `removeTestEnemies`: `delete from enemies where defense >= 81`.
   - `rowsWith`: `select count(*) from enemies where element = ? and defense = ? and crit_resistance = ?` with `stats.element.name, stats.defense, stats.critResistance`.
   - `the defense is stored in both columns` becomes `the defense is stored in the defense column and copied to the old columns until the contract`: `select defense, physical_defense, magical_defense from enemies where id = ?` reads 81, 81, 81.
4. `ChapterRepositoryIT.kt`:
   - `rows written by SQL read the enemies and drop rules they point at, with physical_defense as the defense` becomes `rows written by SQL read the enemies and drop rules they point at`: the two inserts become `insert into enemies (element, defense, crit_resistance) values ('NATURE', 85, 87) returning id` and `... values ('LIGHT', 88, 90) returning id`; assertions unchanged (`EnemyStats(Element.NATURE, 85, 87)`, `EnemyStats(Element.LIGHT, 88, 90)`, drop rules 3, 1, 2).
   - `a saved chapter writes each defense to both columns` becomes `a saved chapter writes each defense to the defense column`: `select e.defense from enemies e join chapters c on c.boss_enemy_id = e.id where c.number = ?` is 55.
   - `the 50 seeded stages share 5 phase monsters, ...`: the first query selects `distinct e.element, e.defense, e.crit_resistance`; the second `select element from enemies where defense = 0 and crit_resistance = 0`; the loop asserts `it["defense"]` 0 and `it["crit_resistance"]` 0. Counts (5, 5, the five element names) unchanged.
5. Run the gate.

**Tests**: integration
**Test cases**: the 3 `EnemyRepositoryIT` cases (`the same stats twice return the same id and leave one row`: one row; `stats differing in any one attribute return a new id`: 3 new ids, one row each; the renamed column case: 81, 81, 81) and the 3 `ChapterRepositoryIT` cases above with their values; `SchemaValidationIT` (the entity matches the schema).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The backend suite passes.
- [x] `git grep -n -E "physical_defense|magical_defense|physicalDefense|magicalDefense" -- backend/src/main/kotlin` prints only lines of `EnemyStatsResponse` in `ProgressController.kt` (its KDoc, its two fields and the two assignments in `from`), which T3 removes.
- [x] The commit touches exactly the 4 files above and this file.

**Commit**: `refactor(backend): read and write the enemy defense through one column`

---

#### T3: The progress and farm payloads answer `defense` only [x]

**Owner**: kotlin-backend-dev
**Goal**: `EnemyStatsResponse` drops `physicalDefense` and `magicalDefense` (DEF-03; spec Payload AC 1 to 3, Q3).
**Where**: `main/adapter/web/ProgressController.kt`
**Files**:
- Also changes: `test/adapter/web/ProgressControllerIT.kt`, `test/adapter/web/FarmControllerIT.kt`
- Read first: design § API, `ProgressController.kt:26-43`, `ProgressControllerIT.kt` cases `GET progress carries the enemy stats of the phase monster, the miniboss and the chapter boss` and the chapter 6 case that asserts `definition.boss.defense` 53, `FarmControllerIT.kt` the case that asserts `definition.boss.defense` 35
**Depends on**: T2
**Requirement**: DEF-03

**Contract**: design § API, exactly.

**Removals allowed**: the `physicalDefense` and `magicalDefense` `equalTo` lines of the three cases above (8 lines in `ProgressControllerIT`, 2 in `FarmControllerIT`); each is replaced by a `not(hasKey(...))` line.

**Steps**:

1. `ProgressController.kt`: replace `EnemyStatsResponse` with the design version.
2. `ProgressControllerIT.kt`: add `import org.hamcrest.Matchers.hasKey` and `import org.hamcrest.Matchers.not`. In `GET progress carries the enemy stats ...`, replace each pair of `physicalDefense` / `magicalDefense` lines by `.body("definition.boss", not(hasKey("physicalDefense")))` and `.body("definition.boss", not(hasKey("magicalDefense")))` (and the same for `definition.stages[0].monster` and `definition.stages[0].miniboss`); keep every `defense`, `element` and `critResistance` line. In the chapter 6 case, replace its two lines by the two `not(hasKey(...))` lines on `definition.boss`.
3. `FarmControllerIT.kt`: same imports; replace its two lines by `.body("definition.boss", not(hasKey("physicalDefense")))`, `.body("definition.boss", not(hasKey("magicalDefense")))`, and add `.body("definition.stages[0].monster", not(hasKey("physicalDefense")))`, `.body("definition.stages[0].miniboss", not(hasKey("magicalDefense")))`, `.body("definition.stages[0].monster.defense", equalTo(0))`.
4. Run the gate.

**Tests**: integration
**Test cases**: `GET progress carries the enemy stats ...` (boss `defense` 30, `critResistance` 5, monster `defense` 0, miniboss `defense` 11; no old key on the three); the chapter 6 case (boss `defense` 53; no old key); the farm case (boss `defense` 35, stage 1 monster `defense` 0; no old key).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The backend suite passes; `git grep -n -i defense -- deploy` prints nothing (the regression suite reads no defense field).
- [x] `git grep -n -E "physicalDefense|magicalDefense" -- backend/src` prints nothing in `backend/src/main`; under `backend/src/test` it prints only the `not(hasKey(...))` assertions this task adds and two parameter names of a helper in `EnemyDefenseMigrationIT`.
- [x] The commit touches exactly the 3 files above and this file.

**Commit**: `feat(backend): answer the enemy defense once in the progress and farm payloads`

---

### Phase 2: Backend test SQL

#### T4: Backend tests write enemies through `defense` [x]

**Owner**: test-engineer
**Goal**: The backend tests that build or read enemies with SQL use `defense`, so after T9 only the migration and compatibility tests name the old columns (DEF-05; spec Fixtures AC 2, 3).
**Where**: `test/adapter/repository/SchemaConstraintsIT.kt`
**Files**:
- Also changes: `test/adapter/repository/EarlyGameRebalanceMigrationIT.kt`
- Read first: design § Fixture Conversion Rules (R7), `SchemaConstraintsIT.kt` `probeEnemy`, the cleanup that deletes the probe enemy, `a second enemy with the same four attributes is rejected`, `enemy attributes outside their bounds are rejected`; `EarlyGameRebalanceMigrationIT.kt` `writeOldSeed`, `minibossEnemy`, `bossEnemy`, the cases that read `["physical_defense"]`, `a miniboss whose enemy was tuned keeps its enemy`
**Depends on**: T3
**Requirement**: DEF-05

**Removals allowed**: in `enemy attributes outside their bounds are rejected`, the two rows that test the `magical_defense` bound (`"FIRE", 0, 91, 0` and `"FIRE", 0, -1, 0`): no code writes that column, and V20 drops it with its check.

**Steps**:

1. `SchemaConstraintsIT.kt`:
   - `probeEnemy`: `insert into enemies (element, defense, crit_resistance) values ('DARKNESS', 3, ?) returning id` (no seeded enemy has defense 3; seeded defenses are 0, 11 to 71, 74, 77, 80).
   - The cleanup line becomes `delete from enemies where element = 'DARKNESS' and defense = 3`.
   - `a second enemy with the same four attributes is rejected` becomes `a second enemy with the same element, defense and critical resistance is rejected`: `insert into enemies (element, defense, crit_resistance) select element, defense, crit_resistance from enemies where id = ?` is rejected with `23505`.
   - `enemy attributes outside their bounds are rejected`: `val insert = "insert into enemies (element, defense, crit_resistance) values (?, ?, ?)"`; rows `("FIRE", 91, 0)`, `("FIRE", 0, 101)`, `("FIRE", -1, 0)`, `("FIRE", 0, -1)`, `("PLASMA", 1, 3)`, each `23514`.
2. `EarlyGameRebalanceMigrationIT.kt`:
   - `writeOldSeed`: in the SQL block, `insert into enemies (element, physical_defense, magical_defense, crit_resistance)` -> `insert into enemies (element, defense, crit_resistance)` (twice); `select distinct e.element, e.physical_defense, e.magical_defense,` -> `select distinct e.element, e.defense,` (twice); `and n.element = e.element and n.physical_defense = e.physical_defense and n.magical_defense = e.magical_defense` -> `and n.element = e.element and n.defense = e.defense` (twice); `on conflict on constraint uk_enemies_attributes do nothing` -> `on conflict on constraint uk_enemies_defense do nothing` (twice).
   - `minibossEnemy` and `bossEnemy`: `e.physical_defense` -> `e.defense`.
   - In `the migration points the minibosses ...` and `the migration points the chapter bosses ...`: `enemy["physical_defense"]` -> `enemy["defense"]`, `bossEnemy(it)["physical_defense"]` -> `bossEnemy(it)["defense"]`; expected values unchanged (`11`, `25`, `40`; `30, 35, 40, 45, 50`).
   - `a miniboss whose enemy was tuned keeps its enemy`: the insert becomes `insert into enemies (element, defense, crit_resistance) values (?, 14, 50) on conflict do nothing`, the select `select id from enemies where element = ? and defense = 14 and crit_resistance = 50`.
   - `migrate()` is not changed in this task (V16 still runs on the old columns until T9).
3. Run the gate.

**Tests**: integration (test-only change)
**Test cases**: every case of the two files passes with its current expected values and SQL states.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The backend suite passes.
- [x] `git grep -n -E "physical_defense|magical_defense" -- backend/src/test` lists only `EnemyDefenseMigrationIT.kt`, `PreviousBackendCompatibilityIT.kt` and the `EnemyRepositoryIT.kt` case `the defense is stored in the defense column and copied to the old columns until the contract`.
- [x] The commit touches exactly the 2 test files and this file.

**Commit**: `test(backend): build and read enemies through the defense column`

---

### Phase 3: Game

#### T5: Game unit fixtures in the new enemy shape [x]

**Owner**: test-engineer
**Goal**: Every unit test builds enemies as `{ element, defense, critResistance }`, keeping every asserted value, except the legacy payload tests that T7 rewrites (DEF-05; spec Fixtures AC 1, 2).
**Where**: `game/src/adapters/phaser/ClickerGame.test.js`
**Files**:
- Also changes: `game/src/domain/campaign/campaign.test.js`, `game/src/domain/combat/damage.test.js`, `game/src/domain/combat/monster.test.js`, `game/src/domain/skills/skillCombat.test.js`, `game/src/domain/skills/skillDamage.test.js`
- Read first: design § Fixture Conversion Rules (R1 to R6) and § Legacy Payload Tests (the rows marked "T7" and "unchanged" are not touched here, except the call conversion noted below)
**Depends on**: T4
**Requirement**: DEF-05

**Steps** (run `git grep -n -E "physicalDefense|magicalDefense" -- game/src` first and work file by file):

1. `campaign.test.js`: R1 on every literal (`monster`, `miniboss`, `boss` of the stats case, the definition `boss` and `miniboss`, the expected `stats` objects, `S3`, `SB`); the override `{ ...monster, physicalDefense: stage.number }` -> `{ ...monster, defense: stage.number }` and the expected `{ ...monster, physicalDefense: 2 }` -> `{ ...monster, defense: 2 }`.
2. `damage.test.js`: R3 on `enemy` and every call (12 calls with 4 arguments `enemy('FIRE', 0, 0, X)` -> `enemy('FIRE', 0, X)`; `enemy('FIRE', 80, 20)` -> `enemy('FIRE', 80)`). The case `never reads magicalDefense: an old payload with physicalDefense 0 and magicalDefense 80 deals 1` becomes `never reads magicalDefense: a payload with only magicalDefense 80 deals 1` with the defender literal `{ element: 'FIRE', magicalDefense: 80, critResistance: 0 }` (value 1). The case `meets the same defense whatever damageType an older attacker carries: physicalDefense 80 deals 0.2` becomes `... : defense 80 deals 0.2`. `reads defense before physicalDefense ...` is not touched.
3. `monster.test.js`: R1 on the two `stats` literals of `carries the stats it was given, fire without defense by default` and `keeps its stats when it respawns` (`{ element: 'WATER', defense: 5, critResistance: 7 }`, `{ element: 'NATURE', defense: 5, critResistance: 7 }`). `describe('defenseOf')` is not touched.
4. `skillCombat.test.js`: R3 on `stats` and every call (`stats('FIRE', 50, 10)` -> `stats('FIRE', 50)`, `stats('FIRE', 20, 20)` -> `stats('FIRE', 20)`, `stats('FIRE', 0, 0, 5)` -> `stats('FIRE', 0, 5)`, `stats('FIRE', 0, 0, 0)` -> `stats('FIRE', 0, 0)`, `stats('FIRE', 0, 0, 100)` -> `stats('FIRE', 0, 100)`, `stats('FIRE', 33, 33)` -> `stats('FIRE', 33)`, `stats('FIRE', 80, 80)` -> `stats('FIRE', 80)`); R5 `monster.stats.physicalDefense` -> `monster.stats.defense`; R6: `meets the one defense of an older payload with every Orina hit: physicalDefense 50 and magicalDefense 10 make Chuva de Meteoros 12.5 (E2)` -> `meets the one defense with every Orina hit: defense 50 makes Chuva de Meteoros 12.5 (E2)`.
5. `skillDamage.test.js`: R6 only: `meets the one defense with every hit: 2500 % against physicalDefense 90 deals 2.5` -> `... against defense 90 deals 2.5`.
6. `ClickerGame.test.js`:
   - The enemy-stats describe's `stats` helper: R3 and every call in that describe (`stats('WATER', 11, 22, 33)` -> `stats('WATER', 11, 33)`, `stats('LIGHT', 1, 2, 3)` -> `stats('LIGHT', 1, 3)`, `stats('DARKNESS', 30, 30, 30)` -> `stats('DARKNESS', 30, 30)`, `stats('FIRE', 0, 0, 100)` -> `stats('FIRE', 0, 100)`, `stats('FIRE', 0, 0, 30)` -> `stats('FIRE', 0, 30)`, `stats('FIRE', 0, 0, 10)` -> `stats('FIRE', 0, 10)`, `stats('LIGHT', 4, 5, 6)` -> `stats('LIGHT', 4, 6)`, `stats('FIRE', 50, 10)` -> `stats('FIRE', 50)`). The case `applies the defense of the monster: physicalDefense 50 of an old payload` keeps its title in this task (T7 rewrites it).
   - `applies the defense of a new payload: defense 50 takes half of a click`: R2 (`{ element: 'FIRE', defense: 50, critResistance: 0 }`).
   - The equipment describe's `stats = (element, physicalDefense = 0) => ...` -> `(element, defense = 0) => ({ element, defense, critResistance: 0 })`; calls unchanged.
   - `makes both hits critical against a critical resistance of 100`: R1 (`{ element: 'FIRE', defense: 0, critResistance: 100 }`).
   - `fire`: R3 as design (`(defense = 0, critResistance = 0) => ({ element: 'FIRE', defense, critResistance })`; `fire(20, 20, 20)` -> `fire(20, 20)`, `fire(50, 50, 0)` -> `fire(50)`); R5 in `shows the lowered defense on the enemy chips and keeps the stats of the monster itself` (`ctx.scene.monster.stats.defense` is 20).
   - Not touched: `shows defense over physicalDefense when a payload has both: Defesa 40%`, `shows Defesa 50% for an old payload with physicalDefense 50 and magicalDefense 10`.
7. Run the gate.

**Tests**: unit (test-only change; every asserted value kept)
**Gate**: `cd game && npm test`
**Done when**:

- [x] The unit suite passes with the same number of tests as before the task.
- [x] `git grep -n -E "physicalDefense|magicalDefense" -- game/src` prints only lines of `monster.js` (the `defenseOf` comment and code), `campaign.js` (comment) and of these tests: `monster.test.js` `describe('defenseOf')`; `damage.test.js` `never reads magicalDefense: a payload with only magicalDefense 80 deals 1`, `reads defense before physicalDefense ...`; `fight.test.js` `statsOf reads a legacy physicalDefense payload`; `monsterAffix.test.js` `reads physicalDefense of an old payload`; `talents.test.js` `reads physicalDefense of an old payload and writes defense`, `an old payload with physicalDefense 50 and Orina's passive reads defense 35`; `ClickerGame.test.js` `applies the defense of the monster: physicalDefense 50 of an old payload` (title only), `shows defense over physicalDefense ...`, `shows Defesa 50% for an old payload ...`.
- [x] The commit touches exactly the 6 test files above and this file.

**Commit**: `test(game): build unit test enemies with one defense`

---

#### T6: e2e fixtures, fake backend and review shots in the new enemy shape [x]

**Owner**: test-engineer
**Goal**: The e2e fixtures, the fake backend and the review shots send enemies as `{ element, defense, critResistance }`, keeping every asserted value (DEF-05; spec Fixtures AC 1, 2).
**Where**: `game/e2e/support/fakeBackend.js`
**Files**:
- Also changes (R2: the fixture already has `defense`; drop the two old keys): `game/e2e/support/affixFight.js`, `game/e2e/blackAwarenessStaffDamage.spec.js`, `game/e2e/earlyGameRebalance.spec.js`, `game/e2e/earlyGameRebalanceTalents.spec.js`, `game/e2e/heroTeam.spec.js`, `game/e2e/heroTeamCombat.spec.js` (`monsterOf` only), `game/e2e/heroTeamField.spec.js`, `game/e2e/heroTeamPassives.spec.js`, `game/e2e/minibossAdds.spec.js`, `game/e2e/minibossAddsSkills.spec.js`, `game/e2e/minibossAddsTarget.spec.js`, `game/e2e/talentTreeReworkCombat.spec.js`, `game/e2e/unifiedDamage.spec.js` (`enemy` only), `game/ui-review/earlyGameRebalance.shots.js`, `game/ui-review/heroTeam.shots.js`, `game/ui-review/minibossAdds.shots.js`, `game/ui-review/unifiedDamage.shots.js`
- Also changes (R1, R3, R4: the fixture has only the old keys; the old `physicalDefense` becomes `defense`): `game/e2e/bossReplayChapters.spec.js`, `game/e2e/campaignChapters.spec.js`, `game/e2e/clickPower.spec.js`, `game/e2e/combatHud.spec.js`, `game/e2e/elements.spec.js`, `game/e2e/equipment.spec.js`, `game/e2e/farm.spec.js`, `game/e2e/heroAscension.spec.js`, `game/e2e/heroes.spec.js`, `game/e2e/skills.spec.js`, `game/e2e/skillsAll.spec.js`, `game/e2e/talents.spec.js`, `game/e2e/talentTreeBranches.spec.js`, `game/e2e/talentTreeBranchesCard.spec.js`, `game/e2e/talentTreeRework.spec.js`, `game/e2e/uiRedesign.spec.js`, `game/ui-review/bossReplayChapters.shots.js`, `game/ui-review/campaignChapters.shots.js`, `game/ui-review/heroAscension.shots.js`, `game/ui-review/talentTreeBranches.shots.js`, `game/ui-review/talentTreeRework.shots.js`, `game/ui-review/uiRedesign.shots.js`
- Read first: design § Fixture Conversion Rules and § Legacy Payload Tests; `git grep -n -E "physicalDefense|magicalDefense" -- game/e2e game/ui-review` (the list to convert)
**Depends on**: T5
**Requirement**: DEF-05

**Steps**:

1. `fakeBackend.js` lines building the default chapter (`boss`, `monster`, `miniboss`): R2 (`{ element: 'DARKNESS', defense: 30, critResistance: 30 }`, `{ element, defense: 0, critResistance: 0 }`, `{ element, defense: 11 + i, critResistance: 12 + 2 * i }`).
2. Every R2 file in the list: drop `physicalDefense: ...` and `magicalDefense: ...` from the helper or literal.
3. Every R1 file: `physicalDefense: X, magicalDefense: Y` -> `defense: X`. `skillsAll.spec.js`: `const ARMORED = { ...bare('FIRE'), physicalDefense: 50 }` -> `{ ...bare('FIRE'), defense: 50 }` (R4). `uiRedesign.spec.js` and `uiRedesign.shots.js`: `bare = (element, defense = 0, critResistance = 0) => ({ element, defense, critResistance })`; `bare('NATURE', 10, 20, 30)` -> `bare('NATURE', 10, 30)`; `bare('FIRE', 10, 20, 30)` -> `bare('FIRE', 10, 30)` (R3).
4. `elements.spec.js`: replace the comment line `//  The enemies use the payload of the backend before unified-damage on purpose: the game reads physicalDefense as the defense (TD-002).` with `//  The enemies use the payload of the backend: { element, defense, critResistance }.`
5. Do not touch the two cases T7 rewrites: `heroTeamCombat.spec.js` `an old payload with physicalDefense 50 halves the ally hit too` and `unifiedDamage.spec.js` `Chuva de Meteoros meets the one defense of an old payload: ...`; nor `unifiedDamage.spec.js` `defense wins over physicalDefense when a payload has both: Defesa 40%`.
6. Check every `*.shots.js` parses: `node --check <file>` for each of the 10.
7. Run the gate.

**Tests**: e2e (test-only change; every asserted value kept)
**Gate**: `cd game && npm test && npx playwright test e2e/blackAwarenessStaffDamage.spec.js e2e/bossReplayChapters.spec.js e2e/campaignChapters.spec.js e2e/clickPower.spec.js e2e/combatHud.spec.js e2e/earlyGameRebalance.spec.js e2e/earlyGameRebalanceTalents.spec.js e2e/elements.spec.js e2e/equipment.spec.js e2e/farm.spec.js e2e/heroAscension.spec.js e2e/heroes.spec.js e2e/heroTeam.spec.js e2e/heroTeamCombat.spec.js e2e/heroTeamField.spec.js e2e/heroTeamPassives.spec.js e2e/minibossAdds.spec.js e2e/minibossAddsSkills.spec.js e2e/minibossAddsTarget.spec.js e2e/monsterAffixes.spec.js e2e/skills.spec.js e2e/skillsAll.spec.js e2e/talents.spec.js e2e/talentTreeBranches.spec.js e2e/talentTreeBranchesCard.spec.js e2e/talentTreeRework.spec.js e2e/talentTreeReworkCombat.spec.js e2e/uiRedesign.spec.js e2e/unifiedDamage.spec.js` (`monsterAffixes.spec.js` uses `affixFight.js`)
**Done when**:

- [x] The listed e2e files pass (a failure outside the changed lines is rerun alone twice with `--workers=1` before it counts as a flake).
- [x] `git grep -n -E "physicalDefense|magicalDefense" -- game/e2e game/ui-review` prints only the lines of the three `unifiedDamage.spec.js` / `heroTeamCombat.spec.js` cases of step 5.
- [x] The 10 shots files pass `node --check`.

**Commit**: `test(game): send e2e and review enemies with one defense`

---

#### T7: The game reads `defense` only [x]

**Owner**: game-dev
**Goal**: Drop the `physicalDefense` fallback, the three retired `MAGICAL_BREAK*` ids and the unused magical break icon, and pin that the old fields are ignored (DEF-04; spec Game AC 1 to 5, Q5, Q6).
**Where**: `game/src/domain/combat/monster.js`
**Files**:
- Also changes: `game/src/domain/campaign/campaign.js` (comment), `game/src/domain/combat/damage.js` (comment), `game/src/application/talents/talentCollection.js`, the tests of design § Legacy Payload Tests marked "T7" (`game/src/domain/combat/monster.test.js`, `damage.test.js`, `fight.test.js`, `monsterAffix.test.js`, `game/src/domain/talents/talents.test.js`, `game/src/adapters/phaser/ClickerGame.test.js`, `game/e2e/heroTeamCombat.spec.js`, `game/e2e/unifiedDamage.spec.js`), `game/src/application/talents/talentCollection.test.js`
- Deletes: `game/public/assets/talent-break-magical.png` (`git rm`)
- Read first: design § Game and § Legacy Payload Tests, `monster.js:1-12`, `campaign.js:8-14`, `damage.js:13-26`, `talentCollection.js:1-30`, `talentCollection.test.js` `describe('retired talents')`
**Depends on**: T6
**Requirement**: DEF-04

**Contract**: `defenseOf` as in design § Game. `RETIRED_TALENT_IDS`:

```js
//  Talents an older backend still answers; they left the catalog and are dropped on read (spec talent-tree-rework)
export const RETIRED_TALENT_IDS = [
    'BOSS_TIME', 'BOSS_TIME_G2', 'BOSS_TIME_G3',
    'CRIT_RESIST_BREAK', 'CRIT_RESIST_BREAK_G2', 'CRIT_RESIST_BREAK_G3'
];
```

**Removals allowed**: none. Each "T7" case of design § Legacy Payload Tests is rewritten (new title, same payload, new expected value from that table); the three `talentCollection.test.js` cases below keep their shape with retired ids that are still retired.

**Steps**:

1. `monster.js`: `defenseOf` and its comment as in design § Game.
2. `campaign.js` comment (lines 10-11): `where boss, monster and miniboss are { element, defense, critResistance }; a payload without them means DEFAULT_STATS. The drop rule ids ...` (keep the rest of the sentence). `damage.js` comment: drop `; \`defenseOf\` also reads an older payload`.
3. `talentCollection.js`: the contract above.
4. `git rm game/public/assets/talent-break-magical.png`; `git grep -n "talent-break-magical" -- game` must print nothing.
5. Rewrite the eleven "T7" cases of design § Legacy Payload Tests (titles, payloads and expected values exactly as the table), and add the new `damage.test.js` case `ignores physicalDefense of an old payload: physicalDefense 80 alone deals 1`.
6. `talentCollection.test.js` `describe('retired talents')`:
   - `drops the magical break of every grade from a loaded list` -> `drops the retired talents of every grade from a loaded list`: the list `[ talent('PHYSICAL_BREAK', 2), talent('BOSS_TIME', 5), talent('BOSS_TIME_G2', 1), talent('CRIT_RESIST_BREAK_G3'), talent('CLICK_DAMAGE') ]`; expected ids `[ 'PHYSICAL_BREAK', 'CLICK_DAMAGE' ]`; `collection.levelOf('BOSS_TIME')` is 0.
   - `drops it from the list an upgrade answers`: `talent('BOSS_TIME', 5)` in place of `talent('MAGICAL_BREAK', 5)`; expected `[ 'CLICK_DAMAGE' ]`.
   - `drops it from the list a reset answers`: `talent('CRIT_RESIST_BREAK')` in place of `talent('MAGICAL_BREAK')`; expected `[ 'COMBO' ]`.
   - `lists the nine retired ids` -> `lists the six retired ids`: the six ids of the contract.
7. Run the gate.

**Tests**: unit + e2e
**Test cases**: the eleven rows marked "T7" in design § Legacy Payload Tests with their expected values (`0`, `1`, `30`, `20`, `{ ..., defense: 0 }`, `0`, `maxHealth - 1`, `Darkness  Defesa 0%  Seu crítico: 0%`, `dealt` 2, chips `Water  Defesa 0%  Seu crítico: 40%` and `dealt` `25 * STAR`); the four `talentCollection.test.js` cases of step 6.

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/heroTeamCombat.spec.js e2e/unifiedDamage.spec.js e2e/talents.spec.js e2e/talentTreeRework.spec.js`
**Done when**:

- [x] The unit suite passes with one more test than before the task (the new `damage.test.js` case); the four e2e files pass.
- [x] `git grep -n "physicalDefense" -- game/src ':!*.test.js'` prints only the `defenseOf` comment line of `monster.js`.
- [x] `git grep -n -E "physicalDefense|magicalDefense" -- game` prints only lines of the tests of design § Legacy Payload Tests and the `monster.js` comment.
- [x] `game/public/assets/talent-break-magical.png` no longer exists.

**Commit**: `refactor(game): read the enemy defense from defense only`

---

### Phase 4: Author check of release 1 and the game

#### T8: Author check [x]

**Owner**: test-engineer
**Goal**: Every AC and edge case of DEF-01 to DEF-05 has a test that asserts its spec value, and the tests kill the injected faults.
**Where**: `.specs/features/defense-contract/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (§ Author check), the spec, the tests of T1 to T7, `scripts/sensor.mjs` (usage at its top)
**Depends on**: T7
**Requirement**: DEF-01, DEF-02, DEF-03, DEF-04, DEF-05

**Steps**:

1. Map each AC and edge case of DEF-01 to DEF-05 to its test (`file:line`), as in `.specs/features/reset-legacy-drops/tasks.md` § Author check.
2. Run with `node scripts/sensor.mjs mutants.json` (scratch file, not committed) at least: (M1) V19 without the `update enemies set defense = physical_defense` line; (M2) the trigger without `new.physical_defense := coalesce(...)`; (M3) the trigger without `new.defense := coalesce(...)`; (M4) V19 without `uk_enemies_defense`; (M5) `EnemyEntity.toDomain()` with defense 0; (M6) `EnemyStatsResponse` still answering `physicalDefense`; (M7) `defenseOf` back to `stats.defense ?? stats.physicalDefense ?? 0`; (M8) `RETIRED_TALENT_IDS` still listing `MAGICAL_BREAK`.
3. Append § Author check with the table, the mutant results and the suite totals; a surviving mutant or a missing AC becomes a fix task listed there with its owner.

**Tests**: e2e + unit + integration (runs the suites, writes no production code)
**Gate**: `cd backend && ./gradlew test && cd ../game && npm test && npx playwright test e2e/unifiedDamage.spec.js e2e/heroTeamCombat.spec.js`
**Done when**:

- [x] Every AC and edge case of DEF-01 to DEF-05 maps to a test; every mutant is killed or a fix task is listed.

**Commit**: `test: author check of the defense contract release 1`

---

### Phase 5: Contract

#### T9: V20 drops the old defense columns [ ]

**Owner**: kotlin-backend-dev
**Goal**: The contract step: no old column, key, trigger or function left; the release 1 backend keeps working on the result (DEF-06; spec Contract AC 1 to 5, Edge 3, Q2, Q8).
**Where**: `migration/V20__enemy_defense_contract.sql` (new)
**Files**:
- Also changes: `test/adapter/repository/EnemyDefenseMigrationIT.kt`, `test/adapter/repository/PreviousBackendCompatibilityIT.kt`, `test/adapter/repository/EarlyGameRebalanceMigrationIT.kt`, `test/adapter/repository/EnemyRepositoryIT.kt`
- Read first: design § V20 and § V16 Replay, the four test files as T1 to T4 left them, `.specs/features/campaign-chapters/tasks.md` T14 (the pattern)
**Depends on**: T8
**Requirement**: DEF-06

**Precondition** (step 0; stop, do not commit, and report the contract as pending if any check fails):

1. `./publish.sh` is running on `DESKTOP-RCMC353` (`hostname`; the `cloudflared` and watcher `node` processes run, `docker ps` shows the active backend slot).
2. `node -e "const s=JSON.parse(require('fs').readFileSync('.deploy-state','utf8')); console.log(s.active.commit, s.previous)"` prints an `active.commit` for which `git merge-base --is-ancestor <T3 commit> <active.commit>` exits 0, and `previous` is `null` (the 5-minute rollback window of that deploy has closed, so the backend before this feature can no longer come back).
3. No other commit is pushed between the T9 push and its deploy (`.deploy-state` `active.commit` equals the T9 commit afterwards).

**Contract**: design § V20, byte for byte.

**"Previous backend" from this task on**: the rollback target of the T9 deploy is the release 1 backend (T3 or a later commit), whose entities are the current ones (it maps only `defense`) and whose migrations are V1 to V19. Compatibility with the backend before this feature (`171f518`) ends here by design (DEF-06 AC 2): V20 drops the columns it maps.

**Removals allowed** (each removes a replay of the backend before this feature or an assertion whose subject V20 drops):

- `PreviousBackendCompatibilityIT`: the `physical_defense` and `magical_defense` entries of the `enemies` map (replaced by `"defense" to "integer"`) and the case `the previous backend writes and reads enemies through physical_defense and magical_defense` (replaced by the `defense` case below).
- `EnemyRepositoryIT`: the `physical_defense` and `magical_defense` reads of `the defense is stored in the defense column and copied to the old columns until the contract` (the case becomes `the defense is stored in the defense column`).

**Steps**:

1. Check the precondition.
2. Write `V20__enemy_defense_contract.sql` from design § V20.
3. `EnemyDefenseMigrationIT`: add the two cases below. The scratch cases of T1 stay as they are (they migrate to V19 only). Class KDoc: append `` `V20__enemy_defense_contract.sql` drops the old columns, their key and the trigger once no running backend reads them. ``
4. `PreviousBackendCompatibilityIT`:
   - Class KDoc becomes: `AD-016: the release before V20 (the defense-contract release 1, last migration V19) must keep starting and serving on the database after V20. Its entities are the current ones (SchemaValidationIT); these checks replay its column types, its enemy read and write paths and Flyway's validation of its own migrations V1 to V19. Compatibility with the backend before defense-contract (commit 171f518) ended by design at V20, which drops the old defense columns it maps. Booting a previous image itself is not executed here.`
   - `enemies` map: `mapOf("id" to "bigint", "element" to "character varying", "defense" to "integer", "crit_resistance" to "integer")`.
   - Replace the T1 enemy case by `the previous backend writes and reads enemies through defense`: inside `rolledBack { }`, `jdbc.update("insert into enemies (element, defense, crit_resistance) values (?, ?, ?) on conflict (element, defense, crit_resistance) do nothing", "NATURE", 88, 98)` returns 1; `select id from enemies where element = ? and defense = ? and crit_resistance = ?` returns one id; `select e.defense from enemies e join chapters c on c.boss_enemy_id = e.id where c.number = 1` is 30.
   - Every `previousReleaseStartsOnMigratedSchema` call gets `futureMigrations` + 1: `12` -> 8, `13` -> 7, `14` -> 6, `15` -> 5, `17` -> 3, `18` -> 2.
   - Add `the release 1 of the defense contract starts on the migrated schema and its validation ignores V20`: `previousReleaseStartsOnMigratedSchema(lastVersion = 19, futureMigrations = 1)`.
5. `EarlyGameRebalanceMigrationIT`: `migrate()` and its KDoc exactly as design § V16 Replay.
6. `EnemyRepositoryIT`: `the defense is stored in the defense column and copied to the old columns until the contract` -> `the defense is stored in the defense column`: `select defense from enemies where id = ?` is 81.
7. Run the gate, commit, push alone, and watch `.deploy-state` until `active.commit` is the T9 commit (or report the failed deploy with the Dozzle log line).

**Tests**: integration
**Test cases**:

- `EnemyDefenseMigrationIT` `V20 drops the old columns, their key and the trigger` (DEF-06 AC 1): `select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'enemies' and column_name in ('physical_defense', 'magical_defense')` is 0; `select count(*) from pg_constraint where conname = 'uk_enemies_attributes'` is 0; `select count(*) from pg_trigger where tgname = 'enemies_defense_sync'` is 0; `select count(*) from pg_proc where proname = 'enemies_defense_sync'` is 0 (the scratch schema is dropped after each test, so only the main schema's function could match).
- `EnemyDefenseMigrationIT` `a database at V19 keeps every defense after V20`: `scratchAt("19")`; insert `('WATER', 12, 3)` and `('FIRE', 40, 9)` into `defense_expand_check.enemies (element, defense, crit_resistance)`; `scratchAt("20")`; `select defense from defense_expand_check.enemies order by id` is `[12, 40]`.
- `PreviousBackendCompatibilityIT`: the schema check with the new `enemies` map; `the previous backend writes and reads enemies through defense` (1 row, one id, 30); the seven validation cases with the counts of step 4.
- `EarlyGameRebalanceMigrationIT`: every case passes with its current expected values (DEF-06 AC 4).
- `EnemyRepositoryIT`: `the defense is stored in the defense column` (81).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The precondition held and is quoted in the commit body (the `active.commit` and `previous` printed in step 0).
- [ ] The backend suite passes, including `SchemaValidationIT`.
- [ ] `git grep -n -E "physical_defense|magical_defense" -- backend/src` prints only `V1__schema.sql`, `V16__early_game_rebalance.sql`, `V19__enemy_defense_expand.sql`, `V20__enemy_defense_contract.sql`, `EnemyDefenseMigrationIT.kt` and the `String.replace` lines of `EarlyGameRebalanceMigrationIT.migrate()` (DEF-06 AC 5).
- [ ] The commit touches exactly the migration, the 4 test files and this file, and is pushed alone; `.deploy-state` `active.commit` is the T9 commit afterwards.

**Commit**: `feat(backend): drop the old enemy defense columns`

---

#### T10: Author check of the contract [ ]

**Owner**: test-engineer
**Goal**: DEF-06 AC 1 to 5 and Edge 3 map to tests that kill the injected faults.
**Where**: `.specs/features/defense-contract/tasks.md` (§ Author check, a "Contract" part appended)
**Files**:
- Read first: the tests of T9, `scripts/sensor.mjs`
**Depends on**: T9
**Requirement**: DEF-06

**Steps**:

1. Map DEF-06 AC 1 to 5 and Edge 3 to tests (`file:line`).
2. Run with `node scripts/sensor.mjs` at least: (M9) V20 without `drop trigger`; (M10) V20 without `drop column if exists magical_defense`; (M11) the V16 replay without replacement 4 (`uk_enemies_attributes`); (M12) `previousReleaseStartsOnMigratedSchema(lastVersion = 19, futureMigrations = 0)`.
3. Append the Contract part of § Author check; a survivor becomes a fix task with its owner.

**Tests**: integration (runs the suite, writes no production code)
**Gate**: `cd backend && ./gradlew test`
**Done when**:

- [ ] DEF-06 maps to tests; every mutant is killed or a fix task is listed.

**Commit**: `test: author check of the defense contract step`

---

## Validation Tables

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 (phase 1) | Phase 2 | ✅ Match |
| T5 | T4 (phase 2) | Phase 3 start | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 (phase 3) | Phase 4 | ✅ Match |
| T9 | T8 (phase 4) | Phase 5 start | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Migration | integration | integration | ✅ OK |
| T2 | Repository | integration | integration | ✅ OK |
| T3 | Web | integration | integration | ✅ OK |
| T4 | Test fixtures | integration | integration | ✅ OK |
| T5 | Test fixtures | unit | unit | ✅ OK |
| T6 | Test fixtures | e2e | e2e | ✅ OK |
| T7 | Game domain, application | unit + e2e | unit + e2e | ✅ OK |
| T8 | check | - | runs | ✅ OK |
| T9 | Migration | integration | integration | ✅ OK |
| T10 | check | - | runs | ✅ OK |

---

## Author check

Run on 2026-11-28 by `test-engineer` (T8, release 1 and the game). Paths: `B` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `G` = `game/src/`, `E` = `game/e2e/`. DEF-06 (T9) is pending and not part of this check.

### AC to assertion table

| AC | Spec value | Unit / integration test (`file:line`) | e2e |
| --- | --- | --- | --- |
| DEF-01 AC 1 | every row `defense` = its `physical_defense` (12 and 40 from rows 12/12 and 40/55) | `B adapter/repository/EnemyDefenseMigrationIT.kt:69` | n/a (no player-visible value) |
| DEF-01 AC 2 | old insert (86, 86) -> `defense` 86 | `B ...EnemyDefenseMigrationIT.kt:80` | n/a |
| DEF-01 AC 3 | new insert (defense 87) -> `physical_defense` 87, `magical_defense` 87 | `B ...EnemyDefenseMigrationIT.kt:131` | n/a |
| DEF-01 AC 4 | defense 91 or -1 -> SQL state 23514 | `B ...EnemyDefenseMigrationIT.kt:167`; column type, not null and `ck_enemies_defense` at `:152` | n/a |
| DEF-01 AC 5 | repeat of element, defense, critical resistance -> 23505 | `B ...EnemyDefenseMigrationIT.kt:178`; `:188` (added by T8: `magical_defense` differs, so only `uk_enemies_defense` can fire); `B adapter/repository/SchemaConstraintsIT.kt:323` | n/a |
| DEF-01 AC 6 | V1 to V18 release validates, runs none, V19 is `FUTURE_SUCCESS` | `B ...PreviousBackendCompatibilityIT.kt:231` (`futureMigrations = 1`) | n/a |
| DEF-01 AC 7 | the previous read path reads 81 and 81 for a row the new backend inserted with 81 | `B adapter/repository/EnemyRepositoryIT.kt:64` (81, 81, 81); `B ...EnemyDefenseMigrationIT.kt:131` (87, 87); `B ...PreviousBackendCompatibilityIT.kt:179` (the previous write and read shape) | n/a |
| DEF-01 AC 8 | two rows sharing element, physical defense, critical resistance -> V19 fails, no `defense` column, no V19 history row | `B ...EnemyDefenseMigrationIT.kt:207` | n/a |
| DEF-01 Edge 1 | the previous backend starts and serves enemies | `B ...PreviousBackendCompatibilityIT.kt:60` (entity schema check), `:179`, `:231` | n/a |
| DEF-01 Edge 2 | every seeded row holds one value in the three columns | `B ...EnemyDefenseMigrationIT.kt:118` (added by T8: count > 0 and 0 rows where `defense` differs from either old column); `B ...EnemyRepositoryIT.kt:64` | n/a |
| DEF-01 Edge 4 | physical 85, magical 86 -> `defense` 85 | `B ...EnemyDefenseMigrationIT.kt:103` (added by T8: reads 85, 85, 86) | n/a |
| DEF-02 AC 1 | `EnemyStats(WATER, 81, 97)` saved naming `element`, `defense`, `crit_resistance`; a saved chapter reads back equal | `B ...EnemyRepositoryIT.kt:64`; `B adapter/repository/ChapterRepositoryIT.kt:196` (boss column 55), `:157` (read back equal) | n/a |
| DEF-02 AC 2 | same stats twice -> same id, one row | `B ...EnemyRepositoryIT.kt:38`; `:47` (a differing attribute -> a new id) | n/a |
| DEF-02 AC 3 | `EnemyStats.defense` from the column `defense` | `B ...ChapterRepositoryIT.kt:157` (rows written by SQL read back 85 and 88); mutant M5 | n/a |
| DEF-02 AC 4 | `backend/src/main` names the old names only in V1, V16, V19 | `B DefenseContractSourceTest.kt:31`, `:40` (added by T8; V20 is allowed for T9); mutant M10 | n/a |
| DEF-03 AC 1 | progress enemies carry `element`, `defense`, `critResistance`, no old key | `B adapter/web/ProgressControllerIT.kt:141` (boss, phase monster, miniboss) | the e2e payloads are a fake backend, so the real shape is pinned by this IT; the specs below read `defense` only |
| DEF-03 AC 2 | farm enemies follow the same rule | `B adapter/web/FarmControllerIT.kt:304` (boss 35, no old key); `:330` (added by T8: the key set of the boss, the 10 monsters and the 10 minibosses is exactly `element`, `defense`, `critResistance`, both numbers `Int`) | same as AC 1 |
| DEF-03 AC 3 | chapter 1 boss `defense` 30 | `B ...ProgressControllerIT.kt:141` (`definition.boss.defense` 30) | `E unifiedDamage.spec.js:102` (a new payload shows `Defesa 40%`) |
| DEF-04 AC 1 | a payload without `defense` reads 0 whatever `physicalDefense`, `magicalDefense` | `G domain/combat/monster.test.js:228`, `:232`; `G domain/combat/damage.test.js:31`, `:49` (deals 1); `G domain/combat/fight.test.js:160` (reads 30); `G domain/combat/monsterAffix.test.js:38` (20); `G domain/talents/talents.test.js:151`, `:338`; `G adapters/phaser/ClickerGame.test.js:2051` (`maxHealth - 1`), `:2073` | `E heroTeamCombat.spec.js:164` (`dealt` 2) |
| DEF-04 AC 2 | Orina 3 stars, critical 40 %, `{ WATER, physicalDefense 50, magicalDefense 10 }` -> `Water  Defesa 0%  Seu crítico: 40%` and Chuva de Meteoros 25 x 1.4 = 35 | `G adapters/phaser/ClickerGame.test.js:2073` (text of the same shape) | `E unifiedDamage.spec.js:92` (text and `dealt` `25 * STAR`, `STAR` 1.4) |
| DEF-04 AC 3 | `defense` 40 and `physicalDefense` 70 -> 40 | `G domain/combat/monster.test.js:220`; `G domain/combat/damage.test.js:43` (0.6); `G adapters/phaser/ClickerGame.test.js:2067` (`Defesa 40%`) | `E unifiedDamage.spec.js:115` (`Defesa 40%`, `dealt` `STAR * 0.6`) |
| DEF-04 AC 4 | `RETIRED_TALENT_IDS` = the six `BOSS_TIME*` and `CRIT_RESIST_BREAK*` ids | `G application/talents/talentCollection.test.js:197` (`toEqual` of the six); mutant M8 | `E unifiedDamage.spec.js:208` (no `talent-MAGICAL_BREAK*` node) |
| DEF-04 AC 5 | `talent-break-magical.png` is gone and no file under `game/` names it | `G defenseContract.test.js:63` (added by T8) | n/a (no rendered asset) |
| DEF-05 AC 1 | no `game` file names `physicalDefense` or `magicalDefense` except design § Legacy Payload Tests and the `monster.js` comment | `G defenseContract.test.js:56` (added by T8; scans `game/src`, `game/e2e`, `game/ui-review` and the rest of `game/`); mutant M11 | n/a |
| DEF-05 AC 2 | the conversion keeps every asserted value | CI run `46106313665`: game unit 2492 of 2492 and e2e 798 of 798 pass on the converted fixtures | same run |
| DEF-05 AC 3 | no backend test names the old columns except `EnemyDefenseMigrationIT` and `PreviousBackendCompatibilityIT` | `git grep -n -E "physical_defense\|magical_defense" -- backend/src/test` lists those two and `EnemyRepositoryIT.kt:67` (note 1) | n/a |

Every player-visible AC (DEF-04 AC 1 to 4) has an e2e assertion. The spec names no CSS property, so there is no `toHaveCSS` check (spec Out of Scope: no player-visible change).

Notes:

1. DEF-05 AC 3 names two files, but task T2 keeps the `EnemyRepositoryIT` case `the defense is stored in the defense column and copied to the old columns until the contract` (`:64`) on purpose: it is also the Edge 2 evidence. T9 turns it into `the defense is stored in the defense column`. Not a gap.
2. For T9: `EnemyDefenseMigrationIT.kt:118` (main schema, reads `physical_defense` and `magical_defense`) must go or be rewritten with V20. The cases at `:152` and `:178` run on the main schema too; after V20 they must read `defense` and `uk_enemies_defense` only. `DefenseContractSourceTest` already allows the V20 file.

### Mutants

Run in CI (`workflow_dispatch`, `suites=false`) on `ci/defense-contract-tests` at `2571715b`, run `46105777413`. Each runs one Gradle test class or one Vitest file. Result: 12 mutants, 12 killed, 0 survived, 0 invalid, isolation ok.

| Mutant | Fault | Killed by |
| --- | --- | --- |
| M1 | V19 without `update enemies set defense = physical_defense` | `EnemyDefenseMigrationIT` |
| M2 | trigger without `new.physical_defense := coalesce(...)` | `EnemyDefenseMigrationIT` |
| M3 | trigger without `new.defense := coalesce(...)` | `EnemyDefenseMigrationIT` |
| M4 | V19 without `uk_enemies_defense` | `EnemyDefenseMigrationIT` |
| M5 | `EnemyEntity.toDomain()` with defense 0 | `ChapterRepositoryIT` |
| M6 | `EnemyStatsResponse` still answering `physicalDefense` | `ProgressControllerIT` |
| M6b | the same fault, read through `GET /farm` | `FarmControllerIT` |
| M7 | `defenseOf` back to `stats.defense ?? stats.physicalDefense ?? 0` | `monster.test.js` |
| M8 | `RETIRED_TALENT_IDS` listing `MAGICAL_BREAK` | `talentCollection.test.js` |
| M9 | trigger filling `defense` from `magical_defense` (Edge 4) | `EnemyDefenseMigrationIT` (the case at `:103`, added by T8) |
| M10 | a backend main file naming `physical_defense` | `DefenseContractSourceTest` |
| M11 | a game source naming `physicalDefense` | `defenseContract.test.js` |

### Suites

CI Tests run `46106313665` of `de9b77c8` (branch `ci/defense-contract-tests`, the T7 tree `b21a2dda` plus the T8 tests): backend 1395 of 1395, game unit 2492 of 2492, e2e 798 of 798, deploy-scripts 306 of 306. JaCoCo lines 98.49 % and branches 93.72 %; game lines 98.73 % and branches 95.10 %; e2e lines 94.51 %.

### Fix tasks

None. Gaps found and closed with tests only (no production change): Edge 2 over the whole seed, Edge 4 (physical 85, magical 86), DEF-01 AC 5 isolated from `uk_enemies_attributes`, the `GET /farm` enemy key set (DEF-03 AC 2), and the new guards for DEF-02 AC 4, DEF-04 AC 5 and DEF-05 AC 1. Spec row DEF-04 was still `Pending` after T7 and is now `Implementing`.
