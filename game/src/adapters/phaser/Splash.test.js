import { afterEach, describe, expect, it, vi } from 'vitest';
import { Boot } from './Boot';
import { Preloader } from './Preloader';
import { Splash } from './Splash';
import { splashPlan } from './splashPlan';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

//  A game object that answers every chained call Splash makes and remembers alpha and scale
const gameObject = (extra = {}) => {
    const object = { alpha: 1, scale: 1, width: 800, visible: true, ...extra };
    const chain = () => object;

    [ 'fillStyle', 'fillCircle', 'fillEllipse', 'fillPoints', 'lineStyle', 'lineBetween', 'setBlendMode', 'setOrigin', 'generateTexture', 'destroy' ].forEach((name) => { object[name] = vi.fn(chain); });
    object.setVisible = vi.fn((visible) => { object.visible = visible; return object; });
    object.clear = vi.fn(chain);
    object.setAlpha = vi.fn((alpha) => { object.alpha = alpha; return object; });
    object.setScale = vi.fn((scale) => { object.scale = scale; return object; });
    return object;
};

//  Minimal Phaser stand-in: only what Splash.create touches; timers and input handlers are kept to fire by hand
const createSplash = ({ reducedMotion = false } = {}) => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: reducedMotion }) });

    const scene = new Splash();
    const timers = [];
    const pointer = {};
    const keys = {};

    const baked = [];

    scene.add = { graphics: vi.fn(() => gameObject()), image: vi.fn(() => gameObject()) };
    scene.make = { graphics: vi.fn(() => { const graphics = gameObject(); baked.push(graphics); return graphics; }) };
    scene.textures = { exists: vi.fn(() => false) };
    scene.tweens = { add: vi.fn(), addCounter: vi.fn() };
    scene.time = { delayedCall: vi.fn((delay, callback) => timers.push({ delay, callback })) };
    scene.input = {
        once: vi.fn((event, callback) => { pointer[event] = callback; }),
        keyboard: { once: vi.fn((event, callback) => { keys[event] = callback; }) }
    };
    scene.scene = { start: vi.fn(), transition: vi.fn() };
    scene.cameras = { main: { setAlpha: vi.fn() } };

    scene.create();

    return { scene, timers, pointer, keys, baked };
};

afterEach(() => vi.unstubAllGlobals());

describe('Boot', () => {
    it('starts the Preloader at once, with no click to wait for', () => {
        const scene = new Boot();

        scene.registry = { set: vi.fn() };
        scene.scene = { start: vi.fn() };
        scene.input = { once: vi.fn() };

        scene.create();

        expect(scene.scene.start).toHaveBeenCalledWith('Preloader');
        expect(scene.input.once).not.toHaveBeenCalled();
    });
});

describe('Preloader', () => {
    it('hands over to the Splash once the assets are loaded', () => {
        const scene = new Preloader();

        scene.anims = { create: vi.fn(), generateFrameNames: vi.fn(() => []) };
        scene.scene = { start: vi.fn(), transition: vi.fn() };

        scene.create();

        expect(scene.scene.start).toHaveBeenCalledWith('Splash');
        expect(scene.scene.transition).not.toHaveBeenCalled();
    });
});

describe('Splash', () => {
    it('moves on to the MainMenu by itself when the splash ends, fading out', () => {
        const { scene, timers } = createSplash();
        const plan = splashPlan();

        expect(timers).toHaveLength(1);
        expect(timers[0].delay).toBe(plan.endAt);
        expect(scene.scene.transition).not.toHaveBeenCalled();

        timers[0].callback();

        expect(scene.scene.transition).toHaveBeenCalledWith(expect.objectContaining({ target: 'MainMenu', duration: plan.fadeMs, moveBelow: true }));
    });

    it('fades its own camera out while the MainMenu comes in', () => {
        const { scene, timers } = createSplash();

        timers[0].callback();
        scene.scene.transition.mock.calls[0][0].onUpdate(0.25);

        expect(scene.cameras.main.setAlpha).toHaveBeenCalledWith(0.75);
    });

    it('skips straight to the MainMenu on a click or tap, with no fade', () => {
        const { scene, pointer } = createSplash();

        pointer.pointerdown();

        expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
        expect(scene.scene.transition).not.toHaveBeenCalled();
    });

    it('skips to the MainMenu on a key', () => {
        const { scene, keys } = createSplash();

        keys.keydown();

        expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
    });

    it('leaves only once when a click comes before the end of the splash', () => {
        const { scene, timers, pointer } = createSplash();

        scene.update(0, 300);
        scene.update(0, 200);
        pointer.pointerdown();
        scene.update(0, 2800);
        timers[0].callback();

        //  It records the splash time it left at: the click, not when the splash ran out
        expect(scene.endedAt).toBe(500);
        expect(scene.scene.start).toHaveBeenCalledTimes(1);

        expect(scene.scene.transition).not.toHaveBeenCalled();
    });

    it('grows the tree, lights the crystals and fades in the logo', () => {
        const { scene } = createSplash();
        const plan = splashPlan();
        const growth = scene.tweens.addCounter.mock.calls[0][0];
        const tweens = scene.tweens.add.mock.calls.map(([ config ]) => config);

        expect(growth).toMatchObject({ from: 0, to: 1, duration: plan.treeMs });
        //  Every crystal pops in, then breathes light for as long as the splash lasts
        expect(tweens.filter((tween) => tween.repeat === -1 && tween.yoyo)).toHaveLength(scene.crystals.length);
        expect(tweens).toContainEqual(expect.objectContaining({ targets: scene.logo, alpha: 1, delay: plan.logoAt }));
        expect(scene.logo.alpha).toBe(0);
    });

    it('redraws the tree as it grows', () => {
        const { scene } = createSplash();
        const { onUpdate } = scene.tweens.addCounter.mock.calls[0][0];
        const lines = () => scene.growingTree.lineBetween.mock.calls.length;

        scene.growingTree.lineBetween.mockClear();
        onUpdate({ getValue: () => 0.1 });
        const early = lines();

        scene.growingTree.lineBetween.mockClear();
        onUpdate({ getValue: () => 1 });

        expect(scene.growingTree.clear).toHaveBeenCalled();
        expect(early).toBeGreaterThan(0);
        expect(lines()).toBeGreaterThan(early);
    });

    it('swaps the growing tree for the baked full tree once it is grown', () => {
        const { scene } = createSplash();
        const { onComplete } = scene.tweens.addCounter.mock.calls[0][0];

        expect(scene.tree.visible).toBe(false);

        onComplete();

        expect(scene.tree.visible).toBe(true);
        expect(scene.growingTree.visible).toBe(false);
    });

    it('bakes every still picture into a texture once, and reuses it on the next splash', () => {
        const { scene, baked } = createSplash();
        const keys = baked.map((graphics) => graphics.generateTexture.mock.calls[0][0]);

        expect(keys).toEqual(expect.arrayContaining([ 'splash-glow', 'splash-ground', 'splash-halo', 'splash-tree' ]));
        expect(keys.filter((key) => key.startsWith('splash-gem-')).length).toBeGreaterThan(0);
        baked.forEach((graphics) => expect(graphics.destroy).toHaveBeenCalled());

        scene.textures.exists.mockReturnValue(true);
        scene.make.graphics.mockClear();
        scene.create();

        expect(scene.make.graphics).not.toHaveBeenCalled();
    });

    it('shows the logo at the centre of the canvas', () => {
        const { scene } = createSplash();

        expect(scene.add.image).toHaveBeenCalledWith(512, 384, 'logo');
    });

    describe('with reduced motion', () => {
        it('shows the finished picture with no tweens', () => {
            const { scene } = createSplash({ reducedMotion: true });

            expect(scene.tweens.add).not.toHaveBeenCalled();
            expect(scene.tweens.addCounter).not.toHaveBeenCalled();
            expect(scene.logo.alpha).toBe(1);
            //  The whole grown tree shows at once, dimmed behind the logo
            expect(scene.tree.visible).toBe(true);
            expect(scene.tree.alpha).toBeLessThan(1);
        });

        it('moves on in under a second, straight to the MainMenu', () => {
            const { scene, timers } = createSplash({ reducedMotion: true });

            expect(timers[0].delay).toBeLessThan(1000);

            timers[0].callback();

            expect(scene.scene.start).toHaveBeenCalledWith('MainMenu');
            expect(scene.scene.transition).not.toHaveBeenCalled();
        });
    });
});
