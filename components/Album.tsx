"use client";

import { seenObservations } from "@/lib/storage";
import { formatDay } from "@/lib/format";
import type { Observation } from "@/types/sky";

const SLOTS = [
  {
    id: "first",
    title: "Первое открытие",
    hint: "Любой объект, который вы отметите «Вижу».",
    match: (items: Observation[]) => items.find((item) => item.seen) ?? null,
  },
  {
    id: "moon",
    title: "Луна",
    hint: "Ближний и самый понятный объект.",
    match: (items: Observation[]) => items.find((item) => item.seen && item.objectId === "moon") ?? null,
  },
  {
    id: "venus",
    title: "Венера",
    hint: "Самая яркая точка после заката.",
    match: (items: Observation[]) => items.find((item) => item.seen && item.objectId === "venus") ?? null,
  },
  {
    id: "iss",
    title: "МКС",
    hint: "Короткая яркая точка, которая движется.",
    match: (items: Observation[]) => items.find((item) => item.seen && item.objectId === "iss") ?? null,
  },
];

export function Album({ observations }: { observations: Observation[] }) {
  const seen = seenObservations(observations);
  const next = SLOTS.find((slot) => !slot.match(seen));

  return (
    <div className="screen">
      <p className="kicker">Личные записи</p>
      <h1 className="font-title mt-2 text-[40px] leading-none">Альбом</h1>
      <p className="mt-3 text-sm leading-5 text-[var(--muted)]">
        Здесь только то, что вы сами отметили. Пустые листы — ещё не записанные наблюдения, не награды.
      </p>
      <div className="mt-5 flex flex-col gap-3 pb-6">
        {SLOTS.map((slot) => {
          const record = slot.match(seen);
          return (
            <article key={slot.id} className="card">
              <p className="kicker">{record ? formatDay(new Date(record.at)) : "записи пока нет"}</p>
              <h2 className="font-title mt-2 text-[28px]">{slot.title}</h2>
              {record ? (
                <>
                  <p className="mt-2 text-[15px] leading-6">{record.note}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{record.place}</p>
                </>
              ) : (
                <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{slot.hint}</p>
              )}
            </article>
          );
        })}
        {next ? (
          <p className="px-1 text-sm leading-5 text-[var(--muted)]">
            Следующее открытие: {next.title}. {next.hint}
          </p>
        ) : (
          <p className="px-1 text-sm leading-5 text-[var(--muted)]">
            В альбоме уже есть все четыре листа этой версии.
          </p>
        )}
      </div>
    </div>
  );
}
