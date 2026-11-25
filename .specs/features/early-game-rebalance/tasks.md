# Early Game Rebalance Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T16) and the `ui-artist` review (T17) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/early-game-rebalance/spec.md`
**Design**: `.specs/features/early-game-rebalance/design.md`
**Simulation**: `.specs/features/early-game-rebalance/sim/balance.mjs`
**Status**: Approved by the owner on 2026-11-25 (revision 2, Q2b late-game kit and Q5 affixes in chapters 6 to 15 accepted).

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`. Backend paths below abbreviate `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/` as `main/` and `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/` as `test/`.
- Before reading code, run `graphify query "<question>"` (CLAUDE.md § graphify); read raw files only for the lines the graph or this file located. After changing code, run `graphify update .`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text when the line moved.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's files and `graphify-out/`, which no task stages.
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- **Re-pinning existing tests.** A task changes an existing test only where the task lists it, and only to the value this file gives (each value comes from the spec Chapter Table, Affix Table or Talent Change). Rename a test whose title states a number that changed (L-054) and name every re-pinned test in the commit body. Never delete a test unless the task says so. If a test the task does not list fails, stop and report it to the orchestrator; do not change it.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times. No agent runs two suites at once or leaves one running in the background. Agents run the unit suite and the e2e files named in the task, never the full e2e suite (`gitops` runs it for the report).
- Kotlin style: ktlint (`./gradlew ktlintCheck` is part of the backend gate), the KDoc style of `Chapter.kt`. Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces, imports pointing inward only (AD-003). Player text in Portuguese exactly as written in the spec § Player-Facing Texts (AD-007).
- The desktop is the target. No task adds phone behaviour.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check: every AC value asserted, CSS values with `toHaveCSS`, 3 to 5 mutants with `scripts/sensor.mjs`), `backend/build.gradle.kts` (JUnit 5, Testcontainers, JaCoCo, ktlint), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome, fake backend). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Talents.kt`, `Chapter.kt`) | unit | Every value of the Talent Change, Chapter Table and Affix Table; every bound of `MonsterAffix` | `test/domain/*Test.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend migrations (V16, V17) | integration (Testcontainers) | Seeded rows rewritten, tuned rows kept, a second run changes nothing, database checks refuse bad rows, previous release starts | `test/adapter/repository/*MigrationIT.kt`, `PreviousBackendCompatibilityIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend repository and payload | integration | Affixes saved and read back; `minibossAffix` and `bossAffix` in progress and farm payloads | `test/adapter/repository/ChapterRepositoryIT.kt`, `test/adapter/web/ProgressControllerIT.kt`, `FarmControllerIT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Game domain (`monsterAffix.js`, `monster.js`, `skillCombat.js`, `campaign.js`) | unit | 1:1 to Affixes AC 4 to 10, 12 and every Edge Case | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game adapter (`ClickerGame.js`, `style.css`) | e2e | Every AC of Display, Curve AC 9, Crit AC 4 and 5, Flat AC 4 and 5, Affixes AC 4 to 12 in the browser | `game/e2e/earlyGameRebalance*.spec.js`, `game/e2e/monsterAffixes*.spec.js` | `cd game && npx playwright test e2e/<file>` |
| Simulation, UI review artifact | none | Reviewed by the owner (design) and the `ui-artist` | `.specs/features/early-game-rebalance/sim/`, `game/ui-review/earlyGameRebalance.shots.js` | `node .specs/features/early-game-rebalance/sim/balance.mjs`, `cd game && npm run ui:shots -- earlyGameRebalance` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | Every backend task | `cd backend && ./gradlew ktlintCheck test` |
| Quick | Game tasks with unit tests only | `cd game && npm test` |
| Build | Game tasks that touch the scene or the stylesheet | `cd game && npm test && npm run build` |
| Full | Tasks that add or change e2e files | `cd game && npm test && npm run build && npx playwright test <files of the task>` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every arrow is a `Depends on` inside the phase; dependencies on an earlier phase are listed in the task.

### Phase 1: Backend numbers (kotlin-backend-dev)

```
T1
T2 → T3
```

### Phase 2: Backend affixes (kotlin-backend-dev)

```
T4 → T5 → T6
```

### Phase 3: Game (game-dev)

```
T7 → T8 → T9
T7 → T10 → T11
T9 → T11
```

### Phase 4: Tests in the browser and author check (test-engineer)

```
T12 → T13 → T14 → T15 → T16
```

### Phase 5: UI review (ui-artist)

```
T17
```

---

## Task Breakdown

### Phase 1: Backend numbers

#### T1: Talent catalog: flat 1, critical chance 5, critical damage 15 a level [x]

**Owner**: kotlin-backend-dev
**Goal**: `CLICK_FLAT_DAMAGE` gives 1 a level, `CRIT_CHANCE` 5 points a level and `CRIT_DAMAGE` 15 % a level, each times its grade (EGR-01; spec P1 Flat AC 1 to 3, P1 Critical path AC 1, 2, § Talent Change).
**Where**: `main/domain/Talents.kt`
**Files**:
- Also changes: `test/domain/TalentsTest.kt` (re-pins below)
- Read first: `main/domain/Talents.kt:74-117` (`TalentCatalog`), `test/domain/TalentsTest.kt:15-75`, `test/adapter/web/TalentControllerIT.kt` (search `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE`, `perLevel`, `value`)
**Depends on**: None
**Requirement**: EGR-01

**Contract**: in `TalentCatalog.grade1` replace the three lines

```kotlin
TalentDefinition("CRIT_CHANCE", TalentBranch.POWER, "Chance de crítico", "points", 1),
TalentDefinition("CRIT_DAMAGE", TalentBranch.POWER, "Dano crítico", "%", 5),
TalentDefinition("CLICK_FLAT_DAMAGE", TalentBranch.POWER, "Dano direto de clique", "dmg", 2, firstLevel = 1),
```

by

```kotlin
TalentDefinition("CRIT_CHANCE", TalentBranch.POWER, "Chance de crítico", "points", 5),
TalentDefinition("CRIT_DAMAGE", TalentBranch.POWER, "Dano crítico", "%", 15),
TalentDefinition("CLICK_FLAT_DAMAGE", TalentBranch.POWER, "Dano direto de clique", "dmg", 1),
```

keeping their positions in the list. Update the KDoc above `TalentCatalog` if it names "1, 3, 5". Nothing else in the catalog, `TalentRules` or `PlayerTalents` changes.

**Steps**:

1. Edit the three catalog lines.
2. Re-pin `TalentsTest.kt` as listed and add the new cases.
3. Run the gate; if `TalentControllerIT` pins a `perLevel` or `value` of these three talents, re-pin it to the contract (`perLevel` grade 1 / 2 / 3: flat 1 / 2 / 3, critical chance 5 / 10 / 15, critical damage 15 / 30 / 45) and name it in the commit body.

**Tests**: unit
**Re-pinned** (`test/domain/TalentsTest.kt`):

| Test | Old | New |
| ---- | --- | --- |
| the first test of the file (the `Triple` list of id, branch, perLevel) | `Triple("CRIT_CHANCE", TalentBranch.POWER, 1)`, `Triple("CRIT_DAMAGE", TalentBranch.POWER, 5)`, `Triple("CLICK_FLAT_DAMAGE", TalentBranch.POWER, 2)` | `5`, `15`, `1` |
| `the flat click damage talent gives 1, 3, 5 and so on up to 19` | renamed `the flat click damage talent gives 1 a level up to 10`; `listOf(0, 1, 3, 5, 19)` | `listOf(0, 1, 2, 3, 10)` for levels `listOf(0, 1, 2, 3, 10)` |
| `the catalog has 3 grades of the 9 talents and Fúria crescente make 28` | `listOf(19, 38, 57)` | `listOf(10, 20, 30)` |

**New test cases** (`TalentsTest.kt`):

- `grade 2 and 3 of the flat click damage give 2 and 3 a level`: `CLICK_FLAT_DAMAGE_G2` `valueAt(1) == 2`, `valueAt(5) == 10`; `CLICK_FLAT_DAMAGE_G3` `valueAt(1) == 3`, `valueAt(7) == 21`.
- `the critical chance talent gives 5 points a level, 50, 100 and 150 at level 10 of its grades`: `CRIT_CHANCE.valueAt(1) == 5`, then `listOf(50, 100, 150)` for the three grades at 10.
- `the critical damage talent gives 15 percent a level, 150, 300 and 450 at level 10 of its grades`: `CRIT_DAMAGE.valueAt(1) == 15`, then `listOf(150, 300, 450)`.
- `the points of a first clear stay 2 for a miniboss and 5 for a chapter boss`: `TalentRules()` `pointsPerMiniboss == 2`, `pointsPerChapterBoss == 5`, `pointsPerPhase == 0` (spec Flat AC 3).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 3 re-pinned and 4 new cases pass; every other backend test passes unchanged (except a `TalentControllerIT` re-pin of step 3, named in the commit body).

**Commit**: `feat(backend): rebalance the flat and critical talents`

---

#### T2: Every chapter seeds the fitted curve, 8 phases, 3x minibosses and the new limits [x]

**Owner**: kotlin-backend-dev
**Goal**: `ChapterDefinition.of(c)` for c from 1 to 15 seeds the spec Chapter Table (EGR-02, EGR-03; spec P1 Curve AC 1 to 4, 8; Critical path AC 3).
**Where**: `main/domain/Chapter.kt`
**Files**:
- Also changes (re-pins below): `test/domain/ChapterTest.kt`, `test/adapter/web/ProgressControllerIT.kt`, `test/adapter/web/FarmControllerIT.kt`, `test/adapter/repository/MonsterHealthMigrationIT.kt`, `test/adapter/repository/StageAddsMigrationIT.kt`
- Read first: `main/domain/Chapter.kt:87-221` (companion constants, `addsOf`, `healthFactor`, `defenseBonus`, `of`), `test/domain/ChapterTest.kt` (whole: the cases and the helpers `assertStageFormulas`, `assertChapterTableRow`, `firstFiveChapters`), `test/adapter/web/ProgressControllerIT.kt:80-250`, `test/adapter/web/FarmControllerIT.kt:275-302`, `test/adapter/repository/StageAddsMigrationIT.kt:40-70`
**Depends on**: None
**Requirement**: EGR-02, EGR-03

**Contract** (companion of `ChapterDefinition`):

- `PHASES_PER_STAGE` 5 -> **8**; `MINIBOSS_HEALTH_FACTOR` 5 -> **3**; `MINIBOSS_TIME_LIMIT_MS` 30_000 -> **45_000**; `BOSS_TIME_LIMIT_MS` 60_000 -> **90_000**. `BASE_MONSTER_HEALTH`, `MONSTER_HEALTH_PER_STAGE`, `BOSS_HEALTH` are no longer read by `of`: delete them only if nothing else reads them (`healthFactor` and `HEALTH_GROWTH_PER_CHAPTER` stay; tests read `healthFactor`).
- New constants:

```kotlin
/** The last chapter with the early critical resistances (spec early-game-rebalance, Chapter Table); later chapters keep the release formula. */
const val LAST_EARLY_CHAPTER = 5
private const val EARLY_CRIT_RESISTANCE_PER_CHAPTER = 8
private const val EARLY_BOSS_CRIT_RESISTANCE_PER_CHAPTER = 10
private const val EARLY_BOSS_CRIT_RESISTANCE_OFFSET = 5

/** Phase monster health of chapters 1 to 15, stage 1 first: round(B x g^(n-1)) of the spec Chapter Table, written out. */
private val PHASE_HEALTH: List<List<Long>> =
    listOf(
        listOf(69L, 92L, 122L, 162L, 216L, 287L, 382L, 508L, 676L, 898L),
        listOf(265L, 342L, 441L, 569L, 734L, 947L, 1221L, 1575L, 2032L, 2622L),
        listOf(1000L, 1160L, 1346L, 1561L, 1811L, 2100L, 2436L, 2826L, 3278L, 3803L),
        listOf(4750L, 4940L, 5138L, 5343L, 5557L, 5779L, 6010L, 6251L, 6501L, 6761L),
        listOf(7250L, 7540L, 7842L, 8155L, 8481L, 8821L, 9174L, 9541L, 9922L, 10319L),
        listOf(10000L, 10400L, 10816L, 11249L, 11699L, 12167L, 12653L, 13159L, 13686L, 14233L),
        listOf(28000L, 29120L, 30285L, 31496L, 32756L, 34066L, 35429L, 36846L, 38320L, 39853L),
        listOf(36000L, 37440L, 38938L, 40495L, 42115L, 43800L, 45551L, 47374L, 49268L, 51239L),
        listOf(58000L, 60320L, 62733L, 65242L, 67852L, 70566L, 73389L, 76324L, 79377L, 82552L),
        listOf(71000L, 73840L, 76794L, 79865L, 83060L, 86382L, 89838L, 93431L, 97168L, 101055L),
        listOf(38000L, 39520L, 41101L, 42745L, 44455L, 46233L, 48082L, 50005L, 52006L, 54086L),
        listOf(64000L, 66560L, 69222L, 71991L, 74871L, 77866L, 80980L, 84220L, 87588L, 91092L),
        listOf(90000L, 93600L, 97344L, 101238L, 105287L, 109499L, 113879L, 118434L, 123171L, 128098L),
        listOf(133000L, 138320L, 143853L, 149607L, 155591L, 161815L, 168287L, 175019L, 182020L, 189300L),
        listOf(161000L, 167440L, 174138L, 181103L, 188347L, 195881L, 203716L, 211865L, 220340L, 229153L),
    )

/** Chapter boss health of chapters 1 to 15 (spec Chapter Table). */
private val BOSS_HEALTH_TABLE: List<Long> =
    listOf(6000L, 12_500L, 13_000L, 34_000L, 80_000L, 130_000L, 139_000L, 313_000L, 475_000L, 900_000L, 956_000L, 1_850_000L, 1_940_000L, 2_837_000L, 4_265_000L)
```

Rules inside `of(number)` (stage `n`, `c = number`, `require(number in 1..ChapterOrder.MAX_CHAPTER)` for the tables):

| Value | Chapters 1 to 5 | Chapters 6 to 15 |
| --- | --- | --- |
| `phasesPerStage` | 8 | 8 |
| `monsterHealth` | `PHASE_HEALTH[c - 1][n - 1]` | `PHASE_HEALTH[c - 1][n - 1]` |
| `minibossHealth` | `3 x monsterHealth` | `3 x monsterHealth` |
| `minibossTimeLimitMs` | 45_000 | 45_000 |
| miniboss defense | unchanged `min(10 + n + defenseBonus(c), 80)` | unchanged |
| miniboss `critResistance` | `(n - 1) + 8(c - 1)` | unchanged `min(10 + 2n + defenseBonus(c), 70)` |
| `adds` | none | `addsOf(c, monsterHealth)` as today (so 3 x the new phase health) |
| `bossHealth` | `BOSS_HEALTH_TABLE[c - 1]` | `BOSS_HEALTH_TABLE[c - 1]` |
| `bossTimeLimitMs` | 90_000 | 90_000 |
| boss defense, elements | unchanged | unchanged |
| boss `critResistance` | `10c - 5` | unchanged `min(30 + defenseBonus(c), 70)` |

Update the KDoc of `first()` ("reachable with 1 damage per click") and of `of()` to name the tables.

**Steps**:

1. Change the four constants; add the new constants and tables.
2. Rewrite the six values of the table in `of(number)`.
3. Re-pin the tests listed; add the new cases.
4. Run the gate. Any other test that fails because it reads a seeded chapter number (health, phases, limits, critical resistance of chapters 1 to 5, add health) gets the spec value with the same re-pin rule and is named in the commit body; a test failing for another reason stops the task.

**Tests**: unit (+ integration re-pins)
**Re-pinned** (`test/domain/ChapterTest.kt`; values from the spec Chapter Table):

| Test | New content |
| ---- | ----------- |
| `the seeded first chapter has 10 stages of 5 phases` | renamed `the seeded first chapter has 10 stages of 8 phases` |
| `the seeded phase monster health grows from 40 to 76 in steps of 4` | renamed `the seeded phase monster health of chapter 1 grows from 69 to 898`; `listOf(69L, 92L, 122L, 162L, 216L, 287L, 382L, 508L, 676L, 898L)` |
| `the seeded miniboss has 5 times the phase monster health and a 30 second limit` | renamed `the seeded miniboss has 3 times the phase monster health and a 45 second limit`, for every chapter 1 to 15 |
| `the seeded chapter boss has 2000 health and a 60 second limit` | renamed `the seeded chapter boss of chapter 1 has 6000 health and a 90 second limit` |
| `chapters 1 to 5 keep their numbers` | renamed `chapters 1 to 5 seed the table`; `of(1).bossHealth == 6000L`, `of(1).stage(1).monsterHealth == 69L`, `of(5).bossHealth == 80_000L`, `of(5).boss.defense == 50`, `of(5).boss.critResistance == 45`, `of(5).stage(10).miniboss.defense == 40`, `of(5).stage(10).miniboss.critResistance == 41` |
| `every stage of chapters 1 to 5 follows the release formulas` | renamed `every stage of chapters 1 to 5 follows the table`; for c 1..5, n 1..10: `monsterHealth` = the table written as literal lists in the test, `minibossHealth == 3 x`, defense `10 + n + 5(c - 1)`, critical resistance `(n - 1) + 8(c - 1)`, elements as today |
| `every stage of chapters 6 to 15 follows the spec formulas` | renamed `every stage of chapters 6 to 15 follows the table`; health from the literal lists, `minibossHealth == 3 x`, defense and critical resistance by today's formulas, elements as today |
| `every row of the chapter table holds for chapters 6 to 15`, `chapter 10 follows the chapter table`, `chapter 15 follows the chapter table` | boss health from the spec (chapter 10: 900_000, chapter 15: 4_265_000), defenses and critical resistances unchanged; first and last stage health from the table |
| `chapters 1 to 5 keep every column of the chapter table` | rewrite `assertChapterTableRow` for chapters 1 to 5: health 6000, 12500, 13000, 34000, 80000; defense 30, 35, 40, 45, 50; critical resistance 5, 15, 25, 35, 45 |
| `chapters 1 to 5 keep the 60 and 30 second limits` and `chapters 6 to 15 keep phase monsters defenseless and the 30 and 60 second limits` | renamed `every chapter seeds 90 and 45 second limits` and `chapters 6 to 15 keep phase monsters defenseless and seed 90 and 45 second limits` |
| `chapter 1 is the first chapter and later chapters have more health and defense` | keep the title; `of(2).stage(1).monsterHealth` (265) > `of(1).stage(1).monsterHealth` (69); defenses as today |
| `the health multiplies by 4 each chapter`, `health doubles each chapter from chapter 6` | renamed `the health factor still multiplies by 4 to chapter 5 and by 2 after`; assert `healthFactor` only (1, 4, 16, 64, 256, 512, ...) |
| `chapter 6 has twice the health of chapter 5` | renamed `chapter 6 starts where chapter 5 ends`; `of(5).stage(10).monsterHealth == 10_319L`, `of(6).stage(1).monsterHealth == 10_000L`, `of(6).bossHealth == 130_000L` |
| `a stage keeps a health above the 32-bit limit` | keep it only if it builds its own `StageDefinition`; if it reads a seeded chapter, build `StageDefinition(1, 8, 3_000_000_000L, 9_000_000_000L, 45_000L)` by hand instead |
| `chapter 15 stage 1 seeds adds of 31457280 health` | renamed `chapter 15 stage 1 seeds adds of 483000 health` |

**Re-pinned** (integration):

| File | Assertion (old) | New |
| ---- | --------------- | --- |
| `ProgressControllerIT.kt` | chapter 1 `definition.bossHealth` 2000, `bossTimeLimitMs` 60_000 | 6000, 90_000 |
| `ProgressControllerIT.kt` | `stages[0].monsterHealth` 40, `minibossHealth` 200, `minibossTimeLimitMs` 30_000 | 69, 207, 45_000 |
| `ProgressControllerIT.kt` | `stages[9].monsterHealth` 76, `minibossHealth` 380 | 898, 2694 |
| `ProgressControllerIT.kt` | `definition.boss.critResistance` 30; `stages[0].miniboss.critResistance` 12; `stages[9].miniboss.critResistance` 30 | 5; 0; 9 |
| `ProgressControllerIT.kt` | chapter 2 `definition.bossHealth` 8000 (`:195`) | 12500 |
| `ProgressControllerIT.kt` | chapter 6 `definition.bossHealth` 1_024_000 (`:225`, `:249`), `stages[0].monsterHealth` 20_480 (`:232`), `bossTimeLimitMs` 60_000 (`:226`) | 130_000, 10_000, 90_000 |
| `FarmControllerIT.kt` | chapter 3 `definition.bossHealth` 32000, `stages[0].minibossHealth` 3200 | 13000, 3000 |
| `FarmControllerIT.kt` | chapter 2 `definition.bossHealth` 8000, `stages[0].minibossHealth` 800 | 12500, 795 |
| `MonsterHealthMigrationIT.kt` | `a new database seeds the grown health`: 40, 4864, 512_000 | renamed `a new database seeds the table`: chapter 1 stage 1 69, chapter 4 stage 10 6761, chapter 5 boss 80_000 |
| `StageAddsMigrationIT.kt` | `11/1/1` hit points 1_966_080; `15/10/2` 59_768_832; the restore `update stages set monster_hit_points = 1572864 where id = '12/3'` | 114_000; 687_459; `69222` (and any other old add health in the file: 3 x the table value of its stage) |

The `3_000_000_000` case of `ProgressControllerIT` (`:101`) writes its own value and stays.

**New test cases** (`ChapterTest.kt`):

- `miniboss 1-1 asks 207 health in 45 seconds with critical resistance 0`: `of(1).stage(1)` `minibossHealth == 207L`, `minibossTimeLimitMs == 45_000L`, `miniboss.critResistance == 0`, `miniboss.defense == 11`.
- `the chapter 1 boss has critical resistance 5 and the chapter 5 boss 45`.
- `chapters 6 to 15 keep their critical resistances, defenses and elements`: for c 6..15 and n 1..10, `critResistance == min(10 + 2n + defenseBonus(c), 70)`, defense `min(10 + n + defenseBonus(c), 80)`; boss `min(30 + defenseBonus(c), 70)` and `min(30 + defenseBonus(c), 80)`.
- `every add of chapters 11 to 15 has 3 times the table health of its stage and today's buff` (spec Curve AC 4).
- `no boss has less health than the boss before it`: `(2..15).all { of(it).bossHealth >= of(it - 1).bossHealth }`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] Every re-pinned and new case passes; every other backend test passes unchanged (or is re-pinned under step 4 and named in the commit body).

**Commit**: `feat(backend): seed every chapter with the fitted health curve`

---

#### T3: V16 rewrites the stored chapters [x]

**Owner**: kotlin-backend-dev
**Goal**: A database seeded before this feature gets the Chapter Table numbers, 8 phases and the new add health on the rows that still hold today's seed; tuned rows stay; a second run changes nothing (EGR-04; spec P1 Curve AC 5 to 7, Critical path AC 4, 5).
**Where**: `backend/src/main/resources/db/migration/V16__early_game_rebalance.sql` (new)
**Files**:
- Also creates: `test/adapter/repository/EarlyGameRebalanceMigrationIT.kt`
- Also changes: `test/adapter/repository/PreviousBackendCompatibilityIT.kt`
- Read first: `V4__monster_health_growth.sql`, `V13__miniboss_adds.sql` (re-runnable style), `V1__schema.sql:54-87` (`enemies`, `chapters`, `stages`), `test/adapter/repository/StageAddsMigrationIT.kt` (how a migration IT re-runs a file on the shared seeded database and restores it in `@AfterTest`), `PreviousBackendCompatibilityIT.kt:150-185`
**Depends on**: T2
**Requirement**: EGR-04

**Contract** (the file, in this order; every statement guarded so the file can run again). `seed(c, n)` below stands for today's seeded phase health, written in SQL as

```sql
(40 + 4 * (s.number - 1)) * (case when s.chapter <= 5 then power(4, s.chapter - 1) else 256 * power(2, s.chapter - 5) end)::bigint
```

and `boss_seed(c)` for `2000 * (case when c.number <= 5 then power(4, c.number - 1) else 256 * power(2, c.number - 5) end)::bigint`.

```sql
-- early-game-rebalance (AD-030): every chapter moves to the fitted table, 8 phases a stage, 3x minibosses, 45 s and 90 s limits. Data only
-- (AD-016): same columns, so the previous backend keeps reading them. Each update touches only a row that still holds the value the release
-- seeded, so a value tuned in the database survives, and a second run changes nothing.

-- 1. Phases
update stages set phases_per_stage = 8 where phases_per_stage = 5;

-- 2. Adds of chapters 11 to 15 first, while their stage still holds the old seed: 3 times the new phase health
update stage_adds a
   set hit_points = 3 * t.health
  from stages s, (values <the 50 rows of chapters 11 to 15 of the list in step 3>) as t (chapter, number, health)
 where a.stage_id = s.id and s.chapter = t.chapter and s.number = t.number
   and s.monster_hit_points = <seed(c, n)>
   and a.hit_points = 3 * <seed(c, n)>;

-- 3. Phase monster and miniboss health of chapters 1 to 15
update stages s
   set monster_hit_points  = t.health,
       miniboss_hit_points = 3 * t.health
  from (values
        <the 150 rows below>
       ) as t (chapter, number, health)
 where s.chapter = t.chapter and s.number = t.number
   and s.monster_hit_points  = <seed(c, n)>
   and s.miniboss_hit_points = 5 * <seed(c, n)>;

-- 4. Limits
update stages   set miniboss_time_limit_ms = 45000 where miniboss_time_limit_ms = 30000;
update chapters set boss_time_limit_ms     = 90000 where boss_time_limit_ms     = 60000;

-- 5. Chapter boss health
update chapters c
   set boss_hit_points = t.health
  from (values (1, 6000), (2, 12500), (3, 13000), (4, 34000), (5, 80000), (6, 130000), (7, 139000), (8, 313000), (9, 475000), (10, 900000),
               (11, 956000), (12, 1850000), (13, 1940000), (14, 2837000), (15, 4265000)) as t (number, health)
 where c.number = t.number and c.boss_hit_points = <boss_seed(c)>;

-- 6. Miniboss critical resistance of chapters 1 to 5: the enemies catalog is shared, so new rows are added and only these minibosses are repointed
insert into enemies (element, physical_defense, magical_defense, crit_resistance)
select distinct e.element, e.physical_defense, e.magical_defense, (s.number - 1) + 8 * (s.chapter - 1)
  from stages s join enemies e on e.id = s.miniboss_enemy_id
 where s.chapter between 1 and 5 and e.crit_resistance = 10 + 2 * s.number + 5 * (s.chapter - 1)
on conflict on constraint uk_enemies_attributes do nothing;

update stages s
   set miniboss_enemy_id = n.id
  from enemies e, enemies n
 where e.id = s.miniboss_enemy_id and s.chapter between 1 and 5
   and e.crit_resistance = 10 + 2 * s.number + 5 * (s.chapter - 1)
   and n.element = e.element and n.physical_defense = e.physical_defense and n.magical_defense = e.magical_defense
   and n.crit_resistance = (s.number - 1) + 8 * (s.chapter - 1);

-- 7. Chapter boss critical resistance of chapters 1 to 5, the same way: 30 + 5(c - 1) becomes 10c - 5
insert into enemies (element, physical_defense, magical_defense, crit_resistance)
select distinct e.element, e.physical_defense, e.magical_defense, 10 * c.number - 5
  from chapters c join enemies e on e.id = c.boss_enemy_id
 where c.number between 1 and 5 and e.crit_resistance = 30 + 5 * (c.number - 1)
on conflict on constraint uk_enemies_attributes do nothing;

update chapters c
   set boss_enemy_id = n.id
  from enemies e, enemies n
 where e.id = c.boss_enemy_id and c.number between 1 and 5
   and e.crit_resistance = 30 + 5 * (c.number - 1)
   and n.element = e.element and n.physical_defense = e.physical_defense and n.magical_defense = e.magical_defense
   and n.crit_resistance = 10 * c.number - 5;
```

The 150 `(chapter, number, health)` rows of step 3 (step 2 uses the chapter 11 to 15 rows), copied from the spec Chapter Table:

```
(1, 1, 69), (1, 2, 92), (1, 3, 122), (1, 4, 162), (1, 5, 216), (1, 6, 287), (1, 7, 382), (1, 8, 508), (1, 9, 676), (1, 10, 898),
(2, 1, 265), (2, 2, 342), (2, 3, 441), (2, 4, 569), (2, 5, 734), (2, 6, 947), (2, 7, 1221), (2, 8, 1575), (2, 9, 2032), (2, 10, 2622),
(3, 1, 1000), (3, 2, 1160), (3, 3, 1346), (3, 4, 1561), (3, 5, 1811), (3, 6, 2100), (3, 7, 2436), (3, 8, 2826), (3, 9, 3278), (3, 10, 3803),
(4, 1, 4750), (4, 2, 4940), (4, 3, 5138), (4, 4, 5343), (4, 5, 5557), (4, 6, 5779), (4, 7, 6010), (4, 8, 6251), (4, 9, 6501), (4, 10, 6761),
(5, 1, 7250), (5, 2, 7540), (5, 3, 7842), (5, 4, 8155), (5, 5, 8481), (5, 6, 8821), (5, 7, 9174), (5, 8, 9541), (5, 9, 9922), (5, 10, 10319),
(6, 1, 10000), (6, 2, 10400), (6, 3, 10816), (6, 4, 11249), (6, 5, 11699), (6, 6, 12167), (6, 7, 12653), (6, 8, 13159), (6, 9, 13686), (6, 10, 14233),
(7, 1, 28000), (7, 2, 29120), (7, 3, 30285), (7, 4, 31496), (7, 5, 32756), (7, 6, 34066), (7, 7, 35429), (7, 8, 36846), (7, 9, 38320), (7, 10, 39853),
(8, 1, 36000), (8, 2, 37440), (8, 3, 38938), (8, 4, 40495), (8, 5, 42115), (8, 6, 43800), (8, 7, 45551), (8, 8, 47374), (8, 9, 49268), (8, 10, 51239),
(9, 1, 58000), (9, 2, 60320), (9, 3, 62733), (9, 4, 65242), (9, 5, 67852), (9, 6, 70566), (9, 7, 73389), (9, 8, 76324), (9, 9, 79377), (9, 10, 82552),
(10, 1, 71000), (10, 2, 73840), (10, 3, 76794), (10, 4, 79865), (10, 5, 83060), (10, 6, 86382), (10, 7, 89838), (10, 8, 93431), (10, 9, 97168), (10, 10, 101055),
(11, 1, 38000), (11, 2, 39520), (11, 3, 41101), (11, 4, 42745), (11, 5, 44455), (11, 6, 46233), (11, 7, 48082), (11, 8, 50005), (11, 9, 52006), (11, 10, 54086),
(12, 1, 64000), (12, 2, 66560), (12, 3, 69222), (12, 4, 71991), (12, 5, 74871), (12, 6, 77866), (12, 7, 80980), (12, 8, 84220), (12, 9, 87588), (12, 10, 91092),
(13, 1, 90000), (13, 2, 93600), (13, 3, 97344), (13, 4, 101238), (13, 5, 105287), (13, 6, 109499), (13, 7, 113879), (13, 8, 118434), (13, 9, 123171), (13, 10, 128098),
(14, 1, 133000), (14, 2, 138320), (14, 3, 143853), (14, 4, 149607), (14, 5, 155591), (14, 6, 161815), (14, 7, 168287), (14, 8, 175019), (14, 9, 182020), (14, 10, 189300),
(15, 1, 161000), (15, 2, 167440), (15, 3, 174138), (15, 4, 181103), (15, 5, 188347), (15, 6, 195881), (15, 7, 203716), (15, 8, 211865), (15, 9, 220340), (15, 10, 229153)
```

**Steps**:

1. Write the file.
2. Write `EarlyGameRebalanceMigrationIT` (extends `IntegrationTestBase` like `StageAddsMigrationIT`). Each test first writes today's seed back onto the rows it reads (SQL in the test: 5 phases, health `seed(c, n)` and `5 x`, limits 30000 / 60000, boss `boss_seed(c)`, adds `3 x seed(c, n)`, and repoints at an enemy with today's critical resistance, inserted with `on conflict do nothing`), runs the file with `jdbc.execute(ClassPathResource("db/migration/V16__early_game_rebalance.sql")...)`, asserts, and an `@AfterTest` runs the file once more so the shared database holds the new seed for the other tests.
3. Add the previous-release case to `PreviousBackendCompatibilityIT` and re-pin the three existing counts.

**Tests**: integration
**Test cases** (`EarlyGameRebalanceMigrationIT.kt`):

- `the migration gives every stage 8 phases`.
- `the migration gives every chapter the table phase and miniboss health`: stage `1/1` holds 69 and 207, `1/10` 898 and 2694, `3/5` 1811 and 5433, `6/1` 10000 and 30000, `15/10` 229153 and 687459.
- `the migration gives every miniboss 45 seconds and every boss 90 seconds`.
- `the migration gives the chapter bosses the table health`: chapter 1 6000, 5 80000, 6 130000, 15 4265000.
- `the migration gives the adds of chapters 11 to 15 3 times the new phase health`: add `11/1/1` 114000, `15/10/2` 687459; their buffs unchanged (30, 50).
- `the migration points the minibosses of chapters 1 to 5 at the new critical resistance with the same element and defense`: stage `1/1` enemy `crit_resistance` 0, `physical_defense` 11, FIRE; `2/10` 17 and 25, FIRE; `5/10` 41 and 40, LIGHT; stage `6/1` keeps its enemy.
- `the migration points the chapter bosses of 1 to 5 at critical resistance 5, 15, 25, 35 and 45`, defense 30, 35, 40, 45, 50 unchanged; chapter 6 keeps its enemy.
- `a tuned stage health, phase count, limit, add and boss health stay`: before the run set stage `1/2` `monster_hit_points` 999, stage `1/4` `phases_per_stage` 6, stage `1/3` `miniboss_time_limit_ms` 31000, add `12/1/1` `hit_points` 77, chapter 2 `boss_hit_points` 7777; after it all five values are still there while stage `1/1` got 69.
- `a miniboss whose enemy was tuned keeps its enemy`: repoint stage `1/4` at an enemy with critical resistance 50 before the run; after it the stage still points at that enemy id.
- `a second run changes nothing`: snapshot `select id, phases_per_stage, monster_hit_points, miniboss_hit_points, miniboss_time_limit_ms, miniboss_enemy_id from stages order by id`, the same of `chapters` and of `stage_adds` after one run, run again, compare equal; and `select count(*) from enemies` is equal.

**Re-pinned / new** (`PreviousBackendCompatibilityIT.kt`):

| Test | Old | New in this task |
| ---- | --- | --- |
| `the previous release starts on the migrated schema and its validation ignores V13` | `futureMigrations = 3` | `4` |
| `the release before the black awareness staff starts ... V14` | `futureMigrations = 2` | `3` |
| `the release before the talent tree rework starts ... V15` | `futureMigrations = 1` | `2` |
| new: `the release before the early game rebalance starts on the migrated schema and its validation ignores V16 and V17` | - | `previousReleaseStartsOnMigratedSchema(lastVersion = 15, futureMigrations = 1)` |

T5 adds V17 and raises each of these four counts by 1. If the boss assertion at `:166` (`assertEquals(2_000L, ... chapters where number = 1)`) fails, re-pin it to `6000L` and name it in the commit body.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 10 cases of `EarlyGameRebalanceMigrationIT` and the new compatibility case pass; every other backend test passes.

**Commit**: `feat(backend): move the stored chapters to the fitted table`

---

### Phase 2: Backend affixes

#### T4: MonsterAffix domain and seed [x]

**Owner**: kotlin-backend-dev
**Goal**: `ChapterDefinition.of(c)` seeds the affixes of the spec Affix Table for chapters 2 to 15, with the bounds of the spec (EGR-05; spec P1 Affixes AC 1).
**Where**: `main/domain/Chapter.kt`
**Files**:
- Also changes: `test/domain/ChapterTest.kt` (new cases)
- Read first: `main/domain/Chapter.kt:25-63` (`StageAdd`, `StageDefinition`), `:65-85` (`ChapterDefinition`), `:117-125` (`addsOf`), `test/domain/ChapterTest.kt:439-515` (add cases, the style to copy)
**Depends on**: T2
**Requirement**: EGR-05

**Contract**:

```kotlin
/** What an affix does (spec early-game-rebalance, Affix Rules). Named Monster... because Affix and AffixType are equipment affixes. */
enum class MonsterAffixType { SHELL, HIT_SHIELD, REGENERATION, ARMORED }

/**
 * The affix of one miniboss or chapter boss. [amount] is the points a strike loses (SHELL), the charges (HIT_SHIELD), the basis points of the
 * maximum health healed a second (REGENERATION) or the defense added (ARMORED); [periodMs] is how long a broken shield stays down (HIT_SHIELD only).
 */
data class MonsterAffix(
    val type: MonsterAffixType,
    val amount: Long,
    val periodMs: Long? = null,
) {
    init {
        require(amount >= 1) { "affix amount $amount must be at least 1" }
        when (type) {
            MonsterAffixType.HIT_SHIELD -> {
                require(amount <= 1000) { "shield charges $amount must be at most 1000" }
                require(periodMs != null && periodMs in 1..600_000) { "shield period-ms $periodMs must be between 1 and 600000" }
            }
            MonsterAffixType.REGENERATION -> require(amount <= 10_000) { "regeneration $amount must be at most 10000 basis points" }
            MonsterAffixType.ARMORED -> require(amount <= EnemyStats.MAX_DEFENSE) { "armored defense $amount must be at most ${EnemyStats.MAX_DEFENSE}" }
            MonsterAffixType.SHELL -> Unit
        }
        require(type == MonsterAffixType.HIT_SHIELD || periodMs == null) { "only a shield has a period-ms, got $periodMs on $type" }
    }
}
```

- `StageDefinition` gains the last parameter `val minibossAffix: MonsterAffix? = null`; `ChapterDefinition` gains the last parameter `val bossAffix: MonsterAffix? = null`.
- Companion constants: `SHIELD_CHARGES_BASE = 10`, `SHIELD_CHARGES_PER_CHAPTER = 5`, `SHIELD_CHARGES_STEPS = 4`, `SHIELD_PERIOD_MS = 6000L`, `SHELL_PER_MILLE = 4`, `MINIBOSS_REGENERATION_BP = 50L`, `BOSS_REGENERATION_BP = 25L`, `ARMORED_DEFENSE = 20L`, and the table (spec Affix Table; `null` = no affix):

```kotlin
/** The affix types of minibosses 3, 6, 9 and of the chapter boss, chapters 2 to 15 (spec Affix Table). Chapter 1 has none. */
private val AFFIX_TYPES: Map<Int, List<MonsterAffixType?>> =
    run {
        val rotation = listOf(MonsterAffixType.HIT_SHIELD, MonsterAffixType.SHELL, MonsterAffixType.REGENERATION, MonsterAffixType.ARMORED)
        mapOf(
            2 to listOf(MonsterAffixType.HIT_SHIELD, MonsterAffixType.HIT_SHIELD, MonsterAffixType.HIT_SHIELD, MonsterAffixType.HIT_SHIELD),
            3 to listOf(MonsterAffixType.SHELL, MonsterAffixType.HIT_SHIELD, MonsterAffixType.SHELL, MonsterAffixType.SHELL),
            4 to listOf(MonsterAffixType.REGENERATION, MonsterAffixType.SHELL, MonsterAffixType.REGENERATION, MonsterAffixType.REGENERATION),
            5 to listOf(MonsterAffixType.ARMORED, MonsterAffixType.REGENERATION, MonsterAffixType.ARMORED, MonsterAffixType.ARMORED),
        ) +
            (6..10).associateWith { c -> listOf(rotation[(c - 6) % 4], rotation[(c - 5) % 4], rotation[(c - 4) % 4], rotation[(c - 3) % 4]) } +
            (11..15).associateWith { c -> listOf(null, null, null, rotation[(c - 3) % 4]) }
    }
private val AFFIX_STAGES = listOf(3, 6, 9)
```

- `fun affixOf(type: MonsterAffixType, chapter: Int, phaseHealth: Long, boss: Boolean): MonsterAffix` (public, used by tests):
  - `HIT_SHIELD` -> `MonsterAffix(type, SHIELD_CHARGES_BASE + SHIELD_CHARGES_PER_CHAPTER * minOf(chapter - 2, SHIELD_CHARGES_STEPS), SHIELD_PERIOD_MS)` (10, 15, 20, 25, then 30)
  - `SHELL` -> `MonsterAffix(type, (phaseHealth * SHELL_PER_MILLE + 999) / 1000)` (ceil in integers)
  - `REGENERATION` -> `if (boss) BOSS_REGENERATION_BP else MINIBOSS_REGENERATION_BP`
  - `ARMORED` -> `ARMORED_DEFENSE`
- `fun minibossAffixOf(number: Int, stage: Int, phaseHealth: Long): MonsterAffix?` -> the type at index `AFFIX_STAGES.indexOf(stage)` of `AFFIX_TYPES[number]`, or null when any of them is missing.
- `fun bossAffixOf(number: Int, lastPhaseHealth: Long): MonsterAffix?` -> the type at index 3, with the stage 10 phase health.
- `of(number)` passes `minibossAffix = minibossAffixOf(number, n, monsterHealth)` to each stage and `bossAffix = bossAffixOf(number, stages.last().monsterHealth)`.

**Steps**:

1. Add the enum, the value and its `init`.
2. Add the two parameters with defaults (every existing caller compiles unchanged).
3. Add the constants, the table and the three functions; wire them in `of`.
4. Add the test cases.

**Tests**: unit
**Test cases** (`ChapterTest.kt`, new `// affixes` block; values from the spec Affix Table):

- `chapter 1 seeds no affix`.
- `chapter 2 seeds Escudo de golpes of 10 charges and 6000 ms on minibosses 3, 6, 9 and the boss`.
- `chapter 3 seeds Carapaça 6 and 14, Escudo of 15 and a Carapaça 16 boss`.
- `chapter 4 seeds Regeneração 50, Carapaça 24, Regeneração 50 and a Regeneração 25 boss`.
- `chapter 5 seeds Blindado 20 on minibosses 3 and 9 and the boss and Regeneração 50 on miniboss 6`.
- `chapters 6 to 10 rotate the four types`: chapter 6 `HIT_SHIELD 30 / SHELL 49 / REGENERATION 50 / ARMORED 20`; chapter 7 `SHELL 122 / REGENERATION 50 / ARMORED 20 / HIT_SHIELD 30`; chapter 10 `HIT_SHIELD 30 / SHELL 346 / REGENERATION 50 / ARMORED 20` (miniboss 3, 6, 9, boss).
- `chapters 11 to 15 seed an affix on the boss only`: every stage `minibossAffix == null`; bosses `HIT_SHIELD 30`, `SHELL 365`, `REGENERATION 25`, `ARMORED 20`, `HIT_SHIELD 30`.
- `minibosses other than 3, 6 and 9 carry no affix`: c 2..10, n in 1, 2, 4, 5, 7, 8, 10 -> null.
- `the shield has 10, 15, 20, 25 and then 30 charges`: `affixOf(HIT_SHIELD, c, 1, false).amount` for c 2, 3, 4, 5, 6, 15.
- `Carapaça rounds up 4 per mille of the phase health`: `affixOf(SHELL, 3, 1346, false).amount == 6`, `(…, 1000, …) == 4`, `(…, 1001, …) == 5`.
- `an affix amount of 0 is rejected and 1 is accepted` (each type).
- `a shield needs a period between 1 and 600000 ms`: `MonsterAffix(HIT_SHIELD, 10, null)`, `(…, 0)`, `(…, 600_001)` throw; `(…, 1)` and `(…, 600_000)` build.
- `a shield has at most 1000 charges, a regeneration at most 10000 and an armor at most 90`: 1001, 10001, 91 throw; 1000, 10000, 90 build.
- `only a shield carries a period`: `MonsterAffix(SHELL, 5, 6000)` throws.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 14 new cases pass; every other backend test passes unchanged.

**Deviation (orchestrator, 2026-11-25)**: `of(number)` is not wired in this task. Wiring it here left 5 read-back tests red (`ChapterSeederIT`, `ChapterRepositoryIT`) until T5 stores the affixes, and every backend commit on main is deployed. T4 adds the types, constants and the three functions, and its tests call `minibossAffixOf`, `bossAffixOf` and `affixOf` directly; T5 wires them into `of(number)` and moves the chapter-level assertions to `of(c)`.

**Commit**: `feat(backend): seed monster affixes for chapters 2 to 15`

---

#### T5: Affix tables, V17 and the chapter repository [ ]

**Owner**: kotlin-backend-dev
**Goal**: Affixes are stored in `stage_affixes` and `chapter_affixes`, filled for stored chapters 2 to 15 by V17 and written by the seeder for a new database, and read back with the chapter (EGR-05; spec P1 Affixes AC 1, 3).
**Where**: `backend/src/main/resources/db/migration/V17__monster_affixes.sql` (new)
**Files**:
- Also changes: `main/adapter/repository/ChapterEntities.kt` (two entities), `main/adapter/repository/ChapterRepository.kt` (two JPA repositories, load and save), `test/adapter/repository/ChapterRepositoryIT.kt`, `test/adapter/repository/PreviousBackendCompatibilityIT.kt` (counts +1)
- Also creates: `test/adapter/repository/MonsterAffixesMigrationIT.kt`
- Read first: `V13__miniboss_adds.sql`, `ChapterEntities.kt:48-196`, `ChapterRepository.kt` (whole, 68 lines), `test/adapter/repository/StageAddsMigrationIT.kt`, `test/adapter/repository/ChapterRepositoryIT.kt` (the adds cases)
**Depends on**: T4, T3
**Requirement**: EGR-05

**Contract**: the file

```sql
-- Monster affixes (spec early-game-rebalance, AD-030): one per miniboss (stage_affixes) or chapter boss (chapter_affixes). Expand only
-- (AD-016): the previous backend never reads these tables. ChapterSeeder never overwrites a stored chapter, so the stored stages and chapters
-- 2 to 15 get their affixes here; a new database has none yet and the seeder writes them. Every statement can run again.
create table if not exists stage_affixes (
    stage_id  varchar(255) primary key references stages (id) on delete restrict,
    affix     varchar(32)  not null check (affix in ('SHELL', 'HIT_SHIELD', 'REGENERATION', 'ARMORED')),
    amount    bigint       not null check (amount >= 1),
    period_ms bigint       null check (period_ms is null or period_ms between 1 and 600000),
    constraint ck_stage_affixes_period check ((affix = 'HIT_SHIELD') = (period_ms is not null))
);

create table if not exists chapter_affixes (
    chapter   integer      primary key references chapters (number) on delete restrict,
    affix     varchar(32)  not null check (affix in ('SHELL', 'HIT_SHIELD', 'REGENERATION', 'ARMORED')),
    amount    bigint       not null check (amount >= 1),
    period_ms bigint       null check (period_ms is null or period_ms between 1 and 600000),
    constraint ck_chapter_affixes_period check ((affix = 'HIT_SHIELD') = (period_ms is not null))
);

insert into stage_affixes (stage_id, affix, amount, period_ms)
select s.id, a.affix, a.amount::bigint, a.period_ms::bigint
  from stages s
  join (values
        (2, 3, 'HIT_SHIELD', 10, 6000), (2, 6, 'HIT_SHIELD', 10, 6000), (2, 9, 'HIT_SHIELD', 10, 6000),
        (3, 3, 'SHELL', 6, null), (3, 6, 'HIT_SHIELD', 15, 6000), (3, 9, 'SHELL', 14, null),
        (4, 3, 'REGENERATION', 50, null), (4, 6, 'SHELL', 24, null), (4, 9, 'REGENERATION', 50, null),
        (5, 3, 'ARMORED', 20, null), (5, 6, 'REGENERATION', 50, null), (5, 9, 'ARMORED', 20, null),
        (6, 3, 'HIT_SHIELD', 30, 6000), (6, 6, 'SHELL', 49, null), (6, 9, 'REGENERATION', 50, null),
        (7, 3, 'SHELL', 122, null), (7, 6, 'REGENERATION', 50, null), (7, 9, 'ARMORED', 20, null),
        (8, 3, 'REGENERATION', 50, null), (8, 6, 'ARMORED', 20, null), (8, 9, 'HIT_SHIELD', 30, 6000),
        (9, 3, 'ARMORED', 20, null), (9, 6, 'HIT_SHIELD', 30, 6000), (9, 9, 'SHELL', 318, null),
        (10, 3, 'HIT_SHIELD', 30, 6000), (10, 6, 'SHELL', 346, null), (10, 9, 'REGENERATION', 50, null)
       ) as a (chapter, number, affix, amount, period_ms)
    on a.chapter = s.chapter and a.number = s.number
on conflict (stage_id) do nothing;

insert into chapter_affixes (chapter, affix, amount, period_ms)
select c.number, a.affix, a.amount::bigint, a.period_ms::bigint
  from chapters c
  join (values
        (2, 'HIT_SHIELD', 10, 6000), (3, 'SHELL', 16, null), (4, 'REGENERATION', 25, null), (5, 'ARMORED', 20, null),
        (6, 'ARMORED', 20, null), (7, 'HIT_SHIELD', 30, 6000), (8, 'SHELL', 205, null), (9, 'REGENERATION', 25, null), (10, 'ARMORED', 20, null),
        (11, 'HIT_SHIELD', 30, 6000), (12, 'SHELL', 365, null), (13, 'REGENERATION', 25, null), (14, 'ARMORED', 20, null), (15, 'HIT_SHIELD', 30, 6000)
       ) as a (chapter, affix, amount, period_ms)
    on a.chapter = c.number
on conflict (chapter) do nothing;
```

(Postgres may need `null::integer` in the first `null` of each `values` list to type the column.)

Entities (`ChapterEntities.kt`, after `StageAddEntity`):

```kotlin
/** The affix of a stage's miniboss (spec early-game-rebalance), keyed by the stage id. */
@Entity
@Table(name = "stage_affixes")
class StageAffixEntity(
    @Id @Column(name = "stage_id", nullable = false, updatable = false) var stageId: String,
    @Column(nullable = false, length = 32) var affix: String,
    @Column(nullable = false) var amount: Long,
    @Column(name = "period_ms") var periodMs: Long?,
) {
    fun toDomain() = MonsterAffix(MonsterAffixType.valueOf(affix), amount, periodMs)
    companion object { fun from(stageId: String, affix: MonsterAffix) = StageAffixEntity(stageId, affix.type.name, affix.amount, affix.periodMs) }
}

/** The affix of a chapter boss, keyed by the chapter number. */
@Entity
@Table(name = "chapter_affixes")
class ChapterAffixEntity(
    @Id @Column(nullable = false, updatable = false) var chapter: Int,
    @Column(nullable = false, length = 32) var affix: String,
    @Column(nullable = false) var amount: Long,
    @Column(name = "period_ms") var periodMs: Long?,
) {
    fun toDomain() = MonsterAffix(MonsterAffixType.valueOf(affix), amount, periodMs)
    companion object { fun from(chapter: Int, affix: MonsterAffix) = ChapterAffixEntity(chapter, affix.type.name, affix.amount, affix.periodMs) }
}
```

(ktlint will want one annotation per line; follow the formatter.) `StageEntity.toDomain(enemies, adds, minibossAffix: MonsterAffix? = null)` and `ChapterEntity.toDomain(stages, enemies, adds, stageAffixes: Map<String, MonsterAffix> = emptyMap(), bossAffix: MonsterAffix? = null)` pass them into the domain values.

Repository (`ChapterRepository.kt`): `interface JpaStageAffixRepository : JpaRepository<StageAffixEntity, String> { fun findAllByStageIdIn(stageIds: Collection<String>): List<StageAffixEntity> }`, `interface JpaChapterAffixRepository : JpaRepository<ChapterAffixEntity, Int>`, both injected. `findByNumber` reads the stage affixes of the chapter's stage ids and the chapter affix by number. `save` deletes the stage affix rows of the chapter's stage ids whose stage has no affix now, saves the others, and saves or deletes the chapter affix row (same "replace" rule as the adds).

**Steps**:

1. Write V17.
2. Add the two entities and the `toDomain` parameters.
3. Add the two JPA repositories and extend `findByNumber` and `save`.
4. Write `MonsterAffixesMigrationIT` (pattern of `StageAddsMigrationIT`: re-run the file, restore in `@AfterTest`).
5. Add the `ChapterRepositoryIT` cases; raise the four `futureMigrations` counts of `PreviousBackendCompatibilityIT` by 1 (final values 5, 4, 3, 2).

**Tests**: integration
**Test cases**:

- `MonsterAffixesMigrationIT`:
  - `the migration gives the stored chapters 2 to 15 their 27 miniboss affixes and 14 boss affixes`: after `delete from stage_affixes; delete from chapter_affixes;` and a run, `count(*)` 27 and 14; `stage_affixes` row `3/3` is `SHELL, 6, null`, `3/6` `HIT_SHIELD, 15, 6000`, `10/6` `SHELL, 346, null`; `chapter_affixes` row 4 is `REGENERATION, 25, null`, row 12 `SHELL, 365, null`; no row for a stage of chapters 11 to 15.
  - `a second run changes nothing`: counts and rows equal after a second run.
  - `the tables refuse an amount of 0, an unknown affix and a shield without period`: three inserts each fail with `DataIntegrityViolationException`.
  - `a non-shield affix with a period is refused`.
  - `a stage affix on a stage that does not exist is refused` (foreign key).
- `ChapterRepositoryIT` (new cases):
  - `a seeded chapter 3 reads back its affixes`: `findByNumber(3)` `stage(3).minibossAffix == MonsterAffix(SHELL, 6)`, `stage(6).minibossAffix == MonsterAffix(HIT_SHIELD, 15, 6000)`, `bossAffix == MonsterAffix(SHELL, 16)`, `stage(1).minibossAffix == null`.
  - `saving a chapter without affixes deletes its affix rows` and `saving it again with the seed puts them back` (restore the seed at the end).
  - `chapter 1 reads no affix`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 5 migration cases and 4 repository cases pass; `SchemaValidationIT` and every other backend test pass.

**Commit**: `feat(backend): store monster affixes`

---

#### T6: Affixes in the progress and farm payloads [ ]

**Owner**: kotlin-backend-dev
**Goal**: Every stage of the progress and farm payloads carries `minibossAffix` and the definition `bossAffix` (EGR-05; spec P1 Affixes AC 2).
**Where**: `main/adapter/web/ProgressController.kt`
**Files**:
- Also changes: `test/adapter/web/ProgressControllerIT.kt`, `test/adapter/web/FarmControllerIT.kt` (new cases)
- Read first: `ProgressController.kt:26-100` (`EnemyStatsResponse`, `AddResponse`, `StageResponse`, `ChapterResponse`), the chapter 1 payload case of `ProgressControllerIT.kt:80-95`, the chapter definition cases of `FarmControllerIT.kt:275-302`
**Depends on**: T5
**Requirement**: EGR-05

**Contract**:

```kotlin
/** The affix of a miniboss or chapter boss in the progress and farm payloads (spec early-game-rebalance). */
data class AffixResponse(
    val type: String,
    val amount: Long,
    val periodMs: Long?,
) {
    companion object {
        fun from(affix: MonsterAffix) = AffixResponse(affix.type.name, affix.amount, affix.periodMs)
    }
}
```

`StageResponse` gains `val minibossAffix: AffixResponse?` (from `stage.minibossAffix?.let(AffixResponse::from)`), `ChapterResponse` gains `val bossAffix: AffixResponse?`. No `@JsonInclude(NON_NULL)` on them: the payload answers `null` explicitly.

JSON of a chapter 3 stage 6:

```json
{ "number": 6, "...": "...", "adds": [], "minibossAffix": { "type": "HIT_SHIELD", "amount": 15, "periodMs": 6000 } }
```

**Steps**:

1. Add `AffixResponse` and the two fields.
2. Add the IT cases.

**Tests**: integration
**Test cases**:

- `ProgressControllerIT`: `a chapter 1 progress answers no affix`: `definition.stages[2].minibossAffix` is `null`, `definition.bossAffix` is `null` (use `nullValue()`).
- `ProgressControllerIT`: `a chapter 2 progress answers the Escudo de golpes of miniboss 3 and of the boss`: move the player to chapter 2 the way the chapter 2 case at `:195` does; `definition.stages[2].minibossAffix.type` `HIT_SHIELD`, `.amount` 10, `.periodMs` 6000; `definition.stages[0].minibossAffix` null; `definition.bossAffix.type` `HIT_SHIELD`.
- `FarmControllerIT`: `the farm of chapter 3 answers Carapaça 6 on miniboss 3 and Carapaça 16 on the boss`: `definition.stages[2].minibossAffix.type` `SHELL`, `.amount` 6, `.periodMs` null; `definition.bossAffix.amount` 16.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 3 new cases pass; every other backend test passes.

**Commit**: `feat(backend): answer monster affixes in the progress and farm payloads`

---

### Phase 3: Game

#### T7: monsterAffix domain module [x]

**Owner**: game-dev
**Goal**: The game reads an affix of the payload, runs its state per monster and writes its chip text (EGR-06, EGR-07; spec § Affix Rules, § Player-Facing Texts, Affixes AC 4 to 8, 12, Edge Cases).
**Where**: `game/src/domain/combat/monsterAffix.js` (new)
**Files**:
- Also creates: `game/src/domain/combat/monsterAffix.test.js`
- Read first: `game/src/domain/combat/adds.js` (validation style), `game/src/domain/combat/monster.js` (`HEALTH_PRECISION`, `hit`), `game/src/domain/combat/numberFormat.js`, `game/src/domain/combat/adds.test.js` (test style)
**Depends on**: None
**Requirement**: EGR-06, EGR-07

**Contract**:

```js
//  Monster affixes (spec early-game-rebalance, Affix Rules): one per miniboss or chapter boss, from the payload's `minibossAffix` / `bossAffix`
//  ({ type, amount, periodMs }). Pure JavaScript: no Phaser.
import { formatShort } from './numberFormat';

export const SHELL = 'SHELL';
export const HIT_SHIELD = 'HIT_SHIELD';
export const REGENERATION = 'REGENERATION';
export const ARMORED = 'ARMORED';
export const AFFIX_TYPES = [ SHELL, HIT_SHIELD, REGENERATION, ARMORED ];

//  The affix of the payload, or null when it is missing or malformed: an unknown type, an amount that is not an integer of at least 1, or a
//  shield without an integer periodMs of at least 1. Only a shield keeps its periodMs.
export const affixOf = (payload) => { /* ... */ };

//  The stats of a monster with `affix`: Blindado adds its amount to the one defense (defenseOf); any other affix or none keeps `stats`
export const affixDefense = (stats, affix) => { /* ... */ };

export class AffixState
{
    constructor (affix)               //  this.affix = affix; this.charges = affix.amount for a shield, else 0; this.rechargeMs = 0
    land (damage)                     //  -> the damage that lands (see table)
    advance (ms, monster)             //  -> the health healed (see table); the shield recharge
}

//  The chip text of `state` (spec Player-Facing Texts)
export const affixText = (state) => { /* ... */ };
```

| Method | SHELL | HIT_SHIELD | REGENERATION | ARMORED |
| --- | --- | --- | --- | --- |
| `land(damage)` | `Math.max(0, damage - amount)` | `charges > 0`: `charges -= 1`; if it reached 0, `rechargeMs = periodMs`; return 0. `charges === 0`: return `damage` | `damage` | `damage` |
| `advance(ms, monster)` | 0 | `charges === 0`: `rechargeMs -= ms`; when `rechargeMs <= 0`: `charges = amount`, `rechargeMs = 0`. Returns 0 | `monster.dead` or `health >= maxHealth`: 0. Else `heal = maxHealth * amount / 10000 * ms / 1000`; `health = min(maxHealth, round((health + heal) * 1e6) / 1e6)`; return the health added | 0 |
| `affixText` | `Carapaça: -${formatShort(amount)} por golpe` | charges > 0: `Escudo de golpes: ${charges}/${amount}`; else `Escudo de golpes: volta em ${Math.ceil(rechargeMs / 1000)} s` | `Regeneração: ${percent}% da vida/s`, `percent = String(amount / 100).replace('.', ',')` | `Blindado: +${amount} de defesa` |

`affixDefense({ element: 'FIRE', defense: 33, critResistance: 0 }, { type: 'ARMORED', amount: 20 })` returns `{ element: 'FIRE', defense: 53, critResistance: 0 }` (a new object; read the defense with `defenseOf` so an old payload's `physicalDefense` counts, and write `defense`).

**Steps**:

1. Write the module.
2. Write the tests.

**Tests**: unit
**Test cases** (`monsterAffix.test.js`):

- `affixOf`: `reads a shield with its period` (`{ type: 'HIT_SHIELD', amount: 10, periodMs: 6000 }` -> same); `reads a shell and drops a period it carries` (`{ type: 'SHELL', amount: 6, periodMs: 5 }` -> `{ type: 'SHELL', amount: 6, periodMs: null }`); `gives null for undefined, null, an unknown type, amount 0, amount 1.5, amount '6', and a shield with periodMs null, 0 or 2.5` (one `expect` each).
- `affixDefense`: `adds Blindado 20 to defense 33` -> 53; `reads physicalDefense of an old payload` (`{ physicalDefense: 33 }` -> `defense` 53); `keeps the stats of a shell` (returns the same object).
- `SHELL`: `a strike of 10 on Carapaça 6 lands 4`; `a strike of 5 lands 0`; `a critical strike of 30 on Carapaça 16 lands 14`.
- `HIT_SHIELD`: `10 strikes on a 10-charge shield land 0 each and the 11th of 5 lands 5`; `the last charge starts a 6000 ms recharge`; `5999 ms later the shield is still down and 1 ms more brings back 10 charges`; `a strike after the recharge lands 0`; `advance does not run the recharge while charges are left`.
- `REGENERATION`: `heals 5 a second at 50 basis points of 1000 health` (monster `{ health: 900, maxHealth: 1000, dead: false }`, `advance(1000, m)` -> 5, health 905); `heals in proportion to the ms` (`advance(200)` -> 1); `never heals above the maximum` (health 998, `advance(1000)` -> 2, health 1000); `does not heal a dead monster` (returns 0, health unchanged).
- `affixText`: `Carapaça: -6 por golpe`; `Carapaça: -1.2K por golpe` (amount 1200); `Escudo de golpes: 10/10`, after 3 strikes `Escudo de golpes: 7/10`; down with 6000 ms -> `Escudo de golpes: volta em 6 s`, after `advance(100)` -> `volta em 6 s`, after `advance(5000)` more -> `volta em 1 s`; `Regeneração: 0,5% da vida/s` (50), `Regeneração: 0,25% da vida/s` (25), `Regeneração: 1% da vida/s` (100); `Blindado: +20 de defesa`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] Every case passes and every other unit test passes unchanged (the hexagonal import test included).

**Commit**: `feat(game): read and run monster affixes`

---

#### T8: Monster.land applies the affix [x]

**Owner**: game-dev
**Goal**: A strike on a monster goes through its affix and reports what landed (EGR-07; spec Affixes AC 4, 5).
**Where**: `game/src/domain/combat/monster.js`
**Files**:
- Also changes: `game/src/domain/combat/monster.test.js`
- Read first: `monster.js` (whole, 57 lines), `monster.test.js`, `monsterAffix.js` of T7
**Depends on**: T7
**Requirement**: EGR-07

**Contract**: in the constructor add `this.affix = null;` (an `AffixState` or null, set by the scene). New method after `hit`:

```js
    //  A strike through the monster's affix (spec early-game-rebalance): returns the damage that landed, 0 on a dead monster
    land (damage)
    {
        if (this.dead)
        {
            return 0;
        }

        const dealt = this.affix ? this.affix.land(damage) : damage;

        this.hit(dealt);

        return dealt;
    }
```

`hit` is unchanged (its tests stay).

**Tests**: unit
**Test cases** (`monster.test.js`, `describe('land')`):

- `without an affix lands the whole strike` (`new Monster(10).land(3)` -> 3, health 7).
- `a Carapaça 2 monster lands 1 of a strike of 3` (`m.affix = new AffixState({ type: 'SHELL', amount: 2, periodMs: null })`).
- `a shielded monster loses no health while charges are left` (2 charges: `land(5)` twice -> 0, 0, health 10; third -> 5, health 5).
- `a dead monster lands 0 and keeps health 0`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 4 cases pass and every other unit test passes unchanged.

**Commit**: `feat(game): land strikes through the monster affix`

---

#### T9: Every SkillCombat strike lands through the affix [x]

**Owner**: game-dev
**Goal**: The click, the ally hit, every skill hit, the aimed shot and every damage-over-time tick land with `Monster.land` and return what landed (EGR-07; spec Affixes AC 10, Edge Cases on Lyra and multi-hit skills).
**Where**: `game/src/domain/skills/skillCombat.js`
**Files**:
- Also changes: `game/src/domain/skills/skillCombat.test.js` (new cases)
- Read first: `skillCombat.js:171-197` (`click`, `allyHit`), `:240-255` (skill hit loop), `:385-404` (aimed shot), `:406-418` (`tickHit`), the `describe` blocks of `skillCombat.test.js` that build a `Monster` and call `click` / `use` / `advance` (to copy their setup)
**Depends on**: T8
**Requirement**: EGR-07

**Contract** (five edits, located by their quoted text):

| Where | Old | New |
| --- | --- | --- |
| `click` | `monster.hit(result.damage);` `return result;` | `const dealt = monster.land(result.damage);` `return { ...result, damage: dealt };` |
| `allyHit` | `monster.hit(damage);` `return { damage, critical: false };` | `const dealt = monster.land(damage);` `return { damage: dealt, critical: false };` |
| skill hit loop (`hitDamage({ attacker, percent: percent * factor, armorPierce, ...`) | `victim.hit(result.damage);` `hits.push(result);` | `const dealt = victim.land(result.damage);` `hits.push({ ...result, damage: dealt });` |
| aimed shot (`percent: skill.cast.hit.percent * factor, forceCritical: true`) | `victim.hit(result.damage);` `hits.push(result);` | `const dealt = victim.land(result.damage);` `hits.push({ ...result, damage: dealt });` |
| `tickHit` | `monster.hit(damage);` `return { damage, critical: false };` | `const dealt = monster.land(damage);` `return { damage: dealt, critical: false };` |

After the edit, `grep -n "\.hit(" game/src/domain/skills/skillCombat.js` finds nothing.

**Tests**: unit
**Test cases** (`skillCombat.test.js`, `describe('affixes')`; each builds the monster with an `AffixState`):

- `a click on a Carapaça monster returns and deals the damage minus the shell`.
- `an ally hit on a shielded monster takes a charge and returns 0`.
- `each hit of Flecha Dupla takes one charge in order`: a 1-charge shield, Lyra slot 1: hits `[0, <damage>]`, health falls by the second hit only.
- `a damage-over-time tick on a Carapaça monster returns the tick minus the shell, 0 when the tick is smaller`.
- `the aimed shot of Tiro Preciso goes through Carapaça`.
- `without an affix every result is unchanged` (one click, compare to the value of an existing click case).

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 6 new cases pass; every existing `skillCombat.test.js` case passes unchanged.

**Commit**: `feat(game): land every skill, ally and tick strike through the affix`

---

#### T10: Encounters carry their affix [x]

**Owner**: game-dev
**Goal**: Every encounter of the campaign and of the farm carries `affix` read from the payload (EGR-06; spec Affixes AC 11, 12).
**Where**: `game/src/domain/campaign/campaign.js`
**Files**:
- Also changes: `game/src/domain/campaign/campaign.test.js` (re-pins and new cases)
- Read first: `campaign.js:1-60` (header, `farmEncounterOf`), `:100-150` (`encounter()`), `campaign.test.js` (every `toEqual` of an encounter object)
**Depends on**: T7
**Requirement**: EGR-06

**Contract**:

- Import `affixOf` from `'../combat/monsterAffix'`.
- `encounter()`: the PHASE object gets `affix: null`; the MINIBOSS object `affix: affixOf(stage.minibossAffix)`; the CHAPTER_BOSS object `affix: affixOf(this.definition.bossAffix)`.
- `farmEncounterOf`: `let affix = null;` MINIBOSS branch `affix = affixOf(stageDefinition.minibossAffix);`, CHAPTER_BOSS branch `affix = affixOf(definition.bossAffix);`, returned object gets `affix`.
- Header comment: add `minibossAffix` to the stage shape and `bossAffix` to the definition.

**Tests**: unit
**Re-pinned**: every `toEqual` / `toStrictEqual` of a whole encounter object in `campaign.test.js` gets `affix: null` (its payload carries no affix); no other value changes. Name the tests in the commit body.
**Test cases** (new):

- `a miniboss encounter carries the affix of its stage` (`minibossAffix: { type: 'HIT_SHIELD', amount: 10, periodMs: 6000 }` -> `affix` equal).
- `a chapter boss encounter carries bossAffix`.
- `a phase encounter has no affix even when its stage has a miniboss affix`.
- `a malformed miniboss affix gives null` (`{ type: 'NOPE', amount: 1 }`).
- `a farm fight of a miniboss and of a chapter boss carries their affixes` (`farmEncounterOf`).

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 5 new cases and the re-pinned cases pass; every other unit test passes.

**Commit**: `feat(game): give every encounter its affix`

---

#### T11: The scene runs and shows the affix [x]

**Owner**: game-dev
**Goal**: The spawned monster gets its affix state, Regeneração and the Escudo recharge follow the countdown time, and the chip shows the affix (EGR-07, EGR-08; spec § Affix Display, Display AC 1 to 6, Affixes AC 7 to 9).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Files**:
- Also changes: `game/public/style.css` (new rules after the `.enemy-stats .tag` rule)
- Read first: `ClickerGame.js:86-110` (DOM boxes and HTML), `:230-245` (`createHtml` calls), `:836-877` (`showEncounter`), `:1060-1130` (`showEnemyStats`, `clearEnemyStats`, `completeChapter`, `hideCountdown`), `:1128-1170` (`update`), `afterDamage` (search `afterDamage ()`), `bossTimedOut` (search `bossTimedOut ()`), `style.css:520-590` (`.hud-enemy`, `.target-chip`), `:777-820` (`.enemy-stats .tag`, stat icon masks)
**Depends on**: T9, T10
**Requirement**: EGR-07, EGR-08

**Contract**:

Constants (next to `ENEMY_STATS`):

```js
//  The affix chip at the top of the monster body (spec early-game-rebalance, Affix Display): clicks go through it to the monster
const AFFIX = { x: 670, y: 336 };
const AFFIX_HTML = '<div class="hud-box hud-affix"><div class="affix-chip" data-testid="affix-chip"></div></div>';
```

- `create`: `this.affixChip = this.createHtml(AFFIX, AFFIX_HTML, '.affix-chip');` next to the enemy stats.
- `showEncounter`: replace `this.monster = new Monster(encounter.health, encounter.dropRuleId, encounter.stats);` by

```js
        this.monster = new Monster(encounter.health, encounter.dropRuleId, affixDefense(encounter.stats, encounter.affix));
        this.monster.affix = encounter.affix ? new AffixState(encounter.affix) : null;
```

  and call `this.showAffix()` after `this.refreshEnemyStats();`.
- New methods:

```js
    //  "Carapaça: -6 por golpe" while the monster with an affix lives; empty otherwise (spec early-game-rebalance, Affix Display)
    showAffix ()
    {
        const state = this.monster && !this.monster.dead ? this.monster.affix : null;
        const text = state ? affixText(state) : '';

        if (this.affixChip.textContent !== text)
        {
            this.affixChip.textContent = text;
        }

        this.affixChip.setAttribute('data-affix', state ? state.affix.type : '');
    }

    clearAffix ()
    {
        this.affixChip.textContent = '';
        this.affixChip.setAttribute('data-affix', '');
    }
```

- `update`: right after `const countdownMs = this.skills.countdownMs(delta);` add

```js
        //  Regeneração and the Escudo recharge follow the countdown time: they stop with the pause, Stun and Root (spec early-game-rebalance)
        if (this.countdown && alive && this.monster.affix && this.monster.affix.advance(countdownMs, this.monster) > 0)
        {
            this.updateHealthBar();
        }
```

  and call `this.showAffix();` at the end of the method body before the countdown block returns (put it right after `this.refreshSkillUi();`).
- `afterDamage`: call `this.showAffix()` at its start (a strike that took a charge shows the new count at once); in its `if (this.monster.dead)` branch call `this.clearAffix()` next to `this.clearEnemyStats()`.
- `bossTimedOut`, `completeChapter`: call `this.clearAffix()` next to `this.clearEnemyStats()` (or where the monster is removed).
- Imports: `affixDefense`, `AffixState`, `affixText` from `'../../domain/combat/monsterAffix'`.

Stylesheet (`game/public/style.css`):

```css
/* The affix of a miniboss or chapter boss at the top of its body (spec early-game-rebalance, Affix Display) */
.hud-affix {
    width: 240px;
    height: 28px;
}

.affix-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px 3px 8px;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 700;
    white-space: pre;
    color: var(--parchment-100);
    border-radius: 999px;
    background: var(--chip-bg);
    border: 1px solid var(--affix-color, var(--bronze-500));
}

.affix-chip:empty {
    display: none;
}

.affix-chip::before {
    content: '';
    flex: none;
    width: 12px;
    height: 12px;
    background-color: var(--affix-color);
    -webkit-mask: var(--affix-icon) center / contain no-repeat;
    mask: var(--affix-icon) center / contain no-repeat;
}

.affix-chip[data-affix="SHELL"] {
    --affix-color: #b07a3a;
    --affix-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2 21 7v10l-9 5-9-5V7z'/%3E%3C/svg%3E");
}

.affix-chip[data-affix="HIT_SHIELD"] {
    --affix-color: #5aa0d8;
    --affix-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='none' stroke='%23000' stroke-width='3'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E");
}

.affix-chip[data-affix="REGENERATION"] {
    --affix-color: #4f9a3c;
    --affix-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z'/%3E%3C/svg%3E");
}

.affix-chip[data-affix="ARMORED"] {
    --affix-color: #8a9aa6;
    --affix-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 4h16v9c0 4-3.6 7.3-8 9-4.4-1.7-8-5-8-9z'/%3E%3C/svg%3E");
}
```

Check that `.hud-box` already gives `pointer-events: none` (it does for every HUD box; if not, add `pointer-events: none` to `.hud-affix`).

**Steps**:

1. Constants, `create`, imports.
2. `showEncounter`, `showAffix`, `clearAffix`.
3. `update`, `afterDamage`, `bossTimedOut`, `completeChapter`.
4. Stylesheet.
5. Run the gate, then the existing fight e2e files listed below once.

**Tests**: e2e (the affix behaviour is pinned by T14 and T15 of `test-engineer`; this task proves no regression on the fights of today)
**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/stages.spec.js e2e/minibossAdds.spec.js e2e/skills.spec.js e2e/farm.spec.js`
**Done when**:

- [x] Unit tests and build pass; the four e2e files pass unchanged (their payloads carry no affix, so no chip shows).

**Commit**: `feat(game): run and show the monster affix in the fight`

---

### Phase 4: Tests in the browser and author check

#### T12: The fake backend mirrors the new flat and critical talents [x]

**Owner**: test-engineer
**Goal**: The e2e fake backend answers `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE` and `CRIT_DAMAGE` as the backend of T1 does, and the browser shows the new values, damage and critical chip (EGR-01; spec P1 Flat AC 4, 5, P1 Critical path AC 8, 9).
**Where**: `game/e2e/support/fakeBackend.js`
**Files**:
- Also creates: `game/e2e/earlyGameRebalanceTalents.spec.js`
- Read first: `fakeBackend.js:205-245` (`TALENT_CATALOG`, `GRADED_TALENTS`, `talentsView` with its `flat` offset), `game/e2e/talentTreeReworkCombat.spec.js:1-60` (start a game with talents and a monster, read the dealt damage: `dealt`, `monsterOf`, `startGame`), `game/e2e/talentTreeBranchesCard.spec.js:20-40` (open Talentos, select a node, the card test ids)
**Depends on**: T1, T11
**Requirement**: EGR-01

**Contract**:

- `TALENT_CATALOG`: `[ 'CLICK_FLAT_DAMAGE', 'POWER', 'Dano direto de clique', 'dmg', 2 ]` -> `... 'dmg', 1 ]`; `[ 'CRIT_CHANCE', 'POWER', 'Chance de crítico', 'points', 1 ]` -> `... 'points', 5 ]`; `[ 'CRIT_DAMAGE', 'POWER', 'Dano crítico', '%', 5 ]` -> `... '%', 15 ]`.
- `talentsView`: remove `const flat = baseId === 'CLICK_FLAT_DAMAGE' ? grade : 0;` and use `value: level === 0 ? 0 : perLevel * level` (with `perLevel 1 x grade` this is `TalentDefinition.valueAt`).
- Update the contract comment above `TALENT_CATALOG` if it names the flat values.

**Tests**: e2e
**Test cases** (`earlyGameRebalanceTalents.spec.js`):

- `the card of Dano direto de clique at level 10 reads +10 de dano` (talents `{ CLICK_FLAT_DAMAGE: 10 }`, open Talentos, select `talent-CLICK_FLAT_DAMAGE`, the card effect line reads `+10 de dano`).
- `grade 2 at level 10 reads +20 de dano and grade 3 +30 de dano`.
- `Kael with Dano direto de clique at 10 deals 11 to a FIRE monster with defense 0 and critical resistance 100` (one click, dealt `toBeCloseTo(11, 5)`).
- `the card of Chance de crítico at level 10 reads +50 pontos and Dano crítico +150%`.
- `one level of Chance de crítico moves the chip from Seu crítico: 10% to Seu crítico: 15%` (monster critical resistance 0, buy the level in Talentos).

**Re-pinned** (`game/e2e/talentTreeReworkCombat.spec.js`, values with the new mirror):

| Test | Old | New |
| ---- | --- | --- |
| `a 9-star Kael with the three CRIT_CHANCE grades at 10 reads Seu crítico: 100% against 10 and deals 13.44` | comment `C is 10 + 60 (nine stars) + 10 + 20 + 30 ... = 130`, overflow 20, dealt `13.44` | renamed `... and deals 21.12`; comment `C is 10 + 60 + 50 + 100 + 150 = 370; the multiplier is 2 + 2 (stars) + the overflow 260 / 100; the base is 1 + 2.2`; dealt `toBeCloseTo(21.12, 5)`; the chip stays `Seu crítico: 100%` |
| `the chip follows a talent upgrade: 10% then 11% after a CRIT_CHANCE level` | `Seu crítico: 11%` | renamed `... 10% then 15% ...`; `Seu crítico: 15%` |

Run every e2e file that reads talent values to check the mirror change: `npx playwright test e2e/talentTreeRework.spec.js e2e/talentTreeReworkCombat.spec.js e2e/talentTreeBranches.spec.js e2e/talentTreeBranchesCard.spec.js e2e/talents.spec.js e2e/clickPower.spec.js`. Besides the two listed re-pins, a test there that asserts a flat or critical value or a damage that used one is re-pinned to the new number (`value = level x perLevel x grade`; flat 1, critical chance 5, critical damage 15) and named in the commit body; any other failure stops the task.

**Gate**: `cd game && npm test && npx playwright test e2e/earlyGameRebalanceTalents.spec.js e2e/talentTreeRework.spec.js e2e/talentTreeReworkCombat.spec.js e2e/talentTreeBranches.spec.js e2e/talentTreeBranchesCard.spec.js e2e/talents.spec.js e2e/clickPower.spec.js`
**Done when**:

- [x] The 5 new cases and the 2 re-pinned cases pass; the six listed files pass (with any other re-pin named in the commit body).

**Commit**: `test(game): mirror the flat and critical talents in the browser`

---

#### T13: Chapter 1 numbers, 8 phases and the live critical chip in the browser [x]

**Owner**: test-engineer
**Goal**: The browser shows chapter 1 of the Chapter Table with 8 phases, miniboss 1-1 with its 45 s countdown and the critical chip against the new resistances (EGR-02, EGR-03; spec Curve AC 9, 10, Critical path AC 6, 7).
**Where**: `game/e2e/earlyGameRebalance.spec.js` (new)
**Files**:
- Read first: `game/e2e/minibossAdds.spec.js:1-80` (definition builder, `startAdds`, `freeze`, `advance`, `scene`), `game/e2e/talentTreeReworkCombat.spec.js` (search `Seu crítico`)
**Depends on**: T12
**Requirement**: EGR-02, EGR-03, EGR-08

**Contract**: a definition builder in the file that copies chapter 1 of the spec Chapter Table: 10 stages of `phasesPerStage` 8, `monsterHealth` 69, 92, 122, 162, 216, 287, 382, 508, 676, 898; `minibossHealth` 3 times; `minibossTimeLimitMs` 45000; miniboss defense `10 + n`, critical resistance `n - 1`, element FIRE, WATER, NATURE, LIGHT, DARKNESS repeating; `bossHealth` 6000, `bossTimeLimitMs` 90000, boss DARKNESS defense 30 critical resistance 5; no affix fields.

**Tests**: e2e
**Test cases**:

- `miniboss 1-1 starts at HP 207/207 with Time: 45` (progress stage 1 MINIBOSS; `monster-hp` text and the boss timer text).
- `the chapter boss starts at HP 6K/6K with Time: 90` (progress CHAPTER_BOSS).
- `a leader with no critical bonus reads Seu crítico: 10% against miniboss 1-1`.
- `the same leader reads Seu crítico: 1% against miniboss 1-10` (progress stage 10 MINIBOSS).
- `a phase monster of stage 1 starts at HP 69/69 and the label reads Stage 1/10  Phase 1/8`.
- `phase 8 of stage 1 is the last phase before the miniboss` (progress phase 8; kill it; the next encounter is the miniboss of stage 1).

**Gate**: `cd game && npm test && npx playwright test e2e/earlyGameRebalance.spec.js`
**Done when**:

- [x] The 6 cases pass.

**Commit**: `test(game): pin the chapter 1 curve, 8 phases and the live critical chip in the browser`

---

#### T14: Affix rules in the browser [x]

**Owner**: test-engineer
**Goal**: Each affix rule works in a real fight for every strike kind, in the campaign and the farm, and a bad payload means no affix (EGR-06, EGR-07; spec Affixes AC 4 to 12, Edge Cases).
**Where**: `game/e2e/monsterAffixes.spec.js` (new)
**Files**:
- Read first: `game/e2e/minibossAdds.spec.js:1-120` (loop control: `freeze`, `advance`, `wake`, `scene`, how a hit is made with a scene call), `game/e2e/minibossAddsSkills.spec.js:1-80` (using a skill, Lyra), `game/e2e/heroTeamCombat.spec.js:40-70` (a team with an ally), `game/e2e/farm.spec.js` or `game/e2e/bossReplayChapters.spec.js` (start a farm fight), `game/e2e/support/fakeBackend.js:255-275` (`definition`, `chapterDefinitions`)
**Depends on**: T13
**Requirement**: EGR-06, EGR-07

**Contract**: a definition builder with small numbers (stage phase monster 10, miniboss `minibossHealth` 100, limit 30000, miniboss FIRE defense 0 critical resistance 100 so a Kael click with no talent deals exactly 1, `bossHealth` 1000) and a `minibossAffix` / `bossAffix` argument. The loop sleeps once the game loaded; time moves with `advance(page, ms)` only (L-112).

**Tests**: e2e
**Test cases**:

- `Carapaça: a click of 3 on a Carapaça 2 miniboss takes 1 health` (give the leader `CLICK_FLAT_DAMAGE: 2` so a click deals 3; HP falls 100 -> 99).
- `Carapaça: a click of 1 on a Carapaça 2 miniboss takes nothing and shows 0`.
- `Escudo de golpes: 3 clicks on a 3-charge shield take nothing, the 4th takes 1`.
- `Escudo de golpes: 6000 ms of countdown after the last charge bring the shield back and the next click takes nothing` (5999 ms: a click takes 1; reset and 6000 ms: a click takes 0).
- `Escudo de golpes: the recharge does not run while the game is paused` (open the pause menu, `advance` 10000, close it: still down).
- `Regeneração 1000 on a miniboss at 50 of 100 heals 10 a second` (set health with a scene call, `advance(1000)`: HP text `HP 60/100`).
- `Regeneração does not heal above the maximum`.
- `Regeneração stops while Stun stops the countdown` (use Kael's stun skill or set the skill stop the way `skills.spec.js` does; health unchanged after `advance`).
- `Blindado +20 on a defense 33 miniboss reads Defesa 53% and a click deals 0.47`.
- `an ally hit on a shielded miniboss takes a charge` (team with one ally; after one ally tick the chip reads one charge less and HP unchanged).
- `a damage-over-time tick on a Carapaça miniboss loses the shell`.
- `a farm fight of a miniboss with Escudo de golpes applies the shield`.
- `a payload with minibossAffix null, missing or of an unknown type fights with no affix` (three contexts; a click takes 1 and the chip is hidden).

**Gate**: `cd game && npm test && npx playwright test e2e/monsterAffixes.spec.js`
**Done when**:

- [x] The 13 cases pass (15 are written: the shield back in one step and Regeneração 50 of 1000 health are extra).

**Commit**: `test(game): pin the monster affix rules in the browser`

---

#### T15: The affix chip in the browser [x]

**Owner**: test-engineer
**Goal**: The chip shows every text, sits where the spec puts it, has its style and hides when it should (EGR-08; spec Display AC 1 to 6, § Affix Display, § Player-Facing Texts).
**Where**: `game/e2e/monsterAffixesHud.spec.js` (new)
**Files**:
- Read first: `monsterAffixes.spec.js` of T14 (builder and start helper; import or copy them), `game/e2e/minibossAddsTarget.spec.js` (search `target-chip`: box and CSS checks of a chip)
**Depends on**: T14
**Requirement**: EGR-08

**Tests**: e2e
**Test cases**:

- `the Carapaça chip reads Carapaça: -6 por golpe with data-affix SHELL`.
- `the Escudo chip reads 10/10, then 7/10 after 3 clicks, then volta em 6 s after the last charge, then volta em 1 s 5000 ms later`.
- `the Regeneração chips read 0,5% da vida/s for 50 and 0,25% da vida/s for 25`.
- `the Blindado chip reads Blindado: +20 de defesa`.
- `a Carapaça of 1200 reads Carapaça: -1.2K por golpe`.
- `the chip is centred on x 670 and its box spans y 322 to 350 in scene px` (compare the chip's bounding box centre with the canvas scale, as `minibossAddsTarget.spec.js` does for the target chip).
- `the chip has the type colour border and the Grove chip style`: `toHaveCSS` `font-size` 12px, `font-weight` 700, `border-top-color` `rgb(176, 122, 58)` (SHELL), `rgb(90, 160, 216)` (HIT_SHIELD), `rgb(79, 154, 60)` (REGENERATION), `rgb(138, 154, 166)` (ARMORED), `border-radius` 999px.
- `the chip is hidden in a fight without affix and on a phase monster`.
- `the chip empties when the affix miniboss dies and when the countdown fails the fight`.
- `a click on the chip hits the monster` (click at the chip's screen point; HP falls by 1).

**Gate**: `cd game && npm test && npx playwright test e2e/monsterAffixesHud.spec.js`
**Done when**:

- [x] The 10 cases pass (12 are written: the chip host, and the dying miniboss and the failed countdown are one case each).

**Commit**: `test(game): pin the monster affix chip in the browser`

---

#### T16: Author check [ ]

**Owner**: test-engineer
**Goal**: Every AC and edge case of the spec has a test that asserts its spec value, and the tests kill the injected faults (EGR-01 to EGR-08; `.claude/agents/test-engineer.md` author check).
**Where**: `.specs/features/early-game-rebalance/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md` (author check), the spec, every test file of T1 to T15, `scripts/sensor.mjs`
**Depends on**: T15
**Requirement**: EGR-01, EGR-02, EGR-03, EGR-04, EGR-05, EGR-06, EGR-07, EGR-08

**Steps**:

1. Map each AC and edge case of the spec to the test that asserts it (`file:line`); a missing one becomes a fix task for its owner.
2. Run at least these mutants with `node scripts/sensor.mjs` and record killed or survived: (a) `CLICK_FLAT_DAMAGE` `perLevel` back to 2; (a2) `CRIT_CHANCE` `perLevel` back to 1; (a3) `PHASES_PER_STAGE` back to 5; (b) V16 without the seeded-value guard of step 1; (c) `AffixState.land` of SHELL returning `damage - amount` without `Math.max(0, ...)`; (d) the Escudo recharge set to `periodMs / 2`; (e) `tickHit` back to `monster.hit(damage)`; (f) the Regeneração heal using `delta` instead of `countdownMs` in `ClickerGame.update`.
3. Append § Author check to this file with the table and the mutant results.

**Tests**: e2e + unit (runs the suites of T1 to T15, writes no production code)
**Gate**: `cd backend && ./gradlew test && cd ../game && npm test && npx playwright test e2e/earlyGameRebalanceTalents.spec.js e2e/earlyGameRebalance.spec.js e2e/monsterAffixes.spec.js e2e/monsterAffixesHud.spec.js`
**Done when**:

- [ ] Every AC and edge case maps to a test; every mutant of step 2 is killed or a fix task is listed.

**Commit**: `test: author check of the early game rebalance`

---

### Phase 5: UI review

#### T17: UI review of the affix chip and the talent card [ ]

**Owner**: ui-artist
**Goal**: The chip of each affix type and state and the talent card value read well on the fight and Talentos screens (EGR-08; spec § Affix Display).
**Where**: `game/ui-review/earlyGameRebalance.shots.js` (new)
**Files**:
- Also creates: `.specs/features/early-game-rebalance/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/early-game-rebalance/ui-review/*.png`
- Read first: `game/ui-review/minibossAdds.shots.js` (a shots file), `.claude/templates/ui-review.html`, spec § Affix Display and § Player-Facing Texts
**Depends on**: T16
**Requirement**: EGR-08

**Shots** (desktop 1280 x 720): `01-shell-miniboss`, `02-shield-full`, `03-shield-down`, `04-regeneration-miniboss`, `05-regeneration-boss`, `06-armored-miniboss` (enemy line `Defesa 53%` in frame), `07-shell-1200` (short format), `08-no-affix`, `09-boss-affix-chapter-11` (a chapter 11 chapter boss with Escudo de golpes 30; the minibosses of that chapter carry adds and no affix), `10-talent-card-flat` (`+10 de dano`), `11-talent-card-crit` (`+50 pontos`, `+150%`), `12-stage-label-8-phases` (`Stage 1/10  Phase 1/8`).

**Check against**: chip at the top of the monster body, centred on x 670, inside y 322 to 350; 12 px Figtree 700 parchment text on the dark chip; type colours `#b07a3a`, `#5aa0d8`, `#4f9a3c`, `#8a9aa6` on border and icon; text never clipped; no overlap with the HP bar (top y 281, 16 px), the damage numbers (rise from y 273), the target marker, the adds or the enemy box (y 556 to 636).

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- earlyGameRebalance`
**Done when**:

- [ ] `ui-review.html` lists the 12 shots with a verdict `APROVADO` or the findings as new tasks.

**Commit**: `docs(ui): review the monster affix chip`

---

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | three catalog lines + their tests | ✅ Granular |
| T2 | one function (`of`), its tables and constants + re-pins | ✅ Granular (one cohesive seed change) |
| T3 | one migration file + its IT | ✅ Granular |
| T4 | one domain value + seed functions | ✅ Granular |
| T5 | one migration + its two entities and repository wiring (cannot validate apart: `ddl-auto: validate` needs the table) | ⚠️ Cohesive, kept together |
| T6 | one response type + two fields | ✅ Granular |
| T7 | one module | ✅ Granular |
| T8 | one method | ✅ Granular |
| T9 | five call sites of one class | ✅ Granular |
| T10 | one module's two builders | ✅ Granular |
| T11 | one scene wiring + its stylesheet rules | ⚠️ Cohesive (the chip is useless without its CSS) |
| T12 to T15 | one e2e file each (T12 also the fake mirror) | ✅ Granular |
| T16 | author check | ✅ |
| T17 | review | ✅ |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | None | Phase 1 start | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T2 (phase 1) | Phase 2 start | ✅ Match |
| T5 | T4, T3 (phase 1) | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | None | Phase 3 start | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T7 | T7 → T10 | ✅ Match |
| T11 | T9, T10 | T9 → T11, T10 → T11 | ✅ Match |
| T12 | T1 (phase 1), T11 (phase 3) | Phase 4 start | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 (phase 4) | Phase 5 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend domain | unit | unit (+ integration re-pins) | ✅ OK |
| T3 | Backend migration | integration | integration | ✅ OK |
| T4 | Backend domain | unit | unit | ✅ OK |
| T5 | Backend migration + repository | integration | integration | ✅ OK |
| T6 | Backend payload | integration | integration | ✅ OK |
| T7 | Game domain | unit | unit | ✅ OK |
| T8 | Game domain | unit | unit | ✅ OK |
| T9 | Game domain | unit | unit | ✅ OK |
| T10 | Game domain | unit | unit | ✅ OK |
| T11 | Game adapter + stylesheet | e2e | e2e (regression e2e in its gate; the new behaviour pinned by T14, T15 under the project's owner split, `CLAUDE.md` § Agent team) | ✅ OK |
| T12 to T15 | e2e | e2e | e2e | ✅ OK |
| T16 | none (check) | - | e2e + unit runs | ✅ OK |
| T17 | UI review artifact | none | none | ✅ OK |
