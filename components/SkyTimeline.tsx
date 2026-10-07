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
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="title-2">Окна неба</h2>
        <p className="footnote text-[var(--muted)]">этот вечер</p>
      </div>
      <div className="card">
        <div className="flex flex-wrap gap-x-3 gap-y-2" aria-label="Светофор неба">
          {lights.map((item) => (
            <span key={item.traffic} className="footnote inline-flex items-center gap-1.5 text-[var(--muted)]">
              <span className="dot" data-traffic={item.traffic} aria-hidden />
              {item.label}
            </span>
          ))}
        </div>
        <div className="relative mt-4 h-20">
          {TIMELINE_EVENTS.map((event, index) => (
            <button
              key={event.id}
              type="button"
              className="caption absolute z-10 flex min-h-6 -translate-x-1/2 items-center gap-1 bg-transparent"
              style={{ left: left(event.startMinute), top: index % 2 === 0 ? 0 : 16 }}
              onClick={() => onSelect(event.id)}
            >
              <span className="dot" data-traffic={cloudy ? "gray" : event.traffic} />
              {event.title.split(" ")[0]}
            </button>
          ))}
          <div className="absolute right-0 bottom-5 left-0 h-px bg-[var(--line)]" aria-hidden>
            <div
              className="absolute top-[-1px] h-[3px] bg-[var(--quiet)]"
              style={{ left: cloudy ? "8%" : "38%", width: cloudy ? "78%" : "18%" }}
            />
            {marks?.sunset ? (
              <span className="caption absolute -top-4 text-[var(--muted)]" style={{ left: left(minuteOf(marks.sunset)) }}>
                закат
              </span>
            ) : null}
          </div>
          <div className="caption nums absolute right-0 bottom-0 left-0 flex justify-between text-[var(--muted)]">
            <span>17:00</span>
            <span>19:00</span>
            <span>21:00</span>
            <span>23:00</span>
          </div>
        </div>
        <p className="footnote mt-3 text-[var(--muted)]">
          {cloudy
            ? "Сейчас включён учебный пример плотной облачности."
            : "Короткая полоса облачности — пример, не прогноз."}{" "}
          {marks?.sunset ? `Закат сегодня около ${formatClock(marks.sunset)}.` : "Закат считаем для выбранного города."}{" "}
          {marks?.civilDusk ? `Сумерки густеют к ${formatClock(marks.civilDusk)}.` : null} Окна Венеры, Луны и МКС на ленте — учебные.
        </p>
        <p className="footnote mt-2 text-[var(--muted)]">Сейчас светофор: {trafficLabel(cloudy ? "gray" : "green")}.</p>
      </div>
    </section>
  );
}
