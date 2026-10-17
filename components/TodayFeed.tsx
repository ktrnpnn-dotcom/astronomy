"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, X } from "lucide-react";
import { HudReveal } from "@/components/HudReveal";
import { ObjectDisc } from "@/components/ObjectDisc";
import { Sheet } from "@/components/Sheet";
import { StudyList } from "@/components/StudyList";
import { eventAt, ORIONIDS_ID, WEEK_ITEMS, type WeekItem } from "@/data/weekSky";
import { getSkyObjects, twilightName } from "@/lib/astronomy";
import { formatClock, formatStoryWhen } from "@/lib/format";
import type { Observation } from "@/types/sky";

export function TodayFeed({
  cityName,
  latitude,
  longitude,
  cloudy,
  quietNewsIds,
  observations,
  onChangeCity,
  onShowSky,
  onQuiet,
  onSeenNews,
}: {
  cityName: string;
  latitude: number;
  longitude: number;
  cloudy: boolean;
  quietNewsIds: string[];
  observations: Observation[];
  onChangeCity: () => void;
  onShowSky: (objectId: string | null, azimuth: number) => void;
  onQuiet: (id: string) => void;
  onSeenNews: (item: WeekItem) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [seenStories, setSeenStories] = useState<string[]>([]);
  const [huntOpen, setHuntOpen] = useState(false);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const id = window.setInterval(update, 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (storyIndex == null) return;
    document.documentElement.dataset.story = "open";
    return () => {
      delete document.documentElement.dataset.story;
    };
  }, [storyIndex]);

  useEffect(() => {
    if (storyIndex == null) return;
    const started = performance.now();
    let frame = 0;
    const tick = (time: number) => {
      const ratio = Math.min(1, (time - started) / 15_000);
      setStoryProgress(ratio);
      if (ratio >= 1) {
        const next = storyIndex + 1;
        const item = WEEK_ITEMS[next];
        if (!item) {
          setStoryIndex(null);
          return;
        }
        setStoryProgress(0);
        setSeenStories((current) => (current.includes(item.id) ? current : [...current, item.id]));
        setStoryIndex(next);
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [storyIndex]);

  const sky = now ? getSkyObjects(now, latitude, longitude) : [];
  const moon = sky.find((item) => item.id === "moon");
  const sun = sky.find((item) => item.id === "sun");
  const twilight = sun ? twilightName(sun.altitude) : "вечер";
  const feature = WEEK_ITEMS.find((item) => item.id === ORIONIDS_ID);
  const featureQuiet = quietNewsIds.includes(ORIONIDS_ID);
  const playing = storyIndex == null ? null : WEEK_ITEMS[storyIndex];
  const seenToday = now
    ? observations.filter((item) => item.seen && item.at.slice(0, 10) === now.toISOString().slice(0, 10)).length
    : 0;

  function openStory(index: number) {
    const item = WEEK_ITEMS[index];
    if (!item) {
      setStoryIndex(null);
      return;
    }
    setStoryProgress(0);
    setSeenStories((current) => (current.includes(item.id) ? current : [...current, item.id]));
    setStoryIndex(index);
  }

  return (
    <HudReveal className="screen">
      <header className="flex items-center justify-between">
        <button type="button" className="btn-quiet -ml-2 gap-1 px-2" onClick={onChangeCity} aria-label="Сменить локацию">
          <MapPin size={18} strokeWidth={1.7} aria-hidden />
          <span data-hud>{cityName}</span>
        </button>
      </header>

      <p className="footnote mt-4 text-[var(--muted)]" data-hud>{twilight}{now ? ` · ${formatClock(now)}` : ""}</p>

      {cloudy ? (
        <article className="mt-4">
          <p className="headline" data-hud>Небо закрыто облаками</p>
          <p className="subhead mt-2 text-[var(--muted)]" data-hud>
            Сторис спрятаны, пока облачность плотная. Цель всё равно можно выбрать и искать на карте.
          </p>
        </article>
      ) : (
        <>
          <div className="stories mt-4" aria-label="На этой неделе">
            {WEEK_ITEMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="story"
                onClick={() => openStory(index)}
              >
                <span className="story-ring" data-seen={seenStories.includes(item.id) ? "true" : "false"}>
                  <span className="story-face">
                    <ObjectDisc kind={item.kind} size={58} spin={item.kind !== "meteor" && item.kind !== "dragon"} />
                  </span>
                </span>
                <span className="story-copy">
                  <span className="story-name" data-hud>{item.story}</span>
                  <span className="story-time" data-hud>{now ? formatStoryWhen(eventAt(item, now), now) : ""}</span>
                </span>
              </button>
            ))}
          </div>
          {feature && !featureQuiet ? (
            <article className="hero-night hero-sky hud-focus mt-6">
              <p className="footnote text-[var(--good)]" data-hud>Сейчас стоит посмотреть вверх</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <h1 className="title-2" data-hud>{feature.title}</h1>
                  <p className="subhead mt-1" data-hud>{feature.look}</p>
                </div>
                <ObjectDisc kind={feature.kind} size={84} spin />
              </div>
              <p className="footnote mt-3 text-[var(--muted)]" data-hud>{feature.guide}</p>
              <div className="mt-3 grid grid-cols-2">
                <button type="button" className="btn-text" onClick={() => onSeenNews(feature)}>
                  Вижу
                </button>
                <button type="button" className="btn-text" onClick={() => onQuiet(feature.id)}>
                  Пропустить
                </button>
              </div>
              <button type="button" className="btn btn-line mt-2 w-full" onClick={() => onShowSky(feature.objectId, feature.azimuth)}>
                Куда смотреть
              </button>
              {seenToday > 0 ? <p className="caption mt-2 text-[var(--muted)]">Сегодня вы уже отметили {seenToday}</p> : null}
            </article>
          ) : (
            <article className="hero-night hud-focus mt-6">
              <p className="footnote text-[var(--good)]" data-hud>Сейчас стоит посмотреть вверх</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <h1 className="title-2" data-hud>Сегодня как обычно Луна</h1>
                  <p className="subhead mt-1" data-hud>
                    {moon?.phaseName ? `${moon.phaseName}${moon.illumination != null ? `, ${Math.round(moon.illumination * 100)}%` : ""}` : "Крупный светлый диск"}
                  </p>
                </div>
                <ObjectDisc kind="moon" size={92} spin />
              </div>
              <p className="footnote mt-3 text-[var(--muted)]" data-hud>
                {moon?.isAboveHorizon ? "Диск уже над горизонтом." : "Диск появится позже."} Новости недели остаются в сторис.
              </p>
              <button type="button" className="btn btn-line mt-4 w-full" onClick={() => onShowSky("moon", moon?.azimuth ?? 0)}>
                Куда смотреть
              </button>
            </article>
          )}
        </>
      )}

      <button type="button" className="btn btn-line mt-4 w-full" onClick={() => setHuntOpen(true)}>
        Найти на карте
      </button>

      {playing && storyIndex != null
        ? createPortal(
            <div className="story-player" role="dialog" aria-label={playing.story}>
          <div className="story-bars" aria-hidden>
            {WEEK_ITEMS.map((item, index) => (
              <span key={item.id}>
                <span
                  style={{
                    width: index < storyIndex ? "100%" : index === storyIndex ? `${storyProgress * 100}%` : "0%",
                  }}
                />
              </span>
            ))}
          </div>
          <button type="button" className="story-close" aria-label="Закрыть" onClick={() => setStoryIndex(null)}>
            <X size={22} strokeWidth={1.7} />
          </button>
          <div className="story-stage">
            <ObjectDisc kind={playing.kind} size={168} spin />
            <h2 className="title-2 mt-6">{playing.story}</h2>
            <p className="footnote mt-1 text-[var(--muted)]">{now ? formatStoryWhen(eventAt(playing, now), now) : ""}</p>
            <p className="body mt-4">{playing.look}</p>
            <p className="subhead mt-2 text-[var(--muted)]">{playing.guide}</p>
            <button
              type="button"
              className="btn btn-line mt-6 w-full"
              onClick={() => {
                setStoryIndex(null);
                onShowSky(playing.objectId, playing.azimuth);
              }}
            >
              Куда смотреть
            </button>
          </div>
        </div>,
            document.body,
          )
        : null}

      <Sheet open={huntOpen} title="Найти на карте" onClose={() => setHuntOpen(false)}>
        {now ? (
          <StudyList
            latitude={latitude}
            longitude={longitude}
            now={now}
            onPick={(id, azimuth) => {
              setHuntOpen(false);
              onShowSky(id, azimuth);
            }}
          />
        ) : (
          <p className="footnote text-[var(--muted)]">Считаем небо для этого города…</p>
        )}
      </Sheet>
    </HudReveal>
  );
}
