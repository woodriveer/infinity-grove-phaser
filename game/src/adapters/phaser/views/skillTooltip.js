import { renderSkillRow } from './catalogView';
import { el } from './dom';

//  Shows the skill card of the hero screens (art, name, type, effect, cooldown, Liberada or Bloqueada) over `node` while the pointer is on it.
//  `skillOf()` returns the skill ({ slot, name, type, effect, cooldownSeconds, image, unlocked }) or null, which shows nothing.
//  The tooltip is a child of `node`, so it goes away with it when the node is replaced. `placement` is 'above' or 'below'.
export const attachSkillTooltip = (node, skillOf, placement = 'above') =>
{
    let tooltip = null;

    const hide = () =>
    {
        tooltip?.remove();
        tooltip = null;
    };

    node.addEventListener('pointerenter', () =>
    {
        const skill = skillOf();

        if (!skill)
        {
            return;
        }

        hide();
        tooltip = el('div', `skill-tooltip is-${placement}`, '', { testid: 'skill-tooltip' });
        tooltip.append(renderSkillRow(skill));
        node.append(tooltip);
    });
    node.addEventListener('pointerleave', hide);
};
