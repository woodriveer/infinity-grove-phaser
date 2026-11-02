# Drag to Equip Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/drag-equip/spec.md`
**Design**: `.specs/features/drag-equip/design.md`
**Status**: Approved (owner confirmed D1 to D8 at their defaults); T1 to T6 done. Fix round 1 (T7 to T13) after the Verifier's FAIL (`validation.md`, `823f22f`) and the spec amendment of 2026-11-02 (D6, D7, DRG-15, DRG-16, DRG-27, DRG-28, new DRG-31 to DRG-33). Fix round 2 (T14 to T16) after the Verifier's round-2 FAIL (`validation.md`, `59b841c`): two surviving mutants (S1 DRG-25, S9 DRG-27 to DRG-29) and one e2e assertion precision gap (DRG-30)

Rules for every task:

- Read the files under **Read first** before editing. Paths are from the repository root `D:/Developer/infinity-grove`. `views/` means `game/src/adapters/phaser/views/`.
- When `graphify-out/graph.json` exists, run `graphify query "<question>"` before your first grep or source read; read raw files only for the lines the graph or this task already located. After a code change, run `graphify update .`.
- One task = one commit with the message under **Commit**, checked with `python3 .claude/skills/tlc-spec-driven/scripts/check_commit.py --message "<msg>"`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Add files by path only, never `git add -A` or `git add .`.
- Mark the task `[x]` in this file in the same commit, and set the task's requirement rows in `spec.md` to `Implementing`.
- Push right after the commit (`CLAUDE.md`).
- Never delete or weaken an existing test. A failing test outside the files of the task is reported in the task summary as "not caused by this task", not edited.
- No backend file changes in this feature. No new player-facing text: the only message is the existing `Não foi possível concluir a ação.`
- Code style of `game/src`: 4-space indent, Allman braces for functions and blocks (see `views/equipmentView.js`), single quotes, `//  ` comments (two spaces) that say why.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `CLAUDE.md` (unit + Playwright e2e per player-visible behaviour), `game/vitest.config.js` (jsdom 29: `PointerEvent` exists, `document.elementFromPoint` and `setPointerCapture` do not, `scrollTop` is writable), `game/playwright.config.js` (Desktop Chrome, fake backend `game/e2e/support/fakeBackend.js`), lessons L-010 (exact texts) and L-039 (every edge case gets its own test); no coverage thresholds, so strong defaults apply.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Drag helper (`views/dragEquip.js`) | unit (jsdom) | Every transition of the state machine in `design.md`; both sides of the 6 px and 40 px bounds; every cancel path; every class of DRG-15 to DRG-20 | `game/src/adapters/phaser/views/dragEquip.test.js` | `cd game && npm test` |
| Game views (`equipmentView.js`) | unit (jsdom) | `data-drop-hero`, which tiles are draggable (bag, worn, empty, selection mode, busy, no `onDrop`), `onDrop` arguments | `game/src/adapters/phaser/views/equipmentView.test.js` | `cd game && npm test` |
| Game `HeroUi` | unit (jsdom) | DRG-02 to DRG-08 with the spec numbers, the close guard | `game/src/adapters/phaser/HeroUi.test.js` | `cd game && npm test` |
| Stylesheet | none | Build gate; checked by the `ui-artist` against the Visual Design table of `design.md`; `touch-action` is asserted by e2e T6 | `game/public/style.css` | `cd game && npm run build` |
| e2e | e2e (Playwright, fake backend) | Every player-visible criterion (DRG-01 to DRG-33): mouse drop, replace, move between heroes, leader panel, busy screen, feedback with its numbers (corner offset, 0.4 source, ghost size and fade, drop-slot opacity), each cancel path including `pointercancel` and the swallowed click, failure, short press, `Equipar em`, selection mode, other buttons, real touch drag, tap and second finger, edge scroll up and down, light under a still pointer | `game/e2e/dragEquip.spec.js` | `cd game && npx playwright test e2e/dragEquip.spec.js` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with unit tests only | `cd game && npm test` |
| Full | After tasks with e2e tests | `cd game && npm test && npx playwright test e2e/dragEquip.spec.js e2e/equipment.spec.js e2e/equipmentUi.spec.js e2e/bulkSell.spec.js` |
| Build | After each phase and after stylesheet tasks | `cd game && npm test && npm run build` |

---

## Execution Plan

Phases run in order; tasks inside a phase run in order. Six tasks: one batch, executed inline.

### Phase 1: Drag helper

```
T1 → T2
```

### Phase 2: Equipamento screen

```
T1 → T3
T3 → T4
T1 → T5
```

### Phase 3: e2e

```
T2 → T6
T4 → T6
T5 → T6
```

### Phase 4: Fix round 1 (Verifier gaps, tests only)

T7 and T8 change one unit test file each and need nothing else. T9 to T13 all edit `game/e2e/dragEquip.spec.js`, so they run one after the other. Seven tasks: one batch.

```
T7
T8
T9 → T10
T10 → T11
T11 → T12
T12 → T13
```

### Phase 5: Fix round 2 (Verifier gaps, tests only)

T14 and T15 both edit `views/dragEquip.test.js` and T16 edits `game/e2e/dragEquip.spec.js`, so they run one after the other, one commit each. Three tasks: one batch.

```
T14 → T15 → T16
```

---

## Task Breakdown

### T1: Drag helper attachDragToEquip [x]

**Owner**: game-dev
**Goal**: A tile that becomes a drag after a 6 px move and calls `onDrop(heroId)` when released over a valid hero block, with every cancel path and the drag feedback (DRG-01, DRG-09 to DRG-21, DRG-25, DRG-26).
**Where**: `game/src/adapters/phaser/views/dragEquip.js` (new)
**Also changes**: `game/src/adapters/phaser/views/dragEquip.test.js` (new)
**Read first**: `views/pieceTile.js:11-46` (the tile: a `<button>` with `data-slot`), `views/pieceTooltip.js:31-85` (document listener pattern), `views/pieceTile.test.js:1-6` (test style), `design.md` sections "Drag state machine" and "Risks & Concerns"
**Depends on**: None
**Requirement**: DRG-01, DRG-09, DRG-10, DRG-11, DRG-12, DRG-13, DRG-14, DRG-15, DRG-16, DRG-17, DRG-18, DRG-19, DRG-20, DRG-21, DRG-25, DRG-26

**Contract** (write the file exactly like this; T2 adds the edge scroll to it):

```js
//  Drag a piece tile onto a hero block to equip it (spec drag-equip). Pointer events give mouse, touch and pen one path.
//  A press becomes a drag once the pointer is DRAG_THRESHOLD_PX from the press point; a shorter press stays a click.
//  Hero blocks carry `data-drop-hero="<heroId>"`; the hero who already wears the piece is not a target.
export const DRAG_THRESHOLD_PX = 6;

//  The one press in progress: a second pointer, or a press on another tile, is ignored while it runs
let active = null;

//  The hero block under the pointer when it is a valid target, else null. jsdom has no elementFromPoint, hence the `?.`
const heroUnder = (x, y, piece) =>
{
    const block = document.elementFromPoint?.(x, y)?.closest('[data-drop-hero]') ?? null;

    return block && block.getAttribute('data-drop-hero') !== piece.heroId ? block : null;
};

//  After a drag the browser fires a click on the common ancestor of press and release (or on the tile when released on it); it must not
//  open the piece or press a control. The listener goes once the click is past, or with the next task when no click comes.
const swallowNextClick = () =>
{
    const swallow = (event) =>
    {
        event.stopPropagation();
        event.preventDefault();
    };

    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }));
};

//  The copy of the tile that follows the pointer: no test id of the tile, out of the tab order, hidden from screen readers
const ghostOf = (tile) =>
{
    const ghost = tile.cloneNode(true);

    ghost.querySelectorAll('.piece-tooltip').forEach((node) => node.remove());
    ghost.classList.add('piece-drag-ghost');
    ghost.removeAttribute('data-draggable');
    ghost.setAttribute('data-testid', 'piece-drag-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('tabindex', '-1');

    return ghost;
};

export const attachDragToEquip = (tile, piece, onDrop) =>
{
    tile.setAttribute('data-draggable', 'true');
    //  The <img> of the icon could start a native drag, which ends ours with a pointercancel
    tile.addEventListener('dragstart', (event) => event.preventDefault());

    tile.addEventListener('pointerdown', (event) =>
    {
        if (active || !event.isPrimary || event.button !== 0 || tile.disabled)
        {
            return;
        }

        const press = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        let ghost = null;
        let lit = null;

        const light = (block) =>
        {
            if (block === lit)
            {
                return;
            }

            lit?.classList.remove('is-drop-target');
            lit?.querySelector('.is-drop-slot')?.classList.remove('is-drop-slot');
            lit = block;
            lit?.classList.add('is-drop-target');
            lit?.querySelector(`.piece-tile[data-slot="${piece.slot}"]`)?.classList.add('is-drop-slot');
        };

        const follow = (x, y) =>
        {
            ghost.style.left = `${x}px`;
            ghost.style.top = `${y}px`;
            light(heroUnder(x, y, piece));
        };

        //  Ends the press; answers whether it was a drag
        const finish = () =>
        {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', cancel);
            active = null;

            if (!ghost)
            {
                return false;
            }

            ghost.remove();
            tile.classList.remove('is-dragging');
            document.body.classList.remove('piece-dragging');
            light(null);
            swallowNextClick();

            return true;
        };

        function move (moved)
        {
            if (moved.pointerId !== press.pointerId)
            {
                return;
            }

            if (!ghost)
            {
                if (Math.hypot(moved.clientX - press.x, moved.clientY - press.y) < DRAG_THRESHOLD_PX)
                {
                    return;
                }

                ghost = ghostOf(tile);
                document.body.append(ghost);
                tile.classList.add('is-dragging');
                document.body.classList.add('piece-dragging');
            }

            follow(moved.clientX, moved.clientY);
        }

        function up (released)
        {
            if (released.pointerId !== press.pointerId)
            {
                return;
            }

            const target = ghost ? heroUnder(released.clientX, released.clientY, piece) : null;

            if (finish() && target)
            {
                onDrop(target.getAttribute('data-drop-hero'));
            }
        }

        function cancel (cancelled)
        {
            if (cancelled.pointerId === press.pointerId)
            {
                finish();
            }
        }

        active = press;
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', cancel);
    });
};
```

**Test fixture** (`dragEquip.test.js`):

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachDragToEquip, DRAG_THRESHOLD_PX } from './dragEquip';
import { renderPieceTile } from './pieceTile';

const amulet = (heroId = null) => ({ id: 'a1', slot: 'AMULET', rarity: 'EPIC', refine: 3, affixes: [], heroId, sellPrice: 400 });
const pointer = (type, target, x, y, extra = {}) => target.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, isPrimary: true, pointerType: 'mouse', ...extra
}));
const ghost = () => document.querySelector('[data-testid="piece-drag-ghost"]');
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

//  Two hero blocks (kael, lyra), each with an AMULET slot tile and a RING slot tile, and a bag with the dragged tile `a1` and a second tile `m1`
let kael, lyra, bag, tile, other, onDrop, onClick, under;

const block = (heroId) =>
{
    const node = document.createElement('div');

    node.className = 'equip-hero';
    node.setAttribute('data-drop-hero', heroId);
    node.innerHTML = `<strong class="equip-hero-name">${heroId}</strong>`
        + `<button class="piece-tile" data-slot="RING" data-testid="equip-slot-${heroId}-RING"></button>`
        + `<button class="piece-tile" data-slot="AMULET" data-testid="equip-slot-${heroId}-AMULET"></button>`;

    return node;
};

const setup = (piece = amulet()) =>
{
    const scroller = document.createElement('div');

    scroller.className = 'hero-window';
    kael = block('kael');
    lyra = block('lyra');
    bag = document.createElement('div');
    onClick = vi.fn();
    onDrop = vi.fn();
    tile = renderPieceTile(piece, { testid: 'equip-piece-a1', onClick });
    other = renderPieceTile({ ...amulet(), id: 'm1', slot: 'ARMOR' }, { testid: 'equip-piece-m1', onClick: vi.fn() });
    attachDragToEquip(tile, piece, onDrop);
    attachDragToEquip(other, { ...amulet(), id: 'm1', slot: 'ARMOR' }, vi.fn());
    bag.append(tile, other);
    scroller.append(kael, lyra, bag);
    document.body.append(scroller);
    //  What sits under the pointer: set per test (a child of a block, the bag, or null for outside the page)
    under = null;
    document.elementFromPoint = vi.fn(() => under);
};

//  Press at (100, 100) and move to (120, 100): a drag
const startDrag = () =>
{
    pointer('pointerdown', tile, 100, 100);
    pointer('pointermove', document, 120, 100);
};

beforeEach(() => setup());
afterEach(async () =>
{
    pointer('pointercancel', document, 0, 0);
    await nextTask();
    document.body.innerHTML = '';
    document.body.className = '';
    delete document.elementFromPoint;
});
```

The `afterEach` `pointercancel` ends any press a test left open, so the module-level `active` is null for the next test; `await nextTask()` lets the click guard of that drag go, so it cannot swallow a click of the next test.

**Steps**:

1. Create `dragEquip.js` with the contract above.
2. Create `dragEquip.test.js` with the fixture and the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (`describe('attachDragToEquip', ...)`):

- `marks the tile draggable`: `tile.getAttribute('data-draggable')` is `'true'`; `DRAG_THRESHOLD_PX` is `6`.
- `a move of less than 6 px is no drag`: `pointerdown` on `tile` at (100, 100); `pointermove` on `document` at (104, 104) (5.66 px) → `ghost()` is `null`, `tile.classList.contains('is-dragging')` is `false`.
- `a move of 6 px starts the drag`: `pointerdown` at (100, 100); `pointermove` at (106, 100) → `ghost()` is not `null`, its parent is `document.body`; `tile` has `is-dragging`; `document.body` has `piece-dragging`.
- `the ghost is a copy of the tile at the pointer`: `startDrag()`; `pointermove` at (150, 220) → `ghost().style.left` `'150px'`, `ghost().style.top` `'220px'`; `ghost()` has classes `piece-tile`, `rarity-epic`, `piece-drag-ghost`; `aria-hidden` `'true'`; `tabindex` `'-1'`; no `data-draggable`; `document.querySelectorAll('[data-testid="equip-piece-a1"]').length` `1`.
- `lights the hero under the pointer and its slot of the piece`: `under = lyra.querySelector('.equip-hero-name')`; `startDrag()` → `lyra` has `is-drop-target`; `equip-slot-lyra-AMULET` has `is-drop-slot`; `equip-slot-lyra-RING` has no `is-drop-slot`; `kael` has no `is-drop-target`.
- `moves the light to the next hero`: as above, then `under = kael.querySelector('.equip-hero-name')`; `pointermove` at (130, 100) → `kael` has `is-drop-target` and `equip-slot-kael-AMULET` has `is-drop-slot`; `lyra` has neither class anywhere (`lyra.querySelector('.is-drop-slot')` is `null`).
- `the light goes when the pointer leaves every hero`: light `lyra`; `under = bag`; `pointermove` at (130, 100) → `document.querySelector('.is-drop-target')` and `document.querySelector('.is-drop-slot')` are `null`.
- `does not light the hero who wears the piece`: `document.body.innerHTML = ''`; `setup(amulet('kael'))`; `under = kael.querySelector('.equip-hero-name')`; `startDrag()` → `kael` has no `is-drop-target`.
- `a release over a valid hero drops on it`: `under = lyra.querySelector('[data-testid="equip-slot-lyra-RING"]')`; `startDrag()`; `pointerup` on `document` at (120, 100) → `onDrop` called once with `'lyra'`.
- `a release over the bag drops nothing`: `under = bag`; `startDrag()`; `pointerup` → `onDrop` not called.
- `a release outside the page drops nothing`: `under = null`; `startDrag()`; `pointerup` → `onDrop` not called.
- `a release on the wearer drops nothing`: `setup(amulet('kael'))` after clearing the body; `under = kael`; `startDrag()`; `pointerup` → `onDrop` not called.
- `a pointercancel ends the drag with no drop`: `under = lyra`; `startDrag()`; `pointercancel` on `document` → `onDrop` not called; `ghost()` `null`; `lyra` has no `is-drop-target`.
- `the end of a drag cleans every mark`: `under = lyra`; `startDrag()`; `pointerup` → `ghost()` `null`; `tile` has no `is-dragging`; `document.body` has no `piece-dragging`; `document.querySelector('.is-drop-target, .is-drop-slot')` `null`.
- `the click after a drag does nothing and the next one opens the piece`: `startDrag()`; `pointerup`; `tile.click()` → `onClick` not called; `await nextTask()`; `tile.click()` → `onClick` called once.
- `a short press stays a click`: `pointerdown` at (100, 100); `pointermove` at (103, 100); `pointerup` at (103, 100); `tile.click()` → `onClick` called once; `onDrop` not called.
- `a second pointer is ignored`: `under = lyra`; `startDrag()`; `pointerdown` on `other` at (300, 300) with `{ pointerId: 2, isPrimary: false }`; `pointermove` at (340, 300) with `{ pointerId: 2 }` → `document.querySelectorAll('[data-testid="piece-drag-ghost"]').length` `1`; `pointerup` with `{ pointerId: 2 }` → `onDrop` not called; `pointerup` with `{ pointerId: 1 }` → `onDrop` called once with `'lyra'`.
- `a press on another tile while one runs is ignored`: `pointerdown` on `tile` at (100, 100) (pending, no move); `pointerdown` on `other` at (300, 300) with `{ pointerId: 1 }`; `pointermove` at (340, 300) → the ghost (if any) is a copy of `tile`: `ghost().getAttribute('data-slot')` `'AMULET'`.
- `the right button starts no drag`: `pointerdown` with `{ button: 2 }`; `pointermove` at (140, 100) → `ghost()` `null`.
- `a disabled tile starts no drag`: `tile.disabled = true`; `startDrag()` → `ghost()` `null`.
- `a touch drag follows the same rules`: `under = lyra`; `pointerdown` with `{ pointerType: 'touch' }` at (100, 100); `pointermove` `{ pointerType: 'touch' }` at (104, 104) → `ghost()` `null`; `pointermove` `{ pointerType: 'touch' }` at (106, 100) → `ghost()` not `null`; `pointerup` `{ pointerType: 'touch' }` → `onDrop` called with `'lyra'`.
- `a pen drag follows the same rules`: same with `{ pointerType: 'pen' }`, only the final drop asserted.
- `blocks the native drag of the tile`: `const event = new Event('dragstart', { cancelable: true })`; `tile.dispatchEvent(event)` → `event.defaultPrevented` `true`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 23 cases of `dragEquip.test.js` pass.
- [x] `cd game && npm test` passes with every existing test unchanged.

**Commit**: `feat(game): drag a piece tile onto a hero block`

---

### T2: Edge scroll while dragging [x]

**Owner**: game-dev
**Goal**: While a drag is within 40 px of the top or bottom edge of `.hero-window`, the window scrolls 8 px every 16 ms toward that edge and the highlight follows the block under the still pointer (DRG-27 to DRG-30).
**Where**: `game/src/adapters/phaser/views/dragEquip.js`
**Also changes**: `game/src/adapters/phaser/views/dragEquip.test.js`
**Read first**: `dragEquip.js` (T1), `design.md` row "Edge scroll timer"
**Depends on**: T1
**Requirement**: DRG-27, DRG-28, DRG-29, DRG-30

**Contract**:

```js
//  Edge scroll (spec D7): pointer distances in screen pixels, the step in the window's own scrollTop pixels
export const EDGE_PX = 40;
export const SCROLL_STEP_PX = 8;
export const SCROLL_TICK_MS = 16;
```

Inside the `pointerdown` handler, after `let lit = null;`:

```js
        const scroller = tile.closest('.hero-window');
        let last = press;
        let direction = 0;
        let timer = null;

        //  -1 near the top edge, 1 near the bottom edge, 0 elsewhere or when the window is not laid out (jsdom, hidden)
        const edge = (y) =>
        {
            const box = scroller?.getBoundingClientRect();

            if (!box || box.height === 0)
            {
                return 0;
            }

            if (y - box.top <= EDGE_PX)
            {
                return -1;
            }

            return box.bottom - y <= EDGE_PX ? 1 : 0;
        };

        //  Restarts the timer only when the direction changes: pointer moves come faster than a tick
        const steer = (y) =>
        {
            const next = edge(y);

            if (next === direction)
            {
                return;
            }

            clearInterval(timer);
            timer = null;
            direction = next;

            if (direction !== 0)
            {
                timer = setInterval(() =>
                {
                    scroller.scrollTop += direction * SCROLL_STEP_PX;
                    light(heroUnder(last.x, last.y, piece));
                }, SCROLL_TICK_MS);
            }
        };
```

Change `follow` to record the point and steer:

```js
        const follow = (x, y) =>
        {
            last = { x, y };
            ghost.style.left = `${x}px`;
            ghost.style.top = `${y}px`;
            light(heroUnder(x, y, piece));
            steer(y);
        };
```

In `finish`, right after `active = null;`, add `clearInterval(timer);`.

**Test fixture additions** (`describe('attachDragToEquip edge scroll', ...)` in the same file, using T1's `setup`, `pointer` and `startDrag`):

```js
//  The window spans y 0 to 600 on screen; it starts scrolled to 200
const layOut = (height = 600) =>
{
    const scroller = document.querySelector('.hero-window');

    scroller.getBoundingClientRect = () => ({ top: 0, bottom: height, left: 0, right: 900, width: 900, height });
    scroller.scrollTop = 200;

    return scroller;
};

beforeEach(() => vi.useFakeTimers());
//  Runs the pending fake timers first, so the click guard of a drag ended under fake timers is removed before real timers come back
afterEach(() =>
{
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
});
```

Put this describe at the top level of the file, after the T1 describe, so the file-level `beforeEach`/`afterEach` of T1 apply to it too.

Press at (100, 300) and move to (130, 300) to start a drag in the middle (`startDrag` presses at y 100, which is outside both bands of a 600 px window, so it can be used too).

**Steps**:

1. Add the constants, the `scroller`/`edge`/`steer` block, the new `follow` and the `clearInterval` in `finish`.
2. Add the cases below.
3. Run the gate.

**Tests**: unit
**Test cases**:

- `exports the edge numbers`: `EDGE_PX` `40`, `SCROLL_STEP_PX` `8`, `SCROLL_TICK_MS` `16`.
- `scrolls up near the top edge`: `const s = layOut()`; `startDrag()`; `pointermove` at (120, 30); `vi.advanceTimersByTime(16)` → `s.scrollTop` `192`; `vi.advanceTimersByTime(48)` → `168`.
- `scrolls down near the bottom edge`: `layOut()`; `startDrag()`; `pointermove` at (120, 570); `vi.advanceTimersByTime(32)` → `216`.
- `40 px from the top scrolls and 41 px does not`: `pointermove` at (120, 41); advance 32 → `200`; `pointermove` at (120, 40); advance 16 → `192`.
- `40 px from the bottom scrolls and 41 px does not`: `pointermove` at (120, 559); advance 32 → `200`; `pointermove` at (120, 560); advance 16 → `208`.
- `keeps scrolling while the pointer moves inside the band`: `pointermove` at (120, 30); advance 8; `pointermove` at (125, 32); advance 8 → `192` (one tick: the timer was not restarted).
- `stops when the pointer leaves the band`: `pointermove` at (120, 30); advance 16 → `192`; `pointermove` at (120, 300); advance 64 → `192`.
- `stops when the drag ends`: `pointermove` at (120, 30); advance 16 → `192`; `pointerup` at (120, 30); advance 64 → `192`.
- `does not scroll a window with no height`: `layOut(0)`; `startDrag()`; `pointermove` at (120, 0); advance 64 → `200`.
- `a press that is no drag never scrolls`: `layOut()`; `pointerdown` on `tile` at (100, 30); `pointermove` at (102, 30); advance 64 → `200`.
- `the light follows the block that scrolls under a still pointer`: `layOut()`; `under = lyra`; `startDrag()`; `pointermove` at (120, 30) → `lyra` has `is-drop-target`; `under = kael`; advance 16 → `kael` has `is-drop-target`, `lyra` has not.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 11 new cases pass and the 23 cases of T1 still pass.
- [x] `cd game && npm test` passes.

**Commit**: `feat(game): scroll the equipment window while a piece is dragged near its edge`

---

### T3: Wire the drag into renderEquipment [x]

**Owner**: game-dev
**Goal**: Every bag tile and every worn tile of the list is draggable when `onDrop` is given and selection mode is off, and every hero block is a drop target (DRG-01, DRG-08, DRG-24).
**Where**: `game/src/adapters/phaser/views/equipmentView.js`
**Also changes**: `game/src/adapters/phaser/views/equipmentView.test.js`
**Read first**: `equipmentView.js:67-73` (doc comment and signature of `renderEquipment`), `:118-130` (`tileOf`), `:136` (hero block), `:228-235` (`busy` disables every button), `equipmentView.test.js:1-16` (fixtures `hero`, `heroes`, `weapon`, `ring`), `:250-254` (`selecting`, `find`)
**Depends on**: T1
**Requirement**: DRG-01, DRG-08, DRG-24

**Contract**:

1. Import: `import { attachDragToEquip } from './dragEquip';` (after the `./bulkSellView` import, keeping the current order style).
2. Signature: add `onDrop` to the destructured options: `{ onSelect, onTransfer, onStartSelling, onDrop, stats = null, notice = null, sellNotice = null, busy = false, selection = null }`.
3. Doc comment above `renderEquipment`: add the line `//  `onDrop(piece, heroId)` fires when a bag or worn piece is dragged onto the block of another owned hero (spec drag-equip); no tile is draggable in selection mode.`
4. In `tileOf`, inside the existing `if (!selection)` block, after `attachPieceTooltip(tile, piece, heroes);`:

```js
            if (onDrop)
            {
                attachDragToEquip(tile, piece, (heroId) => onDrop(piece, heroId));
            }
```

5. Hero block: `el('div', 'equip-hero', '', { testid: `equip-hero-${hero.id}`, 'data-drop-hero': hero.id })`.

Empty slot tiles (`renderEmptyTile`) are not draggable: they are not built by `tileOf`. `busy` needs no code: the tiles are disabled and T1 refuses a disabled tile.

**Steps**:

1. Apply items 1 to 5.
2. Append `describe('renderEquipment drag to equip', ...)` at the end of the file with the cases below. For the drop case, stub `document.elementFromPoint` as in T1; dispatch `new PointerEvent(...)` with `{ bubbles: true, button: 0, pointerId: 1, isPrimary: true }`. Its `afterEach` is `async () => { delete document.elementFromPoint; await new Promise((resolve) => setTimeout(resolve)); }`, so the click guard of a finished drag is gone before any later test clicks. Add `afterEach` to the vitest import.
3. Run the gate.

**Tests**: unit
**Test cases**:

- `marks every owned hero block with data-drop-hero`: `renderEquipment([ ring() ], heroes, { onSelect: vi.fn(), onDrop: vi.fn() })` → `equip-hero-kael` `data-drop-hero` `'kael'`, `equip-hero-lyra` `'lyra'`.
- `bag and worn tiles are draggable, empty slots are not`: pieces `[ weapon({ heroId: 'kael' }), ring() ]` with `onDrop` → `equip-piece-r1` and `equip-slot-kael-WEAPON` have `data-draggable` `'true'`; `equip-slot-kael-RING` (empty) has no `data-draggable`.
- `no tile is draggable without onDrop`: same pieces, no `onDrop` → `screen.querySelector('[data-draggable]')` `null`.
- `no tile is draggable in selection mode`: same pieces, `onDrop` and `selection: selecting()` → `screen.querySelector('[data-draggable]')` `null`.
- `a drop calls onDrop with the piece and the hero`: pieces `[ ring() ]`, `onDrop = vi.fn()`; `document.elementFromPoint = () => find(screen, 'equip-hero-lyra')`; `pointerdown` on `equip-piece-r1` at (100, 100); `pointermove` on `document` at (120, 100); `pointerup` on `document` at (120, 100) → `onDrop` called once with `(the ring object passed in, 'lyra')` (`expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), 'lyra')`).
- `a busy screen starts no drag`: pieces `[ ring() ]`, `onDrop`, `busy: true`; the same pointer sequence → `onDrop` not called; `document.querySelector('[data-testid="piece-drag-ghost"]')` `null`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 6 new cases pass; every existing case of `equipmentView.test.js` passes unchanged.
- [x] `cd game && npm test` passes.

**Commit**: `feat(game): make the equipment list tiles draggable onto hero blocks`

---

### T4: HeroUi.dropEquip [x]

**Owner**: game-dev
**Goal**: A drop equips the piece through `equipmentCollection.equip`, keeps the list on screen, shows the error line on a refusal and disables the screen while it runs (DRG-02 to DRG-08, edge case "window closed before the answer").
**Where**: `game/src/adapters/phaser/HeroUi.js`
**Also changes**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js:356-378` (`render_equipment` list branch), `:395-432` (`transferSet`, the pattern), `:51` (`EQUIPMENT_FAILED`), `HeroUi.test.js:1-88` (`createUi`, `open`, `flush`), `:688-760` (`worn`, `equipped` and the transfer tests to copy)
**Depends on**: T3
**Requirement**: DRG-02, DRG-03, DRG-04, DRG-05, DRG-06, DRG-07, DRG-08, DRG-23

**Contract**:

1. In `render_equipment`, list branch, after `onStartSelling: () => this.startSelling(),` add `onDrop: (picked, heroId) => this.dropEquip(picked.id, heroId),`.
2. New method right after `transferSet`:

```js
    //  A piece dropped on a hero (spec drag-equip): one equip request, every equipment button disabled while it runs, then the list again
    //  (never the piece); a refusal shows the error line and the list as it was
    async dropEquip (pieceId, heroId)
    {
        if (this.equipBusy)
        {
            return;
        }

        const view = this.view;

        this.equipBusy = true;
        this.render_equipment();

        try
        {
            await this.equipment.equip(pieceId, heroId);

            if (view === this.view)
            {
                this.setError('');
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(EQUIPMENT_FAILED);
            }
        }
        finally
        {
            this.equipBusy = false;

            if (view === this.view && this.screen === 'equipment')
            {
                this.render_equipment();
            }
        }
    }
```

**Test helper** (inside `describe('HeroUi drag to equip', ...)`, appended at the end of the file; copy `worn` and `equipped` from the transfer describe at `HeroUi.test.js:689-700`):

```js
    const send = (type, target, x) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, isPrimary: true, clientX: x, clientY: 100 }));

    //  Opens Equipamento on `pieces`; the gateway equips like the backend (the old piece of the slot goes to the bag)
    const start = async (pieces, list = catalog()) =>
    {
        const ctx = createUi({ list, equipmentList: { capacity: 100, pieces } });

        ctx.equipmentGateway.equip.mockImplementation(async (id, heroId) => equipped(pieces, id, heroId));
        await open(ctx, 'equipment');

        return ctx;
    };

    //  Press the tile, move 20 px and release over the block of `heroId`
    const dragTo = async (ctx, tileId, heroId) =>
    {
        document.elementFromPoint = () => ctx.testid(`equip-hero-${heroId}`);
        send('pointerdown', ctx.testid(tileId), 100);
        send('pointermove', document, 120);
        send('pointerup', document, 120);
        await flush();
    };

    afterEach(() => { delete document.elementFromPoint; });
```

Add `afterEach` to the vitest import of the file.

**Steps**:

1. Apply items 1 and 2.
2. Add the describe with the cases below.
3. Run the gate.

**Tests**: unit
**Test cases** (each starts with `const ctx = await start(<pieces>)`; a case that changes the gateway does it after `start`):

- `equips the dragged bag piece and stays on the list`: pieces `[ worn('a1', 'AMULET', null, { rarity: 'EPIC', refine: 3 }) ]`; `dragTo(ctx, 'equip-piece-a1', 'lyra')` → `ctx.equipmentGateway.equip.mock.calls` `[ [ 'a1', 'lyra' ] ]`; `equip-slot-lyra-AMULET` `aria-label` `'Épico Amuleto +3'`; `ctx.testid('piece-detail')` `null`; `ctx.testid('equipment-list')` not `null`; `.equip-bag-title` `'Mochila (0)'`.
- `moves the piece the hero wore in that slot to the bag`: pieces `[ worn('r1', 'RING', 'kael'), worn('u1', 'RING', null, { rarity: 'UNCOMMON' }) ]`; drag `equip-piece-u1` to `kael` → `equip-slot-kael-RING` `aria-label` `'Incomum Anel +0'`; `equip-piece-r1` not `null`; `.equip-bag-title` `'Mochila (1)'`.
- `moves a worn piece from another hero and leaves that slot vazio`: pieces `[ worn('w1', 'WEAPON', 'kael') ]`; drag `equip-slot-kael-WEAPON` to `lyra` → calls `[ [ 'w1', 'lyra' ] ]`; `equip-slot-lyra-WEAPON` `aria-label` `'Comum Arma +0'`; `equip-slot-kael-WEAPON` `textContent` `'vazio'`.
- `updates the attribute panel of the leader`: pieces `[ worn('w1', 'WEAPON', 'lyra', { clickDamage: 3 }) ]`, then `equip.mockResolvedValue({ capacity: 100, pieces: [ worn('w1', 'WEAPON', 'kael', { clickDamage: 3 }) ] })` → `stat-clickDamage` `'Dano de clique: 1.0'`; drag `equip-slot-lyra-WEAPON` to `kael` → `'Dano de clique: 4.0'`.
- `a refused equip shows the error line and the pieces where they were`: pieces `[ worn('a1', 'AMULET', null) ]`; `equip.mockRejectedValue(new Error('down'))`; drag `equip-piece-a1` to `lyra` → `.hero-error` `textContent` `'Não foi possível concluir a ação.'` and `hidden` `false`; `equip-piece-a1` not `null`; `equip-slot-lyra-AMULET` `textContent` `'vazio'`.
- `a success clears an earlier error line`: pieces `[ worn('a1', 'AMULET', null) ]`; `equip.mockRejectedValueOnce(new Error('down'))`; drag `equip-piece-a1` to `lyra` → `.hero-error` `hidden` `false`; drag `equip-piece-a1` to `lyra` again → `.hero-error` `hidden` `true`; `equip-slot-lyra-AMULET` `aria-label` `'Comum Amuleto +0'`.
- `disables the screen while the equip runs and starts no second drag`: pieces `[ worn('a1', 'AMULET', null), worn('c1', 'RING', null) ]`; `equip.mockImplementation(() => new Promise((resolve) => { finish = resolve; }))`; drag `a1` to `lyra` → every `button` under `.hero-body` is `disabled`; drag `equip-piece-c1` to `lyra` → `equip` called once; `finish({ capacity: 100, pieces: [ worn('a1', 'AMULET', 'lyra'), worn('c1', 'RING', null) ] })`; `await flush()` → `equip-piece-c1` `disabled` `false`.
- `draws nothing when the window closed before the answer`: pending equip as above; drag; `ctx.ui.close()`; `finish(...)`; `await flush()` → `ctx.query('.hero-body').children.length` `0`; `.hero-error` `hidden` `true`.
- `a redraw during a drag still drops on the hero under the pointer`: pieces `[ worn('a1', 'AMULET', null) ]`; `send('pointerdown', ctx.testid('equip-piece-a1'), 100)`; `send('pointermove', document, 120)`; `ctx.ui.render_equipment()`; `document.elementFromPoint = () => ctx.testid('equip-hero-lyra')` (the new block); `send('pointerup', document, 120)`; `await flush()` → calls `[ [ 'a1', 'lyra' ] ]`; `document.querySelector('[data-testid="piece-drag-ghost"]')` `null`.
- `with one owned hero a bag piece still drops on it`: `start([ worn('a1', 'AMULET', null) ], { leaderId: 'kael', heroes: [ hero('kael', { 0: 3 }), hero('lyra') ] })`; `equip-hero-lyra` `null`; drag `equip-piece-a1` to `kael` → calls `[ [ 'a1', 'kael' ] ]`; `equip-slot-kael-AMULET` `aria-label` `'Comum Amuleto +0'`.
- `the piece detail still equips with Equipar em`: pieces `[ worn('a1', 'AMULET', null) ]`; click `equip-piece-a1`; click `piece-equip-lyra`; `await flush()` → calls `[ [ 'a1', 'lyra' ] ]`; `piece-worn` `'Equipado em Hero lyra'` (DRG-23).

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The 11 new cases pass; every existing case of `HeroUi.test.js` passes unchanged.
- [x] `cd game && npm test` passes.

**Commit**: `feat(game): equip a piece dropped on a hero`

---

### T5: Styles of the drag [x]

**Owner**: game-dev
**Goal**: The look of the Visual Design table of `design.md`: grab cursor and `touch-action: none` on draggable tiles, dimmed source, ghost at the pointer, lit hero block and slot, no tooltip while dragging (DRG-15 to DRG-20, DRG-22).
**Where**: `game/public/style.css`
**Read first**: `style.css:1-40` (tokens), `:1327-1335` (`.equip-hero`), `:1793-1811` (`.piece-tile`), `:2200-2203` (`.piece-tile.is-locked`, insert after it), `design.md` section "Visual Design"
**Depends on**: T1
**Requirement**: DRG-15, DRG-16, DRG-17, DRG-19, DRG-20, DRG-22

**Contract** (insert after the `.piece-tile.is-locked` rule, before `/* ══ Rever chefes`):

```css
/* Drag to equip: a tile dragged onto a hero block (spec drag-equip) */

.piece-tile[data-draggable="true"] {
    cursor: grab;
    touch-action: none;
    -webkit-touch-callout: none;
    user-select: none;
}

.piece-tile.is-dragging {
    opacity: 0.4;
}

/* The copy under the pointer lives in document.body, outside the scaled panel, so its left and top are the pointer itself */
.piece-tile.piece-drag-ghost {
    position: fixed;
    z-index: 1000;
    margin: 0;
    transform: translate(-50%, -50%) scale(1.1);
    box-shadow: var(--shadow-lg);
    pointer-events: none;
}

.equip-hero.is-drop-target {
    outline: 3px solid var(--color-accent);
    outline-offset: 2px;
    background: var(--color-accent-100);
}

.piece-tile.is-drop-slot {
    outline: 3px dashed var(--color-accent);
    outline-offset: 3px;
}

body.piece-dragging,
body.piece-dragging * {
    cursor: grabbing !important;
    user-select: none;
}

body.piece-dragging .piece-tooltip {
    display: none;
}
```

**Steps**:

1. Insert the block.
2. Run the gate.
3. Run `cd game && npm run dev`, open Equipamento at 1280x720 with a bag piece and two owned heroes, hold a drag over the second hero, and check: the ghost sits under the cursor, the block is outlined in orange `#c67139` on `#fff2eb`, the slot of the piece's kind has a dashed outline, the source tile is faded.

**Tests**: none (stylesheet: build gate; `touch-action` is asserted in T6, the rest by the `ui-artist` review)
**Gate**: build - `cd game && npm test && npm run build`
**Done when**:

- [x] The block is in `style.css` after `.piece-tile.is-locked`.
- [x] `cd game && npm test && npm run build` passes.

**Commit**: `style(game): show the dragged piece and the hero it lands on`

---

### T6: e2e of the drag to equip [x]

**Owner**: test-engineer
**Goal**: Prove every player-visible criterion in Chromium against the fake backend, with the mouse and with a real touch sequence (DRG-01 to DRG-30).
**Where**: `game/e2e/dragEquip.spec.js` (new)
**Read first**: `game/e2e/equipmentUi.spec.js:1-36` (fixture `piece`, `PIECES`, `startGame`, `openEquipment`), `game/e2e/bulkSell.spec.js` (how `calls` and `page.route` failures are used), `game/e2e/support/fakeBackend.js:219-226` (`mockBackend` returns `calls`), `:627-644` (equip route; no change needed)
**Depends on**: T2, T4, T5
**Requirement**: DRG-01 to DRG-30

**Fixtures** (`dragEquip.spec.js`, `import { expect, test } from './support/coverage'`):

```js
const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CLICK_DAMAGE_PCT', base: 7 } ], heroId
});

//  Kael wears a rare weapon and a common ring, Lyra an uncommon ring; the bag holds an epic amulet +3, a legendary armor, a common amulet
//  and an uncommon ring (Mochila (4))
const PIECES = [
    piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('r1', 'RING', 'COMMON', 0, 'kael'), piece('r2', 'RING', 'UNCOMMON', 0, 'lyra'),
    piece('a1', 'AMULET', 'EPIC', 3), piece('m1', 'ARMOR', 'LEGENDARY', 0), piece('c1', 'AMULET', 'COMMON', 0), piece('u1', 'RING', 'UNCOMMON', 0)
];
const TWO = { 'kael:0': 1, 'lyra:0': 1 };
const ALL_FIVE = { 'kael:0': 1, 'lyra:0': 1, 'orina:0': 1, 'seraphine:0': 1, 'vex:0': 1 };
const equipCalls = (calls) => calls.filter(({ method, path }) => method === 'POST' && /^\/equipment\/[^/]+\/equip$/.test(path));
const centre = async (locator) =>
{
    const box = await locator.boundingBox();

    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

//  A mouse drag from the centre of `from` to `to` (a locator or a point); `release: false` leaves the button down
const drag = async (page, from, to, { release = true } = {}) =>
{
    const start = await centre(from);
    const end = typeof to.boundingBox === 'function' ? await centre(to) : to;

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });

    if (release)
    {
        await page.mouse.up();
    }
};
```

`startGame(page, { equipment = PIECES, copies = TWO } = {})` copies `equipmentUi.spec.js` `startGame`, passes `cards: { yan: { copies } }` and `equipment: { yan: equipment }`, and returns `calls` from `const { calls } = await mockBackend(...)`. `openEquipment(page)` is the one of `equipmentUi.spec.js`.

Touch helper (only in the touch describe, which starts with `test.use({ hasTouch: true })`):

```js
//  A real touch sequence through the Chrome DevTools Protocol: the browser makes the pointer events and applies touch-action
const touchDrag = async (page, from, to) =>
{
    const cdp = await page.context().newCDPSession(page);
    const start = await centre(from);
    const end = await centre(to);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: start.x, y: start.y } ] });

    for (let step = 1; step <= 8; step++)
    {
        const x = start.x + (end.x - start.x) * step / 8;
        const y = start.y + (end.y - start.y) * step / 8;

        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x, y } ] });
    }

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
```

**Steps**:

1. Create `dragEquip.spec.js` with the fixtures and `test.describe('Drag to equip', ...)`, `test.describe('Drag to equip by touch', ...)`, `test.describe('Drag to equip edge scroll', ...)`.
2. Run the gate; then run the whole e2e suite once (`cd game && npx playwright test`) and report any failure outside `dragEquip.spec.js` as "not caused by this task" with the failing test name.

**Tests**: e2e
**Test cases** (`Drag to equip`, `startGame(page)` then `openEquipment(page)` unless said otherwise):

- `drops a bag piece on a hero and equips it without opening the piece`: `drag(page, getByTestId('equip-piece-a1'), getByTestId('equip-hero-lyra'))` → `equip-slot-lyra-AMULET` `aria-label` `'Épico Amuleto +3'`; `.equip-bag-title` `'Mochila (3)'`; `equip-piece-a1` count 0; `piece-detail` count 0; `equipCalls(calls)` length 1 with `path` `'/equipment/a1/equip'` and `body` `{ heroId: 'lyra' }`.
- `replaces the piece the hero wore in that slot`: drag `equip-piece-u1` to `equip-hero-kael` → `equip-slot-kael-RING` `aria-label` `'Incomum Anel +0'`; `equip-piece-r1` visible; `.equip-bag-title` `'Mochila (4)'`.
- `moves a worn piece from one hero to another`: drag `equip-slot-kael-WEAPON` to `equip-hero-lyra` → `equip-slot-lyra-WEAPON` `aria-label` `'Raro Arma +0'`; `equip-slot-kael-WEAPON` text `'vazio'`; `equipCalls(calls)[0].body` `{ heroId: 'lyra' }`.
- `shows the dragged piece and lights the hero under the pointer`: `drag(page, a1, equip-hero-lyra, { release: false })` → `piece-drag-ghost` visible; `equip-piece-a1` has class `is-dragging`; `equip-hero-lyra` has class `is-drop-target`; `equip-slot-lyra-AMULET` has class `is-drop-slot`; `equip-hero-kael` has no `is-drop-target`; no visible tooltip (`await expect(page.locator('.piece-tooltip:visible')).toHaveCount(0)`); move the mouse to the centre of `equip-hero-kael` (`steps: 4`) → `equip-hero-kael` has `is-drop-target`, `equip-hero-lyra` has not; move to the centre of `equip-piece-m1` → `page.locator('.piece-tooltip:visible')` count 0 and no element with class `is-drop-target` (`page.locator('.is-drop-target')` count 0); `page.mouse.up()` → `piece-drag-ghost` count 0; `equip-piece-a1` has no `is-dragging`; `equipCalls(calls)` length 0.
- `the ghost follows the pointer`: `drag(... { release: false })` to the point `{ x: 640, y: 360 }` → the ghost's bounding box centre is within 2 px of (640, 360); `page.mouse.up()`.
- `releasing over the bag sends nothing and opens nothing`: drag `equip-piece-a1` to `equip-piece-m1` → `equipCalls(calls)` length 0; `piece-detail` count 0; `equip-piece-a1` visible; `.equip-bag-title` `'Mochila (4)'`.
- `releasing over the attribute panel sends nothing`: drag `equip-piece-a1` to `leader-stats` → `equipCalls(calls)` length 0; `piece-detail` count 0.
- `releasing outside the window sends nothing and keeps it open`: drag `equip-piece-a1` to `{ x: 20, y: 360 }` (the letterbox left of the 960x720 game) → `equipCalls(calls)` length 0; `equipment-list` visible; `piece-detail` count 0.
- `releasing on the hero who wears the piece sends nothing`: `drag(page, equip-slot-kael-WEAPON, page.getByTestId('equip-hero-kael').locator('.equip-hero-name'), { release: false })` → `equip-hero-kael` has no `is-drop-target`; `page.mouse.up()` → `equipCalls(calls)` length 0; `equip-slot-kael-WEAPON` `aria-label` `'Raro Arma +0'`.
- `a short press still opens the piece`: move to the centre of `equip-piece-a1`; `mouse.down()`; move by 3 px on x; `mouse.up()` → `piece-detail` visible; `piece-worn` `'Na mochila'`.
- `draggable tiles do not scroll on touch`: `equip-piece-a1` and `equip-slot-kael-WEAPON` `toHaveCSS('touch-action', 'none')`; `equip-slot-lyra-AMULET` (empty) `toHaveCSS('touch-action', 'auto')`.
- `a refused equip shows the error and keeps the piece in the bag`: after `startGame`, `await page.route('**/api/equipment/a1/equip', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }))`; open; drag `a1` to `equip-hero-lyra` → `.hero-error` `'Não foi possível concluir a ação.'`; `equip-piece-a1` visible; `equip-slot-lyra-AMULET` text `'vazio'`; `piece-detail` count 0.
- `Equipar em still equips from the piece detail`: click `equip-piece-a1`; click `piece-equip-lyra` → `piece-worn` `'Equipado em Lyra Folhaveloz'`; `equipCalls(calls)` length 1 with `body` `{ heroId: 'lyra' }`.
- `no drag in selection mode`: click `bulk-sell-start`; `drag(... a1 → equip-hero-lyra, { release: false })` → `piece-drag-ghost` count 0; `page.mouse.up()` → `equipCalls(calls)` length 0; `equip-piece-a1` `aria-pressed` `'false'`; click `equip-piece-a1` → `aria-pressed` `'true'`.

`Drag to equip by touch` (`test.use({ hasTouch: true })`):

- `drags a piece with a finger`: `touchDrag(page, equip-piece-a1, equip-hero-lyra)` → `equip-slot-lyra-AMULET` `aria-label` `'Épico Amuleto +3'`; `equipCalls(calls)` length 1 with `body` `{ heroId: 'lyra' }`.
- `a finger released over the bag sends nothing`: `touchDrag(page, equip-piece-a1, equip-piece-m1)` → `equipCalls(calls)` length 0; `piece-drag-ghost` count 0; `piece-detail` count 0.
- `a tap still opens the piece`: `const p = await centre(equip-piece-a1)`; `page.touchscreen.tap(p.x, p.y)` → `piece-detail` visible.

`Drag to equip edge scroll` (`startGame(page, { copies: ALL_FIVE })`):

- `scrolls the window while a piece is held near its top edge`: open; `const win = page.locator('.hero-window')`; `expect(await win.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true)`; `await win.evaluate((node) => { node.scrollTop = node.scrollHeight; })`; `await page.getByTestId('equip-piece-a1').scrollIntoViewIfNeeded()`; `const box = await win.boundingBox()`; `drag(page, a1, { x: box.x + box.width / 2, y: box.y + 10 }, { release: false })`; `await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBe(0)`; move to the centre of `equip-hero-kael` (`steps: 4`); `page.mouse.up()` → `equipCalls(calls)` length 1 with `body` `{ heroId: 'kael' }`; `equip-slot-kael-AMULET` `aria-label` `'Épico Amuleto +3'`.
- `stops scrolling when the piece leaves the edge`: scroll to the bottom as above; drag `a1` to `{ x: box.x + box.width / 2, y: box.y + 10 }` with `release: false`; wait until `scrollTop` is below its start (`expect.poll`); move to `{ x: box.x + box.width / 2, y: box.y + box.height / 2 }`; read `scrollTop` as `held`; `await page.waitForTimeout(300)`; `scrollTop` equals `held`; `page.mouse.up()`.

**Gate**: full - `cd game && npm test && npx playwright test e2e/dragEquip.spec.js e2e/equipment.spec.js e2e/equipmentUi.spec.js e2e/bulkSell.spec.js`
**Done when**:

- [x] The 19 cases of `dragEquip.spec.js` pass, and `equipment.spec.js`, `equipmentUi.spec.js` and `bulkSell.spec.js` pass unchanged.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): cover the drag to equip end to end`

---

### T7: Unit test that pins the busy guard of dropEquip [x]

**Owner**: test-engineer
**Goal**: A second `dropEquip` call while an equip request runs sends no second request, so the guard `if (this.equipBusy)` of `HeroUi.dropEquip` is pinned by a test (DRG-08; kills sensor mutant M7 of `validation.md`).
**Where**: `game/src/adapters/phaser/HeroUi.test.js`
**Read first**: `HeroUi.js:436-473` (`dropEquip`; the guard is at `:439`), `HeroUi.test.js:1483` (`describe('HeroUi drag to equip', ...)`, its `start`, `dragTo` and `worn` helpers), `HeroUi.test.js:1587-1604` (the case `disables the screen while the equip runs and starts no second drag`, the pattern of the pending equip)
**Depends on**: None
**Requirement**: DRG-08

**Contract**: no production change. One new `it` inside `describe('HeroUi drag to equip', ...)`, placed right after the case that ends at `HeroUi.test.js:1604`:

```js
    //  The disabled tiles stop a second drag before it reaches dropEquip; this calls dropEquip itself, so only its own guard can stop it
    it('a drop while an equip runs sends no second request', async () => {
        const ctx = await start([ worn('a1', 'AMULET', null), worn('c1', 'RING', null) ]);
        let finish;

        ctx.equipmentGateway.equip.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
        await dragTo(ctx, 'equip-piece-a1', 'lyra');

        const second = ctx.ui.dropEquip('c1', 'lyra');

        await flush();

        expect(ctx.equipmentGateway.equip.mock.calls).toEqual([ [ 'a1', 'lyra' ] ]);

        finish({ capacity: 100, pieces: [ worn('a1', 'AMULET', 'lyra'), worn('c1', 'RING', null) ] });
        await second;
        await flush();

        expect(ctx.equipmentGateway.equip.mock.calls).toEqual([ [ 'a1', 'lyra' ] ]);
        expect(ctx.testid('equip-piece-c1')).not.toBeNull();
    });
```

**Steps**:

1. Insert the case after `HeroUi.test.js:1604`.
2. Run the gate.
3. Sensor check: change `HeroUi.js:439` from `if (this.equipBusy)` to `if (false)`, run `cd game && npx vitest run src/adapters/phaser/HeroUi.test.js` and confirm the new case fails on `equip.mock.calls` (two calls instead of one). Restore the line; `git diff game/src/adapters/phaser/HeroUi.js` must print nothing.

**Tests**: unit
**Test cases**:

- `a drop while an equip runs sends no second request`: pieces `[ worn('a1', 'AMULET', null), worn('c1', 'RING', null) ]`; equip pending; `dragTo(ctx, 'equip-piece-a1', 'lyra')`; `ctx.ui.dropEquip('c1', 'lyra')` → `equip.mock.calls` `[ [ 'a1', 'lyra' ] ]`; after `finish(...)` and `await second` → `equip.mock.calls` still `[ [ 'a1', 'lyra' ] ]`; `equip-piece-c1` not `null`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The new case passes and every other case of `HeroUi.test.js` passes unchanged.
- [x] With `HeroUi.js:439` set to `if (false)` the new case fails; the line is restored and `git diff game/src/adapters/phaser/HeroUi.js` is empty.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): pin the busy guard of a drop while an equip runs`

---

### T8: Unit tests of the edge band beyond the window [x]

**Owner**: test-engineer
**Goal**: Pin the amended D7: a pointer above the window scrolls up, a pointer below it scrolls down, and the horizontal position does not matter (DRG-27, DRG-28; Verifier gap 6).
**Where**: `game/src/adapters/phaser/views/dragEquip.test.js`
**Read first**: `views/dragEquip.js:77-93` (`edge`), `views/dragEquip.test.js:5-8` (`pointer`), `:50-55` (`startDrag`: press at (100, 100), move to (120, 100)), `:340-416` (`describe('attachDragToEquip edge scroll', ...)`: `layOut()` lays the window out at x 0 to 900, y 0 to 600, scrolled to 200; fake timers)
**Depends on**: None
**Requirement**: DRG-27, DRG-28

**Contract**: no production change. Three new `it` inside `describe('attachDragToEquip edge scroll', ...)`, placed right after the case `40 px from the bottom scrolls and 41 px does not` (ends at `dragEquip.test.js:416`):

```js
    it('a pointer above the window scrolls up', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, -20);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);
    });

    it('a pointer below the window scrolls down', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 650);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(208);
    });

    it('the band does not depend on the horizontal position', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 1000, 20);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);

        pointer('pointermove', document, 1000, 300);
        vi.advanceTimersByTime(32);

        expect(scroller.scrollTop).toBe(192);
    });
```

**Steps**:

1. Insert the three cases after `dragEquip.test.js:416`.
2. Run the gate.
3. Sensor check: change `dragEquip.js:87` from `if (y - box.top <= EDGE_PX)` to `if (y >= box.top && y - box.top <= EDGE_PX)`, run `cd game && npx vitest run src/adapters/phaser/views/dragEquip.test.js` and confirm `a pointer above the window scrolls up` fails. Restore the line; `git diff game/src/adapters/phaser/views/dragEquip.js` must print nothing.

**Tests**: unit
**Test cases**:

- `a pointer above the window scrolls up`: window y 0 to 600 at `scrollTop` 200; move to (120, -20); 16 ms → `scrollTop` `192`.
- `a pointer below the window scrolls down`: move to (120, 650); 16 ms → `scrollTop` `208`.
- `the band does not depend on the horizontal position`: move to (1000, 20) (right of the 900 px window, inside the top band); 16 ms → `192`; move to (1000, 300) (outside both bands); 32 ms more → still `192`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The three new cases pass and every other case of `dragEquip.test.js` passes unchanged.
- [x] With the mutated line 87 the first new case fails; the line is restored and `git diff game/src/adapters/phaser/views/dragEquip.js` is empty.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): pin the edge scroll of a pointer beyond the window`

---

### T9: e2e of the accepted visual rules [x]

**Owner**: test-engineer
**Goal**: Assert in Chromium the numbers of the amended feedback: source tile at opacity 0.4, ghost at 1.1 times the tile's on-screen size, ghost at 0.6 over the wearer's own block (DRG-16, DRG-31, DRG-32). DRG-15 (corner 12 px up and left) is already asserted at `dragEquip.spec.js:173-186`, DRG-32 over the bag at `:159` and over a valid hero at `:153`, DRG-33 at `:143`; they stay as they are.
**Where**: `game/e2e/dragEquip.spec.js`
**Read first**: `game/e2e/dragEquip.spec.js:46-67` (`centre`, `drag`), `:133-171` (`shows the dragged piece and lights the hero under the pointer`), `:173-186` (`the ghost follows the pointer, up and left of it`), `:225-238` (`releasing on the hero who wears the piece sends nothing`), `game/public/style.css:2214-2234` (the opacity and ghost rules), `views/dragEquip.js:36-54` (`ghostOf`, `--ghost-scale`)
**Depends on**: None
**Requirement**: DRG-16, DRG-31, DRG-32

**Contract**: no production change. Style of the file: test callbacks `async ({ page }) => {` on one line, helpers with Allman braces, 4-space indent, single quotes.

1. In `shows the dragged piece and lights the hero under the pointer`, right after line 140 (`toHaveClass(/is-dragging/)`), add:

```js
        await expect(page.getByTestId('equip-piece-a1')).toHaveCSS('opacity', '0.4');
```

2. In `releasing on the hero who wears the piece sends nothing`, right after its line `await expect(page.getByTestId('equip-hero-kael')).not.toHaveClass(/is-drop-target/);` (line 231 before item 1, 232 after it), add:

```js
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCSS('opacity', '0.6');
```

3. New test right after `the ghost follows the pointer, up and left of it` (ends at line 186 before item 1, 187 after it):

```js
    test('the ghost is the tile on screen, lifted by 1.1', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        const tile = await page.getByTestId('equip-piece-a1').boundingBox();

        //  The 1024x768 game fits the 1280x720 viewport at 0.9375, so the 60 px tile is 56.25 px on screen; a copy at layout size would be 66 px
        expect(tile.width).toBeLessThan(59);

        await drag(page, page.getByTestId('equip-piece-a1'), { x: 640, y: 360 }, { release: false });

        const box = await page.getByTestId('piece-drag-ghost').boundingBox();

        expect(Math.abs(box.width - tile.width * 1.1)).toBeLessThanOrEqual(1);
        expect(Math.abs(box.height - tile.height * 1.1)).toBeLessThanOrEqual(1);

        await page.mouse.up();
    });
```

**Steps**:

1. Apply items 1 and 2 (one line each).
2. Add the test of item 3.
3. Run the gate.
4. Sensor check: delete the line `ghost.style.setProperty('--ghost-scale', String(scale));` (`dragEquip.js:47`), run `cd game && npx playwright test e2e/dragEquip.spec.js -g "lifted by 1.1"` and confirm it fails on the width. Restore the line; `git diff game/src` must print nothing. If a dev server of another checkout already listens on the Playwright port, stop and report it instead of trusting the result (`validation.md`, Discrimination Sensor).

**Tests**: e2e
**Test cases**:

- `shows the dragged piece and lights the hero under the pointer` (changed): also `equip-piece-a1` `toHaveCSS('opacity', '0.4')` while the drag runs.
- `releasing on the hero who wears the piece sends nothing` (changed): also `piece-drag-ghost` `toHaveCSS('opacity', '0.6')` while held over Kael's own block.
- `the ghost is the tile on screen, lifted by 1.1`: tile width below 59 px; ghost width and height within 1 px of 1.1 times the tile's.

**Gate**: full - `cd game && npx playwright test e2e/dragEquip.spec.js`
**Done when**:

- [x] `cd game && npx playwright test e2e/dragEquip.spec.js` passes with 20 tests (19 before plus 1).
- [x] With `dragEquip.js:47` deleted the new test fails; the line is restored and `git diff game/src` is empty.

**Commit**: `test(game): assert the faded source and the ghost size and fade end to end`

---

### T10: e2e of the leader panel and the busy screen after a drop [x]

**Owner**: test-engineer
**Goal**: Prove in Chromium that a drop on the leader changes the attribute panel, and that while the equip request runs every button is disabled and no new drag starts (DRG-06, DRG-08).
**Where**: `game/e2e/dragEquip.spec.js`
**Read first**: `game/e2e/dragEquip.spec.js:11-44` (fixtures, `startGame` returns `calls`, `settle`), `:264-275` (a test that adds its own `page.route` after `startGame`), `game/e2e/equipmentUi.spec.js:37-51` (the same fixture: Kael is the leader, `Dano de clique: 4.6` with his rare weapon and ring, `1.1` with the ring only), `game/e2e/support/fakeBackend.js:753-760` (the handler records each request in `calls`)
**Depends on**: T9
**Requirement**: DRG-06, DRG-08

**Contract**: no production change. Two new tests at the end of `test.describe('Drag to equip', ...)` (before its closing `});`, line 309 before T9's insertions). `route.fallback()` hands the request on to the `mockBackend` handler, which records it in `calls` and answers it.

```js
    test('a drop on the leader updates the attribute panel', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 4.6');

        await drag(page, page.getByTestId('equip-slot-kael-WEAPON'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-slot-lyra-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 1.1');

        await drag(page, page.getByTestId('equip-slot-lyra-WEAPON'), page.getByTestId('equip-hero-kael'));

        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
        await expect(page.getByTestId('leader-stats').locator('.leader-stats-title')).toHaveText('Atributos de Kael Raizférrea');
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 4.6');
    });

    test('while the equip runs every button is disabled and no new drag starts', async ({ page }) => {
        const calls = await startGame(page);
        let answer;
        const held = new Promise((resolve) => { answer = resolve; });

        //  Holds the equip of a1 until the test lets it go, then hands it to the fake backend
        await page.route('**/api/equipment/a1/equip', async (route) => {
            await held;
            await route.fallback();
        });
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-piece-c1')).toBeDisabled();
        await expect(page.locator('.hero-body button:enabled')).toHaveCount(0);

        await drag(page, page.getByTestId('equip-piece-c1'), page.getByTestId('equip-hero-lyra'), { release: false });

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);

        await page.mouse.up();
        answer();

        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        await expect(page.getByTestId('equip-piece-c1')).toBeEnabled();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].path).toBe('/equipment/a1/equip');
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });
```

**Steps**:

1. Add the two tests.
2. Run the gate.

**Tests**: e2e
**Test cases**:

- `a drop on the leader updates the attribute panel`: `stat-clickDamage` `'Dano de clique: 4.6'`; drag Kael's weapon to Lyra → `equip-slot-lyra-WEAPON` `'Raro Arma +0'`, `'Dano de clique: 1.1'`; drag it back to Kael (the leader) → `equip-slot-kael-WEAPON` `'Raro Arma +0'`, title `'Atributos de Kael Raizférrea'`, `'Dano de clique: 4.6'`.
- `while the equip runs every button is disabled and no new drag starts`: equip of a1 held; drop a1 on Lyra → `equip-piece-c1` disabled, no enabled button under `.hero-body`; drag c1 to Lyra → no `piece-drag-ghost`; let the equip go → `equip-slot-lyra-AMULET` `'Épico Amuleto +3'`, `equip-piece-c1` enabled; exactly one equip request, `'/equipment/a1/equip'`, body `{ heroId: 'lyra' }`.

**Gate**: full - `cd game && npx playwright test e2e/dragEquip.spec.js`
**Done when**:

- [x] `cd game && npx playwright test e2e/dragEquip.spec.js` passes with 22 tests.

**Commit**: `test(game): cover the leader panel and the busy screen of a drop end to end`

---

### T11: e2e of pointercancel, the swallowed click and the other mouse buttons [x]

**Owner**: test-engineer
**Goal**: Prove in Chromium that a `pointercancel` ends the drag with no request, that the click after a drag released on its own tile opens nothing (a scenario that fails without the click swallow), and that the right and middle buttons start no drag (DRG-11, DRG-13, DRG-26).
**Where**: `game/e2e/dragEquip.spec.js`
**Read first**: `game/e2e/dragEquip.spec.js:46-67` (`centre`, `drag`), `:240-253` (`a short press still opens the piece`, the manual `mouse.down` / `mouse.up` pattern), `views/dragEquip.js:22-34` (`swallowNextClick`) and `:204-210` (`cancel`)
**Depends on**: T10
**Requirement**: DRG-11, DRG-13, DRG-26

**Contract**: no production change. Three new tests at the end of `test.describe('Drag to equip', ...)`, after T10's tests.

```js
    test('a pointercancel ends the drag and sends nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        //  Keeps the pointerId of the press, so the cancel below is the one the browser would send for it
        await page.evaluate(() => {
            document.addEventListener('pointerdown', (event) => { window.__pressId = event.pointerId; }, { capture: true });
        });

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'), { release: false });

        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);

        //  No mouse gesture makes Chromium cancel a pointer, so the test sends the event the browser sends when it takes the gesture
        await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel', {
            bubbles: true, pointerId: window.__pressId, isPrimary: true, pointerType: 'mouse'
        })));

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
        await expect(page.locator('.is-drop-target')).toHaveCount(0);
        await expect(page.getByTestId('equip-piece-a1')).not.toHaveClass(/is-dragging/);

        //  The button comes up over Lyra: after the cancel this is no drop
        await page.mouse.up();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equip-slot-lyra-AMULET').locator('.piece-empty')).toHaveText('vazio');
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
    });

    test('the click after a drag released on its own tile opens nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        const tile = await centre(page.getByTestId('equip-piece-a1'));

        //  Press and release on the same tile: the browser clicks that tile, so only the swallow keeps the piece detail closed
        await page.mouse.move(tile.x, tile.y);
        await page.mouse.down();
        await page.mouse.move(tile.x + 30, tile.y, { steps: 4 });

        await expect(page.getByTestId('piece-drag-ghost')).toBeVisible();

        await page.mouse.move(tile.x, tile.y, { steps: 4 });
        await page.mouse.up();

        await settle(page);
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
        expect(equipCalls(calls)).toHaveLength(0);

        await page.getByTestId('equip-piece-a1').click();

        await expect(page.getByTestId('piece-detail')).toBeVisible();
    });

    test('the right and the middle button start no drag', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        const tile = await centre(page.getByTestId('equip-piece-a1'));
        const lyra = await centre(page.getByTestId('equip-hero-lyra'));

        for (const button of [ 'right', 'middle' ])
        {
            await page.mouse.move(tile.x, tile.y);
            await page.mouse.down({ button });
            await page.mouse.move(lyra.x, lyra.y, { steps: 8 });

            await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
            await expect(page.getByTestId('equip-hero-lyra')).not.toHaveClass(/is-drop-target/);

            await page.mouse.up({ button });
        }

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equip-piece-a1')).toBeVisible();
    });
```

**Steps**:

1. Add the three tests.
2. Run the gate.
3. Sensor check: delete the line `swallowNextClick();` (`dragEquip.js:161`), run `cd game && npx playwright test e2e/dragEquip.spec.js -g "released on its own tile"` and confirm it fails on `piece-detail` (count 1). Restore the line; `git diff game/src` must print nothing. Same port caveat as T9 step 4.

**Tests**: e2e
**Test cases**:

- `a pointercancel ends the drag and sends nothing`: drag a1 over Lyra, held → Lyra lit; `pointercancel` for the press → no ghost, no `.is-drop-target`, a1 without `is-dragging`; button up over Lyra → 0 equip requests, `equip-slot-lyra-AMULET` `'vazio'`, no piece detail.
- `the click after a drag released on its own tile opens nothing`: press a1, move 30 px right (ghost visible), move back, release on a1 → no piece detail, no ghost, 0 equip requests; a click on a1 afterwards → piece detail visible.
- `the right and the middle button start no drag`: for `right` then `middle`: press on a1, move onto Lyra → no ghost, Lyra not lit; afterwards 0 equip requests and a1 still in the bag.

**Gate**: full - `cd game && npx playwright test e2e/dragEquip.spec.js`
**Done when**:

- [x] `cd game && npx playwright test e2e/dragEquip.spec.js` passes with 25 tests.
- [x] With `dragEquip.js:161` deleted, `the click after a drag released on its own tile opens nothing` fails; the line is restored and `git diff game/src` is empty.

**Commit**: `test(game): cover pointercancel, the swallowed click and the other buttons end to end`

---

### T12: e2e of a second finger during a touch drag [x]

**Owner**: test-engineer
**Goal**: Prove in Chromium, with a real two-finger touch sequence, that a second pointer pressed while a drag runs starts nothing and that the first finger's drop still equips (DRG-25).
**Where**: `game/e2e/dragEquip.spec.js`
**Read first**: `game/e2e/dragEquip.spec.js:69-87` (`touchDrag`: CDP `Input.dispatchTouchEvent`), `:311-347` (`test.describe('Drag to equip by touch', ...)` with `test.use({ hasTouch: true })`)
**Depends on**: T11
**Requirement**: DRG-25

**Contract**: no production change. One new test at the end of `test.describe('Drag to equip by touch', ...)`. CDP takes, in each `touchStart` and `touchMove`, the full list of fingers that are down; each finger keeps its `id`, and only the changed one produces a pointer event. `touchEnd` takes an empty list and lifts every finger.

```js
    test('a second finger is ignored while a piece is dragged', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        //  Records the pointerId of every press, to prove the browser saw two fingers
        await page.evaluate(() => {
            window.__downs = [];
            document.addEventListener('pointerdown', (event) => { window.__downs.push(event.pointerId); }, { capture: true });
        });

        const cdp = await page.context().newCDPSession(page);
        const start = await centre(page.getByTestId('equip-piece-a1'));
        const lyra = await centre(page.getByTestId('equip-hero-lyra'));
        const second = await centre(page.getByTestId('equip-piece-c1'));

        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: start.x, y: start.y, id: 0 } ] });

        for (let step = 1; step <= 8; step++)
        {
            const x = start.x + (lyra.x - start.x) * step / 8;
            const y = start.y + (lyra.y - start.y) * step / 8;

            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x, y, id: 0 } ] });
        }

        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);

        //  The first finger holds a1 over Lyra; a second finger goes down on c1 and slides 30 px
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: lyra.x, y: lyra.y, id: 0 }, { x: second.x, y: second.y, id: 1 } ] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x: lyra.x, y: lyra.y, id: 0 }, { x: second.x + 30, y: second.y, id: 1 } ] });

        expect(await page.evaluate(() => new Set(window.__downs).size)).toBe(2);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(1);
        await expect(page.getByTestId('equip-piece-c1')).not.toHaveClass(/is-dragging/);
        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);

        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        await expect(page.getByTestId('equip-piece-c1')).toBeVisible();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].path).toBe('/equipment/a1/equip');
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });
```

**Steps**:

1. Add the test.
2. Run the gate.
3. If the assertion `new Set(window.__downs).size` is not `2`, the harness did not make a second finger: stop and report it with the value seen. Do not change any assertion of the test.

**Tests**: e2e
**Test cases**:

- `a second finger is ignored while a piece is dragged`: first finger drags a1 onto Lyra (lit); second finger down on c1 and moved 30 px → the page saw 2 distinct pointerIds, exactly 1 `piece-drag-ghost`, c1 without `is-dragging`, Lyra still lit; both fingers up → `equip-slot-lyra-AMULET` `'Épico Amuleto +3'`, c1 still in the bag, exactly one equip request `'/equipment/a1/equip'` with body `{ heroId: 'lyra' }`.

**Gate**: full - `cd game && npx playwright test e2e/dragEquip.spec.js`
**Done when**:

- [x] `cd game && npx playwright test e2e/dragEquip.spec.js` passes with 26 tests.

**Commit**: `test(game): cover a second finger during a touch drag end to end`

---

### T13: e2e of the scroll down and of the light under a still pointer [x]

**Owner**: test-engineer
**Goal**: Prove in Chromium that a piece held near the bottom edge scrolls the window down to its end and can then be dropped on the last hero, and that the highlight moves to the block that scrolls under a still pointer (DRG-28, DRG-30).
**Where**: `game/e2e/dragEquip.spec.js`
**Read first**: `game/e2e/dragEquip.spec.js:349-403` (`test.describe('Drag to equip edge scroll', ...)`: five owned heroes `ALL_FIVE`, the window `.hero-window`, scrolling it with `win.evaluate`), `views/dragEquip.js:95-117` (`steer`: the tick scrolls and calls `light`)
**Depends on**: T12
**Requirement**: DRG-28, DRG-30

**Contract**: no production change. Two new tests at the end of `test.describe('Drag to equip edge scroll', ...)`. The window opens at `scrollTop` 0; Kael's block is on screen and his weapon `w1` is draggable onto any other hero. The last `.equip-hero` block sits right above the bag, so it is on screen when the window is scrolled to its end.

```js
    test('scrolls the window down while a piece is held near its bottom edge', async ({ page }) => {
        const calls = await startGame(page, { copies: ALL_FIVE });
        await openEquipment(page);

        const win = page.locator('.hero-window');
        const end = await win.evaluate((node) => node.scrollHeight - node.clientHeight);

        expect(end).toBeGreaterThan(0);
        expect(await win.evaluate((node) => node.scrollTop)).toBe(0);

        const box = await win.boundingBox();

        await drag(page, page.getByTestId('equip-slot-kael-WEAPON'), { x: box.x + box.width / 2, y: box.y + box.height - 10 }, { release: false });

        await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBeGreaterThanOrEqual(end - 1);

        const last = page.locator('.equip-hero').last();
        const heroId = await last.getAttribute('data-drop-hero');
        const target = await centre(last);

        expect(heroId).not.toBe('kael');

        await page.mouse.move(target.x, target.y, { steps: 4 });
        await page.mouse.up();

        await expect(page.getByTestId(`equip-slot-${heroId}-WEAPON`)).toHaveAttribute('aria-label', 'Raro Arma +0');
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId });
    });

    test('the light follows the block that scrolls under a still pointer', async ({ page }) => {
        await startGame(page, { copies: ALL_FIVE });
        await openEquipment(page);

        const win = page.locator('.hero-window');

        await win.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        await page.getByTestId('equip-piece-a1').scrollIntoViewIfNeeded();

        const box = await win.boundingBox();
        const litHero = () => page.evaluate(() => document.querySelector('.is-drop-target')?.getAttribute('data-drop-hero') ?? null);

        //  30 px below the top edge is inside the band: the window scrolls up under the pointer, which does not move again
        await drag(page, page.getByTestId('equip-piece-a1'), { x: box.x + box.width / 2, y: box.y + 30 }, { release: false });

        const first = await litHero();

        await expect.poll(litHero).not.toBe(first);
        await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBe(0);

        //  Released in the letterbox, outside every block: no drop
        await page.mouse.move(20, 360, { steps: 4 });
        await page.mouse.up();
    });
```

**Steps**:

1. Add the two tests.
2. Run the gate.
3. Sensor check: delete the line `light(heroUnder(last.x, last.y, piece));` inside the timer of `steer` (`dragEquip.js:114`), run `cd game && npx playwright test e2e/dragEquip.spec.js -g "still pointer"` and confirm it fails on `expect.poll(litHero)`. Restore the line; `git diff game/src` must print nothing. Same port caveat as T9 step 4.
4. Run the whole e2e suite once (`cd game && npx playwright test`) and report any failure outside `dragEquip.spec.js` as "not caused by this task" with the failing test name.

**Tests**: e2e
**Test cases**:

- `scrolls the window down while a piece is held near its bottom edge`: five heroes, window at `scrollTop` 0 with something to scroll; hold Kael's weapon 10 px above the window's bottom edge → `scrollTop` reaches `scrollHeight - clientHeight` (within 1 px); drop on the last `.equip-hero` block (not Kael) → its `equip-slot-<heroId>-WEAPON` `'Raro Arma +0'`, one equip request with body `{ heroId }`.
- `the light follows the block that scrolls under a still pointer`: five heroes, window at its end; hold a1 30 px below the window's top edge and do not move → the id of the lit hero block changes at least once while the window scrolls; `scrollTop` reaches 0.

**Gate**: full - `cd game && npm test && npx playwright test e2e/dragEquip.spec.js e2e/equipment.spec.js e2e/equipmentUi.spec.js e2e/bulkSell.spec.js`
**Done when**:

- [x] `cd game && npx playwright test e2e/dragEquip.spec.js` passes with 28 tests, and `equipment.spec.js`, `equipmentUi.spec.js` and `bulkSell.spec.js` pass unchanged.
- [x] With `dragEquip.js:114` deleted, `the light follows the block that scrolls under a still pointer` fails; the line is restored and `git diff game/src` is empty.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): cover the scroll down and the light under a still pointer end to end`

---

### T14: Unit tests of a leave and re-entry of each edge band [x]

**Owner**: test-engineer
**Goal**: A pointer that leaves an edge band and comes back scrolls the window 8 px per 16 ms, not faster, and stops at the release, in the top band and in the bottom band (DRG-27, DRG-28, DRG-29; Verifier round 2 survivor S9, gap 1).
**Where**: `game/src/adapters/phaser/views/dragEquip.test.js`
**Read first**: `views/dragEquip.js:96-117` (`steer`: `:105` clears the timer when the direction changes), `:144-164` (`finish`), `views/dragEquip.test.js:340-356` (`layOut`, the edge describe), `:465-493` (one pass of leave and release, which cannot see a leaked timer), `validation.md` "Fix 1"
**Depends on**: None
**Requirement**: DRG-27, DRG-28, DRG-29

**Contract**: no production change. Two new `it` at the end of `describe('attachDragToEquip edge scroll', ...)`, after `the light follows the block that scrolls under a still pointer` (ends at `dragEquip.test.js:528`):

```js
    it('leaving and re-entering the top band scrolls 8 px per tick and stops at the release', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 30);
        vi.advanceTimersByTime(16);
        pointer('pointermove', document, 120, 300);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);

        pointer('pointermove', document, 120, 30);

        const before = scroller.scrollTop;

        vi.advanceTimersByTime(16);
        expect(scroller.scrollTop).toBe(before - 8);

        vi.advanceTimersByTime(32);
        expect(scroller.scrollTop).toBe(before - 24);

        pointer('pointerup', document, 120, 30);

        const released = scroller.scrollTop;

        vi.advanceTimersByTime(64);
        expect(scroller.scrollTop).toBe(released);
    });

    it('leaving and re-entering the bottom band scrolls 8 px per tick and stops at the release', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 570);
        vi.advanceTimersByTime(16);
        pointer('pointermove', document, 120, 300);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(208);

        pointer('pointermove', document, 120, 570);

        const before = scroller.scrollTop;

        vi.advanceTimersByTime(16);
        expect(scroller.scrollTop).toBe(before + 8);

        vi.advanceTimersByTime(32);
        expect(scroller.scrollTop).toBe(before + 24);

        pointer('pointerup', document, 120, 570);

        const released = scroller.scrollTop;

        vi.advanceTimersByTime(64);
        expect(scroller.scrollTop).toBe(released);
    });
```

**Steps**:

1. Insert the two cases.
2. Run the gate.
3. Sensor check: delete the line `clearInterval(timer);` at `dragEquip.js:105` (inside `steer`), run `cd game && npx vitest run src/adapters/phaser/views/dragEquip.test.js` and confirm both new cases fail (the window moves 16 px per tick after the re-entry, and keeps moving after the release). Restore the line; `git diff game/src` must print nothing.

**Tests**: unit
**Test cases** (`describe('attachDragToEquip edge scroll', ...)`):

- `leaving and re-entering the top band scrolls 8 px per tick and stops at the release`: window at 200; press, move to y 30 and advance 16 ms (192); move to y 300 and advance 16 ms (still 192); move back to y 30 → one tick is 8 px (`before - 8`), three ticks are 24 px (`before - 24`); release, then 64 ms → unchanged.
- `leaving and re-entering the bottom band scrolls 8 px per tick and stops at the release`: window at 200; move to y 570 and advance 16 ms (208); move to y 300 and advance 16 ms (still 208); move back to y 570 → one tick is 8 px (`before + 8`), three ticks are 24 px (`before + 24`); release, then 64 ms → unchanged.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The two new cases pass and every other case of `dragEquip.test.js` passes unchanged.
- [x] With `dragEquip.js:105` (`clearInterval(timer);` in `steer`) deleted both new cases fail; the line is restored and `git diff game/src` is empty.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): pin the edge scroll after a leave and re-entry of each band`

---

### T15: Unit test of a second primary pointer during a drag [x]

**Owner**: test-engineer
**Goal**: A second primary pointer of another type (a pen) that presses during a drag starts no second drag: one copy exists, counted over every copy, and only the first pointer's release drops (DRG-25; Verifier round 2 survivor S1, gap 2).
**Where**: `game/src/adapters/phaser/views/dragEquip.test.js`
**Read first**: `views/dragEquip.js:62-69` (the `pointerdown` guard, `active ||` at `:64`), `views/dragEquip.test.js:266-282` (the second pointer case, a non-primary touch), `:284-290` (the press on another tile, which reads only the first copy with `ghost()`), `validation.md` "Fix 2"
**Depends on**: T14
**Requirement**: DRG-25

**Contract**: no production change. One new `it` after `a press on another tile while one runs is ignored` (ends at `dragEquip.test.js:290`). The existing cases stay as they are; the new one counts the copies.

```js
    it('a second primary pointer of another type starts no second drag', () => {
        under = lyra.querySelector('.equip-hero-name');
        startDrag();
        pointer('pointerdown', other, 300, 300, { pointerId: 2, pointerType: 'pen' });
        pointer('pointermove', document, 340, 300, { pointerId: 2, pointerType: 'pen' });

        expect(document.querySelectorAll('[data-testid="piece-drag-ghost"]').length).toBe(1);

        pointer('pointerup', document, 340, 300, { pointerId: 2, pointerType: 'pen' });

        expect(onDrop).not.toHaveBeenCalled();
        expect(document.querySelectorAll('[data-testid="piece-drag-ghost"]').length).toBe(1);

        pointer('pointerup', document, 120, 100, { pointerId: 1 });

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith('lyra');
    });
```

**Steps**:

1. Insert the case after `dragEquip.test.js:290`.
2. Run the gate.
3. Sensor check: remove `active ||` from `dragEquip.js:64` (the line becomes `if (!event.isPrimary || event.button !== 0 || tile.disabled)`), run `cd game && npx vitest run src/adapters/phaser/views/dragEquip.test.js` and confirm the new case fails on the copy count (2 copies, expected 1). Restore the line; `git diff game/src` must print nothing.

**Tests**: unit
**Test cases** (`describe('attachDragToEquip', ...)`):

- `a second primary pointer of another type starts no second drag`: a mouse drag over Lyra's name; a pen (`isPrimary` true, `pointerId` 2) presses on `other` and moves 40 px → exactly one `piece-drag-ghost` in the document; the pen release leaves one copy and drops nothing; the mouse release over Lyra → `onDrop` once with `'lyra'`.

**Gate**: quick - `cd game && npm test`
**Done when**:

- [x] The new case passes and every other case of `dragEquip.test.js` passes unchanged.
- [x] With `dragEquip.js:64` without `active ||` the new case fails; the line is restored and `git diff game/src` is empty.
- [x] `cd game && npm test` passes.

**Commit**: `test(game): pin the second primary pointer of a drag`

---

### T16: Assert the block under the pointer in the still-pointer e2e [x]

**Owner**: test-engineer
**Goal**: The e2e of DRG-30 asserts that the lit block is the block under the pointer after the window stops, not only that some block changed (DRG-30; Verifier round 2 gap 3, minor).
**Where**: `game/e2e/dragEquip.spec.js`
**Read first**: `game/e2e/dragEquip.spec.js:634-657` (`the light follows the block that scrolls under a still pointer`, `litHero`, `box`), `views/dragEquip.js:110-117` (the timer lights `last`), `validation.md` "Gap 3"
**Depends on**: T15 (one commit at a time)
**Requirement**: DRG-30

**Contract**: no production change. In `the light follows the block that scrolls under a still pointer`, after the poll that waits for `scrollTop` 0 (`dragEquip.spec.js:652`) and before the release, add:

```js
        //  The lit block is the one under the pointer, not only some block that changed. At the top of the window the pointer is over
        //  the header (the leader panel scrolls above the heroes), so nothing is lit: null must match too
        const at = { x: box.x + box.width / 2, y: box.y + 30 };
        const underPointer = () => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-drop-hero]')?.getAttribute('data-drop-hero') ?? null, at);

        expect(await litHero()).toBe(await underPointer());
```

The first draft asserted that a block is lit at the end. The probe showed that at `scrollTop` 0 the pointer is over the header, so the correct outcome is no lit block; the assertion is the equality, which holds for `null` too.

**Steps**:

1. Add the lines above.
2. Run the gate.
3. Sensor check (optional, to show the assertion discriminates): in `dragEquip.js:114` replace `last.x, last.y` with `press.x, press.y` inside the timer, run `cd game && npx playwright test e2e/dragEquip.spec.js -g "still pointer"` with the alt port config (`C:\Users\yan_b\AppData\Local\Temp\claude\D--Developer-infinity-grove\94d4da18-9d1b-4eae-b6dc-059d4c393e29\scratchpad\playwright.alt.config.mjs`) and confirm it fails on the new assertions. Restore the line; `git diff game/src` must print nothing.

**Tests**: e2e
**Test cases**:

- `the light follows the block that scrolls under a still pointer` (strengthened): after the window is at 0, the lit hero is not null and equals the `data-drop-hero` of the block under the pointer (`document.elementFromPoint`).

**Gate**: full - `cd game && npx playwright test e2e/dragEquip.spec.js` (run on the alt port, see the Steps)
**Done when**:

- [x] `cd game && npx playwright test e2e/dragEquip.spec.js` passes with 28 tests.
- [x] The strengthened test fails with the timer lighting `press` instead of `last`; the line is restored and `git diff game/src` is empty.

**Commit**: `test(game): assert the block under the pointer in the still-pointer scroll`

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1: Drag helper | 1 new module + its test | ✅ Granular |
| T2: Edge scroll | 1 block in the same module + its tests | ✅ Granular |
| T3: Wire into renderEquipment | 1 function, 3 edits + its tests | ✅ Granular |
| T4: HeroUi.dropEquip | 1 method + 1 option + its tests | ✅ Granular |
| T5: Styles | 1 CSS block | ✅ Granular |
| T6: e2e | 1 spec file | ✅ Granular |
| T7: busy guard unit test | 1 test case | ✅ Granular |
| T8: edge band unit tests | 3 test cases | ✅ Granular |
| T9: visual rules e2e | 2 lines + 1 test | ✅ Granular |
| T10: leader panel and busy e2e | 2 tests | ✅ Granular |
| T11: cancel, click swallow, buttons e2e | 3 tests | ✅ Granular |
| T12: second finger e2e | 1 test | ✅ Granular |
| T13: scroll down and light e2e | 2 tests | ✅ Granular |
| T14: leave and re-entry of each band | 2 test cases | ✅ Granular |
| T15: second primary pointer | 1 test case | ✅ Granular |
| T16: block under the pointer e2e | 1 assertion block in 1 test | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T1 → T5 | ✅ Match |
| T6 | T2, T4, T5 | T2 → T6, T4 → T6, T5 → T6 | ✅ Match |
| T7 | None | none | ✅ Match |
| T8 | None | none | ✅ Match |
| T9 | None | none | ✅ Match |
| T10 | T9 | T9 → T10 | ✅ Match |
| T11 | T10 | T10 → T11 | ✅ Match |
| T12 | T11 | T11 → T12 | ✅ Match |
| T13 | T12 | T12 → T13 | ✅ Match |
| T14 | None | none | ✅ Match |
| T15 | T14 | T14 → T15 | ✅ Match |
| T16 | T15 | T15 → T16 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Drag helper | Drag helper | unit | unit | ✅ OK |
| T2: Edge scroll | Drag helper | unit | unit | ✅ OK |
| T3: renderEquipment | Game views | unit | unit | ✅ OK |
| T4: HeroUi.dropEquip | Game `HeroUi` | unit | unit | ✅ OK |
| T5: Styles | Stylesheet | none | none | ✅ OK |
| T6: e2e | e2e | e2e | e2e | ✅ OK |
| T7: busy guard | Game `HeroUi` (test only) | unit | unit | ✅ OK |
| T8: edge band | Drag helper (test only) | unit | unit | ✅ OK |
| T9 to T13: e2e gaps | e2e | e2e | e2e | ✅ OK |
| T14: edge band re-entry | Drag helper (test only) | unit | unit | ✅ OK |
| T15: second primary pointer | Drag helper (test only) | unit | unit | ✅ OK |
| T16: still-pointer e2e | e2e | e2e | e2e | ✅ OK |

## After the tasks

- `ui-artist` writes `game/ui-review/dragEquip.shots.js` and `.specs/features/drag-equip/ui-review.html` with the four screens of `design.md` "Visual Design", desktop and phone. Done (`7025c1c`, re-review approved `8c90f6f`); its findings were fixed in `2891ad7`, `905270a`, `751beae`, `92abd66` and accepted into the spec on 2026-11-02 (D6, DRG-15, DRG-31 to DRG-33).
- A fresh `test-engineer` runs as the Verifier and writes `validation.md`. Round 1 FAIL (`823f22f`); T7 to T13 are its fix tasks. Round 2 FAIL (`59b841c`); T14 to T16 are its fix tasks. After T16, a fresh `test-engineer` (round 3 of 3) re-verifies.
- After T13, a fresh `test-engineer` (one that did not run T7 to T13) re-verifies (round 2 of 3) against the amended spec: DRG-15 checks the 12 px corner, DRG-31 to DRG-33 are new, and the sensor repeats M7. Verifier gap 7 (DRG-20 and DRG-22 have e2e only, CSS rules) needs no task.
