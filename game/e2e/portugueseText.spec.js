import { expect, test } from './support/coverage';
import { mockBackend, serverDown } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu, SESSION_KEY } from './support/game';

//  Spec portuguese-text, § Player-Facing Texts: every text a player reads, exactly as the spec writes it (AD-007, L-010).
//  The default fake definition has 10 stages of 5 phases; stage n has the element of SEED_ELEMENTS[(n - 1) % 5] and a boss of 60 s.
const OFFLINE = 'Não foi possível falar com o servidor. Tente de novo mais tarde.';

const MINIBOSS = { stage: 3, encounter: 'MINIBOSS', phase: 1 };
const CHAPTER_BOSS = { stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 };

//  Signs in through the form with an existing account, then clicks the welcome screen into the fight
const startFight = async (page, progress = {}) => {
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, ...(Object.keys(progress).length > 0 && { progress: { yan: { chapter: 1, ...progress } } }) });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.welcomeTitle).toBeVisible();
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.locator('.stage-hud')).not.toHaveText('');
    await expect(page.getByTestId('monster-hp')).toBeVisible();

    return { backend, menu };
};

//  Every word the English game showed on the main screens (spec PT-06 AC 1), case-sensitive
const ENGLISH_WORDS = [
    'Username', 'Password', 'Login', 'Sign up', 'Logout', 'Click to Start', 'Welcome back', 'Hello,', 'Stage ', 'Phase ', 'Chapter Boss', 'Time:',
    'Gold', 'Silver', 'Copper', 'Fire', 'Water', 'Nature', 'Light', 'Darkness', 'Farm boss', 'Paused', 'Continue', 'Leave', 'Yes, leave', 'No, stay'
];
const pageText = (page) => page.evaluate(() => document.body.innerText);

//  "Nature" is an English word, but also the first letters of the Portuguese Natureza, so a word counts as shown only when no letter touches it
//  on a side where the word has a letter (a word ending in a space or a colon has no right edge to check)
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const standsAlone = (word) => new RegExp(`(?<!\\p{L})${escapeRegExp(word)}${/\p{L}$/u.test(word) ? '(?!\\p{L})' : ''}`, 'u');
const expectNoEnglish = async (page) => {
    const text = await pageText(page);

    for (const word of ENGLISH_WORDS)
    {
        expect(standsAlone(word).test(text), `"${word}" shows on the page: ${text}`).toBe(false);
    }
};

test.describe('The main menu in Portuguese', () => {
    test('the sign-in form reads Usuário, Senha, Entrar and Criar conta', async ({ page }) => {
        await mockBackend(page);
        const menu = await openMainMenu(page);

        await expect(menu.username).toHaveAttribute('placeholder', 'Usuário');
        await expect(menu.password).toHaveAttribute('placeholder', 'Senha');
        await expect(menu.loginButton).toHaveText('Entrar');
        await expect(menu.signupButton).toHaveText('Criar conta');
    });

    test('an empty field and a username of spaces read Informe usuário e senha and send no request', async ({ page }) => {
        const backend = await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Informe usuário e senha');

        await fillCredentials(menu, '', 'secret123');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Informe usuário e senha');

        await fillCredentials(menu, '   ', 'secret123');
        await menu.loginButton.click();
        await expect(menu.message).toHaveText('Informe usuário e senha');

        await fillCredentials(menu, 'yan', '');
        await menu.signupButton.click();
        await expect(menu.message).toHaveText('Informe usuário e senha');

        expect(backend.calls.filter((call) => call.path === '/users/login')).toEqual([]);
        expect(backend.calls).toEqual([]);
    });

    test('a sign-in reads Bem-vindo de volta, yan! and Olá, yan!, the prompt Clique para jogar! and the button Sair', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
        await expect(menu.welcomeTitle).toHaveText('Olá, yan!');
        await expect(page.locator('.welcome-start')).toHaveText('Clique para jogar!');
        await expect(menu.logoutButton).toHaveText('Sair');

        //  One line: the pill is not taller than a line plus its padding and border, and its text does not overflow
        const prompt = await page.locator('.welcome-start').evaluate((node) => {
            const style = getComputedStyle(node);
            const fontSize = parseFloat(style.fontSize);
            const lineHeight = Number.isNaN(parseFloat(style.lineHeight)) ? fontSize * 1.4 : parseFloat(style.lineHeight);
            const frame = [ 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth' ].reduce((sum, key) => sum + parseFloat(style[key]), 0);

            return { height: node.getBoundingClientRect().height, lineHeight, frame, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth };
        });

        expect(prompt.height).toBeLessThanOrEqual(prompt.lineHeight * 1.5 + prompt.frame);
        expect(prompt.scrollWidth).toBeLessThanOrEqual(prompt.clientWidth);
    });

    test('a sign-up reads Conta criada, newbie! and Olá, newbie!', async ({ page }) => {
        await mockBackend(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'newbie', 'secret123');
        await menu.signupButton.click();
        await menu.chooseHero('FIRE');

        await expect(menu.message).toHaveText('Conta criada, newbie!');
        await expect(menu.welcomeTitle).toHaveText('Olá, newbie!');
    });

    test('the page declares lang pt-BR', async ({ page }) => {
        await mockBackend(page);
        await openMainMenu(page);

        await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    });
});

test.describe('Error lines chosen by the backend code', () => {
    test('a taken username reads Esse nome de usuário já existe. and no English detail', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'another-pass');
        await menu.signupButton.click();
        await menu.chooseHero('FIRE');

        await expect(menu.message).toHaveText('Esse nome de usuário já existe.');
        expect(await pageText(page)).not.toContain('already exists');
    });

    test('an unknown user reads Usuário não encontrado.', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'ghost', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Usuário não encontrado.');
        expect(await pageText(page)).not.toContain('does not exist');
    });

    test('a wrong password reads Senha incorreta.', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'wrong-password');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Senha incorreta.');
        expect(await pageText(page)).not.toContain('is invalid');
    });

    test('a short password reads A senha precisa ter pelo menos 8 caracteres.', async ({ page }) => {
        await mockBackend(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'newbie', 'short');
        await menu.signupButton.click();
        await menu.chooseHero('NATURE');

        await expect(menu.message).toHaveText('A senha precisa ter pelo menos 8 caracteres.');
        expect(await pageText(page)).not.toContain('Password must have');
    });

    test('an AUTH_UNAUTHENTICATED answer reads Sua sessão expirou. Entre de novo.', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await page.route('**/api/users/login', (route) => route.fulfill({
            status: 401,
            contentType: 'application/problem+json',
            body: JSON.stringify({ status: 401, detail: 'Authentication is required', code: 'AUTH_UNAUTHENTICATED' })
        }));
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('Sua sessão expirou. Entre de novo.');
        expect(await pageText(page)).not.toContain('Authentication is required');
    });

    test('a 500 answer reads O pedido falhou (erro 500).', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        await page.route('**/api/users/login', (route) => route.fulfill({
            status: 500,
            contentType: 'application/problem+json',
            body: JSON.stringify({ status: 500, title: 'Internal Server Error', detail: 'Boom' })
        }));
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText('O pedido falhou (erro 500).');
        expect(await pageText(page)).not.toContain('Boom');
        expect(await pageText(page)).not.toContain('Internal Server Error');
    });

    test('an unreachable server at sign-in reads Não foi possível falar com o servidor. Tente de novo mais tarde.', async ({ page }) => {
        await serverDown(page);
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();

        await expect(menu.message).toHaveText(OFFLINE);
        await expect(menu.message).toHaveClass(/error/);
    });

    test('an unreachable server at the start reads Não foi possível falar com o servidor. Tente de novo mais tarde.', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' } });
        const menu = await openMainMenu(page);

        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();
        await expect(menu.welcomeTitle).toBeVisible();

        //  The stored access token is past its expiry, so the start must reach the server, which is down
        await page.evaluate((key) => {
            const session = JSON.parse(localStorage.getItem(key));
            session.accessTokenExpiresAt = Date.now() - 1000;
            localStorage.setItem(key, JSON.stringify(session));
        }, SESSION_KEY);
        await serverDown(page);
        await page.reload();
        const reloaded = await openMainMenu(page);

        await expect(reloaded.message).toHaveText(OFFLINE);
    });
});

test.describe('The combat HUD in Portuguese', () => {
    const PLATES = [
        { name: 'a phase', progress: {}, text: 'Estágio 1/10  Fase 1/5' },
        { name: 'a miniboss', progress: MINIBOSS, text: 'Estágio 3/10  Miniboss' },
        { name: 'the chapter boss', progress: CHAPTER_BOSS, text: 'Chefe do capítulo' }
    ];

    for (const { name, progress, text } of PLATES)
    {
        test(`the stage plate of ${name} reads ${text}`, async ({ page }) => {
            await startFight(page, progress);

            //  The two spaces before Fase are in the text itself, not only in the normalised match
            await expect.poll(() => page.locator('.stage-hud').evaluate((node) => node.textContent)).toBe(text);
        });
    }

    test('a boss fight reads Tempo: <n>s with the timer 12 px or more right of the plate', async ({ page }) => {
        await startFight(page, CHAPTER_BOSS);
        const timer = page.locator('.boss-timer');

        //  The chapter boss limit is 60 000 ms, so the text is 1 to 60 seconds
        await expect(timer).toHaveText(/^Tempo: ([1-5]?[0-9]|60)s$/);

        const plate = await page.locator('.stage-hud').boundingBox();
        const pill = await timer.boundingBox();

        expect(pill.x - (plate.x + plate.width)).toBeGreaterThanOrEqual(12);
    });

    test('the wallet reads Ouro: 0 Prata: 0 Cobre: 0', async ({ page }) => {
        await startFight(page);

        await expect(page.locator('.wallet')).toHaveText('Ouro: 0 Prata: 0 Cobre: 0');
        const names = await page.locator('.wallet .sr-only').evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()).filter(Boolean));

        expect(names).toEqual([ 'Ouro:', 'Prata:', 'Cobre:' ]);
    });

    //  Stage n of the default definition fields the monsters of one element: FIRE, WATER, NATURE, LIGHT, DARKNESS for stages 1 to 5
    const CHIPS = [
        { stage: 1, element: 'FIRE', name: 'Fogo' },
        { stage: 2, element: 'WATER', name: 'Água' },
        { stage: 3, element: 'NATURE', name: 'Natureza' },
        { stage: 4, element: 'LIGHT', name: 'Luz' },
        { stage: 5, element: 'DARKNESS', name: 'Escuridão' }
    ];

    for (const { stage, element, name } of CHIPS)
    {
        test(`the element chip reads ${name} with its data-element ${element}`, async ({ page }) => {
            await startFight(page, { stage, encounter: 'PHASE', phase: 1 });

            await expect(page.locator('.tag-element')).toHaveText(name);
            await expect(page.locator('.tag-element')).toHaveAttribute('data-element', element);
        });
    }

    test('the farm switch label reads Farmar chefe on one line', async ({ page }) => {
        await startFight(page);
        const label = page.locator('.farm-toggle');

        await expect(label).toBeVisible();
        expect(await label.evaluate((node) => node.textContent.trim())).toBe('Farmar chefe');

        //  The rectangles of the label's text sit on one line
        const lines = await label.evaluate((node) => {
            const range = document.createRange();

            range.selectNodeContents(node.lastChild);
            return new Set([ ...range.getClientRects() ].map((rect) => Math.round(rect.top))).size;
        });

        expect(lines).toBe(1);
    });
});

test.describe('The pause menu in Portuguese', () => {
    test('the pause menu and its confirmation read Pausado, 1. Continuar, 2. Sair da luta, Sair da luta? Isso conta como derrota., Sim, sair and Não, ficar, and Não, ficar returns to the menu', async ({ page }) => {
        //  Leave fight is offered only where a countdown runs: a miniboss or the chapter boss
        await startFight(page, MINIBOSS);

        await page.keyboard.press('Escape');
        await expect(page.locator('.pause-menu')).toBeVisible();
        await expect(page.locator('.pause-title')).toHaveText('Pausado');
        await expect(page.locator('.pause-continue')).toHaveText('1. Continuar');
        await expect(page.locator('.pause-leave')).toHaveText('2. Sair da luta');
        await expectNoEnglish(page);

        await page.locator('.pause-leave').click();
        await expect(page.locator('.pause-question')).toHaveText('Sair da luta? Isso conta como derrota.');
        await expect(page.locator('.pause-confirm-yes')).toHaveText('Sim, sair');
        await expect(page.locator('.pause-confirm-no')).toHaveText('Não, ficar');
        await expectNoEnglish(page);

        await page.locator('.pause-confirm-no').click();
        await expect(page.locator('.pause-confirm')).toBeHidden();
        await expect(page.locator('.pause-continue')).toBeVisible();
        await expect(page.locator('.pause-leave')).toBeVisible();
        await expect(page.locator('.pause-menu')).toBeVisible();
    });
});

test.describe('No English left', () => {
    test('no inventoried English word shows on the main screens', async ({ page }) => {
        await mockBackend(page, { users: { yan: 'secret123' }, progress: { yan: { chapter: 1, ...CHAPTER_BOSS } } });
        await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));
        const menu = await openMainMenu(page);

        //  The sign-in form
        await expect(menu.loginButton).toBeVisible();
        await expectNoEnglish(page);

        //  The welcome screen
        await fillCredentials(menu, 'yan', 'secret123');
        await menu.loginButton.click();
        await expect(menu.welcomeTitle).toHaveText('Olá, yan!');
        await expectNoEnglish(page);

        //  A boss fight: plate, timer, wallet and enemy chips
        await menu.canvas.click();
        await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
        await expect(page.locator('.boss-timer')).toHaveText(/^Tempo: \d+s$/);
        await expect(page.locator('.tag-element')).toHaveText('Escuridão');
        await expectNoEnglish(page);

        //  The pause menu and its confirmation
        await page.keyboard.press('Escape');
        await expect(page.locator('.pause-menu')).toBeVisible();
        await expectNoEnglish(page);
        await page.locator('.pause-leave').click();
        await expect(page.locator('.pause-question')).toBeVisible();
        await expectNoEnglish(page);
    });

    test('no inventoried English word shows in a phase fight', async ({ page }) => {
        await startFight(page);

        await expect(page.locator('.stage-hud')).toHaveText('Estágio 1/10 Fase 1/5');
        await expect(page.locator('.tag-element')).toHaveText('Fogo');
        await expectNoEnglish(page);
    });
});
