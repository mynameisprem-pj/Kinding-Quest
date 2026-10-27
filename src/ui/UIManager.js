import { eventBus } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { ITEMS_DATA } from '../data/itemsData.js';
import { QUESTS_DATA, LEVELS_META } from '../data/questsData.js';

export class UIManager {
  constructor() {
    this.inMainMenu = true;
    this.tutorialStepIndex = 0;
    this.layoutEditMode = false;
    this.pendingRewardPayload = null;

    this.mainMenuEl = document.getElementById('main-menu');
    this.hudTopEl = document.getElementById('hud-top');
    this.hudInvEl = document.getElementById('hud-inventory');
    this.mobileControlsEl = document.getElementById('mobile-controls');

    this.scoreBadgeEl = document.getElementById('kindness-score-badge');
    this.scoreEl = document.getElementById('hud-kindness-score');
    this.levelIconEl = document.getElementById('hud-level-icon');
    this.levelTitleEl = document.getElementById('hud-level-title');
    this.progressEl = document.getElementById('hud-village-progress');
    this.objectiveEl = document.getElementById('hud-objective-text');
    this.invSlotsEl = document.getElementById('inventory-slots');

    this.promptEl = document.getElementById('interaction-prompt');
    this.promptKeyBadgeEl = document.getElementById('interaction-key-badge');
    this.promptTextEl = document.getElementById('interaction-prompt-text');

    this.mobileActionBtn = document.getElementById('mobile-action-btn');
    this.mobileActionIcon = document.getElementById('mobile-action-icon');
    this.mobileActionKey = document.getElementById('mobile-action-key');

    // Saga Map Screen
    this.sagaMapModal = document.getElementById('saga-map-modal');
    this.sagaNodesContainer = document.getElementById('saga-nodes-container');
    this.btnJudgeUnlock = document.getElementById('btn-judge-unlock');

    // Tutorial Overlay
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
    this.btnClaimRewards = document.getElementById('btn-claim-rewards');
    this.settingsModal = document.getElementById('settings-modal');
    this.infoModal = document.getElementById('info-modal');

    this.toastEl = document.getElementById('toast-notification');
    this.toastTimer = null;

    this.bindEvents();
    this.bindMenuButtons();
    this.bindTutorialControls();
    this.bindSettingsControls();
    this.bindAnalogJoystickAndDraggableUI();
  }

  bindMenuButtons() {
    document.getElementById('btn-menu-play').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.mainMenuEl.classList.add('hidden');
      this.openSagaMap();
    });

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

    document.getElementById('btn-open-settings').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.openSettings();
    });

    document.getElementById('btn-pause-map').addEventListener('click', () => {
      eventBus.emit('sfx:click');
      this.togglePause(false);
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

    // Claim Rewards Button -> Launches Flying Coin Animation & Sound Effects!
    this.btnClaimRewards.addEventListener('click', () => {
      if (!this.pendingRewardPayload) return;
      this.btnClaimRewards.disabled = true;
      this.animateClaimRewards(this.pendingRewardPayload);
    });
  }

  // --- JUICY FLYING REWARD ANIMATION & SOUND EFFECTS ---
  animateClaimRewards({ totalEarned, isLevelComplete }) {
    const startRect = this.btnClaimRewards.getBoundingClientRect();
    const targetRect = this.scoreBadgeEl.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const coinCount = 8;
    const pointsPerCoin = Math.floor(totalEarned / coinCount);
    let remainder = totalEarned - pointsPerCoin * coinCount;

    for (let i = 0; i < coinCount; i++) {
      setTimeout(() => {
        const coin = document.createElement('div');
        coin.className = 'flying-reward-coin';
        coin.textContent = '💛';
        coin.style.left = `${startX - 14 + (Math.random() * 40 - 20)}px`;
        coin.style.top = `${startY - 14 + (Math.random() * 24 - 12)}px`;
        document.body.appendChild(coin);

        // Trigger transition to Top-Left Score Badge
        requestAnimationFrame(() => {
          const dx = endX - startX;
          const dy = endY - startY;
          coin.style.transform = `translate(${dx}px, ${dy}px) scale(0.55)`;
          coin.style.opacity = '0.2';
        });

        setTimeout(() => {
          coin.remove();
          eventBus.emit('sfx:coin', i);
          const addAmt = i === coinCount - 1 ? pointsPerCoin + remainder : pointsPerCoin;
          gameState.addClaimedPoints(addAmt);

          this.scoreBadgeEl.classList.add('score-bump');
          setTimeout(() => this.scoreBadgeEl.classList.remove('score-bump'), 160);

          if (i === coinCount - 1) {
            setTimeout(() => {
              this.completionModal.classList.add('hidden');
              this.btnClaimRewards.disabled = false;
              this.pendingRewardPayload = null;
              if (isLevelComplete) {
                this.openSagaMap();
              } else {
                this.syncMovementLock();
              }
            }, 260);
          }
        }, 620);
      }, i * 75);
    }
  }

  // --- SMOOTH ANALOG JOYSTICK + DRAGGABLE MOBILE BUTTONS ---
  bindAnalogJoystickAndDraggableUI() {
    const joyZone = document.getElementById('joystick-zone');
    const joyStick = document.getElementById('joystick-stick');
    const dragToggleBtn = document.getElementById('btn-toggle-layout-drag');

    // Toggle Layout Edit Mode so user can drag Joystick & Action Button anywhere
    dragToggleBtn.addEventListener('click', () => {
      this.layoutEditMode = !this.layoutEditMode;
      dragToggleBtn.textContent = this.layoutEditMode
        ? '✅ Done Moving Controls'
        : '✋ Move Controls: OFF';
      dragToggleBtn.classList.toggle('editing', this.layoutEditMode);
      joyZone.classList.toggle('draggable-editing', this.layoutEditMode);
      this.mobileActionBtn.classList.toggle('draggable-editing', this.layoutEditMode);
      if (this.layoutEditMode) {
        this.showToast('Drag the Joystick or Action button anywhere on screen!');
      }
    });

    // Helper to make an element repositionable when layoutEditMode is ON
    const makeRepositionable = (el) => {
      let draggingEl = false;
      let offsetX = 0;
      let offsetY = 0;

      el.addEventListener('pointerdown', (e) => {
        if (!this.layoutEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        draggingEl = true;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        el.setPointerCapture(e.pointerId);
      });

      el.addEventListener('pointermove', (e) => {
        if (!draggingEl || !this.layoutEditMode) return;
        const x = Math.min(Math.max(8, e.clientX - offsetX), window.innerWidth - el.offsetWidth - 8);
        const y = Math.min(Math.max(60, e.clientY - offsetY), window.innerHeight - el.offsetHeight - 8);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
      });

      el.addEventListener('pointerup', () => {
        draggingEl = false;
      });
    };

    makeRepositionable(joyZone);
    makeRepositionable(this.mobileActionBtn);

    // Analog Thumbstick Drag Logic (when not in layoutEditMode)
    let stickActive = false;
    let centerX = 0;
    let centerY = 0;
    const maxRadius = 36;

    const updateStick = (clientX, clientY) => {
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
      eventBus.emit('mobile:joystick', {
        vx: dx / maxRadius,
        vy: dy / maxRadius
      });
    };

    const resetStick = () => {
      stickActive = false;
      joyStick.style.transform = 'translate(0px, 0px)';
      eventBus.emit('mobile:joystick', { vx: 0, vy: 0 });
    };

    joyZone.addEventListener('pointerdown', (e) => {
      if (this.layoutEditMode) return;
      e.preventDefault();
      stickActive = true;
      const rect = joyZone.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
      joyZone.setPointerCapture(e.pointerId);
      updateStick(e.clientX, e.clientY);
    });

    joyZone.addEventListener('pointermove', (e) => {
      if (!stickActive || this.layoutEditMode) return;
      updateStick(e.clientX, e.clientY);
    });

    joyZone.addEventListener('pointerup', resetStick);
    joyZone.addEventListener('pointercancel', resetStick);

    // Action Button Tap
    this.mobileActionBtn.addEventListener('pointerdown', (e) => {
      if (this.layoutEditMode) return;
      e.preventDefault();
      eventBus.emit('ui:interact');
    });
  }

  bindTutorialControls() {
    this.tutorialSteps = [
      {
        targetId: 'hud-left-stats',
        arrow: '⬆',
        title: '1. Kindness Score & Level',
        desc: 'Track your Kindness Points (💛) and Level Progress right here.'
      },
      {
        targetId: 'hud-goal-box',
        arrow: '⬆',
        title: '2. Compact Goal Pill',
        desc: 'This sleek bar always shows your current objective.'
      },
      {
        targetId: 'hud-right-buttons',
        arrow: '⬆',
        title: '3. Levels, Quests & Settings (⚙️)',
        desc: 'Open the Level Map (🗺️), Quest Journal (📖), or Audio Settings (⚙️) anytime.'
      },
      {
        targetId: 'hud-inventory',
        arrow: '⬇',
        title: '4. Action Keys (T, G, P, F)',
        desc: 'Press [T] to Talk, [G] to Grab items, [P] to Plant, and [F] to Fix taps! Follow the golden arrow (➤) to Grandma Evelyn!'
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
        const leftPos = Math.min(Math.max(rect.left + rect.width / 2 - 155, 12), window.innerWidth - 322);
        this.tutorialPointer.style.top = `${rect.bottom + 10}px`;
        this.tutorialPointer.style.left = `${leftPos}px`;
        this.tutorialPointer.style.flexDirection = 'column';
      } else {
        const leftPos = Math.min(Math.max(rect.left, 12), window.innerWidth - 322);
        this.tutorialPointer.style.top = `${Math.max(rect.top - 210, 70)}px`;
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
                    ? `<button class="ui-btn ${isCurrent ? 'btn-gold' : ''} btn-small btn-select-level" data-level="${meta.level}">
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

    eventBus.on('interaction:available', (targetInfo) => {
      if (targetInfo && !this.isAnyModalOpen()) {
        this.promptKeyBadgeEl.textContent = targetInfo.key;
        this.promptTextEl.textContent = targetInfo.prompt;
        this.promptEl.classList.remove('hidden');

        // Also update the mobile action button with the exact icon & key!
        this.mobileActionIcon.textContent = targetInfo.icon;
        this.mobileActionKey.textContent = `[${targetInfo.key}]`;
      } else {
        this.promptEl.classList.add('hidden');
        this.mobileActionIcon.textContent = '✋';
        this.mobileActionKey.textContent = 'ACT';
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
    this.levelTitleEl.textContent = `Lv.${state.currentLevel}`;
    this.progressEl.textContent = `${state.progress.completedCount}/${state.progress.totalQuests}`;
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
    this.journalHeadingEl.textContent = `📖 ${state.levelMeta.title}`;
    this.journalSubtitleEl.textContent = `${completedCount} of ${totalQuests} Quests Completed (${percent}%)`;

    if (state.badges.length === 0) {
      this.journalBadgesEl.innerHTML = '<span class="inv-empty">Complete tasks to earn badges!</span>';
    } else {
      this.journalBadgesEl.innerHTML = state.badges
        .map((b) => `<span class="badge-pill">${b}</span>`)
        .join('');
    }

    const statusLabels = {
      not_started: 'Available',
      active: 'In Progress',
      ready_to_turn_in: 'Turn In',
      completed: 'Done ✓'
    };

    const levelQuests = gameState.getQuestsForLevel(state.currentLevel);

    this.journalListEl.innerHTML = levelQuests
      .map((q) => {
        const st = state.quests[q.id] || 'not_started';
        return `
          <div class="quest-row ${st}">
            <div class="quest-row-top">
              <span class="quest-title">${q.title}</span>
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

  showCompletionModal(payload) {
    const { quest, totalEarned, isLevelComplete, completedLevelNumber } = payload;
    this.pendingRewardPayload = payload;

    const levelMeta = LEVELS_META.find((l) => l.level === completedLevelNumber) || LEVELS_META[0];

    document.getElementById('completion-icon').textContent = isLevelComplete ? '🏆⭐⭐⭐' : '🌟';
    document.getElementById('completion-title').textContent = isLevelComplete
      ? `Level ${completedLevelNumber} Complete!`
      : 'Task Completed!';
    document.getElementById('completion-quest-name').textContent = quest.title;
    document.getElementById('completion-points').textContent = `Reward: +${totalEarned} Kindness Points 💛`;
    document.getElementById('completion-badge').textContent = `Badge: ${quest.rewardBadge}`;
    document.getElementById('completion-impact').textContent = quest.worldImpact;
    document.getElementById('completion-realworld-text').textContent = levelMeta.realWorldFact;

    this.btnClaimRewards.textContent = isLevelComplete
      ? `🎁 Claim +${totalEarned} 💛 & Unlock Next Level!`
      : `🎁 Claim +${totalEarned} 💛 Rewards!`;

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