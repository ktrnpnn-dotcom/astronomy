"use client";

import { Navigation } from "lucide-react";

export function DirectionGuide({ title, text }: { title: string; text: string }) {
  return (
    <div className="pointer-events-none mx-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-3 py-2">
      <p className="flex items-center gap-2 text-sm">
        <Navigation size={16} aria-hidden />
        {title}
      </p>
      <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{text}</p>
    </div>
  );
}
