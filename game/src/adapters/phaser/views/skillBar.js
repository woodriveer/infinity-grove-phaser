import { art, el } from './dom';

//  The three skill slots of the leader on the combat screen: art, name and cooldown seconds. A slot the leader has not unlocked is dimmed
//  with a lock mark. The slots only show; clicking one does nothing (the skills are executed by a later feature).
export const renderSkillBar = (leader) =>
{
    const bar = el('div', 'skill-bar', '', { testid: 'skill-bar' });

    leader?.skills.forEach((skill) =>
    {
        const slot = el('div', `skill-slot${skill.unlocked ? '' : ' is-locked'}`, '', { testid: `skill-slot-${skill.slot}`, 'data-unlocked': String(skill.unlocked) });

        slot.append(art(skill.image, skill.name), el('div', 'skill-slot-name', skill.name), el('div', 'skill-slot-cooldown', `${skill.cooldownSeconds}s`));

        if (!skill.unlocked)
        {
            slot.append(el('span', 'skill-lock-mark', '🔒'));
        }

        bar.append(slot);
    });

    return bar;
};
