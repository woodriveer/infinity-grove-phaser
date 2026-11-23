import { BRANCH_TITLES, BRANCHES, branchGlow, describeTalentEffect, talentFullName, talentIconName, talentLockText } from '../../../domain/talents/talents';
import { el, iconWithFallback } from './dom';
import {
    BANNER_POSITIONS, BRANCH_GLOWS, CAPTION_ROOM, FIXED_BOTTOM, FIXED_TOP, LARGE_NODE_HALF, LARGE_NODES, NODE_HALF, NODE_POSITIONS, REVEAL_MARGIN, TREE_IMAGE, TREE_SIZE, VEINS
} from './talentTreeLayout';

export const UNAVAILABLE_TEXT = 'Talentos indisponíveis';
export const EMPTY_DETAIL_TEXT = 'Escolha um talento na árvore para ver os detalhes.';

//  The mark drawn in place of an icon whose file is missing, one per branch
const GLYPHS = { TIME: '⏳', BREAK: '🛡', POWER: '⚔', COMBO: '✦' };

const SVG_NS = 'http://www.w3.org/2000/svg';

//  The failure state of the screen
export const renderTalentsUnavailable = () => el('p', 'hero-empty', UNAVAILABLE_TEXT, { testid: 'talents-unavailable' });

//  An image appended to `host`; when its file is missing the image goes away and `host` gets `fallbackClass`, so the CSS draws the part
const art = (src, className, host, fallbackClass) =>
{
    const image = el('img', className, '', { src, alt: '' });

    image.addEventListener('error', () =>
    {
        host.classList.add(fallbackClass);
        image.remove();
    });
    host.append(image);

    return image;
};

const percent = (value) => `${value}%`;

//  locked, maxed, available (the points pay the next level) or open (they do not)
const stateOf = (talent, available) =>
{
    if (talent.unlocked === false)
    {
        return 'locked';
    }

    if (talent.nextCost == null)
    {
        return 'maxed';
    }

    return available >= talent.nextCost ? 'available' : 'open';
};

//  The lit layers of the four branches: the painted veins glow with the levels bought (opacity from `branchGlow`)
const renderLit = (talents) => BRANCHES.map((branch) =>
{
    const { x, y, rx, ry } = BRANCH_GLOWS[branch];
    const lit = el('div', 'talent-lit', '', { testid: `talent-lit-${branch}`, 'data-branch': branch });

    lit.style.setProperty('--cx', percent(x));
    lit.style.setProperty('--cy', percent(y));
    lit.style.setProperty('--rx', percent(rx));
    lit.style.setProperty('--ry', percent(ry));
    lit.style.opacity = String(branchGlow(talents, branch));

    return lit;
});

//  The trunk and the veins drawn when the painted board is missing
const renderVeins = () =>
{
    const svg = document.createElementNS(SVG_NS, 'svg');

    svg.setAttribute('class', 'talent-tree-veins');
    svg.setAttribute('data-testid', 'talent-tree-veins');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    VEINS.forEach((vein) =>
    {
        const line = document.createElementNS(SVG_NS, 'polyline');

        line.setAttribute('points', vein.map(({ x, y }) => `${x},${y}`).join(' '));
        svg.append(line);
    });

    return svg;
};

const renderBanner = (branch) =>
{
    const banner = el('div', 'talent-banner', '', { testid: `talent-branch-${branch}`, 'data-branch': branch });
    const { x, y } = BANNER_POSITIONS[branch];

    banner.style.left = percent(x);
    banner.style.top = percent(y);
    art('assets/talent-banner.png', 'talent-banner-art', banner, 'no-art');
    banner.append(el('strong', 'talent-branch-title', BRANCH_TITLES[branch]));

    return banner;
};

const renderNode = (talent, { available, selectedId, onSelect }) =>
{
    const large = LARGE_NODES.includes(talent.id);
    const grade = talent.grade ?? 1;
    const baseId = talent.baseId ?? talent.id;
    const state = stateOf(talent, available);
    const name = talentFullName(talent);
    const node = el('button', large ? 'talent-node is-large' : 'talent-node', '', {
        type: 'button',
        testid: `talent-${talent.id}`,
        'data-branch': talent.branch,
        'data-grade': String(grade),
        'data-state': state,
        title: name,
        'aria-label': `${name}, nível ${talent.level} de ${talent.maxLevel}`,
        'aria-pressed': String(talent.id === selectedId)
    });
    const { x, y } = NODE_POSITIONS[talent.id];

    node.style.left = percent(x);
    node.style.top = percent(y);
    node.addEventListener('click', () => onSelect(talent.id));
    art(large ? 'assets/talent-node-frame-large.png' : 'assets/talent-node-frame.png', 'talent-node-frame', node, 'no-frame');
    //  A grade without its own file shows the icon of grade 1
    node.append(iconWithFallback(talentIconName(baseId, grade), GLYPHS[talent.branch], 'talent-node-icon', grade > 1 ? talentIconName(baseId) : null));

    if (state === 'locked')
    {
        node.append(iconWithFallback('talent-node-lock', '🔒', 'talent-node-lock'));
    }

    if (grade > 1)
    {
        node.append(el('span', 'talent-node-grade', grade === 2 ? 'II' : 'III', { testid: `talent-node-grade-${talent.id}` }));
    }

    node.append(el('span', 'talent-node-level', `${talent.level}/${talent.maxLevel}`, { testid: `talent-node-level-${talent.id}` }));

    if (grade === 1)
    {
        node.append(el('span', 'talent-node-caption', talent.label, { testid: `talent-caption-${talent.id}` }));
    }

    return node;
};

//  The card under the tree: the selected talent, its effect and its upgrade button, or the hint when nothing is selected
const renderDetail = (talents, available, { busy, selectedId, onUpgrade }) =>
{
    const talent = talents.find(({ id }) => id === selectedId);
    const detail = el('div', 'talent-detail', '', { testid: 'talent-detail' });

    if (!talent)
    {
        detail.append(el('p', 'talent-detail-empty', EMPTY_DETAIL_TEXT, { testid: 'talent-detail-empty' }));

        return detail;
    }

    detail.setAttribute('data-branch', talent.branch);
    detail.append(
        el('strong', 'talent-detail-name', talentFullName(talent), { testid: 'talent-detail-name' }),
        el('div', 'talent-level', `Nível ${talent.level}/${talent.maxLevel}`, { testid: `talent-level-${talent.id}` }),
        el('div', 'talent-effect', `Efeito: ${describeTalentEffect(talent)}`, { testid: `talent-effect-${talent.id}` })
    );

    if (talent.unlocked === false)
    {
        detail.append(el('div', 'talent-lock', talentLockText(talent, talents), { testid: `talent-locked-${talent.id}` }));
    }
    else if (talent.nextCost == null)
    {
        detail.append(el('div', 'talent-max', 'Nível máximo', { testid: `talent-max-${talent.id}` }));
    }
    else
    {
        const price = `${talent.nextCost} ${talent.nextCost === 1 ? 'ponto' : 'pontos'}`;
        const button = el('button', 'talent-upgrade', `Melhorar (${price})`, { type: 'button', testid: `talent-upgrade-${talent.id}` });

        button.disabled = busy || available < talent.nextCost;
        button.addEventListener('click', () => onUpgrade(talent));
        detail.append(button);
    }

    return detail;
};

//  The talent tree on a painted board (spec talent-tree-rework): a scrolling board with the four banners, the nodes of the talents the layout
//  places, the lit veins of each branch and the fallback veins, then the fixed plaque "Talentos", the medallion "Pontos de talento: <n>", the
//  button "Reiniciar pontos" and the detail card. `points` is { earned, spent, available }. A click on a node asks `onSelect(id)` (no
//  request); the card of `selectedId` holds the upgrade button, disabled when the talent costs more than `available`, and `busy` disables
//  every button while a request runs. `onUpgrade(talent)` fires when the card button is clicked and `onReset()` when "Reiniciar pontos" is,
//  which takes every level back and is disabled while nothing is spent. Every art file has a CSS or text fallback.
export const renderTalents = (talents, points, { busy = false, selectedId = null, onSelect = () => {}, onUpgrade, onReset }) =>
{
    const screen = el('div', 'talent-screen', '', { testid: 'talent-screen' });
    const scroll = el('div', 'talent-tree-scroll', '', { testid: 'talent-tree-scroll' });
    const tree = el('div', 'talent-tree', '', { testid: 'talent-tree' });

    art(TREE_IMAGE, 'talent-tree-image', tree, 'is-fallback');
    tree.append(...renderLit(talents), renderVeins());

    BRANCHES.forEach((branch) =>
    {
        tree.append(renderBanner(branch));
        talents
            .filter((talent) => talent.branch === branch && NODE_POSITIONS[talent.id])
            .forEach((talent) => tree.append(renderNode(talent, { available: points.available, selectedId, onSelect })));
    });
    scroll.append(tree);

    const title = el('div', 'talent-title', '', { testid: 'talent-title' });

    art('assets/talent-title-plaque.png', 'talent-plaque-art', title, 'no-art');
    title.append(el('span', 'talent-title-text', 'Talentos'));

    const medallion = el('div', 'talent-points', '', { testid: 'talent-points' });

    art('assets/talent-points-medallion.png', 'talent-round-art', medallion, 'no-art');
    medallion.append(el('span', 'talent-pill', `Pontos de talento: ${points.available}`));

    const reset = el('button', 'talent-reset', '', { type: 'button', testid: 'talent-reset' });

    reset.disabled = busy || points.spent === 0;
    reset.addEventListener('click', () => onReset?.());
    art('assets/talent-reset-button.png', 'talent-round-art', reset, 'no-art');
    reset.append(el('span', 'talent-pill', 'Reiniciar pontos'));

    screen.append(scroll, title, medallion, reset, renderDetail(talents, points.available, { busy, selectedId, onUpgrade }));

    return screen;
};

const scrollOf = (screen) => screen?.querySelector('[data-testid="talent-tree-scroll"]') ?? null;

//  The scroll position of the tree of `screen`, to carry it over a re-render; null when there is no tree
export const talentScrollOf = (screen) =>
{
    const scroll = scrollOf(screen);

    return scroll ? { left: scroll.scrollLeft, top: scroll.scrollTop } : null;
};

//  Puts the tree of `screen` (already in the page) at `previous`, or at the centre of the board when there is none
export const placeTalentScroll = (screen, previous) =>
{
    const scroll = scrollOf(screen);

    if (!scroll)
    {
        return;
    }

    scroll.scrollLeft = previous ? previous.left : (scroll.scrollWidth - scroll.clientWidth) / 2;
    scroll.scrollTop = previous ? previous.top : (scroll.scrollHeight - scroll.clientHeight) / 2;
};

//  `offset` moved the least that puts `centre` (a position on the board) between `low` and `high` of the viewport, inside `0..limit`
const keepBetween = (offset, centre, low, high, limit) =>
{
    const at = centre - offset;
    const moved = at < low ? centre - low : at > high ? centre - high : offset;

    return Math.min(Math.max(moved, 0), limit);
};

//  Scrolls the tree of `screen` so the node `id` and its caption sit in the free area, clear of the plaque, the card and the bottom buttons that stay
//  fixed over the board (a phone shows the board zoomed, so the node can sit under its own card); a node already there keeps the scroll the player chose.
//  Nothing happens when the board does not scroll (the desktop) or the talent has no node.
export const revealTalent = (screen, id) =>
{
    const scroll = scrollOf(screen);
    const position = NODE_POSITIONS[id];

    if (!scroll || !position || (scroll.scrollWidth <= scroll.clientWidth && scroll.scrollHeight <= scroll.clientHeight))
    {
        return;
    }

    const zoom = scroll.scrollWidth / TREE_SIZE.width;
    const half = (LARGE_NODES.includes(id) ? LARGE_NODE_HALF : NODE_HALF) * zoom;
    const margin = REVEAL_MARGIN * zoom;

    scroll.scrollLeft = keepBetween(scroll.scrollLeft, position.x / 100 * scroll.scrollWidth, half + margin, scroll.clientWidth - half - margin, scroll.scrollWidth - scroll.clientWidth);
    scroll.scrollTop = keepBetween(
        scroll.scrollTop, position.y / 100 * scroll.scrollHeight,
        FIXED_TOP + half, scroll.clientHeight - FIXED_BOTTOM - half - CAPTION_ROOM * zoom, scroll.scrollHeight - scroll.clientHeight
    );
};
