import { pieceTitle } from '../../../domain/equipment/equipment';
import { el, iconWithFallback } from './dom';

//  How many gems a frame carries: the rarity order, so two rarities never differ by colour alone
export const RARITY_GEMS = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4 };

//  The mark drawn in place of the icon of a slot whose file is missing
const SLOT_GLYPHS = { WEAPON: '⚔', ARMOR: '🛡', RING: '💍', AMULET: '📿' };

export const slotIconName = (slot) => `slot-${slot.toLowerCase()}`;

//  A piece as a tile: the icon of its slot, a frame by rarity (class `rarity-<name>`, `data-rarity`, `data-gems`; only EPIC carries
//  `data-effect="fantasy"`) and `+<refine>` above 0. A button, so the player can click it; `onClick(piece)` fires on a click.
export const renderPieceTile = (piece, { testid, onClick }) =>
{
    const tile = el('button', `piece-tile rarity-${piece.rarity.toLowerCase()}`, '', {
        type: 'button',
        testid,
        'aria-label': pieceTitle(piece),
        'data-rarity': piece.rarity,
        'data-slot': piece.slot,
        'data-gems': String(RARITY_GEMS[piece.rarity])
    });
    const gems = el('span', 'piece-gems');

    if (piece.rarity === 'EPIC')
    {
        tile.setAttribute('data-effect', 'fantasy');
    }

    for (let gem = 0; gem < RARITY_GEMS[piece.rarity]; gem++)
    {
        gems.append(el('span', 'piece-gem'));
    }

    tile.append(iconWithFallback(slotIconName(piece.slot), SLOT_GLYPHS[piece.slot], 'piece-icon'), gems);

    if (piece.refine > 0)
    {
        tile.append(el('span', 'piece-refine', `+${piece.refine}`));
    }

    tile.addEventListener('click', () => onClick?.(piece));

    return tile;
};

//  The empty slot of a hero: a dashed tile with the dimmed icon and the text `vazio`; not clickable
export const renderEmptyTile = (slot, { testid }) =>
{
    const tile = el('button', 'piece-tile is-empty', '', { type: 'button', testid, 'data-slot': slot });

    tile.disabled = true;
    tile.append(iconWithFallback(slotIconName(slot), SLOT_GLYPHS[slot], 'piece-icon'), el('span', 'piece-empty', 'vazio'));

    return tile;
};
