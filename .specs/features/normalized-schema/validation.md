# Normalized Schema Validation

**Date**: 2026-10-20
**Spec**: `.specs/features/normalized-schema/spec.md`
**Diff range**: `88f5116..HEAD` (HEAD = `528ac3a`; T1 `aba8a0d` ... T15 `659235f`, fix `528ac3a`)
**Verifier**: independent sub-agent (author ≠ verifier)
**Iteration**: re-verification 2 of max 3. Iteration 1 returned FAIL: SCHEMA-01/02 and SCHEMA-08 had gaps, SCHEMA-16 was weak, and mutants B2, B7 and B8 survived. Fix commit `528ac3a` changes tests only (`SchemaConstraintsIT.kt`, new `SchemaValidationIT.kt`).

**Verdict**: PASS ✅. All 28 ACs have spec-anchored evidence. The backend gate passes with 647 tests, and the game passes 673 unit tests. The sensor killed all 14 mutants this iteration. That includes B2 on eight different catalog FKs, B7 on two bounds, B8, and three new mutants aimed at the new validation tests.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T15 | ✅ Done | All marked done in `tasks.md`; one commit each, in order |
| Fix 1-3 (iteration 1) | ✅ Done | One test-only commit `528ac3a`. The fixes were not written into `tasks.md` as tasks; the commit message names them |

---

## Spec-Anchored Acceptance Criteria

Paths: `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `GS` = `game/src`. `SC` = `BT/adapter/repository/SchemaConstraintsIT.kt`, `SV` = `BT/adapter/repository/SchemaValidationIT.kt`.

### P1: Referential integrity

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| SCHEMA-01 | Schema only through Flyway `V1__schema.sql`; `ddl-auto: validate` | `SC:59-60` - `assertEquals("V1__schema.sql", row["script"])`, `assertEquals(true, row["success"])`; `SV:31` - `assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"))`. B8 and N2 killed | ✅ |
| SCHEMA-02 | Entity/schema mismatch fails startup | `SV:44` drops `wallets.copper` from a Flyway-migrated `mismatch` schema; `SV:47-57` - `assertFailsWith<Exception> { SpringApplication(...).run(...) }`; `SV:60-61` - cause chain `any { it is SchemaManagementException }`. N1 (`hbm2ddl.auto: none` while `ddl-auto` still reads `validate`) and N3 (harmless added column instead of a dropped one) were both killed, so the test needs a real mismatch and a real validation | ✅ |
| SCHEMA-03 | Orphan `username` rejected in 7 tables (23503) | `SC:79` - `orphans.forEach { assertRejected("23503", it) }` (7 inserts, l.66-76) | ✅ |
| SCHEMA-04 | Orphan `hero_id` / `leader_id` rejected | `SC:84-101` - `assertRejected("23503", ...)` for hero_skills, card_copies, equipment_pieces, player_cards | ✅ |
| SCHEMA-05 | Stage with missing chapter rejected | `SC:106` - `assertRejected("23503", stageInsert, 999, ...)` | ✅ |
| SCHEMA-06 | Progress with missing `(chapter, stage)` rejected | `SC:121-128` - `assertRejected("23503", ... (1, 11) / (6, 1))` | ✅ |
| SCHEMA-07 | User delete cascades into 7 tables | `SC:172-173` - `assertEquals(0, count(it, "yan"))` / `assertEquals(1, count(it, "ana"))`; B1 killed (iter. 1) | ✅ |
| SCHEMA-08 | Delete of a referenced hero/chapter/stage/enemy/drop rule rejected | Probe rows that only their direct child references, with no `progress` row in reach (`SC:194-222`). Heroes: `SC:274-275` - `assertRejected("23503", "delete from heroes where id = ?", hero)` + `assertEquals(1, rows(table, ...))` for skill, copy, leader and piece. Drop rules: `SC:283-290` (chapter boss, stage monster, stage miniboss, wallet queue). Enemies: `SC:297-302`. Chapter: `SC:309-310`. Stage: `SC:318-319`. B2a-B2h killed | ✅ |
| SCHEMA-09 | Empty DB migrated; 5 chapters, stages, heroes, enemies and 15 drop rules seeded | `BT/adapter/config/ChapterSeederIT.kt:51` - `assertEquals(ChapterDefinition.of(it), repository.findByNumber(it))` (1..5); `ChapterSeederIT.kt:72` - `assertEquals(expected, seedRules())`; `BT/adapter/config/HeroSeederIT.kt:39` (seed heroes); `BT/adapter/repository/ChapterRepositoryIT.kt:196-198` (enemies) | ✅ |
| SCHEMA-28 | Missing enemy/drop rule id in stages/chapters/queues rejected | `SC:107-110,115-116,133-137` - `assertRejected("23503", ...)` | ✅ |

### P1: Enemy catalog

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| SCHEMA-10 | Attributes only in `enemies` | Structural: `backend/src/main/resources/db/migration/V1__schema.sql:63-84` declares no attribute columns on `stages`/`chapters`. `validate` is now proven to stop startup when an entity maps a column the schema lacks (`SV:60-61`) | ✅ (structural + validate) |
| SCHEMA-11 | `monster_enemy_id`, `miniboss_enemy_id`, `boss_enemy_id` | `ChapterRepositoryIT.kt:166-168` - `assertEquals(EnemyStats(...), read.boss / read.stage(1).monster / .miniboss)`, read from SQL rows that set those columns | ✅ |
| SCHEMA-12 | Duplicate attribute set rejected (23505) | `SC:324-329` - `assertRejected("23505", ...)` | ✅ |
| SCHEMA-13 | Seeder reuses existing enemy rows | `BT/adapter/repository/EnemyRepositoryIT.kt:43-44` - `assertEquals(first, second)`, `assertEquals(1, rowsWith(stats))`; B4 killed (iter. 1) | ✅ |
| SCHEMA-14 | Exactly 5 phase-monster rows (one per element, 0/0/0) | `ChapterRepositoryIT.kt:196-202` - `assertEquals(5, monsters.size)`, `assertEquals(Element.entries...toSet(), zeroRows.toSet())`, `assertEquals(5, zeroRows.size)` | ✅ |
| SCHEMA-15 | Chapter read equals `ChapterDefinition.of` | `ChapterRepositoryIT.kt:178` - `assertEquals(ChapterDefinition.of(it), repository.findByNumber(it))`; `BT/adapter/web/ProgressControllerIT.kt:95-108` (API values) | ✅ |
| SCHEMA-16 | Defense outside 0..90 / crit outside 0..100 rejected (23514) | `SC:336-341` - `assertRejected("23514", insert, "FIRE", 91, 0, 0)`, `(0, 91, 0)`, `(0, 0, 101)`, `(-1, 0, 0)`, `(0, -1, 0)`, `(0, 0, -1)`. Both bounds of all three columns. B7a/B7b killed | ✅ |

### P1: Drops per stage

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| SCHEMA-17 | No `app.wallet.drop-table` in yaml; rules only from `drop_rules` | Structural: `application.yaml` at HEAD has no `wallet:` key (grep); `BT/service/WalletServiceTest.kt:123` `dropTable returns the rules as they are stored now` - `assertEquals(listOf(DropRule(1,1,5,1500), DropRule(2,5,15,1500)), service.dropTable().rules)` | ✅ |
| SCHEMA-18 | Chapter c: `c..5c`, `5c..15c`, `20c..50c`, 1500 ms; 15 rules | `BT/domain/ChapterTest.kt:137,145` - `assertEquals(listOf(DropRule(1,1,5,1500), ...), dropRules(1))`, `DropRule(13,5,25,1500) ...` for chapter 5; `ChapterSeederIT.kt:66-72` - all 15 stored rules equal the formula; B3 killed (iter. 1) | ✅ |
| SCHEMA-19 | Stages reference `3c-2`/`3c-1`, chapter `3c` | `ChapterTest.kt:164-167` - `assertEquals(3 * c - 2, stage.monsterDropRuleId)`, `3 * c - 1`, `3 * c`; persisted: `ChapterSeederIT.kt:51` | ✅ |
| SCHEMA-20 | `min < 1`, `max < min`, `interval < 1` rejected (23514) | `SC:349-351` - `assertRejected("23514", insert, 0, 5, 1500L)` / `(5, 4, ...)` / `(1, 5, 0L)` | ✅ |
| SCHEMA-21 | `monsterDropRuleId`/`minibossDropRuleId` per stage, `bossDropRuleId` | `ProgressControllerIT.kt:118-120` - `.body("definition.bossDropRuleId", equalTo(3))`, `equalTo(List(10) { 1 })`, `equalTo(List(10) { 2 })`; B6 killed (iter. 1) | ✅ |
| SCHEMA-22 | One queue of 20 per rule, keyed by decimal id, values in range | `BT/adapter/web/WalletControllerIT.kt:57-61` - `containsInAnyOrder("1".."15")`, `assertEquals(20, queue.size)`, `queue.all { it in seedRange(id) }` | ✅ |
| SCHEMA-23 | Sync credits per rule with queue/allowance rules | `WalletControllerIT.kt:91-94` - `accepted.2 == 2`, `wallet.copper == before.take(2).sum()`, values in 5..15, remaining queue shifted; `WalletServiceTest` `sync credits kills of a drop rule added in the database` - `assertEquals(45L, result.wallet.copper)` | ✅ |
| SCHEMA-24 | `400` + `WALLET_UNKNOWN_DROP_RULE`, nothing credited | `WalletControllerIT.kt:223-224` - `.statusCode(400).body("code", equalTo("WALLET_UNKNOWN_DROP_RULE"))` (unknown id 99 and `abc`), copper stays 0; `BT/domain/WalletTest.kt:151-153`; B5 killed (iter. 1) | ✅ |
| SCHEMA-25 | Kill takes from the encounter rule's queue and reports under that id | `GS/domain/campaign/campaign.test.js:101-111` - `dropRuleId` `toBe(12/13/22/21/30)`; `GS/adapters/phaser/ClickerGame.test.js:621,1139,1148` - sprites `3`/`7`/`9` from rules 1/2/3; `game/e2e/drops.spec.js:97,101,105` - wallet `Copper: 3` → `15`, kills `toEqual({ 4: 1, 5: 1 })`; G1, G3 killed (iter. 1) | ✅ |
| SCHEMA-26 | Farm drops no copper | `campaign.test.js:117-118` - `farmEncounter(...).dropRuleId` `toBeNull()`; `ClickerGame.test.js:1914-1923` - `expect(ctx.sprites).toHaveLength(0)`; G2 killed (iter. 1) | ✅ |
| SCHEMA-27 | Missing/empty queue drops nothing | `ClickerGame.test.js:595-600` (empty), `:604-609` (missing), `:629-639` (no rule), `:1157-1163` (miniboss without queue) - `expect(ctx.sprites).toHaveLength(0)`; G5 killed (iter. 1) | ✅ |

**Status**: ✅ All 28 ACs covered with spec-anchored evidence. No spec-precision gaps.

The game and other backend test files are unchanged since `659235f` (`git diff --stat 659235f..HEAD` touches only the two schema ITs). Spot checks of the cited lines (ChapterSeederIT 51/66-72, ChapterRepositoryIT 166-168/178/196-202, EnemyRepositoryIT 43-44, ProgressControllerIT 118-120, WalletControllerIT 57-61/91-94/223-224, ChapterTest 137/145/164-167, WalletTest 151-153, campaign.test.js 101-118, ClickerGame.test.js 592-639, drops.spec.js 97-105) still show the cited assertions.

### Rewritten tests (tasks.md Status lines, iteration 1, unchanged)

Iteration 1 judged them all justified or stronger: T9 WalletControllerIT/WalletFlowIT/WalletConfigTest, T11 PLASMA and stored-queue rewrites, T6 attribute-column rewrite, T14 monster.test.js. Fix commit `528ac3a` replaced the masked catalog-delete test (old `SC:176-184`) with five targeted tests and added the lower bounds; no assertion was weakened.

---

## Discrimination Sensor

Scratch: a temporary `git worktree` at `528ac3a` under the session scratchpad. Each mutant was applied alone with `sed`, the targeted IT class ran (`./gradlew --offline cleanTest test --tests '<class>'`), and the mutant was reverted with `git checkout -- .` before the next. Every kill below is an assertion failure in the named test, not a compile or boot error.

### Iteration 2 (this run, HEAD `528ac3a`)

| # | File:line | Description | Failing test | Killed? |
| - | --------- | ----------- | ------------ | ------- |
| B2a | `V1__schema.sql:81` | `stages.monster_drop_rule_id` restrict → cascade | drop rule referenced by a chapter, a stage or a wallet queue | ✅ |
| B2b | `V1__schema.sql:127` | `card_copies.hero_id` restrict → cascade | hero referenced by a skill, card copy, leader or piece | ✅ |
| B2c | `V1__schema.sql:73` | `stages.chapter` restrict → cascade | chapter that has stages | ✅ |
| B2d | `V1__schema.sql:95` | `fk_progress_stage` restrict → cascade | stage a progress points at | ✅ |
| B2e | `V1__schema.sql:79` | `stages.monster_enemy_id` restrict → cascade | enemy referenced by a chapter boss or a stage | ✅ |
| B2f | `V1__schema.sql:68` | `chapters.boss_drop_rule_id` restrict → cascade | drop rule referenced by ... | ✅ |
| B2g | `V1__schema.sql:106` | `wallet_drop_queues.drop_rule_id` restrict → cascade | drop rule referenced by ... | ✅ |
| B2h | `V1__schema.sql:117` | `player_cards.leader_id` restrict → cascade | hero referenced by ... | ✅ |
| B7a | `V1__schema.sql:57` | `physical_defense between 0 and 90` → `<= 90` | enemy attributes outside their bounds | ✅ |
| B7b | `V1__schema.sql:59` | `crit_resistance between 0 and 100` → `<= 100` | enemy attributes outside their bounds | ✅ |
| B8 | `application.yaml:12` | `ddl-auto: validate` → `update` | both SchemaValidationIT tests | ✅ |
| N1 (new) | `application.yaml:16` | Keep `ddl-auto: validate` but add `spring.jpa.properties.hibernate.hbm2ddl.auto: none`, which overrides it. The mode test passes vacuously | startup fails when the schema lacks a column | ✅ |
| N2 (new) | `application.yaml:12` | `ddl-auto: validate` → `none` | both SchemaValidationIT tests | ✅ |
| N3 (new, test-side vacuity) | `SV:44` | The mismatch becomes harmless (`add column extra integer` instead of `drop column copper`) | startup fails when the schema lacks a column (startup succeeds, assertion fails) | ✅ |

### Iteration 1 (HEAD `659235f`, for the record)

G1, G2, G3, G5, B1, B3, B4, B5 and B6 were killed. G4 survived as an equivalent mutant (a farm encounter's `dropRuleId` is null). B2 (`V1__schema.sql:81` cascade), B7 (`V1__schema.sql:57` lower bound dropped) and B8 (`ddl-auto: update`) survived and became Fix 1-3. The code those mutants target is unchanged in `528ac3a`, so the iteration 1 kills still hold.

**Sensor depth**: expanded (P0 data integrity; 14 mutants this iteration, 27 across both)
**Result**: iteration 2 killed 14/14. Across both iterations, 23/26 non-equivalent mutants were killed, and the 3 survivors from iteration 1 are now killed. PASS ✅
**Isolation**: the real tree's `git status --porcelain` after cleanup is byte-identical to the pre-sensor baseline: the owner's `application.yaml`, `.idea/`, `game/public/assets/coin-*.png` and `game/src/scenes/`, plus the previous Verifier's `validation.md`, `lessons.json` and `LESSONS.md`. The worktree was removed (long paths deleted with `rd \\?\`) and pruned; `git worktree list` shows only `main`.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ (fix commit touches two test files only) |
| No scope creep | ✅ |
| Matches patterns | ✅ (IntegrationTestBase, `assertRejected` SQLSTATE helper, kotlin.test) |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (migration: every FK, cascade, restrict, CHECK one assertion each) | ✅ (restricts are now probed in isolation; CHECK bounds are tested on both sides) |
| Every test maps to a spec requirement | ✅ (new tests map to SCHEMA-01, 02, 08, 16) |
| Documented guidelines followed: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md` | ✅ |

Note: `SchemaConstraintsIT` cleans its probe rows in `@AfterTest` (`SC:230-243`) because it shares the Testcontainers database. The cleanup order (children before parents) is correct.

---

## Edge Cases

- [x] Rule range changed in DB → re-rolled on next read: `WalletServiceTest` `get re-rolls a queue whose drop rule range was changed in the database` - `assertEquals(List(20) { 12 }, ...)`
- [x] Rule added in DB → full queue on next read: `WalletServiceTest` `get opens a full queue for a drop rule added in the database` - `List(20) { 15 }`, allowance 20
- [x] Restart on seeded DB inserts/overwrites nothing: `ChapterSeederIT.kt:75-82` (rules) - `assertEquals(before, dropRules.findAll().rules)`; `ChapterSeederIT.kt:55-61` (chapters); `HeroSeederIT.kt:53`

---

## Gate Check

- **Backend**: `APP_EQUIPMENT_MINIBOSSRATE=0.25 APP_CARDS_MINIBOSSRATEPERSTAGE=0.02 APP_CARDS_CHAPTERBOSSRATE=0.30 JAVA_HOME=C:/Users/yan_b/.jdks/corretto-25.0.2 ./gradlew --offline cleanTest build` → BUILD SUCCESSFUL, exit 0, **647 passed, 0 failed, 0 skipped** (JUnit XML totals; ktlint included; SchemaConstraintsIT 16, SchemaValidationIT 2). The env vars override the owner's uncommitted rate edits.
- **Game**: `npm test` → **673 passed** (unchanged since `659235f`); iteration 1 recorded e2e at 50 passed and the build OK, and no game file changed since then, so e2e was not rerun.
- **Test count before feature**: backend 615, game 665 unit / 49 e2e
- **Test count after feature**: backend 647 (641 at iteration 1, +6 from the fix), game 673 unit / 50 e2e
- **Delta**: +32 backend (after −6 `WalletConfigTest`, justified), +8 game unit, +1 e2e
- **Failures**: none

---

## Fix Plans

None. Fix 1-3 from iteration 1 are done and verified: B2, B7 and B8 are killed.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| SCHEMA-01, SCHEMA-02 | ❌ Needs Fix | ✅ Verified |
| SCHEMA-08 | ❌ Needs Fix | ✅ Verified |
| SCHEMA-16 | ❌ Needs Fix | ✅ Verified |
| SCHEMA-03..07, 09..15, 17..28 | ✅ Verified | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 28/28 ACs matched the spec outcome; 0 spec-precision gaps
**Sensor**: 14/14 killed this iteration, and the iteration 1 survivors B2, B7 and B8 are now killed
**Gate**: backend 647 passed; game 673 unit passed

**What works**: everything from iteration 1. In addition, each catalog restrict is now tested in isolation, all enemy CHECK bounds are tested on both sides, `ddl-auto: validate` is pinned, and a real startup failure on an entity/schema mismatch is proven.

**Issues found**: none.

**Next steps**: the orchestrator commits this report and deploys per CLAUDE.md.
