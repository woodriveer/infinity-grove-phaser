# Equipment UI Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/equipment-ui/spec.md`
**Status**: In progress

The design is inline (no `design.md`): game only, ADR 0007 (`domain` / `application` / `adapters`); the screen is plain DOM tested in jsdom like the other hero screens. The tiles replace the text rows of the Equipamento screen, so the tests that pinned those rows (`equipmentView.test.js`) follow the spec (tiles with an icon, tooltip with the title); the test ids `equip-piece-<id>`, `equip-slot-<hero>-<slot>`, `equipment-list`, `equipment-bag` and `piece-*` stay.

---

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Game domain and application | unit | All branches; exact numbers and lines of the spec | `game/src/domain/**/*.test.js`, `game/src/application/**/*.test.js` | `cd game && npm test` |
| Game views and `HeroUi` | unit (jsdom) | Rendered texts, classes, attributes, events of the spec | `game/src/adapters/phaser/**/*.test.js` | `cd game && npm test` |
| CSS (rarity frames) | none | build gate; the frame classes and attributes are asserted in the views | - | `cd game && npm run build` |
| e2e | e2e | Panel numbers, hover tooltip, click detail, transfer | `game/e2e/*.spec.js` | `cd game && npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd game && npm test` |
| Full | After tasks with e2e tests | `cd game && npm test && npm run test:e2e` |
| Build | After phase completion | `cd game && npm test && npm run build && npm run test:e2e` |

---

## Execution Plan

### Phase 1: Equipamento screen

```
T1 → T2 → T3 → T4 → T5 → T6
```

---

## Task Breakdown

### T1: Leader attribute lines

**What**: The pure function that turns the leader, its pieces and the talents into the lines of the panel.
**Where**: `game/src/domain/equipment/leaderStats.js`
**Depends on**: None
**Reuses**: `leaderAttacker`, `bossTimeBonusMs`, `talentValue`, `ELEMENT_LABELS`
**Requirement**: EQU-01

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Kael with 0 stars, no equipment and no talents reads `1.0`, `10%`, `x2`, `0%`, `0%`, `0s`, `0s`
- [x] Lyra with 3 stars reads `1.4`, `40%`, `x2.5`
- [x] A weapon of 3.3 and a ring of +12 % read `4.8`; `BOSS_TIME_SECONDS` 5 and `MINIBOSS_TIME` 2 read `9s` and `5s`
- [x] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): compute the attribute lines of the leader`

---

### T2: Attribute panel

**What**: The panel `leader-stats` in the Equipamento screen, built from the lines and rebuilt on every render.
**Where**: `game/src/adapters/phaser/views/equipmentView.js`, `game/src/adapters/phaser/HeroUi.js`, `game/public/style.css`
**Depends on**: T1
**Reuses**: `renderEquipment`, the `HeroUi` equipment render
**Requirement**: EQU-01, EQU-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The panel is titled `Atributos de <nome>` and shows the lines of the spec in order
- [ ] It follows an equip, a removal, a refine and a leader change, and is absent without a leader
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): show the attributes of the leader in the Equipamento screen`

---

### T3: Piece tile with rarity frame

**What**: The tile of a piece: slot icon with a drawn fallback, refine badge, rarity class, gems, the Epic fantasy effect and the reduced-motion rule.
**Where**: `game/src/adapters/phaser/views/pieceTile.js`, `game/public/style.css`
**Depends on**: T2
**Reuses**: `iconWithFallback`, `RARITY_LABELS`
**Requirement**: EQU-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Each rarity carries its class, `data-rarity`, `data-gems` (0 to 4); only EPIC carries `data-effect="fantasy"`
- [ ] The refine shows as `+<n>` above 0; a missing icon file is replaced by a drawn mark and the tile stays clickable
- [ ] The CSS gives the five frames different shapes and stills the animations under `prefers-reduced-motion`
- [ ] Gate check passes: `cd game && npm test && npm run build`

**Tests**: unit
**Gate**: build

**Commit**: `feat(game): draw a piece as a tile with a frame per rarity`

---

### T4: Icon bag, worn slots and tooltip

**What**: The bag as a grid of tiles and the worn slots as tiles, both with the hover tooltip and the click to the detail.
**Where**: `game/src/adapters/phaser/views/equipmentView.js`, `game/src/adapters/phaser/views/pieceTile.js`, `game/public/style.css`
**Depends on**: T3
**Reuses**: `renderPieceDetail`, `pieceTitle`
**Requirement**: EQU-03, EQU-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Hover shows the title, the weapon line, one line per affix and `Equipado em <nome>` or `Na mochila`, with no button; leaving hides it
- [ ] A click opens the piece detail with its actions; an empty slot is a dashed tile `vazio` without a click
- [ ] The bag title reads `Mochila (<n>)` and the empty text is unchanged
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): show the bag as icon tiles with a tooltip`

---

### T5: Transfer a set

**What**: Move every worn piece of a hero to another hero, in slot order, reloading from the server on a failure.
**Where**: `game/src/application/equipment/equipmentCollection.js`
**Depends on**: T4
**Reuses**: the `equip` gateway call
**Requirement**: EQU-05, EQU-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `transferSet(from, to)` equips the worn pieces on the target in the order Arma, Armadura, Anel, Amuleto
- [ ] A failed request stops the rest, reloads the list and rejects
- [ ] Gate check passes: `cd game && npm test`

**Tests**: unit
**Gate**: quick

**Commit**: `feat(game): transfer the set of a hero to another hero`

---

### T6: Transfer flow and e2e

**What**: The `Transferir conjunto` button, the target choice, the notice, the busy state and the e2e of the whole screen.
**Where**: `game/src/adapters/phaser/views/equipmentView.js`, `game/src/adapters/phaser/HeroUi.js`, `game/e2e/equipmentUi.spec.js`
**Depends on**: T5
**Reuses**: `HeroUi.act`
**Requirement**: EQU-05, EQU-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] The button shows only for a hero with a worn piece when another hero is owned; the targets are `Para <nome>`
- [ ] After the transfer the pieces are under the target, the source is `vazio`, the displaced pieces are in the bag and `Conjunto transferido para <nome>` shows
- [ ] A failure shows `Não foi possível concluir a ação.`; every equipment button is disabled while the transfer runs
- [ ] e2e: the panel numbers, the hover tooltip, the click detail and a transfer
- [ ] Gate check passes: `cd game && npm test && npm run build && npm run test:e2e`

**Tests**: unit, e2e
**Gate**: build

**Commit**: `feat(game): add the transfer of a set to the Equipamento screen`
