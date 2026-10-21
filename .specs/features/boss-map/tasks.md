# Boss Map Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/boss-map/spec.md`
**Status**: In progress

The design is inline (no `design.md`): game only, ADR 0007. The stop states are a pure domain rule (`domain/campaign/bossMap.js`); the map is plain DOM (`views/farmView.js`) tested in jsdom like the other hero screens. The rows of the old list become stops, so the tests that pinned the rows follow the spec (a stop shows its number and its accessible name); the test ids `farm-entry-*` (defeated stops) and `farm-empty` stay.

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Game domain and application | unit | All branches; the states of the two example positions of the spec | `game/src/domain/**/*.test.js`, `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game views and `HeroUi` | unit (jsdom) | Rendered states, texts, positions, events of the spec | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| CSS (map, fog, trail) | none | build gate; the states and the fallback are asserted in the views | - | `cd game && npm run build` |
| e2e | e2e | Open the map, read the states, click a beaten stop | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd game && npm test` |
| Full | After tasks with e2e tests | `cd game && npm test && npm run test:e2e` |
| Build | After phase completion | `cd game && npm test && npm run build && npm run test:e2e` |

---

## Execution Plan

### Phase 1: Chapter map

```
T1 → T2 → T3
```

---

## Task Breakdown

### T1: Stop states

**What**: The pure rule that gives each stop of the chapter its state from the beaten bosses and the campaign position.
**Where**: `game/src/domain/campaign/bossMap.js`, `game/src/application/campaign/campaignSession.js`
**Depends on**: None
**Reuses**: `Campaign`, `CHAPTER_BOSS`, `MINIBOSS`
**Requirement**: MAP-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] At stage 4 with minibosses 1 to 3 beaten: stops 1 to 3 `defeated`, stop 4 `current`, stops 5 to 10 and the chapter boss `locked`
- [x] At the chapter boss with the 10 minibosses beaten: stops 1 to 10 `defeated`, the chapter boss `current`
- [x] At stage 1 with nothing beaten: stop 1 `current`, all others `locked`; completed campaign: the chapter boss `defeated` and nothing `current`
- [x] The session answers the position (chapter, stage, kind, stage count, completed)
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): give each stop of the chapter its state`

---

### T2: The map

**What**: The farm screen as a map: 11 stops at the table positions, the title, the states, the farm click, the wins text, the empty text, the fallback trail and the stages without a position.
**Where**: `game/src/adapters/phaser/views/farmView.js`, `game/src/adapters/phaser/views/mapLayout.js`, `game/src/adapters/phaser/HeroUi.js`, `game/public/style.css`
**Depends on**: T1
**Reuses**: `renderFarm`, `bossLabel`, `HeroUi.render_farm`
**Requirement**: MAP-01, MAP-02, MAP-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The map is titled `Caminho do Capítulo <n>` and shows 10 numbered stops and `Chefe` in path order, each with `data-state` and an accessible name
- [ ] Only a defeated stop is a button, with the old test ids, and it starts the farm exactly as the row did; the chapter boss shows its wins and is disabled at 0
- [ ] With no boss beaten the map shows with `Nenhum chefe derrotado ainda.`; opening it pauses the fight
- [ ] The image `assets/ui/boss-map.jpg` is the background; while it fails the gradient and the dashed trail show, and with it no trail
- [ ] A stage without a table position is a plain button below the map
- [ ] Gate check passes: `cd game && npm test && npm run build`

**Tests**: unit
**Gate**: build

**Commit**: `feat(game): show the farm screen as a map of the chapter`

---

### T3: e2e and the prompt check

**What**: The e2e of the map and the check that the Gemini prompt carries the 11 positions of the layout table.
**Where**: `game/e2e/bossMap.spec.js`, `game/e2e/farm.spec.js`, `game/src/mapPrompt.test.js`
**Depends on**: T2
**Reuses**: the fake backend progress and farm state
**Requirement**: MAP-02, MAP-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] e2e: at stage 4 with 3 minibosses beaten the states read 3 defeated, 1 current and the rest locked, and a click on stop 2 starts the farm
- [ ] The existing farm e2e follow the map
- [ ] A test reads `PROMPTS_ASSETS_UI.md` and finds `boss-map.jpg` and the 11 positions of the layout table
- [ ] Gate check passes: `cd game && npm test && npm run build && npm run test:e2e`

**Tests**: unit, e2e
**Gate**: build

**Commit**: `test(game): cover the chapter map end to end`
