import { describe, expect, it, vi } from 'vitest';
import { renderBag, renderBagEntry } from './bagView';

const skill = (slot, unlocked) => ({ slot, name: `Skill ${slot}`, type: 'Ataque', effect: `Effect ${slot}`, cooldownSeconds: 10, image: `img_${slot}`, unlocked });

const hero = (id, copies = {}, extra = {}) => ({
    id, name: `Hero ${id}`, owned: true, stars: 0, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies },
    skills: [ skill(1, false), skill(2, false), skill(3, false) ], ...extra
});

describe('renderBag', () => {
    it('lists only the (hero, stars) pairs with copies, with their counts', () => {
        const list = renderBag([ hero('kael', { 0: 2, 1: 1 }), hero('lyra'), hero('orina', { 3: 4 }) ], { onSelect: vi.fn() });
        const rows = [ ...list.querySelectorAll('.bag-entry') ];

        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([ 'bag-entry-kael-0', 'bag-entry-kael-1', 'bag-entry-orina-3' ]);
        expect(rows.map((row) => row.querySelector('.bag-name').textContent)).toEqual([ 'Hero kael 0★', 'Hero kael 1★', 'Hero orina 3★' ]);
        expect(rows.map((row) => row.querySelector('.bag-copies').textContent)).toEqual([ 'x2', 'x1', 'x4' ]);
    });

    it('says the bag is empty when it holds no card', () => {
        const empty = renderBag([ hero('kael'), hero('lyra') ], { onSelect: vi.fn() });

        expect(empty.getAttribute('data-testid')).toBe('bag-empty');
        expect(empty.textContent).toBe('A mochila está vazia.');
    });

    it('calls onSelect with the entry when a row is clicked', () => {
        const onSelect = vi.fn();
        const list = renderBag([ hero('kael', { 0: 2 }) ], { onSelect });

        list.querySelector('[data-testid="bag-entry-kael-0"]').click();

        expect(onSelect).toHaveBeenCalledWith({ heroId: 'kael', heroName: 'Hero kael', stars: 0, copies: 2 });
    });
});

describe('renderBagEntry', () => {
    const entry = { heroId: 'kael', heroName: 'Hero kael', stars: 0, copies: 2 };

    it('shows the hero, the stars, the copies and the copies needed to fuse', () => {
        const detail = renderBagEntry(entry, hero('kael', { 0: 2 }), { onFuse: vi.fn() });

        expect(detail.querySelector('.hero-name').textContent).toBe('Hero kael');
        expect(detail.querySelector('.hero-stars').textContent).toBe('Estrelas: 0★');
        expect(detail.querySelector('.bag-copies').textContent).toBe('Cópias: 2');
        expect(detail.querySelector('.bag-needed').textContent).toBe('Para fundir: 2/3');
    });

    it('shows the three skills of the hero, locked ones included', () => {
        const detail = renderBagEntry(entry, hero('kael', { 0: 2 }), { onFuse: vi.fn() });

        expect(detail.querySelectorAll('.skill-row')).toHaveLength(3);
        expect(detail.querySelectorAll('.skill-row.is-locked')).toHaveLength(3);
    });

    it('opens the fusion screen with this entry through the button', () => {
        const onFuse = vi.fn();
        const detail = renderBagEntry(entry, hero('kael', { 0: 2 }), { onFuse });

        detail.querySelector('[data-testid="bag-go-fusion"]').click();

        expect(onFuse).toHaveBeenCalledWith(entry);
    });

    it('has no way to the fusion screen for a three star card, which cannot be fused', () => {
        const maxed = { ...entry, stars: 3, copies: 1 };
        const detail = renderBagEntry(maxed, hero('kael', { 3: 1 }, { stars: 3 }), { onFuse: vi.fn() });

        expect(detail.querySelector('[data-testid="bag-go-fusion"]')).toBeNull();
        expect(detail.querySelector('.bag-needed').textContent).toBe('Estrela máxima: não pode ser fundida');
    });
});
