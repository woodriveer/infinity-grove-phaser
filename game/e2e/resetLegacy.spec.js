import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The legacy of the account resets in the browser (spec reset-legacy-drops, Display AC 1 to 7). The fake backend answers
//  GET /account/legacy and the reset answer like the real one.

//  Monsters of 1000 health so the auto click never kills one while a test watches it
const CHAPTER = {
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 30_000 } ]
};

const startGame = async (page, chapter, options = {}) => {
    const backend = await mockBackend(page, {
        users: { yan: 'secret123' }, definition: CHAPTER, progress: { yan: { chapter } }, ...options
    });
    const legacyRequests = [];

    page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/api/account/legacy') { legacyRequests.push(request.method()); }
    });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('chapter-hud')).toHaveText(`Capítulo ${chapter}`);

    return { backend, legacyRequests };
};

const openAutoClick = async (page) => {
    await page.getByTestId('auto-click-button').click();
    await expect(page.getByTestId('auto-click-popover')).toBeVisible();
};

const openDialog = async (page) => {
    await openAutoClick(page);
    await page.getByTestId('reset-account').click();
    await expect(page.getByTestId('reset-dialog')).toBeVisible();
};

//  The colour of a custom property of the stylesheet as the browser computes it (rgb(...))
const tokenColor = (page, token) => page.evaluate((name) => {
    const probe = document.createElement('div');

    probe.style.color = `var(${name})`;
    document.body.appendChild(probe);

    const color = getComputedStyle(probe).color;

    probe.remove();

    return color;
}, token);

test.describe('Reset legacy', () => {
    test('the window reads Legado: nenhum and the reset hint with no legacy', async ({ page }) => {
        await startGame(page, 3);
        await openAutoClick(page);

        await expect(page.getByTestId('legacy-line')).toHaveText('Legado: nenhum');
        await expect(page.getByTestId('legacy-line')).toHaveAttribute('title', 'Resete a conta para ganhar moedas e peças melhores nas próximas jornadas.');
        //  Owner decision 2026-11-26: the detail is the tooltip of the line, there is no detail row
        await expect(page.getByTestId('legacy-detail')).toHaveCount(0);

        //  The line sits above Resetar conta, inside the window
        const line = await page.getByTestId('legacy-line').boundingBox();
        const button = await page.getByTestId('reset-account').boundingBox();
        const popover = await page.getByTestId('auto-click-popover').boundingBox();

        expect(line.y + line.height).toBeLessThanOrEqual(button.y);
        expect(line.x).toBeGreaterThanOrEqual(popover.x);
        expect(line.x + line.width).toBeLessThanOrEqual(popover.x + popover.width);
    });

    test('the open window leaves the centre of the monster, (670, 440), to the canvas', async ({ page }) => {
        await startGame(page, 3, { legacy: { yan: { 5: 100 } } });
        await openAutoClick(page);

        //  Owner decision 2026-11-26: the legacy detail row made the window cover the monster, so the detail is a tooltip
        const hit = await page.locator('#game-container canvas').evaluate((canvas) => {
            const box = canvas.getBoundingClientRect();
            const node = document.elementFromPoint(box.x + (box.width * 670) / 1024, box.y + (box.height * 440) / 768);

            return node === canvas;
        });

        expect(hit).toBe(true);
    });

    test('the window reads Legado: 100% do capítulo 5 and its detail as tooltip with {5: 100}', async ({ page }) => {
        await startGame(page, 3, { legacy: { yan: { 5: 100 } } });
        await openAutoClick(page);

        await expect(page.getByTestId('legacy-line')).toHaveText('Legado: 100% do capítulo 5');
        await expect(page.getByTestId('legacy-line')).toHaveAttribute(
            'title',
            'Cada abate rende mais 100% das moedas do capítulo 5, e cada peça tem 100% de chance de vir com a raridade do capítulo 5.'
        );
    });

    test('the window shows the best legacy of {5: 100, 10: 50}, the one of the largest percent times coin factor', async ({ page }) => {
        await startGame(page, 3, { legacy: { yan: { 5: 100, 10: 50 } } });
        await openAutoClick(page);

        await expect(page.getByTestId('legacy-line')).toHaveText('Legado: 50% do capítulo 10');
    });

    test('the dialog in chapter 3 with no legacy reads Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).', async ({ page }) => {
        await startGame(page, 3);
        await openDialog(page);

        await expect(page.getByTestId('reset-legacy')).toHaveText('Legado depois do reset: 50% do capítulo 3 (hoje: nenhum).');

        //  The line sits between the question and the buttons, inside the card
        const question = await page.getByTestId('reset-question').boundingBox();
        const legacy = await page.getByTestId('reset-legacy').boundingBox();
        const confirm = await page.getByTestId('reset-confirm').boundingBox();

        expect(legacy.y).toBeGreaterThanOrEqual(question.y + question.height);
        expect(legacy.y + legacy.height).toBeLessThanOrEqual(confirm.y);
        await expect(page.getByTestId('reset-confirm')).toBeInViewport({ ratio: 1 });
        await expect(page.getByTestId('reset-cancel')).toBeInViewport({ ratio: 1 });
    });

    test('the dialog in chapter 10 with {5: 50} reads case A with the best of today', async ({ page }) => {
        await startGame(page, 10, { legacy: { yan: { 5: 50 } } });
        await openDialog(page);

        await expect(page.getByTestId('reset-legacy')).toHaveText('Legado depois do reset: 50% do capítulo 10 (hoje: 50% do capítulo 5).');
    });

    test('the dialog in chapter 5 with {10: 50} reads case B', async ({ page }) => {
        await startGame(page, 5, { legacy: { yan: { 10: 50 } } });
        await openDialog(page);

        await expect(page.getByTestId('reset-legacy')).toHaveText(
            'Este reset sobe o legado do capítulo 5 para 50%. O melhor legado continua 50% do capítulo 10.'
        );
    });

    test('the dialog in chapter 5 with {5: 100} reads case C', async ({ page }) => {
        await startGame(page, 5, { legacy: { yan: { 5: 100 } } });
        await openDialog(page);

        await expect(page.getByTestId('reset-legacy')).toHaveText('O legado do capítulo 5 já está em 100%: este reset não muda o seu legado.');
    });

    test('after a reset from chapter 5 the window reads Legado: 50% do capítulo 5 at once', async ({ page }) => {
        const { legacyRequests } = await startGame(page, 5);

        await openAutoClick(page);
        await expect(page.getByTestId('legacy-line')).toHaveText('Legado: nenhum');
        await page.getByTestId('reset-account').click();
        await expect(page.getByTestId('reset-legacy')).toHaveText('Legado depois do reset: 50% do capítulo 5 (hoje: nenhum).');

        const requestsBefore = legacyRequests.length;

        await page.getByTestId('reset-confirm').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await expect(page.getByTestId('reset-dialog')).toBeHidden();
        await openAutoClick(page);

        await expect(page.getByTestId('legacy-line')).toHaveText('Legado: 50% do capítulo 5');
        await expect(page.getByTestId('legacy-line')).toHaveAttribute(
            'title',
            'Cada abate rende mais 50% das moedas do capítulo 5, e cada peça tem 50% de chance de vir com a raridade do capítulo 5.'
        );
        //  The window took the legacy of the reset answer: no GET /account/legacy in between
        expect(legacyRequests.length).toBe(requestsBefore);
        //  Chapter 1 after the reset: the reset is closed again, only the legacy lines stay
        await expect(page.getByTestId('reset-account')).toHaveCount(0);
    });

    test('a second reset from chapter 5 raises the window to 100%', async ({ page }) => {
        await startGame(page, 5, { legacy: { yan: { 5: 50 } } });
        await openDialog(page);
        await page.getByTestId('reset-confirm').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await openAutoClick(page);

        await expect(page.getByTestId('legacy-line')).toHaveText('Legado: 100% do capítulo 5');
    });

    test('with the endpoint missing the window and the dialog show no legacy line and the reset works', async ({ page }) => {
        await startGame(page, 3, { legacyEndpoint: false });
        await openAutoClick(page);

        await expect(page.getByTestId('reset-account')).toHaveText('Resetar conta (+3 cristais)');
        await expect(page.getByTestId('legacy-line')).toHaveCount(0);
        await expect(page.getByTestId('legacy-detail')).toHaveCount(0);

        await page.getByTestId('reset-account').click();
        await expect(page.getByTestId('reset-question')).toContainText('Você ganha 3 cristais.');
        await expect(page.getByTestId('reset-legacy')).toHaveCount(0);

        await page.getByTestId('reset-confirm').click();
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await expect(page.getByTestId('card-notice')).toHaveText('+3 cristais');
        await openAutoClick(page);
        await expect(page.getByTestId('legacy-line')).toHaveCount(0);
    });

    test('the legacy lines use their fonts and colours', async ({ page }) => {
        await startGame(page, 5, { legacy: { yan: { 10: 50 } } });
        await openAutoClick(page);

        const line = page.getByTestId('legacy-line');

        await expect(line).toHaveCSS('font-size', '13px');
        await expect(line).toHaveCSS('font-weight', '700');
        await expect(line).toHaveCSS('font-family', /Figtree/);
        await expect(line).toHaveCSS('color', await tokenColor(page, '--ink-900'));
        await expect(line).toHaveCSS('color', 'rgb(42, 26, 16)');

        await page.getByTestId('reset-account').click();

        const dialogLine = page.getByTestId('reset-legacy');

        await expect(dialogLine).toBeVisible();
        await expect(dialogLine).toHaveCSS('font-size', '15px');
        await expect(dialogLine).toHaveCSS('font-weight', '700');
        await expect(dialogLine).toHaveCSS('line-height', '21px');
        await expect(dialogLine).toHaveCSS('font-family', /Figtree/);
        await expect(dialogLine).toHaveCSS('color', await tokenColor(page, '--ember-800'));
        await expect(dialogLine).toHaveCSS('color', 'rgb(138, 53, 16)');
    });
});
