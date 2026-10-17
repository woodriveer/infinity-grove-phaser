# Wallet Validation

**Date**: 2026-10-17
**Spec**: `.specs/features/wallet/spec.md`
**Diff range**: `7c41b87..629fc2a` (backend code and tests; specs, design, tasks and ADR 0005)
**Verifier**: fresh-eyes standalone pass by the implementing agent, because spawning sub-agents was not authorized in this session (the skill's "standalone fallback"). Coverage was re-derived from the spec, not from the author's notes. Author and verifier are the same agent; treat the independence as weaker than a sub-agent run.

**Verdict**: PASS

Gate: `./gradlew ktlintCheck test` in `backend/` at HEAD 629fc2a: 194 tests, 0 failed, 0 skipped. ktlint clean. Test count before the feature: 111 (194 minus 83 new).

Path prefix used below: `T/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T10 | Done | Domain, ports, fakes, service, user deletion. `SequenceDropRoller` was added to `Fakes.kt` in T4 (its first user), not T8 |
| T11 | Done | Config. Tasks 11-13 were reordered and merged before execution (`docs(specs): reorder wallet adapter tasks`) so the Spring context always starts: config first, entities and repository merged |
| T12 | Done | Also adds wallet cleanup to `IntegrationTestBase` |
| T13 | Done | Controller plus `ApiExceptionHandler` mapping |
| T14-T17 | Done | Flow IT, `application.yaml`, ADR 0005, AD-002 |

Commits T9 to T11 ran only the quick gate while the full suite could not start the context (`WalletService` needed beans added in T11 and T12); every full gate from T12 on passed.

---

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| WAL-01 GET shape | 200, `wallet` and `drops` with one entry per table level, 20 ints in range | `T/adapter/web/WalletControllerIT.kt:44` `.body("drops.keySet()", contains("1"))`; `:45` `hasSize<Int>(20)`; `:46-47` `everyItem(greaterThanOrEqualTo(1))`, `everyItem(lessThanOrEqualTo(5))`; hidden levels excluded `:56` `.body("drops.keySet()", contains("1"))` | PASS |
| WAL-02 lazy creation | zero wallet, allowance 20, 20 drops | `T/adapter/web/WalletControllerIT.kt:41-43` gold, silver, copper `equalTo(0)`; `T/domain/WalletTest.kt:37` `assertEquals(20, wallet.levels.getValue(2).allowance)`; `T/service/WalletServiceTest.kt:36` `assertEquals(wallet, wallets.wallets["yan"])` | PASS |
| WAL-03 denominations | T mod 100, T div 100 mod 100, T div 10 000, unbounded gold | `T/domain/WalletTest.kt:43-48` `Coins(0,0,99)`, `Coins(0,1,0)`, `Coins(0,99,99)`, `Coins(1,0,0)`, `Coins(1234,56,78)`; `:53` `Coins(922_337_203_685_477, 58, 7)`; HTTP `T/adapter/web/WalletControllerIT.kt:76-78` 1234, 56, 78 | PASS |
| WAL-04 same drops twice | identical lists | `T/adapter/web/WalletControllerIT.kt:64` `assertEquals(drops(getWallet()), drops(getWallet()))`; `T/service/WalletServiceTest.kt:46`; `T/domain/WalletTest.kt:90` | PASS |
| WAL-05 / WAL-22 no token | 401 `AUTH_UNAUTHENTICATED` on both routes | `T/adapter/web/WalletControllerIT.kt:86-87` and `:93-94` `.statusCode(401)` + `equalTo("AUTH_UNAUTHENTICATED")` | PASS |
| WAL-06 own wallet only | other player's wallet untouched | `T/adapter/web/WalletControllerIT.kt:202` `getWallet("ana").then().body("wallet.copper", equalTo(0))` after yan synced | PASS |
| WAL-07 table from config | level 1 ships 1, 5, 1500; configured levels replace it | `T/adapter/config/WalletConfigTest.kt:21` `assertEquals(listOf(DropRule(1, 1, 5, 1500)), ...rules)`; `:39` two configured rules; `backend/src/main/resources/application.yaml:13-18` | PASS |
| WAL-08 uniform roll min..max | rolls inside range, both bounds reached | `T/domain/DropTableTest.kt:69` `assertEquals(listOf(2 to 9), asked)`; `T/adapter/config/WalletConfigTest.kt:81` `assertEquals(setOf(3, 4), rolls.toSet())`; `:86` `assertEquals(7, RandomDropRoller().roll(7, 7))` | PASS |
| WAL-09 allowance +1 per interval, cap 20 | 19 after 3 000 ms from 17; 20 at cap | `T/domain/LevelDropsTest.kt:92` `assertEquals(19, result.count)`; `:101` `assertEquals(20, result.count)`; `:111` `assertEquals(3_000, spent.drops.allowanceUpdatedAt)`; `:122-124` timer starts at the spend | PASS |
| WAL-10 out-of-range queue re-rolled | new queue in range | `T/domain/LevelDropsTest.kt:161` `assertEquals(firstTwenty, refreshed.queue)`; `T/domain/WalletTest.kt:72`; `T/service/WalletServiceTest.kt:67-68` | PASS |
| WAL-11 invalid table refuses to start, names entry | startup failure with the level | `T/domain/DropTableTest.kt:23,30,37,49` message contains `level N`; `:84` empty table; `:91` duplicate; `T/adapter/config/WalletConfigTest.kt:56` `it.contains("level 1") && it.contains("max-copper")`; `:73` `contains("duplicate level 1")` | PASS |
| WAL-12 accept min(n, allowance) | 20 of 500; 7 of 7 | `T/domain/LevelDropsTest.kt:70` `assertEquals(20, result.count)`; `T/domain/WalletTest.kt:113` `assertEquals(mapOf(1 to 20, 2 to 7), result.accepted)`; `T/adapter/web/WalletControllerIT.kt:138` `accepted.1` `equalTo(20)`; `T/adapter/web/WalletFlowIT.kt:50` `assertEquals(20, accepted.sum())` | PASS |
| WAL-13 credit first k, remove | sum of first k, queue moved up | `T/domain/LevelDropsTest.kt:36-37`; `T/adapter/web/WalletControllerIT.kt:116` `equalTo(before.take(3).sum())`; `:119` `assertEquals(before.drop(3), after.take(17))` | PASS |
| WAL-14 spend allowance, refill queue to 20 | 17 left; queue size 20 | `T/domain/LevelDropsTest.kt:60` `assertEquals(17, ...allowance)`; `:38` queue size 20; `:50` full batch returns a fresh 20 | PASS |
| WAL-15 response shape | `{wallet, accepted, drops}` | `T/adapter/web/WalletControllerIT.kt:115-116` `accepted.1`, `wallet.copper`; `:130-131` response equals a later GET | PASS |
| WAL-16 excess discarded, 200 | `accepted` below n | `T/adapter/web/WalletControllerIT.kt:138` `statusCode(200)` + `accepted.1` `equalTo(20)` | PASS |
| WAL-17 zero kills unchanged | accepted 0, state equal | `T/domain/LevelDropsTest.kt:145` `assertEquals(drops, result.drops)`; `T/domain/WalletTest.kt:145-146`; `T/adapter/web/WalletControllerIT.kt:149-153` | PASS |
| WAL-18 malformed kills | 400 `WALLET_INVALID_KILLS`, nothing changed | `T/adapter/web/WalletControllerIT.kt:173` eight bodies (`{}`, null, 5, `[1]`, -1, 1.5, "3", null count); `:177-178` copper 0 and drops equal | PASS |
| WAL-19 unknown level | 400 `WALLET_UNKNOWN_LEVEL`, nothing credited | `T/adapter/web/WalletControllerIT.kt:186-187`, `:190-191`; `T/domain/WalletTest.kt:153` `assertEquals("WALLET_UNKNOWN_LEVEL", e.code)` | PASS |
| WAL-20 overflow clamp | `Long.MAX_VALUE` | `T/domain/WalletTest.kt:160` `assertEquals(Long.MAX_VALUE, result.wallet.copper)` | PASS |
| WAL-21 concurrent syncs serialized | each value at most once | `T/adapter/web/WalletFlowIT.kt:50` `assertEquals(20, accepted.sum())`, `:51` copper equals the 20 queued values; `T/adapter/repository/WalletRepositoryIT.kt:120` `assertEquals(1L, second.get(...))` | PASS |
| WAL-23 logging | INFO per sync, WARN on discard | none (ADR 0001: logging is not covered by automated tests) | WARNING Spec-precision gap, accepted (G1) |
| WAL-24 wallet deleted with user | rows gone | `T/service/UserServiceTest.kt:180` `assertEquals(setOf("ana"), wallets.wallets.keys)`; `T/adapter/repository/WalletRepositoryIT.kt:92-94`; `T/adapter/web/WalletFlowIT.kt:95-96` counts 0 | PASS |
| WAL-25 existing users get a wallet lazily | wallet row on first GET | `T/adapter/web/WalletFlowIT.kt:66` `assertEquals(0, ...count())`, `:70-71` counts 1 | PASS |
| Edge: idle sync accepts at most 20 | 20 | `T/domain/LevelDropsTest.kt:101` `assertEquals(20, result.count)` (15 000 ms idle); `T/adapter/web/WalletControllerIT.kt:138` | PASS |
| Edge: token user deleted | 404 `USER_NOT_FOUND`, no wallet | `T/adapter/web/WalletControllerIT.kt:99-102` | PASS |
| Edge: 20 of 20 kills | credit 20, fresh queue of 20 | `T/domain/LevelDropsTest.kt:48-50` | PASS |

**Status**: 24 of 25 requirements and all 3 edge cases covered with the spec's exact values; 1 accepted gap (WAL-23).

**Gaps (non-blocking)**
- G1: WAL-23 (log lines) has no automated test. ADR 0001 states logging is not covered; the spec states a log requirement the project does not test. Accepted; recorded as a lesson.
- G2: `Wallet.credit` logs are produced in the domain; log content (no tokens or passwords) was reviewed by reading `Wallet.kt:49-52`: only username, level and counts.
- G3: A burst test with a real clock across a 1 500 ms boundary is absent by design; time is controlled by `MutableClock` in unit tests and the HTTP tests tolerate at most one regained kill (`T/adapter/web/WalletFlowIT.kt:60`).

---

## Discrimination Sensor

Scratch: temporary git worktree at HEAD (first run 6ed8a44, probes 16 and 19 re-run at 629fc2a); each mutant applied to one file, tests run, file restored, worktree deleted. Real tree porcelain after cleanup matches the pre-sensor baseline (only the new uncommitted `drops` design and tasks files, created after the baseline).

A first sensor run reported false kills because the harness could not run Gradle (no test output); it was discarded and rebuilt so a mutant counts as killed only with named failing tests.

| # | File:line | Mutation | Killed? |
| - | --------- | -------- | ------- |
| 1 | `domain/LevelDrops.kt:32` | accept ignores the allowance | Killed (`LevelDropsTest` 10 tests) |
| 2 | `domain/LevelDrops.kt:44` | allowance grows at half speed | Killed (4) |
| 3 | `domain/LevelDrops.kt:46` | partial interval progress lost | Killed (1) |
| 4 | `domain/LevelDrops.kt:33` | credits the last queued values | Killed (3) |
| 5 | `domain/LevelDrops.kt:18` | out-of-range queue never re-rolled | Killed (4) |
| 6 | `domain/Wallet.kt:15` | silver not carried into gold | Killed (2) |
| 7 | `domain/Wallet.kt:66` | no overflow clamp | Killed (1) |
| 8 | `domain/Wallet.kt:60` | credit never adds copper | Killed (5) |
| 9 | `domain/Wallet.kt:29` | hidden levels dropped on refresh | Killed (1) |
| 10 | `domain/DropTable.kt:28` | max bound excluded | Killed (1) |
| 11 | `service/WalletService.kt:38` | sync does not persist | Killed (3) |
| 12 | `service/WalletService.kt:44` | no user existence check | Killed (2) |
| 13 | `service/UserService.kt:71` | wallet survives user deletion | Killed (1) |
| 14 | `adapter/config/WalletConfig.kt:23` | default interval 1500 to 1000 | Killed (1) |
| 15 | `adapter/web/WalletController.kt:87` | negative counts accepted | Killed (`WalletControllerIT` malformed kills) |
| 16 | `adapter/web/WalletController.kt:66` | response lists hidden levels | **Survived first run** (no test had a stored level outside the table); fix test added in 629fc2a; **Killed** on re-run |
| 17 | `adapter/repository/WalletRepository.kt:15` | wallet row not locked | Killed (`WalletRepositoryIT` lock test, `WalletFlowIT` parallel syncs) |
| 18 | `adapter/repository/WalletRepository.kt:87` | level rows left behind on delete | Killed (`WalletRepositoryIT`) |
| 19 | `domain/LevelDrops.kt:34` | queue refilled one short after a full batch | Killed on re-run (probe added after reviewing the 20-of-20 edge case) |

**Sensor depth**: lightweight, extended (19 mutants, auth/data-integrity style code). **Result**: 19/19 killed after one fix round (1 fix iteration of 3) - PASS.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | PASS: domain split into three small classes; no unused abstraction |
| Surgical changes | PASS: existing files touched only for wallet wiring (`UserService`, `ApiExceptionHandler`, `BusinessException`, `Fakes`, `IntegrationTestBase`, `application.yaml`) |
| No scope creep | PASS |
| Matches patterns | PASS: flat layout, hand-written fakes, ProblemDetail codes, companion-object loggers (ADR 0001-0003) |
| Spec-anchored outcome check | PASS: asserted values equal the spec values (see table) |
| Per-layer Coverage Expectation | PASS: domain and service map 1:1 to WAL ids; controller covers happy, edge and each error path of both routes |
| Every test maps to a requirement | PASS: reverse-mapped; `tables are empty at the start` (`WalletRepositoryIT.kt:37`) is isolation support, kept like `RefreshTokenRepositoryIT` |
| Guidelines followed | `backend/docs/adr/0001-logging.md`, `0002-testing.md`, `0003-exception-handling.md` |

---

## Edge Cases

- [x] Idle sync accepts at most 20 per level
- [x] Valid token, deleted user: 404, no wallet
- [x] 20 kills with a full allowance and queue: all credited, fresh queue

---

## Gate Check

- **Gate command**: `./gradlew ktlintCheck test` (the `build` gate task adds only packaging)
- **Result**: 194 passed, 0 failed, 0 skipped
- **Test count before feature**: 111
- **Test count after feature**: 194
- **Delta**: +83 (DropTable 10, LevelDrops 15, Wallet 14, WalletService 11, WalletConfig 6, WalletRepositoryIT 8, WalletControllerIT 13, WalletFlowIT 4, UserService 2)
- **Skipped tests**: none
- **Failures**: none

---

## Requirement Traceability Update

All WAL-01 to WAL-25 moved from Pending to Verified in `spec.md` (WAL-23 verified by code review of `Wallet.kt:49-52`, see G1).

---

## Summary

**Overall**: Ready

**Spec-anchored check**: 24/25 requirements matched with exact outcomes; 1 spec-precision gap (WAL-23, logging)
**Sensor**: 19/19 mutations killed (one survivor fixed with a new test)
**Gate**: 194 passed

**What works**: Wallet read, lazy creation, kill sync with allowance, per-level drop table from configuration, locking, user cleanup, 400/401/404 error codes.

**Issues found**: One test gap (hidden levels in the response), fixed. Logging requirement not testable under ADR 0001.

**Next steps**: Build the `drops` game feature against `GET /wallet` and `POST /wallet/sync`.
