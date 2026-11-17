import { canFuseAny, chipText, copyLayers, frameTier } from '../../../domain/heroes/bagCards';
import { bagEntries, FUSION_SIZE, MAX_STARS, starsClass } from '../../../domain/heroes/heroes';
import { renderSkillList } from './catalogView';
import { el, sprite, starsText } from './dom';

//  One hero as a framed card: star badge on the top edge, art, name ribbon, a chip per star layer and the Fundir badge.
//  With `onSelect` it is a button (the grid); without, a div (the copy in the hero detail). A hero not owned is grey and disabled.
export const renderHeroCard = (hero, { onSelect = null, testid = `bag-card-${hero.id}` } = {}) =>
{
    const tier = hero.owned ? frameTier(hero.stars) : 'wood';
    const classes = [ 'bag-card', `frame-${tier}`, hero.owned ? '' : 'is-grey' ].filter(Boolean).join(' ');
    const card = onSelect
        ? el('button', classes, '', { type: 'button', testid, 'data-frame': tier })
        : el('div', classes, '', { testid, 'data-frame': tier });

    if (hero.owned)
    {
        card.append(el('span', [ 'bag-card-star', 'hero-stars', starsClass(hero.stars) ].filter(Boolean).join(' '), starsText(hero.stars), { testid: `bag-card-star-${hero.id}` }));
    }

    card.append(sprite(hero.id, hero.name, 'bag-card-portrait'), el('span', 'bag-card-ribbon', hero.name));

    if (hero.owned)
    {
        const chips = el('span', 'bag-card-chips');

        copyLayers(hero).forEach((layer) => chips.append(el('span', 'bag-card-chip', chipText(layer))));
        card.append(chips);

        if (canFuseAny(hero))
        {
            card.append(el('span', 'bag-card-fuse', 'Fundir', { testid: `bag-card-fuse-${hero.id}` }));
        }
    }
    else
    {
        card.append(el('span', 'bag-card-missing', 'Não encontrado'));
    }

    if (onSelect)
    {
        if (hero.owned)
        {
            card.addEventListener('click', () => onSelect(hero));
        }
        else
        {
            card.disabled = true;
        }
    }

    return card;
};

//  The Mochila: one card per hero in payload order; `onSelect(hero)` fires on the card of an owned hero
export const renderBagCards = (heroes, { onSelect }) =>
{
    if (heroes.length === 0)
    {
        return el('p', 'hero-empty', 'A mochila está vazia.', { testid: 'bag-empty' });
    }

    const grid = el('div', 'bag-cards', '', { testid: 'bag-list' });

    heroes.forEach((hero) => grid.append(renderHeroCard(hero, { onSelect })));

    return grid;
};

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
    const ready = fusible && entry.copies >= FUSION_SIZE;

    text.append(
        el('strong', 'hero-name', entry.heroName),
        el('div', [ 'hero-stars', starsClass(entry.stars) ].filter(Boolean).join(' '), `Estrelas: ${starsText(entry.stars)}`),
        el('div', 'bag-copies', `Cópias: ${entry.copies}`),
        el('div', 'bag-needed', fusible ? `Para fundir: ${entry.copies}/${FUSION_SIZE}` : 'Estrela máxima: não pode ser fundida')
    );

    if (ready)
    {
        const button = el('button', 'bag-fuse', 'Ir para a fusão', { type: 'button', testid: 'bag-go-fusion' });

        button.addEventListener('click', () => onFuse(entry));
        text.append(button);
    }

    detail.append(text, renderSkillList(hero));

    return detail;
};
