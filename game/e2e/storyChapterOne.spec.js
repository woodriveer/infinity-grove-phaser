import { expect, test } from './support/coverage';
import { held, hitButton, lineText, noPlay, seenKey, startBattle, chapterDefinition, watchLine } from './support/story';
import { openMainMenu } from './support/game';

//  The prologue is not under test: it is seen, the chapter 1 scene is not
test.use({ storySeen: false });

//  The seven lines of the chapter 1 scene (spec story-scenes, P1 The chapter 1 boss scene AC 1)
const LINES = [
    'A Serpente Umbral tomba na clareira, e o veneno roxo escorre de volta para a terra.',
    'Uma serpente desse tamanho, aqui? Isto não é do nosso bosque.',
    'Olha os olhos dela, Kael! Ainda brilham. Vermelho, vermelho, como brasa!',
    'Interessante... As veias roxas pulsam no mesmo ritmo. Como se algo lá embaixo respirasse por elas.',
    'A Árvore diz que isto é só o começo. Precisamos ficar juntos.',
    'Ela diz, é? Sorte a sua. Comigo ninguém conversa.',
    'Então fique calado e lute, espião. Avançamos ao amanhecer.'
];
const SPEAKERS = [ 'Kael', 'Lyra', 'Orina', 'Seraphine', 'Vex', 'Kael' ];
const FACES = [ 'face-kael.jpg', 'face-lyra.jpg', 'face-orina.jpg', 'face-seraphine.jpg', 'face-vex.jpg', 'face-kael.jpg' ];
const KAEL_MATRIX = 'matrix(1.75, 0, 0, 1.75, -551, -350)';
const NARRATOR_MATRIX = 'matrix(1.18, 0, 0, 1.18, 0, -129)';

const overlay = (page) => page.getByTestId('story-overlay');
const camera = (page) => page.getByTestId('story-camera');
const bar = (page, which) => page.locator(`.story-bar.is-${which}`);

//  The chapter boss of chapter 1 has 1 health, so the click that follows wins it and chapter 2 opens (the pattern of campaignChapters.spec.js)
const openChapterOne = async (page) => {
    await page.addInitScript(() => localStorage.setItem('infinity-grove.story-seen', '["prologue"]'));
    await noPlay(page);

    const started = await startBattle(page, {
        progress: { yan: { chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 } },
        definition: chapterDefinition(1),
        lastChapter: 2,
        cards: { yan: { leader: 'kael', copies: { 'kael:0': 1 } } }
    });

    await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
    await expect(page.getByTestId('leader-card')).toContainText('Kael');
    await started.menu.canvas.click();
    await expect(overlay(page)).toBeVisible();

    return started;
};

test.describe('The chapter 1 boss scene', () => {
    test('the chapter 1 boss win opens the chapter 1 scene on its title card', async ({ page }) => {
        await openChapterOne(page);

        await expect(overlay(page)).toHaveClass(/is-chapter-boss/);
        await expect(page.locator('.story-kicker')).toHaveText('Capítulo 1 — Final');
        await expect(page.locator('.story-cardtitle')).toHaveText('A Devoradora da Clareira');
        await expect(page.locator('.story-cardtitle')).toHaveCSS('font-size', '44px');
        await expect(page.locator('.story-logo')).toHaveCSS('width', '520px');
        await expect(page.locator('.story-cta')).toHaveText('Clique para começar');
        await expect(hitButton(page)).toHaveAttribute('aria-label', 'Começar a cena');
        expect(await seenKey(page)).toBe('["prologue","chapter-1"]');
        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 2');
        //  The title card shows the clearing with the dark tint (spec P2 Scene looks as data AC 5)
        await expect(page.locator('[data-backdrop="clearing"]')).toHaveClass(/is-on/);
        await expect(page.locator('[data-backdrop="forest"]')).not.toHaveClass(/is-on/);
        await expect(page.locator('.story-tint.is-dark')).toHaveClass(/is-on/);
        await expect(page.locator('.story-tint.is-dawn')).not.toHaveClass(/is-on/);
    });

    test('the camera pushes in on the narrator and moves to Kael', async ({ page }) => {
        await openChapterOne(page);

        await hitButton(page).click();
        await hitButton(page).click();

        await expect(camera(page)).toHaveCSS('transition-duration', '6s');
        await expect(camera(page)).toHaveCSS('transform', NARRATOR_MATRIX, { timeout: 8000 });

        await hitButton(page).click();

        await expect(camera(page)).toHaveCSS('transform', KAEL_MATRIX, { timeout: 3000 });
        await expect(camera(page)).toHaveCSS('transition-duration', '1.8s');
        await expect(camera(page)).toHaveCSS('transition-timing-function', 'cubic-bezier(0.45, 0.05, 0.25, 1)');
    });

    test('the letterbox frames the lines and leaves the cards', async ({ page }) => {
        await openChapterOne(page);

        await expect(bar(page, 'top')).toHaveCSS('height', '0px');
        await expect(bar(page, 'bottom')).toHaveCSS('height', '0px');

        await hitButton(page).click();

        await expect(bar(page, 'top')).toHaveCSS('height', '46px', { timeout: 2000 });
        await expect(bar(page, 'top')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
        await expect(bar(page, 'top')).toHaveCSS('transition-duration', '0.8s');
        await expect(bar(page, 'bottom')).toHaveCSS('height', '46px', { timeout: 2000 });

        await hitButton(page).click();
        await watchLine(page, 6);
        await hitButton(page).click();

        await expect(page.locator('.story-endtitle')).toBeVisible();
        await expect(bar(page, 'top')).toHaveCSS('height', '0px', { timeout: 2000 });
        await expect(bar(page, 'bottom')).toHaveCSS('height', '0px', { timeout: 2000 });
    });

    test('each line shows its speaker and round face', async ({ page }) => {
        await openChapterOne(page);

        await watchLine(page);
        await expect(lineText(page)).toHaveText(LINES[0]);
        await expect(page.getByTestId('story-speaker')).toHaveCount(0);

        for (let n = 2; n <= 7; n++) {
            await watchLine(page);

            const face = page.getByTestId('story-face');

            await expect(lineText(page)).toHaveText(LINES[n - 1]);
            await expect(page.getByTestId('story-speaker')).toHaveText(SPEAKERS[n - 2]);
            await expect(face).toHaveAttribute('src', new RegExp(`${FACES[n - 2].replace('.', '\\.')}$`));
            await expect(face).toHaveAttribute('alt', SPEAKERS[n - 2]);
            await expect(face).toHaveCSS('width', '156px');
            await expect(face).toHaveCSS('border-radius', '50%');
            await expect(page.locator('.story-box.is-face')).toHaveCSS('left', '110px');
            await expect(page.locator('.story-box.is-face')).toHaveCSS('width', '1060px');
            await expect(page.locator('.story-box.is-face')).toHaveCSS('padding-left', '210px');
            await expect(page.getByTestId('story-speaker')).toHaveCSS('left', '206px');
        }
    });

    test('the veins pulse on the narrator and Orina, the dawn warms Kael\'s last line', async ({ page }) => {
        await openChapterOne(page);

        const veins = page.locator('.story-tint.is-veins');
        const dawn = page.locator('.story-tint.is-dawn');

        await watchLine(page);
        await expect(veins).toHaveClass(/is-on/);
        await expect(veins).toHaveCSS('animation-name', 'storyVeins');

        await watchLine(page);
        await expect(veins).not.toHaveClass(/is-on/);

        await watchLine(page, 2);
        await expect(veins).toHaveClass(/is-on/);
        await expect(veins).toHaveCSS('animation-name', 'storyVeins');
        await expect(dawn).not.toHaveClass(/is-on/);

        await watchLine(page, 3);
        await expect(dawn).toHaveClass(/is-on/);

        await hitButton(page).click();
        await expect(page.locator('.story-endtitle')).toBeVisible();
        await expect(dawn).toHaveClass(/is-on/);
    });

    test('the end card closes into the chapter 2 fight', async ({ page }) => {
        await openChapterOne(page);

        await watchLine(page, 7);
        await hitButton(page).click();

        await expect(page.locator('.story-kicker')).toHaveText('Fim do Capítulo 1');
        await expect(page.locator('.story-endtitle')).toHaveText('A Devoradora da Clareira');
        await expect(page.locator('.story-endtitle')).toHaveCSS('font-size', '44px');
        await expect(page.locator('.story-endsub')).toHaveText('Ao amanhecer, os cinco guardiões avançam.');
        await expect(page.locator('.story-endsub')).toHaveCSS('font-size', '28px');
        await expect(page.locator('.story-cta')).toHaveText('Clique para continuar');
        await expect(hitButton(page)).toHaveAttribute('aria-label', 'Continuar');
        //  The end card shows the clearing with the dark and dawn tints
        await expect(page.locator('[data-backdrop="clearing"]')).toHaveClass(/is-on/);
        await expect(page.locator('.story-tint.is-dark')).toHaveClass(/is-on/);
        await expect(page.locator('.story-tint.is-dawn')).toHaveClass(/is-on/);

        await hitButton(page).click();

        await expect(overlay(page)).toHaveCount(0);
        await expect(page.locator('.stage-hud')).toHaveText('Stage 1/10  Phase 1/5');
        expect(await held(page)).toEqual([ false, false, false ]);
    });

    test('the chapter 1 scene does not open again', async ({ page }) => {
        const { backend } = await openChapterOne(page);

        await page.getByTestId('story-skip').click();
        await expect(overlay(page)).toHaveCount(0);
        await expect.poll(() => backend.progresses.get('yan'), { timeout: 15_000 }).toMatchObject({ chapter: 2 });

        await page.reload();

        const menu = await openMainMenu(page, { state: 'welcome' });

        await menu.canvas.click();

        await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 2');
        await expect(page.locator('.stage-hud')).toBeVisible();
        await page.waitForTimeout(1000);
        await expect(overlay(page)).toHaveCount(0);
    });

    test('the scene draws ten motes', async ({ page }) => {
        await openChapterOne(page);

        await expect(page.locator('.story-mote')).toHaveCount(10);
        await expect(page.locator('.story-mote').first()).toHaveCSS('left', '120px');
        await expect(page.locator('.story-mote').first()).toHaveCSS('top', '520px');
    });

    test('with reduced motion the camera jumps', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openChapterOne(page);

        await watchLine(page);
        await hitButton(page).click();

        await expect(camera(page)).toHaveCSS('transition-duration', '0s');
        await expect(camera(page)).toHaveCSS('transform', KAEL_MATRIX, { timeout: 500 });
    });
});
