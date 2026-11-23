import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Miniboss target (spec miniboss-adds): the click picks the target, the marker and the target chip follow it, the auto click and the allies hit it.
//  The auto click is switched off while the game loads and the Phaser loop is put to sleep: time moves only with advance(page, ms) and every
//  hit is a call of the scene (hitAt), so no real frame adds a tick (the pattern of heroTeamCombat.spec.js). `stop: false` keeps the loop awake
//  for the scenarios that click with the real mouse.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

//  A monster of the payload: the defense and both legacy columns equal
const monsterOf = (element, defense = 0, critResistance = 0) => ({ element, defense, physicalDefense: defense, magicalDefense: defense, critResistance });

const ADD = { health: 30, defenseBuff: 30 };
//  Two adds that guard the defense-49 miniboss up to 90 (49 + 21 + 20), under the 100 where a hit deals 0
const GUARD_90 = [ { health: 30, defenseBuff: 21 }, { health: 30, defenseBuff: 20 } ];
//  Two stages: phase monsters of 10, a miniboss of `minibossHealth` with `defense`, its adds; the chapter boss 1000 (spec miniboss-adds)
const addsChapter = ({ adds = [ ADD, ADD ], defense = 49, minibossHealth = 100, element = 'FIRE', monsterDefense = 0 } = {}) => ({
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: monsterOf(element, 30, 30), bossDropRuleId: 3,
    stages: [ 1, 2 ].map((number) => ({
        number, phasesPerStage: 5, monsterHealth: 10, minibossHealth, minibossTimeLimitMs: 30_000,
        monster: monsterOf(element, monsterDefense), miniboss: monsterOf(element, defense), monsterDropRuleId: 1, minibossDropRuleId: 2, adds
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

//  Logs in at chapter 11 stage 1 MINIBOSS (or `progress`), every hero owned with one blank card (`stars` adds a card of that many stars), Kael as
//  leader, and puts the loop to sleep unless `stop` is false. The auto click is off while the game loads, so no real frame hits before the sleep;
//  `autoClick: 'on'` switches it on afterwards, through the same scene method as the auto click window.
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

    if (autoClick === 'on')
    {
        await scene(page, '(s) => s.switchAutoClick(true)');
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

//  A real mouse click at scene px
const clickAt = async (page, x, y) => {
    const box = await page.locator('canvas').boundingBox();

    await page.mouse.click(box.x + (x * box.width) / 1024, box.y + (y * box.height) / 768);
};
//  The numbers of clicks, skills and ticks on screen, oldest first
const numbers = (page) => scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && [ "#ffd35c", "#ff8a1f", "#7fd4ff" ].includes(o.style.color)).map((o) => ({ text: o.text, x: o.x, y: o.y, color: o.style.color }))');
const lastNumber = async (page) => (await numbers(page)).at(-1);

const LACAIO_1 = [ 480, 360 ];
const LACAIO_2 = [ 480, 540 ];
const MINIBOSS = [ 670, 440 ];
const CRITICAL = '#ff8a1f';
const ALLY = '#7fd4ff';
//  Lyra in ally slot 1 hits for 2 (base 2 at defense 0); Vex adds -15 critical resistance only, so the defense of her hits stays the guarded one
const LYRA_ALLY = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };

test.describe('Miniboss target', () => {
    test('a real click on Lacaio 1 makes it the target and moves the marker over it', async ({ page }) => {
        test.setTimeout(120_000);
        await startAdds(page, { stop: false });

        await clickAt(page, ...LACAIO_1);

        await expect.poll(() => state(page)).toMatchObject({ target: 'Lacaio 1', adds: [ 29, 30 ], marker: [ 480, 253.5 ] });
        await expect(page.getByTestId('target-chip')).toHaveText('Alvo: Lacaio 1 · HP 29/30');
        await expect(page.locator('.enemy-stats')).toHaveText('Fire  Defesa 0%  Seu crítico: 10%');
    });

    test('a click on the miniboss makes it the target again', async ({ page }) => {
        await startAdds(page, { definition: addsChapter({ adds: GUARD_90 }) });

        await hitAt(page, ...LACAIO_1);

        expect((await state(page)).target).toBe('Lacaio 1');

        await hitAt(page, ...MINIBOSS);

        expect(await state(page)).toMatchObject({ target: 'Miniboss', marker: [ 670, 270 ] });
        await expect(page.getByTestId('target-chip')).toHaveText('Alvo: Miniboss · HP 99.9/100');
    });

    test('a click on Lacaio 2 moves the marker to (480, 438.5)', async ({ page }) => {
        await startAdds(page);

        await hitAt(page, ...LACAIO_2);

        expect(await state(page)).toMatchObject({ target: 'Lacaio 2', adds: [ 30, 29 ], marker: [ 480, 433.5 ] });
        await expect(page.getByTestId('target-chip')).toHaveText('Alvo: Lacaio 2 · HP 29/30');
    });

    test('a click on no monster hits the target with its number at x 480', async ({ page }) => {
        await startAdds(page);

        await hitAt(page, ...LACAIO_1);
        await hitAt(page, 100, 100);

        expect((await state(page)).adds).toEqual([ 28, 30 ]);
        expect(await lastNumber(page)).toMatchObject({ text: '1', x: 480, y: 360 });
    });

    test('a click where a dead add stood hits the target', async ({ page }) => {
        await startAdds(page);

        await hitAt(page, ...LACAIO_1, 30);

        expect(await state(page)).toMatchObject({ adds: [ 0, 30 ], target: 'Miniboss' });

        await hitAt(page, ...LACAIO_1);

        //  Lacaio 2 is alive, so the miniboss meets 49 + 30 = 79: a Base-1 hit deals 0.21
        expect((await state(page)).main).toBeCloseTo(99.79, 5);
    });

    test('the auto click hits the target add', async ({ page }) => {
        await startAdds(page, { autoClick: 'on' });

        await hitAt(page, ...LACAIO_1);
        await advance(page, 500);

        expect((await state(page)).adds).toEqual([ 28, 30 ]);
        expect((await state(page)).main).toBe(100);
        expect(await lastNumber(page)).toMatchObject({ x: 480, y: 360 });
    });

    test('the auto click moves on to the miniboss when the target add dies', async ({ page }) => {
        await startAdds(page, { definition: addsChapter({ adds: [ { health: 2, defenseBuff: 30 }, ADD ] }), autoClick: 'on' });

        await hitAt(page, ...LACAIO_1);
        await advance(page, 1000);

        //  The click left 1 health, the first auto click kills the add, the second lands on the miniboss at 49 + 30 = 79
        expect(await state(page)).toMatchObject({ adds: [ 0, 30 ], target: 'Miniboss' });
        expect((await state(page)).main).toBeCloseTo(99.79, 5);
    });

    test('an ally hits the guarded miniboss for 0.2 and the target add for 2', async ({ page }) => {
        await startAdds(page, { team: LYRA_ALLY, definition: addsChapter({ adds: GUARD_90 }) });

        await advance(page, 1000);

        expect((await state(page)).main).toBeCloseTo(99.8, 5);
        expect(await lastNumber(page)).toMatchObject({ text: '0.2', x: 740, color: ALLY });

        await hitAt(page, ...LACAIO_1);
        await advance(page, 1000);

        expect((await state(page)).adds).toEqual([ 27, 30 ]);
        expect(await lastNumber(page)).toMatchObject({ text: '2', x: 520, y: 360, color: ALLY });
    });

    //  The task wrote allies Lyra and Orina with 99.58 and 0.4, but Orina's Erosão Arcana takes 15 points off the defense of every hit (spec
    //  Facts, `monsterAfterBreak`): her hit would meet 79 - 15 = 64 and deal 0.72. Vex only lowers the critical resistance, so Lyra and Vex give
    //  the numbers of the spec rules: Lyra kills the add (2), then Vex hits the miniboss at 79 for 0.42.
    test('an ally tick that kills the target add lands its later hit on the miniboss', async ({ page }) => {
        await startAdds(page, {
            definition: addsChapter({ adds: [ { health: 2, defenseBuff: 30 }, ADD ] }),
            team: { boughtSlots: 2, allies: [ 'lyra', 'vex', null, null ] }
        });

        await hitAt(page, ...LACAIO_1);
        await advance(page, 1000);

        expect(await state(page)).toMatchObject({ adds: [ 0, 30 ], target: 'Miniboss' });
        expect((await state(page)).main).toBeCloseTo(99.58, 5);

        const allyNumbers = (await numbers(page)).filter(({ color }) => color === ALLY);

        expect(allyNumbers).toMatchObject([ { text: '2', x: 520, y: 360 }, { text: '0.4', x: 740, y: 273 } ]);
    });

    //  The adds carry the stats of the stage's phase monster (seeded with defense 0, so a fixture gives them defense 20 to make a break visible)
    test('Quebra de defesa 5 lowers the defense of an add: a click deals 0.85 on defense 20', async ({ page }) => {
        await startAdds(page, { definition: addsChapter({ monsterDefense: 20 }), talents: { PHYSICAL_BREAK: 5 } });

        await hitAt(page, ...LACAIO_1);

        expect((await state(page)).adds[0]).toBeCloseTo(29.15, 5);
        await expect(page.locator('.enemy-stats')).toHaveText('Fire  Defesa 15%  Seu crítico: 10%');
    });

    test('the Erosão Arcana of an Orina ally lowers the defense an ally hit meets on an add: two hits of 1.9 show 3.8', async ({ page }) => {
        await startAdds(page, { definition: addsChapter({ monsterDefense: 20 }), team: { boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] } });

        await hitAt(page, ...LACAIO_1);
        await advance(page, 1000);

        //  Lyra and Orina hit for 2 each on defense 20 - 15 = 5; the tick shows their sum at the add's ally number place
        expect(await lastNumber(page)).toMatchObject({ text: '3.8', x: 520, y: 360, color: ALLY });
    });

    test('a click on an add counts for the combo', async ({ page }) => {
        await startAdds(page, { talents: { COMBO: 10 } });

        await hitAt(page, ...LACAIO_1);

        await expect(page.getByTestId('combo-hud')).toHaveText('Combo x1 · +1%');

        await hitAt(page, ...MINIBOSS);

        await expect(page.getByTestId('combo-hud')).toHaveText('Combo x2 · +2%');
    });

    test('Lyra\'s double critical click lands both hits on the add', async ({ page }) => {
        await startAdds(page, { leader: 'lyra', roll: 0, definition: addsChapter({ element: 'NATURE' }) });

        await hitAt(page, 500, 380);

        expect((await state(page)).adds).toEqual([ 26, 30 ]);

        const [ first, second ] = (await numbers(page)).slice(-2);

        expect(first).toMatchObject({ text: '2', x: 500, y: 360, color: CRITICAL });
        expect(second).toMatchObject({ text: '2', x: 536, y: 360, color: CRITICAL });
    });

    test('no target change and no hit while the pause menu is open', async ({ page }) => {
        await startAdds(page);

        await scene(page, '(s) => s.pauseFight()');
        await hitAt(page, ...LACAIO_1);

        expect(await state(page)).toMatchObject({ adds: [ 30, 30 ], main: 100, target: 'Miniboss' });
    });

    test('the add bodies, bars and buff texts stand at the layout places', async ({ page }) => {
        await startAdds(page);

        const parts = await scene(page, `(s) => [ 1, 2 ].map((slot) => {
            const p = s.addParts.get(slot);
            const box = (o) => ({ x: o.x, y: o.y, width: o.width, height: o.height, color: o.fillColor, alpha: o.fillAlpha });

            return {
                body: box(p.body), back: box(p.back), fill: box(p.fill),
                label: { text: p.label.text, x: p.label.x, y: p.label.y, originX: p.label.originX, originY: p.label.originY, fontFamily: p.label.style.fontFamily,
                    fontStyle: p.label.style.fontStyle, fontSize: p.label.style.fontSize, color: p.label.style.color, stroke: p.label.style.stroke,
                    strokeThickness: p.label.style.strokeThickness }
            };
        })`);
        const bodyOf = (y) => ({ x: 480, y, width: 110, height: 125, color: 0xf5ead8, alpha: 0.35 });
        const barOf = (y, color) => ({ x: 430, y, width: 100, height: 8, color, alpha: 1 });
        const labelOf = (y) => ({ text: '+30 de defesa', x: 480, y, originX: 0.5, originY: 1, fontFamily: 'Figtree', fontStyle: '700', fontSize: '12px', color: '#ffffff', stroke: '#2a1408', strokeThickness: 3 });

        expect(parts[0]).toEqual({ body: bodyOf(360), back: barOf(279.5, 0x2a1410), fill: barOf(279.5, 0xc0392b), label: labelOf(276.5) });
        expect(parts[1]).toEqual({ body: bodyOf(540), back: barOf(459.5, 0x2a1410), fill: barOf(459.5, 0xc0392b), label: labelOf(456.5) });

        //  The gold marker is drawn under the damage numbers, over the miniboss at the start
        expect(await scene(page, '(s) => ({ color: s.marker.fillColor, depth: s.marker.depth, width: s.marker.getBounds().width, height: s.marker.getBounds().height })'))
            .toEqual({ color: 0xffd24a, depth: 0.9, width: 16, height: 10 });

        //  It points down: the two top corners 16 px apart, the tip 10 px below them, at (670, 275) over the miniboss's bar (top y 281)
        const tip = () => scene(page, '(s) => { const g = s.marker.geom; const b = s.marker.getBounds(); return { points: [ g.x1, g.y1, g.x2, g.y2, g.x3, g.y3 ], centerX: b.centerX, tipY: b.bottom }; }');

        expect(await tip()).toEqual({ points: [ 0, 0, 16, 0, 8, 10 ], centerX: 670, tipY: 275 });

        await hitAt(page, ...LACAIO_1);

        expect(await tip()).toMatchObject({ centerX: 480, tipY: 258.5 });

        await hitAt(page, ...LACAIO_2);

        expect(await tip()).toMatchObject({ centerX: 480, tipY: 438.5 });
    });

    test('the target chip is a gold-bordered 12 px chip and no enemy box row touches Lacaio 2', async ({ page }) => {
        await startAdds(page);

        //  The boxes in the 1024 x 768 scene, read in one step with the computed style of the chip and what its tokens resolve to
        const read = () => page.evaluate(() => {
            const canvas = document.querySelector('#game-container canvas').getBoundingClientRect();
            const toScene = (element) =>
            {
                const rect = element.getBoundingClientRect();

                return {
                    left: ((rect.x - canvas.x) * 1024) / canvas.width, right: ((rect.x + rect.width - canvas.x) * 1024) / canvas.width,
                    top: ((rect.y - canvas.y) * 768) / canvas.height, bottom: ((rect.y + rect.height - canvas.y) * 768) / canvas.height
                };
            };
            const chip = document.querySelector('[data-testid="target-chip"]');
            const style = getComputedStyle(chip);
            const probe = document.createElement('div');

            probe.style.cssText = 'color: var(--parchment-100); background-color: var(--chip-bg); border: 1px solid var(--gold-400); font-family: var(--font-body)';
            document.body.append(probe);

            const tokens = getComputedStyle(probe);
            const resolved = { color: tokens.color, background: tokens.backgroundColor, border: tokens.borderTopColor, fontFamily: tokens.fontFamily };

            probe.remove();

            return {
                css: {
                    fontSize: style.fontSize, fontWeight: style.fontWeight, borderTopWidth: style.borderTopWidth, borderTopStyle: style.borderTopStyle,
                    borderTopColor: style.borderTopColor, borderRadius: style.borderTopLeftRadius, paddingTop: style.paddingTop, paddingRight: style.paddingRight,
                    paddingBottom: style.paddingBottom, paddingLeft: style.paddingLeft, fontFamily: style.fontFamily, color: style.color, background: style.backgroundColor
                },
                resolved,
                boxes: { chip: toScene(chip), weak: toScene(document.querySelector('[data-testid="weak-chip"]')), stats: toScene(document.querySelector('.enemy-stats')) }
            };
        });
        const clear = (box) => box.left >= 535 || box.right <= 425 || box.bottom <= 477.5 || box.top >= 602.5;

        const forMiniboss = await read();

        expect(await page.getByTestId('target-chip').textContent()).toBe('Alvo: Miniboss · HP 100/100');
        expect(forMiniboss.css).toMatchObject({
            fontSize: '12px', fontWeight: '700', borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: 'rgb(224, 180, 90)', borderRadius: '999px',
            paddingTop: '3px', paddingRight: '10px', paddingBottom: '3px', paddingLeft: '10px'
        });
        expect(forMiniboss.css.fontFamily).toBe(forMiniboss.resolved.fontFamily);
        expect(forMiniboss.css.fontFamily).toContain('Figtree');
        expect(forMiniboss.css.color).toBe(forMiniboss.resolved.color);
        expect(forMiniboss.css.background).toBe(forMiniboss.resolved.background);
        expect(forMiniboss.css.borderTopColor).toBe(forMiniboss.resolved.border);

        await hitAt(page, ...LACAIO_2);

        const forLacaio2 = await read();

        expect(await page.getByTestId('target-chip').textContent()).toBe('Alvo: Lacaio 2 · HP 29/30');

        for (const { boxes } of [ forMiniboss, forLacaio2 ])
        {
            expect(boxes.chip.bottom - boxes.chip.top).toBeGreaterThan(0);
            expect(clear(boxes.chip), `target chip ${JSON.stringify(boxes.chip)}`).toBe(true);
            expect(clear(boxes.weak), `weak chip ${JSON.stringify(boxes.weak)}`).toBe(true);
            expect(clear(boxes.stats), `enemy stats ${JSON.stringify(boxes.stats)}`).toBe(true);
            expect(boxes.stats.bottom).toBeLessThan(624);
        }
    });

    //  The widest enemy line a miniboss fight can show (Darkness, Defesa 161%, Seu crítico: 99.5%) is about 312 px wide around x 670, so it
    //  cannot stay right of x 535: its row starts below Lacaio 2 (y 602.5) and ends above the battle bar (y 624), whichever add is the target
    test('the widest enemy line starts below Lacaio 2 and ends above the battle bar', async ({ page }) => {
        await startAdds(page, { definition: addsChapter({ element: 'DARKNESS', defense: 101 }) });
        await scene(page, '(s) => { const real = s.leaderAttacker.bind(s); s.leaderAttacker = () => ({ ...real(), critChance: 99.5 }); s.refreshEnemyStats(); }');

        const read = () => page.evaluate(() => {
            const canvas = document.querySelector('#game-container canvas').getBoundingClientRect();
            const rect = document.querySelector('.enemy-stats').getBoundingClientRect();

            return {
                left: ((rect.x - canvas.x) * 1024) / canvas.width, right: ((rect.right - canvas.x) * 1024) / canvas.width,
                top: ((rect.y - canvas.y) * 768) / canvas.height, bottom: ((rect.bottom - canvas.y) * 768) / canvas.height
            };
        });

        for (const [ target, text, minWidth ] of [ [ MINIBOSS, 'Darkness  Defesa 161%  Seu crítico: 99.5%', 300 ], [ LACAIO_2, 'Darkness  Defesa 0%  Seu crítico: 99.5%', 250 ] ])
        {
            await hitAt(page, ...target);

            const box = await read();

            expect(await page.locator('.enemy-stats').textContent()).toBe(text);
            expect(box.right - box.left, `enemy stats ${JSON.stringify(box)}`).toBeGreaterThan(minWidth);
            expect(box.top, `enemy stats ${JSON.stringify(box)}`).toBeGreaterThanOrEqual(602.5);
            expect(box.bottom, `enemy stats ${JSON.stringify(box)}`).toBeLessThan(624);
        }
    });
});
