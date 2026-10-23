import { BRANCH_TITLES, BRANCHES, describeTalentEffect, talentIconName } from '../../../domain/talents/talents';
import { el, iconWithFallback } from './dom';

export const UNAVAILABLE_TEXT = 'Talentos indisponíveis';

//  The mark drawn in place of an icon whose file is missing, one per branch
const GLYPHS = { TIME: '⏳', BREAK: '🛡', POWER: '⚔', COMBO: '✦' };

//  The failure state of the screen
export const renderTalentsUnavailable = () => el('p', 'hero-empty', UNAVAILABLE_TEXT, { testid: 'talents-unavailable' });

const renderCard = (talent, available, { busy, onUpgrade }) =>
{
    const card = el('div', 'talent-card', '', { testid: `talent-${talent.id}`, 'data-branch': talent.branch });
    const text = el('div', 'talent-text');
    const maxed = talent.nextCost == null;
    const locked = talent.unlocked === false;

    text.append(
        el('strong', 'talent-name', talent.grade > 1 ? `${talent.label} (Grau ${talent.grade})` : talent.label),
        el('div', 'talent-level', `Nível ${talent.level}/${talent.maxLevel}`, { testid: `talent-level-${talent.id}` }),
        el('div', 'talent-effect', `Efeito: ${describeTalentEffect(talent)}`, { testid: `talent-effect-${talent.id}` })
    );

    if (locked)
    {
        card.classList.add('talent-locked');
        text.append(el('div', 'talent-lock', `Bloqueado: chegue ao nível ${talent.maxLevel} do Grau ${talent.grade - 1}`, { testid: `talent-locked-${talent.id}` }));
    }
    else if (maxed)
    {
        text.append(el('div', 'talent-max', 'Nível máximo', { testid: `talent-max-${talent.id}` }));
    }
    else
    {
        const price = `${talent.nextCost} ${talent.nextCost === 1 ? 'ponto' : 'pontos'}`;
        const button = el('button', 'talent-upgrade', `Melhorar (${price})`, { type: 'button', testid: `talent-upgrade-${talent.id}` });

        button.disabled = busy || available < talent.nextCost;
        button.addEventListener('click', () => onUpgrade(talent));
        text.append(button);
    }

    card.append(iconWithFallback(talentIconName(talent.baseId ?? talent.id), GLYPHS[talent.branch], 'talent-icon'), text);

    return card;
};

//  The talent tree: the line "Pontos de talento: <n>" and four columns (Tempo, Quebra de defesa, Poder do clique, Combo) of cards. `points`
//  is { earned, spent, available }; a button is disabled when the talent costs more than `available`, and `busy` disables every button
//  while a request runs. `onUpgrade(talent)` fires when a button is clicked. The "Reiniciar pontos" button asks `onReset()` to take every
//  level back; it is disabled while nothing is spent.
export const renderTalents = (talents, points, { busy = false, onUpgrade, onReset }) =>
{
    const screen = el('div', 'talent-screen', '', { testid: 'talent-screen' });

    screen.append(el('div', 'talent-points', `Pontos de talento: ${points.available}`, { testid: 'talent-points' }));

    const reset = el('button', 'talent-reset', 'Reiniciar pontos', { type: 'button', testid: 'talent-reset' });

    reset.disabled = busy || points.spent === 0;
    reset.addEventListener('click', () => onReset?.());
    screen.append(reset);

    BRANCHES.forEach((branch) =>
    {
        const column = el('div', 'talent-column', '', { testid: `talent-branch-${branch}`, 'data-branch': branch });

        column.append(el('strong', 'talent-branch-title', BRANCH_TITLES[branch]));
        let grade = 0;

        talents.filter((talent) => talent.branch === branch).forEach((talent) =>
        {
            if ((talent.grade ?? 1) !== grade)
            {
                grade = talent.grade ?? 1;
                column.append(el('div', 'talent-grade-title', `Grau ${grade}`, { testid: `talent-grade-${branch}-${grade}` }));
            }

            column.append(renderCard(talent, points.available, { busy, onUpgrade }));
        });
        screen.append(column);
    });

    return screen;
};
