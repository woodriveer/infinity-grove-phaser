import { describe, expect, it } from 'vitest';
import {
    barWidth, canFuseAny, cascade, chipText, copyLayers, frameTier, fuseAllQuestion, fuseAllResultText, ladderRows, layersText, previewLines, raisedSkills
} from './bagCards';

const hero = (copies, skills = []) => ({ id: 'kael', name: 'Kael', copies, skills });
const skill = (slot, level, unlocked = true) => ({ slot, name: `Skill ${slot}`, unlocked, level });

describe('frameTier', () => {
    it('is wood for 0 to 3 stars, silver for 4 to 6 and gold for 7 to 9', () => {
        expect([ 0, 3, 4, 6, 7, 9 ].map(frameTier)).toEqual([ 'wood', 'wood', 'silver', 'silver', 'gold', 'gold' ]);
    });
});

describe('copyLayers', () => {
    it('lists every layer with at least one copy, ascending', () => {
        expect(copyLayers(hero({ 0: 45, 1: 1, 2: 2, 3: 0 }))).toEqual([ { stars: 0, copies: 45 }, { stars: 1, copies: 1 }, { stars: 2, copies: 2 } ]);
    });

    it('is empty without copies', () => {
        expect(copyLayers(hero({}))).toEqual([]);
    });
});

describe('canFuseAny', () => {
    it('is true when a layer from 0 to 8 holds 3 copies', () => {
        expect(canFuseAny(hero({ 0: 3 }))).toBe(true);
        expect(canFuseAny(hero({ 8: 3 }))).toBe(true);
    });

    it('is false with 2 copies per layer or only 9-star copies', () => {
        expect(canFuseAny(hero({ 0: 2, 1: 2 }))).toBe(false);
        expect(canFuseAny(hero({ 9: 5 }))).toBe(false);
    });
});

describe('chipText', () => {
    it('reads stars, the times sign and the copies', () => {
        expect(chipText({ stars: 0, copies: 45 })).toBe('0★×45');
    });
});

describe('ladderRows', () => {
    it('ladderRows of 45, 1 and 2 copies has the rows 0, 1 and 2', () => {
        const rows = ladderRows(hero({ 0: 45, 1: 1, 2: 2 }));

        expect(rows.map((row) => row.stars)).toEqual([ 0, 1, 2 ]);
        expect(rows.map((row) => row.copies)).toEqual([ 45, 1, 2 ]);
        expect(rows.map((row) => row.filled)).toEqual([ 3, 1, 2 ]);
        expect(rows.map((row) => row.canFuse)).toEqual([ true, false, false ]);
        expect(rows.map((row) => row.isMax)).toEqual([ false, false, false ]);
    });

    it('ladderRows of 3 blank copies adds the 1-star row with 0 copies', () => {
        const rows = ladderRows(hero({ 0: 3 }));

        expect(rows.map((row) => row.stars)).toEqual([ 0, 1 ]);
        expect(rows[1]).toMatchObject({ copies: 0, filled: 0, canFuse: false });
    });

    it('ladderRows of 2 blank copies adds no row', () => {
        expect(ladderRows(hero({ 0: 2 })).map((row) => row.stars)).toEqual([ 0 ]);
    });

    it('ladderRows of one 9-star copy is the 9-star row only', () => {
        expect(ladderRows(hero({ 9: 1 }))).toEqual([ { stars: 9, copies: 1, filled: 1, canFuse: false, isMax: true } ]);
    });

    it('ladderRows of 3 copies of 8 stars adds the 9-star row', () => {
        const rows = ladderRows(hero({ 8: 3 }));

        expect(rows.map((row) => row.stars)).toEqual([ 8, 9 ]);
        expect(rows[1]).toMatchObject({ isMax: true, copies: 0 });
    });
});

describe('barWidth', () => {
    it('is a third of the bar per filled copy', () => {
        expect([ 0, 1, 2, 3 ].map(barWidth)).toEqual([ '0%', '33.333%', '66.667%', '100%' ]);
    });
});

describe('cascade', () => {
    it('cascade of 45, 1 and 2 copies', () => {
        expect(cascade(hero({ 0: 45, 1: 1, 2: 2 }))).toEqual({
            fusions: 22,
            after: { 0: 0, 1: 1, 2: 1, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
        });
    });

    it('cascade of 27 blank copies', () => {
        const { fusions, after } = cascade(hero({ 0: 27 }));

        expect(fusions).toBe(13);
        expect(after[3]).toBe(1);
        expect(Object.entries(after).filter(([ stars ]) => stars !== '3').every(([ , copies ]) => copies === 0)).toBe(true);
    });

    it('cascade stops at 9 stars', () => {
        const { fusions, after } = cascade(hero({ 8: 7, 9: 1 }));

        expect(fusions).toBe(2);
        expect(after[8]).toBe(1);
        expect(after[9]).toBe(3);
    });

    it('cascade of 19683 blank copies', () => {
        const { fusions, after } = cascade(hero({ 0: 19683 }));

        expect(fusions).toBe(9841);
        expect(after[9]).toBe(1);
    });
});

describe('layersText', () => {
    it('joins the layers with copies and leaves out the empty ones', () => {
        expect(layersText([ { stars: 0, copies: 45 }, { stars: 1, copies: 0 }, { stars: 2, copies: 2 } ])).toBe('45×0★ + 2×2★');
    });
});

describe('previewLines', () => {
    it('previewLines of 45, 1 and 2 copies', () => {
        expect(previewLines(hero({ 0: 45, 1: 1, 2: 2 }))).toEqual({ before: 'Antes: 45×0★ + 1×1★ + 2×2★', after: 'Depois: 1×1★ + 1×2★ + 2×3★' });
    });

    it('previewLines of 3 blank copies', () => {
        expect(previewLines(hero({ 0: 3 }))).toEqual({ before: 'Antes: 3×0★', after: 'Depois: 1×1★' });
    });

    it('previewLines keeps the copies left and the 9-star copies', () => {
        expect(previewLines(hero({ 8: 7, 9: 1 }))).toEqual({ before: 'Antes: 7×8★ + 1×9★', after: 'Depois: 1×8★ + 3×9★' });
    });
});

describe('fuseAllQuestion', () => {
    it('is plural and singular', () => {
        expect(fuseAllQuestion(22)).toBe('Fazer 22 fusões?');
        expect(fuseAllQuestion(1)).toBe('Fazer 1 fusão?');
    });
});

describe('raisedSkills', () => {
    it('raisedSkills names the skills raised to level 2 or more', () => {
        const before = [ skill(1, 1), skill(2, 1), skill(3, 1) ];
        const after = [ skill(1, 2), skill(2, 2), skill(3, 1) ];

        expect(raisedSkills(before, after)).toEqual([ { name: 'Skill 1', level: 2 }, { name: 'Skill 2', level: 2 } ]);
    });

    it('raisedSkills ignores a skill unlocked at level 1', () => {
        expect(raisedSkills([ skill(1, 0, false) ], [ skill(1, 1) ])).toEqual([]);
    });

    it('raisedSkills counts a skill unlocked straight at level 2', () => {
        expect(raisedSkills([ skill(1, 0, false) ], [ skill(1, 2) ])).toEqual([ { name: 'Skill 1', level: 2 } ]);
    });
});

describe('fuseAllResultText', () => {
    it('reads the fusions and the best card', () => {
        expect(fuseAllResultText({ heroName: 'Kael Raizférrea', fusions: 22, stars: 3 })).toBe('22 fusões. Melhor carta: Kael Raizférrea 3★');
        expect(fuseAllResultText({ heroName: 'Kael Raizférrea', fusions: 1, stars: 1 })).toBe('1 fusão. Melhor carta: Kael Raizférrea 1★');
    });

    it('adds a line part per raised skill', () => {
        const raised = [ { name: 'Corte Dimensional', level: 2 }, { name: 'Investida do Baluarte', level: 2 } ];

        expect(fuseAllResultText({ heroName: 'Kael Raizférrea', fusions: 4, stars: 5, raised }))
            .toBe('4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2');
    });
});
