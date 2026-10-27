import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { VillageScene } from './scenes/VillageScene.js';
import { UIManager } from './ui/UIManager.js';
import { gameState } from './core/GameState.js';
import './core/AudioManager.js';

new UIManager();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, VillageScene]
};

new Phaser.Game(config);
gameState.emitStateChange();