import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Miniboss adds (spec miniboss-adds): the adds that guard a chapter 11 to 15 miniboss, the guarded defense, the end of the fight.
//  The auto click is switched off and the Phaser loop is put to sleep once the game has loaded: time moves only with advance(page, ms) and
//  every hit is a call of the scene (hitAt), so no real frame adds a tick (the pattern of heroTeamCombat.spec.js).
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

//  A monster of the payload: the defense and both legacy columns equal
const monsterOf = (element, defense = 0, critResistance = 0) => ({ element, defense, physicalDefense: defense, magicalDefense: defense, critResistance });

const ADD = { health: 30, defenseBuff: 30 };
//  Two stages: phase monsters of 10, a miniboss of `minibossHealth` with `defense`, its adds; the chapter boss 1000 (spec miniboss-adds)
const addsChapter = ({ adds = [ ADD, ADD ], defense = 49, minibossHealth = 100, element = 'FIRE' } = {}) => ({
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: monsterOf(element, 30, 30), bossDropRuleId: 3,
    stages: [ 1, 2 ].map((number) => ({
        number, phasesPerStage: 5, monsterHealth: 10, minibossHealth, minibossTimeLimitMs: 30_000,
        monster: monsterOf(element), miniboss: monsterOf(element, defense), monsterDropRuleId: 1, minibossDropRuleId: 2, adds
    }))
});

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const advance = (page, ms) => page.evaluate((delta) => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, delta), ms);

//  Stops the loop and puts the ally clock back at 1000 ms, as it stands when a monster appears
const freeze = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__;

    game.loop.sleep();
    game.scene.getScene('ClickerGame').allies.untilTickMs = 1000;
});
const wake = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.wake());

//  Logs in at chapter 11 stage 1 MINIBOSS (or `progress`), every hero owned with one blank card (`stars` adds a card of that many stars), Kael as
//  leader, the auto click off, and puts the loop to sleep unless `stop` is false. `definition: null` keeps the backend seed.
const startAdds = async (page, {
    definition = addsChapter(), progress = { chapter: 11, stage: 1, encounter: 'MINIBOSS', phase: 1 }, leader = 'kael', stars = {}, team, talents,
    autoClick = 'off', stop = true, roll, cleared = [ 5 ]
} = {}) => {
    const copies = {
        ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])),
        ...Object.fromEntries(Object.entries(stars).map(([ id, count ]) => [ `${id}:${count}`, 1 ]))
    };
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        ...(definition && { definition }),
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: { phase: 1, ...progress } },
        team: team ? { yan: team } : {},
        ...(talents && { talents: { yan: talents } })
    });

    await page.addInitScript((value) => localStorage.setItem('infinity-grove.auto-click', value), autoClick);

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await expect.poll(() => scene(page, '(s) => s.monster?.health ?? 0')).toBeGreaterThan(0);

    if (stop)
    {
        await freeze(page);
    }

    return handle;
};

const state = (page) => scene(page, '(s) => ({ main: s.monster?.health, adds: s.fight?.adds.map((a) => a.monster.health) ?? [], target: s.fight ? s.fight.nameOf(s.fight.target) : null, drawn: s.addParts?.size ?? 0, marker: s.marker ? [ s.marker.x, s.marker.y ] : null })');
const hitAt = (page, x, y, times = 1) => page.evaluate(([ px, py, n ]) => {
    const s = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    for (let i = 0; i < n; i++)
    {
        s.hitMonster({ x: px, y: py });
    }
}, [ x, y, times ]);
const outcomeCalls = (backend) => backend.calls.filter((call) => call.path === '/progress/outcome');

//  The add bodies are 110 x 125 rectangles; a click in their middle lands on them
const LACAIO_1 = [ 480, 360 ];
const LACAIO_2 = [ 480, 540 ];
const MINIBOSS = [ 670, 440 ];

test.describe('Miniboss adds', () => {
    test('a chapter 11 miniboss appears with two adds of 30 health and Defesa 90%', async ({ page }) => {
        await startAdds(page);

        expect(await state(page)).toMatchObject({ main: 100, adds: [ 30, 30 ], target: 'Miniboss', drawn: 2 });
        await expect(page.locator('.enemy-stats')).toHaveText('Fire  Defesa 90%  Crit res 0%');
        await expect(page.getByTestId('target-chip')).toHaveText('Alvo: Miniboss · HP 100/100');
        expect(await scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && o.text === "+30 de defesa").length')).toBe(2);
    });

    test('a click on the guarded miniboss deals 0.1, then 0.21 after one add died and 0.51 after both', async ({ page }) => {
        await startAdds(page);

        await hitAt(page, ...MINIBOSS);

        await expect(page.getByTestId('monster-hp')).toHaveText('HP 99.9/100');

        await hitAt(page, ...LACAIO_1, 30);

        await expect(page.locator('.enemy-stats')).toContainText('Defesa 79%');

        await hitAt(page, ...MINIBOSS);

        expect((await state(page)).main).toBeCloseTo(99.69, 5);

        await hitAt(page, ...LACAIO_2, 30);

        await expect(page.locator('.enemy-stats')).toContainText('Defesa 49%');

        await hitAt(page, ...MINIBOSS);

        expect((await state(page)).main).toBeCloseTo(99.18, 5);
    });

    test('a dead add fades out and never comes back', async ({ page }) => {
        await startAdds(page);

        await hitAt(page, ...LACAIO_1, 30);
        await wake(page);

        await expect.poll(async () => (await state(page)).drawn).toBe(1);

        await freeze(page);
        await advance(page, 5000);

        const after = await state(page);

        expect(after.adds[0]).toBe(0);
        expect(after.drawn).toBe(1);
    });

    test('an add death drops no coin and sends no report', async ({ page }) => {
        const backend = await startAdds(page);

        await hitAt(page, ...LACAIO_1, 30);

        expect((await state(page)).adds).toEqual([ 0, 30 ]);
        expect(outcomeCalls(backend)).toEqual([]);
        expect(await scene(page, '(s) => s.children.list.filter((o) => o.type === "Sprite" && o.texture.key.startsWith("coin_")).length')).toBe(0);
    });

    test('killing the miniboss with both adds alive wins once: stage 2 phase 1 and one CLEARED report', async ({ page }) => {
        const backend = await startAdds(page, { definition: addsChapter({ minibossHealth: 1 }) });

        await hitAt(page, ...MINIBOSS, 10);
        await wake(page);

        await expect(page.locator('.stage-hud')).toHaveText('Stage 2/2 Phase 1/5');
        await expect.poll(() => outcomeCalls(backend).length).toBe(1);
        expect(outcomeCalls(backend)[0].body).toMatchObject({ outcome: 'CLEARED', encounter: 'MINIBOSS', chapter: 11 });

        const after = await state(page);

        expect(after.drawn).toBe(0);
        expect(after.marker).toBeNull();
        expect(outcomeCalls(backend)).toHaveLength(1);
    });

    test('the countdown fails the fight after both adds died: phase 5 returns and one FAILED report', async ({ page }) => {
        test.setTimeout(120_000);
        const backend = await startAdds(page);

        await hitAt(page, ...LACAIO_1, 30);
        await hitAt(page, ...LACAIO_2, 30);

        expect((await state(page)).adds).toEqual([ 0, 0 ]);

        await advance(page, 30_000);
        await wake(page);

        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/2 Phase 5/5');
        //  A FAILED report waits for the next report tick (a few seconds of real time); a CLEARED one goes at once
        await expect.poll(() => outcomeCalls(backend).length, { timeout: 25_000 }).toBe(1);
        expect(outcomeCalls(backend)[0].body).toMatchObject({ outcome: 'FAILED', encounter: 'MINIBOSS', chapter: 11 });
        expect(outcomeCalls(backend)).toHaveLength(1);
    });

    test('the countdown with both adds alive removes them at once', async ({ page }) => {
        await startAdds(page);

        await advance(page, 30_000);

        const after = await state(page);

        expect(after.drawn).toBe(0);
        expect(after.marker).toBeNull();
        await expect(page.getByTestId('target-chip')).toBeHidden();
    });

    test('leaving from the pause menu removes the adds and reports FAILED', async ({ page }) => {
        test.setTimeout(120_000);
        const backend = await startAdds(page);

        await scene(page, '(s) => { s.pauseFight(); s.leaveFight(); }');

        expect((await state(page)).drawn).toBe(0);

        await wake(page);

        //  A FAILED report waits for the next report tick (a few seconds of real time); a CLEARED one goes at once
        await expect.poll(() => outcomeCalls(backend).length, { timeout: 25_000 }).toBe(1);
        expect(outcomeCalls(backend)[0].body).toMatchObject({ outcome: 'FAILED', encounter: 'MINIBOSS', chapter: 11 });
    });

    test('a farm fight of the chapter 11 miniboss spawns its adds', async ({ page }) => {
        await startAdds(page, { progress: { chapter: 11, stage: 2, encounter: 'PHASE', phase: 1 } });

        expect((await state(page)).adds).toEqual([]);

        await scene(page, "(s) => s.startFarm({ kind: 'MINIBOSS', stage: 1 })");

        expect(await state(page)).toMatchObject({ main: 100, adds: [ 30, 30 ], target: 'Miniboss' });
        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1');
        await expect(page.locator('.enemy-stats')).toContainText('Defesa 90%');
    });

    test('a reload during the fight restarts the miniboss and both adds at full health with a full countdown', async ({ page }) => {
        test.setTimeout(120_000);
        await startAdds(page);

        await hitAt(page, ...LACAIO_1, 5);
        await hitAt(page, ...MINIBOSS);

        expect(await state(page)).toMatchObject({ main: 99.9, adds: [ 25, 30 ] });

        await page.reload();

        const menu = await openMainMenu(page, { state: 'welcome' });

        await menu.canvas.click();
        await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
        await expect.poll(() => scene(page, '(s) => s.monster?.health ?? 0')).toBeGreaterThan(0);
        await freeze(page);

        expect(await state(page)).toMatchObject({ main: 100, adds: [ 30, 30 ], drawn: 2 });
        await expect(page.locator('.boss-timer')).toHaveText('Time: 30');
    });

    test('a chapter 1 miniboss has no adds, no marker and no target chip', async ({ page }) => {
        await startAdds(page, { definition: null, progress: { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 } });

        const after = await state(page);

        expect(after.adds).toEqual([]);
        expect(after.drawn).toBe(0);
        expect(after.marker).toBeNull();
        await expect(page.getByTestId('target-chip')).toBeHidden();
        await expect(page.locator('.enemy-stats')).toHaveText('Fire  Defesa 11%  Crit res 12%');
    });

    test('a stage with an invalid add spawns only the valid one', async ({ page }) => {
        await startAdds(page, { definition: addsChapter({ adds: [ { health: 0, defenseBuff: 30 }, ADD ] }) });

        expect((await state(page)).adds).toEqual([ 30 ]);
        await expect(page.locator('.enemy-stats')).toContainText('Defesa 79%');
    });

    test('the guarded chapter 15 miniboss stays at Defesa 90% with one add of 50 alive', async ({ page }) => {
        const fifty = { health: 30, defenseBuff: 50 };

        await startAdds(page, { definition: addsChapter({ defense: 61, adds: [ fifty, fifty ] }) });

        await expect(page.locator('.enemy-stats')).toContainText('Defesa 90%');

        await hitAt(page, ...LACAIO_1, 30);

        expect((await state(page)).adds).toEqual([ 0, 30 ]);
        await expect(page.locator('.enemy-stats')).toContainText('Defesa 90%');

        await hitAt(page, ...LACAIO_2, 30);

        expect((await state(page)).adds).toEqual([ 0, 0 ]);
        await expect(page.locator('.enemy-stats')).toContainText('Defesa 61%');
    });
});
