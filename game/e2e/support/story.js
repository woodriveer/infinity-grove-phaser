//  Helpers of the story specs (spec story-scenes): the battle with a fixed fake campaign, the fight hold, the seen list and the clicks through a scene.
import { expect } from './coverage';
import { mockBackend } from './fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './game';

const bare = { element: 'FIRE', defense: 0, critResistance: 0 };

//  Ten stages of five phases: every monster and miniboss has 10 000 health, so nothing dies while a test watches; the chapter boss has `bossHealth`
export const chapterDefinition = (bossHealth = 10_000) => ({
    bossHealth,
    bossTimeLimitMs: 60_000,
    boss: bare,
    stages: Array.from({ length: 10 }, (_, index) => ({
        number: index + 1, phasesPerStage: 5, monsterHealth: 10_000, minibossHealth: 10_000, minibossTimeLimitMs: 30_000, monster: bare, miniboss: bare
    }))
});

//  Logs in as yan, opens the battle and waits for its scene; `backend` overrides the fake backend options
export const startBattle = async (page, backend = {}) => {
    const fake = await mockBackend(page, { users: { yan: 'secret123' }, definition: chapterDefinition(), ...backend });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');

    return { backend: fake, menu };
};

//  [ paused, time.paused, tweens.paused ] of the battle
export const held = (page) => page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    return [ scene.paused, scene.time.paused, scene.tweens.paused ];
});

export const seenKey = (page) => page.evaluate(() => localStorage.getItem('infinity-grove.story-seen'));

//  The audio of every line is refused, so the lines type and end by the clock
export const noPlay = (page) => page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('blocked', 'NotAllowedError')); };
});

export const hitButton = (page) => page.getByTestId('story-hit');
export const lineText = (page) => page.locator('[data-testid="story-text"] .story-shown');

//  From the title card (or a complete line) to the complete text of line `n`: a click starts it, a second one completes it
export const watchLine = async (page, n = 1) => {
    for (let line = 0; line < n; line++) {
        await hitButton(page).click();
        await hitButton(page).click();
    }
};
