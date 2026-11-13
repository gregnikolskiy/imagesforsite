(function () {
'use strict';

/* ================= НАСТРОЙКИ ================= */
var CONFIG = {
  // URL веб-приложения Google Apps Script (…/exec). Пока пусто, страница работает в демо-режиме.
  API_URL: 'https://script.google.com/macros/s/AKfycbwVcbeIXzzxV-jEmRPfp96IFKkWv09D9UbQgwCD_JojGyjFizNrcEXsxx-NA_AVifsvdA/exec',
  // Адрес этой страницы, из него собирается личная ссылка игрока
  PLAYER_URL: 'https://gregnikolskiy.ru/player',
  // Ссылка на чат потока в Telegram
  CHAT_URL: 'https://t.me/c/3987431320/14',
  // Облики: пол × класс. Вертикальные картинки 3:4. Пустая строка = заглушка.
  // IMAGES — прокачанные облики: экран выбора класса.
  IMAGES: { m: { packer: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/class-m-packer.jpg', content: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/class-m-content.jpg', strategist: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/class-m-strategist.jpg' }, f: { packer: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/class-f-packer.jpg', content: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/class-f-content.jpg', strategist: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/class-f-strategist.jpg' } },
  // LEVEL_IMAGES — облик персонажа по уровням: с какого уровня какая картинка.
  // Профиль и экран «Персонаж создан». Уровень 1–9 — стартовый облик; 10, 20… добавишь позже.
  LEVEL_IMAGES: { 1: { m: { packer: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lvl1-m-packer.jpg', content: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lvl1-m-content.jpg', strategist: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lvl1-m-strategist.jpg' }, f: { packer: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lvl1-f-packer.jpg', content: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lvl1-f-content.jpg', strategist: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lvl1-f-strategist.jpg' } } },
  // Картинки на экране выбора пола (необязательно)
  GENDER_IMAGES: { m: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/gender-m.jpg', f: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/gender-f.jpg' },
  // Фоны: город (вход и загрузка), деревня (лор), родная планета персонажа (окно «История персонажа»)
  CITY_IMAGE: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/city.jpg',
  VILLAGE_IMAGE: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/village.jpg',
  ORIGIN_IMAGE: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/origin.jpg',
  // Картинка в шапке окна «Как работает прокачка»
  GUIDE_IMAGE: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/guide.jpg',
  // папка с обложками уроков (в уроке поле cover: 'w1-1.jpg')
  LESSON_BASE: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/lessons/',
  // куда ведёт кнопка «Забрать в чате» у нового скилла; пусто: в чат потока
  SKILLS_URL: 'https://t.me/c/3987431320/2',
  // картинки ачивок: квадратные, рамку и свечение рисует страница
  ACH_IMAGES: { pioneer: 'https://cdn.jsdelivr.net/gh/gregnikolskiy/imagesforsite@main/upgrade/ach-pioneer.jpg' },
  // Музыка на время создания персонажа. Пусто = встроенный синтезаторный трек.
  // Можно вставить ссылку на mp3 с бесплатной лицензией.
  MUSIC_URL: ''
};

var CLASSES = {
  packer:     { name: 'Упаковщик',  color: '#38e2ff', desc: 'Делает сайты, лендинги и презентации: от анализа аудитории до готового дизайна с ИИ.' },
  content:    { name: 'Контентщик', color: '#c45cff', desc: 'Ведёт Telegram-каналы, Инстаграм и Threads и выпускает контент каждый день с помощью ИИ.' },
  strategist: { name: 'Стратег',    color: '#ffbf3d', desc: 'Берёт маркетинг клиента целиком: ведёт комплексные проекты и собирает под них команду.' }
};
var GENDERS = { m: 'Мужчина', f: 'Женщина' };

// lvl: какой уровень получает персонаж, когда квест засчитан. Пролог (создание персонажа) даёт PROLOGUE_LVL.
var PROLOGUE_LVL = 1, MAX_LVL = 40;
var AUTO_IDS = ['story', 'guide']; // засчитываются сами, без проверки
var GUIDE_TEXT = [
  'Ты получаешь от 1 до 5 уровней, когда сдаёшь небольшие квесты, такие как этот. Это отображается в шкале уровней под твоим персонажем.',
  'Большие недельные квесты переводят тебя на 10-й, 20-й, 30-й и 40-й уровни. На этих отметках твой персонаж прокачивается внешне: обрастает снаряжением, оружием и инвентарём.',
  'После некоторых уровней ты сможешь завести питомца и приручить своего автоматона. Каждого из них ты выберешь сам, поэтому к концу игры персонаж каждого участника будет выглядеть уникально.'
];
var QUESTS = [
  { id: 'story', tag: 'Пролог', title: 'Узнать свою историю', lvl: 2, auto: true,
    task: 'Открой «Историю персонажа» и узнай, откуда ты родом. Квест засчитается сам, как только дочитаешь.' },
  { id: 'guide', tag: 'Пролог', title: 'Узнать, как работает прокачка', lvl: 3, auto: true,
    task: 'Открой правила прокачки и узнай, как растёт твой персонаж. Квест засчитается сам, как только дочитаешь.' },
  { id: 'q0', tag: 'День 0', title: 'Выход в сеть', lvl: 5, proof: 'file',
    task: 'Представься в чате потока: как тебя зовут, чем занимаешься и какой класс выбрал. Сделай скриншот своего сообщения и прикрепи его сюда.' },
  { id: 'q1', tag: 'Неделя 1', title: 'Анализ проекта', lvl: 10, proof: 'links',
    links: [{ key: 'ca', label: 'Анализ ЦА' }, { key: 'comp', label: 'Анализ конкурентов' }, { key: 'utp', label: 'УТП' }],
    task: 'Комплект аналитики по своему проекту в Notion: ЦА, конкуренты и УТП.' },
  { id: 'q2', tag: 'Неделя 2', lvl: 20, proof: 'any', byClass: {
    packer:     { title: 'Сайты и презентации с ИИ', task: 'Прототип и дизайн сайта или презентации с ИИ.' },
    content:    { title: 'Контент-завод', task: 'Контент-завод для одной площадки клиента.' },
    strategist: { title: 'Комплексный проект', task: 'План комплексного проекта на три месяца с составом команды.' } } },
  { id: 'q3', tag: 'Неделя 3', title: 'Переупаковка себя', lvl: 30, proof: 'any',
    task: 'Сайт-портфолио.' },
  { id: 'q4', tag: 'Неделя 4', title: 'Очередь из клиентов', lvl: 40, proof: 'any',
    task: 'Два запущенных источника клиентов.' },
  { id: 'final', tag: 'Финал', title: 'Финальный босс', proof: 'any', boss: true,
    task: 'Демо-день: покажи лист персонажа «до» и «после». Три лучших апгрейда получают приз.' }
];

var SKILLS = [
  { name: 'Аналитика Никольского v2.0', week: 'q1', desc: 'ЦА, конкуренты и УТП по одному брифу клиента. Собирает аналитику в Notion за тебя.' },
  { name: 'Тексты для сайтов и презентаций', week: 'q2', cls: 'packer', desc: 'Пишет тексты для сайтов и презентаций по структуре и аналитике проекта.' },
  { name: 'Контент-план для ТГ-канала', week: 'q2', cls: 'content', desc: 'Собирает контент-план для Telegram-канала на месяц вперёд.' },
  { name: 'Сайт-портфолио', week: 'q3', desc: 'Упаковывает тебя в сайт-портфолио маркетолога на 300–500 тысяч в месяц.' },
  { name: 'Презентация для видео-КП', week: 'q4', desc: 'Делает презентацию для видео-КП по брифу клиента, чтобы продавать без звонков.' }
];

var OTHER = 'Другое';
var QUIZ = [
  { key: 'формат_работы', stat: 'Ремесло', icon: 'hammer', sub: 'как персонаж работает', type: 'single', auto: true,
    q: 'В каком формате ты сейчас работаешь?',
    options: ['Фриланс', 'Найм', 'Найм + фриланс', 'Своё дело'] },
  { key: 'последний_проект', stat: 'Золото', icon: 'coin', sub: 'стоимость последнего проекта', priv: true, type: 'range', min: 0, max: 500000, step: 10000,
    q: 'Сколько стоил твой последний проект?',
    hint: 'Возьми за пример какой-то значимый проект за последние 2–4 недели. Если работаешь только в найме, просто укажи свою зарплату.' },
  { key: 'услуги', stat: 'Навыки', icon: 'scroll', sub: 'что персонаж умеет продавать', type: 'multi', other: true,
    q: 'Какие услуги ты оказываешь сейчас?',
    options: ['Сайты и лендинги', 'Презентации', 'Копирайтинг', 'Дизайн', 'Telegram-каналы', 'Инстаграм', 'Threads', 'Реклама: таргет / контекст / другая', 'PR', 'SEO-продвижение', 'Инфлюенс-маркетинг', 'Стратегия', 'Ведение проекта целиком'] },
  { key: 'источники_клиентов', stat: 'Порталы', icon: 'portal', sub: 'откуда приходят клиенты', type: 'multi', other: true, none: 'Пока клиентов нет',
    q: 'Откуда к тебе приходят клиенты / работодатели?',
    options: ['Сарафан и рекомендации', 'Постоянные клиенты', 'Биржи и фриланс-площадки', 'Свой блог', 'Холодные рассылки', 'Telegram-каналы и чаты с вакансиями', 'HH.ru', 'Агентства и партнёры', 'Пока клиентов нет'] },
  { key: 'портфолио', stat: 'Артефакты', icon: 'chest', sub: 'чем персонаж может похвастаться', type: 'single', link: 'Ссылка на портфолио, если есть',
    q: 'Что у тебя с портфолио?',
    options: ['Есть сайт-портфолио', 'Есть презентация-портфолио', 'Есть описанные кейсы', 'Есть резюме', 'Вроде что-то есть, но оно не отражает меня сейчас', 'Я сапожник без сапог, у меня ничего нет)))'] },
  { key: 'ии_инструменты', stat: 'Импланты', icon: 'chip', sub: 'ИИ, встроенный в работу', type: 'multi', other: true, none: 'Пока не пользуюсь',
    q: 'Какими ИИ-инструментами пользуешься в работе?',
    options: ['ChatGPT', 'Claude', 'Perplexity', 'Использую ИИ-скиллы', 'Создаю свои ИИ-скиллы / агентов', 'Использую «проекты» в ChatGPT / Claude', 'Использую «дизайн» в Claude', 'Пока не пользуюсь'] }
];
// после этого вопроса показываем экран «сканирование завершено на N%»
var QUIZ_MID = Math.ceil(QUIZ.length / 2);
var SHEET_FIELDS = QUIZ.map(function (q) { return { key: q.key, label: q.stat, priv: !!q.priv }; });

var LORE = {
  place: 'Планета Кайрос · деревушка Ветряная Гавань',
  title: 'Добро пожаловать на Кайрос',
  text: [
    'Кайрос называют планетой без земли. Это газовый гигант, у которого вместо поверхности бесконечные облака, а жизнь держится на островах, парящих над ними без единой опоры. Твой корабль только что приземлился у деревушки Ветряная Гавань.',
    'Её знают по всей космической системе. С краёв здешних островов срываются водопады такой силы, что грохот слышно на соседних островах. Сюда прилетают цифровые мастера со всей галактики. Здесь они меняют старое снаряжение на новое, ставят ИИ-импланты и получают карту мест, где водятся клиенты.'
  ]
};

/* история персонажа: общая для всех, глаголы по полу */
function gw(m, f) { return genKey() === 'f' ? f : m; }
function originText() {
  return [
    'Ты ' + gw('родился', 'родилась') + ' на Ноктюрне, планете, где солнце выходит из-за горизонта раз в сорок дней. Всё остальное время города живут при свете неоновых вывесок, и местные торговцы спорят за каждый метр витрины: покупатель замечает только то, что светится ярче, чем у соседей.',
    'Там ты и ' + gw('освоил', 'освоила') + ' ремесло: собирать вывески, которые цепляют взгляд, и слова, после которых люди заходят внутрь. Работы хватало, пока на Ноктюрн не завезли ИИ-автоматонов. Они делают средние вывески за минуту и почти даром, и цены на ремесло поползли вниз.',
    'Тогда ты ' + gw('услышал', 'услышала') + ' про Кайрос. Говорили, что мастера Ветряной Гавани умеют приручать автоматонов и превращать их из конкурентов в напарников. Ты ' + gw('собрал', 'собрала') + ' снаряжение, ' + gw('взял', 'взяла') + ' последний сигнальный маяк и ' + gw('купил', 'купила') + ' билет на ближайший корабль. Дальше ты знаешь.'
  ];
}
function heroLines() {
  return [
    'Долгая Зима близко. Надо успеть.',
    'Где тут водятся клиенты?',
    'Импланты пока не установлены. Это поправимо.',
    'Сначала квест, потом всё остальное.',
    gw('Слышал', 'Слышала') + ', в Гавани приручают автоматонов.',
    'Четыре недели. Звучит выполнимо.',
    'Кто-нибудь видел карту клиентов?',
    'Яйцо опять шевелится. Или мне кажется?'
  ];
}
var EGG_LINES = [
  'Яйцо тёплое. Внутри кто-то шевелится.',
  'Изнутри доносится тихий писк.',
  'Скорлупа светится чуть ярче, когда ты сдаёшь квесты.',
  'Похоже, ему нужно ещё немного уровней.'
];

/* ================= УТИЛИТЫ ================= */
var DEMO = !CONFIG.API_URL;
var root = document.getElementById('ug-root');
var stage = root.querySelector('.ug-stage');

var store = (function () {
  // тестовая страница в демо-режиме на боевом домене не должна трогать данные настоящего профиля
  var P = DEMO && /gregnikolskiy/.test(location.hostname) ? 'demo_' : '';
  var mem = {}, ok = false;
  try { localStorage.setItem('__ug', '1'); localStorage.removeItem('__ug'); ok = true; } catch (e) {}
  return {
    get: function (k) { k = P + k; try { return ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return mem[k] || null; } },
    set: function (k, v) { k = P + k; try { if (ok) localStorage.setItem(k, v); else mem[k] = v; } catch (e) { mem[k] = v; } },
    del: function (k) { k = P + k; try { if (ok) localStorage.removeItem(k); else delete mem[k]; } catch (e) { delete mem[k]; } }
  };
})();

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function normNick(n) {
  var s = String(n || '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?t\.me\//, '').replace(/^@/, '');
  return /^[a-z0-9_]{3,32}$/.test(s) ? s : '';
}
function keyByName(map, name) {
  for (var k in map) { if ((map[k].name || map[k]) === name) return k; }
  return '';
}
function personalLink(nick) { return CONFIG.PLAYER_URL + '#' + nick; }
function setHash(nick) {
  try { history.replaceState(null, '', nick ? '#' + nick : location.pathname + location.search); } catch (e) {}
}

var ICONS = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  play: '<path d="M7.2 5.5l10.6 6.5-10.6 6.5z"/>',
  clip: '<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<path d="M7 11V8a5 5 0 0 1 10 0v3"/><rect x="5" y="11" width="14" height="10" rx="1"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  hourglass: '<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
  diamond: '<path d="M12 3l9 9-9 9-9-9z"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="1"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  chip: '<rect x="6" y="6" width="12" height="12"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  skull: '<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 5 3 6v3h10v-3c1.5-1 3-3 3-6a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/>',
  bolt: '<path d="M13 2L4 14h7l-2 8 9-12h-7z"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 10.5h6"/>',
  hammer: '<path d="M14.5 3.5l6 6-2.5 2.5-6-6z"/><path d="M12 6L4 14l3 3 8-8"/><path d="M5.5 15.5L3 21"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9h-3.5a1.75 1.75 0 0 0 0 3.5h2a1.75 1.75 0 0 1 0 3.5H9.5M12 7v1.8M12 16v1.8"/>',
  gem: '<path d="M6.5 4h11l3.5 5-9 11L3 9z"/><path d="M3 9h18M9.5 4L8 9l4 11 4-11-1.5-5"/>',
  scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1.5h-4"/><path d="M16 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5h10"/><path d="M7 4a2 2 0 0 0-2 2v10.5"/><path d="M8.5 9h4.5M8.5 12.5h4.5"/>',
  portal: '<ellipse cx="12" cy="11" rx="6" ry="8.5"/><ellipse cx="12" cy="11" rx="2.6" ry="4.6"/><path d="M4 21h16"/>',
  chest: '<path d="M3 11h18v8H3z"/><path d="M3 11a4.5 4.5 0 0 1 4.5-5h9A4.5 4.5 0 0 1 21 11"/><path d="M10.5 13h3v3h-3z"/>',
  paw: '<circle cx="7" cy="9" r="1.8"/><circle cx="11" cy="6" r="1.8"/><circle cx="15" cy="6.5" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M8 17c0-3 2-5 4-5s5 2 5 5-2 3-4.5 3S8 20 8 17z"/>'
};
function ico(name) {
  return '<svg class="ug-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + '</svg>';
}

/* заглушка облика, пока нет картинки */
var phSeq = 0;
function placeholder(g, color, label) {
  var id = 'ugp' + (phSeq++);
  var c = color || '#00f0ff';
  var hairF = '<path d="M96 150C92 84 208 84 204 150C206 200 214 236 224 266H76C86 236 94 200 96 150Z"/>';
  var hairM = '<path d="M104 142C102 94 198 94 196 142C186 120 170 112 150 112S114 120 104 142Z"/>';
  var body = '<path d="M44 400C48 302 84 262 150 254C216 262 252 302 256 400Z"/><path d="M132 196V232H168V196Z"/><ellipse cx="150" cy="152" rx="46" ry="56"/>';
  var grid = '';
  for (var i = 1; i < 10; i++) grid += '<line x1="' + (i * 30) + '" y1="0" x2="' + (i * 30) + '" y2="400"/>';
  for (var j = 1; j < 14; j++) grid += '<line x1="0" y1="' + (j * 30) + '" x2="300" y2="' + (j * 30) + '"/>';
  return '<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".5"/><stop offset="1" stop-color="' + c + '" stop-opacity=".04"/></linearGradient>' +
    '<radialGradient id="' + id + 'r" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="' + c + '" stop-opacity=".28"/><stop offset="1" stop-color="#05060b" stop-opacity="0"/></radialGradient>' +
    '<pattern id="' + id + 's" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="' + c + '" opacity=".16"/></pattern></defs>' +
    '<rect width="300" height="400" fill="#070912"/><rect width="300" height="400" fill="url(#' + id + 'r)"/>' +
    '<g stroke="' + c + '" stroke-opacity=".08">' + grid + '</g>' +
    (g === 'f' ? '<g fill="url(#' + id + 'g)" stroke="' + c + '" stroke-width="1.6" stroke-opacity=".9">' + hairF + '</g>' : '') +
    '<g fill="#0a0d17">' + body + '</g>' +
    '<g fill="url(#' + id + 'g)" stroke="' + c + '" stroke-width="1.6" stroke-opacity=".9">' + body + (g === 'f' ? '' : hairM) + '</g>' +
    '<rect width="300" height="400" fill="url(#' + id + 's)"/>' +
    (label ? '<text x="150" y="384" text-anchor="middle" fill="' + c + '" fill-opacity=".7" font-family="JetBrains Mono,monospace" font-size="11" letter-spacing="2">' + esc(label) + '</text>' : '') +
    '</svg>';
}
function heroPortrait(g, cls) {
  var url = (CONFIG.IMAGES[g] || {})[cls] || CONFIG.GENDER_IMAGES[g];
  if (!url) return portrait(g, cls, true);
  // персонаж целиком: картинка вписана, а поля заполняет размытая копия той же картинки
  return '<div class="ug-portrait is-contain"><div class="ug-portrait-blur" style="background-image:url(\'' + esc(url) + '\')"></div><img src="' + esc(url) + '" alt=""></div>';
}
// облик для текущего уровня: берём картинку самого высокого порога, до которого персонаж дорос
function levelImage(g, cls, lvl) {
  var best = '', bestAt = -1;
  Object.keys(CONFIG.LEVEL_IMAGES || {}).forEach(function (at) {
    var url = ((CONFIG.LEVEL_IMAGES[at] || {})[g] || {})[cls];
    if (url && +at <= lvl && +at > bestAt) { best = url; bestAt = +at; }
  });
  return best;
}
function avatar(g, cls, lvl) {
  var url = levelImage(g, cls, lvl);
  return url ? '<div class="ug-portrait"><img src="' + esc(url) + '" alt=""></div>' : portrait(g, cls, true);
}
function portrait(g, cls, noLabel) {
  var url = (CONFIG.IMAGES[g] || {})[cls];
  // пока нет облика класса, показываем картинку пола с подсветкой цвета класса
  var fallback = !url && CONFIG.GENDER_IMAGES[g];
  if (fallback) url = CONFIG.GENDER_IMAGES[g];
  var inner = url ? '<img src="' + esc(url) + '" alt="" loading="lazy">' : placeholder(g, CLASSES[cls] ? CLASSES[cls].color : null, noLabel ? '' : 'ОБЛИК ГЕНЕРИРУЕТСЯ');
  return '<div class="ug-portrait' + (fallback ? ' is-tint' : '') + '">' + inner + '</div>';
}

/* ================= ДАННЫЕ ================= */
function defaultSettings() {
  var s = {};
  QUESTS.forEach(function (q) { s[q.id] = { open: q.id === 'q0', deadline: '' }; });
  return s;
}
var demoDb = {
  load: function () {
    var db = null;
    try { db = JSON.parse(store.get('ug_demo_db')); } catch (e) {}
    if (!db) { db = { players: {}, settings: defaultSettings() }; }
    // демо идёт как настоящий поток: первая неделя уже открыта, чтобы были видны уроки
    if (db.v !== 2) { db.v = 2; if (db.settings.q1) db.settings.q1.open = true; this.save(db); }
    return db;
  },
  save: function (db) { store.set('ug_demo_db', JSON.stringify(db)); },
  view: function (p) {
    var sheet = {};
    SHEET_FIELDS.forEach(function (f) { if (!f.priv) sheet[f.key] = p.sheet[f.key] || ''; });
    return { nick: p.nick, gender: p.gender, 'class': p['class'], quests: Object.assign({}, p.quests), sheet: sheet, pet: p.pet || '', weapon: p.weapon || '', seen: (p.seen || []).slice(), pinSet: !!p.pin, lessons: (p.lessons || []).slice(), achievements: (p.achievements || []).slice() };
  }
};
function demoAuth(p, pin) {
  if (!p.pin) return '';
  if ((p.fails || 0) >= 3) return 'pin_locked';
  if (!pin) return 'pin_required';
  if (String(pin) === p.pin) { p.fails = 0; return ''; }
  p.fails = (p.fails || 0) + 1;
  return p.fails >= 3 ? 'pin_locked' : 'pin_wrong';
}
function demoGet(nick, pin) {
  var db = demoDb.load(), p = db.players[nick];
  if (!p) return { ok: true, exists: false, allowed: true, settings: db.settings };
  var bad = demoAuth(p, pin); demoDb.save(db);
  if (bad) return { ok: true, exists: true, needPin: true, error: bad, left: 3 - (p.fails || 0), settings: db.settings };
  return { ok: true, exists: true, player: demoDb.view(p), settings: db.settings };
}
function demoPost(b) {
  var db = demoDb.load(), nick = normNick(b.nick);
  if (b.action === 'create') {
    if (db.players[nick]) return { ok: false, error: 'nick_taken' };
    db.players[nick] = { nick: nick, gender: b.gender, 'class': b['class'], sheet: b.sheet || {}, quests: {}, pet: '' };
    demoDb.save(db);
    return { ok: true, player: demoDb.view(db.players[nick]), settings: db.settings };
  }
  if (b.action === 'setpin') {
    var pp = db.players[nick]; if (!pp) return { ok: false, error: 'no_player' };
    if (pp.pin) return { ok: false, error: 'pin_exists' };
    if (!/^\d{4}$/.test(String(b.pin || ''))) return { ok: false, error: 'bad_pin' };
    if (PIN_BANNED.indexOf(String(b.pin)) >= 0) return { ok: false, error: 'pin_easy' };
    pp.pin = String(b.pin); demoDb.save(db);
    return { ok: true, player: demoDb.view(pp), settings: db.settings };
  }
  if (db.players[nick]) { var bd = demoAuth(db.players[nick], b.pin); demoDb.save(db); if (bd) return { ok: false, needPin: true, error: bd }; db = demoDb.load(); }
  if (b.action === 'lesson') {
    var pl = db.players[nick]; if (!pl) return { ok: false, error: 'no_player' };
    pl.lessons = pl.lessons || []; if (pl.lessons.indexOf(b.lesson) < 0) pl.lessons.push(b.lesson);
    demoDb.save(db); return { ok: true, player: demoDb.view(pl), settings: db.settings };
  }
  if (b.action === 'seen') {
    var pz = db.players[nick]; if (!pz) return { ok: false, error: 'no_player' };
    pz.seen = (b.seen || []).slice(); demoDb.save(db);
    return { ok: true };
  }
  if (b.action === 'story' || b.action === 'auto') {
    var ps = db.players[nick]; if (!ps) return { ok: false, error: 'no_player' };
    ps.quests[b.quest || 'story'] = 'выполнен'; demoDb.save(db);
    return { ok: true, player: demoDb.view(ps), settings: db.settings };
  }
  if (b.action === 'submit') {
    var p = db.players[nick];
    if (!p) return { ok: false, error: 'no_player' };
    p.quests[b.quest] = 'на проверке';
    demoDb.save(db);
    return { ok: true, player: demoDb.view(p), settings: db.settings };
  }
  return { ok: false, error: 'unknown_action' };
}

// ПИН хранится в браузере отдельно для каждого ника и уходит с каждым запросом в теле, не в адресе
function savedPin(nick) { return store.get('ug_pin_' + nick) || ''; }
function apiGet(nick, pin) {
  if (pin === undefined) pin = savedPin(nick);
  if (DEMO) return sleep(300).then(function () { return demoGet(nick, pin); });
  return fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'get', nick: nick, pin: pin }) })
    .then(function (r) { return r.json(); });
}
function apiPost(body) {
  if (body.nick && body.pin === undefined) body.pin = savedPin(normNick(body.nick));
  var req = DEMO ? sleep(700).then(function () { return demoPost(body); })
    : fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  return req.then(function (res) {
    // ПИН сменили или сбросили, пока профиль был открыт: просим ввести заново
    if (res && res.needPin && S.nick) { store.del('ug_pin_' + S.nick); setTimeout(function () { closeModal(); screenPin(S.nick, res.error); }, 0); }
    return res;
  });
}

/* ================= СОСТОЯНИЕ ================= */
var S = { nick: '', player: null, settings: defaultSettings(), draft: {}, files: [] };

function clsKey() { return S.player ? keyByName(CLASSES, S.player['class']) : S.draft.cls; }
function genKey() { return S.player ? keyByName(GENDERS, S.player.gender) : S.draft.g; }
// сколько уровней даёт квест: разница с предыдущей ступенью
function lvlGain(id) {
  var prev = PROLOGUE_LVL, gain = 0;
  QUESTS.some(function (q) {
    if (!q.lvl) { if (q.id === id) gain = 0; return q.id === id; }
    if (q.id === id) { gain = q.lvl - prev; return true; }
    prev = q.lvl; return false;
  });
  return gain;
}
function questView(q) {
  var c = clsKey(), v = { id: q.id, tag: q.tag, title: q.title, task: q.task, lvl: q.lvl, proof: q.proof, boss: q.boss, links: q.links };
  if (q.byClass) { var b = q.byClass[c] || q.byClass.packer; v.title = b.title; v.task = b.task; }
  return v;
}
function questState(id) {
  var st = (S.player && S.player.quests && S.player.quests[id]) || '';
  if (AUTO_IDS.indexOf(id) >= 0) return st === 'выполнен' ? 'done' : 'active';
  if (st === 'выполнен') return 'done';
  if (st === 'на проверке') return 'review';
  if (st === 'доработать') return 'rework';
  if (S.settings[id] && S.settings[id].open) return 'active';
  // квест первой недели открывается вместе с её уроками, после первых квестов
  if (id === 'q1' && lessonsUnlocked()) return 'active';
  return 'locked';
}
function level() {
  var l = 0;
  l = PROLOGUE_LVL;
  QUESTS.forEach(function (q) { if (questState(q.id) === 'done' && (q.lvl || 0) > l) l = q.lvl; });
  return Math.min(MAX_LVL, l);
}
function remember(nick) { S.nick = nick; store.set('ug_nick', nick); setHash(nick); }

/* ================= МУЗЫКА ================= */
var music = (function () {
  var ctx = null, bus = null, dry = null, out = null, noiseBuf = null;
  var audioEl = null, timer = null, nextTime = 0, step = 0, playing = false;
  var muted = store.get('ug_muted') === '1';
  var VOL = 0.55, BPM = 78, S16 = 60 / BPM / 4, BAR = S16 * 16;
  // ре минор, трейлерная гармония: Dm – B♭ – Gm – A
  var PROG = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]];
  var ROOT = [38, 34, 31, 33];
  var OST = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 7, 0, 12, 7]; // струнное остинато
  var HORN = [[62, 69], [58, 65], [55, 62], [57, 64]];             // медь: квинты
  var MEL = [74, 74, 70, 69, 74, 77, 74, 73];                      // мелодия меди во второй половине
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function impulse(sec) {
    var len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    out = ctx.createGain(); out.gain.value = 0.0001; out.connect(ctx.destination);
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 5; comp.attack.value = 0.005; comp.release.value = 0.3;
    comp.connect(out);
    dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(comp);
    var rev = ctx.createConvolver(); rev.buffer = impulse(4.8);
    var revGain = ctx.createGain(); revGain.gain.value = 0.7; rev.connect(revGain); revGain.connect(comp);
    bus = ctx.createGain(); bus.connect(dry); bus.connect(rev);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }
  function env(g, t, vol, a, hold, r) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.setValueAtTime(vol, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
    return t + a + hold + r;
  }
  function osc(type, f, t, end, detune, dest) {
    var o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(end + 0.05); return o;
  }
  function filt(type, f, q, dest) { var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; b.connect(dest); return b; }
  function noise(t, end, dest) { var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.connect(dest); s.start(t); s.stop(end + 0.05); }

  // струны спиккато: короткие пилы через мягкий фильтр, октавное удвоение
  function strings(t, n, accent) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('lowpass', accent ? 1700 : 1200, 0.9, g);
    var end = env(g, t, accent ? 0.06 : 0.042, 0.006, S16 * 0.35, S16 * 1.1);
    osc('sawtooth', hz(n), t, end, -9, f); osc('sawtooth', hz(n), t, end, 9, f); osc('sawtooth', hz(n - 12), t, end, 0, f);
  }
  // длинные низкие струны
  function lowStrings(t, n) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('lowpass', 420, 0.8, g);
    var end = env(g, t, 0.07, 0.6, BAR - 0.6, 1.2);
    osc('sawtooth', hz(n - 12), t, end, -6, f); osc('sawtooth', hz(n - 12), t, end, 6, f); osc('sine', hz(n - 12), t, end, 0, g);
  }
  // хор «а-а-а»: пилы через две форманты с вибрато
  function choir(t, chord, vol) {
    var g = ctx.createGain(); g.connect(bus);
    var f1 = filt('bandpass', 730, 6, g), f2 = filt('bandpass', 1090, 7, g), f3 = filt('bandpass', 2440, 9, g);
    var mix = ctx.createGain(); mix.connect(f1); mix.connect(f2); mix.connect(f3);
    var end = env(g, t, vol, 1.4, BAR - 1.2, 1.8);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 7; lfo.connect(lg);
    lfo.start(t); lfo.stop(end + 0.05);
    chord.concat([chord[0] + 12]).forEach(function (n, i) {
      [-12, 0, 12].forEach(function (d) {
        var o = osc('sawtooth', hz(n), t, end, d + i * 2, mix); lg.connect(o.detune);
      });
    });
  }
  // медь: пилы с раскрывающимся фильтром, низкая октава
  function brass(t, notes, dur, vol) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('lowpass', 400, 1.4, g);
    f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(2000, t + 0.35); f.frequency.linearRampToValueAtTime(1100, t + dur);
    var end = env(g, t, vol, 0.12, dur - 0.2, 0.9);
    notes.forEach(function (n) { [-8, 0, 8].forEach(function (d) { osc('sawtooth', hz(n - 12), t, end, d, f); }); });
  }
  // «браам»: огромный низкий удар меди в начале частей
  function braam(t) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('lowpass', 150, 2, g);
    f.frequency.setValueAtTime(150, t); f.frequency.exponentialRampToValueAtTime(1600, t + 0.25); f.frequency.exponentialRampToValueAtTime(260, t + 3);
    var end = env(g, t, 0.22, 0.03, 0.6, 3);
    [26, 38, 45, 50].forEach(function (n) { [-14, 0, 14].forEach(function (d) { osc('sawtooth', hz(n), t, end, d, f); }); });
  }
  // тайко: низкий удар + шумовой «шлепок», всё в реверб
  function taiko(t, vol) {
    var g = ctx.createGain(); g.connect(bus);
    var o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(46, t + 0.35);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(g); o.start(t); o.stop(t + 1);
    var g2 = ctx.createGain(); g2.connect(bus);
    var f = filt('lowpass', 900, 0.8, g2);
    g2.gain.setValueAtTime(vol * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise(t, t + 0.15, f);
  }
  function smallDrum(t, vol) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('bandpass', 380, 1.2, g);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    noise(t, t + 0.2, f);
  }
  // нарастание тарелок перед вступлением
  function swell(t, dur) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('highpass', 3000, 0.7, g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.04);
    noise(t, t + dur + 0.1, f);
  }

  // трек экрана входа: спокойный эмбиент «загрузки», без барабанов
  var AMB_PROG = [[50, 57, 64], [46, 53, 62], [53, 60, 69], [48, 55, 64]]; // Dm(add9) – B♭ – F – C
  var AMB_ROOT = [38, 34, 41, 36];
  var AMB_ARP = { 0: 2, 3: 1, 6: 2, 10: 0, 12: 1 };
  function glass(t, n, vol) {
    var g = ctx.createGain(); g.connect(bus);
    var end = env(g, t, vol, 0.005, 0.05, 2.2);
    osc('sine', hz(n), t, end, 0, g); osc('triangle', hz(n + 12), t, end, 4, g);
  }
  function ambPad(t, chord) {
    var g = ctx.createGain(); g.connect(bus);
    var f = filt('lowpass', 700, 0.7, g);
    f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1300, t + BAR * 0.5); f.frequency.linearRampToValueAtTime(600, t + BAR);
    var end = env(g, t, 0.05, 1.6, BAR - 1.2, 2.4);
    chord.forEach(function (n) { osc('sawtooth', hz(n), t, end, -7, f); osc('sawtooth', hz(n), t, end, 7, f); });
  }
  function scheduleAmbient() {
    while (nextTime < ctx.currentTime + 0.3) {
      var t = nextTime, bar = Math.floor(step / 16), s = step % 16, ch = bar % 4, chord = AMB_PROG[ch];
      if (s === 0) { ambPad(t, chord); lowStrings(t, AMB_ROOT[ch] + 12); }
      if (AMB_ARP[s] !== undefined) glass(t, chord[AMB_ARP[s]] + 12, s === 0 ? 0.05 : 0.035);
      if (bar % 2 === 1 && s === 8) glass(t, chord[2] + 24, 0.02);
      nextTime += S16; step++;
    }
  }
  var track = 'epic';
  function runTrack() { if (track === 'ambient') scheduleAmbient(); else schedule(); }
  function schedule() {
    while (nextTime < ctx.currentTime + 0.3) {
      var t = nextTime, bar = Math.floor(step / 16), s = step % 16, ch = bar % 4, chord = PROG[ch], root = ROOT[ch];
      // 1: струны и хор сразу; 2: + барабаны; 3: всё вместе с медью и мелодией
      var sec = bar < 4 ? 1 : bar < 8 ? 2 : ((Math.floor((bar - 8) / 8) % 2) ? 2 : 3);
      if (s === 0) {
        lowStrings(t, root + 12);
        if (sec >= 1) choir(t, chord, sec === 3 ? 0.11 : 0.08);
        if (sec === 3) brass(t, HORN[ch], BAR * 0.95, 0.05);
        if (bar % 8 === 0) braam(t);   // удар меди с первой секунды
        if (bar % 8 === 6) swell(t, BAR * 2);
      }
      if (sec === 3 && bar % 8 >= 4 && (s === 0 || s === 8)) brass(t, [MEL[(bar % 4) * 2 + (s ? 1 : 0)] + 12], BAR / 2, 0.035);
      strings(t, root + 12 + OST[s], s % 4 === 0);
      if (sec >= 2) {
        if (s === 0 || s === 8) taiko(t, 0.85);
        if (s === 6 || s === 11) taiko(t, 0.5);
        if (s === 4 || s === 12) smallDrum(t, 0.25);
        if (ch === 3 && s >= 12) smallDrum(t, 0.18 + (s - 12) * 0.05);
      } else if (s === 0) {
        taiko(t, 0.55);
      }
      nextTime += S16; step++;
    }
  }
  function fadeTo(v, sec) {
    if (audioEl) {
      var from = audioEl.volume, t0 = Date.now();
      var id = setInterval(function () {
        var k = Math.min(1, (Date.now() - t0) / (sec * 1000));
        audioEl.volume = from + (v - from) * k;
        if (k >= 1) { clearInterval(id); if (v === 0) audioEl.pause(); }
      }, 50);
      return;
    }
    if (!ctx) return;
    var g = out.gain, now = ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.exponentialRampToValueAtTime(Math.max(v, 0.0001), now + sec);
  }
  function start(tr) {
    tr = tr || 'epic';
    if (playing) { if (tr !== track) switchTo(tr); return; }
    playing = true;
    track = tr;
    try {
      if (CONFIG.MUSIC_URL) {
        if (!audioEl) { audioEl = new Audio(CONFIG.MUSIC_URL); audioEl.loop = true; audioEl.volume = 0; }
        if (!muted) { audioEl.play().catch(function () {}); fadeTo(0.5, 0.15); }
      } else {
        if (!ctx) build();
        if (ctx.state === 'suspended') ctx.resume();
        unlockIOS();
        if (!timer) { nextTime = ctx.currentTime + 0.1; step = 0; timer = setInterval(runTrack, 100); runTrack(); }
        if (!muted) fadeTo(VOL, 0.12);
      }
    } catch (e) { playing = false; }
    btn(true);
  }
  // смена трека: короткое затухание и сразу новый трек с ударом
  function switchTo(tr) {
    if (!ctx || CONFIG.MUSIC_URL) { track = tr; return; }
    if (muted) { track = tr; step = 0; nextTime = ctx.currentTime + 0.05; return; }
    switching = true;
    fadeTo(0, 0.35);
    setTimeout(function () {
      track = tr; step = 0; nextTime = ctx.currentTime + 0.05;
      fadeTo(VOL, 0.08); switching = false;
    }, 380);
  }
  function stop() {
    if (!playing) return;
    playing = false;
    fadeTo(0, 2);
    setTimeout(function () { if (!playing && timer) { clearInterval(timer); timer = null; } }, 2200);
    btn(false);
  }
  function toggle() {
    if (!playing) { muted = false; store.set('ug_muted', '0'); start(S.screen === 'login' ? 'ambient' : 'epic'); return; }
    muted = !muted; store.set('ug_muted', muted ? '1' : '0');
    if (audioEl) { if (muted) fadeTo(0, 0.4); else { audioEl.play().catch(function () {}); fadeTo(0.5, 0.8); } }
    else fadeTo(muted ? 0 : VOL, 0.12);
    btn(true);
  }
  function btn(show) {
    var b = root.querySelector('.ug-sound');
    if (!show) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('button'); b.className = 'ug-sound'; b.setAttribute('data-act', 'sound'); root.appendChild(b); }
    var on = playing && !muted;
    b.innerHTML = (on ? ICONS_SND.on : ICONS_SND.off) + '<span>' + (on ? 'звук вкл' : 'звук выкл') + '</span>';
  }
  document.addEventListener('visibilitychange', function () {
    if (!playing) return;
    if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); }
    if (audioEl && !muted) { if (document.hidden) audioEl.pause(); else audioEl.play().catch(function () {}); }
  });

  /* звуки интерфейса: отдельный канал со своей короткой реверберацией, мимо музыкального фейда */
  var sfxOut = null, sfxRev = null;
  function sfxReady() {
    if (muted) return false;
    try {
      if (!ctx) build();
      if (ctx.state === 'suspended') ctx.resume();
      if (!sfxOut) {
        sfxOut = ctx.createGain(); sfxOut.gain.value = 0.9; sfxOut.connect(ctx.destination);
        var conv = ctx.createConvolver(); conv.buffer = impulse(1.3);
        sfxRev = ctx.createGain(); sfxRev.gain.value = 0.35; sfxRev.connect(conv); conv.connect(sfxOut);
      }
      return true;
    } catch (e) { return false; }
  }
  // мягкий тон с быстрым затуханием, частично в реверб
  function tone(f1, f2, t, dur, vol, type, wet) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t);
    if (f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxOut); if (wet) g.connect(sfxRev);
    o.start(t); o.stop(t + dur + 0.05);
  }
  // короткий щелчок шума: «касание» стекла/металла
  function tick(t, freq, dur, vol, q) {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = freq; b.Q.value = q || 2;
    var g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(b); b.connect(g); g.connect(sfxOut); g.connect(sfxRev);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.02);
  }
  function whoosh(t, dur, from, to, vol) {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 1.2;
    b.frequency.setValueAtTime(from, t); b.frequency.exponentialRampToValueAtTime(to, t + dur);
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(b); b.connect(g); g.connect(sfxOut); g.connect(sfxRev);
    src.start(t); src.stop(t + dur + 0.05);
  }
  // музыка на мгновение приседает, чтобы звук нажатия был слышен поверх неё
  var switching = false;
  var held = false;
  // пауза музыки на время видеоурока
  function hold(on) {
    held = on;
    if (!playing || muted) return;
    if (audioEl) { if (on) fadeTo(0, 0.4); else { audioEl.play().catch(function () {}); fadeTo(0.5, 1); } return; }
    if (ctx) fadeTo(on ? 0 : VOL, on ? 0.5 : 1.2);
  }
  function duck(t) {
    if (!out || !playing || muted || switching || audioEl || held) return;
    var g = out.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(VOL, t);
    g.linearRampToValueAtTime(VOL * 0.45, t + 0.03); g.linearRampToValueAtTime(VOL, t + 0.45);
  }
  function sfx(kind) {
    if (!sfxReady()) return;
    var t = ctx.currentTime + 0.004;
    duck(t);
    if (kind === 'tick') {          // выбор варианта, ссылки
      tick(t, 4800, 0.04, 0.5, 2.5);
      tone(1760, 1760, t, 0.12, 0.08, 'sine', true);
      return;
    }
    if (kind === 'click') {         // кнопки и большие карточки
      tone(170, 70, t, 0.14, 0.55, 'sine');
      tick(t, 3000, 0.05, 0.55, 1.4);
      tone(1320, 1320, t + 0.01, 0.22, 0.09, 'sine', true);
      tone(1980, 1980, t + 0.05, 0.18, 0.05, 'sine', true);
      return;
    }
    if (kind === 'confirm') {       // подтверждение: подъём и мягкий аккорд
      whoosh(t, 0.32, 500, 4200, 0.12);
      [587.3, 880, 1174.7].forEach(function (f) { tone(f, f, t + 0.22, 0.9, 0.045, 'sine', true); });
      tone(90, 55, t + 0.22, 0.4, 0.3, 'sine');
      return;
    }
    if (kind === 'combo') {          // комбо: быстрый подъём и яркий аккорд
      whoosh(t, 0.35, 400, 7000, 0.12);
      [440, 554.4, 659.3, 880, 1108.7, 1318.5].forEach(function (f, i) { tone(f, f, t + 0.05 + i * 0.055, 0.5, 0.05, 'sine', true); });
      [880, 1108.7, 1318.5, 1760].forEach(function (f) { tone(f, f * 1.004, t + 0.42, 1.8, 0.03, 'sine', true); });
      tone(130, 55, t + 0.4, 0.5, 0.4, 'sine');
      tick(t + 0.4, 8000, 0.3, 0.1, 0.8);
      return;
    }
    if (kind === 'anvil') {         // ачивку прибили к доске: удар по металлу и звон
      tone(150, 52, t, 0.32, 0.65, 'sine');
      tick(t, 2600, 0.09, 0.9, 0.7);
      tick(t, 6500, 0.05, 0.5, 1.2);
      [[612, 1.9, 0.11], [1689, 1.3, 0.075], [3302, 0.85, 0.05], [5460, 0.5, 0.03]].forEach(function (p) {
        tone(p[0], p[0], t + 0.002, p[1], p[2], 'sine', true);
        tone(p[0] * 1.004, p[0] * 1.004, t + 0.002, p[1] * 0.8, p[2] * 0.6, 'sine', true);
      });
      // отскок молотка: второй удар тише
      tick(t + 0.16, 3000, 0.05, 0.35, 0.9);
      [[612, 0.9, 0.04], [1689, 0.6, 0.03]].forEach(function (p) { tone(p[0], p[0], t + 0.16, p[1], p[2], 'sine', true); });
      return;
    }
    if (kind === 'achieve') {       // ачивка: широкое сияние
      whoosh(t, 0.45, 300, 6000, 0.1);
      [587.3, 740, 880, 1174.7, 1480].forEach(function (f, i) {
        tone(f, f, t + 0.3 + i * 0.012, 1.6, 0.032, 'sine', true);
        tone(f * 1.003, f * 1.003, t + 0.3 + i * 0.012, 1.6, 0.02, 'sine', true);
      });
      tone(110, 55, t + 0.3, 0.6, 0.35, 'sine');
      tick(t + 0.3, 7000, 0.25, 0.08, 0.8);
    }
  }
  // создать звуковой контекст прямо в момент нажатия, чтобы браузер разрешил звук после ответа сервера
  function prime() { try { if (!ctx) build(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} unlockIOS(); }
  // iPhone глушит Web Audio беззвучным режимом. Просим «режим воспроизведения»,
  // а на старых iOS включаем тихий аудиофайл: после него звук идёт и при выключенном звонке.
  var iosEl = null;
  function unlockIOS() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    var ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    // во встроенных браузерах (Telegram, Instagram) audioSession может не сработать, поэтому тихий файл включаем всегда
    if (!ios || iosEl) return;
    try {
      iosEl = document.createElement('audio');
      iosEl.setAttribute('playsinline', ''); iosEl.setAttribute('x-webkit-airplay', 'deny'); iosEl.loop = true; iosEl.preload = 'auto';
      iosEl.src = silentWav();
      var pr = iosEl.play(); if (pr && pr.catch) pr.catch(function () { iosEl = null; });
    } catch (e) { iosEl = null; }
  }
  // полсекунды тишины в формате WAV (8 кГц, 8 бит), собираем на лету
  function silentWav() {
    var n = 4000, b = 'RIFF', le = function (v, k) { var r = ''; for (var i = 0; i < k; i++) { r += String.fromCharCode(v & 255); v >>= 8; } return r; };
    b += le(36 + n, 4) + 'WAVEfmt ' + le(16, 4) + le(1, 2) + le(1, 2) + le(8000, 4) + le(8000, 4) + le(1, 2) + le(8, 2) + 'data' + le(n, 4);
    for (var i = 0; i < n; i++) b += String.fromCharCode(128);
    return 'data:audio/wav;base64,' + btoa(b);
  }
  function running() { return !!ctx && ctx.state === 'running'; }
  return { start: start, stop: stop, toggle: toggle, sfx: sfx, prime: prime, running: running, hold: hold, showBtn: function () { btn(true); }, isPlaying: function () { return playing; } };
})();
var ICONS_SND = {
  on: '<svg class="ug-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  off: '<svg class="ug-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>'
};

/* ================= РЕНДЕР ================= */
/* мир: картинки Кайроса под первыми экранами, с медленным отъездом камеры.
   scene: 'city' (город, текст слева), 'village' (деревня, текст справа) */
var SCENES = { city: 'CITY_IMAGE', village: 'VILLAGE_IMAGE' };
// медленно всплывающие огоньки поверх картинки
function motes() {
  var h = '';
  for (var i = 0; i < 18; i++) {
    var x = Math.round(Math.random() * 100), d = 14 + Math.random() * 16, del = -Math.random() * d, sz = 2 + Math.round(Math.random() * 2);
    h += '<i style="left:' + x + '%;width:' + sz + 'px;height:' + sz + 'px;animation-duration:' + d.toFixed(1) + 's;animation-delay:' + del.toFixed(1) + 's"></i>';
  }
  return h;
}
function world(scene) {
  var w = root.querySelector('.ug-world');
  if (!w) {
    w = document.createElement('div'); w.className = 'ug-world';
    w.innerHTML = Object.keys(SCENES).map(function (k) {
      var url = CONFIG[SCENES[k]];
      return url ? '<div class="ug-world-img is-' + k + '" style="background-image:url(\'' + esc(url) + '\')"></div>' : '';
    }).join('') + '<div class="ug-world-shade"></div><div class="ug-motes">' + motes() + '</div>';
    root.insertBefore(w, stage);
  }
  var ok = !!(scene && CONFIG[SCENES[scene]]);
  root.classList.toggle('has-world', ok);
  Object.keys(SCENES).forEach(function (k) { root.classList.toggle('scene-' + k, ok && scene === k); });
  return ok;
}

function show(html, opts) {
  opts = opts || {};
  root.classList.toggle('is-dash', !!opts.dash);
  root.classList.toggle('is-boot', !!opts.boot);
  world(opts.world);
  if (opts.acc) root.style.setProperty('--acc', opts.acc); else root.style.removeProperty('--acc');
  stage.innerHTML = '<div class="ug-screen ug-enter">' + html + '</div>';
  root.scrollTop = 0;
}
var toastTimer;
function toast(msg) {
  var t = root.querySelector('.ug-toast');
  if (!t) { t = document.createElement('div'); t.className = 'ug-toast'; root.appendChild(t); }
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
}
function copy(text) {
  var done = function () { toast('Ссылка скопирована'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
  } else { fallbackCopy(text); done(); }
}
function fallbackCopy(text) {
  var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  root.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} root.removeChild(ta);
}

/* ---------- короткая загрузка для тех, кого уже знаем ---------- */
function screenLoading(nick) {
  S.screen = 'loading';
  show('<div class="ug-center"><div class="ug-mini-load"><div class="ug-logo-word">АПГРЕЙД</div>' +
    '<div class="ug-load"><div class="ug-load-row mono"><span>Загрузка профиля</span><span>@' + esc(nick) + '</span></div><div class="ug-load-bar"><i class="is-run"></i></div></div></div></div>');
  apiGet(nick).then(function (res) {
    if (res && res.settings) S.settings = res.settings;
    if (res && res.ok && res.exists && res.needPin) { screenPin(nick, res.error); return; }
    if (res && res.ok && res.exists) { S.player = res.player; remember(res.player.nick); screenDash(); return; }
    screenLogin(nick);
  }).catch(function () { screenLogin(nick, 'Нет связи. Проверь интернет и попробуй ещё раз.'); });
}

/* ---------- вход: первый экран ---------- */
function steps(n) {
  var names = ['Пол', 'Класс', 'Лист «до»'];
  return '<div class="ug-steps">' + names.map(function (nm, i) {
    var cls = i + 1 === n ? 'is-on' : (i + 1 < n ? 'is-done' : '');
    return (i ? '<i></i>' : '') + '<span class="' + cls + '">' + (i + 1) + ' · ' + nm + '</span>';
  }).join('') + '</div>';
}

function screenLogin(prefill, err) {
  S.screen = 'login';
  var img = !!CONFIG.CITY_IMAGE;
  show(
    '<div class="' + (img ? 'ug-boot has-img is-left' : 'ug-narrow') + '">' +
      '<div class="ug-logo-word ug-login-logo">АПГРЕЙД</div>' +
      '<div class="ug-kicker">// идентификация игрока</div>' +
      '<h2 class="ug-h2">Кто входит в игру?</h2>' +
      '<p class="ug-p">Введи свой ник в Telegram. Если персонаж уже создан, откроем его профиль, если нет, создадим нового.</p>' +
      '<form class="ug-form" data-form="login" style="margin-top:26px;width:100%;max-width:460px" novalidate>' +
        '<label class="ug-field"><span class="ug-at">@</span><input name="nick" value="' + esc(prefill || '') + '" placeholder="nickname" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="40"></label>' +
        '<div class="ug-hint">Без @. Если ника в Telegram нет, придумай любой латиницей: буквы, цифры и «_», от 3 символов.</div>' +
        '<div class="ug-err">' + esc(err || '') + '</div>' +
        '<button class="ug-btn is-wide" type="button" data-act="login-go">Войти</button>' +
      '</form>' +
    '</div>', { world: 'city' });
  var inp = root.querySelector('input[name=nick]');
  if (inp && window.matchMedia('(min-width:761px)').matches) inp.focus();
}

/* ---------- ПИН-код ---------- */
var NOT_ALLOWED = function (nick) { return 'Ника @' + nick + ' нет в списке участников потока. Проверь, что вводишь свой ник из Telegram, или напиши Грише @gregnikol.'; };
var PIN_ERR = {
  pin_wrong: 'Неверный ПИН-код.',
  pin_locked: 'Извини, доступ заблокирован. Напиши Грише @gregnikol, он поможет его вернуть.',
  pin_required: ''
};
var PIN_BANNED = ['1234', '4321'];
var PIN_EASY = 'Это слишком лёгкий ПИН, камон))';
function pinInput() {
  return '<label class="ug-field ug-pin-field"><input name="pin" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="0000" spellcheck="false"></label>';
}
function readPin(scope) {
  var inp = scope.querySelector('input[name=pin]');
  return inp ? inp.value.replace(/\D/g, '').slice(0, 4) : '';
}
// вход на новом устройстве: ник есть, ПИН нужен
function screenPin(nick, error, left) {
  S.screen = 'login';
  root.querySelectorAll('.ug-modal').forEach(function (m) { m.remove(); });
  var msg = PIN_ERR[error] || '';
  if (error === 'pin_wrong' && left > 0) msg += ' Осталось попыток: ' + left + '.';
  if (error === 'pin_locked') {
    show(
      '<div class="' + (CONFIG.CITY_IMAGE ? 'ug-boot has-img is-left' : 'ug-narrow') + '">' +
        '<div class="ug-logo-word ug-login-logo">АПГРЕЙД</div>' +
        '<div class="ug-kicker">// идентификация · @' + esc(nick) + '</div>' +
        '<h2 class="ug-h2">Доступ заблокирован</h2>' +
        '<p class="ug-p">' + esc(PIN_ERR.pin_locked) + '</p>' +
        '<div style="margin-top:22px"><button class="ug-link" type="button" data-act="relogin">← Другой ник</button></div>' +
      '</div>', { world: 'city' });
    return;
  }
  show(
    '<div class="' + (CONFIG.CITY_IMAGE ? 'ug-boot has-img is-left' : 'ug-narrow') + '">' +
      '<div class="ug-logo-word ug-login-logo">АПГРЕЙД</div>' +
      '<div class="ug-kicker">// идентификация · @' + esc(nick) + '</div>' +
      '<h2 class="ug-h2">Введи ПИН-код</h2>' +
      '<p class="ug-p">Четыре цифры, которые защищают твой профиль. На этом устройстве их нужно ввести один раз.</p>' +
      '<form class="ug-form" data-form="pin" data-nick="' + esc(nick) + '" style="margin-top:26px;width:100%;max-width:460px" novalidate>' +
        pinInput() +
        '<div class="ug-hint">Забыл ПИН? Напиши Грише @gregnikol, он сбросит его, и ты придумаешь новый.</div>' +
        '<div class="ug-err">' + esc(msg) + '</div>' +
        '<button class="ug-btn is-wide" type="button" data-act="pin-go">Войти</button>' +
        '<div style="margin-top:16px"><button class="ug-link" type="button" data-act="relogin">← Другой ник</button></div>' +
      '</form>' +
    '</div>', { world: 'city' });
  var inp = root.querySelector('input[name=pin]');
  if (inp) inp.focus();
}
function submitPin(form) {
  var nick = form.getAttribute('data-nick'), pin = readPin(form), err = form.querySelector('.ug-err'), btn = form.querySelector('[data-act=pin-go]');
  if (pin.length !== 4) { err.textContent = 'ПИН-код состоит из четырёх цифр.'; return; }
  btn.classList.add('is-loading');
  apiGet(nick, pin).then(function (res) {
    btn.classList.remove('is-loading');
    if (!res || !res.ok) { err.textContent = 'Не получилось связаться с сервером. Попробуй ещё раз.'; return; }
    if (res.settings) S.settings = res.settings;
    if (res.needPin && res.error === 'pin_locked') { screenPin(nick, 'pin_locked'); return; }
    if (res.needPin) {
      var msg = PIN_ERR[res.error] || 'Неверный ПИН-код.';
      if (res.error === 'pin_wrong' && res.left > 0) msg += ' Осталось попыток: ' + res.left + '.';
      err.textContent = msg; form.querySelector('.ug-field').classList.add('is-bad');
      var i = form.querySelector('input[name=pin]'); i.value = ''; i.focus();
      return;
    }
    if (!res.exists) { screenLogin(nick); return; }
    store.set('ug_pin_' + nick, pin);
    S.player = res.player; remember(nick); S.screen = 'dash';
    if (store.get('ug_muted') !== '1') music.start('epic');
    screenDash();
  }).catch(function () { btn.classList.remove('is-loading'); err.textContent = 'Нет связи. Проверь интернет и попробуй ещё раз.'; });
}
// придумать ПИН: окно поверх профиля, закрыть его нельзя, пока ПИН не сохранён
function pinSetupModal(then) {
  closeModal();
  var m = document.createElement('div');
  m.className = 'ug-modal is-locked';
  root.appendChild(m);
  S.afterPin = then;
  pinSetupStep(m, 1, '');
}
// шаг 1: придумать, шаг 2: повторить
function pinSetupStep(m, step, error) {
  S.pinFirst = step === 1 ? '' : S.pinFirst;
  m.innerHTML = '<div class="ug-dialog ug-pin-dialog" role="dialog" aria-modal="true">' +
    '<div class="ug-pin-ico">' + ico('lock') + '</div>' +
    '<div class="ug-kicker">// защита персонажа · шаг ' + step + ' из 2</div>' +
    (step === 1
      ? '<h2 class="ug-h2">Придумай ПИН-код</h2>' +
        '<p class="ug-p">Четыре цифры, чтобы в профиль не зашёл никто другой. На этом устройстве вводить их не придётся. Они понадобятся, когда откроешь профиль с телефона или другого компьютера.</p>'
      : '<h2 class="ug-h2">Повтори ПИН-код</h2>' +
        '<p class="ug-p">Введи те же четыре цифры ещё раз, чтобы не ошибиться.</p>') +
    '<form data-form="pin-set" novalidate>' + pinInput() +
      '<div class="ug-err">' + esc(error || '') + '</div>' +
      '<button class="ug-btn is-wide" type="button" data-act="pin-save">' + (step === 1 ? 'Дальше' : 'Сохранить ПИН') + '</button>' +
    '</form></div>';
  if (error) m.querySelector('.ug-field').classList.add('is-bad');
  var inp = m.querySelector('input[name=pin]');
  setTimeout(function () { if (inp) inp.focus(); }, 50);
}
function savePin(form) {
  var pin = readPin(form), err = form.querySelector('.ug-err'), btn = form.querySelector('[data-act=pin-save]');
  var m = form.closest('.ug-modal');
  if (pin.length !== 4) { err.textContent = 'Нужно ровно четыре цифры.'; form.querySelector('.ug-field').classList.add('is-bad'); return; }
  if (!S.pinFirst) {
    if (PIN_BANNED.indexOf(pin) >= 0) { err.textContent = PIN_EASY; form.querySelector('.ug-field').classList.add('is-bad'); form.querySelector('input[name=pin]').value = ''; return; }
    S.pinFirst = pin; music.sfx('tick'); pinSetupStep(m, 2, ''); return;
  }
  if (pin !== S.pinFirst) { pinSetupStep(m, 1, 'ПИН-коды не совпали. Придумай ПИН заново.'); return; }
  btn.classList.add('is-loading');
  apiPost({ action: 'setpin', nick: S.nick, pin: pin }).then(function (res) {
    btn.classList.remove('is-loading');
    if (res && res.ok) {
      store.set('ug_pin_' + S.nick, pin);
      S.player = res.player; if (res.settings) S.settings = res.settings;
      var m = root.querySelector('.ug-modal.is-locked'); if (m) m.remove();
      music.sfx('confirm');
      achievement('ПИН-код сохранён · ' + pin);
      var fn = S.afterPin; S.afterPin = null; if (fn) setTimeout(fn, 400);
      return;
    }
    if (res && res.error === 'pin_exists') { store.del('ug_pin_' + S.nick); screenPin(S.nick); return; }
    if (res && res.error === 'pin_easy') { pinSetupStep(m, 1, PIN_EASY); return; }
    err.textContent = 'Не получилось сохранить. Попробуй ещё раз.';
  }).catch(function () { btn.classList.remove('is-loading'); err.textContent = 'Нет связи. Проверь интернет и попробуй ещё раз.'; });
}

/* ---------- лор ---------- */
function screenLore() {
  show(
    '<div class="ug-boot' + (CONFIG.VILLAGE_IMAGE ? ' has-img' : '') + ' ug-lore-screen"><div class="ug-lore-panel">' +
      '<div class="ug-boot-top mono">' + esc(LORE.place) + '</div>' +
      '<h2 class="ug-h2 ug-lore-title">' + esc(LORE.title) + '</h2>' +
      '<div class="ug-lore">' + LORE.text.map(function (t) { return '<p class="is-on">' + esc(t) + '</p>'; }).join('') + '</div>' +
      '<div class="ug-boot-act"><button class="ug-btn" data-act="land">Начать путь</button></div>' +
    '</div></div>', { boot: true, world: 'village' });
}

function submitLogin(form) {
  var raw = form.querySelector('input[name=nick]').value, nick = normNick(raw), err = form.querySelector('.ug-err'), btn = form.querySelector('[data-act=login-go]');
  if (!nick) { err.textContent = 'Ник: латиница, цифры и «_», от 3 до 32 символов.'; return; }
  btn.classList.add('is-loading');
  apiGet(nick).then(function (res) {
    btn.classList.remove('is-loading');
    if (!res || !res.ok) { err.textContent = 'Не получилось связаться с сервером. Попробуй ещё раз.'; return; }
    if (res.settings) S.settings = res.settings;
    if (res.exists && res.needPin) { screenPin(nick, res.error); return; }
    if (res.exists) { S.player = res.player; remember(nick); S.screen = 'dash'; if (store.get('ug_muted') !== '1') music.start('epic'); screenDash(); return; }
    if (res.allowed === false) { err.textContent = NOT_ALLOWED(nick); return; }
    S.draft = { nick: nick };
    S.screen = 'lore';
    music.start('epic');
    screenLore();
  }).catch(function () { btn.classList.remove('is-loading'); err.textContent = 'Нет связи. Проверь интернет и попробуй ещё раз.'; });
}

/* ---------- пол ---------- */
function screenGender() {
  function card(g, color) {
    var img = CONFIG.GENDER_IMAGES[g];
    return '<button class="ug-gender" data-act="gender" data-g="' + g + '" style="--acc:' + color + '">' +
      '<div class="ug-portrait">' + (img ? '<img src="' + esc(img) + '" alt="">' : placeholder(g, color)) + '</div>' +
      '<div class="ug-gender-name">' + GENDERS[g] + '</div></button>';
  }
  show(
    '<div class="ug-wrap" style="max-width:720px">' +
      steps(1) +
      '<div class="ug-kicker">// создание персонажа · @' + esc(S.draft.nick) + '</div>' +
      '<h2 class="ug-h2">Выбери пол персонажа</h2>' +
      '<div class="ug-genders">' + card('m', '#00f0ff') + card('f', '#ff2bd6') + '</div>' +
      '<div style="margin-top:22px"><button class="ug-link" data-act="relogin">← Другой ник</button></div>' +
    '</div>');
}

/* ---------- класс ---------- */
function screenClass() {
  var g = S.draft.g;
  var cards = Object.keys(CLASSES).map(function (k) {
    var c = CLASSES[k];
    return '<div class="ug-class" role="button" tabindex="0" data-act="class" data-cls="' + k + '" style="--acc:' + c.color + '">' +
      '<span class="ug-check">' + ico('check') + '</span>' +
      portrait(g, k) +
      '<div class="ug-class-body"><div class="ug-class-name">' + c.name + '</div><div class="ug-class-desc">' + esc(c.desc) + '</div>' +
      '<div class="ug-class-cta"><div><button class="ug-btn is-wide" data-act="class-confirm">Выбрать класс</button></div></div></div>' +
    '</div>';
  }).join('');
  show(
    '<div class="ug-wrap">' +
      steps(2) +
      '<div class="ug-head"><div><div class="ug-kicker">// создание персонажа · @' + esc(S.draft.nick) + '</div>' +
      '<h2 class="ug-h2">Выбери класс</h2></div></div>' +
      '<div class="ug-infobox"><div class="ug-infobox-t">На что влияет класс?</div>' +
        '<p>Класс определяет, в каком формате ты будешь проходить обучение, как будешь упаковывать себя и каких клиентов находить.</p>' +
        '<p>На второй неделе у каждого класса своя программа, при этом уроки остальных классов тоже будут тебе доступны.</p>' +
        '<p>Выбирай либо то, как ты <b>уже</b> работаешь, либо то, как <b>хочешь</b> начать работать.</p></div>' +
      '<div class="ug-classes" id="ug-classes">' + cards + '</div>' +
      '<div><button class="ug-link" data-act="back-gender">← Назад к выбору пола</button></div>' +
    '</div>');
}
function pickClass(el) {
  var k = el.getAttribute('data-cls');
  S.draft.cls = k;
  var wrap = root.querySelector('#ug-classes');
  wrap.classList.add('has-sel');
  wrap.querySelectorAll('.ug-class').forEach(function (b) { b.classList.toggle('is-sel', b === el); });
  // кнопка появляется внутри карточки: докручиваем, чтобы она была видна целиком
  var cta = el.querySelector('.ug-class-cta');
  setTimeout(function () { try { cta.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); } catch (e) {} }, 380);
}
function confirmClass() {
  var k = S.draft.cls; if (!k) return;
  modal(
    '<div class="ug-kicker">// подтверждение</div>' +
    '<h2 class="ug-h2">' + CLASSES[k].name + '?</h2>' +
    '<p class="ug-p">Класс выбирается один раз на весь поток, сменить его потом нельзя.</p>' +
    '<div class="ug-dialog-actions"><button class="ug-btn is-ghost" data-act="close">Подумаю ещё</button>' +
    '<button class="ug-btn" data-act="class-ok">Подтверждаю</button></div>', CLASSES[k].color);
}

/* ---------- лист «до»: вводный экран и квиз ---------- */
function screenSheet() { // вводный экран
  var k = S.draft.cls;
  var answered = S.draft.ans || {};
  var slots = QUIZ.map(function (q) {
    var done = quizValid(q, answered[q.key]);
    return '<div class="ug-slot' + (done ? ' is-done' : '') + '"><span class="ug-slot-ico">' + ico(q.icon) + '</span>' +
      '<span><b>' + esc(q.stat) + '</b><small>' + (done ? 'готово' : 'пусто') + '</small></span></div>';
  }).join('');
  show(
    '<div class="ug-wrap" style="max-width:820px">' +
      steps(3) +
      '<div class="ug-kicker">// сканирование персонажа · ' + CLASSES[k].name + '</div>' +
      '<h2 class="ug-h2">Зафиксируем стартовую точку</h2>' +
      '<p class="ug-p">Это скан для тебя самого: где ты сейчас по деньгам, навыкам и клиентам. Через четыре недели просканируем персонажа ещё раз, и ты увидишь, насколько прокачался.</p>' +
      '<div class="ug-slots">' + slots + '</div>' +
      '<div class="ug-meta mono">' + QUIZ.length + ' вопросов · около минуты · суммы видит только Гриша</div>' +
      '<button class="ug-btn" data-act="quiz-start">Начать сканирование</button>' +
      '<div style="margin-top:16px"><button class="ug-link" data-act="back-class">← Назад к выбору класса</button></div>' +
    '</div>', { acc: CLASSES[k].color });
}

function quizAns(q) {
  S.draft.ans = S.draft.ans || {};
  if (!S.draft.ans[q.key]) S.draft.ans[q.key] = { sel: [], other: '', link: '', num: 0, touched: false };
  return S.draft.ans[q.key];
}
function quizValid(q, a) {
  if (!a) return false;
  if (q.type === 'range') return a.num > 0;
  var hasOther = a.sel.indexOf(OTHER) >= 0;
  if (hasOther && !a.other.trim()) return false;
  return a.sel.length > 0;
}
function money(n, max) { return n.toLocaleString('ru-RU').replace(/\u00a0/g, ' ') + ' ₽' + (max && n >= max ? ' и больше' : ''); }
function quizValue(q, a) {
  if (q.type === 'range') return money(a.num, q.max);
  var parts = a.sel.filter(function (s) { return s !== OTHER; });
  if (a.sel.indexOf(OTHER) >= 0 && a.other.trim()) parts.push(a.other.trim());
  var v = parts.join(', ');
  if (q.link && a.link.trim()) v += ' · ' + a.link.trim();
  return v;
}

function screenQuiz(i) {
  S.draft.qi = i;
  var q = QUIZ[i], a = quizAns(q), k = S.draft.cls;
  var prog = QUIZ.map(function (x, j) {
    var cls = j === i ? 'is-cur' : (quizValid(x, (S.draft.ans || {})[x.key]) ? 'is-on' : '');
    return '<i class="' + cls + '"></i>';
  }).join('');
  var opts = (q.options || []).concat(q.other ? [OTHER] : []);
  var chips = opts.map(function (o, j) {
    var on = a.sel.indexOf(o) >= 0;
    return '<button class="ug-chip' + (on ? ' is-on' : '') + (q.type === 'single' ? ' is-single' : '') + '" data-act="quiz-opt" data-i="' + j + '">' +
      '<span class="ug-chip-box">' + ico('check') + '</span><span>' + esc(o) + '</span></button>';
  }).join('');
  var last = i === QUIZ.length - 1;
  show(
    '<div class="ug-quiz">' +
      '<div class="ug-qtop"><div class="ug-kicker">// сканирование · ' + (i + 1) + ' из ' + QUIZ.length + '</div>' +
      '<div class="ug-qprog">' + prog + '</div></div>' +
      '<div class="ug-stat"><div class="ug-stat-ico">' + ico(q.icon) + '</div>' +
        '<div><div class="ug-stat-name mono">' + esc(q.stat) + '</div>' +
        (q.priv ? '<span class="ug-priv">' + ico('lock') + 'видит только Гриша</span>' : '<div class="ug-stat-sub">' + esc(q.sub) + '</div>') + '</div></div>' +
      '<h2 class="ug-h2 ug-qq">' + esc(q.q) + '</h2>' +
      (q.hint ? '<p class="ug-p ug-qsub">' + esc(q.hint) + '</p>' : '') +
      (q.type === 'multi' ? '<div class="ug-hint" style="margin:0">Можно выбрать несколько</div>' : '') +
      (q.type === 'range' ? rangeHtml(q, a) : '<div class="ug-chips">' + chips + '</div>') +
      (q.other ? '<label class="ug-field ug-extra' + (a.sel.indexOf(OTHER) >= 0 ? ' is-on' : '') + '" id="ug-other"><input data-quiz="other" value="' + esc(a.other) + '" placeholder="Напиши свой вариант" maxlength="300" autocomplete="off"></label>' : '') +
      (q.link ? '<label class="ug-field ug-extra is-on"><input data-quiz="link" value="' + esc(a.link) + '" placeholder="' + esc(q.link) + '" maxlength="300" autocomplete="off"></label>' : '') +
      '<div class="ug-err" id="ug-qerr"></div>' +
      '<div class="ug-qnav">' +
        '<button class="ug-btn is-ghost" data-act="quiz-back">Назад</button>' +
        '<button class="ug-btn" data-act="quiz-next" id="ug-qnext"' + (quizValid(q, a) ? '' : ' disabled') + '>' + (last ? 'Завершить сканирование' : 'Далее') + '</button>' +
      '</div>' +
    '</div>', { acc: CLASSES[k].color });
}
function rangeHtml(q, a) {
  var pctv = (a.num - q.min) / (q.max - q.min) * 100;
  var marks = '';
  for (var v = q.min; v <= q.max; v += 100000) marks += '<span>' + (v === 0 ? '0' : (v / 1000) + 'к' + (v === q.max ? '+' : '')) + '</span>';
  return '<div class="ug-range">' +
    '<div class="ug-range-val" id="ug-rv">' + esc(money(a.num, q.max)) + '</div>' +
    '<div class="ug-range-row">' +
      '<button class="ug-rbtn" data-act="range-step" data-d="-1" aria-label="Меньше">−</button>' +
      '<input type="range" data-quiz="range" min="' + q.min + '" max="' + q.max + '" step="' + q.step + '" value="' + a.num + '" style="--p:' + pctv + '%" aria-label="Стоимость последнего проекта">' +
      '<button class="ug-rbtn" data-act="range-step" data-d="1" aria-label="Больше">+</button>' +
    '</div>' +
    '<div class="ug-range-scale mono">' + marks + '</div>' +

  '</div>';
}
function rangeSet(v) {
  var q = QUIZ[S.draft.qi], a = quizAns(q);
  a.num = Math.max(q.min, Math.min(q.max, Math.round(v / q.step) * q.step)); a.touched = true;
  var inp = root.querySelector('input[data-quiz=range]'), out = root.querySelector('#ug-rv');
  if (inp) { inp.value = a.num; inp.style.setProperty('--p', ((a.num - q.min) / (q.max - q.min) * 100) + '%'); }
  if (out) out.innerHTML = esc(money(a.num, q.max));
  quizRefresh();
}
function quizOpt(el) {
  var q = QUIZ[S.draft.qi], a = quizAns(q);
  var opts = q.options.concat(q.other ? [OTHER] : []);
  var o = opts[+el.getAttribute('data-i')];
  if (q.type === 'single') {
    a.sel = [o];
  } else {
    var idx = a.sel.indexOf(o);
    if (idx >= 0) a.sel.splice(idx, 1);
    else {
      if (q.none && o === q.none) a.sel = [];
      else if (q.none) a.sel = a.sel.filter(function (s) { return s !== q.none; });
      a.sel.push(o);
    }
  }
  root.querySelectorAll('.ug-chip').forEach(function (c, j) { c.classList.toggle('is-on', a.sel.indexOf(opts[j]) >= 0); });
  var other = root.querySelector('#ug-other');
  if (other) {
    var on = a.sel.indexOf(OTHER) >= 0;
    other.classList.toggle('is-on', on);
    if (on && o === OTHER) { var inp = other.querySelector('input'); setTimeout(function () { inp.focus(); }, 50); }
  }
  quizRefresh();
  // одиночный выбор без доп. полей: сразу дальше
  if (q.type === 'single' && q.auto) setTimeout(function () { if (S.draft.qi === QUIZ.indexOf(q)) quizNext(); }, 320);
}
function quizRefresh() {
  var q = QUIZ[S.draft.qi], b = root.querySelector('#ug-qnext');
  if (b) b.disabled = !quizValid(q, quizAns(q));
}
function quizNext() {
  var q = QUIZ[S.draft.qi];
  if (!quizValid(q, quizAns(q))) return;
  if (S.draft.qi === QUIZ_MID - 1 && !S.draft.midShown) { S.draft.midShown = true; screenQuizMid(); return; }
  if (S.draft.qi < QUIZ.length - 1) { screenQuiz(S.draft.qi + 1); return; }
  createPlayer();
}
var NUM_Q = { 1: 'один вопрос', 2: 'два вопроса', 3: 'три вопроса', 4: 'четыре вопроса', 5: 'пять вопросов' };
function screenQuizMid() {
  var k = S.draft.cls, pct = Math.round(QUIZ_MID / QUIZ.length * 100), left = QUIZ.length - QUIZ_MID;
  var slots = QUIZ.map(function (q, i) {
    return '<span class="ug-mid-slot' + (i < QUIZ_MID ? ' is-on' : '') + '" style="animation-delay:' + (0.5 + i * 0.12) + 's">' + ico(q.icon) + '</span>';
  }).join('');
  var C = 2 * Math.PI * 70;
  show(
    '<div class="ug-quiz ug-mid">' +
      '<div class="ug-mid-ring">' + burst().replace('ug-burst', 'ug-burst ug-mid-burst') +
        '<svg viewBox="0 0 160 160"><circle cx="80" cy="80" r="70" class="bg"/><circle cx="80" cy="80" r="70" class="fg" style="stroke-dasharray:' + C.toFixed(1) + ';stroke-dashoffset:' + C.toFixed(1) + ';--to:' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
        '<div class="ug-mid-pct"><span id="ug-mid-n">0</span>%</div></div>' +
      '<div class="ug-kicker">// сканирование персонажа</div>' +
      '<h2 class="ug-h2">Сканирование завершено на ' + pct + '%</h2>' +
      '<p class="ug-p">Половина пути позади. Осталось ' + NUM_Q[left] + ', и персонаж будет готов.</p>' +
      '<div class="ug-mid-slots">' + slots + '</div>' +
      '<div class="ug-qnav"><button class="ug-btn is-ghost" data-act="quiz-mid-back">Назад</button>' +
      '<button class="ug-btn" data-act="quiz-mid-go">Продолжить сканирование</button></div>' +
    '</div>', { acc: CLASSES[k].color });
  music.sfx('achieve');
  var n = root.querySelector('#ug-mid-n'), t0 = performance.now();
  (function tick(now) {
    var x = Math.min(1, (now - t0) / 1200);
    if (n) n.textContent = Math.round(pct * (1 - Math.pow(1 - x, 3)));
    if (x < 1) requestAnimationFrame(tick);
  })(t0);
}
function quizBack() {
  if (S.draft.qi > 0) screenQuiz(S.draft.qi - 1); else screenSheet();
}
function createPlayer() {
  var sheet = {};
  QUIZ.forEach(function (q) { sheet[q.key] = quizValue(q, quizAns(q)); });
  var btn = root.querySelector('#ug-qnext'), err = root.querySelector('#ug-qerr');
  btn.classList.add('is-loading'); btn.textContent = 'Сборка персонажа';
  var reset = function (msg) { btn.classList.remove('is-loading'); btn.textContent = 'Завершить сканирование'; err.textContent = msg; };
  apiPost({ action: 'create', nick: S.draft.nick, gender: GENDERS[S.draft.g], 'class': CLASSES[S.draft.cls].name, sheet: sheet })
    .then(function (res) {
      if (res && res.ok) {
        S.player = res.player; if (res.settings) S.settings = res.settings;
        remember(res.player.nick);
        store.set('ug_seen_' + S.nick, JSON.stringify([]));
        music.sfx('confirm');
        screenCreated();
        return;
      }
      if (res && res.error === 'not_allowed') { reset(NOT_ALLOWED(S.draft.nick)); return; }
      reset(res && res.error === 'nick_taken'
        ? 'Персонаж с ником @' + S.draft.nick + ' уже существует. Нажми «Сменить игрока» или войди под этим ником.'
        : 'Не получилось создать персонажа. Попробуй ещё раз.');
    })
    .catch(function () { reset('Нет связи. Проверь интернет и попробуй ещё раз.'); });
}

/* ---------- персонаж создан ---------- */
function screenCreated() {
  var k = clsKey(), g = genKey(), col = CLASSES[k].color;
  // пиксельное конфетти в цветах всех классов, с перевесом цвета своего класса
  var cols = [col, col, col, '#38e2ff', '#c45cff', '#ffbf3d', '#ffffff'], conf = '';
  for (var i = 0; i < 46; i++) {
    var x = Math.round(Math.random() * 100), d = (2.6 + Math.random() * 2.2).toFixed(2), del = (0.9 + Math.random() * 1.6).toFixed(2);
    var sz = 4 + Math.round(Math.random() * 5), dx = Math.round(Math.random() * 120 - 60), rot = Math.round(Math.random() * 720 - 360);
    conf += '<i style="left:' + x + '%;width:' + sz + 'px;height:' + sz + 'px;background:' + cols[i % cols.length] +
      ';animation-duration:' + d + 's;animation-delay:' + del + 's;--dx:' + dx + 'px;--rot:' + rot + 'deg"></i>';
  }
  show(
    '<div class="ug-confetti" aria-hidden="true">' + conf + '</div>' +
    '<div class="ug-created">' +
      '<div class="ug-reveal">' + avatar(g, k, PROLOGUE_LVL) + '<div class="ug-frame"></div>' +
        burst().replace('ug-burst', 'ug-burst ug-created-burst') + '</div>' +
      '<div class="ug-created-text">' +
        '<div class="ug-kicker ug-pop" style="animation-delay:.9s">// новый персонаж</div>' +
        '<h2 class="ug-created-title ug-glitch" data-text="Персонаж создан">Персонаж создан</h2>' +
        '<div class="ug-created-nick ug-pop" style="animation-delay:1.25s">@' + esc(S.nick) + '</div>' +
        '<div class="ug-classbadge ug-pop" style="animation-delay:1.4s">' + CLASSES[k].name + ' · уровень ' + PROLOGUE_LVL + '</div>' +
        '<p class="ug-p ug-pop" style="margin-top:20px;animation-delay:1.6s">Твой путь на Кайросе начинается. В профиле тебя уже ждут первые квесты.</p>' +
        '<div class="ug-pop" style="margin-top:28px;animation-delay:1.7s"><button class="ug-btn ug-cta-glow" data-act="open-profile">Открыть профиль</button></div>' +
      '</div>' +
    '</div>', { acc: col });
  setTimeout(function () { music.sfx('achieve'); }, 1100);
}

/* ---------- дашборд ---------- */
var STATE_LABEL = { locked: 'Закрыт', active: 'Доступен', review: 'На проверке', rework: 'Доработать', done: 'Выполнен' };
var STATE_ICON = { locked: 'lock', active: 'diamond', review: 'hourglass', rework: 'alert', done: 'check' };

function segsHtml(l) {
  var h = '';
  for (var i = 1; i <= MAX_LVL / 10; i++) {
    var fill = Math.max(0, Math.min(1, (l - (i - 1) * 10) / 10));
    h += '<i class="' + (fill >= 1 ? 'on' : '') + '"><b style="width:' + (fill * 100) + '%"></b></i>';
  }
  return h;
}
function screenDash() {
  S.screen = 'dash';
  music.showBtn();
  var k = clsKey(), g = genKey(), c = CLASSES[k] || CLASSES.packer, lvl = level();
  // с какого уровня анимировать: после создания персонажа с нуля, после засчитанного квеста с прошлого значения
  var seenBefore = seenIds();
  // уроки открываются после первых квестов; панель всегда наверху, в момент открытия она подсвечивается
  var lessonsReveal = lessonsUnlocked() && seenBefore.indexOf('ach:lessons-open') < 0;
  // ачивки, которые игрок ещё не видел: их слоты пустые, пока значок не прилетит
  var achFresh = myAchievements().filter(function (a) { return seenBefore.indexOf('ach:' + a.id) < 0; }).map(function (a) { return a.id; });
  var fromLvl = S.justCreated ? 0 : Math.min(lvl, levelOf(seenBefore));
  if (S.autoAnim) { var aid = S.autoAnim; S.autoAnim = null; fromLvl = Math.min(fromLvl, levelOf(seenBefore.filter(function (id) { return id !== aid; }))); }
  var segs = '', caps = '';
  segs = segsHtml(fromLvl);
  for (var i = 1; i <= MAX_LVL / 10; i++) caps += '<span>' + i * 10 + '</span>';

  // текущий квест: первый не выполненный, который можно сдать или который ждёт проверки
  // текущий квест: первый, который можно сдавать; если таких нет, первый на проверке
  var current = null;
  QUESTS.forEach(function (q) { var st = questState(q.id); if (!current && (st === 'active' || st === 'rework')) current = q; });
  QUESTS.forEach(function (q) { if (!current && questState(q.id) === 'review') current = q; });
  var activeHtml;
  if (current) {
    var qv = questView(current), st = questState(current.id), stateBox = '', actions = '';
    if (st === 'active' && current.auto) {
      actions = current.id === 'guide' ? '<button class="ug-btn" data-act="guide">Узнать, как растёт персонаж</button>' : '<button class="ug-btn" data-act="origin">Открыть историю</button>';
    } else if (st === 'active') {
      actions = '<button class="ug-btn" data-act="quest" data-q="' + qv.id + '">Сдать квест</button>' +
        (qv.id === 'q0' ? '<a class="ug-btn is-ghost" href="' + esc(CONFIG.CHAT_URL) + '" target="_blank" rel="noopener">' + ico('chat') + 'Открыть чат</a>' : '');
    } else if (st === 'review') {
      stateBox = '<div class="ug-q-state is-review">' + ico('hourglass') + '<span>Квест на проверке. Гриша посмотрит и засчитает, иконка в журнале сменится на пройденную.</span></div>';
      actions = '<button class="ug-btn is-ghost is-small" data-act="quest" data-q="' + qv.id + '">Отправить заново</button>';
    } else if (st === 'rework') {
      stateBox = '<div class="ug-q-state is-rework">' + ico('alert') + '<span>Гриша вернул квест на доработку. Посмотри комментарий в чате и сдай ещё раз.</span></div>';
      actions = '<button class="ug-btn" data-act="quest" data-q="' + qv.id + '">Сдать ещё раз</button>';
    }
    activeHtml = '<section class="ug-panel ug-active' + (st === 'active' || st === 'rework' ? ' is-pulse' : '') + '">' +
      '<div class="ug-panel-h"><div class="ug-panel-t"><b>●</b> Текущий квест</div>' +
      (S.settings[qv.id] && S.settings[qv.id].deadline ? '<div class="ug-panel-t">Дедлайн: ' + esc(S.settings[qv.id].deadline) + '</div>' : '') + '</div>' +
      '<div class="ug-q-tag">' + esc(qv.tag) + (lvlGain(qv.id) ? ' · +' + lvlGain(qv.id) + ' к уровню' : '') + '</div>' +
      '<div class="ug-q-title">' + esc(qv.title) + '</div>' +
      (st === 'review' ? '' : '<div class="ug-q-task">' + esc(qv.task) + '</div>') + stateBox +
      '<div class="ug-q-actions">' + actions + '</div></section>';
  } else {
    activeHtml = '<section class="ug-panel"><div class="ug-panel-h"><div class="ug-panel-t">Текущий квест</div></div>' +
      '<div class="ug-q-state is-done">' + ico('check') + '<span>Все открытые квесты выполнены. Следующий откроется с началом новой недели.</span></div></section>';
  }

  var rows = '<div class="ug-qrow is-done" data-act="quest-info" data-q="prologue"><div class="ug-qico">' + ico('check') + '</div>' +
    '<div><div class="ug-qrow-tag">Пролог · +' + PROLOGUE_LVL + '</div><div class="ug-qrow-title">Создание персонажа</div></div><div class="ug-qrow-st">Выполнен</div></div>' +
    QUESTS.map(function (q) {
    var qv = questView(q), st = questState(q.id);
    return '<div class="ug-qrow is-' + st + (q.boss ? ' is-boss' : '') + '" data-act="quest-info" data-q="' + q.id + '">' +
      '<div class="ug-qico">' + ico(q.boss && st === 'locked' ? 'skull' : STATE_ICON[st]) + '</div>' +
      '<div><div class="ug-qrow-tag">' + esc(qv.tag) + (lvlGain(qv.id) ? ' · +' + lvlGain(qv.id) : '') + '</div><div class="ug-qrow-title">' + esc(qv.title) + '</div></div>' +
      '<div class="ug-qrow-st">' + STATE_LABEL[st] + '</div></div>';
  }).join('');

  // пока без названий: по одному закрытому слоту на неделю, названия скиллов появятся позже
  var items = SKILL_SLOTS.map(skillItem).join('');

  var sheet = (S.player && S.player.sheet) || {};
  var stats = QUIZ.map(function (q) {
    var v = sheet[q.key] || '', body;
    if (q.priv) body = '<div class="ug-statcard-hidden">' + ico('lock') + 'скрыто · видит только Гриша</div>';
    else if (!v) body = '<div class="ug-statcard-hidden">пусто</div>';
    else {
      var parts = v.split(' · '), tags = parts[0].split(', ').filter(Boolean);
      body = '<div class="ug-tags">' + tags.map(function (t) { return '<span class="ug-tag">' + esc(t) + '</span>'; }).join('') +
        (parts[1] ? '<a class="ug-tag is-link" href="' + esc(/^https?:/.test(parts[1]) ? parts[1] : 'https://' + parts[1]) + '" target="_blank" rel="noopener">' + esc(parts[1].replace(/^https?:\/\//, '')) + '</a>' : '') + '</div>';
    }
    return '<div class="ug-statcard"><div class="ug-statcard-h"><span class="ug-statcard-ico">' + ico(q.icon) + '</span>' +
      '<div><div class="ug-stat-name mono">' + esc(q.stat) + '</div><div class="ug-stat-sub">' + esc(q.sub || '') + '</div></div></div>' + body + '</div>';
  }).join('');

  show(
    '<div class="ug-wrap">' +
      '<header class="ug-topbar"><div class="ug-logo"><span class="ug-logo-word">АПГРЕЙД</span><span class="ug-logo-sub mono">профиль игрока</span></div>' +
      '<button class="ug-link" data-act="logout">' + ico('swap') + 'Сменить игрока</button></header>' +
      '<div class="ug-dash">' +
        '<aside class="ug-hero">' +
          '<div class="ug-hero-img" data-act="poke" title="Нажми на персонажа">' + avatar(g, k, lvl) + '<div class="ug-frame"></div><div class="ug-bubble" id="ug-bubble"></div>' +
            // уровень лежит поверх нижней части портрета, чтобы доска достижений помещалась в экран
            '<div class="ug-level is-over" id="ug-level"><div class="ug-level-row"><div class="ug-level-num"><span id="ug-lvl-n">' + fromLvl + '</span><small>/ ' + MAX_LVL + '</small></div><div class="ug-level-lbl">УРОВЕНЬ</div></div>' +
            '<div class="ug-segs" id="ug-segs">' + segs + '</div><div class="ug-segs-cap mono">' + caps + '</div></div></div>' +
          '<div class="ug-hero-tag"><div class="ug-hero-nick">@' + esc(S.nick) + '</div><div class="ug-classbadge">' + c.name + '</div></div>' +
          '<div class="ug-loot">' + petCard() + weaponCard() + '</div>' +
          boardHtml(achFresh) +
          '<button class="ug-btn is-ghost is-wide ug-origin-btn' + (questState('story') === 'done' ? '' : ' is-hint') + '" data-act="origin">' + ico('book') + 'История персонажа</button>' +
        '</aside>' +
        '<div class="ug-col">' +
          lessonsPanel() + '<div id="ug-activebox">' + activeHtml + '</div>' +
          '<section class="ug-panel"><div class="ug-panel-h"><div class="ug-panel-t">Журнал квестов</div><div class="ug-panel-t">' +
            (QUESTS.filter(function (q) { return questState(q.id) === 'done'; }).length + 1) + ' / ' + (QUESTS.length + 1) + '</div></div>' +
            '<div class="ug-log-list">' + rows + '</div></section>' +
          '<section class="ug-panel" id="ug-inv-panel"><div class="ug-panel-h"><div class="ug-panel-t">Инвентарь · ИИ-скиллы</div></div><div class="ug-inv">' + items + '</div></section>' +
          '<section class="ug-panel"><div class="ug-panel-h"><div class="ug-panel-t">Характеристики · скан «до»</div></div>' +
            '<div class="ug-stats">' + stats + '</div>' +
            '<div class="ug-after">' + ico('lock') + '<span>Скан «после» откроется перед демо-днём. Тогда и сравним, насколько прокачался персонаж.</span></div></section>' +

        '</div>' +
      '</div>' +
    '</div>', { dash: true, acc: c.color });

  hydrateThumbs();
  if (lessonsReveal) waitCalm(revealLessons);
  var effects = function () {
    var modalOpened = celebrateNew(seenBefore);
    var created = S.justCreated;
    if (created) { S.justCreated = false; setTimeout(function () { achievement('Создание персонажа · уровень ' + PROLOGUE_LVL); }, 700); }
    var levelUp = fromLvl < lvl;
    var run = function () { if (levelUp) animateLevel(fromLvl, lvl); };
    // после поздравлений с квестами и роста уровня вручаем новые ачивки по одной
    var awards = function () { if (achFresh.length) setTimeout(function () { awardNext(achFresh.slice()); }, levelUp ? 1600 : 500); };
    if (modalOpened) S.afterClose = function () { run(); awards(); };
    else setTimeout(function () { run(); awards(); }, levelUp ? (created ? 1500 : 500) : (created ? 2600 : 300));
  };
  // у игрока ещё нет ПИН-кода: сначала просим его придумать, праздник потом
  if (S.player && S.player.pinSet === false) pinSetupModal(effects); else effects();
}

function petCard() {
  var pet = S.player && S.player.pet;
  if (pet) {
    return '<div class="ug-petcard is-open"><div class="ug-pet-egg">' + ico('paw') + '</div>' +
      '<div><div class="ug-pet-k mono">Питомец</div><div class="ug-pet-t">' + esc(pet) + '</div></div></div>';
  }
  return '<div class="ug-petcard" data-act="egg"><div class="ug-pet-egg">' +
      '<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M24 3C13 3 6 21 6 33c0 12 8 20 18 20s18-8 18-20C42 21 35 3 24 3z" fill="rgba(255,255,255,.05)" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M8 33l6 3 5-4 5 4 5-4 5 4 6-3" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".55"/>' +
      '<text x="24" y="26" text-anchor="middle" font-family="Russo One,Unbounded,sans-serif" font-size="17" fill="currentColor">?</text></svg>' +
    '</div>' +
    '<div><div class="ug-pet-t">Питомец</div><div class="ug-pet-d">' + ico('lock') + 'на 20 уровне</div></div></div>';
}

/* секретное оружие: открывается на уровне WEAPON_LVL (после третьей недели) */
var WEAPON_LVL = 30;
function weaponCard() {
  var w = S.player && S.player.weapon;
  if (w) {
    return '<div class="ug-petcard ug-weapon is-open" data-act="weapon"><div class="ug-pet-egg">' + ico('bolt') + '</div>' +
      '<div><div class="ug-pet-k mono">Автоматон</div><div class="ug-pet-t">' + esc(w) + '</div></div></div>';
  }
  return '<div class="ug-petcard ug-weapon" data-act="weapon"><div class="ug-pet-egg">' +
      '<svg viewBox="0 0 48 56" aria-hidden="true" class="ug-core">' +
      '<g class="ug-core-orbit"><ellipse cx="24" cy="28" rx="22" ry="7" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/>' +
      '<circle cx="46" cy="28" r="1.8" fill="currentColor"/></g>' +
      '<path d="M24 5l17 10v26L24 51 7 41V15z" fill="rgba(255,255,255,.05)" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M24 13l10 6v14l-10 6-10-6V19z" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>' +
      '<path d="M7 15l6 3.5M41 15l-6 3.5M24 51v-7" stroke="currentColor" stroke-width="1.2" opacity=".5"/>' +
      '<text x="24" y="33.5" text-anchor="middle" font-family="Russo One,Unbounded,sans-serif" font-size="15" fill="currentColor">?</text></svg>' +
    '</div>' +
    '<div><div class="ug-pet-t">Автоматон</div><div class="ug-pet-d">' + ico('lock') + 'на ' + WEAPON_LVL + ' уровне</div></div></div>';
}
var WEAPON_LINES = [
  'В мастерской Гавани тебя ждёт списанный автоматон. Пока он спит.',
  'Мастера говорят, что приручить автоматона можно на ' + WEAPON_LVL + ' уровне.',
  'Приручённый автоматон работает за целую мастерскую.',
  'Его щель-глаз пока горит красным. После приручения станет бирюзовой.'
];
var weaponN = 0;

/* интерактив дашборда */
var lastLine = -1, bubbleTimer;
function poke() {
  var lines = heroLines(), i;
  do { i = Math.floor(Math.random() * lines.length); } while (i === lastLine && lines.length > 1);
  lastLine = i;
  var b = root.querySelector('#ug-bubble'), img = root.querySelector('.ug-hero-img');
  if (!b) return;
  b.textContent = lines[i]; b.classList.remove('is-on'); void b.offsetWidth; b.classList.add('is-on');
  img.classList.remove('is-poked'); void img.offsetWidth; img.classList.add('is-poked');
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(function () { b.classList.remove('is-on'); }, 3200);
}
var eggN = 0;
function eggPoke(el) {
  var egg = el.querySelector('.ug-pet-egg');
  if (egg) { egg.classList.remove('is-shake'); void egg.offsetWidth; egg.classList.add('is-shake'); }
  toast(EGG_LINES[eggN++ % EGG_LINES.length]);
}
function originModal() {
  var img = CONFIG.ORIGIN_IMAGE || CONFIG.CITY_IMAGE;
  modal((img ? '<div class="ug-origin-img"><img src="' + esc(img) + '" alt=""></div>' : '') +
    '<div class="ug-kicker">// история персонажа</div>' +
    '<h2 class="ug-h2">Откуда ты родом</h2>' +
    '<div class="ug-origin-text">' + originText().map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
      '<p class="ug-origin-more">Подробнее о том, что тебя сюда привело, ты можешь прочитать в чате «Апгрейда» в разделе «Лор».</p></div>' +
    '<div class="ug-dialog-actions"><button class="ug-btn" data-act="close">Понятно</button></div>', null, 'ug-origin');
  if (questState('story') !== 'done') S.afterClose = function () { completeAuto('story'); };
}
function questInfo(id) {
  if (id === 'prologue') {
    modal('<div class="ug-kicker">// пролог</div><h2 class="ug-h2">Создание персонажа</h2>' +
      '<p class="ug-p">Ты ' + gw('выбрал', 'выбрала') + ' класс и ' + gw('прошёл', 'прошла') + ' сканирование. Персонаж собран и готов к первому квесту.</p>' +
      '<div class="ug-q-state is-done" style="margin-top:18px">' + ico('check') + '<span>Выполнен</span></div>');
    return;
  }
  var q = QUESTS.filter(function (x) { return x.id === id; })[0]; if (!q) return;
  var v = questView(q), st = questState(id);
  var stTxt = { locked: 'Квест откроется с началом своей недели.', active: q.auto ? 'Квест доступен и засчитается сам.' : 'Квест доступен, его можно сдавать.', review: 'Квест на проверке у Гриши.', rework: 'Гриша вернул квест на доработку.', done: 'Квест засчитан.' }[st];
  var dl = S.settings[id] && S.settings[id].deadline;
  modal('<div class="ug-kicker">// ' + esc(v.tag) + (lvlGain(id) ? ' · +' + lvlGain(id) + ' к уровню' : '') + '</div>' +
    '<h2 class="ug-h2">' + esc(v.title) + '</h2>' +
    '<p class="ug-p">' + esc(v.task) + '</p>' +
    '<div class="ug-q-state is-' + st + '" style="margin-top:18px">' + ico(STATE_ICON[st]) + '<span>' + esc(stTxt) + (dl ? ' Дедлайн: ' + esc(dl) + '.' : '') + '</span></div>' +
    (st === 'active' && q.auto ? '<div class="ug-dialog-actions"><button class="ug-btn" data-act="' + (id === 'guide' ? 'guide' : 'origin') + '">' + (id === 'guide' ? 'Открыть правила' : 'Открыть историю') + '</button></div>' :
     st === 'active' || st === 'rework' ? '<div class="ug-dialog-actions"><button class="ug-btn" data-act="quest" data-q="' + id + '">Сдать квест</button></div>' : ''));
}
var SKILL_SLOTS = ['q1', 'q2', 'q3', 'q4'];
// скиллы недель; пока у недели нет описания, в инвентаре она показана как «новый скилл»
var SKILLS = {
  q1: { name: 'Аналитика Никольского v.2', desc: 'По брифу клиента собирает в Notion три документа: анализ ЦА, анализ конкурентов и УТП.' }
};
// «новый» скилл: неделя открыта, а игрок его ещё не открывал (отметка skill-… хранится вместе с ачивками)
// скилл первой недели открывается вместе с уроками
function skillOpen(w) { return w === 'q1' ? lessonsUnlocked() : weekOpen(w); }
function skillFresh(w) { return !!SKILLS[w] && skillOpen(w) && seenIds().indexOf('ach:skill-' + w) < 0; }
function skillItem(w, si) {
  var open = skillOpen(w), sk = SKILLS[w], fresh = skillFresh(w);
  var tag = QUESTS.filter(function (q) { return q.id === w; })[0].tag;
  var name = !open ? 'Скрытый скилл' : fresh ? 'Новый скилл' : sk ? sk.name : 'Новый скилл';
  var meta = !open ? esc(tag.toLowerCase()) : fresh ? 'нажми, чтобы забрать' : '';
  return '<div class="ug-item ' + (open ? 'is-open' : 'is-locked') + (fresh ? ' is-new' : '') + (open && sk && !fresh ? ' is-mine' : '') + '" data-act="skill-info" data-i="' + si + '">' +
    (fresh ? '<span class="ug-item-new">новый</span>' : '') +
    '<div class="ug-item-ico">' + ico(open ? 'chip' : 'lock') + '</div>' +
    '<div><div class="ug-item-name">' + esc(name) + '</div>' + (meta ? '<div class="ug-item-meta">' + meta + '</div>' : '') + '</div></div>';
}
function skillInfo(i) {
  var w = SKILL_SLOTS[i]; if (!w) return;
  var open = skillOpen(w);
  var tag = QUESTS.filter(function (q) { return q.id === w; })[0].tag;
  var sk = SKILLS[w];
  if (open && sk) {
    var fresh = skillFresh(w);
    if (fresh) markSeen(seenIds().concat(['ach:skill-' + w]));
    modal((fresh ? burst() : '<div class="ug-skill-ico">' + ico('chip') + '</div>') +
      '<div class="ug-kicker">// ' + (fresh ? 'новый ИИ-скилл' : 'ИИ-скилл') + ' · ' + esc(tag.toLowerCase()) + '</div>' +
      '<h2 class="ug-h2">' + esc(sk.name) + '</h2>' +
      '<p class="ug-p">' + esc(sk.desc) + '</p>' +
      '<div class="ug-q-state is-done" style="margin-top:18px">' + ico('chat') + '<span>Скилл ждёт тебя в чате «Апгрейда». Как его установить, рассказываю в уроке.</span></div>' +
      '<div class="ug-dialog-actions"><a class="ug-btn" href="' + esc(CONFIG.SKILLS_URL || CONFIG.CHAT_URL) + '" target="_blank" rel="noopener">Забрать в чате</a></div>',
      null, fresh ? 'ug-congrats' : '');
    if (fresh) { music.sfx('achieve'); var it = root.querySelectorAll('.ug-inv .ug-item')[i]; if (it) it.outerHTML = skillItem(w, i); }
    return;
  }
  modal('<div class="ug-kicker">// ИИ-скилл · ' + esc(tag.toLowerCase()) + '</div>' +
    '<h2 class="ug-h2">' + (open ? 'Новый скилл' : 'Скрытый скилл') + '</h2>' +
    '<p class="ug-p">Скилл — это набор файлов, которые подгружаешь в ИИ, и она обретает новый навык. Каждую неделю в инвентаре появляется новый.</p>' +
    '<div class="ug-q-state ' + (open ? 'is-done' : '') + '" style="margin-top:18px">' + ico(open ? 'chip' : 'lock') + '<span>' +
      (open ? 'Скилл открыт. Файлы лежат в канале потока.' : w === 'q1' ? 'Откроется вместе с уроками, после прохождения первых 4 квестов.' : 'Откроется: ' + esc(tag.toLowerCase()) + '.') + '</span></div>');
}

/* короткие квесты пролога засчитываются сами */
function guideModal() {
  modal((CONFIG.GUIDE_IMAGE ? '<div class="ug-origin-img ug-guide-img"><img src="' + esc(CONFIG.GUIDE_IMAGE) + '" alt=""></div>' : '') +
    '<div class="ug-kicker">// правила игры</div>' +
    '<h2 class="ug-h2">Как работает прокачка</h2>' +
    '<div class="ug-guide">' +
      '<div class="ug-guide-row"><span class="ug-guide-ico">' + ico('diamond') + '</span><p>' + esc(GUIDE_TEXT[0]) + '</p></div>' +
      '<div class="ug-guide-row"><span class="ug-guide-ico">' + ico('chip') + '</span><p>' + esc(GUIDE_TEXT[1]) + '</p></div>' +
      '<div class="ug-guide-row"><span class="ug-guide-ico">' + ico('paw') + '</span><p>' + esc(GUIDE_TEXT[2]) + '</p></div>' +
    '</div>' +
    '<div class="ug-dialog-actions"><button class="ug-btn" data-act="close">Понятно</button></div>', null, CONFIG.GUIDE_IMAGE ? 'ug-origin' : '');
  if (questState('guide') !== 'done') S.afterClose = function () { completeAuto('guide'); };
}
function completeAuto(id) {
  if (questState(id) === 'done') return;
  var q = QUESTS.filter(function (x) { return x.id === id; })[0];
  // показываем результат сразу, а сервер догоняет в фоне
  S.player.quests = S.player.quests || {}; S.player.quests[id] = 'выполнен';
  var seen = seenIds();
  if (seen.indexOf(id) < 0) seen.push(id);
  store.set('ug_seen_' + S.nick, JSON.stringify(seen));
  S.player.seen = seen.slice();
  S.autoAnim = id;
  screenDash();
  setTimeout(function () { achievement(q.title + ' · уровень ' + q.lvl); }, 150);
  // три квеста пролога подряд: комбо
  if (AUTO_IDS.every(function (x) { return questState(x) === 'done'; })) setTimeout(combo, 2300);
  apiPost({ action: 'auto', quest: id, nick: S.nick }).then(function () { markSeen(seenIds()); }).catch(function () {});
}
function combo() {
  var old = root.querySelector('.ug-combo'); if (old) old.remove();
  var c = document.createElement('div');
  c.className = 'ug-combo';
  c.innerHTML = '<div class="ug-combo-x">×3</div><div class="ug-combo-t">Комбо!</div><div class="ug-combo-d">Три квеста подряд. Так держать!</div>';
  root.appendChild(c);
  music.sfx('combo');
  setTimeout(function () { c.classList.add('is-out'); setTimeout(function () { c.remove(); }, 600); }, 2600);
}

/* всплывающая ачивка, как в играх */
function achievement(title, kicker) {
  var old = root.querySelector('.ug-ach'); if (old) old.remove();
  var a = document.createElement('div');
  a.className = 'ug-ach';
  a.innerHTML = '<div class="ug-ach-ico">' + ico('check') + '</div><div><div class="ug-ach-k mono">' + esc(kicker || 'Квест выполнен') + '</div><div class="ug-ach-t">' + esc(title) + '</div></div>';
  root.appendChild(a);
  music.sfx('achieve');
  requestAnimationFrame(function () { a.classList.add('is-on'); });
  setTimeout(function () { a.classList.remove('is-on'); setTimeout(function () { a.remove(); }, 500); }, 4600);
}

/* засчитанные квесты с прошлого визита */
/* какие засчитанные квесты игрок уже видел: отметка хранится и в браузере, и в таблице,
   чтобы праздник показался один раз на любом устройстве, где профиль откроют первым */
function seenIds() {
  var local = []; try { local = JSON.parse(store.get('ug_seen_' + S.nick)) || []; } catch (e) {}
  var server = (S.player && S.player.seen) || [];
  return local.concat(server.filter(function (id) { return local.indexOf(id) < 0; }));
}
function markSeen(ids) {
  // отметки об ачивках (ach:…) живут в том же списке, их не теряем
  var keep = seenIds().filter(function (id) { return id.indexOf('ach:') === 0 && ids.indexOf(id) < 0; });
  ids = ids.concat(keep);
  store.set('ug_seen_' + S.nick, JSON.stringify(ids));
  if (S.player) S.player.seen = ids.slice();
  apiPost({ action: 'seen', nick: S.nick, seen: ids }).catch(function () {});
}
function levelOf(ids) {
  var l = PROLOGUE_LVL;
  QUESTS.forEach(function (q) { if (ids.indexOf(q.id) >= 0 && questState(q.id) === 'done' && (q.lvl || 0) > l) l = q.lvl; });
  return l;
}
function celebrateNew(seen) {
  var done = QUESTS.filter(function (q) { return questState(q.id) === 'done'; }).map(function (q) { return q.id; });
  var fresh = done.filter(function (id) { return seen.indexOf(id) < 0; });
  if (fresh.length) markSeen(done);
  fresh = fresh.filter(function (id) { return AUTO_IDS.indexOf(id) < 0; });
  if (!fresh.length) return false;
  var q = questView(QUESTS.filter(function (x) { return x.id === fresh[fresh.length - 1]; })[0]);
  modal(burst() +
    '<div class="ug-kicker">// квест засчитан</div>' +
    '<div class="ug-levelup">' + (q.lvl ? 'LEVEL ' + level() : 'БОСС ПОВЕРЖЕН') + '</div>' +
    '<h2 class="ug-h2">«' + esc(q.title) + '»</h2>' +
    '<p class="ug-p">' + (q.lvl ? 'Гриша утвердил квест, и твой персонаж достиг уровня ' + level() + '.' : 'Гриша утвердил финальный квест. Игра пройдена.') + '</p>' +
    '<div class="ug-dialog-actions"><button class="ug-btn" data-act="close">Отлично</button></div>', null, 'ug-congrats');
  return true;
}

/* ---------- ачивки ---------- */
// key: как Гриша пишет ачивку в колонке «ачивки» таблицы
var ACHIEVEMENTS = [
  { id: 'pioneer', key: 'первопроходец', title: 'Первопроходец', desc: 'За выполнение всех доступных квестов в первый день запуска «Апгрейда».' }
];
var BOARD_MIN = 4; // сколько ячеек на доске минимум, пустые закрыты замком
function myAchievements() {
  var got = ((S.player && S.player.achievements) || []).map(function (x) { return String(x).trim().toLowerCase(); });
  return ACHIEVEMENTS.filter(function (a) { return got.indexOf(a.id) >= 0 || got.indexOf(a.key) >= 0; });
}
function achById(id) { return ACHIEVEMENTS.filter(function (a) { return a.id === id; })[0]; }
// пиксельный восьмиугольник: углы срезаны ступеньками
var OCT = (function () {
  var c = 27, k = 6, tl = [];
  for (var i = 0; i < k; i++) {
    var x0 = c * i / k, x1 = c * (i + 1) / k, y0 = c - c * i / k, y1 = c - c * (i + 1) / k;
    tl.push([x0, y0], [x0, y1]);
    if (i === k - 1) tl.push([x1, y1]);
  }
  var pts = tl.concat(tl.slice().reverse().map(function (p) { return [100 - p[0], p[1]]; }),
    tl.map(function (p) { return [100 - p[0], 100 - p[1]]; }), tl.slice().reverse().map(function (p) { return [p[0], 100 - p[1]]; }));
  return 'polygon(' + pts.map(function (p) { return p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%'; }).join(',') + ')';
})();
root.style.setProperty('--oct', OCT);
function badgeHtml(a, extra) {
  var img = (CONFIG.ACH_IMAGES || {})[a.id];
  return '<div class="ug-badge ' + (extra || '') + '"><div class="ug-badge-o"><div class="ug-badge-f"><div class="ug-badge-l">' +
    (img ? '<img src="' + esc(img) + '" alt="" draggable="false">' : '<div class="ug-badge-ph">' + ico('star') + '</div>') +
    '</div></div></div></div>';
}
function lockedBadge() {
  return '<div class="ug-badge is-locked"><div class="ug-badge-o"><div class="ug-badge-f"><div class="ug-badge-l"><div class="ug-badge-ph">' + ico('lock') + '<b>?</b></div></div></div></div></div>';
}
function boardHtml(fresh) {
  var mine = myAchievements(), cells = '';
  mine.forEach(function (a) {
    var pending = fresh.indexOf(a.id) >= 0;
    cells += '<div class="ug-bslot' + (pending ? ' is-pending' : '') + '" data-ach="' + a.id + '" data-act="ach-info">' + (pending ? '' : badgeHtml(a)) + '</div>';
  });
  for (var i = mine.length; i < BOARD_MIN; i++) cells += '<div class="ug-bslot is-empty" data-act="ach-locked">' + lockedBadge() + '</div>';
  return '<section class="ug-board" id="ug-board"><div class="ug-board-h"><span>Достижения</span><span class="mono">' + mine.length + '</span></div>' +
    '<div class="ug-board-grid">' + cells + '</div></section>';
}
function achInfo(id) {
  var a = achById(id); if (!a) return;
  modal('<div class="ug-award-stage">' + badgeHtml(a, 'is-big') + '</div>' +
    '<div class="ug-kicker">// достижение</div><h2 class="ug-h2">' + esc(a.title) + '</h2><p class="ug-p">' + esc(a.desc) + '</p>', '#ffd23f', 'ug-congrats ug-award');
}
// вручение: значок крупно, потом он улетает на доску и прибивается со звоном
function awardNext(queue) {
  var id = queue.shift(), a = achById(id);
  if (!a) { if (queue.length) awardNext(queue); return; }
  markSeen(seenIds().concat(['ach:' + id]));
  S.awardQueue = queue;
  modal('<div class="ug-award-stage"><div class="ug-award-rays"></div>' + badgeHtml(a, 'is-big is-new') + sparksHtml(14) + '</div>' +
    '<div class="ug-kicker">// новое достижение</div>' +
    '<h2 class="ug-h2">' + esc(a.title) + '</h2>' +
    '<p class="ug-p">' + esc(a.desc) + '</p>' +
    '<div class="ug-dialog-actions"><button class="ug-btn" data-act="ach-claim" data-ach="' + id + '">Прибить на доску</button></div>', '#ffd23f', 'ug-congrats ug-award');
  music.sfx('achieve');
  // закрыли крестиком или кликом мимо: значок встаёт на место без полёта
  S.afterClose = function () { nailBadge(id, null); };
}
function sparksHtml(n, base) {
  var h = '';
  for (var i = 0; i < n; i++) {
    var ang = (i / n) * Math.PI * 2, r = (base || 110) + (i % 3) * (base ? base * 0.3 : 30);
    h += '<i class="ug-award-spark" style="--x:' + Math.round(Math.cos(ang) * r) + 'px;--y:' + Math.round(Math.sin(ang) * r) + 'px;animation-delay:' + (0.15 + (i % 4) * 0.05) + 's"></i>';
  }
  return h;
}
function claimAward(id) {
  var big = root.querySelector('.ug-modal .ug-badge.is-big');
  var from = big ? big.getBoundingClientRect() : null;
  S.afterClose = null;
  closeModal();
  nailBadge(id, from);
}
function nailBadge(id, from) {
  var a = achById(id), slot = root.querySelector('.ug-bslot[data-ach="' + id + '"]');
  var next = function () { var q = S.awardQueue || []; S.awardQueue = null; if (q.length) setTimeout(function () { awardNext(q); }, 700); };
  if (!a || !slot) { next(); return; }
  var land = function () {
    slot.classList.remove('is-pending');
    slot.innerHTML = badgeHtml(a);
    slot.classList.remove('is-slam'); void slot.offsetWidth; slot.classList.add('is-slam');
    var board = root.querySelector('#ug-board');
    if (board) { board.classList.remove('is-hit'); void board.offsetWidth; board.classList.add('is-hit'); }
    var sp = document.createElement('div'); sp.className = 'ug-bslot-sparks'; sp.innerHTML = sparksHtml(10, 46); slot.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 1100);
    music.sfx('anvil');
    next();
  };
  // доска должна быть видна, иначе полёт уйдёт за экран
  var r0 = slot.getBoundingClientRect(), vh = window.innerHeight || 800;
  var needScroll = r0.top < 60 || r0.bottom > vh - 40;
  if (needScroll) slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(function () {
    if (!from || !slot.animate) { land(); return; }
    var to = slot.getBoundingClientRect();
    var fly = document.createElement('div');
    fly.className = 'ug-fly';
    fly.style.cssText = 'left:' + from.left + 'px;top:' + from.top + 'px;width:' + from.width + 'px;height:' + from.height + 'px';
    fly.innerHTML = badgeHtml(a, 'is-big');
    root.appendChild(fly);
    var dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
    var sc = to.width / from.width;
    music.sfx('tick');
    var anim = fly.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 0 },
      { transform: 'translate(0,-26px) scale(1.06) rotate(-6deg)', offset: 0.16 },
      { transform: 'translate(' + dx * 0.45 + 'px,' + (dy * 0.45 - 140) + 'px) scale(' + (0.55 + sc * 0.45) + ') rotate(10deg)', offset: 0.55 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc * 1.25 + ') rotate(-4deg)', offset: 0.9 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ') rotate(0deg)', offset: 1 }
    ], { duration: 950, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' });
    anim.onfinish = function () { fly.remove(); land(); };
  }, needScroll ? 520 : 60);
}

/* ---------- уроки ---------- */
// уроки по неделям: ключ совпадает с квестом недели, неделя открывается той же галочкой в «Настройках».
// video: ссылка Kinescope (kinescope.io/ID). Пока ссылки нет, урок показан как «скоро».
var NOTION_HOWTO = [
  'Как заполнять шаблон и вести в нём проект, базово написано внутри, а подробно я рассказываю в уроке.',
  '1. Создайте аккаунт на notion.com, если его ещё нет (нужен VPN).',
  '2. По желанию скачайте приложение Notion на компьютер, в нём удобнее, чем в браузере.',
  '3. Откройте шаблон по кнопке выше.',
  '4. В правом верхнем углу нажмите иконку из двух квадратиков «Дублировать» (Duplicate).',
  '5. Выберите, в какой аккаунт добавить страницу. Готово, шаблон у вас.'
];
var LESSONS = {
  q1: [
    { id: 'w1-1', title: 'Как проходить первую неделю? Как она повлияет на ваш доход?', main: true, video: 'https://play.boomstream.net/B8vXYqdl?title=0', dur: '', cover: 'https://bs.boomstream.com/balancer/size:300/hash:83d5aaa7946ee0f8209089360b084bad/bhQlQss0-a12.jpg' },
    { id: 'w1-2', title: 'ИИ-скилл «Аналитика Никольского»', main: true, video: 'https://play.boomstream.net/3D5Dh9VE?title=0', dur: '', cover: 'https://bs.boomstream.com/balancer/size:300/hash:162c1637898deb84e2b028b1f2cec730/jRYESYJx-a8.jpg',
      note: { q: 'Где найти файл со скиллом?', a: 'Перейди в дашборд персонажа, в раздел «ИИ-скиллы». Скилл уже ждёт тебя там.', act: 'goto-skills', btn: 'Перейти к скиллу' } },
    { id: 'w1-3', title: 'Как я брифую клиента?', video: 'https://play.boomstream.net/9DHUyXTj?title=0', dur: '', cover: 'https://bs.boomstream.com/balancer/size:300/hash:8178bc4dffff289349c740a2623d388a/ggOdTkz0-a1.jpg',
      materials: [{ type: 'notion', title: 'Шаблон брифа для Notion', url: 'https://gregnikolskiy.notion.site/395aca9943ab8051be3fe4ac2c29f92a' }, { type: 'gdoc', title: 'Шаблон брифа для Google Docs', url: 'https://docs.google.com/document/d/1qYwqZ2Wjlo7PXHZDvqzzAve3GtGWYqTT/edit' }] },
    { id: 'w1-4', title: 'Как я делаю анализ ЦА?', video: 'https://play.boomstream.net/r7G31vvL?title=0', dur: '', cover: 'https://bs.boomstream.com/balancer/size:300/hash:0d448a4df45c6cb6ac3d16413bfc3246/Sg89o6Il-a12.jpg' },
    { id: 'w1-5', title: 'Как я анализирую конкурентов?', video: 'https://play.boomstream.net/3shHYmJ6?title=0', dur: '', cover: 'https://bs.boomstream.com/balancer/size:300/hash:c719bd286f093f88eafa6ab7d239277e/nXRBv2pj-a15.jpg' },
    { id: 'w1-6', title: 'Как я формирую УТП?', video: 'https://play.boomstream.net/wW9vLMRX?title=0', dur: '', cover: 'https://bs.boomstream.com/balancer/size:300/hash:3d6934b164335d5a987c09075ec8981d/ewpsTKt6-a4.jpg' }
  ],
  q2: [], q3: [], q4: []
};
var WEEKS = ['q1', 'q2', 'q3', 'q4'];
function weekOpen(w) { return !!(S.settings[w] && S.settings[w].open); }
// уроки первой недели открываются по первым квестам, без галочки в «Настройках»; недели 2–4 по галочке
function lessonsWeekOpen(w) { return w === 'q1' || weekOpen(w); }
function watched(id) { return ((S.player && S.player.lessons) || []).indexOf(id) >= 0; }
function lessonById(id) {
  var r = null;
  WEEKS.forEach(function (w) { (LESSONS[w] || []).forEach(function (l, i) { if (l.id === id) r = { l: l, w: w, n: i + 1 }; }); });
  return r;
}
var LESSON_GATE = ['story', 'guide', 'q0'];
// «Выход в сеть» достаточно сдать: проверка Гриши для уроков не нужна
function lessonsUnlocked() { return LESSON_GATE.every(function (id) { var st = questState(id); return st === 'done' || (id === 'q0' && st === 'review'); }); }
// ждём, пока закончатся поздравления и анимация уровня
function waitCalm(fn) {
  var t0 = Date.now(), quiet = 0;
  var tick = function () {
    if (!root.querySelector('.ug-modal') && !root.querySelector('.ug-fly')) quiet += 300; else quiet = 0;
    if (quiet >= 1800 || Date.now() - t0 > 60000) { if (root.querySelector('#ug-lessons')) fn(); return; }
    setTimeout(tick, 300);
  };
  setTimeout(tick, 300);
}
// уроки открылись: подсвечиваем панель и показываем плашку, ничего не двигаем
function revealLessons() {
  var les = root.querySelector('#ug-lessons');
  if (!les) return;
  markSeen(seenIds().concat(['ach:lessons-open']));
  les.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  les.classList.remove('is-unlocked'); void les.offsetWidth; les.classList.add('is-unlocked');
  music.sfx('achieve');
  achievement('Уроки открыты', 'Новая возможность');
}
function lessonsPanel() {
  if (!S.lessonWeek) {
    // по умолчанию последняя открытая неделя, где есть уроки
    S.lessonWeek = 'q1';
    WEEKS.forEach(function (w) { if (lessonsWeekOpen(w) && (LESSONS[w] || []).length) S.lessonWeek = w; });
  }
  return '<section class="ug-panel ug-lessons" id="ug-lessons">' + lessonsInner() + '</section>';
}
function lessonsInner() {
  var w = S.lessonWeek, list = LESSONS[w] || [], open = lessonsWeekOpen(w);
  var tabs = WEEKS.map(function (x, i) {
    return '<button class="ug-ltab' + (x === w ? ' is-on' : '') + (lessonsWeekOpen(x) ? '' : ' is-locked') + '" data-act="lesson-week" data-w="' + x + '">' +
      (lessonsWeekOpen(x) ? '' : ico('lock')) + 'Неделя ' + (i + 1) + '</button>';
  }).join('');
  var done = list.filter(function (l) { return watched(l.id); }).length;
  var body, gate = !lessonsUnlocked();
  if (gate) body = '<div class="ug-lempty">' + ico('lock') + '<span>Уроки откроются после прохождения первых 4 квестов.</span></div>';
  else if (!open) body = '<div class="ug-lempty">' + ico('lock') + '<span>Уроки этой недели откроются вместе с её квестом.</span></div>';
  else if (!list.length) body = '<div class="ug-lempty">' + ico('hourglass') + '<span>Уроки этой недели скоро появятся.</span></div>';
  else {
    // ближайший непросмотренный урок по порядку крупнее остальных: с него и начинать
    var next = -1;
    list.forEach(function (l, i) { if (next < 0 && !watched(l.id)) next = i; });
    body = list.map(function (l, i) {
      var seen = watched(l.id), ready = !!l.video, isNext = i === next;
      var meta = [];
      var nf = (l.materials || []).filter(function (m) { return m.type === 'file'; }).length, nt = (l.materials || []).length - nf;
      if (nf) meta.push(ico('clip') + (nf > 1 ? nf + ' файла' : 'файл'));
      if (nt) meta.push(ico('clip') + (nt > 1 ? nt + ' шаблона' : 'шаблон'));
      if (!ready) meta.push('видео скоро');
      return '<div class="ug-lrow' + (seen ? ' is-seen' : '') + (isNext ? ' is-next' : '') + '" data-act="lesson" data-l="' + l.id + '">' +
        lessonThumb(l, i) +
        '<div class="ug-lbody">' + (isNext ? '<div class="ug-lnext">' + (done ? 'Следующий урок' : 'Начни с этого урока') + '</div>' : '') +
          '<div class="ug-lt"><b>Урок ' + (i + 1) + '.</b> ' + esc(l.title) + '</div>' +
          (meta.length ? '<div class="ug-lm">' + meta.join('<i class="ug-dot"></i>') + '</div>' : '') + '</div>' +
        '<span class="ug-ltag' + (l.main ? ' is-main' : '') + '">' + (l.main ? 'главный' : 'по желанию') + '</span></div>';
    }).join('');
  }
  return '<div class="ug-panel-h"><div class="ug-panel-t">Уроки</div>' +
      (open && list.length && !gate ? '<div class="ug-panel-t">просмотрено ' + done + ' из ' + list.length + '</div>' : '') + '</div>' +
    '<div class="ug-ltabs">' + tabs + '</div><div class="ug-llist">' + body + '</div>';
}
// миниатюра урока: картинка обложки, а пока её нет, фирменная заглушка с номером
// обложка ищется сама: lessons/<номер урока>.jpg на GitHub, например lessons/w1-3.jpg
// cover может быть ссылкой на миниатюру Boomstream (size:300): она лёгкая и идёт в список уроков,
// а для экрана плеера берём полный размер, убрав из адреса пометку размера
function coverUrl(l) {
  if (l.cover === '') return '';
  if (/^https?:\/\//.test(l.cover || '')) return l.cover;
  return (CONFIG.LESSON_BASE || '') + (l.cover || l.id + '.jpg');
}
function coverFull(l) { return coverUrl(l).replace(/\/balancer\/size:\d+\/hash:[0-9a-f]+\//, '/balancer/'); }
var coverOk = {};
function lessonThumb(l, i) {
  var img = coverUrl(l), ok = coverOk[img] === true;
  return '<div class="ug-lthumb' + (ok ? ' has-img' : '') + '" data-cover="' + esc(img) + '"' + (ok ? ' style="background-image:url(\'' + esc(img) + '\')"' : '') + '>' +
    '<span class="ug-lnum">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' +
    '<span class="ug-lico">' + ico(watched(l.id) ? 'check' : 'play') + '</span>' +
    (l.dur ? '<span class="ug-ldur">' + esc(l.dur) + '</span>' : '') + '</div>';
}
function rerenderLessons() { var el = root.querySelector('#ug-lessons'); if (el) el.innerHTML = lessonsInner(); hydrateThumbs(); }
// подставляем обложки, которые реально нашлись; где картинки нет, остаётся заглушка с номером
function hydrateThumbs() {
  root.querySelectorAll('.ug-lthumb[data-cover]').forEach(function (t) {
    var url = t.getAttribute('data-cover'); if (!url) return;
    var apply = function () { t.classList.add('has-img'); t.style.backgroundImage = 'url("' + url + '")'; };
    if (coverOk[url] === true) { apply(); return; }
    if (coverOk[url] === false) return;
    var im = new Image();
    im.onload = function () { coverOk[url] = true; apply(); };
    im.onerror = function () { coverOk[url] = false; };
    im.src = url;
  });
}
// откуда видео: Kinescope (автоотметка о просмотре), Boomstream или любой другой iframe-плеер
function videoSource(url) {
  var u = String(url || '').trim();
  var m = u.match(/(play\.boomstream\.(?:com|net))\/([A-Za-z0-9_-]+)(\?[^\s"'<>]*)?/);
  if (m) return { type: 'boomstream', src: 'https://' + m[1] + '/' + m[2] + (m[3] || ''), code: m[2] };
  if (/kinescope\.io/.test(u)) return { type: 'kinescope', id: kinescopeId(u) };
  m = u.match(/src=["']([^"']+)["']/); // вставили целый код iframe
  if (m) { var inner = videoSource(m[1]); return inner.type === 'kinescope' ? inner : { type: inner.type, src: m[1].replace(/&amp;/g, '&') }; }
  if (/^https?:\/\//.test(u)) return { type: 'iframe', src: u };
  return { type: 'kinescope', id: u };
}
function kinescopeId(url) {
  var m = String(url || '').match(/kinescope\.io\/(?:embed\/|watch\/)?([A-Za-z0-9_-]+)/);
  return m ? m[1] : String(url || '').trim();
}
var kinescopeReady = null;
function loadKinescope() {
  if (kinescopeReady) return kinescopeReady;
  kinescopeReady = new Promise(function (resolve, reject) {
    if (window.Kinescope && window.Kinescope.IframePlayer) { resolve(window.Kinescope.IframePlayer); return; }
    var prev = window.onKinescopeIframeAPIReady;
    window.onKinescopeIframeAPIReady = function (f) { if (prev) try { prev(f); } catch (e) {} resolve(f); };
    var s = document.createElement('script');
    s.src = 'https://player.kinescope.io/latest/iframe.player.js';
    s.onerror = function () { kinescopeReady = null; reject(new Error('kinescope')); };
    document.head.appendChild(s);
    setTimeout(function () { reject(new Error('timeout')); }, 9000);
  });
  return kinescopeReady;
}
function materialHtml(m) {
  var url = m.url || '';
  if (m.type === 'gdoc' && url) url = url.replace(/\/(edit|view)[^/]*$/, '/copy');
  var btn = url
    ? '<a class="ug-btn is-ghost is-small" href="' + esc(url) + '" target="_blank" rel="noopener">' + ico(m.type === 'file' ? 'download' : 'external') +
        (m.type === 'file' ? 'Скачать' : m.type === 'gdoc' ? 'Сделать копию' : 'Открыть шаблон') + '</a>'
    : '<span class="ug-mat-soon">скоро</span>';
  var extra = '';
  if (m.type === 'notion') extra = '<details class="ug-howto"><summary>Как добавить шаблон в свой Notion</summary>' + NOTION_HOWTO.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</details>';
  if (m.type === 'gdoc') extra = '<div class="ug-mat-note">Кнопка сразу создаст копию на вашем Google Диске, её можно заполнять.</div>';
  if (m.note) extra += '<div class="ug-mat-note">' + esc(m.note) + '</div>';
  return '<div class="ug-mat"><div class="ug-mat-row"><span class="ug-mat-ico">' + ico(m.type === 'file' ? 'download' : 'doc') + '</span>' +
    '<span class="ug-mat-t">' + esc(m.title) + '</span>' + btn + '</div>' + extra + '</div>';
}
function openLesson(id) {
  var f = lessonById(id); if (!f) return;
  var l = f.l;
  var week = WEEKS.indexOf(f.w) + 1, srcv = videoSource(l.video), vid = srcv.id;
  modal('<div class="ug-kicker">// неделя ' + week + ' · урок ' + f.n + (l.main ? ' · главный' : '') + '</div>' +
    '<h2 class="ug-h2">' + esc(l.title) + '</h2>' +
    (l.video
      ? '<div class="ug-player"><div id="ug-kplayer"></div></div><div class="ug-lwatch" id="ug-lwatch">' + watchState(id) + '</div>'
      : '<div class="ug-player is-empty"><div class="ug-player-soon">' + ico('hourglass') + '<span>Видео появится здесь совсем скоро</span></div></div>') +
    (l.note ? '<div class="ug-lnote">' + ico('chip') + '<div><b>' + esc(l.note.q) + '</b><span>' + esc(l.note.a) + '</span>' +
      (l.note.act ? '<div style="margin-top:12px"><button class="ug-btn is-small" data-act="' + l.note.act + '">' + esc(l.note.btn) + '</button></div>' : '') + '</div></div>' : '') +
    ((l.materials || []).length ? '<div class="ug-mats"><div class="ug-panel-t">Материалы к уроку</div>' + l.materials.map(materialHtml).join('') + '</div>' : ''),
    null, 'ug-lesson');
  if (!l.video) return;
  music.hold(true);
  S.afterClose = function () { music.hold(false); if (S.kplayer) { try { S.kplayer.destroy(); } catch (e) {} S.kplayer = null; } };
  var box = root.querySelector('#ug-kplayer');
  var manualDone = function () {
    // прогресс без API плеера не узнать: даём отметить вручную
    var ws = root.querySelector('#ug-lwatch'); if (ws && !watched(id)) ws.innerHTML = '<button class="ug-btn is-ghost is-small" data-act="lesson-done" data-l="' + id + '">' + ico('check') + 'Я посмотрел урок</button>';
  };
  S.lessonCover = coverOk[coverUrl(l)] ? coverFull(l) : '';
  if (srcv.type === 'boomstream') { boomPlayer(box, srcv, id, l.title); return; }
  if (srcv.type !== 'kinescope') {
    box.innerHTML = '<iframe src="' + esc(srcv.src) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen frameborder="0" scrolling="no"></iframe>';
    manualDone();
    return;
  }
  var fallback = function () {
    if (!box || !box.isConnected) return;
    box.innerHTML = '<iframe src="https://kinescope.io/embed/' + esc(vid) + '" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock" allowfullscreen frameborder="0"></iframe>';
    // прогресс без API не узнать: даём отметить вручную
    var ws = root.querySelector('#ug-lwatch'); if (ws && !watched(id)) ws.innerHTML = '<button class="ug-btn is-ghost is-small" data-act="lesson-done" data-l="' + id + '">' + ico('check') + 'Я посмотрел урок</button>';
  };
  loadKinescope().then(function (factory) {
    if (!box || !box.isConnected) return;
    return factory.create('ug-kplayer', { url: 'https://kinescope.io/' + vid, size: { width: '100%', height: '100%' } }).then(function (pl) {
      S.kplayer = pl;
      pl.on(pl.Events.TimeUpdate, function (e) {
        var pc = e && e.data && e.data.percent;
        if (pc >= 80) markWatched(id);
      });
      pl.on(pl.Events.Ended, function () { markWatched(id); });
    });
  }).catch(fallback);
}
// Boomstream: свой экран с кнопкой play поверх плеера, их кнопку ученик не видит.
// Плеер управляется через postMessage: мы шлём play, он отвечает событиями play / pause / stop / time.
function boomPlayer(box, srcv, id, title) {
  var origin = srcv.src.match(/^https:\/\/[^/]+/)[0];
  box.innerHTML = '<iframe src="' + esc(srcv.src) + '" allow="autoplay; fullscreen" allowfullscreen frameborder="0" scrolling="no"></iframe>' +
    '<div class="ug-pcover is-start"' + (S.lessonCover ? ' style="--pc-img:url(\'' + esc(S.lessonCover) + '\')"' : '') + '><div class="ug-phit" data-act="pc-play"></div>' +
      '<div class="ug-pbtn">' + ico('play') + '</div>' +
      '<div class="ug-pcap"><span>Нажми, чтобы начать урок</span></div>' +
    '</div>';
  var frame = box.querySelector('iframe'), cover = box.querySelector('.ug-pcover');
  var st = { loaded: false, want: false, alive: false, timer: 0 };
  var send = function (action, data) {
    try { frame.contentWindow.postMessage({ code: srcv.code, method: 'action', action: action, data: data || '' }, origin); } catch (e) {}
  };
  var mode = function (m) {
    cover.className = 'ug-pcover is-' + m;
    var cap = cover.querySelector('.ug-pcap span');
    if (cap) cap.textContent = m === 'pause' ? 'Пауза' : m === 'end' ? 'Посмотреть ещё раз' : m === 'wait' ? 'Загружаем видео' : 'Нажми, чтобы начать урок';
  };
  var start = function () {
    if (cover.classList.contains('is-end')) { send('seek', '0'); }
    st.want = true; mode('wait');
    if (st.loaded) send('play');
    clearTimeout(st.timer);
    // плеер не ответил: убираем обложку, пусть ученик запустит его кнопкой
    st.timer = setTimeout(function () { if (st.want) { st.want = false; mode('gone'); } }, st.loaded ? 2500 : 6000);
  };
  var onMsg = function (e) {
    if (e.source !== frame.contentWindow) return;
    var d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) { return; } }
    if (!d || !d.method) return;
    st.alive = true;
    if (d.method === 'loaded') { st.loaded = true; if (st.want) send('play'); }
    else if (d.method === 'play') { st.want = false; clearTimeout(st.timer); mode('playing'); }
    else if (d.method === 'pause') { if (!st.want) mode('pause'); }
    else if (d.method === 'stop') { mode('end'); markWatched(id); }
    if (d.duration > 0 && d.time / d.duration >= 0.8) markWatched(id);
  };
  window.addEventListener('message', onMsg);
  S.boomStart = start;
  var prevClose = S.afterClose;
  S.afterClose = function () { window.removeEventListener('message', onMsg); clearTimeout(st.timer); S.boomStart = null; if (prevClose) prevClose(); };
  // если плеер так и не заговорил с нами, отметку о просмотре ставит сам ученик
  setTimeout(function () {
    if (st.alive || !box.isConnected) return;
    var ws = root.querySelector('#ug-lwatch'); if (ws && !watched(id)) ws.innerHTML = '<button class="ug-btn is-ghost is-small" data-act="lesson-done" data-l="' + id + '">' + ico('check') + 'Я посмотрел урок</button>';
  }, 8000);
}
function watchState(id) {
  return watched(id) ? '<span class="is-seen">' + ico('check') + 'Урок просмотрен</span>' : '<span>' + ico('eye') + 'Отметка появится, когда досмотришь урок</span>';
}
function markWatched(id) {
  if (!S.player || watched(id)) return;
  S.player.lessons = (S.player.lessons || []).concat([id]);
  var ws = root.querySelector('#ug-lwatch'); if (ws) ws.innerHTML = watchState(id);
  rerenderLessons();
  music.sfx('tick');
  apiPost({ action: 'lesson', nick: S.nick, lesson: id }).catch(function () {});
}

/* рост уровня: счётчик, полоса и всплывающий «+N» */
function animateLevel(from, to) {
  var box = root.querySelector('#ug-level'), n = root.querySelector('#ug-lvl-n'), segs = root.querySelector('#ug-segs');
  if (!box || !n || !segs) return;
  music.sfx('confirm');
  box.classList.remove('is-up'); void box.offsetWidth; box.classList.add('is-up');
  var tag = document.createElement('div'); tag.className = 'ug-lvlup-tag'; tag.textContent = '+' + (to - from) + ' к уровню';
  box.appendChild(tag); setTimeout(function () { tag.remove(); }, 2200);
  var tmp = document.createElement('div'); tmp.innerHTML = segsHtml(to);
  segs.querySelectorAll('i').forEach(function (el, i) {
    var t = tmp.children[i]; el.className = t.className; el.querySelector('b').style.width = t.querySelector('b').style.width;
  });
  var t0 = performance.now(), dur = 900;
  (function tick(now) {
    var k = Math.min(1, (now - t0) / dur);
    n.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

/* ---------- сдача квеста ---------- */
function openQuest(id) {
  var q = questView(QUESTS.filter(function (x) { return x.id === id; })[0]);
  S.files = []; S.questId = id;
  modal(
    '<div class="ug-kicker">// ' + esc(q.tag) + '</div>' +
    '<h2 class="ug-h2">' + esc(q.title) + '</h2>' +
    '<p class="ug-p">' + esc(q.task) + '</p>' +
    (id === 'q0' ? '<div style="margin-top:16px"><a class="ug-btn is-ghost is-small" href="' + esc(CONFIG.CHAT_URL) + '" target="_blank" rel="noopener">' + ico('chat') + 'Открыть чат потока</a></div>' : '') +
    (q.links ? linksForm(q) : uploadForm(q)) +
    '<div class="ug-err" id="ug-qerr"></div>' +
    '<button class="ug-btn is-wide" data-act="quest-send" id="ug-qsend" disabled>Выполнить</button>' +
    (DEMO && !q.links ? '<div style="margin-top:12px;text-align:center"><button class="ug-link" data-act="quest-send" data-demo="1">Демо: сдать без скриншота</button></div>' : ''));

  if (q.links) {
    root.querySelectorAll('.ug-qlink input').forEach(function (i) { i.addEventListener('input', function () { i.closest('.ug-field').classList.remove('is-bad'); updateSend(); }); });
    return;
  }
  var drop = root.querySelector('#ug-drop'), input = root.querySelector('#ug-file'), comment = root.querySelector('#ug-comment');
  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });
  comment.addEventListener('input', updateSend);
}
// квест со ссылками: по полю на каждый документ
function linksForm(q) {
  return '<div class="ug-qlinks">' + q.links.map(function (l) {
    return '<div class="ug-qlink"><div class="ug-label">' + esc(l.label) + '</div>' +
      '<label class="ug-field"><input type="url" inputmode="url" data-link="' + l.key + '" placeholder="https://notion.so/…" autocomplete="off" spellcheck="false"></label></div>';
  }).join('') + '</div>' +
  '<div class="ug-hint">Проверь, что страницы открыты по ссылке: в Notion нажми Share и в General access выбери Anyone with the link.</div>' +
  '<div class="ug-label" style="margin-top:16px">Комментарий (необязательно)</div>' +
  '<label class="ug-field"><textarea id="ug-comment" rows="2" maxlength="1500" placeholder="Если хочешь что-то добавить"></textarea></label>';
}
function uploadForm(q) {
  return '<label class="ug-drop" id="ug-drop">' + ico('upload') +
      '<div class="ug-drop-t">Прикрепи скриншот</div>' +
      '<div class="ug-drop-d">До 3 изображений. На компьютере можно перетащить файл или вставить через Ctrl+V.</div>' +
      '<input type="file" accept="image/*" multiple id="ug-file"></label>' +
    '<div class="ug-thumbs" id="ug-thumbs"></div>' +
    '<div class="ug-label" style="margin-top:18px">Комментарий' + (q.proof === 'file' ? ' (необязательно)' : ' или ссылка на работу') + '</div>' +
    '<label class="ug-field"><textarea id="ug-comment" rows="2" maxlength="2000" placeholder="' + (q.proof === 'file' ? 'Если хочешь что-то добавить' : 'Ссылка на Notion, сайт, документ…') + '"></textarea></label>';
}
// файлы читаем через FileReader в data-URL: blob-ссылки блокируются в некоторых окнах (превью, встроенные браузеры)
function addFiles(list) {
  Array.prototype.forEach.call(list || [], function (f) {
    if (S.files.length >= 3 || (f.type && !/^image\//.test(f.type))) return;
    var item = { name: f.name || 'screenshot', type: f.type || 'image/jpeg', dataUrl: '', size: f.size || 0 };
    S.files.push(item);
    var r = new FileReader();
    r.onload = function () { item.dataUrl = String(r.result || ''); renderThumbs(); };
    r.onerror = function () { item.failed = true; renderThumbs(); };
    r.readAsDataURL(f);
  });
  renderThumbs();
}
function renderThumbs() {
  var box = root.querySelector('#ug-thumbs'); if (!box) return;
  box.innerHTML = S.files.map(function (f, i) {
    var inner = f.dataUrl ? '<img src="' + f.dataUrl + '" alt="">' : '<span class="ug-thumb-wait mono">' + (f.failed ? 'ошибка' : '...') + '</span>';
    return '<div class="ug-thumb">' + inner + '<button data-act="rm-file" data-i="' + i + '" aria-label="Убрать">' + ico('x') + '</button></div>';
  }).join('');
  var err = root.querySelector('#ug-qerr');
  if (err) err.textContent = S.files.some(function (f) { return f.failed; }) ? 'Этот файл не получилось прочитать. Попробуй другой скриншот.' : '';
  updateSend();
}
function questLinks() {
  return Array.prototype.map.call(root.querySelectorAll('.ug-qlink input'), function (i) { return i.value.trim(); });
}
var LINK_RE = /^(https?:\/\/)?[^\s.\/]+\.[^\s]{2,}$/i;
function canSend() {
  var q = QUESTS.filter(function (x) { return x.id === S.questId; })[0];
  if (q && q.links) return questLinks().every(function (v) { return v.length > 0; });
  var comment = root.querySelector('#ug-comment');
  var hasText = comment && comment.value.trim().length > 0;
  var ready = S.files.filter(function (f) { return f.dataUrl && !f.failed; }).length;
  var loading = S.files.some(function (f) { return !f.dataUrl && !f.failed; });
  if (loading) return false;
  return q && q.proof === 'file' ? ready > 0 : (ready > 0 || hasText);
}
function updateSend() { var b = root.querySelector('#ug-qsend'); if (b) b.disabled = !canSend(); }

function compress(f) {
  return new Promise(function (resolve, reject) {
    var raw = f.dataUrl.split(',')[1] || '';
    var fallback = function () {
      // не удалось пережать: отправляем как есть, если файл не слишком большой
      if (raw && raw.length < 7 * 1024 * 1024) resolve({ name: f.name, mime: /^image\//.test(f.type) ? f.type : 'image/jpeg', data: raw });
      else reject(new Error('image'));
    };
    var img = new Image();
    img.onload = function () {
      try {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        var c2 = cv.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, cv.width, cv.height);
        c2.drawImage(img, 0, 0, cv.width, cv.height);
        resolve({ name: 'screenshot.jpg', mime: 'image/jpeg', data: cv.toDataURL('image/jpeg', 0.85).split(',')[1] });
      } catch (e) { fallback(); }
    };
    img.onerror = fallback;
    img.src = f.dataUrl;
  });
}
function sendQuest(btn) {
  if (!canSend() && !btn.getAttribute('data-demo')) return;
  var err = root.querySelector('#ug-qerr'), comment = root.querySelector('#ug-comment').value.trim(), id = S.questId;
  var qd = QUESTS.filter(function (x) { return x.id === id; })[0];
  if (qd && qd.links) {
    // три ссылки складываем в комментарий: так они придут в письме и лягут во вкладку «Сдачи»
    var vals = questLinks(), bad = -1;
    vals.forEach(function (v, i) { if (bad < 0 && !LINK_RE.test(v)) bad = i; });
    if (bad >= 0) {
      root.querySelectorAll('.ug-qlink .ug-field')[bad].classList.add('is-bad');
      err.textContent = 'Похоже, в поле «' + qd.links[bad].label + '» не ссылка. Скопируй адрес страницы целиком.';
      return;
    }
    comment = qd.links.map(function (l, i) { var v = vals[i]; return l.label + ': ' + (/^https?:/i.test(v) ? v : 'https://' + v); }).join('\n') +
      (comment ? '\nКомментарий: ' + comment : '');
  }
  btn.classList.add('is-loading'); btn.textContent = 'Отправка';
  var ready = S.files.filter(function (f) { return f.dataUrl && !f.failed; });
  Promise.all(ready.map(compress))
    .catch(function (e) { e.stage = 'file'; throw e; })
    .then(function (files) { return apiPost({ action: 'submit', nick: S.nick, quest: id, comment: comment || (btn.getAttribute('data-demo') ? 'демо' : ''), files: files }); })
    .then(function (res) {
      if (res && res.ok) {
        S.player = res.player; if (res.settings) S.settings = res.settings;
        closeModal(); screenDash(); music.sfx('achieve');
        var q = questView(QUESTS.filter(function (x) { return x.id === id; })[0]);
        modal(burst() +
          '<div class="ug-kicker">// квест отправлен на проверку</div>' +
          '<h2 class="ug-h2">«' + esc(q.title) + '»</h2>' +
          '<p class="ug-p">Гриша посмотрит выполнение и засчитает квест. Как только он его утвердит, иконка квеста в журнале сменится на пройденную.</p>' +
          '<div class="ug-dialog-actions"><button class="ug-btn" data-act="close">В профиль</button></div>', null, 'ug-congrats');
        return;
      }
      btn.classList.remove('is-loading'); btn.textContent = 'Выполнить';
      var map = { quest_locked: 'Этот квест ещё закрыт.', already_done: 'Этот квест уже засчитан.', empty: 'Прикрепи скриншот.' };
      err.textContent = (res && map[res.error]) || 'Не получилось отправить. Попробуй ещё раз.';
    })
    .catch(function (e) {
      btn.classList.remove('is-loading'); btn.textContent = 'Выполнить';
      err.textContent = e && e.stage === 'file' ? 'Скриншот слишком большой или не читается. Попробуй другой файл.' : 'Нет связи. Проверь интернет и попробуй ещё раз.';
    });
}

/* ---------- модалки ---------- */
function burst() {
  var sparks = '';
  for (var i = 0; i < 14; i++) {
    var a = (i / 14) * Math.PI * 2, r = 70 + (i % 3) * 18;
    sparks += '<i style="--x:' + Math.round(Math.cos(a) * r) + 'px;--y:' + Math.round(Math.sin(a) * r) + 'px;animation-delay:' + (0.15 + (i % 4) * 0.04) + 's"></i>';
  }
  return '<div class="ug-burst">' + sparks + '<div class="ug-burst-core">' + ico('check') + '</div></div>';
}
function modal(inner, acc, extra) {
  closeModal();
  var m = document.createElement('div');
  m.className = 'ug-modal';
  m.setAttribute('data-act', 'backdrop');
  m.innerHTML = '<div class="ug-dialog ' + (extra || '') + '"' + (acc ? ' style="--acc:' + acc + '"' : '') + ' role="dialog" aria-modal="true">' +
    '<button class="ug-x" data-act="close" aria-label="Закрыть">' + ico('x') + '</button>' + inner + '</div>';
  root.appendChild(m);
}
function closeModal() {
  var m = root.querySelector('.ug-modal'); if (m) m.remove();
  S.files = [];
  if (S.afterClose) { var fn = S.afterClose; S.afterClose = null; setTimeout(fn, 250); }
}

/* ---------- обновление при возврате на вкладку ---------- */
var lastRefresh = 0;
function refresh() {
  if (!S.player || !S.nick || root.querySelector('.ug-modal') || S.screen !== 'dash') return;
  if (Date.now() - lastRefresh < 10000) return;
  lastRefresh = Date.now();
  apiGet(S.nick).then(function (res) {
    if (!res || !res.ok || !res.exists) return;
    if (res.needPin) { store.del('ug_pin_' + S.nick); screenPin(S.nick, res.error); return; }
    var before = JSON.stringify([S.player, S.settings]);
    S.player = res.player; if (res.settings) S.settings = res.settings;
    if (JSON.stringify([S.player, S.settings]) !== before && root.classList.contains('is-dash')) screenDash();
  }).catch(function () {});
}
document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
window.addEventListener('focus', refresh);
// пока квест на проверке и профиль открыт на экране, раз в 30 секунд спрашиваем таблицу:
// как только Гриша засчитает квест, поздравление появится без перезагрузки
var pollTick = 0;
setInterval(function () {
  if (document.hidden || !S.player || !root.classList.contains('is-dash')) return;
  pollTick++;
  var waiting = QUESTS.some(function (q) { return questState(q.id) === 'review'; });
  // квест на проверке: каждые 30 секунд; в остальное время раз в 2 минуты, чтобы ловить ачивки и новые недели
  if (waiting || pollTick % 4 === 0) refresh();
}, 30000);

/* ---------- демо-панель ---------- */
function demoPanel() {
  var d = document.createElement('details');
  d.className = 'ug-demo';
  d.innerHTML = '<summary>ДЕМО-РЕЖИМ ▾</summary><div>' +
    '<button data-act="demo-approve">Засчитать сданные квесты</button>' +
    '<button data-act="demo-rework">Вернуть на доработку</button>' +
    '<button data-act="demo-week">Открыть следующую неделю</button>' +
    '<button data-act="demo-pet">Выдать питомца</button>' +
    '<button data-act="demo-weapon">Выдать автоматона</button>' +
    '<button data-act="demo-ach">Выдать «Первопроходца»</button>' +
    '<button data-act="demo-reset">Сбросить всё</button></div>';
  root.appendChild(d);
}
function demoMutate(fn) {
  var db = demoDb.load(); fn(db); demoDb.save(db);
  if (S.nick && db.players[S.nick]) { S.player = demoDb.view(db.players[S.nick]); S.settings = db.settings; screenDash(); }
}

/* ================= СОБЫТИЯ ================= */
var ACTIONS = {
  land: function () { screenGender(); },
  sound: function () { music.toggle(); },
  relogin: function () { screenLogin(S.draft.nick); },
  gender: function (el) { S.draft.g = el.getAttribute('data-g'); S.draft.cls = null; screenClass(); },
  'back-gender': function () { screenGender(); },
  'class': function (el) { if (!el.classList.contains('is-sel')) pickClass(el); },
  'class-confirm': confirmClass,
  'class-ok': function () { music.sfx('confirm'); closeModal(); screenSheet(); },
  'quiz-start': function () { screenQuiz(0); },
  'quiz-opt': function (el) { quizOpt(el); },
  'range-step': function (el) { var q = QUIZ[S.draft.qi]; rangeSet(quizAns(q).num + (+el.getAttribute('data-d')) * q.step); },
  'quiz-next': quizNext,
  'quiz-back': quizBack,
  'quiz-mid-go': function () { screenQuiz(QUIZ_MID); },
  'quiz-mid-back': function () { S.draft.midShown = false; screenQuiz(QUIZ_MID - 1); },
  'back-class': function () { screenClass(); var k = S.draft.cls; if (k) { var el = root.querySelector('.ug-class[data-cls="' + k + '"]'); if (el) pickClass(el); } },
  'open-profile': function () { S.justCreated = true; screenDash(); },
  poke: poke,
  egg: function (el) { eggPoke(el); },
  weapon: function (el) {
    if (S.player && S.player.weapon) { toast(S.player.weapon); return; }
    var egg = el.querySelector('.ug-pet-egg');
    if (egg) { egg.classList.remove('is-shake'); void egg.offsetWidth; egg.classList.add('is-shake'); }
    toast(WEAPON_LINES[weaponN++ % WEAPON_LINES.length]);
  },
  origin: function () { closeModal(); originModal(); },
  guide: function () { closeModal(); guideModal(); },
  'quest-info': function (el) { questInfo(el.getAttribute('data-q')); },
  'skill-info': function (el) { skillInfo(+el.getAttribute('data-i')); },
  quest: function (el) { var id = el.getAttribute('data-q'); closeModal(); openQuest(id); },
  'rm-file': function (el) { S.files.splice(+el.getAttribute('data-i'), 1); renderThumbs(); },
  'quest-send': function (el) { sendQuest(el); },
  'login-go': function (el) { music.prime(); submitLogin(el.closest('form')); },
  'pin-go': function (el) { music.prime(); submitPin(el.closest('form')); },
  'pin-save': function (el) { savePin(el.closest('form')); },
  'ach-claim': function (el) { claimAward(el.getAttribute('data-ach')); },
  'ach-info': function (el) { if (!el.classList.contains('is-pending')) achInfo(el.getAttribute('data-ach')); },
  'ach-locked': function () { modal('<div class="ug-award-stage">' + lockedBadge().replace('ug-badge', 'ug-badge is-big') + '</div><div class="ug-kicker">// достижение</div><h2 class="ug-h2">Пока скрыто</h2><p class="ug-p">Сюда прибьют следующую ачивку. За что её дают, узнаешь, когда получишь.</p>', '#8b93c9', 'ug-congrats ug-award'); },
  'lesson-week': function (el) { S.lessonWeek = el.getAttribute('data-w'); music.sfx('tick'); rerenderLessons(); },
  'lesson': function (el) { openLesson(el.getAttribute('data-l')); },
  'lesson-done': function (el) { markWatched(el.getAttribute('data-l')); },
  // из урока к инвентарю: закрываем окно, едем к скиллам и один раз подсвечиваем панель
  'goto-skills': function () {
    closeModal();
    var inv = root.querySelector('#ug-inv-panel'); if (!inv) return;
    inv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var done = false, flash = function () {
      if (done) return; done = true;
      inv.classList.remove('is-flash'); void inv.offsetWidth; inv.classList.add('is-flash');
      music.sfx('tick');
    };
    var sc = root.querySelector('.ug-stage') || root;
    var last = -1, still = 0, iv = setInterval(function () {
      var y = inv.getBoundingClientRect().top;
      still = Math.abs(y - last) < 1 ? still + 1 : 0; last = y;
      if (still >= 2) { clearInterval(iv); flash(); }
    }, 80);
    setTimeout(function () { clearInterval(iv); flash(); }, 1600);
  },
  'pc-play': function () { music.prime(); if (S.boomStart) S.boomStart(); },
  close: closeModal,
  backdrop: function (el, e) { if (e.target === el) closeModal(); },
  logout: function () {
    modal('<div class="ug-kicker">// смена игрока</div><h2 class="ug-h2">Выйти из профиля?</h2>' +
      '<p class="ug-p">Персонаж не пропадёт. Чтобы вернуться, введи ник и ПИН-код ещё раз.</p>' +
      '<div class="ug-dialog-actions"><button class="ug-btn is-ghost" data-act="close">Остаться</button><button class="ug-btn" data-act="logout-ok">Выйти</button></div>');
  },
  'logout-ok': function () { closeModal(); if (music.isPlaying()) music.start('ambient'); store.del('ug_nick'); if (S.nick) store.del('ug_pin_' + S.nick); setHash(''); S.player = null; S.nick = ''; S.draft = {}; screenLogin(''); },
  'demo-approve': function () { demoMutate(function (db) { var p = db.players[S.nick]; if (!p) return; Object.keys(p.quests).forEach(function (k) { if (p.quests[k] === 'на проверке') p.quests[k] = 'выполнен'; }); }); },
  'demo-rework': function () { demoMutate(function (db) { var p = db.players[S.nick]; if (!p) return; Object.keys(p.quests).forEach(function (k) { if (p.quests[k] === 'на проверке') p.quests[k] = 'доработать'; }); }); },
  'demo-week': function () { demoMutate(function (db) { for (var i = 0; i < QUESTS.length; i++) { var id = QUESTS[i].id; if (!db.settings[id].open) { db.settings[id].open = true; db.settings[id].deadline = 'вс, 23:59 МСК'; break; } } }); },
  'demo-pet': function () { demoMutate(function (db) { var p = db.players[S.nick]; if (p) p.pet = 'Кибер-лис'; }); },
  'demo-ach': function () { demoMutate(function (db) { var p = db.players[S.nick]; if (p) { p.achievements = p.achievements || []; if (p.achievements.indexOf('pioneer') < 0) p.achievements.push('pioneer'); } }); },
  'demo-weapon': function () { demoMutate(function (db) { var p = db.players[S.nick]; if (p) p.weapon = 'Автоматон «Искра»'; }); },
  'demo-reset': function () { store.del('ug_demo_db'); store.del('ug_nick'); if (S.nick) store.del('ug_seen_' + S.nick); setHash(''); location.reload(); }
};
root.addEventListener('click', function (e) {
  var el = e.target.closest('[data-act]');
  if (!el || !root.contains(el)) return;
  var fn = ACTIONS[el.getAttribute('data-act')];
  if (fn) fn(el, e);
});
// в поле ПИН-кода остаются только цифры
root.addEventListener('input', function (e) {
  if (!e.target.matches || !e.target.matches('input[name=pin]')) return;
  var v = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (v !== e.target.value) e.target.value = v;
  var f = e.target.closest('.ug-field'); if (f) f.classList.remove('is-bad');
});
root.addEventListener('submit', function (e) {
  var f = e.target.getAttribute('data-form');
  if (!f) return;
  e.preventDefault();
  if (f === 'login') submitLogin(e.target);
  if (f === 'pin') submitPin(e.target);
  if (f === 'pin-set') savePin(e.target);
});
root.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if (!root.querySelector('.ug-modal.is-locked')) closeModal(); return; }
  if (e.target.matches && e.target.matches('input[name=pin]')) {
    if (e.key === 'Enter') { e.preventDefault(); var f = e.target.closest('form'); if (f.getAttribute('data-form') === 'pin') submitPin(f); else savePin(f); }
    return;
  }
  // Enter в поле ника: отправляем сами, не полагаясь на отправку формы
  if (e.key === 'Enter' && e.target.matches && e.target.matches('input[name=nick]')) {
    e.preventDefault(); music.prime(); submitLogin(e.target.closest('form'));
  } else if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-quiz]')) {
    e.preventDefault(); quizNext();
  } else if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('ug-class')) {
    e.preventDefault(); pickClass(e.target);
  }
});
// Музыка стартует с первого касания на любом экране: раньше браузер звук не разрешит.
// На телефонах разрешение даёт только отпускание пальца (touchend/click), поэтому слушаем все три события
// и повторяем попытку, пока звук реально не заиграет.
function unlockMusic(e) {
  if (e.target.closest && e.target.closest('.ug-sound')) return;
  if (store.get('ug_muted') === '1') return;
  // на экране входа музыку сами не включаем: только готовим звук для щелчков,
  // а трек стартует на следующем экране. Включить её здесь можно кнопкой «Звук».
  if (S.screen === 'login' || music.isPlaying()) music.prime();
  else music.start('epic');
  if (music.running()) ['pointerdown', 'touchend', 'click'].forEach(function (t) { root.removeEventListener(t, unlockMusic, true); });
}
['pointerdown', 'touchend', 'click'].forEach(function (t) { root.addEventListener(t, unlockMusic, true); });
root.addEventListener('pointerdown', function (e) {
  var el = e.target.closest('.ug-btn, .ug-chip, .ug-class, .ug-gender, .ug-link, .ug-rbtn, .ug-linkbox button, .ug-x, .ug-drop');
  if (!el || el.disabled || el.classList.contains('is-loading')) return;
  var big = el.classList.contains('ug-btn') || el.classList.contains('ug-gender') || el.classList.contains('ug-class');
  music.sfx(big ? 'click' : 'tick');
});
root.addEventListener('input', function (e) {
  var f = e.target.getAttribute && e.target.getAttribute('data-quiz');
  if (!f) return;
  if (f === 'range') { rangeSet(+e.target.value); return; }
  var q = QUIZ[S.draft.qi]; quizAns(q)[f] = e.target.value; quizRefresh();
});
document.addEventListener('paste', function (e) {
  if (!root.querySelector('#ug-drop') || !e.clipboardData) return;
  var files = [];
  Array.prototype.forEach.call(e.clipboardData.items || [], function (it) { if (it.kind === 'file') { var f = it.getAsFile(); if (f) files.push(f); } });
  if (files.length) { e.preventDefault(); addFiles(files); }
});

/* ================= СТАРТ ================= */
try { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; } catch (e) {}
if (DEMO) demoPanel();

var hashNick = normNick(decodeURIComponent((location.hash || '').slice(1)));
var savedNick = normNick(store.get('ug_nick'));
var startNick = hashNick || savedNick;
if (startNick) screenLoading(startNick); else screenLogin('');
music.showBtn();

// Фоновая подгрузка всех картинок в кэш, пока игрок вводит ник.
// Порядок повторяет путь игрока; вернувшемуся игроку сначала грузим то, что нужно в профиле.
var preloaded = [];
(function preloadImages() {
  var L = CONFIG.LEVEL_IMAGES || {}, lvl = [], cls = [];
  Object.keys(L).forEach(function (at) { ['m', 'f'].forEach(function (g) { Object.keys(L[at][g] || {}).forEach(function (c) { lvl.push(L[at][g][c]); }); }); });
  ['m', 'f'].forEach(function (g) { Object.keys(CONFIG.IMAGES[g] || {}).forEach(function (c) { cls.push(CONFIG.IMAGES[g][c]); }); });
  // миниатюры уроков лёгкие (300 px), качаем их сразу; полные обложки для плеера в самом конце
  var thumbs = [], fulls = [];
  WEEKS.forEach(function (w) { (LESSONS[w] || []).forEach(function (l) { thumbs.push(coverUrl(l)); fulls.push(coverFull(l)); }); });
  var flow = [CONFIG.CITY_IMAGE].concat(thumbs, [CONFIG.VILLAGE_IMAGE, CONFIG.GENDER_IMAGES.m, CONFIG.GENDER_IMAGES.f], cls, [CONFIG.ORIGIN_IMAGE, CONFIG.GUIDE_IMAGE], lvl, fulls);
  if (startNick) flow = [CONFIG.CITY_IMAGE].concat(lvl, thumbs, [CONFIG.ORIGIN_IMAGE, CONFIG.GUIDE_IMAGE], fulls, flow);
  var seen = {}, queue = flow.filter(function (u) { if (!u || seen[u] || /^data:/.test(u)) return false; seen[u] = 1; return true; });
  var next = function () {
    var url = queue.shift();
    if (!url) return;
    var im = new Image();
    preloaded.push(im);
    im.onload = function () {
      coverOk[url] = true;
      if (thumbs.indexOf(url) >= 0) hydrateThumbs();
      // заранее декодируем, чтобы картинка появилась на экране без задержки
      if (im.decode) im.decode().then(next, next); else next();
    };
    im.onerror = next;
    im.src = url;
  };
  for (var i = 0; i < 4; i++) next(); // четыре загрузки параллельно
})();

})();
