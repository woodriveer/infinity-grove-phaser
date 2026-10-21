# Talents Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/talents/spec.md`
**Status**: In progress

The design is inline (no `design.md`): the backend follows the equipment feature (ADR 0008, flat `domain` / `port` / `usecase` / `service` / `adapter` packages of the project, which the `kotlin-backend-ddd` rules are mapped onto), the game follows ADR 0007 (`domain` / `application` / `adapters`).

---

## Test Coverage Matrix

> Guidelines found: `game/vitest.config.js`, `game/playwright.config.js`, `backend/docs/adr/0002-testing.md`, `CLAUDE.md` (push after commit).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; 1:1 to spec ACs; the price curve values | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service | unit (in-memory ports) | Orchestration, lock order, every refusal | `backend/src/test/kotlin/**/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository, web | integration (Testcontainers) | Every route: happy path and each error code; the race | `backend/src/test/kotlin/**/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain and application | unit | All branches; exact numbers of the spec | `game/src/domain/**/*.test.js`, `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game views and scene | unit (jsdom) | Rendered texts and states of the spec | `game/src/adapters/**/*.test.js` | `cd game && npm test` |
| e2e | e2e | Buying a level, the effect on a click | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |

## Gate Check Commands

The backend integration tests need Docker and, until the owner's rates in `application.yaml` are settled, the three overrides in the Handoff.

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | game: `cd game && npm test`; backend: `cd backend && ./gradlew test --tests '*Talent*'` |
| Full | After tasks with e2e or integration tests | `cd game && npm test && npm run test:e2e`; backend: `cd backend && ./gradlew test` |
| Build | After phase completion | `cd game && npm test && npm run build`; `cd backend && ./gradlew build` |

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

### T1: Talent domain

**What**: The catalog of the 8 talents, the price curve, `PlayerTalents` with its upgrade rules and the exceptions.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Talents.kt`, `TalentExceptions.kt`
**Depends on**: None
**Reuses**: `NotEnoughCopperException`, `BusinessException`
**Requirement**: TAL-01, TAL-02, TAL-03

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] The catalog holds the 8 ids, branches, per-level values and max level 10 of the spec table
- [x] The price from level 0 to 9 is 300, 480, 768, 1229, 1966, 3146, 5033, 8053, 12885, 20616
- [x] `upgrade` raises the level by one when `fromLevel` is the stored level, refuses a mismatch and a max level, and a fresh player has level 0 everywhere
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Talent*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): add the talent domain`

---

### T2: Talent persistence

**What**: The `player_talents` table, its entity and the repository behind the port.
**Where**: `backend/src/main/resources/db/migration/V3__player_talents.sql`, `adapter/repository/TalentRepository.kt`, `port/TalentRepositoryPort.kt`
**Depends on**: T1
**Reuses**: `EquipmentRepository` shape, Flyway (AD-010)
**Requirement**: TAL-04

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Rows keyed by (username, talent id) with a foreign key to `users` that cascades on delete
- [x] `findAll` returns only the player's levels; `save` inserts then updates
- [x] `ddl-auto: validate` still passes with the new entity
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Talent*' --tests '*SchemaValidationIT'`

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): store the talent levels of a player`

---

### T3: Talent service

**What**: List the tree and upgrade a talent under the wallet lock.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/service/TalentService.kt`, `usecase/TalentUseCase.kt`
**Depends on**: T2
**Reuses**: `WalletAccess`, `UserRepositoryPort`
**Requirement**: TAL-02, TAL-03

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] An upgrade takes the copper and raises the level in one transaction
- [x] A wrong `fromLevel`, a max level, a short wallet and an unknown talent leave the level and the wallet unchanged
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Talent*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): upgrade a talent with the wallet copper`

---

### T4: Talent endpoints

**What**: `GET /talents` and `POST /talents/{id}/upgrade`, the error mapping and the ADR.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/TalentController.kt`, `TalentResponses.kt`, `ApiExceptionHandler.kt`, `adapter/config/TalentConfig.kt`, `backend/docs/adr/0010-talents.md`
**Depends on**: T3
**Reuses**: `CoinsResponse`, `ApiExceptionHandler`
**Requirement**: TAL-01, TAL-02, TAL-03

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] The responses carry the fields of the spec, `nextCost` null at the max level
- [x] 400 `INVALID_TALENT_REQUEST`, 401, 404 `TALENT_NOT_FOUND`, 409 `TALENT_LEVEL_MISMATCH`, `TALENT_MAX_LEVEL` and `NOT_ENOUGH_COPPER`
- [x] Two racing requests with the same `fromLevel`: exactly one succeeds
- [x] Gate check passes: `cd backend && ./gradlew test`

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): expose the talent tree and its upgrade`

---

### T5: Talent effects

**What**: The pure rules that turn the talent levels into the attacker bonus, the defense breaks and the time limits.
**Where**: `game/src/domain/talents/talents.js`, `game/src/domain/combat/leaderAttacker.js`, `game/src/domain/skills/skillDamage.js`
**Depends on**: None
**Reuses**: `attackerFor` bonus, `starBonus`, Brado Aterrador's defense floor
**Requirement**: TAL-05, TAL-06, TAL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `CLICK_DAMAGE` 5, `CRIT_CHANCE` 4, `CRIT_DAMAGE` 6 give +15 %, +4 points and +0.3
- [ ] The break talents lower the monster stats with a floor of 0, per damage type, and Base 100 against defense 20 with `PHYSICAL_BREAK` 5 deals 85
- [ ] Break and Brado together floor at 0 (defense 10, break 4, Brado: 0)
- [ ] `MINIBOSS_TIME` 5 adds 10 s to a miniboss, `BOSS_TIME` 4 adds 12 s to the chapter boss and neither adds to the other
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add the rules of the talent effects`

---

### T6: Talent API and collection

**What**: The gateway to `/talents`, the collection the scene reads and its fake backend for e2e.
**Where**: `game/src/adapters/http/talentApi.js`, `game/src/application/talents/talentCollection.js`, `game/src/composition.js`, `game/e2e/support/fakeBackend.js`
**Depends on**: T5
**Reuses**: `equipmentApi.js`, `equipmentCollection.js`, `composition.js`
**Requirement**: TAL-05, TAL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `list` and `upgrade(id, fromLevel)` call the endpoints and the collection keeps the tree and tells the wallet to the listeners
- [ ] A 409 reloads the tree
- [ ] The fake backend answers `/talents` with the prices of the spec
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): load and upgrade the talents`

---

### T7: Talents in combat

**What**: The scene applies the talents: the attacker bonus, the defense breaks and the time limits.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Depends on**: T6
**Reuses**: `leaderAttacker`, `SkillCombat`, `BossCountdown`
**Requirement**: TAL-05, TAL-06, TAL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] With the talents unloaded the fight has no talent effect
- [ ] A click, a skill hit and a tick use the break; a miniboss and the chapter boss get their own time bonus
- [ ] Gate check passes: `cd game && npm test && npm run test:e2e`

**Tests**: unit, e2e
**Gate**: full

**Commit**: `feat(game): apply the talents in combat`

---

### T8: Talentos screen

**What**: The seventh HUD button, the window with three columns and the upgrade flow.
**Where**: `game/src/adapters/phaser/views/talentsView.js`, `game/src/adapters/phaser/HeroUi.js`, `game/public/style.css`
**Depends on**: T7
**Reuses**: `renderEquipment`, `formatCopper`, the hero window
**Requirement**: TAL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The window shows the texts and states of the spec, with the button disabled by funds, by a running request and at the max level
- [ ] A 409 shows `Moedas insuficientes` or the generic text and reloads the tree
- [ ] Gate check passes: `cd game && npm test && npm run build && npm run test:e2e`

**Tests**: unit, e2e
**Gate**: build

**Commit**: `feat(game): add the Talentos screen`
