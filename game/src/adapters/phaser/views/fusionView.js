import { availableFusions, FUSION_SIZE, isAscended } from '../../../domain/heroes/heroes';
import { el, starsText } from './dom';

//  The fusion screen: one row per fusion the bag can do now (3 copies of a hero and stars), each with a Fundir button;
//  "Nenhuma fusão disponível" when there is none.
//  `onFuse(heroId, stars)` fires on a click of an enabled button; `selected` ({ heroId, stars }) highlights one row.
export const renderFusion = (heroes, { onFuse, selected = null }) =>
{
    const rows = availableFusions(heroes);

    if (rows.length === 0)
    {
        return el('p', 'hero-empty', 'Nenhuma fusão disponível', { testid: 'fusion-empty' });
    }

    const list = el('div', 'fusion-list', '', { testid: 'fusion-list' });

    rows.forEach((row) =>
    {
        const isSelected = selected?.heroId === row.heroId && selected?.stars === row.stars;
        const node = el('div', `fusion-row${isSelected ? ' is-selected' : ''}`, '', { testid: `fusion-row-${row.heroId}-${row.stars}` });
        const button = el('button', 'fusion-button', 'Fundir', { type: 'button', testid: `fusion-button-${row.heroId}-${row.stars}` });

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

//  The card a fusion made; from 4 stars it names the one skill the new star raised and its new level
export const renderFusionResult = ({ heroName, stars, skillName = '', level = 0 }) =>
    el('div', 'fusion-result', `Nova carta: ${heroName} ${starsText(stars)}${isAscended(stars) && skillName && level >= 1 ? ` · ${skillName} no nível ${level}` : ''}`, { testid: 'fusion-result' });
