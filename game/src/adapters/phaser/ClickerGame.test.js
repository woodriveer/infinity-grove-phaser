import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClickerGame } from './ClickerGame';
import { ApiError } from '../../application/ApiError';
import { createCampaignSession } from '../../application/campaign/campaignSession';
import { createFarmSession } from '../../application/farm/farmSession';
import { createHeroCollection } from '../../application/heroes/heroCollection';
import { createWalletSync } from '../../application/wallet/walletSync';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

//  The real wallet service over a mocked backend gateway: these scene tests cover scene and service together
const walletApi = { get: vi.fn(), sync: vi.fn() };

//  The real campaign session over a mocked backend gateway, started on stage 1 phase 1 of a seeded-like chapter
const campaignGateway = { get: vi.fn(), report: vi.fn() };
//  The real hero collection and farm session over mocked gateways; by default the player owns Kael with one blank card
const heroesGateway = { list: vi.fn(), fuse: vi.fn(), setLeader: vi.fn() };
const farmGateway = { get: vi.fn(), win: vi.fn() };
//  The critical roll: 0.99 never crits a monster of the default stats (10 % chance); a test sets `dice.value` to force one
const dice = { value: 0.99 };
const services = {
    random: () => dice.value,
    createWalletSync: () => createWalletSync({ gateway: walletApi }),
    createCampaignSession: () => createCampaignSession({ gateway: campaignGateway }),
    createHeroCollection: () => createHeroCollection({ gateway: heroesGateway }),
    createFarmSession: () => createFarmSession({ gateway: farmGateway })
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

const heroSkills = (...unlocked) => unlocked.map((open, index) => ({
    slot: index + 1, name: `Skill ${index + 1}`, type: 'Ataque', effect: 'Effect', cooldownSeconds: 10, image: `art_${index + 1}`, unlocked: open
}));

const heroEntry = (id, copies = {}, stars = 0) => ({
    id, name: `Hero ${id}`, heroClass: 'Guerreiro', element: 'FIRE', leaderBonus: 'Bonus', portrait: `${id}_position`, chapter: 1,
    owned: Object.values(copies).some((n) => n > 0), stars, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies },
    skills: heroSkills(stars >= 1, stars >= 2, stars >= 3)
});

const heroesResponse = () => ({ leaderId: 'kael', heroes: [ heroEntry('kael', { 0: 1 }), heroEntry('lyra'), heroEntry('orina') ] });

const walletResponse = (coins = { gold: 2, silver: 14, copper: 37 }, drops = { 1: [3, 1, 5, 2, 4] }) => ({ wallet: coins, drops });

//  Minimal Phaser stand-in: records what ClickerGame adds and exposes the click handler and tweens.
//  `wallet` is what GET /wallet answers: a response object, an Error to reject with, or omitted to never answer.
const createScene = async ({ wallet, start = progress(), heroes = heroesResponse() } = {}) => {
    dice.value = 0.99;
    heroesGateway.list.mockReset();
    heroesGateway.fuse.mockReset();
    heroesGateway.setLeader.mockReset();
    heroesGateway.list.mockImplementation(() => (heroes instanceof Error ? Promise.reject(heroes) : Promise.resolve(heroes)));
    farmGateway.get.mockReset();
    farmGateway.win.mockReset();
    farmGateway.get.mockResolvedValue({ bosses: [ { kind: 'MINIBOSS', stage: 1 } ], chapterBossWinsLeft: 10 });
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
        text: vi.fn((x, y, text, style) => {
            const obj = { x, y, text, style, alpha: 1, destroy: vi.fn() };

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
            element.updateSize = vi.fn(() => element);
            element.setVisible = (visible) => { element.visible = visible; return element; };
            doms.push(element);
            return element;
        })
    };
    scene.registry = { get: vi.fn(() => services) };
    scene.sys = { isActive: vi.fn(() => true) };
    scene.tweens = { add: vi.fn((config) => { tweens.push(config); }), killTweensOf: vi.fn() };
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

    return { scene, rectangles, texts, tweens, timers, loops, eventHandlers, sprites, doms, click, monster, fill, back, byColor, walletText, walletElement, hud, control, handlers, dice };
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

    it('measures the menu again when it opens so it stays centred', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();

        expect(ctx.scene.pauseElement.updateSize).toHaveBeenCalledTimes(1);
        expect(ctx.scene.pauseElement.x).toBe(512);
        expect(ctx.scene.pauseElement.y).toBe(384);
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

describe('ClickerGame elements', () => {
    const stats = (element, physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element, physicalDefense, magicalDefense, critResistance });
    const withStats = (monster, miniboss = monster, boss = monster) => ({
        ...progress(),
        definition: { ...definition, boss, stages: definition.stages.map((stage) => ({ ...stage, monster, miniboss })) }
    });
    const enemyText = (ctx) => ctx.hud('.enemy-stats').textContent;
    const killAll = (ctx) => {
        while (ctx.scene.monster && !ctx.scene.monster.dead)
        {
            ctx.click();
        }
    };
    const fade = (ctx) => ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1);

    it('lowers a nature monster by 2 per click (fire against nature) and shows "2"', async () => {
        const ctx = await createScene({ start: withStats(stats('NATURE')) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 2);
        expect(ctx.texts[0].text).toBe('2');
    });

    it('lowers a darkness monster by 0.9 per click and shows "0.9"', async () => {
        const ctx = await createScene({ start: withStats(stats('DARKNESS')) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.9);
        expect(ctx.texts[0].text).toBe('0.9');
    });

    it('shows the damage with at most one decimal while subtracting the exact amount', async () => {
        const ctx = await createScene({ start: withStats(stats('WATER', 90)) });

        ctx.click();

        expect(ctx.texts[0].text).toBe('0');
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.05);
    });

    it('applies the physical defense of the monster', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE', 50, 10)) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.5);
    });

    it('doubles the damage on a critical click and draws that number bigger and gold', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });
        ctx.dice.value = 0;

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 2);
        expect(ctx.texts[0].text).toBe('2');
        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ color: '#ffd700', fontSize: 52 }));
    });

    it('draws a normal click white and 38 px', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });

        ctx.click();

        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ color: '#ffffff', fontSize: 38 }));
    });

    it('never crits a monster with critical resistance 100', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE', 0, 0, 100)) });
        ctx.dice.value = 0;

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 1);
    });

    it('kills a monster that takes fractional damage once its health reaches 0', async () => {
        const ctx = await createScene({ start: withStats(stats('DARKNESS')) });

        killAll(ctx);

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.fill.width).toBe(0);
    });

    it('shows the element and the three values of the monster on screen', async () => {
        const ctx = await createScene({ start: withStats(stats('WATER', 11, 22, 33)) });

        expect(enemyText(ctx)).toBe('Water  Physical def 11%  Magical def 22%  Crit res 33%');
    });

    it('shows the miniboss attributes when the miniboss spawns', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT', 1, 2, 3)), encounter: 'MINIBOSS' } });

        expect(enemyText(ctx)).toBe('Light  Physical def 1%  Magical def 2%  Crit res 3%');
    });

    it('shows the chapter boss attributes', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT'), stats('DARKNESS', 30, 30, 30)), stage: 10, encounter: 'CHAPTER_BOSS' } });

        expect(enemyText(ctx)).toBe('Darkness  Physical def 30%  Magical def 30%  Crit res 30%');
    });

    it('shows fire with no defense for a payload without stats', async () => {
        const ctx = await createScene();

        expect(enemyText(ctx)).toBe('Fire  Physical def 0%  Magical def 0%  Crit res 0%');
    });

    it('clears the attributes when the monster dies and shows the next ones when it spawns', async () => {
        const ctx = await createScene({ start: withStats(stats('NATURE')) });

        killAll(ctx);
        expect(enemyText(ctx)).toBe('');

        fade(ctx).onComplete();
        ctx.timers.at(-1).callback();
        expect(enemyText(ctx)).toBe('Nature  Physical def 0%  Magical def 0%  Crit res 0%');
    });

    it('clears the attributes when the boss runs out of time', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('NATURE')), encounter: 'MINIBOSS' } });

        ctx.scene.update(0, 30000);

        expect(enemyText(ctx)).toBe('');
    });

    it('clears the attributes when the chapter is complete', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1, true) });

        expect(enemyText(ctx)).toBe('');
    });

    it('lets clicks through the attribute text', async () => {
        const ctx = await createScene();
        const element = ctx.doms.find((d) => d.node.querySelector('.enemy-stats'));

        expect(element.pointerEvents).toBe('none');
    });

    it('keeps the attributes on a farmed boss that respawns', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('NATURE'), stats('LIGHT', 4, 5, 6)), encounter: 'MINIBOSS' } });

        ctx.control('.farm-toggle input').checked = true;
        killAll(ctx);
        fade(ctx).onComplete();
        ctx.timers.at(-1).callback();

        expect(enemyText(ctx)).toBe('Light  Physical def 4%  Magical def 5%  Crit res 6%');
    });
});

describe('ClickerGame hero screens', () => {
    const bossStart = () => progress(1, 'MINIBOSS', 1);
    const killAll = (ctx) => {
        while (ctx.scene.monster && !ctx.scene.monster.dead)
        {
            ctx.click();
        }
    };
    const tick = (ctx) => ctx.loops[0].callback();
    const testid = (ctx, id) => ctx.control(`[data-testid="${id}"]`);
    const openPanel = async (ctx, screen) => {
        testid(ctx, `hud-${screen}`).click();
        await flush();
    };

    it('shows the five hero buttons in the HUD and none of them in the pause menu', async () => {
        const ctx = await createScene();

        expect([ 'heroes', 'bag', 'fusion', 'leader', 'farm' ].map((id) => testid(ctx, `hud-${id}`)?.textContent)).toEqual([
            'Heróis', 'Mochila', 'Fusão', 'Líder', 'Rever chefes'
        ]);
        expect(ctx.control('.pause-menu').querySelector('[data-testid^="hud-"]')).toBeNull();
    });

    it('shows the three skill slots of the leader, all locked at 0 stars, once the heroes load', async () => {
        const ctx = await createScene();

        expect(ctx.doms.flatMap((d) => [ ...d.node.querySelectorAll('.skill-slot') ])).toHaveLength(3);
        expect(ctx.doms.flatMap((d) => [ ...d.node.querySelectorAll('.skill-slot.is-locked') ])).toHaveLength(3);
        expect(testid(ctx, 'skill-slot-1').querySelector('.skill-slot-cooldown').textContent).toBe('10s');
    });

    it('opening a hero screen freezes the fight and closing it resumes', async () => {
        const ctx = await createScene({ start: bossStart() });

        await openPanel(ctx, 'heroes');
        ctx.click();
        ctx.scene.update(0, 30000);

        expect(ctx.scene.time.paused).toBe(true);
        expect(ctx.scene.tweens.paused).toBe(true);
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth);
        expect(ctx.scene.monster).not.toBeNull();

        testid(ctx, 'hero-close').click();
        ctx.click();

        expect(ctx.scene.time.paused).toBe(false);
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 1);
    });

    it('closing a hero screen does not resume a fight the player paused with Esc', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();
        await openPanel(ctx, 'bag');
        testid(ctx, 'hero-close').click();

        expect(ctx.scene.paused).toBe(true);
        expect(ctx.control('.pause-menu').hidden).toBe(false);
    });

    it('Esc closes an open hero screen first and does not open the pause menu', async () => {
        const ctx = await createScene({ start: bossStart() });

        await openPanel(ctx, 'fusion');
        ctx.handlers['keydown-ESC']();

        expect(ctx.scene.heroUi.isOpen).toBe(false);
        expect(ctx.scene.paused).toBe(false);
        expect(ctx.control('.pause-menu').hidden).toBe(true);

        ctx.handlers['keydown-ESC']();

        expect(ctx.control('.pause-menu').hidden).toBe(false);
    });

    it('a card dropped by an accepted report shows the notice and joins the bag at once', async () => {
        const ctx = await createScene({ start: bossStart() });
        campaignGateway.report.mockResolvedValue({ ...progress(2, 'PHASE', 1), drop: { heroId: 'kael', heroName: 'Hero kael', stars: 0 } });

        killAll(ctx);
        tick(ctx);
        await flush();

        expect(testid(ctx, 'card-notice').textContent).toBe('Carta: Hero kael');
        expect(testid(ctx, 'card-notice').hidden).toBe(false);
        expect(ctx.scene.heroes.heroes()[0].copies[0]).toBe(2);
    });

    it('a report with no drop shows no notice', async () => {
        const ctx = await createScene({ start: bossStart() });

        killAll(ctx);
        tick(ctx);
        await flush();

        expect(testid(ctx, 'card-notice').hidden).toBe(true);
    });

    it('stays playable with no skill bar when the heroes cannot be loaded, and tries again on the next tick', async () => {
        const ctx = await createScene({ heroes: new ApiError('Cannot reach the server. Try again later.') });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(9);
        expect(ctx.doms.flatMap((d) => [ ...d.node.querySelectorAll('.skill-slot') ])).toHaveLength(0);
        expect(heroesGateway.list).toHaveBeenCalledTimes(1);

        tick(ctx);
        await flush();

        expect(heroesGateway.list).toHaveBeenCalledTimes(2);
    });

    it('does not reload the heroes on a tick once they have loaded', async () => {
        const ctx = await createScene();

        tick(ctx);
        await flush();

        expect(heroesGateway.list).toHaveBeenCalledTimes(1);
    });
});

describe('ClickerGame farm mode', () => {
    //  The player is on stage 3, so the miniboss of stages 1 and 2 are beaten
    const midCampaign = () => progress(3, 'PHASE', 1);
    const miniboss = { kind: 'MINIBOSS', stage: 1 };
    const chapterBoss = { kind: 'CHAPTER_BOSS' };
    const label = (ctx) => ctx.hud('.stage-hud').textContent;
    const testid = (ctx, id) => ctx.control(`[data-testid="${id}"]`);
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
    const farmWin = (drop = null, chapterBossWinsLeft = 10) => ({ drop, chapterBossWinsLeft });

    it('fights the beaten boss with its numbers and the farm label, and touches nothing of the campaign', async () => {
        const ctx = await createScene({ start: midCampaign() });

        ctx.scene.startFarm(miniboss);

        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
        expect(ctx.scene.monster.maxHealth).toBe(50);
        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
        expect(ctx.scene.session.encounter()).toMatchObject({ kind: 'PHASE', stage: 3, phase: 1 });
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('a win sends one farm request with the boss, shows the drop and brings the same boss back', async () => {
        const ctx = await createScene({ start: midCampaign() });
        farmGateway.win.mockResolvedValue(farmWin({ heroId: 'kael', heroName: 'Hero kael', stars: 0 }));
        ctx.scene.startFarm(miniboss);

        killAll(ctx);
        await flush();

        expect(farmGateway.win).toHaveBeenCalledTimes(1);
        expect(farmGateway.win).toHaveBeenCalledWith(miniboss);
        expect(testid(ctx, 'card-notice').textContent).toBe('Carta: Hero kael');
        expect(ctx.scene.heroes.heroes()[0].copies[0]).toBe(2);

        advance(ctx);

        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
        expect(ctx.scene.monster.health).toBe(50);
        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
    });

    it('a win reports nothing to the campaign and drops no coins', async () => {
        const ctx = await createScene({ start: midCampaign(), wallet: walletResponse() });
        farmGateway.win.mockResolvedValue(farmWin());
        ctx.scene.startFarm(miniboss);

        killAll(ctx);
        ctx.loops[0].callback();
        await flush();

        expect(ctx.sprites).toHaveLength(0);
        expect(campaignGateway.report).not.toHaveBeenCalled();
        expect(ctx.scene.session.encounter()).toMatchObject({ kind: 'PHASE', stage: 3, phase: 1 });
    });

    it('a boss that survives its time limit comes back with no request and no campaign move', async () => {
        const ctx = await createScene({ start: midCampaign() });
        ctx.scene.startFarm(miniboss);

        ctx.scene.update(0, 30000);
        ctx.timers.at(-1).callback();

        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
        expect(ctx.scene.monster.health).toBe(50);
        expect(farmGateway.win).not.toHaveBeenCalled();
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('Leave fight in a farm fight returns to the campaign encounter without a failed report', async () => {
        const ctx = await createScene({ start: midCampaign() });
        ctx.scene.startFarm(miniboss);

        ctx.handlers['keydown-ESC']();
        ctx.control('.pause-leave').click();
        ctx.control('.pause-confirm-yes').click();

        expect(label(ctx)).toBe('Stage 3/10  Phase 1/5');
        expect(ctx.scene.farmBoss).toBeNull();
        expect(ctx.scene.paused).toBe(false);
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('a chapter boss win that leaves 0 wins today ends the farm and shows the list with 0 left', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1, true) });
        farmGateway.win.mockResolvedValue(farmWin(null, 0));
        farmGateway.get.mockResolvedValue({ bosses: [ miniboss, chapterBoss ], chapterBossWinsLeft: 0 });
        ctx.scene.startFarm(chapterBoss);

        killAll(ctx);
        await flush();

        expect(ctx.scene.farmBoss).toBeNull();
        expect(ctx.hud('.stage-message').textContent).toBe('Chapter complete!');
        expect(ctx.scene.heroUi.isOpen).toBe(true);
        expect(testid(ctx, 'farm-entry-chapter-boss').disabled).toBe(true);
        expect(testid(ctx, 'farm-entry-chapter-boss').textContent).toContain('0 vitórias restantes hoje');
    });

    it('a chapter boss win with wins left keeps the loop going', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1, true) });
        farmGateway.win.mockResolvedValue(farmWin(null, 9));
        ctx.scene.startFarm(chapterBoss);

        killAll(ctx);
        await flush();
        advance(ctx);

        expect(ctx.scene.farmBoss).toBe(chapterBoss);
        expect(label(ctx)).toBe('Rever chefe: Chefe do capítulo');
        expect(ctx.scene.heroUi.isOpen).toBe(false);
    });

    it('a refused win ends the farm without a notice and reloads the farm state', async () => {
        const ctx = await createScene({ start: midCampaign() });
        farmGateway.win.mockRejectedValue(new ApiError('Too fast', { status: 409, code: 'FARM_TOO_FAST' }));
        ctx.scene.startFarm(miniboss);
        const loads = farmGateway.get.mock.calls.length;

        killAll(ctx);
        await flush();

        expect(ctx.scene.farmBoss).toBeNull();
        expect(label(ctx)).toBe('Stage 3/10  Phase 1/5');
        expect(testid(ctx, 'card-notice').hidden).toBe(true);
        expect(farmGateway.get.mock.calls.length).toBe(loads + 1);
    });

    it('a win lost to a network failure keeps the loop going', async () => {
        const ctx = await createScene({ start: midCampaign() });
        farmGateway.win.mockRejectedValue(new ApiError('Cannot reach the server. Try again later.'));
        ctx.scene.startFarm(miniboss);

        killAll(ctx);
        await flush();
        advance(ctx);

        expect(ctx.scene.farmBoss).toBe(miniboss);
        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
    });

    it('a realignment of the campaign during a farm fight does not replace the farm fight', async () => {
        const ctx = await createScene({ start: midCampaign() });
        ctx.scene.startFarm(miniboss);

        ctx.scene.realign({ kind: 'PHASE', stage: 5, phase: 1, health: 14, stats: undefined, timeLimitMs: null, label: 'Stage 5/10  Phase 1/5' });

        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
    });

    it('picking a boss in Rever chefes closes the panel, resumes and starts the farm fight', async () => {
        const ctx = await createScene({ start: midCampaign() });
        testid(ctx, 'hud-farm').click();
        await flush();

        testid(ctx, 'farm-entry-miniboss-1').click();

        expect(ctx.scene.heroUi.isOpen).toBe(false);
        expect(ctx.scene.paused).toBe(false);
        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
    });

    it('does nothing before the campaign has loaded', async () => {
        const ctx = await createScene({ start: new ApiError('Cannot reach the server. Try again later.') });

        ctx.scene.startFarm(miniboss);

        expect(ctx.scene.farmBoss).toBeNull();
    });

    it('stops the fade of the old monster so the next fight is visible', async () => {
        const ctx = await createScene({ start: midCampaign() });

        ctx.scene.startFarm(miniboss);

        expect(ctx.scene.tweens.killTweensOf).toHaveBeenCalledWith(ctx.scene.monsterParts);
    });
});
