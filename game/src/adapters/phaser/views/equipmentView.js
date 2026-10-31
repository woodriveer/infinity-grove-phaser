import { bagPieces, RARITY_ORDER, rarityState, selectedInBag, sellTotal } from '../../../domain/equipment/bulkSell';
import { describeAffix, formatCopper, pieceLines, pieceTitle, SLOT_LABELS, SLOTS } from '../../../domain/equipment/equipment';
import { el } from './dom';
import { renderBulkSellBar } from './bulkSellView';
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

//  The button `Transferir conjunto` of a hero; a click offers one button `Para <nome>` per other owned hero
const renderTransfer = (hero, owned, onTransfer) =>
{
    const box = el('div', 'equip-transfer');
    const open = button('Transferir conjunto', `equip-transfer-${hero.id}`, () =>
    {
        const targets = el('div', 'equip-transfer-targets');

        owned.filter((other) => other.id !== hero.id).forEach((other) =>
        {
            targets.append(button(`Para ${other.name}`, `equip-transfer-${hero.id}-to-${other.id}`, () => onTransfer?.(hero.id, other.id)));
        });
        open.replaceWith(targets);
    });

    box.append(open);

    return box;
};

//  The place of `Transferir conjunto` in selection mode: a hidden copy of the button (same size, no test id, out of the tab order), so the
//  hero block keeps its height and the window does not move when the mode opens
const renderTransferSpace = () =>
{
    const box = el('div', 'equip-transfer is-space');
    const ghost = el('button', 'equip-button', 'Transferir conjunto', { type: 'button', tabindex: '-1', disabled: '' });

    ghost.setAttribute('aria-hidden', 'true');
    box.append(ghost);

    return box;
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
//  then the bag. `onSelect(piece)` fires when a worn or bagged piece is clicked. A hero that wears a piece has the button `Transferir conjunto`
//  (when another hero is owned): it offers `Para <nome>` per other hero and `onTransfer(fromHeroId, toHeroId)` fires for the one picked.
//  `notice` is a line shown at the top (the result of a transfer); `sellNotice` is the line of the last bulk sale, under it; `busy` disables every button while a request runs.
//  `onStartSelling()` fires for `Vender várias`. `selection` is null (mode off) or { ids: Set<string>, confirming, onToggle(piece), onRarity(rarity), onSubmit(),
//  onCancel(), onConfirm(), onDecline() }: a bag click toggles its piece, the worn pieces are locked, the selection bar is shown and the button `Transferir conjunto` is hidden (its place stays).
export const renderEquipment = (pieces, heroes, { onSelect, onTransfer, onStartSelling, stats = null, notice = null, sellNotice = null, busy = false, selection = null }) =>
{
    if (pieces.length === 0)
    {
        const empty = el('p', 'hero-empty', EMPTY_TEXT, { testid: 'equipment-empty' });

        if (!stats && !sellNotice)
        {
            return empty;
        }

        const wrapper = el('div', 'equip-screen');

        if (sellNotice)
        {
            wrapper.append(el('p', 'equip-notice', sellNotice, { testid: 'equip-sell-notice' }));
        }

        if (stats)
        {
            wrapper.append(renderLeaderStats(stats));
        }

        wrapper.append(empty);

        return wrapper;
    }

    const screen = el('div', 'equip-screen', '', { testid: 'equipment-list' });

    if (notice)
    {
        screen.append(el('p', 'equip-notice', notice, { testid: 'equip-transfer-notice' }));
    }

    if (sellNotice)
    {
        screen.append(el('p', 'equip-notice', sellNotice, { testid: 'equip-sell-notice' }));
    }

    if (stats)
    {
        screen.append(renderLeaderStats(stats));
    }

    //  A tile with the tooltip of its piece; a click calls `onClick` (by default it opens the piece with its actions). In selection mode
    //  no tile has a tooltip: it would cover the selection bar
    const tileOf = (piece, testid, onClick = onSelect) =>
    {
        const tile = renderPieceTile(piece, { testid, onClick });

        if (!selection)
        {
            attachPieceTooltip(tile, piece, heroes);
        }

        return tile;
    };

    const owned = heroes.filter((hero) => hero.owned);

    owned.forEach((hero) =>
    {
        const block = el('div', 'equip-hero', '', { testid: `equip-hero-${hero.id}` });
        const heading = el('div', 'equip-hero-heading');
        const wearsSomething = pieces.some((piece) => piece.heroId === hero.id);

        heading.append(el('strong', 'equip-hero-name', hero.name));

        if (wearsSomething && owned.length > 1)
        {
            heading.append(selection ? renderTransferSpace() : renderTransfer(hero, owned, onTransfer));
        }

        block.append(heading);
        SLOTS.forEach((slot) =>
        {
            const worn = pieces.find((piece) => piece.heroId === hero.id && piece.slot === slot);
            const testid = `equip-slot-${hero.id}-${slot}`;
            const cell = el('div', 'equip-slot-cell');

            const cellTile = worn ? tileOf(worn, testid) : renderEmptyTile(slot, { testid });

            if (worn && selection)
            {
                cellTile.disabled = true;
                cellTile.classList.add('is-locked');
            }

            cell.append(el('span', 'equip-slot-name', SLOT_LABELS[slot]), cellTile);
            block.append(cell);
        });
        screen.append(block);
    });

    const bag = bagPieces(pieces);
    const grid = el('div', 'bag-grid', '', { testid: 'equipment-bag' });
    const header = el('div', 'bag-header');

    header.append(el('strong', 'equip-bag-title', `Mochila (${bag.length})`));

    if (!selection && bag.length > 0)
    {
        const start = el('button', 'equip-button', 'Vender várias', { type: 'button', testid: 'bulk-sell-start' });

        start.addEventListener('click', () => onStartSelling?.());
        header.append(start);
    }

    screen.append(header);

    if (selection)
    {
        screen.append(renderBulkSellBar({
            count: selectedInBag(selection.ids, pieces).length,
            total: sellTotal(bag, selection.ids),
            rarities: RARITY_ORDER.map((rarity) => ({ rarity, ...rarityState(selection.ids, bag, rarity) })),
            confirming: selection.confirming,
            onRarity: selection.onRarity,
            onSubmit: selection.onSubmit,
            onCancel: selection.onCancel,
            onConfirm: selection.onConfirm,
            onDecline: selection.onDecline
        }));
    }

    //  In selection mode a bag tile toggles its piece and carries the check mark when selected; it is disabled while the question shows
    const bagTile = (piece) =>
    {
        const testid = `equip-piece-${piece.id}`;

        if (!selection)
        {
            return tileOf(piece, testid);
        }

        const tile = tileOf(piece, testid, selection.onToggle);
        const selected = selection.ids.has(piece.id);

        tile.setAttribute('aria-pressed', selected ? 'true' : 'false');

        if (selected)
        {
            tile.classList.add('is-selected');
            tile.append(el('span', 'piece-check', '✓'));
        }

        tile.disabled = selection.confirming;

        return tile;
    };

    bag.forEach((piece) => grid.append(bagTile(piece)));
    screen.append(grid);

    if (busy)
    {
        screen.querySelectorAll('button').forEach((button) =>
        {
            button.disabled = true;
        });
    }

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
