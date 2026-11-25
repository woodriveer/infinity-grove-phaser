import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The reworked combat (spec talent-tree-rework): boss damage, the subtractive critical chance with its overflow, armor pierce, the chip
//  `Seu crítico`, Fúria crescente and the attribute panel. The leader is Kael (fire) against fire monsters, so an element is neutral and a
//  number is read as the change of the monster's health (L-091). The roll is fixed by `openMainMenu(page, { random })`, 0.99 unless a case names one.
const MONSTER_HEALTH = 1000;
const monsterOf = (defense = 0, critResistance = 0, element = 'FIRE') => ({ element, defense, physicalDefense: defense, magicalDefense: defense, critResistance });

//  Ten stages of the same three monsters: the phase monster, the miniboss and the chapter boss (the last encounter of stage 10)
const chapter = ({ monster, boss = monster, bossTimeLimitMs = 60_000 }) => ({
    bossHealth: MONSTER_HEALTH,
    bossTimeLimitMs,
    boss,
    stages: Array.from({ length: 10 }, (_, index) => ({
        number: index + 1, phasesPerStage: 5, monsterHealth: MONSTER_HEALTH, minibossHealth: MONSTER_HEALTH, minibossTimeLimitMs: 30_000, monster, miniboss: monster
    }))
});

const ring = (id, type, base, heroId = 'kael') => ({ id, slot: 'RING', rarity: 'RARE', refine: 0, affixes: [ { type, base } ], heroId });

//  `encounter`: 'PHASE' (stage 1) or 'CHAPTER_BOSS' (stage 10); `stars` of the leader's card; `cards` replaces the whole bag; `routes(page)` adds routes after the fake backend
const startGame = async (page, {
    monster = monsterOf(), boss, encounter = 'PHASE', leader = 'kael', stars = 0, cards, talents, talentPoints, equipment, team, roll, routes, chapterNumber = 1
} = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter({ monster, boss }),
        cards: { yan: { leader, copies: { [`${leader}:${stars}`]: 1 }, ...cards } },
        progress: { yan: { chapter: chapterNumber, stage: encounter === 'CHAPTER_BOSS' ? 10 : 1, encounter, phase: 1 } },
        ...(talents && { talents: { yan: talents } }),
        ...(talentPoints && { talentPoints: { yan: talentPoints } }),
        ...(equipment && { equipment: { yan: equipment } }),
        ...(team && { team: { yan: team } })
    });
    await routes?.(page);
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await expect.poll(() => health(page)).toBe(MONSTER_HEALTH);

    return menu;
};

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const dealt = async (page) => MONSTER_HEALTH - await health(page);

//  A talent the backend of before the rework still sends (the game drops or ignores it)
const olderTalent = (id, branch, label, unit, value) => ({
    id, baseId: id, grade: 1, branch, label, unit, perLevel: 3, maxLevel: 10, level: 10, value, nextCost: null, unlocked: true
});
const answerTalents = (list) => (page) => page.route('**/api/talents', (route) => (route.request().method() === 'GET'
    ? route.fulfill({ json: { talents: list, points: { earned: 10, spent: 10, available: 0 } } })
    : route.fallback()));

test.describe('Boss damage', () => {
    test('BOSS_DAMAGE 10 and BOSS_DAMAGE_G2 5 add 40 % to a click on the chapter boss: 1.4', async ({ page }) => {
        const menu = await startGame(page, { encounter: 'CHAPTER_BOSS', talents: { BOSS_DAMAGE: 10, BOSS_DAMAGE_G2: 5 } });

        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(1.4, 5);
    });

    test('the same talents leave a click on a phase monster at 1', async ({ page }) => {
        const menu = await startGame(page, { talents: { BOSS_DAMAGE: 10, BOSS_DAMAGE_G2: 5 } });

        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(1, 5);
    });

    test('the same talents add 40 % to a click on a miniboss: 1.4', async ({ page }) => {
        const menu = await startGame(page, { encounter: 'MINIBOSS', talents: { BOSS_DAMAGE: 10, BOSS_DAMAGE_G2: 5 } });

        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(1.4, 5);
    });

    test('a worn ring of BOSS_DAMAGE_PCT 28 makes the boss click 1.68', async ({ page }) => {
        const menu = await startGame(page, {
            encounter: 'CHAPTER_BOSS', talents: { BOSS_DAMAGE: 10, BOSS_DAMAGE_G2: 5 }, equipment: [ ring('r1', 'BOSS_DAMAGE_PCT', 28) ]
        });

        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(1.68, 5);
    });

    test('a skill hit on the chapter boss gets the boss damage: Corte Dimensional of a 1-star Kael deals 19.8 with BOSS_DAMAGE 10', async ({ page }) => {
        await startGame(page, { encounter: 'CHAPTER_BOSS', stars: 1, talents: { BOSS_DAMAGE: 10 } });
        await expect(page.getByTestId('skill-slot-1')).toHaveAttribute('data-unlocked', 'true');

        //  15 x 1.1 (the star) x 1.2 (the talent)
        await page.keyboard.press('1');

        await expect.poll(() => dealt(page)).toBeCloseTo(19.8, 5);
    });

    test('the chapter boss timer ignores a BOSS_TIME of an older backend: Time: 60', async ({ page }) => {
        await startGame(page, {
            encounter: 'CHAPTER_BOSS',
            routes: answerTalents([ olderTalent('BOSS_TIME', 'TIME', 'Tempo do chefe do capítulo', 's', 30) ])
        });

        //  The loop stops and the countdown starts over, so the text is the limit alone and not the limit minus the time the test took to load
        const limit = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.getScene('ClickerGame');

            game.loop.sleep();
            scene.countdown.elapsedMs = 0;
            scene.showCountdown();

            return scene.countdown.limitMs;
        });

        expect(limit).toBe(60_000);
        await expect(page.locator('.boss-timer')).toHaveText('Time: 60');
    });
});

test.describe('Critical chance minus critical resistance', () => {
    test('a 3-star Kael reads Seu crítico: 10% against resistance 30; a roll of 0.09 crits (3.5) and 0.10 does not (1.4)', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        const critical = await startGame(page, { stars: 3, monster: monsterOf(0, 30), roll: 0.09 });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');
        await critical.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(3.5, 5);

        const context = await browser.newContext();
        const other = await context.newPage();
        const plain = await startGame(other, { stars: 3, monster: monsterOf(0, 30), roll: 0.10 });

        await expect(other.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');
        await plain.canvas.click();

        await expect.poll(() => dealt(other)).toBeCloseTo(1.4, 5);
        await context.close();
    });

    test('a 9-star Kael with the three CRIT_CHANCE grades at 10 reads Seu crítico: 100% against 10 and deals 21.12', async ({ page }) => {
        //  C is 10 + 60 + 50 + 100 + 150 = 370; the multiplier is 2 + 2 (stars) + the overflow 260 / 100; the base is 1 + 2.2
        const menu = await startGame(page, { stars: 9, monster: monsterOf(0, 10), talents: { CRIT_CHANCE: 10, CRIT_CHANCE_G2: 10, CRIT_CHANCE_G3: 10 } });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 100%');
        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(21.12, 5);
    });

    test('the chip follows a talent upgrade: 10% then 15% after a CRIT_CHANCE level', async ({ page }) => {
        await startGame(page, { talentPoints: 1 });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');

        await page.getByTestId('hud-talents').click();
        await page.getByTestId('talent-CRIT_CHANCE').click();
        await page.getByTestId('talent-upgrade-CRIT_CHANCE').click();
        await expect(page.getByTestId('talent-level-CRIT_CHANCE')).toHaveText('Nível 1/10');
        await page.getByTestId('hero-close').click();

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 15%');
    });

    test('the chip follows a leader change: 10% for a blank Kael, 40% for a 3-star Lyra', async ({ page }) => {
        await startGame(page, { cards: { copies: { 'kael:0': 1, 'lyra:3': 1 } } });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');

        await page.getByTestId('hud-leader').click();
        await page.getByTestId('leader-entry-lyra').click();
        await expect(page.getByTestId('leader-entry-lyra')).toHaveClass(/is-current/);
        await page.getByTestId('hero-close').click();

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 40%');
    });

    //  Vex wears a ring of CRIT_CHANCE 55: C is 10 + 30 (three stars) + 55 = 95 against resistance 50, so E is 45; the 15 points of Bomba de Fumaça make it 60
    test('Bomba de Fumaça adds 15 points: 95 + 15 against resistance 50 makes a roll of 0.59 critical (3.5), and 1.4 before it', async ({ page }) => {
        const menu = await startGame(page, {
            leader: 'vex', stars: 3, monster: monsterOf(0, 50, 'DARKNESS'), equipment: [ ring('r1', 'CRIT_CHANCE', 55, 'vex') ], roll: 0.59
        });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 45%');
        await menu.canvas.click();
        await expect.poll(() => dealt(page)).toBeCloseTo(1.4, 5);

        await page.keyboard.press('2');
        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(1.4 + 3.5, 5);
    });

    test('Bomba de Fumaça leaves a roll of 0.60 plain against resistance 50 (E is 60): 1.4', async ({ page }) => {
        const menu = await startGame(page, {
            leader: 'vex', stars: 3, monster: monsterOf(0, 50, 'DARKNESS'), equipment: [ ring('r1', 'CRIT_CHANCE', 55, 'vex') ], roll: 0.60
        });

        await page.keyboard.press('2');
        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(1.4, 5);
    });

    test("Lyra's double click is forced critical and keeps the overflow: a chance of 120 lands two hits of 2.2", async ({ page }) => {
        const menu = await startGame(page, {
            leader: 'lyra', monster: monsterOf(0, 0, 'NATURE'), equipment: [ ring('r1', 'CRIT_CHANCE', 110, 'lyra') ], roll: 0.29
        });

        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(4.4, 5);
    });

    test('a CRIT_RESIST_BREAK of an older backend lowers nothing: Seu crítico: 0% against resistance 20', async ({ page }) => {
        await startGame(page, {
            monster: monsterOf(0, 20),
            routes: answerTalents([ olderTalent('CRIT_RESIST_BREAK', 'BREAK', 'Quebra de resistência a crítico', 'points', 20) ])
        });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 0%');
    });
});

test.describe('Armor pierce', () => {
    test('ARMOR_PIERCE 10 makes a click on defense 50 deal 0.55', async ({ page }) => {
        const menu = await startGame(page, { monster: monsterOf(50), talents: { ARMOR_PIERCE: 10 } });

        await expect(page.locator('.enemy-stats [data-stat="defense"]')).toHaveText('Defesa 50%');
        await menu.canvas.click();

        await expect.poll(() => dealt(page)).toBeCloseTo(0.55, 5);
    });
});

test.describe('Fúria crescente', () => {
    //  The clicks and the reads run in one call with no frame in between (the combo decays by the frame time), through the scene's pointer handler
    const clickTimes = (page, before, after) => page.evaluate(({ first, rest }) => {
        const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');
        const click = (times) => { for (let i = 0; i < times; i++) { scene.hitMonster({ x: 0, y: 0 }); } };

        click(first);

        const hud = document.querySelector('[data-testid="combo-hud"]').textContent;

        click(rest);

        return { hud, left: scene.monster.health };
    }, { first: before, rest: after });

    test('COMBO 10 and Fúria crescente 4: 3 clicks read Combo x3 · +15% and 11 clicks deal 13.75', async ({ page }) => {
        await startGame(page, { talents: { COMBO: 10, COMBO_FURY: 4 } });

        const result = await clickTimes(page, 3, 8);

        expect(result.hud).toBe('Combo x3 · +15%');
        //  11 clicks of 1, and the bonus of the clicks 2 to 11 is 5 + 10 + ... + 50 = 275 %
        expect(MONSTER_HEALTH - result.left).toBeCloseTo(13.75, 5);
    });

    test('without Fúria crescente 11 clicks under COMBO 10 deal 11.55', async ({ page }) => {
        await startGame(page, { talents: { COMBO: 10 } });

        const result = await clickTimes(page, 3, 8);

        expect(result.hud).toBe('Combo x3 · +3%');
        //  The bonus of the clicks 2 to 11 is 1 + 2 + ... + 10 = 55 %
        expect(MONSTER_HEALTH - result.left).toBeCloseTo(11.55, 5);
    });

    test('with COMBO 0 the combo HUD stays empty whatever COMBO_FURY', async ({ page }) => {
        await startGame(page, { talents: { COMBO_FURY: 4 } });

        const result = await clickTimes(page, 3, 0);

        expect(result.hud).toBe('');
    });
});

test.describe('Attribute panel', () => {
    const openEquipment = async (page) => {
        await page.getByTestId('hud-equipment').click();
        await expect(page.getByTestId('leader-stats')).toBeVisible();
    };

    test('reads Dano em chefes: 20%, Perfuração de armadura: 10%, Tempo extra de chefe: 0s and Quebra de resistência a crítico: 0', async ({ page }) => {
        await startGame(page, { talents: { BOSS_DAMAGE: 10, ARMOR_PIERCE: 10 } });
        await openEquipment(page);

        await expect(page.getByTestId('stat-bossDamage')).toHaveText('Dano em chefes: 20%');
        await expect(page.getByTestId('stat-armorPierce')).toHaveText('Perfuração de armadura: 10%');
        await expect(page.getByTestId('stat-bossTime')).toHaveText('Tempo extra de chefe: 0s');
        await expect(page.getByTestId('stat-breakCrit')).toHaveText('Quebra de resistência a crítico: 0');
    });

    test('reads Quebra de resistência a crítico: 15 with Vex as a fighting ally', async ({ page }) => {
        await startGame(page, {
            chapterNumber: 5,
            talents: { ARMOR_PIERCE: 10 },
            cards: { cleared: [ 5 ], copies: { 'kael:0': 1, 'vex:0': 1 } },
            team: { boughtSlots: 1, allies: [ 'vex', null, null, null ] }
        });
        await openEquipment(page);

        await expect(page.getByTestId('stat-breakCrit')).toHaveText('Quebra de resistência a crítico: 15');
        await expect(page.getByTestId('stat-armorPierce')).toHaveText('Perfuração de armadura: 10%');
    });

    test('reads Chance de crítico: 120% for a 3-star Lyra wearing a CRIT_CHANCE 80 ring', async ({ page }) => {
        await startGame(page, { leader: 'lyra', stars: 3, equipment: [ ring('r1', 'CRIT_CHANCE', 80, 'lyra') ] });
        await openEquipment(page);

        await expect(page.getByTestId('stat-critChance')).toHaveText('Chance de crítico: 120%');
    });
});
