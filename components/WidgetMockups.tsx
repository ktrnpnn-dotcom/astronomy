"use client";

export function WidgetMockups() {
  return (
    <section className="mt-8" aria-label="Макеты виджетов">
      <h2 className="title-2">Макеты виджетов</h2>
      <p className="subhead mt-2 text-[var(--muted)]">
        Это рисунки для домашнего экрана, не живые виджеты iOS. Системный виджет из PWA не поставить.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <div>
          <p className="footnote mb-2 text-[var(--muted)]">Маленький</p>
          <div className="w-[158px] rounded-[12px] bg-[#1c1c1e] p-4 text-[#f2f2f7]">
            <p className="caption text-[#f2f2f7]/60">сейчас</p>
            <p className="title-2 mt-2">Венера</p>
            <p className="subhead mt-1">20:18</p>
          </div>
        </div>
        <div>
          <p className="footnote mb-2 text-[var(--muted)]">Средний</p>
          <div className="rounded-[12px] bg-[#1c1c1e] p-4 text-[#f2f2f7]">
            <p className="caption text-[#8dceb0]">стоит посмотреть вверх</p>
            <p className="title-2 mt-2">Сегодня стоит посмотреть вверх</p>
            <p className="subhead mt-2 text-[#f2f2f7]/80">Венера видна ещё 24 минуты</p>
          </div>
        </div>
        <div>
          <p className="footnote mb-2 text-[var(--muted)]">Большой</p>
          <div className="rounded-[12px] bg-[#1c1c1e] p-4 text-[#f2f2f7]">
            <p className="caption text-[#f2f2f7]/60">главное событие</p>
            <p className="title-2 mt-2">Венера после заката</p>
            <p className="subhead mt-1 text-[#f2f2f7]/80">20:18–20:42 · низко на западе</p>
            <div className="mt-4">
              <p className="footnote text-[#f2f2f7]/60">Окна неба</p>
              <div className="mt-2 h-px bg-[#f2f2f7]/30" />
              <div className="caption mt-1 flex justify-between text-[#f2f2f7]/60">
                <span>закат</span>
                <span>Венера</span>
                <span>Луна</span>
                <span>МКС</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="footnote mb-2 text-[var(--muted)]">Экран блокировки</p>
          <div className="subhead rounded-full bg-[#1c1c1e] px-4 py-3 text-[#f2f2f7]">
            МКС сейчас над вами · осталось 4 минуты
          </div>
          <p className="footnote mt-2 text-[var(--muted)]">Макет статуса. Пролёт МКС в приложении тоже демо.</p>
        </div>
      </div>
    </section>
  );
}
