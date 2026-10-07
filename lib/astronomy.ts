import {
  Body,
  Equator,
  Horizon,
  Illumination,
  KM_PER_AU,
  MoonPhase,
  Observer,
  SearchAltitude,
  SearchRiseSet,
} from "astronomy-engine";
import type { SkyObject, SkyObjectId, SkyObjectType } from "@/types/sky";

interface Target {
  id: Exclude<SkyObjectId, "iss">;
  name: string;
  body: Body;
  type: SkyObjectType;
}

const TARGETS: Target[] = [
  { id: "sun", name: "Солнце", body: Body.Sun, type: "sun" },
  { id: "moon", name: "Луна", body: Body.Moon, type: "moon" },
  { id: "venus", name: "Венера", body: Body.Venus, type: "planet" },
  { id: "jupiter", name: "Юпитер", body: Body.Jupiter, type: "planet" },
  { id: "saturn", name: "Сатурн", body: Body.Saturn, type: "planet" },
];

function moonPhaseName(phase: number): string {
  if (phase < 12 || phase > 348) return "новолуние";
  if (phase < 80) return "растущий серп";
  if (phase < 100) return "первая четверть";
  if (phase < 170) return "растущая Луна";
  if (phase < 190) return "полнолуние";
  if (phase < 260) return "убывающая Луна";
  if (phase < 280) return "последняя четверть";
  return "убывающий серп";
}

function describe(
  id: Target["id"],
  sunUp: boolean,
  phaseName?: string,
  illumination?: number,
): string {
  if (id === "sun") {
    return "Не смотрите на Солнце через камеру или без сертифицированного солнечного фильтра.";
  }
  if (id === "moon") {
    const lit = illumination == null ? "" : `, освещено ${Math.round(illumination * 100)}%`;
    return `${phaseName ?? "Луна"}${lit}. Крупный светлый диск, его видно глазами.`;
  }
  if (id === "venus") {
    if (sunUp) return "Самая яркая точка. Пока светло, её легко потерять на небе.";
    return "Самая яркая точка на вечернем или утреннем небе. Почти не мерцает.";
  }
  if (id === "jupiter") return "Яркая спокойная точка. Глазами похожа на звезду, которая не мигает.";
  if (id === "saturn") return "Тише Юпитера. Глазами это точка; кольца без телескопа не видны.";
  return "";
}

function priority(id: Target["id"], altitude: number, sunUp: boolean): number {
  if (altitude <= 0) return 0;
  if (id === "sun") return 1;
  let score = id === "venus" ? 92 : id === "moon" ? 84 : id === "jupiter" ? 62 : 50;
  if (altitude < 8) score -= 18;
  if (sunUp && id !== "moon") score -= 28;
  if (altitude >= 8 && altitude <= 35) score += 6;
  return score;
}

/**
 * Local horizontal positions for the Sun, Moon, Venus, Jupiter and Saturn.
 * ISS is intentionally absent: satellite passes need a TLE, not this ephemeris.
 */
export function getSkyObjects(
  date: Date,
  latitude: number,
  longitude: number,
  elevationMeters = 0,
): SkyObject[] {
  const observer = new Observer(latitude, longitude, elevationMeters);
  const sunEquator = Equator(Body.Sun, date, observer, true, true);
  const sunHorizon = Horizon(date, observer, sunEquator.ra, sunEquator.dec, "normal");
  const sunUp = sunHorizon.altitude > 0;
  const phase = MoonPhase(date);

  return TARGETS.map((target) => {
    const equator = Equator(target.body, date, observer, true, true);
    const horizon = Horizon(date, observer, equator.ra, equator.dec, "normal");
    const light = Illumination(target.body, date);
    const altitude = horizon.altitude;
    const isAboveHorizon = altitude > 0;
    let minutesUntilSet: number | null = null;
    if (isAboveHorizon) {
      const set = SearchRiseSet(target.body, observer, -1, date, 2);
      if (set) {
        minutesUntilSet = Math.max(0, Math.round((set.date.getTime() - date.getTime()) / 60000));
      }
    }
    const phaseName = target.id === "moon" ? moonPhaseName(phase) : undefined;
    const illumination = target.id === "moon" ? light.phase_fraction : undefined;
    return {
      id: target.id,
      name: target.name,
      type: target.type,
      azimuth: horizon.azimuth,
      altitude,
      distanceKm: light.geo_dist * KM_PER_AU,
      isAboveHorizon,
      visualPriority: priority(target.id, altitude, sunUp),
      description: describe(target.id, sunUp, phaseName, illumination),
      illumination,
      phaseName,
      minutesUntilSet,
      isDemo: false,
    };
  });
}

export interface EveningMarks {
  sunset: Date | null;
  civilDusk: Date | null;
  nauticalDusk: Date | null;
  astroDusk: Date | null;
}

export function twilightName(sunAltitude: number): string {
  if (sunAltitude > 0) return "день";
  if (sunAltitude > -6) return "гражданские сумерки";
  if (sunAltitude > -12) return "навигационные сумерки";
  if (sunAltitude > -18) return "астрономические сумерки";
  return "ночь";
}

export function getEveningMarks(date: Date, latitude: number, longitude: number): EveningMarks {
  const observer = new Observer(latitude, longitude, 0);
  const noon = new Date(date);
  noon.setHours(12, 0, 0, 0);
  const sunset = SearchRiseSet(Body.Sun, observer, -1, noon, 1);
  const civilDusk = SearchAltitude(Body.Sun, observer, -1, noon, 1, -6);
  const nauticalDusk = SearchAltitude(Body.Sun, observer, -1, noon, 1, -12);
  const astroDusk = SearchAltitude(Body.Sun, observer, -1, noon, 1, -18);
  return {
    sunset: sunset?.date ?? null,
    civilDusk: civilDusk?.date ?? null,
    nauticalDusk: nauticalDusk?.date ?? null,
    astroDusk: astroDusk?.date ?? null,
  };
}

export function nextVisibilityNote(object: SkyObject, date: Date, latitude: number, longitude: number): string {
  if (object.isDemo) {
    return "Пролёт МКС в этой версии не рассчитывается. Метка на карте — только демо.";
  }
  const observer = new Observer(latitude, longitude, 0);
  const body =
    object.id === "moon"
      ? Body.Moon
      : object.id === "venus"
        ? Body.Venus
        : object.id === "jupiter"
          ? Body.Jupiter
          : object.id === "saturn"
            ? Body.Saturn
            : object.id === "sun"
              ? Body.Sun
              : null;
  if (!body) return "Следующее окно посчитаем, когда появится реальный календарь событий.";
  const rise = SearchRiseSet(body, observer, 1, date, 2);
  if (!rise) return "Ближайший восход в ближайшие двое суток не найден.";
  const when = rise.date.toLocaleString("ru-RU", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${object.name} снова поднимется над горизонтом ${when}.`;
}
