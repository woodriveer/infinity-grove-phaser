# Hero Team Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/hero-team/spec.md`
**Design**: `.specs/features/hero-team/design.md`
**Status**: Approved by the owner (2026-11-19), with Q45 and Q46 answered as the recommended defaults; no task changes. Written against `main` at `7de3208`; line numbers below were read that day.

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root. `<main>` is `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `<test>` is `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`.
- `graphify-out/graph.json` exists: run `graphify query "<question>"` before your first search of the code, and read raw files only for the lines the graph or this file located (`CLAUDE.md`).
- Line numbers drift once an earlier task edits a file: find each edit by the test name or the exact text quoted here, not by the number alone.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`; never stage `graphify-out/`. If a file you must change already has changes you did not make, STOP and report it.
- Mark the task `[x]` in this file in the same commit. Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- **If a test that the task does not name fails, STOP and report its file, name and failure. Do not edit it.** Never weaken, skip or delete a test.
- Decimal expectations use `toBeCloseTo(value, 9)` in Vitest and `toBeCloseTo(value, 5)` in Playwright unless the task gives another precision; Kotlin uses exact integers here.
- Every new player-facing text is Portuguese and copied from spec § Player-Facing Texts, character for character (AD-007, L-010).
- Words used below: **team payload** = the `team` object of the spec Contract row (`{ unlocked, openSlots, boughtSlots, slotPrices, allies }`); **locked team** = `{ unlocked: false, openSlots: 0, boughtSlots: 0, slotPrices: [10000, 20000, 30000, 40000], allies: [null, null, null, null] }`.

---

## Owner Questions (open)

Q45 and Q46 were answered on 2026-11-19 with the recommended defaults below, so the tasks stand as written. Kept for traceability:

| Question | Default used | Tasks that change with another answer |
| --- | --- | --- |
| Q45 Erosão Arcana and Lâminas Sombrias | Orina `-15 de defesa dos inimigos` (every hit); Vex `-15 de resistência a crítico dos inimigos` (leader's hits) | T7 (`PASSIVES`, `teamPassives`), T9 (`monsterAfterBreak`), T12 (`leaderStats`), T17 (passive text in cards), T25 (Vex and Orina scenarios) |
| Q46 Effects on ally hits | Ally hit = `tickDamage` at 100 %: defense, breaks, Erosão, Brado, Prisão, Bênção, own armor pierce and boss damage; no critical, combo, click bonus or leader power | T10 (`allyHit` and E6 to E14), T24 (one-damage scenarios) |

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit for service/domain, e2e for every player-visible behaviour), `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), `game/ui-review.config.js` (shots at 1280x720 and 390x844). No coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Team`, `TeamView`, exceptions) | unit | Every rule and check order of `buy`, `withAllies`, `afterLeaderChange`; every row of `openSlots` and the prices | `<test>/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service (`HeroService`, `TeamService`) | unit (in-memory fakes) | Every AC of the backend stories at service level; nothing stored on a refusal | `<test>/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository, migration and web | integration (Testcontainers) | Table bounds and constraints (lower and upper, L-022), cascade with the user, the previous release on the migrated schema (L-080), every route: happy path, each error code, check order, 401, isolation, concurrency (L-015, L-033), reset | `<test>/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain | unit | E1 to E15, P1 to P10, every star multiplier, every slot state, every passive row, every edge case of the spec | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game application and http adapter | unit | Every new call, payload shape, failure and listener | `game/src/application/**/*.test.js`, `game/src/adapters/http/*.test.js` | `cd game && npm test` |
| Game scene and views | unit (jsdom) | Every exact text, state, attribute and order of the Equipe screen; the scene's tick order, kill path, number style, passives, formation sizes and tweens | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| e2e | e2e (Playwright, fake backend) | Every player-visible AC and edge case of the spec (L-062, L-099) | `game/e2e/heroTeam*.spec.js` | `cd game && npx playwright test` |
| Docs (`backend/docs/adr/0013-hero-team.md`, `README.md`) | none | Read by the product owner | - | build gate only |
| UI review | none | `ui-artist` review (T27) | `.specs/features/hero-team/ui-review.html` | `cd game && npm run ui:shots -- heroTeam` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After game tasks with unit tests only | `cd game && npm test` |
| Full | After backend tasks and e2e tasks | backend: `cd backend && ./gradlew ktlintCheck test`; game: `cd game && npm test && npx playwright test` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. The backend chain (T1 to T6) and the game chain (T7 to T20) do not depend on each other (design § Deploy Order: either order is safe), so the orchestrator may run them in two worktrees; the e2e chain starts after T20. Every commit is safe to deploy alone.

### Phase 1: Backend domain and storage

```
T1 → T2
```

### Phase 2: Backend API and docs

```
T2 → T3 → T4 → T5 → T6
```

### Phase 3: Game combat domain

```
T7 → T8 → T9 → T10 → T11 → T12
```

### Phase 4: Game application

```
T12 → T13 → T14
```

### Phase 5: Game combat scene

```
T14 → T15 → T16
```

### Phase 6: Game Equipe screen

```
T16 → T17 → T18 → T19 → T20
```

### Phase 7: e2e

```
T20 → T21 → T22 → T23 → T24 → T25 → T26
```

### Phase 8: Visual review

```
T26 → T27
```

---

## Task Breakdown

### T1: Add the `Team` domain value [x]

**Owner**: kotlin-backend-dev
**Goal**: Add the team of one player (bought slots, four ally entries) with the rules of a purchase, a save and a leader change, its view and its exceptions (TEAM-01, TEAM-02, TEAM-03, TEAM-04).
**Where**: `<main>/domain/Team.kt` (new)
**Also changes**: `<main>/domain/TeamExceptions.kt` (new), `<test>/domain/TeamTest.kt` (new)
**Read first**: `<main>/domain/AutoClick.kt` (ordered checks and logging of `PlayerAutoClick.upgrade`), `<main>/domain/AutoClickExceptions.kt`, `<main>/domain/HeroExceptions.kt`, `<main>/domain/BossRecord.kt`, `<main>/domain/PlayerCards.kt` (`owned`, `leaderId`, `bosses`), `<test>/domain/PlayerCardsTest.kt` (test style), design § Backend `Team` and § Backend team exceptions
**Depends on**: None
**Requirement**: TEAM-01, TEAM-02, TEAM-03, TEAM-04

**Contract**:

```kotlin
// TeamExceptions.kt
package br.com.woodriver.infinity_grove_ws.domain

/** A team body the client built wrongly: not 4 entries, an entry that is not a hero id or null, a hero twice, the leader (400). */
class InvalidTeamException(
    reason: String,
) : HeroRequestException("INVALID_TEAM", "The team is invalid: $reason")

/** A slot purchase the client built wrongly: `fromSlots` missing, not an integer or negative (400). */
class InvalidTeamSlotRequestException(
    reason: String,
) : HeroRequestException("INVALID_TEAM_SLOT_REQUEST", "The slot purchase is invalid: $reason")

/** The player never won the chapter 5 boss, so the team cannot be saved yet (409). */
class TeamLockedException : HeroConflictException("TEAM_LOCKED", "The team opens with the first win of the chapter 5 boss")

/** A hero sits in ally slot [slot], which the player has not bought (409). */
class TeamSlotNotBoughtException(
    slot: Int,
) : HeroConflictException("TEAM_SLOT_NOT_BOUGHT", "Ally slot $slot is not bought")

/** Every open slot is bought; the next one opens with the next chapter boss (409). */
class TeamSlotLockedException : HeroConflictException("TEAM_SLOT_LOCKED", "The next ally slot is not open yet")

/** All 4 ally slots are bought (409). */
class TeamSlotsMaxException : HeroConflictException("TEAM_SLOTS_MAX", "All 4 ally slots are bought")

/** The player saw another bought count than the stored one: a repeated or stale request. [current] is the stored team (409). */
class TeamSlotMismatchException(
    val current: TeamView,
    sent: Int,
) : HeroConflictException(
        "TEAM_SLOT_MISMATCH",
        "The team has ${current.boughtSlots} bought slots, the request was made for $sent",
    )
```

```kotlin
// Team.kt
package br.com.woodriver.infinity_grove_ws.domain

import org.slf4j.LoggerFactory

/**
 * The ally slots one player bought and the hero in each (spec hero-team). Index 0 of [allies] is ally slot 1; an entry is a hero id
 * or null. Every change returns a new value; the services store it under the `player_cards` row lock.
 */
data class Team(
    val boughtSlots: Int = 0,
    val allies: List<String?> = EMPTY_ALLIES,
) {
    init {
        require(boughtSlots in 0..MAX_ALLIES) { "Bought slots $boughtSlots must be between 0 and $MAX_ALLIES" }
        require(allies.size == MAX_ALLIES) { "A team has $MAX_ALLIES ally entries, got ${allies.size}" }
        require(allies.drop(boughtSlots).all { it == null }) { "Allies $allies sit in slots that are not bought ($boughtSlots bought)" }
        require(allies.filterNotNull().let { it.size == it.toSet().size }) { "Allies $allies name a hero twice" }
    }

    /**
     * Buys the next ally slot. [fromSlots] is the bought count the player saw. The checks run in order: request, mismatch, max,
     * locked; a refusal changes nothing. The price is taken by the service.
     */
    fun buy(
        username: String,
        fromSlots: Int,
        bosses: BossRecord,
    ): Team {
        // 1. fromSlots < 0: logger.warn("Team slot purchase refused, invalid request username={} fromSlots={}", ...);
        //    throw InvalidTeamSlotRequestException("fromSlots must be an integer of at least 0")
        // 2. fromSlots != boughtSlots: logger.warn("Team slot purchase refused, mismatch username={} sent={} stored={}", ...);
        //    throw TeamSlotMismatchException(TeamView.of(this, bosses), fromSlots)
        // 3. boughtSlots == MAX_ALLIES: logger.warn("Team slot purchase refused, max username={}", ...); throw TeamSlotsMaxException()
        // 4. boughtSlots >= openSlots(bosses): logger.warn("Team slot purchase refused, locked username={} bought={} open={}", ...);
        //    throw TeamSlotLockedException()
        // 5. return copy(boughtSlots = boughtSlots + 1)
    }

    /**
     * The team with [allies] (4 entries, index 0 = slot 1) in place of the current ones. [known] tells whether an id is in the
     * catalog. The checks run in order: invalid, not found, locked, not bought, not owned; a refusal changes nothing.
     */
    fun withAllies(
        allies: List<String?>,
        cards: PlayerCards,
        known: (String) -> Boolean,
    ): Team {
        // 1. allies.size != MAX_ALLIES -> InvalidTeamException("allies must have $MAX_ALLIES entries")
        // 2. a non-null id twice -> InvalidTeamException("hero <id> is named twice")
        // 3. cards.leaderId among the non-null ids -> InvalidTeamException("hero <id> is the leader")
        // 4. the first non-null id with !known(id) -> HeroNotFoundException(id)
        // 5. !unlocked(cards.bosses) -> TeamLockedException()
        // 6. the first index i >= boughtSlots with allies[i] != null -> TeamSlotNotBoughtException(i + 1)
        // 7. the first non-null id with !cards.owned(id) -> HeroNotOwnedException(id)
        // each refusal: logger.warn("Team save refused username={} code={}", cards.username, <code>) before the throw
        // 8. return copy(allies = allies.toList())
    }

    /** The team after [newLeaderId] took the lead from [oldLeaderId]: the slot of the new leader takes the old one; otherwise unchanged. */
    fun afterLeaderChange(
        oldLeaderId: String,
        newLeaderId: String,
    ): Team {
        val index = allies.indexOf(newLeaderId)
        if (index < 0 || oldLeaderId == newLeaderId) return this
        return copy(allies = allies.toMutableList().also { it[index] = oldLeaderId })
    }

    companion object {
        private val logger = LoggerFactory.getLogger(Team::class.java)
        const val MAX_ALLIES = 4

        /** The copper of ally slots 1 to 4 (1, 2, 3 and 4 ouro). */
        val SLOT_PRICES: List<Long> = listOf(10_000L, 20_000L, 30_000L, 40_000L)

        /** The chapter whose first boss win opens ally slots 1 to 4. */
        val SLOT_CHAPTERS: List<Int> = listOf(5, 6, 7, 8)
        val EMPTY_ALLIES: List<String?> = listOf(null, null, null, null)

        fun unlocked(bosses: BossRecord) = bosses.hasWon(SLOT_CHAPTERS.first())

        fun openSlots(bosses: BossRecord) = SLOT_CHAPTERS.count { bosses.hasWon(it) }
    }
}

/** The team as the player sees it: whether it is unlocked, the open and bought slots, their prices and the allies. */
data class TeamView(
    val unlocked: Boolean,
    val openSlots: Int,
    val boughtSlots: Int,
    val slotPrices: List<Long>,
    val allies: List<String?>,
) {
    companion object {
        fun of(
            team: Team,
            bosses: BossRecord,
        ) = TeamView(Team.unlocked(bosses), Team.openSlots(bosses), team.boughtSlots, Team.SLOT_PRICES, team.allies)
    }
}

/** A leader change or a team save: the leader and the team after it. */
data class LeaderChange(
    val leaderId: String,
    val team: TeamView,
)
```

The numbered comments are the body to write, in that order; keep the KDoc.

**Steps**:

1. Create `TeamExceptions.kt` with the six classes exactly as above.
2. Create `Team.kt` with `Team`, `TeamView` and `LeaderChange`; write the bodies of `buy` and `withAllies` from their numbered comments.
3. Create `TeamTest.kt` with the cases below. Fixture: `cards(cleared: Set<Int>) = PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael", 0) to 1, CopyKey("lyra", 0) to 1, CopyKey("orina", 0) to 1, CopyKey("seraphine", 0) to 1), BossRecord(cleared))` (Vex not owned) and `known = { id: String -> id in setOf("kael", "lyra", "orina", "seraphine", "vex") }`.
4. Run the gate.

**Tests**: unit
**Test cases** (`TeamTest.kt`, exact names):

- `a new team has no bought slot and four empty entries`: `Team()` → `boughtSlots` 0, `allies` `[null, null, null, null]`.
- `a team refuses -1 and 5 bought slots`: `Team(-1)` and `Team(5)` each throw `IllegalArgumentException` (two assertions).
- `a team refuses a hero in a slot that is not bought`: `Team(1, listOf("lyra", "orina", null, null))` throws `IllegalArgumentException`.
- `a team refuses the same hero twice`: `Team(2, listOf("lyra", "lyra", null, null))` throws `IllegalArgumentException`.
- `the team is unlocked once chapter 5 is cleared`: `unlocked(BossRecord(setOf(1, 2, 3, 4)))` false; `unlocked(BossRecord(setOf(5)))` true.
- `openSlots counts the cleared chapters 5 to 8`: one assertion per row: `{}` → 0, `{1, 2, 3, 4}` → 0, `{5}` → 1, `{5, 6}` → 2, `{5, 6, 7}` → 3, `{5, 6, 7, 8}` → 4, `{1, 5, 6, 7, 8, 9, 15}` → 4.
- `the slot prices are 10000, 20000, 30000 and 40000 copper`: `Team.SLOT_PRICES == listOf(10_000L, 20_000L, 30_000L, 40_000L)`.
- `buy from 0 with chapter 5 cleared gives 1 bought slot`: `Team().buy("yan", 0, BossRecord(setOf(5)))` == `Team(1)`.
- `buy keeps the allies`: `Team(1, listOf("lyra", null, null, null)).buy("yan", 1, BossRecord(setOf(5, 6)))` == `Team(2, listOf("lyra", null, null, null))`.
- `buy with a negative fromSlots is INVALID_TEAM_SLOT_REQUEST`: `Team().buy("yan", -1, BossRecord(setOf(5)))` throws `InvalidTeamSlotRequestException` with `code` `INVALID_TEAM_SLOT_REQUEST`.
- `buy with a stale fromSlots is TEAM_SLOT_MISMATCH carrying the stored team`: `Team(1).buy("yan", 0, BossRecord(setOf(5, 6)))` throws `TeamSlotMismatchException`; `current` == `TeamView(true, 2, 1, Team.SLOT_PRICES, listOf(null, null, null, null))`.
- `buy at 4 bought slots is TEAM_SLOTS_MAX`: `Team(4).buy("yan", 4, BossRecord(setOf(5, 6, 7, 8)))` throws `TeamSlotsMaxException`.
- `buy with every open slot bought is TEAM_SLOT_LOCKED`: `Team(1).buy("yan", 1, BossRecord(setOf(5)))` throws `TeamSlotLockedException`.
- `buy on a team that never won the chapter 5 boss is TEAM_SLOT_LOCKED`: `Team().buy("yan", 0, BossRecord(setOf(1, 2, 3, 4)))` throws `TeamSlotLockedException`.
- `buy checks the mismatch before the max`: `Team(4).buy("yan", 3, BossRecord(setOf(5, 6, 7, 8)))` throws `TeamSlotMismatchException`.
- `buy checks the max before the lock`: `Team(4).buy("yan", 4, BossRecord(setOf(5)))` throws `TeamSlotsMaxException`.
- `withAllies stores owned heroes in bought slots`: `Team(2).withAllies(listOf("lyra", "orina", null, null), cards(setOf(5, 6)), known)` == `Team(2, listOf("lyra", "orina", null, null))`.
- `withAllies with four nulls empties the team and keeps the bought slots`: `Team(2, listOf("lyra", "orina", null, null)).withAllies(listOf(null, null, null, null), cards(setOf(5, 6)), known)` == `Team(2)`.
- `withAllies refuses a list that does not have 4 entries`: `listOf("lyra")` → `InvalidTeamException`.
- `withAllies refuses a hero twice`: `listOf("lyra", "lyra", null, null)` on `Team(2)` → `InvalidTeamException`.
- `withAllies refuses the leader`: `listOf("kael", null, null, null)` on `Team(1)` → `InvalidTeamException`.
- `withAllies refuses an id outside the catalog`: `listOf("ghost", null, null, null)` on `Team(1)` with `{5}` → `HeroNotFoundException`, code `HERO_NOT_FOUND`.
- `withAllies refuses a locked team`: `listOf("lyra", null, null, null)` on `Team()` with cleared `{1, 2, 3, 4}` → `TeamLockedException`.
- `withAllies refuses a locked team even with four nulls`: `listOf(null, null, null, null)` on `Team()` with cleared `{1, 2, 3, 4}` → `TeamLockedException`.
- `withAllies refuses a hero in a slot that is not bought`: `listOf("lyra", "orina", null, null)` on `Team(1)` with `{5, 6}` → `TeamSlotNotBoughtException`.
- `withAllies refuses a hero not owned`: `listOf("vex", null, null, null)` on `Team(1)` with `{5}` → `HeroNotOwnedException`.
- `withAllies checks INVALID_TEAM before HERO_NOT_FOUND`: `listOf("ghost", "ghost", null, null)` → `InvalidTeamException`.
- `withAllies checks HERO_NOT_FOUND before TEAM_LOCKED`: `listOf("ghost", null, null, null)` on a locked team → `HeroNotFoundException`.
- `withAllies checks TEAM_LOCKED before TEAM_SLOT_NOT_BOUGHT`: `listOf("lyra", null, null, null)` on `Team()` locked → `TeamLockedException`.
- `withAllies checks TEAM_SLOT_NOT_BOUGHT before HERO_NOT_OWNED`: `listOf("vex", null, null, null)` on `Team()` with `{5}` → `TeamSlotNotBoughtException`.
- `a new leader from slot 2 sends the old leader to slot 2`: `Team(2, listOf("lyra", "orina", null, null)).afterLeaderChange("kael", "orina")` == `Team(2, listOf("lyra", "kael", null, null))`.
- `a new leader outside the team leaves the allies`: `afterLeaderChange("kael", "seraphine")` returns the same team.
- `the same leader leaves the allies`: `afterLeaderChange("kael", "kael")` returns the same team.
- `the view carries unlocked, open slots, bought slots, prices and allies`: `TeamView.of(Team(1, listOf("lyra", null, null, null)), BossRecord(setOf(5, 6)))` == `TeamView(true, 2, 1, listOf(10_000L, 20_000L, 30_000L, 40_000L), listOf("lyra", null, null, null))`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] `Team.kt` and `TeamExceptions.kt` exist with the contract above.
- [x] The 34 cases of `TeamTest.kt` pass and the whole backend suite passes.

**Commit**: `feat(backend): add the hero team domain`

---

### T2: Store the team in `player_team` [x]

**Owner**: kotlin-backend-dev
**Goal**: Create the table `player_team` with an expand-only migration and the repository that reads and writes one team per player (TEAM-01, TEAM-04 AC 24, AC 25).
**Where**: `backend/src/main/resources/db/migration/V12__hero_team.sql` (new)
**Also changes**: `<main>/port/TeamPorts.kt` (new), `<main>/adapter/repository/TeamRepository.kt` (new), `<test>/Fakes.kt` (add `InMemoryTeamRepository`), `<test>/adapter/repository/TeamRepositoryIT.kt` (new), `<test>/adapter/repository/PreviousBackendCompatibilityIT.kt`
**Read first**: `backend/src/main/resources/db/migration/V6__auto_click.sql`, `<main>/adapter/repository/AutoClickRepository.kt` (entity and adapter pattern), `<main>/port/AutoClickPorts.kt`, `<test>/Fakes.kt:289-325` (in-memory fakes), `<test>/adapter/repository/ResetRepositoryIT.kt` (whole file, IT pattern), `<test>/adapter/repository/PreviousBackendCompatibilityIT.kt:18-23` and `:170-220`, design § Backend persistence
**Depends on**: T1
**Requirement**: TEAM-01, TEAM-04

**Contract**:

- `V12__hero_team.sql`: exactly the SQL of design § Backend persistence (table `player_team`, the five check constraints with the names given there).
- `TeamPorts.kt`:

```kotlin
package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.Team

interface TeamRepositoryPort {
    /** The team of [username]; a player with no row bought no slot and has no ally: `Team()`. */
    fun find(username: String): Team

    /** Stores the whole team of [username] in its one row. */
    fun save(
        username: String,
        team: Team,
    )
}
```

- `TeamRepository.kt`:

```kotlin
/** One row per player who bought an ally slot: the bought count and the hero of each ally slot. */
@Entity
@Table(name = "player_team")
class TeamEntity(
    @Id
    @Column(nullable = false, updatable = false)
    var username: String,
    @Column(name = "bought_slots", nullable = false)
    var boughtSlots: Int,
    @Column(name = "ally_1")
    var ally1: String?,
    @Column(name = "ally_2")
    var ally2: String?,
    @Column(name = "ally_3")
    var ally3: String?,
    @Column(name = "ally_4")
    var ally4: String?,
) {
    fun toDomain() = Team(boughtSlots, listOf(ally1, ally2, ally3, ally4))

    companion object {
        fun from(
            username: String,
            team: Team,
        ) = TeamEntity(username, team.boughtSlots, team.allies[0], team.allies[1], team.allies[2], team.allies[3])
    }
}

interface JpaTeamRepository : JpaRepository<TeamEntity, String>

@Repository
class TeamRepository(
    private val jpaTeamRepository: JpaTeamRepository,
) : TeamRepositoryPort {
    @Transactional
    override fun find(username: String): Team = jpaTeamRepository.findById(username).map { it.toDomain() }.orElse(Team())

    @Transactional
    override fun save(
        username: String,
        team: Team,
    ) {
        jpaTeamRepository.save(TeamEntity.from(username, team))
    }
}
```

- `Fakes.kt`: `class InMemoryTeamRepository : TeamRepositoryPort { val teams = linkedMapOf<String, Team>(); override fun find(username: String) = teams[username] ?: Team(); override fun save(username: String, team: Team) { teams[username] = team } }`, after `InMemoryResetRepository`.
- `PreviousBackendCompatibilityIT.kt`: `PREVIOUS_LAST_VERSION = 11`; rename the test `the previous release starts on the migrated schema and its validation ignores V11` to `the previous release starts on the migrated schema and its validation ignores V12`; the class KDoc first sentence becomes "AD-016: the release before V12 (the V11-era backend, last migration V11) must keep starting and serving on the database after V12."; the KDoc of `previousMigrations` says "the files of `V1` to `V11`". No other line of that file changes.

**Steps**:

1. Write `V12__hero_team.sql`.
2. Write `TeamPorts.kt` and `TeamRepository.kt`.
3. Add `InMemoryTeamRepository` to `Fakes.kt`.
4. Edit `PreviousBackendCompatibilityIT.kt` as above.
5. Write `TeamRepositoryIT.kt` (extends `IntegrationTestBase`, `@BeforeEach fun players() = users("yan", "other")`, autowires `TeamRepository` and `JdbcTemplate`; helper `rows() = jdbc.queryForObject("select count(*) from player_team where username = 'yan'", Int::class.java)`; raw inserts use `jdbc.update("insert into player_team (username, bought_slots, ally_1, ally_2, ally_3, ally_4) values (?, ?, ?, ?, ?, ?)", ...)`).
6. Run the gate.

**Tests**: integration
**Test cases** (`TeamRepositoryIT.kt`, exact names):

- `a player with no row has no bought slot and no ally`: `find("yan")` == `Team()`.
- `save inserts the team and then updates it`: save `Team(1, listOf("lyra", null, null, null))`, then `Team(2, listOf("lyra", "orina", null, null))` → `find` == the second; `rows()` == 1.
- `a swap of two allies is stored`: save `Team(2, listOf("lyra", "orina", null, null))`, then `Team(2, listOf("orina", "lyra", null, null))` → `find` == the second.
- `each player reads only their own team`: save `Team(1, listOf("lyra", null, null, null))` for `other` → `find("yan")` == `Team()`, `find("other")` == that team.
- `the row goes with the user`: save for `yan`, `jpaUserRepository.deleteById("yan")` → `rows()` == 0.
- `bought slots 0 and 4 are accepted and -1 and 5 are refused`: raw inserts for users `yan` (0) and `other` (4) succeed; raw inserts with -1 and 5 (after deleting the rows) each throw `DataAccessException` (four assertions, L-022).
- `an ally in a slot that is not bought is refused`: raw insert `bought_slots` 1 with `ally_2` `orina` throws `DataAccessException`; raw insert `bought_slots` 0 with `ally_1` `lyra` throws `DataAccessException`; raw insert `bought_slots` 3 with `ally_4` `vex` throws `DataAccessException`.
- `the same hero in two slots is refused`: raw insert `bought_slots` 2 with `ally_1` and `ally_2` both `lyra` throws `DataAccessException`.
- `an ally id absent from heroes is refused`: raw insert `bought_slots` 1 with `ally_1` `ghost` throws `DataAccessException`.

Plus the renamed `PreviousBackendCompatibilityIT` test must pass with `PREVIOUS_LAST_VERSION = 11` (the V12 entry reads `FUTURE_SUCCESS`).

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] `V12__hero_team.sql` creates only `player_team` (no `alter`, no `drop`).
- [x] The 9 cases of `TeamRepositoryIT.kt` and every case of `PreviousBackendCompatibilityIT.kt` pass; the whole backend suite passes.

**Note (T2)**: the port file is `<main>/port/TeamRepositoryPort.kt`, not `TeamPorts.kt`. ktlint (`standard:filename`) refuses a file whose only declaration is one interface with another name, and `TeamRepositoryPort` is the only declaration of that file (the use cases of T3 to T5 live in `TeamUseCase.kt`). The content is the contract above.

**Commit**: `feat(backend): store the hero team in player_team`

---

### T3: Answer the team in `GET /heroes` and swap it in `PUT /leader` [x]

**Owner**: kotlin-backend-dev
**Goal**: `GET /heroes` answers the team payload; `PUT /leader` with an ally swaps the two and answers the team (TEAM-01 AC 1, 2; TEAM-04 AC 18, 19, 20).
**Where**: `<main>/service/HeroService.kt`
**Also changes**: `<main>/domain/HeroView.kt` (`HeroesView` gains `team`), `<main>/usecase/HeroUseCase.kt` (`SetLeaderUseCase` returns `LeaderChange`), `<main>/adapter/web/HeroController.kt` (`TeamResponse`, `HeroesResponse.team`, `LeaderResponse.team`), `<test>/service/HeroServiceTest.kt`, `<test>/adapter/web/HeroControllerIT.kt`
**Read first**: `<main>/service/HeroService.kt` (whole file), `<main>/domain/HeroView.kt:54-60` (`HeroesView`), `<main>/usecase/HeroUseCase.kt:29-35`, `<main>/adapter/web/HeroController.kt:73-133`, `<test>/service/HeroServiceTest.kt:25-40` and `:168-195`, `<test>/adapter/web/HeroControllerIT.kt:1-62` (helpers `register`, `give`, `leader`) and `:181-206`, `<test>/adapter/web/AccountResetControllerIT.kt:60-75` (reset request), design § Backend `HeroService`
**Depends on**: T2
**Requirement**: TEAM-01, TEAM-04

**Contract**:

```kotlin
// HeroView.kt
/** Every hero of the catalog as one player sees them, the id of their leader and their team. */
data class HeroesView(
    val leaderId: String,
    val heroes: List<HeroView>,
    val team: TeamView,
)

// HeroUseCase.kt
interface SetLeaderUseCase {
    /** Makes [heroId], which the player must own, the leader; a hero of an ally slot swaps with the old leader. */
    fun setLeader(
        username: String,
        heroId: String,
    ): LeaderChange
}

// HeroService.kt: constructor gains `private val teamRepository: TeamRepositoryPort` as the fourth parameter
override fun list(username: String): HeroesView {
    logger.info("Listing heroes username={}", username)
    val cards = load(username)
    return HeroesView(
        cards.leaderId,
        heroRepository.findAll().map { HeroView.of(it, cards) },
        TeamView.of(teamRepository.find(username), cards.bosses),
    )
}

override fun setLeader(
    username: String,
    heroId: String,
): LeaderChange {
    logger.info("Setting leader username={} hero={}", username, heroId)
    requireHero(heroId)
    val cards = load(username)
    val changed = cards.withLeader(heroId)
    val before = teamRepository.find(username)
    val team = before.afterLeaderChange(cards.leaderId, heroId)
    playerCardsRepository.save(changed)
    if (team != before) teamRepository.save(username, team)
    return LeaderChange(changed.leaderId, TeamView.of(team, changed.bosses))
}

// HeroController.kt
/** The team payload of spec hero-team: one object in GET /heroes, PUT /leader, PUT /team, POST /team/slots and the 409 body. */
data class TeamResponse(
    val unlocked: Boolean,
    val openSlots: Int,
    val boughtSlots: Int,
    val slotPrices: List<Long>,
    val allies: List<String?>,
) {
    companion object {
        fun from(view: TeamView) = TeamResponse(view.unlocked, view.openSlots, view.boughtSlots, view.slotPrices, view.allies)
    }
}

data class HeroesResponse(
    val leaderId: String,
    val heroes: List<HeroResponse>,
    val team: TeamResponse,
) {
    companion object {
        fun from(view: HeroesView) = HeroesResponse(view.leaderId, view.heroes.map(HeroResponse::from), TeamResponse.from(view.team))
    }
}

data class LeaderResponse(
    val leaderId: String,
    val team: TeamResponse,
)

// leader(): val change = setLeader.setLeader(principal.name, heroId); return LeaderResponse(change.leaderId, TeamResponse.from(change.team))
```

**Steps**:

1. Change `HeroesView`, `SetLeaderUseCase`, `HeroService` and `HeroController` as above.
2. In `HeroServiceTest.kt` build the service with `HeroService(heroes, cards, users, teams)` where `private val teams = InMemoryTeamRepository()`; give the `player()` helper a parameter `cleared: Set<Int> = emptySet()` that sets `bosses = BossRecord(cleared)`; existing assertions on `setLeader` that compared a `String` now compare `.leaderId`.
3. Add the cases below; run `grep -rn "HeroesView(\|HeroService(" backend/src` and fix every other construction the compiler names.
4. Run the gate.

**Tests**: unit + integration
**Test cases**:

`HeroServiceTest.kt` (exact names):

- `list answers a locked team for a player who never won the chapter 5 boss`: `player()` → `list("yan").team` == `TeamView(false, 0, 0, Team.SLOT_PRICES, listOf(null, null, null, null))`.
- `list answers the stored team with the open slots of the cleared chapters`: `player(cleared = setOf(5, 6, 7))`, `teams.save("yan", Team(2, listOf("lyra", "orina", null, null)))` with Lyra and Orina owned → `team` == `TeamView(true, 3, 2, Team.SLOT_PRICES, listOf("lyra", "orina", null, null))`.
- `set leader to the hero of ally slot 2 puts the old leader in slot 2`: leader `kael`, Lyra and Orina owned, team `Team(2, listOf("lyra", "orina", null, null))` → `setLeader("yan", "orina")` answers `leaderId` `orina` and `team.allies` `[lyra, kael, null, null]`; `teams.find("yan").allies` == the same.
- `set leader to a hero outside the team keeps the allies`: team `Team(1, listOf("lyra", null, null, null))`, Seraphine owned → `setLeader("yan", "seraphine")` answers `team.allies` `[lyra, null, null, null]`.
- `set leader without a team stores no team row`: `setLeader("yan", "lyra")` → `teams.teams` has no key `yan`.
- `set leader to the current leader keeps the team`: `setLeader("yan", "kael")` with team `Team(1, listOf("lyra", null, null, null))` → allies unchanged.
- `a refused leader change keeps the team`: `setLeader("yan", "vex")` (not owned) throws `HeroNotOwnedException`; `teams.find("yan")` unchanged.

`HeroControllerIT.kt` (exact names; set cleared chapters with `jpaPlayerCardsRepository.findById("yan").get().also { it.clearedChapters = "5" }.let(jpaPlayerCardsRepository::save)`, the team with an autowired `TeamRepository`):

- `GET heroes answers a locked team for a new player`: `team.unlocked` false, `team.openSlots` 0, `team.boughtSlots` 0, `team.slotPrices` `[10000, 20000, 30000, 40000]`, `team.allies` `[null, null, null, null]`.
- `GET heroes answers the open slots of the cleared chapters 5 to 8`: cleared `1,2,3,4,5,6` → `team.unlocked` true, `team.openSlots` 2.
- `GET heroes answers the stored allies`: cleared `5`, team `Team(1, listOf("lyra", null, null, null))`, Lyra given → `team.boughtSlots` 1, `team.allies` `["lyra", null, null, null]`.
- `PUT leader with the hero of ally slot 1 swaps them and answers the team`: as above, `PUT /leader {"heroId":"lyra"}` → 200, `leaderId` `lyra`, `team.allies` `["kael", null, null, null]`; `teamRepository.find("yan").allies` == `[kael, null, null, null]`.
- `PUT leader with a hero outside the team keeps the allies`: team `Team(1, listOf("lyra", null, null, null))`, Orina given → `PUT /leader {"heroId":"orina"}` → `team.allies` `["lyra", null, null, null]`.
- `an account reset keeps the team`: cleared `5,6`, progress `ProgressEntity("yan", 6, 1, "PHASE", 1, false)`, team `Team(2, listOf("lyra", null, null, null))`, Lyra given; `POST /account/reset {"fromChapter":6}` → 200; then `GET /heroes` → `team.unlocked` true, `team.openSlots` 2, `team.boughtSlots` 2, `team.allies` `["lyra", null, null, null]`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] `GET /heroes` and `PUT /leader` carry `team`; the existing hero tests still pass unchanged apart from the constructor and `.leaderId`.
- [x] The 7 new `HeroServiceTest` cases and 6 new `HeroControllerIT` cases pass; the whole backend suite passes.

**Commit**: `feat(backend): answer the team with the heroes and swap it on a leader change`

---

### T4: Save the allies with `PUT /team` [x]

**Owner**: kotlin-backend-dev
**Goal**: A player saves the four ally entries under the `player_cards` lock, with every refusal of the spec in its order (TEAM-03, TEAM-04 AC 22, 23).
**Where**: `<main>/service/TeamService.kt` (new)
**Also changes**: `<main>/usecase/TeamUseCase.kt` (new), `<main>/adapter/web/TeamController.kt` (new), `<test>/service/TeamServiceTest.kt` (new), `<test>/adapter/web/TeamControllerIT.kt` (new)
**Read first**: `<main>/service/HeroService.kt` (`load`, the user and cards checks), `<main>/service/AutoClickService.kt` (service shape), `<main>/adapter/web/AutoClickController.kt` (body parsing), `<test>/service/HeroServiceTest.kt:25-40` (fixture), `<test>/adapter/web/AutoClickControllerIT.kt:1-60` (register and request helpers), `<test>/adapter/web/HeroControllerIT.kt:225-265` (two requests at once with an executor; isolation of players), design § Backend `HeroService` and `TeamService`, § Backend web
**Depends on**: T3
**Requirement**: TEAM-03, TEAM-04

**Contract**:

```kotlin
// TeamUseCase.kt
package br.com.woodriver.infinity_grove_ws.usecase

interface SaveTeamUseCase {
    /** Stores [allies] (4 entries, index 0 = ally slot 1, a hero id or null) as the player's team and returns the leader and the team. */
    fun saveAllies(
        username: String,
        allies: List<String?>,
    ): LeaderChange
}

// TeamService.kt
/** Every change takes the `player_cards` row first (the player lock, ADR 0008), then the wallet for a purchase (lock order AD-009). */
@Service
@Transactional
class TeamService(
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val teamRepository: TeamRepositoryPort,
    private val heroRepository: HeroRepositoryPort,
    private val userRepository: UserRepositoryPort,
) : SaveTeamUseCase {
    override fun saveAllies(
        username: String,
        allies: List<String?>,
    ): LeaderChange {
        logger.info("Team save requested username={} allies={}", username, allies)
        val cards = lockPlayer(username)
        val saved = teamRepository.find(username).withAllies(allies, cards, heroRepository::existsById)
        teamRepository.save(username, saved)
        logger.info("Team saved username={} slots={} allies={}", username, saved.boughtSlots, saved.allies)
        return LeaderChange(cards.leaderId, TeamView.of(saved, cards.bosses))
    }

    // lockPlayer(username): the same checks and messages as HeroService.load: UserNotFoundException, then
    // playerCardsRepository.findForUpdate(username) ?: PlayerCardsMissingException
}

// TeamController.kt
data class TeamSaveResponse(
    val leaderId: String,
    val team: TeamResponse,
)

@RestController
@RequestMapping("/team")
class TeamController(
    private val saveTeam: SaveTeamUseCase,
) {
    @PutMapping
    fun save(
        principal: Principal,
        @RequestBody body: Map<String, Any?>,
    ): TeamSaveResponse {
        val allies = body["allies"] as? List<*> ?: throw InvalidTeamException("allies must be a list of ${Team.MAX_ALLIES} entries")
        if (allies.size != Team.MAX_ALLIES || allies.any { it != null && it !is String }) {
            throw InvalidTeamException("allies must hold ${Team.MAX_ALLIES} hero ids or nulls")
        }
        val change = saveTeam.saveAllies(principal.name, allies.map { it as String? })
        return TeamSaveResponse(change.leaderId, TeamResponse.from(change.team))
    }
}
```

Answers: 200 `{ "leaderId": string, "team": team payload }`; 400 `INVALID_TEAM`; 404 `HERO_NOT_FOUND`; 409 `TEAM_LOCKED`, `TEAM_SLOT_NOT_BOUGHT`, `HERO_NOT_OWNED`; 401 without a token. Error bodies are the existing `ProblemDetail` with `code`.

**Steps**:

1. Write `TeamUseCase.kt` (only `SaveTeamUseCase` now; T5 adds the purchase).
2. Write `TeamService.kt` and `TeamController.kt` as above.
3. Write `TeamServiceTest.kt`: `users = InMemoryUserRepository()`, `cards = InMemoryPlayerCardsRepository()`, `teams = InMemoryTeamRepository()`, `heroes = InMemoryHeroRepository(*HeroSeed.heroes().toTypedArray())`, `service = TeamService(cards, teams, heroes, users)`; helper `player(cleared: Set<Int>)` saves the user and `PlayerCards.start("yan", Element.FIRE, HeroSeed.heroes())` plus blank cards of Lyra, Orina and Seraphine, with `bosses = BossRecord(cleared)` (leader Kael, Vex not owned).
4. Write `TeamControllerIT.kt`: register `yan` with `FIRE` (leader Kael) as `AutoClickControllerIT` does; helpers `cleared(csv: String)`, `give(heroId)` (blank card, `CardCopyEntity.from`), `bought(n: Int)` (`teamRepository.save("yan", Team(n))`), `put(body: Any?)` (`PUT /team` with JSON body).
5. Run the gate.

**Tests**: unit + integration
**Test cases**:

`TeamServiceTest.kt` (exact names):

- `save stores owned heroes in bought slots and answers the leader and the team`: `player(setOf(5, 6))`, `teams.save("yan", Team(2))`; `saveAllies("yan", listOf("lyra", "orina", null, null))` → `leaderId` `kael`, `team` == `TeamView(true, 2, 2, Team.SLOT_PRICES, listOf("lyra", "orina", null, null))`; `teams.find("yan")` == `Team(2, listOf("lyra", "orina", null, null))`.
- `the same save twice stores the same team`: the save above twice → both answers equal, stored team equal.
- `save on a locked team is refused and stores nothing`: `player(setOf(1, 2, 3, 4))` → `TeamLockedException`; `teams.teams` is empty.
- `save of a hero in a slot that is not bought is refused and stores nothing`: `Team(1)`, `listOf("lyra", "orina", null, null)` → `TeamSlotNotBoughtException`; stored `Team(1)`.
- `save of a hero not owned is refused and stores nothing`: `listOf("vex", null, null, null)` on `Team(1)` → `HeroNotOwnedException`.
- `save of an id outside the catalog is refused`: `listOf("ghost", null, null, null)` → `HeroNotFoundException`.
- `save of the leader is refused`: `listOf("kael", null, null, null)` → `InvalidTeamException`.
- `save for an unknown user fails`: no user → `UserNotFoundException`.

`TeamControllerIT.kt` (exact names):

- `PUT team stores owned heroes in bought slots and answers leaderId and team`: `cleared("5")`, `bought(1)`, `give("lyra")`; `put({"allies":["lyra",null,null,null]})` → 200, `leaderId` `kael`, `team.unlocked` true, `team.openSlots` 1, `team.boughtSlots` 1, `team.slotPrices` `[10000, 20000, 30000, 40000]`, `team.allies` `["lyra", null, null, null]`; `teamRepository.find("yan")` == `Team(1, listOf("lyra", null, null, null))`.
- `the same PUT team twice answers 200 with the same team both times`.
- `PUT team on a locked team answers 409 TEAM_LOCKED and stores nothing`: no cleared chapter, body `{"allies":[null,null,null,null]}` → 409 `code` `TEAM_LOCKED`; `teamRepository.find("yan")` == `Team()`.
- `PUT team with a hero in a slot that is not bought answers 409 TEAM_SLOT_NOT_BOUGHT`: `cleared("5,6")`, `bought(1)`, Lyra and Orina given, `["lyra","orina",null,null]` → 409 `TEAM_SLOT_NOT_BOUGHT`; stored `Team(1)`.
- `PUT team with a hero not owned answers 409 HERO_NOT_OWNED`: `["vex",null,null,null]` → 409 `HERO_NOT_OWNED`.
- `PUT team with an unknown hero answers 404 HERO_NOT_FOUND`: `["ghost",null,null,null]` → 404 `HERO_NOT_FOUND`.
- `PUT team without allies answers 400 INVALID_TEAM`: body `{}`.
- `PUT team with allies that is not a list answers 400 INVALID_TEAM`: body `{"allies":"lyra"}`.
- `PUT team with 3 entries answers 400 INVALID_TEAM`: `["lyra",null,null]`.
- `PUT team with 5 entries answers 400 INVALID_TEAM`: `["lyra",null,null,null,null]`.
- `PUT team with a number entry answers 400 INVALID_TEAM`: `[1,null,null,null]`.
- `PUT team with a hero twice answers 400 INVALID_TEAM`: `bought(2)`, `["lyra","lyra",null,null]`.
- `PUT team with the leader answers 400 INVALID_TEAM`: `["kael",null,null,null]`.
- `PUT team checks INVALID_TEAM before HERO_NOT_FOUND`: `["ghost","ghost",null,null]` → 400 `INVALID_TEAM`.
- `PUT team checks HERO_NOT_FOUND before TEAM_LOCKED`: locked, `["ghost",null,null,null]` → 404 `HERO_NOT_FOUND`.
- `PUT team checks TEAM_LOCKED before TEAM_SLOT_NOT_BOUGHT`: locked, `bought(0)`, Lyra given, `["lyra",null,null,null]` → 409 `TEAM_LOCKED`.
- `PUT team checks TEAM_SLOT_NOT_BOUGHT before HERO_NOT_OWNED`: `cleared("5")`, no slot bought, `["vex",null,null,null]` → 409 `TEAM_SLOT_NOT_BOUGHT`.
- `PUT team answers 401 without a token`.
- `two PUT team of the same player at once store one of the two bodies`: `cleared("5,6")`, `bought(2)`, Lyra, Orina and Seraphine given; two concurrent requests `["lyra","orina",null,null]` and `["orina","seraphine",null,null]` → both 200; the stored allies equal one of the two lists.
- `a player changes only their own team`: register `ana` too (same setup); `ana` puts `["lyra",null,null,null]` → `yan`'s `GET /heroes` `team.allies` stays `[null, null, null, null]`.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] `PUT /team` answers every case above.
- [x] The 8 `TeamServiceTest` and 20 `TeamControllerIT` cases pass; the whole backend suite passes.

**Note (T4)**: the use case file is `<main>/usecase/SaveTeamUseCase.kt`, not `TeamUseCase.kt`: with `SaveTeamUseCase` as its only declaration, ktlint (`standard:filename`) refuses the name `TeamUseCase.kt`. T5 renames it to `TeamUseCase.kt` (`git mv`) when it adds `BuyTeamSlotUseCase`, which gives the file two declarations. In `a player changes only their own team`, `ana` registers with `FIRE` and holds Lyra: the task says `ana` puts `lyra`, and a `NATURE` player has Lyra as leader, which the save refuses with `INVALID_TEAM`.

**Commit**: `feat(backend): save the hero team with PUT /team`

---

### T5: Buy an ally slot with `POST /team/slots` [x]

**Owner**: kotlin-backend-dev
**Goal**: A player buys the next open slot for its price, once per click, with every refusal in its order and the stored team in the 409 mismatch body (TEAM-02, TEAM-04 AC 22).
**Where**: `<main>/service/TeamService.kt`
**Also changes**: `<main>/domain/Team.kt` (`SlotPurchase`), `<main>/usecase/TeamUseCase.kt`, `<main>/adapter/web/TeamController.kt`, `<main>/adapter/web/ApiExceptionHandler.kt`, `<test>/service/TeamServiceTest.kt`, `<test>/adapter/web/TeamControllerIT.kt`
**Read first**: `<main>/service/WalletAccess.kt`, `<main>/domain/Wallet.kt:63-70` (`minus`), `<main>/service/EquipmentService.kt:75-89` (`refine`: lock the cards, then the wallet), `<main>/adapter/web/ApiExceptionHandler.kt:93-100` (`autoClickLevelMismatch` handler with a body property), `<main>/adapter/web/WalletController.kt:18-25` (`CoinsResponse`), `<test>/service/EquipmentServiceTest.kt:38-48` and `:160-166` (wallet fixture), `<test>/adapter/web/EquipmentRefineIT.kt:42-45` and `:118-135` (wallet helpers, two requests at once), design § Backend `HeroService` and `TeamService`
**Depends on**: T4
**Requirement**: TEAM-02, TEAM-04

**Contract**:

```kotlin
// Team.kt (add after LeaderChange)
/** A bought slot: the team after it and the wallet after the price. */
data class SlotPurchase(
    val team: TeamView,
    val wallet: Wallet,
)

// TeamUseCase.kt (add)
interface BuyTeamSlotUseCase {
    /** Buys the next ally slot; [fromSlots] is the bought count the player saw. */
    fun buySlot(
        username: String,
        fromSlots: Int,
    ): SlotPurchase
}

// TeamService.kt: the constructor gains `private val walletAccess: WalletAccess` (last), the class also implements BuyTeamSlotUseCase
override fun buySlot(
    username: String,
    fromSlots: Int,
): SlotPurchase {
    logger.info("Team slot purchase requested username={} fromSlots={}", username, fromSlots)
    val cards = lockPlayer(username)
    val bought = teamRepository.find(username).buy(username, fromSlots, cards.bosses)
    val price = Team.SLOT_PRICES[fromSlots]
    val wallet = walletAccess.lock(username).minus(price)
    teamRepository.save(username, bought)
    walletAccess.save(wallet)
    logger.info("Team slot bought username={} slots={} price={} copper={}", username, bought.boughtSlots, price, wallet.copper)
    return SlotPurchase(TeamView.of(bought, cards.bosses), wallet)
}

// TeamController.kt: the constructor gains `private val buyTeamSlot: BuyTeamSlotUseCase`
data class TeamPurchaseResponse(
    val team: TeamResponse,
    val wallet: CoinsResponse,
)

@PostMapping("/slots")
fun buySlot(
    principal: Principal,
    @RequestBody body: Map<String, Any?>,
): TeamPurchaseResponse {
    val fromSlots = body["fromSlots"] as? Int ?: throw InvalidTeamSlotRequestException("fromSlots must be an integer")
    val purchase = buyTeamSlot.buySlot(principal.name, fromSlots)
    return TeamPurchaseResponse(TeamResponse.from(purchase.team), CoinsResponse.from(purchase.wallet.coins()))
}

// ApiExceptionHandler.kt (before the HeroConflictException handler)
/** The body carries the stored team so the game can realign without another request. */
@ExceptionHandler(TeamSlotMismatchException::class)
fun teamSlotMismatch(e: TeamSlotMismatchException) =
    problem(HttpStatus.CONFLICT, e).apply { setProperty("team", TeamResponse.from(e.current)) }
```

Answers: 200 `{ "team": team payload, "wallet": { "gold", "silver", "copper" } }`; 400 `INVALID_TEAM_SLOT_REQUEST`; 409 `TEAM_SLOT_MISMATCH` (+ `team`), `TEAM_SLOTS_MAX`, `TEAM_SLOT_LOCKED`, `NOT_ENOUGH_COPPER` (thrown by `Wallet.minus`, existing handler); 401.

**Steps**:

1. Add `SlotPurchase`, `BuyTeamSlotUseCase`, `buySlot` (service and controller) and the handler.
2. In `TeamServiceTest.kt` build `walletAccess` as `EquipmentServiceTest.kt:43-46` does and pass it as the last argument; add a helper `funded(copper: Long)` that saves `Wallet.open("yan", table, SequenceDropRoller(1), 0).copy(copper = copper)`.
3. In `TeamControllerIT.kt` add `funded(copper: Long) = jpaWalletRepository.save(WalletEntity("yan", copper))`, `copper() = jpaWalletRepository.findById("yan").get().copper` and `buy(fromSlots: Any?)` (`POST /team/slots` with `mapOf("fromSlots" to fromSlots)`).
4. Add the cases below and run the gate.

**Tests**: unit + integration
**Test cases**:

`TeamServiceTest.kt` (exact names):

- `buy from 0 takes 10000 copper and stores 1 bought slot`: `player(setOf(5))`, `funded(15_000)` → `buySlot("yan", 0)` answers `team.boughtSlots` 1 and `wallet.copper` 5 000; `teams.find("yan")` == `Team(1)`; stored wallet 5 000.
- `buy of slot 4 takes 40000 copper`: `player(setOf(5, 6, 7, 8))`, `Team(3)`, `funded(40_000)` → `buySlot("yan", 3)` → `boughtSlots` 4, wallet 0.
- `buy without enough copper is refused and changes nothing`: `funded(9_999)` → `NotEnoughCopperException`; `teams.find("yan")` == `Team()`, wallet 9 999.
- `buy with a stale fromSlots is refused and changes nothing`: `Team(1)`, `buySlot("yan", 0)` → `TeamSlotMismatchException`; wallet unchanged.
- `buy with every open slot bought is refused and charges nothing`: `player(setOf(5))`, `Team(1)`, `funded(50_000)` → `buySlot("yan", 1)` → `TeamSlotLockedException`; wallet 50 000.

`TeamControllerIT.kt` (exact names):

- `POST team slots buys slot 1 for 1 ouro and answers the team and the wallet`: `cleared("5")`, `funded(15_000)`; `buy(0)` → 200, `team.boughtSlots` 1, `team.openSlots` 1, `team.allies` `[null, null, null, null]`, `wallet.gold` 0, `wallet.silver` 50, `wallet.copper` 0; `copper()` 5 000.
- `a second POST team slots with the same fromSlots answers 409 TEAM_SLOT_MISMATCH with the stored team`: after the purchase above, `buy(0)` → 409 `code` `TEAM_SLOT_MISMATCH`, `team.boughtSlots` 1, `team.openSlots` 1, `team.unlocked` true; `copper()` 5 000.
- `POST team slots with every open slot bought answers 409 TEAM_SLOT_LOCKED`: `cleared("5")`, `bought(1)`, `funded(50_000)`, `buy(1)` → 409 `TEAM_SLOT_LOCKED`; `copper()` 50 000.
- `POST team slots before the chapter 5 boss answers 409 TEAM_SLOT_LOCKED`: no cleared chapter, `funded(50_000)`, `buy(0)` → 409 `TEAM_SLOT_LOCKED`.
- `POST team slots with 4 bought slots answers 409 TEAM_SLOTS_MAX`: `cleared("5,6,7,8")`, `bought(4)`, `buy(4)` → 409 `TEAM_SLOTS_MAX`.
- `POST team slots without enough copper answers 409 NOT_ENOUGH_COPPER and changes nothing`: `cleared("5")`, `funded(9_999)`, `buy(0)` → 409 `NOT_ENOUGH_COPPER`; `copper()` 9 999; `teamRepository.find("yan")` == `Team()`.
- `POST team slots without fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`: body `{}`.
- `POST team slots with a string fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`: `buy("0")`.
- `POST team slots with a decimal fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`: `buy(0.5)`.
- `POST team slots with a negative fromSlots answers 400 INVALID_TEAM_SLOT_REQUEST`: `buy(-1)`.
- `POST team slots checks TEAM_SLOT_MISMATCH before TEAM_SLOTS_MAX`: `bought(4)`, `buy(3)` → 409 `TEAM_SLOT_MISMATCH`.
- `POST team slots checks TEAM_SLOTS_MAX before TEAM_SLOT_LOCKED`: `cleared("5")`, `bought(4)` (raw `Team(4)`), `buy(4)` → 409 `TEAM_SLOTS_MAX`.
- `POST team slots checks TEAM_SLOT_LOCKED before NOT_ENOUGH_COPPER`: no cleared chapter, `funded(0)`, `buy(0)` → 409 `TEAM_SLOT_LOCKED`.
- `two POST team slots with the same fromSlots at once buy one slot and charge once`: `cleared("5")`, `funded(30_000)`; two concurrent `buy(0)` → one 200 and one 409 `TEAM_SLOT_MISMATCH`; `copper()` 20 000; `teamRepository.find("yan").boughtSlots` 1.
- `POST team slots answers 401 without a token`.
- `a purchase changes only the buyer's team and wallet`: register `ana` with cleared `5` and 15 000 copper; `ana` buys → `yan`'s team stays `Team()` and his copper unchanged.
- `bought slots survive an account reset`: `cleared("5,6")`, progress chapter 6, `funded(30_000)`, `buy(0)`, `buy(1)`, `POST /account/reset {"fromChapter":6}` → 200; `GET /heroes` `team.boughtSlots` 2, `team.openSlots` 2.

**Gate**: full - `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] `POST /team/slots` answers every case above and the mismatch body carries `team`.
- [x] The 5 new `TeamServiceTest` and 17 new `TeamControllerIT` cases pass; the whole backend suite passes.

**Note (T5)**: `SaveTeamUseCase.kt` (T4) was renamed with `git mv` to `TeamUseCase.kt` and `BuyTeamSlotUseCase` was added to it, as the contract says.

**Commit**: `feat(backend): buy ally slots with POST /team/slots`

---

### T6: Document the hero team in the backend ADR and the briefing [x]

**Owner**: kotlin-backend-dev
**Goal**: Record the team storage, routes and locks as backend ADR 0013 and add the team to the game briefing (AD-018).
**Where**: `backend/docs/adr/0013-hero-team.md` (new)
**Also changes**: `README.md` (section `## Seleção de personagens`)
**Read first**: `backend/docs/adr/0010-talents.md` (ADR format), `README.md:40-46`, spec § Team Slots, § Ally Damage, Contract and Errors rows, design § Backend
**Depends on**: T5
**Requirement**: TEAM-01, TEAM-02, TEAM-03

**Contract**:

- ADR sections as in `0010-talents.md` (Status, Context, Decision, Consequences), in English: the table `player_team` and its constraints, `V12__hero_team.sql` expand only, the four routes and their answers, the check orders, the lock order `player_cards` then `wallets`, the reset and deletion rules, and that ally damage is computed in the game (AD-002, AD-021).
- `README.md`: append to `## Seleção de personagens` these two bullets, in Portuguese, exactly:
  - `- A partir do capítulo 5 o jogador monta uma **equipe**: o líder mais até 4 aliados, em vagas compradas com ouro (1, 2, 3 e 4 ouro), abertas pelos chefes dos capítulos 5 a 8.`
  - `- Cada aliado ataca sozinho uma vez por segundo com o mesmo dano de todos os golpes e traz uma passiva enquanto está na equipe.`

**Steps**:

1. Write the ADR.
2. Add the two bullets.
3. Run the gate.

**Tests**: none
**Gate**: build - `cd backend && ./gradlew build`
**Done when**:

- [x] `backend/docs/adr/0013-hero-team.md` exists with the four sections.
- [x] `README.md` holds the two bullets exactly; `cd backend && ./gradlew build` passes.

**Commit**: `docs: record the hero team storage and routes`

---

### T7: Add the team rules of the game [x]

**Owner**: game-dev
**Goal**: One pure module reads the team payload and answers when the team is active, who fights, which passives apply, the state of every slot and the available heroes (TEAM-07 AC 13, TEAM-09, TEAM-11 AC 6, 7).
**Where**: `game/src/domain/heroes/team.js` (new)
**Also changes**: `game/src/domain/heroes/team.test.js` (new)
**Read first**: `game/src/domain/heroes/heroes.js` (module style), `game/src/domain/heroes/leaderBonus.js`, `game/src/domain/campaign/accountReset.js` (a small rule module and its test), spec § Team Slots, § Passive Table, § Equipe Screen Layout (slot states), design § Game `team.js`
**Depends on**: None
**Requirement**: TEAM-07, TEAM-09, TEAM-11

**Contract**:

```js
//  The team of the player (spec hero-team): the payload of the backend, when the allies fight, who fights, the passives they bring and
//  what each ally slot shows. Pure JavaScript: no Phaser.
export const TEAM_FIRST_CHAPTER = 5;
export const ALLY_SLOTS = [ 1, 2, 3, 4 ];
const COPPER_PER_GOLD = 10000;

export const LOCKED_TEAM = Object.freeze({
    unlocked: false, openSlots: 0, boughtSlots: 0, slotPrices: Object.freeze([ 10000, 20000, 30000, 40000 ]), allies: Object.freeze([ null, null, null, null ])
});

//  The team of a heroes payload; a missing or malformed `team` (a backend before this feature) is the locked team
export const normalizeTeam = (payload) => { /* valid -> { unlocked, openSlots, boughtSlots, slotPrices: [...], allies: [...] } (copies), else LOCKED_TEAM */ };

//  The allies fight while the campaign is at chapter 5 or later, or completed; `position` is { chapter, completed } or null before it loads
export const teamActive = (position) => Boolean(position) && (position.completed === true || (position.chapter ?? 0) >= TEAM_FIRST_CHAPTER);

//  The heroes of the bought, filled ally slots, in slot order: [ { slot, hero } ]; none while the team is inactive. The leader, an id of
//  a slot that is not bought and an id missing from `heroes` are skipped.
export const fightingAllies = ({ team, heroes, leaderId, active }) => { /* ... */ };

export const PASSIVES = Object.freeze({
    kael: Object.freeze({ name: 'Guarda do Baluarte', text: '+5 s no tempo dos chefes' }),
    lyra: Object.freeze({ name: 'Olho do Falcão', text: '+10 de chance de crítico' }),
    orina: Object.freeze({ name: 'Erosão Arcana', text: '-15 de defesa dos inimigos' }),
    vex: Object.freeze({ name: 'Lâminas Sombrias', text: '-15 de resistência a crítico dos inimigos' }),
    seraphine: Object.freeze({ name: 'Graça da Aurora', text: '+25% de dano da equipe' })
});

export const passiveOf = (heroId) => PASSIVES[heroId] ?? null;

//  "Graça da Aurora: +25% de dano da equipe"; '' for a hero without a passive
export const passiveLine = (heroId) => { /* ... */ };

export const NO_PASSIVES = Object.freeze({ bossTimeMs: 0, critChance: 0, defenseBreak: 0, critResistBreak: 0, allyFactor: 1 });

//  What the fighting allies `heroIds` bring: Kael 5000 ms on the boss time limit, Lyra 10 points of critical chance, Orina 15 points
//  off the defense, Vex 15 points off the critical resistance, Seraphine x1.25 on every ally hit
export const teamPassives = (heroIds) => { /* ... */ };

//  The passives that apply now
export const activePassives = ({ team, heroes, leaderId, position }) =>
    teamPassives(fightingAllies({ team, heroes, leaderId, active: teamActive(position) }).map(({ hero }) => hero.id));

//  Ally slots 1 to 4 as the Equipe screen shows them: { slot, state, heroId, priceGold, chapter }, state one of
//  filled | empty | buyable | waiting | locked (spec Equipe Screen Layout)
export const slotStates = (team) => { /* ... */ };

//  The owned heroes outside the team (not the leader, not in a bought slot), in catalog order
export const availableHeroes = ({ team, heroes, leaderId }) => { /* ... */ };
```

Rules of `normalizeTeam`: valid when the payload is an object; `unlocked` is a boolean; `openSlots` and `boughtSlots` are integers from 0 to 4; `slotPrices` is an array of 4 positive integers; `allies` is an array of 4 entries, each a string or `null`. Rules of `slotStates` for slot `s`: `filled` when `s <= boughtSlots` and `allies[s - 1]` is a string; `empty` when `s <= boughtSlots` and it is null; `buyable` when `s === boughtSlots + 1` and `s <= openSlots`; `waiting` when `s > boughtSlots + 1` and `s <= openSlots`; `locked` when `s > openSlots` and `s > boughtSlots`. `heroId` is `allies[s - 1]` for `filled`, else null; `priceGold = slotPrices[s - 1] / 10000`; `chapter = 4 + s`.

**Steps**:

1. Write `team.js` with the contract.
2. Write `team.test.js` with the cases below; heroes are `{ id, owned }` objects in the order kael, lyra, orina, seraphine, vex.
3. Run the gate.

**Tests**: unit
**Test cases** (`team.test.js`, exact names):

- `normalizeTeam keeps a valid team payload`: `{ unlocked: true, openSlots: 2, boughtSlots: 1, slotPrices: [ 10000, 20000, 30000, 40000 ], allies: [ 'lyra', null, null, null ] }` → equal object.
- `normalizeTeam gives the locked team for a missing payload`: `undefined` and `null` → `LOCKED_TEAM`.
- `normalizeTeam gives the locked team when unlocked is not a boolean`: `unlocked: 'yes'`.
- `normalizeTeam gives the locked team when openSlots is 5`.
- `normalizeTeam gives the locked team when boughtSlots is -1`.
- `normalizeTeam gives the locked team when slotPrices has 3 entries`.
- `normalizeTeam gives the locked team when allies has 3 entries`.
- `normalizeTeam gives the locked team when an ally entry is a number`.
- `teamActive is false before the campaign loads`: `null` → false.
- `teamActive is false at chapter 4 and true at chapters 5 and 15`: one assertion each.
- `teamActive is true for a completed campaign`: `{ chapter: 1, completed: true }` → true.
- `fightingAllies is empty while the team is inactive`: `active: false` with Lyra in slot 1 → `[]`.
- `fightingAllies lists the heroes of bought filled slots with their slot numbers`: `boughtSlots: 4, allies: [ null, 'lyra', null, 'orina' ]` → `[ { slot: 2, hero: lyra }, { slot: 4, hero: orina } ]`.
- `fightingAllies skips an entry in a slot that is not bought`: `boughtSlots: 1, allies: [ 'lyra', 'orina', null, null ]` → only Lyra.
- `fightingAllies skips the leader`: `leaderId: 'lyra'`, `allies: [ 'lyra', null, null, null ]` → `[]`.
- `fightingAllies skips a hero missing from the heroes list`: `heroes: []` → `[]`.
- `each passive has its name and text`: one assertion per hero of `PASSIVES` with the exact strings of the contract (5 assertions, L-081).
- `passiveLine joins the name and the text`: `passiveLine('seraphine')` → `Graça da Aurora: +25% de dano da equipe`; `passiveLine('ghost')` → `''`; `passiveOf('ghost')` → null.
- `teamPassives of no ally is NO_PASSIVES`.
- `Kael brings 5000 ms of boss time`: `teamPassives([ 'kael' ])` → `{ ...NO_PASSIVES, bossTimeMs: 5000 }`.
- `Lyra brings 10 points of critical chance`.
- `Orina brings 15 points off the defense`.
- `Vex brings 15 points off the critical resistance`.
- `Seraphine brings the team factor 1.25`.
- `all five passives add up`: `[ 'kael', 'lyra', 'orina', 'vex', 'seraphine' ]` → `{ bossTimeMs: 5000, critChance: 10, defenseBreak: 15, critResistBreak: 15, allyFactor: 1.25 }`.
- `activePassives is NO_PASSIVES below chapter 5`: Kael in slot 1, position `{ chapter: 4, completed: false }`.
- `activePassives applies Kael at chapter 5`: same team, position `{ chapter: 5, completed: false }` → `bossTimeMs` 5000.
- `slotStates of a locked team shows four locked slots with their chapter and price`: → `[ { slot: 1, state: 'locked', heroId: null, priceGold: 1, chapter: 5 }, { slot: 2, ..., priceGold: 2, chapter: 6 }, { slot: 3, ..., priceGold: 3, chapter: 7 }, { slot: 4, ..., priceGold: 4, chapter: 8 } ]`.
- `slotStates with slot 1 open shows it buyable and the rest locked`: `openSlots: 1, boughtSlots: 0` → states `[ 'buyable', 'locked', 'locked', 'locked' ]`.
- `slotStates with three open and none bought shows buyable, waiting, waiting, locked`.
- `slotStates with one bought of two open shows empty, buyable, locked, locked`.
- `slotStates with four bought shows filled and empty slots with their heroes`: `allies: [ 'lyra', null, 'orina', null ]` → `[ filled lyra, empty, filled orina, empty ]` with `heroId` `lyra`, null, `orina`, null.
- `availableHeroes lists the owned heroes outside the team in catalog order`: leader Kael, Lyra in slot 1 (`boughtSlots` 1), Seraphine not owned, Orina and Vex owned → `[ orina, vex ]`.
- `availableHeroes lists a hero whose entry sits in a slot that is not bought`: `boughtSlots: 1, allies: [ 'lyra', 'orina', null, null ]` → Orina listed.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] `team.js` exports every name of the contract.
- [x] The 34 cases of `team.test.js` pass and the whole Vitest suite passes.

**Commit**: `feat(game): add the team rules`

---

### T8: Build the attacker of an ally [x]

**Owner**: game-dev
**Goal**: One pure function gives the attacker of an ally hit and its shown damage per second from its stars, its pieces, the leader's element and the team factor (TEAM-06 AC 2 to 6, TEAM-09 AC 22).
**Where**: `game/src/domain/combat/allyAttacker.js` (new)
**Also changes**: `game/src/domain/combat/allyAttacker.test.js` (new)
**Read first**: `game/src/domain/equipment/equipment.js:59-81` (`attackerFor`), `game/src/domain/combat/damage.js:7` (`PLAYER`), `game/src/domain/combat/leaderAttacker.js`, `game/src/domain/combat/leaderAttacker.test.js` (piece fixtures), spec § Ally Damage, design § Game `allyAttacker.js`
**Depends on**: T7
**Requirement**: TEAM-06, TEAM-09

**Contract**:

```js
//  The attacker of one ally hit (spec hero-team, Ally Damage): Ally Base (1 + weapon click damage, times the click damage percent of its
//  own pieces) times the star multiplier and the team factor, the element of the leader, the armor pierce and boss damage of its pieces,
//  never critical. Pure JavaScript: no Phaser.
import { attackerFor } from '../equipment/equipment';
import { PLAYER } from './damage';

export const ALLY_STAR_MULTIPLIER = Object.freeze([ 2, 4, 6, 8, 10, 12, 14, 16, 18, 20 ]);

//  The multiplier of `stars` 0 to 9; anything else reads the 0-star multiplier
export const allyStarMultiplier = (stars) => ALLY_STAR_MULTIPLIER[stars] ?? ALLY_STAR_MULTIPLIER[0];

export const allyAttacker = ({ ally, pieces = [], leaderElement, allyFactor = 1 }) =>
{
    const worn = attackerFor({ ...PLAYER, element: leaderElement }, pieces);

    return {
        element: leaderElement,
        baseDamage: worn.baseDamage * allyStarMultiplier(ally.stars) * allyFactor,
        critChance: 0,
        critMultiplier: 1,
        armorPierce: worn.armorPierce ?? 0,
        bossDamage: worn.bossDamage ?? 0
    };
};

//  What the Equipe screen shows as `Dano: <n>/s`: the base of the attacker, before element, defense and boss factor
export const allyDamagePerSecond = ({ ally, pieces = [], allyFactor = 1 }) => allyAttacker({ ally, pieces, leaderElement: PLAYER.element, allyFactor }).baseDamage;
```

Piece fixtures: weapon `{ id: 'w', slot: 'WEAPON', clickDamage: 10, affixes: [] }`, ring `{ id: 'r', slot: 'RING', affixes: [ { type: 'CLICK_DAMAGE_PCT', value: 20 } ] }`.

**Steps**:

1. Write `allyAttacker.js` exactly as above.
2. Write the tests below.
3. Run the gate.

**Tests**: unit
**Test cases** (`allyAttacker.test.js`, exact names):

- `the star multiplier is 2, 4, 6, 8, 10, 12, 14, 16, 18 and 20 for 0 to 9 stars`: one assertion per star count (10 assertions).
- `a star count outside 0 to 9 reads 2`: `10`, `-1` and `undefined` → 2.
- `an ally with no pieces at 0 stars hits for 2 with the leader's element, no critical, no pierce and no boss damage`: `allyAttacker({ ally: { stars: 0 }, leaderElement: 'WATER' })` → `{ element: 'WATER', baseDamage: 2, critChance: 0, critMultiplier: 1, armorPierce: 0, bossDamage: 0 }`.
- `Orina 3 stars with a 10 click weapon at +0 and a ring of +20 % click damage has base 105.6 (E3)`: `baseDamage` ≈ 105.6.
- `the team factor 1.25 makes Lyra 0 stars 2.5`.
- `a 9 star ally without pieces has base 20 (E12)`.
- `armor pierce and boss damage come from the ally's pieces`: ring `ARMOR_PIERCE_PCT` 50 → `armorPierce` 50; amulet `{ slot: 'AMULET', affixes: [ { type: 'BOSS_DAMAGE_PCT', value: 20 } ] }` → `bossDamage` 20.
- `critical chance and critical damage pieces do not make an ally critical`: ring `CRIT_CHANCE` 50 and `CRIT_DAMAGE_PCT` 100 → `critChance` 0, `critMultiplier` 1, `baseDamage` 2.
- `allyDamagePerSecond reads 2, 105.6, 2.5 and 12500`: Lyra 0 stars → 2; Orina E3 → 105.6; Lyra 0 stars with factor 1.25 → 2.5; Lyra 9 stars with a weapon of `clickDamage` 624 → 12 500.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 9 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): build the attacker of an ally`

---

### T9: Thread the passives into the leader attacker and the monster stats [x]

**Owner**: game-dev
**Goal**: Lyra's passive raises the leader's critical chance; Orina's lowers the defense and Vex's the critical resistance every hit meets (TEAM-11 AC 2, 3, 4).
**Where**: `game/src/domain/combat/leaderAttacker.js`
**Also changes**: `game/src/domain/talents/talents.js` (`monsterAfterBreak`), `game/src/domain/combat/leaderAttacker.test.js`, `game/src/domain/talents/talents.test.js`
**Read first**: `game/src/domain/combat/leaderAttacker.js` (whole file), `game/src/domain/talents/talents.js:9-56` (`talentValue`, `monsterAfterBreak`, `addBonuses`), the existing tests of both files, spec § Passive Table (P4 to P9), design § Game passives in the builders
**Depends on**: T8
**Requirement**: TEAM-11

**Contract**:

```js
// leaderAttacker.js
import { NO_PASSIVES } from '../heroes/team';

//  `passives` are the team passives that apply now (spec hero-team); only `critChance` (Lyra) reaches the leader attacker
export const leaderAttacker = ({ leader, pieces = [], talents = null, passives = NO_PASSIVES }) =>
{
    const base = leader ? { ...PLAYER, element: leader.element } : PLAYER;
    const team = { clickDamageFlat: 0, clickDamagePct: 0, critChance: passives.critChance ?? 0, critDamagePct: 0 };

    return attackerFor(base, pieces, addBonuses(addBonuses(starBonus(leader?.stars ?? 0), talentAttackerBonus(talents)), team));
};

// talents.js: the stats after the break talents and the team passives (Orina `defenseBreak`, Vex `critResistBreak`), none below 0
export const monsterAfterBreak = (stats, talents, passives = {}) => ({
    ...stats,
    defense: Math.max(0, defenseOf(stats) - talentValue(talents, 'PHYSICAL_BREAK') - (passives.defenseBreak ?? 0)),
    critResistance: Math.max(0, stats.critResistance - talentValue(talents, 'CRIT_RESIST_BREAK') - (passives.critResistBreak ?? 0))
});
```

Update the comment above `monsterAfterBreak` to name the passives.

**Steps**:

1. Edit both functions as above.
2. Add the cases below; keep every existing case unchanged.
3. Run the gate.

**Tests**: unit
**Test cases**:

`leaderAttacker.test.js` (exact names):

- `Lyra's passive adds 10 points of critical chance: a 0 star Kael reads 20`: `leaderAttacker({ leader: { element: 'FIRE', stars: 0 }, passives: { ...NO_PASSIVES, critChance: 10 } }).critChance` → 20.
- `the passive critical chance caps at 100`: a ring `CRIT_CHANCE` 95 plus the passive → 100.
- `the passive changes nothing else`: `baseDamage` 1 and `critMultiplier` 2 with the passive.
- `without passives the attacker is the one of before`: `leaderAttacker({ leader: { element: 'FIRE', stars: 3 } })` equals the same call with `passives: NO_PASSIVES`.

`talents.test.js` (exact names):

- `Orina's passive lowers the defense by 15 after the break talent: 40 with PHYSICAL_BREAK 5 reads 20`.
- `Orina's passive on defense 10 reads 0`.
- `Vex's passive lowers the critical resistance by 15: 30 reads 15`.
- `Vex's passive with CRIT_RESIST_BREAK 3 on critical resistance 10 reads 0`.
- `an old payload with physicalDefense 50 and Orina's passive reads defense 35`: `{ element: 'FIRE', physicalDefense: 50, magicalDefense: 50, critResistance: 0 }`.
- `no passives argument keeps the result of before`: `monsterAfterBreak(stats, talents)` equals `monsterAfterBreak(stats, talents, {})`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 10 new cases and every existing case of both files pass; the whole Vitest suite passes.

**Commit**: `feat(game): apply the team passives to the leader and the monster`

---

### T10: Land an ally hit through the one damage [x]

**Owner**: game-dev
**Goal**: `SkillCombat.allyHit` lands one ally hit through the strike of a tick, so it meets the one defense and every effect (TEAM-05, TEAM-06).
**Where**: `game/src/domain/skills/skillCombat.js`
**Also changes**: `game/src/domain/skills/skillCombat.test.js`
**Read first**: `game/src/domain/skills/skillCombat.js:11-65` (constructor, `follow`, `factors`), `:315-327` (`tickHit`), `game/src/domain/skills/skillDamage.js` (whole file), `game/src/domain/skills/skillCatalog.js:13-38` (which slot holds Prisão, Bênção, Brado, Ventos, Fumaça), `game/src/domain/skills/skillCombat.test.js:1-60` (helpers `stats`, `monsterOf`, `combat`, `use`), spec § Ally Damage (E1 to E15), design § Game `SkillCombat.allyHit`
**Depends on**: T9
**Requirement**: TEAM-05, TEAM-06

**Contract**:

```js
//  One ally hit on `monster` (spec hero-team): the ally's attacker through the strike of a tick at 100 %, so it is never critical, gets
//  no click bonus and meets the one defense, Brado, Prisão and Bênção like every strike (spec unified-damage); damages the monster
allyHit ({ attacker, monster, boss })
{
    this.follow(monster);

    const damage = tickDamage({
        attacker, percent: 100, buffs: this.buffIds(), debuffs: this.debuffIds(), defender: this.statsOf(monster), boss, factors: this.factors()
    });

    monster.hit(damage);

    return { damage, critical: false };
}
```

Place it right after `click`. Test fixture: `const leader = leaderAttacker({ leader: { element: 'FIRE', stars: 3 } })` (a 3-star leader unlocks every skill) and `const ally = (stars = 0, pieces = [], allyFactor = 1, leaderElement = 'FIRE') => allyAttacker({ ally: { stars }, pieces, leaderElement, allyFactor })`; monsters are `new Monster(1000, null, { element, defense, critResistance: 0 })`; a skill is started with `combat.use({ heroId, slot, unlocked: true, level: 1, attacker: leader, monster, boss: false })` (Orina 1 Prisão, Seraphine 1 Bênção, Kael 3 Brado, Lyra 3 Ventos, Vex 2 Fumaça).

**Steps**:

1. Add `allyHit` to `SkillCombat`.
2. Add `describe('allyHit', ...)` with the cases below to `skillCombat.test.js`; each case reads the damage as `1000 - monster.health` and as the returned `damage`.
3. Run the gate.

**Tests**: unit
**Test cases** (`skillCombat.test.js`, exact names):

- `E1: Lyra 0 stars deals 2 to a FIRE monster with defense 0`.
- `E2: Lyra 0 stars deals 1 to a FIRE monster with defense 50`.
- `E3: Orina 3 stars with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50`.
- `E4: Lyra 0 stars with +20 % boss damage deals 2.16 to a FIRE miniboss with defense 10`: `boss: true`.
- `E5: Lyra and Seraphine 0 stars with the team factor deal 2.5 each`: two `allyHit` calls with `ally(0, [], 1.25)` → 5 in total.
- `E6: Vex 0 stars with 50 % armor pierce deals 1.6 to a FIRE monster with defense 40`.
- `E7: Prisão de Espinhos raises an ally hit to 2.5`: Orina slot 1 used first.
- `E8: Bênção da Grande Árvore raises an ally hit to 2.6`: Seraphine slot 1 used first.
- `E9: Brado Aterrador lowers the defense 40 an ally meets to 10: 1.8`: Kael slot 3 used first.
- `E10: PHYSICAL_BREAK 5 lowers the defense 40 an ally meets to 35: 1.3`: `new SkillCombat({ random, statsOf: (m) => monsterAfterBreak(m.stats, [ { id: 'PHYSICAL_BREAK', baseId: 'PHYSICAL_BREAK', value: 5 } ]) })`.
- `E11: Orina's passive lowers the defense 40 two allies meet to 25: 1.5 each`: `statsOf: (m) => monsterAfterBreak(m.stats, null, { defenseBreak: 15 })`.
- `E12: Lyra 9 stars deals 20`.
- `E13: critical pieces, Ventos Ligeiros and Bomba de Fumaça leave an ally hit at 2`: ring `CRIT_CHANCE` 50 and `CRIT_DAMAGE_PCT` 100; Lyra slot 3 and Vex slot 2 used first; `random` returns 0.
- `E14: a 3 star leader with CLICK_DAMAGE 20 leaves an ally hit at 2`: the leader attacker is not passed to `allyHit`; assert 2.
- `E15: the leader's element decides: FIRE deals 4 and WATER deals 1 to a NATURE monster`: `ally(0, [], 1, 'FIRE')` → 4; a new monster, `ally(0, [], 1, 'WATER')` → 1.
- `an ally hit is never critical even when random returns 0`: `critical` false, damage 2.
- `an ally hit after Prisão ended deals 2 again`: Orina slot 1, `combat.advance(2000, { monster })`, `allyHit` → 2.
- `an ally hit on a dead monster deals nothing`: monster of 1 health killed by a first hit; a second `allyHit` leaves health 0 and the monster dead.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 18 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): land ally hits through the one damage`

---

### T11: Add the one-second clock of the allies [x]

**Owner**: game-dev
**Goal**: `AllyCombat` lands the ally ticks every 1000 ms of fight time in slot order, stops a tick at a kill and restarts for every new monster, with a `target` seam for `miniboss-adds` (TEAM-07).
**Where**: `game/src/domain/combat/allyCombat.js` (new)
**Also changes**: `game/src/domain/combat/allyCombat.test.js` (new)
**Read first**: `game/src/domain/skills/skillCombat.js:36-48` (`follow`), `game/src/domain/combat/monster.js` (`Monster`), spec § Ally Damage (Rhythm), § Consistency With `miniboss-adds`, Edge Cases, design § Game `AllyCombat`
**Depends on**: T10
**Requirement**: TEAM-07

**Contract**:

```js
//  The clock of the team (spec hero-team): every fighting ally hits once each 1000 ms of fight time, in slot order; the first tick lands
//  1000 ms after a monster appears. It holds no damage rule: `hit` lands each hit. Pure JavaScript: no Phaser.
export const ALLY_TICK_MS = 1000;

export class AllyCombat
{
    constructor ()
    {
        this.monster = null;
        this.untilTickMs = ALLY_TICK_MS;
    }

    //  Moves the clock by `ms`.
    //    monster  the monster of the encounter; null or dead lands nothing and puts the clock back at 1000 ms; another monster than
    //             the last call restarts the clock at 1000 ms
    //    allies   [ { slot, attacker } ] in slot order; empty lands nothing and puts the clock back at 1000 ms
    //    hit(attacker, target) -> damage   lands one hit
    //    target() the monster the next hit lands on, read before every hit (miniboss-adds); null or dead ends the tick
    //  Returns { ticks: [ { slots, damage } ] }: one entry per elapsed 1000 ms in which at least one hit landed.
    advance (ms, { monster, allies, hit, target = () => monster })
    {
        // 1. if monster !== this.monster: this.monster = monster; this.untilTickMs = ALLY_TICK_MS
        // 2. if !monster || monster.dead || allies.length === 0: this.untilTickMs = ALLY_TICK_MS; return { ticks: [] }
        // 3. this.untilTickMs -= ms
        // 4. while this.untilTickMs <= 0 and the monster is alive:
        //      this.untilTickMs += ALLY_TICK_MS
        //      land the allies in order: before each, const aim = target(); stop the tick if !aim || aim.dead;
        //      damage = hit(attacker, aim); push the slot; add the damage
        //      if at least one landed, push { slots, damage } to ticks
        // 5. if the monster died, this.untilTickMs = ALLY_TICK_MS
        // 6. return { ticks }
    }
}
```

Test helpers: `const hitter = (base) => ({ baseDamage: base })`; `const hit = vi.fn((attacker, target) => { target.hit(attacker.baseDamage); return attacker.baseDamage; })`; monsters are `new Monster(health)`.

**Steps**:

1. Write `allyCombat.js` from the contract.
2. Write the tests below.
3. Run the gate.

**Tests**: unit
**Test cases** (`allyCombat.test.js`, exact names):

- `lands nothing at 999 ms and one tick at 1000 ms`: `advance(999)` → `ticks` `[]`, health 10; `advance(1)` → `ticks` `[ { slots: [ 1 ], damage: 2 } ]`, health 8 (L-030).
- `hits in slot order and sums the tick`: slots 1 (base 2) and 2 (base 3) → the `hit` calls in order slot 1 then slot 2; tick `{ slots: [ 1, 2 ], damage: 5 }`.
- `a kill stops the later slots of the tick`: monster of 2 health, slots 1 (base 2) and 2 (base 3) → tick `{ slots: [ 1 ], damage: 2 }`; `hit` called once.
- `the clock starts again at 1000 ms for the next monster after a kill`: after the kill above, a new monster B: `advance(999)` → none; `advance(1)` → one tick on B.
- `a new monster restarts the clock`: `advance(600)` with A, `advance(600)` with B → no tick; `advance(400)` with B → one tick.
- `no monster lands nothing and puts the clock back at 1000 ms`: `advance(600)` with A, `advance(100)` with `monster: null`, then `advance(999)` with A → none; `advance(1)` → one tick.
- `a dead monster lands nothing`: a monster with health 0 → `ticks` `[]`, `hit` not called.
- `no ally lands nothing and puts the clock back at 1000 ms`: `advance(900)` with `allies: []`, then `advance(999)` with one ally → none; `advance(1)` → one tick.
- `one advance of 2500 ms lands two ticks and keeps 500 ms`: monster of 100 health → 2 ticks; `advance(499)` → none; `advance(1)` → one tick.
- `the target is read before every hit`: `target` returns monster A for the first call and B for the second; slots 1 and 2 → slot 1 hits A, slot 2 hits B.
- `a null target ends the tick`: `target: () => null` → `ticks` `[]`, `hit` not called.
- `the clock follows the monster, not the target`: `advance(600)` with monster A and target B, then `advance(400)` with monster A and target C → one tick, on C.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 12 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): add the one-second clock of the allies`

---

### T12: Show the passives in the attribute panel [x]

**Owner**: game-dev
**Goal**: The attribute panel of the Equipamento screen counts the team passives that apply now, from the same builders as the combat (TEAM-11 AC 9, AD-012).
**Where**: `game/src/domain/equipment/leaderStats.js`
**Also changes**: `game/src/domain/equipment/leaderStats.test.js`
**Read first**: `game/src/domain/equipment/leaderStats.js` (whole file), `game/src/domain/equipment/leaderStats.test.js`, spec § Passive Table (P10)
**Depends on**: T11
**Requirement**: TEAM-11

**Contract**:

```js
import { NO_PASSIVES } from '../heroes/team';

//  `passives`: the team passives that apply now (spec hero-team): Lyra in the critical chance, Kael in both time lines, Orina in the
//  defense break line and Vex in the critical resistance break line
export const leaderStats = ({ leader, pieces = [], talents = null, passives = NO_PASSIVES }) =>
{
    const attacker = leaderAttacker({ leader, pieces, talents, passives });
    const equipmentSeconds = bossTimeBonusMs(pieces) / 1000 + passives.bossTimeMs / 1000;
    // the lines as before, with:
    //   breakDefense: `Quebra de defesa: ${talentValue(talents, 'PHYSICAL_BREAK') + passives.defenseBreak}`
    //   breakCrit: `Quebra de resistência a crítico: ${talentValue(talents, 'CRIT_RESIST_BREAK') + passives.critResistBreak}`
};
```

**Steps**:

1. Edit `leaderStats` as above; the ids, order and other texts of the lines do not change.
2. Add the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`leaderStats.test.js`, exact names):

- `P10: Lyra, Kael, Orina and Vex as allies read 20 %, 5 s, 5 s, 15 and 15`: leader `{ element: 'FIRE', stars: 0 }`, no pieces, no talents, `passives` `{ bossTimeMs: 5000, critChance: 10, defenseBreak: 15, critResistBreak: 15, allyFactor: 1 }` → `Chance de crítico: 20%`, `Tempo extra de miniboss: 5s`, `Tempo extra de chefe: 5s`, `Quebra de defesa: 15`, `Quebra de resistência a crítico: 15`.
- `Lyra alone raises only the critical chance`: `critChance: 10` → `Chance de crítico: 20%`, both time lines `0s`, both break lines `0`.
- `Kael adds 5 s to the talent seconds`: `MINIBOSS_TIME` value 4 and `bossTimeMs` 5000 → `Tempo extra de miniboss: 9s`.
- `Orina adds 15 to PHYSICAL_BREAK 3`: → `Quebra de defesa: 18`.
- `Vex adds 15 to the critical resistance break`: → `Quebra de resistência a crítico: 15`.
- `without passives the lines are the ones of before`: equal to the call with `NO_PASSIVES`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 6 new cases and every existing case pass; the whole Vitest suite passes.

**Commit**: `feat(game): count the team passives in the attribute panel`

---

### T13: Call the team routes from the game [x]

**Owner**: game-dev
**Goal**: The heroes gateway saves the allies (`PUT /team`) and buys a slot (`POST /team/slots`) (TEAM-09, TEAM-10, TEAM-13).
**Where**: `game/src/adapters/http/heroesApi.js`
**Also changes**: `game/src/adapters/http/heroesApi.test.js`
**Read first**: `game/src/adapters/http/heroesApi.js`, `game/src/adapters/http/heroesApi.test.js` (whole file), `game/src/adapters/http/autoClickApi.js` (a POST with a body), spec Contract row
**Depends on**: T12
**Requirement**: TEAM-09, TEAM-10, TEAM-13

**Contract**:

```js
//  (header comment gains:) list -> { leaderId, heroes, team } with team = { unlocked, openSlots, boughtSlots, slotPrices, allies };
//  setLeader(heroId) -> { leaderId, team }; setTeam(allies) -> { leaderId, team } (PUT /team); buySlot(fromSlots) -> { team, wallet }
//  (POST /team/slots). A 400, 404 or 409 (INVALID_TEAM, HERO_NOT_FOUND, TEAM_LOCKED, TEAM_SLOT_NOT_BOUGHT, HERO_NOT_OWNED,
//  INVALID_TEAM_SLOT_REQUEST, TEAM_SLOT_MISMATCH, TEAM_SLOTS_MAX, TEAM_SLOT_LOCKED, NOT_ENOUGH_COPPER) rejects with an ApiError.
setTeam: async (allies) => (await httpClient.put('/team', { allies })).data,

buySlot: async (fromSlots) => (await httpClient.post('/team/slots', { fromSlots })).data
```

**Steps**:

1. Add the two methods and the comment.
2. Add the cases below (reject `httpClient.put` or `httpClient.post` with `new ApiError(...)` built as the existing rejection cases of `heroesApi.test.js` or `autoClickApi.test.js` build it).
3. Run the gate.

**Tests**: unit
**Test cases** (`heroesApi.test.js`, exact names):

- `setTeam puts the allies to /team and returns the body`: `setTeam([ 'lyra', null, null, null ])` → `httpClient.put` called with `'/team', { allies: [ 'lyra', null, null, null ] }`; resolves with the `data`.
- `buySlot posts fromSlots to /team/slots and returns the body`: `buySlot(0)` → `httpClient.post` called with `'/team/slots', { fromSlots: 0 }`.
- `setTeam rejects with the error of the client`: the rejection of `httpClient.put` comes out unchanged.
- `buySlot rejects with the error of the client`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 4 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): call the team routes`

---

### T14: Keep the team in the hero collection [x]

**Owner**: game-dev
**Goal**: The hero collection holds the team payload, saves allies, buys slots, takes the team of a leader change and hands the purchase wallet to listeners (TEAM-09, TEAM-10, TEAM-13).
**Where**: `game/src/application/heroes/heroCollection.js`
**Also changes**: `game/src/application/heroes/heroCollection.test.js`
**Read first**: `game/src/application/heroes/heroCollection.js` (whole file), `game/src/application/heroes/heroCollection.test.js` (whole file), `game/src/application/equipment/equipmentCollection.js` (`onWallet`), design § Game `heroesApi` and `heroCollection`
**Depends on**: T13
**Requirement**: TEAM-09, TEAM-10, TEAM-13

**Contract**:

```js
import { LOCKED_TEAM, normalizeTeam } from '../../domain/heroes/team';

// state: let team = LOCKED_TEAM; const walletListeners = [];
// load: team = normalizeTeam(payload.team) next to heroes and leaderId
team: () => team,

//  Fired with the wallet ({ gold, silver, copper }) a slot purchase answered
onWallet: (listener) => { walletListeners.push(listener); },

//  Stores the allies (4 entries, a hero id or null); the leader and the team change only after the backend accepted them
setTeam: async (allies) =>
{
    const answer = await gateway.setTeam(allies);

    leaderId = answer.leaderId;
    team = normalizeTeam(answer.team);
    changed();

    return team;
},

//  Buys the next ally slot from the bought count the player saw; resolves with { team, wallet }
buySlot: async (fromSlots) =>
{
    const answer = await gateway.buySlot(fromSlots);

    team = normalizeTeam(answer.team);
    walletListeners.forEach((listener) => listener(answer.wallet));
    changed();

    return { team, wallet: answer.wallet };
},

//  setLeader: also `if (answer.team) team = normalizeTeam(answer.team);` before changed()
```

Update the port comment at the top with `setTeam(allies)` and `buySlot(fromSlots)`.

**Steps**:

1. Edit the collection as above.
2. Add the cases below; keep every existing case.
3. Run the gate.

**Tests**: unit
**Test cases** (`heroCollection.test.js`, exact names):

- `team is the locked team before the load`: `team()` → `LOCKED_TEAM`.
- `load stores the team of the payload`: payload with `team: { unlocked: true, openSlots: 1, boughtSlots: 1, slotPrices: [ 10000, 20000, 30000, 40000 ], allies: [ 'lyra', null, null, null ] }` → `team()` equal.
- `load of a payload without team gives the locked team`.
- `setTeam stores the leader and the team of the answer and fires onChange once`.
- `setTeam that fails keeps the team and fires nothing`.
- `buySlot stores the team, hands the wallet to the wallet listeners, fires onChange and resolves with team and wallet`: answer `{ team: { ...boughtSlots: 1 }, wallet: { gold: 0, silver: 50, copper: 0 } }`.
- `buySlot that fails keeps the team and fires no listener`.
- `setLeader stores the team of the answer`: answer `{ leaderId: 'lyra', team: { ...allies: [ 'kael', null, null, null ] } }`.
- `setLeader of an answer without team keeps the team`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 9 new cases and every existing case pass; the whole Vitest suite passes.

**Commit**: `feat(game): keep the team in the hero collection`

---

### T15: Land the ally ticks in the combat scene [x]

**Owner**: game-dev
**Goal**: The scene lands the ally ticks every frame before the skills, shows the light-blue number, handles a kill like a click kill, applies the passives to the click, the enemy line and the countdown, takes the purchase wallet and reloads the heroes on a chapter change (TEAM-06, TEAM-07, TEAM-08, TEAM-09 AC 21, TEAM-11).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `game/src/adapters/phaser/ClickerGame.js:118-160` (`create`), `:533-550` (`createHeroUi`), `:613-619` (`leaderPieces`), `:749-785` (`showEncounter`, `refreshEnemyStats`), `:859-902` (`update`), `:939-942` (`leaderAttacker`), `:1159-1176` (`afterDamage`), `:1405-1419` (`showDamage`); `game/src/adapters/phaser/ClickerGame.test.js:18-120` (fixtures and `createScene`), `:1111-1127` (helpers `killAll`, `advance`, `label`, `timer` of `describe('ClickerGame stages')`), `:1440-1455` (next chapter test); spec § Ally Damage (Rhythm), § Allies on the Field (number), design § Game `ClickerGame`
**Depends on**: T14
**Requirement**: TEAM-06, TEAM-07, TEAM-08, TEAM-09, TEAM-11

**Contract**:

```js
// imports
import { AllyCombat } from '../../domain/combat/allyCombat';
import { allyAttacker } from '../../domain/combat/allyAttacker';
import { activePassives, fightingAllies, teamActive } from '../../domain/heroes/team';

// constants, next to NORMAL_TEXT
const ALLY_TEXT = { color: '#7fd4ff', fontSize: 28 };
//  The ally number stands right of the monster centre so it does not cover the click numbers (spec hero-team)
const ALLY_TEXT_OFFSET = 70;

// create(): right after `this.skills = new SkillCombat(...)`:
//     this.allies = new AllyCombat();
//     this.encounterChapter = null;
//   the statsOf of SkillCombat becomes (monster) => monsterAfterBreak(monster.stats, this.talents.talents(), this.passives())
//   after `this.equipment.onWallet(...)`: this.heroes.onWallet((coins) => this.receiveWallet(coins));
// createHeroUi(): this.heroes.onChange(() => { this.showCharacter(); this.refreshEnemyStats(); });

//  The heroes of the bought, filled ally slots while the team is active (spec hero-team); none before the heroes or the campaign load
fightingAllies ()
{
    return fightingAllies({ team: this.heroes.team(), heroes: this.heroes.heroes(), leaderId: this.heroes.leaderId(), active: teamActive(this.session.mapPosition()) });
}

//  The passives of the fighting allies: they reach the click, the monster stats and the boss countdown
passives ()
{
    return activePassives({ team: this.heroes.team(), heroes: this.heroes.heroes(), leaderId: this.heroes.leaderId(), position: this.session.mapPosition() });
}

//  The attacker of each fighting ally, read at every tick: its stars and pieces, the element of the leader and Seraphine's factor
allyAttackers ()
{
    const leader = this.heroes.leader();

    if (!leader)
    {
        return [];
    }

    const { allyFactor } = this.passives();

    return this.fightingAllies().map(({ slot, hero }) => ({
        slot, attacker: allyAttacker({ ally: hero, pieces: wornBy(this.equipment.pieces(), hero.id), leaderElement: leader.element, allyFactor })
    }));
}

//  The ally ticks of this frame on the monster on screen (a countdown means a boss); shows one number per tick. Returns how many landed.
allyFrame (delta)
{
    const monster = this.monster && !this.monster.dead ? this.monster : null;
    const boss = this.countdown !== null;
    const { ticks } = this.allies.advance(delta, {
        monster,
        allies: this.allyAttackers(),
        hit: (attacker, target) => this.skills.allyHit({ attacker, monster: target, boss }).damage
    });

    ticks.forEach(({ damage, slots }) =>
    {
        this.showDamage(formatDamage(damage), MONSTER.x + ALLY_TEXT_OFFSET, false, ALLY_TEXT);
        this.onAllyTick(slots);
    });

    return ticks.length;
}

//  The sprites of the slots that landed move (T16 fills it in); nothing to do here yet
onAllyTick ()
{
}

// showDamage gains a fourth parameter: showDamage (damage, x, critical = false, style = null)
//   const textStyle = { ...DAMAGE_FONT, ...(style ?? (critical ? CRITICAL_TEXT : NORMAL_TEXT)) };

// update(): after `this.showCombo();` the frame becomes
//     const alive = this.monster && !this.monster.dead;
//     //  The allies strike first, so an effect that ends in this frame still counts for them (spec hero-team)
//     const allyTicks = this.allyFrame(delta);
//     //  The stop of Stun and Root is read before the skills use it up with this frame
//     const countdownMs = this.skills.countdownMs(delta);
//     const { hits } = this.skills.advance(delta, { monster: this.monster, boss: this.countdown !== null });
//     hits.forEach(...as today...);
//     if (alive && this.monster.dead) { this.afterDamage(); }
//     else if (alive && (hits.length > 0 || allyTicks > 0)) { this.updateHealthBar(); }

// showEncounter(encounter), right after the `if (!encounter)` block:
//     //  A new chapter (a chapter boss won, a reset) can open ally slots or turn the team on or off: read the heroes again
//     if (this.encounterChapter !== null && this.session.chapter !== this.encounterChapter) { this.loadHeroes(); }
//     this.encounterChapter = this.session.chapter;
//     this.showCharacter();
//   the enemy line: this.showEnemyStats(monsterAfterBreak(encounter.stats, this.talents.talents(), this.passives()));
//   the countdown: new BossCountdown(encounter.timeLimitMs + bossTimeBonusMs(this.leaderPieces())
//                  + talentTimeBonusMs(this.talents.talents(), encounter) + this.passives().bossTimeMs)
// refreshEnemyStats(): monsterAfterBreak(this.monsterStats, this.talents.talents(), this.passives())
// leaderAttacker(): leaderAttacker({ leader: ..., pieces: ..., talents: ..., passives: this.passives() })
```

Test fixtures (add at the top of `ClickerGame.test.js`, after `heroesResponse`):

```js
const TEAM_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const teamPayload = (allies, { openSlots = 4, boughtSlots = 4, unlocked = true } = {}) => ({ unlocked, openSlots, boughtSlots, slotPrices: [ 10000, 20000, 30000, 40000 ], allies });
//  Every hero owned and FIRE (heroEntry); `stars` gives a hero more stars, e.g. { lyra: 9 }
const teamHeroes = (allies, { leaderId = 'kael', stars = {} } = {}) => ({
    leaderId, heroes: TEAM_IDS.map((id) => heroEntry(id, { 0: 1 }, stars[id] ?? 0)), team: teamPayload(allies)
});
const atChapter = (chapter, ...args) => ({ ...progress(...args), chapter });
```

`heroesGateway` gains `setTeam: vi.fn()` and `buySlot: vi.fn()`, reset in `createScene` like `setLeader`. A new `describe('ClickerGame hero team', ...)` copies `killAll`, `advance`, `label` and `timer` of `describe('ClickerGame stages')`. Every case that clicks passes `talents: []`, so the combo adds nothing to the click (AD-013). The monster of stage 1 phase 1 has 10 health and the default stats (FIRE, defense 0, critical resistance 0); a test that needs other stats gives `start` a copy of `definition` whose stage 1 has `monster: { element: 'FIRE', defense: 40, critResistance: 30 }`.

**Steps**:

1. Add the imports, constants and methods; change `create`, `createHeroUi`, `update`, `showEncounter`, `refreshEnemyStats`, `leaderAttacker` and `showDamage` as above.
2. Add the fixtures and the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, `describe('ClickerGame hero team')`, exact names):

- `a fighting ally hits the monster for 2 at 1000 ms with no click`: `createScene({ start: atChapter(5), heroes: teamHeroes([ 'lyra', null, null, null ]) })`, `await flush()`; `scene.update(0, 999)` → `monster.health` 10; `scene.update(0, 1)` → 8.
- `the ally tick shows one light-blue 2 at x 740 in the damage font`: the last of `texts` has `text` `2`, `x` 740, `y` `scene.damageTextY`, `style` with `color` `#7fd4ff`, `fontSize` 28, `fontFamily` `Cinzel`, `fontStyle` `700`, `stroke` `#2a1408`, `strokeThickness` 8.
- `two allies show one number with the sum of the tick`: allies `[ 'lyra', 'orina', null, null ]` → one new text `4`; health 6.
- `Seraphine as an ally multiplies every ally hit by 1.25`: allies `[ 'lyra', 'seraphine', null, null ]` → text `5`; health 5.
- `an ally hit that does not kill moves the health bar and the HP text`: after the first tick the HP text reads `HP 8/10` and the fill width is 0.8 of the bar (as the test `follows a damage tick that does not kill` reads it).
- `an ally kill is handled once and the later slots do not land`: `stars: { lyra: 9 }`, allies `[ 'lyra', 'orina', null, null ]`, wallet `walletResponse(undefined, { 1: [ 3 ] })` → after `update(0, 1000)` the monster is dead, the only new text is `20` (Orina's hit did not land) and `sprites` holds 3 coins; a second `update(0, 1000)` adds no text and no coin.
- `no ally hits while the campaign stands at chapter 4`: `atChapter(4)` → `update(0, 3000)` → health 10, no text with `color` `#7fd4ff`.
- `no ally hits before the heroes load`: `heroes: new Error('offline')`, chapter 5 → health 10 after 3000 ms.
- `a heroes payload without team lands no ally hit`: `heroes: heroesResponse()`, chapter 5 → health 10 after 3000 ms.
- `an ally hit leaves the combo streak unchanged`: `ctx.click()` once, read `ctx.hud('.combo-hud').textContent`; `update(0, 1000)` → the same text.
- `the pause menu freezes the ally clock`: `update(0, 600)`, `scene.pauseFight()`, `update(0, 10000)`, `scene.resumeFight()`, `update(0, 399)` → health 10; `update(0, 1)` → 8.
- `ally hits keep landing while a hero screen is open`: `await scene.heroUi.show('heroes')`, `update(0, 1000)` → 8.
- `a leader change switches the element of the next ally hit`: heroes with Orina `{ ...heroEntry('orina', { 0: 1 }), element: 'WATER' }`; first tick 2; `heroesGateway.setLeader` resolves `{ leaderId: 'orina', team: teamPayload([ 'lyra', null, null, null ]) }`, `await scene.heroes.setLeader('orina')`; next tick deals 1 (WATER against FIRE).
- `an ally that equips a piece hits with it on the next tick`: first tick 2; `equipmentGateway.list` resolves a weapon `{ id: 'w', slot: 'WEAPON', rarity: 'COMMON', refine: 0, clickDamage: 1, affixes: [], heroId: 'lyra', sellPrice: 1 }`, `await scene.equipment.load()`; next tick deals 4.
- `Kael as an ally starts a 30 s miniboss at Time: 35`: `leaderId: 'lyra'`, allies `[ 'kael', null, null, null ]`, `start: atChapter(5, 1, 'PHASE', 5)`; `killAll`, `advance` → `timer(ctx)` `Time: 35`.
- `Kael as the leader brings no passive: Time: 30`: leader Kael, allies `[ 'lyra', null, null, null ]`.
- `a team change keeps the running countdown`: the Kael ally miniboss at `Time: 35`; `heroesGateway.setTeam` resolves `{ leaderId: 'lyra', team: teamPayload([ null, null, null, null ]) }`, `await scene.heroes.setTeam([ null, null, null, null ])` → `timer(ctx)` still `Time: 35`.
- `Orina as an ally shows Defesa 25% on a monster of defense 40`: stage 1 monster `{ element: 'FIRE', defense: 40, critResistance: 30 }`, allies `[ 'orina', null, null, null ]` → `.enemy-stats` text `Fire  Defesa 25%  Crit res 30%`; a click deals 0.75 (health 9.25).
- `Vex as an ally shows Crit res 15% on a monster of critical resistance 30`: same monster, allies `[ 'vex', null, null, null ]` → `Fire  Defesa 40%  Crit res 15%`.
- `Lyra as an ally makes a roll of 15 a critical click`: `ctx.dice.value = 0.15`; allies `[ 'lyra', null, null, null ]`; one click → health 8 (critical 2); a scene without Lyra in the team and the same roll → health 9.
- `the purchase wallet reaches the wallet text`: `heroesGateway.buySlot` resolves `{ team: teamPayload([ null, null, null, null ], { boughtSlots: 1 }), wallet: { gold: 0, silver: 50, copper: 0 } }`, wallet loaded; `await scene.heroes.buySlot(0)` → `walletText().textContent` `Gold: 0  Silver: 50  Copper: 0`.
- `the next chapter reloads the heroes`: `start: atChapter(5, 10, 'CHAPTER_BOSS', 1)`, `campaignGateway.report` resolves `atChapter(6, 1, 'PHASE', 1)`; `killAll`, `advance`, `await flush()` → `heroesGateway.list` called 2 times.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 22 cases pass, every existing `ClickerGame` case passes unchanged, and the whole Vitest suite passes.

**Commit**: `feat(game): land the ally ticks in the combat scene`

---

### T16: Draw the allies in the attack formation [x]

**Owner**: game-dev
**Goal**: The scene draws the leader at the tip of the formation and every fighting ally behind it, fitted in its box, moves each ally on its hit and redraws on every team or chapter change (TEAM-12).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `game/src/adapters/phaser/ClickerGame.js:24-26` (`CHARACTER`), `:553-574` (`showCharacter`), the `onAllyTick` and `showEncounter` of T15; `game/src/adapters/phaser/ClickerGame.test.js:120-140` (the fake `scene.add.image`), spec § Allies on the Field, design § Game `ClickerGame` (Field)
**Depends on**: T15
**Requirement**: TEAM-12

**Contract**:

```js
// constants, next to CHARACTER (which stays)
//  The attack formation (spec hero-team, Q36): fit boxes, bottom centres (origin 0.5, 1) and depths
const FORMATION_LEADER = { x: 320, y: 600, width: 180, height: 240, depth: 0.5 };
const FORMATION = {
    1: { x: 180, y: 460, width: 90, height: 120, depth: 0.4 },
    2: { x: 180, y: 605, width: 90, height: 120, depth: 0.4 },
    3: { x: 75, y: 450, width: 90, height: 120, depth: 0.3 },
    4: { x: 75, y: 615, width: 90, height: 120, depth: 0.3 }
};
const ALLY_MOVE = { distance: 24, duration: 100 };

//  Scaled to fit the box and keep the aspect ratio
const fitScale = (image, box) => Math.min(box.width / image.width, box.height / image.height);

// create(): `this.allySprites = new Map();` next to `this.character = null;`

//  The leader and the fighting allies. With no ally drawn the leader stands as before (CHARACTER); with at least one, at the tip of the
//  formation with the allies behind it. Nothing shows until the heroes load.
showCharacter ()
{
    const leader = this.heroes.leader();

    if (!leader)
    {
        return;
    }

    // 1. the leader image (create or setTexture `hero_${leader.id}`), origin (0.5, 1), depth FORMATION_LEADER.depth
    // 2. const allies = this.fightingAllies();
    // 3. allies.length === 0: position (CHARACTER.x, CHARACTER.y), scale CHARACTER.height / image.height
    //    else: position (FORMATION_LEADER.x, FORMATION_LEADER.y), scale fitScale(image, FORMATION_LEADER)
    // 4. every slot 1 to 4: kill the tweens of its old sprite (this.tweens.killTweensOf) and destroy it; then for each
    //    { slot, hero } of allies: this.add.image(box.x, box.y, `hero_${hero.id}`).setOrigin(0.5, 1).setDepth(box.depth)
    //    .setScale(fitScale(image, box)); store it in this.allySprites with its slot
}

//  The sprites of the slots that landed step 24 px toward the monster and back, 100 ms each way
onAllyTick (slots)
{
    slots.forEach((slot) =>
    {
        const sprite = this.allySprites.get(slot);

        if (!sprite)
        {
            return;
        }

        this.tweens.killTweensOf(sprite);
        sprite.x = FORMATION[slot].x;
        this.tweens.add({ targets: sprite, x: FORMATION[slot].x + ALLY_MOVE.distance, duration: ALLY_MOVE.duration, yoyo: true });
    });
}
```

No sprite calls `setInteractive`, so the canvas `pointerdown` handler still gets every click (spec AC 9). The fake `scene.add.image` of `ClickerGame.test.js` gains `width` and `height` from a new `createScene` option `textures` (`{ hero_kael: { width: 300, height: 279 }, ... }`; a key not listed keeps today's `width: 100, height: 400`), `setDepth(depth)` (stores `image.depth`), `destroy: vi.fn()`, and `setTexture` updates `width` and `height` from `textures`. Existing cases keep passing because unlisted keys keep height 400.

`TEXTURES` for the new cases: `{ hero_kael: { width: 300, height: 279 }, hero_lyra: { width: 102, height: 300 }, hero_orina: { width: 125, height: 300 }, hero_seraphine: { width: 118, height: 300 }, hero_vex: { width: 108, height: 300 } }`.

**Steps**:

1. Add the constants and `fitScale`; rewrite `showCharacter`; fill `onAllyTick`.
2. Extend the fake image and `createScene` as above.
3. Add the cases below (`describe('ClickerGame hero team formation')`, chapter 5, `textures: TEXTURES`).
4. Run the gate.

**Tests**: unit
**Test cases** (`ClickerGame.test.js`, exact names):

- `with no ally the leader stands at (230, 612), 320 px high`: allies `[ null, null, null, null ]` → the leader image at x 230, y 612, `scale * height` 320.
- `with Lyra in slot 1 the leader moves to (320, 600) fitted in 180 x 240`: leader Kael → x 320, y 600, `scale` 0.6, depth 0.5.
- `Lyra as leader in the formation is fitted at scale 0.8`: leader Lyra, Kael in slot 1 → leader `scale` 0.8.
- `allies stand at (180, 460), (180, 605), (75, 450) and (75, 615) at depths 0.4, 0.4, 0.3 and 0.3`: leader Kael, allies `[ 'lyra', 'orina', 'seraphine', 'vex' ]` → four images `hero_lyra`, `hero_orina`, `hero_seraphine`, `hero_vex` with those x, y and depth, origin (0.5, 1).
- `Kael in an ally box is scaled 0.3 and Lyra 0.4`: leader Orina, allies `[ 'kael', 'lyra', null, null ]` → `scale` 0.3 and 0.4 (width 90 and 40.8, height 83.7 and 120).
- `an empty or unbought slot draws no sprite`: `boughtSlots: 2`, allies `[ 'lyra', null, null, null ]` → one ally image.
- `no ally is drawn below chapter 5`: `atChapter(4)` with Lyra in slot 1 → no `hero_lyra` image; the leader at (230, 612).
- `no ally is drawn before the heroes load`: heroes `new Error('offline')` → no image.
- `a team change redraws the allies and the leader`: Lyra in slot 1; `heroesGateway.setTeam` resolves allies `[ null, null, null, null ]`; `await scene.heroes.setTeam([ null, null, null, null ])` → the Lyra sprite's `destroy` was called and the leader stands at (230, 612).
- `a leader change redraws the formation`: Lyra in slot 1, leader Kael; `setLeader` resolves `{ leaderId: 'lyra', team: teamPayload([ 'kael', null, null, null ]) }` → the leader image key `hero_lyra`, one ally image `hero_kael` at (180, 460).
- `a chapter change redraws at the next encounter`: the next-chapter flow of T15 from chapter 4 (no ally) to 5 → after the next encounter an ally image stands at (180, 460).
- `each ally hit moves its sprite 24 px right and back in 100 ms each way`: Lyra in slot 1, `update(0, 1000)` → a tween with `targets` the Lyra sprite, `x` 204, `duration` 100, `yoyo` true.
- `a kill moves only the slots that landed`: `stars: { lyra: 9 }`, allies `[ 'lyra', 'orina', null, null ]` → after the killing tick one tween targets the Lyra sprite and none targets the Orina sprite.
- `no ally sprite takes input`: no ally image has `setInteractive` called (the fake records no such call) and a canvas click at (180, 400) still lands a click hit (`talents: []`; `handlers.pointerdown({ x: 180, y: 400 })` lowers the health by 1).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 14 cases pass, every existing `ClickerGame` case passes, and the whole Vitest suite passes.

**Commit**: `feat(game): draw the allies in the attack formation`

---

### T17: Render the Equipe screen [x]

**Owner**: game-dev
**Goal**: A pure DOM view renders the Equipe screen of the spec layout from a model, and a model builder computes every text from the domain (TEAM-09, TEAM-10, TEAM-13).
**Where**: `game/src/adapters/phaser/views/teamView.js` (new)
**Also changes**: `game/src/adapters/phaser/views/teamView.test.js` (new), `game/public/style.css` (new section `/* ══ Equipe ══ */` at the end of the file)
**Read first**: `game/src/adapters/phaser/views/dom.js` (whole file), `game/src/adapters/phaser/views/fusionLadderView.js:36-66` (a confirmation box), `game/src/adapters/phaser/views/leaderView.js`, `game/src/adapters/phaser/views/leaderView.test.js` (jsdom view test style), `game/public/style.css:1974-1983` (`.fusion-all-confirm`), `:247-261` (the gold disc of `.coin-gold`), spec § Equipe Screen Layout and § Player-Facing Texts, design § Game `teamView.js`
**Depends on**: T16
**Requirement**: TEAM-09, TEAM-10, TEAM-13

**Contract**:

```js
import { formatDamage } from '../../../domain/combat/damage';
import { allyDamagePerSecond } from '../../../domain/combat/allyAttacker';
import { wornBy } from '../../../domain/equipment/equipment';
import { leaderBonusText } from '../../../domain/heroes/leaderBonus';
import { activePassives, availableHeroes, passiveLine, passiveOf, slotStates, teamActive } from '../../../domain/heroes/team';
import { el, sprite, starsText } from './dom';

//  The model of the Equipe screen (spec hero-team). `selected` is the selected ally slot or null; `asking` the slot of the purchase
//  dialog or null; `notice` a text or null; `flashSlot` the slot just bought or null; `walletCopper` the copper the player holds.
//  Returns { leader: { id, name, stars, bonusText } | null, slots: [ { slot, state, hero, dpsText, passiveLine, priceGold, chapter } ],
//  selected, available: [ { id, name, stars, passiveName } ], teamDpsText, active, busy, canPick, canAct,
//  asking: { slot, priceGold, affordable } | null, notice, flashSlot }
export const teamModel = ({ team, heroes, leaderId, pieces = [], position, selected = null, busy = false, asking = null, notice = null, flashSlot = null, walletCopper = 0 }) => { /* ... */ };

//  The Equipe screen of `model`; `handlers` = { onSlot(slot), onPick(heroId), onRemove(), onMakeLeader(), onConfirmBuy(), onCancelBuy() }
export const renderTeam = (model, handlers) => { /* ... */ };
```

Model rules:

- `leader`: the hero of `leaderId` with `bonusText: leaderBonusText(hero)`; null when it is not in `heroes`.
- `allyFactor`: `activePassives({ team, heroes, leaderId, position }).allyFactor`.
- `slots`: `slotStates(team)`; a `filled` slot gets `hero` (the entry of `heroes`), `dpsText` `Dano: ${formatDamage(allyDamagePerSecond({ ally: hero, pieces: wornBy(pieces, hero.id), allyFactor }))}/s` and `passiveLine: passiveLine(hero.id)`; every other slot gets `hero: null`, `dpsText: ''`, `passiveLine: ''`.
- `teamDpsText`: `Dano da equipe: ${formatDamage(<sum of the dps of the filled slots>)}/s` (`Dano da equipe: 0/s` with none).
- `available`: `availableHeroes(...)` mapped to `{ id, name, stars, passiveName: passiveOf(id)?.name ?? '' }`.
- `active`: `teamActive(position)`.
- `canPick`: not `busy`, and (the `selected` slot is `filled` or `empty`) or some slot is `empty`.
- `canAct`: not `busy` and the `selected` slot is `filled`.
- `asking`: when `asking` is a slot number, `{ slot, priceGold: <its priceGold>, affordable: walletCopper >= team.slotPrices[slot - 1] }`, else null.

View rules (every class, test id and text from spec § Equipe Screen Layout):

- Root `div.team-screen` (`data-testid="team-screen"`), children in this order: `p.team-status` (`team-status`, text `A equipe luta a partir do capítulo 5.`, `hidden` when `active`), `p.team-notice` (`team-notice`, text `notice`, `hidden` when `notice` is null), `p.team-dps` (`team-dps`), `div.team-slots` (`team-slots`), the dialog (only when `asking`), `div.team-actions`, `h3.team-available-title` `Heróis disponíveis`, `div.team-available` (`team-available`).
- Slot 0: `div.team-slot` `data-testid="team-slot-0"`, `data-state="leader"`, `data-selected="false"`, children `span.team-slot-label` `Líder`, `sprite(leader.id, leader.name, 'team-portrait')`, `span.team-name`, `span.team-stars` (`starsText`), `span.team-bonus` (`bonusText`).
- Slots 1 to 4: `button.team-slot` (`type="button"`, `data-testid="team-slot-<n>"`, `data-state`, `data-selected` `"true"` for `selected`, `data-flash="true"` only for `flashSlot`), first child `span.team-slot-label` `Aliado <n>`; then by state: `filled` → sprite, `span.team-name`, `span.team-stars`, `span.team-dps-line` (`dpsText`), `span.team-passive` (`passiveLine`); `empty` → `span.team-empty` `vazio`; `buyable`, `waiting`, `locked` → `span.team-coin`, `span.team-price` (`String(priceGold)`), and for `locked` `span.team-lock-text` `Chefe do capítulo <chapter>`. `disabled` when `busy` or the state is `waiting` or `locked`. A click calls `handlers.onSlot(n)`.
- Dialog: `div.team-buy-dialog` (`team-buy-dialog`) with `p.team-buy-question` `Comprar a vaga <slot> por <priceGold> ouro?`, `p.team-buy-short` `Moedas insuficientes` only when not `affordable`, `div.team-buy-actions` with `button.fusion-button` `Comprar` (`team-buy-confirm`, `disabled` when `busy` or not `affordable`, calls `onConfirmBuy`) and `button.fusion-button.is-secondary` `Cancelar` (`team-buy-cancel`, `disabled` when `busy`, calls `onCancelBuy`).
- Actions: `button.fusion-button.is-secondary` `Remover` (`team-remove`) and `Tornar líder` (`team-make-leader`), both `disabled` unless `canAct`; they call `onRemove` and `onMakeLeader`.
- Available entries: `button.team-hero` (`type="button"`, `data-testid="team-available-<id>"`, `disabled` unless `canPick`) with `sprite(id, name, 'team-hero-portrait')` and a `span.team-hero-text` holding `span.team-hero-name`, `span.team-hero-stars`, `span.team-hero-passive`; a click calls `onPick(id)`. With no entry: `p.team-available-empty` `Todos os heróis estão na equipe.`.

CSS (append to `game/public/style.css` exactly):

```css
/* ══ Equipe (spec hero-team) ══ */
.team-screen { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.team-status { margin: 0; font-family: var(--font-body); font-weight: 600; font-size: 14px; color: var(--ember-700); }
.team-notice { margin: 0; font-family: var(--font-body); font-weight: 700; font-size: 14px; color: var(--ink-900); }
.team-dps { margin: 0; font-family: var(--font-heading); font-weight: 700; font-size: 18px; color: var(--ink-900); }
.team-slots { display: flex; gap: 16px; justify-content: center; }
.team-slot { box-sizing: border-box; width: 132px; height: 210px; padding: 8px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 4px; background: transparent; border: 2px solid var(--wood-600); font: inherit; color: var(--ink-900); cursor: pointer; }
.team-slot[data-state="leader"] { background: var(--parchment-100); border: 3px solid #e8b64c; cursor: default; }
.team-slot[data-state="filled"] { background: var(--parchment-100); }
.team-slot[data-state="empty"] { border-style: dashed; }
.team-slot[data-state="buyable"] { border-color: var(--gold-400); }
.team-slot[data-state="waiting"],
.team-slot[data-state="locked"] { opacity: 0.5; cursor: default; }
.team-slot[data-selected="true"] { outline: 3px solid var(--ember-500); outline-offset: 2px; }
.team-slot[data-flash="true"] { background: var(--gold-200); }
.team-slot-label { font-family: var(--font-heading); font-weight: 700; font-size: 12px; color: var(--ink-600); }
.team-portrait { width: 80px; height: 80px; object-fit: contain; }
.team-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: var(--font-body); font-weight: 700; font-size: 13px; color: var(--ink-900); }
.team-stars { font-family: var(--font-body); font-weight: 600; font-size: 12px; }
.team-dps-line { font-family: var(--font-body); font-weight: 600; font-size: 12px; color: var(--ember-700); }
.team-passive,
.team-bonus { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-align: center; font-family: var(--font-body); font-weight: 500; font-size: 11px; color: var(--ink-600); }
.team-empty { margin: auto 0; font-family: var(--font-body); font-weight: 500; font-style: italic; font-size: 13px; color: var(--ink-600); }
.team-coin { display: block; width: 32px; height: 32px; margin-top: 40px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff1b0, #e0b45a 55%, #8a5a12); box-shadow: 0 0 0 1px var(--wood-900), inset 0 -2px 0 rgb(0 0 0 / 0.3); }
.team-price { font-family: var(--font-heading); font-weight: 700; font-size: 22px; color: var(--ink-900); }
.team-lock-text { font-family: var(--font-body); font-weight: 500; font-size: 11px; color: var(--ink-600); }
.team-buy-dialog { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-radius: var(--radius-md); background: var(--parchment-100); border: var(--inset-border); }
.team-buy-question { margin: 0; font-family: var(--font-body); font-weight: 600; font-size: 14px; }
.team-buy-short { margin: 0; font-family: var(--font-body); font-weight: 600; font-size: 13px; color: var(--ember-700); }
.team-buy-actions,
.team-actions { display: flex; gap: 12px; justify-content: center; }
.team-available-title { margin: 0; font-family: var(--font-heading); font-weight: 700; font-size: 16px; color: var(--ink-900); }
.team-available { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.team-hero { box-sizing: border-box; width: 200px; height: 80px; padding: 8px; display: flex; align-items: center; gap: 8px; border-radius: var(--radius-md); background: var(--parchment-100); border: var(--inset-border); font: inherit; color: var(--ink-900); text-align: left; cursor: pointer; }
.team-slot:disabled,
.team-hero:disabled { cursor: default; }
.team-hero-portrait { width: 64px; height: 64px; object-fit: contain; }
.team-hero-text { display: flex; flex-direction: column; gap: 2px; }
.team-hero-name { font-family: var(--font-body); font-weight: 700; font-size: 13px; }
.team-hero-stars { font-family: var(--font-body); font-weight: 600; font-size: 12px; }
.team-hero-passive { font-family: var(--font-body); font-weight: 500; font-size: 11px; color: var(--ink-600); }
.team-available-empty { margin: 0; font-family: var(--font-body); font-size: 13px; color: var(--ink-600); }
```

Test fixtures: heroes `{ id, name, stars, owned: true, leaderBonus: 'Bonus' }` for the five ids (Seraphine `owned: false` where a case says so); `position = { chapter: 5, completed: false }`.

**Steps**:

1. Write `teamModel` and `renderTeam`.
2. Append the CSS block.
3. Write the tests below.
4. Run the gate.

**Tests**: unit
**Test cases** (`teamView.test.js`, exact names):

- `the model of a team with Lyra in slot 1 and slot 2 buyable`: `team = { unlocked: true, openSlots: 2, boughtSlots: 1, slotPrices: [ 10000, 20000, 30000, 40000 ], allies: [ 'lyra', null, null, null ] }`, leader Kael → `slots[0]` `{ slot: 1, state: 'filled', dpsText: 'Dano: 2/s', passiveLine: 'Olho do Falcão: +10 de chance de crítico' }`, `slots[1].state` `buyable` with `priceGold` 2, `slots[2].state` `locked` with `chapter` 7; `teamDpsText` `Dano da equipe: 2/s`; `leader.bonusText` `Bonus (em breve)`.
- `Seraphine raises every shown damage by 1.25`: allies `[ 'lyra', 'seraphine', null, null ]`, `boughtSlots` 2 → `Dano: 2.5/s` twice, `Dano da equipe: 5/s`.
- `the shown damage of a 9 star Lyra with a 624 click weapon reads 12.5K`: pieces `[ { id: 'w', slot: 'WEAPON', clickDamage: 624, affixes: [], heroId: 'lyra' } ]`, Lyra 9 stars → `Dano: 12.5K/s`.
- `no ally reads Dano da equipe: 0/s`.
- `canPick is true with an empty bought slot and false when every bought slot is full and none is selected`.
- `canPick is true with a filled slot selected`.
- `canAct is true only with a filled slot selected and no request running`: selected 1 filled → true; selected empty → false; `busy` → false.
- `asking reads the price and whether the wallet pays it`: `asking: 1`, `walletCopper: 9999` → `{ slot: 1, priceGold: 1, affordable: false }`; 10000 → `affordable: true`.
- `the screen shows the leader card with its label, name, stars and bonus`: `team-slot-0` has `data-state` `leader`, `.team-slot-label` `Líder`, `.team-name` `Kael`, `.team-stars` `0★`, `.team-bonus` `Bonus (em breve)`, an `img.team-portrait` with `src` `assets/heroes/kael_sprite.png`.
- `the screen shows a filled ally card with its damage and passive`: `team-slot-1` `data-state` `filled`, label `Aliado 1`, `.team-dps-line` `Dano: 2/s`, `.team-passive` `Olho do Falcão: +10 de chance de crítico`.
- `an empty bought slot shows vazio`: `data-state` `empty`, `.team-empty` `vazio`.
- `a buyable slot shows the coin and the price and is enabled`: `.team-coin` present, `.team-price` `2`, `disabled` false.
- `a locked slot shows Chefe do capítulo 7 and is disabled`: `.team-lock-text` `Chefe do capítulo 7`, `disabled` true.
- `a waiting slot shows the coin and the price without a chapter and is disabled`: `openSlots: 3, boughtSlots: 0` → `team-slot-2` `data-state` `waiting`, no `.team-lock-text`, `disabled` true.
- `the selected slot carries data-selected true and the others false`.
- `the slot just bought carries data-flash true`.
- `a click on a slot calls onSlot with its number`.
- `the status line shows only while the team is inactive`: position chapter 4 → `team-status` text `A equipe luta a partir do capítulo 5.` and not `hidden`; chapter 5 → `hidden`.
- `the notice shows its text and hides without one`: `notice: 'Vaga de aliado comprada!'` → text and not `hidden`; null → `hidden`.
- `the dialog asks Comprar a vaga 1 por 1 ouro? with Comprar and Cancelar`: `asking` affordable → `team-buy-question` text, `team-buy-confirm` text `Comprar` enabled, `team-buy-cancel` `Cancelar`, no `.team-buy-short`; clicks call `onConfirmBuy` and `onCancelBuy`.
- `a dialog the wallet does not pay disables Comprar and shows Moedas insuficientes`.
- `there is no dialog without asking`: no `team-buy-dialog`.
- `Remover and Tornar líder are disabled unless a filled slot is selected and call their handlers`.
- `the available heroes list the owned heroes outside the team`: leader Kael, Lyra in slot 1, Seraphine not owned → `team-available-orina` and `team-available-vex` with `.team-hero-name`, `.team-hero-stars` `0★`, `.team-hero-passive` `Erosão Arcana` and `Lâminas Sombrias`; a click calls `onPick('orina')`.
- `an empty available list says Todos os heróis estão na equipe.`.
- `a running request disables every slot, entry and action`: `busy: true` → every `button` in `team-screen` is `disabled`.
- `the blocks come in the order of the spec`: the children of `team-screen` have the classes `team-status`, `team-notice`, `team-dps`, `team-slots`, `team-actions`, `team-available-title`, `team-available` in that order (and `team-buy-dialog` right after `team-slots` while asking).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 27 cases pass and the whole Vitest suite passes; the CSS block is at the end of `style.css`.

**Commit**: `feat(game): render the Equipe screen`

---

### T18: Open the Equipe screen from the HUD [x]

**Owner**: game-dev
**Goal**: The HUD gains the `Equipe` button while the team is unlocked; it opens the Equipe screen with the stored team; the attribute panel counts the passives (TEAM-09, TEAM-11 AC 9).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `game/src/adapters/phaser/HeroUi.js:18-140` (rail, icons, `SCREENS`, `HUD_HTML`, constructor), `:155-235` (`show`), `:236-255` (`close`), `:474-480` (`leaderStatsFor`, at 475), `:944-957` (`showNotice`), `game/src/adapters/phaser/HeroUi.test.js:1-90` (`createUi`, `query`), spec § Equipe Screen Layout (HUD button), design § Game `HeroUi`
**Depends on**: T17
**Requirement**: TEAM-09, TEAM-11

**Contract**:

```js
// icon, in ICONS (Lucide `swords`)
team: icon('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"></path><path d="m5 14 4 4"></path><path d="m7 17-3 3"></path><path d="m3 19 2 2"></path>'),

// SCREENS: { id: 'team', label: 'Equipe', title: 'Equipe' } right after the `leader` entry
// HUD_HTML builds the buttons of every screen except `team`:
const RAIL = SCREENS.filter(({ id }) => id !== 'team');
const buttonHtml = ({ id, label }) => `<button type="button" data-testid="hud-${id}">${ICONS[id]}${label}${BADGED.includes(id) ? badgeHtml(id) : ''}</button>`;
const HUD_HTML = `<div class="hero-hud">${RAIL.map(buttonHtml).join('')}</div>`;

// constructor: keep the rail element so it can be measured again
//   this.hudElement = scene.add.dom(HUD.x, HUD.y).createFromHTML(HUD_HTML);   (in place of createDom(HUD, HUD_HTML); same node)
//   const hud = this.hudElement.node;
//   RAIL.forEach(({ id }) => hud.querySelector(`[data-testid="hud-${id}"]`).addEventListener('click', () => this.show(id)));
//   this.teamButton = <a button built from buttonHtml(SCREENS team entry)>; its click calls this.show('team')
//   state: this.teamSelected = null; this.teamBusy = false; this.teamAsking = null; this.teamNotice = null; this.teamFlash = null;
//   heroes.onChange(() => { this.updateSkillBar(); this.refreshTeamButton(); }); this.refreshTeamButton();

//  The Equipe button is in the rail right after Líder while the team is unlocked, and absent otherwise (the rail keeps six buttons)
refreshTeamButton ()
{
    const unlocked = this.heroes.team().unlocked;
    const inRail = this.teamButton.isConnected;

    if (unlocked && !inRail)
    {
        this.hudElement.node.querySelector('[data-testid="hud-leader"]').after(this.teamButton);
        this.hudElement.updateSize?.();
    }
    else if (!unlocked && inRail)
    {
        this.teamButton.remove();
        this.hudElement.updateSize?.();
    }
}

// show(): resets teamSelected, teamBusy, teamAsking, teamNotice and teamFlash (null / false) with the other resets;
//   the load branch `screen === 'equipment'` becomes `screen === 'equipment' || screen === 'team'` (heroes and equipment);
//   the catch keeps renderEquipmentUnavailable for 'equipment' only, so a failed Equipe load shows `Não foi possível carregar.`

//  The Equipe screen of the stored team
render_team ()
{
    this.body.replaceChildren(renderTeam(teamModel({
        team: this.heroes.team(),
        heroes: this.heroes.heroes(),
        leaderId: this.heroes.leaderId(),
        pieces: this.equipment.pieces(),
        position: this.hooks.mapPosition?.() ?? DEFAULT_POSITION,
        selected: this.teamSelected,
        busy: this.teamBusy,
        asking: this.teamAsking,
        notice: this.teamNotice,
        flashSlot: this.teamFlash,
        walletCopper: this.hooks.walletCopper()
    }), {
        onSlot: (slot) => this.selectTeamSlot(slot),
        onPick: (heroId) => this.pickTeamHero(heroId),
        onRemove: () => this.removeTeamHero(),
        onMakeLeader: () => this.makeTeamLeader(),
        onConfirmBuy: () => this.confirmTeamSlot(),
        onCancelBuy: () => this.cancelTeamSlot()
    }));
}

// stubs for T19 and T20 (empty bodies now): selectTeamSlot (slot), pickTeamHero (heroId), removeTeamHero (), makeTeamLeader (),
//   confirmTeamSlot (), cancelTeamSlot ()

// leaderStatsFor(): passes `passives: activePassives({ team: this.heroes.team(), heroes: this.heroes.heroes(), leaderId: this.heroes.leaderId(),
//   position: this.hooks.mapPosition?.() ?? DEFAULT_POSITION })` to leaderStats
```

Update the class comment: seven HUD buttons at most, the Equipe screen. `createUi` of `HeroUi.test.js` gains an option `position = null` that passes `mapPosition: () => position` when it is not null, and `heroesGateway` gains `setTeam` and `buySlot` mocks.

**Steps**:

1. Make the rail, button, state, `refreshTeamButton`, `show` and `render_team` changes and the empty stubs.
2. Change `leaderStatsFor`.
3. Add the cases below (`describe('Equipe')`); the catalog payload gains `team` per case.
4. Run the gate.

**Tests**: unit
**Test cases** (`HeroUi.test.js`, exact names):

- `the rail has six buttons and no Equipe button while the team is locked`: a payload without `team` → after `await ui.heroes.load()` the rail has 6 buttons and no `hud-team`.
- `the Equipe button appears right after Líder once the team is unlocked`: `team.unlocked` true → the rail ids are `hud-heroes`, `hud-bag`, `hud-leader`, `hud-team`, `hud-equipment`, `hud-talents`, `hud-farm`; its text is `Equipe` and it holds an `svg` with 8 `path` elements.
- `the Equipe button leaves the rail when a load answers a locked team`: unlocked first, then a payload without `team` → no `hud-team`.
- `the Equipe button opens the Equipe panel`: click `hud-team` → title `Equipe`, `team-screen` present, `team-slot-0` to `team-slot-4` present.
- `opening Equipe reads the heroes and the equipment again`: the heroes and equipment `list` mocks each called once more by the click.
- `a failed Equipe load shows Não foi possível carregar.`: heroes `list` rejects on the second call → error line `Não foi possível carregar.`.
- `the Equipe screen says the team fights from chapter 5 below chapter 5`: `position: { chapter: 3, completed: false }` → `team-status` visible with its text.
- `the attribute panel counts Lyra's passive`: team unlocked, Lyra in slot 1 (`boughtSlots` 1), `position: { chapter: 5, completed: false }`; open Equipamento → `stat-critChance` text `Chance de crítico: 20%`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 8 cases pass, every existing `HeroUi` case passes (the rail stays six buttons for them), and the whole Vitest suite passes.

**Commit**: `feat(game): open the Equipe screen from the HUD`

---

### T19: Edit the team in the Equipe screen [x]

**Owner**: game-dev
**Goal**: The player selects slots, places, replaces and removes allies and makes an ally the leader, with every control disabled while a request runs and the failure text and reload of the spec (TEAM-13).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `game/src/adapters/phaser/HeroUi.js` `pickLeader` (`:452-472`, the `view` check after an `await`), the stubs and `render_team` of T18, spec P1 Equipe screen AC 10 to 17, 20, 23, design § Error Handling Strategy
**Depends on**: T18
**Requirement**: TEAM-13

**Contract**:

```js
const TEAM_FAILED = 'Não foi possível salvar a equipe.';

//  A click on an ally card: a filled or empty bought slot becomes the selected one; any other card does nothing (its button is disabled)
selectTeamSlot (slot)
{
    const state = slotStates(this.heroes.team())[slot - 1].state;

    if (state === 'filled' || state === 'empty')
    {
        this.teamSelected = slot;
        this.render_team();
    }
    else if (state === 'buyable')
    {
        this.askTeamSlot(slot);   // T20
    }
}

//  The hero goes to the selected bought slot, else to the first empty bought slot; nothing happens without such a slot
async pickTeamHero (heroId)
{
    // target = this.teamSelected when its state is filled or empty, else the first slot whose state is empty; none: return
    // allies = [ ...this.heroes.team().allies ]; allies[target - 1] = heroId; await this.saveTeam(allies, target)
}

//  The selected filled slot is emptied and stays selected
async removeTeamHero ()
{
    // allies = [ ...team.allies ]; allies[this.teamSelected - 1] = null; await this.saveTeam(allies, this.teamSelected)
}

//  The hero of the selected slot becomes the leader; the backend puts the old leader in that slot
async makeTeamLeader ()
{
    // heroId = team.allies[this.teamSelected - 1]; await this.runTeam(() => this.heroes.setLeader(heroId), null)
}

//  PUT /team with `allies`; `selected` is the slot selected after the answer
saveTeam (allies, selected)
{
    return this.runTeam(() => this.heroes.setTeam(allies), selected);
}

//  One team request: the body is disabled while it runs; an answer for a screen left in the meantime renders nothing (L-096)
async runTeam (request, selected, failure = TEAM_FAILED)
{
    const view = this.view;

    this.teamBusy = true;
    this.setError('');
    this.render_team();

    try
    {
        await request();

        if (view === this.view)
        {
            this.teamSelected = selected;
        }
    }
    catch
    {
        if (view === this.view)
        {
            this.setError(failure);
        }

        await this.heroes.load().catch(() => {});
    }
    finally
    {
        if (view === this.view)
        {
            this.teamBusy = false;
            this.render_team();
        }
    }
}
```

`render_team` is called only while the Equipe screen is the open view; `setError` shows the text in the panel error line (`.hero-error`).

**Steps**:

1. Write the methods above in place of the T18 stubs (keep `confirmTeamSlot` and `cancelTeamSlot` as stubs; `askTeamSlot` is a stub too).
2. Add the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`HeroUi.test.js`, `describe('Equipe editing')`, exact names; the team is unlocked, `position` chapter 5, Kael leads, every hero owned):

- `a click on a filled ally card selects it`: Lyra in slot 1 → `team-slot-1` `data-selected` `true`, `team-remove` and `team-make-leader` enabled.
- `a click on an empty bought card selects it and keeps the actions disabled`.
- `a click on another card moves the selection`: slot 1 then slot 2 → only `team-slot-2` selected.
- `a click on an available hero fills the selected slot and sends PUT /team`: `boughtSlots` 2, allies `[ null, null, null, null ]`, select slot 2, click `team-available-orina` → `setTeam` called with `[ null, 'orina', null, null ]`; after the answer `team-slot-2` shows Orina and stays selected.
- `a click on an available hero replaces the hero of the selected filled slot`: Lyra in slot 1 selected, click `team-available-orina` → `setTeam([ 'orina', null, null, null ])`.
- `with no selection an available hero goes to the first empty bought slot`: `boughtSlots` 2, Lyra in slot 1 → click `team-available-orina` → `setTeam([ 'lyra', 'orina', null, null ])`.
- `with every bought slot full and none selected the available heroes are disabled`: `boughtSlots` 1, Lyra in slot 1 → `team-available-orina` disabled; a click sends nothing.
- `Remover empties the selected slot and keeps it selected`: Lyra in slot 1 selected → `setTeam([ null, null, null, null ])`; then `team-slot-1` `data-state` `empty` and `data-selected` `true`.
- `Tornar líder sends PUT /leader and shows the swapped team`: Lyra in slot 1 selected, `setLeader` resolves `{ leaderId: 'lyra', team: {...allies: [ 'kael', null, null, null ] } }` → `team-slot-0` `.team-name` Lyra, `team-slot-1` `.team-name` Kael, no card selected.
- `while a save runs every card, entry and action is disabled and Fechar is enabled`: `setTeam` held by a pending promise → every `button` in `team-screen` is `disabled`; `hero-close` is enabled.
- `a failed save shows Não foi possível salvar a equipe. and reloads the heroes`: `setTeam` rejects → error line text `Não foi possível salvar a equipe.`; heroes `list` called once more; the controls are enabled again.
- `a failed leader change shows Não foi possível salvar a equipe.`: `setLeader` rejects → the same text.
- `closing Equipe during a save keeps the answer and reopens with the stored team and every control enabled`: `setTeam` pending; `ui.close()`; resolve it with `{ leaderId: 'kael', team: {...allies: [ 'orina', null, null, null ] } }` and make the heroes `list` mock answer that team from then on (as the backend would); `await ui.show('team')` → `team-slot-1` shows Orina; no `button` of `team-screen` is disabled by the busy flag.
- `opening another screen during a save renders nothing for the answer`: `setTeam` pending; `await ui.show('heroes')`; resolve → the body is still the hero catalog.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 14 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): edit the team in the Equipe screen`

---

### T20: Buy an ally slot in the Equipe screen [x]

**Owner**: game-dev
**Goal**: A click on the buyable slot asks to confirm; `Comprar` buys it once, flashes the slot, shows the notice and the new wallet and selects the new slot; `Cancelar` sends nothing; a failure says so and reloads (TEAM-10).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: the T19 methods (`runTeam`), `HeroUi.js` `showNotice` (`:944-957`, `scene.time.delayedCall`), `game/src/adapters/phaser/HeroUi.test.js:53-72` (the fake `delayedCall` and `timers`), spec P1 Slot purchase dialog AC 1 to 6
**Depends on**: T19
**Requirement**: TEAM-10

**Contract**:

```js
const SLOT_FAILED = 'Não foi possível comprar a vaga.';
const SLOT_BOUGHT = 'Vaga de aliado comprada!';
const FLASH_MS = 400;

//  The purchase dialog of a buyable slot shows under the slot row; nothing is sent yet
askTeamSlot (slot)
{
    this.teamAsking = slot;
    this.render_team();
}

cancelTeamSlot ()
{
    this.teamAsking = null;
    this.render_team();
}

//  POST /team/slots from the bought count the screen shows; on success the new slot flashes 400 ms, the notice shows 3 s and the slot
//  is selected; the wallet reaches the HUD through heroes.onWallet (ClickerGame)
async confirmTeamSlot ()
{
    const slot = this.teamAsking;
    const fromSlots = this.heroes.team().boughtSlots;
    const view = this.view;

    // runTeam-like flow with failure SLOT_FAILED: teamBusy true and render; await this.heroes.buySlot(fromSlots);
    // on success (same view): teamAsking = null, teamSelected = slot, teamFlash = slot, teamNotice = SLOT_BOUGHT,
    //   scene.time.delayedCall(FLASH_MS, () => { if the view is the same and teamFlash === slot: teamFlash = null; render })
    //   scene.time.delayedCall(NOTICE_MS, () => { if the view is the same and teamNotice === SLOT_BOUGHT: teamNotice = null; render })
    // on failure (same view): teamAsking = null, setError(SLOT_FAILED), await heroes.load().catch(() => {})
    // finally (same view): teamBusy = false, render
}
```

`fromSlots` is the bought count the screen showed when `Comprar` was pressed (a stale screen answers 409 `TEAM_SLOT_MISMATCH`, which is a failure here).

**Steps**:

1. Replace the stubs `askTeamSlot`, `cancelTeamSlot` and `confirmTeamSlot`.
2. Add the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`HeroUi.test.js`, `describe('Equipe purchase')`, exact names; team unlocked with `openSlots` 1, `boughtSlots` 0, `wallet` 10 000 copper):

- `a click on the buyable slot asks Comprar a vaga 1 por 1 ouro? and sends nothing`: click `team-slot-1` → `team-buy-question` text `Comprar a vaga 1 por 1 ouro?`; `buySlot` not called.
- `Cancelar closes the dialog and sends nothing`.
- `with 9999 copper Comprar is disabled next to Moedas insuficientes`.
- `Comprar sends fromSlots 0 and disables Comprar and Cancelar until the answer`: `buySlot` pending → called with 0; both buttons disabled.
- `a purchase closes the dialog, flashes the slot, shows the notice and selects the new empty slot`: `buySlot` resolves `{ team: {...openSlots: 1, boughtSlots: 1 }, wallet: { gold: 0, silver: 0, copper: 0 } }` → no `team-buy-dialog`; `team-slot-1` `data-state` `empty`, `data-selected` `true`, `data-flash` `true`; `team-notice` text `Vaga de aliado comprada!` and visible.
- `the flash ends after 400 ms and the notice after 3000 ms`: run the `delayedCall` of 400 → no `data-flash`; run the one of 3000 → `team-notice` hidden.
- `a purchase of slot 2 sends fromSlots 1`: `openSlots` 2, `boughtSlots` 1 → `buySlot` called with 1.
- `a failed purchase closes the dialog, shows Não foi possível comprar a vaga. and reloads the heroes`: `buySlot` rejects → no dialog, error line text, heroes `list` called once more, controls enabled.
- `closing Equipe during a purchase keeps the bought slot and shows no notice on reopening`: `buySlot` pending, `ui.close()`, resolve it and make the heroes `list` mock answer `boughtSlots` 1 from then on, `await ui.show('team')` → `team-slot-1` `data-state` `empty`; `team-notice` hidden; no dialog.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 9 cases pass and the whole Vitest suite passes.

**Commit**: `feat(game): buy ally slots in the Equipe screen`

---

### T21: Serve the team from the e2e fake backend [x]

**Owner**: test-engineer
**Goal**: The fake backend answers the team payload in `GET /heroes` and `PUT /leader`, serves `PUT /team` and `POST /team/slots` with the spec checks in order, and can hold or fail team requests, so the e2e tasks can drive every visible criterion (TEAM-01 to TEAM-04 as seen by the game).
**Where**: `game/e2e/support/fakeBackend.js`
**Also changes**: none
**Read first**: `game/e2e/support/fakeBackend.js:1-30` (`problem`, `coins`), `:81-150` (`HEROES`, `newCards`, `heroView`), `:236-275` (options, `walletOf`, `cardsOf`), `:585-640` (`handleHeroes`), `:850-860` and `:1003-1016` (`outcomeHold`, `holdOutcome`), `:918-967` (dispatch and routes), spec Contract and Errors rows, design § Data Models
**Depends on**: T20
**Requirement**: TEAM-01, TEAM-02, TEAM-03, TEAM-04

**Contract**:

```js
// constants next to FUSION_SIZE
const SLOT_PRICES = [ 10000, 20000, 30000, 40000 ];
const SLOT_CHAPTERS = [ 5, 6, 7, 8 ];

// mockBackend option: team: startingTeam = {}   e.g. { yan: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] } }
const teamByUser = new Map();
const teamOf = (username) => {
    if (!teamByUser.has(username)) {
        const given = startingTeam[username] ?? {};

        teamByUser.set(username, { boughtSlots: given.boughtSlots ?? 0, allies: [ ...(given.allies ?? [ null, null, null, null ]) ] });
    }

    return teamByUser.get(username);
};
//  The team payload of spec hero-team (TeamResponse)
const teamView = (cards, team) => ({
    unlocked: cards.cleared.has(5),
    openSlots: SLOT_CHAPTERS.filter((chapter) => cards.cleared.has(chapter)).length,
    boughtSlots: team.boughtSlots,
    slotPrices: [ ...SLOT_PRICES ],
    allies: [ ...team.allies ]
});
//  PUT /team, POST /team/slots and PUT /leader wait on this promise while holdTeam() holds them
let teamHold = null;
//  The next team request answers this problem instead ({ status, code }), set by failNextTeamRequest
let teamFailure = null;
```

- `GET /heroes` answers `{ leaderId, heroes, team: teamView(cards, teamOf(username)) }`.
- `PUT /leader`: after the existing checks, `const old = cards.leader`; if `hero.id` is in `team.allies` and differs from `old`, that entry becomes `old`; `cards.leader = hero.id`; answers `{ leaderId: hero.id, team: teamView(...) }`. It awaits `teamHold` and consumes `teamFailure` first, like the two routes below.
- New `handleTeam(route, method, path, body, now)` dispatched for `path === '/team' || path.startsWith('/team/')`, routes `**/api/team` and `**/api/team/**`:
  - every request: authenticated (else 401); `await teamHold` when set; when `teamFailure` is set, answer `problem(teamFailure.status, 'Failed', teamFailure.code)`, clear it and stop.
  - `PUT /team`, checks in this order: `body.allies` not an array of exactly 4 entries each a string or `null`, a string twice, or `cards.leader` among them → 400 `INVALID_TEAM`; an id outside `HEROES` → 404 `HERO_NOT_FOUND`; `!cards.cleared.has(5)` → 409 `TEAM_LOCKED`; a string at an index `>= boughtSlots` → 409 `TEAM_SLOT_NOT_BOUGHT`; an id not owned (`heroView(cards, hero).owned` false) → 409 `HERO_NOT_OWNED`; else store the 4 entries and answer `{ leaderId: cards.leader, team: teamView(...) }`.
  - `POST /team/slots`, checks in this order: `body.fromSlots` not an integer of at least 0 → 400 `INVALID_TEAM_SLOT_REQUEST`; `fromSlots !== boughtSlots` → 409 `TEAM_SLOT_MISMATCH` whose `json` also holds `team: teamView(...)`; `boughtSlots === 4` → 409 `TEAM_SLOTS_MAX`; `boughtSlots >= openSlots` → 409 `TEAM_SLOT_LOCKED`; `walletOf(username).copper < SLOT_PRICES[fromSlots]` → 409 `NOT_ENOUGH_COPPER`; else take the price from `walletOf(username).copper`, raise `boughtSlots` by 1 and answer `{ team: teamView(...), wallet: coins(walletOf(username).copper) }`.
- The returned handle gains `teamOf`, `holdTeam()` (returns `release()`, same shape as `holdOutcome`) and `failNextTeamRequest({ status = 500, code } = {})`.
- The comment block above `mockBackend` documents the `team` option, `holdTeam` and `failNextTeamRequest`.

**Steps**:

1. Add the constants, state, `teamView`, the changes to `GET /heroes` and `PUT /leader`, `handleTeam`, its dispatch line and its two routes.
2. Add `teamOf`, `holdTeam` and `failNextTeamRequest` to the returned handle.
3. Run the whole Playwright suite: no existing scenario may change (a player without `cards.cleared` 5 has a locked team).

**Tests**: e2e
**Test cases**: no new scenario here (T22 to T26 exercise every route); the whole existing suite must pass unchanged.

**Gate**: full - `cd game && npm test && npx playwright test`
**Done when**:

- [x] `GET /heroes` of a new player answers the locked team; the whole Playwright suite passes with the counts of `main` before the task (failures on the load-flake list of `STATE.md` rerun alone twice with `--workers=1`).

**Commit**: `test(game): serve the hero team from the e2e fake backend`

---

### T22: Cover the Equipe screen and the slot purchase in the browser [x]

**Owner**: test-engineer
**Goal**: A new e2e file proves every visible criterion of the Equipe screen layout, the HUD button and the purchase dialog on the real game against the fake backend (TEAM-09, TEAM-10).
**Where**: `game/e2e/heroTeam.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/unifiedDamage.spec.js:1-70` (imports, `startAs`, `scene`, `advance`), `game/e2e/equipment.spec.js:30-50` (the rail count and box), `game/e2e/uiRedesign.spec.js:940-975` (rail box in scene px and the rail ids), `game/e2e/support/fakeBackend.js` (T21 options), spec § Equipe Screen Layout, § Player-Facing Texts, P1 Equipe screen AC 1 to 9, 18, 19, 21, 22 and P1 Slot purchase dialog AC 1 to 6
**Depends on**: T21
**Requirement**: TEAM-09, TEAM-10

**Contract**:

- `startTeam(page, { chapter = 5, stage = 1, encounter = 'PHASE', cleared = [ 5 ], copper = 0, team, leader = 'kael', stars = {}, equipment, talents, definition, lastChapter, roll } = {})`: `mockBackend` with `users: { yan: 'secret123' }`; `cards: { yan: { leader, cleared, copies } }` where `copies` holds one blank card (`'<id>:0': 1`) of each of the five heroes plus `'<id>:<stars[id]>': 1` for every hero in `stars`; `progress: { yan: { chapter, stage, encounter, phase: 1 } }`; `wallets: { yan: copper }`; `team: team ? { yan: team } : {}`; `equipment`, `talents`, `definition` and `lastChapter` passed through when given; then the login and canvas click of `unifiedDamage.spec.js` `startAs` (with `roll` passed to `openMainMenu` as `random`); returns the `mockBackend` handle.
- `openTeam(page)`: click `hud-team`, wait for `team-screen`.
- `sceneBox(page, locator)`: the box of a DOM element in scene px: `(box.x - canvas.x) / scale`, `(box.y - canvas.y) / scale`, `box.width / scale`, `box.height / scale` with `scale = canvas.width / 1024` and `canvas` the box of `#game-container canvas`.
- Colors are read with `toHaveCSS` in `rgb(...)` form: `#e8b64c` is `rgb(232, 182, 76)`, `--gold-400` `#e0b45a` is `rgb(224, 180, 90)`, `--ember-500` `#e8742a` is `rgb(232, 116, 42)`, `--gold-200` `#f3d58a` is `rgb(243, 213, 138)`.

**Steps**:

1. Create the file with the helpers and `test.describe('Hero team: Equipe screen', ...)`.
2. Write the scenarios below with exactly these names.
3. Run the gate.

**Tests**: e2e
**Test cases**:

- `the Equipe button is absent before the chapter 5 boss is won and the rail keeps six buttons`: `cleared: [ 1, 2, 3, 4 ]` → `hud-team` count 0; `.hero-hud button` count 6 (Equipe AC 1, Success Criterion 1).
- `the Equipe button sits right after Líder once the chapter 5 boss is won and the rail stays above the battle bar`: `cleared: [ 5 ]` → the rail ids `hud-heroes`, `hud-bag`, `hud-leader`, `hud-team`, `hud-equipment`, `hud-talents`, `hud-farm`; `hud-team` text `Equipe`, its `svg` 22 x 22 with `stroke-width` `2.75`; `sceneBox` of `.hero-hud` ends above y 624 (AC 1, AC 2).
- `Equipe shows the leader card and four slot cards of 132 x 210 px, 16 px apart`: open Equipe → panel title `Equipe`; `team-slot-0` to `team-slot-4` each 132 x 210 in scene px (tolerance 1); the gap between two neighbours 16 (tolerance 1); labels `Líder`, `Aliado 1` to `Aliado 4`; `team-slot-0` border `3px solid rgb(232, 182, 76)` (AC 3).
- `the leader card shows the leader's sprite, name, stars and bonus`: `team-slot-0` holds `img.team-portrait` 80 x 80 with `src` ending `kael_sprite.png`, `.team-name` `Kael Raizférrea`, `.team-stars` `0★`, `.team-bonus` `+25% de dano contra chefes. (em breve)` (AC 4).
- `slot 1 is buyable with a coin and 1, and slots 2 to 4 wait behind the chapter 6 to 8 bosses`: `copper: 10000` → `team-slot-1` `data-state` `buyable`, transparent background, border color `rgb(224, 180, 90)`, `.team-coin` 32 x 32, `.team-price` `1`; `team-slot-2` to `team-slot-4` `data-state` `locked`, opacity `0.5`, disabled, `.team-lock-text` `Chefe do capítulo 6`, `7`, `8` (AC 6, AC 7; Independent Test).
- `a slot open behind an unbought one waits at half opacity with no chapter text`: `cleared: [ 5, 6, 7 ]` → `team-slot-2` and `team-slot-3` `data-state` `waiting`, opacity `0.5`, disabled, no `.team-lock-text`; `team-slot-4` `locked` (AC 8).
- `clicking the buyable slot asks Comprar a vaga 1 por 1 ouro? and Cancelar sends nothing`: `copper: 10000`, click `team-slot-1` → `team-buy-question` `Comprar a vaga 1 por 1 ouro?`; click `team-buy-cancel` → no `team-buy-dialog`; `handle.calls` holds no `POST /team/slots` (Purchase AC 1, AC 5).
- `with less than 1 ouro Comprar is disabled next to Moedas insuficientes`: `copper: 5000` → `team-buy-confirm` disabled, `team-buy-short` `Moedas insuficientes` (Purchase AC 2).
- `Comprar buys slot 1: the slot flashes, the notice shows for 3 s, the wallet reads 0 and the new slot is empty and selected`: `copper: 10000`; click `team-slot-1`, then `team-buy-confirm` → the request body `{ fromSlots: 0 }`; `team-slot-1` `data-flash` `true` with background `rgb(243, 213, 138)`, then no `data-flash` within 1 s; `team-notice` `Vaga de aliado comprada!` visible, then hidden within 4 s; the HUD wallet shows 0 gold, 0 silver, 0 copper; `team-slot-1` `data-state` `empty`, `data-selected` `true`, `.team-empty` `vazio`, border style `dashed` (Purchase AC 3, AC 4; Equipe AC 5; L-075).
- `Comprar is disabled while the purchase runs`: `holdTeam()`; press `team-buy-confirm` → `team-buy-confirm` and `team-buy-cancel` disabled; release → dialog gone (Purchase AC 3).
- `a refused purchase shows Não foi possível comprar a vaga. and the stored slots`: `failNextTeamRequest({ status: 409, code: 'TEAM_SLOT_MISMATCH' })`; buy → `.hero-error` `Não foi possível comprar a vaga.`, the panel open, `team-slot-1` `buyable` again (Purchase AC 6).
- `Heróis disponíveis lists the owned heroes outside the team, or says all are in it`: after buying slot 1 → `team-available-lyra` (sprite 64 x 64, `Lyra Folhaveloz`, `0★`, `Olho do Falcão`), `team-available-orina`, `team-available-seraphine`, `team-available-vex`, no `team-available-kael`; a second player state with `team: { boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] }` and `cleared: [ 5, 6, 7, 8 ]` → `Todos os heróis estão na equipe.` (AC 9).
- `Dano da equipe reads 0/s with no ally`: → `team-dps` `Dano da equipe: 0/s` (AC 18).
- `below chapter 5 the panel says A equipe luta a partir do capítulo 5.`: `chapter: 3`, `cleared: [ 5 ]` → `team-status` visible with that text; at chapter 5 it is hidden (AC 19).
- `winning the chapter 5 boss shows the Equipe button without a reload`: `chapter: 5`, `cleared: []`, `lastChapter: 6`, progress at the chapter boss with 1 health (a `definition` with `bossHealth: 1`), click the monster → `hud-team` becomes visible with no page reload (AC 21).
- `a 12.5K shown damage reads Dano: 12.5K/s`: `stars: { lyra: 9 }`, equipment a weapon of `clickDamage` 624 worn by Lyra, `team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }` → `team-slot-1` `.team-dps-line` `Dano: 12.5K/s`; `team-dps` `Dano da equipe: 12.5K/s` (AC 22).

**Gate**: full - `cd game && npx playwright test e2e/heroTeam.spec.js` then `cd game && npm test && npx playwright test`
**Done when**:

- [x] The 16 scenarios pass; the whole Playwright suite passes (failures on the load-flake list of `STATE.md` rerun alone twice with `--workers=1` and are reported).

**Commit**: `test(game): cover the Equipe screen and the slot purchase`

---

### T23: Cover the team editing in the browser [x]

**Owner**: test-engineer
**Goal**: e2e scenarios prove placing, replacing, removing, the leader swap, the busy state, the failure and a close during a request (TEAM-13, TEAM-09 AC 4, 18).
**Where**: `game/e2e/heroTeamEditing.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/heroTeam.spec.js` (T22 helpers: copy `startTeam`, `openTeam`), spec P1 Equipe screen AC 4, 10 to 18, 20, 23
**Depends on**: T22
**Requirement**: TEAM-13, TEAM-09

**Contract**: the helpers of T22 (copied, not imported, as the other spec files do). Outline color `--ember-500` is `rgb(232, 116, 42)`.

**Steps**:

1. Create the file with the helpers and `test.describe('Hero team: editing', ...)`.
2. Write the scenarios below with exactly these names.
3. Run the gate.

**Tests**: e2e
**Test cases**:

- `clicking an available hero fills the selected empty slot and shows its damage and passive`: `team: { boughtSlots: 1, allies: [ null, null, null, null ] }`; click `team-slot-1`, then `team-available-lyra` → the `PUT /team` body `{ allies: [ 'lyra', null, null, null ] }`; `team-slot-1` `data-state` `filled`, `.team-name` `Lyra Folhaveloz`, `.team-stars` `0★`, `.team-dps-line` `Dano: 2/s`, `.team-passive` `Olho do Falcão: +10 de chance de crítico` (AC 4, AC 10; Independent Test).
- `with no slot selected an available hero goes to the first empty bought slot`: `cleared: [ 5, 6 ]`, `team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] }`; click `team-available-orina` → body `[ 'lyra', 'orina', null, null ]` (AC 11).
- `an available hero replaces the hero of the selected slot`: Lyra in slot 1; click `team-slot-1`, then `team-available-vex` → body `[ 'vex', null, null, null ]`; Lyra listed again under `Heróis disponíveis` (AC 10).
- `with every bought slot full and none selected the available heroes are disabled`: `team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }` → every `team-available-*` disabled (AC 12).
- `selecting a filled card outlines it and enables Remover and Tornar líder`: click `team-slot-1` → `data-selected` `true`, outline `3px solid rgb(232, 116, 42)`; `team-remove` and `team-make-leader` enabled; before the click both disabled (AC 13, AC 14).
- `Remover empties the slot and keeps it selected`: → body `[ null, null, null, null ]`; `team-slot-1` `empty`, `data-selected` `true` (AC 15).
- `Tornar líder swaps the leader with the ally`: Lyra in slot 1, leader Kael; select slot 1, click `team-make-leader` → the `PUT /leader` body `{ heroId: 'lyra' }`; `team-slot-0` `.team-name` `Lyra Folhaveloz`; `team-slot-1` `.team-name` `Kael Raizférrea`; no card selected; the skill bar leader card shows Lyra (AC 16).
- `while a team request runs every card, entry and action is disabled and Fechar stays enabled`: `holdTeam()`; Lyra in slot 1, `boughtSlots` 2; click `team-available-orina` → every `button` inside `team-screen` disabled; `hero-close` enabled; release → enabled again (AC 17).
- `Dano da equipe sums the allies: Lyra and Seraphine read 2.5/s each and 5/s together`: `cleared: [ 5, 6 ]`, `team: { boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] }` → both `.team-dps-line` `Dano: 2.5/s`; `team-dps` `Dano da equipe: 5/s` (AC 18).
- `a failed team save shows Não foi possível salvar a equipe. and the stored team`: `failNextTeamRequest({ status: 500 })`; click `team-available-lyra` into the empty bought slot → `.hero-error` `Não foi possível salvar a equipe.`; `team-slot-1` `empty` (AC 20).
- `a failed leader change shows Não foi possível salvar a equipe.`: `failNextTeamRequest({ status: 500 })`; Tornar líder → the same text; `team-slot-0` still Kael (AC 20).
- `closing Equipe during a save keeps the answer and reopens with the stored team and every control enabled`: `holdTeam()`; click `team-available-lyra` into the empty slot; click `hero-close`; release; reopen Equipe → `team-slot-1` shows Lyra; `team-available-orina` enabled (AC 23, L-096).

**Gate**: full - `cd game && npx playwright test e2e/heroTeamEditing.spec.js` then `cd game && npm test && npx playwright test`
**Done when**:

- [x] The 12 scenarios pass; the whole Playwright suite passes.

**Commit**: `test(game): cover the team editing`

---

### T24: Cover the ally hits in the browser [x]

**Owner**: test-engineer
**Goal**: e2e scenarios prove the ally rhythm, the one damage, the effects, the kill, the gates and the light-blue number on the real scene (TEAM-05, TEAM-06, TEAM-07, TEAM-08).
**Where**: `game/e2e/heroTeamCombat.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/unifiedDamage.spec.js:1-90` (`scene`, `health`, `advance`, `use`, `enemy`, `chapter` helpers; time moves with `scene.update()`), `game/e2e/accountReset.spec.js` (a reset in the browser), `game/e2e/heroTeam.spec.js` (`startTeam`), spec P1 Ally hits use the one damage AC 1 to 10, P1 Allies fight AC 1 to 15, Edge Cases
**Depends on**: T23
**Requirement**: TEAM-05, TEAM-06, TEAM-07, TEAM-08

**Contract**:

- `startTeam` of T22 plus `definition: chapter(monster)` (the `chapter` helper of `unifiedDamage.spec.js` with 1000 health) and a `health` option for scenarios that need 10 health.
- Time moves only with `advance(page, ms)` (`scene.update(0, ms)` in one `page.evaluate`); the scenarios do not wait on the clock.
- The ally number is read from the scene: `scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "#7fd4ff").map((o) => ({ text: o.text, x: o.x, size: o.style.fontSize }))')`.
- A skill is used inside the same `page.evaluate` as the advance when its effect lasts 2 s (Prisão), as `useThenStrike` of `unifiedDamage.spec.js` does.

**Steps**:

1. Create the file with the helpers and `test.describe('Hero team: ally hits', ...)`.
2. Write the scenarios below with exactly these names.
3. Run the gate.

**Tests**: e2e
**Test cases**:

- `Lyra in slot 1 hits a FIRE monster of 10 health for 2 after 1 s with no click, in light blue at x 740`: leader Kael, monster FIRE defense 0, 10 health, `team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }` → `advance(999)` health 10; `advance(1)` health 8, `monster-hp` `HP 8/10`; one ally text `2` at x 740, size `28px` (Allies fight AC 1, 3, 10, 12; Independent Test).
- `after a reset to chapter 1 a monster takes no damage from allies for 3 s`: at chapter 6 with `cleared: [ 5 ]`, reset the account from the pause menu as `accountReset.spec.js` does → `advance(3000)` leaves the health full; no ally text (AC 13; Independent Test).
- `an ally meets the one defense: Lyra deals 1 to a FIRE monster with defense 50`: (One damage AC 2).
- `an old payload with physicalDefense 50 halves the ally hit too`: monster `{ element: 'FIRE', physicalDefense: 50, magicalDefense: 50, critResistance: 0 }` → 1 (One damage AC 10).
- `Vex with 50 % armor pierce deals 1.6 to defense 40`: equipment a ring `ARMOR_PIERCE_PCT` 50 worn by Vex, `allies: [ 'vex', null, null, null ]` (One damage AC 3).
- `Prisão de Espinhos raises an ally hit to 2.5`: leader Orina 3 stars, WATER monster defense 0, Lyra in slot 1; `advance(999)`, then use skill 1 and `advance(1)` in one evaluate → 2.5 (One damage AC 4).
- `Bênção da Grande Árvore raises an ally hit to 2.6`: leader Seraphine 3 stars, LIGHT monster (One damage AC 5).
- `Brado Aterrador lowers the defense an ally meets: 1.8 against defense 40`: leader Kael 3 stars, skill 3 (One damage AC 6).
- `PHYSICAL_BREAK 5 lowers the defense an ally meets: 1.3 against defense 40`: `talents: { PHYSICAL_BREAK: 5 }` (One damage AC 7).
- `Ventos Ligeiros, a running combo and critical pieces leave an ally hit at 2`: leader Lyra 3 stars, NATURE monster defense 0, Orina in slot 1 wearing a ring `CRIT_CHANCE` 50 and `CRIT_DAMAGE_PCT` 100; use skill 3, click 5 times, let the click damage pass, then `advance` to the next ally tick → the ally text `2` (One damage AC 8).
- `a 3 star leader leaves the ally hit at 2`: leader Kael 3 stars, Lyra 0 stars in slot 1, FIRE monster defense 0 → 2 (One damage AC 9).
- `Orina 3 stars with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50`: (Allies fight AC 4, E3).
- `a 9 star Lyra deals 20`: (Allies fight AC 2, AC 6).
- `Lyra with +20 % boss damage deals 2.16 to a FIRE miniboss with defense 10`: start at the miniboss (Allies fight AC 5, E4).
- `an ally hit uses the new leader's element after a leader change`: NATURE monster, Lyra in slot 1; first tick 4 under Kael; change the leader to Orina in the Líder screen; next tick 1 (Allies fight AC 7, E15).
- `an ally that equips a piece hits with it on the next tick`: first tick 2; equip a weapon of `clickDamage` 1 on Lyra in Equipamento; next tick 4 (Allies fight AC 8).
- `an ally killing the monster drops its coins and the next monster appears`: 10 health, Lyra 9 stars and Orina in slots 1 and 2 → one tick kills; one ally text `20`; coins fly; the next monster appears with full health (Allies fight AC 9).
- `an ally hit keeps the combo streak`: click 3 times, read `combo-hud`, `advance` to the ally tick within the combo window → the same `combo-hud` text (Allies fight AC 11).
- `ally hits keep landing while Heróis is open`: open Heróis, `advance(1000)` → health 8 (Allies fight AC 14).
- `the pause menu freezes the ally clock`: `advance(600)`, open the pause menu, `advance(10000)`, close it, `advance(399)` → health 10; `advance(1)` → 8 (Allies fight AC 15, edge case, L-026).
- `one advance of 2500 ms lands two ticks`: 100 health → after `advance(2500)` health 96; `advance(499)` → 96; `advance(1)` → 94 (edge case).
- `a farm fight at chapter 5 has the allies hit too`: start a farm fight of the chapter 5 miniboss from Rever chefes → the first tick deals 2 (edge case).

**Gate**: full - `cd game && npx playwright test e2e/heroTeamCombat.spec.js` then `cd game && npm test && npx playwright test`
**Done when**:

- [x] The 22 scenarios pass; the whole Playwright suite passes.

**Commit**: `test(game): cover the ally hits`

---

### T25: Cover the ally passives in the browser [x]

**Owner**: test-engineer
**Goal**: e2e scenarios prove each passive on the real scene and screens (TEAM-11).
**Where**: `game/e2e/heroTeamPassives.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/heroTeamCombat.spec.js` (T24 helpers), `game/e2e/stages.spec.js` (reaching a miniboss and reading `Time: <n>`), `game/e2e/farm.spec.js` (a farm fight), `game/e2e/unifiedDamage.spec.js` (the attribute panel), spec § Passive Table, P2 Ally passives AC 1 to 10
**Depends on**: T24
**Requirement**: TEAM-11

**Contract**: the helpers of T24 (copied). Click scenarios start with `talents: {}` so the combo adds nothing. `openMainMenu(page, { random })` sets the roll, as `unifiedDamage.spec.js` `startAs` does with `roll`.

**Steps**:

1. Create the file with the helpers and `test.describe('Hero team: passives', ...)`.
2. Write the scenarios below with exactly these names.
3. Run the gate.

**Tests**: e2e
**Test cases**:

- `Kael as an ally starts a 30 s miniboss at Time: 35`: leader Lyra, Kael in slot 1, start at the miniboss of stage 1 → `.boss-timer` `Time: 35` (AC 1, P1; Independent Test).
- `Kael as an ally with MINIBOSS_TIME 4 starts it at Time: 39`: `talents: { MINIBOSS_TIME: 2 }` (2 s a level) → `Time: 39` (AC 1, P2).
- `Kael as an ally starts the chapter boss at Time: 65`: (AC 1, P3).
- `Lyra as an ally makes a roll of 15 a critical click`: leader Kael 0 stars, roll 0.15, FIRE monster defense 0 → one click deals 2 (critical number in orange); without Lyra in the team the same click deals 1 (AC 2, P4, P5).
- `Orina as an ally shows Defesa 25% on a monster of defense 40 and a click deals 0.75`: (AC 3, P6).
- `Orina as an ally on a monster of defense 10 shows Defesa 0%`: (AC 3, P7).
- `Vex as an ally shows Crit res 15% on a monster of critical resistance 30 and a roll of 8 is critical`: roll 0.08 → click deals 2 (AC 4, P8, P9).
- `Seraphine and Lyra as allies deal 5 per tick`: (AC 5, E5).
- `a hero that leads brings no passive`: leader Kael, Lyra in slot 1 → the miniboss starts at `Time: 30` (AC 6).
- `below chapter 5 no passive applies`: chapter 4, `cleared: [ 5 ]`, Kael in slot 1, leader Lyra → the miniboss starts at `Time: 30` (AC 7).
- `a team change keeps the running countdown and applies to the next boss`: Kael ally, miniboss at `Time: 35`; remove Kael in Equipe (`Remover`) → the timer keeps counting from where it was (it does not jump to 30); after the miniboss dies or times out, the next miniboss starts at `Time: 30` (AC 8).
- `the attribute panel counts the passives`: Lyra, Kael, Orina and Vex in slots 1 to 4 (`cleared: [ 5, 6, 7, 8 ]`), leader Seraphine 0 stars → Equipamento shows `Chance de crítico: 20%`, `Tempo extra de miniboss: 5s`, `Tempo extra de chefe: 5s`, `Quebra de defesa: 15`, `Quebra de resistência a crítico: 15` (AC 9, P10).
- `Kael as an ally starts a farm fight of a miniboss 5 s longer`: campaign at chapter 5, a farm fight of the stage 1 miniboss → `Time: 35` (AC 10).

**Gate**: full - `cd game && npx playwright test e2e/heroTeamPassives.spec.js` then `cd game && npm test && npx playwright test`
**Done when**:

- [x] The 13 scenarios pass; the whole Playwright suite passes.

**Commit**: `test(game): cover the ally passives`

---

### T26: Cover the allies on the field in the browser [ ]

**Owner**: test-engineer
**Goal**: e2e scenarios prove the formation positions and sizes, the attack motion, the redraws and the click-through on the real scene (TEAM-12).
**Where**: `game/e2e/heroTeamField.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/heroTeamCombat.spec.js` (T24 helpers), `game/src/adapters/phaser/ClickerGame.js` `showCharacter`, `onAllyTick`, `FORMATION` (T16), spec § Allies on the Field, P2 Allies on the field AC 1 to 9
**Depends on**: T25
**Requirement**: TEAM-12

**Contract**:

- Read the sprites from the scene: `scene(page, '(s) => [ ...s.allySprites ].map(([ slot, o ]) => ({ slot, key: o.texture.key, x: o.x, y: o.y, width: o.displayWidth, height: o.displayHeight, depth: o.depth, originX: o.originX, originY: o.originY }))')` and the leader from `s.character` the same way.
- The motion runs in real time (Phaser tweens): after the tick, poll the sprite `x` until it reaches 204 (slot 1), then until it is back at 180, each within 1 s (L-001).
- A canvas click at a scene point: `page.mouse.click(canvas.x + x * scale, canvas.y + y * scale)`.

**Steps**:

1. Create the file with the helpers and `test.describe('Hero team: allies on the field', ...)`.
2. Write the scenarios below with exactly these names.
3. Run the gate.

**Tests**: e2e
**Test cases**:

- `Lyra in slot 1 and Seraphine in slot 2 stand at (180, 460) and (180, 605) behind the leader at (320, 600)`: `cleared: [ 5, 6 ]`, `team: { boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] }` → slot 1 `hero_lyra` at (180, 460), slot 2 `hero_seraphine` at (180, 605), both depth 0.4, origin (0.5, 1); the leader at (320, 600), depth 0.5 (AC 1, AC 2; Independent Test).
- `slots 3 and 4 stand at (75, 450) and (75, 615) at depth 0.3`: four allies (AC 1).
- `Kael in an ally box measures 90 x 83.7 and Lyra 40.8 x 120`: leader Orina, Kael and Lyra in slots 1 and 2 (AC 3; tolerance 0.1).
- `Kael leading the formation measures 180 x 167.4 and Lyra 81.6 x 240`: two runs (AC 4; tolerance 0.1).
- `each ally tick moves the sprite 24 px right and back`: slot 1 Lyra → after the tick x reaches 204 and returns to 180 (AC 5).
- `Remover on both allies brings the leader back to (230, 612) at 320 px high`: from the first scenario, `Remover` on slots 1 and 2 in Equipe → no ally sprite; the leader at (230, 612), height 320 (AC 6; Independent Test).
- `Tornar líder redraws the formation with the new leader`: Lyra in slot 1 → Tornar líder → the leader `hero_lyra` at (320, 600); slot 1 `hero_kael` at (180, 460) (AC 6).
- `after a reset to chapter 1 no ally is drawn at the next encounter`: chapter 6 with Lyra in slot 1, reset → no ally sprite; the leader at (230, 612) (AC 7, AC 8).
- `an empty bought slot draws no sprite`: `team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] }` → one ally sprite (AC 8).
- `a click on an ally sprite still hits the monster`: `talents: {}`, Lyra in slot 1, a click at scene (180, 400) → the monster loses the click damage 1 (AC 9).

**Gate**: full - `cd game && npx playwright test e2e/heroTeamField.spec.js` then `cd game && npm test && npx playwright test`
**Done when**:

- [ ] The 10 scenarios pass; the whole Playwright suite passes.

**Commit**: `test(game): cover the allies on the field`

---

### T27: Review the hero team screens [ ]

**Owner**: ui-artist
**Goal**: Check every changed screen against spec § Equipe Screen Layout and § Allies on the Field and record the verdict in `ui-review.html` (TEAM-09, TEAM-10, TEAM-12).
**Where**: `.specs/features/hero-team/ui-review.html` (new)
**Also changes**: `game/ui-review/heroTeam.shots.js` (new), `.specs/features/hero-team/ui-review/*.png` (screenshots)
**Read first**: `.claude/agents/ui-artist.md`, `.claude/templates/ui-review.html`, `game/ui-review/unifiedDamage.shots.js` (pattern), `game/ui-review/support/`, `game/ui-review.config.js` (projects `desktop` 1280x720 and `phone` 390x844), `game/public/style.css` section `/* ══ Equipe ══ */`, spec § Equipe Screen Layout, § Allies on the Field, § Player-Facing Texts
**Depends on**: T26
**Requirement**: TEAM-09, TEAM-10, TEAM-12

**Contract** - screens and shots (desktop and phone each):

| # | Screen | State | Shot name |
| --- | --- | --- | --- |
| S1 | HUD rail | team locked (six buttons) and unlocked (seven) | `01-rail-locked`, `02-rail-unlocked` |
| S2 | Equipe | slot 1 buyable, slots 2 to 4 locked, chapter 5 | `03-team-buyable` |
| S3 | Equipe | purchase dialog, affordable and `Moedas insuficientes` | `04-team-dialog`, `05-team-dialog-short` |
| S4 | Equipe | after a purchase (flash and notice) | `06-team-bought` |
| S5 | Equipe | four allies, one selected, `Heróis disponíveis` empty | `07-team-full` |
| S6 | Equipe | below chapter 5 (status line), `waiting` slots | `08-team-inactive` |
| S7 | Combat | formation with four allies, mid motion, light-blue number | `09-field-formation` |
| S8 | Combat | leader Kael in the formation (widest sprite) | `10-field-kael` |

Checks per screen: every size, color, border style, opacity and text of the spec tables; no overlap of the formation with the element wheel, the battle bar, the monster or the effect tags; the rail bottom above the battle bar; the contrast of `team-price`, `team-dps-line`, `team-status` and the disabled cards on parchment (AD-022). The phone shots are judged only against TD-010 (known), not as findings.

**Steps**:

1. Write `game/ui-review/heroTeam.shots.js` with one `test` per screen, using `mockBackend` (with the T21 `team` option), `openMainMenu`, `fillCredentials` and the `shot` helper as `unifiedDamage.shots.js` does.
2. Run `cd game && npm run ui:shots -- heroTeam`.
3. Fill `ui-review.html` from the template (Portuguese, AD-007): one section per screen with its shots, the checks marked pass or fail, each failure as a finding with the selector, the observed value and the expected value. Verdict `APROVADO` or `MUDANÇAS PEDIDAS`.
4. Add each finding to this file as a new task `T28`, `T29`, ... (owner `game-dev`, with Where, Contract, Tests, Gate, Done when).

**Tests**: none
**Gate**: build - `cd game && npm run ui:shots -- heroTeam` exits 0
**Done when**:

- [ ] `ui-review.html` holds the 8 screens with desktop and phone shots and a verdict.
- [ ] Every finding is a task in this file.

**Commit**: `docs(hero-team): add the ui review`

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: `Team` domain | 1 value + its exceptions (one concept) | ✅ Granular |
| T2: `player_team` storage | 1 table, its port and adapter | ⚠️ cohesive (migration + adapter of the same table) |
| T3: team in `GET /heroes` and `PUT /leader` | 1 service change + its two responses | ⚠️ cohesive |
| T4: `PUT /team` | 1 endpoint | ✅ Granular |
| T5: `POST /team/slots` | 1 endpoint | ✅ Granular |
| T6: ADR and briefing | docs | ✅ Granular |
| T7: `team.js` | 1 module | ✅ Granular |
| T8: `allyAttacker.js` | 1 function | ✅ Granular |
| T9: passives in two builders | 2 functions, one rule | ⚠️ cohesive |
| T10: `allyHit` | 1 method | ✅ Granular |
| T11: `AllyCombat` | 1 class | ✅ Granular |
| T12: `leaderStats` passives | 1 function | ✅ Granular |
| T13: `heroesApi` | 2 calls of 1 adapter | ✅ Granular |
| T14: `heroCollection` | 1 service | ✅ Granular |
| T15: scene combat wiring | 1 scene concern (ally ticks) | ⚠️ cohesive |
| T16: scene formation | 1 scene concern (sprites) | ✅ Granular |
| T17: `teamView.js` + its CSS | 1 view | ✅ Granular |
| T18: HUD button + screen open | 1 screen entry | ✅ Granular |
| T19: team editing flows | 1 screen concern | ✅ Granular |
| T20: purchase flow | 1 screen concern | ✅ Granular |
| T21: fake backend team | 1 file | ✅ Granular |
| T22 to T26: e2e files | 1 file each | ✅ Granular |
| T27: ui review | 1 review | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | (start of Phase 1) | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | None | (start of Phase 3) | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | T13 | T13 → T14 | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |
| T17 | T16 | T16 → T17 | ✅ Match |
| T18 | T17 | T17 → T18 | ✅ Match |
| T19 | T18 | T18 → T19 | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |
| T21 | T20 | T20 → T21 | ✅ Match |
| T22 | T21 | T21 → T22 | ✅ Match |
| T23 | T22 | T22 → T23 | ✅ Match |
| T24 | T23 | T23 → T24 | ✅ Match |
| T25 | T24 | T24 → T25 | ✅ Match |
| T26 | T25 | T25 → T26 | ✅ Match |
| T27 | T26 | T26 → T27 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend repository and migration | integration | integration | ✅ OK |
| T3 | Backend service + web | unit + integration | unit + integration | ✅ OK |
| T4 | Backend service + web | unit + integration | unit + integration | ✅ OK |
| T5 | Backend service + web | unit + integration | unit + integration | ✅ OK |
| T6 | Docs | none | none | ✅ OK |
| T7 to T12 | Game domain | unit | unit | ✅ OK |
| T13 | Game http adapter | unit | unit | ✅ OK |
| T14 | Game application | unit | unit | ✅ OK |
| T15, T16 | Game scene | unit (jsdom) | unit | ✅ OK |
| T17 to T20 | Game views | unit (jsdom) | unit | ✅ OK |
| T21 to T26 | e2e | e2e | e2e | ✅ OK |
| T27 | UI review | none | none | ✅ OK |

Player-visible behaviour is unit-tested in T15 to T20 by its author and covered in the browser by T22 to T26 (owner `test-engineer`, L-062, L-099); every player-visible AC and edge case of the spec maps to a named scenario there.

## Task Count by Owner

| Owner | Tasks | Count |
| --- | --- | --- |
| kotlin-backend-dev | T1 to T6 | 6 |
| game-dev | T7 to T20 | 14 |
| test-engineer | T21 to T26 | 6 |
| ui-artist | T27 | 1 |
