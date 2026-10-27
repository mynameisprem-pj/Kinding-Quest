import Phaser from 'phaser';
import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'char_player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 215;
    this.body.setSize(24, 18);
    this.body.setOffset(6, 24);
    this.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.touchDir = { up: false, down: false, left: false, right: false };
    this.movementLocked = false;
    this.stepTimer = 0;
  }

  setTouchDirection(dir, isPressed) {
    if (dir in this.touchDir) {
      this.touchDir[dir] = isPressed;
    }
  }

  update(time = 0, delta = 16) {
    if (this.movementLocked) {
      this.setVelocity(0, 0);
      this.setAngle(0);
      return;
    }

    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.wasd.left.isDown || this.touchDir.left;
    const right = this.cursors.right.isDown || this.wasd.right.isDown || this.touchDir.right;
    const up = this.cursors.up.isDown || this.wasd.up.isDown || this.touchDir.up;
    const down = this.cursors.down.isDown || this.wasd.down.isDown || this.touchDir.down;

    if (left) {
      vx = -1;
      this.setFlipX(true);
    } else if (right) {
      vx = 1;
      this.setFlipX(false);
    }

    if (up) vy = -1;
    else if (down) vy = 1;

    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    this.setVelocity(vx * this.speed, vy * this.speed);
    this.setDepth(this.y);

    const isMoving = vx !== 0 || vy !== 0;

    if (isMoving) {
      if (!gameState.settings.reducedMotion) {
        this.setAngle(Math.sin(time * 0.018) * 5.5);
      } else {
        this.setAngle(0);
      }

      this.stepTimer += delta;
      if (this.stepTimer >= 290) {
        this.stepTimer = 0;
        eventBus.emit('sfx:step');
        if (!gameState.settings.reducedMotion) {
          this.spawnFootstepDust();
        }
      }
    } else {
      this.setAngle(0);
      this.stepTimer = 260;
    }
  }

  spawnFootstepDust() {
    const dust = this.scene.add.circle(this.x, this.y + 18, 4, 0xd6c7b2, 0.7).setDepth(this.y - 1);
    this.scene.tweens.add({
      targets: dust,
      scale: 1.8,
      alpha: 0,
      y: this.y + 12,
      duration: 320,
      onComplete: () => dust.destroy()
    });
  }
}