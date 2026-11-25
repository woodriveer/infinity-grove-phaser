import { expect, test } from './support/coverage';
import {
    ARMORED, REGENERATION, SHELL, SHIELD, advance, affixChapter, chip, clickMonster, health, hp, scene, startFight
} from './support/affixFight';

//  The affix chip (spec early-game-rebalance, Affix Display, Display AC 1 to 6 and Player-Facing Texts): its texts, its place at the top of the monster body, its style and
//  when it hides. The fight is the one of monsterAffixes.spec.js: a miniboss of 100 health with critical resistance 100, a loop that sleeps and time that moves with advance().
const setHealth = (page, value) => scene(page, `(s) => { s.monster.health = ${value}; s.updateHealthBar(); }`);

const TYPE_COLOUR = { SHELL: 'rgb(176, 122, 58)', HIT_SHIELD: 'rgb(90, 160, 216)', REGENERATION: 'rgb(79, 154, 60)', ARMORED: 'rgb(138, 154, 166)' };
//  The path of each type icon (spec Affix Display), read from the mask of the ::before
const TYPE_ICON = {
    SHELL: 'M12 2 21 7v10l-9 5-9-5V7z',
    HIT_SHIELD: "<circle cx='12' cy='12' r='9' fill='none' stroke='%23000' stroke-width='3'/><circle cx='12' cy='12' r='3'/>",
    REGENERATION: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
    ARMORED: 'M4 4h16v9c0 4-3.6 7.3-8 9-4.4-1.7-8-5-8-9z'
};

//  The boxes of the chip and of its host in the 1024 x 768 scene
const sceneBoxes = (page) => page.evaluate(() => {
    const canvas = document.querySelector('#game-container canvas').getBoundingClientRect();
    const toScene = (element) =>
    {
        const rect = element.getBoundingClientRect();

        return {
            left: ((rect.x - canvas.x) * 1024) / canvas.width, right: ((rect.x + rect.width - canvas.x) * 1024) / canvas.width,
            top: ((rect.y - canvas.y) * 768) / canvas.height, bottom: ((rect.y + rect.height - canvas.y) * 768) / canvas.height
        };
    };

    return { box: toScene(document.querySelector('.hud-affix')), chip: toScene(document.querySelector('[data-testid="affix-chip"]')) };
});

test.describe('The affix chip texts', () => {
    test('the Carapaça chip reads Carapaça: -6 por golpe with data-affix SHELL', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(6) }) });

        await expect(chip(page)).toHaveText('Carapaça: -6 por golpe');
        await expect(chip(page)).toHaveAttribute('data-affix', 'SHELL');
    });

    test('the Escudo chip reads 10/10, then 7/10 after 3 clicks, then volta em 6 s after the last charge, then volta em 1 s 5000 ms later', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(10) }) });

        await expect(chip(page)).toHaveText('Escudo de golpes: 10/10');
        await expect(chip(page)).toHaveAttribute('data-affix', 'HIT_SHIELD');

        await clickMonster(page, 3);
        await expect(chip(page)).toHaveText('Escudo de golpes: 7/10');

        await clickMonster(page, 7);
        await expect(chip(page)).toHaveText('Escudo de golpes: volta em 6 s');

        //  The seconds left are rounded up: 5900 ms still read 6 s, 900 ms read 1 s
        await advance(page, 100);
        await expect(chip(page)).toHaveText('Escudo de golpes: volta em 6 s');

        await advance(page, 4_900);
        await expect(chip(page)).toHaveText('Escudo de golpes: volta em 1 s');

        await advance(page, 1_000);
        await expect(chip(page)).toHaveText('Escudo de golpes: 10/10');
    });

    test('the Regeneração chips read 0,5% da vida/s for 50 and 0,25% da vida/s for 25', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        await startFight(page, { definition: affixChapter({ affix: REGENERATION(50) }) });

        await expect(chip(page)).toHaveText('Regeneração: 0,5% da vida/s');
        await expect(chip(page)).toHaveAttribute('data-affix', 'REGENERATION');

        //  The chapter boss of stage 1
        const context = await browser.newContext();
        const other = await context.newPage();

        await startFight(other, {
            definition: affixChapter({ bossAffix: REGENERATION(25) }), progress: { chapter: 1, stage: 1, encounter: 'CHAPTER_BOSS', phase: 1 }
        });

        await expect(chip(other)).toHaveText('Regeneração: 0,25% da vida/s');
        await expect(chip(other)).toHaveAttribute('data-affix', 'REGENERATION');
        await context.close();
    });

    test('the Blindado chip reads Blindado: +20 de defesa', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: ARMORED(20) }) });

        await expect(chip(page)).toHaveText('Blindado: +20 de defesa');
        await expect(chip(page)).toHaveAttribute('data-affix', 'ARMORED');
    });

    test('a Carapaça of 1200 reads Carapaça: -1.2K por golpe', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(1200), minibossHealth: 100_000 }) });

        await expect(chip(page)).toHaveText('Carapaça: -1.2K por golpe');
    });
});

test.describe('The affix chip place and style', () => {
    test('the chip is centred on x 670 and its box spans y 322 to 350 in scene px', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(6) }) });

        const { box, chip: placed } = await sceneBoxes(page);

        //  The 240 x 28 box of the host: x 550 to 790, y 322 to 350
        expect(box.left).toBeCloseTo(550, 0);
        expect(box.right).toBeCloseTo(790, 0);
        expect(box.top).toBeCloseTo(322, 0);
        expect(box.bottom).toBeCloseTo(350, 0);
        //  The chip sits in the middle of it
        expect((placed.left + placed.right) / 2).toBeCloseTo(670, 0);
        expect(placed.top).toBeGreaterThanOrEqual(box.top - 0.5);
        expect(placed.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
        expect(placed.right - placed.left).toBeGreaterThan(100);
    });

    test('the host is a 240 x 28 hud-box that lets a click through', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(6) }) });

        const host = page.locator('.hud-affix');

        await expect(host).toHaveClass(/hud-box/);
        await expect(host).toHaveCSS('width', '240px');
        await expect(host).toHaveCSS('height', '28px');
        await expect(host).toHaveCSS('pointer-events', 'none');
    });

    test('the chip has the type colour border and the Grove chip style', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHELL(6) }) });

        //  What the tokens of the style resolve to
        const tokens = await page.evaluate(() => {
            const probe = document.createElement('div');

            probe.style.cssText = 'color: var(--parchment-100); background-color: var(--chip-bg); font-family: var(--font-body)';
            document.body.append(probe);

            const style = getComputedStyle(probe);
            const resolved = { color: style.color, background: style.backgroundColor, fontFamily: style.fontFamily };

            probe.remove();

            return resolved;
        });

        await expect(chip(page)).toHaveCSS('font-size', '12px');
        await expect(chip(page)).toHaveCSS('font-weight', '700');
        await expect(chip(page)).toHaveCSS('color', tokens.color);
        await expect(chip(page)).toHaveCSS('background-color', tokens.background);
        await expect(chip(page)).toHaveCSS('font-family', tokens.fontFamily);
        expect(tokens.fontFamily).toContain('Figtree');
        await expect(chip(page)).toHaveCSS('border-top-width', '1px');
        await expect(chip(page)).toHaveCSS('border-top-style', 'solid');
        await expect(chip(page)).toHaveCSS('border-radius', '999px');
        await expect(chip(page)).toHaveCSS('padding', '3px 10px 3px 8px');
        //  The chip is declared inline-flex; as the item of the flex host its computed display is blockified to flex, and inline-flex shows once the host is a block
        await expect(chip(page)).toHaveCSS('display', 'flex');
        await page.locator('.hud-affix').evaluate((node) => { node.style.display = 'block'; });
        await expect(chip(page)).toHaveCSS('display', 'inline-flex');
        await page.locator('.hud-affix').evaluate((node) => { node.style.display = ''; });
        await expect(chip(page)).toHaveCSS('align-items', 'center');
        await expect(chip(page)).toHaveCSS('column-gap', '5px');
        await expect(chip(page)).toHaveCSS('white-space', 'pre');

        //  The border colour and the icon of each type: the style follows `data-affix`, so each is read by setting it on the chip of this fight (the real attribute of each type is
        //  asserted by the text tests above)
        for (const [ type, colour ] of Object.entries(TYPE_COLOUR))
        {
            await chip(page).evaluate((node, value) => node.setAttribute('data-affix', value), type);

            await expect(chip(page)).toHaveCSS('border-top-color', colour);

            const icon = await chip(page).evaluate((node) =>
            {
                const style = getComputedStyle(node, '::before');

                return { width: style.width, height: style.height, background: style.backgroundColor, mask: style.maskImage || style.webkitMaskImage };
            });

            expect(icon).toMatchObject({ width: '12px', height: '12px', background: colour });
            expect(decodeURIComponent(icon.mask)).toContain(decodeURIComponent(TYPE_ICON[type]));
        }
    });
});

test.describe('The affix chip hides', () => {
    test('the chip is hidden in a fight without affix and on a phase monster', async ({ page, browser }) => {
        //  Two games boot in this scenario
        test.setTimeout(120_000);

        //  A phase monster of a stage whose miniboss has an affix
        await startFight(page, { definition: affixChapter({ affix: SHELL(6) }), progress: { chapter: 1, stage: 1, encounter: 'PHASE', phase: 1 } });

        await expect(hp(page)).toHaveText('HP 10/10');
        await expect(chip(page)).toHaveText('');
        await expect(chip(page)).toHaveAttribute('data-affix', '');
        await expect(chip(page)).toHaveCSS('display', 'none');
        await expect(chip(page)).toBeHidden();

        //  A miniboss with no affix
        const context = await browser.newContext();
        const other = await context.newPage();

        await startFight(other, { definition: affixChapter({ affix: null }) });

        await expect(hp(other)).toHaveText('HP 100/100');
        await expect(chip(other)).toHaveText('');
        await expect(chip(other)).toHaveAttribute('data-affix', '');
        await expect(chip(other)).toHaveCSS('display', 'none');
        await expect(chip(other)).toBeHidden();
        await context.close();
    });

    test('the chip empties when the affix miniboss dies', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: REGENERATION(50) }) });
        await expect(chip(page)).toHaveText('Regeneração: 0,5% da vida/s');

        await setHealth(page, 1);
        await clickMonster(page);

        expect(await health(page)).toBe(0);
        await expect(chip(page)).toHaveText('');
        await expect(chip(page)).toHaveAttribute('data-affix', '');
        await expect(chip(page)).toBeHidden();
    });

    test('the chip empties when the countdown fails the fight', async ({ page }) => {
        await startFight(page, { definition: affixChapter({ affix: SHIELD(10), minibossTimeLimitMs: 30_000 }) });
        await expect(chip(page)).toHaveText('Escudo de golpes: 10/10');

        await advance(page, 30_000);

        await expect(chip(page)).toHaveText('');
        await expect(chip(page)).toHaveAttribute('data-affix', '');
        await expect(chip(page)).toBeHidden();
    });

    test('a click on the chip hits the monster', async ({ page }) => {
        //  A real mouse click needs the real loop: Carapaça 1 and a flat 1 make a click of 2 take 1
        await startFight(page, { definition: affixChapter({ affix: SHELL(1) }), talents: { CLICK_FLAT_DAMAGE: 1 }, stop: false });
        await expect(chip(page)).toHaveText('Carapaça: -1 por golpe');

        const box = await chip(page).boundingBox();

        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

        await expect.poll(() => health(page)).toBe(99);
    });
});
