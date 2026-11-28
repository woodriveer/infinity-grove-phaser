import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Hero team (spec hero-team): the allies on the field of the real scene. The player owns one blank card of each of the five heroes.
//  The auto click is switched off (chapter 5 opens it). Where a position is read the Phaser loop is stopped once the game has loaded, so
//  no real frame moves a sprite; the attack motion runs in real time on a woken loop. team(page) lands the team's part of a click.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

const monsterOf = (element) => ({ element, defense: 0, critResistance: 0 });

//  Phase monsters, minibosses and the boss with 1000 health, so no hit kills one
const chapter = (monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    bossDropRuleId: 3,
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster, monsterDropRuleId: 1, minibossDropRuleId: 2
    } ]
});

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const health = (page) => scene(page, '(s) => s.monster?.health');
const sprites = (page) => scene(page, '(s) => [ ...s.allySprites ].map(([ slot, o ]) => ({ slot, key: o.texture.key, x: o.x, y: o.y, width: o.displayWidth, height: o.displayHeight, depth: o.depth, originX: o.originX, originY: o.originY }))');
const leaderSprite = (page) => scene(page, '(s) => ({ key: s.character.texture.key, x: s.character.x, y: s.character.y, width: s.character.displayWidth, height: s.character.displayHeight, depth: s.character.depth, originX: s.character.originX, originY: s.character.originY })');

//  Stops the loop
const freeze = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
const wake = (page) => page.evaluate(() => window.__PHASER_GAME__.loop.wake());
//  The team's part of a click without the click: lands it on the target, then the kill path, as strike does
const team = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.teamStrike(game.currentTarget());
    game.afterDamage();
});

const startTeam = async (page, { chapter: campaignChapter = 5, cleared = [ 5 ], team, leader = 'kael', stop = true, encounter = 'PHASE', definition, lastChapter } = {}) => {
    const copies = Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ]));

    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: definition ?? chapter(monsterOf('FIRE')),
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: { chapter: campaignChapter, stage: 1, encounter, phase: 1 } },
        team: team ? { yan: team } : {},
        ...(lastChapter && { lastChapter })
    });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    if (stop)
    {
        await freeze(page);
        await expect.poll(() => health(page)).toBe(1000);
    }

    return menu;
};

const near = (actual, expected, tolerance = 0.1) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
const at = (sprite, key, x, y, depth) => {
    expect(sprite).toMatchObject({ key, x, y, depth, originX: 0.5, originY: 1 });
};

const TWO_ALLIES = { boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] };
const FOUR_ALLIES = { boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] };
const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };

const removeAlly = async (page, slot) => {
    await page.getByTestId(`team-slot-${slot}`).click();
    await page.getByTestId('team-remove').click();
    await expect(page.getByTestId(`team-slot-${slot}`)).toHaveAttribute('data-state', 'empty');
};

test.describe('Hero team: allies on the field', () => {
    test('Lyra in slot 1 and Seraphine in slot 2 stand at (180, 460) and (180, 605) behind the leader at (320, 600)', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6 ], team: TWO_ALLIES });

        const drawn = await sprites(page);

        expect(drawn.map(({ slot }) => slot)).toEqual([ 1, 2 ]);
        at(drawn[0], 'hero_lyra', 180, 460, 0.4);
        at(drawn[1], 'hero_seraphine', 180, 605, 0.4);
        at(await leaderSprite(page), 'hero_kael', 320, 600, 0.5);
    });

    test('slots 3 and 4 stand at (75, 462) and (75, 615) at depth 0.3', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6, 7, 8 ], team: FOUR_ALLIES });

        const drawn = await sprites(page);

        expect(drawn.map(({ slot }) => slot)).toEqual([ 1, 2, 3, 4 ]);
        at(drawn[2], 'hero_seraphine', 75, 462, 0.3);
        at(drawn[3], 'hero_vex', 75, 615, 0.3);
    });

    test('the highest ally stands at least 12 px under the Elementos panel, and no ally box overlaps another', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6, 7, 8 ], team: FOUR_ALLIES });

        const canvas = await page.locator('#game-container canvas').boundingBox();
        const wheel = await page.locator('.hud-wheel').boundingBox();
        const wheelBottom = (wheel.y + wheel.height - canvas.y) / (canvas.width / 1024);
        const drawn = await sprites(page);
        const boxes = drawn.map(({ x, y, width, height }) => ({ left: x - width / 2, right: x + width / 2, top: y - height, bottom: y }));

        expect(Math.min(...boxes.map(({ top }) => top)) - wheelBottom).toBeGreaterThanOrEqual(12);

        boxes.forEach((box, index) => boxes.slice(index + 1).forEach((other) => {
            const apart = box.right <= other.left || other.right <= box.left || box.bottom <= other.top || other.bottom <= box.top;

            expect(apart).toBe(true);
        }));
    });

    test('Kael in an ally box measures 90 x 83.7 and Lyra 40.8 x 120', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6 ], leader: 'orina', team: { boughtSlots: 2, allies: [ 'kael', 'lyra', null, null ] } });

        const drawn = await sprites(page);

        near(drawn[0].width, 90);
        near(drawn[0].height, 83.7);
        near(drawn[1].width, 40.8);
        near(drawn[1].height, 120);
    });

    test('Kael leading the formation measures 180 x 167.4 and Lyra 81.6 x 240', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        await startTeam(page, { team: { boughtSlots: 1, allies: [ 'orina', null, null, null ] } });

        const kael = await leaderSprite(page);

        near(kael.width, 180);
        near(kael.height, 167.4);

        const context = await browser.newContext();
        const other = await context.newPage();

        await startTeam(other, { leader: 'lyra', team: { boughtSlots: 1, allies: [ 'orina', null, null, null ] } });

        const lyra = await leaderSprite(other);

        near(lyra.width, 81.6);
        near(lyra.height, 240);
        await context.close();
    });

    test('each team strike moves the sprite 24 px right and back', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });
        expect((await sprites(page))[0].x).toBe(180);

        //  The team strike lands now; the motion is a Phaser tween, so it runs on the woken loop in real time
        await team(page);
        await page.evaluate(() => {
            const sprite = window.__PHASER_GAME__.scene.getScene('ClickerGame').allySprites.get(1);
            const trace = [];
            const follow = () => { trace.push(sprite.x); requestAnimationFrame(follow); };

            window.__trace = trace;
            requestAnimationFrame(follow);
        });
        await wake(page);
        await page.waitForFunction(() => window.__trace.length > 1 && window.__trace.at(-1) === 180 && Math.max(...window.__trace) > 180, null, { polling: 'raf', timeout: 1_000 });

        const trace = await page.evaluate(() => window.__trace);

        expect(Math.max(...trace)).toBeCloseTo(204, 5);
        expect(trace.at(-1)).toBe(180);
    });

    test('the attack motion is one yoyo tween of 100 ms each way', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });
        await team(page);

        //  The loop is stopped, so the tween the team strike made is still at its start
        const tweens = await scene(page, '(s) => s.tweens.getTweens().filter((t) => t.targets[0].texture?.key === "hero_lyra").map((t) => ({ duration: t.data[0].duration, yoyo: t.data[0].yoyo }))');

        expect(tweens).toEqual([ { duration: 100, yoyo: true } ]);
    });

    test('the allies appear at the next encounter once the campaign reaches chapter 5', async ({ page }) => {
        const boss = monsterOf('FIRE');
        const bossOfOneHealth = {
            bossHealth: 1, bossTimeLimitMs: 60_000, boss, bossDropRuleId: 3,
            stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster: boss, miniboss: boss, monsterDropRuleId: 1, minibossDropRuleId: 2 } ]
        };

        await startTeam(page, { chapter: 4, encounter: 'CHAPTER_BOSS', team: LYRA_IN_SLOT_1, definition: bossOfOneHealth, lastChapter: 6, stop: false });

        //  Chapter 4: the team is inactive and the leader stands where it always stood
        expect(await sprites(page)).toEqual([]);
        near((await leaderSprite(page)).y, 612);

        await page.locator('#game-container canvas').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 5');
        await expect.poll(async () => (await sprites(page)).length).toBe(1);

        at((await sprites(page))[0], 'hero_lyra', 180, 460, 0.4);
        at(await leaderSprite(page), 'hero_kael', 320, 600, 0.5);
    });

    test('Remover on both allies brings the leader back to (230, 612) at 320 px high', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6 ], team: TWO_ALLIES });
        expect(await sprites(page)).toHaveLength(2);

        await page.getByTestId('hud-team').click();
        await removeAlly(page, 1);
        await removeAlly(page, 2);

        await expect.poll(async () => (await sprites(page)).length).toBe(0);

        const leader = await leaderSprite(page);

        expect(leader).toMatchObject({ key: 'hero_kael', x: 230, y: 612 });
        near(leader.height, 320);
    });

    test('Tornar líder redraws the formation with the new leader', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await page.getByTestId('hud-team').click();
        await page.getByTestId('team-slot-1').click();
        await page.getByTestId('team-make-leader').click();

        await expect.poll(async () => (await leaderSprite(page)).key).toBe('hero_lyra');
        at(await leaderSprite(page), 'hero_lyra', 320, 600, 0.5);
        at((await sprites(page))[0], 'hero_kael', 180, 460, 0.4);
    });

    test('after a reset to chapter 1 no ally is drawn at the next encounter', async ({ page }) => {
        await startTeam(page, { chapter: 6, team: LYRA_IN_SLOT_1, stop: false });
        await expect.poll(async () => (await sprites(page)).length).toBe(1);

        await page.getByTestId('auto-click-button').click();
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await page.getByTestId('reset-account').click();
        await page.getByTestId('reset-confirm').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');

        await expect.poll(async () => (await sprites(page)).length).toBe(0);
        await expect.poll(async () => (await leaderSprite(page)).y).toBe(612);

        const leader = await leaderSprite(page);

        expect(leader).toMatchObject({ key: 'hero_kael', x: 230, y: 612 });
        near(leader.height, 320);
    });

    test('an empty bought slot draws no sprite', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6 ], team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] } });

        expect((await sprites(page)).map(({ slot }) => slot)).toEqual([ 1 ]);
    });

    test('a click on an ally sprite still hits the monster', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1, stop: false });

        //  Lyra stands in x 160 to 200, y 340 to 460: the point is on her sprite
        const canvas = await page.locator('#game-container canvas').boundingBox();
        const scale = canvas.width / 1024;

        await page.mouse.click(canvas.x + 180 * scale, canvas.y + 400 * scale);

        //  The click number of 1 is yellow; the ally numbers are light blue
        await expect.poll(() => scene(page, '(s) => s.children.list.filter((o) => o.type === "Text" && o.style.color === "#ffd35c").map((o) => o.text)')).toEqual([ '1' ]);
    });
});
