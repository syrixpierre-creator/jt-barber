(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  /* ---------- i18n (auto-detect from phone/browser, default pt) ---------- */
  const SUPPORTED = ['pt', 'en', 'fr', 'ht'];
  function detectLang() {
    const saved = store.get('jt-lang');
    if (SUPPORTED.includes(saved)) return saved;
    const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'pt'];
    for (const l of langs) {
      const base = String(l).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(base)) return base;
    }
    return 'pt';
  }
  let lang = detectLang();
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.pt[k] || k;

  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map((w, i) =>
      `<span class="w"><span style="transition-delay:${i * 60}ms">${w}</span></span>`).join(' ');
  }

  function applyLang(l) {
    lang = SUPPORTED.includes(l) ? l : 'pt';
    document.documentElement.lang = lang === 'ht' ? 'ht' : lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('.split').forEach(splitWords);
    $('.lang__cur').textContent = lang.toUpperCase();
    $$('.lang__menu button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    buildSlots();
  }

  const langWrap = $('.lang');
  $('.lang__btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const open = langWrap.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', () => langWrap.classList.remove('open'));
  $$('.lang__menu button').forEach(b => b.addEventListener('click', () => {
    store.set('jt-lang', b.dataset.lang);
    applyLang(b.dataset.lang);
    langWrap.classList.remove('open');
    $$('.split').forEach(el => el.classList.add('in'));
  }));

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
    }, reduce ? 0 : 1400);
  });
  // safety: never stay stuck on the loader
  setTimeout(() => { document.body.classList.remove('is-loading'); document.body.classList.add('is-ready'); }, 4500);

  /* ---------- Header / burger ---------- */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $('.burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  function observeAll() { $$('.reveal-up, .reveal-img, .split, .stat').forEach(el => io.observe(el)); }

  /* ---------- Counters ---------- */
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, dur = 1600, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick); cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Parallax ---------- */
  const px = $$('[data-parallax]');
  if (!reduce) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        px.forEach(el => { el.style.transform = `translate3d(0, ${scrollY * +el.dataset.parallax}px, 0) scale(1.1)`; });
        const m = $('.marquee__track'); if (m) m.style.setProperty('--skew', `${Math.max(-8, Math.min(8, (scrollY - (m._last || 0)) * 0.3))}deg`), (m._last = scrollY);
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Custom cursor + magnetic + tilt (desktop only) ---------- */
  if (fine && !reduce) {
    const c = $('.cursor'), d = $('.cursor-dot');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; d.style.transform = `translate(${mx}px, ${my}px)`; });
    (function loop() { cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18; c.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', (e) => c.classList.toggle('hover', !!e.target.closest('a, button, .g, select, input, textarea, summary')));

    $$('.magnetic').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    $$('.tilt').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-6px)`;
        el.style.setProperty('--mx', `${(x + .5) * 100}%`); el.style.setProperty('--my', `${(y + .5) * 100}%`);
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  } else {
    document.body.classList.add('no-cursor');
  }

  /* ---------- Image fallback ---------- */
  $$('img').forEach(img => img.addEventListener('error', () => {
    if (img.dataset.fb) return; img.dataset.fb = 1;
    img.closest('figure, .about__media, .hero__bg')?.classList.add('img-fallback');
    img.src = 'assets/logo.png';
  }));

  /* ---------- Booking form ---------- */
  const PHONE = '554497547645', EMAIL = 'Toussaintjeffson98@gmail.com';
  const form = $('#bookingForm'), dateInput = $('#f-date'), slotsEl = $('#slots');
  let chosenSlot = '';
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);

  function buildSlots() {
    const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    slotsEl.innerHTML = times.map(h => `<button type="button" class="slot${h === chosenSlot ? ' on' : ''}" data-h="${h}">${h}</button>`).join('');
  }
  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.slot'); if (!b) return;
    chosenSlot = b.dataset.h; $$('.slot', slotsEl).forEach(s => s.classList.toggle('on', s === b));
  });

  let via = 'wa';
  $$('button[type=submit]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get('name') || '').trim(), phone = (f.get('phone') || '').trim(),
      service = f.get('service'), date = f.get('date'), msg = (f.get('msg') || '').trim();
    const err = $('#formError');
    if (!name || !phone || !service || !date || !chosenSlot) {
      err.textContent = t('form.err'); form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); return;
    }
    err.textContent = '';
    const niceDate = new Date(date + 'T12:00').toLocaleDateString(lang === 'ht' ? 'fr' : lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const body = [
      t('form.msgTitle'), '',
      `• ${t('form.lName')}: ${name}`,
      `• ${t('form.lPhone')}: ${phone}`,
      `• ${t('form.lService')}: ${service}`,
      `• ${t('form.lDate')}: ${niceDate}`,
      `• ${t('form.lTime')}: ${chosenSlot}`,
      msg ? `• ${t('form.lMsg')}: ${msg}` : ''
    ].filter(Boolean).join('\n');

    const url = via === 'mail'
      ? `mailto:${EMAIL}?subject=${encodeURIComponent('JT Barber — ' + t('nav.booking') + ' — ' + name)}&body=${encodeURIComponent(body)}`
      : `https://wa.me/${PHONE}?text=${encodeURIComponent(body)}`;
    toast(t('form.ok'));
    setTimeout(() => { via === 'mail' ? (location.href = url) : window.open(url, '_blank', 'noopener'); }, 500);
  });

  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* ---------- Init ---------- */
  $('#year').textContent = new Date().getFullYear();
  applyLang(lang);
  observeAll();
})();
