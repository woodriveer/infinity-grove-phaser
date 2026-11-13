import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Monsters of 1000 health, no defense and the element given, so a click is read exactly
const bare = (element, physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });

//  One stage of five phases; the miniboss and the chapter boss last `limit` ms
const chapter = (monster, limit = 60_000) => ({
    bossHealth: 1000,
    bossTimeLimitMs: limit,
    boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: limit, monster, miniboss: monster } ]
});

const MINIBOSS = { stage: 1, encounter: 'MINIBOSS', phase: 1 };

const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CRIT_CHANCE', base: 2 } ], heroId
});

const health = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);

const css = (locator, props, pseudo = null) => locator.evaluate((node, [ names, p ]) => {
    const style = getComputedStyle(node, p);
    return Object.fromEntries(names.map((name) => [ name, style.getPropertyValue(name) ]));
}, [ props, pseudo ]);

const expectStyle = async (locator, expected, pseudo = null) => expect(await css(locator, Object.keys(expected), pseudo)).toEqual(expected);

//  WCAG 2.x contrast of two 'rgb(...)' or 'rgba(...)' strings (alpha ignored)
const channels = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = (color) => {
    const [ r, g, b ] = channels(color).map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
    const [ high, low ] = [ luminance(a), luminance(b) ].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
};

//  Share of pixels with min(R, B) - G >= 110 of a loaded <img>, drawn at natural size
const magentaShare = (img) => img.evaluate((node) => {
    const canvas = document.createElement('canvas');
    canvas.width = node.naturalWidth;
    canvas.height = node.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(node, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let magenta = 0;
    for (let i = 0; i < data.length; i += 4)
    {
        if (Math.min(data[i], data[i + 2]) - data[i + 1] >= 110) { magenta += 1; }
    }
    return magenta / (data.length / 4);
});

const expectNoMagenta = async (img) => {
    await expect.poll(() => img.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
    expect(await magentaShare(img)).toBeLessThanOrEqual(0.001);
};

//  Scene coordinates on the canvas: the scene is 1024 x 768 and the canvas is scaled to fit
const canvasBox = (page) => page.locator('#game-container canvas').boundingBox();
const sceneX = (canvas, x) => canvas.x + (x * canvas.width) / 1024;
const sceneSpan = (canvas, box) => ({
    from: ((box.x - canvas.x) * 1024) / canvas.width,
    to: ((box.x + box.width - canvas.x) * 1024) / canvas.width
});
const inside = (inner, outer) => inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5
    && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const hitMonsterAt = async (page) => {
    const canvas = page.locator('#game-container canvas');
    const box = await canvas.boundingBox();

    await canvas.click({ position: { x: (box.width * 670) / 1024, y: (box.height * 440) / 768 } });
};

const enterGame = async (page, menu) => {
    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
};

//  Logs in as yan with Kael (or another leader) and waits for the fight at 1000 health
const startAs = async (page, { monster = bare('FIRE'), copies = { 'kael:3': 1 }, leader = 'kael', progress = {}, talents, talentPoints, equipment, wallet, autoClick, limit, random, setup } = {}) => {
    const backend = await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monster, limit),
        cards: { yan: { leader, copies } },
        ...(Object.keys(progress).length > 0 && { progress: { yan: progress } }),
        ...(talents && { talents: { yan: talents } }),
        ...(talentPoints !== undefined && { talentPoints: { yan: talentPoints } }),
        ...(equipment && { equipment: { yan: equipment } }),
        ...(wallet !== undefined && { wallets: { yan: wallet } }),
        ...(autoClick && { autoClick: { yan: autoClick } })
    });

    if (setup) { await setup(page); }

    const menu = await openMainMenu(page, random === undefined ? {} : { random });

    await enterGame(page, menu);
    await expect(page.getByTestId('leader-card')).toContainText('Kael');

    return { ...menu, backend };
};

const openMenu = async (page) => {
    await mockBackend(page, { users: { yan: 'secret123' } });
    return openMainMenu(page);
};

const openScreen = async (page, screen) => {
    await page.getByTestId(`hud-${screen}`).click();
    await expect(page.locator('.hero-window')).toBeVisible();
};

//  The button recipes of UIR-02: secondary (wood) and primary (ember)
const WOOD_PILL = { 'background-color': 'rgb(43, 29, 20)', 'border-top-width': '2px', 'border-top-style': 'solid', 'border-top-color': 'rgb(176, 122, 58)', color: 'rgb(244, 230, 200)', 'border-top-left-radius': '999px' };
const EMBER_PILL = { 'background-color': 'rgb(168, 67, 26)', 'border-top-width': '2px', 'border-top-color': 'rgb(224, 180, 90)', color: 'rgb(244, 230, 200)' };

//  UIR-02 AC9 and AC10: the hover brightens an enabled button and the press darkens it. The release is made off the button,
//  so the press itself clicks nothing (some buttons spend crystals, copper or log out)
const expectHoverShade = async (button) => {
    await button.hover();
    await expect.poll(async () => (await css(button, [ 'filter' ])).filter).toBe('brightness(1.15)');
};

const expectShades = async (page, button) => {
    await expectHoverShade(button);
    await page.mouse.down();
    await expect.poll(async () => (await css(button, [ 'filter' ])).filter).toBe('brightness(0.9)');
    await page.mouse.move(0, 0);
    await page.mouse.up();
};

const lastText = (page) => page.evaluate(() => {
    const text = window.__PHASER_GAME__.scene.getScene('ClickerGame').children.list.filter((child) => child.type === 'Text').at(-1);

    return { fontFamily: text.style.fontFamily, fontStyle: text.style.fontStyle, color: text.style.color, fontSize: text.style.fontSize, stroke: text.style.stroke, strokeThickness: text.style.strokeThickness };
});

const autoClickOpen = (page) => page.getByTestId('auto-click-popover');

const openAutoClick = async (page) => {
    await page.getByTestId('auto-click-button').click();
    await expect(autoClickOpen(page)).toBeVisible();
};

const timerLeft = (page) => page.locator('.boss-timer').evaluate((node) => node.style.getPropertyValue('--timer-left'));

test.describe('Grove theme', () => {
    test('loads Cinzel and never requests Caprasimo', async ({ page }) => {
        const urls = [];

        page.on('request', (request) => urls.push(request.url()));
        await startAs(page, {});
        await openScreen(page, 'heroes');

        expect(urls.some((url) => url.includes('family=Cinzel'))).toBe(true);
        expect(urls.some((url) => url.includes('Caprasimo'))).toBe(false);
        expect(await page.evaluate(() => document.fonts.check('700 16px Cinzel'))).toBe(true);
        expect((await css(page.locator('.hero-title'), [ 'font-family' ]))['font-family']).toMatch(/^"?Cinzel/);
    });

    test('keeps every control working when the Google Fonts request fails', async ({ page }) => {
        await page.route('**/fonts.googleapis.com/**', (route) => route.abort());
        await startAs(page, {});
        await openScreen(page, 'heroes');

        expect((await css(page.locator('.hero-title'), [ 'font-family' ]))['font-family']).toContain('Georgia');
        await page.getByTestId('hero-close').click();
        await expect(page.locator('.hero-window')).toBeHidden();
    });

    test('defines every palette token of the design with its exact value', async ({ page }) => {
        await openMenu(page);

        const tokens = {
            '--wood-900': '#1c120c', '--wood-800': '#2b1d14', '--wood-700': '#3d2a1c', '--wood-600': '#5a3d26', '--bronze-500': '#b07a3a', '--gold-400': '#e0b45a',
            '--gold-200': '#f3d58a', '--parchment-100': '#f4e6c8', '--parchment-200': '#ead6ad', '--parchment-300': '#e6d0a2', '--ink-900': '#2a1a10', '--ink-600': '#6b4a2b',
            '--ember-500': '#e8742a', '--ember-700': '#a8431a', '--ember-800': '#8a3510', '--color-focus': '#cc4e1a', '--color-bg': '#f4e6c8', '--color-surface': '#e6d0a2',
            '--color-text': '#2a1a10', '--color-accent': '#a8431a', '--color-divider': 'color-mix(in srgb, #2a1a10 22%, transparent)', '--color-neutral-600': '#5f5244',
            '--color-neutral-700': '#574b3e', '--color-accent-2-700': '#4a5636', '--font-heading': '"Cinzel", Georgia, serif', '--radius-md': '8px', '--radius-lg': '12px',
            '--shadow-md': '0 3px 10px rgb(0 0 0 / 0.35)', '--shadow-lg': '0 10px 28px rgb(0 0 0 / 0.5)'
        };
        const actual = await page.evaluate((names) => Object.fromEntries(names.map((name) => [ name, getComputedStyle(document.documentElement).getPropertyValue(name).trim() ])), Object.keys(tokens));

        expect(actual).toEqual(tokens);
    });

    test('paints the letterbox in dark wood', async ({ page }) => {
        await openMenu(page);

        await expectStyle(page.locator('body'), { 'background-color': 'rgb(28, 18, 12)' });
    });

    test('requests no texture file while the texture tokens are none', async ({ page }) => {
        const urls = [];

        //  The textures are switched on in style.css: serve it with both tokens back at none
        await page.route('**/style.css', async (route) => {
            const response = await route.fetch();
            const css = (await response.text()).replace(/--texture-(parchment|wood): url\([^)]*\);/g, '--texture-$1: none;');

            expect(css).toContain('--texture-parchment: none;');
            expect(css).toContain('--texture-wood: none;');
            await route.fulfill({ response, body: css });
        });
        page.on('request', (request) => urls.push(request.url()));
        await startAs(page, {});
        await openScreen(page, 'heroes');

        expect(urls.some((url) => url.includes('ui-parchment.jpg') || url.includes('ui-wood.jpg'))).toBe(false);
        expect(await page.locator('.hero-window').evaluate((node) => getComputedStyle(node).backgroundImage)).not.toContain('url(');
    });

    test('draws the parchment texture as the top layer once its token is set', async ({ page }) => {
        const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

        await page.route('**/assets/ui-parchment.jpg', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));
        await startAs(page, {});
        await page.addStyleTag({ content: ':root { --texture-parchment: url("assets/ui-parchment.jpg"); }' });
        await openScreen(page, 'heroes');

        const background = await page.locator('.hero-window').evaluate((node) => getComputedStyle(node).backgroundImage);

        expect(background.startsWith('url(')).toBe(true);
        expect(background).toContain('ui-parchment.jpg');
    });

    test('draws the wood texture as the top layer of a dark wood frame once its token is set', async ({ page }) => {
        await startAs(page, {});
        await page.addStyleTag({ content: ':root { --texture-wood: url("assets/ui-wood.jpg"); }' });

        const background = await page.locator('.leader-card').evaluate((node) => getComputedStyle(node).backgroundImage);

        expect(background.startsWith('url(')).toBe(true);
        expect(background).toContain('ui-wood.jpg');
        expect(background.indexOf('ui-wood.jpg')).toBeLessThan(background.indexOf('linear-gradient'));
    });

    test('draws the parchment texture on a second parchment panel, not only the hero window', async ({ page }) => {
        await startAs(page, {});
        await page.addStyleTag({ content: ':root { --texture-parchment: url("assets/ui-parchment.jpg"); }' });

        const background = await page.locator('.battle-bar').evaluate((node) => getComputedStyle(node).backgroundImage);

        expect(background.startsWith('url(')).toBe(true);
        expect(background).toContain('ui-parchment.jpg');
    });

    test('draws Fechar as a wood pill', async ({ page }) => {
        await startAs(page, {});
        await openScreen(page, 'heroes');

        await expectStyle(page.getByTestId('hero-close'), {
            'background-color': 'rgb(43, 29, 20)',
            'border-top-width': '2px',
            'border-top-color': 'rgb(176, 122, 58)',
            color: 'rgb(244, 230, 200)',
            'border-top-left-radius': '999px'
        });
    });

    test('draws Fundir as an ember pill', async ({ page }) => {
        await startAs(page, { copies: { 'kael:1': 3 } });
        await page.getByTestId('hud-fusion').click();

        await expectStyle(page.getByTestId('fusion-button-kael-1'), {
            'background-color': 'rgb(168, 67, 26)',
            'border-top-color': 'rgb(224, 180, 90)',
            color: 'rgb(244, 230, 200)'
        });
        await expectShades(page, page.getByTestId('fusion-button-kael-1'));
    });

    test('draws Login as an ember pill', async ({ page }) => {
        const menu = await openMenu(page);

        await expectStyle(menu.loginButton, {
            'background-color': 'rgb(168, 67, 26)',
            'border-top-width': '2px',
            'border-top-color': 'rgb(224, 180, 90)',
            color: 'rgb(244, 230, 200)'
        });
    });

    test('draws the secondary and primary buttons of the Sign up and login screen', async ({ page }) => {
        const menu = await openMenu(page);

        await expectStyle(menu.signupButton, WOOD_PILL);
        await expectShades(page, menu.signupButton);
        await expectShades(page, menu.loginButton);
    });

    test('draws Logout as a wood pill and Click to Start as an ember pill on the welcome', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);
        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Welcome back, yan!');

        await page.reload();
        const welcome = await openMainMenu(page, { state: 'welcome' });

        await expectStyle(welcome.logoutButton, WOOD_PILL);
        await expectShades(page, welcome.logoutButton);
        //  The start line is no button: the welcome block takes no pointer (the canvas takes the click), so it has no hover or press
        await expectStyle(page.locator('.welcome-start'), EMBER_PILL);
    });

    test('draws Voltar as a wood pill', async ({ page }) => {
        await startAs(page, {});
        await openScreen(page, 'heroes');
        await page.getByTestId('hero-card-kael').click();

        await expect(page.getByTestId('hero-back')).toContainText('Voltar');
        await expectStyle(page.getByTestId('hero-back'), WOOD_PILL);
        await expectShades(page, page.getByTestId('hero-back'));
    });

    test('draws the leave and confirm buttons of the pause menu as wood pills', async ({ page }) => {
        await startAs(page, { progress: MINIBOSS });
        await page.keyboard.press('Escape');

        await expectStyle(page.locator('.pause-leave'), WOOD_PILL);
        await expectShades(page, page.locator('.pause-leave'));
        await page.locator('.pause-leave').click();

        await expect(page.locator('.pause-confirm-yes')).toBeVisible();
        await expectStyle(page.locator('.pause-confirm-yes'), WOOD_PILL);
        await expectShades(page, page.locator('.pause-confirm-yes'));
    });

    test('draws the continue and stay buttons of the pause menu as ember pills', async ({ page }) => {
        await startAs(page, { progress: MINIBOSS });
        await page.keyboard.press('Escape');

        await expectStyle(page.locator('.pause-continue'), EMBER_PILL);
        await expectShades(page, page.locator('.pause-continue'));
        await page.locator('.pause-leave').click();

        await expect(page.locator('.pause-confirm-no')).toBeVisible();
        await expectStyle(page.locator('.pause-confirm-no'), EMBER_PILL);
        await expectShades(page, page.locator('.pause-confirm-no'));
    });

    test('draws the reset button of the dialog as a wood pill and Cancelar as an ember pill', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        await openAutoClick(page);
        await page.getByTestId('reset-account').click();

        await expectStyle(page.getByTestId('reset-confirm'), WOOD_PILL);
        await expectShades(page, page.getByTestId('reset-confirm'));
        await expectStyle(page.getByTestId('reset-cancel'), EMBER_PILL);
        await expectShades(page, page.getByTestId('reset-cancel'));
    });

    test('draws the equip and sell buttons of a piece as wood pills and Refinar as an ember pill', async ({ page }) => {
        await startAs(page, { equipment: [ piece('r1', 'RING', 'COMMON') ], wallet: 600 });
        await page.getByTestId('hud-equipment').click();
        await page.getByTestId('equip-piece-r1').click();

        await expectStyle(page.locator('[data-testid^="piece-equip-"]').first(), WOOD_PILL);
        await expectStyle(page.getByTestId('piece-sell'), WOOD_PILL);
        await expect(page.getByTestId('piece-refine')).toBeEnabled();
        await expectStyle(page.getByTestId('piece-refine'), EMBER_PILL);
        //  UIR-02 AC9: the hover brightens them
        await expectHoverShade(page.locator('[data-testid^="piece-equip-"]').first());
        await expectHoverShade(page.getByTestId('piece-sell'));
        await expectHoverShade(page.getByTestId('piece-refine'));
    });

    test('draws the bag button to the fusion and the bulk sale confirmation as ember pills', async ({ page }) => {
        await startAs(page, { copies: { 'kael:3': 3 }, equipment: [ piece('c1', 'RING', 'COMMON') ] });
        await page.getByTestId('hud-bag').click();
        await page.getByTestId('bag-entry-kael-3').click();

        await expectStyle(page.getByTestId('bag-go-fusion'), EMBER_PILL);
        await expectShades(page, page.getByTestId('bag-go-fusion'));

        await page.getByTestId('hero-close').click();
        await page.getByTestId('hud-equipment').click();
        await page.getByTestId('bulk-sell-start').click();
        await page.getByTestId('equip-piece-c1').click();
        await page.getByTestId('bulk-sell-submit').click();

        await expectStyle(page.getByTestId('bulk-sell-confirm-yes'), EMBER_PILL);
        await expectHoverShade(page.getByTestId('bulk-sell-confirm-yes'));
    });

    test('brightens a hovered button and darkens a pressed one', async ({ page }) => {
        await startAs(page, {});
        await openScreen(page, 'heroes');
        const close = page.getByTestId('hero-close');

        await close.hover();
        await expect.poll(async () => (await css(close, [ 'filter' ])).filter).toBe('brightness(1.15)');

        await page.mouse.down();
        await expect.poll(async () => (await css(close, [ 'filter' ])).filter).toBe('brightness(0.9)');
        await page.mouse.up();
    });

    test('keeps a disabled button at opacity 0.45', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openAutoClick(page);

        await expect(page.getByTestId('auto-click-upgrade')).toBeDisabled();
        await expectStyle(page.getByTestId('auto-click-upgrade'), { opacity: '0.45' });
    });

    test('draws metallic coins', async ({ page }) => {
        await startAs(page, {});

        await expectStyle(page.locator('.wallet .coin-gold'), { width: '20px' }, '::before');
        expect((await css(page.locator('.wallet .coin-gold'), [ 'background-image' ], '::before'))['background-image']).toContain('rgb(255, 241, 176)');
        expect((await css(page.locator('.wallet .coin-silver'), [ 'background-image' ], '::before'))['background-image']).toContain('rgb(201, 204, 209)');
        expect((await css(page.locator('.wallet .coin-copper'), [ 'background-image' ], '::before'))['background-image']).toContain('rgb(184, 101, 45)');

        //  UIR-02 AC12: every coin is 20 px and runs through three metallic stops
        await expectStyle(page.locator('.wallet .coin-silver'), { width: '20px' }, '::before');
        await expectStyle(page.locator('.wallet .coin-copper'), { width: '20px' }, '::before');
        const stops = [
            [ 'coin-gold', [ 'rgb(255, 241, 176)', 'rgb(224, 180, 90)', 'rgb(138, 90, 18)' ] ],
            [ 'coin-silver', [ 'rgb(255, 255, 255)', 'rgb(201, 204, 209)', 'rgb(111, 116, 123)' ] ],
            [ 'coin-copper', [ 'rgb(246, 192, 143)', 'rgb(184, 101, 45)', 'rgb(94, 44, 16)' ] ]
        ];

        for (const [ coin, colours ] of stops)
        {
            const background = (await css(page.locator(`.wallet .${coin}`), [ 'background-image' ], '::before'))['background-image'];

            for (const colour of colours) { expect(background).toContain(colour); }
        }
    });

    test('rings the focused control in ember', async ({ page }) => {
        await startAs(page, {});

        for (let i = 0; i < 40; i++)
        {
            const focused = await page.evaluate(() => document.activeElement?.dataset.testid ?? '');

            if (focused.startsWith('hud-')) { break; }
            await page.keyboard.press('Tab');
        }

        await expect(page.locator(':focus')).toHaveAttribute('data-testid', /^hud-/);
        await expectStyle(page.locator(':focus'), {
            'outline-style': 'solid',
            'outline-width': '3px',
            'outline-color': 'rgb(204, 78, 26)',
            'outline-offset': '2px'
        });
    });

    test('meets 4.5:1 on the contrast pairs of the design (rows 1 to 8, 13 and 14)', async ({ page }) => {
        //  A 1-star Kael: skill 1 is unlocked (the cooldown of row 5) and skills 2 and 3 are locked (row 7)
        const { backend } = await startAs(page, { copies: { 'kael:1': 3 }, progress: MINIBOSS });
        const rows = [];
        const check = async (text, background, expectedText, expectedBackground, textProp = 'color') => {
            const color = (await css(text, [ textProp ]))[textProp];
            const back = (await css(background, [ 'background-color' ]))['background-color'];

            expect(color).toBe(expectedText);
            expect(back).toBe(expectedBackground);
            expect(ratio(color, back)).toBeGreaterThanOrEqual(4.5);
            rows.push(ratio(color, back));
        };

        //  Battle: rows 2, 4 and 5
        await check(page.getByTestId('hud-heroes'), page.getByTestId('hud-heroes'), 'rgb(244, 230, 200)', 'rgb(43, 29, 20)');
        await check(page.locator('.boss-timer'), page.locator('.boss-timer'), 'rgb(243, 213, 138)', 'rgb(43, 29, 20)');
        await page.getByTestId('skill-slot-1').click();
        await check(page.locator('.skill-slot-cooldown').first(), page.locator('.battle-bar'), 'rgb(138, 53, 16)', 'rgb(234, 214, 173)');

        //  Hero screens: rows 1 and 8, then row 7 in the detail of Kael
        await openScreen(page, 'heroes');
        await check(page.locator('.hero-title'), page.locator('.hero-window'), 'rgb(42, 26, 16)', 'rgb(234, 214, 173)');
        await check(page.getByTestId('hero-card-kael').locator('.hero-meta'), page.getByTestId('hero-card-kael'), 'rgb(74, 86, 54)', 'rgb(230, 208, 162)');
        //  Row 14: a hero with 1 to 3 stars carries no tier class, so the stars take the plain accent ink
        await expect(page.getByTestId('hero-card-kael').locator('.hero-stars')).toHaveAttribute('class', 'hero-stars');
        await check(page.getByTestId('hero-card-kael').locator('.hero-stars'), page.getByTestId('hero-card-kael'), 'rgb(140, 73, 26)', 'rgb(230, 208, 162)');
        await page.getByTestId('hero-card-kael').click();
        await check(page.locator('.skill-row.is-locked').first(), page.locator('.skill-row.is-locked').first(), 'rgb(87, 75, 62)', 'rgb(234, 214, 173)');
        await page.getByTestId('hero-back').click();
        await page.getByTestId('hero-close').click();

        //  Fusion: row 3, then row 6 once the backend loses the copies
        await page.getByTestId('hud-fusion').click();
        await check(page.getByTestId('fusion-button-kael-1'), page.getByTestId('fusion-button-kael-1'), 'rgb(244, 230, 200)', 'rgb(168, 67, 26)');
        backend.cardsOf('yan').copies['kael:1'] = 1;
        await page.getByTestId('fusion-button-kael-1').click();
        await check(page.locator('.hero-error'), page.locator('.hero-error'), 'rgb(244, 230, 200)', 'rgb(138, 53, 16)');

        //  Talents: row 13, the effect line on its light card
        await page.getByTestId('hero-close').click();
        await openScreen(page, 'talents');
        const talentCard = page.locator('.talent-card').first();
        await check(talentCard.locator('.talent-effect').first(), talentCard, 'rgb(87, 75, 62)', 'rgb(244, 230, 200)');

        expect(rows).toHaveLength(10);
    });

    test('meets 4.5:1 on the menu tagline over the parchment oval', async ({ page }) => {
        await openMenu(page);

        await expectStyle(page.locator('.menu-tagline'), { color: 'rgb(107, 74, 43)' });
        //  The oval is drawn on the canvas, so its colour is pinned by value: the 0xead6ad fill of UIR-15 (rgb 234, 214, 173)
        expect(ratio('rgb(107, 74, 43)', 'rgb(234, 214, 173)')).toBeGreaterThanOrEqual(4.5);
    });

    test('adds no animation or transition to buttons, rail and timer', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2, ...MINIBOSS } });
        const quiet = { 'animation-name': 'none', 'transition-duration': '0s' };

        //  UIR-03 AC15: every rail button is restyled, so every rail button is still
        for (const id of [ 'hud-heroes', 'hud-bag', 'hud-fusion', 'hud-leader', 'hud-equipment', 'hud-talents', 'hud-farm' ])
        {
            await expectStyle(page.getByTestId(id), quiet);
        }
        await expectStyle(page.getByTestId('auto-click-button'), quiet);
        await expectStyle(page.locator('.boss-timer'), quiet);
        await openScreen(page, 'heroes');
        await expectStyle(page.getByTestId('hero-close'), quiet);
    });

    test('draws the stage plaque, chapter tag and wallet scroll', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        const plaque = {
            'background-color': 'rgb(234, 214, 173)',
            'border-top-width': '3px',
            'border-top-color': 'rgb(90, 61, 38)',
            'border-top-left-radius': '6px',
            'font-family': expect.stringMatching(/^"?Cinzel/),
            'font-weight': '700',
            'font-size': '19px',
            color: 'rgb(42, 26, 16)'
        };

        await expectStyle(page.locator('.stage-hud'), plaque);
        await expectStyle(page.getByTestId('chapter-hud'), {
            'background-color': 'rgb(234, 214, 173)',
            'border-top-width': '2px',
            'border-top-style': 'solid',
            'border-top-color': 'rgb(90, 61, 38)',
            'border-top-left-radius': '4px',
            'font-size': '16px',
            'font-family': expect.stringMatching(/^"?Cinzel/),
            'font-weight': '700'
        });
        await expectStyle(page.locator('.wallet'), plaque);
    });

    test('draws the combo as an ember chip', async ({ page }) => {
        const menu = await startAs(page, { talents: { COMBO: 10 } });

        for (let i = 0; i < 3; i++) { await menu.canvas.click(); }

        await expectStyle(page.getByTestId('combo-hud'), {
            'background-color': 'rgb(138, 53, 16)',
            'border-top-width': '2px',
            'border-top-style': 'solid',
            'border-top-color': 'rgb(224, 180, 90)',
            color: 'rgb(244, 230, 200)',
            'font-family': expect.stringMatching(/^"?Cinzel/),
            'font-weight': '700',
            'font-size': '20px'
        });
    });

    test('draws a stage message in gold with a dark stroke', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await page.route('**/api/progress', (route) => route.fulfill({ status: 500 }));
        const menu = await openMainMenu(page);

        await enterGame(page, menu);

        await expect(page.locator('.stage-message')).toHaveText('Could not load progress');
        await expectStyle(page.locator('.stage-message'), {
            color: 'rgb(255, 211, 92)',
            '-webkit-text-stroke-color': 'rgb(42, 20, 8)',
            '-webkit-text-stroke-width': '10px',
            'font-family': expect.stringMatching(/^"?Cinzel/),
            'font-weight': '700',
            'font-size': '52px'
        });
    });

    test('draws a notice as a dark plaque', async ({ page }) => {
        await startAs(page, {});
        await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').heroUi.showNotice('Carta: Lyra Folhaveloz'));

        await expect(page.getByTestId('card-notice')).toHaveText('Carta: Lyra Folhaveloz');
        await expectStyle(page.getByTestId('card-notice'), {
            'background-color': 'rgb(43, 29, 20)',
            'border-top-width': '2px',
            'border-top-style': 'solid',
            'border-top-color': 'rgb(176, 122, 58)',
            color: 'rgb(243, 213, 138)',
            'font-family': expect.stringMatching(/^"?Cinzel/),
            'font-weight': '700',
            'font-size': '22px'
        });
    });

    test('keeps the health bar 240 x 16 in its new colours with a framed box', async ({ page }) => {
        await startAs(page, {});

        expect(await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');

            return { fill: scene.healthFill.fillColor, back: scene.monsterParts[1].fillColor, width: scene.healthFill.width, height: scene.healthFill.height, x: scene.healthFill.x, y: scene.healthFill.y };
        })).toEqual({ fill: 0xc0392b, back: 0x2a1410, width: 240, height: 16, x: 550, y: 281 });

        const shadow = (await css(page.locator('.hud-monster-hp'), [ 'box-shadow', 'pointer-events', 'background-image' ]));

        expect(shadow['box-shadow']).toContain('rgb(28, 18, 12) 0px 0px 0px 2px');
        expect(shadow['box-shadow']).toContain('rgb(176, 122, 58) 0px 0px 0px 4px');
        expect(shadow['pointer-events']).toBe('none');
        //  UIR-05 AC9: the gloss is a gradient over the frame
        expect(shadow['background-image']).toContain('linear-gradient');
        await expect(page.getByTestId('monster-hp')).toHaveText('HP 1000/1000');
        await expectStyle(page.getByTestId('monster-hp'), {
            'font-weight': '800',
            'font-size': '12px',
            'font-family': expect.stringMatching(/Figtree/),
            color: 'rgb(255, 244, 220)',
            '-webkit-text-stroke-width': '3px',
            '-webkit-text-stroke-color': 'rgb(28, 18, 12)'
        });
    });

    test('draws a normal damage number in gold Cinzel', async ({ page }) => {
        const menu = await startAs(page, {});

        await menu.canvas.click();

        await expect.poll(() => lastText(page)).toEqual({ fontFamily: 'Cinzel', fontStyle: '700', color: '#ffd35c', fontSize: '32px', stroke: '#2a1408', strokeThickness: 8 });
    });

    test('draws a critical damage number in orange Cinzel', async ({ page }) => {
        const menu = await startAs(page, { random: 0 });

        await menu.canvas.click();

        await expect.poll(() => lastText(page)).toEqual({ fontFamily: 'Cinzel', fontStyle: '700', color: '#ff8a1f', fontSize: '48px', stroke: '#2a1408', strokeThickness: 8 });
    });

    test('draws the boss timer pill with a ring that empties', async ({ page }) => {
        await startAs(page, { progress: MINIBOSS });
        const timer = page.locator('.boss-timer');

        await expect(timer).toHaveText(/^Time: \d+$/);
        await expectStyle(timer, {
            'background-color': 'rgb(43, 29, 20)',
            'border-top-width': '2px',
            'border-top-style': 'solid',
            'border-top-color': 'rgb(176, 122, 58)',
            color: 'rgb(243, 213, 138)',
            'font-family': expect.stringMatching(/^"?Cinzel/),
            'font-weight': '700',
            'font-size': '20px'
        });
        await expectStyle(timer, { width: '32px' }, '::before');

        const first = Number(await timerLeft(page));

        expect(first).toBeGreaterThan(0.9);
        expect(first).toBeLessThanOrEqual(1);
        await expect.poll(async () => Number(await timerLeft(page)), { timeout: 3000 }).toBeLessThan(first);
        expect(Number(await timerLeft(page))).toBeGreaterThan(0.9);
    });

    test('fills the ring with the share of the time left in ember', async ({ page }) => {
        await startAs(page, { progress: MINIBOSS });
        const timer = page.locator('.boss-timer');
        //  The pause menu stops the countdown, so the share set here is the one the ring draws
        await page.keyboard.press('Escape');

        await timer.evaluate((node) => node.style.setProperty('--timer-left', '0.750'));
        expect((await css(timer, [ 'background-image' ], '::before'))['background-image']).toContain('conic-gradient(rgb(232, 116, 42) 270deg');

        await timer.evaluate((node) => node.style.setProperty('--timer-left', '1.000'));
        expect((await css(timer, [ 'background-image' ], '::before'))['background-image']).toContain('conic-gradient(rgb(232, 116, 42) 360deg');
    });

    test('empties the ring to 0.000 at expiry and never shows a negative value', async ({ page }) => {
        await startAs(page, { progress: MINIBOSS, limit: 1500 });
        //  The expiry writes 0.000 and removes the property in the same task, so a frame sampler would miss it:
        //  the observer reads the old value of every style change of the timer
        await page.evaluate(() => {
            window.__timerValues = [];
            new MutationObserver((records) => {
                for (const record of records)
                {
                    if (!record.target.classList?.contains('boss-timer')) { continue; }
                    for (const source of [ record.oldValue ?? '', record.target.getAttribute('style') ?? '' ])
                    {
                        const match = source.match(/--timer-left:\s*([-\d.]+)/);

                        if (match) { window.__timerValues.push(match[1]); }
                    }
                }
            }).observe(document.body, { attributes: true, attributeFilter: [ 'style' ], attributeOldValue: true, subtree: true });
        });

        await expect.poll(() => page.evaluate(() => window.__timerValues.includes('0.000')), { timeout: 10_000 }).toBe(true);

        const values = await page.evaluate(() => window.__timerValues);

        expect(values.length).toBeGreaterThan(0);
        for (const value of values)
        {
            expect(value).toMatch(/^\d\.\d{3}$/);
            expect(Number(value)).toBeLessThanOrEqual(1);
        }
    });

    test('removes the ring property when the fight is left', async ({ page }) => {
        await startAs(page, { progress: MINIBOSS });

        await page.keyboard.press('Escape');
        await page.locator('.pause-leave').click();
        await page.locator('.pause-confirm-yes').click();

        await expect(page.locator('.boss-timer')).toHaveText('');
        expect(await timerLeft(page)).toBe('');
        await expectStyle(page.locator('.boss-timer'), { display: 'none' });
    });

    test('draws the enemy chips with a dot and three icons, text unchanged', async ({ page }) => {
        await startAs(page, { monster: bare('NATURE', 10, 20, 30) });

        await expect(page.locator('.enemy-stats')).toHaveText('Nature  Physical def 10%  Magical def 20%  Crit res 30%');
        await expectStyle(page.locator('.enemy-stats'), { 'background-color': 'rgba(0, 0, 0, 0)' });
        await expectStyle(page.locator('.tag-element'), { 'background-color': 'rgba(28, 18, 12, 0.85)', 'border-top-color': 'rgb(176, 122, 58)' });
        expect(await page.locator('.tag-element').getAttribute('data-element')).toBe('NATURE');
        expect((await css(page.locator('.tag-element'), [ 'background-color' ], '::before'))['background-color']).toBe('rgb(79, 154, 60)');
        expect((await css(page.locator('.tag-element'), [ 'width' ], '::before')).width).toBe('10px');
        expect((await css(page.locator('[data-stat="physical"]'), [ 'background-color' ], '::before'))['background-color']).toBe('rgb(176, 122, 58)');
        expect((await css(page.locator('[data-stat="physical"]'), [ 'width' ], '::before')).width).toBe('12px');
        expect((await css(page.locator('[data-stat="magical"]'), [ 'background-color' ], '::before'))['background-color']).toBe('rgb(63, 143, 209)');
        expect((await css(page.locator('[data-stat="crit"]'), [ 'background-color' ], '::before'))['background-color']).toBe('rgb(214, 69, 65)');

        for (const tag of await page.locator('.enemy-stats .tag').all())
        {
            await expectStyle(tag, {
                'background-color': 'rgba(28, 18, 12, 0.85)',
                'border-top-color': 'rgb(176, 122, 58)',
                color: 'rgb(244, 230, 200)'
            });
        }
    });

    test('draws the element dot of each of the five elements', async ({ page }) => {
        await startAs(page, { monster: bare('NATURE') });
        const tag = page.locator('.tag-element');
        const dots = {
            FIRE: 'rgb(232, 100, 60)', WATER: 'rgb(63, 143, 209)', NATURE: 'rgb(79, 154, 60)', LIGHT: 'rgb(242, 201, 76)', DARKNESS: 'rgb(74, 58, 122)'
        };

        //  The dot is a CSS rule keyed by data-element: each element is set on the same tag and read back
        for (const [ element, color ] of Object.entries(dots))
        {
            await tag.evaluate((node, name) => node.setAttribute('data-element', name), element);
            expect((await css(tag, [ 'background-color' ], '::before'))['background-color']).toBe(color);
        }
    });

    //  One game per start: a second start on the same page would find the saved session of yan
    for (const [ element, text, weak ] of [ [ 'FIRE', 'Fraco: Água', 'WATER' ], [ 'WATER', 'Fraco: Natureza', 'NATURE' ], [ 'NATURE', 'Fraco: Fogo', 'FIRE' ] ])
    {
        test(`shows ${text} for the ${element} enemy`, async ({ page }) => {
            await startAs(page, { monster: bare(element) });

            await expect(page.getByTestId('weak-chip')).toHaveText(text);
            expect(await page.getByTestId('weak-chip').getAttribute('data-element')).toBe(weak);
            expect((await css(page.getByTestId('weak-chip'), [ 'background-color' ], '::before'))['background-color']).toBe(
                { WATER: 'rgb(63, 143, 209)', NATURE: 'rgb(79, 154, 60)', FIRE: 'rgb(232, 100, 60)' }[weak]
            );
        });
    }

    for (const element of [ 'LIGHT', 'DARKNESS' ])
    {
        test(`shows no weak element for the ${element} enemy`, async ({ page }) => {
            await startAs(page, { monster: bare(element) });

            await expect(page.getByTestId('weak-chip')).toBeHidden();
            await expect(page.getByTestId('weak-chip')).toHaveText('');
        });
    }

    test('keeps the weak chip and the enemy line clear of the bar and the rail', async ({ page }) => {
        await startAs(page, { monster: bare('FIRE') });
        const chip = await page.getByTestId('weak-chip').boundingBox();
        const line = await page.locator('.enemy-stats').boundingBox();
        const bar = await page.locator('.battle-bar').boundingBox();
        const rail = await page.locator('.hero-hud').boundingBox();

        for (const box of [ chip, line ])
        {
            expect(overlaps(box, bar)).toBe(false);
            expect(overlaps(box, rail)).toBe(false);
        }
    });

    test('draws the rail as framed wood squares on parchment', async ({ page }) => {
        await startAs(page, {});
        const rail = [
            [ 'hud-heroes', 'Heróis' ], [ 'hud-bag', 'Mochila' ], [ 'hud-fusion', 'Fusão' ], [ 'hud-leader', 'Líder' ],
            [ 'hud-equipment', 'Equipamento' ], [ 'hud-talents', 'Talentos' ], [ 'hud-farm', 'Rever chefes' ]
        ];

        await expectStyle(page.locator('.hero-hud'), {
            'background-color': 'rgb(234, 214, 173)',
            'border-top-width': '3px',
            'border-top-left-radius': '10px'
        });
        expect(await page.locator('.hero-hud [data-testid^="hud-"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid))).toEqual(rail.map(([ id ]) => id));

        for (const [ id, label ] of rail)
        {
            const button = page.getByTestId(id);

            await expect(button).toContainText(label);
            expect(await button.evaluate((node) => [ node.offsetWidth, node.offsetHeight, node.scrollWidth <= node.clientWidth ])).toEqual([ 76, 60, true ]);
            await expectStyle(button, {
                'background-color': 'rgb(43, 29, 20)',
                'border-top-color': 'rgb(176, 122, 58)',
                'border-top-left-radius': '6px',
                color: 'rgb(244, 230, 200)'
            });
            await expectStyle(button.locator('svg').first(), { color: 'rgb(224, 180, 90)' });
        }
    });

    test('draws the talents badge as an ember dot with dark text', async ({ page }) => {
        await startAs(page, { talentPoints: 1 });

        await expect(page.getByTestId('talents-badge')).toBeVisible();
        await expectStyle(page.getByTestId('talents-badge'), { 'background-color': 'rgb(232, 116, 42)', color: 'rgb(42, 26, 16)' });
    });

    test('draws the battle bar, leader card and skill frames', async ({ page }) => {
        await startAs(page, { copies: { 'kael:3': 1 } });

        expect(await page.locator('.battle-bar').evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 984, 124 ]);
        await expectStyle(page.locator('.battle-bar'), { 'background-color': 'rgb(234, 214, 173)', 'border-top-left-radius': '12px' });
        expect(await page.getByTestId('leader-card').evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 240, 104 ]);
        await expectStyle(page.getByTestId('leader-card'), { 'background-color': 'rgb(43, 29, 20)', 'border-top-color': 'rgb(176, 122, 58)' });
        expect(await page.locator('.leader-face').evaluate((node) => getComputedStyle(node).boxShadow)).toContain('rgb(224, 180, 90) 0px 0px 0px 3px');
        await expectStyle(page.locator('.leader-card .leader-name'), { 'font-size': '15px', color: 'rgb(243, 213, 138)' });
        await expectStyle(page.locator('.leader-bonus'), { color: 'rgb(244, 230, 200)' });

        const art = page.getByTestId('skill-slot-1').locator('img');

        expect(await art.evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 150, 62 ]);
        await expectStyle(art, {
            'border-top-width': '2px',
            'border-top-color': 'rgb(176, 122, 58)',
            'border-top-left-radius': '8px',
            'background-color': 'rgb(28, 18, 12)'
        });
        expect(await art.evaluate((node) => getComputedStyle(node).boxShadow)).toContain('rgb(224, 180, 90) 0px 0px 0px 2px');
        expect(await page.getByTestId('skill-key-1').evaluate((node) => node.offsetWidth)).toBe(20);
        await expectStyle(page.getByTestId('skill-key-1'), {
            'background-color': 'rgb(28, 18, 12)',
            'border-top-color': 'rgb(224, 180, 90)',
            color: 'rgb(243, 213, 138)'
        });
    });

    test('shows the whole leader name in the battle card for each of the five heroes', async ({ page }) => {
        const names = { kael: 'Kael Raizférrea', lyra: 'Lyra Folhaveloz', orina: 'Orina Brumaestrela', seraphine: 'Seraphine Aurora', vex: 'Vex Sombraespinho' };

        await startAs(page, { copies: Object.fromEntries(Object.keys(names).map((hero) => [ `${hero}:3`, 1 ])) });
        await openScreen(page, 'leader');

        for (const [ hero, name ] of Object.entries(names))
        {
            //  The Líder screen stays open after a pick; Kael is already the leader, so his click changes nothing
            await page.getByTestId(`leader-entry-${hero}`).click();
            await expect(page.getByTestId(`leader-entry-${hero}`)).toHaveClass(/is-current/);

            const label = page.locator('.leader-card .leader-name');

            await expect(label).toHaveText(name);
            await expectStyle(label, { 'font-size': '15px', 'white-space': 'normal', 'text-overflow': 'clip' });

            const fit = await label.evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth, height: node.offsetHeight }));

            expect(fit.scroll).toBeLessThanOrEqual(fit.client);
            //  Two lines of 15 px x 1.1 at most
            expect(fit.height).toBeLessThanOrEqual(34);
            expect(inside(await page.locator('.leader-card .leader-text').boundingBox(), await page.getByTestId('leader-card').boundingBox())).toBe(true);
            expect(await page.getByTestId('leader-card').evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 240, 104 ]);
        }
    });

    test('draws the lock mark of a locked skill in gold on dark', async ({ page }) => {
        await startAs(page, { copies: { 'kael:1': 1 } });

        await expectStyle(page.getByTestId('skill-slot-2').locator('.skill-lock-mark'), {
            'background-color': 'rgba(28, 18, 12, 0.85)',
            color: 'rgb(224, 180, 90)'
        });
    });

    test('shows the dark frame behind a skill image that fails to load', async ({ page }) => {
        await page.route('**/assets/heroes/kael_charge.jpg', (route) => route.abort());
        await startAs(page, { copies: { 'kael:3': 1 } });

        await expectStyle(page.getByTestId('skill-slot-2').locator('img'), { 'background-color': 'rgb(28, 18, 12)' });
    });

    test('draws the auto click window on parchment with a green switch when on', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openAutoClick(page);

        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await expectStyle(page.getByTestId('auto-click-popover'), { 'background-color': 'rgb(234, 214, 173)', 'border-top-left-radius': '10px' });
        expect(await page.getByTestId('auto-click-popover').evaluate((node) => node.offsetWidth)).toBe(240);
        await expectStyle(page.getByTestId('auto-click-toggle'), { 'background-color': 'rgb(63, 143, 58)' });
        await page.getByTestId('auto-click-toggle').uncheck();
        await expectStyle(page.getByTestId('auto-click-toggle'), { 'background-color': 'rgb(61, 42, 28)' });
        await expectStyle(page.getByTestId('auto-click-upgrade'), { 'background-color': 'rgb(168, 67, 26)' });
    });

    test('shows the round auto click button in the bar with A and 500 ms, and nothing left of the monster', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        const button = page.getByTestId('auto-click-button');
        const canvas = await canvasBox(page);

        expect(await button.evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 56, 56 ]);
        await expectStyle(button, { 'background-color': 'rgb(43, 29, 20)' });
        expect(await button.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain('data:image/svg+xml');
        await expect(page.getByTestId('auto-click-key')).toHaveText('A');
        expect(await page.getByTestId('auto-click-key').evaluate((node) => node.offsetWidth)).toBe(20);
        await expect(page.getByTestId('auto-click-rate')).toHaveText('500 ms');

        const box = await button.boundingBox();
        const bar = await page.locator('.battle-bar').boundingBox();
        const centre = ((box.x + box.width / 2 - canvas.x) * 1024) / canvas.width;

        expect(inside(box, bar)).toBe(true);
        expect(Math.abs(centre - 867)).toBeLessThanOrEqual(1.5);

        const monsterCentre = sceneX(canvas, 670);

        for (const node of await page.locator('[data-testid^="auto-click"]').all())
        {
            const nodeBox = await node.boundingBox();

            if (nodeBox) { expect(nodeBox.x + nodeBox.width).toBeGreaterThanOrEqual(monsterCentre); }
        }
    });

    test('shows the auto click button at 250 ms at level 1', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 }, autoClick: { level: 1, crystals: 0 } });

        await expect(page.getByTestId('auto-click-rate')).toHaveText('250 ms');
    });

    test('shows no auto click button in chapter 1', async ({ page }) => {
        await startAs(page, {});

        await expect(page.getByTestId('auto-click-button')).toBeHidden();
        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await page.keyboard.press('a');
        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        expect(await page.locator('[data-testid^="auto-click"]:visible').count()).toBe(0);
    });

    test('rings the button green while the auto click is on and bronze when it is off', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        const button = page.getByTestId('auto-click-button');

        await expectStyle(button, { 'border-top-color': 'rgb(95, 211, 90)' });
        expect(await button.evaluate((node) => getComputedStyle(node).boxShadow)).toContain('rgba(95, 211, 90, 0.75) 0px 0px 14px 4px');

        await openAutoClick(page);
        await page.getByTestId('auto-click-toggle').uncheck();
        await page.keyboard.press('Escape');

        await expectStyle(button, { 'border-top-color': 'rgb(176, 122, 58)' });
        expect(await button.evaluate((node) => getComputedStyle(node).boxShadow)).not.toContain('95, 211, 90');
    });

    test('opens the window on a click with the focus on the switch', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        const button = page.getByTestId('auto-click-button');

        await button.click();

        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByTestId('auto-click-toggle')).toBeFocused();
        await expect(button).toHaveAttribute('aria-label', 'Auto clique');
        await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
        await expect(button).toHaveAttribute('aria-controls', 'auto-click-popover');
        await expect(page.getByTestId('auto-click-popover')).toHaveAttribute('id', 'auto-click-popover');
        await expect(page.getByTestId('auto-click-popover')).toHaveAttribute('role', 'dialog');
        await expect(page.getByTestId('auto-click-popover')).toHaveAttribute('aria-label', 'Auto clique');
    });

    test('opens the window with Enter on the focused button', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });

        await page.getByTestId('auto-click-button').focus();
        await page.keyboard.press('Enter');

        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    });

    test('opens the window with Space on the focused button', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });

        await page.getByTestId('auto-click-button').focus();
        await page.keyboard.press('Space');

        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    });

    test('holds the old card\'s controls in order, the reset from chapter 2', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        await openAutoClick(page);

        expect(await page.locator('#auto-click-popover [data-testid]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid)))
            .toEqual([ 'auto-click-toggle', 'auto-click-interval', 'auto-click-crystals', 'auto-click-upgrade', 'reset-account' ]);
        await expect(page.getByTestId('auto-click-toggle')).toBeChecked();
        await expect(page.getByTestId('auto-click-interval')).toHaveText('500 ms');
        await expect(page.getByTestId('auto-click-crystals')).toHaveText('Cristais: 0');
        await expect(page.getByTestId('auto-click-upgrade')).toHaveText('Melhorar: 250 ms (10 cristais)');
        await expect(page.getByTestId('reset-account')).toHaveText('Resetar conta (+3 cristais)');
    });

    test('opens and closes the window with A, the focus back on the button', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });

        await page.keyboard.press('a');

        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await expect(page.getByTestId('auto-click-toggle')).toBeFocused();

        await page.keyboard.press('a');

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await expect(page.getByTestId('auto-click-button')).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByTestId('auto-click-button')).toBeFocused();
    });

    test('ignores a held A that repeats while the window is open', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });

        await page.keyboard.down('a');
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await page.keyboard.down('a');
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
        await page.keyboard.up('a');
    });

    test('closes the window with Escape without pausing', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openAutoClick(page);

        await page.keyboard.press('Escape');

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await expect(page.locator('.pause-menu')).toBeHidden();
        await expect(page.getByTestId('auto-click-button')).toBeFocused();

        await page.keyboard.press('Escape');

        await expect(page.locator('.pause-menu')).toBeVisible();
    });

    test('closes the window with a second activation of the button', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openAutoClick(page);

        await page.getByTestId('auto-click-button').click();

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await expect(page.getByTestId('auto-click-button')).toHaveAttribute('aria-expanded', 'false');
    });

    test('closes the window on a click on the monster, and the click still hits', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });

        await page.getByTestId('auto-click-button').click();
        await page.getByTestId('auto-click-toggle').uncheck();
        await page.keyboard.press('Escape');
        const before = await health(page);

        await openAutoClick(page);
        await hitMonsterAt(page);

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await expect.poll(() => health(page)).toBeLessThan(before);
    });

    test('does not hit the monster when the button or the window is clicked', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');
            const hit = scene.hitMonster.bind(scene);

            window.__pointerHits = 0;
            scene.hitMonster = (pointer) => { window.__pointerHits += 1; hit(pointer); };
        });

        await page.getByTestId('auto-click-button').click();
        await page.getByTestId('auto-click-toggle').click();
        await page.getByTestId('auto-click-button').click();

        expect(await page.evaluate(() => window.__pointerHits)).toBe(0);
    });

    test('ignores A while a hero screen is open', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openScreen(page, 'heroes');

        await page.keyboard.press('a');
        await expect(page.getByTestId('auto-click-popover')).toBeHidden();

        await page.getByTestId('hero-close').click();
        await page.keyboard.press('a');
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();
    });

    test('ignores A while the pause menu is open', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });

        await page.keyboard.press('Escape');
        await expect(page.locator('.pause-menu')).toBeVisible();
        await page.keyboard.press('a');

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
    });

    test('ignores A typed into a text field', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await page.evaluate(() => {
            const field = document.createElement('input');

            field.type = 'text';
            field.dataset.testid = 'probe-field';
            document.body.appendChild(field);
        });
        const field = page.getByTestId('probe-field');

        await field.focus();
        await page.keyboard.press('a');

        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
        await expect(field).toHaveValue('a');
        await field.evaluate((node) => node.remove());
    });

    test('closes the window when its reset button opens the dialog', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        await openAutoClick(page);

        await page.getByTestId('reset-account').click();

        await expect(page.getByTestId('reset-dialog')).toBeVisible();
        await expect(page.getByTestId('auto-click-popover')).toBeHidden();
    });

    test('grows the window upward for the reset button and ends 10 px above the button', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        await openAutoClick(page);
        const canvas = await canvasBox(page);
        const popover = await autoClickOpen(page).boundingBox();
        const button = await page.getByTestId('auto-click-button').boundingBox();

        expect(Math.abs(button.y - popover.y - popover.height - 10 * canvas.width / 1024)).toBeLessThanOrEqual(1);
    });

    test('keeps the bar\'s boxes apart and the window left of the rail', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        const boxes = {
            skills: await page.locator('.skill-bar-host').boundingBox(),
            autoClick: await page.locator('.hud-auto-click').boundingBox(),
            farm: await page.locator('.hud-farm').boundingBox(),
            leader: await page.getByTestId('leader-card').boundingBox(),
            rail: await page.locator('.hero-hud').boundingBox(),
            bar: await page.locator('.battle-bar').boundingBox()
        };
        const names = [ 'skills', 'autoClick', 'farm', 'leader' ];

        for (const name of names)
        {
            expect(inside(boxes[name], boxes.bar)).toBe(true);
            expect(overlaps(boxes[name], boxes.rail)).toBe(false);
        }
        for (let i = 0; i < names.length; i++)
        {
            for (let j = i + 1; j < names.length; j++) { expect(overlaps(boxes[names[i]], boxes[names[j]])).toBe(false); }
        }

        await openAutoClick(page);
        const canvas = await canvasBox(page);
        const popover = await autoClickOpen(page).boundingBox();

        expect(inside(popover, canvas)).toBe(true);
        expect(popover.x + popover.width).toBeLessThan(boxes.rail.x);
    });

    test('places the skill bar, the auto click and the farm button at their scene ranges', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        const canvas = await canvasBox(page);

        for (const [ selector, from, to ] of [ [ '.skill-bar-host', 313, 787 ], [ '.hud-auto-click', 827, 907 ], [ '.hud-farm', 911, 991 ] ])
        {
            const span = sceneSpan(canvas, await page.locator(selector).boundingBox());

            expect(Math.abs(span.from - from)).toBeLessThanOrEqual(1);
            expect(Math.abs(span.to - to)).toBeLessThanOrEqual(1);
        }
    });

    test('draws the farm switch as a round skull button with an ember ring when on', async ({ page }) => {
        await startAs(page, {});
        const farm = page.locator('.farm-toggle input');

        expect(await farm.evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 56, 56 ]);
        await expectStyle(farm, { 'background-color': 'rgb(43, 29, 20)', 'border-top-width': '3px', 'border-top-color': 'rgb(176, 122, 58)' });
        expect(await farm.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain('data:image/svg+xml');
        await expectStyle(page.locator('.farm-toggle'), { 'font-size': '12px', color: 'rgb(42, 26, 16)' });
        await expect(page.locator('.farm-toggle')).toContainText('Farm boss');

        await farm.evaluate((node) => { node.checked = true; });
        await expectStyle(farm, { 'border-top-color': 'rgb(232, 116, 42)' });
        expect(await farm.evaluate((node) => getComputedStyle(node).boxShadow)).toContain('rgba(232, 116, 42, 0.75) 0px 0px 12px 2px');
    });

    test('keeps the focus on the switch when the window re-renders', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openAutoClick(page);

        await page.getByTestId('auto-click-toggle').focus();
        await page.keyboard.press('Space');

        await expect(page.getByTestId('auto-click-toggle')).not.toBeChecked();
        await expect(page.getByTestId('auto-click-toggle')).toBeFocused();
    });

    test('keeps the fight running behind a hero screen', async ({ page }) => {
        await startAs(page, { progress: { chapter: 2 } });
        await openScreen(page, 'heroes');
        const opened = await health(page);

        await expect.poll(() => health(page), { timeout: 5000 }).toBeLessThan(opened);
    });

    test('dims the fight and draws the pause card on parchment', async ({ page }) => {
        await startAs(page, {});

        await page.keyboard.press('Escape');
        await expect(page.locator('.pause-menu')).toBeVisible();
        await expectStyle(page.locator('.pause-menu'), { 'background-color': 'rgba(28, 18, 12, 0.62)' });
        await expectStyle(page.locator('.pause-card'), { 'background-color': 'rgb(234, 214, 173)', 'border-top-left-radius': '12px' });
        expect(await page.locator('.pause-card').evaluate((node) => node.offsetWidth)).toBe(420);
        await expectStyle(page.locator('.pause-title'), { 'font-size': '40px', color: 'rgb(42, 26, 16)' });
        expect((await css(page.locator('.pause-title'), [ 'font-family' ]))['font-family']).toMatch(/^"?Cinzel/);

        await page.getByRole('button', { name: '1. Continue' }).click();
        await openScreen(page, 'heroes');
        await expectStyle(page.locator('.hero-panel'), { 'background-color': 'rgba(28, 18, 12, 0.62)' });
    });

    test('dims the reset dialog and draws its card on parchment', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        await openAutoClick(page);
        await page.getByTestId('reset-account').click();

        await expect(page.getByTestId('reset-dialog')).toBeVisible();
        await expectStyle(page.getByTestId('reset-dialog'), { 'background-color': 'rgba(28, 18, 12, 0.62)' });
        await expectStyle(page.locator('.reset-card'), { 'background-color': 'rgb(234, 214, 173)', 'border-top-left-radius': '12px' });
        expect(await page.locator('.reset-card').evaluate((node) => node.offsetWidth)).toBe(420);
    });

    test('draws the hero window, title and inset cards', async ({ page }) => {
        await startAs(page, { copies: { 'kael:5': 1 } });
        await openScreen(page, 'heroes');
        const window_ = page.locator('.hero-window');

        expect(await window_.evaluate((node) => node.offsetWidth)).toBe(920);
        await expectStyle(window_, {
            'background-color': 'rgb(234, 214, 173)',
            'border-top-width': '3px',
            'border-top-color': 'rgb(90, 61, 38)',
            'border-top-left-radius': '12px'
        });
        await expectStyle(page.locator('.hero-title'), { 'font-size': '30px', color: 'rgb(42, 26, 16)' });
        await expectStyle(page.getByTestId('hero-card-kael'), {
            'background-color': 'rgb(230, 208, 162)',
            'border-top-width': '1px',
            'border-top-color': 'rgba(90, 61, 38, 0.45)',
            'border-top-left-radius': '8px'
        });
        expect(await page.getByTestId('hero-card-kael').locator('img').evaluate((node) => getComputedStyle(node).backgroundImage)).toContain('radial-gradient');
        expect(await page.getByTestId('hero-card-kael').locator('img').evaluate((node) => getComputedStyle(node).backgroundImage)).toContain('rgb(90, 61, 38)');
    });

    test('keeps the five hero cards the same size with every name inside its card', async ({ page }) => {
        const heroes = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

        await startAs(page, { copies: Object.fromEntries(heroes.map((hero) => [ `${hero}:3`, 1 ])) });
        await openScreen(page, 'heroes');

        const sizes = [];

        for (const hero of heroes)
        {
            const card = page.getByTestId(`hero-card-${hero}`);
            const box = await card.boundingBox();
            //  Screen pixels per CSS pixel (the scene is scaled to the viewport)
            const scale = box.width / await card.evaluate((node) => node.offsetWidth);
            //  The card's content box: 1 px border + 8 px padding on each side
            const content = { x: box.x + 9 * scale, y: box.y, width: box.width - 18 * scale, height: box.height };

            sizes.push(await card.evaluate((node) => [ node.offsetWidth, node.querySelector('img').offsetHeight ]));
            await expectStyle(card.locator('.hero-name'), { 'font-size': '15px' });
            expect(inside(await card.locator('.hero-name').boundingBox(), content)).toBe(true);
        }

        expect(new Set(sizes.map(([ width ]) => width)).size).toBe(1);
        expect(new Set(sizes.map(([ , height ]) => height)).size).toBe(1);
    });

    test('draws the error line in ember', async ({ page }) => {
        const { backend } = await startAs(page, { copies: { 'kael:4': 3 } });
        await openScreen(page, 'fusion');

        backend.cardsOf('yan').copies['kael:4'] = 1;
        await page.getByTestId('fusion-button-kael-4').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível fundir as cartas.');
        await expectStyle(page.locator('.hero-error'), { 'background-color': 'rgb(138, 53, 16)', color: 'rgb(244, 230, 200)' });
    });

    test('keeps the AD-020 star colours on the inset cards', async ({ page }) => {
        await startAs(page, { copies: { 'kael:5': 1, 'orina:7': 1 } });
        await openScreen(page, 'heroes');

        await expectStyle(page.getByTestId('hero-card-kael').locator('.hero-stars'), { color: 'rgb(122, 63, 160)' });
        await expectStyle(page.getByTestId('hero-card-orina').locator('.hero-stars'), { 'background-color': 'rgb(217, 165, 33)', color: 'rgb(32, 30, 29)' });
    });

    test('draws the Líder rows in dark ink, the current one too', async ({ page }) => {
        await startAs(page, { copies: { 'kael:5': 1, 'lyra:4': 1 } });
        await openScreen(page, 'leader');

        //  Kael leads, so his row is the current one (parchment-100); Lyra's row is an inset card (parchment-300)
        for (const [ hero, background ] of [ [ 'kael', 'rgb(244, 230, 200)' ], [ 'lyra', 'rgb(230, 208, 162)' ] ])
        {
            const row = page.getByTestId(`leader-entry-${hero}`);
            const { color, 'font-size': size } = await css(row.locator('.leader-name'), [ 'color', 'font-size' ]);
            const { 'background-color': back } = await css(row, [ 'background-color' ]);

            expect(color).toBe('rgb(42, 26, 16)');
            expect(size).toBe('18px');
            expect(back).toBe(background);
            expect(ratio(color, back)).toBeGreaterThanOrEqual(4.5);
        }
    });

    test('draws dark piece tiles and a parchment piece tooltip', async ({ page }) => {
        await startAs(page, { equipment: [ piece('b1', 'ARMOR', 'COMMON') ] });
        await openScreen(page, 'equipment');
        const tile = page.getByTestId('equip-piece-b1');

        await expectStyle(tile, { 'background-color': 'rgb(43, 29, 20)' });
        await tile.hover();
        await expectStyle(page.locator('.piece-tooltip'), {
            'background-color': 'rgb(234, 214, 173)',
            'border-top-width': '2px',
            'border-top-color': 'rgb(90, 61, 38)',
            'border-top-left-radius': '8px'
        });
    });

    test('draws the skill tooltip on parchment', async ({ page }) => {
        await startAs(page, {});
        await page.getByTestId('skill-slot-1').hover();

        await expectStyle(page.locator('.skill-tooltip'), {
            'background-color': 'rgb(234, 214, 173)',
            'border-top-width': '2px',
            'border-top-color': 'rgb(90, 61, 38)',
            'border-top-left-radius': '8px'
        });
    });

    test('keeps the skill art and its text inside the skill tooltip, locked or not', async ({ page }) => {
        //  Kael 1 star: slot 1 unlocked, slot 2 locked
        await startAs(page, { copies: { 'kael:1': 1 } });

        for (const [ slot, filter ] of [ [ 1, 'none' ], [ 2, 'grayscale(1)' ] ])
        {
            await page.getByTestId(`skill-slot-${slot}`).hover();

            const tooltip = page.getByTestId('skill-tooltip');
            const art = tooltip.locator('.skill-art');

            await expect(tooltip).toBeVisible();
            expect(await art.evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 112, 64 ]);
            await expectStyle(art, { filter, 'box-shadow': 'none' });
            await expectStyle(tooltip.locator('.skill-row'), { 'background-color': 'rgba(0, 0, 0, 0)', 'border-top-width': '0px', 'padding-left': '0px' });
            expect(inside(await tooltip.locator('.skill-row > div').boundingBox(), await tooltip.boundingBox())).toBe(true);
            await page.mouse.move(0, 0);
            await expect(tooltip).toHaveCount(0);
        }

        //  The bar's own art keeps its frame
        expect(await page.getByTestId('skill-slot-1').locator('img').evaluate((node) => [ node.offsetWidth, node.offsetHeight ])).toEqual([ 150, 62 ]);
    });

    test('draws talent cards on light parchment', async ({ page }) => {
        await startAs(page, {});
        await openScreen(page, 'talents');

        await expectStyle(page.locator('.talent-card').first(), { 'background-color': 'rgb(244, 230, 200)' });
    });

    test('draws the talent buttons, titles and max marks in the dark branch ink', async ({ page }) => {
        const inks = { TIME: 'rgb(36, 93, 100)', BREAK: 'rgb(149, 55, 36)', POWER: 'rgb(108, 83, 17)', COMBO: 'rgb(106, 49, 197)' };

        //  CLICK_DAMAGE at its maximum shows `Nível máximo`; 10 points enable the other buttons
        await startAs(page, { talents: { CLICK_DAMAGE: 10 }, talentPoints: 10 });
        await openScreen(page, 'talents');

        for (const [ branch, ink ] of Object.entries(inks))
        {
            const column = page.getByTestId(`talent-branch-${branch}`);
            const button = column.locator('.talent-upgrade').first();
            const { 'background-color': columnBack } = await css(column, [ 'background-color' ]);

            await expect(button).toBeEnabled();
            await expectStyle(button, { 'background-color': ink, color: 'rgb(244, 230, 200)' });
            expect(ratio(ink, 'rgb(244, 230, 200)')).toBeGreaterThanOrEqual(4.5);
            await expectStyle(column.locator('.talent-branch-title'), { color: ink });
            expect(columnBack).toBe('rgb(230, 208, 162)');
            expect(ratio(ink, columnBack)).toBeGreaterThanOrEqual(4.5);
        }

        await expectStyle(page.getByTestId('talent-max-CLICK_DAMAGE'), { color: inks.POWER });
        //  The card bar keeps the bright branch colour
        expect((await css(page.getByTestId('talent-CRIT_CHANCE'), [ 'box-shadow' ]))['box-shadow']).toContain('rgb(201, 154, 31) 4px 0px 0px 0px inset');
    });

    test('frames the chapter map with a wood and a bronze ring', async ({ page }) => {
        await startAs(page, { progress: { stage: 4, encounter: 'PHASE', phase: 2 } });
        await page.getByTestId('hud-farm').click();
        await expect(page.getByTestId('farm-map')).toBeVisible();

        const shadow = await page.getByTestId('farm-map').evaluate((node) => getComputedStyle(node).boxShadow);

        expect(shadow).toContain('rgb(90, 61, 38) 0px 0px 0px 3px');
        expect(shadow).toContain('rgb(176, 122, 58) 0px 0px 0px 5px');
    });

    test('draws the element wheel on parchment', async ({ page }) => {
        await startAs(page, {});

        await expectStyle(page.getByTestId('element-wheel'), { 'background-color': 'rgb(234, 214, 173)', 'border-top-left-radius': '10px' });
        await expectStyle(page.locator('.wheel-title'), { 'font-weight': '700' });
        expect((await css(page.locator('.wheel-title'), [ 'font-family' ]))['font-family']).toMatch(/^"?Cinzel/);
    });

    test('draws the menu oval on parchment with a wood rim', async ({ page }) => {
        await openMenu(page);

        const ovals = await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('MainMenu').children.list
            .filter((child) => child.type === 'Ellipse')
            .map((child) => ({ fillColor: child.fillColor, strokeColor: child.strokeColor, lineWidth: child.lineWidth, x: child.x, y: child.y, width: child.width, height: child.height })));

        //  The oval has a dark shadow ellipse behind it (not in the spec); the parchment oval is the one with the fill of UIR-15
        expect(ovals.filter((oval) => oval.fillColor === 0xead6ad)).toEqual([ { fillColor: 0xead6ad, strokeColor: 0x5a3d26, lineWidth: 6, x: 170, y: 380, width: 700, height: 1040 } ]);
    });

    test('draws the login fields on parchment with an ember border when focused', async ({ page }) => {
        const menu = await openMenu(page);

        await expectStyle(menu.username, {
            'background-color': 'rgb(244, 230, 200)',
            'border-top-width': '2px',
            'border-top-color': 'rgb(90, 61, 38)',
            color: 'rgb(42, 26, 16)'
        });

        for (let i = 0; i < 40; i++)
        {
            if (await menu.username.evaluate((node) => node === document.activeElement)) { break; }
            await page.keyboard.press('Tab');
        }

        await expect(menu.username).toBeFocused();
        await expectStyle(menu.username, { 'border-top-color': 'rgb(204, 78, 26)' });
    });

    test('draws the path choice on parchment with inset options', async ({ page }) => {
        const menu = await openMenu(page);

        await fillCredentials(menu, 'novo', 'secret123');
        await menu.signupButton.click();

        await expect(page.locator('.path-choice')).toBeVisible();
        //  The pointer rests where Sign up was clicked, and the option under it shows its hover colour
        await page.mouse.move(0, 0);
        await expectStyle(page.locator('.path-choice'), { 'background-color': 'rgb(234, 214, 173)' });
        await expectStyle(page.locator('.path-option').first(), { 'background-color': 'rgb(230, 208, 162)' });
    });

    test('draws the preloader bar with a gold outline and an ember fill', async ({ page }) => {
        let release;
        const held = new Promise((resolve) => { release = resolve; });

        await page.route('**/assets/heroes/vex_sprite.png', async (route) => { await held; await route.continue(); });
        await mockBackend(page, { users: { yan: 'secret123' } });
        await page.goto('/');
        await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));
        await page.locator('#game-container canvas').click();
        //  The Preloader is still loading (held by the route), so it is not an active scene yet: its bar is what the test waits for
        await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list.length)).toBeGreaterThan(0);

        const rectangles = await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list
            .filter((child) => child.type === 'Rectangle')
            .map((child) => ({ x: child.x, y: child.y, width: child.width, height: child.height, strokeColor: child.strokeColor, lineWidth: child.lineWidth, fillColor: child.fillColor })));

        release();

        expect(rectangles).toContainEqual(expect.objectContaining({ x: 512, y: 384, width: 468, height: 32, strokeColor: 0xe0b45a, lineWidth: 2 }));
        expect(rectangles).toContainEqual(expect.objectContaining({ fillColor: 0xe8742a }));
    });

    test('draws the boot and preloader screens on dark wood with no sky image', async ({ page }) => {
        let release;
        const held = new Promise((resolve) => { release = resolve; });
        const requests = [];

        page.on('request', (request) => requests.push(request.url()));
        await page.route('**/assets/heroes/vex_sprite.png', async (route) => { await held; await route.continue(); });
        await mockBackend(page, { users: { yan: 'secret123' } });
        await page.goto('/');
        await page.waitForFunction(() => window.__PHASER_GAME__?.registry.has('highscore'));

        //  The Boot screen shows only the game background until the first click
        expect(await page.evaluate(() => window.__PHASER_GAME__.config.backgroundColor.color)).toBe(0x1c120c);

        await page.locator('#game-container canvas').click();
        await expect.poll(() => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list.length)).toBeGreaterThan(0);

        const children = await page.evaluate(() => window.__PHASER_GAME__.scene.getScene('Preloader').children.list
            .map((child) => ({ type: child.type, x: child.x, y: child.y, width: child.width, height: child.height, fillColor: child.fillColor, isFilled: child.isFilled })));

        release();

        expect(children.map((child) => child.type)).not.toContain('Image');
        expect(children).toContainEqual(expect.objectContaining({ type: 'Rectangle', x: 512, y: 384, width: 468, height: 32, fillColor: 0x2b1d14, isFilled: true }));
        expect(requests.filter((url) => url.includes('preloader.png'))).toEqual([]);
    });

    test('shows no magenta in the skill bar', async ({ page }) => {
        await startAs(page, { copies: { 'kael:3': 1 } });

        for (const slot of [ 1, 2, 3 ]) { await expectNoMagenta(page.getByTestId(`skill-slot-${slot}`).locator('img')); }
    });

    test('shows no magenta in the detail of any of the five heroes', async ({ page }) => {
        const heroes = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];

        await startAs(page, { copies: Object.fromEntries(heroes.map((hero) => [ `${hero}:3`, 1 ])) });
        await openScreen(page, 'heroes');

        for (const hero of heroes)
        {
            await page.getByTestId(`hero-card-${hero}`).click();
            const arts = page.locator('img.skill-art, .skill-art img');

            await expect(arts).toHaveCount(3);
            for (const art of await arts.all()) { await expectNoMagenta(art); }
            await page.getByTestId('hero-back').click();
        }
    });

    test('shows no magenta in a bag entry and a skill tooltip', async ({ page }) => {
        await startAs(page, { copies: { 'lyra:3': 1 } });
        await openScreen(page, 'bag');
        await page.getByTestId('bag-entry-lyra-3').click();

        const arts = page.locator('img.skill-art, .skill-art img');

        await expect(arts).toHaveCount(3);
        for (const art of await arts.all()) { await expectNoMagenta(art); }

        await page.getByTestId('hero-close').click();
        await page.getByTestId('skill-slot-1').hover();
        await expectNoMagenta(page.locator('.skill-tooltip img'));
    });
});

test.describe('Round auto click button on a 390 x 844 phone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('keeps the round button and its window inside the scaled scene', async ({ page }) => {
        await startAs(page, { progress: { chapter: 3 } });
        const canvas = await canvasBox(page);

        await page.getByTestId('auto-click-button').tap();
        await expect(page.getByTestId('auto-click-popover')).toBeVisible();

        const button = await page.getByTestId('auto-click-button').boundingBox();
        const key = await page.getByTestId('auto-click-key').boundingBox();
        const rate = await page.getByTestId('auto-click-rate').boundingBox();
        const popover = await page.getByTestId('auto-click-popover').boundingBox();

        for (const box of [ button, key, rate, popover ]) { expect(inside(box, canvas)).toBe(true); }
        expect(Math.abs(button.width / canvas.width - 56 / 1024)).toBeLessThanOrEqual(0.002);
        expect((popover.x - canvas.x) * 1024 / canvas.width).toBeGreaterThanOrEqual(663);
        expect((popover.y - canvas.y) * 768 / canvas.height).toBeGreaterThanOrEqual(400);
    });
});
