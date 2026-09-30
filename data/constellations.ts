/**
 * Decorative line figures in azimuth/altitude space.
 * These are not catalog stars and must not be read as an identification of a constellation.
 */
export interface DemoFigure {
  id: string;
  stars: { azimuth: number; altitude: number }[];
}

export const DEMO_CONSTELLATIONS: DemoFigure[] = [
  {
    id: "west-figure",
    stars: [
      { azimuth: 248, altitude: 22 },
      { azimuth: 258, altitude: 31 },
      { azimuth: 270, altitude: 27 },
      { azimuth: 276, altitude: 18 },
    ],
  },
  {
    id: "south-figure",
    stars: [
      { azimuth: 168, altitude: 28 },
      { azimuth: 180, altitude: 36 },
      { azimuth: 192, altitude: 30 },
      { azimuth: 184, altitude: 20 },
    ],
  },
];
