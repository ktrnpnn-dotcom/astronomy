"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import type { DiscKind } from "@/data/weekSky";

function hash(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function surface(kind: DiscKind, lon: number, lat: number, light: number): [number, number, number] {
  if (kind === "moon") {
    const grain = noise(lon * 4, lat * 4);
    const maria = noise(lon * 1.3 + 1.7, lat * 1.1);
    const crater = noise(lon * 14, lat * 14);
    const rim = crater > 0.8 && crater < 0.86 ? 36 * light : 0;
    const floor = crater > 0.86 ? -40 : 0;
    const shade = maria > 0.58 ? -34 : 0;
    const g = 168 + grain * 28 + shade + floor + rim;
    return [g, g * 0.97, g * 0.92];
  }
  if (kind === "venus") {
    const swirl = noise(lon * 2.2 + lat * 0.6, lat * 3.4);
    const band = Math.sin(lat * 6 + swirl) * 10;
    return [228 + swirl * 18 + band, 206 + swirl * 14, 158 + swirl * 8];
  }
  if (kind === "jupiter") {
    const wobble = noise(lon * 2, lat * 6) * 0.18;
    const bands: [number, number, number][] = [
      [232, 214, 184],
      [168, 118, 78],
      [244, 228, 204],
      [124, 78, 52],
      [210, 176, 132],
      [150, 108, 72],
    ];
    const t = (Math.sin(lat * 11 + wobble) + 1) / 2;
    const index = Math.min(bands.length - 1, Math.floor(t * bands.length));
    const color: [number, number, number] = bands[index];
    const dLon = Math.atan2(Math.sin(lon + 0.85), Math.cos(lon + 0.85));
    const dLat = lat + 0.18;
    const spot = (dLon * dLon) / 0.09 + (dLat * dLat) / 0.03;
    if (spot >= 1) return color;
    const mix = (1 - spot) * light;
    return [
      color[0] * (1 - mix) + 176 * mix,
      color[1] * (1 - mix) + 64 * mix,
      color[2] * (1 - mix) + 48 * mix,
    ];
  }
  const belt = noise(lon * 3, lat * 8);
  const gold = 206 + Math.sin(lat * 8) * 14 + belt * 12;
  return [gold + 16, gold * 0.84, gold * 0.55];
}

type Photo = { data: Uint8ClampedArray; width: number; height: number };

const photos = new Map<string, Promise<Photo | null>>();

function loadPhoto(kind: DiscKind): Promise<Photo | null> {
  if (kind === "meteor" || kind === "dragon") return Promise.resolve(null);
  const cached = photos.get(kind);
  if (cached) return cached;
  const pending = new Promise<Photo | null>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scratch = document.createElement("canvas");
      scratch.width = image.naturalWidth;
      scratch.height = image.naturalHeight;
      const context = scratch.getContext("2d", { willReadFrequently: true });
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, scratch.width, scratch.height);
      resolve({ data: pixels.data, width: scratch.width, height: scratch.height });
    };
    image.onerror = () => resolve(null);
    image.src = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/textures/${kind}.jpg`;
  });
  photos.set(kind, pending);
  return pending;
}

function samplePhoto(photo: Photo, lon: number, lat: number): [number, number, number] {
  const u = ((lon / (Math.PI * 2)) % 1 + 1) % 1;
  const v = Math.min(0.999, Math.max(0, lat / Math.PI + 0.5));
  const x = Math.min(photo.width - 1, Math.floor(u * photo.width));
  const y = Math.min(photo.height - 1, Math.floor(v * photo.height));
  const index = (y * photo.width + x) * 4;
  return [photo.data[index], photo.data[index + 1], photo.data[index + 2]];
}

function paintSphere(canvas: HTMLCanvasElement, kind: DiscKind, yaw: number, size: number, photo: Photo | null) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.max(48, Math.round(size * ratio));
  canvas.width = pixels;
  canvas.height = pixels;
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(pixels, pixels);
  const data = image.data;
  const radius = pixels * (kind === "saturn" ? 0.26 : 0.34);
  const center = pixels / 2;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  for (let y = 0; y < pixels; y += 1) {
    for (let x = 0; x < pixels; x += 1) {
      const nx = (x + 0.5 - center) / radius;
      const ny = (y + 0.5 - center) / radius;
      const rr = nx * nx + ny * ny;
      const offset = (y * pixels + x) * 4;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      const cover = Math.min(1, (1 - Math.sqrt(rr)) * radius);
      const tx = nx * cos - nz * sin;
      const tz = nx * sin + nz * cos;
      const lon = Math.atan2(tx, tz);
      const lat = Math.asin(Math.max(-1, Math.min(1, ny)));
      const light = Math.max(0, nx * -0.42 + ny * -0.38 + nz * 0.82);
      const lit = (0.16 + 0.84 * light) * (0.62 + 0.38 * nz);
      const [r, g, b] = photo ? samplePhoto(photo, lon, lat) : surface(kind, lon, lat, light);
      const shine = photo ? light ** 28 * 22 : kind === "venus" ? light ** 14 * 90 : kind === "moon" ? light ** 40 * 18 : light ** 22 * 36;
      const rim = light * light * (1 - nz) * (kind === "venus" ? 26 : 12);
      data[offset] = Math.min(255, r * lit + shine + rim);
      data[offset + 1] = Math.min(255, g * lit + shine * 0.95 + rim);
      data[offset + 2] = Math.min(255, b * lit + shine * 0.8 + rim);
      data[offset + 3] = Math.round(255 * cover);
    }
  }
  const sphere = document.createElement("canvas");
  sphere.width = pixels;
  sphere.height = pixels;
  sphere.getContext("2d")?.putImageData(image, 0, 0);
  context.clearRect(0, 0, pixels, pixels);
  if (kind === "saturn") strokeRing(context, center, radius, true);
  context.drawImage(sphere, 0, 0);
  if (kind === "saturn") strokeRing(context, center, radius, false);
}

function strokeRing(context: CanvasRenderingContext2D, center: number, radius: number, back: boolean) {
  context.save();
  context.translate(center, center);
  context.rotate(-0.42);
  context.scale(1, 0.3);
  const start = back ? Math.PI * 0.08 : Math.PI * 1.08;
  const end = back ? Math.PI * 0.92 : Math.PI * 1.92;
  const band = (inner: number, outer: number, color: string) => {
    context.beginPath();
    context.arc(0, 0, outer, start, end);
    context.arc(0, 0, inner, end, start, true);
    context.fillStyle = color;
    context.fill();
  };
  band(radius * 1.18, radius * 1.72, back ? "rgba(150, 124, 82, 0.5)" : "rgba(236, 214, 168, 0.95)");
  band(radius * 1.4, radius * 1.48, back ? "rgba(8, 8, 10, 0.45)" : "rgba(8, 8, 10, 0.78)");
  context.restore();
}

function paintMeteor(canvas: HTMLCanvasElement, cool: boolean, size: number) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.max(48, Math.round(size * ratio));
  canvas.width = pixels;
  canvas.height = pixels;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, pixels, pixels);
  const headX = pixels * 0.7;
  const headY = pixels * 0.34;
  const tailX = pixels * 0.06;
  const tailY = pixels * 0.84;
  const dust = cool ? "168, 198, 255" : "255, 214, 164";
  const ionX = pixels * 0.02;
  const ionY = pixels * 0.5;
  context.lineCap = "round";
  context.strokeStyle = `rgba(${dust}, 0.28)`;
  context.lineWidth = pixels * 0.2;
  context.beginPath();
  context.moveTo(tailX, tailY);
  context.quadraticCurveTo(pixels * 0.28, pixels * 0.7, headX, headY);
  context.stroke();
  const trail = context.createLinearGradient(tailX, tailY, headX, headY);
  trail.addColorStop(0, "rgba(255,255,255,0)");
  trail.addColorStop(0.45, `rgba(${dust}, 0.35)`);
  trail.addColorStop(1, "rgba(255,248,236,0.9)");
  context.strokeStyle = trail;
  context.lineWidth = pixels * 0.045;
  context.stroke();
  context.strokeStyle = cool ? "rgba(186,214,255,0.55)" : "rgba(220,232,255,0.4)";
  context.lineWidth = pixels * 0.012;
  context.beginPath();
  context.moveTo(ionX, ionY);
  context.lineTo(headX, headY);
  context.stroke();
  const coma = context.createRadialGradient(headX, headY, 0, headX, headY, pixels * 0.16);
  coma.addColorStop(0, "#fff");
  coma.addColorStop(0.35, cool ? "#d5e4ff" : "#fff0d4");
  coma.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = coma;
  context.beginPath();
  context.arc(headX, headY, pixels * 0.16, 0, Math.PI * 2);
  context.fill();
}

export function ObjectDisc({
  kind,
  size = 72,
  spin = false,
}: {
  kind: DiscKind;
  size?: number;
  spin?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angle = useRef(0.7);
  const drag = useRef<number | null>(null);
  const photo = useRef<Photo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    let alive = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = () => {
      if (!alive) return;
      if (kind === "meteor" || kind === "dragon") paintMeteor(canvas, kind === "dragon", size);
      else {
        if (spin && !reduced) angle.current += 0.012;
        paintSphere(canvas, kind, angle.current, size, photo.current);
      }
      if (spin && !reduced && kind !== "meteor" && kind !== "dragon") frame = window.requestAnimationFrame(draw);
    };
    void loadPhoto(kind).then((loaded) => {
      if (!alive) return;
      photo.current = loaded;
      draw();
    });
    draw();
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
    };
  }, [kind, size, spin]);

  function redraw(next: number) {
    angle.current = next;
    const canvas = canvasRef.current;
    if (!canvas || kind === "meteor" || kind === "dragon") return;
    paintSphere(canvas, kind, next, size, photo.current);
  }

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!spin || kind === "meteor" || kind === "dragon") return;
    drag.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (drag.current == null) return;
    const delta = event.clientX - drag.current;
    drag.current = event.clientX;
    redraw(angle.current + delta * 0.02);
  }

  return (
    <canvas
      ref={canvasRef}
      className="object-disc"
      style={{ width: size, height: size }}
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        drag.current = null;
      }}
    />
  );
}
