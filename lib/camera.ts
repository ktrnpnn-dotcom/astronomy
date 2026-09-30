import { readCurrentPosition, type GeoFailure } from "@/lib/geolocation";
import type { GeoFix, SkyError } from "@/types/sky";

export interface LiveSession {
  stream: MediaStream | null;
  coords: GeoFix | null;
  geoError: GeoFailure | null;
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function cameraError(error: unknown): Extract<SkyError, "camera-denied" | "camera-missing"> {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") return "camera-denied";
  }
  return "camera-missing";
}

export async function startLiveSession(): Promise<
  { ok: true; session: LiveSession } | { ok: false; error: SkyError }
> {
  if (typeof window === "undefined") return { ok: false, error: "camera-missing" };
  if (!window.isSecureContext) return { ok: false, error: "insecure" };
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, error: "camera-missing" };

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" } },
    });
  } catch (error) {
    return { ok: false, error: cameraError(error) };
  }

  try {
    const coords = await readCurrentPosition();
    return { ok: true, session: { stream, coords, geoError: null } };
  } catch (error) {
    const geoError: GeoFailure = error === "denied" || error === "timeout" ? error : "unavailable";
    return { ok: true, session: { stream, coords: null, geoError } };
  }
}
