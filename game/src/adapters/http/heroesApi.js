//  Wraps the backend HeroController and TeamController (/heroes, /leader, /team). All calls carry the Bearer token through httpClient.
//  list -> { leaderId, heroes: [ { id, name, heroClass, element, leaderBonus, portrait, chapter, owned, stars,
//            copies: { "0": n, ..., "9": n }, skills: [ { slot, name, type, effect, cooldownSeconds, image, unlocked } ] } ],
//            team } with team = { unlocked, openSlots, boughtSlots, slotPrices, allies } (spec hero-team)
//  fuse(heroId, stars) -> that hero after turning 3 cards of `stars` stars (0 to 8) into one card of the next stars.
//  fuseAll(heroId) -> { hero, fusions }: every layer of the hero fused from 0 stars up to 9 in one request.
//  setLeader(heroId) -> { leaderId, team }; setTeam(allies) -> { leaderId, team } (PUT /team); buySlot(fromSlots) -> { team, wallet }
//  (POST /team/slots). A 400, 404 or 409 (NOT_ENOUGH_CARDS, NOTHING_TO_FUSE, INVALID_TEAM, HERO_NOT_FOUND, TEAM_LOCKED,
//  TEAM_SLOT_NOT_BOUGHT, HERO_NOT_OWNED, INVALID_TEAM_SLOT_REQUEST, TEAM_SLOT_MISMATCH, TEAM_SLOTS_MAX, TEAM_SLOT_LOCKED,
//  NOT_ENOUGH_COPPER) rejects with an ApiError.
export const createHeroesApi = (httpClient) => ({
    list: async () => (await httpClient.get('/heroes')).data,

    fuse: async (heroId, stars) => (await httpClient.post(`/heroes/${encodeURIComponent(heroId)}/fuse`, { stars })).data,

    fuseAll: async (heroId) => (await httpClient.post(`/heroes/${encodeURIComponent(heroId)}/fuse-all`, {})).data,

    setLeader: async (heroId) => (await httpClient.put('/leader', { heroId })).data,

    setTeam: async (allies) => (await httpClient.put('/team', { allies })).data,

    buySlot: async (fromSlots) => (await httpClient.post('/team/slots', { fromSlots })).data
});
