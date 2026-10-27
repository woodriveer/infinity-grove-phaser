# Account Reset Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/account-reset/design.md`
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/build.gradle.kts` (ktlint, JUnit + Testcontainers), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend); no coverage thresholds - strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; exact rewards and error codes of the spec | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service | unit (in-memory ports) | Orchestration, lock, every refusal changes nothing | `backend/src/test/kotlin/**/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository, web | integration (Testcontainers) | Every route: happy + each error code + the race + kept state; schema validate | `backend/src/test/kotlin/**/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain, application, http | unit | All branches; 1:1 to spec ACs | `game/src/**/*.test.js` | `cd game && npm test` |
| Game views and scene | unit (jsdom) | Rendered texts and states of the spec | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| e2e | e2e | Button label, dialog, reset back to chapter 1 with the notice | `game/e2e/*.spec.js` | `cd game && npx playwright test e2e/accountReset.spec.js` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | game: `cd game && npm test`; backend: `cd backend && ./gradlew test --tests '*Reset*' --tests '*AutoClick*'` |
| Full | After tasks with e2e or integration tests | backend: `cd backend && ./gradlew test`; game: `cd game && npm test && npx playwright test e2e/accountReset.spec.js` |
| Build | After phase completion | `cd backend && ./gradlew build`; `cd game && npm test && npm run build` |

---

## Execution Plan

### Phase 1: Backend

```
T1 → T2 → T3 → T4
```

### Phase 2: Game

```
T5 → T6 → T7 → T8
```

---

## Task Breakdown

### T1: Reset domain

**What**: `AccountReset` (reward and check), the reset exceptions and `autoClickUnlocked(progress, resets)`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/AccountReset.kt`
**Depends on**: None
**Reuses**: `AutoClickExceptions.kt` shape
**Requirement**: RESET-01, RESET-06, RESET-13

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Reward: chapter 1 → null, 2 → 2, 3 → 3, 5 → 5, completed chapter 5 → 5
- [x] Check: `fromChapter` ≠ stored → `RESET_CHAPTER_MISMATCH` carrying the view (also at chapter 1); chapter 1 sent 1 → `RESET_LOCKED`; matching chapter ≥ 2 returns the reward
- [x] `autoClickUnlocked` true at chapter 1 with resets 1, false with resets 0
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Reset*' --tests '*AutoClick*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): add the account reset rules`

---

### T2: Reset count persistence

**What**: Flyway `V7__player_resets.sql`, `ResetRepositoryPort` and `ResetRepository`.
**Where**: `backend/src/main/resources/db/migration/V7__player_resets.sql`
**Depends on**: T1
**Reuses**: `AutoClickRepository.kt`, `V6__auto_click.sql` (AD-010)
**Requirement**: RESET-05

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] No row reads 0; a saved count reads back per player, apart from other players
- [x] `ddl-auto: validate` passes
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Reset*' --tests '*SchemaValidationIT'`

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): store the reset count of each player`

---

### T3: Reset service and auto click unlock

**What**: `ResetAccountUseCase`, `AccountResetService` under the progress lock, and `AutoClickService` reading the reset count.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/AccountResetService.kt`
**Depends on**: T2
**Reuses**: `AutoClickService` flow, in-memory ports of `AutoClickServiceTest`
**Requirement**: RESET-01, RESET-02, RESET-03, RESET-04, RESET-05, RESET-06, RESET-08, RESET-13

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Chapter 3, 4 crystals, 1 reset: result reward 3, crystals 7, resets 2, progress chapter 1 stage 1 PHASE 1 not completed; talents deleted; auto click level untouched
- [x] Completed campaign pays 5; no crystal row starts from 0
- [x] Mismatch and locked change nothing (progress, crystals, resets, talents)
- [x] Unknown user → `UserNotFoundException`
- [x] `AutoClickService.get` answers `resets`; upgrade at chapter 1 with resets 1 applies, with resets 0 is `AUTO_CLICK_LOCKED`
- [x] Applied reset logs info with username, chapter, reward, crystals, resets; a refusal logs warn with the reason and the stored chapter
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Reset*' --tests '*AutoClick*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): reset the account for crystals in a service`

---

### T4: Reset endpoint

**What**: `POST /account/reset`, its error handlers and `resets` in the auto click answer.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/AccountResetController.kt`
**Depends on**: T3
**Reuses**: `AutoClickController`, `AutoClickControllerIT`
**Requirement**: RESET-01, RESET-02, RESET-03, RESET-04, RESET-05, RESET-06, RESET-07, RESET-13

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Spec independent test: chapter 3, 4 crystals, level 1, 2 talent levels, 900 copper → 200 `{ reward: 3, crystals: 7, resets: 1, progress: { chapter: 1, stage: 1, ... } }`; talents all 0 with 0 points; wallet 900; auto click level 1
- [x] 409 `RESET_LOCKED`; 409 `RESET_CHAPTER_MISMATCH` with `progress`; 400 `INVALID_RESET_REQUEST` (missing, string); 401 without a token; nothing changes on a refusal
- [x] Two racing resets from the same chapter: one 200, one 409 `RESET_CHAPTER_MISMATCH`, crystals paid once
- [x] `GET /auto-click` answers `resets`; after a reset an upgrade at chapter 1 applies
- [x] Gate check passes: `cd backend && ./gradlew build`

**Tests**: integration
**Gate**: build

**Commit**: `feat(backend): expose the account reset`

---

### T5: Reset reward and unlock rules in the game

**What**: `resetReward({ chapter, completed })` and `autoClickUnlocked` with `resets`.
**Where**: `game/src/domain/campaign/accountReset.js`
**Depends on**: None
**Reuses**: `domain/combat/autoClick.js` style
**Requirement**: RESET-09, RESET-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Reward null at chapter 1 and before load, 2 at 2, 4 at 4, 5 at 5 and when completed
- [x] Auto click unlocked at chapter 1 with resets 1, locked with resets 0 or undefined
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add the account reset reward rule`

---

### T6: Reset gateway and application service

**What**: `accountResetApi`, `createAccountReset`, `campaignSession.restart`, `autoClickState.adoptReset` and the composition.
**Where**: `game/src/application/accountReset/accountReset.js`
**Depends on**: T5
**Reuses**: `autoClickApi`, `autoClickState`, `campaignSession.adopt`
**Requirement**: RESET-10, RESET-11, RESET-12, RESET-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The api posts `/account/reset` `{ fromChapter }`
- [ ] `reset()` sends the session chapter; a 200 restarts the session at the answered progress (queue voided, realign fired), sets crystals and resets in the auto click state, reloads the talents
- [ ] A 409 with `progress` restarts the session at it and rejects; crystals unchanged
- [ ] A network error rejects and changes nothing
- [ ] `services` carries `createAccountReset`
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): send the account reset and adopt its answer`

---

### T7: Reset button and dialog in the fight

**What**: `resetView` and the `ClickerGame` wiring: button in the auto click box, dialog, notice, unlock with resets.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Depends on**: T6
**Reuses**: `autoClickView`, pause confirm, `HeroUi.showNotice`
**Requirement**: RESET-09, RESET-10, RESET-11, RESET-12, RESET-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Chapter 4: button `Resetar conta (+4 cristais)`; chapter 1 with no resets: no button and no box
- [ ] The button opens the dialog with the spec text; `Cancelar` closes it with no request; a dialog click does not hit the monster
- [ ] `Resetar` sends, is disabled meanwhile; 200 closes the dialog, shows `Cristais: <n>` and notice `+N cristais`, fight back at chapter 1
- [ ] 409 closes the dialog and realigns; network error keeps it open with `Não foi possível resetar. Tente de novo.` and `Resetar` enabled
- [ ] Chapter 1 with resets 1: switch shown and auto click hits
- [ ] Gate check passes: `cd game && npm test && npm run build`

**Tests**: unit
**Gate**: build

**Commit**: `feat(game): reset the account from the auto click box`

---

### T8: Account reset e2e

**What**: Fake backend `/account/reset` route and `e2e/accountReset.spec.js`.
**Where**: `game/e2e/accountReset.spec.js`
**Depends on**: T7
**Reuses**: `e2e/support/fakeBackend.js`, `e2e/autoClick.spec.js`
**Requirement**: RESET-09, RESET-10, RESET-11, RESET-14

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] At chapter 3 the button reads `Resetar conta (+3 cristais)`; `Cancelar` keeps the chapter
- [ ] `Resetar` brings `Capítulo 1`, `Cristais: 3`, the `+3 cristais` notice and the `Auto clique` switch
- [ ] Gate check passes: `cd game && npx playwright test e2e/accountReset.spec.js`

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): cover the account reset end to end`
