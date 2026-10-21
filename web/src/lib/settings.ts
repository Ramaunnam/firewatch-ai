import type { Thresholds } from '../types';

export interface Settings {
  thresholds: Thresholds;
  sound: boolean;
  boxes: boolean;
  heat: boolean;
}

const KEY = 'firewatch.settings.v1';

export function loadSettings(defaults: Thresholds): Settings {
  const base: Settings = { thresholds: defaults, sound: true, boxes: true, heat: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Settings>;
    return { ...base, ...s, thresholds: { ...defaults, ...(s.thresholds ?? {}) } };
  } catch {
    return base;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage not available: settings last for this visit only */
  }
}
