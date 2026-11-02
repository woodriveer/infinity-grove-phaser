# Drag to Equip Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Spec**: `.specs/features/drag-equip/spec.md`
**Design**: `.specs/features/drag-equip/design.md`
**Status**: Approved (owner confirmed D1 to D8 at their defaults); implementing

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
| e2e | e2e (Playwright, fake backend) | Every player-visible criterion: mouse drop, replace, move between heroes, feedback, each cancel path, failure, short press, `Equipar em`, selection mode, real touch drag and tap, edge scroll | `game/e2e/dragEquip.spec.js` | `cd game && npx playwright test e2e/dragEquip.spec.js` |

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

### T2: Edge scroll while dragging [ ]

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

- [ ] The 11 new cases pass and the 23 cases of T1 still pass.
- [ ] `cd game && npm test` passes.

**Commit**: `feat(game): scroll the equipment window while a piece is dragged near its edge`

---

### T3: Wire the drag into renderEquipment [ ]

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

- [ ] The 6 new cases pass; every existing case of `equipmentView.test.js` passes unchanged.
- [ ] `cd game && npm test` passes.

**Commit**: `feat(game): make the equipment list tiles draggable onto hero blocks`

---

### T4: HeroUi.dropEquip [ ]

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

- [ ] The 11 new cases pass; every existing case of `HeroUi.test.js` passes unchanged.
- [ ] `cd game && npm test` passes.

**Commit**: `feat(game): equip a piece dropped on a hero`

---

### T5: Styles of the drag [ ]

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

- [ ] The block is in `style.css` after `.piece-tile.is-locked`.
- [ ] `cd game && npm test && npm run build` passes.

**Commit**: `style(game): show the dragged piece and the hero it lands on`

---

### T6: e2e of the drag to equip [ ]

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

- [ ] The 19 cases of `dragEquip.spec.js` pass, and `equipment.spec.js`, `equipmentUi.spec.js` and `bulkSell.spec.js` pass unchanged.
- [ ] `cd game && npm test` passes.

**Commit**: `test(game): cover the drag to equip end to end`

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

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| ---- | ---------------------- | ------------- | ------ |
| T1 | None | none | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1 | T1 → T3 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T1 → T5 | ✅ Match |
| T6 | T2, T4, T5 | T2 → T6, T4 → T6, T5 → T6 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| ---- | --------------------------- | --------------- | --------- | ------ |
| T1: Drag helper | Drag helper | unit | unit | ✅ OK |
| T2: Edge scroll | Drag helper | unit | unit | ✅ OK |
| T3: renderEquipment | Game views | unit | unit | ✅ OK |
| T4: HeroUi.dropEquip | Game `HeroUi` | unit | unit | ✅ OK |
| T5: Styles | Stylesheet | none | none | ✅ OK |
| T6: e2e | e2e | e2e | e2e | ✅ OK |

## After the tasks

- `ui-artist` writes `game/ui-review/dragEquip.shots.js` and `.specs/features/drag-equip/ui-review.html` with the four screens of `design.md` "Visual Design", desktop and phone; findings become tasks T7 onward in this file.
- A fresh `test-engineer` runs as the Verifier and writes `validation.md`.
