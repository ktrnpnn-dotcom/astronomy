export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const CITIES: City[] = [
  { id: "moscow", name: "Москва", latitude: 55.7558, longitude: 37.6173 },
  { id: "saint-petersburg", name: "Санкт-Петербург", latitude: 59.9343, longitude: 30.3351 },
  { id: "kazan", name: "Казань", latitude: 55.7887, longitude: 49.1221 },
  { id: "nizhny", name: "Нижний Новгород", latitude: 56.2965, longitude: 43.9361 },
  { id: "yekaterinburg", name: "Екатеринбург", latitude: 56.8389, longitude: 60.6057 },
  { id: "novosibirsk", name: "Новосибирск", latitude: 55.0084, longitude: 82.9357 },
  { id: "sochi", name: "Сочи", latitude: 43.6028, longitude: 39.7342 },
  { id: "kaliningrad", name: "Калининград", latitude: 54.7104, longitude: 20.4522 },
];

export function cityById(id: string): City {
  return CITIES.find((city) => city.id === id) ?? CITIES[0];
}

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestCityName(latitude: number, longitude: number): string | null {
  let best: City | null = null;
  let bestKm = 60;
  for (const city of CITIES) {
    const km = haversineKm(latitude, longitude, city.latitude, city.longitude);
    if (km < bestKm) {
      best = city;
      bestKm = km;
    }
  }
  return best?.name ?? null;
}
