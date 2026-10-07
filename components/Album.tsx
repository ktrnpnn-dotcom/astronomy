"use client";

import { Lock } from "lucide-react";
import { ObjectDisc } from "@/components/ObjectDisc";
import { formatDay } from "@/lib/format";
import type { Observation } from "@/types/sky";
import type { DiscKind } from "@/data/weekSky";

const SHEETS: { id: string; title: string; hint: string; kind: DiscKind }[] = [
  { id: "moon", title: "Луна", hint: "Крупный диск. Отметьте «Вижу», и лист откроется.", kind: "moon" },
  { id: "venus", title: "Венера", hint: "Самая яркая точка после заката.", kind: "venus" },
  { id: "saturn", title: "Сатурн", hint: "Ровная желтоватая точка.", kind: "saturn" },
  { id: "jupiter", title: "Юпитер", hint: "Яркая точка, которая не мигает.", kind: "jupiter" },
  { id: "orionids", title: "Ориониды", hint: "Быстрые следы после полуночи.", kind: "meteor" },
];

function kindFor(id: string): DiscKind {
  return SHEETS.find((item) => item.id === id)?.kind ?? "moon";
}

export function Album({ observations }: { observations: Observation[] }) {
  const seen = observations.filter((item) => item.seen);
  const photos = seen.filter((item) => item.image);
  const extras = seen.filter((item) => !SHEETS.some((sheet) => sheet.id === item.objectId) && !item.image);

  async function shareAll() {
    const text = seen
      .map((item) => `${formatDay(new Date(item.at))} · ${item.name} · ${item.place}`)
      .join("\n");
    const payload = { title: "Небо сейчас", text: text || "В альбоме пока закрытые листы." };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard?.writeText(payload.text);
  }

  return (
    <div className="screen">
      <div className="flex items-end justify-between gap-3">
        <h1 className="large-title">Альбом</h1>
        <button type="button" className="btn-text" onClick={() => void shareAll()}>
          Поделиться
        </button>
      </div>
      <p className="subhead mt-2 text-[var(--muted)]">Закрытые листы ждут первую отметку. Открытые можно покрутить.</p>
      {photos.length ? (
        <div className="album-grid mt-6">
          {photos.map((item) => (
            <figure key={item.id} className="album-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} />
              <figcaption className="caption">{item.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      <div className="mt-6 flex flex-col gap-2 pb-6">
        {SHEETS.map((sheet) => {
          const record = seen.find((item) => item.objectId === sheet.id);
          return (
            <article key={sheet.id} className={record ? "card sky-card" : "card sky-card album-sealed"}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="footnote text-[var(--muted)]">{record ? formatDay(new Date(record.at)) : "закрыто"}</p>
                  <h2 className="title-2 mt-1">{sheet.title}</h2>
                  <p className="subhead mt-2">{record ? record.note : sheet.hint}</p>
                  {record ? <p className="footnote mt-2 text-[var(--muted)]">{record.place}</p> : null}
                </div>
                <div className="album-body">
                  <div className={record ? undefined : "album-body-locked"}>
                    <ObjectDisc kind={sheet.kind} size={92} spin={Boolean(record)} />
                  </div>
                  {record ? null : <Lock size={16} className="album-lock" aria-label="Закрыто" />}
                </div>
              </div>
            </article>
          );
        })}
        {extras.map((item) => (
          <article key={item.id} className="card sky-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="footnote text-[var(--muted)]">{formatDay(new Date(item.at))}</p>
                <h2 className="title-2 mt-1">{item.name}</h2>
                <p className="subhead mt-2">{item.note}</p>
                <p className="footnote mt-2 text-[var(--muted)]">{item.place}</p>
              </div>
              <ObjectDisc kind={kindFor(item.objectId)} size={92} spin />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
