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
      const turn = kind === "saturn" ? 0.8 + 0.2 * Math.cos(lon * 2) : 1;
      data[offset] = Math.min(255, (r * lit + shine + rim) * turn);
      data[offset + 1] = Math.min(255, (g * lit + shine * 0.95 + rim) * turn);
      data[offset + 2] = Math.min(255, (b * lit + shine * 0.8 + rim) * turn);
      data[offset + 3] = Math.round(255 * cover);
    }
  }
  const sphere = document.createElement("canvas");
  sphere.width = pixels;
  sphere.height = pixels;
  sphere.getContext("2d")?.putImageData(image, 0, 0);
  context.clearRect(0, 0, pixels, pixels);
  if (kind === "saturn") strokeRing(context, center, radius, true, yaw);
  context.drawImage(sphere, 0, 0);
  if (kind === "saturn") strokeRing(context, center, radius, false, yaw);
}

function strokeRing(context: CanvasRenderingContext2D, center: number, radius: number, back: boolean, yaw: number) {
  context.save();
  context.translate(center, center);
  context.rotate(-0.42);
  context.scale(1, 0.3);
  const start = back ? Math.PI * 0.08 : Math.PI * 1.08;
  const end = back ? Math.PI * 0.92 : Math.PI * 1.92;
  const steps = 28;
  for (let step = 0; step < steps; step += 1) {
    const a0 = start + ((end - start) * step) / steps;
    const a1 = start + ((end - start) * (step + 1)) / steps;
    const shine = 0.62 + 0.38 * Math.cos((a0 + a1) / 2 + yaw);
    const color = back
      ? `rgba(${Math.round(130 * shine)}, ${Math.round(104 * shine)}, ${Math.round(68 * shine)}, 0.55)`
      : `rgba(${Math.round(236 * shine)}, ${Math.round(214 * shine)}, ${Math.round(168 * shine)}, 0.95)`;
    context.beginPath();
    context.arc(0, 0, radius * 1.72, a0, a1);
    context.arc(0, 0, radius * 1.18, a1, a0, true);
    context.fillStyle = color;
    context.fill();
  }
  context.beginPath();
  context.arc(0, 0, radius * 1.48, start, end);
  context.arc(0, 0, radius * 1.4, end, start, true);
  context.fillStyle = back ? "rgba(8, 8, 10, 0.45)" : "rgba(8, 8, 10, 0.78)";
  context.fill();
  context.restore();
}

function paintMeteor(canvas: HTMLCanvasElement, cool: boolean, size: number, flight: number) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixels = Math.max(48, Math.round(size * ratio));
  if (canvas.width !== pixels) {
    canvas.width = pixels;
    canvas.height = pixels;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, pixels, pixels);
  const dust = cool ? "176, 206, 255" : "255, 214, 164";
  const point = (t: number) => ({
    x: pixels * (-0.12 + t * 1.22),
    y: pixels * (1.08 - t * 1.18),
  });
  const growth = 0.82 + Math.sin(Math.min(1, Math.max(0, flight)) * Math.PI) * 0.28;
  for (let i = 16; i >= 0; i -= 1) {
    const t = flight - i * 0.028;
    if (t <= 0) continue;
    const { x, y } = point(t);
    const fade = (1 - i / 16) ** 1.4;
    const radius = pixels * (0.012 + i * 0.004) * growth;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius * 3.2);
    glow.addColorStop(0, `rgba(${dust}, ${0.14 * fade})`);
    glow.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius * 3.2, 0, Math.PI * 2);
    context.fill();
  }
  const head = point(flight);
  const coma = context.createRadialGradient(head.x, head.y, 0, head.x, head.y, pixels * 0.11 * growth);
  coma.addColorStop(0, "#fff");
  coma.addColorStop(0.28, cool ? "#d7e6ff" : "#fff1dc");
  coma.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = coma;
  context.beginPath();
  context.arc(head.x, head.y, pixels * 0.11 * growth, 0, Math.PI * 2);
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
    const started = performance.now();
    const draw = (now = performance.now()) => {
      if (!alive) return;
      if (kind === "meteor" || kind === "dragon") {
        const flight = reduced ? 0.55 : ((now - started) % 4600) / 4600;
        paintMeteor(canvas, kind === "dragon", size, flight);
        if (!reduced) frame = window.requestAnimationFrame(draw);
      } else {
        if (spin && !reduced) angle.current += kind === "moon" ? 0.005 : 0.004;
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
