/* =========================================================
   Айкідо Львів — скрипт сайту (усі сторінки)
   Статична версія: дані беруться з js/data.js, сервер не потрібен.
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Хелпери ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // Пропускаємо лише безпечні посилання
  function safeUrl(url) {
    return /^(https?:\/\/|\/|#)/.test(url || '') ? url : '#';
  }

  const MONTHS_SHORT = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
  const fmtLong = new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtTime = new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' });

  function loadData(key, query) {
    let list = ((window.SITE_DATA && window.SITE_DATA[key]) || []).slice();
    if (key === 'news') {
      list = list.filter(n => n.published !== false)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      const m = /limit=(\d+)/.exec(query || '');
      if (m) list = list.slice(0, Number(m[1]));
    } else if (key === 'events') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      list = list.filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else {
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return Promise.resolve(list);
  }

  function empty(box, text) {
    box.innerHTML = `<p class="empty">${esc(text)}</p>`;
  }

  /* ---------- Рендер ---------- */
  function renderInstructors(list) {
    const box = $('#instructors-list');
    if (!list.length) return empty(box, 'Інформація про інструкторів зʼявиться найближчим часом.');
    box.innerHTML = list.map(p => `
      <article class="person reveal">
        <div class="person__photo">
          ${p.photo ? `<img src="${esc(safeUrl(p.photo))}" alt="${esc(p.name)}" loading="lazy">` : esc((p.name || '?').charAt(0))}
        </div>
        <h3 class="person__name">${esc(p.name)}</h3>
        <p class="person__role">${esc(p.role)}</p>
        <p class="person__bio">${esc(p.bio)}</p>
      </article>`).join('');
  }

  function renderNews(list) {
    const box = $('#news-list');
    if (!list.length) return empty(box, 'Новин поки що немає.');
    box.innerHTML = list.map(n => `
      <a class="news-card reveal" href="${n._id ? 'news-post.html?id=' + encodeURIComponent(n._id) : '#'}">
        <div class="news-card__img">
          ${n.image ? `<img src="${esc(safeUrl(n.image))}" alt="" loading="lazy">` : ''}
        </div>
        <div class="news-card__body">
          <time datetime="${esc(n.publishedAt)}">${esc(fmtLong.format(new Date(n.publishedAt)))}</time>
          <h3>${esc(n.title)}</h3>
          <p>${esc(n.excerpt)}</p>
        </div>
      </a>`).join('');
  }

  function renderEvents(list) {
    const box = $('#events-list');
    if (!list.length) return empty(box, 'Найближчих подій поки що немає — слідкуйте за новинами.');
    box.innerHTML = list.map(e => {
      const d = new Date(e.date);
      const meta = [e.place, e.description].filter(Boolean).join(' · ');
      const link = e.link && safeUrl(e.link) !== '#'
        ? ` <a class="link-arrow" href="${esc(safeUrl(e.link))}" target="_blank" rel="noopener">Деталі</a>` : '';
      return `
        <li class="event reveal">
          <div class="event__date">
            <span class="event__day">${d.getDate()}</span>
            <span class="event__month">${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}</span>
          </div>
          <div>
            <h3 class="event__title">${esc(e.title)}</h3>
            <p class="event__meta">${esc(meta)}${link}</p>
          </div>
          <span class="event__tag">${esc(e.type)}</span>
        </li>`;
    }).join('');
  }

  function renderHalls(list) {
    const box = $('#halls-list');
    if (!list.length) return empty(box, 'Інформація про зали зʼявиться найближчим часом. Телефонуйте — підкажемо!');
    box.innerHTML = list.map(hl => `
      <article class="hall reveal">
        ${hl.photo ? `<img class="hall__img" src="${esc(safeUrl(hl.photo))}" alt="${esc(hl.name)}" loading="lazy">` : ''}
        <div class="hall__body">
          <h3>${esc(hl.name)}</h3>
          ${hl.address ? `<p class="hall__addr">${esc(hl.address)}</p>` : ''}
          ${hl.schedule ? `<p class="hall__schedule">${esc(hl.schedule)}</p>` : ''}
          ${hl.mapUrl && safeUrl(hl.mapUrl) !== '#' ? `<a class="link-arrow" href="${esc(safeUrl(hl.mapUrl))}" target="_blank" rel="noopener">Показати на карті →</a>` : ''}
        </div>
      </article>`).join('');
  }

  function renderArticle() {
    const box = $('#article');
    const id = new URLSearchParams(location.search).get('id');
    const n = ((window.SITE_DATA && window.SITE_DATA.news) || [])
      .find(x => String(x._id) === id && x.published !== false);
    if (!n) { empty(box, 'Новину не знайдено.'); return Promise.resolve(); }
    document.title = n.title + ' — Айкідо Львів';
    const paragraphs = String(n.body || '').split(/\n\s*\n/).filter(Boolean)
      .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    box.innerHTML = `
      <time datetime="${esc(n.publishedAt)}">${esc(fmtLong.format(new Date(n.publishedAt)))}</time>
      <h1>${esc(n.title)}</h1>
      ${n.image ? `<img class="article__img" src="${esc(safeUrl(n.image))}" alt="">` : ''}
      <div class="article__body">${paragraphs}</div>`;
    return Promise.resolve();
  }

  /* ---------- Шапка: тінь при прокрутці ---------- */
  const header = $('#header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобільне меню ---------- */
  const burger = $('#burger');
  const nav = $('#nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Поява елементів при прокрутці ---------- */
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  function observeReveals() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
      if (observer) observer.observe(el);
      else el.classList.add('is-visible');
    });
  }

  /* ---------- Старт: вантажимо лише те, що є на сторінці ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const jobs = [];
  const newsBox = $('#news-list');
  if ($('#instructors-list')) jobs.push(loadData('instructors').then(renderInstructors));
  if (newsBox) jobs.push(loadData('news', '?limit=' + (parseInt(newsBox.dataset.limit, 10) || 50)).then(renderNews));
  if ($('#events-list')) jobs.push(loadData('events').then(renderEvents));
  if ($('#halls-list')) jobs.push(loadData('halls').then(renderHalls));
  if ($('#article')) jobs.push(renderArticle());

  observeReveals();
  Promise.all(jobs)
    .catch(err => console.error('Помилка відображення:', err))
    .finally(observeReveals);
})();
