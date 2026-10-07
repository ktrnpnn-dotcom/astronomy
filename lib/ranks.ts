import type { ConstellationView } from "@/types/sky";

export const CONSTELLATION_STEPS: { id: ConstellationView; min: number; label: string }[] = [
  { id: "stars", min: 0, label: "Только звёзды" },
  { id: "lines", min: 1, label: "Линии" },
  { id: "figures", min: 3, label: "Фигуры" },
  { id: "full", min: 6, label: "Фигуры и звёзды" },
];

export function viewUnlocked(sightings: number, view: ConstellationView): boolean {
  const step = CONSTELLATION_STEPS.find((item) => item.id === view);
  return sightings >= (step?.min ?? 0);
}

export function activeConstellationView(sightings: number, preferred: ConstellationView): ConstellationView {
  if (viewUnlocked(sightings, preferred)) return preferred;
  const open = CONSTELLATION_STEPS.filter((item) => sightings >= item.min);
  return open[open.length - 1]?.id ?? "stars";
}

export const RANKS = [
  { name: "Красный карлик", min: 0 },
  { name: "Белый карлик", min: 1 },
  { name: "Жёлтый карлик", min: 3 },
  { name: "Гигант", min: 6 },
  { name: "Сверхновая", min: 10 },
  { name: "Нейтронная звезда", min: 16 },
  { name: "Чёрная дыра", min: 24 },
] as const;

export function rankFor(sightings: number): { name: string; next: string | null } {
  let current: (typeof RANKS)[number] = RANKS[0];
  for (const rank of RANKS) {
    if (sightings >= rank.min) current = rank;
  }
  const upcoming = RANKS.find((rank) => rank.min > sightings);
  return { name: current.name, next: upcoming ? upcoming.name : null };
}
