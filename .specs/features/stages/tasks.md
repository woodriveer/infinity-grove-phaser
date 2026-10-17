# Stages Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/stages/design.md`
**Status**: Approved

Execution notes: the user asked for the loop to run to the end of the spec, so tasks run inline in one session (no batch sub-agents), and `CLAUDE.md` makes `git push` part of every commit. Unrelated working-tree changes (`game/src/scenes/Preloader.js`, `game/public/assets/coin-*.png`) are never staged by a task; T14 moves `Preloader.js` and takes that file's pending change with it, so the change is committed on its own first (T14 step 0).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/docs/adr/0002-testing.md` (unit tests mandatory for domain and service; Testcontainers ITs for DB/HTTP; `ktlintCheck test` before merge), `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, `game/vitest.config.js`, `game/playwright.config.js`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain and service | unit | All branches; 1:1 to spec ACs; every listed edge case; no Spring, hand-written fakes | `backend/src/test/kotlin/**/domain/*Test.kt`, `**/service/*Test.kt` | `cd backend && ./gradlew ktlintCheck test --tests "*Test"` |
| Backend repository, config, controller | integration | Key query paths, lock/concurrency, every route: happy + edge + error | `backend/src/test/kotlin/**/*IT.kt` | `cd backend && ./gradlew ktlintCheck test` (Docker) |
| Backend ports, use cases, entities, ADR docs | none | - (build gate only) | - | `cd backend && ./gradlew ktlintCheck build -x test` |
| Game domain and application | unit | All branches; 1:1 to spec ACs; every listed edge case; fakes for ports, no Phaser | `game/src/domain/**/*.test.js`, `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game adapters (http, storage, scenes) | unit | Collaborators mocked; request shape, result mapping, every scene-level AC | `game/src/adapters/**/*.test.js` | `cd game && npm test` |
| Architecture rule | unit | Import-direction rule of ADR 0007 | `game/src/architecture.test.js` | `cd game && npm test` |
| Player flow | e2e | Happy path and the failed-boss and reload paths in a real browser | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |
| Composition, docs, e2e support | none | - (build gate only) | - | `cd game && npm run build && npm test` |

## Gate Check Commands

> Generated from codebase. Backend runs from `backend/` (Docker must be up), game from `game/`.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | backend: `./gradlew ktlintCheck test --tests "*Test"`; game: `npm test` |
| Full | After tasks with integration or e2e tests | backend: `./gradlew ktlintCheck test`; game: `npm test && npm run test:e2e` |
| Build | After phase completion or config/docs-only tasks | backend: `./gradlew ktlintCheck build`; game: `npm run build && npm test` |

---

## Execution Plan

### Phase 1: Backend domain and ports

```
T1 → T2 → T3
```

### Phase 2: Backend persistence, service and API

Persistence comes before the service so the Spring context always has the beans the service needs and no commit leaves the integration tests broken.

```
T4 → T5 → T6 → T7 → T8 → T9
```

### Phase 3: Game refactor to ADR 0007 (behavior-preserving)

```
T10 → T11 → T12 → T13 → T14 → T15
```

### Phase 4: Game stages

```
T16 → T17 → T18 → T19 → T20 → T21 → T22 → T23
```

---

## Task Breakdown

### T1: Chapter and stage definitions

**What**: `StageDefinition`, `ChapterDefinition` (validated, stages numbered 1..n with no gap) and `ChapterDefinition.first()` with the seed values.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Chapter.kt`
**Depends on**: None
**Reuses**: `domain/DropTable.kt` (`require` validation, logger in companion)
**Requirement**: STG-01, STG-02

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] A stage with a non-positive health, phase count or time limit, and a chapter whose stages are not 1..n, are rejected
- [x] `first()` has 10 stages of 5 phases, monster health 10..19, miniboss health 5 × monster health, miniboss limit 30 000 ms, boss health 300, boss limit 60 000 ms
- [x] `stage(n)` returns the stage or fails for an unknown number
- [x] Gate passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Status**: Done
**Commit**: `feat(stages): add chapter and stage definitions`

---

### T2: Progress state machine

**What**: `Encounter`, `Outcome`, `ProgressPosition`, `Progress` (start, `report`, `view`), `ProgressView`, and the `ProgressRequestException`, `InvalidOutcomeException`, `ProgressConflictException`, `ChapterNotFoundException` exceptions in `BusinessException.kt`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Progress.kt`
**Depends on**: T1
**Reuses**: `domain/Wallet.kt` (immutable data class, logger), `domain/BusinessException.kt`
**Requirement**: STG-03, STG-05, STG-06, STG-07, STG-08, STG-09, STG-10, STG-11, STG-12, STG-13

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `start` is chapter 1, stage 1, `PHASE`, phase 1, not completed
- [x] Every row of the transition table in design.md is a test; `phase` is 1 outside `PHASE`
- [x] A different reported position, `FAILED` on `PHASE`, and any report once completed throw `ProgressConflictException` carrying the unchanged stored progress
- [x] Gate passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Status**: Done
**Commit**: `feat(stages): add progress state machine`

---

### T3: Progress ports and use cases

**What**: `ProgressRepositoryPort`, `ChapterRepositoryPort`, `GetProgressUseCase`, `ReportOutcomeUseCase`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/port/ProgressPorts.kt`
**Depends on**: T2
**Reuses**: `port/WalletRepositoryPort.kt`, `usecase/WalletUseCase.kt` (use cases go in `usecase/ProgressUseCase.kt`)
**Requirement**: STG-04

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Ports match the design interfaces and the two use cases live in `usecase/ProgressUseCase.kt`
- [x] Gate passes: `./gradlew ktlintCheck build -x test`

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `feat(stages): add progress ports and use cases`

---

### T4: Chapter persistence

**What**: `ChapterEntity` and `StageEntity` (in `ChapterEntities.kt`), the Jpa repositories and `ChapterRepository : ChapterRepositoryPort`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ChapterRepository.kt`
**Depends on**: None (Phase 1 complete)
**Reuses**: `adapter/repository/WalletRepository.kt`, `WalletEntities.kt`
**Requirement**: STG-01

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] A saved chapter reads back equal, stages in order, with every field
- [x] `existsByNumber` is false then true; an unknown number reads `null`
- [x] Tests use their own chapter numbers and remove them, so the seeded chapter 1 other tests rely on is never deleted; `IntegrationTestBase` exposes the two Jpa repositories
- [x] Gate passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Status**: Done
**Commit**: `feat(stages): persist chapter definitions`

---

### T5: Progress persistence

**What**: `ProgressEntity` (file `ProgressEntity.kt`), `JpaProgressRepository` (`PESSIMISTIC_WRITE` lookup, native insert-if-absent) and `ProgressRepository : ProgressRepositoryPort`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ProgressRepository.kt`
**Depends on**: T4
**Reuses**: `adapter/repository/WalletRepository.kt`, `WalletRepositoryIT.kt` concurrency test
**Requirement**: STG-03, STG-15

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `createIfAbsent` then `findForUpdate` returns the same progress for every encounter value
- [x] A second `createIfAbsent` for the same player changes nothing and does not fail, also when two run concurrently
- [x] While one transaction holds `findForUpdate`, a second blocks until it ends
- [x] Gate passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Status**: Done
**Commit**: `feat(stages): persist player progress`

---

### T6: Progress service

**What**: `ProgressService` (transactional): checks the user, loads the locked progress or creates it, calls `Progress.report`, saves; in-memory fakes for both ports; `UserService.delete` also deletes the user's progress (spec edge case).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/ProgressService.kt`
**Depends on**: T5
**Reuses**: `service/WalletService.kt` load pattern; `Fakes.kt` (add `InMemoryProgressRepository`, `InMemoryChapterRepository`)
**Requirement**: STG-03, STG-04, STG-11, STG-14

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `get` creates stage 1 phase 1 for a player without progress and returns the view with the chapter definition
- [x] `report` saves the transition and returns the new view; a conflict saves nothing
- [x] An unknown user throws `UserNotFoundException` and creates no progress; a missing chapter throws `ChapterNotFoundException`
- [x] Deleting a user deletes that user's progress and no one else's
- [x] Gate passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Status**: Done
**Commit**: `feat(stages): add progress service`

---

### T7: Chapter seeder

**What**: An `ApplicationRunner` that saves `ChapterDefinition.first()` when chapter 1 is absent and never overwrites it.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/config/ChapterSeeder.kt`
**Depends on**: T6
**Reuses**: `adapter/config/WalletConfig.kt` style
**Requirement**: STG-02

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] On an empty database the application start leaves chapter 1 with the seed values
- [x] With chapter 1 edited in the database, running the seeder again keeps the edit
- [x] Gate passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Status**: Done
**Commit**: `feat(stages): seed chapter 1 at startup`

---

### T8: Progress endpoints

**What**: `ProgressController` (`GET /progress`, `POST /progress/outcome`), `ProgressResponse`, and the 400 and 409 mappings in `ApiExceptionHandler`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/ProgressController.kt`
**Depends on**: T7
**Reuses**: `adapter/web/WalletController.kt` parsing, `ApiExceptionHandler.kt`
**Requirement**: STG-03, STG-04, STG-05, STG-06, STG-07, STG-08, STG-09, STG-10, STG-11, STG-12, STG-13, STG-14, STG-15

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `GET /progress` of a new player is 200 with stage 1 phase 1 and the full chapter definition
- [x] `POST /progress/outcome` `CLEARED` through a whole stage, the miniboss, stage 10, the chapter boss and completion returns each next position; `FAILED` on a boss returns the last phase of the stage
- [x] A wrong position, `FAILED` on `PHASE`, and any report after completion are 409 with `code` `PROGRESS_CONFLICT` and the stored progress in `progress`, and the stored row is unchanged
- [x] A malformed body is 400 `PROGRESS_INVALID_OUTCOME`; no or a bad token is 401 on both routes; a player only reads and writes their own row
- [x] Two concurrent identical reports give exactly one 200 and one 409
- [x] Gate passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Status**: Done
**Commit**: `feat(stages): expose progress endpoints`

---

### T9: Backend ADR and project decisions

**What**: Backend ADR 0006 for stage progress, and `AD-003`/`AD-004` in `.specs/STATE.md`.
**Where**: `backend/docs/adr/0006-stage-progress.md`
**Depends on**: T8
**Reuses**: `backend/docs/adr/0005-wallet-drops.md` format
**Requirement**: STG-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] ADR records the state machine, tables, seed rule, 409 contract and the AD-002 limit on timers
- [x] `.specs/STATE.md` has `AD-003` (hexagonal game, ADR 0007) and `AD-004` (server state machine with optimistic mirror)
- [x] Gate passes: `./gradlew ktlintCheck build`

**Tests**: none
**Gate**: build

**Status**: Done
**Commit**: `docs(stages): record stage progress decisions`

---

### T10: Move combat and economy to the domain layer

**What**: `git mv src/combat src/domain/combat` and `src/economy src/domain/economy`; fix imports. No behavior change.
**Where**: `game/src/domain/combat/monster.js`
**Depends on**: None (Phase 2 complete)
**Reuses**: ADR 0007 layout
**Requirement**: Refactor criterion (Success Criteria)

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Files live under `src/domain/`, tests moved with them and unchanged in assertions
- [x] Gate passes: `npm test` with the same test count as before

**Tests**: unit
**Gate**: quick

**Status**: Done
**Commit**: `refactor(game): move combat and economy into the domain layer`

---

### T11: Session manager behind ports

**What**: `createSessionManager({ store, authGateway })` in `application/session`; `sessionStore` moves to `adapters/storage`; `src/composition.js` builds the singleton `sessionManager`, and `httpClient` and `MainMenu` import it from there. `auth/` is removed.
**Where**: `game/src/application/session/sessionManager.js`
**Depends on**: T10
**Reuses**: `game/src/auth/sessionManager.js` and its test, `sessionStore.js`
**Requirement**: Refactor criterion

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Every assertion of the old `sessionManager.test.js` still holds, now against fakes injected for the store and the auth gateway
- [x] The module imports no `api/` or `adapters/` file
- [x] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Status**: Done
**Commit**: `refactor(game): inject store and auth gateway into the session manager`

---

### T12: HTTP adapters

**What**: Move `src/api` to `src/adapters/http`; `createHttpClient({ session })`, `createWalletApi`, `createUserApi` factories; `composition.js` builds and exports them; scenes import from `composition.js` until T14.
**Where**: `game/src/adapters/http/httpClient.js`
**Depends on**: T11
**Reuses**: `game/src/api/*` and their tests
**Requirement**: Refactor criterion

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] The `httpClient` -> `sessionManager` import and its warning comment are gone; the client receives the session as a parameter
- [x] All `httpClient`, `authApi`, `userApi`, `walletApi`, `config` and `ApiError` tests pass with unchanged assertions
- [x] Gate passes: `npm test && npm run test:e2e`

**Tests**: unit
**Gate**: full

**Status**: Done
**Commit**: `refactor(game): build the http adapters by factories`

---

### T13: Wallet sync service

**What**: Extract load, tick, sync, retry and exit-sync from `ClickerGame` into `createWalletSync({ gateway, ledger })`; the scene calls it and only renders.
**Where**: `game/src/application/wallet/walletSync.js`
**Depends on**: T12
**Reuses**: `ClickerGame.js` wallet methods, `ClickerGame.test.js` wallet cases, `domain/economy/walletLedger.js`
**Requirement**: Refactor criterion; DROP-10 to DROP-16 behavior preserved

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The sync, retry, failure and exit cases of the old scene test move to service tests with a fake gateway, same assertions
- [ ] `ClickerGame.js` no longer imports `walletApi`
- [ ] Gate passes: `npm test && npm run test:e2e`

**Tests**: unit
**Gate**: full

**Commit**: `refactor(game): extract wallet sync from the scene`

---

### T14: Scenes as Phaser adapters

**What**: First commit the pending `Preloader.js` change on its own, then move `src/scenes` to `src/adapters/phaser`; `main.js` composes the services and puts them in `game.registry`; scenes read them from the registry; `composition.js` is imported only by `main.js`.
**Where**: `game/src/main.js`
**Depends on**: T13
**Reuses**: `composition.js`, scene tests
**Requirement**: Refactor criterion

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] No scene imports `composition.js`, `api` or an application singleton; scene tests supply services through a fake registry
- [ ] All scene assertions unchanged
- [ ] Gate passes: `npm test && npm run test:e2e`

**Tests**: unit
**Gate**: full

**Commit**: `refactor(game): move scenes to adapters and inject services`

---

### T15: Architecture test

**What**: A Vitest test that reads every file under `src/`, extracts imports and fails on a forbidden direction (ADR 0007 rules).
**Where**: `game/src/architecture.test.js`
**Depends on**: T14
**Reuses**: ADR 0007 table
**Requirement**: Refactor criterion

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Passes on the current tree
- [ ] A scratch file in `domain/` importing `phaser` or `axios`, or in `application/` importing `adapters/`, makes it fail (checked once by hand and recorded in the commit body)
- [ ] Gate passes: `npm run build && npm test`

**Tests**: unit
**Gate**: build

**Commit**: `test(game): enforce the hexagonal import rule`

---

### T16: Campaign rules

**What**: Pure `Campaign` class: `fromProgress`, `encounter()` (kind, stage, phase, health, time limit, HUD label), `cleared()`, `failed()`, `completed`, `position()`.
**Where**: `game/src/domain/campaign/campaign.js`
**Depends on**: None (Phase 3 complete)
**Reuses**: transition table in design.md; `domain/economy/walletLedger.js` style
**Requirement**: STG-16, STG-17, STG-18, STG-20, STG-21, STG-22

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Each row of the transition table is a test, with health and time limit taken from the payload definition
- [ ] Labels are `Stage S/10  Phase P/5`, `Stage S/10  Miniboss`, `Chapter Boss` with counts from the definition
- [ ] After `cleared()` on the chapter boss `completed` is true and `encounter()` is null
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(stages): add campaign rules to the game domain`

---

### T17: Boss countdown

**What**: Pure `BossCountdown(limitMs)` with `advance`, `seconds` (rounded up) and `expired`.
**Where**: `game/src/domain/campaign/bossCountdown.js`
**Depends on**: T16
**Reuses**: none
**Requirement**: STG-19, STG-21

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A 30 000 ms limit reads 30, 30 after 1 ms, 29 after 1 001 ms, 0 and `expired` at 30 000 ms, and never negative
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(stages): add boss countdown`

---

### T18: Campaign session service

**What**: `createCampaignSession({ gateway })`: `load`, `encounter`, `clear`, `fail`, ordered single-flight `flush`, `flushOnExit`, 409 realignment, `onRealign`.
**Where**: `game/src/application/campaign/campaignSession.js`
**Depends on**: T17
**Reuses**: `application/wallet/walletSync.js` tick/retry style
**Requirement**: STG-24, STG-25, STG-26, STG-27, STG-28

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A position change queues one report with the position it left; `flush` sends them in order with one request in flight
- [ ] A network error keeps the report at the head and a later `flush` resends it
- [ ] A 409 drops the queue, replaces the campaign with the body's progress and calls `onRealign`
- [ ] `load` failure rejects without state; `flushOnExit` sends once, in order, without retry
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(stages): add campaign session with ordered outcome reports`

---

### T19: Progress API adapter

**What**: `createProgressApi(httpClient)` implementing the gateway (`get`, `report`), turning a 409 into an `ApiError` with the body; built in `composition.js`.
**Where**: `game/src/adapters/http/progressApi.js`
**Depends on**: T18
**Reuses**: `adapters/http/walletApi.js` and test
**Requirement**: STG-16, STG-24, STG-26

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `get` calls `GET /progress`; `report` posts `{ chapter, stage, encounter, phase, outcome }` to `/progress/outcome`
- [ ] A 409 rejects with `status` 409 and the `progress` payload reachable
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(stages): add the progress http adapter`

---

### T20: Stage flow in the scene

**What**: `ClickerGame` loads the campaign, spawns the encounter with its health, shows the HUD, advances on kills, runs the boss countdown, handles boss failure and completion; drops unchanged.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Depends on**: T19
**Reuses**: existing death fade and respawn, `domain/combat/monster.js`, `BossCountdown`
**Requirement**: STG-16, STG-17, STG-18, STG-19, STG-20, STG-21, STG-22, STG-23

**Tools**:

- MCP: NONE
- Skill: `phaser-scenes`

**Done when**:

- [ ] Loaded progress spawns the monster with the definition's health and shows the label
- [ ] Killing a phase monster respawns the next encounter after the 500 ms fade and 1 000 ms delay
- [ ] A boss shows a whole-second countdown; killing it in time moves on; reaching 0 removes it and spawns phase 5 of the same stage
- [ ] The chapter boss dying shows the completion message, spawns nothing and ignores clicks
- [ ] Every kill, bosses included, still takes its level 1 drop
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(stages): play phases, minibosses and the chapter boss`

---

### T21: Saving and recovery in the scene

**What**: The scene flushes the campaign session at each 10 s tick and on shutdown, realigns on `onRealign`, and shows "Could not load progress" with a retry per tick.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Depends on**: T20
**Reuses**: wallet tick wiring from T13
**Requirement**: STG-24, STG-25, STG-26, STG-27, STG-28

**Tools**:

- MCP: NONE
- Skill: `phaser-scenes`

**Done when**:

- [ ] A load failure shows the message, spawns no monster, and a later tick that succeeds spawns it
- [ ] A phase advance results in a report at the next tick; a failed report is resent at the following tick
- [ ] A realign respawns the encounter of the returned progress
- [ ] Shutdown with queued reports sends one best-effort flush
- [ ] Gate passes: `npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(stages): save progress and recover from failures`

---

### T22: End-to-end stages scenario

**What**: `fakeBackend.js` serves `/progress` with the server table; `e2e/stages.spec.js` plays phases, fails a boss, reloads; existing e2e specs keep passing.
**Where**: `game/e2e/stages.spec.js`
**Depends on**: T21
**Reuses**: `e2e/support/fakeBackend.js`, `e2e/drops.spec.js` helpers
**Requirement**: STG-16, STG-17, STG-18, STG-21, STG-24, STG-28

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Five kills show `Stage 1/10  Phase 1/5` to `Phase 5/5`, then the miniboss with a countdown
- [ ] Letting the countdown expire returns to `Phase 5/5`; killing the miniboss in time shows `Stage 2/10  Phase 1/5`
- [ ] After a reload the stored position is shown again
- [ ] Gate passes: `npm test && npm run test:e2e`

**Tests**: e2e
**Gate**: full

**Commit**: `test(stages): cover phases, a failed boss and reload end to end`

---

### T23: Game ADR, traceability and handoff

**What**: Game ADR 0008, spec traceability and Success Criteria marked, `.specs/STATE.md` handoff.
**Where**: `game/docs/adr/0008-stages.md`
**Depends on**: T22
**Reuses**: `game/docs/adr/0006-wallet-and-drops.md` format
**Requirement**: STG-01 to STG-28

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ADR records the campaign module split, the report queue and the 409 realignment
- [ ] Gate passes: `npm run build && npm test`

**Tests**: none
**Gate**: build

**Commit**: `docs(stages): record the game stage design`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4 ------→ T5 ------→ T6 ------→ T7 ------→ T8 ------→ T9
Phase 3:  T10 -----→ T11 -----→ T12 -----→ T13 -----→ T14 -----→ T15
Phase 4:  T16 -----→ T17 -----→ T18 -----→ T19 -----→ T20 -----→ T21 -----→ T22 -----→ T23
```
