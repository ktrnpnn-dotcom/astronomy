"use client";

const TICKS = [0, 45, 90, 135, 180, 225, 270, 315];
const NAMES = ["С", "СВ", "В", "ЮВ", "Ю", "ЮЗ", "З", "СЗ"];

export function CompassScale({ heading }: { heading: number }) {
  const span = 140;
  return (
    <div className="relative h-8 overflow-hidden" aria-hidden>
      <div className="absolute top-0 left-1/2 h-2 w-px -translate-x-1/2 bg-current" />
      {TICKS.map((degree, index) => {
        const delta = ((degree - heading + 540) % 360) - 180;
        if (Math.abs(delta) > span / 2) return null;
        const x = 50 + (delta / span) * 100;
        return (
          <span
            key={degree}
            className="caption nums absolute top-2 -translate-x-1/2"
            style={{ left: `${x}%`, opacity: Math.abs(delta) < 12 ? 1 : 0.45 }}
          >
            {NAMES[index]}
          </span>
        );
      })}
    </div>
  );
}
