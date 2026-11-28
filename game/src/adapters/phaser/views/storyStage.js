import { STORY_DEFAULT_MOTES } from '../../../domain/story/storyCatalog';
import { cameraOf, cameraTransform, hitLabel, progressDots, sceneLook } from '../../../domain/story/storyPlayback';
import { TINTS } from '../../../domain/story/storyScenes';
import { lineText } from '../../../domain/story/storyText';
import { el } from './dom';

const CHEVRON = (width, height) => `<svg width="${width}" height="${height}" viewBox="0 0 28 18" aria-hidden="true"><path d="M3 3 L14 14 L25 3" fill="none" stroke="#f3dc95" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const SPEAKER = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 L6 9 H3 v6 h3 l5 4 z"></path>';
const ICON_MUTED = `${SPEAKER}<path d="M17 9 l5 6"></path><path d="M22 9 l-5 6"></path></svg>`;
const ICON_SOUND = `${SPEAKER}<path d="M15.5 8.5 a5 5 0 0 1 0 7"></path><path d="M18.5 5.5 a9 9 0 0 1 0 13"></path></svg>`;

//  An inline SVG from a fixed markup string
const svg = (markup) =>
{
    const holder = document.createElement('div');

    holder.innerHTML = markup;

    return holder.firstElementChild;
};

//  The story overlay (spec story-scenes): built once per scene; update() repaints it from { state, shown, t, muted }.
//  The content of a card or line is rebuilt only when the phase or the line changes, so its entrance plays once.
export const createStoryStage = ({ scene, backdrops, onHit, onSkip, onMute }) =>
{
    const root = el('div', `story-overlay is-${scene.trigger.kind}`, '', {
        testid: 'story-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': `História: ${scene.label}`
    });
    const hit = el('button', 'story-hit', '', { type: 'button', testid: 'story-hit' });
    const stage = el('div', 'story-stage', '', { testid: 'story-stage' });
    const camera = el('div', 'story-camera', '', { testid: 'story-camera' });
    const content = el('div', 'story-content');
    const dotsBox = el('div', 'story-dots', '', { 'aria-hidden': 'true' });
    const skip = el('button', 'story-skip', 'Pular', { type: 'button', testid: 'story-skip' });
    const mute = el('button', 'story-mute', '', { type: 'button', testid: 'story-mute' });
    const ui = el('div', 'story-ui');

    hit.addEventListener('click', () => onHit());
    skip.addEventListener('click', () => onSkip());
    mute.addEventListener('click', () => onMute());

    const backdropNodes = Object.entries(backdrops).map(([ key, backdrop ]) =>
    {
        const node = el('div', `story-backdrop is-${backdrop.motion}`, '', { 'data-backdrop': key });

        node.style.backgroundImage = `url("${backdrop.image}")`;

        return [ key, node ];
    });
    const tintNodes = TINTS.map((name) => [ name, el('div', `story-tint is-${name}`) ]);
    const veins = tintNodes.find(([ name ]) => name === 'veins')[1];
    const bars = scene.letterbox ? [ el('div', 'story-bar is-top'), el('div', 'story-bar is-bottom') ] : [];
    const dots = scene.lines.map(() => el('span', 'story-dot'));

    camera.append(...backdropNodes.map(([ , node ]) => node), veins);
    dotsBox.append(...dots);
    ui.append(dotsBox, skip, mute);
    stage.append(
        camera,
        ...tintNodes.filter(([ name ]) => name !== 'veins').map(([ , node ]) => node),
        ...(scene.motes ?? STORY_DEFAULT_MOTES).map(([ left, top, delay, duration ]) =>
        {
            const mote = el('span', 'story-mote');

            mote.style.left = `${left}px`;
            mote.style.top = `${top}px`;
            mote.style.animationDelay = `${delay}s`;
            mote.style.animationDuration = `${duration}s`;

            return mote;
        }),
        ...bars,
        el('div', 'story-vignette'),
        content,
        ui
    );
    root.append(hit, stage);

    //  The text of the line on screen: the typed part and the rest, which keeps the line from re-wrapping while it types
    let shownNode = null;
    let ghostNode = null;
    let nextNode = null;
    let lastContent = null;
    let lastShown = null;
    let lastCamera = null;
    let lastMuted = null;

    const textNode = (className, testid) =>
    {
        const node = el('p', className, '', { testid });

        shownNode = el('span', 'story-shown');
        ghostNode = el('span', 'story-ghost');
        node.append(shownNode, ghostNode);

        return node;
    };

    const arrow = (className, width, height) =>
    {
        nextNode = el('div', className);
        nextNode.append(svg(CHEVRON(width, height)));

        return nextNode;
    };

    const plate = (line) => el('span', 'story-name', line.speaker, { testid: 'story-speaker' });

    const box = (className, line, italic, lead) =>
    {
        const node = el('div', `story-box ${className}`);

        node.append(...lead, plate(line), textNode(italic ? 'story-line is-italic' : 'story-line', 'story-text'), arrow('story-next', 22, 14));

        return [ node ];
    };

    const card = (state) =>
    {
        const data = state.phase === 'title' ? scene.title : scene.end;
        const center = el('div', state.phase === 'end' ? 'story-center is-end' : 'story-center');

        if (data.logo)
        {
            center.append(el('img', 'story-logo', '', { src: data.logo, alt: 'Infinity Grove' }));
        }

        center.append(el('p', 'story-kicker', data.kicker));

        if (state.phase === 'title' && data.title)
        {
            center.append(el('h1', 'story-cardtitle', data.title));
        }

        if (state.phase === 'end')
        {
            center.append(el('h1', 'story-endtitle', data.title), el('p', 'story-endsub', data.subtitle));
        }

        center.append(el('p', 'story-cta', data.cta));

        return [ center ];
    };

    const lineNodes = (line) =>
    {
        if (line.kind === 'narrator')
        {
            return [ el('div', 'story-narr-scrim'), textNode('story-narr', 'story-text'), arrow('story-next is-narr', 28, 18) ];
        }

        if (line.kind === 'voice')
        {
            return [ el('div', 'story-orb', '', { testid: 'story-orb' }), ...box('is-voice', line, true, []) ];
        }

        if (line.face)
        {
            return box('is-face', line, false, [ el('img', 'story-face', '', { src: line.face, alt: line.speaker, testid: 'story-face' }) ]);
        }

        return [ el('img', 'story-portrait', '', { src: line.portrait, alt: line.speaker, testid: 'story-portrait' }), ...box('is-character', line, false, []) ];
    };

    const buildContent = (state) =>
    {
        shownNode = null;
        ghostNode = null;
        nextNode = null;
        lastShown = null;

        if (state.phase === 'title' || state.phase === 'end')
        {
            return card(state);
        }

        return state.phase === 'line' ? lineNodes(scene.lines[state.index]) : [];
    };

    const paintCamera = (look) =>
    {
        const key = `${look.backdrop}:${look.camera}`;

        if (key === lastCamera)
        {
            return;
        }

        const target = cameraOf(backdrops, look);

        lastCamera = key;
        camera.style.transform = cameraTransform(target);
        camera.style.transitionDuration = `${target.ms}ms`;
    };

    const paintMute = (muted) =>
    {
        if (muted === lastMuted)
        {
            return;
        }

        lastMuted = muted;
        mute.setAttribute('aria-label', muted ? 'Ativar som' : 'Silenciar');
        mute.setAttribute('aria-pressed', muted ? 'true' : 'false');
        mute.replaceChildren(svg(muted ? ICON_MUTED : ICON_SOUND));
    };

    const update = ({ state, shown, t, muted }) =>
    {
        const look = sceneLook(scene, state, t);
        const lit = progressDots(scene, state);

        backdropNodes.forEach(([ key, node ]) => node.classList.toggle('is-on', key === look.backdrop));
        tintNodes.forEach(([ name, node ]) => node.classList.toggle('is-on', look.tints.includes(name)));
        paintCamera(look);
        bars.forEach((bar) => bar.classList.toggle('is-on', state.phase === 'line'));

        const contentKey = `${state.phase}:${state.index}`;

        if (contentKey !== lastContent)
        {
            lastContent = contentKey;
            content.replaceChildren(...buildContent(state));
        }

        if (state.phase === 'line')
        {
            if (shown !== lastShown)
            {
                const text = lineText(scene.lines[state.index]);

                lastShown = shown;
                shownNode.textContent = text.slice(0, shown);
                ghostNode.textContent = text.slice(shown);
            }

            nextNode.hidden = !state.complete;
        }

        hit.setAttribute('aria-label', hitLabel(state, scene));
        dots.forEach((dot, i) => dot.classList.toggle('is-on', lit[i]));
        dotsBox.hidden = state.phase !== 'line';
        paintMute(muted);
    };

    return { root, hit, stage, update };
};
