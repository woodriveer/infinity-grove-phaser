import { describe, expect, it, vi } from 'vitest';
import { renderCatalog, renderHeroDetail, renderSkillList, renderSkillRow } from './catalogView';

const skill = (slot, unlocked) => ({
    slot, name: `Skill ${slot}`, type: 'Ataque', effect: `Effect ${slot}`, cooldownSeconds: 10 * slot, image: `kael_skill_${slot}`, unlocked
});

const hero = (id, extra = {}) => ({
    id, name: `Hero ${id}`, heroClass: 'Guerreiro', element: 'FIRE', leaderBonus: `Bonus ${id}`, portrait: `${id}_position`,
    owned: true, stars: 1, skills: [ skill(1, true), skill(2, false), skill(3, false) ], ...extra
});

describe('renderCatalog', () => {
    it('shows every hero with portrait, name, element and stars, owned ones in colour and the others in grey', () => {
        const grid = renderCatalog([ hero('kael'), hero('lyra', { owned: false, stars: 0, element: 'NATURE' }) ], { onSelect: vi.fn() });
        const kael = grid.querySelector('[data-testid="hero-card-kael"]');
        const lyra = grid.querySelector('[data-testid="hero-card-lyra"]');

        expect(grid.querySelectorAll('.hero-card')).toHaveLength(2);
        expect(kael.classList.contains('is-grey')).toBe(false);
        expect(kael.querySelector('img').getAttribute('src')).toBe('assets/heroes/kael_sprite.png');
        expect(kael.querySelector('.hero-name').textContent).toBe('Hero kael');
        expect(kael.querySelector('.hero-meta').textContent).toBe('Fogo');
        expect(kael.querySelector('.hero-stars').textContent).toBe('1★');
        expect(lyra.classList.contains('is-grey')).toBe(true);
        expect(lyra.querySelector('.hero-meta').textContent).toBe('Natureza');
        expect(lyra.querySelector('.hero-stars').textContent).toBe('Não obtido');
    });

    it('shows an owned hero with only blank cards in colour with 0 stars', () => {
        const grid = renderCatalog([ hero('kael', { stars: 0 }) ], { onSelect: vi.fn() });

        expect(grid.querySelector('.hero-card').classList.contains('is-grey')).toBe(false);
        expect(grid.querySelector('.hero-stars').textContent).toBe('0★');
    });

    it('calls onSelect with the hero when a card is clicked, owned or not', () => {
        const onSelect = vi.fn();
        const owned = hero('kael');
        const pending = hero('lyra', { owned: false, stars: 0 });
        const grid = renderCatalog([ owned, pending ], { onSelect });

        grid.querySelector('[data-testid="hero-card-lyra"]').click();
        grid.querySelector('[data-testid="hero-card-kael"]').click();

        expect(onSelect.mock.calls).toEqual([ [ pending ], [ owned ] ]);
    });
});

describe('renderSkillList', () => {
    it('shows three rows in slot order with art, name, type, effect, cooldown and the lock state', () => {
        const list = renderSkillList(hero('kael'));
        const rows = [ ...list.querySelectorAll('.skill-row') ];

        expect(rows.map((row) => row.getAttribute('data-testid'))).toEqual([ 'skill-row-1', 'skill-row-2', 'skill-row-3' ]);
        expect(rows[0].querySelector('img').getAttribute('src')).toBe('assets/heroes/kael_skill_1.jpg');
        expect(rows[1].querySelector('.skill-name').textContent).toBe('Skill 2');
        expect(rows[1].querySelector('.skill-type').textContent).toBe('Ataque');
        expect(rows[1].querySelector('.skill-effect').textContent).toBe('Effect 2');
        expect(rows[1].querySelector('.skill-cooldown').textContent).toBe('Recarga: 20s');
    });

    it('marks the skills above the stars of the hero as locked and the others as unlocked', () => {
        const rows = [ ...renderSkillList(hero('kael')).querySelectorAll('.skill-row') ];

        expect(rows.map((row) => row.getAttribute('data-unlocked'))).toEqual([ 'true', 'false', 'false' ]);
        expect(rows.map((row) => row.classList.contains('is-locked'))).toEqual([ false, true, true ]);
        expect(rows.map((row) => row.querySelector('.skill-state').textContent)).toEqual([ 'Liberada', 'Bloqueada', 'Bloqueada' ]);
    });
});

describe('renderHeroDetail leader bonus', () => {
    it('prints the leader bonus of Lyra as the backend sends it', () => {
        const lyra = { ...hero('lyra'), leaderBonus: '30% de chance de executar um clique duplo crítico.' };

        expect(renderHeroDetail(lyra).querySelector('.hero-bonus').textContent).toBe('Bônus de líder: 30% de chance de executar um clique duplo crítico.');
    });
});

describe('renderHeroDetail', () => {
    it('shows the portrait, class, element, stars, leader bonus and three skills', () => {
        const detail = renderHeroDetail(hero('kael'));

        expect(detail.querySelector('.hero-detail-portrait').getAttribute('src')).toBe('assets/heroes/kael_sprite.png');
        expect(detail.querySelector('.hero-name').textContent).toBe('Hero kael');
        expect(detail.querySelector('.hero-class').textContent).toBe('Classe: Guerreiro');
        expect(detail.querySelector('.hero-element').textContent).toBe('Elemento: Fogo');
        expect(detail.querySelector('.hero-stars').textContent).toBe('Estrelas: 1★');
        expect(detail.querySelector('.hero-bonus').textContent).toBe('Bônus de líder: Bonus kael');
        expect(detail.querySelectorAll('.skill-row')).toHaveLength(3);
    });

    it('shows all three skills of a hero that is not owned, every one locked', () => {
        const detail = renderHeroDetail(hero('lyra', { owned: false, stars: 0, skills: [ skill(1, false), skill(2, false), skill(3, false) ] }));

        expect(detail.querySelectorAll('.skill-row')).toHaveLength(3);
        expect(detail.querySelectorAll('.skill-row.is-locked')).toHaveLength(3);
        expect(detail.querySelector('.hero-stars').textContent).toBe('Não obtido');
    });

    it('shows every skill of a three star hero unlocked', () => {
        const detail = renderHeroDetail(hero('kael', { stars: 3, skills: [ skill(1, true), skill(2, true), skill(3, true) ] }));

        expect(detail.querySelectorAll('.skill-row.is-locked')).toHaveLength(0);
    });
});

describe('skill levels and star power', () => {
    it('a skill row of an unlocked level 1 skill reads Nível 1', () => {
        const label = renderSkillRow({ ...skill(1, true), level: 1 }).querySelector('.skill-level');

        expect(label.textContent).toBe('Nível 1');
        expect(label.getAttribute('data-level')).toBe('1');
    });

    it('a skill row reads Nível 2 and Nível 3 with the power percent', () => {
        const two = renderSkillRow({ ...skill(1, true), level: 2 }).querySelector('.skill-level');
        const three = renderSkillRow({ ...skill(1, true), level: 3 }).querySelector('.skill-level');

        expect(two.textContent).toBe('Nível 2 · +25% de poder');
        expect(two.getAttribute('data-level')).toBe('2');
        expect(three.textContent).toBe('Nível 3 · +50% de poder');
        expect(three.getAttribute('data-level')).toBe('3');
    });

    it('an unlocked skill without a level reads Nível 1', () => {
        expect(renderSkillRow(skill(1, true)).querySelector('.skill-level').textContent).toBe('Nível 1');
    });

    it('a locked skill row has no level, even with a level field', () => {
        expect(renderSkillRow({ ...skill(2, false), level: 3 }).querySelector('.skill-level')).toBeNull();
    });

    it('the catalog card draws 4 to 6 stars ascended and 7 to 9 stars exalted', () => {
        const grid = renderCatalog([
            hero('kael', { stars: 4 }), hero('lyra', { stars: 7 }), hero('orina', { stars: 3 }), hero('vex', { owned: false, stars: 0 })
        ], { onSelect: vi.fn() });
        const stars = (id) => grid.querySelector(`[data-testid="hero-card-${id}"] .hero-stars`);

        expect(stars('kael').classList.contains('is-ascended')).toBe(true);
        expect(stars('kael').classList.contains('is-exalted')).toBe(false);
        expect(stars('kael').textContent).toBe('4★');
        expect(stars('lyra').classList.contains('is-exalted')).toBe(true);
        expect(stars('lyra').classList.contains('is-ascended')).toBe(false);
        expect(stars('lyra').textContent).toBe('7★');
        expect(stars('orina').classList.contains('is-ascended')).toBe(false);
        expect(stars('orina').classList.contains('is-exalted')).toBe(false);
        expect(stars('vex').textContent).toBe('Não obtido');
        expect(stars('vex').className).toBe('hero-stars');
    });

    it('the detail of a 4 star hero shows the star power line', () => {
        const detail = renderHeroDetail(hero('kael', { stars: 4 }));

        expect(detail.querySelector('[data-testid="hero-star-power"]').textContent)
            .toBe('Poder das estrelas: +70% de dano de clique, +35 de chance de crítico, +75% de dano crítico');
        expect(detail.querySelector('.hero-stars').classList.contains('is-ascended')).toBe(true);
    });

    it('the detail of a 9 star hero shows the gold stars and its star power', () => {
        const detail = renderHeroDetail(hero('kael', { stars: 9 }));

        expect(detail.querySelector('[data-testid="hero-star-power"]').textContent)
            .toBe('Poder das estrelas: +220% de dano de clique, +60 de chance de crítico, +200% de dano crítico');
        expect(detail.querySelector('.hero-stars').classList.contains('is-exalted')).toBe(true);
    });

    it('the detail of a 1 star hero shows only the click part', () => {
        expect(renderHeroDetail(hero('kael', { stars: 1 })).querySelector('[data-testid="hero-star-power"]').textContent)
            .toBe('Poder das estrelas: +10% de dano de clique');
    });

    it('the detail of a 0 star hero and of a hero not owned has no star power line', () => {
        expect(renderHeroDetail(hero('kael', { stars: 0 })).querySelector('[data-testid="hero-star-power"]')).toBeNull();
        expect(renderHeroDetail(hero('lyra', { owned: false, stars: 5 })).querySelector('[data-testid="hero-star-power"]')).toBeNull();
    });
});
