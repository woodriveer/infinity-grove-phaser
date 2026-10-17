import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClickerGame } from './ClickerGame';
import { ApiError } from '../../application/ApiError';
import { createCampaignSession } from '../../application/campaign/campaignSession';
import { createWalletSync } from '../../application/wallet/walletSync';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

//  The real wallet service over a mocked backend gateway: these scene tests cover scene and service together
const walletApi = { get: vi.fn(), sync: vi.fn() };

//  The real campaign session over a mocked backend gateway, started on stage 1 phase 1 of a seeded-like chapter
const campaignGateway = { get: vi.fn(), report: vi.fn() };
const services = {
    createWalletSync: () => createWalletSync({ gateway: walletApi }),
    createCampaignSession: () => createCampaignSession({ gateway: campaignGateway })
};

const definition = {
    bossHealth: 300,
    bossTimeLimitMs: 60000,
    stages: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1, phasesPerStage: 5, monsterHealth: 10 + i, minibossHealth: 50 + 5 * i, minibossTimeLimitMs: 30000
    }))
};

const progress = (stage = 1, encounter = 'PHASE', phase = 1, completed = false) => ({ chapter: 1, stage, encounter, phase, completed, definition });

const flush = () => new Promise((resolve) => setTimeout(resolve));

const walletResponse = (coins = { gold: 2, silver: 14, copper: 37 }, drops = { 1: [3, 1, 5, 2, 4] }) => ({ wallet: coins, drops });

//  Minimal Phaser stand-in: records what ClickerGame adds and exposes the click handler and tweens.
//  `wallet` is what GET /wallet answers: a response object, an Error to reject with, or omitted to never answer.
const createScene = async ({ wallet, start = progress() } = {}) => {
    campaignGateway.get.mockReset();
    campaignGateway.report.mockReset();
    campaignGateway.get.mockImplementation(() => (start instanceof Error ? Promise.reject(start) : Promise.resolve(start)));
    campaignGateway.report.mockResolvedValue(progress());
    walletApi.get.mockReset();
    walletApi.get.mockImplementation(() => {
        if (wallet instanceof Error) { return Promise.reject(wallet); }
        return wallet ? Promise.resolve(wallet) : new Promise(() => {});
    });

    const rectangles = [];
    const sprites = [];
    const doms = [];
    const texts = [];
    const tweens = [];
    const handlers = {};
    const timers = [];
    const loops = [];
    const eventHandlers = {};

    const scene = new ClickerGame();
    scene.add = {
        image: vi.fn(() => ({})),
        rectangle: vi.fn((x, y, width, height, color) => {
            const rect = { x, y, width, height, color, originX: 0.5, originY: 0.5 };

            rect.setOrigin = (ox, oy) => { rect.originX = ox; rect.originY = oy; return rect; };
            rect.setSize = (w, h) => { rect.width = w; rect.height = h; return rect; };
            rect.alpha = 1;
            rect.setAlpha = (a) => { rect.alpha = a; return rect; };
            rectangles.push(rect);
            return rect;
        }),
        text: vi.fn((x, y, text) => {
            const obj = { x, y, text, alpha: 1, destroy: vi.fn() };

            obj.setOrigin = () => obj;
            obj.setDepth = () => obj;
            texts.push(obj);
            return obj;
        }),
        sprite: vi.fn((x, y, key) => {
            const sprite = { x, y, key, anim: null, destroy: vi.fn() };

            sprite.play = (anim) => { sprite.anim = anim; return sprite; };
            sprites.push(sprite);
            return sprite;
        }),
        dom: vi.fn((x, y) => {
            const element = { x, y, visible: true };

            element.createFromHTML = (html) => {
                const root = document.createElement('div');

                root.innerHTML = html;
                element.node = root; //  like Phaser, node is the wrapper div around the html
                return element;
            };
            element.setVisible = (visible) => { element.visible = visible; return element; };
            doms.push(element);
            return element;
        })
    };
    scene.registry = { get: vi.fn(() => services) };
    scene.sys = { isActive: vi.fn(() => true) };
    scene.tweens = { add: vi.fn((config) => { tweens.push(config); }) };
    scene.time = {
        delayedCall: vi.fn((delay, callback) => { timers.push({ delay, callback }); }),
        addEvent: vi.fn((config) => { loops.push(config); })
    };
    scene.events = { once: vi.fn((event, callback) => { eventHandlers[event] = callback; }) };
    scene.input = { on: vi.fn((event, cb) => { handlers[event] = cb; }), keyboard: { on: vi.fn((event, cb) => { handlers[event] = cb; }) } };

    scene.create();
    await flush(); //  the first encounter arrives from the backend

    //  Default pointer is off the monster
    const click = (pointer = { x: 100, y: 100 }) => handlers.pointerdown(pointer);
    const byColor = (color) => rectangles.filter((r) => r.color === color);
    const monster = byColor(0xcc2222)[0];
    const fill = byColor(0x33cc33)[0];
    const back = byColor(0x222222)[0];

    const walletText = () => doms.map((d) => d.node.querySelector('.wallet')).find(Boolean);
    const control = (selector) => doms.map((d) => d.node.querySelector(selector)).find(Boolean);
    const hud = (selector) => doms.map((d) => d.node.querySelector(selector)).find(Boolean);
    const walletElement = () => doms.find((d) => d.node.querySelector('.wallet'));

    return { scene, rectangles, texts, tweens, timers, loops, eventHandlers, sprites, doms, click, monster, fill, back, byColor, walletText, walletElement, hud, control, handlers };
};

describe('ClickerGame scene', () => {
    it('shows one black square character and one monster, and no coins yet', async () => {
        const { scene, rectangles, byColor } = await createScene();

        expect(byColor(0x000000)).toHaveLength(1);
        expect(byColor(0xcc2222)).toHaveLength(1);
        expect(rectangles).toHaveLength(4); //  character, monster, health bar back, health bar fill
        expect(scene.add.text).not.toHaveBeenCalled();
        expect(scene.physics).toBeUndefined();
    });

    it('lowers the monster health by 1 when the canvas is clicked', async () => {
        const { scene, click } = await createScene();

        click();

        expect(scene.monster.health).toBe(9);
    });

    it('shows "1" above the monster, rising 40 px and fading out over 800 ms', async () => {
        const { texts, tweens, click, monster } = await createScene();

        click();

        expect(texts).toHaveLength(1);
        expect(texts[0].text).toBe('1');
        expect(texts[0].x).toBe(monster.x);
        expect(texts[0].y).toBeLessThan(monster.y - monster.height / 2);
        expect(tweens[0]).toEqual(expect.objectContaining({
            targets: texts[0],
            y: texts[0].y - 40,
            alpha: 0,
            duration: 800
        }));
    });

    it('removes a damage number when it finishes fading', async () => {
        const { texts, tweens, click } = await createScene();
        click();
        expect(texts[0].destroy).not.toHaveBeenCalled();

        tweens[0].onComplete();

        expect(texts[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('shows one independent damage number per click', async () => {
        const { texts, tweens, click } = await createScene();

        click();
        click();

        expect(texts).toHaveLength(2);
        expect(tweens).toHaveLength(2);
        expect(tweens[0].targets).not.toBe(tweens[1].targets);
    });
});

describe('ClickerGame health bar', () => {
    it('is centred above the monster and 120 px wide at full health', async () => {
        const { monster, fill, back } = await createScene();

        expect(back.x + back.width / 2).toBe(monster.x);
        expect(fill.x).toBe(back.x);
        expect(fill.y).toBe(back.y);
        expect(fill.width).toBe(120);
        expect(back.width).toBe(120);
        expect(back.y + back.height).toBe(monster.y - monster.height / 2 - 16);
    });

    it('shrinks the fill to 108 px after one click', async () => {
        const { fill, click } = await createScene();

        click();

        expect(fill.width).toBe(108);
    });
});

describe('ClickerGame monster death', () => {
    const kill = (ctx) => {
        for (let i = 0; i < 10; i++)
        {
            ctx.click();
        }
    };
    const fadeTween = (ctx) => ctx.tweens.find((t) => Array.isArray(t.targets));

    it('fades the monster body and its health bar to alpha 0 over 500 ms on the tenth click', async () => {
        const ctx = await createScene();
        for (let i = 0; i < 9; i++)
        {
            ctx.click();
        }
        expect(fadeTween(ctx)).toBeUndefined();

        ctx.click();

        expect(fadeTween(ctx)).toEqual(expect.objectContaining({ alpha: 0, duration: 500 }));
        expect(fadeTween(ctx).targets).toEqual([ ctx.monster, ctx.back, ctx.fill ]);
    });

    it('sets the health bar fill to 0 px wide on death', async () => {
        const ctx = await createScene();

        kill(ctx);

        expect(ctx.fill.width).toBe(0);
    });

    it('shows the damage number of the killing click', async () => {
        const ctx = await createScene();

        kill(ctx);

        expect(ctx.texts).toHaveLength(10);
        expect(ctx.texts[9].text).toBe('1');
    });

    it('ignores clicks while the monster is dead: no damage, no damage number', async () => {
        const ctx = await createScene();
        kill(ctx);
        const tweenCount = ctx.tweens.length;

        ctx.click();
        ctx.click();

        expect(ctx.scene.monster.health).toBe(0);
        expect(ctx.texts).toHaveLength(10);
        expect(ctx.tweens).toHaveLength(tweenCount);
    });

    it('ignores clicks after the fade ends and before the next monster spawns', async () => {
        const ctx = await createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        const tweenCount = ctx.tweens.length;

        ctx.click();

        expect(ctx.scene.monster.health).toBe(0);
        expect(ctx.fill.width).toBe(0);
        expect(ctx.texts).toHaveLength(10);
        expect(ctx.tweens).toHaveLength(tweenCount);
    });

    it('waits 1000 ms after the fade ends, and not before, to spawn the next monster', async () => {
        const ctx = await createScene();
        kill(ctx);
        expect(ctx.timers).toHaveLength(0);

        fadeTween(ctx).onComplete();

        expect(ctx.timers).toHaveLength(1);
        expect(ctx.timers[0].delay).toBe(1000);
        expect(ctx.scene.monster.health).toBe(0);
    });

    it('spawns a monster with health 10, alpha 1 and a 120 px bar when the wait ends', async () => {
        const ctx = await createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        [ ctx.monster, ctx.back, ctx.fill ].forEach((part) => { part.alpha = 0; });

        ctx.timers[0].callback();

        expect(ctx.scene.monster.health).toBe(10);
        expect([ ctx.monster.alpha, ctx.back.alpha, ctx.fill.alpha ]).toEqual([ 1, 1, 1 ]);
        expect(ctx.fill.width).toBe(120);
    });

    it('takes 1 damage per click again after the respawn', async () => {
        const ctx = await createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        ctx.timers[0].callback();

        ctx.click();

        expect(ctx.scene.monster.health).toBe(9);
        expect(ctx.fill.width).toBe(108);
        expect(ctx.texts).toHaveLength(11);
    });
});

describe('ClickerGame damage number position', () => {
    it('shows the number at the pointer x when the click lands on the monster', async () => {
        const { texts, click } = await createScene();

        click({ x: 650, y: 450 });

        expect(texts[0].x).toBe(650);
    });

    it('keeps the number at the usual height when it follows the pointer', async () => {
        const { texts, click } = await createScene();
        click();
        click({ x: 650, y: 450 });

        expect(texts[1].y).toBe(texts[0].y);
    });

    it('centres the number on the monster when the click is off the monster', async () => {
        const { texts, monster, click } = await createScene();

        click({ x: 100, y: 100 });

        expect(texts[0].x).toBe(monster.x);
    });

    it('centres the number when the click is above the monster even if x is within its width', async () => {
        const { texts, monster, click } = await createScene();

        click({ x: 650, y: 100 });

        expect(texts[0].x).toBe(monster.x);
    });
});

describe('ClickerGame wallet text', () => {
    beforeEach(() => {
        walletApi.get.mockReset();
    });

    it('asks the backend for the wallet once when the scene starts', async () => {
        await createScene({ wallet: walletResponse() });

        expect(walletApi.get).toHaveBeenCalledTimes(1);
    });

    it('keeps the wallet text hidden until the wallet has loaded', async () => {
        const { walletElement } = await createScene();

        expect(walletElement().visible).toBe(false);
    });

    it('shows "Gold: G  Silver: S  Copper: C" in the top-left corner once the wallet has loaded', async () => {
        const { walletText, walletElement } = await createScene({ wallet: walletResponse() });
        await flush();

        expect(walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
        expect(walletElement().visible).toBe(true);
        expect(walletElement().x).toBeLessThan(512);
        expect(walletElement().y).toBeLessThan(100);
    });

    it('lets clicks through the wallet text so a click on it still hits the monster', async () => {
        const { walletElement } = await createScene();

        expect(walletElement().pointerEvents).toBe('none');
    });

    it('always shows all three denominations, also when they are zero', async () => {
        const { walletText } = await createScene({ wallet: walletResponse({ gold: 0, silver: 0, copper: 0 }) });
        await flush();

        expect(walletText().textContent).toBe('Gold: 0  Silver: 0  Copper: 0');
    });

    it('shows no wallet text when the wallet cannot be loaded', async () => {
        const { walletElement } = await createScene({ wallet: new Error('down') });
        await flush();

        expect(walletElement().visible).toBe(false);
    });

    it('changes nothing when the wallet arrives after the scene shut down', async () => {
        let resolve;
        const pending = new Promise((done) => { resolve = done; });
        const { scene, walletElement } = await createScene({ wallet: pending });
        scene.sys.isActive.mockReturnValue(false);

        resolve(walletResponse());
        await flush();

        expect(walletElement().visible).toBe(false);
    });
});

describe('ClickerGame coin drops', () => {
    const kill = (ctx) => {
        for (let i = 0; i < 10; i++)
        {
            ctx.click();
        }
    };
    const loadedScene = async (wallet) => {
        const ctx = await createScene({ wallet });
        await flush();
        return ctx;
    };
    const coinTweens = (ctx) => ctx.tweens.filter((t) => ctx.sprites.includes(t.targets));
    const landAll = (ctx) => coinTweens(ctx).forEach((t) => t.onComplete());

    it('spawns no coins before the killing click', async () => {
        const ctx = await loadedScene(walletResponse());

        for (let i = 0; i < 9; i++)
        {
            ctx.click();
        }

        expect(ctx.sprites).toHaveLength(0);
    });

    it('spawns one rotating coin per copper of the drop at the monster center when the monster dies', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3, 1] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(3);
        ctx.sprites.forEach((coin) => {
            expect([ coin.x, coin.y, coin.key, coin.anim ]).toEqual([ 700, 500, 'coin', 'rotate' ]);
        });
    });

    it('tweens each coin to the wallet text over 600 ms, each one starting 100 ms after the previous', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3] }));

        kill(ctx);

        const tweens = coinTweens(ctx);
        expect(tweens).toHaveLength(3);
        tweens.forEach((tween, i) => {
            expect(tween).toEqual(expect.objectContaining({
                targets: ctx.sprites[i],
                x: ctx.walletElement().x,
                y: ctx.walletElement().y,
                duration: 600,
                delay: i * 100
            }));
        });
    });

    it('adds 1 copper and destroys the coin each time a coin reaches the wallet text', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3] }));
        kill(ctx);
        const [ first, second, third ] = coinTweens(ctx);

        first.onComplete();
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 38');
        expect(ctx.sprites[0].destroy).toHaveBeenCalledTimes(1);
        expect(ctx.sprites[1].destroy).not.toHaveBeenCalled();

        second.onComplete();
        third.onComplete();
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 40');
    });

    it('does not change the wallet text before any coin lands', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3] }));

        kill(ctx);

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
    });

    it('shows 1 silver and 1 copper for 99 copper plus a drop of 2', async () => {
        const ctx = await loadedScene(walletResponse({ gold: 0, silver: 0, copper: 99 }, { 1: [2] }));
        kill(ctx);

        landAll(ctx);

        expect(ctx.walletText().textContent).toBe('Gold: 0  Silver: 1  Copper: 1');
    });

    it('carries 100 silver into gold', async () => {
        const ctx = await loadedScene(walletResponse({ gold: 7, silver: 99, copper: 99 }, { 1: [1] }));
        kill(ctx);

        landAll(ctx);

        expect(ctx.walletText().textContent).toBe('Gold: 8  Silver: 0  Copper: 0');
    });

    it('spawns that many coins for a drop above 5 copper', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [12] }));

        kill(ctx);
        landAll(ctx);

        expect(ctx.sprites).toHaveLength(12);
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 49');
    });

    it('drops nothing when the wallet has not loaded', async () => {
        const ctx = await createScene();

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
    });

    it('drops nothing when the queue of the monster level is empty', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
    });

    it('drops nothing when the backend sent no queue for the monster level', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 2: [5] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
    });

    it('reads the queue of the level of the monster', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3], 2: [2] }));
        ctx.scene.monster.level = 2;

        kill(ctx);

        expect(ctx.sprites).toHaveLength(2);
    });

    it('takes the next queued value on the next kill after the respawn', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3, 1] }));
        kill(ctx);
        ctx.tweens.find((t) => Array.isArray(t.targets)).onComplete();
        ctx.timers[0].callback();

        kill(ctx);

        expect(ctx.sprites).toHaveLength(4);
    });

    it('does not drop again for clicks on a dead monster', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3, 1] }));
        kill(ctx);

        ctx.click();
        ctx.click();

        expect(ctx.sprites).toHaveLength(3);
    });
});

describe('ClickerGame wallet sync', () => {
    const kill = (ctx) => {
        for (let i = 0; i < 10; i++)
        {
            ctx.click();
        }
    };
    //  A kill ends with the monster dead; respawn it so the next kill can follow
    const respawn = (ctx) => {
        ctx.tweens.find((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).onComplete();
        ctx.timers[ctx.timers.length - 1].callback();
    };
    const tick = (ctx) => ctx.loops[0].callback();
    const loadedScene = async (wallet = walletResponse(undefined, { 1: [3, 1, 5, 2, 4] })) => {
        const ctx = await createScene({ wallet });
        await flush();
        return ctx;
    };
    const deferred = () => {
        let resolve;
        let reject;
        const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
        return { promise, resolve, reject };
    };
    const synced = (coins, drops) => ({ wallet: coins, accepted: {}, drops });

    beforeEach(() => {
        walletApi.sync.mockReset();
    });

    it('registers one looping 10 000 ms timer', async () => {
        const ctx = await createScene();

        expect(ctx.loops).toHaveLength(1);
        expect(ctx.loops[0]).toEqual(expect.objectContaining({ delay: 10_000, loop: true }));
    });

    it('sends the unreported kills of each level on a tick', async () => {
        walletApi.sync.mockResolvedValue(synced({ gold: 0, silver: 0, copper: 0 }, { 1: [] }));
        const ctx = await loadedScene();
        kill(ctx);
        respawn(ctx);
        kill(ctx);

        tick(ctx);

        expect(walletApi.sync).toHaveBeenCalledTimes(1);
        expect(walletApi.sync).toHaveBeenCalledWith({ 1: 2 });
    });

    it('sends nothing on a tick without unreported kills', async () => {
        const ctx = await loadedScene();

        tick(ctx);

        expect(walletApi.sync).not.toHaveBeenCalled();
    });

    it('does not count a kill that dropped nothing', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [] }));
        kill(ctx);

        tick(ctx);

        expect(walletApi.sync).not.toHaveBeenCalled();
    });

    it('starts no second sync while one is in flight', async () => {
        const pending = deferred();
        walletApi.sync.mockReturnValue(pending.promise);
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        respawn(ctx);
        kill(ctx);

        tick(ctx);

        expect(walletApi.sync).toHaveBeenCalledTimes(1);
    });

    it('sends a kill made during a sync with the next sync, not the current one', async () => {
        const pending = deferred();
        walletApi.sync.mockReturnValueOnce(pending.promise).mockResolvedValue(synced({ gold: 0, silver: 0, copper: 0 }, { 1: [] }));
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        respawn(ctx);
        kill(ctx);
        expect(walletApi.sync).toHaveBeenLastCalledWith({ 1: 1 });

        pending.resolve(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [1, 5, 2, 4, 9] }));
        await flush();
        tick(ctx);

        expect(walletApi.sync).toHaveBeenCalledTimes(2);
        expect(walletApi.sync).toHaveBeenLastCalledWith({ 1: 1 });
    });

    it('shows the response wallet after a successful sync', async () => {
        walletApi.sync.mockResolvedValue(synced({ gold: 2, silver: 15, copper: 5 }, { 1: [1, 5, 2, 4, 9] }));
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        await flush();

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 15  Copper: 5');
    });

    it('adds the landed coins the response does not cover on top of the response wallet', async () => {
        const pending = deferred();
        walletApi.sync.mockReturnValue(pending.promise);
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        respawn(ctx);
        kill(ctx);
        //  The second kill dropped 1 copper (its coin is the 4th sprite); the response covers only the first kill
        ctx.tweens.filter((t) => ctx.sprites.indexOf(t.targets) >= 3).forEach((t) => t.onComplete());

        pending.resolve(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [5, 2, 4, 9] }));
        await flush();

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 41');
    });

    it('takes the next drops from the server queue after a successful sync', async () => {
        walletApi.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [7, 2, 4, 9] }));
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        await flush();
        respawn(ctx);

        kill(ctx);

        expect(ctx.sprites).toHaveLength(3 + 7);
    });

    it('keeps playing and sends the same kills again on the next tick after a failed sync', async () => {
        walletApi.sync.mockRejectedValueOnce(new Error('down')).mockResolvedValue(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [1] }));
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        await flush();
        respawn(ctx);
        kill(ctx);

        expect(ctx.sprites).toHaveLength(3 + 1);
        tick(ctx);

        expect(walletApi.sync).toHaveBeenCalledTimes(2);
        expect(walletApi.sync).toHaveBeenLastCalledWith({ 1: 2 });
    });

    it('asks for the wallet again on a tick while it has not loaded, and shows it once it arrives', async () => {
        const ctx = await createScene({ wallet: new Error('down') });
        await flush();
        expect(ctx.walletElement().visible).toBe(false);
        walletApi.get.mockResolvedValue(walletResponse());

        tick(ctx);
        await flush();

        expect(walletApi.get).toHaveBeenCalledTimes(2);
        expect(ctx.walletElement().visible).toBe(true);
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
    });

    it('stops asking for the wallet once it has loaded', async () => {
        const ctx = await loadedScene();

        tick(ctx);
        tick(ctx);

        expect(walletApi.get).toHaveBeenCalledTimes(1);
    });

    it('does not start a second wallet request while one is pending', async () => {
        const ctx = await createScene();

        tick(ctx);

        expect(walletApi.get).toHaveBeenCalledTimes(1);
    });

    it('sends one final sync when the scene shuts down with unreported kills', async () => {
        walletApi.sync.mockResolvedValue(synced({ gold: 2, silver: 14, copper: 40 }, { 1: [] }));
        const ctx = await loadedScene();
        kill(ctx);

        ctx.eventHandlers.shutdown();

        expect(walletApi.sync).toHaveBeenCalledTimes(1);
        expect(walletApi.sync).toHaveBeenCalledWith({ 1: 1 });
    });

    it('does not retry the final sync when it fails', async () => {
        walletApi.sync.mockRejectedValue(new Error('down'));
        const ctx = await loadedScene();
        kill(ctx);

        ctx.eventHandlers.shutdown();
        await flush();

        expect(walletApi.sync).toHaveBeenCalledTimes(1);
    });

    it('sends no final sync on shutdown without unreported kills', async () => {
        const ctx = await loadedScene();

        ctx.eventHandlers.shutdown();

        expect(walletApi.sync).not.toHaveBeenCalled();
    });

    it('changes nothing when a sync answers after the scene shut down', async () => {
        const pending = deferred();
        walletApi.sync.mockReturnValue(pending.promise);
        const ctx = await loadedScene();
        kill(ctx);
        tick(ctx);
        ctx.scene.sys.isActive.mockReturnValue(false);

        pending.resolve(synced({ gold: 9, silver: 9, copper: 9 }, { 1: [] }));
        await flush();

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
    });
});

describe('ClickerGame stages', () => {
    const killAll = (ctx) => {
        while (ctx.scene.monster && !ctx.scene.monster.dead)
        {
            ctx.click();
        }
    };
    //  The fade ends, then the respawn delay: the next encounter appears
    const advance = (ctx) => {
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
    };
    const label = (ctx) => ctx.hud('.stage-hud').textContent;
    const timer = (ctx) => ctx.hud('.boss-timer').textContent;
    const message = (ctx) => ctx.hud('.stage-message').textContent;
    const bossStart = (stage = 1) => progress(stage, 'MINIBOSS', 1);

    it('asks the backend for the progress once when the scene starts', async () => {
        await createScene();

        expect(campaignGateway.get).toHaveBeenCalledTimes(1);
    });

    it('spawns the loaded encounter with the health of its stage and shows its position', async () => {
        const ctx = await createScene({ start: progress(3, 'PHASE', 2) });

        expect(ctx.scene.monster.health).toBe(12);
        expect(ctx.scene.monster.maxHealth).toBe(12);
        expect(ctx.monster.alpha).toBe(1);
        expect(label(ctx)).toBe('Stage 3/10  Phase 2/5');
    });

    it('spawns no monster and ignores clicks until the progress has loaded', async () => {
        const ctx = await createScene({ start: new Promise(() => {}) });

        ctx.click();

        expect(ctx.scene.monster).toBeNull();
        expect(ctx.monster.alpha).toBe(0);
        expect(ctx.texts).toHaveLength(0);
        expect(label(ctx)).toBe('');
    });

    it('makes the stage position text click-through', async () => {
        const ctx = await createScene();

        expect(ctx.doms.filter((d) => d.node.querySelector('.stage-hud, .boss-timer, .stage-message')).map((d) => d.pointerEvents))
            .toEqual([ 'none', 'none', 'none' ]);
    });

    it('moves to the next phase of the stage after the fade and the respawn delay', async () => {
        const ctx = await createScene();

        killAll(ctx);
        expect(label(ctx)).toBe('Stage 1/10  Phase 1/5');
        advance(ctx);

        expect(label(ctx)).toBe('Stage 1/10  Phase 2/5');
        expect(ctx.scene.monster.health).toBe(10);
        expect(ctx.monster.alpha).toBe(1);
    });

    it('spawns the miniboss after the last phase with its health, and shows a 30 s countdown', async () => {
        const ctx = await createScene({ start: progress(1, 'PHASE', 5) });

        killAll(ctx);
        advance(ctx);

        expect(label(ctx)).toBe('Stage 1/10  Miniboss');
        expect(ctx.scene.monster.maxHealth).toBe(50);
        expect(timer(ctx)).toBe('Time: 30');
    });

    it('shows no countdown on a phase monster', async () => {
        const ctx = await createScene();

        expect(timer(ctx)).toBe('');
    });

    it('counts the boss time down in whole seconds as the scene updates', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 1001);
        expect(timer(ctx)).toBe('Time: 29');

        ctx.scene.update(0, 28000);
        expect(timer(ctx)).toBe('Time: 1');
        expect(ctx.scene.monster).not.toBeNull();
    });

    it('moves to phase 1 of the next stage and hides the countdown when the miniboss dies in time', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 10000);
        killAll(ctx);
        expect(timer(ctx)).toBe('');
        ctx.scene.update(0, 30000);
        advance(ctx);

        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
        expect(ctx.scene.monster.maxHealth).toBe(11);
        expect(timer(ctx)).toBe('');
    });

    it('removes the boss when its countdown reaches 0, hides the countdown and ignores clicks', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 30000);
        ctx.click();

        expect(ctx.scene.monster).toBeNull();
        expect(ctx.monster.alpha).toBe(0);
        expect(timer(ctx)).toBe('');
        expect(ctx.texts).toHaveLength(0);
    });

    it('brings phase 5 of the same stage back one respawn delay after the boss left', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 30000);
        expect(ctx.timers.at(-1).delay).toBe(1000);
        ctx.timers.at(-1).callback();

        expect(label(ctx)).toBe('Stage 1/10  Phase 5/5');
        expect(ctx.scene.monster.maxHealth).toBe(10);
        expect(ctx.monster.alpha).toBe(1);
    });

    it('lets the player kill phase 5 again and meet the miniboss again with a full countdown', async () => {
        const ctx = await createScene({ start: bossStart() });
        ctx.scene.update(0, 30000);
        ctx.timers.at(-1).callback();

        killAll(ctx);
        advance(ctx);

        expect(label(ctx)).toBe('Stage 1/10  Miniboss');
        expect(timer(ctx)).toBe('Time: 30');
    });

    it('counts a kill made before the countdown is checked as a win', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 29999);
        killAll(ctx);
        ctx.scene.update(0, 5000);
        advance(ctx);

        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
    });

    it('spawns the chapter boss after the miniboss of the last stage with the 60 s countdown', async () => {
        const ctx = await createScene({ start: bossStart(10) });

        killAll(ctx);
        advance(ctx);

        expect(label(ctx)).toBe('Chapter Boss');
        expect(ctx.scene.monster.maxHealth).toBe(300);
        expect(timer(ctx)).toBe('Time: 60');
    });

    it('returns to phase 5 of stage 10 when the chapter boss runs out of time', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });

        ctx.scene.update(0, 60000);
        ctx.timers.at(-1).callback();

        expect(label(ctx)).toBe('Stage 10/10  Phase 5/5');
    });

    it('shows the completion message and spawns no monster when the chapter boss dies', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });

        killAll(ctx);
        advance(ctx);

        expect(message(ctx)).toBe('Chapter complete!');
        expect(ctx.scene.monster).toBeNull();
        expect(ctx.monster.alpha).toBe(0);
        expect(timer(ctx)).toBe('');
    });

    it('ignores clicks once the chapter is complete', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });
        killAll(ctx);
        advance(ctx);
        const damageNumbers = ctx.texts.length;

        ctx.click();

        expect(ctx.texts).toHaveLength(damageNumbers);
    });

    it('shows the completion message at once and no monster when the stored progress is completed', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1, true) });

        ctx.click();

        expect(message(ctx)).toBe('Chapter complete!');
        expect(ctx.scene.monster).toBeNull();
        expect(ctx.texts).toHaveLength(0);
    });

    it('shows "Could not load progress" and spawns no monster when the progress cannot be loaded', async () => {
        const ctx = await createScene({ start: new Error('down') });

        ctx.click();

        expect(message(ctx)).toBe('Could not load progress');
        expect(ctx.scene.monster).toBeNull();
        expect(ctx.texts).toHaveLength(0);
    });

    it('changes nothing when the progress arrives after the scene shut down', async () => {
        let resolve;
        const ctx = await createScene({ start: new Promise((done) => { resolve = done; }) });
        ctx.scene.sys.isActive.mockReturnValue(false);

        resolve(progress());
        await flush();

        expect(ctx.scene.monster).toBeNull();
        expect(label(ctx)).toBe('');
    });

    it('still takes the level 1 drop when a boss dies', async () => {
        const ctx = await createScene({ start: bossStart(), wallet: walletResponse(undefined, { 1: [ 4, 1, 5 ] }) });
        await flush();

        killAll(ctx);

        expect(ctx.sprites).toHaveLength(4);
    });
});

describe('ClickerGame progress saving', () => {
    const killAll = (ctx) => {
        while (ctx.scene.monster && !ctx.scene.monster.dead)
        {
            ctx.click();
        }
    };
    const advance = (ctx) => {
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
    };
    const tick = (ctx) => ctx.loops[0].callback();
    const label = (ctx) => ctx.hud('.stage-hud').textContent;
    const message = (ctx) => ctx.hud('.stage-message').textContent;
    const at = (stage, encounter, phase = 1) => ({ chapter: 1, stage, encounter, phase });
    const conflict = (stored) => new ApiError('Reported position does not match the stored progress', {
        status: 409, code: 'PROGRESS_CONFLICT', body: { progress: stored }
    });

    it('sends nothing until a tick: a kill only queues its report', async () => {
        const ctx = await createScene();

        killAll(ctx);
        advance(ctx);

        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('sends the CLEARED report with the position it left on the next tick', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);

        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
        expect(campaignGateway.report).toHaveBeenCalledWith(at(1, 'PHASE', 1), 'CLEARED');
    });

    it('sends several kills in order on one tick', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        killAll(ctx);
        advance(ctx);

        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(2);
        expect(campaignGateway.report).toHaveBeenNthCalledWith(1, at(1, 'PHASE', 1), 'CLEARED');
        expect(campaignGateway.report).toHaveBeenNthCalledWith(2, at(1, 'PHASE', 2), 'CLEARED');
    });

    it('sends the FAILED report of a boss that ran out of time on the next tick', async () => {
        const ctx = await createScene({ start: progress(2, 'MINIBOSS', 1) });
        ctx.scene.update(0, 30000);

        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledWith(at(2, 'MINIBOSS', 1), 'FAILED');
    });

    it('keeps playing and sends the same report again on the next tick after a failed one', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        campaignGateway.report.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));

        tick(ctx);
        await flush();
        expect(label(ctx)).toBe('Stage 1/10  Phase 2/5');
        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(2);
        expect(campaignGateway.report).toHaveBeenNthCalledWith(2, at(1, 'PHASE', 1), 'CLEARED');
    });

    it('sends nothing on a tick without queued reports', async () => {
        const ctx = await createScene();

        tick(ctx);
        await flush();

        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('plays the stored position when a report is answered 409', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(1, 'PHASE', 4)));

        tick(ctx);
        await flush();

        expect(label(ctx)).toBe('Stage 1/10  Phase 4/5');
        expect(ctx.scene.monster.health).toBe(10);
        expect(ctx.monster.alpha).toBe(1);
    });

    it('does not resend the voided reports after a 409', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        killAll(ctx);
        advance(ctx);
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(1, 'PHASE', 4)));

        tick(ctx);
        await flush();
        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
    });

    it('realigns to a boss with its countdown when the stored position is a boss', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(3, 'MINIBOSS', 1)));

        tick(ctx);
        await flush();

        expect(label(ctx)).toBe('Stage 3/10  Miniboss');
        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
    });

    it('does not spawn a stale encounter when a realignment happens while the monster fades', async () => {
        const ctx = await createScene();
        killAll(ctx);
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(2, 'PHASE', 1)));
        tick(ctx);
        await flush();

        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();

        expect(ctx.timers).toHaveLength(0);
        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
    });

    it('does not spawn a stale encounter when a realignment happens during the respawn wait', async () => {
        const ctx = await createScene();
        killAll(ctx);
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(2, 'PHASE', 1)));
        tick(ctx);
        await flush();

        ctx.timers.at(-1).callback();

        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
        expect(ctx.scene.monster.maxHealth).toBe(11);
    });

    it('asks for the progress again on a tick while it has not loaded, and spawns the monster once it arrives', async () => {
        const ctx = await createScene({ start: new Error('down') });
        expect(message(ctx)).toBe('Could not load progress');
        campaignGateway.get.mockResolvedValue(progress(1, 'PHASE', 1));

        tick(ctx);
        await flush();

        expect(campaignGateway.get).toHaveBeenCalledTimes(2);
        expect(message(ctx)).toBe('');
        expect(ctx.scene.monster.maxHealth).toBe(10);
        expect(label(ctx)).toBe('Stage 1/10  Phase 1/5');
    });

    it('keeps the message while the progress still cannot be loaded', async () => {
        const ctx = await createScene({ start: new Error('down') });

        tick(ctx);
        await flush();

        expect(message(ctx)).toBe('Could not load progress');
        expect(ctx.scene.monster).toBeNull();
    });

    it('stops asking for the progress once it has loaded', async () => {
        const ctx = await createScene();

        tick(ctx);
        await flush();

        expect(campaignGateway.get).toHaveBeenCalledTimes(1);
    });

    it('starts no second progress request while one is pending', async () => {
        const ctx = await createScene({ start: new Promise(() => {}) });

        tick(ctx);
        await flush();

        expect(campaignGateway.get).toHaveBeenCalledTimes(1);
    });

    it('sends the queued reports in order once when the scene shuts down', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        killAll(ctx);
        advance(ctx);

        ctx.eventHandlers.shutdown();
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(2);
        expect(campaignGateway.report).toHaveBeenNthCalledWith(1, at(1, 'PHASE', 1), 'CLEARED');
        expect(campaignGateway.report).toHaveBeenNthCalledWith(2, at(1, 'PHASE', 2), 'CLEARED');
    });

    it('does not retry the reports when the final attempt fails', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        campaignGateway.report.mockRejectedValue(new ApiError('down'));

        ctx.eventHandlers.shutdown();
        await flush();
        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
    });

    it('sends no report on shutdown without queued reports', async () => {
        const ctx = await createScene();

        ctx.eventHandlers.shutdown();
        await flush();

        expect(campaignGateway.report).not.toHaveBeenCalled();
    });
});

describe('ClickerGame pause and leave fight', () => {
    const bossStart = () => progress(1, 'MINIBOSS', 1);
    const press = (ctx, selector) => ctx.control(selector).click();
    const killAll = (ctx) => {
        while (ctx.scene.monster && !ctx.scene.monster.dead)
        {
            ctx.click();
        }
    };
    const advance = (ctx) => {
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
    };
    const label = (ctx) => ctx.hud('.stage-hud').textContent;

    it('starts with the pause menu hidden', async () => {
        const ctx = await createScene({ start: bossStart() });

        expect(ctx.control('.pause-menu').hidden).toBe(true);
    });

    it('pauses on Esc: shows the menu and freezes clicks, the countdown, timers and tweens', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();
        ctx.click();
        ctx.scene.update(0, 30000);

        expect(ctx.control('.pause-menu').hidden).toBe(false);
        expect(ctx.scene.time.paused).toBe(true);
        expect(ctx.scene.tweens.paused).toBe(true);
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth);
        expect(ctx.scene.monster).not.toBeNull();
    });

    it('continues on the Continue button and on a second Esc', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();
        press(ctx, '.pause-continue');
        expect(ctx.control('.pause-menu').hidden).toBe(true);
        expect(ctx.scene.time.paused).toBe(false);
        ctx.click();
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 1);

        ctx.handlers['keydown-ESC']();
        ctx.handlers['keydown-ESC']();
        expect(ctx.control('.pause-menu').hidden).toBe(true);
    });

    it('does not pause when there is no monster to fight', async () => {
        const ctx = await createScene({ start: new Error('down') });

        ctx.handlers['keydown-ESC']();

        expect(ctx.control('.pause-menu').hidden).toBe(true);
    });

    it('asks for confirmation before leaving, and No goes back to the menu', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();
        press(ctx, '.pause-leave');

        expect(ctx.control('.pause-confirm').hidden).toBe(false);
        expect(ctx.control('.pause-options').hidden).toBe(true);
        expect(ctx.scene.monster).not.toBeNull();

        press(ctx, '.pause-confirm-no');

        expect(ctx.control('.pause-confirm').hidden).toBe(true);
        expect(ctx.control('.pause-options').hidden).toBe(false);
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('leaves the boss as a failed outcome and brings phase 5 back', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();
        press(ctx, '.pause-leave');
        press(ctx, '.pause-confirm-yes');

        expect(ctx.scene.monster).toBeNull();
        expect(ctx.control('.pause-menu').hidden).toBe(true);
        expect(ctx.scene.time.paused).toBe(false);
        expect(ctx.hud('.boss-timer').textContent).toBe('');

        ctx.timers.at(-1).callback();
        expect(label(ctx)).toBe('Stage 1/10  Phase 5/5');

        await ctx.scene.session.flush();
        expect(campaignGateway.report).toHaveBeenCalledWith({ chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 }, 'FAILED');
    });

    it('offers no way to leave a phase monster', async () => {
        const ctx = await createScene();

        ctx.handlers['keydown-ESC']();

        expect(ctx.control('.pause-leave').hidden).toBe(true);
        expect(ctx.control('.pause-continue').hidden).toBe(false);
    });

    it('moves on after a boss kill when farming is off', async () => {
        const ctx = await createScene({ start: bossStart() });

        killAll(ctx);
        advance(ctx);

        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
    });

    it('respawns the same boss after a kill when farming is on, without reporting a win', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.control('.farm-toggle input').checked = true;
        killAll(ctx);
        advance(ctx);
        await ctx.scene.session.flush();

        expect(label(ctx)).toBe('Stage 1/10  Miniboss');
        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth);
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('still moves on after a phase monster when farming is on', async () => {
        const ctx = await createScene();

        ctx.control('.farm-toggle input').checked = true;
        killAll(ctx);
        advance(ctx);

        expect(label(ctx)).toBe('Stage 1/10  Phase 2/5');
    });

    it('goes back to phase 5 and then to the boss again when the farmed boss times out', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.control('.farm-toggle input').checked = true;
        ctx.scene.update(0, 30000);
        ctx.timers.at(-1).callback();
        expect(label(ctx)).toBe('Stage 1/10  Phase 5/5');

        killAll(ctx);
        advance(ctx);
        expect(label(ctx)).toBe('Stage 1/10  Miniboss');
    });
});
