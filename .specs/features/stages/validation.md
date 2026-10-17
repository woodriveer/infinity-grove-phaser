# Stages Validation

**Date**: 2026-10-17
**Spec**: `.specs/features/stages/spec.md`
**Diff range**: `28fd048^..647ec8a` (24 commits, 77 files: backend domain, ports, service, persistence, seeder, controller; game refactor to ADR 0007, campaign domain, session, http adapter, scene, e2e; specs, design, tasks, ADRs 0006, 0007, 0008)
**Verifier**: fresh-eyes standalone pass by the implementing agent, because spawning sub-agents was not authorized in this session (the skill's "standalone fallback"). Coverage was re-derived from `spec.md` by grepping the test files, not from the author's notes. Author and verifier are the same agent, so treat the independence as weaker than a sub-agent run.

**Verdict**: PASS

Gate, run on `647ec8a` (HEAD):

- Backend (`backend/`, `./gradlew ktlintCheck build`, Docker up): ktlint clean, 267 tests passed, 0 failed, 0 skipped. Before the feature: 194 (267 minus 73 new).
- Game (`game/`, `npm run build && npm test && npm run test:e2e`): build ok, 304 unit tests passed, 25 e2e scenarios passed, 0 failed, 0 skipped. Before the feature: 187 unit, 21 e2e. One unit test was removed on purpose (see T11 below); 118 are new.

Path prefixes used below: `BT/` = `backend/src/test/kotlin/br/com/woodriver/infinity_grove_ws/`, `GS/` = `game/src/`, `GE/` = `game/e2e/`, `CG/` = `game/src/adapters/phaser/ClickerGame.test.js`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1-T3 | Done | Chapter and stage definitions, progress state machine, ports and use cases |
| T4-T6 | Done | Reordered after T3: persistence (T4 chapters, T5 progress) before the service (T6), so the Spring context always had the beans `ProgressService` needs and no commit left the integration tests broken. `UserService.delete` also deletes the progress (T6) |
| T7-T9 | Done | Seeder, controller with the 400 and 409 mappings, backend ADR 0006 and `AD-003`/`AD-004` |
| T10-T15 | Done | Behavior-preserving refactor to ADR 0007. T11 removed one unit test ("returns none and removes invalid stored data"): it exercised the corrupt-entry removal that belongs to the store and is asserted by `GS/adapters/storage/sessionStore.test.js:35`; the manager keeps "returns none when nothing is stored". T14 left the owner's unstaged `Preloader.js` edit untouched |
| T16-T19 | Done | Campaign rules, boss countdown, session service, progress http adapter. `ApiError` gained `body` (T18) so a 409 can carry the stored progress |
| T20-T22 | Done | Scene flow, saving and recovery, e2e. The e2e fake backend got its `/progress` routes in T20 instead of T22 so the existing scenarios never broke; T20's gate became Full |
| T23 | Done | Game ADR 0008 |

Spec change while executing: the user-deletion edge case was added (`WHEN a user is deleted THEN ... delete that user's progress`); the `GET /progress` answer was widened to carry the whole chapter definition (assumption "Definition payload").

---

## Spec-Anchored Acceptance Criteria

### P1: The backend stores definitions and moves the player

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| STG-01 stores definitions | chapter boss health/limit and per-stage fields persist | `BT/adapter/repository/ChapterRepositoryIT.kt:44` `assertEquals(chapter(), repository.findByNumber(number))` (every field, stage order); `BT/domain/ChapterTest.kt:24-70` rejects non-positive values | PASS |
| STG-02 seed | 10 stages x 5 phases, 30 000 ms, 60 000 ms, health values of the table | `BT/domain/ChapterTest.kt:86` `assertEquals(List(10) { 5 }, ...phasesPerStage)`; `:95` `assertEquals((10..19).toList(), ...monsterHealth)`; `:100` miniboss = 5 x monster, `30_000L`; `:108` `assertEquals(300, ...)`, `assertEquals(60_000L, ...)`; stored: `BT/adapter/config/ChapterSeederIT.kt:32` `assertEquals(ChapterDefinition.first(), repository.findByNumber(1))` | PASS |
| STG-03 new player | chapter 1, stage 1, `PHASE`, phase 1, not completed | `BT/domain/ProgressTest.kt:36` `assertEquals(ProgressPosition(1, 1, Encounter.PHASE, 1), start.position)`, `assertFalse(start.completed)`; HTTP `BT/adapter/web/ProgressControllerIT.kt:56` `.body("stage", equalTo(1)).body("encounter", equalTo("PHASE")).body("phase", equalTo(1)).body("completed", equalTo(false))`; service `BT/service/ProgressServiceTest.kt:32` | PASS |
| STG-04 `GET /progress` answer | 200 with position and the chapter definition fields | `BT/adapter/web/ProgressControllerIT.kt:56` `.statusCode(200)`, `.body("definition.bossHealth", equalTo(300))`, `.body("definition.stages", hasSize<Int>(10))`, `stages[0].phasesPerStage == 5`, `stages[9].minibossHealth == 95` | PASS |
| STG-05 clear a phase below the last | phase + 1 | `BT/domain/ProgressTest.kt:45` `assertEquals(at(2, Encounter.PHASE, 2), at(2, Encounter.PHASE, 1).cleared())`; uses the current stage's phase count (stage 2 has 3); HTTP `BT/adapter/web/ProgressControllerIT.kt:95` (61 clears, `clears == 5` -> `MINIBOSS`) | PASS |
| STG-06 clear the last phase | `MINIBOSS` of the same stage | `BT/domain/ProgressTest.kt:51` `assertEquals(at(2, Encounter.MINIBOSS), at(2, Encounter.PHASE, 3).cleared())`; `BT/adapter/web/ProgressControllerIT.kt:118` `.body("encounter", equalTo("MINIBOSS")).body("stage", equalTo(4))` | PASS |
| STG-07 clear miniboss below stage 10 | phase 1 of the next stage | `BT/domain/ProgressTest.kt:57` `assertEquals(at(2, Encounter.PHASE, 1), at(1, Encounter.MINIBOSS).cleared())`; `BT/adapter/web/ProgressControllerIT.kt:118` `.body("stage", equalTo(5))`, `.body("phase", equalTo(1))` | PASS |
| STG-08 clear miniboss of stage 10 | `CHAPTER_BOSS` | `BT/domain/ProgressTest.kt:63` `assertEquals(at(3, Encounter.CHAPTER_BOSS), at(3, Encounter.MINIBOSS).cleared())`; `BT/adapter/web/ProgressControllerIT.kt:95` `clears == 60` -> `listOf(10, "CHAPTER_BOSS", 1, false)` | PASS |
| STG-09 clear the chapter boss | `completed` true | `BT/domain/ProgressTest.kt:68` `assertTrue(done.completed)`; `BT/adapter/web/ProgressControllerIT.kt:95` `assertEquals(listOf(10, "CHAPTER_BOSS", 1, true), position(current))`, `assertEquals(61, clears)` | PASS |
| STG-10 fail a boss | `PHASE`, phase 5 of the same stage | `BT/domain/ProgressTest.kt:76` `assertEquals(at(2, Encounter.PHASE, 3), at(2, Encounter.MINIBOSS).failed())`; `:82` chapter boss -> stage 3 phase 2; HTTP `BT/adapter/web/ProgressControllerIT.kt:136` `.body("phase", equalTo(5))`, `:150` `.body("stage", equalTo(10))` | PASS |
| STG-11 position mismatch | 409 with the stored progress, nothing changes | `BT/domain/ProgressTest.kt:87` `assertEquals(stored.view(chapter), e.current)`; `BT/adapter/web/ProgressControllerIT.kt:164` `.statusCode(409).body("code", equalTo("PROGRESS_CONFLICT")).body("progress.phase", equalTo(3))` and the row re-read `assertEquals(listOf(2, "PHASE", 3), ...)`; `:182` other chapter -> 409 | PASS |
| STG-12 `FAILED` on a phase | 409, nothing changes | `BT/domain/ProgressTest.kt:110` `assertEquals(stored, e.current.progress)`; `BT/adapter/web/ProgressControllerIT.kt:190` `.statusCode(409).body("progress.phase", equalTo(4))`, `assertEquals(4, ...phase)` | PASS |
| STG-13 completed | every report 409, nothing changes | `BT/domain/ProgressTest.kt:119` both outcomes throw `ProgressConflictException`; `BT/adapter/web/ProgressControllerIT.kt:200` `.statusCode(409)...body("progress.completed", equalTo(true))` for `CLEARED` and `FAILED`, row still completed | PASS |
| STG-14 auth and isolation | 401 without a valid token; only the token player's row | `BT/adapter/web/ProgressControllerIT.kt:234` `given().get("/progress").then().statusCode(401)`, same for POST and for a bad token; `:250` `getProgress("ana")...body("phase", equalTo(1))` after yan's report; `BT/service/ProgressServiceTest.kt:118` | PASS |
| STG-15 simultaneous reports | exactly one applies, the other 409 | `BT/adapter/web/ProgressControllerIT.kt:262` `assertEquals(listOf(200, 409), statuses)` and `assertEquals(2, ...phase)`; lock: `BT/adapter/repository/ProgressRepositoryIT.kt:107` second transaction sees the committed change | PASS |

### P1: The player fights through stages and bosses

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| STG-16 load on start | one `GET /progress`, monster with the definition's health | `CG:817` `expect(campaignGateway.get).toHaveBeenCalledTimes(1)`; `CG:823` `expect(ctx.scene.monster.maxHealth).toBe(12)` for stage 3 | PASS |
| STG-17 position text | `Stage S/10  Phase P/5`, `Stage S/10  Miniboss`, `Chapter Boss` | `GS/domain/campaign/campaign.test.js:90` `label: 'Stage 2/3  Phase 3/3'`, `:100` `'Stage 2/3  Miniboss'`, `:106` `'Chapter Boss'`; scene `CG:823` `expect(label(ctx)).toBe('Stage 3/10  Phase 2/5')`; click-through `CG:843`; e2e `GE/stages.spec.js:41` `toHaveText('Stage 1/2 Phase N/5')` in real Phaser | PASS |
| STG-18 phase monster dies | next position after fade 500 ms + delay 1 000 ms | `CG:850` `expect(label(ctx)).toBe('Stage 1/10  Phase 2/5')` after `advance`, `expect(ctx.scene.monster.health).toBe(10)`; the fade and delay values are the pre-existing ones asserted at `CG:216` (`duration: 500`) and `CG:274` (`delay: 1000`) | PASS |
| STG-19 boss countdown shown | whole seconds from `timeLimitMs` | `CG:862` `expect(timer(ctx)).toBe('Time: 30')`; `CG:879` `Time: 29` after 1001 ms, `Time: 1`; `GS/domain/campaign/bossCountdown.test.js:12` 30 -> 29; e2e `GE/stages.spec.js:41` `/^Time: [23]$/` | PASS, text format is a spec-precision gap (G1) |
| STG-20 boss dies in time | countdown stops, next position | `CG:890` `expect(timer(ctx)).toBe('')`, `expect(label(ctx)).toBe('Stage 2/10  Phase 1/5')`; `CG:940` kill before the frame's countdown check wins; e2e `GE/stages.spec.js:57` reaches `Stage 2/2 Phase 1/5` | PASS |
| STG-21 countdown reaches 0 | boss removed, countdown hidden, phase 5 of the same stage after the respawn delay | `CG:904` `expect(ctx.scene.monster).toBeNull()`, `expect(ctx.monster.alpha).toBe(0)`, `expect(timer(ctx)).toBe('')`, no damage text; `CG:916` `expect(ctx.timers.at(-1).delay).toBe(1000)`, `expect(label(ctx)).toBe('Stage 1/10  Phase 5/5')`; `CG:962` chapter boss -> `Stage 10/10  Phase 5/5`; e2e `GE/stages.spec.js:57` | PASS |
| STG-22 chapter boss dies | completion message, no monster, clicks ignored | `CG:971` `expect(message(ctx)).toBe('Chapter complete!')`, `expect(ctx.scene.monster).toBeNull()`; `CG:983` damage-text count unchanged after a click; `CG:994` completed at load; e2e `GE/stages.spec.js:103` | PASS, message text is a spec-precision gap (G2) |
| STG-23 drops unchanged | boss kill takes the level 1 drop | `CG:1026` `expect(ctx.sprites).toHaveLength(4)` for a boss with queue `[4, 1, 5]` | PASS |

### P1: The game saves and recovers position

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| STG-24 ordered reports, one in flight | one report per move with the position it left | `GS/application/campaign/campaignSession.test.js:80` `expect(gateway.report).toHaveBeenCalledWith(position(1, 'PHASE', 1), 'CLEARED')`; `:123` order and `toHaveBeenCalledTimes(1)` while the first is pending; `:141` no second flush; `CG:1064`, `:1076` (two kills, calls 1 and 2 in order), `:1091` `FAILED`; adapter `GS/adapters/http/progressApi.test.js:26` body `{ chapter, stage, encounter, phase, outcome }`; e2e `GE/stages.spec.js:57` three calls in order | PASS |
| STG-25 report fails | stays first, play continues, resent next tick | `GS/application/campaign/campaignSession.test.js:188` `toHaveBeenNthCalledWith(2, position(1, 'PHASE', 1), 'CLEARED')`, `:203` local position kept; `CG:1101` `expect(label(ctx)).toBe('Stage 1/10  Phase 2/5')` then resent | PASS |
| STG-26 409 | queue dropped, local position replaced, encounter respawned | `GS/application/campaign/campaignSession.test.js:217` `onRealign` called with `{ kind: 'PHASE', stage: 1, phase: 2 }` and one report only; `CG:1126` `expect(label(ctx)).toBe('Stage 1/10  Phase 4/5')`; `CG:1140` no resend; `CG:1169`, `:1182` a respawn already waiting is cancelled; `GS/adapters/http/progressApi.test.js:52` `expect(error.body.progress).toEqual(progress)` | PASS |
| STG-27 load fails | "Could not load progress", no monster, retry each tick | `CG:1004` `expect(message(ctx)).toBe('Could not load progress')`, monster null; `CG:1196` `expect(campaignGateway.get).toHaveBeenCalledTimes(2)`, message `''`, monster present; `CG:1210`, `:1220`, `:1229` | PASS |
| STG-28 reload resumes | stored position, full-health encounter, boss with full countdown | `GE/stages.spec.js:84` after reload `toHaveText('Stage 1/2 Phase 3/5')` (real Phaser); `CG:823` loads mid-stage; `CG:879` boss loads with `Time: 30`; `GS/application/campaign/campaignSession.test.js:51` `{ kind: 'MINIBOSS', stage: 2, health: 55, timeLimitMs: 30000 }` | PASS |

### Edge cases

| Edge case | `file:line` + assertion | Result |
| --------- | ----------------------- | ------ |
| Kill phase 5 after a failed boss leads to the miniboss again with a full countdown | `CG:928` `expect(label(ctx)).toBe('Stage 1/10  Miniboss')`, `expect(timer(ctx)).toBe('Time: 30')` | PASS |
| Countdown 0 and boss 0 health in one frame: the kill wins | `CG:940` | PASS |
| Scene shuts down with reports queued: one best-effort pass, no retry | `CG:1238` `toHaveBeenCalledTimes(2)` in order; `CG:1253` `toHaveBeenCalledTimes(1)` after a failure and a tick; `CG:1267` none when empty; `GS/application/campaign/campaignSession.test.js:295` no double send of the in-flight report | PASS |
| Two tabs: the older tab's next report gets 409 and realigns | `CG:1126`, `GS/application/campaign/campaignSession.test.js:234` (stored position ahead) | PASS |
| User deleted: progress deleted, others kept | `BT/service/UserServiceTest.kt:187` `assertEquals(setOf("ana"), progresses.progresses.keys)`; `BT/adapter/web/ProgressControllerIT.kt:284` `assertFalse(jpaProgressRepository.existsById("yan"))`, `existsById("ana") == true` | PASS |

**Status**: 28 of 28 requirements and 5 of 5 edge cases matched with exact outcomes; 2 spec-precision gaps flagged (G1, G2), both non-blocking.

---

## Discrimination Sensor

Scratch: a detached `git worktree` of `647ec8a` under the session scratchpad, `node_modules` shared by a junction; each mutation applied to the scratch copy, the covering tests run there, the file restored. Baseline in the scratch: `ProgressTest` and the campaign unit tests green before mutating. The real tree's `git status --porcelain` before and after is identical (`M game/src/adapters/phaser/Preloader.js`, three untracked `coin-*.png`, all pre-existing and not part of this feature). The worktree was removed from git; a leftover build directory in the scratchpad (outside the project) could not be deleted because of Windows long paths.

| Mutation | File:line | Description | Killed? |
| -------- | --------- | ----------- | ------- |
| M1 | `backend/.../domain/Progress.kt:56` | `phase < phasesPerStage` to `<=` (one extra phase per stage) | Killed (`ProgressTest`) |
| M2 | `backend/.../domain/Progress.kt:73` | failed boss returns to phase 1 instead of the last phase | Killed (`ProgressTest`) |
| M3 | `backend/.../domain/Progress.kt:43` | drop the `reported != position` check (accept any position) | Killed (`ProgressTest`) |
| M4 | `backend/.../service/ProgressService.kt:42` | remove `progressRepository.save(next)` | Killed (`ProgressServiceTest`) |
| M5 | `backend/.../adapter/web/ApiExceptionHandler.kt:44` | 409 without the stored `progress` property | Killed (`ProgressControllerIT`) |
| M6 | `game/src/domain/campaign/campaign.js:99` | client rule `phase <` to `<=` | Killed (`campaign.test.js`) |
| M7 | `game/src/application/campaign/campaignSession.js:137` | do not remove a report after it was sent (duplicate sends) | Killed (`campaignSession.test.js`) |
| M8 | `game/src/domain/campaign/bossCountdown.js:24` | `Math.ceil` to `Math.floor` | Killed (`bossCountdown.test.js`) |
| M9 | `game/src/adapters/phaser/ClickerGame.js:198` | remove the generation guard (stale respawn after a realignment) | Killed (`ClickerGame.test.js`) |
| M10 | `game/src/adapters/phaser/ClickerGame.js:282` | do not hide the countdown when the boss dies | Killed (`ClickerGame.test.js`) |

**Sensor depth**: lightweight, raised to 10 mutations because progress is data-integrity code (server state machine, report ordering).
**Result**: 10/10 killed, 0 survived - PASS

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | Yes. One known leftover: `Monster.respawn()` (`game/src/domain/combat/monster.js:31`) is no longer called by the scene, only by its own tests; left in place because removing tests is outside this feature (G3) |
| Surgical changes | Yes. The refactor tasks changed imports, folder and wiring; every pre-existing scene assertion is unchanged except where the spec changed behavior (async start, hidden monster until an encounter is shown) |
| No scope creep | Yes. `UserService.delete` removing progress is the spec's lifecycle edge case |
| Matches patterns | Yes. Backend follows the flat layout of the wallet code (adapter/domain/port/service/usecase), logger in domain and service, hand fakes; game follows ADR 0007 and is held by `GS/architecture.test.js:1` |
| Spec-anchored outcome check | Yes. Exact status codes, positions and strings are asserted; two display strings not fixed by the spec are flagged (G1, G2) |
| Per-layer Coverage Expectation | Yes. Domain and service 1:1 to ACs (`ProgressTest`, `campaign.test.js`, `campaignSession.test.js`); every route has happy, edge and error tests (`ProgressControllerIT`) |
| Every test maps to a requirement | Yes. Spot check of `ProgressControllerIT`: each of its 16 tests maps to STG-03 to STG-15 or the deletion edge case |
| Guidelines followed | `backend/docs/adr/0002-testing.md` (unit without Spring, ITs on real Postgres via Testcontainers, `ktlintCheck test`), `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, `CLAUDE.md` (push after every commit) |

---

## Gate Check

- **Gate command**: backend `./gradlew ktlintCheck build`; game `npm run build && npm test && npm run test:e2e`
- **Result**: backend 267 passed; game 304 unit + 25 e2e passed; 0 failed, 0 skipped
- **Test count before / after**: backend 194 / 267 (+73); game unit 187 / 304 (+117, net of the one deliberate removal); e2e 21 / 25 (+4)
- **Skipped tests**: none
- **Failures**: none

---

## Gaps (non-blocking)

- **G1 spec-precision**: STG-19 says "a countdown in whole seconds" but not its text. The game shows `Time: N`; tests pin that string. If the wording matters, fix it in the spec and the two places that assert it (`CG:862`, `GE/stages.spec.js:41`).
- **G2 spec-precision**: STG-22 says "a completion message" without the wording. The game shows `Chapter complete!` (`CG:971`).
- **G3 minor**: `Monster.respawn()` is unused by the game now (see Code Quality). `ChapterRepository.save` upserts the stages it is given and never deletes stages dropped from a definition; nothing needs that today. Game ADR 0006 still names `src/economy/walletLedger.js`, which moved to `src/domain/economy/` (ADR 0007 records the move).
- **G4 not proven end to end**: the backend (real Postgres, HTTP) and the game (real Phaser, fake backend) are each verified, and the JSON field names match on both sides by reading `ProgressResponse` against `fakeBackend.js` `progressBody` and `progressApi.js`. The game has not been run against the real backend. Next step in `.specs/STATE.md`: run the backend with `JWT_SECRET` and `npm run dev` together once by hand.

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| STG-01 to STG-28 | Pending | Verified |

---

## Summary

**Overall**: Ready

**Spec-anchored check**: 28/28 ACs and 5/5 edge cases matched the spec outcome; 2 spec-precision gaps (display strings)
**Sensor**: 10/10 mutations killed
**Gate**: backend 267 passed; game 304 unit and 25 e2e passed

**What works**: the campaign end to end on both sides, the 409 realignment, the ordered report queue, and the hexagonal layout enforced by a test.

**Issues found**: none blocking; G1 to G4 above.

**Next steps**: run the real backend and the game together once by hand (G4); decide the wording of the countdown and completion texts (G1, G2).
