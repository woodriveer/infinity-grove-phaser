import { describe, expect, it, vi } from 'vitest';
import { renderFarm } from './farmView';

const bosses = [ { kind: 'MINIBOSS', stage: 1 }, { kind: 'MINIBOSS', stage: 2 }, { kind: 'CHAPTER_BOSS' } ];

describe('renderFarm', () => {
    it('names the minibosses by stage and the chapter boss with the wins left today', () => {
        const list = renderFarm(bosses, 10, { onPick: vi.fn() });
        const rows = [ ...list.querySelectorAll('.farm-entry') ];

        expect(rows.map((row) => row.querySelector('.farm-name').textContent)).toEqual([ 'Miniboss 1', 'Miniboss 2', 'Chefe do capítulo' ]);
        expect(rows[2].querySelector('.farm-wins').textContent).toBe('10 vitórias restantes hoje');
        expect(rows[0].querySelector('.farm-wins')).toBeNull();
    });

    it('has stable test ids per boss', () => {
        const list = renderFarm(bosses, 10, { onPick: vi.fn() });

        expect([ ...list.querySelectorAll('.farm-entry') ].map((row) => row.getAttribute('data-testid'))).toEqual([
            'farm-entry-miniboss-1', 'farm-entry-miniboss-2', 'farm-entry-chapter-boss'
        ]);
    });

    it('disables the chapter boss at 0 wins left and keeps the minibosses enabled', () => {
        const list = renderFarm(bosses, 0, { onPick: vi.fn() });

        expect(list.querySelector('[data-testid="farm-entry-chapter-boss"]').disabled).toBe(true);
        expect(list.querySelector('[data-testid="farm-entry-miniboss-1"]').disabled).toBe(false);
        expect(list.querySelector('.farm-wins').textContent).toBe('0 vitórias restantes hoje');
    });

    it('enables the chapter boss with 1 win left', () => {
        const list = renderFarm(bosses, 1, { onPick: vi.fn() });

        expect(list.querySelector('[data-testid="farm-entry-chapter-boss"]').disabled).toBe(false);
    });

    it('calls onPick with the kind and stage of the chosen boss', () => {
        const onPick = vi.fn();
        const list = renderFarm(bosses, 10, { onPick });

        list.querySelector('[data-testid="farm-entry-miniboss-2"]').click();
        list.querySelector('[data-testid="farm-entry-chapter-boss"]').click();

        expect(onPick.mock.calls).toEqual([ [ { kind: 'MINIBOSS', stage: 2 } ], [ { kind: 'CHAPTER_BOSS' } ] ]);
    });

    it('does not call onPick for the disabled chapter boss', () => {
        const onPick = vi.fn();
        const list = renderFarm(bosses, 0, { onPick });

        list.querySelector('[data-testid="farm-entry-chapter-boss"]').click();

        expect(onPick).not.toHaveBeenCalled();
    });

    it('says no boss was beaten yet when the list is empty', () => {
        const empty = renderFarm([], 10, { onPick: vi.fn() });

        expect(empty.getAttribute('data-testid')).toBe('farm-empty');
        expect(empty.textContent).toBe('Nenhum chefe derrotado ainda.');
    });
});
