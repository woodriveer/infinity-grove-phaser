import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Hero team (spec hero-team): placing, replacing and removing allies, the leader swap, the busy state and the failures of the Equipe screen.
//  The player owns one blank card of each of the five heroes; `stars` adds a card of that many stars. A chapter 5 boss win is `cleared: [ 5 ]`.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

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

const slot = (page, index) => page.getByTestId(`team-slot-${index}`);
const pick = (page, heroId) => page.getByTestId(`team-available-${heroId}`);
//  The bodies of the requests the game sent to a route, in order
const bodiesOf = (handle, method, path) => handle.calls.filter((call) => call.method === method && call.path === path).map((call) => call.body);

const LYRA_IN_SLOT_1 = { boughtSlots: 1, allies: [ 'lyra', null, null, null ] };

test.describe('Hero team: editing', () => {
    test('clicking an available hero fills the selected empty slot and shows its damage and passive', async ({ page }) => {
        const handle = await startTeam(page, { team: { boughtSlots: 1, allies: [ null, null, null, null ] } });

        await openTeam(page);
        await slot(page, 1).click();
        await pick(page, 'lyra').click();

        await expect.poll(() => bodiesOf(handle, 'PUT', '/team')).toEqual([ { allies: [ 'lyra', null, null, null ] } ]);
        await expect(slot(page, 1)).toHaveAttribute('data-state', 'filled');
        await expect(slot(page, 1).locator('.team-name')).toHaveText('Lyra Folhaveloz');
        await expect(slot(page, 1).locator('.team-stars')).toHaveText('0★');
        await expect(slot(page, 1).locator('.team-dps-line')).toHaveText('Dano: 2/s');
        await expect(slot(page, 1).locator('.team-passive')).toHaveText('Olho do Falcão: +10 de chance de crítico');
    });

    test('with no slot selected an available hero goes to the first empty bought slot', async ({ page }) => {
        const handle = await startTeam(page, { cleared: [ 5, 6 ], team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] } });

        await openTeam(page);
        await pick(page, 'orina').click();

        await expect.poll(() => bodiesOf(handle, 'PUT', '/team')).toEqual([ { allies: [ 'lyra', 'orina', null, null ] } ]);
        await expect(slot(page, 2).locator('.team-name')).toHaveText('Orina Brumaestrela');
    });

    test('an available hero replaces the hero of the selected slot', async ({ page }) => {
        const handle = await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await openTeam(page);
        await expect(pick(page, 'lyra')).toHaveCount(0);
        await slot(page, 1).click();
        await pick(page, 'vex').click();

        await expect.poll(() => bodiesOf(handle, 'PUT', '/team')).toEqual([ { allies: [ 'vex', null, null, null ] } ]);
        await expect(slot(page, 1).locator('.team-name')).toHaveText('Vex Sombraespinho');
        await expect(pick(page, 'lyra')).toBeVisible();
        await expect(pick(page, 'vex')).toHaveCount(0);
    });

    test('with every bought slot full and none selected the available heroes are disabled', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });
        await openTeam(page);

        const states = await page.locator('[data-testid^="team-available-"]').evaluateAll((nodes) => nodes.map((node) => [ node.dataset.testid, node.disabled ]));

        expect(states).toEqual([
            [ 'team-available-orina', true ], [ 'team-available-seraphine', true ], [ 'team-available-vex', true ]
        ]);
    });

    test('selecting a filled card outlines it and enables Remover and Tornar líder', async ({ page }) => {
        await startTeam(page, { team: LYRA_IN_SLOT_1 });
        await openTeam(page);

        await expect(page.getByTestId('team-remove')).toBeDisabled();
        await expect(page.getByTestId('team-make-leader')).toBeDisabled();
        await expect(slot(page, 1)).toHaveAttribute('data-selected', 'false');

        await slot(page, 1).click();

        await expect(slot(page, 1)).toHaveAttribute('data-selected', 'true');
        await expect(slot(page, 1)).toHaveCSS('outline-width', '3px');
        await expect(slot(page, 1)).toHaveCSS('outline-style', 'solid');
        await expect(slot(page, 1)).toHaveCSS('outline-color', 'rgb(232, 116, 42)');
        await expect(page.getByTestId('team-remove')).toBeEnabled();
        await expect(page.getByTestId('team-make-leader')).toBeEnabled();
    });

    test('Remover empties the slot and keeps it selected', async ({ page }) => {
        const handle = await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await openTeam(page);
        await slot(page, 1).click();
        await page.getByTestId('team-remove').click();

        await expect.poll(() => bodiesOf(handle, 'PUT', '/team')).toEqual([ { allies: [ null, null, null, null ] } ]);
        await expect(slot(page, 1)).toHaveAttribute('data-state', 'empty');
        await expect(slot(page, 1)).toHaveAttribute('data-selected', 'true');
    });

    test('Tornar líder swaps the leader with the ally', async ({ page }) => {
        const handle = await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await openTeam(page);
        await slot(page, 1).click();
        await page.getByTestId('team-make-leader').click();

        await expect.poll(() => bodiesOf(handle, 'PUT', '/leader')).toEqual([ { heroId: 'lyra' } ]);
        await expect(slot(page, 0).locator('.team-name')).toHaveText('Lyra Folhaveloz');
        await expect(slot(page, 1).locator('.team-name')).toHaveText('Kael Raizférrea');
        await expect(page.locator('[data-testid^="team-slot-"][data-selected="true"]')).toHaveCount(0);
        await expect(page.getByTestId('leader-card')).toContainText('Lyra');
    });

    test('while a team request runs every card, entry and action is disabled and Fechar stays enabled', async ({ page }) => {
        const handle = await startTeam(page, { cleared: [ 5, 6 ], team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] } });

        await openTeam(page);

        const release = handle.holdTeam();

        await pick(page, 'orina').click();

        await expect.poll(() => bodiesOf(handle, 'PUT', '/team')).toHaveLength(1);

        const buttons = await page.getByTestId('team-screen').locator('button').evaluateAll((nodes) => nodes.map((node) => node.disabled));

        expect(buttons.length).toBeGreaterThan(0);
        expect(buttons.every(Boolean)).toBe(true);
        await expect(page.getByTestId('hero-close')).toBeEnabled();

        release();

        await expect(slot(page, 1)).toBeEnabled();
        await expect(slot(page, 2)).toBeEnabled();
        await expect(slot(page, 2).locator('.team-name')).toHaveText('Orina Brumaestrela');
        await expect(page.getByTestId('hero-close')).toBeEnabled();
    });

    test('Dano da equipe sums the allies: Lyra and Seraphine read 2.5/s each and 5/s together', async ({ page }) => {
        await startTeam(page, { cleared: [ 5, 6 ], team: { boughtSlots: 2, allies: [ 'lyra', 'seraphine', null, null ] } });
        await openTeam(page);

        await expect(slot(page, 1).locator('.team-dps-line')).toHaveText('Dano: 2.5/s');
        await expect(slot(page, 2).locator('.team-dps-line')).toHaveText('Dano: 2.5/s');
        await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe: 5/s');
    });

    test('a failed team save shows Não foi possível salvar a equipe. and the stored team', async ({ page }) => {
        const handle = await startTeam(page, { team: { boughtSlots: 1, allies: [ null, null, null, null ] } });

        await openTeam(page);
        handle.failNextTeamRequest({ status: 500 });
        await pick(page, 'lyra').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível salvar a equipe.');
        await expect(page.getByTestId('team-screen')).toBeVisible();
        await expect(slot(page, 1)).toHaveAttribute('data-state', 'empty');
        expect(handle.teamOf('yan').allies).toEqual([ null, null, null, null ]);
    });

    test('a failed leader change shows Não foi possível salvar a equipe.', async ({ page }) => {
        const handle = await startTeam(page, { team: LYRA_IN_SLOT_1 });

        await openTeam(page);
        await slot(page, 1).click();
        handle.failNextTeamRequest({ status: 500 });
        await page.getByTestId('team-make-leader').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível salvar a equipe.');
        await expect(slot(page, 0).locator('.team-name')).toHaveText('Kael Raizférrea');
        await expect(slot(page, 1).locator('.team-name')).toHaveText('Lyra Folhaveloz');
    });

    test('closing Equipe during a save keeps the answer and reopens with the stored team and every control enabled', async ({ page }) => {
        const handle = await startTeam(page, { team: { boughtSlots: 2, allies: [ null, null, null, null ] }, cleared: [ 5, 6 ] });

        await openTeam(page);

        const release = handle.holdTeam();

        await pick(page, 'lyra').click();
        await expect.poll(() => bodiesOf(handle, 'PUT', '/team')).toHaveLength(1);
        await page.getByTestId('hero-close').click();
        await expect(page.getByTestId('team-screen')).toBeHidden();

        release();
        await expect.poll(() => handle.teamOf('yan').allies).toEqual([ 'lyra', null, null, null ]);

        await openTeam(page);

        await expect(slot(page, 1).locator('.team-name')).toHaveText('Lyra Folhaveloz');
        await expect(slot(page, 1)).toBeEnabled();
        await expect(pick(page, 'orina')).toBeEnabled();
    });

    test('each ally card shows the name and the text of its passive, and the available list its passive name', async ({ page }) => {
        await startTeam(page, {
            cleared: [ 5, 6, 7, 8 ], leader: 'lyra', team: { boughtSlots: 4, allies: [ 'kael', 'orina', 'vex', null ] }
        });
        await openTeam(page);

        await expect(slot(page, 1).locator('.team-passive')).toHaveText('Guarda do Baluarte: +5 s no tempo dos chefes');
        await expect(slot(page, 2).locator('.team-passive')).toHaveText('Erosão Arcana: -15 de defesa dos inimigos');
        await expect(slot(page, 3).locator('.team-passive')).toHaveText('Lâminas Sombrias: -15 de resistência a crítico dos inimigos');
        await expect(pick(page, 'seraphine').locator('.team-hero-passive')).toHaveText('Graça da Aurora');

        //  Seraphine joins: x1.25 on every ally hit, 2 x 1.25 = 2.5 for a 0 star ally
        await slot(page, 4).click();
        await pick(page, 'seraphine').click();

        await expect(slot(page, 4).locator('.team-passive')).toHaveText('Graça da Aurora: +25% de dano da equipe');
        await expect(slot(page, 4).locator('.team-dps-line')).toHaveText('Dano: 2.5/s');
        await expect(slot(page, 1).locator('.team-dps-line')).toHaveText('Dano: 2.5/s');
        await expect(page.getByTestId('team-dps')).toHaveText('Dano da equipe: 10/s');
    });
});
