import { expect, test } from '@playwright/test';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The 15 hero skills, one per test, read on the real scene. The leader holds a 3 star card, so its click carries the star bonus of 40 % click
//  damage, 30 points of critical chance and +0.5 critical damage: the base damage is 1.4 (STAR) and a skill of P % deals 1.4 x P / 100 points.
const STAR = 1.4;
//  The monsters share the element of the leader (an element against itself is neutral) with 1000 health, so no skill kills one. Time moves with scene.update(), not with the clock.
const ELEMENT_OF = { kael: 'FIRE', lyra: 'NATURE', orina: 'WATER', seraphine: 'LIGHT', vex: 'DARKNESS' };
const bare = (element) => ({ element, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });
const ARMORED = { ...bare('FIRE'), physicalDefense: 50 };
const DARKNESS = bare('DARKNESS');

const chapter = (monster = NO_DEFENSE) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000,
        monster, miniboss: monster
    } ]
});

const startAs = async (page, heroId, { monster, encounter = 'PHASE', roll } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monster ?? bare(ELEMENT_OF[heroId])),
        cards: { yan: { leader: heroId, copies: { [`${heroId}:3`]: 1 } } },
        progress: { yan: { stage: 1, encounter, phase: 1 } }
    });

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-3')).toHaveAttribute('data-unlocked', 'true');
    await expect.poll(() => health(page)).toBe(1000);

    return menu;
};

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const health = (page) => scene(page, '(s) => s.monster?.health');
const advance = (page, ms) => page.evaluate((delta) => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, delta), ms);
//  Uses the skill and moves the clock inside one call, so no real frame runs in between: returns the countdown elapsed time after each step
const elapsedAfter = (page, slot, steps) => page.evaluate(({ slot: number, steps: list }) => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');
    const read = () => game.countdown.elapsedMs;
    const start = read();

    game.useSkill(number);

    return list.map((ms) => { game.update(0, ms); return Math.round(read() - start); });
}, { slot, steps });
//  Same, for the damage: the total dealt right after the use and after each step
const dealtAfter = (page, slot, steps) => page.evaluate(({ slot: number, steps: list }) => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');
    const total = () => Math.round((1000 - game.monster.health) * 1e6) / 1e6;

    game.useSkill(number);

    return [ total(), ...list.map((ms) => { game.update(0, ms); return total(); }) ];
}, { slot, steps });
const dealt = async (page) => 1000 - await health(page);
const tags = (page) => page.locator('.effect-tags').innerText();
const use = (page, slot) => page.keyboard.press(String(slot));
const click = (page) => page.locator('#game-container canvas').click();
const state = (page, slot) => page.getByTestId(`skill-slot-${slot}`).getAttribute('data-state');

test.describe('Hero skills: every skill on the real scene', () => {
    test.describe('Kael', () => {
        test('Corte Dimensional deals 1500 % and ignores 30 armor points: 9.75 x 1.4 against defense 50', async ({ page }) => {
            await startAs(page, 'kael', { monster: ARMORED });

            await use(page, 1);

            await expect.poll(() => dealt(page)).toBeCloseTo(9.75 * STAR, 5);
            expect(await state(page, 1)).toBe('cooling');
        });

        test('Investida do Baluarte deals 400 % and stops the boss countdown for 3 s', async ({ page }) => {
            await startAs(page, 'kael', { encounter: 'MINIBOSS' });

            expect(await elapsedAfter(page, 2, [ 2500, 500, 1000 ])).toEqual([ 0, 0, 1000 ]);
            expect(await dealt(page)).toBeCloseTo(4 * STAR, 5);
        });

        test('Brado Aterrador lowers the physical defense by 30 points for 10 s: a click goes from 0.5 to 0.8 (x 1.4) and back', async ({ page }) => {
            await startAs(page, 'kael', { monster: ARMORED });

            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(0.5 * STAR, 5);

            //  1.6 s without a click lets the combo of the first click lapse, so each click below is a plain one
            await advance(page, 1_600);
            await use(page, 3);
            await expect(page.locator('.effect-tags')).toContainText('Brado Aterrador');
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo((0.5 + 0.8) * STAR, 5);

            await advance(page, 10_500);
            await expect(page.locator('.effect-tags')).not.toContainText('Brado Aterrador');
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo((0.5 + 0.8 + 0.5) * STAR, 5);
        });
    });

    test.describe('Lyra', () => {
        test('Flecha Dupla hits twice for 300 %: 6 x 1.4', async ({ page }) => {
            await startAs(page, 'lyra');

            await use(page, 1);

            await expect.poll(() => dealt(page)).toBeCloseTo(6 * STAR, 5);
        });

        test('Tiro Preciso casts for 2 s and then lands a 3000 % critical: 60 x 1.4 x 2.5 (the 3 star critical multiplier)', async ({ page }) => {
            await startAs(page, 'lyra');

            await use(page, 2);
            await expect.poll(() => state(page, 2)).toBe('casting');
            expect(await dealt(page)).toBe(0);

            await advance(page, 2100);

            await expect.poll(() => dealt(page)).toBeCloseTo(30 * STAR * 2.5, 5);
            expect(await state(page, 2)).toBe('cooling');
        });

        test('Ventos Ligeiros adds 50 % to a click for 12 s', async ({ page }) => {
            await startAs(page, 'lyra');

            await use(page, 3);
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(1.5 * STAR, 5);

            await advance(page, 12_500);
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(2.5 * STAR, 5);
        });
    });

    test.describe('Orina', () => {
        test('Prisão de Espinhos raises the magical damage by 25 % for 2 s and roots the boss countdown', async ({ page }) => {
            await startAs(page, 'orina', { encounter: 'MINIBOSS' });

            expect(await elapsedAfter(page, 1, [ 1500, 500, 1000 ])).toEqual([ 0, 0, 1000 ]);
        });

        test('Tempestade Arcana ticks 200 % six times, once per second: 12 in total', async ({ page }) => {
            await startAs(page, 'orina');

            expect(await dealtAfter(page, 2, [ 1000, 5000, 1000 ])).toEqual([ 0, 2.8, 16.8, 16.8 ]);
        });

        test('Chuva de Meteoros deals 2500 % magical: 25 x 1.4', async ({ page }) => {
            await startAs(page, 'orina');

            await use(page, 3);

            await expect.poll(() => dealt(page)).toBeCloseTo(25 * STAR, 5);
        });
    });

    test.describe('Seraphine', () => {
        test('Bênção da Grande Árvore adds 30 % physical and 25 % click damage for 15 s: a click does 1.4 x 1.25 x 1.3 = 2.275', async ({ page }) => {
            await startAs(page, 'seraphine');

            await use(page, 1);
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(STAR * 1.25 * 1.3, 5);

            await advance(page, 15_500);
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(STAR * 1.25 * 1.3 + STAR, 5);
        });

        test('Luz Divina deals 800 % magical: 8 x 1.4', async ({ page }) => {
            await startAs(page, 'seraphine');
            await use(page, 2);
            await expect.poll(() => dealt(page)).toBeCloseTo(8 * STAR, 5);
        });

        test('Luz Divina against a darkness monster deals 8 x 1.5 x the element factor', async ({ page }) => {
            await startAs(page, 'seraphine', { monster: DARKNESS });

            await use(page, 2);

            await expect.poll(() => dealt(page)).toBeCloseTo(8 * 0.9 * 1.5 * STAR, 5);
        });

        test('Carrilhão da Aurora adds 4 s to the boss countdown', async ({ page }) => {
            await startAs(page, 'seraphine', { encounter: 'MINIBOSS' });

            await use(page, 3);

            await expect.poll(() => scene(page, '(s) => s.countdown.limitMs')).toBe(64_000);
            expect(await state(page, 3)).toBe('cooling');
        });
    });

    test.describe('Vex', () => {
        test('Bomba de Veneno ticks 100 % a second for 8 s: 8 in total', async ({ page }) => {
            await startAs(page, 'vex');

            expect(await dealtAfter(page, 1, [ 4000, 4000, 1000 ])).toEqual([ 0, 5.6, 11.2, 11.2 ]);
            await expect(page.locator('.effect-tags')).not.toContainText('Bomba de Veneno');
        });

        test('Bomba de Fumaça adds 15 critical points for 10 s: a roll of 50 crits only under it (the chance is 40, then 55)', async ({ page }) => {
            await startAs(page, 'vex', { roll: 0.5 });

            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(STAR, 5);

            //  1.6 s without a click lets the combo of the first click lapse
            await advance(page, 1_600);
            await use(page, 2);
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(STAR + STAR * 2.5, 5);

            await advance(page, 10_500);
            await click(page);
            await expect.poll(() => dealt(page)).toBeCloseTo(STAR * 2.5 + 2 * STAR, 5);
        });

        test('Golpe Sangrento deals 600 % and bleeds 150 % six times: 6 + 9', async ({ page }) => {
            await startAs(page, 'vex');

            expect(await dealtAfter(page, 3, [ 1000, 6000, 1000 ])).toEqual([ 8.4, 10.5, 21, 21 ]);
        });
    });
});
