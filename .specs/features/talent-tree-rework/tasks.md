# Talent Tree Rework Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, discrimination sensor). This project has no Verifier: the `test-engineer` author check (T22) and the `ui-artist` review (T23) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/talent-tree-rework/spec.md`
**Design**: `.specs/features/talent-tree-rework/design.md`
**Status**: Draft. Waiting for the owner's approval of spec, design and tasks and the answers to Q1 to Q11 of the spec (each task is written with the recommended default).

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`. Kotlin paths shorten `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/` to `B/` and `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/` to `BT/`.
- Before reading code, run `graphify query "<question>"` (CLAUDE.md § graphify); read raw files only for the lines the graph or this file located. After changing code, run `graphify update .`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text when the line moved.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`). No task edits any of them.
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- **Re-pinning existing tests.** This feature changes rules that existing tests pin (the 100 cap, the multiplicative critical resistance, the `Crit res` chip, the retired ids, the old Talentos cards). A task may change an existing test only where the task lists it, and only to the value this file gives (computed from the spec). Keep the intent of the test, rename its title when the title states a number that changed (L-054), and name every re-pinned test in the commit body. Never delete a test unless the task says so. If a test the task does not list fails, stop and report it to the orchestrator; do not change it.
- Leader critical chance used in the re-pinned values: 10 base + star bonus (0, 1 or 2 stars: 0; 3: 30; 4: 35; 5: 40; 6: 45; 7: 50; 8: 55; 9: 60) + `CRIT_CHANCE` affixes + `CRIT_CHANCE` talent values + 10 when Lyra fights as an ally. The fixture `heroEntry(id, copies, stars = 0)` of `ClickerGame.test.js` and the blank cards (`<id>:0`) of the e2e helpers give 0 stars.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times (`.specs/STATE.md` § Handoff notes). No agent runs two suites at once or leaves one running in the background.
- Kotlin style: ktlint (`./gradlew ktlintCheck`), KDoc on every public class and function, `logger` in a private companion. Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces, imports pointing inward only (AD-003).
- **Parallel tracks**: the backend (Phases 1 and 2, `kotlin-backend-dev`) and the game (Phases 3 to 5, `game-dev`) touch disjoint files and may run at the same time, each in its own worktree. Phase 6 (`test-engineer`) needs Phases 3 to 5; T23 (`ui-artist`) needs T22. Either side can deploy first (spec D21).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check: every AC value asserted, CSS values with `toHaveCSS`, mutants with `scripts/sensor.mjs`), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome 1280x720, fake backend), `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Talents.kt`) | unit | Every catalog row, value, prerequisite, cost and bound of P1 Boss AC 1, P1 Retired AC 1, P2 Fúria AC 1 to AC 5 | `BT/domain/TalentsTest.kt` | `cd backend && ./gradlew test --tests 'TalentsTest'` |
| Backend web (`TalentController.kt`) | integration (RestAssured) | Every field and status of P1 Boss AC 1, AC 2, P1 Retired AC 1, AC 4, P2 Fúria AC 1 to AC 5 | `BT/adapter/web/TalentControllerIT.kt` | `cd backend && ./gradlew test --tests 'TalentControllerIT'` |
| Migration (`V15__talent_tree_rework.sql`) | integration (Testcontainers) | Every deleted id, every kept row, the refund of P1 Retired AC 2, AC 3, the rerun | `BT/adapter/repository/TalentTreeReworkMigrationIT.kt` | `cd backend && ./gradlew test --tests 'TalentTreeReworkMigrationIT'` |
| Game domain (`damage.js`, `equipment.js`, `skillDamage.js`, `talents.js`, `combo.js`, `leaderStats.js`) | unit | Every number and text of P1 Boss AC 3 to AC 6, AC 8, P1 Critical AC 1 to AC 10, P1 Retired AC 5, AC 7, P2 Fúria AC 6 to AC 9, P2 Tree AC 11 | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game application (`talentCollection.js`) | unit | Each read path of P1 Retired AC 6 (load, upgrade, reset) | `game/src/application/talents/talentCollection.test.js` | `cd game && npm test` |
| Game views and scenes (`talentTreeLayout.js`, `talentsView.js`, `HeroUi.js`, `ClickerGame.js`) | unit (jsdom) + e2e | Unit: every DOM rule of P2 Tree AC 1 to AC 15, the chip of P1 Critical AC 11 to AC 13, the combo of P2 Fúria AC 6, AC 7; e2e: every player-visible AC | `game/src/adapters/phaser/**/*.test.js`, `game/e2e/talentTreeRework*.spec.js` | `cd game && npm test`, `cd game && npx playwright test e2e/<file>` |
| Stylesheet (`public/style.css`) | e2e | Every size, colour, state, fallback and the phone zoom of P2 Tree AC 1 to AC 4, AC 10 to AC 13, with `toHaveCSS` | `game/e2e/talentTreeRework.spec.js` | `cd game && npx playwright test e2e/talentTreeRework.spec.js` |
| Fake backend (`e2e/support/fakeBackend.js`) | e2e (through the specs that use it) | Mirrors the 28-talent contract of design § Data Models | `game/e2e/support/fakeBackend.js` | the e2e commands of T19 to T21 |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/talentTreeRework.shots.js`, `.specs/features/talent-tree-rework/ui-review.html` | `cd game && npm run ui:shots -- talentTreeRework` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | Every backend task | `cd backend && ./gradlew ktlintCheck test` |
| Quick (game) | Game tasks with unit tests only | `cd game && npm test` |
| Build (game) | T15 and the end of Phase 5 | `cd game && npm test && npm run build` |
| Full (game) | Tasks with e2e | `cd game && npm test && npx playwright test <files of the task>` |

---

## Execution Plan

Phases run in order inside a track; tasks inside a phase run in order. Every arrow is a `Depends on` inside the phase; dependencies on an earlier phase are listed in the task.

### Phase 1: Backend catalog (kotlin-backend-dev)

```
T1
```

### Phase 2: Backend response and migration (kotlin-backend-dev)

```
T2
T3
```

### Phase 3: Game combat rules (game-dev)

```
T4 → T6
T5 → T7
T8
```

### Phase 4: Game talent data and texts (game-dev)

```
T9
T10
T11
```

### Phase 5: Game screens (game-dev)

```
T12
T13 → T14 → T15
T14 → T16
```

### Phase 6: e2e and author check (test-engineer)

```
T17 → T19 → T22
T17 → T20 → T22
T17 → T21 → T22
T18 → T22
```

### Phase 7: UI review (ui-artist)

```
T23
```

---

## Task Breakdown

### Phase 1: Backend catalog

#### T1: Catalog with `BOSS_DAMAGE`, `ARMOR_PIERCE` and `COMBO_FURY` [x]

**Owner**: kotlin-backend-dev
**Goal**: The catalog answers 28 talents: the two retired rows replaced in place and one single talent with its own prerequisite and cost (TTR-01, TTR-10, TTR-14).
**Where**: `B/domain/Talents.kt`
**Also changes**: `BT/domain/TalentsTest.kt`, `BT/adapter/web/TalentControllerIT.kt` (only the assertions listed under step 6)
**Read first**: `B/domain/Talents.kt` (whole file, 245 lines; `TalentDefinition` `:14-58`, `TalentCatalog` `:64-92`, `unlocked` `:165-168`), `BT/domain/TalentsTest.kt:1-110` and `:224-300`, `BT/adapter/web/TalentControllerIT.kt:60-135` and `:179-193`
**Depends on**: None
**Requirement**: TTR-01, TTR-10, TTR-14

**Contract**:

```kotlin
data class TalentDefinition(
    val id: String,
    val branch: TalentBranch,
    val label: String,
    val unit: String,
    val perLevel: Int,
    val maxLevel: Int = MAX_LEVEL,
    val firstLevel: Int = perLevel,
    val grade: Int = 1,
    val baseId: String = id,
    /** The talent whose top level opens this one when it is not a grade (Fúria crescente opens at the top of COMBO). */
    val requires: String? = null,
    /** The talent points of one level before [TalentRules.costPerLevel]; null means the grade (grade N costs N). */
    val costFactor: Int? = null,
) {
    init {
        // the four existing require lines stay
        require(requires == null || grade == 1) { "Talent $id with a prerequisite of its own must have one grade" }
        require(costFactor == null || costFactor >= 1) { "Talent $id cost factor $costFactor must be at least 1" }
    }

    /** The talent whose top level opens this one: [requires], else the previous grade; null when it is always open. */
    val prerequisiteId: String? get() = requires ?: previousGradeId

    fun costPerLevel(rules: TalentRules): Int = rules.costPerLevel * (costFactor ?: grade)
    // previousGradeId, valueAt, requireSeenLevel and the companion stay as they are
}
```

`TalentCatalog`:

```kotlin
private val grade1 =
    listOf(
        TalentDefinition("MINIBOSS_TIME", TalentBranch.TIME, "Tempo do miniboss", "s", 2),
        TalentDefinition("BOSS_DAMAGE", TalentBranch.TIME, "Dano contra chefes", "%", 2),
        TalentDefinition("PHYSICAL_BREAK", TalentBranch.BREAK, "Quebra de defesa", "points", 1),
        TalentDefinition("ARMOR_PIERCE", TalentBranch.BREAK, "Perfuração de armadura", "%", 1),
        TalentDefinition("CLICK_DAMAGE", TalentBranch.POWER, "Dano de clique (%)", "%", 5),
        TalentDefinition("CRIT_CHANCE", TalentBranch.POWER, "Chance de crítico", "points", 1),
        TalentDefinition("CRIT_DAMAGE", TalentBranch.POWER, "Dano crítico", "%", 5),
        TalentDefinition("COMBO", TalentBranch.COMBO, "Limite de dano do combo", "%", 5),
        TalentDefinition("CLICK_FLAT_DAMAGE", TalentBranch.POWER, "Dano direto de clique", "dmg", 2, firstLevel = 1),
    )

/** Talents with one grade and an explicit prerequisite: Fúria crescente, +1 combo step a level, opens at level 10 of COMBO. */
private val singles =
    listOf(
        TalentDefinition("COMBO_FURY", TalentBranch.COMBO, "Fúria crescente", "combo-step", 1, maxLevel = 4, requires = "COMBO", costFactor = 2),
    )

val all: List<TalentDefinition> = (1..TalentDefinition.MAX_GRADE).flatMap { grade -> grade1.map { /* the existing copy */ } } + singles
```

`PlayerTalents.unlocked`:

```kotlin
fun unlocked(definition: TalentDefinition): Boolean {
    val prerequisite = definition.prerequisiteId ?: return true
    return level(prerequisite) >= TalentCatalog.find(prerequisite).maxLevel
}
```

Update the KDoc of `TalentDefinition` (one sentence on `requires` and `costFactor`) and of `TalentCatalog` ("The 9 talents of the four branches in 3 grades each, then the single talents: Fúria crescente. The chapter boss time and the critical resistance break left the tree with talent-tree-rework.").

**Steps**:

1. Add `requires` and `costFactor` to `TalentDefinition` with their two `require` lines and `prerequisiteId`.
2. Change `costPerLevel` to read `costFactor ?: grade`.
3. Replace the `BOSS_TIME` and `CRIT_RESIST_BREAK` rows of `grade1` with the `BOSS_DAMAGE` and `ARMOR_PIERCE` rows above (same positions).
4. Add `singles` and append it to `all`; update both KDocs.
5. Change `PlayerTalents.unlocked` to read `prerequisiteId`.
6. Re-pin the tests that pin the old catalog (values below), then add the new cases.

**Tests**: unit (+ the integration assertions re-pinned in step 6)
**Re-pinned** (step 6):

- `TalentsTest` `the catalog has the 9 talents of the four branches with the values of the spec` → title `the grade 1 block has the 9 graded talents with BOSS_DAMAGE and ARMOR_PIERCE in place of the retired ones`; read `TalentCatalog.all.take(9)`; the triples become `MINIBOSS_TIME TIME 2, BOSS_DAMAGE TIME 2, PHYSICAL_BREAK BREAK 1, ARMOR_PIERCE BREAK 1, CLICK_DAMAGE POWER 5, CRIT_CHANCE POWER 1, CRIT_DAMAGE POWER 5, COMBO COMBO 5, CLICK_FLAT_DAMAGE POWER 2`; max levels `List(27) { 10 } + 4`.
- `units are seconds, points or percent` → title `the grade 1 units are s, %, points, %, %, points, %, %, dmg and Fúria crescente reads combo-step`; `TalentCatalog.all.take(9).map { it.unit }` equals `listOf("s", "%", "points", "%", "%", "points", "%", "%", "dmg")` and `TalentCatalog.find("COMBO_FURY").unit` equals `"combo-step"`.
- `the catalog has 3 grades of the 9 talents, grade N giving N times the value of grade 1` → title `the catalog has 3 grades of the 9 talents and Fúria crescente: 28`; size 28; the other lines stay.
- `a new player has level 0 and 0 points and every next cost is 1` → title `a new player has level 0 and 0 points and every next cost is its grade, 2 for Fúria crescente`; `List(28) { 0 }`; next costs `List(9) { 1 } + List(9) { 2 } + List(9) { 3 } + 2`.
- `the value of a talent is its level times the per level amount`: the line `TalentCatalog.find("BOSS_TIME").valueAt(4)` 12 becomes `TalentCatalog.find("BOSS_DAMAGE").valueAt(4)` 8.
- `TalentControllerIT` `a new player gets the 27 talents of 3 grades ...` → title `a new player gets the 28 talents at level 0 with a next cost of 1, 2, 3 and 2 points and no points`: `talents.size()` 28; the `findAll { !it.contains('_G') }` list becomes the 9 grade 1 ids of the contract plus `"COMBO_FURY"`; branches `List(3) { listOf("TIME", "TIME", "BREAK", "BREAK", "POWER", "POWER", "POWER", "COMBO", "POWER") }.flatten() + "COMBO"`; `talents.level` and `talents.value` `List(28) { 0 }`; `talents.nextCost` `List(9) { 1 } + List(9) { 2 } + List(9) { 3 } + 2`; `talents.maxLevel` `List(27) { 10 } + 4`; `talents.grade` `List(9) { 1 } + List(9) { 2 } + List(9) { 3 } + 1`; `talents.unlocked` `List(9) { true } + List(19) { false }`; the `talents[4]`, `[7]`, `[8]`, `[16]` lines stay.
- `POST reset takes back every level ...`: `List(27) { 0 }` becomes `List(28) { 0 }`.
- `a stored magical break row is ignored and its points are available`: `talents.size()` 27 becomes 28.

**Test cases** (new, `BT/domain/TalentsTest.kt`; `fury` = `TalentCatalog.find("COMBO_FURY")`):

- `the boss damage chain is labelled Dano contra chefes and gives 20, 40 and 60 at level 10`: branch TIME, label `Dano contra chefes`, unit `%`, `listOf("BOSS_DAMAGE", "BOSS_DAMAGE_G2", "BOSS_DAMAGE_G3").map { TalentCatalog.find(it).valueAt(10) }` equals `listOf(20, 40, 60)`.
- `the armor pierce chain is labelled Perfuração de armadura and gives 10, 20 and 30 at level 10`: branch BREAK, label `Perfuração de armadura`, unit `%`, values `listOf(10, 20, 30)`.
- `the retired chapter boss time and critical resistance break are not in the catalog`: for each of `BOSS_TIME`, `BOSS_TIME_G2`, `BOSS_TIME_G3`, `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2`, `CRIT_RESIST_BREAK_G3`: `assertFailsWith<TalentNotFoundException> { TalentCatalog.find(id) }`.
- `Fúria crescente is one COMBO talent of 1 a level up to 4, last in the catalog`: `TalentCatalog.all.last().id` `"COMBO_FURY"`; branch COMBO; label `Fúria crescente`; maxLevel 4; grade 1; baseId `COMBO_FURY`; `listOf(0, 1, 4).map(fury::valueAt)` equals `listOf(0, 1, 4)`; `TalentCatalog.all.count { it.baseId == "COMBO_FURY" }` 1.
- `Fúria crescente opens at level 10 of COMBO`: `PlayerTalents("yan").unlocked(fury)` false; `PlayerTalents("yan", mapOf("COMBO" to 9)).unlocked(fury)` false; `PlayerTalents("yan", mapOf("COMBO" to 10)).unlocked(fury)` true.
- `a locked Fúria crescente refuses the upgrade`: `assertFailsWith<TalentLockedException> { PlayerTalents("yan", mapOf("COMBO" to 9), earned = 20).upgrade(fury, 0, rules) }`.
- `a level of Fúria crescente costs 2 points`: `PlayerTalents("yan", mapOf("COMBO" to 10), earned = 12).upgrade(fury, 0, rules)` has `cost` 2, `talents.level("COMBO_FURY")` 1 and `talents.points(rules)` `TalentPoints(12, 12)`.
- `Fúria crescente at level 4 refuses the upgrade as max level and has no next cost`: with `mapOf("COMBO" to 10, "COMBO_FURY" to 4)` and earned 30, `upgrade(fury, 4, rules)` throws `TalentMaxLevelException`, `nextCost(fury, rules)` is null; with `"COMBO_FURY" to 3` `nextCost` is 2.
- `a seen level of Fúria crescente must be from 0 to 4`: `fury.requireSeenLevel(4)` 4; `requireSeenLevel(5)` and `requireSeenLevel(-1)` throw `TalentRequestException` with message `fromLevel must be an integer between 0 and 4`.
- `every prerequisite is a talent of the catalog`: `TalentCatalog.all.mapNotNull { it.prerequisiteId }.forEach { TalentCatalog.find(it) }` throws nothing; `prerequisiteId` of `BOSS_DAMAGE` null, `BOSS_DAMAGE_G2` `"BOSS_DAMAGE"`, `BOSS_DAMAGE_G3` `"BOSS_DAMAGE_G2"`, `COMBO_FURY` `"COMBO"`.
- `a talent with a prerequisite of its own must have one grade`: `assertFailsWith<IllegalArgumentException> { TalentDefinition("X", TalentBranch.COMBO, "X", "%", 1, grade = 2, requires = "COMBO") }`.
- `fromStored leaves out every grade of the retired chapter boss time and critical resistance break`: `PlayerTalents.fromStored("yan", mapOf("BOSS_TIME" to 10, "BOSS_TIME_G2" to 2, "CRIT_RESIST_BREAK" to 4, "CRIT_RESIST_BREAK_G3" to 1, "COMBO" to 3), 30)` has `levels` `mapOf("COMBO" to 3)` and `points(rules)` `TalentPoints(30, 3)`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 12 new cases pass; the 8 re-pinned tests pass with the values above; every other backend test passes unchanged.
- [x] `ktlintCheck` exits 0.

**Commit**: `feat(backend): replace the retired talents and add Fúria crescente to the catalog`

---

### Phase 2: Backend response and migration

#### T2: `requiredId` and `requiredLevel` in the talent answer [x]

**Owner**: kotlin-backend-dev
**Goal**: Every talent of `GET /talents`, the upgrade and the reset answers says what opens it (TTR-01, TTR-11, TTR-14, TTR-15).
**Where**: `B/adapter/web/TalentController.kt`
**Also changes**: `BT/adapter/web/TalentControllerIT.kt`
**Read first**: `B/adapter/web/TalentController.kt` (whole file, 101 lines), `BT/adapter/web/TalentControllerIT.kt:1-66` (helpers `asUser`, `earned`, `upgrade`, `level`), `:137-210`, `:285-326` (the 409 max level and 400 cases to mirror)
**Depends on**: T1
**Requirement**: TTR-01, TTR-11, TTR-14, TTR-15

**Contract**: `TalentResponse` gains, after `unlocked`:

```kotlin
    /** The talent whose top level opens this one (the previous grade, or COMBO for Fúria crescente); null when it is always open. */
    val requiredId: String?,
    /** The level [requiredId] must reach; null when it is always open. */
    val requiredLevel: Int?,
```

filled in `TalentsResponse.from` with `requiredId = it.prerequisiteId` and `requiredLevel = it.prerequisiteId?.let { id -> TalentCatalog.find(id).maxLevel }`. Both fields are serialized when null (as `nextCost` already is). Update the KDoc of `TalentResponse`.

**Steps**:

1. Add the two fields and fill them.
2. Add the test cases below.

**Tests**: integration
**Test cases** (`BT/adapter/web/TalentControllerIT.kt`):

- `every talent answers what opens it`: `GET /talents` 200; `talents.requiredId` equals `List(9) { null } + <the 9 grade 1 ids in catalog order> + <the 9 _G2 ids in catalog order> + "COMBO"`; `talents.requiredLevel` equals `List(9) { null } + List(18) { 10 } + 10`.
- `the boss damage, armor pierce and Fúria crescente rows carry their labels and values`: `talents[1].id` `BOSS_DAMAGE`, `.label` `Dano contra chefes`, `.unit` `%`, `.perLevel` 2; `talents[10].perLevel` 4; `talents[19].perLevel` 6; `talents[3].id` `ARMOR_PIERCE`, `.label` `Perfuração de armadura`, `.perLevel` 1; `talents[12].perLevel` 2; `talents[21].perLevel` 3; `talents[27].id` `COMBO_FURY`, `.label` `Fúria crescente`, `.unit` `combo-step`, `.maxLevel` 4, `.grade` 1, `.baseId` `COMBO_FURY`, `.nextCost` 2, `.unlocked` false.
- `Fúria crescente is locked at 409 until COMBO is at level 10, then costs 2 points a level`: `earned(12)`; `upgrade("COMBO_FURY", 0)` 409 code `TALENT_LOCKED`; `repeat(10) { n -> upgrade("COMBO", n).statusCode(200) }`; `upgrade("COMBO_FURY", 0)` 200 with `talents[27].level` 1, `.value` 1, `.nextCost` 2, `.unlocked` true, `points.spent` 12, `points.available` 0.
- `Fúria crescente at level 4 is 409 TALENT_MAX_LEVEL with a null next cost`: `earned(18)`; `talentRepository.save("yan", "COMBO", 10)`; `talentRepository.save("yan", "COMBO_FURY", 4)`; `upgrade("COMBO_FURY", 4)` 409 code `TALENT_MAX_LEVEL`; `GET /talents` `talents[27].nextCost` null, `points.spent` 18; `level("COMBO_FURY")` 4.
- `a fromLevel of 5 or -1 for Fúria crescente is 400 INVALID_TALENT_REQUEST`: both answer 400, code `INVALID_TALENT_REQUEST`, detail `fromLevel must be an integer between 0 and 4` (read the detail field the way the existing 400 test at `:309` reads it).
- `a retired chapter boss time or critical resistance break upgrade is 404 TALENT_NOT_FOUND`: `earned(5)`; each of the 6 retired ids answers 404 code `TALENT_NOT_FOUND`; `level("BOSS_TIME")` 0.
- `a stored BOSS_TIME or CRIT_RESIST_BREAK row is ignored and its points are available`: `earned(20)`; save `PHYSICAL_BREAK` 3, `BOSS_TIME` 5, `CRIT_RESIST_BREAK_G2` 2; `GET /talents` `talents.size()` 28, `points.earned` 20, `points.spent` 3, `points.available` 17.
- `POST reset deletes a stored BOSS_TIME row`: `earned(3)`; save `BOSS_TIME` 5; `POST /talents/reset` 200 with `points.available` 3; `level("BOSS_TIME")` 0.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 8 new cases pass; every earlier backend test passes unchanged.
- [x] `ktlintCheck` exits 0.

**Commit**: `feat(backend): answer the prerequisite of every talent`

---

#### T3: `V15__talent_tree_rework.sql` and ADR 0015 [x]

**Owner**: kotlin-backend-dev
**Goal**: The levels of the retired talents are deleted once so their points come back, and the decision is recorded (TTR-11).
**Where**: `backend/src/main/resources/db/migration/V15__talent_tree_rework.sql` (new)
**Also changes**: `BT/adapter/repository/TalentTreeReworkMigrationIT.kt` (new), `backend/docs/adr/0015-talent-tree-rework.md` (new)
**Read first**: `backend/src/main/resources/db/migration/V11__unified_damage.sql:1-6`, `BT/adapter/repository/UnifiedDamageMigrationIT.kt:1-30`, `:93`, `:118-150` (pattern: autowire `JdbcTemplate`, `TalentRepository`, `ListTalentsUseCase`, `TalentRules`; `users(...)` in `@BeforeTest`; run the script by hand), `backend/docs/adr/0014-miniboss-adds.md` (ADR format)
**Depends on**: T1
**Requirement**: TTR-11

**Contract** (whole migration file):

```sql
-- talent-tree-rework (AD-029): the chapter boss time and the critical resistance break left the talent catalog.
--
-- Their levels are deleted; the talent points they cost come back by themselves, because the points spent are derived from
-- player_talents (V5). Data only, no schema change: the previous backend reads a missing row as level 0 (expand/contract, AD-016).
delete from player_talents
 where talent_id in ('BOSS_TIME', 'BOSS_TIME_G2', 'BOSS_TIME_G3', 'CRIT_RESIST_BREAK', 'CRIT_RESIST_BREAK_G2', 'CRIT_RESIST_BREAK_G3');
```

ADR `0015-talent-tree-rework.md` (same headings as 0014): Context (BOSS_TIME and CRIT_RESIST_BREAK retired, Fúria crescente the first talent opened by another talent), Decision (catalog rows, `requires`, `costFactor`, `requiredId` / `requiredLevel`, V15 delete), Consequences (points refunded with no notice; during the deploy window the previous backend can still sell the retired levels, which the new backend ignores; a game older than the backend shows Fúria crescente in its old screen until the Worker is republished).

**Steps**:

1. Write the migration.
2. Write the migration IT with the 4 cases below (`migrate()` runs `ClassPathResource("db/migration/V15__talent_tree_rework.sql")` like `UnifiedDamageMigrationIT`; `@BeforeTest` creates `yan` and `other`).
3. Write the ADR.

**Tests**: integration
**Test cases** (`BT/adapter/repository/TalentTreeReworkMigrationIT.kt`):

- `every grade of the chapter boss time and the critical resistance break is deleted and the other levels stay`: save for `yan` `BOSS_TIME` 10, `BOSS_TIME_G2` 2, `BOSS_TIME_G3` 1, `CRIT_RESIST_BREAK` 4, `CRIT_RESIST_BREAK_G2` 3, `CRIT_RESIST_BREAK_G3` 1, `COMBO` 3, `MINIBOSS_TIME` 2; for `other` `CRIT_RESIST_BREAK` 5, `PHYSICAL_BREAK` 1; `migrate()`; `repository.findAll("yan")` equals `mapOf("COMBO" to 3, "MINIBOSS_TIME" to 2)`; `repository.findAll("other")` equals `mapOf("PHYSICAL_BREAK" to 1)`.
- `the points of the deleted levels are available again`: `repository.award("yan", "test", 30)`; save `BOSS_TIME` 10, `BOSS_TIME_G2` 2, `CRIT_RESIST_BREAK` 4, `COMBO` 3; `migrate()`; `listTalents.list("yan").points(rules)` equals `TalentPoints(30, 3)` and its `available` is 27.
- `a second run deletes nothing and fails on nothing`: save `yan` `BOSS_TIME` 1, `COMBO` 2; `migrate()` twice; `repository.findAll("yan")` equals `mapOf("COMBO" to 2)`.
- `a player without a retired level keeps every row`: save `other` `PHYSICAL_BREAK` 1, `COMBO` 2, `COMBO_FURY` 1; `migrate()`; `repository.findAll("other")` equals those three rows.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 4 cases pass; Flyway boots the test database to V15; every earlier backend test passes unchanged.
- [x] `ktlintCheck` exits 0.

**Commit**: `feat(backend): refund the retired talents with the V15 migration`

---

### Phase 3: Game combat rules

#### T4: Subtractive critical chance and overflow in `calculateDamage` [x]

**Owner**: game-dev
**Goal**: Every strike reads `E = clamp(C - R, 0, 100)` and a critical strike adds `max(0, C - R - 100) / 100` to its multiplier (TTR-05, TTR-06, TTR-07).
**Where**: `game/src/domain/combat/damage.js`
**Also changes**: `game/src/domain/combat/damage.test.js`, `game/src/adapters/phaser/ClickerGame.test.js` (the one test listed under Re-pinned)
**Read first**: `game/src/domain/combat/damage.js` (whole file, 39 lines), `game/src/domain/combat/damage.test.js:1-90`, `:186-202`, `game/src/adapters/phaser/ClickerGame.test.js` the test titled `Vex as an ally takes 15 points off the critical resistance 30 a skill hit meets`
**Depends on**: None
**Requirement**: TTR-05, TTR-06, TTR-07

**Contract**:

```js
//  The critical chance a strike really has against a resistance (spec talent-tree-rework): the resistance is subtracted, 0 to 100
export const effectiveCritChance = (critChance, critResistance) => Math.min(100, Math.max(0, critChance - critResistance));

//  The points of critical chance past 100 after the resistance; each one adds 1 % of critical damage to a critical strike
export const critOverflow = (critChance, critResistance) => Math.max(0, critChance - critResistance - 100);
```

In `calculateDamage`, replace `const critChance = attacker.critChance * (1 - defender.critResistance / 100);` and the critical factor:

```js
    const resistance = defender.critResistance ?? 0;
    const critical = forceCritical || random() * 100 < effectiveCritChance(attacker.critChance, resistance);
    //  ...
        * (critical ? attacker.critMultiplier + critOverflow(attacker.critChance, resistance) / 100 : 1)
```

Update the header comment of `calculateDamage` (the critical sentence and `forceCritical`: "a forced critical still adds the overflow").

**Steps**:

1. Add the two exported functions above `calculateDamage`.
2. Change the two lines of `calculateDamage`.
3. Replace the damage test `lowers the critical chance by the critical resistance: 50 resistance makes it 5 %` with the cases below; re-pin the scene test below.

**Tests**: unit
**Re-pinned**: `ClickerGame.test.js` `Vex as an ally takes 15 points off the critical resistance 30 a skill hit meets: a roll of 8 crits (33), not without him (16.5)` → title `... the critical resistance 5 a skill hit meets: a roll of 8 crits (33), not without him (16.5)`; the monster's `critResistance` 30 becomes 5; the rolls (0.08) and the healths (`1000 - 33`, `1000 - 16.5`) stay (with Vex `E` 10, without `E` 5).
**Test cases** (`damage.test.js`; `enemy(element, physical, magical, res)` as in the file; `never` 0.99):

- `effectiveCritChance subtracts the resistance and stays between 0 and 100`: `(40, 30)` 10; `(30, 50)` 0; `(130, 10)` 100; `(100, 0)` 100.
- `critOverflow is the chance past 100 after the resistance`: `(130, 10)` 20; `(110, 10)` 0; `(111, 10)` 1; `(40, 30)` 0; `(250, 100)` 50.
- `40 against resistance 30 crits on a roll of 0.09 and not on 0.10`: attacker `{ ...PLAYER, critChance: 40 }`, `enemy('FIRE', 0, 0, 30)`: roll 0.09 gives `{ damage: 2, critical: true }`; roll 0.10 gives `{ damage: 1, critical: false }`.
- `never crits on a roll when the resistance reaches the chance: 30 against 50 on a roll of 0`: `{ damage: 1, critical: false }`.
- `adds the chance past 100 as critical damage: 130 against 10 with a x2.5 critical deals 2.7`: attacker `{ ...PLAYER, critChance: 130, critMultiplier: 2.5 }`, `enemy('FIRE', 0, 0, 10)`, `never`: damage `toBeCloseTo(2.7, 10)`, critical true.
- `adds no overflow at exactly 100 after the resistance: 110 against 10 deals 2`: damage 2.
- `adds 1 % for one point of overflow: 111 against 10 deals 2.01`: `toBeCloseTo(2.01, 10)`.
- `clamps the chance at 100 and keeps the overflow: 250 against 100 deals 2.5`: `never` roll, damage `toBeCloseTo(2.5, 10)`, critical true.
- `a forced critical keeps the overflow: 150 against 20 deals 2.3`: `forceCritical: true`, `never`: `toBeCloseTo(2.3, 10)`.
- `reads a missing critical resistance as 0: 40 crits on a roll of 0.39`: defender `{ element: 'FIRE', defense: 0 }`: critical true.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 10 new cases and the re-pinned scene test pass; the existing cases `never crits a monster with critical resistance 100, not even on the lowest roll` and `is critical against a defender with critical resistance 100, which never crits otherwise` pass unchanged.
- [ ] Every other unit test passes unchanged (if another fails, stop and report it).

**Commit**: `feat(game): subtract the critical resistance and turn the chance past 100 into critical damage`

---

#### T5: No critical cap, armor pierce and boss damage bonuses in `attackerFor` [x]

**Owner**: game-dev
**Goal**: The attacker carries the plain sum of its critical chance and takes armor pierce and boss damage from a bonus (TTR-02, TTR-08, TTR-12).
**Where**: `game/src/domain/equipment/equipment.js`
**Also changes**: `game/src/domain/equipment/equipment.test.js`, `game/src/domain/combat/leaderAttacker.test.js`, `game/src/domain/equipment/leaderStats.test.js` (the re-pinned tests only)
**Read first**: `game/src/domain/equipment/equipment.js:55-88`, `equipment.test.js:1-80`, `leaderAttacker.test.js:40-120`, `leaderStats.test.js:50-62`
**Depends on**: None
**Requirement**: TTR-02, TTR-08, TTR-12

**Contract**:

```js
export const attackerFor = (base, pieces, { clickDamageFlat = 0, clickDamagePct = 0, critChance = 0, critDamagePct = 0, armorPierce = 0, bossDamage = 0 } = {}) =>
{
    if (pieces.length === 0 && !clickDamageFlat && !clickDamagePct && !critChance && !critDamagePct && !armorPierce && !bossDamage)
    {
        return base;
    }
    //  ...weaponDamage and darknessDamagePct as today
    return {
        ...base,
        baseDamage: /* as today */,
        //  No cap: every point past 100 becomes critical damage in calculateDamage (spec talent-tree-rework)
        critChance: base.critChance + sumOf(pieces, 'CRIT_CHANCE') + critChance,
        critMultiplier: /* as today */,
        armorPierce: sumOf(pieces, 'ARMOR_PIERCE_PCT') + armorPierce,
        bossDamage: sumOf(pieces, 'BOSS_DAMAGE_PCT') + bossDamage,
        ...(darknessDamagePct > 0 && { darknessDamagePct })
    };
};
```

Update the comment above `attackerFor` (no cap; the two new bonus fields).

**Steps**:

1. Change the signature, the early return and the three fields.
2. Re-pin the tests below; add the new cases.

**Tests**: unit
**Re-pinned**:

- `equipment.test.js` `adds the three numbers of a bonus to the ones of the pieces, and still caps the critical chance at 100` → title `adds the numbers of a bonus to the ones of the pieces with no cap on the critical chance: 120`; `critChance` 120 (10 + 80 + 30); the other two lines stay.
- `adds the crit chance points to the 10 % base and caps it at 100` → title `adds the crit chance points to the 10 % base with no cap: 95 points read 105`; 105.
- `leaderAttacker.test.js` `caps the critical chance at 100: 3 stars and 80 points of equipment` → title `does not cap the critical chance: 3 stars and 80 points of equipment read 120`; 120.
- `caps the critical chance at 100 with 3 stars, equipment and talents together` → title `adds 3 stars, equipment and talents together: 10 + 30 + 50 + 10 = 100`; 100.
- `the passive critical chance caps at 100` → title `the passive critical chance adds past 100: 10 + 95 + 10 = 115`; 115.
- `leaderStats.test.js` `caps the critical chance at 100%` → title `shows the critical chance past 100: 120%`; `Chance de crítico: 120%`.

**Test cases** (new, `equipment.test.js`; `piece` and `affix` helpers of the file, a `RING` with no click damage):

- `adds the armor pierce and boss damage of a bonus to the ones of the pieces: 28 + 10 and 25 + 20`: ring `ARMOR_PIERCE_PCT` 28 and `BOSS_DAMAGE_PCT` 25, bonus `{ armorPierce: 10, bossDamage: 20 }`: `armorPierce` 38, `bossDamage` 45.
- `a bonus of only boss damage 20 without pieces gives armorPierce 0 and bossDamage 20`: `attackerFor(PLAYER, [], { bossDamage: 20 })` has `armorPierce` 0, `bossDamage` 20, `critChance` 10, `baseDamage` 1.
- `returns the base itself without pieces and with every bonus at 0`: `attackerFor(PLAYER, [], {})` is `PLAYER` (`toBe`).

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 3 new cases and the 6 re-pinned tests pass; every other unit test passes unchanged.

**Commit**: `feat(game): let the critical chance pass 100 and take armor pierce and boss damage bonuses`

---

#### T6: Fumaça without the critical cap [x]

**Owner**: game-dev
**Goal**: A skill buff adds its critical points with no cap, so a strike during Fumaça follows the new rule (TTR-07, TTR-08).
**Where**: `game/src/domain/skills/skillDamage.js`
**Also changes**: `game/src/domain/skills/skillDamage.test.js`
**Read first**: `game/src/domain/skills/skillDamage.js` (whole file, 53 lines), `skillDamage.test.js:1-110`
**Depends on**: T4
**Requirement**: TTR-07, TTR-08

**Contract**: in `strike`, the line

```js
        critChance: critChance ?? Math.min(100, attacker.critChance + (buffs.includes('fumaca') ? FUMACA_CRIT_POINTS * factorOf(factors, 'fumaca') : 0))
```

becomes

```js
        critChance: critChance ?? attacker.critChance + (buffs.includes('fumaca') ? FUMACA_CRIT_POINTS * factorOf(factors, 'fumaca') : 0)
```

The `Math.min(100, ...)` of `armorPierce` stays.

**Steps**:

1. Change the line.
2. Re-pin the two tests below; add the new cases.

**Tests**: unit
**Re-pinned** (`skillDamage.test.js`):

- `caps the critical chance at 100 under Fumaça` → title `Fumaça adds 15 points with no cap: 95 + 15 crits on a roll of 0.999 and adds 10 % critical damage (2.1)`; `clickDamage({ attacker: { ...PLAYER, critChance: 95 }, defender: enemy(), random: () => 0.999, buffs: [ 'fumaca' ], debuffs: [] })` has `critical` true and `damage` `toBeCloseTo(2.1, 10)`.
- `caps 95 + 15 at 100 before the critical resistance: against resistance 50 a roll of 52 does not crit` → title `adds Fumaça before the critical resistance: 95 + 15 against 50 crits on a roll of 0.59 and not on 0.60`; with `enemy('FIRE', 0, 50)`: roll 0.59 critical true, roll 0.60 critical false.

**Test cases** (new):

- `a forced hit with a critical chance of 150 against resistance 20 deals 2.3 times its base`: `hitDamage({ attacker: { ...PLAYER, critChance: 150 }, percent: 100, forceCritical: true, defender: enemy('FIRE', 0, 20), random: () => 0.99, buffs: [], debuffs: [] })` has `damage` `toBeCloseTo(2.3, 10)` and `critical` true.
- `a tick never crits, even with a critical chance of 250`: `tickDamage({ attacker: { ...PLAYER, critChance: 250 }, percent: 100, buffs: [], debuffs: [], defender: enemy('FIRE', 0, 0), boss: false })` is 1.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 2 new cases and the 2 re-pinned tests pass; every other unit test passes unchanged.

**Commit**: `feat(game): let Fumaça raise the critical chance past 100`

---

#### T7: Talent effects: boss damage, armor pierce, no chapter boss time, no critical break, combo step [x]

**Owner**: game-dev
**Goal**: The talents feed the new attacker fields, stop reading the retired ids and give the combo its step (TTR-02, TTR-03, TTR-12, TTR-13, TTR-16).
**Where**: `game/src/domain/talents/talents.js`
**Also changes**: `game/src/domain/talents/talents.test.js`, `game/src/domain/combat/leaderAttacker.test.js`, `game/src/domain/skills/skillCombat.test.js`, `game/src/adapters/phaser/ClickerGame.test.js` (re-pinned and new tests only)
**Read first**: `game/src/domain/talents/talents.js:1-56`, `talents.test.js:1-155`, `:196-222`, `skillCombat.test.js:220-233`, `ClickerGame.test.js` lines with `BOSS_TIME`, `CRIT_RESIST_BREAK` (`:3560-3665`), `game/src/domain/combat/combo.js:1-10`
**Depends on**: T5
**Requirement**: TTR-02, TTR-03, TTR-12, TTR-13, TTR-16

**Contract** (only these functions change; keep the others):

```js
import { COMBO_STEP_PERCENT } from '../combat/combo';
import { FARM, MINIBOSS } from '../campaign/campaign';   // CHAPTER_BOSS is no longer read

export const talentAttackerBonus = (talents) => ({
    clickDamageFlat: talentValue(talents, 'CLICK_FLAT_DAMAGE'),
    clickDamagePct: talentValue(talents, 'CLICK_DAMAGE'),
    critChance: talentValue(talents, 'CRIT_CHANCE'),
    critDamagePct: talentValue(talents, 'CRIT_DAMAGE'),
    armorPierce: talentValue(talents, 'ARMOR_PIERCE'),
    bossDamage: talentValue(talents, 'BOSS_DAMAGE')
});

//  Points off the one defense (PHYSICAL_BREAK and Orina) and off the critical resistance (Vex only: the critical resistance break left
//  the tree with talent-tree-rework), none below 0
export const monsterAfterBreak = (stats, talents, passives = {}) => ({
    ...stats,
    defense: Math.max(0, defenseOf(stats) - talentValue(talents, 'PHYSICAL_BREAK') - (passives.defenseBreak ?? 0)),
    critResistance: Math.max(0, stats.critResistance - (passives.critResistBreak ?? 0))
});

//  A miniboss (campaign or farm) gets MINIBOSS_TIME; no talent adds time to a chapter boss since talent-tree-rework
export const talentTimeBonusMs = (talents, encounter) =>
{
    const kind = encounter.kind === FARM ? encounter.boss.kind : encounter.kind;

    return kind === MINIBOSS ? talentValue(talents, 'MINIBOSS_TIME') * SECOND : 0;
};

//  The combo bonus a click adds (spec talent-tree-rework): 1 % plus the value of Fúria crescente
export const talentComboStep = (talents) => COMBO_STEP_PERCENT + talentValue(talents, 'COMBO_FURY');

export const addBonuses = (a, b) => ({
    clickDamageFlat: (a.clickDamageFlat ?? 0) + (b.clickDamageFlat ?? 0),
    clickDamagePct: a.clickDamagePct + b.clickDamagePct,
    critChance: a.critChance + b.critChance,
    critDamagePct: a.critDamagePct + b.critDamagePct,
    armorPierce: (a.armorPierce ?? 0) + (b.armorPierce ?? 0),
    bossDamage: (a.bossDamage ?? 0) + (b.bossDamage ?? 0)
});
```

**Steps**:

1. Change the five functions and the imports; update their comments.
2. Re-pin the tests below; add the new cases.

**Tests**: unit
**Re-pinned**:

- `talents.test.js` fixture (`:7`): `[ 'BOSS_TIME', 3 ]` becomes `[ 'BOSS_DAMAGE', 2 ]` and `[ 'CRIT_RESIST_BREAK', 1 ]` becomes `[ 'ARMOR_PIERCE', 1 ]`.
- `gives CLICK_DAMAGE 5, CRIT_CHANCE 4 and CRIT_DAMAGE 6 as +25 %, +4 points and +30 %` and `gives nothing without talents`: the expected objects gain `armorPierce: 0, bossDamage: 0`.
- `does not read the time or break talents` → title `does not read MINIBOSS_TIME and PHYSICAL_BREAK`; `tree({ MINIBOSS_TIME: 9, PHYSICAL_BREAK: 9 })` gives the six fields at 0.
- `adds the three numbers` (`addBonuses`): the expected object gains `armorPierce: 0, bossDamage: 0`.
- `lowers the critical resistance by 8 points with CRIT_RESIST_BREAK 8` → title `ignores a CRIT_RESIST_BREAK entry of an older list: critical resistance 20 stays 20`; list `[ { id: 'CRIT_RESIST_BREAK', baseId: 'CRIT_RESIST_BREAK', value: 8 } ]`, `monster(10, 20)` stays `monster(10, 20)`.
- `never goes below 0`: `tree({ PHYSICAL_BREAK: 5 })` on `monster(2, 0)` gives `monster(0, 0)`.
- `Vex's passive with CRIT_RESIST_BREAK 3 on critical resistance 10 reads 0` → title `Vex's passive on critical resistance 10 reads 0`; no talents, `{ critResistBreak: 15 }`.
- `adds 12 s to the chapter boss with BOSS_TIME 4` → title `gives the chapter boss nothing, even with BOSS_TIME 4 of an older list`; list `[ { id: 'BOSS_TIME', baseId: 'BOSS_TIME', value: 12 } ]`, `{ kind: CHAPTER_BOSS }` gives 0.
- `does not add the seconds of one to the other`, `gives a farm fight the bonus of the boss it replays`, `gives a phase monster and a list that has not loaded nothing`: replace `BOSS_TIME: 4` with `BOSS_DAMAGE: 4`; a miniboss (campaign or farm) still reads 10 000 with `MINIBOSS_TIME 5`, a chapter boss (campaign or farm) reads 0.
- `skillCombat.test.js` `lowers the critical resistance: resistance 20 and CRIT_RESIST_BREAK 20 let a roll of 9 crit at 10 %` → title `ignores CRIT_RESIST_BREAK of an older list: resistance 5 and CRIT_RESIST_BREAK 20 leave a roll of 9 plain at 10 %`; monster `stats('FIRE', 0, 0, 5)`; `withBreak({ CRIT_RESIST_BREAK: 20 }, roll).click(...)` equals `{ damage: 1, critical: false }` (chance 5); the second expectation becomes a monster of resistance 0 with the same roll: `critical` true.
- `ClickerGame.test.js` fixture (`:3565`): `[ 'BOSS_TIME', 3 ]` becomes `[ 'BOSS_DAMAGE', 2 ]`, `[ 'CRIT_RESIST_BREAK', 1 ]` becomes `[ 'ARMOR_PIERCE', 1 ]`.
- `shows the lowered defense on the enemy chips and keeps the stats of the monster itself`: `tree({ PHYSICAL_BREAK: 5, CRIT_RESIST_BREAK: 8 })` becomes `tree({ PHYSICAL_BREAK: 5 })` and `toContain('Crit res 12%')` becomes `toContain('Crit res 20%')` (T12 rewrites the chip text).
- `lowers the critical resistance by 8 points: resistance 20 and CRIT_RESIST_BREAK 8 make a roll of 9 crit at 10 %` → replaced by the new scene case `ARMOR_PIERCE 10 ignores 10 % of the defense: a click on defense 50 deals 0.55` (below).
- `adds 12 s to the limit of the chapter boss with BOSS_TIME 4 and nothing to a miniboss` → title `gives the chapter boss no talent time: BOSS_DAMAGE 10 leaves the limit as it is`; the chapter boss with `tree({ BOSS_DAMAGE: 10 })` has the same countdown as with `tree({})` (read it the way the test `adds 10 s to the limit of a miniboss with MINIBOSS_TIME 5 and nothing to a chapter boss` does).

**Test cases** (new):

- `talents.test.js` `gives ARMOR_PIERCE 10 and BOSS_DAMAGE 10 as 10 points of armor pierce and 20 % boss damage`: `talentAttackerBonus(tree({ ARMOR_PIERCE: 10, BOSS_DAMAGE: 10 }))` has `armorPierce` 10, `bossDamage` 20.
- `talents.test.js` `adds the grades of the boss damage: BOSS_DAMAGE 10 and BOSS_DAMAGE_G2 value 20 read 40`: list `[ { id: 'BOSS_DAMAGE', baseId: 'BOSS_DAMAGE', value: 20 }, { id: 'BOSS_DAMAGE_G2', baseId: 'BOSS_DAMAGE', value: 20 } ]` gives `bossDamage` 40.
- `talents.test.js` `addBonuses adds armor pierce and boss damage, reading a missing one as 0`: `addBonuses({ ...zero, armorPierce: 3 }, { ...zero, bossDamage: 4 })` (`zero` = the four old fields at 0) gives `armorPierce` 3, `bossDamage` 4.
- `talents.test.js` `talentComboStep is 1 without Fúria crescente and before the talents load`: `talentComboStep([])` 1, `talentComboStep(null)` 1.
- `talents.test.js` `talentComboStep is 1 plus the value of Fúria crescente: 2 at level 1, 5 at level 4`: lists `[ { id: 'COMBO_FURY', baseId: 'COMBO_FURY', value: 1 } ]` gives 2, value 4 gives 5.
- `leaderAttacker.test.js` `BOSS_DAMAGE 10 and BOSS_DAMAGE_G2 5 add 40 % against a boss: a click of a 0-star leader deals 1.4, 1.68 with a piece of BOSS_DAMAGE_PCT 28, 1 on a phase monster`: `leaderAttacker({ leader: { element: 'FIRE', stars: 0 }, talents: [ BOSS_DAMAGE value 20, BOSS_DAMAGE_G2 value 20 ] })`, then `calculateDamage({ attacker, defender: { element: 'FIRE', defense: 0, critResistance: 0 }, random: () => 0.99, boss: true }).damage` `toBeCloseTo(1.4, 10)`; with `pieces: [ ring with BOSS_DAMAGE_PCT 28 ]` 1.68; with `boss: false` 1.
- `leaderAttacker.test.js` `ARMOR_PIERCE 10 ignores 10 % of the defense: 0.55 on defense 50, 0.64 after PHYSICAL_BREAK 10, 0.69 with a piece of ARMOR_PIERCE_PCT 28, 1 with one of 95`: talents `[ { id: 'ARMOR_PIERCE', baseId: 'ARMOR_PIERCE', value: 10 } ]`, defender `{ element: 'FIRE', defense: 50, critResistance: 0 }`, roll 0.99: 0.55; defender `monsterAfterBreak(defender, [ PHYSICAL_BREAK value 10 ])`: 0.64; ring `ARMOR_PIERCE_PCT` 28 and no break: 0.69; ring 95: 1 (all `toBeCloseTo(x, 10)`).
- `ClickerGame.test.js` `ARMOR_PIERCE 10 ignores 10 % of the defense: a click on defense 50 deals 0.55`: `createScene({ start: bigMonsters(fire(50, 50, 0)), talents: tree({ ARMOR_PIERCE: 10 }) })`, `ctx.click()`, monster health `toBeCloseTo(1000 - 0.55, 10)`.
- `ClickerGame.test.js` `BOSS_DAMAGE 10 adds 20 % to a click on the chapter boss and nothing on a phase monster`: a FIRE chapter boss of defense 0 and critical resistance 0 (build the start as `adds 10 s to the limit of a miniboss ...` builds a chapter boss, with those stats), `tree({ BOSS_DAMAGE: 10 })`, roll 0.99, one click: health loss `toBeCloseTo(1.2, 10)`; the same tree on a FIRE phase monster of defense 0: 1.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 9 new cases and every re-pinned test pass; every other unit test passes unchanged.

**Commit**: `feat(game): feed boss damage and armor pierce from the talents and drop the retired effects`

---

#### T8: Combo step [x]

**Owner**: game-dev
**Goal**: The combo adds `stepPercent` a click, 1 by default (TTR-16).
**Where**: `game/src/domain/combat/combo.js`
**Also changes**: `game/src/domain/combat/combo.test.js`
**Read first**: `game/src/domain/combat/combo.js` (whole file, 92 lines), `combo.test.js` (style)
**Depends on**: None
**Requirement**: TTR-16

**Contract**:

```js
    //  `maxPercent` is the cap of the bonus and `stepPercent` what each click adds (Fúria crescente raises it); the scene sets both before
    //  every click
    constructor (maxPercent = 0, stepPercent = COMBO_STEP_PERCENT)
    {
        this.streak = 0;
        this.idleMs = 0;
        this.maxPercent = maxPercent;
        this.stepPercent = stepPercent;
    }

    get bonus ()
    {
        return Math.min(this.maxPercent, this.streak * this.stepPercent);
    }
```

`comboText` does not change. Update the file header comment (the step can be 1 to 5).

**Steps**:

1. Change the constructor and `bonus`.
2. Add the cases below.

**Tests**: unit
**Test cases** (`combo.test.js`; `clicks(combo, n)` = call `combo.click()` n times and return the last result):

- `a step of 5 gives the 2nd click +5 %, the 11th +50 % and the 12th +50 % under a cap of 50`: `new Combo(50, 5)`: 2nd 5, 11th 50, 12th 50.
- `a step of 2 gives the 6th click +10 % under a cap of 10`: `new Combo(10, 2)`: 6th 10.
- `the default step is 1: the 11th click gets +10 % under a cap of 50`: `new Combo(50)`: 11th 10.
- `comboText reads Combo x3 · +15% after 3 clicks at step 5 and cap 50`: `comboText(combo)` `Combo x3 · +15%`.
- `comboText stays empty with a cap of 0 whatever the step`: `new Combo(0, 5)` after 3 clicks: `''`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 5 new cases pass; every existing combo test passes unchanged.

**Commit**: `feat(game): let the combo add a step set by the scene`

---

### Phase 4: Game talent data and texts

#### T9: Talent titles, icons, texts and vein glow [x]

**Owner**: game-dev
**Goal**: The pure texts and numbers the tree shows: branch titles, icon names, effect, full name, lock text and lit opacity (TTR-04, TTR-17, TTR-19, TTR-21, TTR-22).
**Where**: `game/src/domain/talents/talents.js`
**Also changes**: `game/src/domain/talents/talents.test.js`
**Read first**: `game/src/domain/talents/talents.js:57-101`, `talents.test.js:155-195`
**Depends on**: T7
**Requirement**: TTR-04, TTR-17, TTR-19, TTR-21, TTR-22

**Contract**:

```js
export const BRANCH_TITLES = { TIME: 'Caça aos chefes', BREAK: 'Quebra de defesa', POWER: 'Poder do clique', COMBO: 'Combo' };

//  in describeTalentEffect, right after the `value === 0` check:
    if (unit === 'combo-step')
    {
        return `+${COMBO_STEP_PERCENT + value}% por clique`;
    }

const ICON_NAMES = {
    MINIBOSS_TIME: 'miniboss-time',
    BOSS_DAMAGE: 'boss-damage',
    PHYSICAL_BREAK: 'break-physical',
    ARMOR_PIERCE: 'armor-pierce',
    CLICK_DAMAGE: 'click-damage',
    CRIT_CHANCE: 'crit-chance',
    CRIT_DAMAGE: 'crit-damage',
    COMBO: 'combo',
    CLICK_FLAT_DAMAGE: 'click-flat-damage',
    COMBO_FURY: 'combo-fury'
};

//  "Dano de clique (%)" for grade 1 and a single talent, "Dano de clique (%) (Grau 2)" for grade 2
export const talentFullName = (talent) => ((talent.grade ?? 1) > 1 ? `${talent.label} (Grau ${talent.grade})` : talent.label);

//  Why a locked talent cannot be bought: a grade waits for the grade before, a single talent for its prerequisite (`talents` is the list)
export const talentLockText = (talent, talents) =>
{
    const level = talent.requiredLevel ?? talent.maxLevel;

    if ((talent.grade ?? 1) > 1)
    {
        return `Bloqueado: chegue ao nível ${level} do Grau ${talent.grade - 1}`;
    }

    const required = (talents ?? []).find((other) => other.id === talent.requiredId);

    return required ? `Bloqueado: chegue ao nível ${level} de ${required.label}` : `Bloqueado: chegue ao nível ${level} do talento anterior`;
};

//  The opacity of the lit veins of `branch` (spec talent-tree-rework D17): 0 without a level, else 0.2 + 0.8 x levels / max levels, two decimals
export const branchGlow = (talents, branch) =>
{
    const mine = (talents ?? []).filter((talent) => talent.branch === branch);
    const levels = mine.reduce((sum, talent) => sum + talent.level, 0);
    const max = mine.reduce((sum, talent) => sum + talent.maxLevel, 0);

    return levels === 0 || max === 0 ? 0 : Math.round((0.2 + 0.8 * levels / max) * 100) / 100;
};
```

**Steps**:

1. Change `BRANCH_TITLES`, `ICON_NAMES` and `describeTalentEffect`.
2. Add `talentFullName`, `talentLockText`, `branchGlow`.
3. Re-pin and add the tests below.

**Tests**: unit
**Re-pinned** (`talents.test.js`):

- `names the 7 icons as the asset prompts do`: the ids become `MINIBOSS_TIME, BOSS_DAMAGE, PHYSICAL_BREAK, ARMOR_PIERCE, CLICK_DAMAGE, CRIT_CHANCE, CRIT_DAMAGE` and the names `talent-miniboss-time, talent-boss-damage, talent-break-physical, talent-armor-pierce, talent-click-damage, talent-crit-chance, talent-crit-damage`.
- `titles the four branches Tempo, Quebra de defesa, Poder do clique and Combo` → title `titles the four branches Caça aos chefes, Quebra de defesa, Poder do clique and Combo`; the expected object is the contract's.

**Test cases** (new, `talents.test.js`; talents built as `{ id, baseId, grade, branch, label, level, maxLevel, value, ... }`):

- `reads Fúria crescente as +2% por clique at level 1 and +5% por clique at level 4`: `describeTalentEffect({ branch: 'COMBO', unit: 'combo-step', value: 1 })` `+2% por clique`; value 4 `+5% por clique`; value 0 `nenhum`.
- `reads boss damage and armor pierce as percents: +20%`: unit `%` value 20 in branch TIME and in branch BREAK both `+20%`.
- `names the icons of boss damage, armor pierce and Fúria crescente and suffixes grades 2 and 3`: `talentIconName('BOSS_DAMAGE')` `talent-boss-damage`, `('BOSS_DAMAGE', 2)` `talent-boss-damage-g2`, `('ARMOR_PIERCE', 3)` `talent-armor-pierce-g3`, `('COMBO_FURY')` `talent-combo-fury`.
- `talentFullName adds the grade from grade 2`: `{ label: 'Dano de clique (%)', grade: 1 }` `Dano de clique (%)`; grade 2 `Dano de clique (%) (Grau 2)`; no grade field `Dano de clique (%)`.
- `talentLockText of a grade names the grade before`: `{ grade: 2, requiredLevel: 10, maxLevel: 10 }` `Bloqueado: chegue ao nível 10 do Grau 1`; `{ grade: 3, maxLevel: 10 }` (no `requiredLevel`) `Bloqueado: chegue ao nível 10 do Grau 2`.
- `talentLockText of Fúria crescente names Limite de dano do combo`: `{ id: 'COMBO_FURY', grade: 1, requiredId: 'COMBO', requiredLevel: 10, maxLevel: 4 }` with a list holding `{ id: 'COMBO', label: 'Limite de dano do combo' }` gives `Bloqueado: chegue ao nível 10 de Limite de dano do combo`; with an empty list `Bloqueado: chegue ao nível 10 do talento anterior`.
- `branchGlow is 0 for a branch without a level`: a 28-talent list at level 0 gives 0 for each branch.
- `branchGlow of TIME with only MINIBOSS_TIME 5 is 0.27`: the TIME talents of the list are 6 with `maxLevel` 10.
- `branchGlow of COMBO with only COMBO 10 is 0.44, 0.47 without Fúria crescente`: COMBO talents `COMBO`, `COMBO_G2`, `COMBO_G3` (max 10 each) and `COMBO_FURY` (max 4): 0.44; without `COMBO_FURY`: 0.47.
- `branchGlow of POWER is 0.21 with one level and 1 with its 12 talents at 10`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 10 new cases and the 2 re-pinned tests pass; every other unit test passes unchanged.

**Commit**: `feat(game): name the boss hunt branch and add the texts and glow of the talent tree`

---

#### T10: Drop the six retired ids on read [x]

**Owner**: game-dev
**Goal**: A list from an older backend never brings `BOSS_TIME*` or `CRIT_RESIST_BREAK*` into the game (TTR-13).
**Where**: `game/src/application/talents/talentCollection.js`
**Also changes**: `game/src/application/talents/talentCollection.test.js`
**Read first**: `talentCollection.js:1-25`, `talentCollection.test.js:130-175`
**Depends on**: None
**Requirement**: TTR-13

**Contract**:

```js
//  Talents an older backend still answers; they left the catalog and are dropped on read (specs unified-damage and talent-tree-rework)
export const RETIRED_TALENT_IDS = [
    'MAGICAL_BREAK', 'MAGICAL_BREAK_G2', 'MAGICAL_BREAK_G3',
    'BOSS_TIME', 'BOSS_TIME_G2', 'BOSS_TIME_G3',
    'CRIT_RESIST_BREAK', 'CRIT_RESIST_BREAK_G2', 'CRIT_RESIST_BREAK_G3'
];
```

**Steps**:

1. Extend the list.
2. Re-pin and add the tests below.

**Tests**: unit
**Re-pinned**: `lists the three retired ids` → title `lists the nine retired ids`; the expected array is the contract's, in that order.
**Test cases** (new; one per read path, L-098):

- `drops every grade of BOSS_TIME and CRIT_RESIST_BREAK from a loaded list`: a list of `BOSS_TIME`, `BOSS_TIME_G2`, `BOSS_TIME_G3`, `CRIT_RESIST_BREAK`, `CRIT_RESIST_BREAK_G2`, `CRIT_RESIST_BREAK_G3`, `COMBO` loads as `[ COMBO ]`.
- `drops them from the list an upgrade answers`: same list as the upgrade answer, `talents()` is `[ COMBO ]`.
- `drops them from the list a reset answers`: same list as the reset answer, `talents()` is `[ COMBO ]`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 3 new cases and the re-pinned test pass.

**Commit**: `feat(game): drop the retired chapter boss time and critical break from the talent list`

---

#### T11: Attribute panel lines without the retired talents [x]

**Owner**: game-dev
**Goal**: The Equipamento panel reads the chapter boss time without a talent and the critical resistance break from Vex only (TTR-04, TTR-13).
**Where**: `game/src/domain/equipment/leaderStats.js`
**Also changes**: `game/src/domain/equipment/leaderStats.test.js`
**Read first**: `leaderStats.js` (whole file, 35 lines), `leaderStats.test.js:60-170`
**Depends on**: T7
**Requirement**: TTR-04, TTR-13

**Contract**: two lines change:

```js
        { id: 'bossTime', text: `Tempo extra de chefe: ${one(equipmentSeconds)}s` },
        { id: 'breakCrit', text: `Quebra de resistência a crítico: ${passives.critResistBreak}` }
```

Update the comment above `leaderStats` (Kael in both time lines, Vex alone in the critical resistance break line). `armorPierce` and `bossDamage` already read the attacker, which carries the talents after T7.

**Steps**:

1. Change the two lines and the comment.
2. Re-pin and add the tests below.

**Tests**: unit
**Re-pinned** (`leaderStats.test.js`):

- `reads BOSS_TIME on the chapter boss line only` → title `reads no talent on the chapter boss line: BOSS_DAMAGE 10 and an older BOSS_TIME read 0s`; talents `BOSS_DAMAGE` value 20 and `{ id: 'BOSS_TIME', baseId: 'BOSS_TIME', value: 36 }`: `bossTime` `Tempo extra de chefe: 0s`; `minibossTime` keeps its current value.
- The test at `:86` (`PHYSICAL_BREAK: 3, CRIT_RESIST_BREAK: 8`): `breakCrit` `Quebra de resistência a crítico: 0`; rename the title so it says the critical break talent is ignored.
- Any test that combines Vex with `CRIT_RESIST_BREAK` talents: the expected `breakCrit` becomes `Quebra de resistência a crítico: 15`.

**Test cases** (new):

- `shows BOSS_DAMAGE 10 as Dano em chefes: 20% and ARMOR_PIERCE 10 as Perfuração de armadura: 10%`: a 0-star Kael, no pieces, talents `BOSS_DAMAGE` value 20 and `ARMOR_PIERCE` value 10: `bossDamage` `Dano em chefes: 20%`, `armorPierce` `Perfuração de armadura: 10%`, `bossTime` `Tempo extra de chefe: 0s`, `breakCrit` `Quebra de resistência a crítico: 0`.
- `adds the talent to the pieces: BOSS_DAMAGE value 20 and a ring of BOSS_DAMAGE_PCT 28 read 48%`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 2 new cases and the re-pinned tests pass.

**Commit**: `feat(game): show the boss damage and armor pierce talents in the attribute panel`

---

### Phase 5: Game screens

#### T12: `Seu crítico` chip, chip refresh and combo step in the battle scene [x]

**Owner**: game-dev
**Goal**: The enemy line shows the effective critical chance and follows every change of it; the combo uses the step of Fúria crescente (TTR-09, TTR-16).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `ClickerGame.js` `showEnemyStats` (`:1049-1066`), `refreshEnemyStats` (`:877-885`), the listeners near `this.talents.onChange(() => this.refreshEnemyStats());` (`:193`), `strike` (`:1531-1552`), `showCombo` (`:1555-1566`), `leaderAttacker()` (`:1204`); `ClickerGame.test.js` every line containing `Crit res`
**Depends on**: T4, T7, T8
**Requirement**: TTR-09, TTR-16

**Contract**:

- Import `effectiveCritChance` from `../../domain/combat/damage` and `talentComboStep` from `../../domain/talents/talents`.
- In `showEnemyStats(stats)`:

```js
        //  The click's critical chance against this monster (spec talent-tree-rework): no skill buff, no overflow, one decimal at most
        const chance = Math.round(effectiveCritChance(this.leaderAttacker().critChance, stats.critResistance ?? 0) * 10) / 10;
        const chips = [ [ 'defense', `Defesa ${defenseOf(stats)}%` ], [ 'crit', `Seu crítico: ${chance}%` ] ];
```

  Update the comment above it (`"Water  Defesa 10%  Seu crítico: 28%"`).
- Next to `this.talents.onChange(() => this.refreshEnemyStats());` add `this.equipment.onChange(() => this.refreshEnemyStats());` (a piece equipped or unequipped on the leader). The heroes listener already refreshes on a leader or team change.
- In `strike` and in `showCombo`, next to `this.combo.maxPercent = talentComboCap(this.talents.talents());` add `this.combo.stepPercent = talentComboStep(this.talents.talents());`.

**Steps**:

1. Change `showEnemyStats` and its comment.
2. Add the equipment listener.
3. Set the step in `strike` and `showCombo`.
4. Re-pin the chip assertions (table below) and add the new cases.

**Tests**: unit
**Re-pinned** (`ClickerGame.test.js`; every leader below has `C` 10 unless the row says otherwise; check the leader of each test against the rule at the top of this file before writing the value):

| Line (today) | Old text | New text |
| ------------ | -------- | -------- |
| `:2059` | `Water  Defesa 40%  Crit res 12%` | `Water  Defesa 40%  Seu crítico: 0%` |
| `:2065` | `Darkness  Defesa 50%  Crit res 100%` | `Darkness  Defesa 50%  Seu crítico: 0%` |
| `:2127` | `Water  Defesa 11%  Crit res 33%` | `Water  Defesa 11%  Seu crítico: 0%` |
| `:2133` | `Light  Defesa 1%  Crit res 3%` | `Light  Defesa 1%  Seu crítico: 7%` |
| `:2139`, `:2159` | `Darkness  Defesa 30%  Crit res 30%` | `Darkness  Defesa 30%  Seu crítico: 0%` |
| `:2145` | `Fire  Defesa 0%  Crit res 0%` | `Fire  Defesa 0%  Seu crítico: 10%` |
| `:2153` | `[ 'crit', 'Crit res 33%' ]` | `[ 'crit', 'Seu crítico: 0%' ]` |
| `:2171` | `Nature  Defesa 0%  Crit res 0%` | `Nature  Defesa 0%  Seu crítico: 10%` |
| `:2269` | `Light  Defesa 4%  Crit res 6%` | `Light  Defesa 4%  Seu crítico: 4%` |
| `:3615` | `toContain('Crit res 20%')` (after T7) | `toContain('Seu crítico: 0%')` |
| `:5410` | `Fire  Defesa 25%  Crit res 30%` | `Fire  Defesa 25%  Seu crítico: 0%` |
| `:5804` | `Fire  Defesa 109%  Crit res 0%` | `Fire  Defesa 109%  Seu crítico: 10%` |
| `:5827` | `Fire  Defesa 79%  Crit res 0%` | `Fire  Defesa 79%  Seu crítico: 10%` |
| `:6028` | `Fire  Defesa 0%  Crit res 0%` | `Fire  Defesa 0%  Seu crítico: 10%` |
| `:6351` | `Fire  Defesa 50%  Crit res 0%` | `Fire  Defesa 50%  Seu crítico: 10%` |

  The test `Vex as an ally shows Crit res 15% on a monster of critical resistance 30` (`:5417`) becomes `Vex as an ally shows Seu crítico: 10% on a monster of critical resistance 5, 5% without him`: start `bigMonster({ element: 'FIRE', defense: 40, critResistance: 5 })` (or the start helper the describe uses, with critical resistance 5): with Vex `Fire  Defesa 40%  Seu crítico: 10%`; a second context without allies `Fire  Defesa 40%  Seu crítico: 5%`. Rename every test title that says `Crit res` so it says `Seu crítico`.

**Test cases** (new, `ClickerGame.test.js`; one per trigger of P1 Critical AC 12, L-098):

- `shows Seu crítico: 10% for a 3-star Kael against critical resistance 30`: heroes `{ leaderId: 'kael', heroes: [ heroEntry('kael', { 3: 1 }, 3) ] }`, start `withStats(stats('FIRE', 0, 0, 30))`.
- `shows Seu crítico: 100% for a leader of critical chance 130 against resistance 10`: 9-star Kael (`C` 70) and talents `[ COMBO_MAXED, { id: 'CRIT_CHANCE', baseId: 'CRIT_CHANCE', value: 60 } ]`, resistance 10.
- `the chip follows a talent upgrade`: 0-star Kael, resistance 0, `Seu crítico: 10%`; the talent gateway answers an upgrade to `CRIT_CHANCE` value 5 (as the test at `:3660` does): `Seu crítico: 15%`.
- `the chip follows a talent reset`: start with `CRIT_CHANCE` value 5 (`15%`), reset answers no levels: `10%`.
- `the chip follows a leader change`: from a 0-star Kael (`10%`) to a 3-star Lyra (`40%`) against resistance 0 (change the leader the way the test `uses the bonus of the new leader on the next click` does).
- `the chip follows a piece equipped on the leader`: the leader's pieces gain a ring with `CRIT_CHANCE` 20 and the equipment collection fires its change listeners (use the equip path the existing equipment tests of this file use): `30%`.
- `the chip follows a piece unequipped from the leader`: the reverse: from `30%` to `10%`.
- `the chip follows a change of the fighting allies`: at chapter 5, saving the team with Lyra in slot 1 (heroes collection `setTeam`) turns `10%` into `20%` against resistance 0.
- `the chip follows the target of a fight with adds`: the describe of the adds fight; choosing an add whose critical resistance differs from the main's changes the chip to that add's value (main resistance 0 reads `10%`, an add of resistance 4 reads `6%`; give the fixture those resistances).
- `with COMBO 10 and Fúria crescente 4 the 2nd click gets +5 % and the HUD reads Combo x3 · +15% after 3 clicks`: talents `[ COMBO_MAXED, { id: 'COMBO_FURY', baseId: 'COMBO_FURY', value: 4 } ]` (`COMBO_MAXED` gives the cap 50), FIRE monster of defense 0, roll 0.99: the 2nd click's health loss `toBeCloseTo(1.05, 10)`; after the 3rd click `.combo-hud` reads `Combo x3 · +15%`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 10 new cases and every re-pinned assertion pass; `grep -n "Crit res" game/src/adapters/phaser/ClickerGame.js game/src/adapters/phaser/ClickerGame.test.js` prints nothing.
- [ ] Every other unit test passes unchanged.

**Commit**: `feat(game): show Seu crítico on the enemy line and use the step of Fúria crescente`

---

#### T13: Layout map of the talent tree [x]

**Owner**: game-dev
**Goal**: One file holds every coordinate of the tree, provisional until the art arrives (TTR-19, TTR-22, spec D14).
**Where**: `game/src/adapters/phaser/views/talentTreeLayout.js` (new)
**Also changes**: `game/src/adapters/phaser/views/talentTreeLayout.test.js` (new)
**Read first**: `game/src/adapters/phaser/views/mapLayout.js` (whole file, 32 lines), design § Layout map
**Depends on**: None
**Requirement**: TTR-19, TTR-22

**Contract** (exports; values from design § Layout map):

```js
//  Where the talent tree sits, in percent of the 16:9 board (origin top left). Provisional: recalibrated on talent-tree-bg.jpg once it exists,
//  like mapLayout.js (spec talent-tree-rework D14). Four boughs: far left TIME, upper left BREAK, upper right POWER, far right COMBO.
export const TREE_SIZE = { width: 1024, height: 576 };
export const TREE_IMAGE = 'assets/talent-tree-bg.jpg';

//  Grade 1 lowest: the upper boughs (BREAK, POWER) and the far boughs (TIME, COMBO) have their own rows
const UPPER_ROWS = { 1: 46, 2: 33, 3: 20 };
const FAR_ROWS = { 1: 66, 2: 53, 3: 40 };
const CHAINS = [
    [ 'MINIBOSS_TIME', 6, FAR_ROWS ], [ 'BOSS_DAMAGE', 15, FAR_ROWS ],
    [ 'PHYSICAL_BREAK', 26, UPPER_ROWS ], [ 'ARMOR_PIERCE', 35, UPPER_ROWS ],
    [ 'CLICK_DAMAGE', 55, UPPER_ROWS ], [ 'CLICK_FLAT_DAMAGE', 63.5, UPPER_ROWS ], [ 'CRIT_CHANCE', 72, UPPER_ROWS ], [ 'CRIT_DAMAGE', 80.5, UPPER_ROWS ],
    [ 'COMBO', 94, FAR_ROWS ]
];

//  The 27 graded talents and Fúria crescente on the COMBO bough
export const NODE_POSITIONS = Object.freeze({
    ...Object.fromEntries(CHAINS.flatMap(([ id, x, rows ]) =>
        [ 1, 2, 3 ].map((grade) => [ grade === 1 ? id : `${id}_G${grade}`, { x, y: rows[grade] } ]))),
    COMBO_FURY: { x: 85, y: 72 }
});

export const LARGE_NODES = Object.freeze([ 'COMBO_FURY' ]);

export const BANNER_POSITIONS = Object.freeze({ TIME: { x: 10.5, y: 29 }, BREAK: { x: 30.5, y: 11 }, POWER: { x: 68, y: 11 }, COMBO: { x: 91, y: 29 } });

//  The ellipse of each branch's lit veins: centre (x, y) and radii (rx, ry), in percent
export const BRANCH_GLOWS = Object.freeze({
    TIME: { x: 10.5, y: 53, rx: 10, ry: 20 },
    BREAK: { x: 30.5, y: 33, rx: 10, ry: 20 },
    POWER: { x: 68, y: 33, rx: 18, ry: 20 },
    COMBO: { x: 90, y: 58, rx: 9, ry: 24 }
});

export const TRUNK = Object.freeze({ base: { x: 50, y: 100 }, fork: { x: 50, y: 58 } });

//  The fallback veins: the trunk, then one line per chain from the fork up its grades (COMBO passes through Fúria crescente)
export const VEINS = Object.freeze([
    [ TRUNK.base, TRUNK.fork ],
    ...CHAINS.map(([ id ]) => [
        TRUNK.fork,
        ...(id === 'COMBO' ? [ NODE_POSITIONS.COMBO_FURY ] : []),
        NODE_POSITIONS[id], NODE_POSITIONS[`${id}_G2`], NODE_POSITIONS[`${id}_G3`]
    ])
]);
```

**Steps**:

1. Write the file.
2. Write the test file with the cases below.

**Tests**: unit
**Test cases** (`talentTreeLayout.test.js`):

- `places the 28 talents of the catalog`: `Object.keys(NODE_POSITIONS).sort()` equals the 28 ids of design § Data Models, sorted.
- `stacks each chain in one column, grade 1 lowest`: for each of the 9 base ids the three grades share `x`; `PHYSICAL_BREAK`, `ARMOR_PIERCE`, `CLICK_DAMAGE`, `CLICK_FLAT_DAMAGE`, `CRIT_CHANCE`, `CRIT_DAMAGE` read y 46, 33, 20; `MINIBOSS_TIME`, `BOSS_DAMAGE`, `COMBO` read y 66, 53, 40.
- `puts Fúria crescente on the COMBO bough at (85, 72) and marks it large`: `NODE_POSITIONS.COMBO_FURY` `{ x: 85, y: 72 }`; `LARGE_NODES` `[ 'COMBO_FURY' ]`.
- `keeps every node inside the board and out of the detail card`: every x in 5 to 95 and every y in 18 to 75; no node with x between 30 and 70 has y above 50.
- `keeps the nodes of one row at least 8.5 % apart`: for every two nodes with the same y, `|x1 - x2| >= 8.5`.
- `places one banner per branch and one glow per branch`: keys `TIME`, `BREAK`, `POWER`, `COMBO` in both; banners `TIME` (10.5, 29), `BREAK` (30.5, 11), `POWER` (68, 11), `COMBO` (91, 29); glow values as the contract.
- `draws the trunk and one vein per chain from the fork`: `VEINS.length` 10; `VEINS[0]` `[ { x: 50, y: 100 }, { x: 50, y: 58 } ]`; every other vein starts at `{ x: 50, y: 58 }`; the COMBO vein has 5 points, its 2nd is `{ x: 85, y: 72 }`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 7 cases pass.

**Commit**: `feat(game): add the layout map of the talent tree`

---

#### T14: The painted tree view [x]

**Owner**: game-dev
**Goal**: `renderTalents` draws the board, the nodes, the banners, the lit layers, the fixed plaques and the detail card, with a fallback for every art file (TTR-18 to TTR-25).
**Where**: `game/src/adapters/phaser/views/talentsView.js`
**Also changes**: `game/src/adapters/phaser/views/talentsView.test.js` (rewritten: the old card and column cases go, the cases below come in)
**Read first**: `talentsView.js` (whole file, 90 lines), `talentsView.test.js:1-60` (fixture style), `dom.js` (`el`, `iconWithFallback`), `farmView.js:85-120` (board image and `is-fallback`), `talentTreeLayout.js` (T13), `talents.js` (T9 helpers)
**Depends on**: T13, T9
**Requirement**: TTR-18, TTR-19, TTR-20, TTR-21, TTR-22, TTR-23, TTR-24, TTR-25

**Contract**:

```js
export const UNAVAILABLE_TEXT = 'Talentos indisponíveis';          // unchanged
export const EMPTY_DETAIL_TEXT = 'Escolha um talento na árvore para ver os detalhes.';
export const renderTalentsUnavailable = () => /* unchanged */;
export const renderTalents = (talents, points, { busy = false, selectedId = null, onSelect = () => {}, onUpgrade, onReset }) => HTMLElement;
export const talentScrollOf = (screen) => (screen ? { left: scroll.scrollLeft, top: scroll.scrollTop } : null);  // scroll = screen's talent-tree-scroll
export const placeTalentScroll = (screen, previous) => void;
//  previous given: scrollLeft = previous.left, scrollTop = previous.top;
//  previous null: scrollLeft = (scrollWidth - clientWidth) / 2, scrollTop = (scrollHeight - clientHeight) / 2
```

DOM of `renderTalents` (children in this order; `art(src, className, host, fallbackClass)` = an `<img class="<className>" src="<src>" alt="">` appended to `host` whose `error` adds `fallbackClass` to `host` and removes the image):

```
div.talent-screen                           testid talent-screen
  div.talent-tree-scroll                    testid talent-tree-scroll
    div.talent-tree                         testid talent-tree
      img.talent-tree-image  (TREE_IMAGE)   error: tree gets is-fallback, image removed
      div.talent-lit x 4 (BRANCHES order)   testid talent-lit-<BRANCH>, data-branch, style --cx/--cy/--rx/--ry = BRANCH_GLOWS in %,
                                            style opacity = String(branchGlow(talents, branch))
      svg.talent-tree-veins                 testid talent-tree-veins, viewBox "0 0 100 100", preserveAspectRatio "none",
                                            one <polyline points="x,y x,y ..."> per VEINS entry (createElementNS SVG)
      for each branch of BRANCHES (TIME, BREAK, POWER, COMBO):
        div.talent-banner                   testid talent-branch-<BRANCH>, data-branch, style left/top = BANNER_POSITIONS in %
          img.talent-banner-art (assets/talent-banner.png)   error: banner gets no-art
          strong.talent-branch-title        BRANCH_TITLES[branch]
        for each talent of the list with this branch AND a NODE_POSITIONS entry, in list order:
          button.talent-node (+ is-large if in LARGE_NODES)
                                            type button, testid talent-<ID>, data-branch, data-grade (grade ?? 1), data-state,
                                            title = talentFullName(t), aria-label = `${talentFullName(t)}, nível ${level} de ${maxLevel}`,
                                            aria-pressed = 'true' | 'false', style left/top in %; click -> onSelect(t.id)
            img.talent-node-frame (assets/talent-node-frame.png, or talent-node-frame-large.png when large)   error: node gets no-frame
            iconWithFallback(talentIconName(baseId, grade), GLYPHS[branch], 'talent-node-icon', grade > 1 ? talentIconName(baseId) : null)
            [data-state locked] iconWithFallback('talent-node-lock', '🔒', 'talent-node-lock')
            [grade 2 or 3] span.talent-node-grade   testid talent-node-grade-<ID>, text 'II' | 'III'
            span.talent-node-level            testid talent-node-level-<ID>, text `${level}/${maxLevel}`
            [grade 1] span.talent-node-caption  testid talent-caption-<ID>, text label
  div.talent-title                          testid talent-title
    img.talent-plaque-art (assets/talent-title-plaque.png)    error: plaque gets no-art
    span.talent-title-text                  'Talentos'
  div.talent-points                         testid talent-points
    img.talent-round-art (assets/talent-points-medallion.png) error: talent-points gets no-art
    span.talent-pill                        `Pontos de talento: ${points.available}`
  button.talent-reset                       type button, testid talent-reset, disabled = busy || points.spent === 0, click -> onReset()
    img.talent-round-art (assets/talent-reset-button.png)     error: talent-reset gets no-art
    span.talent-pill                        'Reiniciar pontos'
  div.talent-detail                         testid talent-detail, data-branch = the selected talent's branch (absent when none)
    nothing selected (or the selected id not in the list):
      p.talent-detail-empty                 testid talent-detail-empty, EMPTY_DETAIL_TEXT
    selected:
      strong.talent-detail-name             testid talent-detail-name, talentFullName(t)
      div.talent-level                      testid talent-level-<ID>, `Nível ${level}/${maxLevel}`
      div.talent-effect                     testid talent-effect-<ID>, `Efeito: ${describeTalentEffect(t)}`
      then exactly one of:
        locked:  div.talent-lock            testid talent-locked-<ID>, talentLockText(t, talents)
        maxed:   div.talent-max             testid talent-max-<ID>, 'Nível máximo'
        else:    button.talent-upgrade      type button, testid talent-upgrade-<ID>,
                                            `Melhorar (${nextCost} ${nextCost === 1 ? 'ponto' : 'pontos'})`,
                                            disabled = busy || points.available < nextCost, click -> onUpgrade(t)
```

`data-state`: `locked` when `t.unlocked === false`; else `maxed` when `t.nextCost == null`; else `available` when `points.available >= t.nextCost`; else `open`. `GLYPHS` stays `{ TIME: '⏳', BREAK: '🛡', POWER: '⚔', COMBO: '✦' }`. Update the header comment of `renderTalents` to describe the tree.

**Steps**:

1. Add the imports (`talentTreeLayout.js`, the T9 helpers) and the `art` helper.
2. Write the board (image, lit layers, veins).
3. Write the banners and nodes.
4. Write the fixed plaques and the detail card.
5. Write `talentScrollOf` and `placeTalentScroll`.
6. Rewrite `talentsView.test.js` with the cases below (a 28-talent fixture built like the backend contract of design § Data Models, with `requiredId` / `requiredLevel`).

**Tests**: unit (jsdom)
**Test cases** (`talentsView.test.js`; `show(levels, points, options)` renders the fixture with those levels; an art error is `image.dispatchEvent(new Event('error'))`):

- `draws one node per talent of the list that the map places: 28`.
- `draws no node for a talent outside the map and throws nothing`: the list plus `{ id: 'NEW_ONE', baseId: 'NEW_ONE', branch: 'POWER', ... }`: 28 nodes, no `talent-NEW_ONE`.
- `draws no node for a mapped talent missing from the list`: the list without `COMBO_FURY`: 27 nodes, no `talent-COMBO_FURY`.
- `centres each node on its map coordinates`: `talent-CLICK_DAMAGE` `style.left` `55%`, `style.top` `46%`; `talent-COMBO_FURY` `85%`, `72%`; `talent-MINIBOSS_TIME` `6%`, `66%`.
- `marks Fúria crescente large and gives it the large frame`: class `is-large`; its `.talent-node-frame` `src` ends with `assets/talent-node-frame-large.png`; `talent-CLICK_DAMAGE` frame ends with `assets/talent-node-frame.png`.
- `shows the level chip, the title and the aria-label`: `CLICK_DAMAGE_G2` at level 3: chip `3/10`, `title` `Dano de clique (%) (Grau 2)`, `aria-label` `Dano de clique (%) (Grau 2), nível 3 de 10`.
- `captions grade 1 nodes and Fúria crescente and badges grade 2 and 3`: `talent-caption-CLICK_DAMAGE` `Dano de clique (%)`; `talent-caption-COMBO_FURY` `Fúria crescente`; no `talent-caption-CLICK_DAMAGE_G2`; `talent-node-grade-CLICK_DAMAGE_G2` `II`; `talent-node-grade-CLICK_DAMAGE_G3` `III`; no `talent-node-grade-CLICK_DAMAGE`.
- `marks a node locked and draws the lock over it`: `CLICK_DAMAGE_G2` with `unlocked` false: `data-state` `locked`, one `.talent-node-lock` inside.
- `marks a node maxed at its top level`: `CLICK_DAMAGE` level 10 (`nextCost` null): `maxed`, no lock.
- `marks a node available when the points pay its next level`: points `{ available: 1, spent: 0 }`, `CRIT_CHANCE` (`nextCost` 1): `available`.
- `marks a node open when the points do not pay its next level`: points `{ available: 0 }`: `CRIT_CHANCE` `open`; with points 1, `CRIT_CHANCE_G2` opened (`unlocked` true, `nextCost` 2): `open`.
- `marks the selected node aria-pressed true and the others false`: `selectedId: 'COMBO'`.
- `calls onSelect with the id on a node click and never onUpgrade`.
- `shows the empty text and no button with nothing selected`: `talent-detail-empty` reads `Escolha um talento na árvore para ver os detalhes.`; no `.talent-upgrade` in the card; the card has no `data-branch`.
- `shows the empty text when the selected id is not in the list`.
- `fills the card of an open talent: name, level, effect and a 1 point button`: `CLICK_DAMAGE` level 0, points 1: `talent-detail-name` `Dano de clique (%)`, `talent-level-CLICK_DAMAGE` `Nível 0/10`, `talent-effect-CLICK_DAMAGE` `Efeito: nenhum`, `talent-upgrade-CLICK_DAMAGE` `Melhorar (1 ponto)` enabled; card `data-branch` `POWER`.
- `prices a grade 2 level in points: Melhorar (2 pontos)`: `COMBO_G2` opened.
- `calls onUpgrade with the talent when the card button is clicked`.
- `disables the card button while busy`.
- `disables the card button when the talent costs more than the points`: `COMBO_G2` with 1 point.
- `shows Nível máximo and no button for a maxed talent`: `talent-max-CLICK_DAMAGE` `Nível máximo`.
- `shows the grade lock text and no button for a locked grade`: `talent-locked-CLICK_DAMAGE_G2` `Bloqueado: chegue ao nível 10 do Grau 1`.
- `shows the lock text of Fúria crescente`: `talent-locked-COMBO_FURY` `Bloqueado: chegue ao nível 10 de Limite de dano do combo`.
- `reads Fúria crescente as Nível 1/4 and +2% por clique`: level 1, `value` 1, `COMBO` 10.
- `draws the four banners in branch order with their titles and positions`: `.talent-branch-title` texts `Caça aos chefes`, `Quebra de defesa`, `Poder do clique`, `Combo`; `talent-branch-POWER` `style.left` `68%`, `style.top` `11%`.
- `gives each lit layer its ellipse and its opacity`: `talent-lit-TIME` style `--cx` `10.5%`, `--cy` `53%`, `--rx` `10%`, `--ry` `20%`; with only `MINIBOSS_TIME` 5 its opacity `0.27` and `talent-lit-POWER` opacity `0`.
- `draws the trunk and 9 veins`: 10 `polyline` in `talent-tree-veins`; the first `points` `50,100 50,58`.
- `shows the points on the medallion and the reset button`: `talent-points` text `Pontos de talento: 3`; `talent-reset` text `Reiniciar pontos`.
- `disables Reiniciar pontos while nothing is spent and while busy, and calls onReset`: spent 0 disabled; spent 1 enabled and a click calls `onReset`; spent 1 with `busy` disabled.
- `falls back to the gradient board when the board image is missing`: error on `.talent-tree-image`: `talent-tree` has `is-fallback`, no `.talent-tree-image`.
- `falls back to a ring when a node frame is missing`: error on the frame of `talent-CLICK_DAMAGE`: the node has `no-frame`, no `.talent-node-frame`.
- `falls back to the CSS plaque or the bare pill when a banner, the title, the medallion or the reset art is missing`: one error per element (four assertions, each element gets `no-art` and loses its image; the medallion and the reset button keep their `.talent-pill` text).
- `falls back to the branch glyph when an icon is missing and to the grade 1 icon first for grades 2 and 3`: error on the icon of `talent-CLICK_DAMAGE`: `.icon-fallback` `⚔`; error once on `talent-CLICK_DAMAGE_G2`'s icon: its `src` ends with `assets/talent-click-damage.png`.
- `falls back to the lock glyph when the lock art is missing`: `🔒`.
- `placeTalentScroll centres the tree without a previous scroll and keeps a previous one`: with `scrollWidth` 2048, `clientWidth` 1024, `scrollHeight` 1152, `clientHeight` 576 defined on the scroll box (`Object.defineProperty`): `null` gives 512 and 288; `{ left: 120, top: 40 }` gives 120 and 40; `talentScrollOf(null)` is null and `talentScrollOf(screen)` reads `{ left: 120, top: 40 }`.
- `says Talentos indisponíveis` (`renderTalentsUnavailable`, unchanged case).

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 36 cases pass; `talentsView.test.js` holds no `.talent-card`, `.talent-column` or `talent-grade-` selector.
- [ ] Every other unit test passes except the `HeroUi.test.js` Talentos cases T16 re-pins (list them in the commit body).

**Commit**: `feat(game): draw the talent tree on a painted board`

---

#### T15: Talent tree styles [x]

**Owner**: game-dev
**Goal**: The stylesheet draws the tree, every node state, every fallback and the phone zoom (TTR-18 to TTR-24).
**Where**: `game/public/style.css`
**Read first**: `style.css` block `/* ══ Talentos: the points line and four columns of cards ══ */` (`:2361-2482`), `.icon` (`:2486`), `.farm-map` and `.farm-trail` (`:3119-3160`), `:root` tokens (`--wood-*`, `--bronze-500`, `--gold-*`, `--parchment-*`, `--ink-900`, `--color-neutral-700`, `--color-focus`, `--font-*`, `--radius-lg`)
**Depends on**: T14
**Requirement**: TTR-18, TTR-19, TTR-20, TTR-21, TTR-22, TTR-23, TTR-24

**Contract**: replace the whole Talentos block (from `/* ══ Talentos: the points line and four columns of cards ══ */` to the end of `.talent-reset:disabled`) with the rules below, values exactly as written. Keep `.talent-upgrade`, `.talent-upgrade:disabled`, `.talent-max`, `.talent-lock` from the old block (copy them into the new block unchanged).

```css
/* ══ Talentos: the painted tree (spec talent-tree-rework) ══ */

.hero-window.is-talents { position: relative; width: 1024px; height: 576px; max-height: none; padding: 0; overflow: hidden; background: var(--wood-900); border: none; border-radius: 0; }
.hero-window.is-talents .hero-header { position: absolute; top: 8px; right: 8px; z-index: 3; margin: 0; }
.hero-window.is-talents .hero-title { display: none; }
.hero-window.is-talents .hero-error { position: absolute; top: 76px; left: 50%; z-index: 4; margin: 0; transform: translateX(-50%); }
.hero-window.is-talents .hero-body { position: absolute; inset: 0; }
.hero-close-art { display: none; }
.hero-close-text { position: relative; }
.hero-window.is-talents .hero-close-art { display: block; position: absolute; inset: 0; width: 100%; height: 100%; }
.hero-window.is-talents .hero-close:has(.hero-close-art) { position: relative; width: 120px; height: 40px; padding: 0; color: var(--parchment-100); text-shadow: 0 1px 2px #000; background: none; border: none; box-shadow: none; }

/* --branch marks the node glow, the banner bar and the card bar; --branch-ink is the same hue dark enough for text on parchment (4.5:1) */
.talent-screen [data-branch="TIME"] { --branch: #3b9aa6; --branch-ink: #245d64; }
.talent-screen [data-branch="BREAK"] { --branch: #c4492f; --branch-ink: #953724; }
.talent-screen [data-branch="POWER"] { --branch: #c99a1f; --branch-ink: #6c5311; }
.talent-screen [data-branch="COMBO"] { --branch: #8a5bd6; --branch-ink: #6a31c5; }

.talent-screen { position: absolute; inset: 0; }
.talent-tree-scroll { position: absolute; inset: 0; overflow: hidden; }
.talent-tree { position: relative; width: 1024px; height: 576px; background: radial-gradient(ellipse at 50% 100%, var(--wood-700) 0%, var(--wood-900) 70%); }
.talent-tree-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.talent-lit {
    position: absolute; inset: 0; pointer-events: none;
    background: url("assets/talent-tree-bg-lit.jpg") center / cover no-repeat, radial-gradient(ellipse var(--rx) var(--ry) at var(--cx) var(--cy), var(--branch) 0%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse var(--rx) var(--ry) at var(--cx) var(--cy), #000 60%, transparent 100%);
    mask-image: radial-gradient(ellipse var(--rx) var(--ry) at var(--cx) var(--cy), #000 60%, transparent 100%);
}
.talent-tree-veins { display: none; position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.talent-tree.is-fallback .talent-tree-veins { display: block; }
.talent-tree-veins polyline { fill: none; stroke: rgb(245 234 216 / 0.35); stroke-width: 3; stroke-dasharray: 6 5; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

.talent-node { position: absolute; z-index: 1; width: 60px; height: 60px; padding: 0; border: none; border-radius: 50%; background: none; transform: translate(-50%, -50%); cursor: pointer; }
.talent-node.is-large { width: 88px; height: 88px; }
.talent-node-frame { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.talent-node.no-frame { background: radial-gradient(circle, var(--wood-700) 0 62%, var(--wood-900) 63%); box-shadow: inset 0 0 0 4px var(--branch); }
.talent-node .talent-node-icon { position: absolute; top: 50%; left: 50%; width: 36px; height: 36px; transform: translate(-50%, -50%); }
.talent-node.is-large .talent-node-icon { width: 54px; height: 54px; }
.talent-node .talent-node-lock { position: absolute; right: -2px; bottom: -2px; width: 24px; height: 24px; font-size: 14px; }
.talent-node[data-state="locked"] .talent-node-icon { filter: grayscale(1) brightness(0.55); }
.talent-node[data-state="available"] { box-shadow: 0 0 0 3px var(--branch), 0 0 16px 6px var(--branch); }
.talent-node[data-state="maxed"] { box-shadow: 0 0 0 3px var(--gold-400); }
.talent-node.no-frame[data-state="available"] { box-shadow: inset 0 0 0 4px var(--branch), 0 0 0 3px var(--branch), 0 0 16px 6px var(--branch); }
.talent-node.no-frame[data-state="maxed"] { box-shadow: inset 0 0 0 4px var(--branch), 0 0 0 3px var(--gold-400); }
.talent-node[aria-pressed="true"] { outline: 3px solid var(--parchment-100); outline-offset: 4px; }
.talent-node:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 4px; }
.talent-node-level { position: absolute; top: calc(100% - 8px); left: 50%; padding: 0 7px; font-family: var(--font-heading); font-size: 11px; font-weight: 700; line-height: 14px; color: var(--parchment-100); white-space: nowrap; background: rgb(28 18 12 / 0.85); border: 1px solid var(--bronze-500); border-radius: 999px; transform: translateX(-50%); pointer-events: none; }
.talent-node[data-state="maxed"] .talent-node-level { color: var(--gold-400); border-color: var(--gold-400); }
.talent-node-caption { position: absolute; top: calc(100% + 9px); left: 50%; display: -webkit-box; width: 80px; overflow: hidden; font-family: var(--font-body); font-size: 12px; font-weight: 700; line-height: 15px; color: var(--parchment-100); text-align: center; text-shadow: 0 1px 2px #000, 0 0 4px #000; transform: translateX(-50%); -webkit-line-clamp: 2; -webkit-box-orient: vertical; pointer-events: none; }
.talent-node-grade { position: absolute; top: -4px; right: -4px; display: grid; place-items: center; width: 20px; height: 20px; font-family: var(--font-heading); font-size: 11px; font-weight: 700; color: var(--gold-200); background: var(--wood-900); border: 1px solid var(--gold-400); border-radius: 50%; pointer-events: none; }

.talent-banner { position: absolute; z-index: 1; display: grid; place-items: center; width: 140px; height: 34px; transform: translate(-50%, -50%); }
.talent-banner-art,
.talent-plaque-art { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.talent-branch-title { position: relative; font-family: var(--font-heading); font-size: 13px; font-weight: 700; color: var(--branch-ink); white-space: nowrap; }
.talent-banner.no-art,
.talent-title.no-art { background: var(--parchment-100); border: 2px solid var(--wood-600); border-radius: 8px; }
.talent-banner.no-art { box-shadow: inset 0 -3px 0 var(--branch); }

.talent-title { position: absolute; top: 6px; left: 50%; z-index: 2; display: grid; place-items: center; width: 192px; height: 64px; transform: translateX(-50%); }
.talent-title-text { position: relative; font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--ink-900); }

.talent-points,
.talent-reset { position: absolute; bottom: 12px; z-index: 2; display: flex; align-items: center; gap: 8px; height: 56px; }
.talent-points { left: 12px; }
.talent-reset { right: 12px; padding: 0; background: none; border: none; cursor: pointer; }
.talent-round-art { width: 56px; height: 56px; flex: none; pointer-events: none; }
.talent-pill { padding: 6px 12px; font-family: var(--font-heading); font-size: 14px; font-weight: 700; line-height: 18px; color: var(--parchment-100); white-space: nowrap; background: rgb(28 18 12 / 0.85); border: 1px solid var(--bronze-500); border-radius: 999px; }
.talent-reset:disabled { opacity: 0.45; cursor: not-allowed; }
.talent-reset:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.talent-detail { position: absolute; left: 50%; bottom: 8px; z-index: 2; display: flex; flex-direction: column; gap: 4px; box-sizing: border-box; width: 380px; min-height: 112px; padding: 10px 16px 10px 20px; font-size: 13px; color: var(--ink-900); background: var(--parchment-100); border: 2px solid var(--wood-600); border-radius: var(--radius-lg); box-shadow: inset 4px 0 0 var(--branch, var(--bronze-500)), 0 6px 18px rgb(0 0 0 / 0.45); transform: translateX(-50%); }
.talent-detail-name { font-family: var(--font-heading); font-size: 16px; font-weight: 700; }
.talent-level,
.talent-effect,
.talent-detail-empty { color: var(--color-neutral-700); }
.talent-detail-empty { margin: 0; font-style: italic; }

/* Phones (spec talent-tree-rework D16): the board is drawn twice as big and scrolls on both axes */
@media (max-width: 640px) {
    .talent-tree-scroll { overflow: auto; }
    .talent-tree { zoom: 2; }
}
```

**Steps**:

1. Replace the block, keeping the four rules named above.
2. Search the file for any other `.talent-column`, `.talent-card`, `.talent-text`, `.talent-name`, `.talent-grade-title`, `.talent-locked` selector and delete it.
3. Run the gate.

**Tests**: e2e (the computed values are pinned by T20, `game/e2e/talentTreeRework.spec.js`; the rules have no jsdom layout)
**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The build exits 0; `grep -nE "talent-(column|card|text|name|grade-title)|\.talent-locked" game/public/style.css` prints nothing.
- [ ] Every rule of the contract is in the file with its values.

**Commit**: `feat(game): style the painted talent tree, its states, fallbacks and phone zoom`

---

#### T16: Talentos panel: window mode, selection, scroll and close art [ ]

**Owner**: game-dev
**Goal**: The panel opens the tree in its own window size, keeps the selected node and the scroll across re-renders, clears them on opening, and shows the painted close button (TTR-18, TTR-21, TTR-24, TTR-25).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js` `PANEL_HTML` (`:78-82`), the constructor lines that bind `.hero-close` (`:140-152`), `show` (`:205-290`), `close` (`:292-306`), `render_talents`, `upgradeTalent`, `resetTalents` (`:989-1066`), `showTalentPoints` (`:1196-1207`); `HeroUi.test.js:1220-1350`, `:1745-1760`
**Depends on**: T14
**Requirement**: TTR-18, TTR-21, TTR-24, TTR-25

**Contract**:

- `PANEL_HTML`: the close button becomes `'<button type="button" class="hero-close" data-testid="hero-close"><img class="hero-close-art" src="assets/talent-close-button.png" alt=""><span class="hero-close-text">Fechar</span></button>'` (its text stays `Fechar` on every screen). In the constructor, after the `.hero-close` click binding: `const closeArt = this.panel.querySelector('.hero-close-art'); closeArt.addEventListener('error', () => closeArt.remove());`.
- `this.window = this.panel.querySelector('.hero-window');` in the constructor.
- `show(screen)`: next to the other resets add `this.talentSelected = null;` and `this.window.classList.toggle('is-talents', screen === 'talents');`.
- `close()`: add `this.window.classList.remove('is-talents');`.
- `render_talents()`:

```js
    //  The talent tree; `busy` disables the buttons while a request runs. The selected node and the scroll of the tree survive a re-render
    render_talents ()
    {
        this.backButton.hidden = true;

        const previous = talentScrollOf(this.body.querySelector('[data-testid="talent-screen"]'));
        const screen = renderTalents(this.talents.talents(), this.talents.points(), {
            busy: this.talentBusy,
            selectedId: this.talentSelected,
            onSelect: (id) => this.selectTalent(id),
            onUpgrade: (talent) => this.upgradeTalent(talent),
            onReset: () => this.resetTalents()
        });

        this.body.replaceChildren(screen);
        placeTalentScroll(screen, previous);
    }

    //  Shows a talent in the detail card; no request
    selectTalent (id)
    {
        this.talentSelected = id;
        this.render_talents();
    }
```

  Import `talentScrollOf` and `placeTalentScroll` from `./views/talentsView`. `upgradeTalent`, `resetTalents` and `showTalentPoints` keep their code; they re-render through `render_talents`, so the selection and the scroll stay.

**Steps**:

1. Change `PANEL_HTML` and bind the art error.
2. Add the window class toggle and the selection reset.
3. Change `render_talents`, add `selectTalent`, add the imports.
4. Re-pin and add the tests below.

**Tests**: unit (jsdom)
**Re-pinned** (`HeroUi.test.js`):

- The talent fixture (`:1222-1236`): `BOSS_TIME` → `BOSS_DAMAGE` (`'TIME', 'Dano contra chefes', '%', 2`), `CRIT_RESIST_BREAK` → `ARMOR_PIERCE` (`'BREAK', 'Perfuração de armadura', '%', 1`), plus `COMBO_FURY` (grade 1, `maxLevel` 4, `nextCost` 2, `requiredId` `COMBO`, `requiredLevel` 10).
- `opens the window titled Talentos with the points line, the four columns` → title `opens the window titled Talentos with the points medallion and the four banners`: `.hero-title` `Talentos`; `.talent-branch-title` texts `Caça aos chefes`, `Quebra de defesa`, `Poder do clique`, `Combo`; `talent-points` `Pontos de talento: <n>` as before.
- `sends the upgrade with fromLevel 0, shows Nível 1/10 and Pontos de talento: 0`, `says Pontos de talento insuficientes ...`, `says Não foi possível melhorar o talento. ...`: click the node `talent-<ID>` before the card button; every asserted value stays.

**Test cases** (new):

- `adds is-talents to the window on Talentos and removes it on another screen and on close`.
- `selects a node without a request and shows it in the card`: click `talent-CLICK_DAMAGE`: the talent gateway's `upgrade` was not called; `talent-level-CLICK_DAMAGE` reads `Nível 0/10`; the node has `aria-pressed` `true`.
- `keeps the selected node after an upgrade`: select, upgrade answers level 1: `talent-level-CLICK_DAMAGE` `Nível 1/10`, the node still `aria-pressed` `true`.
- `keeps the selected node after a reset`.
- `keeps the selected node after the points reload` (`showTalentPoints`).
- `keeps the selected node after a refused upgrade and the reload of the 409`.
- `clears the selection when Talentos opens again`: select, close, open: `talent-detail-empty` shown.
- `clears the selection when another screen is shown in between`: select, `show('bag')`, `show('talents')`: empty card.
- `centres the tree on opening and keeps the scroll the player chose across a re-render`: stub on `HTMLElement.prototype` (restored after the test) `scrollWidth` 2048, `clientWidth` 1024, `scrollHeight` 1152, `clientHeight` 576; first render `scrollLeft` 512 and `scrollTop` 288; set `scrollLeft` 200, select a node: `scrollLeft` 200.
- `removes the close art when its file is missing and keeps Fechar`: error on `.hero-close-art`: no `.hero-close-art`; `hero-close` text `Fechar`.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 10 new cases and the re-pinned tests pass; every other unit test passes.
- [ ] `graphify update .` has run after the code change.

**Commit**: `feat(game): open Talentos as a tree window that keeps the selection and the scroll`

---

### Phase 6: e2e and author check

#### T17: Fake backend: the 28-talent contract [ ]

**Owner**: test-engineer
**Goal**: The e2e fake backend answers the talents exactly like the new backend (TTR-01, TTR-10, TTR-14, TTR-15).
**Where**: `game/e2e/support/fakeBackend.js`
**Read first**: `fakeBackend.js:206-236` (catalog, grades, `talentsView`, `pointsView`), `:360-370` (`earnedOf`), `:473-512` (`handleTalents`); design § Data Models
**Depends on**: None (Phases 3 to 5 are done before Phase 6 starts)
**Requirement**: TTR-01, TTR-10, TTR-14, TTR-15

**Contract**:

- `TALENT_CATALOG`: the `BOSS_TIME` row becomes `[ 'BOSS_DAMAGE', 'TIME', 'Dano contra chefes', '%', 2 ]` and the `CRIT_RESIST_BREAK` row `[ 'ARMOR_PIERCE', 'BREAK', 'Perfuração de armadura', '%', 1 ]`, at the same positions.
- Graded entries carry `maxLevel: 10`, `cost: grade`, `requiredId: grade === 1 ? null : gradeId(baseId, grade - 1)`, `requiredLevel: grade === 1 ? null : 10`.
- `TALENTS` = the graded entries + one single entry `{ id: 'COMBO_FURY', baseId: 'COMBO_FURY', grade: 1, branch: 'COMBO', label: 'Fúria crescente', unit: 'combo-step', perLevel: 1, maxLevel: 4, cost: 2, requiredId: 'COMBO', requiredLevel: 10 }` (28 entries, Fúria last).
- `isUnlocked(talent, levels)` = `talent.requiredId === null || (levels[talent.requiredId] ?? 0) >= talent.requiredLevel`.
- `talentsView` answers per talent `maxLevel: talent.maxLevel`, `nextCost: level >= talent.maxLevel ? null : talent.cost`, `requiredId`, `requiredLevel` (the other fields as today; `value` of `COMBO_FURY` is its level).
- `pointsView`: spent = sum of `level x talent.cost`.
- `earnedOf`: the starting levels count their cost: `Object.entries(startingTalents[username] ?? {}).reduce((sum, [ id, level ]) => sum + level * (TALENTS.find((talent) => talent.id === id)?.cost ?? 1), 0)` + the starting points (no e2e test starts with grade 2 or 3 levels today, so no existing test changes).
- `handleTalents` upgrade: the `fromLevel` bound and the 400 message use `talent.maxLevel` (`fromLevel must be an integer between 0 and ${talent.maxLevel}`); the max level check uses `talent.maxLevel`; the points check uses `talent.cost`.
- Update the contract comment above the catalog (28 talents, Fúria crescente).

**Steps**:

1. Change the catalog rows and add the single entry.
2. Generalise `isUnlocked`, `talentsView`, `pointsView`, `earnedOf` and the upgrade checks.
3. Run the gate.

**Tests**: e2e (the support file is exercised by the specs below)
**Gate**: `cd game && npx playwright test e2e/talents.spec.js e2e/unifiedDamage.spec.js` (tests that read the old Talentos cards fail until T19; every test of these two files that does not open Talentos passes)
**Done when**:

- [ ] `GET /talents` of the fake answers 28 talents with the fields of design § Data Models (checked by T20 and T21).
- [ ] The talents tests of `talents.spec.js` that do not open the screen (`Talents in combat`, `without COMBO ...`, `COMBO 2 caps a streak ...`) pass.

**Commit**: `test(game): serve the reworked talent catalog from the fake backend`

---

#### T18: Re-pin the enemy line and the Vex scenario in the existing e2e [ ]

**Owner**: test-engineer
**Goal**: The existing e2e read `Seu crítico: <n>%` and the subtractive rule (TTR-09).
**Where**: `game/e2e/unifiedDamage.spec.js`
**Also changes**: `game/e2e/elements.spec.js`, `game/e2e/minibossAdds.spec.js`, `game/e2e/minibossAddsSkills.spec.js`, `game/e2e/minibossAddsTarget.spec.js`, `game/e2e/uiRedesign.spec.js`, `game/e2e/heroTeamPassives.spec.js`
**Read first**: each line of the table below and the setup helper of its file (`startAs`, `startAdds`, `startTeam`)
**Depends on**: None (Phases 3 to 5 are done before Phase 6 starts)
**Requirement**: TTR-09

**Contract** (each leader is the one of the test's setup: `C` 10 for a blank card, 40 for a 3-star card):

| File:line (today) | Old text | New text |
| ----------------- | -------- | -------- |
| `elements.spec.js:38` | `Nature  Defesa 0%  Crit res 0%` | `Nature  Defesa 0%  Seu crítico: 10%` |
| `elements.spec.js:63` | `Darkness  Defesa 50%  Crit res 100%` | `Darkness  Defesa 50%  Seu crítico: 0%` |
| `minibossAdds.spec.js:106` | `Fire  Defesa 109%  Crit res 0%` | `Fire  Defesa 109%  Seu crítico: 10%` |
| `minibossAdds.spec.js:352` | `Fire  Defesa 11%  Crit res 12%` | `Fire  Defesa 11%  Seu crítico: 0%` |
| `minibossAddsSkills.spec.js:130` | `Water  Defesa 50%  Crit res 0%` | `Water  Defesa 50%  Seu crítico: 40%` |
| `minibossAddsTarget.spec.js:120` | `Fire  Defesa 0%  Crit res 0%` | `Fire  Defesa 0%  Seu crítico: 10%` |
| `minibossAddsTarget.spec.js:232` | `Fire  Defesa 15%  Crit res 0%` | `Fire  Defesa 15%  Seu crítico: 10%` |
| `uiRedesign.spec.js:847` | `Nature  Defesa 10%  Crit res 30%` | `Nature  Defesa 10%  Seu crítico: 10%` |
| `unifiedDamage.spec.js:95` | `Water  Defesa 50%  Crit res 0%` | `Water  Defesa 50%  Seu crítico: 40%` |
| `unifiedDamage.spec.js:105` | `Water  Defesa 40%  Crit res 12%` | `Water  Defesa 40%  Seu crítico: 28%` |
| `unifiedDamage.spec.js:118` | `Water  Defesa 40%  Crit res 0%` | `Water  Defesa 40%  Seu crítico: 40%` |
| `unifiedDamage.spec.js:128` | `Water  Defesa 15%  Crit res 0%` | `Water  Defesa 15%  Seu crítico: 40%` |
| `unifiedDamage.spec.js:146` | `Crit res 33%` | `Seu crítico: 7%` |
| `unifiedDamage.spec.js:181` | `Water  Defesa 15%  Crit res 0%` | `Water  Defesa 15%  Seu crítico: 40%` |
| `unifiedDamage.spec.js:188` | `Water  Defesa 14%  Crit res 0%` | `Water  Defesa 14%  Seu crítico: 40%` |

- `unifiedDamage.spec.js:135` title `... Crit res with the red target` becomes `... Seu crítico with the red target` (the CSS assertions stay).
- `heroTeamPassives.spec.js:178` becomes `Vex as an ally shows Seu crítico: 10% on a monster of critical resistance 5 and a roll of 8 is critical`: both `monsterOf('FIRE', 0, 30)` become `monsterOf('FIRE', 0, 5)`; with Vex `[data-stat="crit"]` reads `Seu crítico: 10%` and `dealt` is 2; without Vex `Seu crítico: 5%` and `dealt` 1; the comment becomes `Without Vex the chance is 10 - 5 = 5: the same roll of 8 is a plain click`.

**Steps**:

1. Change each line of the table; rename the two titles.
2. Run the gate.

**Tests**: e2e
**Gate**: `cd game && npx playwright test e2e/elements.spec.js e2e/minibossAdds.spec.js e2e/minibossAddsSkills.spec.js e2e/minibossAddsTarget.spec.js e2e/uiRedesign.spec.js e2e/heroTeamPassives.spec.js e2e/unifiedDamage.spec.js` (the Talentos tests of `uiRedesign.spec.js` and `unifiedDamage.spec.js` are T19's and may fail until it lands)
**Done when**:

- [ ] Every changed test passes; `grep -rn "Crit res" game/e2e` prints nothing.

**Commit**: `test(game): read Seu crítico on the enemy line in the existing e2e`

---

#### T19: Re-pin the existing Talentos e2e on the tree [ ]

**Owner**: test-engineer
**Goal**: The existing Talentos scenarios click a node before they read the detail card and assert the tree's elements (TTR-04, TTR-21, TTR-25).
**Where**: `game/e2e/talents.spec.js`
**Also changes**: `game/e2e/unifiedDamage.spec.js`, `game/e2e/uiRedesign.spec.js`
**Read first**: `talents.spec.js:66-230`, `unifiedDamage.spec.js:181-215`, `uiRedesign.spec.js:606-612`, `:1555-1566`, `:1743-1778`, `:1875-1892`
**Depends on**: T17
**Requirement**: TTR-04, TTR-21, TTR-25

**Contract** (every asserted value of today stays unless written here):

- `talents.spec.js`:
  - `buying a level ...`: `.talent-branch-title` texts become `[ 'Caça aos chefes', 'Quebra de defesa', 'Poder do clique', 'Combo' ]`; click `talent-CLICK_DAMAGE` before reading `talent-effect-CLICK_DAMAGE`.
  - `every button is disabled with 0 points ...`: click `talent-CLICK_DAMAGE`, assert its button disabled; click `talent-COMBO`, assert its button disabled.
  - `a talent already at level 10 ...`, `a first miniboss clear pays 2 points ...`, `grade 2 opens at level 10 ...`, `Reiniciar pontos takes every level back ...`: click the node of the talent the test reads (`talent-CLICK_DAMAGE`, `talent-COMBO`, `talent-CLICK_DAMAGE_G2` for its lock then `talent-COMBO_G2`) before each card read; the reset test clicks `talent-COMBO` once (the selection stays across both upgrades and the reset).
- `unifiedDamage.spec.js`:
  - `upgrading PHYSICAL_BREAK from 5 to 6 ...` (`:186`): click `talent-PHYSICAL_BREAK` before `talent-upgrade-PHYSICAL_BREAK`.
  - `the Talentos screen has one Quebra de defesa per grade and no magical break` → title `the Talentos screen has one Quebra de defesa and one Perfuração de armadura per grade and no magical break`: `page.locator('.talent-node[data-branch="BREAK"]')` `title` attributes, in order, `Quebra de defesa`, `Perfuração de armadura`, `Quebra de defesa (Grau 2)`, `Perfuração de armadura (Grau 2)`, `Quebra de defesa (Grau 3)`, `Perfuração de armadura (Grau 3)`; the three `MAGICAL_BREAK` counts 0 stay; add `talent-CRIT_RESIST_BREAK` count 0.
- `uiRedesign.spec.js` (the Talentos parts of UIR-14 move to the detail card; the asserted colours stay):
  - Contrast row 13 (`:609-611`): click `talent-CLICK_DAMAGE`; `check(page.getByTestId('talent-effect-CLICK_DAMAGE'), page.getByTestId('talent-detail'), 'rgb(87, 75, 62)', 'rgb(244, 230, 200)')`.
  - `draws every inner card on the inset recipe` (`:1561-1563`): the Talentos lines become a click on `talent-CLICK_DAMAGE` and `expectStyle(page.getByTestId('talent-detail'), { 'background-color': 'rgb(244, 230, 200)' })` with the comment `Talentos: the detail card is light parchment since talent-tree-rework, not inset`.
  - `draws talent cards on light parchment` → title `draws the talent detail card on light parchment`: click `talent-CLICK_DAMAGE`; `talent-detail` `background-color` `rgb(244, 230, 200)`.
  - `draws the talent buttons, titles and max marks in the dark branch ink` → title `draws the talent card buttons and max mark in the dark branch ink`: for TIME `MINIBOSS_TIME`, BREAK `PHYSICAL_BREAK`, POWER `CRIT_CHANCE`, COMBO `COMBO`, click the node, the card button `talent-upgrade-<ID>` is enabled with `background-color` = the ink and `color` `rgb(244, 230, 200)`, ratio 5.9 to 6.02, and `ratio(ink, 'rgb(244, 230, 200)') >= 4.82`; the banner title and column background checks go (the banner has no ink since talent-tree-rework); click `talent-CLICK_DAMAGE`: `talent-max-CLICK_DAMAGE` `color` = POWER ink; click `talent-CRIT_CHANCE`: `talent-detail` `box-shadow` contains `rgb(201, 154, 31) 4px 0px 0px 0px inset`.
  - `writes Nível máximo of TIME, BREAK and COMBO in their dark ink`: for each branch click the maxed node, `talent-max-<ID>` `Nível máximo` with the ink; the background read becomes `talent-detail` `rgb(244, 230, 200)`; ratio >= 4.82.

**Steps**:

1. Change `talents.spec.js`.
2. Change the two `unifiedDamage.spec.js` tests.
3. Change the five `uiRedesign.spec.js` places.
4. Run the gate.

**Tests**: e2e
**Gate**: `cd game && npx playwright test e2e/talents.spec.js e2e/unifiedDamage.spec.js e2e/uiRedesign.spec.js`
**Done when**:

- [ ] The three files pass; `grep -nE "talent-card|talent-column|talent-grade-" game/e2e/*.spec.js` prints nothing.

**Commit**: `test(game): read the Talentos tree in the existing e2e`

---

#### T20: e2e of the painted tree [ ]

**Owner**: test-engineer
**Goal**: Every player-visible rule of the tree runs in the browser (TTR-04, TTR-17 to TTR-25).
**Where**: `game/e2e/talentTreeRework.spec.js` (new)
**Read first**: `game/e2e/talents.spec.js:1-31` (`startGame`), `game/e2e/heroBagCards.spec.js` (a phone viewport test), `game/e2e/bossMap.spec.js` (routing an asset as missing or present, L-051), spec P2 Tree and P2 Fúria AC 8, AC 9
**Depends on**: T17
**Requirement**: TTR-04, TTR-17, TTR-18, TTR-19, TTR-20, TTR-21, TTR-22, TTR-23, TTR-24, TTR-25

**Contract**: Desktop scenarios run at the default 1280 x 720; every test routes `**/assets/talent-*` explicitly (404 for "missing", a valid 1 x 1 PNG or JPG body for "present"), so local art never changes the result (L-051). Values are read with `toHaveText`, `toHaveAttribute`, `toHaveCSS` and `evaluate((node) => node.offsetWidth)`.

**Steps**:

1. Write the helpers (`startGame` with talents and points, `openTalents`, `artMissing(page)`, `artPresent(page)`).
2. Write the scenarios below, one `test` each.
3. Run the gate.

**Tests**: e2e
**Test cases** (`talentTreeRework.spec.js`):

- `opens a 1024 x 576 window with the tree, the plaques and the empty card` (art missing): `.hero-window` offsetWidth 1024 and offsetHeight 576; `talent-title` `Talentos`, 192 x 64; `talent-points` `Pontos de talento: 0`, `left` `12px`, `bottom` `12px`; `talent-reset` `Reiniciar pontos`, disabled, `right` `12px`, `bottom` `12px`; `talent-detail` 380 wide; `talent-detail-empty` `Escolha um talento na árvore para ver os detalhes.`; `hero-close` visible.
- `draws 28 nodes at their map coordinates, Fúria crescente bigger`: 28 `.talent-node`; `talent-CLICK_DAMAGE` offsetWidth 60; `talent-COMBO_FURY` offsetWidth 88; the centre of `talent-CLICK_DAMAGE` relative to `talent-tree` is (563, 265) within 1 px (55 % x 1024, 46 % x 576).
- `captions grade 1 nodes and badges grades 2 and 3`: `talent-caption-BOSS_DAMAGE` `Dano contra chefes`; `talent-caption-ARMOR_PIERCE` `Perfuração de armadura`; `talent-caption-COMBO_FURY` `Fúria crescente`; `talent-node-grade-BOSS_DAMAGE_G2` `II`; `talent-node-grade-BOSS_DAMAGE_G3` `III`; caption `font-size` `12px`, badge `font-size` `11px`.
- `marks a locked node grey with the lock` (art missing): `talent-CLICK_DAMAGE_G2` `data-state` `locked`; its `.talent-node-icon` `filter` `grayscale(1) brightness(0.55)`; its `.talent-node-lock` visible.
- `marks a maxed node with the gold ring`: talents `{ CLICK_DAMAGE: 10 }`, art present: `data-state` `maxed`, `box-shadow` `rgb(224, 180, 90) 0px 0px 0px 3px`; chip `10/10` with `color` `rgb(224, 180, 90)`.
- `marks an available node with the branch glow and an open one without it`: talent points 1, art present: `talent-CRIT_CHANCE` `available` with `box-shadow` containing `rgb(201, 154, 31) 0px 0px 0px 3px`; talents `{ CLICK_DAMAGE: 10 }` and 1 point: `talent-CLICK_DAMAGE_G2` `open` with `box-shadow` `none`.
- `selecting a node sends no request and outlines it`: count `POST **/talents/**` requests (0 after the click); `aria-pressed` `true`; `outline-style` `solid`, `outline-width` `3px`, `outline-color` `rgb(244, 230, 200)`; card name `Dano de clique (%)`.
- `buying a level keeps the node selected and updates the card, the chip, the medallion and the veins`: points 1, select `CLICK_DAMAGE`, click `Melhorar (1 ponto)`: `talent-level-CLICK_DAMAGE` `Nível 1/10`, `talent-effect-CLICK_DAMAGE` `Efeito: +5%`, `talent-node-level-CLICK_DAMAGE` `1/10`, `talent-points` `Pontos de talento: 0`, `talent-lit-POWER` `opacity` `0.21`, the button disabled, the node `aria-pressed` `true`.
- `shows the lock text of a grade and of Fúria crescente with no button`: `talent-locked-CLICK_DAMAGE_G2` `Bloqueado: chegue ao nível 10 do Grau 1`; `talent-locked-COMBO_FURY` `Bloqueado: chegue ao nível 10 de Limite de dano do combo`; no `talent-upgrade-COMBO_FURY`.
- `Fúria crescente opens at COMBO 10, costs 2 points and reads +2% por clique`: talents `{ COMBO: 10 }`, points 2: select `COMBO_FURY`: `Nível 0/4`, `Efeito: nenhum`, `Melhorar (2 pontos)`; buy: `Nível 1/4`, `Efeito: +2% por clique`, `Pontos de talento: 0`.
- `Fúria crescente at level 4 reads +5% por clique and Nível máximo`: talents `{ COMBO: 10, COMBO_FURY: 4 }`.
- `opening the screen again clears the selection`: select, `hero-close`, open: `talent-detail-empty` visible; no node `aria-pressed` `true`.
- `the banners read the branch titles in the branch ink at 140 x 34`: `.talent-branch-title` texts `Caça aos chefes`, `Quebra de defesa`, `Poder do clique`, `Combo`; `talent-branch-TIME` offsetWidth 140 and offsetHeight 34; the `TIME` title `color` `rgb(36, 93, 100)`, the `POWER` title `rgb(108, 83, 17)`.
- `the lit veins follow the levels: 0, 0.27, 0.44 and 1`: talents `MINIBOSS_TIME 5`, `COMBO 10` and the 12 POWER talents at 10: `talent-lit-BREAK` `opacity` `0`, `TIME` `0.27`, `COMBO` `0.44`, `POWER` `1`.
- `with every art file missing the tree draws its fallbacks and still sells a level` (art missing, points 1): `talent-tree` has class `is-fallback`; `talent-tree-veins` visible; `talent-CLICK_DAMAGE` has class `no-frame` and `box-shadow` containing `rgb(201, 154, 31) 0px 0px 0px 4px inset`; a `.icon-fallback` inside `talent-CLICK_DAMAGE`; `talent-branch-TIME` `background-color` `rgb(244, 230, 200)` and `border-top-color` `rgb(90, 61, 38)`; no `.talent-round-art` in `talent-points` and its `.talent-pill` `background-color` `rgba(28, 18, 12, 0.85)`; no `.hero-close-art`, `hero-close` text `Fechar` visible; buying `CLICK_DAMAGE` still shows `Nível 1/10`.
- `with every art file present the tree draws the art`: `talent-tree` has no `is-fallback` and `talent-tree-veins` hidden; no node has `no-frame`; `.talent-node-frame` count 28; `.hero-close-art` visible; `hero-close` offsetWidth 120 and offsetHeight 40, its text `Fechar` visible; `talent-points` `.talent-round-art` 56 x 56.
- `on a 390 x 844 phone the tree is zoomed twice, opens centred and keeps the scroll`: `page.setViewportSize({ width: 390, height: 844 })` before the login; `talent-tree` `zoom` `2`; `talent-tree-scroll` `scrollWidth` 2048, `scrollLeft` 512, `scrollTop` 288; set `scrollLeft` 200, click a node in view: `scrollLeft` 200; `talent-points` offsetLeft 12; `talent-detail` offsetWidth 380.
- `on the desktop the tree is not zoomed and does not scroll`: `zoom` `1`; `scrollWidth` equals `clientWidth` equals 1024.
- `a talent list of an older backend draws its nodes and no error`: `page.route('**/talents', ...)` answers the old 27-talent list (with `BOSS_TIME`, `CRIT_RESIST_BREAK` and no `COMBO_FURY`); no `pageerror`; `.talent-node` count 21; `talent-BOSS_TIME`, `talent-CRIT_RESIST_BREAK`, `talent-BOSS_DAMAGE`, `talent-COMBO_FURY` count 0.
- `says Pontos de talento insuficientes when the backend refuses for points` (route the upgrade to 409 `NOT_ENOUGH_TALENT_POINTS`): `.hero-error` `Pontos de talento insuficientes`, visible over the tree.
- `says Não foi possível melhorar o talento. and reads the tree again after another 409` (route 409 `TALENT_LEVEL_MISMATCH`): the text, and one more `GET /talents` after it.
- `says Não foi possível reiniciar os talentos. when the reset fails` (route the reset to 500).
- `says Talentos indisponíveis when the tree cannot load` (route `GET /talents` to 500): `talents-unavailable` visible.

**Gate**: `cd game && npx playwright test e2e/talentTreeRework.spec.js`
**Done when**:

- [ ] The 23 scenarios pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover the painted talent tree in the browser`

---

#### T21: e2e of the reworked combat [ ]

**Owner**: test-engineer
**Goal**: Boss damage, the critical rule, armor pierce, the chip, Fúria crescente and the attribute panel run in the browser (TTR-02, TTR-03, TTR-04, TTR-08, TTR-09, TTR-12, TTR-13, TTR-16).
**Where**: `game/e2e/talentTreeReworkCombat.spec.js` (new)
**Read first**: `game/e2e/talents.spec.js:1-64` (definition, `startGame`, `dealt`, `hitMonster` loop at `:148-166`), `game/e2e/heroTeamPassives.spec.js:1-70` (`monsterOf`, `startTeam`, `strike`, `dealt`), `game/e2e/equipmentUi.spec.js` (pieces fixture, attribute panel), spec P1 Boss, P1 Critical, P1 Retired, P2 Fúria AC 6, AC 7
**Depends on**: T17
**Requirement**: TTR-02, TTR-03, TTR-04, TTR-08, TTR-09, TTR-12, TTR-13, TTR-16

**Contract**: every number is read as the change of the monster's health (L-091); monsters are FIRE with the defense and critical resistance the case names; the roll is fixed through `openMainMenu(page, { random })` (0.99 when the case names none).

**Steps**:

1. Write the chapter fixture (phase monster, miniboss, chapter boss with the stats of each case) and the helpers.
2. Write the scenarios below.
3. Run the gate.

**Tests**: e2e
**Test cases** (`talentTreeReworkCombat.spec.js`):

- `BOSS_DAMAGE 10 and BOSS_DAMAGE_G2 5 add 40 % to a click on the chapter boss: 1.4`: blank Kael at the chapter boss (defense 0).
- `the same talents leave a click on a phase monster at 1`.
- `a worn ring of BOSS_DAMAGE_PCT 28 makes the boss click 1.68`.
- `a skill hit on the chapter boss gets the boss damage: Corte Dimensional of a 1-star Kael deals 19.8 with BOSS_DAMAGE 10` (16.5 x 1.2; skill key `ONE`).
- `the chapter boss timer ignores a BOSS_TIME of an older backend: Time: 60` (`page.route('**/talents')` adds `{ id: 'BOSS_TIME', baseId: 'BOSS_TIME', grade: 1, branch: 'TIME', level: 10, value: 30, ... }`; stage limit 60 000 ms): `.boss-timer` `Time: 60`.
- `a 3-star Kael reads Seu crítico: 10% against resistance 30; a roll of 0.09 crits (3.5) and 0.10 does not (1.4)`: two logins (rolls 0.09 and 0.10).
- `a 9-star Kael with the three CRIT_CHANCE grades at 10 reads Seu crítico: 100% against 10 and deals 13.44` (`C` 130, base 3.2, multiplier 4 + 0.2).
- `the chip follows a talent upgrade: 10% then 11% after a CRIT_CHANCE level` (blank Kael, resistance 0, 1 point).
- `the chip follows a leader change: 10% for a blank Kael, 40% for a 3-star Lyra` (Líder screen).
- `ARMOR_PIERCE 10 makes a click on defense 50 deal 0.55`.
- `a CRIT_RESIST_BREAK of an older backend lowers nothing: Seu crítico: 0% against resistance 20` (route adds `CRIT_RESIST_BREAK` value 20; blank Kael).
- `COMBO 10 and Fúria crescente 4: 3 clicks read Combo x3 · +15% and 11 clicks deal 13.75` (the `scene.hitMonster({ x: 0, y: 0 })` loop of `talents.spec.js:155-163`; 11 + 2.75).
- `without Fúria crescente 11 clicks under COMBO 10 deal 11.55` (11 + 0.55).
- `the attribute panel reads Dano em chefes: 20%, Perfuração de armadura: 10%, Tempo extra de chefe: 0s and Quebra de resistência a crítico: 0` (blank Kael, `BOSS_DAMAGE 10`, `ARMOR_PIERCE 10`, no pieces; `stat-bossDamage`, `stat-armorPierce`, `stat-bossTime`, `stat-breakCrit`).
- `the attribute panel reads Chance de crítico: 120% for a 3-star Lyra wearing a CRIT_CHANCE 80 ring` (`stat-critChance`).

**Gate**: `cd game && npx playwright test e2e/talentTreeReworkCombat.spec.js`
**Done when**:

- [ ] The 15 scenarios pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover boss damage, the critical rule and Fúria crescente in the browser`

---

#### T22: Author check of the feature [ ]

**Owner**: test-engineer
**Goal**: The feature's test gate (`.claude/agents/test-engineer.md` § Author check): every AC value pinned, mutants killed (TTR-01 to TTR-25).
**Where**: `.specs/features/talent-tree-rework/tasks.md` (this file: the AC table below T22 and the ticks)
**Also changes**: test files only, when a gap or a survivor needs a test
**Read first**: `.claude/agents/test-engineer.md` § Author check, `scripts/sensor.mjs:1-25` (mutants format)
**Depends on**: T18, T19, T20, T21
**Requirement**: TTR-01 to TTR-25

**Steps**:

1. Write the AC to assertion table (spec AC, test `file:line`, exact value) under this task.
2. Run `cd backend && ./gradlew test` and `cd game && npm test` once each (never at the same time).
3. Run these mutants with `node scripts/sensor.mjs <scratchpad>/mutants.json` from the repo root, each with the narrowest command:
   - M1 `game/src/domain/combat/damage.js`: `Math.max(0, critChance - critResistance)` → `Math.max(0, critChance * (1 - critResistance / 100))` (`npx vitest run src/domain/combat/damage.test.js`, cwd `game`).
   - M2 `damage.js`: `+ critOverflow(attacker.critChance, resistance) / 100` → `+ 0`.
   - M3 `damage.js`: the critical factor ignores the overflow when forced: `critical ? attacker.critMultiplier + critOverflow(...)` → `critical ? attacker.critMultiplier + (forceCritical ? 0 : critOverflow(...))`.
   - M4 `game/src/domain/equipment/equipment.js`: `critChance: base.critChance + sumOf(pieces, 'CRIT_CHANCE') + critChance` → `critChance: Math.min(100, base.critChance + sumOf(pieces, 'CRIT_CHANCE') + critChance)` (`equipment.test.js`).
   - M5 `game/src/domain/skills/skillDamage.js`: put `Math.min(100, ...)` back on the Fumaça line (`skillDamage.test.js`).
   - M6 `game/src/domain/talents/talents.js`: `talentComboStep` returns `COMBO_STEP_PERCENT` (`talents.test.js`).
   - M7 `talents.js`: `bossDamage: talentValue(talents, 'BOSS_DAMAGE')` → `bossDamage: 0` (`talents.test.js`, `leaderAttacker.test.js`).
   - M8 `talents.js`: `0.2 + 0.8 * levels / max` → `0.8 * levels / max` (`talents.test.js`).
   - M9 `game/src/adapters/phaser/ClickerGame.js`: `effectiveCritChance(this.leaderAttacker().critChance, stats.critResistance ?? 0)` → `this.leaderAttacker().critChance` (`npx vitest run src/adapters/phaser/ClickerGame.test.js`).
   - M10 `ClickerGame.js`: delete `this.equipment.onChange(() => this.refreshEnemyStats());`.
   - M11 `game/src/adapters/phaser/HeroUi.js`: delete `this.talentSelected = null;` in `show` (`HeroUi.test.js`).
   - M12 `game/src/adapters/phaser/views/talentsView.js`: `points.available >= t.nextCost` → `points.available > t.nextCost` in the `data-state` rule (`talentsView.test.js`).
   - M13 `game/public/style.css`: `.talent-tree { zoom: 2; }` → `.talent-tree { zoom: 1; }` inside the 640 px media block (`npx playwright test e2e/talentTreeRework.spec.js`).
   - M14 `B/domain/Talents.kt`: `costFactor = 2` of `COMBO_FURY` removed (`./gradlew test --tests 'TalentsTest'`, cwd `backend`).
   - M15 `Talents.kt`: `unlocked` reads `definition.previousGradeId` instead of `definition.prerequisiteId`.
   - M16 `backend/src/main/resources/db/migration/V15__talent_tree_rework.sql`: drop `'CRIT_RESIST_BREAK_G3'` from the list (`--tests 'TalentTreeReworkMigrationIT'`).
4. Every survivor gets a test; rerun until 0 survive.

**Tests**: unit, integration and e2e (the gate of the feature)
**Gate**: `node scripts/sensor.mjs <scratchpad>/mutants.json` exits 0
**Done when**:

- [ ] Every AC of the spec has a row with `file:line` and the spec value; 0 gaps.
- [ ] 16 of 16 mutants killed; `git status --porcelain` is as before the run.

**Commit**: `test(game): record the talent tree rework author check`

---

### Phase 7: UI review

#### T23: UI review of the tree and the enemy line [ ]

**Owner**: ui-artist
**Goal**: The player-visible changes match the spec and the Grove theme (AD-022) with the art missing, which is how the feature ships (TTR-09, TTR-18 to TTR-24).
**Where**: `.specs/features/talent-tree-rework/ui-review.html` (new, from the ui-review template named under Read first)
**Also changes**: `game/ui-review/talentTreeRework.shots.js` (new), `.specs/features/talent-tree-rework/ui-review/*.png`
**Read first**: `game/ui-review/blackAwarenessStaff.shots.js` (shots pattern), `.claude/templates/ui-review.html`, spec P2 Tree, design § Layout map
**Depends on**: T22
**Requirement**: TTR-09, TTR-18, TTR-19, TTR-20, TTR-21, TTR-22, TTR-23, TTR-24

**What to check** (desktop 1280 x 720 and phone 390 x 844; every `talent-*` asset routed as missing, plus one desktop shot with placeholder art routed present):

1. The fallback tree: the gradient board, the dashed veins from the trunk fork to every chain, 28 ringed nodes with glyphs, no node, caption, chip or badge overlapping another, the four parchment banners clear of the title plaque and of the grade 3 nodes.
2. Node states side by side: locked (grey, lock), open, available (glow), maxed (gold ring), selected (light outline); each tells apart from the others at a glance.
3. The detail card for an open talent, a locked grade, Fúria crescente locked, Fúria crescente at level 4, a maxed talent, and empty; the text fits 380 px on the parchment, the button reads in the branch ink.
4. The lit veins at 0, about 0.27, 0.44 and 1 (the branch colour glow of the fallback).
5. The medallion and the reset button (round art plus text pill) and the close button: aligned bottom left, bottom right and top right; `Fechar` readable with and without its art.
6. Phone: the zoomed tree opened centred; the fixed plaques and the card over it; captions readable (measure the on-screen size of the 12 px caption; TD-010 stays the owner's).
7. The battle enemy line: `Seu crítico: <n>%` in the third chip with the red target icon, one line, no clipping, next to `Defesa <n>%`, on the miniboss and on a fight with adds.

**Tests**: none (review artifact; the e2e of T20 and T21 pin the values)
**Gate**: `cd game && npm run ui:shots -- talentTreeRework`
**Done when**:

- [ ] `ui-review.html` has a verdict (APROVADO or REPROVADO) and every finding is listed for the product owner to turn into tasks.

**Commit**: `docs(ui): review the painted talent tree`

---

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 domain file (catalog + prerequisite) | ✅ Granular |
| T2 | 2 response fields | ✅ Granular |
| T3 | 1 migration (+ its IT and ADR) | ⚠️ Cohesive (the IT and the ADR exist only for the migration) |
| T4 | 2 functions + 2 lines in one file | ✅ Granular |
| T5 | 1 function | ✅ Granular |
| T6 | 1 line | ✅ Granular |
| T7 | 5 functions in one file | ⚠️ Cohesive (same file, the talent effects) |
| T8 | 1 constructor + 1 getter | ✅ Granular |
| T9 | 3 constants + 3 functions in one file | ⚠️ Cohesive (same file, the display helpers) |
| T10 | 1 constant | ✅ Granular |
| T11 | 2 lines | ✅ Granular |
| T12 | 3 small changes in one scene | ⚠️ Cohesive (all read `talents` in the scene) |
| T13 | 1 new data file | ✅ Granular |
| T14 | 1 view | ✅ Granular |
| T15 | 1 stylesheet block | ✅ Granular |
| T16 | 1 panel screen mode | ✅ Granular |
| T17 | 1 test support file | ✅ Granular |
| T18 | 1 text in 7 spec files | ⚠️ Cohesive (one rule, one table) |
| T19 | 1 interaction in 3 spec files | ⚠️ Cohesive (one rule: click the node first) |
| T20 | 1 spec file | ✅ Granular |
| T21 | 1 spec file | ✅ Granular |
| T22 | author check | ✅ Granular |
| T23 | 1 review | ✅ Granular |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | (none) | ✅ Match |
| T2 | T1 (Phase 1) | (none in phase) | ✅ Match |
| T3 | T1 (Phase 1) | (none in phase) | ✅ Match |
| T4 | None | (none) | ✅ Match |
| T5 | None | (none) | ✅ Match |
| T6 | T4 | T4 → T6 | ✅ Match |
| T7 | T5 | T5 → T7 | ✅ Match |
| T8 | None | (none) | ✅ Match |
| T9 | T7 (Phase 3) | (none in phase) | ✅ Match |
| T10 | None | (none) | ✅ Match |
| T11 | T7 (Phase 3) | (none in phase) | ✅ Match |
| T12 | T4, T7, T8 (Phase 3) | (none in phase) | ✅ Match |
| T13 | None | (none) | ✅ Match |
| T14 | T13, T9 (Phase 4) | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T14 | T14 → T16 | ✅ Match |
| T17 | None | (none) | ✅ Match |
| T18 | None | (none) | ✅ Match |
| T19 | T17 | T17 → T19 | ✅ Match |
| T20 | T17 | T17 → T20 | ✅ Match |
| T21 | T17 | T17 → T21 | ✅ Match |
| T22 | T18, T19, T20, T21 | T18, T19, T20, T21 → T22 | ✅ Match |
| T23 | T22 (Phase 6) | (none in phase) | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend web | integration | integration | ✅ OK |
| T3 | Migration | integration | integration | ✅ OK |
| T4 | Game domain | unit | unit | ✅ OK |
| T5 | Game domain | unit | unit | ✅ OK |
| T6 | Game domain | unit | unit | ✅ OK |
| T7 | Game domain | unit | unit | ✅ OK |
| T8 | Game domain | unit | unit | ✅ OK |
| T9 | Game domain | unit | unit | ✅ OK |
| T10 | Game application | unit | unit | ✅ OK |
| T11 | Game domain | unit | unit | ✅ OK |
| T12 | Game scene | unit + e2e | unit (e2e in T18, T21 of the same feature, Phase 6) | ✅ OK (the scene's player-visible ACs run in T21 once the fake backend serves the catalog) |
| T13 | Game view data | unit | unit | ✅ OK |
| T14 | Game view | unit + e2e | unit (e2e in T20) | ✅ OK (same pattern as `black-awareness-staff` T16 and T20) |
| T15 | Stylesheet | e2e | e2e (T20) | ✅ OK (no jsdom layout for CSS) |
| T16 | Game panel | unit + e2e | unit (e2e in T19, T20) | ✅ OK |
| T17 | Fake backend | e2e | e2e | ✅ OK |
| T18 | e2e | e2e | e2e | ✅ OK |
| T19 | e2e | e2e | e2e | ✅ OK |
| T20 | e2e | e2e | e2e | ✅ OK |
| T21 | e2e | e2e | e2e | ✅ OK |
| T22 | author check | unit, integration, e2e | all | ✅ OK |
| T23 | UI review artifact | none | none | ✅ OK |
