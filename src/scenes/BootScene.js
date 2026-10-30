import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.generateCozyTextures();
    this.scene.start('VillageScene');
  }

  generateCozyTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Grass & Path Tiles
    g.fillStyle(0x7ec850, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x6ab83d, 1);
    g.fillRect(10, 14, 4, 8);
    g.fillRect(42, 38, 4, 8);
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(52, 16, 2.5);
    g.generateTexture('tile_grass', 64, 64);
    g.clear();

    g.fillStyle(0xe5c99b, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0xd4b483, 1);
    g.fillRoundedRect(8, 10, 18, 12, 4);
    g.fillRoundedRect(36, 36, 20, 14, 4);
    g.generateTexture('tile_path', 64, 64);
    g.clear();

    // 2. Characters
    const characters = [
      ['char_player', 0x3b82f6, 0xfde047],
      ['char_grandma', 0xa855f7, 0xe5e7eb],
      ['char_shopkeeper', 0x16a34a, 0x92400e],
      ['char_student', 0xec4899, 0x1f2937],
      ['char_gardener', 0x65a30d, 0xd97706],
      ['char_chef', 0xf97316, 0xffffff],
      ['char_nurse', 0x06b6d4, 0x7c2d12],
      ['char_elder_man', 0x64748b, 0xd1d5db],
      ['char_musician', 0x8b5cf6, 0x312e81],
      ['char_painter', 0xf43f5e, 0xfbbf24]
    ];
    characters.forEach(([key, shirt, hair]) => {
      this.drawCharacter(g, shirt, hair);
      g.generateTexture(key, 36, 44);
      g.clear();
    });

    // 3. Tree & Notice Board
    g.fillStyle(0x78350f, 1);
    g.fillRect(24, 52, 16, 24);
    g.fillStyle(0x2d6a4f, 1);
    g.fillCircle(32, 38, 24);
    g.fillStyle(0x40916c, 1);
    g.fillCircle(24, 28, 18);
    g.fillCircle(40, 30, 18);
    g.generateTexture('prop_tree', 64, 80);
    g.clear();

    g.fillStyle(0x78350f, 1);
    g.fillRect(8, 28, 6, 22);
    g.fillRect(34, 28, 6, 22);
    g.fillStyle(0x92400e, 1);
    g.fillRoundedRect(2, 4, 44, 28, 6);
    g.fillStyle(0xfef3c7, 1);
    g.fillRect(8, 10, 14, 16);
    g.fillRect(26, 10, 14, 12);
    g.generateTexture('prop_noticeboard', 48, 52);
    g.clear();

    // 4. All Level Collectible Icons
    this.drawCrateIcon(g, 0xd97706, 0xef4444, 'item_groceries');
    this.drawCrateIcon(g, 0x2563eb, 0xfef08a, 'item_books');
    this.drawCrateIcon(g, 0x16a34a, 0xfde047, 'item_seeds');
    this.drawCrateIcon(g, 0x0284c7, 0xbae6fd, 'item_watering_can');
    this.drawCrateIcon(g, 0x65a30d, 0xf97316, 'item_produce');
    this.drawCrateIcon(g, 0xb45309, 0xfde68a, 'item_loaves');
    this.drawCrateIcon(g, 0xdc2626, 0xffffff, 'item_medicine');

    // Level 2 & 3 Item Icons
    this.drawCrateIcon(g, 0xa16207, 0xfacc15, 'item_broom');
    this.drawCrateIcon(g, 0x0284c7, 0x4ade80, 'item_recyclables');
    this.drawCrateIcon(g, 0x15803d, 0xfef08a, 'item_tea');
    this.drawCrateIcon(g, 0xb45309, 0xfef9c3, 'item_watch');
    this.drawCrateIcon(g, 0xdb2777, 0xfde68a, 'item_welcome_card');

    // 5. Level 2 Trash / Leaf Pile (38x28)
    g.fillStyle(0x92400e, 0.85);
    g.fillEllipse(19, 16, 30, 16);
    g.fillStyle(0xd97706, 1);
    g.fillCircle(14, 13, 6);
    g.fillStyle(0x94a3b8, 1);
    g.fillRoundedRect(20, 10, 9, 8, 2);
    g.generateTexture('prop_trash_pile', 38, 28);
    g.clear();

    // 6. Level 2 Leaking Water Tap (32x36)
    g.fillStyle(0x475569, 1);
    g.fillRect(12, 8, 8, 24);
    g.fillStyle(0x38bdf8, 1);
    g.fillCircle(16, 28, 9);
    g.generateTexture('prop_tap_leaking', 32, 36);
    g.clear();

    g.fillStyle(0x475569, 1);
    g.fillRect(12, 8, 8, 24);
    g.fillStyle(0x22c55e, 1);
    g.fillCircle(16, 10, 5);
    g.generateTexture('prop_tap_fixed', 32, 36);
    g.clear();

    // 7. Garden Soil Beds & Flower Box
    g.fillStyle(0x5c3a21, 1);
    g.fillRoundedRect(0, 0, 52, 36, 8);
    g.generateTexture('plot_dry', 52, 36);
    g.clear();

    g.fillStyle(0x3f2716, 1);
    g.fillRoundedRect(0, 0, 52, 36, 8);
    g.fillStyle(0x22c55e, 1);
    g.fillCircle(14, 18, 8);
    g.fillCircle(26, 18, 8);
    g.fillCircle(38, 18, 8);
    g.fillStyle(0xfacc15, 1);
    g.fillCircle(14, 14, 4);
    g.fillCircle(26, 14, 4);
    g.fillCircle(38, 14, 4);
    g.generateTexture('plot_blooming', 52, 36);
    g.clear();

    g.fillStyle(0x92400e, 1);
    g.fillRoundedRect(2, 12, 44, 14, 4);
    g.fillStyle(0x4ade80, 1);
    g.fillCircle(12, 10, 7);
    g.fillCircle(24, 10, 7);
    g.fillCircle(36, 10, 7);
    g.fillStyle(0xf43f5e, 1);
    g.fillCircle(12, 8, 5);
    g.fillStyle(0xfacc15, 1);
    g.fillCircle(24, 8, 5);
    g.fillStyle(0xc084fc, 1);
    g.fillCircle(36, 8, 5);
    g.generateTexture('prop_flowerbox', 48, 28);
    g.clear();

    // Dynamic Village Life Textures (Butterflies & Leaves)
    const bfColors = [
      { key: 'particle_butterfly_gold', color: 0xfacc15, accent: 0xfef08a },
      { key: 'particle_butterfly_blue', color: 0x38bdf8, accent: 0xbae6fd },
      { key: 'particle_butterfly_pink', color: 0xf472b6, accent: 0xfbcfe8 }
    ];

    bfColors.forEach(({ key, color, accent }) => {
      const butterfly = this.make.graphics({ x: 0, y: 0, add: false });
      butterfly.fillStyle(color, 1);
      butterfly.fillCircle(5, 6, 4.5);
      butterfly.fillCircle(13, 6, 4.5);
      butterfly.fillCircle(6, 11, 3.5);
      butterfly.fillCircle(12, 11, 3.5);
      butterfly.fillStyle(accent, 1);
      butterfly.fillCircle(5, 5, 2);
      butterfly.fillCircle(13, 5, 2);
      butterfly.fillStyle(0x3b2d1f, 1);
      butterfly.fillRoundedRect(8, 3, 2, 11, 1);
      butterfly.generateTexture(key, 18, 16);
      butterfly.destroy();
    });

    const leaf = this.make.graphics({ x: 0, y: 0, add: false });
    leaf.fillStyle(0xa3e635, 0.9);
    leaf.fillEllipse(6, 5, 10, 6);
    leaf.lineStyle(1, 0x3f6212, 0.8);
    leaf.lineBetween(2, 5, 10, 5);
    leaf.generateTexture('particle_leaf', 12, 10);
    leaf.destroy();
  }

  drawCharacter(g, shirtColor, hairColor) {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(18, 40, 26, 8);
    g.fillStyle(shirtColor, 1);
    g.fillRoundedRect(7, 18, 22, 18, 6);
    g.fillStyle(0xffedd5, 1);
    g.fillCircle(18, 13, 10);
    g.fillStyle(hairColor, 1);
    g.fillRoundedRect(8, 2, 20, 8, 4);
    g.fillStyle(0x1f2937, 1);
    g.fillCircle(14, 13, 2);
    g.fillCircle(22, 13, 2);
  }

  drawCrateIcon(g, baseColor, accentColor, key) {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(17, 30, 26, 6);
    g.fillStyle(baseColor, 1);
    g.fillRoundedRect(4, 8, 26, 20, 5);
    g.fillStyle(accentColor, 1);
    g.fillCircle(17, 16, 6);
    g.generateTexture(key, 34, 34);
    g.clear();
  }
}