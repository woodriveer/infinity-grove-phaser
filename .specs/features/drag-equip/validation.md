# Drag to Equip Validation

**Date**: 2026-11-02
**Spec**: `.specs/features/drag-equip/spec.md` (amended in `9f889ad`)
**Diff range**: `beb239b..3e832bd` (game only; 0 files under `backend/`; HEAD `3e832bd`). Round 3 range: `fb37408..3e832bd` (3 commits: `ed11497`, `d2d9bf3`, `3e832bd`; tests only, no production line changed)
**Verifier**: independent sub-agent, round 3 (fresh instance; did not author the feature or its tests)
**Rounds**: 3 of 3 used. Round 1 FAIL at `823f22f`; round 2 FAIL at `fb37408`. The bound of the fix-to-re-verify loop is reached: this verdict escalates to the user.

---

## Validation: Drag to equip - FAIL ❌ (round 3, escalated to the user)

**Result**: FAIL ❌. The three round 2 gaps are closed: the edge-band re-entry (S9), the second primary pointer (S1) and the block under the pointer in the e2e (DRG-30). The round 3 sensor finds two new test gaps that the suite does not close: the lit slot is pinned for amulets only (DRG-17, mutant F6, surviving unit and e2e), and a drop answer that outlives a close followed by a reopen is not pinned (edge case, mutant F8b). Both are test-only gaps; the production code is not changed by this round.

---

## Round History

| Round | Commit | Verdict | Gaps |
| ----- | ------ | ------- | ---- |
| 1 | `823f22f` | FAIL ❌ | DRG-15 contradicted the spec; visual rules undocumented; 8 criteria without e2e; D6 opacity unasserted; sensor survivor M7; edge band beyond the window undefined |
| 2 | `fb37408` | FAIL ❌ | Sensor survivors S1 (DRG-25) and S9 (DRG-27 to DRG-29); DRG-30 e2e assertion weaker than its unit test |
| 3 | `3e832bd` (this report) | FAIL ❌ | Round 2 gaps closed. New: F6 (DRG-17, slot of the piece's kind pinned for amulets only); F8b (edge case: close, reopen, then the stale answer) |

---

## Task Completion

| Task | Status | Commit | Notes |
| ---- | ------ | ------ | ----- |
| T1 to T13 | ✅ Done | `7272cdc` to `fb37408` | Round 1 and round 2 verified in their reports |
| T14 edge band re-entry, unit | ✅ Done | `ed11497` | Kills S9 (2 failed) |
| T15 second primary pointer, unit | ✅ Done | `d2d9bf3` | Kills S1 (1 failed) |
| T16 still-pointer e2e assertion | ✅ Done | `3e832bd` | Kills the press-point mutant of the timer (1 failed in the e2e run) |

No fix task of round 3 exists yet: the gaps below are routed to the user, since this is the last round.

---

## Spec-Anchored Acceptance Criteria

Files: `U` = `game/src/adapters/phaser/views/dragEquip.test.js`; `V` = `game/src/adapters/phaser/views/equipmentView.test.js`; `H` = `game/src/adapters/phaser/HeroUi.test.js`; `E` = `game/e2e/dragEquip.spec.js`; `CSS` = `game/public/style.css`; `D` = `game/src/adapters/phaser/views/dragEquip.js`. Line numbers are those of `3e832bd`.

### P1: Drop a piece on a hero

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-01 press and move 6 px | drag starts at 6 px; a shorter press does not | `U:73-79` `expect(ghost()).toBeNull()` at 5.66 px; `U:81-89` `expect(ghost()).not.toBeNull()` at 6 px | ✅ |
| DRG-02 one request to an owned hero who does not wear the piece | exactly one `POST /equipment/a1/equip`, body `{ heroId: 'lyra' }` | `E:101-103` `toHaveLength(1)`, `path`, `body` `toEqual({ heroId: 'lyra' })`; `H:1523` `equip.mock.calls` `toEqual([['a1','lyra']])` | ✅ |
| DRG-03 request succeeds | piece in `equip-slot-lyra-AMULET`, no piece detail | `E:96` aria-label `Épico Amuleto +3`; `E:99` `piece-detail` count 0; `H:1524-1525` | ✅ |
| DRG-04 slot held another piece | that piece in the bag, `Mochila (n)` counts it | `E:112-114`; `H:1530-1537` `Mochila (1)` | ✅ |
| DRG-05 piece worn by another hero | that hero's slot reads `vazio` | `E:126-127` `.piece-empty` `vazio`; `H:1540-1548` | ✅ |
| DRG-06 hero is the leader | attribute panel shows the new numbers | `H:1550-1559` `stat-clickDamage` `1.0` to `4.0`; `E:331-347` `4.6` to `1.1` to `4.6` | ✅ |
| DRG-07 request fails | error line `Não foi possível concluir a ação.`, list as before | `E:285-296` `.hero-error` `toHaveText`, `a1` visible, `lyra` slot `vazio`; `H:1561-1571` | ✅ |
| DRG-08 request runs | every button disabled, no new drag | `E:363-368` `equip-piece-c1` disabled, `.hero-body button:enabled` count 0; `H:1587-1605`; `H:1607-1626` second `dropEquip` sends nothing | ✅ |

### P1: Cancel a drag

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-09 release outside every hero | no request, nothing moves | `U:196-210` `onDrop` not called; `E:208-219` requests 0, `Mochila (4)`; `E:221-243` | ✅ |
| DRG-10 release on the wearer | no request | `U:212-220` `onDrop` not called; `E:245-259` requests 0 | ✅ |
| DRG-11 `pointercancel` | drag ends, no request | `U:222-230` `onDrop` not called, `ghost()` null; `E:382-411` ghost count 0 (`:400`), requests 0 (`:408`); the event is synthetic (`:396-398`), accepted in round 2 | ✅ |
| DRG-12 drag ends | copy and highlights removed | `U:232-241`; `E:167-168` | ✅ |
| DRG-13 click after release | the piece does not open | `U:243-254` `onClick` not called; `E:413-437` `piece-detail` count 0 (`:430`) | ✅ |
| DRG-14 release under 6 px | a click; the piece opens | `U:256-264` `onClick` once, `onDrop` not called; `E:261-274` `Na mochila` | ✅ |

### P1: See what is being dragged

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-15 drag runs | copy's bottom-right corner 12 px left of and above the pointer (±2 px), moves with each move | `E:180-184` `Math.abs(box.x + box.width - 628) <= 2`, `Math.abs(box.y + box.height - 348) <= 2`; `U:91-102` `left` `150px`, `top` `220px`; `U:104-109` the hero under the pointer is judged at the pointer; `CSS:2226` offset | ✅ |
| DRG-16 drag runs | source tile `is-dragging`, opacity 0.4 | `U:81-89` `classList.contains('is-dragging')`; `E:140-141` class and `toHaveCSS('opacity', '0.4')` | ✅ |
| DRG-17 pointer over a valid hero | block `is-drop-target`, that hero's slot **of the piece's slot** `is-drop-slot` | `U:120-128` and `E:142-143` drag only an amulet (`AMULET` slot); `U:126` RING slot not lit. No test drags a piece of another slot kind. Sensor F6 (lit slot always `AMULET`) survives 44/44 unit and 28/28 e2e | ❌ GAP (gap 1) |
| DRG-18 one target only | no other block or slot lit | `U:130-140`, `U:142-150`; `E:152-153`, `E:161-162` | ✅ |
| DRG-19 pointer over the wearer | wearer's block not lit | `U:178-185`; `E:251` | ✅ |
| DRG-20 drag runs | no piece tooltip | no unit test (CSS only); `E:146`, `E:163` `.piece-tooltip:visible` count 0 | ✅ (e2e only, accepted) |
| DRG-31 drag runs | copy 1.1 times the tile's on-screen size (±1 px) | `U:111-118` `--ghost-scale` `0.4` at a 40 % panel; `E:189-206` width and height within 1 px of `tile.width * 1.1` (`:202-203`) | ✅ |
| DRG-32 no valid target under the pointer | copy opacity 0.6; 1 over a valid block | `U:152-176`; `E:154` opacity `1`, `E:160` `0.6` over the bag, `E:252` `0.6` over the wearer | ✅ |
| DRG-33 slot of the piece's kind | `is-drop-slot` at opacity 1, also on the empty `vazio` slot | `U:120-128` class; `E:143-144` `is-drop-slot` and opacity `1` on the empty `equip-slot-lyra-AMULET`. Pinned for the amulet kind; the opacity rule is the criterion, so it is ✅ here, and the kind is gap 1 | ✅ |

### P1: Touch, pen and the existing controls

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-21 touch and pen | same rules and numbers as the mouse | `U:325-339` touch (4 px no drag, 6 px drag, drop on lyra); `U:341-348` pen; `E:467-476` real touch sequence via CDP, one request; `E:478-488` finger over the bag | ✅ |
| DRG-22 draggable tile | `touch-action: none`; empty slot `auto` | `E:276-283` `toHaveCSS('touch-action','none')` and `'auto'`; `CSS:2207-2209`; no unit test (CSS only) | ✅ (e2e only, accepted) |
| DRG-23 `Equipar em` | still equips from the detail | `E:298-308` `Equipado em Lyra Folhaveloz`, one request `{ heroId: 'lyra' }`; `H:1667-1679` | ✅ |
| DRG-24 selection mode on | no drag, click toggles | `V:550-554` no tile draggable; `E:310-329` ghost count 0 (`:318`), requests 0 (`:323`), `aria-pressed` toggles | ✅ |
| DRG-25 second pointer | ignored while a drag runs | `U:266-282` second non-primary pointer: one ghost (`:272`), drop once to lyra (`:280-281`); `U:292-309` second primary pen pointer: one copy counted over the document (`:298`, `:303`), drop once to lyra (`:307-308`); `E:501-546` second finger: ghost count 1 (`:533`), one request (`:543-545`). Sensor S1 (`D:64` `active` guard removed) killed by `U:292-309` (1 failed) | ✅ (gap 2 of round 2 closed) |
| DRG-26 right or middle button | no drag | `U:311-316` `button: 2`, ghost null; `E:439-461` right and middle, no ghost (`:452`), no lit block (`:453`) | ✅ |

### P2: Scroll the window while dragging

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-27 pointer 40 px or less below the top edge, or above it | window scrolls up 8 px per 16 ms, any x | `U:383-395` `192`, `168`; `U:407-420` 40 px scrolls, 41 px does not; `U:437-445` above the window `192`; `U:457-470` any x; `U:549-576` after a leave and re-entry of the top band `before - 8`, `before - 24`, stop at the release. Sensor S9 (`D:105` `clearInterval` removed) killed by `U:549-576` (1 failed) | ✅ (gap 1 of round 2 closed) |
| DRG-28 pointer 40 px or less above the bottom edge, or below it | window scrolls down 8 px per 16 ms, any x | `U:397-405` `216`; `U:422-435` 40 px scrolls, 41 px does not; `U:447-455` below the window `208`; `U:578-605` leave and re-entry of the bottom band `before + 8`, `before + 24`, stop at the release (S9 killed, 1 failed); `E:604-632` scroll to the end and drop on the last hero | ✅ |
| DRG-29 pointer leaves the band, or drag ends | scrolling stops | `U:484-497` `192` stays after leaving; `U:499-512` `192` stays after the release; `U:549-576` and `U:578-605` stop after a re-entry; `E:577-602` stable for 300 ms | ✅ |
| DRG-30 window scrolls under a still pointer | the highlight is the block now under the pointer | `U:534-547` `kael` lit, `lyra` not; `E:634-664` lit hero equals the `data-drop-hero` under the pointer (`E:654-659` `expect(await litHero()).toBe(await underPointer())`). Mutant "timer lights the press point" (`D:114` `last` replaced by `press`) killed by `E:634` (1 failed, full e2e run on a scratch copy) | ✅ (gap 3 of round 2 closed) |

### Edge cases

- [x] Released over an empty slot: equips, bag holds one less. `E:90-104`; `H:1518-1527`.
- [x] Source tile disabled (busy or selection): no drag. `U:318-323`; `V:569`.
- [x] Only one owned hero: a bag piece drops on it; a worn piece finds no target. `H:1656-1665`.
- [x] Screen redrawn during a drag: the release resolves the block under the pointer. `H:1642-1654`.
- [x] Window closed before the answer: draws nothing. `H:1628-1640` (close, then the answer).
- [ ] Window closed, then reopened on Equipamento, before the answer: **NOT pinned**. Sensor F8b (the view guard `view === this.view` removed from the `finally` of `dropEquip`, `game/src/adapters/phaser/HeroUi.js:469`) survives 114/114 HeroUi tests; the stale answer would call `render_equipment()` inside the reopened window. Gap 2.
- [x] Another screen opens before the answer: draws nothing, by the same guard. Sensor F8 (the screen clause `this.screen === 'equipment'` removed, `HeroUi.js:469`) is an equivalent mutant: `show()` (`HeroUi.js:151`) and `close()` (`HeroUi.js:233`) are the only writers of `this.screen` (`:160`, `:235`) and each increments `this.view`, so `view === this.view` already implies that the window is still on Equipamento.

### Coverage of the criteria

- Unit: 31 of 33 criteria have a unit test; DRG-20 and DRG-22 are CSS only and are covered by e2e.
- E2E: 33 of 33 criteria have an e2e scenario.
- Criteria with an exact outcome checked by a test: 32 of 33 (DRG-17 is the exception, see gap 1).

---

## Round 2 Gaps Re-checked

| # | Round-2 gap | Status | Evidence |
| - | ----------- | ------ | -------- |
| 1 | S9: the edge band re-entry restarts the timer (DRG-27 to DRG-29) | ✅ Closed | `U:549-576`, `U:578-605`; S9 mutant (`dragEquip.js:105`) killed: 2 failed |
| 2 | S1: a second primary pointer starts a second drag (DRG-25) | ✅ Closed | `U:292-309`; S1 mutant (`dragEquip.js:64`) killed: 1 failed |
| 3 | DRG-30 e2e asserts a change, not the block under the pointer | ✅ Closed | `E:654-659`; the press-point mutant (`dragEquip.js:114`) killed by `E:634`: 1 failed, 3 passed |

---

## Discrimination Sensor

Scratch: a temporary git worktree at `3e832bd` (detached), `node_modules` by a junction. Each mutant touched only the scratch copy and was reverted by `git checkout` inside the worktree; no `git stash`. The worktree and its junction were removed afterwards (the link was removed first, the target kept). The real tree's `git status --porcelain` (70 entries) is identical before and after (`diff` empty).

| Mutation | File:line | Description | Test that decides | Killed? |
| -------- | --------- | ----------- | ----------------- | ------- |
| F1 | `game/src/adapters/phaser/views/dragEquip.js:19` | the hero who wears the piece becomes a valid target (`heroUnder`) | `U` 'the ghost is dimmed over the hero who wears the piece', 'does not light...', 'a release on the wearer drops nothing': 3 failed | ✅ Killed |
| F2 | `dragEquip.js:175` | drag threshold measured as Manhattan distance, not straight line | `U` 'a move of less than 6 px is no drag', 'a touch drag follows the same rules': 2 failed | ✅ Killed |
| F3 | `dragEquip.js:100` | steer restarts the timer on every pointer move | `U` 'keeps scrolling while the pointer moves inside the band': 1 failed | ✅ Killed |
| F4 | `dragEquip.js:191` | a release of another pointer ends the drag | `U` 'a second pointer is ignored', 'a second primary pointer...': 2 failed | ✅ Killed |
| F5 | `dragEquip.js:206-208` | pointercancel drops on the hero under the pointer | `U` 'a pointercancel ends the drag with no drop': 1 failed | ✅ Killed |
| F6 | `dragEquip.js:130` | the lit slot is always the AMULET slot, not the slot of the piece | `U` 44/44 pass; `E` (`dragEquip.spec.js`, 28 tests) 28/28 pass | ❌ Survived → gap 1 |
| F7 | `dragEquip.js:4` | drag threshold 7 px (spec: 6) | `U` 'marks the tile draggable', 'a move of 6 px starts the drag', touch and pen: 4 failed | ✅ Killed |
| F8 | `HeroUi.js:469` | the screen clause `this.screen === 'equipment'` removed in `dropEquip` finally | `H` 114/114 pass | ⚪ Equivalent (see the edge cases; the view guard implies the screen clause) |
| F8b | `HeroUi.js:469` | the view guard `view === this.view` removed in `dropEquip` finally (screen clause kept) | `H` 114/114 pass | ❌ Survived → gap 2 |
| F9 | `dragEquip.js:46` | the copy starts without the dimmed class `is-no-target` | `U` 'the ghost is dimmed over no hero and full over a valid one', 'dimmed over the hero who wears the piece': 2 failed | ✅ Killed |
| F10 | `dragEquip.js:137` | the copy is placed at the press point, not at the pointer | `U` 'the ghost is a copy of the tile at the pointer': 1 failed | ✅ Killed |
| F11 | `dragEquip.js:87` | the top band exclusive (39 px, not 40 px) | `U` '40 px from the top scrolls and 41 px does not': 1 failed | ✅ Killed |
| F12 | `game/src/adapters/phaser/views/equipmentView.js:130` | tiles draggable without `onDrop` (wiring gate removed) | `V` 'no tile is draggable without onDrop': 1 failed | ✅ Killed |
| S1 | `dragEquip.js:64` | round 2: the `active` guard of `pointerdown` removed | `U` 'a second primary pointer of another type starts no second drag': 1 failed | ✅ Killed |
| S9 | `dragEquip.js:105` | round 2: `clearInterval` of the old direction removed in `steer` | `U` both re-entry cases: 2 failed | ✅ Killed |
| T16 (e2e) | `dragEquip.js:114` | the timer lights the press point, not the last point | `E:634` 'the light follows the block that scrolls under a still pointer': 1 failed (3 passed) | ✅ Killed |
| F6 (e2e) | `dragEquip.js:130` | as F6 above, full `dragEquip.spec.js` | 28/28 pass | ❌ Survived (confirms gap 1) |

**Sensor depth**: targeted behaviour-level mutations, 15 unit mutants and 2 e2e mutants (default lightweight depth is 1 to 3; the drag feature has 33 criteria; this round adds 13 fresh mutants). Not P0.
**Result**: 12 of 15 unit mutants killed; 1 equivalent (F8); 2 survived (F6, F8b) → gaps 1 and 2. E2E: 1 of 2 killed (T16); F6 survived.
**Probes**: none needed. The surviving mutants were checked against the code: F8 by the `show()` / `close()` view increments (`HeroUi.js:151`, `:233`), F6 by grep: every `is-drop-slot` assertion in `game/src` and `game/e2e` uses an amulet piece (`U:125-126`, `U:137-139`, `U:148-149`, `U:240`; `E:143`, `E:162`).

**Judgement on the synthetic `pointercancel` (E:396-398)**: unchanged from round 2, accepted.

---

## Interactive UAT Results

Not performed by the Verifier. The `ui-artist` reviewed the screens (`.specs/features/drag-equip/ui-review.html`, re-review `8c90f6f`); the visual rules are in the spec (D6).

---

## Gate Check

- **Unit**: `cd game && npx vitest run` → 70 files, **1471 passed**, 0 failed (exit 0). Round 2 was 1468; round 3 added 3 (T14 two, T15 one). No test removed or weakened: `git diff fb37408..3e832bd -- game/src/**/*.test.js game/e2e/*.js` has only added lines.
- **Unit coverage** (`cd game && npm run test:coverage`, v8, `game/coverage/unit/coverage-summary.json`): whole game lines **96.67 %** (2504/2590), branches **94.72 %** (1131/1194).
  - `dragEquip.js`: lines 100 % (107/107), branches 97.82 % (45/46)
  - `HeroUi.js`: lines 95.28 % (283/297), branches 82.81 % (106/128)
  - `equipmentView.js`: lines 100 % (124/124), branches 100 % (67/67)
- **Build**: `cd game && npm run build` → exit 0 (chunk-size warning, pre-existing).
- **E2E, full suite**: `cd game && npm run test:e2e:coverage -- --config <alt config, port 5199>` → **175 passed**, **2 skipped** (`test.fixme` in `game/e2e/heroAscension.spec.js`, pre-existing), 0 failed, 18.9 min. `game/e2e/dragEquip.spec.js`: **28 of 28 passed**.
- **E2E coverage** (istanbul, `game/coverage/e2e/coverage-summary.json`): whole game lines **91.81 %** (2356/2566), branches **74.89 %** (710/948). A page reloaded inside a test loses its count, so this is a lower bound.
  - `dragEquip.js`: lines 98.13 % (105/107), branches 90.90 % (30/33)
  - `HeroUi.js`: lines 92.25 % (274/297), branches 72.52 % (66/91)
  - `equipmentView.js`: lines 95.96 % (119/124), branches 81.63 % (40/49)
- **Backend**: não medido. This range changes no file under `backend/` (`git diff --numstat beb239b..3e832bd` lists none), and the backend suite was not run in this round.
- **Skipped tests**: 2 `test.fixme` in `heroAscension.spec.js`, pre-existing.
- **Failures**: none in unit, build or the full e2e run.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ the production range is unchanged since `fb37408` (round 3 touches tests only) |
| Surgical changes | ✅ game only; no backend file |
| No scope creep | ✅ every rule in the code is in the spec |
| Matches patterns | ✅ |
| Spec-anchored outcome check | ⚠️ 32 of 33 exact; DRG-17 asserts the amulet kind only (gap 1) |
| Per-layer coverage expectation | ✅ unit 31/33 (DRG-20, DRG-22 CSS only); e2e 33/33 |
| Every test maps to a spec requirement | ✅ `U:549-605` map to DRG-27 to DRG-29; `U:292-309` to DRG-25; `E:654-659` to DRG-30 |
| Documented guidelines (`CLAUDE.md`: unit and e2e per player-visible behaviour) | ✅ every visible criterion has an e2e scenario; the gap is the kind coverage, not a missing layer |

---

## Fix Plans (route to the user; this is round 3 of 3)

The round bound is reached. Both fixes are test-only; the probes above show the production code already behaves as the spec says where the gap is a missing assertion. Each fix is verified by its mutant.

### Fix 1 (Major): the lit slot is the slot of the piece's kind (gap 1, DRG-17)

- **Root cause**: every drag fixture is an amulet (`dragEquip.test.js:5`, `dragEquip.spec.js:89`-`:104` drag `a1`), so the `AMULET` slot is the only kind ever checked as lit.
- **Fix task** (test-only): in `dragEquip.test.js` (describe `attachDragToEquip`), add a case that drags a ring (`slot: 'RING'`) over Lyra's block and expects `equip-slot-lyra-RING` to carry `is-drop-slot` and `equip-slot-lyra-AMULET` not. In `dragEquip.spec.js`, add a drag of a RING or WEAPON piece (`u1` onto `equip-hero-kael`) that asserts the lit slot is that piece's own slot.
- **Verify**: mutant F6 (`dragEquip.js:130`, `data-slot` hard-coded to `AMULET`) makes the new cases fail; the line is restored; `git diff game/src` empty.
- **Priority**: Major.

### Fix 2 (Major): a stale answer after a close and a reopen (gap 2, edge case)

- **Root cause**: the only edge test closes the window and does not reopen it (`H:1628-1640`); the view guard is therefore pinned by the close path only, and a reopen of the same screen (which also increments `view`) is not in the suite.
- **Fix task** (test-only): in `HeroUi.test.js` (describe `HeroUi drag to equip`), add a case: start a pending equip of a bag piece with a drag, close the window, open Equipamento again, open a piece detail on it, then resolve the equip; expect the open piece detail to stay and the list not to be redrawn by that answer.
- **Verify**: mutant F8b (`HeroUi.js:469` view guard removed) makes the case fail; the line is restored; `git diff game/src` empty.
- **Priority**: Major.

### Notes (accepted, no fix)

- DRG-11 e2e uses a synthetic `pointercancel` (see the judgement above).
- DRG-20 and DRG-22 are CSS only; the test matrix allows e2e only.
- F8 is equivalent and needs no test.

---

## Lessons

Recorded after this report (signal `surviving_mutant`, both grounded in this round's sensor):

- `L-065` (`dragEquip.js:130`, F6): "Drag tests must cover a piece of every slot kind: a highlight that always marks the first kind survives when all fixtures drag that one kind"
- `L-066` (`HeroUi.js:469`, F8b): "Pin a stale async answer against a close followed by a reopen of the same screen, not only against the close"

Round 2 lessons `L-063` and `L-064` stay in force.

---

## Requirement Traceability Update

| Requirement | Previous Status (round 2) | New Status (round 3) |
| ----------- | ------------------------- | -------------------- |
| DRG-01 to DRG-16, DRG-18 to DRG-24, DRG-26, DRG-31 to DRG-33 | Done | Done |
| DRG-17 | Done | ❌ Needs Fix (gap 1: the slot of the piece's kind) |
| DRG-25 | Needs Fix (gap 2) | ✅ Done |
| DRG-27, DRG-28, DRG-29 | Needs Fix (gap 1) | ✅ Done |
| DRG-30 | Done (gap 3 minor) | ✅ Done (gap 3 closed) |
| Edge case: window closed then reopened before the answer | Pinned for close only | ❌ Needs Fix (gap 2) |

`spec.md` carries the same statuses in its traceability table.

---

## Summary

**Overall**: ❌ Not Ready. Escalated to the user after round 3 of 3.

**Spec-anchored check**: 32/33 ACs match the spec outcome exactly with a test; DRG-17 is not pinned for a slot other than the amulet's (gap 1); 33/33 have an e2e scenario; 31/33 have a unit test (DRG-20 and DRG-22 CSS only).
**Sensor**: 15 unit mutants: 12 killed, 1 equivalent (F8), 2 survived (F6, F8b); e2e: 1 of 2 killed (T16), F6 survived.
**Gate**: unit 1471 passed, 0 failed; build exit 0; e2e 175 passed, 2 skipped (pre-existing), 0 failed; drag-equip e2e 28/28.

**What works**: the drop and its one request, the list after a drop, the replaced and moved pieces, the leader panel, the error line, the busy state, every cancel path including the swallowed click and `pointercancel`, the 6 px threshold, touch and pen, `Equipar em`, selection mode, the other mouse buttons, the ghost placement (corner, size, fade), the drop-slot opacity, the source's 0.4, edge scroll up and down including a leave and re-entry of each band, the second primary pointer, and the block under the pointer during a still-pointer scroll. The backend is untouched.

**Issues found**: gap 1 (DRG-17, slot of the piece's kind, mutant F6) and gap 2 (edge case: close, reopen, stale answer, mutant F8b). Both are test-only; the fix plans are above.

**Next steps**: the user decides whether to approve the two fix tasks as a round 4 (this exceeds the 3-round bound, so it needs the user's explicit go-ahead). Until then the feature is not done, and the deploy of `3e832bd` is not claimed as ready.
