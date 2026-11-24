//  Where the talent tree sits, in percent of the 16:9 board (origin top left). Calibrated on talent-tree-bg.jpg, like mapLayout.js (spec talent-tree-rework D14, task T31). Four boughs: far left TIME, upper left BREAK, upper right POWER, far right COMBO.
export const TREE_SIZE = { width: 1024, height: 576 };

export const TREE_IMAGE = 'assets/talent-tree-bg.jpg';

//  Grade 1 lowest, one grade every 12.5 % of the height (12 % in the four POWER columns, a staircase that climbs to the right with the crown): `rise` gives the three rows of a column from its grade 1 row
const rise = (grade1, step = 12.5) => ({ 1: grade1, 2: grade1 - step, 3: grade1 - 2 * step });
const CHAINS = [
    [ 'MINIBOSS_TIME', 9, rise(60) ], [ 'BOSS_DAMAGE', 17.5, rise(60) ],
    [ 'PHYSICAL_BREAK', 26, rise(38.5) ], [ 'ARMOR_PIERCE', 34.5, rise(38.5) ],
    [ 'CLICK_DAMAGE', 55, rise(50, 12) ], [ 'CLICK_FLAT_DAMAGE', 62, rise(44, 12) ], [ 'CRIT_CHANCE', 69, rise(38, 12) ], [ 'CRIT_DAMAGE', 76, rise(32, 12) ],
    [ 'COMBO', 92, rise(60) ]
];

//  The 27 graded talents and Fúria crescente on the COMBO bough
export const NODE_POSITIONS = Object.freeze({
    ...Object.fromEntries(CHAINS.flatMap(([ id, x, rows ]) =>
        [ 1, 2, 3 ].map((grade) => [ grade === 1 ? id : `${id}_G${grade}`, { x, y: rows[grade] } ]))),
    COMBO_FURY: { x: 80, y: 61 }
});

export const LARGE_NODES = Object.freeze([ 'COMBO_FURY' ]);

export const BANNER_POSITIONS = Object.freeze({ TIME: { x: 13.5, y: 25.5 }, BREAK: { x: 30.5, y: 5 }, POWER: { x: 66, y: 5 }, COMBO: { x: 81.8, y: 49.7 } });

//  The ellipse of each branch's lit veins: centre (x, y) and radii (rx, ry), in percent
export const BRANCH_GLOWS = Object.freeze({
    TIME: { x: 25, y: 50, rx: 22, ry: 24 },
    BREAK: { x: 34, y: 22, rx: 18, ry: 25 },
    POWER: { x: 66, y: 24, rx: 18, ry: 26 },
    COMBO: { x: 72, y: 53, rx: 23, ry: 24 }
});

export const TRUNK = Object.freeze({ base: { x: 50, y: 100 }, fork: { x: 50, y: 58 } });

//  The fallback veins: the trunk, then one line per chain from the fork up its grades (COMBO passes through Fúria crescente)
export const VEINS = Object.freeze([
    [ TRUNK.base, TRUNK.fork ],
    ...CHAINS.map(([ id ]) => [
        TRUNK.fork,
        ...(id === 'COMBO' ? [ NODE_POSITIONS.COMBO_FURY ] : []),
        NODE_POSITIONS[id], NODE_POSITIONS[`${id}_G2`], NODE_POSITIONS[`${id}_G3`]
    ])
]);

//  The parts fixed over the scrolling board, in px of the 1024 x 576 window: the plaque "Talentos" ends 76 px from the top, the detail card
//  (112 px, one more line for a lock text) and the two bottom buttons start 136 px from the bottom
export const FIXED_TOP = 76;
export const FIXED_BOTTOM = 136;

//  Where the fixed parts sit across the window, in px of the 1024 px wide window: the plaque spans x 416 to 608, and Fechar (x 901 to 1011) ends 46 px from
//  the top, so a column under it keeps 48 px free at the top; a node seal sticks 8 px above its node, a caption is 80 px wide
export const PLAQUE_SPAN = Object.freeze({ from: 416, to: 608 });
export const FECHAR_FROM = 896;
export const FECHAR_ROOM = 48;
export const SEAL_HEIGHT = 8;
export const CAPTION_HALF = 40;

//  Half the side of a node, the gap to its caption plus three lines of it, and a margin, in px of the unzoomed board (a phone draws it twice as big)
export const NODE_HALF = 30;
export const LARGE_NODE_HALF = 44;
export const CAPTION_ROOM = 54;
export const REVEAL_MARGIN = 6;
