# Defense Contract Specification

**Status**: Approved by the owner on 2026-11-26 (recommended defaults). Pays TD-002, the contract step of `unified-damage` (AD-021). Runs after `tech-debt-polish` and before `portuguese-text`.

## Problem Statement

`unified-damage` (AD-021, v0.5.0) left the game with one enemy defense but kept the old storage and payload so the previous backend and Worker kept working: `enemies.physical_defense` holds the defense, `enemies.magical_defense` is a write-only copy, the progress and farm payloads repeat `defense` as `physicalDefense` and `magicalDefense`, and the game reads `defense ?? physicalDefense ?? 0`. Two columns and two fields now carry one value, and about 40 test files still build enemies in the old shape. This feature renames the column to `defense`, drops `magical_defense`, drops the two API fields and the game fallback, and converts the fixtures, without ever breaking the backend that runs before each step (AD-016 expand/contract).

## Facts From the Code and Production (not decisions)

Checked on `main` at `55caf5b` and on the production stack on 2026-11-26.

- Production runs on the local blue-green stack (`publish.sh` is running on `DESKTOP-RCMC353`; the Supabase cutover is on hold). `.deploy-state`: active slot `green` at `171f518` (contains the `unified-damage` release `7de3208` and `reset-legacy-drops` up to T5), `previous` null. Flyway on the production database is at V18 (`reset legacy`). The Worker is published from `origin/main` and has read `defense` first since v0.5.0.
- The production `enemies` table has 224 rows, 0 rows where `physical_defense <> magical_defense`, and 0 groups of more than one row with the same `(element, physical_defense, crit_resistance)` (read-only query of 2026-11-26).
- Schema (`V1__schema.sql:55-61`): `enemies(id, element, physical_defense integer not null check 0..90, magical_defense integer not null check 0..90, crit_resistance integer not null check 0..100)`, `uk_enemies_attributes unique (element, physical_defense, magical_defense, crit_resistance)`. JPA runs with `ddl-auto: validate`, which checks the mapped columns and types and ignores extra columns.
- Enemies are written only by `EnemyRepository.idOf` (`adapter/repository/EnemyRepository.kt`), a native `insert ... on conflict (element, physical_defense, magical_defense, crit_resistance) do nothing` followed by `findByElementAndPhysicalDefenseAndMagicalDefenseAndCritResistance`, called by `ChapterRepository.save` when the seeder stores a chapter that does not exist yet. No code updates an enemy row. `EnemyEntity.toDomain()` reads `physicalDefense`.
- The API: `EnemyStatsResponse(element, defense, physicalDefense, magicalDefense, critResistance)` (`adapter/web/ProgressController.kt:26-43`), used by `GET /progress` and `GET /farm`.
- The game: `defenseOf = (stats) => stats.defense ?? stats.physicalDefense ?? 0` (`game/src/domain/combat/monster.js:8`), used by `damage.js`, `fight.js`, `monsterAffix.js`, `skillDamage.js`, `talents.js` and `ClickerGame.showEnemyStats`. `RETIRED_TALENT_IDS` (`game/src/application/talents/talentCollection.js:8`) lists `MAGICAL_BREAK`, `MAGICAL_BREAK_G2`, `MAGICAL_BREAK_G3` (TD-002) and the six `BOSS_TIME*` and `CRIT_RESIST_BREAK*` ids of `talent-tree-rework`. `game/public/assets/talent-break-magical.png` is unused (its `-g2` and `-g3` were never added).
- Tests that name the old columns or fields: backend `ChapterRepositoryIT`, `EnemyRepositoryIT`, `SchemaConstraintsIT`, `EarlyGameRebalanceMigrationIT` (it also re-runs the text of `V16__early_game_rebalance.sql`, which names both old columns and `uk_enemies_attributes`), `ProgressControllerIT`, `FarmControllerIT`; game 9 unit files, 29 e2e files and `e2e/support/fakeBackend.js`, `e2e/support/affixFight.js`, 10 `ui-review/*.shots.js` files.
- Migrations: V18 is the latest; this feature takes V19 and V20.

## Goals

- [ ] `enemies` holds the defense in one column `defense`; `physical_defense`, `magical_defense` and `uk_enemies_attributes` are gone after the contract step.
- [ ] The progress and farm payloads answer `defense` only.
- [ ] The game reads `defense` only; no test, fixture or review shot builds an enemy with `physicalDefense` or `magicalDefense`, except the tests that pin that the game ignores them.
- [ ] Every deploy of the feature keeps the backend before it working on the migrated database (AD-016).

## Out of Scope

| Feature | Reason |
| --- | --- |
| Renaming the talent id `PHYSICAL_BREAK` and its icon files `talent-break-physical*.png` | Stored in `player_talents` and in the catalog; a rename is its own expand/contract with no player gain. AD-021 keeps the id |
| The `BOSS_TIME*` and `CRIT_RESIST_BREAK*` ids of `RETIRED_TALENT_IDS` | They belong to `talent-tree-rework`, not to TD-002 |
| Changing any defense value or rule | Data and rules stay as `unified-damage` and `early-game-rebalance` left them |
| Rewriting `V16__early_game_rebalance.sql` or any applied migration | Flyway validates checksums; applied files never change |
| `backend/docs/adr/0009-normalized-schema.md` | A historical decision record; the column change is recorded in this spec and in AD-021's status |
| A ui review | No player-visible change: the enemy line, the numbers and the talents look and behave the same |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| **Q1** How many releases | **Recommended**: two backend releases. Release 1 (expand, tasks T1 to T3): V19 adds `defense`, copies `physical_defense` into it, adds a `before insert` trigger that fills `defense` from `physical_defense` and the two old columns from `defense`, makes `defense` not null with its check and a unique key `uk_enemies_defense (element, defense, crit_resistance)`; the backend maps and writes only `defense`; the API drops the two fields. Release 2 (contract, task T9): V20 drops the trigger, its function, `uk_enemies_attributes`, `physical_defense` and `magical_defense` | The trigger lets the pre-feature backend and the new one share the table during the 5-minute rollback window of release 1, so the new backend can stop reading and writing the old columns in the same release. Without it, a third release would be needed (write both, then stop writing, then drop) | y (owner, 2026-11-26: recommended defaults) |
| **Q2** When the contract runs | **Recommended**: only when `./publish.sh` runs, `.deploy-state` `active.commit` contains the T2 commit and `previous` is null (the 5-minute rollback window of that deploy has closed). Pushed alone, never in the same push as release 1 | Pushed together, the watcher deploys only the newest commit and keeps the pre-feature backend as the rollback target, which maps the dropped columns (the `campaign-chapters` T13/T14 rule) | y (owner, 2026-11-26: recommended defaults) |
| **Q3** When the API drops `physicalDefense` and `magicalDefense` | **Recommended**: in release 1 (T3). The live Worker has read `defense` first since v0.5.0 (2026-11-19); a browser still running a game older than v0.5.0 would read every enemy defense as 0 until it reloads | AD-016 asks the previous backend to keep working, which the API change does not touch; a week-old open tab is not worth a third release | y (owner, 2026-11-26: recommended defaults) |
| **Q4** When the game drops the fallback | **Recommended**: any time after the fixtures are converted (T5, T6 before T7); it does not wait for a backend deploy, because every backend since v0.5.0 answers `defense` | The game and the backend deploy independently | y (owner, 2026-11-26: recommended defaults) |
| **Q5** What the game does with a payload that has only `physicalDefense` | **Recommended**: reads defense 0, like any payload without `defense` (`DEFAULT_STATS` rule) | No backend sends that shape after v0.5.0 | y (owner, 2026-11-26: recommended defaults) |
| **Q6** Unused asset and retired ids | **Recommended**: delete `game/public/assets/talent-break-magical.png`; remove only the three `MAGICAL_BREAK*` ids from `RETIRED_TALENT_IDS` | Both are named by TD-002; the backend has not answered `MAGICAL_BREAK*` since V11 deleted the rows | y (owner, 2026-11-26: recommended defaults) |
| **Q7** A database where two enemies share element, defense and critical resistance | **Recommended**: no deduplication; V19 fails on the unique key, Flyway rolls it back (PostgreSQL runs each migration in a transaction), the deploy fails and the old slot keeps serving | Production has 0 such groups (Facts); every seed since v0.5.0 writes equal values; a failed deploy is safe | y (owner, 2026-11-26: recommended defaults) |
| **Q8** The re-run of V16 in `EarlyGameRebalanceMigrationIT` after V20 | **Recommended**: the test runs the text of V16 with four literal replacements that map the dropped names to `defense` and `uk_enemies_defense` (design § V16 replay), so every assertion is kept | V16 never runs again on a database that has V20; its replay is a regression test of its other sections | y (owner, 2026-11-26: recommended defaults) |
| Implicit dimensions | Input bounds: `defense` 0 to 90 checked by the database. Failure: each migration is one transaction; a failed deploy keeps the old slot. Retry/idempotency: V19 uses `add column if not exists`, `update ... where defense is null`, `create or replace function`, `drop trigger if exists`; the enemy insert stays `on conflict do nothing`. Concurrency: two slots share the table only during the rollback window, handled by the trigger. Auth, rate limits, observability, external dependencies, data lifecycle: N/A, because no endpoint, permission, log line or retention changes | Large-scope sweep | y |

**Open questions:** none. The owner approved the recommended defaults Q1 to Q8 on 2026-11-26.

---

## User Stories

### P1: One defense column, safe for the backend before it ⭐ MVP

**User Story**: As the owner, I want the enemy defense stored once under its real name, without a deploy ever breaking the backend that runs before it.

**Why P1**: The storage half of TD-002.

**Acceptance Criteria**:

1. WHEN V19 runs on a database with enemy rows THEN every row SHALL hold `defense` equal to its `physical_defense`.  <!-- event-driven -->
2. WHEN a row is inserted naming only `element`, `physical_defense`, `magical_defense` and `crit_resistance` (the pre-feature backend) THEN the database SHALL store `defense` equal to `physical_defense`.  <!-- event-driven -->
3. WHEN a row is inserted naming only `element`, `defense` and `crit_resistance` (the new backend) THEN the database SHALL store `physical_defense` and `magical_defense` equal to `defense`.  <!-- event-driven -->
4. IF an insert gives `defense` 91 or -1 THEN the database SHALL reject it with SQL state 23514.  <!-- unwanted-behavior -->
5. IF a plain insert repeats the `element`, `defense` and `crit_resistance` of an existing row THEN the database SHALL reject it with SQL state 23505.  <!-- unwanted-behavior -->
6. WHEN V19 has run THEN the pre-feature release (migrations V1 to V18) SHALL validate its own migrations, run none, and see every later version as `FUTURE_SUCCESS`.  <!-- event-driven -->
7. WHEN V19 has run THEN the read path of the pre-feature release (`select physical_defense, magical_defense ... from enemies`) SHALL read, for a row the new backend inserted with defense 81, the values 81 and 81.  <!-- event-driven -->
8. IF two existing rows share `element`, `physical_defense` and `crit_resistance` THEN V19 SHALL fail and leave the schema as V18 left it.  <!-- unwanted-behavior -->

**Independent Test**: An integration test runs the pre-feature insert and the new insert on the migrated database and reads all three columns.

---

### P1: The backend reads and writes only `defense` ⭐ MVP

**User Story**: As the owner, I want the backend code to know one defense so that the old columns can go.

**Acceptance Criteria**:

1. WHEN the backend saves a chapter THEN it SHALL insert each new enemy naming only `element`, `defense` and `crit_resistance`, and SHALL read it back equal to its `EnemyStats`.  <!-- event-driven -->
2. WHEN the same `EnemyStats` are saved twice THEN the backend SHALL return the same id and leave one row.  <!-- event-driven -->
3. WHEN the backend loads a chapter THEN each `EnemyStats.defense` SHALL come from the column `defense`.  <!-- event-driven -->
4. The backend source under `backend/src/main` SHALL NOT name `physical_defense`, `magical_defense`, `physicalDefense` or `magicalDefense`, except the applied migration files V1, V16 and V19.  <!-- ubiquitous -->

**Independent Test**: `EnemyRepositoryIT` saves `EnemyStats(WATER, 81, 97)` twice and reads one row with `defense` 81.

---

### P1: The payload answers `defense` only ⭐ MVP

**User Story**: As the owner, I want the progress and farm payloads to carry one defense field.

**Acceptance Criteria**:

1. WHEN `GET /progress` answers THEN every enemy (`definition.boss`, `definition.stages[*].monster`, `definition.stages[*].miniboss`) SHALL carry `element`, `defense` and `critResistance` and SHALL NOT carry `physicalDefense` or `magicalDefense`.  <!-- event-driven -->
2. WHEN `GET /farm` answers THEN every enemy of its `definition` SHALL follow the same rule.  <!-- event-driven -->
3. WHEN the chapter 1 boss is read through `GET /progress` THEN `definition.boss.defense` SHALL be 30, as today.  <!-- event-driven -->

**Independent Test**: `ProgressControllerIT` reads `definition.boss` without the two keys and with `defense` 30.

---

### P1: The game reads `defense` only ⭐ MVP

**User Story**: As the owner, I want the game to stop reading the old fields so that the tolerant reader and its rollout list can go.

**Acceptance Criteria**:

1. The game SHALL read an enemy's defense only from `defense`; a payload without `defense` SHALL read 0, whatever its `physicalDefense` and `magicalDefense`.  <!-- ubiquitous -->
2. WHEN Orina (3 stars, critical chance 40 %) fights a monster whose payload is `{ element: 'WATER', physicalDefense: 50, magicalDefense: 10, critResistance: 0 }` THEN the enemy line SHALL read `Water  Defesa 0%  Seu crítico: 40%` and Chuva de Meteoros SHALL deal 25 x 1.4 = 35.  <!-- event-driven -->
3. WHEN a payload has `defense` 40 and `physicalDefense` 70 THEN the game SHALL use 40 (`Defesa 40%`).  <!-- event-driven -->
4. The game SHALL keep `RETIRED_TALENT_IDS` equal to `BOSS_TIME`, `BOSS_TIME_G2`, `BOSS_TIME_G3`, `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2`, `CRIT_RESIST_BREAK_G3`.  <!-- ubiquitous -->
5. The repository SHALL NOT contain `game/public/assets/talent-break-magical.png`, and no file under `game/` SHALL name it.  <!-- ubiquitous -->

**Independent Test**: A unit test calls `defenseOf({ physicalDefense: 50, magicalDefense: 10 })` and gets 0; an e2e test shows `Defesa 0%` for that payload.

---

### P1: Fixtures in the new shape ⭐ MVP

**User Story**: As the team, I want every test to build enemies the way the backend sends them.

**Acceptance Criteria**:

1. WHEN the fixtures are converted THEN no file under `game/src` (tests), `game/e2e` or `game/ui-review` SHALL name `physicalDefense` or `magicalDefense`, except the test cases listed in design § Legacy payload tests, which pin Game AC 1 to 3.  <!-- event-driven -->
2. The conversion SHALL keep every asserted value of every converted test.  <!-- ubiquitous -->
3. WHEN the release 1 tasks are done THEN no backend test SHALL name `physical_defense` or `magical_defense`, except `EnemyDefenseMigrationIT` and `PreviousBackendCompatibilityIT`.  <!-- event-driven -->

**Independent Test**: `git grep -n -E "physicalDefense|magicalDefense" -- game` lists only the lines of design § Legacy payload tests.

---

### P1: The contract drops the old columns ⭐ MVP

**User Story**: As the owner, I want the old columns gone once no running backend reads them.

**Acceptance Criteria**:

1. WHEN V20 runs THEN `enemies` SHALL have no column `physical_defense` or `magical_defense`, no constraint `uk_enemies_attributes`, and no trigger or function `enemies_defense_sync`.  <!-- event-driven -->
2. WHEN V20 has run THEN the release 1 backend (migrations V1 to V19) SHALL validate its own migrations, see V20 as `FUTURE_SUCCESS`, and read and write enemies through `defense`.  <!-- event-driven -->
3. IF the precondition of Q2 does not hold THEN the contract task SHALL stop and report the contract as pending, and SHALL NOT be pushed.  <!-- unwanted-behavior -->
4. WHEN V20 has run THEN every assertion of `EarlyGameRebalanceMigrationIT` SHALL still pass, with V16 replayed as design § V16 replay maps it.  <!-- event-driven -->
5. WHEN V20 has run THEN no file under `backend/src` SHALL name `physical_defense` or `magical_defense` except the applied migrations V1, V16, V19, V20 and the assertions that the columns are gone.  <!-- event-driven -->

**Independent Test**: `information_schema.columns` lists no `physical_defense` or `magical_defense` for `enemies`; `PreviousBackendCompatibilityIT` validates V1 to V19 with V20 future.

---

## Edge Cases

- WHEN `./deploy.sh --rollback` brings back the pre-feature backend within 5 minutes of the release 1 deploy THEN it SHALL start (schema check and Flyway validation) and serve enemies, and the seeder SHALL insert none on a database that has chapters 1 to 15.
- WHEN the new backend seeds a fresh database (every test database) THEN every enemy row SHALL hold the same value in `defense`, `physical_defense` and `magical_defense` until V20.
- WHEN the contract deploy fails its regression suite THEN the release 1 backend SHALL keep serving on the database V20 left (it maps only `defense`).
- WHEN a test inserts an enemy with `physical_defense` 85 and `magical_defense` 86 before V20 THEN the row SHALL get `defense` 85.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DEF-01 | P1: One defense column - AC 1 to 8, Edge 1, 2, 4 | Tasks T1 | Implementing |
| DEF-02 | P1: Backend - AC 1 to 4 | Tasks T2 | Implementing |
| DEF-03 | P1: Payload - AC 1 to 3 | Tasks T3 | Pending |
| DEF-04 | P1: Game - AC 1 to 5 | Tasks T7 | Pending |
| DEF-05 | P1: Fixtures - AC 1 to 3 | Tasks T4, T5, T6 | Pending |
| DEF-06 | P1: Contract - AC 1 to 5, Edge 3 | Tasks T9 | Pending |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped

---

## Amends

- AD-021: its expand state (two columns, three payload fields, the game fallback) ends with this feature; the `PHYSICAL_BREAK` id stays.
- `.specs/features/unified-damage/spec.md` TD-002: paid by this feature.

## Success Criteria

- [ ] Release 1 and the contract each deploy with the regression suite green and the backend before them able to start on the migrated database.
- [ ] `git grep -E "physical_defense|magical_defense|physicalDefense|magicalDefense"` over `backend/src` and `game/` lists only the applied migration files, the column-gone assertions and the legacy payload tests.
