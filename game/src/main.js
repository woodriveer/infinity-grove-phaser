import { Boot } from './adapters/phaser/Boot';
import { ClickerGame } from './adapters/phaser/ClickerGame';
import { Game } from 'phaser';
import { MainMenu } from './adapters/phaser/MainMenu';
import { Preloader } from './adapters/phaser/Preloader';
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
    backgroundColor: '#028af8',
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
        MainMenu,
        ClickerGame
    ]
};

const game = new Game(config);

//  Test hook: lets Playwright read canvas-rendered state. Stripped from production builds.
if (import.meta.env.DEV)
{
    window.__PHASER_GAME__ = game;
}

export default game;
