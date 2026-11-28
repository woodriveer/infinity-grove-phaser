import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the unified damage screens (.specs/features/unified-damage/ui-review/). Everything runs on the fake backend.
const monster = { element: 'WATER', defense: 11, critResistance: 33 };
const chapter = {
    bossHealth: 1000, bossTimeLimitMs: 60_000, boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster } ]
};

const start = async (page, heroId, talents) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter,
        cards: { yan: { leader: heroId, copies: { [`${heroId}:3`]: 1 } } },
        progress: { yan: { stage: 1, encounter: 'PHASE', phase: 1 } },
        ...(talents && { talents: { yan: talents } })
    });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-3')).toHaveAttribute('data-unlocked', 'true');
    await page.waitForTimeout(800);
};

test('S1 enemy line', async ({ page }, testInfo) => {
    await start(page, 'kael');
    await expect(page.locator('.enemy-stats')).toHaveText('Água  Defesa 11%  Crit res 33%');
    await shot(page, testInfo, '01-enemy-line');
});

test('S2 enemy line with broken defense', async ({ page }, testInfo) => {
    await start(page, 'kael', { PHYSICAL_BREAK: 5 });
    await expect(page.locator('.enemy-stats')).toHaveText('Água  Defesa 6%  Crit res 33%');
    await shot(page, testInfo, '02-enemy-line-broken');
});

test('S3 talents', async ({ page }, testInfo) => {
    await start(page, 'kael');
    await page.getByTestId('hud-talents').click();
    await expect(page.getByTestId('talent-screen')).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, testInfo, '03-talents');
    await shot(page.getByTestId('talent-branch-BREAK'), testInfo, '03b-talents-break-column');
});

test('S4 attributes', async ({ page }, testInfo) => {
    await start(page, 'kael', { PHYSICAL_BREAK: 3 });
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('leader-stats')).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, testInfo, '04-attributes');
    await shot(page.getByTestId('leader-stats'), testInfo, '04b-attributes-panel');
});

test('S5 Orina detail', async ({ page }, testInfo) => {
    await start(page, 'orina');
    await page.getByTestId('hud-heroes').click();
    await page.getByTestId('hero-card-orina').click();
    await expect(page.getByTestId('hero-detail')).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, testInfo, '05-orina-detail');
});

test('S6 skill bar', async ({ page }, testInfo) => {
    await start(page, 'orina');
    await expect(page.locator('.leader-bonus')).toHaveText('Líder · +20% de dano total. (em breve)');
    await shot(page, testInfo, '06-skill-bar');
});
