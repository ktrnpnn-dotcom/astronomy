export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/** Shortest signed turn from `origin` to `target`, in degrees, range (-180, 180]. */
export function shortestDelta(target: number, origin: number): number {
  return ((normalizeDegrees(target) - normalizeDegrees(origin) + 540) % 360) - 180;
}

export function smoothAngle(previous: number, next: number, factor = 0.22): number {
  return normalizeDegrees(previous + shortestDelta(next, previous) * factor);
}

export function headingSpread(samples: number[]): number {
  if (samples.length < 2) return 180;
  const origin = samples[0];
  const deltas = samples.map((sample) => shortestDelta(sample, origin));
  const mean = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  const variance =
    deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / deltas.length;
  return Math.sqrt(variance);
}

const CARDINALS = [
  { d: 0, name: "север", on: "на севере" },
  { d: 45, name: "северо-восток", on: "на северо-востоке" },
  { d: 90, name: "восток", on: "на востоке" },
  { d: 135, name: "юго-восток", on: "на юго-востоке" },
  { d: 180, name: "юг", on: "на юге" },
  { d: 225, name: "юго-запад", on: "на юго-западе" },
  { d: 270, name: "запад", on: "на западе" },
  { d: 315, name: "северо-запад", on: "на северо-западе" },
] as const;

export function directionPhrase(azimuth: number): { name: string; on: string } {
  let best: (typeof CARDINALS)[number] = CARDINALS[0];
  let bestDelta = 999;
  for (const item of CARDINALS) {
    const delta = Math.abs(shortestDelta(azimuth, item.d));
    if (delta < bestDelta) {
      best = item;
      bestDelta = delta;
    }
  }
  return { name: best.name, on: best.on };
}

export function altitudePhrase(altitude: number): string {
  if (altitude < 10) return "низко над горизонтом";
  if (altitude < 28) return "невысоко над горизонтом";
  if (altitude < 60) return "высоко в небе";
  return "почти над головой";
}
