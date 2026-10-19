# Normalized Schema Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/normalized-schema/design.md`
**Status**: Approved (owner: "aprovado, pode seguir para as tasks"; executed by 3 batch sub-agents)

Paths: `BE` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `BR` = `backend/src/main/resources`, `GS` = `game/src`.

Ordering note: the entities change first while `ddl-auto: update` still builds the schema (Testcontainers starts empty every run). `V1__schema.sql` is written last (T11), from the final entities, and adds the foreign keys and checks in the same step that switches to `validate`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, `backend/build.gradle.kts` (ktlint), `game/vitest.config.js`, `game/package.json` (`test:e2e`), root `CLAUDE.md` (push right after every commit). Same matrix as the equipment feature, plus the migration row.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; 1:1 to spec ACs; every listed edge case; hand-written fakes, no mocks | `BT/domain/*Test.kt` | `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"` |
| Backend service | unit | All branches and every failure path of the spec, with in-memory fakes | `BT/service/*Test.kt` | same |
| Backend repository / seeder | integration | Key query paths, find-or-insert, seed values, idempotent restart | `BT/adapter/repository/*IT.kt`, `BT/adapter/config/*IT.kt` | `cd backend && ./gradlew --offline ktlintCheck test` |
| Backend migration (SQL) | integration | Every FK, cascade, restrict and CHECK of the spec, one assertion each | `BT/adapter/repository/SchemaConstraintsIT.kt` | same |
| Backend controller | integration | Every route touched: happy path, each listed error with status and `code`, 401 | `BT/adapter/web/*IT.kt` | same |
| Backend entity / port interface | none | build gate only | - | `cd backend && ./gradlew --offline build` |
| Game domain | unit | All branches; every spec AC for pure rules | `GS/domain/**/*.test.js` | `cd game && npm test` |
| Game phaser adapter | unit | Scene behavior with the Phaser stand-in | `GS/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| Game e2e | e2e | The user-visible flow over the fake backend | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |
| Docs, ADRs, STATE | none | build gate only | - | `cd backend && ./gradlew --offline build` |

## Gate Check Commands

> Windows: run Gradle with `JAVA_HOME=C:/Users/yan_b/.jdks/corretto-25.0.2`. Docker must run for the backend integration tests. T11 adds dependencies: run its first Gradle command without `--offline`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick (backend) | Backend tasks with unit tests only | `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"` |
| Quick (game) | Game tasks with unit tests only | `cd game && npm test` |
| Full (backend) | Backend tasks with integration tests | `cd backend && ./gradlew --offline ktlintCheck test` |
| Full (game) | Game tasks with e2e tests | `cd game && npm test && npm run test:e2e` |
| Build | Last task of a phase, or tasks without tests | backend: `cd backend && ./gradlew --offline build`; game: `cd game && npm run build && npm test` |

---

## Execution Plan

Phases run in order; tasks run one at a time. Each task is one atomic commit followed by `git push` (root `CLAUDE.md`).

### Phase 1: Backend domain

```
T1 → T2 → T3
```

### Phase 2: Catalog persistence

```
T4 → T5 → T6 → T7
```

### Phase 3: Wallet and API on drop rules

```
T8 → T9 → T10
```

### Phase 4: Flyway and integrity

```
T11 → T12
```

### Phase 5: Game

```
T13 → T14 → T15
```

---

## Task Breakdown

### T1: Rename the level drop concepts to drop rules

**What**: Rename `LevelDrops` → `DropQueue` (`level` → `ruleId`), `DropRule.level` → `id`, `DropTable.levels` → `ids`, `Wallet.levels` → `queues`, `SyncResult.accepted` keyed by rule id; every caller and test follows. Behavior, table names and JSON stay unchanged.
**Where**: `BE/domain/LevelDrops.kt` (renamed to `DropQueue.kt`; callers in `BE/domain`, `BE/service`, `BE/adapter` and their tests follow)
**Depends on**: None
**Reuses**: existing tests, values unchanged
**Requirement**: SCHEMA-22, SCHEMA-23 (prerequisite)

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] No `LevelDrops` or `DropRule.level` remains in `backend/src`
- [ ] Every assertion keeps its expected value (rename only)
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`
- [ ] Test count: same as before the task (no silent deletions)

**Tests**: unit
**Gate**: full

**Commit**: `refactor(wallet): name drop queues by drop rule instead of level`

---

### T2: Unknown drop rule error

**What**: `UnknownLevelException` → `UnknownDropRuleException` with code `WALLET_UNKNOWN_DROP_RULE` and message `Drop rule '<id>' is unknown`; the controller's kill parsing uses it.
**Where**: `BE/domain/BusinessException.kt`
**Depends on**: T1
**Reuses**: `WalletRequestException`
**Requirement**: SCHEMA-24

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `WalletTest` asserts the exception for an unknown id and that nothing is credited
- [ ] `WalletControllerIT` asserts `400` and `code = WALLET_UNKNOWN_DROP_RULE` for an unknown id and for a non-numeric key, with the copper unchanged
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(wallet): reject kills of an unknown drop rule`

---

### T3: Drop rule ids in the chapter definition

**What**: `StageDefinition.monsterDropRuleId`, `minibossDropRuleId` and `ChapterDefinition.bossDropRuleId` (default `1`); `ChapterDefinition.dropRules(c)` returns `DropRule(3c-2, c, 5c, 1500)`, `DropRule(3c-1, 5c, 15c, 1500)`, `DropRule(3c, 20c, 50c, 1500)`; `of(c)` references those ids.
**Where**: `BE/domain/Chapter.kt`
**Depends on**: T2
**Reuses**: `ChapterDefinition.of`
**Requirement**: SCHEMA-18, SCHEMA-19

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `ChapterTest` asserts the three rules of chapters 1 and 5 (ids, ranges, 1500 ms), that all 15 ids of chapters 1..5 are distinct, and that every stage of `of(c)` references `3c-2`/`3c-1` and the chapter references `3c`
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: build

**Commit**: `feat(stages): give each stage and chapter its drop rules`

---

### T4: Drop rule persistence

**What**: `DropRuleEntity` (`drop_rules`), `JpaDropRuleRepository`, `DropRuleRepository` implementing the new `DropRuleRepositoryPort` (`findAll(): DropTable`, `existsById`, `save`).
**Where**: `BE/adapter/repository/DropRuleRepository.kt`
**Depends on**: None
**Reuses**: `HeroRepository` structure
**Requirement**: SCHEMA-17

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `DropRuleRepositoryIT`: a saved rule is returned by `findAll` with its values, ordered by id; `existsById` is true/false accordingly
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(wallet): store drop rules in the database`

---

### T5: Enemy catalog persistence

**What**: `EnemyEntity` (`enemies`, unique on the four attributes) and `EnemyRepository.idOf(stats: EnemyStats): Long` (insert on conflict do nothing, then select).
**Where**: `BE/adapter/repository/EnemyRepository.kt`
**Depends on**: T4
**Reuses**: `insertIfAbsent` pattern of `WalletRepository`
**Requirement**: SCHEMA-12, SCHEMA-13

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `EnemyRepositoryIT`: the same stats twice return the same id and leave one row; stats differing in any one attribute return a new id
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(stages): store each distinct enemy once`

---

### T6: Stages and chapters reference enemies and drop rules

**What**: Remove the attribute columns from `StageEntity`/`ChapterEntity`; add the enemy and drop rule id columns and `unique (chapter, number)`; `ChapterRepository` resolves enemies on save and joins them on read.
**Where**: `BE/adapter/repository/ChapterRepository.kt` (with `ChapterEntities.kt`)
**Depends on**: T5
**Reuses**: `EnemyRepository`, current `ChapterRepository`
**Requirement**: SCHEMA-10, SCHEMA-11, SCHEMA-14, SCHEMA-15

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `ChapterRepositoryIT`: saving `of(1..5)` and reading each back equals `ChapterDefinition.of(n)` (enemy stats and drop rule ids included); `enemies` holds exactly 5 rows with defenses and crit resistance 0, one per element
- [ ] `StageEntity` and `ChapterEntity` declare no element/defense/crit column
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(stages): point stages and chapters at the enemy catalog`

---

### T7: Seed drop rules with the chapters

**What**: `ChapterSeeder` saves each missing rule of `ChapterDefinition.dropRules(n)` before the chapter.
**Where**: `BE/adapter/config/ChapterSeeder.kt`
**Depends on**: T6
**Reuses**: seed-never-overwrite pattern
**Requirement**: SCHEMA-09, SCHEMA-18, SCHEMA-19

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `ChapterSeederIT`: after startup `drop_rules` holds the 15 seed rules with the spec values; seeding again inserts nothing and keeps a rule whose range was changed in the database
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: build

**Commit**: `feat(stages): seed the drop rules of each chapter`

---

### T8: Wallet queues per drop rule

**What**: `WalletLevelEntity` → `WalletDropQueueEntity` (`wallet_drop_queues`, `drop_rule_id`), `JpaWalletLevelRepository` → `JpaWalletDropQueueRepository`; `IntegrationTestBase` follows.
**Where**: `BE/adapter/repository/WalletEntities.kt` (with `WalletRepository.kt`)
**Depends on**: None
**Reuses**: current wallet persistence
**Requirement**: SCHEMA-22

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `WalletRepositoryIT` stores and reads queues keyed by rule id
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `refactor(wallet): store drop queues per drop rule`

---

### T9: Wallet reads drop rules from the database

**What**: `WalletService` and `WalletAccess` take `DropRuleRepositoryPort` and read the `DropTable` per operation; `WalletProperties`, `DropRuleProperties`, the `dropTable` bean, `WalletConfigTest` and `app.wallet` in `application.yaml` are removed.
**Where**: `BE/service/WalletService.kt` (with `WalletAccess.kt`, `WalletConfig.kt`, `BR/application.yaml`)
**Depends on**: T8
**Reuses**: `Wallet.refreshed/credit`
**Requirement**: SCHEMA-17, SCHEMA-22, SCHEMA-23

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `WalletServiceTest` (in-memory rule fake): a rule whose range changed re-rolls its queue on the next read; a new rule opens a full queue
- [ ] `WalletControllerIT`: `GET /wallet` returns 15 queues of 20 values keyed `"1".."15"`, each inside its seed range; `POST /wallet/sync` with kills on rule `"2"` credits values in 5..15
- [ ] `application.yaml` has no `app.wallet`
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(wallet): read the drop rules from the database`

---

### T10: Drop rule ids in the progress response

**What**: `StageResponse.monsterDropRuleId`, `minibossDropRuleId`; `ChapterResponse.bossDropRuleId`.
**Where**: `BE/adapter/web/ProgressController.kt`
**Depends on**: T9
**Reuses**: `StageResponse.from`
**Requirement**: SCHEMA-21

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `ProgressControllerIT`: `GET /progress` of a new player shows `monsterDropRuleId = 1`, `minibossDropRuleId = 2` on every stage and `bossDropRuleId = 3`
- [ ] Gate check passes: `cd backend && ./gradlew --offline ktlintCheck test`

**Tests**: integration
**Gate**: build

**Commit**: `feat(stages): send the drop rule of each encounter`

---

### T11: Flyway owns the schema

**What**: Add `spring-boot-starter-flyway` and `flyway-database-postgresql`; write `BR/db/migration/V1__schema.sql` (every table from the final entities, the FKs, uniques and CHECKs of the design); set `ddl-auto: validate`.
**Where**: `BR/db/migration/V1__schema.sql` (with `backend/build.gradle.kts`, `BR/application.yaml`)
**Depends on**: None
**Reuses**: design data model
**Requirement**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07, SCHEMA-08, SCHEMA-12, SCHEMA-16, SCHEMA-20, SCHEMA-28

**Tools**:

- MCP: `context7` (Spring Boot 4.1 Flyway)
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `SchemaConstraintsIT` (JDBC on the migrated container): `flyway_schema_history` holds `V1`; an orphan insert fails with SQLState `23503` for each of the 20 FK columns; deleting a user removes its rows in the 7 player tables; deleting a referenced hero, chapter, stage, enemy and drop rule fails with `23503`; a duplicate enemy fails with `23505`; each CHECK (defenses 91, crit 101, min 0, max < min, interval 0, unknown element) fails with `23514`
- [ ] Every existing `*IT` passes on the migrated schema with `validate`
- [ ] Gate check passes: `cd backend && ./gradlew ktlintCheck test` (first run online)

**Tests**: integration
**Gate**: full

**Commit**: `feat(schema): let flyway own the schema with foreign keys`

---

### T12: Document the schema decision

**What**: `backend/docs/adr/0009-normalized-schema.md`; AD-010 in `.specs/STATE.md`; ADR 0005 and 0006 point to 0009 for the drop table and the stage columns; `backend/readme.md` explains the one-time `docker compose down -v`.
**Where**: `backend/docs/adr/0009-normalized-schema.md`
**Depends on**: T11
**Reuses**: ADR format of 0008
**Requirement**: SCHEMA-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ADR 0009 states the decision, consequences and alternatives of the design
- [ ] Gate check passes: `cd backend && ./gradlew --offline build`

**Tests**: none
**Gate**: build

**Commit**: `docs(schema): record flyway and foreign keys as the schema rule`

---

### T13: Encounters carry their drop rule

**What**: `campaign.encounter()` sets `dropRuleId` from `monsterDropRuleId`, `minibossDropRuleId` or `bossDropRuleId`; the farm encounter sets `null`.
**Where**: `GS/domain/campaign/campaign.js`
**Depends on**: None
**Reuses**: existing encounter builders
**Requirement**: SCHEMA-25, SCHEMA-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `campaign.test.js` asserts the rule id of a phase, a miniboss, a chapter boss and `null` for a farm encounter
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): give each encounter its drop rule`

---

### T14: Kills drop from the encounter's rule

**What**: `Monster` takes `dropRuleId` instead of `level`; `ClickerGame` builds it from `encounter.dropRuleId` and calls `takeDrop(this.monster.dropRuleId)`.
**Where**: `GS/adapters/phaser/ClickerGame.js` (with `GS/domain/combat/monster.js`)
**Depends on**: T13
**Reuses**: `walletLedger.takeDrop`
**Requirement**: SCHEMA-25, SCHEMA-27

**Tools**:

- MCP: NONE
- Skill: `phaser-scenes`

**Done when**:

- [ ] Scene/monster tests: a miniboss kill takes from the miniboss rule's queue; a kill whose rule has no queue drops nothing
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): drop copper from the encounter's drop rule`

---

### T15: E2E over rule-keyed drops

**What**: `fakeBackend` serves rule ids in the chapter definition and `drops` keyed by them; `drops.spec.js` kills a monster and the miniboss and checks the wallet grows by the queued values of their rules.
**Where**: `game/e2e/drops.spec.js` (with `game/e2e/support/fakeBackend.js`)
**Depends on**: T14
**Reuses**: existing drops e2e
**Requirement**: SCHEMA-25, SCHEMA-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `drops.spec.js` passes with distinct queues per rule; `equipment.spec.js` and `heroes.spec.js` still pass
- [ ] Gate check passes: `cd game && npm test && npm run test:e2e && npm run build`

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): cover drops keyed by drop rule end to end`

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | One rename across callers | ⚠️ Many files, one mechanical concept |
| T2 | 1 exception | ✅ |
| T3 | 1 domain change | ✅ |
| T4 | 1 repository | ✅ |
| T5 | 1 repository | ✅ |
| T6 | Entities + their repository | ⚠️ Cohesive: entity and mapping change together |
| T7 | 1 seeder | ✅ |
| T8 | 1 entity rename + its repository | ⚠️ Cohesive |
| T9 | Drop table source swap | ⚠️ Cohesive: bean removal and its consumers |
| T10 | 1 response | ✅ |
| T11 | 1 migration + switch | ⚠️ Cohesive: the schema and the mode that trusts it |
| T12 | Docs | ✅ |
| T13 | 1 function | ✅ |
| T14 | 1 scene path | ✅ |
| T15 | 1 e2e spec | ✅ |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | start of Phase 1 | ✅ |
| T2 | T1 | T1 → T2 | ✅ |
| T3 | T2 | T2 → T3 | ✅ |
| T4 | None (runs after Phase 1) | start of Phase 2 | ✅ |
| T5 | T4 | T4 → T5 | ✅ |
| T6 | T5 | T5 → T6 | ✅ |
| T7 | T6 | T6 → T7 | ✅ |
| T8 | None (runs after Phase 2) | start of Phase 3 | ✅ |
| T9 | T8 | T8 → T9 | ✅ |
| T10 | T9 | T9 → T10 | ✅ |
| T11 | None (runs after Phase 3) | start of Phase 4 | ✅ |
| T12 | T11 | T11 → T12 | ✅ |
| T13 | None (runs after Phase 4) | start of Phase 5 | ✅ |
| T14 | T13 | T13 → T14 | ✅ |
| T15 | T14 | T14 → T15 | ✅ |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Domain, service, adapters (rename) | unit + integration | unit (full gate runs ITs) | ✅ |
| T2 | Domain + controller | integration | integration | ✅ |
| T3 | Domain | unit | unit | ✅ |
| T4 | Repository | integration | integration | ✅ |
| T5 | Repository | integration | integration | ✅ |
| T6 | Entity + repository | integration | integration | ✅ |
| T7 | Seeder | integration | integration | ✅ |
| T8 | Entity + repository | integration | integration | ✅ |
| T9 | Service + config + controller behavior | integration | integration | ✅ |
| T10 | Controller | integration | integration | ✅ |
| T11 | Migration | integration | integration | ✅ |
| T12 | Docs | none | none | ✅ |
| T13 | Game domain | unit | unit | ✅ |
| T14 | Game phaser adapter + domain | unit | unit | ✅ |
| T15 | Game e2e | e2e | e2e | ✅ |
