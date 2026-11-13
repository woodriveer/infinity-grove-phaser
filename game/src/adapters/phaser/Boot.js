import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    create ()
    {
        //  A global value to store the highscore in
        this.registry.set('highscore', 0);

        // this.scene.start('Preloader');

        this.input.once('pointerdown', () => {

            this.scene.start('Preloader');

        });
    }
}
