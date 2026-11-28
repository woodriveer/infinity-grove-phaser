import { bossMapStops, DEFEATED, LOCKED } from '../../../domain/campaign/bossMap';
import { CHAPTER_BOSS } from '../../../domain/campaign/campaign';
import { bossLabel } from '../../../domain/heroes/heroes';
import { el } from './dom';
import { MAP_IMAGE, MAP_STOPS, MAP_TRAIL } from './mapLayout';

const SVG_NS = 'http://www.w3.org/2000/svg';

//  The stop of a boss: its number (or `Chefe`), its accessible name and the state the player sees. Only a defeated stop is a button, with the
//  test id of the old list row (`farm-entry-<id>`); the others are plain boxes (`map-node-<id>`) that cannot be clicked.
const renderStop = (stop, winsLeft, onPick) =>
{
    const chapterBoss = stop.kind === CHAPTER_BOSS;
    const defeated = stop.state === DEFEATED;
    const testid = `${defeated ? 'farm-entry' : 'map-node'}-${stop.id}`;
    const attributes = { testid, 'data-state': stop.state, 'aria-label': bossLabel(stop), ...(defeated ? { type: 'button' } : { 'aria-disabled': 'true' }) };
    const node = el(defeated ? 'button' : 'div', `map-node${chapterBoss ? ' is-boss' : ''}`, '', attributes);

    node.append(el('span', 'map-node-label', chapterBoss ? 'Chefe' : String(stop.stage)));

    if (stop.state === LOCKED)
    {
        node.append(el('span', 'map-lock', '🔒', { 'aria-hidden': 'true' }));
    }

    if (chapterBoss && defeated)
    {
        node.append(el('span', 'farm-wins', `${winsLeft} vitórias restantes hoje`));
        node.disabled = winsLeft <= 0;
    }

    if (defeated)
    {
        node.addEventListener('click', () => onPick(chapterBoss ? { kind: stop.kind } : { kind: stop.kind, stage: stop.stage }));
    }

    return node;
};

//  The dashed trail through the stops, drawn only while the painted map is missing (the painted map already has a road)
const renderTrail = () =>
{
    const svg = document.createElementNS(SVG_NS, 'svg');
    const line = document.createElementNS(SVG_NS, 'polyline');

    svg.setAttribute('class', 'farm-trail');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    line.setAttribute('points', MAP_TRAIL.map(({ x, y }) => `${x},${y}`).join(' '));
    svg.append(line);

    return svg;
};

//  The chapters the player may pick, as one numbered button each: the shown one pressed, the campaign's own one marked `is-current`.
//  A click on another chapter calls onChapter(n); the pressed one does nothing; `busy` disables them all while a chapter loads.
const renderChapters = ({ chapters, chapter, currentChapter, busy, onChapter }) =>
{
    const row = el('div', 'farm-chapters', '', { testid: 'farm-chapters', role: 'group', 'aria-label': 'Escolher capítulo' });

    row.append(el('span', 'farm-chapters-label', 'Capítulo'));
    chapters.forEach((number) =>
    {
        const current = number === currentChapter;
        const button = el('button', `farm-chapter${current ? ' is-current' : ''}`, String(number), {
            type: 'button', testid: `farm-chapter-${number}`, 'aria-label': `Capítulo ${number}`, 'aria-pressed': String(number === chapter),
            ...(current ? { title: 'Capítulo atual' } : {})
        });

        button.disabled = busy;
        if (number !== chapter)
        {
            button.addEventListener('click', () => onChapter(number));
        }
        row.append(button);
    });

    return row;
};

//  The story scenes the player may watch again (spec story-scenes), one chip each, at the top right of the screen: a click calls
//  onStory(id) and picks no boss.
const renderStories = (stories, onStory) =>
{
    const group = el('div', 'farm-story', '', { testid: 'farm-story', role: 'group', 'aria-label': 'História' });

    group.append(el('span', 'farm-story-label', 'História'));
    stories.forEach(({ id, label }) =>
    {
        const chip = el('button', 'farm-story-chip', label, { type: 'button', testid: `story-replay-${id}`, 'aria-label': `Assistir ${label}` });

        chip.addEventListener('click', () => onStory(id));
        group.append(chip);
    });

    return group;
};

//  The chapter as a map: the stops of its 10 minibosses and its chapter boss along one path (`map` = { chapter, stage, kind, stageCount,
//  completed } is where the player stands), each defeated one a button that fights it again through `onPick({ kind, stage })`. The chapter boss
//  shows its wins left today and cannot be picked at 0. A stage without a position in the layout is a plain button below the map.
//  `chapters` (the chapters the player may pick) and `chapter` (the shown one) draw the chapter row when there are two or more, with
//  `currentChapter` (the campaign's own) marked, `busy` disabling it and `onChapter(n)` choosing another chapter.
//  `stories` ([{ id, label }]) draws the História group right after the title when it has one or more, `onStory(id)` playing one.
export const renderFarm = (bosses, winsLeft, { onPick, map, chapters = [], chapter = null, currentChapter = null, busy = false, onChapter = () => {}, stories = [], onStory = () => {} }) =>
{
    const screen = el('div', 'farm-screen', '', { testid: 'farm-screen' });
    const board = el('div', 'farm-map', '', { testid: 'farm-map' });
    const image = el('img', 'farm-map-image', '', { src: MAP_IMAGE, alt: '' });
    const extra = el('div', 'farm-extra');

    //  Without the painted map the board shows a gradient and the dashed trail
    image.addEventListener('error', () =>
    {
        board.classList.add('is-fallback');
        image.remove();
    });
    board.append(image, renderTrail());

    bossMapStops({ bosses, position: map, stageCount: map.stageCount }).forEach((stop) =>
    {
        const node = renderStop(stop, winsLeft, onPick);
        const position = MAP_STOPS[stop.id];

        if (position)
        {
            node.style.left = `${position.x}%`;
            node.style.top = `${position.y}%`;
            board.append(node);
        }
        else
        {
            extra.append(node);
        }
    });

    screen.append(el('h3', 'farm-map-title', `Caminho do Capítulo ${map.chapter}`, { testid: 'farm-map-title' }));

    if (stories.length >= 1)
    {
        screen.append(renderStories(stories, onStory));
    }

    if (chapters.length >= 2)
    {
        screen.append(renderChapters({ chapters, chapter, currentChapter, busy, onChapter }));
    }

    if (bosses.length === 0)
    {
        screen.append(el('p', 'hero-empty', 'Nenhum chefe derrotado ainda.', { testid: 'farm-empty' }));
    }

    screen.append(board);

    if (extra.childElementCount > 0)
    {
        screen.append(extra);
    }

    return screen;
};
