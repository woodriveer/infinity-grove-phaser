//  The splash between the loading bar and the start screen: a tree grows from the ground, crystals light up
//  around it and the logo fades in at the centre, then the game moves on by itself. Pure data and maths only;
//  Splash.js draws it with Phaser.

//  When each part plays, in ms from the start of the splash. A player who prefers reduced motion sees the
//  finished picture at once and moves on after a short pause, with no fade.
const FULL = { treeMs: 1400, crystalsAt: 900, crystalStaggerMs: 140, crystalMs: 360, logoAt: 1900, logoMs: 700, endAt: 3300, fadeMs: 600 };
const STILL = { treeMs: 0, crystalsAt: 0, crystalStaggerMs: 0, crystalMs: 0, logoAt: 0, logoMs: 0, endAt: 900, fadeMs: 0 };

export const splashPlan = ({ reducedMotion = false } = {}) => ({ ...(reducedMotion ? STILL : FULL), reducedMotion });

export const prefersReducedMotion = (win = globalThis.window) =>
    Boolean(win?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

//  How far a part has played, 0 to 1, when the whole runs from 0 to 1 and the part between start and end
export const partProgress = (progress, start, end) => (end <= start ? (progress >= end ? 1 : 0) : clamp01((progress - start) / (end - start)));

export const GROUND_Y = 704;
export const TREE_X = 512;

//  The tree on the 1024 x 768 canvas: each branch grows from (x1, y1) to (x2, y2) while the growth goes from start to end
export const TREE_BRANCHES = [
    { x1: 512, y1: GROUND_Y, x2: 512, y2: 470, width: 34, start: 0, end: 0.45 },
    { x1: 512, y1: 540, x2: 400, y2: 430, width: 16, start: 0.3, end: 0.65 },
    { x1: 512, y1: 520, x2: 632, y2: 418, width: 16, start: 0.33, end: 0.68 },
    { x1: 512, y1: 470, x2: 470, y2: 330, width: 18, start: 0.42, end: 0.75 },
    { x1: 512, y1: 470, x2: 566, y2: 320, width: 18, start: 0.44, end: 0.77 },
    { x1: 400, y1: 430, x2: 330, y2: 392, width: 8, start: 0.6, end: 0.82 },
    { x1: 632, y1: 418, x2: 704, y2: 380, width: 8, start: 0.62, end: 0.84 },
    { x1: 470, y1: 330, x2: 430, y2: 262, width: 8, start: 0.7, end: 0.88 },
    { x1: 566, y1: 320, x2: 610, y2: 254, width: 8, start: 0.72, end: 0.9 },
    //  The roots spread over the ground as the trunk rises
    { x1: 512, y1: GROUND_Y - 6, x2: 446, y2: GROUND_Y + 10, width: 12, start: 0.05, end: 0.3 },
    { x1: 512, y1: GROUND_Y - 6, x2: 584, y2: GROUND_Y + 12, width: 12, start: 0.07, end: 0.32 }
];

//  The crown: round clusters of leaves that swell in once their branch is out
export const TREE_LEAVES = [
    { x: 512, y: 280, r: 96, color: 0x2f6b3a, start: 0.68 },
    { x: 410, y: 340, r: 78, color: 0x2a5e33, start: 0.7 },
    { x: 616, y: 334, r: 80, color: 0x2a5e33, start: 0.72 },
    { x: 340, y: 392, r: 52, color: 0x3b7d43, start: 0.78 },
    { x: 696, y: 384, r: 54, color: 0x3b7d43, start: 0.8 },
    { x: 452, y: 240, r: 62, color: 0x4a9150, start: 0.82 },
    { x: 574, y: 236, r: 64, color: 0x4a9150, start: 0.84 },
    { x: 512, y: 200, r: 52, color: 0x5ea85c, start: 0.86 }
];
export const LEAF_GROW = 0.14;

//  The tip of a branch at a given growth of the tree, or null while it has not started
export const branchTip = (branch, growth) => {
    const t = partProgress(growth, branch.start, branch.end);

    if (t === 0) return null;

    return { x: branch.x1 + (branch.x2 - branch.x1) * t, y: branch.y1 + (branch.y2 - branch.y1) * t };
};

//  The scale of a cluster of leaves at a given growth of the tree, 0 to 1
export const leafScale = (leaf, growth) => partProgress(growth, leaf.start, leaf.start + LEAF_GROW);

//  The crystals float on an arc around the tree: from low left, over the crown, to low right
const CRYSTAL_COLORS = [ 0x6fe3ff, 0xa98bff, 0x7dffc4, 0xffd36f ];

export const crystalLayout = (count = 7, { cx = 512, cy = 390, rx = 400, ry = 290, fromDeg = 160, toDeg = 380 } = {}) =>
    Array.from({ length: count }, (_, index) => {
        const angle = ((fromDeg + ((toDeg - fromDeg) * index) / Math.max(1, count - 1)) * Math.PI) / 180;

        return {
            x: Math.round(cx + rx * Math.cos(angle)),
            y: Math.round(cy + ry * Math.sin(angle)),
            size: index % 2 === 0 ? 30 : 22,
            color: CRYSTAL_COLORS[index % CRYSTAL_COLORS.length]
        };
    });

//  A crystal is a long diamond: the points to fill around its centre
export const crystalPoints = (size) => [
    { x: 0, y: -size },
    { x: size * 0.45, y: -size * 0.1 },
    { x: 0, y: size * 0.7 },
    { x: -size * 0.45, y: -size * 0.1 }
];
