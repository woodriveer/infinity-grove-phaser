import { describe, expect, it } from 'vitest';
import { BANNER_POSITIONS, BRANCH_GLOWS, CAPTION_ROOM, LARGE_NODE_HALF, LARGE_NODES, NODE_HALF, NODE_POSITIONS, TREE_SIZE, TRUNK, VEINS } from './talentTreeLayout';

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

    it('stacks each chain in one column, grade 1 lowest, a grade every 12.5 % of the height (12 % in the last two POWER columns)', () => {
        GRADED.forEach((id) => {
            expect(NODE_POSITIONS[`${id}_G2`].x).toBe(NODE_POSITIONS[id].x);
            expect(NODE_POSITIONS[`${id}_G3`].x).toBe(NODE_POSITIONS[id].x);
        });

        const rows = (id) => [ NODE_POSITIONS[id].y, NODE_POSITIONS[`${id}_G2`].y, NODE_POSITIONS[`${id}_G3`].y ];

        expect(rows('MINIBOSS_TIME')).toEqual([ 60, 47.5, 35 ]);
        expect(rows('BOSS_DAMAGE')).toEqual([ 60, 47.5, 35 ]);
        expect(rows('PHYSICAL_BREAK')).toEqual([ 37, 24.5, 12 ]);
        expect(rows('ARMOR_PIERCE')).toEqual([ 37, 24.5, 12 ]);
        expect(rows('CLICK_DAMAGE')).toEqual([ 44, 31.5, 19 ]);
        expect(rows('CLICK_FLAT_DAMAGE')).toEqual([ 38, 26, 14 ]);
        expect(rows('CRIT_CHANCE')).toEqual([ 32.5, 20.5, 8.5 ]);
        expect(rows('CRIT_DAMAGE')).toEqual([ 32.5, 20.5, 8.5 ]);
        expect(rows('COMBO')).toEqual([ 60, 47.5, 35 ]);
    });

    it('puts every branch over its own painted foliage: columns x 9 and 17.5 (TIME), 26 and 34.5 (BREAK), 59.3 to 84.6 (POWER), 92 (COMBO)', () => {
        expect([ 'MINIBOSS_TIME', 'BOSS_DAMAGE' ].map((id) => NODE_POSITIONS[id].x)).toEqual([ 9, 17.5 ]);
        expect([ 'PHYSICAL_BREAK', 'ARMOR_PIERCE' ].map((id) => NODE_POSITIONS[id].x)).toEqual([ 26, 34.5 ]);
        expect([ 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].map((id) => NODE_POSITIONS[id].x)).toEqual([ 59.3, 67.8, 76.3, 84.6 ]);
        expect(NODE_POSITIONS.COMBO.x).toBe(92);
    });

    it('puts Fúria crescente on the violet foliage at (78, 61) and marks it large', () => {
        expect(NODE_POSITIONS.COMBO_FURY).toEqual({ x: 78, y: 61 });
        expect(LARGE_NODES).toEqual([ 'COMBO_FURY' ]);
    });

    it('keeps every node and its seal inside the board, clear of the plaque and of the detail card', () => {
        nodes.forEach(([ , { x, y } ]) => {
            expect(x).toBeGreaterThanOrEqual(5);
            expect(x).toBeLessThanOrEqual(95);
            expect(y).toBeGreaterThanOrEqual(8.5);
            expect(y).toBeLessThanOrEqual(61);
        });

        //  The plaque "Talentos" covers x 41 to 59 % down to y 13 %: a node box (30 px = 2.9 % of the width, 5.2 % of the height) never touches it
        expect(nodes.filter(([ , { x, y } ]) => x > 41 - 2.9 && x < 59 + 2.9 && y - 5.2 < 13)).toEqual([]);
        expect(nodes.filter(([ , { x, y } ]) => x >= 30 && x <= 70 && y > 50)).toEqual([]);
    });

    it('ends every grade 1 caption (three lines, two for Fúria crescente) above the fixed bottom UI, which starts at 76 % of the height', () => {
        const limit = TREE_SIZE.height * 0.76;
        const grade1 = nodes.filter(([ id ]) => !/_G[23]$/.test(id) && !LARGE_NODES.includes(id));

        expect(grade1).toHaveLength(9);
        grade1.forEach(([ , { y } ]) => expect(y / 100 * TREE_SIZE.height + NODE_HALF + CAPTION_ROOM).toBeLessThanOrEqual(limit));
        expect(NODE_POSITIONS.COMBO_FURY.y / 100 * TREE_SIZE.height + LARGE_NODE_HALF + CAPTION_ROOM - 15).toBeLessThanOrEqual(limit);
    });

    it('keeps no two nodes touching, boxes drawn at 60 px (88 px for Fúria crescente) on the 1024 x 576 board', () => {
        const box = ([ id, { x, y } ]) => {
            const half = LARGE_NODES.includes(id) ? LARGE_NODE_HALF : NODE_HALF;

            return { id, left: x / 100 * TREE_SIZE.width - half, right: x / 100 * TREE_SIZE.width + half, top: y / 100 * TREE_SIZE.height - half, bottom: y / 100 * TREE_SIZE.height + half };
        };
        const boxes = nodes.map(box);
        const touching = boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom).map((b) => `${a.id} ${b.id}`));

        expect(touching).toEqual([]);
    });

    it('keeps the nodes of one row at least 8 % apart (a caption is 80 px, 7.8 %)', () => {
        nodes.forEach(([ idA, a ]) => nodes.forEach(([ idB, b ]) => {
            if (idA !== idB && a.y === b.y)
            {
                expect(Math.abs(a.x - b.x)).toBeGreaterThanOrEqual(8);
            }
        }));
    });
});

describe('banners, glows and veins', () => {
    it('places one banner per branch and one glow per branch', () => {
        expect(Object.keys(BANNER_POSITIONS)).toEqual([ 'TIME', 'BREAK', 'POWER', 'COMBO' ]);
        expect(Object.keys(BRANCH_GLOWS)).toEqual([ 'TIME', 'BREAK', 'POWER', 'COMBO' ]);
        expect(BANNER_POSITIONS).toEqual({ TIME: { x: 13.5, y: 25.5 }, BREAK: { x: 30.5, y: 3.2 }, POWER: { x: 66.4, y: 3.2 }, COMBO: { x: 77, y: 49.7 } });
        expect(BRANCH_GLOWS).toEqual({
            TIME: { x: 25, y: 50, rx: 22, ry: 24 },
            BREAK: { x: 34, y: 22, rx: 18, ry: 25 },
            POWER: { x: 66, y: 24, rx: 18, ry: 26 },
            COMBO: { x: 72, y: 53, rx: 23, ry: 24 }
        });
    });

    it('draws the trunk and one vein per chain from the fork', () => {
        expect(VEINS).toHaveLength(10);
        expect(VEINS[0]).toEqual([ { x: 50, y: 100 }, { x: 50, y: 58 } ]);
        expect(TRUNK.fork).toEqual({ x: 50, y: 58 });
        VEINS.slice(1).forEach((vein) => expect(vein[0]).toEqual({ x: 50, y: 58 }));

        const combo = VEINS.at(-1);

        expect(combo).toHaveLength(5);
        expect(combo[1]).toEqual({ x: 78, y: 61 });
    });
});
