# Hero Skills Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/hero-skills/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `game/vitest.config.js`, `game/playwright.config.js`, `game/readme.md`, `CLAUDE.md` (push after commit).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Domain (`game/src/domain`) | unit | All branches; 1:1 to spec ACs; exact numbers of the Skill Mechanics table; every listed edge case | `game/src/domain/**/*.test.js` | `npm test` (in `game/`) |
| Phaser views (`adapters/phaser/views`) | unit | Rendered state and texts of the spec | `game/src/adapters/phaser/views/*.test.js` | `npm test` |
| Scene (`adapters/phaser/ClickerGame.js`, `HeroUi.js`) | unit | Every scene-level AC (use guards, keys, pause, kill path) | `game/src/adapters/phaser/*.test.js` | `npm test` |
| e2e | e2e | Skill by key, damage, cooldown text, effect tag | `game/e2e/*.spec.js` | `npm run test:e2e` |
| CSS | none | build gate only | - | build gate only |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd game && npm test` |
| Full | After tasks with e2e tests | `cd game && npm test && npm run test:e2e` |
| Build | After phase completion | `cd game && npm test && npm run build && npm run test:e2e` |

---

## Execution Plan

### Phase 1: Skill domain

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 2: Views and integration

```
T9 → T10 → T11 → T12 → T13
```

---

## Task Breakdown

### T1: Skill catalog

**What**: The Skill Mechanics table as data with `skillOf(heroId, slot)`.
**Where**: `game/src/domain/skills/skillCatalog.js`
**Depends on**: None
**Reuses**: `PHYSICAL`, `MAGICAL` from `game/src/domain/combat/damage.js`
**Requirement**: SKILL-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] 15 definitions with the table's percents, damage types, durations and cooldowns
- [x] A test pins every cooldown to the seconds in `HeroSeed.kt`
- [x] `skillOf` returns null for an unknown hero or slot
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add the skill catalog of the five heroes`

---

### T2: Forced critical in the damage formula

**What**: `calculateDamage` accepts `forceCritical`, which crits regardless of roll and crit resistance.
**Where**: `game/src/domain/combat/damage.js`
**Depends on**: T1
**Reuses**: existing `calculateDamage`
**Requirement**: SKILL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] With `forceCritical` a defender with crit resistance 100 still takes the critical multiplier
- [x] Without it, behavior and existing tests are unchanged
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): let a hit force a critical`

---

### T3: Countdown extension

**What**: `BossCountdown.extend(ms)` adds time left, beyond the starting limit.
**Where**: `game/src/domain/campaign/bossCountdown.js`
**Depends on**: T2
**Reuses**: existing `BossCountdown`
**Requirement**: SKILL-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `extend(4000)` raises `remainingMs` by 4000 and repeated calls add each time
- [x] Extending an already expired countdown makes it live again (`expired` false); the test pins this
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): let a boss countdown gain time`

---

### T4: Skill damage rules

**What**: `hitDamage`, `tickDamage` and `clickDamage` apply the buffs and debuffs to the click formula.
**Where**: `game/src/domain/skills/skillDamage.js`
**Depends on**: T3
**Reuses**: `calculateDamage`
**Requirement**: SKILL-02, SKILL-04, SKILL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Corte Dimensional on Base 1 vs physical defense 50, no crit, deals 9.75 (SKILL-02 AC 6)
- [x] Luz Divina deals x1.5 to DARKNESS only
- [x] Ventos + Bênção on a click deal 2.275 (P2 AC 3); the click bonus does not apply to skill hits
- [x] Brado lowers physical defense by 30, floor 0; Prisão multiplies MAGICAL by 1.25; Fumaça adds 15 crit capped at 100
- [x] Ticks never crit
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): compute skill damage under buffs and debuffs`

---

### T5: Skill combat - use, instant hits and cooldowns

**What**: `SkillCombat.use`, `click`, `slotState` and cooldown `advance` for the instant-hit skills.
**Where**: `game/src/domain/skills/skillCombat.js`
**Depends on**: T4
**Reuses**: `skillCatalog`, `skillDamage`, `Monster`
**Requirement**: SKILL-01, SKILL-02, SKILL-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Use applies the hits to the monster and starts the cooldown per (hero, slot)
- [x] Locked, cooling or no living monster: nothing changes
- [x] Flecha Dupla rolls twice and its second arrow does not land if the first kills
- [x] Cooldown state `ready`/`cooling` with seconds rounded up; survives a leader change
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add skill use, instant hits and cooldowns`

---

### T6: Skill combat - timed effects

**What**: Buffs on the player and debuffs on the monster with durations, restart without stacking, and `effects()`.
**Where**: `game/src/domain/skills/skillCombat.js` (modify)
**Depends on**: T5
**Reuses**: `skillDamage`
**Requirement**: SKILL-04, SKILL-05, SKILL-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Ventos 12 s, Bênção 15 s, Fumaça 10 s, Brado 10 s, Prisão 2 s run and end at their seconds
- [x] Reuse restarts duration without stacking
- [x] Buffs survive monster death and leader change; Brado and Prisão end with the monster
- [x] `effects()` lists tags in start order with seconds rounded up
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add timed skill effects`

---

### T7: Skill combat - damage over time

**What**: Tempestade Arcana, Bomba de Veneno (stacks to 3) and Golpe Sangrento bleed as ticks every whole second.
**Where**: `game/src/domain/skills/skillCombat.js` (modify)
**Depends on**: T6
**Reuses**: `tickDamage`
**Requirement**: SKILL-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tempestade lands 6 ticks of 200 %, first at 1 s
- [x] Poison adds a stack to 3, restarts 8 s, ticks 100 % per stack
- [x] Golpe Sangrento hits 600 % then 6 ticks of 150 %
- [x] A large `advance` delta lands every crossed tick; monster death ends the ticks
- [x] Base and element are fixed at the cast; defense is read at each tick
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add damage over time skills`

---

### T8: Skill combat - cast, control and countdown

**What**: Tiro Preciso cast, Stun/Root freezing and `countdownMs`, Carrilhão extension.
**Where**: `game/src/domain/skills/skillCombat.js` (modify)
**Depends on**: T7
**Reuses**: `BossCountdown` contract
**Requirement**: SKILL-07, SKILL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tiro Preciso state `casting` for 2 s, then a forced critical 3000 %; lost if the monster is gone, cooldown still running
- [x] Stun 3 s and Root 2 s freeze the countdown only on a boss; together they hold until the later ends
- [x] Carrilhão returns +4000 ms for a boss and nothing for a phase monster
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): add the aimed shot, boss control and the time shield`

---

### T9: Skill bar view

**What**: Clickable slots and `refreshSkillBar` with `data-state` and texts `<n>s`, `<left>s`, `Mirando`.
**Where**: `game/src/adapters/phaser/views/skillBar.js` (modify)
**Depends on**: None
**Reuses**: existing `renderSkillBar`
**Requirement**: SKILL-01, SKILL-03, SKILL-08

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Click on an unlocked slot calls `onUse(slot)`; a locked slot does not
- [x] States ready, cooling, casting render the exact texts
- [x] Existing skillBar tests still pass
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): make the skill slots usable and show cooldowns`

---

### T10: Effects row view

**What**: `renderEffectTags` for the running effects.
**Where**: `game/src/adapters/phaser/views/skillEffects.js`
**Depends on**: T9
**Reuses**: `el` from `views/dom.js`
**Requirement**: SKILL-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Tag text `Ventos Ligeiros 12s`; Poison `Bomba de Veneno x2 5s`
- [x] Order preserved; empty list renders nothing
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): render running skill effects`

---

### T11: Hero UI hooks for the skill bar

**What**: `HeroUi` passes slot clicks to a `useSkill(slot)` hook and keeps the slot states current through a `skillState(slot)` hook and `refreshSkills()`.
**Where**: `game/src/adapters/phaser/HeroUi.js` (modify)
**Depends on**: T10
**Reuses**: `updateSkillBar`, `renderSkillBar`, `refreshSkillBar`
**Requirement**: SKILL-01, SKILL-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Clicking an unlocked slot calls `useSkill(slot)`; a locked slot does not
- [x] `refreshSkills()` writes the states from `skillState` into the bar
- [x] A leader change shows the new leader's slots with the states from `skillState` at once
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): wire the skill bar to skill hooks`

---

### T12: Scene - use skills, keys, frame advance, kill path and effects row

**What**: `ClickerGame` owns a `SkillCombat`, extracts `afterDamage()`, uses skills by slot and keys 1-3, advances skills each unpaused frame and shows the effects row.
**Where**: `game/src/adapters/phaser/ClickerGame.js` (modify)
**Depends on**: T11
**Reuses**: `hitMonster` kill branch, `BossCountdown`, `renderEffectTags`
**Requirement**: SKILL-01, SKILL-02, SKILL-03, SKILL-06, SKILL-07

**Tools**:

- MCP: NONE
- Skill: Phaser skills (scenes, DOM)

**Done when**:

- [x] Guards of the Edge Cases (heroes not loaded, 0 stars, paused, hero screen open, no monster) tested
- [x] A skill kill pays coins and reports the outcome like a click kill; farm win too
- [x] Skills advance between bosses; the countdown advances only by `countdownMs`
- [x] Carrilhão extends the live countdown
- [x] The effects row shows the tags and slot and tag CSS is added in `game/public/style.css`
- [x] Gate check passes: `cd game && npm test && npm run build`

**Tests**: unit
**Gate**: build

**Commit**: `feat(game): use the leader skills in the fight`

---

### T13: e2e of a skill

**What**: Browser test that uses a skill by key against the fake backend.
**Where**: `game/e2e/skills.spec.js`
**Depends on**: T12
**Reuses**: `game/e2e/support/fakeBackend.js`, `game/e2e/support/game.js`
**Requirement**: SKILL-01, SKILL-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Kael with 1 star as leader: key 1 deals 15 on a phase monster and the slot shows a countdown from `20s`
- [ ] A second press does nothing
- [ ] Gate check passes: `cd game && npm test && npm run test:e2e`

**Tests**: e2e
**Gate**: full

**Commit**: `test(game): cover using a skill end to end`

---

## Phase Execution Map

```
Phase 1 → Phase 2

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4 ------→ T5 ------→ T6 ------→ T7 ------→ T8
Phase 2:  T9 ------→ T10 -----→ T11 -----→ T12 -----→ T13
```
