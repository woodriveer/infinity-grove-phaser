import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';
import { openLeaderList } from './support/leader';

//  The HUD keys and the Equipe leader list (spec ui-polish, UIP-12 to UIP-14): T opens Talentos and B opens Mochila, a modified, held or typed key does nothing, A ignores modifiers,
//  and Equipe is the one screen of the leader and the allies from chapter 1.
const HERO_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const BLANK_HEROES = Object.fromEntries(HERO_IDS.map((id) => [ `${id}:0`, 1 ]));

//  `copies` are the cards of the player (default one blank Kael), `cleared` the chapters whose boss is won, `team` the stored team
const startGame = async (page, { chapter = 1, cleared = [], copies, team, talentPoints, leader = 'kael' } = {}) => {
    const handle = await mockBackend(page, {
        users: { yan: 'secret123' },
        cards: { yan: { leader, cleared, ...(copies && { copies }) } },
        progress: { yan: { chapter, stage: 1, encounter: 'PHASE', phase: 1 } },
        ...(team && { team: { yan: team } }),
        ...(talentPoints && { talentPoints: { yan: talentPoints } })
    });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText(/yan/);
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return handle;
};

//  A key goes to the page, not to a button that happens to hold the focus
const blur = (page) => page.evaluate(() => document.activeElement?.blur());
const press = async (page, key) => {
    await blur(page);
    await page.keyboard.press(key);
};
//  The frames a key needs to act; a key that must do nothing is read after them
const settle = (page) => page.waitForTimeout(250);

const panel = (page) => page.locator('.hero-panel');
const slot = (page, index) => page.getByTestId(`team-slot-${index}`);
const SEPARATE = (box, other) => box.x + box.width <= other.x || other.x + other.width <= box.x || box.y + box.height <= other.y || other.y + other.height <= box.y;
const INSIDE = (box, outer) => box.x >= outer.x && box.y >= outer.y && box.x + box.width <= outer.x + outer.width && box.y + box.height <= outer.y + outer.height;

test.describe('T and B (UIP-12)', () => {
    test('t opens Talentos and t again closes it', async ({ page }) => {
        await startGame(page);

        await press(page, 't');

        await expect(page.locator('.hero-window')).toBeVisible();
        await expect(page.locator('.hero-window')).toHaveClass(/is-talents/);

        await press(page, 't');

        await expect(panel(page)).toBeHidden();
    });

    test('b opens Mochila and b again closes it', async ({ page }) => {
        await startGame(page);

        await press(page, 'b');

        await expect(page.locator('.hero-title')).toHaveText('Mochila');

        await press(page, 'b');

        await expect(panel(page)).toBeHidden();
    });

    test('b closes Mochila from a hero detail', async ({ page }) => {
        await startGame(page);
        await press(page, 'b');
        await page.getByTestId('bag-card-kael').click();
        await expect(page.getByTestId('bag-detail-card-kael')).toBeVisible();

        await press(page, 'b');

        await expect(panel(page)).toBeHidden();
    });

    test('t over Mochila shows Talentos', async ({ page }) => {
        await startGame(page);

        await press(page, 'b');
        await expect(page.locator('.hero-title')).toHaveText('Mochila');
        await press(page, 't');

        await expect(page.locator('.hero-window')).toHaveClass(/is-talents/);
    });

    test('Control+b, Alt+t and Shift+T do nothing', async ({ page }) => {
        await startGame(page);

        for (const key of [ 'Control+b', 'Alt+t', 'Shift+T' ])
        {
            await press(page, key);
            await settle(page);

            await expect(panel(page)).toBeHidden();
        }

        //  A plain key still works, so the three were ignored rather than missed
        await press(page, 'b');

        await expect(page.locator('.hero-title')).toHaveText('Mochila');
    });

    test('a held t opens Talentos once', async ({ page }) => {
        await startGame(page);
        await blur(page);

        await page.keyboard.down('t');
        //  The second down is an auto-repeat (event.repeat true)
        await page.keyboard.down('t');
        await page.waitForTimeout(600);
        await page.keyboard.up('t');

        await expect(page.locator('.hero-window')).toHaveClass(/is-talents/);
    });

    test('t typed in the username field types a t', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });

        const menu = await openMainMenu(page);

        await menu.username.click();
        await page.keyboard.press('t');

        await expect(menu.username).toHaveValue('t');
    });

    test('t does nothing while the pause menu is open', async ({ page }) => {
        await startGame(page);

        await press(page, 'Escape');
        await expect(page.locator('.pause-menu')).toBeVisible();
        await page.keyboard.press('t');
        await settle(page);

        await expect(page.locator('.pause-menu')).toBeVisible();
        await expect(panel(page)).toBeHidden();
    });

    test('t and b do nothing while the reset dialog is shown', async ({ page }) => {
        await startGame(page, { chapter: 3 });
        await page.getByTestId('auto-click-button').click();
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await page.getByTestId('reset-account').click();
        await expect(page.locator('.reset-dialog')).toBeVisible();

        for (const key of [ 't', 'b' ])
        {
            await press(page, key);
            await settle(page);

            await expect(page.locator('.reset-dialog')).toBeVisible();
            await expect(panel(page)).toBeHidden();
        }
    });

    test('t and b typed into a text field of the battle are typed and open nothing', async ({ page }) => {
        await startGame(page);
        await page.evaluate(() => {
            const field = document.createElement('input');

            field.type = 'text';
            field.dataset.testid = 'probe-field';
            document.body.appendChild(field);
        });

        const field = page.getByTestId('probe-field');

        await field.focus();
        await page.keyboard.press('t');
        await page.keyboard.press('b');
        await settle(page);

        await expect(field).toHaveValue('tb');
        await expect(panel(page)).toBeHidden();
    });

    test('t closes the auto click window and opens Talentos', async ({ page }) => {
        await startGame(page, { chapter: 2 });

        await press(page, 'a');
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();

        await press(page, 't');

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await expect(page.locator('.hero-window')).toHaveClass(/is-talents/);
    });

    test('the keys show on their buttons', async ({ page }) => {
        await startGame(page, { talentPoints: 3 });

        await expect(page.getByTestId('hud-key-talents')).toHaveText('T');
        await expect(page.getByTestId('hud-key-bag')).toHaveText('B');

        const chip = page.getByTestId('hud-key-talents');

        await expect(chip).toHaveCSS('font-size', '10px');
        await expect(chip).toHaveCSS('font-weight', '700');
        await expect(chip).toHaveCSS('font-family', /^"?Cinzel/);
        await expect(chip).toHaveCSS('color', 'rgb(243, 213, 138)');
        await expect(chip).toHaveCSS('background-color', 'rgb(28, 18, 12)');
        await expect(chip).toHaveCSS('border-top-width', '1px');
        await expect(chip).toHaveCSS('border-top-style', 'solid');
        await expect(chip).toHaveCSS('border-top-color', 'rgb(224, 180, 90)');
        await expect(chip).toHaveCSS('height', '16px');

        await expect(page.getByTestId('hud-talents')).toHaveAttribute('aria-keyshortcuts', 'T');
        await expect(page.getByTestId('hud-bag')).toHaveAttribute('aria-keyshortcuts', 'B');

        //  The chip sits inside its button, in the top left corner, and the red dot of the 3 points keeps the top right
        await expect(page.getByTestId('talents-badge')).toBeVisible();

        const button = await page.getByTestId('hud-talents').boundingBox();
        const chipBox = await chip.boundingBox();
        const badge = await page.getByTestId('talents-badge').boundingBox();

        expect(INSIDE(chipBox, button)).toBe(true);
        expect(SEPARATE(chipBox, badge)).toBe(true);
        expect(chipBox.x - button.x).toBeLessThan(button.width / 2);
        expect(badge.x - button.x).toBeGreaterThan(button.width / 2);

        //  The other four buttons carry no chip and no shortcut
        await expect(page.locator('.hud-key')).toHaveCount(2);

        for (const id of [ 'heroes', 'team', 'equipment', 'farm' ])
        {
            await expect(page.getByTestId(`hud-${id}`)).not.toHaveAttribute('aria-keyshortcuts', /.*/);
        }
    });

    test('Shift held on Talentos and T keeps Talentos open', async ({ page }) => {
        await startGame(page);
        await press(page, 't');
        await expect(page.locator('.hero-window')).toHaveClass(/is-talents/);

        await page.keyboard.down('Shift');
        await page.keyboard.press('T');
        await page.keyboard.up('Shift');
        await settle(page);

        await expect(page.locator('.hero-window')).toHaveClass(/is-talents/);
    });
});

test.describe('Ctrl+A and the auto click (UIP-14)', () => {
    test('Control+a on the battle screen leaves the auto click window closed', async ({ page }) => {
        await startGame(page, { chapter: 2 });

        await press(page, 'Control+a');
        await settle(page);

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();

        await press(page, 'a');

        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    });
});

test.describe('Equipe replaces Líder (UIP-13)', () => {
    const LOCKED_SLOT_TEXTS = [ 'Chefe do capítulo 5', 'Chefe do capítulo 6', 'Chefe do capítulo 7', 'Chefe do capítulo 8' ];

    test('the rail reads Heróis, Mochila, Equipe, Equipamento, Talentos, Mapa, Ranking in chapter 1', async ({ page }) => {
        await startGame(page);

        const rail = await page.locator('.hero-hud button[data-testid^="hud-"]').evaluateAll((nodes) => nodes.map((node) => {
            //  The key chip and the red dot are not part of the label
            const copy = node.cloneNode(true);

            copy.querySelectorAll('.hud-key, .hud-badge').forEach((extra) => extra.remove());

            return [ node.dataset.testid, copy.textContent.trim() ];
        }));

        expect(rail).toEqual([
            [ 'hud-heroes', 'Heróis' ], [ 'hud-bag', 'Mochila' ], [ 'hud-team', 'Equipe' ],
            [ 'hud-equipment', 'Equipamento' ], [ 'hud-talents', 'Talentos' ], [ 'hud-farm', 'Mapa' ], [ 'hud-rankings', 'Ranking' ]
        ]);
        await expect(page.getByTestId('hud-leader')).toHaveCount(0);
    });

    test('a chapter 1 player changes the leader from Equipe', async ({ page }) => {
        await startGame(page, { copies: { 'kael:0': 1, 'lyra:1': 1 } });

        await page.getByTestId('hud-team').click();
        await expect(page.getByTestId('team-screen')).toBeVisible();

        for (const index of [ 1, 2, 3, 4 ])
        {
            await expect(slot(page, index)).toHaveAttribute('data-state', 'locked');
            await expect(slot(page, index).locator('.team-lock-text')).toHaveText(LOCKED_SLOT_TEXTS[index - 1]);
        }

        await expect(page.getByTestId('team-status')).toHaveText('A equipe luta a partir do capítulo 5.');
        //  The leader card is a button that carries the caption under the name, the stars and the bonus
        expect(await slot(page, 0).evaluate((node) => node.tagName)).toBe('BUTTON');
        await expect(page.getByTestId('team-leader-change')).toHaveText('Trocar líder');

        await slot(page, 0).click();

        await expect(page.locator('[data-testid="leader-picker"] h3')).toHaveText('Escolher líder');
        await expect(page.locator('.hero-title')).toHaveText('Equipe');
        await expect(page.locator('[data-testid^="leader-entry-"]')).toHaveCount(2);
        await expect(page.getByTestId('leader-entry-kael')).toHaveClass(/is-current/);
        await expect(page.getByTestId('leader-entry-kael')).toContainText('Líder');
        await expect(page.getByTestId('hero-back')).toHaveText('Voltar');

        await page.getByTestId('leader-entry-lyra').click();

        await expect(page.getByTestId('leader-entry-lyra')).toHaveClass(/is-current/);
        await expect(page.getByTestId('leader-entry-kael')).not.toHaveClass(/is-current/);
        await expect(page.getByTestId('leader-list')).toBeVisible();
        await expect(page.getByTestId('skill-slot-1').locator('img')).toHaveAttribute('src', 'assets/heroes/lyra_double_shot.jpg');
        await expect(page.getByTestId('leader-card')).toContainText('Lyra');
    });

    test('Voltar shows the new leader card', async ({ page }) => {
        await startGame(page, { copies: { 'kael:0': 1, 'lyra:1': 1 } });
        await openLeaderList(page);
        await page.getByTestId('leader-entry-lyra').click();
        await expect(page.getByTestId('leader-entry-lyra')).toHaveClass(/is-current/);

        await page.getByTestId('hero-back').click();

        await expect(page.getByTestId('team-screen')).toBeVisible();
        await expect(slot(page, 0).locator('.team-name')).toHaveText('Lyra Folhaveloz');
    });

    test('a refused change says why', async ({ page }) => {
        const handle = await startGame(page, { copies: { 'kael:0': 1, 'lyra:1': 1 } });

        await openLeaderList(page);
        handle.failNextTeamRequest({ status: 500 });
        await page.getByTestId('leader-entry-lyra').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível trocar o líder.');
        await expect(page.getByTestId('leader-entry-kael')).toHaveClass(/is-current/);
    });

    test('a leader list with one hero holds one current row and a click sends nothing', async ({ page }) => {
        const handle = await startGame(page);

        await openLeaderList(page);

        await expect(page.locator('[data-testid^="leader-entry-"]')).toHaveCount(1);
        await expect(page.getByTestId('leader-entry-kael')).toHaveClass(/is-current/);

        await page.getByTestId('leader-entry-kael').click();
        await settle(page);

        expect(handle.calls.filter((call) => call.method === 'PUT' && call.path === '/leader')).toHaveLength(0);
    });

    test('the leader card is disabled while a team request runs', async ({ page }) => {
        const handle = await startGame(page, { cleared: [ 5, 6 ], copies: BLANK_HEROES, team: { boughtSlots: 2, allies: [ 'lyra', null, null, null ] } });

        await page.getByTestId('hud-team').click();
        await expect(page.getByTestId('team-screen')).toBeVisible();

        const release = handle.holdTeam();

        await page.getByTestId('team-available-orina').click();
        await expect.poll(() => handle.calls.filter((call) => call.method === 'PUT' && call.path === '/team').length).toBe(1);

        await expect(slot(page, 0)).toBeDisabled();
        await expect(slot(page, 0)).toHaveCSS('cursor', 'default');

        release();

        await expect(slot(page, 0)).toBeEnabled();
        await expect(slot(page, 0)).toHaveCSS('cursor', 'pointer');
    });

    test('a new leader taken from an ally slot puts the old one there', async ({ page }) => {
        await startGame(page, { cleared: [ 5 ], chapter: 5, copies: BLANK_HEROES, team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] } });

        await openLeaderList(page);
        await page.getByTestId('leader-entry-lyra').click();
        await expect(page.getByTestId('leader-entry-lyra')).toHaveClass(/is-current/);
        await page.getByTestId('hero-back').click();

        await expect(slot(page, 0).locator('.team-name')).toHaveText('Lyra Folhaveloz');
        await expect(slot(page, 1).locator('.team-name')).toHaveText('Kael Raizférrea');
    });

    test('Tornar líder still works', async ({ page }) => {
        await startGame(page, { cleared: [ 5 ], chapter: 5, copies: BLANK_HEROES, team: { boughtSlots: 1, allies: [ 'lyra', null, null, null ] } });

        await page.getByTestId('hud-team').click();
        await expect(page.getByTestId('team-screen')).toBeVisible();
        await slot(page, 1).click();
        await page.getByTestId('team-make-leader').click();

        await expect(slot(page, 0).locator('.team-name')).toHaveText('Lyra Folhaveloz');
    });
});
