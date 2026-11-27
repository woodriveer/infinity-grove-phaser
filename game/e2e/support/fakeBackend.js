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
    boss: { element: 'DARKNESS', defense: 30, critResistance: 30 },
    bossDropRuleId: 3,
    stages: Array.from({ length: 10 }, (_, i) => {
        const element = SEED_ELEMENTS[i % SEED_ELEMENTS.length];

        return {
            number: i + 1, phasesPerStage: 5, monsterHealth: 10 + i, minibossHealth: 5 * (10 + i), minibossTimeLimitMs: 30_000,
            monster: { element, defense: 0, critResistance: 0 },
            miniboss: { element, defense: 11 + i, critResistance: 12 + 2 * i },
            monsterDropRuleId: 1,
            minibossDropRuleId: 2
        };
    })
});

const startOfCampaign = () => ({ stage: 1, encounter: 'PHASE', phase: 1, completed: false });

//  The position after an outcome, or null when the outcome does not apply (a conflict). A cleared chapter boss opens the next chapter
//  up to lastChapter (Progress.kt), then completes the campaign
const afterOutcome = (progress, outcome, definition, lastChapter) => {
    if (progress.completed) { return null; }

    const stage = definition.stages.find((candidate) => candidate.number === progress.stage);
    const lastStage = definition.stages.length;
    const chapter = progress.chapter ?? 1;

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

    if (chapter < lastChapter) {
        return { ...progress, chapter: chapter + 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false };
    }

    return { ...progress, completed: true };
};

//  Hero cards contract (HeroController, FarmController, the drops of ProgressController): the five README heroes, a bag per player,
//  the chapter order that follows the starting element, the 1 % and 10 % drops and the daily chapter boss limit.
//  Cards have 0 to 9 stars; 3 cards of the same hero and stars (0 to 8) fuse into 1 card of the next stars (hero-ascension).
const skill = (slot, name, type, cooldownSeconds, image, effect = `Efeito de ${name}`) => ({ slot, name, type, effect, cooldownSeconds, image });

const HEROES = [
    {
        id: 'kael', name: 'Kael Raizférrea', heroClass: 'Guerreiro', element: 'FIRE', leaderBonus: '+25% de dano contra chefes.', portrait: 'kael_position',
        skills: [ skill(1, 'Corte Dimensional', 'Ataque', 20, 'kael_dimensional_cut', 'Um golpe que rasga o próprio espaço, causando 1500% de dano a todos os inimigos e ignorando 30% da defesa.'), skill(2, 'Investida do Baluarte', 'Controle', 25, 'kael_charge'), skill(3, 'Brado Aterrador', 'Debuff', 30, 'kael_screen', 'Um grito de guerra que causa Medo: inimigos perdem 30 pontos de defesa por 10s.') ]
    },
    {
        id: 'lyra', name: 'Lyra Folhaveloz', heroClass: 'Arqueira', element: 'NATURE', leaderBonus: '30% de chance de executar um clique duplo crítico.', portrait: 'lyra_position',
        skills: [ skill(1, 'Flecha Dupla', 'Ataque', 8, 'lyra_double_shot', 'Dispara duas flechas, cada uma causando 300% de dano.'), skill(2, 'Tiro Preciso', 'Ataque (conjuração)', 30, 'lyra_focused_shot'), skill(3, 'Ventos Ligeiros', 'Buff de grupo', 40, 'lyra_rapid_wind') ]
    },
    {
        id: 'orina', name: 'Orina Brumaestrela', heroClass: 'Maga', element: 'WATER', leaderBonus: '+20% de dano total.', portrait: 'orina_position',
        skills: [ skill(1, 'Prisão de Espinhos', 'Controle / debuff', 18, 'orina_grasp_prision', 'Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.'), skill(2, 'Tempestade Arcana', 'Ataque contínuo', 35, 'orina_tempest', 'Raios caem por 6s, causando 200% de dano por segundo a todos os inimigos.'), skill(3, 'Chuva de Meteoros', 'Ataque', 45, 'orina_meteor_storm', 'Uma chuva de estrelas causa 2500% de dano em área.') ]
    },
    {
        id: 'seraphine', name: 'Seraphine Aurora', heroClass: 'Clériga', element: 'LIGHT', leaderBonus: '+15% de Seiva obtida.', portrait: 'seraphine_position',
        skills: [ skill(1, 'Bênção da Grande Árvore', 'Buff de grupo', 30, 'seraphine_blessing', 'Por 15s, todos os aliados ganham +20% de Precisão, +30% de dano e +25% de velocidade de ataque.'), skill(2, 'Luz Divina', 'Ataque', 25, 'seraphine_holy_light', 'Um pilar de luz atinge todos os inimigos, causando 800% de dano (+50% contra criaturas do Submundo).'), skill(3, 'Carrilhão da Aurora', 'Buff de grupo', 45, 'seraphine_bell_ringing') ]
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
//  Hero team (spec hero-team): the price in copper of the four ally slots and the chapter boss that opens each one
const SLOT_PRICES = [ 10000, 20000, 30000, 40000 ];
const SLOT_CHAPTERS = [ 5, 6, 7, 8 ];

const AUTO_CLICK_INTERVALS = [ 500, 250, 150, 100, 50 ];
const AUTO_CLICK_PRICES = [ 10, 25, 50, 100 ];

const chapterElements = (start) => [ start, TRIAD_HITS[start], TRIAD_HITS[TRIAD_HITS[start]], 'DARKNESS', 'LIGHT' ];
const heroOfElement = (element) => HEROES.find((hero) => hero.element === element);
//  Chapters 6 to 15 repeat the element order of chapters 1 to 5 (spec campaign-chapters, Q16)
const heroOfChapter = (start, chapter) => heroOfElement(chapterElements(start)[(chapter - 1) % 5]);
const utcDay = () => new Date().toISOString().slice(0, 10);

//  A new player holds one blank card of the hero of the starting element, who leads
const newCards = (start = 'FIRE', overrides = {}) => {
    const first = heroOfElement(start).id;

    return { start, leader: first, copies: { [`${first}:0`]: 1 }, cleared: new Set(), winsDay: null, winsToday: 0, lastFarmWin: null, ...overrides, ...(overrides.cleared && { cleared: new Set(overrides.cleared) }) };
};

const STAR_LEVELS = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
const copiesOf = (cards, heroId, stars) => cards.copies[`${heroId}:${stars}`] ?? 0;
const starsOf = (cards, heroId) => [ 9, 8, 7, 6, 5, 4, 3, 2, 1, 0 ].find((stars) => copiesOf(cards, heroId, stars) > 0) ?? 0;
//  Skill level (spec hero-ascension): 0 locked, else 1 + floor((stars - slot) / 3); one skill rises per star from 4 to 9
const skillLevel = (stars, slot) => (stars < slot ? 0 : 1 + Math.floor((stars - slot) / 3));
const winsLeft = (cards) => Math.max(0, DAILY_CHAPTER_BOSS_WINS - (cards.winsDay === utcDay() ? cards.winsToday : 0));

const heroView = (cards, hero) => {
    const stars = starsOf(cards, hero.id);

    return {
        ...hero,
        chapter: chapterElements(cards.start).indexOf(hero.element) + 1,
        owned: STAR_LEVELS.some((level) => copiesOf(cards, hero.id, level) > 0),
        stars,
        copies: Object.fromEntries(STAR_LEVELS.map((level) => [ level, copiesOf(cards, hero.id, level) ])),
        skills: hero.skills.map((candidate) => ({ ...candidate, unlocked: stars >= candidate.slot, level: skillLevel(stars, candidate.slot) }))
    };
};

//  The team payload of spec hero-team (TeamResponse)
const teamView = (cards, team) => ({
    unlocked: cards.cleared.has(5),
    openSlots: SLOT_CHAPTERS.filter((chapter) => cards.cleared.has(chapter)).length,
    boughtSlots: team.boughtSlots,
    slotPrices: [ ...SLOT_PRICES ],
    allies: [ ...team.allies ]
});

//  The bosses the player has beaten, as the backend lists them for the farm: a chapter below the campaign's lists every miniboss and its chapter
//  boss; the campaign's own chapter keeps the rule of the stage
const CHAPTER_MESSAGE = 'chapter must be an integer of at least 1';
const beatenBosses = (progress, definition, chapter = progress.chapter ?? 1) => {
    if (chapter < (progress.chapter ?? 1)) {
        return [ ...definition.stages.map((stage) => ({ kind: 'MINIBOSS', stage: stage.number })), { kind: 'CHAPTER_BOSS' } ];
    }

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

//  The staff GiftController answers at chance 0.5 (spec black-awareness-staff P1 Receive AC 2)
export const GIFT_STAFF = Object.freeze({
    id: 'gift-staff', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, baseClick: 11, heroId: null, special: 'BLACK_AWARENESS_STAFF',
    affixes: [ { type: 'BOSS_DAMAGE_PCT', base: 28 }, { type: 'BOSS_TIME_SECONDS', base: 6 }, { type: 'CRIT_DAMAGE_PCT', base: 55 }, { type: 'ARMOR_PIERCE_PCT', base: 28 } ]
});

const pieceView = (piece) => ({
    id: piece.id,
    slot: piece.slot,
    rarity: piece.rarity,
    refine: piece.refine,
    ...(piece.baseClick != null && { clickDamage: piece.baseClick * (10 + piece.refine) / 10 }),
    affixes: piece.affixes.map(({ type, base }) => ({ type, value: Math.floor(base * (10 + piece.refine) / 10) })),
    ...(piece.heroId && { heroId: piece.heroId }),
    ...(piece.special && { special: piece.special }),
    ...(refineCostOf(piece) !== null && { refineCost: refineCostOf(piece) }),
    ...(piece.refine >= REROLL_MIN_REFINE && { rerollCost: REROLL_COST }),
    sellPrice: Math.floor(100 * RARITY[piece.rarity].index * (2 + piece.refine) / 2)
});

//  Talent contract (TalentController): the 28 talents of the backend catalog, 9 in 3 grades (level 0 to 10, a level costs its grade in talent points, grade N opens at level 10 of
//  grade N - 1) and the single Fúria crescente (level 0 to 4, 2 points a level, opens at level 10 of COMBO); every talent answers maxLevel, requiredId and requiredLevel;
//  the first clear of a phase pays nothing, of a miniboss 2 and of a chapter boss 5; POST /talents/reset takes every level back; an upgrade may carry `levels` (an integer from 1 to
//  maxLevel, absent or null is 1) and buys exactly that many levels or none (spec ui-polish, UIP-08)
const TALENT_CATALOG = [
    [ 'MINIBOSS_TIME', 'TIME', 'Tempo do miniboss', 's', 2 ], [ 'BOSS_DAMAGE', 'TIME', 'Dano contra chefes', '%', 2 ],
    [ 'PHYSICAL_BREAK', 'BREAK', 'Quebra de defesa', 'points', 1 ],
    [ 'ARMOR_PIERCE', 'BREAK', 'Perfuração de armadura', '%', 1 ],
    [ 'CLICK_DAMAGE', 'POWER', 'Dano de clique (%)', '%', 5 ], [ 'CRIT_CHANCE', 'POWER', 'Chance de crítico', 'points', 5 ], [ 'CRIT_DAMAGE', 'POWER', 'Dano crítico', '%', 15 ],
    [ 'COMBO', 'COMBO', 'Limite de dano do combo', '%', 5 ], [ 'CLICK_FLAT_DAMAGE', 'POWER', 'Dano direto de clique', 'dmg', 1 ]
];
const TALENT_MAX_LEVEL = 10;
const TALENT_POINTS = { PHASE: 0, MINIBOSS: 2, CHAPTER_BOSS: 5 };

//  3 grades of the catalog: grade N is `<id>_G<N>`, gives N times the value, costs N points a level and opens at level 10 of the grade before
const TALENT_GRADES = [ 1, 2, 3 ];
const gradeId = (id, grade) => (grade === 1 ? id : `${id}_G${grade}`);
const GRADED_TALENTS = TALENT_GRADES.flatMap((grade) => TALENT_CATALOG.map(([ baseId, branch, label, unit, perLevel ]) => ({
    id: gradeId(baseId, grade), baseId, grade, branch, label, unit, perLevel: perLevel * grade, maxLevel: TALENT_MAX_LEVEL, cost: grade,
    requiredId: grade === 1 ? null : gradeId(baseId, grade - 1), requiredLevel: grade === 1 ? null : TALENT_MAX_LEVEL
})));
const TALENTS = [
    ...GRADED_TALENTS,
    { id: 'COMBO_FURY', baseId: 'COMBO_FURY', grade: 1, branch: 'COMBO', label: 'Fúria crescente', unit: 'combo-step', perLevel: 1, maxLevel: 4, cost: 2, requiredId: 'COMBO', requiredLevel: 10 }
];
const isUnlocked = (talent, levels) => talent.requiredId === null || (levels[talent.requiredId] ?? 0) >= talent.requiredLevel;

const talentsView = (levels) => TALENTS.map((talent) => {
    const { id, baseId, grade, branch, label, unit, perLevel, maxLevel, cost, requiredId, requiredLevel } = talent;
    const level = levels[id] ?? 0;

    return {
        id, baseId, grade, branch, label, unit, perLevel, maxLevel, level, value: level === 0 ? 0 : perLevel * level,
        nextCost: level >= maxLevel ? null : cost, unlocked: isUnlocked(talent, levels), requiredId, requiredLevel
    };
});

const pointsView = (earned, levels) => {
    const spent = TALENTS.reduce((sum, talent) => sum + (levels[talent.id] ?? 0) * talent.cost, 0);

    return { earned, spent, available: earned - spent };
};

const isPublic = (method, path) => method === 'POST' && (path === '/users' || path === '/users/login');

//  Options: users {name: password}, delayMs, accessTtlMs (default 24 h), refreshTtlMs (default 30 days),
//  wallets {name: copper} (starting totals), drops (the repeating list every rule's queue is rolled from, or
//  {ruleId: list} to roll each listed rule from its own list and the others from the default list),
//  progress {name: {stage, encounter, phase, completed}} (starting positions, default stage 1 phase 1) and
//  definition (the chapter every player plays, default the backend seed) and
//  chapterDefinitions {n: definition} (the definition GET /farm answers for chapter n, default definition),
//  cards {name: { start, leader, copies: { 'kael:0': 3 }, cleared: [1], winsDay, winsToday }} (starting bags; a player not listed holds one blank Kael card),
//  chances (the repeating list the drop rolls read, default never drops) and farmMinIntervalMs (default 0, the backend has 5000),
//  equipment {name: [raw pieces]} (starting bags, default empty), equipmentDrops (the pieces the next won bosses drop, one each, in order) and
//  talents {name: {TALENT_ID: level}} (starting levels, default 0; an upgrade takes one talent point like the backend) and
//  talentPoints {name: n} (points available at the start, on top of the ones the starting levels cost; first clears pay more) and
//  talentLevels (default true; false answers every upgrade as a backend without `levels` does: one level whatever was sent) and
//  holdTalents() -> release() holds POST /talents/{id}/upgrade and POST /talents/reset, failNextTalentRequest({ status = 500, code }) makes the next one of them answer that problem,
//  talentUpgrades() lists the upgrades received ({ id, body }), talentResets() counts the resets, grantTalentPoints(name, n) pays n points like a first clear and
//  autoClick {name: { level, crystals }} (default level 0 and 0 crystals; the upgrade follows AutoClickController) and
//  lastChapter (the last chapter a cleared chapter boss opens, default 1: the boss of that chapter completes the campaign).
//  legacy {name: {chapter: percent}} (the legacy of the account resets, default none; GET /account/legacy and the reset answer follow reset-legacy-drops, a reset raises its
//  reward chapter by 50 up to 100) and legacyEndpoint (false answers 404 to GET /account/legacy and leaves `legacy` out of the reset answer, like a backend without the feature).
//  team {name: { boughtSlots, allies: [ 4 hero ids or null ] }} (starting teams, default no slot bought and no ally; the team is unlocked once the player has cleared chapter 5) and
//  holdTeam() -> release() holds PUT /team, POST /team/slots and PUT /leader, failNextTeamRequest({ status = 500, code }) makes the next one of them answer that problem, teamOf(name) reads a stored team.
//  gifts {name: true | 'fail'} (POST /gifts/claim of GiftController: true grants GIFT_STAFF on the first claim of that player and { granted: false } after, 'fail' answers 500 on every claim,
//  a player not listed is never granted), the claims are kept out of `calls` and counted by giftCalls() (one username per request).
//  healthDelayMs delays the answer of GET /api/health (the backend wake-up of spec supabase-postgres), which is counted by healthCalls() and kept out of calls.
//  Returns the recorded `calls` (users, auth and wallet routes), the `users` and `wallets` stores and test controls over issued tokens, and holdFarm(chapter, { fail }) -> release() to hold the answer of GET /farm?chapter=n, and holdOutcome() -> release() to hold the answer of POST /farm/outcome.
export async function mockBackend (page, {
    users = {}, delayMs = 0, accessTtlMs = DAY_MS, refreshTtlMs = 30 * DAY_MS, wallets: startingWallets = {}, drops = DEFAULT_DROPS, progress: startingProgress = {}, definition = seededDefinition(),
    chapterDefinitions = {},
    cards: startingCards = {}, chances: startingChances = [ 0.99 ], farmMinIntervalMs = 0, equipment: startingEquipment = {}, equipmentDrops: startingEquipmentDrops = [],
    talents: startingTalents = {}, talentPoints: startingTalentPoints = {}, autoClick: startingAutoClick = {}, lastChapter = 1, healthDelayMs = 0, team: startingTeam = {}, gifts: startingGifts = {},
    legacy: startingLegacy = {}, legacyEndpoint = true, talentLevels = true
} = {}) {
    const store = new Map(Object.entries(users));
    const calls = [];
    const sessions = { access: new Map(), refresh: new Map() };
    let counter = 0;
    const wallets = new Map();
    const rolled = new Map();
    //  GET /farm?chapter=n requests held by holdFarm(n), keyed by the query value: { released, fail }
    const farmHolds = new Map();
    //  POST /farm/outcome requests wait on this promise while holdOutcome() holds them
    let outcomeHold = null;
    //  PUT /team, POST /team/slots and PUT /leader wait on this promise while holdTeam() holds them
    let teamHold = null;
    //  The next team request answers this problem instead ({ status, code }), set by failNextTeamRequest
    let teamFailure = null;
    //  POST /talents/{id}/upgrade and POST /talents/reset wait on this promise while holdTalents() holds them; the next one answers talentFailure instead ({ status, code })
    let talentHold = null;
    let talentFailure = null;
    //  Every upgrade received, as { id, body }, and the number of resets received
    const talentUpgrades = [];
    let talentResets = 0;

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

    const teamByUser = new Map();
    const teamOf = (username) => {
        if (!teamByUser.has(username)) {
            const given = startingTeam[username] ?? {};

            teamByUser.set(username, { boughtSlots: given.boughtSlots ?? 0, allies: [ ...(given.allies ?? [ null, null, null, null ]) ] });
        }

        return teamByUser.get(username);
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

    //  Players that already received the staff of the gift day
    const grantedGifts = new Set();
    const giftCalls = [];

    const talentsByUser = new Map();
    const talentsOf = (username) => {
        if (!talentsByUser.has(username)) {
            talentsByUser.set(username, { ...startingTalents[username] });
        }

        return talentsByUser.get(username);
    };

    //  The points a player earned: the levels they start with, the points they start with and the first clears paid since
    const earnedByUser = new Map();
    const clearedByUser = new Map();
    const earnedOf = (username) => {
        if (!earnedByUser.has(username)) {
            const levels = Object.entries(startingTalents[username] ?? {}).reduce((sum, [ id, level ]) => sum + level * (TALENTS.find((talent) => talent.id === id)?.cost ?? 1), 0);

            earnedByUser.set(username, levels + (startingTalentPoints[username] ?? 0));
        }

        return earnedByUser.get(username);
    };
    const awardTalentPoints = (username, body) => {
        const key = `${body.chapter}:${body.stage}:${body.encounter}:${body.phase}`;
        const cleared = clearedByUser.get(username) ?? new Set();

        clearedByUser.set(username, cleared);

        if (cleared.has(key)) { return 0; }

        cleared.add(key);
        earnedByUser.set(username, earnedOf(username) + TALENT_POINTS[body.encounter]);

        return TALENT_POINTS[body.encounter];
    };

    //  Auto click contract (AutoClickController): levels 0 to 4 at 500, 250, 150, 100 and 50 ms, upgrades for 10, 25, 50 and 100 crystals,
    //  open from chapter 2
    const autoClicks = new Map();
    const autoClickOf = (username) => {
        if (!autoClicks.has(username)) {
            autoClicks.set(username, { level: 0, crystals: 0, ...startingAutoClick[username] });
        }

        return autoClicks.get(username);
    };
    const autoClickView = ({ level, crystals, resets = 0 }) => ({
        level, maxLevel: 4, intervalMs: AUTO_CLICK_INTERVALS[level], crystals,
        next: level < 4 ? { level: level + 1, intervalMs: AUTO_CLICK_INTERVALS[level + 1], price: AUTO_CLICK_PRICES[level] } : null,
        resets
    });

    const handleAutoClick = (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const state = autoClickOf(username);

        if (method === 'GET' && path === '/auto-click') {
            return route.fulfill({ json: autoClickView(state) });
        }

        if (method === 'POST' && path === '/auto-click/upgrade') {
            if (!Number.isInteger(body?.fromLevel) || body.fromLevel < 0) {
                return route.fulfill(problem(400, 'fromLevel must be an integer', 'INVALID_AUTO_CLICK_REQUEST'));
            }
            if (body.fromLevel !== state.level) {
                const refusal = problem(409, 'Level mismatch', 'AUTO_CLICK_LEVEL_MISMATCH');

                return route.fulfill({ ...refusal, json: { ...refusal.json, autoClick: autoClickView(state) } });
            }
            if (state.level >= 4) { return route.fulfill(problem(409, 'Max level', 'AUTO_CLICK_MAX_LEVEL')); }
            if ((progressOf(username).chapter ?? 1) < 2 && !progressOf(username).completed && !(state.resets >= 1)) {
                return route.fulfill(problem(409, 'Locked', 'AUTO_CLICK_LOCKED'));
            }
            if (state.crystals < AUTO_CLICK_PRICES[state.level]) { return route.fulfill(problem(409, 'Not enough crystals', 'NOT_ENOUGH_CRYSTALS')); }

            state.crystals -= AUTO_CLICK_PRICES[state.level];
            state.level += 1;

            return route.fulfill({ json: autoClickView(state) });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    //  The legacy of the account resets (spec reset-legacy-drops): a percent (50 or 100) per chapter. The best is the chapter with the largest
    //  percent x coinFactor, the higher chapter on a tie; coinFactor(c) = 2^(c - 1) up to chapter 8, then 128 + 32 (c - 8) (AD-019)
    const legacies = new Map();
    const legacyOf = (username) => {
        if (!legacies.has(username)) {
            legacies.set(username, { ...startingLegacy[username] });
        }

        return legacies.get(username);
    };
    const coinFactor = (chapter) => (chapter <= 8 ? 2 ** (chapter - 1) : 128 + 32 * (chapter - 8));
    const bestOf = (percents) => Object.entries(percents)
        .map(([ chapter, percent ]) => ({ chapter: Number(chapter), percent }))
        .reduce((best, entry) => {
            if (best === null) { return entry; }

            const score = entry.percent * coinFactor(entry.chapter);
            const bestScore = best.percent * coinFactor(best.chapter);

            return score > bestScore || (score === bestScore && entry.chapter > best.chapter) ? entry : best;
        }, null);
    //  { chapters, best, afterReset } as GET /account/legacy answers it: afterReset is null while the reset is closed (chapter 1, not completed)
    const legacyView = (percents, progress) => {
        const chapter = progress.chapter ?? 1;
        const reward = progress.completed ? 15 : (chapter >= 2 ? Math.min(chapter, 15) : null);
        const after = reward === null ? null : { ...percents, [reward]: Math.min(100, (percents[reward] ?? 0) + 50) };

        return {
            chapters: Object.entries(percents).map(([ number, percent ]) => ({ chapter: Number(number), percent })).sort((a, b) => a.chapter - b.chapter),
            best: bestOf(percents),
            afterReset: reward === null ? null : { chapter: reward, percent: after[reward], best: bestOf(after) }
        };
    };

    //  Account reset contract (AccountResetController): from chapter 2 the campaign goes back to its start, the talents and their points
    //  are wiped, and the chapter left (up to 15) is paid in crystals; the crystals and the auto click level stay
    const handleAccountReset = (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        if (method === 'GET' && path === '/account/legacy' && legacyEndpoint) {
            return route.fulfill({ json: legacyView(legacyOf(username), progressOf(username)) });
        }

        if (method !== 'POST' || path !== '/account/reset') { return route.fulfill(problem(404, 'Not found')); }

        const progress = progressOf(username);
        const chapter = progress.chapter ?? 1;

        if (!Number.isInteger(body?.fromChapter)) {
            return route.fulfill(problem(400, 'fromChapter must be an integer', 'INVALID_RESET_REQUEST'));
        }
        if (body.fromChapter !== chapter) {
            const refusal = problem(409, 'Chapter mismatch', 'RESET_CHAPTER_MISMATCH');

            return route.fulfill({ ...refusal, json: { ...refusal.json, progress: progressBody(progress) } });
        }
        if (chapter < 2 && !progress.completed) { return route.fulfill(problem(409, 'Locked', 'RESET_LOCKED')); }

        const reward = progress.completed ? 15 : Math.min(chapter, 15);
        const state = autoClickOf(username);
        const percents = legacyOf(username);

        percents[reward] = Math.min(100, (percents[reward] ?? 0) + 50);
        state.crystals += reward;
        state.resets = (state.resets ?? 0) + 1;
        progresses.set(username, { ...startOfCampaign(), chapter: 1 });
        talentsByUser.set(username, {});
        earnedByUser.set(username, 0);
        clearedByUser.set(username, new Set());

        const answer = { reward, crystals: state.crystals, resets: state.resets, progress: progressBody(progressOf(username)) };

        return route.fulfill({ json: legacyEndpoint ? { ...answer, legacy: legacyView(percents, progressOf(username)) } : answer });
    };

    //  Waits for holdTalents() and answers the problem failNextTalentRequest() set, once; null when the request goes on
    const talentGate = async (route) => {
        if (talentHold) { await talentHold; }

        if (!talentFailure) { return null; }

        const { status, code } = talentFailure;

        talentFailure = null;
        return route.fulfill(problem(status, 'Failed', code));
    };

    const handleTalents = async (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const levels = talentsOf(username);

        if (method === 'GET' && path === '/talents') {
            return route.fulfill({ json: { talents: talentsView(levels), points: pointsView(earnedOf(username), levels) } });
        }

        if (method === 'POST' && path === '/talents/reset') {
            talentResets += 1;

            const failed = await talentGate(route);

            if (failed !== null) { return failed; }

            Object.keys(levels).forEach((id) => { delete levels[id]; });
            return route.fulfill({ json: { talents: talentsView(levels), points: pointsView(earnedOf(username), levels) } });
        }

        const action = path.match(/^\/talents\/([^/]+)\/upgrade$/);

        if (method !== 'POST' || !action) { return route.fulfill(problem(404, 'Not found')); }

        talentUpgrades.push({ id: decodeURIComponent(action[1]), body: { ...body } });

        const gated = await talentGate(route);

        if (gated !== null) { return gated; }

        const id = decodeURIComponent(action[1]);

        const talent = TALENTS.find((candidate) => candidate.id === id);

        if (!talent) { return route.fulfill(problem(404, `Talent '${id}' not found`, 'TALENT_NOT_FOUND')); }
        if (!Number.isInteger(body.fromLevel) || body.fromLevel < 0 || body.fromLevel > talent.maxLevel) { return route.fulfill(problem(400, `fromLevel must be an integer between 0 and ${talent.maxLevel}`, 'INVALID_TALENT_REQUEST')); }

        //  A backend without the feature ignores `levels` (talentLevels false)
        const count = talentLevels ? body.levels ?? 1 : 1;

        if (!Number.isInteger(count)) { return route.fulfill(problem(400, 'levels must be an integer', 'INVALID_TALENT_REQUEST')); }
        if (count < 1 || count > talent.maxLevel) { return route.fulfill(problem(400, `levels must be an integer between 1 and ${talent.maxLevel}`, 'INVALID_TALENT_REQUEST')); }

        const level = levels[id] ?? 0;

        if (body.fromLevel !== level) { return route.fulfill(problem(409, `Talent '${id}' is at level ${level}`, 'TALENT_LEVEL_MISMATCH')); }
        if (!isUnlocked(talent, levels)) { return route.fulfill(problem(409, 'Talent grade is locked', 'TALENT_LOCKED')); }
        if (level >= talent.maxLevel) { return route.fulfill(problem(409, 'Talent is already at the maximum level', 'TALENT_MAX_LEVEL')); }
        if (level + count > talent.maxLevel) { return route.fulfill(problem(409, `Talent '${id}' at level ${level} cannot rise ${count} levels`, 'TALENT_MAX_LEVEL')); }
        if (pointsView(earnedOf(username), levels).available < count * talent.cost) { return route.fulfill(problem(409, 'Not enough talent points', 'NOT_ENOUGH_TALENT_POINTS')); }

        levels[id] = level + count;
        return route.fulfill({ json: { talents: talentsView(levels), points: pointsView(earnedOf(username), levels) } });
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

    //  The drop of a won miniboss or chapter boss (the first chapter boss win always drops); only a farm chapter boss win counts for the day
    const awardCards = (cards, encounter, chapter, fromFarm = false) => {
        if (encounter === 'PHASE') { return null; }

        const chapterBoss = encounter === 'CHAPTER_BOSS';
        const first = chapterBoss && !cards.cleared.has(chapter);
        const hero = encounter === 'MINIBOSS'
            ? (nextChance() < MINIBOSS_RATE ? heroOfChapter(cards.start, chapter) : null)
            : (first || nextChance() < CHAPTER_BOSS_RATE ? heroOfChapter(cards.start, Math.min(chapter + 1, 15)) : null);

        if (chapterBoss) {
            cards.cleared.add(chapter);
        }

        if (chapterBoss && fromFarm) {
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

    const handleHeroes = async (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const cards = cardsOf(username);

        if (method === 'GET' && path === '/heroes') {
            return route.fulfill({ json: { leaderId: cards.leader, heroes: HEROES.map((hero) => heroView(cards, hero)), team: teamView(cards, teamOf(username)) } });
        }

        const fuse = path.match(/^\/heroes\/([^/]+)\/fuse$/);

        if (method === 'POST' && fuse) {
            const hero = HEROES.find((candidate) => candidate.id === decodeURIComponent(fuse[1]));

            if (!hero) { return route.fulfill(problem(404, `Hero '${fuse[1]}' not found`, 'HERO_NOT_FOUND')); }
            if (![ 0, 1, 2, 3, 4, 5, 6, 7, 8 ].includes(body.stars)) { return route.fulfill(problem(400, 'Fusion is invalid', 'INVALID_FUSION')); }
            if (copiesOf(cards, hero.id, body.stars) < FUSION_SIZE) { return route.fulfill(problem(409, 'Fewer than 3 cards', 'NOT_ENOUGH_CARDS')); }

            cards.copies[`${hero.id}:${body.stars}`] -= FUSION_SIZE;
            cards.copies[`${hero.id}:${body.stars + 1}`] = copiesOf(cards, hero.id, body.stars + 1) + 1;
            return route.fulfill({ json: heroView(cards, hero) });
        }

        //  POST /heroes/:id/fuse-all: every layer from 0 stars up, all or nothing (HeroController.fuseAll)
        const fuseAll = path.match(/^\/heroes\/([^/]+)\/fuse-all$/);

        if (method === 'POST' && fuseAll) {
            const hero = HEROES.find((candidate) => candidate.id === decodeURIComponent(fuseAll[1]));

            if (!hero) { return route.fulfill(problem(404, `Hero '${fuseAll[1]}' not found`, 'HERO_NOT_FOUND')); }

            const next = {};
            let carry = 0;
            let fusions = 0;

            for (let stars = 0; stars <= 8; stars++) {
                const count = copiesOf(cards, hero.id, stars) + carry;

                carry = Math.floor(count / FUSION_SIZE);
                fusions += carry;
                next[stars] = count - carry * FUSION_SIZE;
            }
            next[9] = copiesOf(cards, hero.id, 9) + carry;

            if (fusions === 0) { return route.fulfill(problem(409, 'Nothing to fuse', 'NOTHING_TO_FUSE')); }

            Object.entries(next).forEach(([ stars, count ]) => { cards.copies[`${hero.id}:${stars}`] = count; });
            return route.fulfill({ json: { hero: heroView(cards, hero), fusions } });
        }

        if (method === 'PUT' && path === '/leader') {
            if (teamHold) { await teamHold; }

            if (teamFailure) {
                const { status, code } = teamFailure;

                teamFailure = null;
                return route.fulfill(problem(status, 'Failed', code));
            }

            const hero = HEROES.find((candidate) => candidate.id === body.heroId);

            if (!hero) { return route.fulfill(problem(404, `Hero '${body.heroId}' not found`, 'HERO_NOT_FOUND')); }
            if (!heroView(cards, hero).owned) { return route.fulfill(problem(409, `Hero '${hero.id}' is not owned`, 'HERO_NOT_OWNED')); }

            const team = teamOf(username);
            const old = cards.leader;

            //  The hero who leaves the lead takes the place of the ally who becomes the leader
            if (hero.id !== old && team.allies.includes(hero.id)) { team.allies = team.allies.map((ally) => (ally === hero.id ? old : ally)); }

            cards.leader = hero.id;
            return route.fulfill({ json: { leaderId: hero.id, team: teamView(cards, team) } });
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    //  Hero team contract (TeamController): PUT /team saves the four entries, POST /team/slots buys the next slot; the checks run in the order of the spec
    const handleTeam = async (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        if (teamHold) { await teamHold; }

        if (teamFailure) {
            const { status, code } = teamFailure;

            teamFailure = null;
            return route.fulfill(problem(status, 'Failed', code));
        }

        const cards = cardsOf(username);
        const team = teamOf(username);

        if (method === 'PUT' && path === '/team') {
            const { allies } = body;
            const named = Array.isArray(allies) ? allies.filter((ally) => ally !== null) : [];
            const valid = Array.isArray(allies) && allies.length === 4 && allies.every((ally) => ally === null || typeof ally === 'string')
                && new Set(named).size === named.length && !named.includes(cards.leader);

            if (!valid) { return route.fulfill(problem(400, 'Team is invalid', 'INVALID_TEAM')); }
            if (named.some((id) => !HEROES.some((hero) => hero.id === id))) { return route.fulfill(problem(404, 'Hero not found', 'HERO_NOT_FOUND')); }
            if (!cards.cleared.has(5)) { return route.fulfill(problem(409, 'Team is locked', 'TEAM_LOCKED')); }
            if (allies.some((ally, index) => ally !== null && index >= team.boughtSlots)) { return route.fulfill(problem(409, 'Slot is not bought', 'TEAM_SLOT_NOT_BOUGHT')); }
            if (named.some((id) => !heroView(cards, HEROES.find((hero) => hero.id === id)).owned)) { return route.fulfill(problem(409, 'Hero is not owned', 'HERO_NOT_OWNED')); }

            team.allies = [ ...allies ];
            return route.fulfill({ json: { leaderId: cards.leader, team: teamView(cards, team) } });
        }

        if (method === 'POST' && path === '/team/slots') {
            const from = body.fromSlots;
            const view = teamView(cards, team);

            if (!Number.isInteger(from) || from < 0) { return route.fulfill(problem(400, 'fromSlots is invalid', 'INVALID_TEAM_SLOT_REQUEST')); }
            if (from !== team.boughtSlots) {
                const mismatch = problem(409, 'Slots changed', 'TEAM_SLOT_MISMATCH');

                return route.fulfill({ ...mismatch, json: { ...mismatch.json, team: view } });
            }
            if (team.boughtSlots === 4) { return route.fulfill(problem(409, 'All slots are bought', 'TEAM_SLOTS_MAX')); }
            if (team.boughtSlots >= view.openSlots) { return route.fulfill(problem(409, 'Slot is locked', 'TEAM_SLOT_LOCKED')); }

            const wallet = walletOf(username);

            if (wallet.copper < SLOT_PRICES[from]) { return route.fulfill(problem(409, 'Not enough copper', 'NOT_ENOUGH_COPPER')); }

            wallet.copper -= SLOT_PRICES[from];
            team.boughtSlots += 1;
            return route.fulfill({ json: { team: teamView(cards, team), wallet: coins(wallet.copper) } });
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

        //  POST /equipment/sell { pieceIds }: every listed piece or none (EquipmentController.sellAll)
        if (method === 'POST' && path === '/equipment/sell') {
            const ids = body.pieceIds;

            if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) { return route.fulfill(problem(400, 'pieceIds must be a list of piece ids')); }
            if (ids.length === 0 || ids.length > 100 || new Set(ids).size !== ids.length) { return route.fulfill(problem(400, 'Invalid sell batch', 'INVALID_SELL_BATCH')); }

            const chosen = ids.map((id) => pieces.find((candidate) => candidate.id === id));

            if (chosen.some((candidate) => !candidate)) { return route.fulfill(problem(404, 'Piece not found', 'EQUIPMENT_NOT_FOUND')); }

            const wallet = walletOf(username);
            const earned = chosen.reduce((sum, candidate) => sum + pieceView(candidate).sellPrice, 0);

            wallet.copper += earned;
            chosen.forEach((candidate) => pieces.splice(pieces.indexOf(candidate), 1));
            return route.fulfill({ json: { equipment: equipmentBody(username), wallet: coins(wallet.copper), sold: chosen.length, earned } });
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

    const definitionOf = (number) => chapterDefinitions[number] ?? definition;

    //  FarmController: GET /farm?chapter=n answers the chapter it lists (a chapter above the reached one answers the reached one), POST /farm/outcome
    //  fights the chapter it names (absent: the reached one), and a chapter that is not an integer of at least 1 answers 400
    const handleFarm = (route, method, path, body, now) => {
        const username = authenticated(route, now);

        if (!username) { return null; }

        const cards = cardsOf(username);
        const progress = progressOf(username);
        const reached = progress.chapter ?? 1;

        if (method === 'GET' && path === '/farm') {
            const raw = new URL(route.request().url()).searchParams.get('chapter');

            if (raw !== null && (!/^\d+$/.test(raw) || Number(raw) < 1)) { return route.fulfill(problem(400, CHAPTER_MESSAGE)); }

            const listed = raw === null ? reached : Math.min(Number(raw), reached);

            return route.fulfill({
                json: {
                    chapter: listed,
                    chapters: Array.from({ length: reached }, (_, i) => i + 1),
                    bosses: beatenBosses(progress, definitionOf(listed), listed),
                    chapterBossWinsLeft: winsLeft(cards),
                    definition: definitionOf(listed)
                }
            });
        }

        if (method === 'POST' && path === '/farm/outcome') {
            const { boss, outcome } = body;
            const valid = [ 'CLEARED', 'FAILED' ].includes(outcome) && boss && ((boss.kind === 'MINIBOSS' && Number.isInteger(boss.stage)) || (boss.kind === 'CHAPTER_BOSS' && boss.stage === undefined));
            const requested = body.chapter ?? null;

            if (!valid) { return route.fulfill(problem(400, 'Farm report is invalid')); }
            if (requested !== null && !(Number.isInteger(requested) && requested >= 1)) { return route.fulfill(problem(400, CHAPTER_MESSAGE)); }

            const fought = requested ?? reached;

            if (fought > reached) { return route.fulfill(problem(409, 'Boss has not been beaten yet', 'BOSS_NOT_AVAILABLE')); }
            if (!beatenBosses(progress, definitionOf(fought), fought).some((candidate) => candidate.kind === boss.kind && candidate.stage === boss.stage)) { return route.fulfill(problem(409, 'Boss has not been beaten yet', 'BOSS_NOT_AVAILABLE')); }
            if (outcome === 'FAILED') { return route.fulfill({ json: { drop: null, chapterBossWinsLeft: winsLeft(cards) } }); }
            if (boss.kind === 'CHAPTER_BOSS' && winsLeft(cards) === 0) { return route.fulfill(problem(409, 'Daily limit reached', 'DAILY_LIMIT_REACHED')); }
            if (cards.lastFarmWin !== null && now - cards.lastFarmWin < farmMinIntervalMs) { return route.fulfill(problem(409, 'Farm win too fast', 'FARM_TOO_FAST')); }

            cards.lastFarmWin = now;

            const drop = awardCards(cards, boss.kind, fought, true);

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
            //  Progress.withNextChapterOpen: a campaign stored as completed below lastChapter opens the next chapter on the load and keeps it
            const opened = progress.completed && (progress.chapter ?? 1) < lastChapter
                ? { ...progress, chapter: (progress.chapter ?? 1) + 1, stage: 1, encounter: 'PHASE', phase: 1, completed: false }
                : progress;

            if (opened !== progress) { progresses.set(username, opened); }
            return route.fulfill({ json: progressBody(opened) });
        }

        if (method === 'POST' && path === '/progress/outcome') {
            const valid = ['CLEARED', 'FAILED'].includes(body.outcome) && ['PHASE', 'MINIBOSS', 'CHAPTER_BOSS'].includes(body.encounter)
                && [body.chapter, body.stage, body.phase].every((value) => Number.isInteger(value) && value >= 1);

            if (!valid) { return route.fulfill(problem(400, 'Outcome is invalid', 'PROGRESS_INVALID_OUTCOME')); }

            const reportedFromStored = body.chapter === (progress.chapter ?? 1) && body.stage === progress.stage && body.encounter === progress.encounter && body.phase === progress.phase;
            const next = reportedFromStored ? afterOutcome(progress, body.outcome, definition, lastChapter) : null;

            if (!next) {
                const conflict = problem(409, 'Reported position does not match the stored progress', 'PROGRESS_CONFLICT');

                conflict.json.progress = progressBody(progress);
                return route.fulfill(conflict);
            }

            progresses.set(username, next);

            const drop = body.outcome === 'CLEARED' ? awardCards(cardsOf(username), body.encounter, body.chapter) : null;

            const equipmentDrop = body.outcome === 'CLEARED' ? awardEquipment(username, body.encounter) : null;
            const talentPoints = body.outcome === 'CLEARED' ? awardTalentPoints(username, body) : 0;

            return route.fulfill({ json: { ...progressBody(next), ...(drop && { drop }), ...(equipmentDrop && { equipmentDrop }), talentPoints } });
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

        //  holdFarm: a held chapter answers only once the test releases it, from the state at that moment, or 500 when it was held with fail
        const hold = method === 'GET' && path === '/farm' ? farmHolds.get(new URL(request.url()).searchParams.get('chapter')) : undefined;

        if (hold) {
            await hold.released;

            if (hold.fail) { return route.fulfill({ status: 500, body: '' }); }
        }

        //  holdOutcome: a POST /farm/outcome is recorded above, then applied and answered only once the test releases it
        if (method === 'POST' && path === '/farm/outcome' && outcomeHold) {
            await outcomeHold;
        }

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
        if (path === '/team' || path.startsWith('/team/')) { return handleTeam(route, method, path, body, now); }
        if (path === '/farm' || path === '/farm/outcome') { return handleFarm(route, method, path, body, now); }
        if (path === '/equipment' || path.startsWith('/equipment/')) { return handleEquipment(route, method, path, body, now); }
        if (path === '/talents' || path.startsWith('/talents/')) { return handleTalents(route, method, path, body, now); }
        if (path === '/auto-click' || path.startsWith('/auto-click/')) { return handleAutoClick(route, method, path, body, now); }
        if (path.startsWith('/account/')) { return handleAccountReset(route, method, path, body, now); }

        if (path.startsWith('/users') && !isPublic(method, path)) {
            if (!hasValidBearer(request, now)) { return route.fulfill(unauthenticated()); }

            const username = decodeURIComponent(path.split('/')[2] ?? '');

            if (method === 'GET' && store.has(username)) { return route.fulfill({ json: { username } }); }
        }

        return route.fulfill(problem(404, 'Not found'));
    };

    let healthCalls = 0;

    //  GET /health of HealthController: UP with a fixed commit, after healthDelayMs; outside `calls` so the API call lists stay the same
    await page.route('**/api/health', async (route) => {
        healthCalls += 1;

        if (healthDelayMs) { await new Promise((resolve) => setTimeout(resolve, healthDelayMs)); }

        return route.fulfill({ json: { status: 'UP', commit: 'e2e' } });
    });

    //  POST /gifts/claim of GiftController; outside `calls` like /api/health so no existing call list changes
    await page.route('**/api/gifts/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace(/^\/api/, '');
        const now = Date.now();
        const username = authenticated(route, now);

        if (!username) { return null; }

        giftCalls.push(username);

        if (request.method() !== 'POST' || path !== '/gifts/claim') { return route.fulfill(problem(404, 'Not found')); }

        const gift = startingGifts[username];

        if (gift === 'fail') { return route.fulfill(problem(500, 'Gift failed')); }

        if (gift !== true || grantedGifts.has(username)) { return route.fulfill({ json: { granted: false } }); }

        grantedGifts.add(username);

        const piece = { ...GIFT_STAFF, affixes: GIFT_STAFF.affixes.map((affix) => ({ ...affix })) };

        equipmentOf(username).push(piece);

        return route.fulfill({ json: { granted: true, gift: 'BLACK_AWARENESS_STAFF', piece: pieceView(piece) } });
    });

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
    await page.route('**/api/team', handler);
    await page.route('**/api/team/**', handler);
    //  A predicate, not a glob: a glob does not match the query string of GET /farm?chapter=n
    await page.route((url) => url.pathname === '/api/farm', handler);
    await page.route('**/api/farm/**', handler);
    await page.route('**/api/equipment', handler);
    await page.route('**/api/equipment/**', handler);
    await page.route('**/api/talents', handler);
    await page.route('**/api/talents/**', handler);
    await page.route('**/api/auto-click', handler);
    await page.route('**/api/auto-click/**', handler);
    await page.route('**/api/account/**', handler);

    return {
        calls,
        healthCalls: () => healthCalls,
        users: store,
        wallets,
        progresses,
        cards: cardsByUser,
        cardsOf,
        teamOf,
        equipmentOf,
        talentsOf,
        //  The username of every POST /gifts/claim received, in order
        giftCalls: () => [ ...giftCalls ],
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
        },
        //  Holds every GET /farm?chapter=<chapter> until the returned release() runs; GET /farm without a chapter is never held
        holdFarm: (chapter, { fail = false } = {}) => {
            let release = () => {};
            const released = new Promise((resolve) => { release = resolve; });

            farmHolds.set(String(chapter), { released, fail });
            return () => {
                farmHolds.delete(String(chapter));
                release();
            };
        },
        //  Holds every PUT /team, POST /team/slots and PUT /leader until the returned release() runs
        holdTeam: () => {
            let release = () => {};
            const held = new Promise((resolve) => { release = resolve; });

            teamHold = held;
            return () => {
                if (teamHold === held) { teamHold = null; }
                release();
            };
        },
        //  The next team request (PUT /team, POST /team/slots or PUT /leader) answers this problem instead of its result
        failNextTeamRequest: ({ status = 500, code } = {}) => {
            teamFailure = { status, code };
        },
        //  Holds every POST /talents/{id}/upgrade and POST /talents/reset until the returned release() runs
        holdTalents: () => {
            let release = () => {};
            const held = new Promise((resolve) => { release = resolve; });

            talentHold = held;
            return () => {
                if (talentHold === held) { talentHold = null; }
                release();
            };
        },
        //  The next talent request (an upgrade or a reset) answers this problem instead of its result
        failNextTalentRequest: ({ status = 500, code } = {}) => {
            talentFailure = { status, code };
        },
        //  The upgrades received so far, as { id, body } in order, and the number of resets received
        talentUpgrades: () => [ ...talentUpgrades ],
        talentResets: () => talentResets,
        //  Pays talent points to a player, as a first clear does
        grantTalentPoints: (username, points) => {
            earnedByUser.set(username, earnedOf(username) + points);
        },
        //  Holds every POST /farm/outcome until the returned release() runs: the win is applied and answered only then
        holdOutcome: () => {
            let release = () => {};
            const held = new Promise((resolve) => { release = resolve; });

            outcomeHold = held;
            return () => {
                if (outcomeHold === held) { outcomeHold = null; }
                release();
            };
        }
    };
}

export const serverDown = async (page) => {
    await page.route('**/api/users**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/auth/**', (route) => route.abort('connectionrefused'));
    await page.route('**/api/health', (route) => route.abort('connectionrefused'));
};
