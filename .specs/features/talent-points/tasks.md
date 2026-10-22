# Talent Points Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/talent-points/spec.md`
**Status**: In progress

T1, T2 and T3 shipped in one commit: the domain change breaks the compilation of the service and the controller until they use points, so no earlier commit could pass its gate.

The design is inline (no `design.md`): it extends the talents feature (ADR 0010, `domain` / `port` / `usecase` / `service` / `adapter` packages) and the game follows ADR 0007.

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; exact numbers of the spec | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew test` |
| Backend service | unit (in-memory ports) | Orchestration, lock order, every refusal | `backend/src/test/kotlin/**/service/*Test.kt` | `cd backend && ./gradlew test` |
| Backend repository, web | integration (Testcontainers) | Every route, each error code, the race, the migration | `backend/src/test/kotlin/**/adapter/**/*IT.kt` | `cd backend && ./gradlew test` |
| Game domain and application | unit | All branches; exact numbers of the spec | `game/src/domain/**/*.test.js`, `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game views and scene | unit (jsdom) | Rendered texts and states of the spec | `game/src/adapters/**/*.test.js` | `cd game && npm test` |
| e2e | e2e | Earning a point, buying COMBO, the cap in the HUD | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | game: `cd game && npm test`; backend: `cd backend && ./gradlew test --tests '*Talent*' --tests '*Progress*'` |
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

### T1: Points domain and COMBO talent

**What**: Add `COMBO` to the catalog (branch `COMBO`), replace the coin price with a point cost, and model the earned points: the award key of a position, the points of an encounter, `available = earned - spent`, and the `NOT_ENOUGH_TALENT_POINTS` refusal.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Talents.kt`, `TalentExceptions.kt`, `adapter/config/TalentConfig.kt`
**Depends on**: None
**Reuses**: `PlayerTalents.upgrade`, `Encounter`
**Requirement**: TPT-01, TPT-02, TPT-04, TPT-05

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] The catalog holds 9 talents; `COMBO` is `COMBO`, `%`, 5 per level, max 10, label `Limite de dano do combo`; level 10 gives 50
- [x] A phase pays 1, a miniboss 2, a chapter boss 5 (settings `points-per-phase`, `points-per-miniboss`, `points-per-chapter-boss`); the award key is `chapter:stage:encounter:phase`
- [x] `upgrade` costs `cost-per-level` (1) points, refuses with `NOT_ENOUGH_TALENT_POINTS` at 0 available, and still refuses a level mismatch and the max level
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Talent*'`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(backend): add the COMBO talent and the talent point rules`

---

### T2: Award persistence and legacy migration

**What**: The `talent_point_awards` table, its repository behind a port, and `V5` granting a `legacy` award equal to the levels each existing player owns.
**Where**: `backend/src/main/resources/db/migration/V5__talent_point_awards.sql`, `adapter/repository/TalentRepository.kt`, `port/TalentRepositoryPort.kt`
**Depends on**: T1
**Reuses**: `TalentRepository` shape, Flyway (AD-010)
**Requirement**: TPT-01, TPT-03

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Rows keyed by (username, award key) with a foreign key to `users` that cascades on delete; inserting an existing key is a no-op reported as not new
- [x] The earned points of a player are the sum of their awards, apart from other players
- [x] `V5` on a player with talent levels summing to 7 gives `earned` 7
- [x] `ddl-auto: validate` still passes
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Talent*' --tests '*SchemaValidationIT'`

**Tests**: integration
**Gate**: full

**Commit**: `feat(backend): store talent point awards and grant the legacy ones`

---

### T3: Spend points in the talent service and API

**What**: Upgrade a talent for points under the `progress` row lock, answer the tree with `points`, drop the wallet from the talent routes.
**Where**: `service/TalentService.kt`, `usecase/TalentUseCase.kt`, `adapter/web/TalentController.kt`, `adapter/web/ApiExceptionHandler.kt`
**Depends on**: T2
**Reuses**: `ProgressRepositoryPort.findForUpdate`
**Requirement**: TPT-04, TPT-05

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] `GET /talents` answers 9 talents and `points` `{ earned, spent, available }`; `nextCost` is 1, null at level 10
- [x] An upgrade with 3 available points raises the level and answers `spent` 1, `available` 2, with the wallet untouched and no `wallet` field
- [x] 0 available answers 409 `NOT_ENOUGH_TALENT_POINTS`; mismatch, max level, 404, 400 and 401 keep their codes
- [x] Two racing requests accept exactly one; upgrades of different talents never spend more than earned
- [x] Gate check passes: `cd backend && ./gradlew test --tests '*Talent*'`

**Tests**: unit, integration
**Gate**: full

**Commit**: `feat(backend): buy talent levels with talent points`

---

### T4: Award points on a first clear

**What**: Pay the points of a first campaign clear in the outcome report transaction and answer `talentPoints`.
**Where**: `service/ProgressService.kt`, `adapter/web/ProgressController.kt`, `usecase/ProgressUseCase.kt`
**Depends on**: T3
**Reuses**: `ProgressService.report`, the progress row lock
**Requirement**: TPT-01, TPT-02

**Tools**:

- MCP: NONE
- Skill: kotlin-backend-ddd

**Done when**:

- [x] Clearing a new phase answers `talentPoints` 1, a miniboss 2, a chapter boss 5
- [x] Replaying the last phase after a failed miniboss answers 0; a `FAILED` report answers 0; a refused (409) report adds nothing; a farm win adds nothing
- [x] The points show in `earned` of `GET /talents`
- [x] Gate check passes: `cd backend && ./gradlew test`

**Tests**: unit, integration
**Gate**: full

**Commit**: `feat(backend): pay talent points for the first clear of a phase or boss`

---

### T5: Combo cap talent in combat

**What**: Make the combo bonus `min(streak, COMBO value)`, hide the HUD at cap 0, and keep the existing combo tests valid by giving them `COMBO` 10.
**Where**: `game/src/domain/combat/combo.js`, `game/src/domain/talents/talents.js`, `game/src/adapters/phaser/ClickerGame.js`, the combo tests
**Depends on**: None
**Reuses**: `talentValue`
**Requirement**: TPT-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Level 4 with a streak of 30 gives 20 %, with a streak of 12 gives 12 %; level 10 with 60 gives 50 %
- [x] Level 0 or unloaded talents give 0 % and an empty HUD; `Combo x30 · +20%` at level 4
- [x] An upgrade of `COMBO` applies on the next click without ending the streak
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): cap the combo bonus with the COMBO talent`

---

### T6: Talentos screen with points

**What**: Show `Pontos de talento: <n>`, the fourth column `Combo`, the `Melhorar (1 ponto)` button, and the new failure text; drop the wallet from the screen.
**Where**: `game/src/adapters/phaser/views/talentsView.js`, `HeroUi.js`, `game/src/application/talents/talentCollection.js`, `game/src/adapters/http/talentApi.js`, `game/src/domain/talents/talents.js`
**Depends on**: T5
**Reuses**: `renderTalents`, `describeTalentEffect`
**Requirement**: TPT-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] The window shows the points line, four columns and the COMBO card with `Efeito: nenhum` at level 0 and `+25%` at level 5
- [x] Every button is disabled at 0 points or while a request runs; `Nível máximo` and no button at level 10
- [x] `Pontos de talento insuficientes` for `NOT_ENOUGH_TALENT_POINTS`, `Não foi possível melhorar o talento.` otherwise, and the tree reloads after a 409
- [x] No wallet price or `onWallet` call is left in the talent flow
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): spend talent points on the Talentos screen`

---

### T7: Award notice

**What**: Show `+<n> ponto(s) de talento` after an accepted report that paid points and reload the tree.
**Where**: `game/src/application/campaign/campaignSession.js`, `game/src/adapters/phaser/ClickerGame.js`, `HeroUi.js`
**Depends on**: T6
**Reuses**: the `Carta: <nome>` notice
**Requirement**: TPT-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `talentPoints` 2 shows `+2 pontos de talento`, 1 shows `+1 ponto de talento`, 0 shows nothing
- [x] The talent tree is reloaded after a paying report
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): announce the talent points of a first clear`

---

### T8: Fake backend, e2e and docs

**What**: Point the e2e fake backend at the new contract, cover the flow in the browser, update the existing e2e specs that bought with coins or relied on a free combo, and record the decision (ADR and `STATE.md`).
**Where**: `game/e2e/support/fakeBackend.js`, `game/e2e/talents.spec.js`, `game/e2e/clickPower.spec.js`, `backend/docs/adr/0011-talent-points.md`, `.specs/STATE.md`, `.specs/features/talents/spec.md`
**Depends on**: T7
**Reuses**: `mockBackend`
**Requirement**: TPT-06, TPT-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] E2E: with 1 point, open Talentos, buy a COMBO level, read `Nível 1/10`, `Efeito: +5%` and `Pontos de talento: 0`
- [x] E2E: with `COMBO` 2, 30 rapid clicks read `Combo x30 · +10%`
- [x] ADR 0011 and an `AD-0NN` entry record the points, the first-clear key and the legacy grant
- [x] Gate check passes: `cd game && npm test && npm run test:e2e`; `cd backend && ./gradlew build`

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): cover talent points and the combo talent end to end`
