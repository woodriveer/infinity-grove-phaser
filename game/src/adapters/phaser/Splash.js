import { Scene } from 'phaser';
import {
    GROUND_Y, TREE_BRANCHES, TREE_LEAVES, TREE_X,
    branchTip, crystalLayout, crystalPoints, leafScale, prefersReducedMotion, splashPlan
} from './splashPlan';

const BARK = 0x5a3d26;
const GROUND = 0x2b1d14;
const BACKDROP = 0x1c120c;
//  The logo file has wide clear margins: 900 px of file shows about 470 px of logo
const LOGO_WIDTH = 900;
const TREE_DIMMED = 0.4;

//  Plays on its own after the loading bar and hands over to the start screen; a click, a tap or a key skips it
export class Splash extends Scene
{
    constructor ()
    {
        super('Splash');
    }

    create ()
    {
        this.done = false;
        //  Splash time played so far (the frame deltas its tweens and timer run on), and the time it left at,
        //  so a test can tell a skip from the splash running out
        this.elapsed = 0;
        this.endedAt = null;
        this.plan = splashPlan({ reducedMotion: prefersReducedMotion() });

        const { reducedMotion } = this.plan;

        //  Everything that does not change shape is drawn once into a texture: a Graphics object is
        //  re-triangulated on every frame, which slows phones (and headless test browsers) to a crawl
        this.bake('splash-glow', 600, 600, (g) => [ 300, 220, 150 ].forEach((radius, index) => g.fillStyle(0x2f6b3a, 0.08 + index * 0.04).fillCircle(300, 300, radius)));
        this.bake('splash-ground', 980, 150, (g) => g.fillStyle(GROUND, 1).fillEllipse(490, 75, 980, 150));
        this.bake('splash-halo', 760, 760, (g) => Array.from({ length: 10 }, (_, ring) => 380 - ring * 22).forEach((radius) => g.fillStyle(BACKDROP, 0.1).fillCircle(380, 380, radius)));
        this.bake('splash-tree', 1024, 768, (g) => this.drawTree(g, 1));

        //  A faint green light rises behind the tree
        this.add.image(TREE_X, 380, 'splash-glow');
        this.add.image(TREE_X, GROUND_Y + 48, 'splash-ground');

        //  While it grows the tree is redrawn each frame; once grown it is the baked picture
        this.growingTree = this.add.graphics();
        this.tree = this.add.image(0, 0, 'splash-tree').setOrigin(0, 0);

        this.crystals = crystalLayout().map((crystal) => this.addCrystal(crystal));

        //  The logo sits on a dark halo so it reads over the crown
        this.halo = this.add.image(TREE_X, 384, 'splash-halo');
        this.logo = this.add.image(TREE_X, 384, 'logo');
        this.logo.setScale(LOGO_WIDTH / this.logo.width);

        if (reducedMotion)
        {
            this.tree.setAlpha(TREE_DIMMED);
        }
        else
        {
            this.play();
        }

        this.input.once('pointerdown', () => this.finish({ skipped: true }));
        this.input.keyboard?.once('keydown', () => this.finish({ skipped: true }));
        this.time.delayedCall(this.plan.endAt, () => this.finish());
    }

    update (time, delta)
    {
        this.elapsed += delta;
    }

    play ()
    {
        const { treeMs, crystalsAt, crystalStaggerMs, crystalMs, logoAt, logoMs } = this.plan;

        this.tree.setVisible(false);
        this.drawTree(this.growingTree, 0);

        this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: treeMs,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => this.drawTree(this.growingTree, tween.getValue()),
            onComplete: () => {
                this.growingTree.setVisible(false);
                this.tree.setVisible(true);
            }
        });

        this.crystals.forEach(({ gem, light }, index) => {
            gem.setAlpha(0).setScale(0.2);
            light.setAlpha(0);

            this.tweens.add({ targets: gem, alpha: 1, scale: 1, duration: crystalMs, ease: 'Back.easeOut', delay: crystalsAt + index * crystalStaggerMs });

            //  Then each crystal breathes light, out of step with its neighbours
            this.tweens.add({ targets: light, alpha: { from: 0.35, to: 1 }, scale: { from: 0.85, to: 1.15 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: crystalsAt + index * crystalStaggerMs });
        });

        this.halo.setAlpha(0);
        this.logo.setAlpha(0).setScale(this.logo.scale * 0.92);

        this.tweens.add({ targets: this.halo, alpha: 1, duration: logoMs, delay: logoAt });
        this.tweens.add({ targets: this.tree, alpha: TREE_DIMMED, duration: logoMs, delay: logoAt });
        this.tweens.add({ targets: this.logo, alpha: 1, scale: LOGO_WIDTH / this.logo.width, duration: logoMs, ease: 'Sine.easeOut', delay: logoAt });
    }

    //  Draws a picture into a texture once per game; later splashes reuse it
    bake (key, width, height, draw)
    {
        if (this.textures.exists(key)) return;

        const graphics = this.make.graphics({ add: false });

        draw(graphics);
        graphics.generateTexture(key, width, height);
        graphics.destroy();
    }

    //  Draws the tree as it stands at a growth from 0 (bare ground) to 1 (full crown)
    drawTree (graphics, growth)
    {
        const tree = graphics.clear();

        TREE_BRANCHES.forEach((branch) => {
            const tip = branchTip(branch, growth);

            if (!tip) return;

            tree.lineStyle(branch.width, BARK, 1).lineBetween(branch.x1, branch.y1, tip.x, tip.y);
            tree.fillStyle(BARK, 1).fillCircle(tip.x, tip.y, branch.width / 2);
        });

        TREE_LEAVES.forEach((leaf) => {
            const scale = leafScale(leaf, growth);

            if (scale === 0) return;

            tree.fillStyle(leaf.color, 0.95).fillCircle(leaf.x, leaf.y, leaf.r * scale);
            tree.fillStyle(0x8fd17a, 0.25).fillCircle(leaf.x - leaf.r * 0.25 * scale, leaf.y - leaf.r * 0.3 * scale, leaf.r * 0.45 * scale);
        });
    }

    addCrystal ({ x, y, size, color })
    {
        //  A soft light: rings of faint colour, brighter towards the gem
        const lightKey = `splash-light-${color}-${size}`;
        const reach = Math.ceil(size * 2.4);

        this.bake(lightKey, reach * 2, reach * 2, (g) => Array.from({ length: 10 }, (_, ring) => 2.4 - ring * 0.17).forEach((ring) => g.fillStyle(color, 0.045).fillCircle(reach, reach, size * ring)));

        //  The gem: a long diamond with a bright core; its texture is centred on the middle of the diamond
        const gemKey = `splash-gem-${color}-${size}`;
        const at = (points) => points.map((point) => ({ x: point.x + size, y: point.y + size }));

        this.bake(gemKey, size * 2, size * 2, (g) => {
            g.fillStyle(color, 0.9).fillPoints(at(crystalPoints(size)), true);
            g.fillStyle(0xffffff, 0.55).fillPoints(at(crystalPoints(size * 0.4)), true);
        });

        const light = this.add.image(x, y, lightKey).setBlendMode('ADD').setAlpha(0.7);
        const gem = this.add.image(x, y, gemKey);

        return { gem, light };
    }

    //  Leaves for the start screen once: fading out at the end of the splash, or at once on the first click, tap or key
    finish ({ skipped = false } = {})
    {
        if (this.done) return;

        this.done = true;
        this.endedAt = this.elapsed;

        if (skipped || this.plan.fadeMs === 0)
        {
            this.scene.start('MainMenu');
            return;
        }

        this.scene.transition({
            target: 'MainMenu',
            duration: this.plan.fadeMs,
            moveBelow: true,
            onUpdate: (progress) => this.cameras.main.setAlpha(1 - progress)
        });
    }
}
