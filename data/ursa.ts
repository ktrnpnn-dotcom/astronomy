/** Local drawing space for the Great Bear preview and the map figure. */
export const URSA_STARS: [number, number][] = [
  [168, 24],
  [142, 40],
  [116, 54],
  [86, 62],
  [92, 94],
  [48, 100],
  [40, 64],
];

/** Alkaid → bowl → back to Megrez, so the handle and the cup both close. */
export const URSA_LINE = [0, 1, 2, 3, 4, 5, 6, 3];

const ORIGIN_X = 104;
const ORIGIN_Y = 62;
const DEG_AZ = 0.26;
const DEG_ALT = 0.1;

export const URSA_SKY = URSA_STARS.map(([x, y]) => ({
  azimuth: (318 + (x - ORIGIN_X) * DEG_AZ + 360) % 360,
  altitude: 36 - (y - ORIGIN_Y) * DEG_ALT,
}));
