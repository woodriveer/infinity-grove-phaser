# Auto Click Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/auto-click/design.md`
**Status**: Done

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `backend/build.gradle.kts` (ktlint, JUnit + Testcontainers), `game/vitest.config.js` (jsdom), `game/playwright.config.js` (fake backend); no coverage thresholds - strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; exact intervals, prices and error codes of the spec | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service | unit (in-memory ports) | Orchestration, lock, every refusal, logs not asserted | `backend/src/test/kotlin/**/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository, web | integration (Testcontainers) | Every route: happy + each error code + the race; schema validate | `backend/src/test/kotlin/**/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain, application, storage, http | unit | All branches; 1:1 to spec ACs | `game/src/**/*.test.js` | `cd game && npm test` |
| Game views and scene | unit (jsdom) | Rendered texts and states of the spec; scene timing | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| e2e | e2e | Auto click hits with no click, the switch stops it, HUD texts | `game/e2e/*.spec.js` | `cd game && npx playwright test e2e/autoClick.spec.js` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | game: `cd game && npm test`; backend: `cd backend && ./gradlew test --tests '*AutoClick*'` |
| Full | After tasks with e2e or integration tests | backend: `cd backend && ./gradlew test`; game: `cd game && npm test && npx playwright test e2e/autoClick.spec.js` |
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

### T1: Auto click domain

**What**: `AutoClickRules`, `PlayerAutoClick`, `AutoClickStep`, `autoClickUnlocked(progress)` and the auto click exceptions.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/AutoClick.kt`
**Depends on**: None
**Reuses**: `TalentExceptions.kt` shape
**Requirement**: AUTO-05, AUTO-06

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Rules `[500, 250, 150, 100, 50]` / `[10, 25, 50, 100]` give interval 500..50 for levels 0..4, `next` `{1, 250, 10}` .. `{4, 50, 100}`, `null` at 4
- [x] Bad rules (sizes off, non-decreasing interval, price < 1) fail at construction
- [x] `upgrade` from the held level with enough crystals and unlocked raises the level by 1 and takes the price
- [x] Refusals: `AUTO_CLICK_LEVEL_MISMATCH` (carrying the stored state), `AUTO_CLICK_MAX_LEVEL`, `AUTO_CLICK_LOCKED`, `NOT_ENOUGH_CRYSTALS`, in that order of check; a negative `fromLevel` is `INVALID_AUTO_CLICK_REQUEST`
- [x] `autoClickUnlocked` is false at chapter 1, true at chapter 2 and for a completed progress
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*AutoClick*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): add the auto click rules and upgrade domain`

---

### T2: Crystal and auto click persistence

**What**: Flyway `V6__auto_click.sql` (`player_crystals`, `player_auto_click`), the two ports and their JPA repositories.
**Where**: `backend/src/main/resources/db/migration/V6__auto_click.sql`
**Depends on**: T1
**Reuses**: `TalentRepository.kt` shape (AD-010)
**Requirement**: AUTO-05

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] No row reads as 0 crystals and level 0; saved values read back per player, apart from other players
- [x] Rows cascade when the user is deleted; `ddl-auto: validate` passes
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*AutoClick*' --tests '*Crystal*' --tests '*SchemaValidationIT'`

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): store crystals and the auto click level`

---

### T3: Auto click service and settings

**What**: `GetAutoClickUseCase`, `UpgradeAutoClickUseCase`, `AutoClickService` under the progress row lock, and `app.auto-click` settings.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/AutoClickService.kt`
**Depends on**: T2
**Reuses**: `TalentService` flow, `TalentConfig`
**Requirement**: AUTO-05, AUTO-06

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] `get` answers level, crystals and rules for a known user; an unknown user is `UserNotFoundException`
- [x] `upgrade` creates the progress if absent, locks it, checks the chapter, saves level and crystals; a refusal saves nothing
- [x] Settings `app.auto-click.intervals-ms` and `prices` default to the spec values
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*AutoClick*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): get and upgrade the auto click in a service`

---

### T4: Auto click endpoints

**What**: `GET /auto-click`, `POST /auto-click/upgrade` and the error handlers.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/AutoClickController.kt`
**Depends on**: T3
**Reuses**: `TalentController`, `ApiExceptionHandler`, `TalentControllerIT`
**Requirement**: AUTO-05, AUTO-06

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] A new player gets `{ level: 0, maxLevel: 4, intervalMs: 500, crystals: 0, next: { level: 1, intervalMs: 250, price: 10 } }`
- [x] Chapter 2 with 10 crystals upgrading from 0 answers level 1, 250, 0 crystals, next `{ 2, 150, 25 }`
- [x] 409 `NOT_ENOUGH_CRYSTALS`, `AUTO_CLICK_MAX_LEVEL`, `AUTO_CLICK_LOCKED`, `AUTO_CLICK_LEVEL_MISMATCH` (with `autoClick`); 400 `INVALID_AUTO_CLICK_REQUEST`; 401 without a token; nothing changes on a refusal
- [x] Two racing upgrades from the same level apply exactly one
- [x] Gate check passes: `cd backend && ./gradlew build`

**Tests**: integration
**Gate**: build

**Commit**: `feat(backend): expose the auto click state and upgrade`

---

### T5: Auto clicker timing

**What**: `AutoClicker` (frame time to clicks, at most 5 a frame) and `autoClickUnlocked({ chapter, completed })`.
**Where**: `game/src/domain/combat/autoClick.js`
**Depends on**: None
**Reuses**: `combo.js` style
**Requirement**: AUTO-01, AUTO-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] At 500 ms: 499 ms gives 0, 1 ms more gives 1, 1000 ms gives 2; a 10 s frame gives 5 and keeps the rest
- [x] A new interval applies from the next advance
- [x] Unlock false at chapter 1, true at 2 and when completed, false before the campaign loads (`chapter: null`)
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add the auto clicker timing`

---

### T6: Auto click state, gateway and preference

**What**: `autoClickApi`, `createAutoClickState`, `createAutoClickPreference` and their composition.
**Where**: `game/src/application/autoClick/autoClickState.js`
**Depends on**: T5
**Reuses**: `talentApi`, `talentCollection`
**Requirement**: AUTO-04, AUTO-05, AUTO-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] The api calls `GET /auto-click` and `POST /auto-click/upgrade` `{ fromLevel }`
- [x] The state reads 500 ms before a load and after a failed one, the answered interval after a load or an upgrade; an upgrade sends the held level; a 409 reloads and rethrows
- [x] The preference is true by default, stores and restores the choice under `infinity-grove.auto-click`, and is true when storage throws
- [x] `services` carries `createAutoClickState` and `autoClickPreference`
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): load and upgrade the auto click and remember the switch`

---

### T7: Auto click on the HUD and in the fight

**What**: `autoClickView` and the `ClickerGame` wiring: switch, texts, upgrade button, auto clicks in `update`.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Depends on**: T6
**Reuses**: `hitMonster`, farm toggle HTML, `dom.js`
**Requirement**: AUTO-01, AUTO-02, AUTO-03, AUTO-04, AUTO-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Chapter 2, switch on: 1000 ms of update hit twice with the click damage at `MONSTER.x`, combo 2; chapter 1: none and the switch hidden
- [x] No auto click while paused or without a living monster; a burst stops at the kill; manual clicks still hit
- [x] Switch off stops it and is stored; the box shows `Auto clique`, `500 ms`, `Cristais: 0` and a disabled `Melhorar: 250 ms (10 cristais)`; no button at level 4; a load failure hides crystals and button
- [x] Pressing an enabled button upgrades from the shown level and the interval changes; a 409 shows the stored state
- [x] Chapter 1 boss beaten → the switch shows and the auto click starts
- [x] Gate check passes: `cd game && npm test && npm run build`

**Tests**: unit
**Gate**: build

**Commit**: `feat(game): run the auto click after chapter 1 with a HUD switch`

---

### T8: Auto click e2e

**What**: Fake backend `/auto-click` routes and `e2e/autoClick.spec.js`.
**Where**: `game/e2e/autoClick.spec.js`
**Depends on**: T7
**Reuses**: `e2e/support/fakeBackend.js`, `talents.spec.js`
**Requirement**: AUTO-01, AUTO-04, AUTO-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] At chapter 2 the monster loses health with no click; unchecking `Auto clique` stops it
- [x] The HUD shows `500 ms`, `Cristais: 0` and a disabled `Melhorar: 250 ms (10 cristais)`
- [x] At chapter 1 no `Auto clique` switch is visible
- [x] Gate check passes: `cd game && npx playwright test e2e/autoClick.spec.js`

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): cover the auto click end to end`
