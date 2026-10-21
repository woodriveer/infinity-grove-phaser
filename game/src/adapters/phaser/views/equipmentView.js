import { describeAffix, formatCopper, pieceLines, pieceTitle, SLOT_LABELS, SLOTS } from '../../../domain/equipment/equipment';
import { el } from './dom';
import { attachPieceTooltip } from './pieceTooltip';
import { renderEmptyTile, renderPieceTile } from './pieceTile';

export const EMPTY_TEXT = 'Nenhum equipamento ainda. Vença chefes para encontrar peças.';
export const UNAVAILABLE_TEXT = 'Equipamento indisponível';

const button = (text, testid, onClick, disabled = false) =>
{
    const node = el('button', 'equip-button', text, { type: 'button', testid, ...(disabled ? { disabled: '' } : {}) });

    node.addEventListener('click', onClick);

    return node;
};

//  The attribute panel of the leader: `Atributos de <nome>` and one line per attribute ({ id, text } from `leaderStats`)
export const renderLeaderStats = ({ name, lines }) =>
{
    const panel = el('div', 'leader-stats', '', { testid: 'leader-stats' });

    panel.append(el('strong', 'leader-stats-title', `Atributos de ${name}`));
    lines.forEach(({ id, text }) => panel.append(el('div', 'stat-line', text, { testid: `stat-${id}` })));

    return panel;
};

//  The failure state of the screen
export const renderEquipmentUnavailable = () => el('p', 'hero-empty', UNAVAILABLE_TEXT, { testid: 'equipment-unavailable' });

//  The screen: the attribute panel of the leader (`stats` = { name, lines }, absent without a leader), the four slots of every owned hero,
//  then the bag. `onSelect(piece)` fires when a worn or bagged piece is clicked.
export const renderEquipment = (pieces, heroes, { onSelect, stats = null }) =>
{
    if (pieces.length === 0)
    {
        const empty = el('p', 'hero-empty', EMPTY_TEXT, { testid: 'equipment-empty' });

        if (!stats)
        {
            return empty;
        }

        const wrapper = el('div', 'equip-screen');

        wrapper.append(renderLeaderStats(stats), empty);

        return wrapper;
    }

    const screen = el('div', 'equip-screen', '', { testid: 'equipment-list' });

    if (stats)
    {
        screen.append(renderLeaderStats(stats));
    }

    //  A tile with the tooltip of its piece; a click opens the piece with its actions
    const tileOf = (piece, testid) =>
    {
        const tile = renderPieceTile(piece, { testid, onClick: onSelect });

        attachPieceTooltip(tile, piece, heroes);

        return tile;
    };

    heroes.filter((hero) => hero.owned).forEach((hero) =>
    {
        const block = el('div', 'equip-hero', '', { testid: `equip-hero-${hero.id}` });

        block.append(el('strong', 'equip-hero-name', hero.name));
        SLOTS.forEach((slot) =>
        {
            const worn = pieces.find((piece) => piece.heroId === hero.id && piece.slot === slot);
            const testid = `equip-slot-${hero.id}-${slot}`;
            const cell = el('div', 'equip-slot-cell');

            cell.append(el('span', 'equip-slot-name', SLOT_LABELS[slot]), worn ? tileOf(worn, testid) : renderEmptyTile(slot, { testid }));
            block.append(cell);
        });
        screen.append(block);
    });

    const bag = pieces.filter((piece) => !piece.heroId);
    const grid = el('div', 'bag-grid', '', { testid: 'equipment-bag' });

    screen.append(el('strong', 'equip-bag-title', `Mochila (${bag.length})`));
    bag.forEach((piece) => grid.append(tileOf(piece, `equip-piece-${piece.id}`)));
    screen.append(grid);

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
