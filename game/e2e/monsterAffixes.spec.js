import { expect, test } from './support/coverage';
import {
    ARMORED, REGENERATION, SHELL, SHIELD, advance, affixChapter, chip, clickMonster, damageTexts, freeze, health, hp, scene, startFight
} from './support/affixFight';

//  The affix rules of minibosses and chapter bosses on the real scene (spec early-game-rebalance, Affix Rules and Affixes AC 4 to 12). The miniboss has 100 health, defense 0
//  and critical resistance 100, so a blank Kael click deals exactly 1 and never crits; the loop sleeps and time moves only with advance(page, ms) (L-112).
const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };
const COMPLETED = { chapter: 1, stage: 1, encounter: 'CHAPTER_BOSS', phase: 1, completed: true };

//  Puts the monster at `value` health and redraws its bar, as a fight in progress would
const setHealth = (page, value) => scene(page, `(s) => { s.monster.health = ${value}; s.updateHealthBar(); }`);
const pause = (page) => scene(page, '(s) => s.escape()');

test.describe('Carapaça', () => {
    test('a click of 3 on a Carapaça 2 miniboss takes 1 health', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(2) }), talents: { CLICK_FLAT_DAMAGE: 2 } });

        await clickMonster(page);

        expect(await health(page)).toBe(99);
        await expect(hp(page)).toHaveText('HP 99/100');
        expect(await damageTexts(page)).toEqual([ '1' ]);
    });

    test('a click of 1 on a Carapaça 2 miniboss takes nothing and shows 0', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(2) }) });

        await clickMonster(page);

        expect(await health(page)).toBe(100);
        await expect(hp(page)).toHaveText('HP 100/100');
        expect(await damageTexts(page)).toEqual([ '0' ]);
    });
});

test.describe('Escudo de golpes', () => {
    test('3 clicks on a 3-charge shield take nothing, the 4th takes 1', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(3) }) });

        await clickMonster(page, 3);

        expect(await health(page)).toBe(100);
        expect(await damageTexts(page)).toEqual([ '0', '0', '0' ]);

        await clickMonster(page);

        expect(await health(page)).toBe(99);
        await expect(hp(page)).toHaveText('HP 99/100');
    });

    test('6000 ms of countdown after the last charge bring the shield back and the next click takes nothing', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(1) }) });

        //  The only charge goes
        await clickMonster(page);
        expect(await health(page)).toBe(100);

        //  5999 ms later the shield is still down: a click takes 1
        await advance(page, 5_999);
        await clickMonster(page);
        expect(await health(page)).toBe(99);

        //  6000 ms in all: the shield is back and the next click is absorbed
        await advance(page, 1);
        await clickMonster(page);
        expect(await health(page)).toBe(99);
    });

    test('a shield that went down 6000 ms ago in one step is back for the next click', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(2) }) });

        await clickMonster(page, 2);
        await advance(page, 6_000);
        await clickMonster(page);

        expect(await health(page)).toBe(100);
        await expect(chip(page)).toHaveText('Escudo de golpes: 1/2');
    });

    test('the recharge does not run while the game is paused', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(1) }) });

        await clickMonster(page);
        await pause(page);
        await expect(page.locator('.pause-menu')).toBeVisible();
        await advance(page, 10_000);
        await pause(page);
        await expect(page.locator('.pause-menu')).toBeHidden();

        //  Still down: a click takes 1
        await clickMonster(page);
        expect(await health(page)).toBe(99);
    });
});

test.describe('Regeneração', () => {
    test('Regeneração 1000 on a miniboss at 50 of 100 heals 10 a second', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: REGENERATION(1000) }) });
        await setHealth(page, 50);

        await advance(page, 1_000);

        await expect(hp(page)).toHaveText('HP 60/100');
        expect(await health(page)).toBeCloseTo(60, 5);
    });

    test('Regeneração 50 on a miniboss of 1000 health heals 5 a second, in proportion to the time', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: REGENERATION(50), minibossHealth: 1000 }) });
        await setHealth(page, 500);

        await advance(page, 1_000);
        expect(await health(page)).toBeCloseTo(505, 5);

        await advance(page, 200);
        expect(await health(page)).toBeCloseTo(506, 5);
    });

    test('Regeneração does not heal above the maximum', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: REGENERATION(1000) }) });
        await setHealth(page, 95);

        await advance(page, 1_000);

        await expect(hp(page)).toHaveText('HP 100/100');
        expect(await health(page)).toBe(100);

        await advance(page, 5_000);

        expect(await health(page)).toBe(100);
    });

    test('Regeneração stops while Stun stops the countdown', async ({ page }) => {
        //  Kael with 3 stars owns Investida do Baluarte (slot 2): a hit and a Stun of 3000 ms
        await startFight(page, { definition: affixChapter({ affix: REGENERATION(1000) }), stars: 3 });
        await setHealth(page, 50);
        await scene(page, '(s) => s.useSkill(2)');

        const stunned = await health(page);

        expect(stunned).toBeLessThan(50);

        await advance(page, 3_000);
        expect(await health(page)).toBeCloseTo(stunned, 5);

        await advance(page, 1_000);
        expect(await health(page)).toBeCloseTo(stunned + 10, 5);
    });
});

test.describe('Blindado', () => {
    test('Blindado +20 on a defense 33 miniboss reads Defesa 53% and a click deals 0.47', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: ARMORED(20), defense: 33 }) });

        await expect(page.locator('.enemy-stats')).toContainText('Defesa 53%');

        await clickMonster(page);

        expect(await health(page)).toBeCloseTo(99.53, 5);
    });
});

test.describe('Every strike goes through the affix', () => {
    test('an ally hit on a shielded miniboss takes a charge', async ({ page }) => {
        await startFight(page, {
            definition: affixChapter({ affix: SHIELD(3) }), progress: { chapter: 5, stage: 1, encounter: 'MINIBOSS', phase: 1 }, team: LYRA_IN_SLOT_1
        });

        await expect(chip(page)).toHaveText('Escudo de golpes: 3/3');

        await advance(page, 1_000);

        await expect(chip(page)).toHaveText('Escudo de golpes: 2/3');
        expect(await health(page)).toBe(100);
    });

    test('a damage-over-time tick on a Carapaça miniboss loses the shell', async ({ page }) => {
        //  A 3-star Vex ticks 100 % of 1.4 a second with Bomba de Veneno; against Carapaça 1 each tick lands 0.4
        await startFight(page, { definition: affixChapter({ affix: SHELL(1), element: 'DARKNESS' }), leader: 'vex', stars: 3 });
        await scene(page, '(s) => s.useSkill(1)');

        await advance(page, 4_000);

        expect(await health(page)).toBeCloseTo(100 - 4 * 0.4, 5);
    });
});

test.describe('Farm and payload', () => {
    test('a farm fight of a miniboss with Escudo de golpes applies the shield', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(3) }), progress: COMPLETED, stop: false, monster: false });

        await page.getByTestId('hud-farm').click();
        await page.getByTestId('farm-entry-miniboss-1').click();
        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1');
        await expect(chip(page)).toHaveText('Escudo de golpes: 3/3');
        await freeze(page);

        await clickMonster(page, 3);

        expect(await health(page)).toBe(100);

        await clickMonster(page);

        expect(await health(page)).toBe(99);
    });

    test('a payload with minibossAffix null, missing or of an unknown type fights with no affix', async ({ browser }) => {
        //  Three games boot in this scenario
        test.setTimeout(240_000);

        for (const affix of [ null, 'omit', { type: 'NOPE', amount: 3, periodMs: null } ])
        {
            const context = await browser.newContext();
            const page = await context.newPage();

            await startFight(page, { definition: affixChapter({ affix }) });

            await clickMonster(page);

            expect(await health(page)).toBe(99);
            await expect(chip(page)).toBeHidden();
            await expect(chip(page)).toHaveText('');
            await expect(chip(page)).toHaveAttribute('data-affix', '');
            await context.close();
        }
    });
});
