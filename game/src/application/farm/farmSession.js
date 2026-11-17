//  The bosses the player may fight again, the chapter boss wins left today, the chapter of the last load, the chapters the player
//  may pick and the definition of every chapter loaded.
//  Port (ADR 0007):
//    gateway  { get(chapter?), win(boss) }  the backend /farm calls. get(chapter?) -> { chapter?, chapters?, bosses, chapterBossWinsLeft, definition? }.
//             win -> { drop, chapterBossWinsLeft }, or rejects with an ApiError (409: daily limit, boss not available, too fast).
//  cancel() drops the answer of every pending load (closing Rever chefes, TD-009).
export const createFarmSession = ({ gateway }) =>
{
    let bosses = [];
    let winsLeft = null;
    let chapter = null;
    let chapters = [];
    const definitions = new Map();
    //  Bumped by cancel(): the answer of a load started before the last cancel changes nothing (TD-009)
    let generation = 0;

    return {
        //  The boss list of the last load; empty before it
        bosses: () => bosses,

        //  Chapter boss wins left today; null before the first load
        winsLeft: () => winsLeft,

        //  The chapter of the last load; null before it, or when the backend does not answer one (previous version)
        chapter: () => chapter,

        //  The chapters the player may pick, ascending; empty before the first load or from a previous backend
        chapters: () => chapters,

        //  The definition of a chapter loaded before, kept for the page's life; null when that chapter was never loaded
        definitionOf: (number) => definitions.get(number) ?? null,

        //  Reads the farm state of `selected` (undefined: the current chapter); rejects and keeps the previous state on failure.
        //  An answer that arrives after cancel() is ignored; a failure still rejects.
        load: async (selected) =>
        {
            const started = generation;
            const state = await (selected === undefined ? gateway.get() : gateway.get(selected));

            if (started !== generation)
            {
                return;
            }

            bosses = state.bosses;
            winsLeft = state.chapterBossWinsLeft;
            chapter = Number.isInteger(state.chapter) ? state.chapter : null;
            chapters = Array.isArray(state.chapters) ? state.chapters : [];

            if (chapter !== null && state.definition)
            {
                definitions.set(chapter, state.definition);
            }
        },

        //  Drops the answer of every load still pending; the state already loaded stays
        cancel: () =>
        {
            generation += 1;
        },

        //  Reports one win (one request) and resolves with { drop, chapterBossWinsLeft }; a refusal rejects and changes nothing
        win: async (boss) =>
        {
            const result = await gateway.win(boss);

            winsLeft = result.chapterBossWinsLeft;

            return result;
        }
    };
};
