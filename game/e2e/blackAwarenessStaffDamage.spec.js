import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The Cajado da Consciência Negra on the real scene (spec black-awareness-staff): +200 % damage against a DARKNESS monster, so x3, on every strike
//  kind. Vex holds a 3 star card, so the click carries the star bonus of 40 % click damage, 30 points of critical chance and a weapon of 10 click
//  damage: the base damage is (1 + 10) x 1.4 = 15.4 and the critical chance 10 + 30 + 9 = 49, so the roll 0.99 never crits. Time moves with
//  scene.update(), not with the clock.
const BASE = 15.4;
const HEALTH = 1000;

const STAFF_ON = {
    id: 'staff', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, baseClick: 10, heroId: 'vex', special: 'BLACK_AWARENESS_STAFF',
    affixes: [ { type: 'CRIT_CHANCE', base: 9 }, { type: 'BOSS_DAMAGE_PCT', base: 25 }, { type: 'BOSS_TIME_SECONDS', base: 5 }, { type: 'ARMOR_PIERCE_PCT', base: 25 } ]
};
const { special: _special, ...PLAIN_ON } = STAFF_ON;
const BAG_STAFF = { ...STAFF_ON, id: 'bag-staff', heroId: null };

const monsterOf = (element) => ({ element, defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });

const chapter = (monster, health) => ({
    bossHealth: health,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: health, minibossHealth: health, minibossTimeLimitMs: 60_000,
        monster, miniboss: monster
    } ]
});

//  Starts the battle of `heroId` (leader, 3 stars) wearing `equipment` against `element` monsters of `health`; waits until the gear reached the attacker
//  (the staff gives 200 darkness points, any other gear 0)
const startAs = async (page, heroId, equipment, { element = 'DARKNESS', health = HEALTH, chapterNumber = 1, autoClickOff = false } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monsterOf(element), health),
        cards: { yan: { leader: heroId, copies: { [`${heroId}:3`]: 1 } } },
        progress: { yan: { chapter: chapterNumber, stage: 1, encounter: 'PHASE', phase: 1 } },
        equipment: { yan: equipment }
    });

    if (autoClickOff)
    {
        //  The auto click runs on its own in real time from chapter 2: the preference of the player keeps it off until the test steps it
        await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));
    }

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-3')).toHaveAttribute('data-unlocked', 'true');
    await expect.poll(() => health_(page)).toBe(health);

    const worn = equipment.filter((piece) => piece.heroId === heroId);
    const darkness = worn.some((piece) => piece.special) ? 200 : 0;

    await expect.poll(() => scene(page, '(s) => s.leaderPieces().length')).toBe(worn.length);
    await expect.poll(() => scene(page, '(s) => s.leaderAttacker().darknessDamagePct ?? 0')).toBe(darkness);

    return menu;
};

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const health_ = (page) => scene(page, '(s) => s.monster?.health');
const advance = (page, ms) => page.evaluate((delta) => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, delta), ms);
const use = (page, slot) => page.keyboard.press(String(slot));
const dealt = async (page, health = HEALTH) => health - await health_(page);

//  Strikes the monster once; returns the damage dealt so far
const strikeNow = (page) => page.evaluate((start) => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.strike(512);

    return Math.round((start - game.monster.health) * 1e6) / 1e6;
}, HEALTH);

//  Uses the skill, then moves the clock by each step inside one call, so no real frame runs in between: the total dealt after the use and after each step
const dealtAfter = (page, slot, steps) => page.evaluate(({ slot: number, steps: list, start }) => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');
    const total = () => Math.round((start - game.monster.health) * 1e6) / 1e6;

    game.useSkill(number);

    return [ total(), ...list.map((ms) => { game.update(0, ms); return total(); }) ];
}, { slot, steps, start: HEALTH });

//  One auto click: the switch is on only for one step of 500 ms of fight time, taken inside one call; returns the damage dealt
const autoClickOnce = (page) => page.evaluate((start) => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.autoClickEnabled = true;
    game.autoClicker.elapsedMs = 0;
    game.update(0, 500);
    game.autoClickEnabled = false;

    return Math.round((start - game.monster.health) * 1e6) / 1e6;
}, HEALTH);

//  Plays the same fight in a clean browser context (a stored session would skip the login form) and returns what `play` read
const inFreshPage = async (browser, play) => {
    const context = await browser.newContext();

    try { return await play(await context.newPage()); }
    finally { await context.close(); }
};

test.describe('Black awareness staff damage', () => {
    test('one click on a DARKNESS monster deals 46.2 with the staff', async ({ page }) => {
        await startAs(page, 'vex', [ STAFF_ON ]);

        expect(await strikeNow(page)).toBeCloseTo(BASE * 3, 5);
    });

    test('the same click with a plain legendary weapon deals 15.4', async ({ page }) => {
        await startAs(page, 'vex', [ PLAIN_ON ]);

        expect(await strikeNow(page)).toBeCloseTo(BASE, 5);
    });

    test('a staff in the bag gives nothing', async ({ page }) => {
        await startAs(page, 'vex', [ PLAIN_ON, BAG_STAFF ]);

        expect(await strikeNow(page)).toBeCloseTo(BASE, 5);
    });

    test('a staff worn by another hero gives the leader nothing', async ({ page }) => {
        await startAs(page, 'vex', [ PLAIN_ON, { ...STAFF_ON, id: 'lyra-staff', heroId: 'lyra' } ]);

        expect(await strikeNow(page)).toBeCloseTo(BASE, 5);
    });

    test('against a FIRE monster the staff changes nothing: 27.72', async ({ page }) => {
        await startAs(page, 'vex', [ STAFF_ON ], { element: 'FIRE' });

        expect(await strikeNow(page)).toBeCloseTo(BASE * 1.8, 5);
    });

    test('Golpe Sangrento deals 277.2 at once and bleeds 69.3 a second', async ({ page }) => {
        await startAs(page, 'vex', [ STAFF_ON ]);

        const [ first, second ] = await dealtAfter(page, 3, [ 1000 ]);

        expect(first).toBeCloseTo(6 * BASE * 3, 5);
        expect(second).toBeCloseTo(6 * BASE * 3 + 1.5 * BASE * 3, 5);
        expect(first).toBeCloseTo(277.2, 5);
        expect(second).toBeCloseTo(346.5, 5);
    });

    test('the auto click deals 3 times with the staff what it deals with a plain weapon', async ({ page, browser }) => {
        await startAs(page, 'vex', [ STAFF_ON ], { chapterNumber: 2, autoClickOff: true });
        await expect.poll(() => scene(page, '(s) => s.autoClickOpen')).toBe(true);

        const withStaff = await autoClickOnce(page);

        const plain = await inFreshPage(browser, async (other) => {
            await startAs(other, 'vex', [ PLAIN_ON ], { chapterNumber: 2, autoClickOff: true });
            await expect.poll(() => scene(other, '(s) => s.autoClickOpen')).toBe(true);

            return autoClickOnce(other);
        });

        expect(withStaff).toBeCloseTo(46.2, 5);
        expect(plain).toBeCloseTo(15.4, 5);
        expect(withStaff / plain).toBeCloseTo(3, 5);
    });

    test('the aimed shot deals 3 times with the staff what it deals with a plain weapon', async ({ page, browser }) => {
        //  A shot of 1155 would kill a monster of 1000, so the monsters have 100000 health
        const shot = async (target, weapon) => {
            await startAs(target, 'lyra', [ weapon ], { health: 100_000 });
            await use(target, 2);
            await advance(target, 2100);
            await expect.poll(() => dealt(target, 100_000)).toBeGreaterThan(0);

            return dealt(target, 100_000);
        };

        const withStaff = await shot(page, { ...STAFF_ON, heroId: 'lyra' });
        const plain = await inFreshPage(browser, (other) => shot(other, { ...PLAIN_ON, heroId: 'lyra' }));

        expect(plain).toBeGreaterThan(0);
        expect(withStaff / plain).toBeCloseTo(3, 5);
    });
});
