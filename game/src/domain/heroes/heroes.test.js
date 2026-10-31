import { describe, expect, it } from 'vitest';
import { applyDrop, availableFusions, bagEntries, bossLabel, copiesOf, ELEMENT_LABELS, fusionRows, isAscended, MAX_STARS, STARTING_CHOICES, starsClass, unlockedSlots } from './heroes';

const hero = (id, copies = {}, extra = {}) => ({
    id, name: `Hero ${id}`, element: 'FIRE', owned: Object.values(copies).some((n) => n > 0), stars: 0,
    copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies }, ...extra
});

describe('copiesOf', () => {
    it('reads the copies of a stars level and is 0 when the hero has none', () => {
        const kael = hero('kael', { 1: 2 });

        expect(copiesOf(kael, 1)).toBe(2);
        expect(copiesOf(kael, 0)).toBe(0);
        expect(copiesOf({ id: 'x' }, 0)).toBe(0);
    });

    it('reads the string keys that JSON gives', () => {
        expect(copiesOf({ copies: { '2': 5 } }, 2)).toBe(5);
    });
});

describe('bagEntries', () => {
    it('lists only the (hero, stars) pairs with at least one copy, with their counts', () => {
        const heroes = [ hero('kael', { 0: 2, 2: 1 }), hero('lyra'), hero('orina', { 3: 4 }) ];

        expect(bagEntries(heroes)).toEqual([
            { heroId: 'kael', heroName: 'Hero kael', stars: 0, copies: 2 },
            { heroId: 'kael', heroName: 'Hero kael', stars: 2, copies: 1 },
            { heroId: 'orina', heroName: 'Hero orina', stars: 3, copies: 4 }
        ]);
    });

    it('is empty when the bag holds nothing', () => {
        expect(bagEntries([ hero('kael'), hero('lyra') ])).toEqual([]);
    });
});

describe('fusionRows', () => {
    it('has one row per hero and stars 0 to 8, never 9', () => {
        const rows = fusionRows([ hero('kael'), hero('lyra') ]);

        expect(rows.map((row) => [ row.heroId, row.stars ])).toEqual([
            [ 'kael', 0 ], [ 'kael', 1 ], [ 'kael', 2 ], [ 'kael', 3 ], [ 'kael', 4 ], [ 'kael', 5 ], [ 'kael', 6 ], [ 'kael', 7 ], [ 'kael', 8 ],
            [ 'lyra', 0 ], [ 'lyra', 1 ], [ 'lyra', 2 ], [ 'lyra', 3 ], [ 'lyra', 4 ], [ 'lyra', 5 ], [ 'lyra', 6 ], [ 'lyra', 7 ], [ 'lyra', 8 ]
        ]);
    });

    it('can fuse from 3 copies and not with 2', () => {
        const rows = fusionRows([ hero('kael', { 0: 2, 1: 3, 2: 7 }) ]).filter((row) => row.stars <= 2);

        expect(rows.map((row) => [ row.copies, row.canFuse ])).toEqual([ [ 2, false ], [ 3, true ], [ 7, true ] ]);
    });
});

describe('unlockedSlots', () => {
    it('opens slot n at n stars', () => {
        expect(unlockedSlots(0)).toEqual([]);
        expect(unlockedSlots(1)).toEqual([ 1 ]);
        expect(unlockedSlots(2)).toEqual([ 1, 2 ]);
        expect(unlockedSlots(3)).toEqual([ 1, 2, 3 ]);
    });
});

describe('applyDrop', () => {
    it('adds one blank copy and owns the hero', () => {
        const heroes = [ hero('kael', { 0: 1 }), hero('lyra') ];

        const next = applyDrop(heroes, { heroId: 'lyra', heroName: 'Lyra', stars: 0 });

        expect(next[1]).toMatchObject({ owned: true, stars: 0, copies: { 0: 1, 1: 0, 2: 0, 3: 0 } });
        expect(next[0]).toBe(heroes[0]);
    });

    it('adds to an existing stack and keeps the stars of the hero', () => {
        const next = applyDrop([ hero('kael', { 0: 2, 1: 1 }, { stars: 1 }) ], { heroId: 'kael', stars: 0 });

        expect(next[0].copies[0]).toBe(3);
        expect(next[0].stars).toBe(1);
    });

    it('does not change the list it received', () => {
        const heroes = [ hero('lyra') ];

        applyDrop(heroes, { heroId: 'lyra' });

        expect(heroes[0].owned).toBe(false);
        expect(heroes[0].copies[0]).toBe(0);
    });

    it('ignores a hero that is not in the list', () => {
        const heroes = [ hero('kael', { 0: 1 }) ];

        expect(applyDrop(heroes, { heroId: 'ghost' })).toEqual(heroes);
    });
});

describe('labels', () => {
    it('names the five elements in Portuguese', () => {
        expect(ELEMENT_LABELS).toEqual({ FIRE: 'Fogo', WATER: 'Água', NATURE: 'Natureza', LIGHT: 'Luz', DARKNESS: 'Escuridão' });
    });

    it('offers fire, water and nature as starting heroes', () => {
        expect(STARTING_CHOICES).toEqual([
            { element: 'FIRE', heroId: 'kael', label: 'Fogo - Kael' },
            { element: 'WATER', heroId: 'orina', label: 'Água - Orina' },
            { element: 'NATURE', heroId: 'lyra', label: 'Natureza - Lyra' }
        ]);
    });

    it('names the bosses of the farm list', () => {
        expect(bossLabel({ kind: 'MINIBOSS', stage: 3 })).toBe('Miniboss 3');
        expect(bossLabel({ kind: 'CHAPTER_BOSS' })).toBe('Chefe do capítulo');
    });
});

describe('availableFusions', () => {
    it('keeps only the (hero, stars) pairs with 3 or more copies, 3 stars included', () => {
        const rows = availableFusions([ hero('kael', { 0: 2, 1: 3, 2: 4, 3: 9 }), hero('lyra', { 0: 3 }) ]);

        expect(rows.map(({ heroId, stars }) => `${heroId}:${stars}`)).toEqual([ 'kael:1', 'kael:2', 'kael:3', 'lyra:0' ]);
    });

    it('offers a 3 star row with 3 copies and never a 9 star row', () => {
        expect(availableFusions([ hero('kael', { 3: 3, 9: 5 }) ])).toEqual([
            { heroId: 'kael', heroName: 'Hero kael', stars: 3, copies: 3, canFuse: true }
        ]);
    });

    it('offers the 8 star row', () => {
        expect(availableFusions([ hero('kael', { 8: 3 }) ]).map((row) => row.stars)).toEqual([ 8 ]);
    });

    it('is empty when no pair has 3 copies', () => {
        expect(availableFusions([ hero('kael', { 0: 2 }), hero('lyra') ])).toEqual([]);
    });
});

describe('star tiers', () => {
    it('bagEntries lists the entries of 4 to 9 stars', () => {
        expect(bagEntries([ hero('kael', { 4: 1, 9: 2 }) ])).toEqual([
            { heroId: 'kael', heroName: 'Hero kael', stars: 4, copies: 1 },
            { heroId: 'kael', heroName: 'Hero kael', stars: 9, copies: 2 }
        ]);
    });

    it('MAX_STARS is 9', () => {
        expect(MAX_STARS).toBe(9);
    });

    it('isAscended is false up to 3 stars and true from 4 to 9', () => {
        expect([ 0, 1, 2, 3 ].map(isAscended)).toEqual([ false, false, false, false ]);
        expect([ 4, 5, 6, 7, 8, 9 ].map(isAscended)).toEqual([ true, true, true, true, true, true ]);
    });

    it('starsClass is empty up to 3 stars, is-ascended from 4 to 6 and is-exalted from 7 to 9', () => {
        expect([ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ].map(starsClass)).toEqual([
            '', '', '', '', 'is-ascended', 'is-ascended', 'is-ascended', 'is-exalted', 'is-exalted', 'is-exalted'
        ]);
    });
});
