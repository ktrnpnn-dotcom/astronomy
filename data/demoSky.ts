import type { SkyObject } from "@/types/sky";

/**
 * Fixed presentation scene. Positions are authored for the demo, not computed,
 * so the story stays stable: Moscow, 21:20, Venus west, Moon southeast.
 */
export const DEMO_PLACE = "Москва";
export const DEMO_TIME_LABEL = "21:20";
export const DEMO_HEADING = 262;
export const DEMO_VIEW_ALTITUDE = 14;

export const DEMO_OBJECTS: SkyObject[] = [
  {
    id: "venus",
    name: "Венера",
    type: "planet",
    azimuth: 272,
    altitude: 12,
    distanceKm: null,
    isAboveHorizon: true,
    visualPriority: 100,
    description: "Самая яркая точка низко над горизонтом. В демо это заданная сцена, не расчёт.",
    minutesUntilSet: 28,
    isDemo: false,
  },
  {
    id: "moon",
    name: "Луна",
    type: "moon",
    azimuth: 138,
    altitude: 34,
    distanceKm: null,
    isAboveHorizon: true,
    visualPriority: 80,
    description: "Крупный диск на юго-востоке. В демо фаза не привязана к сегодняшней дате.",
    phaseName: "растущая Луна",
    illumination: 0.63,
    minutesUntilSet: 240,
    isDemo: false,
  },
  {
    id: "iss",
    name: "МКС",
    type: "satellite",
    azimuth: 214,
    altitude: 41,
    distanceKm: null,
    isAboveHorizon: true,
    visualPriority: 40,
    description: "Демо-метка. Реальный пролёт появится, когда будет расчёт по TLE.",
    minutesUntilSet: null,
    isDemo: true,
  },
];

/** Decorative track for the demo ISS label. Not an orbit. */
export const DEMO_ISS_TRACK = [
  { azimuth: 196, altitude: 24 },
  { azimuth: 206, altitude: 34 },
  { azimuth: 214, altitude: 41 },
  { azimuth: 226, altitude: 38 },
  { azimuth: 238, altitude: 26 },
];
