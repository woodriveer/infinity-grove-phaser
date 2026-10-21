import { describe, expect, it } from 'vitest';
import { renderElementWheel } from './elementWheel';

const labels = (wheel, selector) => [ ...wheel.querySelectorAll(selector) ].map((node) => node.textContent);

describe('renderElementWheel', () => {
    it('is the element wheel and shows the five elements by name', () => {
        const wheel = renderElementWheel();

        expect(wheel.getAttribute('data-testid')).toBe('element-wheel');
        expect(labels(wheel, '.wheel-name')).toEqual([ 'Fogo', 'Natureza', 'Água', 'Luz', 'Escuridão' ]);
    });

    it('draws the triad as three arrows Fogo to Natureza, Natureza to Água and Água to Fogo, each x2', () => {
        const wheel = renderElementWheel();
        const arrows = [ ...wheel.querySelectorAll('.wheel-arrow') ];

        expect(arrows.map((arrow) => `${arrow.dataset.from}>${arrow.dataset.to}`)).toEqual([ 'FIRE>NATURE', 'NATURE>WATER', 'WATER>FIRE' ]);
        expect(labels(wheel, '.wheel-arrow-label')).toEqual([ 'x2', 'x2', 'x2' ]);
    });

    it('labels the light and darkness pair x1,8 against the triad and x0,9 between themselves', () => {
        const wheel = renderElementWheel();

        expect(wheel.querySelector('.wheel-vs-triad').textContent).toBe('x1,8');
        expect(wheel.querySelector('.wheel-pair-link').textContent).toBe('x0,9');
    });

    it('carries the rule as a line of text', () => {
        const wheel = renderElementWheel();

        expect(wheel.querySelector('.wheel-rule').textContent).toBe('Fogo vence Natureza, Natureza vence Água, Água vence Fogo: dano em dobro');
    });
});
