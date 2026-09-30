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
          <h2 className="font-title text-[30px] leading-tight">Вы увидели {seenName ?? objectName}</h2>
          <p className="mt-2 text-[15px]">Сегодня, {dateLabel}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Добавлено в альбом</p>
        </div>
      ) : null}
      {variant === "info" ? (
        <div>
          <h2 className="font-title text-[30px]">{objectName}</h2>
          <p className="mt-3 text-[15px] leading-6">{info}</p>
        </div>
      ) : null}
      {variant === "miss" ? (
        <div>
          <h2 className="font-title text-[30px]">Не вижу</h2>
          <div className="mt-3 flex flex-col gap-2">
            {MISS_REASONS.map((item) => (
              <button key={item.id} type="button" className="btn btn-secondary justify-start" onClick={() => setReasonId(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          {reason ? (
            <div className="mt-4">
              <p className="text-[15px] leading-6">{reason.text}</p>
              {alternative ? <p className="mt-2 text-[15px] leading-6">{alternative}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}
