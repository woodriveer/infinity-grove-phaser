import { describeAffix, describeClickDamage, formatCopper, RARITY_LABELS, SLOT_LABELS, SLOTS } from '../../../domain/equipment/equipment';
import { el } from './dom';

export const EMPTY_TEXT = 'Nenhum equipamento ainda. Vença chefes para encontrar peças.';
export const UNAVAILABLE_TEXT = 'Equipamento indisponível';

//  "Raro Arma +3"
const pieceTitle = (piece) => `${RARITY_LABELS[piece.rarity]} ${SLOT_LABELS[piece.slot]} +${piece.refine}`;

const button = (text, testid, onClick, disabled = false) =>
{
    const node = el('button', 'equip-button', text, { type: 'button', testid, ...(disabled ? { disabled: '' } : {}) });

    node.addEventListener('click', onClick);

    return node;
};

//  The text lines of a piece: the weapon click damage first, then one line per affix
const pieceLines = (piece) => [
    ...(piece.clickDamage == null ? [] : [ describeClickDamage(piece) ]),
    ...piece.affixes.map(describeAffix)
];

//  The failure state of the screen
export const renderEquipmentUnavailable = () => el('p', 'hero-empty', UNAVAILABLE_TEXT, { testid: 'equipment-unavailable' });

//  The screen: the four slots of every owned hero, then the bag. `onSelect(piece)` fires when a worn or bagged piece is clicked.
export const renderEquipment = (pieces, heroes, { onSelect }) =>
{
    if (pieces.length === 0)
    {
        return el('p', 'hero-empty', EMPTY_TEXT, { testid: 'equipment-empty' });
    }

    const screen = el('div', 'equip-screen', '', { testid: 'equipment-list' });

    heroes.filter((hero) => hero.owned).forEach((hero) =>
    {
        const block = el('div', 'equip-hero', '', { testid: `equip-hero-${hero.id}` });

        block.append(el('strong', 'equip-hero-name', hero.name));
        SLOTS.forEach((slot) =>
        {
            const worn = pieces.find((piece) => piece.heroId === hero.id && piece.slot === slot);
            const row = el('button', worn ? 'equip-slot' : 'equip-slot is-empty', '', { type: 'button', testid: `equip-slot-${hero.id}-${slot}` });

            row.append(el('span', 'equip-slot-name', SLOT_LABELS[slot]), el('span', 'equip-slot-piece', worn ? pieceTitle(worn) : 'vazio'));

            if (worn)
            {
                row.addEventListener('click', () => onSelect(worn));
            }
            else
            {
                row.disabled = true;
            }

            block.append(row);
        });
        screen.append(block);
    });

    const bag = pieces.filter((piece) => !piece.heroId);
    const list = el('div', 'bag-list', '', { testid: 'equipment-bag' });

    screen.append(el('strong', 'equip-bag-title', `Mochila (${bag.length})`));
    bag.forEach((piece) =>
    {
        const row = el('button', 'bag-entry', '', { type: 'button', testid: `equip-piece-${piece.id}` });

        row.append(el('span', 'bag-name', pieceTitle(piece)));
        row.addEventListener('click', () => onSelect(piece));
        list.append(row);
    });
    screen.append(list);

    return screen;
};

//  One piece with every action it allows. `walletCopper` is what the player holds, to disable what costs more.
//  actions: onEquip(heroId), onUnequip(), onRefine(), onReroll(affixIndex), onSell()
export const renderPieceDetail = (piece, heroes, walletCopper, actions) =>
{
    const detail = el('div', 'hero-detail equip-detail', '', { testid: 'piece-detail' });
    const text = el('div', 'hero-detail-text');
    const owner = heroes.find((hero) => hero.id === piece.heroId);

    text.append(el('strong', 'hero-name', pieceTitle(piece)));
    pieceLines(piece).forEach((line, index) => text.append(el('div', 'equip-line', line, { testid: `piece-line-${index}` })));
    text.append(el('div', 'equip-worn', owner ? `Equipado em ${owner.name}` : 'Na mochila', { testid: 'piece-worn' }));

    if (owner)
    {
        text.append(button('Remover', 'piece-unequip', () => actions.onUnequip()));
    }

    heroes.filter((hero) => hero.owned && hero.id !== piece.heroId).forEach((hero) =>
    {
        text.append(button(`Equipar em ${hero.name}`, `piece-equip-${hero.id}`, () => actions.onEquip(hero.id)));
    });

    if (piece.refineCost == null)
    {
        text.append(el('div', 'equip-line', 'Refino máximo', { testid: 'piece-max-refine' }));
    }
    else
    {
        text.append(button(`Refinar (${formatCopper(piece.refineCost)})`, 'piece-refine', () => actions.onRefine(), walletCopper < piece.refineCost));
    }

    if (piece.rerollCost != null)
    {
        piece.affixes.forEach((affix, index) =>
        {
            text.append(button(
                `Rerrolar ${describeAffix(affix)} (${formatCopper(piece.rerollCost)})`,
                `piece-reroll-${index}`,
                () => actions.onReroll(index),
                walletCopper < piece.rerollCost
            ));
        });
    }

    text.append(button(`Vender (${formatCopper(piece.sellPrice)})`, 'piece-sell', () => actions.onSell()));
    detail.append(text);

    return detail;
};
