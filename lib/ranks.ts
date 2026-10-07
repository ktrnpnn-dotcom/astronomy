import type { ConstellationView } from "@/types/sky";

export const CONSTELLATION_STEPS: { id: ConstellationView; label: string }[] = [
  { id: "stars", label: "Только звёзды" },
  { id: "lines", label: "Линии" },
  { id: "figures", label: "Фигуры" },
  { id: "full", label: "Фигуры и звёзды" },
];

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
