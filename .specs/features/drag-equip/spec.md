# Drag to Equip Specification

## Problem Statement

Equipping a piece on the Equipamento screen takes three clicks and two screen changes: click the tile, click `Equipar em <nome>` in the piece detail, click back to the list. The owner asks for a direct gesture: "gostaria de na tela de equipamentos clicar e arrastar o item direto para o heroi que eu gostaria de equipar". The server already equips a piece on one hero and moves the old piece of that slot to the bag (`EquipmentService.equip`, `PlayerEquipment.equip`), so the gap is only the gesture in the game.

## Goals

- [ ] The player equips a bag piece on a hero with one drag (press the tile, move it onto the hero block, release) and one request, without opening the piece detail.
- [ ] A drag that ends anywhere but a valid hero sends no request and leaves the screen as it was.
- [ ] Mouse, touch and pen drags follow the same rules; the existing `Equipar em <nome>` buttons keep working for keyboard and click users.

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Dragging a worn piece back to the bag (unequip by drag) | Not asked; `Remover` in the piece detail does it |
| Dropping on a single slot tile with slot checking | A piece has one slot, so the hero block is enough: the piece always lands in its own slot |
| Dragging hero cards, or pieces on any screen other than Equipamento | Not asked |
| Dragging in bulk-sell selection mode, or dragging several pieces at once | Selection mode gives a click its own meaning (toggle); a multi-drag is not asked |
| Reordering or sorting the bag by drag | Not asked (same as `equipment-ui`) |
| `Esc` to cancel a drag | Releasing the pointer anywhere outside a hero already cancels |
| A success notice after a drop | The piece appearing in the hero's slot is the receipt (D3) |
| Long-press activation on touch | D1 takes the same 6 px move rule as the mouse |
| Any backend or API change | `POST /equipment/{id}/equip` already does the job (`EquipmentService.equip`); no migration (AD-016 not triggered) |
| HTML5 drag and drop (`draggable`, `dragstart`, `dataTransfer`) | It does not fire on touch screens; pointer events cover mouse, touch and pen with one code path |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear. D1 to D8 are product owner defaults that wait for the owner's approval.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| D1 Touch activation | A touch drag starts like a mouse drag: after the finger moves 6 px from where it pressed. Draggable tiles carry `touch-action: none`, so a swipe that starts on a tile drags it instead of scrolling the window; a swipe that starts anywhere else scrolls as today; a tap still opens the piece detail | One rule and one code path for every pointer; long-press needs a timer plus cancelling the browser scroll mid-gesture and cannot be checked in e2e. The scroll cost is limited to the tiles, and DRG-27 and DRG-28 scroll the window during a drag | y |
| D2 Which pieces can be dragged | Every bag piece and every worn piece (a worn piece moves to the hero it is dropped on, the same as `Equipar em <nome>` on a worn piece today) | The detail already offers `Equipar em` for worn pieces, and the server already moves them | y |
| D3 After a successful drop | The Equipamento list redraws with the piece in the hero's slot and the replaced piece (if any) in the bag; no notice, the piece detail does not open | The change is visible where the player is looking; opening the detail would undo the time saved | y |
| D4 Drop target | The whole block of an owned hero (`equip-hero-<id>`: name, heading and its four slots). The piece goes to its own slot | A larger target is easier on a phone; the slot is not a choice | y |
| D5 Drag threshold | 6 CSS px of straight-line distance between the press and the current pointer position, in screen pixels | Below that a press is a click, so the click that opens the detail keeps working | y |
| D6 Feedback | A copy of the tile follows the pointer centred on it; the source tile dims to 40 % opacity; the hero block under the pointer gets an accent outline and a light accent background, and that hero's slot of the piece's slot gets a dashed accent outline; tooltips hide while dragging | The owner asked for a dragged item and a highlighted hero; the slot outline shows which piece will be replaced | y |
| D7 Edge scrolling (P2) | While dragging within 40 px of the top or bottom edge of the window, the window scrolls 8 px every 16 ms toward that edge. The 6 px and 40 px are screen pixels (`clientX`/`clientY`); the 8 px step is the window's own `scrollTop` unit | With 4 or 5 owned heroes the bag sits below the hero blocks and both are not on screen together (window 708 px tall) | y |
| D8 Failure | The error line `Não foi possível concluir a ação.` (the line every equipment action already uses) and the list as it was before the drop | Same text as the button flow (lesson L-010: no new wording) | y |
| Equip rule | `POST /equipment/<pieceId>/equip` with `{ "heroId": "<heroId>" }`; the server puts the piece on the hero and moves the piece that hero wore in that slot to the bag (EQP-12 to EQP-26) | Existing behaviour, unchanged | y |
| Keyboard and click fallback | The `Equipar em <nome>` buttons of the piece detail stay as they are | Owner request: the existing way of equipping keeps working | y |
| Player-facing text | No new text; the only message is the existing error line | AD-007 | y |

**Open questions:** none - D1 to D8 are recorded with their defaults above and go to the owner with the spec.

---

## User Stories

### P1: Drop a piece on a hero to equip it ⭐ MVP

**User Story**: As a player, I want to drag a piece from the bag onto a hero so that the hero wears it without opening the piece.

**Why P1**: It is the request.

**Acceptance Criteria** (each line is one EARS pattern):

1. WHEN the player presses the primary button (mouse button 0, a finger or a pen) on a bag tile or a worn tile of the Equipamento list and moves the pointer 6 px or more from the press point while pressed THEN the game SHALL start a drag of that piece.  <!-- event-driven -->
2. WHEN the player releases a drag over the block `equip-hero-<heroId>` of an owned hero who does not wear the dragged piece THEN the game SHALL send exactly one request `POST /equipment/<pieceId>/equip` with the body `{ "heroId": "<heroId>" }`.  <!-- event-driven -->
3. WHEN that request succeeds THEN the game SHALL show the Equipamento list with the dragged piece in the slot `equip-slot-<heroId>-<slot>` of its own slot, and SHALL NOT open the piece detail.  <!-- event-driven -->
4. WHEN that request succeeds and the hero wore another piece in the same slot THEN the game SHALL show that other piece in the bag and the bag title `Mochila (<n>)` SHALL count it.  <!-- event-driven -->
5. WHEN that request succeeds for a piece that was worn by another hero THEN the game SHALL show that other hero's slot of the piece's slot as `vazio`.  <!-- event-driven -->
6. WHEN that request succeeds and the hero is the leader THEN the attribute panel `Atributos de <nome>` SHALL show the numbers with the new piece (the same `leaderStats` rule as EQU-02).  <!-- event-driven -->
7. IF that request fails THEN the game SHALL show the error line `Não foi possível concluir a ação.` and the list with every piece where it was before the drop.  <!-- unwanted-behavior -->
8. WHILE that request runs the game SHALL disable every button of the Equipamento body and SHALL NOT start a new drag.  <!-- state-driven -->

**Independent Test**: Kael and Lyra are owned; the bag holds an epic amulet `a1`. Drag `a1` onto Lyra's block: one `POST /equipment/a1/equip` with `{"heroId":"lyra"}`, the tile `equip-slot-lyra-AMULET` reads `Épico Amuleto +3` and `Mochila (<n>)` drops by one, with no piece detail on screen.

---

### P1: Cancel a drag ⭐ MVP

**User Story**: As a player, I want a drag I let go of in the wrong place to do nothing so that I never equip by accident.

**Why P1**: A drag without a safe cancel is worse than the buttons.

**Acceptance Criteria**:

1. IF the player releases a drag anywhere outside every hero block (the bag, the attribute panel, the empty part of the window, or outside the window) THEN the game SHALL send no request and SHALL leave every piece where it was.  <!-- unwanted-behavior -->
2. IF the player releases a drag over the block of the hero who already wears the dragged piece THEN the game SHALL send no request.  <!-- unwanted-behavior -->
3. IF the browser cancels the pointer during a drag (`pointercancel`) THEN the game SHALL end the drag and send no request.  <!-- unwanted-behavior -->
4. WHEN a drag ends, by a drop or a cancel, THEN the game SHALL remove the dragged copy and every drag highlight, and SHALL give the source tile back its normal look.  <!-- event-driven -->
5. WHEN a drag ends THEN the click the browser fires right after the release SHALL NOT open the piece detail and SHALL NOT reach any other control.  <!-- event-driven -->
6. WHEN the player releases the pointer after moving it less than 6 px from the press point THEN the game SHALL treat it as a click: a click on a tile opens the piece detail as it does today.  <!-- event-driven -->

**Independent Test**: Drag `a1` and release it over the bag: no equip request, `a1` still in the bag, no `piece-drag-ghost` on the page and no piece detail.

---

### P1: See what is being dragged and where it lands ⭐ MVP

**User Story**: As a player, I want to see the piece under my pointer and the hero it will go to so that I know what a release will do.

**Why P1**: The owner asked for it, and it is the only way to tell a valid target from an invalid one before releasing.

**Acceptance Criteria**:

1. WHILE a drag runs the game SHALL show a copy of the source tile with the test id `piece-drag-ghost`, centred on the pointer, and SHALL move it with every pointer move.  <!-- state-driven -->
2. WHILE a drag runs the source tile SHALL carry the class `is-dragging`.  <!-- state-driven -->
3. WHILE a drag runs with the pointer over the block of an owned hero who does not wear the dragged piece, that block SHALL carry the class `is-drop-target` and that hero's slot tile of the piece's slot SHALL carry the class `is-drop-slot`.  <!-- state-driven -->
4. WHILE a drag runs, no block other than the one under the pointer SHALL carry `is-drop-target`, and no tile other than its slot SHALL carry `is-drop-slot`.  <!-- state-driven -->
5. WHILE a drag runs with the pointer over the block of the hero who wears the dragged piece, that block SHALL NOT carry `is-drop-target`.  <!-- state-driven -->
6. WHILE a drag runs the game SHALL show no piece tooltip.  <!-- state-driven -->

**Independent Test**: Press `a1`, move onto Lyra's block and hold: `piece-drag-ghost` is visible at the pointer, `equip-piece-a1` has `is-dragging`, `equip-hero-lyra` has `is-drop-target`, `equip-slot-lyra-AMULET` has `is-drop-slot`, `equip-hero-kael` has neither class.

---

### P1: Touch, pen and the existing controls ⭐ MVP

**User Story**: As a player on a phone, I want to drag with my finger, and as a keyboard player I want the buttons I already use to stay.

**Why P1**: The game ships a phone layout (`ui-review.config.js` project `phone`); the owner asked that the old way keeps working.

**Acceptance Criteria**:

1. The game SHALL apply DRG-01 to DRG-20 to touch and pen pointers with the same numbers as the mouse.  <!-- ubiquitous -->
2. The game SHALL give every draggable tile `touch-action: none`, so a finger drag on a tile moves the piece and does not scroll the window.  <!-- ubiquitous -->
3. The piece detail SHALL keep its `Equipar em <nome>` buttons, and a click on one SHALL equip the piece as specified by EQP-12 to EQP-26.  <!-- ubiquitous -->
4. WHILE bulk-sell selection mode is on, the game SHALL NOT start a drag, and a click on a bag tile SHALL toggle its selection as BSL specifies.  <!-- state-driven -->
5. IF a second pointer goes down while a drag runs THEN the game SHALL ignore that pointer.  <!-- unwanted-behavior -->
6. IF the press is not the primary button (a right or middle mouse button) THEN the game SHALL NOT start a drag.  <!-- unwanted-behavior -->

**Independent Test**: With a touch screen, put a finger on `a1`, slide onto Lyra's block and lift: one equip request with `{"heroId":"lyra"}` and `a1` under Lyra. Open `a1` with a click and use `Equipar em Kael Raizférrea`: it still equips.

---

### P2: Scroll the window while dragging

**User Story**: As a player with many heroes, I want the window to scroll when I drag near its edge so that I can reach a hero block that is off screen.

**Why P2**: With 2 or 3 heroes the bag and the heroes fit in the window; with 4 or 5 they do not, and a finger cannot scroll while it drags.

**Acceptance Criteria**:

1. WHILE a drag runs with the pointer 40 px or less below the top edge of the window `.hero-window` the game SHALL scroll the window up by 8 px every 16 ms.  <!-- state-driven -->
2. WHILE a drag runs with the pointer 40 px or less above the bottom edge of the window the game SHALL scroll the window down by 8 px every 16 ms.  <!-- state-driven -->
3. WHEN the pointer leaves those edge bands, or the drag ends THEN the game SHALL stop scrolling.  <!-- event-driven -->
4. WHILE the window scrolls under a still pointer the game SHALL move the highlight of DRG-17 to the block now under the pointer.  <!-- state-driven -->

**Independent Test**: With 5 owned heroes and the window scrolled to the bag, drag a bag tile to the top edge of the window and hold: the window scrolls to the top; move onto Kael's block and release: the piece is under Kael.

---

## Edge Cases

- IF the Equipamento window is closed or another screen opens before the equip answer arrives THEN the game SHALL draw nothing from that answer (the same guard as the transfer of a set).
- IF the screen redraws during a drag (a drop notice, an answer of an earlier action) THEN the release SHALL still resolve its target from the hero block under the pointer at release time.
- WHEN the dragged piece is released over a hero block whose slot of that kind is empty THEN the game SHALL equip it and the bag SHALL hold one piece less.
- IF the source tile is disabled (the screen is busy) THEN a press on it SHALL NOT start a drag.
- WHEN only one hero is owned THEN a bag piece SHALL still be draggable onto that hero, and a worn piece SHALL find no valid target (DRG-10).

---

## Requirement Traceability

IDs follow the order of the criteria: DRG-01 to DRG-08 for "Drop a piece on a hero", DRG-09 to DRG-14 for "Cancel a drag", DRG-15 to DRG-20 for "See what is being dragged", DRG-21 to DRG-26 for "Touch, pen and the existing controls", DRG-27 to DRG-30 for "Scroll the window while dragging". The ID of a criterion is its story's first ID plus its number minus one (DRG-15 is criterion 1 of "See what is being dragged").

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| DRG-01 | P1: Drop a piece on a hero (AC 1, drag start) | Tasks | Implementing |
| DRG-02 | P1: Drop a piece on a hero (AC 2, one request) | Tasks | In Tasks |
| DRG-03 | P1: Drop a piece on a hero (AC 3, piece in slot, no detail) | Tasks | In Tasks |
| DRG-04 | P1: Drop a piece on a hero (AC 4, replaced piece to bag) | Tasks | In Tasks |
| DRG-05 | P1: Drop a piece on a hero (AC 5, moved from another hero) | Tasks | In Tasks |
| DRG-06 | P1: Drop a piece on a hero (AC 6, leader panel) | Tasks | In Tasks |
| DRG-07 | P1: Drop a piece on a hero (AC 7, failure) | Tasks | In Tasks |
| DRG-08 | P1: Drop a piece on a hero (AC 8, busy) | Tasks | In Tasks |
| DRG-09 | P1: Cancel a drag (AC 1, outside every hero) | Tasks | Implementing |
| DRG-10 | P1: Cancel a drag (AC 2, own wearer) | Tasks | Implementing |
| DRG-11 | P1: Cancel a drag (AC 3, pointercancel) | Tasks | Implementing |
| DRG-12 | P1: Cancel a drag (AC 4, cleanup) | Tasks | Implementing |
| DRG-13 | P1: Cancel a drag (AC 5, click swallowed) | Tasks | Implementing |
| DRG-14 | P1: Cancel a drag (AC 6, short press is a click) | Tasks | Implementing |
| DRG-15 | P1: See what is being dragged (AC 1, ghost) | Tasks | Implementing |
| DRG-16 | P1: See what is being dragged (AC 2, source dimmed) | Tasks | Implementing |
| DRG-17 | P1: See what is being dragged (AC 3, target and slot) | Tasks | Implementing |
| DRG-18 | P1: See what is being dragged (AC 4, only one target) | Tasks | Implementing |
| DRG-19 | P1: See what is being dragged (AC 5, own wearer not lit) | Tasks | Implementing |
| DRG-20 | P1: See what is being dragged (AC 6, no tooltip) | Tasks | Implementing |
| DRG-21 | P1: Touch, pen and existing controls (AC 1, same rules) | Tasks | Implementing |
| DRG-22 | P1: Touch, pen and existing controls (AC 2, touch-action) | Tasks | In Tasks |
| DRG-23 | P1: Touch, pen and existing controls (AC 3, Equipar em stays) | Tasks | In Tasks |
| DRG-24 | P1: Touch, pen and existing controls (AC 4, selection mode) | Tasks | In Tasks |
| DRG-25 | P1: Touch, pen and existing controls (AC 5, second pointer) | Tasks | Implementing |
| DRG-26 | P1: Touch, pen and existing controls (AC 6, primary only) | Tasks | Implementing |
| DRG-27 | P2: Scroll while dragging (AC 1, up) | Tasks | Implementing |
| DRG-28 | P2: Scroll while dragging (AC 2, down) | Tasks | Implementing |
| DRG-29 | P2: Scroll while dragging (AC 3, stop) | Tasks | Implementing |
| DRG-30 | P2: Scroll while dragging (AC 4, highlight follows) | Tasks | Implementing |

**Coverage:** 30 total, 30 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] Equipping a bag piece takes one drag and one request, against three clicks today.
- [ ] Unit tests pin the 6 px threshold, every cancel path and every class of DRG-15 to DRG-20; e2e tests drag with the mouse and with a real touch sequence.
- [ ] `equipment.spec.js`, `equipmentUi.spec.js` and `bulkSell.spec.js` pass unchanged.
- [ ] No backend file changes.
