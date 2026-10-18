import { el, starsText } from './dom';

//  The heroes the player may lead with (the owned ones), the current leader marked; `onPick(heroId)` fires for another hero
export const renderLeaderPicker = (heroes, leaderId, { onPick }) =>
{
    const list = el('div', 'leader-list', '', { testid: 'leader-list' });

    heroes.filter((hero) => hero.owned).forEach((hero) =>
    {
        const current = hero.id === leaderId;
        const row = el('button', `leader-entry${current ? ' is-current' : ''}`, '', { type: 'button', testid: `leader-entry-${hero.id}` });

        row.append(el('span', 'leader-name', `${hero.name} ${starsText(hero.stars)}`), el('span', 'leader-state', current ? 'Líder' : ''));
        row.addEventListener('click', () =>
        {
            if (!current)
            {
                onPick(hero.id);
            }
        });
        list.append(row);
    });

    return list;
};
