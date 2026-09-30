"use client";

import { TIMELINE_EVENTS, trafficLabel, type Traffic } from "@/data/mockEvents";
import { formatClock } from "@/lib/format";
import type { EveningMarks } from "@/lib/astronomy";

const START = 17 * 60;
const END = 24 * 60;

function left(minute: number): string {
  const ratio = (minute - START) / (END - START);
  return `${Math.min(96, Math.max(2, ratio * 100))}%`;
}

function minuteOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function SkyTimeline({
  marks,
  cloudy,
  onSelect,
}: {
  marks: EveningMarks | null;
  cloudy: boolean;
  onSelect: (id: string) => void;
}) {
  const lights: { traffic: Traffic; label: string }[] = [
    { traffic: "green", label: "стоит выйти" },
    { traffic: "yellow", label: "можно попробовать" },
    { traffic: "gray", label: "плохие условия" },
    { traffic: "purple", label: "редкое событие" },
  ];

  return (
    <section className="mt-6" aria-label="Окна неба">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-title text-[26px]">Окна неба</h2>
        <p className="text-xs text-[var(--muted)]">этот вечер</p>
      </div>
      <div className="card">
        <div className="flex flex-wrap gap-x-3 gap-y-2" aria-label="Светофор неба">
          {lights.map((item) => (
            <span key={item.traffic} className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="dot" data-traffic={item.traffic} aria-hidden />
              {item.label}
            </span>
          ))}
        </div>
        <div className="relative mt-4 h-28">
          {TIMELINE_EVENTS.map((event) => (
            <button
              key={event.id}
              type="button"
              className="absolute top-0 z-10 -translate-x-1/2 rounded-full border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1 text-xs"
              style={{ left: left(event.startMinute) }}
              onClick={() => onSelect(event.id)}
            >
              <span className="dot mr-1 inline-block align-middle" data-traffic={cloudy ? "gray" : event.traffic} />
              {event.title.split(" ")[0]}
            </button>
          ))}
          <div
            className="absolute right-0 bottom-7 left-0 h-8 overflow-hidden rounded-full"
            style={{
              background:
                "linear-gradient(90deg, rgba(196,146,92,0.45), rgba(40,58,92,0.55) 28%, rgba(16,24,40,0.85))",
            }}
            aria-hidden
          >
            <div
              className="absolute inset-y-0 opacity-70"
              style={{
                left: cloudy ? "8%" : "38%",
                width: cloudy ? "78%" : "18%",
                background: "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.18) 4px, rgba(255,255,255,0.18) 8px)",
              }}
            />
            {marks?.sunset ? (
              <span className="absolute bottom-1 text-[10px] text-white" style={{ left: left(minuteOf(marks.sunset)) }}>
                закат
              </span>
            ) : null}
          </div>
          <div className="absolute right-0 bottom-0 left-0 flex justify-between text-[11px] text-[var(--muted)]">
            <span>17:00</span>
            <span>19:00</span>
            <span>21:00</span>
            <span>23:00</span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          {cloudy
            ? "Сейчас включён учебный пример плотной облачности."
            : "Короткая полоса облачности — пример, не прогноз."}{" "}
          {marks?.sunset ? `Закат сегодня около ${formatClock(marks.sunset)}.` : "Закат считаем для выбранного города."}{" "}
          {marks?.civilDusk ? `Сумерки густеют к ${formatClock(marks.civilDusk)}.` : null} Окна Венеры, Луны и МКС на ленте — учебные.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">Сейчас светофор: {trafficLabel(cloudy ? "gray" : "green")}.</p>
      </div>
    </section>
  );
}
