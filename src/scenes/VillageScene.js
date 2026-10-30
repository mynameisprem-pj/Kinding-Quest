import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { gameState } from '../core/GameState.js';
import { eventBus } from '../core/EventBus.js';
import { QUESTS_DATA, LEVELS_META } from '../data/questsData.js';

export class VillageScene extends Phaser.Scene {
  constructor() {
    super('VillageScene');
    this.interactables = [];
    this.activeTarget = null;
    this.npcs = {};
    this.npcSprites = {};
  }

  create() {
    const worldWidth = 1600;
    const worldHeight = 1200;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    this.add.tileSprite(0, 0, worldWidth, worldHeight, 'tile_grass').setOrigin(0, 0);
    this.drawVillagePathsAndRiver();

    this.obstacles = this.physics.add.staticGroup();

    this.createBuilding(350, 260, 175, 110, 0xd97706, "Grandma Evelyn's Cottage");
    this.createBuilding(780, 220, 220, 120, 0x7c3aed, 'Community Center');
    this.createBuilding(1180, 270, 195, 120, 0x2563eb, 'Fresh Mart Grocery');
    this.createBuilding(350, 820, 205, 120, 0x059669, 'Havenwood Library');
    this.createBuilding(1180, 820, 195, 120, 0xdc2626, 'Village Health Clinic');
    this.createGardenArea(780, 880);

    const treeCoords = [
      [120, 140], [160, 520], [140, 1020],
      [560, 140], [1000, 140], [1460, 180],
      [540, 1060], [1020, 1060]
    ];
    treeCoords.forEach(([tx, ty]) => {
      const tree = this.obstacles.create(tx, ty, 'prop_tree');
      tree.setDepth(ty);
      tree.body.setSize(32, 24);
      tree.body.setOffset(16, 52);
    });

    // Level Atmosphere Lighting Overlay
    this.atmosphereOverlay = this.add
      .rectangle(0, 0, worldWidth, worldHeight, 0x000000, 0)
      .setOrigin(0, 0)
      .setDepth(1800);

    this.interactables = [];
    this.createNoticeBoard();
    this.createWorldUpgrades();
    this.createAllLevelPropsAndItems();
    this.createVillagers();
    this.createAmbientLife();

    this.waypointRing = this.add.circle(0, 0, 38).setStrokeStyle(4, 0xfacc15).setDepth(2000).setVisible(false);
    this.waypointLabel = this.add.text(0, 0, '', {
      fontFamily: 'Fredoka',
      fontSize: '13px',
      color: '#3b2d1f',
      backgroundColor: '#fef08a',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(2001).setVisible(false);

    const startPos = gameState.playerPosition || { x: 780, y: 580 };
    this.player = new Player(this, startPos.x, startPos.y);
    this.player.movementLocked = true;
    this.physics.add.collider(this.player, this.obstacles);

    // Broom Icon shown in player's hand during Level 2 when carrying broom
    this.playerBroomBadge = this.add.text(0, 0, '🧹', { fontSize: '18px' }).setDepth(2000).setVisible(false);

    // Live Directional Guide Arrow that points toward the current quest objective
    this.guideArrow = this.add.text(0, 0, '➤', {
      fontFamily: 'Fredoka',
      fontSize: '26px',
      color: '#facc15',
      stroke: '#3b2d1f',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(2100);

    this.guideLabel = this.add.text(0, 0, '', {
      fontFamily: 'Fredoka',
      fontSize: '11px',
      color: '#fef08a',
      stroke: '#3b2d1f',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(2100);

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Context-sensitive action keys (T, G, P, F, R + E fallback)
    const actionKeyCodes = ['T', 'G', 'P', 'F', 'R', 'E'];
    actionKeyCodes.forEach((code) => {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[code]).on('down', () => {
        this.triggerInteraction(code);
      });
    });

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J).on('down', () => eventBus.emit('ui:toggle-journal'));
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => eventBus.emit('ui:toggle-map'));
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => eventBus.emit('ui:toggle-pause'));

    eventBus.on('ui:interact', () => this.triggerInteraction(null));
    eventBus.on('ui:movement-lock', (isLocked) => {
      if (this.player) this.player.movementLocked = isLocked;
    });
    eventBus.on('game:pause-physics', (shouldPause) => {
      if (shouldPause) this.physics.world.pause();
      else this.physics.world.resume();
    });
    eventBus.on('game:reset-position', () => {
      if (this.player) {
        this.player.setPosition(780, 580);
        this.waypointRing.setVisible(false);
        this.waypointLabel.setVisible(false);
      }
    });
    eventBus.on('quest:locate', ({ x, y, label }) => this.highlightDestination(x, y, label));
    eventBus.on('quest:completed', () => {
      if (this.player) this.spawnCelebrationBurst(this.player.x, this.player.y - 20);
    });
    eventBus.on('mobile:joystick', ({ vx, vy }) => {
      if (this.player) this.player.setJoystickVector(vx, vy);
    });
    eventBus.on('state:updated', () => this.syncWorldWithState());

    this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        if (this.player && !this.player.movementLocked) {
          gameState.save({ x: this.player.x, y: this.player.y });
        }
      }
    });

    this.syncWorldWithState();
    gameState.emitStateChange();
  }

  createNoticeBoard() {
    this.add.sprite(665, 585, 'prop_noticeboard').setDepth(585);
    this.add.text(665, 550, '📋 Notice Board', {
      fontFamily: 'Fredoka',
      fontSize: '12px',
      color: '#fef08a',
      stroke: '#3b2d1f',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(586);

    this.interactables.push({
      id: 'prop_notice_board',
      key: 'R',
      icon: '📋',
      x: 665,
      y: 585,
      radius: 68,
      prompt: 'Read Havenwood Notice Board',
      onInteract: () => {
        // Level 3 Task 3 Turn-In: Hang Welcome Banner in the Square
        if (gameState.currentLevel === 3 && gameState.getQuestStatus('quest_include_newcomer') === 'ready_to_turn_in') {
          this.presentLevel3WelcomeCircle();
          return;
        }

        // Level 1 Task 6: Choose the Community Square Layout
        if (gameState.currentLevel === 1 && gameState.getQuestStatus('quest_neighbors') !== 'completed') {
          if (gameState.getQuestStatus('quest_neighbors') === 'not_started') {
            gameState.startQuest('quest_neighbors');
          }
          this.presentNeighborResolution();
          return;
        }

        const meta = LEVELS_META.find((l) => l.level === gameState.currentLevel);
        eventBus.emit('dialogue:show', {
          speaker: `Havenwood Notice Board (${meta.title})`,
          role: meta.subtitle,
          text: `${meta.description} Walk up to any villager with a golden [!] overhead and press T, or open the Level Map (M) to switch levels!`,
          choices: [
            { label: '🗺️ Open Level Map (M)', onSelect: () => eventBus.emit('ui:toggle-map') },
            { label: '📖 Open Quest Journal (J)', onSelect: () => eventBus.emit('ui:toggle-journal') },
            { label: 'Close', onSelect: () => {} }
          ]
        });
      }
    });
  }

  createWorldUpgrades() {
    this.grandmaFlowersLeft = this.add.sprite(285, 320, 'prop_flowerbox').setDepth(320).setVisible(false);
    this.grandmaFlowersRight = this.add.sprite(415, 320, 'prop_flowerbox').setDepth(320).setVisible(false);

    this.readingNook = this.add.container(485, 865).setDepth(865).setVisible(false);
    const nookGfx = this.add.graphics();
    nookGfx.fillStyle(0x92400e, 1);
    nookGfx.fillRoundedRect(-42, -16, 84, 32, 8);
    const nookText = this.add.text(0, -2, '📚 Reading Table', {
      fontFamily: 'Fredoka',
      fontSize: '11px',
      color: '#fef08a'
    }).setOrigin(0.5);
    this.readingNook.add([nookGfx, nookText]);

    this.banquetTable = this.add.container(780, 345).setDepth(345).setVisible(false);
    const tableGfx = this.add.graphics();
    tableGfx.fillStyle(0xb45309, 1);
    tableGfx.fillRoundedRect(-75, -16, 150, 32, 8);
    const tableLabel = this.add.text(0, 0, '🍲🥖 Community Feast!', {
      fontFamily: 'Fredoka',
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.banquetTable.add([tableGfx, tableLabel]);

    this.plazaBanner = this.add.text(780, 520, '', {
      fontFamily: 'Fredoka',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#15803d',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(525).setVisible(false);

    // Level 2 Upgrade: Recycling Station
    this.recyclingStation = this.add.text(1245, 330, '♻️ Blue & Green Bins', {
      fontFamily: 'Fredoka',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#0284c7',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(335).setVisible(false);

    // Level 3 Upgrade: Golden Lantern Festival Banner
    this.lanternBanner = this.add.text(780, 480, '🏮✨ Golden Harmony Festival ✨🏮', {
      fontFamily: 'Fredoka',
      fontSize: '15px',
      color: '#fef08a',
      backgroundColor: '#b45309',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setDepth(530).setVisible(false);
  }

  createAllLevelPropsAndItems() {
    // --- LEVEL 1 ITEMS ---
    this.grocerySprite = this.createFloatingItem(1245, 365, 'item_groceries');
    this.interactables.push({
      id: 'item_grocery_package',
      key: 'G',
      icon: '✋',
      x: 1245,
      y: 365,
      radius: 65,
      prompt: 'Pick up Fresh Grocery Basket',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_groceries') === 'active' &&
        !gameState.hasItem('grocery_package'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        this.spawnCelebrationBurst(1245, 365);
        gameState.addItem('grocery_package', 1);
        gameState.setQuestStatus('quest_groceries', 'ready_to_turn_in');
      }
    });

    this.bookSprite = this.createFloatingItem(255, 905, 'item_books');
    this.interactables.push({
      id: 'item_book_stack',
      key: 'G',
      icon: '✋',
      x: 255,
      y: 905,
      radius: 65,
      prompt: 'Collect Community Book Stack',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_books') === 'active' &&
        !gameState.hasItem('book_stack'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        this.spawnCelebrationBurst(255, 905);
        gameState.addItem('book_stack', 1);
        gameState.setQuestStatus('quest_books', 'ready_to_turn_in');
      }
    });

    this.seedSprite = this.createFloatingItem(615, 860, 'item_seeds');
    this.interactables.push({
      id: 'item_seed_bag',
      key: 'G',
      icon: '✋',
      x: 615,
      y: 860,
      radius: 60,
      prompt: 'Pick up Heirloom Seed Bag',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_garden') === 'active' &&
        !gameState.hasItem('seed_bag'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('seed_bag', 1);
      }
    });

    this.wateringCanSprite = this.createFloatingItem(945, 860, 'item_watering_can');
    this.interactables.push({
      id: 'item_watering_can',
      key: 'G',
      icon: '✋',
      x: 945,
      y: 860,
      radius: 60,
      prompt: 'Pick up Copper Watering Can',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_garden') === 'active' &&
        !gameState.hasItem('watering_can'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('watering_can', 1);
      }
    });

    this.gardenPlotSprites = [];
    [[705, 885], [780, 885], [855, 885]].forEach(([px, py], idx) => {
      const plot = this.add.sprite(px, py, 'plot_dry').setDepth(py - 10);
      this.gardenPlotSprites.push(plot);

      this.interactables.push({
        id: `garden_plot_${idx}`,
        key: 'P',
        icon: '🌱',
        x: px,
        y: py,
        radius: 55,
        prompt: `Plant & Water Garden Bed #${idx + 1}`,
        isAvailable: () =>
          gameState.currentLevel === 1 &&
          gameState.getQuestStatus('quest_garden') === 'active' &&
          !gameState.worldFlags.gardenPlotsPlanted[idx],
        onInteract: () => {
          if (!gameState.hasItem('seed_bag') || !gameState.hasItem('watering_can')) {
            eventBus.emit('toast', 'You need both the Seed Bag and Watering Can first!');
            return;
          }
          eventBus.emit('sfx:pickup');
          this.spawnCelebrationBurst(px, py);
          gameState.plantGardenPlot(idx);
        }
      });
    });

    this.produceSprite = this.createFloatingItem(680, 960, 'item_produce');
    this.interactables.push({
      id: 'item_produce_crate',
      key: 'G',
      icon: '✋',
      x: 680,
      y: 960,
      radius: 65,
      prompt: 'Collect Harvest Veggie Crate',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_food') === 'active' &&
        !gameState.hasItem('fresh_produce'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('fresh_produce', 1);
        if (gameState.hasItem('bakery_loaves')) gameState.setQuestStatus('quest_food', 'ready_to_turn_in');
      }
    });

    this.loavesSprite = this.createFloatingItem(1085, 365, 'item_loaves');
    this.interactables.push({
      id: 'item_bakery_loaves',
      key: 'G',
      icon: '✋',
      x: 1085,
      y: 365,
      radius: 65,
      prompt: 'Collect Warm Artisan Loaves',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_food') === 'active' &&
        !gameState.hasItem('bakery_loaves'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('bakery_loaves', 1);
        if (gameState.hasItem('fresh_produce')) gameState.setQuestStatus('quest_food', 'ready_to_turn_in');
      }
    });

    this.medicineSprite = this.createFloatingItem(1250, 910, 'item_medicine');
    this.interactables.push({
      id: 'item_clinic_supplies',
      key: 'G',
      icon: '✋',
      x: 1250,
      y: 910,
      radius: 65,
      prompt: 'Pick up Sealed Wellness Kit',
      isAvailable: () =>
        gameState.currentLevel === 1 &&
        gameState.getQuestStatus('quest_medicine') === 'active' &&
        !gameState.hasItem('clinic_supplies') &&
        !gameState.worldFlags.hendersonDelivered,
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('clinic_supplies', 1);
      }
    });

    // --- LEVEL 2 PROPS: BROOM, 8 TRASH PILES, RECYCLABLES, 3 WATER TAPS ---
    this.broomSprite = this.createFloatingItem(640, 960, 'item_broom');
    this.interactables.push({
      id: 'item_bamboo_broom',
      key: 'G',
      icon: '✋',
      x: 640,
      y: 960,
      radius: 65,
      prompt: 'Equip Bamboo Street Broom',
      isAvailable: () =>
        gameState.currentLevel === 2 &&
        gameState.getQuestStatus('quest_sweep_village') === 'active' &&
        !gameState.hasItem('bamboo_broom'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('bamboo_broom', 1);
        eventBus.emit('toast', '🧹 Broom Equipped! Walk over the 8 trash piles on the roads to sweep them!');
      }
    });

    this.trashPilePositions = [
      [480, 535], [610, 535], [780, 625], [950, 535],
      [1080, 535], [780, 405], [780, 745], [350, 620]
    ];
    this.trashPileSprites = this.trashPilePositions.map(([tx, ty]) =>
      this.add.sprite(tx, ty, 'prop_trash_pile').setDepth(ty - 5).setVisible(false)
    );

    this.recyclablesSprite = this.createFloatingItem(1350, 470, 'item_recyclables');
    this.interactables.push({
      id: 'item_recyclable_bundle',
      key: 'G',
      icon: '✋',
      x: 1350,
      y: 470,
      radius: 65,
      prompt: 'Collect Riverside Recyclables',
      isAvailable: () =>
        gameState.currentLevel === 2 &&
        gameState.getQuestStatus('quest_recycle_sort') === 'active' &&
        !gameState.hasItem('recyclable_bundle'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        this.spawnCelebrationBurst(1350, 470);
        gameState.addItem('recyclable_bundle', 1);
        gameState.setQuestStatus('quest_recycle_sort', 'ready_to_turn_in');
      }
    });

    this.tapPositions = [
      [520, 490], [920, 490], [1140, 700]
    ];
    this.tapSprites = this.tapPositions.map(([wx, wy], idx) => {
      const sprite = this.add.sprite(wx, wy, 'prop_tap_leaking').setDepth(wy).setVisible(false);
      this.interactables.push({
        id: `leaking_tap_${idx}`,
        key: 'F',
        icon: '🔧',
        x: wx,
        y: wy,
        radius: 60,
        prompt: `Turn Off Leaking Water Tap #${idx + 1}`,
        isAvailable: () =>
          gameState.currentLevel === 2 &&
          gameState.getQuestStatus('quest_water_saver') === 'active' &&
          !gameState.worldFlags.tapsFixed[idx],
        onInteract: () => {
          eventBus.emit('sfx:pickup');
          this.spawnCelebrationBurst(wx, wy);
          gameState.fixWaterTap(idx);
        }
      });
      return sprite;
    });

    // --- LEVEL 3 ITEMS: CHAMOMILE TEA, POCKET WATCH, WELCOME BANNER ---
    this.teaSprite = this.createFloatingItem(850, 315, 'item_tea');
    this.interactables.push({
      id: 'item_chamomile_tea',
      key: 'G',
      icon: '✋',
      x: 850,
      y: 315,
      radius: 65,
      prompt: 'Pick up Warm Chamomile Tea',
      isAvailable: () =>
        gameState.currentLevel === 3 &&
        gameState.getQuestStatus('quest_elder_tea') === 'active' &&
        !gameState.hasItem('chamomile_tea'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('chamomile_tea', 1);
        gameState.setQuestStatus('quest_elder_tea', 'ready_to_turn_in');
      }
    });

    this.watchSprite = this.createFloatingItem(430, 895, 'item_watch');
    this.interactables.push({
      id: 'item_vintage_watch',
      key: 'G',
      icon: '✋',
      x: 430,
      y: 895,
      radius: 65,
      prompt: 'Pick up Heritage Pocket Watch',
      isAvailable: () =>
        gameState.currentLevel === 3 &&
        gameState.getQuestStatus('quest_lost_watch') === 'active' &&
        !gameState.hasItem('vintage_watch'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        this.spawnCelebrationBurst(430, 895);
        gameState.addItem('vintage_watch', 1);
        gameState.setQuestStatus('quest_lost_watch', 'ready_to_turn_in');
      }
    });

    this.welcomeCardSprite = this.createFloatingItem(715, 315, 'item_welcome_card');
    this.interactables.push({
      id: 'item_welcome_card',
      key: 'G',
      icon: '✋',
      x: 715,
      y: 315,
      radius: 65,
      prompt: 'Pick up Signed Welcome Banner',
      isAvailable: () =>
        gameState.currentLevel === 3 &&
        gameState.getQuestStatus('quest_include_newcomer') === 'active' &&
        !gameState.hasItem('welcome_card'),
      onInteract: () => {
        eventBus.emit('sfx:pickup');
        gameState.addItem('welcome_card', 1);
        gameState.setQuestStatus('quest_include_newcomer', 'ready_to_turn_in');
      }
    });
  }

  createVillagers() {
    this.spawnVillager('npc_grandma', 350, 355, 'char_grandma', 'Talk to Grandma Evelyn', () => this.talkGrandma());
    this.spawnVillager('npc_shopkeeper', 1145, 365, 'char_shopkeeper', 'Talk to Shopkeeper Leo', () => this.talkShopkeeper());
    this.spawnVillager('npc_student', 350, 915, 'char_student', 'Talk to Student Maya', () => this.talkMaya());
    this.spawnVillager('npc_gardener', 780, 975, 'char_gardener', 'Talk to Gardener Rowan', () => this.talkRowan());
    this.spawnVillager('npc_chef', 780, 310, 'char_chef', 'Talk to Chef Marco', () => this.talkMarco());
    this.spawnVillager('npc_nurse', 1150, 915, 'char_nurse', 'Talk to Nurse Clara', () => this.talkClara());
    this.spawnVillager('npc_henderson', 1365, 555, 'char_elder_man', 'Talk to Mr. Henderson', () => this.talkHenderson());
  }

  spawnVillager(id, x, y, texture, prompt, onInteract) {
    const sprite = this.physics.add.sprite(x, y, texture);
    sprite.setImmovable(true);
    sprite.body.setSize(26, 20);
    sprite.body.setOffset(5, 22);
    sprite.setDepth(y);
    this.obstacles.add(sprite);

    const cleanName = prompt.replace('Talk to ', '');
    const nameTag = this.add.text(x, y + 28, cleanName, {
      fontFamily: 'Nunito',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: '#3b2d1f99',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(y + 1);

    const questMarker = this.add.text(x, y - 34, '!', {
      fontFamily: 'Fredoka',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#facc15',
      stroke: '#3b2d1f',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(y + 20);

    const interactableRef = {
      id,
      x,
      y,
      radius: 68,
      key: 'T',
      icon: '💬',
      prompt,
      onInteract: () => {
        if (!gameState.settings.reducedMotion) {
          this.tweens.add({
            targets: sprite,
            y: sprite.y - 8,
            duration: 110,
            yoyo: true,
            repeat: 1
          });
        }
        onInteract();
      }
    };

    this.interactables.push(interactableRef);

    this.npcs[id] = {
      id,
      sprite,
      nameTag,
      questMarker,
      interactableRef,
      homeX: x,
      homeY: y,
      targetX: x,
      targetY: y,
      roamRadius: 34,
      moveSpeed: 28,
      waitTimer: Phaser.Math.Between(600, 2400),
      phaseOffset: Math.random() * Math.PI * 2
    };
    this.npcSprites[id] = { sprite, badge: questMarker };
  }

  createAmbientLife() {
    this.butterflies = [];
    this.ambientLeaves = [];

    const bfKeys = [
      'particle_butterfly_gold',
      'particle_butterfly_blue',
      'particle_butterfly_pink'
    ];

    // Safe helper to check if a quest is completed via gameState
    const isDone = (qId) =>
      gameState.getQuestStatus && gameState.getQuestStatus(qId) === 'completed';

    const natureAnchors = [
      // Grandma Evelyn's Cottage Flower Boxes (Only appear after Grandma's flowers bloom)
      {
        x: 295,
        y: 318,
        radius: 18,
        condition: () =>
          Boolean(gameState.worldFlags?.grandmaFlowersBloomed) ||
          gameState.currentLevel > 1 ||
          isDone('quest_groceries')
      },
      {
        x: 405,
        y: 318,
        radius: 18,
        condition: () =>
          Boolean(gameState.worldFlags?.grandmaFlowersBloomed) ||
          gameState.currentLevel > 1 ||
          isDone('quest_groceries')
      },

      // Community Garden Beds 1, 2, 3 (Appear one by one as each bed is planted)
      {
        x: 705,
        y: 885,
        radius: 24,
        condition: () =>
          Boolean(gameState.worldFlags?.gardenPlotsPlanted?.[0]) ||
          Boolean(gameState.worldFlags?.gardenRestored) ||
          gameState.currentLevel > 1
      },
      {
        x: 780,
        y: 885,
        radius: 24,
        condition: () =>
          Boolean(gameState.worldFlags?.gardenPlotsPlanted?.[1]) ||
          Boolean(gameState.worldFlags?.gardenRestored) ||
          gameState.currentLevel > 1
      },
      {
        x: 855,
        y: 885,
        radius: 24,
        condition: () =>
          Boolean(gameState.worldFlags?.gardenPlotsPlanted?.[2]) ||
          Boolean(gameState.worldFlags?.gardenRestored) ||
          gameState.currentLevel > 1
      },

      // Outer Village Trees
      { x: 190, y: 190, radius: 22, condition: () => true },
      { x: 560, y: 185, radius: 22, condition: () => true },
      { x: 1010, y: 190, radius: 22, condition: () => true },
      { x: 210, y: 690, radius: 22, condition: () => true },
      { x: 1360, y: 810, radius: 22, condition: () => true }
    ];

    natureAnchors.forEach((spot, i) => {
      const angle = Math.random() * Math.PI * 2;
      const startX = spot.x + Math.cos(angle) * 8;
      const startY = spot.y + Math.sin(angle) * 6;
      const texKey = bfKeys[i % bfKeys.length];

      // Fallback to a small golden circle if BootScene texture wasn't added yet
      const sprite = this.textures.exists(texKey)
        ? this.add.sprite(startX, startY, texKey).setScale(0.72)
        : this.add.circle(startX, startY, 4, 0xfacc15, 0.9);

      sprite.setDepth(spot.y + 30).setVisible(false);

      this.butterflies.push({
        sprite,
        anchorX: spot.x,
        anchorY: spot.y,
        orbitRadius: spot.radius,
        condition: spot.condition,
        angle,
        orbitSpeed: Phaser.Math.FloatBetween(1.1, 1.8) * (i % 2 === 0 ? 1 : -1),
        wingPhase: Math.random() * 10
      });
    });

    // Subtle pollen motes
    for (let i = 0; i < 5; i++) {
      const lx = Phaser.Math.Between(200, 1400);
      const ly = Phaser.Math.Between(200, 1000);
      const particle = this.add.circle(lx, ly, 2.5, 0xfef08a, 0.45).setDepth(2100);

      this.ambientLeaves.push({
        node: particle,
        speedX: Phaser.Math.FloatBetween(10, 18),
        speedY: Phaser.Math.FloatBetween(5, 10),
        swayOffset: Math.random() * 10
      });
    }
  }

  updateAmbientLife(time, delta) {
    if (!this.player) return;
    const dt = delta / 1000;
    const reduced = Boolean(gameState.settings?.reducedMotion);

    // 1. Safely Update Roaming Villagers
    if (this.npcs) {
      Object.values(this.npcs).forEach((npc) => {
        if (!npc || !npc.sprite) return;
        const { sprite, nameTag, questMarker, interactableRef } = npc;

        // Ensure defaults exist even if spawnVillager wasn't updated
        if (npc.homeX === undefined) {
          npc.homeX = sprite.x;
          npc.homeY = sprite.y;
          npc.targetX = sprite.x;
          npc.targetY = sprite.y;
          npc.roamRadius = 30;
          npc.moveSpeed = 26;
          npc.waitTimer = 1500;
          npc.phaseOffset = 0;
        }

        const distToPlayer = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          sprite.x,
          sprite.y
        );

        if (distToPlayer < 95 || this.player.movementLocked || reduced) {
          sprite.setAngle(0);
          if (distToPlayer < 95) {
            sprite.setFlipX(this.player.x < sprite.x);
          }
        } else {
          npc.waitTimer -= delta;
          const distToTarget = Phaser.Math.Distance.Between(
            sprite.x,
            sprite.y,
            npc.targetX,
            npc.targetY
          );

          if (distToTarget > 4) {
            const angle = Math.atan2(npc.targetY - sprite.y, npc.targetX - sprite.x);
            sprite.x += Math.cos(angle) * npc.moveSpeed * dt;
            sprite.y += Math.sin(angle) * npc.moveSpeed * dt;
            if (sprite.body) sprite.body.updateFromGameObject();
            sprite.setFlipX(Math.cos(angle) < -0.1);
            sprite.setAngle(Math.sin(time * 0.012 + npc.phaseOffset) * 3.5);
          } else {
            sprite.setAngle(0);
            sprite.scaleY = 1 + Math.sin(time * 0.005 + npc.phaseOffset) * 0.025;

            if (npc.waitTimer <= 0) {
              npc.waitTimer = Phaser.Math.Between(1800, 4200);
              const randAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
              const randDist = Phaser.Math.FloatBetween(10, npc.roamRadius);
              npc.targetX = npc.homeX + Math.cos(randAngle) * randDist;
              npc.targetY = npc.homeY + Math.sin(randAngle) * randDist;
            }
          }
        }

        sprite.setDepth(sprite.y);
        if (nameTag) nameTag.setPosition(sprite.x, sprite.y + 28).setDepth(sprite.y + 1);
        if (questMarker) {
          questMarker
            .setPosition(
              sprite.x,
              sprite.y - 34 + (reduced ? 0 : Math.sin(time * 0.008 + npc.phaseOffset) * 3)
            )
            .setDepth(sprite.y + 20);
        }
        if (interactableRef) {
          interactableRef.x = sprite.x;
          interactableRef.y = sprite.y;
        }
      });
    }

    // 2. Safely Update Butterflies
    if (this.butterflies) {
      this.butterflies.forEach((bf) => {
        const shouldShow = !reduced && bf.condition();
        bf.sprite.setVisible(shouldShow);
        if (!shouldShow) return;

        bf.angle += bf.orbitSpeed * dt;
        const offsetX = Math.cos(bf.angle) * bf.orbitRadius;
        const offsetY = Math.sin(bf.angle * 2) * (bf.orbitRadius * 0.55);

        const nextX = bf.anchorX + offsetX;
        const nextY = bf.anchorY + offsetY;

        if (bf.sprite.setFlipX) {
          bf.sprite.setFlipX(nextX < bf.sprite.x);
        }
        bf.sprite.x = nextX;
        bf.sprite.y = nextY;
        bf.sprite.scaleX = 0.3 + Math.abs(Math.sin(time * 0.022 + bf.wingPhase)) * 0.48;
      });
    }

    // 3. Safely Update Pollen Motes
    if (this.ambientLeaves) {
      this.ambientLeaves.forEach((lf) => {
        lf.node.setVisible(!reduced);
        if (reduced) return;

        lf.node.x += lf.speedX * dt;
        lf.node.y += lf.speedY * dt + Math.sin(time * 0.004 + lf.swayOffset) * 0.15;

        if (lf.node.x > 1500) lf.node.x = 100;
        if (lf.node.y > 1100) lf.node.y = 100;
      });
    }
  }

  syncWorldWithState() {
    const lvl = gameState.currentLevel;
    const meta = LEVELS_META.find((l) => l.level === lvl) || LEVELS_META[0];

    // Atmosphere tint per level
    this.atmosphereOverlay.setFillStyle(meta.skyTint, meta.skyAlpha);

    // Level 1 items
    this.grocerySprite.setVisible(lvl === 1 && gameState.getQuestStatus('quest_groceries') === 'active' && !gameState.hasItem('grocery_package'));
    this.bookSprite.setVisible(lvl === 1 && gameState.getQuestStatus('quest_books') === 'active' && !gameState.hasItem('book_stack'));
    this.seedSprite.setVisible(lvl === 1 && gameState.getQuestStatus('quest_garden') === 'active' && !gameState.hasItem('seed_bag'));
    this.wateringCanSprite.setVisible(lvl === 1 && gameState.getQuestStatus('quest_garden') === 'active' && !gameState.hasItem('watering_can'));
    this.produceSprite.setVisible(lvl === 1 && gameState.getQuestStatus('quest_food') === 'active' && !gameState.hasItem('fresh_produce'));
    this.loavesSprite.setVisible(lvl === 1 && gameState.getQuestStatus('quest_food') === 'active' && !gameState.hasItem('bakery_loaves'));
    this.medicineSprite.setVisible(
      lvl === 1 &&
      gameState.getQuestStatus('quest_medicine') === 'active' &&
      !gameState.hasItem('clinic_supplies') &&
      !gameState.worldFlags.hendersonDelivered
    );

    this.gardenPlotSprites.forEach((sprite, idx) => {
      const planted = gameState.worldFlags.gardenPlotsPlanted[idx] || gameState.worldFlags.gardenRestored || lvl > 1;
      sprite.setTexture(planted ? 'plot_blooming' : 'plot_dry');
    });

    // Level 2 items & props
    this.broomSprite.setVisible(lvl === 2 && gameState.getQuestStatus('quest_sweep_village') === 'active' && !gameState.hasItem('bamboo_broom'));
    this.trashPileSprites.forEach((sprite, idx) => {
      const showTrash = lvl === 2 && !gameState.worldFlags.trashSwept[idx] && gameState.getQuestStatus('quest_sweep_village') !== 'completed';
      sprite.setVisible(showTrash);
    });
    this.recyclablesSprite.setVisible(lvl === 2 && gameState.getQuestStatus('quest_recycle_sort') === 'active' && !gameState.hasItem('recyclable_bundle'));
    this.tapSprites.forEach((sprite, idx) => {
      sprite.setVisible(lvl === 2);
      const fixed = gameState.worldFlags.tapsFixed[idx] || gameState.getQuestStatus('quest_water_saver') === 'completed';
      sprite.setTexture(fixed ? 'prop_tap_fixed' : 'prop_tap_leaking');
    });

    // Level 3 items
    this.teaSprite.setVisible(lvl === 3 && gameState.getQuestStatus('quest_elder_tea') === 'active' && !gameState.hasItem('chamomile_tea'));
    this.watchSprite.setVisible(lvl === 3 && gameState.getQuestStatus('quest_lost_watch') === 'active' && !gameState.hasItem('vintage_watch'));
    this.welcomeCardSprite.setVisible(lvl === 3 && gameState.getQuestStatus('quest_include_newcomer') === 'active' && !gameState.hasItem('welcome_card'));

    // Persistent World Visual Upgrades
    this.grandmaFlowersLeft.setVisible(gameState.worldFlags.grandmaFlowersBloomed || lvl > 1);
    this.grandmaFlowersRight.setVisible(gameState.worldFlags.grandmaFlowersBloomed || lvl > 1);
    this.readingNook.setVisible(gameState.worldFlags.libraryNookBuilt || lvl > 1);
    this.banquetTable.setVisible(gameState.worldFlags.communityMealActive || lvl > 1);
    this.recyclingStation.setVisible(gameState.worldFlags.recyclingStationBuilt || lvl > 2);
    this.lanternBanner.setVisible(gameState.worldFlags.lanternFestivalActive);

    if (gameState.worldFlags.plazaResolution) {
      const labels = {
        harmony_pavilion: '🎶🎨 Shared Harmony Pavilion (Music & Art)',
        music_stage: '🎵 Acoustic Community Stage',
        art_gallery: '🖼️ Open-Air Village Art Walk'
      };
      this.plazaBanner.setText(labels[gameState.worldFlags.plazaResolution]).setVisible(true);
    } else {
      this.plazaBanner.setVisible(false);
    }

    // Update NPC Overhead Badges based on current Level's active quests
    const npcQuestMap = {
      1: {
        npc_grandma: 'quest_groceries',
        npc_student: 'quest_books',
        npc_gardener: 'quest_garden',
        npc_chef: 'quest_food',
        npc_nurse: 'quest_medicine'
      },
      2: {
        npc_gardener: 'quest_sweep_village',
        npc_shopkeeper: 'quest_recycle_sort',
        npc_nurse: 'quest_water_saver'
      },
      3: {
        npc_grandma: 'quest_elder_tea',
        npc_henderson: 'quest_lost_watch',
        npc_student: 'quest_include_newcomer'
      }
    };

    const currentMap = npcQuestMap[lvl] || {};
    Object.entries(this.npcSprites).forEach(([npcId, { badge }]) => {
      const qId = currentMap[npcId];
      if (!qId) {
        badge.setVisible(false);
        return;
      }
      const st = gameState.getQuestStatus(qId);
      if (st === 'not_started') badge.setText('!').setColor('#facc15').setVisible(true);
      else if (st === 'ready_to_turn_in') badge.setText('?').setColor('#4ade80').setVisible(true);
      else if (st === 'completed') badge.setText('♥').setColor('#f43f5e').setVisible(true);
      else badge.setText('…').setColor('#fde68a').setVisible(true);
    });

    // Automatically lock the world waypoint ring onto the current active task/object!
    const autoTarget = gameState.getActiveTargetCoords();
    if (autoTarget) {
      this.waypointRing.setPosition(autoTarget.x, autoTarget.y).setVisible(true);
      this.waypointLabel
        .setPosition(autoTarget.x, autoTarget.y - 46)
        .setText(`📍 ${autoTarget.label}`)
        .setVisible(true);

      if (!this.waypointPulseTween && !gameState.settings.reducedMotion) {
        this.waypointPulseTween = this.tweens.add({
          targets: this.waypointRing,
          scale: { from: 0.85, to: 1.2 },
          alpha: { from: 0.9, to: 0.35 },
          duration: 750,
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      this.waypointRing.setVisible(false);
      this.waypointLabel.setVisible(false);
    }
  }

  // --- LEVEL-AWARE NPC DIALOGUE HANDLERS ---

  talkGrandma() {
    if (gameState.currentLevel === 3) {
      const st = gameState.getQuestStatus('quest_elder_tea');
      if (st === 'not_started') {
        eventBus.emit('dialogue:show', {
          speaker: 'Grandma Evelyn',
          role: 'Village Elder (Level 3: Respecting Elders)',
          text: 'Good afternoon, young one. The evening breeze is getting chilly. How do you greet your elders today?',
          choices: [
            {
              label: '🙏 "Good afternoon, Grandma Evelyn! May I bring you some warm Chamomile Tea?" (+10 Respect Bonus)',
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.addKindnessBonus(10, 'Polite & Respectful Greeting');
                gameState.startQuest('quest_elder_tea');
              }
            },
            {
              label: '"Hey, what do you need for this quest?" (Accept Quest)',
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.startQuest('quest_elder_tea');
              }
            }
          ]
        });
      } else if (st === 'active') {
        eventBus.emit('dialogue:show', {
          speaker: 'Grandma Evelyn',
          role: 'Village Elder',
          text: 'Chef Marco prepared a cup of Warm Chamomile Tea for me outside the Community Center in the north.',
          choices: [{ label: "I'll bring it right over!", onSelect: () => {} }]
        });
      } else if (st === 'ready_to_turn_in') {
        eventBus.emit('dialogue:show', {
          speaker: 'Grandma Evelyn',
          role: 'Village Elder',
          text: 'Such warm tea, and offered with such gentle manners! Listening to and respecting elders keeps the heart of a village strong.',
          choices: [
            {
              label: '🙏 Serve Tea with Both Hands (+50 Kindness 💛)',
              onSelect: () => {
                gameState.removeItem('chamomile_tea', 1);
                gameState.completeQuest('quest_elder_tea');
              }
            }
          ]
        });
      } else {
        eventBus.emit('dialogue:show', {
          speaker: 'Grandma Evelyn',
          role: 'Village Elder (Cherished)',
          text: 'Your kindness and good manners bring joy to everyone in Havenwood!',
          choices: [{ label: 'Thank you, Grandma Evelyn!', onSelect: () => {} }]
        });
      }
      return;
    }

    // Default Level 1 Grandma Quest
    const status = gameState.getQuestStatus('quest_groceries');
    if (status === 'not_started') {
      eventBus.emit('dialogue:show', {
        speaker: 'Grandma Evelyn',
        role: 'Village Elder',
        text: "Hello dear! My knees are aching today, and I haven't been able to walk over to Fresh Mart for my groceries. Could you bring my basket over?",
        choices: [
          {
            label: "I'd love to help! (Accept Quest)",
            onSelect: () => {
              eventBus.emit('sfx:quest-start');
              gameState.startQuest('quest_groceries');
            }
          },
          { label: 'Maybe later.', onSelect: () => {} }
        ]
      });
    } else if (status === 'active') {
      eventBus.emit('dialogue:show', {
        speaker: 'Grandma Evelyn',
        role: 'Village Elder',
        text: 'Shopkeeper Leo leaves my Fresh Grocery Basket right outside Fresh Mart on the northeast side of town.',
        choices: [{ label: 'On my way!', onSelect: () => {} }]
      });
    } else if (status === 'ready_to_turn_in') {
      eventBus.emit('dialogue:show', {
        speaker: 'Grandma Evelyn',
        role: 'Village Elder',
        text: 'You brought the basket! Thank you so much—look, I even had the energy to set out my flower boxes!',
        choices: [
          {
            label: 'Deliver Groceries (+25 Kindness 💛)',
            onSelect: () => {
              gameState.removeItem('grocery_package', 1);
              gameState.completeQuest('quest_groceries');
            }
          }
        ]
      });
    } else {
      eventBus.emit('dialogue:show', {
        speaker: 'Grandma Evelyn',
        role: 'Village Elder (Happy)',
        text: 'My flowers are blooming and my pantry is full. Thank you for looking out for me!',
        choices: [{ label: 'Anytime, Grandma!', onSelect: () => {} }]
      });
    }
  }

  talkShopkeeper() {
    if (gameState.currentLevel === 2) {
      const st = gameState.getQuestStatus('quest_recycle_sort');
      if (st === 'not_started') {
        eventBus.emit('dialogue:show', {
          speaker: 'Shopkeeper Leo',
          role: 'Eco-Coordinator (Level 2)',
          text: "We're installing a Recycling Station outside Fresh Mart! Could you collect the recyclable bottles left near Riverside Park (East) so we can sort them properly?",
          choices: [
            {
              label: "♻️ Let's recycle them! (Accept Quest)",
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.startQuest('quest_recycle_sort');
              }
            },
            { label: 'Later.', onSelect: () => {} }
          ]
        });
      } else if (st === 'active') {
        eventBus.emit('dialogue:show', {
          speaker: 'Shopkeeper Leo',
          role: 'Eco-Coordinator',
          text: 'The Sorted Recyclables bundle is waiting by the north bank of Riverside Park (East).',
          choices: [{ label: 'On it!', onSelect: () => {} }]
        });
      } else if (st === 'ready_to_turn_in') {
        eventBus.emit('dialogue:show', {
          speaker: 'Shopkeeper Leo',
          role: 'Eco-Coordinator',
          text: 'Fantastic! Separating plastic, glass, and paper keeps Havenwood’s rivers and parks clean for generations!',
          choices: [
            {
              label: '♻️ Sort into Recycling Bins (+45 Kindness 💛)',
              onSelect: () => {
                gameState.removeItem('recyclable_bundle', 1);
                gameState.completeQuest('quest_recycle_sort');
              }
            }
          ]
        });
      } else {
        eventBus.emit('dialogue:show', {
          speaker: 'Shopkeeper Leo',
          role: 'Eco-Coordinator (Happy)',
          text: 'Everyone is using the new Blue & Green Recycling Bins now!',
          choices: [{ label: 'Clean & green!', onSelect: () => {} }]
        });
      }
      return;
    }

    eventBus.emit('dialogue:show', {
      speaker: 'Shopkeeper Leo',
      role: 'Grocer',
      text: 'Welcome to Fresh Mart! Whenever you are helping a neighbor or gathering bread for the Community Center, just pick up the baskets right outside.',
      choices: [{ label: 'Thanks, Leo!', onSelect: () => {} }]
    });
  }

  talkMaya() {
    if (gameState.currentLevel === 3) {
      const st = gameState.getQuestStatus('quest_include_newcomer');
      if (st === 'not_started') {
        eventBus.emit('dialogue:show', {
          speaker: 'Student Maya',
          role: 'Peer Mentor (Level 3: Inclusion)',
          text: "A shy new student named Toby just moved to Havenwood and feels left out. Everyone signed a Welcome Banner at the Community Center—could you pick it up and bring it to Havenwood Square so we can host a Welcome Circle?",
          choices: [
            {
              label: "🌟 Let's make sure no one feels left out! (Accept Quest)",
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.startQuest('quest_include_newcomer');
              }
            }
          ]
        });
      } else if (st === 'active') {
        eventBus.emit('dialogue:show', {
          speaker: 'Student Maya',
          role: 'Peer Mentor',
          text: 'Grab the Signed Welcome Banner outside the Community Center (North), then speak with Sam or Elena in Havenwood Square!',
          choices: [{ label: 'On my way!', onSelect: () => {} }]
        });
      } else {
        eventBus.emit('dialogue:show', {
          speaker: 'Student Maya',
          role: 'Peer Mentor (Happy)',
          text: 'Including someone who feels shy or lonely is one of the highest forms of kindness!',
          choices: [{ label: 'Agreed!', onSelect: () => {} }]
        });
      }
      return;
    }

    const status = gameState.getQuestStatus('quest_books');
    if (status === 'not_started') {
      eventBus.emit('dialogue:show', {
        speaker: 'Student Maya',
        role: 'Youth Tutor',
        text: "Hi! I'm setting up a free after-school reading session for the younger kids, but the Community Book Stack on the west side of the Library is super heavy. Can you grab it for me?",
        choices: [
          {
            label: "Sure, I'll grab the books! (Accept Quest)",
            onSelect: () => {
              eventBus.emit('sfx:quest-start');
              gameState.startQuest('quest_books');
            }
          },
          { label: 'Not right now.', onSelect: () => {} }
        ]
      });
    } else if (status === 'active') {
      eventBus.emit('dialogue:show', {
        speaker: 'Student Maya',
        role: 'Youth Tutor',
        text: 'The Community Book Stack is sitting just to the left of the Havenwood Library building.',
        choices: [{ label: "I'll go pick it up!", onSelect: () => {} }]
      });
    } else if (status === 'ready_to_turn_in') {
      eventBus.emit('dialogue:show', {
        speaker: 'Student Maya',
        role: 'Youth Tutor',
        text: 'Awesome! With these storybooks here, we can set up our outdoor Reading Table right by the library!',
        choices: [
          {
            label: 'Deliver Books (+30 Kindness 💛)',
            onSelect: () => {
              gameState.removeItem('book_stack', 1);
              gameState.completeQuest('quest_books');
            }
          }
        ]
      });
    } else {
      eventBus.emit('dialogue:show', {
        speaker: 'Student Maya',
        role: 'Youth Tutor (Happy)',
        text: 'The kids love the new outdoor reading nook! Thanks for helping education shine in Havenwood.',
        choices: [{ label: 'Happy reading!', onSelect: () => {} }]
      });
    }
  }

  talkRowan() {
    if (gameState.currentLevel === 2) {
      const st = gameState.getQuestStatus('quest_sweep_village');
      if (st === 'not_started') {
        eventBus.emit('dialogue:show', {
          speaker: 'Gardener Rowan',
          role: 'Civic Caretaker (Level 2: Sweeping)',
          text: 'A big windstorm blew 8 piles of leaves and litter onto our village walkways! Pick up the Bamboo Street Broom right next to me, then simply walk over all 8 trash piles to sweep the village clean!',
          choices: [
            {
              label: "🧹 I'll sweep the roads clean! (Accept Quest)",
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.startQuest('quest_sweep_village');
              }
            }
          ]
        });
      } else if (st === 'active') {
        const swept = gameState.worldFlags.trashSwept.filter(Boolean).length;
        eventBus.emit('dialogue:show', {
          speaker: 'Gardener Rowan',
          role: 'Civic Caretaker',
          text: `Make sure you picked up the Bamboo Broom to my left, then walk directly over the remaining litter piles on the paths (${swept}/8 swept so far)!`,
          choices: [{ label: 'Back to sweeping!', onSelect: () => {} }]
        });
      } else if (st === 'ready_to_turn_in') {
        eventBus.emit('dialogue:show', {
          speaker: 'Gardener Rowan',
          role: 'Civic Caretaker',
          text: 'Every single walkway in Havenwood is spotless! Taking pride in our public spaces makes the whole community shine.',
          choices: [
            {
              label: '🧹 Complete Village Sweep (+50 Kindness 💛)',
              onSelect: () => {
                gameState.removeItem('bamboo_broom', 1);
                gameState.completeQuest('quest_sweep_village');
              }
            }
          ]
        });
      } else {
        eventBus.emit('dialogue:show', {
          speaker: 'Gardener Rowan',
          role: 'Civic Caretaker (Proud)',
          text: 'Look how clean the cobblestones look! You set a wonderful example for everyone.',
          choices: [{ label: 'Happy to help!', onSelect: () => {} }]
        });
      }
      return;
    }

    const status = gameState.getQuestStatus('quest_garden');
    if (status === 'not_started') {
      eventBus.emit('dialogue:show', {
        speaker: 'Gardener Rowan',
        role: 'Caretaker',
        text: 'Our Community Garden has been neglected for weeks. If you pick up the Seed Bag and Watering Can on either side of the plot, we can plant all 3 soil beds together!',
        choices: [
          {
            label: "Let's restore the garden! (Accept Quest)",
            onSelect: () => {
              eventBus.emit('sfx:quest-start');
              gameState.startQuest('quest_garden');
            }
          },
          { label: 'Maybe later.', onSelect: () => {} }
        ]
      });
    } else if (status === 'active') {
      eventBus.emit('dialogue:show', {
        speaker: 'Gardener Rowan',
        role: 'Caretaker',
        text: 'Grab both the Heirloom Seed Bag (left of garden) and the Copper Watering Can (right of garden), then interact with all 3 brown soil beds.',
        choices: [{ label: 'Got it!', onSelect: () => {} }]
      });
    } else if (status === 'ready_to_turn_in') {
      eventBus.emit('dialogue:show', {
        speaker: 'Gardener Rowan',
        role: 'Caretaker',
        text: 'Look at those green shoots and golden blossoms! The Community Garden is alive again!',
        choices: [
          {
            label: 'Complete Garden Restoration (+40 Kindness 💛)',
            onSelect: () => {
              gameState.removeItem('seed_bag', 1);
              gameState.removeItem('watering_can', 1);
              gameState.completeQuest('quest_garden');
            }
          }
        ]
      });
    } else {
      eventBus.emit('dialogue:show', {
        speaker: 'Gardener Rowan',
        role: 'Caretaker (Happy)',
        text: 'Every time someone walks past the garden now, they stop and smile.',
        choices: [{ label: 'It looks wonderful!', onSelect: () => {} }]
      });
    }
  }

  talkMarco() {
    const status = gameState.getQuestStatus('quest_food');
    if (status === 'not_started' && gameState.currentLevel === 1) {
      eventBus.emit('dialogue:show', {
        speaker: 'Chef Marco',
        role: 'Community Organizer',
        text: "We're hosting a warm community meal for families who need support! Could you gather a Harvest Veggie Crate from the Community Garden and Warm Artisan Loaves from Fresh Mart?",
        choices: [
          {
            label: 'Count me in! (Accept Quest)',
            onSelect: () => {
              eventBus.emit('sfx:quest-start');
              gameState.startQuest('quest_food');
            }
          },
          { label: 'Give me a moment.', onSelect: () => {} }
        ]
      });
    } else if (status === 'active' && gameState.currentLevel === 1) {
      eventBus.emit('dialogue:show', {
        speaker: 'Chef Marco',
        role: 'Community Organizer',
        text: 'We still need both the Harvest Veggie Crate (by the Community Garden) and Warm Artisan Loaves (outside Fresh Mart).',
        choices: [{ label: "I'll gather both!", onSelect: () => {} }]
      });
    } else if (status === 'ready_to_turn_in' && gameState.currentLevel === 1) {
      eventBus.emit('dialogue:show', {
        speaker: 'Chef Marco',
        role: 'Community Organizer',
        text: 'Fresh vegetables and warm bread! Let’s set out the Community Feast table right here in front of the center!',
        choices: [
          {
            label: 'Deliver Meal Supplies (+45 Kindness 💛)',
            onSelect: () => {
              gameState.removeItem('fresh_produce', 1);
              gameState.removeItem('bakery_loaves', 1);
              gameState.completeQuest('quest_food');
            }
          }
        ]
      });
    } else {
      eventBus.emit('dialogue:show', {
        speaker: 'Chef Marco',
        role: 'Community Organizer (Happy)',
        text: 'The Community Center is always warm and welcoming thanks to you!',
        choices: [{ label: 'Thanks, Chef Marco!', onSelect: () => {} }]
      });
    }
  }

  talkClara() {
    if (gameState.currentLevel === 2) {
      const st = gameState.getQuestStatus('quest_water_saver');
      if (st === 'not_started') {
        eventBus.emit('dialogue:show', {
          speaker: 'Nurse Clara',
          role: 'Public Health & Water (Level 2)',
          text: 'Clean water is precious! Three outdoor water taps along the village paths were left running and leaking. Could you find all 3 blue water taps and shut them off?',
          choices: [
            {
              label: "💧 I'll shut off all 3 leaking taps! (Accept Quest)",
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.startQuest('quest_water_saver');
              }
            }
          ]
        });
      } else if (st === 'active') {
        const fixed = gameState.worldFlags.tapsFixed.filter(Boolean).length;
        eventBus.emit('dialogue:show', {
          speaker: 'Nurse Clara',
          role: 'Public Health & Water',
          text: `You have shut off ${fixed} of 3 leaking taps so far. Check along the central road and near the clinic!`,
          choices: [{ label: 'Looking for them now!', onSelect: () => {} }]
        });
      } else if (st === 'ready_to_turn_in') {
        eventBus.emit('dialogue:show', {
          speaker: 'Nurse Clara',
          role: 'Public Health & Water',
          text: 'All 3 leaking taps are sealed! Conserving clean water protects our whole village.',
          choices: [
            {
              label: '💧 Complete Water Conservation (+45 Kindness 💛)',
              onSelect: () => gameState.completeQuest('quest_water_saver')
            }
          ]
        });
      } else {
        eventBus.emit('dialogue:show', {
          speaker: 'Nurse Clara',
          role: 'Public Health & Water (Happy)',
          text: 'Not a single drop of clean water is going to waste today!',
          choices: [{ label: 'Glad to help!', onSelect: () => {} }]
        });
      }
      return;
    }

    const status = gameState.getQuestStatus('quest_medicine');
    if (status === 'not_started') {
      eventBus.emit('dialogue:show', {
        speaker: 'Nurse Clara',
        role: 'Clinic Coordinator',
        text: 'Hello! Mr. Henderson is resting over by Riverside Park on the east edge of town and needs this pre-packaged Sealed Wellness Kit delivered. Can you take it to him?',
        choices: [
          {
            label: "I'll deliver the kit right away! (Accept Quest)",
            onSelect: () => {
              eventBus.emit('sfx:quest-start');
              gameState.startQuest('quest_medicine');
            }
          },
          { label: 'Maybe later.', onSelect: () => {} }
        ]
      });
    } else if (status === 'active') {
      eventBus.emit('dialogue:show', {
        speaker: 'Nurse Clara',
        role: 'Clinic Coordinator',
        text: 'Pick up the Sealed Wellness Kit next to the Clinic and bring it to Mr. Henderson at Riverside Park (East).',
        choices: [{ label: 'On it!', onSelect: () => {} }]
      });
    } else if (status === 'ready_to_turn_in') {
      eventBus.emit('dialogue:show', {
        speaker: 'Nurse Clara',
        role: 'Clinic Coordinator',
        text: 'Thank you for confirming the delivery to Mr. Henderson! Reliable neighbors keep our whole village healthy.',
        choices: [
          {
            label: 'Complete Clinic Delivery (+35 Kindness 💛)',
            onSelect: () => gameState.completeQuest('quest_medicine')
          }
        ]
      });
    } else {
      eventBus.emit('dialogue:show', {
        speaker: 'Nurse Clara',
        role: 'Clinic Coordinator (Happy)',
        text: 'Mr. Henderson sent word that he feels much better today. Thank you for helping the clinic!',
        choices: [{ label: 'Glad to help!', onSelect: () => {} }]
      });
    }
  }

  talkHenderson() {
    if (gameState.currentLevel === 3) {
      const st = gameState.getQuestStatus('quest_lost_watch');
      if (st === 'not_started') {
        eventBus.emit('dialogue:show', {
          speaker: 'Mr. Henderson',
          role: 'Village Historian (Level 3: Listening to Elders)',
          text: 'Oh my... I seem to have misplaced my grandfather’s Heritage Pocket Watch while reading by the Havenwood Library lawn this morning. Would you listen to an old man’s memory and help me find it?',
          choices: [
            {
              label: '🙏 "I am listening closely, Mr. Henderson. I will check the Library lawn for you!" (+10 Patience Bonus)',
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.addKindnessBonus(10, 'Patient Listening to an Elder');
                gameState.startQuest('quest_lost_watch');
              }
            },
            {
              label: '"I will go grab it at the Library." (Accept Quest)',
              onSelect: () => {
                eventBus.emit('sfx:quest-start');
                gameState.startQuest('quest_lost_watch');
              }
            }
          ]
        });
      } else if (st === 'active') {
        eventBus.emit('dialogue:show', {
          speaker: 'Mr. Henderson',
          role: 'Village Historian',
          text: 'I was sitting just to the right of the Havenwood Library in the southwest when the watch slipped from my coat.',
          choices: [{ label: "I'll search the Library lawn!", onSelect: () => {} }]
        });
      } else if (st === 'ready_to_turn_in') {
        eventBus.emit('dialogue:show', {
          speaker: 'Mr. Henderson',
          role: 'Village Historian',
          text: 'My grandfather’s pocket watch! Because you listened patiently to my story, you knew right where to look. Thank you, young friend!',
          choices: [
            {
              label: '🧭 Return Heritage Pocket Watch (+55 Kindness 💛)',
              onSelect: () => {
                gameState.removeItem('vintage_watch', 1);
                gameState.completeQuest('quest_lost_watch');
              }
            }
          ]
        });
      } else {
        eventBus.emit('dialogue:show', {
          speaker: 'Mr. Henderson',
          role: 'Village Historian (Grateful)',
          text: 'Taking time to listen to elders is a gift more precious than gold.',
          choices: [{ label: 'Always happy to listen!', onSelect: () => {} }]
        });
      }
      return;
    }

    const status = gameState.getQuestStatus('quest_medicine');
    if (status === 'active' && gameState.hasItem('clinic_supplies')) {
      eventBus.emit('dialogue:show', {
        speaker: 'Mr. Henderson',
        role: 'Park Visitor',
        text: 'Ah, is that the Sealed Wellness Kit from Nurse Clara? You saved me a long walk! Please let Nurse Clara know it arrived safely.',
        choices: [
          {
            label: 'Hand over Sealed Wellness Kit',
            onSelect: () => {
              eventBus.emit('sfx:pickup');
              this.spawnCelebrationBurst(1365, 555);
              gameState.removeItem('clinic_supplies', 1);
              gameState.worldFlags.hendersonDelivered = true;
              gameState.setQuestStatus('quest_medicine', 'ready_to_turn_in');
              eventBus.emit('toast', 'Delivered! Return to Nurse Clara at the Clinic.');
            }
          }
        ]
      });
    } else {
      eventBus.emit('dialogue:show', {
        speaker: 'Mr. Henderson',
        role: 'Park Visitor',
        text: 'The breeze by the river is lovely today. Thank you for looking out for everyone in Havenwood!',
        choices: [{ label: 'Enjoy the park!', onSelect: () => {} }]
      });
    }
  }

  presentLevel3WelcomeCircle() {
    eventBus.emit('dialogue:show', {
      speaker: 'Havenwood Square Welcome Circle',
      role: 'Community Celebration',
      text: 'You brought the Signed Welcome Banner to Havenwood Square! Toby is smiling from ear to ear. Let’s light the Golden Festival Lanterns across the square to celebrate everyone belonging!',
      choices: [
        {
          label: '🏮 Hang Welcome Banner & Light Festival Lanterns (+60 Kindness 💛)',
          onSelect: () => {
            gameState.removeItem('welcome_card', 1);
            gameState.completeQuest('quest_include_newcomer', 10);
          }
        }
      ]
    });
  }

  presentNeighborResolution() {
    eventBus.emit('dialogue:show', {
      speaker: 'Havenwood Community Vote',
      role: 'Village Square Proposal',
      text: 'Neighbors submitted ideas on the Notice Board for how to upgrade Havenwood Square. Which community project should we build for the village?',
      choices: [
        {
          label: '🤝 Build a Shared Harmony Pavilion (Music & Art Space) [+60 Kindness]',
          onSelect: () => {
            gameState.worldFlags.plazaResolution = 'harmony_pavilion';
            gameState.completeQuest('quest_neighbors', 10);
          }
        },
        {
          label: '🎵 Build an Acoustic Community Stage [+50 Kindness]',
          onSelect: () => {
            gameState.worldFlags.plazaResolution = 'music_stage';
            gameState.completeQuest('quest_neighbors', 0);
          }
        },
        {
          label: '🖼️ Build an Open-Air Village Art Walk [+50 Kindness]',
          onSelect: () => {
            gameState.worldFlags.plazaResolution = 'art_gallery';
            gameState.completeQuest('quest_neighbors', 0);
          }
        }
      ]
    });
  }

  spawnCelebrationBurst(x, y) {
    if (gameState.settings.reducedMotion) return;
    const symbols = ['💛', '✨', '🌸', '🌟', '💛'];
    symbols.forEach((sym, i) => {
      const angle = (i / symbols.length) * Math.PI * 2;
      const txt = this.add.text(x, y, sym, { fontSize: '20px' }).setOrigin(0.5).setDepth(2500);
      this.tweens.add({
        targets: txt,
        x: x + Math.cos(angle) * 55,
        y: y + Math.sin(angle) * 55 - 25,
        alpha: 0,
        duration: 950,
        ease: 'Cubic.easeOut',
        onComplete: () => txt.destroy()
      });
    });
  }

  highlightDestination(x, y, label) {
    this.waypointRing.setPosition(x, y).setVisible(true);
    this.waypointLabel.setPosition(x, y - 50).setText(`📍 ${label}`).setVisible(true);

    if (!gameState.settings.reducedMotion) {
      this.tweens.killTweensOf(this.waypointRing);
      this.waypointRing.setScale(0.8);
      this.tweens.add({
        targets: this.waypointRing,
        scale: 1.25,
        duration: 700,
        yoyo: true,
        repeat: 5,
        onComplete: () => {
          this.waypointRing.setVisible(false);
          this.waypointLabel.setVisible(false);
        }
      });
    }
    eventBus.emit('toast', `📍 Marked on map: ${label}`);
  }

  drawVillagePathsAndRiver() {
    this.add.tileSprite(250, 500, 1180, 72, 'tile_path').setOrigin(0, 0);
    this.add.tileSprite(744, 240, 72, 620, 'tile_path').setOrigin(0, 0);
    this.add.tileSprite(318, 300, 64, 520, 'tile_path').setOrigin(0, 0);
    this.add.tileSprite(1148, 300, 64, 520, 'tile_path').setOrigin(0, 0);

    const plaza = this.add.graphics();
    plaza.fillStyle(0xe5c99b, 1);
    plaza.fillRoundedRect(650, 430, 260, 210, 24);
    plaza.lineStyle(4, 0xcab082, 1);
    plaza.strokeRoundedRect(650, 430, 260, 210, 24);

    this.add.text(780, 452, 'HAVENWOOD SQUARE', {
      fontFamily: 'Fredoka',
      fontSize: '15px',
      color: '#6e5a47'
    }).setOrigin(0.5);

    const river = this.add.graphics();
    river.fillStyle(0x38bdf8, 0.9);
    river.fillRoundedRect(1420, 420, 130, 320, 28);
    this.add.text(1485, 445, 'Riverside\nPark', {
      fontFamily: 'Fredoka',
      fontSize: '13px',
      color: '#0369a1',
      align: 'center'
    }).setOrigin(0.5);
  }

  createBuilding(x, y, width, height, roofColor, label) {
    const container = this.add.container(x, y);
    const g = this.add.graphics();

    g.fillStyle(0x000000, 0.16);
    g.fillRoundedRect(-width / 2 + 6, -height / 2 + 10, width, height, 10);

    g.fillStyle(0xfffbeb, 1);
    g.fillRoundedRect(-width / 2, -height / 2 + 24, width, height - 24, 8);
    g.lineStyle(3, 0xd6c7b2, 1);
    g.strokeRoundedRect(-width / 2, -height / 2 + 24, width, height - 24, 8);

    g.fillStyle(roofColor, 1);
    g.fillRoundedRect(-width / 2 - 8, -height / 2 - 12, width + 16, 48, 12);

    g.fillStyle(0x78350f, 1);
    g.fillRoundedRect(-16, height / 2 - 36, 32, 36, { tl: 8, tr: 8, bl: 0, br: 0 });

    container.add(g);
    const sign = this.add.text(0, -height / 2 + 12, label, {
      fontFamily: 'Fredoka',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#1f2937',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add(sign);
    container.setDepth(y);

    const hitBox = this.add.zone(x, y + 6, width, height - 10);
    this.physics.add.existing(hitBox, true);
    this.obstacles.add(hitBox);
  }

  createGardenArea(x, y) {
    const g = this.add.graphics();
    g.fillStyle(0x854d0e, 0.85);
    g.fillRoundedRect(x - 130, y - 55, 260, 115, 16);
    g.lineStyle(4, 0xa16207, 1);
    g.strokeRoundedRect(x - 130, y - 55, 260, 115, 16);

    this.add.text(x, y - 72, 'Community Garden', {
      fontFamily: 'Fredoka',
      fontSize: '15px',
      color: '#fef08a',
      stroke: '#3b2d1f',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  createFloatingItem(x, y, texture) {
    const sprite = this.add.sprite(x, y, texture).setDepth(y);
    this.tweens.add({
      targets: sprite,
      y: y - 6,
      duration: 850,
      yoyo: true,
      repeat: -1
    });
    return sprite;
  }

  triggerInteraction(pressedKey = null) {
    if (this.player.movementLocked || !this.activeTarget) return;
    const requiredKey = this.activeTarget.key || 'G';

    // Allow exact key, UI button click (null), or 'E' universal accessibility fallback
    if (pressedKey && pressedKey !== requiredKey && pressedKey !== 'E') {
      eventBus.emit('toast', `Press [${requiredKey}] to ${this.activeTarget.prompt}!`);
      return;
    }

    eventBus.emit('sfx:click');
    this.activeTarget.onInteract();
  }

  update(time, delta) {
    this.player.update(time, delta);
    this.updateAmbientLife(time, delta);

    // Show Broom in Player's Hand during Level 2 when carrying Bamboo Broom
    if (gameState.currentLevel === 2 && gameState.hasItem('bamboo_broom')) {
      this.playerBroomBadge.setPosition(this.player.x + 14, this.player.y - 4).setDepth(this.player.y + 2).setVisible(true);

      // Physical walk-over sweeping check for the 8 Trash Piles!
      this.trashPilePositions.forEach(([tx, ty], idx) => {
        if (!gameState.worldFlags.trashSwept[idx]) {
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty);
          if (d < 42) {
            eventBus.emit('sfx:pickup');
            this.spawnCelebrationBurst(tx, ty);
            gameState.sweepTrashPile(idx);
          }
        }
      });
    } else {
      this.playerBroomBadge.setVisible(false);
    }

    let closest = null;
    let minDistance = Infinity;

    for (const item of this.interactables) {
      if (item.isAvailable && !item.isAvailable()) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (dist <= item.radius && dist < minDistance) {
        minDistance = dist;
        closest = item;
      }
    }

    if (closest !== this.activeTarget) {
      this.activeTarget = closest;
      eventBus.emit(
        'interaction:available',
        closest
          ? {
              prompt: closest.prompt,
              key: closest.key || 'G',
              icon: closest.icon || '✋'
            }
          : null
      );
    }

    // Update In-World Directional Guide Arrow
    const target = gameState.getActiveTargetCoords();
    if (target && !this.player.movementLocked) {
      const distToGoal = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
      if (distToGoal > 95) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        const orbitRadius = 48;
        const ax = this.player.x + Math.cos(angle) * orbitRadius;
        const ay = this.player.y + Math.sin(angle) * orbitRadius;

        this.guideArrow.setPosition(ax, ay).setRotation(angle).setVisible(true);
        this.guideLabel.setPosition(this.player.x, this.player.y - 42).setText(`➔ ${target.label}`).setVisible(true);
      } else {
        this.guideArrow.setVisible(false);
        this.guideLabel.setVisible(false);
      }
    } else {
      this.guideArrow.setVisible(false);
      this.guideLabel.setVisible(false);
    }
  }
}