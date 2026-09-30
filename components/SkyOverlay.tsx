"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_CONSTELLATIONS } from "@/data/constellations";
import { DEMO_ISS_TRACK } from "@/data/demoSky";
import { edgePoint, projectBody } from "@/lib/projection";
import type { SkyObject } from "@/types/sky";

function Label({
  object,
  x,
  y,
  onSelect,
}: {
  object: SkyObject;
  x: number;
  y: number;
  onSelect: (id: string) => void;
}) {
  const moon = object.id === "moon";
  const venus = object.id === "venus";
  return (
    <button
      type="button"
      className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
      style={{ left: x, top: y }}
      onClick={() => onSelect(object.id)}
      aria-label={object.name}
    >
      <span className="flex items-center gap-2">
        <span
          className="block rounded-full"
          style={{
            width: moon ? 34 : venus ? 12 : 8,
            height: moon ? 34 : venus ? 12 : 8,
            background: "var(--sky-ink, #e8eef6)",
            boxShadow: venus ? "0 0 16px var(--sky-ink, #e8eef6)" : undefined,
          }}
        />
        <span>
          <span className="block text-sm text-[var(--sky-ink,#e8eef6)]">{object.name}</span>
          {moon && object.phaseName ? (
            <span className="block text-[11px] opacity-80">
              {object.phaseName}
              {object.illumination != null ? ` · ${Math.round(object.illumination * 100)}%` : ""}
            </span>
          ) : null}
          {object.isDemo ? <span className="block text-[11px] opacity-80">демо</span> : null}
        </span>
      </span>
    </button>
  );
}

export function SkyOverlay({
  objects,
  heading,
  viewAltitude,
  showConstellations,
  showIssTrack,
  guidedId,
  onSelect,
}: {
  objects: SkyObject[];
  heading: number;
  viewAltitude: number;
  showConstellations: boolean;
  showIssTrack: boolean;
  guidedId: string | null;
  onSelect: (id: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const horizon = size.width
    ? projectBody(heading, 0, heading, viewAltitude, size.width, size.height)
    : null;
  const visible = objects.filter((object) => object.isAboveHorizon && object.id !== "sun");
  const placed: { left: number; top: number }[] = [];

  return (
    <div ref={frameRef} className="relative h-full w-full">
      {horizon && horizon.y > -20 && horizon.y < size.height + 20 ? (
        <div
          className="pointer-events-none absolute right-6 left-6 h-px bg-white/35"
          style={{ top: horizon.y }}
          aria-hidden
        />
      ) : null}
      {showConstellations && size.width
        ? DEMO_CONSTELLATIONS.map((figure) => {
            const points = figure.stars
              .map((star) => projectBody(star.azimuth, star.altitude, heading, viewAltitude, size.width, size.height))
              .map((point) => `${point.x},${point.y}`)
              .join(" ");
            return (
              <svg key={figure.id} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                <polyline points={points} fill="none" stroke="rgba(232,238,246,0.35)" strokeWidth="1" />
              </svg>
            );
          })
        : null}
      {showIssTrack && size.width ? (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <polyline
            points={DEMO_ISS_TRACK.map((point) => {
              const projected = projectBody(point.azimuth, point.altitude, heading, viewAltitude, size.width, size.height);
              return `${projected.x},${projected.y}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(179,166,224,0.8)"
            strokeDasharray="4 6"
            strokeWidth="1.5"
          />
        </svg>
      ) : null}
      {size.width
        ? visible.map((object) => {
            const projected = projectBody(object.azimuth, object.altitude, heading, viewAltitude, size.width, size.height);
            if (projected.inView) {
              return <Label key={object.id} object={object} x={projected.x} y={projected.y} onSelect={onSelect} />;
            }
            const edge = edgePoint(projected.dx, projected.dy, size.width, size.height, 48);
            const chipWidth = object.isDemo ? 168 : 132;
            const left = Math.min(size.width - chipWidth - 8, Math.max(8, edge.x - chipWidth / 2));
            let top = Math.min(size.height - 40, Math.max(8, edge.y - 16));
            let guard = 0;
            while (
              guard < 6 &&
              placed.some((item) => Math.abs(item.top - top) < 34 && Math.abs(item.left - left) < chipWidth)
            ) {
              const next = top + 36;
              if (next > size.height - 40) break;
              top = next;
              guard += 1;
            }
            placed.push({ left, top });
            return (
              <button
                key={object.id}
                type="button"
                className={`absolute flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-xs text-[var(--sky-ink,#e8eef6)] ${object.id === guidedId ? "ring-1 ring-white/70" : ""}`}
                style={{ left, top }}
                onClick={() => onSelect(object.id)}
                aria-label={`${object.name}, ${Math.round(projected.degreesAway)} градусов вне кадра`}
              >
                <span style={{ transform: `rotate(${edge.angle}deg)` }} aria-hidden>
                  →
                </span>
                {object.name}
                {object.isDemo ? " · демо" : ""} · {Math.round(projected.degreesAway)}°
              </button>
            );
          })
        : null}
      {showConstellations ? (
        <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] opacity-75">слой созвездий · демо</p>
      ) : null}
    </div>
  );
}
