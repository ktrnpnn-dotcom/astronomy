export interface OrientationSample {
  heading: number | null;
  /** Altitude, in degrees, at the center of the camera view. */
  viewAltitude: number | null;
  roll: number | null;
  absolute: boolean;
}

type WebkitOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number | null;
};

/**
 * iOS Safari only exposes compass heading after a user gesture calls
 * DeviceOrientationEvent.requestPermission(). Other browsers may have no such method.
 */
export async function requestOrientationPermission(): Promise<"granted" | "denied" | "not-required"> {
  if (typeof DeviceOrientationEvent === "undefined") return "denied";
  const ctor = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<"granted" | "denied">;
  };
  if (typeof ctor.requestPermission !== "function") return "not-required";
  try {
    const result = await ctor.requestPermission();
    return result === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

export function readOrientation(event: DeviceOrientationEvent): OrientationSample {
  const webkit = event as WebkitOrientationEvent;
  let heading: number | null = null;
  let absolute = false;

  if (typeof webkit.webkitCompassHeading === "number" && Number.isFinite(webkit.webkitCompassHeading)) {
    // iOS: degrees clockwise from north, along the top of the phone.
    heading = webkit.webkitCompassHeading;
    absolute = true;
  } else if (event.absolute && typeof event.alpha === "number") {
    heading = (360 - event.alpha) % 360;
    absolute = true;
  }

  // Portrait iPhone: beta grows as the top of the phone tips back toward the sky.
  // Altitude at the center of the frame is therefore beta − 90, not 90 − beta.
  const viewAltitude = typeof event.beta === "number" ? event.beta - 90 : null;
  const roll = typeof event.gamma === "number" ? event.gamma : null;
  return { heading, viewAltitude, roll, absolute };
}

export function subscribeOrientation(listener: (sample: OrientationSample) => void): () => void {
  const onEvent = (event: Event) => {
    listener(readOrientation(event as DeviceOrientationEvent));
  };
  window.addEventListener("deviceorientationabsolute", onEvent, true);
  window.addEventListener("deviceorientation", onEvent, true);
  return () => {
    window.removeEventListener("deviceorientationabsolute", onEvent, true);
    window.removeEventListener("deviceorientation", onEvent, true);
  };
}
