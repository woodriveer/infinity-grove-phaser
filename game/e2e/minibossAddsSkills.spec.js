import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Miniboss skills (spec miniboss-adds): every damage skill and debuff lands on every living monster, adds first, then the miniboss.
//  The auto click is switched off while the game loads and the Phaser loop is put to sleep: time moves only with advance(page, ms) and every
//  hit is a call of the scene, so no real frame adds a tick (the pattern of heroTeamCombat.spec.js).
//  Every scenario uses a 3-star leader (click base 1.4, critical damage x2.5, the default roll 0.99 never crits, every skill level 1). The monsters
//  take the leader's element so the multiplier is 1. The miniboss has defense 50: 90 with both adds of 20 alive (under the 100 where a hit deals 0),
//  50 with none.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

//  A monster of the payload: the defense and both legacy columns equal
const monsterOf = (element, defense = 0, critResistance = 0) => ({ element, defense, critResistance });

const ADD = { health: 30, defenseBuff: 20 };
const BIG = { health: 200, defenseBuff: 20 };
//  The add of 30 that the second arrow and the Tempestade scenarios keep alive next to a dying add of 30: 50 + 30 + 30 = 110 while both live
const BIG_30 = { health: 200, defenseBuff: 30 };
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
//  leader, and puts the loop to sleep unless `stop` is false. The auto click is off while the game loads, so no real frame hits before the sleep.
//  `definition: null` keeps the backend seed.
const startAdds = async (page, {
    definition = addsChapter(), progress = { chapter: 11, stage: 1, encounter: 'MINIBOSS', phase: 1 }, leader = 'kael', stars = {}, team, talents,
    stop = true, roll, cleared = [ 5 ]
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

    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

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

//  The numbers of clicks, skills and ticks on screen, oldest first
const numbers = (page) => scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && [ "#ffd35c", "#ff8a1f", "#7fd4ff" ].includes(o.style.color)).map((o) => ({ text: o.text, x: o.x, y: o.y, color: o.style.color }))');
const lastNumbers = async (page, count) => (await numbers(page)).slice(-count);
const useSkill = (page, slot) => page.evaluate((number) => window.__PHASER_GAME__.scene.getScene('ClickerGame').useSkill(number), slot);

const LACAIO_1 = [ 480, 360 ];
const MINIBOSS = [ 670, 440 ];
const MINIBOSS_NUMBER_Y = 273;
const NORMAL = '#ffd35c';
const CRITICAL = '#ff8a1f';

//  The scenario of a leader: a 3-star card, and a chapter whose monsters take the leader's element
const lead = (id, element, { adds = [ ADD, ADD ], minibossHealth } = {}) => ({
    leader: id, stars: { [id]: 3 }, definition: addsChapter({ defense: 50, element, adds, ...(minibossHealth && { minibossHealth }) })
});
//  The numbers one skill puts on the monsters: add 1, add 2, the miniboss
const shown = (texts, color = NORMAL) => [
    { text: texts[0], x: 480, y: 360, color }, { text: texts[1], x: 480, y: 540, color }, { text: texts[2], x: 670, y: MINIBOSS_NUMBER_Y, color }
];

test.describe('Miniboss skills', () => {
    test('Chuva de Meteoros shows 35 on each add and 3.5 on the miniboss', async ({ page }) => {
        await startAdds(page, lead('orina', 'WATER', { adds: [ BIG, BIG ] }));

        await useSkill(page, 3);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '35', '35', '3.5' ]));
    });

    test('Chuva de Meteoros kills both adds first and hits the miniboss at defense 50 for 17.5', async ({ page }) => {
        await startAdds(page, lead('orina', 'WATER', { minibossHealth: 200 }));

        await useSkill(page, 3);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '35', '35', '17.5' ]));
        expect((await state(page)).adds).toEqual([ 0, 0 ]);
        expect((await state(page)).main).toBeCloseTo(182.5, 5);
        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 50%  Seu crítico: 40%');
    });

    test('a skill that kills both adds and the miniboss wins once', async ({ page }) => {
        const backend = await startAdds(page, lead('orina', 'WATER', { minibossHealth: 10 }));

        await useSkill(page, 3);
        await wake(page);

        await expect(page.locator('.stage-hud')).toHaveText('Stage 2/2 Phase 1/5');
        await expect.poll(() => outcomeCalls(backend).length).toBe(1);
        expect(outcomeCalls(backend)[0].body).toMatchObject({ outcome: 'CLEARED', encounter: 'MINIBOSS', chapter: 11 });
        expect(outcomeCalls(backend)).toHaveLength(1);
    });

    test('Flecha Dupla shows six numbers', async ({ page }) => {
        await startAdds(page, lead('lyra', 'NATURE', { adds: [ BIG, BIG ] }));

        const before = (await numbers(page)).length;

        await useSkill(page, 1);

        const after = await numbers(page);

        expect(after.length - before).toBe(6);
        expect(after.slice(-6).map(({ text, y }) => [ text, y ])).toEqual([
            [ '4.2', 360 ], [ '4.2', 360 ], [ '4.2', 540 ], [ '4.2', 540 ], [ '0.4', MINIBOSS_NUMBER_Y ], [ '0.4', MINIBOSS_NUMBER_Y ]
        ]);
        //  The two arrows of a monster stand on its column: the adds at x 480 or a little right of it, the miniboss at x 670 or right of it
        expect(after.slice(-6).map(({ x }) => x < 600)).toEqual([ true, true, true, true, false, false ]);
    });

    test('Flecha Dupla: the second arrow does not land on an add that the first one killed', async ({ page }) => {
        await startAdds(page, lead('lyra', 'NATURE', { adds: [ { health: 4, defenseBuff: 30 }, BIG_30 ] }));

        const before = (await numbers(page)).length;

        await useSkill(page, 1);

        const after = await numbers(page);

        //  Lacaio 1 (4 health) takes one arrow of 4.2; Lacaio 2 takes two; the miniboss, now guarded by one add (50 + 30 = 80), takes two of 0.84
        expect(after.length - before).toBe(5);
        expect((await state(page)).adds[0]).toBe(0);
        expect(after.slice(-5).map(({ text, y }) => [ text, y ])).toEqual([
            [ '4.2', 360 ], [ '4.2', 540 ], [ '4.2', 540 ], [ '0.8', MINIBOSS_NUMBER_Y ], [ '0.8', MINIBOSS_NUMBER_Y ]
        ]);
    });

    test('Tiro Preciso lands a critical 105 on each add and 10.5 on the miniboss', async ({ page }) => {
        await startAdds(page, lead('lyra', 'NATURE', { adds: [ BIG, BIG ] }));

        await useSkill(page, 2);
        await advance(page, 2000);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '105', '105', '10.5' ], CRITICAL));
    });

    test('Tempestade Arcana ticks 2.8 on each add and 0.3 on the miniboss each second', async ({ page }) => {
        await startAdds(page, lead('orina', 'WATER', { adds: [ BIG, BIG ] }));

        await useSkill(page, 2);
        await advance(page, 1000);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '2.8', '2.8', '0.3' ]));
    });

    test('a dead add loses only its own Tempestade Arcana: later ticks land on the other add and the miniboss', async ({ page }) => {
        await startAdds(page, lead('orina', 'WATER', { adds: [ { health: 3, defenseBuff: 30 }, BIG_30 ] }));

        await useSkill(page, 2);
        await advance(page, 1000);

        //  Tick 1 meets the miniboss at 50 + 30 + 30 = 110, 100 or more: it deals 0
        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '2.8', '2.8', '0' ]));

        //  Ticks 2 and 3 come in one frame of 2000 ms. Tick 2 kills the add (0.2 left) and its miniboss hit already meets 50 + 30 = 80
        //  (2.8 x 0.2 = 0.56); tick 3 lands on the other add and the miniboss only
        const before = (await numbers(page)).length;

        await advance(page, 2000);

        const after = await numbers(page);

        expect((await state(page)).adds[0]).toBe(0);
        expect(after.length - before).toBe(5);
        expect(after.slice(-5)).toMatchObject([
            { text: '2.8', x: 480, y: 360 }, { text: '2.8', x: 480, y: 540 }, { text: '0.6', x: 670, y: MINIBOSS_NUMBER_Y },
            { text: '2.8', x: 480, y: 540 }, { text: '0.6', x: 670, y: MINIBOSS_NUMBER_Y }
        ]);
    });

    test('Bomba de Veneno puts a stack on every monster', async ({ page }) => {
        await startAdds(page, lead('vex', 'DARKNESS', { adds: [ BIG, BIG ] }));

        await useSkill(page, 1);
        await hitAt(page, ...LACAIO_1);

        await expect(page.locator('.effect-tags')).toContainText('Bomba de Veneno x1');

        await advance(page, 1000);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '1.4', '1.4', '0.1' ]));
    });

    test('Golpe Sangrento hits each monster for 8.4 and bleeds each for 2.1', async ({ page }) => {
        await startAdds(page, lead('vex', 'DARKNESS', { adds: [ BIG, BIG ] }));

        await useSkill(page, 3);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '8.4', '8.4', '0.8' ]));

        await advance(page, 1000);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '2.1', '2.1', '0.2' ]));
    });

    test('Brado Aterrador lowers every monster: a click on the guarded miniboss deals 0.56', async ({ page }) => {
        await startAdds(page, lead('kael', 'FIRE'));

        await useSkill(page, 3);
        await hitAt(page, ...MINIBOSS);

        //  Guarded 90 - 30 = 60: 1.4 x 0.4
        expect((await state(page)).main).toBeCloseTo(99.44, 5);
        await expect(page.locator('.effect-tags')).toContainText('Brado Aterrador');

        await hitAt(page, ...LACAIO_1);

        expect((await state(page)).target).toBe('Lacaio 1');
        await expect(page.locator('.effect-tags')).toContainText('Brado Aterrador');
    });

    test('Prisão de Espinhos goes on every monster: a click on an add deals 1.75', async ({ page }) => {
        await startAdds(page, lead('orina', 'WATER', { adds: [ BIG, BIG ] }));

        await page.evaluate(() => {
            const s = window.__PHASER_GAME__.scene.getScene('ClickerGame');

            s.useSkill(1);
            s.hitMonster({ x: 480, y: 360 });
        });

        expect((await state(page)).adds[0]).toBeCloseTo(198.25, 5);
    });

    test('Corte Dimensional lands 21 on each add and 7.8 on the miniboss', async ({ page }) => {
        await startAdds(page, lead('kael', 'FIRE'));

        await useSkill(page, 1);

        //  30 % armor pierce on defense 90 leaves 21 x (1 - 0.9 x 0.7) = 7.77
        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '21', '21', '7.8' ]));
    });

    test('Investida do Baluarte lands 5.6 on each add and 0.6 on the miniboss', async ({ page }) => {
        await startAdds(page, lead('kael', 'FIRE'));

        await useSkill(page, 2);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '5.6', '5.6', '0.6' ]));
    });

    test('Luz Divina lands 11.2 on each add and 1.1 on the miniboss', async ({ page }) => {
        await startAdds(page, lead('seraphine', 'LIGHT'));

        await useSkill(page, 2);

        expect(await lastNumbers(page, 3)).toMatchObject(shown([ '11.2', '11.2', '1.1' ]));
    });

    test('a skill in a chapter 1 fight shows one number at x 670 as before', async ({ page }) => {
        await startAdds(page, { leader: 'orina', stars: { orina: 3 }, definition: null, progress: { chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 } });

        const before = (await numbers(page)).length;

        await useSkill(page, 3);

        const after = await numbers(page);

        expect(after.length - before).toBe(1);
        expect(after.at(-1).x).toBe(670);
    });
});
