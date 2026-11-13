import { Scene } from 'phaser';
import { HERO_IDS } from '../../domain/heroes/heroes';

//  One coin sheet per metal, all laid out by coin.json
export const COIN_METALS = [ 'gold', 'silver', 'copper' ];

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  The track of the bar: dark wood inside a thin gold rim, on the dark game background (spec ui-redesign)
        this.add.rectangle(512, 384, 468, 32, 0x2b1d14).setStrokeStyle(2, 0xe0b45a);

        //  The bar itself, in ember; it grows from the left with the progress
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xe8742a);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with the path to your own assets
        this.load.setPath('assets');

        this.load.image('background', 'background.png');
        this.load.image('logo', 'cc-logo.png');
        COIN_METALS.forEach((metal) => this.load.atlas(`coin_${metal}`, `coin-${metal}.png`, 'coin.json'));
        HERO_IDS.forEach((id) => this.load.image(`hero_${id}`, `heroes/${id}_sprite.png`));
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, we will define our 'coin' animation here, so we can use it in other scenes:

        COIN_METALS.forEach((metal) =>
        {
            this.anims.create({
                key: `rotate_${metal}`,
                frames: this.anims.generateFrameNames(`coin_${metal}`, { prefix: 'coin_', start: 1, end: 7, zeroPad: 2 }),
                frameRate: 16,
                repeat: -1
            });

            this.anims.create({
                key: `vanish_${metal}`,
                frames: this.anims.generateFrameNames(`coin_${metal}`, { prefix: 'vanish_', start: 1, end: 4 }),
                frameRate: 10
            });
        });

        //  When all the assets are loaded go to the next scene.
        //  We can go there immediately via: this.scene.start('MainMenu');
        //  Or we could use a Scene transition to fade between the two scenes:

        this.scene.transition({
            target: 'MainMenu',
            duration: 1000,
            moveBelow: true,
            onUpdate: (progress) => {
                this.cameras.main.setAlpha(1 - progress);
            }
        });

        //  When the transition completes, it will move automatically to the MainMenu scene
    }
}
