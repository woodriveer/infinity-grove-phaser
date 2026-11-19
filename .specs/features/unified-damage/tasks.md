# Unified Damage Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/unified-damage/spec.md`
**Design**: `.specs/features/unified-damage/design.md`
**Status**: Approved by the owner on 2026-11-19 (Q1 points only, Q2 one damage everywhere). Refreshed against `main` at `8543fb5`; line numbers below were read that day.

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root. `<main>` is `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `<test>` is `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`.
- Line numbers drift once an earlier task edits a file: find each edit by the test name or the exact text quoted here, not by the number alone.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`. If a file you must change already has changes you did not make, STOP and report it.
- Mark the task `[x]` in this file in the same commit. Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- A test that pinned the physical/magical split is rewritten and renamed exactly as the task says (L-054). A test is removed only where the task names it. Never weaken or skip any other test.
- **If a test that the task does not name fails, STOP and report its file, name and failure. Do not edit it.** Known exception: from T5 to T10 the e2e scenarios that read `Physical def`, `Magical def` or the `physical` / `magical` chips fail; T11 rewrites them, and T5 to T10 gate on Vitest only.
- Decimal expectations use `toBeCloseTo(value, 9)` (Vitest) unless the task gives another precision; Kotlin uses exact integers here.
- Words used below: **old payload** = an enemy object with `physicalDefense` and `magicalDefense` and no `defense` (the backend before this feature); **new payload** = an enemy object with `defense`, `physicalDefense` and `magicalDefense`, all equal.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit for service/domain, e2e for every player-visible behaviour), `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), `game/ui-review.config.js` (shots at 1280x720 and 390x844). No coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`EnemyStats`, `ChapterDefinition`, `TalentCatalog`, `PlayerTalents`, `HeroSeed`) | unit | Every bound of `defense`; chapters 1 to 15 with the 80 cap; the 27-talent catalog; `fromStored` with and without retired ids; every new text | `<test>/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service (`TalentService`, `AccountResetService`) | unit | List, upgrade and reset with a stored retired row; upgrade of a retired id; account reset deletes a retired row | `<test>/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository, migration and web | integration (Testcontainers) | Defense read from `physical_defense`, written to both columns; progress and farm API fields; talent API 27 entries and 404; migration delete, refund, guarded texts, idempotency | `<test>/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain | unit | E1 to E19 of the spec; `defenseOf` for every payload shape; break on the one defense; every edge case of the spec | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game application (`talentCollection`) | unit | Retired ids dropped on load, upgrade and reset | `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game scene and views | unit (jsdom) | Every exact enemy line, chip `data-stat` and attribute line of the spec | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| e2e | e2e (Playwright, fake backend) | Every player-visible criterion: enemy chip, Prisão click, Bênção skill hit, one defense for skills, break on skills, Talentos column, attribute panel, Orina texts | `game/e2e/unifiedDamage.spec.js` + edited specs | `cd game && npx playwright test` |
| Docs (`README.md`, `PROMPTS_ASSETS_UI.md`) | none | Checked by the grep of T13 | - | build gate only |
| UI review | none | `ui-artist` review (T14) | `.specs/features/unified-damage/ui-review.html` | `cd game && npm run ui:shots -- unifiedDamage` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After game tasks with unit tests only | `cd game && npm test` |
| Full | After backend tasks and e2e tasks | backend: `cd backend && ./gradlew ktlintCheck test`; game: `cd game && npm test && npx playwright test` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every commit is safe to deploy alone (design, Deploy Order and Compatibility), so no task waits for a deploy.

### Phase 1: Backend

```
T1 → T2 → T3
```

### Phase 2: Game combat domain

```
T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 3: Game screens

```
T8 → T9 → T10
```

### Phase 4: e2e

```
T10 → T11 → T12
```

### Phase 5: Docs

```
T12 → T13
```

### Phase 6: Visual review

```
T13 → T14
```

---

## Task Breakdown

### T1: Give each enemy one defense in the backend [ ]

**Owner**: kotlin-backend-dev
**Goal**: Replace the two defenses of `EnemyStats` by one `defense`, read it from `physical_defense`, write it to both columns and answer it in the progress and farm APIs next to the two old fields (UDMG-05).
**Where**: `<main>/domain/Chapter.kt`
**Also changes**: `<main>/adapter/repository/ChapterEntities.kt`, `<main>/adapter/repository/EnemyRepository.kt`, `<main>/adapter/web/ProgressController.kt`, `<test>/domain/EnemyStatsTest.kt`, `<test>/domain/ChapterTest.kt`, `<test>/adapter/repository/ChapterRepositoryIT.kt`, `<test>/adapter/repository/EnemyRepositoryIT.kt`, `<test>/adapter/web/ProgressControllerIT.kt`, `<test>/adapter/web/FarmControllerIT.kt`
**Read first**: `Chapter.kt:1-25, 136-191`, `ChapterEntities.kt:16-42`, `EnemyRepository.kt` (whole file), `ProgressController.kt:24-39`, `FarmController.kt:30-46`, `EnemyStatsTest.kt` (whole file), `ChapterTest.kt:115-216, 305-410`, `ChapterRepositoryIT.kt:30-60, 148-217`, `EnemyRepositoryIT.kt:13-64`, `ProgressControllerIT.kt:111-132, 210-229`, `FarmControllerIT.kt:286-304`, design section "Backend `EnemyStats`"
**Depends on**: None
**Requirement**: UDMG-05

**Contract**:

```kotlin
// Chapter.kt
/** What the player's damage meets in one encounter: its element, its one defense and its resistance to critical hits (percent). */
data class EnemyStats(
    val element: Element,
    val defense: Int,
    val critResistance: Int,
) {
    init {
        require(defense in 0..MAX_DEFENSE) { "defense $defense must be between 0 and $MAX_DEFENSE" }
        require(critResistance in 0..MAX_CRIT_RESISTANCE) { "crit-resistance $critResistance must be between 0 and $MAX_CRIT_RESISTANCE" }
    }

    companion object {
        const val MAX_DEFENSE = 90
        const val MAX_CRIT_RESISTANCE = 100

        /** What a row created before enemy attributes existed means. */
        val DEFAULT = EnemyStats(Element.FIRE, 0, 0)
    }
}

// ChapterEntities.kt:40-41 (the entity keeps both columns; magicalDefense is no longer read)
/** An element name outside the five fails the load instead of dealing a wrong multiplier. The one defense is `physical_defense` (TD-002). */
fun toDomain() = EnemyStats(Element.valueOf(element), physicalDefense, critResistance)

// EnemyRepository.idOf: the defense goes to both columns (the native SQL and the finder do not change)
jpaEnemyRepository.insertIfAbsent(element, stats.defense, stats.defense, stats.critResistance)
val row =
    jpaEnemyRepository.findByElementAndPhysicalDefenseAndMagicalDefenseAndCritResistance(
        element,
        stats.defense,
        stats.defense,
        stats.critResistance,
    )

// ProgressController.kt
/** One enemy of the progress and farm payloads. [physicalDefense] and [magicalDefense] repeat [defense] for the game of before unified-damage (TD-002). */
data class EnemyStatsResponse(
    val element: String,
    val defense: Int,
    val physicalDefense: Int,
    val magicalDefense: Int,
    val critResistance: Int,
) {
    companion object {
        fun from(stats: EnemyStats) =
            EnemyStatsResponse(
                element = stats.element.name,
                defense = stats.defense,
                physicalDefense = stats.defense,
                magicalDefense = stats.defense,
                critResistance = stats.critResistance,
            )
    }
}
```

JSON of one enemy in `GET /progress` and `GET /farm`: `{ "element": "DARKNESS", "defense": 30, "physicalDefense": 30, "magicalDefense": 30, "critResistance": 30 }`. No migration: the `enemies` table does not change. `FarmController` reuses `ChapterResponse`, so it needs no edit.

**Steps**:

1. Replace `EnemyStats` (`Chapter.kt:5-25`) with the contract above.
2. In `ChapterDefinition.of` (`Chapter.kt:176-188`): `monster = EnemyStats(element, 0, 0)`; `miniboss = EnemyStats(element, defense, critResistance)`; the boss loses its second `minOf(BOSS_DEFENSE + defenseBonus, MAX_SEEDED_DEFENSE),` line, so it reads `EnemyStats(Element.entries[(number + 3) % Element.entries.size], minOf(BOSS_DEFENSE + defenseBonus, MAX_SEEDED_DEFENSE), minOf(BOSS_CRIT_RESISTANCE + defenseBonus, MAX_SEEDED_CRIT_RESISTANCE))`. No constant and no number changes (the caps 80 and 70 stay).
3. Change `EnemyEntity.toDomain()` and its KDoc as in the contract.
4. Change `EnemyRepository.idOf` as in the contract.
5. Replace `EnemyStatsResponse` as in the contract.
6. Make the test edits below.

**Tests**: unit + integration
**Test cases**:

- `EnemyStatsTest`: the helper becomes `private fun stats(defense: Int = 0, crit: Int = 0) = EnemyStats(Element.WATER, defense, crit)`.
  - `accepts the ends of the ranges`: `assertEquals(90, stats(defense = 90, crit = 100).defense)`, `assertEquals(0, stats(defense = 0).defense)`, `assertEquals(0, stats().critResistance)`.
  - `rejects a physical defense above 90` is renamed `rejects a defense above 90`: `stats(defense = 91)` throws `IllegalArgumentException`.
  - `rejects a magical defense above 90` is **removed** (the field no longer exists, UDMG-05 AC 1); name it in the commit body.
  - `rejects a negative defense`: only `stats(defense = -1)` throws (the `magical = -1` line goes).
  - `rejects a critical resistance outside 0 to 100`: unchanged (`crit = 101`, `crit = -1`).
  - `the default is fire with no defense and no resistance`: `assertEquals(EnemyStats(Element.FIRE, 0, 0), EnemyStats.DEFAULT)`.
  - `the seeded miniboss shares the element of its stage and gets 10 plus the stage as defense`: `assertEquals((11..20).toList(), stages.map { it.miniboss.defense })`; the `magicalDefense` line goes; the `critResistance` line stays.
  - `the seeded phase monsters have no defense and no resistance`: `assertEquals(Pair(0, 0), Pair(it.monster.defense, it.monster.critResistance))`.
  - `the seeded chapter boss is darkness with defense 30 and resistance 30`: `assertEquals(EnemyStats(Element.DARKNESS, 30, 30), ChapterDefinition.first().boss)`.
- `ChapterTest` (find each line by its text; names do not change):
  - `chapter 1 is the first chapter and later chapters have more health and defense`: `chapter.boss.physicalDefense > before.boss.physicalDefense` → `chapter.boss.defense > before.boss.defense`.
  - `chapter 10 follows the chapter table`: `assertEquals(65, chapter.boss.defense)` and `assertEquals(55, miniboss.defense)`; delete the two `magicalDefense` lines.
  - `chapter 12 caps the boss critical resistance at 70`: `assertEquals(71, boss.defense)`.
  - `chapter 15 follows the chapter table`: `assertEquals(80, chapter.boss.defense)` and `assertEquals(70, miniboss.defense)`; delete the `magicalDefense` line.
  - `chapters 6 to 15 keep phase monsters defenseless and the 30 and 60 second limits`: `assertEquals(0, stage.monster.defense, "chapter $c stage ${stage.number}")`; delete the `magicalDefense` line.
  - `chapters 1 to 5 keep their numbers`: `fifth.boss.physicalDefense` → `fifth.boss.defense` (50) and `fifth.stage(10).miniboss.physicalDefense` → `fifth.stage(10).miniboss.defense` (40).
  - `assertChapterTableRow`: `assertEquals(row.bossDefenses, chapter.boss.defense, "chapter $c boss defense")` and `assertEquals(row.minibossDefensesStage10, miniboss.defense, "chapter $c miniboss defense stage 10")`; delete the two `magicalDefense` lines.
  - `assertStageFormulas`: `assertEquals(minOf(10 + n + bonus, 80), stage.miniboss.defense, "$label miniboss defense")`; delete the `magicalDefense` line; the comment `// miniboss defenses min(10 + n + bonus, 80), ...` becomes `// miniboss defense min(10 + n + bonus, 80), ...`.
- `ChapterRepositoryIT`:
  - the `chapter()` helper: `monster = EnemyStats(Element.WATER, it, it + 2)`, `miniboss = EnemyStats(Element.LIGHT, 20 + it, 40 + it)`, `boss = EnemyStats(Element.DARKNESS, 55, 77)`.
  - `rows written by SQL read the enemies and drop rules they point at` is renamed `rows written by SQL read the enemies and drop rules they point at, with physical_defense as the defense`; the SQL inserts stay (85, 86, 87 and 88, 89, 90); expectations `EnemyStats(Element.NATURE, 85, 87)` (boss and miniboss) and `EnemyStats(Element.LIGHT, 88, 90)` (monster) (UDMG-05 AC 3).
  - new `a saved chapter writes each defense to both columns`: `repository.save(chapter())`, then `jdbc.queryForMap("select e.physical_defense, e.magical_defense from enemies e join chapters c on c.boss_enemy_id = e.id where c.number = ?", number)` has `physical_defense` 55 and `magical_defense` 55 (UDMG-05 AC 4).
  - `the 50 seeded stages share 5 phase monsters, one per element with no defense and no resistance`: unchanged (it reads the raw columns, both 0).
- `EnemyRepositoryIT`:
  - the comment above `stats` becomes `// the seeded enemies are shared with other integration tests; no seed reaches a defense of 81 (the chapter 15 boss has 80), so these rows are ours`; `private val stats = EnemyStats(Element.WATER, 81, 97)`.
  - `rowsWith(stats)` passes `stats.defense` for both `physical_defense = ?` and `magical_defense = ?`.
  - `stats differing in any one attribute return a new id`: the variants become `stats.copy(element = Element.FIRE)`, `stats.copy(defense = 83)`, `stats.copy(critResistance = 98)` (3 variants).
  - new `the defense is stored in both columns`: `val id = repository.idOf(stats)`; `jdbc.queryForMap("select physical_defense, magical_defense from enemies where id = ?", id)` has 81 and 81 (UDMG-05 AC 4).
- `ProgressControllerIT`:
  - `GET progress carries the enemy stats of the phase monster, the miniboss and the chapter boss`: add `.body("definition.boss.defense", equalTo(30))`, `.body("definition.stages[0].monster.defense", equalTo(0))` and `.body("definition.stages[0].miniboss.defense", equalTo(11))`; keep every existing `physicalDefense` and `magicalDefense` line (UDMG-05 AC 2).
  - `a progress stored as completed in chapter 5 opens chapter 6 on GET`: add `.body("definition.boss.defense", equalTo(53))` and `.body("definition.boss.magicalDefense", equalTo(53))`; keep the `physicalDefense` line.
- `FarmControllerIT` - `GET farm of an earlier chapter answers its eleven bosses and its definition`: add `.body("definition.boss.defense", equalTo(35))` and `.body("definition.boss.magicalDefense", equalTo(35))`; keep the `physicalDefense` line (UDMG-05 AC 2).

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] `grep -rn "magicalDefense\|physicalDefense" backend/src/main` lists only `ChapterEntities.kt` (the two entity columns and `toDomain`), `EnemyRepository.kt` (finder name and native SQL parameters) and `ProgressController.kt` (the two response fields and `from`).
- [ ] Every test case above passes and the whole backend suite passes.

**Commit**: `feat(backend): answer one defense per enemy`

---

### T2: Shrink the talent tree to 9 talents per grade and load stored levels tolerantly [ ]

**Owner**: kotlin-backend-dev
**Goal**: Remove `MAGICAL_BREAK` from the catalog, label `PHYSICAL_BREAK` `Quebra de defesa`, and make the backend ignore stored rows whose id is not in the catalog (UDMG-07).
**Where**: `<main>/domain/Talents.kt`
**Also changes**: `<main>/service/TalentService.kt`, `<test>/domain/TalentsTest.kt`, `<test>/service/TalentServiceTest.kt`, `<test>/service/AccountResetServiceTest.kt`, `<test>/adapter/web/TalentControllerIT.kt`
**Read first**: `Talents.kt` (whole file), `TalentService.kt` (whole file), `TalentsTest.kt:1-75, 148-156, 243-250`, `TalentServiceTest.kt:1-60, 149-175`, `AccountResetServiceTest.kt:20-77`, `TalentControllerIT.kt:22-250`, `<test>/Fakes.kt:250-280` (`InMemoryTalentRepository`)
**Depends on**: T1
**Requirement**: UDMG-07

**Contract**:

```kotlin
// TalentCatalog KDoc (Talents.kt:60-63)
/**
 * The 9 talents of the four branches (Tempo, Quebra de defesa, Poder do clique and Combo, the cap of the combo bonus) in 3 grades each:
 * the 9 of grade 1, then the 9 of grade 2, then the 9 of grade 3. The magical defense break left the tree with unified-damage (AD-021).
 */
private val grade1 =
    listOf(
        TalentDefinition("MINIBOSS_TIME", TalentBranch.TIME, "Tempo do miniboss", "s", 2),
        TalentDefinition("BOSS_TIME", TalentBranch.TIME, "Tempo do chefe do capítulo", "s", 3),
        TalentDefinition("PHYSICAL_BREAK", TalentBranch.BREAK, "Quebra de defesa", "points", 1),
        TalentDefinition("CRIT_RESIST_BREAK", TalentBranch.BREAK, "Quebra de resistência a crítico", "points", 1),
        TalentDefinition("CLICK_DAMAGE", TalentBranch.POWER, "Dano de clique (%)", "%", 5),
        TalentDefinition("CRIT_CHANCE", TalentBranch.POWER, "Chance de crítico", "points", 1),
        TalentDefinition("CRIT_DAMAGE", TalentBranch.POWER, "Dano crítico", "%", 5),
        TalentDefinition("COMBO", TalentBranch.COMBO, "Limite de dano do combo", "%", 5),
        TalentDefinition("CLICK_FLAT_DAMAGE", TalentBranch.POWER, "Dano direto de clique", "dmg", 2, firstLevel = 1),
    )

// PlayerTalents (Talents.kt:227-229): `private companion object` becomes `companion object`; the logger stays private
companion object {
    private val logger = LoggerFactory.getLogger(PlayerTalents::class.java)

    /**
     * The levels [stored] for [username] as the catalog knows them: a row whose id is not in the catalog (a MAGICAL_BREAK* row the
     * previous backend wrote after unified-damage, or any other) is left out and logged, so its points count as available.
     */
    fun fromStored(
        username: String,
        stored: Map<String, Int>,
        earned: Int,
    ): PlayerTalents {
        val (known, unknown) = stored.entries.partition { (id, _) -> TalentCatalog.all.any { it.id == id } }
        unknown.forEach { (id, level) ->
            logger.warn("Ignoring talent outside the catalog username={} talent={} level={}", username, id, level)
        }
        return PlayerTalents(username, known.associate { it.key to it.value }, earned)
    }
}

// TalentService.kt:71-72
private fun load(username: String) =
    PlayerTalents.fromStored(username, talentRepository.findAll(username), talentRepository.earnedPoints(username))
```

`GET /talents` keeps its shape; it answers 27 entries. `POST /talents/MAGICAL_BREAK/upgrade` already answers 404 `TALENT_NOT_FOUND` through `TalentCatalog.find`. Grade 1 index of each id in the answer: `MINIBOSS_TIME` 0, `BOSS_TIME` 1, `PHYSICAL_BREAK` 2, `CRIT_RESIST_BREAK` 3, `CLICK_DAMAGE` 4, `CRIT_CHANCE` 5, `CRIT_DAMAGE` 6, `COMBO` 7, `CLICK_FLAT_DAMAGE` 8; grade 2 adds 9, grade 3 adds 18.

**Steps**:

1. Replace the `grade1` list and the `TalentCatalog` KDoc as in the contract.
2. Change the companion of `PlayerTalents` and add `fromStored` as in the contract. The `init` check stays.
3. Change `TalentService.load` as in the contract.
4. Update the existing tests (below), then add the new ones.

**Tests**: unit + integration
**Test cases**:

- `TalentsTest` (existing, edited):
  - `the catalog has the 10 talents of the four branches with the values of the spec` → renamed `the catalog has the 9 talents of the four branches with the values of the spec`; remove the `Triple("MAGICAL_BREAK", TalentBranch.BREAK, 1),` line; `List(30) { 10 }` → `List(27) { 10 }`.
  - `units are seconds, points or percent`: the expected list becomes `listOf("s", "s", "points", "points", "%", "points", "%", "%", "dmg")` (9 units).
  - `the catalog has 3 grades of the 10 talents, grade N giving N times the value of grade 1` → renamed `the catalog has 3 grades of the 9 talents, grade N giving N times the value of grade 1`; `assertEquals(30, TalentCatalog.all.size)` → `assertEquals(27, TalentCatalog.all.size)`.
  - `a new player has level 0 and 0 points and every next cost is 1`: `List(30) { 0 }` → `List(27) { 0 }`; `List(10) { 1 } + List(10) { 2 } + List(10) { 3 }` → `List(9) { 1 } + List(9) { 2 } + List(9) { 3 }`.
  - `stored levels must be in the catalog and between 1 and 10 and the earned points not negative`: add `assertFailsWith<IllegalArgumentException> { PlayerTalents("yan", mapOf("MAGICAL_BREAK" to 1)) }`.
- `TalentsTest` (new):
  - `the defense break is one talent labelled Quebra de defesa in each grade`: for `PHYSICAL_BREAK`, `PHYSICAL_BREAK_G2`, `PHYSICAL_BREAK_G3` (`TalentCatalog.find`): `label == "Quebra de defesa"`, `branch == TalentBranch.BREAK`, `unit == "points"`, `perLevel` 1, 2, 3.
  - `the magical defense break is not in the catalog`: `TalentCatalog.find("MAGICAL_BREAK")`, `find("MAGICAL_BREAK_G2")` and `find("MAGICAL_BREAK_G3")` each throw `TalentNotFoundException`; `TalentCatalog.all.none { it.id.startsWith("MAGICAL") }` is true.
  - `fromStored leaves out a level outside the catalog and spends no point on it`: `PlayerTalents.fromStored("yan", mapOf("PHYSICAL_BREAK" to 3, "MAGICAL_BREAK" to 5), 20)` has `levels == mapOf("PHYSICAL_BREAK" to 3)` and `points(TalentRules()) == TalentPoints(20, 3)` (available 17).
  - `fromStored leaves out every grade of the magical break`: `fromStored("yan", mapOf("MAGICAL_BREAK" to 10, "MAGICAL_BREAK_G2" to 3, "CLICK_DAMAGE" to 2), 30)` has `levels == mapOf("CLICK_DAMAGE" to 2)` and `points(TalentRules()).available == 28`.
  - `fromStored keeps every catalog level`: `fromStored("yan", mapOf("COMBO" to 10, "COMBO_G2" to 4), 30) == PlayerTalents("yan", mapOf("COMBO" to 10, "COMBO_G2" to 4), 30)`.
- `TalentServiceTest` (new; store rows with `talents.levels["yan" to "<id>"] = <level>` after `player(<points>)`):
  - `list leaves out a stored magical break and its points come back`: `player(20)`, `PHYSICAL_BREAK` 3, `MAGICAL_BREAK` 5; `service.list("yan")` has `level("PHYSICAL_BREAK") == 3`, `levels.containsKey("MAGICAL_BREAK") == false` and `points(rules) == TalentPoints(20, 3)`.
  - `an upgrade works for a player who still has a magical break row`: `player(1)`, `MAGICAL_BREAK` 5; `service.upgrade("yan", "CLICK_DAMAGE", 0).level("CLICK_DAMAGE") == 1` and `talents.levels["yan" to "CLICK_DAMAGE"] == 1`.
  - `an upgrade of the magical break is not found and stores nothing`: `player(5)`; `service.upgrade("yan", "MAGICAL_BREAK", 0)` throws `TalentNotFoundException`; `talents.levels.containsKey("yan" to "MAGICAL_BREAK") == false`.
  - `reset deletes a stored magical break row with the others`: `player(10)`, `MAGICAL_BREAK` 5, `CLICK_DAMAGE` 2; after `service.reset("yan")`, `talents.levels.keys.none { it.first == "yan" }` is true.
- `AccountResetServiceTest` (new) - `a reset deletes a stored magical break row with the other levels`: `player()`, then `talents.save("yan", "MAGICAL_BREAK", 5)`; `service.reset("yan", 3)`; `assertEquals(emptyMap(), talents.findAll("yan"))` (spec edge case).
- `TalentControllerIT` (existing, edited):
  - `a new player gets the 30 talents of 3 grades at level 0 with a next cost of 1, 2 and 3 points and no points` → renamed `a new player gets the 27 talents of 3 grades at level 0 with a next cost of 1, 2 and 3 points and no points`: `talents.size()` 27; the id list without `"MAGICAL_BREAK"`; branches `List(3) { listOf("TIME", "TIME", "BREAK", "BREAK", "POWER", "POWER", "POWER", "COMBO", "POWER") }.flatten()`; `talents.level` and `talents.value` `List(27) { 0 }`; `talents.nextCost` and `talents.grade` `List(9) { 1 } + List(9) { 2 } + List(9) { 3 }`; `talents.maxLevel` `List(27) { 10 }`; `talents.unlocked` `List(9) { true } + List(18) { false }`.
  - `POST reset takes back every level and answers all the earned points as available`: `List(30) { 0 }` → `List(27) { 0 }`.
  - Every `talents[<i>]` index in the file moves by this table (indexes 0, 1 and 2 stay): 5 → 4, 8 → 7, 9 → 8, 18 → 16, 28 → 25. Change nothing else in those lines.
- `TalentControllerIT` (new):
  - `the defense break is labelled Quebra de defesa in each grade`: `GET /talents` has `talents[2].id` `PHYSICAL_BREAK` and `talents[2].label` `Quebra de defesa`, `talents[11].id` `PHYSICAL_BREAK_G2` with label `Quebra de defesa` and `perLevel` 2, `talents[20].id` `PHYSICAL_BREAK_G3` with label `Quebra de defesa` and `perLevel` 3.
  - `a magical break upgrade is 404 TALENT_NOT_FOUND`: `earned(5)`; `upgrade("MAGICAL_BREAK", 0)`, `upgrade("MAGICAL_BREAK_G2", 0)` and `upgrade("MAGICAL_BREAK_G3", 0)` each answer 404 with `code` `TALENT_NOT_FOUND`; `level("MAGICAL_BREAK") == 0` afterwards.
  - `a stored magical break row is ignored and its points are available`: `earned(20)`, `talentRepository.save("yan", "PHYSICAL_BREAK", 3)`, `talentRepository.save("yan", "MAGICAL_BREAK", 5)`; `GET /talents` answers 200 with `talents.size()` 27, `points.earned` 20, `points.spent` 3, `points.available` 17 (UDMG-07 AC 7).
  - `POST reset deletes a stored magical break row`: `earned(3)`, `talentRepository.save("yan", "MAGICAL_BREAK", 5)`; `POST /talents/reset` answers 200 with `points.available` 3; `level("MAGICAL_BREAK") == 0`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] `grep -rn "MAGICAL_BREAK" backend/src/main` finds nothing.
- [ ] Every test case above passes and the whole backend suite passes.

**Commit**: `feat(backend): merge the defense break talents into Quebra de defesa`

---

### T3: Remove the magical break levels and rewrite the hero texts [ ]

**Owner**: kotlin-backend-dev
**Goal**: Add `V11__unified_damage.sql` (delete `MAGICAL_BREAK*` levels, guarded text updates) and put the same new texts in `HeroSeed` (UDMG-08, UDMG-10).
**Where**: `backend/src/main/resources/db/migration/V11__unified_damage.sql` (new)
**Also changes**: `<main>/domain/HeroSeed.kt`, `<test>/domain/HeroSeedTest.kt`, `<test>/adapter/repository/UnifiedDamageMigrationIT.kt` (new), `<test>/adapter/web/HeroControllerIT.kt`
**Read first**: `V2__lyra_leader_bonus.sql`, `HeroSeed.kt` (whole file; the nine strings are at lines 21, 37, 58, 88, 96, 104, 112, 133, 141), `<test>/adapter/repository/LyraLeaderBonusMigrationIT.kt` (pattern), `<test>/adapter/repository/TalentPointsMigrationIT.kt` (pattern for `users(...)` and `TalentRepository`), `<test>/IntegrationTestBase.kt:110-120`, `HeroSeedTest.kt`, `HeroControllerIT.kt:20-90`, design section "Migration `V11__unified_damage.sql`", spec section "Player-Facing Texts"
**Depends on**: T2
**Requirement**: UDMG-08, UDMG-10

**Contract**:

- The migration file is the full SQL of the design section "Migration `V11__unified_damage.sql`", copied character for character (UTF-8, no BOM).
- `HeroSeed.kt` changes exactly these strings to the "After" column of the spec's Player-Facing Texts table: Orina `leaderBonus` (`+20% de dano total.`), Kael skill 1 and 3, Lyra skill 1, Orina skills 1, 2 and 3, Seraphine skills 1 and 2. Keep each string on the line it is on today. Nothing else changes.
- The nine `(table, heroId, slot, old, new)` rows of the test, in this order: `heroes`/`orina`/null, `hero_skills`/`kael`/1, `kael`/3, `lyra`/1, `orina`/1, `orina`/2, `orina`/3, `seraphine`/1, `seraphine`/2, each with its "Today" text as `old` and its "After" text as `new` (spec table; the Orina hero detail and skill bar rows are screen texts, not stored).

**Steps**:

1. `ls backend/src/main/resources/db/migration`. The last file today is `V10__health_legacy_columns_drop.sql`. If a `V11__*.sql` already exists, use the next free number in the file name and in every reference of this task, and say so in the commit body. Otherwise create `V11__unified_damage.sql` with the design SQL.
2. Edit the nine strings in `HeroSeed.kt`.
3. Write the tests below.

**Tests**: unit + integration
**Test cases**:

- `HeroSeedTest` (new cases):
  - `no hero text names a damage type`: for every hero of `HeroSeed.heroes()`, `leaderBonus` and every skill `effect`, lowercased, contain none of `mágic`, `físic`, `poder arcano`, `de força` (UDMG-10 AC 4).
  - `Orina leads with +20% de dano total`: Orina's `leaderBonus == "+20% de dano total."`.
  - `the eight skill texts of unified-damage`: Kael slot 1 and 3, Lyra slot 1, Orina slots 1 to 3, Seraphine slots 1 and 2 have exactly the "After" texts of the spec table (one `assertEquals` each).
- `UnifiedDamageMigrationIT` (new, extends `IntegrationTestBase`, `@BeforeTest fun players() = users("yan", "other", "plain")`; `migrate()` runs `jdbc.execute(ClassPathResource("db/migration/V11__unified_damage.sql").getContentAsString(Charsets.UTF_8))`; autowire `JdbcTemplate`, `TalentRepository`, `ListTalentsUseCase` and `TalentRules`; keep in the test the list of the 9 text rows of the contract and an `@AfterTest` that writes every `new` text back):
  - `every grade of the magical break is deleted and the other levels stay`: save `yan` `MAGICAL_BREAK` 10, `MAGICAL_BREAK_G2` 3, `MAGICAL_BREAK_G3` 1, `PHYSICAL_BREAK` 3 and `other` `MAGICAL_BREAK` 4, `COMBO` 2; `migrate()`; `repository.findAll("yan") == mapOf("PHYSICAL_BREAK" to 3)` and `repository.findAll("other") == mapOf("COMBO" to 2)` (UDMG-08 AC 4).
  - `the points of the deleted levels are available again`: `repository.award("yan", "test", 20)`, save `PHYSICAL_BREAK` 3 and `MAGICAL_BREAK` 5; `migrate()`; `listTalents.list("yan").points(rules) == TalentPoints(20, 3)` (available 17, UDMG-08 AC 5).
  - `10 levels of grade 1 and 3 of grade 2 give 16 points back`: award 20, save `MAGICAL_BREAK` 10 and `MAGICAL_BREAK_G2` 3; `migrate()`; `select coalesce(sum(points), 0) from talent_point_awards where username = 'yan'` is 20, `repository.findAll("yan")` is empty and `listTalents.list("yan").points(rules).available == 20` (it was 20 - 16 = 4 under the previous catalog, UDMG-08 AC 6).
  - `a player who never bought the magical break keeps their levels and points`: award `plain` 6, save `plain` `CLICK_DAMAGE` 4; `migrate()`; `repository.findAll("plain") == mapOf("CLICK_DAMAGE" to 4)` and `listTalents.list("plain").points(rules) == TalentPoints(6, 4)` (spec edge case).
  - `talent point awards and wallets are untouched`: award `yan` 7 and `other` 3, `jdbc.update("insert into wallets (username, copper) values ('yan', 1234)")`; read `select username, award_key, points from talent_point_awards order by username, award_key` and `select username, copper from wallets order by username` before and after `migrate()`; both lists are equal.
  - `a database seeded with the old texts gets the new ones`: set each of the 9 texts to its `old` value (`update heroes set leader_bonus = ? where id = ?`, `update hero_skills set effect = ? where hero_id = ? and slot = ?`); `migrate()`; each reads its `new` value (UDMG-10 AC 2).
  - `a text tuned in the database survives`: set Orina's `leader_bonus` and the `kael` slot 1 `effect` to `Tuned`; `migrate()`; both read `Tuned` (UDMG-10 AC 3).
  - `a new database seeds the new texts`: without any update, Orina's `leader_bonus` is `+20% de dano total.` and the `orina` slot 1 `effect` is `Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.` (UDMG-10 AC 1).
  - `running the migration twice gives the same result`: set the 9 `old` texts and save `yan` `MAGICAL_BREAK` 2; `migrate()` twice with no exception; the 9 texts read `new` and `repository.findAll("yan")` is empty.
- `HeroControllerIT` (new) - `GET heroes answers Orina without damage types`: `val token = register(element = "WATER")`; `GET /heroes` has `heroes[2].id` `orina`, `heroes[2].leaderBonus` `+20% de dano total.`, and `heroes[2].skills[0].effect`, `heroes[2].skills[1].effect` and `heroes[2].skills[2].effect` equal Orina's three "After" texts in slot order.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] `grep -rn -i -E "mágic|físic|Poder Arcano|de Força" backend/src/main` finds only the `and leader_bonus = '...'` / `and effect = '...'` guard lines of `V11__unified_damage.sql`.
- [ ] Every test case above passes and the whole backend suite passes (`SchemaValidationIT` included).

**Commit**: `feat(backend): drop the magical break levels and the damage type texts`

---

### T4: Make every hit meet one defense [x]

**Owner**: game-dev
**Goal**: Add `defenseOf(stats)` and make `calculateDamage` read it for every hit, ignoring any damage type (UDMG-01).
**Where**: `game/src/domain/combat/damage.js`
**Also changes**: `game/src/domain/combat/monster.js`, `game/src/domain/combat/damage.test.js`, `game/src/domain/combat/monster.test.js`, `game/src/domain/skills/skillDamage.test.js`, `game/src/domain/skills/skillCombat.test.js`
**Read first**: `damage.js` (whole file), `monster.js:1-8`, `damage.test.js:1-48, 122-142`, `monster.test.js:1-3, 117-123`, `skillDamage.test.js:1-30, 116-127`, `skillCombat.test.js:1-12, 47-52, 148-187`, design sections "Game `defenseOf`" and "Game `calculateDamage`"
**Depends on**: T3
**Requirement**: UDMG-01

**Contract**:

```js
//  monster.js, right after the line `export const MONSTER_MAX_HEALTH = 10;` (DEFAULT_STATS does NOT change in this task)
//  The one defense of a monster's stats (spec unified-damage): `defense`, else `physicalDefense` of a payload from the backend of before
//  unified-damage (TD-002), else 0. `magicalDefense` is never read.
export const defenseOf = (stats) => stats.defense ?? stats.physicalDefense ?? 0;

//  damage.js: the imports become
import { elementMultiplier, FIRE } from './elements';
import { defenseOf } from './monster';
import { formatShort } from './numberFormat';

//  damage.js:11 becomes (the three comment lines below it stay)
//  What a click deals to `defender` ({ element, defense, critResistance }; `defenseOf` also reads an older payload). Every hit meets the
//  same defense: an attacker's `damageType` is ignored (spec unified-damage).

//  damage.js:18-19 (`baseDefense` and `defense`) become one line
const defense = defenseOf(defender) * (1 - Math.min(100, attacker.armorPierce ?? 0) / 100);
```

`PHYSICAL`, `MAGICAL` and `PLAYER.damageType` stay exported in this task (T8 removes them).

**Steps**:

1. Add `defenseOf` to `monster.js`.
2. In `damage.js` add the `defenseOf` import, replace the comment line 11 and the two lines `baseDefense` / `defense` as in the contract.
3. Make the test edits below.

**Tests**: unit
**Test cases**:

- `damage.test.js` (the helper `enemy` stays as it is; remove `MAGICAL` from the import, so it reads `import { calculateDamage, formatDamage, PLAYER } from './damage';`):
  - `multiplies by 1 minus the physical defense in percent` → renamed `multiplies by 1 minus the defense in percent`; defender `{ element: 'FIRE', defense: 50, critResistance: 0 }`; `toBe(0.5)`.
  - `ignores the magical defense for a physical click` → renamed `never reads magicalDefense: an old payload with physicalDefense 0 and magicalDefense 80 deals 1`; same call, `toBe(1)`.
  - `uses the magical defense, and not the physical one, for magical damage` → renamed `meets the same defense whatever damageType an older attacker carries: physicalDefense 80 deals 0.2`; attacker `{ ...PLAYER, damageType: 'MAGICAL' }`, defender `enemy('FIRE', 80, 20)`; `toBeCloseTo(0.2, 10)`.
  - `deals 1 against nature with physical defense 50 and no critical (2 x 0.5)` → renamed `deals 1 against nature with defense 50 and no critical (2 x 0.5)` (no other change).
  - `ignores the given percent of the physical defense: 50 % of a 50 defense leaves 25` → renamed `ignores the given percent of the defense: 50 % of a 50 defense leaves 25` (no other change).
  - `applies to the magical defense for magical damage` → renamed `applies to the one defense whatever damageType an older attacker carries: pierce 50 on defense 40 deals 0.8`; attacker `{ ...PLAYER, damageType: 'MAGICAL', armorPierce: 50 }`, defender `{ element: 'FIRE', defense: 40, critResistance: 0 }`; `toBe(0.8)`.
  - new (in `describe('calculateDamage')`) `reads defense before physicalDefense: defense 40 and physicalDefense 70 deal 0.6`: defender `{ element: 'FIRE', defense: 40, physicalDefense: 70, magicalDefense: 70, critResistance: 0 }`, `random: never`; `toBeCloseTo(0.6, 10)`.
  - new `meets defense 0 when the stats carry no defense field`: defender `{ element: 'FIRE', critResistance: 0 }`, `random: never`; `toBe(1)`.
- `monster.test.js`: add `defenseOf` to the import from `./monster`; new `describe('defenseOf')`:
  - `reads defense first`: `defenseOf({ defense: 40, physicalDefense: 70 })` is 40.
  - `keeps a defense of 0 even when physicalDefense is set`: `defenseOf({ defense: 0, physicalDefense: 50 })` is 0.
  - `falls back to physicalDefense of an old payload`: `defenseOf({ physicalDefense: 50, magicalDefense: 10 })` is 50.
  - `never reads magicalDefense`: `defenseOf({ magicalDefense: 30 })` is 0.
  - `reads 0 without any defense field`: `defenseOf({ element: 'FIRE' })` is 0.
- `skillDamage.test.js`:
  - `uses the magical defense for magical hits` → renamed `meets the one defense with every hit: 2500 % against physicalDefense 90 deals 2.5`; same call (`enemy('FIRE', 90, 20)`, `damageType: 'MAGICAL'`); `toBeCloseTo(2.5, 10)`.
  - `leaves the magical defense alone under Brado` → renamed `lowers the one defense under Brado for every hit: defense 50 hit at 100 % deals 0.8`; defender `enemy('FIRE', 50, 0)` (was `enemy('FIRE', 0, 50)`); `toBe(0.8)`.
- `skillCombat.test.js`:
  - `lands Chuva de Meteoros as one magical hit of 25 and Golpe Sangrento as 6` → renamed `lands Chuva de Meteoros as one hit of 25 (20 on defense 20) and Golpe Sangrento as 6`; `stats('FIRE', 90, 20)` → `stats('FIRE', 20)`; expectations unchanged (`{ damage: 20, critical: false }` and 6).
  - `uses the magical break for a magical skill hit and the physical one for a physical hit` → renamed `lowers the one defense of every hit with PHYSICAL_BREAK: Chuva de Meteoros 2250 and Investida 360 against defense 20 with PHYSICAL_BREAK 10`; both `withBreak({ MAGICAL_BREAK: 10 })` → `withBreak({ PHYSICAL_BREAK: 10 })`; the comment becomes `//  Chuva de Meteoros: 2500 % of 100 against defense 20 - 10 = 10 %; Investida: 400 % against the same 10 %`; expectations `toBeCloseTo(2250, 6)` and `toBeCloseTo(360, 6)` (E13).
  - `applies the break to a damage tick: Tempestade Arcana on magical defense 20 with MAGICAL_BREAK 5 ticks 200 x 0.85` → renamed `applies the break to a damage tick: Tempestade Arcana on defense 20 with PHYSICAL_BREAK 5 ticks 200 x 0.85`; `withBreak({ PHYSICAL_BREAK: 5 })`, `stats('FIRE', 20)`; expectation unchanged (`toBeCloseTo(100 * 2 * 0.85, 6)`, 170, E14).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] `grep -n "magicalDefense\|damageType ===" game/src/domain/combat/damage.js` finds nothing.
- [x] The edited and new tests pass; the whole Vitest suite passes.

**Commit**: `feat(game): meet one defense with every hit`

---

### T5: Show one Defesa chip on the enemy line [ ]

**Owner**: game-dev
**Goal**: The enemy line shows `<Element>  Defesa <n>%  Crit res <n>%` with the chip `data-stat="defense"`, and a monster without stats is `{ element: 'FIRE', defense: 0, critResistance: 0 }` (UDMG-06).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/public/style.css`, `game/src/domain/combat/monster.js`, `game/src/domain/campaign/campaign.js` (comment only), `game/src/adapters/phaser/ClickerGame.test.js`, `game/src/domain/combat/monster.test.js`, `game/src/domain/campaign/campaign.test.js`
**Read first**: `ClickerGame.js:11` (monster import), `ClickerGame.js:776-802`, `game/public/style.css:743-791`, `monster.js:1-12`, `campaign.js:1-12`, `ClickerGame.test.js:1953-2125, 2205-2220, 3468-3525, 3668-3675`, `monster.test.js:117-123`, `campaign.test.js:145-149`, design section "Game `showEnemyStats` (adapter) and the chip style", spec section "Enemy line layout (after)"
**Depends on**: T4
**Requirement**: UDMG-06

**Contract**:

```js
//  monster.js:6-7
//  A monster without attributes: fire, no defense, no critical resistance
export const DEFAULT_STATS = { element: 'FIRE', defense: 0, critResistance: 0 };

//  ClickerGame.js:11 becomes
import { defenseOf, healthText, Monster } from '../../domain/combat/monster';

//  ClickerGame.js:785-802: the comment and showEnemyStats become
//  "Water  Defesa 10%  Crit res 12%", one chip each; the double spaces are hidden between the chips. data-element and data-stat give each
//  chip its dot or icon (spec ui-redesign UIR-07); the one defense is read by defenseOf (spec unified-damage)
showEnemyStats (stats)
{
    const { element, critResistance } = stats;
    const name = element.charAt(0) + element.slice(1).toLowerCase();
    const chips = [ [ 'defense', `Defesa ${defenseOf(stats)}%` ], [ 'crit', `Crit res ${critResistance}%` ] ];
    const tags = [
        el('span', 'tag tag-element', name, { 'data-element': element }),
        ...chips.map(([ stat, text ]) => el('span', 'tag', text, { 'data-stat': stat }))
    ];

    this.enemyStats.replaceChildren(...tags.flatMap((tag, index) => (index ? [ el('span', 'gap', '  '), tag ] : [ tag ])));

    const weak = weaknessOf(element);

    this.weakChip.textContent = weak ? `Fraco: ${ELEMENT_LABELS[weak]}` : '';
    this.weakChip.setAttribute('data-element', weak ?? '');
}

//  campaign.js lines 9-10 become:
//  where boss, monster and miniboss are { element, defense, critResistance } (an older backend sends physicalDefense and magicalDefense
//  instead of defense, read by defenseOf); a payload without them means DEFAULT_STATS. The drop rule ids name the wallet queue a kill takes its copper from
```

`game/public/style.css`, two edits and nothing else:

1. Line 778: replace the selector text `.tag[data-stat="physical"] {` with `.tag[data-stat="defense"] {`. The two lines inside the block (`--stat-color: #b07a3a;` and the shield `--stat-icon: url(...)`) stay byte for byte.
2. Lines 783-787: delete the whole block that starts with `.tag[data-stat="magical"] {` (its `--stat-color: #3f8fd1;` line, its `--stat-icon` line, its closing `}`) and the blank line after it.

The chips keep the class `tag` and the `.enemy-stats .tag` rule.

**Steps**:

1. Change `DEFAULT_STATS` in `monster.js`.
2. Change the monster import of `ClickerGame.js` and replace `showEnemyStats` and its comment.
3. In `style.css` rename the `physical` selector to `defense` and delete the `magical` block.
4. Change the comment in `campaign.js`.
5. Make the test edits below.

**Tests**: unit
**Test cases**:

- `monster.test.js` - `carries the stats it was given, fire without defense by default`: the third expectation becomes `expect(DEFAULT_STATS).toEqual({ element: 'FIRE', defense: 0, critResistance: 0 })`.
- `campaign.test.js` - `a payload without stats means fire, no defense, no resistance`: the first expectation becomes `toEqual({ element: 'FIRE', defense: 0, critResistance: 0 })`; the two `DEFAULT_STATS` lines stay.
- `ClickerGame.test.js`, replace every occurrence of each expected string (UDMG-06 AC 5, 7):
  - `'Water  Physical def 11%  Magical def 22%  Crit res 33%'` → `'Water  Defesa 11%  Crit res 33%'`
  - `'Light  Physical def 1%  Magical def 2%  Crit res 3%'` → `'Light  Defesa 1%  Crit res 3%'`
  - `'Darkness  Physical def 30%  Magical def 30%  Crit res 30%'` (two tests) → `'Darkness  Defesa 30%  Crit res 30%'`
  - `'Fire  Physical def 0%  Magical def 0%  Crit res 0%'` → `'Fire  Defesa 0%  Crit res 0%'`
  - `'Nature  Physical def 0%  Magical def 0%  Crit res 0%'` → `'Nature  Defesa 0%  Crit res 0%'`
  - `'Light  Physical def 4%  Magical def 5%  Crit res 6%'` → `'Light  Defesa 4%  Crit res 6%'`
- `ClickerGame.test.js` renames and body edits:
  - `shows the element and the three values of the monster on screen` → renamed `shows the element, the defense and the critical resistance of the monster on screen`.
  - `marks the element chip with data-element and each defense chip with data-stat` → renamed `marks the element chip with data-element and the defense and crit chips with data-stat`; the second expectation becomes `.toEqual([ [ 'defense', 'Defesa 11%' ], [ 'crit', 'Crit res 33%' ] ])` (UDMG-06 AC 10).
  - `keeps the enemy line text exactly as before` → renamed `keeps the element chip and the one-defense line on a chapter boss` (its text expectation is the replaced `'Darkness  Defesa 30%  Crit res 30%'`).
  - `applies the physical defense of the monster` → renamed `applies the defense of the monster: physicalDefense 50 of an old payload` (no other change).
  - `lowers the physical defense by 5 points with PHYSICAL_BREAK 5: a click against defense 20 deals 0.85, not 0.8` → renamed `lowers the defense by 5 points with PHYSICAL_BREAK 5: a click against defense 20 deals 0.85, not 0.8` (no other change).
  - `shows the lowered defenses on the enemy tags and keeps the stats of the monster itself` → renamed `shows the lowered defense on the enemy chips and keeps the stats of the monster itself`; talents `tree({ PHYSICAL_BREAK: 5, CRIT_RESIST_BREAK: 8 })`; its three `toContain` lines become `toContain('Defesa 15%')`, `toContain('Crit res 12%')` and `expect(ctx.hud('.enemy-stats').textContent).not.toContain('Magical def')`; the `physicalDefense` `toBe(20)` line stays (UDMG-06 AC 8).
  - `updates the enemy tags when a break talent is upgraded`: `'Physical def 19%'` → `'Defesa 19%'` (UDMG-06 AC 8).
- `ClickerGame.test.js` new, inside `describe('ClickerGame elements')` right after `applies the defense of the monster: physicalDefense 50 of an old payload`, using its `withStats` and `enemyText` helpers:
  - `applies the defense of a new payload: defense 50 takes half of a click`: `createScene({ start: withStats({ element: 'FIRE', defense: 50, physicalDefense: 50, magicalDefense: 50, critResistance: 0 }) })`, one `ctx.click()`, `expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.5)`.
  - `shows defense over physicalDefense when a payload has both: Defesa 40%`: `withStats({ element: 'WATER', defense: 40, physicalDefense: 70, magicalDefense: 70, critResistance: 12 })`; `enemyText(ctx)` is `'Water  Defesa 40%  Crit res 12%'`.
  - `shows Defesa 50% for an old payload with physicalDefense 50 and magicalDefense 10`: `withStats({ element: 'DARKNESS', physicalDefense: 50, magicalDefense: 10, critResistance: 100 })`; `enemyText(ctx)` is `'Darkness  Defesa 50%  Crit res 100%'`, and it does not contain `Physical def` nor `Magical def` (UDMG-06 AC 6, 9).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] `grep -rn "Physical def\|Magical def" game/src` finds nothing.
- [ ] `grep -n 'data-stat="physical"\|data-stat="magical"' game/public/style.css` finds nothing and `grep -c 'data-stat="defense"' game/public/style.css` prints 1.
- [ ] The edited and new tests pass; the whole Vitest suite passes.

**Commit**: `feat(game): show one Defesa chip on the enemy line`

---

### T6: Make Prisão and Bênção raise every damage and Brado lower the one defense [ ]

**Owner**: game-dev
**Goal**: `strike` multiplies every click, hit, aimed shot and tick by the Bênção and Prisão factors (with the level factor `f` they were cast with), Brado writes `defense`, and the damage functions take no `damageType` (UDMG-02, UDMG-03, UDMG-04).
**Where**: `game/src/domain/skills/skillDamage.js`
**Also changes**: `game/src/domain/skills/skillDamage.test.js`, `game/src/domain/skills/skillCombat.test.js`
**Read first**: `skillDamage.js` (whole file), `skillDamage.test.js` (whole file), `skillCombat.test.js:1-12, 395-528, 770-818`, spec "Damage Rules" (E3 to E19) and "Edge Cases", design section "Game `strike`"
**Depends on**: T5
**Requirement**: UDMG-02, UDMG-03, UDMG-04

**Contract**:

```js
//  The damage of a click, a skill hit and a skill tick under the running effects. Pure JavaScript: no Phaser. Every strike meets the one
//  defense and every effect applies to every strike (spec unified-damage).
//  `buffs` and `debuffs` are lists of the ids of the running effects: ventos, bencao and fumaca on the player; brado and prisao on the monster.
//  `attacker` is the click attacker of the leader (element, base damage, critical chance, armor pierce and boss damage of its pieces).
import { calculateDamage } from '../combat/damage';
import { defenseOf } from '../combat/monster';

const VENTOS_CLICK_PERCENT = 50;
const BENCAO_CLICK_PERCENT = 25;
const BENCAO_DAMAGE_PERCENT = 30;
const FUMACA_CRIT_POINTS = 15;
const BRADO_DEFENSE_POINTS = 30;
const PRISAO_DAMAGE_PERCENT = 25;

//  factorOf stays exactly as it is (skillDamage.js:13-14)

//  One strike: `percent` of the attacker's base damage through the click formula, then the modifiers of the effects
const strike = ({ attacker, percent = 100, armorPierce = 0, critChance, forceCritical = false, vsDarkness = 1, multiplier = 1, buffs, debuffs, defender, random, boss, factors = {} }) =>
{
    const hitter = {
        ...attacker,
        baseDamage: attacker.baseDamage * percent / 100,
        armorPierce: Math.min(100, (attacker.armorPierce ?? 0) + armorPierce),
        critChance: critChance ?? Math.min(100, attacker.critChance + (buffs.includes('fumaca') ? FUMACA_CRIT_POINTS * factorOf(factors, 'fumaca') : 0))
    };
    const target = debuffs.includes('brado')
        ? { ...defender, defense: Math.max(0, defenseOf(defender) - BRADO_DEFENSE_POINTS * factorOf(factors, 'brado')) }
        : defender;
    const { damage, critical } = calculateDamage({ attacker: hitter, defender: target, random, boss, forceCritical });
    const blessing = buffs.includes('bencao') ? 1 + BENCAO_DAMAGE_PERCENT * factorOf(factors, 'bencao') / 100 : 1;
    const prison = debuffs.includes('prisao') ? 1 + PRISAO_DAMAGE_PERCENT * factorOf(factors, 'prisao') / 100 : 1;
    const darkness = defender.element === 'DARKNESS' ? vsDarkness : 1;

    return { damage: damage * blessing * prison * darkness * multiplier, critical };
};

//  clickDamage: the call becomes strike({ attacker, percent: 100 + bonus, buffs, debuffs, defender, random, boss, multiplier, forceCritical, factors })
//  hitDamage stays `(options) => strike(options)`
//  tickDamage = ({ attacker, percent, buffs, debuffs, defender, boss, factors = {} }) =>
//      strike({ attacker, percent, critChance: 0, buffs, debuffs, defender, random: () => 0, boss, factors }).damage
```

**Steps**:

1. Replace the header comment, the imports, the constants and `strike` with the contract; keep `factorOf`.
2. Remove `damageType` from `clickDamage` and `tickDamage` as in the contract.
3. Make the test edits below.

**Tests**: unit
**Test cases** (`skillDamage.test.js`):

- The helper becomes `const enemy = (element = 'FIRE', defense = 0, critResistance = 0) => ({ element, defense, critResistance });` and these calls change: `enemy('FIRE', 90, 20)` → `enemy('FIRE', 90)`; every `enemy('FIRE', 0, 0, 100)` (2 calls) → `enemy('FIRE', 0, 100)`; both `enemy('FIRE', 0, 0, 50)` → `enemy('FIRE', 0, 50)`. Calls with one or two arguments stay.
- Remove every `damageType: 'PHYSICAL'` and `damageType: 'MAGICAL'` property from the calls and the `base` objects (with its comma).
- `deals 9.75 with Corte Dimensional (1500 %, pierce 30) on base 1 against physical defense 50` → renamed `deals 9.75 with Corte Dimensional (1500 %, pierce 30) on base 1 against defense 50` (same value).
- `adds the click bonuses of Ventos and Bênção and multiplies the physical bonus: 1 x 1.75 x 1.3 = 2.275` → renamed `adds the click bonuses of Ventos and Bênção and multiplies by the Bênção bonus: 1 x 1.75 x 1.3 = 2.275` (same value).
- `multiplies physical hits by 1.3 under Bênção but not magical ones, and gives them no click bonus` → renamed `multiplies every skill hit by 1.3 under Bênção and gives it no click bonus`: `expect(hitDamage(base).damage).toBeCloseTo(1.3, 10)`; `expect(hitDamage({ ...base, percent: 800, vsDarkness: 1.5 }).damage).toBeCloseTo(10.4, 10)` (E8).
- new (same `describe('buffs')`) `multiplies a 200 % tick by 1.3 under Bênção: 2.6`: `expect(tickDamage({ attacker: PLAYER, percent: 200, defender: enemy(), buffs: [ 'bencao' ], debuffs: [] })).toBeCloseTo(2.6, 10)` (E18).
- `lowers the physical defense by 30 points under Brado, never below 0` → renamed `lowers the defense by 30 points under Brado, never below 0` (same values, E15).
- `lowers the one defense under Brado for every hit: defense 50 hit at 100 % deals 0.8` (named in T4) → renamed `lowers the defense under Brado for a skill hit too: Chuva de Meteoros on defense 50 deals 20`: `expect(hitDamage({ attacker: PLAYER, percent: 2500, defender: enemy('FIRE', 50), random: never, buffs: [], debuffs: [ 'brado' ] }).damage).toBe(20)` (E16).
- `multiplies magical damage by 1.25 under Prisão and leaves physical alone` → renamed `multiplies every strike by 1.25 under Prisão`: `expect(hitDamage(base).damage).toBe(1.25)`; `expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ] }).damage).toBe(1.25)` (E3); `expect(tickDamage({ attacker: PLAYER, percent: 200, defender: enemy(), buffs: [], debuffs: [ 'prisao' ] })).toBe(2.5)` (E7).
- new `multiplies a Base 1.4 click by 1.25 under Prisão: 1.75`: `expect(clickDamage({ attacker: { ...PLAYER, baseDamage: 1.4 }, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ] }).damage).toBeCloseTo(1.75, 10)` (E4).
- new `Prisão and Bênção together make a click 2.03125`: `expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [ 'prisao' ] }).damage).toBeCloseTo(2.03125, 10)` (E17).
- `Ventos at 1.25 and Bênção at 1.5 add 62.5 and 37.5 and multiply physical by 1.45: 2.9` → renamed `Ventos at 1.25 and Bênção at 1.5 add 62.5 and 37.5 and multiply by 1.45: 2.9` (same value).
- `Bênção at factor 1.5 multiplies a physical hit by 1.45 and leaves a magical hit alone` → renamed `Bênção at factor 1.5 multiplies every hit by 1.45`: `expect(hitDamage(base).damage).toBeCloseTo(1.45, 9)`; `expect(hitDamage({ ...base, percent: 800, vsDarkness: 1.5, defender: enemy('DARKNESS') }).damage).toBeCloseTo(15.66, 9)` (E12).
- new `Bênção at factor 1.5 makes a click 1.99375`: `expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [ 'bencao' ], debuffs: [], factors: { bencao: 1.5 } }).damage).toBeCloseTo(1.99375, 9)` (E11).
- `Brado at factor 1.5 removes 45 physical defense, never below 0` → renamed `Brado at factor 1.5 removes 45 defense, never below 0` (same values).
- `Prisão at factor 1.25 multiplies magical damage by 1.3125` → renamed `Prisão at factor 1.25 multiplies every strike by 1.3125`: `expect(hitDamage(base).damage).toBeCloseTo(1.3125, 9)`; `expect(clickDamage({ attacker: PLAYER, defender: enemy(), random: never, buffs: [], debuffs: [ 'prisao' ], factors: { prisao: 1.25 } }).damage).toBeCloseTo(1.3125, 9)` (E5).
- `a tick reads the factor of Bênção at the tick: 100 % physical at factor 1.5 is 1.45` → renamed `a tick reads the factor of Bênção at the tick: 100 % at factor 1.5 is 1.45` (same value).
- `follows the defense, Bênção and Prisão at the tick`: keep both lines (without `damageType`); add `expect(tickDamage({ attacker: PLAYER, percent: 100, defender: enemy(), buffs: [ 'bencao' ], debuffs: [ 'prisao' ] })).toBeCloseTo(1.625, 10)`.

**Test cases** (`skillCombat.test.js`, new, right after `follows Bênção at the tick: the tick at the second it ends still gets 1.3, the next one does not`, same `describe`, with the file's `combat`, `monsterOf`, `use` helpers and `PLAYER`; spec Edge Cases, L-039):

- `follows Bênção at the tick for a Tempestade Arcana tick too: 2.6 at the second it ends, then 2`: `const skills = combat(); const monster = monsterOf();` `use(skills, monster, 'seraphine', 1)`; `skills.advance(14000, { monster })`; `use(skills, monster, 'orina', 2)`; `expect(skills.advance(1000, { monster }).hits[0].damage).toBeCloseTo(2.6, 10)`; `expect(skills.advance(1000, { monster }).hits[0].damage).toBe(2)` (E18).
- `follows Prisão at the tick: Tempestade Arcana ticks 2.5 at 1 s and at 2 s, when Prisão ends, then 2`: `use(skills, monster, 'orina', 1)`; `use(skills, monster, 'orina', 2)`; three `skills.advance(1000, { monster }).hits[0].damage` read `2.5`, `2.5`, `2` (`toBe`).
- `ends Bênção after 15 s: Luz Divina deals 10.4 under it and 8 after`: `use(skills, monster, 'seraphine', 1)`; `expect(use(skills, monster, 'seraphine', 2).hits[0].damage).toBeCloseTo(10.4, 10)`; `skills.advance(25000, { monster })`; `expect(use(skills, monster, 'seraphine', 2).hits[0].damage).toBe(8)`.
- `ends Prisão after 2 s: a click deals 1.25 under it and 1 after`: `use(skills, monster, 'orina', 1)`; `expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1.25)`; `skills.advance(2000, { monster })`; `expect(skills.click({ attacker: PLAYER, monster, boss: false }).damage).toBe(1)`.

The existing skill-level tests of `describe('skill levels')` keep their values: `Bênção da Grande Árvore at level 3 makes a Base-1 click 1.99375 (1.375 x 1.45)` and `Prisão de Espinhos at level 2 multiplies Chuva de Meteoros at level 2 by 1.3125: 41.015625` (E11, E19) must pass unchanged.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] `grep -n "PHYSICAL\|MAGICAL\|damageType\|physicalDefense" game/src/domain/skills/skillDamage.js game/src/domain/skills/skillDamage.test.js` finds nothing.
- [ ] The edited and new tests pass; the whole Vitest suite passes.

**Commit**: `feat(game): let Prisão and Bênção raise every damage`

---

### T7: Let the defense break talent lower the one defense [ ]

**Owner**: game-dev
**Goal**: `monsterAfterBreak` lowers `defense` by `PHYSICAL_BREAK` and ignores `MAGICAL_BREAK`; the icon map loses `MAGICAL_BREAK` (UDMG-04).
**Where**: `game/src/domain/talents/talents.js`
**Also changes**: `game/src/domain/talents/talents.test.js`
**Read first**: `talents.js:1-30, 85-100`, `talents.test.js:1-16, 79-107, 163-168`, design section "Game `monsterAfterBreak`"
**Depends on**: T6
**Requirement**: UDMG-04

**Contract**:

```js
//  talents.js: add below the existing campaign import
import { defenseOf } from '../combat/monster';

//  talents.js:22-29 (the comment and monsterAfterBreak) become
//  The stats of a monster after the break talents: points off the one defense (PHYSICAL_BREAK, all grades) and off the critical resistance
//  (CRIT_RESIST_BREAK), none below 0. Every other field is kept as received.
export const monsterAfterBreak = (stats, talents) => ({
    ...stats,
    defense: Math.max(0, defenseOf(stats) - talentValue(talents, 'PHYSICAL_BREAK')),
    critResistance: Math.max(0, stats.critResistance - talentValue(talents, 'CRIT_RESIST_BREAK'))
});

//  ICON_NAMES: remove the line `MAGICAL_BREAK: 'break-magical',`
```

**Steps**:

1. Add the import, replace `monsterAfterBreak` and its comment.
2. Remove `MAGICAL_BREAK` from `ICON_NAMES`.
3. Make the test edits below.

**Tests**: unit
**Test cases** (`talents.test.js`):

- The `tree` fixture: remove `[ 'MAGICAL_BREAK', 1 ], `.
- The `monster` helper becomes `const monster = (defense = 0, critResistance = 0) => ({ element: 'FIRE', defense, critResistance });`.
- `lowers the physical defense by 3 points with PHYSICAL_BREAK 3 and leaves the rest` → renamed `lowers the defense by 3 points with PHYSICAL_BREAK 3 and leaves the rest`: `monsterAfterBreak(monster(10, 10), tree({ PHYSICAL_BREAK: 3 }))` equals `monster(7, 10)`.
- `lowers the magical defense by 3 points with MAGICAL_BREAK 3 and leaves the rest` → renamed `ignores a MAGICAL_BREAK entry of an older talent list`: `monsterAfterBreak(monster(10, 10), [ { id: 'MAGICAL_BREAK', value: 3 } ])` equals `monster(10, 10)`.
- `lowers the critical resistance by 8 points with CRIT_RESIST_BREAK 8`: `monster(10, 20)` → `monster(10, 12)`.
- `never goes below 0`: `monsterAfterBreak(monster(2, 0), tree({ PHYSICAL_BREAK: 5, CRIT_RESIST_BREAK: 5 }))` equals `monster(0, 0)`.
- `keeps the element and changes nothing without talents`: `monster(10, 10)` in both places.
- `does not change the stats it was given`: `monster(10, 10)` in both places.
- new `reads physicalDefense of an old payload and writes defense`: `monsterAfterBreak({ element: 'FIRE', physicalDefense: 20, magicalDefense: 20, critResistance: 0 }, tree({ PHYSICAL_BREAK: 5 }))` equals `{ element: 'FIRE', physicalDefense: 20, magicalDefense: 20, critResistance: 0, defense: 15 }`.
- new `takes the defense to 0, not below, when the break is larger: defense 10 and PHYSICAL_BREAK 15`: `monsterAfterBreak(monster(10, 0), tree({ PHYSICAL_BREAK: 15 }))` equals `monster(0, 0)`.
- new `adds the grades of the break: PHYSICAL_BREAK 10 and PHYSICAL_BREAK_G2 value 4 take defense 20 to 6`: list `[ { id: 'PHYSICAL_BREAK', value: 10 }, { id: 'PHYSICAL_BREAK_G2', baseId: 'PHYSICAL_BREAK', value: 4 } ]`, `monster(20, 0)` → `monster(6, 0)`.
- `names the 8 icons as the asset prompts do` → renamed `names the 7 icons as the asset prompts do`: remove `'MAGICAL_BREAK'` from the id list and `'talent-break-magical'` from the expected list.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] `grep -n "MAGICAL\|magicalDefense\|physicalDefense:" game/src/domain/talents/talents.js` finds nothing.
- [ ] The edited and new tests pass; the whole Vitest suite passes.

**Commit**: `feat(game): let the defense break lower the one defense`

---

### T8: Remove the damage type from the skills and the attacker [ ]

**Owner**: game-dev
**Goal**: Delete `damageType` from the skill catalog, `SkillCombat` and `PLAYER`, and the `PHYSICAL` / `MAGICAL` exports (UDMG-01).
**Where**: `game/src/domain/skills/skillCatalog.js`
**Also changes**: `game/src/domain/skills/skillCombat.js`, `game/src/domain/combat/damage.js`, `game/src/domain/skills/skillCatalog.test.js`, `game/src/domain/skills/skillCombat.test.js`, `game/src/domain/combat/damage.test.js`, `game/src/domain/equipment/equipment.test.js`
**Read first**: `skillCatalog.js` (whole file), `skillCombat.js:20-30, 80-90, 188-196, 298-322`, `damage.js:1-10`, `skillCatalog.test.js:12-36`, `damage.test.js:1-12`, `equipment.test.js:84-92`, `skillCombat.test.js` (the tests named below)
**Depends on**: T7
**Requirement**: UDMG-01

**Contract**:

- `skillCatalog.js`: remove the import line `import { MAGICAL, PHYSICAL } from '../combat/damage';` and the `damageType: PHYSICAL, ` / `damageType: MAGICAL, ` property of all 15 skills. No other value changes.
- `skillCombat.js`: remove `damageType` from the damage-over-time record (the comment at line 24 and the object at line 86: `damageType: skill.damageType, `) and from the three calls at lines 193 (`damageType: skill.damageType, `), 303 (`damageType: skill.damageType, `) and 318 (`damageType: dot.damageType,`).
- `damage.js`: remove `export const PHYSICAL = 'PHYSICAL';` and `export const MAGICAL = 'MAGICAL';` (and the blank line after them); `PLAYER` becomes `export const PLAYER = { element: FIRE, baseDamage: 1, critChance: 10, critMultiplier: 2 };` and its first comment line `//  The attacker until characters exist: a fire clicker with a 10 % chance of a double-damage critical hit.` (the line `//  Chances and defenses are percentages.` stays).

**Steps**:

1. Edit `skillCatalog.js`, `skillCombat.js` and `damage.js` as in the contract.
2. Make the test edits below.
3. Run `grep -rn -w -E "PHYSICAL|MAGICAL|damageType" game/src --include=*.js`. Every hit must be one of: the `damageType: 'MAGICAL'` attackers of `damage.test.js` (they prove the type is ignored), the `not.toHaveProperty('damageType')` lines of `skillCatalog.test.js` and `equipment.test.js`, and the `damageType` line of `leaderStats.js` / `leaderStats.test.js` that T9 removes. Report any other hit.

**Tests**: unit
**Test cases**:

- `skillCatalog.test.js`: `pins the damage type of every skill: Kael, Lyra and Vex physical, Orina and Seraphine magical` → renamed `gives no skill a damage type (spec unified-damage)`: for each hero of `kael, lyra, orina, seraphine, vex` and slot 1 to 3, `expect(skillOf(heroId, slot)).not.toHaveProperty('damageType')`. In `pins the instant hits of the table` remove every `damageType: '...', ` from the `toMatchObject` objects (the hit values stay).
- `damage.test.js`: `is a fire, physical attacker with 1 base damage, 10 % critical chance and a double critical` → renamed `is a fire attacker with 1 base damage, 10 % critical chance and a double critical`: `expect(PLAYER).toEqual({ element: 'FIRE', baseDamage: 1, critChance: 10, critMultiplier: 2 })`.
- `equipment.test.js`: `keeps the element and damage type of the base attacker` → renamed `keeps the element of the base attacker and adds no damage type`: `expect(attacker.element).toBe('WATER')` and `expect(attacker).not.toHaveProperty('damageType')`.
- `skillCombat.test.js` renames only (bodies unchanged):
  - `lets a Base 100 click against physical defense 20 deal 85 under PHYSICAL_BREAK 5 and 80 without it` → `lets a Base 100 click against defense 20 deal 85 under PHYSICAL_BREAK 5 and 80 without it`
  - `lowers the physical defense by 30 points for 10 s with Brado Aterrador` → `lowers the defense by 30 points for 10 s with Brado Aterrador`
  - `adds 25 % magical damage for 2 s with Prisão de Espinhos` → `adds 25 % damage for 2 s with Prisão de Espinhos`
  - `lands 6 magical ticks of 2 with Tempestade Arcana, the first 1 s after the cast, then stops` → `lands 6 ticks of 2 with Tempestade Arcana, the first 1 s after the cast, then stops`
  - `Corte Dimensional keeps its +30 armor pierce at level 2: 12.1875 against physical defense 50` → `Corte Dimensional keeps its +30 armor pierce at level 2: 12.1875 against defense 50`
  - `Brado Aterrador at level 3 removes 45 physical defense: a click on defense 50 deals 0.95, and 0.8 at level 1` → `Brado Aterrador at level 3 removes 45 defense: a click on defense 50 deals 0.95, and 0.8 at level 1`

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The grep of step 3 finds nothing outside the listed hits.
- [ ] The edited tests pass; the whole Vitest suite passes; `cd game && npm run build` succeeds.

**Commit**: `refactor(game): remove the damage type from skills and attacker`

---

### T9: Show one Quebra de defesa line and no damage type on the attribute panel [ ]

**Owner**: game-dev
**Goal**: `leaderStats` answers 10 lines: no `damageType`, one `breakDefense` line `Quebra de defesa: <n>` (UDMG-11).
**Where**: `game/src/domain/equipment/leaderStats.js`
**Also changes**: `game/src/domain/equipment/leaderStats.test.js`, `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `leaderStats.js` (whole file), `leaderStats.test.js` (whole file), `HeroUi.test.js:1440-1456`, `equipmentView.js:53-62`, design section "Game `leaderStats`"
**Depends on**: T8
**Requirement**: UDMG-11

**Contract**:

```js
return [
    { id: 'element', text: `Elemento: ${ELEMENT_LABELS[leader.element]}` },
    { id: 'clickDamage', text: `Dano de clique: ${attacker.baseDamage.toFixed(1)}` },
    { id: 'critChance', text: `Chance de crítico: ${one(attacker.critChance)}%` },
    { id: 'critDamage', text: `Dano crítico: x${two(attacker.critMultiplier)}` },
    { id: 'armorPierce', text: `Perfuração de armadura: ${one(attacker.armorPierce ?? 0)}%` },
    { id: 'bossDamage', text: `Dano em chefes: ${one(attacker.bossDamage ?? 0)}%` },
    { id: 'minibossTime', text: `Tempo extra de miniboss: ${one(equipmentSeconds + talentValue(talents, 'MINIBOSS_TIME'))}s` },
    { id: 'bossTime', text: `Tempo extra de chefe: ${one(equipmentSeconds + talentValue(talents, 'BOSS_TIME'))}s` },
    { id: 'breakDefense', text: `Quebra de defesa: ${talentValue(talents, 'PHYSICAL_BREAK')}` },
    { id: 'breakCrit', text: `Quebra de resistência a crítico: ${talentValue(talents, 'CRIT_RESIST_BREAK')}` }
];
```

The view renders each line as `.stat-line` with test id `stat-<id>` (`equipmentView.js:60`), so the test id becomes `stat-breakDefense`; no view change.

**Steps**:

1. Replace the returned list with the contract.
2. Make the test edits below.

**Tests**: unit
**Test cases**:

- `leaderStats.test.js`:
  - `gives the lines in the order of the spec`: expected ids `[ 'element', 'clickDamage', 'critChance', 'critDamage', 'armorPierce', 'bossDamage', 'minibossTime', 'bossTime', 'breakDefense', 'breakCrit' ]`.
  - `reads Kael with 0 stars, no equipment and no talents as the base attacker`: replace the `damageType` line with `expect(kaelLines.damageType).toBeUndefined()`.
  - `reads the three break talents` → renamed `reads the two break talents`: talents `talents({ PHYSICAL_BREAK: 3, CRIT_RESIST_BREAK: 8 })`; `result.breakDefense` is `'Quebra de defesa: 3'`, `result.breakCrit` is `'Quebra de resistência a crítico: 8'`, `result.breakPhysical` and `result.breakMagical` are `undefined`.
  - `reads 0 for every break without talents`: `[ result.breakDefense, result.breakCrit ]` equals `[ 'Quebra de defesa: 0', 'Quebra de resistência a crítico: 0' ]`.
  - new `ignores a MAGICAL_BREAK entry of an older talent list`: talents `talents({ MAGICAL_BREAK: 4 })`; `result.breakDefense` is `'Quebra de defesa: 0'`.
- `HeroUi.test.js` - `adds the talents to the numbers`: `expect(stat(ctx, 'breakPhysical')).toBe('Quebra de defesa física: 3')` → `expect(stat(ctx, 'breakDefense')).toBe('Quebra de defesa: 3')`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] `grep -rn "Tipo de dano\|defesa física\|defesa mágica" game/src` finds only the two test fixtures that T10 rewrites (`talentsView.test.js:6`, `HeroUi.test.js:1222`).
- [ ] The edited and new tests pass; the whole Vitest suite passes.

**Commit**: `feat(game): show one Quebra de defesa line on the attribute panel`

---

### T10: Drop the retired magical break from any talent list the game receives [ ]

**Owner**: game-dev
**Goal**: `talentCollection` removes `MAGICAL_BREAK`, `MAGICAL_BREAK_G2` and `MAGICAL_BREAK_G3` from every list it adopts, so the Talentos screen and every effect ignore them (UDMG-09).
**Where**: `game/src/application/talents/talentCollection.js`
**Also changes**: `game/src/application/talents/talentCollection.test.js`, `game/src/adapters/phaser/views/talentsView.test.js`, `game/src/adapters/phaser/HeroUi.test.js`, `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `talentCollection.js` (whole file), `talentCollection.test.js:1-30`, `talentsView.test.js:1-20, 73-90`, `HeroUi.test.js:1219-1232`, `ClickerGame.test.js:3469-3473`, design section "Game `talentCollection`"
**Depends on**: T9
**Requirement**: UDMG-09

**Contract**:

```js
//  Talents the backend of before unified-damage still answers; they left the catalog and are dropped on read (spec unified-damage, TD-002)
export const RETIRED_TALENT_IDS = [ 'MAGICAL_BREAK', 'MAGICAL_BREAK_G2', 'MAGICAL_BREAK_G3' ];

//  inside createTalentCollection, `adopt` becomes:
const adopt = (tree) =>
{
    talents = tree.talents.filter((talent) => !RETIRED_TALENT_IDS.includes(talent.id));
    points = tree.points ?? points;
    loaded = true;
    listeners.forEach((listener) => listener());
};
```

**Steps**:

1. Add `RETIRED_TALENT_IDS` above `createTalentCollection` (below the port comment) and change `adopt` as in the contract.
2. Write the new tests; add `RETIRED_TALENT_IDS` to the import of `talentCollection.test.js`.
3. Fixture edits (they mirror the new backend catalog): in `talentsView.test.js:6` and `HeroUi.test.js:1222` remove the entry `[ 'MAGICAL_BREAK', 'BREAK', 'Quebra de defesa mágica', 'points', 1 ], ` and change `'Quebra de defesa física'` to `'Quebra de defesa'`; in `ClickerGame.test.js:3471` remove `[ 'MAGICAL_BREAK', 1 ], `.
4. In `talentsView.test.js` the test `puts the talents of each branch in its column: 2, 3, 3 and 1` (it counts the fixture) is renamed `puts the talents of each branch in its column: 2, 2, 4 and 1` and expects `[ 2, 2, 4, 1 ]` (it expected `[ 2, 3, 4, 1 ]`). Change nothing else in those files.

**Tests**: unit
**Test cases** (`talentCollection.test.js`):

- `drops the magical break of every grade from a loaded list`: `gateway.list.mockResolvedValue({ talents: [ talent('PHYSICAL_BREAK', 2), talent('MAGICAL_BREAK', 5), talent('MAGICAL_BREAK_G2', 1), talent('MAGICAL_BREAK_G3'), talent('CLICK_DAMAGE') ], points: points(9, 9) })`; after `await collection.load()`, `collection.talents().map((t) => t.id)` equals `[ 'PHYSICAL_BREAK', 'CLICK_DAMAGE' ]` and `collection.levelOf('MAGICAL_BREAK')` is 0.
- `drops it from the list an upgrade answers`: `gateway.upgrade.mockResolvedValue({ talents: [ talent('CLICK_DAMAGE', 1), talent('MAGICAL_BREAK', 5) ], points: points(9, 6) })`; after `await collection.upgrade('CLICK_DAMAGE', 0)`, the ids are `[ 'CLICK_DAMAGE' ]`.
- `drops it from the list a reset answers`: `gateway.reset.mockResolvedValue({ talents: [ talent('MAGICAL_BREAK'), talent('COMBO') ], points: points(9, 0) })`; after `await collection.reset()`, the ids are `[ 'COMBO' ]`.
- `keeps a list without retired talents as it came`: the default `gateway.list` of `beforeEach`; after `load()`, `collection.talents()` equals `[ talent('CLICK_DAMAGE'), talent('CRIT_CHANCE', 4) ]`.
- `lists the three retired ids`: `RETIRED_TALENT_IDS` equals `[ 'MAGICAL_BREAK', 'MAGICAL_BREAK_G2', 'MAGICAL_BREAK_G3' ]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] `grep -rn "defesa física\|defesa mágica" game/src` finds nothing.
- [ ] The new tests pass; the whole Vitest suite passes.

**Commit**: `feat(game): drop the retired magical break from talent lists`

---

### T11: Move the fake backend and the existing e2e specs to one defense [ ]

**Owner**: test-engineer
**Goal**: The fake backend answers the new payload (`defense` plus the old fields), the 27-talent catalog and the new Orina texts; the existing e2e specs read `Defesa`, the `defense` chip, and drop the damage-type words from their names (UDMG-06, UDMG-09, UDMG-10).
**Where**: `game/e2e/support/fakeBackend.js`
**Also changes**: `game/e2e/elements.spec.js`, `game/e2e/talents.spec.js`, `game/e2e/skillsAll.spec.js`, `game/e2e/uiRedesign.spec.js`
**Read first**: `fakeBackend.js:24-44, 78-104, 186-200`, `elements.spec.js:1-70`, `talents.spec.js:1-50`, `skillsAll.spec.js:85-100, 140-195`, `uiRedesign.spec.js:1-10, 844-873`, spec "Player-Facing Texts" and "Enemy line layout (after)"
**Depends on**: T10
**Requirement**: UDMG-06, UDMG-09, UDMG-10

**Contract** (`fakeBackend.js`):

- `seededDefinition`: boss `{ element: 'DARKNESS', defense: 30, physicalDefense: 30, magicalDefense: 30, critResistance: 30 }`; monster `{ element, defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance: 0 }`; miniboss `{ element, defense: 11 + i, physicalDefense: 11 + i, magicalDefense: 11 + i, critResistance: 12 + 2 * i }`.
- The comment above `TALENT_CATALOG` says `the 9 talents of the backend catalog in 3 grades`; `TALENT_CATALOG` loses the `[ 'MAGICAL_BREAK', 'BREAK', 'Quebra de defesa mágica', 'points', 1 ], ` entry and the `PHYSICAL_BREAK` label becomes `'Quebra de defesa'`.
- `const skill = (slot, name, type, cooldownSeconds, image, effect = `Efeito de ${name}`) => ({ slot, name, type, effect, cooldownSeconds, image });`
- `HEROES`: Orina `leaderBonus: '+20% de dano total.'`; pass as 6th argument the "After" text of the spec table to Kael skills 1 and 3, Lyra skill 1, Orina skills 1, 2 and 3 and Seraphine skills 1 and 2.

**Steps**:

1. Edit `fakeBackend.js` as in the contract.
2. `elements.spec.js`: `'Nature  Physical def 0%  Magical def 0%  Crit res 0%'` → `'Nature  Defesa 0%  Crit res 0%'`; `'Darkness  Physical def 50%  Magical def 10%  Crit res 100%'` → `'Darkness  Defesa 50%  Crit res 100%'`; test `shows the element and defenses of the monster, and a fire click deals double to nature` → renamed `shows the element and the defense of the monster, and a fire click deals double to nature`; above `const ELEMENTS_CHAPTER` add the comment `//  The enemies use the payload of the backend before unified-damage on purpose: the game reads physicalDefense as the defense (TD-002).` The fixture values stay.
3. `talents.spec.js`: the comment at line 5 becomes `//  Fire monsters (a fire click is neutral) of 1000 health with defense 20, and a miniboss that takes 30 s`; test `PHYSICAL_BREAK 5 lowers the defense of the monster: a click deals 0.85 instead of 0.8` → renamed `PHYSICAL_BREAK 5 lowers the one defense of the monster: a click deals 0.85 instead of 0.8`; `'Physical def 15%'` → `'Defesa 15%'`; `'Physical def 20%'` → `'Defesa 20%'`.
4. `skillsAll.spec.js` renames only (bodies unchanged): `Brado Aterrador lowers the physical defense by 30 points for 10 s: a click goes from 0.5 to 0.8 (x 1.4) and back` → `Brado Aterrador lowers the defense by 30 points for 10 s: a click goes from 0.5 to 0.8 (x 1.4) and back`; `Prisão de Espinhos raises the magical damage by 25 % for 2 s and roots the boss countdown` → `Prisão de Espinhos raises the damage by 25 % for 2 s and roots the boss countdown`; `Chuva de Meteoros deals 2500 % magical: 25 x 1.4` → `Chuva de Meteoros deals 2500 %: 25 x 1.4`; `Bênção da Grande Árvore adds 30 % physical and 25 % click damage for 15 s: a click does 1.4 x 1.25 x 1.3 = 2.275` → `Bênção da Grande Árvore multiplies every damage by 1.3 and adds 25 % click damage for 15 s: a click does 1.4 x 1.25 x 1.3 = 2.275`; `Luz Divina deals 800 % magical: 8 x 1.4` → `Luz Divina deals 800 %: 8 x 1.4`.
5. `uiRedesign.spec.js` - `draws the enemy chips with a dot and three icons, text unchanged` → renamed `draws the enemy chips with a dot and two icons: the defense shield and the crit target`:
   - the text expectation becomes `toHaveText('Nature  Defesa 10%  Crit res 30%')` (the fixture `bare('NATURE', 10, 20, 30)` stays: an old payload whose `physicalDefense` 10 is the defense);
   - the two `[data-stat="physical"]` lines (colour `rgb(176, 122, 58)`, width `12px`) read `[data-stat="defense"]` with the same values;
   - delete the two `[data-stat="magical"]` lines (colour `rgb(63, 143, 209)` and width `12px`); the comment `//  UIR-07 AC17: the magical and the crit icons are 12 px too` becomes `//  UIR-07 AC17: the crit icon is 12 px too`;
   - add `await expect(page.locator('.enemy-stats [data-stat="physical"], .enemy-stats [data-stat="magical"]')).toHaveCount(0);` (UDMG-06 AC 10);
   - the loop over `.enemy-stats .tag` stays.

**Tests**: e2e
**Test cases**: the edited scenarios above keep their asserted numbers and styles; their texts are the spec's (UDMG-06 AC 5, 6, 8, 10). No new scenario in this task (T12 adds them).

**Gate**: full - `cd game && npm test && npx playwright test`
**Done when**:

- [ ] `grep -rn "Physical def\|Magical def\|Poder Arcano\|defesa física\|defesa mágica\|MAGICAL_BREAK\|data-stat=\"physical\"\|data-stat=\"magical\"" game/e2e` finds only the new `toHaveCount(0)` line of `uiRedesign.spec.js`.
- [ ] The whole Playwright suite passes with the same number of tests as before the task.

**Commit**: `test(game): move the fake backend and e2e specs to one defense`

---

### T12: Cover the unified damage in the browser [ ]

**Owner**: test-engineer
**Goal**: A new e2e file proves every player-visible criterion of the feature on the real scene against the fake backend (UDMG-01 to UDMG-04, UDMG-06, UDMG-09 to UDMG-11).
**Where**: `game/e2e/unifiedDamage.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/skillsAll.spec.js:1-71` (copy its imports, `STAR`, `ELEMENT_OF`, `bare`, `chapter`, `startAs`, `scene`, `health`, `advance`, `dealt`, `use`, `click`), `game/e2e/talents.spec.js:67-80` (opening Talentos), `game/e2e/equipmentUi.spec.js:30-45` (opening Equipamento), `game/e2e/heroes.spec.js:34-58` (opening the hero catalog), `game/src/adapters/phaser/ClickerGame.js:944` (`useSkill`) and `:1121` (`strike`), spec "Damage Rules" and "Player-Facing Texts"
**Depends on**: T11
**Requirement**: UDMG-01, UDMG-02, UDMG-03, UDMG-04, UDMG-06, UDMG-09, UDMG-10, UDMG-11

**Contract**:

- Copy the helpers of `skillsAll.spec.js` named above; `chapter(monster)` takes the monster without a default.
- `startAs(page, heroId, { monster, encounter = 'PHASE', roll, talents } = {})`: the copied helper, plus `...(talents && { talents: { yan: talents } })` in the `mockBackend` options. The leader holds a 3★ card, so its Base is 1.4 (`STAR`); the default roll 0.99 never crits.
- `const enemy = (element, defense, critResistance = 0) => ({ element, defense, physicalDefense: defense, magicalDefense: defense, critResistance });` (new payload).
- Two helpers that act inside one `page.evaluate`, so no real frame runs between the skill and the click (Prisão lasts only 2 s):

```js
//  Uses skill `slot` and strikes the monster once in the same call; returns the damage dealt so far
const useThenStrike = (page, slot) => page.evaluate((number) => {
    const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    scene.useSkill(number);
    scene.strike(512);

    return Math.round((1000 - scene.monster.health) * 1e6) / 1e6;
}, slot);
//  Strikes the monster once; returns the damage dealt so far
const strikeNow = (page) => page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    scene.strike(512);

    return Math.round((1000 - scene.monster.health) * 1e6) / 1e6;
});
```

- Decimal polls use `toBeCloseTo(value, 5)` as in `skillsAll.spec.js`.

**Steps**:

1. Create the file with the copied helpers and the contract helpers, `test.describe('Unified damage', ...)`.
2. Write the scenarios below, each with exactly this name.

**Tests**: e2e
**Test cases**:

- `Prisão de Espinhos raises an Orina click by 25 %: 1.4 x 1.25 = 1.75, and a plain 1.4 after it ends`: `startAs(page, 'orina')`; `expect(await useThenStrike(page, 1)).toBeCloseTo(1.75, 5)`; `await advance(page, 2_500)`; `expect(await strikeNow(page)).toBeCloseTo(3.15, 5)` (UDMG-02, E4, edge case "Prisão ends").
- `Bênção da Grande Árvore raises Luz Divina by 30 %: 8 x 1.4 x 1.3 = 14.56`: `startAs(page, 'seraphine')`; `use(page, 1)`; `use(page, 2)`; poll `dealt` ≈ 14.56 (UDMG-03, E9).
- `Chuva de Meteoros meets the one defense of an old payload: physicalDefense 50 and magicalDefense 10 make 25 x 1.4 x 0.5 = 17.5`: `startAs(page, 'orina', { monster: { element: 'WATER', physicalDefense: 50, magicalDefense: 10, critResistance: 0 } })`; `.enemy-stats` has text `Water  Defesa 50%  Crit res 0%`; `use(page, 3)`; poll `dealt` ≈ 17.5 (UDMG-01 AC 2, UDMG-06 AC 6).
- `a monster of the new payload shows Defesa 40% and a click meets it: 1.4 x 0.6 = 0.84`: `startAs(page, 'orina', { monster: enemy('WATER', 40, 12) })`; `.enemy-stats` has text `Water  Defesa 40%  Crit res 12%` and does not contain `Physical def` nor `Magical def`; `.enemy-stats [data-stat="defense"]` has count 1; `click(page)`; poll `dealt` ≈ 0.84 (UDMG-06 AC 5, 9, 10).
- `defense wins over physicalDefense when a payload has both: Defesa 40%`: `startAs(page, 'orina', { monster: { element: 'WATER', defense: 40, physicalDefense: 70, magicalDefense: 70, critResistance: 0 } })`; `.enemy-stats` has text `Water  Defesa 40%  Crit res 0%`; `click(page)`; poll `dealt` ≈ 0.84 (edge case).
- `PHYSICAL_BREAK 5 lowers the defense for an Orina skill too: Chuva de Meteoros on defense 20 deals 25 x 1.4 x 0.85 = 29.75`: `startAs(page, 'orina', { monster: enemy('WATER', 20), talents: { PHYSICAL_BREAK: 5 } })`; `.enemy-stats` has text `Water  Defesa 15%  Crit res 0%`; `use(page, 3)`; poll `dealt` ≈ 29.75 (UDMG-04, UDMG-06 AC 8).
- `the Talentos screen has one Quebra de defesa per grade and no magical break`: `startAs(page, 'kael')`; click `hud-talents`; wait for `talent-screen`; `page.getByTestId('talent-branch-BREAK').locator('.talent-name')` has texts `[ 'Quebra de defesa', 'Quebra de resistência a crítico', 'Quebra de defesa (Grau 2)', 'Quebra de resistência a crítico (Grau 2)', 'Quebra de defesa (Grau 3)', 'Quebra de resistência a crítico (Grau 3)' ]`; `talent-MAGICAL_BREAK`, `talent-MAGICAL_BREAK_G2` and `talent-MAGICAL_BREAK_G3` each have count 0 (UDMG-09 AC 9).
- `the attribute panel shows Quebra de defesa: 3 and no damage type`: `startAs(page, 'kael', { talents: { PHYSICAL_BREAK: 3 } })`; click `hud-equipment`; wait for `leader-stats`; `stat-breakDefense` has text `Quebra de defesa: 3`; `stat-damageType`, `stat-breakPhysical` and `stat-breakMagical` have count 0; `page.getByTestId('leader-stats').locator('.stat-line')` has count 10 (UDMG-11).
- `Orina's leader bonus reads +20% de dano total. on the skill bar and in the hero detail, and her skills name no damage type`: `startAs(page, 'orina')`; `.leader-bonus` has text `Líder · +20% de dano total. (em breve)`; click `hud-heroes`, then `hero-card-orina`; `hero-detail` `.hero-bonus` has text `Bônus de líder: +20% de dano total. (em breve)`; `hero-detail` `.skill-effect` has texts equal to Orina's three "After" texts in slot order; `hero-detail` does not contain `mágic` (UDMG-10 AC 5).

**Gate**: full - `cd game && npx playwright test e2e/unifiedDamage.spec.js` then `cd game && npm test && npx playwright test`
**Done when**:

- [ ] The 9 scenarios pass; the whole Playwright suite passes.

**Commit**: `test(game): cover the unified damage in the browser`

---

### T13: Rewrite the design doc and the art prompts for one damage [ ]

**Owner**: game-dev
**Goal**: `README.md` describes one damage and one defense with the new skill texts, and `PROMPTS_ASSETS_UI.md` retires the magical break icon (UDMG-12).
**Where**: `README.md`
**Also changes**: `PROMPTS_ASSETS_UI.md`
**Read first**: `README.md:46-145`, `PROMPTS_ASSETS_UI.md:175-192, 278-285`, spec "Player-Facing Texts"
**Depends on**: T12
**Requirement**: UDMG-12

**Contract** (`README.md`, replace exactly):

- Lines 50-51 `**Heróis:** Força (dano físico), Poder Arcano (dano mágico), Velocidade de` / `Ataque, Precisão, Chance de Crítico, Resistência.` → `**Heróis:** Dano, Velocidade de Ataque, Precisão, Chance de Crítico,` / `Resistência. Existe um único tipo de dano.`
- Line 55 `- **Resistência física / mágica:** reduz o dano recebido de cada tipo` → `- **Defesa:** reduz todo o dano recebido (cliques e habilidades)`
- The table rows of Corte Dimensional (line 75), Brado Aterrador (77), Flecha Dupla (86), Prisão de Espinhos (97), Tempestade Arcana (98), Chuva de Meteoros (99), Bênção da Grande Árvore (108) and Luz Divina (109): the effect cell becomes the "After" text of the spec table.
- Line 92 `... Especialista em dano mágico em área.` → `... Especialista em dano em área.`
- Line 93 `**Bônus de líder:** +20% de Poder Arcano para todo o grupo.` → `**Bônus de líder:** +20% de dano total.`
- Line 124 `- **Medo + dano físico:** Brado Aterrador antes de Corte Dimensional, Flecha` → `- **Medo + dano:** Brado Aterrador antes de Corte Dimensional, Flecha`
- Line 138 `- **Blindados:** alta resistência física (fracos contra Maga e Clériga).` → `- **Blindados:** alta defesa (fracos contra Brado Aterrador e Quebra de defesa).`
- Lines 140-141 (`- **Conjuradores:** alta resistência mágica (fracos contra Guerreiro e` / `  Arqueira).`) are deleted.

**Contract** (`PROMPTS_ASSETS_UI.md`):

- Line 179 `#### 3.3 Quebra da defesa física — ` → `#### 3.3 Quebra de defesa — ` (file name unchanged).
- Line 186 `#### 3.4 Quebra da defesa mágica — `talent-break-magical.png`` → `#### 3.4 (retirado) Quebra da defesa mágica — `talent-break-magical.png``, and right below it the line `Não gerar: o talento saiu do jogo com unified-damage (AD-021).`
- Table: line 282 `| Quebra física (3.3) |` → `| Quebra de defesa (3.3) |`; delete the row that starts with `| Quebra mágica (3.4) |` (line 283).

**Steps**:

1. Apply the `README.md` replacements.
2. Apply the `PROMPTS_ASSETS_UI.md` replacements.

**Tests**: none
**Gate**: build - `grep -n -E "dano mágico|dano físico|Poder Arcano|resistência física|resistência mágica|de Força" README.md` prints nothing, then `cd game && npm test && npm run build`
**Done when**:

- [ ] The grep prints nothing.
- [ ] `README.md` contains `**Bônus de líder:** +20% de dano total.` and `- **Defesa:** reduz todo o dano recebido (cliques e habilidades)`.

**Commit**: `docs: describe one damage and one defense`

---

### T14: Review the changed screens [ ]

**Owner**: ui-artist
**Goal**: Screenshot every changed screen at desktop and phone width and write `ui-review.html` from `.claude/templates/ui-review.html`; findings become new tasks (UDMG-06, UDMG-09, UDMG-10, UDMG-11).
**Where**: `.specs/features/unified-damage/ui-review.html` (new)
**Also changes**: `game/ui-review/unifiedDamage.shots.js` (new), `.specs/features/unified-damage/ui-review/*.png` (screenshots)
**Read first**: `.claude/agents/ui-artist.md`, `.claude/templates/ui-review.html`, `game/ui-review/heroAscension.shots.js` (pattern), `game/ui-review/support/shots.js`, `game/ui-review.config.js` (projects `desktop` 1280x720 and `phone` 390x844), `game/public/style.css` (rules `.enemy-stats`, `.tag[data-stat]`, `.talent-column`, `.talent-card`, `.stat-line`, `.hero-bonus`, `.leader-bonus`), spec "Player-Facing Texts" and "Enemy line layout (after)"
**Depends on**: T13
**Requirement**: UDMG-06, UDMG-09, UDMG-10, UDMG-11

**Contract** - screens to capture (fake backend, both projects; `shot(page, testInfo, '<NN>-<name>')` saves `.specs/features/unified-damage/ui-review/<NN>-<name>-desktop.png` and `-phone.png`):

| # | Shot name | Screen | Setup | What to check |
| --- | --- | --- | --- | --- |
| S1 | `01-enemy-line` | Fight, enemy line | Kael 3★, miniboss `{ element: 'WATER', defense: 11, physicalDefense: 11, magicalDefense: 11, critResistance: 33 }` | Exactly three chips `Water`, `Defesa 11%`, `Crit res 33%`; the defense chip shows the brown shield `#b07a3a` at 12 px, the crit chip the red target; same chip height, spacing and colours as the other chips; the row stays on one line and centred above the monster; the weak chip `Fraco: ...` is unchanged |
| S2 | `02-enemy-line-broken` | Fight, broken defense | Same, `PHYSICAL_BREAK` 5 | Chip reads `Defesa 6%` |
| S3 | `03-talents` | Talentos | Kael, no levels | The `Quebra de defesa` column shows 2 cards per grade under `Grau 1`, `Grau 2`, `Grau 3`; the cards use `talent-break-physical.png` (or its `-g2` / `-g3` file) and `talent-break-crit.png`; the column is shorter than the others and the four columns still align at the top; no empty slot or gap where the magical card was |
| S4 | `04-attributes` | Equipamento attribute panel | Kael, `PHYSICAL_BREAK` 3 | 10 lines, `Quebra de defesa: 3` second to last, no `Tipo de dano`; the panel does not leave a blank line |
| S5 | `05-orina-detail` | Hero detail of Orina | Orina 3★ | `Bônus de líder: +20% de dano total. (em breve)`; the three skill effects of the spec table wrap inside the card without overflow |
| S6 | `06-skill-bar` | Skill bar | Orina 3★ leader | `Líder · +20% de dano total. (em breve)` fits next to the leader name |

**Steps**:

1. Write `game/ui-review/unifiedDamage.shots.js` with one `test` per screen S1 to S6, using `mockBackend`, `openMainMenu`, `fillCredentials` and the `shot` helper as `heroAscension.shots.js` does; name the shots as in the table.
2. Run `cd game && npm run ui:shots -- unifiedDamage`.
3. Fill `ui-review.html` from the template (Portuguese, AD-007): one section per screen with its desktop and phone screenshots, the checks of the table marked pass or fail, and each failure as a finding with the selector, the observed value and the expected value. Verdict `APROVADO` or `MUDANÇAS PEDIDAS`.
4. Add each finding to this file as a new task `T15`, `T16`, ... (owner `game-dev`, with Where, Contract, Tests, Gate, Done when).

**Tests**: none
**Gate**: build - `cd game && npm run ui:shots -- unifiedDamage` exits 0
**Done when**:

- [ ] `ui-review.html` has a section with a desktop and a phone screenshot for each of S1 to S6 and a verdict per check.
- [ ] Every failed check is a new task in this file.

**Commit**: `docs(unified-damage): add the ui review`

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 (Phase 2 entry) | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 (Phase 3 entry) | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 (Phase 4 entry) | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 (Phase 5 entry) | ✅ Match |
| T14 | T13 | T13 → T14 (Phase 6 entry) | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend domain + repository + web | unit + integration | unit + integration | ✅ OK |
| T2 | Backend domain + service + web | unit + integration | unit + integration | ✅ OK |
| T3 | Migration + backend domain + web | unit + integration | unit + integration | ✅ OK |
| T4 | Game domain | unit | unit | ✅ OK |
| T5 | Game scene + CSS + domain | unit | unit | ✅ OK |
| T6 | Game domain | unit | unit | ✅ OK |
| T7 | Game domain | unit | unit | ✅ OK |
| T8 | Game domain | unit | unit | ✅ OK |
| T9 | Game domain (+ view test) | unit | unit | ✅ OK |
| T10 | Game application (+ fixtures) | unit | unit | ✅ OK |
| T11 | e2e fake backend and specs | e2e | e2e | ✅ OK |
| T12 | e2e | e2e | e2e | ✅ OK |
| T13 | Docs | none | none | ✅ OK |
| T14 | UI review | none | none | ✅ OK |

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| UDMG-01 | T4, T8, T12 |
| UDMG-02 | T6, T12 |
| UDMG-03 | T6, T12 |
| UDMG-04 | T6, T7, T12 |
| UDMG-05 | T1 |
| UDMG-06 | T5, T11, T12, T14 |
| UDMG-07 | T2 |
| UDMG-08 | T3 |
| UDMG-09 | T10, T11, T12, T14 |
| UDMG-10 | T3, T11, T12, T14 |
| UDMG-11 | T9, T12, T14 |
| UDMG-12 | T13 |

Tasks per owner: `kotlin-backend-dev` 3 (T1 to T3), `game-dev` 8 (T4 to T10, T13), `test-engineer` 2 (T11, T12), `ui-artist` 1 (T14).
