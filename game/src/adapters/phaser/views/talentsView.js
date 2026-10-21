import { formatCopper } from '../../../domain/equipment/equipment';
import { BRANCH_TITLES, BRANCHES, describeTalentEffect, talentIconName } from '../../../domain/talents/talents';
import { el, iconWithFallback } from './dom';

export const UNAVAILABLE_TEXT = 'Talentos indisponíveis';

//  The mark drawn in place of an icon whose file is missing, one per branch
const GLYPHS = { TIME: '⏳', BREAK: '🛡', POWER: '⚔' };

//  The failure state of the screen
export const renderTalentsUnavailable = () => el('p', 'hero-empty', UNAVAILABLE_TEXT, { testid: 'talents-unavailable' });

const renderCard = (talent, walletCopper, { busy, onUpgrade }) =>
{
    const card = el('div', 'talent-card', '', { testid: `talent-${talent.id}`, 'data-branch': talent.branch });
    const text = el('div', 'talent-text');
    const maxed = talent.nextCost == null;

    text.append(
        el('strong', 'talent-name', talent.label),
        el('div', 'talent-level', `Nível ${talent.level}/${talent.maxLevel}`, { testid: `talent-level-${talent.id}` }),
        el('div', 'talent-effect', `Efeito: ${describeTalentEffect(talent)}`, { testid: `talent-effect-${talent.id}` })
    );

    if (maxed)
    {
        text.append(el('div', 'talent-max', 'Nível máximo', { testid: `talent-max-${talent.id}` }));
    }
    else
    {
        const button = el('button', 'talent-upgrade', `Melhorar (${formatCopper(talent.nextCost)})`, { type: 'button', testid: `talent-upgrade-${talent.id}` });

        button.disabled = busy || walletCopper < talent.nextCost;
        button.addEventListener('click', () => onUpgrade(talent));
        text.append(button);
    }

    card.append(iconWithFallback(talentIconName(talent.id), GLYPHS[talent.branch], 'talent-icon'), text);

    return card;
};

//  The talent tree: three columns (Tempo, Quebra de defesa, Poder do clique) of cards. `walletCopper` is what the player holds, to disable what
//  costs more; `busy` disables every button while a request runs. `onUpgrade(talent)` fires when a button is clicked.
export const renderTalents = (talents, walletCopper, { busy = false, onUpgrade }) =>
{
    const screen = el('div', 'talent-screen', '', { testid: 'talent-screen' });

    BRANCHES.forEach((branch) =>
    {
        const column = el('div', 'talent-column', '', { testid: `talent-branch-${branch}`, 'data-branch': branch });

        column.append(el('strong', 'talent-branch-title', BRANCH_TITLES[branch]));
        talents.filter((talent) => talent.branch === branch).forEach((talent) => column.append(renderCard(talent, walletCopper, { busy, onUpgrade })));
        screen.append(column);
    });

    return screen;
};
