"use client";

import { useEffect, useRef, useState } from "react";
import { BearFigure } from "@/components/BearFigure";
import { DEMO_CONSTELLATIONS } from "@/data/constellations";
import { DEMO_ISS_TRACK } from "@/data/demoSky";
import { URSA_STARS } from "@/data/ursa";
import { edgePoint, projectBody } from "@/lib/projection";
import type { ConstellationView, SkyObject } from "@/types/sky";

function bearTransform(projected: { x: number; y: number }[]) {
  const minLX = Math.min(...URSA_STARS.map((star) => star[0]));
  const maxLX = Math.max(...URSA_STARS.map((star) => star[0]));
  const minLY = Math.min(...URSA_STARS.map((star) => star[1]));
  const maxLY = Math.max(...URSA_STARS.map((star) => star[1]));
  const minPX = Math.min(...projected.map((star) => star.x));
  const maxPX = Math.max(...projected.map((star) => star.x));
  const minPY = Math.min(...projected.map((star) => star.y));
  const maxPY = Math.max(...projected.map((star) => star.y));
  const sx = (maxPX - minPX) / (maxLX - minLX || 1);
  const sy = (maxPY - minPY) / (maxLY - minLY || 1);
  return `translate(${minPX} ${minPY}) scale(${sx} ${sy}) translate(${-minLX} ${-minLY})`;
}

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

export function SkyOverlay({
  objects,
  heading,
  viewAltitude,
  constellationView,
  guideAzimuth,
  showIssTrack,
  guidedId,
  onSelect,
}: {
  objects: SkyObject[];
  heading: number;
  viewAltitude: number;
  constellationView: ConstellationView;
  guideAzimuth: number | null;
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
      <div
        className="milky"
        style={{ transform: `translateX(${-(((heading % 360) / 360) * 28)}%) rotate(-16deg)` }}
        aria-hidden
      />
      {horizon && horizon.y > -20 && horizon.y < size.height + 20 ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/50" style={{ top: horizon.y }} aria-hidden />
          <div className="pointer-events-none absolute right-0 left-0 h-px bg-white/45" style={{ top: horizon.y }} aria-hidden />
        </>
      ) : null}
      {(constellationView === "lines" || constellationView === "stars" || constellationView === "full" || constellationView === "figures") && size.width
        ? DEMO_CONSTELLATIONS.map((figure) => {
            const projected = figure.stars.map((star) => projectBody(star.azimuth, star.altitude, heading, viewAltitude, size.width, size.height));
            const order = figure.line ?? projected.map((_, index) => index);
            const points = order.map((index) => `${projected[index].x},${projected[index].y}`).join(" ");
            const lines = constellationView === "lines" || constellationView === "full";
            const dots = constellationView === "stars" || constellationView === "lines" || constellationView === "full";
            const figureOn = constellationView === "figures" || constellationView === "full";
            const bear =
              figure.id === "ursa" && projected.length === URSA_STARS.length
                ? bearTransform(projected)
                : null;
            return (
              <svg key={figure.id} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                {figureOn && bear ? (
                  <g transform={bear}>
                    <BearFigure />
                  </g>
                ) : null}
                {lines ? <polyline points={points} fill="none" stroke="rgba(242,242,247,0.55)" strokeWidth="1" /> : null}
                {dots
                  ? projected.map((point, index) => (
                      <circle key={index} cx={point.x} cy={point.y} r={index === 0 ? 2.4 : 1.5} fill="rgba(242,242,247,0.9)" />
                    ))
                  : null}
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
      {guideAzimuth != null && size.width
        ? (() => {
            const projected = projectBody(guideAzimuth, 22, heading, viewAltitude, size.width, size.height);
            if (projected.inView) return null;
            const edge = edgePoint(projected.dx, projected.dy, size.width, size.height, 56);
            return (
              <div className="find-mark" style={{ left: edge.x, top: edge.y }} aria-hidden>
                <svg className="find-arrow" style={{ transform: `rotate(${edge.angle}deg)` }} viewBox="0 0 28 28">
                  <path d="M4 14h16M14 7l8 7-8 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
            );
          })()
        : null}
    </div>
  );
}
