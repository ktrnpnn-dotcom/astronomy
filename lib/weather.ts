export interface CloudReport {
  cover: number;
  cloudy: boolean;
}

export async function readCloud(latitude: number, longitude: number): Promise<CloudReport | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "cloud_cover");
  url.searchParams.set("timezone", "auto");
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as { current?: { cloud_cover?: number } };
    const cover = data.current?.cloud_cover;
    if (typeof cover !== "number") return null;
    return { cover, cloudy: cover >= 80 };
  } catch {
    return null;
  }
}
