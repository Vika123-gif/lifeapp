(() => {
  'use strict';

  const STORAGE_KEY = 'life-tracker-work-v1';
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
        id: uid(), sphere: 'travel', project: trip, phase: '🚗 Переезд под Рим', status: 'drive',
        start: '2026-08-15', end: '2026-08-15', peopleIds: [P.me],
        notes: '~4 ч: Романья → Кастелли-Романи. 15.08 — Феррагосто: многое закрыто, трафик к морю. Выезжать пораньше.',
      },
      {
        id: uid(), sphere: 'travel', project: trip, phase: '🏠 База 2 — Рокка-Приора (под Римом)', status: 'stay',
        start: '2026-08-15', end: '2026-08-23', peopleIds: [P.me],
        notes: 'Via Monte Ceraso, 24, Rocca Priora, 00079, Italy. Кастелли-Романи, ~40 мин до Рима.',
      },
    );

    return { people, projects, dayPlans: seedDayPlans() };
  }

  // day-by-day itinerary, keyed by trip name → ISO date
  function seedDayPlans() {
    return {
      'Италия на машине': {
        '2026-08-07': { icon: '🚗', title: 'Дорога в Италию', text: 'Выезд. Ночь пт→сб пока без брони — найти ночёвку по пути (Австрия / север Италии).' },
        '2026-08-08': { icon: '🏠', title: 'Дорога → заселение', text: 'В дороге до вечера. Заселение: Via Giacomo Matteotti 27, San Giovanni in Galilea. Купить продукты на вечер.' },
        '2026-08-09': { icon: '🏖', title: 'Сан-Марино + Римини', text: 'Первый выходной, всё рядом с базой. Утро — Сан-Марино (крепости Гуаита и Честа, панорамы). Вечер — старый Римини (мост Тиберия, пьяцца Кавур) или набережная.' },
        '2026-08-10': { icon: '💻', title: 'Работа · вечер Сантарканджело', text: 'Днём работа. Вечером Сантарканджело-ди-Романья — уютный старый город, ужин в остерии (~15 мин от базы).' },
        '2026-08-11': { icon: '💻', title: 'Работа · вечер у моря', text: 'Днём работа. Вечером Римини или Риччоне — аперитив у моря, закат.' },
        '2026-08-12': { icon: '🏖', title: 'Равенна', text: 'Мозаики ЮНЕСКО: Сан-Витале, мавзолей Галлы Плацидии, Сант-Аполлинаре-Нуово (~1 ч езды). На обратном пути можно заехать в Чезену.' },
        '2026-08-13': { icon: '🏖', title: 'Флоренция', text: 'Выезд рано (~2,5–3 ч). Дуомо, Понте-Веккьо, вечером пьяццале Микеланджело. Парковка Villa Costanza → трамвай в центр. Уффици — только если забронировать заранее.' },
        '2026-08-14': { icon: '🏖', title: 'Болонья', text: 'Порталы, башни Азинелли, Пьяцца Маджоре, обед в Квадрилатеро (~1 ч 15 от базы). Если хочется полегче перед переездом — вместо города замки Градара + Сан-Лео или море.' },
        '2026-08-15': { icon: '🚗', title: 'Феррагосто · переезд под Рим', text: '~4 ч до Rocca Priora (Via Monte Ceraso 24). Выехать пораньше: праздник, трафик к морю, многое закрыто. Продукты купить по пути.' },
        '2026-08-16': { icon: '🏖', title: 'Обжиться · озеро Альбано', text: 'Спокойное воскресенье: озеро Альбано, купание. Вечером Кастель-Гандольфо или Фраскати.' },
        '2026-08-17': { icon: '💻', title: 'Работа · вечер Фраскати', text: 'Днём работа (вариант — кафе во Фраскати). Вечером вино фраскати и виды на Рим.' },
        '2026-08-18': { icon: '💻', title: 'Работа · вечер Неми', text: 'Вечером озеро Неми — городок на обрыве, клубничные десерты.' },
        '2026-08-19': { icon: '💻', title: 'Работа · вечер Аричча', text: 'Вечером Аричча — fraschette и porchetta.' },
        '2026-08-20': { icon: '💻', title: 'Работа · вечер у озера', text: 'Вечером купание в озере Альбано / прогулка в Кастель-Гандольфо.' },
        '2026-08-21': { icon: '💻', title: 'Работа · свободный вечер', text: 'Запасной вечер: Рокка-ди-Папа, закат на Monte Cavo — или просто ужин.' },
        '2026-08-22': { icon: '🏖', title: 'Рим или Тиволи', text: 'Полный день. Рим: ранний выезд, Пантеон, Навона, Треви, вечером Трастевере. Или Тиволи: Вилла д’Эсте + Вилла Адриана.' },
        '2026-08-23': { icon: '🏖', title: 'Последний день', text: 'Второй из пары Рим/Тиволи — что не успели, или утро у озера. Вечером сборы; уточнить, когда выезжаем домой.' },
      },
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        // older saves predate day plans — backfill so the day strip isn't empty
        if (!s.dayPlans) s.dayPlans = seedDayPlans();
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
  };

  function isDimmed(pr) {
    return filterPeople.size > 0 && !pr.peopleIds.some(id => filterPeople.has(id));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ people: state.people, projects: state.projects, dayPlans: state.dayPlans || {} }));
  }

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
    document.getElementById('addProject').textContent = cfg.addLabel;
    document.getElementById('filterLabel').textContent = cfg.filterLabel;
    document.getElementById('ganttEmpty').textContent = cfg.emptyNote;
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
    for (let iso = minStart; iso <= maxEnd; iso = addDaysISO(iso, 1)) {
      const d = isoToUTCDate(iso);
      const dow = d.getUTCDay();
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'day-chip'
        + (iso === selected ? ' selected' : '')
        + ((dow === 0 || dow === 6) ? ' weekend' : '');
      const dowStr = d.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' });
      chip.innerHTML = `
        <span class="d-dow">${escapeHtml(dowStr)}</span>
        <span class="d-num">${d.getUTCDate()}</span>
        <span class="d-ico">${plans[iso] ? plans[iso].icon : '·'}</span>
      `;
      chip.addEventListener('click', () => {
        selectedDayByTrip[projectName] = iso;
        renderProjects();
      });
      strip.appendChild(chip);
    }
    wrap.appendChild(strip);

    const plan = plans[selected] || {};
    const detail = document.createElement('div');
    detail.className = 'day-detail';
    const title = document.createElement('div');
    title.className = 'day-detail-title';
    const dateStr = isoToUTCDate(selected).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    title.textContent = `${plan.icon ? plan.icon + ' ' : ''}${dateStr}${plan.title ? ' — ' + plan.title : ''}`;
    const text = document.createElement('textarea');
    text.className = 'day-detail-text';
    text.rows = 3;
    text.placeholder = 'Что делаем в этот день? Пиши прямо сюда — сохранится само.';
    text.value = plan.text || '';
    text.addEventListener('change', () => {
      if (!plans[selected]) plans[selected] = { icon: '📍', title: '', text: '' };
      plans[selected].text = text.value.trim();
      save();
    });
    detail.appendChild(title);
    detail.appendChild(text);
    // Google Maps links for this day's places (from the trip map data)
    const tripData = TRIP_MAPS[projectName];
    if (tripData) {
      const pts = tripData.points.filter(p => p.day === selected);
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
    wrap.appendChild(detail);

    // center the selected chip in the strip once mounted (horizontal only,
    // so the page itself never jumps)
    requestAnimationFrame(() => {
      const sel = strip.querySelector('.day-chip.selected');
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
        [43.11, 12.39], [41.95, 12.60], [41.793, 12.760],
      ],
      points: [
        { name: 'База 1 · Сан-Джованни-ин-Галилея (8–15.08)', lat: 44.031, lon: 12.288, kind: 'base', label: 'База 1', anchor: 'end', dx: -7, dy: -5 },
        { name: 'База 2 · Рокка-Приора (15–23.08)', lat: 41.793, lon: 12.760, kind: 'base', label: 'База 2', dx: 8, dy: 12 },
        { name: 'Сан-Марино', lat: 43.936, lon: 12.447, kind: 'day', day: '2026-08-09', label: 'Сан-Марино', anchor: 'end', dx: -7, dy: 10 },
        { name: 'Римини', lat: 44.059, lon: 12.568, kind: 'day', day: '2026-08-09', label: 'Римини', dx: 7, dy: 1 },
        { name: 'Равенна', lat: 44.418, lon: 12.201, kind: 'day', day: '2026-08-12', label: 'Равенна', dx: 7, dy: -3 },
        { name: 'Флоренция', lat: 43.769, lon: 11.256, kind: 'day', day: '2026-08-13', label: 'Флоренция', anchor: 'end', dx: -7, dy: 3 },
        { name: 'Болонья', lat: 44.494, lon: 11.343, kind: 'day', day: '2026-08-14', label: 'Болонья', anchor: 'end', dx: -7, dy: 3 },
        { name: 'Сантарканджело (вечер пн)', lat: 44.063, lon: 12.446, kind: 'evening', day: '2026-08-10' },
        { name: 'Градара (опция пт)', lat: 43.940, lon: 12.769, kind: 'evening', day: '2026-08-14' },
        { name: 'Сан-Лео (опция пт)', lat: 43.896, lon: 12.343, kind: 'evening', day: '2026-08-14' },
        { name: 'Рим', lat: 41.902, lon: 12.496, kind: 'day', day: '2026-08-22', label: 'Рим', anchor: 'end', dx: -7, dy: 3 },
        { name: 'Тиволи', lat: 41.963, lon: 12.798, kind: 'day', day: '2026-08-22', label: 'Тиволи', dx: 7, dy: -2 },
        { name: 'Фраскати (вечер)', lat: 41.808, lon: 12.681, kind: 'evening', day: '2026-08-17' },
        { name: 'Неми (вечер)', lat: 41.720, lon: 12.716, kind: 'evening', day: '2026-08-18' },
        { name: 'Аричча (вечер)', lat: 41.720, lon: 12.672, kind: 'evening', day: '2026-08-19' },
        { name: 'Кастель-Гандольфо (вечер)', lat: 41.746, lon: 12.650, kind: 'evening', day: '2026-08-16' },
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
  document.getElementById('resetAll').addEventListener('click', async () => {
    if (!await confirmDialog('Сбросить всё к исходным данным? Текущие проекты и люди будут заменены.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = seedData();
    filterPeople.clear();
    save();
    renderAll();
    toast('Данные сброшены');
  });

  window.addEventListener('resize', () => { renderProjects(); });

  function renderAll() {
    applySphereChrome();
    renderPeopleChips();
    renderProjects();
  }

  renderAll();
})();
