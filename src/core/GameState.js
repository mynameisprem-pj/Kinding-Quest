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

  getQuestsForLevel(levelNum = this.currentLevel) {
    return Object.values(QUESTS_DATA).filter((q) => q.level === levelNum);
  }

  getActiveTargetCoords() {
    const levelQuests = this.getQuestsForLevel(this.currentLevel);
    for (const q of levelQuests) {
      if (this.quests[q.id] === 'ready_to_turn_in') return q.coords.ready_to_turn_in;
    }
    for (const q of levelQuests) {
      if (this.quests[q.id] === 'active') return q.coords.active;
    }
    for (const q of levelQuests) {
      if (this.quests[q.id] === 'not_started') return q.coords.not_started;
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

  completeQuest(questId, bonusPoints = 0) {
    if (this.getQuestStatus(questId) === 'completed') return;
    const quest = QUESTS_DATA[questId];
    this.quests[questId] = 'completed';

    const totalEarned = quest.rewardPoints + bonusPoints;
    this.kindnessScore += totalEarned;

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