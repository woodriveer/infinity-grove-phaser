import { expect, test } from '@playwright/test';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { mockBackend } from '../e2e/support/fakeBackend';
import { chapterDefinition, hitButton, noPlay } from '../e2e/support/story';
import { shot } from './support/shots';

//  Screenshots of the story-scenes review (.specs/features/story-scenes/ui-review/). Audio is refused so every line types by the clock.
const SEEN = 'infinity-grove.story-seen';

const start = async (page, { seen, backend = {} }) => {
    await page.addInitScript(([ key, value ]) => {
        if (value !== null) { localStorage.setItem(key, value); }
        localStorage.setItem('infinity-grove.auto-click', 'off');
    }, [ SEEN, seen ]);
    await noPlay(page);
    await mockBackend(page, { users: { yan: 'secret123' }, definition: chapterDefinition(), ...backend });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');

    return menu;
};

//  One click starts the next line, a second completes it
const line = async (page) => {
    await hitButton(page).click();
    await hitButton(page).click();
    await page.mouse.move(0, 0);
};

const overlay = (page) => page.getByTestId('story-overlay');

test('prologue', async ({ page }, testInfo) => {
    await start(page, { seen: null });
    await expect(overlay(page)).toBeVisible();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1500);
    await shot(page, testInfo, '01-title');

    await hitButton(page).click();
    await page.waitForTimeout(3000);
    await shot(page, testInfo, '02-narrator-typing');
    await hitButton(page).click();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '03-narrator-complete');

    const names = [ '04-dark', '05-red', '06-map', '07-voice', '08-character' ];

    for (const name of names) {
        await line(page);
        await page.waitForTimeout(900);
        await shot(page, testInfo, name);
    }

    await hitButton(page).click();
    await page.waitForTimeout(1500);
    await shot(page, testInfo, '09-end');
    await page.getByTestId('story-mute').click();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '10-muted');

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    await shot(page, testInfo, '14-bands-1024');
});

test('reduced motion', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await start(page, { seen: null });
    await expect(overlay(page)).toBeVisible();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1500);
    await shot(page, testInfo, '13-reduced-motion');
});

test('mapa', async ({ page }, testInfo) => {
    await start(page, { seen: '["prologue"]' });
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await shot(page, testInfo, '10b-rail-with-mapa-tab');
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-story')).toBeVisible();
    await page.waitForTimeout(2000);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '11-mapa');
});

test('mapa chapters', async ({ page }, testInfo) => {
    await start(page, { seen: '["prologue"]', backend: { progress: { yan: { chapter: 3 } } } });
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-story')).toBeVisible();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '12-mapa-chapters');
});

test('mapa two chips', async ({ page }, testInfo) => {
    await start(page, { seen: '["prologue","chapter-1"]' });
    await expect(page.getByTestId('skill-slot-1')).toBeVisible();
    await page.getByTestId('hud-farm').click();
    await expect(page.getByTestId('farm-story')).toBeVisible();
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '22-mapa-two-chips');
});

test('chapter 1', async ({ page }, testInfo) => {
    await start(page, {
        seen: '["prologue"]',
        backend: {
            progress: { yan: { chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 } },
            definition: chapterDefinition(1), lastChapter: 2, cards: { yan: { leader: 'kael', copies: { 'kael:0': 1 } } }
        }
    });
    await expect(page.getByTestId('chapter-hud')).toHaveText('Capítulo 1');
    await page.getByTestId('hud-farm').count();
    await page.mouse.click(640, 360);
    await expect(overlay(page)).toBeVisible();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1500);
    await shot(page, testInfo, '15-ch1-title');

    await line(page);
    await page.waitForTimeout(6500);
    await shot(page, testInfo, '16-ch1-narrator');

    const rest = [ [ 1, '17-ch1-kael' ], [ 1, '17b-ch1-lyra' ], [ 1, '18-ch1-orina' ], [ 1, '18b-ch1-seraphine' ], [ 1, '19-ch1-vex' ], [ 1, '20-ch1-dawn' ] ];

    for (const [ , name ] of rest) {
        await line(page);
        await page.waitForTimeout(2200);
        await shot(page, testInfo, name);
    }

    await hitButton(page).click();
    await page.waitForTimeout(1500);
    await shot(page, testInfo, '21-ch1-end');
});
