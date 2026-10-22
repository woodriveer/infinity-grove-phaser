import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClickerGame } from './ClickerGame';
import { ApiError } from '../../application/ApiError';
import { createCampaignSession } from '../../application/campaign/campaignSession';
import { createEquipmentCollection } from '../../application/equipment/equipmentCollection';
import { createFarmSession } from '../../application/farm/farmSession';
import { createHeroCollection } from '../../application/heroes/heroCollection';
import { createTalentCollection } from '../../application/talents/talentCollection';
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
const talentGateway = { list: vi.fn(), upgrade: vi.fn() };
const equipmentGateway = { list: vi.fn(), equip: vi.fn(), unequip: vi.fn(), refine: vi.fn(), reroll: vi.fn(), sell: vi.fn() };
//  The critical roll: 0.99 never crits a monster of the default stats (10 % chance); a test sets `dice.value` to force one
const dice = { value: 0.99 };
const services = {
    random: () => dice.value,
    createWalletSync: () => createWalletSync({ gateway: walletApi }),
    createCampaignSession: () => createCampaignSession({ gateway: campaignGateway }),
    createHeroCollection: () => createHeroCollection({ gateway: heroesGateway }),
    createEquipmentCollection: () => createEquipmentCollection({ gateway: equipmentGateway }),
    createTalentCollection: () => createTalentCollection({ gateway: talentGateway }),
    createFarmSession: () => createFarmSession({ gateway: farmGateway })
};

//  The drop rules of chapter 1: monster 1, miniboss 2, boss 3
const definition = {
    bossHealth: 300,
    bossTimeLimitMs: 60000,
    bossDropRuleId: 3,
    stages: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1, phasesPerStage: 5, monsterHealth: 10 + i, minibossHealth: 50 + 5 * i, minibossTimeLimitMs: 30000,
        monsterDropRuleId: 1, minibossDropRuleId: 2
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
//  The COMBO talent at its top level (cap 50 %), which the scenes get unless a test gives its own tree
const COMBO_MAXED = { id: 'COMBO', branch: 'COMBO', perLevel: 5, maxLevel: 10, level: 10, value: 50, nextCost: null };

const createScene = async ({ wallet, start = progress(), heroes = heroesResponse(), equipment = { capacity: 100, pieces: [] }, talents = [ COMBO_MAXED ] } = {}) => {
    dice.value = 0.99;
    Object.values(equipmentGateway).forEach((mock) => mock.mockReset());
    equipmentGateway.list.mockImplementation(() => (equipment instanceof Error ? Promise.reject(equipment) : Promise.resolve(equipment)));
    talentGateway.list.mockReset();
    talentGateway.upgrade.mockReset();
    talentGateway.list.mockImplementation(() => (talents instanceof Error ? Promise.reject(talents) : Promise.resolve({ talents })));
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
    const images = [];
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
        image: vi.fn((x, y, key) => {
            const image = { x, y, key, height: 400, scale: 1 };

            image.setOrigin = () => image;
            image.setTexture = (texture) => { image.key = texture; return image; };
            image.setScale = (value) => { image.scale = value; return image; };
            images.push(image);
            return image;
        }),
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
            element.setDepth = vi.fn(() => element);
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
    const monster = byColor(0xf5ead8)[0];
    const fill = byColor(0xc67139)[0];
    const back = byColor(0xdcd3c4)[0];

    const walletText = () => doms.map((d) => d.node.querySelector('.wallet')).find(Boolean);
    const control = (selector) => doms.map((d) => d.node.querySelector(selector)).find(Boolean);
    const hud = (selector) => doms.map((d) => d.node.querySelector(selector)).find(Boolean);
    const walletElement = () => doms.find((d) => d.node.querySelector('.wallet'));

    return { scene, images, rectangles, texts, tweens, timers, loops, eventHandlers, sprites, doms, click, monster, fill, back, byColor, walletText, walletElement, hud, control, handlers, dice };
};

describe('ClickerGame scene', () => {
    it('shows the leader hero and one monster, and no coins yet', async () => {
        const { scene, rectangles, byColor, images } = await createScene();

        expect(byColor(0x000000)).toHaveLength(0);
        expect(byColor(0xf5ead8)).toHaveLength(1);
        expect(rectangles).toHaveLength(3); //  monster, health bar back, health bar fill
        expect(images.filter((image) => image.key.startsWith('hero_')).map((image) => image.key)).toEqual([ 'hero_kael' ]);
        expect(scene.add.text).not.toHaveBeenCalled();
        expect(scene.physics).toBeUndefined();
    });

    it('scales the hero to 320 px high and stands it on the ground line, left of the monster', async () => {
        const { scene } = await createScene();

        expect(scene.character).toMatchObject({ x: 230, y: 612, scale: 320 / 400 });
    });

    it('swaps the sprite when the leader changes', async () => {
        const { scene, images } = await createScene();
        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });

        await scene.heroes.setLeader('lyra');

        expect(scene.character.key).toBe('hero_lyra');
        expect(images.filter((image) => image.key.startsWith('hero_') || image === scene.character)).toHaveLength(1);
    });

    it('shows no hero while the heroes cannot be loaded', async () => {
        const { scene, images } = await createScene({ heroes: new Error('down') });

        expect(scene.character).toBeNull();
        expect(images.some((image) => image.key.startsWith('hero_'))).toBe(false);
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
    it('is centred above the monster and 240 px wide at full health', async () => {
        const { monster, fill, back } = await createScene();

        expect(back.x + back.width / 2).toBe(monster.x);
        expect(fill.x).toBe(back.x);
        expect(fill.y).toBe(back.y);
        expect(fill.width).toBe(240);
        expect(back.width).toBe(240);
        expect(back.y + back.height).toBe(monster.y - monster.height / 2 - 18);
    });

    it('shrinks the fill to 216 px after one click', async () => {
        const { fill, click } = await createScene();

        click();

        expect(fill.width).toBe(216);
    });
});

describe('ClickerGame chapter and health text', () => {
    const chapter = (ctx) => ctx.hud('.chapter-hud').textContent;
    const hp = (ctx) => ctx.hud('.monster-hp').textContent;
    const bigMonster = (health) => ({ ...progress(), definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: health })) } });
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

    it('shows the chapter of the player position', async () => {
        const ctx = await createScene({ start: { ...progress(), chapter: 2 } });

        expect(chapter(ctx)).toBe('Capítulo 2');
    });

    it('shows the next chapter when the backend opens it', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });
        campaignGateway.report.mockResolvedValue({ ...progress(1, 'PHASE', 1), chapter: 2 });

        killAll(ctx);
        advance(ctx);
        await flush();

        expect(chapter(ctx)).toBe('Capítulo 2');
    });

    it('shows the full health of a new monster', async () => {
        const ctx = await createScene({ start: bigMonster(30) });

        expect(hp(ctx)).toBe('HP 30/30');
    });

    it('reads HP 10/30 after 20 damage', async () => {
        const ctx = await createScene({ start: bigMonster(30) });

        ctx.scene.monster.hit(20);
        ctx.scene.updateHealthBar();

        expect(hp(ctx)).toBe('HP 10/30');
        expect(ctx.fill.width).toBe(80);
    });

    it('follows a click in the frame of the hit, like the bar', async () => {
        const ctx = await createScene({ start: bigMonster(30) });

        ctx.click();

        expect(hp(ctx)).toBe('HP 29/30');
        expect(ctx.fill.width).toBe(232);
    });

    it('rounds a fractional health left up to one decimal', async () => {
        const ctx = await createScene({ start: bigMonster(10) });

        ctx.scene.monster.hit(9.96);
        ctx.scene.updateHealthBar();

        expect(hp(ctx)).toBe('HP 0.1/10');
    });

    it('is centred on the health bar and as wide as the bar', async () => {
        const ctx = await createScene();
        const element = ctx.doms.find((dom) => dom.node.querySelector('.monster-hp'));

        expect(element.x).toBe(ctx.back.x + ctx.back.width / 2);
        expect(element.y).toBe(ctx.back.y + ctx.back.height / 2);
    });

    it('shows the full health of the next monster', async () => {
        const ctx = await createScene();

        killAll(ctx);
        advance(ctx);

        expect(hp(ctx)).toBe('HP 10/10');
    });

    it('hides the text when the chapter is complete and no monster is on screen', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });

        killAll(ctx);
        advance(ctx);

        expect(hp(ctx)).toBe('');
    });
});

describe('ClickerGame HP text after skills', () => {
    const big = () => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000 })) }
    });
    const hp = (ctx) => ctx.hud('.monster-hp').textContent;

    it('follows a skill hit that does not kill: Corte Dimensional of a 1 star Kael reads HP 983.5/1000 and moves the bar', async () => {
        const ctx = await createScene({ start: big(), heroes: { leaderId: 'kael', heroes: [ heroEntry('kael', { 1: 1 }, 1) ] } });

        ctx.scene.useSkill(1);

        expect(hp(ctx)).toBe('HP 983.5/1000');
        expect(ctx.fill.width).toBeCloseTo(240 * 983.5 / 1000, 10);
    });

    it('follows a damage tick that does not kill: Tempestade Arcana of a 2 star Orina reads HP 997.6/1000 and moves the bar', async () => {
        const ctx = await createScene({ start: big(), heroes: { leaderId: 'orina', heroes: [ heroEntry('orina', { 2: 1 }, 2) ] } });

        ctx.scene.useSkill(2);
        ctx.scene.update(0, 1000);

        expect(hp(ctx)).toBe('HP 997.6/1000');
        expect(ctx.fill.width).toBeCloseTo(240 * 997.6 / 1000, 10);
    });

    it('shows the chapter and the HP text while the heroes have not loaded', async () => {
        const ctx = await createScene({ start: { ...big(), chapter: 3 }, heroes: new Error('down') });

        expect(ctx.hud('.chapter-hud').textContent).toBe('Capítulo 3');
        expect(hp(ctx)).toBe('HP 1000/1000');
    });
});

describe('ClickerGame element wheel', () => {
    it('shows the element wheel without blocking clicks', async () => {
        const ctx = await createScene();
        const element = ctx.doms.find((dom) => dom.node.querySelector('[data-testid="element-wheel"]'));

        expect(element).toBeDefined();
        expect(element.pointerEvents).toBe('none');
    });

    it('keeps the wheel on screen while a hero screen is open', async () => {
        const ctx = await createScene();

        await ctx.scene.heroUi.show('heroes');

        expect(ctx.hud('[data-testid="element-wheel"]')).not.toBeNull();
        expect(ctx.hud('[data-testid="element-wheel"]').closest('[hidden]')).toBeNull();
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
        //  The tenth click of a streak carries the combo of the nine before it: +9 %, 1.09 shown with one decimal
        expect(ctx.texts[9].text).toBe('1.1');
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

    it('spawns a monster with health 10, alpha 1 and a 240 px bar when the wait ends', async () => {
        const ctx = await createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        [ ctx.monster, ctx.back, ctx.fill ].forEach((part) => { part.alpha = 0; });

        ctx.timers[0].callback();

        expect(ctx.scene.monster.health).toBe(10);
        expect([ ctx.monster.alpha, ctx.back.alpha, ctx.fill.alpha ]).toEqual([ 1, 1, 1 ]);
        expect(ctx.fill.width).toBe(240);
    });

    it('takes 1 damage per click again after the respawn', async () => {
        const ctx = await createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        ctx.timers[0].callback();
        //  The combo of the kill lapses after 1.5 s without a click: the next click is a plain one
        ctx.scene.update(0, 1500);

        ctx.click();

        expect(ctx.scene.monster.health).toBe(9);
        expect(ctx.fill.width).toBe(216);
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

    it('shows "Gold: G  Silver: S  Copper: C" in the top-right corner once the wallet has loaded', async () => {
        const { walletText, walletElement } = await createScene({ wallet: walletResponse() });
        await flush();

        expect(walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
        expect(walletElement().visible).toBe(true);
        expect(walletElement().x).toBeGreaterThan(512);
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
            expect([ coin.x, coin.y, coin.key, coin.anim ]).toEqual([ 670, 440, 'coin', 'rotate' ]);
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

    it('flies at most 5 coins for a drop above 5 copper and still credits the whole drop', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [12] }));

        kill(ctx);
        landAll(ctx);

        expect(ctx.sprites).toHaveLength(5);
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 49');
    });

    it('flies 5 coins for a drop of 2 silver and credits 200 copper', async () => {
        const ctx = await loadedScene(walletResponse({ gold: 0, silver: 0, copper: 0 }, { 1: [200] }));

        kill(ctx);
        landAll(ctx);

        expect(ctx.sprites).toHaveLength(5);
        expect(ctx.walletText().textContent).toBe('Gold: 0  Silver: 2  Copper: 0');
    });

    it('drops nothing when the wallet has not loaded', async () => {
        const ctx = await createScene();

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
    });

    it('drops nothing when the queue of the drop rule of the encounter is empty', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
    });

    it('drops nothing when the backend sent no queue for the drop rule of the encounter', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 2: [5] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
    });

    it('reads the queue of the drop rule of the monster', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3], 2: [2] }));
        ctx.scene.monster.dropRuleId = 2;

        kill(ctx);

        expect(ctx.sprites).toHaveLength(2);
    });

    it('a phase monster takes from the queue of the monster drop rule of its stage', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3], 2: [7], 3: [9] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(3);
    });

    it('drops nothing when the encounter has no drop rule', async () => {
        const stages = definition.stages.map(({ monsterDropRuleId, minibossDropRuleId, ...stage }) => stage);
        const ctx = await createScene({
            start: { ...progress(), definition: { bossHealth: 300, bossTimeLimitMs: 60000, stages } },
            wallet: walletResponse(undefined, { 1: [3], 2: [7], 3: [9] })
        });
        await flush();

        kill(ctx);

        expect(ctx.sprites).toHaveLength(0);
        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 37');
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
        ctx.tweens.filter((t) => ctx.sprites.includes(t.targets)).forEach((t) => t.onComplete());
        respawn(ctx);

        kill(ctx);
        ctx.tweens.filter((t) => ctx.sprites.includes(t.targets)).forEach((t) => t.onComplete());

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 47');
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

    it('sends the chapter boss win at once and plays the next chapter the backend opens, without the completion message', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });
        campaignGateway.report.mockResolvedValue({ ...progress(1, 'PHASE', 1), chapter: 2 });

        killAll(ctx);
        advance(ctx);

        expect(campaignGateway.report).toHaveBeenCalledWith({ chapter: 1, stage: 10, encounter: 'CHAPTER_BOSS', phase: 1 }, 'CLEARED');

        await flush();

        expect(message(ctx)).toBe('');
        expect(label(ctx)).toBe('Stage 1/10  Phase 1/5');
        expect(ctx.scene.monster.dead).toBe(false);
        expect(ctx.monster.alpha).toBe(1);
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

    it('a miniboss kill takes from the queue of the miniboss drop rule', async () => {
        const ctx = await createScene({ start: bossStart(), wallet: walletResponse(undefined, { 1: [ 4, 1, 5 ], 2: [ 7, 6 ], 3: [ 9 ] }) });
        await flush();

        killAll(ctx);
        ctx.tweens.filter((t) => ctx.sprites.includes(t.targets)).forEach((t) => t.onComplete());

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 44');
    });

    it('a chapter boss kill takes from the queue of the boss drop rule', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), wallet: walletResponse(undefined, { 1: [ 4 ], 2: [ 7 ], 3: [ 9, 2 ] }) });
        await flush();

        killAll(ctx);
        ctx.tweens.filter((t) => ctx.sprites.includes(t.targets)).forEach((t) => t.onComplete());

        expect(ctx.walletText().textContent).toBe('Gold: 2  Silver: 14  Copper: 46');
    });

    it('a miniboss kill drops nothing when its drop rule has no queue', async () => {
        const ctx = await createScene({ start: bossStart(), wallet: walletResponse(undefined, { 1: [ 4, 1, 5 ] }) });
        await flush();

        killAll(ctx);

        expect(ctx.sprites).toHaveLength(0);
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

    it('sends the CLEARED report as soon as the kill happens, without waiting for a tick', async () => {
        const ctx = await createScene();

        killAll(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
    });

    it('sends the CLEARED report with the position it left', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
        expect(campaignGateway.report).toHaveBeenCalledWith(at(1, 'PHASE', 1), 'CLEARED');
    });

    it('sends several kills in order, one report each', async () => {
        const ctx = await createScene();
        killAll(ctx);
        advance(ctx);
        await flush();
        killAll(ctx);
        advance(ctx);
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
        campaignGateway.report.mockRejectedValueOnce(new ApiError('Cannot reach the server. Try again later.'));
        killAll(ctx);
        advance(ctx);
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
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(1, 'PHASE', 4)));
        killAll(ctx);
        await flush();

        expect(label(ctx)).toBe('Stage 1/10  Phase 4/5');
        expect(ctx.scene.monster.health).toBe(10);
        expect(ctx.monster.alpha).toBe(1);
    });

    it('does not resend the voided reports after a 409', async () => {
        const ctx = await createScene();
        let refuse;
        campaignGateway.report.mockReturnValueOnce(new Promise((resolve, reject) => { refuse = () => reject(conflict(progress(1, 'PHASE', 4))); }));
        killAll(ctx);
        advance(ctx);
        killAll(ctx);
        advance(ctx);
        refuse();
        await flush();
        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
    });

    it('realigns to a boss with its countdown when the stored position is a boss', async () => {
        const ctx = await createScene();
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(3, 'MINIBOSS', 1)));
        killAll(ctx);
        advance(ctx);
        await flush();

        expect(label(ctx)).toBe('Stage 3/10  Miniboss');
        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
    });

    it('does not spawn a stale encounter when a realignment happens while the monster fades', async () => {
        const ctx = await createScene();
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(2, 'PHASE', 1)));
        killAll(ctx);
        await flush();

        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();

        expect(ctx.timers).toHaveLength(0);
        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
    });

    it('does not spawn a stale encounter when a realignment happens during the respawn wait', async () => {
        const ctx = await createScene();
        campaignGateway.report.mockRejectedValueOnce(conflict(progress(2, 'PHASE', 1)));
        killAll(ctx);
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
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

    it('hits with the element of the leader: nature on a fire monster deals half, water deals double', async () => {
        const asLeader = (element) => ({
            leaderId: 'kael',
            heroes: [ { ...heroEntry('kael', { 0: 1 }), element }, heroEntry('lyra'), heroEntry('orina') ]
        });
        const nature = await createScene({ start: withStats(stats('FIRE')), heroes: asLeader('NATURE') });
        const water = await createScene({ start: withStats(stats('FIRE')), heroes: asLeader('WATER') });

        nature.click();
        water.click();

        expect(nature.scene.monster.health).toBe(nature.scene.monster.maxHealth - 0.5);
        expect(water.scene.monster.health).toBe(water.scene.monster.maxHealth - 2);
    });

    it('applies the physical defense of the monster', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE', 50, 10)) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.5);
    });

    it('doubles the damage on a critical click and draws that number bigger and peach', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });
        ctx.dice.value = 0;

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 2);
        expect(ctx.texts[0].text).toBe('2');
        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ color: '#ffc6a5', fontSize: 48 }));
    });

    it('draws a normal click cream and 32 px', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });

        ctx.click();

        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ color: '#f5ead8', fontSize: 32 }));
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

describe('ClickerGame equipment', () => {
    const stats = (element, physicalDefense = 0) => ({ element, physicalDefense, magicalDefense: 0, critResistance: 0 });
    const monsterOf = (monster, miniboss = monster) => ({
        ...progress(),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monster, miniboss })) }
    });
    const piece = (extra = {}) => ({
        id: 'p1', slot: 'RING', rarity: 'COMMON', refine: 0, heroId: 'kael', sellPrice: 100, refineCost: 500, rerollCost: null, affixes: [], ...extra
    });
    const weapon = (clickDamage = 3, extra = {}) => piece({ id: 'w1', slot: 'WEAPON', clickDamage, ...extra });
    const affixPiece = (type, value, extra = {}) => piece({ id: `a-${type}`, affixes: [ { type, value } ], ...extra });
    const list = (...pieces) => ({ capacity: 100, pieces });
    const fire = () => monsterOf(stats('FIRE'));
    const miniboss = (boss) => ({ ...progress(1, 'MINIBOSS', 1), definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, miniboss: boss })) } });
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
    const testid = (ctx, id) => ctx.doms.map((d) => d.node.querySelector(`[data-testid="${id}"]`)).find(Boolean);

    it('loads the equipment once when the scene starts', async () => {
        await createScene();

        expect(equipmentGateway.list).toHaveBeenCalledTimes(1);
    });

    it('hits for 1 plus the click damage of the weapon the leader wears: a weapon of 3 hits for 4', async () => {
        const ctx = await createScene({ start: fire(), equipment: list(weapon(3)) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 4);
        expect(ctx.texts[0].text).toBe('4');
    });

    it('multiplies by the click damage percent of the other pieces: a ring of 10 % makes 4.4', async () => {
        const ctx = await createScene({ start: fire(), equipment: list(weapon(3), affixPiece('CLICK_DAMAGE_PCT', 10)) });

        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(ctx.scene.monster.maxHealth - 4.4, 10);
        expect(ctx.texts[0].text).toBe('4.4');
    });

    it('ignores the pieces worn by another hero and the pieces in the bag', async () => {
        const ctx = await createScene({
            start: fire(),
            equipment: list(weapon(3, { heroId: 'lyra' }), weapon(5, { id: 'w2', heroId: null }))
        });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 1);
    });

    it('uses the pieces of the new leader after the leader changes', async () => {
        const ctx = await createScene({ start: fire(), equipment: list(weapon(3, { heroId: 'lyra' })) });
        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });

        await ctx.scene.heroes.setLeader('lyra');
        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 4);
    });

    it('adds the critical chance of the pieces', async () => {
        const ctx = await createScene({ start: fire(), equipment: list(affixPiece('CRIT_CHANCE', 5)) });
        ctx.dice.value = 0.1499;

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 2);
    });

    it('ignores part of the monster defense with armor pierce: 50 % of a 50 defense leaves 25', async () => {
        const ctx = await createScene({ start: monsterOf(stats('FIRE', 50)), equipment: list(affixPiece('ARMOR_PIERCE_PCT', 50)) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.75);
    });

    it('adds the boss damage only against a boss', async () => {
        const phase = await createScene({ start: fire(), equipment: list(affixPiece('BOSS_DAMAGE_PCT', 20)) });
        const boss = await createScene({ start: miniboss(stats('FIRE')), equipment: list(affixPiece('BOSS_DAMAGE_PCT', 20)) });

        phase.click();
        boss.click();

        expect(phase.scene.monster.health).toBe(phase.scene.monster.maxHealth - 1);
        expect(boss.scene.monster.health).toBeCloseTo(boss.scene.monster.maxHealth - 1.2, 10);
    });

    it('adds the extra boss seconds of the pieces to the countdown of a boss', async () => {
        const ctx = await createScene({ start: progress(1, 'PHASE', 5), equipment: list(affixPiece('BOSS_TIME_SECONDS', 5)) });

        killAll(ctx);
        advance(ctx);

        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 35');
    });

    it('keeps the plain countdown without the extra seconds', async () => {
        const ctx = await createScene({ start: progress(1, 'PHASE', 5) });

        killAll(ctx);
        advance(ctx);

        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
    });

    it('fights with the base attacker when the equipment cannot be loaded, and tries again on the next tick', async () => {
        const ctx = await createScene({ start: fire(), equipment: new ApiError('down', { status: 500 }) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 1);
        expect(equipmentGateway.list).toHaveBeenCalledTimes(1);

        equipmentGateway.list.mockResolvedValue(list(weapon(3)));
        tick(ctx);
        await flush();
        ctx.click();

        expect(equipmentGateway.list).toHaveBeenCalledTimes(2);
        //  The second click of the streak carries +1 % of combo: 4 x 1.01
        expect(ctx.scene.monster.health).toBeCloseTo(ctx.scene.monster.maxHealth - 1 - 4.04, 10);
    });

    it('shows the notice and joins the list for a piece dropped by an accepted report', async () => {
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1) });
        campaignGateway.report.mockResolvedValue({
            ...progress(2, 'PHASE', 1), equipmentDrop: { piece: piece({ id: 'new', rarity: 'RARE', slot: 'WEAPON', heroId: null }), sold: false }
        });

        killAll(ctx);
        tick(ctx);
        await flush();

        expect(testid(ctx, 'card-notice').textContent).toBe('Equipamento encontrado: Raro Arma');
        expect(testid(ctx, 'card-notice').hidden).toBe(false);
        expect(ctx.scene.equipment.pieces().map(({ id }) => id)).toEqual([ 'new' ]);
    });

    it('reads the tree again for a report that paid 2 points', async () => {
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1) });
        campaignGateway.report.mockResolvedValue({ ...progress(2, 'PHASE', 1), talentPoints: 2 });
        const reads = talentGateway.list.mock.calls.length;

        killAll(ctx);
        tick(ctx);
        await flush();

        expect(testid(ctx, 'card-notice').hidden).toBe(true);
        expect(talentGateway.list.mock.calls.length).toBe(reads + 1);
    });

    it('shows no notice for the talent points of a first clear', async () => {
        const one = await createScene({ start: progress(1, 'MINIBOSS', 1) });
        campaignGateway.report.mockResolvedValue({ ...progress(2, 'PHASE', 1), talentPoints: 1 });

        killAll(one);
        tick(one);
        await flush();

        expect(testid(one, 'card-notice').hidden).toBe(true);

        const none = await createScene({ start: progress(1, 'MINIBOSS', 1) });
        campaignGateway.report.mockResolvedValue({ ...progress(2, 'PHASE', 1), talentPoints: 0 });

        killAll(none);
        tick(none);
        await flush();

        expect(testid(none, 'card-notice').hidden).toBe(true);
    });

    it('shows the notice but adds no piece when the bag was full and the piece was sold', async () => {
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1) });
        campaignGateway.report.mockResolvedValue({
            ...progress(2, 'PHASE', 1), equipmentDrop: { piece: piece({ id: 'new', rarity: 'EPIC', slot: 'AMULET', heroId: null }), sold: true }
        });

        killAll(ctx);
        tick(ctx);
        await flush();

        expect(testid(ctx, 'card-notice').textContent).toBe('Equipamento encontrado: Épico Amuleto');
        expect(ctx.scene.equipment.pieces()).toEqual([]);
    });

    it('shows no equipment notice for a report that dropped no piece', async () => {
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1) });

        killAll(ctx);
        tick(ctx);
        await flush();

        expect(testid(ctx, 'card-notice').hidden).toBe(true);
    });

    it('shows the notice for a piece dropped by a farm win', async () => {
        const ctx = await createScene();
        const boss = { kind: 'MINIBOSS', stage: 1 };
        farmGateway.win.mockResolvedValue({
            drop: null, chapterBossWinsLeft: 10, equipmentDrop: { piece: piece({ id: 'farm', rarity: 'COMMON', slot: 'RING', heroId: null }), sold: false }
        });

        await ctx.scene.reportFarmWin(boss);

        expect(testid(ctx, 'card-notice').textContent).toBe('Equipamento encontrado: Comum Anel');
        expect(ctx.scene.equipment.pieces().map(({ id }) => id)).toEqual([ 'farm' ]);
    });

    it('shows the wallet the backend answered after a refine', async () => {
        const ctx = await createScene({ wallet: walletResponse(), equipment: list(weapon(3, { heroId: null })) });
        equipmentGateway.refine.mockResolvedValue({ equipment: list(weapon(3.3, { heroId: null, refine: 1 })), wallet: { gold: 2, silver: 9, copper: 37 } });

        await ctx.scene.equipment.refine('w1');

        expect(ctx.walletText().querySelector('.coin-silver').textContent).toBe('9');
        expect(ctx.walletText().querySelector('.coin-copper').textContent).toBe('37');
    });

    it('opens the equipment screen from the HUD and tells it how much copper the wallet holds', async () => {
        const ctx = await createScene({ wallet: walletResponse({ gold: 0, silver: 4, copper: 99 }), equipment: list(weapon(3, { heroId: null, refineCost: 500 })) });
        await flush();

        testid(ctx, 'hud-equipment').click();
        await flush();
        testid(ctx, 'equip-piece-w1').click();

        expect(testid(ctx, 'piece-refine').disabled).toBe(true);
    });
});

describe('ClickerGame skills', () => {
    const bigHealth = (encounter = 'PHASE', phase = 1) => ({
        ...progress(1, encounter, phase),
        definition: {
            ...definition,
            stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000, minibossHealth: 1000 }))
        }
    });
    const leaderOf = (id, stars, extra = {}) => ({
        leaderId: id,
        heroes: [ heroEntry(id, { [stars]: 1 }, stars), heroEntry('lyra'), heroEntry('orina') ].map((hero) => ({ ...hero, ...extra }))
    });
    const slot = (ctx, number) => ctx.control(`[data-testid="skill-slot-${number}"]`);
    const slotText = (ctx, number) => slot(ctx, number).querySelector('.skill-slot-cooldown').textContent;
    const key = (ctx, name) => ctx.handlers[`keydown-${name}`]();
    const timer = (ctx) => ctx.hud('.boss-timer').textContent;
    const tags = (ctx) => ctx.hud('.effect-tags').textContent;
    const tick = (ctx) => ctx.loops[0].callback();
    const fadeAndRespawn = (ctx) => {
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
    };

    it('uses the skill of slot 1 on the key 1: 16.5 damage (15 plus the 10 % bonus of 1 star), its number on screen and a 20 s cooldown on the slot', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        key(ctx, 'ONE');

        expect(ctx.scene.monster.health).toBe(983.5);
        expect(ctx.texts.at(-1).text).toBe('16.5');
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('cooling');
        expect(slotText(ctx, 1)).toBe('20s');
    });

    it('uses the skills of slots 2 and 3 on the keys 2 and 3', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 3) });

        key(ctx, 'TWO');
        key(ctx, 'THREE');

        expect(ctx.scene.monster.health).toBe(994.4);
        expect(slot(ctx, 2).getAttribute('data-state')).toBe('cooling');
        expect(slot(ctx, 3).getAttribute('data-state')).toBe('cooling');
    });

    it('uses a skill when its slot is clicked', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        slot(ctx, 1).click();

        expect(ctx.scene.monster.health).toBe(983.5);
    });

    it('ignores the skill while it cools and counts the cooldown down with the scene update', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        key(ctx, 'ONE');
        key(ctx, 'ONE');
        expect(ctx.scene.monster.health).toBe(983.5);

        ctx.scene.update(0, 5001);
        expect(slotText(ctx, 1)).toBe('15s');

        ctx.scene.update(0, 15000);
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('ready');
        expect(slotText(ctx, 1)).toBe('10s');
    });

    it('ignores the key of a locked slot and of a leader with no star', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 0) });

        key(ctx, 'ONE');
        expect(ctx.scene.monster.health).toBe(1000);
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('locked');

        const two = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        key(two, 'TWO');
        expect(two.scene.monster.health).toBe(1000);
    });

    it('ignores the keys while the heroes have not loaded', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: new Error('down') });

        key(ctx, 'ONE');

        expect(ctx.scene.monster.health).toBe(1000);
    });

    it('ignores the keys while the fight is paused with Esc, and the pause freezes the cooldowns', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 3) });

        key(ctx, 'ONE');
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 10000);
        key(ctx, 'TWO');

        expect(slotText(ctx, 1)).toBe('20s');
        expect(ctx.scene.monster.health).toBe(979);
    });

    it('ignores the keys while a hero screen is open', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        ctx.control('[data-testid="hud-heroes"]').click();
        await flush();
        key(ctx, 'ONE');

        expect(ctx.scene.monster.health).toBe(1000);
    });

    it('ignores the keys when there is no monster on screen', async () => {
        const ctx = await createScene({ start: new Error('down'), heroes: leaderOf('kael', 1) });

        expect(() => key(ctx, 'ONE')).not.toThrow();
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('ready');
    });

    it('ignores the keys once the chapter is complete', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1, true), heroes: leaderOf('kael', 1) });

        expect(() => key(ctx, 'ONE')).not.toThrow();
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('ready');
    });

    it('handles a skill kill like a click kill: coins fly, the monster fades and the CLEARED report goes on the next tick', async () => {
        const ctx = await createScene({ wallet: walletResponse(undefined, { 1: [ 3 ] }), heroes: leaderOf('kael', 1) });
        await flush();

        key(ctx, 'ONE');

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.sprites).toHaveLength(3);
        expect(ctx.tweens.some((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500)).toBe(true);

        fadeAndRespawn(ctx);
        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledWith({ chapter: 1, stage: 1, encounter: 'PHASE', phase: 1 }, 'CLEARED');
    });

    it('handles the kill of a tick like a click kill', async () => {
        const start = bigHealth();

        start.definition = { ...start.definition, stages: start.definition.stages.map((stage) => ({ ...stage, monsterHealth: 3 })) };

        const ctx = await createScene({ start, heroes: leaderOf('orina', 2) });

        key(ctx, 'TWO');
        ctx.scene.update(0, 1000);
        expect(ctx.scene.monster.dead).toBe(false);
        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.tweens.some((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500)).toBe(true);
        expect(ctx.texts.map((text) => text.text)).toEqual([ '2.4', '2.4' ]);
    });

    it('adds the click bonus of Ventos Ligeiros to the click and shows the effect tag with its seconds', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('lyra', 3) });

        key(ctx, 'THREE');
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('2.1');
        expect(tags(ctx)).toBe('Ventos Ligeiros 12s');

        ctx.scene.update(0, 12000);
        expect(tags(ctx)).toBe('');
    });

    it('keeps the effects across the death of the monster', async () => {
        const ctx = await createScene({ start: progress(), heroes: leaderOf('lyra', 3) });

        key(ctx, 'THREE');
        ctx.scene.update(0, 1000);
        while (!ctx.scene.monster.dead) {
            ctx.click();
        }
        ctx.scene.update(0, 1000);

        expect(tags(ctx)).toBe('Ventos Ligeiros 10s');
    });

    it('stops the boss countdown with Investida do Baluarte for 3 s', async () => {
        const ctx = await createScene({ start: bigHealth('MINIBOSS'), heroes: leaderOf('kael', 2) });

        key(ctx, 'TWO');
        ctx.scene.update(0, 3000);
        expect(timer(ctx)).toBe('Time: 30');

        ctx.scene.update(0, 1001);
        expect(timer(ctx)).toBe('Time: 29');
    });

    it('adds 4 s to the boss countdown with Carrilhão da Aurora', async () => {
        const ctx = await createScene({ start: bigHealth('MINIBOSS'), heroes: leaderOf('seraphine', 3) });

        key(ctx, 'THREE');

        expect(timer(ctx)).toBe('Time: 34');
    });

    it('leaves a phase monster without countdown when Carrilhão is used', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('seraphine', 3) });

        key(ctx, 'THREE');

        expect(timer(ctx)).toBe('');
        expect(slot(ctx, 3).getAttribute('data-state')).toBe('cooling');
    });

    it('lets the boss leave when its countdown reaches 0 even with a skill running', async () => {
        const ctx = await createScene({ start: bigHealth('MINIBOSS'), heroes: leaderOf('lyra', 3) });

        key(ctx, 'THREE');
        ctx.scene.update(0, 30001);

        expect(timer(ctx)).toBe('');
        expect(ctx.scene.monster).toBeNull();
    });
});

describe('ClickerGame click combo', () => {
    const big = (health = 1000) => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: health })) }
    });
    const combo = (ctx) => ctx.hud('.combo-hud').textContent;
    const clickTimes = (ctx, times) => Array.from({ length: times }, () => ctx.click());

    it('shows nothing before the first click', async () => {
        const ctx = await createScene({ start: big() });

        expect(combo(ctx)).toBe('');
    });

    it('deals the 11th click of a streak 1.1 and reads Combo x11 · +11%', async () => {
        const ctx = await createScene({ start: big() });

        clickTimes(ctx, 11);

        expect(ctx.texts.at(-1).text).toBe('1.1');
        expect(combo(ctx)).toBe('Combo x11 · +11%');
    });

    it('stops at +50 %: the 51st click deals 1.5 and so does the 60th', async () => {
        const ctx = await createScene({ start: big() });

        clickTimes(ctx, 51);
        expect(ctx.texts.at(-1).text).toBe('1.5');

        clickTimes(ctx, 9);
        expect(ctx.texts.at(-1).text).toBe('1.5');
        expect(combo(ctx)).toBe('Combo x60 · +50%');
    });

    it('keeps the streak at 1499 ms and ends it at 1500 ms, hiding the text', async () => {
        const kept = await createScene({ start: big() });
        const ended = await createScene({ start: big() });

        clickTimes(kept, 5);
        clickTimes(ended, 5);
        kept.scene.update(0, 1499);
        ended.scene.update(0, 1500);

        expect(combo(kept)).toBe('Combo x5 · +5%');
        expect(combo(ended)).toBe('');
    });

    it('restarts at a plain click after the streak ended', async () => {
        const ctx = await createScene({ start: big() });

        clickTimes(ctx, 20);
        ctx.scene.update(0, 1500);
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1');
        expect(combo(ctx)).toBe('Combo x1 · +1%');
    });

    it('freezes the 1500 ms while the fight is paused', async () => {
        const ctx = await createScene({ start: big() });

        clickTimes(ctx, 5);
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 10000);
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 1499);

        expect(combo(ctx)).toBe('Combo x5 · +5%');
    });

    it('freezes the 1500 ms while a hero screen is open', async () => {
        const ctx = await createScene({ start: big() });

        clickTimes(ctx, 5);
        ctx.control('[data-testid="hud-heroes"]').click();
        await flush();
        ctx.scene.update(0, 10000);

        expect(combo(ctx)).toBe('Combo x5 · +5%');
    });

    it('keeps the streak and its timer when a skill is used, and gives the skill hit no combo', async () => {
        const ctx = await createScene({ start: big(), heroes: { leaderId: 'kael', heroes: [ heroEntry('kael', { 1: 1 }, 1) ] } });

        clickTimes(ctx, 11);
        ctx.scene.update(0, 1000);
        ctx.scene.useSkill(1);

        expect(combo(ctx)).toBe('Combo x11 · +11%');
        //  Corte Dimensional is 1500 % of 1.1 (1 star), with no combo on top
        expect(ctx.texts.at(-1).text).toBe('16.5');

        ctx.scene.update(0, 499);
        expect(combo(ctx)).toBe('Combo x11 · +11%');

        //  1000 + 499 + 1 = 1500 ms since the last click: a skill that reset the timer would have kept the streak
        ctx.scene.update(0, 1);
        expect(combo(ctx)).toBe('');
    });

    it('gives a damage tick no combo', async () => {
        const ctx = await createScene({ start: big(), heroes: { leaderId: 'orina', heroes: [ heroEntry('orina', { 2: 1 }, 2) ] } });

        clickTimes(ctx, 20);
        ctx.scene.useSkill(2);
        ctx.scene.update(0, 1000);

        //  Tempestade Arcana: 200 % of 1.2 (2 stars) = 2.4 per tick
        expect(ctx.texts.at(-1).text).toBe('2.4');
    });

    it('does not count a click on a dead monster', async () => {
        const ctx = await createScene({ start: big(10) });

        clickTimes(ctx, 10);
        const text = combo(ctx);
        ctx.click();

        expect(ctx.scene.monster.dead).toBe(true);
        expect(combo(ctx)).toBe(text);
    });

    it('keeps the streak across a kill and a new monster', async () => {
        const ctx = await createScene({ start: big(3) });

        clickTimes(ctx, 3);
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
        ctx.click();

        expect(combo(ctx)).toBe('Combo x4 · +4%');
    });
});

describe('ClickerGame combo and stars across changes', () => {
    const big = () => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000 })) }
    });

    it('keeps the streak when the leader changes', async () => {
        const heroes = { leaderId: 'kael', heroes: [ heroEntry('kael', { 0: 1 }, 0), heroEntry('lyra', { 0: 1 }, 0) ] };
        const ctx = await createScene({ start: big(), heroes });

        Array.from({ length: 5 }, () => ctx.click());
        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });
        await ctx.scene.heroes.setLeader('lyra');

        expect(ctx.hud('.combo-hud').textContent).toBe('Combo x5 · +5%');
    });

    it('uses the new star bonus on the next click after a fusion', async () => {
        const heroes = { leaderId: 'kael', heroes: [ heroEntry('kael', { 0: 3 }, 0) ] };
        const ctx = await createScene({ start: big(), heroes });

        ctx.click();
        expect(ctx.texts.at(-1).text).toBe('1');

        heroesGateway.fuse.mockResolvedValue(heroEntry('kael', { 1: 1 }, 1));
        await ctx.scene.heroes.fuse('kael', 0);
        ctx.scene.update(0, 1500);
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1.1');
    });
});

describe('ClickerGame Lyra double click', () => {
    const big = (extra = {}) => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000, ...extra })) }
    });
    const leaderOf = (id, stars = 0) => ({ leaderId: id, heroes: [ heroEntry(id, { [stars]: 1 }, stars), heroEntry('kael', { 0: 1 }, 0) ] });
    const critical = { color: '#ffc6a5', fontSize: 48 };
    const normal = { color: '#f5ead8', fontSize: 32 };

    it('deals two critical hits of 2 on a roll below 30', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra') });

        ctx.dice.value = 0.29;
        ctx.click();

        expect(ctx.texts.map((text) => text.text)).toEqual([ '2', '2' ]);
        expect(ctx.texts.every((text) => text.style.color === critical.color && text.style.fontSize === critical.fontSize)).toBe(true);
        expect(ctx.scene.monster.health).toBe(996);
    });

    it('deals one plain hit of 1 on a roll of 30 or above', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra') });

        ctx.dice.value = 0.3;
        ctx.click();

        expect(ctx.texts).toHaveLength(1);
        expect(ctx.texts[0]).toMatchObject({ text: '1', style: expect.objectContaining(normal) });
    });

    it('rolls a double click on a roll of 0', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra') });

        ctx.dice.value = 0;
        ctx.click();

        expect(ctx.texts).toHaveLength(2);
    });

    it('makes both hits critical against a critical resistance of 100', async () => {
        const start = big({ monster: { element: 'FIRE', physicalDefense: 0, magicalDefense: 0, critResistance: 100 } });
        const ctx = await createScene({ start, heroes: leaderOf('lyra') });

        ctx.dice.value = 0.29;
        ctx.click();

        expect(ctx.texts.map((text) => text.text)).toEqual([ '2', '2' ]);
    });

    it('does not land the second hit when the first kills', async () => {
        const start = big({ monsterHealth: 2 });
        const ctx = await createScene({ start, heroes: leaderOf('lyra') });

        ctx.dice.value = 0.29;
        ctx.click();

        expect(ctx.texts.map((text) => text.text)).toEqual([ '2' ]);
        expect(ctx.scene.monster.dead).toBe(true);
    });

    it('does not roll the double click for another leader', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('kael') });

        ctx.dice.value = 0.29;
        ctx.click();

        expect(ctx.texts).toHaveLength(1);
    });

    it('does not roll it for the hits of a skill: Flecha Dupla lands exactly two numbers', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra', 1) });

        ctx.dice.value = 0.29;
        ctx.scene.useSkill(1);

        expect(ctx.texts).toHaveLength(2);
    });

    it('counts one click in the streak and shares its combo between the two hits', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra') });

        ctx.dice.value = 0.99;
        Array.from({ length: 10 }, () => ctx.click());
        ctx.dice.value = 0.29;
        ctx.click();

        //  The 11th click has +10 %: two critical hits of 2 x 1.1 = 2.2
        expect(ctx.texts.slice(-2).map((text) => text.text)).toEqual([ '2.2', '2.2' ]);
        expect(ctx.hud('.combo-hud').textContent).toBe('Combo x11 · +11%');
    });

    it('puts the second number beside the first so both can be read', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra') });

        ctx.dice.value = 0.29;
        ctx.click();

        expect(ctx.texts[1].x).toBeGreaterThan(ctx.texts[0].x);
    });
});

describe('ClickerGame star bonus', () => {
    const big = () => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000 })) }
    });
    const twoHeroes = (stars) => ({
        leaderId: 'kael',
        heroes: [ heroEntry('kael', { [stars]: 1 }, stars), heroEntry('lyra', { 0: 1 }, 0), heroEntry('orina') ]
    });

    it('clicks for 1 with no star', async () => {
        const ctx = await createScene({ start: big(), heroes: twoHeroes(0) });

        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1');
    });

    it('clicks for 1.1 with 1 star and 1.2 with 2 stars', async () => {
        const one = await createScene({ start: big(), heroes: twoHeroes(1) });
        one.click();
        const two = await createScene({ start: big(), heroes: twoHeroes(2) });
        two.click();

        expect(one.texts.at(-1).text).toBe('1.1');
        expect(two.texts.at(-1).text).toBe('1.2');
    });

    it('clicks for 1.4 with 3 stars, and for 3.5 on a roll of 0.29 because the critical chance is 40', async () => {
        const ctx = await createScene({ start: big(), heroes: twoHeroes(3) });

        ctx.click();
        expect(ctx.texts.at(-1).text).toBe('1.4');

        ctx.dice.value = 0.29;
        ctx.click();
        expect(ctx.texts.at(-1).text).toBe('3.5');
    });

    it('does not crit on a roll of 0.40 with 3 stars: the chance is 40 points, not more', async () => {
        const ctx = await createScene({ start: big(), heroes: twoHeroes(3) });

        ctx.dice.value = 0.4;
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1.4');
    });

    it('uses the bonus of the new leader on the next click', async () => {
        const ctx = await createScene({ start: big(), heroes: twoHeroes(3) });

        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });
        await ctx.scene.heroes.setLeader('lyra');
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1');
    });
});

describe('ClickerGame talents in combat', () => {
    const tree = (levels = {}) => [
        [ 'MINIBOSS_TIME', 2 ], [ 'BOSS_TIME', 3 ], [ 'PHYSICAL_BREAK', 1 ], [ 'MAGICAL_BREAK', 1 ], [ 'CRIT_RESIST_BREAK', 1 ],
        [ 'CLICK_DAMAGE', 3 ], [ 'CRIT_CHANCE', 1 ], [ 'CRIT_DAMAGE', 5 ], [ 'COMBO', 5 ]
    ].map(([ id, perLevel ]) => ({ id, perLevel, maxLevel: 10, level: levels[id] ?? 0, value: (levels[id] ?? 0) * perLevel, nextCost: 300 }));
    const bigMonsters = (monster, extra = {}) => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000, monster, ...extra })) }
    });
    const fire = (physicalDefense = 0, magicalDefense = 0, critResistance = 0) => ({ element: 'FIRE', physicalDefense, magicalDefense, critResistance });

    it('adds CLICK_DAMAGE 5 (+15 %) to the click: 1.15 damage', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ CLICK_DAMAGE: 5 }) });

        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 1.15, 10);
    });

    it('adds CRIT_CHANCE 4 to the 10 % base: a roll of 13 crits and a roll of 14 does not', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ CRIT_CHANCE: 4 }) });

        ctx.dice.value = 0.13;
        ctx.click();
        expect(ctx.texts.at(-1).text).toBe('2');

        ctx.dice.value = 0.14;
        ctx.click();
        expect(ctx.texts.at(-1).text).toBe('1');
    });

    it('adds CRIT_DAMAGE 6 (+30 %) to the critical multiplier: a critical click deals 2.3', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ CRIT_DAMAGE: 6 }) });

        ctx.dice.value = 0;
        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 2.3, 10);
    });

    it('lowers the physical defense by 5 points with PHYSICAL_BREAK 5: a click against defense 20 deals 0.85, not 0.8', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(20)), talents: tree({ PHYSICAL_BREAK: 5 }) });

        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 0.85, 10);
    });

    it('shows the lowered defenses on the enemy tags and keeps the stats of the monster itself', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(20, 20, 20)), talents: tree({ PHYSICAL_BREAK: 5, MAGICAL_BREAK: 3, CRIT_RESIST_BREAK: 8 }) });

        expect(ctx.hud('.enemy-stats').textContent).toContain('Physical def 15%');
        expect(ctx.hud('.enemy-stats').textContent).toContain('Magical def 17%');
        expect(ctx.hud('.enemy-stats').textContent).toContain('Crit res 12%');
        expect(ctx.scene.monster.stats.physicalDefense).toBe(20);
    });

    it('lowers the critical resistance by 8 points: resistance 20 and CRIT_RESIST_BREAK 8 make a roll of 9 crit at 10 %', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(0, 0, 20)), talents: tree({ CRIT_RESIST_BREAK: 20 }) });

        ctx.dice.value = 0.09;
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('2');
    });

    it('adds 10 s to the limit of a miniboss with MINIBOSS_TIME 5 and nothing to a chapter boss', async () => {
        const miniboss = await createScene({ start: progress(1, 'MINIBOSS', 1), talents: tree({ MINIBOSS_TIME: 5 }) });
        const boss = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), talents: tree({ MINIBOSS_TIME: 5 }) });

        expect(miniboss.scene.countdown.limitMs).toBe(40_000);
        expect(boss.scene.countdown.limitMs).toBe(60_000);
    });

    it('adds 12 s to the limit of the chapter boss with BOSS_TIME 4 and nothing to a miniboss', async () => {
        const boss = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), talents: tree({ BOSS_TIME: 4 }) });
        const miniboss = await createScene({ start: progress(1, 'MINIBOSS', 1), talents: tree({ BOSS_TIME: 4 }) });

        expect(boss.scene.countdown.limitMs).toBe(72_000);
        expect(miniboss.scene.countdown.limitMs).toBe(30_000);
    });

    it('adds the time talents to the time of the equipment', async () => {
        const piece = { id: 'p', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [ { type: 'BOSS_TIME_SECONDS', value: 5 } ], sellPrice: 100, heroId: 'kael' };
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1), equipment: { capacity: 100, pieces: [ piece ] }, talents: tree({ MINIBOSS_TIME: 5 }) });

        //  The equipment loads in the background too; the encounter starts after both
        ctx.scene.showEncounter(ctx.scene.session.encounter());

        expect(ctx.scene.countdown.limitMs).toBe(45_000);
    });

    it('fights with no talent effect while they cannot be loaded, and tries again on the next tick', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(20)), talents: new ApiError('down', { status: 500 }) });

        ctx.click();
        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 0.8, 10);
        expect(talentGateway.list).toHaveBeenCalledTimes(1);

        talentGateway.list.mockResolvedValue({ talents: tree({ PHYSICAL_BREAK: 5 }) });
        ctx.loops[0].callback();
        await flush();
        ctx.dice.value = 0.99;
        const before = ctx.scene.monster.health;

        ctx.scene.update(0, 2000);
        ctx.click();

        expect(talentGateway.list).toHaveBeenCalledTimes(2);
        expect(before - ctx.scene.monster.health).toBeCloseTo(0.85, 10);
    });

    const clickTimes = (ctx, times) => Array.from({ length: times }, () => ctx.click());
    const comboHud = (ctx) => ctx.hud('.combo-hud').textContent;

    it('caps the combo at COMBO 4 (+20 %): a streak of 30 reads +20% and the 31st click deals 1.2', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ COMBO: 4 }) });

        clickTimes(ctx, 30);
        expect(comboHud(ctx)).toBe('Combo x30 · +20%');
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1.2');
    });

    it('lets the combo grow below the cap: COMBO 4 and a streak of 12 read +12%', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ COMBO: 4 }) });

        clickTimes(ctx, 12);

        expect(comboHud(ctx)).toBe('Combo x12 · +12%');
    });

    it('reaches +50 % at COMBO 10 with a streak of 60', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ COMBO: 10 }) });

        clickTimes(ctx, 60);

        expect(comboHud(ctx)).toBe('Combo x60 · +50%');
    });

    it('gives no combo bonus and an empty HUD at COMBO 0', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree() });

        clickTimes(ctx, 11);

        expect(comboHud(ctx)).toBe('');
        expect(ctx.texts.at(-1).text).toBe('1');
        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 11, 10);
    });

    it('gives no combo bonus before the talents load', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: new ApiError('down', { status: 500 }) });

        clickTimes(ctx, 11);

        expect(comboHud(ctx)).toBe('');
        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 11, 10);
    });

    it('uses the cap of an upgraded COMBO on the next click without ending the streak', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ COMBO: 1 }) });

        clickTimes(ctx, 10);
        expect(comboHud(ctx)).toBe('Combo x10 · +5%');
        talentGateway.upgrade.mockResolvedValue({ talents: tree({ COMBO: 2 }), points: { earned: 2, spent: 2, available: 0 } });
        await ctx.scene.talents.upgrade('COMBO', 1);
        ctx.click();

        expect(ctx.texts.at(-1).text).toBe('1.1');
        expect(comboHud(ctx)).toBe('Combo x11 · +10%');
    });

    it('uses an upgraded talent on the next click and leaves the wallet alone', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree() });

        const walletBefore = { ...ctx.scene.wallet.display() };

        talentGateway.upgrade.mockResolvedValue({ talents: tree({ CLICK_DAMAGE: 1 }), points: { earned: 1, spent: 1, available: 0 } });
        await ctx.scene.talents.upgrade('CLICK_DAMAGE', 0);
        ctx.click();

        expect(talentGateway.upgrade).toHaveBeenCalledWith('CLICK_DAMAGE', 0);
        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 1.03, 10);
        expect(ctx.scene.wallet.display()).toEqual(walletBefore);
    });

    it('updates the enemy tags when a break talent is upgraded', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(20)), talents: tree() });

        talentGateway.upgrade.mockResolvedValue({ talents: tree({ PHYSICAL_BREAK: 1 }), points: { earned: 1, spent: 1, available: 0 } });
        await ctx.scene.talents.upgrade('PHYSICAL_BREAK', 0);

        expect(ctx.hud('.enemy-stats').textContent).toContain('Physical def 19%');
    });
});

describe('ClickerGame chapter map', () => {
    const stops = (ctx) => ctx.doms.flatMap((dom) => [ ...dom.node.querySelectorAll('.farm-map .map-node') ]).map((node) => node.getAttribute('data-state'));

    it('reads where the player stands from the campaign: stage 4 with 3 minibosses beaten', async () => {
        const ctx = await createScene({ start: { ...progress(4, 'PHASE', 2), chapter: 2 } });

        farmGateway.get.mockResolvedValue({ bosses: [ 1, 2, 3 ].map((stage) => ({ kind: 'MINIBOSS', stage })), chapterBossWinsLeft: 10 });
        ctx.control('[data-testid="hud-farm"]').click();
        await flush();

        expect(ctx.hud('[data-testid="farm-map-title"]').textContent).toBe('Caminho do Capítulo 2');
        expect(stops(ctx)).toEqual([ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]);
    });

    it('shows the chapter boss as the current stop when the campaign is at the chapter boss', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });

        farmGateway.get.mockResolvedValue({ bosses: Array.from({ length: 10 }, (_, index) => ({ kind: 'MINIBOSS', stage: index + 1 })), chapterBossWinsLeft: 10 });
        ctx.control('[data-testid="hud-farm"]').click();
        await flush();

        expect(stops(ctx)).toEqual([ ...Array(10).fill('defeated'), 'current' ]);
    });
});

describe('ClickerGame skill tooltip', () => {
    const lyra = () => ({ leaderId: 'lyra', heroes: [ heroEntry('lyra', { 3: 1 }, 3), heroEntry('kael'), heroEntry('orina') ] });
    const slot = (ctx, number) => ctx.control(`[data-testid="skill-slot-${number}"]`);
    const enter = (node) => node.dispatchEvent(new Event('pointerenter'));

    it('shows the card of a slot on hover and hides it when the pointer leaves', async () => {
        const ctx = await createScene({ heroes: lyra() });

        enter(slot(ctx, 2));

        expect(slot(ctx, 2).querySelector('[data-testid="skill-tooltip"] .skill-name').textContent).toBe('Skill 2');

        slot(ctx, 2).dispatchEvent(new Event('pointerleave'));

        expect(slot(ctx, 2).querySelector('[data-testid="skill-tooltip"]')).toBeNull();
    });

    it('shows the card of the skill that started a running effect when its tag is hovered, and keeps it as the seconds count down', async () => {
        const ctx = await createScene({ heroes: lyra() });

        ctx.scene.useSkill(3);
        ctx.scene.update(0, 16);

        const tag = ctx.hud('.effect-tags .tag-effect');

        enter(tag);

        expect(tag.querySelector('[data-testid="skill-tooltip"] .skill-name').textContent).toBe('Skill 3');

        ctx.scene.update(0, 1000);

        expect(ctx.hud('.effect-tags .tag-effect')).toBe(tag);
        expect(tag.querySelector('[data-testid="skill-tooltip"]')).not.toBeNull();
    });

    it('hides the tooltip when the effect ends and its tag goes away', async () => {
        const ctx = await createScene({ heroes: lyra() });

        ctx.scene.useSkill(3);
        ctx.scene.update(0, 16);
        enter(ctx.hud('.effect-tags .tag-effect'));
        expect(ctx.hud('.effect-tags [data-testid="skill-tooltip"]')).toBeDefined();

        ctx.scene.update(0, 12000);

        expect(ctx.hud('.effect-tags .tag-effect')).toBeUndefined();
        expect(ctx.hud('.effect-tags [data-testid="skill-tooltip"]')).toBeUndefined();
    });

    it('shows no tooltip on a tag while the heroes are unknown', async () => {
        const ctx = await createScene({ heroes: lyra() });

        ctx.scene.useSkill(3);
        ctx.scene.update(0, 16);
        ctx.scene.heroes.heroes().length = 0;
        enter(ctx.hud('.effect-tags .tag-effect'));

        expect(ctx.hud('.effect-tags [data-testid="skill-tooltip"]')).toBeUndefined();
    });
});

describe('ClickerGame skill keys Q, W and E', () => {
    const bigHealth = () => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000, minibossHealth: 1000 })) }
    });
    const leaderOf = (id, stars) => ({ leaderId: id, heroes: [ heroEntry(id, { [stars]: 1 }, stars), heroEntry('lyra'), heroEntry('orina') ] });
    const slot = (ctx, number) => ctx.control(`[data-testid="skill-slot-${number}"]`);
    const press = (ctx, name, event) => ctx.handlers[`keydown-${name}`](event);

    it('Q uses the skill of slot 1 as a click on its slot: 16.5 damage (1 star) and the 20 s cooldown', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        press(ctx, 'Q');

        expect(ctx.scene.monster.health).toBe(983.5);
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('cooling');
        expect(slot(ctx, 1).querySelector('.skill-slot-cooldown').textContent).toBe('20s');
    });

    it('W uses slot 2 (400 % hit) and E uses slot 3 (cooldown 30 s)', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 3) });

        press(ctx, 'W');
        expect(ctx.scene.monster.health).toBe(994.4);
        expect(slot(ctx, 2).querySelector('.skill-slot-cooldown').textContent).toBe('25s');

        press(ctx, 'E');
        expect(slot(ctx, 3).querySelector('.skill-slot-cooldown').textContent).toBe('30s');
    });

    it('keeps the keys 1, 2 and 3 working', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 3) });

        press(ctx, 'ONE');
        press(ctx, 'TWO');
        press(ctx, 'THREE');

        expect(ctx.scene.monster.health).toBe(973.4);
    });

    it('uses a skill once per press: Q then the 1 key on the same slot is refused while it cools', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        press(ctx, 'Q');
        press(ctx, 'ONE');
        press(ctx, 'Q');

        expect(ctx.scene.monster.health).toBe(983.5);
    });

    it('ignores the repeats of a held key and uses the skill on the first press', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        press(ctx, 'Q', { repeat: true });
        expect(ctx.scene.monster.health).toBe(1000);

        press(ctx, 'Q', { repeat: false });
        press(ctx, 'Q', { repeat: true });
        expect(ctx.scene.monster.health).toBe(983.5);
    });

    it('ignores the keys of a locked slot and of a leader with no star', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 0) });

        press(ctx, 'Q');
        expect(ctx.scene.monster.health).toBe(1000);

        const one = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        press(one, 'W');
        press(one, 'E');
        expect(one.scene.monster.health).toBe(1000);
    });

    it('ignores the keys while the pause menu is open', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 3) });

        ctx.handlers['keydown-ESC']();
        press(ctx, 'Q');
        press(ctx, 'W');
        press(ctx, 'E');

        expect(ctx.scene.monster.health).toBe(1000);
    });

    it('ignores the keys while a hero screen is open', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: leaderOf('kael', 1) });

        ctx.control('[data-testid="hud-heroes"]').click();
        await flush();
        press(ctx, 'Q');

        expect(ctx.scene.monster.health).toBe(1000);
    });

    it('ignores the keys while the heroes have not loaded', async () => {
        const ctx = await createScene({ start: bigHealth(), heroes: new Error('down') });

        press(ctx, 'Q');

        expect(ctx.scene.monster.health).toBe(1000);
    });

    it('shows the key letter on each slot', async () => {
        const ctx = await createScene({ heroes: leaderOf('kael', 3) });

        expect([ 1, 2, 3 ].map((number) => ctx.control(`[data-testid="skill-key-${number}"]`).textContent)).toEqual([ 'Q', 'W', 'E' ]);
    });
});

describe('ClickerGame skill tooltip of a former leader', () => {
    it('shows the card of the hero that owns the skill after the leader changed', async () => {
        const heroes = { leaderId: 'lyra', heroes: [ heroEntry('lyra', { 3: 1 }, 3), heroEntry('kael', { 3: 1 }, 3) ] };
        const ctx = await createScene({ heroes });

        ctx.scene.useSkill(3);
        ctx.scene.update(0, 16);
        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'kael' });
        await ctx.scene.heroes.setLeader('kael');
        ctx.scene.update(0, 16);

        const tag = ctx.hud('.effect-tags .tag-effect');

        tag.dispatchEvent(new Event('pointerenter'));

        //  Ventos Ligeiros is Lyra slot 3: the card is hers, not the one of the new leader in the same slot
        expect(tag.textContent).toContain('Ventos Ligeiros');
        expect(tag.querySelector('[data-testid="skill-tooltip"] .skill-name').textContent).toBe('Skill 3');
        expect(ctx.scene.skillCard('lyra', 3)).toBe(ctx.scene.heroes.heroes().find((hero) => hero.id === 'lyra').skills[2]);
        expect(ctx.scene.skillCard('lyra', 3)).not.toBe(ctx.scene.skillCard('kael', 3));
    });
});

describe('ClickerGame skills: numbers, pause, exits, farm and leader', () => {
    const withStages = (patch, encounter = 'PHASE') => ({
        ...progress(1, encounter, 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, ...patch })) }
    });
    const big = (encounter) => withStages({ monsterHealth: 1000, minibossHealth: 1000 }, encounter);
    const leaderOf = (id, stars) => ({ leaderId: id, heroes: [ heroEntry(id, { [stars]: 1 }, stars), heroEntry('lyra'), heroEntry('orina') ] });
    const slot = (ctx, number) => ctx.control(`[data-testid="skill-slot-${number}"]`);
    const key = (ctx, name) => ctx.handlers[`keydown-${name}`]();
    const timer = (ctx) => ctx.hud('.boss-timer').textContent;
    const tags = (ctx) => ctx.hud('.effect-tags').textContent;
    const tick = (ctx) => ctx.loops[0].callback();
    const fadeAndRespawn = (ctx) => {
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
    };

    it('shows a critical skill hit bigger and peach like a critical click, and a normal one cream', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('kael', 3) });

        key(ctx, 'ONE');
        expect(ctx.texts.at(-1)).toMatchObject({ text: '21', style: expect.objectContaining({ color: '#f5ead8', fontSize: 32 }) });

        ctx.dice.value = 0;
        key(ctx, 'TWO');
        expect(ctx.texts.at(-1)).toMatchObject({ text: '14', style: expect.objectContaining({ color: '#ffc6a5', fontSize: 48 }) });
    });

    it('never shows a tick as critical, whatever the roll', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('orina', 2) });

        ctx.dice.value = 0;
        key(ctx, 'TWO');
        ctx.scene.update(0, 1000);

        expect(ctx.texts.at(-1)).toMatchObject({ text: '2.4', style: expect.objectContaining({ color: '#f5ead8', fontSize: 32 }) });
    });

    it('freezes the effects, the ticks and the aimed shot while the fight is paused', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra', 3) });

        key(ctx, 'TWO');
        key(ctx, 'THREE');
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 12000);

        expect(slot(ctx, 2).getAttribute('data-state')).toBe('casting');
        expect(tags(ctx)).toBe('Ventos Ligeiros 12s');
        expect(ctx.scene.monster.health).toBe(1000);

        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 2000);
        expect(ctx.scene.monster.health).toBe(895);
    });

    it('freezes the ticks of a damage over time while the fight is paused', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('orina', 2) });

        key(ctx, 'TWO');
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 5000);

        expect(ctx.scene.monster.health).toBe(1000);
        expect(tags(ctx)).toBe('Tempestade Arcana 6s');
    });

    it('keeps the boss countdown stopped by Investida while paused, then stopped for the 3 s that were left', async () => {
        const ctx = await createScene({ start: big('MINIBOSS'), heroes: leaderOf('kael', 2) });

        key(ctx, 'TWO');
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 5000);
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 3000);

        expect(timer(ctx)).toBe('Time: 30');
    });

    it('ends the effects on the monster when the boss runs out of time', async () => {
        const ctx = await createScene({ start: big('MINIBOSS'), heroes: leaderOf('kael', 3) });

        key(ctx, 'THREE');
        expect(tags(ctx)).toBe('Brado Aterrador 10s');

        ctx.scene.update(0, 30001);

        expect(ctx.scene.monster).toBeNull();
        expect(tags(ctx)).toBe('');
    });

    it('ends the effects on the monster when the player leaves the boss fight', async () => {
        const ctx = await createScene({ start: big('MINIBOSS'), heroes: leaderOf('kael', 3) });

        key(ctx, 'THREE');
        ctx.handlers['keydown-ESC']();
        ctx.control('.pause-leave').click();
        ctx.control('.pause-confirm-yes').click();
        ctx.scene.update(0, 1);

        expect(tags(ctx)).toBe('');
    });

    it('ends the effects on the monster when the backend realigns the position', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('kael', 3) });

        key(ctx, 'THREE');
        ctx.scene.realign(ctx.scene.session.encounter());
        ctx.scene.update(0, 1);

        expect(tags(ctx)).toBe('');
    });

    it('ends the effects on the monster when a farm fight starts', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('kael', 3) });

        key(ctx, 'THREE');
        ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 1 });
        ctx.scene.update(0, 1);

        expect(tags(ctx)).toBe('');
    });

    it('wins a farm fight with a skill kill: one farm request, no coins and no campaign report', async () => {
        const ctx = await createScene({ start: withStages({ monsterHealth: 10, minibossHealth: 10 }), heroes: leaderOf('kael', 1) });
        const miniboss = { kind: 'MINIBOSS', stage: 1 };

        farmGateway.win.mockResolvedValue({ drop: null, chapterBossWinsLeft: 10 });
        ctx.scene.startFarm(miniboss);
        key(ctx, 'ONE');
        await flush();

        expect(farmGateway.win).toHaveBeenCalledTimes(1);
        expect(farmGateway.win).toHaveBeenCalledWith(miniboss);
        expect(ctx.sprites).toHaveLength(0);
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('drops the coins and queues the CLEARED report when a tick kills the monster', async () => {
        const ctx = await createScene({
            wallet: walletResponse(undefined, { 1: [ 3 ] }),
            start: withStages({ monsterHealth: 3 }),
            heroes: leaderOf('orina', 2)
        });
        await flush();

        key(ctx, 'TWO');
        ctx.scene.update(0, 2000);

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.sprites).toHaveLength(3);

        fadeAndRespawn(ctx);
        tick(ctx);
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledWith({ chapter: 1, stage: 1, encounter: 'PHASE', phase: 1 }, 'CLEARED');
    });

    it('shows the cooldowns of the leader after a change of leader and the ones of the old leader when it comes back', async () => {
        const heroes = { leaderId: 'kael', heroes: [ heroEntry('kael', { 1: 1 }, 1), heroEntry('lyra', { 1: 1 }, 1), heroEntry('orina') ] };
        const ctx = await createScene({ start: big(), heroes });

        key(ctx, 'ONE');
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('cooling');

        heroesGateway.setLeader.mockResolvedValueOnce({ leaderId: 'lyra' });
        await ctx.scene.heroes.setLeader('lyra');
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('ready');

        heroesGateway.setLeader.mockResolvedValueOnce({ leaderId: 'kael' });
        await ctx.scene.heroes.setLeader('kael');
        expect(slot(ctx, 1).getAttribute('data-state')).toBe('cooling');
        expect(slot(ctx, 1).querySelector('.skill-slot-cooldown').textContent).toBe('20s');
    });

    it('shows the aimed shot as a critical number of 105 (3000 % of 1.4, x2.5 with 3 stars) when the cast ends', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra', 3) });

        key(ctx, 'TWO');
        ctx.scene.update(0, 2000);

        expect(ctx.texts.at(-1)).toMatchObject({ text: '105', style: expect.objectContaining({ color: '#ffc6a5', fontSize: 48 }) });
    });

    it('runs the aimed shot down only while the fight is not paused: after a pause the 2 s are still left', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra', 3) });

        key(ctx, 'TWO');
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 5000);
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 1);

        expect(ctx.scene.monster.health).toBe(1000);
        expect(slot(ctx, 2).getAttribute('data-state')).toBe('casting');

        ctx.scene.update(0, 1999);
        expect(ctx.scene.monster.health).toBe(895);
    });

    it('runs a damage over time down only while the fight is not paused: after a pause the first tick is 1 s away', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('orina', 2) });

        key(ctx, 'TWO');
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 5000);
        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 999);

        expect(ctx.scene.monster.health).toBe(1000);

        ctx.scene.update(0, 1);
        expect(ctx.scene.monster.health).toBe(997.6);
    });
});
