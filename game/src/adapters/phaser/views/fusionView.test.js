import { describe, expect, it, vi } from 'vitest';
import { renderFusion, renderFusionResult } from './fusionView';

const hero = (id, copies = {}) => ({ id, name: `Hero ${id}`, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies } });

describe('renderFusion', () => {
    it('has one row per hero and stars 0 to 2 with the copies out of 3', () => {
        const list = renderFusion([ hero('kael', { 0: 2, 1: 3 }), hero('lyra') ], { onFuse: vi.fn() });
        const rows = [ ...list.querySelectorAll('.fusion-row') ];

        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([
            'fusion-row-kael-0', 'fusion-row-kael-1', 'fusion-row-kael-2', 'fusion-row-lyra-0', 'fusion-row-lyra-1', 'fusion-row-lyra-2'
        ]);
        expect(rows[0].querySelector('.fusion-name').textContent).toBe('Hero kael 0★ → 1★');
        expect(rows.slice(0, 3).map((row) => row.querySelector('.fusion-copies').textContent)).toEqual([ '2/3', '3/3', '0/3' ]);
    });

    it('enables the Fundir button only from 3 copies', () => {
        const list = renderFusion([ hero('kael', { 0: 2, 1: 3, 2: 9 }) ], { onFuse: vi.fn() });
        const buttons = [ ...list.querySelectorAll('.fusion-button') ];

        expect(buttons.map((button) => button.textContent)).toEqual([ 'Fundir', 'Fundir', 'Fundir' ]);
        expect(buttons.map((button) => button.disabled)).toEqual([ true, false, false ]);
    });

    it('calls onFuse with the hero and the stars when an enabled button is clicked', () => {
        const onFuse = vi.fn();
        const list = renderFusion([ hero('kael', { 1: 3 }) ], { onFuse });

        list.querySelector('[data-testid="fusion-button-kael-1"]').click();

        expect(onFuse).toHaveBeenCalledWith('kael', 1);
    });

    it('does not call onFuse for a disabled button', () => {
        const onFuse = vi.fn();
        const list = renderFusion([ hero('kael', { 0: 2 }) ], { onFuse });

        list.querySelector('[data-testid="fusion-button-kael-0"]').click();

        expect(onFuse).not.toHaveBeenCalled();
    });

    it('highlights the selected entry and no other', () => {
        const list = renderFusion([ hero('kael'), hero('lyra') ], { onFuse: vi.fn(), selected: { heroId: 'lyra', stars: 1 } });
        const selected = [ ...list.querySelectorAll('.fusion-row.is-selected') ];

        expect(selected.map((row) => row.getAttribute('data-testid'))).toEqual([ 'fusion-row-lyra-1' ]);
    });

    it('highlights nothing without a selection', () => {
        expect(renderFusion([ hero('kael') ], { onFuse: vi.fn() }).querySelectorAll('.is-selected')).toHaveLength(0);
    });
});

describe('renderFusionResult', () => {
    it('shows the hero and the stars of the new card', () => {
        const result = renderFusionResult({ heroName: 'Kael Raizférrea', stars: 2 });

        expect(result.getAttribute('data-testid')).toBe('fusion-result');
        expect(result.textContent).toBe('Nova carta: Kael Raizférrea 2★');
    });
});
