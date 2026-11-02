import { expect, test } from './support/coverage';
import { mockBackend } from './support/fakeBackend';
import { activeSceneKeys, fillCredentials, openMainMenu } from './support/game';

const piece = (id, slot, rarity, refine = 0, heroId = null) => ({
    id, slot, rarity, refine, ...(slot === 'WEAPON' && { baseClick: 3 }), affixes: [ { type: 'CLICK_DAMAGE_PCT', base: 7 } ], heroId
});

//  Kael wears a rare weapon and a common ring, Lyra an uncommon ring; the bag holds an epic amulet +3, a legendary armor, a common amulet
//  and an uncommon ring (Mochila (4))
const PIECES = [
    piece('w1', 'WEAPON', 'RARE', 0, 'kael'), piece('r1', 'RING', 'COMMON', 0, 'kael'), piece('r2', 'RING', 'UNCOMMON', 0, 'lyra'),
    piece('a1', 'AMULET', 'EPIC', 3), piece('m1', 'ARMOR', 'LEGENDARY', 0), piece('c1', 'AMULET', 'COMMON', 0), piece('u1', 'RING', 'UNCOMMON', 0)
];
const TWO = { 'kael:0': 1, 'lyra:0': 1 };
const ALL_FIVE = { 'kael:0': 1, 'lyra:0': 1, 'orina:0': 1, 'seraphine:0': 1, 'vex:0': 1 };
const equipCalls = (calls) => calls.filter(({ method, path }) => method === 'POST' && /^\/equipment\/[^/]+\/equip$/.test(path));

//  Starts with the owned heroes of `copies` and the bag `equipment`; returns the recorded requests of the fake backend
const startGame = async (page, { equipment = PIECES, copies = TWO } = {}) =>
{
    const { calls } = await mockBackend(page, { users: { yan: 'secret123' }, cards: { yan: { copies } }, equipment: { yan: equipment } });

    const menu = await openMainMenu(page);

    await fillCredentials(menu, 'yan', 'secret123');
    await menu.loginButton.click();
    await expect(menu.message).toHaveText('Welcome back, yan!');
    await menu.canvas.click();
    await expect.poll(() => activeSceneKeys(page)).toContain('ClickerGame');
    await expect(page.getByTestId('hud-equipment')).toBeVisible();

    return calls;
};

const openEquipment = async (page) =>
{
    await page.getByTestId('hud-equipment').click();
    await expect(page.getByTestId('equipment-list')).toBeVisible();
};

//  A drop sends its request in the same task as the release; this wait lets a request in flight reach the fake backend before a
//  count of zero requests is trusted
const settle = (page) => page.waitForTimeout(300);

const centre = async (locator) =>
{
    const box = await locator.boundingBox();

    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

//  A mouse drag from the centre of `from` to `to` (a locator or a point); `release: false` leaves the button down
const drag = async (page, from, to, { release = true } = {}) =>
{
    const start = await centre(from);
    const end = typeof to.boundingBox === 'function' ? await centre(to) : to;

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });

    if (release)
    {
        await page.mouse.up();
    }
};

//  A real touch sequence through the Chrome DevTools Protocol: the browser makes the pointer events and applies touch-action
const touchDrag = async (page, from, to) =>
{
    const cdp = await page.context().newCDPSession(page);
    const start = await centre(from);
    const end = await centre(to);

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: start.x, y: start.y } ] });

    for (let step = 1; step <= 8; step++)
    {
        const x = start.x + (end.x - start.x) * step / 8;
        const y = start.y + (end.y - start.y) * step / 8;

        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x, y } ] });
    }

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};

test.describe('Drag to equip', () => {
    test('drops a bag piece on a hero and equips it without opening the piece', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (3)');
        await expect(page.getByTestId('equip-piece-a1')).toHaveCount(0);
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);

        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].path).toBe('/equipment/a1/equip');
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });

    test('replaces the piece the hero wore in that slot', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-u1'), page.getByTestId('equip-hero-kael'));

        await expect(page.getByTestId('equip-slot-kael-RING')).toHaveAttribute('aria-label', 'Incomum Anel +0');
        await expect(page.getByTestId('equip-piece-r1')).toBeVisible();
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (4)');

        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'kael' });
    });

    test('moves a worn piece from one hero to another', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-slot-kael-WEAPON'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-slot-lyra-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
        await expect(page.getByTestId('equip-slot-kael-WEAPON').locator('.piece-empty')).toHaveText('vazio');

        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });

    test('shows the dragged piece and lights the hero under the pointer', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'), { release: false });

        await expect(page.getByTestId('piece-drag-ghost')).toBeVisible();
        await expect(page.getByTestId('equip-piece-a1')).toHaveClass(/is-dragging/);
        await expect(page.getByTestId('equip-piece-a1')).toHaveCSS('opacity', '0.4');
        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);
        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveClass(/is-drop-slot/);
        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveCSS('opacity', '1');
        await expect(page.getByTestId('equip-hero-kael')).not.toHaveClass(/is-drop-target/);
        await expect(page.locator('.piece-tooltip:visible')).toHaveCount(0);

        const kael = await centre(page.getByTestId('equip-hero-kael'));

        await page.mouse.move(kael.x, kael.y, { steps: 4 });

        await expect(page.getByTestId('equip-hero-kael')).toHaveClass(/is-drop-target/);
        await expect(page.getByTestId('equip-hero-lyra')).not.toHaveClass(/is-drop-target/);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCSS('opacity', '1');

        const bagPiece = await centre(page.getByTestId('equip-piece-m1'));

        await page.mouse.move(bagPiece.x, bagPiece.y, { steps: 4 });

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCSS('opacity', '0.6');
        await expect(page.locator('.is-drop-target')).toHaveCount(0);
        await expect(page.locator('.is-drop-slot')).toHaveCount(0);
        await expect(page.locator('.piece-tooltip:visible')).toHaveCount(0);

        await page.mouse.up();

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
        await expect(page.getByTestId('equip-piece-a1')).not.toHaveClass(/is-dragging/);

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
    });

    test('the ghost follows the pointer, up and left of it', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), { x: 640, y: 360 }, { release: false });

        const box = await page.getByTestId('piece-drag-ghost').boundingBox();

        //  Its bottom-right corner sits 12 px up and left of the pointer, so the slot under the pointer stays visible
        expect(Math.abs(box.x + box.width - 628)).toBeLessThanOrEqual(2);
        expect(Math.abs(box.y + box.height - 348)).toBeLessThanOrEqual(2);

        await page.mouse.up();
    });

    test('the ghost is the tile on screen, lifted by 1.1', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        const tile = await page.getByTestId('equip-piece-a1').boundingBox();

        //  The 1024x768 game fits the 1280x720 viewport at 0.9375, so the 60 px tile is 56.25 px on screen; a copy at layout size would be 66 px
        expect(tile.width).toBeLessThan(59);

        await drag(page, page.getByTestId('equip-piece-a1'), { x: 640, y: 360 }, { release: false });

        const box = await page.getByTestId('piece-drag-ghost').boundingBox();

        expect(Math.abs(box.width - tile.width * 1.1)).toBeLessThanOrEqual(1);
        expect(Math.abs(box.height - tile.height * 1.1)).toBeLessThanOrEqual(1);

        await page.mouse.up();
    });

    test('releasing over the bag sends nothing and opens nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-piece-m1'));

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
        await expect(page.getByTestId('equip-piece-a1')).toBeVisible();
        await expect(page.locator('.equip-bag-title')).toHaveText('Mochila (4)');
    });

    test('releasing over the attribute panel sends nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('leader-stats'));

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
    });

    test('releasing outside the window sends nothing and keeps it open', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        //  x 20 is the letterbox left of the 960 px game: outside the window and outside every hero block
        await drag(page, page.getByTestId('equip-piece-a1'), { x: 20, y: 360 });

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equipment-list')).toBeVisible();
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
    });

    test('releasing on the hero who wears the piece sends nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-slot-kael-WEAPON'), page.getByTestId('equip-hero-kael').locator('.equip-hero-name'), { release: false });

        await expect(page.getByTestId('equip-hero-kael')).not.toHaveClass(/is-drop-target/);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCSS('opacity', '0.6');

        await page.mouse.up();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
    });

    test('a short press still opens the piece', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        const tile = await centre(page.getByTestId('equip-piece-a1'));

        await page.mouse.move(tile.x, tile.y);
        await page.mouse.down();
        await page.mouse.move(tile.x + 3, tile.y);
        await page.mouse.up();

        await expect(page.getByTestId('piece-detail')).toBeVisible();
        await expect(page.getByTestId('piece-worn')).toHaveText('Na mochila');
    });

    test('draggable tiles do not scroll on touch', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await expect(page.getByTestId('equip-piece-a1')).toHaveCSS('touch-action', 'none');
        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toHaveCSS('touch-action', 'none');
        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveCSS('touch-action', 'auto');
    });

    test('a refused equip shows the error and keeps the piece in the bag', async ({ page }) => {
        await startGame(page);
        await page.route('**/api/equipment/a1/equip', (route) => route.fulfill({ status: 500, json: { detail: 'down' } }));
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'));

        await expect(page.locator('.hero-error')).toHaveText('Não foi possível concluir a ação.');
        await expect(page.getByTestId('equip-piece-a1')).toBeVisible();
        await expect(page.getByTestId('equip-slot-lyra-AMULET').locator('.piece-empty')).toHaveText('vazio');
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
    });

    test('Equipar em still equips from the piece detail', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await page.getByTestId('equip-piece-a1').click();
        await page.getByTestId('piece-equip-lyra').click();

        await expect(page.getByTestId('piece-worn')).toHaveText('Equipado em Lyra Folhaveloz');
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });

    test('no drag in selection mode', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await page.getByTestId('bulk-sell-start').click();

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'), { release: false });

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);

        await page.mouse.up();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equip-piece-a1')).toHaveAttribute('aria-pressed', 'false');

        await page.getByTestId('equip-piece-a1').click();

        await expect(page.getByTestId('equip-piece-a1')).toHaveAttribute('aria-pressed', 'true');
    });

    test('a drop on the leader updates the attribute panel', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 4.6');

        await drag(page, page.getByTestId('equip-slot-kael-WEAPON'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-slot-lyra-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 1.1');

        await drag(page, page.getByTestId('equip-slot-lyra-WEAPON'), page.getByTestId('equip-hero-kael'));

        await expect(page.getByTestId('equip-slot-kael-WEAPON')).toHaveAttribute('aria-label', 'Raro Arma +0');
        await expect(page.getByTestId('leader-stats').locator('.leader-stats-title')).toHaveText('Atributos de Kael Raizférrea');
        await expect(page.getByTestId('stat-clickDamage')).toHaveText('Dano de clique: 4.6');
    });

    test('while the equip runs every button is disabled and no new drag starts', async ({ page }) => {
        const calls = await startGame(page);
        let answer;
        const held = new Promise((resolve) => { answer = resolve; });

        //  Holds the equip of a1 until the test lets it go, then hands it to the fake backend
        await page.route('**/api/equipment/a1/equip', async (route) => {
            await held;
            await route.fallback();
        });
        await openEquipment(page);

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-piece-c1')).toBeDisabled();
        await expect(page.locator('.hero-body button:enabled')).toHaveCount(0);

        await drag(page, page.getByTestId('equip-piece-c1'), page.getByTestId('equip-hero-lyra'), { release: false });

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);

        await page.mouse.up();
        answer();

        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        await expect(page.getByTestId('equip-piece-c1')).toBeEnabled();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].path).toBe('/equipment/a1/equip');
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });

    test('a pointercancel ends the drag and sends nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        //  Keeps the pointerId of the press, so the cancel below is the one the browser would send for it
        await page.evaluate(() => {
            document.addEventListener('pointerdown', (event) => { window.__pressId = event.pointerId; }, { capture: true });
        });

        await drag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'), { release: false });

        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);

        //  No mouse gesture makes Chromium cancel a pointer, so the test sends the event the browser sends when it takes the gesture
        await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointercancel', {
            bubbles: true, pointerId: window.__pressId, isPrimary: true, pointerType: 'mouse'
        })));

        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
        await expect(page.locator('.is-drop-target')).toHaveCount(0);
        await expect(page.getByTestId('equip-piece-a1')).not.toHaveClass(/is-dragging/);

        //  The button comes up over Lyra: after the cancel this is no drop
        await page.mouse.up();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equip-slot-lyra-AMULET').locator('.piece-empty')).toHaveText('vazio');
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
    });

    test('the click after a drag released on its own tile opens nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        const tile = await centre(page.getByTestId('equip-piece-a1'));

        //  Press and release on the same tile: the browser clicks that tile, so only the swallow keeps the piece detail closed
        await page.mouse.move(tile.x, tile.y);
        await page.mouse.down();
        await page.mouse.move(tile.x + 30, tile.y, { steps: 4 });

        await expect(page.getByTestId('piece-drag-ghost')).toBeVisible();

        await page.mouse.move(tile.x, tile.y, { steps: 4 });
        await page.mouse.up();

        await settle(page);
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
        expect(equipCalls(calls)).toHaveLength(0);

        await page.getByTestId('equip-piece-a1').click();

        await expect(page.getByTestId('piece-detail')).toBeVisible();
    });

    test('the right and the middle button start no drag', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        const tile = await centre(page.getByTestId('equip-piece-a1'));
        const lyra = await centre(page.getByTestId('equip-hero-lyra'));

        for (const button of [ 'right', 'middle' ])
        {
            await page.mouse.move(tile.x, tile.y);
            await page.mouse.down({ button });
            await page.mouse.move(lyra.x, lyra.y, { steps: 8 });

            await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
            await expect(page.getByTestId('equip-hero-lyra')).not.toHaveClass(/is-drop-target/);

            await page.mouse.up({ button });
        }

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('equip-piece-a1')).toBeVisible();
    });
});

test.describe('Drag to equip by touch', () => {
    test.use({ hasTouch: true });

    test('drags a piece with a finger', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await touchDrag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-hero-lyra'));

        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });

    test('a finger released over the bag sends nothing', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        await touchDrag(page, page.getByTestId('equip-piece-a1'), page.getByTestId('equip-piece-m1'));

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(0);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(0);
        await expect(page.getByTestId('piece-detail')).toHaveCount(0);
    });

    test('a tap still opens the piece', async ({ page }) => {
        await startGame(page);
        await openEquipment(page);

        const tile = await centre(page.getByTestId('equip-piece-a1'));

        await page.touchscreen.tap(tile.x, tile.y);

        await expect(page.getByTestId('piece-detail')).toBeVisible();
    });

    test('a second finger is ignored while a piece is dragged', async ({ page }) => {
        const calls = await startGame(page);
        await openEquipment(page);

        //  Records the pointerId of every press, to prove the browser saw two fingers
        await page.evaluate(() => {
            window.__downs = [];
            document.addEventListener('pointerdown', (event) => { window.__downs.push(event.pointerId); }, { capture: true });
        });

        const cdp = await page.context().newCDPSession(page);
        const start = await centre(page.getByTestId('equip-piece-a1'));
        const lyra = await centre(page.getByTestId('equip-hero-lyra'));
        const second = await centre(page.getByTestId('equip-piece-c1'));

        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: start.x, y: start.y, id: 0 } ] });

        for (let step = 1; step <= 8; step++)
        {
            const x = start.x + (lyra.x - start.x) * step / 8;
            const y = start.y + (lyra.y - start.y) * step / 8;

            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x, y, id: 0 } ] });
        }

        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);

        //  The first finger holds a1 over Lyra; a second finger goes down on c1 and slides 30 px
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [ { x: lyra.x, y: lyra.y, id: 0 }, { x: second.x, y: second.y, id: 1 } ] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [ { x: lyra.x, y: lyra.y, id: 0 }, { x: second.x + 30, y: second.y, id: 1 } ] });

        expect(await page.evaluate(() => new Set(window.__downs).size)).toBe(2);
        await expect(page.getByTestId('piece-drag-ghost')).toHaveCount(1);
        await expect(page.getByTestId('equip-piece-c1')).not.toHaveClass(/is-dragging/);
        await expect(page.getByTestId('equip-hero-lyra')).toHaveClass(/is-drop-target/);

        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

        await expect(page.getByTestId('equip-slot-lyra-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        await expect(page.getByTestId('equip-piece-c1')).toBeVisible();

        await settle(page);
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].path).toBe('/equipment/a1/equip');
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'lyra' });
    });
});

test.describe('Drag to equip edge scroll', () => {
    test('scrolls the window while a piece is held near its top edge', async ({ page }) => {
        const calls = await startGame(page, { copies: ALL_FIVE });
        await openEquipment(page);

        const win = page.locator('.hero-window');

        expect(await win.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);

        await win.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        await page.getByTestId('equip-piece-a1').scrollIntoViewIfNeeded();

        const box = await win.boundingBox();

        await drag(page, page.getByTestId('equip-piece-a1'), { x: box.x + box.width / 2, y: box.y + 10 }, { release: false });

        await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBe(0);

        const kael = await centre(page.getByTestId('equip-hero-kael'));

        await page.mouse.move(kael.x, kael.y, { steps: 4 });
        await page.mouse.up();

        await expect(page.getByTestId('equip-slot-kael-AMULET')).toHaveAttribute('aria-label', 'Épico Amuleto +3');
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId: 'kael' });
    });

    test('stops scrolling when the piece leaves the edge', async ({ page }) => {
        await startGame(page, { copies: ALL_FIVE });
        await openEquipment(page);

        const win = page.locator('.hero-window');

        await win.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        await page.getByTestId('equip-piece-a1').scrollIntoViewIfNeeded();

        const start = await win.evaluate((node) => node.scrollTop);
        const box = await win.boundingBox();

        await drag(page, page.getByTestId('equip-piece-a1'), { x: box.x + box.width / 2, y: box.y + 10 }, { release: false });

        await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBeLessThan(start);

        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });

        const held = await win.evaluate((node) => node.scrollTop);

        await page.waitForTimeout(300);

        expect(await win.evaluate((node) => node.scrollTop)).toBe(held);

        await page.mouse.up();
    });

    test('scrolls the window down while a piece is held near its bottom edge', async ({ page }) => {
        const calls = await startGame(page, { copies: ALL_FIVE });
        await openEquipment(page);

        const win = page.locator('.hero-window');
        const end = await win.evaluate((node) => node.scrollHeight - node.clientHeight);

        expect(end).toBeGreaterThan(0);
        expect(await win.evaluate((node) => node.scrollTop)).toBe(0);

        const box = await win.boundingBox();

        await drag(page, page.getByTestId('equip-slot-kael-WEAPON'), { x: box.x + box.width / 2, y: box.y + box.height - 10 }, { release: false });

        await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBeGreaterThanOrEqual(end - 1);

        const last = page.locator('.equip-hero').last();
        const heroId = await last.getAttribute('data-drop-hero');
        const target = await centre(last);

        expect(heroId).not.toBe('kael');

        await page.mouse.move(target.x, target.y, { steps: 4 });
        await page.mouse.up();

        await expect(page.getByTestId(`equip-slot-${heroId}-WEAPON`)).toHaveAttribute('aria-label', 'Raro Arma +0');
        expect(equipCalls(calls)).toHaveLength(1);
        expect(equipCalls(calls)[0].body).toEqual({ heroId });
    });

    test('the light follows the block that scrolls under a still pointer', async ({ page }) => {
        await startGame(page, { copies: ALL_FIVE });
        await openEquipment(page);

        const win = page.locator('.hero-window');

        await win.evaluate((node) => { node.scrollTop = node.scrollHeight; });
        await page.getByTestId('equip-piece-a1').scrollIntoViewIfNeeded();

        const box = await win.boundingBox();
        const litHero = () => page.evaluate(() => document.querySelector('.is-drop-target')?.getAttribute('data-drop-hero') ?? null);

        //  30 px below the top edge is inside the band: the window scrolls up under the pointer, which does not move again
        await drag(page, page.getByTestId('equip-piece-a1'), { x: box.x + box.width / 2, y: box.y + 30 }, { release: false });

        const first = await litHero();

        await expect.poll(litHero).not.toBe(first);
        await expect.poll(() => win.evaluate((node) => node.scrollTop)).toBe(0);

        //  Released in the letterbox, outside every block: no drop
        await page.mouse.move(20, 360, { steps: 4 });
        await page.mouse.up();
    });
});
