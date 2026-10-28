import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

//  The frames live in the stylesheet: the shapes and the motion rules are read from it
describe('the rarity frames in the stylesheet', () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'style.css'), 'utf8');
    const rule = (selector) => css.split('}').find((block) => block.includes(selector))?.split('{')[1] ?? '';

    it('has a frame for each of the five rarities', () => {
        [ 'common', 'uncommon', 'rare', 'epic', 'legendary' ].forEach((name) => expect(css).toContain(`.piece-tile.rarity-${name} {`));
    });

    it('gives no two rarities the same border and shadow: they differ by shape as well as by colour', () => {
        const frames = [ 'common', 'uncommon', 'rare', 'epic', 'legendary' ].map((name) => rule(`.piece-tile.rarity-${name} {`).replace(/\s+/g, ' ').trim());

        expect(new Set(frames).size).toBe(5);
        expect(frames[0]).not.toContain('box-shadow: 0 0 0 3px');
        expect(frames[2]).toContain('box-shadow');
        expect(frames[3]).toContain('box-shadow');
    });

    it('animates the epic fantasy effect and the legendary shimmer', () => {
        expect(css).toContain('@keyframes epic-pulse');
        expect(css).toContain('@keyframes epic-sweep');
        expect(css).toContain('@keyframes epic-twinkle');
        expect(css).toContain('@keyframes legendary-spin');
        expect(css).toContain('.piece-tile[data-effect="fantasy"]');
    });

    it('stills the animations under prefers-reduced-motion and keeps a steady glow', () => {
        //  Only the media block of the frames counts: other reduced-motion blocks of the file also stop animations
        const start = css.indexOf('{', css.search(/@media \(prefers-reduced-motion: reduce\) \{\s*\.piece-tile/)) + 1;
        let end = start;
        for (let depth = 1; depth > 0; end++) depth += { '{': 1, '}': -1 }[css[end]] ?? 0;
        const reduced = css.slice(start, end - 1);
        const still = (selector) => reduced.split('}').find((block) => block.includes(selector))?.split('{')[1] ?? '';

        [ '.piece-tile.rarity-epic {', '.piece-tile.rarity-legendary::before {' ].forEach((selector) => {
            expect(still(selector)).toContain('animation: none');
            expect(still(selector)).toContain('box-shadow');
        });
        expect(still('.piece-tile[data-effect="fantasy"]::after {')).toContain('animation: none');
    });
});
