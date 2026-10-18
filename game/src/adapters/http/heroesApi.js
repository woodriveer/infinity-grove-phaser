//  Wraps the backend HeroController (/heroes, /leader). All calls carry the Bearer token through httpClient.
//  list -> { leaderId, heroes: [ { id, name, heroClass, element, leaderBonus, portrait, chapter, owned, stars,
//            copies: { "0": n, "1": n, "2": n, "3": n }, skills: [ { slot, name, type, effect, cooldownSeconds, image, unlocked } ] } ] }
//  fuse(heroId, stars) -> that hero after turning 3 cards of `stars` stars (0 to 2) into one card of the next stars.
//  setLeader(heroId) -> { leaderId }. A 409 (NOT_ENOUGH_CARDS, HERO_NOT_OWNED) rejects with an ApiError.
export const createHeroesApi = (httpClient) => ({
    list: async () => (await httpClient.get('/heroes')).data,

    fuse: async (heroId, stars) => (await httpClient.post(`/heroes/${encodeURIComponent(heroId)}/fuse`, { stars })).data,

    setLeader: async (heroId) => (await httpClient.put('/leader', { heroId })).data
});
