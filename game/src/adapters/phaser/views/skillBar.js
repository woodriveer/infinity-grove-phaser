import { art, el, sprite } from './dom';
import { attachSkillTooltip } from './skillTooltip';

const LOCK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
const CROWN_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>';

//  The three skill slots of the leader on the combat screen: art, name and cooldown seconds. A slot the leader has not unlocked is dimmed
//  with a lock mark. Clicking an unlocked slot calls `onUse(slot)`; `refreshSkillBar` keeps its state and cooldown text current.
export const renderSkillBar = (leader, { onUse } = {}) =>
{
    const bar = el('div', 'skill-bar', '', { testid: 'skill-bar' });

    leader?.skills.forEach((skill) =>
    {
        const slot = el('div', `skill-slot${skill.unlocked ? '' : ' is-locked'}`, '', {
            testid: `skill-slot-${skill.slot}`,
            'data-unlocked': String(skill.unlocked),
            'data-slot': String(skill.slot),
            'data-state': skill.unlocked ? 'ready' : 'locked',
            'data-ready-text': `${skill.cooldownSeconds}s`
        });

        slot.append(art(skill.image, skill.name), el('div', 'skill-slot-name', skill.name), el('div', 'skill-slot-cooldown', `${skill.cooldownSeconds}s`));

        if (!skill.unlocked)
        {
            const lock = el('span', 'skill-lock-mark', '', { 'aria-label': 'Bloqueada' });

            lock.innerHTML = LOCK_ICON;
            slot.append(lock);
        }
        else
        {
            slot.addEventListener('click', () => onUse?.(skill.slot));
        }

        attachSkillTooltip(slot, () => skill);
        bar.append(slot);
    });

    return bar;
};

//  The cooldown text of a slot state: "20s" ready, "7s" cooling, "Mirando" while the aimed shot is cast
const slotText = (readyText, { state, seconds }) =>
{
    if (state === 'casting')
    {
        return 'Mirando';
    }

    return state === 'cooling' ? `${seconds}s` : readyText;
};

//  Writes the state of each slot (`stateOf(slot)` -> { state, seconds }) into its data-state and cooldown text; touches the DOM only on a change
export const refreshSkillBar = (bar, stateOf) =>
{
    bar.querySelectorAll('.skill-slot').forEach((slot) =>
    {
        const current = stateOf(Number(slot.getAttribute('data-slot')));
        const text = slotText(slot.getAttribute('data-ready-text'), current);
        const cooldown = slot.querySelector('.skill-slot-cooldown');

        if (slot.getAttribute('data-state') !== current.state)
        {
            slot.setAttribute('data-state', current.state);
            slot.classList.toggle('is-cooling', current.state === 'cooling');
            slot.classList.toggle('is-casting', current.state === 'casting');
        }

        if (cooldown.textContent !== text)
        {
            cooldown.textContent = text;
        }
    });
};

//  The leader on the left of the battle bar: a round portrait with a crown, the name and the leader bonus. Empty without a leader.
export const renderLeaderCard = (leader) =>
{
    const card = el('div', 'leader-card', '', { testid: 'leader-card' });

    if (!leader)
    {
        return card;
    }

    const portrait = el('div', 'leader-portrait');
    const face = el('div', 'leader-face');
    const crown = el('span', 'leader-crown');
    const text = el('div', 'leader-text');

    face.append(sprite(leader.id, ''));
    crown.innerHTML = CROWN_ICON;
    portrait.append(face, crown);
    text.append(el('span', 'leader-name', leader.name), el('span', 'leader-bonus', `Líder · ${leader.leaderBonus}`));
    card.append(portrait, text);

    return card;
};
