import { URSA_LINE, URSA_SKY } from "@/data/ursa";

/**
 * Decorative line figure in azimuth/altitude space.
 * The bear is original artwork placed on a dipper, not a star catalog.
 */
export interface DemoFigure {
  id: string;
  stars: { azimuth: number; altitude: number }[];
  line?: number[];
}

export const DEMO_CONSTELLATIONS: DemoFigure[] = [
  {
    id: "ursa",
    stars: URSA_SKY,
    line: URSA_LINE,
  },
];
