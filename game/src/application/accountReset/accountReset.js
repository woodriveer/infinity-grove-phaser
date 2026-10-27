//  The account reset (spec account-reset): sends the reset from the chapter the player is in and spreads the answer over the scene's
//  services. The campaign restarts at the answered progress (its queued reports are void), the auto click takes the new crystals and
//  reset count, and the talents are read again (they are all gone).
//  Ports (ADR 0007):
//    gateway    { reset(fromChapter) }  resolves with { reward, crystals, resets, progress } or rejects with an ApiError; a 409
//               RESET_CHAPTER_MISMATCH carries the stored progress in `body.progress`
//    session    the campaign session: `chapter`, `restart(progress)`
//    autoClick  the auto click state: `adoptReset({ crystals, resets })`
//    talents    the talent collection: `load()`
export const createAccountReset = ({ gateway, session, autoClick, talents }) => ({
    //  Resolves with the answer; rejects with the refusal after realigning the campaign to the stored progress, if the refusal carried it
    reset: async () =>
    {
        let answer;

        try
        {
            answer = await gateway.reset(session.chapter);
        }
        catch (error)
        {
            if (error.status === 409 && error.body?.progress)
            {
                session.restart(error.body.progress);
            }

            throw error;
        }

        session.restart(answer.progress);
        autoClick.adoptReset(answer);
        talents.load().catch(() => {});

        return answer;
    }
});
