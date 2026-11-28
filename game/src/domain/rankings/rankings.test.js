import { describe, expect, it } from 'vitest';
import {
    BOARDS, EMPTY_TEXT, LOADING_TEXT, NONE_TEXT, boardOf, formatDuration, rankingChapter, rankingRows, rankingValue
} from './rankings';

const entry = (position, username = `p${position}`, value = position * 1000) => ({ position, username, value });
const page = (board, entries, me = null) => ({ board, chapter: board === 'boss-time' ? 1 : null, entries, me });
const tenEntries = () => Array.from({ length: 10 }, (_, index) => entry(index + 1));

describe('rankings domain', () =>
{
    it('the four boards in order with their names, subtitles and value labels', () =>
    {
        expect(BOARDS.map((b) => [ b.id, b.name, b.valueLabel, b.chaptered ])).toEqual([
            [ 'boss-time', 'Caçada Relâmpago', 'Tempo', true ],
            [ 'story-time', 'Travessia do Bosque', 'Tempo', false ],
            [ 'click-power', 'Fúria da Aliança', 'Dano por clique', false ],
            [ 'fortune', 'Tesouro do Bosque', 'Moedas', false ]
        ]);
        expect(BOARDS.map((b) => b.subtitle)).toEqual([
            'O menor tempo para derrotar o chefe de cada capítulo, contado desde a vitória sobre o último miniboss.',
            'O menor tempo para concluir a história, do início da jornada (ou do último reset) até a vitória sobre o chefe do capítulo 15.',
            'O maior Dano de clique somado ao Dano da equipe por clique que você já alcançou.',
            'A maior fortuna em moedas que você já teve guardada de uma vez.'
        ]);
    });

    it('boardOf reads a board and falls back to the boss board', () =>
    {
        expect(boardOf('fortune').name).toBe('Tesouro do Bosque');
        expect(boardOf('gold').id).toBe('boss-time');
    });

    it('rankingChapter clamps the campaign chapter', () =>
    {
        expect(rankingChapter(4)).toBe(4);
        expect(rankingChapter(0)).toBe(1);
        expect(rankingChapter(20)).toBe(15);
        expect(rankingChapter(undefined)).toBe(1);
        expect(rankingChapter(2.5)).toBe(1);
    });

    it('boss times read mm:ss.d and hh:mm:ss.d', () =>
    {
        expect([ 1000, 12345, 61050, 359999, 3600000 ].map((ms) => formatDuration(ms, { tenths: true }))).toEqual([
            '00:01.0', '00:12.3', '01:01.0', '05:59.9', '01:00:00.0'
        ]);
        expect(rankingValue('boss-time', 12345)).toEqual({ text: '00:12.3' });
    });

    it('story times read mm:ss and hh:mm:ss', () =>
    {
        expect([ 1365000, 3599999, 3600000, 7384000, 360000000 ].map((ms) => rankingValue('story-time', ms).text)).toEqual([
            '22:45', '59:59', '01:00:00', '02:03:04', '100:00:00'
        ]);
    });

    it('click power reads as a damage number', () =>
    {
        expect([ 1, 16.5, 131.75, 12500, 1234567 ].map((v) => rankingValue('click-power', v).text)).toEqual([
            '1', '16.5', '131.8', '12.5K', '1.2M'
        ]);
    });

    it('fortune reads as gold, silver and copper', () =>
    {
        expect(rankingValue('fortune', 1234567)).toEqual({ coins: { gold: '123', silver: '45', copper: '67' } });
        expect(rankingValue('fortune', 123456789)).toEqual({ coins: { gold: '12.3K', silver: '67', copper: '89' } });
        expect(rankingValue('fortune', 5)).toEqual({ coins: { gold: '0', silver: '0', copper: '5' } });
    });

    it('a row reads its position with º and the top three carry a medal', () =>
    {
        const { rows } = rankingRows(page('fortune', [ entry(1), entry(2), entry(3), entry(4) ]));

        expect(rows.map((row) => row.positionText)).toEqual([ '1º', '2º', '3º', '4º' ]);
        expect(rows.map((row) => row.medal)).toEqual([ 'gold', 'silver', 'copper', null ]);
    });

    it('the own row inside the entries is marked and nothing is pinned', () =>
    {
        const result = rankingRows(page('fortune', tenEntries(), entry(3)));

        expect(result.rows.map((row) => row.me)).toEqual([ false, false, true, false, false, false, false, false, false, false ]);
        expect(result.pinned).toBeNull();
        expect(result.none).toBe(false);
    });

    it('the own row at 10th stays in the list', () =>
    {
        const result = rankingRows(page('fortune', tenEntries(), entry(10)));

        expect(result.rows[9].me).toBe(true);
        expect(result.pinned).toBeNull();
    });

    it('the own row outside the entries is pinned with its position', () =>
    {
        const result = rankingRows(page('fortune', tenEntries(), { position: 11, username: 'yan', value: 5 }));

        expect(result.pinned).toEqual({
            position: 11,
            positionText: '11º',
            username: 'yan',
            value: { coins: { gold: '0', silver: '0', copper: '5' } },
            me: true,
            medal: null
        });
    });

    it('a player without a record reads none', () =>
    {
        const result = rankingRows(page('fortune', [ entry(1), entry(2), entry(3) ], null));

        expect(result.none).toBe(true);
        expect(result.empty).toBe(false);
        expect(result.pinned).toBeNull();
    });

    it('a board with no entry is empty', () =>
    {
        const result = rankingRows(page('fortune', [], null));

        expect(result.empty).toBe(true);
        expect(result.none).toBe(false);
    });

    it('a page without a me field counts as no record', () =>
    {
        const result = rankingRows({ board: 'fortune', chapter: null, entries: [ entry(1) ] });

        expect(result.none).toBe(true);
    });

    it('the texts of the states', () =>
    {
        expect(EMPTY_TEXT).toBe('Ninguém entrou neste ranking ainda.');
        expect(NONE_TEXT).toBe('Você ainda não entrou neste ranking.');
        expect(LOADING_TEXT).toBe('Carregando...');
    });
});
