(() => {
  'use strict';

  const STORAGE_KEY = 'life-tracker-work-v1';
  // Bump when the seeded travel itinerary changes so an already-saved browser
  // auto-refreshes the trip on next load (without a manual reset, and without
  // touching the user's Аскеза progress or their work projects).
  const SEED_VERSION = 6;
  const ROW_H = 36;
  const HEADER_H = 30;
  const DAY_MS = 86400000;
  const LABELS_W = 150;

  const STATUS = {
    // Работа
    planned: { label: 'Запланирован', icon: '○', varName: '--planned-ink' },
    active:  { label: 'В работе',     icon: '▶', varName: '--series-1' },
    paused:  { label: 'На паузе',     icon: '⏸', varName: '--warning' },
    done:    { label: 'Завершён',     icon: '✓', varName: '--good' },
    // Путешествия
    stay:    { label: 'Проживание',      icon: '🏠', varName: '--series-1' },
    drive:   { label: 'В дороге',        icon: '🚗', varName: '--warning' },
    off:     { label: 'Отдых / города',  icon: '🏖', varName: '--good' },
    workday: { label: 'Рабочие дни',     icon: '💻', varName: '--planned-ink' },
  };
  // which statuses the form offers per sphere (first is the default for new items)
  const SPHERE_STATUSES = {
    work:   ['planned', 'active', 'paused', 'done'],
    travel: ['stay', 'drive', 'off', 'workday'],
  };

  function uid() { return Math.random().toString(36).slice(2, 10); }
  // All date math happens in UTC on the calendar Y-M-D only, so it never
  // shifts by a day depending on the viewer's timezone offset.
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function isoToUTCDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  function utcDateToISO(d) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  function addDaysISO(iso, days) {
    const d = isoToUTCDate(iso);
    d.setUTCDate(d.getUTCDate() + days);
    return utcDateToISO(d);
  }
  function fmtDate(iso) {
    return isoToUTCDate(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  }
  function fmtDateShort(iso) {
    return isoToUTCDate(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
  }

  function seedData() {
    // stable person ids so phases can reference them
    const P = { me: 'p1', pavel: 'p2', olya: 'p3', natasha: 'p4', artur: 'p5', voitek: 'p6', designer: 'p7' };
    const people = [
      { id: P.me, name: 'Я' },
      { id: P.pavel, name: 'Павел' },
      { id: P.olya, name: 'Оля' },
      { id: P.natasha, name: 'Наталья' },
      { id: P.artur, name: 'Артур' },
      { id: P.voitek, name: 'Войтек' },
      { id: P.designer, name: 'Дизайнер' },
    ];
    const projects = [
      // ---- Modivo Veo Challenge (дедлайн 28.08) ----
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Сценарий', status: 'done',
        start: '2026-07-20', end: '2026-07-25', peopleIds: [P.me],
        notes: 'Дедлайн проекта: 28.08. Нужно 2 видео по 30 сек — форматы 9:16 и 16:9.',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Фидбек клиента (сценарий)', status: 'done',
        start: '2026-07-26', end: '2026-07-27', peopleIds: [P.olya],
        notes: 'Закрыто.',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Сторибоды', status: 'planned',
        start: '2026-07-28', end: '2026-08-02', peopleIds: [P.pavel],
        notes: '',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Фидбек клиента (сторибоды)', status: 'planned',
        start: '2026-08-03', end: '2026-08-04', peopleIds: [],
        notes: '',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Создание видео — формат 9:16', status: 'planned',
        start: '2026-08-05', end: '2026-08-11', peopleIds: [P.pavel],
        notes: 'Делаем первый формат, отправляем на фидбек, затем второй.',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Фидбек клиента (9:16)', status: 'planned',
        start: '2026-08-12', end: '2026-08-13', peopleIds: [],
        notes: '',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Создание видео — формат 16:9', status: 'planned',
        start: '2026-08-14', end: '2026-08-20', peopleIds: [P.pavel],
        notes: '',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Монтаж', status: 'planned',
        start: '2026-08-21', end: '2026-08-27', peopleIds: [P.artur],
        notes: '',
      },

      // ---- Cropp (дедлайн 31.08) ----
      {
        id: uid(), project: 'Cropp', phase: 'Утверждение скоупа', status: 'active',
        start: '2026-07-24', end: '2026-07-28', peopleIds: [P.me, P.natasha],
        notes: 'Дедлайн проекта: 31.08.',
      },
      {
        id: uid(), project: 'Cropp', phase: 'Утверждение сценариев', status: 'planned',
        start: '2026-07-29', end: '2026-08-02', peopleIds: [P.natasha],
        notes: '',
      },
      {
        id: uid(), project: 'Cropp', phase: 'Сторибоды', status: 'planned',
        start: '2026-08-03', end: '2026-08-07', peopleIds: [P.pavel],
        notes: '',
      },
      {
        id: uid(), project: 'Cropp', phase: 'Создание видео', status: 'planned',
        start: '2026-08-08', end: '2026-08-15', peopleIds: [P.pavel],
        notes: 'Порядок: сначала видео, потом Hook, потом реформаты.',
      },
      {
        id: uid(), project: 'Cropp', phase: 'Hook', status: 'planned',
        start: '2026-08-16', end: '2026-08-19', peopleIds: [],
        notes: '',
      },
      {
        id: uid(), project: 'Cropp', phase: 'Реформаты', status: 'planned',
        start: '2026-08-20', end: '2026-08-25', peopleIds: [P.pavel],
        notes: '',
      },
      {
        id: uid(), project: 'Cropp', phase: 'Монтаж', status: 'planned',
        start: '2026-08-26', end: '2026-08-30', peopleIds: [P.artur],
        notes: '',
      },
    ];
    // everything above belongs to the Работа sphere
    projects.forEach(p => { p.sphere = 'work'; });

    // ---- Путешествия: Италия на машине (7–23 августа) ----
    // The trip's Gantt keeps only logistics (drives + accommodation); the
    // day-by-day sightseeing plan lives in dayPlans and renders as a clickable
    // day strip under the chart.
    const trip = 'Италия на машине';
    projects.push(
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🚗 Дорога в Италию', status: 'drive',
        start: '2026-08-07', end: '2026-08-08', peopleIds: [P.me],
        notes: 'Выезд в пятницу, в дороге до вечера субботы. Ночь пт→сб без брони.',
      },
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🏠 База 1 — Сан-Джованни-ин-Галилея', status: 'stay',
        start: '2026-08-08', end: '2026-08-15', peopleIds: [P.me],
        notes: 'Via Giacomo Matteotti, 27, San Giovanni in Galilea, Emilia-Romagna 47030. Романья, рядом Римини и Сан-Марино.',
      },
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🏨 Ночь в Тоскане — Tenuta Massabò', status: 'stay',
        start: '2026-08-12', end: '2026-08-13', peopleIds: [P.me],
        notes: 'Via Gentilino 40, San Casciano in Val di Pesa (Кьянти, ~30 мин от Флоренции). Оценка 9.4/10. Ночь с 12 на 13 — между Флоренцией и Пизой.',
      },
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🚗 Переезд в Рим', status: 'drive',
        start: '2026-08-15', end: '2026-08-15', peopleIds: [P.me],
        notes: 'Едем в Рим — к 17:30 на пешую экскурсию (Треви, Пантеон). 15.08 — Феррагосто: выезжать пораньше, трафик.',
      },
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🏠 База 2 — Рокка-Приора (под Римом)', status: 'stay',
        start: '2026-08-15', end: '2026-08-21', peopleIds: [P.me],
        notes: 'Via Monte Ceraso, 24, Rocca Priora, 00079, Italy. Кастелли-Романи, ~40 мин до Рима.',
      },
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🚗 Дорога домой', status: 'drive',
        start: '2026-08-21', end: '2026-08-21', peopleIds: [P.me],
        notes: 'Выезжаем домой 21.08.',
      },
    );

    return { people, projects, dayPlans: seedDayPlans(), ascesis: seedAscesis(), personal: seedPersonal(), food: seedFood(), health: seedHealth(), seedVersion: SEED_VERSION };
  }

  // day-by-day itinerary, keyed by trip name → ISO date
  function seedDayPlans() {
    return {
      'Италия на машине': {
        '2026-08-07': { icon: '🚗', title: 'Выезжаем в Италию', text: 'Сегодня выезжаем из дома на машине и едем весь день.\n\nНочёвка в пути пока НЕ забронирована — по дороге ищем отель (примерно Австрия или самый север Италии) и останавливаемся на ночь.' },
        '2026-08-08': { icon: '🏠', title: 'Доезжаем и заселяемся', text: 'С утра едем дальше, к вечеру приезжаем на нашу первую базу.\n\nАдрес: Via Giacomo Matteotti 27, San Giovanni in Galilea (это Романья, рядом Римини).\n\nЗаселяемся, покупаем продукты, отдыхаем после дороги — сегодня больше ничего не планируем.' },
        '2026-08-09': { icon: '🏖', title: 'Пляж + Сан-Марино под вечер', text: 'Первый спокойный день, всё рядом с домом.\n\nЦель недели — больше пляжа и прогулок без спешки, так что начинаем расслабленно: днём море (Римини/Риччоне), пляж, обед у воды.\n\nПод вечер, когда спадёт жара, можно заскочить в Сан-Марино (~30 мин) — государство на горе, крепости и закатные виды. Или оставить его на потом и просто гулять по набережной.' },
        '2026-08-10': { icon: '💻', title: 'Работаем. Вечером — море рядом', text: 'Днём работаем на базе, заканчиваем к 17:00.\n\nВечер оставляем лёгким после первого рабочего дня: море в Римини/Риччоне, аперитив на берегу, закат. Или ужин в уютном Сантарканджело (~15 мин).' },
        '2026-08-11': { icon: '🍝', title: 'Работаем. Вечером — Болонья', text: 'Днём работаем, заканчиваем в 17:00.\n\nВечером едем в Болонью (~1 ч 10 мин): выезжаем ~17:15, к 18:30 на месте. Это не «осмотр города», а расслабленный вечер — аперитив (Болонья его родина), прогулка по портикам, площадь Маджоре и две башни в подсветке, ужин с местной пастой. Назад к ночи.\n\n⚠️ В середине августа часть ресторанов в Болонье закрыта на каникулы — лучше заранее выбрать и забронировать открытое место (надёжнее в центре / у университета).\n\nЕсли после работы нет сил на 2,5 часа дороги туда-обратно — переносим Болонью на другой вечер или просто остаёмся у моря.' },
        '2026-08-12': { icon: '🏛', title: 'Флоренция — экскурсия 10:00, ночь в Тоскане', text: 'Забронировано: экскурсия «The BEST tour in FLORENCE: Renaissance and Medici tales» — среда, 10:00, 2 взрослых (Free Walking Tours in Florence).\n\n⚠️ От Романьи до Флоренции ~2,5–3 ч — чтобы успеть к 10:00, выезжаем ~7:00. Машину на парковку Villa Costanza → в центр на трамвае (в центре на машине нельзя).\n\nПосле экскурсии — Дуомо, Понте-Веккьо, под вечер площадка Микеланджело.\n\n🏨 Ночуем рядом с Флоренцией: Tenuta Massabò, Via Gentilino 40, San Casciano in Val di Pesa (Кьянти, ~30 мин от центра, оценка 9.4).' },
        '2026-08-13': { icon: '🏖', title: 'Пиза, потом назад в Романью', text: 'Утром из Тосканы едем в Пизу (~1 ч от Флоренции).\n\nПлощадь Чудес (Campo dei Miracoli): падающая башня, собор, баптистерий — классические фото. Полдня хватает.\n\nПосле обеда — дорога обратно на базу 1 в Романью (~2,5 ч). Вечером отдыхаем у моря.' },
        '2026-08-14': { icon: '🏖', title: 'Пляжный день в Романье', text: 'Чистый чил после насыщенной Тосканы: море, пляж, долгий обед, прогулка. Без планов и спешки.\n\nЕсли захочется движения — рядом Равенна (мозаики, ~1 ч) или замки Градара/Сан-Лео, но только по желанию.\n\nВечером собираем вещи — завтра переезд в Рим.' },
        '2026-08-15': { icon: '🏛', title: 'Переезд в Рим + пешая экскурсия 17:30', text: 'Едем из Романьи в Рим (~4 ч) и заселяемся на базу 2 (Via Monte Ceraso 24, Rocca Priora).\n\nЗабронировано: «Rome Central Free Walking Tour» — Треви, Пантеон, 11+ точек — суббота, 17:30, 2 взрослых (Best Euro Tours).\n\n⚠️ 15.08 Феррагосто + 4 часа дороги: выезжаем РАНО с большим запасом, чтобы точно успеть к 17:30. Приезжаем, бросаем вещи — и на экскурсию.' },
        '2026-08-16': { icon: '🏛', title: 'Колизей 13:45', text: 'Забронировано: Колизей — 13:45 (по этому билету обычно входят и Римский форум с Палатином).\n\nВход днём, так что утро свободно — можно поспать подольше, спокойно доехать (~40 мин).\n\nПосле Колизея гуляем по центру и вечером — Трастевере (ужин, атмосфера).' },
        '2026-08-17': { icon: '💻', title: 'Работаем. Вечером — Фраскати', text: 'Рабочий день. Если хочется сменить обстановку — можно работать из кафе во Фраскати.\n\nВечером там же: местное белое вино фраскати, виды на Рим с холма, ужин.' },
        '2026-08-18': { icon: '💻', title: 'Работаем. Вечером — озеро Неми', text: 'Рабочий день.\n\nВечером едем к озеру Неми (~15 мин): крошечный городок на обрыве над круглым озером. Фирменное — клубника и десерты из неё.' },
        '2026-08-19': { icon: '🏛', title: 'Ватикан 8:00, потом работа', text: 'Забронировано: Ватиканские музеи — 8:00 (ранний вход = меньше толпы и жары). Сикстинская капелла, галереи. К обеду освобождаетесь.\n\nОт базы до Ватикана ~40–50 мин — выезжаем ~6:45.\n\nПосле — рабочий день (можно из кафе) или отдых. Вечером по желанию Аричча (поркетта во fraschette).' },
        '2026-08-20': { icon: '💻', title: 'Работаем. Вечером — озеро/Тиволи', text: 'Последний рабочий день.\n\nВечером на выбор: купание в озере Альбано и Кастель-Гандольфо — или, если хочется ещё одно место, съездить в Тиволи на виллу д’Эсте (сады с фонтанами, ~40 мин).\n\nВечером собираем вещи — завтра дорога домой.' },
        '2026-08-21': { icon: '🚗', title: 'Дорога домой', text: 'Выезжаем домой.\n\nДорога длинная (как и туда) — возможно, с одной ночёвкой в пути.' },
      },
    };
  }

  function seedAscesis() {
    return {
      start: todayISO(),
      years: 2,
      vow: 'Без сладкого. Кофе — сильно ограничить (можно изредка). Исключения — совсем небольшие, например в поездках.',
      goal: 'Зачем я это делаю — цель на 2 года:\n\n• Стать известной на международном уровне в своей сфере — AI в маркетинге и создании контента; конференции и спикерство по всему миру.\n• Запустить свой продукт, большие клиенты, высокая маржа и доход.\n• Поднять заработок так, чтобы спокойно позволить себе новый Porsche и дом там, где захочу, бизнес-класс и дорогие поездки.\n• Работать моделью — лицо обложек, приглашения, амбассадор больших брендов (Gucci, Prada, Lancôme).\n• Познакомиться с актёром Лин Хэ и, возможно, сделать совместный проект.\n• Выучить английский и китайский.\n• Свой бизнес и пассивный доход.\n• Внешность: отрастить волосы, выровнять зубы, наладить питание и кожу, улучшить фигуру — стать по-настоящему красивой.\n\nЖизнь меняется на 180°. Ради этого — держу аскезу.',
      marks: {},
    };
  }

  function seedPersonal() {
    const T = (group, text) => ({ id: uid(), group, text, done: false });
    return {
      yearGoals:
        '🎯 ЦЕЛИ НА ГОД\n\n' +
        'Ось года (из этого растёт всё остальное):\n' +
        '• Успешно закрыть 3-месячный пилот Dr. Max (AdScale/EScale) с жёсткими метриками → получить команду → масштабировать продукт. (Если команду не дают — осторожно открыть вопрос внешних инвестиций.)\n\n' +
        'Позиционирование:\n' +
        '• Закрепиться как эксперт по маркетингу с бизнес-стороны — кейсы с цифрами и строгими метриками, а не «контент ради контента».\n\n' +
        'Доход:\n' +
        '• Поднять доход с €3000 до €5000. Очередь: сначала пилот → команда/масштаб + платные воркшопы. Курсы и платформа с уроками — второй эшелон, ближе к концу года, когда есть кейс и имя.\n\n' +
        'Узнаваемость и поездки:\n' +
        '• Стать известной за пределами Польши — командировки, воркшопы (Польша + соседние страны).\n' +
        '• LinkedIn на английском: прогрев площадки → кейсы.\n\n' +
        'Фон без дедлайнов (дисциплина):\n' +
        '• Английский — 2 занятия в неделю.\n' +
        '• Внешность и здоровье — фигура, кожа, волосы, здоровье.\n\n' +
        'Парковка (не сейчас, запуск ПОСЛЕ команды):\n' +
        '• Бизнес БАДы/желе с подругой + ниша здоровья/HF/биохакинга. Триггер запуска = пилот закрыт + есть команда. До этого только наблюдения.\n' +
        '• Америка, Китай — год 2–3.',
      weekNote: '📅 Последняя полная неделя дома перед Италией — закрываем то, что нельзя сделать оттуда.\n\nПропускаем на этой неделе: час разведки (неделя перед отъездом — закрываем, не сеем).',
      weekTasks: [
        T('🔴 Приоритет (если неделя сожмётся — только это)', 'Решение по цене Dr. Max: посчитать стоимость добавленных генераций, прежде чем соглашаться на €1000. Сначала цифра. Если добавка съедает маржу — потолок на объём или отдельная строка.'),
        T('🔴 Приоритет (если неделя сожмётся — только это)', 'Бюрократия (день ногами, нельзя из Италии): запись на теорию по вождению + подача документов на паспорт + свидетельство о рождении на перевод/адаптацию.'),
        T('🔴 Приоритет (если неделя сожмётся — только это)', 'MD/созвон с командой по разбору основных поинтов акта — срочно, до отъезда.'),
        T('🟡 Работа-ось', 'Разбор комментариев Modivo с генератором (+ попросить вести лог цифр производства).'),
        T('🟡 Работа-ось', 'Доработка продукта Dr. Max под 3 месяца — цель: «может жить без меня». Не «идеально».'),
        T('🟡 Работа-ось', 'Тест гипотезы «видео из продуктового фида автоматически» — только проверка (час-два, да/нет), не проект.'),
        T('🟡 Работа-ось', 'Подготовиться к 3 месяцам Dr. Max насколько возможно + скоординировать остальные проекты.'),
        T('🟡 Работа-ось', 'Настроить логи метрик на обоих проектах перед Италией.'),
        T('🟢 Фон', 'Спорт ×3 (йога вторник 17:00 + ещё 2).'),
        T('🟢 Фон', 'Английский ×2.'),
      ],
      checkin: '✅ Воскресный чек-ин (2 минуты):\n1. Сдвинулась ли ось года — пилот Dr. Max?\n2. Что из недельного плана сделала, что нет и почему?\n3. Не залезла ли новая блестящая идея в две оси?',
    };
  }

  function seedFood() {
    return { days: {} };
  }

  function seedHealth() {
    const G = (text) => ({ id: uid(), text, done: false, note: '' });
    return {
      goalWeight: null,
      weights: {},   // iso -> кг
      habits: {},    // iso -> { water, sport, vitamins, skin, hair }
      goals: [
        G('Отрастить волосы'),
        G('Выровнять зубы'),
        G('Наладить кожу'),
        G('Улучшить фигуру'),
        G('Наладить питание'),
        G('Здоровье и энергия'),
      ],
    };
  }

  let seedMigrated = false;
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        // backfill for saves made before these modules existed
        if (!s.dayPlans) s.dayPlans = seedDayPlans();
        if (!s.ascesis) s.ascesis = seedAscesis();
        if (!s.personal) s.personal = seedPersonal();
        if (!s.food) s.food = seedFood();
        if (!s.health) s.health = seedHealth();
        // When the seeded itinerary changed, refresh ONLY the travel trip and
        // its day plans; keep work projects, people and Аскеза untouched.
        if (s.seedVersion !== SEED_VERSION) {
          const fresh = seedData();
          s.projects = (s.projects || []).filter(p => (p.sphere || 'work') !== 'travel')
            .concat(fresh.projects.filter(p => p.sphere === 'travel'));
          s.dayPlans = Object.assign({}, s.dayPlans, fresh.dayPlans);
          s.seedVersion = SEED_VERSION;
          seedMigrated = true;
        }
        return s;
      }
    } catch (e) { /* ignore corrupt storage */ }
    return seedData();
  }

  let state = loadState();
  let editingProjectId = null;
  let pfSelectedPeople = new Set();
  let filterPeople = new Set();
  let activeSphere = localStorage.getItem('active-sphere') || 'work';

  // per-sphere wording so the same UI reads naturally for projects and for trips
  const SPHERES = {
    work: {
      subtitle: 'Модуль «Работа»: проекты, таймлайн, букинг людей',
      sectionTitle: 'Проекты',
      addLabel: '+ Новый проект',
      filterLabel: 'Букинг:',
      emptyNote: 'Пока нет проектов. Нажми «+ Новый проект».',
      formProjectLabel: 'Проект',
      formProjectPlaceholder: 'Например, Modivo Veo Challenge',
    },
    travel: {
      subtitle: 'Модуль «Путешествия»: поездки и даты',
      sectionTitle: 'Путешествия',
      addLabel: '+ Новое путешествие',
      filterLabel: 'Кто едет:',
      emptyNote: 'Пока нет поездок. Нажми «+ Новое путешествие».',
      formProjectLabel: 'Путешествие',
      formProjectPlaceholder: 'Например, Италия на машине',
    },
    ascesis: {
      subtitle: 'Модуль «Аскеза»: обет и большая цель на 2 года',
      sectionTitle: 'Аскеза',
    },
    personal: {
      subtitle: 'Модуль «Личное»: цели на год и задачи на неделю',
      sectionTitle: 'Личное',
    },
    food: {
      subtitle: 'Модуль «Питание»: дневник по дням',
      sectionTitle: 'Дневник питания',
    },
    health: {
      subtitle: 'Модуль «Здоровье»: вес, привычки, внешность',
      sectionTitle: 'Здоровье',
    },
  };

  function isDimmed(pr) {
    return filterPeople.size > 0 && !pr.peopleIds.some(id => filterPeople.has(id));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      people: state.people, projects: state.projects,
      dayPlans: state.dayPlans || {}, ascesis: state.ascesis || null,
      personal: state.personal || null, food: state.food || null,
      health: state.health || null,
      seedVersion: state.seedVersion || SEED_VERSION,
    }));
  }
  // persist the auto-migration (refreshed itinerary) once on startup
  if (seedMigrated) save();

  function personName(id) {
    const p = state.people.find(x => x.id === id);
    return p ? p.name : '?';
  }

  // In-page confirm/alert: native confirm()/alert() are blocked in sandboxed
  // (artifact) contexts, where they silently no-op — so the app must not rely on them.
  const confirmOverlay = document.getElementById('confirmOverlay');
  const confirmTextEl = document.getElementById('confirmText');
  const confirmOkBtn = document.getElementById('confirmOk');
  const confirmCancelBtn = document.getElementById('confirmCancel');
  let confirmResolve = null;
  function confirmDialog(message) {
    confirmTextEl.textContent = message;
    confirmOverlay.hidden = false;
    return new Promise(resolve => { confirmResolve = resolve; });
  }
  function settleConfirm(result) {
    confirmOverlay.hidden = true;
    const r = confirmResolve;
    confirmResolve = null;
    if (r) r(result);
  }
  confirmOkBtn.addEventListener('click', () => settleConfirm(true));
  confirmCancelBtn.addEventListener('click', () => settleConfirm(false));
  confirmOverlay.addEventListener('click', (e) => { if (e.target === confirmOverlay) settleConfirm(false); });
  document.addEventListener('keydown', (e) => {
    if (!confirmOverlay.hidden && e.key === 'Escape') settleConfirm(false);
  });

  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => { toastEl.hidden = true; }, 250);
    }, 2600);
  }

  function rowLabel(task) {
    return task.phase && task.phase.trim() ? task.phase : task.project;
  }

  // client-feedback phases are coloured differently, matched by their name
  function isFeedback(task) {
    return /фидбек|feedback/i.test(task.phase || '');
  }

  // groups the active sphere's tasks by their parent, ordered by earliest start
  function groupedProjects() {
    const groups = new Map();
    state.projects
      .filter(t => (t.sphere || 'work') === activeSphere)
      .forEach(t => {
        if (!groups.has(t.project)) groups.set(t.project, []);
        groups.get(t.project).push(t);
      });
    const list = [...groups.entries()].map(([project, tasks]) => ({
      project,
      tasks: [...tasks].sort((a, b) => a.start.localeCompare(b.start)),
    }));
    list.sort((a, b) => a.tasks[0].start.localeCompare(b.tasks[0].start));
    return list;
  }

  // applies the active sphere's wording to the shared UI chrome
  function applySphereChrome() {
    const cfg = SPHERES[activeSphere] || SPHERES.work;
    document.getElementById('heroSubtitle').textContent = cfg.subtitle;
    document.getElementById('sectionTitle').textContent = cfg.sectionTitle;
    // Аскеза has no projects/people — hide the add button and booking filter
    const isProjectSphere = activeSphere === 'work' || activeSphere === 'travel';
    document.getElementById('addProject').style.display = isProjectSphere ? '' : 'none';
    document.getElementById('peopleFilterRow').style.display = isProjectSphere ? '' : 'none';
    if (isProjectSphere) {
      document.getElementById('addProject').textContent = cfg.addLabel;
      document.getElementById('filterLabel').textContent = cfg.filterLabel;
      document.getElementById('ganttEmpty').textContent = cfg.emptyNote;
    }
    document.querySelectorAll('.sphere-tab[data-sphere]').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.sphere === activeSphere);
    });
  }

  function setActiveSphere(sphere) {
    if (!SPHERES[sphere] || sphere === activeSphere) return;
    activeSphere = sphere;
    localStorage.setItem('active-sphere', sphere);
    filterPeople.clear();
    closeProjectForm();
    document.getElementById('peoplePanel').hidden = true;
    renderAll();
  }

  document.querySelectorAll('.sphere-tab[data-sphere]').forEach(tab => {
    tab.addEventListener('click', () => setActiveSphere(tab.dataset.sphere));
  });

  // ---------- theme ----------
  const root = document.documentElement;
  const themeIcon = document.getElementById('themeIcon');
  function applyTheme(mode) {
    if (mode) { root.setAttribute('data-theme', mode); localStorage.setItem('theme', mode); }
    else { root.removeAttribute('data-theme'); localStorage.removeItem('theme'); }
    const dark = mode ? mode === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    themeIcon.textContent = dark ? '☀️' : '🌙';
  }
  applyTheme(localStorage.getItem('theme'));
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = localStorage.getItem('theme');
    const dark = current ? current === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(dark ? 'light' : 'dark');
  });

  // ---------- people filter chips (booking) ----------
  function renderPeopleChips() {
    const el = document.getElementById('peopleChips');
    el.innerHTML = '';
    state.people.forEach(p => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (filterPeople.has(p.id) ? ' selected' : '');
      chip.textContent = p.name;
      chip.addEventListener('click', () => {
        if (filterPeople.has(p.id)) filterPeople.delete(p.id); else filterPeople.add(p.id);
        renderPeopleChips();
        renderProjects();
      });
      el.appendChild(chip);
    });
    if (state.people.length === 0) {
      const note = document.createElement('span');
      note.className = 'footer-note';
      note.textContent = 'Добавь людей, чтобы фильтровать букинг';
      el.appendChild(note);
    }
  }

  // ---------- people management ----------
  const peoplePanel = document.getElementById('peoplePanel');
  document.getElementById('managePeople').addEventListener('click', () => {
    peoplePanel.hidden = !peoplePanel.hidden;
    if (!peoplePanel.hidden) renderPeopleList();
  });
  document.getElementById('closePeople').addEventListener('click', () => { peoplePanel.hidden = true; });

  function renderPeopleList() {
    const ul = document.getElementById('peopleList');
    ul.innerHTML = '';
    state.people.forEach(p => {
      const li = document.createElement('li');
      li.className = 'people-row';
      const name = document.createElement('span');
      name.textContent = p.name;
      const del = document.createElement('button');
      del.className = 'icon-only';
      del.textContent = '✕';
      del.title = 'Удалить человека';
      del.addEventListener('click', async () => {
        if (!await confirmDialog(`Удалить «${p.name}» из списка людей?`)) return;
        state.people = state.people.filter(x => x.id !== p.id);
        state.projects.forEach(pr => { pr.peopleIds = pr.peopleIds.filter(id => id !== p.id); });
        filterPeople.delete(p.id);
        save();
        renderPeopleList();
        renderPeopleChips();
        renderProjects();
      });
      li.appendChild(name);
      li.appendChild(del);
      ul.appendChild(li);
    });
  }

  document.getElementById('addPersonBtn').addEventListener('click', addPerson);
  document.getElementById('newPersonName').addEventListener('keydown', e => { if (e.key === 'Enter') addPerson(); });
  function addPerson() {
    const input = document.getElementById('newPersonName');
    const name = input.value.trim();
    if (!name) return;
    state.people.push({ id: uid(), name });
    input.value = '';
    save();
    renderPeopleList();
    renderPeopleChips();
  }

  // ---------- project form ----------
  const projectFormCard = document.getElementById('projectFormCard');
  function openProjectForm(task, presetProject) {
    editingProjectId = task ? task.id : null;
    pfSelectedPeople = new Set(task ? task.peopleIds : []);
    const cfg = SPHERES[activeSphere] || SPHERES.work;
    document.getElementById('projectFormTitle').textContent = task
      ? 'Редактировать'
      : (activeSphere === 'travel' ? 'Новое путешествие' : 'Новый проект / этап');
    const pfProjectEl = document.getElementById('pfProject');
    pfProjectEl.closest('.field').querySelector('span').textContent = cfg.formProjectLabel;
    pfProjectEl.placeholder = cfg.formProjectPlaceholder;
    pfProjectEl.value = task ? task.project : (presetProject || '');
    document.getElementById('pfPhase').value = task ? (task.phase || '') : '';
    document.getElementById('pfStart').value = task ? task.start : todayISO();
    document.getElementById('pfEnd').value = task ? task.end : addDaysISO(todayISO(), 14);
    // status options depend on the sphere (work vs travel)
    const statusKeys = SPHERE_STATUSES[activeSphere] || SPHERE_STATUSES.work;
    const statusSel = document.getElementById('pfStatus');
    statusSel.innerHTML = '';
    statusKeys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${STATUS[k].icon} ${STATUS[k].label}`;
      statusSel.appendChild(opt);
    });
    statusSel.value = task ? task.status : statusKeys[0];
    document.getElementById('pfNotes').value = task ? (task.notes || '') : '';
    document.getElementById('deleteProjectBtn').hidden = !task;
    renderPfPeople();
    projectFormCard.hidden = false;
    projectFormCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function closeProjectForm() { projectFormCard.hidden = true; editingProjectId = null; }

  function renderPfPeople() {
    const el = document.getElementById('pfPeople');
    el.innerHTML = '';
    if (state.people.length === 0) {
      const note = document.createElement('span');
      note.className = 'footer-note';
      note.textContent = 'Сначала добавь людей (кнопка «Люди»)';
      el.appendChild(note);
      return;
    }
    state.people.forEach(p => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (pfSelectedPeople.has(p.id) ? ' selected' : '');
      chip.textContent = p.name;
      chip.addEventListener('click', () => {
        if (pfSelectedPeople.has(p.id)) pfSelectedPeople.delete(p.id); else pfSelectedPeople.add(p.id);
        renderPfPeople();
      });
      el.appendChild(chip);
    });
    el.parentElement.classList.add('chips-select');
  }

  document.getElementById('addProject').addEventListener('click', () => openProjectForm(null));
  document.getElementById('closeProjectForm').addEventListener('click', closeProjectForm);

  document.getElementById('saveProjectBtn').addEventListener('click', () => {
    const project = document.getElementById('pfProject').value.trim();
    const phase = document.getElementById('pfPhase').value.trim();
    const start = document.getElementById('pfStart').value;
    const end = document.getElementById('pfEnd').value;
    const status = document.getElementById('pfStatus').value;
    const notes = document.getElementById('pfNotes').value.trim();
    if (!project) { toast('Укажи название проекта'); return; }
    if (!start || !end) { toast('Укажи даты начала и конца'); return; }
    if (end < start) { toast('Дата конца раньше даты начала'); return; }

    if (editingProjectId) {
      const pr = state.projects.find(x => x.id === editingProjectId);
      Object.assign(pr, { project, phase, start, end, status, notes, peopleIds: [...pfSelectedPeople] });
    } else {
      state.projects.push({ id: uid(), sphere: activeSphere, project, phase, start, end, status, notes, peopleIds: [...pfSelectedPeople] });
    }
    save();
    closeProjectForm();
    renderProjects();
  });

  document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
    const pr = state.projects.find(x => x.id === editingProjectId);
    if (!pr) return;
    if (!await confirmDialog(`Удалить «${rowLabel(pr)}»?`)) return;
    state.projects = state.projects.filter(x => x.id !== editingProjectId);
    save();
    closeProjectForm();
    renderProjects();
  });

  // ---------- tooltip (shared, viewport-fixed so it works across every project card) ----------
  const tooltip = document.getElementById('ganttTooltip');
  function showTooltip(evt, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = evt.clientX + 'px';
    tooltip.style.top = evt.clientY + 'px';
    tooltip.hidden = false;
  }
  function hideTooltip() { tooltip.hidden = true; }

  // ---------- one project's mini Gantt ----------
  function buildGanttChart(tasks) {
    const chartEl = document.createElement('div');
    chartEl.className = 'gantt-chart';

    const t = todayISO();
    let minStart = tasks.reduce((m, p) => p.start < m ? p.start : m, tasks[0].start);
    let maxEnd = tasks.reduce((m, p) => p.end > m ? p.end : m, tasks[0].end);
    minStart = addDaysISO(minStart < t ? minStart : t, -3);
    maxEnd = addDaysISO(maxEnd > t ? maxEnd : t, 4);

    const totalDays = Math.max(1, Math.round((isoToUTCDate(maxEnd) - isoToUTCDate(minStart)) / DAY_MS));
    const availableWidth = Math.max(280, (chartEl.ownerDocument.documentElement.clientWidth || 900) - LABELS_W - 120);
    const pxPerDay = Math.max(16, Math.min(48, availableWidth / totalDays));
    const svgWidth = Math.max(availableWidth, totalDays * pxPerDay);
    const svgHeight = HEADER_H + tasks.length * ROW_H;

    function xForDate(iso) {
      return Math.round((isoToUTCDate(iso) - isoToUTCDate(minStart)) / DAY_MS * pxPerDay);
    }

    // labels column
    const labelsCol = document.createElement('div');
    labelsCol.className = 'gantt-labels';
    const labelHeader = document.createElement('div');
    labelHeader.className = 'gantt-label-header';
    labelsCol.appendChild(labelHeader);
    tasks.forEach(pr => {
      const row = document.createElement('div');
      row.className = 'gantt-label-row';
      row.title = rowLabel(pr);
      row.textContent = rowLabel(pr);
      if (isDimmed(pr)) row.classList.add('gantt-row-dim');
      labelsCol.appendChild(row);
    });

    // scrollable svg
    const scrollCol = document.createElement('div');
    scrollCol.className = 'gantt-scroll';
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', svgWidth);
    svg.setAttribute('height', svgHeight);
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Диаграмма Ганта по этапам проекта');

    const maxEndDate = isoToUTCDate(maxEnd);

    // weekend shading (Sat + Sun) — a light band behind everything so the
    // reader can see where the weekends fall between the week gridlines.
    const dayCursor = isoToUTCDate(minStart);
    while (dayCursor <= maxEndDate) {
      const dow = dayCursor.getUTCDay(); // 0 = Sun, 6 = Sat
      if (dow === 0 || dow === 6) {
        const x = xForDate(utcDateToISO(dayCursor));
        const band = document.createElementNS(svgNS, 'rect');
        band.setAttribute('x', x);
        band.setAttribute('y', HEADER_H);
        band.setAttribute('width', pxPerDay);
        band.setAttribute('height', svgHeight - HEADER_H);
        band.setAttribute('fill', 'var(--weekend-band)');
        band.setAttribute('pointer-events', 'none');
        svg.appendChild(band);
      }
      dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
    }

    // week gridlines (every Monday) — thin, subtle, with a short date tick
    const weekCursor = isoToUTCDate(minStart);
    while (weekCursor.getUTCDay() !== 1) weekCursor.setUTCDate(weekCursor.getUTCDate() - 1);
    while (weekCursor <= maxEndDate) {
      const iso = utcDateToISO(weekCursor);
      if (iso >= minStart) {
        const x = xForDate(iso);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x); line.setAttribute('x2', x);
        line.setAttribute('y1', HEADER_H); line.setAttribute('y2', svgHeight);
        line.setAttribute('stroke', 'var(--gridline)');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
        const wLabel = document.createElementNS(svgNS, 'text');
        wLabel.setAttribute('x', x + 3);
        wLabel.setAttribute('y', HEADER_H - 4);
        wLabel.setAttribute('fill', 'var(--text-muted)');
        wLabel.setAttribute('font-size', '9.5');
        wLabel.textContent = fmtDateShort(iso);
        svg.appendChild(wLabel);
      }
      weekCursor.setUTCDate(weekCursor.getUTCDate() + 7);
    }

    // month gridlines + labels (bolder, drawn on top of week lines)
    const monthCursor = isoToUTCDate(minStart);
    monthCursor.setUTCDate(1);
    while (monthCursor <= maxEndDate) {
      const iso = utcDateToISO(monthCursor);
      if (iso >= minStart) {
        const x = xForDate(iso);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x); line.setAttribute('x2', x);
        line.setAttribute('y1', HEADER_H); line.setAttribute('y2', svgHeight);
        line.setAttribute('stroke', 'var(--baseline)');
        line.setAttribute('stroke-width', '1.5');
        svg.appendChild(line);
        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', x + 4);
        label.setAttribute('y', 12);
        label.setAttribute('fill', 'var(--text-secondary)');
        label.setAttribute('font-size', '11');
        label.setAttribute('font-weight', '700');
        label.textContent = monthCursor.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        svg.appendChild(label);
      }
      monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1);
    }

    // row separators
    tasks.forEach((pr, i) => {
      const y = HEADER_H + i * ROW_H + ROW_H;
      const sep = document.createElementNS(svgNS, 'line');
      sep.setAttribute('x1', 0); sep.setAttribute('x2', svgWidth);
      sep.setAttribute('y1', y); sep.setAttribute('y2', y);
      sep.setAttribute('stroke', 'var(--gridline)');
      sep.setAttribute('stroke-width', '1');
      svg.appendChild(sep);
    });

    // today line
    if (t >= minStart && t <= maxEnd) {
      const xToday = xForDate(t);
      const todayLine = document.createElementNS(svgNS, 'line');
      todayLine.setAttribute('x1', xToday); todayLine.setAttribute('x2', xToday);
      todayLine.setAttribute('y1', HEADER_H); todayLine.setAttribute('y2', svgHeight);
      todayLine.setAttribute('stroke', 'var(--series-1)');
      todayLine.setAttribute('stroke-width', '1.5');
      svg.appendChild(todayLine);
      const flagY = HEADER_H + 3;
      const todayFlag = document.createElementNS(svgNS, 'rect');
      todayFlag.setAttribute('x', xToday + 3);
      todayFlag.setAttribute('y', flagY);
      todayFlag.setAttribute('width', 48);
      todayFlag.setAttribute('height', 14);
      todayFlag.setAttribute('rx', 4);
      todayFlag.setAttribute('fill', 'var(--series-1)');
      svg.appendChild(todayFlag);
      const todayLabel = document.createElementNS(svgNS, 'text');
      todayLabel.setAttribute('x', xToday + 7);
      todayLabel.setAttribute('y', flagY + 10);
      todayLabel.setAttribute('fill', '#fff');
      todayLabel.setAttribute('font-size', '9.5');
      todayLabel.setAttribute('font-weight', '700');
      todayLabel.textContent = 'Сегодня';
      svg.appendChild(todayLabel);
    }

    // bars
    const HANDLE_W = 8;
    tasks.forEach((pr, i) => {
      const y = HEADER_H + i * ROW_H + (ROW_H - 18) / 2;
      const rowTop = HEADER_H + i * ROW_H + 1;
      const rowH = ROW_H - 2;
      const dimmed = isDimmed(pr);

      // client-feedback phases get their own colour, whatever their status
      const fillVar = isFeedback(pr) ? '--feedback-ink' : STATUS[pr.status].varName;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('y', y);
      rect.setAttribute('height', 18);
      rect.setAttribute('rx', 4);
      rect.setAttribute('fill', `var(${fillVar})`);
      rect.setAttribute('opacity', dimmed ? 0.25 : 0.92);
      rect.setAttribute('pointer-events', 'none'); // purely decorative — the hit rects handle interaction
      rect.classList.add('gantt-bar-fill');

      // Transparent hit targets spanning the full row height (the visible bar is
      // only 18px tall, too thin to grab precisely with a mouse or a finger):
      // a middle zone to move the whole bar, and two edge zones to resize it —
      // shrink/stretch the start or the end independently.
      const hitMove = document.createElementNS(svgNS, 'rect');
      hitMove.setAttribute('y', rowTop);
      hitMove.setAttribute('height', rowH);
      hitMove.setAttribute('fill', 'transparent');
      hitMove.setAttribute('pointer-events', 'all');
      hitMove.classList.add('gantt-bar-hit');
      hitMove.tabIndex = 0;

      const hitStart = document.createElementNS(svgNS, 'rect');
      hitStart.setAttribute('y', rowTop);
      hitStart.setAttribute('width', HANDLE_W);
      hitStart.setAttribute('height', rowH);
      hitStart.setAttribute('fill', 'transparent');
      hitStart.setAttribute('pointer-events', 'all');
      hitStart.classList.add('gantt-bar-handle');

      const hitEnd = document.createElementNS(svgNS, 'rect');
      hitEnd.setAttribute('y', rowTop);
      hitEnd.setAttribute('width', HANDLE_W);
      hitEnd.setAttribute('height', rowH);
      hitEnd.setAttribute('fill', 'transparent');
      hitEnd.setAttribute('pointer-events', 'all');
      hitEnd.classList.add('gantt-bar-handle');

      const gripStart = document.createElementNS(svgNS, 'rect');
      gripStart.setAttribute('y', y + 4);
      gripStart.setAttribute('width', 3);
      gripStart.setAttribute('height', 10);
      gripStart.setAttribute('rx', 1.5);
      gripStart.setAttribute('fill', 'rgba(255,255,255,0.7)');
      gripStart.setAttribute('pointer-events', 'none');
      gripStart.classList.add('gantt-bar-grip');

      const gripEnd = gripStart.cloneNode();

      // Positions every visual/hit element from a start/end pixel range. Reused
      // for the initial layout and for every live update while dragging.
      function layout(px1, px2) {
        const w = Math.max(6, px2 - px1);
        rect.setAttribute('x', px1);
        rect.setAttribute('width', w);
        if (w >= HANDLE_W * 2 + 10) {
          hitStart.setAttribute('x', px1);
          hitEnd.setAttribute('x', px2 - HANDLE_W);
          hitMove.setAttribute('x', px1 + HANDLE_W);
          hitMove.setAttribute('width', Math.max(1, w - HANDLE_W * 2));
          hitStart.style.display = '';
          hitEnd.style.display = '';
          gripStart.setAttribute('x', px1 + 2);
          gripEnd.setAttribute('x', px2 - 5);
          gripStart.style.display = '';
          gripEnd.style.display = '';
        } else {
          hitMove.setAttribute('x', px1);
          hitMove.setAttribute('width', w);
          hitStart.style.display = 'none';
          hitEnd.style.display = 'none';
          gripStart.style.display = 'none';
          gripEnd.style.display = 'none';
        }
      }
      layout(xForDate(pr.start), xForDate(addDaysISO(pr.end, 1)));

      const peopleStr = pr.peopleIds.length ? pr.peopleIds.map(personName).join(', ') : '—';
      const showTip = (evt) => {
        showTooltip(evt, `
          <div><b>${escapeHtml(rowLabel(pr))}</b></div>
          <div>${STATUS[pr.status].icon} ${STATUS[pr.status].label} · ${fmtDate(pr.start)} – ${fmtDate(pr.end)}</div>
          <div class="tt-people">👤 ${escapeHtml(peopleStr)}</div>
          ${pr.notes ? `<div class="tt-notes">${escapeHtml(pr.notes)}</div>` : ''}
        `);
      };
      const showDragTip = (evt, newStart, newEnd) => {
        showTooltip(evt, `
          <div><b>${escapeHtml(rowLabel(pr))}</b></div>
          <div>${fmtDate(newStart)} – ${fmtDate(newEnd)}</div>
        `);
      };

      // Dragging (move and resize alike) is implemented with window-level
      // listeners rather than setPointerCapture, which is unreliable on SVG
      // elements in some browsers, so a drag keeps tracking the pointer even
      // once it leaves the element it started on.
      let drag = null; // { mode: 'move'|'start'|'end', startClientX, origStart, origEnd, moved }
      const onDragMove = (evt) => {
        if (!drag) return;
        const dxPx = evt.clientX - drag.startClientX;
        if (Math.abs(dxPx) > 3) drag.moved = true;
        const daysDelta = Math.round(dxPx / pxPerDay);
        let newStart = drag.origStart;
        let newEnd = drag.origEnd;
        if (drag.mode === 'move') {
          newStart = addDaysISO(drag.origStart, daysDelta);
          newEnd = addDaysISO(drag.origEnd, daysDelta);
        } else if (drag.mode === 'start') {
          newStart = addDaysISO(drag.origStart, daysDelta);
          if (newStart > drag.origEnd) newStart = drag.origEnd;
        } else {
          newEnd = addDaysISO(drag.origEnd, daysDelta);
          if (newEnd < drag.origStart) newEnd = drag.origStart;
        }
        layout(xForDate(newStart), xForDate(addDaysISO(newEnd, 1)));
        if (drag.moved) showDragTip(evt, newStart, newEnd);
      };
      const onDragEnd = (evt) => {
        if (!drag) return;
        window.removeEventListener('pointermove', onDragMove);
        window.removeEventListener('pointerup', onDragEnd);
        window.removeEventListener('pointercancel', onDragEnd);
        rect.classList.remove('dragging');
        const dxPx = evt.clientX - drag.startClientX;
        const daysDelta = Math.round(dxPx / pxPerDay);
        const wasDrag = drag.moved;
        const mode = drag.mode;
        let newStart = drag.origStart;
        let newEnd = drag.origEnd;
        if (mode === 'move') {
          newStart = addDaysISO(drag.origStart, daysDelta);
          newEnd = addDaysISO(drag.origEnd, daysDelta);
        } else if (mode === 'start') {
          newStart = addDaysISO(drag.origStart, daysDelta);
          if (newStart > drag.origEnd) newStart = drag.origEnd;
        } else {
          newEnd = addDaysISO(drag.origEnd, daysDelta);
          if (newEnd < drag.origStart) newEnd = drag.origStart;
        }
        drag = null;
        hideTooltip();
        if (wasDrag && (newStart !== pr.start || newEnd !== pr.end)) {
          pr.start = newStart;
          pr.end = newEnd;
          save();
          renderProjects();
        } else if (!wasDrag) {
          layout(xForDate(pr.start), xForDate(addDaysISO(pr.end, 1))); // snap back
          openProjectForm(pr);
        } else {
          layout(xForDate(pr.start), xForDate(addDaysISO(pr.end, 1))); // snap back, nothing changed
        }
      };
      const startDrag = (mode) => (evt) => {
        if (evt.button !== undefined && evt.button !== 0) return;
        evt.preventDefault();
        drag = { mode, startClientX: evt.clientX, origStart: pr.start, origEnd: pr.end, moved: false };
        rect.classList.add('dragging');
        window.addEventListener('pointermove', onDragMove);
        window.addEventListener('pointerup', onDragEnd);
        window.addEventListener('pointercancel', onDragEnd);
      };
      hitMove.addEventListener('pointerdown', startDrag('move'));
      hitStart.addEventListener('pointerdown', startDrag('start'));
      hitEnd.addEventListener('pointerdown', startDrag('end'));
      hitMove.addEventListener('pointerenter', (evt) => { if (!drag) { rect.classList.add('hovered'); showTip(evt); } });
      hitMove.addEventListener('focus', showTip);
      hitMove.addEventListener('pointerleave', () => { if (!drag) { rect.classList.remove('hovered'); hideTooltip(); } });
      hitMove.addEventListener('blur', () => { if (!drag) hideTooltip(); });
      svg.appendChild(rect);
      svg.appendChild(gripStart);
      svg.appendChild(gripEnd);
      svg.appendChild(hitMove);
      svg.appendChild(hitStart);
      svg.appendChild(hitEnd);
    });

    scrollCol.appendChild(svg);
    const inner = document.createElement('div');
    inner.className = 'gantt-inner';
    inner.appendChild(labelsCol);
    inner.appendChild(scrollCol);
    chartEl.appendChild(inner);

    requestAnimationFrame(() => {
      if (t >= minStart && t <= maxEnd) {
        const visibleWidth = scrollCol.clientWidth;
        scrollCol.scrollLeft = Math.max(0, xForDate(t) - visibleWidth / 2);
      }
    });

    return chartEl;
  }

  // ---------- all project cards ----------
  function renderProjects() {
    const container = document.getElementById('projectsContainer');
    const emptyEl = document.getElementById('ganttEmpty');
    container.innerHTML = '';

    if (activeSphere === 'ascesis') {
      emptyEl.hidden = true;
      renderAscesis(container);
      return;
    }
    if (activeSphere === 'personal') {
      emptyEl.hidden = true;
      renderPersonal(container);
      return;
    }
    if (activeSphere === 'food') {
      emptyEl.hidden = true;
      renderFood(container);
      return;
    }
    if (activeSphere === 'health') {
      emptyEl.hidden = true;
      renderHealth(container);
      return;
    }

    const groups = groupedProjects();
    emptyEl.hidden = groups.length > 0;

    groups.forEach(({ project, tasks }) => {
      const card = document.createElement('section');
      card.className = 'card';

      const head = document.createElement('div');
      head.className = 'card-head';
      const h2 = document.createElement('h2');
      h2.textContent = project;
      const addPhaseBtn = document.createElement('button');
      addPhaseBtn.type = 'button';
      addPhaseBtn.className = 'btn btn-ghost btn-small';
      addPhaseBtn.textContent = '+ Этап';
      addPhaseBtn.addEventListener('click', () => openProjectForm(null, project));
      head.appendChild(h2);
      head.appendChild(addPhaseBtn);

      card.appendChild(head);
      card.appendChild(buildGanttChart(tasks));
      if (activeSphere === 'travel') {
        const planner = buildDayPlanner(project, tasks);
        if (planner) card.appendChild(planner);
        const tripMap = buildTripMap(project);
        if (tripMap) card.appendChild(tripMap);
      }
      container.appendChild(card);
    });
  }

  // ---------- day-by-day planner (travel) ----------
  // A strip of clickable day chips under the trip's Gantt; the selected day's
  // plan (what we visit) shows beneath and is editable in place.
  const selectedDayByTrip = {};
  function buildDayPlanner(projectName, tasks) {
    const minStart = tasks.reduce((m, p) => p.start < m ? p.start : m, tasks[0].start);
    const maxEnd = tasks.reduce((m, p) => p.end > m ? p.end : m, tasks[0].end);
    if (!state.dayPlans) state.dayPlans = {};
    if (!state.dayPlans[projectName]) state.dayPlans[projectName] = {};
    const plans = state.dayPlans[projectName];

    const t = todayISO();
    let selected = selectedDayByTrip[projectName];
    if (!selected || selected < minStart || selected > maxEnd) {
      selected = (t >= minStart && t <= maxEnd) ? t : minStart;
      selectedDayByTrip[projectName] = selected;
    }

    const wrap = document.createElement('div');
    wrap.className = 'day-planner';

    const strip = document.createElement('div');
    strip.className = 'day-strip';
    const chipByIso = {};
    for (let iso = minStart; iso <= maxEnd; iso = addDaysISO(iso, 1)) {
      const dayIso = iso;
      const d = isoToUTCDate(dayIso);
      const dow = d.getUTCDay();
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'day-chip' + ((dow === 0 || dow === 6) ? ' weekend' : '');
      const dowStr = d.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' });
      chip.innerHTML = `
        <span class="d-dow">${escapeHtml(dowStr)}</span>
        <span class="d-num">${d.getUTCDate()}</span>
        <span class="d-ico">${plans[dayIso] ? plans[dayIso].icon : '·'}</span>
      `;
      // Update the detail in place — do NOT re-render the whole page, or the
      // window scroll position jumps back to the top on every day switch.
      chip.addEventListener('click', () => selectDay(dayIso));
      chipByIso[dayIso] = chip;
      strip.appendChild(chip);
    }
    wrap.appendChild(strip);

    const detail = document.createElement('div');
    detail.className = 'day-detail';
    wrap.appendChild(detail);

    function renderDetail() {
      const sel = selectedDayByTrip[projectName];
      const plan = plans[sel] || {};
      detail.innerHTML = '';

      const title = document.createElement('div');
      title.className = 'day-detail-title';
      const dateStr = isoToUTCDate(sel).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
      title.textContent = `${plan.icon ? plan.icon + ' ' : ''}${dateStr}${plan.title ? ' — ' + plan.title : ''}`;

      const text = document.createElement('textarea');
      text.className = 'day-detail-text';
      text.rows = Math.min(12, Math.max(4, (plan.text || '').split('\n').length + 1));
      text.placeholder = 'Что делаем в этот день? Пиши прямо сюда — сохранится само.';
      text.value = plan.text || '';
      text.addEventListener('change', () => {
        if (!plans[sel]) plans[sel] = { icon: '📍', title: '', text: '' };
        plans[sel].text = text.value.trim();
        save();
        const ico = chipByIso[sel] && chipByIso[sel].querySelector('.d-ico');
        if (ico) ico.textContent = plans[sel].icon;
      });
      detail.appendChild(title);
      detail.appendChild(text);

      // Google Maps links for this day's places (from the trip map data)
      const tripData = TRIP_MAPS[projectName];
      if (tripData) {
        const pts = tripData.points.filter(p => p.day === sel);
        if (pts.length) {
          const links = document.createElement('div');
          links.className = 'day-links';
          pts.forEach(p => {
            const a = document.createElement('a');
            a.className = 'day-link';
            a.href = gmapsPointUrl(p);
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = `📍 ${p.name.replace(/\s*\(.*\)$/, '')}`;
            links.appendChild(a);
          });
          detail.appendChild(links);
        }
      }
    }

    function selectDay(iso) {
      selectedDayByTrip[projectName] = iso;
      Object.entries(chipByIso).forEach(([k, el]) => el.classList.toggle('selected', k === iso));
      renderDetail();
      // keep the chosen chip centred in the strip; horizontal only, so the
      // page's own vertical scroll never moves
      const sel = chipByIso[iso];
      if (sel) strip.scrollLeft = Math.max(0, sel.offsetLeft - strip.clientWidth / 2 + sel.offsetWidth / 2);
    }

    // initial state
    Object.entries(chipByIso).forEach(([k, el]) => el.classList.toggle('selected', k === selected));
    renderDetail();
    requestAnimationFrame(() => {
      const sel = chipByIso[selected];
      if (sel) strip.scrollLeft = Math.max(0, sel.offsetLeft - strip.clientWidth / 2 + sel.offsetWidth / 2);
    });

    return wrap;
  }

  // ---------- trip map (travel) ----------
  // Two renderers behind one entry point: a real Leaflet/OSM map when the
  // Leaflet CDN loaded (GitHub Pages build), otherwise a self-contained SVG
  // schematic (the claude.ai artifact blocks all external hosts).
  const MAP_POINT_COLORS = { base: '#2a78d6', day: '#0ca30c', evening: '#6c4fd6' };
  function gmapsPointUrl(p) {
    return `https://www.google.com/maps/search/?api=1&query=${p.lat}%2C${p.lon}`;
  }
  const TRIP_MAPS = {
    'Италия на машине': {
      gmapsRoute: 'https://www.google.com/maps/dir/?api=1'
        + '&origin=' + encodeURIComponent('Via Giacomo Matteotti 27, San Giovanni in Galilea, Italy')
        + '&destination=' + encodeURIComponent('Via Monte Ceraso 24, Rocca Priora, Italy'),
      route: [
        [46.99, 11.51], [46.07, 11.12], [45.44, 10.99], [44.49, 11.34], [44.031, 12.288],
        [43.769, 11.256], [43.723, 10.396], [42.4, 11.8], [41.793, 12.760],
      ],
      points: [
        { name: 'База 1 · Сан-Джованни-ин-Галилея (8–15.08)', lat: 44.031, lon: 12.288, kind: 'base', label: 'База 1', anchor: 'end', dx: -7, dy: -5 },
        { name: 'База 2 · Рокка-Приора (15–21.08)', lat: 41.793, lon: 12.760, kind: 'base', label: 'База 2', dx: 8, dy: 12 },
        { name: 'Сан-Марино', lat: 43.936, lon: 12.447, kind: 'day', day: '2026-08-09', label: 'Сан-Марино', anchor: 'end', dx: -7, dy: 10 },
        { name: 'Римини', lat: 44.059, lon: 12.568, kind: 'day', day: '2026-08-09', label: 'Римини', dx: 7, dy: 1 },
        { name: 'Флоренция — экскурсия 10:00', lat: 43.769, lon: 11.256, kind: 'day', day: '2026-08-12', label: 'Флоренция', anchor: 'end', dx: -7, dy: 3 },
        { name: 'Ночь: Tenuta Massabò (Кьянти)', lat: 43.657, lon: 11.186, kind: 'base', day: '2026-08-12' },
        { name: 'Пиза — падающая башня', lat: 43.723, lon: 10.396, kind: 'day', day: '2026-08-13', label: 'Пиза', anchor: 'end', dx: -7, dy: 10 },
        { name: 'Болонья (вечер вт)', lat: 44.494, lon: 11.343, kind: 'evening', day: '2026-08-11', label: 'Болонья', anchor: 'end', dx: -7, dy: 3 },
        { name: 'Сантарканджело (вечер пн)', lat: 44.063, lon: 12.446, kind: 'evening', day: '2026-08-10' },
        { name: 'Равенна (опция)', lat: 44.418, lon: 12.201, kind: 'evening', day: '2026-08-14', label: 'Равенна', dx: 7, dy: -3 },
        { name: 'Колизей — 13:45', lat: 41.890, lon: 12.492, kind: 'day', day: '2026-08-16', label: 'Рим', anchor: 'end', dx: -7, dy: 3 },
        { name: 'Пешая экскурсия 17:30 (Треви, Пантеон)', lat: 41.899, lon: 12.477, kind: 'day', day: '2026-08-15' },
        { name: 'Ватиканские музеи — 8:00', lat: 41.9065, lon: 12.4536, kind: 'day', day: '2026-08-19', label: 'Ватикан', anchor: 'end', dx: -7, dy: -4 },
        { name: 'Тиволи (опция)', lat: 41.963, lon: 12.798, kind: 'evening', day: '2026-08-20', label: 'Тиволи', dx: 7, dy: -2 },
        { name: 'Фраскати (вечер)', lat: 41.808, lon: 12.681, kind: 'evening', day: '2026-08-17' },
        { name: 'Неми (вечер)', lat: 41.720, lon: 12.716, kind: 'evening', day: '2026-08-18' },
        { name: 'Аричча (вечер)', lat: 41.720, lon: 12.672, kind: 'evening', day: '2026-08-19' },
        { name: 'Кастель-Гандольфо (вечер)', lat: 41.746, lon: 12.650, kind: 'evening', day: '2026-08-20' },
      ],
    },
  };

  // schematic projection constants — must match the generator that produced ITALY_PATH
  const MAPP = { LON_MIN: 8.8, LAT_MAX: 47.2, K: Math.cos(44 * Math.PI / 180), S: 88, W: 380, H: 528 };
  const ITALY_PATH = 'M425.4 789.3L402.6 858.5L412.1 885.8L398.8 931.0L350.4 897.9L318.2 888.4L229.8 843.7L238.7 798.5L312.8 806.5L377.4 796.9L425.4 789.3ZM26.0 527.1L63.9 589.6L55.0 706.0L26.3 700.4L0.4 729.8L-23.5 706.5L-26.1 600.3L-40.5 550.0L-5.7 554.4L26.0 527.1ZM226.4 38.1L316.9 60.8L310.1 104.1L325.2 141.6L274.8 128.8L223.4 160.0L226.9 203.7L219.1 228.8L239.9 273.6L299.2 317.9L331.1 390.6L401.5 461.5L451.1 461.0L466.5 480.5L448.8 498.0L505.5 529.8L551.9 556.4L606.2 602.3L612.8 618.7L600.9 650.3L565.8 609.2L510.8 594.7L484.2 651.6L529.9 684.2L522.4 730.1L496.0 735.4L462.2 810.8L435.8 817.6L436.0 790.7L448.9 743.5L462.7 724.7L438.0 673.7L418.7 629.3L392.4 618.4L373.7 580.4L333.0 564.4L305.6 529.0L258.8 523.3L209.3 483.6L151.4 426.3L108.4 375.6L88.6 288.6L57.1 278.4L5.6 249.4L-23.5 261.3L-60.1 302.1L-86.4 308.5L-79.2 270.3L-113.5 259.2L-129.8 191.1L-107.8 164.3L-126.5 131.2L-123.8 106.4L-96.6 125.2L-66.1 121.0L-30.6 91.2L-19.6 105.1L10.5 102.3L24.2 66.9L71.1 77.9L99.0 63.0L104.0 27.0L142.3 39.5L149.7 22.7L212.3 7.4L226.4 38.1Z';

  function selectMapDay(projectName, day) {
    if (!day) return;
    selectedDayByTrip[projectName] = day;
    renderProjects();
  }

  function mapDayHint(day) {
    return day ? ` · ${fmtDate(day)}` : '';
  }

  function buildTripMap(projectName) {
    const data = TRIP_MAPS[projectName];
    if (!data) return null;
    const wrap = document.createElement('div');
    wrap.className = 'trip-map';

    if (window.L && typeof window.L.map === 'function') {
      // real interactive map — satellite imagery with a labels overlay, plus a
      // street-map layer to switch to; works outside the artifact sandbox
      const mapEl = document.createElement('div');
      mapEl.className = 'trip-map-leaflet';
      wrap.appendChild(mapEl);
      requestAnimationFrame(() => {
        const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 18, attribution: 'Imagery &copy; Esri',
        });
        const labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
          maxZoom: 18, attribution: '&copy; CARTO &copy; OpenStreetMap',
        });
        const satGroup = L.layerGroup([sat, labels]);
        const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18, attribution: '&copy; OpenStreetMap contributors',
        });
        const map = L.map(mapEl, { scrollWheelZoom: false, layers: [satGroup] });
        L.control.layers({ 'Спутник': satGroup, 'Схема': streets }).addTo(map);
        L.polyline(data.route, { color: '#ffb020', weight: 3, dashArray: '6 6', opacity: 0.9 }).addTo(map);
        data.points.forEach(p => {
          const m = L.circleMarker([p.lat, p.lon], {
            radius: p.kind === 'base' ? 9 : 7,
            color: '#ffffff', weight: 2,
            fillColor: MAP_POINT_COLORS[p.kind], fillOpacity: 0.95,
          }).addTo(map);
          m.bindPopup(
            `<b>${escapeHtml(p.name)}</b>${mapDayHint(p.day)}<br>`
            + `<a href="${gmapsPointUrl(p)}" target="_blank" rel="noopener">Открыть в Google Maps →</a>`
          );
        });
        map.fitBounds(data.points.map(p => [p.lat, p.lon]), { padding: [28, 28] });
      });
    } else {
      // self-contained schematic fallback for the sandboxed artifact
      const px = (lon) => (lon - MAPP.LON_MIN) * MAPP.K * MAPP.S;
      const py = (lat) => (MAPP.LAT_MAX - lat) * MAPP.S;
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `0 0 ${MAPP.W} ${MAPP.H}`);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Схема маршрута по Италии');

      const sea = document.createElementNS(svgNS, 'rect');
      sea.setAttribute('width', MAPP.W); sea.setAttribute('height', MAPP.H);
      sea.setAttribute('fill', 'var(--brand-wash)'); sea.setAttribute('rx', 16);
      svg.appendChild(sea);

      const land = document.createElementNS(svgNS, 'path');
      land.setAttribute('d', ITALY_PATH);
      land.setAttribute('fill', 'var(--surface-1)');
      land.setAttribute('stroke', 'var(--baseline)');
      land.setAttribute('stroke-width', '1');
      svg.appendChild(land);

      const route = document.createElementNS(svgNS, 'polyline');
      route.setAttribute('points', data.route.map(([la, lo]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(' '));
      route.setAttribute('fill', 'none');
      route.setAttribute('stroke', 'var(--warning)');
      route.setAttribute('stroke-width', '2');
      route.setAttribute('stroke-dasharray', '5 5');
      route.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(route);

      data.points.forEach(p => {
        const x = px(p.lon), y = py(p.lat);
        const dot = document.createElementNS(svgNS, 'circle');
        dot.setAttribute('cx', x); dot.setAttribute('cy', y);
        dot.setAttribute('r', p.kind === 'base' ? 6 : 4.5);
        dot.setAttribute('fill', MAP_POINT_COLORS[p.kind]);
        dot.setAttribute('stroke', 'var(--surface-1)');
        dot.setAttribute('stroke-width', '1.5');
        dot.classList.add('map-dot');
        const tip = (evt) => showTooltip(evt, `<div><b>${escapeHtml(p.name)}</b>${mapDayHint(p.day)}</div>`);
        dot.addEventListener('pointerenter', tip);
        dot.addEventListener('pointermove', tip);
        dot.addEventListener('pointerleave', hideTooltip);
        dot.addEventListener('click', () => { hideTooltip(); selectMapDay(projectName, p.day); });
        svg.appendChild(dot);
        if (p.label) {
          const t = document.createElementNS(svgNS, 'text');
          t.setAttribute('x', x + (p.dx || 7));
          t.setAttribute('y', y + (p.dy || 3));
          if (p.anchor) t.setAttribute('text-anchor', p.anchor);
          t.setAttribute('font-size', '11');
          t.setAttribute('font-weight', '600');
          t.setAttribute('fill', 'var(--text-secondary)');
          t.textContent = p.label;
          svg.appendChild(t);
        }
      });
      wrap.appendChild(svg);
    }

    const legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.innerHTML = `
      <span><i style="background:${MAP_POINT_COLORS.base}"></i> базы</span>
      <span><i style="background:${MAP_POINT_COLORS.day}"></i> дни-поездки</span>
      <span><i style="background:${MAP_POINT_COLORS.evening}"></i> вечера и опции</span>
      <span><i class="map-legend-route"></i> маршрут</span>
    `;
    wrap.appendChild(legend);

    const actions = document.createElement('div');
    actions.className = 'map-actions';
    if (data.gmapsRoute) {
      const a = document.createElement('a');
      a.className = 'btn btn-ghost btn-small';
      a.href = data.gmapsRoute;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = '🗺 Маршрут в Google Maps';
      actions.appendChild(a);
    }
    // KML export for Google My Maps (import at mymaps.google.com); file
    // downloads are blocked inside the artifact sandbox, so only offer it
    // where the page runs unsandboxed (same signal as Leaflet loading)
    if (window.L) {
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'btn btn-ghost btn-small';
      k.textContent = '⬇️ Точки для Google My Maps (KML)';
      k.addEventListener('click', () => {
        const blob = new Blob([buildTripKml(projectName)], { type: 'application/vnd.google-earth.kml+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'italia-na-mashine.kml';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast('Файл скачан. Импортируй его на mymaps.google.com — точки появятся в твоём Google Maps.');
      });
      actions.appendChild(k);
    }
    if (actions.children.length) wrap.appendChild(actions);
    return wrap;
  }

  // KML with every map point (+ the drive route), importable into Google My Maps
  function buildTripKml(projectName) {
    const data = TRIP_MAPS[projectName];
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const KIND_KML = {
      base: { style: 'base', label: 'База' },
      day: { style: 'day', label: 'День-поездка' },
      evening: { style: 'evening', label: 'Вечер / опция' },
    };
    const placemarks = data.points.map(p => `
    <Placemark>
      <name>${esc(p.name)}</name>
      <description>${esc((p.day ? fmtDate(p.day) + ' · ' : '') + KIND_KML[p.kind].label + ' · ' + projectName)}</description>
      <styleUrl>#${KIND_KML[p.kind].style}</styleUrl>
      <Point><coordinates>${p.lon},${p.lat},0</coordinates></Point>
    </Placemark>`).join('');
    const routeCoords = data.route.map(([la, lo]) => `${lo},${la},0`).join(' ');
    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${esc(projectName)}</name>
    <Style id="base"><IconStyle><color>ffd6782a</color><scale>1.2</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href></Icon></IconStyle></Style>
    <Style id="day"><IconStyle><color>ff0ca30c</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href></Icon></IconStyle></Style>
    <Style id="evening"><IconStyle><color>ffd64f6c</color><Icon><href>http://maps.google.com/mapfiles/kml/paddle/purple-circle.png</href></Icon></IconStyle></Style>
    <Style id="routeline"><LineStyle><color>cc00b0ff</color><width>3</width></LineStyle></Style>
    ${placemarks}
    <Placemark>
      <name>Маршрут на машине</name>
      <styleUrl>#routeline</styleUrl>
      <LineString><tessellate>1</tessellate><coordinates>${routeCoords}</coordinates></LineString>
    </Placemark>
  </Document>
</kml>`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- reset ----------
  // Reset ONLY the current module — never wipe everything (that once cost the
  // user her Аскеза streak). Other spheres and their data stay untouched.
  const SPHERE_NAMES = { work: 'Работа', travel: 'Путешествия', ascesis: 'Аскеза', personal: 'Личное', food: 'Питание', health: 'Здоровье' };
  document.getElementById('resetAll').addEventListener('click', async () => {
    const name = SPHERE_NAMES[activeSphere] || 'этот раздел';
    if (!await confirmDialog(`Сбросить раздел «${name}» к исходному виду? Остальные разделы не тронутся.`)) return;
    const fresh = seedData();
    if (activeSphere === 'work' || activeSphere === 'travel') {
      state.projects = state.projects.filter(p => (p.sphere || 'work') !== activeSphere)
        .concat(fresh.projects.filter(p => (p.sphere || 'work') === activeSphere));
      if (activeSphere === 'travel') state.dayPlans = Object.assign({}, state.dayPlans, fresh.dayPlans);
      filterPeople.clear();
    } else if (activeSphere === 'ascesis') {
      state.ascesis = seedAscesis();
    } else if (activeSphere === 'personal') {
      state.personal = seedPersonal();
    } else if (activeSphere === 'food') {
      state.food = seedFood();
    } else if (activeSphere === 'health') {
      state.health = seedHealth();
    }
    save();
    renderAll();
    toast(`Раздел «${name}» сброшен`);
  });

  // ---------- Аскеза: обет + сетка на 2 года ----------
  const MONTHS_RU = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  function renderAscesis(container) {
    if (!state.ascesis) state.ascesis = seedAscesis();
    const a = state.ascesis;
    const t = todayISO();
    const endIso = addDaysISO(a.start, a.years * 365 - 1);
    const totalDays = a.years * 365;
    const kept = Object.values(a.marks).filter(v => v === 'kept').length;
    const broke = Object.values(a.marks).filter(v => v === 'broke').length;
    // текущая серия: подряд идущие «kept» до сегодняшнего дня
    let streak = 0;
    for (let iso = t; iso >= a.start; iso = addDaysISO(iso, -1)) {
      if (a.marks[iso] === 'kept') streak++; else break;
    }
    const passed = Math.max(0, Math.min(totalDays, Math.round((isoToUTCDate(t) - isoToUTCDate(a.start)) / DAY_MS) + 1));

    // обет + серия
    const head = document.createElement('section');
    head.className = 'card ascesis-head';
    head.innerHTML = `
      <div class="ascesis-vow">🕊 <b>Мой обет:</b> ${escapeHtml(a.vow)}</div>
      <div class="ascesis-stats">
        <div class="ast-stat"><span class="ast-num">${streak}</span><span class="ast-lbl">дней подряд</span></div>
        <div class="ast-stat"><span class="ast-num">${kept}</span><span class="ast-lbl">выдержано</span></div>
        <div class="ast-stat"><span class="ast-num ast-broke">${broke}</span><span class="ast-lbl">срывов</span></div>
        <div class="ast-stat"><span class="ast-num">${passed} / ${totalDays}</span><span class="ast-lbl">дней из 2 лет</span></div>
      </div>`;
    container.appendChild(head);

    // цель на 2 года (редактируемая)
    const goalCard = document.createElement('section');
    goalCard.className = 'card';
    const goalTitle = document.createElement('h2');
    goalTitle.textContent = '🎯 Зачем — цель на 2 года';
    const goalText = document.createElement('textarea');
    goalText.className = 'ascesis-goal';
    goalText.value = a.goal || '';
    goalText.rows = Math.min(20, (a.goal || '').split('\n').length + 1);
    goalText.addEventListener('change', () => { a.goal = goalText.value; save(); });
    goalCard.appendChild(goalTitle);
    goalCard.appendChild(goalText);
    container.appendChild(goalCard);

    // сетка ячеек по месяцам
    const gridCard = document.createElement('section');
    gridCard.className = 'card';
    const gridTitle = document.createElement('h2');
    gridTitle.textContent = 'Каждый день — ячейка. Клик: выдержал → сорвался → пусто';
    gridCard.appendChild(gridTitle);

    const cur = isoToUTCDate(a.start);
    cur.setUTCDate(1);
    const endDate = isoToUTCDate(endIso);
    while (cur <= endDate) {
      const y = cur.getUTCFullYear(), m = cur.getUTCMonth();
      const row = document.createElement('div');
      row.className = 'ast-month';
      const lbl = document.createElement('div');
      lbl.className = 'ast-month-lbl';
      lbl.textContent = `${MONTHS_RU[m]} ${String(y).slice(2)}`;
      row.appendChild(lbl);
      const cells = document.createElement('div');
      cells.className = 'ast-cells';
      const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (iso < a.start || iso > endIso) continue;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'ast-cell'
          + (a.marks[iso] ? ' ' + a.marks[iso] : '')
          + (iso === t ? ' today' : '')
          + (iso > t ? ' future' : '');
        cell.textContent = d;
        cell.title = iso;
        cell.addEventListener('click', () => {
          const nx = a.marks[iso] === 'kept' ? 'broke' : a.marks[iso] === 'broke' ? undefined : 'kept';
          if (nx) a.marks[iso] = nx; else delete a.marks[iso];
          save();
          cell.classList.remove('kept', 'broke');
          if (nx) cell.classList.add(nx);
          updateAscesisStats(head);
        });
        cells.appendChild(cell);
      }
      row.appendChild(cells);
      gridCard.appendChild(row);
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    container.appendChild(gridCard);

    // прокрутить к текущему месяцу
    requestAnimationFrame(() => {
      const todayCell = gridCard.querySelector('.ast-cell.today');
      if (todayCell) todayCell.scrollIntoView({ block: 'nearest' });
    });
  }

  // пересчёт цифр статистики без пересборки страницы (чтобы экран не прыгал)
  function updateAscesisStats(head) {
    const a = state.ascesis;
    const t = todayISO();
    const kept = Object.values(a.marks).filter(v => v === 'kept').length;
    const broke = Object.values(a.marks).filter(v => v === 'broke').length;
    let streak = 0;
    for (let iso = t; iso >= a.start; iso = addDaysISO(iso, -1)) {
      if (a.marks[iso] === 'kept') streak++; else break;
    }
    const nums = head.querySelectorAll('.ast-num');
    if (nums[0]) nums[0].textContent = streak;
    if (nums[1]) nums[1].textContent = kept;
    if (nums[2]) nums[2].textContent = broke;
  }

  // ---------- Личное: цели на год + задачи недели ----------
  function autoGrow(ta) {
    ta.rows = Math.min(30, Math.max(3, (ta.value || '').split('\n').length + 1));
  }
  function editableCard(container, title, value, onSave) {
    const card = document.createElement('section');
    card.className = 'card';
    const h = document.createElement('h2');
    h.textContent = title;
    const ta = document.createElement('textarea');
    ta.className = 'ascesis-goal';
    ta.value = value || '';
    autoGrow(ta);
    ta.addEventListener('change', () => { onSave(ta.value); save(); });
    card.appendChild(h);
    card.appendChild(ta);
    container.appendChild(card);
  }

  function renderPersonal(container) {
    if (!state.personal) state.personal = seedPersonal();
    const pd = state.personal;

    editableCard(container, '🎯 Цели на год', pd.yearGoals, v => { pd.yearGoals = v; });

    // задачи недели — чеклист по группам
    const wk = document.createElement('section');
    wk.className = 'card';
    const wkH = document.createElement('h2');
    wkH.textContent = '📅 Задачи на неделю';
    wk.appendChild(wkH);
    if (pd.weekNote) {
      const note = document.createElement('div');
      note.className = 'week-note';
      note.textContent = pd.weekNote;
      wk.appendChild(note);
    }
    const doneCount = pd.weekTasks.filter(x => x.done).length;
    const prog = document.createElement('div');
    prog.className = 'week-progress';
    prog.textContent = `Сделано ${doneCount} из ${pd.weekTasks.length}`;
    wk.appendChild(prog);

    let lastGroup = null;
    pd.weekTasks.forEach(task => {
      if (task.group !== lastGroup) {
        const g = document.createElement('div');
        g.className = 'week-group';
        g.textContent = task.group;
        wk.appendChild(g);
        lastGroup = task.group;
      }
      const row = document.createElement('label');
      row.className = 'week-task' + (task.done ? ' done' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!task.done;
      cb.addEventListener('change', () => {
        task.done = cb.checked;
        row.classList.toggle('done', task.done);
        prog.textContent = `Сделано ${pd.weekTasks.filter(x => x.done).length} из ${pd.weekTasks.length}`;
        save();
      });
      const span = document.createElement('span');
      span.textContent = task.text;
      row.appendChild(cb);
      row.appendChild(span);
      wk.appendChild(row);
    });
    container.appendChild(wk);

    editableCard(container, '✅ Воскресный чек-ин', pd.checkin, v => { pd.checkin = v; });
  }

  // ---------- Питание: дневник по дням ----------
  const FOOD_FIELDS = [
    { key: 'breakfast', label: '🌅 Завтрак' },
    { key: 'lunch', label: '☀️ Обед' },
    { key: 'dinner', label: '🌙 Ужин' },
    { key: 'snacks', label: '🍎 Перекусы' },
    { key: 'note', label: '📝 Самочувствие / заметки' },
  ];
  let foodDate = null;
  function fmtDateFull(iso) {
    return isoToUTCDate(iso).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function renderFood(container) {
    if (!state.food) state.food = seedFood();
    if (!foodDate) foodDate = todayISO();

    const card = document.createElement('section');
    card.className = 'card';

    // навигация по датам
    const nav = document.createElement('div');
    nav.className = 'food-nav';
    const prev = document.createElement('button');
    prev.type = 'button'; prev.className = 'food-arrow'; prev.textContent = '‹';
    const dateLbl = document.createElement('div');
    dateLbl.className = 'food-date';
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'food-arrow'; next.textContent = '›';
    const todayBtn = document.createElement('button');
    todayBtn.type = 'button'; todayBtn.className = 'btn btn-ghost btn-small'; todayBtn.textContent = 'Сегодня';
    nav.appendChild(prev); nav.appendChild(dateLbl); nav.appendChild(next); nav.appendChild(todayBtn);
    card.appendChild(nav);

    const body = document.createElement('div');
    card.appendChild(body);
    container.appendChild(card);

    function renderBody() {
      const iso = foodDate;
      dateLbl.textContent = fmtDateFull(iso) + (iso === todayISO() ? ' · сегодня' : '');
      body.innerHTML = '';
      const entry = state.food.days[iso] || {};
      FOOD_FIELDS.forEach(f => {
        const wrap = document.createElement('label');
        wrap.className = 'food-field';
        const lbl = document.createElement('span');
        lbl.textContent = f.label;
        const ta = document.createElement('textarea');
        ta.className = 'ascesis-goal';
        ta.rows = f.key === 'note' ? 2 : 2;
        ta.placeholder = f.key === 'note' ? 'Как самочувствие, энергия, что заметила…' : 'Что ела, примерно…';
        ta.value = entry[f.key] || '';
        ta.addEventListener('change', () => {
          if (!state.food.days[iso]) state.food.days[iso] = {};
          state.food.days[iso][f.key] = ta.value.trim();
          // если день опустел — убрать из списка
          if (Object.values(state.food.days[iso]).every(v => !v)) delete state.food.days[iso];
          save();
          renderRecent();
        });
        wrap.appendChild(lbl); wrap.appendChild(ta);
        body.appendChild(wrap);
      });
    }
    prev.addEventListener('click', () => { foodDate = addDaysISO(foodDate, -1); renderBody(); });
    next.addEventListener('click', () => { foodDate = addDaysISO(foodDate, 1); renderBody(); });
    todayBtn.addEventListener('click', () => { foodDate = todayISO(); renderBody(); });
    renderBody();

    // список заполненных дней
    const recentCard = document.createElement('section');
    recentCard.className = 'card';
    const rH = document.createElement('h2');
    rH.textContent = 'Записи';
    recentCard.appendChild(rH);
    const recentList = document.createElement('div');
    recentCard.appendChild(recentList);
    container.appendChild(recentCard);

    function renderRecent() {
      const days = Object.keys(state.food.days).sort().reverse();
      recentList.innerHTML = '';
      if (!days.length) {
        const e = document.createElement('div');
        e.className = 'empty-note'; e.textContent = 'Пока пусто. Заполни день выше.';
        recentList.appendChild(e);
        return;
      }
      days.forEach(iso => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'food-recent' + (iso === foodDate ? ' active' : '');
        const d = state.food.days[iso];
        const summary = [d.breakfast, d.lunch, d.dinner, d.snacks].filter(Boolean).join(' · ').slice(0, 80);
        row.innerHTML = `<b>${escapeHtml(fmtDate(iso))}</b> <span>${escapeHtml(summary || '—')}</span>`;
        row.addEventListener('click', () => { foodDate = iso; renderBody(); renderRecent(); });
        recentList.appendChild(row);
      });
    }
    renderRecent();
  }

  // ---------- Здоровье: дашборд (вес + привычки + внешность) ----------
  const HABITS = [
    { key: 'water',    icon: '💧', label: 'Вода' },
    { key: 'sport',    icon: '🏃', label: 'Спорт' },
    { key: 'vitamins', icon: '💊', label: 'Витамины' },
    { key: 'skin',     icon: '🧴', label: 'Кожа' },
    { key: 'hair',     icon: '💆', label: 'Волосы' },
  ];
  const svgNS = 'http://www.w3.org/2000/svg';

  function renderHealth(container) {
    if (!state.health) state.health = seedHealth();
    const h = state.health;
    const t = todayISO();

    // --- KPI: вес, изменение, привычек сегодня ---
    const wDates = Object.keys(h.weights).sort();
    const lastW = wDates.length ? h.weights[wDates[wDates.length - 1]] : null;
    const prevW = wDates.length > 1 ? h.weights[wDates[wDates.length - 2]] : null;
    const delta = (lastW != null && prevW != null) ? +(lastW - prevW).toFixed(1) : null;
    const todayHabits = h.habits[t] || {};
    const habitsDone = HABITS.filter(x => todayHabits[x.key]).length;

    const kpi = document.createElement('section');
    kpi.className = 'card health-kpi';
    const deltaStr = delta == null ? '' :
      `<span class="kpi-delta ${delta <= 0 ? 'good' : 'up'}">${delta > 0 ? '+' : ''}${delta} кг</span>`;
    kpi.innerHTML = `
      <div class="kpi-tile">
        <span class="kpi-lbl">Вес</span>
        <span class="kpi-val">${lastW != null ? lastW + ' <small>кг</small>' : '—'}</span>
        ${deltaStr}
      </div>
      <div class="kpi-tile">
        <span class="kpi-lbl">Цель по весу</span>
        <span class="kpi-val">${h.goalWeight != null ? h.goalWeight + ' <small>кг</small>' : '—'}</span>
      </div>
      <div class="kpi-tile">
        <span class="kpi-lbl">Привычки сегодня</span>
        <span class="kpi-val">${habitsDone} <small>/ ${HABITS.length}</small></span>
      </div>`;
    container.appendChild(kpi);

    // --- вес: график + добавить запись ---
    const wCard = document.createElement('section');
    wCard.className = 'card';
    const wHead = document.createElement('div');
    wHead.className = 'card-head';
    wHead.innerHTML = '<h2>⚖️ Вес</h2>';
    const wForm = document.createElement('div');
    wForm.className = 'weight-add';
    const wInput = document.createElement('input');
    wInput.type = 'number'; wInput.step = '0.1'; wInput.inputMode = 'decimal';
    wInput.placeholder = 'кг сегодня';
    wInput.className = 'weight-input';
    if (h.weights[t] != null) wInput.value = h.weights[t];
    const wBtn = document.createElement('button');
    wBtn.type = 'button'; wBtn.className = 'btn btn-primary btn-small'; wBtn.textContent = 'Записать';
    const commitWeight = () => {
      const v = parseFloat(wInput.value.replace(',', '.'));
      if (!isNaN(v) && v > 0) h.weights[t] = +v.toFixed(1);
      else delete h.weights[t];
      save();
      renderProjectsPreserveScroll();
    };
    wBtn.addEventListener('click', commitWeight);
    wInput.addEventListener('keydown', e => { if (e.key === 'Enter') commitWeight(); });
    wForm.appendChild(wInput); wForm.appendChild(wBtn);
    wHead.appendChild(wForm);
    wCard.appendChild(wHead);
    wCard.appendChild(buildWeightChart(h.weights));
    // цель по весу
    const goalRow = document.createElement('div');
    goalRow.className = 'weight-goal-row';
    goalRow.innerHTML = '<span>Цель по весу, кг:</span>';
    const gInput = document.createElement('input');
    gInput.type = 'number'; gInput.step = '0.1'; gInput.className = 'weight-input';
    gInput.style.maxWidth = '110px';
    if (h.goalWeight != null) gInput.value = h.goalWeight;
    gInput.addEventListener('change', () => {
      const v = parseFloat(gInput.value.replace(',', '.'));
      h.goalWeight = (!isNaN(v) && v > 0) ? +v.toFixed(1) : null;
      save(); renderProjectsPreserveScroll();
    });
    goalRow.appendChild(gInput);
    wCard.appendChild(goalRow);
    container.appendChild(wCard);

    // --- привычки: сегодня + неделя ---
    const hCard = document.createElement('section');
    hCard.className = 'card';
    hCard.innerHTML = '<h2>✅ Привычки сегодня</h2>';
    const chips = document.createElement('div');
    chips.className = 'habit-chips';
    HABITS.forEach(hb => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const on = !!(h.habits[t] && h.habits[t][hb.key]);
      chip.className = 'habit-chip' + (on ? ' on' : '');
      chip.innerHTML = `<span>${hb.icon}</span> ${hb.label}`;
      chip.addEventListener('click', () => {
        if (!h.habits[t]) h.habits[t] = {};
        h.habits[t][hb.key] = !h.habits[t][hb.key];
        if (Object.values(h.habits[t]).every(v => !v)) delete h.habits[t];
        save();
        chip.classList.toggle('on');
        // обновить KPI-плитку
        const done = HABITS.filter(x => h.habits[t] && h.habits[t][x.key]).length;
        const kv = kpi.querySelectorAll('.kpi-val')[2];
        if (kv) kv.innerHTML = `${done} <small>/ ${HABITS.length}</small>`;
        updateHabitWeek();
      });
      chips.appendChild(chip);
    });
    hCard.appendChild(chips);
    // неделя: последние 7 дней, интенсивность = сколько привычек выполнено
    const week = document.createElement('div');
    week.className = 'habit-week';
    hCard.appendChild(week);
    function updateHabitWeek() {
      week.innerHTML = '<span class="habit-week-lbl">Последние 7 дней:</span>';
      for (let i = 6; i >= 0; i--) {
        const iso = addDaysISO(t, -i);
        const d = h.habits[iso] || {};
        const n = HABITS.filter(x => d[x.key]).length;
        const cell = document.createElement('div');
        cell.className = 'habit-week-cell';
        cell.style.opacity = n === 0 ? 0.25 : (0.3 + 0.7 * n / HABITS.length);
        cell.title = `${fmtDate(iso)}: ${n}/${HABITS.length}`;
        const dd = isoToUTCDate(iso);
        cell.textContent = dd.getUTCDate();
        week.appendChild(cell);
      }
    }
    updateHabitWeek();
    container.appendChild(hCard);

    // --- цели по внешности ---
    const gCard = document.createElement('section');
    gCard.className = 'card';
    gCard.innerHTML = '<h2>🌸 Внешность и здоровье — цели</h2>';
    h.goals.forEach(g => {
      const row = document.createElement('div');
      row.className = 'health-goal' + (g.done ? ' done' : '');
      const top = document.createElement('label');
      top.className = 'health-goal-top';
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = !!g.done;
      const title = document.createElement('span');
      title.className = 'health-goal-title';
      title.textContent = g.text;
      cb.addEventListener('change', () => { g.done = cb.checked; row.classList.toggle('done', g.done); save(); });
      top.appendChild(cb); top.appendChild(title);
      const note = document.createElement('input');
      note.type = 'text'; note.className = 'health-goal-note';
      note.placeholder = 'заметка / прогресс…';
      note.value = g.note || '';
      note.addEventListener('change', () => { g.note = note.value.trim(); save(); });
      row.appendChild(top); row.appendChild(note);
      gCard.appendChild(row);
    });
    container.appendChild(gCard);
  }

  // re-render the current sphere but keep the page's vertical scroll position
  function renderProjectsPreserveScroll() {
    const y = window.scrollY;
    renderProjects();
    window.scrollTo({ top: y });
  }

  function buildWeightChart(weights) {
    const wrap = document.createElement('div');
    wrap.className = 'weight-chart';
    const dates = Object.keys(weights).sort();
    if (dates.length < 2) {
      const e = document.createElement('p');
      e.className = 'empty-note';
      e.textContent = dates.length ? 'Добавь ещё замер — и появится график динамики.' : 'Запиши вес — начнём отслеживать динамику.';
      wrap.appendChild(e);
      return wrap;
    }
    const W = 640, H = 180, padL = 34, padR = 12, padT = 12, padB = 22;
    const vals = dates.map(d => weights[d]);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.15; min -= pad; max += pad;
    const x0 = new Date(dates[0]).getTime(), x1 = new Date(dates[dates.length - 1]).getTime();
    const xf = (iso) => padL + ((new Date(iso).getTime() - x0) / (x1 - x0 || 1)) * (W - padL - padR);
    const yf = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'График веса');

    // цель — пунктирная линия
    if (state.health.goalWeight != null && state.health.goalWeight > min && state.health.goalWeight < max) {
      const gy = yf(state.health.goalWeight);
      const gl = document.createElementNS(svgNS, 'line');
      gl.setAttribute('x1', padL); gl.setAttribute('x2', W - padR);
      gl.setAttribute('y1', gy); gl.setAttribute('y2', gy);
      gl.setAttribute('stroke', 'var(--good)'); gl.setAttribute('stroke-width', '1.5');
      gl.setAttribute('stroke-dasharray', '4 4'); gl.setAttribute('opacity', '0.8');
      svg.appendChild(gl);
    }

    const ptsArr = dates.map(d => [xf(d), yf(weights[d])]);
    const linePts = ptsArr.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    // area fill
    const area = document.createElementNS(svgNS, 'polygon');
    area.setAttribute('points', `${padL},${H - padB} ${linePts} ${(W - padR)},${H - padB}`);
    area.setAttribute('fill', 'var(--series-1)'); area.setAttribute('opacity', '0.1');
    svg.appendChild(area);
    // line
    const line = document.createElementNS(svgNS, 'polyline');
    line.setAttribute('points', linePts);
    line.setAttribute('fill', 'none'); line.setAttribute('stroke', 'var(--series-1)');
    line.setAttribute('stroke-width', '2'); line.setAttribute('stroke-linejoin', 'round'); line.setAttribute('stroke-linecap', 'round');
    svg.appendChild(line);
    // endpoint dot + value
    const last = ptsArr[ptsArr.length - 1];
    const dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('cx', last[0]); dot.setAttribute('cy', last[1]); dot.setAttribute('r', '4');
    dot.setAttribute('fill', 'var(--series-1)'); dot.setAttribute('stroke', 'var(--surface-1)'); dot.setAttribute('stroke-width', '2');
    svg.appendChild(dot);
    // min/max y labels
    [min + (max - min) * 0.15, max - (max - min) * 0.15].forEach(v => {
      const tx = document.createElementNS(svgNS, 'text');
      tx.setAttribute('x', 4); tx.setAttribute('y', yf(v) + 3);
      tx.setAttribute('fill', 'var(--text-muted)'); tx.setAttribute('font-size', '10');
      tx.textContent = v.toFixed(1);
      svg.appendChild(tx);
    });
    wrap.appendChild(svg);
    return wrap;
  }

  window.addEventListener('resize', () => { renderProjects(); });

  function renderAll() {
    applySphereChrome();
    renderPeopleChips();
    renderProjects();
  }

  renderAll();
})();
