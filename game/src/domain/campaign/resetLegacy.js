//  The legacy of the account resets (spec reset-legacy-drops) as GET /account/legacy answers it:
//  { chapters: [ { chapter, percent } ], best: { chapter, percent } | null, afterReset: { chapter, percent, best } | null }.
//  The backend picks the best and the preview; the game types no coin number (AD-011). Pure JavaScript: no Phaser.
const isChapter = (value) => value !== null && typeof value === 'object' && Number.isInteger(value.chapter) && Number.isInteger(value.percent);

const isChapterOrNull = (value) => value === null || isChapter(value);

const isAfterReset = (value) => value === null || (isChapter(value) && isChapterOrNull(value.best));

//  The legacy as the backend answers it, or null for anything malformed
export const legacyOf = (payload) =>
{
    if (payload === null || typeof payload !== 'object' || !Array.isArray(payload.chapters))
    {
        return null;
    }

    if (!payload.chapters.every(isChapter) || !isChapterOrNull(payload.best) || !isAfterReset(payload.afterReset))
    {
        return null;
    }

    return payload;
};

const share = ({ chapter, percent }) => `${percent}% do capítulo ${chapter}`;

//  The line of the auto click window
export const legacyLineText = (legacy) => (legacy.best ? `Legado: ${share(legacy.best)}` : 'Legado: nenhum');

//  The detail under the line
export const legacyDetailText = (legacy) =>
{
    if (!legacy.best)
    {
        return 'Resete a conta para ganhar moedas e peças melhores nas próximas jornadas.';
    }

    const { chapter, percent } = legacy.best;

    return `Cada abate rende mais ${percent}% das moedas do capítulo ${chapter}, e cada peça tem ${percent}% de chance de vir com a raridade do capítulo ${chapter}.`;
};

//  The line of the reset dialog: case C (the chapter is already at 100), A (the reset makes its chapter the best), B, in that order;
//  null while the reset is closed
export const resetLegacyText = (legacy) =>
{
    const after = legacy.afterReset;

    if (!after)
    {
        return null;
    }

    if (legacy.chapters.some(({ chapter, percent }) => chapter === after.chapter && percent === 100))
    {
        return `O legado do capítulo ${after.chapter} já está em 100%: este reset não muda o seu legado.`;
    }

    if (after.best?.chapter === after.chapter)
    {
        return `Legado depois do reset: ${after.percent}% do capítulo ${after.chapter} (hoje: ${legacy.best ? share(legacy.best) : 'nenhum'}).`;
    }

    return `Este reset sobe o legado do capítulo ${after.chapter} para ${after.percent}%. O melhor legado continua ${legacy.best ? share(legacy.best) : 'nenhum'}.`;
};
