import { el } from './dom';

//  The stage plate of the HUD (spec boss-replay-chapters, UI review #1). A farm label of an earlier chapter ends with ` (Capítulo <n>)`:
//  that tag goes in a span drawn on a second, smaller line (style.css .stage-hud-chapter), so the plate stays narrow. The plate's
//  textContent is always the label unchanged.
const CHAPTER_TAG = / \(Capítulo \d+\)$/;

export const renderStageLabel = (node, label) =>
{
    const match = CHAPTER_TAG.exec(label);

    if (!match)
    {
        node.textContent = label;

        return;
    }

    node.replaceChildren(label.slice(0, match.index), el('span', 'stage-hud-chapter', match[0]));
};
