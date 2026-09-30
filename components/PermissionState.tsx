"use client";

export function PermissionState({
  title,
  text,
  onRetry,
  onDemo,
  onPickCity,
}: {
  title: string;
  text: string;
  onRetry?: () => void;
  onDemo?: () => void;
  onPickCity?: () => void;
}) {
  return (
    <div className="flex h-full flex-col justify-end px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="card">
        <h1 className="font-title text-[28px] leading-tight">{title}</h1>
        <p className="mt-3 text-[15px] leading-6 text-[var(--muted)]">{text}</p>
        <div className="mt-5 flex flex-col gap-2">
          {onRetry ? (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Повторить
            </button>
          ) : null}
          {onPickCity ? (
            <button type="button" className="btn btn-secondary" onClick={onPickCity}>
              Выбрать город вручную
            </button>
          ) : null}
          {onDemo ? (
            <button type="button" className="btn btn-secondary" onClick={onDemo}>
              Открыть демо
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
