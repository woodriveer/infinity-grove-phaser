# Wallet Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/wallet/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/docs/adr/0001-logging.md`, `backend/docs/adr/0002-testing.md`, `backend/docs/adr/0003-exception-handling.md`, `backend/build.gradle.kts` (ktlint, JUnit 5).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain (`domain/*`) | unit | All branches; 1:1 to spec ACs; every listed edge case | `backend/src/test/kotlin/**/domain/*Test.kt` | `./gradlew ktlintCheck test --tests "*Test"` |
| Service (`service/*`) | unit | Orchestration, port interactions, every failure path | `backend/src/test/kotlin/**/service/*Test.kt` | `./gradlew ktlintCheck test --tests "*Test"` |
| Repository adapter | integration | Key query paths, lock, round trip, error paths | `backend/src/test/kotlin/**/adapter/repository/*IT.kt` | `./gradlew ktlintCheck test` |
| Controller adapter | integration | All routes: happy path, every edge case, error paths | `backend/src/test/kotlin/**/adapter/web/*IT.kt` | `./gradlew ktlintCheck test` |
| Config / properties | unit | Binding and fail-fast validation | `backend/src/test/kotlin/**/adapter/config/*Test.kt` | `./gradlew ktlintCheck test --tests "*Test"` |
| Exception classes, ports, use cases, entities, test fakes, YAML, docs | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase. Run from `backend/`. Integration tests need Docker running (it is).

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `./gradlew ktlintCheck test --tests "*Test"` |
| Full | After tasks with integration tests | `./gradlew ktlintCheck test` |
| Build | After phase completion or config/entity-only tasks | `./gradlew build` |

---

## Execution Plan

### Phase 1: Domain

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Application

```
T6 → T7 → T8 → T9 → T10
```

### Phase 3: Adapters

```
T11 → T12 → T13 → T14
```

### Phase 4: Wiring and docs

```
T15 → T16 → T17 → T18
```

---

## Task Breakdown

### T1: Add wallet exceptions

**What**: Add `WalletRequestException`, `InvalidKillsException` (`WALLET_INVALID_KILLS`) and `UnknownLevelException` (`WALLET_UNKNOWN_LEVEL`) to the exception hierarchy.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/BusinessException.kt`
**Depends on**: None
**Reuses**: `BusinessException` hierarchy (ADR 0003)
**Requirement**: WAL-18, WAL-19

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Three classes compile; `WalletRequestException` extends `BusinessException`
- [x] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`
- [x] Existing tests still pass (no deletions)

**Tests**: none
**Gate**: quick

**Commit**: `feat(wallet): add wallet request exceptions`

---

### T2: Add the drop roller port

**What**: Define `DropRollerPort.roll(min, max)`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/port/DropRollerPort.kt`
**Depends on**: T1
**Reuses**: Port style of `PasswordHasherPort`
**Requirement**: WAL-08

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] Interface compiles
- [x] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: none
**Gate**: quick

**Commit**: `feat(wallet): add drop roller port`

---

### T3: Add DropRule and DropTable

**What**: Domain classes for one level's drop range and kill interval and the validated table.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/DropTable.kt`
**Depends on**: T2
**Reuses**: `SecurityProperties` fail-fast `require` style
**Requirement**: WAL-07, WAL-08, WAL-11

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `DropRule` rejects level below 1, `minCopper` below 1, `maxCopper` below `minCopper`, `killIntervalMs` below 1, with the level in the message
- [x] `DropTable` rejects an empty list and duplicate levels
- [x] `roll` returns the roller's value for the rule's min and max; `accepts` is true only inside the range, bounds included
- [x] `DropTableTest` covers every branch above
- [x] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(wallet): add drop rule and drop table`

---

### T4: Add LevelDrops

**What**: Per-level queue and allowance bucket with refill, accept and fresh/refreshed constructors.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/LevelDrops.kt`
**Depends on**: T3
**Reuses**: `RefreshToken` domain style (logger in companion, copy-based state)
**Requirement**: WAL-09, WAL-10, WAL-12, WAL-13, WAL-14, WAL-16, WAL-17

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `fresh` builds a queue of 20 rolled values and an allowance of 20
- [x] Allowance grows 1 per interval, caps at 20, keeps fractional progress, and starts its timer at `now` when it leaves the cap
- [x] `accept` takes min(requested, allowance) values from the front, refills the queue to 20, spends the allowance and returns the credited copper
- [x] `refreshed` re-rolls the whole queue when a value is out of range or the size is not 20
- [x] Zero requested kills change nothing; a negative clock difference adds nothing
- [x] `LevelDropsTest` covers every branch, including a 500-kill request after a long idle (at most 20 accepted)
- [x] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(wallet): add per-level drop queue and allowance`

---

### T5: Add Wallet

**What**: Wallet aggregate: open, refresh, credit, coins and drops views.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Wallet.kt`
**Depends on**: T4
**Reuses**: `User` domain style
**Requirement**: WAL-02, WAL-03, WAL-04, WAL-12, WAL-13, WAL-14, WAL-15, WAL-16, WAL-17, WAL-19, WAL-20, WAL-23

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [x] `open` starts at 0 copper with a fresh state for every table level
- [x] `coins()` derives gold, silver, copper (0, 99, 100, 9 999, 10 000, `Long.MAX_VALUE` cases)
- [x] `refreshed` adds levels new to the table, keeps hidden levels untouched and is idempotent when nothing changed (same drops twice)
- [x] `credit` sums the credited copper, reports accepted per level, throws `UnknownLevelException` before changing anything (also when other levels are valid) and clamps at `Long.MAX_VALUE`
- [x] `dropsFor` returns table levels only
- [x] `WalletTest` covers every branch and edge case of the spec
- [x] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(wallet): add wallet domain`

---

### T6: Add the wallet repository port

**What**: Define `WalletRepositoryPort` (find for update, create if absent, save, delete).
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/port/WalletRepositoryPort.kt`
**Depends on**: None (previous phase complete)
**Reuses**: `UserRepositoryPort`
**Requirement**: WAL-21, WAL-24

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] Interface compiles
- [ ] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: none
**Gate**: quick

**Commit**: `feat(wallet): add wallet repository port`

---

### T7: Add the wallet use cases

**What**: Define `GetWalletUseCase` and `SyncKillsUseCase`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/usecase/WalletUseCase.kt`
**Depends on**: T6
**Reuses**: `UserUseCase.kt` style
**Requirement**: WAL-01, WAL-12

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] Interfaces compile
- [ ] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: none
**Gate**: quick

**Commit**: `feat(wallet): add wallet use cases`

---

### T8: Add wallet test fakes

**What**: `InMemoryWalletRepository` and `SequenceDropRoller` for service tests.
**Where**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/Fakes.kt`
**Depends on**: T7
**Reuses**: `InMemoryUserRepository`, `MutableClock`
**Requirement**: WAL-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Fakes implement the ports; `SequenceDropRoller` yields a scripted, cycling sequence clamped into the asked range
- [ ] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: none
**Gate**: quick

**Commit**: `test(wallet): add wallet fakes`

---

### T9: Add WalletService

**What**: Service implementing both use cases: user check, lock-or-create, domain call, save, logging.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/WalletService.kt`
**Depends on**: T8
**Reuses**: `SessionService` structure
**Requirement**: WAL-01, WAL-02, WAL-04, WAL-12, WAL-13, WAL-14, WAL-17, WAL-25

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `get` creates the wallet for an existing user without one, and returns the stored one otherwise (same drops twice)
- [ ] `get` and `sync` throw `UserNotFoundException` and create no wallet when the user does not exist
- [ ] `sync` credits, persists the new wallet and returns accepted counts; an unknown level persists nothing
- [ ] `WalletServiceTest` covers each path with the in-memory fakes
- [ ] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(wallet): add wallet service`

---

### T10: Delete the wallet with the user

**What**: `UserService.delete` also calls `WalletRepositoryPort.deleteByUsername`; constructor and tests updated.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/UserService.kt`
**Depends on**: T9
**Reuses**: Existing refresh-token cleanup in `delete`
**Requirement**: WAL-24

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] Deleting a user removes their wallet; deleting an unknown user still throws `UserNotFoundException` and touches nothing
- [ ] `UserServiceTest` updated for the new constructor and covers both cases
- [ ] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(wallet): delete the wallet with its user`

---

### T11: Add wallet entities

**What**: `WalletEntity` and `WalletLevelEntity` (composite id, comma-separated drops) with domain mapping.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/WalletEntities.kt`
**Depends on**: None (previous phase complete)
**Reuses**: `UserEntity`, `RefreshTokenEntity`
**Requirement**: WAL-03, WAL-04

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] Entities map to and from the domain `Wallet` without loss (verified by the T12 round-trip IT)
- [ ] Gate check passes: `./gradlew build`

**Tests**: none
**Gate**: build

**Commit**: `feat(wallet): add wallet entities`

---

### T12: Add the wallet repository adapter

**What**: `JpaWalletRepository` (locked find, native insert-on-conflict, deletes) and `WalletRepository` implementing the port.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/WalletRepository.kt`
**Depends on**: T11
**Reuses**: `RefreshTokenRepository` (custom queries, `@Transactional`)
**Requirement**: WAL-04, WAL-21, WAL-24

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] Round trip returns an equal `Wallet`, including queue order and allowance fields
- [ ] `createIfAbsent` twice keeps the first row; `findForUpdate` returns null for an unknown user
- [ ] `deleteByUsername` removes the wallet and its level rows
- [ ] `WalletRepositoryIT` covers these paths on real PostgreSQL
- [ ] Gate check passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(wallet): add wallet repository adapter`

---

### T13: Add drop table configuration

**What**: `WalletProperties` bound from `app.wallet.drop-table` (default level 1: 1, 5, 1500), the `DropTable` bean and `RandomDropRoller`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/config/WalletConfig.kt`
**Depends on**: T12
**Reuses**: `SecurityProperties` and its startup tests
**Requirement**: WAL-07, WAL-08, WAL-11

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] With no configuration the table holds level 1 as 1, 5, 1500
- [ ] Configured values replace the default
- [ ] An invalid entry stops the application context and names the entry
- [ ] `RandomDropRoller` stays inside the requested range over many rolls
- [ ] `WalletConfigTest` covers binding and fail-fast
- [ ] Gate check passes: `./gradlew ktlintCheck test --tests "*Test"`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(wallet): configure the drop table`

---

### T14: Add the wallet controller

**What**: `GET /wallet` and `POST /wallet/sync` with DTOs and body validation; `ApiExceptionHandler` maps `WalletRequestException` to 400.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/WalletController.kt`
**Depends on**: T13
**Reuses**: `AuthController`, `ApiExceptionHandler`
**Requirement**: WAL-01, WAL-02, WAL-05, WAL-06, WAL-15, WAL-18, WAL-19, WAL-22

**Tools**:

- MCP: NONE
- Skill: `kotlin-backend-ddd`

**Done when**:

- [ ] `GET /wallet` returns the documented body for an existing user, 404 `USER_NOT_FOUND` for a deleted one, 401 `AUTH_UNAUTHENTICATED` without a token
- [ ] `POST /wallet/sync` credits and returns `wallet`, `accepted`, `drops`; 401 without a token
- [ ] Missing `kills`, a non-object, a negative, fractional or string count return 400 `WALLET_INVALID_KILLS`; an unknown level returns 400 `WALLET_UNKNOWN_LEVEL` and credits nothing
- [ ] A token for user A never reads or changes user B's wallet
- [ ] `WalletControllerIT` covers every case above
- [ ] Gate check passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(wallet): add wallet endpoints`

---

### T15: Add the concurrency and cleanup integration tests

**What**: Parallel sync test (no value credited twice), user deletion removes the wallet, existing user gets a wallet lazily, allowance bound over HTTP.
**Where**: `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/WalletFlowIT.kt`
**Depends on**: None (previous phase complete)
**Reuses**: `UserControllerIT` helpers, `IntegrationTestBase`
**Requirement**: WAL-12, WAL-21, WAL-24, WAL-25

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Two parallel syncs credit the queue values at most once each
- [ ] `DELETE /users/{name}` leaves no wallet rows
- [ ] A user created before any wallet call gets one on first `GET /wallet`
- [ ] Syncing 500 kills right after reading accepts at most 20 and a second immediate sync accepts 0
- [ ] `IntegrationTestBase` cleans wallet tables before each test
- [ ] Gate check passes: `./gradlew ktlintCheck test`

**Tests**: integration
**Gate**: full

**Commit**: `test(wallet): cover concurrency and cleanup over HTTP`

---

### T16: Declare the drop table in application.yaml

**What**: Add `app.wallet.drop-table` with level 1 (1, 5, 1500) so the shipped table is visible.
**Where**: `backend/src/main/resources/application.yaml`
**Depends on**: T15
**Reuses**: Existing `app.security` block
**Requirement**: WAL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The table is in the YAML and the context still starts
- [ ] Gate check passes: `./gradlew build`

**Tests**: none
**Gate**: build

**Commit**: `feat(wallet): declare the level 1 drop table`

---

### T17: Add ADR 0005 for the wallet

**What**: Record the drop-queue, sync and allowance design.
**Where**: `backend/docs/adr/0005-wallet-drops.md`
**Depends on**: T16
**Reuses**: ADR 0004 format
**Requirement**: WAL-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ADR states context, decision, consequences, alternatives, and the cheating limitation
- [ ] Gate check passes: `./gradlew build`

**Tests**: none
**Gate**: build

**Commit**: `docs(wallet): add ADR 0005 on wallet drops`

---

### T18: Record AD-002 in STATE.md

**What**: Add the project-level decision that kills are client-reported and bounded by the allowance.
**Where**: `.specs/STATE.md`
**Depends on**: T17
**Reuses**: AD-001 format
**Requirement**: WAL-12

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `validate_state.py` structure is unchanged and AD-002 is `active`
- [ ] Gate check passes: `./gradlew build`

**Tests**: none
**Gate**: build

**Commit**: `docs(specs): record AD-002 on client-reported kills`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4 ------→ T5
Phase 2:  T6 ------→ T7 ------→ T8 ------→ T9 ------→ T10
Phase 3:  T11 -----→ T12 -----→ T13 -----→ T14
Phase 4:  T15 -----→ T16 -----→ T17 -----→ T18
```
