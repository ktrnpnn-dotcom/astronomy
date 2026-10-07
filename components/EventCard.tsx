"use client";

import { chanceLabel, type SkyEvent } from "@/data/mockEvents";

export function EventCard({ event, onOpen }: { event: SkyEvent; onOpen: () => void }) {
  return (
    <button type="button" className="card text-left" onClick={onOpen}>
      <div className="flex items-center justify-between gap-3">
        <span className="footnote text-[var(--muted)]">{event.kicker}</span>
        <span className="dot" data-traffic={event.traffic} aria-hidden />
      </div>
      <h3 className="title-2 mt-1">{event.title}</h3>
      <p className="subhead mt-1 text-[var(--muted)]">
        {event.windowLabel} · {event.direction}
      </p>
      <p className="body mt-2">{event.benefit}</p>
      <dl className="footnote mt-3 grid grid-cols-3 gap-2 text-[var(--muted)]">
        <div>
          <dt>Шанс</dt>
          <dd className="subhead text-[var(--ink)]">{chanceLabel(event.chance)}</dd>
        </div>
        <div>
          <dt>Сложность</dt>
          <dd className="subhead text-[var(--ink)]">{event.difficulty}</dd>
        </div>
        <div>
          <dt>Чем смотреть</dt>
          <dd className="subhead text-[var(--ink)]">{event.equipment}</dd>
        </div>
      </dl>
    </button>
  );
}
