import { ELEMENT_LABELS } from '../../../domain/heroes/heroes';
import { art, el, sprite, starsText } from './dom';

//  One skill with its art, name, type, effect and cooldown, marked unlocked or locked. Locked skills are shown all the same.
export const renderSkillRow = (skill) =>
{
    const row = el('div', `skill-row${skill.unlocked ? '' : ' is-locked'}`, '', { testid: `skill-row-${skill.slot}`, 'data-unlocked': String(skill.unlocked) });
    const text = el('div');

    text.append(
        el('span', 'skill-name', skill.name),
        document.createTextNode(' '),
        el('span', 'skill-type', skill.type),
        el('p', 'skill-effect', skill.effect),
        el('span', 'skill-cooldown', `Recarga: ${skill.cooldownSeconds}s`),
        document.createTextNode(' '),
        el('span', 'skill-state', skill.unlocked ? 'Liberada' : 'Bloqueada')
    );
    row.append(art(skill.image, skill.name, 'skill-art'), text);

    return row;
};

//  The three skills of a hero, one row each, in slot order
export const renderSkillList = (hero) =>
{
    const list = el('div', 'skill-list', '', { testid: 'skill-list' });

    hero.skills.forEach((skill) => list.append(renderSkillRow(skill)));

    return list;
};

//  The catalog: every hero, owned ones in colour and the others in grey; `onSelect(hero)` fires when a card is clicked
export const renderCatalog = (heroes, { onSelect }) =>
{
    const grid = el('div', 'hero-grid', '', { testid: 'hero-grid' });

    heroes.forEach((hero) =>
    {
        const card = el('button', `hero-card${hero.owned ? '' : ' is-grey'}`, '', { type: 'button', testid: `hero-card-${hero.id}` });

        card.append(
            sprite(hero.id, hero.name, 'hero-portrait'),
            el('span', 'hero-name', hero.name),
            el('span', 'hero-meta', ELEMENT_LABELS[hero.element]),
            el('span', 'hero-stars', hero.owned ? starsText(hero.stars) : 'Não obtido')
        );
        card.addEventListener('click', () => onSelect(hero));
        grid.append(card);
    });

    return grid;
};

//  One hero in full: sprite, class, element, leader bonus and the three skills
export const renderHeroDetail = (hero) =>
{
    const detail = el('div', 'hero-detail', '', { testid: 'hero-detail' });
    const text = el('div', 'hero-detail-text');

    text.append(
        el('strong', 'hero-name', hero.name),
        el('div', 'hero-class', `Classe: ${hero.heroClass}`),
        el('div', 'hero-element', `Elemento: ${ELEMENT_LABELS[hero.element]}`),
        el('div', 'hero-stars', hero.owned ? `Estrelas: ${starsText(hero.stars)}` : 'Não obtido'),
        el('div', 'hero-bonus', `Bônus de líder: ${hero.leaderBonus}`)
    );
    detail.append(sprite(hero.id, hero.name, 'hero-detail-portrait'), text, renderSkillList(hero));

    return detail;
};
