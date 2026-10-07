"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { CalibrationSheet } from "@/components/CalibrationSheet";
import { CompassScale } from "@/components/CompassScale";
import { ObservationResultSheet } from "@/components/ObservationResultSheet";
import { PermissionState } from "@/components/PermissionState";
import { SkyOverlay } from "@/components/SkyOverlay";
import { DEMO_HEADING, DEMO_OBJECTS, DEMO_PLACE, DEMO_TIME_LABEL, DEMO_VIEW_ALTITUDE } from "@/data/demoSky";
import { PRIORITY_EVENT } from "@/data/mockEvents";
import { altitudePhrase, directionPhrase, headingSpread, smoothAngle } from "@/lib/angles";
import { getSkyObjects, nextVisibilityNote, placeStickFigures } from "@/lib/astronomy";
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

function accusative(object: SkyObject): string {
  if (object.id === "venus") return "Венеру";
  if (object.id === "moon") return "Луну";
  return object.name;
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
  guideAzimuth,
  constellationView,
  onStart,
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
  guideAzimuth: number | null;
  constellationView: "stars" | "lines" | "figures" | "full";
  onStart: () => void;
  onRetry: () => void;
  onPickCity: () => void;
  onObserve: (observation: Observation) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const samples = useRef<number[]>([]);
  const serial = useRef(0);
  const shutterLock = useRef(false);
  const sheetDrag = useRef<number | null>(null);
  const sheetMoved = useRef(false);
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [details, setDetails] = useState(true);
  const [flash, setFlash] = useState(false);
  const [flyingShot, setFlyingShot] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
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

  const figures = useMemo(() => {
    if (calculatedAt == null) return [];
    const latitude = coords?.latitude ?? 55.7558;
    const longitude = coords?.longitude ?? 37.6173;
    return placeStickFigures(new Date(calculatedAt), latitude, longitude);
  }, [coords, calculatedAt]);

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
        <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <p className="footnote opacity-70">Небо сейчас</p>
          <h1 className="large-title mt-1">Узнайте, что происходит над вами прямо сейчас</h1>
          <p className="subhead mt-2 opacity-80">
            Камера покажет карту неба поверх реального вида. Геолокация и время нужны, чтобы рассчитать положение объектов.
          </p>
          <div className="mt-6">
            <button type="button" className="btn btn-primary w-full" onClick={onStart}>
              Открыть карту неба
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
        <PermissionState
          title={copy.title}
          text={copy.text}
          onRetry={onRetry}
          onPickCity={geo ? onPickCity : undefined}
        />
      </div>
    );
  }

  const direction = selected ? directionPhrase(selected.azimuth) : null;

  function capture() {
    if (shutterLock.current) return;
    shutterLock.current = true;
    navigator.vibrate?.(12);
    setFlash(true);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const width = 720;
    const height = 960;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#07080a";
    context.fillRect(0, 0, width, height);
    if (video && video.videoWidth > 0) {
      const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
      const drawnWidth = video.videoWidth * scale;
      const drawnHeight = video.videoHeight * scale;
      context.drawImage(video, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
    }
    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(0, height - 168, width, 168);
    context.fillStyle = "#f2f2f7";
    context.font = "600 32px system-ui, sans-serif";
    context.fillText(selected?.name ?? "Небо", 32, height - 108);
    context.font = "400 20px system-ui, sans-serif";
    const when = new Date();
    context.fillText(when.toLocaleString("ru-RU"), 32, height - 70);
    context.fillText(placeLabel, 32, height - 40);
    const image = canvas.toDataURL("image/jpeg", 0.72);
    setFlyingShot(image);
    onObserve({
      id: `photo-${serial.current++}`,
      objectId: selected?.id ?? "sky",
      name: selected?.name ?? "Небо",
      seen: true,
      at: when.toISOString(),
      note: "Снято на карте",
      demo: false,
      place: placeLabel,
      image,
    });
    window.setTimeout(() => {
      setFlash(false);
      setFlyingShot(null);
      shutterLock.current = false;
    }, 700);
  }

  return (
    <div className="sky-stage relative flex h-full flex-col overflow-hidden">
      {stream ? (
        <video ref={videoRef} className="sky-video" autoPlay muted playsInline aria-label="Задняя камера" />
      ) : (
        <Backdrop />
      )}
      {mode === "manual" && stream ? <div className="absolute inset-0 bg-black/45" /> : null}

      <header className="relative z-10 shrink-0 px-2 pt-[max(4px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-1 px-2">
          <div className="min-w-0 flex-1">
            <p className="headline">Карта неба</p>
            <p className="caption truncate opacity-70">
              {placeLabel}
              {coords?.source === "gps" && coords.accuracy != null ? ` · GPS ±${Math.round(coords.accuracy)} м` : ""}
              {coords?.source === "city" ? " · город" : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn-text px-2"
            onClick={() => {
              setCalibrating(true);
              void calibrate();
            }}
          >
            Калибровать
          </button>
        </div>
        <CompassScale heading={activeHeading} />
      </header>

      <div className="relative z-10 min-h-0 flex-1">
        {(Boolean(sun && sun.altitude > 0) || cloudy) ? (
          <div className="absolute inset-x-3 top-1 z-10 flex flex-col gap-2">
            {sun && sun.altitude > 0 ? (
              <p className="footnote px-2 opacity-90">
                Не смотрите на Солнце через камеру или без сертифицированного солнечного фильтра.
              </p>
            ) : null}
            {cloudy ? (
              <p className="footnote px-2 opacity-90">
                Сегодня плотная облачность. Попробуйте посмотреть на Луну или сохраните событие на завтра.
              </p>
            ) : null}
          </div>
        ) : null}
        <button type="button" className="sky-shutter" onClick={() => void capture()} aria-label="Снимок для альбома">
          <Camera size={22} strokeWidth={1.7} />
        </button>
        {guiding && !details ? (
          <button type="button" className="sky-dismiss" onClick={() => setGuiding(false)}>
            Закрыть
          </button>
        ) : null}
        {flash ? <div className="sky-flash" aria-hidden /> : null}
        {flyingShot ? <img className="sky-shot" src={flyingShot} alt="" /> : null}
        <SkyOverlay
          objects={objects}
          heading={activeHeading}
          viewAltitude={activeAltitude}
          constellationView={constellationView}
          figures={figures}
          guideAzimuth={guiding ? (selected?.azimuth ?? guideAzimuth) : guideAzimuth}
          showIssTrack={false}
          guidedId={guiding ? selected?.id ?? null : null}
          onSelect={(id) => {
            setPickedId(id);
            setGuiding(true);
          }}
        />
        {below ? (
          <p className="subhead absolute inset-x-8 top-1/3 text-center">
            Сейчас яркие объекты из этого набора уже за горизонтом.
          </p>
        ) : null}
      </div>

      <div className="sky-sheet relative z-10 shrink-0 px-4 pt-1 pb-[max(8px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-center"
          aria-expanded={details}
          aria-label={details ? "Свернуть лист" : "Развернуть лист"}
          onClick={() => {
            if (sheetMoved.current) {
              sheetMoved.current = false;
              return;
            }
            setDetails((open) => !open);
          }}
          onPointerDown={(event) => {
            sheetDrag.current = event.clientY;
            sheetMoved.current = false;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (sheetDrag.current == null) return;
            const delta = event.clientY - sheetDrag.current;
            if (Math.abs(delta) < 12) return;
            sheetMoved.current = true;
            if (delta > 42) {
              setDetails(false);
              sheetDrag.current = null;
            } else if (delta < -42) {
              setDetails(true);
              sheetDrag.current = null;
            }
          }}
          onPointerUp={() => {
            sheetDrag.current = null;
          }}
        >
          <span className="grabber my-0" />
        </button>
        {details && selected && direction ? (
          <>
            <p className="headline nums text-center">
              {selected.name}
              {" · "}
              {direction.name}
              {selected.minutesUntilSet != null ? ` · ${minutesPhrase(selected.minutesUntilSet)}` : ""}
            </p>
            {guiding ? <p className="footnote mt-1 text-center opacity-75">{guideFor(selected)}</p> : null}
            {focusHidden && focused ? (
              <p className="footnote mt-1 text-center opacity-75">
                Сейчас {focused.name} уже за горизонтом. {fallbackNote}
              </p>
            ) : null}
            {calibrating ? (
              <p className="footnote mt-2 text-center opacity-80">
                Поверните телефон восьмёркой. Когда направление успокоится, можно смотреть.
                {mode !== "ar" ? " Пока компас молчит, направление задают контуры ниже." : ""}
              </p>
            ) : null}
            {calibrating && mode !== "ar" ? (
              <div className="mt-2">
                <label className="footnote block opacity-75">
                  Направление {Math.round(activeHeading)}° · {directionPhrase(activeHeading).name}
                  <input
                    className="range-line mt-1 w-full"
                    type="range"
                    min={0}
                    max={359}
                    value={Math.round(manualHeading)}
                    aria-label="Ручное направление"
                    onChange={(event) => setManualHeading(Number(event.target.value))}
                  />
                </label>
                <label className="footnote block opacity-75">
                  Высота взгляда {Math.round(manualAltitude)}°
                  <input
                    className="range-line mt-1 w-full"
                    type="range"
                    min={-5}
                    max={70}
                    value={Math.round(manualAltitude)}
                    aria-label="Высота взгляда"
                    onChange={(event) => setManualAltitude(Number(event.target.value))}
                  />
                </label>
                {mode === "manual" ? (
                  <p className="footnote opacity-70">
                    Компас не подключён. Направление на схеме горизонта, не на изображении камеры.
                  </p>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-line mt-3 w-full"
              onClick={() => {
                if (guiding) {
                  setGuiding(false);
                  setDetails(false);
                  return;
                }
                setGuiding(true);
                setDetails(false);
              }}
            >
              {guiding ? "Закрыть" : "Найти"}
            </button>
            {sheetOpen ? (
              <>
                <div className="mt-1 grid grid-cols-3">
                  <button type="button" className="btn-text" onClick={() => remember(true)}>
                    Вижу
                  </button>
                  <button type="button" className="btn-text" onClick={() => setResult("miss")}>
                    Не вижу
                  </button>
                  <button type="button" className="btn-text" onClick={() => setResult("info")}>
                    Инфо
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : details ? (
          <>
            <p className="headline text-center">Сейчас смотреть почти не на что</p>
            <p className="footnote mt-1 text-center opacity-75">{fallbackNote}</p>
          </>
        ) : null}
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
