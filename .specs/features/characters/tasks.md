# Characters Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/characters/design.md`
**Status**: In Progress (approved by the owner: "pode seguir no loop até concluí-la"; executed inline, no sub-agents)

Paths: `BE` = `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws`, `BT` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws`, `GS` = `game/src`.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines and spec. Guidelines found: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, `backend/build.gradle.kts` (ktlint), `game/vitest.config.js`, `game/playwright.config.js`, root `CLAUDE.md` (push right after every commit).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; 1:1 to spec ACs; every listed edge case; hand-written fakes, no mocks | `BT/domain/*Test.kt` | `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"` |
| Backend service | unit | All branches and every failure path of the spec, with the in-memory fakes | `BT/service/*Test.kt` | same |
| Backend config | unit | Defaults and rejected values | `BT/adapter/config/*Test.kt` | same |
| Backend exception mapping | unit | Status and `code` per exception base | `BT/adapter/web/*Test.kt` | same |
| Backend repository / seeder | integration | Key query paths, locking contract, sync of rows, idempotent seed | `BT/adapter/repository/*IT.kt`, `BT/adapter/config/*IT.kt` | `cd backend && ./gradlew --offline ktlintCheck test` |
| Backend controller | integration | Every route: happy path, each listed error with status and `code`, 401 | `BT/adapter/web/*IT.kt` | same |
| Backend entity / port interface | none | build gate only (compiled by the next tasks) | - | `cd backend && ./gradlew --offline build` |
| Game domain | unit | All branches; every spec AC for pure rules | `GS/domain/**/*.test.js` | `cd game && npm test` |
| Game application | unit | Success, failure and ordering paths over mocked gateways | `GS/application/**/*.test.js` | `cd game && npm test` |
| Game http adapter | unit | URL, body and returned data, error pass-through | `GS/adapters/http/*.test.js` | `cd game && npm test` |
| Game phaser adapter | unit | DOM output and scene behavior with the Phaser stand-in | `GS/adapters/phaser/*.test.js` | `cd game && npm test` |
| Game flows | e2e | Registration, catalog, bag, fusion, leader, skill bar, farm, drop notice against the fake backend | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |
| Static assets, CSS, docs, e2e support code | none | build gate only | - | `cd game && npm run build` |

## Gate Check Commands

> Generated from the repo manifests (`backend/build.gradle.kts`, `game/package.json`). Docker must run for the backend integration tests.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick (backend) | Backend tasks with unit tests only | `cd backend && ./gradlew --offline ktlintCheck test --tests "*Test"` |
| Quick (game) | Game tasks with unit tests only | `cd game && npm test` |
| Full (backend) | Backend tasks with integration tests | `cd backend && ./gradlew --offline ktlintCheck test` |
| Full (game) | Game tasks with e2e tests | `cd game && npm test && npm run test:e2e` |
| Build | Last task of a phase, or tasks without tests | backend: `cd backend && ./gradlew --offline build`; game: `cd game && npm run build && npm test` |

---

## Execution Plan

Phases run in order; tasks run one at a time. Each task is one atomic commit followed by `git push` (root `CLAUDE.md`).

### Phase 1: Backend domain rules

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
```

### Phase 2: Backend ports, persistence and configuration

```
T8 → T9 → T10 → T11 → T12 → T13 → T14
```

### Phase 3: Registration, drops and the heroes API

```
T15 → T16 → T17 → T18 → T19 → T20 → T21
```

### Phase 4: Farm and backend closing

```
T22 → T23 → T24 → T25
```

### Phase 5: Game foundation

```
T26 → T27 → T28 → T29 → T30 → T31 → T32 → T33 → T34 → T35
```

### Phase 6: Game screens

```
T36 → T37 → T38 → T39 → T40 → T41 → T42 → T43 → T44
```

### Phase 7: Combat scene integration

```
T45 → T46
```

### Phase 8: End to end and documentation

```
T47 → T48 → T49 → T50 → T51
```

---

## Task Breakdown

## Phase 1 tasks: Backend domain rules

### T1: Hero and skill model

**What**: `Hero` and `Skill` data classes with validation (exactly three skills, slots 1 to 3, cooldown at least 1, names not blank).
**Where**: `BE/domain/Hero.kt`
**Depends on**: None
**Reuses**: `Element` in `domain/Chapter.kt`
**Requirement**: CHAR-01

**Done when**:

- [x] A hero without exactly three skills, with repeated or out-of-range slots, a blank name or a cooldown below 1 is rejected with `IllegalArgumentException`
- [x] A valid hero exposes `skills` ordered by slot
- [x] `HeroTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T2: Seed the five README heroes

**What**: `HeroSeed.heroes()` with Kael (FIRE), Lyra (NATURE), Orina (WATER), Seraphine (LIGHT) and Vex (DARKNESS): class, leader bonus, portrait and skill art names, and the 15 skills with type, effect and cooldown exactly as in `README.md`.
**Where**: `BE/domain/HeroSeed.kt`
**Depends on**: T1
**Reuses**: `README.md` text
**Requirement**: CHAR-01

**Done when**:

- [x] Five heroes with ids `kael`, `lyra`, `orina`, `seraphine`, `vex`, elements FIRE, NATURE, WATER, LIGHT, DARKNESS, in README order
- [x] Cooldowns match the README (Kael 20, 25, 30; Lyra 8, 30, 40; Orina 18, 35, 45; Seraphine 30, 25, 45; Vex 15, 35, 20) and every skill has an image name
- [x] Skill art names are the ones of the spec (`kael_dimensional_cut`, `kael_charge`, `kael_screen`, ..., `vex_bleeding_blow`) and portraits are the `*_position` names
- [x] `HeroSeedTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T3: Hero exceptions

**What**: `HeroRequestException` (400), `HeroNotFoundException` (404), `HeroConflictException` (409) bases with the concrete exceptions and stable codes, plus `PlayerCardsMissingException`.
**Where**: `BE/domain/HeroExceptions.kt`
**Depends on**: T2
**Reuses**: `BusinessException`
**Requirement**: CHAR-02

**Done when**:

- [x] Codes are exactly `INVALID_STARTING_ELEMENT`, `INVALID_FUSION`, `HERO_NOT_FOUND`, `NOT_ENOUGH_CARDS`, `HERO_NOT_OWNED`, `DAILY_LIMIT_REACHED`, `BOSS_NOT_AVAILABLE`, `FARM_TOO_FAST`, `PLAYER_WITHOUT_HEROES`
- [x] `InvalidStartingElementException` lives in this file (T4 uses it)
- [x] `HeroExceptionsTest` asserts every code and base type; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T4: Chapter order of elements

**What**: `ChapterOrder` with `elements(start)`, `element(start, chapter)`, `chapterOf(start, element)` and `MAX_CHAPTER = 5`; only FIRE, WATER and NATURE can start.
**Where**: `BE/domain/ChapterOrder.kt`
**Depends on**: T3
**Reuses**: `Element`
**Requirement**: CHAR-01

**Done when**:

- [x] FIRE gives FIRE, NATURE, WATER, DARKNESS, LIGHT; NATURE gives NATURE, WATER, FIRE, DARKNESS, LIGHT; WATER gives WATER, FIRE, NATURE, DARKNESS, LIGHT
- [x] A LIGHT or DARKNESS start throws `InvalidStartingElementException` (defined in T3)
- [x] `ChapterOrderTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T5: Boss record

**What**: `BossRecord` value with the cleared chapters, the UTC day's wins and the last farm win time, and its transitions.
**Where**: `BE/domain/BossRecord.kt`
**Depends on**: T4
**Reuses**: `HeroExceptions.kt`
**Requirement**: CHAR-11

**Done when**:

- [x] `afterChapterBossWin(chapter, today)` adds the chapter and adds 1 to today's wins, starting from 0 when the date changed
- [x] `winsLeft(today, limit)` is `limit - winsToday` for the same date, `limit` for another date, never below 0
- [x] `requireWinsLeft` throws `DailyLimitReachedException` at 10 wins and passes at 9
- [x] `afterFarmWin(now, minIntervalMs)` throws `FarmTooFastException` when `now - last < 5000` and accepts exactly 5000
- [x] `BossRecordTest` covers each bullet (including the date change); quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T6: Card drop rules

**What**: `CardDropRates` and `CardDropper.drop(...)`: which hero, if any, drops for an accepted `CLEARED` report.
**Where**: `BE/domain/CardDrops.kt`
**Depends on**: T5
**Reuses**: `Encounter`, `ChapterOrder`
**Requirement**: CHAR-04

**Done when**:

- [x] `MINIBOSS` drops the hero of the report's chapter when `chance < 0.01` and nothing at 0.01 or more
- [x] `CHAPTER_BOSS` of chapter c below 5 drops the hero of chapter c + 1 with certainty on a first win without reading `chance`, and when `chance < 0.10` otherwise (nothing at 0.10 or more)
- [x] `CHAPTER_BOSS` of chapter 5 drops the hero of chapter 5 by the same rules
- [x] `PHASE` never drops and never reads `chance`
- [x] `CardDropsTest` covers the boundaries 0.0, 0.0099, 0.01, 0.0999, 0.10 and the three starting elements; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T7: Player cards aggregate

**What**: `PlayerCards` with the starting element, leader, copies per (hero, stars) and the boss record; start, add, fuse and leader rules.
**Where**: `BE/domain/PlayerCards.kt`
**Depends on**: T6
**Reuses**: `HeroSeed`, `BossRecord`, `HeroExceptions.kt`
**Requirement**: CHAR-02, CHAR-06, CHAR-07, CHAR-10

**Done when**:

- [x] `start(username, FIRE|WATER|NATURE)` holds one 0-star copy of that element's hero and makes it the leader; LIGHT or DARKNESS is rejected
- [x] `starsOf` is the highest stars with a copy (0 with only blank copies); `owned` is true with any copy
- [x] `fuse(heroId, stars 0..2)` removes 3 copies and adds 1 at stars + 1, leaving every other copy untouched; fewer than 3 copies throws `NotEnoughCardsException`; stars outside 0..2 throws `InvalidFusionException`; 4 blank copies leave 1 blank and 1 one-star copy
- [x] A fusion to stars 3 gives the hero stars 3; stars 3 cannot be fused
- [x] `withLeader` accepts an owned hero and throws `HeroNotOwnedException` otherwise
- [x] `PlayerCardsTest` covers each bullet; quick gate passes; the phase build gate passes (`./gradlew --offline build`)

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend), then Build at the end of the phase

---

## Phase 2 tasks: Backend ports, persistence and configuration

### T8: Hero ports and fakes

**What**: `HeroRepositoryPort`, `PlayerCardsRepositoryPort`, `ChanceRollerPort`, and their in-memory fakes in `Fakes.kt` (including a scripted chance roller).
**Where**: `BE/port/HeroPorts.kt`
**Depends on**: T7
**Reuses**: `port/ProgressPorts.kt` shape, `Fakes.kt`
**Requirement**: CHAR-01, CHAR-04

**Done when**:

- [x] Ports compile with the methods of the design
- [x] `InMemoryHeroRepository`, `InMemoryPlayerCardsRepository` and `SequenceChanceRoller` exist in `BT/Fakes.kt`
- [x] Build gate passes

**Status**: Done
**Tests**: none (interfaces and fakes; exercised by the next tasks)
**Gate**: Build

---

### T9: Hero catalog entities

**What**: `HeroEntity` and `HeroSkillEntity` mapped to `heroes` and `hero_skills`, with `toDomain` and `from`.
**Where**: `BE/adapter/repository/HeroEntities.kt`
**Depends on**: T8
**Reuses**: `WalletEntities.kt` mapping style
**Requirement**: CHAR-01

**Done when**:

- [x] Entities map every `Hero` and `Skill` field both ways
- [x] Build gate passes

**Status**: Done
**Tests**: none (entity; covered by T10)
**Gate**: Build

---

### T10: Hero repository

**What**: `JpaHeroRepository` and `HeroRepository` implementing `HeroRepositoryPort` (`findAll` in sort order, `findById`, `existsById`, `saveAll`).
**Where**: `BE/adapter/repository/HeroRepository.kt`
**Depends on**: T9
**Reuses**: `ChapterRepository.kt`
**Requirement**: CHAR-01

**Done when**:

- [x] Saved heroes come back equal, with skills ordered by slot and heroes in README order
- [x] `findById` returns null for an unknown id
- [x] `HeroRepositoryIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T11: Hero seeder

**What**: `HeroSeeder` (ApplicationRunner) that inserts the seed heroes that are missing and never overwrites.
**Where**: `BE/adapter/config/HeroSeeder.kt`
**Depends on**: T10
**Reuses**: `ChapterSeeder.kt`
**Requirement**: CHAR-01

**Done when**:

- [x] An empty table gets five heroes
- [x] A second run changes nothing, and an edited hero name survives
- [x] `HeroSeederIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T12: Player cards entities

**What**: `PlayerCardsEntity` (`player_cards`) and `CardCopyEntity` (`card_copies`) with `toDomain` and `from`.
**Where**: `BE/adapter/repository/PlayerCardsEntities.kt`
**Depends on**: T11
**Reuses**: `WalletEntities.kt`
**Requirement**: CHAR-02, CHAR-11

**Done when**:

- [x] Entities round-trip `PlayerCards` including the boss record (comma-separated cleared chapters, day as ISO text)
- [x] Build gate passes

**Status**: Done
**Tests**: none (entity; covered by T13)
**Gate**: Build

---

### T13: Player cards repository

**What**: `JpaPlayerCardsRepository` and `PlayerCardsRepository`: `findForUpdate` (row lock), `createIfAbsent`, `save` (syncs copy rows), `deleteByUsername`; `IntegrationTestBase` cleanup for the new tables.
**Where**: `BE/adapter/repository/PlayerCardsRepository.kt`
**Depends on**: T12
**Reuses**: `WalletRepository.kt`, `IntegrationTestBase.kt`
**Requirement**: CHAR-02, CHAR-06

**Done when**:

- [x] A saved aggregate reads back equal (copies, leader, boss record)
- [x] `save` deletes a copy row whose count dropped to 0 and updates changed counts
- [x] `createIfAbsent` twice keeps the first row
- [x] `deleteByUsername` removes the aggregate and its copy rows
- [x] `PlayerCardsRepositoryIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T14: Card configuration

**What**: `CardProperties` bound from `app.cards.*` (defaults 0.01, 0.10, 10, 5000), validation, `CardDropRates` and the `ChanceRollerPort` beans; `application.yaml` section.
**Where**: `BE/adapter/config/CardConfig.kt`
**Depends on**: T13
**Reuses**: `WalletConfig.kt`
**Requirement**: CHAR-04, CHAR-11

**Done when**:

- [x] Defaults are 0.01, 0.10, 10 and 5000; a rate outside 0..1, a limit below 1 or an interval below 0 is rejected at construction
- [x] `CardConfigTest` passes; quick gate passes; phase build gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend), then Build at the end of the phase

---

## Phase 3 tasks: Registration, drops and the heroes API

### T15: Map hero exceptions to HTTP

**What**: `ApiExceptionHandler` handlers: `HeroRequestException` 400, `HeroNotFoundException` 404, `HeroConflictException` 409, each with `code`.
**Where**: `BE/adapter/web/ApiExceptionHandler.kt`
**Depends on**: T14
**Reuses**: existing `problem(...)` helper
**Requirement**: CHAR-02, CHAR-06

**Done when**:

- [x] Each base maps to its status and carries the exception `code` property
- [x] `ApiExceptionHandlerTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T16: Register with a starting hero (service)

**What**: `CreateUserUseCase.create(username, password, startingElement)` and `UserService`: register the user, then create its `PlayerCards`; delete the cards with the user.
**Where**: `BE/service/UserService.kt`
**Depends on**: T15
**Reuses**: `PlayerCards.start`, `PlayerCardsRepositoryPort`
**Requirement**: CHAR-02

**Done when**:

- [x] `create` with FIRE, WATER or NATURE stores the user and a `PlayerCards` with one blank copy of that element's hero and that hero as leader
- [x] `create` with LIGHT or DARKNESS throws `InvalidStartingElementException` and stores no user
- [x] A failing cards save leaves no user (the exception propagates from the one transaction)
- [x] `delete` removes the user's cards
- [x] `UserServiceTest` updated and passing; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T17: Register with a starting hero (HTTP)

**What**: `CreateUserRequest.startingElement`, parsing, the 400 for a missing or unknown value, and every existing backend integration test that creates a user updated to send it.
**Where**: `BE/adapter/web/UserController.kt`
**Depends on**: T16
**Reuses**: `UserControllerIT`
**Requirement**: CHAR-02

**Done when**:

- [x] `POST /users` with `startingElement` WATER answers 201 and the bag holds one blank Orina card (read through the repository in the IT)
- [x] A missing value, `"LIGHT"`, `"DARKNESS"` and `"plasma"` answer 400 with `code` `INVALID_STARTING_ELEMENT` and create no user
- [x] All other backend ITs that register users pass with the new field; full backend gate passes

**Status**: Done (delivered in the T16 commit `9416481`: the use case signature change forced the controller change to compile, so the two tasks share one commit)
**Tests**: integration
**Gate**: Full (backend)

---

### T18: Drops on outcome reports (service)

**What**: `ReportOutcomeUseCase` returns `OutcomeResult(view, drop)`; `ProgressService` loads the locked `PlayerCards` after an accepted report, asks `CardDropper`, adds the card, records a chapter boss win and saves; `ProgressController` is adjusted only to compile (`.view`).
**Where**: `BE/service/ProgressService.kt`
**Depends on**: T17
**Reuses**: `CardDropper`, `CardDropRates`, `ChanceRollerPort`, `Clock`
**Requirement**: CHAR-04, CHAR-05

**Done when**:

- [x] Miniboss `CLEARED` with chance 0.0 adds a blank card of the chapter's hero and returns it; with 0.5 adds none
- [x] First chapter boss win adds the next chapter's hero without reading the chance; a second win rolls 10 %
- [x] Phase `CLEARED` and any `FAILED` add nothing and read no chance
- [x] A rejected report (conflict) reads no chance and adds nothing
- [x] A cards save failure propagates (the progress move is in the same transaction)
- [x] A player without `PlayerCards` gets no drop and the report is still accepted
- [x] A chapter boss win adds 1 to today's wins (UTC clock)
- [x] `ProgressServiceTest` updated and passing; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T19: Drop in the outcome response

**What**: `ProgressResponse` for the outcome route gains `drop` (`{ heroId, heroName, stars }` or `null`).
**Where**: `BE/adapter/web/ProgressController.kt`
**Depends on**: T18
**Reuses**: `ProgressControllerIT`
**Requirement**: CHAR-05

**Done when**:

- [x] `POST /progress/outcome` answers `drop` null when nothing dropped and the card object when one did (test seeds the cards row and uses a controllable chance bean)
- [x] `GET /progress` is unchanged
- [x] `ProgressControllerIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T20: Heroes service

**What**: `HeroUseCase` (`list`, `fuse`, `setLeader`) and `HeroService`, including the per-player chapter and the unlocked skills in the result model.
**Where**: `BE/service/HeroService.kt`
**Depends on**: T19
**Reuses**: `PlayerCards`, `ChapterOrder`, `HeroRepositoryPort`
**Requirement**: CHAR-06, CHAR-07, CHAR-10

**Done when**:

- [x] `list` returns every catalog hero with chapter (1 to 5 from the starting element), copies per stars 0 to 3, owned, stars, unlocked skills (skill n unlocked when stars ≥ n) and the leader id
- [x] `fuse` applies the rule, saves and returns the hero; `NOT_ENOUGH_CARDS`, `INVALID_FUSION` and `HERO_NOT_FOUND` leave the bag unchanged
- [x] `setLeader` stores an owned hero; `HERO_NOT_OWNED` and `HERO_NOT_FOUND` keep the leader
- [x] A player without `PlayerCards` gets `PlayerCardsMissingException`
- [x] `HeroServiceTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T21: Heroes controller

**What**: `GET /heroes`, `POST /heroes/{id}/fuse`, `PUT /leader` with the JSON of the design.
**Where**: `BE/adapter/web/HeroController.kt`
**Depends on**: T20
**Reuses**: `ProgressController.kt` parsing style
**Requirement**: CHAR-06, CHAR-07, CHAR-10

**Done when**:

- [x] `GET /heroes` answers 200 with five heroes, the leader id, chapter numbers per the starting element and `unlocked` flags
- [x] Fuse answers 200 with the updated hero; 409 `NOT_ENOUGH_CARDS`, 400 `INVALID_FUSION` for stars missing, -1 and 3, 404 `HERO_NOT_FOUND`
- [x] `PUT /leader` answers 200 for an owned hero, 409 `HERO_NOT_OWNED`, 404 `HERO_NOT_FOUND`
- [x] Every route answers 401 without a token and a player only touches their own bag
- [x] `HeroControllerIT` passes; full backend gate passes; phase build gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend), then Build at the end of the phase

---

## Phase 4 tasks: Farm and backend closing

### T22: Farm service

**What**: `FarmUseCase` (`state`, `report`) and `FarmService`: eligibility from the stored progress, farm win drops, the daily limit and the throttle.
**Where**: `BE/service/FarmService.kt`
**Depends on**: T21
**Reuses**: `CardDropper`, `BossRecord`, `ProgressRepositoryPort`
**Requirement**: CHAR-11

**Done when**:

- [x] `state` lists the miniboss of every stage below the current one (all stages when completed) and the chapter boss only when completed, with `chapterBossWinsLeft`
- [x] A `CLEARED` miniboss farm report rolls 1 %; a `CLEARED` chapter boss farm report rolls 10 % for the next chapter's hero and adds 1 to today's wins
- [x] `FAILED` rolls nothing and changes nothing; the progress position and completed flag never change
- [x] A boss not yet beaten throws `BossNotAvailableException`; the 11th chapter boss win of a UTC day throws `DailyLimitReachedException`; a win under 5 000 ms after the previous farm win throws `FarmTooFastException`; none of them rolls or changes anything
- [x] The count restarts the next UTC day
- [x] `FarmServiceTest` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (backend)

---

### T23: Farm controller

**What**: `GET /farm` and `POST /farm/outcome { boss: { kind, stage }, outcome }`.
**Where**: `BE/adapter/web/FarmController.kt`
**Depends on**: T22
**Reuses**: `ProgressController.kt` parsing
**Requirement**: CHAR-11

**Done when**:

- [x] `GET /farm` answers the bosses and wins left; 401 without a token
- [x] A valid farm win answers 200 with `drop` and `chapterBossWinsLeft`
- [x] 409 with `code` `DAILY_LIMIT_REACHED`, `BOSS_NOT_AVAILABLE` and `FARM_TOO_FAST`; 400 for a malformed body
- [x] `FarmControllerIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T24: Cards flow integration test

**What**: One end-to-end backend scenario over real HTTP: register, clear phases, drop, bag, fuse to 1 star, change leader, farm.
**Where**: `BT/adapter/web/CardsFlowIT.kt`
**Depends on**: T23
**Reuses**: `WalletFlowIT.kt`
**Requirement**: CHAR-02, CHAR-04, CHAR-06, CHAR-07, CHAR-10, CHAR-11

**Done when**:

- [x] A player registers with FIRE, receives Kael, wins a miniboss with a forced drop, holds 2 blank Kael cards, receives a second blank card at the next forced drop and a third, fuses stars 0 and reads 1 one-star copy
- [x] The scenario reads the state only through the HTTP routes
- [x] `CardsFlowIT` passes; full backend gate passes

**Status**: Done
**Tests**: integration
**Gate**: Full (backend)

---

### T25: Backend ADR and decisions

**What**: `backend/docs/adr/0007-hero-cards.md` and `AD-005` to `AD-007` appended to `.specs/STATE.md`.
**Where**: `backend/docs/adr/0007-hero-cards.md`
**Depends on**: T24
**Requirement**: CHAR-02, CHAR-04

**Done when**:

- [x] The ADR states the aggregate, the lock order, the drop-in-transaction rule, the chapter order rule, the farm limits and their trade-offs, in the style of ADR 0005
- [x] `STATE.md` has the three active decisions
- [x] Build gate passes

**Status**: Done
**Tests**: none (documentation)
**Gate**: Build

---

## Phase 5 tasks: Game foundation

### T26: Hero art assets

**What**: Copy the 20 art files used (5 `*_position.jpg` portraits, 15 skill images) from `art/` to `game/public/assets/heroes/`, unchanged.
**Where**: `game/public/assets/heroes/`
**Depends on**: T25
**Requirement**: CHAR-08

**Done when**:

- [x] Every portrait and skill name of the seed has its `.jpg` in the folder
- [x] Build gate passes

**Status**: Done
**Tests**: none (static assets)
**Gate**: Build

---

### T27: Sign up with a starting hero (API)

**What**: `userApi.signUp(username, password, startingElement)` sends the element.
**Where**: `GS/adapters/http/userApi.js`
**Depends on**: T26
**Reuses**: `userApi.test.js`
**Requirement**: CHAR-03

**Done when**:

- [x] The request body is `{ username, password, startingElement }` and keeps `skipAuth`
- [x] `userApi.test.js` updated and passing; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T28: Heroes API

**What**: `createHeroesApi(httpClient)`: `list()`, `fuse(heroId, stars)`, `setLeader(heroId)`.
**Where**: `GS/adapters/http/heroesApi.js`
**Depends on**: T27
**Reuses**: `walletApi.js`
**Requirement**: CHAR-08, CHAR-09, CHAR-10

**Done when**:

- [x] `GET /heroes`, `POST /heroes/{id}/fuse { stars }`, `PUT /leader { heroId }`, returning the response data
- [x] `heroesApi.test.js` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T29: Farm API

**What**: `createFarmApi(httpClient)`: `get()` and `win(boss)` (`POST /farm/outcome` with outcome `CLEARED`).
**Where**: `GS/adapters/http/farmApi.js`
**Depends on**: T28
**Reuses**: `progressApi.js`
**Requirement**: CHAR-12

**Done when**:

- [x] `GET /farm` and `POST /farm/outcome { boss, outcome: 'CLEARED' }`, returning the data
- [x] `farmApi.test.js` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T30: Hero rules in the domain

**What**: `domain/heroes/heroes.js`: `bagEntries`, `fusionRows`, `unlockedSlots`, `applyDrop`, `ELEMENT_LABELS`, `STARTING_CHOICES`.
**Where**: `GS/domain/heroes/heroes.js`
**Depends on**: T29
**Reuses**: `domain/combat/elements.js` element ids
**Requirement**: CHAR-03, CHAR-08, CHAR-09

**Done when**:

- [x] `bagEntries` lists only (hero, stars) pairs with copies ≥ 1; `fusionRows` has one row per hero and stars 0 to 2 with `canFuse` true from 3 copies
- [x] `applyDrop` adds one blank copy and marks the hero owned without mutating its input
- [x] Labels `Fogo`, `Água`, `Natureza`, `Luz`, `Escuridão`; starting choices `Fogo - Kael`, `Água - Orina`, `Natureza - Lyra`
- [x] `heroes.test.js` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T31: Farm encounters in the campaign

**What**: `Campaign.farmEncounter({ kind, stage })` returns the encounter of a defeated boss.
**Where**: `GS/domain/campaign/campaign.js`
**Depends on**: T30
**Reuses**: `encounter()`
**Requirement**: CHAR-12

**Done when**:

- [x] A miniboss encounter has the stage's health, stats, time limit and the label `Rever chefe: Miniboss <stage>`; the chapter boss uses the boss health, stats, limit and the label `Rever chefe: Chefe do capítulo`; both have `kind: 'FARM'`
- [x] An unknown stage or kind throws
- [x] `campaign.test.js` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T32: Campaign session drops and farm encounters

**What**: `campaignSession.onDrop(callback)` fires with the `drop` of each accepted report; `farmEncounter(boss)` delegates to the campaign.
**Where**: `GS/application/campaign/campaignSession.js`
**Depends on**: T31
**Reuses**: `flush()`
**Requirement**: CHAR-09, CHAR-12

**Done when**:

- [x] A report response with a `drop` calls the callback once, after the report left the queue; `drop: null` calls nothing
- [x] A failed report calls nothing and keeps its place in the queue
- [x] `farmEncounter` returns the farm encounter without touching the queue or the position
- [x] `campaignSession.test.js` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T33: Hero collection service

**What**: `createHeroCollection({ gateway })`: `load`, `heroes`, `leader`, `fuse`, `setLeader`, `applyDrop`, `onChange`.
**Where**: `GS/application/heroes/heroCollection.js`
**Depends on**: T32
**Reuses**: `walletSync.js` shape
**Requirement**: CHAR-08, CHAR-09, CHAR-10

**Done when**:

- [x] `load` stores the payload and fires `onChange`; a rejection leaves the previous state and rethrows
- [x] `fuse` replaces that hero with the response and fires `onChange`; a rejection leaves the bag unchanged
- [x] `setLeader` updates the leader after the server answers; a rejection keeps the old leader
- [x] `applyDrop` adds the blank copy locally and fires `onChange`
- [x] `heroCollection.test.js` passes; quick gate passes

**Status**: Done
**Tests**: unit
**Gate**: Quick (game)

---

### T34: Farm session service

**What**: `createFarmSession({ gateway })`: `load`, `bosses`, `winsLeft`, `win(boss)`.
**Where**: `GS/application/farm/farmSession.js`
**Depends on**: T33
**Reuses**: `campaignSession.js` shape
**Requirement**: CHAR-12

**Done when**:

- [ ] `load` keeps the bosses and wins left
- [ ] `win` sends one request, updates `winsLeft` from the response and resolves with it; a rejection rethrows and keeps the state
- [ ] `farmSession.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T35: Composition wiring

**What**: Build the heroes and farm APIs and expose `createHeroCollection` and `createFarmSession` in `services`.
**Where**: `GS/composition.js`
**Depends on**: T34
**Reuses**: existing exports
**Requirement**: CHAR-08, CHAR-12

**Done when**:

- [ ] `services` has `createHeroCollection` and `createFarmSession` returning fresh services
- [ ] `composition.test.js` asserts the keys; architecture test still passes
- [ ] Build gate passes

**Tests**: unit
**Gate**: Build

---

## Phase 6 tasks: Game screens

### T36: Registration form hero choice

**What**: Three choices (`Fogo - Kael`, `Água - Orina`, `Natureza - Lyra`) with portraits in the sign-up form, sent with the registration; `Escolha seu herói inicial.` when none is picked.
**Where**: `GS/adapters/phaser/MainMenu.js`
**Depends on**: T35
**Reuses**: `MainMenu.test.js` harness
**Requirement**: CHAR-03

**Done when**:

- [ ] Sign up with a hero calls `users.signUp(username, password, element)` with FIRE, WATER or NATURE
- [ ] Sign up with no hero shows `Escolha seu herói inicial.` and sends no request
- [ ] Login does not need a hero
- [ ] `MainMenu.test.js` updated and passing; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T37: Styles for the hero UI

**What**: CSS for the HUD buttons, the panels, hero cards (colour and grey), the skill rows, the skill bar, the notice and the registration choices.
**Where**: `game/public/style.css`
**Depends on**: T36
**Requirement**: CHAR-08, CHAR-09, CHAR-10

**Done when**:

- [ ] Classes used by the views exist (`.hero-hud`, `.hero-panel`, `.hero-card.is-grey`, `.skill-row.is-locked`, `.skill-bar`, `.skill-slot.is-locked`, `.card-notice`, `.hero-choice`)
- [ ] Build gate passes

**Tests**: none (CSS)
**Gate**: Build

---

### T38: Catalog and hero detail view

**What**: `catalogView.js`: DOM for the hero grid (colour/grey, name, element, stars) and the hero detail (portrait, class, element, leader bonus, three skills with art, name, type, effect, cooldown and lock state).
**Where**: `GS/adapters/phaser/views/catalogView.js`
**Depends on**: T37
**Reuses**: `domain/heroes/heroes.js`
**Requirement**: CHAR-08

**Done when**:

- [ ] Owned heroes are not grey; not owned heroes carry `is-grey`; every hero shows name, element label and stars
- [ ] The detail shows three skills for any hero, each marked locked or unlocked from the stars, with stable test ids
- [ ] `catalogView.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T39: Bag view

**What**: `bagView.js`: DOM for the bag list and a bag entry detail (name, stars, copies, copies needed, the three skills with lock state, button to Fusão).
**Where**: `GS/adapters/phaser/views/bagView.js`
**Depends on**: T38
**Reuses**: `catalogView.js` skill rows
**Requirement**: CHAR-09

**Done when**:

- [ ] Only pairs with copies appear, with their counts
- [ ] The detail shows the copies out of 3, all three skills with lock state and a `Fundir` shortcut that calls the given callback with the entry
- [ ] `bagView.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T40: Fusion view

**What**: `fusionView.js`: one row per (hero, stars 0 to 2) with copies out of 3 and a `Fundir` button enabled from 3 copies; the result card after a fusion.
**Where**: `GS/adapters/phaser/views/fusionView.js`
**Depends on**: T39
**Reuses**: `domain/heroes/heroes.js`
**Requirement**: CHAR-09

**Done when**:

- [ ] A row with 2 copies has a disabled button; with 3 copies it is enabled and calls the callback with `(heroId, stars)`
- [ ] A preselected entry is highlighted
- [ ] The result card shows the hero and the new stars
- [ ] `fusionView.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T41: Leader view

**What**: `leaderView.js`: the list of owned heroes with the current leader marked, calling back when another is picked.
**Where**: `GS/adapters/phaser/views/leaderView.js`
**Depends on**: T40
**Requirement**: CHAR-10

**Done when**:

- [ ] Only owned heroes are listed; the leader has `is-current`
- [ ] Picking another hero calls the callback with its id
- [ ] `leaderView.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T42: Farm view

**What**: `farmView.js`: the repeatable bosses by name, the chapter boss with the wins left today, and a choose callback.
**Where**: `GS/adapters/phaser/views/farmView.js`
**Depends on**: T41
**Requirement**: CHAR-12

**Done when**:

- [ ] Names read `Miniboss <stage>` and `Chefe do capítulo`, the latter with `<n> vitórias restantes hoje`
- [ ] The chapter boss button is disabled at 0 wins left
- [ ] Picking a boss calls the callback with `{ kind, stage }`
- [ ] `farmView.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T43: Skill bar view

**What**: `skillBar.js`: three slots with the leader's skill art, name and cooldown seconds; slots above the leader's stars are dimmed with a lock mark; clicking does nothing.
**Where**: `GS/adapters/phaser/views/skillBar.js`
**Depends on**: T42
**Requirement**: CHAR-10

**Done when**:

- [ ] Stars 0 gives three locked slots; stars 1 unlocks slot 1; stars 3 unlocks all
- [ ] Each slot shows art, name and `<n>s`
- [ ] Clicking a slot does not throw and does not call any callback
- [ ] `skillBar.test.js` passes; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T44: Hero UI controller

**What**: `HeroUi`: HUD buttons (`Heróis`, `Mochila`, `Fusão`, `Líder`, `Rever chefes`), panel open and close, wiring to the services, error line in Portuguese, pause hooks, skill bar refresh, the `Carta: <nome>` notice for 3 s.
**Where**: `GS/adapters/phaser/HeroUi.js`
**Depends on**: T43
**Reuses**: `createHtml` pattern in `ClickerGame.js`, the views, `heroCollection`, `farmSession`
**Requirement**: CHAR-08, CHAR-09, CHAR-10, CHAR-12

**Done when**:

- [ ] The five HUD buttons exist in the HUD and none is in the pause menu
- [ ] Each panel loads its data on open, shows an error line (`Não foi possível carregar.` or the fuse failure) and no grid on a failed load
- [ ] Opening a panel calls `pauseForMenu`, closing it calls `resumeFromMenu`
- [ ] A successful fuse updates the screen and the skill bar; changing the leader replaces the three slots
- [ ] `showDrop(drop)` shows `Carta: <hero name>` and removes it after 3 s
- [ ] Choosing a boss in the farm list calls `startFarm(boss)` and closes the panel
- [ ] `HeroUi.test.js` passes; quick gate passes; phase build gate passes

**Tests**: unit
**Gate**: Quick (game), then Build at the end of the phase

---

## Phase 7 tasks: Combat scene integration

### T45: Hero UI in the combat scene

**What**: `ClickerGame` creates `HeroUi`, loads the heroes, exposes `pauseForMenu` and `resumeFromMenu`, forwards `session.onDrop` to the notice and to `applyDrop`.
**Where**: `GS/adapters/phaser/ClickerGame.js`
**Depends on**: T44
**Reuses**: `pauseFight`, `resumeFight`
**Requirement**: CHAR-09, CHAR-10

**Done when**:

- [ ] The scene shows the HUD buttons and, once the heroes load, the skill bar of the leader
- [ ] Opening a panel freezes the fight like the pause menu (no damage, countdown stopped) and closing it resumes, and never resumes a fight the player paused with Esc
- [ ] An accepted report with a drop shows the notice and adds the blank copy to the bag
- [ ] A failed heroes load leaves the scene playable
- [ ] `ClickerGame.test.js` updated (services gain the new factories) and passing with no existing assertion weakened; quick gate passes

**Tests**: unit
**Gate**: Quick (game)

---

### T46: Farm mode in the combat scene

**What**: `ClickerGame.startFarm(boss)`: fights the defeated boss from the campaign definition, reports each win through `farmSession`, restarts the same boss, shows `Rever chefe: ...`, leaves the loop on the daily limit or on Leave fight.
**Where**: `GS/adapters/phaser/ClickerGame.js`
**Depends on**: T45
**Reuses**: `showEncounter`, `bossTimedOut`, `leaveFight`
**Requirement**: CHAR-12

**Done when**:

- [ ] Picking a boss shows its encounter with the farm label and its time limit; the saved campaign position and the report queue are untouched
- [ ] A win sends one farm request, shows the drop notice when `drop` is set and starts the boss again
- [ ] A timeout restarts the same boss with no request; Leave fight returns to the campaign encounter
- [ ] When `chapterBossWinsLeft` reaches 0 the loop ends, the campaign view returns and the farm list shows 0 wins left
- [ ] A rejected win (409) ends the attempt without a notice and reloads the farm state
- [ ] `ClickerGame.test.js` passes; quick gate passes; phase build gate passes

**Tests**: unit
**Gate**: Quick (game), then Build at the end of the phase

---

## Phase 8 tasks: End to end and documentation

### T47: Fake backend for cards

**What**: `fakeBackend.js` serves registration with `startingElement`, `/heroes`, `/heroes/{id}/fuse`, `/leader`, `/farm`, `/farm/outcome` and the `drop` in outcome responses (options: `heroes`, `chances`, `winsToday`), mirroring the Kotlin contract and error codes.
**Where**: `game/e2e/support/fakeBackend.js`
**Depends on**: T46
**Requirement**: CHAR-02 to CHAR-12

**Done when**:

- [ ] Routes and codes match the backend ITs (400, 404, 409 and their `code`)
- [ ] Existing e2e specs still pass untouched except where T48 changes them
- [ ] Build gate passes

**Tests**: none (test support; exercised by T48 to T50)
**Gate**: Build

---

### T48: Registration e2e

**What**: Update `auth.spec.js` and the `game.js` helper for the hero choice and add the registration scenarios.
**Where**: `game/e2e/auth.spec.js`
**Depends on**: T47
**Reuses**: `e2e/support/game.js`
**Requirement**: CHAR-03

**Done when**:

- [ ] Sign up with Água - Orina sends `startingElement: 'WATER'` and reaches the welcome screen
- [ ] Sign up with no hero shows `Escolha seu herói inicial.` and the fake backend records no `POST /users`
- [ ] The other existing auth scenarios pass
- [ ] Full game gate passes

**Tests**: e2e
**Gate**: Full (game)

---

### T49: Heroes e2e

**What**: Scenarios for the catalog (one colour, four grey, locked skills), bag, fusion to 1 star, leader change and the skill bar.
**Where**: `game/e2e/heroes.spec.js`
**Depends on**: T48
**Requirement**: CHAR-08, CHAR-09, CHAR-10

**Done when**:

- [ ] Heróis shows Kael in colour and four grey heroes; a grey hero's detail shows three locked skills
- [ ] 3 blank copies in Mochila, Fundir in Fusão, the bag shows 1 one-star copy and the skill bar unlocks slot 1
- [ ] Changing the leader replaces the skill bar and a failed fuse shows the Portuguese error
- [ ] Full game gate passes

**Tests**: e2e
**Gate**: Full (game)

---

### T50: Farm e2e

**What**: Scenarios for the farm list, a won farm fight with a drop notice, the chapter boss limit and the throttle.
**Where**: `game/e2e/farm.spec.js`
**Depends on**: T49
**Requirement**: CHAR-09, CHAR-12

**Done when**:

- [ ] With a completed campaign, `Rever chefes` lists the minibosses and the chapter boss with 10 wins left
- [ ] A won farm fight sends `POST /farm/outcome`, shows `Carta: Kael` when the fake drops and restarts the boss
- [ ] At 0 wins left the chapter boss button is disabled
- [ ] The campaign position is unchanged after farming
- [ ] Full game gate passes

**Tests**: e2e
**Gate**: Full (game)

---

### T51: Game ADR and handoff

**What**: `game/docs/adr/0009-hero-cards.md`, STATE handoff and the TD-001 pointer.
**Where**: `game/docs/adr/0009-hero-cards.md`
**Depends on**: T50
**Requirement**: CHAR-08

**Done when**:

- [ ] The ADR describes the services, `HeroUi`, farm mode, the art files and their size, and the Portuguese rule with TD-001
- [ ] `STATE.md` handoff names this feature as done pending the Verifier
- [ ] Build gate passes

**Tests**: none (documentation)
**Gate**: Build

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8

Phase 1:  T1 → T2 → T3 → T4 → T5 → T6 → T7
Phase 2:  T8 → T9 → T10 → T11 → T12 → T13 → T14
Phase 3:  T15 → T16 → T17 → T18 → T19 → T20 → T21
Phase 4:  T22 → T23 → T24 → T25
Phase 5:  T26 → T27 → T28 → T29 → T30 → T31 → T32 → T33 → T34 → T35
Phase 6:  T36 → T37 → T38 → T39 → T40 → T41 → T42 → T43 → T44
Phase 7:  T45 → T46
Phase 8:  T47 → T48 → T49 → T50 → T51
```

Execution is strictly sequential, inline in the main session (the owner asked to run the feature to completion; no sub-agents are spawned). The Verifier runs once after T51.

---

## Requirement Traceability (task → requirement)

| Requirement | Tasks |
| ----------- | ----- |
| CHAR-01 | T1, T2, T3, T8, T9, T10, T11 |
| CHAR-02 | T4, T7, T12, T13, T15, T16, T17, T24 |
| CHAR-03 | T27, T30, T36, T48 |
| CHAR-04 | T6, T8, T14, T18, T24 |
| CHAR-05 | T18, T19 |
| CHAR-06 | T7, T13, T20, T21, T24 |
| CHAR-07 | T7, T20, T21, T24 |
| CHAR-08 | T26, T28, T30, T33, T35, T37, T38, T44, T49 |
| CHAR-09 | T28, T32, T33, T37, T39, T40, T44, T45, T49 |
| CHAR-10 | T7, T20, T21, T28, T33, T37, T41, T43, T44, T45, T49 |
| CHAR-11 | T5, T12, T14, T22, T23, T24 |
| CHAR-12 | T29, T31, T32, T34, T35, T42, T44, T46, T50 |
