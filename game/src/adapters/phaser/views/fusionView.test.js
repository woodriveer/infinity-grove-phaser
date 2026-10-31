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
        const view = renderFusion([ hero('kael', { 0: 2, 9: 5 }), hero('lyra') ], { onFuse: vi.fn() });

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

    it('the result of a fusion to 4 to 9 stars names the raised skill and its level', () => {
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 4, skillName: 'Corte Dimensional', level: 2 }).textContent)
            .toBe('Nova carta: Kael Raizférrea 4★ · Corte Dimensional no nível 2');
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 9, skillName: 'Brado Aterrador', level: 3 }).textContent)
            .toBe('Nova carta: Kael Raizférrea 9★ · Brado Aterrador no nível 3');
    });

    it('the result of a fusion to 1 to 3 stars reads as before', () => {
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 3, skillName: 'Brado Aterrador', level: 1 }).textContent)
            .toBe('Nova carta: Kael Raizférrea 3★');
    });

    it('a 4 star result without a skill name reads only the card', () => {
        expect(renderFusionResult({ heroName: 'Kael Raizférrea', stars: 4, level: 2 }).textContent).toBe('Nova carta: Kael Raizférrea 4★');
    });
});

describe('renderFusion past 3 stars', () => {
    it('lists a 3 star row as 3★ → 4★ with 3/3, and a click fuses it', () => {
        const onFuse = vi.fn();
        const list = renderFusion([ hero('kael', { 3: 3 }) ], { onFuse });
        const row = list.querySelector('[data-testid="fusion-row-kael-3"]');

        expect(row.querySelector('.fusion-name').textContent).toBe('Hero kael 3★ → 4★');
        expect(row.querySelector('.fusion-copies').textContent).toBe('3/3');
        expect(list.querySelector('[data-testid="fusion-button-kael-3"]').textContent).toBe('Fundir');

        list.querySelector('[data-testid="fusion-button-kael-3"]').click();

        expect(onFuse).toHaveBeenCalledWith('kael', 3);
    });

    it('lists the 8 star row and never a 9 star row', () => {
        const list = renderFusion([ hero('kael', { 8: 3, 9: 3 }) ], { onFuse: vi.fn() });

        expect(list.querySelector('[data-testid="fusion-row-kael-8"] .fusion-name').textContent).toBe('Hero kael 8★ → 9★');
        expect(list.querySelector('[data-testid="fusion-row-kael-9"]')).toBeNull();
    });
});
