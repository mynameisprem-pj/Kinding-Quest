import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { ITEMS_DATA } from '../data/itemsData.js';
import { QUESTS_DATA, LEVELS_META } from '../data/questsData.js';

export class UIManager {
  constructor() {
    this.inMainMenu = true;
    this.tutorialStepIndex = 0;

    this.mainMenuEl = document.getElementById('main-menu');
    this.hudTopEl = document.getElementById('hud-top');
    this.hudInvEl = document.getElementById('hud-inventory');
    this.mobileControlsEl = document.getElementById('mobile-controls');

    this.scoreEl = document.getElementById('hud-kindness-score');
    this.levelIconEl = document.getElementById('hud-level-icon');
    this.levelTitleEl = document.getElementById('hud-level-title');
    this.progressEl = document.getElementById('hud-village-progress');
    this.objectiveEl = document.getElementById('hud-objective-text');
    this.invSlotsEl = document.getElementById('inventory-slots');
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptTextEl = document.getElementById('interaction-prompt-text');

    // Saga Map Screen
    this.sagaMapModal = document.getElementById('saga-map-modal');
    this.sagaNodesContainer = document.getElementById('saga-nodes-container');
    this.btnJudgeUnlock = document.getElementById('btn-judge-unlock');

    // Tutorial Overlay Elements
    this.tutorialOverlay = document.getElementById('tutorial-overlay');
    this.tutorialPointer = document.getElementById('tutorial-pointer');
    this.tutorialArrow = document.getElementById('tutorial-arrow');
    this.tutorialStepBadge = document.getElementById('tutorial-step-badge');
    this.tutorialTitle = document.getElementById('tutorial-title');
    this.tutorialDesc = document.getElementById('tutorial-desc');

    // Modals
    this.dialogueModal = document.getElementById('dialogue-modal');
    this.speakerEl = document.getElementById('dialogue-speaker');
    this.roleEl = document.getElementById('dialogue-role');
    this.dialogueTextEl = document.getElementById('dialogue-text');
    this.choicesEl = document.getElementById('dialogue-choices');

    this.journalModal = document.getElementById('journal-modal');
    this.journalHeadingEl = document.getElementById('journal-heading');
    this.journalSubtitleEl = document.getElementById('journal-subtitle');
    this.journalBadgesEl = document.getElementById('journal-badges');
    this.journalListEl = document.getElementById('journal-list');

    this.pauseModal = document.getElementById('pause-modal');
    this.completionModal = document.getElementById('completion-modal');
    this.btnNextLevelMap = document.getElementById('btn-next-level-map');
    this.settingsModal = document.getElementById('settings-modal');
    this.infoModal = document.getElementById('info-modal');

    this.toastEl = document.getElementById('toast-notification');
    this.toastTimer = null;

    this.bindEvents();
    this.bindMenuButtons();
    this.bindTutorialControls();
    this.bindSettingsControls();
    this.bindMobileControls();
  }

  bindMenuButtons() {
    // Single "Play Game" button on Title Screen opens the Candy Crush Saga Map
    document.getElementById('btn-menu-play').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.mainMenuEl.classList.add('hidden');
      this.openSagaMap();
    });

    // Back to Title Screen from Saga Map
    document.getElementById('btn-saga-back').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.sagaMapModal.classList.add('hidden');
      if (this.inMainMenu) {
        this.mainMenuEl.classList.remove('hidden');
      }
      this.syncMovementLock();
    });

    this.btnJudgeUnlock.addEventListener('click', () => {
      eventBus.emit('sfx:click');
      gameState.toggleJudgeUnlockAll();
    });

    document.getElementById('btn-open-map').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.openSagaMap();
    });

    document.getElementById('btn-pause-map').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.togglePause(false);
      this.openSagaMap();
    });

    document.getElementById('btn-next-level-map').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.completionModal.classList.add('hidden');
      this.openSagaMap();
    });

    document.getElementById('btn-close-info').addEventListener('click', () => {
      this.infoModal.classList.add('hidden');
      this.syncMovementLock();
    });

    document.getElementById('btn-open-journal').addEventListener('click', () => this.toggleJournal(true));
    document.getElementById('btn-close-journal').addEventListener('click', () => this.toggleJournal(false));

    document.getElementById('btn-open-pause').addEventListener('click', () => this.togglePause(true));
    document.getElementById('btn-pause-resume').addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-pause-journal').addEventListener('click', () => {
      this.togglePause(false);
      this.toggleJournal(true);
    });
    document.getElementById('btn-pause-settings').addEventListener('click', () => this.openSettings());
    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      if (confirm('Reset all levels, quests, and tutorial back to the beginning?')) {
        gameState.resetToDefaults(true);
        eventBus.emit('game:reset-position');
        this.togglePause(false);
        this.openSagaMap();
      }
    });
    document.getElementById('btn-pause-mainmenu').addEventListener('click', () => {
      this.togglePause(false);
      this.returnToMainMenu();
    });

    document.getElementById('btn-close-completion').addEventListener('click', () => {
      this.completionModal.classList.add('hidden');
      this.syncMovementLock();
    });
  }

  // --- INTERACTIVE 4-STEP ARROW COACH FOR FIRST-TIME LEVEL 1 ---
  bindTutorialControls() {
    this.tutorialSteps = [
      {
        targetId: 'hud-left-stats',
        arrow: '⬆',
        title: '1. Kindness Score & Level Progress',
        desc: 'Every time you help a neighbor or clean up the village, your Kindness Score and Level Progress grow here!'
      },
      {
        targetId: 'hud-goal-box',
        arrow: '⬆',
        title: '2. Current Goal Banner',
        desc: 'Never get lost! This banner always tells you your next active task in the village.'
      },
      {
        targetId: 'hud-right-buttons',
        arrow: '⬆',
        title: '3. Level Map & Quest Journal',
        desc: 'Click "Quests (J)" to locate any neighbor on the map, or "Levels (M)" to switch between Saga Levels.'
      },
      {
        targetId: 'hud-inventory',
        arrow: '⬇',
        title: '4. Your Backpack & Guiding Arrow',
        desc: 'Collected items appear here. Now follow the golden arrow (➤) around your character to meet Grandma Evelyn!'
      }
    ];

    document.getElementById('btn-tutorial-next').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.tutorialStepIndex++;
      if (this.tutorialStepIndex >= this.tutorialSteps.length) {
        this.finishTutorial();
      } else {
        this.renderTutorialStep();
      }
    });

    document.getElementById('btn-tutorial-skip').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.finishTutorial();
    });
  }

  startTutorial() {
    this.tutorialStepIndex = 0;
    this.tutorialOverlay.classList.remove('hidden');
    this.renderTutorialStep();
    this.syncMovementLock();
  }

  renderTutorialStep() {
    document.querySelectorAll('.tutorial-highlight').forEach((el) => el.classList.remove('tutorial-highlight'));

    const step = this.tutorialSteps[this.tutorialStepIndex];
    const targetEl = document.getElementById(step.targetId);

    this.tutorialStepBadge.textContent = `Tip ${this.tutorialStepIndex + 1} of ${this.tutorialSteps.length}`;
    this.tutorialTitle.textContent = step.title;
    this.tutorialDesc.textContent = step.desc;
    this.tutorialArrow.textContent = step.arrow;

    const nextBtn = document.getElementById('btn-tutorial-next');
    nextBtn.textContent = this.tutorialStepIndex === this.tutorialSteps.length - 1 ? "Let's Play! ★" : 'Next ➔';

    if (targetEl) {
      targetEl.classList.add('tutorial-highlight');
      const rect = targetEl.getBoundingClientRect();

      if (step.arrow === '⬆') {
        const leftPos = Math.min(Math.max(rect.left + rect.width / 2 - 165, 16), window.innerWidth - 346);
        this.tutorialPointer.style.top = `${rect.bottom + 12}px`;
        this.tutorialPointer.style.left = `${leftPos}px`;
        this.tutorialPointer.style.flexDirection = 'column';
      } else {
        const leftPos = Math.min(Math.max(rect.left, 16), window.innerWidth - 346);
        this.tutorialPointer.style.top = `${Math.max(rect.top - 220, 80)}px`;
        this.tutorialPointer.style.left = `${leftPos}px`;
        this.tutorialPointer.style.flexDirection = 'column-reverse';
      }
    }
  }

  finishTutorial() {
    document.querySelectorAll('.tutorial-highlight').forEach((el) => el.classList.remove('tutorial-highlight'));
    this.tutorialOverlay.classList.add('hidden');
    gameState.markTutorialSeen();
    this.syncMovementLock();
    eventBus.emit('quest:locate', { x: 350, y: 355, label: "Grandma Evelyn's Cottage" });
  }

  // --- CANDY CRUSH WINDING SAGA MAP ---
  openSagaMap() {
    this.renderSagaMap();
    this.sagaMapModal.classList.remove('hidden');
    this.syncMovementLock();
  }

  renderSagaMap() {
    this.btnJudgeUnlock.textContent = gameState.judgeUnlockAll
      ? '🔓 Judge Mode: ON'
      : '🔒 Judge Mode: OFF';

    this.sagaNodesContainer.innerHTML = LEVELS_META.map((meta, index) => {
      const sideClass = index % 2 === 0 ? 'left' : 'right';

      // Coming Soon Levels (Level 4, Level 5, etc.)
      if (!meta.playable) {
        return `
          <div class="map-node-row ${sideClass}">
            <div class="map-node-bubble coming-soon">
              <div class="node-medallion">
                <span class="node-num">Level ${meta.level}</span>
                <span class="node-icon">🔒</span>
              </div>
              <div class="node-content">
                <div class="node-title">${meta.title}</div>
                <div class="node-sub">Coming Soon</div>
                <p class="node-desc">${meta.comingSoonText}</p>
              </div>
            </div>
          </div>
        `;
      }

      const stats = gameState.getProgressStats(meta.level);
      const isUnlocked = meta.level <= gameState.unlockedLevels || gameState.judgeUnlockAll;
      const isCompleted = stats.completedCount === stats.totalQuests;
      const isCurrent = gameState.currentLevel === meta.level;

      const stateClass = isCompleted ? 'completed' : isCurrent ? 'current' : isUnlocked ? '' : 'locked';
      const starsHtml = isCompleted ? '⭐⭐⭐' : stats.completedCount > 0 ? '⭐⭐☆' : '☆☆☆';

      return `
        <div class="map-node-row ${sideClass}">
          <div class="map-node-bubble ${stateClass}">
            <div class="node-medallion">
              <span class="node-num">Level ${meta.level}</span>
              <span class="node-icon">${isUnlocked ? meta.themeIcon : '🔒'}</span>
            </div>
            <div class="node-content">
              <div class="node-title">${meta.title}</div>
              <div class="node-sub">${meta.subtitle}</div>
              <p class="node-desc">${meta.description}</p>
              <div class="node-footer">
                <span class="saga-stars">${starsHtml} <small>(${stats.completedCount}/${stats.totalQuests})</small></span>
                ${
                  isUnlocked
                    ? `<button class="ui-btn ${isCurrent ? 'btn-gold' : ''} btn-select-level" data-level="${meta.level}">
                        ${isCompleted ? '↺ Replay' : '▶ Play Level ' + meta.level}
                      </button>`
                    : `<span class="quest-status-tag">Locked</span>`
                }
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.sagaNodesContainer.querySelectorAll('.btn-select-level').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lvl = Number(btn.dataset.level);
        eventBus.emit('sfx:click');
        gameState.selectLevel(lvl);
        this.sagaMapModal.classList.add('hidden');
        this.startGameplay();

        // Trigger the Arrow Tutorial the very first time Level 1 is clicked!
        if (lvl === 1 && !gameState.tutorialSeen) {
          setTimeout(() => this.startTutorial(), 250);
        } else {
          this.showToast(`Entered ${LEVELS_META.find((l) => l.level === lvl).title}!`);
        }
      });
    });
  }

  bindSettingsControls() {
    const musicInput = document.getElementById('input-music-vol');
    const sfxInput = document.getElementById('input-sfx-vol');
    const motionInput = document.getElementById('input-reduced-motion');
    const musicVal = document.getElementById('val-music-vol');
    const sfxVal = document.getElementById('val-sfx-vol');

    musicInput.value = gameState.settings.musicVolume;
    sfxInput.value = gameState.settings.sfxVolume;
    motionInput.checked = gameState.settings.reducedMotion;
    musicVal.textContent = gameState.settings.musicVolume;
    sfxVal.textContent = gameState.settings.sfxVolume;

    musicInput.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      musicVal.textContent = val;
      gameState.updateSettings({ musicVolume: val });
    });

    sfxInput.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      sfxVal.textContent = val;
      gameState.updateSettings({ sfxVolume: val });
    });

    motionInput.addEventListener('change', (e) => {
      gameState.updateSettings({ reducedMotion: e.target.checked });
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.settingsModal.classList.add('hidden');
      this.syncMovementLock();
    });
  }

  startGameplay() {
    this.inMainMenu = false;
    this.mainMenuEl.classList.add('hidden');
    this.hudTopEl.classList.remove('hidden');
    this.hudInvEl.classList.remove('hidden');
    this.mobileControlsEl.classList.remove('hidden');
    this.syncMovementLock();
  }

  returnToMainMenu() {
    this.inMainMenu = true;
    this.mainMenuEl.classList.remove('hidden');
    this.hudTopEl.classList.add('hidden');
    this.hudInvEl.classList.add('hidden');
    this.mobileControlsEl.classList.add('hidden');
    this.promptEl.classList.add('hidden');
    this.syncMovementLock();
  }

  bindEvents() {
    eventBus.on('state:updated', (state) => {
      this.renderHUD(state);
      this.renderJournal(state);
      if (!this.sagaMapModal.classList.contains('hidden')) {
        this.renderSagaMap();
      }
    });

    eventBus.on('interaction:available', (promptText) => {
      if (promptText && !this.isAnyModalOpen()) {
        this.promptTextEl.textContent = promptText;
        this.promptEl.classList.remove('hidden');
      } else {
        this.promptEl.classList.add('hidden');
      }
    });

    this.promptEl.addEventListener('click', () => eventBus.emit('ui:interact'));
    eventBus.on('dialogue:show', (data) => this.openDialogue(data));
    eventBus.on('toast', (msg) => this.showToast(msg));
    eventBus.on('ui:toggle-journal', () => {
      if (!this.inMainMenu) this.toggleJournal();
    });
    eventBus.on('ui:toggle-map', () => {
      if (!this.inMainMenu) {
        const isHidden = this.sagaMapModal.classList.contains('hidden');
        if (isHidden) this.openSagaMap();
        else {
          this.sagaMapModal.classList.add('hidden');
          this.syncMovementLock();
        }
      }
    });
    eventBus.on('ui:toggle-pause', () => {
      if (!this.inMainMenu) this.togglePause();
    });

    eventBus.on('quest:completed', (payload) => this.showCompletionModal(payload));
  }

  bindMobileControls() {
    const dpadBtns = document.querySelectorAll('.dpad-btn');
    dpadBtns.forEach((btn) => {
      const dir = btn.dataset.dir;
      const start = (e) => {
        e.preventDefault();
        eventBus.emit('mobile:dir', { dir, pressed: true });
      };
      const end = (e) => {
        e.preventDefault();
        eventBus.emit('mobile:dir', { dir, pressed: false });
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('pointercancel', end);
    });

    const actionBtn = document.getElementById('mobile-action-btn');
    actionBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      eventBus.emit('ui:interact');
    });
  }

  isAnyModalOpen() {
    return (
      this.inMainMenu ||
      !this.sagaMapModal.classList.contains('hidden') ||
      !this.tutorialOverlay.classList.contains('hidden') ||
      !this.dialogueModal.classList.contains('hidden') ||
      !this.journalModal.classList.contains('hidden') ||
      !this.pauseModal.classList.contains('hidden') ||
      !this.completionModal.classList.contains('hidden') ||
      !this.settingsModal.classList.contains('hidden') ||
      !this.infoModal.classList.contains('hidden')
    );
  }

  syncMovementLock() {
    const locked = this.isAnyModalOpen();
    eventBus.emit('ui:movement-lock', locked);
    if (locked) this.promptEl.classList.add('hidden');
  }

  renderHUD(state) {
    this.scoreEl.textContent = state.kindnessScore;
    this.levelIconEl.textContent = state.levelMeta.themeIcon;
    this.levelTitleEl.textContent = `Level ${state.currentLevel}`;
    this.progressEl.textContent = `${state.progress.completedCount}/${state.progress.totalQuests} (${state.progress.percent}%)`;
    this.objectiveEl.textContent = state.objectiveText;

    const entries = Object.entries(state.inventory);
    if (entries.length === 0) {
      this.invSlotsEl.innerHTML = '<span class="inv-empty">Empty</span>';
    } else {
      this.invSlotsEl.innerHTML = entries
        .map(([itemId, qty]) => {
          const item = ITEMS_DATA[itemId];
          if (!item) return '';
          return `<span class="inv-chip" data-item="${itemId}" title="Click to inspect">${item.icon} ${item.name} ×${qty}</span>`;
        })
        .join('');

      this.invSlotsEl.querySelectorAll('.inv-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const item = ITEMS_DATA[chip.dataset.item];
          if (!item) return;
          const qty = state.inventory[item.id] || 1;
          this.openInfoModal(
            `${item.icon} ${item.name} (×${qty})`,
            `<p>${item.description}</p>`
          );
        });
      });
    }
  }

  renderJournal(state) {
    const { completedCount, totalQuests, percent } = state.progress;
    this.journalHeadingEl.textContent = `📖 ${state.levelMeta.title} — Quest Journal`;
    this.journalSubtitleEl.textContent = `${completedCount} of ${totalQuests} Level Quests Completed (${percent}%) • Theme: ${state.levelMeta.subtitle}`;

    if (state.badges.length === 0) {
      this.journalBadgesEl.innerHTML = '<span class="inv-empty">Complete quests to earn Friendship & Civic Badges!</span>';
    } else {
      this.journalBadgesEl.innerHTML = state.badges
        .map((b) => `<span class="badge-pill">${b}</span>`)
        .join('');
    }

    const statusLabels = {
      not_started: 'Available',
      active: 'In Progress',
      ready_to_turn_in: 'Ready to Turn In',
      completed: 'Completed ✓'
    };

    const levelQuests = gameState.getQuestsForLevel(state.currentLevel);

    this.journalListEl.innerHTML = levelQuests
      .map((q) => {
        const st = state.quests[q.id] || 'not_started';
        return `
          <div class="quest-row ${st}">
            <div class="quest-row-top">
              <span class="quest-title">${q.title} — <small>${q.locationHint}</small></span>
              <span class="quest-status-tag ${st}">${statusLabels[st]} (+${q.rewardPoints} 💛)</span>
            </div>
            <p class="quest-desc">${q.description}</p>
            <div class="quest-row-bottom">
              <span class="quest-obj">→ ${q.objectives[st]}</span>
              <button class="ui-btn btn-small btn-locate-quest" data-quest="${q.id}">📍 Locate</button>
            </div>
          </div>
        `;
      })
      .join('');

    this.journalListEl.querySelectorAll('.btn-locate-quest').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = QUESTS_DATA[btn.dataset.quest];
        const st = state.quests[q.id] || 'not_started';
        const target = q.coords[st];
        this.toggleJournal(false);
        if (target) {
          eventBus.emit('quest:locate', target);
        }
      });
    });
  }

  toggleJournal(forceState) {
    const isHidden = this.journalModal.classList.contains('hidden');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : isHidden;

    if (shouldOpen) this.journalModal.classList.remove('hidden');
    else this.journalModal.classList.add('hidden');
    this.syncMovementLock();
  }

  togglePause(forceState) {
    const isHidden = this.pauseModal.classList.contains('hidden');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : isHidden;

    if (shouldOpen) {
      this.pauseModal.classList.remove('hidden');
      eventBus.emit('game:pause-physics', true);
    } else {
      this.pauseModal.classList.add('hidden');
      eventBus.emit('game:pause-physics', false);
    }
    this.syncMovementLock();
  }

  openSettings() {
    this.settingsModal.classList.remove('hidden');
    this.syncMovementLock();
  }

  openInfoModal(title, htmlContent) {
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-body').innerHTML = htmlContent;
    this.infoModal.classList.remove('hidden');
    this.syncMovementLock();
  }

  showCompletionModal({ quest, totalEarned, isLevelComplete, completedLevelNumber }) {
    document.getElementById('completion-icon').textContent = isLevelComplete ? '🏆⭐⭐⭐' : '🌟';
    document.getElementById('completion-title').textContent = isLevelComplete
      ? `Level ${completedLevelNumber} Complete (3 Stars)!`
      : 'Quest Completed!';
    document.getElementById('completion-quest-name').textContent = quest.title;
    document.getElementById('completion-points').textContent = `+${totalEarned} Kindness Points Earned 💛`;
    document.getElementById('completion-badge').textContent = `Unlocked: ${quest.rewardBadge}`;

    if (isLevelComplete && completedLevelNumber < 3) {
      document.getElementById('completion-impact').textContent =
        `${quest.worldImpact} 🎉 You earned ⭐⭐⭐ on Level ${completedLevelNumber} and unlocked Level ${completedLevelNumber + 1} on the Kindness Map!`;
      this.btnNextLevelMap.classList.remove('hidden');
    } else if (isLevelComplete && completedLevelNumber === 3) {
      document.getElementById('completion-impact').textContent =
        `${quest.worldImpact} 🏆 Congratulations! You have completed all 3 Playable Levels of Kindness Quest!`;
      this.btnNextLevelMap.classList.remove('hidden');
    } else {
      document.getElementById('completion-impact').textContent = quest.worldImpact;
      this.btnNextLevelMap.classList.add('hidden');
    }

    this.completionModal.classList.remove('hidden');
    this.syncMovementLock();
  }

  openDialogue({ speaker, role, text, choices = [] }) {
    this.speakerEl.textContent = speaker;
    this.roleEl.textContent = role || 'Villager';
    this.choicesEl.innerHTML = '';

    clearInterval(this.typewriterTimer);
    if (gameState.settings.reducedMotion) {
      this.dialogueTextEl.textContent = text;
    } else {
      this.dialogueTextEl.textContent = '';
      let idx = 0;
      this.typewriterTimer = setInterval(() => {
        idx++;
        this.dialogueTextEl.textContent = text.slice(0, idx);
        if (idx % 3 === 0) eventBus.emit('sfx:VoiceBlip');
        if (idx >= text.length) {
          clearInterval(this.typewriterTimer);
        }
      }, 18);
    }

    this.dialogueTextEl.onclick = () => {
      clearInterval(this.typewriterTimer);
      this.dialogueTextEl.textContent = text;
    };

    choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.className = 'ui-btn';
      btn.textContent = choice.label;
      btn.addEventListener('click', () => {
        eventBus.emit('sfx:click');
        this.closeDialogue();
        if (choice.onSelect) choice.onSelect();
      });
      this.choicesEl.appendChild(btn);
    });

    this.dialogueModal.classList.remove('hidden');
    this.syncMovementLock();
  }

  closeDialogue() {
    clearInterval(this.typewriterTimer);
    this.dialogueModal.classList.add('hidden');
    this.syncMovementLock();
  }

  showToast(message) {
    this.toastEl.textContent = message;
    this.toastEl.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 3200);
  }
}