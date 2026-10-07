"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { MISS_REASONS } from "@/data/mockEvents";

export function ObservationResultSheet({
  open,
  variant,
  objectName,
  seenName,
  dateLabel,
  info,
  alternative,
  onClose,
}: {
  open: boolean;
  variant: "seen" | "miss" | "info";
  objectName: string;
  seenName?: string;
  dateLabel: string;
  info?: string;
  alternative?: string;
  onClose: () => void;
}) {
  const [reasonId, setReasonId] = useState<string | null>(null);
  const reason = MISS_REASONS.find((item) => item.id === reasonId);

  return (
    <Sheet
      open={open}
      title={variant === "seen" ? "Наблюдение" : variant === "info" ? "Об объекте" : "Не вижу"}
      onClose={() => {
        setReasonId(null);
        onClose();
      }}
    >
      {variant === "seen" ? (
        <div>
          <h2 className="title-2">Вы увидели {seenName ?? objectName}</h2>
          <p className="body mt-2">Сегодня, {dateLabel}</p>
          <p className="footnote mt-2 text-[var(--muted)]">Добавлено в альбом</p>
        </div>
      ) : null}
      {variant === "info" ? (
        <div>
          <h2 className="title-2">{objectName}</h2>
          <p className="body mt-3">{info}</p>
        </div>
      ) : null}
      {variant === "miss" ? (
        <div>
          <h2 className="title-2">Не вижу</h2>
          <div className="mt-3 flex flex-col gap-2">
            {MISS_REASONS.map((item) => (
              <button key={item.id} type="button" className="btn btn-secondary justify-start" onClick={() => setReasonId(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          {reason ? (
            <div className="mt-4">
              <p className="body">{reason.text}</p>
              {alternative ? <p className="body mt-2">{alternative}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
