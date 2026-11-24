import { describe, expect, it } from 'vitest';
import {
    BANNER_POSITIONS, BRANCH_GLOWS, CAPTION_ROOM, FIXED_BOTTOM, FIXED_TOP, LARGE_NODE_HALF, LARGE_NODES, NODE_HALF, NODE_POSITIONS, SEAL_HEIGHT, VEINS
} from './talentTreeLayout';

const GRADED = [
    'MINIBOSS_TIME', 'BOSS_DAMAGE', 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE', 'COMBO', 'CLICK_FLAT_DAMAGE'
];
const IDS = [ ...GRADED.flatMap((id) => [ id, `${id}_G2`, `${id}_G3` ]), 'COMBO_FURY' ];
const nodes = Object.entries(NODE_POSITIONS);

//  The board is 1024 x 576 px; a position is in percent of it
const px = ({ x, y }) => ({ x: x / 100 * 1024, y: y / 100 * 576 });
const half = (id) => (id === 'COMBO_FURY' ? 28 : 22);
const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const d = (id) => Math.hypot(px(NODE_POSITIONS[id]).x - 512, px(NODE_POSITIONS[id]).y - 334.08);

//  A node box grown 8 px left and up for the seal or the lock, 4 px right for the badge and 8 px down for the level chip
const footprint = (id) =>
{
    const { x, y } = px(NODE_POSITIONS[id]);

    return { id, left: x - half(id) - 8, right: x + half(id) + 4, top: y - half(id) - 8, bottom: y + half(id) + 8 };
};

//  The caption of a grade 1 node: 80 px wide, from 9 px under the node, 30 px tall (45 px for Limite de dano do combo, three lines)
const caption = (id) =>
{
    const { x, y } = px(NODE_POSITIONS[id]);

    return { id, left: x - 40, right: x + 40, top: y + half(id) + 9, bottom: y + half(id) + 9 + (id === 'COMBO' ? 45 : 30) };
};

const CAPTION_IDS = [ ...GRADED, 'COMBO_FURY' ];
const BOARD = { left: 0, right: 1024, top: 0, bottom: 576 };

describe('NODE_POSITIONS', () => {
    it('places the 28 talents of the catalog', () => {
        expect(Object.keys(NODE_POSITIONS).sort()).toEqual([ ...IDS ].sort());
        expect(IDS).toHaveLength(28);
    });

    it('puts every chain on its painted bough at the coordinates of the design', () => {
        expect(NODE_POSITIONS).toEqual({
            MINIBOSS_TIME: { x: 43.5, y: 58 },
            MINIBOSS_TIME_G2: { x: 33, y: 43.5 },
            MINIBOSS_TIME_G3: { x: 20, y: 40 },
            BOSS_DAMAGE: { x: 35.5, y: 60.5 },
            BOSS_DAMAGE_G2: { x: 28.5, y: 55 },
            BOSS_DAMAGE_G3: { x: 16.5, y: 52.5 },
            PHYSICAL_BREAK: { x: 40.5, y: 40.5 },
            PHYSICAL_BREAK_G2: { x: 34.5, y: 29 },
            PHYSICAL_BREAK_G3: { x: 28, y: 18 },
            ARMOR_PIERCE: { x: 47, y: 33 },
            ARMOR_PIERCE_G2: { x: 43, y: 22 },
            ARMOR_PIERCE_G3: { x: 38, y: 11 },
            CLICK_DAMAGE: { x: 53, y: 49.5 },
            CLICK_DAMAGE_G2: { x: 55.5, y: 37 },
            CLICK_DAMAGE_G3: { x: 58, y: 24.5 },
            CLICK_FLAT_DAMAGE: { x: 61.5, y: 44 },
            CLICK_FLAT_DAMAGE_G2: { x: 64, y: 31.5 },
            CLICK_FLAT_DAMAGE_G3: { x: 66.5, y: 19 },
            CRIT_CHANCE: { x: 70, y: 38.5 },
            CRIT_CHANCE_G2: { x: 72.5, y: 26 },
            CRIT_CHANCE_G3: { x: 75, y: 13.5 },
            CRIT_DAMAGE: { x: 78.5, y: 33 },
            CRIT_DAMAGE_G2: { x: 81, y: 20.5 },
            CRIT_DAMAGE_G3: { x: 83.5, y: 8 },
            COMBO: { x: 60, y: 61 },
            COMBO_G2: { x: 69.5, y: 56 },
            COMBO_G3: { x: 86, y: 42 },
            COMBO_FURY: { x: 76, y: 62 }
        });
    });

    it('starts each chain next to the trunk fork and climbs away from it, grade 1 nearest and grade 3 farthest', () => {
        GRADED.forEach((id) =>
        {
            expect(d(id)).toBeLessThan(d(`${id}_G2`));
            expect(d(`${id}_G2`)).toBeLessThan(d(`${id}_G3`));
        });

        expect(d('CLICK_DAMAGE')).toBeCloseTo(57.8, 1);
        expect(d('CLICK_DAMAGE_G2')).toBeCloseTo(133.4, 1);
        expect(d('CLICK_DAMAGE_G3')).toBeCloseTo(209.6, 1);
    });

    it('keeps TIME and BREAK left of the trunk, POWER and COMBO right of it, BREAK and POWER grade 3 high, TIME and COMBO grade 1 low', () => {
        const all = (ids) => ids.flatMap((id) => [ id, `${id}_G2`, `${id}_G3` ]);

        all([ 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'PHYSICAL_BREAK', 'ARMOR_PIERCE' ]).forEach((id) => expect(NODE_POSITIONS[id].x).toBeLessThan(50));
        [ ...all([ 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE', 'COMBO' ]), 'COMBO_FURY' ].forEach((id) => expect(NODE_POSITIONS[id].x).toBeGreaterThan(50));
        [ 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'CLICK_DAMAGE', 'CLICK_FLAT_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE' ].forEach((id) => expect(NODE_POSITIONS[`${id}_G3`].y).toBeLessThan(25));
        [ 'MINIBOSS_TIME', 'BOSS_DAMAGE', 'COMBO' ].forEach((id) => expect(NODE_POSITIONS[id].y).toBeGreaterThan(55));
    });

    it('puts Fúria crescente after Limite de dano do combo and marks it large', () => {
        expect(NODE_POSITIONS.COMBO_FURY).toEqual({ x: 76, y: 62 });
        expect(d('COMBO_FURY')).toBeCloseTo(267.2, 1);
        expect(d('COMBO')).toBeCloseTo(103.8, 1);
        expect(d('COMBO_FURY')).toBeGreaterThan(d('COMBO'));
        expect(LARGE_NODES).toEqual([ 'COMBO_FURY' ]);
    });

    it('keeps no two node footprints touching', () => {
        const boxes = IDS.map(footprint);
        const touching = boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => hit(a, b)).map((b) => `${a.id} ${b.id}`));

        expect(touching).toEqual([]);
    });

    it('keeps every grade 1 caption off every other node footprint and caption', () => {
        const footprints = IDS.map(footprint);
        const captions = CAPTION_IDS.map(caption);

        expect(captions).toHaveLength(10);
        expect(captions.flatMap((c) => footprints.filter((box) => box.id !== c.id && hit(c, box)).map((box) => `${c.id} over ${box.id}`))).toEqual([]);
        expect(captions.flatMap((a, i) => captions.slice(i + 1).filter((b) => hit(a, b)).map((b) => `${a.id} over ${b.id}`))).toEqual([]);
    });

    it('keeps every footprint and caption inside the board and off the plaque, Fechar, the detail card, the medallion and the reset button', () => {
        const fixed = {
            plaque: { left: 416, right: 608, top: 0, bottom: 76 },
            fechar: { left: 884, right: 1024, top: 0, bottom: 60 },
            card: { left: 282, right: 742, top: 432, bottom: 576 },
            medallion: { left: 0, right: 280, top: 508, bottom: 576 },
            reset: { left: 780, right: 1024, top: 508, bottom: 576 }
        };
        const boxes = [ ...IDS.map(footprint), ...CAPTION_IDS.map((id) => ({ ...caption(id), id: `caption ${id}` })) ];
        const outside = (box) => box.left < BOARD.left || box.right > BOARD.right || box.top < BOARD.top || box.bottom > BOARD.bottom;

        expect(boxes.filter(outside).map(({ id }) => id)).toEqual([]);

        for (const [ name, part ] of Object.entries(fixed))
        {
            expect(boxes.filter((box) => hit(box, part)).map(({ id }) => `${id} over ${name}`)).toEqual([]);
        }
    });
});

describe('banners, glows and veins', () => {
    it('puts the four banners on their foliage, inside the board and off every node, caption and the plaque', () => {
        expect(BANNER_POSITIONS).toEqual({ TIME: { x: 13.5, y: 30 }, BREAK: { x: 24, y: 6 }, POWER: { x: 66.5, y: 3.5 }, COMBO: { x: 88, y: 58 } });

        const plaque = { left: 416, right: 608, top: 0, bottom: 76 };
        const footprints = IDS.map(footprint);
        const captions = CAPTION_IDS.map(caption);

        Object.entries(BANNER_POSITIONS).forEach(([ branch, position ]) =>
        {
            const { x, y } = px(position);
            const banner = { left: x - 70, right: x + 70, top: y - 17, bottom: y + 17 };

            expect(banner.left).toBeGreaterThanOrEqual(BOARD.left);
            expect(banner.right).toBeLessThanOrEqual(BOARD.right);
            expect(banner.top).toBeGreaterThanOrEqual(BOARD.top);
            expect(banner.bottom).toBeLessThanOrEqual(BOARD.bottom);
            expect(hit(banner, plaque)).toBe(false);
            expect(footprints.filter((box) => hit(banner, box)).map(({ id }) => `${branch} over ${id}`)).toEqual([]);
            expect(captions.filter((box) => hit(banner, box)).map(({ id }) => `${branch} over caption ${id}`)).toEqual([]);
        });
    });

    it('lights each branch over its new path', () => {
        expect(Object.keys(BRANCH_GLOWS)).toEqual([ 'TIME', 'BREAK', 'POWER', 'COMBO' ]);
        expect(BRANCH_GLOWS).toEqual({
            TIME: { x: 29, y: 52, rx: 18, ry: 17 },
            BREAK: { x: 38, y: 27, rx: 14, ry: 21 },
            POWER: { x: 68, y: 28, rx: 19, ry: 24 },
            COMBO: { x: 71, y: 58, rx: 18, ry: 17 }
        });
    });

    it('draws the trunk, one vein per chain from the fork and the twig of Fúria crescente from Limite de dano do combo', () => {
        expect(VEINS.map((vein) => vein.map(({ x, y }) => `${x},${y}`).join(' '))).toEqual([
            '50,100 50,58',
            '50,58 43.5,58 33,43.5 20,40',
            '50,58 35.5,60.5 28.5,55 16.5,52.5',
            '50,58 40.5,40.5 34.5,29 28,18',
            '50,58 47,33 43,22 38,11',
            '50,58 53,49.5 55.5,37 58,24.5',
            '50,58 61.5,44 64,31.5 66.5,19',
            '50,58 70,38.5 72.5,26 75,13.5',
            '50,58 78.5,33 81,20.5 83.5,8',
            '50,58 60,61 69.5,56 86,42',
            '60,61 76,62'
        ]);
        VEINS.slice(0, -1).forEach((vein) => expect(vein).not.toContainEqual({ x: 76, y: 62 }));
    });

    it('sizes the reserved bands for 44 px nodes and the 136 px card', () => {
        expect([ NODE_HALF, LARGE_NODE_HALF, SEAL_HEIGHT, CAPTION_ROOM, FIXED_TOP, FIXED_BOTTOM ]).toEqual([ 22, 28, 7, 54, 76, 144 ]);
    });
});
