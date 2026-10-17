export interface CloudReport {
  cover: number;
  cloudy: boolean;
}

function isPrecip(code: number): boolean {
  return code >= 45;
}

/**
 * Total cloud cover counts high haze that still looks like a sunny day.
 * Hide the feed only when low cloud or weather actually blocks the view.
 */
export async function readCloud(latitude: number, longitude: number): Promise<CloudReport | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "cloud_cover,cloud_cover_low,weather_code");
  url.searchParams.set("timezone", "auto");
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      current?: { cloud_cover?: number; cloud_cover_low?: number; weather_code?: number };
    };
    const total = data.current?.cloud_cover;
    const low = data.current?.cloud_cover_low;
    const code = data.current?.weather_code ?? 0;
    if (typeof total !== "number") return null;
    const floor = typeof low === "number" ? low : total;
    return {
      cover: total,
      cloudy: isPrecip(code) || floor >= 70,
    };
  } catch {
    return null;
  }
}
