"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, MapPin, Settings } from "lucide-react";
import { EventCard } from "@/components/EventCard";
import { Sheet } from "@/components/Sheet";
import { SkyTimeline } from "@/components/SkyTimeline";
import {
  FEED_EVENTS,
  MISS_REASONS,
  PRIORITY_EVENT,
  chanceLabel,
  trafficLabel,
  type SkyEvent,
} from "@/data/mockEvents";
import { getEveningMarks } from "@/lib/astronomy";
import { greeting } from "@/lib/format";

export function TodayFeed({
  cityName,
  latitude,
  longitude,
  cloudy,
  reminded,
  onChangeCity,
  onOpenProfile,
  onShowSky,
  onRemind,
}: {
  cityName: string;
  latitude: number;
  longitude: number;
  cloudy: boolean;
  reminded: string[];
  onChangeCity: () => void;
  onOpenProfile: () => void;
  onShowSky: (objectId: string) => void;
  onRemind: (eventId: string) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [miss, setMiss] = useState(false);
  const [reasonId, setReasonId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const id = window.setInterval(update, 30000);
    return () => window.clearInterval(id);
  }, []);

  const marks = now ? getEveningMarks(now, latitude, longitude) : null;
  const events = useMemo(() => [PRIORITY_EVENT, ...FEED_EVENTS], []);
  const opened = events.find((event) => event.id === openId) ?? null;
  const reason = MISS_REASONS.find((item) => item.id === reasonId) ?? null;
  const heroTraffic = cloudy ? "gray" : PRIORITY_EVENT.traffic;

  function remind(event: SkyEvent) {
    onRemind(event.id);
    setToast("Сохранили напоминание в приложении. Системное уведомление веб-версия не отправит.");
  }

  return (
    <div className="screen">
      <header className="flex items-center justify-between">
        <button type="button" className="btn-quiet -ml-2 gap-1 px-2" onClick={onChangeCity} aria-label="Сменить локацию">
          <MapPin size={18} strokeWidth={1.7} aria-hidden />
          <span>{cityName}</span>
        </button>
        <button type="button" className="icon-btn" onClick={onOpenProfile} aria-label="Профиль и настройки">
          <Settings size={18} strokeWidth={1.7} aria-hidden />
        </button>
      </header>
      <p className="mt-4 text-sm text-[var(--muted)]">{now ? greeting(now) : "Здравствуйте"}</p>
      <h1 className="font-title text-[40px] leading-none">Сегодня в небе</h1>

      <article className="card mt-5">
        <div className="flex items-center gap-2">
          <span className="dot" data-traffic={heroTraffic} />
          <p className="text-sm">
            {cloudy ? "Сегодня лучше не планировать наблюдение" : "Сейчас стоит посмотреть вверх"}
          </p>
        </div>
        <h2 className="font-title mt-3 text-[32px] leading-tight">{PRIORITY_EVENT.title}</h2>
        <p className="mt-2 text-[15px]">
          {PRIORITY_EVENT.windowLabel}
          <span className="text-[var(--muted)]"> · {PRIORITY_EVENT.direction}</span>
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {PRIORITY_EVENT.equipment} · шанс {cloudy ? "низкий" : chanceLabel(PRIORITY_EVENT.chance)} · {trafficLabel(heroTraffic)}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" className="btn btn-primary" onClick={() => onShowSky(PRIORITY_EVENT.objectId)}>
            Показать, куда смотреть
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => remind(PRIORITY_EVENT)}>
            <Bell size={16} aria-hidden />
            {reminded.includes(PRIORITY_EVENT.id) ? "Напоминание сохранено" : "Напомнить"}
          </button>
        </div>
        <p className="mt-3 text-sm leading-5 text-[var(--muted)]">
          {cloudy
            ? "Сегодня плотная облачность. Попробуйте посмотреть на Луну или сохраните событие на завтра."
            : PRIORITY_EVENT.expectation}
        </p>
      </article>

      <SkyTimeline marks={marks} cloudy={cloudy} onSelect={(id) => { setReasonId(null); setMiss(false); setOpenId(id); }} />

      <section className="mt-6 flex flex-col gap-3 pb-4" aria-label="Лента событий">
        {FEED_EVENTS.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onOpen={() => {
              setReasonId(null);
              setMiss(false);
              setOpenId(event.id);
            }}
          />
        ))}
        <p className="px-1 text-xs leading-5 text-[var(--muted)]">
          Карточки — учебные примеры. На карте Луна, Солнце, Венера, Юпитер и Сатурн считаются по времени и координатам.
        </p>
      </section>

      <Sheet
        open={opened != null}
        title={opened?.title ?? "Событие"}
        onClose={() => {
          setOpenId(null);
          setMiss(false);
          setReasonId(null);
        }}
      >
        {opened ? (
          <div>
            <p className="kicker">{opened.kicker}</p>
            <h2 className="font-title mt-2 text-[30px] leading-tight">{opened.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {opened.windowLabel} · {opened.direction} · {opened.equipment}
            </p>
            <p className="mt-3 text-[15px] leading-6">{opened.detail}</p>
            <p className="mt-2 text-[15px] leading-6 text-[var(--muted)]">{opened.expectation}</p>
            {miss ? (
              <div className="mt-4">
                <p className="text-sm">Почему не получилось?</p>
                <div className="mt-2 flex flex-col gap-2">
                  {MISS_REASONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="btn btn-secondary justify-start"
                      onClick={() => setReasonId(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {reason ? (
                  <div className="mt-4">
                    <p className="text-[15px] leading-6">{reason.text}</p>
                    <p className="mt-2 text-[15px] leading-6">{opened.alternative}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-2">
                <button type="button" className="btn btn-primary" onClick={() => onShowSky(opened.objectId)}>
                  Показать, куда смотреть
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => remind(opened)}>
                  {reminded.includes(opened.id) ? "Напоминание сохранено" : "Напомнить"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setMiss(true)}>
                  Не вижу
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Sheet>
      {toast ? (
        <div className="toast" role="status">
          <p className="text-sm leading-5">{toast}</p>
          <button type="button" className="btn-quiet mt-1 px-0" onClick={() => setToast(null)}>
            Понятно
          </button>
        </div>
      ) : null}
    </div>
  );
}
