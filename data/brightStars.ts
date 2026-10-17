export interface BrightStar {
  id: string;
  name: string;
  ra: number;
  dec: number;
}

/** A few hunt targets, not a full catalogue. */
export const BRIGHT_STARS: BrightStar[] = [
  { id: "sirius", name: "Сириус", ra: 6.752, dec: -16.72 },
  { id: "vega", name: "Вега", ra: 18.616, dec: 38.78 },
  { id: "polaris", name: "Полярная", ra: 2.53, dec: 89.26 },
  { id: "betelgeuse", name: "Бетельгейзе", ra: 5.919, dec: 7.41 },
  { id: "arcturus", name: "Арктур", ra: 14.261, dec: 19.18 },
  { id: "capella", name: "Капелла", ra: 5.278, dec: 45.99 },
  { id: "rigel", name: "Ригель", ra: 5.242, dec: -8.2 },
];
