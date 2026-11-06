/* Расписание — минималистичное приложение для университета.
   Данные: lessons.json (распарсенное Расписание.xlsx).
   Интеграция с Telegram: тема клиента, CloudStorage, HapticFeedback,
   BackButton/MainButton, sendData — через Telegram Web Apps JS API. */

/* Загружаем Telegram Web Apps JS API динамически: приложение не должно
   зависеть от доступности CDN (браузер, офлайн, медленная сеть). */
function loadTelegramScript(timeoutMs) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-web-app.js';
    s.onload = finish;
    s.onerror = finish;
    setTimeout(finish, timeoutMs);
    document.head.appendChild(s);
  });
}

(async () => {
  'use strict';

  await loadTelegramScript(2500);

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const inTelegram = !!(tg && tg.initData);

  /* ── Telegram Web Apps API ─────────────────────────────── */
  const haptic = (style) => {
    try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred(style || 'light'); } catch (_) {}
  };

  const applyTheme = () => {
    const dark = tg && tg.colorScheme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      tg && tg.setHeaderColor && tg.setHeaderColor(dark ? '#141416' : '#f7f7f5');
      tg && tg.setBackgroundColor && tg.setBackgroundColor(dark ? '#141416' : '#f7f7f5');
    } catch (_) {}
  };

  if (tg) {
    try {
      tg.ready();
      tg.expand();
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      tg.onEvent('themeChanged', applyTheme);
    } catch (_) {}
  }
  applyTheme();

  // Имя пользователя Telegram (если мини-апп открыт внутри Telegram)
  if (inTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const el = document.getElementById('tg-user');
    el.textContent = tg.initDataUnsafe.user.first_name || '';
    el.hidden = !el.textContent;
  }

  /* ── хранилище выбранной группы: TG CloudStorage → localStorage ── */
  const store = {
    get(key) {
      return new Promise((resolve) => {
        try {
          if (tg && tg.CloudStorage) {
            tg.CloudStorage.getItem(key, (err, val) => resolve(!err && val ? val : null));
            return;
          }
        } catch (_) {}
        resolve(localStorage.getItem(key));
      });
    },
    set(key, val) {
      try {
        if (tg && tg.CloudStorage) { tg.CloudStorage.setItem(key, val, () => {}); return; }
      } catch (_) {}
      try { localStorage.setItem(key, val); } catch (_) {}
    }
  };

  /* ── утилиты дат ───────────────────────────────────────── */
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const WD = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const WD_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб'];

  const iso = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const parseISO = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const fmtDate = (d) => `${WD[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  /* ── состояние и данные ────────────────────────────────── */
  let DATA = null;
  let byKey = new Map();   // "date|group" → [lessons]
  let days = [];           // все учебные дни по возрастанию
  let state = { group: null, date: null };

  const key = (date, group) => `${date}|${group}`;
  const todayISO = () => iso(new Date());

  function indexData() {
    byKey = new Map();
    const daySet = new Set();
    for (const l of DATA.lessons) {
      const k = key(l.d, l.g);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(l);
      daySet.add(l.d);
    }
    days = [...daySet].sort();
    for (const list of byKey.values()) list.sort((a, b) => a.t1.localeCompare(b.t1));
  }

  const lessonsFor = (date, group) => byKey.get(key(date, group)) || [];

  // Склеиваем подряд идущие одинаковые пары (лекции на 2 слота подряд)
  function merged(list) {
    const out = [];
    for (const l of list) {
      const last = out[out.length - 1];
      if (last && last.s === l.s && last.r === l.r && last.t2 === l.t1) {
        last.t2 = l.t2;
      } else {
        out.push({ ...l });
      }
    }
    return out;
  }

  // разбивает "Название (преп. И.О. Фамилия)" → [название, преподаватель]
  function splitSubject(s) {
    const m = s.match(/^(.*)\s*\(([^()]*)\)\s*$/);
    if (!m) return [s, null];
    return [m[1].trim(), m[2].trim()];
  }

  /* ── рендер ────────────────────────────────────────────── */
  const elGroups = document.getElementById('groups');
  const elTabs = document.getElementById('day-tabs');
  const elLessons = document.getElementById('lessons');
  const elDate = document.getElementById('date-label');
  const elPrev = document.getElementById('prev-day');
  const elNext = document.getElementById('next-day');
  const elToday = document.getElementById('today-btn');
  const elFoot = document.getElementById('foot');

  function renderGroups() {
    elGroups.innerHTML = '';
    for (const g of DATA.groups) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.textContent = g;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(g === state.group));
      b.addEventListener('click', () => {
        if (state.group === g) return;
        haptic();
        state.group = g;
        store.set('group', g);
        renderAll();
      });
      elGroups.appendChild(b);
    }
    const sel = elGroups.querySelector('[aria-selected="true"]');
    if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  // неделя, содержащая state.date (Пн–Сб), только в пределах семестра
  function weekDays() {
    const d = parseISO(state.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const first = parseISO(days[0]);
    const last = parseISO(days[days.length - 1]);
    const res = [];
    for (let i = 0; i < 6; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const s = iso(day);
      res.push({ label: WD_SHORT[i], date: s, inSemester: day >= first && day <= last });
    }
    return res;
  }

  function renderTabs() {
    elTabs.innerHTML = '';
    const present = new Set(days);
    for (const w of weekDays()) {
      const b = document.createElement('button');
      b.className = 'daytab';
      b.textContent = w.label;
      b.setAttribute('aria-selected', String(w.date === state.date));
      b.disabled = !w.inSemester || !present.has(w.date);
      b.title = fmtDate(parseISO(w.date));
      b.addEventListener('click', () => {
        if (state.date === w.date) return;
        haptic();
        state.date = w.date;
        renderAll();
      });
      elTabs.appendChild(b);
    }
  }

  function renderLessons() {
    const list = merged(lessonsFor(state.date, state.group));
    elDate.textContent = fmtDate(parseISO(state.date));
    const isToday = state.date === todayISO();
    elToday.hidden = isToday;

    if (!list.length) {
      elLessons.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'empty';
      const within = state.date >= days[0] && state.date <= days[days.length - 1];
      box.innerHTML = within
        ? 'Занятий нет'
        : 'Сегодня занятий нет';
      const sub = document.createElement('div');
      sub.className = 'empty__sub';
      sub.textContent = within ? 'Можно отдохнуть' : 'Семестр: ' +
        `${parseISO(days[0]).getDate()} ${MONTHS[parseISO(days[0]).getMonth()]} — ` +
        `${parseISO(days[days.length - 1]).getDate()} ${MONTHS[parseISO(days[days.length - 1]).getMonth()]}`;
      box.appendChild(sub);
      const btn = document.createElement('button');
      btn.className = 'empty__btn';
      btn.textContent = within ? '' : 'Показать расписание';
      if (!within) {
        btn.addEventListener('click', () => {
          haptic();
          state.date = days[0];
          renderAll();
        });
        box.appendChild(btn);
      }
      elLessons.appendChild(box);
    } else {
      elLessons.innerHTML = '';
      const now = new Date();
      const nowHH = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      list.forEach((l, i) => {
        const [name, teacher] = splitSubject(l.s);
        const isNow = isToday && nowHH >= l.t1 && nowHH <= l.t2;
        const row = document.createElement('article');
        row.className = 'lesson' + (isNow ? ' lesson--now' : '');
        row.style.animationDelay = `${Math.min(i * 30, 150)}ms`;
        row.innerHTML =
          `<div class="lesson__time">${l.t1}–${l.t2}</div>` +
          `<div class="lesson__body"><div class="lesson__name"></div>` +
          (teacher ? `<div class="lesson__teacher"></div>` : '') +
          `</div>` +
          (l.r ? `<div class="lesson__room"></div>` : '');
        row.querySelector('.lesson__name').textContent = name + (isNow ? '' : '');
        if (isNow) {
          const badge = document.createElement('span');
          badge.className = 'lesson__now-badge';
          badge.textContent = 'сейчас';
          row.querySelector('.lesson__name').appendChild(badge);
        }
        if (teacher) row.querySelector('.lesson__teacher').textContent = teacher;
        if (l.r) row.querySelector('.lesson__room').textContent = l.r;
        elLessons.appendChild(row);
      });
    }

    // стрелки: ходим только по учебным дням семестра
    const idx = days.indexOf(state.date);
    elPrev.disabled = idx <= 0;
    elNext.disabled = idx === -1 || idx >= days.length - 1;
  }

  function renderFoot() {
    const a = parseISO(DATA.meta.from);
    const b = parseISO(DATA.meta.to);
    elFoot.textContent = `${DATA.meta.semester} · ${a.getDate()} ${MONTHS[a.getMonth()]} — ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
  }

  function renderAll() {
    renderGroups();
    renderTabs();
    renderLessons();
    renderFoot();
    updateTgButtons();
  }

  /* ── навигация по дням ─────────────────────────────────── */
  function step(dir) {
    const idx = days.indexOf(state.date);
    const next = idx === -1
      ? (dir > 0 ? days[0] : days[days.length - 1])
      : days[idx + dir];
    if (!next) return;
    haptic();
    state.date = next;
    renderAll();
  }

  elPrev.addEventListener('click', () => step(-1));
  elNext.addEventListener('click', () => step(1));
  elToday.addEventListener('click', () => {
    const t = todayISO();
    if (state.date === t) return;
    haptic();
    state.date = t;
    renderAll();
  });

  /* ── TG-кнопки: BackButton / MainButton ────────────────── */
  function updateTgButtons() {
    if (!tg) return;
    try {
      const isToday = state.date === todayISO();
      if (tg.BackButton) {
        if (!isToday) {
          tg.BackButton.show();
          tg.BackButton.onClick(() => { state.date = todayISO(); renderAll(); });
        } else {
          tg.BackButton.hide();
        }
      }
      if (tg.MainButton) {
        const list = lessonsFor(state.date, state.group);
        if (inTelegram && list.length) {
          tg.MainButton.setText('Отправить расписание дня');
          tg.MainButton.show();
          tg.MainButton.onClick(() => {
            haptic('medium');
            const d = parseISO(state.date);
            const text = list.map((l) => `${l.t1} ${l.s}${l.r ? ' · ' + l.r : ''}`).join('\n');
            tg.sendData(JSON.stringify({
              date: `${WD[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`,
              group: state.group,
              lessons: text
            }));
          });
        } else {
          tg.MainButton.hide();
        }
      }
    } catch (_) {}
  }

  /* ── запуск ────────────────────────────────────────────── */
  /* lessons.json — компактный формат со справочниками:
     { days[], groups[], slots[[t1,t2]..], subjects[], rooms[],
       lessons[[dayIdx, groupIdx, slotIdx, subjectIdx, roomIdx|-1]..] } */
  function decodeData(raw) {
    return raw.lessons.map(([d, g, t, s, r]) => ({
      d: raw.days[d],
      g: raw.groups[g],
      t1: raw.slots[t][0],
      t2: raw.slots[t][1],
      s: raw.subjects[s],
      r: r >= 0 ? raw.rooms[r] : null,
    }));
  }

  async function init() {
    const res = await fetch('lessons.json');
    const raw = await res.json();
    DATA = { meta: raw.meta, groups: raw.groups, lessons: decodeData(raw) };
    indexData();

    const saved = await store.get('group');
    state.group = DATA.groups.includes(saved) ? saved : DATA.groups[0];

    const t = todayISO();
    state.date = (t >= DATA.meta.from && t <= DATA.meta.to) ? t : DATA.meta.from;

    renderAll();
  }

  init().catch((e) => {
    elLessons.innerHTML = '<div class="empty">Не удалось загрузить расписание</div>';
    console.error(e);
  });
})();
