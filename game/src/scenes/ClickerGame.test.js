import { describe, expect, it, vi } from 'vitest';
import { ClickerGame } from './ClickerGame';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

//  Minimal Phaser stand-in: records what ClickerGame adds and exposes the click handler and tweens.
const createScene = () => {
    const rectangles = [];
    const texts = [];
    const tweens = [];
    const handlers = {};
    const timers = [];

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
        })
    };
    scene.tweens = { add: vi.fn((config) => { tweens.push(config); }) };
    scene.time = { delayedCall: vi.fn((delay, callback) => { timers.push({ delay, callback }); }) };
    scene.input = { on: vi.fn((event, cb) => { handlers[event] = cb; }) };

    scene.create();

    const click = () => handlers.pointerdown();
    const byColor = (color) => rectangles.filter((r) => r.color === color);
    const monster = byColor(0xcc2222)[0];
    const fill = byColor(0x33cc33)[0];
    const back = byColor(0x222222)[0];

    return { scene, rectangles, texts, tweens, timers, click, monster, fill, back, byColor };
};

describe('ClickerGame scene', () => {
    it('shows one black square character and one monster, and no coins or score', () => {
        const { scene, rectangles, byColor } = createScene();

        expect(byColor(0x000000)).toHaveLength(1);
        expect(byColor(0xcc2222)).toHaveLength(1);
        expect(rectangles).toHaveLength(4); //  character, monster, health bar back, health bar fill
        expect(scene.add.text).not.toHaveBeenCalled();
        expect(scene.physics).toBeUndefined();
    });

    it('lowers the monster health by 1 when the canvas is clicked', () => {
        const { scene, click } = createScene();

        click();

        expect(scene.monster.health).toBe(9);
    });

    it('shows "1" above the monster, rising 40 px and fading out over 800 ms', () => {
        const { texts, tweens, click, monster } = createScene();

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

    it('removes a damage number when it finishes fading', () => {
        const { texts, tweens, click } = createScene();
        click();
        expect(texts[0].destroy).not.toHaveBeenCalled();

        tweens[0].onComplete();

        expect(texts[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('shows one independent damage number per click', () => {
        const { texts, tweens, click } = createScene();

        click();
        click();

        expect(texts).toHaveLength(2);
        expect(tweens).toHaveLength(2);
        expect(tweens[0].targets).not.toBe(tweens[1].targets);
    });
});

describe('ClickerGame health bar', () => {
    it('is centred above the monster and 120 px wide at full health', () => {
        const { monster, fill, back } = createScene();

        expect(back.x + back.width / 2).toBe(monster.x);
        expect(fill.x).toBe(back.x);
        expect(fill.y).toBe(back.y);
        expect(fill.width).toBe(120);
        expect(back.width).toBe(120);
        expect(back.y + back.height).toBe(monster.y - monster.height / 2 - 16);
    });

    it('shrinks the fill to 108 px after one click', () => {
        const { fill, click } = createScene();

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

    it('fades the monster body and its health bar to alpha 0 over 500 ms on the tenth click', () => {
        const ctx = createScene();
        for (let i = 0; i < 9; i++)
        {
            ctx.click();
        }
        expect(fadeTween(ctx)).toBeUndefined();

        ctx.click();

        expect(fadeTween(ctx)).toEqual(expect.objectContaining({ alpha: 0, duration: 500 }));
        expect(fadeTween(ctx).targets).toEqual([ ctx.monster, ctx.back, ctx.fill ]);
    });

    it('sets the health bar fill to 0 px wide on death', () => {
        const ctx = createScene();

        kill(ctx);

        expect(ctx.fill.width).toBe(0);
    });

    it('shows the damage number of the killing click', () => {
        const ctx = createScene();

        kill(ctx);

        expect(ctx.texts).toHaveLength(10);
        expect(ctx.texts[9].text).toBe('1');
    });

    it('ignores clicks while the monster is dead: no damage, no damage number', () => {
        const ctx = createScene();
        kill(ctx);
        const tweenCount = ctx.tweens.length;

        ctx.click();
        ctx.click();

        expect(ctx.scene.monster.health).toBe(0);
        expect(ctx.texts).toHaveLength(10);
        expect(ctx.tweens).toHaveLength(tweenCount);
    });

    it('waits 1000 ms after the fade ends, and not before, to spawn the next monster', () => {
        const ctx = createScene();
        kill(ctx);
        expect(ctx.timers).toHaveLength(0);

        fadeTween(ctx).onComplete();

        expect(ctx.timers).toHaveLength(1);
        expect(ctx.timers[0].delay).toBe(1000);
        expect(ctx.scene.monster.health).toBe(0);
    });

    it('spawns a monster with health 10, alpha 1 and a 120 px bar when the wait ends', () => {
        const ctx = createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        [ ctx.monster, ctx.back, ctx.fill ].forEach((part) => { part.alpha = 0; });

        ctx.timers[0].callback();

        expect(ctx.scene.monster.health).toBe(10);
        expect([ ctx.monster.alpha, ctx.back.alpha, ctx.fill.alpha ]).toEqual([ 1, 1, 1 ]);
        expect(ctx.fill.width).toBe(120);
    });

    it('takes 1 damage per click again after the respawn', () => {
        const ctx = createScene();
        kill(ctx);
        fadeTween(ctx).onComplete();
        ctx.timers[0].callback();

        ctx.click();

        expect(ctx.scene.monster.health).toBe(9);
        expect(ctx.fill.width).toBe(108);
        expect(ctx.texts).toHaveLength(11);
    });
});
