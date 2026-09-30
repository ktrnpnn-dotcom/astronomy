"use client";

import { chanceLabel, type SkyEvent } from "@/data/mockEvents";

export function EventCard({ event, onOpen }: { event: SkyEvent; onOpen: () => void }) {
  return (
    <button type="button" className="card text-left" onClick={onOpen}>
      <div className="flex items-center justify-between gap-3">
        <span className="kicker">{event.kicker}</span>
        <span className="dot" data-traffic={event.traffic} aria-hidden />
      </div>
      <h3 className="font-title mt-2 text-[22px] leading-tight">{event.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {event.windowLabel} · {event.direction}
      </p>
      <p className="mt-3 text-sm leading-5">{event.benefit}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
        <div>
          <dt>Шанс</dt>
          <dd className="mt-0.5 text-sm text-[var(--ink)]">{chanceLabel(event.chance)}</dd>
        </div>
        <div>
          <dt>Сложность</dt>
          <dd className="mt-0.5 text-sm text-[var(--ink)]">{event.difficulty}</dd>
        </div>
        <div>
          <dt>Чем смотреть</dt>
          <dd className="mt-0.5 text-sm text-[var(--ink)]">{event.equipment}</dd>
        </div>
      </dl>
    </button>
  );
}
