import { applyDrop } from '../../domain/heroes/heroes';

//  The heroes of the player as the backend sees them (catalog, bag, stars, leader), kept in step with every change.
//  Port (ADR 0007):
//    gateway  { list(), fuse(heroId, stars), fuseAll(heroId), setLeader(heroId) }  the backend /heroes and /leader calls.
//             list -> { leaderId, heroes }, fuse -> the updated hero, fuseAll -> { hero, fusions }, setLeader -> { leaderId }.
//             Each rejects with an ApiError.
export const createHeroCollection = ({ gateway }) =>
{
    let heroes = [];
    let leaderId = null;
    let loaded = false;
    let loading = null;
    const listeners = [];

    const changed = () =>
    {
        listeners.forEach((listener) => listener());
    };

    return {
        get loaded () { return loaded; },

        heroes: () => heroes,

        leaderId: () => leaderId,

        //  The leader hero, or null while nothing has loaded
        leader: () => heroes.find((hero) => hero.id === leaderId) ?? null,

        //  Fired after every change: a load, a fusion, a new leader or a dropped card
        onChange: (listener) =>
        {
            listeners.push(listener);
        },

        //  Reads the heroes from the backend (one request at a time); rejects and keeps what it had when the backend cannot be reached
        load: () =>
        {
            loading ??= gateway.list()
                .then((payload) =>
                {
                    heroes = payload.heroes;
                    leaderId = payload.leaderId;
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
            ({ leaderId } = await gateway.setLeader(heroId));
            changed();
        },

        //  A card the backend dropped is added to the bag at once, without another request
        applyDrop: (drop) =>
        {
            heroes = applyDrop(heroes, drop);
            changed();
        }
    };
};
