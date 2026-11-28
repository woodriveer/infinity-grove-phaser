import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';
import { openLeaderList } from './support/leader';

//  Hero team (spec hero-team): the ally hits on the real scene. The allies hit once with every click (spec team-click-damage), never critical,
//  with the one damage of every strike. The player owns one blank card of each of the five heroes; `stars` adds a card of that many stars.
//  The auto click is switched off (chapter 5 opens it), and the Phaser loop is stopped once the game has loaded: time moves only with
//  advance(page, ms), which steps the scene by that many fight milliseconds; team(page) lands the team's part of a click without the click.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const ALLY_COLOR = '#7fd4ff';

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
//  The light-blue numbers of the team strikes that are on screen, oldest first
const allyTexts = (page) => scene(page, `(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "${ALLY_COLOR}").map((o) => ({ text: o.text, x: o.x, size: o.style.fontSize }))`);
const lastAllyText = async (page) => (await allyTexts(page)).at(-1)?.text;
const dealt = async (page, from = 1000) => from - await health(page);

//  Stops the loop
const freeze = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
const wake = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.wake());
//  The team's part of a click without the click: lands it on the target, then the kill path, as strike does
const team = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.teamStrike(game.currentTarget());
    game.afterDamage();
});
//  Records the main monster at the moment each encounter is shown, inside showEncounter: a respawned monster that the allies kill again a
//  second later is read from this record, never from the live scene (L-112, TD-012)
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

const startTeam = async (page, {
    chapter: campaignChapter = 5, stage = 1, encounter = 'PHASE', completed, cleared = [ 5 ], copper = 0, team, leader = 'kael', stars = {}, equipment, talents,
    monster = monsterOf('FIRE'), miniboss, health: monsterHealth = 1000, definition, lastChapter, roll, stop = true
} = {}) => {
    const copies = {
        ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])),
        ...Object.fromEntries(Object.entries(stars).map(([ id, count ]) => [ `${id}:${count}`, 1 ]))
    };
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: definition ?? chapter(monster, monsterHealth, miniboss ?? monster),
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: { chapter: campaignChapter, stage, encounter, phase: 1, ...(completed && { completed }) } },
        wallets: { yan: copper },
        team: team ? { yan: team } : {},
        ...(equipment && { equipment: { yan: equipment } }),
        ...(talents && { talents: { yan: talents } }),
        ...(lastChapter && { lastChapter })
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
        await page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
    }

    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    if (stop)
    {
        await freeze(page);
        //  No ally hit may land before the test acts
        await expect.poll(() => health(page)).toBe(monsterHealth);
    }

    return handle;
};

const useSkill = (page, slot) => page.evaluate((number) => window.__PHASER_GAME__.scene.getScene('ClickerGame').useSkill(number), slot);
const strike = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').strike(670));

const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };
const piece = (overrides) => ({ id: 'p1', slot: 'WEAPON', rarity: 'COMMON', refine: 0, affixes: [], heroId: null, ...overrides });

test.describe('Hero team: ally hits', () => {
    test('Lyra in slot 1 lands nothing in 10 s with no click, and a team strike hits a FIRE monster of 10 health for 2 in light blue at x 740', async ({ page }) => {
        await startTeam(page, { health: 10, team: LYRA_IN_SLOT_1 });

        await advance(page, 10_000);
        expect(await health(page)).toBe(10);
        expect(await allyTexts(page)).toEqual([]);

        await team(page);

        expect(await health(page)).toBe(8);
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 8/10');
        expect(await allyTexts(page)).toEqual([ { text: '2', x: 740, size: '28px' } ]);
    });

    test('after a reset to chapter 1 a click deals no team damage', async ({ page }) => {
        await startTeam(page, { chapter: 6, cleared: [ 5 ], team: LYRA_IN_SLOT_1, stop: false });

        //  The team is active at chapter 6: a click deals 1 and Lyra's 2
        await freeze(page);
        await strike(page);
        expect(await health(page)).toBe(997);
        await wake(page);

        await page.getByTestId('auto-click-button').click();
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await page.getByTestId('reset-account').click();
        await page.getByTestId('reset-confirm').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await expect(page.getByTestId('reset-dialog')).toBeHidden();

        //  The numbers of the old click fade away; the new monster is full
        await expect.poll(() => allyTexts(page), { timeout: 5_000 }).toEqual([]);
        await freeze(page);
        expect(await health(page)).toBe(1000);

        await strike(page);

        expect(await health(page)).toBe(999);
        expect(await allyTexts(page)).toEqual([]);
    });

    test('an ally meets the one defense: Lyra deals 1 to a FIRE monster with defense 50', async ({ page }) => {
        await startTeam(page, { monster: monsterOf('FIRE', 50), team: LYRA_IN_SLOT_1 });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(1, 5);
        expect(await lastAllyText(page)).toBe('1');
    });

    test('an old payload with only physicalDefense 50 no longer halves the ally hit: 2', async ({ page }) => {
        await startTeam(page, { monster: { element: 'FIRE', physicalDefense: 50, magicalDefense: 50, critResistance: 0 }, team: LYRA_IN_SLOT_1 });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(2, 5);
    });

    test('Vex with 50 % armor pierce deals 1.6 to defense 40', async ({ page }) => {
        const ring = piece({ id: 'r1', slot: 'RING', affixes: [ { type: 'ARMOR_PIERCE_PCT', base: 50 } ], heroId: 'vex' });

        await startTeam(page, { monster: monsterOf('FIRE', 40), team: { boughtSlots: 1, allies: [ 'vex', null, null, null ] }, equipment: [ ring ] });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(1.6, 5);
        expect(await lastAllyText(page)).toBe('1.6');
    });

    test('Prisão de Espinhos raises an ally hit to 2.5', async ({ page }) => {
        await startTeam(page, { leader: 'orina', stars: { orina: 3 }, monster: monsterOf('WATER'), team: LYRA_IN_SLOT_1 });

        await useSkill(page, 1);
        await team(page);

        expect(await dealt(page)).toBeCloseTo(2.5, 5);
        expect(await lastAllyText(page)).toBe('2.5');
    });

    test('Bênção da Grande Árvore raises an ally hit to 2.6', async ({ page }) => {
        await startTeam(page, { leader: 'seraphine', stars: { seraphine: 3 }, monster: monsterOf('LIGHT'), team: LYRA_IN_SLOT_1 });

        await useSkill(page, 1);
        await team(page);

        expect(await dealt(page)).toBeCloseTo(2.6, 5);
        expect(await lastAllyText(page)).toBe('2.6');
    });

    test('Brado Aterrador lowers the defense an ally meets: 1.8 against defense 40', async ({ page }) => {
        await startTeam(page, { leader: 'kael', stars: { kael: 3 }, monster: monsterOf('FIRE', 40), team: LYRA_IN_SLOT_1 });

        await useSkill(page, 3);
        await team(page);

        expect(await dealt(page)).toBeCloseTo(1.8, 5);
        expect(await lastAllyText(page)).toBe('1.8');
    });

    test('PHYSICAL_BREAK 5 lowers the defense an ally meets: 1.3 against defense 40', async ({ page }) => {
        await startTeam(page, { monster: monsterOf('FIRE', 40), team: LYRA_IN_SLOT_1, talents: { PHYSICAL_BREAK: 5 } });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(1.3, 5);
        expect(await lastAllyText(page)).toBe('1.3');
    });

    test('Ventos Ligeiros, a running combo and critical pieces leave a team hit at 2', async ({ page }) => {
        const ring = piece({
            id: 'r1', slot: 'RING', affixes: [ { type: 'CRIT_CHANCE', base: 50 }, { type: 'CRIT_DAMAGE_PCT', base: 100 } ], heroId: 'orina'
        });

        await startTeam(page, { leader: 'lyra', stars: { lyra: 3 }, monster: monsterOf('NATURE'), team: { boughtSlots: 1, allies: [ 'orina', null, null, null ] }, equipment: [ ring ] });

        await useSkill(page, 3);

        for (let click = 0; click < 5; click++)
        {
            await strike(page);
        }

        //  The clicks are on the monster; only the team strike that follows is measured
        const before = await health(page);

        await team(page);

        expect(before - await health(page)).toBeCloseTo(2, 5);
        expect(await lastAllyText(page)).toBe('2');
    });

    test('a 3 star leader leaves the team hit at 2', async ({ page }) => {
        await startTeam(page, { leader: 'kael', stars: { kael: 3 }, team: LYRA_IN_SLOT_1 });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(2, 5);
        expect(await lastAllyText(page)).toBe('2');
    });

    //  Spec E3 names Orina, but Orina as an ally also lowers every defense by 15 (Erosão Arcana, Q45), so her hit is 13.2 x 8 x 2 x 0.65 = 137.28.
    //  The numbers of E3 (105.6) hold for an ally without a defense passive, so the scenario uses Lyra with the same stars and pieces.
    test('Lyra 3 stars with a 10 click weapon and a +20 % ring deals 105.6 to a NATURE monster with defense 50', async ({ page }) => {
        const weapon = piece({ id: 'w1', slot: 'WEAPON', baseClick: 10, heroId: 'lyra' });
        const ring = piece({ id: 'r1', slot: 'RING', affixes: [ { type: 'CLICK_DAMAGE_PCT', base: 20 } ], heroId: 'lyra' });

        await startTeam(page, { stars: { lyra: 3 }, monster: monsterOf('NATURE', 50), team: LYRA_IN_SLOT_1, equipment: [ weapon, ring ] });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(105.6, 5);
        expect(await lastAllyText(page)).toBe('105.6');
    });

    test('Orina 3 stars with the same pieces also lowers the defense by 15: 13.2 x 8 x 2 x 0.65 = 137.28', async ({ page }) => {
        const weapon = piece({ id: 'w1', slot: 'WEAPON', baseClick: 10, heroId: 'orina' });
        const ring = piece({ id: 'r1', slot: 'RING', affixes: [ { type: 'CLICK_DAMAGE_PCT', base: 20 } ], heroId: 'orina' });

        await startTeam(page, {
            stars: { orina: 3 }, monster: monsterOf('NATURE', 50), team: { boughtSlots: 1, allies: [ 'orina', null, null, null ] }, equipment: [ weapon, ring ]
        });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(137.28, 5);
    });

    test('a 9 star Lyra deals 20', async ({ page }) => {
        await startTeam(page, { stars: { lyra: 9 }, team: LYRA_IN_SLOT_1 });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(20, 5);
        expect(await lastAllyText(page)).toBe('20');
    });

    test('Lyra with +20 % boss damage deals 2.16 to a FIRE miniboss with defense 10', async ({ page }) => {
        const amulet = piece({ id: 'a1', slot: 'AMULET', affixes: [ { type: 'BOSS_DAMAGE_PCT', base: 20 } ], heroId: 'lyra' });

        await startTeam(page, { encounter: 'MINIBOSS', miniboss: monsterOf('FIRE', 10), team: LYRA_IN_SLOT_1, equipment: [ amulet ] });
        await expect(page.locator('.boss-timer')).toBeVisible();

        await team(page);

        expect(await dealt(page)).toBeCloseTo(2.16, 5);
    });

    test('an ally hit uses the new leader\'s element after a leader change', async ({ page }) => {
        await startTeam(page, { monster: monsterOf('NATURE'), team: LYRA_IN_SLOT_1 });

        await team(page);

        expect(await dealt(page)).toBeCloseTo(4, 5);
        expect(await lastAllyText(page)).toBe('4');

        await openLeaderList(page);
        await page.getByTestId('leader-entry-orina').click();
        await expect(page.getByTestId('leader-card')).toContainText('Orina');
        await page.getByTestId('hero-close').click();

        await team(page);

        expect(await dealt(page)).toBeCloseTo(5, 5);
        expect(await lastAllyText(page)).toBe('1');
    });

    test('an ally that equips a piece hits with it on the next team strike', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1, equipment: [ piece({ id: 'w1', slot: 'WEAPON', baseClick: 1 }) ] });

        await team(page);

        expect(await lastAllyText(page)).toBe('2');

        await page.getByTestId('hud-equipment').click();
        await page.getByTestId('equip-piece-w1').click();
        await page.getByTestId('piece-equip-lyra').click();
        await expect(page.getByTestId('piece-worn')).toHaveText('Equipado em Lyra Folhaveloz');
        await page.getByTestId('hero-close').click();

        const before = await health(page);

        await team(page);

        expect(before - await health(page)).toBeCloseTo(4, 5);
        expect(await lastAllyText(page)).toBe('4');
    });

    test('an ally killing the monster drops its coins and the next monster appears', async ({ page }) => {
        await startTeam(page, {
            health: 10, cleared: [ 5, 6 ], stars: { lyra: 9 }, team: { boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] }
        });
        await expect(page.locator('.wallet')).toHaveText('Ouro: 0 Prata: 0 Cobre: 0');

        await team(page);

        //  Lyra's 20 kills the monster of 10: Orina's hit of the same team strike does not land
        expect(await allyTexts(page)).toEqual([ { text: '20', x: 740, size: '28px' } ]);
        expect(await scene(page, '(s) => s.monster.dead')).toBe(true);

        //  The respawn, the flying coins and the report run in real time; the new monster is read from the record of showEncounter (TD-012)
        await recordShownMonsters(page);
        await wake(page);

        await expect(page.locator('.wallet')).toHaveText('Ouro: 0 Prata: 0 Cobre: 3');
        await expect.poll(() => shownMonsters(page)).toEqual([ { health: 10, dead: false } ]);
    });

    test('a team strike keeps the combo streak', async ({ page }) => {
        //  The combo shows only with a combo limit from the COMBO talent
        await startTeam(page, { team: LYRA_IN_SLOT_1, talents: { COMBO: 1 } });

        for (let click = 0; click < 3; click++)
        {
            await strike(page);
        }

        const streak = await page.getByTestId('combo-hud').textContent();

        expect(streak).not.toBe('');

        const before = await health(page);

        await team(page);

        expect(before - await health(page)).toBeCloseTo(2, 5);
        await expect(page.getByTestId('combo-hud')).toHaveText(streak);
    });

    //  The last Text of a colour on the scene, as its style (spec tech-debt-polish, TD-013)
    const lastTextStyle = (page, color) => scene(page, `(s) => {
        const text = s.children.list.filter((o) => o.type === "Text" && o.style.color === "${color}").at(-1);

        return text && { color: text.style.color, fontSize: text.style.fontSize, fontFamily: text.style.fontFamily, fontStyle: text.style.fontStyle, stroke: text.style.stroke, strokeThickness: text.style.strokeThickness };
    }`);

    test('an ally number has the light-blue fill and the dark 10 px outline', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await team(page);

        expect(await lastTextStyle(page, ALLY_COLOR)).toEqual({
            color: '#7fd4ff', fontSize: '28px', fontFamily: 'Cinzel', fontStyle: '700', stroke: '#1c120c', strokeThickness: 10
        });
    });

    test('a click number keeps the gold fill and the 8 px outline', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await strike(page);

        expect(await lastTextStyle(page, '#ffd35c')).toMatchObject({ stroke: '#2a1408', strokeThickness: 8, fontSize: '32px' });
    });

    test('a critical click number keeps the orange fill, 48 px and the 8 px outline', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1, roll: 0 });

        await strike(page);

        expect(await lastTextStyle(page, '#ff8a1f')).toMatchObject({ color: '#ff8a1f', stroke: '#2a1408', strokeThickness: 8, fontSize: '48px' });
    });

    test('two allies in one team strike draw one number with the dark 10 px outline', async ({ page }) => {
        await startTeam(page, { team: { boughtSlots: 2, allies: [ 'lyra', 'orina', null, null ] } });

        await team(page);

        expect(await allyTexts(page)).toHaveLength(1);
        expect(await lastTextStyle(page, ALLY_COLOR)).toMatchObject({ fontSize: '28px', stroke: '#1c120c', strokeThickness: 10 });
    });

    test('a click while paused lands neither the click nor the team', async ({ page }) => {
        await startTeam(page, { health: 10, team: LYRA_IN_SLOT_1 });

        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').escape());
        await expect(page.locator('.pause-menu')).toBeVisible();
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').hitMonster({ x: 670, y: 440 }));
        await advance(page, 10_000);

        expect(await health(page)).toBe(10);
        expect(await allyTexts(page)).toEqual([]);

        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').escape());
        await expect(page.locator('.pause-menu')).toBeHidden();
        await strike(page);

        expect(await health(page)).toBe(7);
    });

    test('a farm fight at chapter 5 has the allies hit too', async ({ page }) => {
        await startTeam(page, { completed: true, encounter: 'CHAPTER_BOSS', team: LYRA_IN_SLOT_1, stop: false });

        await page.getByTestId('hud-farm').click();
        await page.getByTestId('farm-entry-miniboss-1').click();
        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1');
        await freeze(page);

        const before = await health(page);

        await team(page);

        expect(before - await health(page)).toBeCloseTo(2, 5);
        expect(await lastAllyText(page)).toBe('2');
    });

    test('a farm fight of chapter 3 while the campaign stands at chapter 7 has the allies hit too', async ({ page }) => {
        await startTeam(page, { chapter: 7, cleared: [ 5, 6 ], team: LYRA_IN_SLOT_1, stop: false });

        await page.getByTestId('hud-farm').click();
        await page.getByTestId('farm-chapter-3').click();
        await expect(page.getByTestId('farm-chapter-3')).toHaveAttribute('aria-pressed', 'true');
        await page.getByTestId('farm-entry-miniboss-1').click();
        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1 (Capítulo 3)');
        await freeze(page);

        const before = await health(page);

        await team(page);

        expect(before - await health(page)).toBeCloseTo(2, 5);
        expect(await lastAllyText(page)).toBe('2');
    });
});
