import { expect, test } from './support/coverage';
import { held, hitButton, seenKey, startBattle, watchLine } from './support/story';

//  The default fixture seeds every catalog scene as seen: the Mapa lists them all
const COMPLETED = { stage: 1, encounter: 'CHAPTER_BOSS', phase: 1, completed: true };

const overlay = (page) => page.getByTestId('story-overlay');
const chip = (page) => page.getByTestId('story-replay-prologue');
const openMapa = (page) => page.getByTestId('hud-farm').click();

//  Starts the battle with the auto click off (a completed campaign unlocks it) and waits for the skill bar
const startGame = async (page, backend = {}) => {
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));

    const started = await startBattle(page, backend);

    await expect(page.getByTestId('skill-slot-1')).toBeVisible();

    return started;
};

const centreY = async (locator) => {
    const box = await locator.boundingBox();

    return box.y + box.height / 2;
};

test.describe('The Mapa tab and the story replay', () => {
    test('the tab and its panel title read Mapa', async ({ page }) => {
        await startGame(page);

        await expect(page.getByTestId('hud-farm')).toHaveText('Mapa');

        await openMapa(page);

        await expect(page.locator('.hero-title')).toHaveText('Mapa');
    });

    test('the farm fight label still reads Rever chefe', async ({ page }) => {
        await startGame(page, { progress: { yan: COMPLETED } });

        await openMapa(page);
        await page.getByTestId('farm-entry-miniboss-1').click();

        await expect(page.locator('.stage-hud')).toHaveText('Rever chefe: Miniboss 1');
    });

    test('the Mapa shows the História group beside the map title', async ({ page }) => {
        await startGame(page);

        await openMapa(page);

        const group = page.getByTestId('farm-story');

        await expect(group).toBeVisible();
        await expect(page.locator('.farm-story-label')).toHaveText('História');
        await expect(chip(page)).toHaveText('Prólogo');
        await expect(chip(page)).toHaveAttribute('aria-label', 'Assistir Prólogo');

        const storyBox = await group.boundingBox();
        const screenBox = await page.getByTestId('farm-screen').boundingBox();

        expect(Math.abs(await centreY(group) - await centreY(page.getByTestId('farm-map-title')))).toBeLessThanOrEqual(4);
        expect(storyBox.x + storyBox.width).toBeLessThanOrEqual(screenBox.x + screenBox.width);
        //  The title element spans the screen, so the overlap is measured on its text: the group starts to the right of it
        const titleTextRight = await page.getByTestId('farm-map-title').evaluate((node) => {
            const range = document.createRange();

            range.selectNodeContents(node);

            return range.getBoundingClientRect().right;
        });

        expect(storyBox.x).toBeGreaterThanOrEqual(titleTextRight);

        await expect(chip(page)).toHaveCSS('font-family', /^Cinzel/);
        await expect(chip(page)).toHaveCSS('font-size', '15px');
        await expect(chip(page)).toHaveCSS('height', '32px');
        await expect(chip(page)).toHaveCSS('color', 'rgb(244, 230, 200)');
        await expect(chip(page)).toHaveCSS('border-top-color', 'rgb(176, 122, 58)');
    });

    test('the Prólogo chip shows before any boss is beaten', async ({ page }) => {
        await startGame(page);

        await openMapa(page);

        await expect(page.getByTestId('farm-empty')).toBeVisible();
        await expect(chip(page)).toBeVisible();
    });

    test('the Mapa lists Capítulo 1 after Prólogo once it was seen', async ({ page }) => {
        await startGame(page);

        await openMapa(page);

        await expect(page.locator('.farm-story-chip')).toHaveText([ 'Prólogo', 'Capítulo 1' ]);
        await expect(page.getByTestId('story-replay-chapter-1')).toHaveAttribute('aria-label', 'Assistir Capítulo 1');
    });

    test('the Capítulo 1 chip replays the chapter 1 scene', async ({ page }) => {
        await startGame(page);

        await openMapa(page);
        await page.getByTestId('story-replay-chapter-1').click();

        await expect(page.locator('.story-kicker')).toHaveText('Capítulo 1 — Final');
        await expect(page.locator('.story-cardtitle')).toHaveText('A Devoradora da Clareira');

        await page.getByTestId('story-skip').click();

        await expect(overlay(page)).toHaveCount(0);
        await expect(page.locator('.hero-panel')).toBeVisible();
    });

    test('the Prólogo chip replays the prologue with the fight held and the seen list unchanged', async ({ page }) => {
        await startGame(page);

        const before = await seenKey(page);

        await openMapa(page);
        await chip(page).click();

        await expect(overlay(page)).toBeVisible();
        await expect(page.locator('.story-kicker')).toHaveText('Ato 1 — Bosque Desperto · Prólogo');
        expect((await held(page))[0]).toBe(true);
        expect(await seenKey(page)).toBe(before);
        expect(before).toBe('["prologue","chapter-1"]');
    });

    test('Pular on a replay shows the Mapa again on the same chapter', async ({ page }) => {
        await startGame(page);

        await openMapa(page);
        await chip(page).click();
        await page.getByTestId('story-skip').click();

        await expect(overlay(page)).toHaveCount(0);
        await expect(page.locator('.hero-panel')).toBeVisible();
        await expect(page.getByTestId('farm-map-title')).toHaveText('Caminho do Capítulo 1');
    });

    test('Escape on a replay closes only the story', async ({ page }) => {
        await startGame(page);

        await openMapa(page);
        await chip(page).click();
        await expect(overlay(page)).toBeVisible();
        await page.keyboard.press('Escape');

        await expect(overlay(page)).toHaveCount(0);
        await expect(page.locator('.hero-panel')).toBeVisible();
        await page.waitForTimeout(500);
        await expect(page.locator('.hero-panel')).toBeVisible();
    });

    test('the end card of a replay returns to the Mapa', async ({ page }) => {
        await startGame(page);

        await openMapa(page);
        await chip(page).click();
        await watchLine(page, 6);
        await hitButton(page).click();
        await expect(page.locator('.story-endtitle')).toBeVisible();
        await hitButton(page).click();

        await expect(overlay(page)).toHaveCount(0);
        await expect(page.locator('.hero-panel')).toBeVisible();
    });

    test('the mute choice holds for the next replay', async ({ page }) => {
        await startGame(page);

        await openMapa(page);
        await chip(page).click();

        await expect(page.getByTestId('story-mute')).toHaveAttribute('aria-label', 'Silenciar');
        await page.getByTestId('story-mute').click();
        await expect(page.getByTestId('story-mute')).toHaveAttribute('aria-label', 'Ativar som');
        await expect(page.getByTestId('story-mute')).toHaveAttribute('aria-pressed', 'true');

        await page.getByTestId('story-skip').click();
        await expect(overlay(page)).toHaveCount(0);
        await chip(page).click();

        await expect(page.getByTestId('story-mute')).toHaveAttribute('aria-label', 'Ativar som');
    });

    //  Only the prologue seen: the chapter 1 scene is listed by the campaign position alone
    test.describe('with only the prologue seen', () => {
        test.use({ storySeen: false });

        test.beforeEach(async ({ page }) => {
            await page.addInitScript(() => localStorage.setItem('infinity-grove.story-seen', '["prologue"]'));
        });

        test('a player past chapter 1 who never saw the chapter 1 scene finds it on the Mapa', async ({ page }) => {
            await startGame(page, { progress: { yan: { chapter: 3 } } });

            await openMapa(page);

            await expect(page.getByTestId('story-replay-chapter-1')).toBeVisible();
            await expect(overlay(page)).toHaveCount(0);
            expect(await seenKey(page)).toBe('["prologue"]');
        });

        test('at chapter 1 an unseen chapter 1 scene is not listed', async ({ page }) => {
            await startGame(page);

            await openMapa(page);

            await expect(chip(page)).toBeVisible();
            await expect(page.getByTestId('story-replay-chapter-1')).toHaveCount(0);
        });
    });
});
