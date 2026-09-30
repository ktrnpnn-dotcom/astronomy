import { nearestCityName } from "@/lib/cities";
import type { GeoFix } from "@/types/sky";

export type GeoFailure = "denied" | "timeout" | "unavailable";

export function readCurrentPosition(timeoutMs = 10000): Promise<GeoFix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject("unavailable" satisfies GeoFailure);
      return;
    }

    const timer = window.setTimeout(() => reject("timeout" satisfies GeoFailure), timeoutMs + 1500);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          latitude,
          longitude,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          source: "gps",
          label: nearestCityName(latitude, longitude) ?? "Ваше место",
        });
      },
      (error) => {
        window.clearTimeout(timer);
        if (error.code === error.TIMEOUT) reject("timeout" satisfies GeoFailure);
        else if (error.code === error.PERMISSION_DENIED) reject("denied" satisfies GeoFailure);
        else reject("unavailable" satisfies GeoFailure);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
