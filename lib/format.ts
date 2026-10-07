export function greeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 17) return "Добрый день";
  if (hour < 23) return "Добрый вечер";
  return "Доброй ночи";
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

export function formatStoryWhen(at: Date, now: Date): string {
  const clock = formatClock(at);
  const day = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((day(at) - day(now)) / 86_400_000);
  if (diff <= 0) return clock;
  if (diff === 1) return `Завтра, ${clock}`;
  if (diff <= 6) return `${WEEKDAYS[at.getDay()]}, ${clock}`;
  return `${at.getDate()} ${MONTHS[at.getMonth()]} ${clock}`;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function minutesPhrase(minutes: number): string {
  const value = Math.max(0, Math.round(minutes));
  const mod10 = value % 10;
  const mod100 = value % 100;
  let word = "минут";
  if (mod10 === 1 && mod100 !== 11) word = "минуту";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "минуты";
  return `${value} ${word}`;
}

export function formatDistance(distanceKm: number, objectId: string): string {
  if (objectId === "moon") {
    const thousands = Math.round(distanceKm / 1000);
    return `около ${thousands.toLocaleString("ru-RU")} км`;
  }
  const au = distanceKm / 149_597_870.7;
  if (au < 0.05) return `около ${Math.round(distanceKm).toLocaleString("ru-RU")} км`;
  return `около ${au.toFixed(2).replace(".", ",")} а.е. от Земли`;
}
