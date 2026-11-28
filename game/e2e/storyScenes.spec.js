import { expect, test } from './support/coverage';
import { openMainMenu } from './support/game';
import { held, hitButton, lineText, seenKey, startBattle, watchLine } from './support/story';

//  The story specs need every scene unseen (the shared fixture seeds them all otherwise)
test.use({ storySeen: false });

//  The six lines of the prologue (spec story-scenes, P1 The prologue content AC 1)
const LINES = [
    'Eldora sempre respirou pela Grande Árvore. Suas raízes bebem do fundo do mundo, e sua seiva corre por cada folha, cada rio, cada criatura.',
    'Até a noite em que as raízes tremeram.',
    'Do fundo da terra subiu um rumor. E os animais do bosque abriram os olhos... Vermelhos.',
    'A Árvore despertou. E, entre milhares, escolheu cinco guardiões.',
    'Criança... venha. Eu preciso de você.',
    'Vocês também ouviram? Ela está nos chamando. A Árvore... está com medo.'
];

const overlay = (page) => page.getByTestId('story-overlay');
const pauseMenu = (page) => page.locator('.pause-menu');
const monsterHealth = (page) => page.evaluate(() => window.__PHASER_GAME__.scene.getScene('ClickerGame').monster?.health);
const ALL_FALSE = [ false, false, false ];
const ALL_TRUE = [ true, true, true ];

//  Counts the Escape keydowns that reach the window, where the battle listens (spec story-scenes STORY-42)
const countEscapes = (page) => page.evaluate(() => {
    window.__escapes = 0;
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { window.__escapes += 1; } });
});
const escapes = (page) => page.evaluate(() => window.__escapes);

const openPrologue = async (page, backend) => {
    const started = await startBattle(page, backend);

    await expect(overlay(page)).toBeVisible();

    return started;
};

//  A battle that opens no overlay: waits for the skill bar (a completed campaign shows no stage label), then half a second, so a late overlay would show
const startQuiet = async (page, backend) => {
    const started = await startBattle(page, backend);

    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.waitForTimeout(500);

    return started;
};

//  Reloads, restores the session on the welcome screen and enters the battle again
const reenterBattle = async (page) => {
    await page.reload();

    const menu = await openMainMenu(page, { state: 'welcome' });

    await menu.canvas.click();

    return menu;
};

test.describe('The prologue', () => {
    test('the first chapter 1 battle opens the prologue on its title card', async ({ page }) => {
        await openPrologue(page);

        await expect(page.locator('.story-kicker')).toHaveText('Ato 1 — Bosque Desperto · Prólogo');
        await expect(page.locator('.story-cta')).toHaveText('Clique para começar');
        await expect(page.locator('.story-logo')).toHaveAttribute('alt', 'Infinity Grove');
        await expect(page.locator('.story-logo')).toHaveAttribute('src', 'assets/story/logo.png');
        await expect(hitButton(page)).toHaveAttribute('aria-label', 'Começar a história');
        await expect(hitButton(page)).toBeFocused();
        expect(await seenKey(page)).toBe('["prologue"]');
    });

    test('the fight is held while the prologue plays', async ({ page }) => {
        await openPrologue(page);

        expect(await held(page)).toEqual(ALL_TRUE);
    });

    test('clicking through shows each line, its speaker and the end card', async ({ page }) => {
        await openPrologue(page);

        for (let n = 1; n <= 6; n++) {
            await watchLine(page);

            await expect(lineText(page)).toHaveText(LINES[n - 1]);
            await expect(hitButton(page)).toHaveAttribute('aria-label', 'Próxima fala');

            if (n === 3) {
                await expect(page.locator('.story-dot.is-on')).toHaveCount(3);
            }

            if (n <= 4) {
                await expect(page.getByTestId('story-speaker')).toHaveCount(0);
            }

            if (n === 5) {
                await expect(page.getByTestId('story-speaker')).toHaveText('A Voz');
                await expect(page.getByTestId('story-orb')).toBeVisible();
            }

            if (n === 6) {
                await expect(page.getByTestId('story-speaker')).toHaveText('Seraphine');
                await expect(page.getByTestId('story-portrait')).toHaveAttribute('alt', 'Seraphine');
                await expect(page.getByTestId('story-portrait')).toHaveAttribute('src', 'assets/story/portrait-seraphine.png');
            }
        }

        await hitButton(page).click();

        await expect(page.locator('.story-kicker')).toHaveText('Fim do Prólogo');
        await expect(page.locator('.story-endtitle')).toHaveText('Ato 1 — Bosque Desperto');
        await expect(page.locator('.story-endsub')).toHaveText('Capítulo 1');
        await expect(page.locator('.story-cta')).toHaveText('Clique para continuar');
        await expect(hitButton(page)).toHaveAttribute('aria-label', 'Continuar');
    });

    test('a typing line clicked shows the whole line and waits', async ({ page }) => {
        await openPrologue(page);

        await hitButton(page).click();
        await hitButton(page).click();

        await expect(lineText(page)).toHaveText(LINES[0]);
        await expect(page.locator('.story-next')).toBeVisible();
        await page.waitForTimeout(2500);
        await expect(page.locator('.story-dot.is-on')).toHaveCount(1);
    });

    test('the red tint is on once Vermelhos shows', async ({ page }) => {
        await openPrologue(page);

        await watchLine(page);
        await watchLine(page);
        await expect(page.locator('.story-tint.is-red')).not.toHaveClass(/is-on/);

        await watchLine(page);
        await expect(page.locator('.story-tint.is-red')).toHaveClass(/is-on/);
    });

    test('line 4 shows the map backdrop and the gold tint', async ({ page }) => {
        await openPrologue(page);

        await watchLine(page, 4);

        await expect(page.locator('[data-backdrop="map"]')).toHaveClass(/is-on/);
        await expect(page.locator('.story-tint.is-gold')).toHaveClass(/is-on/);
        await expect(page.locator('[data-backdrop="forest"]')).not.toHaveClass(/is-on/);
    });

    test('the end card click closes the prologue and chapter 1 goes on', async ({ page }) => {
        await openPrologue(page);

        await watchLine(page, 6);
        await hitButton(page).click();
        await hitButton(page).click();

        await expect(overlay(page)).toHaveCount(0);
        expect(await held(page)).toEqual(ALL_FALSE);
        await expect(page.locator('.stage-hud')).toHaveText('Estágio 1/10  Fase 1/5');

        const before = await monsterHealth(page);

        await page.locator('#game-container canvas').click();
        await expect.poll(() => monsterHealth(page)).toBeLessThan(before);
    });

    test('Pular on the title card closes the prologue', async ({ page }) => {
        await openPrologue(page);

        await page.getByTestId('story-skip').click();

        await expect(overlay(page)).toHaveCount(0);
        expect(await held(page)).toEqual(ALL_FALSE);
        await expect(pauseMenu(page)).toBeHidden();
    });

    test('Pular during a line closes the prologue', async ({ page }) => {
        await openPrologue(page);

        await hitButton(page).click();
        await page.getByTestId('story-skip').click();

        await expect(overlay(page)).toHaveCount(0);
        expect(await held(page)).toEqual(ALL_FALSE);
        await expect(pauseMenu(page)).toBeHidden();
    });

    test('Escape closes the prologue and opens no pause menu', async ({ page }) => {
        await openPrologue(page);
        await countEscapes(page);

        await page.keyboard.press('Escape');

        await expect(overlay(page)).toHaveCount(0);
        await expect(pauseMenu(page)).toBeHidden();
        expect(await held(page)).toEqual(ALL_FALSE);
        await page.waitForTimeout(500);
        await expect(pauseMenu(page)).toBeHidden();
        expect(await held(page)).toEqual(ALL_FALSE);
        //  The key never reached the window, where the battle listens
        expect(await escapes(page)).toBe(0);
    });

    test('Shift+Escape keeps the prologue open and opens no pause menu', async ({ page }) => {
        await openPrologue(page);
        await countEscapes(page);

        await page.keyboard.press('Shift+Escape');

        await expect(overlay(page)).toBeVisible();
        await expect(pauseMenu(page)).toBeHidden();
        expect(await held(page)).toEqual(ALL_TRUE);
        expect(await escapes(page)).toBe(0);
    });

    test('T and B open nothing while a replay plays', async ({ page }) => {
        await startQuiet(page, { progress: { yan: { chapter: 2 } } });

        await page.getByTestId('hud-farm').click();
        await page.getByTestId('story-replay-prologue').click();
        await expect(overlay(page)).toBeVisible();

        await page.keyboard.press('t');
        await page.keyboard.press('b');

        await expect(page.locator('.hero-title')).toHaveText('Mapa');
        await expect(page.locator('.hero-panel')).toBeVisible();

        await page.getByTestId('story-skip').click();
        await expect(overlay(page)).toHaveCount(0);
        await page.keyboard.press('t');

        await expect(page.locator('.hero-title')).toHaveText('Talentos');
    });

    test('the prologue does not open again after a reload', async ({ page }) => {
        await openPrologue(page);

        await page.getByTestId('story-skip').click();
        await expect(overlay(page)).toHaveCount(0);
        await reenterBattle(page);

        await expect(page.locator('.stage-hud')).toBeVisible();
        await expect(overlay(page)).toHaveCount(0);
        await page.waitForTimeout(1000);
        await expect(overlay(page)).toHaveCount(0);
    });

    test('a battle that loads at chapter 2 opens no prologue and writes nothing', async ({ page }) => {
        await startQuiet(page, { progress: { yan: { chapter: 2 } } });

        await expect(overlay(page)).toHaveCount(0);
        expect(await seenKey(page)).toBeNull();
    });

    test('a completed campaign opens no prologue', async ({ page }) => {
        await startQuiet(page, { progress: { yan: { stage: 1, encounter: 'CHAPTER_BOSS', phase: 1, completed: true } } });

        await expect(overlay(page)).toHaveCount(0);
    });

    test('a stored value that is not a list opens the prologue and is rewritten', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('infinity-grove.story-seen', '{"x":1}'));

        await openPrologue(page);

        expect(await seenKey(page)).toBe('["prologue"]');
    });

    test('storage that refuses the seen list still opens the prologue and the fight goes on', async ({ page }) => {
        await page.addInitScript(() => {
            const setItem = Storage.prototype.setItem;

            Storage.prototype.setItem = function (key, value) {
                if (key === 'infinity-grove.story-seen') { throw new DOMException('refused', 'QuotaExceededError'); }

                return setItem.call(this, key, value);
            };
        });

        await openPrologue(page);

        await page.getByTestId('story-skip').click();

        await expect(overlay(page)).toHaveCount(0);
        expect(await held(page)).toEqual(ALL_FALSE);
        expect(await seenKey(page)).toBeNull();
    });

    test('an account reset back to chapter 1 does not open the prologue', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('infinity-grove.story-seen', '["prologue"]'));
        await startQuiet(page, { progress: { yan: { chapter: 2 } } });

        await page.getByTestId('auto-click-button').click();
        await page.getByTestId('reset-account').click();
        await page.getByTestId('reset-confirm').click();

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
        await expect(page.locator('.stage-hud')).toHaveText('Estágio 1/10  Fase 1/5');
        await page.waitForTimeout(500);
        await expect(overlay(page)).toHaveCount(0);
        expect(await seenKey(page)).toBe('["prologue"]');
    });

    test('a logout keeps the seen list', async ({ page }) => {
        await openPrologue(page);

        await page.getByTestId('story-skip').click();
        await expect(overlay(page)).toHaveCount(0);
        await page.reload();

        const menu = await openMainMenu(page, { state: 'welcome' });

        await menu.logoutButton.click();

        await expect(menu.loginButton).toBeVisible();
        expect(await seenKey(page)).toBe('["prologue"]');
    });
});
