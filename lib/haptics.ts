/** Short tick when the hunt reticle locks. iOS Safari usually ignores Vibration API. */
export function tickLock(): void {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate?.([12, 32, 18]);
}
