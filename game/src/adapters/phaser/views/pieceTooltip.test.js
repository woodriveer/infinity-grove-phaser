import { describe, expect, it } from 'vitest';
import { attachPieceTooltip, tooltipPlace } from './pieceTooltip';

//  A host of 1000 unscaled px; the tooltip is 200 x 100; the tile 60 x 60
const host = { left: 0, top: 0, width: 1000 };
const tooltip = { width: 200, height: 100 };
const tile = (left, top) => ({ left, top, width: 60, height: 60, bottom: top + 60 });

describe('tooltipPlace', () => {
    it('centres the tooltip over the tile and puts it above', () => {
        expect(tooltipPlace({ tile: tile(470, 300), host, tooltip, scale: 1 })).toEqual({ left: 400, top: 192 });
    });

    it('shifts a tooltip that would leave the host on the left and on the right', () => {
        expect(tooltipPlace({ tile: tile(0, 300), host, tooltip, scale: 1 }).left).toBe(8);
        expect(tooltipPlace({ tile: tile(940, 300), host, tooltip, scale: 1 }).left).toBe(792);
    });

    it('puts the tooltip below the tile when there is no room above', () => {
        expect(tooltipPlace({ tile: tile(470, 20), host, tooltip, scale: 1 }).top).toBe(88);
    });

    it('converts the rectangles of a scaled game back to host pixels', () => {
        //  The game is drawn at half size: the rectangles are half of the host pixels
        const half = { left: 100, top: 100, width: 500 };
        const small = { left: 335, top: 250, width: 30, height: 30, bottom: 280 };
        const result = tooltipPlace({ tile: small, host: { ...half, width: 1000 }, tooltip, scale: 2 });

        expect(result).toEqual({ left: 400, top: 192 });
    });
});

describe('attachPieceTooltip in a panel', () => {
    const piece = { id: 'r1', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [ { type: 'CRIT_CHANCE', value: 4 } ], heroId: null };

    it('puts the tooltip in the panel, outside the scroll area, and removes it on leave', () => {
        const panel = document.createElement('div');
        const scroll = document.createElement('div');
        const tileNode = document.createElement('button');

        panel.className = 'hero-panel';
        scroll.append(tileNode);
        panel.append(scroll);
        attachPieceTooltip(tileNode, piece, []);

        tileNode.dispatchEvent(new Event('pointerenter'));

        expect(panel.querySelector(':scope > [data-testid="piece-tooltip"]')).not.toBeNull();
        expect(scroll.querySelector('[data-testid="piece-tooltip"]')).toBeNull();

        tileNode.dispatchEvent(new Event('pointerleave'));

        expect(panel.querySelector('[data-testid="piece-tooltip"]')).toBeNull();
    });

    it('shows one tooltip even when the pointer enters twice', () => {
        const panel = document.createElement('div');
        const tileNode = document.createElement('button');

        panel.className = 'hero-panel';
        panel.append(tileNode);
        attachPieceTooltip(tileNode, piece, []);

        tileNode.dispatchEvent(new Event('pointerenter'));
        tileNode.dispatchEvent(new Event('pointerenter'));

        expect(panel.querySelectorAll('[data-testid="piece-tooltip"]')).toHaveLength(1);
    });
});
