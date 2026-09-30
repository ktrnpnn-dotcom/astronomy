/**
 * Approximate field of view for placing labels on the rear-camera preview.
 * TODO: calibrate per device. The iPhone 16 Pro main camera preview is often wider than 60°.
 */
export const CAMERA_HORIZONTAL_FOV = 60;
export const CAMERA_VERTICAL_FOV = 45;

export interface Projection {
  x: number;
  y: number;
  dx: number;
  dy: number;
  inView: boolean;
  degreesAway: number;
}

export function projectBody(
  azimuth: number,
  altitude: number,
  heading: number,
  viewAltitude: number,
  width: number,
  height: number,
): Projection {
  const dx = ((azimuth - heading + 540) % 360) - 180;
  const dy = altitude - viewAltitude;
  const x = width / 2 + (dx / (CAMERA_HORIZONTAL_FOV / 2)) * (width / 2);
  const y = height / 2 - (dy / (CAMERA_VERTICAL_FOV / 2)) * (height / 2);
  const inView =
    Math.abs(dx) <= CAMERA_HORIZONTAL_FOV / 2 &&
    Math.abs(dy) <= CAMERA_VERTICAL_FOV / 2;
  return {
    x,
    y,
    dx,
    dy,
    inView,
    degreesAway: Math.hypot(dx, dy),
  };
}

export function edgePoint(
  dx: number,
  dy: number,
  width: number,
  height: number,
  margin: number,
): { x: number; y: number; angle: number } {
  const vx = dx / (CAMERA_HORIZONTAL_FOV / 2);
  const vy = -dy / (CAMERA_VERTICAL_FOV / 2);
  const halfW = Math.max(24, width / 2 - margin);
  const halfH = Math.max(24, height / 2 - margin);
  const scale = Math.min(
    Math.abs(vx) > 0.001 ? halfW / Math.abs(vx) : Number.POSITIVE_INFINITY,
    Math.abs(vy) > 0.001 ? halfH / Math.abs(vy) : Number.POSITIVE_INFINITY,
  );
  return {
    x: width / 2 + vx * scale,
    y: height / 2 + vy * scale,
    angle: (Math.atan2(vy, vx) * 180) / Math.PI,
  };
}
