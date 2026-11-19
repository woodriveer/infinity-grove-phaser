import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Hero team (spec hero-team): the Equipe screen, the HUD button and the slot purchase on the real game against the fake backend.
//  The player owns one blank card of each of the five heroes; `stars` adds a card of that many stars. A chapter 5 boss win is `cleared: [ 5 ]`.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

const enemy = (element) => ({ element, defense: 0, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });

//  A chapter whose boss has 1 health, to win it with one click
const bossOfOneHealth = {
    bossHealth: 1,
    bossTimeLimitMs: 60_000,
    boss: enemy('FIRE'),
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 10, minibossHealth: 10, minibossTimeLimitMs: 30_000, monster: enemy('FIRE'), miniboss: enemy('FIRE') } ]
};

const startTeam = async (page, {
    chapter = 5, stage = 1, encounter = 'PHASE', cleared = [ 5 ], copper = 0, team, leader = 'kael', stars = {}, equipment, talents, definition, lastChapter, roll
} = {}) => {
    const copies = {
        ...Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ])),
        ...Object.fromEntries(Object.entries(stars).map(([ id, count ]) => [ `${id}:${count}`, 1 ]))
    };
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        cards: { yan: { leader, cleared, copies } },
        progress: { yan: { chapter, stage, encounter, phase: 1 } },
        wallets: { yan: copper },
        team: team ? { yan: team } : {},
        ...(equipment && { equipment: { yan: equipment } }),
        ...(talents && { talents: { yan: talents } }),
        ...(definition && { definition }),
        ...(lastChapter && { lastChapter })
    });
    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    //  The heroes load in the background; the skill bar of the leader is the sign that they did
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return handle;
};

const openTeam = async (page) => {
    await page.getByTestId('hud-team').click();
    await expect(page.getByTestId('team-screen')).toBeVisible();
};

//  The box of a DOM element in scene px (the scene is 1024 px wide)
const sceneBox = async (page, locator) => {
    const canvas = await page.locator('#game-container canvas').boundingBox();

    await locator.waitFor({ state: 'visible' });

    const box = await locator.boundingBox();
    const scale = canvas.width / 1024;

    return { x: (box.x - canvas.x) / scale, y: (box.y - canvas.y) / scale, width: box.width / scale, height: box.height / scale };
};

const near = (actual, expected) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);

//  Moves the clock of the scene (its delayed calls) by `ms`
const tick = (page, ms) => page.evaluate((delta) => {
    const clock = window.__PHASER_GAME__.scene.getScene('ClickerGame').time;

    //  The clock takes a new delayed call into its active list in preUpdate, the way a frame of the loop does
    clock.preUpdate();
    clock.update(clock.now, delta);
    clock.preUpdate();
}, ms);

const slot = (page, index) => page.getByTestId(`team-slot-${index}`);

test.describe('Hero team: Equipe screen', () => {
    test('the Equipe button is absent before the chapter 5 boss is won and the rail keeps six buttons', async ({ page }) => {
        await startTeam(page, { cleared: [ 1, 2, 3, 4 ] });

        await expect(page.getByTestId('hud-team')).toHaveCount(0);
        await expect(page.locator('.hero-hud button')).toHaveCount(6);
    });

    test('the Equipe button sits right after Líder once the chapter 5 boss is won and the rail stays above the battle bar', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });

        expect(await page.locator('.hero-hud [data-testid^="hud-"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid)))
            .toEqual([ 'hud-heroes', 'hud-bag', 'hud-leader', 'hud-team', 'hud-equipment', 'hud-talents', 'hud-farm' ]);
        await expect(page.getByTestId('hud-team')).toHaveText('Equipe');

        const icon = page.getByTestId('hud-team').locator('svg');
        const box = await sceneBox(page, icon);

        near(box.width, 22);
        near(box.height, 22);
        await expect(icon).toHaveAttribute('stroke-width', '2.75');
        await expect(icon).toHaveCSS('stroke-width', '2.75px');

        const rail = await sceneBox(page, page.locator('.hero-hud'));

        expect(rail.y + rail.height).toBeLessThanOrEqual(624);
    });

    test('Equipe shows the leader card and four slot cards of 132 x 210 px, 16 px apart', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });
        await openTeam(page);

        await expect(page.locator('.hero-title')).toHaveText('Equipe');

        const boxes = [];

        for (let index = 0; index <= 4; index++)
        {
            const box = await sceneBox(page, slot(page, index));

            near(box.width, 132);
            near(box.height, 210);
            boxes.push(box);
        }

        for (let index = 0; index < 4; index++)
        {
            near(boxes[index + 1].x - (boxes[index].x + boxes[index].width), 16);
        }

        const labels = [ 'Líder', 'Aliado 1', 'Aliado 2', 'Aliado 3', 'Aliado 4' ];

        for (let index = 0; index <= 4; index++)
        {
            await expect(slot(page, index).locator('.team-slot-label')).toHaveText(labels[index]);
        }

        await expect(slot(page, 0)).toHaveCSS('border-top-width', '3px');
        await expect(slot(page, 0)).toHaveCSS('border-top-style', 'solid');
        await expect(slot(page, 0)).toHaveCSS('border-top-color', 'rgb(232, 182, 76)');
    });

    test('the leader card shows the leader\'s sprite, name, stars and bonus', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });
        await openTeam(page);

        const card = slot(page, 0);
        const portrait = await sceneBox(page, card.locator('img.team-portrait'));

        near(portrait.width, 80);
        near(portrait.height, 80);
        await expect(card.locator('img.team-portrait')).toHaveAttribute('src', /kael_sprite\.png$/);
        await expect(card.locator('.team-name')).toHaveText('Kael Raizférrea');
        await expect(card.locator('.team-stars')).toHaveText('0★');
        await expect(card.locator('.team-bonus')).toHaveText('+25% de dano contra chefes. (em breve)');
    });

    test('slot 1 is buyable with a coin and 1, and slots 2 to 4 wait behind the chapter 6 to 8 bosses', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], copper: 10_000 });
        await openTeam(page);

        const buyable = slot(page, 1);

        await expect(buyable).toHaveAttribute('data-state', 'buyable');
        await expect(buyable).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(buyable).toHaveCSS('border-top-color', 'rgb(224, 180, 90)');
        await expect(buyable).toHaveCSS('border-top-width', '2px');
        await expect(buyable).toHaveCSS('border-top-style', 'solid');

        const coin = await sceneBox(page, buyable.locator('.team-coin'));

        near(coin.width, 32);
        near(coin.height, 32);
        await expect(buyable.locator('.team-price')).toHaveText('1');

        for (const [ index, chapter ] of [ [ 2, 6 ], [ 3, 7 ], [ 4, 8 ] ])
        {
            await expect(slot(page, index)).toHaveAttribute('data-state', 'locked');
            await expect(slot(page, index)).toHaveCSS('opacity', '0.5');
            await expect(slot(page, index)).toBeDisabled();
            await expect(slot(page, index).locator('.team-lock-text')).toHaveText(`Chefe do capítulo ${chapter}`);
        }
    });

    test('a slot open behind an unbought one waits at half opacity with no chapter text', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6, 7 ] });
        await openTeam(page);

        for (const index of [ 2, 3 ])
        {
            await expect(slot(page, index)).toHaveAttribute('data-state', 'waiting');
            await expect(slot(page, index)).toHaveCSS('opacity', '0.5');
            await expect(slot(page, index)).toBeDisabled();
            await expect(slot(page, index).locator('.team-lock-text')).toHaveCount(0);
        }

        await expect(slot(page, 4)).toHaveAttribute('data-state', 'locked');
    });

    test('clicking the buyable slot asks Comprar a vaga 1 por 1 ouro? and Cancelar sends nothing', async ({ page }) => {
        const handle = await startTeam(page, { cleared: [ 5 ], copper: 10_000 });

        await openTeam(page);
        await slot(page, 1).click();

        await expect(page.getByTestId('team-buy-question')).toHaveText('Comprar a vaga 1 por 1 ouro?');
        await expect(page.getByTestId('team-buy-confirm')).toBeEnabled();

        await page.getByTestId('team-buy-cancel').click();

        await expect(page.getByTestId('team-buy-dialog')).toHaveCount(0);
        expect(handle.calls.filter((call) => call.path === '/team/slots')).toEqual([]);
    });

    test('with less than 1 ouro Comprar is disabled next to Moedas insuficientes', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], copper: 5_000 });
        await openTeam(page);
        await slot(page, 1).click();

        await expect(page.getByTestId('team-buy-confirm')).toBeDisabled();
        await expect(page.locator('.team-buy-short')).toHaveText('Moedas insuficientes');
    });

    test('Comprar buys slot 1: the slot flashes, the notice shows for 3 s, the wallet reads 0 and the new slot is empty and selected', async ({ page }) => {
        const handle = await startTeam(page, { cleared: [ 5 ], copper: 10_000 });

        await openTeam(page);
        await slot(page, 1).click();

        //  The loop is stopped, so the 400 ms of the flash and the 3000 ms of the notice (timers of the scene clock) move only with `tick`
        await page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
        await page.getByTestId('team-buy-confirm').click();

        await expect.poll(() => handle.calls.filter((call) => call.path === '/team/slots').map((call) => call.body)).toEqual([ { fromSlots: 0 } ]);

        await expect(slot(page, 1)).toHaveAttribute('data-flash', 'true');
        await expect(slot(page, 1)).toHaveCSS('background-color', 'rgb(243, 213, 138)');
        await expect(page.getByTestId('team-notice')).toHaveText('Vaga de aliado comprada!');
        await expect(page.getByTestId('team-notice')).toBeVisible();

        await tick(page, 399);
        await expect(slot(page, 1)).toHaveAttribute('data-flash', 'true');
        await tick(page, 1);
        await expect(slot(page, 1)).not.toHaveAttribute('data-flash', 'true');

        //  The notice stays up to 3000 ms after the purchase
        await tick(page, 2_599);
        await expect(page.getByTestId('team-notice')).toBeVisible();
        await tick(page, 1);
        await expect(page.getByTestId('team-notice')).toBeHidden();

        await expect(page.locator('.wallet')).toHaveText('Gold: 0 Silver: 0 Copper: 0');
        await expect(slot(page, 1)).toHaveAttribute('data-state', 'empty');
        await expect(slot(page, 1)).toHaveAttribute('data-selected', 'true');
        await expect(slot(page, 1).locator('.team-empty')).toHaveText('vazio');
        await expect(slot(page, 1)).toHaveCSS('border-top-style', 'dashed');
    });

    test('the slot row and the panel stay put when the purchase dialog opens, when the notice shows and when it goes', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], copper: 10_000 });
        await openTeam(page);

        const windowOf = () => sceneBox(page, page.locator('.hero-window'));
        const before = await sceneBox(page, slot(page, 1));
        const windowBefore = await windowOf();

        await slot(page, 1).click();
        await expect(page.getByTestId('team-buy-dialog')).toBeVisible();

        expect(await sceneBox(page, slot(page, 1))).toEqual(before);
        expect(await windowOf()).toEqual(windowBefore);

        //  The notice and the flash are timers of the scene clock, which moves only with `tick` while the loop sleeps
        await page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
        await page.getByTestId('team-buy-confirm').click();
        await expect(page.getByTestId('team-notice')).toBeVisible();

        expect(await sceneBox(page, slot(page, 1))).toEqual(before);
        expect(await windowOf()).toEqual(windowBefore);

        await tick(page, 3_000);
        await expect(page.getByTestId('team-notice')).toBeHidden();

        expect(await sceneBox(page, slot(page, 1))).toEqual(before);
        expect(await windowOf()).toEqual(windowBefore);
    });

    test('the slot row stays put when the dialog shows Moedas insuficientes', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ], copper: 5_000 });
        await openTeam(page);

        const before = await sceneBox(page, slot(page, 1));
        const windowBefore = await sceneBox(page, page.locator('.hero-window'));

        await slot(page, 1).click();
        await expect(page.locator('.team-buy-short')).toBeVisible();

        expect(await sceneBox(page, slot(page, 1))).toEqual(before);
        expect(await sceneBox(page, page.locator('.hero-window'))).toEqual(windowBefore);
    });

    test('a disabled available hero stays legible: its opacity is at least 0.75', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });
        await openTeam(page);

        const lyra = page.getByTestId('team-available-lyra');

        await expect(lyra).toBeDisabled();

        const opacity = await lyra.evaluate((node) => Number(getComputedStyle(node).opacity));

        expect(opacity).toBeGreaterThanOrEqual(0.75);
    });

    test('Comprar is disabled while the purchase runs', async ({ page }) => {
        const handle = await startTeam(page, { cleared: [ 5 ], copper: 10_000 });

        await openTeam(page);
        await slot(page, 1).click();

        const release = handle.holdTeam();

        await page.getByTestId('team-buy-confirm').click();

        await expect(page.getByTestId('team-buy-confirm')).toBeDisabled();
        await expect(page.getByTestId('team-buy-cancel')).toBeDisabled();

        release();

        await expect(page.getByTestId('team-buy-dialog')).toHaveCount(0);
    });

    test('a refused purchase shows Não foi possível comprar a vaga. and the stored slots', async ({ page }) => {
        const handle = await startTeam(page, { cleared: [ 5 ], copper: 10_000 });

        await openTeam(page);
        await slot(page, 1).click();
        handle.failNextTeamRequest({ status: 409, code: 'TEAM_SLOT_MISMATCH' });
        await page.getByTestId('team-buy-confirm').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível comprar a vaga.');
        await expect(page.getByTestId('team-screen')).toBeVisible();
        await expect(page.getByTestId('team-buy-dialog')).toHaveCount(0);
        await expect(slot(page, 1)).toHaveAttribute('data-state', 'buyable');
    });

    test('Heróis disponíveis lists the owned heroes outside the team, or says all are in it', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        await startTeam(page, { cleared: [ 5 ], copper: 10_000 });
        await openTeam(page);
        await slot(page, 1).click();
        await expect(page.getByTestId('team-buy-dialog')).toBeVisible();

        //  The 400 ms flash and the 3000 ms notice are timers of the scene clock that rebuild the panel: with the loop asleep they never
        //  replace the nodes measured below
        await page.evaluate(() => window.__PHASER_GAME__.loop.sleep());
        await page.getByTestId('team-buy-confirm').click();
        await expect(slot(page, 1)).toHaveAttribute('data-state', 'empty');

        await expect(page.locator('.team-available-title')).toHaveText('Heróis disponíveis');

        const lyra = page.getByTestId('team-available-lyra');
        const portrait = await sceneBox(page, lyra.locator('img'));

        near(portrait.width, 64);
        near(portrait.height, 64);
        await expect(lyra.locator('.team-hero-name')).toHaveText('Lyra Folhaveloz');
        await expect(lyra.locator('.team-hero-stars')).toHaveText('0★');
        await expect(lyra.locator('.team-hero-passive')).toHaveText('Olho do Falcão');
        expect(await page.locator('[data-testid^="team-available-"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid)))
            .toEqual([ 'team-available-lyra', 'team-available-orina', 'team-available-seraphine', 'team-available-vex' ]);
        await expect(page.getByTestId('team-available-kael')).toHaveCount(0);

        //  Another player holds the four allies: nothing is left to pick
        const context = await browser.newContext();
        const other = await context.newPage();

        await startTeam(other, {
            cleared: [ 5, 6, 7, 8 ], team: { boughtSlots: 4, allies: [ 'lyra', 'orina', 'seraphine', 'vex' ] }
        });
        await openTeam(other);

        await expect(other.locator('.team-available-empty')).toHaveText('Todos os heróis estão na equipe.');
        await expect(other.locator('[data-testid^="team-available-"]')).toHaveCount(0);
        await context.close();
    });

    test('Dano da equipe reads 0/s with no ally', async ({ page }) => {
        await startTeam(page, { cleared: [ 5 ] });
        await openTeam(page);

        await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe: 0/s');
    });

    test('below chapter 5 the panel says A equipe luta a partir do capítulo 5.', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        await startTeam(page, { chapter: 3, cleared: [ 5 ] });
        await openTeam(page);

        await expect(page.getByTestId('team-status')).toBeVisible();
        await expect(page.getByTestId('team-status')).toHaveText('A equipe luta a partir do capítulo 5.');

        const context = await browser.newContext();
        const other = await context.newPage();

        await startTeam(other, { chapter: 5, cleared: [ 5 ] });
        await openTeam(other);

        await expect(other.getByTestId('team-status')).toBeHidden();
        await context.close();
    });

    test('winning the chapter 5 boss shows the Equipe button without a reload', async ({ page }) => {
        await startTeam(page, {
            chapter: 5, encounter: 'CHAPTER_BOSS', cleared: [], lastChapter: 6, definition: bossOfOneHealth
        });

        await expect(page.getByTestId('hud-team')).toHaveCount(0);
        await page.evaluate(() => { window.__sameDocument = true; });
        await page.locator('#game-container canvas').click();

        await expect(page.getByTestId('hud-team')).toBeVisible();
        expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
    });

    test('a 12.5K shown damage reads Dano: 12.5K/s', async ({ page }) => {
        const weapon = { id: 'w1', slot: 'WEAPON', rarity: 'COMMON', baseClick: 624, refine: 0, affixes: [], heroId: 'lyra' };

        await startTeam(page, {
            cleared: [ 5 ], stars: { lyra: 9 }, equipment: [ weapon ], team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] }
        });
        await openTeam(page);

        await expect(slot(page, 1).locator('.team-dps-line')).toHaveText('Dano: 12.5K/s');
        await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe: 12.5K/s');
    });

    test('winning the chapter 6 boss opens slot 2 for purchase without a reload', async ({ page }) => {
        await startTeam(page, {
            chapter: 6, encounter: 'CHAPTER_BOSS', cleared: [ 5 ], copper: 20_000, lastChapter: 7, definition: bossOfOneHealth,
            team: { boughtSlots: 1, allies: [ null, null, null, null ] }
        });
        await openTeam(page);

        await expect(slot(page, 2)).toHaveAttribute('data-state', 'locked');
        await expect(slot(page, 2).locator('.team-lock-text')).toHaveText('Chefe do capítulo 6');
        await page.getByRole('button', { name: 'Fechar' }).click();
        await page.evaluate(() => { window.__sameDocument = true; });
        await page.locator('#game-container canvas').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 7');
        await openTeam(page);

        await expect(slot(page, 2)).toHaveAttribute('data-state', 'buyable');
        await expect(slot(page, 2).locator('.team-price')).toHaveText('2');
        expect(await page.evaluate(() => window.__sameDocument)).toBe(true);
    });
});
