import { pieceLines, pieceTitle } from '../../../domain/equipment/equipment';
import { el } from './dom';

const MARGIN = 8;

//  The tooltip of a piece: its title, the weapon line and one line per affix, and where it is (`Equipado em <nome>` or `Na mochila`). No button.
export const renderPieceTooltip = (piece, heroes) =>
{
    const owner = heroes.find((hero) => hero.id === piece.heroId);
    const tooltip = el('div', 'piece-tooltip', '', { testid: 'piece-tooltip' });

    tooltip.append(el('strong', 'piece-tooltip-title', pieceTitle(piece)));
    pieceLines(piece).forEach((line) => tooltip.append(el('div', 'piece-tooltip-line', line)));
    tooltip.append(el('div', 'piece-tooltip-worn', owner ? `Equipado em ${owner.name}` : 'Na mochila'));

    return tooltip;
};

//  Where the tooltip goes inside its host: centred over the tile and kept inside the host (a tile near an edge shifts it), above the tile
//  or below it when there is no room above. Sizes in the unscaled pixels of the host (`scale` is host.offsetWidth / its rectangle width,
//  since the game is scaled to fit the window).
export const tooltipPlace = ({ tile, host, tooltip, scale }) =>
{
    const centre = (tile.left - host.left + tile.width / 2) * scale;
    const left = Math.min(Math.max(centre - tooltip.width / 2, MARGIN), host.width - tooltip.width - MARGIN);
    const above = (tile.top - host.top) * scale - tooltip.height - MARGIN;

    return { left, top: above >= MARGIN ? above : (tile.bottom - host.top) * scale + MARGIN };
};

//  Shows the tooltip of `piece` while the pointer is on `tile` and hides it when it leaves. It lives in the `.hero-panel` (outside the scroll
//  area of the window, so it is never clipped); a tile that is not in a panel holds it itself.
export const attachPieceTooltip = (tile, piece, heroes) =>
{
    let tooltip = null;

    const hide = () =>
    {
        tooltip?.remove();
        tooltip = null;
    };

    tile.addEventListener('pointerenter', () =>
    {
        hide();
        tooltip = renderPieceTooltip(piece, heroes);

        const host = tile.closest('.hero-panel');

        if (!host)
        {
            tile.append(tooltip);
            return;
        }

        host.append(tooltip);

        const hostBox = host.getBoundingClientRect();
        const tileBox = tile.getBoundingClientRect();
        const scale = hostBox.width > 0 ? host.offsetWidth / hostBox.width : 1;
        const { left, top } = tooltipPlace({
            tile: tileBox,
            host: { left: hostBox.left, top: hostBox.top, width: host.offsetWidth },
            tooltip: { width: tooltip.offsetWidth, height: tooltip.offsetHeight },
            scale
        });

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    });
    tile.addEventListener('pointerleave', hide);
};
