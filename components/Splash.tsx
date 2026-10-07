export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Небо сейчас">
      <div className="eclipse" aria-hidden>
        <span className="eclipse-corona" />
        <span className="eclipse-sun" />
        <span className="eclipse-moon" />
      </div>
      <p className="title-2 mt-6">Небо сейчас</p>
    </div>
  );
}
