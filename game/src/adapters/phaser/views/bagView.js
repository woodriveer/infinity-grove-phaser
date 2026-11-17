import { canFuseAny, chipText, copyLayers, frameTier } from '../../../domain/heroes/bagCards';
import { starsClass } from '../../../domain/heroes/heroes';
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
