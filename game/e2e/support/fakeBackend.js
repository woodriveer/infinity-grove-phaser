//  In-memory stand-in for the Kotlin backend (UserController + AuthController + JWT security chain),
//  mirroring its status codes, ProblemDetail bodies and token contract.
const MIN_PASSWORD_LENGTH = 8;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const problem = (status, detail, code) => ({
    status,
    contentType: 'application/problem+json',
    json: { status, detail, ...(code && { code }) }
});

const unauthenticated = () => problem(401, 'Authentication is required', 'AUTH_UNAUTHENTICATED');
const invalidRefreshToken = () => problem(401, 'Refresh token is invalid', 'AUTH_INVALID_REFRESH_TOKEN');

//  Wallet contract (WalletController): one queue of 20 pre-rolled drops per seeded drop rule (ids 1 to 15, keyed by the id
//  as a decimal string), the first k of a rule's queue are credited per sync, an unknown rule rejects the whole sync
const QUEUE_SIZE = 20;
const DROP_RULE_IDS = Array.from({ length: 15 }, (_, i) => String(i + 1));
const DEFAULT_DROPS = [ 3, 1, 5, 2, 4 ];

const coins = (copper) => ({ gold: Math.floor(copper / 10_000), silver: Math.floor(copper / 100) % 100, copper: copper % 100 });

//  Progress contract (ProgressController): chapter 1 as seeded by the backend (drop rules: monster 1, miniboss 2, boss 3), the transition table of Progress.kt,
//  and a 409 carrying the stored progress when a report does not start from the stored position.
const SEED_ELEMENTS = [ 'FIRE', 'WATER', 'NATURE', 'LIGHT', 'DARKNESS' ];

const seededDefinition = () => ({
    bossHealth: 300,
    bossTimeLimitMs: 60_000,
    boss: { element: 'DARKNESS', physicalDefense: 30, magicalDefense: 30, critResistance: 30 },
    bossDropRuleId: 3,
    stages: Array.from({ length: 10 }, (_, i) => {
        const element = SEED_ELEMENTS[i % SEED_ELEMENTS.length];

        return {
            number: i + 1, phasesPerStage: 5, monsterHealth: 10 + i, minibossHealth: 5 * (10 + i), minibossTimeLimitMs: 30_000,
            monster: { element, physicalDefense: 0, magicalDefense: 0, critResistance: 0 },
            miniboss: { element, physicalDefense: 11 + i, magicalDefense: 11 + i, critResistance: 12 + 2 * i },
            monsterDropRuleId: 1,
            minibossDropRuleId: 2
        };
    })
});

const startOfCampaign = () => ({ stage: 1, encounter: 'PHASE', phase: 1, completed: false });

//  The position after an outcome, or null when the outcome does not apply (a conflict)
const afterOutcome = (progress, outcome, definition) => {
    if (progress.completed) { return null; }

    const stage = definition.stages.find((candidate) => candidate.number === progress.stage);
    const lastStage = definition.stages.length;

    if (outcome === 'FAILED') {
        return progress.encounter === 'PHASE' ? null : { ...progress, encounter: 'PHASE', phase: stage.phasesPerStage };
    }

    if (progress.encounter === 'PHASE') {
        return progress.phase < stage.phasesPerStage ? { ...progress, phase: progress.phase + 1 } : { ...progress, encounter: 'MINIBOSS', phase: 1 };
    }

    if (progress.encounter === 'MINIBOSS') {
        return progress.stage < lastStage
            ? { ...progress, stage: progress.stage + 1, encounter: 'PHASE', phase: 1 }
            : { ...progress, encounter: 'CHAPTER_BOSS', phase: 1 };
    }

    return { ...progress, completed: true };
};

//  Hero cards contract (HeroController, FarmController, the drops of ProgressController): the five README heroes, a bag per player,
//  the chapter order that follows the starting element, the 1 % and 10 % drops and the daily chapter boss limit.
const skill = (slot, name, type, cooldownSeconds, image) => ({ slot, name, type, effect: `Efeito de ${name}`, cooldownSeconds, image });

const HEROES = [
    {
        id: 'kael', name: 'Kael Raizférrea', heroClass: 'Guerreiro', element: 'FIRE', leaderBonus: '+25% de dano contra chefes.', portrait: 'kael_position',
        skills: [ skill(1, 'Corte Dimensional', 'Ataque', 20, 'kael_dimensional_cut'), skill(2, 'Investida do Baluarte', 'Controle', 25, 'kael_charge'), skill(3, 'Brado Aterrador', 'Debuff', 30, 'kael_screen') ]
    },
    {
        id: 'lyra', name: 'Lyra Folhaveloz', heroClass: 'Arqueira', element: 'NATURE', leaderBonus: '30% de chance de executar um clique duplo crítico.', portrait: 'lyra_position',
        skills: [ skill(1, 'Flecha Dupla', 'Ataque', 8, 'lyra_double_shot'), skill(2, 'Tiro Preciso', 'Ataque (conjuração)', 30, 'lyra_focused_shot'), skill(3, 'Ventos Ligeiros', 'Buff de grupo', 40, 'lyra_rapid_wind') ]
    },
    {
        id: 'orina', name: 'Orina Brumaestrela', heroClass: 'Maga', element: 'WATER', leaderBonus: '+20% de Poder Arcano para todo o grupo.', portrait: 'orina_position',
        skills: [ skill(1, 'Prisão de Espinhos', 'Controle / debuff', 18, 'orina_grasp_prision'), skill(2, 'Tempestade Arcana', 'Ataque contínuo', 35, 'orina_tempest'), skill(3, 'Chuva de Meteoros', 'Ataque', 45, 'orina_meteor_storm') ]
    },
    {
        id: 'seraphine', name: 'Seraphine Aurora', heroClass: 'Clériga', element: 'LIGHT', leaderBonus: '+15% de Seiva obtida.', portrait: 'seraphine_position',
        skills: [ skill(1, 'Bênção da Grande Árvore', 'Buff de grupo', 30, 'seraphine_blessing'), skill(2, 'Luz Divina', 'Ataque', 25, 'seraphine_holy_light'), skill(3, 'Carrilhão da Aurora', 'Buff de grupo', 45, 'seraphine_bell_ringing') ]
    },
    {
        id: 'vex', name: 'Vex Sombraespinho', heroClass: 'Assassino', element: 'DARKNESS', leaderBonus: '+30% de dano contra inimigos sob efeitos de dano contínuo.', portrait: 'vex_position',
        skills: [ skill(1, 'Bomba de Veneno', 'Dano contínuo', 15, 'vex_poison_bomb'), skill(2, 'Bomba de Fumaça', 'Buff de grupo', 35, 'vex_smoke_bomb'), skill(3, 'Golpe Sangrento', 'Ataque + dano contínuo', 20, 'vex_bleeding_blow') ]
    }
];

const STARTING_ELEMENTS = [ 'FIRE', 'WATER', 'NATURE' ];
const TRIAD_HITS = { FIRE: 'NATURE', NATURE: 'WATER', WATER: 'FIRE' };
const MINIBOSS_RATE = 0.01;
const CHAPTER_BOSS_RATE = 0.10;
const DAILY_CHAPTER_BOSS_WINS = 10;
const FUSION_SIZE = 3;

const chapterElements = (start) => [ start, TRIAD_HITS[start], TRIAD_HITS[TRIAD_HITS[start]], 'DARKNESS', 'LIGHT' ];
const heroOfElement = (element) => HEROES.find((hero) => hero.element === element);
const heroOfChapter = (start, chapter) => heroOfElement(chapterElements(start)[Math.min(chapter, 5) - 1]);
const utcDay = () => new Date().toISOString().slice(0, 10);

//  A new player holds one blank card of the hero of the starting element, who leads
const newCards = (start = 'FIRE', overrides = {}) => {
    const first = heroOfElement(start).id;

    return { start, leader: first, copies: { [`${first}:0`]: 1 }, cleared: new Set(), winsDay: null, winsToday: 0, lastFarmWin: null, ...overrides, ...(overrides.cleared && { cleared: new Set(overrides.cleared) }) };
};

const copiesOf = (cards, heroId, stars) => cards.copies[`${heroId}:${stars}`] ?? 0;
const starsOf = (cards, heroId) => [ 3, 2, 1, 0 ].find((stars) => copiesOf(cards, heroId, stars) > 0) ?? 0;
const winsLeft = (cards) => Math.max(0, DAILY_CHAPTER_BOSS_WINS - (cards.winsDay === utcDay() ? cards.winsToday : 0));

const heroView = (cards, hero) => {
    const stars = starsOf(cards, hero.id);

    return {
        ...hero,
        chapter: chapterElements(cards.start).indexOf(hero.element) + 1,
        owned: [ 0, 1, 2, 3 ].some((level) => copiesOf(cards, hero.id, level) > 0),
        stars,
        copies: { 0: copiesOf(cards, hero.id, 0), 1: copiesOf(cards, hero.id, 1), 2: copiesOf(cards, hero.id, 2), 3: copiesOf(cards, hero.id, 3) },
        skills: hero.skills.map((candidate) => ({ ...candidate, unlocked: stars >= candidate.slot }))
    };
};

//  The bosses the player has beaten, as the backend lists them for the farm
const beatenBosses = (progress, definition) => {
    const minibosses = definition.stages
        .filter((stage) => progress.completed || stage.number < progress.stage || (stage.number === progress.stage && progress.encounter === 'CHAPTER_BOSS'))
        .map((stage) => ({ kind: 'MINIBOSS', stage: stage.number }));

    return progress.completed ? [ ...minibosses, { kind: 'CHAPTER_BOSS' } ] : minibosses;
};

//  Equipment contract (EquipmentController, the equipmentDrop of ProgressController and FarmController): a bag per player of raw pieces
//  { id, slot, rarity, baseClick?, refine, affixes: [ { type, base } ], heroId? } shown the way the backend shows them (values refined, costs in copper).
const RARITY = { COMMON: { index: 1, cost: 1 }, UNCOMMON: { index: 2, cost: 2 }, RARE: { index: 3, cost: 3 }, EPIC: { index: 4, cost: 5 }, LEGENDARY: { index: 5, cost: 8 } };
const AFFIX_TYPES = [ 'CLICK_DAMAGE_PCT', 'CRIT_CHANCE', 'CRIT_DAMAGE_PCT', 'BOSS_DAMAGE_PCT', 'BOSS_TIME_SECONDS', 'ARMOR_PIERCE_PCT' ];
const MAX_REFINE = 10;
const REROLL_MIN_REFINE = 5;
const REROLL_COST = 5000;

const refineCostOf = (piece) => (piece.refine >= MAX_REFINE ? null : Math.floor(500 * 17 ** piece.refine / 10 ** piece.refine) * RARITY[piece.rarity].cost);

const pieceView = (piece) => ({
    id: piece.id,
    slot: piece.slot,
    rarity: piece.rarity,
    refine: piece.refine,
    ...(piece.baseClick != null && { clickDamage: piece.baseClick * (10 + piece.refine) / 10 }),
    affixes: piece.affixes.map(({ type, base }) => ({ type, value: Math.floor(base * (10 + piece.refine) / 10) })),
    ...(piece.heroId && { heroId: piece.heroId }),
    ...(refineCostOf(piece) !== null && { refineCost: refineCostOf(piece) }),
    ...(piece.refine >= REROLL_MIN_REFINE && { rerollCost: REROLL_COST }),
    sellPrice: Math.floor(100 * RARITY[piece.rarity].index * (2 + piece.refine) / 2)
});

const isPublic = (method, path) => method === 'POST' && (path === '/users' || path === '/users/login');

//  Options: users {name: password}, delayMs, accessTtlMs (default 24 h), refreshTtlMs (default 30 days),
//  wallets {name: copper} (starting totals), drops (the repeating list every rule's queue is rolled from, or
//  {ruleId: list} to roll each listed rule from its own list and the others from the default list),
//  progress {name: {stage, encounter, phase, completed}} (starting positions, default stage 1 phase 1) and
//  definition (the chapter every player plays, default the backend seed),
//  cards {name: { start, leader, copies: { 'kael:0': 3 }, cleared: [1], winsDay, winsToday }} (starting bags; a player not listed holds one blank Kael card),
//  chances (the repeating list the drop rolls read, default never drops) and farmMinIntervalMs (default 0, the backend has 5000),
//  equipment {name: [raw pieces]} (starting bags, default empty) and equipmentDrops (the pieces the next won bosses drop, one each, in order).
//  Returns the recorded `calls` (users, auth and wallet routes), the `users` and `wallets` stores and test controls over issued tokens.
export async function mockBackend (page, {
    users = {}, delayMs = 0, accessTtlMs = DAY_MS, refreshTtlMs = 30 * DAY_MS, wallets: startingWallets = {}, drops = DEFAULT_DROPS, progress: startingProgress = {}, definition = seededDefinition(),
    cards: startingCards = {}, chances: startingChances = [ 0.99 ], farmMinIntervalMs = 0, equipment: startingEquipment = {}, equipmentDrops: startingEquipmentDrops = []
} = {}) {
    const store = new Map(Object.entries(users));
    const calls = [];
    const sessions = { access: new Map(), refresh: new Map() };
    let counter = 0;
    const wallets = new Map();
    const rolled = new Map();

    const dropsOf = (ruleId) => (Array.isArray(drops) ? drops : drops[ruleId] ?? DEFAULT_DROPS);
    const nextDrop = (ruleId) => {
        const list = dropsOf(ruleId);
        const index = rolled.get(ruleId) ?? 0;

        rolled.set(ruleId, index + 1);

        return list[index % list.length];
    };
    const rollQueue = (ruleId, length) => Array.from({ length }, () => nextDrop(ruleId));
    const queuesBody = (queues) => Object.fromEntries(DROP_RULE_IDS.map((ruleId) => [ ruleId, [ ...queues[ruleId] ] ]));
    const walletOf = (username) => {
        if (!wallets.has(username)) {
            const queues = Object.fromEntries(DROP_RULE_IDS.map((ruleId) => [ ruleId, rollQueue(ruleId, QUEUE_SIZE) ]));

            wallets.set(username, { copper: startingWallets[username] ?? 0, queues });
        }

        return wallets.get(username);
    };

    const cardsByUser = new Map();
    let chances = [ ...startingChances ];
    let rolls = 0;
    const nextChance = () => chances[rolls++ % chances.length];
    const cardsOf = (username) => {
        if (!cardsByUser.has(username)) {
            const given = startingCards[username] ?? {};

            cardsByUser.set(username, newCards(given.start ?? 'FIRE', given));
        }

        return cardsByUser.get(username);
    };

    const equipmentByUser = new Map();
    const equipmentOf = (username) => {
        if (!equipmentByUser.has(username)) {
            equipmentByUser.set(username, (startingEquipment[username] ?? []).map((piece) => ({ ...piece, affixes: [ ...piece.affixes ] })));
        }

        return equipmentByUser.get(username);
    };
    const equipmentBody = (username) => ({ capacity: 100, pieces: equipmentOf(username).map(pieceView) });
    const pendingEquipmentDrops = [ ...startingEquipmentDrops ];

    //  The next scripted piece joins the bag of a player whose boss win was accepted
    const awardEquipment = (username, encounter) => {
        if (encounter === 'PHASE' || pendingEquipmentDrops.length === 0) { return null; }

        const piece = { heroId: null, ...pendingEquipmentDrops.shift() };

        equipmentOf(username).push(piece);

        return { piece: pieceView(piece), sold: false };
    };

    const progresses = new Map();
    const progressOf = (username) => {
        if (!progresses.has(username)) {
            progresses.set(username, { ...startOfCampaign(), ...startingProgress[username] });
        }

        return progresses.get(username);
    };
    const progressBody = (progress) => ({ chapter: 1, ...progress, definition });

    const issue = (user, now) => {
        counter += 1;
        const accessToken = `access-${counter}`;
        const refreshToken = `refresh-${counter}`;
        const accessTokenExpiresAt = now + accessTtlMs;
        const refreshTokenExpiresAt = now + refreshTtlMs;

        sessions.access.set(accessToken, { username: user.username, expiresAt: accessTokenExpiresAt });
        sessions.refresh.set(refreshToken, { user, expiresAt: refreshTokenExpiresAt, revoked: false });

        return { user, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
    };

    const hasValidBearer = (request, now) => {
        const token = (request.headers().authorization ?? '').replace(/^Bearer /, '');
        const entry = sessions.access.get(token);

        return Boolean(entry) && now < entry.expiresAt;
    };

    const bearerUsername = (request) => sessions.access.get((request.headers().authorization ?? '').replace(/^Bearer /, ''))?.username;

    const handleWallet = (route, method, path, body, now) => {
        const request = route.request();

        if (!hasValidBearer(request, now)) { return route.fulfill(unauthenticated()); }

        const username = bearerUsername(request);

        if (!store.has(username)) { return route.fulfill(problem(404, `User '${username}' not found`, 'USER_NOT_FOUND')); }

        const wallet = walletOf(username);

        if (method === 'GET' && path === '/wallet') {
            return route.fulfill({ json: { wallet: coins(wallet.copper), drops: queuesBody(wallet.queues) } });
        }

        if (method === 'POST' && path === '/wallet/sync') {
            const kills = body.kills;
            const entries = kills && typeof kills === 'object' && !Array.isArray(kills) ? Object.entries(kills) : null;

            if (!entries || entries.some(([ , count ]) => !Number.isInteger(count) || count < 0)) {
                return route.fulfill(problem(400, 'Kills are invalid', 'WALLET_INVALID_KILLS'));
            }
            const unknown = entries.find(([ ruleId ]) => !DROP_RULE_IDS.includes(ruleId));

            if (unknown) {
                return route.fulfill(problem(400, `Drop rule '${unknown[0]}' is unknown`, 'WALLET_UNKNOWN_DROP_RULE'));
            }

            const accepted = {};

            entries.forEach(([ ruleId, count ]) => {
                const taken = Math.min(count, QUEUE_SIZE);
                const credited = wallet.queues[ruleId].splice(0, taken);

                wallet.copper += credited.reduce((sum, value) => sum + value, 0);
                wallet.queues[ruleId].push(...rollQueue(ruleId, taken));
                accepted[ruleId] = taken;
            });

            return route.fulfill({ json: { wallet: coins(wallet.copper), accepted, drops: queuesBody(wallet.queues) } });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    //  The drop of a won miniboss or chapter boss (the first chapter boss win always drops) and the chapter boss win it counts
    const awardCards = (cards, encounter, chapter) => {
        if (encounter === 'PHASE') { return null; }

        const chapterBoss = encounter === 'CHAPTER_BOSS';
        const first = chapterBoss && !cards.cleared.has(chapter);
        const hero = encounter === 'MINIBOSS'
            ? (nextChance() < MINIBOSS_RATE ? heroOfChapter(cards.start, chapter) : null)
            : (first || nextChance() < CHAPTER_BOSS_RATE ? heroOfChapter(cards.start, chapter + 1) : null);

        if (chapterBoss) {
            cards.cleared.add(chapter);
            cards.winsToday = (cards.winsDay === utcDay() ? cards.winsToday : 0) + 1;
            cards.winsDay = utcDay();
        }

        if (!hero) { return null; }

        cards.copies[`${hero.id}:0`] = copiesOf(cards, hero.id, 0) + 1;
        return { heroId: hero.id, heroName: hero.name, stars: 0 };
    };

    const authenticated = (route, now) => {
        const request = route.request();

        if (!hasValidBearer(request, now)) { route.fulfill(unauthenticated()); return null; }

        const username = bearerUsername(request);

        if (!store.has(username)) { route.fulfill(problem(404, `User '${username}' not found`, 'USER_NOT_FOUND')); return null; }

        return username;
    };

    const handleHeroes = (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const cards = cardsOf(username);

        if (method === 'GET' && path === '/heroes') {
            return route.fulfill({ json: { leaderId: cards.leader, heroes: HEROES.map((hero) => heroView(cards, hero)) } });
        }

        const fuse = path.match(/^\/heroes\/([^/]+)\/fuse$/);

        if (method === 'POST' && fuse) {
            const hero = HEROES.find((candidate) => candidate.id === decodeURIComponent(fuse[1]));

            if (!hero) { return route.fulfill(problem(404, `Hero '${fuse[1]}' not found`, 'HERO_NOT_FOUND')); }
            if (![ 0, 1, 2 ].includes(body.stars)) { return route.fulfill(problem(400, 'Fusion is invalid', 'INVALID_FUSION')); }
            if (copiesOf(cards, hero.id, body.stars) < FUSION_SIZE) { return route.fulfill(problem(409, 'Fewer than 3 cards', 'NOT_ENOUGH_CARDS')); }

            cards.copies[`${hero.id}:${body.stars}`] -= FUSION_SIZE;
            cards.copies[`${hero.id}:${body.stars + 1}`] = copiesOf(cards, hero.id, body.stars + 1) + 1;
            return route.fulfill({ json: heroView(cards, hero) });
        }

        if (method === 'PUT' && path === '/leader') {
            const hero = HEROES.find((candidate) => candidate.id === body.heroId);

            if (!hero) { return route.fulfill(problem(404, `Hero '${body.heroId}' not found`, 'HERO_NOT_FOUND')); }
            if (!heroView(cards, hero).owned) { return route.fulfill(problem(409, `Hero '${hero.id}' is not owned`, 'HERO_NOT_OWNED')); }

            cards.leader = hero.id;
            return route.fulfill({ json: { leaderId: hero.id } });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    const handleEquipment = (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const pieces = equipmentOf(username);

        if (method === 'GET' && path === '/equipment') {
            return route.fulfill({ json: equipmentBody(username) });
        }

        const action = path.match(/^\/equipment\/([^/]+)\/(equip|unequip|refine|reroll|sell)$/);
        const piece = action && pieces.find((candidate) => candidate.id === decodeURIComponent(action[1]));

        if (method !== 'POST' || !action) { return route.fulfill(problem(404, 'Not found')); }
        if (!piece) { return route.fulfill(problem(404, `Piece '${action[1]}' not found`, 'EQUIPMENT_NOT_FOUND')); }

        const wallet = walletOf(username);
        const change = () => ({ equipment: equipmentBody(username), wallet: coins(wallet.copper) });

        if (action[2] === 'equip') {
            const hero = HEROES.find((candidate) => candidate.id === body.heroId);

            if (!hero || !heroView(cardsOf(username), hero).owned) { return route.fulfill(problem(409, `Hero '${body.heroId}' is not owned`, 'HERO_NOT_OWNED')); }

            pieces.filter((candidate) => candidate.heroId === hero.id && candidate.slot === piece.slot).forEach((candidate) => { candidate.heroId = null; });
            piece.heroId = hero.id;
            return route.fulfill({ json: equipmentBody(username) });
        }

        if (action[2] === 'unequip') {
            piece.heroId = null;
            return route.fulfill({ json: equipmentBody(username) });
        }

        if (action[2] === 'sell') {
            wallet.copper += pieceView(piece).sellPrice;
            pieces.splice(pieces.indexOf(piece), 1);
            return route.fulfill({ json: change() });
        }

        if (action[2] === 'refine') {
            const cost = refineCostOf(piece);

            if (cost === null) { return route.fulfill(problem(409, 'The piece is already at the maximum refine level', 'MAX_REFINE')); }
            if (wallet.copper < cost) { return route.fulfill(problem(409, 'Not enough copper', 'NOT_ENOUGH_COPPER')); }

            wallet.copper -= cost;
            piece.refine += 1;
            return route.fulfill({ json: change() });
        }

        if (piece.refine < REROLL_MIN_REFINE) { return route.fulfill(problem(409, 'Rerolling needs a higher refine level', 'REFINE_TOO_LOW')); }
        if (!Number.isInteger(body.affix) || !piece.affixes[body.affix]) { return route.fulfill(problem(400, 'Affix does not exist', 'INVALID_AFFIX')); }
        if (wallet.copper < REROLL_COST) { return route.fulfill(problem(409, 'Not enough copper', 'NOT_ENOUGH_COPPER')); }

        wallet.copper -= REROLL_COST;
        piece.affixes[body.affix] = { type: AFFIX_TYPES.find((type) => !piece.affixes.some((affix) => affix.type === type)), base: 10 };
        return route.fulfill({ json: change() });
    };

    const handleFarm = (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const cards = cardsOf(username);
        const beaten = beatenBosses(progressOf(username), definition);

        if (method === 'GET' && path === '/farm') {
            return route.fulfill({ json: { bosses: beaten, chapterBossWinsLeft: winsLeft(cards) } });
        }

        if (method === 'POST' && path === '/farm/outcome') {
            const { boss, outcome } = body;
            const valid = [ 'CLEARED', 'FAILED' ].includes(outcome) && boss && ((boss.kind === 'MINIBOSS' && Number.isInteger(boss.stage)) || (boss.kind === 'CHAPTER_BOSS' && boss.stage === undefined));

            if (!valid) { return route.fulfill(problem(400, 'Farm report is invalid')); }
            if (!beaten.some((candidate) => candidate.kind === boss.kind && candidate.stage === boss.stage)) { return route.fulfill(problem(409, 'Boss has not been beaten yet', 'BOSS_NOT_AVAILABLE')); }
            if (outcome === 'FAILED') { return route.fulfill({ json: { drop: null, chapterBossWinsLeft: winsLeft(cards) } }); }
            if (boss.kind === 'CHAPTER_BOSS' && winsLeft(cards) === 0) { return route.fulfill(problem(409, 'Daily limit reached', 'DAILY_LIMIT_REACHED')); }
            if (cards.lastFarmWin !== null && now - cards.lastFarmWin < farmMinIntervalMs) { return route.fulfill(problem(409, 'Farm win too fast', 'FARM_TOO_FAST')); }

            cards.lastFarmWin = now;

            const drop = awardCards(cards, boss.kind, 1);

            return route.fulfill({ json: { drop, chapterBossWinsLeft: winsLeft(cards), equipmentDrop: awardEquipment(username, boss.kind) } });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    const handleProgress = (route, method, path, body, now) => {
        const request = route.request();

        if (!hasValidBearer(request, now)) { return route.fulfill(unauthenticated()); }

        const username = bearerUsername(request);

        if (!store.has(username)) { return route.fulfill(problem(404, `User '${username}' not found`, 'USER_NOT_FOUND')); }

        const progress = progressOf(username);

        if (method === 'GET' && path === '/progress') {
            return route.fulfill({ json: progressBody(progress) });
        }

        if (method === 'POST' && path === '/progress/outcome') {
            const valid = ['CLEARED', 'FAILED'].includes(body.outcome) && ['PHASE', 'MINIBOSS', 'CHAPTER_BOSS'].includes(body.encounter)
                && [body.chapter, body.stage, body.phase].every((value) => Number.isInteger(value) && value >= 1);

            if (!valid) { return route.fulfill(problem(400, 'Outcome is invalid', 'PROGRESS_INVALID_OUTCOME')); }

            const reportedFromStored = body.chapter === 1 && body.stage === progress.stage && body.encounter === progress.encounter && body.phase === progress.phase;
            const next = reportedFromStored ? afterOutcome(progress, body.outcome, definition) : null;

            if (!next) {
                const conflict = problem(409, 'Reported position does not match the stored progress', 'PROGRESS_CONFLICT');

                conflict.json.progress = progressBody(progress);
                return route.fulfill(conflict);
            }

            progresses.set(username, next);

            const drop = body.outcome === 'CLEARED' ? awardCards(cardsOf(username), body.encounter, body.chapter) : null;

            const equipmentDrop = body.outcome === 'CLEARED' ? awardEquipment(username, body.encounter) : null;

            return route.fulfill({ json: { ...progressBody(next), ...(drop && { drop }), ...(equipmentDrop && { equipmentDrop }) } });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    const handler = async (route) => {
        const request = route.request();
        const method = request.method();
        const path = new URL(request.url()).pathname.replace(/^\/api/, '');
        const body = request.postDataJSON() ?? {};
        const now = Date.now();

        calls.push({ method, path, body });

        if (delayMs) { await new Promise((resolve) => setTimeout(resolve, delayMs)); }

        if (method === 'POST' && path === '/users') {
            const username = String(body.username ?? '').trim();

            if (!username) { return route.fulfill(problem(400, 'Username must not be blank')); }
            if (String(body.password ?? '').length < MIN_PASSWORD_LENGTH) {
                return route.fulfill(problem(400, `Password must have at least ${MIN_PASSWORD_LENGTH} characters`));
            }
            if (store.has(username)) {
                return route.fulfill(problem(409, `User '${username}' already exists`, 'USER_ALREADY_EXISTS'));
            }
            if (!STARTING_ELEMENTS.includes(body.startingElement)) {
                return route.fulfill(problem(400, `Starting element '${body.startingElement}' is invalid, choose FIRE, WATER or NATURE`, 'INVALID_STARTING_ELEMENT'));
            }

            store.set(username, body.password);
            cardsByUser.set(username, newCards(body.startingElement));
            return route.fulfill({ status: 201, json: issue({ username, createdAt: now, lastLoginAt: now }, now) });
        }

        if (method === 'POST' && path === '/users/login') {
            const { username, password } = body;

            if (!store.has(username)) {
                return route.fulfill(problem(404, `User '${username}' does not exist`, 'LOGIN_USER_NOT_FOUND'));
            }
            if (store.get(username) !== password) {
                return route.fulfill(problem(401, 'Password is invalid', 'LOGIN_INVALID_PASSWORD'));
            }

            return route.fulfill({ json: issue({ username, createdAt: now, lastLoginAt: now }, now) });
        }

        if (method === 'POST' && path === '/auth/refresh') {
            if (!String(body.refreshToken ?? '').trim()) { return route.fulfill(problem(400, 'Refresh token must not be blank')); }

            const entry = sessions.refresh.get(body.refreshToken);

            if (!entry || entry.revoked || now >= entry.expiresAt || !store.has(entry.user.username)) {
                return route.fulfill(invalidRefreshToken());
            }

            //  Rotation: the presented token is spent
            entry.revoked = true;
            return route.fulfill({ json: issue(entry.user, now) });
        }

        if (method === 'POST' && path === '/auth/logout') {
            if (!String(body.refreshToken ?? '').trim()) { return route.fulfill(problem(400, 'Refresh token must not be blank')); }

            const entry = sessions.refresh.get(body.refreshToken);

            if (entry) { entry.revoked = true; }

            return route.fulfill({ status: 204 });
        }

        if (path === '/wallet' || path === '/wallet/sync') { return handleWallet(route, method, path, body, now); }
        if (path === '/progress' || path === '/progress/outcome') { return handleProgress(route, method, path, body, now); }
        if (path === '/heroes' || path.startsWith('/heroes/') || path === '/leader') { return handleHeroes(route, method, path, body, now); }
        if (path === '/farm' || path === '/farm/outcome') { return handleFarm(route, method, path, body, now); }
        if (path === '/equipment' || path.startsWith('/equipment/')) { return handleEquipment(route, method, path, body, now); }

        if (path.startsWith('/users') && !isPublic(method, path)) {
            if (!hasValidBearer(request, now)) { return route.fulfill(unauthenticated()); }

            const username = decodeURIComponent(path.split('/')[2] ?? '');

            if (method === 'GET' && store.has(username)) { return route.fulfill({ json: { username } }); }
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    await page.route('**/api/users**', handler);
    await page.route('**/api/auth/**', handler);
    //  Not `**/api/wallet**`: that would also catch Vite's module request for /src/api/walletApi.js
    await page.route('**/api/wallet', handler);
    await page.route('**/api/wallet/**', handler);
    await page.route('**/api/progress', handler);
    await page.route('**/api/progress/**', handler);
    //  Exact paths like the wallet ones: `**/api/heroes**` would also catch Vite module requests such as /src/adapters/http/heroesApi.js
    await page.route('**/api/heroes', handler);
    await page.route('**/api/heroes/**', handler);
    await page.route('**/api/leader', handler);
    await page.route('**/api/farm', handler);
    await page.route('**/api/farm/**', handler);
    await page.route('**/api/equipment', handler);
    await page.route('**/api/equipment/**', handler);

    return {
        calls,
        users: store,
        wallets,
        progresses,
        cards: cardsByUser,
        cardsOf,
        equipmentOf,
        //  Replaces the list the drop rolls read, e.g. [ 0 ] drops every time
        setChances: (values) => {
            chances = [ ...values ];
            rolls = 0;
        },
        sessions,
        //  Makes every issued access token expired, as if 24 h had passed
        expireAccessTokens: () => {
            sessions.access.forEach((entry) => { entry.expiresAt = Date.now() - 1; });
        },
        //  Server-side revocation of every refresh token (e.g. password change)
        revokeAllRefreshTokens: () => {
            sessions.refresh.forEach((entry) => { entry.revoked = true; });
        }
    };
}

export const serverDown = async (page) => {
    await page.route('**/api/users**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/auth/**', (route) => route.abort('connectionrefused'));
};
