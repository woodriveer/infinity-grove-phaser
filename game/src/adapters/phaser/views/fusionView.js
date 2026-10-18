import { FUSION_SIZE, fusionRows } from '../../../domain/heroes/heroes';
import { el, starsText } from './dom';

//  The fusion screen: one row per (hero, stars 0 to 2) with the copies out of 3 and a Fundir button that works from 3 copies.
//  `onFuse(heroId, stars)` fires on a click of an enabled button; `selected` ({ heroId, stars }) highlights one row.
export const renderFusion = (heroes, { onFuse, selected = null }) =>
{
    const list = el('div', 'fusion-list', '', { testid: 'fusion-list' });

    fusionRows(heroes).forEach((row) =>
    {
        const isSelected = selected?.heroId === row.heroId && selected?.stars === row.stars;
        const node = el('div', `fusion-row${isSelected ? ' is-selected' : ''}`, '', { testid: `fusion-row-${row.heroId}-${row.stars}` });
        const button = el('button', 'fusion-button', 'Fundir', { type: 'button', testid: `fusion-button-${row.heroId}-${row.stars}` });

        button.disabled = !row.canFuse;
        button.addEventListener('click', () => onFuse(row.heroId, row.stars));
        node.append(
            el('span', 'fusion-name', `${row.heroName} ${starsText(row.stars)} → ${starsText(row.stars + 1)}`),
            el('span', 'fusion-copies', `${row.copies}/${FUSION_SIZE}`),
            button
        );
        list.append(node);
    });

    return list;
};

//  The card a fusion made
export const renderFusionResult = ({ heroName, stars }) =>
    el('div', 'fusion-result', `Nova carta: ${heroName} ${starsText(stars)}`, { testid: 'fusion-result' });
