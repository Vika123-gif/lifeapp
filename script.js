(() => {
  'use strict';

  const STORAGE_KEY = 'life-tracker-work-v1';
  const ROW_H = 36;
  const HEADER_H = 30;
  const DAY_MS = 86400000;
  const LABELS_W = 150;

  const STATUS = {
    planned: { label: 'Запланирован', icon: '○', varName: '--planned-ink' },
    active:  { label: 'В работе',     icon: '▶', varName: '--series-1' },
    paused:  { label: 'На паузе',     icon: '⏸', varName: '--warning' },
    done:    { label: 'Завершён',     icon: '✓', varName: '--good' },
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
    return { people, projects };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore corrupt storage */ }
    return seedData();
  }

  let state = loadState();
  let editingProjectId = null;
  let pfSelectedPeople = new Set();
  let filterPeople = new Set();

  function isDimmed(pr) {
    return filterPeople.size > 0 && !pr.peopleIds.some(id => filterPeople.has(id));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ people: state.people, projects: state.projects }));
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

  // groups tasks by their parent project, ordered by each group's earliest start date
  function groupedProjects() {
    const groups = new Map();
    state.projects.forEach(t => {
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
    document.getElementById('projectFormTitle').textContent = task ? 'Редактировать этап' : 'Новый проект / этап';
    document.getElementById('pfProject').value = task ? task.project : (presetProject || '');
    document.getElementById('pfPhase').value = task ? (task.phase || '') : '';
    document.getElementById('pfStart').value = task ? task.start : todayISO();
    document.getElementById('pfEnd').value = task ? task.end : addDaysISO(todayISO(), 14);
    document.getElementById('pfStatus').value = task ? task.status : 'planned';
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
      state.projects.push({ id: uid(), project, phase, start, end, status, notes, peopleIds: [...pfSelectedPeople] });
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
      container.appendChild(card);
    });
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
    renderPeopleChips();
    renderProjects();
  }

  renderAll();
})();
