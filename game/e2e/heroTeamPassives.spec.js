import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Hero team (spec hero-team): the passives of the allies on the real scene and screens. The player owns one blank card of each of the five
//  heroes; `stars` adds a card of that many stars. The auto click is switched off (chapter 5 opens it). Where a number is read, the Phaser
//  loop is stopped once the game has loaded; team(page) lands the team's part of a click without the click; a click scenario starts with `talents: {}`-like
//  defaults so the combo adds nothing, and the roll of the click is set with `roll`.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const ELEMENT_OF = { kael: 'FIRE', lyra: 'NATURE', orina: 'WATER', seraphine: 'LIGHT', vex: 'DARKNESS' };
const CRITICAL_COLOR = '#ff8a1f';

//  A monster of the new payload: the defense and both legacy columns equal
const monsterOf = (element, defense = 0, critResistance = 0) => ({ element, defense, critResistance });

//  `stageCount` stages of the same monster; phase monsters have `health`, minibosses `minibossHealth`, the chapter boss `bossHealth`
const chapter = (monster, { health = 1000, minibossHealth = health, bossHealth = 1000, stageCount = 1 } = {}) => ({
    bossHealth,
    bossTimeLimitMs: 60_000,
    boss: monster,
    bossDropRuleId: 3,
    stages: Array.from({ length: stageCount }, (_, index) => ({
        number: index + 1, phasesPerStage: 5, monsterHealth: health, minibossHealth, minibossTimeLimitMs: 30_000, monster, miniboss: monster,
        monsterDropRuleId: 1, minibossDropRuleId: 2
    }))
});

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const health = (page) => scene(page, '(s) => s.monster?.health');
const allyTexts = (page) => scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "#7fd4ff").map((o) => o.text)');
const criticalTexts = (page) => scene(page, `(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "${CRITICAL_COLOR}").map((o) => o.text)`);
const dealt = async (page, from = 1000) => from - await health(page);
const strike = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').strike(670));

//  Stops the loop
const freeze = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
const wake = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.wake());
//  The team's part of a click without the click: lands it on the target, then the kill path, as strike does
const team = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.teamStrike(game.currentTarget());
    game.afterDamage();
});

const startTeam = async (page, {
    chapter: campaignChapter = 5, stage = 1, encounter = 'PHASE', phase = 1, completed, cleared = [ 5 ], team, leader = 'kael', stars = {}, equipment, talents,
    monster = monsterOf(ELEMENT_OF[leader]), sizes, definition, roll, stop = true
} = {}) => {
    const copies = {
        ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])),
        ...Object.fromEntries(Object.entries(stars).map(([ id, count ]) => [ `${id}:${count}`, 1 ]))
    };

    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: definition ?? chapter(monster, sizes),
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: { chapter: campaignChapter, stage, encounter, phase, ...(completed && { completed }) } },
        team: team ? { yan: team } : {},
        ...(equipment && { equipment: { yan: equipment } }),
        ...(talents && { talents: { yan: talents } })
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    if (stop)
    {
        await freeze(page);
        await expect.poll(() => health(page)).toBeGreaterThan(0);
    }
};

//  A boss that appears while the heroes are loaded gets the passives of the team: the game starts at the last phase of the stage, and the
//  test plays on (a click on a living monster at every frame) until a countdown longer than `above` ms shows, on a monster other than the
//  last one reached when `other` is set, then stops the loop on it so the timer reads its first second
const reachBoss = (page, { above = 0, other = false } = {}) => page.waitForFunction(({ limit, another }) => {
    const game = window.__PHASER_GAME__;
    const current = game.scene.getScene('ClickerGame');

    if (current?.countdown && current.countdown.limitMs > limit && (!another || current.monster !== window.__bossSeen))
    {
        game.loop.sleep();
        window.__bossSeen = current.monster;

        return true;
    }

    if (current?.monster && !current.monster.dead)
    {
        current.strike(670);
    }

    return false;
}, { limit: above, another: other }, { polling: 'raf', timeout: 30_000 });

const timer = (page) => page.locator('.boss-timer');
const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };
const KAEL_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'kael', null, null, null ] };
//  The monsters of the phases die at once, the bosses stay: a boss can be read before it dies
const QUICK_PHASES = { health: 1, minibossHealth: 1000, bossHealth: 1000 };
//  Two stages: the first miniboss dies to 3 clicks, so the second stage's miniboss comes after five more phases of 1 health
const TWO_STAGES = { health: 1, minibossHealth: 3, bossHealth: 1000, stageCount: 2 };

test.describe('Hero team: passives', () => {
    test('Kael as an ally starts a 30 s miniboss at Tempo: 35s', async ({ page }) => {
        await startTeam(page, { leader: 'lyra', team: KAEL_IN_SLOT_1, phase: 5, sizes: QUICK_PHASES, stop: false });
        await reachBoss(page);

        await expect(timer(page)).toHaveText('Tempo: 35s');
    });

    test('Kael as an ally with MINIBOSS_TIME 4 starts it at Tempo: 39s', async ({ page }) => {
        await startTeam(page, { leader: 'lyra', team: KAEL_IN_SLOT_1, phase: 5, sizes: QUICK_PHASES, talents: { MINIBOSS_TIME: 2 }, stop: false });
        await reachBoss(page);

        await expect(timer(page)).toHaveText('Tempo: 39s');
    });

    test('Kael as an ally starts the chapter boss at Tempo: 65s', async ({ page }) => {
        await startTeam(page, { leader: 'lyra', team: KAEL_IN_SLOT_1, phase: 5, sizes: { ...QUICK_PHASES, minibossHealth: 1 }, stop: false });
        //  The miniboss (limit 35 s) dies first; the chapter boss is the countdown above 40 s
        await reachBoss(page, { above: 40_000 });

        await expect(timer(page)).toHaveText('Tempo: 65s');
    });

    test('Lyra as an ally makes a roll of 15 a critical click, and her team hit adds 2', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        await startTeam(page, { team: LYRA_IN_SLOT_1, roll: 0.15 });
        await strike(page);

        expect(await dealt(page)).toBeCloseTo(4, 5);
        expect(await criticalTexts(page)).toEqual([ '2' ]);

        //  Without Lyra in the team the same click is a plain 1
        const context = await browser.newContext();
        const other = await context.newPage();

        await startTeam(other, { roll: 0.15 });
        await strike(other);

        expect(await dealt(other)).toBeCloseTo(1, 5);
        expect(await criticalTexts(other)).toEqual([]);
        await context.close();
    });

    test('Orina as an ally shows Defesa 25% on a monster of defense 40 and a click deals 0.75 plus her team hit 1.5', async ({ page }) => {
        await startTeam(page, { team: { boughtSlots: 1, allies: [ 'orina', null, null, null ] }, monster: monsterOf('FIRE', 40) });

        await expect(page.locator('.enemy-stats [data-stat="defense"]')).toHaveText('Defesa 25%');

        await strike(page);

        expect(await dealt(page)).toBeCloseTo(2.25, 5);
    });

    test('Orina as an ally on a monster of defense 10 shows Defesa 0%', async ({ page }) => {
        await startTeam(page, { team: { boughtSlots: 1, allies: [ 'orina', null, null, null ] }, monster: monsterOf('FIRE', 10) });

        await expect(page.locator('.enemy-stats [data-stat="defense"]')).toHaveText('Defesa 0%');

        await strike(page);

        expect(await dealt(page)).toBeCloseTo(3, 5);
    });

    test('Vex as an ally shows Seu crítico: 10% on a monster of critical resistance 5 and a roll of 8 is critical', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        await startTeam(page, { team: { boughtSlots: 1, allies: [ 'vex', null, null, null ] }, monster: monsterOf('FIRE', 0, 5), roll: 0.08 });

        await expect(page.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 10%');

        await strike(page);

        expect(await dealt(page)).toBeCloseTo(4, 5);

        //  Without Vex the chance is 10 - 5 = 5: the same roll of 8 is a plain click
        const context = await browser.newContext();
        const other = await context.newPage();

        await startTeam(other, { monster: monsterOf('FIRE', 0, 5), roll: 0.08 });
        await expect(other.locator('.enemy-stats [data-stat="crit"]')).toHaveText('Seu crítico: 5%');
        await strike(other);

        expect(await dealt(other)).toBeCloseTo(1, 5);
        await context.close();
    });

    test('Seraphine and Lyra as allies deal 5 per team strike', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6 ], team: { boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] } });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(5, 5);
        expect(await allyTexts(page)).toEqual([ '5' ]);
    });

    test('a hero that leads brings no passive', async ({ page }) => {
        await startTeam(page, { leader: 'kael', team: LYRA_IN_SLOT_1, phase: 5, sizes: QUICK_PHASES, stop: false });
        await reachBoss(page);

        await expect(timer(page)).toHaveText('Tempo: 30s');
    });

    test('below chapter 5 no passive applies', async ({ page }) => {
        await startTeam(page, { chapter: 4, cleared: [ 5 ], leader: 'lyra', team: KAEL_IN_SLOT_1, phase: 5, sizes: QUICK_PHASES, stop: false });
        await reachBoss(page);

        await expect(timer(page)).toHaveText('Tempo: 30s');
    });

    test('a team change keeps the running countdown and applies to the next boss', async ({ page }) => {
        await startTeam(page, { leader: 'lyra', team: KAEL_IN_SLOT_1, phase: 5, sizes: TWO_STAGES, stop: false });
        await reachBoss(page);
        await expect(timer(page)).toHaveText('Tempo: 35s');

        //  The loop is stopped on the countdown: Kael leaves the team while it runs
        await page.getByTestId('hud-team').click();
        await page.getByTestId('team-slot-1').click();
        await page.getByTestId('team-remove').click();
        await expect(page.getByTestId('team-slot-1')).toHaveAttribute('data-state', 'empty');
        await page.getByTestId('hero-close').click();

        //  Not 30: the countdown that runs keeps its 35 s
        await expect(timer(page)).toHaveText('Tempo: 35s');
        expect(await scene(page, '(s) => s.countdown.limitMs')).toBe(35_000);

        //  The first miniboss dies to clicks, and the miniboss of stage 2 comes without Kael
        await wake(page);
        await reachBoss(page, { other: true });

        expect(await scene(page, '(s) => s.countdown.limitMs')).toBe(30_000);
        await expect(timer(page)).toHaveText('Tempo: 30s');
    });

    test('the attribute panel counts the passives', async ({ page }) => {
        await startTeam(page, {
            cleared: [ 5, 6, 7, 8 ], leader: 'seraphine', team: { boughtSlots: 4, allies: [ 'lyra', 'kael', 'orina', 'vex' ] }
        });

        await page.getByTestId('hud-equipment').click();
        await expect(page.getByTestId('leader-stats')).toBeVisible();

        await expect(page.getByTestId('stat-critChance')).toHaveText('Chance de crítico: 20%');
        await expect(page.getByTestId('stat-minibossTime')).toHaveText('Tempo extra de miniboss: 5s');
        await expect(page.getByTestId('stat-bossTime')).toHaveText('Tempo extra de chefe: 5s');
        await expect(page.getByTestId('stat-breakDefense')).toHaveText('Quebra de defesa: 15');
        await expect(page.getByTestId('stat-breakCrit')).toHaveText('Quebra de resistência a crítico: 15');
    });

    test('Kael as an ally starts a farm fight of a miniboss 5 s longer', async ({ page }) => {
        await startTeam(page, { completed: true, encounter: 'CHAPTER_BOSS', leader: 'lyra', team: KAEL_IN_SLOT_1, stop: false });

        await page.getByTestId('hud-farm').click();
        await page.getByTestId('farm-entry-miniboss-1').click();
        await freeze(page);

        await expect(timer(page)).toHaveText('Tempo: 35s');
    });
});
