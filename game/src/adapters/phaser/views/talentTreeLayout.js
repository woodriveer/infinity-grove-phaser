//  Where the talent tree sits, in percent of the 16:9 board (origin top left). Provisional: recalibrated on talent-tree-bg.jpg once it exists,
//  like mapLayout.js (spec talent-tree-rework D14). Four boughs: far left TIME, upper left BREAK, upper right POWER, far right COMBO.
export const TREE_SIZE = { width: 1024, height: 576 };

export const TREE_IMAGE = 'assets/talent-tree-bg.jpg';

//  Grade 1 lowest: the upper boughs (BREAK, POWER) and the far boughs (TIME, COMBO) have their own rows
const UPPER_ROWS = { 1: 46, 2: 33, 3: 20 };
const FAR_ROWS = { 1: 66, 2: 53, 3: 40 };
const CHAINS = [
    [ 'MINIBOSS_TIME', 6, FAR_ROWS ], [ 'BOSS_DAMAGE', 15, FAR_ROWS ],
    [ 'PHYSICAL_BREAK', 26, UPPER_ROWS ], [ 'ARMOR_PIERCE', 35, UPPER_ROWS ],
    [ 'CLICK_DAMAGE', 55, UPPER_ROWS ], [ 'CLICK_FLAT_DAMAGE', 63.5, UPPER_ROWS ], [ 'CRIT_CHANCE', 72, UPPER_ROWS ], [ 'CRIT_DAMAGE', 80.5, UPPER_ROWS ],
    [ 'COMBO', 94, FAR_ROWS ]
];

//  The 27 graded talents and Fúria crescente on the COMBO bough
export const NODE_POSITIONS = Object.freeze({
    ...Object.fromEntries(CHAINS.flatMap(([ id, x, rows ]) =>
        [ 1, 2, 3 ].map((grade) => [ grade === 1 ? id : `${id}_G${grade}`, { x, y: rows[grade] } ]))),
    COMBO_FURY: { x: 85, y: 72 }
});

export const LARGE_NODES = Object.freeze([ 'COMBO_FURY' ]);

export const BANNER_POSITIONS = Object.freeze({ TIME: { x: 10.5, y: 29 }, BREAK: { x: 30.5, y: 11 }, POWER: { x: 68, y: 11 }, COMBO: { x: 91, y: 29 } });

//  The ellipse of each branch's lit veins: centre (x, y) and radii (rx, ry), in percent
export const BRANCH_GLOWS = Object.freeze({
    TIME: { x: 10.5, y: 53, rx: 10, ry: 20 },
    BREAK: { x: 30.5, y: 33, rx: 10, ry: 20 },
    POWER: { x: 68, y: 33, rx: 18, ry: 20 },
    COMBO: { x: 90, y: 58, rx: 9, ry: 24 }
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
