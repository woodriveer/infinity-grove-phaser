import { RARITY_LABELS } from '../../../domain/equipment/equipment';
import { selectionSummary, sellQuestion } from '../../../domain/equipment/bulkSell';
import { el } from './dom';

const button = (text, testid, onClick, disabled = false, extraClass = '') =>
{
    const node = el('button', `equip-button ${extraClass}`.trim(), text, { type: 'button', testid, ...(disabled ? { disabled: '' } : {}) });

    node.addEventListener('click', onClick);

    return node;
};

//  One rarity button: pressed when every bag piece of the rarity is selected, disabled when the bag holds none or the question is up
const rarityButton = ({ rarity, available, allSelected }, confirming, onRarity) =>
{
    const node = button(RARITY_LABELS[rarity], `bulk-sell-rarity-${rarity}`, () => onRarity(rarity), !available || confirming, `bulk-sell-rarity rarity-${rarity.toLowerCase()}`);

    node.setAttribute('data-rarity', rarity);
    node.setAttribute('aria-pressed', allSelected ? 'true' : 'false');

    return node;
};

//  The bar of selection mode. `rarities` is [ { rarity, available, allSelected } ] in RARITY_ORDER.
//  Callbacks: onRarity(rarity), onSubmit(), onCancel(), onConfirm(), onDecline().
export const renderBulkSellBar = ({ count, total, rarities, confirming, onRarity, onSubmit, onCancel, onConfirm, onDecline }) =>
{
    const bar = el('div', 'bulk-sell-bar', '', { testid: 'bulk-sell-bar' });
    const rarityRow = el('div', 'bulk-sell-rarities');

    bar.append(el('div', 'bulk-sell-summary', selectionSummary(count, total), { testid: 'bulk-sell-summary' }));
    rarities.forEach((state) => rarityRow.append(rarityButton(state, confirming, onRarity)));
    bar.append(rarityRow);

    if (confirming)
    {
        const confirm = el('div', 'bulk-sell-confirm', '', { testid: 'bulk-sell-confirm' });

        confirm.append(el('span', 'bulk-sell-question', sellQuestion(count, total), { testid: 'bulk-sell-question' }));
        confirm.append(button('Sim, vender', 'bulk-sell-confirm-yes', () => onConfirm(), false, 'bulk-sell-yes'));
        confirm.append(button('Não', 'bulk-sell-confirm-no', () => onDecline()));
        bar.append(confirm);
    }
    else
    {
        const actions = el('div', 'bulk-sell-actions');

        actions.append(button('Vender selecionadas', 'bulk-sell-submit', () => onSubmit(), count === 0, 'bulk-sell-submit'));
        actions.append(button('Cancelar', 'bulk-sell-cancel', () => onCancel()));
        bar.append(actions);
    }

    return bar;
};
