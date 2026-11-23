import { describe, expect, it } from 'vitest';
import { BANNER_POSITIONS, BRANCH_GLOWS, LARGE_NODES, NODE_POSITIONS, TRUNK, VEINS } from './talentTreeLayout';

const GRADED = [
    'MINIBOSS_TIME', 'BOSS_DAMAGE', 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE', 'COMBO', 'CLICK_FLAT_DAMAGE'
];
const IDS = [ ...GRADED.flatMap((id) => [ id, `${id}_G2`, `${id}_G3` ]), 'COMBO_FURY' ];
const nodes = Object.entries(NODE_POSITIONS);

describe('NODE_POSITIONS', () => {
    it('places the 28 talents of the catalog', () => {
        expect(Object.keys(NODE_POSITIONS).sort()).toEqual([ ...IDS ].sort());
        expect(IDS).toHaveLength(28);
    });

    it('stacks each chain in one column, grade 1 lowest', () => {
        GRADED.forEach((id) => {
            expect(NODE_POSITIONS[`${id}_G2`].x).toBe(NODE_POSITIONS[id].x);
            expect(NODE_POSITIONS[`${id}_G3`].x).toBe(NODE_POSITIONS[id].x);
        });

        [ 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].forEach((id) => {
            expect([ NODE_POSITIONS[id].y, NODE_POSITIONS[`${id}_G2`].y, NODE_POSITIONS[`${id}_G3`].y ]).toEqual([ 46, 33, 20 ]);
        });
        [ 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'COMBO' ].forEach((id) => {
            expect([ NODE_POSITIONS[id].y, NODE_POSITIONS[`${id}_G2`].y, NODE_POSITIONS[`${id}_G3`].y ]).toEqual([ 66, 53, 40 ]);
        });
    });

    it('puts Fúria crescente on the COMBO bough at (85, 72) and marks it large', () => {
        expect(NODE_POSITIONS.COMBO_FURY).toEqual({ x: 85, y: 72 });
        expect(LARGE_NODES).toEqual([ 'COMBO_FURY' ]);
    });

    it('keeps every node inside the board and out of the detail card', () => {
        nodes.forEach(([ , { x, y } ]) => {
            expect(x).toBeGreaterThanOrEqual(5);
            expect(x).toBeLessThanOrEqual(95);
            expect(y).toBeGreaterThanOrEqual(18);
            expect(y).toBeLessThanOrEqual(75);
        });
        expect(nodes.filter(([ , { x, y } ]) => x >= 30 && x <= 70 && y > 50)).toEqual([]);
    });

    it('keeps the nodes of one row at least 8.5 % apart', () => {
        nodes.forEach(([ idA, a ]) => nodes.forEach(([ idB, b ]) => {
            if (idA !== idB && a.y === b.y)
            {
                expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(8.5);
            }
        }));
    });
});

describe('banners, glows and veins', () => {
    it('places one banner per branch and one glow per branch', () => {
        expect(Object.keys(BANNER_POSITIONS)).toEqual([ 'TIME', 'BREAK', 'POWER', 'COMBO' ]);
        expect(Object.keys(BRANCH_GLOWS)).toEqual([ 'TIME', 'BREAK', 'POWER', 'COMBO' ]);
        expect(BANNER_POSITIONS).toEqual({ TIME: { x: 10.5, y: 29 }, BREAK: { x: 30.5, y: 11 }, POWER: { x: 68, y: 11 }, COMBO: { x: 91, y: 29 } });
        expect(BRANCH_GLOWS).toEqual({
            TIME: { x: 10.5, y: 53, rx: 10, ry: 20 },
            BREAK: { x: 30.5, y: 33, rx: 10, ry: 20 },
            POWER: { x: 68, y: 33, rx: 18, ry: 20 },
            COMBO: { x: 90, y: 58, rx: 9, ry: 24 }
        });
    });

    it('draws the trunk and one vein per chain from the fork', () => {
        expect(VEINS).toHaveLength(10);
        expect(VEINS[0]).toEqual([ { x: 50, y: 100 }, { x: 50, y: 58 } ]);
        expect(TRUNK.fork).toEqual({ x: 50, y: 58 });
        VEINS.slice(1).forEach((vein) => expect(vein[0]).toEqual({ x: 50, y: 58 }));

        const combo = VEINS.at(-1);

        expect(combo).toHaveLength(5);
        expect(combo[1]).toEqual({ x: 85, y: 72 });
    });
});
