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

        //  The game starts loading at once: no click before the splash (the game has no audio to unlock)
        this.scene.start('Preloader');
    }
}
