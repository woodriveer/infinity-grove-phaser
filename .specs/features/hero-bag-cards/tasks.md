# Hero Bag Cards Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/hero-bag-cards/spec.md`
**Design**: `.specs/features/hero-bag-cards/design.md`
**Status**: Approved on 2026-11-17 (the owner accepted the spec with the recommended answers to Q1 to Q8)

Rules for every task:

- Paths are from the repository root `C:/Users/Internal.IT/Developer/infinity-grove-phaser`. `<pkg>` means `br/com/woodriver/infinity_grove_ws` and `<kt>` means the package `br.com.woodriver.infinity_grove_ws`.
- Read the files under **Read first** before editing. Line numbers drift: locate an edit by the quoted text or test name when the line moved.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`: the working tree holds the owner's uncommitted files (`CLAUDE.md`, `GEMINI.md`, `graphify-out/`, `.agents/`, `.claude/skills/impeccable/`, `.claude/skills/reversa-*/`). No task edits any of them.
- Mark the task `[x]` in this file in the same commit, and set the task's requirement rows in `spec.md` to `Implementing`.
- Push right after the commit: `git pull --rebase origin main && git push origin HEAD:main` (`CLAUDE.md`).
- Never weaken an existing test. A test is changed or removed only where the task lists it by name, because the behaviour it pinned is changed or removed by the spec; every asserted value whose behaviour survives is kept.
- Player-facing text is Portuguese and must match the spec character for character: `★` U+2605, `×` U+00D7, `→` U+2192, `·` U+00B7, `ã`, `õ`, `é` with their accents.
- A failing e2e test outside the files of the task is rerun alone twice with `--workers=1`; it counts as a load flake only when it passes both times (`.specs/STATE.md` § Handoff notes).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e for every player-visible behaviour), product owner rules (unit for service/domain, e2e for every player-visible behaviour), `backend/build.gradle.kts` (JUnit 5, Testcontainers Postgres, ktlint, JaCoCo), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend `game/e2e/support/fakeBackend.js`), skill `kotlin-backend-ddd`; no coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain (`PlayerCards.fuseAll`, `NothingToFuseException`) | unit | Every branch; the five results of BAG-24; BAG-26 | `backend/src/test/kotlin/<pkg>/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service (`HeroService.fuseAll`) | unit (in-memory fakes) | BAG-23, BAG-25, BAG-26, BAG-27; stored state after each refusal | `backend/src/test/kotlin/<pkg>/service/HeroServiceTest.kt` | `cd backend && ./gradlew test` |
| Backend web (`HeroController.fuseAll`) | integration (Testcontainers) | Happy path, 401, 404, 409, the race of BAG-29, BAG-30 | `backend/src/test/kotlin/<pkg>/adapter/web/HeroControllerIT.kt` | `cd backend && ./gradlew test` |
| Game HTTP adapter | unit | Path, body, answer; refusal reaches the caller | `game/src/adapters/http/heroesApi.test.js` | `cd game && npm test` |
| Game application (`heroCollection.fuseAll`) | unit | Hero replaced, listeners fired, refusal keeps the heroes | `game/src/application/heroes/heroCollection.test.js` | `cd game && npm test` |
| Game domain (`bagCards.js`) | unit | Every function with the exact strings and numbers of the spec | `game/src/domain/heroes/bagCards.test.js` | `cd game && npm test` |
| Game views (`bagView.js`, `fusionLadderView.js`, `fusionView.js`) | unit (jsdom) | Every label, test id, attribute and enabled/disabled state the spec names | `game/src/adapters/phaser/views/*.test.js` | `cd game && npm test` |
| Game `HeroUi` | unit (jsdom) | Grid, detail, row fusion, busy, failure, Voltar, late answers, Fundir tudo, HUD | `game/src/adapters/phaser/HeroUi.test.js` | `cd game && npm test` |
| Stylesheet | none | Build gate; geometry checked by e2e (BAG-01, BAG-11) and by the `ui-artist` review against design.md § Layout | `game/public/style.css` | `cd game && npm run build` |
| e2e | e2e (Playwright, fake backend) | Every player-visible criterion BAG-01 to BAG-22, BAG-31 to BAG-39 and the screen edge cases | `game/e2e/*.spec.js` | `cd game && npx playwright test e2e/<file>` |
| UI review artifact (`ui-review.html`, `ui-review/*.shots.js`) | none | Reviewed by the `ui-artist` and read by the product owner at acceptance; not a test of the game | `.specs/features/hero-bag-cards/ui-review.html`, `game/ui-review/*.shots.js` | `cd game && npm run ui:shots -- heroBagCards` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | backend: `cd backend && ./gradlew test --tests '<pattern of the task>'`; game: `cd game && npm test` |
| Full | After tasks with integration or e2e tests | backend: `cd backend && ./gradlew build` (tests + ktlint); game: `cd game && npm test && npx playwright test <files of the task>` |
| Build | After each phase | `cd backend && ./gradlew build` and `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Every arrow is a `Depends on`.

### Phase 1: Backend cascade (kotlin-backend-dev)

```
T1 → T2 → T3
```

### Phase 2: Game data and rules (game-dev)

```
T4 → T5
T6
```

### Phase 3: Game views and styles, not wired yet (game-dev)

```
T7
T6 → T8 → T9 → T10
T6 → T9
T8 → T10
```

### Phase 4: Mochila wiring (game-dev)

```
T8 → T11
T9 → T11
T10 → T11
T11 → T12
T3 → T12
T5 → T12
```

### Phase 5: e2e (test-engineer)

```
T7 → T13
T12 → T13
T12 → T14
T12 → T15
```

### Phase 6: UI review (ui-artist)

```
T13 → T16
T14 → T16
T15 → T16
```

---

## Task Breakdown

### T1: PlayerCards.fuseAll and NothingToFuseException [x]

**Owner**: kotlin-backend-dev
**Goal**: The domain cascade rule: fuse every layer of one hero from 0★ up to 9★ and count the fusions, or refuse with `NOTHING_TO_FUSE` (BAG-23, BAG-24, BAG-25, BAG-26).
**Where**: `backend/src/main/kotlin/<pkg>/domain/PlayerCards.kt`
**Also changes**: `backend/src/main/kotlin/<pkg>/domain/HeroExceptions.kt`, `backend/src/test/kotlin/<pkg>/domain/PlayerCardsTest.kt`, `backend/src/test/kotlin/<pkg>/domain/HeroExceptionsTest.kt`
**Read first**: `domain/PlayerCards.kt:1-89` (whole file: `copiesOf`, `fuse`, `withCopies`, constants, logger), `domain/HeroExceptions.kt:1-50`, `test/.../domain/PlayerCardsTest.kt:1-30` (helpers `started`, `holding`) and `:63-160` (fusion tests, the pattern), `test/.../domain/HeroExceptionsTest.kt` (the pattern of an exception test)
**Depends on**: None
**Requirement**: BAG-23, BAG-24, BAG-25, BAG-26

**Tools**: Skill `kotlin-backend-ddd`

**Contract**:

```kotlin
// HeroExceptions.kt, right after NotEnoughCardsException
class NothingToFuseException(
    heroId: String,
) : HeroConflictException("NOTHING_TO_FUSE", "Hero '$heroId' has no 3 cards of the same stars below 9")

// PlayerCards.kt, top level, right after data class CopyKey
/** The cards after a cascade fusion of one hero and how many fusions it took. */
data class FuseAllOutcome(
    val cards: PlayerCards,
    val fusions: Int,
)

// PlayerCards.kt, inside PlayerCards, right after fun fuse(...)
/**
 * Fuses every layer of [heroId] from 0 stars upward: layer s fuses (its copies plus the copies made from layer s - 1) / 3 times
 * and keeps the rest; the 9-star layer receives the copies made from 8 stars and never fuses.
 */
fun fuseAll(heroId: String): FuseAllOutcome {
    var result = this
    var carry = 0
    var fusions = 0
    for (stars in 0..LAST_FUSIBLE_STARS) {
        val count = copiesOf(heroId, stars) + carry
        carry = count / FUSION_SIZE
        fusions += carry
        result = result.withCopies(heroId, stars, count - carry * FUSION_SIZE)
    }
    if (fusions == 0) {
        logger.warn("Fuse all rejected, nothing to fuse username={} hero={}", username, heroId)
        throw NothingToFuseException(heroId)
    }
    result = result.withCopies(heroId, MAX_STARS, copiesOf(heroId, MAX_STARS) + carry)
    logger.info("Fusing every layer username={} hero={} fusions={}", username, heroId, fusions)
    return FuseAllOutcome(result, fusions)
}
```

`copiesOf` reads `this` (the cards before the cascade) on purpose: layer s is only written at step s.

**Steps**:

1. Add `NothingToFuseException` to `HeroExceptions.kt`.
2. Add `FuseAllOutcome` and `fuseAll` to `PlayerCards.kt`.
3. Add the test cases below to `PlayerCardsTest.kt` (use `PlayerCards("yan", Element.FIRE, "kael", mapOf(...))` to build a bag; a helper `fun bag(vararg layers: Pair<Int, Int>) = PlayerCards("yan", Element.FIRE, "kael", layers.associate { (stars, count) -> CopyKey("kael", stars) to count })` is fine).
4. Add the exception case to `HeroExceptionsTest.kt`.

**Tests**: unit
**Test cases** (`PlayerCardsTest.kt`):

- `fuse all turns 45, 1 and 2 cards of 0, 1 and 2 stars into 1, 1 and 2 cards of 1, 2 and 3 stars in 22 fusions`: bag 0→45, 1→1, 2→2 → `fusions` 22; `cards.copies` == `mapOf(CopyKey("kael",1) to 1, CopyKey("kael",2) to 1, CopyKey("kael",3) to 2)`; `cards.starsOf("kael")` 3.
- `fuse all turns 27 blank cards into one 3-star card in 13 fusions`: bag 0→27 → `fusions` 13; copies == `mapOf(CopyKey("kael",3) to 1)`.
- `fuse all stops at 9 stars and never fuses 9-star cards`: bag 8→7, 9→1 → `fusions` 2; copies == `mapOf(CopyKey("kael",8) to 1, CopyKey("kael",9) to 3)`.
- `fuse all turns 19683 blank cards into one 9-star card in 9841 fusions`: bag 0→19683 → `fusions` 9841; copies == `mapOf(CopyKey("kael",9) to 1)`.
- `fuse all of three 3-star cards makes one 4-star card in one fusion`: bag 3→3 → `fusions` 1; copies == `mapOf(CopyKey("kael",4) to 1)`.
- `fuse all leaves the cards of every other hero, the leader and the boss record untouched`: `PlayerCards("yan", Element.FIRE, "kael", mapOf(CopyKey("kael",0) to 3, CopyKey("lyra",0) to 5))` → `cards.copiesOf("lyra",0)` 5; `cards.leaderId` "kael"; `cards.bosses` equals the input's `bosses`.
- `fuse all with fewer than 3 cards on every layer below 9 is refused`: bag 0→2, 1→2, 9→4 → `assertFailsWith<NothingToFuseException>`; exception `code` "NOTHING_TO_FUSE".
- `fuse all of a hero not owned is refused`: bag 0→3 (kael), call `fuseAll("lyra")` → `NothingToFuseException`.

Test case (`HeroExceptionsTest.kt`):

- `nothing to fuse is a 409 conflict with code NOTHING_TO_FUSE`: `NothingToFuseException("kael")` is a `HeroConflictException`, `code` "NOTHING_TO_FUSE", `message` "Hero 'kael' has no 3 cards of the same stars below 9".

**Gate**: quick - `cd backend && ./gradlew test --tests '*PlayerCardsTest*' --tests '*HeroExceptionsTest*'`
**Done when**:

- [x] The 9 new cases pass and every earlier case of both files passes unchanged.
- [x] `cd backend && ./gradlew ktlintCheck` passes.

**Commit**: `feat(backend): add the cascade fusion rule to PlayerCards`

---

### T2: FuseAllCardsUseCase and HeroService.fuseAll [x]

**Owner**: kotlin-backend-dev
**Goal**: The service runs the cascade under the `player_cards` row lock, stores it and returns the hero with the fusion count (BAG-23, BAG-26, BAG-27).
**Where**: `backend/src/main/kotlin/<pkg>/service/HeroService.kt`
**Also changes**: `backend/src/main/kotlin/<pkg>/usecase/HeroUseCase.kt`, `backend/src/main/kotlin/<pkg>/domain/HeroView.kt`, `backend/src/test/kotlin/<pkg>/service/HeroServiceTest.kt`
**Read first**: `service/HeroService.kt:1-80` (`fuse`, `requireHero`, `load`), `usecase/HeroUseCase.kt:1-26`, `domain/HeroView.kt:20-55`, `test/.../service/HeroServiceTest.kt:1-40` (fixture `player`), `:105-165` (fuse tests)
**Depends on**: T1
**Requirement**: BAG-23, BAG-26, BAG-27

**Tools**: Skill `kotlin-backend-ddd`

**Contract**:

```kotlin
// HeroView.kt, after data class HeroView
/** The hero after a cascade fusion and the number of fusions it took. */
data class FuseAllView(
    val hero: HeroView,
    val fusions: Int,
)

// HeroUseCase.kt, after FuseCardsUseCase (also fix the KDoc of FuseCardsUseCase.fuse: "(0 to 2)" becomes "(0 to 8)")
interface FuseAllCardsUseCase {
    /** Fuses every layer of [heroId] from 0 stars up to 9 as far as the copies go and returns the hero and the number of fusions. */
    fun fuseAll(
        username: String,
        heroId: String,
    ): FuseAllView
}

// HeroService.kt: the class also implements FuseAllCardsUseCase
override fun fuseAll(
    username: String,
    heroId: String,
): FuseAllView {
    logger.info("Fuse all requested username={} hero={}", username, heroId)
    val hero = requireHero(heroId)
    val outcome = load(username).fuseAll(heroId)
    playerCardsRepository.save(outcome.cards)
    return FuseAllView(HeroView.of(hero, outcome.cards), outcome.fusions)
}
```

**Steps**:

1. Add `FuseAllView`, `FuseAllCardsUseCase` and fix the `fuse` KDoc.
2. Add `FuseAllCardsUseCase` to the `HeroService` supertypes and the method.
3. Add the cases below to `HeroServiceTest.kt` (`player(extra = mapOf(...))` replaces the starting `kael:0` count when the key is `CopyKey("kael", 0)`).

**Tests**: unit
**Test cases** (`HeroServiceTest.kt`):

- `fuse all stores the cascade and returns the hero with the fusion count`: `player(extra = mapOf(CopyKey("kael",0) to 45, CopyKey("kael",1) to 1, CopyKey("kael",2) to 2))`; `service.fuseAll("yan","kael")` → `fusions` 22; `hero.stars` 3; `hero.copies` == `mapOf(0 to 0, 1 to 1, 2 to 1, 3 to 2, 4 to 0, 5 to 0, 6 to 0, 7 to 0, 8 to 0, 9 to 0)`; `cards.cards.getValue("yan").copies` == `mapOf(CopyKey("kael",1) to 1, CopyKey("kael",2) to 1, CopyKey("kael",3) to 2)`.
- `fuse all of three 3-star cards returns a 4-star hero with levels 2, 1 and 1`: `player(extra = mapOf(CopyKey("kael",3) to 3))` (Kael also keeps his starting blank card) → `fusions` 1; `hero.stars` 4; `hero.skills.map { it.level }` == `listOf(2, 1, 1)`.
- `fuse all with nothing to fuse leaves the bag unchanged`: `player()` (one blank Kael) → `assertFailsWith<NothingToFuseException>`; stored copies == `mapOf(CopyKey("kael",0) to 1)`.
- `fuse all of an unknown hero fails and leaves the bag unchanged`: `player(extra = mapOf(CopyKey("kael",0) to 3))`; `fuseAll("yan","ghost")` → `HeroNotFoundException`; stored copies == `mapOf(CopyKey("kael",0) to 3)`.
- `fuse all for an unknown user fails`: no `player()`; `fuseAll("nobody","kael")` → `UserNotFoundException`.
- `fuse all is logged with the player and the hero`: with `LogCapture` as in `a fusion is logged with the player, the hero and the stars` → a line containing `Fuse all requested username=yan hero=kael` and one containing `fusions=1` (bag `kael:0` 3).

**Gate**: quick - `cd backend && ./gradlew test --tests '*HeroServiceTest*'`
**Done when**:

- [x] The 6 new cases pass and every earlier `HeroServiceTest` case passes unchanged.
- [x] `cd backend && ./gradlew ktlintCheck` passes.

**Commit**: `feat(backend): fuse every layer of a hero in HeroService`

---

### T3: POST /heroes/{id}/fuse-all endpoint [x]

**Owner**: kotlin-backend-dev
**Goal**: Expose the cascade as `POST /heroes/{id}/fuse-all` answering `{ hero, fusions }` (BAG-23 to BAG-30).
**Where**: `backend/src/main/kotlin/<pkg>/adapter/web/HeroController.kt`
**Also changes**: `backend/src/test/kotlin/<pkg>/adapter/web/HeroControllerIT.kt`
**Read first**: `adapter/web/HeroController.kt:1-115`, `test/.../adapter/web/HeroControllerIT.kt:1-60` (helpers `register`, `asUser`, `give`, `fuse`), `:200-245` (401 test and the race test, the pattern), `:261-330` (4-star fusion tests)
**Depends on**: T2
**Requirement**: BAG-23, BAG-24, BAG-25, BAG-26, BAG-27, BAG-28, BAG-29, BAG-30

**Tools**: Skill `kotlin-backend-ddd`

**Contract**:

```kotlin
data class FuseAllResponse(
    val hero: HeroResponse,
    val fusions: Int,
)

// constructor gains: private val fuseAllCards: FuseAllCardsUseCase,
@PostMapping("/heroes/{id}/fuse-all")
fun fuseAll(
    principal: Principal,
    @PathVariable id: String,
): FuseAllResponse {
    val result = fuseAllCards.fuseAll(principal.name, id)
    return FuseAllResponse(HeroResponse.from(result.hero), result.fusions)
}
```

No request body is read. `NothingToFuseException` (409) and `HeroNotFoundException` (404) are mapped by the existing `ApiExceptionHandler`; do not touch it or `SecurityConfig`. No Flyway migration.

**Steps**:

1. Add `FuseAllResponse`, the constructor parameter and the handler.
2. In `HeroControllerIT.kt` add `private fun fuseAll(token: String, heroId: String): Response = asUser(token).contentType(ContentType.JSON).body("{}").post("/heroes/$heroId/fuse-all")`.
3. Add the cases below. Read the stored bag with `jpaCardCopyRepository.findAllByUsername("yan").associate { it.stars to it.copies }` filtered to `heroId == "kael"` when the entity has it (see how the race test reads it).

**Tests**: integration
**Test cases** (`HeroControllerIT.kt`):

- `fuse all answers the hero and 22 fusions for 45, 1 and 2 cards of 0, 1 and 2 stars`: `register()`; `give("yan","kael",0,45)`, `give("yan","kael",1,1)`, `give("yan","kael",2,2)`; `fuseAll` → 200; `fusions` 22; `hero.id` "kael"; `hero.stars` 3; `hero.copies.0` 0, `hero.copies.1` 1, `hero.copies.2` 1, `hero.copies.3` 2; stored Kael copies == `mapOf(1 to 1, 2 to 1, 3 to 2)`.
- `fuse all of 19683 blank cards answers one 9-star card and 9841 fusions`: `give("yan","kael",0,19683)` → 200; `fusions` 9841; `hero.stars` 9; `hero.skills.level` == `[3, 3, 3]`; stored Kael copies == `mapOf(9 to 1)`.
- `fuse all leaves the wallet, the leader and the other heroes unchanged`: `register()`; `give("yan","kael",0,3)`; `give("yan","lyra",0,5)`; read the wallet copper before; `fuseAll` → 200; `GET /heroes` → `leaderId` "kael", lyra `copies.0` 5; wallet copper unchanged (as `a 3-star fusion leaves the wallet, the leader and the other copies unchanged` reads it).
- `fuse all with nothing to fuse answers 409 NOTHING_TO_FUSE and keeps the bag`: `register()` (one blank Kael) → 409, `code` "NOTHING_TO_FUSE"; stored Kael copies == `mapOf(0 to 1)`.
- `fuse all of an unknown hero answers 404 HERO_NOT_FOUND`: `fuseAll(token, "ghost")` → 404, `code` "HERO_NOT_FOUND".
- `fuse all answers 401 without a token`: `given().contentType(ContentType.JSON).body("{}").post("/heroes/kael/fuse-all")` → 401.
- `two simultaneous fuse all of the same three cards give exactly one 200 and one 409`: copy the race test with `give("yan","kael",0,3)` and `fuseAll` → statuses `[200, 409]`; stored Kael copies == `mapOf(1 to 1)`.
- Every existing `fuse` test of the file passes unchanged (BAG-30).

**Gate**: full - `cd backend && ./gradlew build`
**Done when**:

- [x] The 7 new cases pass; every earlier `HeroControllerIT` case passes unchanged.
- [x] `./gradlew build` (tests + ktlint) passes.
- [x] No file under `backend/src/main/resources/db/migration` is added or changed.

**Commit**: `feat(backend): add POST /heroes/{id}/fuse-all`

---

### T4: heroesApi.fuseAll [x]

**Owner**: game-dev
**Goal**: The HTTP adapter posts the cascade and returns `{ hero, fusions }` (BAG-35).
**Where**: `game/src/adapters/http/heroesApi.js`
**Also changes**: `game/src/adapters/http/heroesApi.test.js`
**Read first**: `game/src/adapters/http/heroesApi.js:1-12`, `game/src/adapters/http/heroesApi.test.js` (the `fuse` cases, the pattern)
**Depends on**: None
**Requirement**: BAG-35

**Contract**:

```js
//  fuseAll(heroId) -> { hero, fusions }: every layer of the hero fused from 0 stars up to 9 in one request.
//  A 409 (NOTHING_TO_FUSE) or 404 (HERO_NOT_FOUND) rejects with an ApiError.
fuseAll: async (heroId) => (await httpClient.post(`/heroes/${encodeURIComponent(heroId)}/fuse-all`, {})).data,
```

Add it after `fuse` and extend the comment block at the top of the file.

**Tests**: unit
**Test cases** (`heroesApi.test.js`, with the same fake `httpClient` as the `fuse` cases):

- `fuseAll posts an empty body to /heroes/<id>/fuse-all and resolves with hero and fusions`: post resolves `{ data: { hero: { id: 'kael', stars: 3 }, fusions: 22 } }` → `post` called with `'/heroes/kael/fuse-all'` and `{}`; result `{ hero: { id: 'kael', stars: 3 }, fusions: 22 }`.
- `fuseAll encodes the hero id`: `fuseAll('a b')` → path `'/heroes/a%20b/fuse-all'`.
- `fuseAll rejects with the error of the client`: post rejects `new ApiError('x', { status: 409, code: 'NOTHING_TO_FUSE' })` → the promise rejects with that error.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 3 new cases pass; every other game unit test passes.

**Commit**: `feat(game): add the fuse-all call to the heroes API`

---

### T5: heroCollection.fuseAll [x]

**Owner**: game-dev
**Goal**: The collection replaces the fused hero, fires its listeners (skill bar) and resolves with `{ hero, fusions }` (BAG-21, BAG-35).
**Where**: `game/src/application/heroes/heroCollection.js`
**Also changes**: `game/src/application/heroes/heroCollection.test.js`
**Read first**: `game/src/application/heroes/heroCollection.js:1-80`, `heroCollection.test.js` (the `fuse` cases)
**Depends on**: T4
**Requirement**: BAG-21, BAG-35

**Contract** (after `fuse`; also add `fuseAll(heroId)` to the port comment at the top: `fuseAll -> { hero, fusions }`):

```js
//  Fuses every layer of a hero from 0 stars up; resolves with { hero, fusions }. A refusal rejects and keeps the heroes.
fuseAll: async (heroId) =>
{
    const { hero, fusions } = await gateway.fuseAll(heroId);

    heroes = heroes.map((candidate) => (candidate.id === hero.id ? hero : candidate));
    changed();

    return { hero, fusions };
},
```

**Tests**: unit
**Test cases** (`heroCollection.test.js`):

- `fuseAll replaces the hero, fires the listeners and resolves with hero and fusions`: loaded with kael `{ copies: { 0: 3 } }` and lyra; gateway `fuseAll` resolves `{ hero: { id: 'kael', stars: 1, copies: { 1: 1 } }, fusions: 1 }`; a listener registered with `onChange` → `fuseAll('kael')` resolves `{ hero: {...}, fusions: 1 }`; `heroes()[0].stars` 1; lyra unchanged; listener called 1 time after the load's call.
- `fuseAll that fails keeps the heroes and fires nothing`: gateway rejects → `await expect(collection.fuseAll('kael')).rejects` with the error; `heroes()` equals the list before; the listener count did not grow.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 2 new cases pass; every other game unit test passes.

**Commit**: `feat(game): fuse every layer of a hero in the hero collection`

---

### T6: Bag card and ladder rules (domain/heroes/bagCards.js) [x]

**Owner**: game-dev
**Goal**: Every number and text the cards, the ladder and Fundir tudo show, as pure functions (BAG-05, BAG-07, BAG-08, BAG-13, BAG-14, BAG-15, BAG-16, BAG-31, BAG-32, BAG-35, BAG-36).
**Where**: `game/src/domain/heroes/bagCards.js` (new)
**Also changes**: `game/src/domain/heroes/bagCards.test.js` (new)
**Read first**: `game/src/domain/heroes/heroes.js:1-57`, `game/src/domain/skills/skillLevel.js:1-35`, `game/src/domain/heroes/heroes.test.js` (style)
**Depends on**: None
**Requirement**: BAG-05, BAG-07, BAG-08, BAG-13, BAG-14, BAG-15, BAG-16, BAG-31, BAG-32, BAG-35, BAG-36

**Contract**:

```js
import { skillLevelOf } from '../skills/skillLevel';
import { ASCENDED_FROM, copiesOf, EXALTED_FROM, FUSION_SIZE, MAX_STARS } from './heroes';

//  The rules of the Mochila cards and the fusion ladder (spec hero-bag-cards). Pure JavaScript: no Phaser, no DOM.
const LAYERS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const LAST_FUSIBLE = MAX_STARS - 1;

//  'wood' for 0 to 3 stars, 'silver' for 4 to 6, 'gold' for 7 to 9
export const frameTier = (stars) => (stars >= EXALTED_FROM ? 'gold' : stars >= ASCENDED_FROM ? 'silver' : 'wood');

//  Every layer the hero holds at least one copy of, ascending: [ { stars, copies } ]
export const copyLayers = (hero) => LAYERS.filter((stars) => copiesOf(hero, stars) >= 1).map((stars) => ({ stars, copies: copiesOf(hero, stars) }));

//  True when a layer from 0 to 8 holds 3 or more copies
export const canFuseAny = (hero) => LAYERS.some((stars) => stars <= LAST_FUSIBLE && copiesOf(hero, stars) >= FUSION_SIZE);

//  '0★×45'
export const chipText = ({ stars, copies }) => `${stars}★×${copies}`;

//  The ladder rows: the held layers plus the layer above the highest one when that one can fuse now
export const ladderRows = (hero) =>
{
    const layers = copyLayers(hero);
    const top = layers.at(-1);

    if (top && top.stars <= LAST_FUSIBLE && top.copies >= FUSION_SIZE)
    {
        layers.push({ stars: top.stars + 1, copies: 0 });
    }

    return layers.map(({ stars, copies }) => ({
        stars, copies, filled: Math.min(copies, FUSION_SIZE), canFuse: stars <= LAST_FUSIBLE && copies >= FUSION_SIZE, isMax: stars === MAX_STARS
    }));
};

//  The inline width of the bar fill for 0 to 3 filled copies
const BAR_WIDTHS = [ '0%', '33.333%', '66.667%', '100%' ];
export const barWidth = (filled) => BAR_WIDTHS[filled];

//  The cascade of Fundir tudo: { fusions, after: { 0: n, ..., 9: n } } (the backend rule of PlayerCards.fuseAll)
export const cascade = (hero) =>
{
    const after = {};
    let carry = 0;
    let fusions = 0;

    LAYERS.forEach((stars) =>
    {
        const count = copiesOf(hero, stars) + carry;

        if (stars === MAX_STARS)
        {
            after[stars] = count;

            return;
        }
        carry = Math.floor(count / FUSION_SIZE);
        fusions += carry;
        after[stars] = count - carry * FUSION_SIZE;
    });

    return { fusions, after };
};

//  '45×0★ + 1×1★ + 2×2★' from [ { stars, copies } ]; layers with 0 copies are left out
export const layersText = (layers) => layers.filter(({ copies }) => copies >= 1).map(({ stars, copies }) => `${copies}×${stars}★`).join(' + ');

//  '45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★'
export const previewText = (hero) =>
{
    const { after } = cascade(hero);

    return `${layersText(copyLayers(hero))} → ${layersText(LAYERS.map((stars) => ({ stars, copies: after[stars] })))}`;
};

//  'Fazer 22 fusões?' / 'Fazer 1 fusão?'
export const fuseAllQuestion = (fusions) => `Fazer ${fusions} ${fusions === 1 ? 'fusão' : 'fusões'}?`;

//  The skills a cascade raised: level after >= 2 and higher than before, in slot order: [ { name, level } ]
export const raisedSkills = (before = [], after = []) => after
    .filter((skill) =>
    {
        const old = before.find((candidate) => candidate.slot === skill.slot);

        return skillLevelOf(skill) >= 2 && skillLevelOf(skill) > skillLevelOf(old);
    })
    .sort((a, b) => a.slot - b.slot)
    .map((skill) => ({ name: skill.name, level: skillLevelOf(skill) }));

//  '22 fusões. Melhor carta: Kael Raizférrea 3★' plus ' · <skill> no nível <level>' per raised skill
export const fuseAllResultText = ({ heroName, fusions, stars, raised = [] }) =>
    `${fusions} ${fusions === 1 ? 'fusão' : 'fusões'}. Melhor carta: ${heroName} ${stars}★${raised.map(({ name, level }) => ` · ${name} no nível ${level}`).join('')}`;
```

**Tests**: unit
**Test cases** (`bagCards.test.js`; fixture `const hero = (copies, skills = []) => ({ id: 'kael', name: 'Kael', copies, skills })`; `const skill = (slot, level, unlocked = true) => ({ slot, name: `Skill ${slot}`, unlocked, level })`):

- `frameTier`: 0 → `'wood'`, 3 → `'wood'`, 4 → `'silver'`, 6 → `'silver'`, 7 → `'gold'`, 9 → `'gold'`.
- `copyLayers`: `{ 0: 45, 1: 1, 2: 2, 3: 0 }` → `[ { stars: 0, copies: 45 }, { stars: 1, copies: 1 }, { stars: 2, copies: 2 } ]`; `{}` → `[]`.
- `canFuseAny`: `{ 0: 3 }` → true; `{ 0: 2, 1: 2 }` → false; `{ 8: 3 }` → true; `{ 9: 5 }` → false.
- `chipText`: `{ stars: 0, copies: 45 }` → `'0★×45'`.
- `ladderRows of 45, 1 and 2 copies has the rows 0, 1 and 2`: stars `[0, 1, 2]`; copies `[45, 1, 2]`; filled `[3, 1, 2]`; canFuse `[true, false, false]`; isMax all false.
- `ladderRows of 3 blank copies adds the 1-star row with 0 copies`: stars `[0, 1]`; row 1 `{ copies: 0, filled: 0, canFuse: false }`.
- `ladderRows of 2 blank copies adds no row`: stars `[0]`.
- `ladderRows of one 9-star copy is the 9-star row only`: `[ { stars: 9, copies: 1, filled: 1, canFuse: false, isMax: true } ]`.
- `ladderRows of 3 copies of 8 stars adds the 9-star row`: stars `[8, 9]`; row 9 `isMax` true, copies 0.
- `barWidth`: 0 → `'0%'`, 1 → `'33.333%'`, 2 → `'66.667%'`, 3 → `'100%'`.
- `cascade of 45, 1 and 2 copies`: `fusions` 22; `after` `{ 0: 0, 1: 1, 2: 1, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }`.
- `cascade of 27 blank copies`: `fusions` 13; `after[3]` 1, every other layer 0.
- `cascade stops at 9 stars`: `{ 8: 7, 9: 1 }` → `fusions` 2; `after[8]` 1; `after[9]` 3.
- `cascade of 19683 blank copies`: `fusions` 9841; `after[9]` 1.
- `layersText` of `[ { stars: 0, copies: 45 }, { stars: 1, copies: 0 }, { stars: 2, copies: 2 } ]` → `'45×0★ + 2×2★'`.
- `previewText of 45, 1 and 2 copies`: `'45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★'`.
- `fuseAllQuestion`: 22 → `'Fazer 22 fusões?'`; 1 → `'Fazer 1 fusão?'`.
- `raisedSkills names the skills raised to level 2 or more`: before `[skill(1,1), skill(2,1), skill(3,1)]`, after `[skill(1,2), skill(2,2), skill(3,1)]` → `[ { name: 'Skill 1', level: 2 }, { name: 'Skill 2', level: 2 } ]`.
- `raisedSkills ignores a skill unlocked at level 1`: before `[skill(1,0,false)]`, after `[skill(1,1)]` → `[]`.
- `raisedSkills counts a skill unlocked straight at level 2`: before `[skill(1,0,false)]`, after `[skill(1,2)]` → `[ { name: 'Skill 1', level: 2 } ]`.
- `fuseAllResultText`: `{ heroName: 'Kael Raizférrea', fusions: 22, stars: 3 }` → `'22 fusões. Melhor carta: Kael Raizférrea 3★'`; `{ heroName: 'Kael Raizférrea', fusions: 1, stars: 1 }` → `'1 fusão. Melhor carta: Kael Raizférrea 1★'`; `{ heroName: 'Kael Raizférrea', fusions: 4, stars: 5, raised: [ { name: 'Corte Dimensional', level: 2 }, { name: 'Investida do Baluarte', level: 2 } ] }` → `'4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 22 cases pass; the hexagonal import test of the game still passes (`bagCards.js` imports only from `domain/`).

**Commit**: `feat(game): add the bag card and fusion ladder rules`

---

### T7: Center the rarity gems on the item tiles [x]

**Owner**: game-dev
**Goal**: The gem row of every piece tile sits centered on the top edge (BAG-01, BAG-02).
**Where**: `game/public/style.css`
**Read first**: `game/public/style.css:2165-2215` (`.piece-tile`, `.piece-gems`, `.piece-gem`, `.piece-refine`), `game/src/adapters/phaser/views/pieceTile.js:14-46`
**Depends on**: None
**Requirement**: BAG-01, BAG-02

**Contract**: the `.piece-gems` rule becomes exactly

```css
.piece-gems {
    position: absolute;
    top: -5px;
    left: 50%;
    display: flex;
    gap: 2px;
    transform: translateX(-50%);
    pointer-events: none;
}
```

Nothing else in the file changes: `.piece-gem`, `.piece-refine`, `.piece-tile` and the rarity rules stay as they are.

**Steps**:

1. Replace `left: 4px;` with `left: 50%;` and add `transform: translateX(-50%);` in `.piece-gems`.
2. `cd game && npm run build`.

**Tests**: none (stylesheet; the e2e of BAG-01 and BAG-02 is in T13)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] `git diff game/public/style.css` shows only the two lines of `.piece-gems`.
- [x] `npm test` and `npm run build` pass.

**Commit**: `fix(game): center the rarity gems on the item tiles`

---

### T8: Hero cards view (views/bagView.js) [x]

**Owner**: game-dev
**Goal**: Draw one framed card per hero and the card grid, as new exports next to the old ones (not wired yet) (BAG-03 to BAG-10).
**Where**: `game/src/adapters/phaser/views/bagView.js`
**Also changes**: `game/src/adapters/phaser/views/bagView.test.js`
**Read first**: `game/src/adapters/phaser/views/bagView.js:1-55`, `game/src/adapters/phaser/views/dom.js:1-32` (`el`, `sprite`, `starsText`), `game/src/adapters/phaser/views/catalogView.js:48-68` (`renderCatalog`, the grey hero), `game/src/adapters/phaser/views/bagView.test.js` (style), `.specs/features/hero-bag-cards/design.md` § Card
**Depends on**: T6
**Requirement**: BAG-03, BAG-04, BAG-05, BAG-06, BAG-07, BAG-08, BAG-09, BAG-10

**Contract** (add to `bagView.js`; keep `renderBag` and `renderBagEntry` until T11):

```js
import { canFuseAny, chipText, copyLayers, frameTier } from '../../../domain/heroes/bagCards';
import { starsClass } from '../../../domain/heroes/heroes';
import { el, sprite, starsText } from './dom';

//  One hero as a framed card: star badge on the top edge, art, name ribbon, a chip per star layer and the Fundir badge.
//  With `onSelect` it is a button (the grid); without, a div (the copy in the hero detail). A hero not owned is grey and disabled.
export const renderHeroCard = (hero, { onSelect = null, testid = `bag-card-${hero.id}` } = {}) =>
{
    const tier = hero.owned ? frameTier(hero.stars) : 'wood';
    const classes = [ 'bag-card', `frame-${tier}`, hero.owned ? '' : 'is-grey' ].filter(Boolean).join(' ');
    const card = onSelect
        ? el('button', classes, '', { type: 'button', testid, 'data-frame': tier })
        : el('div', classes, '', { testid, 'data-frame': tier });

    if (hero.owned)
    {
        card.append(el('span', [ 'bag-card-star', 'hero-stars', starsClass(hero.stars) ].filter(Boolean).join(' '), starsText(hero.stars), { testid: `bag-card-star-${hero.id}` }));
    }

    card.append(sprite(hero.id, hero.name, 'bag-card-portrait'), el('span', 'bag-card-ribbon', hero.name));

    if (hero.owned)
    {
        const chips = el('span', 'bag-card-chips');

        copyLayers(hero).forEach((layer) => chips.append(el('span', 'bag-card-chip', chipText(layer))));
        card.append(chips);

        if (canFuseAny(hero))
        {
            card.append(el('span', 'bag-card-fuse', 'Fundir', { testid: `bag-card-fuse-${hero.id}` }));
        }
    }
    else
    {
        card.append(el('span', 'bag-card-missing', 'Não encontrado'));
    }

    if (onSelect)
    {
        if (hero.owned)
        {
            card.addEventListener('click', () => onSelect(hero));
        }
        else
        {
            card.disabled = true;
        }
    }

    return card;
};

//  The Mochila: one card per hero in payload order; `onSelect(hero)` fires on the card of an owned hero
export const renderBagCards = (heroes, { onSelect }) =>
{
    if (heroes.length === 0)
    {
        return el('p', 'hero-empty', 'A mochila está vazia.', { testid: 'bag-empty' });
    }

    const grid = el('div', 'bag-cards', '', { testid: 'bag-list' });

    heroes.forEach((hero) => grid.append(renderHeroCard(hero, { onSelect })));

    return grid;
};
```

Merge the imports with the existing ones of the file (one import line per module).

**Tests**: unit
**Test cases** (`bagView.test.js`, new `describe('renderBagCards')` and `describe('renderHeroCard')`; fixture `const heroOf = (id, copies, stars, owned = true) => ({ id, name: `Hero ${id}`, owned, stars, copies, skills: [] })`):

- `draws one card per hero in payload order`: heroes kael, lyra, orina → `bag-list` children testids `[ 'bag-card-kael', 'bag-card-lyra', 'bag-card-orina' ]`; no `[data-testid^="bag-entry-"]`.
- `an owned card shows the best star, the sprite, the name and one chip per layer`: kael `{ 0: 45, 1: 1, 2: 2 }`, stars 2 → `bag-card-star-kael` text `'2★'`; `img.bag-card-portrait` `src` ends with `'assets/heroes/kael_sprite.png'`; `.bag-card-ribbon` text `'Hero kael'`; `.bag-card-chip` texts `[ '0★×45', '1★×1', '2★×2' ]`.
- `the frame follows the best star`: stars 3 → `data-frame` `'wood'` and class `frame-wood`; 4 → `'silver'`/`frame-silver`; 6 → `'silver'`; 7 → `'gold'`/`frame-gold`; 9 → `'gold'`.
- `the star badge carries the AD-020 tier class`: stars 3 → badge classes contain `hero-stars` and neither `is-ascended` nor `is-exalted`; 5 → `is-ascended`; 8 → `is-exalted`.
- `the Fundir badge shows while a layer below 9 holds 3 copies`: `{ 0: 3 }` → `bag-card-fuse-kael` text `'Fundir'`; `{ 0: 2, 1: 2 }` → `null`; `{ 9: 4 }` (stars 9) → `null`.
- `a hero not owned is a disabled grey wood card with Não encontrado`: vex `{}` stars 0 owned false → `disabled` true; class `is-grey`; `data-frame` `'wood'`; `.bag-card-missing` text `'Não encontrado'`; `bag-card-star-vex` null; `.bag-card-chip` count 0; `bag-card-fuse-vex` null.
- `a click on an owned card calls onSelect with the hero and a disabled card calls nothing`: `onSelect = vi.fn()`; click kael → called once with the kael object; `vex.click()` (disabled) → still 1 call.
- `without onSelect the card is a div with the given testid`: `renderHeroCard(kael, { testid: 'bag-detail-card-kael' })` → `tagName` `'DIV'`, `data-testid` `'bag-detail-card-kael'`.
- `an empty payload says the bag is empty`: `renderBagCards([], { onSelect })` → testid `bag-empty`, text `'A mochila está vazia.'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 9 new cases pass; the existing `renderBag`, `renderBagEntry` and `bag cards of 4 to 9 stars` cases pass unchanged.

**Commit**: `feat(game): draw the hero cards of the Mochila`

---

### T9: Hero detail with the fusion ladder (views/fusionLadderView.js) [x]

**Owner**: game-dev
**Goal**: Draw the hero detail: card, ladder rows, Fundir tudo, its confirmation, the result slot and the skills (BAG-12 to BAG-16, BAG-18, BAG-31 to BAG-34).
**Where**: `game/src/adapters/phaser/views/fusionLadderView.js` (new)
**Also changes**: `game/src/adapters/phaser/views/fusionLadderView.test.js` (new)
**Read first**: `game/src/adapters/phaser/views/fusionView.js:1-38`, `game/src/adapters/phaser/views/catalogView.js:38-46` (`renderSkillList`), `game/src/adapters/phaser/views/bagView.js` (`renderHeroCard` of T8), `game/src/domain/heroes/bagCards.js` (T6), `.specs/features/hero-bag-cards/design.md` § Hero detail, § Ladder row, § Fundir tudo
**Depends on**: T6, T8
**Requirement**: BAG-12, BAG-13, BAG-14, BAG-15, BAG-16, BAG-18, BAG-31, BAG-32, BAG-33, BAG-34

**Contract**:

```js
import { barWidth, canFuseAny, cascade, fuseAllQuestion, fuseAllResultText, ladderRows, previewText } from '../../../domain/heroes/bagCards';
import { starsClass } from '../../../domain/heroes/heroes';
import { renderHeroCard } from './bagView';
import { renderSkillList } from './catalogView';
import { el, starsText } from './dom';

const MAX_TEXT = 'Estrela máxima: não pode ser fundida';

//  One ladder row: name, bar, count and the s★→s+1★ button; the 9-star row has the copies and the max text instead
const renderRow = (hero, row, { locked, onFuse }) =>
{
    const node = el('div', [ 'fusion-row', row.canFuse ? 'is-ready' : '', row.isMax ? 'is-max' : '' ].filter(Boolean).join(' '), '', { testid: `fusion-row-${hero.id}-${row.stars}` });

    node.append(el('span', [ 'fusion-name', 'hero-stars', starsClass(row.stars) ].filter(Boolean).join(' '), starsText(row.stars)));

    if (row.isMax)
    {
        node.append(el('span', 'fusion-copies', `Cópias: ${row.copies}`), el('span', 'fusion-max', MAX_TEXT));

        return node;
    }

    const bar = el('span', 'fusion-bar', '', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '3', 'aria-valuenow': String(row.filled) });
    const fill = el('span', 'fusion-bar-fill');
    const button = el('button', 'fusion-button', `${starsText(row.stars)}→${starsText(row.stars + 1)}`, { type: 'button', testid: `fusion-button-${hero.id}-${row.stars}` });

    fill.style.width = barWidth(row.filled);
    bar.append(fill);
    button.disabled = locked || !row.canFuse;
    button.addEventListener('click', () => onFuse(row.stars));
    node.append(bar, el('span', 'fusion-copies', `${row.copies}/3`), button);

    return node;
};

//  The confirmation of Fundir tudo: question, preview, Sim, fundir and Não
const renderConfirm = (hero, { busy, onConfirmAll, onDeclineAll }) =>
{
    const box = el('div', 'fusion-all-confirm', '', { testid: 'fusion-all-confirm' });
    const actions = el('div', 'fusion-all-actions');
    const yes = el('button', 'fusion-button', 'Sim, fundir', { type: 'button', testid: 'fusion-all-yes' });
    const no = el('button', 'fusion-button is-secondary', 'Não', { type: 'button', testid: 'fusion-all-no' });

    yes.disabled = busy;
    no.disabled = busy;
    yes.addEventListener('click', () => onConfirmAll());
    no.addEventListener('click', () => onDeclineAll());
    actions.append(yes, no);
    box.append(
        el('p', 'fusion-all-question', fuseAllQuestion(cascade(hero).fusions), { testid: 'fusion-all-question' }),
        el('p', 'fusion-all-preview', previewText(hero), { testid: 'fusion-all-preview' }),
        actions
    );

    return box;
};

//  The hero detail of the Mochila. `busy`: a fusion request runs; `confirming`: the Fundir tudo question shows; `result`: a node or null.
//  onFuse(stars), onFuseAll(), onConfirmAll(), onDeclineAll()
export const renderBagHero = (hero, { busy = false, confirming = false, result = null, onFuse, onFuseAll, onConfirmAll, onDeclineAll }) =>
{
    const detail = el('div', 'hero-detail bag-detail', '', { testid: 'bag-entry-detail' });
    const side = el('div', 'bag-detail-ladder');
    const list = el('div', 'fusion-list', '', { testid: 'fusion-list' });
    const locked = busy || confirming;
    const bar = el('div', 'fusion-all-bar');
    const all = el('button', 'fusion-button fusion-all', 'Fundir tudo', { type: 'button', testid: 'fusion-all' });

    ladderRows(hero).forEach((row) => list.append(renderRow(hero, row, { locked, onFuse })));
    all.disabled = locked || !canFuseAny(hero);
    all.addEventListener('click', () => onFuseAll());
    bar.append(all);
    side.append(list, bar);

    if (confirming)
    {
        side.append(renderConfirm(hero, { busy, onConfirmAll, onDeclineAll }));
    }

    if (result)
    {
        side.append(result);
    }

    detail.append(renderHeroCard(hero, { testid: `bag-detail-card-${hero.id}` }), side, renderSkillList(hero));

    return detail;
};

//  The result line of Fundir tudo
export const renderFuseAllResult = ({ heroName, fusions, stars, raised = [] }) =>
    el('div', 'fusion-result', fuseAllResultText({ heroName, fusions, stars, raised }), { testid: 'fusion-result' });
```

**Tests**: unit
**Test cases** (`fusionLadderView.test.js`; fixture `const skills = [ 1, 2, 3 ].map((slot) => ({ slot, name: `Skill ${slot}`, type: 'Ataque', effect: 'x', cooldownSeconds: 10, image: `art_${slot}`, unlocked: false }))`; `const kael = (copies, stars = 0) => ({ id: 'kael', name: 'Kael', owned: true, stars, copies, skills })`; `const handlers = () => ({ onFuse: vi.fn(), onFuseAll: vi.fn(), onConfirmAll: vi.fn(), onDeclineAll: vi.fn() })`):

- `holds the card, the ladder, Fundir tudo and the three skills`: `kael({ 0: 3 })` → root testid `bag-entry-detail`; `bag-detail-card-kael` tag `DIV`; `fusion-list` not null; `fusion-all` text `'Fundir tudo'`; `skill-list` with 3 `.skill-row`.
- `the rows of 45, 1 and 2 copies are 0, 1 and 2 with their counts`: `kael({ 0: 45, 1: 1, 2: 2 }, 2)` → rows testids `[ 'fusion-row-kael-0', 'fusion-row-kael-1', 'fusion-row-kael-2' ]`; `.fusion-copies` texts `[ '45/3', '1/3', '2/3' ]`; `.fusion-name` texts `[ '0★', '1★', '2★' ]`.
- `a row has the bar, the count and the s★→s+1★ button`: `kael({ 0: 3 })` → row 0 `.fusion-bar` `role` `'progressbar'`, `aria-valuemin` `'0'`, `aria-valuemax` `'3'`, `aria-valuenow` `'3'`; `.fusion-bar-fill` `style.width` `'100%'`; `fusion-button-kael-0` text `'0★→1★'`, not disabled; row 1 `.fusion-copies` `'0/3'`, `aria-valuenow` `'0'`, fill `'0%'`, `fusion-button-kael-1` text `'1★→2★'` disabled.
- `the bar fill is a third per copy`: `kael({ 0: 1 })` → `'33.333%'`; `kael({ 0: 2 })` → `'66.667%'`.
- `a click on an enabled row button calls onFuse with the stars`: `kael({ 0: 3 })`; click `fusion-button-kael-0` → `onFuse` called with `0`.
- `the 9-star row has the copies and the max text and no button`: `kael({ 9: 1 }, 9)` → `fusion-row-kael-9` `.fusion-copies` `'Cópias: 1'`, `.fusion-max` `'Estrela máxima: não pode ser fundida'`, `.fusion-bar` null; `fusion-button-kael-9` null; the row has class `is-max`.
- `Fundir tudo is disabled when no layer below 9 holds 3 copies`: `kael({ 0: 2 })` → `fusion-all` disabled; `kael({ 9: 3 }, 9)` → disabled; `kael({ 0: 3 })` → enabled, and a click calls `onFuseAll` once.
- `busy disables every row button and Fundir tudo`: `kael({ 0: 6, 1: 3 })`, `busy: true` → `fusion-button-kael-0`, `fusion-button-kael-1`, `fusion-all` all disabled.
- `the confirmation shows the question and the preview and locks the ladder`: `kael({ 0: 45, 1: 1, 2: 2 }, 2)`, `confirming: true` → `fusion-all-question` `'Fazer 22 fusões?'`; `fusion-all-preview` `'45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★'`; `fusion-all-yes` text `'Sim, fundir'`; `fusion-all-no` text `'Não'`; `fusion-button-kael-0` disabled; `fusion-all` disabled.
- `one fusion reads Fazer 1 fusão?`: `kael({ 0: 3 })`, `confirming: true` → `'Fazer 1 fusão?'`.
- `Sim, fundir and Não call their handlers`: click yes → `onConfirmAll` 1 call; click no → `onDeclineAll` 1 call.
- `no confirmation without confirming`: default → `fusion-all-confirm` null.
- `the result node is placed in the detail`: `result: el('div', 'fusion-result', 'X', { testid: 'fusion-result' })` → `fusion-result` text `'X'` inside `bag-entry-detail`.
- `renderFuseAllResult reads the fusions, the best card and the raised skills`: `{ heroName: 'Kael Raizférrea', fusions: 4, stars: 5, raised: [ { name: 'Corte Dimensional', level: 2 }, { name: 'Investida do Baluarte', level: 2 } ] }` → testid `fusion-result`, class `fusion-result`, text `'4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 14 new cases pass; every other game unit test passes.

**Commit**: `feat(game): draw the fusion ladder of a hero`

---

### T10: Styles of the hero cards and the ladder [x]

**Owner**: game-dev
**Goal**: The card grid fits the panel without a scrollbar; frames, badge, ribbon, chips, ladder rows and Fundir tudo look as design.md § Layout (BAG-04, BAG-05, BAG-11, BAG-14).
**Where**: `game/public/style.css`
**Read first**: `game/public/style.css:1-95` (tokens), `:136-200` (`.fusion-button` states), `:1323-1335` (`.hero-window`), `:1381-1445` (`.hero-grid`, `.hero-card`), `:1584-1673` (`.bag-*`, `.fusion-*`), `:2880-2900` (`.hero-stars.is-ascended`, `.is-exalted`), `.specs/features/hero-bag-cards/design.md` § Layout and Visual Spec (every value)
**Depends on**: T8, T9
**Requirement**: BAG-04, BAG-05, BAG-11, BAG-14

**Contract**: add one block after the `.fusion-result` rule (`style.css:1663-1673`), titled `/* ══ Mochila: hero cards and the fusion ladder (spec hero-bag-cards) ══ */`, with exactly the selectors and values of design.md § Card grid, § Card, § Card frames, § Hero detail, § Ladder row and § Fundir tudo:

- `.bag-cards`; `.bag-card`; `.bag-card:hover:not(:disabled)` (button only: `button.bag-card:hover:not(:disabled)`); `.bag-card:focus-visible`; `.bag-card-portrait`; `.bag-card-ribbon`; `.bag-card-star`; `.bag-card-chips`; `.bag-card-chip`; `.bag-card-fuse`; `.bag-card.is-grey`, `.bag-card.is-grey .bag-card-portrait`, `.bag-card-missing`;
- `.bag-card.frame-wood`, `.bag-card.frame-silver`, `.bag-card.frame-gold` (border, box-shadow, `--card-frame`), `.bag-card::before` (shared box: `content: ''; position: absolute; inset: -4px; border-radius: 12px; pointer-events: none; background-repeat: no-repeat`) and one `::before` background per tier; `.bag-card.frame-gold::after` (sparkles, same box as `::before`);
- `.bag-detail`, `.bag-detail .skill-list { grid-column: 1 / -1; }`, `.bag-detail .bag-card { cursor: default; }`;
- `.bag-detail .fusion-row` (the grid of 4 columns and min-height 44 px; it must win over the old `.fusion-row` flex rule, so use this two-class selector), `.fusion-row.is-ready`, `.fusion-row.is-max`, `.fusion-bar`, `.fusion-bar-fill`, `.fusion-max`;
- `.fusion-all-bar`, `.fusion-all-confirm`, `.fusion-all-question`, `.fusion-all-preview`, `.fusion-all-actions`, `.fusion-button.is-secondary` (`background: var(--btn-bg)`).

No `transition` and no `animation` in the block. Do not change any existing rule.

**Steps**:

1. Add the block.
2. `cd game && npm run build`.
3. Open the game (`cd game && npm run dev`) only if needed to check that nothing else moved; the screen is not wired yet, so the e2e of the layout runs in T13.

**Tests**: none (stylesheet; geometry asserted by the e2e of T13 and the `ui-artist` review T16)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] `git diff game/public/style.css` only adds lines (no existing line changed or removed).
- [x] The block has no `transition` and no `animation` (`grep -n "transition\|animation"` on the added lines prints nothing).
- [x] `npm test` and `npm run build` pass.

**Commit**: `style(game): style the hero cards and the fusion ladder`

---

### T11: Wire the Mochila to the cards and the ladder; remove the Fusão screen [x]

**Owner**: game-dev
**Goal**: The Mochila shows the cards, a card opens the ladder, a row button fuses once with a busy lock, and the Fusão HUD button and screen are gone (BAG-03, BAG-10, BAG-12, BAG-15, BAG-17 to BAG-22, BAG-38, BAG-39).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`, `game/src/adapters/phaser/views/bagView.js`, `game/src/adapters/phaser/views/bagView.test.js`, `game/src/adapters/phaser/views/fusionView.js`, `game/src/adapters/phaser/views/fusionView.test.js`
**Read first**: `HeroUi.js:1-130` (imports, `SCREENS`, constructor), `:151-271` (`show`, `close`, `setError`, `showDetail`), `:281-334` (`render_bag`, `render_fusion`, `fuse`), `HeroUi.test.js:1-104` (`hero`, `catalog`, `createUi`, `open`, HUD test), `:200-300` (`HeroUi Mochila`, `HeroUi Fusão`), `:715-760` (`HeroUi Fusão without fusions`, bag badge), `views/fusionLadderView.js` (T9), `views/bagView.js` (T8)
**Depends on**: T8, T9, T10
**Requirement**: BAG-03, BAG-10, BAG-12, BAG-15, BAG-17, BAG-18, BAG-19, BAG-20, BAG-21, BAG-22, BAG-38, BAG-39

**Contract**:

- `SCREENS`: delete `{ id: 'fusion', label: 'Fusão', title: 'Fusão' }` and the `fusion` entry of `ICONS`. Update the class comment ("seven HUD buttons" → "six HUD buttons", drop "Fusão").
- Imports: `import { renderBagCards } from './views/bagView';`, `import { renderBagHero } from './views/fusionLadderView';`, `import { renderFusionResult } from './views/fusionView';` (no more `renderBag`, `renderBagEntry`, `renderFusion`).
- Constructor: `this.fusionBusy = false; this.bagHeroId = null; this.fuseAllAsking = false;` next to `this.sellMode = null;`.
- `show()`: after `this.sellMode = null;` add `this.bagHeroId = null; this.fuseAllAsking = false;`. `close()`: the same two lines after `this.sellMode = null;`. `fusionBusy` is not reset (the request still runs; its `finally` resets it).
- Delete `render_fusion`. Replace `render_bag` and `fuse`, add `openBagHero` and `redrawBag`:

```js
render_bag ({ keepError = false } = {})
{
    if (!keepError)
    {
        this.setError('');
    }
    this.bagHeroId = null;
    this.fuseAllAsking = false;
    this.backButton.hidden = true;
    this.body.replaceChildren(renderBagCards(this.heroes.heroes(), { onSelect: (hero) => this.openBagHero(hero.id) }));
}

//  The detail of one hero of the Mochila; `result` is the result line node of the last fusion, or null
openBagHero (heroId, { result = null } = {})
{
    const hero = this.heroes.heroes().find((candidate) => candidate.id === heroId);

    this.bagHeroId = heroId;
    this.showDetail(renderBagHero(hero, {
        busy: this.fusionBusy,
        confirming: this.fuseAllAsking,
        result,
        onFuse: (stars) => this.fuse(heroId, stars),
        onFuseAll: () => this.askFuseAll(),
        onConfirmAll: () => this.fuseAll(heroId),
        onDeclineAll: () => this.declineFuseAll()
    }), () => this.render_bag());
}

//  After a fusion answer: nothing when the panel moved on; the detail of the same hero with the result; else what is shown now
redrawBag (view, heroId, result)
{
    if (view !== this.view || this.screen !== 'bag')
    {
        return;
    }

    if (this.bagHeroId === heroId)
    {
        this.openBagHero(heroId, { result });
    }
    else if (this.bagHeroId !== null)
    {
        this.openBagHero(this.bagHeroId);
    }
    else
    {
        this.render_bag({ keepError: true });
    }
}

async fuse (heroId, stars)
{
    if (this.fusionBusy)
    {
        return;
    }

    const view = this.view;
    let result = null;

    this.fusionBusy = true;
    this.openBagHero(heroId);

    try
    {
        const hero = await this.heroes.fuse(heroId, stars);

        if (view === this.view)
        {
            this.setError('');

            const raised = hero.skills?.find((skill) => skill.slot === raisedSkillSlot(stars + 1));

            result = renderFusionResult({ heroName: hero.name, stars: stars + 1, skillName: raised?.name ?? '', level: skillLevelOf(raised) });
        }
    }
    catch
    {
        if (view === this.view)
        {
            this.setError(FUSE_FAILED);
        }
    }
    finally
    {
        this.fusionBusy = false;
        this.redrawBag(view, heroId, result);
    }
}

//  Fundir tudo before T12: kept as no-ops so the buttons of the detail do nothing until the cascade is wired
askFuseAll () {}

declineFuseAll () {}

async fuseAll () {}
```

- `bagView.js`: delete `renderBag` and `renderBagEntry` (and the imports only they used). `fusionView.js`: delete `renderFusion` (keep `renderFusionResult`; drop the `availableFusions`, `FUSION_SIZE` imports).
- `domain/heroes/heroes.js` keeps `bagEntries`, `fusionRows`, `availableFusions` and their tests (domain, still valid; unused code is not removed in this feature).

**Steps**:

1. Edit `HeroUi.js` as above.
2. Delete the old view functions and their test blocks named below.
3. Rewrite the `HeroUi.test.js` cases named below and add the new ones.
4. `cd game && npm test && npm run build`.

**Tests**: unit
**Test changes** (removed because the behaviour is removed by the spec; their surviving assertions move to the cases named):

- `bagView.test.js`: delete `describe('renderBag')`, `describe('renderBagEntry')`, `describe('bag cards of 4 to 9 stars')` (covered by T8 `renderBagCards`/`renderHeroCard` and T9 ladder cases: copies per layer, 9★ max text, tier class, skills).
- `fusionView.test.js`: delete `describe('renderFusion')` and `describe('renderFusion past 3 stars')` (covered by T9 ladder cases); keep `describe('renderFusionResult')` unchanged.
- `HeroUi.test.js`:
  - `HeroUi HUD › shows the seven buttons ...` becomes `shows the six buttons Heróis, Mochila, Líder, Equipamento, Talentos and Rever chefes`: ids `[ 'heroes', 'bag', 'leader', 'equipment', 'talents', 'farm' ]` read `[ 'Heróis', 'Mochila', 'Líder', 'Equipamento', 'Talentos', 'Rever chefes' ]`; `testid('hud-fusion')` is `null`.
  - `HeroUi Mochila › lists the cards, shows an entry and opens Fusão with that entry selected` becomes `shows one card per hero and opens the ladder of an owned hero`: `open(ctx, 'bag')` → `bag-card-kael` and `bag-card-lyra` not disabled, `bag-card-orina` disabled; click `bag-card-kael` → `bag-entry-detail` not null, 3 `.skill-row` in `ctx.root[1]`, `fusion-row-kael-0` `.fusion-copies` `'3/3'`, `fusion-row-kael-1` `.fusion-copies` `'0/3'`, `hero-back` `hidden === false`.
  - `describe('HeroUi Fusão')` becomes `describe('HeroUi Mochila fusion')`; every case opens with `await open(ctx, 'bag'); ctx.testid('bag-card-kael').click();` instead of `await open(ctx, 'fusion');` and keeps its other assertions, except: in `fuses, shows the new card, updates the screen and lights the first skill of the leader on the bar`, `expect(ctx.testid('fusion-empty').textContent).toBe('Nenhuma fusão disponível')` becomes `expect(ctx.testid('fusion-row-kael-1').querySelector('.fusion-copies').textContent).toBe('1/3')`; the mock `fused` stays `hero('kael', { 1: 1 })`.
  - `describe('HeroUi Fusão without fusions') › says no fusion is available when no hero has 3 copies` becomes `describe('HeroUi Mochila without fusions') › a hero with fewer than 3 copies has its row button and Fundir tudo disabled`: list kael `{ 0: 2 }` → open bag, click `bag-card-kael` → `fusion-button-kael-0.disabled` true, `fusion-all.disabled` true, `fusion-row-kael-1` null.

**Test cases** (new, `describe('HeroUi Mochila fusion')`):

- `a second click while a fusion runs sends one request and every fusion button is disabled`: list kael `{ 0: 6 }`; `let finish; ctx.heroesGateway.fuse.mockImplementation(() => new Promise((resolve) => { finish = resolve; }))`; open bag; click kael card; click `fusion-button-kael-0` → every `button` inside `bag-entry-detail` has `disabled === true`; `hero-back.hidden` false; `ctx.ui.fuse('kael', 0)` (direct second call) → `fuse` called 1 time; `finish(hero('kael', { 0: 3, 1: 1 }))`; `await flush()` → `fusion-button-kael-0.disabled` false; `fusion-result` text `'Nova carta: Hero kael 1★'`.
- `Voltar shows the cards with the counts after the fusion`: list kael `{ 0: 3 }`; `fuse` resolves `hero('kael', { 1: 1 })`; open bag; click kael card; click `fusion-button-kael-0`; `await flush()`; click `hero-back` → `bag-list` not null; `bag-card-kael` `.bag-card-chip` texts `[ '1★×1' ]`; `bag-card-star-kael` `'1★'`; `bag-card-fuse-kael` null.
- `Voltar while a fusion runs shows the cards and the answer redraws them`: deferred `fuse` as above with kael `{ 0: 3 }`; click button; click `hero-back` → `bag-list` not null; `finish(hero('kael', { 1: 1 }))`; `await flush()` → `bag-entry-detail` null; `bag-card-kael` chips `[ '1★×1' ]`.
- `an answer after the panel was closed draws nothing`: deferred `fuse`; click button; `ctx.ui.close()`; `finish(hero('kael', { 1: 1 }))`; `await flush()` → `.hero-body` `childElementCount` 0; `.hero-error` `hidden` true.
- `an answer after another screen opened draws nothing in the panel`: deferred `fuse`; click button; `await open(ctx, 'heroes')`; `finish(...)`; `await flush()` → `hero-grid` not null; `bag-entry-detail` null.
- `a failed fusion after Voltar shows the error over the cards`: `fuse` deferred reject with `new ApiError('x', { status: 409, code: 'NOT_ENOUGH_CARDS' })` (`let fail; mockImplementation(() => new Promise((_, reject) => { fail = reject; }))`); click button; click `hero-back`; `fail(error)`; `await flush()` → `bag-list` not null; `.hero-error` text `'Não foi possível fundir as cartas.'`.
- `opening the Mochila again shows the cards, not the last detail`: open bag; click kael card; `ctx.ui.close()`; `await open(ctx, 'bag')` → `bag-list` not null; `bag-entry-detail` null; `hero-back.hidden` true.
- The four `HeroUi bag badge` cases pass unchanged (BAG-39).

**Gate**: quick - `cd game && npm test && npm run build`
**Done when**:

- [x] `HeroUi.test.js`, `bagView.test.js`, `fusionView.test.js` pass with the changes listed and the 7 new cases; every other game unit test passes.
- [x] `grep -rn "hud-fusion\|render_fusion\|renderBagEntry\|renderFusion(" game/src` prints nothing.
- [x] The e2e specs `heroes.spec.js`, `heroAscension.spec.js` and `uiRedesign.spec.js` are expected to fail on the Fusão locators until T14 and T15; no e2e file is edited in this task.

**Commit**: `feat(game): show hero cards and the fusion ladder in the Mochila`

---

### T12: Fundir tudo in HeroUi [x]

**Owner**: game-dev
**Goal**: `Fundir tudo` asks, previews, sends one `fuse-all`, shows the result or the error (BAG-18, BAG-21, BAG-22, BAG-31 to BAG-37).
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js` (`openBagHero`, `redrawBag`, `fuse`, the no-op `askFuseAll`, `declineFuseAll`, `fuseAll` of T11), `views/fusionLadderView.js` (`renderFuseAllResult`), `domain/heroes/bagCards.js` (`raisedSkills`), `HeroUi.test.js` (`createUi`, `describe('HeroUi Mochila fusion')`)
**Depends on**: T3, T5, T11
**Requirement**: BAG-18, BAG-21, BAG-22, BAG-31, BAG-32, BAG-33, BAG-34, BAG-35, BAG-36, BAG-37

**Contract** (replace the three no-ops; import `raisedSkills` from `../../domain/heroes/bagCards` and `renderFuseAllResult` from `./views/fusionLadderView`):

```js
askFuseAll ()
{
    if (this.fusionBusy || this.bagHeroId === null)
    {
        return;
    }
    this.fuseAllAsking = true;
    this.openBagHero(this.bagHeroId);
}

declineFuseAll ()
{
    this.fuseAllAsking = false;
    this.openBagHero(this.bagHeroId);
}

async fuseAll (heroId)
{
    if (this.fusionBusy)
    {
        return;
    }

    const view = this.view;
    const before = this.heroes.heroes().find((candidate) => candidate.id === heroId);
    let result = null;

    this.fusionBusy = true;
    this.fuseAllAsking = false;
    this.openBagHero(heroId);

    try
    {
        const { hero, fusions } = await this.heroes.fuseAll(heroId);

        if (view === this.view)
        {
            this.setError('');
            result = renderFuseAllResult({ heroName: hero.name, fusions, stars: hero.stars, raised: raisedSkills(before?.skills, hero.skills) });
        }
    }
    catch
    {
        if (view === this.view)
        {
            this.setError(FUSE_FAILED);
        }
    }
    finally
    {
        this.fusionBusy = false;
        this.redrawBag(view, heroId, result);
    }
}
```

**Steps**:

1. Replace the no-ops; add the imports.
2. In `HeroUi.test.js` add `fuseAll: vi.fn()` to `heroesGateway` in `createUi`.
3. Add `describe('HeroUi Fundir tudo')` with the cases below. Fixture: `const ladder = () => ({ leaderId: 'kael', heroes: [ hero('kael', { 0: 45, 1: 1, 2: 2 }), hero('lyra') ] })`; `const openKael = async (ctx) => { await open(ctx, 'bag'); ctx.testid('bag-card-kael').click(); }`.

**Tests**: unit
**Test cases** (`HeroUi.test.js`, `describe('HeroUi Fundir tudo')`):

- `Fundir tudo asks first with the count and the preview and sends nothing`: `createUi({ list: ladder() })`; `openKael`; click `fusion-all` → `fusion-all-question` `'Fazer 22 fusões?'`; `fusion-all-preview` `'45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★'`; `heroesGateway.fuseAll` not called; `fusion-button-kael-0.disabled` true; `fusion-all.disabled` true.
- `Não closes the question, sends nothing and keeps the counts`: click `fusion-all`, then `fusion-all-no` → `fusion-all-confirm` null; `fuseAll` not called; `fusion-row-kael-0 .fusion-copies` `'45/3'`; `fusion-button-kael-0.disabled` false.
- `Sim, fundir sends one fuse-all and shows the result`: `fuseAll.mockResolvedValue({ hero: hero('kael', { 1: 1, 2: 1, 3: 2 }), fusions: 22 })`; ask; click `fusion-all-yes`; `await flush()` → `fuseAll` called 1 time with `'kael'`; `fusion-result` `'22 fusões. Melhor carta: Hero kael 3★'`; `fusion-all-confirm` null; `fusion-row-kael-0` null; `fusion-row-kael-3 .fusion-copies` `'2/3'`; `.hero-error` hidden.
- `the result names the skills the cascade raised`: list kael `{ 3: 9 }` (helper gives skills levels undefined → level 1 through `skillLevelOf`); `fuseAll` resolves `{ hero: hero('kael', { 5: 1 }, { stars: 5, skills: skills(true, true, true).map((skill, index) => ({ ...skill, level: [ 2, 2, 1 ][index] })) }), fusions: 4 }`; ask; yes; flush → `fusion-result` `'4 fusões. Melhor carta: Hero kael 5★ · Skill 1 no nível 2 · Skill 2 no nível 2'`.
- `one fusion reads 1 fusão`: list kael `{ 0: 3 }`; resolves `{ hero: hero('kael', { 1: 1 }), fusions: 1 }` → `fusion-all-question` before yes `'Fazer 1 fusão?'`; after yes `fusion-result` `'1 fusão. Melhor carta: Hero kael 1★'`.
- `the cascade lights the skills of the leader on the bar without reloading`: list `ladder()` (kael leads); resolves `{ hero: hero('kael', { 1: 1, 2: 1, 3: 2 }), fusions: 22 }`; yes; flush → `skill-slot-3` `data-unlocked` `'true'`; `heroesGateway.list` called 1 time.
- `every fusion button is disabled while the cascade runs and a second call sends nothing`: deferred `fuseAll`; ask; yes → `fusion-all-confirm` null; every `button` in `bag-entry-detail` disabled; `ctx.ui.fuseAll('kael')` → `fuseAll` called 1 time; finish; flush → `fusion-all.disabled` reflects the new bag (`hero('kael', { 1: 1, 2: 1, 3: 2 })` → disabled true).
- `a failed cascade shows the error and keeps the counts`: `fuseAll.mockRejectedValue(new ApiError('x', { status: 409, code: 'NOTHING_TO_FUSE' }))`; ask; yes; flush → `.hero-error` `'Não foi possível fundir as cartas.'`; `fusion-row-kael-0 .fusion-copies` `'45/3'`; `fusion-result` null; `fusion-all-confirm` null; `ctx.heroes.heroes()` equals the list before.
- `an answer of the cascade after the panel was closed draws nothing`: deferred; yes; `ctx.ui.close()`; finish; flush → `.hero-body` `childElementCount` 0.
- `opening the Mochila again hides a question left open`: ask; `ctx.ui.close()`; `await open(ctx, 'bag')`; click kael card → `fusion-all-confirm` null.

**Gate**: quick - `cd game && npm test && npm run build`
**Done when**:

- [x] The 10 new cases pass; every other game unit test passes.

**Commit**: `feat(game): fuse every layer of a hero with Fundir tudo`

---

### T13: Fake backend fuse-all and the e2e of the Mochila [ ]

**Owner**: test-engineer
**Goal**: Prove every player-visible criterion of the cards, the ladder, Fundir tudo, the rail and the gems in the browser (BAG-01 to BAG-21, BAG-31 to BAG-38).
**Where**: `game/e2e/heroBagCards.spec.js` (new)
**Also changes**: `game/e2e/support/fakeBackend.js`
**Read first**: `game/e2e/heroes.spec.js:1-33` (`startGame`), `game/e2e/heroAscension.spec.js:15-36` (`startAs`), `game/e2e/bulkSell.spec.js` top (fixture `piece`, Equipamento helpers), `game/e2e/support/fakeBackend.js:80-150` (`HEROES`, `copiesOf`, `heroView`), `:220-240` (options), `:585-606` (`fuse` branch), `.specs/features/hero-bag-cards/spec.md`
**Depends on**: T7, T12
**Requirement**: BAG-01 to BAG-21, BAG-31 to BAG-38

**Contract** (fake backend, right after the `fuse` branch; keeps the backend rule of `PlayerCards.fuseAll`):

```js
//  POST /heroes/:id/fuse-all: every layer from 0 stars up, all or nothing (HeroController.fuseAll)
const fuseAll = path.match(/^\/heroes\/([^/]+)\/fuse-all$/);

if (method === 'POST' && fuseAll) {
    const hero = HEROES.find((candidate) => candidate.id === decodeURIComponent(fuseAll[1]));

    if (!hero) { return route.fulfill(problem(404, `Hero '${fuseAll[1]}' not found`, 'HERO_NOT_FOUND')); }

    const next = {};
    let carry = 0;
    let fusions = 0;

    for (let stars = 0; stars <= 8; stars++) {
        const count = copiesOf(cards, hero.id, stars) + carry;

        carry = Math.floor(count / FUSION_SIZE);
        fusions += carry;
        next[stars] = count - carry * FUSION_SIZE;
    }
    next[9] = copiesOf(cards, hero.id, 9) + carry;

    if (fusions === 0) { return route.fulfill(problem(409, 'Nothing to fuse', 'NOTHING_TO_FUSE')); }

    Object.entries(next).forEach(([ stars, count ]) => { cards.copies[`${hero.id}:${stars}`] = count; });
    return route.fulfill({ json: { hero: heroView(cards, hero), fusions } });
}
```

e2e helpers (`heroBagCards.spec.js`, `import { expect, test } from './support/coverage'`):

```js
const LAYERS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
//  Logs in as yan with the bag `copies` (Kael leads) and optional `equipment`; resolves with the fake backend
const startWith = async (page, copies, { equipment = [] } = {}) => { /* mockBackend({ users: { yan: 'secret123' }, cards: { yan: { leader: 'kael', copies } }, equipment: { yan: equipment } }), then the login steps of heroes.spec.js startGame */ };
const openBag = async (page) => { await page.getByTestId('hud-bag').click(); await expect(page.getByTestId('bag-list')).toBeVisible(); };
const openHero = async (page, id) => { await openBag(page); await page.getByTestId(`bag-card-${id}`).click(); await expect(page.getByTestId('bag-entry-detail')).toBeVisible(); };
const chips = (page, id) => page.getByTestId(`bag-card-${id}`).locator('.bag-card-chip');
const copiesText = (page, id, stars) => page.getByTestId(`fusion-row-${id}-${stars}`).locator('.fusion-copies');
//  Records every POST to the given API path
const posts = (page, path) => { const list = []; page.on('request', (request) => { if (request.method() === 'POST' && new URL(request.url()).pathname === `/api${path}`) list.push(request); }); return list; };
const noScroll = (page) => page.locator('.hero-window').evaluate((node) => node.scrollHeight <= node.clientHeight);
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({ id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId });
```

**Steps**:

1. Add the fake backend branch.
2. Create `heroBagCards.spec.js` with `test.describe('Mochila hero cards', ...)` and the cases below.
3. Run the gate; then run the whole e2e suite once (`cd game && npx playwright test`) and report the failures of `heroes.spec.js`, `heroAscension.spec.js` and `uiRedesign.spec.js` that T14 and T15 fix as "expected until T14/T15"; report any other failure.

**Tests**: e2e
**Test cases** (`heroBagCards.spec.js`):

- `shows one framed card per hero with the best star, the chips and the Fundir badge` (BAG-03 to BAG-09): `startWith(page, { 'kael:0': 45, 'kael:1': 1, 'kael:2': 2, 'lyra:4': 1, 'orina:7': 1 })`; `openBag` → `page.locator('[data-testid^="bag-card-"][data-frame]')` testids `[ 'bag-card-kael', 'bag-card-lyra', 'bag-card-orina', 'bag-card-seraphine', 'bag-card-vex' ]` (fake backend order); `bag-card-kael` `data-frame` `'wood'`, `bag-card-star-kael` `'2★'`, chips `[ '0★×45', '1★×1', '2★×2' ]`, `bag-card-fuse-kael` `'Fundir'`, `.bag-card-ribbon` `'Kael Raizférrea'`, `img.bag-card-portrait` `src` contains `kael_sprite.png`; `bag-card-lyra` `data-frame` `'silver'`, star `'4★'` with class `is-ascended`, no `bag-card-fuse-lyra`; `bag-card-orina` `data-frame` `'gold'`, star `'7★'` with class `is-exalted`; `bag-card-seraphine` and `bag-card-vex` disabled, class `is-grey`, `.bag-card-missing` `'Não encontrado'`, no star badge; `page.locator('[data-testid^="bag-entry-"]')` count 0.
- `a card the player does not own opens nothing` (BAG-10): `startWith(page, { 'kael:0': 1 })`; `openBag`; `bag-card-vex` disabled; `bag-card-vex.click({ force: true })` → `bag-entry-detail` count 0; `bag-list` visible.
- `the Mochila shows no scrollbar with every layer of every hero filled on desktop` (BAG-11): copies `Object.fromEntries([ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ].flatMap((id) => LAYERS.map((stars) => [ `${id}:${stars}`, 45 ])))`; default viewport → `openBag`; `noScroll(page)` resolves `true`; every card shows 10 chips.
- `the Mochila shows no scrollbar on a phone` (BAG-11): same copies; `await page.setViewportSize({ width: 390, height: 844 })` before `startWith` → `openBag`; `noScroll(page)` `true`; `page.locator('[data-testid^="bag-entry-kael-"]')` count 0 (no old list).
- `a card opens the ladder with the owned layers and the next reachable one` (BAG-12 to BAG-15): `startWith(page, { 'kael:0': 3 })`; `openHero(page, 'kael')` → `hero-back` visible; `bag-detail-card-kael` visible; `skill-list .skill-row` count 3; `fusion-all` `'Fundir tudo'` enabled; row 0: `.fusion-name` `'0★'`, `copiesText` `'3/3'`, `.fusion-bar` `aria-valuenow` `'3'`, `fusion-button-kael-0` `'0★→1★'` enabled; row 1: `copiesText` `'0/3'`, `aria-valuenow` `'0'`, `fusion-button-kael-1` `'1★→2★'` disabled; `fusion-row-kael-2` count 0.
- `a 9-star row cannot be fused` (BAG-08, BAG-16, BAG-31): `startWith(page, { 'kael:9': 1 })`; `openBag` → `bag-card-kael` `data-frame` `'gold'`, `bag-card-fuse-kael` count 0; open Kael → `fusion-row-kael-9 .fusion-max` `'Estrela máxima: não pode ser fundida'`, `copiesText(page, 'kael', 9)` `'Cópias: 1'`, `fusion-button-kael-9` count 0; `fusion-all` disabled.
- `a row button fuses once and the ladder and the cards follow` (BAG-17, BAG-20, BAG-21): `startWith(page, { 'kael:0': 3 })`; `skill-slot-1` `data-unlocked` `'false'`; `const calls = posts(page, '/heroes/kael/fuse')`; open Kael; click `fusion-button-kael-0` → `fusion-result` `'Nova carta: Kael Raizférrea 1★'`; `fusion-row-kael-0` count 0; `copiesText(page, 'kael', 1)` `'1/3'`; `skill-slot-1` `data-unlocked` `'true'`; `calls.length` 1 and its `postDataJSON()` `{ stars: 0 }`; click `hero-back` → chips `[ '1★×1' ]`, `bag-card-star-kael` `'1★'`, `bag-card-fuse-kael` count 0.
- `a fusion in flight disables the ladder and keeps Voltar` (BAG-18): `startWith(page, { 'kael:0': 6 })`; `let release; const held = new Promise((resolve) => { release = resolve; }); await page.route('**/api/heroes/kael/fuse', async (route) => { await held; await route.fallback(); })`; open Kael; click `fusion-button-kael-0` → `fusion-button-kael-0` disabled, `fusion-all` disabled, `hero-back` enabled; `release()` → `fusion-result` `'Nova carta: Kael Raizférrea 1★'`; `fusion-button-kael-0` enabled (`3/3` left).
- `a failed row fusion keeps the ladder` (BAG-19): `const backend = await startWith(page, { 'kael:0': 3 })`; open Kael; `backend.cardsOf('yan').copies['kael:0'] = 1`; click `fusion-button-kael-0` → `.hero-error` `'Não foi possível fundir as cartas.'`; `copiesText(page, 'kael', 0)` `'3/3'`; `fusion-result` count 0.
- `Fundir tudo previews the cascade and Não sends nothing` (BAG-32, BAG-33, BAG-34): `startWith(page, { 'kael:0': 45, 'kael:1': 1, 'kael:2': 2 })`; `const calls = posts(page, '/heroes/kael/fuse-all')`; open Kael; click `fusion-all` → `fusion-all-question` `'Fazer 22 fusões?'`; `fusion-all-preview` `'45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★'`; `fusion-button-kael-0` disabled; `fusion-all` disabled; click `fusion-all-no` → `fusion-all-confirm` count 0; `copiesText(page, 'kael', 0)` `'45/3'`; `calls.length` 0.
- `Sim, fundir fuses the whole ladder in one request` (BAG-35, BAG-21): same bag; `calls` as above; open Kael; `fusion-all`; `fusion-all-yes` → `fusion-result` `'22 fusões. Melhor carta: Kael Raizférrea 3★'`; `calls.length` 1; rows: `fusion-row-kael-0` count 0, `copiesText` 1 `'1/3'`, 2 `'1/3'`, 3 `'2/3'`; `skill-slot-3` `data-unlocked` `'true'`; `hero-back` → chips `[ '1★×1', '2★×1', '3★×2' ]`, star `'3★'`, `bag-card-fuse-kael` count 0.
- `Fundir tudo names the skills it raised` (BAG-36): `startWith(page, { 'kael:3': 9 })`; open Kael; `fusion-all`; `fusion-all-question` `'Fazer 4 fusões?'`; yes → `fusion-result` `'4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2'`; `hero-back` → `bag-card-kael` `data-frame` `'silver'`.
- `a failed Fundir tudo changes nothing` (BAG-37): same 45/1/2 bag; after `startWith`, `await page.route('**/api/heroes/kael/fuse-all', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }))`; open Kael; `fusion-all`; yes → `.hero-error` `'Não foi possível fundir as cartas.'`; `copiesText(page, 'kael', 0)` `'45/3'`; `fusion-result` count 0; `fusion-all-confirm` count 0.
- `the rail has six buttons and no Fusão` (BAG-38): `startWith(page, { 'kael:0': 1 })` → `page.locator('.hero-hud [data-testid^="hud-"]')` testids `[ 'hud-heroes', 'hud-bag', 'hud-leader', 'hud-equipment', 'hud-talents', 'hud-farm' ]`; `hud-fusion` count 0.
- `the rarity gems sit centered on the top edge of every piece tile` (BAG-01, BAG-02): `startWith(page, { 'kael:0': 1 }, { equipment: [ piece('m1', 'RING', 'LEGENDARY', 2), piece('w1', 'WEAPON', 'EPIC', 0, 'kael') ] })`; click `hud-equipment`; for each tile in `[ equip-piece-m1, equip-slot-kael-WEAPON ]`: `const tile = await locator.boundingBox(); const gems = await locator.locator('.piece-gems').boundingBox();` → `Math.abs((gems.x + gems.width / 2) - (tile.x + tile.width / 2))` ≤ 1; `gems.y` < `tile.y`; `equip-piece-m1` `data-gems` `'4'`; `equip-piece-m1 .piece-refine` text `'+2'` and its box's right edge within 4 px of the tile's right edge; then click `bulk-sell-start` and check `equip-piece-m1` again (centered within 1 px).

**Gate**: full - `cd game && npm test && npx playwright test e2e/heroBagCards.spec.js`
**Done when**:

- [ ] The 15 cases of `heroBagCards.spec.js` pass (a failing one is rerun alone twice with `--workers=1` before it counts as a flake).
- [ ] `cd game && npm test` passes.

**Commit**: `test(game): cover the Mochila hero cards and Fundir tudo end to end`

---

### T14: Move the hero e2e scenarios onto the Mochila [ ]

**Owner**: test-engineer
**Goal**: The fusion scenarios of `heroes.spec.js` and `heroAscension.spec.js` reach the ladder through the Mochila and keep every asserted value whose behaviour survives (BAG-07, BAG-16, BAG-17, BAG-19, BAG-21).
**Where**: `game/e2e/heroes.spec.js`
**Also changes**: `game/e2e/heroAscension.spec.js`
**Read first**: `game/e2e/heroes.spec.js:60-145`, `:192-215`; `game/e2e/heroAscension.spec.js:40-75`, `:139-156`, `:233-278`; `.specs/features/hero-bag-cards/spec.md` D10, D11, D19
**Depends on**: T12
**Requirement**: BAG-07, BAG-16, BAG-17, BAG-19, BAG-21

**Contract**: every `page.getByTestId('hud-fusion').click()` (and `openScreen(page, 'fusion')`) becomes `await page.getByTestId('hud-bag').click(); await page.getByTestId('bag-card-kael').click();`. The changes beyond that, test by test:

`heroes.spec.js`

- `the bag lists the cards and leads to the fusion, which fuses three blank cards...` is renamed `the Mochila card opens the ladder, which fuses three blank cards into a one star card and unlocks the first skill`: `bag-entry-kael-0` `'x3'` → `bag-card-kael .bag-card-chip` `['0★×3']`; click `bag-card-kael` (not `bag-entry-kael-0`); `bag-entry-detail` `toContainText('Para fundir: 3/3')` → `fusion-row-kael-0 .fusion-copies` `'3/3'`; delete the `bag-go-fusion` click and the `is-selected` assertion; `fusion-row-kael-1` `toHaveCount(0)` → `fusion-row-kael-1 .fusion-copies` `'0/3'` (D10); keep `fusion-button-kael-0` enabled, the click, `fusion-result` `'Nova carta: Kael Raizférrea 1★'`, `fusion-row-kael-0` count 0; `fusion-empty` `'Nenhuma fusão disponível'` → `fusion-button-kael-1` disabled; keep both `skill-slot` assertions; after reopening the bag: `bag-entry-kael-1` `'x1'` and `bag-entry-kael-0` count 0 → chips `['1★×1']`.
- `27 blank cards fuse step by step into a three star hero with every skill unlocked`: rename the local helper `fuseAll` to `fuseStepByStep`; after each click, `left >= 1` → `fusion-row-kael-<stars> .fusion-copies` `${left}/3`, `left === 0` → the row has count 0 (a row now stays while it holds a copy, D10); keep the three calls and the final `fusion-result` `'Nova carta: Kael Raizférrea 3★'` and the skill bar assertions; after reopening: `bag-entry-kael-3` `'x1'` and `bag-entry-kael-0` count 0 → chips `['3★×1']`; click `bag-card-kael`; `bag-go-fusion` count 0 → `fusion-button-kael-3` disabled.
- `a failed fusion shows the Portuguese error and leaves the bag as it was`: only the opening changes; every assertion stays.
- `a card dropped by a won miniboss shows the notice and joins the bag`: `bag-entry-kael-0` `toContainText('x2')` → `bag-card-kael .bag-card-chip` first `toHaveText('0★×2')`.

`heroAscension.spec.js`

- `three 3-star Kael cards fuse into a 4-star Kael with Corte Dimensional at level 2`: `.fusion-name` `'Kael Raizférrea 3★ → 4★'` → `'3★'`; add `fusion-button-kael-3` `toHaveText('3★→4★')`; keep `'3/3'` and the result.
- `three 8-star Kael cards fuse into a 9-star Kael with every skill at level 3`: `.fusion-name` → `'8★'`; `fusion-button-kael-8` `toHaveText('Fundir')` → `toHaveText('8★→9★')`; keep the result.
- `a 3-star Kael clicks for 1.7 after fusing to 4 stars, without a reload (ASC-06 AC6)`: only the opening changes.
- `a 9-star bag entry cannot be fused` renamed `a 9-star Kael cannot be fused`: `bag-entry-kael-9` texts → `bag-card-star-kael` `'9★'` and chips `['9★×1']`; click `bag-card-kael`; `bag-entry-detail .bag-needed` `'Estrela máxima: não pode ser fundida'` → `fusion-row-kael-9 .fusion-max` same text; `bag-go-fusion` count 0 → `fusion-button-kael-9` count 0.
- `a 3-star bag entry with 3 copies leads to the fusion` renamed `a 3-star Kael with 3 copies shows the Fundir badge and an enabled 3★→4★ button`: `bag-card-fuse-kael` `'Fundir'`; click `bag-card-kael`; `fusion-row-kael-3 .fusion-copies` `'3/3'`; `fusion-button-kael-3` enabled (replaces `Para fundir: 3/3`, `bag-go-fusion` and `is-selected`).
- `a 0-star fusion answers the card without a skill (ASC-07 AC3)`: `.fusion-name` `'Kael Raizférrea 0★ → 1★'` → `'0★'`; keep the result.
- `a failed 4-star fusion shows the error and keeps the row`: only the opening changes.

**Steps**:

1. Edit the tests above, nothing else in either file.
2. Run the gate.

**Tests**: e2e
**Gate**: full - `cd game && npm test && npx playwright test e2e/heroes.spec.js e2e/heroAscension.spec.js`
**Done when**:

- [ ] Both files pass; the number of tests in each file is unchanged.
- [ ] `grep -n "hud-fusion\|bag-entry-kael-\|bag-go-fusion\|fusion-empty\|is-selected" game/e2e/heroes.spec.js game/e2e/heroAscension.spec.js` prints nothing.

**Commit**: `test(game): run the hero fusion e2e through the Mochila`

---

### T15: Move the ui-redesign e2e and the review shots onto the Mochila [ ]

**Owner**: test-engineer
**Goal**: The `ui-redesign` style tests and the existing screenshot scripts stop using the Fusão screen, keeping every style value they assert (BAG-38).
**Where**: `game/e2e/uiRedesign.spec.js`
**Also changes**: `game/ui-review/heroAscension.shots.js`, `game/ui-review/uiRedesign.shots.js`
**Read first**: `game/e2e/uiRedesign.spec.js:270-292`, `:440-450`, `:595-605`, `:620-635`, `:950-975`, `:1540-1580`, `:1636-1648`, `:2100-2120`, its `openScreen` helper; `game/ui-review/heroAscension.shots.js:160-195`; `game/ui-review/uiRedesign.shots.js:255-270`
**Depends on**: T12
**Requirement**: BAG-38

**Contract** (`uiRedesign.spec.js`; every opening of the Fusão screen becomes `hud-bag` then `bag-card-kael`, or `openScreen(page, 'bag')` then `bag-card-kael`):

- around `:280` (style of `fusion-button-kael-1`): opening only; keep every `expectStyle`/`expectShades` value.
- around `:444-449` (`bag-go-fusion` with `EMBER_PILL`, `QUIET`, shades): click `bag-card-kael` instead of `bag-entry-kael-3`; assert the same three checks on `fusion-button-kael-3` (`.bag-fuse` and `.fusion-button` share the ember pill rule, `style.css:136-200`).
- around `:599-602`: opening only.
- `adds no animation or transition to buttons, rail and timer`: the list loses `'hud-fusion'`.
- `draws the rail as framed wood squares on parchment`: `rail` loses `[ 'hud-fusion', 'Fusão' ]`; the exact-order assertion now reads six ids.
- around `:1546` (`.fusion-row` INSET): opening only; keep INSET.
- `draws the empty lines of the fusion and the equipment on the inset recipe`: rename to `draws the empty line of the equipment on the inset recipe`; delete the `fusion-empty` block (the line no longer exists, spec D19); keep the equipment block unchanged.
- `draws the error line in ember`: `openScreen(page, 'fusion')` → `openScreen(page, 'bag')` and click `bag-card-kael`; keep the assertions.
- `shows no magenta in a bag entry and a skill tooltip`: click `bag-card-lyra` instead of `bag-entry-lyra-3`; keep the 3 skill-art magenta checks; the two `.hero-detail-portrait` background assertions move to `page.getByTestId('bag-detail-card-lyra').locator('.bag-card-portrait')` with the same expected substrings `'circle at 50% 45%'` and `'rgb(90, 61, 38)'`.

`heroAscension.shots.js` test `fusion` and `uiRedesign.shots.js` around `:265`: open through `hud-bag` and `bag-card-kael` (and `bag-card-lyra` for the Lyra fusion); drop the `bag-go-fusion` click and the `is-selected` wait; wait for `fusion-row-kael-8` / `fusion-row-kael-1` to be visible instead.

**Steps**:

1. Edit the tests and the two scripts above.
2. Run the gate, then `cd game && npm run ui:shots -- heroAscension uiRedesign` once to prove the scripts run (screenshots it writes under `.specs/features/*/ui-review/` are not committed by this task: restore them with `git checkout -- .specs/features/hero-ascension/ui-review .specs/features/ui-redesign/ui-review` if they changed).

**Tests**: e2e
**Gate**: full - `cd game && npm test && npx playwright test e2e/uiRedesign.spec.js`
**Done when**:

- [ ] `uiRedesign.spec.js` passes; it has the same number of tests as before.
- [ ] `grep -rn "hud-fusion\|bag-go-fusion\|bag-entry-\(kael\|lyra\)-\|fusion-empty" game/e2e game/ui-review` prints nothing.
- [ ] Both shot scripts run without error.

**Commit**: `test(game): move the ui-redesign checks and review shots onto the Mochila`

---

### T16: UI review of the Mochila [ ]

**Owner**: ui-artist
**Goal**: Check every changed screen against design.md § Layout and the owner's mockup and write the review (BAG-01 to BAG-22, BAG-31 to BAG-38, visual part).
**Where**: `.specs/features/hero-bag-cards/ui-review.html` (new, built from the template listed under Read first)
**Also changes**: `game/ui-review/heroBagCards.shots.js` (new)
**Read first**: `.claude/templates/ui-review.html`, `game/ui-review/bulkSell.shots.js` (pattern), `game/ui-review.config.js`, `.specs/features/hero-bag-cards/design.md` § Layout and Visual Spec, `.specs/features/hero-bag-cards/spec.md`
**Depends on**: T13, T14, T15
**Requirement**: BAG-01, BAG-02, BAG-04, BAG-05, BAG-06, BAG-07, BAG-08, BAG-09, BAG-11, BAG-14, BAG-16, BAG-32, BAG-35, BAG-36, BAG-38

**Contract**: `heroBagCards.shots.js` (fake backend, desktop and phone projects) saves, in this order:

1. `01-bag-grid`: Kael 45/1/2 of 0★/1★/2★, Lyra 1×4★, Orina 1×7★, Seraphine and Vex not owned (wood, silver, gold, grey side by side).
2. `02-bag-grid-full`: every hero on all ten layers (45 each): ten chips per card, no scrollbar.
3. `03-card-hover` and `04-card-focus` on Kael.
4. `05-ladder-45-1-2`: Kael detail; `06-ladder-ready-row` with 3 blank copies (rows 0 and 1); `07-ladder-9-star` with 1×9★.
5. `08-fuse-all-confirm` (question and preview), `09-fuse-all-result` (`22 fusões...`), `10-fuse-all-raised` (Kael 9×3★, two raised skills).
6. `11-fusion-busy` (row request held), `12-fusion-error`.
7. `13-rail-six`: the HUD.
8. `14-gems-bag`, `15-gems-slots`, `16-gems-bulk-sell`: Equipamento with one tile of each rarity in the bag and worn pieces.

**Steps**:

1. Write `heroBagCards.shots.js`.
2. `cd game && npm run ui:shots -- heroBagCards` (screenshots land in `.specs/features/hero-bag-cards/ui-review/`).
3. Check each shot against design.md: frame colours and ornaments distinct at a glance and in grayscale; star badge centered and not clipped by the panel; AD-020 colours of the badge and of `.fusion-name`; ribbon readable for every hero name; chips wrap inside the card; `Fundir` badge does not cover the star badge; ladder columns aligned; disabled buttons read as disabled; preview line fits without overflow; gems centered on all three tile places; phone shots readable.
4. Write `ui-review.html` with the verdict (APROVADO or ALTERAÇÕES), every shot, and one numbered finding per problem (selector, what is wrong, exact fix). Findings become new tasks for the product owner.

**Tests**: none (review artifact; the e2e of the behaviour is T13 to T15)
**Gate**: `test -s .specs/features/hero-bag-cards/ui-review.html && cd game && npm run ui:shots -- heroBagCards`
**Done when**:

- [ ] `ui-review.html` exists with a verdict, the 16 screenshots per project and the checks of step 3.
- [ ] Each finding names a selector and an exact fix.

**Commit**: `docs(hero-bag-cards): ui review of the Mochila cards and ladder`

---

## Phase Execution Map

Phases run in sequence; tasks inside a phase run in the listed order (T1, T2, T3; T4, T5, T6; T7, T8, T9, T10; T11, T12; T13, T14, T15; T16).

Packing for workers (~7 tasks, whole phases): batch 1 = Phases 1 and 2 (T1 to T3 `kotlin-backend-dev`, T4 to T6 `game-dev`); batch 2 = Phases 3 and 4 (T7 to T12, `game-dev`); batch 3 = Phases 5 and 6 (T13 to T15 `test-engineer`, then T16 `ui-artist`). After T16 the `verifier` agent (Opus, not an author of this feature) runs as the Verifier; the `test-engineer` runs its author check first.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: PlayerCards.fuseAll | 1 function + 1 exception | ✅ Granular |
| T2: HeroService.fuseAll | 1 use case + 1 method | ✅ Granular |
| T3: fuse-all endpoint | 1 endpoint | ✅ Granular |
| T4: heroesApi.fuseAll | 1 function | ✅ Granular |
| T5: heroCollection.fuseAll | 1 function | ✅ Granular |
| T6: bagCards.js | 1 pure module | ✅ Granular (cohesive rules, one file) |
| T7: gems CSS | 1 rule | ✅ Granular |
| T8: hero card view | 2 functions, 1 file | ⚠️ OK (card + grid, cohesive) |
| T9: ladder view | 1 view module | ⚠️ OK (rows, confirm, detail, cohesive) |
| T10: card and ladder CSS | 1 CSS block | ✅ Granular |
| T11: Mochila wiring | 1 class + removal of the replaced views | ⚠️ OK (one switch, so no commit leaves a broken screen live) |
| T12: Fundir tudo wiring | 3 methods, 1 class | ✅ Granular |
| T13: e2e of the feature + fake route | 1 spec + 1 route | ⚠️ OK (the route exists only for this spec) |
| T14: hero e2e migration | 2 spec files, locators only | ⚠️ OK |
| T15: ui-redesign e2e and shots migration | 1 spec + 2 scripts, locators only | ⚠️ OK |
| T16: UI review | 1 review | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | None | none | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | None | none | ✅ Match |
| T7 | None | none | ✅ Match |
| T8 | T6 | T6 → T8 | ✅ Match |
| T9 | T6, T8 | T6 → T9, T8 → T9 | ✅ Match |
| T10 | T8, T9 | T8 → T10, T9 → T10 | ✅ Match |
| T11 | T8, T9, T10 | T8 → T11, T9 → T11, T10 → T11 | ✅ Match |
| T12 | T3, T5, T11 | T3 → T12, T5 → T12, T11 → T12 | ✅ Match |
| T13 | T7, T12 | T7 → T13, T12 → T13 | ✅ Match |
| T14 | T12 | T12 → T14 | ✅ Match |
| T15 | T12 | T12 → T15 | ✅ Match |
| T16 | T13, T14, T15 | T13 → T16, T14 → T16, T15 → T16 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1 | Backend domain | unit | unit | ✅ OK |
| T2 | Backend service | unit | unit | ✅ OK |
| T3 | Backend web | integration | integration | ✅ OK |
| T4 | Game HTTP adapter | unit | unit | ✅ OK |
| T5 | Game application | unit | unit | ✅ OK |
| T6 | Game domain | unit | unit | ✅ OK |
| T7 | Stylesheet | none | none | ✅ OK |
| T8 | Game views | unit | unit | ✅ OK |
| T9 | Game views | unit | unit | ✅ OK |
| T10 | Stylesheet | none | none | ✅ OK |
| T11 | Game `HeroUi`, views | unit | unit | ✅ OK |
| T12 | Game `HeroUi` | unit | unit | ✅ OK |
| T13 | e2e + fake backend | e2e | e2e | ✅ OK |
| T14 | e2e | e2e | e2e | ✅ OK |
| T15 | e2e | e2e | e2e | ✅ OK |
| T16 | Review artifact | none | none | ✅ OK |

## Requirement Coverage

Every BAG requirement maps to at least one task (spec § Requirement Traceability): 39 total, 39 mapped, 0 unmapped. Player-visible requirements with e2e: BAG-01 to BAG-21 and BAG-31 to BAG-39 (T13, T14, T15); BAG-22 (late answers) and BAG-23 to BAG-30 (server) are unit and integration only, as in `bulk-sell` D14.
