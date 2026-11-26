# Reset Legacy Drops Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the per-task cycle. This project has no Verifier: the `test-engineer` author check (T10) and the `ui-artist` review (T11) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/reset-legacy-drops/spec.md`
**Design**: `.specs/features/reset-legacy-drops/design.md`
**Status**: Approved by the owner on 2026-11-25 (spec Q1 to Q7 with the recommended defaults, decisions 1 and 2). Runs after `early-game-rebalance`.

Rules for every task: the rules block of `.specs/features/early-game-rebalance/tasks.md` (§ Rules for every task) applies word for word: paths from the repository root, `main/` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/`, `test/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, graphify first, one commit per task checked with `check_commit.py` and ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, files added by path only, task ticked and traceability set to `Implementing` in the same commit, push with `git pull --rebase origin main && git push origin HEAD:main`, re-pins only where listed, e2e flakes rerun alone twice, no full e2e suite, Portuguese player text exactly as the spec, desktop only.

**Constructor changes.** T3, T4 and T5 add a `LegacyRepositoryPort` as the **last** constructor parameter of `AccountResetService`, `WalletService` and `EquipmentRewards`. Every test that builds one of them gets `InMemoryLegacyRepository()` (T2 adds it to `test/Fakes.kt`) as the last argument; find them with `grep -rn "AccountResetService(\|WalletService(\|EquipmentRewards(" backend/src/test`. Today: `AccountResetServiceTest.kt` (the `service` field), `WalletServiceTest.kt:27`, `:37`, `EquipmentRewardsTest.kt:37`, `FarmServiceTest.kt:65`, `ProgressServiceTest.kt:62`. This is a wiring change, not a re-pin: no asserted value changes.

---

## Test Coverage Matrix

> Guidelines found: as in `early-game-rebalance/tasks.md` (`CLAUDE.md`, `.claude/agents/test-engineer.md`, `backend/build.gradle.kts`, `game/vitest.config.js`, `game/playwright.config.js`). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`ResetLegacy.kt`) | unit | 1:1 to Legacy AC 1 to 5, Best AC 1 to 4, Copper AC 1, 4, 6, Pieces AC 1 to 3 and every Edge Case | `test/domain/ResetLegacyTest.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend migration and repository | integration | Table bounds, cascade, upsert, read back, no backfill | `test/adapter/repository/*IT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend services | unit (in-memory fakes) | Reset writes the legacy; wallet boost; piece rarity chapter; refused resets write nothing | `test/service/*Test.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Backend web | integration | `GET /account/legacy`, the reset answer, the wallet queues of a legacy player | `test/adapter/web/*IT.kt` | `cd backend && ./gradlew ktlintCheck test` |
| Game domain and application | unit | Every text of § Player-Facing Texts, the case choice, a malformed payload, the load failure | `game/src/**/*.test.js` | `cd game && npm test` |
| Game adapter (`ClickerGame.js`, `resetView.js`, `style.css`) | e2e | Display AC 1 to 7 | `game/e2e/resetLegacy.spec.js` | `cd game && npx playwright test e2e/resetLegacy.spec.js` |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/resetLegacy.shots.js` | `cd game && npm run ui:shots -- resetLegacy` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | Every backend task | `cd backend && ./gradlew ktlintCheck test` |
| Quick | Game tasks with unit tests only | `cd game && npm test` |
| Full | Tasks that touch the screen or add e2e files | `cd game && npm test && npm run build && npx playwright test <files of the task>` |

---

## Execution Plan

### Phase 1: Backend (kotlin-backend-dev)

```
T1 → T2 → T3
T2 → T4
T2 → T5
```

### Phase 2: Game (game-dev)

```
T6 → T7 → T8
```

### Phase 3: Tests in the browser and author check (test-engineer)

```
T9 → T10
```

### Phase 4: UI review (ui-artist)

```
T11
```

---

## Task Breakdown

### Phase 1: Backend

#### T1: ResetLegacy domain value [x]

**Owner**: kotlin-backend-dev
**Goal**: One pure value holds every legacy rule: the step, the cap, the best, the copper boost and the rarity chapter (RLD-01, RLD-04, RLD-05; spec § Legacy Rules).
**Where**: `main/domain/ResetLegacy.kt` (new)
**Files**:
- Also creates: `test/domain/ResetLegacyTest.kt`
- Read first: `main/domain/DropTable.kt` (whole), `main/domain/Chapter.kt:127-152` (`dropRules`, `coinFactor`, rule ids), `main/domain/ChapterOrder.kt` (`MAX_CHAPTER`), `test/domain/DropTableTest.kt` (style)
**Depends on**: None
**Requirement**: RLD-01, RLD-04, RLD-05

**Contract**:

```kotlin
package br.com.woodriver.infinity_grove_ws.domain

/** One chapter of a legacy: the chapter and its percent (50 or 100). */
data class LegacyChapter(val chapter: Int, val percent: Int)

/**
 * What the resets of a player left (spec reset-legacy-drops): a percent per chapter, 50 or 100, raised by 50 by each reset at that chapter.
 * Only the best one acts: the chapter with the largest percent x coinFactor, the higher chapter on a tie.
 */
data class ResetLegacy(
    val username: String,
    val percents: Map<Int, Int> = emptyMap(),
) {
    init {
        require(percents.keys.all { it in 1..ChapterOrder.MAX_CHAPTER }) { "Legacy chapters of $username must be between 1 and ${ChapterOrder.MAX_CHAPTER}" }
        require(percents.values.all { it == STEP || it == MAX_PERCENT }) { "Legacy percents of $username must be $STEP or $MAX_PERCENT" }
    }

    fun afterReset(chapter: Int): ResetLegacy
    fun best(): LegacyChapter?
    fun chapters(): List<LegacyChapter>
    fun boost(table: DropTable): DropTable
    fun rarityChapter(chapter: Int, chance: () -> Double): Int

    companion object {
        const val STEP = 50
        const val MAX_PERCENT = 100
        const val SEEDED_RULES = 45
        private const val RULES_PER_CHAPTER = 3
    }
}
```

| Function | Rule |
| --- | --- |
| `afterReset(chapter)` | `require(chapter in 1..MAX_CHAPTER)`; returns a copy with `percents[chapter] = min(MAX_PERCENT, (percents[chapter] ?: 0) + STEP)` |
| `best()` | null when `percents` is empty; else the entry with the largest `percent * ChapterDefinition.coinFactor(chapter)`, on a tie the larger `chapter` |
| `chapters()` | `percents` as `LegacyChapter`s ascending by chapter |
| `boost(table)` | `best()` null: `table`. Else a `DropTable` of the same rules in the same order, where a rule with `id in 1..SEEDED_RULES` and a legacy rule `table.ruleFor(RULES_PER_CHAPTER * best.chapter - 2 + (id - 1) % RULES_PER_CHAPTER)` becomes `rule.copy(minCopper = rule.minCopper + best.percent * legacy.minCopper / 100, maxCopper = rule.maxCopper + best.percent * legacy.maxCopper / 100)` (integer division = floor); any other rule unchanged |
| `rarityChapter(chapter, chance)` | `val best = best()`; if `best == null` or `best.chapter <= chapter` return `chapter` **without calling `chance`**; else `if (chance() < best.percent / 100.0) best.chapter else chapter` |

**Tests**: unit
**Test cases** (`ResetLegacyTest.kt`; the table is `DropTable((1..15).flatMap(ChapterDefinition::dropRules))`):

- `a first reset at chapter 5 gives 50 and a second 100`; `a third reset at chapter 5 keeps 100`.
- `a reset at chapter 10 changes only chapter 10` (`{5: 100}.afterReset(10) == {5: 100, 10: 50}`).
- `a reset at chapter 0 or 16 is refused`; `a stored percent of 75 or a chapter 16 is refused`.
- `the best of {5: 100, 10: 50} is 50 percent of chapter 10`; `the best of {10: 100, 15: 50} is 100 percent of chapter 10`; `no legacy has no best`.
- `a tie goes to the higher chapter`: `{1: 100, 2: 50}` (100 x 1 = 50 x 2) -> chapter 2.
- `chapters lists ascending`: `{10: 50, 5: 100}` -> `[LegacyChapter(5, 100), LegacyChapter(10, 50)]`.
- `50 percent of chapter 15 boosts rule 1 to 354..1062, rule 2 to 1416..3540, rule 3 to 5310..12390`.
- `100 percent of chapter 5 boosts rule 1 to 34..102`.
- `50 percent of chapter 2 boosts the chapter 8 phase rule 22 to 258..774`.
- `a rule above 45 keeps its range` (add `DropRule(46, 1, 2, 1500)` to the table).
- `no legacy returns the same table`; `the boost keeps ids and kill intervals`.
- `rarityChapter without legacy or with best at or below the chapter returns the chapter and never reads chance` (a `chance` lambda that fails the test when called).
- `rarityChapter of chapter 2 with 50 percent of chapter 5 is 5 at chance 0.2 and 2 at chance 0.5` (and reads chance once).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] Every case passes; every other backend test passes.

**Commit**: `feat(backend): add the reset legacy rules`

---

#### T2: player_legacy table and repository [x]

**Owner**: kotlin-backend-dev
**Goal**: The legacy of each player is stored per chapter, deleted with the user, and starts empty for every player (RLD-02; spec Legacy AC 7, 8, owner decision 2).
**Where**: `backend/src/main/resources/db/migration/V18__reset_legacy.sql` (new)
**Files**:
- Also creates: `main/port/LegacyRepositoryPort.kt`, `main/adapter/repository/LegacyRepository.kt` (entity, JPA repository, adapter), `test/adapter/repository/LegacyRepositoryIT.kt`
- Also changes: `test/Fakes.kt` (`InMemoryLegacyRepository`), `test/adapter/repository/PreviousBackendCompatibilityIT.kt`
- Read first: `V7__player_resets.sql`, `main/port/ResetRepositoryPort.kt`, `main/adapter/repository/ResetRepository.kt`, `test/adapter/repository/ResetRepositoryIT.kt`, `test/Fakes.kt` (`InMemoryResetRepository`), `PreviousBackendCompatibilityIT.kt` (the `previousReleaseStartsOnMigratedSchema` cases)
**Depends on**: T1
**Requirement**: RLD-02

**Contract**:

```sql
-- The legacy of the account resets (spec reset-legacy-drops, AD-031): a percent per chapter, 50 or 100. Expand only (AD-016): the previous
-- backend never reads this table. No row is created for players who reset before it (owner decision 2): their legacy starts empty.
create table if not exists player_legacy (
    username varchar(255) not null references users (username) on delete cascade,
    chapter  integer      not null check (chapter between 1 and 15),
    percent  integer      not null check (percent in (50, 100)),
    primary key (username, chapter)
);
```

Version: V18 when `early-game-rebalance` (V16, V17) is on `main`; else the next free version, and the counts below drop by 2.

```kotlin
interface LegacyRepositoryPort {
    /** The legacy of the player, empty when they have no row. */
    fun find(username: String): ResetLegacy

    /** Writes every chapter of [legacy] (insert or update); a chapter is never removed. */
    fun save(legacy: ResetLegacy)
}
```

`PlayerLegacyEntity` (`@Table(name = "player_legacy")`, composite id `username` + `chapter` with `@IdClass(PlayerLegacyId::class)`), `JpaPlayerLegacyRepository : JpaRepository<PlayerLegacyEntity, PlayerLegacyId> { fun findAllByUsername(username: String): List<PlayerLegacyEntity> }`, `@Repository class LegacyRepository : LegacyRepositoryPort`. `InMemoryLegacyRepository` in `Fakes.kt`: a `MutableMap<String, ResetLegacy>`.

**Tests**: integration
**Test cases** (`LegacyRepositoryIT.kt`):

- `a player without rows has an empty legacy`.
- `a saved legacy reads back` (`{5: 100, 10: 50}`).
- `saving a raised chapter updates its row` (`{5: 50}` then `{5: 100}`: one row, percent 100).
- `a user deleted takes its legacy rows with it` (count 0 after deleting the user).
- `the table refuses percent 75 and chapter 16` (two `DataIntegrityViolationException`).
- `players with resets before the migration have no legacy rows` (a user with a `player_resets` row: `find` is empty).

**Re-pinned** (`PreviousBackendCompatibilityIT.kt`): each existing case's `futureMigrations` + 1; new case `the release before the reset legacy starts on the migrated schema and its validation ignores V18` with `previousReleaseStartsOnMigratedSchema(lastVersion = 17, futureMigrations = 1)`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 6 cases and the compatibility cases pass; `SchemaValidationIT` passes.

**Commit**: `feat(backend): store the reset legacy`

---

#### T3: The reset writes the legacy and the API answers it [x]

**Owner**: kotlin-backend-dev
**Goal**: A successful reset adds 50 to the chapter it counts; `GET /account/legacy` and the reset answer carry the legacy with the preview of the next reset (RLD-02, RLD-03; spec Legacy AC 1 to 6, Best AC 5 to 7).
**Where**: `main/service/AccountResetService.kt`
**Files**:
- Also changes: `main/usecase/AccountResetUseCase.kt` (`ResetResult.legacy`), `main/adapter/web/AccountResetController.kt` (GET, responses), `test/service/AccountResetServiceTest.kt`, `test/adapter/web/AccountResetControllerIT.kt`
- Also creates: `main/service/LegacyService.kt`, `main/usecase/LegacyUseCase.kt`
- Read first: `AccountResetService.kt` (whole), `AccountReset.kt:9-47`, `AccountResetController.kt` (whole), `test/service/AccountResetServiceTest.kt:20-110`, `test/adapter/web/AccountResetControllerIT.kt` (setup and one success case)
**Depends on**: T2
**Requirement**: RLD-02, RLD-03

**Contract**:

- `AccountResetService` gains the last parameter `private val legacyRepository: LegacyRepositoryPort`. After `resetRepository.save(username, resets)`: `val legacy = legacyRepository.find(username).afterReset(reward); legacyRepository.save(legacy)`; `ResetResult(reward, crystals, resets, start.view(...), legacy)`. The log line gains `legacyChapter={} legacyPercent={}` with `reward` and `legacy.percents[reward]`.
- `usecase/LegacyUseCase.kt`: `data class AfterReset(val chapter: Int, val percent: Int, val best: LegacyChapter?)`, `data class LegacyView(val legacy: ResetLegacy, val afterReset: AfterReset?)`, `interface GetLegacyUseCase { fun legacy(username: String): LegacyView }`.
- `LegacyService(progressRepository, legacyRepository, userRepository) : GetLegacyUseCase` (`@Transactional(readOnly = true)`): `UserNotFoundException` when the user is missing; progress = stored progress (`Progress.start(username)` when none) with `withNextChapterOpen()`; `reward = AccountReset.reward(progress)`; `afterReset = reward?.let { val next = legacy.afterReset(it); AfterReset(it, next.percents.getValue(it), next.best()) }`. A static helper `LegacyView.of(legacy, progress)` is shared with the reset answer.
- Controller: `@GetMapping("/legacy") fun legacy(principal: Principal): LegacyResponse`; `ResetResponse` gains `val legacy: LegacyResponse` built from the reset result with `afterReset` of the progress after the reset (chapter 1, so `null`).

```kotlin
data class LegacyChapterResponse(val chapter: Int, val percent: Int)
data class AfterResetResponse(val chapter: Int, val percent: Int, val best: LegacyChapterResponse?)
data class LegacyResponse(val chapters: List<LegacyChapterResponse>, val best: LegacyChapterResponse?, val afterReset: AfterResetResponse?)
```

**Tests**: unit + integration
**Test cases**:

- `AccountResetServiceTest`: `a first reset from chapter 5 stores 50 percent of chapter 5`; `a second reset from chapter 5 stores 100`; `a third keeps 100 and still pays 5 crystals`; `a completed campaign counts chapter 15`; `a reset from chapter 10 changes only chapter 10` (start `{5: 100}`); `a refused reset from chapter 1 writes no legacy`; `a reset sent from another chapter writes no legacy`; `the result carries the legacy after the reset`.
- `AccountResetControllerIT`: `GET /account/legacy of a player without legacy in chapter 3 answers chapters [], best null and afterReset {3, 50, best {3, 50}}`; `GET /account/legacy of {5: 100, 10: 50} in chapter 12 answers best {10, 50} and afterReset {12, 50, best {12, 50}}`; `GET /account/legacy in chapter 1 answers afterReset null`; `GET /account/legacy without a token answers 401`; `POST /account/reset from chapter 5 answers legacy {chapters [{5, 50}], best {5, 50}, afterReset null}`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 13 new cases pass; every existing reset test passes unchanged except the constructor wiring.

**Deviation (done)**: `LegacyService` is `@Transactional`, not `readOnly = true`: it reads the progress with `findForUpdate`, which Postgres refuses in a read-only transaction (`GET /account/legacy` answered 500 in the IT). The lock lasts one request, like `GET /progress`. `ResetResult.legacy` is the `ResetLegacy`; the controller builds the reset answer with `LegacyView.of(result.legacy, result.view.progress)`. Re-pinned: `AccountResetServiceTest` log case now expects `legacyChapter=4 legacyPercent=50` (the log line gains them, as this task says).

**Commit**: `feat(backend): leave a legacy on every account reset`

---

#### T4: Wallet queues carry the copper legacy [x]

**Owner**: kotlin-backend-dev
**Goal**: The wallet of a player with a legacy rolls and credits from the boosted ranges; the public drop table stays plain (RLD-04; spec Copper AC 1 to 7).
**Where**: `main/service/WalletService.kt`
**Files**:
- Also changes: `test/service/WalletServiceTest.kt`, `test/adapter/web/WalletControllerIT.kt` (new cases)
- Read first: `WalletService.kt` (whole), `main/domain/Wallet.kt:20-60`, `test/service/WalletServiceTest.kt:20-60`, `test/adapter/web/WalletControllerIT.kt:25-60`
**Depends on**: T2
**Requirement**: RLD-04

**Contract**: `WalletService` gains the last parameter `private val legacyRepository: LegacyRepositoryPort`. In `get` and `sync`, the table is `legacyRepository.find(username).boost(dropRules.findAll())` and is passed to `load`, `credit` and `dropsFor`. `dropTable()` stays `dropRules.findAll()`.

**Tests**: unit + integration
**Test cases**:

- `WalletServiceTest`: `a player with 50 percent of chapter 15 gets queues of rule 1 inside 354..1062`; `a player with no legacy keeps today's ranges`; `a legacy raised after the wallet was opened re-rolls the queues on the next get`; `a sync of 3 kills of rule 1 with 100 percent of chapter 5 credits 3 values inside 34..102`; `the allowance stays 20 and refills one per 1500 ms` (existing allowance case run with a legacy); `the drop table answers the plain ranges`.
- `WalletControllerIT`: `GET /wallet of a player with legacy {15: 50} answers drops 1 all inside 354..1062` (insert the legacy row with `jdbc`).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 7 new cases pass; every existing wallet test passes.

**Commit**: `feat(backend): pay the copper legacy on every kill`

---

#### T5: Pieces roll with the legacy rarity [x]

**Owner**: kotlin-backend-dev
**Goal**: A piece that drops below the best legacy chapter uses that chapter's rarity weights with the legacy's chance (RLD-05; spec Pieces AC 1 to 5).
**Where**: `main/service/EquipmentRewards.kt`
**Files**:
- Also changes: `test/service/EquipmentRewardsTest.kt`
- Read first: `EquipmentRewards.kt` (whole), `main/domain/PieceRoller.kt:1-60` (weights and the chance order), `test/service/EquipmentRewardsTest.kt` (scripted chances)
**Depends on**: T2
**Requirement**: RLD-05

**Contract**: `EquipmentRewards` gains the last parameter `private val legacyRepository: LegacyRepositoryPort`. In `award`: `val rarityChapter = legacyRepository.find(username).rarityChapter(chapter, chanceRoller::roll)` before the roll, then `PieceRoller.roll(encounter, rules, username, ids.next(), chanceRoller::roll, rarityChapter)`. The log line `Equipment dropped` gains `rarityChapter={}`. `PieceRoller` does not change.

**Tests**: unit
**Test cases** (`EquipmentRewardsTest.kt`; script the chance sequence as the file does: the legacy roll first when it applies, then the drop, the rarity, the slot ...):

- `a chapter 2 boss piece with 50 percent of chapter 5 and legacy roll 0.2 rolls the chapter 5 weights` (rarity chance 0.97 gives LEGENDARY in the chapter 5 table: weights 40 / 40 / 15 / 5).
- `the same piece with legacy roll 0.5 rolls the chapter 2 weights` (rarity chance 0.97 gives UNCOMMON).
- `a piece in chapter 6 with 100 percent of chapter 5 makes no legacy roll` (the scripted sequence of an existing case, unchanged, gives the same piece).
- `a player without legacy rolls exactly as today` (an existing scripted case, unchanged).
- `a farm piece of chapter 1 with 100 percent of chapter 5 uses the chapter 5 weights` (legacy roll 0.99 < 1.0).
- `the drop rate stays 0.5 for a miniboss` (drop chance 0.5 gives no piece with a legacy).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 6 cases pass; every existing equipment, farm and progress test passes unchanged except the constructor wiring.

**Commit**: `feat(backend): roll pieces with the legacy rarity`

---

### Phase 2: Game

#### T6: Legacy texts in the game domain [x]

**Owner**: game-dev
**Goal**: The game reads the legacy payload and writes every text of the spec, with the case choice of the reset dialog (RLD-06; spec § Player-Facing Texts, Display AC 3 to 5).
**Where**: `game/src/domain/campaign/resetLegacy.js` (new)
**Files**:
- Also creates: `game/src/domain/campaign/resetLegacy.test.js`
- Read first: `game/src/domain/campaign/accountReset.js`, `game/src/domain/campaign/accountReset.test.js`
**Depends on**: None
**Requirement**: RLD-06

**Contract**:

```js
//  The legacy of the account resets (spec reset-legacy-drops) as GET /account/legacy answers it:
//  { chapters: [ { chapter, percent } ], best: { chapter, percent } | null, afterReset: { chapter, percent, best } | null }.
//  The backend picks the best and the preview; the game types no coin number (AD-011). Pure JavaScript: no Phaser.
export const legacyOf = (payload) => { /* null unless chapters is an array and best / afterReset are null or objects with integer chapter and percent */ };
export const legacyLineText = (legacy) => { /* 'Legado: nenhum' | 'Legado: <p>% do capítulo <c>' */ };
export const legacyDetailText = (legacy) => { /* the two detail texts */ };
//  The line of the reset dialog: case C, A, B in that order (spec § Player-Facing Texts); null when afterReset is null
export const resetLegacyText = (legacy) => { /* ... */ };
```

Case C when `chapters` holds `{ chapter: afterReset.chapter, percent: 100 }`; case A when `afterReset.best.chapter === afterReset.chapter`; else case B (with `legacy.best`).

**Tests**: unit
**Test cases** (`resetLegacy.test.js`):

- `legacyOf` keeps a valid payload; gives null for `undefined`, `{}`, `chapters` not a list, `best: { chapter: '5', percent: 50 }`.
- `legacyLineText`: `Legado: nenhum` (best null); `Legado: 50% do capítulo 10`.
- `legacyDetailText`: the best text `Cada abate rende mais 50% das moedas do capítulo 10, e cada peça tem 50% de chance de vir com a raridade do capítulo 10.`; none: `Resete a conta para ganhar moedas e peças melhores nas próximas jornadas.`
- `resetLegacyText` case A with none: `Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).`; case A with a best: `{5: 50}` in chapter 10 -> `Legado depois do reset: 50% do capítulo 10 (hoje: 50% do capítulo 5).`; case B: `{10: 50}` in chapter 5 -> `Este reset sobe o legado do capítulo 5 para 50%. O melhor legado continua 50% do capítulo 10.`; case C: `{5: 100}` in chapter 5 -> `O legado do capítulo 5 já está em 100%: este reset não muda o seu legado.`; `afterReset: null` -> null.

**Gate**: `cd game && npm test`
**Done when**:

- [x] Every case passes; every other unit test passes.

**Commit**: `feat(game): write the reset legacy texts`

---

#### T7: The game loads and keeps the legacy [x]

**Owner**: game-dev
**Goal**: The game reads `GET /account/legacy`, keeps the last good value, and takes the legacy of a reset answer (RLD-06; spec Display AC 6, 7).
**Where**: `game/src/application/accountReset/resetLegacy.js` (new)
**Files**:
- Also changes: `game/src/adapters/http/accountResetApi.js` (`legacy()`), `game/src/application/accountReset/accountReset.js` (port `legacy`, `adopt` after a reset), `game/src/application/accountReset/accountReset.test.js`, `game/src/composition.js` (wire the service), 
- Also creates: `game/src/application/accountReset/resetLegacy.test.js`
- Read first: `accountResetApi.js`, `accountReset.js`, `accountReset.test.js`, `composition.js:17-70`
**Depends on**: T6
**Requirement**: RLD-06

**Contract**:

```js
//  The legacy the scene shows (spec reset-legacy-drops). Port: gateway { legacy() } resolves with the payload of GET /account/legacy.
export const createResetLegacy = ({ gateway }) =>
{
    let current = null;

    return {
        //  A failure (404 of an old backend included) keeps the last good value, null at first
        load: async () => { try { current = legacyOf(await gateway.legacy()) ?? current; } catch { /* keep */ } return current; },
        adopt: (payload) => { current = legacyOf(payload) ?? current; },
        state: () => current
    };
};
```

`accountResetApi.js`: `legacy: async () => (await httpClient.get('/account/legacy')).data`. `createAccountReset({ gateway, session, autoClick, talents, legacy })`: after `autoClick.adoptReset(answer)`, `legacy?.adopt(answer.legacy)`. `composition.js`: one shared `resetLegacy = createResetLegacy({ gateway: accountResetApi })`, passed to `createAccountReset` and exported for the scene (`services.resetLegacy`).

**Tests**: unit
**Test cases**:

- `resetLegacy.test.js`: `load keeps the answer`; `a failed load keeps the last value`; `a failed first load leaves null`; `adopt takes a valid payload and ignores a malformed one`.
- `accountReset.test.js`: `a successful reset hands its legacy to the legacy service`; `a refused reset hands nothing`.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 6 cases pass; every other unit test passes.

**Commit**: `feat(game): load and keep the reset legacy`

---

#### T8: The legacy line and the reset dialog line [x]

**Owner**: game-dev
**Goal**: The auto click window shows the legacy line and its detail above `Resetar conta`, and the reset dialog shows what the reset changes (RLD-06; spec Display AC 1 to 7, design § Layout).
**Where**: `game/src/adapters/phaser/views/resetView.js`
**Files**:
- Also changes: `game/src/adapters/phaser/ClickerGame.js` (load, `showAutoClick`, `showResetDialog`), `game/public/style.css` (three rules after `.reset-account`), `game/src/adapters/phaser/views/resetView.test.js` if it exists (else create it)
- Read first: `resetView.js` (whole), `ClickerGame.js:300-345` (`showAutoClick`), `:397-500` (dialog, `confirmReset`, `loadAutoClick`), `style.css` `.auto-click-popover` and `.reset-account`, `.reset-card`, `.reset-question`
**Depends on**: T7
**Requirement**: RLD-06

**Contract**:

- `resetView.js`: `renderLegacyLine(legacy)` returns `[ el('div', 'legacy-line', legacyLineText(legacy), { testid: 'legacy-line' }), el('div', 'legacy-detail', legacyDetailText(legacy), { testid: 'legacy-detail' }) ]`; `renderResetDialog({ reward, busy, error, legacyText = null })` pushes `el('div', 'reset-legacy', legacyText, { testid: 'reset-legacy' })` right after the question when `legacyText` is a string.
- `ClickerGame`: `this.legacy = services.resetLegacy`; `loadAutoClick` also runs `this.legacy.load().then(() => this.sys.isActive() && this.showAutoClick())`; `showAutoClick` puts `...renderLegacyLine(this.legacy.state())` before `renderResetButton(reward)` when `this.legacy.state()` is not null and the reset button shows, and when it is not null and the reset is closed (chapter 1 after a reset) it shows the line too; `showResetDialog` passes `legacyText: this.legacy.state() ? resetLegacyText(this.legacy.state()) : null`; `openResetDialog` calls `this.legacy.load()` and redraws the dialog when it answers (the preview follows the chapter).
- Stylesheet:

```css
/* The legacy of the account resets in the auto click window (spec reset-legacy-drops) */
.legacy-line {
    grid-column: 1 / -1;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 700;
    color: var(--ink-900);
}

.legacy-detail {
    grid-column: 1 / -1;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.35;
    color: var(--ink-600);
}

.reset-legacy {
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
    color: var(--ember-800);
}
```

If `.auto-click-popover` is not a grid, drop `grid-column` and give both lines `width: 100%`.

**Tests**: unit (view) + e2e regression
**Test cases** (`resetView.test.js`): `renderLegacyLine writes the line and the detail with their test ids`; `renderResetDialog puts the legacy line after the question`; `renderResetDialog without legacyText draws no legacy line`.

**Gate**: `cd game && npm test && npm run build && npx playwright test e2e/accountReset.spec.js e2e/autoClick.spec.js`
**Done when**:

- [x] The 3 cases pass; `accountReset.spec.js` and `autoClick.spec.js` pass unchanged (the fake backend answers 404 to `GET /account/legacy` until T9, so no line shows there).

**Commit**: `feat(game): show the reset legacy`

---

#### T8a: Clear the reset legacy on logout [x]

**Owner**: game-dev
**Goal**: The shared `resetLegacy` (T7) belongs to one player: a logout or a login as another player drops it, so no line shows until the new player's own load answers; "keep the last good value" holds only within one session of one player (RLD-06; spec Display AC 7). Fix of a defect of T7 found while reporting it: the previous player's legacy stayed on screen after a logout and login.
**Where**: `game/src/application/accountReset/resetLegacy.js`
**Files**:
- Also changes: `game/src/application/session/sessionManager.js` (`onChange(listener)`, called by `start` and by the end of a session: logout, a 401 on refresh), `game/src/composition.js` (`sessionManager.onChange(resetLegacy.clear)`), `game/src/application/accountReset/resetLegacy.test.js`, `game/src/application/session/sessionManager.test.js`, `game/src/composition.test.js`
**Depends on**: T8
**Requirement**: RLD-06

**Contract**: `resetLegacy.clear()` sets the state to `null` and discards a `load` that was still in flight (it belongs to the previous player). `sessionManager.onChange(listener)` calls the listener on `start` and whenever the session is forgotten; `restore` and a refresh that works stay quiet.

**Tests**: unit (`resetLegacy.test.js`: clear drops the value and a failed load of the next player leaves null; a load answering after a clear is dropped; a load started after the clear keeps its answer. `sessionManager.test.js`: the listener hears a login, a logout also when the server call fails, a 401 on refresh; not a restore. `composition.test.js`: a login drops the legacy of the shared service.)

**Gate**: `cd game && npm test && npx playwright test e2e/accountReset.spec.js e2e/autoClick.spec.js`
**Done when**:

- [x] The new cases pass; every other unit test and the two e2e files pass.

**Commit**: `fix(game): clear the reset legacy on logout`

---

### Phase 3: Tests in the browser and author check

#### T9: The legacy in the browser [x]

**Owner**: test-engineer
**Goal**: The legacy line, the three dialog cases and the update after a reset work in the browser, and an old backend shows nothing (RLD-06; spec Display AC 1 to 7).
**Where**: `game/e2e/resetLegacy.spec.js` (new)
**Files**:
- Also changes: `game/e2e/support/fakeBackend.js` (legacy state, `GET /account/legacy`, `legacy` on the reset answer)
- Read first: `game/e2e/accountReset.spec.js` (start, open the window and the dialog), `fakeBackend.js:400-485` (auto click and reset routes), spec § Legacy Rules (the fake mirrors the best choice: `coinFactor(c) = c <= 8 ? 2^(c-1) : 128 + 32(c - 8)`)
**Depends on**: T8, T3
**Requirement**: RLD-06

**Contract** (fake backend): option `legacy: { yan: { 5: 100 } }` (default `{}`), option `legacyEndpoint: false` answers 404; `GET /account/legacy` and the reset answer build `{ chapters, best, afterReset }` with the spec rules; a reset raises the reward chapter by 50 (cap 100).

**Tests**: e2e
**Test cases**:

- `the window reads Legado: nenhum and the reset hint with no legacy`.
- `the window reads Legado: 100% do capítulo 5 and its detail with {5: 100}`.
- `the dialog in chapter 3 with no legacy reads Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).`
- `the dialog in chapter 5 with {10: 50} reads case B`.
- `the dialog in chapter 5 with {5: 100} reads case C`.
- `after a reset from chapter 5 the window reads Legado: 50% do capítulo 5 at once`.
- `with the endpoint missing the window and the dialog show no legacy line and the reset works`.
- `the legacy lines use their fonts and colours` (`toHaveCSS`: `.legacy-line` 13px 700 `rgb(...)` of `--ink-900`; `.reset-legacy` 15px 700 `--ember-800`; read the expected rgb from `getComputedStyle(document.documentElement)`).

**Gate**: `cd game && npm test && npx playwright test e2e/resetLegacy.spec.js e2e/accountReset.spec.js`
**Done when**:

- [x] The 8 cases pass; `accountReset.spec.js` passes.

**Commit**: `test(game): pin the reset legacy in the browser`

---

#### T10: Author check [ ]

**Owner**: test-engineer
**Goal**: Every AC and edge case of the spec has a test asserting its spec value, and the tests kill the injected faults (RLD-01 to RLD-06).
**Where**: `.specs/features/reset-legacy-drops/tasks.md` (§ Author check, appended)
**Files**:
- Read first: `.claude/agents/test-engineer.md`, the spec, the tests of T1 to T9, `scripts/sensor.mjs`
**Depends on**: T9
**Requirement**: RLD-01, RLD-02, RLD-03, RLD-04, RLD-05, RLD-06

**Steps**: map each AC and edge case to its test (`file:line`); run with `node scripts/sensor.mjs` at least: (a) `afterReset` without the cap 100; (b) `best()` by percent only (no `coinFactor`); (c) `boost` with the legacy rule of kind `id % 3` instead of `(id - 1) % 3`; (d) `rarityChapter` reading `chance` when `best <= chapter`; (e) the reset saving the legacy before the `fromChapter` check; (f) `resetLegacyText` choosing case A before case C. Append § Author check with the table and the results.

**Tests**: e2e + unit (runs the suites, writes no production code)
**Gate**: `cd backend && ./gradlew test && cd ../game && npm test && npx playwright test e2e/resetLegacy.spec.js`
**Done when**:

- [ ] Every AC and edge case maps to a test; every mutant is killed or a fix task is listed.

**Commit**: `test: author check of the reset legacy`

---

### Phase 4: UI review

#### T11: UI review of the legacy lines [ ]

**Owner**: ui-artist
**Goal**: The legacy line, its detail and the dialog line read well in the auto click window and the reset dialog (RLD-06).
**Where**: `game/ui-review/resetLegacy.shots.js` (new)
**Files**:
- Also creates: `.specs/features/reset-legacy-drops/ui-review.html` (from `.claude/templates/ui-review.html`), `.specs/features/reset-legacy-drops/ui-review/*.png`
- Read first: `game/ui-review/` (an existing shots file of the auto click window), spec § Player-Facing Texts, design § Layout
**Depends on**: T10
**Requirement**: RLD-06

**Shots** (desktop 1280 x 720): `01-window-no-legacy`, `02-window-legacy-100-ch5`, `03-dialog-case-a-none`, `04-dialog-case-b`, `05-dialog-case-c`, `06-window-after-reset`.

**Check against**: the line and detail inside the 240 px window above `Resetar conta`, no clipped text, 13 / 12 px Figtree with `--ink-900` / `--ink-600` on parchment; the dialog line 15 px `--ember-800` between the question and the buttons inside the 420 px card.

**Tests**: none (review artifact; findings become tasks)
**Gate**: `cd game && npm run ui:shots -- resetLegacy`
**Done when**:

- [ ] `ui-review.html` lists the 6 shots with `APROVADO` or the findings as new tasks.

**Commit**: `docs(ui): review the reset legacy lines`

---

## Validation Tables

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | Phase 1 start | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T2 | T2 → T4 | ✅ Match |
| T5 | T2 | T2 → T5 | ✅ Match |
| T6 | None | Phase 2 start | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8, T3 (phase 1) | Phase 3 start | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 (phase 3) | Phase 4 | ✅ Match |

### Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| ---- | ---------- | --------------- | --------- | ------ |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Migration + repository | integration | integration | ✅ OK |
| T3 | Services + web | unit + integration | unit + integration | ✅ OK |
| T4 | Service + web | unit + integration | unit + integration | ✅ OK |
| T5 | Service | unit | unit | ✅ OK |
| T6 | Game domain | unit | unit | ✅ OK |
| T7 | Game application + http | unit | unit | ✅ OK |
| T8 | Game adapter | e2e | unit (view) + e2e regression; behaviour pinned by T9 under the owner split (`CLAUDE.md` § Agent team) | ✅ OK |
| T9 | e2e | e2e | e2e | ✅ OK |
| T10 | check | - | e2e + unit runs | ✅ OK |
| T11 | UI review artifact | none | none | ✅ OK |
