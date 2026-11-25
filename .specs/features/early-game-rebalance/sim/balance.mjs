// Balance simulation of spec early-game-rebalance (design.md § Simulation). Run from the repository root:
//
//     node .specs/features/early-game-rebalance/sim/balance.mjs          the report (times, walls, gains per point)
//     node .specs/features/early-game-rebalance/sim/balance.mjs fit      how the health tables were found
//
// Environment knobs (exploration only; the defaults are the numbers of the spec): KIT=0 (no gear or stars after chapter 5),
// CRIT_CHANCE_PER_LEVEL, CRIT_DAMAGE_PER_LEVEL, PHASES, NO_AFFIX=1, WEAPON=<n> (a weapon of n base click from chapter 1, used by
// spec reset-legacy-drops).
//
// The model (what it leaves out makes the real game faster, so the times are an upper bound for an active player):
// - Talents: every miniboss pays 2 points and every chapter boss 5 (TalentRules); the player spends them at once on the talent level that
//   raises the expected click against the next miniboss (or boss) the most per point (greedy). Grade N costs N points a level and opens at
//   level 10 of grade N - 1 (AD-017). MINIBOSS_TIME is never bought. The combo is at its cap.
// - Kit (assumption, design § Simulation, Late-game kit): chapters 1 to 5 nothing; from chapter 6 the leader's stars (STAR_BONUS of
//   game/src/domain/heroes/starBonus.js) and a weapon of the KIT table. No other piece, no skill, no ally, no auto click, no refine.
// - Damage of a click (damage.js calculateDamage, leaderAttacker, attackerFor): (1 + weapon + flat) x (1 + (click% + stars%) / 100) x
//   element x (1 - defense / 100) x (1 + bossDamage / 100 on bosses) x (1 + combo cap / 100), critical chance 10 + talents + stars minus the
//   critical resistance (AD-029), multiplier 2 + (crit damage + stars) / 100 + overflow / 100. Lyra (NATURE) lands two critical hits on 30 %
//   of her clicks. Every roll is replaced by its expected value.
// - Each kill costs 1.5 s more (fade 500 ms + respawn 1000 ms, ClickerGame.js DEATH). A miniboss or boss not killed inside its limit is a
//   wall: the run stops there (the farm pays no talent points).
// - Adds (spec miniboss-adds) on the minibosses of chapters 11 to 15: the player kills both adds (3 x the phase monster health, the stage's
//   phase monster stats) and then the miniboss, all inside the miniboss limit; while an add lives the miniboss takes nothing.
// - Affixes (spec § Affix Rules): Carapaça subtracts its amount from every hit; Escudo de golpes absorbs `charges` hits, then comes back full
//   6 s after it broke; Regeneração heals its share of the maximum health every second; Blindado adds defense.

const E = ['FIRE', 'WATER', 'NATURE', 'LIGHT', 'DARKNESS'];
const BEATS = { FIRE: 'NATURE', NATURE: 'WATER', WATER: 'FIRE' };
const OPPOSED = ['LIGHT', 'DARKNESS'];
const elementMultiplier = (attacker, defender) => {
    if (attacker === defender) return 1;
    const a = OPPOSED.includes(attacker);
    const d = OPPOSED.includes(defender);
    if (a && d) return 0.9;
    if (a) return 1.8;
    if (d) return 0.9;
    return BEATS[attacker] === defender ? 2 : 0.5;
};
const CHAPTERS = 15;
const stageElement = (c, n) => E[(n - 1 + c - 1) % 5];
const bossElement = (c) => E[(c + 3) % 5];
const defenseBonus = (c) => (c <= 5 ? 5 * (c - 1) : 20 + 3 * (c - 5));
const healthFactor = (c) => (c <= 5 ? 4 ** (c - 1) : 256 * 2 ** (c - 5));
const linear = (c, n) => (40 + 4 * (n - 1)) * healthFactor(c);
const ADD_BUFFS = { 11: 30, 12: 35, 13: 40, 14: 45, 15: 50 };

// ---- The numbers of this spec (spec § Chapter Table and § Affix Table) ----
const CURVES = {
    1: [69, 1.33], 2: [265, 1.29], 3: [1000, 1.16], 4: [4750, 1.04], 5: [7250, 1.04],
    6: [10000, 1.04], 7: [28000, 1.04], 8: [36000, 1.04], 9: [58000, 1.04], 10: [71000, 1.04],
    11: [38000, 1.04], 12: [64000, 1.04], 13: [90000, 1.04], 14: [133000, 1.04], 15: [161000, 1.04]
};
const AFTER_BOSS = { 1: 6000, 2: 12500, 3: 13000, 4: 34000, 5: 80000, 6: 130000, 7: 139000, 8: 313000, 9: 475000, 10: 900000,
    11: 956000, 12: 1850000, 13: 1940000, 14: 2837000, 15: 4265000 };
const AFTER_PHASE = Object.fromEntries(Object.entries(CURVES).map(([c, [B, g]]) => [c, Array.from({ length: 10 }, (_, i) => Math.round(B * g ** i))]));
const ROTATION = ['HIT_SHIELD', 'SHELL', 'REGENERATION', 'ARMORED'];
const AFFIX_TABLE = {
    2: { 3: 'HIT_SHIELD', 6: 'HIT_SHIELD', 9: 'HIT_SHIELD', boss: 'HIT_SHIELD' },
    3: { 3: 'SHELL', 6: 'HIT_SHIELD', 9: 'SHELL', boss: 'SHELL' },
    4: { 3: 'REGENERATION', 6: 'SHELL', 9: 'REGENERATION', boss: 'REGENERATION' },
    5: { 3: 'ARMORED', 6: 'REGENERATION', 9: 'ARMORED', boss: 'ARMORED' },
    // chapters 6 to 10: the four types rotate over minibosses 3, 6, 9 and the boss; 11 to 15: only the boss (the minibosses have adds)
    ...Object.fromEntries([6, 7, 8, 9, 10].map((c) => [c, { 3: ROTATION[(c - 6) % 4], 6: ROTATION[(c - 5) % 4], 9: ROTATION[(c - 4) % 4], boss: ROTATION[(c - 3) % 4] }])),
    ...Object.fromEntries([11, 12, 13, 14, 15].map((c) => [c, { boss: ROTATION[(c - 3) % 4] }]))
};
const SHIELD_CHARGES = (c) => 10 + 5 * Math.min(c - 2, 4);
const SHIELD_RECHARGE_S = 6;
const SHELL_PER_MILLE = 4;
const REGEN_BP = { miniboss: 50, boss: 25 };
const ARMORED_DEFENSE = 20;
const PHASES = Number(process.env.PHASES ?? 8);

// Late-game kit: leader stars and weapon base click from chapter 6 (assumption, design § Late-game kit)
const STAR_BONUS = { 0: [0, 0, 0], 1: [10, 0, 0], 2: [20, 0, 20], 3: [40, 30, 50], 4: [70, 35, 75], 5: [100, 40, 100], 6: [130, 45, 125] };
const KIT = { 6: [1, 3], 7: [2, 4], 8: [3, 5], 9: [3, 6], 10: [4, 6], 11: [4, 7], 12: [5, 8], 13: [5, 8], 14: [6, 9], 15: [6, 10] };
const kitOf = (c) => (process.env.KIT === '0' ? [0, 0] : (KIT[c] ?? [0, 0]));

const affixAmount = (type, c, kind, n, phaseHealth) => {
    if (type === 'HIT_SHIELD') return SHIELD_CHARGES(c);
    if (type === 'SHELL') return Math.ceil((phaseHealth(c, kind === 'boss' ? 10 : n) * SHELL_PER_MILLE) / 1000);
    if (type === 'REGENERATION') return REGEN_BP[kind];
    return ARMORED_DEFENSE;
};

const MODELS = {
    antes: {
        flat: { first: 1, per: 2 }, critChance: 1, critDamage: 5, phases: 5,
        phase: linear,
        minibossFactor: 5,
        minibossLimit: 30,
        bossHealth: (c) => 2000 * healthFactor(c),
        bossLimit: 60,
        minibossCrit: (c, n) => Math.min(10 + 2 * n + defenseBonus(c), 70),
        bossCrit: (c) => Math.min(30 + defenseBonus(c), 70),
        affix: () => null
    }
};
MODELS.depois = {
    ...MODELS.antes,
    flat: { first: 1, per: 1 },
    critChance: Number(process.env.CRIT_CHANCE_PER_LEVEL ?? 5),
    critDamage: Number(process.env.CRIT_DAMAGE_PER_LEVEL ?? 15),
    phases: PHASES,
    phase: (c, n) => AFTER_PHASE[c][n - 1],
    minibossFactor: 3,
    minibossLimit: 45,
    bossHealth: (c) => AFTER_BOSS[c],
    bossLimit: 90,
    minibossCrit: (c, n) => (c <= 5 ? n - 1 + 8 * (c - 1) : Math.min(10 + 2 * n + defenseBonus(c), 70)),
    bossCrit: (c) => (c <= 5 ? 10 * c - 5 : Math.min(30 + defenseBonus(c), 70)),
    affix: (c, kind, n) => {
        if (process.env.NO_AFFIX) return null;
        const type = AFFIX_TABLE[c]?.[kind === 'boss' ? 'boss' : n];
        return type ? { type, amount: affixAmount(type, c, kind, n, MODELS.depois.phase) } : null;
    }
};

const HEROES = { kael: 'FIRE', orina: 'WATER', lyra: 'NATURE' };
const GRADED = ['CLICK_FLAT_DAMAGE', 'CLICK_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE', 'COMBO', 'PHYSICAL_BREAK', 'ARMOR_PIERCE', 'BOSS_DAMAGE'];
const perLevel = (m, id) => ({ CLICK_DAMAGE: 5, CRIT_CHANCE: m.critChance, CRIT_DAMAGE: m.critDamage, COMBO: 5, PHYSICAL_BREAK: 1, ARMOR_PIERCE: 1, BOSS_DAMAGE: 2 })[id];
// TalentDefinition.valueAt: firstLevel + (level - 1) x perLevel, grade N gives N times
const value = (m, id, levels) => [1, 2, 3].reduce((sum, g) => {
    const level = levels[`${id}_${g}`] ?? 0;
    if (!level) return sum;
    return sum + (id === 'CLICK_FLAT_DAMAGE' ? g * (m.flat.first + (level - 1) * m.flat.per) : g * perLevel(m, id) * level);
}, 0);

// The expected damage of one click of `hero` with `levels` and the kit of chapter `c` against `enemy`
const clickDamage = (m, hero, levels, enemy, c) => {
    const v = (id) => value(m, id, levels);
    const [stars, weapon] = kitOf(c);
    const [starPct, starCrit, starCritDamage] = STAR_BONUS[stars];
    const base = (1 + weapon + Number(process.env.WEAPON ?? 0) + v('CLICK_FLAT_DAMAGE')) * (1 + (v('CLICK_DAMAGE') + starPct) / 100);
    const chance = 10 + v('CRIT_CHANCE') + starCrit;
    const effective = Math.min(100, Math.max(0, chance - enemy.crit)) / 100;
    const overflow = Math.max(0, chance - enemy.crit - 100) / 100;
    const armored = enemy.affix?.type === 'ARMORED' ? enemy.affix.amount : 0;
    const defense = Math.max(0, enemy.defense + armored - v('PHYSICAL_BREAK')) * (1 - Math.min(100, v('ARMOR_PIERCE')) / 100);
    const normal = base * elementMultiplier(HEROES[hero], enemy.element) * Math.max(0, 1 - defense / 100)
        * (enemy.boss ? 1 + v('BOSS_DAMAGE') / 100 : 1) * (1 + v('COMBO') / 100);
    const critical = normal * (2 + (v('CRIT_DAMAGE') + starCritDamage) / 100 + overflow);
    const shell = enemy.affix?.type === 'SHELL' ? enemy.affix.amount : 0;
    const one = (1 - effective) * Math.max(0, normal - shell) + effective * Math.max(0, critical - shell);
    return hero === 'lyra' ? 0.7 * one + 0.3 * 2 * Math.max(0, critical - shell) : one;
};

const killSeconds = (m, hero, levels, enemy, rate, c) => {
    const hit = clickDamage(m, hero, levels, enemy, c);
    if (hit <= 0) return Infinity;
    const a = enemy.affix;
    if (a?.type === 'REGENERATION') {
        const net = hit * rate - (a.amount / 10000) * enemy.health;
        return net <= 0 ? Infinity : enemy.health / net;
    }
    const clicks = Math.ceil(enemy.health / hit - 1e-9);
    if (a?.type === 'HIT_SHIELD') {
        const landing = SHIELD_RECHARGE_S * rate;
        return (clicks + (1 + Math.floor(Math.max(0, clicks - 1) / landing)) * a.amount) / rate;
    }
    return clicks / rate;
};

const phaseEnemy = (m, c, n, health = m.phase(c, n)) => ({ health, element: stageElement(c, n), defense: 0, crit: 0, boss: false, affix: null });
const minibossEnemy = (m, c, n, phase = m.phase(c, n)) => {
    const e = { health: phase * m.minibossFactor, element: stageElement(c, n), defense: Math.min(10 + n + defenseBonus(c), 80), crit: m.minibossCrit(c, n),
        boss: true, affix: m.affix(c, 'miniboss', n), limit: m.minibossLimit };
    if (e.affix?.type === 'SHELL') e.affix = { ...e.affix, amount: Math.ceil(phase * SHELL_PER_MILLE / 1000) };
    return e;
};
const bossEnemy = (m, c, health = m.bossHealth(c)) => ({ health, element: bossElement(c), defense: Math.min(30 + defenseBonus(c), 80), crit: m.bossCrit(c), boss: true,
    affix: m.affix(c, 'boss', 0), limit: m.bossLimit });
// The miniboss fight: both adds first (chapters 11 to 15), then the miniboss
const minibossSeconds = (m, hero, levels, c, n, rate, phase = m.phase(c, n)) => {
    const adds = ADD_BUFFS[c] ? 2 * killSeconds(m, hero, levels, phaseEnemy(m, c, n, 3 * phase), rate, c) : 0;
    return adds + killSeconds(m, hero, levels, minibossEnemy(m, c, n, phase), rate, c);
};

const spend = (m, hero, levels, points, reference, allowed, c) => {
    for (;;) {
        let best = null;
        const now = clickDamage(m, hero, levels, reference, c);
        for (const id of allowed) {
            for (const g of [1, 2, 3]) {
                const key = `${id}_${g}`;
                const level = levels[key] ?? 0;
                if (level >= 10) continue;
                if (g <= points) {
                    const gain = (clickDamage(m, hero, { ...levels, [key]: level + 1 }, reference, c) / Math.max(now, 1e-9) - 1) / g;
                    if (!best || gain > best.gain) best = { key, gain, g };
                }
                break;
            }
        }
        if (!best || best.gain <= 0) return points;
        levels[best.key] = (levels[best.key] ?? 0) + 1;
        points -= best.g;
    }
};
const nextReference = (m, c, n) => (n < 10 ? minibossEnemy(m, c, n + 1) : bossEnemy(m, c));

// One new account: minutes at the end of each chapter, the first wall, the worst slack (limit / time), the levels bought
const run = (modelName, hero, rate, { chapters = CHAPTERS, allowed = GRADED } = {}) => {
    const m = MODELS[modelName];
    const levels = {};
    let points = 0;
    let t = 0;
    const marks = [];
    const slack = [];
    for (let c = 1; c <= chapters; c++) {
        for (let n = 1; n <= 10; n++) {
            for (let p = 0; p < m.phases; p++) t += killSeconds(m, hero, levels, phaseEnemy(m, c, n), rate, c) + 1.5;
            const s = minibossSeconds(m, hero, levels, c, n, rate);
            slack.push([`${c}-${n}`, m.minibossLimit / s]);
            if (s > m.minibossLimit) return { marks, wall: `${c}-${n}`, seconds: s, slack, levels };
            t += s + 1.5 * (ADD_BUFFS[c] ? 3 : 1);
            points = spend(m, hero, levels, points + 2, nextReference(m, c, n), allowed, c);
        }
        const s = killSeconds(m, hero, levels, bossEnemy(m, c), rate, c);
        slack.push([`${c}-chefe`, m.bossLimit / s]);
        if (s > m.bossLimit) return { marks, wall: `${c}-chefe`, seconds: s, slack, levels };
        t += s + 1.5;
        points = spend(m, hero, levels, points + 5, c < CHAPTERS ? minibossEnemy(m, c + 1, 1) : bossEnemy(m, c), allowed, c + 1);
        marks.push(t / 60);
    }
    return { marks, wall: null, slack, levels };
};

const pick = (marks) => [1, 3, 5, 10, 15].filter((c) => marks[c - 1] !== undefined).map((c) => `c${c} ${marks[c - 1].toFixed(1)}`).join('  ');
const show = (r) => `${pick(r.marks).padEnd(50)}${r.wall ? `parede ${r.wall} (${r.seconds === Infinity ? 'nunca' : `${r.seconds.toFixed(0)} s`})` : 'sem parede'}`;

if (process.argv[2] !== 'fit') {
    console.log(`Minutos ao fim dos capítulos 1 / 3 / 5 / 10 / 15 (build gulosa; ${process.env.KIT === '0' ? 'só talentos' : 'talentos + kit a partir do capítulo 6'})`);
    for (const model of ['antes', 'depois']) {
        for (const hero of Object.keys(HEROES)) {
            for (const rate of [6, 8, 10]) console.log(`${model.padEnd(6)} ${hero.padEnd(5)} ${String(rate).padStart(2)}/s  ${show(run(model, hero, rate))}`);
        }
    }

    console.log('\nBuild sem Dano direto de clique, 8/s');
    for (const model of ['antes', 'depois']) {
        for (const hero of Object.keys(HEROES)) console.log(`${model.padEnd(6)} ${hero.padEnd(5)}  ${show(run(model, hero, 8, { allowed: GRADED.filter((id) => id !== 'CLICK_FLAT_DAMAGE') }))}`);
    }

    console.log('\nCliques por segundo que o miniboss 1-1 pede com dano 1, sem talento');
    for (const model of ['antes', 'depois']) {
        const m = MODELS[model];
        const e = minibossEnemy(m, 1, 1);
        console.log(`${model.padEnd(6)} vida ${e.health}, limite ${e.limit} s: ${Object.keys(HEROES).map((hero) => `${hero} ${(e.health / clickDamage(m, hero, {}, e, 1) / e.limit).toFixed(2)}`).join(', ')}`);
    }

    console.log('\nFolga mínima (limite / tempo) a 6 cliques/s, por herói (depois)');
    for (const hero of Object.keys(HEROES)) {
        const r = run('depois', hero, 6);
        const worst = r.slack.reduce((a, b) => (b[1] < a[1] ? b : a));
        console.log(`${hero.padEnd(5)} pior ${worst[0]} folga ${worst[1].toFixed(2)}`);
    }

    console.log('\nGanho de dano por ponto contra o miniboss, build gulosa de Kael a 8/s no ponto indicado (depois)');
    for (const [label, c, n] of [['1-5', 1, 5], ['1-10', 1, 10], ['3-10', 3, 10], ['5-10', 5, 10], ['10-10', 10, 10]]) {
        const m = MODELS.depois;
        const levels = {};
        let left = 0;
        for (let cc = 1; cc <= c; cc++) {
            for (let nn = 1; nn <= 10 && (cc < c || nn < n); nn++) left = spend(m, 'kael', levels, left + 2, nextReference(m, cc, nn), GRADED, cc);
            if (cc < c) left = spend(m, 'kael', levels, left + 5, minibossEnemy(m, cc + 1, 1), GRADED, cc + 1);
        }
        const e = minibossEnemy(m, c, n);
        const now = clickDamage(m, 'kael', levels, e, c);
        const gains = ['CLICK_FLAT_DAMAGE', 'CLICK_DAMAGE', 'CRIT_CHANCE', 'CRIT_DAMAGE', 'COMBO'].map((id) => {
            const g = [1, 2, 3].find((grade) => (levels[`${id}_${grade}`] ?? 0) < 10);
            if (!g) return `${id} cheio`;
            const key = `${id}_${g}`;
            return `${id} G${g} ${((clickDamage(m, 'kael', { ...levels, [key]: (levels[key] ?? 0) + 1 }, e, c) / now - 1) * 100 / g).toFixed(1)}%`;
        });
        console.log(`${label}: ${gains.join(', ')}`);
    }

    console.log('\nNíveis comprados por Kael a 8/s ao fim dos capítulos 3 e 15 (depois)');
    console.log(JSON.stringify(run('depois', 'kael', 8, { chapters: 3 }).levels));
    console.log(JSON.stringify(run('depois', 'kael', 8).levels));
}

// ---- fit: how the tables were found (design.md § Simulation, step 2) ----
// For each stage, the largest phase monster health at which every starting hero, with the talents and kit it holds there, wins the miniboss
// fight (adds and affix included) in at most 90 % of the limit at 6 clicks per second; then the exponential B x g^(n-1), g from 1.00 to 1.80,
// with the largest total under it. The boss ceiling the same way.
if (process.argv[2] === 'fit') {
    const m = MODELS.depois;
    const state = Object.fromEntries(Object.keys(HEROES).map((h) => [h, { levels: {}, points: 0 }]));
    const largest = (fits) => { let lo = 1, hi = 1e9; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; } return lo; };
    for (let c = 1; c <= CHAPTERS; c++) {
        const ceiling = [];
        for (let n = 1; n <= 10; n++) {
            ceiling.push(Math.floor(Math.min(...Object.entries(state).map(([h, s]) => largest((phase) => minibossSeconds(m, h, s.levels, c, n, 6, phase) <= 0.9 * m.minibossLimit)))));
            for (const [h, s] of Object.entries(state)) s.points = spend(m, h, s.levels, s.points + 2, nextReference(m, c, n), GRADED, c);
        }
        const boss = Math.min(...Object.entries(state).map(([h, s]) => largest((health) => killSeconds(m, h, s.levels, bossEnemy(m, c, health), 6, c) <= 0.9 * m.bossLimit)));
        for (const [h, s] of Object.entries(state)) s.points = spend(m, h, s.levels, s.points + 5, c < CHAPTERS ? minibossEnemy(m, c + 1, 1) : bossEnemy(m, c), GRADED, c + 1);
        let best = null;
        for (let g = 1; g <= 1.8; g += 0.005) {
            const B = Math.min(...ceiling.map((v, i) => v / g ** i));
            const sum = ceiling.reduce((a, _, i) => a + B * g ** i, 0);
            if (!best || sum > best.sum) best = { g, B, sum };
        }
        const at104 = Math.min(...ceiling.map((v, i) => v / 1.04 ** i));
        console.log(`capítulo ${c}: teto ${JSON.stringify(ceiling)}, chefe até ${Math.floor(boss)}; melhor curva B=${best.B.toFixed(1)} g=${best.g.toFixed(3)}; com g=1.04 B=${at104.toFixed(1)}`);
    }
}
