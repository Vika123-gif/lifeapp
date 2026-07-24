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
    const people = [
      { id: 'p1', name: 'Я' },
    ];
    const projects = [
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Сценарий', status: 'active',
        start: '2026-07-20', end: '2026-07-26', peopleIds: ['p1'],
        notes: 'Дедлайн проекта: 28.08. Нужно 2 видео по 30 сек — форматы 9:16 и 16:9.',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Сторибоды', status: 'planned',
        start: '2026-07-27', end: '2026-08-02', peopleIds: ['p1'],
        notes: 'Сторибоды по утверждённому сценарию.',
      },
      {
        id: uid(), project: 'Modivo Veo Challenge', phase: 'Создание видео', status: 'planned',
        start: '2026-08-03', end: '2026-08-28', peopleIds: ['p1'],
        notes: '2 видео по 30 сек (9:16 и 16:9), финальный рендер и сдача до 28.08.',
      },
      {
        id: uid(), project: 'Cropp', phase: '', status: 'planned',
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

  function rowLabel(task) {
    return task.phase && task.phase.trim() ? task.phase : task.project;
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
      del.addEventListener('click', () => {
        if (!confirm(`Удалить «${p.name}» из списка людей?`)) return;
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
    if (!project) { alert('Укажи название проекта'); return; }
    if (!start || !end) { alert('Укажи даты начала и конца'); return; }
    if (end < start) { alert('Дата конца раньше даты начала'); return; }

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

  document.getElementById('deleteProjectBtn').addEventListener('click', () => {
    const pr = state.projects.find(x => x.id === editingProjectId);
    if (!pr) return;
    if (!confirm(`Удалить «${rowLabel(pr)}»?`)) return;
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

    // week gridlines (every Monday) — thin, subtle, with a short date tick
    const weekCursor = isoToUTCDate(minStart);
    while (weekCursor.getUTCDay() !== 1) weekCursor.setUTCDate(weekCursor.getUTCDate() - 1);
    const maxEndDate = isoToUTCDate(maxEnd);
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
    tasks.forEach((pr, i) => {
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

      let drag = null; // { startClientX, origX, moved }
      rect.addEventListener('pointerdown', (evt) => {
        evt.preventDefault();
        rect.setPointerCapture(evt.pointerId);
        drag = { startClientX: evt.clientX, origX: parseFloat(rect.getAttribute('x')), moved: false };
        rect.classList.add('gantt-bar-dragging');
      });
      rect.addEventListener('pointermove', (evt) => {
        if (!drag) { showTip(evt); return; }
        const dxPx = evt.clientX - drag.startClientX;
        if (Math.abs(dxPx) > 3) drag.moved = true;
        const daysDelta = Math.round(dxPx / pxPerDay);
        rect.setAttribute('x', drag.origX + daysDelta * pxPerDay);
        if (drag.moved) showDragTip(evt, addDaysISO(pr.start, daysDelta), addDaysISO(pr.end, daysDelta));
      });
      const endDrag = (evt) => {
        if (!drag) return;
        rect.releasePointerCapture(evt.pointerId);
        rect.classList.remove('gantt-bar-dragging');
        const dxPx = evt.clientX - drag.startClientX;
        const daysDelta = Math.round(dxPx / pxPerDay);
        const wasDrag = drag.moved;
        drag = null;
        hideTooltip();
        if (wasDrag && daysDelta !== 0) {
          pr.start = addDaysISO(pr.start, daysDelta);
          pr.end = addDaysISO(pr.end, daysDelta);
          save();
          renderProjects();
        } else if (!wasDrag) {
          openProjectForm(pr);
        }
      };
      rect.addEventListener('pointerup', endDrag);
      rect.addEventListener('pointercancel', endDrag);
      rect.addEventListener('pointerenter', (evt) => { if (!drag) showTip(evt); });
      rect.addEventListener('focus', showTip);
      rect.addEventListener('pointerleave', () => { if (!drag) hideTooltip(); });
      rect.addEventListener('blur', () => { if (!drag) hideTooltip(); });
      svg.appendChild(rect);
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
  document.getElementById('resetAll').addEventListener('click', () => {
    if (!confirm('Удалить все проекты и людей без возможности восстановления?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = seedData();
    filterPeople.clear();
    save();
    renderAll();
  });

  window.addEventListener('resize', () => { renderProjects(); });

  function renderAll() {
    renderPeopleChips();
    renderProjects();
  }

  renderAll();
})();
