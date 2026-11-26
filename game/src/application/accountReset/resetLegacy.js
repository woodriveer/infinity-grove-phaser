//  The legacy the scene shows (spec reset-legacy-drops). Port: gateway { legacy() } resolves with the payload of GET /account/legacy.
import { legacyOf } from '../../domain/campaign/resetLegacy';

export const createResetLegacy = ({ gateway }) =>
{
    let current = null;
    //  Counts the players the service served: a load that answers after a clear belongs to the previous player and is dropped
    let generation = 0;

    return {
        //  A failure (404 of an old backend included) keeps the last good value, null at first
        load: async () =>
        {
            const mine = generation;

            try
            {
                const loaded = legacyOf(await gateway.legacy());

                if (mine === generation)
                {
                    current = loaded ?? current;
                }
            }
            catch
            {
                //  keep the last good value
            }

            return current;
        },
        //  Takes the legacy of a reset answer; a missing or malformed one changes nothing
        adopt: (payload) =>
        {
            current = legacyOf(payload) ?? current;
        },
        //  A new player (login or logout): nothing shows until their own load answers
        clear: () =>
        {
            generation += 1;
            current = null;
        },
        state: () => current
    };
};
