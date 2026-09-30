"use client";

import { BookOpen, Compass, SunMedium, UserRound } from "lucide-react";

export type TabId = "today" | "map" | "album" | "profile";

const ITEMS: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: "today", label: "Сегодня", icon: SunMedium },
  { id: "map", label: "Карта", icon: Compass },
  { id: "album", label: "Альбом", icon: BookOpen },
  { id: "profile", label: "Профиль", icon: UserRound },
];

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav className="nav" aria-label="Разделы">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            data-active={active}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon size={20} strokeWidth={1.7} aria-hidden />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
