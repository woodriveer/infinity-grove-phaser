//  The four rankings of spec rankings: ids, names, subtitles, value formats and the rows of one board answer. Pure JavaScript: no Phaser.
import { formatDamage } from '../combat/damage';
import { formatShort } from '../combat/numberFormat';

export const BOSS_TIME = 'boss-time';
export const STORY_TIME = 'story-time';
export const CLICK_POWER = 'click-power';
export const FORTUNE = 'fortune';
export const LAST_CHAPTER = 15;
//  1 to 15
export const RANKING_CHAPTERS = Object.freeze(Array.from({ length: LAST_CHAPTER }, (_, index) => index + 1));
export const MEDALS = Object.freeze([ 'gold', 'silver', 'copper' ]);

export const BOARDS = Object.freeze([
    Object.freeze({ id: BOSS_TIME, name: 'Caçada Relâmpago', subtitle: 'O menor tempo para derrotar o chefe de cada capítulo, contado desde a vitória sobre o último miniboss.', valueLabel: 'Tempo', chaptered: true }),
    Object.freeze({ id: STORY_TIME, name: 'Travessia do Bosque', subtitle: 'O menor tempo para concluir a história, do início da jornada (ou do último reset) até a vitória sobre o chefe do capítulo 15.', valueLabel: 'Tempo', chaptered: false }),
    Object.freeze({ id: CLICK_POWER, name: 'Fúria da Aliança', subtitle: 'O maior Dano de clique somado ao Dano da equipe por clique que você já alcançou.', valueLabel: 'Dano por clique', chaptered: false }),
    Object.freeze({ id: FORTUNE, name: 'Tesouro do Bosque', subtitle: 'A maior fortuna em moedas que você já teve guardada de uma vez.', valueLabel: 'Moedas', chaptered: false })
]);

export const EMPTY_TEXT = 'Ninguém entrou neste ranking ainda.';
export const NONE_TEXT = 'Você ainda não entrou neste ranking.';
export const LOADING_TEXT = 'Carregando...';

//  The board of `id`; an unknown id is the boss board
export const boardOf = (id) => BOARDS.find((board) => board.id === id) ?? BOARDS[0];

//  The boss board chapter for a campaign chapter: an integer clamped to 1..15, anything else 1
export const rankingChapter = (chapter) =>
{
    if (!Number.isInteger(chapter))
    {
        return 1;
    }

    return Math.min(LAST_CHAPTER, Math.max(1, chapter));
};

const pad = (value) => String(value).padStart(2, '0');

//  "mm:ss" below one hour, "hh:mm:ss" from it (hours at least two digits, never cut); `tenths` appends ".d"; every part truncated
export const formatDuration = (ms, { tenths = false } = {}) =>
{
    const total = Math.floor(ms / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total / 60) % 60;
    const seconds = total % 60;
    const clock = hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;

    return tenths ? `${clock}.${Math.floor(ms / 100) % 10}` : clock;
};

//  Copper as the HUD coins: gold through formatShort, silver and copper as plain numbers (strings)
export const coinParts = (copper) => ({
    gold: formatShort(Math.floor(copper / 10000)),
    silver: String(Math.floor(copper / 100) % 100),
    copper: String(copper % 100)
});

//  The value of a row: { coins } for FORTUNE, else { text } (boss-time with tenths, story-time without, click-power formatDamage)
export const rankingValue = (boardId, value) =>
{
    if (boardId === FORTUNE)
    {
        return { coins: coinParts(value) };
    }

    if (boardId === STORY_TIME)
    {
        return { text: formatDuration(value) };
    }

    if (boardId === CLICK_POWER)
    {
        return { text: formatDamage(value) };
    }

    return { text: formatDuration(value, { tenths: true }) };
};

//  The rows of one board answer `page` = { board, chapter, entries: [ { position, username, value } ], me: { position, username, value } | null }:
//  { rows: [ row ], pinned: row | null, none: boolean, empty: boolean },
//  row = { position, positionText: '<n>º', username, value: rankingValue(...), me: boolean, medal: 'gold' | 'silver' | 'copper' | null }
//  A row is `me` when its position is me.position; `pinned` is the own row when `me` is set and not among the entries; `none` when `me` is
//  null and there are entries; `empty` when there is no entry. A missing `me` field counts as null.
export const rankingRows = (page) =>
{
    const me = page.me ?? null;
    const entries = page.entries ?? [];
    const rowOf = (entry, own) => ({
        position: entry.position,
        positionText: `${entry.position}º`,
        username: entry.username,
        value: rankingValue(page.board, entry.value),
        me: own,
        medal: MEDALS[entry.position - 1] ?? null
    });
    const rows = entries.map((entry) => rowOf(entry, me !== null && entry.position === me.position));
    const inList = rows.some((row) => row.me);

    return {
        rows,
        pinned: me !== null && !inList ? rowOf(me, true) : null,
        none: me === null && entries.length > 0,
        empty: entries.length === 0
    };
};
