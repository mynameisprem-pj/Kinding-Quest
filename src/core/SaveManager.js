const SAVE_KEY = 'kindness_quest_save_v1';
const SETTINGS_KEY = 'kindness_quest_settings_v1';

export class SaveManager {
  static hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.kindnessScore === 'number';
    } catch {
      return false;
    }
  }

  static save(stateData) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(stateData));
    } catch (err) {
      console.warn('Could not save game state to LocalStorage:', err);
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Corrupted save data detected, falling back to defaults:', err);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Could not save settings:', err);
    }
  }

  static loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}