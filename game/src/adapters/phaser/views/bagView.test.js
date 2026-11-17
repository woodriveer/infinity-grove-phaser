import { describe, expect, it, vi } from 'vitest';
import { renderBagCards, renderHeroCard } from './bagView';

const heroOf = (id, copies, stars, owned = true) => ({ id, name: `Hero ${id}`, owned, stars, copies, skills: [] });
const byTestid = (root, id) => root.querySelector(`[data-testid="${id}"]`);

describe('renderBagCards', () => {
    it('draws one card per hero in payload order', () => {
        const grid = renderBagCards([ heroOf('kael', { 0: 1 }, 0), heroOf('lyra', { 0: 1 }, 0), heroOf('orina', {}, 0, false) ], { onSelect: vi.fn() });

        expect([ ...grid.children ].map((child) => child.getAttribute('data-testid'))).toEqual([ 'bag-card-kael', 'bag-card-lyra', 'bag-card-orina' ]);
        expect(grid.getAttribute('data-testid')).toBe('bag-list');
        expect(grid.querySelector('[data-testid^="bag-entry-"]')).toBeNull();
    });

    it('an empty payload says the bag is empty', () => {
        const empty = renderBagCards([], { onSelect: vi.fn() });

        expect(empty.getAttribute('data-testid')).toBe('bag-empty');
        expect(empty.textContent).toBe('A mochila está vazia.');
    });

    it('a click on an owned card calls onSelect with the hero and a disabled card calls nothing', () => {
        const onSelect = vi.fn();
        const kael = heroOf('kael', { 0: 1 }, 0);
        const grid = renderBagCards([ kael, heroOf('vex', {}, 0, false) ], { onSelect });

        byTestid(grid, 'bag-card-kael').click();
        byTestid(grid, 'bag-card-vex').click();

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(kael);
    });
});

describe('renderHeroCard', () => {
    it('an owned card shows the best star, the sprite, the name and one chip per layer', () => {
        const card = renderHeroCard(heroOf('kael', { 0: 45, 1: 1, 2: 2 }, 2), { onSelect: vi.fn() });

        expect(byTestid(card, 'bag-card-star-kael').textContent).toBe('2★');
        expect(card.querySelector('img.bag-card-portrait').getAttribute('src').endsWith('assets/heroes/kael_sprite.png')).toBe(true);
        expect(card.querySelector('.bag-card-ribbon').textContent).toBe('Hero kael');
        expect([ ...card.querySelectorAll('.bag-card-chip') ].map((chip) => chip.textContent)).toEqual([ '0★×45', '1★×1', '2★×2' ]);
    });

    it('the frame follows the best star', () => {
        const frame = (stars) => renderHeroCard(heroOf('kael', { [stars]: 1 }, stars), { onSelect: vi.fn() });

        expect([ 3, 4, 6, 7, 9 ].map((stars) => frame(stars).getAttribute('data-frame'))).toEqual([ 'wood', 'silver', 'silver', 'gold', 'gold' ]);
        expect(frame(3).classList.contains('frame-wood')).toBe(true);
        expect(frame(4).classList.contains('frame-silver')).toBe(true);
        expect(frame(7).classList.contains('frame-gold')).toBe(true);
    });

    it('the star badge carries the AD-020 tier class', () => {
        const badge = (stars) => byTestid(renderHeroCard(heroOf('kael', { [stars]: 1 }, stars), { onSelect: vi.fn() }), 'bag-card-star-kael');

        expect(badge(3).classList.contains('hero-stars')).toBe(true);
        expect(badge(3).classList.contains('is-ascended')).toBe(false);
        expect(badge(3).classList.contains('is-exalted')).toBe(false);
        expect(badge(5).classList.contains('is-ascended')).toBe(true);
        expect(badge(8).classList.contains('is-exalted')).toBe(true);
    });

    it('the Fundir badge shows while a layer below 9 holds 3 copies', () => {
        const badge = (copies, stars = 0) => byTestid(renderHeroCard(heroOf('kael', copies, stars), { onSelect: vi.fn() }), 'bag-card-fuse-kael');

        expect(badge({ 0: 3 }).textContent).toBe('Fundir');
        expect(badge({ 0: 2, 1: 2 })).toBeNull();
        expect(badge({ 9: 4 }, 9)).toBeNull();
    });

    it('a hero not owned is a disabled grey wood card with Não encontrado', () => {
        const card = renderHeroCard(heroOf('vex', {}, 0, false), { onSelect: vi.fn() });

        expect(card.disabled).toBe(true);
        expect(card.classList.contains('is-grey')).toBe(true);
        expect(card.getAttribute('data-frame')).toBe('wood');
        expect(card.querySelector('.bag-card-missing').textContent).toBe('Não encontrado');
        expect(byTestid(card, 'bag-card-star-vex')).toBeNull();
        expect(card.querySelectorAll('.bag-card-chip')).toHaveLength(0);
        expect(byTestid(card, 'bag-card-fuse-vex')).toBeNull();
    });

    it('without onSelect the card is a div with the given testid', () => {
        const card = renderHeroCard(heroOf('kael', { 0: 1 }, 0), { testid: 'bag-detail-card-kael' });

        expect(card.tagName).toBe('DIV');
        expect(card.getAttribute('data-testid')).toBe('bag-detail-card-kael');
    });
});
