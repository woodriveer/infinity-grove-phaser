import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the tech-debt-polish review (.specs/features/tech-debt-polish/ui-review/): the attribute panel and the ally number. Fake backend, nothing stubbed.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const monsterOf = (element, defense = 0) => ({ element, defense, physicalDefense: defense, magicalDefense: defense, critResistance: 0 });
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
const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };
const PASSIVES = { boughtSlots: 4, allies: [ 'lyra', 'kael', 'orina', 'vex' ] };

const start = async (page, { progress = { chapter: 5, stage: 1, encounter: 'PHASE', phase: 1 }, cleared = [ 5 ], leader = 'kael', team, definition = chapter(monsterOf('FIRE')) } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition,
        cards: { yan: { leader, cleared, copies: Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])) } },
        progress: { yan: progress },
        team: team ? { yan: team } : {}
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.waitForTimeout(800);
};

const openPanel = async (page) => {
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('leader-stats')).toBeVisible();
    await page.waitForTimeout(500);
};

//  Loop asleep, one click stepped by hand: the click number and the team number are at alpha 1
const tick = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const scene = game.scene.getScene('ClickerGame');

    game.loop.sleep();
    scene.strike(scene.centreXOf(scene.currentTarget()), scene.currentTarget());
    //  The loop is asleep, so draw one frame by hand with a delta of 0: the tweens do not move and the number stays at alpha 1
    game.step(performance.now(), 0);
});

test('attributes panel', async ({ page }, testInfo) => {
    await start(page);
    await openPanel(page);
    await expect(page.getByTestId('stat-breakDefense')).toHaveText('Quebra de defesa: 0');
    await shot(page, testInfo, '01-attributes-panel');
    await shot(page.getByTestId('leader-stats'), testInfo, '01b-attributes-panel-crop');
});

test('attributes panel with passives', async ({ page }, testInfo) => {
    await start(page, { cleared: [ 5, 6, 7, 8 ], leader: 'seraphine', team: PASSIVES });
    await openPanel(page);
    await expect(page.getByTestId('stat-breakDefense')).toHaveText('Quebra de defesa: 15');
    await shot(page, testInfo, '02-attributes-panel-passives');
    await shot(page.getByTestId('leader-stats'), testInfo, '02b-attributes-panel-passives-crop');
});

test('field ally hit', async ({ page }, testInfo) => {
    await start(page, { team: LYRA_IN_SLOT_1 });
    await tick(page);
    await shot(page, testInfo, '03-field-ally-hit');
});

test('field ally hit on an add', async ({ page }, testInfo) => {
    await start(page, {
        progress: { chapter: 11, stage: 1, encounter: 'MINIBOSS', phase: 1 },
        team: LYRA_IN_SLOT_1,
        definition: chapter(monsterOf('FIRE', 49), [ ADD, ADD ])
    });
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;

        game.loop.sleep();
        game.scene.getScene('ClickerGame').hitMonster({ x: 480, y: 360 });
    });
    await tick(page);
    await shot(page, testInfo, '04-field-ally-hit-add');
});
