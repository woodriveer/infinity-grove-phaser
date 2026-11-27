import { Boot } from './adapters/phaser/Boot';
import { ClickerGame } from './adapters/phaser/ClickerGame';
import { Game } from 'phaser';
import { MainMenu } from './adapters/phaser/MainMenu';
import { Preloader } from './adapters/phaser/Preloader';
import { Splash } from './adapters/phaser/Splash';
import { runInBackground, startTicker } from './adapters/phaser/backgroundFight';
import { installPageGuards } from './adapters/phaser/pageGuards';
import { mountVersionLabel } from './adapters/phaser/views/versionLabel';
import { services } from './composition';
import * as Phaser from 'phaser';

//  Find out more information about the Game Config at: https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    dom: {
        createContainer: true
    },
    backgroundColor: '#1c120c',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 400 }
        }
    },
    callbacks: {
        //  Scenes get their services from the registry; they import no adapter or composition code (ADR 0007)
        preBoot: (game) => game.registry.set('services', services)
    },
    scene: [
        Boot,
        Preloader,
        Splash,
        MainMenu,
        ClickerGame
    ]
};

//  The version in the bottom-right corner of every screen (spec game-version), in the page before the first frame of the loading bar.
//  __GAME_VERSION__ is replaced by vite.config.js define with the version of game/package.json.
mountVersionLabel(__GAME_VERSION__);
//  No selection, drag ghost or browser menu outside the text fields (spec ui-polish)
installPageGuards(document);

const game = new Game(config);

//  The fight goes on in a hidden tab (spec background-fight); the scenes step without drawing
runInBackground({
    document,
    startTicker,
    now: () => performance.now(),
    loopFrame: () => game.loop.frame,
    step: (time, delta) => game.scene.update(time, delta)
});

//  Test hook: lets Playwright read canvas-rendered state. Stripped from production builds.
if (import.meta.env.DEV)
{
    window.__PHASER_GAME__ = game;
}

export default game;
