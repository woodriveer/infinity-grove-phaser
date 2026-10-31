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

    it('has no way to the fusion screen while there are fewer than 3 copies', () => {
        const detail = renderBagEntry(entry, hero('kael', { 0: 2 }), { onFuse: vi.fn() });

        expect(detail.querySelector('[data-testid="bag-go-fusion"]')).toBeNull();
    });

    it('opens the fusion screen with this entry through the button once 3 copies are there', () => {
        const onFuse = vi.fn();
        const ready = { ...entry, copies: 3 };
        const detail = renderBagEntry(ready, hero('kael', { 0: 3 }), { onFuse });

        expect(detail.querySelector('[data-testid="bag-go-fusion"]').textContent).toBe('Ir para a fusão');

        detail.querySelector('[data-testid="bag-go-fusion"]').click();

        expect(onFuse).toHaveBeenCalledWith(ready);
    });

    it('a 9 star entry cannot be fused: Estrela máxima and no button', () => {
        const maxed = { ...entry, stars: 9, copies: 1 };
        const detail = renderBagEntry(maxed, hero('kael', { 9: 1 }, { stars: 9 }), { onFuse: vi.fn() });

        expect(detail.querySelector('[data-testid="bag-go-fusion"]')).toBeNull();
        expect(detail.querySelector('.bag-needed').textContent).toBe('Estrela máxima: não pode ser fundida');
    });
});

describe('bag cards of 4 to 9 stars', () => {
    const entryOf = (stars, copies) => ({ heroId: 'kael', heroName: 'Hero kael', stars, copies });

    it('the bag lists 4 and 9 star entries with their copies', () => {
        const list = renderBag([ hero('kael', { 4: 1, 9: 2 }) ], { onSelect: vi.fn() });

        expect([ ...list.querySelectorAll('.bag-name') ].map((node) => node.textContent)).toEqual([ 'Hero kael 4★', 'Hero kael 9★' ]);
        expect([ ...list.querySelectorAll('.bag-copies') ].map((node) => node.textContent)).toEqual([ 'x1', 'x2' ]);
    });

    it('a 3 star entry with 3 copies reads Para fundir: 3/3 and offers Ir para a fusão', () => {
        const detail = renderBagEntry(entryOf(3, 3), hero('kael', { 3: 3 }, { stars: 3 }), { onFuse: vi.fn() });

        expect(detail.querySelector('.bag-needed').textContent).toBe('Para fundir: 3/3');
        expect(detail.querySelector('[data-testid="bag-go-fusion"]')).not.toBeNull();
    });

    it('an 8 star entry with 2 copies reads Para fundir: 2/3 and offers no button', () => {
        const detail = renderBagEntry(entryOf(8, 2), hero('kael', { 8: 2 }, { stars: 8 }), { onFuse: vi.fn() });

        expect(detail.querySelector('.bag-needed').textContent).toBe('Para fundir: 2/3');
        expect(detail.querySelector('[data-testid="bag-go-fusion"]')).toBeNull();
    });

    it('the stars of a bag entry follow the tier', () => {
        const stars = (n) => renderBagEntry(entryOf(n, 1), hero('kael', { [n]: 1 }, { stars: n }), { onFuse: vi.fn() }).querySelector('.hero-stars');

        expect(stars(4).textContent).toBe('Estrelas: 4★');
        expect(stars(4).classList.contains('is-ascended')).toBe(true);
        expect(stars(7).classList.contains('is-exalted')).toBe(true);
        expect(stars(7).classList.contains('is-ascended')).toBe(false);
        expect(stars(3).classList.contains('is-ascended')).toBe(false);
        expect(stars(3).classList.contains('is-exalted')).toBe(false);
    });
});
