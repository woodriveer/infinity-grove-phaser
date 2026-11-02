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
