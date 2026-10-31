import { expect, test } from '@playwright/test';
import { mockBackend } from '../e2e/support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from '../e2e/support/game';
import { shot } from './support/shots';

//  Screenshots of the hero-ascension review (.specs/features/hero-ascension/ui-review/). Everything runs on the fake backend, which
//  already supports cards up to 9 stars and the level of every skill; no route is stubbed here.
const bare = (element) => ({ element, physicalDefense: 0, magicalDefense: 0, critResistance: 0 });

const chapter = (monster) => ({
    bossHealth: 1000,
    bossTimeLimitMs: 60_000,
    boss: monster,
    stages: [ { number: 1, phasesPerStage: 5, monsterHealth: 1000, minibossHealth: 1000, minibossTimeLimitMs: 60_000, monster, miniboss: monster } ]
});

//  Console, page errors and failed requests of the whole run, printed at the end for the report
const watch = (page) => {
    const problems = [];

    page.on('console', (message) => {
        if ([ 'error', 'warning' ].includes(message.type())) {
            problems.push(`console.${message.type()}: ${message.text()}`);
        }
    });
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText}`));
    page.on('response', (response) => {
        if (response.status() >= 400) {
            problems.push(`http ${response.status()}: ${response.url()}`);
        }
    });

    return problems;
};

const report = (testInfo, label, problems) => console.log(`CONSOLE-REPORT ${label} (${testInfo.project.name}): ${problems.length ? problems.join(' | ') : 'clean'}`);

const startAs = async (page, copies) => {
    await mockBackend(page, { users: { yan: 'secret123' }, definition: chapter(bare('FIRE')), cards: { yan: { leader: 'kael', copies } } });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('leader-card')).toContainText('Kael');
    await page.waitForTimeout(500);
};

const styleOf = (locator, props) => locator.evaluate((node, names) => {
    const style = getComputedStyle(node);

    return Object.fromEntries(names.map((name) => [ name, style[name] ]));
}, props);

//  The other heroes of the catalog: 2, 4, 7 and 6 stars, so tiers brown / purple / gold show side by side
const OTHERS = { 'lyra:4': 1, 'orina:7': 1, 'seraphine:2': 1, 'vex:6': 1 };

//  Hero screens with Kael at 3, 5, 8 and 9 stars: catalog, detail, skill bar
[ 3, 5, 8, 9 ].forEach((stars, index) => {
    test(`kael ${stars} stars`, async ({ page }, testInfo) => {
        const problems = watch(page);
        const base = 10 * (index + 1);

        await startAs(page, { [`kael:${stars}`]: 1, ...OTHERS });

        await shot(page, testInfo, `${base + 1}-skill-bar-${stars}`);

        await page.getByTestId('hud-heroes').click();
        await expect(page.getByTestId('hero-card-kael')).toBeVisible();
        await page.mouse.move(0, 0);
        await shot(page, testInfo, `${base + 2}-catalog-${stars}`);

        await page.getByTestId('hero-card-kael').click();
        await expect(page.getByTestId('hero-star-power')).toBeVisible();
        await page.mouse.move(0, 0);
        await shot(page, testInfo, `${base + 3}-detail-${stars}`);

        if (stars === 9) {
            const probe = {
                levels: await Promise.all([ 1, 2, 3 ].map((slot) => page.getByTestId(`skill-row-${slot}`).locator('.skill-level').evaluate((node) => node.textContent))),
                starPowerWidth: await page.getByTestId('hero-star-power').evaluate((node) => ({ w: node.clientWidth, sw: node.scrollWidth, parent: node.parentElement.clientWidth }))
            };

            console.log(`PROBE nine (${testInfo.project.name}): ${JSON.stringify(probe)}`);
        }

        await page.getByTestId('hero-close').click();
        report(testInfo, `kael ${stars}`, problems);
    });
});

//  Computed styles of every reference value of T17, printed for the report (also shots of the 5-star leader's skill bar)
test('reference values', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, { 'kael:9': 1, 'lyra:4': 1, 'orina:7': 1, 'seraphine:2': 1, 'vex:5': 1, 'kael:3': 1 });
    await page.getByTestId('hud-heroes').click();
    await expect(page.getByTestId('hero-card-lyra')).toBeVisible();

    const out = {};
    const text = [ 'color', 'backgroundColor', 'fontWeight', 'fontSize', 'borderRadius', 'padding', 'boxShadow', 'display', 'width' ];

    out.lyra4 = await styleOf(page.getByTestId('hero-card-lyra').locator('.hero-stars'), text);
    out.orina7 = await styleOf(page.getByTestId('hero-card-orina').locator('.hero-stars'), text);
    out.vex5 = await styleOf(page.getByTestId('hero-card-vex').locator('.hero-stars'), text);
    out.seraphine2 = await styleOf(page.getByTestId('hero-card-seraphine').locator('.hero-stars'), text);
    out.panelBg = await styleOf(page.locator('.hero-window'), [ 'backgroundColor' ]);

    await page.getByTestId('hero-card-kael').click();
    for (const slot of [ 1, 2, 3 ]) {
        out[`row${slot}`] = await styleOf(page.getByTestId(`skill-row-${slot}`).locator('.skill-level'), [ ...text, 'marginLeft' ]);
    }
    out.starPower = await styleOf(page.getByTestId('hero-star-power'), [ 'color', 'fontSize', 'fontWeight' ]);
    await page.getByTestId('hero-close').click();

    for (const slot of [ 1, 2, 3 ]) {
        out[`badge${slot}`] = await styleOf(page.getByTestId(`skill-level-${slot}`), [ ...text, 'opacity', 'position', 'top', 'right', 'height', 'fontFamily' ]);
    }
    out.badgeBox = await page.getByTestId('skill-level-1').boundingBox();
    out.artBox = await page.getByTestId('skill-slot-1').locator('img').boundingBox();
    out.keyBox = await page.getByTestId('skill-key-1').boundingBox();
    out.slotBox = await page.getByTestId('skill-slot-1').boundingBox();

    console.log(`STYLES (${testInfo.project.name}): ${JSON.stringify(out)}`);
    report(testInfo, 'reference values', problems);
});

//  The bag with entries of 4 to 9 stars, and the detail of a 9-star entry (gold chip) and of a 4-star entry (purple)
test('bag', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, { 'kael:0': 2, 'kael:3': 1, 'kael:4': 1, 'kael:5': 2, 'kael:6': 1, 'kael:7': 1, 'kael:8': 3, 'kael:9': 1, 'lyra:4': 2 });
    await page.getByTestId('hud-bag').click();
    await expect(page.getByTestId('bag-entry-kael-9')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '51-bag');

    await page.getByTestId('bag-entry-kael-9').click();
    await expect(page.getByTestId('bag-entry-detail')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '52-bag-detail-9');
    await page.getByTestId('hero-back').click();

    await page.getByTestId('bag-entry-kael-4').click();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '53-bag-detail-4');
    await page.getByTestId('hero-back').click();

    await page.getByTestId('bag-entry-kael-8').click();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '54-bag-detail-8-can-fuse');

    const chip = await styleOf(page.getByTestId('bag-entry-detail').locator('.hero-stars'), [ 'color', 'backgroundColor', 'boxShadow', 'borderRadius', 'padding' ]);

    console.log(`BAGCHIP (${testInfo.project.name}): ${JSON.stringify(chip)}`);
    report(testInfo, 'bag', problems);
});

//  The fusion screen with rows past 3 stars, a selected row coming from the bag, a fusion result and a failed fusion
test('fusion', async ({ page }, testInfo) => {
    const problems = watch(page);

    await startAs(page, { 'kael:3': 3, 'kael:5': 4, 'kael:8': 3, 'lyra:6': 3, 'orina:0': 3 });
    await page.getByTestId('hud-fusion').click();
    await expect(page.getByTestId('fusion-row-kael-8')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '61-fusion-rows');

    await page.getByTestId('fusion-button-kael-3').hover();
    await shot(page, testInfo, '62-fusion-hover');
    await page.mouse.move(0, 0);

    await page.getByTestId('fusion-button-kael-8').click();
    await expect(page.getByTestId('fusion-result')).toBeVisible();
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '63-fusion-result-9');

    await page.getByTestId('fusion-button-lyra-6').click();
    await expect(page.getByTestId('fusion-result')).toContainText('Lyra');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '64-fusion-result-7');

    await page.getByTestId('fusion-button-kael-3').click();
    await expect(page.getByTestId('fusion-result')).toContainText('4★');
    await page.mouse.move(0, 0);
    await shot(page, testInfo, '65-fusion-result-4');

    console.log(`FUSIONTEXT (${testInfo.project.name}): ${await page.getByTestId('fusion-result').textContent()}`);
    report(testInfo, 'fusion', problems);
});
