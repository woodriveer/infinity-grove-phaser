import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

//  The Ranking screen in the browser (spec rankings, Ranking screen AC 1 to 8, Rows and formats AC 1 to 7, Loading and failure AC 1 to 4).
//  The fake backend answers GET /rankings/<board> and POST /rankings/click-power like RankingController.

const BOSS = { name: 'Caçada Relâmpago', subtitle: 'O menor tempo para derrotar o chefe de cada capítulo, contado desde a vitória sobre o último miniboss.' };
const STORY = { name: 'Travessia do Bosque', subtitle: 'O menor tempo para concluir a história, do início da jornada (ou do último reset) até a vitória sobre o chefe do capítulo 15.' };
const POWER = { name: 'Fúria da Aliança', subtitle: 'O maior Dano de clique somado ao Dano da equipe por clique que você já alcançou.' };
const FORTUNE = { name: 'Tesouro do Bosque', subtitle: 'A maior fortuna em moedas que você já teve guardada de uma vez.' };

const pad = (value) => String(value).padStart(2, '0');

//  n entries { position, username: 'p01'.., value: value(position) }
const entries = (n, value) => Array.from({ length: n }, (_, index) => ({ position: index + 1, username: `p${pad(index + 1)}`, value: value(index + 1) }));

const startGame = async (page, { chapter = 4, completed = false, ...options } = {}) => {
    //  A completed campaign stands on the chapter 15 boss, as the backend stores it
    const position = completed ? { chapter, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1, completed } : { chapter };
    const backend = await mockBackend(page, { users: { yan: 'secret123' }, progress: { yan: position }, ...options });
    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Bem-vindo de volta, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-rankings')).toBeVisible();

    return backend;
};

const openRanking = async (page) => {
    await page.getByTestId('hud-rankings').click();
    await expect(page.getByTestId('ranking-screen')).toBeVisible();
};

const row = (page, position) => page.getByTestId(`ranking-row-${position}`);

//  The last GET of /rankings received, { path, chapter }
const lastGet = (backend) => () => {
    const gets = backend.rankingCalls().filter((call) => call.method === 'GET');

    return gets.length ? { path: gets.at(-1).path, chapter: gets.at(-1).chapter } : null;
};

test.describe('Rankings', () => {
    test('the rail shows Ranking as its seventh button', async ({ page }) => {
        await startGame(page);

        expect(await page.locator('.hero-hud button[data-testid^="hud-"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid)))
            .toEqual([ 'hud-heroes', 'hud-bag', 'hud-team', 'hud-equipment', 'hud-talents', 'hud-farm', 'hud-rankings' ]);
        await expect(page.getByTestId('hud-rankings')).toHaveText('Ranking');
    });

    test('opening Ranking records the click power, then shows the boss board of the campaign chapter', async ({ page }) => {
        const backend = await startGame(page, { chapter: 4 });

        await openRanking(page);

        await expect.poll(() => backend.rankingCalls()).toEqual([
            { method: 'POST', path: '/rankings/click-power', chapter: null },
            { method: 'GET', path: '/rankings/boss-time', chapter: 4 }
        ]);
        await expect(page.locator('.hero-title')).toHaveText('Ranking');
        await expect(page.getByTestId('ranking-tab-boss-time')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('ranking-name')).toHaveText(BOSS.name);
        await expect(page.getByTestId('ranking-subtitle')).toHaveText(BOSS.subtitle);
        await expect(page.getByTestId('ranking-chapter-4')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('ranking-chapter-4')).toHaveClass(/is-current/);
    });

    test('a completed campaign opens the chapter 15 board', async ({ page }) => {
        const backend = await startGame(page, { chapter: 15, completed: true });

        await openRanking(page);

        await expect.poll(lastGet(backend)).toEqual({ path: '/rankings/boss-time', chapter: 15 });
        await expect(page.getByTestId('ranking-chapter-15')).toHaveAttribute('aria-pressed', 'true');
    });

    test('the four tabs read the four names in order and each shows its own subtitle', async ({ page }) => {
        const backend = await startGame(page);

        await openRanking(page);
        await expect(page.locator('.ranking-tab')).toHaveText([ BOSS.name, STORY.name, POWER.name, FORTUNE.name ]);
        await expect(page.getByTestId('ranking-tabs')).toHaveAttribute('aria-label', 'Escolher ranking');

        for (const [ id, board ] of [ [ 'story-time', STORY ], [ 'click-power', POWER ], [ 'fortune', FORTUNE ] ]) {
            await page.getByTestId(`ranking-tab-${id}`).click();

            await expect.poll(lastGet(backend)).toEqual({ path: `/rankings/${id}`, chapter: null });
            await expect(page.getByTestId(`ranking-tab-${id}`)).toHaveAttribute('aria-pressed', 'true');
            await expect(page.getByTestId('ranking-name')).toHaveText(board.name);
            await expect(page.getByTestId('ranking-subtitle')).toHaveText(board.subtitle);
            await expect(page.getByTestId('ranking-chapters')).toHaveCount(0);
        }
    });

    test('a chapter chip loads that chapter', async ({ page }) => {
        const backend = await startGame(page, { chapter: 4 });

        await openRanking(page);
        await expect(page.getByTestId('ranking-chapters')).toContainText('Capítulo');
        await expect(page.locator('.ranking-chapters .farm-chapter')).toHaveCount(15);
        await page.getByTestId('ranking-chapter-7').click();

        await expect.poll(lastGet(backend)).toEqual({ path: '/rankings/boss-time', chapter: 7 });
        await expect(page.getByTestId('ranking-chapter-7')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('ranking-chapter-4')).toHaveClass(/is-current/);
        await expect(page.getByTestId('ranking-chapter-4')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('ranking-chapter-4')).toHaveAttribute('title', 'Capítulo atual');
        await expect(page.getByTestId('ranking-chapter-4')).toHaveAttribute('aria-label', 'Capítulo 4');
    });

    test('boss rows read position, nick and mm:ss.d', async ({ page }) => {
        await startGame(page, {
            rankings: { 'boss-time:4': { entries: [
                { position: 1, username: 'ana', value: 1000 },
                { position: 2, username: 'bob', value: 12345 },
                { position: 3, username: 'cid', value: 3600000 }
            ], me: null } }
        });

        await openRanking(page);

        await expect(page.locator('.ranking-head span')).toHaveText([ 'Posição', 'Jogador', 'Tempo' ]);
        await expect(page.locator('.ranking-row')).toHaveCount(3);

        for (const [ position, name, value ] of [ [ 1, 'ana', '00:01.0' ], [ 2, 'bob', '00:12.3' ], [ 3, 'cid', '01:00:00.0' ] ]) {
            await expect(row(page, position).locator('.ranking-position')).toHaveText(`${position}º`);
            await expect(row(page, position).locator('.ranking-player-name')).toHaveText(name);
            await expect(row(page, position).locator('.ranking-value')).toHaveText(value);
        }
    });

    test('story rows read mm:ss and hh:mm:ss', async ({ page }) => {
        await startGame(page, {
            rankings: { 'story-time': { entries: [ { position: 1, username: 'ana', value: 1365000 }, { position: 2, username: 'bob', value: 7384000 } ], me: null } }
        });

        await openRanking(page);
        await page.getByTestId('ranking-tab-story-time').click();

        await expect(row(page, 1).locator('.ranking-value')).toHaveText('22:45');
        await expect(row(page, 2).locator('.ranking-value')).toHaveText('02:03:04');
        await expect(page.locator('.ranking-head span')).toHaveText([ 'Posição', 'Jogador', 'Tempo' ]);
    });

    test('power rows read damage numbers', async ({ page }) => {
        await startGame(page, {
            rankings: { 'click-power': { entries: [ { position: 1, username: 'ana', value: 16.5 }, { position: 2, username: 'bob', value: 12500 } ], me: null } }
        });

        await openRanking(page);
        await page.getByTestId('ranking-tab-click-power').click();

        await expect(row(page, 1).locator('.ranking-value')).toHaveText('16.5');
        await expect(row(page, 2).locator('.ranking-value')).toHaveText('12.5K');
        await expect(page.locator('.ranking-head span')).toHaveText([ 'Posição', 'Jogador', 'Dano por clique' ]);
    });

    test('fortune rows read gold, silver and copper coins', async ({ page }) => {
        await startGame(page, {
            rankings: { fortune: { entries: [ { position: 1, username: 'ana', value: 1234567 }, { position: 2, username: 'bob', value: 123456789 } ], me: null } }
        });

        await openRanking(page);
        await page.getByTestId('ranking-tab-fortune').click();

        await expect(page.locator('.ranking-head span')).toHaveText([ 'Posição', 'Jogador', 'Moedas' ]);
        await expect(row(page, 1).locator('.coin-gold')).toHaveText('123');
        await expect(row(page, 1).locator('.coin-silver')).toHaveText('45');
        await expect(row(page, 1).locator('.coin-copper')).toHaveText('67');
        await expect(row(page, 2).locator('.coin-gold')).toHaveText('12.3K');
        await expect(row(page, 2).locator('.coin-silver')).toHaveText('67');
        await expect(row(page, 2).locator('.coin-copper')).toHaveText('89');
        //  The assistive text before each disc, as the HUD wallet
        await expect(row(page, 1).locator('.ranking-value')).toHaveText('Ouro: 123Prata: 45Cobre: 67');
    });

    test('the top three positions sit on gold, silver and copper discs', async ({ page }) => {
        await startGame(page, { rankings: { 'boss-time:4': { entries: entries(4, (position) => position * 1000), me: null } } });

        await openRanking(page);

        await expect(row(page, 1).locator('.ranking-position')).toHaveClass(/is-gold/);
        await expect(row(page, 2).locator('.ranking-position')).toHaveClass(/is-silver/);
        await expect(row(page, 3).locator('.ranking-position')).toHaveClass(/is-copper/);
        await expect(row(page, 4).locator('.ranking-position')).not.toHaveClass(/is-(gold|silver|copper)/);
    });

    test('the own row inside the top 10 is highlighted with Você', async ({ page }) => {
        await startGame(page, {
            rankings: { 'boss-time:4': { entries: entries(10, (position) => position * 1000), me: { position: 3, username: 'p03', value: 3000 } } }
        });

        await openRanking(page);

        await expect(page.locator('.ranking-row')).toHaveCount(10);
        await expect(row(page, 3)).toHaveClass(/is-me/);
        await expect(row(page, 3).locator('.ranking-you')).toHaveText('Você');
        await expect(page.locator('.ranking-row.is-me')).toHaveCount(1);
        await expect(page.locator('.ranking-you')).toHaveCount(1);
        await expect(page.getByTestId('ranking-gap')).toHaveCount(0);
        await expect(page.getByTestId('ranking-none')).toHaveCount(0);
    });

    test('the own row at 10th stays in the list', async ({ page }) => {
        await startGame(page, {
            rankings: { 'boss-time:4': { entries: entries(10, (position) => position * 1000), me: { position: 10, username: 'p10', value: 10000 } } }
        });

        await openRanking(page);

        await expect(row(page, 10)).toHaveClass(/is-me/);
        await expect(page.getByTestId('ranking-gap')).toHaveCount(0);
        await expect(page.locator('.ranking-row')).toHaveCount(10);
    });

    test('the own row at 11th is pinned under the gap row', async ({ page }) => {
        await startGame(page, {
            rankings: { 'boss-time:4': { entries: entries(10, (position) => position * 1000), me: { position: 11, username: 'yan', value: 11000 } } }
        });

        await openRanking(page);

        await expect(page.locator('.ranking-row')).toHaveCount(11);
        await expect(page.getByTestId('ranking-gap')).toHaveText('⋯');
        //  The gap comes right after the tenth row and the own row right after the gap
        await expect(page.locator('.ranking-list > li').nth(10)).toHaveAttribute('data-testid', 'ranking-gap');
        await expect(page.locator('.ranking-list > li').nth(11)).toHaveAttribute('data-testid', 'ranking-row-11');
        await expect(row(page, 11)).toHaveClass(/is-me/);
        await expect(row(page, 11).locator('.ranking-position')).toHaveText('11º');
        await expect(row(page, 11).locator('.ranking-you')).toHaveText('Você');
        await expect(row(page, 11).locator('.ranking-value')).toHaveText('00:11.0');
        await expect(page.locator('.ranking-row.is-me')).toHaveCount(1);
    });

    test('the own row at 27th is pinned with its fortune', async ({ page }) => {
        await startGame(page, {
            rankings: { fortune: { entries: entries(10, (position) => 100000 - position), me: { position: 27, username: 'yan', value: 5 } } }
        });

        await openRanking(page);
        await page.getByTestId('ranking-tab-fortune').click();

        await expect(page.locator('.ranking-row')).toHaveCount(11);
        await expect(page.getByTestId('ranking-gap')).toHaveText('⋯');
        await expect(row(page, 27).locator('.ranking-position')).toHaveText('27º');
        await expect(row(page, 27).locator('.ranking-player-name')).toHaveText('yan');
        await expect(row(page, 27).locator('.coin-gold')).toHaveText('0');
        await expect(row(page, 27).locator('.coin-silver')).toHaveText('0');
        await expect(row(page, 27).locator('.coin-copper')).toHaveText('5');
    });

    test('a player without a record reads Você ainda não entrou neste ranking.', async ({ page }) => {
        await startGame(page, { rankings: { 'boss-time:4': { entries: entries(3, (position) => position * 1000), me: null } } });

        await openRanking(page);

        await expect(page.getByTestId('ranking-none')).toHaveText('Você ainda não entrou neste ranking.');
        await expect(page.locator('.ranking-row')).toHaveCount(3);
        await expect(page.locator('.ranking-row.is-me')).toHaveCount(0);
        await expect(page.getByTestId('ranking-gap')).toHaveCount(0);
    });

    test('an empty board reads Ninguém entrou neste ranking ainda. and shows no header', async ({ page }) => {
        await startGame(page);

        await openRanking(page);

        await expect(page.getByTestId('ranking-empty')).toHaveText('Ninguém entrou neste ranking ainda.');
        await expect(page.locator('.ranking-head')).toHaveCount(0);
        await expect(page.locator('.ranking-row')).toHaveCount(0);
    });

    test('a username is written as text and a long one ends in an ellipsis on one line', async ({ page }) => {
        const long = 'a'.repeat(255);

        await startGame(page, {
            rankings: { 'boss-time:4': { entries: [
                { position: 1, username: '<b>x</b>', value: 1000 },
                { position: 2, username: long, value: 2000 }
            ], me: null } }
        });

        await openRanking(page);

        await expect(row(page, 1).locator('.ranking-player-name')).toHaveText('<b>x</b>');
        await expect(row(page, 1).locator('b')).toHaveCount(0);

        const name = row(page, 2).locator('.ranking-player-name');

        await expect(name).toHaveAttribute('title', long);
        expect(await name.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
        await expect(name).toHaveCSS('text-overflow', 'ellipsis');
        await expect(name).toHaveCSS('white-space', 'nowrap');
        await expect(name).toHaveCSS('overflow', 'hidden');
        await expect(name).toHaveCSS('max-width', '360px');
        expect((await name.boundingBox()).width).toBeLessThanOrEqual(360);
        expect((await row(page, 2).boundingBox()).height).toBe((await row(page, 1).boundingBox()).height);
    });

    test('Carregando... shows while a tab loads and the tabs stay clickable', async ({ page }) => {
        const backend = await startGame(page, {
            rankings: { fortune: { entries: [ { position: 1, username: 'ana', value: 5 } ], me: null } }
        });

        await openRanking(page);

        const release = backend.holdRankings('fortune');

        await page.getByTestId('ranking-tab-fortune').click();

        await expect(page.getByTestId('ranking-loading')).toHaveText('Carregando...');
        await expect(page.locator('.ranking-row')).toHaveCount(0);
        await expect(page.getByTestId('ranking-tab-story-time')).toBeEnabled();
        await expect(page.getByTestId('ranking-tab-boss-time')).toBeEnabled();

        release();

        await expect(row(page, 1).locator('.ranking-player-name')).toHaveText('ana');
        await expect(page.getByTestId('ranking-loading')).toHaveCount(0);
    });

    test('the answer of a tab left before it arrived is ignored', async ({ page }) => {
        const backend = await startGame(page, {
            rankings: { 'story-time': { entries: [ { position: 1, username: 'late', value: 1365000 } ], me: null } }
        });

        await openRanking(page);

        const release = backend.holdRankings('story-time');

        await page.getByTestId('ranking-tab-story-time').click();
        await page.getByTestId('ranking-tab-fortune').click();
        await expect(page.getByTestId('ranking-name')).toHaveText(FORTUNE.name);
        await expect.poll(lastGet(backend)).toEqual({ path: '/rankings/fortune', chapter: null });

        release();

        //  The story answer lands after the fortune one: it has been requested and is held no more
        await expect.poll(() => backend.rankingCalls().filter((call) => call.path === '/rankings/story-time').length).toBe(1);
        await page.waitForTimeout(300);
        await expect(page.getByTestId('ranking-name')).toHaveText(FORTUNE.name);
        await expect(page.getByTestId('ranking-tab-fortune')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByText('late')).toHaveCount(0);
    });

    test('reopening the screen shows the board shown last', async ({ page }) => {
        const backend = await startGame(page);

        await openRanking(page);
        await page.getByTestId('ranking-tab-fortune').click();
        await expect(page.getByTestId('ranking-name')).toHaveText(FORTUNE.name);
        await page.getByTestId('hero-close').click();
        await expect(page.getByTestId('ranking-screen')).toHaveCount(0);

        await openRanking(page);

        await expect.poll(lastGet(backend)).toEqual({ path: '/rankings/fortune', chapter: null });
        await expect(page.getByTestId('ranking-tab-fortune')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('ranking-name')).toHaveText(FORTUNE.name);
    });

    test('a backend without rankings shows Não foi possível carregar.', async ({ page }) => {
        await startGame(page, { rankingsEndpoint: false });

        await page.getByTestId('hud-rankings').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível carregar.');
        await expect(page.locator('.hero-error')).toBeVisible();
        await expect(page.getByTestId('ranking-table')).toHaveCount(0);
        await expect(page.locator('.ranking-row')).toHaveCount(0);
    });

    test('a failed click power record still shows the board', async ({ page }) => {
        await startGame(page, {
            failClickPower: true,
            rankings: { 'boss-time:4': { entries: [ { position: 1, username: 'ana', value: 1000 } ], me: null } }
        });

        await openRanking(page);

        await expect(row(page, 1).locator('.ranking-player-name')).toHaveText('ana');
        await expect(page.locator('.hero-error')).toBeHidden();
    });

    test('a load that succeeds after a failed one hides the error line', async ({ page }) => {
        const backend = await startGame(page);

        await openRanking(page);
        backend.failNextRanking();
        await page.getByTestId('ranking-tab-fortune').click();

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível carregar.');
        await expect(page.locator('.hero-error')).toBeVisible();

        await page.getByTestId('ranking-tab-story-time').click();

        await expect(page.locator('.hero-error')).toBeHidden();
        await expect(page.getByTestId('ranking-name')).toHaveText(STORY.name);
    });
});
