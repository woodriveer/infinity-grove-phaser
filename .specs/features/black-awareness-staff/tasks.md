# Black Awareness Staff Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, discrimination sensor). This project has no Verifier: the `test-engineer` author check (T22) and the `ui-artist` review (T23) close Execute (`CLAUDE.md` § Agent team).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/black-awareness-staff/spec.md`
**Design**: `.specs/features/black-awareness-staff/design.md`
**Status**: Draft. Waiting for the owner's approval and the answers to Q1 to Q6 of the spec. Event day: 2026-11-20; the tasks are small so the feature can ship the same day.

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`. Kotlin paths shorten `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/` to `B/` and `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/` to `BT/`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text when the line moved.
- One task = one commit with the message under **Commit**, checked with `python .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`). No task edits any of them.
- `game/public/assets/staff_black_awares_day.png` is untracked; T16 commits it as it is (no rename, no resize).
- Mark the task `[x]` in this file in the same commit and set its requirement rows in `spec.md` § Requirement Traceability to `Implementing`.
- Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- Never weaken or rewrite an existing test. The new `special` constructor parameters are last and default to `null` so every existing `Piece(...)` and `PieceEntity(...)` call compiles unchanged; the new attacker field is added only when it is above 0 so every existing `toEqual` on an attacker holds.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times (`.specs/STATE.md` § Handoff notes).
- Kotlin style: ktlint (`./gradlew ktlintCheck`), KDoc on every public class and function, `logger` in a private companion like `EquipmentService`. Game style: 4-space indent, braces on their own line for functions with a body, `//  ` comments with two spaces.
- **Parallel tracks**: the backend (Phases 1 to 3, `kotlin-backend-dev`) and the game (Phases 4 and 5, `game-dev`) touch disjoint files and may run at the same time, each in its own worktree. Phase 6 (`test-engineer`) needs Phases 4 and 5; T23 (`ui-artist`) needs T22. Either side can deploy first: a game without the backend endpoint gets 404 on the claim and shows nothing (spec D15), and a backend without the new game sends a `special` field the old game ignores.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), `.claude/agents/test-engineer.md` (author check: every AC value asserted, CSS values with `toHaveCSS`, 3 to 5 mutants), `game/vitest.config.js` (jsdom, `src/**/*.test.js`), `game/playwright.config.js` (Desktop Chrome 1280x720, fake backend), `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres 17, ktlint). No coverage thresholds; strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`Equipment.kt`, `PieceRoller.kt`, `Gift.kt`) | unit | Every rule and every number of P1 Receive AC 1, 2, 5 and P1 See AC 4, 5 | `BT/domain/*Test.kt` | `cd backend && ./gradlew test --tests '<Class>'` |
| Backend adapter (`SaoPauloGiftCalendar`) | unit | The four boundary instants of P1 Receive AC 5 | `BT/adapter/config/SaoPauloGiftCalendarTest.kt` | `cd backend && ./gradlew test --tests 'SaoPauloGiftCalendarTest'` |
| Backend service (`GiftService`) | unit | Every branch: grant, already granted, other day, full bag, unknown user, no cards | `BT/service/GiftServiceTest.kt` | `cd backend && ./gradlew test --tests 'GiftServiceTest'` |
| Backend persistence (`V14`, `PieceEntity`, `GiftRepository`) | integration (Testcontainers) | Round trip of `special`, unique and cascade of `player_gifts` | `BT/adapter/repository/*IT.kt` | `cd backend && ./gradlew test --tests '<Class>'` |
| Backend web (`GiftController`, `PieceResponse`) | integration (RestAssured) | Every status and JSON field of P1 Receive AC 1 to 8, refine and reroll keep `special` | `BT/adapter/web/*IT.kt` | `cd backend && ./gradlew test --tests '<Class>'` |
| Game domain (`specials.js`, `equipment.js`, `damage.js`, `skillDamage.js`, `allyAttacker.js`) | unit | Every number of P1 Damage AC 1 to 9 and every text of P1 See AC 2, 3, 7 | `game/src/domain/**/*.test.js` | `cd game && npm test` |
| Game http + application (`giftApi.js`, `giftClaim.js`) | unit | Path, granted, not granted, failure | `game/src/{adapters/http,application/gifts}/*.test.js` | `cd game && npm test` |
| Game views and scenes (`pieceTile.js`, `HeroUi.js`, `ClickerGame.js`) | unit (jsdom) + e2e | Unit: attributes, icon, notice text and 6000 ms; e2e: every player-visible AC | `game/src/adapters/phaser/**/*.test.js`, `game/e2e/blackAwarenessStaff*.spec.js` | `cd game && npm test`, `cd game && npx playwright test e2e/<file>` |
| Stylesheet (`public/style.css`) | e2e | The 52 px icon and its 10 px corners with `toHaveCSS` | `game/e2e/blackAwarenessStaff.spec.js` | `cd game && npx playwright test e2e/blackAwarenessStaff.spec.js` |
| Migration (`V14__black_awareness_staff.sql`) | integration | Column and table exist, old rows read `null` | `BT/adapter/repository/EquipmentRepositoryIT.kt`, `GiftRepositoryIT.kt` | as above |
| UI review artifact | none | Reviewed by the `ui-artist` | `game/ui-review/blackAwarenessStaff.shots.js`, `.specs/features/black-awareness-staff/ui-review.html` | `cd game && npm run ui:shots -- blackAwarenessStaff` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Backend | Every backend task | `cd backend && ./gradlew ktlintCheck test` |
| Quick (game) | Game tasks with unit tests only | `cd game && npm test` |
| Full (game) | Game tasks with e2e | `cd game && npm test && npx playwright test <files of the task>` |
| Build (game) | End of Phases 4 and 5 | `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order inside a track; tasks inside a phase run in order. Every arrow is a `Depends on` inside the phase; dependencies on an earlier phase are listed in the task.

### Phase 1: Backend domain (kotlin-backend-dev)

```
T1 → T2
T1 → T3
```

### Phase 2: Backend persistence (kotlin-backend-dev)

```
T4 → T5
T4 → T7
T6 → T7
```

### Phase 3: Backend use case and endpoint (kotlin-backend-dev)

```
T8 → T9
```

### Phase 4: Game domain (game-dev)

```
T10 → T11 → T13
T12 → T13
```

### Phase 5: Game wiring and views (game-dev)

```
T14 → T18
T15 → T18
T16
T17 → T18
```

### Phase 6: e2e and author check (test-engineer)

```
T19 → T20 → T22
T19 → T21 → T22
```

### Phase 7: UI review (ui-artist)

```
T23
```

---

## Task Breakdown

### Phase 1: Backend domain

#### T1: `PieceSpecial` and `Piece.special` [x]

**Owner**: kotlin-backend-dev
**Goal**: A piece can carry the fixed special `BLACK_AWARENESS_STAFF`, only on a legendary weapon, and refine and reroll keep it (BAS-15).
**Where**: `B/domain/Equipment.kt`
**Also changes**: `BT/domain/EquipmentTest.kt`
**Read first**: `B/domain/Equipment.kt` (whole file, 153 lines; `Piece` at `:85`, `rerolled` at `:134`), `BT/domain/EquipmentTest.kt` (style of the existing cases)
**Depends on**: None
**Requirement**: BAS-15

**Contract**:

```kotlin
/** A fixed effect a piece carries outside its affixes; a refine or a reroll never changes it (spec black-awareness-staff). */
enum class PieceSpecial {
    /** Cajado da Consciência Negra: +200 % damage against DARKNESS monsters, applied by the game. Only on a legendary weapon. */
    BLACK_AWARENESS_STAFF,
}
```

`Piece` gains the last constructor parameter `val special: PieceSpecial? = null` (after `heroId`), documented in the class KDoc, and one more `init` rule:

```kotlin
require(special == null || (slot == Slot.WEAPON && rarity == Rarity.LEGENDARY)) { "Special $special needs a legendary weapon, got $rarity $slot" }
```

**Steps**:

1. Add the `PieceSpecial` enum above `data class Piece`.
2. Add `val special: PieceSpecial? = null,` after `val heroId: String? = null,` and one sentence to the `Piece` KDoc: "[special] is a fixed effect outside the affixes, kept by every copy."
3. Add the `require` line as the last line of `init`.
4. Add the 6 test cases below to `EquipmentTest.kt`.

**Tests**: unit
**Test cases** (`BT/domain/EquipmentTest.kt`; `staff(refine, affixes)` = `Piece("s", "yan", Slot.WEAPON, Rarity.LEGENDARY, 10, refine, affixes, special = PieceSpecial.BLACK_AWARENESS_STAFF)`; `FOUR` = `listOf(Affix(CRIT_CHANCE, 9), Affix(CRIT_DAMAGE_PCT, 50), Affix(BOSS_DAMAGE_PCT, 25), Affix(BOSS_TIME_SECONDS, 5))`):

- `a legendary weapon carries the black awareness staff special`: `staff(0, FOUR).special` equals `PieceSpecial.BLACK_AWARENESS_STAFF`.
- `a piece built without special has none`: `Piece("r", "yan", Slot.RING, Rarity.COMMON, null, 0, emptyList()).special` is `null`.
- `a special on a legendary ring is rejected`: `assertFailsWith<IllegalArgumentException> { Piece("r", "yan", Slot.RING, Rarity.LEGENDARY, null, 0, emptyList(), special = PieceSpecial.BLACK_AWARENESS_STAFF) }`.
- `a special on an epic weapon is rejected`: same with `Slot.WEAPON, Rarity.EPIC, 8`.
- `refined keeps the special`: `staff(0, FOUR).refined()` has `refine` 1 and `special` `BLACK_AWARENESS_STAFF`.
- `rerolled keeps the special and changes only the chosen affix`: `staff(5, FOUR).rerolled(0) { 0.0 }` has `special` `BLACK_AWARENESS_STAFF`, `affixes` `listOf(Affix(ARMOR_PIERCE_PCT, 25), Affix(CRIT_DAMAGE_PCT, 50), Affix(BOSS_DAMAGE_PCT, 25), Affix(BOSS_TIME_SECONDS, 5))` (the only weapon type not held is `ARMOR_PIERCE_PCT`; chance 0 gives the band minimum 25) and `refine` 5.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 6 new cases pass; every earlier backend test passes unchanged.
- [x] `ktlintCheck` exits 0.

**Commit**: `feat(backend): let a legendary weapon carry the black awareness staff special`

---

#### T2: `PieceRoller.blackAwarenessStaff` [x]

**Owner**: kotlin-backend-dev
**Goal**: Roll the staff exactly like a boss legendary weapon after the slot pick (BAS-01, spec P1 Receive AC 1 and 2).
**Where**: `B/domain/PieceRoller.kt`
**Also changes**: `BT/domain/PieceRollerTest.kt`
**Read first**: `B/domain/PieceRoller.kt` (whole file; `roll` at `:36-61`, `weaponClickRanges` at `:9`), `BT/domain/PieceRollerTest.kt:1-40` (how `chance` is passed)
**Depends on**: T1
**Requirement**: BAS-01

**Contract** (new public function of `object PieceRoller`; do not change `roll`):

```kotlin
/**
 * The Cajado da Consciência Negra of [username] (spec black-awareness-staff): a legendary weapon at +0 in the bag, its click damage
 * and 4 affixes rolled like a boss weapon after the slot pick, reading [chance] in the same order (the click, then each affix type
 * and value), and the special [PieceSpecial.BLACK_AWARENESS_STAFF].
 */
fun blackAwarenessStaff(
    username: String,
    id: String,
    chance: () -> Double,
): Piece
```

Body: `val rarity = Rarity.LEGENDARY`; `val baseClick = between(weaponClickRanges[rarity.index - 1], chance)`; `val remaining = AffixType.allowedOn(Slot.WEAPON).toMutableList()`; `val affixes = List(rarity.affixCount) { affix(remaining.removeAt(pick(remaining.size, chance)), rarity, chance) }`; `return Piece(id, username, Slot.WEAPON, rarity, baseClick, refine = 0, affixes = affixes, special = PieceSpecial.BLACK_AWARENESS_STAFF)`.

**Steps**:

1. Add the function after `roll`.
2. Add the 4 test cases below.

**Tests**: unit
**Test cases** (`BT/domain/PieceRollerTest.kt`, expected piece = `Piece("s1", "yan", Slot.WEAPON, Rarity.LEGENDARY, <click>, 0, <affixes>, null, PieceSpecial.BLACK_AWARENESS_STAFF)`, compared with `assertEquals`):

- `the staff at chance 0.5 has click 11 and boss damage 28, boss time 6, crit damage 55, armor pierce 28`: `blackAwarenessStaff("yan", "s1") { 0.5 }` equals click 11, affixes `[BOSS_DAMAGE_PCT 28, BOSS_TIME_SECONDS 6, CRIT_DAMAGE_PCT 55, ARMOR_PIERCE_PCT 28]`.
- `the staff at chance 0 has click 10 and the four lowest band values`: `{ 0.0 }` gives click 10, affixes `[CRIT_CHANCE 9, CRIT_DAMAGE_PCT 50, BOSS_DAMAGE_PCT 25, BOSS_TIME_SECONDS 5]`.
- `the staff at chance 0.99 has click 12 and the four highest band values`: `{ 0.99 }` gives click 12, affixes `[ARMOR_PIERCE_PCT 30, BOSS_TIME_SECONDS 6, BOSS_DAMAGE_PCT 30, CRIT_DAMAGE_PCT 60]`.
- `the staff reads nine chances`: a counter lambda `{ reads += 1; 0.5 }` reads exactly 9 times (1 click + 4 types + 4 values).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The 4 new cases pass; every earlier backend test passes unchanged.

**Commit**: `feat(backend): roll the black awareness staff like a legendary weapon`

---

#### T3: Gift day rule and gift values (`Gift.kt`) [x]

**Owner**: kotlin-backend-dev
**Goal**: The pure rule "November 20 of any year" and the values the gift use case returns and stores (BAS-03).
**Where**: `B/domain/Gift.kt` (new)
**Also changes**: `BT/domain/GiftTest.kt` (new)
**Read first**: `B/domain/EquipmentDrop.kt` (style of a small domain value)
**Depends on**: T1
**Requirement**: BAS-03

**Contract** (whole file):

```kotlin
package br.com.woodriver.infinity_grove_ws.domain

import java.time.LocalDate

/** The event gifts (spec black-awareness-staff). One gift exists: the Cajado da Consciência Negra, given on November 20 of any year. */
object GiftDay {
    /** The id of the staff gift in `player_gifts.gift_id`; equal to the name of [PieceSpecial.BLACK_AWARENESS_STAFF]. */
    const val STAFF_GIFT_ID = "BLACK_AWARENESS_STAFF"
    const val MONTH = 11
    const val DAY = 20

    /** True on November 20 of any year; [date] is the date in America/Sao_Paulo (see `GiftCalendarPort`). */
    fun isGiftDay(date: LocalDate): Boolean = date.monthValue == MONTH && date.dayOfMonth == DAY
}

/** The record that [username] received [giftId] as the piece [pieceId] at [grantedAt] (epoch milliseconds). */
data class GiftGrant(
    val username: String,
    val giftId: String,
    val pieceId: String,
    val grantedAt: Long,
)

/** What a claim gave: the new piece, or null when nothing was given. */
data class GiftClaim(
    val piece: Piece?,
) {
    val granted: Boolean get() = piece != null
}
```

**Steps**:

1. Create `Gift.kt` with the contract.
2. Create `GiftTest.kt` with the cases below.

**Tests**: unit
**Test cases** (`BT/domain/GiftTest.kt`):

- `November 20 is the gift day in 2026 and in 2027`: `isGiftDay(LocalDate.of(2026, 11, 20))` and `isGiftDay(LocalDate.of(2027, 11, 20))` are true.
- `November 19 and November 21 are not the gift day`: both false.
- `the 20th of October and of December is not the gift day`: both false.
- `a claim with a piece is granted and a claim without one is not`: `GiftClaim(<any ring piece>).granted` true, `GiftClaim(null).granted` false.
- `the staff gift id is the name of the staff special`: `GiftDay.STAFF_GIFT_ID == PieceSpecial.BLACK_AWARENESS_STAFF.name`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [x] The new cases pass; every earlier backend test passes unchanged.

**Commit**: `feat(backend): add the november 20 gift day rule`

---

### Phase 2: Backend persistence

#### T4: Migration V14 and `PieceEntity.special` [ ]

**Owner**: kotlin-backend-dev
**Goal**: Store the special of a piece and create the gift table, expand only (AD-016) (BAS-01, BAS-15).
**Where**: `backend/src/main/resources/db/migration/V14__black_awareness_staff.sql` (new)
**Also changes**: `B/adapter/repository/PieceEntity.kt`, `BT/adapter/repository/EquipmentRepositoryIT.kt`
**Read first**: `backend/src/main/resources/db/migration/V13__miniboss_adds.sql` (header comment style, `if not exists`), `V1__schema.sql:134-146` (`equipment_pieces`), `B/adapter/repository/PieceEntity.kt` (whole file), `BT/adapter/repository/EquipmentRepositoryIT.kt:1-60`
**Depends on**: T1
**Requirement**: BAS-01, BAS-15

**Contract** (`V14__black_awareness_staff.sql`, whole file):

```sql
-- The Cajado da Consciência Negra (spec black-awareness-staff). Expand only (AD-016): the previous backend neither reads nor writes the
-- new column or the new table, and a refine it saves keeps the column (its entity does not map it). Every statement can run again.
alter table equipment_pieces add column if not exists special varchar(32);

-- One row per account and gift: the unique key makes "once per account ever" hold under retries and concurrent claims. piece_id has no
-- foreign key on purpose: the staff may be sold (its row deleted) and the grant must stay.
create table if not exists player_gifts (
    id         varchar(255) primary key,
    username   varchar(255) not null references users (username) on delete cascade,
    gift_id    varchar(64)  not null,
    piece_id   varchar(255) not null,
    granted_at bigint       not null,
    constraint uk_player_gifts_username_gift unique (username, gift_id)
);
```

`PieceEntity` gains the last constructor parameter (after `createdAt`):

```kotlin
@Column(length = 32)
var special: String? = null,
```

`toDomain()` passes `special = special?.let(PieceSpecial::valueOf)`; `from()` passes `special = piece.special?.name`. Update the class KDoc: "`special` is the name of the piece's `PieceSpecial`, null for none."

**Steps**:

1. Create the migration file.
2. Add the `special` column to `PieceEntity`, `toDomain()` and `from()`.
3. Add the 3 test cases below to `EquipmentRepositoryIT.kt`.

**Tests**: integration
**Test cases** (`BT/adapter/repository/EquipmentRepositoryIT.kt`; `staff` = `Piece("staff", "yan", Slot.WEAPON, Rarity.LEGENDARY, 11, 0, listOf(Affix(BOSS_DAMAGE_PCT, 28), Affix(BOSS_TIME_SECONDS, 6), Affix(CRIT_DAMAGE_PCT, 55), Affix(ARMOR_PIERCE_PCT, 28)), special = PieceSpecial.BLACK_AWARENESS_STAFF)`):

- `a staff reads back with its special`: save `staff`, `findAll("yan")` equals `listOf(staff)`.
- `a staff refined and saved again keeps its special`: save `staff`, save `staff.refined()`, `findAll("yan").single()` has `refine` 1 and `special` `BLACK_AWARENESS_STAFF`.
- `a piece without special stores null in the special column`: save a common ring, `jdbcTemplate.queryForObject("select special from equipment_pieces where id = ?", String::class.java, "<ring id>")` is `null` (autowire `JdbcTemplate` if the class has none).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 3 new cases pass; `SchemaValidationIT`, `PreviousBackendCompatibilityIT` and every earlier test pass unchanged.
- [ ] The migration file name is exactly `V14__black_awareness_staff.sql`.

**Commit**: `feat(backend): store the special of a piece and the player gifts table`

---

#### T5: `special` in the piece JSON [ ]

**Owner**: kotlin-backend-dev
**Goal**: Every piece the API answers carries `special` when it has one, also after a refine and a reroll (BAS-15, BAS-16).
**Where**: `B/adapter/web/EquipmentResponses.kt`
**Also changes**: `BT/adapter/web/EquipmentControllerIT.kt`, `BT/adapter/web/EquipmentRefineIT.kt`, `BT/adapter/web/EquipmentRerollIT.kt`, `BT/adapter/web/EquipmentSellIT.kt`
**Read first**: `B/adapter/web/EquipmentResponses.kt:14-51` (`PieceResponse`), `BT/adapter/web/EquipmentControllerIT.kt:1-80` (pieces inserted with `jpaPieceRepository.save(PieceEntity(...))`), `EquipmentRefineIT.kt:1-66` and `EquipmentRerollIT.kt` (how copper is given), `EquipmentSellIT.kt`
**Depends on**: T4
**Requirement**: BAS-15, BAS-16

**Contract**: `PieceResponse` gains the last field

```kotlin
@JsonInclude(JsonInclude.Include.NON_NULL)
val special: String?,
```

filled in `from` with `special = piece.special?.name`; KDoc line: "`special` is the fixed effect of the piece (`BLACK_AWARENESS_STAFF`), absent for none."

**Steps**:

1. Add the field and its value in `from`.
2. Add the 4 test cases below; a staff row is `PieceEntity("staff", "yan", "WEAPON", "LEGENDARY", 11, <refine>, "BOSS_DAMAGE_PCT:28,BOSS_TIME_SECONDS:6,CRIT_DAMAGE_PCT:55,ARMOR_PIERCE_PCT:28", null, 1, "BLACK_AWARENESS_STAFF")`.

**Tests**: integration
**Test cases**:

- `EquipmentControllerIT`: `GET equipment answers the special of the staff and omits it for other pieces`: staff at refine 0 and `weapon("w1")`; `pieces.find { it.id == 'staff' }.special` equals `"BLACK_AWARENESS_STAFF"`, `pieces.find { it.id == 'w1' }.special` is `nullValue()`.
- `EquipmentRefineIT`: `refining the staff keeps its special`: staff at refine 0, 4000 copper (legendary refine cost at +0 = 500 x 8); `POST /equipment/staff/refine` is 200, `equipment.pieces[0].refine` 1, `equipment.pieces[0].special` `"BLACK_AWARENESS_STAFF"`, `equipment.pieces[0].clickDamage` 12.1f.
- `EquipmentRerollIT`: `rerolling an affix of the staff keeps its special and four affixes`: staff at refine 5, 5000 copper, `POST /equipment/staff/reroll` with `{"affix":0}` is 200, `equipment.pieces[0].special` `"BLACK_AWARENESS_STAFF"`, `equipment.pieces[0].affixes` has size 4.
- `EquipmentSellIT`: `selling the staff pays 500 copper and removes it`: staff at refine 0, `POST /equipment/staff/sell` is 200, `equipment.pieces` has size 0 and the wallet answered holds 500 copper more than before (read the existing sell case for the wallet fields).

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 4 new cases pass; every earlier test passes unchanged.

**Commit**: `feat(backend): answer the special of a piece`

---

#### T6: Gift ports and the Sao Paulo calendar [ ]

**Owner**: kotlin-backend-dev
**Goal**: The backend decides the date in `America/Sao_Paulo` from the injectable `Clock` (BAS-03, spec P1 Receive AC 5).
**Where**: `B/port/GiftPorts.kt` (new)
**Also changes**: `B/adapter/config/SaoPauloGiftCalendar.kt` (new), `BT/adapter/config/SaoPauloGiftCalendarTest.kt` (new)
**Read first**: `B/port/EquipmentRepositoryPort.kt` (port style), `B/InfinityGroveWsApplication.kt:14` (the `Clock` bean, UTC), `BT/Fakes.kt:98-108` (`MutableClock`)
**Depends on**: T3
**Requirement**: BAS-03

**Contract**:

```kotlin
// B/port/GiftPorts.kt
package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.GiftGrant
import java.time.LocalDate

/** Today's date for the gift rules: the date in America/Sao_Paulo (spec black-awareness-staff D3). */
interface GiftCalendarPort {
    fun today(): LocalDate
}

/** The gifts each account received; the caller holds the player lock when it saves. */
interface GiftRepositoryPort {
    fun exists(username: String, giftId: String): Boolean

    /** Inserts [grant]; a second grant of the same gift for the same account fails. */
    fun save(grant: GiftGrant): GiftGrant
}
```

```kotlin
// B/adapter/config/SaoPauloGiftCalendar.kt
/** The gift calendar on the application [Clock]: the instant seen in America/Sao_Paulo (UTC-3, no daylight saving since 2019). */
@Component
class SaoPauloGiftCalendar(
    private val clock: Clock,
) : GiftCalendarPort {
    override fun today(): LocalDate = clock.instant().atZone(ZONE).toLocalDate()

    companion object {
        val ZONE: ZoneId = ZoneId.of("America/Sao_Paulo")
    }
}
```

**Steps**:

1. Create both files with the contract (format with ktlint's parameter wrapping).
2. Create the test with the 4 cases below, each with `MutableClock(Instant.parse("<instant>").toEpochMilli())`.

**Tests**: unit
**Test cases** (`BT/adapter/config/SaoPauloGiftCalendarTest.kt`):

- `midnight of November 20 in Sao Paulo is 03:00 UTC`: `2026-11-20T03:00:00Z` gives `LocalDate.of(2026, 11, 20)`.
- `one second before is still November 19 in Sao Paulo`: `2026-11-20T02:59:59Z` gives `2026-11-19`.
- `23:59:59 of November 20 in Sao Paulo is still the 20th`: `2026-11-21T02:59:59Z` gives `2026-11-20`.
- `03:00 UTC of November 21 is November 21 in Sao Paulo`: `2026-11-21T03:00:00Z` gives `2026-11-21`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 4 cases pass; the application context of every IT still starts (one `GiftCalendarPort` bean).

**Commit**: `feat(backend): read the gift date in sao paulo time`

---

#### T7: `GiftRepository` (player_gifts) [ ]

**Owner**: kotlin-backend-dev
**Goal**: Read and insert gift grants; a duplicate insert fails (BAS-02, BAS-05).
**Where**: `B/adapter/repository/GiftRepository.kt` (new)
**Also changes**: `BT/adapter/repository/GiftRepositoryIT.kt` (new)
**Read first**: `B/adapter/repository/EquipmentRepository.kt` (adapter style), `B/adapter/repository/PieceEntity.kt` (entity style), `BT/adapter/repository/EquipmentRepositoryIT.kt:1-60`, `BT/IntegrationTestBase.kt` (`users(...)` helper, cleanup by `jpaUserRepository.deleteAll()` which cascades to `player_gifts`)
**Depends on**: T4, T6
**Requirement**: BAS-02, BAS-05

**Contract** (one file):

```kotlin
/** One row per account and gift; `id` is `<username>/<giftId>`. */
@Entity
@Table(name = "player_gifts")
class PlayerGiftEntity(
    @Id @Column(nullable = false, updatable = false) var id: String,
    @Column(nullable = false, updatable = false) var username: String,
    @Column(name = "gift_id", nullable = false, updatable = false, length = 64) var giftId: String,
    @Column(name = "piece_id", nullable = false, updatable = false) var pieceId: String,
    @Column(name = "granted_at", nullable = false, updatable = false) var grantedAt: Long,
)

interface JpaPlayerGiftRepository : JpaRepository<PlayerGiftEntity, String> {
    fun existsByUsernameAndGiftId(username: String, giftId: String): Boolean

    /** A plain insert (never a merge), so a second grant of the same gift violates the key instead of overwriting the first. */
    @Modifying
    @Query(
        value = "insert into player_gifts (id, username, gift_id, piece_id, granted_at) values (:id, :username, :giftId, :pieceId, :grantedAt)",
        nativeQuery = true,
    )
    fun insert(id: String, username: String, giftId: String, pieceId: String, grantedAt: Long): Int
}

@Repository
class GiftRepository(private val jpaPlayerGiftRepository: JpaPlayerGiftRepository) : GiftRepositoryPort {
    @Transactional
    override fun exists(username: String, giftId: String) = jpaPlayerGiftRepository.existsByUsernameAndGiftId(username, giftId)

    @Transactional
    override fun save(grant: GiftGrant): GiftGrant {
        jpaPlayerGiftRepository.insert("${grant.username}/${grant.giftId}", grant.username, grant.giftId, grant.pieceId, grant.grantedAt)
        return grant
    }
}
```

**Steps**:

1. Create the file with the contract (ktlint wrapping; `@Param` annotations if the build does not keep parameter names).
2. Create `GiftRepositoryIT` (extends `IntegrationTestBase`, autowires `GiftRepository`) with the cases below; create users with `users("yan", "ana")`.

**Tests**: integration
**Test cases** (`BT/adapter/repository/GiftRepositoryIT.kt`, `grant` = `GiftGrant("yan", "BLACK_AWARENESS_STAFF", "piece-1", 1_000L)`):

- `exists is false before a grant and true after it`.
- `a second grant of the same gift for the same account fails`: second `save(grant.copy(pieceId = "piece-2"))` throws `DataIntegrityViolationException`; `select piece_id from player_gifts where username = 'yan'` still reads `piece-1`.
- `the same gift for two accounts is two rows`: `exists("ana", ...)` true after saving `grant.copy(username = "ana")`.
- `deleting the account deletes its grant`: `jpaUserRepository.deleteById("yan")`, then `select count(*) from player_gifts where username = 'yan'` is 0.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 4 cases pass; `SchemaValidationIT` passes with the new entity.

**Commit**: `feat(backend): store the gifts an account received`

---

### Phase 3: Backend use case and endpoint

#### T8: `GiftService` (claim use case) [ ]

**Owner**: kotlin-backend-dev
**Goal**: Grant the staff once per account on November 20 in Sao Paulo, under the player lock, ignoring the bag capacity (BAS-01 to BAS-05).
**Where**: `B/service/GiftService.kt` (new)
**Also changes**: `B/usecase/GiftUseCase.kt` (new), `BT/Fakes.kt`, `BT/service/GiftServiceTest.kt` (new)
**Read first**: `B/service/EquipmentService.kt` (whole file; `lockPlayer` at `:162-169`, `requireUser` at `:155-160`), `B/service/EquipmentRewards.kt` (log style), `B/usecase/EquipmentUseCase.kt` (use case style), `BT/service/EquipmentServiceTest.kt:1-60` (fakes and `player()`), `BT/Fakes.kt` (`InMemoryEquipmentRepository` `:236`, `SequenceIds` `:285`, `SequenceChanceRoller` `:222`)
**Depends on**: T2, T7
**Requirement**: BAS-01, BAS-02, BAS-03, BAS-04, BAS-05

**Contract**:

```kotlin
// B/usecase/GiftUseCase.kt
/** Claims the event gift of the day for [username]: the new piece, or nothing (spec black-awareness-staff). */
interface ClaimGiftUseCase {
    fun claim(username: String): GiftClaim
}

// B/service/GiftService.kt
@Service
@Transactional
class GiftService(
    private val giftRepository: GiftRepositoryPort,
    private val calendar: GiftCalendarPort,
    private val equipmentRepository: EquipmentRepositoryPort,
    private val playerCardsRepository: PlayerCardsRepositoryPort,
    private val userRepository: UserRepositoryPort,
    private val chanceRoller: ChanceRollerPort,
    private val ids: IdGeneratorPort,
    private val clock: Clock,
) : ClaimGiftUseCase
```

`claim(username)` in this order:

1. `logger.info("Gift claim requested username={}", username)`; if `!userRepository.existsByUsername(username)` throw `UserNotFoundException(username)`.
2. If `!GiftDay.isGiftDay(calendar.today())` return `GiftClaim(null)` (no lock, no chance read, no write).
3. Lock: `playerCardsRepository.findForUpdate(username) ?: throw PlayerCardsMissingException(username)`.
4. If `giftRepository.exists(username, GiftDay.STAFF_GIFT_ID)` log `"Gift already granted username={}"` and return `GiftClaim(null)`.
5. `val piece = PieceRoller.blackAwarenessStaff(username, ids.next(), chanceRoller::roll)`.
6. `equipmentRepository.save(piece)` with no capacity check (spec D6: the bag may hold one more than its capacity).
7. `giftRepository.save(GiftGrant(username, GiftDay.STAFF_GIFT_ID, piece.id, clock.millis()))`.
8. `logger.info("Gift granted username={} gift={} piece={}", username, GiftDay.STAFF_GIFT_ID, piece.id)`; return `GiftClaim(piece)`.

Fakes added to `BT/Fakes.kt`:

```kotlin
class InMemoryGiftRepository : GiftRepositoryPort {
    val grants = mutableListOf<GiftGrant>()
    override fun exists(username: String, giftId: String) = grants.any { it.username == username && it.giftId == giftId }
    override fun save(grant: GiftGrant): GiftGrant {
        check(!exists(grant.username, grant.giftId)) { "duplicate gift ${grant.giftId} for ${grant.username}" }
        return grant.also { grants += it }
    }
}

class FixedGiftCalendar(var today: LocalDate) : GiftCalendarPort {
    override fun today() = today
}
```

**Steps**:

1. Create `GiftUseCase.kt`, then `GiftService.kt` with the private `logger` companion.
2. Add the two fakes to `Fakes.kt`.
3. Create `GiftServiceTest.kt` with the cases below. Setup: `users`, `playerCards`, `pieces`, `gifts = InMemoryGiftRepository()`, `calendar = FixedGiftCalendar(LocalDate.of(2026, 11, 20))`, `chance = SequenceChanceRoller(0.5)`, `SequenceIds()`, `MutableClock(1_000L)`; `player()` as in `EquipmentServiceTest`.

**Tests**: unit
**Test cases** (`BT/service/GiftServiceTest.kt`; `STAFF_AFFIXES` = `[BOSS_DAMAGE_PCT 28, BOSS_TIME_SECONDS 6, CRIT_DAMAGE_PCT 55, ARMOR_PIERCE_PCT 28]`):

- `on November 20 a player without the gift receives the staff in the bag`: `claim("yan")` is granted with `Piece("piece-1", "yan", WEAPON, LEGENDARY, 11, 0, STAFF_AFFIXES, null, BLACK_AWARENESS_STAFF)`; `pieces.findAll("yan")` equals `listOf(<that piece>)`; `gifts.grants` equals `listOf(GiftGrant("yan", "BLACK_AWARENESS_STAFF", "piece-1", 1_000L))`.
- `a second claim the same day gives nothing and stores nothing`: second `claim` not granted; one piece, one grant.
- `a claim on the next November 20 after a grant gives nothing`: grant on 2026-11-20, set `calendar.today` to 2027-11-20, `claim` not granted, one piece.
- `a claim on November 19 gives nothing, stores nothing and reads no chance`: `calendar.today` 2026-11-19; not granted; no piece, no grant; `chance.reads` is 0.
- `a claim on November 21 gives nothing`: 2026-11-21; not granted.
- `a full bag still receives the staff and nothing is sold`: 100 rings saved first; granted; `pieces.findAll("yan")` has size 101 and holds a piece with special `BLACK_AWARENESS_STAFF`.
- `a player who sold the staff does not receive another`: grant saved by hand, no staff piece; not granted; no piece.
- `an unknown user is rejected`: `assertFailsWith<UserNotFoundException> { service.claim("ghost") }`.
- `a user without a cards row is rejected on the gift day`: user saved, no cards; `assertFailsWith<PlayerCardsMissingException>`.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 9 cases pass; every earlier backend test passes unchanged.

**Commit**: `feat(backend): grant the black awareness staff once per account on november 20`

---

#### T9: `POST /gifts/claim` [ ]

**Owner**: kotlin-backend-dev
**Goal**: The endpoint the game calls on every battle start (BAS-01 to BAS-06).
**Where**: `B/adapter/web/GiftController.kt` (new)
**Also changes**: `BT/IntegrationTestBase.kt`, `BT/adapter/web/GiftControllerIT.kt` (new)
**Read first**: `B/adapter/web/EquipmentController.kt:60-75` (`Principal`), `B/adapter/web/EquipmentResponses.kt` (`PieceResponse.from`), `BT/IntegrationTestBase.kt:37-69` (`ControllableChanceRoller`, `@Import`), `BT/adapter/web/EquipmentControllerIT.kt:17-45` (register and token), `BT/adapter/web/EquipmentRefineIT.kt:118-150` (two requests at once with `Executors`)
**Depends on**: T8, T5
**Requirement**: BAS-01, BAS-02, BAS-03, BAS-04, BAS-05, BAS-06

**Contract**:

```kotlin
/** The answer of a gift claim: `gift` and `piece` only when [granted]. */
data class GiftClaimResponse(
    val granted: Boolean,
    @JsonInclude(JsonInclude.Include.NON_NULL) val gift: String?,
    @JsonInclude(JsonInclude.Include.NON_NULL) val piece: PieceResponse?,
)

@RestController
@RequestMapping("/gifts")
class GiftController(
    private val claimGift: ClaimGiftUseCase,
    private val rules: EquipmentRules,
) {
    /** Claims the gift of the day (spec black-awareness-staff); always 200, `granted: false` when nothing was given. */
    @PostMapping("/claim")
    fun claim(principal: Principal): GiftClaimResponse {
        val piece = claimGift.claim(principal.name).piece ?: return GiftClaimResponse(false, null, null)
        return GiftClaimResponse(true, GiftDay.STAFF_GIFT_ID, PieceResponse.from(piece, rules))
    }
}
```

No `SecurityConfig` change: `anyRequest, authenticated` already covers `/gifts/claim`.

`IntegrationTestBase.kt` gains (next to `ControllableChanceRoller`) and adds `GiftCalendarTestConfiguration::class` to `@Import`:

```kotlin
/** The gift date every integration test reads; by default not a gift day, so no other test receives the staff. */
class ControllableGiftCalendar : GiftCalendarPort {
    @Volatile
    var today: LocalDate = NOT_GIFT_DAY

    override fun today() = today

    companion object {
        val NOT_GIFT_DAY: LocalDate = LocalDate.of(2026, 11, 19)
    }
}

@TestConfiguration(proxyBeanMethods = false)
class GiftCalendarTestConfiguration {
    @Bean
    @Primary
    fun controllableGiftCalendar() = ControllableGiftCalendar()
}
```

Do not replace the `Clock` bean: tokens are signed with it and checked against the real time.

**Steps**:

1. Create `GiftController.kt` (both classes in it).
2. Add the calendar class and configuration to `IntegrationTestBase.kt` and the `@Import` entry.
3. Create `GiftControllerIT.kt`: autowire `ControllableGiftCalendar` and `ControllableChanceRoller`; `@BeforeTest` registers `yan` (as `EquipmentControllerIT` does), sets `chance.value = 0.5` and `calendar.today = LocalDate.of(2026, 11, 20)`; `@AfterTest` sets `calendar.today = ControllableGiftCalendar.NOT_GIFT_DAY` and `chance.value = ControllableChanceRoller.NO_DROP`.

**Tests**: integration
**Test cases** (`BT/adapter/web/GiftControllerIT.kt`):

- `on November 20 the first claim answers the staff and GET equipment lists it`: `POST /gifts/claim` is 200 with `granted` true, `gift` `"BLACK_AWARENESS_STAFF"`, `piece.slot` `"WEAPON"`, `piece.rarity` `"LEGENDARY"`, `piece.refine` 0, `piece.clickDamage` 11.0f, `piece.affixes.type` `["BOSS_DAMAGE_PCT", "BOSS_TIME_SECONDS", "CRIT_DAMAGE_PCT", "ARMOR_PIERCE_PCT"]`, `piece.affixes.value` `[28, 6, 55, 28]`, `piece.refineCost` 4000, `piece.sellPrice` 500, `piece.special` `"BLACK_AWARENESS_STAFF"`, `piece.heroId` `nullValue()`; then `GET /equipment` has `pieces` of size 1 whose `special` is `"BLACK_AWARENESS_STAFF"` and whose `id` equals `piece.id`.
- `a second claim answers granted false without gift or piece`: second call is 200 with `granted` false, `gift` `nullValue()`, `piece` `nullValue()`; `GET /equipment` still has 1 piece.
- `on November 19 the claim answers granted false and stores nothing`: `calendar.today` 2026-11-19; 200 `granted` false; `GET /equipment` `pieces` size 0; `select count(*) from player_gifts` is 0.
- `a full bag receives the staff as the 101st piece`: 100 rings saved with `jpaPieceRepository` (`PieceEntity("r$i", "yan", "RING", "COMMON", null, 0, "CLICK_DAMAGE_PCT:7", null, i.toLong())`); claim granted; `GET /equipment` `pieces` size 101 and `capacity` 100.
- `two claims at once give exactly one staff`: two `POST /gifts/claim` on a 2-thread pool; exactly one body has `granted` true and the other `granted` false; `select count(*) from equipment_pieces where username = 'yan' and special = 'BLACK_AWARENESS_STAFF'` is 1.
- `a claim without a token is 401`: no `Authorization` header, 401; `player_gifts` count 0.

**Gate**: `cd backend && ./gradlew ktlintCheck test`
**Done when**:

- [ ] The 6 cases pass; every earlier IT passes with the new `@Import`.
- [ ] `cd backend && ./gradlew test` passes in full (no `--tests` filter).

**Commit**: `feat(backend): add the gift claim endpoint`

---

### Phase 4: Game domain

#### T10: Special catalog (`specials.js`) [x]

**Owner**: game-dev
**Goal**: One place for the staff's name, icon, damage percent, line and notice (BAS-13, BAS-14, BAS-17).
**Where**: `game/src/domain/equipment/specials.js` (new)
**Also changes**: `game/src/domain/equipment/specials.test.js` (new)
**Read first**: `game/src/domain/equipment/equipment.js:1-20` (header style), `game/src/domain/heroes/heroes.js:13` (`ELEMENT_LABELS`: DARKNESS is `Escuridão`)
**Depends on**: None
**Requirement**: BAS-13, BAS-14, BAS-17

**Contract** (whole file):

```js
//  The fixed effects a piece can carry outside its affixes (spec black-awareness-staff). Pure JavaScript: no Phaser.
//  A piece of the backend carries `special` (a key of SPECIALS) or no field; a key the game does not know is ignored (spec D13).
export const BLACK_AWARENESS_STAFF = 'BLACK_AWARENESS_STAFF';

export const SPECIALS = Object.freeze({
    [BLACK_AWARENESS_STAFF]: Object.freeze({
        name: 'Cajado da Consciência Negra',
        icon: 'staff_black_awares_day',
        darknessDamagePct: 200,
        line: 'Especial: +200% de dano contra Escuridão'
    })
});

//  The special of `piece`, or null for a piece with none or with one the game does not know
export const specialOf = (piece) => (piece?.special != null && Object.hasOwn(SPECIALS, piece.special) ? SPECIALS[piece.special] : null);

//  The notice of the gift and how long it shows (spec D9)
export const GIFT_NOTICE = 'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!';
export const GIFT_NOTICE_MS = 6000;
```

**Steps**:

1. Create the file.
2. Create the test file with the cases below.

**Tests**: unit
**Test cases** (`describe('specials')`):

- `the staff is named Cajado da Consciência Negra, uses its own icon and gives +200 % against Escuridão`: `SPECIALS.BLACK_AWARENESS_STAFF` `toEqual` `{ name: 'Cajado da Consciência Negra', icon: 'staff_black_awares_day', darknessDamagePct: 200, line: 'Especial: +200% de dano contra Escuridão' }`.
- `specialOf returns the staff for a piece with special BLACK_AWARENESS_STAFF`: `specialOf({ special: 'BLACK_AWARENESS_STAFF' })` is `SPECIALS.BLACK_AWARENESS_STAFF`.
- `specialOf returns null for no special, null and an unknown special`: `{}`, `{ special: null }`, `{ special: 'FROST_RUNE' }` each give `null`.
- `specialOf returns null for inherited names`: `{ special: 'toString' }` and `{ special: '__proto__' }` give `null`.
- `the gift notice reads the text of the spec and lasts 6000 ms`: `GIFT_NOTICE` equals `'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!'`, `GIFT_NOTICE_MS` is 6000.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 5 cases pass; every earlier unit test passes unchanged.

**Commit**: `feat(game): add the black awareness staff special`

---

#### T11: Title, lines and attacker of the staff (`equipment.js`) [x]

**Owner**: game-dev
**Goal**: The staff's name and special line on every piece view, and `darknessDamagePct` on the attacker of its wearer (BAS-08, BAS-11, BAS-14, BAS-17).
**Where**: `game/src/domain/equipment/equipment.js`
**Also changes**: `game/src/domain/equipment/equipment.test.js`
**Read first**: `game/src/domain/equipment/equipment.js` (whole file; `pieceLines` `:27`, `pieceTitle` `:48`, `attackerFor` `:63-80`), `game/src/domain/equipment/equipment.test.js:1-20` (`piece`, `weapon`, `affix` helpers), `game/src/domain/combat/damage.js:7` (`PLAYER`)
**Depends on**: T10
**Requirement**: BAS-08, BAS-11, BAS-14, BAS-17

**Contract**:

- `import { specialOf } from './specials';`
- `pieceTitle(piece)`: `specialOf(piece)` set → `` `${special.name} +${piece.refine}` ``; else the current text.
- `pieceLines(piece)`: the current lines, then `special.line` when `specialOf(piece)` is set.
- `attackerFor`: after `weaponDamage`, `const darknessDamagePct = pieces.reduce((sum, piece) => sum + (specialOf(piece)?.darknessDamagePct ?? 0), 0);` and the returned object ends with `...(darknessDamagePct > 0 && { darknessDamagePct })`. Add to its comment: "`darknessDamagePct` (percent more damage against DARKNESS, the staff) only when a worn piece has it."

**Steps**:

1. Add the import.
2. Change `pieceTitle`, `pieceLines` and `attackerFor` as above.
3. Add the test cases below.

**Tests**: unit
**Test cases** (`equipment.test.js`; `STAFF` = `{ id: 's', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, clickDamage: 11, affixes: [ { type: 'BOSS_DAMAGE_PCT', value: 28 }, { type: 'BOSS_TIME_SECONDS', value: 6 }, { type: 'CRIT_DAMAGE_PCT', value: 55 }, { type: 'ARMOR_PIERCE_PCT', value: 28 } ], special: 'BLACK_AWARENESS_STAFF' }`):

- `the staff title is its name and refine`: `pieceTitle(STAFF)` is `'Cajado da Consciência Negra +0'`; `pieceTitle({ ...STAFF, refine: 3 })` is `'Cajado da Consciência Negra +3'`.
- `a piece with an unknown special keeps the rarity and slot title`: `pieceTitle({ ...STAFF, special: 'FROST_RUNE' })` is `'Lendário Arma +0'`.
- `the staff lines end with the special line`: `pieceLines(STAFF)` `toEqual` `['Dano de clique: 11.0', 'Dano em chefes +28%', 'Tempo extra de chefe +6s', 'Dano crítico +55%', 'Perfuração de armadura +28%', 'Especial: +200% de dano contra Escuridão']`.
- `a piece with an unknown special has no special line`: `pieceLines({ ...STAFF, special: 'FROST_RUNE' })` has length 5 and no line starting with `Especial`.
- `the attacker of a hero wearing the staff carries darknessDamagePct 200`: `attackerFor(PLAYER, [ { ...STAFF, clickDamage: 10, affixes: [] } ])` `toEqual` `{ element: 'FIRE', baseDamage: 11, critChance: 10, critMultiplier: 2, armorPierce: 0, bossDamage: 0, darknessDamagePct: 200 }`.
- `the attacker of a plain weapon has no darknessDamagePct field`: `'darknessDamagePct' in attackerFor(PLAYER, [ { ...STAFF, clickDamage: 10, affixes: [], special: undefined } ])` is false.
- `a staff with an unknown special gives no darknessDamagePct`: same with `special: 'FROST_RUNE'`, false.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 7 cases pass; every earlier unit test passes unchanged (`leaderStats`, `leaderAttacker`, `allyAttacker` included).

**Commit**: `feat(game): name the staff and give its wearer the darkness bonus`

---

#### T12: The x3 against DARKNESS in `calculateDamage` [x]

**Owner**: game-dev
**Goal**: One multiplication covers every strike: click, auto click, skill hit, aimed shot, tick, ally hit (BAS-08, BAS-09).
**Where**: `game/src/domain/combat/damage.js`
**Also changes**: `game/src/domain/combat/damage.test.js`, `game/src/domain/skills/skillDamage.test.js`
**Read first**: `game/src/domain/combat/damage.js` (whole file, 35 lines), `game/src/domain/combat/elements.js:66-95` (FIRE vs DARKNESS 0.9, FIRE vs WATER 0.5, LIGHT vs DARKNESS 0.9), `game/src/domain/skills/skillDamage.js` (whole file), `damage.test.js` and `skillDamage.test.js` (call style)
**Depends on**: None
**Requirement**: BAS-08, BAS-09

**Contract**: import `DARKNESS` from `./elements`; in `calculateDamage`, before `const damage`:

```js
    //  The Cajado da Consciência Negra (spec black-awareness-staff): `darknessDamagePct` percent more against a DARKNESS defender
    const darkness = defender.element === DARKNESS ? 1 + (attacker.darknessDamagePct ?? 0) / 100 : 1;
```

and `* darkness` as the last factor of `damage`. Add `darknessDamagePct` to the comment that lists what the attacker may carry.

**Steps**:

1. Change the import and `calculateDamage`.
2. Add the test cases below. `A` = `{ element: 'FIRE', baseDamage: 10, critChance: 0, critMultiplier: 2, darknessDamagePct: 200 }`; `DARK` = `{ element: 'DARKNESS', defense: 0, critResistance: 0 }`; `random: () => 0.99`. Compare with `toBeCloseTo(<value>, 10)`.

**Tests**: unit
**Test cases**:

- `damage.test.js` `a darkness bonus of 200 deals 3 times against DARKNESS: 27`: `calculateDamage({ attacker: A, defender: DARK, random })` damage 27.
- `damage.test.js` `the same attacker without the field deals 9 against DARKNESS`: `{ ...A, darknessDamagePct: undefined }` gives 9.
- `damage.test.js` `the bonus does nothing against WATER: 5`: defender `{ element: 'WATER', defense: 0, critResistance: 0 }` gives 5.
- `damage.test.js` `the bonus does nothing against LIGHT: 9`: defender LIGHT gives 9.
- `damage.test.js` `the bonus multiplies with defense, a critical and boss damage: 40.5`: `{ ...A, bossDamage: 50 }`, defender DARKNESS defense 50, `forceCritical: true`, `boss: true` gives 10 x 0.9 x 0.5 x 2 x 1.5 x 3 = 40.5.
- `damage.test.js` `a defense of 100 still deals 0 with the bonus`: defense 100 gives 0.
- `skillDamage.test.js` `a click with the staff on DARKNESS deals 27`: `clickDamage({ attacker: A, buffs: [], debuffs: [], defender: DARK, random, boss: false })` damage 27.
- `skillDamage.test.js` `a 600 % skill hit with the staff on DARKNESS deals 162`: `hitDamage({ attacker: A, percent: 600, buffs: [], debuffs: [], defender: DARK, random, boss: false })` damage 162.
- `skillDamage.test.js` `a 150 % tick with the staff on DARKNESS deals 40.5`: `tickDamage({ attacker: A, percent: 150, buffs: [], debuffs: [], defender: DARK, boss: false })` is 40.5.
- `skillDamage.test.js` `Luz Divina with the staff deals 4.5 times on DARKNESS: 324`: `hitDamage({ attacker: { ...A, element: 'LIGHT' }, percent: 800, vsDarkness: 1.5, buffs: [], debuffs: [], defender: DARK, random, boss: false })` damage 324.
- `skillDamage.test.js` `a forced critical aimed shot with the staff is 3 times the same shot without it`: `hitDamage({ attacker: A, percent: 3000, forceCritical: true, ... })` damage equals 3 x the same call with `darknessDamagePct: undefined`: 1620 and 540 (10 x 30 x 0.9 x 2, then x 3).

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 11 cases pass; every earlier unit test passes unchanged.

**Commit**: `feat(game): triple the damage of the staff against darkness`

---

#### T13: The staff on an ally (`allyAttacker.js`) [x]

**Owner**: game-dev
**Goal**: An ally wearing the staff keeps the bonus on its hits (BAS-10).
**Where**: `game/src/domain/combat/allyAttacker.js`
**Also changes**: `game/src/domain/combat/allyAttacker.test.js`
**Read first**: `game/src/domain/combat/allyAttacker.js` (whole file), `allyAttacker.test.js:26-45` (the `toEqual` cases that must keep passing), `game/src/domain/skills/skillCombat.js:187-198` (`allyHit` uses `tickDamage` with percent 100)
**Depends on**: T11, T12
**Requirement**: BAS-10

**Contract**: the returned object of `allyAttacker` ends with `...(worn.darknessDamagePct ? { darknessDamagePct: worn.darknessDamagePct } : {})`.

**Steps**:

1. Add the spread to the returned object.
2. Add the test cases below.

**Tests**: unit
**Test cases** (`allyAttacker.test.js`; `STAFF10` = `{ id: 's', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, clickDamage: 10, affixes: [], special: 'BLACK_AWARENESS_STAFF' }`):

- `an ally of 0 stars wearing the staff carries darknessDamagePct 200 and base 22`: `allyAttacker({ ally: { stars: 0 }, pieces: [ STAFF10 ], leaderElement: 'FIRE' })` `toEqual` `{ element: 'FIRE', baseDamage: 22, critChance: 0, critMultiplier: 1, armorPierce: 0, bossDamage: 0, darknessDamagePct: 200 }`.
- `its hit on a DARKNESS monster of defense 0 is 59.4`: `tickDamage({ attacker: <that attacker>, percent: 100, buffs: [], debuffs: [], defender: { element: 'DARKNESS', defense: 0, critResistance: 0 }, boss: false })` `toBeCloseTo(59.4, 10)`.
- `an ally without the staff has no darknessDamagePct field`: `'darknessDamagePct' in allyAttacker({ ally: { stars: 0 }, pieces: [ { ...STAFF10, special: undefined } ], leaderElement: 'FIRE' })` is false.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [x] The 3 cases pass; the 4 existing `allyAttacker` cases pass unchanged.
- [x] `npm run build` exits 0.

**Commit**: `feat(game): keep the darkness bonus of the staff on an ally`

---

### Phase 5: Game wiring and views

#### T14: Gift API adapter and composition [x]

**Owner**: game-dev
**Goal**: `POST /gifts/claim` reachable from the scenes as `services.gifts` (BAS-07).
**Where**: `game/src/adapters/http/giftApi.js` (new)
**Also changes**: `game/src/adapters/http/giftApi.test.js` (new), `game/src/composition.js`
**Read first**: `game/src/adapters/http/accountResetApi.js` and `accountResetApi.test.js` (pattern), `game/src/composition.js` (whole file)
**Depends on**: None
**Requirement**: BAS-07

**Contract**:

```js
//  Wraps the backend GiftController (/gifts). The call carries the Bearer token through httpClient.
//  claim() -> { granted: true, gift: 'BLACK_AWARENESS_STAFF', piece } or { granted: false } (spec black-awareness-staff).
//  A failure rejects with an ApiError.
export const createGiftApi = (httpClient) => ({
    claim: async () => (await httpClient.post('/gifts/claim')).data
});
```

`composition.js`: `import { createGiftApi } from './adapters/http/giftApi';`, `export const giftApi = createGiftApi(httpClient);` after `healthApi`, and `gifts: giftApi,` in `services` after `backend: healthApi,`.

**Steps**:

1. Create `giftApi.js`.
2. Wire it in `composition.js`.
3. Create `giftApi.test.js` with the cases below, mocking `httpClient` like `accountResetApi.test.js`.

**Tests**: unit
**Test cases**:

- `claim posts to /gifts/claim with no body and resolves the answer`: `post` called once with `'/gifts/claim'` as the only argument; resolves `{ granted: true, gift: 'BLACK_AWARENESS_STAFF', piece: { id: 's' } }` when `post` resolves `{ data: <that> }`.
- `claim rejects when the request fails`: `post` rejects `new Error('offline')`, `claim()` rejects with it.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 2 cases pass; the hexagonal import test still passes.

**Commit**: `feat(game): add the gift claim api`

---

#### T15: Gift claim service (`giftClaim.js`) [x]

**Owner**: game-dev
**Goal**: Claim once, add a granted piece to the equipment list, never throw (BAS-07, spec D15).
**Where**: `game/src/application/gifts/giftClaim.js` (new)
**Also changes**: `game/src/application/gifts/giftClaim.test.js` (new)
**Read first**: `game/src/application/equipment/equipmentCollection.js:1-10` (port comment style) and `:158-175` (`applyDrop`)
**Depends on**: None
**Requirement**: BAS-07

**Contract** (whole file):

```js
//  Claims the event gift when the battle starts (spec black-awareness-staff). Ports (ADR 0007):
//    gateway    { claim() }  POST /gifts/claim; resolves { granted, gift?, piece? }, rejects with an ApiError
//    equipment  { applyDrop({ piece, sold }) }  the equipment collection of the scene
//    onGift(piece)  shows the notice
//  Resolves the granted piece, or null when nothing was granted or the call failed: a failure is never thrown, the battle plays on (D15).
export const claimGift = async ({ gateway, equipment, onGift }) =>
{
    let answer;

    try
    {
        answer = await gateway.claim();
    }
    catch
    {
        return null;
    }

    if (!answer?.granted || !answer.piece)
    {
        return null;
    }

    equipment.applyDrop({ piece: answer.piece, sold: false });
    onGift(answer.piece);

    return answer.piece;
};
```

**Steps**:

1. Create the file.
2. Create the test file with the cases below (`vi.fn()` for `claim`, `applyDrop`, `onGift`).

**Tests**: unit
**Test cases** (`describe('claimGift')`, `STAFF` = `{ id: 's', special: 'BLACK_AWARENESS_STAFF' }`):

- `a granted gift joins the equipment list, calls onGift once and resolves the piece`: `applyDrop` called once with `{ piece: STAFF, sold: false }`, `onGift` once with `STAFF`, resolves `STAFF`.
- `granted false adds nothing, calls no notice and resolves null`.
- `granted true without a piece adds nothing and resolves null`.
- `a failing claim resolves null and adds nothing`: `claim` rejects `new Error('offline')`.
- `one call claims exactly once`: `claim` called 1 time.

**Gate**: `cd game && npm test`
**Done when**:

- [x] The 5 cases pass.

**Commit**: `feat(game): claim the event gift and add it to the equipment`

---

#### T16: Staff tile icon and style [ ]

**Owner**: game-dev
**Goal**: The staff tile shows its art and carries `data-special` (BAS-13, BAS-17, spec D12).
**Where**: `game/src/adapters/phaser/views/pieceTile.js`
**Also changes**: `game/src/adapters/phaser/views/pieceTile.test.js`, `game/public/style.css`, `game/public/assets/staff_black_awares_day.png` (commit the untracked file as it is)
**Read first**: `game/src/adapters/phaser/views/pieceTile.js` (whole file), `pieceTile.test.js` (`shows the icon of the slot of the piece`), `game/src/adapters/phaser/views/dom.js:34-59` (`iconWithFallback(name, glyph, className, fallbackName)`), `game/public/style.css:2537-2560` (`.piece-tile`, `.piece-tile .icon`) and `:2664-2675` (legendary frame)
**Depends on**: T10
**Requirement**: BAS-13, BAS-17

**Contract**:

- `renderPieceTile`: `const special = specialOf(piece);` (import from `../../../domain/equipment/specials`). When `special` is set: `tile.setAttribute('data-special', piece.special)` and the icon is `iconWithFallback(special.icon, SLOT_GLYPHS[piece.slot], 'piece-icon piece-icon-special', slotIconName(piece.slot))`; otherwise the current icon. The `aria-label` already reads `pieceTitle(piece)` (T11).
- `style.css`, after the `.piece-tile .icon` rule:

```css
/*  The Cajado da Consciência Negra (spec black-awareness-staff): its art, black background included, fills the tile as a rounded square
    inside the gold legendary frame */
.piece-tile[data-special] .icon {
    width: 52px;
    height: 52px;
    overflow: hidden;
    border-radius: 10px;
}

.piece-tile[data-special] .icon-image {
    object-fit: cover;
}
```

**Steps**:

1. Change `renderPieceTile`.
2. Add the CSS.
3. Add the test cases below.
4. `git add game/public/assets/staff_black_awares_day.png` with the task files.

**Tests**: unit
**Test cases** (`pieceTile.test.js`; `STAFF` as in T11):

- `the staff tile shows the staff art and carries its special`: `img.icon-image` `src` ends with `assets/staff_black_awares_day.png`; tile `data-special` `BLACK_AWARENESS_STAFF`, `data-rarity` `LEGENDARY`, `data-gems` `'4'`; the icon wrapper has class `piece-icon-special`; `aria-label` `Cajado da Consciência Negra +0`.
- `a staff at +3 shows +3 and its name with +3`: `.piece-refine` text `+3`, `aria-label` `Cajado da Consciência Negra +3`.
- `a staff whose art is missing falls back to the weapon icon`: dispatch `new Event('error')` on the image; its `src` ends with `assets/slot-weapon.png`.
- `a piece with an unknown special shows the slot icon and no data-special`: `{ ...STAFF, special: 'FROST_RUNE' }`: `src` ends with `assets/slot-weapon.png`, `hasAttribute('data-special')` false, `aria-label` `Lendário Arma +0`.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 4 cases pass; every earlier `pieceTile` and `dragEquip` unit test passes unchanged.
- [ ] `game/public/assets/staff_black_awares_day.png` is in the commit.

**Commit**: `feat(game): show the staff art on its tile`

---

#### T17: Gift notice in `HeroUi` [ ]

**Owner**: game-dev
**Goal**: `showGift()` shows the gift notice for 6000 ms and lights the Equipamento dot (BAS-07, spec P1 Receive AC 10).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js:27` (`NOTICE_MS`), `:1166-1176` (`showEquipmentDrop`), `:1200-1212` (`showNotice`); `HeroUi.test.js:60-92` (`createUi`, `timers`), `:1622-1670` (`describe('HeroUi equipment badge')`)
**Depends on**: T10
**Requirement**: BAS-07

**Contract**:

```js
    //  "Presente do Dia da Consciência Negra: ..." for 6 s (spec black-awareness-staff D9), in the place of the drop notices; the red dot of
    //  Equipamento turns on unless Equipamento is open
    showGift ()
    {
        this.equipmentBadge.hidden = this.open && this.screen === 'equipment';
        this.showNotice(GIFT_NOTICE, GIFT_NOTICE_MS);
    }
```

`showNotice (text, ms = NOTICE_MS)` passes `ms` to `delayedCall`. Import `GIFT_NOTICE`, `GIFT_NOTICE_MS` from `../../domain/equipment/specials`.

**Steps**:

1. Add the `ms` parameter to `showNotice`.
2. Add `showGift` after `showEquipmentDrop`.
3. Add a `describe('HeroUi gift notice')` with the cases below.

**Tests**: unit
**Test cases**:

- `showGift shows the gift text for 6000 ms and lights the Equipamento dot`: after `ctx.ui.showGift()`, `testid('card-notice').textContent` is `'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!'`, `hidden` false, `ctx.timers.at(-1).delay` 6000, `testid('equipment-badge').hidden` false; after `ctx.timers.at(-1).callback()` the notice is hidden.
- `showGift while Equipamento is open leaves the dot off`: `await open(ctx, 'equipment')` first; `equipment-badge` hidden.
- `a dropped piece notice still lasts 3000 ms`: `ctx.ui.showEquipmentDrop({ piece: piece(), sold: false })`, `ctx.timers.at(-1).delay` 3000.

**Gate**: `cd game && npm test`
**Done when**:

- [ ] The 3 cases pass; every earlier `HeroUi` case passes unchanged.

**Commit**: `feat(game): show the black awareness gift notice`

---

#### T18: Claim the gift when the battle starts (`ClickerGame`) [ ]

**Owner**: game-dev
**Goal**: Every battle start claims once; a granted staff joins the list and shows the notice (BAS-07, spec P1 Receive AC 9 to 11).
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Also changes**: `game/src/adapters/phaser/ClickerGame.test.js`
**Read first**: `ClickerGame.js:150-176` (`services`), `:574-596` (`createHeroUi`), `:666-676` (`loadEquipment`); `ClickerGame.test.js:30-46` (`services` mock) and `:92-130` (`createScene` options and mock resets)
**Depends on**: T14, T15, T17
**Requirement**: BAS-07

**Contract**:

- `import { claimGift as claimEventGift } from '../../application/gifts/giftClaim';`
- In `create`, next to the other `services` reads: `this.gifts = services.gifts;`.
- In `createHeroUi`, after `this.loadTalents();`: `this.claimGift();`.
- New method after `loadTalents`:

```js
    //  The event gift (spec black-awareness-staff): claimed once per battle start; a granted staff joins the list and shows the notice.
    //  A failure shows nothing (the next start claims again).
    claimGift ()
    {
        return claimEventGift({ gateway: this.gifts, equipment: this.equipment, onGift: () => this.heroUi.showGift() });
    }
```

**Steps**:

1. Add the import, the `this.gifts` line, the call and the method.
2. In `ClickerGame.test.js`: add `const giftGateway = { claim: vi.fn() };`, `gifts: giftGateway` in `services`, a `gift = { granted: false }` option of `createScene` that resets the mock and makes `claim` resolve `gift` (or reject when it is an `Error`).
3. Add the test cases below.

**Tests**: unit
**Test cases** (`describe('ClickerGame gift')`):

- `the battle start claims the gift exactly once`: `createScene()`; after a flush `giftGateway.claim` was called 1 time.
- `a granted staff shows the gift notice`: `createScene({ gift: { granted: true, gift: 'BLACK_AWARENESS_STAFF', piece: <STAFF of T11> } })`; after a flush `scene.heroUi.notice.textContent` is the gift text and `scene.heroUi.notice.hidden` false.
- `granted false shows no notice`: `scene.heroUi.notice.hidden` true.
- `a failing claim shows no notice and a click still hits`: `gift: new Error('offline')`; notice hidden; one click (the existing click helper of the file) lowers the monster health as in the existing click case.

**Gate**: `cd game && npm test && npm run build`
**Done when**:

- [ ] The 4 cases pass; every earlier `ClickerGame` case passes unchanged.
- [ ] `npm run build` exits 0.

**Commit**: `feat(game): claim the black awareness gift when the battle starts`

---

### Phase 6: e2e and author check

#### T19: Fake backend: `special`, gifts and the claim route [ ]

**Owner**: test-engineer
**Goal**: The e2e fake answers `special` and `POST /gifts/claim` like `GiftController` (BAS-07, BAS-13).
**Where**: `game/e2e/support/fakeBackend.js`
**Also changes**: none
**Read first**: `fakeBackend.js:186-197` (`pieceView`), `:250-255` (`mockBackend` options), `:318-337` (`equipmentOf`, `awardEquipment`), `:600-610` (`authenticated`), `:940-950` (how `now` is read before `calls.push`), `:1040-1080` (routes and the returned object; `/api/health` is routed outside `calls`)
**Depends on**: None
**Requirement**: BAS-07, BAS-13

**Contract**:

1. `pieceView` adds `...(piece.special && { special: piece.special })`.
2. Exported constant:

```js
//  The staff GiftController answers at chance 0.5 (spec black-awareness-staff P1 Receive AC 2)
export const GIFT_STAFF = Object.freeze({
    id: 'gift-staff', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, baseClick: 11, heroId: null, special: 'BLACK_AWARENESS_STAFF',
    affixes: [ { type: 'BOSS_DAMAGE_PCT', base: 28 }, { type: 'BOSS_TIME_SECONDS', base: 6 }, { type: 'CRIT_DAMAGE_PCT', base: 55 }, { type: 'ARMOR_PIERCE_PCT', base: 28 } ]
});
```

3. `mockBackend` option `gifts: startingGifts = {}`: `{ [username]: true }` grants `GIFT_STAFF` on the first claim of that user (a copy with fresh `affixes`, pushed into `equipmentOf(username)`), `{ [username]: 'fail' }` answers 500 `problem(500, 'Gift failed')` on every claim, absent answers `{ granted: false }`. A user granted once answers `{ granted: false }` after.
4. Route registered with the others, outside `calls` (like `/api/health`) so no existing call list changes:

```js
    await page.route('**/api/gifts/**', async (route) => { ... });
```

It reads the user with `authenticated(route, <now as the main handler reads it>)`, records the username in `giftCalls`, answers `POST /gifts/claim` as in 3 and 404 for any other method or path.
5. The returned object gains `giftCalls: () => [ ...giftCalls ]`.

**Steps**: apply 1 to 5 in order.

**Tests**: e2e (exercised by T20 and T21; the fake is test support, not product code)
**Gate**: `cd game && npx playwright test e2e/equipment.spec.js e2e/equipmentUi.spec.js e2e/drops.spec.js`
**Done when**:

- [ ] The three existing specs pass unchanged (no existing call list or piece body changed for pieces without `special`).

**Commit**: `test(game): answer the gift claim and the piece special in the e2e fake backend`

---

#### T20: e2e: gift, notice and staff views [ ]

**Owner**: test-engineer
**Goal**: Every player-visible AC of P1 Receive (game side) and P1 See in the browser (BAS-07, BAS-13 to BAS-17).
**Where**: `game/e2e/blackAwarenessStaff.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/equipmentUi.spec.js:1-60` (`startGame`, `openEquipment`), `game/e2e/session.spec.js` (how a stored session restarts the battle after `page.reload()`), `game/src/adapters/phaser/views/equipmentView.js:250-330` (detail test ids: `piece-detail`, `piece-line-<n>`, refine, reroll and sell buttons), `game/e2e/bulkSell.spec.js` (sale flow and wallet text)
**Depends on**: T19
**Requirement**: BAS-07, BAS-13, BAS-14, BAS-15, BAS-16, BAS-17

**Tests**: e2e
**Test cases** (`test.describe('Black awareness staff')`; `GIFT` = `'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!'`; `LINES` = `['Dano de clique: 11.0', 'Dano em chefes +28%', 'Tempo extra de chefe +6s', 'Dano crítico +55%', 'Perfuração de armadura +28%', 'Especial: +200% de dano contra Escuridão']`):

1. `a player entering on the gift day sees the gift notice and finds the staff in the bag`: `gifts: { yan: true }`; after the battle starts `card-notice` has text `GIFT`, `equipment-badge` is visible, `backend.giftCalls()` equals `['yan']`; open Equipamento: `equip-piece-gift-staff` is visible with `data-special` `BLACK_AWARENESS_STAFF`.
2. `the gift notice is still up after 3.5 s and gone by 7 s`: `gifts: { yan: true }`; notice visible; `page.waitForTimeout(3500)`; still visible with `GIFT`; then `toBeHidden({ timeout: 4000 })`.
3. `a second start the same day shows no gift notice and one staff`: `gifts: { yan: true }`; start, then `page.reload()` and start the battle again with the stored session; `giftCalls()` equals `['yan', 'yan']`; `card-notice` never shows `GIFT` (it is hidden or has another text); Equipamento lists exactly 1 tile with `[data-special]`.
4. `a player without the gift sees no gift notice`: no `gifts` option; `giftCalls()` equals `['yan']`; after the equipment loads `card-notice` is hidden.
5. `a failing claim shows no notice and the battle keeps running`: `gifts: { yan: 'fail' }`; `card-notice` hidden; one canvas click lowers the monster health below its start value.
6. `the staff tile shows its art, the gold frame and its name`: `equipment: { yan: [ GIFT_STAFF ] }`; tile `equip-piece-gift-staff` has `data-rarity` `LEGENDARY`, `data-gems` `4`, `aria-label` `Cajado da Consciência Negra +0`; its `img` `src` contains `staff_black_awares_day.png` and `naturalWidth` 2048; its `.icon` `toHaveCSS('width', '52px')`, `toHaveCSS('height', '52px')`, `toHaveCSS('border-radius', '10px')`.
7. `the tooltip shows the name and the special line last`: hover the tile; `piece-tooltip` `.piece-tooltip-title` `Cajado da Consciência Negra +0`; `.piece-tooltip-line` texts equal `LINES`.
8. `the detail shows the same lines and keeps the special after a refine`: `wallets: { yan: 10000 }`; click the tile; `piece-line-0` to `piece-line-5` equal `LINES`; refine once; title `Cajado da Consciência Negra +1`, `piece-line-0` `Dano de clique: 12.1`, `piece-line-5` `Especial: +200% de dano contra Escuridão`.
9. `rerolling an affix keeps the special and offers only the four affixes`: staff at refine 5, `wallets: { yan: 10000 }`; the detail shows exactly 4 reroll buttons; reroll affix 0; `piece-line-5` still reads the special line.
10. `selling the staff pays 500 copper and removes it`: sell it from the detail (with the confirmation the screen asks for); the tile is gone and the wallet shows 500 copper more (`5 prata`).
11. `a piece with an unknown special shows as a plain legendary weapon`: `{ ...GIFT_STAFF, special: 'FROST_RUNE' }`; `aria-label` `Lendário Arma +0`, `img` `src` contains `slot-weapon.png`, no `data-special`, tooltip has 5 lines and none starts with `Especial`.

**Gate**: `cd game && npx playwright test e2e/blackAwarenessStaff.spec.js`
**Done when**:

- [ ] The 11 tests pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover the black awareness gift and the staff views in the browser`

---

#### T21: e2e: damage of the staff [ ]

**Owner**: test-engineer
**Goal**: The x3 against DARKNESS on the real scene, one test per strike kind (BAS-08, BAS-09, BAS-11, BAS-12; L-098).
**Where**: `game/e2e/blackAwarenessStaffDamage.spec.js` (new)
**Also changes**: none
**Read first**: `game/e2e/unifiedDamage.spec.js:1-80` (`startAs`, `scene`, `health`, `strikeNow`, `advance`), `game/e2e/skillsAll.spec.js:59-71` (`dealtAfter`) and `:120-135` (Tiro Preciso), `game/e2e/autoClick.spec.js` (how the auto click is unlocked and stepped)
**Depends on**: T19
**Requirement**: BAS-08, BAS-09, BAS-11, BAS-12

**Setup**: copy `startAs` from `unifiedDamage.spec.js` and add an `equipment` option passed to `mockBackend`. Leader Vex at 3 stars (`copies: { 'vex:3': 1 }`): base damage (1 + 10) x 1.4 = 15.4, critical chance 10 + 30 + 9 = 49 so the roll 0.99 never crits. `STAFF_ON` = `{ id: 'staff', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, baseClick: 10, heroId: 'vex', special: 'BLACK_AWARENESS_STAFF', affixes: [ { type: 'CRIT_CHANCE', base: 9 }, { type: 'BOSS_DAMAGE_PCT', base: 25 }, { type: 'BOSS_TIME_SECONDS', base: 5 }, { type: 'ARMOR_PIERCE_PCT', base: 25 } ] }`; `PLAIN_ON` = the same without `special`. Monster `{ element: 'DARKNESS', defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance: 0 }`, health 1000, encounter `PHASE`. Before any strike wait for `expect.poll(() => scene(page, '(s) => s.leaderAttacker().darknessDamagePct ?? 0'))` to be 200 (staff) or 0 (plain).

**Tests**: e2e
**Test cases** (`toBeCloseTo(<value>, 5)`):

1. `one click on a DARKNESS monster deals 46.2 with the staff`: `strikeNow` gives 46.2.
2. `the same click with a plain legendary weapon deals 15.4`: `PLAIN_ON`; 15.4.
3. `a staff in the bag gives nothing`: `PLAIN_ON` worn plus `{ ...STAFF_ON, id: 'bag-staff', heroId: null }`; 15.4.
4. `against a FIRE monster the staff changes nothing: 27.72`: `STAFF_ON`, monster element `FIRE`; 15.4 x 1.8 = 27.72.
5. `Golpe Sangrento deals 277.2 at once and bleeds 69.3 a second`: `dealtAfter(page, 3, [ 1000 ])` gives `[277.2, 346.5]`.
6. `the auto click deals 3 times with the staff what it deals with a plain weapon`: set up the auto click as `autoClick.spec.js` does; one auto click with `STAFF_ON` deals 3 x the damage of one auto click in a second page session with `PLAIN_ON` (expected 46.2 and 15.4 when no other bonus applies; assert the ratio 3 and the staff value).
7. `the aimed shot deals 3 times with the staff what it deals with a plain weapon`: leader Lyra at 3 stars with the weapon on `lyra`; Tiro Preciso (`use(page, 2)`, `advance(page, 2100)`) with the staff deals 3 x the same shot with the plain weapon (two page sessions); assert the ratio 3.

**Gate**: `cd game && npx playwright test e2e/blackAwarenessStaffDamage.spec.js`
**Done when**:

- [ ] The 7 tests pass twice in a row with `--workers=1`.

**Commit**: `test(game): cover the darkness bonus of the staff in the browser`

---

#### T22: Author check and mutants [ ]

**Owner**: test-engineer
**Goal**: The feature's test gate (`.claude/agents/test-engineer.md` § Author check): every AC value pinned, mutants killed (BAS-01 to BAS-17).
**Where**: `.specs/features/black-awareness-staff/tasks.md` (this file: the AC table below T22 and the ticks)
**Also changes**: test files only, when a gap or a survivor needs a test
**Read first**: `.claude/agents/test-engineer.md` § Author check, `scripts/sensor.mjs:1-25` (mutants format)
**Depends on**: T20, T21
**Requirement**: BAS-01 to BAS-17

**Steps**:

1. Write the AC to assertion table (spec AC, test `file:line`, exact value) under this task.
2. Run `cd backend && ./gradlew test` and `cd game && npm test` once each (never at the same time).
3. Run these mutants with `node scripts/sensor.mjs <scratchpad>/mutants.json` from the repo root, each with the narrowest command:
   - M1 `game/src/domain/combat/damage.js`: `defender.element === DARKNESS ?` → `true ?` (run `npx vitest run src/domain/combat/damage.test.js`, cwd `game`).
   - M2 `damage.js`: `1 + (attacker.darknessDamagePct ?? 0) / 100` → `(attacker.darknessDamagePct ?? 100) / 100`.
   - M3 `game/src/domain/combat/allyAttacker.js`: remove the `darknessDamagePct` spread (`allyAttacker.test.js`).
   - M4 `game/src/adapters/phaser/HeroUi.js`: `this.showNotice(GIFT_NOTICE, GIFT_NOTICE_MS)` → `this.showNotice(GIFT_NOTICE)` (`HeroUi.test.js`).
   - M5 `B/adapter/config/SaoPauloGiftCalendar.kt`: `ZoneId.of("America/Sao_Paulo")` → `ZoneId.of("UTC")` (`./gradlew test --tests 'SaoPauloGiftCalendarTest'`, cwd `backend`).
   - M6 `B/service/GiftService.kt`: the `exists` check returns false (`--tests 'GiftServiceTest'`).
   - M7 `game/public/style.css`: `width: 52px;` of `.piece-tile[data-special] .icon` → `width: 40px;` (`npx playwright test e2e/blackAwarenessStaff.spec.js`).
4. Every survivor gets a test; rerun until 0 survive.

**Tests**: unit, integration and e2e (the gate of the feature)
**Gate**: `node scripts/sensor.mjs <scratchpad>/mutants.json` exits 0
**Done when**:

- [ ] Every AC of the spec has a row with `file:line` and the spec value; 0 gaps.
- [ ] 7 of 7 mutants killed; `git status --porcelain` is as before the run.

**Commit**: `test(game): record the black awareness staff author check`

---

### Phase 7: UI review

#### T23: UI review of the staff [ ]

**Owner**: ui-artist
**Goal**: The player-visible changes match the spec and the Grove theme (AD-022) (BAS-07, BAS-13, BAS-14).
**Where**: `.specs/features/black-awareness-staff/ui-review.html` (new, from the ui-review template)
**Also changes**: `game/ui-review/blackAwarenessStaff.shots.js` (new), `.specs/features/black-awareness-staff/ui-review/*.png`
**Read first**: `game/ui-review/gameVersion.shots.js` (shots pattern), `.claude/templates/ui-review.html`, spec P1 See and D9, D10, D12
**Depends on**: T22
**Requirement**: BAS-07, BAS-13, BAS-14

**What to check** (desktop 1280x720 and phone 390x844):

1. Battle start on the gift day: the notice `Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!` fits the notice box on one or two lines with no clipping; the red dot on Equipamento.
2. Equipamento with the staff in the bag next to a plain legendary weapon: the staff tile is 60x60 with the gold legendary frame (`#d9a521`) and 4 gems; the art fills 52x52 with 10 px corners; the black square reads as a deliberate frame, not as a missing image.
3. The staff worn by the leader (the Equipamento slot cell).
4. The tooltip and the detail: title `Cajado da Consciência Negra +0`, the special line last and legible on parchment.
5. The tile while dragged (drag copy) still shows the art.

**Tests**: none (review artifact; the e2e of T20 pins the values)
**Gate**: `cd game && npm run ui:shots -- blackAwarenessStaff`
**Done when**:

- [ ] `ui-review.html` has a verdict (APROVADO or REPROVADO) and every finding is listed for the product owner to turn into tasks.

**Commit**: `docs(ui): review the black awareness staff`

---

## Validation Tables

### Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 enum + 1 field in one file | ✅ Granular |
| T2 | 1 function | ✅ Granular |
| T3 | 1 new domain file | ✅ Granular |
| T4 | 1 migration + the entity column it needs | ⚠️ Cohesive (the entity cannot validate without the column) |
| T5 | 1 response field | ✅ Granular |
| T6 | 1 port file + its adapter | ⚠️ Cohesive (the adapter is the only implementation) |
| T7 | 1 repository adapter | ✅ Granular |
| T8 | 1 service + its use case interface | ✅ Granular |
| T9 | 1 endpoint (+ its test configuration) | ✅ Granular |
| T10 | 1 new domain file | ✅ Granular |
| T11 | 3 functions in one file | ⚠️ Cohesive (same file, same lookup) |
| T12 | 1 function | ✅ Granular |
| T13 | 1 function | ✅ Granular |
| T14 | 1 adapter + its composition line | ✅ Granular |
| T15 | 1 function | ✅ Granular |
| T16 | 1 view + its CSS rule | ✅ Granular |
| T17 | 1 method | ✅ Granular |
| T18 | 1 method + 1 call | ✅ Granular |
| T19 | 1 test support file | ✅ Granular |
| T20 | 1 spec file | ✅ Granular |
| T21 | 1 spec file | ✅ Granular |
| T22 | author check | ✅ Granular |
| T23 | 1 review | ✅ Granular |

### Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T1 (phase 1) | phase start | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T3 (phase 1) | phase start | ✅ Match |
| T7 | T4, T6 | T4 → T7, T6 → T7 | ✅ Match |
| T8 | T2, T7 (earlier phases) | phase start | ✅ Match |
| T9 | T8, T5 (T5 earlier phase) | T8 → T9 | ✅ Match |
| T10 | None | none | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | None | none | ✅ Match |
| T13 | T11, T12 | T11 → T13, T12 → T13 | ✅ Match |
| T14 | None | none | ✅ Match |
| T15 | None | none | ✅ Match |
| T16 | T10 (phase 4) | none in phase | ✅ Match |
| T17 | T10 (phase 4) | none in phase | ✅ Match |
| T18 | T14, T15, T17 | T14 → T18, T15 → T18, T17 → T18 | ✅ Match |
| T19 | None | none | ✅ Match |
| T20 | T19 | T19 → T20 | ✅ Match |
| T21 | T19 | T19 → T21 | ✅ Match |
| T22 | T20, T21 | T20 → T22, T21 → T22 | ✅ Match |
| T23 | T22 (phase 6) | none in phase | ✅ Match |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1, T2, T3 | Backend domain | unit | unit | ✅ OK |
| T4 | Migration + entity | integration | integration | ✅ OK |
| T5 | Backend web | integration | integration | ✅ OK |
| T6 | Backend adapter | unit | unit | ✅ OK |
| T7 | Backend persistence | integration | integration | ✅ OK |
| T8 | Backend service | unit | unit | ✅ OK |
| T9 | Backend web | integration | integration | ✅ OK |
| T10 to T13 | Game domain | unit | unit | ✅ OK |
| T14, T15 | Game http + application | unit | unit | ✅ OK |
| T16, T17, T18 | Game views and scenes | unit + e2e | unit (e2e in T20, T21 by the `test-engineer`, per the owner's split of roles) | ✅ OK (owner rule) |
| T19 | e2e support | e2e | e2e | ✅ OK |
| T20, T21 | e2e | e2e | e2e | ✅ OK |
| T22 | all | gate | unit, integration, e2e | ✅ OK |
| T23 | Review artifact | none | none | ✅ OK |
