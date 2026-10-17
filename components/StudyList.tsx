"use client";

import { useMemo, useState } from "react";
import { BRIGHT_STARS } from "@/data/brightStars";
import { STICK_FIGURES } from "@/data/stickFigures";
import { figureAim, getSkyObjects, placeBrightStars, placeStickFigures } from "@/lib/astronomy";

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
    .filter((item) => !needle || `${item.name} ${item.kind}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(b.up) - Number(a.up) || a.name.localeCompare(b.name, "ru"));
  const shown = needle ? visible : visible.slice(0, 14);

  return (
    <section className="card mt-4">
      <p className="headline" data-hud>
        Если не видно ничего
      </p>
      <p className="footnote mt-2 text-[var(--muted)]" data-hud>
        Для изучения. Выберите планету, звезду или созвездие — карта оставит только цель.
      </p>
      <input
        className="hud-search mt-3"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Найти на карте"
        aria-label="Найти на карте"
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className="mt-3 flex flex-col">
        {shown.map((item) => (
          <button
            key={item.id}
            type="button"
            className="btn-text justify-between"
            onClick={() => onPick(item.id, item.azimuth)}
          >
            <span>{item.name}</span>
            <span className="footnote text-[var(--muted)]">{item.up ? item.kind : "ниже горизонта"}</span>
          </button>
        ))}
      </div>
      {needle ? null : (
        <p className="caption mt-2 text-[var(--muted)]">
          В списке {STICK_FIGURES.length} созвездий и {BRIGHT_STARS.length} ярких звёзд. Остальные — через поиск.
        </p>
      )}
    </section>
  );
}
