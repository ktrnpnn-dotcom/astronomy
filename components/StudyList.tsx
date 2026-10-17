"use client";

import { useMemo, useState } from "react";
import { BRIGHT_STARS } from "@/data/brightStars";
import { STICK_FIGURES } from "@/data/stickFigures";
import { figureAim, getSkyObjects, placeBrightStars, placeStickFigures } from "@/lib/astronomy";

const HINTS: Record<string, string> = {
  moon: "месяц диск",
  venus: "утренняя вечерняя звезда яркая точка",
  jupiter: "яркая точка не мигает",
  saturn: "кольца желтоватая",
  mars: "красная",
  mercury: "меркурий",
  uma: "ковш большая медведица",
  umi: "малая медведица полярная",
  ori: "орион охотник",
  cas: "кассиопея w",
  cyg: "лебедь крест",
  lyr: "лира вега",
  sco: "скорпион",
  leo: "лев",
  tau: "телец",
  sirius: "сириус яркая",
  polaris: "полярная север",
};

export function StudyList({
  latitude,
  longitude,
  now,
  onPick,
}: {
  latitude: number;
  longitude: number;
  now: Date;
  onPick: (id: string, azimuth: number) => void;
}) {
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const sky = getSkyObjects(now, latitude, longitude);
    const figures = placeStickFigures(now, latitude, longitude);
    const stars = placeBrightStars(now, latitude, longitude);
    const planets = sky
      .filter((item) => item.id !== "sun")
      .map((item) => ({
        id: item.id,
        name: item.name,
        kind: "планета",
        azimuth: item.azimuth,
        up: item.isAboveHorizon,
      }));
    const constellations = figures.map((figure) => {
      const aim = figureAim(figure);
      return {
        id: figure.id,
        name: figure.name,
        kind: "созвездие",
        azimuth: aim.azimuth,
        up: figure.stars.some((star) => star.altitude > 0),
      };
    });
    const namedStars = stars.map((star) => ({
      id: star.id,
      name: star.name,
      kind: "звезда",
      azimuth: star.azimuth,
      up: star.altitude > 0,
    }));
    return [...planets, ...namedStars, ...constellations];
  }, [latitude, longitude, now]);

  const needle = query.trim().toLowerCase();
  const visible = items
    .filter((item) => {
      if (!needle) return true;
      const hints = HINTS[item.id] ?? "";
      return `${item.name} ${item.kind} ${hints}`.toLowerCase().includes(needle);
    })
    .sort((a, b) => Number(b.up) - Number(a.up) || a.name.localeCompare(b.name, "ru"));

  return (
    <section className="study-list">
      <p className="headline">Что искать</p>
      <p className="footnote mt-2 text-[var(--muted)]">
        Планеты, яркие звёзды и созвездия. Напишите своими словами — карта оставит только цель.
      </p>
      <input
        className="hud-search mt-3"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Луна, ковш, яркая точка…"
        aria-label="Что искать на карте"
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className="mt-3 flex flex-col">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className="btn-text flex w-full items-baseline justify-between gap-3"
            onClick={() => onPick(item.id, item.azimuth)}
          >
            <span className="min-w-0 truncate">{item.name}</span>
            <span className="footnote shrink-0 text-[var(--muted)]">{item.up ? item.kind : "ниже горизонта"}</span>
          </button>
        ))}
      </div>
      {needle ? (
        visible.length ? null : <p className="caption mt-2 text-[var(--muted)]">Ничего не нашлось. Попробуйте другое слово.</p>
      ) : (
        <p className="caption mt-2 text-[var(--muted)]">
          {STICK_FIGURES.length} созвездий и {BRIGHT_STARS.length} ярких звёзд. Сверху те, что сейчас над горизонтом.
        </p>
      )}
    </section>
  );
}
