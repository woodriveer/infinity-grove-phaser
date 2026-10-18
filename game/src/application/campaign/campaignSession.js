import { Campaign } from '../../domain/campaign/campaign';

//  The player's position in the campaign and the ordered queue of outcome reports that keeps the backend in step.
//  The position moves at once; reports go out one at a time, in order (ADR 0006).
//  Port (ADR 0007):
//    gateway  { get(), report(position, outcome) }  the backend /progress calls. get -> progress payload.
//             report resolves with the new progress (the first stage of the next chapter after a chapter boss), plus `drop` ({ heroId, heroName, stars }) when the win dropped a card,
//             or rejects with an ApiError: status 409 carries the stored progress in `body.progress`, anything else is a
//             failure that is retried.
export const createCampaignSession = ({ gateway }) =>
{
    let campaign = null;
    let queue = [];
    let sending = false;
    let loading = null;
    let realigned = () => {};
    let dropped = () => {};

    const enqueue = (outcome) =>
    {
        queue.push({ position: campaign.position(), outcome });
    };

    const adopt = (progress) =>
    {
        campaign = Campaign.fromProgress(progress);
        queue = [];
        realigned(campaign.encounter());
    };

    //  The backend refused a report: its stored progress replaces ours, and what was queued behind it is void
    const realign = async (error) =>
    {
        const stored = error.body?.progress;

        if (stored)
        {
            adopt(stored);
            return;
        }

        try
        {
            adopt(await gateway.get());
        }
        catch
        {
            //  Nothing to adopt; the queue is kept and the next flush meets the same answer
        }
    };

    const requireCampaign = () =>
    {
        if (!campaign)
        {
            throw new Error('The campaign has not loaded');
        }
    };

    return {
        get loaded () { return campaign !== null; },

        get completed () { return campaign?.completed ?? false; },

        //  Fired with the encounter to show when a 409 replaced the position
        onRealign: (callback) =>
        {
            realigned = callback;
        },

        //  Fired with the card of each accepted report that dropped one
        onDrop: (callback) =>
        {
            dropped = callback;
        },

        //  Resolves with the first encounter; rejects when the backend cannot be reached (the scene retries)
        load: () =>
        {
            loading ??= gateway.get()
                .then((progress) =>
                {
                    campaign = Campaign.fromProgress(progress);
                    queue = [];
                    return campaign.encounter();
                })
                .finally(() =>
                {
                    loading = null;
                });

            return loading;
        },

        encounter: () => campaign?.encounter() ?? null,

        //  The encounter of a boss the player already beat, to fight it again; the position and the queue are untouched
        farmEncounter: (boss) =>
        {
            requireCampaign();
            return campaign.farmEncounter(boss);
        },

        //  The encounter was won: move on and queue the report. Returns the next encounter (null once completed).
        clear: () =>
        {
            requireCampaign();
            enqueue('CLEARED');
            campaign = campaign.cleared();
            return campaign.encounter();
        },

        //  The boss timer ran out: back to the last phase of the stage. Returns that encounter.
        fail: () =>
        {
            requireCampaign();
            enqueue('FAILED');
            campaign = campaign.failed();
            return campaign.encounter();
        },

        //  Sends the queued reports in order, one request at a time. A failed report stays first for the next flush.
        flush: async () =>
        {
            if (sending)
            {
                return;
            }

            sending = true;

            try
            {
                while (queue.length > 0)
                {
                    const [ report ] = queue;
                    let response;

                    try
                    {
                        response = await gateway.report(report.position, report.outcome);
                    }
                    catch (error)
                    {
                        if (error?.status === 409)
                        {
                            await realign(error);
                        }

                        return;
                    }

                    queue.shift();

                    if (response?.drop)
                    {
                        dropped(response.drop);
                    }

                    //  The chapter boss was the last report and the backend opened the next chapter: play it
                    if (queue.length === 0 && campaign.completed && response?.chapter > campaign.chapter)
                    {
                        adopt(response);
                    }
                }
            }
            finally
            {
                sending = false;
            }
        },

        //  One last, best-effort pass when the scene ends: in order, no retry. A report already in flight is not sent twice.
        flushOnExit: () =>
        {
            const pending = queue.slice(sending ? 1 : 0);

            queue = [];

            (async () =>
            {
                for (const report of pending)
                {
                    try
                    {
                        await gateway.report(report.position, report.outcome);
                    }
                    catch
                    {
                        return;
                    }
                }
            })();
        }
    };
};
