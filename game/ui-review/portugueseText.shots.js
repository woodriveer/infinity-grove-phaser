import { expect, test } from '@playwright/test';
import { mockBackend, serverDown } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the portuguese-text review (.specs/features/portuguese-text/ui-review/), same setup as e2e/portugueseText.spec.js.
const element = (name, defense = 0, critResistance = 0) => ({ element: name, defense, critResistance });
const definition = ({ stages = 10, phases = 5, bossHealth = 100, bossLimit = 90_000, minibossLimit = 45_000 } = {}) => ({
    bossHealth, bossTimeLimitMs: bossLimit, boss: element('DARKNESS', 30, 30), bossDropRuleId: 6,
    stages: Array.from({ length: stages }, (_, i) => ({
        number: i + 1, phasesPerStage: phases, monsterHealth: 5000, minibossHealth: 5000, minibossTimeLimitMs: minibossLimit,
        monster: element('DARKNESS', 20, 10), miniboss: element('DARKNESS', 50, 35), monsterDropRuleId: 4, minibossDropRuleId: 5
    }))
});

const enterWelcome = async (page, { progress = {}, def, extra = {} } = {}) => {
    await mockBackend(page, { users: { yan: 'secret123' }, ...(def && { definition: def }), progress: { yan: { chapter: 1, ...progress } }, ...extra });
    await page.addInitScript(() => localStorage.setItem('infinity-grove.auto-click', 'off'));
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.welcomeTitle).toBeVisible();

    return menu;
};

const begin = async (page, menu) => {
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.locator('.stage-hud')).not.toHaveText('');
    await expect(page.getByTestId('monster-hp')).toBeVisible();
};

//  Prints the boxes the review reads: the plate, the timer, the farm label, the enemy line and the start prompt
const report = async (page, label) => {
    const info = await page.evaluate(() => {
        const box = (selector) => {
            const node = document.querySelector(selector);

            if (!node) { return null; }
            const r = node.getBoundingClientRect();

            return { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height), scrollW: node.scrollWidth, clientW: node.clientWidth, text: node.textContent.trim() };
        };

        return { plate: box('.stage-hud'), timer: box('.boss-timer'), farm: box('.farm-toggle'), enemy: box('.enemy-stats'), welcome: box('.welcome-start') };
    });

    console.log('MEASURE', label, JSON.stringify(info));
};

test('01-02 sign-in form and the offline error', async ({ page }, testInfo) => {
    await mockBackend(page);
    const menu = await openMainMenu(page);

    await shot(page, testInfo, '01-signin-form');
    await serverDown(page);
    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Não foi possível falar com o servidor. Tente de novo mais tarde.');
    await shot(page, testInfo, '02-signin-error-offline');
});

test('03 short password', async ({ page }, testInfo) => {
    await mockBackend(page);
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'newbie', 'short');
    await menu.signupButton.click();
    await menu.chooseHero('NATURE');
    await expect(menu.message).toHaveText('A senha precisa ter pelo menos 8 caracteres.');
    await shot(page, testInfo, '03-signin-error-short-password');
});

test('04 welcome', async ({ page }, testInfo) => {
    await enterWelcome(page);
    await expect(page.locator('.welcome-title')).toHaveText('Olá, yan!');
    await report(page, 'welcome');
    await shot(page, testInfo, '04-welcome');
});

test('05 phase plate with the largest numbers', async ({ page }, testInfo) => {
    const menu = await enterWelcome(page, { def: definition({ phases: 8 }), progress: { stage: 10, encounter: 'PHASE', phase: 8 } });

    await begin(page, menu);
    await expect.poll(() => page.locator('.stage-hud').evaluate((node) => node.textContent)).toBe('Estágio 10/10  Fase 8/8');
    await report(page, 'phase');
    await shot(page, testInfo, '05-hud-phase');
});

test('06 miniboss timer', async ({ page }, testInfo) => {
    const menu = await enterWelcome(page, { def: definition(), progress: { stage: 3, encounter: 'MINIBOSS', phase: 1 } });

    await begin(page, menu);
    await expect(page.locator('.stage-hud')).toHaveText('Estágio 3/10 Miniboss');
    await expect(page.locator('.boss-timer')).toHaveText(/^Tempo: \d+s$/);
    await report(page, 'miniboss');
    await shot(page, testInfo, '06-hud-miniboss-timer');
});

test('07 chapter boss', async ({ page }, testInfo) => {
    const menu = await enterWelcome(page, { def: definition(), progress: { stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 } });

    await begin(page, menu);
    await expect(page.locator('.stage-hud')).toHaveText('Chefe do capítulo');
    await expect(page.locator('.boss-timer')).toHaveText(/^Tempo: \d+s$/);
    await report(page, 'chapter-boss');
    await shot(page, testInfo, '07-hud-chapter-boss');
});

test('08 enemy line darkness', async ({ page }, testInfo) => {
    const menu = await enterWelcome(page, { def: definition(), progress: { stage: 1, encounter: 'PHASE', phase: 1 } });

    await begin(page, menu);
    await expect(page.locator('.enemy-stats')).toHaveText(/^Escuridão  Defesa 20%  Seu crítico: [0-9]+%$/);
    await report(page, 'enemy');
    await shot(page, testInfo, '08-enemy-line-darkness');
});

test('09-11 pause menu, confirmation and farm switch', async ({ page }, testInfo) => {
    const menu = await enterWelcome(page, { def: definition(), progress: { stage: 3, encounter: 'MINIBOSS', phase: 1 } });

    await begin(page, menu);
    await expect(page.locator('.farm-toggle')).toBeVisible();
    await report(page, 'farm');
    await shot(page, testInfo, '11-farm-switch');
    await page.keyboard.press('Escape');
    await expect(page.locator('.pause-menu')).toBeVisible();
    await shot(page, testInfo, '09-pause-menu');
    await page.locator('.pause-leave').click();
    await expect(page.locator('.pause-question')).toBeVisible();
    await shot(page, testInfo, '10-pause-confirm');
    const rows = await page.evaluate(() => [ '.pause-confirm-yes', '.pause-confirm-no', '.pause-continue', '.pause-leave', '.pause-menu' ].map((selector) => {
        const r = document.querySelector(selector)?.getBoundingClientRect();

        return r && [ selector, Math.round(r.x), Math.round(r.width), Math.round(r.height) ];
    }));

    console.log('MEASURE pause', JSON.stringify(rows));
});

test('12 chapter complete', async ({ page }, testInfo) => {
    const menu = await enterWelcome(page, {
        def: definition({ bossHealth: 1 }), progress: { chapter: 15, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }, extra: { lastChapter: 15 }
    });

    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('monster-hp')).toBeVisible();
    await expect(async () => {
        await page.locator('#game-container canvas').click({ position: { x: 640, y: 380 } });
        await expect(page.locator('.stage-message')).toHaveText('Capítulo concluído!', { timeout: 500 });
    }).toPass({ timeout: 20_000 });
    await shot(page, testInfo, '12-chapter-complete');
});
