import { describe, expect, it } from 'vitest';
import { renderEffectTags, updateEffectTags } from './skillEffects';

const skill = { slot: 3, name: 'Ventos Ligeiros', type: 'Buff', effect: 'Mais dano de clique.', cooldownSeconds: 40, image: 'lyra_rapid_wind', unlocked: true };

describe('renderEffectTags', () => {
    it('shows one tag per effect as "<label> <seconds>s", in the order given', () => {
        const tags = renderEffectTags([ { label: 'Ventos Ligeiros', seconds: 12 }, { label: 'Bomba de Veneno x2', seconds: 5 } ]);

        expect(tags.map((tag) => tag.textContent)).toEqual([ 'Ventos Ligeiros 12s', 'Bomba de Veneno x2 5s' ]);
        expect(tags.every((tag) => tag.classList.contains('tag-effect'))).toBe(true);
    });

    it('shows nothing without an effect', () => {
        expect(renderEffectTags([])).toEqual([]);
    });

    it('shows the card of the skill that started the effect when the pointer is on its tag', () => {
        const asked = [];
        const [ tag ] = renderEffectTags([ { label: 'Ventos Ligeiros', seconds: 12, heroId: 'lyra', slot: 3 } ], { skillOf: (owner) => { asked.push(owner); return skill; } });

        tag.dispatchEvent(new Event('pointerenter'));

        expect(asked).toEqual([ expect.objectContaining({ heroId: 'lyra', slot: 3 }) ]);
        expect(tag.querySelector('[data-testid="skill-tooltip"] .skill-name').textContent).toBe('Ventos Ligeiros');
        expect(tag.querySelector('.skill-cooldown').textContent).toBe('Recarga: 40s');

        tag.dispatchEvent(new Event('pointerleave'));
        expect(tag.querySelector('[data-testid="skill-tooltip"]')).toBeNull();
    });

    it('shows no tooltip when the skill is unknown', () => {
        const [ tag ] = renderEffectTags([ { label: 'Ventos Ligeiros', seconds: 12, heroId: 'lyra', slot: 3 } ], { skillOf: () => null });

        tag.dispatchEvent(new Event('pointerenter'));

        expect(tag.querySelector('[data-testid="skill-tooltip"]')).toBeNull();
    });
});

describe('updateEffectTags', () => {
    it('rewrites the seconds in place and keeps an open tooltip', () => {
        const container = document.createElement('div');
        const [ tag ] = renderEffectTags([ { label: 'Ventos Ligeiros', seconds: 12 } ], { skillOf: () => skill });

        container.append(tag);
        tag.dispatchEvent(new Event('pointerenter'));
        updateEffectTags(container, [ { label: 'Ventos Ligeiros', seconds: 11 } ]);

        expect(container.children[0]).toBe(tag);
        expect(tag.querySelector('.tag-text').textContent).toBe('Ventos Ligeiros 11s');
        expect(tag.querySelector('[data-testid="skill-tooltip"]')).not.toBeNull();
    });
});
