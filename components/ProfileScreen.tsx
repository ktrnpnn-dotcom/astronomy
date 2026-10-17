"use client";

import { HudReveal } from "@/components/HudReveal";
import { ConstellationSample } from "@/components/ConstellationSample";
import { ObjectDisc } from "@/components/ObjectDisc";
import { CITIES } from "@/lib/cities";
import { CONSTELLATION_STEPS, rankFor } from "@/lib/ranks";
import type { ConstellationView } from "@/types/sky";

export function ProfileScreen({
  cityId,
  nightVision,
  constellationView,
  sightings,
  onCity,
  onNight,
  onConstellationView,
}: {
  cityId: string;
  nightVision: boolean;
  constellationView: ConstellationView;
  sightings: number;
  onCity: () => void;
  onNight: (value: boolean) => void;
  onConstellationView: (value: ConstellationView) => void;
}) {
  const city = CITIES.find((item) => item.id === cityId)?.name ?? "Москва";
  const rank = rankFor(sightings);
  return (
    <HudReveal className="screen pb-10">
      <h1 className="large-title" data-hud>Профиль</h1>
      <p className="subhead mt-2 text-[var(--muted)]" data-hud>
        {rank.name}
        {rank.next ? ` · дальше ${rank.next}` : ""}
      </p>
      <div className="profile-stack mt-6">
        <button type="button" className="card" onClick={onCity}>
          <p className="footnote text-[var(--muted)]">Город</p>
          <p className="headline mt-1">{city}</p>
          <p className="footnote mt-1 text-[var(--muted)]">Если место не определилось, небо считается для этого города.</p>
        </button>
        <div className="card flex items-center justify-between gap-3">
          <div>
            <p className="headline">Ночное зрение</p>
            <p className="footnote mt-1 text-[var(--muted)]">Тусклый красный, чтобы глаза оставались в темноте.</p>
          </div>
          <button
            type="button"
            className="switch"
            data-on={nightVision}
            aria-pressed={nightVision}
            aria-label="Ночное зрение"
            onClick={() => onNight(!nightVision)}
          >
            <span />
          </button>
        </div>
        <div className="card">
          <p className="headline">Созвездия на карте</p>
          <p className="footnote mt-1 text-[var(--muted)]">На карте тот вид, который выбран здесь.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {CONSTELLATION_STEPS.map((item) => {
              const selected = constellationView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="constellation-choice"
                  data-selected={selected}
                  aria-pressed={selected}
                  onClick={() => onConstellationView(item.id)}
                >
                  <ConstellationSample view={item.id} />
                  <span className="footnote mt-2 block">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <section className="mt-8">
        <h2 className="title-2">Виджет</h2>
        <p className="footnote mt-2 text-[var(--muted)]">Яркий вид на рабочий стол. Персеиды бывают в августе.</p>
        <div className="perseid-widget mt-4">
          <div>
            <p className="caption">август · после полуночи</p>
            <p className="title-2 mt-2">Персеиды</p>
            <p className="subhead mt-1">Быстрые следы на северо-востоке</p>
          </div>
          <ObjectDisc kind="meteor" size={72} spin />
        </div>
      </section>
    </HudReveal>
  );
}
