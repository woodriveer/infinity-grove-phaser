import { barWidth, canFuseAny, cascade, fuseAllQuestion, fuseAllResultText, ladderRows, previewLines } from '../../../domain/heroes/bagCards';
import { starsClass } from '../../../domain/heroes/heroes';
import { renderHeroCard } from './bagView';
import { renderSkillList } from './catalogView';
import { el, starsText } from './dom';

const MAX_TEXT = 'Estrela máxima: não pode ser fundida';
const BUSY_TEXT = 'Fundindo...';

//  One ladder row: name, bar, count and the s★→s+1★ button; the 9-star row has the copies and the max text instead.
//  `pending` is null, the star layer whose request runs, or 'all'; the button of the pending layer reads the busy text
const renderRow = (hero, row, { locked, pending, onFuse }) =>
{
    const node = el('div', [ 'fusion-row', row.canFuse ? 'is-ready' : '', row.isMax ? 'is-max' : '' ].filter(Boolean).join(' '), '', { testid: `fusion-row-${hero.id}-${row.stars}` });

    node.append(el('span', [ 'fusion-name', 'hero-stars', starsClass(row.stars) ].filter(Boolean).join(' '), starsText(row.stars)));

    if (row.isMax)
    {
        node.append(el('span', 'fusion-copies', `Cópias: ${row.copies}`), el('span', 'fusion-max', MAX_TEXT));

        return node;
    }

    const bar = el('span', 'fusion-bar', '', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '3', 'aria-valuenow': String(row.filled) });
    const fill = el('span', 'fusion-bar-fill');
    const button = el('button', 'fusion-button', pending === row.stars ? BUSY_TEXT : `${starsText(row.stars)}→${starsText(row.stars + 1)}`, { type: 'button', testid: `fusion-button-${hero.id}-${row.stars}` });

    fill.style.width = barWidth(row.filled);
    bar.append(fill);
    button.disabled = locked || !row.canFuse;
    button.addEventListener('click', () => onFuse(row.stars));
    node.append(bar, el('span', 'fusion-copies', `${row.copies}/3`), button);

    return node;
};

//  The confirmation of Fundir tudo: question, preview, Sim, fundir and Não
const renderConfirm = (hero, { busy, onConfirmAll, onDeclineAll }) =>
{
    const box = el('div', 'fusion-all-confirm', '', { testid: 'fusion-all-confirm' });
    const actions = el('div', 'fusion-all-actions');
    const yes = el('button', 'fusion-button', 'Sim, fundir', { type: 'button', testid: 'fusion-all-yes' });
    const no = el('button', 'fusion-button is-secondary', 'Não', { type: 'button', testid: 'fusion-all-no' });

    yes.disabled = busy;
    no.disabled = busy;
    yes.addEventListener('click', () => onConfirmAll());
    no.addEventListener('click', () => onDeclineAll());
    const { before, after } = previewLines(hero);
    const preview = el('div', 'fusion-all-preview', '', { testid: 'fusion-all-preview' });

    preview.append(
        el('p', 'fusion-all-before', before, { testid: 'fusion-all-before' }),
        el('p', 'fusion-all-after', after, { testid: 'fusion-all-after' })
    );
    actions.append(yes, no);
    box.append(
        el('p', 'fusion-all-question', fuseAllQuestion(cascade(hero).fusions), { testid: 'fusion-all-question' }),
        preview,
        actions
    );

    return box;
};

//  The hero detail of the Mochila. `busy`: a fusion request runs; `pending`: null, the star layer of the row fusion that runs or 'all'; `confirming`: the Fundir tudo question shows; `result`: a node or null.
//  onFuse(stars), onFuseAll(), onConfirmAll(), onDeclineAll()
export const renderBagHero = (hero, { busy = false, pending = null, confirming = false, result = null, onFuse, onFuseAll, onConfirmAll, onDeclineAll }) =>
{
    const detail = el('div', [ 'hero-detail', 'bag-detail', busy ? 'is-busy' : '' ].filter(Boolean).join(' '), '', { testid: 'bag-entry-detail' });
    const side = el('div', 'bag-detail-ladder');
    const list = el('div', 'fusion-list', '', { testid: 'fusion-list' });
    const locked = busy || confirming;
    const bar = el('div', 'fusion-all-bar');
    const all = el('button', 'fusion-button fusion-all', pending === 'all' ? BUSY_TEXT : 'Fundir tudo', { type: 'button', testid: 'fusion-all' });

    ladderRows(hero).forEach((row) => list.append(renderRow(hero, row, { locked, pending, onFuse })));
    all.disabled = locked || !canFuseAny(hero);
    all.addEventListener('click', () => onFuseAll());
    bar.append(all);
    side.append(list, bar);

    if (confirming)
    {
        side.append(renderConfirm(hero, { busy, onConfirmAll, onDeclineAll }));
    }

    if (result)
    {
        side.append(result);
    }

    detail.append(renderHeroCard(hero, { testid: `bag-detail-card-${hero.id}` }), side, renderSkillList(hero));

    return detail;
};

//  The result line of Fundir tudo
export const renderFuseAllResult = ({ heroName, fusions, stars, raised = [] }) =>
    el('div', 'fusion-result', fuseAllResultText({ heroName, fusions, stars, raised }), { testid: 'fusion-result' });
