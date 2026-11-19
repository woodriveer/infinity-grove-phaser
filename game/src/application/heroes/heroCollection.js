import { applyDrop } from '../../domain/heroes/heroes';
import { LOCKED_TEAM, normalizeTeam } from '../../domain/heroes/team';

//  The heroes of the player as the backend sees them (catalog, bag, stars, leader), kept in step with every change.
//  Port (ADR 0007):
//    gateway  { list(), fuse(heroId, stars), fuseAll(heroId), setLeader(heroId), setTeam(allies), buySlot(fromSlots) }  the backend
//             /heroes, /leader and /team calls. list -> { leaderId, heroes, team }, fuse -> the updated hero, fuseAll -> { hero, fusions },
//             setLeader -> { leaderId, team }, setTeam(allies) -> { leaderId, team }, buySlot(fromSlots) -> { team, wallet }.
//             Each rejects with an ApiError.
export const createHeroCollection = ({ gateway }) =>
{
    let heroes = [];
    let leaderId = null;
    let team = LOCKED_TEAM;
    let loaded = false;
    let loading = null;
    const listeners = [];
    const walletListeners = [];

    const changed = () =>
    {
        listeners.forEach((listener) => listener());
    };

    return {
        get loaded () { return loaded; },

        heroes: () => heroes,

        leaderId: () => leaderId,

        //  The team of the player (spec hero-team); the locked team before the load and for a backend without the team
        team: () => team,

        //  The leader hero, or null while nothing has loaded
        leader: () => heroes.find((hero) => hero.id === leaderId) ?? null,

        //  Fired after every change: a load, a fusion, a new leader or a dropped card
        onChange: (listener) =>
        {
            listeners.push(listener);
        },

        //  Fired with the wallet ({ gold, silver, copper }) a slot purchase answered
        onWallet: (listener) =>
        {
            walletListeners.push(listener);
        },

        //  Reads the heroes from the backend (one request at a time); rejects and keeps what it had when the backend cannot be reached
        load: () =>
        {
            loading ??= gateway.list()
                .then((payload) =>
                {
                    heroes = payload.heroes;
                    leaderId = payload.leaderId;
                    team = normalizeTeam(payload.team);
                    loaded = true;
                    changed();
                })
                .finally(() =>
                {
                    loading = null;
                });

            return loading;
        },

        //  Turns 3 cards of `stars` stars into one card of the next stars; resolves with the updated hero
        fuse: async (heroId, stars) =>
        {
            const hero = await gateway.fuse(heroId, stars);

            heroes = heroes.map((candidate) => (candidate.id === hero.id ? hero : candidate));
            changed();

            return hero;
        },

        //  Fuses every layer of a hero from 0 stars up; resolves with { hero, fusions }. A refusal rejects and keeps the heroes.
        fuseAll: async (heroId) =>
        {
            const { hero, fusions } = await gateway.fuseAll(heroId);

            heroes = heroes.map((candidate) => (candidate.id === hero.id ? hero : candidate));
            changed();

            return { hero, fusions };
        },

        //  The leader changes only after the backend accepted it
        setLeader: async (heroId) =>
        {
            const answer = await gateway.setLeader(heroId);

            leaderId = answer.leaderId;

            if (answer.team)
            {
                team = normalizeTeam(answer.team);
            }

            changed();
        },

        //  Stores the allies (4 entries, a hero id or null); the leader and the team change only after the backend accepted them
        setTeam: async (allies) =>
        {
            const answer = await gateway.setTeam(allies);

            leaderId = answer.leaderId;
            team = normalizeTeam(answer.team);
            changed();

            return team;
        },

        //  Buys the next ally slot from the bought count the player saw; resolves with { team, wallet }
        buySlot: async (fromSlots) =>
        {
            const answer = await gateway.buySlot(fromSlots);

            team = normalizeTeam(answer.team);
            walletListeners.forEach((listener) => listener(answer.wallet));
            changed();

            return { team, wallet: answer.wallet };
        },

        //  A card the backend dropped is added to the bag at once, without another request
        applyDrop: (drop) =>
        {
            heroes = applyDrop(heroes, drop);
            changed();
        }
    };
};
