import { attachSkillTooltip } from './skillTooltip';
import { el } from './dom';

//  The tags of the effects that run now ({ label, seconds, heroId?, slot? } from the skill combat): "Ventos Ligeiros 12s", "Bomba de Veneno x2 5s".
//  `skillOf({ heroId, slot })` gives the skill card a tag shows on hover; without it the tags have no tooltip.
export const renderEffectTags = (effects, { skillOf } = {}) => effects.map((effect) =>
{
    const tag = el('span', 'tag tag-effect');

    tag.append(el('span', 'tag-text', `${effect.label} ${effect.seconds}s`));

    if (skillOf)
    {
        attachSkillTooltip(tag, () => skillOf(effect), 'below');
    }

    return tag;
});

//  Rewrites the seconds of tags already on screen, so a tooltip open on a tag survives the countdown
export const updateEffectTags = (container, effects) =>
{
    effects.forEach(({ label, seconds }, index) =>
    {
        const text = container.children[index].querySelector('.tag-text');
        const value = `${label} ${seconds}s`;

        if (text.textContent !== value)
        {
            text.textContent = value;
        }
    });
};
