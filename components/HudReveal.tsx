"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function HudReveal({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const cursor = cursorRef.current;
    if (!root || !cursor) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-hud]")];
    if (reduced || nodes.length === 0) {
      cursor.hidden = true;
      nodes.forEach((node) => node.setAttribute("data-ready", "true"));
      return;
    }
    const ordered = [...nodes].sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
    );
    ordered.forEach((node) => node.removeAttribute("data-ready"));
    let step = 0;
    let timer = 0;
    const tick = () => {
      const node = ordered[step];
      if (!node) {
        cursor.hidden = true;
        return;
      }
      const box = node.getBoundingClientRect();
      const frame = root.getBoundingClientRect();
      cursor.hidden = false;
      cursor.style.left = `${Math.max(0, box.left - frame.left)}px`;
      cursor.style.top = `${Math.max(0, box.top - frame.top)}px`;
      cursor.style.height = `${Math.max(14, box.height)}px`;
      node.setAttribute("data-ready", "true");
      step += 1;
      timer = window.setTimeout(tick, step === 1 ? 90 : 70);
    };
    timer = window.setTimeout(tick, 40);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={rootRef} className={`hud-reveal ${className ?? ""}`}>
      {children}
      <span ref={cursorRef} className="hud-cursor" hidden aria-hidden />
    </div>
  );
}
