"use client";

import { WidgetMockups } from "@/components/WidgetMockups";
import { CITIES } from "@/lib/cities";

export function ProfileScreen({
  cityId,
  nightVision,
  cloudy,
  constellations,
  onCity,
  onNight,
  onCloudy,
  onConstellations,
}: {
  cityId: string;
  nightVision: boolean;
  cloudy: boolean;
  constellations: boolean;
  onCity: () => void;
  onNight: (value: boolean) => void;
  onCloudy: (value: boolean) => void;
  onConstellations: (value: boolean) => void;
}) {
  const city = CITIES.find((item) => item.id === cityId)?.name ?? "Москва";
  return (
    <div className="screen pb-10">
      <p className="kicker">Настройки</p>
      <h1 className="font-title mt-2 text-[40px] leading-none">Профиль</h1>
      <div className="mt-5 flex flex-col gap-3">
        <button type="button" className="card text-left" onClick={onCity}>
          <p className="kicker">Город</p>
          <p className="mt-1 text-lg">{city}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Если геолокация недоступна, карта считает небо для этого города.</p>
        </button>
        <div className="card flex items-center justify-between gap-3">
          <div>
            <p className="text-lg">Ночное зрение</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Учебная красная палитра. Это демонстрация, не проверенный режим у телескопа.</p>
          </div>
          <button
            type="button"
            className="switch"
            data-on={nightVision}
            aria-pressed={nightVision}
            aria-label="Ночное зрение"
            onClick={() => onNight(!nightVision)}
          >
            <span />
          </button>
        </div>
        <div className="card flex items-center justify-between gap-3">
          <div>
            <p className="text-lg">Плотная облачность</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Учебное состояние плохой погоды. Прогноз из сети не приходит.</p>
          </div>
          <button
            type="button"
            className="switch"
            data-on={cloudy}
            aria-pressed={cloudy}
            aria-label="Плотная облачность"
            onClick={() => onCloudy(!cloudy)}
          >
            <span />
          </button>
        </div>
        <div className="card flex items-center justify-between gap-3">
          <div>
            <p className="text-lg">Слой созвездий</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Несколько декоративных линий. Это не распознавание созвездий.</p>
          </div>
          <button
            type="button"
            className="switch"
            data-on={constellations}
            aria-pressed={constellations}
            aria-label="Слой созвездий"
            onClick={() => onConstellations(!constellations)}
          >
            <span />
          </button>
        </div>
      </div>
      <section className="mt-6">
        <h2 className="font-title text-[28px]">Как устроена точность</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Положение Луны и планет считается на телефоне по времени и координатам. Куда повёрнут телефон, говорит компас.
          Если компас не подключён или дрожит, карта не притворяется точной: остаётся схема и ручное направление.
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Полный офлайн через service worker пока не сделан. Это TODO следующей версии.
        </p>
      </section>
      <WidgetMockups />
    </div>
  );
}
