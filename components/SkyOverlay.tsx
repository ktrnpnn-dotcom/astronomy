"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_ISS_TRACK } from "@/data/demoSky";
import { directionPhrase } from "@/lib/angles";
import { tickLock } from "@/lib/haptics";
import { edgePoint, projectBody } from "@/lib/projection";
import type { ConstellationView, SkyObject } from "@/types/sky";

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
            width: moon ? 22 : venus ? 8 : 5,
            height: moon ? 22 : venus ? 8 : 5,
            background: "var(--sky-ink, #f2f2f7)",
            boxShadow: moon || venus ? "0 0 10px rgba(242,242,247,0.85)" : undefined,
          }}
        />
        <span>
          <span className="sky-label">{object.name}</span>
          {moon && object.phaseName ? (
            <span className="caption block opacity-80">
              {object.phaseName}
              {object.illumination != null ? ` · ${Math.round(object.illumination * 100)}%` : ""}
            </span>
          ) : null}
          {object.isDemo ? <span className="caption block opacity-80">демо</span> : null}
        </span>
      </span>
    </button>
  );
}

function HuntReticle({ locked }: { locked: boolean }) {
  return (
    <div className="hunt-reticle" data-lock={locked} aria-hidden>
      <span className="hunt-arm hunt-tl" />
      <span className="hunt-arm hunt-tr" />
      <span className="hunt-arm hunt-bl" />
      <span className="hunt-arm hunt-br" />
      <span className="hunt-dot" />
    </div>
  );
}

export function SkyOverlay({
  objects,
  heading,
  viewAltitude,
  constellationView,
  figures,
  showIssTrack,
  guidedId,
  hunt,
  onSelect,
}: {
  objects: SkyObject[];
  heading: number;
  viewAltitude: number;
  constellationView: ConstellationView;
  figures: { id: string; name: string; stars: { azimuth: number; altitude: number }[]; lines: [number, number][] }[];
  guideAzimuth: number | null;
  showIssTrack: boolean;
  guidedId: string | null;
  hunt: { id: string; azimuth: number; altitude: number } | null;
  onSelect: (id: string) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const wasLocked = useRef(false);
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
  const hunting = hunt != null;
  const visible = objects.filter((object) => {
    if (object.id === "sun") return false;
    if (hunting) return object.id === hunt.id;
    return true;
  });
  const drawnFigures = hunting ? figures.filter((figure) => figure.id === hunt.id) : figures;
  const huntMark =
    hunting && size.width
      ? projectBody(hunt.azimuth, hunt.altitude, heading, viewAltitude, size.width, size.height)
      : null;
  const locked = Boolean(huntMark && huntMark.inView && huntMark.degreesAway < 9);
  useEffect(() => {
    if (locked && !wasLocked.current) tickLock();
    wasLocked.current = locked;
  }, [locked]);
  const huntChip = hunting && visible.some((object) => object.id === hunt.id);
  const huntEdge =
    hunting && huntMark && !huntMark.inView && !huntChip
      ? edgePoint(huntMark.dx, huntMark.dy, size.width, size.height, 56)
      : null;
  const placed: { left: number; top: number }[] = [];

  return (
    <div ref={frameRef} className="relative h-full w-full" data-through={viewAltitude < -8 ? "on" : "off"}>
      {hunting ? null : (
        <div
          className="milky"
          style={{ transform: `translateX(${-(((heading % 360) / 360) * 28)}%) rotate(-16deg)` }}
          aria-hidden
        />
      )}
      {horizon && horizon.y > -80 && horizon.y < size.height + 80 ? (
        <>
          <div className="horizon-ground" style={{ top: Math.max(-8, horizon.y) }} aria-hidden>
            <span>{viewAltitude < -8 ? "за землёй" : "земля"}</span>
          </div>
          <div className="horizon-line" style={{ top: horizon.y }} aria-hidden />
        </>
      ) : null}
      {size.width && drawnFigures.length
        ? drawnFigures.map((figure) => {
            const projected = figure.stars.map((star) =>
              projectBody(star.azimuth, star.altitude, heading, viewAltitude, size.width, size.height),
            );
            const showLines = constellationView === "lines" || constellationView === "figures" || constellationView === "full";
            const showDots = constellationView === "stars" || constellationView === "full" || constellationView === "lines";
            const labeled = projected.filter((point) => point.inView);
            const label = labeled.length
              ? {
                  x: labeled.reduce((sum, point) => sum + point.x, 0) / labeled.length,
                  y: labeled.reduce((sum, point) => sum + point.y, 0) / labeled.length,
                }
              : null;
            const under = figure.stars.every((star) => star.altitude < 0);
            return (
              <div
                key={figure.id}
                className="pointer-events-none absolute inset-0 text-[var(--sky-ink)]"
                style={{ opacity: under ? 0.55 : 1 }}
              >
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {showLines
                  ? figure.lines.map(([from, to]) => {
                      const a = projected[from];
                      const b = projected[to];
                      if (!a || !b) return null;
                      if (Math.abs(a.dx - b.dx) > 70 || Math.abs(a.dy - b.dy) > 50) return null;
                      if (a.degreesAway > 80 && b.degreesAway > 80) return null;
                      return (
                        <line
                          key={`${from}-${to}`}
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="currentColor"
                          strokeWidth="0.8"
                        />
                      );
                    })
                  : null}
                {showDots
                  ? projected.map((point, index) =>
                      point.degreesAway > 70 ? null : (
                        <circle key={index} cx={point.x} cy={point.y} r={1.15} fill="currentColor" />
                      ),
                    )
                  : null}
              </svg>
              {label ? (
                <button
                  type="button"
                  className="sky-label pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: label.x, top: label.y + 14 }}
                  onClick={() => onSelect(figure.id)}
                >
                  {figure.name}
                </button>
              ) : null}
              </div>
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
              return (
                <div key={object.id} style={{ opacity: object.isAboveHorizon ? 1 : 0.58 }}>
                  <Label object={object} x={projected.x} y={projected.y} onSelect={onSelect} />
                </div>
              );
            }
            const edge = edgePoint(projected.dx, projected.dy, size.width, size.height, 48);
            const chipWidth = object.isDemo ? 148 : 108;
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
                className={`sky-label absolute flex min-h-11 items-center gap-1 bg-transparent ${object.id === guidedId ? "underline decoration-white/70 underline-offset-4" : ""}`}
                style={{ left, top }}
                onClick={() => onSelect(object.id)}
                aria-label={`${object.name}, ${Math.round(projected.degreesAway)} градусов вне кадра`}
              >
                <svg className={object.id === guidedId ? "find-arrow" : "find-arrow find-arrow-quiet"} style={{ transform: `rotate(${edge.angle}deg)` }} viewBox="0 0 28 28" aria-hidden>
                  <path d="M4 14h16M14 7l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                {object.name}
              </button>
            );
          })
        : null}
      {huntEdge && hunt ? (
        <div className="sky-guide" style={{ left: huntEdge.x, top: huntEdge.y }} aria-hidden>
          <svg className="find-arrow find-arrow-hunt" style={{ transform: `rotate(${huntEdge.angle}deg)` }} viewBox="0 0 28 28">
            <path d="M4 14h16M14 7l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <span className="sky-guide-az">{directionPhrase(hunt.azimuth).on}</span>
        </div>
      ) : null}
      {hunting ? <HuntReticle locked={locked} /> : null}
    </div>
  );
}
