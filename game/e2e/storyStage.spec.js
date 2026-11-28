import { expect, test } from './support/coverage';
import { hitButton, lineText, noPlay, startBattle, watchLine } from './support/story';

//  The story specs need every scene unseen (the shared fixture seeds them all otherwise)
test.use({ storySeen: false });

const overlay = (page) => page.getByTestId('story-overlay');
const box = (page) => page.getByTestId('story-stage').boundingBox();
const mute = (page) => page.getByTestId('story-mute');

//  The battle with the prologue open on its title card
const openPrologue = async (page) => {
    await startBattle(page);

    await expect(overlay(page)).toBeVisible();
};

//  The stage box within 1 px of the spec values (spec P2 Fits every screen AC 1)
const expectBox = async (page, expected) => {
    await expect.poll(async () => {
        const actual = await box(page);

        return [ actual.x, actual.y, actual.width, actual.height ].map((value) => Math.round(value));
    }).toEqual([ expected.x, expected.y, expected.width, expected.height ]);
};

test.describe('The story stage', () => {
    test('the stage fills a 1280x720 window', async ({ page }) => {
        await openPrologue(page);

        await expectBox(page, { x: 0, y: 0, width: 1280, height: 720 });
        await expect(overlay(page)).toHaveCSS('background-color', 'rgb(5, 9, 10)');
        await expect(overlay(page)).toHaveCSS('position', 'fixed');
        await expect(overlay(page)).toHaveCSS('z-index', '9');
    });

    test('the stage fits a 1024x768 window with bands above and below', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await openPrologue(page);

        await expectBox(page, { x: 0, y: 96, width: 1024, height: 576 });
    });

    test('a resize takes the new scale', async ({ page }) => {
        await openPrologue(page);
        await expectBox(page, { x: 0, y: 0, width: 1280, height: 720 });

        await page.setViewportSize({ width: 1920, height: 1080 });

        await expectBox(page, { x: 0, y: 0, width: 1920, height: 1080 });
    });

    test('a click on the band above the stage starts the scene', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await openPrologue(page);

        await page.mouse.click(512, 40);

        await expect(page.locator('.story-narr')).toBeVisible();
    });

    test('the version label stays visible above the overlay', async ({ page }) => {
        await openPrologue(page);

        await expect(page.getByTestId('game-version')).toBeVisible();
        await expect(page.getByTestId('game-version')).toHaveCSS('z-index', '10');
    });

    test('with reduced motion no animation runs and the motes are hidden', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openPrologue(page);

        await expect(page.locator('[data-backdrop="forest"]')).toHaveCSS('animation-name', 'none');
        await expect(page.locator('.story-cta')).toHaveCSS('animation-name', 'none');
        await expect(page.locator('.story-tint.is-dark')).toHaveCSS('transition-duration', '0s');
        await expect(page.locator('.story-mote').first()).toHaveCSS('display', 'none');
    });

    test('without reduced motion the forest drifts and the call blinks', async ({ page }) => {
        await openPrologue(page);

        await expect(page.locator('[data-backdrop="forest"]')).toHaveCSS('animation-name', 'storyDrift');
        await expect(page.locator('.story-cta')).toHaveCSS('animation-name', 'storyBlink');
        await expect(page.locator('.story-mote').first()).toHaveCSS('display', 'block');
    });

    test('the scene uses Cinzel for names and buttons and Cormorant Garamond for the text', async ({ page }) => {
        await openPrologue(page);

        await expect(page.locator('.story-kicker')).toHaveCSS('font-family', /^Cinzel/);
        await expect(page.locator('.story-cta')).toHaveCSS('font-family', /^Cinzel/);
        await expect(page.getByTestId('story-skip')).toHaveCSS('font-family', /^Cinzel/);

        await watchLine(page);
        await expect(page.locator('.story-narr')).toHaveCSS('font-family', /^"Cormorant Garamond"/);

        await watchLine(page, 4);

        const text = page.locator('[data-testid="story-text"]');

        await expect(page.getByTestId('story-speaker')).toHaveCSS('font-family', /^Cinzel/);
        await expect(text).toHaveCSS('font-family', /^"Cormorant Garamond"/);
        await expect(text).toHaveCSS('font-style', 'italic');

        await watchLine(page);

        await expect(page.getByTestId('story-speaker')).toHaveText('Seraphine');
        await expect(text).toHaveCSS('font-style', 'normal');
    });

    test('the narrator line is centred italic text over a scrim with no name plate', async ({ page }) => {
        await openPrologue(page);

        await watchLine(page);

        await expect(page.locator('.story-narr')).toHaveCSS('text-align', 'center');
        await expect(page.locator('.story-narr')).toHaveCSS('font-style', 'italic');
        await expect(page.locator('.story-narr-scrim')).toBeVisible();
        await expect(page.getByTestId('story-speaker')).toHaveCount(0);
    });

    test('the prologue cards use the sizes of a chapter-start scene', async ({ page }) => {
        await openPrologue(page);

        await expect(page.locator('.story-logo')).toHaveCSS('width', '620px');

        await watchLine(page, 6);
        await hitButton(page).click();

        await expect(page.locator('.story-endtitle')).toHaveCSS('font-size', '56px');
        await expect(page.locator('.story-endsub')).toHaveCSS('font-size', '30px');
    });

    test('a line whose audio cannot play types by the clock and moves on by itself', async ({ page }) => {
        await noPlay(page);
        await openPrologue(page);

        await watchLine(page);
        await hitButton(page).click();

        await expect(lineText(page)).toHaveText('Até a noite em que as raízes tremeram.', { timeout: 6000 });
        await expect(page.locator('.story-next')).toBeVisible();
        await expect(page.locator('.story-dot.is-on')).toHaveCount(3, { timeout: 3000 });
    });

    test('the dots are hidden on the title and end cards and count the lines', async ({ page }) => {
        await openPrologue(page);

        await expect(page.locator('.story-dots')).toBeHidden();

        await hitButton(page).click();

        await expect(page.locator('.story-dot')).toHaveCount(6);
        await expect(page.locator('.story-dot.is-on')).toHaveCount(1);

        await hitButton(page).click();
        await watchLine(page, 5);
        await hitButton(page).click();

        await expect(page.locator('.story-endtitle')).toBeVisible();
        await expect(page.locator('.story-dots')).toBeHidden();
    });

    test('Enter on the focused hit button starts the scene', async ({ page }) => {
        await openPrologue(page);

        await page.keyboard.press('Enter');

        await expect(page.locator('.story-narr')).toBeVisible();
    });

    test('Space on the hit button completes a typing line', async ({ page }) => {
        await openPrologue(page);

        await hitButton(page).click();
        await page.keyboard.press('Space');

        await expect(lineText(page)).toHaveText('Eldora sempre respirou pela Grande Árvore. Suas raízes bebem do fundo do mundo, e sua seiva corre por cada folha, cada rio, cada criatura.');
    });

    test('the mute button switches its label and pressed state', async ({ page }) => {
        await openPrologue(page);

        await expect(mute(page)).toHaveCSS('width', '44px');
        await expect(mute(page)).toHaveCSS('height', '44px');
        await expect(mute(page)).toHaveCSS('border-radius', '50%');

        await expect(mute(page)).toHaveAttribute('aria-label', 'Silenciar');
        await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');

        await mute(page).click();

        await expect(mute(page)).toHaveAttribute('aria-label', 'Ativar som');
        await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');

        await mute(page).click();

        await expect(mute(page)).toHaveAttribute('aria-label', 'Silenciar');
        await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');
    });

    test.describe('with every scene seen', () => {
        test.use({ storySeen: true });

        test('focus returns to the Prólogo chip when a replay closes', async ({ page }) => {
            await startBattle(page);
            await page.getByTestId('hud-farm').click();

            const chip = page.getByTestId('story-replay-prologue');

            await chip.focus();
            await page.keyboard.press('Enter');

            await expect(overlay(page)).toBeVisible();
            await expect(hitButton(page)).toBeFocused();

            await page.getByTestId('story-skip').click();

            await expect(overlay(page)).toHaveCount(0);
            await expect(chip).toBeFocused();
        });
    });
});
