import { BOARDS, LOADING_TEXT, NONE_TEXT, EMPTY_TEXT, RANKING_CHAPTERS, boardOf, rankingRows } from '../../../domain/rankings/rankings';
import { el } from './dom';

const COINS = [ [ 'gold', 'Ouro' ], [ 'silver', 'Prata' ], [ 'copper', 'Cobre' ] ];

//  The four tabs, the shown one pressed; a click on another tab calls onBoard(id), the pressed one does nothing
const renderTabs = (boardId, onBoard) =>
{
    const tabs = el('div', 'ranking-tabs', '', { role: 'group', 'aria-label': 'Escolher ranking', testid: 'ranking-tabs' });

    BOARDS.forEach(({ id, name }) =>
    {
        const button = el('button', 'ranking-tab', name, { type: 'button', testid: `ranking-tab-${id}`, 'aria-pressed': String(id === boardId) });

        if (id !== boardId)
        {
            button.addEventListener('click', () => onBoard(id));
        }
        tabs.append(button);
    });

    return tabs;
};

//  The chapters 1 to 15 of the boss board, the shown one pressed, the campaign's own one marked `is-current`; a click on another chip
//  calls onChapter(n)
const renderChapters = ({ chapter, campaignChapter, onChapter }) =>
{
    const row = el('div', 'farm-chapters ranking-chapters', '', { testid: 'ranking-chapters', role: 'group', 'aria-label': 'Escolher capítulo' });

    row.append(el('span', 'farm-chapters-label', 'Capítulo'));
    RANKING_CHAPTERS.forEach((number) =>
    {
        const current = number === campaignChapter;
        const button = el('button', `farm-chapter${current ? ' is-current' : ''}`, String(number), {
            type: 'button', testid: `ranking-chapter-${number}`, 'aria-label': `Capítulo ${number}`, 'aria-pressed': String(number === chapter),
            ...(current ? { title: 'Capítulo atual' } : {})
        });

        if (number !== chapter)
        {
            button.addEventListener('click', () => onChapter(number));
        }
        row.append(button);
    });

    return row;
};

//  The value cell: the text, or three coin discs with their names for assistive tech (as the HUD wallet)
const renderValue = (value) =>
{
    const cell = el('span', 'ranking-value');

    if (value.coins)
    {
        COINS.forEach(([ key, label ]) => cell.append(el('span', 'sr-only', `${label}: `), el('span', `coin coin-${key}`, value.coins[key])));
    }
    else
    {
        cell.textContent = value.text;
    }

    return cell;
};

//  One row: the position (on a medal disc for the top three), the username as text and the value
const renderRow = (row) =>
{
    const item = el('li', `ranking-row${row.me ? ' is-me' : ''}`, '', { testid: `ranking-row-${row.position}` });
    const player = el('span', 'ranking-player');

    player.append(el('span', 'ranking-player-name', row.username, { title: row.username }));
    if (row.me)
    {
        player.append(el('span', 'ranking-you', 'Você'));
    }
    item.append(el('span', `ranking-position${row.medal ? ` is-${row.medal}` : ''}`, row.positionText), player, renderValue(row.value));

    return item;
};

//  The header, the rows, the gap and pinned own row, and the line of a player with no record
const renderTable = (page) =>
{
    const { rows, pinned, none } = rankingRows(page);
    const table = el('div', 'ranking-table', '', { testid: 'ranking-table' });
    const head = el('div', 'ranking-head');
    const list = el('ol', 'ranking-list', '', { testid: 'ranking-list' });

    head.append(el('span', '', 'Posição'), el('span', '', 'Jogador'), el('span', '', boardOf(page.board).valueLabel));
    list.append(...rows.map(renderRow));
    if (pinned)
    {
        list.append(el('li', 'ranking-gap', '⋯', { 'aria-hidden': 'true', testid: 'ranking-gap' }), renderRow(pinned));
    }
    table.append(head, list);
    if (none)
    {
        table.append(el('p', 'ranking-none', NONE_TEXT, { testid: 'ranking-none' }));
    }

    return table;
};

//  What sits under the heading: the loading line, nothing, the empty line or the table
const renderState = ({ page, loading }) =>
{
    if (loading)
    {
        return el('p', 'ranking-loading', LOADING_TEXT, { testid: 'ranking-loading' });
    }

    if (page === null)
    {
        return null;
    }

    if (rankingRows(page).empty)
    {
        return el('p', 'hero-empty', EMPTY_TEXT, { testid: 'ranking-empty' });
    }

    return renderTable(page);
};

//  The Ranking screen (spec rankings). model = { boardId, chapter, campaignChapter, page, loading }:
//    boardId the board shown, chapter the boss chapter shown, campaignChapter the campaign's own (marked on its chip),
//    page the last answer or null (nothing under the header area), loading true while a load runs.
//  handlers = { onBoard(id), onChapter(n) }: a click on another tab or chip; the pressed one does nothing.
export const renderRanking = (model, { onBoard, onChapter }) =>
{
    const board = boardOf(model.boardId);
    const screen = el('div', 'ranking-screen', '', { testid: 'ranking-screen' });
    const state = renderState(model);

    screen.append(
        renderTabs(board.id, onBoard),
        el('h3', 'ranking-name', board.name, { testid: 'ranking-name' }),
        el('p', 'ranking-subtitle', board.subtitle, { testid: 'ranking-subtitle' })
    );
    if (board.chaptered)
    {
        screen.append(renderChapters({ chapter: model.chapter, campaignChapter: model.campaignChapter, onChapter }));
    }
    if (state)
    {
        screen.append(state);
    }

    return screen;
};
