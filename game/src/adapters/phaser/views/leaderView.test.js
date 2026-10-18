import { describe, expect, it, vi } from 'vitest';
import { renderLeaderPicker } from './leaderView';

const hero = (id, owned, stars = 0) => ({ id, name: `Hero ${id}`, owned, stars });

describe('renderLeaderPicker', () => {
    const heroes = [ hero('kael', true, 1), hero('lyra', true, 0), hero('orina', false) ];

    it('lists only the owned heroes with their stars', () => {
        const list = renderLeaderPicker(heroes, 'kael', { onPick: vi.fn() });
        const rows = [ ...list.querySelectorAll('.leader-entry') ];

        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([ 'leader-entry-kael', 'leader-entry-lyra' ]);
        expect(rows.map((row) => row.querySelector('.leader-name').textContent)).toEqual([ 'Hero kael 1★', 'Hero lyra 0★' ]);
    });

    it('marks the current leader and no other hero', () => {
        const list = renderLeaderPicker(heroes, 'lyra', { onPick: vi.fn() });

        expect([ ...list.querySelectorAll('.is-current') ].map((row) => row.getAttribute('data-testid'))).toEqual([ 'leader-entry-lyra' ]);
        expect(list.querySelector('[data-testid="leader-entry-lyra"] .leader-state').textContent).toBe('Líder');
        expect(list.querySelector('[data-testid="leader-entry-kael"] .leader-state').textContent).toBe('');
    });

    it('calls onPick with the id of another hero', () => {
        const onPick = vi.fn();
        const list = renderLeaderPicker(heroes, 'kael', { onPick });

        list.querySelector('[data-testid="leader-entry-lyra"]').click();

        expect(onPick).toHaveBeenCalledWith('lyra');
    });

    it('does not call onPick for the hero that already leads', () => {
        const onPick = vi.fn();
        const list = renderLeaderPicker(heroes, 'kael', { onPick });

        list.querySelector('[data-testid="leader-entry-kael"]').click();

        expect(onPick).not.toHaveBeenCalled();
    });
});
