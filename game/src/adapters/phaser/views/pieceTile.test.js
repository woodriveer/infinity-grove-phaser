import { describe, expect, it, vi } from 'vitest';
import { renderEmptyTile, renderPieceTile } from './pieceTile';

const piece = (rarity = 'COMMON', extra = {}) => ({ id: 'p1', slot: 'RING', rarity, refine: 0, affixes: [], heroId: null, sellPrice: 1, ...extra });
const tile = (rarity, extra, onClick = vi.fn()) => renderPieceTile(piece(rarity, extra), { testid: 'equip-piece-p1', onClick });

describe('renderPieceTile', () => {
    it('is a button with the test id, the class and the attributes of its rarity', () => {
        const node = tile('RARE');

        expect(node.tagName).toBe('BUTTON');
        expect(node.getAttribute('data-testid')).toBe('equip-piece-p1');
        expect(node.classList.contains('rarity-rare')).toBe(true);
        expect(node.getAttribute('data-rarity')).toBe('RARE');
    });

    it('carries as many gems as the rarity order says: 0, 1, 2, 3 and 4', () => {
        const gems = [ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ].map((rarity) => {
            const node = tile(rarity);

            return [ node.getAttribute('data-gems'), node.querySelectorAll('.piece-gem').length ];
        });

        expect(gems).toEqual([ [ '0', 0 ], [ '1', 1 ], [ '2', 2 ], [ '3', 3 ], [ '4', 4 ] ]);
    });

    it('gives only the EPIC tile the fantasy effect', () => {
        const effects = [ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ].map((rarity) => tile(rarity).getAttribute('data-effect'));

        expect(effects).toEqual([ null, null, null, 'fantasy', null ]);
    });

    it('shows the icon of the slot of the piece', () => {
        const srcs = [ 'WEAPON', 'ARMOR', 'RING', 'AMULET' ].map((slot) => tile('COMMON', { slot }).querySelector('img').getAttribute('src'));

        expect(srcs).toEqual([ 'assets/ui/slot-weapon.png', 'assets/ui/slot-armor.png', 'assets/ui/slot-ring.png', 'assets/ui/slot-amulet.png' ]);
    });

    it('shows +<refine> above 0 and nothing at +0', () => {
        expect(tile('COMMON', { refine: 3 }).querySelector('.piece-refine').textContent).toBe('+3');
        expect(tile('COMMON', { refine: 0 }).querySelector('.piece-refine')).toBeNull();
    });

    it('names the piece for assistive tech: Raro Arma +3', () => {
        expect(tile('RARE', { slot: 'WEAPON', refine: 3 }).getAttribute('aria-label')).toBe('Raro Arma +3');
    });

    it('draws a mark in place of the icon when its file fails to load and stays clickable', () => {
        const onClick = vi.fn();
        const node = tile('COMMON', { slot: 'WEAPON' }, onClick);

        node.querySelector('img').dispatchEvent(new Event('error'));
        node.click();

        expect(node.querySelector('img')).toBeNull();
        expect(node.querySelector('.icon-fallback').textContent).toBe('⚔');
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick with the piece', () => {
        const onClick = vi.fn();
        const node = tile('EPIC', {}, onClick);

        node.click();

        expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1', rarity: 'EPIC' }));
    });
});

describe('renderEmptyTile', () => {
    it('is a dashed disabled tile with the text vazio and the dimmed icon', () => {
        const node = renderEmptyTile('RING', { testid: 'equip-slot-kael-RING' });

        expect(node.classList.contains('is-empty')).toBe(true);
        expect(node.disabled).toBe(true);
        expect(node.querySelector('.piece-empty').textContent).toBe('vazio');
        expect(node.getAttribute('data-testid')).toBe('equip-slot-kael-RING');
        expect(node.querySelector('img').getAttribute('src')).toBe('assets/ui/slot-ring.png');
    });
});
