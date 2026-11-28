import { describe, expect, it, vi } from 'vitest';
import { BOARDS } from '../../../domain/rankings/rankings';
import { renderRanking } from './rankingView';

const page = (board, entries, me = null) => ({ board, chapter: board === 'boss-time' ? 7 : null, entries, me });
const entry = (position, username, value) => ({ position, username, value });
const tenEntries = (board = 'fortune') => page(board, Array.from({ length: 10 }, (_, index) => entry(index + 1, `p${index + 1}`, 1000 * (index + 1))));

const render = (model = {}, handlers = {}) =>
{
    const onBoard = vi.fn();
    const onChapter = vi.fn();
    const screen = renderRanking(
        { boardId: 'boss-time', chapter: 7, campaignChapter: 4, page: null, loading: false, ...model },
        { onBoard, onChapter, ...handlers }
    );

    document.body.replaceChildren(screen);

    return { screen, onBoard, onChapter };
};

const testid = (id) => document.querySelector(`[data-testid="${id}"]`);
const texts = (nodes) => [ ...nodes ].map((node) => node.textContent);

describe('rankingView', () =>
{
    it('the four tabs in order with the shown one pressed', () =>
    {
        render();

        const tabs = [ ...testid('ranking-tabs').querySelectorAll('button') ];

        expect(texts(tabs)).toEqual([ 'Caçada Relâmpago', 'Travessia do Bosque', 'Fúria da Aliança', 'Tesouro do Bosque' ]);
        expect(tabs.map((tab) => tab.getAttribute('aria-pressed'))).toEqual([ 'true', 'false', 'false', 'false' ]);
        expect(testid('ranking-tabs').getAttribute('aria-label')).toBe('Escolher ranking');
    });

    it('a click on another tab calls onBoard with its id and the pressed tab does nothing', () =>
    {
        const { onBoard } = render();

        testid('ranking-tab-fortune').click();
        expect(onBoard).toHaveBeenCalledTimes(1);
        expect(onBoard).toHaveBeenCalledWith('fortune');

        testid('ranking-tab-boss-time').click();
        expect(onBoard).toHaveBeenCalledTimes(1);
    });

    it('the heading and subtitle of each board', () =>
    {
        BOARDS.forEach((board) =>
        {
            render({ boardId: board.id });

            expect(testid('ranking-name').textContent).toBe(board.name);
            expect(testid('ranking-subtitle').textContent).toBe(board.subtitle);
        });
    });

    it('the boss board shows chapters 1 to 15 with the shown one pressed and the campaign one marked', () =>
    {
        render({ chapter: 7, campaignChapter: 4 });

        const chips = [ ...testid('ranking-chapters').querySelectorAll('button') ];

        expect(texts(chips)).toEqual(Array.from({ length: 15 }, (_, index) => String(index + 1)));
        expect(testid('ranking-chapters').querySelector('.farm-chapters-label').textContent).toBe('Capítulo');
        expect(testid('ranking-chapter-7').getAttribute('aria-pressed')).toBe('true');
        expect(testid('ranking-chapter-4').classList.contains('is-current')).toBe(true);
        expect(testid('ranking-chapter-4').getAttribute('title')).toBe('Capítulo atual');
        expect(testid('ranking-chapter-1').getAttribute('aria-label')).toBe('Capítulo 1');
    });

    it('a click on another chip calls onChapter and the pressed one does nothing', () =>
    {
        const { onChapter } = render({ chapter: 7 });

        testid('ranking-chapter-9').click();
        expect(onChapter).toHaveBeenCalledTimes(1);
        expect(onChapter).toHaveBeenCalledWith(9);

        testid('ranking-chapter-7').click();
        expect(onChapter).toHaveBeenCalledTimes(1);
    });

    it('the other boards have no chapter row', () =>
    {
        [ 'story-time', 'click-power', 'fortune' ].forEach((boardId) =>
        {
            render({ boardId });

            expect(testid('ranking-chapters')).toBeNull();
        });
    });

    it('loading shows Carregando... and no table', () =>
    {
        render({ loading: true, page: tenEntries() });

        expect(testid('ranking-loading').textContent).toBe('Carregando...');
        expect(testid('ranking-table')).toBeNull();
        expect(testid('ranking-tabs')).not.toBeNull();
    });

    it('no page shows no table and no state line', () =>
    {
        render({ page: null, loading: false });

        expect(testid('ranking-table')).toBeNull();
        expect(testid('ranking-empty')).toBeNull();
        expect(testid('ranking-loading')).toBeNull();
    });

    it('an empty board shows only Ninguém entrou neste ranking ainda.', () =>
    {
        render({ page: page('boss-time', []) });

        expect(testid('ranking-empty').textContent).toBe('Ninguém entrou neste ranking ainda.');
        expect(document.querySelector('.ranking-head')).toBeNull();
    });

    it('the header and one row per entry with position, name and value', () =>
    {
        render({ page: page('boss-time', [ entry(1, 'ana', 12345), entry(2, 'bob', 61050) ]) });

        expect(texts(document.querySelectorAll('.ranking-head span'))).toEqual([ 'Posição', 'Jogador', 'Tempo' ]);
        expect(texts(testid('ranking-row-1').children)).toEqual([ '1º', 'ana', '00:12.3' ]);
        expect(texts(testid('ranking-row-2').children)).toEqual([ '2º', 'bob', '01:01.0' ]);
    });

    it('the value label of each board', () =>
    {
        const labels = [ [ 'story-time', 'Tempo' ], [ 'click-power', 'Dano por clique' ], [ 'fortune', 'Moedas' ] ];

        labels.forEach(([ boardId, label ]) =>
        {
            render({ boardId, page: page(boardId, [ entry(1, 'ana', 5000) ]) });

            expect(document.querySelector('.ranking-head span:last-child').textContent).toBe(label);
        });
    });

    it('the top three positions carry the medal classes', () =>
    {
        render({ page: page('fortune', [ entry(1, 'a', 4), entry(2, 'b', 3), entry(3, 'c', 2), entry(4, 'd', 1) ]) });

        const classes = [ ...document.querySelectorAll('.ranking-position') ].map((node) => [ ...node.classList ]);

        expect(classes[0]).toContain('is-gold');
        expect(classes[1]).toContain('is-silver');
        expect(classes[2]).toContain('is-copper');
        expect(classes[3]).not.toContain('is-gold');
        expect(classes[3]).not.toContain('is-silver');
        expect(classes[3]).not.toContain('is-copper');
    });

    it('the own row in the list is highlighted with Você', () =>
    {
        const base = tenEntries();

        render({ page: { ...base, me: base.entries[1] } });

        expect(testid('ranking-row-2').classList.contains('is-me')).toBe(true);
        expect(testid('ranking-row-2').querySelector('.ranking-you').textContent).toBe('Você');
        [ 1, 3, 4, 5, 6, 7, 8, 9, 10 ].forEach((position) =>
        {
            expect(testid(`ranking-row-${position}`).classList.contains('is-me')).toBe(false);
            expect(testid(`ranking-row-${position}`).querySelector('.ranking-you')).toBeNull();
        });
        expect(testid('ranking-gap')).toBeNull();
    });

    it('the own row outside the list is pinned under the gap row', () =>
    {
        const base = tenEntries();

        render({ boardId: 'fortune', page: { ...base, me: entry(27, 'yan', 5) } });

        const items = [ ...testid('ranking-list').children ];
        const gap = testid('ranking-gap');
        const pinned = testid('ranking-row-27');

        expect(items).toHaveLength(12);
        expect(items.slice(0, 10).map((item) => item.getAttribute('data-testid'))).toEqual(Array.from({ length: 10 }, (_, index) => `ranking-row-${index + 1}`));
        expect(items[10]).toBe(gap);
        expect(items[11]).toBe(pinned);
        expect(gap.textContent).toBe('⋯');
        expect(gap.getAttribute('aria-hidden')).toBe('true');
        expect(pinned.classList.contains('is-me')).toBe(true);
        expect(pinned.querySelector('.ranking-position').textContent).toBe('27º');
        expect(pinned.querySelector('.ranking-player-name').textContent).toBe('yan');
        expect(pinned.querySelector('.ranking-you').textContent).toBe('Você');
        expect(texts(pinned.querySelectorAll('.coin'))).toEqual([ '0', '0', '5' ]);
    });

    it('a player without a record reads Você ainda não entrou neste ranking.', () =>
    {
        render({ page: page('fortune', [ entry(1, 'a', 3), entry(2, 'b', 2), entry(3, 'c', 1) ], null) });

        expect(testid('ranking-none').textContent).toBe('Você ainda não entrou neste ranking.');
    });

    it('fortune values are three coins with assistive labels', () =>
    {
        render({ boardId: 'fortune', page: page('fortune', [ entry(1, 'ana', 1234567) ]) });

        const value = testid('ranking-row-1').querySelector('.ranking-value');

        expect(value.querySelector('.coin-gold').textContent).toBe('123');
        expect(value.querySelector('.coin-silver').textContent).toBe('45');
        expect(value.querySelector('.coin-copper').textContent).toBe('67');
        expect(texts(value.querySelectorAll('.sr-only'))).toEqual([ 'Ouro: ', 'Prata: ', 'Cobre: ' ]);
    });

    it('a username is written as text with its full name as title', () =>
    {
        render({ page: page('fortune', [ entry(1, '<b>x</b>', 5) ]) });

        const name = document.querySelector('.ranking-player-name');

        expect(name.textContent).toBe('<b>x</b>');
        expect(name.querySelector('b')).toBeNull();
        expect(name.getAttribute('title')).toBe('<b>x</b>');
    });
});
