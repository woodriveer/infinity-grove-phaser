import { describe, expect, it, vi } from 'vitest';
import { el } from './dom';
import { renderBagHero, renderFuseAllResult } from './fusionLadderView';

const skills = [ 1, 2, 3 ].map((slot) => ({ slot, name: `Skill ${slot}`, type: 'Ataque', effect: 'x', cooldownSeconds: 10, image: `art_${slot}`, unlocked: false }));
const kael = (copies, stars = 0) => ({ id: 'kael', name: 'Kael', owned: true, stars, copies, skills });
const handlers = () => ({ onFuse: vi.fn(), onFuseAll: vi.fn(), onConfirmAll: vi.fn(), onDeclineAll: vi.fn() });
const byTestid = (root, id) => root.querySelector(`[data-testid="${id}"]`);
const draw = (hero, options = {}) => renderBagHero(hero, { ...handlers(), ...options });

describe('renderBagHero', () => {
    it('holds the card, the ladder, Fundir tudo and the three skills', () => {
        const detail = draw(kael({ 0: 3 }));

        expect(detail.getAttribute('data-testid')).toBe('bag-entry-detail');
        expect(byTestid(detail, 'bag-detail-card-kael').tagName).toBe('DIV');
        expect(byTestid(detail, 'fusion-list')).not.toBeNull();
        expect(byTestid(detail, 'fusion-all').textContent).toBe('Fundir tudo');
        expect(byTestid(detail, 'skill-list').querySelectorAll('.skill-row')).toHaveLength(3);
    });

    it('the rows of 45, 1 and 2 copies are 0, 1 and 2 with their counts', () => {
        const list = byTestid(draw(kael({ 0: 45, 1: 1, 2: 2 }, 2)), 'fusion-list');

        expect([ ...list.children ].map((row) => row.getAttribute('data-testid'))).toEqual([ 'fusion-row-kael-0', 'fusion-row-kael-1', 'fusion-row-kael-2' ]);
        expect([ ...list.querySelectorAll('.fusion-copies') ].map((node) => node.textContent)).toEqual([ '45/3', '1/3', '2/3' ]);
        expect([ ...list.querySelectorAll('.fusion-name') ].map((node) => node.textContent)).toEqual([ '0★', '1★', '2★' ]);
    });

    it('a row has the bar, the count and the s★→s+1★ button', () => {
        const detail = draw(kael({ 0: 3 }));
        const row0 = byTestid(detail, 'fusion-row-kael-0');
        const row1 = byTestid(detail, 'fusion-row-kael-1');
        const bar0 = row0.querySelector('.fusion-bar');

        expect(bar0.getAttribute('role')).toBe('progressbar');
        expect(bar0.getAttribute('aria-valuemin')).toBe('0');
        expect(bar0.getAttribute('aria-valuemax')).toBe('3');
        expect(bar0.getAttribute('aria-valuenow')).toBe('3');
        expect(row0.querySelector('.fusion-bar-fill').style.width).toBe('100%');
        expect(byTestid(row0, 'fusion-button-kael-0').textContent).toBe('0★→1★');
        expect(byTestid(row0, 'fusion-button-kael-0').disabled).toBe(false);
        expect(row1.querySelector('.fusion-copies').textContent).toBe('0/3');
        expect(row1.querySelector('.fusion-bar').getAttribute('aria-valuenow')).toBe('0');
        expect(row1.querySelector('.fusion-bar-fill').style.width).toBe('0%');
        expect(byTestid(row1, 'fusion-button-kael-1').textContent).toBe('1★→2★');
        expect(byTestid(row1, 'fusion-button-kael-1').disabled).toBe(true);
    });

    it('the bar fill is a third per copy', () => {
        const fill = (copies) => byTestid(draw(kael({ 0: copies })), 'fusion-row-kael-0').querySelector('.fusion-bar-fill').style.width;

        expect(fill(1)).toBe('33.333%');
        expect(fill(2)).toBe('66.667%');
    });

    it('a click on an enabled row button calls onFuse with the stars', () => {
        const actions = handlers();
        const detail = renderBagHero(kael({ 0: 3 }), actions);

        byTestid(detail, 'fusion-button-kael-0').click();

        expect(actions.onFuse).toHaveBeenCalledWith(0);
    });

    it('the 9-star row has the copies and the max text and no button', () => {
        const detail = draw(kael({ 9: 1 }, 9));
        const row = byTestid(detail, 'fusion-row-kael-9');

        expect(row.querySelector('.fusion-copies').textContent).toBe('Cópias: 1');
        expect(row.querySelector('.fusion-max').textContent).toBe('Estrela máxima: não pode ser fundida');
        expect(row.querySelector('.fusion-bar')).toBeNull();
        expect(byTestid(detail, 'fusion-button-kael-9')).toBeNull();
        expect(row.classList.contains('is-max')).toBe(true);
    });

    it('Fundir tudo is disabled when no layer below 9 holds 3 copies', () => {
        expect(byTestid(draw(kael({ 0: 2 })), 'fusion-all').disabled).toBe(true);
        expect(byTestid(draw(kael({ 9: 3 }, 9)), 'fusion-all').disabled).toBe(true);

        const actions = handlers();
        const all = byTestid(renderBagHero(kael({ 0: 3 }), actions), 'fusion-all');

        expect(all.disabled).toBe(false);

        all.click();

        expect(actions.onFuseAll).toHaveBeenCalledTimes(1);
    });

    it('busy disables every row button and Fundir tudo', () => {
        const detail = draw(kael({ 0: 6, 1: 3 }), { busy: true });

        expect(byTestid(detail, 'fusion-button-kael-0').disabled).toBe(true);
        expect(byTestid(detail, 'fusion-button-kael-1').disabled).toBe(true);
        expect(byTestid(detail, 'fusion-all').disabled).toBe(true);
    });

    it('pending stars puts Fundindo... on that row button only', () => {
        const detail = draw(kael({ 0: 6, 1: 3 }), { busy: true, pending: 0 });

        expect(byTestid(detail, 'fusion-button-kael-0').textContent).toBe('Fundindo...');
        expect(byTestid(detail, 'fusion-button-kael-0').disabled).toBe(true);
        expect(byTestid(detail, 'fusion-button-kael-1').textContent).toBe('1★→2★');
        expect(byTestid(detail, 'fusion-all').textContent).toBe('Fundir tudo');
    });

    it('pending all puts Fundindo... on Fundir tudo only', () => {
        const detail = draw(kael({ 0: 6, 1: 3 }), { busy: true, pending: 'all' });

        expect(byTestid(detail, 'fusion-all').textContent).toBe('Fundindo...');
        expect(byTestid(detail, 'fusion-all').disabled).toBe(true);
        expect(byTestid(detail, 'fusion-button-kael-0').textContent).toBe('0★→1★');
        expect(byTestid(detail, 'fusion-button-kael-1').textContent).toBe('1★→2★');
    });

    it('busy marks the detail is-busy', () => {
        const busy = draw(kael({ 0: 3 }), { busy: true });

        expect(busy.classList.contains('is-busy')).toBe(true);
        expect(busy.classList.contains('bag-detail')).toBe(true);
        expect(busy.classList.contains('hero-detail')).toBe(true);
        expect(draw(kael({ 0: 3 })).classList.contains('is-busy')).toBe(false);
    });

    it('busy without pending keeps every label', () => {
        const detail = draw(kael({ 0: 3 }), { busy: true });

        expect(byTestid(detail, 'fusion-button-kael-0').textContent).toBe('0★→1★');
        expect(byTestid(detail, 'fusion-all').textContent).toBe('Fundir tudo');
    });

    it('the confirmation shows the question and the preview and locks the ladder', () => {
        const detail = draw(kael({ 0: 45, 1: 1, 2: 2 }, 2), { confirming: true });

        expect(byTestid(detail, 'fusion-all-question').textContent).toBe('Fazer 22 fusões?');
        expect(byTestid(detail, 'fusion-all-preview').textContent).toBe('45×0★ + 1×1★ + 2×2★ → 1×1★ + 1×2★ + 2×3★');
        expect(byTestid(detail, 'fusion-all-yes').textContent).toBe('Sim, fundir');
        expect(byTestid(detail, 'fusion-all-no').textContent).toBe('Não');
        expect(byTestid(detail, 'fusion-button-kael-0').disabled).toBe(true);
        expect(byTestid(detail, 'fusion-all').disabled).toBe(true);
    });

    it('one fusion reads Fazer 1 fusão?', () => {
        expect(byTestid(draw(kael({ 0: 3 }), { confirming: true }), 'fusion-all-question').textContent).toBe('Fazer 1 fusão?');
    });

    it('Sim, fundir and Não call their handlers', () => {
        const actions = handlers();
        const detail = renderBagHero(kael({ 0: 3 }), { ...actions, confirming: true });

        byTestid(detail, 'fusion-all-yes').click();

        expect(actions.onConfirmAll).toHaveBeenCalledTimes(1);

        byTestid(detail, 'fusion-all-no').click();

        expect(actions.onDeclineAll).toHaveBeenCalledTimes(1);
    });

    it('no confirmation without confirming', () => {
        expect(byTestid(draw(kael({ 0: 3 })), 'fusion-all-confirm')).toBeNull();
    });

    it('the result node is placed in the detail', () => {
        const detail = draw(kael({ 0: 3 }), { result: el('div', 'fusion-result', 'X', { testid: 'fusion-result' }) });

        expect(byTestid(detail, 'fusion-result').textContent).toBe('X');
    });
});

describe('renderFuseAllResult', () => {
    it('reads the fusions, the best card and the raised skills', () => {
        const result = renderFuseAllResult({
            heroName: 'Kael Raizférrea',
            fusions: 4,
            stars: 5,
            raised: [ { name: 'Corte Dimensional', level: 2 }, { name: 'Investida do Baluarte', level: 2 } ]
        });

        expect(result.getAttribute('data-testid')).toBe('fusion-result');
        expect(result.className).toBe('fusion-result');
        expect(result.textContent).toBe('4 fusões. Melhor carta: Kael Raizférrea 5★ · Corte Dimensional no nível 2 · Investida do Baluarte no nível 2');
    });
});
