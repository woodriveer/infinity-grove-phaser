# Campaign Chapters Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/campaign-chapters/spec.md`
**Design**: `.specs/features/campaign-chapters/design.md`
**Status**: Draft

Rules for every task:

- Read the files under **Read first** before editing.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A`: the working tree holds the owner's uncommitted files (`PROMPTS_ASSETS_UI.md`, `game/src/...`, `art/`, `game/public/assets/...`).
- Mark the task `[x]` in this file in the same commit.
- Push right after the commit (`CLAUDE.md`). Every pushed commit can go live through the watcher, so a task never leaves the backend in a state that seeds wrong data (design, Risks).
- A test that pins an old value superseded by AD-019 is updated to the new value and renamed after the behaviour (L-054). Never delete or weaken a test to make a gate pass; the only removals allowed are the ones T14 names.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/build.gradle.kts` (JUnit 5 + Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend in `game/e2e/support/fakeBackend.js`); no coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Chapter.kt`, `ChapterOrder.kt`, `Progress`, `CardDrops`, `AccountReset`) | unit | Every formula and boundary of the spec with the exact numbers of the Chapter Table and Coin Drops | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend migrations | integration (Testcontainers) | Schema shape, backfill, tuned rows left alone, rollback-relevant column types | `backend/src/test/kotlin/**/adapter/repository/*MigrationIT.kt` | `cd backend && ./gradlew test` |
| Backend repository, seeder, web | integration (Testcontainers) | Round-trip of 64-bit health, seeded chapters 1 to 15 and rules 1 to 45, progress transitions, reset reward | `backend/src/test/kotlin/**/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain | unit | Every Number Format example; reset reward per chapter | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game scene | unit (jsdom) | Rendered HP text and reset label | `game/src/adapters/phaser/ClickerGame.test.js` | `cd game && npm test` |
| e2e | e2e (Playwright, fake backend) | Every player-visible change: chapter 6 after the chapter 5 boss, completion at 15, reset label past 5, `K` on HP and damage | `game/e2e/campaignChapters.spec.js` | `cd game && npx playwright test e2e/campaignChapters.spec.js` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | backend: `cd backend && ./gradlew test --tests '<pattern of the task>'`; game: `cd game && npm test` |
| Full | After tasks with integration or e2e tests | backend: `cd backend && ./gradlew test`; game: `cd game && npm test && npx playwright test` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order.

### Phase 1: Backend health becomes 64-bit (expand)

```
T1 → T2
```

### Phase 2: Game number format and reset label

```
T3 → T4 → T5 → T6
```

### Phase 3: Backend chapters 6 to 15 and coin drops

The formulas (T7, T8) land before `MAX_CHAPTER` rises (T10), so no pushed commit ever seeds chapters 6 to 15 with the old x4 health or the old coin ranges.

```
T7 → T8 → T9 → T10
```

### Phase 4: e2e

```
T11 → T12
```

### Phase 5: Contract (deferred until the deploys of Phase 1 to 4 are live)

Start only when `./publish.sh` runs and the precondition of each task holds. If it cannot be met, stop and report the contract as pending; the feature works without it.

```
T13 → T14
```

---

## Task Breakdown

### T1: Expand migration for 64-bit health [ ]

**Owner**: kotlin-backend-dev
**What**: Add nullable `bigint` hit point columns next to the three `integer` health columns, copy the values, and make the legacy columns nullable, in a migration that can run twice (CHAP-08 AC 1, 4, 5, 6).
**Where**: `backend/src/main/resources/db/migration/V8__health_hit_points_expand.sql` (new)
**Also changes**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/HealthHitPointsMigrationIT.kt` (new)
**Read first**: `backend/src/main/resources/db/migration/V4__monster_health_growth.sql`, `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/MonsterHealthMigrationIT.kt` (test pattern: re-run the file with `ClassPathResource`), `.specs/features/campaign-chapters/design.md` (Backend persistence - health expand/contract)
**Depends on**: None
**Requirement**: CHAP-08

**Contract** (the whole file, in this order; every statement is safe to run twice):

```sql
-- Health becomes 64-bit (spec campaign-chapters, AD-019). Expand step of AD-016: the new *_hit_points columns are added and filled, the
-- legacy integer columns stay (nullable) so the previous backend keeps starting; V10 drops them after two more deploys.
alter table chapters add column if not exists boss_hit_points bigint;
alter table stages add column if not exists monster_hit_points bigint;
alter table stages add column if not exists miniboss_hit_points bigint;
update chapters set boss_hit_points = boss_health where boss_hit_points is null;
update stages set monster_hit_points = monster_health where monster_hit_points is null;
update stages set miniboss_hit_points = miniboss_health where miniboss_hit_points is null;
alter table chapters drop constraint if exists ck_chapters_boss_hit_points;
alter table chapters add constraint ck_chapters_boss_hit_points check (boss_hit_points >= 1);
alter table stages drop constraint if exists ck_stages_monster_hit_points;
alter table stages add constraint ck_stages_monster_hit_points check (monster_hit_points >= 1);
alter table stages drop constraint if exists ck_stages_miniboss_hit_points;
alter table stages add constraint ck_stages_miniboss_hit_points check (miniboss_hit_points >= 1);
alter table chapters alter column boss_health drop not null;
alter table stages alter column monster_health drop not null;
alter table stages alter column miniboss_health drop not null;
```

The new columns stay nullable until V10 (T14), because the entities do not write them before T2 and the seeder inserts chapters right after Flyway.

**Steps**:

1. Create the migration file with the contract above.
2. Create `HealthHitPointsMigrationIT` extending `IntegrationTestBase`, with `JdbcTemplate`, a `migrate()` that executes the V8 file through `ClassPathResource`, and an `@AfterTest` that runs `migrate()` again.
3. Write the four test cases below.

**Tests**: integration
**Test cases** (`HealthHitPointsMigrationIT.kt`):

- `the expand migration adds bigint hit point columns`: `information_schema.columns` reports `data_type = 'bigint'` for `chapters.boss_hit_points`, `stages.monster_hit_points` and `stages.miniboss_hit_points`.
- `the expand migration copies every legacy health into the hit points`: set `boss_hit_points` and both stage hit points to null on every row, run `migrate()`, then `select count(*) from chapters where boss_hit_points is distinct from boss_health` is 0, the same holds for both stage columns, and chapter 5 reads `boss_hit_points` 512000.
- `the legacy health columns stay integer and accept null`: `boss_health`, `monster_health` and `miniboss_health` report `data_type = 'integer'` and `is_nullable = 'YES'`.
- `a hit point below 1 is refused and 3000000000 is stored`: `update chapters set boss_hit_points = 0 where number = 1` throws `DataIntegrityViolationException`; `update chapters set boss_hit_points = 3000000000 where number = 1` then reads back `3000000000L`; restore it to `boss_health` at the end of the test.

**Gate**: full - `cd backend && ./gradlew test --tests '*HealthHitPointsMigrationIT' --tests '*SchemaValidationIT' --tests '*SchemaConstraintsIT'`
**Done when**:

- [ ] The four test cases pass and `SchemaValidationIT` and `SchemaConstraintsIT` pass unchanged.
- [ ] No Kotlin file changed.

**Commit**: `feat(backend): add 64-bit hit point columns beside the health columns`

---

### T2: Health is a Long from the database to the API [ ]

**Owner**: kotlin-backend-dev
**What**: Carry health as `Long` in the domain, map the entities to `*_hit_points`, keep writing the legacy columns while the value fits, and answer `Long` in the progress JSON (CHAP-08 AC 1, 2, 5).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Chapter.kt`
**Also changes**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ChapterEntities.kt`, `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/ProgressController.kt`, tests `domain/ChapterTest.kt`, `adapter/repository/ChapterRepositoryIT.kt`, `adapter/web/ProgressControllerIT.kt` (and any test that stops compiling because health is now `Long`: change the literal to `L`, nothing else)
**Read first**: `Chapter.kt:25-63` (StageDefinition, ChapterDefinition), `ChapterEntities.kt:47-154`, `ProgressController.kt:40-85`, `ChapterRepositoryIT.kt:140-170` (raw insert)
**Depends on**: T1
**Requirement**: CHAP-08

**Contract**:

- `StageDefinition.monsterHealth: Long`, `StageDefinition.minibossHealth: Long`, `ChapterDefinition.bossHealth: Long`; `healthFactor(number: Int): Long` (formula unchanged in this task: `4^(number-1)`).
- `ChapterEntities.kt`: `internal fun legacyHealth(value: Long): Int? = if (value <= Int.MAX_VALUE) value.toInt() else null`.
- `ChapterEntity`: `@Column(nullable = false) var bossHitPoints: Long` and `@Column var bossHealth: Int?`. `toDomain` reads `bossHitPoints`; `from` sets `bossHitPoints = chapter.bossHealth` and `bossHealth = legacyHealth(chapter.bossHealth)`.
- `StageEntity`: `var monsterHitPoints: Long`, `var minibossHitPoints: Long` (not null), `var monsterHealth: Int?`, `var minibossHealth: Int?`, mapped the same way.
- `ProgressController`: `StageResponse.monsterHealth: Long`, `StageResponse.minibossHealth: Long`, `ChapterResponse.bossHealth: Long`. JSON names unchanged.

**Steps**:

1. Change the three domain fields and `healthFactor` to `Long`; fix `of()` arithmetic with `L` literals.
2. Add `legacyHealth` and the new entity fields; map both directions.
3. Change the three response fields to `Long`.
4. Fix compile errors in tests by turning health literals into `Long`.
5. In `ChapterRepositoryIT` add `boss_hit_points` and the stage hit points to the raw inserts at lines 150-155, with the same values as the legacy columns.
6. Write the test cases below.

**Tests**: integration
**Test cases**:

- `ChapterTest` - `a stage keeps a health above the 32-bit limit`: `StageDefinition(1, 5, 3_000_000_000L, 15_000_000_000L, 30_000)` reads back `3_000_000_000L` and `15_000_000_000L`.
- `ChapterRepositoryIT` - `a chapter boss of 3000000000 health round-trips and leaves the legacy column null`: save a chapter (number 99, built like the existing save tests of the file) with `bossHealth = 3_000_000_000L`, load it, read `bossHealth == 3_000_000_000L`; `select boss_health from chapters where number = 99` is null and `boss_hit_points` is 3000000000.
- `ChapterRepositoryIT` - `a seeded chapter holds the same value in the legacy and the hit point columns`: chapter 5 `boss_health = 512000 = boss_hit_points`; stage (5, 10) `monster_health = 19456 = monster_hit_points` and `miniboss_health = 97280 = miniboss_hit_points`.
- `ProgressControllerIT` - `GET progress answers a boss health above the 32-bit limit as a JSON integer`: `update chapters set boss_hit_points = 3000000000 where number = 1`, `GET /progress`, `jsonPath().getLong("definition.bossHealth") == 3000000000L`; restore with `update chapters set boss_hit_points = boss_health where number = 1`.

**Gate**: full - `cd backend && ./gradlew test`
**Done when**:

- [ ] The four test cases pass and the whole backend suite passes.
- [ ] `SchemaValidationIT` passes (entities validate against V8).

**Commit**: `feat(backend): carry health as a 64-bit value`

---

### T3: Short number formatter [ ]

**Owner**: game-dev
**What**: A pure `formatShort` that abbreviates values of 1 000 or more with K, M, B, T (CHAP-07 AC 1, 3).
**Where**: `game/src/domain/combat/numberFormat.js` (new)
**Also changes**: `game/src/domain/combat/numberFormat.test.js` (new)
**Read first**: `game/src/domain/combat/damage.js:31` (`formatDamage`), spec section Number Format
**Depends on**: None
**Requirement**: CHAP-07

**Contract**: `export const formatShort = (value) => string`.

- `value < 1000`: return `String(value)`.
- Else: units `[[1e3, 'K'], [1e6, 'M'], [1e9, 'B'], [1e12, 'T']]`. Take the largest unit `u` with `u <= value` and compute `x = Math.round(value / u * 10) / 10`. If `x >= 1000` and a bigger unit exists, use the bigger unit and recompute `x`. Return `` `${x}${letter}` `` (`String(x)` drops `.0`).

**Steps**:

1. Write the function with a header comment naming the spec.
2. Write the test file.

**Tests**: unit
**Test cases** (`numberFormat.test.js`, one `it` per line, exact strings):

- `999` → `'999'`; `1000` → `'1K'`; `1500` → `'1.5K'`; `5000` → `'5K'`; `50000` → `'50K'`
- `999949` → `'999.9K'`; `999950` → `'1M'`; `1000000` → `'1M'`; `1049999` → `'1M'`; `1050000` → `'1.1M'`
- `16384000` → `'16.4M'`; `20000000` → `'20M'`; `2500000000` → `'2.5B'`; `3000000000` → `'3B'`; `6000000000` → `'6B'`; `1e12` → `'1T'`

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 16 cases pass.
- [ ] The architecture test of the game (imports point inward) passes.

**Commit**: `feat(game): add the short number format`

---

### T4: Damage numbers use the short format [ ]

**Owner**: game-dev
**What**: `formatDamage` rounds as today, then abbreviates from 1 000 (CHAP-07 AC 1, 2, 5).
**Where**: `game/src/domain/combat/damage.js`
**Also changes**: `game/src/domain/combat/damage.test.js`
**Read first**: `damage.js:31`, `damage.test.js:84-103`
**Depends on**: T3
**Requirement**: CHAP-07

**Contract**: `formatDamage(d)`: `const r = Math.round(d * 10) / 10; return r >= 1000 ? formatShort(r) : String(r);`

**Steps**:

1. Import `formatShort` and change `formatDamage`.
2. Add the test cases; keep every existing case unchanged.

**Tests**: unit
**Test cases** (`describe('formatDamage')`):

- `formatDamage(5000)` → `'5K'`
- `formatDamage(999.96)` → `'1K'` (rounds to 1000 first)
- `formatDamage(999.94)` → `'999.9'`
- `formatDamage(1234567)` → `'1.2M'`

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 4 new cases and the existing `formatDamage` cases pass.

**Commit**: `feat(game): abbreviate damage numbers from 1000`

---

### T5: HP text uses the short format [ ]

**Owner**: game-dev
**What**: `healthText` rounds the current health up to 0.1 as today, then abbreviates both numbers from 1 000. The tests prove that a 3 000 000 000 health boss passes through the campaign (CHAP-07 AC 1, 2, 4; CHAP-08 AC 3).
**Where**: `game/src/domain/combat/monster.js`
**Also changes**: `game/src/domain/combat/monster.test.js`, `game/src/adapters/phaser/ClickerGame.test.js` (lines 409-432), `game/src/domain/campaign/campaign.test.js`
**Read first**: `monster.js:8`, `monster.test.js:136-171` (how health is lowered with `monster.hit(damage)`), `campaign.test.js` (the existing boss encounter test), `campaign.js:90-130`
**Depends on**: T4
**Requirement**: CHAP-07, CHAP-08

**Contract**: `healthText({ health, maxHealth })`: `current = Math.ceil(Math.round(health * 1e7) / 1e6) / 10` (unchanged), then `` `HP ${current >= 1000 ? formatShort(current) : current}/${formatShort(maxHealth)}` ``.

**Steps**:

1. Import `formatShort`; change `healthText` as in the contract.
2. Add the `monster.test.js` cases.
3. In `ClickerGame.test.js` change the expectations `'HP 983.5/1000'` → `'HP 983.5/1K'`, `'HP 997.6/1000'` → `'HP 997.6/1K'`, `'HP 1000/1000'` → `'HP 1K/1K'`, and the two test titles that name them.
4. Add the `campaign.test.js` case.

**Tests**: unit
**Test cases**:

- `monster.test.js`: `new Monster(2000)` → `'HP 2K/2K'`; `new Monster(16_384_000)` → `'HP 16.4M/16.4M'`; `new Monster(3_000_000_000)` → `'HP 3B/3B'`; `new Monster(2000)` after `hit(500)` → `'HP 1.5K/2K'`; after `hit(1000.05)` (999.95 left) → `'HP 1K/2K'`; after `hit(1000.1)` (999.9 left) → `'HP 999.9/2K'`; after `hit(0.05)` (1999.95 left) → `'HP 2K/2K'`. The existing cases (`'HP 10/30'`, `'HP 0.1/10'`, ...) stay.
- `campaign.test.js` - `a chapter boss of 3000000000 health spawns with that health`: a definition with `bossHealth: 3_000_000_000` at `CHAPTER_BOSS` gives an encounter whose health is `3000000000`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The new cases pass and the three updated `ClickerGame.test.js` expectations pass.

**Commit**: `feat(game): abbreviate the HP text from 1000`

---

### T6: Reset reward grows to chapter 15 in the game [ ]

**Owner**: game-dev
**What**: The reset label pays the chapter shown, up to 15 (CHAP-06 AC 3).
**Where**: `game/src/domain/campaign/accountReset.js`
**Also changes**: `game/src/domain/campaign/accountReset.test.js`, `game/src/adapters/phaser/ClickerGame.test.js` (test at line 4064)
**Read first**: `accountReset.js`, `accountReset.test.js:8-20`, `ClickerGame.test.js:4055-4068`
**Depends on**: T5
**Requirement**: CHAP-06

**Contract**: `RESET_MAX_REWARD = 15`; `resetReward` unchanged otherwise.

**Steps**:

1. Change the constant and its comment (cite AD-019).
2. Update and add the tests below.

**Tests**: unit
**Test cases**:

- `accountReset.test.js`: `pays the number of the chapter from chapter 2` gains `chapter 12 → 12` and `chapter 15 → 15` (`chapter 5 → 5` stays); `pays 5 for a completed campaign` becomes `pays 15 for a completed campaign` with `{ chapter: 15, completed: true } → 15`; chapter 1 still `null`.
- `ClickerGame.test.js`: `offers 5 crystals on a completed campaign` becomes `offers 15 crystals on a completed campaign` with `atChapter(15, true)` and text `'Resetar conta (+15 cristais)'`; add `offers 12 crystals at chapter 12` with `atChapter(12)` and `'Resetar conta (+12 cristais)'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The listed cases pass; the test at line 4185 (`+5` at chapter 5, not completed) passes unchanged.

**Commit**: `feat(game): label the reset with the chapter up to 15`

---

### T7: Chapter formula for chapters 6 and later [ ]

**Owner**: kotlin-backend-dev
**What**: `ChapterDefinition.of(c)` builds any chapter c >= 1: x4 health and +5 defense up to chapter 5, x2 health and +3 defense from chapter 6, caps 80 (defenses) and 70 (critical resistance). Chapters 1 to 5 keep their numbers (CHAP-04).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Chapter.kt`
**Also changes**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/domain/ChapterTest.kt`
**Read first**: `Chapter.kt:70-162`, `ChapterTest.kt:95-160`, spec Chapter Table
**Depends on**: T2
**Requirement**: CHAP-04

**Contract**:

- `fun healthFactor(number: Int): Long` = `4^(number-1)` for `number <= 5`, else `256L shl (number - 5)` (that is `256 x 2^(number-5)`).
- `fun defenseBonus(number: Int): Int` = `5 * (number - 1)` for `number <= 5`, else `20 + 3 * (number - 5)`.
- Constants `MAX_SEEDED_DEFENSE = 80` and `MAX_SEEDED_CRIT_RESISTANCE = 70`, used in place of `EnemyStats.MAX_DEFENSE` and `EnemyStats.MAX_CRIT_RESISTANCE` inside `of()`.
- `of(number)` requires `number >= 1` (message `"Chapter $number must be at least 1"`) and no longer reads `ChapterOrder.MAX_CHAPTER`. `ChapterSeeder` still seeds `1..MAX_CHAPTER` (5), so nothing new is seeded by this task.

**Steps**:

1. Add `defenseBonus` and the two constants; rewrite `healthFactor`.
2. Use them in `of()`; change the `require`.
3. Replace the test `a chapter past the last one cannot be built` with `chapter 0 cannot be built` (`of(0)` throws `IllegalArgumentException`).
4. In `chapter 1 is the first chapter and later chapters have more health and defense`, loop over `2..15`.
5. Add the cases below.

**Tests**: unit
**Test cases** (`ChapterTest.kt`):

- `health doubles each chapter from chapter 6`: `healthFactor(5) == 256L`, `healthFactor(6) == 512L`, `healthFactor(15) == 262_144L`.
- `chapter 6 has twice the health of chapter 5`: boss `1_024_000L`; stage 1 monster `20_480L`; stage 10 monster `38_912L`; stage 10 miniboss `194_560L`.
- `chapter 10 follows the chapter table`: boss `16_384_000L`; stage 10 miniboss `3_112_960L`; boss physical and magical defense 65, critical resistance 65; stage 10 miniboss defenses 55, critical resistance 65.
- `chapter 12 caps the boss critical resistance at 70`: boss physical defense 71, critical resistance 70.
- `chapter 15 follows the chapter table`: boss `524_288_000L`, defenses 80, critical resistance 70; stage 10 monster `19_922_944L`, miniboss `99_614_720L`, miniboss defenses 70, critical resistance 70.
- `chapters 6 to 15 keep phase monsters defenseless and the 30 and 60 second limits`: for c in 6..15 every stage monster has defenses 0 and critical resistance 0, every `minibossTimeLimitMs == 30_000L`, `bossTimeLimitMs == 60_000L`.
- `chapters 1 to 5 keep their numbers`: `of(1)` boss 2000 and stage 1 monster 40; `of(5)` boss `512_000L`, boss defenses 50, critical resistance 50, stage 10 miniboss defenses 40, critical resistance 50.

**Gate**: quick - `cd backend && ./gradlew test --tests '*ChapterTest' --tests '*ProgressTest'`
**Done when**:

- [ ] The listed cases pass; `ProgressTest` passes unchanged.

**Commit**: `feat(backend): define the health and defenses of chapters 6 to 15`

---

### T8: Coin drop formula [ ]

**Owner**: kotlin-backend-dev
**What**: `ChapterDefinition.dropRules(c)` uses the coin factor of Coin Drops (CHAP-09 AC 1 to 4).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Chapter.kt`
**Also changes**: `domain/ChapterTest.kt`, `adapter/config/ChapterSeederIT.kt` (test `application start stores the 15 seed drop rules with the spec values`)
**Read first**: `Chapter.kt:86-110`, `ChapterTest.kt:134-158`, `ChapterSeederIT.kt:60-85`, spec Coin Drops
**Depends on**: T7
**Requirement**: CHAP-09

**Contract**:

- `fun coinFactor(number: Int): Int` = `1 shl (number - 1)` for `number <= 8`, else `128 + 32 * (number - 8)`.
- `dropRules(number)` = `listOf(DropRule(3n-2, 2m, 6m, 1500), DropRule(3n-1, 8m, 20m, 1500), DropRule(3n, 30m, 70m, 1500))` with `m = coinFactor(number)`. Remove the six `*_MIN_COPPER` / `*_MAX_COPPER` constants; add `MONSTER_COPPER = 2..6`, `MINIBOSS_COPPER = 8..20`, `BOSS_COPPER = 30..70` as `IntRange` constants.

**Steps**:

1. Add `coinFactor` and rewrite `dropRules`.
2. Replace the tests `chapter 1 seeds a monster rule of 1 to 5...` and `chapter 5 seeds its rules as ids 13 to 15...` with the new values below; rename `the 15 seed rules of chapters 1 to 5 have distinct ids` to `the 45 seed rules of chapters 1 to 15 have distinct ids` over `1..15` (ids `1..45`).
3. Update the expected values in `ChapterSeederIT` `application start stores the 15 seed drop rules with the spec values` to the chapter 1 to 5 rows of the table below.

**Tests**: unit
**Test cases** (`ChapterTest.kt`, exact `DropRule(id, min, max, 1500)` lists):

- `the coin factor doubles to chapter 8 and then grows by 32`: chapters 1..15 → `1, 2, 4, 8, 16, 32, 64, 128, 160, 192, 224, 256, 288, 320, 352`.
- `chapter 1 seeds 2 to 6, 8 to 20 and 30 to 70 copper`: `(1, 2, 6)`, `(2, 8, 20)`, `(3, 30, 70)`.
- `chapter 5 seeds sixteen times the chapter 1 ranges`: `(13, 32, 96)`, `(14, 128, 320)`, `(15, 480, 1120)`.
- `chapter 8 seeds 128 times the chapter 1 ranges`: `(22, 256, 768)`, `(23, 1024, 2560)`, `(24, 3840, 8960)`.
- `chapter 15 seeds 352 times the chapter 1 ranges`: `(43, 704, 2112)`, `(44, 2816, 7040)`, `(45, 10560, 24640)`.

Rows for the seeder test (chapters 1 to 5): 1 `(2,6)`, 2 `(8,20)`, 3 `(30,70)`, 4 `(4,12)`, 5 `(16,40)`, 6 `(60,140)`, 7 `(8,24)`, 8 `(32,80)`, 9 `(120,280)`, 10 `(16,48)`, 11 `(64,160)`, 12 `(240,560)`, 13 `(32,96)`, 14 `(128,320)`, 15 `(480,1120)`.

**Gate**: full - `cd backend && ./gradlew test --tests '*ChapterTest' --tests '*ChapterSeederIT' --tests '*DropRuleRepositoryIT'`
**Done when**:

- [ ] The listed cases and the updated seeder test pass.

**Commit**: `feat(backend): raise the coin drops with a per-chapter coin factor`

---

### T9: Data migration of the coin drops of chapters 1 to 5 [ ]

**Owner**: kotlin-backend-dev
**What**: Move every drop rule of chapters 1 to 5 that still holds its old seeded range to the new range; leave tuned rules alone (CHAP-09 AC 5, 6, 7).
**Where**: `backend/src/main/resources/db/migration/V9__coin_drop_rebalance.sql` (new)
**Also changes**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/CoinDropMigrationIT.kt` (new)
**Read first**: `V4__monster_health_growth.sql`, `MonsterHealthMigrationIT.kt`
**Depends on**: T8
**Requirement**: CHAP-09

**Contract**: 15 statements of the form `update drop_rules set min_copper = <new min>, max_copper = <new max> where id = <id> and min_copper = <old min> and max_copper = <old max>;`, one per row:

| id | old min | old max | new min | new max |
| --- | --- | --- | --- | --- |
| 1 | 1 | 5 | 2 | 6 |
| 2 | 5 | 15 | 8 | 20 |
| 3 | 20 | 50 | 30 | 70 |
| 4 | 2 | 10 | 4 | 12 |
| 5 | 10 | 30 | 16 | 40 |
| 6 | 40 | 100 | 60 | 140 |
| 7 | 3 | 15 | 8 | 24 |
| 8 | 15 | 45 | 32 | 80 |
| 9 | 60 | 150 | 120 | 280 |
| 10 | 4 | 20 | 16 | 48 |
| 11 | 20 | 60 | 64 | 160 |
| 12 | 80 | 200 | 240 | 560 |
| 13 | 5 | 25 | 32 | 96 |
| 14 | 25 | 75 | 128 | 320 |
| 15 | 100 | 250 | 480 | 1120 |

Header comment: the spec, AD-019, "same columns, so the previous backend keeps crediting kills (AD-016)".

**Steps**:

1. Write the 15 statements in id order.
2. Create `CoinDropMigrationIT` with a `migrate()` that runs the file and an `@AfterTest` that resets rules 1 to 15 to `ChapterDefinition.dropRules(1..5)`.
3. Write the test cases below.

**Tests**: integration
**Test cases** (`CoinDropMigrationIT.kt`):

- `a fresh database holds the new ranges`: rule 1 is `(2, 6)` and rule 15 is `(480, 1120)`.
- `a rule still at its old seeded range gets the new range`: set rule 5 to `(10, 30)` and rule 13 to `(5, 25)`, run `migrate()`, read `(16, 40)` and `(32, 96)`.
- `a rule tuned in the database is left alone`: set rule 6 to `(77, 99)`, run `migrate()`, read `(77, 99)`.
- `the migration keeps the kill interval`: after `migrate()` rule 5 has `kill_interval_ms = 1500`.

**Gate**: full - `cd backend && ./gradlew test --tests '*CoinDropMigrationIT' --tests '*SchemaValidationIT'`
**Done when**:

- [ ] The four cases pass.

**Commit**: `feat(backend): move the seeded coin drops of chapters 1 to 5 to the new ranges`

---

### T10: The campaign runs to chapter 15 [ ]

**Owner**: kotlin-backend-dev
**What**: `ChapterOrder.MAX_CHAPTER = 15` and the chapter element repeats every 5 chapters. The seeder then creates chapters 6 to 15, the chapter 5 boss opens chapter 6, the chapter 15 boss completes, and the reset pays up to 15 (CHAP-01, CHAP-02, CHAP-05, CHAP-06 AC 1, 2).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/ChapterOrder.kt`
**Also changes**: tests `domain/ChapterOrderTest.kt`, `domain/ProgressTest.kt`, `domain/AccountResetTest.kt`, `domain/CardDropsTest.kt`, `adapter/config/ChapterSeederIT.kt`, `adapter/web/ProgressControllerIT.kt`, `adapter/web/AccountResetControllerIT.kt`
**Read first**: `ChapterOrder.kt`, `Progress.kt:55-80`, `CardDrops.kt:40-60`, `AccountReset.kt:1-25`, `ProgressControllerIT.kt:170-290`, `ChapterSeederIT.kt:45-55`
**Depends on**: T9
**Requirement**: CHAP-01, CHAP-02, CHAP-05, CHAP-06

**Contract**:

- `const val MAX_CHAPTER = 15`.
- `element(start, chapter)` requires `chapter in 1..MAX_CHAPTER` and returns `elements(start)[(chapter - 1) % 5]`.
- `elements` and `chapterOf` unchanged (`chapterOf` keeps answering 1 to 5).
- No change to `Progress`, `CardDrops`, `AccountReset` or `ChapterSeeder`; they read `MAX_CHAPTER`.

**Steps**:

1. Change the constant, `element()` and the class comment.
2. Update and add the tests below; run the whole suite and update any other test that pins chapter 5 as the last chapter (L-054).

**Tests**: integration
**Test cases**:

- `ChapterOrderTest`: `a chapter outside 1 to 5 is rejected` becomes `a chapter outside 1 to 15 is rejected` (chapters 0 and 16 throw). Add `chapters 6 to 15 repeat the five-chapter order`: FIRE start gives 6 FIRE, 7 NATURE, 8 WATER, 9 DARKNESS, 10 LIGHT, 11 FIRE, 15 LIGHT. Add `the chapter of an element stays its first chapter`: `chapterOf(FIRE, NATURE) == 2`.
- `ProgressTest`: `the chapter 5 boss opens chapter 6` (cleared at chapter 5 `CHAPTER_BOSS` gives `ProgressPosition(6, 1, PHASE, 1)`, not completed); `the chapter 15 boss completes the campaign`; `a progress completed at chapter 5 opens chapter 6` (`withNextChapterOpen`).
- `AccountResetTest`: `a completed campaign pays 5` becomes `a completed campaign pays the last chapter, 15`; add `chapter 10 pays 10` and `chapter 15 pays 15`; chapter 5 still pays 5.
- `CardDropsTest` (FIRE start, heroes of the catalog): `the first chapter 6 boss win drops the NATURE hero of chapter 7`; `a chapter 11 miniboss drop is the FIRE hero`; `the chapter 14 boss drops the LIGHT hero of chapter 15`; `the chapter 15 boss drops the LIGHT hero of chapter 15`.
- `ChapterSeederIT`: `application start seeds all five chapters` becomes `application start seeds chapters 1 to 15`: 15 chapters, chapter 15 boss health `524_288_000L`, chapter 10 stage 10 miniboss health `3_112_960L`, drop rules 1 to 45 exist, rule 45 is `(10560, 24640)`.
- `ProgressControllerIT`: `every report on the completed last chapter is 409 and the progress stays completed` stores chapter 15 completed instead of 5. Add `clearing the chapter 5 boss answers chapter 6 with boss health 1024000` (store `ProgressEntity("yan", 5, 10, "CHAPTER_BOSS", 1, false)`, report `CLEARED`; answer chapter 6, stage 1, `PHASE`, phase 1, `definition.bossHealth == 1024000`). Add `a progress stored as completed in chapter 5 opens chapter 6 on GET`.
- `AccountResetControllerIT`: `a reset at chapter 10 pays 10 crystals` (stored chapter 10, `fromChapter` 10, answer `reward` 10).

**Gate**: full - `cd backend && ./gradlew test`
**Done when**:

- [ ] Every listed case passes and the whole backend suite passes.
- [ ] `cd backend && ./gradlew build` passes (ktlint).

**Commit**: `feat(backend): run the campaign to chapter 15`

---

### T11: Fake backend knows chapters past 1 [ ]

**Owner**: test-engineer
**What**: The fake backend accepts reports from the stored chapter, opens the next chapter after a chapter boss below `lastChapter`, and pays the reset up to 15. Every existing e2e keeps its behaviour.
**Where**: `game/e2e/support/fakeBackend.js`
**Read first**: `fakeBackend.js:45-70` (`afterOutcome`), `:216-220` (options), `:388-404` (reset), `:700-725` (outcome handler)
**Depends on**: T10
**Requirement**: CHAP-01, CHAP-03, CHAP-06

**Contract**:

- New option of `mockBackend`: `lastChapter = 1`.
- Outcome handler: `reportedFromStored` compares `body.chapter === (progress.chapter ?? 1)` instead of `body.chapter === 1`.
- `afterOutcome(progress, outcome, definition, lastChapter)`: a cleared `CHAPTER_BOSS` with `(progress.chapter ?? 1) < lastChapter` returns `{ ...progress, chapter: (progress.chapter ?? 1) + 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false }`; otherwise `{ ...progress, completed: true }` as today.
- Reset reward (line 393): `progress.completed ? 15 : Math.min(chapter, 15)`.

**Steps**:

1. Add the option and pass it to `afterOutcome`.
2. Change the chapter comparison and the reset reward.
3. Run the whole e2e suite.

**Tests**: e2e
**Test cases**: the existing suite is the test. With the default `lastChapter = 1`, every current spec file passes unchanged.
**Gate**: full - `cd game && npx playwright test`
**Done when**:

- [ ] The whole Playwright suite passes with no spec file changed.

**Commit**: `test(game): let the fake backend open chapters past the first`

---

### T12: e2e of the player-visible changes [ ]

**Owner**: test-engineer
**What**: One Playwright file that proves, on the real page, chapter 6 after the chapter 5 boss, completion at 15, the reset label past 5, and `K` on the HP text and a damage number (CHAP-03, CHAP-06 AC 3, CHAP-07 AC 4, 5).
**Where**: `game/e2e/campaignChapters.spec.js` (new)
**Read first**: `game/e2e/clickPower.spec.js:1-45` (definition helper, `startAs`, `openMainMenu(page, { random })`, reading the scene), `game/e2e/accountReset.spec.js:20-35` (`reset-account`), `game/e2e/equipment.spec.js:17` (`WEAPON` fixture), `game/e2e/stages.spec.js:110-116` (`.stage-message`)
**Depends on**: T11
**Requirement**: CHAP-03, CHAP-06, CHAP-07

**Contract** (fixtures):

- Definition helper with 10 stages, every stage `monsterHealth` 10 000, `minibossHealth` 10 000, monster and miniboss `{ element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 0 }`, boss of the same stats, `bossHealth` from the test.
- Leader Kael (`cards: { yan: { leader: 'kael', copies: { 'kael:0': 1 } } }`), `openMainMenu(page, { random: 0.99 })` so no click is critical.
- Damage numbers are Phaser texts; read them with `page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').children.list.filter((o) => o.type === 'Text').map((o) => o.text))`.

**Steps**:

1. Write the helpers.
2. Write one `test` per case below.

**Tests**: e2e
**Test cases**:

- `beating the chapter 5 boss opens chapter 6`: `lastChapter: 15`, progress `{ chapter: 5, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }`, `bossHealth: 1`. One click; `chapter-hud` reads `Capítulo 6` and `.stage-hud` reads `Stage 1/10  Phase 1/5`, each awaited with `{ timeout: 15_000 }` (the game shows the end of the chapter, then adopts chapter 6 from the outcome answer, `campaignSession.js:200-204`).
- `beating the chapter 15 boss completes the campaign`: `lastChapter: 15`, progress `{ chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }`, `bossHealth: 1`. One click; `.stage-message` reads `Chapter complete!`.
- `the reset button pays 12 crystals at chapter 12`: progress `{ chapter: 12, stage: 1, encounter: 'PHASE', phase: 1 }`; `reset-account` reads `Resetar conta (+12 cristais)`.
- `a completed campaign offers 15 crystals`: progress `{ chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed: true }`; `reset-account` reads `Resetar conta (+15 cristais)`.
- `the HP of a 2000 health boss reads 2K`: progress `{ chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }`, `bossHealth: 2000`; `monster-hp` reads `HP 2K/2K`.
- `a click of 5000 damage shows 5K`: equipment `{ yan: [ { ...WEAPON, baseClick: 4999, heroId: 'kael' } ] }`, phase monster of 10 000 health. One click; the scene texts contain `5K` and `monster-hp` reads `HP 5K/10K`.

**Gate**: full - `cd game && npx playwright test e2e/campaignChapters.spec.js`
**Done when**:

- [ ] The 6 tests pass three runs in a row (`--repeat-each=3`).

**Commit**: `test(game): cover chapters past 5 and the short number format end to end`

---

### T13: Stop mapping the legacy health columns [ ]

**Owner**: kotlin-backend-dev
**What**: Step B of the expand/contract. The entities no longer map `boss_health`, `monster_health` and `miniboss_health`, so the next step can drop them while this backend stays the rollback target (CHAP-08 AC 5).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ChapterEntities.kt`
**Also changes**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ChapterRepositoryIT.kt`
**Read first**: design, Backend persistence - health expand/contract; `ChapterEntities.kt`
**Depends on**: T10, T12
**Requirement**: CHAP-08

**Precondition** (step 0, stop and report if it fails):

1. `./publish.sh` is running.
2. `node -e "const s=JSON.parse(require('fs').readFileSync('.deploy-state','utf8')); console.log(s.active.commit, s.previous)"` prints an `active.commit` for which `git merge-base --is-ancestor <T10 commit> <active.commit>` exits 0, and `previous` is `null` (the 5-minute rollback window of that deploy has closed).

**Contract**: remove `bossHealth: Int?` from `ChapterEntity`, `monsterHealth: Int?` and `minibossHealth: Int?` from `StageEntity`, and `legacyHealth`. Nothing else changes.

**Steps**:

1. Check the precondition.
2. Remove the fields, the helper and their uses.
3. In `ChapterRepositoryIT`, the test `a seeded chapter holds the same value in the legacy and the hit point columns` becomes `a chapter saved now leaves the legacy health columns null`: save chapter 99 with boss health 3000, `select boss_health` is null and `boss_hit_points` is 3000.

**Tests**: integration
**Test cases**: the renamed `ChapterRepositoryIT` case above; `a chapter boss of 3000000000 health round-trips and leaves the legacy column null` passes unchanged.
**Gate**: full - `cd backend && ./gradlew test`
**Done when**:

- [ ] The backend suite passes and `SchemaValidationIT` passes.
- [ ] The commit is pushed alone, and T14 waits for it to be deployed.

**Commit**: `refactor(backend): stop mapping the legacy health columns`

---

### T14: Contract migration drops the legacy health columns [ ]

**Owner**: kotlin-backend-dev
**What**: Step C. Drop the three `integer` health columns and make the hit point columns `not null` (CHAP-08 AC 1).
**Where**: `backend/src/main/resources/db/migration/V10__health_legacy_columns_drop.sql` (new)
**Also changes**: `adapter/repository/HealthHitPointsMigrationIT.kt`, `adapter/repository/MonsterHealthMigrationIT.kt`, `adapter/repository/SchemaConstraintsIT.kt` (lines 48, 52, 203), `adapter/repository/ChapterRepositoryIT.kt` (raw inserts at 150-155)
**Read first**: design, Backend persistence - health expand/contract
**Depends on**: T13
**Requirement**: CHAP-08

**Precondition** (step 0): as in T13, with the T13 commit in place of the T10 commit and `previous` null.

**Contract** (the whole file):

```sql
-- Contract step of AD-016 for the 64-bit health (spec campaign-chapters): the running backend (T13) no longer maps the legacy columns.
alter table chapters drop column boss_health;
alter table stages drop column monster_health;
alter table stages drop column miniboss_health;
alter table chapters alter column boss_hit_points set not null;
alter table stages alter column monster_hit_points set not null;
alter table stages alter column miniboss_hit_points set not null;
```

**Steps**:

1. Check the precondition.
2. Write the migration.
3. `HealthHitPointsMigrationIT`: remove `migrate()`, its `@AfterTest` and the cases that re-run V8 (V8 names columns that no longer exist). Keep `the expand migration adds bigint hit point columns` renamed to `the hit point columns are bigint and not null` (`is_nullable = 'NO'`). Add `the legacy health columns are gone` (no `information_schema.columns` row for the three names).
4. `MonsterHealthMigrationIT`: keep `a new database seeds the grown health` reading `monster_hit_points` and `boss_hit_points`; remove the cases and the `@AfterTest` that re-run V4, because V4 updates columns that no longer exist. Its behaviour was verified in its own feature; say so in the class comment.
5. `SchemaConstraintsIT` and `ChapterRepositoryIT`: in the raw inserts, replace `boss_health`, `monster_health` and `miniboss_health` with the hit point columns.

**Tests**: integration
**Test cases**: `the hit point columns are bigint and not null`; `the legacy health columns are gone`; `a new database seeds the grown health` (chapter 1 stage 1 monster 40, chapter 4 stage 10 monster 4864, chapter 5 boss 512000).
**Gate**: full - `cd backend && ./gradlew test`
**Done when**:

- [ ] The backend suite passes, `SchemaValidationIT` included.
- [ ] `cd backend && ./gradlew build` passes.

**Commit**: `feat(backend): drop the legacy 32-bit health columns`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (deferred)

Phase 1:  T1 → T2
Phase 2:  T3 → T4 → T5 → T6
Phase 3:  T7 → T8 → T9 → T10
Phase 4:  T11 → T12
Phase 5:  T13 → T14
```

Cross-phase dependencies (already satisfied by the phase order):

```
T2 → T7
T10 → T11
T10 → T13
T12 → T13
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 migration + its test | ✅ Granular |
| T2 | 1 type change carried through domain, entity and DTO (cannot compile in parts) | ⚠️ Cohesive, one concept |
| T3 | 1 function | ✅ Granular |
| T4 | 1 function | ✅ Granular |
| T5 | 1 function (test expectations follow it) | ✅ Granular |
| T6 | 1 constant | ✅ Granular |
| T7 | 1 function (`of`) and its helpers | ✅ Granular |
| T8 | 1 function (`dropRules`) | ✅ Granular |
| T9 | 1 migration + its test | ✅ Granular |
| T10 | 1 constant and 1 function; tests across the readers of the constant | ⚠️ Cohesive, one concept |
| T11 | 1 fake backend option | ✅ Granular |
| T12 | 1 e2e file | ✅ Granular |
| T13 | 1 mapping removal | ✅ Granular |
| T14 | 1 migration + test adjustments it forces | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | None | start of Phase 2 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T2 (earlier phase) | start of Phase 3 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 (earlier phase) | start of Phase 4 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T10, T12 (earlier phases) | start of Phase 5 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend migration | integration | integration | ✅ |
| T2 | Backend domain + repository + web | unit + integration | integration (unit case included) | ✅ |
| T3 | Game domain | unit | unit | ✅ |
| T4 | Game domain | unit | unit | ✅ |
| T5 | Game domain + scene | unit | unit | ✅ |
| T6 | Game domain + scene | unit | unit | ✅ |
| T7 | Backend domain | unit | unit | ✅ |
| T8 | Backend domain + seeder | unit + integration | unit (seeder IT updated, full gate) | ✅ |
| T9 | Backend migration | integration | integration | ✅ |
| T10 | Backend domain + seeder + web | unit + integration | integration (unit cases included) | ✅ |
| T11 | e2e support | e2e | e2e (whole suite) | ✅ |
| T12 | e2e | e2e | e2e | ✅ |
| T13 | Backend repository | integration | integration | ✅ |
| T14 | Backend migration | integration | integration | ✅ |

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| CHAP-01 | T10, T11, T12 |
| CHAP-02 | T10 |
| CHAP-03 | T11, T12 |
| CHAP-04 | T7 |
| CHAP-05 | T10 |
| CHAP-06 | T6, T10, T11, T12 |
| CHAP-07 | T3, T4, T5, T12 |
| CHAP-08 | T1, T2, T5, T13, T14 |
| CHAP-09 | T8, T9 |
