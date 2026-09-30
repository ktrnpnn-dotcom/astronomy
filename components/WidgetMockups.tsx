"use client";

export function WidgetMockups() {
  return (
    <section className="mt-8" aria-label="Макеты виджетов">
      <h2 className="font-title text-[28px]">Макеты виджетов</h2>
      <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
        Это рисунки для домашнего экрана, не живые виджеты iOS. Системный виджет из PWA не поставить.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="kicker mb-2">Маленький</p>
          <div className="w-[158px] rounded-[22px] bg-[#171f30] p-4 text-[#e8eef6]">
            <p className="text-xs text-[#93a0b5]">сейчас</p>
            <p className="font-title mt-3 text-[22px] leading-tight">Венера</p>
            <p className="mt-1 text-sm">20:18</p>
          </div>
        </div>
        <div>
          <p className="kicker mb-2">Средний</p>
          <div className="rounded-[22px] bg-[#171f30] p-4 text-[#e8eef6]">
            <p className="text-xs text-[#8dceb0]">стоит посмотреть вверх</p>
            <p className="font-title mt-2 text-[24px] leading-tight">Сегодня стоит посмотреть вверх</p>
            <p className="mt-2 text-sm text-[#d5deea]">Венера видна ещё 24 минуты</p>
          </div>
        </div>
        <div>
          <p className="kicker mb-2">Большой</p>
          <div className="rounded-[22px] bg-[#171f30] p-4 text-[#e8eef6]">
            <p className="text-xs text-[#93a0b5]">главное событие</p>
            <p className="font-title mt-2 text-[26px]">Венера после заката</p>
            <p className="mt-1 text-sm text-[#d5deea]">20:18–20:42 · низко на западе</p>
            <div className="mt-4">
              <p className="text-xs text-[#93a0b5]">Окна неба</p>
              <div className="mt-2 h-8 rounded-full bg-gradient-to-r from-[#8a6244] via-[#24344f] to-[#101826]" />
              <div className="mt-1 flex justify-between text-[10px] text-[#93a0b5]">
                <span>закат</span>
                <span>Венера</span>
                <span>Луна</span>
                <span>МКС</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="kicker mb-2">Экран блокировки</p>
          <div className="rounded-full bg-[#171f30] px-4 py-3 text-sm text-[#e8eef6]">
            МКС сейчас над вами · осталось 4 минуты
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Макет статуса. Пролёт МКС в приложении тоже демо.</p>
        </div>
      </div>
    </section>
  );
}
