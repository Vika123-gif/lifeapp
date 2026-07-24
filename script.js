(() => {
  'use strict';

  const STORAGE_KEY = 'life-tracker-work-v1';
  const ROW_H = 36;
  const HEADER_H = 28;
  const DAY_MS = 86400000;

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

  function seedData() {
    const people = [
      { id: 'p1', name: 'Я' },
    ];
    const projects = [
      {
        id: uid(), name: 'Modivo Veo Challenge — Сценарий', status: 'active',
        start: '2026-07-20', end: '2026-07-26', peopleIds: ['p1'],
        notes: 'Дедлайн проекта: 28.08. Нужно 2 видео по 30 сек — форматы 9:16 и 16:9.',
      },
      {
        id: uid(), name: 'Modivo Veo Challenge — Сторибоды', status: 'planned',
        start: '2026-07-27', end: '2026-08-02', peopleIds: ['p1'],
        notes: 'Сторибоды по утверждённому сценарию.',
      },
      {
        id: uid(), name: 'Modivo Veo Challenge — Создание видео', status: 'planned',
        start: '2026-08-03', end: '2026-08-28', peopleIds: ['p1'],
        notes: '2 видео по 30 сек (9:16 и 16:9), финальный рендер и сдача до 28.08.',
      },
      {
        id: uid(), name: 'Cropp', status: 'planned',
        start: '2026-07-24', end: '2026-08-31', peopleIds: ['p1'],
        notes: 'Скоуп пока не определён.',
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
  let filterStatus = new Set();

  function isDimmed(pr) {
    const peopleMiss = filterPeople.size > 0 && !pr.peopleIds.some(id => filterPeople.has(id));
    const statusMiss = filterStatus.size > 0 && !filterStatus.has(pr.status);
    return peopleMiss || statusMiss;
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ people: state.people, projects: state.projects }));
  }

  function personName(id) {
    const p = state.people.find(x => x.id === id);
    return p ? p.name : '?';
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
        renderGantt();
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
      del.addEventListener('click', () => {
        if (!confirm(`Удалить «${p.name}» из списка людей?`)) return;
        state.people = state.people.filter(x => x.id !== p.id);
        state.projects.forEach(pr => { pr.peopleIds = pr.peopleIds.filter(id => id !== p.id); });
        filterPeople.delete(p.id);
        save();
        renderPeopleList();
        renderPeopleChips();
        renderGantt();
        renderProjectList();
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
  function openProjectForm(project) {
    editingProjectId = project ? project.id : null;
    pfSelectedPeople = new Set(project ? project.peopleIds : []);
    document.getElementById('projectFormTitle').textContent = project ? 'Редактировать проект' : 'Новый проект';
    document.getElementById('pfName').value = project ? project.name : '';
    document.getElementById('pfStart').value = project ? project.start : todayISO();
    document.getElementById('pfEnd').value = project ? project.end : addDaysISO(todayISO(), 14);
    document.getElementById('pfStatus').value = project ? project.status : 'planned';
    document.getElementById('pfNotes').value = project ? (project.notes || '') : '';
    document.getElementById('deleteProjectBtn').hidden = !project;
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
    const name = document.getElementById('pfName').value.trim();
    const start = document.getElementById('pfStart').value;
    const end = document.getElementById('pfEnd').value;
    const status = document.getElementById('pfStatus').value;
    const notes = document.getElementById('pfNotes').value.trim();
    if (!name) { alert('Укажи название проекта'); return; }
    if (!start || !end) { alert('Укажи даты начала и конца'); return; }
    if (end < start) { alert('Дата конца раньше даты начала'); return; }

    if (editingProjectId) {
      const pr = state.projects.find(x => x.id === editingProjectId);
      Object.assign(pr, { name, start, end, status, notes, peopleIds: [...pfSelectedPeople] });
    } else {
      state.projects.push({ id: uid(), name, start, end, status, notes, peopleIds: [...pfSelectedPeople] });
    }
    save();
    closeProjectForm();
    renderStatusTiles();
    renderGantt();
    renderProjectList();
  });

  document.getElementById('deleteProjectBtn').addEventListener('click', () => {
    const pr = state.projects.find(x => x.id === editingProjectId);
    if (!pr) return;
    if (!confirm(`Удалить проект «${pr.name}»?`)) return;
    state.projects = state.projects.filter(x => x.id !== editingProjectId);
    save();
    closeProjectForm();
    renderStatusTiles();
    renderGantt();
    renderProjectList();
  });

  // ---------- project list (accessible table view) ----------
  function renderProjectList() {
    const ul = document.getElementById('projectList');
    const empty = document.getElementById('projectListEmpty');
    ul.innerHTML = '';
    const sorted = [...state.projects].sort((a, b) => a.start.localeCompare(b.start));
    empty.hidden = sorted.length > 0;
    sorted.forEach(pr => {
      const li = document.createElement('li');
      li.className = 'project-row';
      const dot = document.createElement('span');
      dot.className = 'project-status-dot';
      dot.style.background = `var(${STATUS[pr.status].varName})`;
      const main = document.createElement('div');
      main.className = 'project-main';
      const nameEl = document.createElement('div');
      nameEl.className = 'project-name';
      nameEl.textContent = pr.name;
      const meta = document.createElement('div');
      meta.className = 'project-meta';
      const peopleStr = pr.peopleIds.length ? pr.peopleIds.map(personName).join(', ') : 'никто не забронирован';
      meta.textContent = `${STATUS[pr.status].icon} ${STATUS[pr.status].label} · ${fmtDate(pr.start)} – ${fmtDate(pr.end)} · ${peopleStr}`;
      main.appendChild(nameEl);
      main.appendChild(meta);
      if (pr.notes) {
        const notesEl = document.createElement('div');
        notesEl.className = 'project-notes';
        notesEl.textContent = pr.notes;
        main.appendChild(notesEl);
      }
      li.appendChild(dot);
      li.appendChild(main);
      li.addEventListener('click', () => openProjectForm(pr));
      ul.appendChild(li);
    });
  }

  // ---------- status tiles (legend + filter, "smart systems" style) ----------
  function renderStatusTiles() {
    const el = document.getElementById('statusTiles');
    el.innerHTML = '';
    Object.entries(STATUS).forEach(([key, meta]) => {
      const count = state.projects.filter(p => p.status === key).length;
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = `status-tile ${key}` + (filterStatus.has(key) ? ' on' : '');
      tile.innerHTML = `
        <span class="status-tile-icon">${meta.icon}</span>
        <span class="status-tile-toggle" aria-hidden="true"></span>
        <span class="status-tile-count">${count}</span>
        <span class="status-tile-label">${escapeHtml(meta.label)}</span>
      `;
      tile.addEventListener('click', () => {
        if (filterStatus.has(key)) filterStatus.delete(key); else filterStatus.add(key);
        renderStatusTiles();
        renderGantt();
      });
      el.appendChild(tile);
    });
  }

  // ---------- gantt chart ----------
  const tooltip = document.getElementById('ganttTooltip');
  function showTooltip(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.hidden = false;
  }
  function hideTooltip() { tooltip.hidden = true; }

  function renderGantt() {
    const chartEl = document.getElementById('ganttChart');
    const emptyEl = document.getElementById('ganttEmpty');
    // clear previous (keep tooltip node)
    [...chartEl.children].forEach(c => { if (c !== tooltip) c.remove(); });

    const projects = state.projects;
    emptyEl.hidden = projects.length > 0;
    if (projects.length === 0) return;

    const t = todayISO();
    let minStart = projects.reduce((m, p) => p.start < m ? p.start : m, projects[0].start);
    let maxEnd = projects.reduce((m, p) => p.end > m ? p.end : m, projects[0].end);
    minStart = addDaysISO(minStart < t ? minStart : t, -3);
    maxEnd = addDaysISO(maxEnd > t ? maxEnd : t, 4);

    const totalDays = Math.max(1, Math.round((new Date(maxEnd) - new Date(minStart)) / DAY_MS));
    const availableWidth = chartEl.getBoundingClientRect().width - 150; // minus labels column
    const pxPerDay = Math.max(8, Math.min(40, availableWidth / totalDays));
    const svgWidth = Math.max(availableWidth, totalDays * pxPerDay);
    const svgHeight = HEADER_H + projects.length * ROW_H;

    function xForDate(iso) {
      return Math.round((new Date(iso) - new Date(minStart)) / DAY_MS * pxPerDay);
    }

    // labels column
    const labelsCol = document.createElement('div');
    labelsCol.className = 'gantt-labels';
    const labelHeader = document.createElement('div');
    labelHeader.className = 'gantt-label-header';
    labelsCol.appendChild(labelHeader);
    projects.forEach(pr => {
      const row = document.createElement('div');
      row.className = 'gantt-label-row';
      row.dataset.pid = pr.id;
      row.title = pr.name;
      row.textContent = pr.name;
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
    svg.setAttribute('aria-label', 'Диаграмма Ганта по проектам');

    // month gridlines + labels
    const cursor = isoToUTCDate(minStart);
    cursor.setUTCDate(1);
    const maxEndDate = isoToUTCDate(maxEnd);
    while (cursor <= maxEndDate) {
      const iso = utcDateToISO(cursor);
      if (iso >= minStart) {
        const x = xForDate(iso);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', x); line.setAttribute('x2', x);
        line.setAttribute('y1', HEADER_H); line.setAttribute('y2', svgHeight);
        line.setAttribute('stroke', 'var(--gridline)');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', x + 4);
        label.setAttribute('y', HEADER_H - 10);
        label.setAttribute('fill', 'var(--text-muted)');
        label.setAttribute('font-size', '11');
        label.textContent = cursor.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        svg.appendChild(label);
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    // row separators
    projects.forEach((pr, i) => {
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
      todayLine.setAttribute('stroke', 'var(--text-secondary)');
      todayLine.setAttribute('stroke-width', '1.5');
      svg.appendChild(todayLine);
      const todayLabel = document.createElementNS(svgNS, 'text');
      todayLabel.setAttribute('x', xToday + 4);
      todayLabel.setAttribute('y', 12);
      todayLabel.setAttribute('fill', 'var(--text-secondary)');
      todayLabel.setAttribute('font-size', '10');
      todayLabel.setAttribute('font-weight', '600');
      todayLabel.textContent = 'Сегодня';
      svg.appendChild(todayLabel);
    }

    // bars
    projects.forEach((pr, i) => {
      const y = HEADER_H + i * ROW_H + (ROW_H - 18) / 2;
      const x1 = xForDate(pr.start);
      const x2 = xForDate(addDaysISO(pr.end, 1));
      const dimmed = isDimmed(pr);

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', x1);
      rect.setAttribute('y', y);
      rect.setAttribute('width', Math.max(6, x2 - x1));
      rect.setAttribute('height', 18);
      rect.setAttribute('rx', 4);
      rect.setAttribute('fill', `var(${STATUS[pr.status].varName})`);
      rect.setAttribute('opacity', dimmed ? 0.25 : 0.92);
      rect.classList.add('gantt-bar');
      rect.tabIndex = 0;

      const peopleStr = pr.peopleIds.length ? pr.peopleIds.map(personName).join(', ') : '—';
      const showTip = (evt) => {
        const rowEl = chartEl.querySelector(`.gantt-label-row[data-pid="${pr.id}"]`);
        const rect2 = chartEl.getBoundingClientRect();
        const px = (evt.clientX ?? (rowEl ? rowEl.getBoundingClientRect().right : 0)) - rect2.left;
        showTooltip(px, HEADER_H + i * ROW_H, `
          <div><b>${escapeHtml(pr.name)}</b></div>
          <div>${STATUS[pr.status].icon} ${STATUS[pr.status].label} · ${fmtDate(pr.start)} – ${fmtDate(pr.end)}</div>
          <div class="tt-people">👤 ${escapeHtml(peopleStr)}</div>
          ${pr.notes ? `<div class="tt-notes">${escapeHtml(pr.notes)}</div>` : ''}
        `);
      };
      rect.addEventListener('pointerenter', showTip);
      rect.addEventListener('pointermove', showTip);
      rect.addEventListener('focus', showTip);
      rect.addEventListener('pointerleave', hideTooltip);
      rect.addEventListener('blur', hideTooltip);
      rect.addEventListener('click', () => openProjectForm(pr));
      svg.appendChild(rect);
    });

    scrollCol.appendChild(svg);
    const inner = document.createElement('div');
    inner.className = 'gantt-inner';
    inner.appendChild(labelsCol);
    inner.appendChild(scrollCol);
    chartEl.appendChild(inner);

    if (t >= minStart && t <= maxEnd) {
      const visibleWidth = scrollCol.clientWidth;
      scrollCol.scrollLeft = Math.max(0, xForDate(t) - visibleWidth / 2);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- reset ----------
  document.getElementById('resetAll').addEventListener('click', () => {
    if (!confirm('Удалить все проекты и людей без возможности восстановления?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = seedData();
    filterPeople.clear();
    save();
    renderAll();
  });

  window.addEventListener('resize', () => { renderGantt(); });

  function renderAll() {
    renderPeopleChips();
    renderStatusTiles();
    renderGantt();
    renderProjectList();
  }

  renderAll();
})();
