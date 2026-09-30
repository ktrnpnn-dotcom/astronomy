export type SkyObjectId =
  | "sun"
  | "moon"
  | "venus"
  | "jupiter"
  | "saturn"
  | "iss";

export type SkyObjectType = "sun" | "moon" | "planet" | "satellite";

export interface SkyObject {
  id: SkyObjectId;
  name: string;
  type: SkyObjectType;
  /** Degrees clockwise from north: 0 north, 90 east, 180 south, 270 west. */
  azimuth: number;
  /** Degrees above the horizon. Negative means below. */
  altitude: number;
  distanceKm: number | null;
  isAboveHorizon: boolean;
  visualPriority: number;
  description: string;
  illumination?: number;
  phaseName?: string;
  /** Minutes until the object sets. Null when it is already down or the set is not found. */
  minutesUntilSet: number | null;
  /** True only for placeholders that are not calculated (ISS). */
  isDemo: boolean;
}

export type ViewMode = "ar" | "manual" | "demo";

export type AccuracyStatus =
  | "calibrated"
  | "figure-eight"
  | "demo"
  | "refining"
  | "manual";

export interface GeoFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: "gps" | "city";
  label: string;
}

export type SkyError =
  | "insecure"
  | "camera-missing"
  | "camera-denied"
  | "geo-denied"
  | "geo-slow"
  | "orientation";

export interface Observation {
  id: string;
  objectId: string;
  name: string;
  seen: boolean;
  reasonId?: string;
  at: string;
  note: string;
  demo: boolean;
  place: string;
}

export interface AppSettings {
  cityId: string;
  nightVision: boolean;
  cloudyDemo: boolean;
  reminders: string[];
  observations: Observation[];
  showConstellations: boolean;
}
