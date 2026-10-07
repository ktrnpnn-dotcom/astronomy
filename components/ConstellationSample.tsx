import { BearFigure } from "@/components/BearFigure";
import { URSA_LINE, URSA_STARS } from "@/data/ursa";
import type { ConstellationView } from "@/types/sky";

const FIELD = [
  [18, 18],
  [48, 14],
  [78, 22],
  [132, 16],
  [24, 48],
  [160, 58],
  [70, 108],
  [150, 96],
];

export function ConstellationSample({ view }: { view: ConstellationView }) {
  const lines = view === "lines" || view === "full";
  const dots = view !== "figures";
  const figure = view === "figures" || view === "full";
  const points = URSA_LINE.map((index) => URSA_STARS[index].join(",")).join(" ");
  return (
    <svg className="constellation-sample" viewBox="0 0 196 136" aria-hidden>
      <rect width="196" height="136" rx="8" fill="#07080c" />
      <path d="M0 112h196v24H0z" fill="rgba(0,0,0,0.45)" />
      <path d="M0 112h196" stroke="rgba(242,242,247,0.35)" strokeWidth="0.6" />
      {FIELD.map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="0.8" fill="rgba(242,242,247,0.35)" />
      ))}
      {figure ? <BearFigure /> : null}
      {lines ? <polyline points={points} fill="none" stroke="rgba(242,242,247,0.72)" strokeWidth="0.9" /> : null}
      {dots
        ? URSA_STARS.map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r={index === 0 || index === 6 ? 2.3 : 1.5} fill="#f4f4f2" />
          ))
        : null}
    </svg>
  );
}
