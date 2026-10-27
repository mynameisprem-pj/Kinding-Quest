import { eventBus } from './EventBus.js';
import { SaveManager } from './SaveManager.js';
import { QUESTS_DATA, LEVELS_META } from '../data/questsData.js';
import { ITEMS_DATA } from '../data/itemsData.js';

class GameState {
  constructor() {
    this.settings = {
      musicVolume: 70,
      sfxVolume: 85,
      reducedMotion: false
    };
    const savedSettings = SaveManager.loadSettings();
    if (savedSettings) {
      this.settings = { ...this.settings, ...savedSettings };
    }

    this.resetToDefaults(false);
    this.loadFromStorage();
  }

  hasSavedGame() {
    return SaveManager.hasSave();
  }

  updateSettings(partial) {
    this.settings = { ...this.settings, ...partial };
    SaveManager.saveSettings(this.settings);
    eventBus.emit('settings:updated', this.settings);
  }

  resetToDefaults(clearStorage = true) {
    if (clearStorage) SaveManager.clear();

    this.currentLevel = 1;
    this.unlockedLevels = 1;
    this.judgeUnlockAll = false;
    this.tutorialSeen = false;
    this.levelStars = { 1: 0, 2: 0, 3: 0 };

    this.kindnessScore = 0;
    this.playerPosition = { x: 780, y: 580 };
    this.inventory = {};
    this.quests = {};
    this.badges = [];

    this.worldFlags = {
      grandmaFlowersBloomed: false,
      libraryNookBuilt: false,
      gardenPlotsPlanted: [false, false, false],
      gardenRestored: false,
      communityMealActive: false,
      hendersonDelivered: false,
      talkedToSam: false,
      talkedToElena: false,
      plazaResolution: null,
      trashSwept: [false, false, false, false, false, false, false, false],
      recyclingStationBuilt: false,
      tapsFixed: [false, false, false],
      elderTeaServed: false,
      watchReturned: false,
      lanternFestivalActive: false
    };

    Object.keys(QUESTS_DATA).forEach((qId) => {
      this.quests[qId] = 'not_started';
    });

    this.emitStateChange();
  }

  loadFromStorage() {
    const saved = SaveManager.load();
    if (!saved) return;

    this.currentLevel = saved.currentLevel || 1;
    this.unlockedLevels = saved.unlockedLevels || 1;
    this.judgeUnlockAll = Boolean(saved.judgeUnlockAll);
    this.tutorialSeen = Boolean(saved.tutorialSeen);
    this.levelStars = { ...this.levelStars, ...(saved.levelStars || {}) };

    this.kindnessScore = typeof saved.kindnessScore === 'number' ? saved.kindnessScore : 0;
    this.playerPosition = saved.playerPosition || { x: 780, y: 580 };
    this.inventory = saved.inventory || {};
    this.quests = { ...this.quests, ...(saved.quests || {}) };
    this.badges = Array.isArray(saved.badges) ? saved.badges : [];
    this.worldFlags = { ...this.worldFlags, ...(saved.worldFlags || {}) };
  }

  save(playerCoords = null) {
    if (playerCoords) {
      this.playerPosition = {
        x: Math.round(playerCoords.x),
        y: Math.round(playerCoords.y)
      };
    }
    SaveManager.save({
      currentLevel: this.currentLevel,
      unlockedLevels: this.unlockedLevels,
      judgeUnlockAll: this.judgeUnlockAll,
      tutorialSeen: this.tutorialSeen,
      levelStars: this.levelStars,
      kindnessScore: this.kindnessScore,
      playerPosition: this.playerPosition,
      inventory: this.inventory,
      quests: this.quests,
      badges: this.badges,
      worldFlags: this.worldFlags
    });
  }

  markTutorialSeen() {
    this.tutorialSeen = true;
    this.save();
  }

  toggleJudgeUnlockAll() {
    this.judgeUnlockAll = !this.judgeUnlockAll;
    if (this.judgeUnlockAll) {
      this.unlockedLevels = 3;
      eventBus.emit('toast', '🎓 Judge Mode Enabled: All 3 Levels Unlocked!');
    } else {
      eventBus.emit('toast', 'Judge Mode Disabled.');
    }
    this.save();
    this.emitStateChange();
  }

  selectLevel(levelNum) {
    const meta = LEVELS_META.find((l) => l.level === levelNum);
    if (!meta || !meta.playable) return false;
    if (levelNum > this.unlockedLevels && !this.judgeUnlockAll) return false;

    this.currentLevel = levelNum;
    this.save();
    this.emitStateChange();
    eventBus.emit('level:changed', levelNum);
    return true;
  }

  replayLevel(levelNum) {
    const meta = LEVELS_META.find((l) => l.level === levelNum);
    if (!meta || !meta.playable) return false;

    this.currentLevel = levelNum;

    // 1. Reset all quests belonging to this level back to 'not_started'
    const levelQuests = this.getQuestsForLevel(levelNum);
    levelQuests.forEach((q) => {
      this.quests[q.id] = 'not_started';
    });

    // 2. Reset level-specific world flags & leftover items so tasks are playable from scratch
    if (levelNum === 1) {
      this.worldFlags.grandmaFlowersBloomed = false;
      this.worldFlags.libraryNookBuilt = false;
      this.worldFlags.gardenPlotsPlanted = [false, false, false];
      this.worldFlags.gardenRestored = false;
      this.worldFlags.communityMealActive = false;
      this.worldFlags.hendersonDelivered = false;
      this.worldFlags.talkedToSam = false;
      this.worldFlags.talkedToElena = false;
      this.worldFlags.plazaResolution = null;
      [
        'grocery_package',
        'book_stack',
        'seed_bag',
        'watering_can',
        'fresh_produce',
        'bakery_loaves',
        'clinic_supplies'
      ].forEach((id) => delete this.inventory[id]);
    } else if (levelNum === 2) {
      this.worldFlags.trashSwept = [false, false, false, false, false, false, false, false];
      this.worldFlags.recyclingStationBuilt = false;
      this.worldFlags.tapsFixed = [false, false, false];
      ['bamboo_broom', 'recyclable_bundle'].forEach((id) => delete this.inventory[id]);
    } else if (levelNum === 3) {
      this.worldFlags.elderTeaServed = false;
      this.worldFlags.watchReturned = false;
      this.worldFlags.lanternFestivalActive = false;
      ['chamomile_tea', 'vintage_watch', 'welcome_card'].forEach((id) => delete this.inventory[id]);
    }

    this.save({ x: 780, y: 580 });
    this.emitStateChange();
    eventBus.emit('game:reset-position');
    eventBus.emit('level:changed', levelNum);
    return true;
  }

  getQuestsForLevel(levelNum = this.currentLevel) {
    return Object.values(QUESTS_DATA).filter((q) => q.level === levelNum);
  }

  getActiveTargetCoords() {
    const levelQuests = this.getQuestsForLevel(this.currentLevel);

    // 1. Priority: Any quest ready to turn in
    for (const q of levelQuests) {
      if (this.quests[q.id] === 'ready_to_turn_in') {
        return q.coords.ready_to_turn_in;
      }
    }

    // 2. Priority: Active quest with dynamic sub-step tracking
    for (const q of levelQuests) {
      if (this.quests[q.id] === 'active') {
        // Level 1: Garden (Seeds -> Watering Can -> Unplanted Bed 1, 2, 3)
        if (q.id === 'quest_garden') {
          if (!this.hasItem('seed_bag')) return { x: 615, y: 860, label: 'Pick up Heirloom Seed Bag [G]' };
          if (!this.hasItem('watering_can')) return { x: 945, y: 860, label: 'Pick up Copper Watering Can [G]' };
          const bedCoords = [[705, 885], [780, 885], [855, 885]];
          const nextBedIdx = this.worldFlags.gardenPlotsPlanted.findIndex((planted) => !planted);
          if (nextBedIdx !== -1) {
            return {
              x: bedCoords[nextBedIdx][0],
              y: bedCoords[nextBedIdx][1],
              label: `Plant Garden Bed #${nextBedIdx + 1} [P]`
            };
          }
        }

        // Level 1: Community Food (Veggie Crate -> Bakery Loaves)
        if (q.id === 'quest_food') {
          if (!this.hasItem('fresh_produce')) return { x: 680, y: 960, label: 'Collect Harvest Veggie Crate [G]' };
          if (!this.hasItem('bakery_loaves')) return { x: 1085, y: 365, label: 'Collect Warm Artisan Loaves [G]' };
        }

        // Level 1: Clinic Medicine (Pick up Kit -> Deliver to Mr. Henderson)
        if (q.id === 'quest_medicine') {
          if (!this.hasItem('clinic_supplies') && !this.worldFlags.hendersonDelivered) {
            return { x: 1250, y: 910, label: 'Pick up Sealed Wellness Kit [G]' };
          }
          return { x: 1365, y: 555, label: 'Deliver to Mr. Henderson [T]' };
        }

        // Level 2: Sweeping Trash (Pick up Broom -> Sweep each remaining Trash Pile 1..8)
        if (q.id === 'quest_sweep_village') {
          if (!this.hasItem('bamboo_broom')) return { x: 640, y: 960, label: 'Equip Bamboo Broom [G]' };
          const trashCoords = [
            [480, 535], [610, 535], [780, 625], [950, 535],
            [1080, 535], [780, 405], [780, 745], [350, 620]
          ];
          const nextTrashIdx = this.worldFlags.trashSwept.findIndex((swept) => !swept);
          if (nextTrashIdx !== -1) {
            return {
              x: trashCoords[nextTrashIdx][0],
              y: trashCoords[nextTrashIdx][1],
              label: `Sweep Trash Pile (${nextTrashIdx + 1}/8)`
            };
          }
        }

        // Level 2: Leaking Water Taps (Fix Tap 1, 2, 3 automatically)
        if (q.id === 'quest_water_saver') {
          const tapCoords = [[520, 490], [920, 490], [1140, 700]];
          const nextTapIdx = this.worldFlags.tapsFixed.findIndex((fixed) => !fixed);
          if (nextTapIdx !== -1) {
            return {
              x: tapCoords[nextTapIdx][0],
              y: tapCoords[nextTapIdx][1],
              label: `Fix Leaking Water Tap #${nextTapIdx + 1} [F]`
            };
          }
        }

        return q.coords.active;
      }
    }

    // 3. Priority: Next available quest giver in the current level
    for (const q of levelQuests) {
      if (this.quests[q.id] === 'not_started') {
        return q.coords.not_started;
      }
    }

    return null;
  }

  getQuestStatus(questId) {
    return this.quests[questId] || 'not_started';
  }

  startQuest(questId) {
    if (this.getQuestStatus(questId) !== 'not_started') return;
    this.quests[questId] = 'active';
    this.save();
    this.emitStateChange();
    eventBus.emit('toast', `Quest Accepted: ${QUESTS_DATA[questId].title}`);
  }

  setQuestStatus(questId, status) {
    this.quests[questId] = status;
    this.save();
    this.emitStateChange();
  }

  addKindnessBonus(points, reasonText) {
    this.kindnessScore += points;
    this.save();
    this.emitStateChange();
    eventBus.emit('toast', `✨ +${points} Kindness (${reasonText})!`);
  }

  addClaimedPoints(amount) {
    this.kindnessScore += amount;
    this.save();
    this.emitStateChange();
  }

  completeQuest(questId, bonusPoints = 0) {
    if (this.getQuestStatus(questId) === 'completed') return;
    const quest = QUESTS_DATA[questId];
    this.quests[questId] = 'completed';

    const totalEarned = quest.rewardPoints + bonusPoints;

    if (quest.rewardBadge && !this.badges.includes(quest.rewardBadge)) {
      this.badges.push(quest.rewardBadge);
    }

    if (questId === 'quest_groceries') this.worldFlags.grandmaFlowersBloomed = true;
    if (questId === 'quest_books') this.worldFlags.libraryNookBuilt = true;
    if (questId === 'quest_garden') this.worldFlags.gardenRestored = true;
    if (questId === 'quest_food') this.worldFlags.communityMealActive = true;
    if (questId === 'quest_recycle_sort') this.worldFlags.recyclingStationBuilt = true;
    if (questId === 'quest_elder_tea') this.worldFlags.elderTeaServed = true;
    if (questId === 'quest_lost_watch') this.worldFlags.watchReturned = true;
    if (questId === 'quest_include_newcomer') this.worldFlags.lanternFestivalActive = true;

    const levelStats = this.getProgressStats(quest.level);
    const isLevelComplete = levelStats.completedCount === levelStats.totalQuests;

    if (isLevelComplete) {
      this.levelStars[quest.level] = 3;
      if (quest.level < 3 && this.unlockedLevels < quest.level + 1) {
        this.unlockedLevels = quest.level + 1;
      }
    }

    this.save();
    this.emitStateChange();

    eventBus.emit('quest:completed', {
      questId,
      quest,
      totalEarned,
      isLevelComplete,
      completedLevelNumber: quest.level
    });
  }

  plantGardenPlot(index) {
    if (this.worldFlags.gardenPlotsPlanted[index]) return;
    this.worldFlags.gardenPlotsPlanted[index] = true;

    const allPlanted = this.worldFlags.gardenPlotsPlanted.every(Boolean);
    if (allPlanted && this.getQuestStatus('quest_garden') === 'active') {
      this.quests['quest_garden'] = 'ready_to_turn_in';
      eventBus.emit('toast', 'All 3 Garden Beds planted! Talk to Gardener Rowan.');
    } else {
      const count = this.worldFlags.gardenPlotsPlanted.filter(Boolean).length;
      eventBus.emit('toast', `Planted & watered bed (${count}/3)! 🌱`);
    }
    this.save();
    this.emitStateChange();
  }

  sweepTrashPile(index) {
    if (this.worldFlags.trashSwept[index]) return;
    this.worldFlags.trashSwept[index] = true;
    this.kindnessScore += 5;

    const sweptCount = this.worldFlags.trashSwept.filter(Boolean).length;
    const total = this.worldFlags.trashSwept.length;

    if (sweptCount === total && this.getQuestStatus('quest_sweep_village') === 'active') {
      this.quests['quest_sweep_village'] = 'ready_to_turn_in';
      eventBus.emit('toast', `🧹 All ${total}/${total} piles swept clean! Return to Gardener Rowan!`);
    } else {
      eventBus.emit('toast', `🧹 Swept road clean (${sweptCount}/${total})! +5 💛`);
    }
    this.save();
    this.emitStateChange();
  }

  fixWaterTap(index) {
    if (this.worldFlags.tapsFixed[index]) return;
    this.worldFlags.tapsFixed[index] = true;

    const fixedCount = this.worldFlags.tapsFixed.filter(Boolean).length;
    if (fixedCount === 3 && this.getQuestStatus('quest_water_saver') === 'active') {
      this.quests['quest_water_saver'] = 'ready_to_turn_in';
      eventBus.emit('toast', '💧 All 3 leaking taps shut off! Return to Nurse Clara.');
    } else {
      eventBus.emit('toast', `💧 Shut off leaking tap (${fixedCount}/3)!`);
    }
    this.save();
    this.emitStateChange();
  }

  recordNeighborTalk(person) {
    if (person === 'sam') this.worldFlags.talkedToSam = true;
    if (person === 'elena') this.worldFlags.talkedToElena = true;

    if (
      this.worldFlags.talkedToSam &&
      this.worldFlags.talkedToElena &&
      this.getQuestStatus('quest_neighbors') === 'active'
    ) {
      this.quests['quest_neighbors'] = 'ready_to_turn_in';
    }
    this.save();
    this.emitStateChange();
  }

  addItem(itemId, qty = 1) {
    if (!ITEMS_DATA[itemId]) return;
    this.inventory[itemId] = (this.inventory[itemId] || 0) + qty;
    this.save();
    this.emitStateChange();
    eventBus.emit('toast', `Collected: ${ITEMS_DATA[itemId].icon} ${ITEMS_DATA[itemId].name}`);
  }

  removeItem(itemId, qty = 1) {
    if (!this.hasItem(itemId, qty)) return false;
    this.inventory[itemId] -= qty;
    if (this.inventory[itemId] <= 0) {
      delete this.inventory[itemId];
    }
    this.save();
    this.emitStateChange();
    return true;
  }

  hasItem(itemId, qty = 1) {
    return (this.inventory[itemId] || 0) >= qty;
  }

  getProgressStats(levelNum = this.currentLevel) {
    const levelQuests = this.getQuestsForLevel(levelNum);
    const totalQuests = levelQuests.length;
    const completedCount = levelQuests.filter((q) => this.quests[q.id] === 'completed').length;
    const percent = totalQuests > 0 ? Math.round((completedCount / totalQuests) * 100) : 0;
    return { completedCount, totalQuests, percent };
  }

  getCurrentObjectiveText() {
    const levelQuests = this.getQuestsForLevel(this.currentLevel);

    for (const quest of levelQuests) {
      if (this.quests[quest.id] === 'ready_to_turn_in') return quest.objectives.ready_to_turn_in;
    }
    for (const quest of levelQuests) {
      if (this.quests[quest.id] === 'active') return quest.objectives.active;
    }
    for (const quest of levelQuests) {
      if (this.quests[quest.id] === 'not_started') return `Next: ${quest.objectives.not_started}`;
    }
    return `🌟 Level ${this.currentLevel} Complete! Open the Level Map (M) to choose your next level!`;
  }

  emitStateChange() {
    const levelMeta = LEVELS_META.find((l) => l.level === this.currentLevel) || LEVELS_META[0];
    eventBus.emit('state:updated', {
      currentLevel: this.currentLevel,
      levelMeta,
      unlockedLevels: this.unlockedLevels,
      judgeUnlockAll: this.judgeUnlockAll,
      tutorialSeen: this.tutorialSeen,
      levelStars: this.levelStars,
      kindnessScore: this.kindnessScore,
      playerPosition: this.playerPosition,
      inventory: this.inventory,
      quests: this.quests,
      badges: this.badges,
      worldFlags: this.worldFlags,
      progress: this.getProgressStats(this.currentLevel),
      objectiveText: this.getCurrentObjectiveText(),
      activeTargetCoords: this.getActiveTargetCoords(),
      hasSave: this.hasSavedGame()
    });
  }
}

export const gameState = new GameState();