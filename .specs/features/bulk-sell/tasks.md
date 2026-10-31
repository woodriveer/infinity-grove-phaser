# Bulk Sell Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/bulk-sell/spec.md`
**Design**: `.specs/features/bulk-sell/design.md`
**Status**: Draft (waits for the user's approval of the spec defaults D1 to D12)

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root `D:/Developer/infinity-grove`. `<pkg>` means `br/com/woodriver/infinity_grove_ws` and `<kt>` means the package `br.com.woodriver.infinity_grove_ws`.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`PROMPTS_ASSETS_UI.md`, `game/src/adapters/phaser/ClickerGame.js`, `ClickerGame.test.js`, `Preloader.js`, `views/dom.js`, `views/pieceTile.test.js`, `views/talentsView.js`, `views/talentsView.test.js`, `game/src/domain/talents/*`, `game/e2e/farm.spec.js`, `game/e2e/talents.spec.js`, `art/`, `game/public/assets/*.png`). No task edits any of them.
- Mark the task `[x]` in this file in the same commit, and set the task's requirement rows in `spec.md` to `Implementing`.
- Push right after the commit (`CLAUDE.md`).
- Never delete or weaken an existing test. If a test in one of the owner's uncommitted files fails, do not edit it: report it in the task summary as "not caused by this task".
- Player-facing text is Portuguese and must match the spec character for character (`·` is U+00B7, `✓` is U+2713, `é`/`ç`/`ã` with their accents).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e per player-visible behaviour), `backend/build.gradle.kts` (JUnit 5 + Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), skill `kotlin-backend-ddd` (service/domain unit tests, loggers in service/domain classes); no coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`SellBatch`, `PlayerEquipment`, exceptions) | unit | Every branch; every bound of BSL-05 (0, 1, 100, 101, repeat) | `backend/src/test/kotlin/<pkg>/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service (`EquipmentService.sellAll`) | unit (in-memory fakes) | BSL-01 to BSL-05 and BSL-08 with the spec numbers; wallet and repository state asserted after each refusal | `backend/src/test/kotlin/<pkg>/service/EquipmentServiceTest.kt` | `cd backend && ./gradlew test` |
| Backend web (`EquipmentController.sellAll`) | integration (Testcontainers) | Happy path, 400 (both kinds), 401, 404, the race of BSL-08, the single sale route of BSL-09 | `backend/src/test/kotlin/<pkg>/adapter/web/*IT.kt` | `cd backend && ./gradlew test` |
| Game HTTP adapter | unit | Path, body and answer of `sellMany`; refusal reaches the caller | `game/src/adapters/http/equipmentApi.test.js` | `cd game && npm test` |
| Game application (`equipmentCollection`) | unit | Success, failure with reload, failure of the reload | `game/src/application/equipment/equipmentCollection.test.js` | `cd game && npm test` |
| Game domain (`bulkSell.js`) | unit | Every function with the exact strings and totals of the spec | `game/src/domain/equipment/bulkSell.test.js` | `cd game && npm test` |
| Game views (`bulkSellView.js`, `equipmentView.js`) | unit (jsdom) | Every label, test id, attribute and enabled/disabled state the spec names | `game/src/adapters/phaser/views/*.test.js` | `cd game && npm test` |
| Game `HeroUi` | unit (jsdom) | Every transition of the selection state machine, busy, failure, close guard, drop during selection | `game/src/adapters/phaser/HeroUi.test.js` | `cd game && npm test` |
| Stylesheet | none | Build gate; checked by the `ui-artist` review against the design table | `game/public/style.css` | `cd game && npm run build` |
| e2e | e2e (Playwright, fake backend) | Every player-visible criterion BSL-10 to BSL-30 and the screen edge cases | `game/e2e/bulkSell.spec.js` | `cd game && npx playwright test e2e/bulkSell.spec.js` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | backend: `cd backend && ./gradlew test --tests '<pattern of the task>'`; game: `cd game && npm test` |
| Full | After tasks with integration or e2e tests | backend: `cd backend && ./gradlew build` (tests + ktlint); game: `cd game && npm test && npx playwright test e2e/bulkSell.spec.js e2e/equipment.spec.js e2e/equipmentUi.spec.js` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order.

### Phase 1: Backend batch sale

```
T1 → T3
T2 → T3
T3 → T4
```

### Phase 2: Game data and rules

```
T5 → T6
T7
```

### Phase 3: Game screen

```
T7 → T8 → T9 → T10
T7 → T9
T6 → T10
T9 → T11
```

### Phase 4: e2e

```
T10 → T12
T11 → T12
```

---

## Task Breakdown

### T1: SellBatch value and its exception [x]

**Owner**: kotlin-backend-dev
**Goal**: A domain value that accepts 1 to 100 distinct piece ids and refuses anything else with `INVALID_SELL_BATCH` (BSL-05).
**Where**: `backend/src/main/kotlin/<pkg>/domain/SellBatch.kt` (new)
**Also changes**: `backend/src/main/kotlin/<pkg>/domain/EquipmentExceptions.kt`, `backend/src/test/kotlin/<pkg>/domain/SellBatchTest.kt` (new), `backend/src/test/kotlin/<pkg>/domain/EquipmentExceptionsTest.kt`
**Read first**: `domain/EquipmentExceptions.kt:1-35`, `domain/PlayerEquipment.kt:1-25,73-76` (logger pattern), `test/.../domain/EquipmentExceptionsTest.kt:1-23`
**Depends on**: None
**Requirement**: BSL-05

**Tools**: Skill `kotlin-backend-ddd`

**Contract**:

```kotlin
// EquipmentExceptions.kt, after InvalidAffixException
class InvalidSellBatchException(
    reason: String,
) : EquipmentRequestException("INVALID_SELL_BATCH", reason)

// SellBatch.kt
package <kt>.domain

import org.slf4j.LoggerFactory

/** The ids of one batch sale: 1 to [MAX_SIZE] distinct piece ids, in the order the player sent them. */
data class SellBatch(
    val pieceIds: List<String>,
) {
    init {
        if (pieceIds.isEmpty()) reject("A sale needs at least one piece")
        if (pieceIds.size > MAX_SIZE) reject("A sale holds at most $MAX_SIZE pieces, got ${pieceIds.size}")
        if (pieceIds.toSet().size != pieceIds.size) reject("A sale must not list a piece twice")
    }

    private fun reject(reason: String): Nothing {
        logger.warn("Sell batch rejected size={} reason={}", pieceIds.size, reason)
        throw InvalidSellBatchException(reason)
    }

    companion object {
        const val MAX_SIZE = 100
        private val logger = LoggerFactory.getLogger(SellBatch::class.java)
    }
}
```

`InvalidSellBatchException` extends `EquipmentRequestException`, which `ApiExceptionHandler.equipmentRequest` (`adapter/web/ApiExceptionHandler.kt:70-71`) already maps to 400 with `code`. Do not touch the handler.

**Steps**:

1. Add `InvalidSellBatchException` to `EquipmentExceptions.kt` right after `InvalidAffixException`.
2. Create `SellBatch.kt` with the contract above.
3. Create `SellBatchTest.kt` with the four cases below.
4. Add the case below to `EquipmentExceptionsTest.kt`.

**Tests**: unit
**Test cases**:

- `SellBatchTest` - `a batch keeps 1 to 100 distinct ids in the order given`: `SellBatch(listOf("b", "a")).pieceIds == listOf("b", "a")`; `SellBatch((1..100).map { "p$it" }).pieceIds.size == 100`; `SellBatch(listOf("x")).pieceIds == listOf("x")`.
- `SellBatchTest` - `an empty batch is refused with INVALID_SELL_BATCH`: `assertFailsWith<InvalidSellBatchException> { SellBatch(emptyList()) }.code == "INVALID_SELL_BATCH"`.
- `SellBatchTest` - `a batch of 101 ids is refused`: `assertFailsWith<InvalidSellBatchException> { SellBatch((1..101).map { "p$it" }) }`.
- `SellBatchTest` - `a batch that lists a piece twice is refused`: `assertFailsWith<InvalidSellBatchException> { SellBatch(listOf("a", "b", "a")) }`.
- `EquipmentExceptionsTest` - `a bad sell batch is a request error with its own code`: `val e = InvalidSellBatchException("x")`; `assertIs<EquipmentRequestException>(e)`; `assertEquals("INVALID_SELL_BATCH", e.code)`.

**Gate**: quick - `cd backend && ./gradlew test --tests '*SellBatchTest' --tests '*EquipmentExceptionsTest'`
**Done when**:

- [x] The 5 test cases pass; `EquipmentExceptionsTest` keeps its 3 earlier cases.
- [x] `cd backend && ./gradlew ktlintCheck` passes.

**Commit**: `feat(backend): add the sell batch value`

---

### T2: PlayerEquipment.removeAll [x]

**Owner**: kotlin-backend-dev
**Goal**: Drop several pieces in one value change; one unknown id fails the whole call and leaves the value unchanged (BSL-03, BSL-04).
**Where**: `backend/src/main/kotlin/<pkg>/domain/PlayerEquipment.kt`
**Also changes**: `backend/src/test/kotlin/<pkg>/domain/PlayerEquipmentTest.kt`
**Read first**: `domain/PlayerEquipment.kt:24-25` (`find`), `:67-71` (`remove`), `test/.../domain/PlayerEquipmentTest.kt:10-22` (helpers `piece`, `equipment`), `:96-101`
**Depends on**: None
**Requirement**: BSL-03, BSL-04

**Tools**: Skill `kotlin-backend-ddd`

**Contract** (insert right after `remove`):

```kotlin
/** Drops every piece of [pieceIds]; worn ones leave the slot of their hero empty. One id the player does not own fails the call and drops nothing. */
fun removeAll(pieceIds: List<String>): PlayerEquipment {
    pieceIds.forEach { find(it) }
    logger.info("Removing username={} pieces={}", username, pieceIds.size)
    val gone = pieceIds.toSet()
    return copy(pieces = pieces.filter { it.id !in gone })
}
```

**Steps**:

1. Add `removeAll` to `PlayerEquipment.kt` after `remove`.
2. Add the three cases below to `PlayerEquipmentTest.kt`.

**Tests**: unit
**Test cases** (`PlayerEquipmentTest.kt`, with the file's `piece` and `equipment` helpers):

- `removeAll drops every listed piece and keeps the others`: `equipment(piece("a"), piece("b"), piece("c")).removeAll(listOf("c", "a")).pieces.map { it.id } == listOf("b")`.
- `removeAll drops a worn piece and leaves its slot empty`: `val updated = equipment(piece("a", heroId = "kael"), piece("b")).removeAll(listOf("a"))`; `updated.worn("kael").isEmpty()`; `updated.pieces.map { it.id } == listOf("b")`.
- `removeAll with one unknown id is not found and the original keeps every piece`: `val before = equipment(piece("a"), piece("b"))`; `assertFailsWith<EquipmentNotFoundException> { before.removeAll(listOf("a", "x")) }`; `before.pieces.map { it.id } == listOf("a", "b")`.

**Gate**: quick - `cd backend && ./gradlew test --tests '*PlayerEquipmentTest'`
**Done when**:

- [x] The 3 new cases and every earlier `PlayerEquipmentTest` case pass.
- [x] `cd backend && ./gradlew ktlintCheck` passes.

**Commit**: `feat(backend): remove several pieces from the player equipment at once`

---

### T3: SellPiecesUseCase and EquipmentService.sellAll [x]

**Owner**: kotlin-backend-dev
**Goal**: Sell a batch in one transaction under the player lock: validate the batch, find every piece, credit the sum once, delete the rows (BSL-01 to BSL-05, BSL-08).
**Where**: `backend/src/main/kotlin/<pkg>/service/EquipmentService.kt`
**Also changes**: `backend/src/main/kotlin/<pkg>/usecase/EquipmentUseCase.kt`, `backend/src/test/kotlin/<pkg>/service/EquipmentServiceTest.kt`
**Read first**: `service/EquipmentService.kt:24-38` (class header), `:104-116` (`sell`, the pattern to follow), `:118-145` (`store`, `load`, `lockPlayer`); `usecase/EquipmentUseCase.kt:122-151`; `test/.../service/EquipmentServiceTest.kt:37-59` (fixtures), `:155-170` (`funded`, `weapon`, unknown user test), `:321-375` (sell tests)
**Depends on**: T1, T2
**Requirement**: BSL-01, BSL-02, BSL-03, BSL-04, BSL-05, BSL-08

**Tools**: Skill `kotlin-backend-ddd`

**Contract**:

```kotlin
// EquipmentUseCase.kt, at the end
/** The pieces and the wallet after a batch sale, how many pieces were sold and the copper they paid. */
data class BatchSale(
    val equipment: PlayerEquipment,
    val wallet: Wallet,
    val sold: Int,
    val earned: Long,
)

interface SellPiecesUseCase {
    /** Sells every piece of [pieceIds] (taking worn ones off their hero) and credits the sum of their sell prices, in one transaction; one id the player does not own sells nothing. */
    fun sellAll(
        username: String,
        pieceIds: List<String>,
    ): BatchSale
}

// EquipmentService.kt: add SellPiecesUseCase to the implemented interfaces (after SellPieceUseCase) and this method after sell()
override fun sellAll(
    username: String,
    pieceIds: List<String>,
): BatchSale {
    logger.info("Batch sell requested username={} count={}", username, pieceIds.size)
    val batch = SellBatch(pieceIds)
    lockPlayer(username)
    val before = load(username)
    val sold = batch.pieceIds.map(before::find)
    val earned = sold.sumOf { it.sellPrice() }
    val after = before.removeAll(batch.pieceIds)
    val wallet = walletAccess.lock(username).plus(earned)
    walletAccess.save(wallet)
    logger.info("Sold batch username={} pieces={} copper={}", username, sold.size, earned)
    return BatchSale(store(before, after), wallet, sold.size, earned)
}
```

Imports to add in `EquipmentService.kt`: `<kt>.domain.SellBatch`, `<kt>.usecase.BatchSale`, `<kt>.usecase.SellPiecesUseCase`.

**Steps**:

1. Add `BatchSale` and `SellPiecesUseCase` to `EquipmentUseCase.kt`.
2. Make `EquipmentService` implement `SellPiecesUseCase` and add `sellAll`.
3. Add the seven cases below to `EquipmentServiceTest.kt` after the last sell test; import `InvalidSellBatchException`.

**Tests**: unit
**Test cases** (`EquipmentServiceTest.kt`, using `player()`, `weapon(id, refine, rarity)`, `funded(copper)`, `pieces`, `wallets`, `users`):

- `sellAll removes every listed piece and credits the sum of their prices`: `player()`; `weapon("c")`; `weapon("r", refine = 4, rarity = Rarity.RARE)`; `weapon("u", rarity = Rarity.UNCOMMON)`; `weapon("keep")`; `funded(50)`; `val sale = service.sellAll("yan", listOf("c", "r", "u"))`. Expect `sale.sold == 3`, `sale.earned == 1200L`, `sale.wallet.copper == 1250L`, `wallets.wallets.getValue("yan").copper == 1250L`, `pieces.pieces.keys == setOf("keep")`, `sale.equipment.pieces.map { it.id } == listOf("keep")`.
- `sellAll of a worn piece takes it off the hero and sells it`: `player()`; `weapon("w")`; `service.equip("yan", "w", "kael")`; `funded(0)`; `val sale = service.sellAll("yan", listOf("w"))`. Expect `sale.wallet.copper == 100L`, `sale.equipment.worn("kael") == emptyList<Piece>()`, `pieces.pieces.isEmpty()`.
- `sellAll with one id the player does not own sells nothing and credits nothing`: `player()`; `weapon("a")`; `funded(10)`; `Piece("theirs", "other", Slot.WEAPON, Rarity.COMMON, 3, 0, emptyList()).also { pieces.save(it) }`. `assertFailsWith<EquipmentNotFoundException> { service.sellAll("yan", listOf("a", "theirs")) }` and `assertFailsWith<EquipmentNotFoundException> { service.sellAll("yan", listOf("a", "ghost")) }`. Expect `wallets.wallets.getValue("yan").copper == 10L` and `pieces.pieces.keys == setOf("a", "theirs")`.
- `sellAll of a batch already sold is not found and pays once`: `player()`; `weapon("a")`; `weapon("b")`; `funded(0)`; `service.sellAll("yan", listOf("a", "b")).wallet.copper == 200L`; then `assertFailsWith<EquipmentNotFoundException> { service.sellAll("yan", listOf("a", "b")) }`; `wallets.wallets.getValue("yan").copper == 200L`.
- `sellAll of an empty or repeating batch is refused and changes nothing`: `player()`; `weapon("a")`; `funded(10)`; `assertFailsWith<InvalidSellBatchException> { service.sellAll("yan", emptyList()) }`; `assertFailsWith<InvalidSellBatchException> { service.sellAll("yan", listOf("a", "a")) }`. Expect `wallets.wallets.getValue("yan").copper == 10L` and `pieces.pieces.keys == setOf("a")`.
- `sellAll creates the missing wallet before crediting`: `player()`; `weapon("a")` (no `funded`); `service.sellAll("yan", listOf("a")).wallet.copper == 100L`.
- `sellAll for an unknown user or a player without cards fails`: `assertFailsWith<UserNotFoundException> { service.sellAll("ghost", listOf("a")) }`; `users.save(User("yan", "hash", 1L, 1L))`; `assertFailsWith<PlayerCardsMissingException> { service.sellAll("yan", listOf("a")) }`.

**Gate**: quick - `cd backend && ./gradlew test --tests '*EquipmentServiceTest'`
**Done when**:

- [x] The 7 new cases and every earlier `EquipmentServiceTest` case pass.
- [x] `cd backend && ./gradlew ktlintCheck` passes.

**Commit**: `feat(backend): sell a batch of pieces in one transaction`

---

### T4: POST /equipment/sell endpoint [x]

**Owner**: kotlin-backend-dev
**Goal**: Expose the batch sale at `POST /equipment/sell` with the response `{ equipment, wallet, sold, earned }` and prove the 400, 401, 404, race and single-sale cases on the real database (BSL-01 to BSL-09).
**Where**: `backend/src/main/kotlin/<pkg>/adapter/web/EquipmentController.kt`
**Also changes**: `backend/src/test/kotlin/<pkg>/adapter/web/EquipmentBatchSellIT.kt` (new), `backend/docs/adr/0008-equipment.md`
**Read first**: `adapter/web/EquipmentController.kt:1-96`, `adapter/web/WalletController.kt:18-26` (`CoinsResponse`), `test/.../adapter/web/EquipmentSellIT.kt:1-104` (whole file, the pattern), `test/.../adapter/web/EquipmentRefineIT.kt:117-136` (two-thread race), `backend/docs/adr/0008-equipment.md:20-22`
**Depends on**: T3
**Requirement**: BSL-01, BSL-02, BSL-03, BSL-04, BSL-05, BSL-06, BSL-07, BSL-08, BSL-09

**Tools**: Skill `kotlin-backend-ddd`

**Contract**:

```kotlin
// EquipmentController.kt, after EquipmentChangeResponse
/** The pieces and the wallet after a batch sale, the number of pieces sold and the copper credited. */
data class BatchSaleResponse(
    val equipment: EquipmentResponse,
    val wallet: CoinsResponse,
    val sold: Int,
    val earned: Long,
) {
    companion object {
        fun from(
            sale: BatchSale,
            rules: EquipmentRules,
        ) = BatchSaleResponse(EquipmentResponse.from(sale.equipment, rules), CoinsResponse.from(sale.wallet.coins()), sale.sold, sale.earned)
    }
}

// constructor: add `private val sellPieces: SellPiecesUseCase,` after `sellPiece`
@PostMapping("/sell")
fun sellAll(
    principal: Principal,
    @RequestBody body: Map<String, Any?>,
): BatchSaleResponse {
    val raw = body["pieceIds"] as? List<*> ?: throw IllegalArgumentException("pieceIds must be a list of piece ids")
    val pieceIds = raw.map { it as? String ?: throw IllegalArgumentException("pieceIds must hold only strings") }
    return BatchSaleResponse.from(sellPieces.sellAll(principal.name, pieceIds), rules)
}
```

Endpoint: `POST /equipment/sell`, auth required (the existing `anyRequest authenticated` rule). Request `{"pieceIds": ["<id>", ...]}`. 200 body: `equipment` `{ capacity: int, pieces: PieceResponse[] }`, `wallet` `{ gold: long, silver: int, copper: int }`, `sold: int`, `earned: long` (copper). Errors: 400 `INVALID_SELL_BATCH` (ProblemDetail with `code`), 400 without `code` for a malformed body, 404 `EQUIPMENT_NOT_FOUND`, 401.

ADR line: in `backend/docs/adr/0008-equipment.md`, paragraph **Actions**, after the `/sell (...)` item add `, and POST /equipment/sell { pieceIds } (1 to 100 distinct ids, all-or-nothing, answers { equipment, wallet, sold, earned })`; in **Errors** add `INVALID_SELL_BATCH` next to `INVALID_AFFIX`.

**Steps**:

1. Add `BatchSaleResponse`, the constructor parameter and `sellAll` to the controller; import `<kt>.usecase.BatchSale` and `<kt>.usecase.SellPiecesUseCase`.
2. Create `EquipmentBatchSellIT` extending `IntegrationTestBase`, copying `registerPlayer`, `asUser` and `copper()` from `EquipmentSellIT`, with the helper `piece(id, rarity = "COMMON", refine = 0, heroId: String? = null, username = "yan") = jpaPieceRepository.save(PieceEntity(id, username, "WEAPON", rarity, 3, refine, "CRIT_CHANCE:2", heroId, 1))` and `sell(body: String) = asUser().contentType(ContentType.JSON).body(body).post("/equipment/sell")`.
3. Write the eight cases below.
4. Edit the ADR lines.

**Tests**: integration
**Test cases** (`EquipmentBatchSellIT.kt`):

- `selling three pieces at once credits the sum and removes them`: `piece("c")`, `piece("r", "RARE", 4)`, `piece("u", "UNCOMMON")`, `piece("keep")`, `jpaWalletRepository.save(WalletEntity("yan", 50))`; `sell("""{"pieceIds":["c","r","u"]}""")` → 200, `sold` 3, `earned` 1200, `wallet.gold` 0, `wallet.silver` 12, `wallet.copper` 50, `equipment.pieces` size 1, `equipment.pieces[0].id` "keep", `equipment.capacity` 100. Then `jpaPieceRepository.count() == 1L` and `copper() == 1250L`.
- `a worn piece in the batch is taken off its hero and sold`: `piece("w", heroId = "kael")`, wallet 0; `sell("""{"pieceIds":["w"]}""")` → 200, `sold` 1, `earned` 100, `equipment.pieces` size 0; `jpaPieceRepository.count() == 0L`, `copper() == 100L`.
- `one unknown id or one id of another account makes the batch 404 and sells nothing`: `users("other")`, `piece("a")`, `piece("theirs", username = "other")`, wallet 10; `sell("""{"pieceIds":["a","theirs"]}""")` → 404 with `code` `EQUIPMENT_NOT_FOUND`; `sell("""{"pieceIds":["a","ghost"]}""")` → 404; then `jpaPieceRepository.count() == 2L` and `copper() == 10L`.
- `an empty batch, a repeated id and 101 ids are 400 INVALID_SELL_BATCH and change nothing`: `piece("a")`, wallet 10; bodies `{"pieceIds":[]}`, `{"pieceIds":["a","a"]}` and a list of 101 ids `"p1"` to `"p101"` (build the JSON with `(1..101).joinToString(",") { "\"p$it\"" }`) → each 400 with `code` `INVALID_SELL_BATCH`; then `jpaPieceRepository.count() == 1L`, `copper() == 10L`.
- `a body without a list of string ids is 400`: `piece("a")`, wallet 10; bodies `{}`, `{"pieceIds":"a"}`, `{"pieceIds":[1,2]}` → each 400; then `jpaPieceRepository.count() == 1L`, `copper() == 10L`.
- `batch sell without a token is 401`: `given().contentType(ContentType.JSON).body("""{"pieceIds":["a"]}""").post("/equipment/sell").then().statusCode(401)`.
- `two identical batches at once pay once`: `piece("a")`, `piece("b")`, wallet 0; two threads (`Executors.newFixedThreadPool(2)`, as `EquipmentRefineIT:118-136`) each `sell("""{"pieceIds":["a","b"]}""").statusCode()`; `statuses.sorted() == listOf(200, 404)`; `copper() == 200L`; `jpaPieceRepository.count() == 0L`.
- `the single sale still answers on its own path`: `piece("a")`, wallet 0; `asUser().post("/equipment/a/sell")` → 200 with `wallet.silver` 1; `copper() == 100L`.

**Gate**: full - `cd backend && ./gradlew build`
**Done when**:

- [x] The 8 cases pass; `EquipmentSellIT` passes unchanged.
- [x] `cd backend && ./gradlew build` passes (all tests and ktlint).

**Commit**: `feat(backend): add POST /equipment/sell for a batch of pieces`

---

### T5: equipmentApi.sellMany [x]

**Owner**: game-dev
**Goal**: The HTTP adapter posts the selected ids to `/equipment/sell` and returns the whole answer (BSL-23).
**Where**: `game/src/adapters/http/equipmentApi.js`
**Also changes**: `game/src/adapters/http/equipmentApi.test.js`
**Read first**: `game/src/adapters/http/equipmentApi.js:1-23`, `game/src/adapters/http/equipmentApi.test.js:1-74`
**Depends on**: None
**Requirement**: BSL-23

**Contract**:

```js
//  in the returned object, after sell
sellMany: async (pieceIds) => (await httpClient.post('/equipment/sell', { pieceIds })).data
```

Header comment: add the line `//  sellMany([pieceId]) -> { equipment, wallet, sold, earned }: one sale of every listed piece (all or nothing).` and add `400 INVALID_SELL_BATCH` to the refusal line.

**Steps**:

1. Add `sellMany` and the comment lines.
2. Add the two cases below to `equipmentApi.test.js`.

**Tests**: unit
**Test cases** (`equipmentApi.test.js`):

- `sellMany posts the piece ids to /equipment/sell and returns the equipment, the wallet, sold and earned`: `const answer = { ...change, sold: 2, earned: 200 }`; `httpClient.post.mockResolvedValue({ data: answer })`; `await expect(equipmentApi.sellMany([ 'p1', 'p 2' ])).resolves.toEqual(answer)`; `expect(httpClient.post).toHaveBeenCalledWith('/equipment/sell', { pieceIds: [ 'p1', 'p 2' ] })`.
- `sellMany lets a refusal reach the caller`: `httpClient.post.mockRejectedValue(new Error('404'))`; `await expect(equipmentApi.sellMany([ 'x' ])).rejects.toThrow('404')`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 2 new cases pass and the game unit suite passes (no existing case removed).

**Commit**: `feat(game): add the batch sale call to the equipment api`

---

### T6: equipmentCollection.sellMany [x]

**Owner**: game-dev
**Goal**: The collection sells a batch, adopts the answer, reports the wallet, and on a failure reads the list again before rejecting (BSL-24, BSL-25).
**Where**: `game/src/application/equipment/equipmentCollection.js`
**Also changes**: `game/src/application/equipment/equipmentCollection.test.js`
**Read first**: `equipmentCollection.js:1-36` (port comment, `adopt`, `adoptChange`), `:96-136` (`transferSet` failure path, `sell`); `equipmentCollection.test.js:1-30`, `:109-155`, `:268-291`
**Depends on**: T5
**Requirement**: BSL-24, BSL-25

**Contract**:

```js
//  Sells every piece of `pieceIds` in one request (all or nothing on the backend) and resolves with { sold, earned } (earned in copper).
//  A failure reads the list again (the truth) and rejects with the failure, even when that read fails too.
sellMany: async (pieceIds) =>
{
    try
    {
        const { equipment, wallet, sold, earned } = await gateway.sellMany(pieceIds);

        adoptChange({ equipment, wallet });

        return { sold, earned };
    }
    catch (error)
    {
        await load().catch(() => {});

        throw error;
    }
},
```

Port comment (lines 4-7): add `sellMany(pieceIds)` to the gateway list and `sellMany resolves with { equipment, wallet, sold, earned }`.

**Steps**:

1. Add `sellMany` after `sell` and update the port comment.
2. In `equipmentCollection.test.js` add `sellMany: vi.fn()` to the gateway of the top `beforeEach` (line 16-23).
3. Add a `describe('sellMany', ...)` with a `beforeEach` that runs `await collection.load(); changes.mockClear();` and the three cases below.

**Tests**: unit
**Test cases** (`equipmentCollection.test.js`, `describe('sellMany')`):

- `sends the ids, takes the pieces, reports the wallet and resolves with sold and earned`: `gateway.sellMany.mockResolvedValue({ equipment: equipment(piece('b')), wallet, sold: 1, earned: 100 })`; `await expect(collection.sellMany([ 'a' ])).resolves.toEqual({ sold: 1, earned: 100 })`; `gateway.sellMany` called with `[ 'a' ]`; `collection.pieces().map(({ id }) => id)` equals `[ 'b' ]`; `wallets` called with `wallet`; `changes` called 1 time.
- `a refused sale reads the list again, reports no wallet and rejects`: `gateway.sellMany.mockRejectedValue(new ApiError('Piece not found', { status: 404, code: 'EQUIPMENT_NOT_FOUND' }))`; `gateway.list.mockResolvedValue(equipment(piece('b')))`; `await expect(collection.sellMany([ 'a', 'b' ])).rejects.toMatchObject({ code: 'EQUIPMENT_NOT_FOUND' })`; `gateway.list` called 2 times; pieces ids `[ 'b' ]`; `wallets` not called.
- `still rejects with the sale failure when the list cannot be read again`: `gateway.sellMany.mockRejectedValue(new ApiError('Piece not found', { status: 404, code: 'EQUIPMENT_NOT_FOUND' }))`; `gateway.list.mockRejectedValue(new ApiError('down', { status: 500 }))`; `await expect(collection.sellMany([ 'a' ])).rejects.toMatchObject({ code: 'EQUIPMENT_NOT_FOUND' })`; pieces ids still `[ 'a', 'b' ]`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 3 new cases pass and the game unit suite passes.

**Commit**: `feat(game): sell a batch of pieces from the equipment collection`

---

### T7: Selection rules (domain/equipment/bulkSell.js) [x]

**Owner**: game-dev
**Goal**: Pure functions for the selection: the bag, totals, toggles, rarity state, request order and the three Portuguese texts (BSL-14, BSL-15, BSL-20, BSL-23 to BSL-25, BSL-27 to BSL-30).
**Where**: `game/src/domain/equipment/bulkSell.js` (new)
**Also changes**: `game/src/domain/equipment/bulkSell.test.js` (new)
**Read first**: `game/src/domain/equipment/equipment.js:1-89` (`formatCopper`, `RARITY_LABELS`, comment style), `game/src/domain/equipment/equipment.test.js:1-30` (test style), `game/src/architecture.test.js` (domain may import only domain)
**Depends on**: None
**Requirement**: BSL-14, BSL-15, BSL-20, BSL-23, BSL-24, BSL-25, BSL-27, BSL-28, BSL-29, BSL-30

**Contract** (every function returns a new value and never mutates its arguments; `ids` is always a `Set` of piece ids):

```js
import { formatCopper } from './equipment';

//  The five rarities in the order of the buttons
export const RARITY_ORDER = [ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ];

//  The bag: the pieces no hero wears, in the order of the list
export const bagPieces = (pieces) => pieces.filter((piece) => !piece.heroId);

//  The copper the pieces of `ids` pay together (sum of sellPrice); pieces not in `ids` count nothing
export const sellTotal = (pieces, ids) => pieces.filter((piece) => ids.has(piece.id)).reduce((sum, piece) => sum + piece.sellPrice, 0);

//  A new Set with `id` added, or without it when it was there
export const toggleSelected = (ids, id) => { const next = new Set(ids); if (next.has(id)) { next.delete(id); } else { next.add(id); } return next; };

//  Whether the bag holds the rarity and whether every bag piece of it is selected
export const rarityState = (ids, bag, rarity) => { const ofRarity = bag.filter((piece) => piece.rarity === rarity); return { available: ofRarity.length > 0, allSelected: ofRarity.length > 0 && ofRarity.every((piece) => ids.has(piece.id)) }; };

//  Selects every bag piece of `rarity`, or unselects them all when all were selected; the other ids stay
export const toggleRarity = (ids, bag, rarity) => { ... };

//  The selected ids that are still in the bag, in the order of the bag (the order of the request)
export const selectedInBag = (ids, pieces) => bagPieces(pieces).filter((piece) => ids.has(piece.id)).map((piece) => piece.id);

//  "Selecionadas: 3 · Total: 4 prata"
export const selectionSummary = (count, total) => `Selecionadas: ${count} · Total: ${formatCopper(total)}`;

//  "Vender 1 peça por 1 prata?" / "Vender 2 peças por 3 prata?"
export const sellQuestion = (count, total) => ...;

//  "1 peça vendida por 1 prata" / "3 peças vendidas por 12 prata"
export const sellNotice = (sold, earned) => ...;
```

The separator in `selectionSummary` is ` · ` (space, U+00B7, space).

**Steps**:

1. Create `bulkSell.js` with the contract above, filling `toggleRarity`, `sellQuestion` and `sellNotice` (singular when the count is exactly 1).
2. Create `bulkSell.test.js` with the cases below. Fixtures: `const p = (id, rarity, sellPrice, heroId = null) => ({ id, slot: 'RING', rarity, refine: 0, affixes: [], sellPrice, heroId })`; `c1 = p('c1', 'COMMON', 100)`, `c2 = p('c2', 'COMMON', 100)`, `u1 = p('u1', 'UNCOMMON', 200)`, `e1 = p('e1', 'EPIC', 400)`, `w = p('w', 'RARE', 900, 'kael')`.

**Tests**: unit
**Test cases** (`bulkSell.test.js`):

- `RARITY_ORDER lists the five rarities from COMMON to LEGENDARY`: equals `[ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ]`.
- `bagPieces keeps the unworn pieces in their order`: `bagPieces([ w, c1, u1 ]).map((x) => x.id)` equals `[ 'c1', 'u1' ]`.
- `sellTotal sums the sell price of the selected pieces only`: `sellTotal([ c1, c2, u1, e1 ], new Set([ 'c1', 'u1' ]))` is `300`; with `new Set()` is `0`.
- `toggleSelected adds a missing id, removes a present one and leaves the given set alone`: `const s = new Set([ 'a' ])`; `[ ...toggleSelected(s, 'b') ]` equals `[ 'a', 'b' ]`; `toggleSelected(s, 'a').size` is `0`; `[ ...s ]` still equals `[ 'a' ]`.
- `toggleRarity selects every bag piece of the rarity and keeps the others`: `toggleRarity(new Set([ 'u1' ]), [ c1, c2, u1 ], 'COMMON')` holds exactly `u1`, `c1`, `c2` (compare `[ ...set ].sort()` with `[ 'c1', 'c2', 'u1' ]`).
- `toggleRarity completes a rarity that is only partly selected`: `toggleRarity(new Set([ 'c1' ]), [ c1, c2, u1 ], 'COMMON')` sorted equals `[ 'c1', 'c2' ]`.
- `toggleRarity unselects the rarity when every piece of it is selected`: `toggleRarity(new Set([ 'c1', 'c2', 'u1' ]), [ c1, c2, u1 ], 'COMMON')` sorted equals `[ 'u1' ]`.
- `toggleRarity of a rarity the bag does not hold changes nothing`: `toggleRarity(new Set([ 'c1' ]), [ c1, c2 ], 'LEGENDARY')` sorted equals `[ 'c1' ]`.
- `rarityState says whether the bag holds the rarity and whether all of it is selected`: `rarityState(new Set(), [ c1, c2 ], 'LEGENDARY')` equals `{ available: false, allSelected: false }`; `rarityState(new Set([ 'c1' ]), [ c1, c2 ], 'COMMON')` equals `{ available: true, allSelected: false }`; `rarityState(new Set([ 'c1', 'c2' ]), [ c1, c2 ], 'COMMON')` equals `{ available: true, allSelected: true }`.
- `selectedInBag keeps the selected ids still in the bag, in bag order`: `selectedInBag(new Set([ 'c2', 'gone', 'c1', 'w' ]), [ c1, u1, w, c2 ])` equals `[ 'c1', 'c2' ]`.
- `selectionSummary reads Selecionadas and the total`: `(0, 0)` → `'Selecionadas: 0 · Total: 0 cobre'`; `(3, 400)` → `'Selecionadas: 3 · Total: 4 prata'`; `(1, 150)` → `'Selecionadas: 1 · Total: 1 prata 50 cobre'`.
- `sellQuestion says peça for one and peças for more`: `(1, 100)` → `'Vender 1 peça por 1 prata?'`; `(2, 300)` → `'Vender 2 peças por 3 prata?'`.
- `sellNotice says vendida for one and vendidas for more`: `(1, 100)` → `'1 peça vendida por 1 prata'`; `(3, 1200)` → `'3 peças vendidas por 12 prata'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 13 cases pass; `architecture.test.js` passes (the module imports only `./equipment`).

**Commit**: `feat(game): add the selection rules of the bulk sale`

---

### T8: Selection bar view (views/bulkSellView.js) [x]

**Owner**: game-dev
**Goal**: Render the bar of selection mode: summary, five rarity buttons, `Vender selecionadas` and `Cancelar`, or the confirmation with `Sim, vender` and `Não` (BSL-12, BSL-15, BSL-16, BSL-20, BSL-21, BSL-26, BSL-29, BSL-30).
**Where**: `game/src/adapters/phaser/views/bulkSellView.js` (new)
**Also changes**: `game/src/adapters/phaser/views/bulkSellView.test.js` (new)
**Read first**: `game/src/adapters/phaser/views/equipmentView.js:1-36` (`button` helper and `renderTransfer`, the pattern), `game/src/adapters/phaser/views/dom.js:1-20` (`el`, read only, do not edit), `game/src/domain/equipment/bulkSell.js` (T7)
**Depends on**: T7
**Requirement**: BSL-12, BSL-15, BSL-16, BSL-20, BSL-21, BSL-26, BSL-29, BSL-30

**Contract**:

```js
import { RARITY_LABELS } from '../../../domain/equipment/equipment';
import { selectionSummary, sellQuestion } from '../../../domain/equipment/bulkSell';
import { el } from './dom';

//  The bar of selection mode. `rarities` is [ { rarity, available, allSelected } ] in RARITY_ORDER.
//  Callbacks: onRarity(rarity), onSubmit(), onCancel(), onConfirm(), onDecline().
export const renderBulkSellBar = ({ count, total, rarities, confirming, onRarity, onSubmit, onCancel, onConfirm, onDecline }) => HTMLElement
```

DOM it returns (every button has `type="button"` and the class `equip-button`; a disabled button carries the `disabled` attribute):

```
div.bulk-sell-bar [data-testid=bulk-sell-bar]
  div.bulk-sell-summary [data-testid=bulk-sell-summary]   text selectionSummary(count, total)
  div.bulk-sell-rarities
    button.equip-button.bulk-sell-rarity.rarity-<lowercase> [data-testid=bulk-sell-rarity-<RARITY>] [data-rarity=<RARITY>] [aria-pressed="true"|"false"]
      text RARITY_LABELS[rarity]; aria-pressed = allSelected; disabled when !available or confirming; click -> onRarity(rarity)
  when !confirming:
  div.bulk-sell-actions
    button.equip-button.bulk-sell-submit [data-testid=bulk-sell-submit] "Vender selecionadas"   disabled when count === 0; click -> onSubmit()
    button.equip-button [data-testid=bulk-sell-cancel] "Cancelar"                              click -> onCancel()
  when confirming:
  div.bulk-sell-confirm [data-testid=bulk-sell-confirm]
    span.bulk-sell-question [data-testid=bulk-sell-question]   text sellQuestion(count, total)
    button.equip-button.bulk-sell-yes [data-testid=bulk-sell-confirm-yes] "Sim, vender"        click -> onConfirm()
    button.equip-button [data-testid=bulk-sell-confirm-no] "Não"                               click -> onDecline()
```

**Steps**:

1. Create `bulkSellView.js` (a local `button(text, testid, onClick, disabled, extraClass)` helper like `equipmentView.js:9-16`).
2. Create `bulkSellView.test.js` with the cases below. Fixture: `const rarities = (overrides = {}) => [ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ].map((rarity) => ({ rarity, available: true, allSelected: false, ...overrides[rarity] }))`; `const bar = (props = {}) => renderBulkSellBar({ count: 0, total: 0, rarities: rarities(), confirming: false, onRarity: vi.fn(), onSubmit: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn(), onDecline: vi.fn(), ...props })`; `const find = (root, id) => root.querySelector(`[data-testid="${id}"]`)`.

**Tests**: unit
**Test cases** (`bulkSellView.test.js`):

- `shows the summary of the selection`: `bar({ count: 3, total: 400 })` has `data-testid` `bulk-sell-bar` and `find(.., 'bulk-sell-summary').textContent` is `'Selecionadas: 3 · Total: 4 prata'`.
- `shows the summary of an empty selection`: `bar()` summary is `'Selecionadas: 0 · Total: 0 cobre'`.
- `shows one button per rarity in order with its label`: texts of `.bulk-sell-rarity` equal `[ 'Comum', 'Incomum', 'Raro', 'Épico', 'Lendário' ]`; their `data-testid` equal `[ 'bulk-sell-rarity-COMMON', 'bulk-sell-rarity-UNCOMMON', 'bulk-sell-rarity-RARE', 'bulk-sell-rarity-EPIC', 'bulk-sell-rarity-LEGENDARY' ]`; `bulk-sell-rarity-EPIC` has `data-rarity` `EPIC` and class `rarity-epic`.
- `disables a rarity the bag does not hold and marks a fully selected one as pressed`: `bar({ rarities: rarities({ COMMON: { allSelected: true }, LEGENDARY: { available: false } }) })` → COMMON `aria-pressed` `'true'` and enabled; UNCOMMON `aria-pressed` `'false'`; LEGENDARY `disabled === true` and `aria-pressed` `'false'`.
- `calls onRarity with the rarity of the clicked button`: click `bulk-sell-rarity-RARE` → `onRarity` called once with `'RARE'`.
- `disables Vender selecionadas with nothing selected and enables it with one`: `bar({ count: 0 })` submit `disabled === true` and text `'Vender selecionadas'`; `bar({ count: 1, total: 100 })` submit `disabled === false`.
- `calls onSubmit and onCancel from their buttons`: click submit on `bar({ count: 1, total: 100 })` → `onSubmit` called once; click `bulk-sell-cancel` (text `'Cancelar'`) → `onCancel` called once.
- `shows the question with Sim, vender and Não while confirming and hides Vender selecionadas and Cancelar`: `bar({ count: 2, total: 300, confirming: true })` → `bulk-sell-question` text `'Vender 2 peças por 3 prata?'`, `bulk-sell-confirm-yes` text `'Sim, vender'`, `bulk-sell-confirm-no` text `'Não'`, `bulk-sell-submit` is `null`, `bulk-sell-cancel` is `null`, `bulk-sell-confirm` not `null`.
- `says peça in the question for a single piece`: `bar({ count: 1, total: 100, confirming: true })` question `'Vender 1 peça por 1 prata?'`.
- `disables every rarity button while confirming`: `bar({ count: 1, total: 100, confirming: true })` → all five `.bulk-sell-rarity` have `disabled === true`.
- `calls onConfirm and onDecline from the confirmation`: click yes → `onConfirm` once; click no → `onDecline` once.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 11 cases pass and the game unit suite passes.
- [ ] `views/dom.js` and `views/pieceTile.js` are unchanged (`git diff --stat` shows neither from this task).

**Commit**: `feat(game): add the selection bar of the bulk sale`

---

### T9: Selection mode in renderEquipment [x]

**Owner**: game-dev
**Goal**: `renderEquipment` shows `Vender várias`, the selection bar, selected and locked tiles, and the sell notice, including on the empty screen (BSL-10 to BSL-15, BSL-17, BSL-21, BSL-24).
**Where**: `game/src/adapters/phaser/views/equipmentView.js`
**Also changes**: `game/src/adapters/phaser/views/equipmentView.test.js`
**Read first**: `equipmentView.js:52-140` (`renderEquipment`), `views/pieceTile.js` (read only: the tile is a `<button>` whose click calls `onClick(piece)`), `views/bulkSellView.js` (T8), `domain/equipment/bulkSell.js` (T7), `equipmentView.test.js:1-17`, `:101-113`, `:178-248`
**Depends on**: T7, T8
**Requirement**: BSL-10, BSL-11, BSL-12, BSL-13, BSL-14, BSL-15, BSL-17, BSL-21, BSL-24

**Contract**:

New signature: `renderEquipment(pieces, heroes, { onSelect, onTransfer, onStartSelling, stats = null, notice = null, sellNotice = null, busy = false, selection = null })`.
`selection` is `null` (mode off) or `{ ids: Set<string>, confirming: boolean, onToggle(piece), onRarity(rarity), onSubmit(), onCancel(), onConfirm(), onDecline() }`.

Rules, in the order of the function:

1. Empty list (`pieces.length === 0`): with neither `stats` nor `sellNotice`, return the `p.hero-empty` exactly as today. Otherwise return `div.equip-screen` holding, in order, the sell notice (when given), the leader panel (when given) and the empty text.
2. Sell notice element: `el('p', 'equip-notice', sellNotice, { testid: 'equip-sell-notice' })`, placed after the transfer notice and before the leader panel.
3. Hero blocks: render the `Transferir conjunto` box only when `!selection` (keep the existing `wearsSomething && owned.length > 1` condition). In selection mode every worn tile gets `tile.disabled = true` and `tile.classList.add('is-locked')`.
4. Bag header: replace the bare title with `div.bag-header` holding the existing `strong.equip-bag-title` (`Mochila (<n>)`) and, when `!selection && bag.length > 0`, the button `Vender várias` (`el('button', 'equip-button', 'Vender várias', { type: 'button', testid: 'bulk-sell-start' })`, click → `onStartSelling?.()`).
5. When `selection`: after the header append `renderBulkSellBar({ count: selectedInBag(selection.ids, pieces).length, total: sellTotal(bag, selection.ids), rarities: RARITY_ORDER.map((rarity) => ({ rarity, ...rarityState(selection.ids, bag, rarity) })), confirming: selection.confirming, onRarity: selection.onRarity, onSubmit: selection.onSubmit, onCancel: selection.onCancel, onConfirm: selection.onConfirm, onDecline: selection.onDecline })`.
6. Bag tiles in selection mode: build with `renderPieceTile(piece, { testid, onClick: selection.onToggle })` (keep the tooltip), then set `aria-pressed` to `'true'` or `'false'`; a selected tile also gets the class `is-selected` and a child `el('span', 'piece-check', '✓')`; while `selection.confirming` set `tile.disabled = true`. Outside selection mode tiles carry no `aria-pressed` (as today).
7. `busy` keeps disabling every button of the screen (unchanged; it now also covers the bar).

**Steps**:

1. Add the imports (`renderBulkSellBar`; `bagPieces`, `rarityState`, `RARITY_ORDER`, `selectedInBag`, `sellTotal` from `bulkSell.js`) and the new options.
2. Apply rules 1 to 6; do not edit `pieceTile.js` or `dom.js`.
3. Update the comment above `renderEquipment` with the new options.
4. Add a `describe('renderEquipment selection mode', ...)` with the cases below. Fixture: `const selecting = (ids = [], extra = {}) => ({ ids: new Set(ids), confirming: false, onToggle: vi.fn(), onRarity: vi.fn(), onSubmit: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn(), onDecline: vi.fn(), ...extra })`; `find(screen, id)` as in the transfer block.

**Tests**: unit
**Test cases** (`equipmentView.test.js`, `describe('renderEquipment selection mode')`):

- `shows Vender várias in the bag header when the bag holds a piece and calls onStartSelling`: `renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), onStartSelling })` → `bulk-sell-start` text `'Vender várias'`, its parent has class `bag-header`; click → `onStartSelling` called once.
- `shows no Vender várias when every piece is worn`: `renderEquipment([ weapon({ heroId: 'kael' }) ], heroes, { onSelect: vi.fn() })` → `bulk-sell-start` is `null`; `.equip-bag-title` text `'Mochila (0)'`.
- `shows the bar and hides Vender várias in selection mode`: `renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), selection: selecting() })` → `bulk-sell-bar` not `null`, `bulk-sell-start` `null`, `bulk-sell-summary` text `'Selecionadas: 0 · Total: 0 cobre'`.
- `a click on a bag tile calls onToggle and not onSelect`: `const onSelect = vi.fn(); const selection = selecting()`; click `equip-piece-r1` → `selection.onToggle` called once with the `ring()` piece (`toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }))`), `onSelect` not called.
- `marks a selected tile with is-selected, aria-pressed and a check mark`: pieces `[ ring(), ring({ id: 'r2' }) ]`, `selecting([ 'r1' ])` → `equip-piece-r1` has class `is-selected`, `aria-pressed` `'true'`, `.piece-check` text `'✓'`; `equip-piece-r2` `aria-pressed` `'false'`, no class `is-selected`, `.piece-check` `null`.
- `tiles carry no aria-pressed outside selection mode`: `renderEquipment([ ring() ], heroes, { onSelect: vi.fn() })` → `equip-piece-r1.getAttribute('aria-pressed')` is `null`.
- `sums only the selected bag pieces in the summary`: pieces `[ ring(), ring({ id: 'r2' }), weapon({ id: 'w2' }) ]` (prices 100, 100, 750), `selecting([ 'r1', 'w2' ])` → summary `'Selecionadas: 2 · Total: 8 prata 50 cobre'`.
- `disables the worn tiles and hides Transferir conjunto in selection mode`: pieces `[ weapon({ heroId: 'kael' }), ring() ]`, heroes `[ hero('kael'), hero('lyra') ]`, `selecting()` → `equip-slot-kael-WEAPON` `disabled === true` and class `is-locked`; `equip-transfer-kael` `null`.
- `passes the state of each rarity to the bar`: pieces `[ ring() ]` (COMMON), `selecting([ 'r1' ])` → `bulk-sell-rarity-COMMON` `aria-pressed` `'true'`; `bulk-sell-rarity-LEGENDARY` `disabled === true`.
- `disables the bag tiles and shows the question while confirming`: pieces `[ ring() ]`, `selecting([ 'r1' ], { confirming: true })` → `equip-piece-r1` `disabled === true`; `bulk-sell-question` text `'Vender 1 peça por 1 prata?'`.
- `shows the sell notice at the top`: `renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), sellNotice: '2 peças vendidas por 3 prata', stats: { name: 'Kael', lines: [] } })` → `equip-sell-notice` text `'2 peças vendidas por 3 prata'` and `screen.firstElementChild.getAttribute('data-testid')` is `'equip-sell-notice'`.
- `shows the sell notice with the empty text when no piece is left`: `renderEquipment([], heroes, { onSelect: vi.fn(), sellNotice: '1 peça vendida por 1 prata' })` → `equip-sell-notice` text `'1 peça vendida por 1 prata'` and `equipment-empty` text `'Nenhum equipamento ainda. Vença chefes para encontrar peças.'`.
- `disables the bar buttons while a request runs`: pieces `[ ring() ]`, `selecting([ 'r1' ])`, `busy: true` → every `button` in the screen has `disabled === true`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 13 new cases pass and every earlier `equipmentView.test.js` case passes unchanged.
- [ ] `views/dom.js` and `views/pieceTile.js` are unchanged by this task.

**Commit**: `feat(game): show the selection mode in the Equipamento screen`

---

### T10: Selection state in HeroUi [x]

**Owner**: game-dev
**Goal**: `HeroUi` runs the selection state machine (Off, Selecting, Confirming, Sending), sells through `equipment.sellMany` and shows the notice or the error (BSL-12 to BSL-25, BSL-27, BSL-28).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js:1-20` (imports), `:82-95` (constructor fields), `:145-234` (`show`, `close`), `:345-442` (`render_equipment`, `transferSet`, `act`), `HeroUi.test.js:1-88` (`createUi`, `open`, `flush`), `:639-755` (transfer tests, the pattern), `:936-1087` (Equipamento tests)
**Depends on**: T6, T9
**Requirement**: BSL-12, BSL-13, BSL-14, BSL-16, BSL-17, BSL-18, BSL-19, BSL-20, BSL-21, BSL-22, BSL-23, BSL-24, BSL-25, BSL-27, BSL-28

**Contract**:

- Constructor: `this.sellMode = null;` next to `this.equipBusy = false;`.
- `show()`: set `this.sellMode = null;` right after `this.screen = screen;`. `close()`: set `this.sellMode = null;` next to `this.screen = null;`.
- `render_equipment({ selected = null, notice = null, sellNotice = null } = {})`: pass `sellNotice`, `onStartSelling: () => this.startSelling()` and `selection: this.sellingOptions()` to `renderEquipment`. The detail branch is unchanged.
- New methods (each one ends by calling `this.render_equipment()` unless stated):
  - `sellingOptions()`: returns `null` when `!this.sellMode`, else `{ ids: this.sellMode.ids, confirming: this.sellMode.confirming, onToggle: (piece) => this.toggleSale(piece.id), onRarity: (rarity) => this.toggleSaleRarity(rarity), onSubmit: () => this.askSale(), onCancel: () => this.cancelSale(), onConfirm: () => this.sellSelected(), onDecline: () => this.declineSale() }`.
  - `startSelling()`: `this.setError(''); this.sellMode = { ids: new Set(), confirming: false };`.
  - `toggleSale(pieceId)`: `this.sellMode = { ...this.sellMode, ids: toggleSelected(this.sellMode.ids, pieceId) };`.
  - `toggleSaleRarity(rarity)`: `this.sellMode = { ...this.sellMode, ids: toggleRarity(this.sellMode.ids, bagPieces(this.equipment.pieces()), rarity) };`.
  - `askSale()`: `this.sellMode = { ...this.sellMode, confirming: true };`.
  - `declineSale()`: `this.sellMode = { ...this.sellMode, confirming: false };`.
  - `cancelSale()`: `this.setError(''); this.sellMode = null;`.
  - `async sellSelected()`:

```js
async sellSelected ()
{
    if (this.equipBusy || !this.sellMode)
    {
        return;
    }

    const view = this.view;
    const ids = selectedInBag(this.sellMode.ids, this.equipment.pieces());
    let sellNotice = null;

    this.equipBusy = true;
    this.render_equipment();

    try
    {
        const { sold, earned } = await this.equipment.sellMany(ids);

        if (view === this.view)
        {
            this.setError('');
            this.sellMode = null;
            sellNotice = sellNoticeText(sold, earned);
        }
    }
    catch
    {
        if (view === this.view)
        {
            this.setError(EQUIPMENT_FAILED);
            this.sellMode = { ids: new Set(selectedInBag(this.sellMode.ids, this.equipment.pieces())), confirming: false };
        }
    }
    finally
    {
        this.equipBusy = false;

        if (view === this.view && this.screen === 'equipment')
        {
            this.render_equipment({ sellNotice });
        }
    }
}
```

Imports: `bagPieces`, `selectedInBag`, `toggleRarity`, `toggleSelected` and `sellNotice as sellNoticeText` from `../../domain/equipment/bulkSell`.

**Steps**:

1. Add the field, the resets in `show()` and `close()`, the imports and the methods.
2. Pass the new options in `render_equipment`.
3. In `HeroUi.test.js` add `sellMany: vi.fn()` to `equipmentGateway` in `createUi` (lines 42-49).
4. Add `describe('HeroUi bulk sell', ...)` with the cases below. Fixtures: `const bagged = (id, rarity, sellPrice, extra = {}) => ({ id, slot: 'RING', rarity, refine: 0, heroId: null, sellPrice, refineCost: 500, rerollCost: null, affixes: [], ...extra })`; `const c1 = bagged('c1', 'COMMON', 100)`, `c2 = bagged('c2', 'COMMON', 100)`, `u1 = bagged('u1', 'UNCOMMON', 200)`, `w1 = bagged('w1', 'RARE', 100, { slot: 'WEAPON', clickDamage: 3, heroId: 'kael' })`; `const list = (...pieces) => ({ capacity: 100, pieces })`; `const start = async (pieces = [ c1, c2, u1, w1 ]) => { const ctx = createUi({ equipmentList: list(...pieces) }); await open(ctx, 'equipment'); ctx.testid('bulk-sell-start').click(); return ctx; }`; `const pressed = (ctx, id) => ctx.testid(`equip-piece-${id}`).getAttribute('aria-pressed')`.

**Tests**: unit
**Test cases** (`HeroUi.test.js`, `describe('HeroUi bulk sell')`):

- `Vender várias enters selection mode and a tile click selects instead of opening the piece`: `start()`; click `equip-piece-c1` → `piece-detail` `null`, `pressed(ctx, 'c1')` `'true'`, `bulk-sell-summary` text `'Selecionadas: 1 · Total: 1 prata'`, `bulk-sell-start` `null`.
- `a second click on a tile unselects it and disables Vender selecionadas`: click `c1` twice → `pressed` `'false'`, summary `'Selecionadas: 0 · Total: 0 cobre'`, `bulk-sell-submit` `disabled === true`.
- `a rarity button selects every bag piece of that rarity and a second click unselects them`: click `bulk-sell-rarity-COMMON` → `pressed` c1 `'true'`, c2 `'true'`, u1 `'false'`, summary `'Selecionadas: 2 · Total: 2 prata'`, `bulk-sell-rarity-COMMON` `aria-pressed` `'true'`; click it again → summary `'Selecionadas: 0 · Total: 0 cobre'`.
- `a rarity button keeps the pieces of other rarities selected`: click `u1`, then `bulk-sell-rarity-COMMON` → summary `'Selecionadas: 3 · Total: 4 prata'`.
- `worn tiles are disabled and Transferir conjunto hides in selection mode`: `start()` → `equip-slot-kael-WEAPON` `disabled === true`; `equip-transfer-kael` `null`.
- `Vender selecionadas asks before selling and sends nothing`: select c1 and u1; click `bulk-sell-submit` → `bulk-sell-question` text `'Vender 2 peças por 3 prata?'`; `equipmentGateway.sellMany` not called; `equip-piece-c1` `disabled === true`; `bulk-sell-rarity-COMMON` `disabled === true`; `bulk-sell-cancel` `null`.
- `Não closes the question and keeps the selection`: select c1 and u1; submit; click `bulk-sell-confirm-no` → `bulk-sell-question` `null`; `pressed(ctx, 'c1')` `'true'`; summary `'Selecionadas: 2 · Total: 3 prata'`; `bulk-sell-submit` not `null`.
- `Sim, vender sells the selection in bag order in one request and shows the notice`: `ctx.equipmentGateway.sellMany.mockResolvedValue({ equipment: list(c2, w1), wallet: { gold: 0, silver: 3, copper: 50 }, sold: 2, earned: 300 })`; click u1 then c1; submit; click `bulk-sell-confirm-yes`; `await flush()` → `sellMany` called once with `[ 'c1', 'u1' ]`; `equip-sell-notice` text `'2 peças vendidas por 3 prata'`; `bulk-sell-bar` `null`; `bulk-sell-start` not `null`; `.equip-bag-title` text `'Mochila (1)'`; `equip-piece-c1` `null`; `.hero-error` `hidden === true`.
- `every equipment button is disabled while the sale runs and a second click sends nothing`: `let finish; ctx.equipmentGateway.sellMany.mockImplementation(() => new Promise((resolve) => { finish = resolve; }))`; select c1; submit; click yes → every `.equip-screen button` in `ctx.root` has `disabled === true`; click `bulk-sell-confirm-yes` again → `sellMany` called 1 time; `finish({ equipment: list(c2, u1, w1), wallet: { gold: 0, silver: 1, copper: 0 }, sold: 1, earned: 100 })`; `await flush()` → `equip-sell-notice` text `'1 peça vendida por 1 prata'`.
- `a failed sale reads the list again, shows the error and keeps only the selected pieces still in the bag`: `ctx.equipmentGateway.sellMany.mockRejectedValue(new ApiError('Piece not found', { status: 404, code: 'EQUIPMENT_NOT_FOUND' }))`; after `start()` set `ctx.equipmentGateway.list.mockResolvedValue(list(c2, u1, w1))`; select c1 and u1; submit; yes; `await flush()` → `.hero-error` text `'Não foi possível concluir a ação.'` and not hidden; `equipmentGateway.list` called 2 times; `bulk-sell-bar` not `null`; `equip-piece-c1` `null`; `pressed(ctx, 'u1')` `'true'`; summary `'Selecionadas: 1 · Total: 2 prata'`; `bulk-sell-question` `null`.
- `Cancelar leaves selection mode and a tile click opens the piece again`: select c1; click `bulk-sell-cancel` → `bulk-sell-bar` `null`; `bulk-sell-start` not `null`; `equip-piece-c1.getAttribute('aria-pressed')` `null`; click `equip-piece-c1` → `piece-detail` not `null`.
- `closing the window leaves selection mode`: select c1; `ctx.ui.close()`; `await open(ctx, 'equipment')` → `bulk-sell-bar` `null`; `bulk-sell-start` not `null`; `equip-piece-c1.classList.contains('is-selected')` `false`.
- `the answer of a sale that arrives after the window was closed draws nothing`: `let finish` deferred as above; select c1; submit; yes; `ctx.ui.close()`; `finish({ equipment: list(c2, u1, w1), wallet: { gold: 0, silver: 1, copper: 0 }, sold: 1, earned: 100 })`; `await flush()` → `.hero-body` `childElementCount` is `0`.
- `selling every piece shows the empty text with the notice`: `start([ c1 ])`; `sellMany.mockResolvedValue({ equipment: list(), wallet: { gold: 0, silver: 1, copper: 0 }, sold: 1, earned: 100 })`; select c1; submit; yes; `await flush()` → `equip-sell-notice` text `'1 peça vendida por 1 prata'`; `equipment-empty` not `null`.
- `a piece dropped while selecting shows unselected and the selection stays`: `start()`; select c1; `ctx.equipment.applyDrop({ piece: bagged('n1', 'RARE', 300), sold: false })`; click `u1` (any redraw) → `pressed(ctx, 'n1')` `'false'`; `pressed(ctx, 'c1')` `'true'`; summary `'Selecionadas: 2 · Total: 3 prata'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The 15 new cases pass and every earlier `HeroUi.test.js` case passes unchanged.
- [ ] `ClickerGame.js` is not edited (the wallet already flows through `equipment.onWallet`).

**Commit**: `feat(game): run the bulk sale from the Equipamento screen`

---

### T11: Styles of the selection mode [x]

**Owner**: game-dev
**Goal**: Style the bag header, the bar, the rarity buttons, the selected and locked tiles and the check badge as the design table says (BSL-10, BSL-12, BSL-14, BSL-17, BSL-26).
**Where**: `game/public/style.css`
**Read first**: `game/public/style.css:1-46` (variables), `:146-150` (`button:disabled`), `:1409-1438` (`.equip-button`, accent pattern), `:1790-1870` (`.piece-tile`, gems, refine badge), `:1983-1988` (`.bag-grid`), `:2018-2041` (transfer, `.equip-notice`), `.specs/features/bulk-sell/design.md` section "Screen layout"
**Depends on**: T9
**Requirement**: BSL-10, BSL-12, BSL-14, BSL-17, BSL-26

**Contract** (append after the `.equip-notice` rule, under the header comment `/* The bulk sale: bag header, selection bar, selected and locked tiles */`):

```css
.bag-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bulk-sell-bar { display: flex; flex-direction: column; gap: 8px; padding: 10px 14px; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-surface); }
.bulk-sell-summary { font-family: var(--font-heading); font-size: 15px; }
.bulk-sell-rarities, .bulk-sell-actions, .bulk-sell-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.bulk-sell-rarity { padding: 4px 12px; font-size: 13px; border-left: 4px solid var(--rarity-color); }
.bulk-sell-rarity.rarity-common { --rarity-color: var(--color-neutral-400); }
.bulk-sell-rarity.rarity-uncommon { --rarity-color: #5da048; }
.bulk-sell-rarity.rarity-rare { --rarity-color: #3f8fd1; }
.bulk-sell-rarity.rarity-epic { --rarity-color: #9b59d0; }
.bulk-sell-rarity.rarity-legendary { --rarity-color: #d9a521; }
.bulk-sell-rarity[aria-pressed="true"] { font-weight: 700; background: var(--color-neutral-300); }
.bulk-sell-bar .equip-button:disabled { opacity: 0.5; cursor: not-allowed; }
.bulk-sell-submit, .bulk-sell-yes { color: var(--color-bg); background: var(--color-accent); border-color: transparent; box-shadow: var(--shadow-md); }
.bulk-sell-submit:hover:not(:disabled), .bulk-sell-yes:hover:not(:disabled) { background: var(--color-accent-600); }
.bulk-sell-question { font-size: 15px; font-weight: 700; color: var(--color-accent-800); }
.piece-tile.is-selected { outline: 3px solid var(--color-accent); outline-offset: 6px; transform: translateY(-2px); }
.piece-check { position: absolute; top: -8px; right: -8px; z-index: 3; display: grid; place-items: center; width: 20px; height: 20px; font-size: 13px; font-weight: 800; line-height: 1; color: var(--color-bg); border: 2px solid var(--color-bg); border-radius: 50%; background: var(--color-accent); pointer-events: none; }
.piece-tile.is-locked { opacity: 0.45; cursor: not-allowed; }
```

Write each rule over several lines in the file's existing style (one declaration per line, 4-space indent).

**Steps**:

1. Append the rules above.
2. Run the gate.

**Tests**: none (stylesheet; the matrix says build gate plus the `ui-artist` review)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] `npm run build` succeeds and `npm test` passes.
- [ ] Every class of the design table exists in `style.css`: `bag-header`, `bulk-sell-bar`, `bulk-sell-summary`, `bulk-sell-rarities`, `bulk-sell-actions`, `bulk-sell-confirm`, `bulk-sell-rarity`, `bulk-sell-submit`, `bulk-sell-yes`, `bulk-sell-question`, `is-selected`, `piece-check`, `is-locked`.

**Commit**: `style(game): style the selection mode of the bag`

---

### T12: e2e of the bulk sale [x]

**Owner**: test-engineer
**Goal**: Prove every player-visible criterion in the browser against the fake backend, which learns `POST /equipment/sell` (BSL-10 to BSL-30).
**Where**: `game/e2e/bulkSell.spec.js` (new)
**Also changes**: `game/e2e/support/fakeBackend.js`
**Read first**: `game/e2e/equipmentUi.spec.js:1-40` (fixture `piece`, `startGame`, `openEquipment`), `game/e2e/equipment.spec.js:35,99-110` (`walletText`, sale e2e), `game/e2e/support/fakeBackend.js:1-25` (`problem`, `coins`), `:147-168` (`pieceView`), `:205-222` (`mockBackend` options and returned `calls`), `:593-646` (`handleEquipment`), `:730-740` (`handler`, `calls`)
**Depends on**: T10, T11
**Requirement**: BSL-10 to BSL-30

**Contract** (fake backend, inside `handleEquipment` right after the `GET /equipment` branch, before the `action` regex):

```js
//  POST /equipment/sell { pieceIds }: every listed piece or none (EquipmentController.sellAll)
if (method === 'POST' && path === '/equipment/sell') {
    const ids = body.pieceIds;

    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) { return route.fulfill(problem(400, 'pieceIds must be a list of piece ids')); }
    if (ids.length === 0 || ids.length > 100 || new Set(ids).size !== ids.length) { return route.fulfill(problem(400, 'Invalid sell batch', 'INVALID_SELL_BATCH')); }

    const chosen = ids.map((id) => pieces.find((candidate) => candidate.id === id));

    if (chosen.some((candidate) => !candidate)) { return route.fulfill(problem(404, 'Piece not found', 'EQUIPMENT_NOT_FOUND')); }

    const wallet = walletOf(username);
    const earned = chosen.reduce((sum, candidate) => sum + pieceView(candidate).sellPrice, 0);

    wallet.copper += earned;
    chosen.forEach((candidate) => pieces.splice(pieces.indexOf(candidate), 1));
    return route.fulfill({ json: { equipment: equipmentBody(username), wallet: coins(wallet.copper), sold: chosen.length, earned } });
}
```

e2e fixtures (`bulkSell.spec.js`):

```js
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});
//  Kael wears a rare weapon; the bag holds two commons (100 each), an uncommon (200) and an epic (400)
const PIECES = [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('c1', 'RING', 'COMMON'), piece('c2', 'AMULET', 'COMMON'), piece('u1', 'RING', 'UNCOMMON'), piece('e1', 'ARMOR', 'EPIC') ];
const walletText = (page) => page.locator('.wallet');
const sellCalls = (calls) => calls.filter(({ method, path }) => method === 'POST' && path === '/equipment/sell');
```

`startGame(page, equipment = PIECES)` copies `equipmentUi.spec.js` `startGame` with `wallets: { yan: 50 }` added to `mockBackend` (keep its `cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } }`) and returns `calls` from `const { calls } = await mockBackend(...)`; `openEquipment(page)` clicks `hud-equipment` and waits for `equipment-list` (or `equipment-empty`).

**Steps**:

1. Add the fake backend branch above.
2. Create `bulkSell.spec.js` (`import { expect, test } from './support/coverage'`) with `test.describe('Bulk sell', ...)` and the cases below.
3. Run the gate; then run the whole e2e suite once (`cd game && npx playwright test`) and report any failure outside these three files as "not caused by this task" if it also concerns the owner's uncommitted specs (`farm.spec.js`, `talents.spec.js`).

**Tests**: e2e
**Test cases** (`bulkSell.spec.js`):

- `selects two pieces and sells them in one request`: `startGame`; `openEquipment`; expect `.wallet` `'Gold: 0 Silver: 0 Copper: 50'`; click `bulk-sell-start`; click `equip-piece-c1` and `equip-piece-u1`; expect `bulk-sell-summary` `'Selecionadas: 2 · Total: 3 prata'`; `equip-piece-c1` `aria-pressed` `'true'` and `.piece-check` text `'✓'`; click `bulk-sell-submit`; expect `bulk-sell-question` `'Vender 2 peças por 3 prata?'`; click `bulk-sell-confirm-yes`; expect `equip-sell-notice` `'2 peças vendidas por 3 prata'`, `.equip-bag-title` `'Mochila (2)'`, `equip-piece-c1` and `equip-piece-u1` count 0, `bulk-sell-start` visible, `bulk-sell-bar` count 0, `.wallet` `'Gold: 0 Silver: 3 Copper: 50'`; `sellCalls(calls)` has length 1 and `body.pieceIds` equals `[ 'c1', 'u1' ]`.
- `a click on a tile in selection mode does not open the piece and a second click unselects it`: start; click `bulk-sell-start`; click `equip-piece-e1` → `piece-detail` count 0, summary `'Selecionadas: 1 · Total: 4 prata'`; click `equip-piece-e1` again → summary `'Selecionadas: 0 · Total: 0 cobre'`, `bulk-sell-submit` disabled.
- `worn pieces cannot be selected and Transferir conjunto hides` (needs a second owned hero: `cards: { yan: { copies: { 'kael:0': 1, 'lyra:0': 1 } } }`, as `equipmentUi.spec.js`): before `bulk-sell-start`, `equip-transfer-kael` visible; after it, `equip-slot-kael-WEAPON` disabled and `equip-transfer-kael` count 0.
- `Cancelar leaves selection mode and a click opens the piece again`: select `c1`; click `bulk-sell-cancel` → `bulk-sell-bar` count 0, `bulk-sell-start` visible; click `equip-piece-c1` → `piece-detail` visible.
- `closing the window leaves selection mode`: select `c1`; click `hero-close`; reopen Equipamento → `bulk-sell-bar` count 0, `bulk-sell-start` visible, `equip-piece-c1` has no class `is-selected`.
- `Não keeps the selection and sends nothing`: select `c1`; submit; click `bulk-sell-confirm-no` → `bulk-sell-confirm` count 0, `equip-piece-c1` `aria-pressed` `'true'`, `sellCalls(calls)` length 0.
- `the tiles and the rarity buttons are disabled while the question shows`: select `c1`; submit → `equip-piece-c2` disabled, `bulk-sell-rarity-COMMON` disabled, `bulk-sell-cancel` count 0.
- `a refused sale keeps the pieces and the selection and shows the error`: after `startGame`, `await page.route('**/api/equipment/sell', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }))`; open; start; select `c1` and `u1`; submit; yes → `.hero-error` `'Não foi possível concluir a ação.'`; `equip-piece-c1` visible with `aria-pressed` `'true'`; `bulk-sell-bar` visible; `.wallet` `'Gold: 0 Silver: 0 Copper: 50'`.
- `rarity buttons select and unselect every bag piece of a rarity`: start → `bulk-sell-rarity-LEGENDARY` disabled; click `bulk-sell-rarity-COMMON` → `equip-piece-c1` and `equip-piece-c2` `aria-pressed` `'true'`, `equip-piece-u1` `'false'`, summary `'Selecionadas: 2 · Total: 2 prata'`, `bulk-sell-rarity-COMMON` `aria-pressed` `'true'`; click it again → summary `'Selecionadas: 0 · Total: 0 cobre'`.
- `selling every common takes four clicks`: open; click `bulk-sell-start`, `bulk-sell-rarity-COMMON`, `bulk-sell-submit`, `bulk-sell-confirm-yes` → `equip-sell-notice` `'2 peças vendidas por 2 prata'`, `.equip-bag-title` `'Mochila (2)'`.
- `selling the last bag piece while a hero wears one shows Mochila (0) without Vender várias`: `startGame(page, [ piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('c1', 'RING', 'COMMON') ])`; start; select `c1`; submit; yes → `equip-sell-notice` `'1 peça vendida por 1 prata'`, `.equip-bag-title` `'Mochila (0)'`, `bulk-sell-start` count 0.
- `selling the last piece shows the empty text with the notice`: `startGame(page, [ piece('c1', 'RING', 'COMMON') ])`; start; select `c1`; submit; yes → `equip-sell-notice` `'1 peça vendida por 1 prata'`, `equipment-empty` `'Nenhum equipamento ainda. Vença chefes para encontrar peças.'`.

**Gate**: full - `cd game && npx playwright test e2e/bulkSell.spec.js e2e/equipment.spec.js e2e/equipmentUi.spec.js`
**Done when**:

- [x] The 12 cases of `bulkSell.spec.js` pass, and `equipment.spec.js` and `equipmentUi.spec.js` pass unchanged.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): cover the bulk sale end to end`

---

## UI review fixes

Fixes of the findings #1 to #4 of `.specs/features/bulk-sell/ui-review.html` (the phone scale, finding #5, is out of scope). Owner for all four: game-dev. They run in this order: T13 and T14 touch the same CSS block. Each task is one commit, pushed right after it, and each lists the review finding it closes.

### T13: Compact and sticky selection bar, and the selected tiles

**Owner**: game-dev
**Goal**: At the desktop size of the window the bar takes two short rows (summary and actions on the first, rarity buttons on the second) and stays at the top of the Equipamento window while the bag scrolls, so the second row of bag tiles stays reachable (review finding #1). Two suggestions of the same review are done in the same block: a selected tile keeps full opacity while the question shows, and its outline sits 4 px off the tile.
**Where**: `game/public/style.css`
**Also changes**: `.specs/features/bulk-sell/design.md` (the layout sketch and the rows of the bar and of the selected tile in the design table)
**Read first**: `game/public/style.css:983-990` (`.hero-window`, the scroll area), `:2052-2075` (`.bulk-sell-bar`, groups), `:2131-2136` (`.piece-tile.is-selected`), `game/src/adapters/phaser/views/bulkSellView.js` (DOM order: summary, rarity row, then actions or confirm), `.specs/features/bulk-sell/ui-review.html` (finding #1 and the two suggestions)
**Depends on**: T11
**Requirement**: BSL-12, BSL-15, BSL-21. No criterion of the spec covers the height of the bar: the acceptance is review finding #1 and its "Como deveria ficar".

**Contract** (replace the `.bulk-sell-bar` rule and the summary rule, change the group rule and the selected tile rule, add the disabled rule after the selected tile):

```css
.bulk-sell-bar {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    padding: 8px 14px;
    border: 1px solid var(--color-divider);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
}

.bulk-sell-summary {
    margin-right: auto;
    font-family: var(--font-heading);
    font-size: 15px;
}

.bulk-sell-rarities {
    order: 1;
    flex: 1 0 100%;
}

.bulk-sell-actions,
.bulk-sell-confirm {
    margin-left: auto;
}

.piece-tile.is-selected {
    outline: 3px solid var(--color-accent);
    outline-offset: 4px;
    transform: translateY(-2px);
}

.piece-tile.is-selected:disabled {
    opacity: 1;
}
```

Keep the `display: flex; flex-wrap: wrap; align-items: center; gap: 6px` of `.bulk-sell-rarities`, `.bulk-sell-actions` and `.bulk-sell-confirm` (the shared group rule stays). Write each rule over several lines in the file's existing style (one declaration per line, 4-space indent), with the comment `/* The bulk sale ... */` block unchanged.

**Steps**:

1. Apply the rules above.
2. Run the gate, then check the bar in the browser at 1280x720 with 14 bag pieces: the bar is at most two rows high, and it stays on top while the bag scrolls.
3. Update the design rows that name the old layout (`design.md`, the sketch and the table rows of `.bulk-sell-bar` and of the selected tile).

**Tests**: none (stylesheet; the matrix says build gate plus the `ui-artist` review)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] The bar is two rows at most at the desktop size: summary and actions on one row, rarity buttons on the other.
- [ ] `.bulk-sell-bar` is sticky at the top of `.hero-window` and the bag tiles scroll under it.
- [ ] A selected tile keeps full opacity while the question shows, and its outline is 4 px off the tile.
- [ ] `npm test` and `npm run build` pass, and `npx playwright test e2e/bulkSell.spec.js e2e/equipmentUi.spec.js e2e/equipment.spec.js` still passes.

**Commit**: `style(game): compact and sticky selection bar, tidier selected tiles`

---

### T14: Rarity buttons with a dot and a stronger pressed state

**Owner**: game-dev
**Goal**: Each rarity button shows its rarity as a coloured dot instead of the curved 4 px left border, and a pressed button reads at a glance: a fill at about 25 % of the rarity colour, a 2 px border in that colour and bold text (review finding #2).
**Where**: `game/public/style.css` (`.bulk-sell-rarity`, `.bulk-sell-rarity.rarity-*`, `.bulk-sell-rarity[aria-pressed="true"]`)
**Also changes**: `.specs/features/bulk-sell/design.md` (the rarity button row of the table and its sketch line)
**Read first**: `game/public/style.css:1423-1426` (`.equip-button:hover`), `:2076-2105` (rarity rules), `game/src/adapters/phaser/views/bulkSellView.js` (`rarityButton`: the label is the text, the class is `rarity-<lower>`), `.specs/features/bulk-sell/ui-review.html` (finding #2)
**Depends on**: T13
**Requirement**: BSL-26, BSL-30

**Contract** (replace `.bulk-sell-rarity` and `.bulk-sell-rarity[aria-pressed="true"]`, keep the five `.rarity-*` colour rules):

```css
.bulk-sell-rarity {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px 4px 10px;
    font-size: 13px;
    border: 2px solid var(--color-divider);
}

/* The rarity colour is a dot in front of the label; the thin ring keeps the grey of COMMON visible on the cream */
.bulk-sell-rarity::before {
    content: '';
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--rarity-color);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-text) 35%, transparent);
}

/* Pressed: a quarter of the rarity colour as fill, the whole colour as border, bold. The selector is one level deeper than
   `.equip-button:hover`, so the fill stays while the pointer is on it */
.bulk-sell-bar .bulk-sell-rarity[aria-pressed="true"] {
    font-weight: 700;
    border-color: var(--rarity-color);
    background: color-mix(in srgb, var(--rarity-color) 25%, var(--color-bg));
}
```

The border is 2 px in every state, so a press does not move the labels.

**Steps**:

1. Apply the rules above.
2. Run the gate, then check in the browser: a dot in each colour, the pressed pill clearly tinted with its border, COMMON still visible.
3. Update the design rows of the rarity button (`design.md`: the dot instead of the left border, the pressed state).

**Tests**: none (stylesheet; the matrix says build gate plus the `ui-artist` review)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [ ] Each rarity button shows a dot in its colour and has no left border.
- [ ] A pressed button has a fill near 25 % of its colour, a 2 px border in that colour and bold text; an unpressed one has the same 2 px border width, so nothing moves on press.
- [ ] `npm test` and `npm run build` pass, and the three e2e files still pass.

**Commit**: `style(game): give the rarity buttons a dot and a stronger pressed state`

---

### T15: Hide the piece tooltip in selection mode

**Owner**: game-dev
**Goal**: While selection mode is on no piece tooltip opens, so it never covers the bar (review finding #3). A click on a bag tile still toggles its piece, and outside selection mode the tooltip works as before.
**Where**: `game/src/adapters/phaser/views/equipmentView.js` (`tileOf` inside `renderEquipment`)
**Also changes**: `game/src/adapters/phaser/views/equipmentView.test.js`
**Read first**: `game/src/adapters/phaser/views/equipmentView.js:53-63` (`tileOf`), `:99-106` (`bagTile`), `game/src/adapters/phaser/views/pieceTooltip.js:39-70` (`attachPieceTooltip`), `equipmentView.test.js:101-175` (tooltip tests) and `:250-260` (selection helper), `.specs/features/bulk-sell/ui-review.html` (finding #3)
**Depends on**: T9
**Requirement**: BSL-12, BSL-13. No criterion of the spec covers the tooltip: the acceptance is review finding #3.

**Contract** (`tileOf` in `renderEquipment`; `selection` is already in its scope):

```js
const tileOf = (piece, testid, onClick = onSelect) =>
{
    const tile = renderPieceTile(piece, { testid, onClick });

    //  The tooltip would cover the selection bar, so selection mode attaches none (bag and worn tiles alike)
    if (!selection)
    {
        attachPieceTooltip(tile, piece, heroes);
    }

    return tile;
};
```

**Steps**:

1. Change `tileOf` as above.
2. Add to the `renderEquipment selection mode` describe of `equipmentView.test.js`: `hides the tooltip on hover in selection mode, for a bag tile and for a worn tile`. Select the mode, dispatch `pointerenter` on `equip-piece-r1` (a ring in the bag) and on `equip-slot-kael-WEAPON` (a worn weapon), and expect `[data-testid="piece-tooltip"]` to be null after each.
3. Run the gate.

**Tests**: unit (jsdom)
**Test cases** (`equipmentView.test.js`):

- `renderEquipment selection mode` - `hides the tooltip on hover in selection mode, for a bag tile and for a worn tile`: `renderEquipment([ weapon({ heroId: 'kael' }), ring() ], [ hero('kael'), hero('lyra') ], { onSelect: vi.fn(), selection: selecting() })`; `find(screen, 'equip-piece-r1').dispatchEvent(new Event('pointerenter'))` and the same on `equip-slot-kael-WEAPON`; `find(screen, 'piece-tooltip')` is null after each.
- `renderEquipment tiles and tooltip` (existing): `shows the tooltip of a bag tile on hover` keeps passing outside selection mode.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The new test passes, and the existing tooltip tests pass unchanged.
- [ ] `npm test`, `npm run build` and the three e2e files pass.

**Commit**: `fix(game): hide the piece tooltip in selection mode`

---

### T16: Keep the hero blocks still when selection mode opens

**Owner**: game-dev
**Goal**: The place of `Transferir conjunto` stays in selection mode, so the hero blocks keep their height and the window does not jump when the mode opens (review finding #4). The button itself stays hidden (BSL-17).
**Where**: `game/src/adapters/phaser/views/equipmentView.js` (new `renderTransferSpace`, the heading of each hero in `renderEquipment`), `game/public/style.css` (`.equip-transfer.is-space`)
**Also changes**: `game/src/adapters/phaser/views/equipmentView.test.js`
**Read first**: `game/src/adapters/phaser/views/equipmentView.js:17-37` (`renderTransfer`), `:121-125` (the heading of a hero), `game/src/adapters/phaser/views/dom.js:4-21` (`el`: the attributes object, `testid` becomes `data-testid`; read only), `game/public/style.css:1327-1335` (`.equip-hero`), `:2019-2026` (`.equip-hero-heading`), `.specs/features/bulk-sell/spec.md` (BSL-17), `.specs/features/bulk-sell/ui-review.html` (finding #4)
**Depends on**: T9
**Requirement**: BSL-17

**Contract**:

```js
//  The place of `Transferir conjunto` in selection mode: a hidden copy of the button, with the same size, no test id and out of the tab order,
//  so the hero block keeps its height and the window does not move
const renderTransferSpace = () =>
{
    const box = el('div', 'equip-transfer is-space');
    const ghost = el('button', 'equip-button', 'Transferir conjunto', { type: 'button', tabindex: '-1', disabled: '' });

    ghost.setAttribute('aria-hidden', 'true');
    box.append(ghost);

    return box;
};
```

In `renderEquipment`, the heading of a hero becomes:

```js
if (wearsSomething && owned.length > 1)
{
    heading.append(selection ? renderTransferSpace() : renderTransfer(hero, owned, onTransfer));
}
```

In `style.css`, next to the transfer rules:

```css
/* In selection mode the button is hidden but keeps its box, so the hero block keeps its height */
.equip-transfer.is-space .equip-button {
    visibility: hidden;
}
```

**Steps**:

1. Add `renderTransferSpace` and change the heading as above; add the CSS rule.
2. Add the tests below to `equipmentView.test.js`.
3. Run the gate, then measure in the browser: the `.equip-hero` blocks have the same heights before and after `bulk-sell-start`.

**Tests**: unit (jsdom)
**Test cases** (`equipmentView.test.js`):

- `renderEquipment selection mode` - `keeps the place of Transferir conjunto in selection mode without the button`: `renderEquipment([ weapon({ heroId: 'kael' }), ring() ], [ hero('kael'), hero('lyra') ], { onSelect: vi.fn(), onTransfer: vi.fn(), selection: selecting() })`; `find(screen, 'equip-transfer-kael')` is null; `screen.querySelector('[data-testid="equip-hero-kael"] .equip-transfer.is-space button')` is not null, has `aria-hidden` `'true'` and `disabled` true, and no `data-testid`.
- `renderEquipment transfer` - `outside selection mode the hero shows the real button and no place holder`: `renderEquipment([ weapon({ heroId: 'kael' }) ], [ hero('kael'), hero('lyra') ], { onSelect: vi.fn(), onTransfer: vi.fn() })`; `find(screen, 'equip-transfer-kael').textContent` is `'Transferir conjunto'` and `screen.querySelector('.is-space')` is null.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [ ] The two new tests pass, and the existing transfer tests and `HeroUi.test.js` (`worn tiles are disabled and Transferir conjunto hides in selection mode`) pass unchanged.
- [ ] Measured in the browser at 1280x720: the hero blocks keep their height when selection mode opens.
- [ ] `npm test`, `npm run build` and the three e2e files pass.

**Commit**: `fix(game): keep the hero blocks still when selection mode opens`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → UI review fixes

Phase 1:  T1 → T3
          T2 → T3
          T3 → T4
Phase 2:  T5 → T6
          T7
Phase 3:  T7 → T8 → T9 → T10
          T7 → T9
          T6 → T10
          T9 → T11
Phase 4:  T10 → T12
          T11 → T12
UI review fixes:
          T11 → T13
          T13 → T14
          T9 → T15
          T9 → T16
```

Execution is sequential: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12. Twelve tasks pack into two batches of whole phases (Phases 1-2: 7 tasks; Phases 3-4: 5 tasks), so the orchestrator offers batch sub-agents. The backend batch goes to `kotlin-backend-dev` (T1-T4), the game tasks to `game-dev` (T5-T11), T12 to `test-engineer`; then `ui-artist` reviews the screen and a fresh `test-engineer` runs as the Verifier.

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | 1 value class + 1 exception class | ✅ Granular |
| T2 | 1 function | ✅ Granular |
| T3 | 1 use case interface + 1 service method | ⚠️ Cohesive, one concept (the interface has no other implementer) |
| T4 | 1 endpoint + its IT + 2 ADR lines | ✅ Granular |
| T5 | 1 function | ✅ Granular |
| T6 | 1 function | ✅ Granular |
| T7 | 1 pure module of small functions | ⚠️ Cohesive, one concept |
| T8 | 1 view function | ✅ Granular |
| T9 | 1 function changed (`renderEquipment`) | ✅ Granular |
| T10 | 1 class: one state field and its methods | ⚠️ Cohesive, one concept |
| T11 | 1 stylesheet block | ✅ Granular |
| T12 | 1 e2e file + 1 fake backend branch it needs | ⚠️ Cohesive (merge forward: the fake route has no use without the spec) |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | start of Phase 1 | ✅ Match |
| T2 | None | start of Phase 1 | ✅ Match |
| T3 | T1, T2 | T1 → T3, T2 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | None | start of Phase 2 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | None | Phase 2, no arrow in | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T7, T8 | T7 → T9, T8 → T9 | ✅ Match |
| T10 | T6, T9 | T6 → T10, T9 → T10 | ✅ Match |
| T11 | T9 | T9 → T11 | ✅ Match |
| T12 | T10, T11 | T10 → T12, T11 → T12 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend domain | unit | unit | ✅ OK |
| T3 | Backend use case + service | unit | unit | ✅ OK |
| T4 | Backend web | integration | integration | ✅ OK |
| T5 | Game HTTP adapter | unit | unit | ✅ OK |
| T6 | Game application | unit | unit | ✅ OK |
| T7 | Game domain | unit | unit | ✅ OK |
| T8 | Game view | unit | unit | ✅ OK |
| T9 | Game view | unit | unit | ✅ OK |
| T10 | Game HeroUi | unit | unit | ✅ OK |
| T11 | Stylesheet | none | none | ✅ OK |
| T12 | e2e + fake backend | e2e | e2e | ✅ OK |

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| BSL-01, BSL-02 | T3, T4 |
| BSL-03, BSL-04 | T2, T3, T4 |
| BSL-05 | T1, T3, T4 |
| BSL-06, BSL-07, BSL-09 | T4 |
| BSL-08 | T3, T4 |
| BSL-10, BSL-11 | T9, T11, T12 |
| BSL-12 | T8, T9, T10, T11, T12 |
| BSL-13 | T9, T10, T12 |
| BSL-14 | T7, T9, T10, T11, T12 |
| BSL-15 | T7, T8, T9, T12 |
| BSL-16 | T8, T10, T12 |
| BSL-17 | T9, T10, T11, T12 |
| BSL-18, BSL-19 | T10, T12 |
| BSL-20 | T7, T8, T10, T12 |
| BSL-21 | T8, T9, T10, T12 |
| BSL-22 | T10, T12 |
| BSL-23 | T5, T7, T10, T12 |
| BSL-24 | T6, T7, T9, T10, T12 |
| BSL-25 | T6, T7, T10, T12 |
| BSL-26 | T8, T11, T12 |
| BSL-27, BSL-28 | T7, T10, T12 |
| BSL-29, BSL-30 | T7, T8, T12 |
