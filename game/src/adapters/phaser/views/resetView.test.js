import { describe, expect, it } from 'vitest';
import { renderLegacyLine, renderResetDialog } from './resetView';

const box = (nodes) =>
{
    const root = document.createElement('div');

    root.append(...nodes);
    return root;
};

describe('renderLegacyLine', () => {
    it('writes the line and the detail with their test ids', () => {
        const root = box(renderLegacyLine({ chapters: [ { chapter: 10, percent: 50 } ], best: { chapter: 10, percent: 50 }, afterReset: null }));

        expect(root.querySelector('[data-testid="legacy-line"]').textContent).toBe('Legado: 50% do capítulo 10');
        expect(root.querySelector('[data-testid="legacy-line"]').className).toBe('legacy-line');
        expect(root.querySelector('[data-testid="legacy-detail"]').textContent)
            .toBe('Cada abate rende mais 50% das moedas do capítulo 10, e cada peça tem 50% de chance de vir com a raridade do capítulo 10.');
        expect(root.querySelector('[data-testid="legacy-detail"]').className).toBe('legacy-detail');
    });

    it('writes nenhum and the invitation without a legacy', () => {
        const root = box(renderLegacyLine({ chapters: [], best: null, afterReset: null }));

        expect(root.querySelector('[data-testid="legacy-line"]').textContent).toBe('Legado: nenhum');
        expect(root.querySelector('[data-testid="legacy-detail"]').textContent)
            .toBe('Resete a conta para ganhar moedas e peças melhores nas próximas jornadas.');
    });
});

describe('renderResetDialog', () => {
    it('puts the legacy line after the question', () => {
        const nodes = renderResetDialog({ reward: 3, legacyText: 'Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).' });
        const root = box(nodes);

        expect(nodes[0].getAttribute('data-testid')).toBe('reset-question');
        expect(nodes[1].getAttribute('data-testid')).toBe('reset-legacy');
        expect(nodes[1].className).toBe('reset-legacy');
        expect(root.querySelector('[data-testid="reset-legacy"]').textContent).toBe('Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).');
        expect(root.querySelector('[data-testid="reset-confirm"]')).not.toBeNull();
    });

    it('keeps the legacy line before the error of a failed request', () => {
        const nodes = renderResetDialog({ reward: 3, error: 'Falhou', legacyText: 'Linha' });

        expect(nodes.map((node) => node.getAttribute('data-testid'))).toEqual([ 'reset-question', 'reset-legacy', 'reset-error', 'reset-confirm', 'reset-cancel' ]);
    });

    it('without legacyText draws no legacy line', () => {
        const root = box(renderResetDialog({ reward: 3 }));

        expect(root.querySelector('[data-testid="reset-legacy"]')).toBeNull();
        expect(box(renderResetDialog({ reward: 3, legacyText: null })).querySelector('[data-testid="reset-legacy"]')).toBeNull();
    });
});
