import { describe, expect, it } from 'vitest';
import {
    GROUND_Y, TREE_BRANCHES, TREE_LEAVES,
    branchTip, crystalLayout, crystalPoints, leafScale, partProgress, prefersReducedMotion, splashPlan
} from './splashPlan';

describe('splashPlan', () => {
    it('plays the tree, then the crystals, then the logo, and ends within 3 to 4 s', () => {
        const plan = splashPlan();

        expect(plan.crystalsAt).toBeGreaterThan(0);
        expect(plan.crystalsAt).toBeLessThan(plan.treeMs);
        expect(plan.logoAt).toBeGreaterThan(plan.crystalsAt);
        expect(plan.logoAt + plan.logoMs).toBeLessThan(plan.endAt);
        expect(plan.endAt + plan.fadeMs).toBeGreaterThanOrEqual(3000);
        expect(plan.endAt + plan.fadeMs).toBeLessThanOrEqual(4000);
        expect(plan.reducedMotion).toBe(false);
    });

    it('with reduced motion shows the still picture and moves on in under a second, with no fade', () => {
        const plan = splashPlan({ reducedMotion: true });

        expect(plan).toMatchObject({ treeMs: 0, logoMs: 0, crystalMs: 0, fadeMs: 0, reducedMotion: true });
        expect(plan.endAt).toBeGreaterThan(0);
        expect(plan.endAt).toBeLessThan(1000);
    });
});

describe('prefersReducedMotion', () => {
    const windowWith = (matches) => ({ matchMedia: (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' && matches }) });

    it('reads the reduce media query', () => {
        expect(prefersReducedMotion(windowWith(true))).toBe(true);
        expect(prefersReducedMotion(windowWith(false))).toBe(false);
    });

    it('is false where there is no window or no matchMedia', () => {
        expect(prefersReducedMotion(undefined)).toBe(false);
        expect(prefersReducedMotion({})).toBe(false);
    });
});

describe('partProgress', () => {
    it('is 0 before the part, 1 after it and linear inside it', () => {
        expect(partProgress(0.1, 0.2, 0.6)).toBe(0);
        expect(partProgress(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
        expect(partProgress(0.9, 0.2, 0.6)).toBe(1);
    });

    it('jumps from 0 to 1 for a part with no length', () => {
        expect(partProgress(0.29, 0.3, 0.3)).toBe(0);
        expect(partProgress(0.3, 0.3, 0.3)).toBe(1);
    });
});

describe('the tree', () => {
    const trunk = TREE_BRANCHES[0];

    it('grows the trunk up from the ground', () => {
        expect(trunk).toMatchObject({ x1: 512, y1: GROUND_Y, start: 0 });
        expect(trunk.y2).toBeLessThan(trunk.y1);
    });

    it('shows nothing of a branch before it starts and its full length once grown', () => {
        expect(branchTip(TREE_BRANCHES[1], 0)).toBeNull();
        expect(branchTip(trunk, 1)).toEqual({ x: trunk.x2, y: trunk.y2 });
    });

    it('puts the tip halfway along the trunk halfway through its growth', () => {
        expect(branchTip(trunk, (trunk.start + trunk.end) / 2)).toEqual({ x: 512, y: (trunk.y1 + trunk.y2) / 2 });
    });

    it('swells every cluster of leaves from 0 to full size by the end of the growth', () => {
        TREE_LEAVES.forEach((leaf) => {
            expect(leafScale(leaf, leaf.start)).toBe(0);
            expect(leafScale(leaf, 1)).toBe(1);
        });
    });

    it('grows the crown only after the trunk is up', () => {
        TREE_LEAVES.forEach((leaf) => expect(leaf.start).toBeGreaterThanOrEqual(trunk.end));
    });
});

describe('the crystals', () => {
    it('lays out seven crystals on the canvas, above the ground', () => {
        const crystals = crystalLayout();

        expect(crystals).toHaveLength(7);
        crystals.forEach(({ x, y }) => {
            expect(x).toBeGreaterThan(0);
            expect(x).toBeLessThan(1024);
            expect(y).toBeGreaterThan(0);
            expect(y).toBeLessThan(GROUND_Y);
        });
    });

    it('places them around the tree: as many left of the trunk as right of it, one above the crown', () => {
        const crystals = crystalLayout();

        expect(crystals.filter(({ x }) => x < 512)).toHaveLength(3);
        expect(crystals.filter(({ x }) => x > 512)).toHaveLength(3);
        expect(crystals[3].x).toBe(512);
        expect(crystals[3].y).toBeLessThan(Math.min(...TREE_LEAVES.map(({ y, r }) => y - r)));
    });

    it('draws each crystal as a diamond, pointed at the top', () => {
        const points = crystalPoints(20);

        expect(points).toHaveLength(4);
        expect(points[0]).toEqual({ x: 0, y: -20 });
        expect(Math.min(...points.map(({ y }) => y))).toBe(-20);
    });
});
