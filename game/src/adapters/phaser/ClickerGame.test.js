import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClickerGame } from './ClickerGame';
import { ApiError } from '../../application/ApiError';
import { createAccountReset } from '../../application/accountReset/accountReset';
import { createAutoClickState } from '../../application/autoClick/autoClickState';
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
const heroesGateway = { list: vi.fn(), fuse: vi.fn(), setLeader: vi.fn(), setTeam: vi.fn(), buySlot: vi.fn() };
const farmGateway = { get: vi.fn(), win: vi.fn() };
const talentGateway = { list: vi.fn(), upgrade: vi.fn(), reset: vi.fn() };
//  The real auto click state over a mocked gateway, and the switch preference as a plain object (on unless a test turns it off)
const autoClickGateway = { get: vi.fn(), upgrade: vi.fn() };
//  The real account reset over a mocked gateway, working on the services of the scene
const resetGateway = { reset: vi.fn() };
const autoClickPreference = { on: true, stored: [], enabled () { return this.on; }, setEnabled (on) { this.on = on; this.stored.push(on); } };
const equipmentGateway = { list: vi.fn(), equip: vi.fn(), unequip: vi.fn(), refine: vi.fn(), reroll: vi.fn(), sell: vi.fn() };
//  The gift claim: by default nothing is granted; a test gives the answer, or an Error to reject with
const giftGateway = { claim: vi.fn() };
//  The critical roll: 0.99 never crits a monster of the default stats (10 % chance); a test sets `dice.value` to force one
const dice = { value: 0.99 };
const services = {
    random: () => dice.value,
    createWalletSync: () => createWalletSync({ gateway: walletApi }),
    createCampaignSession: () => createCampaignSession({ gateway: campaignGateway }),
    createHeroCollection: () => createHeroCollection({ gateway: heroesGateway }),
    createEquipmentCollection: () => createEquipmentCollection({ gateway: equipmentGateway }),
    createTalentCollection: () => createTalentCollection({ gateway: talentGateway }),
    createFarmSession: () => createFarmSession({ gateway: farmGateway }),
    createAutoClickState: () => createAutoClickState({ gateway: autoClickGateway }),
    createAccountReset: (ports) => createAccountReset({ gateway: resetGateway, ...ports }),
    gifts: giftGateway,
    autoClickPreference
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

const TEAM_IDS = [ 'kael', 'lyra', 'orina', 'seraphine', 'vex' ];
const teamPayload = (allies, { openSlots = 4, boughtSlots = 4, unlocked = true } = {}) => ({ unlocked, openSlots, boughtSlots, slotPrices: [ 10000, 20000, 30000, 40000 ], allies });
//  Every hero owned and FIRE (heroEntry); `stars` gives a hero more stars, e.g. { lyra: 9 }
const teamHeroes = (allies, { leaderId = 'kael', stars = {} } = {}) => ({
    leaderId, heroes: TEAM_IDS.map((id) => heroEntry(id, { 0: 1 }, stars[id] ?? 0)), team: teamPayload(allies)
});
const atChapter = (chapter, ...args) => ({ ...progress(...args), chapter });

const walletResponse = (coins = { gold: 2, silver: 14, copper: 37 }, drops = { 1: [3, 1, 5, 2, 4] }) => ({ wallet: coins, drops });

//  Minimal Phaser stand-in: records what ClickerGame adds and exposes the click handler and tweens.
//  `wallet` is what GET /wallet answers: a response object, an Error to reject with, or omitted to never answer.
//  The COMBO talent at its top level (cap 50 %), which the scenes get unless a test gives its own tree
//  What GET /auto-click answers by default: level 0 at 500 ms with no crystals
const AUTO_CLICK_LEVEL_0 = { level: 0, maxLevel: 4, intervalMs: 500, crystals: 0, next: { level: 1, intervalMs: 250, price: 10 } };

const COMBO_MAXED = { id: 'COMBO', branch: 'COMBO', perLevel: 5, maxLevel: 10, level: 10, value: 50, nextCost: null };

const createScene = async ({ wallet, start = progress(), heroes = heroesResponse(), equipment = { capacity: 100, pieces: [] }, talents = [ COMBO_MAXED ], autoClick = AUTO_CLICK_LEVEL_0, autoClickOn = true, textures = {}, gift = { granted: false } } = {}) => {
    dice.value = 0.99;
    giftGateway.claim.mockReset();
    giftGateway.claim.mockImplementation(() => (gift instanceof Error ? Promise.reject(gift) : Promise.resolve(gift)));
    autoClickPreference.on = autoClickOn;
    autoClickPreference.stored = [];
    autoClickGateway.get.mockReset();
    autoClickGateway.upgrade.mockReset();
    resetGateway.reset.mockReset();
    autoClickGateway.get.mockImplementation(() => (autoClick instanceof Error ? Promise.reject(autoClick) : Promise.resolve(autoClick)));
    Object.values(equipmentGateway).forEach((mock) => mock.mockReset());
    equipmentGateway.list.mockImplementation(() => (equipment instanceof Error ? Promise.reject(equipment) : Promise.resolve(equipment)));
    talentGateway.list.mockReset();
    talentGateway.upgrade.mockReset();
    talentGateway.reset.mockReset();
    talentGateway.list.mockImplementation(() => (talents instanceof Error ? Promise.reject(talents) : Promise.resolve({ talents })));
    heroesGateway.list.mockReset();
    heroesGateway.fuse.mockReset();
    heroesGateway.setLeader.mockReset();
    heroesGateway.setTeam.mockReset();
    heroesGateway.buySlot.mockReset();
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
    const triangles = [];
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
            const size = (texture) => textures[texture] ?? { width: 100, height: 400 };
            const image = { x, y, key, ...size(key), scale: 1, destroy: vi.fn() };

            image.setOrigin = (ox, oy) => { image.originX = ox; image.originY = oy; return image; };
            image.setTexture = (texture) => { image.key = texture; Object.assign(image, size(texture)); return image; };
            image.setScale = (value) => { image.scale = value; return image; };
            image.setDepth = (depth) => { image.depth = depth; return image; };
            images.push(image);
            return image;
        }),
        rectangle: vi.fn((x, y, width, height, color) => {
            const rect = { x, y, width, height, color, originX: 0.5, originY: 0.5 };

            rect.setOrigin = (ox, oy) => { rect.originX = ox; rect.originY = oy; return rect; };
            rect.setSize = (w, h) => { rect.width = w; rect.height = h; return rect; };
            rect.alpha = 1;
            rect.setAlpha = (a) => { rect.alpha = a; return rect; };
            rect.setDepth = (d) => { rect.depth = d; return rect; };
            rect.destroy = vi.fn();
            rectangles.push(rect);
            return rect;
        }),
        text: vi.fn((x, y, text, style) => {
            const obj = { x, y, text, style, alpha: 1, destroy: vi.fn() };

            obj.setOrigin = (ox, oy) => { obj.originX = ox; obj.originY = oy; return obj; };
            obj.setDepth = () => obj;
            texts.push(obj);
            return obj;
        }),
        triangle: vi.fn((x, y, x1, y1, x2, y2, x3, y3, color) => {
            const tri = { x, y, points: [ x1, y1, x2, y2, x3, y3 ], color, alpha: 1, destroy: vi.fn() };

            tri.setDepth = (d) => { tri.depth = d; return tri; };
            tri.setPosition = (px, py) => { tri.x = px; tri.y = py; return tri; };
            tri.setAlpha = (a) => { tri.alpha = a; return tri; };
            triangles.push(tri);
            return tri;
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
    const fill = byColor(0xc0392b)[0];
    const back = byColor(0x2a1410)[0];

    const walletText = () => doms.map((d) => d.node.querySelector('.wallet')).find(Boolean);
    const control = (selector) => doms.map((d) => d.node.querySelector(selector)).find(Boolean);
    const hud = (selector) => doms.map((d) => d.node.querySelector(selector)).find(Boolean);
    const walletElement = () => doms.find((d) => d.node.querySelector('.wallet'));

    return { scene, images, rectangles, triangles, texts, tweens, timers, loops, eventHandlers, sprites, doms, click, monster, fill, back, byColor, walletText, walletElement, hud, control, handlers, dice };
};

describe('ClickerGame scene', () => {
    it('places the round farm button at 951, 686', async () => {
        const ctx = await createScene();
        const element = ctx.doms.find((dom) => dom.node.querySelector('.farm-toggle'));

        expect([ element.x, element.y ]).toEqual([ 951, 686 ]);
    });

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
    it('draws the bar back 0x2a1410 and the fill 0xc0392b', async () => {
        const { byColor } = await createScene();

        const back = byColor(0x2a1410);
        const fill = byColor(0xc0392b);

        expect(back).toHaveLength(1);
        expect(fill).toHaveLength(1);
        expect([ back[0].width, back[0].height, fill[0].width, fill[0].height ]).toEqual([ 240, 16, 240, 16 ]);
    });

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

    it('follows a skill hit that does not kill: Corte Dimensional of a 1 star Kael reads HP 983.5/1K and moves the bar', async () => {
        const ctx = await createScene({ start: big(), heroes: { leaderId: 'kael', heroes: [ heroEntry('kael', { 1: 1 }, 1) ] } });

        ctx.scene.useSkill(1);

        expect(hp(ctx)).toBe('HP 983.5/1K');
        expect(ctx.fill.width).toBeCloseTo(240 * 983.5 / 1000, 10);
    });

    it('follows a damage tick that does not kill: Tempestade Arcana of a 2 star Orina reads HP 997.6/1K and moves the bar', async () => {
        const ctx = await createScene({ start: big(), heroes: { leaderId: 'orina', heroes: [ heroEntry('orina', { 2: 1 }, 2) ] } });

        ctx.scene.useSkill(2);
        ctx.scene.update(0, 1000);

        expect(hp(ctx)).toBe('HP 997.6/1K');
        expect(ctx.fill.width).toBeCloseTo(240 * 997.6 / 1000, 10);
    });

    it('shows the chapter and the HP text while the heroes have not loaded', async () => {
        const ctx = await createScene({ start: { ...big(), chapter: 3 }, heroes: new Error('down') });

        expect(ctx.hud('.chapter-hud').textContent).toBe('Capítulo 3');
        expect(hp(ctx)).toBe('HP 1K/1K');
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

    it('flies a silver coin when each coin carries 100 copper or more', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [500, 1] }));

        kill(ctx);

        expect(ctx.sprites.map((coin) => coin.key)).toEqual(Array(5).fill('coin_silver'));
    });

    it('spawns one rotating coin per copper of the drop at the monster center when the monster dies', async () => {
        const ctx = await loadedScene(walletResponse(undefined, { 1: [3, 1] }));

        kill(ctx);

        expect(ctx.sprites).toHaveLength(3);
        ctx.sprites.forEach((coin) => {
            expect([ coin.x, coin.y, coin.key, coin.anim ]).toEqual([ 670, 440, 'coin_copper', 'rotate_copper' ]);
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
    const left = (ctx) => ctx.hud('.boss-timer').style.getPropertyValue('--timer-left');
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

    it('sets --timer-left to 1.000 when a 30 s countdown starts', async () => {
        const ctx = await createScene({ start: bossStart() });

        expect(left(ctx)).toBe('1.000');
    });

    it('sets --timer-left to 0.750 after 7.5 s of a 30 s countdown', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 7500);

        expect(left(ctx)).toBe('0.750');
        expect(timer(ctx)).toBe('Time: 23');
    });

    it('writes --timer-left as 0.000 in the last millisecond, never negative', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 29999);

        expect(left(ctx)).toBe('0.000');
    });

    it('computes --timer-left against an extended limit', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.countdown.extend(30000);
        ctx.scene.update(0, 0);
        expect(left(ctx)).toBe('1.000');

        ctx.scene.update(0, 15000);
        expect(left(ctx)).toBe('0.750');
    });

    it('removes --timer-left when the boss runs out of time', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.scene.update(0, 30000);

        expect(left(ctx)).toBe('');
        expect(timer(ctx)).toBe('');
    });

    it('a campaign boss label has no chapter line', async () => {
        const ctx = await createScene({ start: bossStart() });

        expect(label(ctx)).toBe('Stage 1/10  Miniboss');
        expect(ctx.hud('.stage-hud .stage-hud-chapter')).toBeUndefined();
    });

    it('removes --timer-left when the boss is beaten', async () => {
        const ctx = await createScene({ start: bossStart() });

        killAll(ctx);

        expect(left(ctx)).toBe('');
    });

    it('sets no --timer-left on a phase monster', async () => {
        const ctx = await createScene();

        expect(left(ctx)).toBe('');
    });

    describe('boss timer beside the stage plate', () => {
        //  jsdom has no layout (offsetWidth is 0): the widths of the plate and the timer are stubbed by class name
        const widths = { 'stage-hud': 0, 'boss-timer': 0 };
        const shift = (ctx) => ctx.hud('.boss-timer').style.getPropertyValue('--timer-shift');

        beforeEach(() => {
            vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () { return widths[this.className] ?? 0; });
        });
        afterEach(() => vi.restoreAllMocks());

        it('keeps the timer centred when the plate ends 12 px before it', async () => {
            widths['stage-hud'] = 262;
            widths['boss-timer'] = 152;
            const ctx = await createScene({ start: bossStart() });

            expect(shift(ctx)).toBe('0px');
        });

        it('pushes the timer to 12 px after a plate that reaches it', async () => {
            widths['stage-hud'] = 283;
            widths['boss-timer'] = 152;
            const ctx = await createScene({ start: bossStart() });

            expect(shift(ctx)).toBe('15px');
        });

        it('pushes the timer after the widest earlier chapter plate', async () => {
            widths['stage-hud'] = 346;
            widths['boss-timer'] = 162;
            const ctx = await createScene({ start: bossStart() });

            expect(shift(ctx)).toBe('83px');
        });

        it('places the timer again when its text changes', async () => {
            widths['stage-hud'] = 262;
            widths['boss-timer'] = 152;
            const ctx = await createScene({ start: bossStart() });
            expect(shift(ctx)).toBe('0px');

            widths['stage-hud'] = 300;
            ctx.scene.update(0, 1001);

            expect(timer(ctx)).toBe('Time: 29');
            expect(shift(ctx)).toBe('32px');
        });

        it('does not place the timer again on a frame whose seconds do not change', async () => {
            widths['stage-hud'] = 262;
            widths['boss-timer'] = 152;
            const ctx = await createScene({ start: bossStart() });

            widths['stage-hud'] = 300;
            ctx.scene.update(0, 100);

            expect(timer(ctx)).toBe('Time: 30');
            expect(shift(ctx)).toBe('0px');
        });

        it('removes --timer-shift when the boss is beaten', async () => {
            widths['stage-hud'] = 283;
            widths['boss-timer'] = 152;
            const ctx = await createScene({ start: bossStart() });

            killAll(ctx);

            expect(shift(ctx)).toBe('');
        });

        it('removes --timer-shift when the boss runs out of time', async () => {
            widths['stage-hud'] = 283;
            widths['boss-timer'] = 152;
            const ctx = await createScene({ start: bossStart() });

            ctx.scene.update(0, 30000);

            expect(shift(ctx)).toBe('');
            expect(timer(ctx)).toBe('');
        });
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

    it('reports the miniboss win when farming is on and brings it back as a farm fight', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.control('.farm-toggle input').checked = true;
        killAll(ctx);
        advance(ctx);
        await ctx.scene.session.flush();

        expect(campaignGateway.report).toHaveBeenCalledWith({ chapter: 1, stage: 1, encounter: 'MINIBOSS', phase: 1 }, 'CLEARED');
        expect(ctx.scene.farmBoss).toEqual({ kind: 'MINIBOSS', stage: 1 });
        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 30');
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth);
    });

    it('reports every later win of the switched farm as a farm win, so each one can drop', async () => {
        const ctx = await createScene({ start: bossStart() });
        farmGateway.win.mockResolvedValue({ drop: { heroId: 'kael', heroName: 'Hero kael', stars: 0 }, chapterBossWinsLeft: 10 });

        ctx.control('.farm-toggle input').checked = true;
        killAll(ctx);
        advance(ctx);
        killAll(ctx);
        await flush();
        advance(ctx);

        expect(farmGateway.win).toHaveBeenCalledTimes(1);
        expect(farmGateway.win).toHaveBeenCalledWith({ kind: 'MINIBOSS', stage: 1 });
        expect(ctx.control('[data-testid="card-notice"]').hidden).toBe(false);
        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
    });

    it('goes back to the campaign after the next win once the switch is turned off', async () => {
        const ctx = await createScene({ start: bossStart() });
        farmGateway.win.mockResolvedValue({ drop: null, chapterBossWinsLeft: 10 });

        ctx.control('.farm-toggle input').checked = true;
        killAll(ctx);
        advance(ctx);
        ctx.control('.farm-toggle input').checked = false;
        killAll(ctx);
        advance(ctx);

        expect(farmGateway.win).toHaveBeenCalledTimes(1);
        expect(ctx.scene.farmBoss).toBeNull();
        expect(label(ctx)).toBe('Stage 2/10  Phase 1/5');
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
    const weak = (ctx) => ctx.hud('.weak-chip');
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

    it('applies the defense of the monster: physicalDefense 50 of an old payload', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE', 50, 10)) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.5);
    });

    it('applies the defense of a new payload: defense 50 takes half of a click', async () => {
        const ctx = await createScene({ start: withStats({ element: 'FIRE', defense: 50, physicalDefense: 50, magicalDefense: 50, critResistance: 0 }) });

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 0.5);
    });

    it('shows defense over physicalDefense when a payload has both: Defesa 40%', async () => {
        const ctx = await createScene({ start: withStats({ element: 'WATER', defense: 40, physicalDefense: 70, magicalDefense: 70, critResistance: 12 }) });

        expect(enemyText(ctx)).toBe('Water  Defesa 40%  Seu crítico: 0%');
    });

    it('shows Defesa 50% for an old payload with physicalDefense 50 and magicalDefense 10', async () => {
        const ctx = await createScene({ start: withStats({ element: 'DARKNESS', physicalDefense: 50, magicalDefense: 10, critResistance: 100 }) });

        expect(enemyText(ctx)).toBe('Darkness  Defesa 50%  Seu crítico: 0%');
        expect(enemyText(ctx)).not.toContain('Physical def');
        expect(enemyText(ctx)).not.toContain('Magical def');
    });

    it('doubles the damage on a critical click and draws that number bigger and orange', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });
        ctx.dice.value = 0;

        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 2);
        expect(ctx.texts[0].text).toBe('2');
        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ color: '#ff8a1f', fontSize: 48 }));
    });

    it('draws damage numbers in Cinzel 700 with a dark outline', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });

        ctx.click();

        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8 }));
    });

    it('draws a critical number in Cinzel 700 with the same outline', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });
        ctx.dice.value = 0;

        ctx.click();

        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8, color: '#ff8a1f', fontSize: 48 }));
    });

    it('draws a normal click gold and 32 px', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });

        ctx.click();

        expect(ctx.texts[0].style).toEqual(expect.objectContaining({ color: '#ffd35c', fontSize: 32 }));
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

    it('shows the element, the defense of the monster and Seu crítico on screen', async () => {
        const ctx = await createScene({ start: withStats(stats('WATER', 11, 22, 33)) });

        expect(enemyText(ctx)).toBe('Water  Defesa 11%  Seu crítico: 0%');
    });

    it('shows the miniboss attributes when the miniboss spawns', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT', 1, 2, 3)), encounter: 'MINIBOSS' } });

        expect(enemyText(ctx)).toBe('Light  Defesa 1%  Seu crítico: 7%');
    });

    it('shows the chapter boss attributes', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT'), stats('DARKNESS', 30, 30, 30)), stage: 10, encounter: 'CHAPTER_BOSS' } });

        expect(enemyText(ctx)).toBe('Darkness  Defesa 30%  Seu crítico: 0%');
    });

    it('shows fire with no defense for a payload without stats', async () => {
        const ctx = await createScene();

        expect(enemyText(ctx)).toBe('Fire  Defesa 0%  Seu crítico: 10%');
    });

    it('shows Seu crítico: 10% for a 3-star Kael against critical resistance 30', async () => {
        const heroes = { leaderId: 'kael', heroes: [ heroEntry('kael', { 3: 1 }, 3) ] };
        const ctx = await createScene({ start: withStats(stats('FIRE', 0, 0, 30)), heroes });

        expect(enemyText(ctx)).toBe('Fire  Defesa 0%  Seu crítico: 10%');
    });

    it('shows Seu crítico: 100% for a leader of critical chance 130 against resistance 10', async () => {
        const heroes = { leaderId: 'kael', heroes: [ heroEntry('kael', { 9: 1 }, 9) ] };
        const talents = [ COMBO_MAXED, { id: 'CRIT_CHANCE', baseId: 'CRIT_CHANCE', value: 60 } ];
        const ctx = await createScene({ start: withStats(stats('FIRE', 0, 0, 10)), heroes, talents });

        expect(enemyText(ctx)).toBe('Fire  Defesa 0%  Seu crítico: 100%');
    });

    it('marks the element chip with data-element and the defense and crit chips with data-stat', async () => {
        const ctx = await createScene({ start: withStats(stats('WATER', 11, 22, 33)) });

        expect(ctx.hud('.enemy-stats .tag-element').getAttribute('data-element')).toBe('WATER');
        expect([ ...ctx.hud('.enemy-stats').querySelectorAll('[data-stat]') ].map((tag) => [ tag.getAttribute('data-stat'), tag.textContent ]))
            .toEqual([ [ 'defense', 'Defesa 11%' ], [ 'crit', 'Seu crítico: 0%' ] ]);
    });

    it('keeps the element chip and the one-defense line on a chapter boss', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT'), stats('DARKNESS', 30, 30, 30)), stage: 10, encounter: 'CHAPTER_BOSS' } });

        expect(enemyText(ctx)).toBe('Darkness  Defesa 30%  Seu crítico: 0%');
        expect(ctx.hud('.enemy-stats .tag-element').getAttribute('data-element')).toBe('DARKNESS');
    });

    it('clears the attributes when the monster dies and shows the next ones when it spawns', async () => {
        const ctx = await createScene({ start: withStats(stats('NATURE')) });

        killAll(ctx);
        expect(enemyText(ctx)).toBe('');

        fade(ctx).onComplete();
        ctx.timers.at(-1).callback();
        expect(enemyText(ctx)).toBe('Nature  Defesa 0%  Seu crítico: 10%');
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

    it('shows Fraco: Água for a FIRE monster', async () => {
        const ctx = await createScene({ start: withStats(stats('FIRE')) });

        expect(weak(ctx).textContent).toBe('Fraco: Água');
        expect(weak(ctx).getAttribute('data-element')).toBe('WATER');
    });

    it('shows Fraco: Natureza for a WATER monster', async () => {
        const ctx = await createScene({ start: withStats(stats('WATER')) });

        expect(weak(ctx).textContent).toBe('Fraco: Natureza');
        expect(weak(ctx).getAttribute('data-element')).toBe('NATURE');
    });

    it('shows Fraco: Fogo for a NATURE monster', async () => {
        const ctx = await createScene({ start: withStats(stats('NATURE')) });

        expect(weak(ctx).textContent).toBe('Fraco: Fogo');
        expect(weak(ctx).getAttribute('data-element')).toBe('FIRE');
    });

    it('shows no weak element for a LIGHT miniboss', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT', 1, 2, 3)), encounter: 'MINIBOSS' } });

        expect(weak(ctx).textContent).toBe('');
    });

    it('shows no weak element for a DARKNESS chapter boss', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('WATER'), stats('LIGHT'), stats('DARKNESS', 30, 30, 30)), stage: 10, encounter: 'CHAPTER_BOSS' } });

        expect(weak(ctx).textContent).toBe('');
    });

    it('empties the weak element chip when the monster dies', async () => {
        const ctx = await createScene({ start: withStats(stats('NATURE')) });

        killAll(ctx);
        expect(weak(ctx).textContent).toBe('');

        fade(ctx).onComplete();
        ctx.timers.at(-1).callback();
        expect(weak(ctx).textContent).toBe('Fraco: Fogo');
    });

    it('empties the weak element chip when the boss runs out of time', async () => {
        const ctx = await createScene({ start: { ...withStats(stats('NATURE')), encounter: 'MINIBOSS' } });

        ctx.scene.update(0, 30000);

        expect(weak(ctx).textContent).toBe('');
    });

    it('empties the weak element chip when the chapter is complete', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1, true) });

        expect(weak(ctx).textContent).toBe('');
    });

    it('keeps the weak element chip in the click-through enemy element', async () => {
        const ctx = await createScene();
        const element = ctx.doms.find((d) => d.node.querySelector('.enemy-stats'));

        expect(element.node.querySelector('.weak-chip')).not.toBeNull();
        expect(element.pointerEvents).toBe('none');
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

        expect(enemyText(ctx)).toBe('Light  Defesa 4%  Seu crítico: 4%');
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

    it('shows the four hero buttons in the HUD and none of them in the pause menu', async () => {
        const ctx = await createScene();

        expect([ 'heroes', 'bag', 'leader', 'farm' ].map((id) => testid(ctx, `hud-${id}`)?.textContent)).toEqual([
            'Heróis', 'Mochila', 'Líder', 'Rever chefes'
        ]);
        expect(testid(ctx, 'hud-fusion') ?? null).toBeNull();
        expect(ctx.control('.pause-menu').querySelector('[data-testid^="hud-"]')).toBeNull();
    });

    it('shows the three skill slots of the leader, all locked at 0 stars, once the heroes load', async () => {
        const ctx = await createScene();

        expect(ctx.doms.flatMap((d) => [ ...d.node.querySelectorAll('.skill-slot') ])).toHaveLength(3);
        expect(ctx.doms.flatMap((d) => [ ...d.node.querySelectorAll('.skill-slot.is-locked') ])).toHaveLength(3);
        expect(testid(ctx, 'skill-slot-1').querySelector('.skill-slot-cooldown').textContent).toBe('10s');
    });

    //  Spec background-fight: only the pause menu freezes the fight
    it('opening a hero screen leaves the fight running: not paused, timers and tweens on', async () => {
        const ctx = await createScene({ start: bossStart() });

        await openPanel(ctx, 'equipment');

        //  The test clock and tween manager start with no paused flag; a pause sets it to true
        expect(ctx.scene.paused).toBe(false);
        expect(ctx.scene.time.paused).not.toBe(true);
        expect(ctx.scene.tweens.paused).not.toBe(true);
    });

    it('runs the boss countdown behind an open hero screen', async () => {
        const ctx = await createScene({ start: bossStart() });

        await openPanel(ctx, 'talents');
        ctx.scene.update(0, 1001);

        expect(ctx.hud('.boss-timer').textContent).toBe('Time: 29');
    });

    it('a click on the canvas does not hit while a hero screen is open, and hits again once it closes', async () => {
        const ctx = await createScene({ start: bossStart() });

        await openPanel(ctx, 'heroes');
        ctx.click();

        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth);

        testid(ctx, 'hero-close').click();
        ctx.click();

        expect(ctx.scene.paused).toBe(false);
        expect(ctx.scene.monster.health).toBe(ctx.scene.monster.maxHealth - 1);
    });

    it('opening a hero screen keeps a fight the player paused with Esc paused', async () => {
        const ctx = await createScene({ start: bossStart() });

        ctx.handlers['keydown-ESC']();
        await openPanel(ctx, 'talents');

        expect(ctx.scene.paused).toBe(true);
        expect(ctx.scene.time.paused).toBe(true);
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

        await openPanel(ctx, 'leader');
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

    it('a win refused as too fast pays nothing but keeps the farm going', async () => {
        const ctx = await createScene({ start: midCampaign() });
        farmGateway.win.mockRejectedValue(new ApiError('Too fast', { status: 409, code: 'FARM_TOO_FAST' }));
        ctx.scene.startFarm(miniboss);
        const loads = farmGateway.get.mock.calls.length;

        killAll(ctx);
        await flush();
        advance(ctx);

        expect(ctx.scene.farmBoss).toBe(miniboss);
        expect(label(ctx)).toBe('Rever chefe: Miniboss 1');
        expect(testid(ctx, 'card-notice').hidden).toBe(true);
        expect(farmGateway.get.mock.calls.length).toBe(loads);
    });

    it('a refused win ends the farm without a notice and reloads the farm state', async () => {
        const ctx = await createScene({ start: midCampaign() });
        farmGateway.win.mockRejectedValue(new ApiError('Not beaten', { status: 409, code: 'BOSS_NOT_AVAILABLE' }));
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

    describe('a boss of an earlier chapter', () => {
        //  Chapter 1 as the farm answers it: its minibosses have 77 health and 45 s, its chapter boss 60 health and 50 s
        const atChapter2 = () => ({ ...progress(3, 'PHASE', 1), chapter: 2 });
        const earlier = {
            ...definition,
            bossHealth: 60,
            bossTimeLimitMs: 50_000,
            stages: definition.stages.map((stage) => ({ ...stage, minibossHealth: 77, minibossTimeLimitMs: 45_000 }))
        };
        const ELEVEN = [ ...Array.from({ length: 10 }, (_, i) => ({ kind: 'MINIBOSS', stage: i + 1 })), { kind: 'CHAPTER_BOSS' } ];
        const chapterOne = (winsLeft = 10) => ({ chapter: 1, chapters: [ 1, 2 ], bosses: ELEVEN, chapterBossWinsLeft: winsLeft, definition: earlier });

        it('a boss of an earlier chapter fights with the numbers of that chapter and its label', async () => {
            const ctx = await createScene({ start: atChapter2() });
            farmGateway.get.mockResolvedValue(chapterOne());
            await ctx.scene.farm.load(1);

            ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 });

            expect(label(ctx)).toBe('Rever chefe: Miniboss 3 (Capítulo 1)');
            expect(ctx.scene.monster.maxHealth).toBe(77);
            expect(ctx.hud('.boss-timer').textContent).toBe('Time: 45');
            expect(campaignGateway.report).not.toHaveBeenCalled();
        });

        it('an earlier chapter fight draws its chapter on the second line of the plate', async () => {
            const ctx = await createScene({ start: atChapter2() });
            farmGateway.get.mockResolvedValue(chapterOne());
            await ctx.scene.farm.load(1);

            ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 });

            expect(label(ctx)).toBe('Rever chefe: Miniboss 3 (Capítulo 1)');
            expect(ctx.hud('.stage-hud .stage-hud-chapter').textContent).toBe(' (Capítulo 1)');
        });

        it('a win of an earlier chapter boss reports its chapter and brings the same boss of that chapter back', async () => {
            const ctx = await createScene({ start: atChapter2() });
            farmGateway.get.mockResolvedValue(chapterOne());
            await ctx.scene.farm.load(1);
            farmGateway.win.mockResolvedValue(farmWin());
            ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 });

            killAll(ctx);
            await flush();

            expect(farmGateway.win).toHaveBeenCalledTimes(1);
            expect(farmGateway.win).toHaveBeenCalledWith({ kind: 'MINIBOSS', stage: 3, chapter: 1 });

            advance(ctx);

            expect(label(ctx)).toBe('Rever chefe: Miniboss 3 (Capítulo 1)');
            expect(ctx.scene.monster.health).toBe(77);
        });

        it('an earlier chapter boss whose chapter was never loaded starts no fight', async () => {
            const ctx = await createScene({ start: atChapter2() });

            ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 3, chapter: 1 });

            expect(ctx.scene.farmBoss).toBeNull();
            expect(label(ctx)).toBe('Stage 3/10  Phase 1/5');
        });

        it('the earlier chapter boss that spends the last daily win reopens Rever chefes on that chapter', async () => {
            const ctx = await createScene({ start: atChapter2() });
            farmGateway.get.mockImplementation((chapter) => Promise.resolve(chapterOne(0)));
            await ctx.scene.farm.load(1);
            farmGateway.win.mockResolvedValue(farmWin(null, 0));
            ctx.scene.startFarm({ kind: 'CHAPTER_BOSS', chapter: 1 });

            killAll(ctx);
            await flush();

            expect(ctx.scene.farmBoss).toBeNull();
            expect(ctx.scene.heroUi.isOpen).toBe(true);
            expect(farmGateway.get.mock.calls.at(-1)).toEqual([ 1 ]);
            expect(testid(ctx, 'farm-map-title').textContent).toBe('Caminho do Capítulo 1');
            expect(testid(ctx, 'farm-entry-chapter-boss').disabled).toBe(true);
            expect(testid(ctx, 'farm-entry-chapter-boss').textContent).toContain('0 vitórias restantes hoje');
        });

        it('a chapter boss of an earlier chapter is labelled with its chapter', async () => {
            const ctx = await createScene({ start: atChapter2() });
            farmGateway.get.mockResolvedValue(chapterOne());
            await ctx.scene.farm.load(1);

            ctx.scene.startFarm({ kind: 'CHAPTER_BOSS', chapter: 1 });

            expect(label(ctx)).toBe('Rever chefe: Chefe do capítulo (Capítulo 1)');
            expect(ctx.scene.monster.maxHealth).toBe(60);
            expect(ctx.hud('.boss-timer').textContent).toBe('Time: 50');
        });
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

    it('adds the boss damage to the auto click on a boss too: 1.2 for a piece of BOSS_DAMAGE_PCT 20', async () => {
        const ctx = await createScene({ start: { ...miniboss(stats('FIRE')), chapter: 2 }, equipment: list(affixPiece('BOSS_DAMAGE_PCT', 20)), autoClickOn: true });

        ctx.scene.update(0, 500);

        expect(ctx.scene.monster.health).toBeCloseTo(ctx.scene.monster.maxHealth - 1.2, 10);
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

describe('ClickerGame gift', () => {
    const STAFF = {
        id: 'gift-staff', slot: 'WEAPON', rarity: 'LEGENDARY', refine: 0, clickDamage: 11, heroId: null, sellPrice: 500, refineCost: 4000, rerollCost: null,
        affixes: [ { type: 'BOSS_DAMAGE_PCT', value: 28 }, { type: 'BOSS_TIME_SECONDS', value: 6 }, { type: 'CRIT_DAMAGE_PCT', value: 55 }, { type: 'ARMOR_PIERCE_PCT', value: 28 } ],
        special: 'BLACK_AWARENESS_STAFF'
    };
    const GIFT_TEXT = 'Presente do Dia da Consciência Negra: Cajado da Consciência Negra na mochila!';
    const notice = (ctx) => ctx.control('[data-testid="card-notice"]');

    it('the battle start claims the gift exactly once', async () => {
        await createScene();
        await flush();

        expect(giftGateway.claim).toHaveBeenCalledTimes(1);
    });

    it('a granted staff shows the gift notice', async () => {
        const ctx = await createScene({ gift: { granted: true, gift: 'BLACK_AWARENESS_STAFF', piece: STAFF } });
        await flush();

        expect(notice(ctx).textContent).toBe(GIFT_TEXT);
        expect(notice(ctx).hidden).toBe(false);
    });

    it('granted false shows no notice', async () => {
        const ctx = await createScene({ gift: { granted: false } });
        await flush();

        expect(notice(ctx).hidden).toBe(true);
    });

    it('a failing claim shows no notice and a click still hits', async () => {
        const ctx = await createScene({ gift: new Error('offline') });
        await flush();

        expect(notice(ctx).hidden).toBe(true);

        ctx.click();

        expect(ctx.scene.monster.health).toBe(9);
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

    //  Spec background-fight: the fight, and the 1500 ms of the combo with it, runs behind a hero screen
    it('runs the 1500 ms out while a hero screen is open', async () => {
        const ctx = await createScene({ start: big() });

        clickTimes(ctx, 5);
        ctx.control('[data-testid="hud-heroes"]').click();
        await flush();
        ctx.scene.update(0, 1500);

        expect(combo(ctx)).toBe('');
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
    const critical = { color: '#ff8a1f', fontSize: 48 };
    const normal = { color: '#ffd35c', fontSize: 32 };

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

    it('adds the critical chance past 100 to both hits: a chance of 120 deals 2.2 twice', async () => {
        const talents = [ { id: 'CRIT_CHANCE', baseId: 'CRIT_CHANCE', value: 110 } ];
        const ctx = await createScene({ start: big(), heroes: leaderOf('lyra'), talents });

        ctx.dice.value = 0.29;
        ctx.click();

        expect(ctx.texts.map((text) => text.text)).toEqual([ '2.2', '2.2' ]);
        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 4.4, 10);
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

    it('the chip follows a leader change', async () => {
        const heroes = { leaderId: 'kael', heroes: [ heroEntry('kael', { 0: 1 }, 0), heroEntry('lyra', { 3: 1 }, 3), heroEntry('orina') ] };
        const ctx = await createScene({ start: big(), heroes });

        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 10%');

        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });
        await ctx.scene.heroes.setLeader('lyra');

        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 40%');
    });

    describe('with a ring of critical chance 20', () => {
        const ring = (heroId) => ({ id: 'ring', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [ { type: 'CRIT_CHANCE', value: 20 } ], sellPrice: 1, heroId });

        it('the chip follows a piece equipped on the leader', async () => {
            const ctx = await createScene({ start: big(), equipment: { capacity: 100, pieces: [ ring(null) ] } });

            await flush();
            expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 10%');

            equipmentGateway.equip.mockResolvedValue({ capacity: 100, pieces: [ ring('kael') ] });
            await ctx.scene.equipment.equip('ring', 'kael');

            expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 30%');
        });

        it('the chip follows a piece unequipped from the leader', async () => {
            const ctx = await createScene({ start: big(), equipment: { capacity: 100, pieces: [ ring('kael') ] } });

            await flush();
            expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 30%');

            equipmentGateway.unequip.mockResolvedValue({ capacity: 100, pieces: [ ring(null) ] });
            await ctx.scene.equipment.unequip('ring');

            expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 10%');
        });
    });
});

describe('ClickerGame talents in combat', () => {
    const tree = (levels = {}) => [
        [ 'MINIBOSS_TIME', 2 ], [ 'BOSS_DAMAGE', 2 ], [ 'PHYSICAL_BREAK', 1 ], [ 'ARMOR_PIERCE', 1 ],
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

    it('lowers the defense by 5 points with PHYSICAL_BREAK 5: a click against defense 20 deals 0.85, not 0.8', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(20)), talents: tree({ PHYSICAL_BREAK: 5 }) });

        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 0.85, 10);
    });

    it('shows the lowered defense on the enemy chips and keeps the stats of the monster itself', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(20, 20, 20)), talents: tree({ PHYSICAL_BREAK: 5 }) });

        expect(ctx.hud('.enemy-stats').textContent).toContain('Defesa 15%');
        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 0%');
        expect(ctx.hud('.enemy-stats').textContent).not.toContain('Magical def');
        expect(ctx.scene.monster.stats.physicalDefense).toBe(20);
    });

    it('ARMOR_PIERCE 10 ignores 10 % of the defense: a click on defense 50 deals 0.55', async () => {
        const ctx = await createScene({ start: bigMonsters(fire(50, 50, 0)), talents: tree({ ARMOR_PIERCE: 10 }) });

        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 0.55, 10);
    });

    it('the chip follows a talent upgrade', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree() });

        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 10%');

        talentGateway.upgrade.mockResolvedValue({ talents: tree({ CRIT_CHANCE: 5 }), points: { earned: 5, spent: 5, available: 0 } });
        await ctx.scene.talents.upgrade('CRIT_CHANCE', 0);

        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 15%');
    });

    it('the chip follows a talent reset', async () => {
        const ctx = await createScene({ start: bigMonsters(fire()), talents: tree({ CRIT_CHANCE: 5 }) });

        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 15%');

        talentGateway.reset.mockResolvedValue({ talents: tree(), points: { earned: 5, spent: 0, available: 5 } });
        await ctx.scene.talents.reset();

        expect(ctx.hud('.enemy-stats').textContent).toContain('Seu crítico: 10%');
    });

    it('with COMBO 10 and Fúria crescente 4 the 2nd click gets +5 % and the HUD reads Combo x3 · +15% after 3 clicks', async () => {
        const talents = [ COMBO_MAXED, { id: 'COMBO_FURY', baseId: 'COMBO_FURY', value: 4 } ];
        const ctx = await createScene({ start: bigMonsters(fire()), talents });

        ctx.click();
        const afterFirst = ctx.scene.monster.health;

        ctx.click();
        expect(afterFirst - ctx.scene.monster.health).toBeCloseTo(1.05, 10);

        ctx.click();
        expect(ctx.hud('.combo-hud').textContent).toBe('Combo x3 · +15%');
    });

    it('BOSS_DAMAGE 10 adds 20 % to a click on the chapter boss and nothing on a phase monster', async () => {
        const boss = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), talents: tree({ BOSS_DAMAGE: 10 }) });
        const phase = await createScene({ start: bigMonsters(fire()), talents: tree({ BOSS_DAMAGE: 10 }) });

        boss.dice.value = 0.99;
        boss.click();
        phase.dice.value = 0.99;
        phase.click();

        expect(300 - boss.scene.monster.health).toBeCloseTo(1.2, 10);
        expect(1000 - phase.scene.monster.health).toBeCloseTo(1, 10);
    });

    it('adds 10 s to the limit of a miniboss with MINIBOSS_TIME 5 and nothing to a chapter boss', async () => {
        const miniboss = await createScene({ start: progress(1, 'MINIBOSS', 1), talents: tree({ MINIBOSS_TIME: 5 }) });
        const boss = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), talents: tree({ MINIBOSS_TIME: 5 }) });

        expect(miniboss.scene.countdown.limitMs).toBe(40_000);
        expect(boss.scene.countdown.limitMs).toBe(60_000);
    });

    it('gives the chapter boss no talent time: BOSS_DAMAGE 10 leaves the limit as it is', async () => {
        const boss = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), talents: tree({ BOSS_DAMAGE: 10 }) });
        const plain = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1), talents: tree({}) });

        expect(boss.scene.countdown.limitMs).toBe(plain.scene.countdown.limitMs);
        expect(boss.scene.countdown.limitMs).toBe(60_000);
    });

    it('adds the time talents to the time of the equipment', async () => {
        const piece = { id: 'p', slot: 'RING', rarity: 'COMMON', refine: 0, affixes: [ { type: 'BOSS_TIME_SECONDS', value: 5 } ], sellPrice: 100, heroId: 'kael' };
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1), equipment: { capacity: 100, pieces: [ piece ] }, talents: tree({ MINIBOSS_TIME: 5 }) });

        //  The equipment loads in the background too; the encounter starts after both
        ctx.scene.showEncounter(ctx.scene.session.encounter());

        expect(ctx.scene.countdown.limitMs).toBe(45_000);
    });

    it('adds a time talent upgraded during the fight to the limit of the next encounter', async () => {
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1), talents: tree() });

        expect(ctx.scene.countdown.limitMs).toBe(30_000);

        talentGateway.upgrade.mockResolvedValue({ talents: tree({ MINIBOSS_TIME: 5 }), points: { earned: 5, spent: 5, available: 0 } });
        await ctx.scene.talents.upgrade('MINIBOSS_TIME', 0);
        ctx.scene.showEncounter(ctx.scene.session.encounter());

        expect(ctx.scene.countdown.limitMs).toBe(40_000);
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

        expect(ctx.hud('.enemy-stats').textContent).toContain('Defesa 19%');
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
        expect(ctx.texts.at(-1)).toMatchObject({ text: '21', style: expect.objectContaining({ color: '#ffd35c', fontSize: 32 }) });

        ctx.dice.value = 0;
        key(ctx, 'TWO');
        expect(ctx.texts.at(-1)).toMatchObject({ text: '14', style: expect.objectContaining({ color: '#ff8a1f', fontSize: 48 }) });
    });

    it('never shows a tick as critical, whatever the roll', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderOf('orina', 2) });

        ctx.dice.value = 0;
        key(ctx, 'TWO');
        ctx.scene.update(0, 1000);

        expect(ctx.texts.at(-1)).toMatchObject({ text: '2.4', style: expect.objectContaining({ color: '#ffd35c', fontSize: 32 }) });
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

        expect(ctx.texts.at(-1)).toMatchObject({ text: '105', style: expect.objectContaining({ color: '#ff8a1f', fontSize: 48 }) });
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

describe('ClickerGame auto click', () => {
    const atChapter = (chapter, health = 10) => ({
        ...progress(), chapter, definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: health })) }
    });
    const autoClickElement = (ctx) => ctx.doms.find((d) => d.node.querySelector('.auto-click'));
    const toggle = (ctx) => ctx.hud('[data-testid="auto-click-toggle"]');
    const interval = (ctx) => ctx.hud('[data-testid="auto-click-interval"]')?.textContent;
    const crystals = (ctx) => ctx.hud('[data-testid="auto-click-crystals"]')?.textContent;
    const upgradeButton = (ctx) => ctx.hud('[data-testid="auto-click-upgrade"]');
    const switchTo = (ctx, on) => {
        toggle(ctx).checked = on;
        toggle(ctx).dispatchEvent(new Event('change', { bubbles: true }));
    };
    const LEVEL_1 = { level: 1, maxLevel: 4, intervalMs: 250, crystals: 0, next: { level: 2, intervalMs: 150, price: 25 } };
    //  The window, its button and the keys; `attached` is the node put in the document for the focus tests
    let attached = null;
    const press = (ctx, name, event) => ctx.handlers[`keydown-${name}`](event);
    const button = (ctx) => ctx.hud('[data-testid="auto-click-button"]');
    const popover = (ctx) => ctx.hud('[data-testid="auto-click-popover"]');
    const attach = (ctx) =>
    {
        attached = autoClickElement(ctx).node;
        document.body.append(attached);
    };
    afterEach(() => attached?.remove());

    it('places the round auto click button at 867, 686 with the key A and the interval under it', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        expect([ autoClickElement(ctx).x, autoClickElement(ctx).y ]).toEqual([ 867, 686 ]);
        expect(ctx.hud('[data-testid="auto-click-key"]').textContent).toBe('A');
        expect(ctx.hud('[data-testid="auto-click-rate"]').textContent).toBe('500 ms');
    });

    it('writes 250 ms under the button at level 1', async () => {
        const ctx = await createScene({ start: atChapter(2), autoClick: { ...AUTO_CLICK_LEVEL_0, level: 1, intervalMs: 250, next: { level: 2, intervalMs: 150, price: 25 } } });

        expect(ctx.hud('[data-testid="auto-click-rate"]').textContent).toBe('250 ms');
    });

    it('marks the button on while the auto click runs and off when switched off', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        expect(button(ctx).getAttribute('data-on')).toBe('true');

        switchTo(ctx, false);

        expect(button(ctx).getAttribute('data-on')).toBe('false');
    });

    it('keeps the window closed until the button is pressed', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        expect(popover(ctx).hidden).toBe(true);
        expect(button(ctx).getAttribute('aria-expanded')).toBe('false');
    });

    it('opens the window on a click with the focus on the switch', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);

        button(ctx).click();

        expect(popover(ctx).hidden).toBe(false);
        expect(button(ctx).getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(toggle(ctx));
    });

    it('holds the switch, interval, crystals and upgrade in the window, and the reset from chapter 2', async () => {
        const ctx = await createScene({ start: atChapter(3) });

        expect([ ...popover(ctx).children ].map((child) => child.getAttribute('data-testid') ?? child.querySelector('[data-testid]')?.getAttribute('data-testid'))).toEqual([
            'auto-click-toggle', 'auto-click-interval', 'auto-click-crystals', 'auto-click-upgrade', 'reset-account'
        ]);
        expect(ctx.hud('[data-testid="reset-account"]').textContent).toBe('Resetar conta (+3 cristais)');
    });

    it('opens and closes the window with A, the focus back on the button', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);

        press(ctx, 'A', { repeat: false, target: document.body });

        expect(popover(ctx).hidden).toBe(false);
        expect(button(ctx).getAttribute('aria-expanded')).toBe('true');
        expect(document.activeElement).toBe(toggle(ctx));

        press(ctx, 'A', { repeat: false, target: document.body });

        expect(popover(ctx).hidden).toBe(true);
        expect(button(ctx).getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(button(ctx));
    });

    it('closes the window when the button is pressed again', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);

        button(ctx).click();
        button(ctx).click();

        expect(popover(ctx).hidden).toBe(true);
        expect(document.activeElement).toBe(button(ctx));
    });

    it('closes the window with Escape and does not pause', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        button(ctx).click();

        ctx.handlers['keydown-ESC']();

        expect(popover(ctx).hidden).toBe(true);
        expect(ctx.scene.paused).toBe(false);

        ctx.handlers['keydown-ESC']();

        expect(ctx.scene.paused).toBe(true);
    });

    it('closes the window on a press outside, without moving the focus to the button', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);
        button(ctx).click();

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

        expect(popover(ctx).hidden).toBe(true);
        expect(document.activeElement).not.toBe(button(ctx));
    });

    it('keeps the window open on a press inside it', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);
        button(ctx).click();

        toggle(ctx).dispatchEvent(new Event('pointerdown', { bubbles: true }));

        expect(popover(ctx).hidden).toBe(false);
    });

    it('ignores A typed into a text field', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const field = document.createElement('input');

        field.type = 'text';
        press(ctx, 'A', { repeat: false, target: field });

        expect(popover(ctx).hidden).toBe(true);
    });

    //  An input without a type attribute is a text input (UIR-19 AC12: every input other than checkbox, radio or button)
    it('ignores A typed into an input without a type, which is a text field', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        press(ctx, 'A', { repeat: false, target: document.createElement('input') });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A typed into a textarea', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        press(ctx, 'A', { repeat: false, target: document.createElement('textarea') });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A while a select has the focus', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        press(ctx, 'A', { repeat: false, target: document.createElement('select') });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A typed into a contenteditable element', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const editor = document.createElement('div');
        editor.setAttribute('contenteditable', 'true');

        press(ctx, 'A', { repeat: false, target: editor });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('still opens the window for A on a checkbox, which is not a text field', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const box = document.createElement('input');
        box.type = 'checkbox';

        press(ctx, 'A', { repeat: false, target: box });

        expect(popover(ctx).hidden).toBe(false);
    });

    it('ignores A typed in an element with a bare contenteditable attribute', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const editor = document.createElement('div');
        editor.setAttribute('contenteditable', '');

        press(ctx, 'A', { repeat: false, target: editor });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A typed in a plaintext-only contenteditable element', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const editor = document.createElement('div');
        editor.setAttribute('contenteditable', 'plaintext-only');

        press(ctx, 'A', { repeat: false, target: editor });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A typed in a child of a contenteditable element', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const editor = document.createElement('div');
        const child = document.createElement('span');
        editor.setAttribute('contenteditable', '');
        editor.append(child);

        press(ctx, 'A', { repeat: false, target: child });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('opens the window with A pressed on an element with contenteditable="false"', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const plain = document.createElement('div');
        plain.setAttribute('contenteditable', 'false');

        press(ctx, 'A', { repeat: false, target: plain });

        expect(popover(ctx).hidden).toBe(false);
    });

    it('opens the window with A pressed on a radio input', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const radio = document.createElement('input');
        radio.type = 'radio';

        press(ctx, 'A', { repeat: false, target: radio });

        expect(popover(ctx).hidden).toBe(false);
    });

    it('opens the window with A pressed on a button input', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const buttonInput = document.createElement('input');
        buttonInput.type = 'button';

        press(ctx, 'A', { repeat: false, target: buttonInput });

        expect(popover(ctx).hidden).toBe(false);
    });

    it('ignores the repeats of a held A', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        press(ctx, 'A', { repeat: true, target: document.body });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A while the pause menu is open', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        ctx.handlers['keydown-ESC']();

        press(ctx, 'A', { repeat: false, target: document.body });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A while a hero screen is open', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        await ctx.scene.heroUi.show('heroes');

        press(ctx, 'A', { repeat: false, target: document.body });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('ignores A while the auto click is locked', async () => {
        const ctx = await createScene({ start: atChapter(1), autoClick: { ...AUTO_CLICK_LEVEL_0, resets: 0 } });

        expect(autoClickElement(ctx).visible).toBe(false);

        press(ctx, 'A', { repeat: false, target: document.body });

        expect(popover(ctx).hidden).toBe(true);
    });

    it('keeps the focus on the switch when the window is drawn again', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);
        button(ctx).click();

        ctx.scene.showAutoClick();

        expect(document.activeElement).toBe(toggle(ctx));
    });

    it('closes the window when its reset button opens the reset dialog', async () => {
        const ctx = await createScene({ start: atChapter(3) });
        attach(ctx);
        button(ctx).click();

        ctx.hud('[data-testid="reset-account"]').click();

        expect(popover(ctx).hidden).toBe(true);
        expect(ctx.hud('[data-testid="reset-dialog"]').hidden).toBe(false);
    });

    it('closes the open window when the auto click becomes locked', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        attach(ctx);
        button(ctx).click();
        expect(popover(ctx).hidden).toBe(false);
        vi.spyOn(ctx.scene, 'autoClickOpen', 'get').mockReturnValue(false);

        ctx.scene.showAutoClick();

        expect(popover(ctx).hidden).toBe(true);
        expect(button(ctx).getAttribute('aria-expanded')).toBe('false');
    });

    it('ignores A while the reset dialog is open', async () => {
        const ctx = await createScene({ start: atChapter(3) });
        attach(ctx);
        button(ctx).click();
        ctx.hud('[data-testid="reset-account"]').click();
        expect(ctx.hud('[data-testid="reset-dialog"]').hidden).toBe(false);

        press(ctx, 'A', { repeat: false, target: document.body });

        expect(popover(ctx).hidden).toBe(true);
        expect(button(ctx).getAttribute('aria-expanded')).toBe('false');
    });

    it('labels the button and the window for assistive tech', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        expect(button(ctx).getAttribute('aria-label')).toBe('Auto clique');
        expect(button(ctx).getAttribute('aria-haspopup')).toBe('dialog');
        expect(button(ctx).getAttribute('aria-controls')).toBe('auto-click-popover');
        expect(popover(ctx).id).toBe('auto-click-popover');
        expect(popover(ctx).getAttribute('role')).toBe('dialog');
        expect(popover(ctx).getAttribute('aria-label')).toBe('Auto clique');
    });

    it('binds A to nothing but the auto click window', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        expect(ctx.scene.input.keyboard.on.mock.calls.map(([ name ]) => name).sort()).toEqual([
            'keydown-A', 'keydown-E', 'keydown-ESC', 'keydown-ONE', 'keydown-Q', 'keydown-THREE', 'keydown-TWO', 'keydown-W'
        ]);
    });

    it('removes the outside-press listener when the scene shuts down', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        const remove = vi.spyOn(document, 'removeEventListener');

        ctx.eventHandlers.shutdown();

        expect(remove).toHaveBeenCalledWith('pointerdown', ctx.scene.onPressOutsideAutoClick, true);
        remove.mockRestore();
    });

    it('hits twice in 1000 ms with no click in chapter 2, at the monster centre and with one combo step each', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        ctx.scene.update(0, 1000);

        expect(ctx.texts).toHaveLength(2);
        expect(ctx.texts.map((text) => text.x)).toEqual([ 670, 670 ]);
        expect(ctx.scene.combo.streak).toBe(2);
        expect(ctx.scene.monster.health).toBeLessThan(10);
    });

    it('deals what two manual clicks deal', async () => {
        const manual = await createScene({ start: atChapter(2), autoClickOn: false });
        manual.click();
        manual.click();
        const byHand = manual.scene.monster.health;

        const auto = await createScene({ start: atChapter(2) });
        auto.scene.update(0, 1000);

        expect(auto.scene.monster.health).toBe(byHand);
    });

    it('rolls the critical hit like a manual click', async () => {
        const ctx = await createScene({ start: atChapter(2) });
        ctx.dice.value = 0;

        ctx.scene.update(0, 500);

        expect(ctx.texts[0].style.fontSize).toBe(48);
    });

    it('lands the double critical click of Lyra', async () => {
        const ctx = await createScene({ start: atChapter(2, 100), heroes: { ...heroesResponse(), leaderId: 'lyra' } });
        ctx.dice.value = 0;

        ctx.scene.update(0, 500);

        expect(ctx.texts).toHaveLength(2);
        expect(ctx.texts.every((text) => text.style.fontSize === 48)).toBe(true);
    });

    it('keeps hitting every 500 ms while the Talentos or Equipamento screen is open', async () => {
        for (const screen of [ 'talents', 'equipment' ])
        {
            const ctx = await createScene({ start: atChapter(2, 1000) });

            ctx.control(`[data-testid="hud-${screen}"]`).click();
            await flush();
            ctx.scene.update(0, 1000);

            expect(ctx.scene.heroUi.isOpen).toBe(true);
            expect(ctx.texts).toHaveLength(2);
            expect(ctx.scene.monster.health).toBeLessThan(1000);
        }
    });

    it('fires nothing before 500 ms', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        ctx.scene.update(0, 499);

        expect(ctx.scene.monster.health).toBe(10);
    });

    it('fires nothing and hides the switch in chapter 1', async () => {
        const ctx = await createScene({ start: atChapter(1) });

        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(10);
        expect(autoClickElement(ctx).visible).toBe(false);
    });

    it('shows the switch, 500 ms, Cristais: 0 and a disabled Melhorar: 250 ms (10 cristais) in chapter 2', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        expect(autoClickElement(ctx).visible).toBe(true);
        expect(ctx.hud('.auto-click-toggle').textContent).toBe(' Auto clique');
        expect(toggle(ctx).checked).toBe(true);
        expect(interval(ctx)).toBe('500 ms');
        expect(crystals(ctx)).toBe('Cristais: 0');
        expect(upgradeButton(ctx).textContent).toBe('Melhorar: 250 ms (10 cristais)');
        expect(upgradeButton(ctx).disabled).toBe(true);
    });

    it('runs on a completed campaign', async () => {
        const ctx = await createScene({ start: { ...atChapter(1), completed: true } });

        expect(autoClickElement(ctx).visible).toBe(true);
    });

    it('adds no time while paused', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        ctx.handlers['keydown-ESC']();
        ctx.scene.update(0, 1000);
        expect(ctx.scene.monster.health).toBe(10);

        ctx.scene.resumeFight();
        ctx.scene.update(0, 499);
        expect(ctx.scene.monster.health).toBe(10);
        ctx.scene.update(0, 1);
        expect(ctx.texts).toHaveLength(1);
    });

    it('fires 5 clicks for a 10 s frame and stops the burst at the kill', async () => {
        const lasting = await createScene({ start: atChapter(2, 1000) });
        lasting.scene.update(0, 10000);
        expect(lasting.texts).toHaveLength(5);

        const ctx = await createScene({ start: atChapter(2, 3) });
        const kills = vi.spyOn(ctx.scene, 'clearEncounter');
        ctx.scene.update(0, 10000);

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.texts).toHaveLength(3);
        expect(ctx.scene.combo.streak).toBe(3);
        expect(kills).toHaveBeenCalledTimes(1);
    });

    it('keeps hitting the next monster after a boss runs out of time', async () => {
        const tough = { ...definition, stages: definition.stages.map((stage) => ({ ...stage, minibossHealth: 1000 })) };
        const ctx = await createScene({ start: { ...progress(1, 'MINIBOSS', 1), chapter: 2, definition: tough } });

        while (ctx.scene.countdown)
        {
            ctx.scene.update(0, 500);
        }
        const timedOut = ctx.texts.length;

        expect(ctx.scene.monster).toBeNull();
        expect(() => ctx.scene.update(0, 1000)).not.toThrow();
        expect(ctx.texts.length).toBe(timedOut);

        ctx.timers.at(-1).callback();
        const before = ctx.texts.length;

        expect(ctx.scene.monster.dead).toBe(false);
        ctx.scene.update(0, 500);
        expect(ctx.texts.length).toBe(before + 1);
    });

    it('fires nothing while the monster is dead', async () => {
        const ctx = await createScene({ start: atChapter(2, 1) });
        ctx.scene.update(0, 500);
        expect(ctx.scene.monster.dead).toBe(true);

        ctx.scene.update(0, 2000);

        expect(ctx.texts).toHaveLength(1);
    });

    it('keeps the manual click and does not reset the auto click time', async () => {
        const ctx = await createScene({ start: atChapter(2, 1000) });

        ctx.scene.update(0, 300);
        ctx.click();
        ctx.scene.update(0, 200);

        expect(ctx.texts).toHaveLength(2);
    });

    it('stops when the switch is turned off and stores the choice', async () => {
        const ctx = await createScene({ start: atChapter(2) });

        switchTo(ctx, false);
        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(10);
        expect(autoClickPreference.stored).toEqual([ false ]);
        expect(toggle(ctx).checked).toBe(false);
    });

    it('runs again when the switch is turned back on', async () => {
        const ctx = await createScene({ start: atChapter(2), autoClickOn: false });
        expect(toggle(ctx).checked).toBe(false);

        switchTo(ctx, true);
        ctx.scene.update(0, 500);

        expect(ctx.texts).toHaveLength(1);
        expect(autoClickPreference.stored).toEqual([ true ]);
    });

    it('starts off when the stored choice is off', async () => {
        const ctx = await createScene({ start: atChapter(2), autoClickOn: false });

        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(10);
    });

    it('runs at 500 ms and hides the crystals and the button when the state cannot load', async () => {
        const ctx = await createScene({ start: atChapter(2, 1000), autoClick: new Error('down') });

        expect(interval(ctx)).toBe('500 ms');
        expect(crystals(ctx)).toBeUndefined();
        expect(upgradeButton(ctx)).toBeUndefined();

        ctx.scene.update(0, 1000);
        expect(ctx.texts).toHaveLength(2);
    });

    it('runs at the interval of the level the backend answers and shows no button at level 4', async () => {
        const ctx = await createScene({ start: atChapter(2, 1000), autoClick: { level: 4, maxLevel: 4, intervalMs: 50, crystals: 0, next: null } });

        expect(interval(ctx)).toBe('50 ms');
        expect(upgradeButton(ctx)).toBeUndefined();

        ctx.scene.update(0, 100);
        expect(ctx.texts).toHaveLength(2);
    });

    it('upgrades from the level shown, disables the button meanwhile and runs at the answered interval', async () => {
        const ctx = await createScene({ start: atChapter(2, 1000), autoClick: { ...AUTO_CLICK_LEVEL_0, crystals: 10 } });
        let answer;
        autoClickGateway.upgrade.mockImplementation(() => new Promise((resolve) => { answer = resolve; }));
        expect(upgradeButton(ctx).disabled).toBe(false);

        upgradeButton(ctx).click();

        expect(autoClickGateway.upgrade).toHaveBeenCalledWith(0);
        expect(upgradeButton(ctx).disabled).toBe(true);

        answer(LEVEL_1);
        await flush();

        expect(interval(ctx)).toBe('250 ms');
        expect(upgradeButton(ctx).textContent).toBe('Melhorar: 150 ms (25 cristais)');
        ctx.scene.update(0, 250);
        expect(ctx.texts).toHaveLength(1);
    });

    it('keeps 500 ms and shows the reloaded state after a 409 refusal', async () => {
        const ctx = await createScene({ start: atChapter(2, 1000), autoClick: { ...AUTO_CLICK_LEVEL_0, crystals: 10 } });
        autoClickGateway.get.mockResolvedValue({ ...AUTO_CLICK_LEVEL_0, crystals: 4 });
        autoClickGateway.upgrade.mockRejectedValue(new ApiError('poor', { status: 409, code: 'NOT_ENOUGH_CRYSTALS', body: {} }));

        upgradeButton(ctx).click();
        await flush();
        await flush();

        expect(interval(ctx)).toBe('500 ms');
        expect(crystals(ctx)).toBe('Cristais: 4');
        expect(upgradeButton(ctx).disabled).toBe(true);
    });

    it('shows the switch and starts once the chapter 1 boss is beaten', async () => {
        const ctx = await createScene({ start: progress(10, 'CHAPTER_BOSS', 1) });
        campaignGateway.report.mockResolvedValue({ ...progress(1, 'PHASE', 1), chapter: 2 });
        expect(autoClickElement(ctx).visible).toBe(false);

        while (!ctx.scene.monster.dead)
        {
            ctx.click();
        }
        ctx.tweens.filter((t) => Array.isArray(t.targets) && t.alpha === 0 && t.duration === 500).at(-1).onComplete();
        ctx.timers.at(-1).callback();
        await flush();
        const before = ctx.texts.length;

        expect(autoClickElement(ctx).visible).toBe(true);
        ctx.scene.update(0, 500);
        expect(ctx.texts.length).toBe(before + 1);
    });
});

describe('ClickerGame account reset', () => {
    const tough = (stages) => stages.map((stage) => ({ ...stage, monsterHealth: 1000 }));
    const atChapter = (chapter, completed = false) => ({ ...progress(), chapter, completed });
    const START = progress();
    const resetButton = (ctx) => ctx.hud('[data-testid="reset-account"]');
    const dialog = (ctx) => ctx.hud('[data-testid="reset-dialog"]');
    const question = (ctx) => ctx.hud('[data-testid="reset-question"]')?.textContent;
    const confirm = (ctx) => ctx.hud('[data-testid="reset-confirm"]');
    const cancel = (ctx) => ctx.hud('[data-testid="reset-cancel"]');
    const error = (ctx) => ctx.hud('[data-testid="reset-error"]')?.textContent;
    const crystals = (ctx) => ctx.hud('[data-testid="auto-click-crystals"]')?.textContent;
    const notice = (ctx) => ctx.control('[data-testid="card-notice"]');
    const autoClickElement = (ctx) => ctx.doms.find((d) => d.node.querySelector('.auto-click'));
    const deferred = () => {
        let resolve;
        const promise = new Promise((done) => { resolve = done; });

        return { promise, resolve };
    };

    it('shows Resetar conta (+4 cristais) in the auto click box in chapter 4', async () => {
        const ctx = await createScene({ start: atChapter(4) });

        expect(resetButton(ctx).textContent).toBe('Resetar conta (+4 cristais)');
        expect(autoClickElement(ctx).visible).toBe(true);
    });

    it('offers 15 crystals on a completed campaign', async () => {
        const ctx = await createScene({ start: atChapter(15, true) });

        expect(resetButton(ctx).textContent).toBe('Resetar conta (+15 cristais)');
    });

    it('offers 12 crystals at chapter 12', async () => {
        const ctx = await createScene({ start: atChapter(12) });

        expect(resetButton(ctx).textContent).toBe('Resetar conta (+12 cristais)');
    });

    it('shows no reset button and no box in chapter 1 for a player who never reset', async () => {
        const ctx = await createScene({ start: atChapter(1) });

        expect(resetButton(ctx)).toBeUndefined();
        expect(autoClickElement(ctx).visible).toBe(false);
    });

    it('opens the dialog with what is lost, what is kept and the reward', async () => {
        const ctx = await createScene({ start: atChapter(4) });

        expect(dialog(ctx).hidden).toBe(true);
        resetButton(ctx).click();

        expect(dialog(ctx).hidden).toBe(false);
        expect(question(ctx)).toBe('Resetar a conta? Você volta ao capítulo 1 e perde todos os talentos e pontos de talento. '
            + 'Moedas, equipamentos, cartas, cristais e o auto clique são mantidos. Você ganha 4 cristais.');
        expect(confirm(ctx).textContent).toBe('Resetar');
        expect(cancel(ctx).textContent).toBe('Cancelar');
    });

    it('says the chapter 12 reward in the dialog', async () => {
        const ctx = await createScene({ start: atChapter(12) });

        resetButton(ctx).click();

        expect(question(ctx)).toBe('Resetar a conta? Você volta ao capítulo 1 e perde todos os talentos e pontos de talento. '
            + 'Moedas, equipamentos, cartas, cristais e o auto clique são mantidos. Você ganha 12 cristais.');
    });

    it('says 15 crystals in the dialog of a completed campaign', async () => {
        const ctx = await createScene({ start: atChapter(15, true) });

        resetButton(ctx).click();

        expect(question(ctx)).toBe('Resetar a conta? Você volta ao capítulo 1 e perde todos os talentos e pontos de talento. '
            + 'Moedas, equipamentos, cartas, cristais e o auto clique são mantidos. Você ganha 15 cristais.');
    });

    it('measures the dialog again when it opens so it stays centred', async () => {
        const ctx = await createScene({ start: atChapter(4) });

        resetButton(ctx).click();

        expect(ctx.scene.resetDialogElement.updateSize).toHaveBeenCalledTimes(1);
        expect(ctx.scene.resetDialogElement.x).toBe(512);
        expect(ctx.scene.resetDialogElement.y).toBe(384);
    });

    it('closes the dialog on Cancelar and sends nothing', async () => {
        const ctx = await createScene({ start: atChapter(4) });
        resetButton(ctx).click();

        cancel(ctx).click();

        expect(dialog(ctx).hidden).toBe(true);
        expect(resetGateway.reset).not.toHaveBeenCalled();
    });

    it('a click in the dialog does not hit the monster', async () => {
        const ctx = await createScene({ start: atChapter(4), autoClickOn: false });
        const health = ctx.scene.monster.health;
        resetButton(ctx).click();

        cancel(ctx).click();

        expect(ctx.scene.monster.health).toBe(health);
        expect(ctx.texts).toHaveLength(0);
    });

    it('sends the reset from the chapter shown and disables Resetar until the answer arrives', async () => {
        const ctx = await createScene({ start: atChapter(4) });
        const answer = deferred();
        resetGateway.reset.mockReturnValue(answer.promise);
        resetButton(ctx).click();

        confirm(ctx).click();

        expect(resetGateway.reset).toHaveBeenCalledWith(4);
        expect(confirm(ctx).disabled).toBe(true);
        confirm(ctx).click();
        expect(resetGateway.reset).toHaveBeenCalledTimes(1);
        answer.resolve({ reward: 4, crystals: 4, resets: 1, progress: START });
        await flush();
    });

    it('closes the dialog, shows the answered crystals and the +4 cristais notice and fights chapter 1 again after the reset', async () => {
        const ctx = await createScene({ start: atChapter(4) });
        resetGateway.reset.mockResolvedValue({ reward: 4, crystals: 4, resets: 1, progress: START });
        resetButton(ctx).click();

        confirm(ctx).click();
        await flush();

        expect(dialog(ctx).hidden).toBe(true);
        expect(crystals(ctx)).toBe('Cristais: 4');
        expect(notice(ctx).textContent).toBe('+4 cristais');
        expect(notice(ctx).hidden).toBe(false);
        expect(ctx.timers.at(-1).delay).toBe(3000);
        expect(ctx.hud('.chapter-hud').textContent).toBe('Capítulo 1');
        expect(ctx.scene.session.encounter()).toMatchObject({ kind: 'PHASE', stage: 1, phase: 1 });
        expect(resetButton(ctx)).toBeUndefined();
    });

    it('reads the talents again after the reset, so the tree shows every level at 0 and no points', async () => {
        const ctx = await createScene({ start: atChapter(4) });
        const wiped = { ...COMBO_MAXED, level: 0, value: 0, nextCost: 1 };
        resetGateway.reset.mockResolvedValue({ reward: 4, crystals: 4, resets: 1, progress: START });
        talentGateway.list.mockResolvedValue({ talents: [ wiped ], points: { earned: 0, spent: 0, available: 0 } });
        resetButton(ctx).click();

        confirm(ctx).click();
        await flush();

        expect(ctx.scene.talents.talents()).toEqual([ wiped ]);
        expect(ctx.scene.talents.points()).toEqual({ earned: 0, spent: 0, available: 0 });
    });

    it('keeps the auto click running in chapter 1 after the reset', async () => {
        const ctx = await createScene({ start: { ...atChapter(4), definition: { ...definition, stages: tough(definition.stages) } } });
        resetGateway.reset.mockResolvedValue({ reward: 4, crystals: 4, resets: 1, progress: { ...START, definition: { ...definition, stages: tough(definition.stages) } } });
        resetButton(ctx).click();
        confirm(ctx).click();
        await flush();

        ctx.scene.update(0, 500);

        expect(autoClickElement(ctx).visible).toBe(true);
        expect(ctx.scene.monster.health).toBeLessThan(1000);
    });

    it('closes the dialog, realigns to the stored progress and keeps the crystals after a 409 mismatch', async () => {
        const ctx = await createScene({ start: atChapter(4), autoClick: { ...AUTO_CLICK_LEVEL_0, crystals: 6 } });
        resetGateway.reset.mockRejectedValue(new ApiError('mismatch', {
            status: 409, code: 'RESET_CHAPTER_MISMATCH', body: { code: 'RESET_CHAPTER_MISMATCH', progress: atChapter(5) }
        }));
        resetButton(ctx).click();

        confirm(ctx).click();
        await flush();

        expect(dialog(ctx).hidden).toBe(true);
        expect(ctx.hud('.chapter-hud').textContent).toBe('Capítulo 5');
        expect(crystals(ctx)).toBe('Cristais: 6');
        expect(resetButton(ctx).textContent).toBe('Resetar conta (+5 cristais)');
    });

    it('closes the dialog on a 409 RESET_LOCKED', async () => {
        const ctx = await createScene({ start: atChapter(4) });
        resetGateway.reset.mockRejectedValue(new ApiError('locked', { status: 409, code: 'RESET_LOCKED', body: { code: 'RESET_LOCKED' } }));
        resetButton(ctx).click();

        confirm(ctx).click();
        await flush();

        expect(dialog(ctx).hidden).toBe(true);
        expect(ctx.hud('.chapter-hud').textContent).toBe('Capítulo 4');
    });

    it('keeps the dialog open with the error line and Resetar enabled when the request fails', async () => {
        const ctx = await createScene({ start: atChapter(4) });
        resetGateway.reset.mockRejectedValue(new ApiError('Cannot reach the server. Try again later.'));
        resetButton(ctx).click();

        confirm(ctx).click();
        await flush();

        expect(dialog(ctx).hidden).toBe(false);
        expect(error(ctx)).toBe('Não foi possível resetar. Tente de novo.');
        expect(confirm(ctx).disabled).toBe(false);
        expect(ctx.hud('.chapter-hud').textContent).toBe('Capítulo 4');
    });

    it('shows the switch and runs the auto click in chapter 1 for a player who reset before', async () => {
        const ctx = await createScene({ start: { ...atChapter(1), definition: { ...definition, stages: tough(definition.stages) } }, autoClick: { ...AUTO_CLICK_LEVEL_0, resets: 1 } });

        ctx.scene.update(0, 500);

        expect(autoClickElement(ctx).visible).toBe(true);
        expect(resetButton(ctx)).toBeUndefined();
        expect(ctx.scene.monster.health).toBeLessThan(1000);
    });
});

describe('ClickerGame hero ascension', () => {
    const big = () => ({
        ...progress(1, 'PHASE', 1),
        definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000 })) }
    });
    //  levels: one number per slot, e.g. [ 2, 1, 1 ] for a 4-star hero (spec hero-ascension, Levels by stars)
    const levelled = (levels) => heroSkills(true, true, true).map((skill, index) => ({ ...skill, level: levels[index] }));
    const leaderAt = (id, stars, levels) => ({
        leaderId: id,
        heroes: [
            { ...heroEntry(id, { [stars]: 1 }, stars), ...(levels && { skills: levelled(levels) }) },
            heroEntry(id === 'kael' ? 'lyra' : 'kael', { 0: 1 }, 0)
        ]
    });
    const key = (ctx, name) => ctx.handlers[`keydown-${name}`]();
    const slot = (ctx, number) => ctx.control(`[data-testid="skill-slot-${number}"]`);
    const slotText = (ctx, number) => slot(ctx, number).querySelector('.skill-slot-cooldown').textContent;

    it('a 4 star Kael uses Corte Dimensional at level 2 for 31.875, shown 31.9', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderAt('kael', 4, [ 2, 1, 1 ]), talents: [] });

        key(ctx, 'ONE');

        expect(ctx.scene.monster.health).toBeCloseTo(968.125, 9);
        expect(ctx.texts.at(-1).text).toBe('31.9');
    });

    it('a 4 star Kael uses Investida do Baluarte still at level 1 for 6.8', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderAt('kael', 4, [ 2, 1, 1 ]), talents: [] });

        key(ctx, 'TWO');

        expect(ctx.scene.monster.health).toBeCloseTo(993.2, 9);
    });

    it('a 9 star Kael uses Corte Dimensional at level 3 for 72', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderAt('kael', 9, [ 3, 3, 3 ]), talents: [] });

        key(ctx, 'ONE');

        expect(ctx.scene.monster.health).toBeCloseTo(928, 9);
    });

    it('a skill without a level in the payload is used at level 1', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderAt('kael', 4), talents: [] });

        key(ctx, 'ONE');

        expect(ctx.scene.monster.health).toBeCloseTo(974.5, 9);
    });

    it('clicks for 1.7, 2, 2.3, 2.6, 2.9 and 3.2 with 4 to 9 stars', async () => {
        const texts = [];

        for (const stars of [ 4, 5, 6, 7, 8, 9 ])
        {
            const ctx = await createScene({ start: big(), heroes: leaderAt('kael', stars), talents: [] });

            ctx.click();
            texts.push(ctx.texts.at(-1).text);
        }

        expect(texts).toEqual([ '1.7', '2', '2.3', '2.6', '2.9', '3.2' ]);
    });

    it('a 4 star leader crits on a roll of 0.44 for 4.7 and not on 0.45', async () => {
        const crit = await createScene({ start: big(), heroes: leaderAt('kael', 4), talents: [] });

        crit.dice.value = 0.44;
        crit.click();
        expect(crit.scene.monster.health).toBeCloseTo(1000 - 4.675, 9);
        expect(crit.texts.at(-1).text).toBe('4.7');

        const plain = await createScene({ start: big(), heroes: leaderAt('kael', 4), talents: [] });

        plain.dice.value = 0.45;
        plain.click();
        expect(plain.scene.monster.health).toBeCloseTo(1000 - 1.7, 9);
        expect(plain.texts.at(-1).text).toBe('1.7');
    });

    it('a 9 star leader crits on a roll of 0.69 for 12.8 and not on 0.70', async () => {
        const crit = await createScene({ start: big(), heroes: leaderAt('kael', 9, [ 3, 3, 3 ]), talents: [] });

        crit.dice.value = 0.69;
        crit.click();
        expect(crit.scene.monster.health).toBeCloseTo(1000 - 12.8, 9);
        expect(crit.texts.at(-1).text).toBe('12.8');

        const plain = await createScene({ start: big(), heroes: leaderAt('kael', 9, [ 3, 3, 3 ]), talents: [] });

        plain.dice.value = 0.7;
        plain.click();
        expect(plain.scene.monster.health).toBeCloseTo(1000 - 3.2, 9);
        expect(plain.texts.at(-1).text).toBe('3.2');
    });

    it('Ventos Ligeiros cast by a 5 star Lyra stays at +50 % after she fuses to 6 stars', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderAt('lyra', 5, [ 2, 2, 1 ]), talents: [] });

        key(ctx, 'THREE');
        heroesGateway.fuse.mockResolvedValue({ ...heroEntry('lyra', { 6: 1 }, 6), skills: levelled([ 2, 2, 2 ]) });
        await ctx.scene.heroes.fuse('lyra', 5);
        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(1000 - 3.45, 9);
    });

    it('a fusion of the leader keeps the cooldown of a cooling slot', async () => {
        const ctx = await createScene({ start: big(), heroes: leaderAt('kael', 3, [ 1, 1, 1 ]), talents: [] });

        key(ctx, 'ONE');
        ctx.scene.update(0, 5000);
        heroesGateway.fuse.mockResolvedValue({ ...heroEntry('kael', { 4: 1 }, 4), skills: levelled([ 2, 1, 1 ]) });
        await ctx.scene.heroes.fuse('kael', 3);

        expect(slot(ctx, 1).getAttribute('data-state')).toBe('cooling');
        expect(slotText(ctx, 1)).toBe('15s');
    });
});

describe('ClickerGame hero team', () => {
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
    const ALLY_BLUE = '#7fd4ff';
    //  The auto click is off and the talents are empty: nothing but the allies and the clicks of the test touches the monster (AD-013)
    const open = async (allies, { heroOptions = {}, start = atChapter(5), ...extra } = {}) =>
    {
        const ctx = await createScene({ start, heroes: teamHeroes(allies, heroOptions), talents: [], autoClickOn: false, ...extra });

        await flush();

        return ctx;
    };
    const allyTexts = (ctx) => ctx.texts.filter((text) => text.style.color === ALLY_BLUE);
    const hp = (ctx) => ctx.hud('.monster-hp').textContent;
    const withDefense = (monster) => ({ ...definition, stages: definition.stages.map((stage, index) => (index === 0 ? { ...stage, monster } : stage)) });
    const ironMonster = () => ({ ...atChapter(5), definition: withDefense({ element: 'FIRE', defense: 40, critResistance: 30 }) });

    it('a fighting ally hits the monster for 2 at 1000 ms with no click', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        ctx.scene.update(0, 999);
        expect(ctx.scene.monster.health).toBe(10);

        ctx.scene.update(0, 1);
        expect(ctx.scene.monster.health).toBe(8);
    });

    it('the ally tick shows one light-blue 2 at x 740 in the damage font', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        ctx.scene.update(0, 1000);

        const text = ctx.texts.at(-1);

        expect(text.text).toBe('2');
        expect(text.x).toBe(740);
        expect(text.y).toBe(ctx.scene.damageTextY);
        expect(text.style).toMatchObject({ color: ALLY_BLUE, fontSize: 28, fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8 });
    });

    it('two allies show one number with the sum of the tick', async () => {
        const ctx = await open([ 'lyra', 'orina', null, null ]);

        ctx.scene.update(0, 1000);

        expect(allyTexts(ctx).map((text) => text.text)).toEqual([ '4' ]);
        expect(ctx.scene.monster.health).toBe(6);
    });

    it('Seraphine as an ally multiplies every ally hit by 1.25', async () => {
        const ctx = await open([ 'lyra', 'seraphine', null, null ]);

        ctx.scene.update(0, 1000);

        expect(allyTexts(ctx).map((text) => text.text)).toEqual([ '5' ]);
        expect(ctx.scene.monster.health).toBe(5);
    });

    it('an ally hit that does not kill moves the health bar and the HP text', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        ctx.scene.update(0, 1000);

        expect(hp(ctx)).toBe('HP 8/10');
        expect(ctx.fill.width).toBeCloseTo(240 * 0.8, 9);
    });

    it('an ally kill is handled once and the later slots do not land', async () => {
        const ctx = await open([ 'lyra', 'orina', null, null ], { heroOptions: { stars: { lyra: 9 } }, wallet: walletResponse(undefined, { 1: [ 3 ] }) });

        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.texts.map((text) => text.text)).toEqual([ '20' ]);
        expect(ctx.sprites).toHaveLength(3);

        ctx.scene.update(0, 1000);

        expect(ctx.texts).toHaveLength(1);
        expect(ctx.sprites).toHaveLength(3);
    });

    it('no ally hits while the campaign stands at chapter 4', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { start: atChapter(4) });

        ctx.scene.update(0, 3000);

        expect(ctx.scene.monster.health).toBe(10);
        expect(allyTexts(ctx)).toHaveLength(0);
    });

    it('no ally hits before the heroes load', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { heroes: new Error('offline') });

        ctx.scene.update(0, 3000);

        expect(ctx.scene.monster.health).toBe(10);
    });

    it('a heroes payload without team lands no ally hit', async () => {
        const ctx = await createScene({ start: atChapter(5), heroes: heroesResponse(), talents: [], autoClickOn: false });

        await flush();
        ctx.scene.update(0, 3000);

        expect(ctx.scene.monster.health).toBe(10);
    });

    it('an ally hit leaves the combo streak unchanged', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        ctx.click();

        const streak = ctx.hud('.combo-hud').textContent;

        ctx.scene.update(0, 1000);

        expect(ctx.hud('.combo-hud').textContent).toBe(streak);
    });

    it('the pause menu freezes the ally clock', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        ctx.scene.update(0, 600);
        ctx.scene.pauseFight();
        ctx.scene.update(0, 10000);
        ctx.scene.resumeFight();
        ctx.scene.update(0, 399);

        expect(ctx.scene.monster.health).toBe(10);

        ctx.scene.update(0, 1);

        expect(ctx.scene.monster.health).toBe(8);
    });

    it('ally hits keep landing while a hero screen is open', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        await ctx.scene.heroUi.show('heroes');
        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(8);
    });

    it('a leader change switches the element of the next ally hit', async () => {
        //  The task text says WATER, but WATER beats FIRE (x2); NATURE against FIRE is the half hit the spec reads as 1
        const payload = teamHeroes([ 'lyra', null, null, null ]);
        const heroes = { ...payload, heroes: payload.heroes.map((hero) => (hero.id === 'orina' ? { ...hero, element: 'NATURE' } : hero)) };
        const ctx = await open([ 'lyra', null, null, null ], { heroes });

        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(8);

        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'orina', team: teamPayload([ 'lyra', null, null, null ]) });
        await ctx.scene.heroes.setLeader('orina');
        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(7);
    });

    it('an ally that equips a piece hits with it on the next tick', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);
        const weapon = { id: 'w', slot: 'WEAPON', rarity: 'COMMON', refine: 0, clickDamage: 1, affixes: [], heroId: 'lyra', sellPrice: 1 };

        ctx.scene.update(0, 1000);
        expect(ctx.scene.monster.health).toBe(8);

        equipmentGateway.list.mockResolvedValue({ capacity: 100, pieces: [ weapon ] });
        await ctx.scene.equipment.load();
        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBe(4);
    });

    it('Kael as an ally starts a 30 s miniboss at Time: 35', async () => {
        const ctx = await open([ 'kael', null, null, null ], { heroOptions: { leaderId: 'lyra' }, start: atChapter(5, 1, 'PHASE', 5) });

        killAll(ctx);
        advance(ctx);

        expect(timer(ctx)).toBe('Time: 35');
    });

    it('Kael as the leader brings no passive: Time: 30', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { start: atChapter(5, 1, 'PHASE', 5) });

        killAll(ctx);
        advance(ctx);

        expect(timer(ctx)).toBe('Time: 30');
    });

    it('a team change keeps the running countdown', async () => {
        const ctx = await open([ 'kael', null, null, null ], { heroOptions: { leaderId: 'lyra' }, start: atChapter(5, 1, 'PHASE', 5) });

        killAll(ctx);
        advance(ctx);
        expect(timer(ctx)).toBe('Time: 35');

        heroesGateway.setTeam.mockResolvedValue({ leaderId: 'lyra', team: teamPayload([ null, null, null, null ]) });
        await ctx.scene.heroes.setTeam([ null, null, null, null ]);
        ctx.scene.update(0, 0);

        expect(timer(ctx)).toBe('Time: 35');
    });

    it('Orina as an ally shows Defesa 25% on a monster of defense 40', async () => {
        const ctx = await open([ 'orina', null, null, null ], { start: ironMonster() });

        expect(ctx.hud('.enemy-stats').textContent).toBe('Fire  Defesa 25%  Seu crítico: 0%');

        ctx.click();

        expect(ctx.scene.monster.health).toBeCloseTo(9.25, 9);
    });

    it('Vex as an ally shows Seu crítico: 10% on a monster of critical resistance 5, 5% without him', async () => {
        const start = () => ({ ...atChapter(5), definition: withDefense({ element: 'FIRE', defense: 40, critResistance: 5 }) });
        const withVex = await open([ 'vex', null, null, null ], { start: start() });
        const without = await open([ null, null, null, null ], { start: start() });

        expect(withVex.hud('.enemy-stats').textContent).toBe('Fire  Defesa 40%  Seu crítico: 10%');
        expect(without.hud('.enemy-stats').textContent).toBe('Fire  Defesa 40%  Seu crítico: 5%');
    });

    it('the chip follows a change of the fighting allies: Lyra in slot 1 turns Seu crítico: 10% into 20%', async () => {
        const ctx = await open([ null, null, null, null ]);

        expect(ctx.hud('.enemy-stats').textContent).toBe('Fire  Defesa 0%  Seu crítico: 10%');

        heroesGateway.setTeam.mockResolvedValue({ leaderId: 'kael', team: teamPayload([ 'lyra', null, null, null ]) });
        await ctx.scene.heroes.setTeam([ 'lyra', null, null, null ]);

        expect(ctx.hud('.enemy-stats').textContent).toBe('Fire  Defesa 0%  Seu crítico: 20%');
    });

    it('Lyra as an ally makes a roll of 15 a critical click', async () => {
        const withLyra = await open([ 'lyra', null, null, null ]);

        withLyra.dice.value = 0.15;
        withLyra.click();

        expect(withLyra.scene.monster.health).toBe(8);

        const without = await open([ null, null, null, null ]);

        without.dice.value = 0.15;
        without.click();

        expect(without.scene.monster.health).toBe(9);
    });

    it('the purchase wallet reaches the wallet text', async () => {
        const ctx = await open([ null, null, null, null ], { wallet: walletResponse() });

        await flush();
        heroesGateway.buySlot.mockResolvedValue({ team: teamPayload([ null, null, null, null ], { boughtSlots: 1 }), wallet: { gold: 0, silver: 50, copper: 0 } });
        await ctx.scene.heroes.buySlot(0);

        expect(ctx.walletText().textContent).toBe('Gold: 0  Silver: 50  Copper: 0');
    });

    it('the next chapter reloads the heroes', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { start: atChapter(5, 10, 'CHAPTER_BOSS', 1) });

        campaignGateway.report.mockResolvedValue(atChapter(6, 1, 'PHASE', 1));
        killAll(ctx);
        advance(ctx);
        await flush();

        expect(label(ctx)).toBe('Stage 1/10  Phase 1/5');
        expect(heroesGateway.list).toHaveBeenCalledTimes(2);
    });

    describe('the frame where an effect ends, and every trigger of the ally ACs (spec hero-team)', () => {
        const key = (ctx, name) => ctx.handlers[`keydown-${name}`]();
        //  A chapter 5 monster of 1000 HP with the given stats: nothing dies and the exact sums can be read from the health
        const bigMonster = (monster = { element: 'FIRE', defense: 0, critResistance: 0 }) => ({
            ...atChapter(5),
            definition: { ...definition, stages: definition.stages.map((stage) => ({ ...stage, monsterHealth: 1000, monster })) }
        });
        const tree = (values) => Object.entries(values).map(([ id, value ]) => ({ id, perLevel: 1, maxLevel: 50, level: value, value, nextCost: 300 }));

        it('an ally tick in the frame where Prisão de Espinhos ends still gets +25 %: 2.5 at 2000 ms, 2 after it', async () => {
            const ctx = await open([ 'lyra', null, null, null ], { heroOptions: { leaderId: 'orina', stars: { orina: 1 } }, start: bigMonster() });

            key(ctx, 'ONE');
            ctx.scene.update(0, 1000);
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 2.5, 9);

            //  The second tick lands in the very frame that uses up the 2000 ms of Prisão
            ctx.scene.update(0, 1000);
            expect(allyTexts(ctx).map((text) => text.text)).toEqual([ '2.5', '2.5' ]);
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 5, 9);

            ctx.scene.update(0, 1000);
            expect(allyTexts(ctx).map((text) => text.text)).toEqual([ '2.5', '2.5', '2' ]);
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 7, 9);
        });

        it('an ally tick in the frame where Bênção da Grande Árvore ends still gets +30 %: 2.6 at 15000 ms, 2 after it', async () => {
            const ctx = await open([ 'lyra', null, null, null ], { heroOptions: { leaderId: 'seraphine', stars: { seraphine: 1 } }, start: bigMonster() });

            key(ctx, 'ONE');
            ctx.scene.update(0, 14000);
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 14 * 2.6, 9);

            //  The 15th tick lands in the very frame that uses up the 15000 ms of Bênção
            ctx.scene.update(0, 1000);
            expect(allyTexts(ctx).at(-1).text).toBe('2.6');
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 15 * 2.6, 9);

            ctx.scene.update(0, 1000);
            expect(allyTexts(ctx).at(-1).text).toBe('2');
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 15 * 2.6 - 2, 9);
        });

        it('an ally that fuses to more stars hits with the new multiplier on the next tick: 4, then 6', async () => {
            const ctx = await open([ 'lyra', null, null, null ], { heroOptions: { stars: { lyra: 1 } }, start: bigMonster() });

            ctx.scene.update(0, 1000);
            expect(allyTexts(ctx).at(-1).text).toBe('4');
            expect(ctx.scene.monster.health).toBe(996);

            heroesGateway.fuse.mockResolvedValue(heroEntry('lyra', { 0: 1 }, 2));
            await ctx.scene.heroes.fuse('lyra', 1);
            ctx.scene.update(0, 1000);

            expect(allyTexts(ctx).at(-1).text).toBe('6');
            expect(ctx.scene.monster.health).toBe(990);
        });

        it('power talents of the leader (CLICK_DAMAGE 20, CRIT_CHANCE 20) reach the click but leave the ally tick at 2', async () => {
            const ctx = await open([ 'lyra', null, null, null ], { start: bigMonster(), talents: tree({ CLICK_DAMAGE: 20, CRIT_CHANCE: 20 }) });

            ctx.click();
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 1.2, 9);

            ctx.dice.value = 0;
            ctx.scene.update(0, 1000);

            expect(allyTexts(ctx).map((text) => text.text)).toEqual([ '2' ]);
            expect(ctx.scene.monster.health).toBeCloseTo(1000 - 1.2 - 2, 9);
        });

        //  Kael at 1 star: Corte Dimensional is 1500 % of a click of 1.1, 16.5, and 33 when critical (10 % base, 20 % with Lyra)
        it('Lyra as an ally adds 10 critical chance to a skill hit of the leader: a roll of 15 crits (33), not without her (16.5)', async () => {
            const withLyra = await open([ 'lyra', null, null, null ], { heroOptions: { stars: { kael: 1 } }, start: bigMonster() });

            withLyra.dice.value = 0.15;
            key(withLyra, 'ONE');
            expect(withLyra.scene.monster.health).toBeCloseTo(1000 - 33, 9);

            const without = await open([ null, null, null, null ], { heroOptions: { stars: { kael: 1 } }, start: bigMonster() });

            without.dice.value = 0.15;
            key(without, 'ONE');
            expect(without.scene.monster.health).toBeCloseTo(1000 - 16.5, 9);
        });

        it('Vex as an ally takes 15 points off the critical resistance 5 a skill hit meets: a roll of 8 crits (33), not without him (16.5)', async () => {
            const monster = { element: 'FIRE', defense: 0, critResistance: 5 };
            const withVex = await open([ 'vex', null, null, null ], { heroOptions: { stars: { kael: 1 } }, start: bigMonster(monster) });

            withVex.dice.value = 0.08;
            key(withVex, 'ONE');
            expect(withVex.scene.monster.health).toBeCloseTo(1000 - 33, 9);

            const without = await open([ null, null, null, null ], { heroOptions: { stars: { kael: 1 } }, start: bigMonster(monster) });

            without.dice.value = 0.08;
            key(without, 'ONE');
            expect(without.scene.monster.health).toBeCloseTo(1000 - 16.5, 9);
        });
    });
});

describe('ClickerGame hero team formation', () => {
    const TEXTURES = {
        hero_kael: { width: 300, height: 279 }, hero_lyra: { width: 102, height: 300 }, hero_orina: { width: 125, height: 300 },
        hero_seraphine: { width: 118, height: 300 }, hero_vex: { width: 108, height: 300 }
    };
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
    //  Chapter 5, every hero owned, the auto click off and no talent: only the allies and the clicks of the test touch the monster
    const open = async (allies, { heroOptions = {}, start = atChapter(5), heroes = teamHeroes(allies, heroOptions), ...extra } = {}) =>
    {
        const ctx = await createScene({ start, heroes, talents: [], autoClickOn: false, textures: TEXTURES, ...extra });

        await flush();

        return ctx;
    };
    //  The hero images that stand now: a redraw destroys the old ones, which stay in the list of the fake
    const standing = (ctx) => ctx.images.filter((image) => image.key.startsWith('hero_') && image.destroy.mock.calls.length === 0);
    const alliesOf = (ctx) => standing(ctx).filter((image) => image !== ctx.scene.character);
    const sprite = (ctx, key) => alliesOf(ctx).find((image) => image.key === key);
    const boughtOnly = (allies, boughtSlots, heroOptions = {}) => ({ ...teamHeroes(allies, heroOptions), team: teamPayload(allies, { boughtSlots }) });

    it('with no ally the leader stands at (230, 612), 320 px high', async () => {
        const ctx = await open([ null, null, null, null ]);
        const leader = ctx.scene.character;

        expect([ leader.x, leader.y ]).toEqual([ 230, 612 ]);
        expect(leader.scale * leader.height).toBeCloseTo(320, 9);
    });

    it('with Lyra in slot 1 the leader moves to (320, 600) fitted in 180 x 240', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);
        const leader = ctx.scene.character;

        expect([ leader.x, leader.y ]).toEqual([ 320, 600 ]);
        expect(leader.scale).toBeCloseTo(0.6, 9);
        expect(leader.depth).toBe(0.5);
    });

    it('Lyra as leader in the formation is fitted at scale 0.8', async () => {
        const ctx = await open([ 'kael', null, null, null ], { heroOptions: { leaderId: 'lyra' } });

        expect(ctx.scene.character.key).toBe('hero_lyra');
        expect(ctx.scene.character.scale).toBeCloseTo(0.8, 9);
    });

    it('allies stand at (180, 460), (180, 605), (75, 462) and (75, 615) at depths 0.4, 0.4, 0.3 and 0.3', async () => {
        const ctx = await open([ 'lyra', 'orina', 'seraphine', 'vex' ]);

        expect(alliesOf(ctx).map(({ key, x, y, depth, originX, originY }) => ({ key, x, y, depth, originX, originY }))).toEqual([
            { key: 'hero_lyra', x: 180, y: 460, depth: 0.4, originX: 0.5, originY: 1 },
            { key: 'hero_orina', x: 180, y: 605, depth: 0.4, originX: 0.5, originY: 1 },
            { key: 'hero_seraphine', x: 75, y: 462, depth: 0.3, originX: 0.5, originY: 1 },
            { key: 'hero_vex', x: 75, y: 615, depth: 0.3, originX: 0.5, originY: 1 }
        ]);
    });

    it('Kael in an ally box is scaled 0.3 and Lyra 0.4', async () => {
        const ctx = await open([ 'kael', 'lyra', null, null ], { heroOptions: { leaderId: 'orina' } });
        const kael = sprite(ctx, 'hero_kael');
        const lyra = sprite(ctx, 'hero_lyra');

        expect([ kael.scale, lyra.scale ]).toEqual([ expect.closeTo(0.3, 9), expect.closeTo(0.4, 9) ]);
        expect([ kael.scale * kael.width, kael.scale * kael.height ]).toEqual([ expect.closeTo(90, 9), expect.closeTo(83.7, 9) ]);
        expect([ lyra.scale * lyra.width, lyra.scale * lyra.height ]).toEqual([ expect.closeTo(40.8, 9), expect.closeTo(120, 9) ]);
    });

    it('an empty or unbought slot draws no sprite', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { heroes: boughtOnly([ 'lyra', null, null, null ], 2) });

        expect(alliesOf(ctx).map(({ key }) => key)).toEqual([ 'hero_lyra' ]);
    });

    it('no ally is drawn below chapter 5', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { start: atChapter(4) });

        expect(alliesOf(ctx)).toHaveLength(0);
        expect([ ctx.scene.character.x, ctx.scene.character.y ]).toEqual([ 230, 612 ]);
    });

    it('no ally is drawn before the heroes load', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { heroes: new Error('offline') });

        expect(ctx.images.some((image) => image.key.startsWith('hero_'))).toBe(false);
    });

    it('a team change redraws the allies and the leader', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);
        const lyra = sprite(ctx, 'hero_lyra');

        heroesGateway.setTeam.mockResolvedValue({ leaderId: 'kael', team: teamPayload([ null, null, null, null ]) });
        await ctx.scene.heroes.setTeam([ null, null, null, null ]);

        expect(lyra.destroy).toHaveBeenCalled();
        expect(alliesOf(ctx)).toHaveLength(0);
        expect([ ctx.scene.character.x, ctx.scene.character.y ]).toEqual([ 230, 612 ]);
    });

    it('a leader change redraws the formation', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra', team: teamPayload([ 'kael', null, null, null ]) });
        await ctx.scene.heroes.setLeader('lyra');

        expect(ctx.scene.character.key).toBe('hero_lyra');
        expect(alliesOf(ctx).map(({ key, x, y }) => ({ key, x, y }))).toEqual([ { key: 'hero_kael', x: 180, y: 460 } ]);
    });

    it('a chapter change redraws at the next encounter', async () => {
        const ctx = await open([ 'lyra', null, null, null ], { start: atChapter(4, 10, 'CHAPTER_BOSS', 1) });

        expect(alliesOf(ctx)).toHaveLength(0);

        campaignGateway.report.mockResolvedValue(atChapter(5, 1, 'PHASE', 1));
        killAll(ctx);
        advance(ctx);
        await flush();

        expect(alliesOf(ctx).map(({ key, x, y }) => ({ key, x, y }))).toEqual([ { key: 'hero_lyra', x: 180, y: 460 } ]);
    });

    it('each ally hit moves its sprite 24 px right and back in 100 ms each way', async () => {
        const ctx = await open([ 'lyra', null, null, null ]);

        ctx.scene.update(0, 1000);

        expect(ctx.tweens.find((tween) => tween.targets === sprite(ctx, 'hero_lyra'))).toMatchObject({ x: 204, duration: 100, yoyo: true });
    });

    it('a kill moves only the slots that landed', async () => {
        const ctx = await open([ 'lyra', 'orina', null, null ], { heroOptions: { stars: { lyra: 9 } } });

        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.dead).toBe(true);
        expect(ctx.tweens.filter((tween) => tween.targets === sprite(ctx, 'hero_lyra'))).toHaveLength(1);
        expect(ctx.tweens.filter((tween) => tween.targets === sprite(ctx, 'hero_orina'))).toHaveLength(0);
    });

    it('no ally sprite takes input', async () => {
        const ctx = await open([ 'lyra', 'orina', null, null ]);

        alliesOf(ctx).forEach((image) => expect(image.setInteractive).toBeUndefined());

        ctx.handlers.pointerdown({ x: 180, y: 400 });

        expect(ctx.scene.monster.health).toBe(9);
    });
});

const ADD = { health: 30, defenseBuff: 30 };
//  Two adds that guard the defense-49 miniboss up to 90 (49 + 21 + 20), under the 100 where a hit deals 0: the tests that need the
//  guarded miniboss to take damage use them
const GUARD_90 = [ { health: 30, defenseBuff: 21 }, { health: 30, defenseBuff: 20 } ];
//  Stage 1 of chapter 11: phase monsters of defense 0, a miniboss of defense 49 and its adds
const addsDefinition = ({
    adds = [ ADD, ADD ], miniboss = { element: 'FIRE', defense: 49, critResistance: 0 }, minibossHealth = 100,
    monster = { element: 'FIRE', defense: 0, critResistance: 0 }
} = {}) => ({
    ...definition,
    stages: definition.stages.map((stage) => (stage.number === 1
        ? { ...stage, minibossHealth, miniboss, monster, adds }
        : stage))
});
const addsStart = (options) => ({ ...progress(1, 'MINIBOSS', 1), chapter: 11, definition: addsDefinition(options) });
const addsScene = (options, extra = {}) => createScene({ start: addsStart(options), talents: [], autoClickOn: false, ...extra });
const killAdd = (ctx, slot) => {
    const { monster } = ctx.scene.fight.adds[slot - 1];

    monster.hit(monster.health);
    ctx.scene.afterDamage();
};
const onMiniboss = { x: 670, y: 440 };
const partsOf = (ctx) => [ ...ctx.scene.addParts.values() ].flatMap((parts) => Object.values(parts));
const enemyLine = (ctx) => ctx.hud('.enemy-stats').textContent;
const chip = (ctx) => ctx.hud('.target-chip').textContent;

describe('ClickerGame miniboss adds', () => {
    it('a miniboss with two adds draws two add bodies of 110 x 125 at (480, 360) and (480, 540)', async () => {
        const ctx = await addsScene();
        const bodies = ctx.byColor(0xf5ead8);

        expect(bodies).toHaveLength(3);
        expect(bodies.slice(1).map(({ x, y, width, height }) => ({ x, y, width, height }))).toEqual([
            { x: 480, y: 360, width: 110, height: 125 },
            { x: 480, y: 540, width: 110, height: 125 }
        ]);
    });

    it('each add has a 100 x 8 bar with its top-left at (430, 279.5) and (430, 459.5)', async () => {
        const ctx = await addsScene();

        [ ctx.byColor(0x2a1410), ctx.byColor(0xc0392b) ].forEach((bars) =>
        {
            expect(bars.slice(1).map(({ originX, originY, x, y, width, height }) => ({ originX, originY, x, y, width, height }))).toEqual([
                { originX: 0, originY: 0, x: 430, y: 279.5, width: 100, height: 8 },
                { originX: 0, originY: 0, x: 430, y: 459.5, width: 100, height: 8 }
            ]);
        });
    });

    it('each add shows +30 de defesa at (480, 276.5) and (480, 456.5) in Figtree 700 12 px white with a dark outline', async () => {
        const ctx = await addsScene();

        expect(ctx.texts.map(({ text, x, y, originX, originY, style }) => ({ text, x, y, originX, originY, style }))).toEqual([ 276.5, 456.5 ].map((y) => ({
            text: '+30 de defesa', x: 480, y, originX: 0.5, originY: 1,
            style: { fontFamily: 'Figtree', fontStyle: '700', fontSize: 12, color: '#ffffff', stroke: '#2a1408', strokeThickness: 3 }
        })));
    });

    it('the add monsters have 30 health and no drop rule', async () => {
        const { scene } = await addsScene();

        expect(scene.fight.adds.map(({ name, monster }) => [ name, monster.maxHealth, monster.dropRuleId ])).toEqual([ [ 'Lacaio 1', 30, null ], [ 'Lacaio 2', 30, null ] ]);
    });

    it('a phase monster, a miniboss without adds and the chapter boss draw no add', async () => {
        for (const start of [ progress(1, 'PHASE', 1), progress(1, 'MINIBOSS', 1), progress(10, 'CHAPTER_BOSS', 1) ])
        {
            const ctx = await createScene({ start, talents: [], autoClickOn: false });

            expect(ctx.byColor(0xf5ead8)).toHaveLength(1);
            expect(ctx.rectangles).toHaveLength(3);
            expect(ctx.triangles).toHaveLength(0);
            expect(chip(ctx)).toBe('');
        }
    });

    it('the enemy line of the guarded miniboss reads Defesa 109%', async () => {
        const ctx = await addsScene();

        expect(enemyLine(ctx)).toBe('Fire  Defesa 109%  Seu crítico: 10%');
    });

    it('a click on the guarded miniboss deals 0 at defense 109, then 0.21 after one add died and 0.51 after both', async () => {
        const ctx = await addsScene();

        ctx.click(onMiniboss);
        expect(ctx.scene.monster.health).toBe(100);

        killAdd(ctx, 1);
        ctx.click(onMiniboss);
        expect(ctx.scene.monster.health).toBeCloseTo(99.79, 9);

        killAdd(ctx, 2);
        ctx.click(onMiniboss);
        expect(ctx.scene.monster.health).toBeCloseTo(99.28, 9);
    });

    it('an add death changes the enemy line to Defesa 79%', async () => {
        const ctx = await addsScene();

        killAdd(ctx, 1);

        expect(enemyLine(ctx)).toBe('Fire  Defesa 79%  Seu crítico: 10%');
    });

    it('an add death fades its body, bar, fill and text over 500 ms and destroys them', async () => {
        const ctx = await addsScene();
        const { body, back, fill, label } = ctx.scene.addParts.get(1);

        killAdd(ctx, 1);

        const tween = ctx.tweens.at(-1);

        expect(tween.targets).toEqual([ body, back, fill, label ]);
        expect([ tween.alpha, tween.duration ]).toEqual([ 0, 500 ]);

        tween.onComplete();

        [ body, back, fill, label ].forEach((part) => expect(part.destroy).toHaveBeenCalledTimes(1));
        expect(ctx.scene.addParts.has(1)).toBe(false);
        expect(ctx.scene.addParts.has(2)).toBe(true);
    });

    it('an add death drops no coin and sends no report', async () => {
        const ctx = await addsScene({}, { wallet: walletResponse() });
        const sprites = ctx.sprites.length;

        killAdd(ctx, 1);
        await flush();

        expect(ctx.sprites).toHaveLength(sprites);
        expect(campaignGateway.report).not.toHaveBeenCalled();
    });

    it('the target chip reads Alvo: Miniboss · HP 100/100 and follows its HP', async () => {
        const ctx = await addsScene({ adds: GUARD_90 });

        expect(chip(ctx)).toBe('Alvo: Miniboss · HP 100/100');

        ctx.click(onMiniboss);

        expect(chip(ctx)).toBe('Alvo: Miniboss · HP 99.9/100');
    });

    it('the marker is a gold 16 x 10 triangle with its tip at (670, 275), depth 0.9', async () => {
        const { triangles } = await addsScene();

        expect(triangles).toHaveLength(1);
        expect(triangles[0]).toMatchObject({ color: 0xffd24a, points: [ 0, 0, 16, 0, 8, 10 ], x: 670, y: 270, depth: 0.9 });
    });

    it('the marker and the chip stay on the miniboss after both adds died', async () => {
        const ctx = await addsScene();

        killAdd(ctx, 1);
        killAdd(ctx, 2);

        expect([ ctx.triangles[0].x, ctx.triangles[0].y ]).toEqual([ 670, 270 ]);
        expect(ctx.triangles[0].destroy).not.toHaveBeenCalled();
        expect(chip(ctx)).toBe('Alvo: Miniboss · HP 100/100');
    });

    it('the add bars follow the add health', async () => {
        const ctx = await addsScene();

        ctx.scene.fight.adds[0].monster.hit(15);
        ctx.scene.updateHealthBar();

        expect(ctx.byColor(0xc0392b)[1].width).toBe(50);
    });

    it("the miniboss's death fades the living adds before the miniboss and wins once", async () => {
        const ctx = await addsScene({ minibossHealth: 0.1, adds: GUARD_90 });
        const parts = [ ...partsOf(ctx), ctx.scene.marker ];

        ctx.click(onMiniboss);
        await flush();

        const addTween = ctx.tweens.findIndex((tween) => Array.isArray(tween.targets) && parts.every((part) => tween.targets.includes(part)));
        const minibossTween = ctx.tweens.findIndex((tween) => tween.targets === ctx.scene.monsterParts);

        expect(addTween).toBeGreaterThanOrEqual(0);
        expect(addTween).toBeLessThan(minibossTween);
        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
        expect(campaignGateway.report.mock.calls[0][1]).toBe('CLEARED');

        ctx.tweens[addTween].onComplete();

        parts.forEach((part) => expect(part.destroy).toHaveBeenCalledTimes(1));
    });

    it('the countdown removes every add at once and reports FAILED', async () => {
        const ctx = await addsScene();
        const parts = [ ...partsOf(ctx), ctx.scene.marker ];

        ctx.scene.update(0, 30000);

        parts.forEach((part) => expect(part.destroy).toHaveBeenCalledTimes(1));
        expect(chip(ctx)).toBe('');
        expect(ctx.scene.fight).toBeNull();

        await ctx.loops[0].callback();
        await flush();

        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
        expect(campaignGateway.report.mock.calls[0][1]).toBe('FAILED');
    });

    it('leaving the fight from the pause menu removes every add at once', async () => {
        const ctx = await addsScene();
        const parts = [ ...partsOf(ctx), ctx.scene.marker ];

        ctx.scene.pauseFight();
        ctx.scene.leaveFight();

        parts.forEach((part) => expect(part.destroy).toHaveBeenCalledTimes(1));
        expect(ctx.scene.fight).toBeNull();
    });

    it('a realignment removes the old adds at once and draws the new adds', async () => {
        const ctx = await addsScene();
        const old = Object.values(ctx.scene.addParts.get(1));

        ctx.scene.realign(ctx.scene.session.encounter());

        old.forEach((part) => expect(part.destroy).toHaveBeenCalledTimes(1));
        expect(ctx.byColor(0xf5ead8)).toHaveLength(5);
        expect(ctx.scene.fight.adds).toHaveLength(2);
    });

    it('a farm fight of the chapter 11 miniboss draws its adds', async () => {
        const ctx = await addsScene();

        ctx.scene.startFarm({ kind: 'MINIBOSS', stage: 1 });

        expect(ctx.scene.fight.adds).toHaveLength(2);
        expect(ctx.byColor(0xf5ead8).slice(-2).map(({ x, y }) => [ x, y ])).toEqual([ [ 480, 360 ], [ 480, 540 ] ]);
    });

    it('a stage with an invalid add spawns only the valid one', async () => {
        const ctx = await addsScene({ adds: [ { health: 0, defenseBuff: 30 }, ADD ] });

        expect(ctx.scene.fight.adds).toHaveLength(1);
        expect(ctx.scene.fight.adds[0].name).toBe('Lacaio 1');
        expect([ ctx.byColor(0xf5ead8)[1].x, ctx.byColor(0xf5ead8)[1].y ]).toEqual([ 480, 360 ]);
    });

    it('a hit on an add meets its own defense, not the guard', async () => {
        const { scene } = await addsScene();
        const add = scene.fight.adds[0].monster;
        const result = scene.skills.click({ attacker: scene.leaderAttacker(), monster: add, main: scene.monster, boss: true });

        expect(result.damage).toBeCloseTo(1, 9);
        expect(add.health).toBeCloseTo(29, 9);
    });

    //  The adds carry the stats of the stage's phase monster; here defense 20 so that a break is visible (the seeded phase monsters have 0)
    const SHIELDED = { monster: { element: 'FIRE', defense: 20, critResistance: 30 } };
    const breakTalent = { id: 'PHYSICAL_BREAK', perLevel: 1, maxLevel: 10, level: 5, value: 5, nextCost: 300 };

    it('a hit on an add of defense 20 deals 0.8, and 0.85 under Quebra de defesa 5', async () => {
        const plain = await addsScene(SHIELDED);

        plain.click({ x: 480, y: 360 });

        expect(plain.scene.fight.adds[0].monster.health).toBeCloseTo(29.2, 9);

        const broken = await addsScene(SHIELDED, { talents: [ breakTalent ] });

        broken.click({ x: 480, y: 360 });

        expect(broken.scene.fight.adds[0].monster.health).toBeCloseTo(29.15, 9);
    });

    it('the Erosão Arcana of an Orina ally takes 15 points off the defense of an add: two hits of 1.9 show one 3.8, not 3.2', async () => {
        const ctx = await addsScene(SHIELDED, { heroes: teamHeroes([ 'lyra', 'orina', null, null ]) });

        ctx.click({ x: 480, y: 360 });

        const before = ctx.texts.length;

        ctx.scene.update(0, 1000);

        //  Lyra and Orina hit for 2 each; the add's 20 defense drops to 5, so each deals 1.9 and the tick shows their sum at the add's ally number place
        expect(ctx.texts.slice(before).map(({ text, x, y, style }) => [ text, x, y, style.color ])).toEqual([ [ '3.8', 520, 360, '#7fd4ff' ] ]);
    });
});

describe('ClickerGame miniboss target', () => {
    const lacaio1 = { x: 480, y: 360 };
    const lacaio2 = { x: 480, y: 540 };
    const allyScene = (allies, options = {}, extra = {}) => addsScene(options, { heroes: teamHeroes(allies), ...extra });
    const lastText = (ctx) => ctx.texts.at(-1);
    const healthOf = (ctx, slot) => ctx.scene.fight.adds[slot - 1].monster.health;

    it('a click on Lacaio 1 hits it for 1 and makes it the target', async () => {
        const ctx = await addsScene();

        ctx.click(lacaio1);

        expect(healthOf(ctx, 1)).toBeCloseTo(29, 9);
        expect(ctx.scene.fight.target).toBe(ctx.scene.fight.adds[0].monster);
        expect(chip(ctx)).toBe('Alvo: Lacaio 1 · HP 29/30');
        expect(enemyLine(ctx)).toBe('Fire  Defesa 0%  Seu crítico: 10%');
    });

    it('the chip follows the target of a fight with adds: the main reads Seu crítico: 10%, an add of resistance 4 reads 6%', async () => {
        const ctx = await addsScene({
            miniboss: { element: 'FIRE', defense: 49, critResistance: 0 }, monster: { element: 'FIRE', defense: 0, critResistance: 4 }
        });

        expect(enemyLine(ctx)).toBe('Fire  Defesa 109%  Seu crítico: 10%');

        ctx.click(lacaio1);

        expect(enemyLine(ctx)).toBe('Fire  Defesa 0%  Seu crítico: 6%');
    });

    it('a click on an add shows its number where it landed, at y 360', async () => {
        const ctx = await addsScene();

        ctx.click({ x: 500, y: 380 });

        expect([ lastText(ctx).text, lastText(ctx).x, lastText(ctx).y ]).toEqual([ '1', 500, 360 ]);
    });

    it('a click on Lacaio 2 shows its number at y 540 and makes it the target', async () => {
        const ctx = await addsScene();

        ctx.click(lacaio2);

        expect([ lastText(ctx).text, lastText(ctx).x, lastText(ctx).y ]).toEqual([ '1', 480, 540 ]);
        expect(ctx.scene.fight.target).toBe(ctx.scene.fight.adds[1].monster);
        expect(chip(ctx)).toBe('Alvo: Lacaio 2 · HP 29/30');
    });

    it('the marker moves over Lacaio 1 and Lacaio 2', async () => {
        const ctx = await addsScene();

        ctx.click(lacaio1);
        expect([ ctx.triangles[0].x, ctx.triangles[0].y ]).toEqual([ 480, 253.5 ]);

        ctx.click(lacaio2);
        expect([ ctx.triangles[0].x, ctx.triangles[0].y ]).toEqual([ 480, 433.5 ]);
    });

    it('a click on the miniboss makes it the target again', async () => {
        const ctx = await addsScene({ adds: GUARD_90 });

        ctx.click(lacaio1);
        ctx.click(onMiniboss);

        expect(ctx.scene.fight.target).toBe(ctx.scene.monster);
        expect([ ctx.triangles[0].x, ctx.triangles[0].y ]).toEqual([ 670, 270 ]);
        expect(ctx.scene.monster.health).toBeCloseTo(99.9, 9);
    });

    it('a click on the target again keeps it', async () => {
        const ctx = await addsScene();

        ctx.click(lacaio1);
        ctx.click(lacaio1);

        expect(ctx.scene.fight.target).toBe(ctx.scene.fight.adds[0].monster);
        expect(healthOf(ctx, 1)).toBeCloseTo(28, 9);
    });

    it("a click on no monster hits the target with its number at the target's centre x", async () => {
        const ctx = await addsScene();

        ctx.click(lacaio1);
        ctx.click({ x: 100, y: 100 });

        expect(healthOf(ctx, 1)).toBeCloseTo(28, 9);
        expect([ lastText(ctx).x, lastText(ctx).y ]).toEqual([ 480, 360 ]);
    });

    it('a click where a dead add stood hits the target', async () => {
        const ctx = await addsScene();

        killAdd(ctx, 1);
        ctx.click(lacaio1);

        expect(ctx.scene.monster.health).toBeCloseTo(99.79, 9);
        expect(healthOf(ctx, 2)).toBe(30);
    });

    //  The bodies of the Fight Layout: Lacaio 1 x 425 to 535, y 297.5 to 422.5; Lacaio 2 x 425 to 535, y 477.5 to 602.5; miniboss x 560 to 780, y 315 to 565
    it('a click just inside the body of an add or of the miniboss picks that monster', async () => {
        const ctx = await addsScene();
        const { fight } = ctx.scene;
        const inside = [
            [ { x: 426, y: 299 }, fight.adds[0].monster ], [ { x: 534, y: 601 }, fight.adds[1].monster ], [ { x: 562, y: 317 }, fight.main ],
            [ { x: 534, y: 421 }, fight.adds[0].monster ], [ { x: 426, y: 479 }, fight.adds[1].monster ], [ { x: 778, y: 563 }, fight.main ]
        ];

        inside.forEach(([ pointer, monster ]) =>
        {
            ctx.click(pointer);

            expect(fight.target).toBe(monster);
        });
    });

    it('a click just outside every body hits the target and keeps it', async () => {
        const ctx = await addsScene();
        const { fight } = ctx.scene;
        const outside = [
            { x: 540, y: 360 }, { x: 420, y: 360 }, { x: 480, y: 295 }, { x: 480, y: 425 }, { x: 480, y: 475 }, { x: 480, y: 605 },
            { x: 555, y: 440 }, { x: 785, y: 440 }, { x: 670, y: 312 }, { x: 670, y: 568 }
        ];

        ctx.click(lacaio2);

        outside.forEach((pointer) =>
        {
            ctx.click(pointer);

            expect(fight.target).toBe(fight.adds[1].monster);
        });

        expect(healthOf(ctx, 2)).toBeCloseTo(30 - 1 - outside.length, 9);
        expect(healthOf(ctx, 1)).toBe(30);
        expect(ctx.scene.monster.health).toBe(100);
        expect([ lastText(ctx).x, lastText(ctx).y ]).toEqual([ 480, 540 ]);
    });

    it('the target goes back to the miniboss when the target add dies', async () => {
        const ctx = await addsScene();

        ctx.click(lacaio1);
        killAdd(ctx, 1);

        expect(ctx.scene.fight.target).toBe(ctx.scene.monster);
        expect([ ctx.triangles[0].x, ctx.triangles[0].y ]).toEqual([ 670, 270 ]);
        expect(chip(ctx)).toBe('Alvo: Miniboss · HP 100/100');
    });

    it('the auto click hits the target add at its centre x', async () => {
        const ctx = await addsScene({}, { autoClickOn: true });

        ctx.click(lacaio1);
        expect(healthOf(ctx, 1)).toBeCloseTo(29, 9);

        ctx.scene.update(0, 500);

        expect(healthOf(ctx, 1)).toBeCloseTo(28, 9);
        expect([ lastText(ctx).x, lastText(ctx).y ]).toEqual([ 480, 360 ]);
    });

    it('an auto click burst that kills the target add moves on to the miniboss', async () => {
        const ctx = await addsScene({ adds: [ { health: 2, defenseBuff: 30 }, ADD ] }, { autoClickOn: true });

        ctx.click(lacaio1);
        expect(healthOf(ctx, 1)).toBeCloseTo(1, 9);

        ctx.scene.update(0, 1000);

        expect(ctx.scene.fight.adds[0].monster.dead).toBe(true);
        expect(ctx.scene.monster.health).toBeCloseTo(99.79, 9);
        expect(ctx.scene.fight.target).toBe(ctx.scene.monster);
    });

    it('a click on an add counts one step of the combo', async () => {
        const ctx = await addsScene({}, { talents: [ COMBO_MAXED ] });

        ctx.click(lacaio1);
        expect(ctx.scene.combo.streak).toBe(1);
        expect(ctx.hud('.combo-hud').textContent).toBe('Combo x1 · +1%');

        ctx.click(onMiniboss);
        expect(ctx.hud('.combo-hud').textContent).toBe('Combo x2 · +2%');
    });

    it("Lyra's double critical click lands both hits on the clicked add", async () => {
        const ctx = await addsScene({}, { heroes: { leaderId: 'lyra', heroes: [ heroEntry('lyra', { 0: 1 }) ] } });

        ctx.dice.value = 0;
        ctx.click({ x: 500, y: 380 });

        expect(healthOf(ctx, 1)).toBeCloseTo(26, 9);
        expect(ctx.texts.slice(-2).map(({ text, x, y, style }) => [ text, x, y, style.color ])).toEqual([
            [ '2', 500, 360, '#ff8a1f' ],
            [ '2', 536, 360, '#ff8a1f' ]
        ]);
    });

    it('an ally meets the guarded miniboss: Lyra deals 0.2 at x 740', async () => {
        const ctx = await allyScene([ 'lyra', null, null, null ], { adds: GUARD_90 });

        ctx.scene.update(0, 1000);

        expect(ctx.scene.monster.health).toBeCloseTo(99.8, 9);
        expect([ lastText(ctx).text, lastText(ctx).x, lastText(ctx).y, lastText(ctx).style.color ]).toEqual([ '0.2', 740, 273, '#7fd4ff' ]);
    });

    it('an ally hits the target add for 2 with its number at (520, 360)', async () => {
        const ctx = await allyScene([ 'lyra', null, null, null ]);

        ctx.click(lacaio1);
        expect(healthOf(ctx, 1)).toBeCloseTo(29, 9);

        ctx.scene.update(0, 1000);

        expect(healthOf(ctx, 1)).toBeCloseTo(27, 9);
        expect([ lastText(ctx).text, lastText(ctx).x, lastText(ctx).y, lastText(ctx).style.color ]).toEqual([ '2', 520, 360, '#7fd4ff' ]);
    });

    it('an ally tick that kills the target add lands its later hits on the miniboss with one number each', async () => {
        //  Vex, not Orina: Orina's passive takes 15 points off the defense, which would change the 0.4 of the miniboss tick
        const ctx = await allyScene([ 'lyra', 'vex', null, null ], { adds: [ { health: 2, defenseBuff: 30 }, ADD ] });

        ctx.click(lacaio1);
        expect(healthOf(ctx, 1)).toBeCloseTo(1, 9);

        const before = ctx.texts.length;

        ctx.scene.update(0, 1000);

        expect(ctx.scene.fight.adds[0].monster.dead).toBe(true);
        expect(ctx.scene.monster.health).toBeCloseTo(99.58, 9);
        expect(ctx.texts.slice(before).map(({ text, x, y, style }) => [ text, x, y, style.color ])).toEqual([
            [ '2', 520, 360, '#7fd4ff' ],
            [ '0.4', 740, 273, '#7fd4ff' ]
        ]);
    });

    it('the ally clock does not restart when the target changes', async () => {
        const ctx = await allyScene([ 'lyra', null, null, null ]);

        ctx.scene.update(0, 600);
        ctx.click(lacaio1);
        expect(healthOf(ctx, 1)).toBeCloseTo(29, 9);

        ctx.scene.update(0, 400);

        expect(healthOf(ctx, 1)).toBeCloseTo(27, 9);
    });

    it('no target change and no hit while the pause menu is open', async () => {
        const ctx = await addsScene();

        ctx.scene.pauseFight();
        ctx.click(lacaio1);

        expect(healthOf(ctx, 1)).toBe(30);
        expect(ctx.scene.fight.target).toBe(ctx.scene.monster);
    });

    it('no target change and no hit while a hero screen is open', async () => {
        const ctx = await addsScene();

        await ctx.scene.heroUi.show('heroes');
        ctx.click(lacaio1);

        expect(healthOf(ctx, 1)).toBe(30);
        expect(ctx.scene.fight.target).toBe(ctx.scene.monster);
    });
});

describe('ClickerGame miniboss skills', () => {
    //  A 3-star leader has every skill unlocked at level 1 and a click base of 1.4 (+40 %); every heroEntry is FIRE like the monsters
    const leader3 = (id) => ({ leaderId: id, heroes: [ heroEntry(id, { 3: 1 }, 3) ] });
    //  50 + 20 + 20 = 90, under the 100 where a hit deals 0
    const BIG = { health: 100, defenseBuff: 20 };
    const GUARDED = { miniboss: { element: 'FIRE', defense: 50, critResistance: 0 }, adds: [ BIG, BIG ] };
    const skillScene = (id, options = GUARDED) => addsScene(options, { heroes: leader3(id) });
    const numbers = (ctx, from) => ctx.texts.slice(from).map(({ text, x, y }) => [ text, x, y ]);

    it('Chuva de Meteoros shows 35 on each add and 3.5 on the guarded miniboss', async () => {
        const ctx = await skillScene('orina');

        ctx.scene.useSkill(3);

        expect(numbers(ctx, -3)).toEqual([ [ '35', 480, 360 ], [ '35', 480, 540 ], [ '3.5', 670, 273 ] ]);
        expect(ctx.scene.monster.health).toBeCloseTo(96.5, 9);
    });

    it('Chuva kills both adds of 30 first and meets the miniboss at defense 50 for 17.5', async () => {
        const ctx = await skillScene('orina', { ...GUARDED, adds: [ ADD, ADD ] });
        const parts = partsOf(ctx);

        ctx.scene.useSkill(3);

        expect(numbers(ctx, -3)).toEqual([ [ '35', 480, 360 ], [ '35', 480, 540 ], [ '17.5', 670, 273 ] ]);
        expect(ctx.scene.monster.health).toBeCloseTo(82.5, 9);

        ctx.tweens.filter((tween) => Array.isArray(tween.targets) && tween.targets.some((target) => parts.includes(target))).forEach((tween) => tween.onComplete());

        parts.forEach((part) => expect(part.destroy).toHaveBeenCalledTimes(1));
    });

    it('a skill that kills both adds and the miniboss wins once', async () => {
        const ctx = await skillScene('orina', { ...GUARDED, adds: [ ADD, ADD ], minibossHealth: 10 });

        ctx.scene.useSkill(3);
        await flush();

        expect(ctx.scene.monster.dead).toBe(true);
        expect(campaignGateway.report).toHaveBeenCalledTimes(1);
        expect(campaignGateway.report.mock.calls[0][1]).toBe('CLEARED');
    });

    it('Flecha Dupla shows six numbers: 4.2 twice on each add and 0.4 twice on the miniboss', async () => {
        const ctx = await skillScene('lyra');

        ctx.scene.useSkill(1);

        expect(numbers(ctx, -6)).toEqual([
            [ '4.2', 480, 360 ], [ '4.2', 480, 360 ], [ '4.2', 480, 540 ], [ '4.2', 480, 540 ], [ '0.4', 670, 273 ], [ '0.4', 670, 273 ]
        ]);
        expect(ctx.dice.value).toBe(0.99);
    });

    it('Tempestade Arcana ticks show one number per monster each second', async () => {
        const ctx = await skillScene('orina');

        ctx.scene.useSkill(2);

        const before = ctx.texts.length;

        ctx.scene.update(0, 1000);

        expect(numbers(ctx, before)).toEqual([ [ '2.8', 480, 360 ], [ '2.8', 480, 540 ], [ '0.3', 670, 273 ] ]);
    });

    it('a tick that kills the last adds lowers the miniboss defense in the same frame', async () => {
        const dying = { health: 2, defenseBuff: 30 };
        const ctx = await skillScene('orina', { ...GUARDED, adds: [ dying, dying ] });

        ctx.scene.useSkill(2);

        const before = ctx.texts.length;

        ctx.scene.update(0, 1000);

        expect(numbers(ctx, before)).toEqual([ [ '2.8', 480, 360 ], [ '2.8', 480, 540 ], [ '1.4', 670, 273 ] ]);
        expect(ctx.scene.fight.adds.map((add) => add.monster.dead)).toEqual([ true, true ]);
        expect(enemyLine(ctx)).toBe('Fire  Defesa 50%  Seu crítico: 40%');
    });

    it('Bomba de Veneno ticks on every monster', async () => {
        const ctx = await skillScene('vex');

        ctx.scene.useSkill(1);

        const before = ctx.texts.length;

        ctx.scene.update(0, 1000);

        expect(numbers(ctx, before)).toEqual([ [ '1.4', 480, 360 ], [ '1.4', 480, 540 ], [ '0.1', 670, 273 ] ]);
    });

    it('Tiro Preciso lands a critical on every monster at the end of its cast', async () => {
        const far = { health: 200, defenseBuff: 20 };
        const ctx = await skillScene('lyra', { ...GUARDED, adds: [ far, far ] });

        ctx.scene.useSkill(2);

        const before = ctx.texts.length;

        ctx.scene.update(0, 2000);

        expect(numbers(ctx, before)).toEqual([ [ '105', 480, 360 ], [ '105', 480, 540 ], [ '10.5', 670, 273 ] ]);
        expect(ctx.texts.slice(before).map((text) => text.style.color)).toEqual([ '#ff8a1f', '#ff8a1f', '#ff8a1f' ]);
    });

    it('Brado Aterrador on every monster shows in the tags of the target add', async () => {
        const ctx = await skillScene('kael');

        ctx.scene.useSkill(3);
        ctx.click({ x: 480, y: 360 });
        ctx.scene.update(0, 16);

        expect(ctx.hud('.effect-tags').textContent).toContain('Brado Aterrador');

        ctx.click(onMiniboss);

        expect(ctx.scene.monster.health).toBeCloseTo(100 - 0.56, 9);
    });

    it('the effect tags read the effects of the target', async () => {
        const ctx = await skillScene('kael');
        const spy = vi.spyOn(ctx.scene.skills, 'effectsWithOwner');

        ctx.click({ x: 480, y: 360 });
        ctx.scene.update(0, 16);

        expect(spy.mock.calls.at(-1)[0]).toBe(ctx.scene.fight.adds[0].monster);
    });

    it('a skill in a fight without adds shows its one number at x 670 as before', async () => {
        const ctx = await createScene({ start: progress(1, 'MINIBOSS', 1), heroes: leader3('orina'), talents: [], autoClickOn: false });
        const before = ctx.texts.length;

        ctx.scene.useSkill(3);

        expect(numbers(ctx, before)).toHaveLength(1);
        expect(ctx.texts.at(-1).x).toBe(670);
        expect(ctx.texts.at(-1).y).toBe(273);
    });
});
