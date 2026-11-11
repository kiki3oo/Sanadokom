import { runtimeDataPath } from './runtimeData';
import fs from 'fs';

export interface CallStrategySettings {
  enableAutoRotation: boolean;
  maxAttemptsBeforeRotation: number;
  relanceTimeoutHours: number;
  maxUnansweredBacklog: number;
  enableBacklogThrottle: boolean;
}

const DEFAULT_SETTINGS: CallStrategySettings = {
  enableAutoRotation: true,
  maxAttemptsBeforeRotation: 3,
  relanceTimeoutHours: 2,
  maxUnansweredBacklog: 8,
  enableBacklogThrottle: true,
};

// Store in prisma/ directory which is always present and writable
const SETTINGS_FILE_PATH = runtimeDataPath('call-strategy-settings.json');

let memoryCache: CallStrategySettings | null = null;

export function getCallStrategySettings(): CallStrategySettings {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      memoryCache = { ...DEFAULT_SETTINGS, ...parsed };
      return memoryCache!;
    }
  } catch (err) {
    console.error('Error reading call strategy settings:', err);
  }

  memoryCache = { ...DEFAULT_SETTINGS };
  return memoryCache;
}

export function saveCallStrategySettings(newSettings: Partial<CallStrategySettings>): CallStrategySettings {
  const current = getCallStrategySettings();
  const merged: CallStrategySettings = {
    ...current,
    ...newSettings,
    enableAutoRotation:
      newSettings.enableAutoRotation !== undefined ? Boolean(newSettings.enableAutoRotation) : current.enableAutoRotation,
    enableBacklogThrottle:
      newSettings.enableBacklogThrottle !== undefined
        ? Boolean(newSettings.enableBacklogThrottle)
        : current.enableBacklogThrottle,
    maxAttemptsBeforeRotation: Math.max(
      1,
      Math.min(10, parseInt(String(newSettings.maxAttemptsBeforeRotation ?? current.maxAttemptsBeforeRotation)) || 3)
    ),
    relanceTimeoutHours: Math.max(
      0.5,
      Math.min(72, parseFloat(String(newSettings.relanceTimeoutHours ?? current.relanceTimeoutHours)) || 2)
    ),
    maxUnansweredBacklog: Math.max(
      1,
      Math.min(50, parseInt(String(newSettings.maxUnansweredBacklog ?? current.maxUnansweredBacklog)) || 8)
    ),
  };

  memoryCache = merged;

  try {
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing call strategy settings file:', err);
  }

  return merged;
}
