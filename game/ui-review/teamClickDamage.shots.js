import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the team-click-damage review (.specs/features/team-click-damage/ui-review/): the team number beside the click number and the
//  Equipe damage lines. Fake backend, nothing stubbed. Canvas shots: the loop sleeps, one click is stepped by hand, then one frame is drawn with
//  a delta of 0 (as techDebtPolish.shots.js `tick` does), so every number is at alpha 1.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const monsterOf = (element, defense = 0) => ({ element, defense, critResistance: 0 });
const ADD = { health: 30, defenseBuff: 30 };
const chapter = (monster, adds) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    bossDropRuleId: 3,
    stages: [ 1, 2 ].map((number) => ({
        number, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000, monster, miniboss: monster,
        monsterDropRuleId: 1, minibossDropRuleId: 2, ...(adds && { adds })
    }))
});
const piece = (overrides) => ({ id: 'p1', slot: 'WEAPON', rarity: 'COMMON', refine: 0, affixes: [], heroId: null, ...overrides });
const LYRA_WEAPON = piece({ id: 'w1', baseClick: 624, heroId: 'lyra' });
const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };
const FOUR_ALLIES = { boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] };

const start = async (page, {
    progress = { chapter: 5, stage: 1, encounter: 'PHASE', phase: 1 }, cleared = [ 5 ], leader = 'kael', team, stars = {}, equipment, roll,
    definition = chapter(monsterOf('FIRE'))
} = {}) => {
    //  Missing assets and console errors of the review, printed as PROBLEM lines
    page.on('console', (message) => message.type() === 'error' && console.log(`PROBLEM console ${message.text()}`));
    page.on('response', (response) => response.status() >= 400 && console.log(`PROBLEM ${response.status()} ${response.url()}`));
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition,
        cards: { yan: { leader, cleared, copies: {
            ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])),
            ...Object.fromEntries(Object.entries(stars).map(([ id, count ]) => [ `${id}:${count}`, 1 ])) } } },
        progress: { yan: progress },
        team: team ? { yan: team } : {},
        ...(equipment && { equipment: { yan: equipment } })
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.waitForTimeout(800);
};

//  Loop asleep, one click stepped by hand, one frame drawn with a delta of 0
const click = (page, { at } = {}) => page.evaluate((point) => {
    const game = window.__PHASER_GAME__;
    const scene = game.scene.getScene('ClickerGame');

    game.loop.sleep();
    if (point)
    {
        scene.hitMonster({ x: point[0], y: point[1] });
    }
    else
    {
        scene.strike(scene.centreXOf(scene.currentTarget()), scene.currentTarget());
    }
    game.step(performance.now(), 0);
}, at);

//  Numbers on screen, for the report: colour, text, x, y, width
const numbers = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').children.list
    .filter((o) => o.type === 'Text' && [ '#ffd35c', '#ff8a1f', '#7fd4ff' ].includes(o.style.color))
    .map((o) => ({ color: o.style.color, text: o.text, x: o.x, y: o.y, width: o.width, originX: o.originX, size: o.style.fontSize })));

const loaded = (page) => page.waitForFunction(() => [ ...document.images ].every((img) => img.complete && img.naturalWidth > 0));
const openTeam = async (page) => {
    await page.getByTestId('hud-team').click();
    await expect(page.getByTestId('team-screen')).toBeVisible();
    await loaded(page);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
};

test('click pair', async ({ page }, testInfo) => {
    await start(page, { team: LYRA_IN_SLOT_1 });
    await click(page);
    console.log('NUMBERS 01', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '01-click-pair');
});

test('click pair critical', async ({ page }, testInfo) => {
    await start(page, { team: LYRA_IN_SLOT_1, roll: 0 });
    await click(page);
    console.log('NUMBERS 02', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '02-click-pair-critical');
});

test('click pair long', async ({ page }, testInfo) => {
    await start(page, { team: LYRA_IN_SLOT_1, stars: { lyra: 9 }, equipment: [ LYRA_WEAPON ] });
    await click(page);
    console.log('NUMBERS 03', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '03-click-pair-long');
});

test('double click', async ({ page }, testInfo) => {
    await start(page, { leader: 'lyra', team: { boughtSlots: 1, allies: [ 'kael', null, null, null ] }, roll: 0, definition: chapter(monsterOf('NATURE')) });
    await click(page);
    console.log('NUMBERS 04', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '04-double-click');
});

test('rapid clicks', async ({ page }, testInfo) => {
    await start(page, { team: LYRA_IN_SLOT_1 });

    const box = await page.locator('canvas').boundingBox();

    for (let i = 0; i < 5; i++)
    {
        await page.mouse.click(box.x + (670 * box.width) / 1024, box.y + (440 * box.height) / 768);
        await page.waitForTimeout(60);
    }
    await page.waitForTimeout(40);
    console.log('NUMBERS 05', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '05-rapid-clicks');
});

test('click on add', async ({ page }, testInfo) => {
    await start(page, {
        progress: { chapter: 11, stage: 1, encounter: 'MINIBOSS', phase: 1 },
        team: LYRA_IN_SLOT_1,
        definition: chapter(monsterOf('FIRE', 49), [ ADD, ADD ])
    });
    await click(page, { at: [ 480, 360 ] });
    console.log('NUMBERS 06', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '06-click-on-add');
});

test('four allies', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6, 7, 8 ], team: FOUR_ALLIES });
    await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');

        scene.strike(scene.centreXOf(scene.currentTarget()), scene.currentTarget());
    });
    await page.waitForTimeout(50);
    console.log('NUMBERS 07', JSON.stringify(await numbers(page)));
    await shot(page, testInfo, '07-four-allies');
});

test('equipe long', async ({ page }, testInfo) => {
    await start(page, { team: LYRA_IN_SLOT_1, stars: { lyra: 9 }, equipment: [ LYRA_WEAPON ] });
    await openTeam(page);
    await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe por clique: 12.5K');
    await shot(page, testInfo, '08-equipe-long');
    await shot(page.getByTestId('team-slot-1'), testInfo, '08b-equipe-long-card');
});

test('equipe empty', async ({ page }, testInfo) => {
    await start(page, { team: { boughtSlots: 1, allies: [ null, null, null, null ] } });
    await openTeam(page);
    await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe por clique: 0');
    await shot(page, testInfo, '09-equipe-empty');
});
