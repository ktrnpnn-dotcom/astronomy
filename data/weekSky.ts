export type DiscKind = "moon" | "venus" | "jupiter" | "saturn" | "meteor" | "dragon";

export interface WeekItem {
  id: string;
  title: string;
  story: string;
  when: string;
  look: string;
  guide: string;
  kind: DiscKind;
  objectId: string | null;
  azimuth: number;
  hour: number;
  minute: number;
  /** Calendar day YYYY-MM-DD. Without it the next hour:minute is used. */
  on?: string;
}

export function eventAt(item: WeekItem, now: Date): Date {
  if (item.on) {
    const [year, month, day] = item.on.split("-").map(Number);
    return new Date(year, month - 1, day, item.hour, item.minute, 0, 0);
  }
  const at = new Date(now);
  at.setHours(item.hour, item.minute, 0, 0);
  if (at.getTime() < now.getTime()) at.setDate(at.getDate() + 1);
  return at;
}

export const ORIONIDS_ID = "orionids";

export const WEEK_ITEMS: WeekItem[] = [
  {
    id: ORIONIDS_ID,
    title: "Ориониды",
    story: "Ориониды",
    when: "2 октября — 7 ноября",
    look: "Быстрые яркие следы, пыль кометы Галлея",
    guide: "Поток уже идёт. Яркая ночь 21–22 октября, после полуночи, на восток.",
    kind: "meteor",
    objectId: null,
    azimuth: 90,
    hour: 0,
    minute: 40,
  },
  {
    id: "draconids",
    title: "Дракониды",
    story: "Дракониды",
    when: "8–9 октября",
    look: "Короткий вечерний поток",
    guide: "Смотрите вечером 8 октября, высоко на северо-западе.",
    kind: "dragon",
    objectId: null,
    azimuth: 320,
    hour: 21,
    minute: 30,
    on: "2026-10-08",
  },
  {
    id: "jupiter-week",
    title: "Юпитер по вечерам",
    story: "Юпитер",
    when: "на этой неделе",
    look: "Яркая спокойная точка",
    guide: "Ищите точку, которая не мигает.",
    kind: "jupiter",
    objectId: "jupiter",
    azimuth: 0,
    hour: 20,
    minute: 0,
    on: "2026-10-09",
  },
  {
    id: "moon-ten",
    title: "Десять минут с Луной",
    story: "Луна",
    when: "сегодня вечером",
    look: "Крупный светлый диск",
    guide: "Диск виден глазами, без приборов.",
    kind: "moon",
    objectId: "moon",
    azimuth: 0,
    hour: 21,
    minute: 10,
  },
  {
    id: "saturn-week",
    title: "Сатурн",
    story: "Сатурн",
    when: "на этой неделе",
    look: "Ровная желтоватая точка",
    guide: "Кольца глазом не разобрать. Ищите спокойную точку.",
    kind: "saturn",
    objectId: "saturn",
    azimuth: 0,
    hour: 19,
    minute: 40,
    on: "2026-10-21",
  },
];
