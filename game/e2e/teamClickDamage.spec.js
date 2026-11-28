import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';
import { SHIELD, affixChapter, chip, startFight } from './support/affixFight';

//  Team click damage (spec team-click-damage): every click is followed, in the same instant, by one hit of every fighting ally, and the team
//  number stands 8 px right of the click number. The player owns one blank card of each of the five heroes; `stars` adds a card of that many
//  stars. The auto click is switched off while the game loads (chapter 5 opens it) and the Phaser loop is stopped once the game has loaded:
//  time moves only with advance(page, ms) and every click is a call of the scene (strike), so no real frame adds a hit. `autoClick: true`
//  switches the auto click on after the loop sleeps, through the same scene method as its window; `stop: false` keeps the loop awake for a
//  real mouse click, which Phaser reads on a frame.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const GOLD = '#ffd35c';
const ORANGE = '#ff8a1f';
const ALLY = '#7fd4ff';

//  A monster of the new payload: the defense and both legacy columns equal
const monsterOf = (element, defense = 0, critResistance = 0) => ({ element, defense, critResistance });

//  One stage whose phase monsters and miniboss have `health`, the chapter boss 1000
const chapter = (monster, health = 1000, miniboss = monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    bossDropRuleId: 3,
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: health, minibossHealth: health, minibossTimeLimitMs: 60_000, monster, miniboss, monsterDropRuleId: 1, minibossDropRuleId: 2
    } ]
});

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const health = (page) => scene(page, '(s) => s.monster?.health');
const advance = (page, ms) => page.evaluate((delta) => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, delta), ms);
//  The numbers of one colour that are on screen, oldest first
const texts = (page, color) => scene(page, `(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "${color}").map((o) => ({ text: o.text, x: o.x, y: o.y, width: o.width, originX: o.originX, size: o.style.fontSize }))`);
const textsOf = async (page, color) => (await texts(page, color)).map(({ text }) => text);

//  Stops the loop
const freeze = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
const wake = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.wake());
//  Records the main monster at the moment each encounter is shown, inside showEncounter: a respawned monster is read from this record, never
//  from the live scene (L-112, TD-012)
const recordShownMonsters = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');
    const show = game.showEncounter.bind(game);

    window.__shownMonsters = [];
    game.showEncounter = (encounter) => {
        show(encounter);
        window.__shownMonsters.push(game.monster ? { health: game.monster.health, dead: game.monster.dead } : null);
    };
});
const shownMonsters = (page) => page.evaluate(() => window.__shownMonsters);
//  Records every number at the moment it is shown, so a fade of 800 ms cannot hide it from a slow read
const recordNumbers = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');
    const show = game.showDamage.bind(game);

    window.__numbers = [];
    game.showDamage = (...args) => {
        const number = show(...args);

        window.__numbers.push({ text: number.text, x: number.x, y: number.y, width: number.width, originX: number.originX, color: number.style.color });

        return number;
    };
});
const recordedNumbers = (page) => page.evaluate(() => window.__numbers);

const startTeam = async (page, {
    chapter: campaignChapter = 5, stage = 1, encounter = 'PHASE', completed, cleared = [ 5 ], team, leader = 'kael', stars = {}, equipment, talents,
    monster = monsterOf('FIRE'), health: monsterHealth = 1000, roll, stop = true, autoClick = false
} = {}) => {
    const copies = {
        ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])),
        ...Object.fromEntries(Object.entries(stars).map(([ id, count ]) => [ `${id}:${count}`, 1 ]))
    };
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monster, monsterHealth),
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: { chapter: campaignChapter, stage, encounter, phase: 1, ...(completed && { completed }) } },
        wallets: { yan: 0 },
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
    //  The loop sleeps first so no real frame runs an auto click or a respawn while the test reads the scene
    if (stop)
    {
        await freeze(page);
    }

    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    if (stop)
    {
        //  Nothing may hit before the test acts
        await expect.poll(() => health(page)).toBe(monsterHealth);
    }

    if (autoClick)
    {
        await scene(page, '(s) => s.switchAutoClick(true)');
    }

    return handle;
};

const useSkill = (page, slot) => page.evaluate((number) => window.__PHASER_GAME__.scene.getScene('ClickerGame').useSkill(number), slot);
const strike = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').strike(670));
const hitAt = (page, x, y) => page.evaluate(([ px, py ]) => window.__PHASER_GAME__.scene.getScene('ClickerGame').hitMonster({ x: px, y: py }), [ x, y ]);
const escape = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').escape());

//  A real mouse click at scene px
const clickAt = async (page, x, y) => {
    const box = await page.locator('canvas').boundingBox();

    await page.mouse.click(box.x + (x * box.width) / 1024, box.y + (y * box.height) / 768);
};

const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };
const LYRA_AND_ORINA = { boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] };
const piece = (overrides) => ({ id: 'p1', slot: 'WEAPON', rarity: 'COMMON', refine: 0, affixes: [], heroId: null, ...overrides });
const LYRA_WEAPON = piece({ id: 'w1', slot: 'WEAPON', baseClick: 624, heroId: 'lyra' });

//  "Beside" (spec team-click-damage TCD-03 AC 2): the team number is left-anchored 8 px right of the right edge of the click number, on its baseline
const expectBeside = (ally, click) => {
    expect(click.originX).toBe(0.5);
    expect(ally.originX).toBe(0);
    expect(Math.abs(ally.x - (click.x + click.width / 2 + 8))).toBeLessThanOrEqual(0.5);
    expect(ally.y).toBe(click.y);
};

const openTeam = async (page) => {
    await page.getByTestId('hud-team').click();
    await expect(page.getByTestId('team-screen')).toBeVisible();
};
const slot = (page, index) => page.getByTestId(`team-slot-${index}`);

test.describe('A click brings the team (TCD-01)', () => {
    test('a real mouse click on the monster with Lyra in slot 1 deals 1 and 2: HP 7/10', async ({ page }) => {
        await startTeam(page, { health: 10, team: LYRA_IN_SLOT_1, stop: false });
        await recordNumbers(page);

        await clickAt(page, 670, 440);

        await expect.poll(() => health(page)).toBe(7);
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 7/10');

        const shown = await recordedNumbers(page);

        expect(shown.filter(({ color }) => color === GOLD).map(({ text }) => text)).toEqual([ '1' ]);
        expect(shown.filter(({ color }) => color === ALLY).map(({ text }) => text)).toEqual([ '2' ]);
    });

    test('two allies: one click shows a gold 1 and one light-blue 4', async ({ page }) => {
        await startTeam(page, { health: 10, team: LYRA_AND_ORINA });

        await strike(page);

        expect(await health(page)).toBe(5);
        expect(await textsOf(page, GOLD)).toEqual([ '1' ]);
        expect(await textsOf(page, ALLY)).toEqual([ '4' ]);
    });

    test('a click that kills shows no team number', async ({ page }) => {
        await startTeam(page, { health: 1, team: LYRA_IN_SLOT_1 });

        await strike(page);

        expect(await scene(page, '(s) => s.monster.dead')).toBe(true);
        expect(await textsOf(page, GOLD)).toEqual([ '1' ]);
        expect(await texts(page, ALLY)).toEqual([]);
    });

    test('a team hit that kills is handled once: Lyra\'s 20 kills, Orina does not hit, the coins land once', async ({ page }) => {
        await startTeam(page, { health: 10, cleared: [ 5, 6 ], stars: { lyra: 9 }, team: { boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] } });
        await expect(page.locator('.wallet')).toHaveText('Ouro: 0 Prata: 0 Cobre: 0');

        await strike(page);

        //  The click deals 1, Lyra's 20 kills the monster of 10 and Orina's hit of the same team strike does not land
        expect(await textsOf(page, ALLY)).toEqual([ '20' ]);
        expect(await scene(page, '(s) => s.monster.dead')).toBe(true);
        //  Only the sprite of the slot that hit steps: Lyra's, not Orina's
        const stepped = (hero) => scene(page, `(s) => s.tweens.getTweens().filter((t) => t.targets[0].texture?.key === "hero_${hero}").length`);

        expect(await stepped('lyra')).toBe(1);
        expect(await stepped('orina')).toBe(0);

        //  The respawn, the flying coins and the report run in real time; the new monster is read from the record of showEncounter (TD-012)
        await recordShownMonsters(page);
        await wake(page);

        await expect(page.locator('.wallet')).toHaveText('Ouro: 0 Prata: 0 Cobre: 3');
        await expect.poll(() => shownMonsters(page)).toEqual([ { health: 10, dead: false } ]);
    });

    test('the auto click at 500 ms brings the team', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1, autoClick: true });

        await advance(page, 500);

        expect(await health(page)).toBe(997);
        expect(await texts(page, GOLD)).toMatchObject([ { text: '1', x: 670 } ]);
        expect(await textsOf(page, ALLY)).toEqual([ '2' ]);

        await advance(page, 499);

        expect(await health(page)).toBe(997);
    });

    test('Lyra\'s double click: two orange 2, then the team\'s 2 beside the second', async ({ page }) => {
        await startTeam(page, {
            leader: 'lyra', team: { boughtSlots: 1, allies: [ 'kael', null, null, null ] }, monster: monsterOf('NATURE'), roll: 0
        });

        await strike(page);

        const orange = await texts(page, ORANGE);

        expect(orange.map(({ text }) => text)).toEqual([ '2', '2' ]);
        expect(orange[1].x).toBe(orange[0].x + 36);
        expect(await texts(page, ALLY)).toHaveLength(1);
        expect(await textsOf(page, ALLY)).toEqual([ '2' ]);
        expectBeside((await texts(page, ALLY))[0], orange[1]);
        expect(await health(page)).toBe(994);
    });

    test('the combo does not reach the team: three clicks leave 990.97', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1, talents: { COMBO: 10 } });

        for (let click = 0; click < 3; click++)
        {
            await strike(page);
        }

        expect(await health(page)).toBeCloseTo(990.97, 5);
        expect(await textsOf(page, ALLY)).toEqual([ '2', '2', '2' ]);
    });

    test('a skill brings no team strike', async ({ page }) => {
        await startTeam(page, { stars: { kael: 1 }, team: LYRA_IN_SLOT_1 });

        await useSkill(page, 1);

        //  The skill landed (its gold number is on screen and the monster lost health) and no light-blue number came with it
        expect(await texts(page, GOLD)).toHaveLength(1);
        expect(await health(page)).toBeLessThan(1000);
        expect(await texts(page, ALLY)).toEqual([]);
    });

    test('a damage-over-time tick brings no team strike: Tempestade Arcana ticks and Lyra does not hit', async ({ page }) => {
        await startTeam(page, { leader: 'orina', stars: { orina: 3 }, monster: monsterOf('WATER'), team: LYRA_IN_SLOT_1 });

        await useSkill(page, 2);
        await advance(page, 3_000);

        //  The three ticks landed (the monster lost health) and no light-blue number came with any of them
        expect(await health(page)).toBeLessThan(1000);
        expect(await texts(page, ALLY)).toEqual([]);
    });

    test('below chapter 5 a click shows no team number', async ({ page }) => {
        await startTeam(page, { chapter: 4, cleared: [ 5 ], team: LYRA_IN_SLOT_1, health: 10 });

        await strike(page);

        expect(await health(page)).toBe(9);
        expect(await texts(page, ALLY)).toEqual([]);
    });

    test('a click on a shielded miniboss takes a charge for the click and one for Lyra', async ({ page }) => {
        await startFight(page, {
            definition: affixChapter({ affix: SHIELD(3) }), progress: { chapter: 5, stage: 1, encounter: 'MINIBOSS', phase: 1 }, team: LYRA_IN_SLOT_1
        });
        await expect(chip(page)).toHaveText('Escudo de golpes: 3/3');

        await strike(page);

        await expect(chip(page)).toHaveText('Escudo de golpes: 1/3');
        expect(await health(page)).toBe(100);
    });

    test('a farm fight at chapter 5: a click deals 1 and 2', async ({ page }) => {
        await startTeam(page, { completed: true, encounter: 'CHAPTER_BOSS', team: LYRA_IN_SLOT_1, stop: false });

        await page.getByTestId('hud-farm').click();
        await page.getByTestId('farm-entry-miniboss-1').click();
        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1');
        await freeze(page);

        const before = await health(page);

        await strike(page);

        expect(before - await health(page)).toBeCloseTo(3, 5);
        expect(await textsOf(page, ALLY)).toEqual([ '2' ]);
    });
});

test.describe('No click, no team (TCD-02)', () => {
    test('10 s with no click deal no team damage', async ({ page }) => {
        await startTeam(page, { health: 10, team: LYRA_IN_SLOT_1 });

        await advance(page, 10_000);

        expect(await health(page)).toBe(10);
        expect(await texts(page, ALLY)).toEqual([]);
    });

    test('with Heróis open a click does nothing and the auto click still brings the team', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1, autoClick: true });

        await page.getByTestId('hud-heroes').click();
        await expect(page.locator('.hero-panel')).toBeVisible();
        await hitAt(page, 670, 440);

        expect(await health(page)).toBe(1000);

        await advance(page, 500);

        expect(await health(page)).toBe(997);
    });

    test('the pause menu stops the click and the team', async ({ page }) => {
        await startTeam(page, { health: 10, team: LYRA_IN_SLOT_1, autoClick: true });

        await escape(page);
        await expect(page.locator('.pause-menu')).toBeVisible();
        await hitAt(page, 670, 440);
        await advance(page, 10_000);

        expect(await health(page)).toBe(10);
        expect(await texts(page, ALLY)).toEqual([]);
    });
});

test.describe('The team number beside the click number (TCD-03)', () => {
    test('the light-blue number stands 8 px right of the gold number on its baseline', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await strike(page);

        const [ click ] = await texts(page, GOLD);
        const [ ally ] = await texts(page, ALLY);

        expect(click.text).toBe('1');
        expect(ally.text).toBe('2');
        expectBeside(ally, click);
        expect(click.x + click.width / 2).toBeLessThanOrEqual(ally.x);
        expect(await scene(page, `(s) => {
            const text = s.children.list.filter((o) => o.type === "Text" && o.style.color === "${ALLY}").at(-1);

            return { color: text.style.color, fontSize: text.style.fontSize, fontFamily: text.style.fontFamily, fontStyle: text.style.fontStyle, stroke: text.style.stroke, strokeThickness: text.style.strokeThickness };
        }`)).toEqual({ color: '#7fd4ff', fontSize: '28px', fontFamily: 'Cinzel', fontStyle: '700', stroke: '#1c120c', strokeThickness: 10 });
    });

    test('a long team number keeps the gap: a 12.5K team hit stands beside the gold 1', async ({ page }) => {
        await startTeam(page, { health: 100_000, stars: { lyra: 9 }, team: LYRA_IN_SLOT_1, equipment: [ LYRA_WEAPON ] });

        await strike(page);

        const [ click ] = await texts(page, GOLD);
        const [ ally ] = await texts(page, ALLY);

        expect(click.text).toBe('1');
        expect(ally.text).toBe('12.5K');
        expectBeside(ally, click);
    });

    test('both numbers rise and fade over 800 ms', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await strike(page);

        //  One tween per number, both started by the same click, each of 800 ms (the 40 px rise is pinned by the unit test)
        const tweens = await scene(page, '(s) => s.tweens.getTweens().filter((t) => t.targets[0].type === "Text").map((t) => ({ color: t.targets[0].style.color, durations: t.data.map((d) => d.duration) }))');

        expect(tweens.map(({ color }) => color).sort()).toEqual([ ALLY, GOLD ]);
        tweens.forEach(({ durations }) => expect(new Set(durations)).toEqual(new Set([ 800 ])));

        await wake(page);

        //  Both are destroyed at the end of the fade
        await expect.poll(() => texts(page, ALLY), { timeout: 3_000 }).toEqual([]);
        await expect.poll(() => texts(page, GOLD), { timeout: 3_000 }).toEqual([]);
    });

    test('five clicks in a row show five gold 1 and five light-blue 2', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });

        for (let click = 0; click < 5; click++)
        {
            await strike(page);
        }

        expect(await textsOf(page, GOLD)).toEqual([ '1', '1', '1', '1', '1' ]);
        expect(await textsOf(page, ALLY)).toEqual([ '2', '2', '2', '2', '2' ]);
        expect(await health(page)).toBe(985);
    });

    test('each team strike steps Lyra\'s sprite; a click that kills steps none', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        const lyraTweens = (target) => scene(target, '(s) => s.tweens.getTweens().filter((t) => t.targets[0].texture?.key === "hero_lyra").map((t) => ({ duration: t.data[0].duration, yoyo: t.data[0].yoyo }))');

        await startTeam(page, { team: LYRA_IN_SLOT_1 });
        expect(await lyraTweens(page)).toEqual([]);

        await strike(page);

        expect(await lyraTweens(page)).toEqual([ { duration: 100, yoyo: true } ]);

        //  With one health the click kills and the team never strikes
        const context = await browser.newContext();
        const other = await context.newPage();

        await startTeam(other, { health: 1, team: LYRA_IN_SLOT_1 });
        await strike(other);

        expect(await scene(other, '(s) => s.monster.dead')).toBe(true);
        expect(await lyraTweens(other)).toEqual([]);
        await context.close();
    });
});

test.describe('Equipe per click (TCD-04)', () => {
    test('the ally line reads Dano: 12.5K/clique on one line inside the card', async ({ page }) => {
        await startTeam(page, { stars: { lyra: 9 }, team: LYRA_IN_SLOT_1, equipment: [ LYRA_WEAPON ] });
        await openTeam(page);

        const line = slot(page, 1).locator('.team-dps-line');

        await expect(line).toHaveText('Dano: 12.5K/clique');
        await expect(line).toHaveCSS('white-space', 'nowrap');

        const card = await slot(page, 1).boundingBox();
        const box = await line.boundingBox();

        //  The card holds 2 px of border and 8 px of padding on each side
        expect(box.x).toBeGreaterThanOrEqual(card.x + 10 - 0.5);
        expect(box.x + box.width).toBeLessThanOrEqual(card.x + card.width - 10 + 0.5);
        expect(box.height).toBeLessThanOrEqual(20);
        //  The text itself does not spill out of its box
        expect(await line.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    });

    test('the team line reads Dano da equipe por clique: 12.5K', async ({ page }) => {
        await startTeam(page, { stars: { lyra: 9 }, team: LYRA_IN_SLOT_1, equipment: [ LYRA_WEAPON ] });
        await openTeam(page);

        await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe por clique: 12.5K');
    });

    test('no text of Equipe says /s', async ({ page }) => {
        await startTeam(page, { team: { boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] } });
        await openTeam(page);

        await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe por clique: 5');

        const screen = await page.getByTestId('team-screen').textContent();

        expect(screen).toContain('Dano: 2.5/clique');
        expect(screen).not.toMatch(/\/s\b|por segundo/);
    });
});
