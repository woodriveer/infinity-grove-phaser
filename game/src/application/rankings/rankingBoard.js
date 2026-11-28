//  The Ranking screen's state (spec rankings): the board and chapter shown, the last page answered, and a generation that drops late answers.
//  Port (ADR 0007):
//    gateway { get(board, chapter) -> page, recordClickPower() -> { value, best } }: the backend /rankings calls; a failure rejects.
//  open(campaignChapter) pokes the click power, then loads the board shown last (the boss board of the campaign chapter the first time);
//  select(board, chapter?) loads another board or boss chapter; both resolve false when a newer load or cancel() dropped their answer.
import { BOSS_TIME, boardOf, rankingChapter } from '../../domain/rankings/rankings';

export const createRankingBoard = ({ gateway }) =>
{
    let board = BOSS_TIME;
    let chapter = null;
    let page = null;
    //  Bumped by every load and by cancel(): only the answer of the newest load is kept
    let generation = 0;

    const load = async () =>
    {
        const started = ++generation;

        try
        {
            const answer = await gateway.get(board, board === BOSS_TIME ? chapter : undefined);

            if (started !== generation)
            {
                return false;
            }

            page = answer;

            return true;
        }
        catch (error)
        {
            if (started !== generation)
            {
                return false;
            }

            page = null;

            throw error;
        }
    };

    return {
        //  The board shown, BOSS_TIME at first
        board: () => board,

        //  The boss board chapter, null before the first open
        chapter: () => chapter,

        //  The last page answered by the newest load, null before it or after a failed one
        page: () => page,

        open: async (campaignChapter) =>
        {
            if (chapter === null)
            {
                chapter = rankingChapter(campaignChapter);
            }

            try
            {
                await gateway.recordClickPower();
            }
            catch
            {
                //  The board shows without the poke (Loading AC 3)
            }

            return load();
        },

        select: async (nextBoard, nextChapter) =>
        {
            board = boardOf(nextBoard).id;

            if (nextChapter !== undefined)
            {
                chapter = rankingChapter(nextChapter);
            }

            return load();
        },

        //  Drops the answer of every load still pending; the page already loaded stays
        cancel: () =>
        {
            generation += 1;
        }
    };
};
