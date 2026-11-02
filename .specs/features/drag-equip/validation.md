# Drag to Equip Validation

**Date**: 2026-11-02
**Spec**: `.specs/features/drag-equip/spec.md` (amended in `9f889ad`)
**Diff range**: `beb239b..fb37408` (game only; 0 files under `backend/`; HEAD `fb37408`)
**Verifier**: independent sub-agent, round 2 (fresh instance; did not author the feature or its tests)
**Rounds**: 2 of 3 used. Round 1 FAIL at `823f22f`.

---

## Validation: Drag to equip - FAIL ❌ (round 2)

**Result**: FAIL ❌ - two surviving mutants show two behaviours the suite does not pin: a second primary pointer starts a second drag (DRG-25), and a leave-and-re-enter of the edge band scrolls at double speed and keeps scrolling after the drop (DRG-27, DRG-28, DRG-29). The production code is correct; both probes pass on it. Both gaps are test gaps, closed by the fix tasks below. Every round-1 gap is closed.

---

## Round History

| Round | Commit | Verdict | Gaps |
| ----- | ------ | ------- | ---- |
| 1 | `823f22f` | FAIL ❌ | DRG-15 contradicted the spec; visual rules undocumented; 8 criteria without e2e; D6 opacity unasserted; sensor survivor M7; edge band beyond the window undefined |
| 2 | `fb37408` (this report) | FAIL ❌ | Sensor survivors S1 (DRG-25) and S9 (DRG-27 to DRG-29); DRG-30 e2e assertion weaker than its unit test |

---

## Task Completion

| Task | Status | Commit | Notes |
| ---- | ------ | ------ | ----- |
| T1 drag helper | ✅ Done | `7272cdc` | - |
| T2 edge scroll | ✅ Done | `4e60a1c` | - |
| T3 renderEquipment wiring | ✅ Done | `00b0076` | - |
| T4 HeroUi.dropEquip | ✅ Done | `513b6e5` | - |
| T5 styles | ✅ Done | `5a199b8` | - |
| T6 e2e | ✅ Done | `5e7552f` | - |
| UI fixes (ui-artist findings) | ✅ Accepted by spec | `2891ad7`, `905270a`, `751beae`, `92abd66` | Ghost offset, scale, fade and slot opacity are now in D6 and DRG-15 / DRG-31 to DRG-33 (`9f889ad`) |
| T7 busy guard unit test | ✅ Done | `f115ae0` | Kills the round-1 survivor M7 |
| T8 edge band beyond the window | ✅ Done | `dfce322` | Amended D7 pinned |
| T9 accepted visual rules e2e | ✅ Done | `eb3184d` | DRG-16, DRG-31, DRG-32 |
| T10 leader panel and busy e2e | ✅ Done | `8b6aeaa` | DRG-06, DRG-08 |
| T11 pointercancel, click swallow, other buttons e2e | ✅ Done | `763f3a8` | DRG-11, DRG-13, DRG-26 |
| T12 second finger e2e | ✅ Done | `94e98ad` | DRG-25 (touch only, see gap 2) |
| T13 scroll down and light under a still pointer e2e | ✅ Done | `fb37408` | DRG-28, DRG-30 |

---

## Spec-Anchored Acceptance Criteria

Files: `U` = `game/src/adapters/phaser/views/dragEquip.test.js`; `V` = `game/src/adapters/phaser/views/equipmentView.test.js`; `H` = `game/src/adapters/phaser/HeroUi.test.js`; `E` = `game/e2e/dragEquip.spec.js`; `CSS` = `game/public/style.css`; `D` = `game/src/adapters/phaser/views/dragEquip.js`.

### P1: Drop a piece on a hero

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-01 press and move 6 px | drag starts at 6 px; a shorter press does not | `U:81-89` `expect(ghost()).not.toBeNull()` at 6 px; `U:73-79` `expect(ghost()).toBeNull()` at 5.66 px | ✅ |
| DRG-02 release on an owned hero who does not wear the piece | exactly one `POST /equipment/a1/equip`, body `{ heroId: 'lyra' }` | `E:101-103` `toHaveLength(1)`, `path` `/equipment/a1/equip`, `body` `toEqual({ heroId: 'lyra' })`; `H:1523` `equip.mock.calls toEqual([['a1','lyra']])` | ✅ |
| DRG-03 request succeeds | piece in `equip-slot-lyra-AMULET`, no piece detail | `E:96` aria-label `Épico Amuleto +3`; `E:99` `piece-detail` count 0; `H:1524-1525` | ✅ |
| DRG-04 slot held another piece | that piece in the bag, `Mochila (n)` counts it | `E:112-114` `Incomum Anel +0`, `Mochila (4)`; `H:1530-1537` `Mochila (1)` | ✅ |
| DRG-05 piece worn by another hero | that hero's slot reads `vazio` | `E:126-127` `.piece-empty` `vazio`; `H:1540-1548` `textContent` `vazio` | ✅ |
| DRG-06 hero is the leader | attribute panel shows the new numbers | `H:1550-1559` `stat-clickDamage` `1.0` to `4.0`; `E:331-347` `4.6` to `1.1` to `4.6` with `Atributos de Kael Raizférrea` | ✅ |
| DRG-07 request fails | `Não foi possível concluir a ação.`, list as before | `E:285-296` `.hero-error` text `toHaveText('Não foi possível concluir a ação.')`, `a1` visible, `lyra` slot `vazio`; `H:1561-1571` | ✅ |
| DRG-08 request runs | every button disabled, no new drag | `E:363-368` `equip-piece-c1` disabled, `.hero-body button:enabled` count 0, no ghost; `H:1587-1605` every button disabled; `H:1607-1626` second `dropEquip` sends no request (T7) | ✅ |

### P1: Cancel a drag

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-09 release outside every hero | no request, nothing moves | `U:196-210` `onDrop` not called (bag, outside page); `E:208-219` requests 0, `Mochila (4)`; `E:221-230` attribute panel; `E:232-243` outside the window | ✅ |
| DRG-10 release on the wearer | no request | `U:212-220` `onDrop` not called; `E:245-259` requests 0, slot unchanged | ✅ |
| DRG-11 `pointercancel` | drag ends, no request | `U:222-230` `onDrop` not called, `ghost()` null, `lyra` not lit; `E:382-411` ghost count 0 (`:400`), requests 0 (`:408`); the event is synthetic (`:396-398`), see the note under gaps | ✅ |
| DRG-12 drag ends | copy and highlights removed, source back to normal | `U:232-241`; `E:167-168` ghost count 0, no `is-dragging` | ✅ |
| DRG-13 drag ends | click after release does not open the piece | `U:243-254` `onClick` not called after the drag, the next click after a task opens; `E:413-437` `piece-detail` count 0 (`:430`) after a press and release on its own tile; mutant H-e2e killed | ✅ |
| DRG-14 release under 6 px | a click; the piece opens | `U:256-264` `onClick` once, `onDrop` not called; `E:261-274` `Na mochila` | ✅ |

### P1: See what is being dragged

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-15 drag runs | copy's bottom-right corner 12 px left of and above the pointer (±2 px), moves with each move | `E:180-184` `Math.abs(box.x + box.width - 628) <= 2`, `Math.abs(box.y + box.height - 348) <= 2` for a pointer at (640, 360); `U:91-102` `left` `150px`, `top` `220px` follow the pointer; `CSS:2226` `translate(calc(-100% - 12px), calc(-100% - 12px))`; mutant B (24 px) killed by `E:174-187` | ✅ spec amended in `9f889ad`; the round-1 contradiction is closed |
| DRG-16 drag runs | source tile `is-dragging`, opacity 0.4 | `U:81-89` `classList.contains('is-dragging')`; `E:140-141` class and `toHaveCSS('opacity', '0.4')`; `CSS:2214-2215` | ✅ |
| DRG-17 pointer over a valid hero | block `is-drop-target`, its slot of the piece's kind `is-drop-slot` | `U:120-128`; `E:142-143` | ✅ |
| DRG-18 one target only | no other block or slot lit | `U:130-140`, `U:142-150`; `E:152-153`, `E:161-162` | ✅ |
| DRG-19 pointer over the wearer | wearer's block not lit | `U:178-185`; `E:251` `not.toHaveClass(/is-drop-target/)` | ✅ |
| DRG-20 drag runs | no piece tooltip | no unit test; `E:146`, `E:163` `.piece-tooltip:visible` count 0; `CSS:2255-2257` | ✅ (e2e only, see note) |
| DRG-31 drag runs | copy 1.1 times the tile's on-screen size (±1 px) | `U:111-118` `--ghost-scale` `0.4` at a 40 % panel; `CSS:2226` `scale(calc(var(--ghost-scale, 1) * 1.1))`; `E:189-206` width and height within 1 px of `tile.width * 1.1` (`:202-203`) | ✅ (the 1.1 factor was not a sensor target this round) |
| DRG-32 no valid target under the pointer | copy opacity 0.6; 1 over a valid block | `U:152-176` `is-no-target` set over bag and wearer, cleared over a valid hero; `E:154` opacity `1` over Lyra; `E:160` `0.6` over the bag; `E:252` `0.6` over the wearer; mutants D (0.5) and E (class inverted) killed | ✅ |
| DRG-33 slot of the piece's kind | `is-drop-slot` at opacity 1, also on the empty `vazio` slot | `U:120-128` class; `E:143-144` `is-drop-slot` and `toHaveCSS('opacity', '1')` on the empty `equip-slot-lyra-AMULET`; mutant C (opacity rule removed) killed | ✅ |

### P1: Touch, pen and the existing controls

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-21 touch and pen | same rules and numbers as the mouse | `U:306-320` touch (4 px no drag, 6 px drag, drop on lyra); `U:322-329` pen; `E:467-476` real touch sequence via CDP, one request; `E:478-488` finger over the bag | ✅ |
| DRG-22 draggable tile | `touch-action: none`; empty slot `auto` | `E:276-283` `toHaveCSS('touch-action','none')` and `'auto'`; `CSS:2207-2209`; no unit test (see note) | ✅ (e2e only) |
| DRG-23 `Equipar em` | still equips from the detail | `E:298-308` `Equipado em Lyra Folhaveloz`, one request `{ heroId: 'lyra' }`; `H:1667-1679` | ✅ |
| DRG-24 selection mode on | no drag, click toggles | `V:550-554` no tile draggable; `E:310-329` ghost count 0 (`:318`), requests 0 (`:323`), `aria-pressed` toggles (`:324`, `:328`) | ✅ |
| DRG-25 second pointer | ignored while a drag runs | `U:266-282` second pointer non-primary: one ghost (`:272`), drop once to lyra (`:280-281`); `E:501-546` second finger: ghost count 1 (`:533`), one request (`:543-545`). **A second primary pointer is not pinned**: mutant S1 (`D:64` `active` guard removed) survives; probe A gives 2 copies where the spec gives 1. `U:284-290` does not discriminate (`ghost()` returns the first copy) | ❌ GAP (gap 2) |
| DRG-26 right or middle button | no drag | `U:292-297` `button: 2`, ghost null; `E:439-461` right and middle, no ghost (`:452`), no lit block (`:453`) | ✅ |

### P2: Scroll the window while dragging

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | -------------------- | ----------------------- | ------ |
| DRG-27 pointer 40 px or less below the top edge, or above it | window scrolls up 8 px per 16 ms, any x | `U:364-376` `192`, `168`; `U:388-401` 40 px scrolls, 41 px does not; `U:418-426` above the window `192`; `U:438-451` any x; `E:550-575` scroll to 0 and drop on Kael. **Re-entry**: mutant S9 (`D:105-107`, timer of the old direction not cleared) survives; probe I: after leaving and re-entering the band the window moves 16 px per 16 ms (`expected -16 to be -8`) | ❌ GAP (gap 1) |
| DRG-28 pointer 40 px or less above the bottom edge, or below it | window scrolls down 8 px per 16 ms, any x | `U:378-386` `216`; `U:403-416` 40 px scrolls, 41 px does not; `U:428-436` below the window `208`; `E:604-632` scroll to the end and drop on the last hero. Same `steer` path as DRG-27, so the re-entry gap applies to the bottom band too (probed for the top band only) | ❌ GAP (gap 1) |
| DRG-29 pointer leaves the band, or drag ends | scrolling stops | `U:465-478` `192` stays after leaving; `U:480-493` `192` stays after the release; `E:577-602` stable for 300 ms; mutant J (finish no longer clears the timer) killed. **After a re-entry**: probe I2 with S9: the window moves from `176` to `144` in 64 ms after the release | ❌ GAP (gap 1) |
| DRG-30 window scrolls under a still pointer | highlight moves to the block now under the pointer | `U:515-528` `kael` lit, `lyra` not (exact block); `E:634-657` lit hero changes (`:651`) and scroll stops at 0 (`:652`); mutant L (`light(null)` in the timer) killed by `E:634-657` and `U:515-528` | ✅ (the e2e asserts a change, not the block under the pointer; see gap 3) |

### Edge cases

- [x] Window closed before the equip answer: draws nothing. `H:1628-1640`.
- [x] Screen redrawn during a drag: the release resolves the block under the pointer. `H:1642-1654`.
- [x] Released over an empty slot: equips, bag holds one less. `E:90-104` (`Mochila (3)` at `:97`); `H:1518-1527`.
- [x] Source tile disabled (busy or selection): no drag. `U:299-304`; `V:569`.
- [x] Only one owned hero: a bag piece drops on it; a worn piece finds no target. `H:1656-1665`.

### Coverage of the criteria

- Unit: 31 of 33 criteria have a unit test; DRG-20 and DRG-22 are CSS only and covered by e2e.
- E2E: 33 of 33 criteria have an e2e scenario (`E:` lines above).
- Criteria with an exact outcome checked by a test: 33 of 33 (`✅` and `❌` rows cite the spec number).

---

## Round-1 Gaps Re-checked

| # | Round-1 gap | Status | Evidence |
| - | ----------- | ------ | -------- |
| 1 | DRG-15 contradicted the spec (blocker) | ✅ Closed | Spec amended `9f889ad` (D6, DRG-15 corner); `E:180-184` asserts the corner; mutant B killed |
| 2 | Undocumented visual rules (ghost scale, fade, full-opacity slot) | ✅ Closed | D6 amended and DRG-31 to DRG-33 added; `U:111-118`, `U:152-176`, `E:143-144`, `E:154`, `E:160`, `E:189-206`, `E:252`; mutants C, D, E killed |
| 3 | e2e missing for DRG-06, DRG-08, DRG-11, DRG-13, DRG-25, DRG-26, DRG-28, DRG-30 | ✅ Closed for all but DRG-25 | `E:331-347`, `E:349-380`, `E:382-411`, `E:413-437`, `E:439-461`, `E:604-632`, `E:634-657`; DRG-25 e2e exists but misses the second primary pointer (gap 2) |
| 4 | D6 40 % opacity unasserted | ✅ Closed | `E:141` `toHaveCSS('opacity', '0.4')`, passed in the full run |
| 5 | Sensor survivor M7 (`HeroUi.js:439` busy guard) | ✅ Closed | `H:1607-1626` (T7); re-run this round: mutant M7 killed (1 failed) |
| 6 | Edge band beyond the window undefined | ✅ Closed | D7 amended; `U:418-451` (T8); re-run this round: top-band mutant killed (1 failed) |
| 7 | DRG-20 and DRG-22 without unit tests (note) | ✅ Accepted | CSS only; pinned by e2e (`E:146`, `E:163`, `E:276-283`) |

---

## Discrimination Sensor

Scratch: a temporary git worktree at `fb37408` (detached), `node_modules` by junction; e2e mutants on port 5200. Each mutant touched only the scratch copy and was reverted by `git checkout` inside the worktree; no `git stash`. The scratch worktree was removed afterwards (the junction was unlinked first). The real tree's `git status --porcelain` was 59 entries before the sensor and is identical after (`diff` empty).

| Mutation | File:line | Description | Test that decides | Killed? |
| -------- | --------- | ----------- | ----------------- | ------- |
| S1 | `game/src/adapters/phaser/views/dragEquip.js:64` | `active` guard removed from `pointerdown` (DRG-25, second primary pointer) | none. Unit suite 41/41 pass. Probe A: 2 copies where 1 is expected (`expected 2 to be 1`) | ❌ Survived → gap 2 |
| S2 | `game/public/style.css:2226` | ghost offset 12 px → 24 px (DRG-15) | `E` 'the ghost follows the pointer, up and left of it' (`:180-184`) | ✅ Killed |
| S3 | `game/public/style.css:2243-2244` | `.piece-tile.is-drop-slot { opacity: 1 }` removed (DRG-33) | `E` 'shows the dragged piece and lights the hero under the pointer' (`:144`) | ✅ Killed |
| S4 | `game/public/style.css:2233` | no-target copy opacity 0.6 → 0.5 (DRG-32) | `E` 'shows the dragged piece and lights the hero under the pointer' (`:160`) and 'releasing on the hero who wears the piece sends nothing' (`:252`): 2 failed | ✅ Killed |
| S5 | `game/src/adapters/phaser/views/dragEquip.js:131` | `!lit` → `!!lit`, the copy dims over a valid hero (DRG-32) | `U` 'the ghost is dimmed over no hero and full over a valid one' (`:152-167`): 1 failed | ✅ Killed |
| S6 | `game/src/adapters/phaser/views/dragEquip.js:92` | bottom band `<=` → `<` (DRG-28 boundary) | `U` '40 px from the bottom scrolls and 41 px does not' (`:403-416`) | ✅ Killed |
| S7 | `game/src/adapters/phaser/views/dragEquip.js:215` | `pointercancel` listener not registered (DRG-11) | `U` 'a pointercancel ends the drag with no drop' (`:222-230`) and `E` 'a pointercancel ends the drag and sends nothing' (`:382-411`) both fail. The unit run has 19 failures: the other drags never end, so the `active` press stays set and later cases fail too | ✅ Killed |
| S8 | `game/src/adapters/phaser/views/dragEquip.js:28` | `stopPropagation` removed from the click swallow (DRG-13) | `U` 'the click after a drag does nothing…' (`:243-254`) and `E` 'the click after a drag released on its own tile opens nothing' (`:413-437`) | ✅ Killed |
| S9 | `game/src/adapters/phaser/views/dragEquip.js:105-107` | `clearInterval(timer)` removed when the direction changes (DRG-27, DRG-28, DRG-29) | none. Unit 41/41 pass. Probe I: re-entry scrolls `-16` instead of `-8`. Probe I2: after the release the window keeps moving, `176` to `144` in 64 ms | ❌ Survived → gap 1 |
| S10 | `game/src/adapters/phaser/views/dragEquip.js:150` | `clearInterval(timer)` removed from `finish` (DRG-29) | `U` 'stops when the drag ends' (`:480-493`) | ✅ Killed |
| S11 | `game/src/adapters/phaser/HeroUi.js:462` | the failed equip shows an empty error line (DRG-07) | `H` 'a refused equip shows the error line and the pieces where they were' (`:1561-1571`) and 'a success clears an earlier error line' (`:1573-1585`): 2 failed | ✅ Killed |
| S12 | `game/src/adapters/phaser/views/dragEquip.js:114` | the scroll timer lights nothing (DRG-30) | `E` 'the light follows the block that scrolls under a still pointer' and `U` 'the light follows the block…' (`:515-528`) | ✅ Killed |
| M7 | `game/src/adapters/phaser/HeroUi.js:439` | busy guard of `dropEquip` set to `if (false)` (DRG-08, round-1 survivor) | `H` 'a drop while an equip runs sends no second request' (`:1607-1626`): 1 failed | ✅ Killed |
| N | `game/src/adapters/phaser/views/dragEquip.js:87` | top band gets `y >= box.top &&` (DRG-27, round-1 re-check) | `U` 'a pointer above the window scrolls up' (`:418-426`): 1 failed | ✅ Killed |

**Sensor depth**: targeted behaviour-level mutations, 14 in total (the default lightweight depth is 1 to 3; the drag feature has 33 criteria and the previous round used 7). Not P0.
**Result**: 12/14 killed; 2 survived (S1 and S9) → fix tasks, gaps 1 and 2.
**Probes** (scratch only, not committed): probe A and probe I passed on the unmutated `fb37408` (2/2) and failed on their mutants, which confirms that S1 and S9 are real behaviours, not equivalent mutants.

**Judgement on the synthetic `pointercancel` (E:396-398)**: accepted. AC 3 of DRG-11 is about the game's reaction to the event; the listener in `D:215` takes the same type, `pointerId` and `isPrimary`, and does not inspect `isTrusted`. A drag on a tile with `touch-action: none` is not taken by the browser, so a real `pointercancel` is not a path this feature creates. The residual risk is that the e2e does not prove the browser's own dispatch; the unit test `U:222-230` is synthetic too.

---

## Interactive UAT Results

Not performed by the Verifier. The `ui-artist` reviewed the screens (`.specs/features/drag-equip/ui-review.html`, re-review `8c90f6f`); the visual rules are now in the spec (D6), so the screens are not re-reviewed here.

---

## Gate Check

- **Unit**: `cd game && npx vitest run --coverage` → 70 files, **1468 passed**, 0 failed (exit 0). Round 1 was 1464 (+4: T7 one, T8 three).
- **Build**: `cd game && npm run build` → exit 0 (chunk-size warning, pre-existing, not an error).
- **E2E**: `cd game && npm run test:e2e:coverage -- --config <alt config on port 5199>` → **175 passed**, **2 skipped** (`test.fixme` in `game/e2e/heroAscension.spec.js`, pre-existing), 0 failed, 19.0 min. `game/e2e/dragEquip.spec.js`: **28 of 28 passed** (round 1: 19; +9 from T9 to T13).
- **Coverage, unit** (v8, `game/coverage/unit/coverage-summary.json`): whole game lines **96.67 %** (2504/2590), branches **94.72 %** (1131/1194).
  - `dragEquip.js`: lines 100 % (107/107), branches 97.82 % (45/46)
  - `HeroUi.js`: lines 95.28 % (283/297), branches 82.81 % (106/128)
  - `equipmentView.js`: lines 100 % (124/124), branches 100 % (67/67)
- **Coverage, e2e** (istanbul, `game/coverage/e2e/coverage-summary.json`): whole game lines **91.81 %** (2356/2566), branches 74.89 %. A page reloaded inside a test loses its count, so this is a lower bound.
  - `dragEquip.js`: lines 98.13 % (105/107), branches 90.91 % (30/33)
  - `HeroUi.js`: lines 92.25 % (274/297), branches 72.52 % (66/91)
  - `equipmentView.js`: lines 95.96 % (119/124), branches 81.63 % (40/49)
- **Backend**: não medido. The range changes no file under `backend/` (0 files), so the backend suite is outside this feature.
- **Test integrity**: no test removed or weakened. The only removed lines in test files of the range are two `vitest` import lines (`git diff beb239b..fb37408 -- game/src/**/*.test.js game/e2e/*.js`).
- **Skipped tests**: 2 `test.fixme` in `heroAscension.spec.js`, pre-existing.
- **Failures**: none in unit, build or e2e.

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ the fade, scale and slot opacity are now in D6 and DRG-31 to DRG-33 |
| Surgical changes | ✅ six production files under `game/`; no backend file |
| No scope creep | ✅ every rule in the code is in the spec (D6, D7, DRG-15, DRG-31 to DRG-33) |
| Matches patterns | ✅ Allman braces, 4-space indent, `HeroUi.dropEquip` follows `transferSet` |
| Spec-anchored outcome check | ⚠️ 31 of 33 exact; DRG-25, DRG-27 to DRG-29 are contradicted by a surviving mutant (gaps 1 and 2); DRG-30 e2e weaker (gap 3) |
| Per-layer coverage expectation | ✅ unit 31/33 (DRG-20, DRG-22 CSS only); e2e 33/33 |
| Every test maps to a spec requirement | ✅ `U:196-210` and similar map to DRG-09; `H:1567-1585` (success clears the error line) maps to DRG-07 and D8; `V:` 'no tile draggable without onDrop' is the view contract listed in the test matrix |
| Documented guidelines (`CLAUDE.md`: unit and e2e per player-visible behaviour) | ✅ every visible criterion has an e2e scenario |

---

## Fix Plans (route to the orchestrator; test-only, no production change)

Both fixes add tests. The probes show that the production code already behaves as the spec says.

### Fix 1 (Major): timer restarted on re-entry (gap 1, DRG-27, DRG-28, DRG-29)

- **Root cause**: no test leaves the edge band, re-enters it, then releases. The existing cases (`U:465-493`) use one pass only, where a leaked timer is harmless.
- **Fix task** (`dragEquip.test.js`, inside `describe('attachDragToEquip edge scroll')`): add a case that leaves and re-enters the top band, advances 16 ms, and expects exactly 8 px (`-8`), then releases and expects no more movement over 64 ms. Add the same for the bottom band (`+8`).
- **Verify**: mutant S9 (`dragEquip.js:105-107`) makes the new case fail; the line is restored and `git diff game/src` is empty.
- **Priority**: Major.

### Fix 2 (Major): second primary pointer (gap 2, DRG-25)

- **Root cause**: the second-pointer unit case (`U:266-282`) uses a non-primary pointer, which the `isPrimary` check already blocks; `U:284-290` reads `ghost()`, which returns the first copy, so it passes without the `active` guard.
- **Fix task** (`dragEquip.test.js`): add a case where a drag runs with a mouse, a second `pointerdown` with `isPrimary: true` and `pointerType: 'pen'` lands on another tile, and the pen moves 40 px. Expect `document.querySelectorAll('[data-testid="piece-drag-ghost"]').length` to be 1 and the drop to go to the first pointer's hero only. Also change `U:284-290` to count the copies.
- **Verify**: mutant S1 (`dragEquip.js:64`, `active ||` removed) makes the new case fail; restored; `git diff game/src` empty.
- **Priority**: Major.

### Gap 3 (Minor, e2e assertion precision): DRG-30

- `E:649-652` asserts that the lit hero changes and the scroll stops; `U:515-528` pins the exact block. Optional: in `E:634-657`, assert that the lit hero equals the `data-drop-hero` of the block under the pointer (`document.elementFromPoint`) after the scroll.
- **Priority**: Minor. It does not block the verdict.

### Notes (accepted, no fix)

- DRG-11 e2e uses a synthetic `pointercancel` (see the judgement above).
- DRG-20 and DRG-22 are CSS only; the test matrix allows e2e only.
- The D6 outline and background of a drop target and slot are checked by class only; the ui-artist reviewed them visually.
- DRG-31's 1.1 factor (`E:202-203`) was not a sensor target this round.

---

## Lessons

Recorded after this report (signal `surviving_mutant`, both grounded in this round's sensor):

- `L-063` (`dragEquip.js:64`, S1): "Pin a second-pointer guard with a second primary pointer of another pointer type, and count the created copies rather than reading the first match"
- `L-064` (`dragEquip.js:105`, S9): "Pin a timer that restarts on re-entry: leave the zone, come back, end the gesture, and assert the step size and that the timer stops"

The DRG-30 e2e weakness (gap 3) is not recorded as a lesson: the criterion has exact unit evidence, so no AC gap exists.

---

## Requirement Traceability Update

| Requirement | Previous Status (round 1) | New Status (round 2) |
| ----------- | ------------------------- | -------------------- |
| DRG-01 to DRG-05, DRG-07, DRG-09, DRG-10, DRG-12, DRG-14 | Done | Done |
| DRG-06, DRG-08, DRG-11, DRG-13, DRG-15, DRG-16 | Implementing | ✅ Done |
| DRG-17 to DRG-24 | Done | Done |
| DRG-25 | Implementing | ❌ Needs Fix (gap 2) |
| DRG-26 | Implementing | ✅ Done |
| DRG-27, DRG-28, DRG-29 | Implementing, Implementing, Done | ❌ Needs Fix (gap 1) |
| DRG-30 | Implementing | ✅ Done (gap 3 is minor) |
| DRG-31, DRG-32, DRG-33 | Implementing | ✅ Done |

`spec.md` carries the same statuses in its traceability table.

---

## Summary

**Overall**: ❌ Not Ready. Two surviving mutants; both are test gaps with probes that pass on the correct code.

**Spec-anchored check**: 31/33 ACs match the spec outcome exactly with a test; DRG-25, DRG-27, DRG-28 and DRG-29 are not pinned for their re-entry or second-primary cases (gaps 1 and 2); 33/33 have an e2e scenario; 31/33 have a unit test.
**Sensor**: 14 mutants, 12 killed, 2 survived (S1, S9).
**Gate**: unit 1468 passed, 0 failed; build exit 0; e2e 175 passed, 2 skipped (pre-existing), 0 failed; drag-equip e2e 28/28.

**What works**: the drop, the one request and its body, the list after a drop, the replaced and moved pieces, the leader panel, the error line and its list, the busy state, every cancel path including the swallowed click and `pointercancel`, the 6 px threshold, touch and pen, `Equipar em`, selection mode, the other mouse buttons, the ghost placement (corner, size and fade), the drop-slot opacity, the source's 0.4, and edge scroll up and down with the stop. The backend is untouched.

**Issues found**: gap 1 (re-entry timer, DRG-27 to DRG-29) and gap 2 (second primary pointer, DRG-25), both with a fix task above, and gap 3 (minor, DRG-30 e2e precision).

**Next steps**: the orchestrator routes Fix 1 and Fix 2 to `test-engineer` (test-only). Then re-verify: this is round 3 of 3, the last allowed before escalation to the user.
