import type { AppSettings, Observation } from "@/types/sky";

const KEY = "nebo-seichas-v1";

export const defaultSettings: AppSettings = {
  cityId: "moscow",
  nightVision: false,
  cloudyDemo: false,
  reminders: [],
  observations: [],
  showConstellations: false,
  constellationView: "lines",
  quietNewsIds: [],
  sightings: 0,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      quietNewsIds: Array.isArray(parsed.quietNewsIds) ? parsed.quietNewsIds : [],
      constellationView: parsed.constellationView ?? (parsed.showConstellations ? "lines" : "stars"),
      sightings: typeof parsed.sightings === "number" ? parsed.sightings : 0,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

let cache = defaultSettings;
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  if (!loaded) {
    cache = loadSettings();
    loaded = true;
  }
  return cache;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSettingsSnapshot(): AppSettings {
  return ensureLoaded();
}

export function getSettingsServerSnapshot(): AppSettings {
  return defaultSettings;
}

export function patchSettings(partial: Partial<AppSettings> | ((current: AppSettings) => AppSettings)): void {
  const current = ensureLoaded();
  cache = typeof partial === "function" ? partial(current) : { ...current, ...partial };
  saveSettings(cache);
  listeners.forEach((listener) => listener());
}

export function seenObservations(observations: Observation[]): Observation[] {
  return observations.filter((item) => item.seen);
}
