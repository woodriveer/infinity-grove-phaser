import { elementMultiplier, FIRE, LIGHT, DARKNESS, NATURE, WATER } from '../../../domain/combat/elements';
import { ELEMENT_LABELS } from '../../../domain/heroes/heroes';
import { el } from './dom';

//  The triad corners inside the 150 x 100 triangle box (centres of the 30 px badges) and the glyph of each element
const TRIAD = [
    { element: FIRE, x: 75, y: 14, glyph: '🔥' },
    { element: NATURE, x: 128, y: 84, glyph: '🌿' },
    { element: WATER, x: 22, y: 84, glyph: '💧' }
];
const PAIR = [ { element: LIGHT, glyph: '☀' }, { element: DARKNESS, glyph: '☾' } ];
const BADGE_RADIUS = 15;

//  "x2", "x1,8": the multiplier as the player reads it
const times = (value) => `x${String(value).replace('.', ',')}`;

const badge = ({ element, glyph }, className = '') =>
{
    const node = el('span', `wheel-badge wheel-${element.toLowerCase()} ${className}`.trim());

    node.append(el('span', 'wheel-glyph', glyph), el('span', 'wheel-name', ELEMENT_LABELS[element]));

    return node;
};

//  One arrow from corner `from` to corner `to`, placed by its two ends and shortened to leave the badges free
const arrow = (from, to) =>
{
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) - 2 * BADGE_RADIUS;
    const angle = Math.atan2(dy, dx);
    const node = el('span', 'wheel-arrow', '', { 'data-from': from.element, 'data-to': to.element });
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    node.style.left = `${midX - length / 2}px`;
    node.style.top = `${midY}px`;
    node.style.width = `${length}px`;
    node.style.transform = `rotate(${angle}rad)`;

    const label = el('span', 'wheel-arrow-label', times(elementMultiplier(from.element, to.element)));

    label.style.left = `${midX}px`;
    label.style.top = `${midY}px`;

    return [ node, label ];
};

//  The element rules as a CSS drawing: the triad with its arrows, the light and darkness pair, and the rule in words.
//  Every multiplier comes from `elementMultiplier`, so the drawing cannot drift from the damage formula.
export const renderElementWheel = () =>
{
    const wheel = el('div', 'element-wheel', '', { testid: 'element-wheel' });
    const triad = el('div', 'wheel-triad');
    const pair = el('div', 'wheel-pair');
    const [ light, darkness ] = PAIR;

    TRIAD.forEach((corner, index) =>
    {
        const next = TRIAD[(index + 1) % TRIAD.length];
        const node = badge(corner);

        node.style.left = `${corner.x}px`;
        node.style.top = `${corner.y}px`;
        triad.append(node, ...arrow(corner, next));
    });

    pair.append(
        badge(light),
        el('span', 'wheel-pair-link', times(elementMultiplier(LIGHT, DARKNESS))),
        badge(darkness),
        el('span', 'wheel-vs-triad', times(elementMultiplier(LIGHT, FIRE)))
    );

    wheel.append(
        el('div', 'wheel-title', 'Elementos'),
        triad,
        pair,
        el('p', 'wheel-rule', `${ELEMENT_LABELS[FIRE]} vence ${ELEMENT_LABELS[NATURE]}, ${ELEMENT_LABELS[NATURE]} vence ${ELEMENT_LABELS[WATER]}, ${ELEMENT_LABELS[WATER]} vence ${ELEMENT_LABELS[FIRE]}: dano em dobro`)
    );

    return wheel;
};
