import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  Unified damage on the real scene: one damage and one defense. The leader holds a 3 star card, so its click carries the star bonus of 40 %
//  click damage: the base damage is 1.4 (STAR) and a skill of P % deals 1.4 x P / 100 points. The default roll 0.99 never crits.
const STAR = 1.4;
//  The monsters share the element of the leader (an element against itself is neutral) with 1000 health, so no hit kills one. Time moves with scene.update(), not with the clock.
const ELEMENT_OF = { kael: 'FIRE', lyra: 'NATURE', orina: 'WATER', seraphine: 'LIGHT', vex: 'DARKNESS' };
//  A monster of the new payload: the defense and both legacy columns equal
const enemy = (element, defense, critResistance = 0) => ({ element, defense, critResistance });
const bare = (element) => enemy(element, 0);

const chapter = (monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ {
        number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000,
        monster, miniboss: monster
    } ]
});

const startAs = async (page, heroId, { monster, encounter = 'PHASE', roll, talents, talentPoints } = {}) => {
    await mockBackend(page, {
        users: { yan: 'secret123' },
        definition: chapter(monster ?? bare(ELEMENT_OF[heroId])),
        cards: { yan: { leader: heroId, copies: { [`${heroId}:3`]: 1 } } },
        progress: { yan: { stage: 1, encounter, phase: 1 } },
        ...(talents && { talents: { yan: talents } }),
        ...(talentPoints && { talentPoints: { yan: talentPoints } })
    });

    const menu = await openMainMenu(page, roll === undefined ? {} : { random: roll });

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('skill-slot-3')).toHaveAttribute('data-unlocked', 'true');
    await expect.poll(() => health(page)).toBe(1000);

    return menu;
};

const scene = (page, read) => page.evaluate(`(${read})(window.__PHASER_GAME__.scene.getScene('ClickerGame'))`);
const health = (page) => scene(page, '(s) => s.monster?.health');
const advance = (page, ms) => page.evaluate((delta) => window.__PHASER_GAME__.scene.getScene('ClickerGame').update(0, delta), ms);
const dealt = async (page) => 1000 - await health(page);
const use = (page, slot) => page.keyboard.press(String(slot));
const click = (page) => page.locator('#game-container canvas').click();

//  Uses skill `slot` and strikes the monster once in the same call; returns the damage dealt so far
const useThenStrike = (page, slot) => page.evaluate((number) => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.useSkill(number);
    game.strike(512);

    return Math.round((1000 - game.monster.health) * 1e6) / 1e6;
}, slot);
//  Strikes the monster once; returns the damage dealt so far
const strikeNow = (page) => page.evaluate(() => {
    const game = window.__PHASER_GAME__.scene.getScene('ClickerGame');

    game.strike(512);

    return Math.round((1000 - game.monster.health) * 1e6) / 1e6;
});

test.describe('Unified damage', () => {
    test('Prisão de Espinhos raises an Orina click by 25 %: 1.4 x 1.25 = 1.75, and a plain 1.4 after it ends', async ({ page }) => {
        await startAs(page, 'orina');

        expect(await useThenStrike(page, 1)).toBeCloseTo(STAR * 1.25, 5);

        await advance(page, 2_500);

        expect(await strikeNow(page)).toBeCloseTo(STAR * 1.25 + STAR, 5);
    });

    test('Bênção da Grande Árvore raises Luz Divina by 30 %: 8 x 1.4 x 1.3 = 14.56', async ({ page }) => {
        await startAs(page, 'seraphine');

        await use(page, 1);
        await use(page, 2);

        await expect.poll(() => dealt(page)).toBeCloseTo(8 * STAR * 1.3, 5);
    });

    test('Chuva de Meteoros ignores physicalDefense of an old payload: physicalDefense 50 and magicalDefense 10 make 25 x 1.4 = 35', async ({ page }) => {
        await startAs(page, 'orina', { monster: { element: 'WATER', physicalDefense: 50, magicalDefense: 10, critResistance: 0 } });

        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 0%  Seu crítico: 40%');

        await use(page, 3);

        await expect.poll(() => dealt(page)).toBeCloseTo(25 * STAR, 5);
    });

    test('a monster of the new payload shows Defesa 40% and a click meets it: 1.4 x 0.6 = 0.84', async ({ page }) => {
        await startAs(page, 'orina', { monster: enemy('WATER', 40, 12) });

        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 40%  Seu crítico: 28%');
        await expect(page.locator('.enemy-stats')).not.toContainText('Physical def');
        await expect(page.locator('.enemy-stats')).not.toContainText('Magical def');
        await expect(page.locator('.enemy-stats [data-stat="defense"]')).toHaveCount(1);

        await click(page);

        await expect.poll(() => dealt(page)).toBeCloseTo(STAR * 0.6, 5);
    });

    test('defense wins over physicalDefense when a payload has both: Defesa 40%', async ({ page }) => {
        await startAs(page, 'orina', { monster: { element: 'WATER', defense: 40, physicalDefense: 70, magicalDefense: 70, critResistance: 0 } });

        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 40%  Seu crítico: 40%');

        await click(page);

        await expect.poll(() => dealt(page)).toBeCloseTo(STAR * 0.6, 5);
    });

    test('PHYSICAL_BREAK 5 lowers the defense for an Orina skill too: Chuva de Meteoros on defense 20 deals 25 x 1.4 x 0.85 = 29.75', async ({ page }) => {
        await startAs(page, 'orina', { monster: enemy('WATER', 20), talents: { PHYSICAL_BREAK: 5 } });

        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 15%  Seu crítico: 40%');

        await use(page, 3);

        await expect.poll(() => dealt(page)).toBeCloseTo(25 * STAR * 0.85, 5);
    });

    test('the enemy line is one centred row of three dark chips: element, Defesa with the brown shield, Seu crítico with the red target', async ({ page }) => {
        await startAs(page, 'orina', { monster: enemy('WATER', 11, 33) });

        const chips = page.locator('.enemy-stats .tag');

        await expect(chips).toHaveCount(3);
        await expect(chips.nth(0)).toHaveAttribute('data-element', 'WATER');
        await expect(chips.nth(0)).toHaveText('Water');
        await expect(chips.nth(1)).toHaveAttribute('data-stat', 'defense');
        await expect(chips.nth(1)).toHaveText('Defesa 11%');
        await expect(chips.nth(2)).toHaveAttribute('data-stat', 'crit');
        await expect(chips.nth(2)).toHaveText('Seu crítico: 7%');
        await expect(page.locator('.enemy-stats [data-stat="physical"], .enemy-stats [data-stat="magical"]')).toHaveCount(0);

        await expect(page.locator('.enemy-stats')).toHaveCSS('display', 'flex');
        await expect(page.locator('.enemy-stats')).toHaveCSS('justify-content', 'center');
        await expect(page.locator('.enemy-stats')).toHaveCSS('column-gap', '6px');

        for (let at = 0; at < 3; at += 1)
        {
            await expect(chips.nth(at)).toHaveCSS('background-color', 'rgba(28, 18, 12, 0.85)');
            await expect(chips.nth(at)).toHaveCSS('border-top-width', '1px');
            await expect(chips.nth(at)).toHaveCSS('border-top-style', 'solid');
            await expect(chips.nth(at)).toHaveCSS('border-top-color', 'rgb(176, 122, 58)');
            await expect(chips.nth(at)).toHaveCSS('color', 'rgb(244, 230, 200)');
            await expect(chips.nth(at)).toHaveCSS('font-size', '11px');
            await expect(chips.nth(at)).toHaveCSS('padding-top', '3px');
            await expect(chips.nth(at)).toHaveCSS('padding-bottom', '3px');
            await expect(chips.nth(at)).toHaveCSS('padding-left', '8px');
            await expect(chips.nth(at)).toHaveCSS('padding-right', '8px');
        }

        const icon = (stat) => page.locator(`.enemy-stats [data-stat="${stat}"]`)
            .evaluate((node) => {
                const style = getComputedStyle(node, '::before');

                return { color: style.backgroundColor, width: style.width, height: style.height };
            });

        expect(await icon('defense')).toEqual({ color: 'rgb(176, 122, 58)', width: '12px', height: '12px' });
        expect(await icon('crit')).toEqual({ color: 'rgb(214, 69, 65)', width: '12px', height: '12px' });
    });

    test('upgrading PHYSICAL_BREAK from 5 to 6 turns Defesa 15% into 14% on the same monster, and the next click meets it: 1.4 x 0.86', async ({ page }) => {
        await startAs(page, 'orina', { monster: enemy('WATER', 20), talents: { PHYSICAL_BREAK: 5 }, talentPoints: 1 });

        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 15%  Seu crítico: 40%');

        await page.getByTestId('hud-talents').click();
        await page.getByTestId('talent-PHYSICAL_BREAK').click();
        await page.getByTestId('talent-upgrade-PHYSICAL_BREAK').click();
        await expect(page.getByTestId('talent-level-PHYSICAL_BREAK')).toHaveText('Nível 6/10');
        await page.getByTestId('hero-close').click();

        await expect(page.locator('.enemy-stats')).toHaveText('Water  Defesa 14%  Seu crítico: 40%');

        await click(page);

        await expect.poll(() => dealt(page)).toBeCloseTo(STAR * 0.86, 5);
    });

    test('the Talentos screen has one Quebra de defesa and one Perfuração de armadura per grade and no magical break', async ({ page }) => {
        await startAs(page, 'kael');

        await page.getByTestId('hud-talents').click();
        await expect(page.getByTestId('talent-screen')).toBeVisible();

        await expect(page.locator('.talent-node[data-branch="BREAK"]')).toHaveCount(6);
        expect(await page.locator('.talent-node[data-branch="BREAK"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('title')))).toEqual([
            'Quebra de defesa', 'Perfuração de armadura',
            'Quebra de defesa (Grau 2)', 'Perfuração de armadura (Grau 2)',
            'Quebra de defesa (Grau 3)', 'Perfuração de armadura (Grau 3)'
        ]);
        await expect(page.getByTestId('talent-MAGICAL_BREAK')).toHaveCount(0);
        await expect(page.getByTestId('talent-MAGICAL_BREAK_G2')).toHaveCount(0);
        await expect(page.getByTestId('talent-MAGICAL_BREAK_G3')).toHaveCount(0);
        await expect(page.getByTestId('talent-CRIT_RESIST_BREAK')).toHaveCount(0);
    });

    test('the attribute panel shows Quebra de defesa: 3 and no damage type', async ({ page }) => {
        await startAs(page, 'kael', { talents: { PHYSICAL_BREAK: 3 } });

        await page.getByTestId('hud-equipment').click();
        await expect(page.getByTestId('leader-stats')).toBeVisible();

        await expect(page.getByTestId('stat-breakDefense')).toHaveText('Quebra de defesa: 3');
        await expect(page.getByTestId('stat-damageType')).toHaveCount(0);
        await expect(page.getByTestId('stat-breakPhysical')).toHaveCount(0);
        await expect(page.getByTestId('stat-breakMagical')).toHaveCount(0);
        await expect(page.getByTestId('leader-stats').locator('.stat-line')).toHaveCount(10);
    });

    test('Orina\'s leader bonus reads +20% de dano total. on the skill bar and in the hero detail, and her skills name no damage type', async ({ page }) => {
        await startAs(page, 'orina');

        await expect(page.locator('.leader-bonus')).toHaveText('Líder · +20% de dano total. (em breve)');

        await page.getByTestId('hud-heroes').click();
        await page.getByTestId('hero-card-orina').click();

        const detail = page.getByTestId('hero-detail');

        await expect(detail.locator('.hero-bonus')).toHaveText('Bônus de líder: +20% de dano total. (em breve)');
        await expect(detail.locator('.skill-effect')).toHaveText([
            'Vinhas de espinhos prendem os inimigos por 2s; enquanto presos, recebem +25% de dano.',
            'Raios caem por 6s, causando 200% de dano por segundo a todos os inimigos.',
            'Uma chuva de estrelas causa 2500% de dano em área.'
        ]);
        await expect(detail).not.toContainText('mágic');
    });
});
