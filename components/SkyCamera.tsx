"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { CalibrationSheet } from "@/components/CalibrationSheet";
import { CompassScale } from "@/components/CompassScale";
import { DirectionGuide } from "@/components/DirectionGuide";
import { ObservationResultSheet } from "@/components/ObservationResultSheet";
import { PermissionState } from "@/components/PermissionState";
import { SkyOverlay } from "@/components/SkyOverlay";
import { DEMO_HEADING, DEMO_OBJECTS, DEMO_PLACE, DEMO_TIME_LABEL, DEMO_VIEW_ALTITUDE } from "@/data/demoSky";
import { PRIORITY_EVENT } from "@/data/mockEvents";
import { altitudePhrase, directionPhrase, headingSpread, smoothAngle } from "@/lib/angles";
import { getSkyObjects, nextVisibilityNote } from "@/lib/astronomy";
import { requestOrientationPermission, subscribeOrientation } from "@/lib/deviceOrientation";
import { formatDay, formatDistance, minutesPhrase } from "@/lib/format";
import type { AccuracyStatus, GeoFix, Observation, SkyError, SkyObject, ViewMode } from "@/types/sky";

const STAR_FIELD = Array.from({ length: 42 }, (_, index) => ({
  left: (index * 47) % 100,
  top: (index * 29) % 68,
  size: index % 6 === 0 ? 2.4 : 1.4,
  opacity: 0.28 + (index % 5) * 0.1,
}));

const ERROR_COPY: Record<SkyError, { title: string; text: string }> = {
  insecure: {
    title: "Нужна защищённая ссылка",
    text: "Камера и местоположение открываются только по HTTPS. Откройте опубликованную ссылку в Safari.",
  },
  "camera-missing": {
    title: "Камера недоступна",
    text: "Камера нужна, чтобы наложить карту неба на реальный вид.",
  },
  "camera-denied": {
    title: "Камера закрыта",
    text: "Камера нужна, чтобы наложить карту неба на реальный вид.",
  },
  "geo-denied": {
    title: "Место не определено",
    text: "Не удалось определить ваше местоположение. Вы можете выбрать город вручную.",
  },
  "geo-slow": {
    title: "Место ищется слишком долго",
    text: "Не удалось определить ваше местоположение. Вы можете выбрать город вручную.",
  },
  orientation: {
    title: "Компас не подключён",
    text: "Компас не подключён. Покажем направление на схеме горизонта.",
  },
};

const ACCURACY_CHIP: Record<AccuracyStatus, string> = {
  calibrated: "Компас откалиброван",
  "figure-eight": "Поверните телефон восьмёркой",
  demo: "Демо-режим",
  refining: "Уточняем направление",
  manual: "Ручной",
};

function accusative(object: SkyObject): string {
  if (object.id === "venus") return "Венеру";
  if (object.id === "moon") return "Луну";
  return object.name;
}

function seenLine(object: SkyObject): string {
  if (object.isDemo) return "МКС — демо, пролёт не рассчитан";
  const verb = object.id === "jupiter" || object.id === "saturn" ? "виден" : "видна";
  if (object.minutesUntilSet == null) return `${object.name} ${verb}`;
  return `${object.name} ${verb} ещё ${minutesPhrase(object.minutesUntilSet)}`;
}

function guideFor(object: SkyObject): string {
  if (object.id === "iss") return "Демо-метка МКС. Это не рассчитанный пролёт.";
  if (object.id === "venus") return PRIORITY_EVENT.guide;
  const where = directionPhrase(object.azimuth).name;
  const height = altitudePhrase(object.altitude);
  if (object.id === "moon") return `Повернитесь на ${where}. Ищите крупный светлый диск ${height}.`;
  return `Повернитесь на ${where}. Ищите спокойную точку ${height}.`;
}

export function SkyCamera({
  phase,
  demo,
  error,
  stream,
  coords,
  placeLabel,
  cloudy,
  focusId,
  showConstellations,
  onStart,
  onDemo,
  onClose,
  onRetry,
  onPickCity,
  onObserve,
}: {
  phase: "intro" | "pending" | "error" | "view";
  demo: boolean;
  error: SkyError | null;
  stream: MediaStream | null;
  coords: GeoFix | null;
  placeLabel: string;
  cloudy: boolean;
  focusId: string | null;
  showConstellations: boolean;
  onStart: () => void;
  onDemo: () => void;
  onClose: () => void;
  onRetry: () => void;
  onPickCity: () => void;
  onObserve: (observation: Observation) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const samples = useRef<number[]>([]);
  const serial = useRef(0);
  const [heading, setHeading] = useState<number | null>(null);
  const [manualHeading, setManualHeading] = useState(DEMO_HEADING);
  const [viewAltitude, setViewAltitude] = useState(DEMO_VIEW_ALTITUDE);
  const [manualAltitude, setManualAltitude] = useState(DEMO_VIEW_ALTITUDE);
  const [roll, setRoll] = useState<number | null>(null);
  const [spread, setSpread] = useState(180);
  const [sampleCount, setSampleCount] = useState(0);
  const [listening, setListening] = useState(false);
  const [forceManual, setForceManual] = useState(false);
  const [calibOpen, setCalibOpen] = useState(false);
  const [orientationMiss, setOrientationMiss] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [seenFocus, setSeenFocus] = useState(focusId);
  const [guiding, setGuiding] = useState(false);
  const [result, setResult] = useState<null | "seen" | "miss" | "info">(null);
  const [calculatedAt, setCalculatedAt] = useState<number | null>(null);

  if (seenFocus !== focusId) {
    setSeenFocus(focusId);
    setPickedId(null);
  }
  const selectedId = pickedId ?? focusId;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => undefined);
    return () => {
      video.pause();
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    if (phase !== "view") return;
    const update = () => setCalculatedAt(Date.now());
    const kick = window.setTimeout(update, 0);
    const id = window.setInterval(update, 20000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
    };
  }, [phase]);

  useEffect(() => {
    if (!listening) return;
    let smooth: number | null = null;
    let gotHeading = false;
    const stop = subscribeOrientation((sample) => {
      if (sample.absolute && sample.heading != null) {
        gotHeading = true;
        smooth = smooth == null ? sample.heading : smoothAngle(smooth, sample.heading);
        setHeading(smooth);
        samples.current = [...samples.current, sample.heading].slice(-14);
        setSampleCount(samples.current.length);
        setSpread(headingSpread(samples.current));
        setOrientationMiss(false);
      }
      if (sample.viewAltitude != null) {
        setViewAltitude(Math.max(-15, Math.min(80, sample.viewAltitude)));
      }
      if (sample.roll != null) setRoll(sample.roll);
    });
    const timer = window.setTimeout(() => {
      if (!gotHeading) setOrientationMiss(true);
    }, 4000);
    return () => {
      stop();
      window.clearTimeout(timer);
    };
  }, [listening]);

  const objects = useMemo(() => {
    if (demo) return DEMO_OBJECTS;
    if (!coords || calculatedAt == null) return [];
    return getSkyObjects(new Date(calculatedAt), coords.latitude, coords.longitude);
  }, [demo, coords, calculatedAt]);

  const mode: ViewMode = demo ? "demo" : heading != null && !forceManual ? "ar" : "manual";
  const activeHeading = mode === "ar" && heading != null ? heading : manualHeading;
  const activeAltitude = mode === "ar" ? viewAltitude : manualAltitude;
  const accuracy: AccuracyStatus = demo
    ? "demo"
    : mode === "ar"
      ? calibOpen && (spread > 10 || sampleCount < 8)
        ? "figure-eight"
        : spread > 10 || Math.abs(roll ?? 0) > 35
          ? "refining"
          : "calibrated"
      : listening
        ? "refining"
        : "manual";

  const targets = objects.filter((object) => object.isAboveHorizon && object.id !== "sun");
  const selected =
    targets.find((object) => object.id === selectedId) ??
    [...targets].sort((a, b) => b.visualPriority - a.visualPriority)[0] ??
    null;
  const sun = objects.find((object) => object.id === "sun");
  const focused = objects.find((object) => object.id === focusId);
  const focusHidden = Boolean(focused && !focused.isAboveHorizon && selected && selected.id !== focused.id);
  const below = !demo && targets.length === 0;
  const noted =
    objects.find((object) => object.id === focusId && object.id !== "iss") ??
    objects.find((object) => object.id === "venus");
  const fallbackNote =
    focusId === "iss"
      ? "Пролёт МКС в этой версии не рассчитывается. Метка на карте — только демо."
      : coords && noted && !demo && calculatedAt != null
        ? nextVisibilityNote(noted, new Date(calculatedAt), coords.latitude, coords.longitude)
        : "Следующее хорошее окно — завтра после заката.";

  async function calibrate() {
    setCalibOpen(true);
    setForceManual(false);
    const permission = await requestOrientationPermission();
    if (permission === "denied") {
      setOrientationMiss(true);
      setListening(false);
      return;
    }
    setListening(true);
  }

  function remember(seen: boolean) {
    if (!selected) return;
    serial.current += 1;
    onObserve({
      id: `${selected.id}-${serial.current}`,
      objectId: selected.id,
      name: selected.name,
      seen,
      at: new Date(calculatedAt ?? 0).toISOString(),
      note: seen
        ? selected.isDemo
          ? "Отмечено на демо-метке. Это не подтверждённый пролёт."
          : "Вы отметили, что объект был виден."
        : "Не получилось увидеть.",
      demo: demo || selected.isDemo,
      place: demo ? `${DEMO_PLACE}, демо ${DEMO_TIME_LABEL}` : placeLabel,
    });
    setResult(seen ? "seen" : "miss");
  }

  if (phase === "intro") {
    return (
      <div className="sky-stage relative h-full">
        <Backdrop />
        <button type="button" className="icon-btn absolute top-[calc(env(safe-area-inset-top)+12px)] left-4 z-10" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
          <p className="kicker text-[var(--sky-ink)]">Небо сейчас</p>
          <h1 className="font-title mt-2 text-[34px] leading-tight">Узнайте, что происходит над вами прямо сейчас</h1>
          <p className="mt-3 text-[15px] leading-6 opacity-80">
            Камера покажет карту неба поверх реального вида. Геолокация и время нужны, чтобы рассчитать положение объектов.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" className="btn btn-primary" onClick={onStart}>
              Открыть карту неба
            </button>
            <button type="button" className="btn btn-secondary text-[var(--sky-ink)]" onClick={onDemo}>
              Посмотреть демо
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "pending") {
    return (
      <div className="sky-stage relative flex h-full items-end px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Backdrop />
        <p className="relative text-lg">Открываем камеру…</p>
      </div>
    );
  }

  if (phase === "error" && error) {
    const copy = ERROR_COPY[error];
    const geo = error === "geo-denied" || error === "geo-slow";
    return (
      <div className="relative h-full bg-[var(--bg)] text-[var(--ink)]">
        <button type="button" className="icon-btn absolute top-[calc(env(safe-area-inset-top)+12px)] left-4 z-10" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
        <PermissionState
          title={copy.title}
          text={copy.text}
          onRetry={onRetry}
          onDemo={onDemo}
          onPickCity={geo ? onPickCity : undefined}
        />
      </div>
    );
  }

  const direction = selected ? directionPhrase(selected.azimuth) : null;

  return (
    <div className="sky-stage relative flex h-full flex-col overflow-hidden">
      {stream ? (
        <video ref={videoRef} className="sky-video" autoPlay muted playsInline aria-label="Задняя камера" />
      ) : (
        <Backdrop />
      )}
      {mode === "manual" && stream ? <div className="absolute inset-0 bg-black/45" /> : null}

      <header className="relative z-10 shrink-0 px-3 pt-[calc(env(safe-area-inset-top)+8px)]">
        <div className="flex items-center gap-2">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть карту">
            <X size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm">Карта неба</p>
            <p className="truncate text-[11px] opacity-75">
              {demo ? `${DEMO_PLACE}, ${DEMO_TIME_LABEL}` : placeLabel}
              {coords?.source === "gps" && coords.accuracy != null ? ` · GPS ±${Math.round(coords.accuracy)} м` : ""}
              {coords?.source === "city" && !demo ? " · город" : ""}
            </p>
          </div>
          <span className="chip">{mode === "ar" ? "AR" : mode === "demo" ? "Демо" : "Ручной"}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <CompassScale heading={activeHeading} />
          </div>
          <span className="chip shrink-0" role="status">
            {ACCURACY_CHIP[accuracy]}
          </span>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        {(Boolean(sun && sun.altitude > 0) || cloudy || mode === "manual") ? (
          <div className="absolute inset-x-3 top-1 z-10 flex flex-col gap-2">
            {mode === "manual" ? (
              <p className="rounded-2xl bg-black/50 px-3 py-2 text-xs leading-5">
                Компас не подключён. Направление на схеме горизонта, не на изображении камеры.
              </p>
            ) : null}
            {sun && sun.altitude > 0 ? (
              <p className="rounded-2xl bg-black/50 px-3 py-2 text-xs leading-5">
                Не смотрите на Солнце через камеру или без сертифицированного солнечного фильтра.
              </p>
            ) : null}
            {cloudy ? (
              <p className="rounded-2xl bg-black/50 px-3 py-2 text-xs leading-5">
                Сегодня плотная облачность. Попробуйте посмотреть на Луну или сохраните событие на завтра.
              </p>
            ) : null}
          </div>
        ) : null}
        <SkyOverlay
          objects={objects}
          heading={activeHeading}
          viewAltitude={activeAltitude}
          showConstellations={showConstellations}
          showIssTrack={demo}
          guidedId={guiding ? selected?.id ?? null : null}
          onSelect={(id) => {
            setPickedId(id);
            setGuiding(true);
          }}
        />
        {below ? (
          <p className="absolute inset-x-8 top-1/3 text-center text-sm leading-5">
            Сейчас яркие объекты из этого набора уже за горизонтом.
          </p>
        ) : null}
      </div>

      <div className="relative z-10 shrink-0 px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
        {guiding && selected ? <DirectionGuide title={`Найти ${accusative(selected)}`} text={guideFor(selected)} /> : null}
        <div className="mt-2 rounded-3xl bg-[var(--card)] px-4 py-3 text-[var(--ink)]">
          {mode !== "ar" ? (
            <div className="mb-2">
              <label className="block text-xs text-[var(--muted)]">
                Направление {Math.round(activeHeading)}° · {directionPhrase(activeHeading).name}
                <input
                  className="mt-1 w-full"
                  type="range"
                  min={0}
                  max={359}
                  value={Math.round(manualHeading)}
                  aria-label="Ручное направление"
                  onChange={(event) => setManualHeading(Number(event.target.value))}
                />
              </label>
              <label className="block text-xs text-[var(--muted)]">
                Высота взгляда {Math.round(manualAltitude)}°
                <input
                  className="mt-1 w-full"
                  type="range"
                  min={-5}
                  max={70}
                  value={Math.round(manualAltitude)}
                  aria-label="Высота взгляда"
                  onChange={(event) => setManualAltitude(Number(event.target.value))}
                />
              </label>
            </div>
          ) : null}
          {selected && direction ? (
            <>
              <p className="text-sm text-[var(--muted)]">Сейчас {direction.on}</p>
              {focusHidden && focused ? (
                <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                  Сейчас {focused.name} уже за горизонтом. {fallbackNote}
                </p>
              ) : null}
              <h2 className="font-title text-[26px] leading-tight">{seenLine(selected)}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {altitudePhrase(selected.altitude)} · {selected.isDemo ? "демо" : cloudy ? "шанс низкий из-за облаков" : "видно глазами"}
              </p>
              <button type="button" className="btn btn-primary mt-3 w-full" onClick={() => setGuiding(true)}>
                Найти {accusative(selected)}
              </button>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button type="button" className="btn btn-secondary" onClick={() => remember(true)}>
                  Вижу
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setResult("miss")}>
                  Не вижу
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setResult("info")}>
                  Инфо
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-title text-[26px] leading-tight">Сейчас смотреть почти не на что</h2>
              <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{fallbackNote}</p>
            </>
          )}
          <button type="button" className="btn btn-secondary mt-2 w-full" onClick={() => void calibrate()}>
            Калибровать
          </button>
        </div>
      </div>

      <CalibrationSheet
        open={calibOpen}
        status={accuracy}
        denied={orientationMiss}
        onClose={() => setCalibOpen(false)}
        onRequest={() => void calibrate()}
        onManual={() => {
          setForceManual(true);
          setCalibOpen(false);
        }}
      />
      <ObservationResultSheet
        open={result != null}
        variant={result ?? "info"}
        objectName={selected?.name ?? "Объект"}
        seenName={selected ? accusative(selected) : undefined}
        dateLabel={calculatedAt ? formatDay(new Date(calculatedAt)) : "сегодня"}
        info={
          selected
            ? `${selected.description}${selected.distanceKm != null ? ` Расстояние: ${formatDistance(selected.distanceKm, selected.id)}.` : ""}`
            : undefined
        }
        alternative={selected ? `${fallbackNote}` : undefined}
        onClose={() => setResult(null)}
      />
    </div>
  );
}

function Backdrop() {
  return (
    <div className="demo-sky" aria-hidden>
      {STAR_FIELD.map((star, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-[var(--sky-ink,#e8eef6)]"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
        />
      ))}
      <div className="ground-fade" />
    </div>
  );
}
