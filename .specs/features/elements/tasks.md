# Elements Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/elements/design.md`
**Status**: In Progress

Execution notes: 8 tasks, one batch, executed inline. `CLAUDE.md` makes `git push` part of every commit. Unrelated working-tree changes (`game/src/adapters/phaser/Preloader.js`, `game/public/assets/coin-*.png`) are never staged.

---

## Test Coverage Matrix

> Generated from codebase and guidelines. Guidelines found: `backend/docs/adr/0002-testing.md`, `game/docs/adr/0004-testing-strategy.md`, `game/docs/adr/0007-modular-hexagonal-game.md`, `game/vitest.config.js`, `game/playwright.config.js`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Backend domain | unit | All branches; 1:1 to spec ACs; every edge case | `backend/src/test/kotlin/**/domain/*Test.kt` | `cd backend && ./gradlew ktlintCheck test --tests "*Test"` |
| Backend repository, config, controller | integration | Key paths; every route: happy + error | `backend/src/test/kotlin/**/*IT.kt` | `cd backend && ./gradlew ktlintCheck test` (Docker) |
| Game domain and application | unit | All branches; 1:1 to spec ACs; every edge case | `game/src/domain/**/*.test.js`, `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game scenes | unit | Every scene-level AC with mocked Phaser | `game/src/adapters/**/*.test.js` | `cd game && npm test` |
| Player flow | e2e | Elements visible in a real browser | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Unit tests only | `cd game && npm test` or `cd backend && ./gradlew ktlintCheck test --tests "*Test"` |
| Full | Integration tests | `cd backend && ./gradlew ktlintCheck test` |
| Build | Phase end | `cd backend && ./gradlew ktlintCheck test` and `cd game && npm test && npm run test:e2e` |

---

## Execution Plan

### Phase 1: Backend

```
T1 → T2 → T3
```

### Phase 2: Game domain

```
T4 → T5 → T6
```

### Phase 3: Game scene

```
T6 → T7 → T8
```

---

## Task Breakdown

### T1: Add Element and EnemyStats to the chapter domain

**What**: `Element`, `EnemyStats` (validated) and the stats on `StageDefinition` (monster, miniboss) and `ChapterDefinition` (boss), with the seed values.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/domain/Chapter.kt`
**Depends on**: None
**Reuses**: existing `require` validation style
**Requirement**: ELEM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Defense outside 0..90 or critical resistance outside 0..100 throws (ELEM-02 AC5)
- [x] `ChapterDefinition.first()` seeds the values of the spec (ELEM-02 AC1)
- [x] Gate passes

**Tests**: unit
**Gate**: quick

---

### T2: Persist the stats

**What**: Entity columns with column defaults and the mapping both ways.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/repository/ChapterEntities.kt`
**Depends on**: T1
**Reuses**: `ChapterRepositoryIT`
**Requirement**: ELEM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] A saved chapter reads back with its stats (ELEM-02 AC1)
- [ ] An unknown stored element fails the load (ELEM-02 AC4)
- [ ] Columns carry defaults FIRE and 0 for old rows (ELEM-02 AC6)
- [ ] Gate passes

**Tests**: integration
**Gate**: full

---

### T3: Deliver the stats in GET /progress

**What**: Nested stats objects in `StageResponse` and `ChapterResponse`.
**Where**: `backend/src/main/kotlin/br/com/woodriver/infinity_grove_ws/adapter/web/ProgressController.kt`
**Depends on**: T2
**Reuses**: `ProgressControllerIT`
**Requirement**: ELEM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `GET /progress` returns `monster`, `miniboss` per stage and `boss` with the four values (ELEM-02 AC2)
- [ ] Gate passes

**Tests**: integration
**Gate**: full

---

### T4: Element multiplier table

**What**: The 5x5 table as a pure function.
**Where**: `game/src/domain/combat/elements.js`
**Depends on**: None
**Reuses**: pure-domain style of `monster.js`
**Requirement**: ELEM-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] All 25 pairs return the multiplier of the spec (ELEM-01 AC1-6)
- [ ] An unknown element throws
- [ ] Gate passes

**Tests**: unit
**Gate**: quick

---

### T5: Damage formula and player

**What**: `PLAYER`, `calculateDamage` and `formatDamage`.
**Where**: `game/src/domain/combat/damage.js`
**Depends on**: T4
**Reuses**: `elements.js`
**Requirement**: ELEM-01, ELEM-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Defense, critical chance, critical resistance 100 and the formula behave as in the spec (ELEM-03 AC1-7)
- [ ] Fire vs darkness gives 0.9 and fire vs nature gives 2 (ELEM-01 AC7-8)
- [ ] `formatDamage` shows at most 1 decimal without a trailing zero (ELEM-01 AC11)
- [ ] Gate passes

**Tests**: unit
**Gate**: quick

---

### T6: Monster takes decimal damage and carries stats; campaign encounters carry stats

**What**: `Monster` rounds health to 6 decimals and holds `stats`; `Campaign.encounter()` returns `stats` (default when absent).
**Where**: `game/src/domain/combat/monster.js` and `game/src/domain/campaign/campaign.js`
**Depends on**: T5
**Reuses**: existing tests of both
**Requirement**: ELEM-01, ELEM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Fractional damage is subtracted exactly and health stops at 0 (ELEM-01 AC9-10, edge case)
- [ ] Phase, miniboss and chapter boss encounters carry the stats of the payload (ELEM-02 AC3)
- [ ] A payload without stats falls back to fire, 0, 0, 0
- [ ] Gate passes

**Tests**: unit
**Gate**: quick

---

### T7: Scene uses the damage rule and shows the stats

**What**: `hitMonster` uses `calculateDamage`, a critical gets a distinct damage number, a new HUD line shows the enemy attributes, the random source is injected.
**Where**: `game/src/adapters/phaser/ClickerGame.js`
**Depends on**: T6
**Reuses**: `createHtml`, `showDamage`
**Requirement**: ELEM-01, ELEM-03, ELEM-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Clicks deal the computed damage and the number shows the formatted value (ELEM-01 AC9, AC11)
- [ ] A critical click is marked (ELEM-03 AC8)
- [ ] The HUD shows, replaces and clears the attributes and is click-through (ELEM-04 AC1-4)
- [ ] All earlier scene tests still pass unchanged
- [ ] Gate passes

**Tests**: unit
**Gate**: quick

---

### T8: Fake backend and e2e

**What**: The e2e fake backend sends stats; one e2e checks the HUD shows an element.
**Where**: `game/e2e/support/fakeBackend.js` and `game/e2e/elements.spec.js`
**Depends on**: T7
**Reuses**: `stages.spec.js`
**Requirement**: ELEM-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] E2E shows the element of the first monster in the HUD
- [ ] Full game test suite and e2e pass

**Tests**: e2e
**Gate**: full

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4 ------→ T5 ------→ T6
Phase 3:  T6 ------→ T7 ------→ T8
```
