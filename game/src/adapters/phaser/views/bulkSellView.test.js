import { describe, expect, it, vi } from 'vitest';
import { renderBulkSellBar } from './bulkSellView';

const rarities = (overrides = {}) => [ 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY' ].map((rarity) => ({ rarity, available: true, allSelected: false, ...overrides[rarity] }));
const bar = (props = {}) => renderBulkSellBar({
    count: 0, total: 0, rarities: rarities(), confirming: false, onRarity: vi.fn(), onSubmit: vi.fn(), onCancel: vi.fn(), onConfirm: vi.fn(), onDecline: vi.fn(), ...props
});
const find = (root, id) => root.querySelector(`[data-testid="${id}"]`);

describe('renderBulkSellBar', () => {
    it('shows the summary of the selection', () => {
        const root = bar({ count: 3, total: 400 });

        expect(root.getAttribute('data-testid')).toBe('bulk-sell-bar');
        expect(find(root, 'bulk-sell-summary').textContent).toBe('Selecionadas: 3 · Total: 4 prata');
    });

    it('shows the summary of an empty selection', () => {
        expect(find(bar(), 'bulk-sell-summary').textContent).toBe('Selecionadas: 0 · Total: 0 cobre');
    });

    it('shows one button per rarity in order with its label', () => {
        const root = bar();
        const buttons = [ ...root.querySelectorAll('.bulk-sell-rarity') ];

        expect(buttons.map((node) => node.textContent)).toEqual([ 'Comum', 'Incomum', 'Raro', 'Épico', 'Lendário' ]);
        expect(buttons.map((node) => node.getAttribute('data-testid'))).toEqual([
            'bulk-sell-rarity-COMMON', 'bulk-sell-rarity-UNCOMMON', 'bulk-sell-rarity-RARE', 'bulk-sell-rarity-EPIC', 'bulk-sell-rarity-LEGENDARY'
        ]);
        expect(find(root, 'bulk-sell-rarity-EPIC').getAttribute('data-rarity')).toBe('EPIC');
        expect(find(root, 'bulk-sell-rarity-EPIC').classList.contains('rarity-epic')).toBe(true);
    });

    it('disables a rarity the bag does not hold and marks a fully selected one as pressed', () => {
        const root = bar({ rarities: rarities({ COMMON: { allSelected: true }, LEGENDARY: { available: false } }) });

        expect(find(root, 'bulk-sell-rarity-COMMON').getAttribute('aria-pressed')).toBe('true');
        expect(find(root, 'bulk-sell-rarity-COMMON').disabled).toBe(false);
        expect(find(root, 'bulk-sell-rarity-UNCOMMON').getAttribute('aria-pressed')).toBe('false');
        expect(find(root, 'bulk-sell-rarity-LEGENDARY').disabled).toBe(true);
        expect(find(root, 'bulk-sell-rarity-LEGENDARY').getAttribute('aria-pressed')).toBe('false');
    });

    it('calls onRarity with the rarity of the clicked button', () => {
        const onRarity = vi.fn();

        find(bar({ onRarity }), 'bulk-sell-rarity-RARE').click();

        expect(onRarity).toHaveBeenCalledTimes(1);
        expect(onRarity).toHaveBeenCalledWith('RARE');
    });

    it('disables Vender selecionadas with nothing selected and enables it with one', () => {
        const empty = find(bar({ count: 0 }), 'bulk-sell-submit');
        const one = find(bar({ count: 1, total: 100 }), 'bulk-sell-submit');

        expect(empty.disabled).toBe(true);
        expect(empty.textContent).toBe('Vender selecionadas');
        expect(one.disabled).toBe(false);
    });

    it('calls onSubmit and onCancel from their buttons', () => {
        const onSubmit = vi.fn();
        const onCancel = vi.fn();
        const root = bar({ count: 1, total: 100, onSubmit, onCancel });

        find(root, 'bulk-sell-submit').click();
        find(root, 'bulk-sell-cancel').click();

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(find(root, 'bulk-sell-cancel').textContent).toBe('Cancelar');
    });

    it('shows the question with Sim, vender and Não while confirming and hides Vender selecionadas and Cancelar', () => {
        const root = bar({ count: 2, total: 300, confirming: true });

        expect(find(root, 'bulk-sell-question').textContent).toBe('Vender 2 peças por 3 prata?');
        expect(find(root, 'bulk-sell-confirm-yes').textContent).toBe('Sim, vender');
        expect(find(root, 'bulk-sell-confirm-no').textContent).toBe('Não');
        expect(find(root, 'bulk-sell-submit')).toBeNull();
        expect(find(root, 'bulk-sell-cancel')).toBeNull();
        expect(find(root, 'bulk-sell-confirm')).not.toBeNull();
    });

    it('says peça in the question for a single piece', () => {
        expect(find(bar({ count: 1, total: 100, confirming: true }), 'bulk-sell-question').textContent).toBe('Vender 1 peça por 1 prata?');
    });

    it('disables every rarity button while confirming', () => {
        const buttons = [ ...bar({ count: 1, total: 100, confirming: true }).querySelectorAll('.bulk-sell-rarity') ];

        expect(buttons).toHaveLength(5);
        buttons.forEach((node) => expect(node.disabled).toBe(true));
    });

    it('calls onConfirm and onDecline from the confirmation', () => {
        const onConfirm = vi.fn();
        const onDecline = vi.fn();
        const root = bar({ count: 1, total: 100, confirming: true, onConfirm, onDecline });

        find(root, 'bulk-sell-confirm-yes').click();
        find(root, 'bulk-sell-confirm-no').click();

        expect(onConfirm).toHaveBeenCalledTimes(1);
        expect(onDecline).toHaveBeenCalledTimes(1);
    });
});
