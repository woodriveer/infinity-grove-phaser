import { describe, expect, it, vi } from 'vitest';
import { Preloader } from './Preloader';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

//  Minimal Phaser stand-in: only what Preloader.init touches
const createScene = () => {
    const rectangles = [];
    const handlers = {};
    const scene = new Preloader();

    scene.add = {
        image: vi.fn(),
        rectangle: vi.fn((x, y, width, height, color) => {
            const rect = { x, y, width, height, color };

            rect.setStrokeStyle = vi.fn(() => rect);
            rectangles.push(rect);
            return rect;
        })
    };
    scene.load = { on: vi.fn((event, callback) => { handlers[event] = callback; }) };

    return { scene, rectangles, handlers };
};

describe('Preloader', () => {
    it('outlines the loading bar in gold, 2 px, at 512, 384, 468 x 32', () => {
        const { scene, rectangles } = createScene();

        scene.init();

        expect(rectangles[0]).toMatchObject({ x: 512, y: 384, width: 468, height: 32 });
        expect(rectangles[0].setStrokeStyle).toHaveBeenCalledWith(2, 0xe0b45a);
    });

    it('fills the loading bar in ember from the left', () => {
        const { scene, rectangles } = createScene();

        scene.init();

        expect(rectangles[1]).toMatchObject({ x: 282, y: 384, width: 4, height: 28, color: 0xe8742a });
    });

    it('grows the bar to 464 px at full progress', () => {
        const { scene, rectangles, handlers } = createScene();

        scene.init();
        handlers.progress(1);

        expect(rectangles[1].width).toBe(464);
    });
});
