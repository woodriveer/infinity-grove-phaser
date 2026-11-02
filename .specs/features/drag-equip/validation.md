# Drag to Equip Validation

**Date**: 2026-11-02
**Spec**: `.specs/features/drag-equip/spec.md`
**Diff range**: `beb239b..92abd66` (game only, 6 production files; HEAD `8c90f6f` after it adds ui-review screenshots and no code)
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Validation: Drag to equip - FAIL ❌

**Result**: FAIL ❌ - DRG-15 contradicts its spec: the ghost sits 12 px up and left of the pointer (commit `92abd66`), while the spec and design say centred, and the spec was not amended. Resolving it is a product decision, not a code edit. Two more gaps: undocumented visual rules and missing e2e scenarios.

---

## Task Completion

| Task | Status     | Notes |
| ---- | ---------- | ----- |
| T1 drag helper | ✅ Done | `7272cdc` |
| T2 edge scroll | ✅ Done | `4e60a1c` |
| T3 renderEquipment wiring | ✅ Done | `00b0076` |
| T4 HeroUi.dropEquip | ✅ Done | `513b6e5` |
| T5 styles | ✅ Done | `5a199b8` |
| T6 e2e | ✅ Done | `5e7552f` |
| UI fixes (ui-artist findings, not in tasks.md) | ⚠️ Partial | `2891ad7`, `905270a`, `751beae`, `92abd66` changed DRG-15 and added visuals that spec.md and design.md do not define |

---

## Spec-Anchored Acceptance Criteria

Files: `U` = `game/src/adapters/phaser/views/dragEquip.test.js`, `V` = `game/src/adapters/phaser/views/equipmentView.test.js`, `H` = `game/src/adapters/phaser/HeroUi.test.js`, `E` = `game/e2e/dragEquip.spec.js`, `CSS` = `game/public/style.css`.

### P1: Drop a piece on a hero

| Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ------------------------- | -------------------- | ----------------------- | ------ |
| DRG-01 press and move 6 px | drag starts at 6 px, not at 5.66 px | `U:85` `expect(ghost()).not.toBeNull()`; `U:73-79` no drag below 6 px | ✅ |
| DRG-02 release on an owned hero who does not wear the piece | exactly one `POST /equipment/a1/equip` with `{ heroId }` | `E:101-103` `toHaveLength(1)`, `path` `/equipment/a1/equip`, `body` `toEqual({ heroId: 'lyra' })`; `H:1523` `calls toEqual([['a1','lyra']])` | ✅ |
| DRG-03 request succeeds | piece in `equip-slot-<hero>-<slot>`, no piece detail | `E:96` `aria-label` `Épico Amuleto +3`; `E:99` `piece-detail` count 0; `H:1524-1526` | ✅ |
| DRG-04 slot held another piece | that piece in the bag, `Mochila (n)` counts it | `E:112-114` `Incomum Anel +0`, `Mochila (4)`; `H:1535-1537` `Mochila (1)` | ✅ |
| DRG-05 piece worn by another hero | that hero's slot reads `vazio` | `E:126-127` `.piece-empty` `vazio`; `H:1545-1547` `vazio` | ✅ |
| DRG-06 hero is the leader | attribute panel shows the new numbers | `H:1554` `Dano de clique: 1.0`, `H:1558` `Dano de clique: 4.0`; no e2e | ✅ unit / ⚠️ no e2e |
| DRG-07 request fails | `Não foi possível concluir a ação.`, list as before | `E:271-273`; `H:1567-1570` | ✅ |
| DRG-08 request runs | every button disabled, no new drag | `V:569` busy screen starts no drag; `H:1594` every button disabled, `H:1598` equip called once; no e2e | ✅ unit / ⚠️ no e2e |

### P1: Cancel a drag

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-09 release outside every hero | no request, nothing moves | `U:201`, `U:209` `onDrop` not called (bag, outside page); `E:195`, `E:208`, `E:220` requests 0 | ✅ |
| DRG-10 release on the wearer | no request | `U:219` `onDrop` not called; `E:236` requests 0 | ✅ |
| DRG-11 `pointercancel` | drag ends, no request, copy removed | `U:227-228` `onDrop` not called, ghost null; no e2e | ✅ unit / ⚠️ no e2e |
| DRG-12 drag ends | copy and highlights removed, source back to normal | `U:237-240`; `E:166-167` ghost count 0, no `is-dragging` | ✅ |
| DRG-13 drag ends | click after release does not open the piece | `U:248` `onClick` not called after drag, `U:253` next click opens; sensor M3 killed; no e2e that the swallow changes | ✅ unit / ⚠️ no e2e |
| DRG-14 release under 6 px | a click, the piece opens | `U:263` `onClick` once, `onDrop` not called; `E:252` `Na mochila` | ✅ |

### P1: See what is being dragged

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-15 drag runs | copy `piece-drag-ghost` **centred on the pointer**, moves with every move | `U:95-96` `left` `150px`, `top` `220px` (the pointer, not the centre); `U:97-99` classes and aria. Centre not met: `CSS:2225-2226` `transform-origin: 100% 100%; transform: translate(calc(-100% - 12px), calc(-100% - 12px))`; `E:181-183` asserts the corner 12 px up-left of the pointer, the spec says centred. Sensor M5 (centred transform) is killed by `E:182` (42.9 px off) | ❌ GAP (spec contradiction) |
| DRG-16 drag runs | source tile carries `is-dragging` | `U:87` `classList.contains('is-dragging')`; `E:140` `toHaveClass(/is-dragging/)` | ✅ (class). D6's 40 % opacity is asserted nowhere: ⚠️ |
| DRG-17 pointer over a valid hero | block `is-drop-target`, its slot of the piece's kind `is-drop-slot` | `U:124-125`; `E:141-142` | ✅ |
| DRG-18 one target only | no other block or slot lit | `U:136-139`, `U:148-149`; `E:151-152`, `E:160-161` | ✅ |
| DRG-19 pointer over the wearer | wearer's block not lit | `U:184` `kael` no `is-drop-target`; `E:231` `not.toHaveClass` | ✅ |
| DRG-20 drag runs | no piece tooltip | no unit test; `E:145`, `E:162` `.piece-tooltip:visible` count 0; sensor M6 (CSS rule removed) killed by those assertions | ✅ e2e only |

### P1: Touch, pen and the existing controls

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-21 touch and pen | same rules and numbers as the mouse | `U:311-319` touch, `U:328` pen; `E:314-323` real touch sequence via CDP | ✅ |
| DRG-22 draggable tile | `touch-action: none` (empty slot `auto`) | `E:259-261` `toHaveCSS('touch-action', 'none' / 'auto')`; no unit test | ✅ e2e only |
| DRG-23 `Equipar em` | still equips from the detail | `E:284` `Equipado em Lyra Folhaveloz`, `E:285-286` one request `{ heroId: 'lyra' }`; `H:1652-1653` | ✅ |
| DRG-24 selection mode on | no drag, click toggles | `E:297` ghost count 0, `E:302` requests 0, `E:303` and `E:307` `aria-pressed`; `V:550` no tile draggable | ✅ |
| DRG-25 second pointer | ignored while a drag runs | `U:272` one ghost, `U:276` `onDrop` not called, `U:280-281` drop once to `lyra`; no e2e | ✅ unit / ⚠️ no e2e |
| DRG-26 right or middle button | no drag | `U:296` ghost null; no e2e | ✅ unit / ⚠️ no e2e |

### P2: Scroll the window while dragging

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-27 pointer 40 px or less from the top | window scrolls up 8 px per 16 ms | `U:371` `192`, `U:375` `168`; boundary `U:388-401` (40 scrolls, 41 does not); `E:350-375` scroll to 0, drop on Kael | ✅ |
| DRG-28 pointer 40 px or less from the bottom | window scrolls down | `U:385` `216`; boundary `U:403-416` (40 scrolls, 41 does not); no e2e | ✅ unit / ⚠️ no e2e |
| DRG-29 pointer leaves the band or drag ends | scrolling stops | `U:442` `192`, `U:457` `192`; `E:391` below start, `E:399` stable for 300 ms | ✅ |
| DRG-30 window scrolls under a still pointer | highlight moves to the block now under the pointer | `U:486`, `U:491-492`; no e2e | ✅ unit / ⚠️ no e2e |

**Status**: 29 of 30 criteria match the spec outcome; DRG-15 is contradicted (❌ GAP). 28 of 30 have a unit test (DRG-20 and DRG-22 are e2e only). 22 of 30 have an e2e scenario; DRG-06, DRG-08, DRG-11, DRG-13, DRG-25, DRG-26, DRG-28, DRG-30 have none.

### Edge cases

- [x] Window closed before the equip answer: draws nothing. `H:1606-1617`.
- [x] Screen redrawn during a drag: the release resolves the block under the pointer. `H:1620-1631`.
- [x] Released over an empty slot: equips, bag holds one less. `E:94-99` (`Mochila (3)`); `H:1523-1527`.
- [x] Source tile disabled (busy or selection): no drag. `U:299-304`; `V:569`.
- [x] Only one owned hero: a bag piece drops on it; a worn piece on it finds no target. `H:1634-1642`.

---

## Discrimination Sensor

Scratch: two temporary git worktrees at `92abd66` and `beb239b` (node_modules by junction, removed after the run). Each mutation touched only the scratch copy; the real tree's `git status --porcelain` matched the baseline before and after (37 entries, unchanged). The e2e mutants ran on port 5199 in the scratch copy, because a dev server of the main checkout already listened on 5174 and would have served the unmutated CSS (a first attempt on 5174 was discarded for that reason).

| Mutation | File:line | Description | Test that decides | Killed? |
| -------- | --------- | ----------- | ----------------- | ------- |
| M1 | `game/src/adapters/phaser/views/dragEquip.js:175` | threshold `<` → `<=` (DRG-01) | `U` 'a move of 6 px starts the drag' and the touch and pen drags (3 failed) | ✅ Killed |
| M2 | `game/src/adapters/phaser/views/dragEquip.js:19` | wearer exclusion removed (DRG-10, DRG-19) | `U` 'does not light the hero who wears the piece', 'a release on the wearer drops nothing', 'dimmed over the wearer' (3 failed) | ✅ Killed |
| M3 | `game/src/adapters/phaser/views/dragEquip.js:161` | `swallowNextClick()` removed (DRG-13) | `U` 'the click after a drag does nothing' (1 failed) | ✅ Killed |
| M4 | `game/src/adapters/phaser/views/dragEquip.js:87` | top edge `<=` → `<` (DRG-27) | `U` '40 px from the top scrolls and 41 px does not' (1 failed) | ✅ Killed |
| M5 | `game/public/style.css:2225-2226` | ghost centred, `translate(-50%, -50%)` and origin 50 % (the spec's wording, DRG-15) | `E` 'the ghost follows the pointer, up and left of it' at `E:182`: 42.9 px off | ✅ Killed. The suite rejects the spec-defined placement |
| M6 | `game/public/style.css:2255-2257` | `body.piece-dragging .piece-tooltip { display: none }` removed (DRG-20) | `E` 'shows the dragged piece and lights the hero under the pointer' (`.piece-tooltip:visible` count) | ✅ Killed |
| M7 | `game/src/adapters/phaser/HeroUi.js:439` | `if (this.equipBusy)` → `if (false)` (DRG-08 guard) | `H` file: 113 tests still pass | ❌ Survived → fix task. The disabled tiles stop a second drag first, so the guard is not pinned by any test |

**Sensor depth**: lightweight (7 targeted mutations; drag behaviour is not P0).
**Result**: 6/7 killed (M1 to M6); M7 survived.

---

## Interactive UAT Results (if performed)

Not performed by the Verifier. The `ui-artist` reviewed the screens (`.specs/features/drag-equip/ui-review.html`, commit `8c90f6f` re-review). That review approved the ghost offset and the fades, which is why they are still open against the spec.

---

## Gate Check

- **Gate commands**: `cd game && npx vitest run --coverage`; `cd game && npm run build`; `cd game && npm run test:e2e`
- **Unit result**: 70 files, 1464 passed, 0 failed (exit 0)
- **Unit coverage** (v8, whole game): lines 96.64 % (2503/2590), branches 94.63 % (1130/1194), statements 96.55 %. Changed files: `dragEquip.js` lines 100 %, branches 97.82 %; `equipmentView.js` lines 100 %, branches 100 %; `HeroUi.js` lines 94.94 %, branches 82.03 %
- **Build result**: `npm run build` exit 0 (a chunk-size warning, pre-existing and not an error)
- **E2E result**: 166 passed, 2 skipped, 0 failed (exit 0, 17.6 min). The 2 skips are `test.fixme` in `game/e2e/heroAscension.spec.js:83` and `:92`, outside this feature. The 19 `dragEquip.spec.js` scenarios all passed
- **Test count before feature** (`beb239b`): unit 69 files, 1409 passed; e2e 149 listed
- **Test count after feature** (`92abd66`): unit 70 files, 1464 passed (**+55**: `dragEquip.test.js` 38, `HeroUi.test.js` 11, `equipmentView.test.js` 6); e2e 168 listed (**+19**)
- **Test integrity**: no test removed. The only changed lines of existing test files are the `vitest` import lines (`HeroUi.test.js:1`, `equipmentView.test.js:1`). No existing e2e file changed
- **Skipped tests**: 2 `test.fixme` in `heroAscension.spec.js`, pre-existing, not this feature
- **Failures**: none. The first unit run reported worker start-up errors under load (3 Playwright workers were running); it was repeated alone and passed

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ⚠️ `905270a`, `2891ad7` and `751beae` added a ghost fade, a panel-scale variable and a slot opacity not asked for |
| Surgical changes | ✅ six production files under `game/`; no backend file |
| No scope creep | ❌ the offset (`92abd66`) and the fade, scale and opacity rules are in neither `spec.md` nor `design.md` |
| Matches patterns | ✅ Allman braces, 4-space indent; `HeroUi.dropEquip` follows the `transferSet` shape |
| Spec-anchored outcome check | ❌ `E:181-183` asserts a position the spec does not define |
| Per-layer coverage expectation | ⚠️ 28/30 unit, 22/30 e2e |
| Every test maps to a spec requirement | ❌ unclaimed: `U:111-118` (ghost scale), `U:152-176` (ghost fade), `E:143`, `E:153`, `E:159` (opacity values) |
| Documented guidelines (`CLAUDE.md`: unit and e2e per player-visible behaviour) | ⚠️ 8 visible criteria without an e2e scenario |

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | --------------- | ---------- |
| DRG-01 to DRG-14 | Implementing | Done |
| DRG-15 | Implementing | ❌ Needs Fix |
| DRG-16 to DRG-30 | Implementing | Done |

Done with a gap noted above: DRG-06, DRG-08, DRG-11, DRG-13, DRG-25, DRG-26, DRG-28, DRG-30 have unit tests but no e2e; DRG-16 has no test of the 40 % opacity.

---

## Ranked Gaps (route to fix tasks; product decision first)

1. **DRG-15 contradicts the spec (blocker)**. Commit `92abd66` moved the ghost to a corner offset and rewrote `E:181-183` to the new position; `spec.md` (DRG-15 at line 102, D6 at line 41) and `design.md` (Visual Design) still say centred. The product owner decides: (a) accept the offset: amend DRG-15, D6 and the design, keep `E:181-183`; or (b) keep the spec: restore `translate(-50%, -50%)` at `CSS:2225-2226` and restore `E:181-183` to "within 2 px of the pointer". Either way the assertion must match the decided wording.
2. **Undocumented visual rules (major)**. A fade to 0.6 when no hero is under the pointer (`dragEquip.js:46`, `:131`; `CSS:2232-2233`; `E:159`), a ghost scaled to the panel (`dragEquip.js:41`, `:47`; `CSS:2226`; `U:111-118`), and a full-opacity slot outline on empty slots (`CSS:2243-2245`; `E:143`). None is in `spec.md` or `design.md`; `U:152-176` and `E:153` pin the fade. Product owner: accept into D6 or revert.
3. **e2e gaps (major)**. No e2e for DRG-06 (leader panel), DRG-08 (busy), DRG-11 (`pointercancel`), DRG-28 (scroll down), DRG-30 (highlight under scroll). DRG-13 has no e2e that would fail without the click swallow (`E:94` checks a drop onto another block, where the click never lands on the piece). DRG-25 and DRG-26 are unit only.
4. **D6 40 % opacity unasserted (minor)**. Nothing asserts `.is-dragging` opacity 0.4 (`CSS:2214-2216`); add `toHaveCSS('opacity', '0.4')` to the drag e2e.
5. **Sensor survivor M7 (minor)**. `HeroUi.js:439` guard not pinned. A unit test that calls `ui.dropEquip` while `equipBusy` is set would kill it.
6. **Edge band outside the window (minor, spec-precision)**. `dragEquip.js:87` and `:92` also scroll when the pointer is above or below the window itself. DRG-27 and DRG-28 say "40 px or less below the top edge" and "above the bottom edge"; the spec does not say what happens outside the window. Decide in the spec.
7. **DRG-20 and DRG-22 have no unit test (note)**. Both are CSS only and pinned by e2e (M6 proves DRG-20). No action unless the spec adds a unit-level rule.

---

## Lessons

Recorded after this report (see the lessons commit). The four grounded signals: `ac_gap` for DRG-15, `surviving_mutant` for M7, `spec_precision_gap` for the undefined visual values, and `ac_gap` for the e2e gaps.

---

## Summary

**Overall**: ❌ Not Ready. The feature is not done until the product owner resolves DRG-15.

**Spec-anchored check**: 29/30 ACs matched the spec outcome; 1 contradicted (DRG-15); 28/30 with unit tests; 22/30 with e2e.
**Sensor**: 6/7 mutations killed (M7 survived).
**Gate**: unit 1464 passed, 0 failed; build exit 0; e2e 166 passed, 2 skipped (pre-existing `test.fixme`), 0 failed.

**What works**: the drop, the request and its body, the list after a drop, the replaced and moved pieces, the leader panel, the error line and its list, the busy state, all cancel paths, the 6 px threshold, the click swallow, touch and pen with `touch-action`, `Equipar em`, selection mode, and edge scroll up and down. The backend is untouched.

**Issues found**: the gaps above, ranked. Item 1 is the blocker.

**Next steps**: the orchestrator asks the product owner to decide DRG-15 (item 1) and the visual rules (item 2). Then fix tasks for items 3 to 6. Re-verify after the fixes (round 1 of 3).
