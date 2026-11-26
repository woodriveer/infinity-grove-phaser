//  The legacy the scene shows (spec reset-legacy-drops). Port: gateway { legacy() } resolves with the payload of GET /account/legacy.
import { legacyOf } from '../../domain/campaign/resetLegacy';

export const createResetLegacy = ({ gateway }) =>
{
    let current = null;

    return {
        //  A failure (404 of an old backend included) keeps the last good value, null at first
        load: async () =>
        {
            try
            {
                current = legacyOf(await gateway.legacy()) ?? current;
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
        state: () => current
    };
};
