//  Where the talent tree sits, in percent of the 16:9 board (origin top left), calibrated on talent-tree-bg.jpg (spec talent-tree-branches, design § Layout map,
//  .specs/features/talent-tree-branches/layout-target.png). Each chain starts on the trunk where its painted vein leaves it and climbs along its bough:
//  TIME left along the cyan bough, BREAK up the red limbs, POWER up and right through the gold crown, COMBO right along the purple bough.
export const TREE_SIZE = { width: 1024, height: 576 };

export const TREE_IMAGE = 'assets/talent-tree-bg.jpg';

//  Each graded talent, in catalog order, and its grade 1, 2 and 3 points: grade 1 nearest the trunk, grade 3 toward the tip of the bough
const CHAINS = [
    [ 'MINIBOSS_TIME', [ { x: 43.5, y: 58 }, { x: 33, y: 43.5 }, { x: 20, y: 40 } ] ],
    [ 'BOSS_DAMAGE', [ { x: 35.5, y: 60.5 }, { x: 28.5, y: 55 }, { x: 16.5, y: 52.5 } ] ],
    [ 'PHYSICAL_BREAK', [ { x: 40.5, y: 40.5 }, { x: 34.5, y: 29 }, { x: 28, y: 18 } ] ],
    [ 'ARMOR_PIERCE', [ { x: 47, y: 33 }, { x: 43, y: 22 }, { x: 38, y: 11 } ] ],
    [ 'CLICK_DAMAGE', [ { x: 53, y: 49.5 }, { x: 55.5, y: 37 }, { x: 58, y: 24.5 } ] ],
    [ 'CLICK_FLAT_DAMAGE', [ { x: 61.5, y: 44 }, { x: 64, y: 31.5 }, { x: 66.5, y: 19 } ] ],
    [ 'CRIT_CHANCE', [ { x: 70, y: 38.5 }, { x: 72.5, y: 26 }, { x: 75, y: 13.5 } ] ],
    [ 'CRIT_DAMAGE', [ { x: 78.5, y: 33 }, { x: 81, y: 20.5 }, { x: 83.5, y: 8 } ] ],
    [ 'COMBO', [ { x: 60, y: 61 }, { x: 69.5, y: 56 }, { x: 86, y: 42 } ] ]
];

//  The 27 graded talents, and Fúria crescente on its own twig after Limite de dano do combo, the talent whose level 10 opens it
export const NODE_POSITIONS = Object.freeze({
    ...Object.fromEntries(CHAINS.flatMap(([ id, path ]) => path.map((position, index) => [ index === 0 ? id : `${id}_G${index + 1}`, position ]))),
    COMBO_FURY: { x: 76, y: 62 }
});

export const LARGE_NODES = Object.freeze([ 'COMBO_FURY' ]);

export const BANNER_POSITIONS = Object.freeze({ TIME: { x: 13.5, y: 30 }, BREAK: { x: 24, y: 6 }, POWER: { x: 66.5, y: 3.5 }, COMBO: { x: 88, y: 58 } });

//  The ellipse of each branch's lit veins: centre (x, y) and radii (rx, ry), in percent
export const BRANCH_GLOWS = Object.freeze({
    TIME: { x: 29, y: 52, rx: 18, ry: 17 },
    BREAK: { x: 38, y: 27, rx: 14, ry: 21 },
    POWER: { x: 68, y: 28, rx: 19, ry: 24 },
    COMBO: { x: 71, y: 58, rx: 18, ry: 17 }
});

export const TRUNK = Object.freeze({ base: { x: 50, y: 100 }, fork: { x: 50, y: 58 } });

//  The fallback veins: the trunk, one line per chain from the fork through its three grades, then the twig from Limite de dano do combo to Fúria crescente
export const VEINS = Object.freeze([
    [ TRUNK.base, TRUNK.fork ],
    ...CHAINS.map(([ , path ]) => [ TRUNK.fork, ...path ]),
    [ NODE_POSITIONS.COMBO, NODE_POSITIONS.COMBO_FURY ]
]);

//  The parts fixed over the scrolling board, in px of the 1024 x 576 window: the plaque "Talentos" ends 76 px from the top, the detail card (136 px tall,
//  8 px from the bottom) and the two bottom buttons start 144 px from the bottom
export const FIXED_TOP = 76;
export const FIXED_BOTTOM = 144;

//  Where the fixed parts sit across the window, in px of the 1024 px wide window: the plaque spans x 416 to 608, and Fechar (x 901 to 1011) ends 46 px from
//  the top, so a column under it keeps 48 px free at the top; a node seal or lock sticks 7 px above its node, a caption is 80 px wide
export const PLAQUE_SPAN = Object.freeze({ from: 416, to: 608 });
export const FECHAR_FROM = 896;
export const FECHAR_ROOM = 48;
export const SEAL_HEIGHT = 7;
export const CAPTION_HALF = 40;

//  Half the side of a node (44 px, 56 px for Fúria crescente), the gap to its caption plus three lines of it, and a margin, in px of the unzoomed board
//  (a phone draws it twice as big)
export const NODE_HALF = 22;
export const LARGE_NODE_HALF = 28;
export const CAPTION_ROOM = 54;
export const REVEAL_MARGIN = 6;
