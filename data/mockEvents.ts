export type Traffic = "green" | "yellow" | "gray" | "purple";
export type Chance = "high" | "medium" | "low";

export interface SkyEvent {
  id: string;
  objectId: string;
  kicker: string;
  title: string;
  windowLabel: string;
  direction: string;
  equipment: string;
  chance: Chance;
  difficulty: string;
  benefit: string;
  expectation: string;
  traffic: Traffic;
  /** Minutes from local midnight, for the evening timeline. */
  startMinute: number;
  endMinute: number;
  detail: string;
  alternative: string;
  guide: string;
}

export const MISS_REASONS = [
  {
    id: "clouds",
    label: "Слишком облачно",
    text: "Облака закрывают нужный участок. Имеет смысл выйти снова, когда появится просвет.",
  },
  {
    id: "horizon",
    label: "Дома или деревья закрывают горизонт",
    text: "Низкие объекты часто прячутся за крышами. Нужен открытый горизонт в ту сторону, куда смотреть.",
  },
  {
    id: "bright",
    label: "Слишком светло",
    text: "Сумерки и фонари гасят слабые точки. Более тёмное место или более позднее время обычно помогает.",
  },
  {
    id: "direction",
    label: "Не нашёл(ла) направление",
    text: "Компас телефона легко сбивается. Сверьтесь с закатом: запад — туда, куда село Солнце.",
  },
  {
    id: "late",
    label: "Не успел(а)",
    text: "Окно уже закрылось. Это нормально: короткие явления не ждут.",
  },
  {
    id: "unknown",
    label: "Не знаю, что искать",
    text: "Ищите не «космос вообще», а один ориентир: самую яркую точку или крупный диск Луны.",
  },
] as const;

export const PRIORITY_EVENT: SkyEvent = {
  id: "venus-dusk",
  objectId: "venus",
  kicker: "Сейчас",
  title: "Венера после заката",
  windowLabel: "20:18–20:42",
  direction: "низко на западе",
  equipment: "видно глазами",
  chance: "high",
  difficulty: "легко",
  benefit: "Один ясный ориентир на вечернем небе",
  expectation: "Будет выглядеть как самая яркая точка на вечернем небе.",
  traffic: "green",
  startMinute: 20 * 60 + 18,
  endMinute: 20 * 60 + 42,
  detail:
    "Учебный пример вечернего окна. На карте положение Венеры считается заново по вашему времени и месту, поэтому может не совпасть с этими часами.",
  alternative: "Венера снова будет видна завтра с 20:11. Завтра прогноз лучше.",
  guide: "Повернитесь на запад. Ищите самую яркую точку низко над горизонтом.",
};

export const FEED_EVENTS: SkyEvent[] = [
  {
    id: "moon-tonight",
    objectId: "moon",
    kicker: "Сегодня вечером",
    title: "Луна",
    windowLabel: "после 19:40",
    direction: "на юго-востоке",
    equipment: "видно глазами",
    chance: "high",
    difficulty: "легко",
    benefit: "Самый понятный объект, если Венеру закрыли дома",
    expectation: "Крупный светлый диск. Кратеры глазами не разобрать, и это нормально.",
    traffic: "green",
    startMinute: 19 * 60 + 40,
    endMinute: 23 * 60 + 30,
    detail: "Луна прощает городской свет и небольшую облачность лучше планет.",
    alternative: "Луна будет на небе и завтра. Если сегодня закрыта, посмотрите завтра чуть позже.",
    guide: "Повернитесь на юго-восток. Ищите крупный светлый диск, не точку.",
  },
  {
    id: "jupiter-week",
    objectId: "jupiter",
    kicker: "На этой неделе",
    title: "Юпитер по вечерам",
    windowLabel: "21:00–23:30",
    direction: "высоко, сторона меняется",
    equipment: "видно глазами",
    chance: "medium",
    difficulty: "спокойно",
    benefit: "Яркая точка, которую можно отличить от мигающих звёзд",
    expectation:
      "Глазами это спокойная яркая точка. Рядом в примере есть учебное соединение и слабый метеорный поток — без реального радианта.",
    traffic: "yellow",
    startMinute: 21 * 60,
    endMinute: 23 * 60 + 30,
    detail:
      "Карточка собирает неделю в один повод. Соединение объектов и метеорный поток здесь — макеты календаря, не эфемерида. Юпитер на карте считается по-настоящему.",
    alternative: "Если сегодня облачно, Юпитер никуда не денется в ближайшие вечера.",
    guide: "Ищите яркую точку, которая почти не мерцает. Дайте глазам минуту привыкнуть к темноте.",
  },
  {
    id: "iss-photo",
    objectId: "iss",
    kicker: "Можно снять на телефон",
    title: "Пролёт МКС",
    windowLabel: "демо · 22:14",
    direction: "через зенит, быстро",
    equipment: "телефон, без зума",
    chance: "low",
    difficulty: "короткое окно",
    benefit: "Движущаяся точка, если небо чистое и вы уже смотрите",
    expectation: "На телефоне это светлая точка, которая едет по небу несколько минут. В этой версии пролёт не рассчитан.",
    traffic: "purple",
    startMinute: 22 * 60 + 10,
    endMinute: 22 * 60 + 16,
    detail:
      "МКС помечена как демо, пока нет расчёта по орбитальным данным. Не ориентируйтесь на 22:14 как на реальный пролёт над вашим городом.",
    alternative: "Пока пролёт не посчитан, надёжнее снять Луну: она не убегает за четыре минуты.",
    guide: "В демо-режиме метка МКС показывает, как будет выглядеть подсказка. Это не настоящий пролёт.",
  },
  {
    id: "moon-child",
    objectId: "moon",
    kicker: "С ребёнком",
    title: "Десять минут с Луной",
    windowLabel: "когда стемнеет",
    direction: "туда, где диск уже виден",
    equipment: "глаза, без телескопа",
    chance: "high",
    difficulty: "коротко",
    benefit: "Можно уйти домой, как только диск найден",
    expectation: "Задача одна: найти Луну и заметить, что она не нарисована, а висит в небе.",
    traffic: "green",
    startMinute: 20 * 60,
    endMinute: 21 * 60,
    detail: "Короткая прогулка без терминов. Если Луны не видно, вечер не провален — облака тоже часть неба.",
    alternative: "Если сегодня диск закрыт, оставьте эту прогулку на завтра после заката.",
    guide: "Сначала найдите самый большой светлый круг. Звёзды для этой прогулки не нужны.",
  },
];

export const TIMELINE_EVENTS = [PRIORITY_EVENT, FEED_EVENTS[0], FEED_EVENTS[2]];

export function chanceLabel(chance: Chance): string {
  if (chance === "high") return "высокий";
  if (chance === "medium") return "средний";
  return "низкий";
}

export function trafficLabel(traffic: Traffic): string {
  if (traffic === "green") return "стоит выйти";
  if (traffic === "yellow") return "можно попробовать";
  if (traffic === "purple") return "редкое событие";
  return "плохие условия";
}
