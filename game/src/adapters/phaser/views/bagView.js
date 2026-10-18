import { bagEntries, FUSION_SIZE, MAX_STARS } from '../../../domain/heroes/heroes';
import { renderSkillList } from './catalogView';
import { el, starsText } from './dom';

//  The bag: one row per (hero, stars) pair with at least one card; `onSelect(entry)` fires when a row is clicked
export const renderBag = (heroes, { onSelect }) =>
{
    const entries = bagEntries(heroes);

    if (entries.length === 0)
    {
        return el('p', 'hero-empty', 'A mochila está vazia.', { testid: 'bag-empty' });
    }

    const list = el('div', 'bag-list', '', { testid: 'bag-list' });

    entries.forEach((entry) =>
    {
        const row = el('button', 'bag-entry', '', { type: 'button', testid: `bag-entry-${entry.heroId}-${entry.stars}` });

        row.append(el('span', 'bag-name', `${entry.heroName} ${starsText(entry.stars)}`), el('span', 'bag-copies', `x${entry.copies}`));
        row.addEventListener('click', () => onSelect(entry));
        list.append(row);
    });

    return list;
};

//  One bag entry: the hero, the stars, the copies, the copies needed to fuse, the hero skills and a way to the fusion screen
export const renderBagEntry = (entry, hero, { onFuse }) =>
{
    const detail = el('div', 'hero-detail', '', { testid: 'bag-entry-detail' });
    const text = el('div', 'hero-detail-text');
    const fusible = entry.stars < MAX_STARS;

    text.append(
        el('strong', 'hero-name', entry.heroName),
        el('div', 'hero-stars', `Estrelas: ${starsText(entry.stars)}`),
        el('div', 'bag-copies', `Cópias: ${entry.copies}`),
        el('div', 'bag-needed', fusible ? `Para fundir: ${entry.copies}/${FUSION_SIZE}` : 'Estrela máxima: não pode ser fundida')
    );

    if (fusible)
    {
        const button = el('button', 'bag-fuse', 'Ir para a fusão', { type: 'button', testid: 'bag-go-fusion' });

        button.addEventListener('click', () => onFuse(entry));
        text.append(button);
    }

    detail.append(text, renderSkillList(hero));

    return detail;
};
