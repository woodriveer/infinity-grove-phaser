import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachDragToEquip, DRAG_THRESHOLD_PX, EDGE_PX, SCROLL_STEP_PX, SCROLL_TICK_MS } from './dragEquip';
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

describe('attachDragToEquip', () => {
    it('marks the tile draggable', () => {
        expect(tile.getAttribute('data-draggable')).toBe('true');
        expect(DRAG_THRESHOLD_PX).toBe(6);
    });

    it('a move of less than 6 px is no drag', () => {
        pointer('pointerdown', tile, 100, 100);
        pointer('pointermove', document, 104, 104);

        expect(ghost()).toBeNull();
        expect(tile.classList.contains('is-dragging')).toBe(false);
    });

    it('a move of 6 px starts the drag', () => {
        pointer('pointerdown', tile, 100, 100);
        pointer('pointermove', document, 106, 100);

        expect(ghost()).not.toBeNull();
        expect(ghost().parentNode).toBe(document.body);
        expect(tile.classList.contains('is-dragging')).toBe(true);
        expect(document.body.classList.contains('piece-dragging')).toBe(true);
    });

    it('the ghost is a copy of the tile at the pointer', () => {
        startDrag();
        pointer('pointermove', document, 150, 220);

        expect(ghost().style.left).toBe('150px');
        expect(ghost().style.top).toBe('220px');
        expect([ 'piece-tile', 'rarity-epic', 'piece-drag-ghost' ].every((name) => ghost().classList.contains(name))).toBe(true);
        expect(ghost().getAttribute('aria-hidden')).toBe('true');
        expect(ghost().getAttribute('tabindex')).toBe('-1');
        expect(ghost().hasAttribute('data-draggable')).toBe(false);
        expect(document.querySelectorAll('[data-testid="equip-piece-a1"]').length).toBe(1);
    });

    it('the hero under the pointer is judged at the pointer, not at the copy beside it', () => {
        startDrag();
        pointer('pointermove', document, 150, 220);

        expect(document.elementFromPoint).toHaveBeenLastCalledWith(150, 220);
    });

    it('the ghost takes the scale of the panel the tile sits in', () => {
        //  A panel shown at 40%: the tile lays out 60 px wide and renders 24 px wide
        Object.defineProperty(tile, 'offsetWidth', { configurable: true, value: 60 });
        tile.getBoundingClientRect = () => ({ width: 24, height: 24, top: 0, left: 0, right: 24, bottom: 24 });
        startDrag();

        expect(ghost().style.getPropertyValue('--ghost-scale')).toBe('0.4');
    });

    it('lights the hero under the pointer and its slot of the piece', () => {
        under = lyra.querySelector('.equip-hero-name');
        startDrag();

        expect(lyra.classList.contains('is-drop-target')).toBe(true);
        expect(document.querySelector('[data-testid="equip-slot-lyra-AMULET"]').classList.contains('is-drop-slot')).toBe(true);
        expect(document.querySelector('[data-testid="equip-slot-lyra-RING"]').classList.contains('is-drop-slot')).toBe(false);
        expect(kael.classList.contains('is-drop-target')).toBe(false);
    });

    it('moves the light to the next hero', () => {
        under = lyra.querySelector('.equip-hero-name');
        startDrag();
        under = kael.querySelector('.equip-hero-name');
        pointer('pointermove', document, 130, 100);

        expect(kael.classList.contains('is-drop-target')).toBe(true);
        expect(document.querySelector('[data-testid="equip-slot-kael-AMULET"]').classList.contains('is-drop-slot')).toBe(true);
        expect(lyra.classList.contains('is-drop-target')).toBe(false);
        expect(lyra.querySelector('.is-drop-slot')).toBeNull();
    });

    it('the light goes when the pointer leaves every hero', () => {
        under = lyra.querySelector('.equip-hero-name');
        startDrag();
        under = bag;
        pointer('pointermove', document, 130, 100);

        expect(document.querySelector('.is-drop-target')).toBeNull();
        expect(document.querySelector('.is-drop-slot')).toBeNull();
    });

    it('the ghost is dimmed over no hero and full over a valid one', () => {
        under = bag;
        startDrag();

        expect(ghost().classList.contains('is-no-target')).toBe(true);

        under = lyra.querySelector('.equip-hero-name');
        pointer('pointermove', document, 130, 100);

        expect(ghost().classList.contains('is-no-target')).toBe(false);

        under = bag;
        pointer('pointermove', document, 140, 100);

        expect(ghost().classList.contains('is-no-target')).toBe(true);
    });

    it('the ghost is dimmed over the hero who wears the piece', () => {
        document.body.innerHTML = '';
        setup(amulet('kael'));
        under = kael.querySelector('.equip-hero-name');
        startDrag();

        expect(ghost().classList.contains('is-no-target')).toBe(true);
    });

    it('does not light the hero who wears the piece', () => {
        document.body.innerHTML = '';
        setup(amulet('kael'));
        under = kael.querySelector('.equip-hero-name');
        startDrag();

        expect(kael.classList.contains('is-drop-target')).toBe(false);
    });

    it('a release over a valid hero drops on it', () => {
        under = lyra.querySelector('[data-testid="equip-slot-lyra-RING"]');
        startDrag();
        pointer('pointerup', document, 120, 100);

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith('lyra');
    });

    it('a release over the bag drops nothing', () => {
        under = bag;
        startDrag();
        pointer('pointerup', document, 120, 100);

        expect(onDrop).not.toHaveBeenCalled();
    });

    it('a release outside the page drops nothing', () => {
        under = null;
        startDrag();
        pointer('pointerup', document, 120, 100);

        expect(onDrop).not.toHaveBeenCalled();
    });

    it('a release on the wearer drops nothing', () => {
        document.body.innerHTML = '';
        setup(amulet('kael'));
        under = kael;
        startDrag();
        pointer('pointerup', document, 120, 100);

        expect(onDrop).not.toHaveBeenCalled();
    });

    it('a pointercancel ends the drag with no drop', () => {
        under = lyra;
        startDrag();
        pointer('pointercancel', document, 120, 100);

        expect(onDrop).not.toHaveBeenCalled();
        expect(ghost()).toBeNull();
        expect(lyra.classList.contains('is-drop-target')).toBe(false);
    });

    it('the end of a drag cleans every mark', () => {
        under = lyra;
        startDrag();
        pointer('pointerup', document, 120, 100);

        expect(ghost()).toBeNull();
        expect(tile.classList.contains('is-dragging')).toBe(false);
        expect(document.body.classList.contains('piece-dragging')).toBe(false);
        expect(document.querySelector('.is-drop-target, .is-drop-slot')).toBeNull();
    });

    it('the click after a drag does nothing and the next one opens the piece', async () => {
        startDrag();
        pointer('pointerup', document, 120, 100);
        tile.click();

        expect(onClick).not.toHaveBeenCalled();

        await nextTask();
        tile.click();

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('a short press stays a click', () => {
        pointer('pointerdown', tile, 100, 100);
        pointer('pointermove', document, 103, 100);
        pointer('pointerup', document, 103, 100);
        tile.click();

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onDrop).not.toHaveBeenCalled();
    });

    it('a second pointer is ignored', () => {
        under = lyra;
        startDrag();
        pointer('pointerdown', other, 300, 300, { pointerId: 2, isPrimary: false });
        pointer('pointermove', document, 340, 300, { pointerId: 2 });

        expect(document.querySelectorAll('[data-testid="piece-drag-ghost"]').length).toBe(1);

        pointer('pointerup', document, 340, 300, { pointerId: 2 });

        expect(onDrop).not.toHaveBeenCalled();

        pointer('pointerup', document, 120, 100, { pointerId: 1 });

        expect(onDrop).toHaveBeenCalledTimes(1);
        expect(onDrop).toHaveBeenCalledWith('lyra');
    });

    it('a press on another tile while one runs is ignored', () => {
        pointer('pointerdown', tile, 100, 100);
        pointer('pointerdown', other, 300, 300, { pointerId: 1 });
        pointer('pointermove', document, 340, 300);

        expect(ghost().getAttribute('data-slot')).toBe('AMULET');
    });

    it('the right button starts no drag', () => {
        pointer('pointerdown', tile, 100, 100, { button: 2 });
        pointer('pointermove', document, 140, 100);

        expect(ghost()).toBeNull();
    });

    it('a disabled tile starts no drag', () => {
        tile.disabled = true;
        startDrag();

        expect(ghost()).toBeNull();
    });

    it('a touch drag follows the same rules', () => {
        under = lyra;
        pointer('pointerdown', tile, 100, 100, { pointerType: 'touch' });
        pointer('pointermove', document, 104, 104, { pointerType: 'touch' });

        expect(ghost()).toBeNull();

        pointer('pointermove', document, 106, 100, { pointerType: 'touch' });

        expect(ghost()).not.toBeNull();

        pointer('pointerup', document, 106, 100, { pointerType: 'touch' });

        expect(onDrop).toHaveBeenCalledWith('lyra');
    });

    it('a pen drag follows the same rules', () => {
        under = lyra;
        pointer('pointerdown', tile, 100, 100, { pointerType: 'pen' });
        pointer('pointermove', document, 106, 100, { pointerType: 'pen' });
        pointer('pointerup', document, 106, 100, { pointerType: 'pen' });

        expect(onDrop).toHaveBeenCalledWith('lyra');
    });

    it('blocks the native drag of the tile', () => {
        const event = new Event('dragstart', { cancelable: true });

        tile.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
    });
});

describe('attachDragToEquip edge scroll', () => {
    //  The window spans y 0 to 600 on screen; it starts scrolled to 200
    const layOut = (height = 600) => {
        const scroller = document.querySelector('.hero-window');

        scroller.getBoundingClientRect = () => ({ top: 0, bottom: height, left: 0, right: 900, width: 900, height });
        scroller.scrollTop = 200;

        return scroller;
    };

    beforeEach(() => vi.useFakeTimers());
    //  Runs the pending fake timers first, so the click guard of a drag ended under fake timers is removed before real timers come back
    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('exports the edge numbers', () => {
        expect(EDGE_PX).toBe(40);
        expect(SCROLL_STEP_PX).toBe(8);
        expect(SCROLL_TICK_MS).toBe(16);
    });

    it('scrolls up near the top edge', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 30);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);

        vi.advanceTimersByTime(48);

        expect(scroller.scrollTop).toBe(168);
    });

    it('scrolls down near the bottom edge', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 570);
        vi.advanceTimersByTime(32);

        expect(scroller.scrollTop).toBe(216);
    });

    it('40 px from the top scrolls and 41 px does not', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 41);
        vi.advanceTimersByTime(32);

        expect(scroller.scrollTop).toBe(200);

        pointer('pointermove', document, 120, 40);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);
    });

    it('40 px from the bottom scrolls and 41 px does not', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 559);
        vi.advanceTimersByTime(32);

        expect(scroller.scrollTop).toBe(200);

        pointer('pointermove', document, 120, 560);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(208);
    });

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

    it('keeps scrolling while the pointer moves inside the band', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 30);
        vi.advanceTimersByTime(8);
        pointer('pointermove', document, 125, 32);
        vi.advanceTimersByTime(8);

        expect(scroller.scrollTop).toBe(192);
    });

    it('stops when the pointer leaves the band', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 30);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);

        pointer('pointermove', document, 120, 300);
        vi.advanceTimersByTime(64);

        expect(scroller.scrollTop).toBe(192);
    });

    it('stops when the drag ends', () => {
        const scroller = layOut();

        startDrag();
        pointer('pointermove', document, 120, 30);
        vi.advanceTimersByTime(16);

        expect(scroller.scrollTop).toBe(192);

        pointer('pointerup', document, 120, 30);
        vi.advanceTimersByTime(64);

        expect(scroller.scrollTop).toBe(192);
    });

    it('does not scroll a window with no height', () => {
        const scroller = layOut(0);

        startDrag();
        pointer('pointermove', document, 120, 0);
        vi.advanceTimersByTime(64);

        expect(scroller.scrollTop).toBe(200);
    });

    it('a press that is no drag never scrolls', () => {
        const scroller = layOut();

        pointer('pointerdown', tile, 100, 30);
        pointer('pointermove', document, 102, 30);
        vi.advanceTimersByTime(64);

        expect(scroller.scrollTop).toBe(200);
    });

    it('the light follows the block that scrolls under a still pointer', () => {
        layOut();
        under = lyra;
        startDrag();
        pointer('pointermove', document, 120, 30);

        expect(lyra.classList.contains('is-drop-target')).toBe(true);

        under = kael;
        vi.advanceTimersByTime(16);

        expect(kael.classList.contains('is-drop-target')).toBe(true);
        expect(lyra.classList.contains('is-drop-target')).toBe(false);
    });
});
