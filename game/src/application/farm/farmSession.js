//  The bosses the player may fight again and the chapter boss wins left today.
//  Port (ADR 0007):
//    gateway  { get(), win(boss) }  the backend /farm calls. get -> { bosses, chapterBossWinsLeft }.
//             win -> { drop, chapterBossWinsLeft }, or rejects with an ApiError (409: daily limit, boss not available, too fast).
export const createFarmSession = ({ gateway }) =>
{
    let bosses = [];
    let winsLeft = null;

    return {
        //  The boss list of the last load; empty before it
        bosses: () => bosses,

        //  Chapter boss wins left today; null before the first load
        winsLeft: () => winsLeft,

        //  Reads the farm state; rejects and keeps the previous state when the backend cannot be reached
        load: async () =>
        {
            const state = await gateway.get();

            bosses = state.bosses;
            winsLeft = state.chapterBossWinsLeft;
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
