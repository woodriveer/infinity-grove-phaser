import { describe, expect, it } from 'vitest';
import { renderEffectTags } from './skillEffects';

describe('renderEffectTags', () => {
    it('shows one tag per effect as "<label> <seconds>s", in the order given', () => {
        const tags = renderEffectTags([ { label: 'Ventos Ligeiros', seconds: 12 }, { label: 'Bomba de Veneno x2', seconds: 5 } ]);

        expect(tags.map((tag) => tag.textContent)).toEqual([ 'Ventos Ligeiros 12s', 'Bomba de Veneno x2 5s' ]);
        expect(tags.every((tag) => tag.classList.contains('tag-effect'))).toBe(true);
    });

    it('shows nothing without an effect', () => {
        expect(renderEffectTags([])).toEqual([]);
    });
});
