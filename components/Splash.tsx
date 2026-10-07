export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Небо сейчас">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M42 18a18 18 0 1 0 0 36 14 14 0 0 1 0-36z" fill="currentColor" />
      </svg>
      <p className="title-2 mt-6">Небо сейчас</p>
    </div>
  );
}
