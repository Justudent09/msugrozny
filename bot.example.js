/* Пример Telegram-бота (Bot API) для мини-аппа «Расписание».
   Node.js 18+, без зависимостей.

   Запуск:
     export BOT_TOKEN="123:abc"          // токен от @BotFather
     export APP_URL="https://<user>.github.io/msugrozny/"  // URL мини-аппа
     node bot.example.js

   Как привязать мини-апп: @BotFather → /newapp (или /setmenubutton) с URL приложения. */
'use strict';

const TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL;
if (!TOKEN) { console.error('Укажите BOT_TOKEN'); process.exit(1); }

const API = (method) => `https://api.telegram.org/bot${TOKEN}/${method}`;

// Приветствие + расписание дня (данные — тот же lessons.json)
async function sendToday(chatId, lessons) {
  const today = new Date().toISOString().slice(0, 10);
  const day = lessons.filter((l) => l.d === today);
  const text = day.length
    ? day.map((l) => `${l.t1} ${l.s}${l.r ? ' · ' + l.r : ''}`).join('\n')
    : 'На сегодня занятий нет.';
  await fetch(API('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

// Кнопка меню, открывающая мини-апп
async function setMenuButton() {
  if (!APP_URL) return;
  await fetch(API('setChatMenuButton'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: { type: 'web_app', text: 'Расписание', web_app: { url: APP_URL } },
    }),
  });
}

// Поллинг обновлений: команды + данные из мини-аппа (tg.sendData)
async function poll(lessons) {
  let offset = 0;
  for (;;) {
    const res = await fetch(API('getUpdates'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offset, timeout: 25 }),
    }).then((r) => r.json());
    for (const u of res.result || []) {
      offset = u.update_id + 1;
      if (u.message?.text === '/start') {
        await sendToday(u.message.chat.id, lessons);
      } else if (u.message?.web_app_data) {
        // то, что прислал мини-апп через MainButton → tg.sendData(...)
        const data = JSON.parse(u.message.web_app_data.data);
        await fetch(API('sendMessage'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: u.message.chat.id,
            text: `${data.date}\n${data.group}\n\n${data.lessons}`,
          }),
        });
      }
    }
  }
}

// тот же lessons.json, что и у веб-приложения
const raw = require('./lessons.json');
const lessons = raw.lessons.map(([d, g, t, s, r]) => ({
  d: raw.days[d],
  t1: raw.slots[t][0],
  s: raw.subjects[s],
  r: r >= 0 ? raw.rooms[r] : null,
}));

setMenuButton()
  .then(() => poll(lessons))
  .catch((e) => { console.error(e); process.exit(1); });
