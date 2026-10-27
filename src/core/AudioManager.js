import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmTimer = null;
    this.isPlayingBgm = false;
    this.noteIndex = 0;

    // Cozy C-Major Pentatonic pastoral melody notes (Hz)
    this.melodyNotes = [
      261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
      293.66, 392.00, 440.00, 392.00, 329.63, 293.66
    ];

    this.bindEvents();
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getSfxGain() {
    return (gameState.settings.sfxVolume / 100) * 0.25;
  }

  getMusicGain() {
    return (gameState.settings.musicVolume / 100) * 0.08;
  }

  bindEvents() {
    // Unlock audio on first user click or keydown
    const unlock = () => {
      this.initContext();
      this.startBgm();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    eventBus.on('sfx:click', () => this.playTone(580, 0.06, 'sine', 0.7));
    eventBus.on('sfx:step', () => this.playTone(145, 0.04, 'triangle', 0.35));
    eventBus.on('sfx:VoiceBlip', () => this.playTone(420 + Math.random() * 90, 0.035, 'sine', 0.35));
    eventBus.on('sfx:pickup', () => this.playArpeggio([392.0, 523.25, 659.25], 0.07));
    eventBus.on('sfx:quest-start', () => this.playArpeggio([329.63, 440.0, 523.25], 0.08));
    eventBus.on('quest:completed', () => this.playArpeggio([261.63, 329.63, 392.0, 523.25, 659.25], 0.11));
  }

  playTone(freq, duration = 0.08, type = 'sine', volumeScale = 1) {
    this.initContext();
    if (!this.ctx) return;

    const gainVal = this.getSfxGain() * volumeScale;
    if (gainVal <= 0.001) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playArpeggio(freqs, noteDuration = 0.08) {
    freqs.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, noteDuration * 1.4, 'triangle', 1.1);
      }, idx * (noteDuration * 1000));
    });
  }

  startBgm() {
    if (this.isPlayingBgm) return;
    this.isPlayingBgm = true;

    this.bgmTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const musicGain = this.getMusicGain();
      if (musicGain <= 0.001) return;

      const freq = this.melodyNotes[this.noteIndex % this.melodyNotes.length];
      this.noteIndex++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(musicGain, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    }, 650);
  }
}

export const audioManager = new AudioManager();