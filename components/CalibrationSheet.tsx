"use client";

import { Sheet } from "@/components/Sheet";
import type { AccuracyStatus } from "@/types/sky";

const STATUS: Record<AccuracyStatus, string> = {
  calibrated: "Компас подключён",
  "figure-eight": "Поверните телефон восьмёркой",
  demo: "Демо-режим",
  refining: "Уточняем направление",
  manual: "Компас не подключён",
};

export function CalibrationSheet({
  open,
  status,
  denied,
  onClose,
  onRequest,
  onManual,
}: {
  open: boolean;
  status: AccuracyStatus;
  denied: boolean;
  onClose: () => void;
  onRequest: () => void;
  onManual: () => void;
}) {
  return (
    <Sheet open={open} title="Калибровка" onClose={onClose}>
      <h2 className="title-2">Калибровка</h2>
      <p className="body mt-3">Поверните телефон восьмёркой в воздухе.</p>
      <p className="subhead mt-2 text-[var(--muted)]">
        Даже после этого направление зависит от чехла, металла рядом и самих датчиков. Это ориентир, не астрономический прибор.
      </p>
      <p className="chip mt-4" role="status">
        {denied ? "Компас не подключён. Покажем направление на схеме горизонта." : STATUS[status]}
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <button type="button" className="btn btn-primary" onClick={onRequest}>
          Разрешить движение
        </button>
        <button type="button" className="btn btn-secondary" onClick={onManual}>
          Ручное направление
        </button>
      </div>
    </Sheet>
  );
}
