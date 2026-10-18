import { describe, expect, it, vi } from 'vitest';
import { renderFusion, renderFusionResult } from './fusionView';

const hero = (id, copies = {}) => ({ id, name: `Hero ${id}`, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies } });

describe('renderFusion', () => {
    it('has one row per fusion the bag can do now, with the copies out of 3', () => {
        const list = renderFusion([ hero('kael', { 0: 2, 1: 3, 2: 9 }), hero('lyra', { 0: 3 }) ], { onFuse: vi.fn() });
        const rows = [ ...list.querySelectorAll('.fusion-row') ];

        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([ 'fusion-row-kael-1', 'fusion-row-kael-2', 'fusion-row-lyra-0' ]);
        expect(rows[0].querySelector('.fusion-name').textContent).toBe('Hero kael 1★ → 2★');
        expect(rows.map((row) => row.querySelector('.fusion-copies').textContent)).toEqual([ '3/3', '9/3', '3/3' ]);
    });

    it('every row has an enabled Fundir button', () => {
        const list = renderFusion([ hero('kael', { 0: 2, 1: 3, 2: 9 }) ], { onFuse: vi.fn() });
        const buttons = [ ...list.querySelectorAll('.fusion-button') ];

        expect(buttons.map((button) => button.textContent)).toEqual([ 'Fundir', 'Fundir' ]);
        expect(buttons.some((button) => button.disabled)).toBe(false);
    });

    it('says there is no fusion available when no hero has 3 copies', () => {
        const view = renderFusion([ hero('kael', { 0: 2, 3: 5 }), hero('lyra') ], { onFuse: vi.fn() });

        expect(view.getAttribute('data-testid')).toBe('fusion-empty');
        expect(view.textContent).toBe('Nenhuma fusão disponível');
        expect(view.querySelector('.fusion-button')).toBeNull();
    });

    it('calls onFuse with the hero and the stars when an enabled button is clicked', () => {
        const onFuse = vi.fn();
        const list = renderFusion([ hero('kael', { 1: 3 }) ], { onFuse });

        list.querySelector('[data-testid="fusion-button-kael-1"]').click();

        expect(onFuse).toHaveBeenCalledWith('kael', 1);
    });

    it('highlights the selected entry and no other', () => {
        const list = renderFusion([ hero('kael', { 0: 3 }), hero('lyra', { 1: 3 }) ], { onFuse: vi.fn(), selected: { heroId: 'lyra', stars: 1 } });
        const selected = [ ...list.querySelectorAll('.fusion-row.is-selected') ];

        expect(selected.map((row) => row.getAttribute('data-testid'))).toEqual([ 'fusion-row-lyra-1' ]);
    });

    it('highlights nothing without a selection', () => {
        expect(renderFusion([ hero('kael', { 0: 3 }) ], { onFuse: vi.fn() }).querySelectorAll('.is-selected')).toHaveLength(0);
    });
});

describe('renderFusionResult', () => {
    it('shows the hero and the stars of the new card', () => {
        const result = renderFusionResult({ heroName: 'Kael Raizférrea', stars: 2 });

        expect(result.getAttribute('data-testid')).toBe('fusion-result');
        expect(result.textContent).toBe('Nova carta: Kael Raizférrea 2★');
    });
});
