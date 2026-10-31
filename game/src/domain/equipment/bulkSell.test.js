import { describe, expect, it } from 'vitest';
import {
    RARITY_ORDER, bagPieces, rarityState, selectedInBag, selectionSummary, sellNotice, sellQuestion, sellTotal, toggleRarity, toggleSelected
} from './bulkSell';

const p = (id, rarity, sellPrice, heroId = null) => ({ id, slot: 'RING', rarity, refine: 0, affixes: [], sellPrice, heroId });
const c1 = p('c1', 'COMMON', 100);
const c2 = p('c2', 'COMMON', 100);
const u1 = p('u1', 'UNCOMMON', 200);
const e1 = p('e1', 'EPIC', 400);
const w = p('w', 'RARE', 900, 'kael');

const sorted = (ids) => [ ...ids ].sort();

describe('bulkSell', () => {
    it('RARITY_ORDER lists the five rarities from COMMON to LEGENDARY', () => {
        expect(RARITY_ORDER).toEqual([ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ]);
    });

    it('bagPieces keeps the unworn pieces in their order', () => {
        expect(bagPieces([ w, c1, u1 ]).map((x) => x.id)).toEqual([ 'c1', 'u1' ]);
    });

    it('sellTotal sums the sell price of the selected pieces only', () => {
        expect(sellTotal([ c1, c2, u1, e1 ], new Set([ 'c1', 'u1' ]))).toBe(300);
        expect(sellTotal([ c1, c2, u1, e1 ], new Set())).toBe(0);
    });

    it('toggleSelected adds a missing id, removes a present one and leaves the given set alone', () => {
        const s = new Set([ 'a' ]);

        expect([ ...toggleSelected(s, 'b') ]).toEqual([ 'a', 'b' ]);
        expect(toggleSelected(s, 'a').size).toBe(0);
        expect([ ...s ]).toEqual([ 'a' ]);
    });

    it('toggleRarity selects every bag piece of the rarity and keeps the others', () => {
        expect(sorted(toggleRarity(new Set([ 'u1' ]), [ c1, c2, u1 ], 'COMMON'))).toEqual([ 'c1', 'c2', 'u1' ]);
    });

    it('toggleRarity completes a rarity that is only partly selected', () => {
        expect(sorted(toggleRarity(new Set([ 'c1' ]), [ c1, c2, u1 ], 'COMMON'))).toEqual([ 'c1', 'c2' ]);
    });

    it('toggleRarity unselects the rarity when every piece of it is selected', () => {
        expect(sorted(toggleRarity(new Set([ 'c1', 'c2', 'u1' ]), [ c1, c2, u1 ], 'COMMON'))).toEqual([ 'u1' ]);
    });

    it('toggleRarity of a rarity the bag does not hold changes nothing', () => {
        expect(sorted(toggleRarity(new Set([ 'c1' ]), [ c1, c2 ], 'LEGENDARY'))).toEqual([ 'c1' ]);
    });

    it('rarityState says whether the bag holds the rarity and whether all of it is selected', () => {
        expect(rarityState(new Set(), [ c1, c2 ], 'LEGENDARY')).toEqual({ available: false, allSelected: false });
        expect(rarityState(new Set([ 'c1' ]), [ c1, c2 ], 'COMMON')).toEqual({ available: true, allSelected: false });
        expect(rarityState(new Set([ 'c1', 'c2' ]), [ c1, c2 ], 'COMMON')).toEqual({ available: true, allSelected: true });
    });

    it('selectedInBag keeps the selected ids still in the bag, in bag order', () => {
        expect(selectedInBag(new Set([ 'c2', 'gone', 'c1', 'w' ]), [ c1, u1, w, c2 ])).toEqual([ 'c1', 'c2' ]);
    });

    it('selectionSummary reads Selecionadas and the total', () => {
        expect(selectionSummary(0, 0)).toBe('Selecionadas: 0 · Total: 0 cobre');
        expect(selectionSummary(3, 400)).toBe('Selecionadas: 3 · Total: 4 prata');
        expect(selectionSummary(1, 150)).toBe('Selecionadas: 1 · Total: 1 prata 50 cobre');
    });

    it('sellQuestion says peça for one and peças for more', () => {
        expect(sellQuestion(1, 100)).toBe('Vender 1 peça por 1 prata?');
        expect(sellQuestion(2, 300)).toBe('Vender 2 peças por 3 prata?');
    });

    it('sellNotice says vendida for one and vendidas for more', () => {
        expect(sellNotice(1, 100)).toBe('1 peça vendida por 1 prata');
        expect(sellNotice(3, 1200)).toBe('3 peças vendidas por 12 prata');
    });
});
