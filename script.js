(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const ANIM = !!(window.gsap && window.ScrollTrigger) && !reduce;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };
  if (!ANIM) document.body.classList.add('no-anim');

  /* =========================================================
     i18n — auto-detect phone language, default Portuguese
     ========================================================= */
  const SUPPORTED = ['pt', 'en', 'fr', 'ht'];
  function detectLang() {
    const saved = store.get('jt-lang');
    if (SUPPORTED.includes(saved)) return saved;
    const list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'pt'];
    for (const l of list) {
      const base = String(l).toLowerCase().split('-')[0];
      if (SUPPORTED.includes(base)) return base;
    }
    return 'pt';
  }
  let lang = detectLang();
  const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.pt[k] || k;

  /* =========================================================
     Lookbook (haircut styles)
     ========================================================= */
  const CAT_KEY = { fade: null, curly: 'styles.curly', short: 'styles.short', design: 'styles.design', beard: 'styles.beard' };
  const looksEl = $('#looks');
  looksEl.innerHTML = LOOKS.map(l => `
    <article class="look ${l.size ? 'look--' + l.size : ''}" data-cat="${l.cat}" data-id="${l.id}" tabindex="0">
      <div class="look__media"><img src="${l.img}" alt="${l.name}" loading="lazy" data-fallback="${l.hair}" /></div>
      <div class="look__info">
        <div><span class="look__tag" ${CAT_KEY[l.cat] ? `data-i18n="${CAT_KEY[l.cat]}"` : ''}>Fade</span><h3 class="look__name">${l.name}</h3></div>
        <span class="look__plus">+</span>
      </div>
    </article>`).join('');

  // style select in the booking form
  const styleSel = $('#f-style');
  styleSel.innerHTML = `<option value="" data-i18n="form.styleNone">—</option>` + LOOKS.map(l => `<option value="${l.name}">${l.name}</option>`).join('');

  /* image fallback → illustrated haircut (or logo) */
  function fallback(img) {
    if (img.dataset.done) return; img.dataset.done = 1;
    const kind = img.dataset.fallback;
    if (!kind || kind === 'logo') {
      img.src = 'assets/logo.png'; img.style.objectFit = 'contain'; img.style.padding = '18%'; img.style.filter = 'none';
      return;
    }
    const wrap = document.createElement('div'); wrap.innerHTML = hairSVG(kind);
    const svg = wrap.firstElementChild; svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    img.replaceWith(svg);
  }
  $$('img[data-fallback]').forEach(img => {
    if (img.complete && img.naturalWidth === 0) fallback(img);
    img.addEventListener('error', () => fallback(img));
  });

  /* filters */
  $$('.chip').forEach(ch => ch.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('on', c === ch));
    const f = ch.dataset.filter;
    const cards = $$('.look');
    const apply = () => {
      cards.forEach(c => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
      if (ANIM) {
        gsap.fromTo($$('.look:not(.is-hidden)'), { opacity: 0, y: 40, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .6, stagger: .05, ease: 'power3.out', clearProps: 'transform' });
        ScrollTrigger.refresh();
      }
    };
    ANIM ? gsap.to(cards, { opacity: 0, y: 20, duration: .25, stagger: .015, onComplete: apply }) : apply();
  }));

  /* lightbox */
  const lb = $('#lb'); let current = null;
  function openLook(card) {
    const l = LOOKS.find(x => x.id === card.dataset.id); if (!l) return;
    current = l;
    const media = card.querySelector('.look__media').firstElementChild.cloneNode(true);
    $('#lbMedia').replaceChildren(media);
    $('#lbTag').textContent = card.querySelector('.look__tag').textContent;
    $('#lbName').textContent = l.name;
    $('#lbDesc').textContent = t('look.' + l.id);
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
  }
  function closeLook() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); }
  looksEl.addEventListener('click', e => { const c = e.target.closest('.look'); if (c) openLook(c); });
  looksEl.addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('.look'); if (c) openLook(c); } });
  $$('[data-close]', lb).forEach(b => b.addEventListener('click', closeLook));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLook(); });
  $('#lbWant').addEventListener('click', () => {
    if (current) styleSel.value = current.name;
    closeLook(); scrollToEl('#booking'); toast(t('form.picked'));
  });

  /* =========================================================
     Language apply
     ========================================================= */
  function splitWords(el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
  }
  function applyLang(l, initial) {
    lang = SUPPORTED.includes(l) ? l : 'pt';
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('.split').forEach(splitWords);
    $('.lang__cur').textContent = lang.toUpperCase();
    $$('.lang__menu button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    buildSlots();
    if (!initial) { setupScrubText(); if (ANIM) ScrollTrigger.refresh(); }
  }
  const langWrap = $('.lang');
  $('.lang__btn').addEventListener('click', e => { e.stopPropagation(); const o = langWrap.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', o); });
  document.addEventListener('click', () => langWrap.classList.remove('open'));
  $$('.lang__menu button').forEach(b => b.addEventListener('click', () => {
    store.set('jt-lang', b.dataset.lang); applyLang(b.dataset.lang); langWrap.classList.remove('open');
  }));

  /* =========================================================
     Booking form
     ========================================================= */
  const PHONE = '554497547645', EMAIL = 'Toussaintjeffson98@gmail.com';
  const form = $('#bookingForm'), dateInput = $('#f-date'), slotsEl = $('#slots');
  let chosenSlot = '';
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0, 10);
  function buildSlots() {
    const times = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    slotsEl.innerHTML = times.map(h => `<button type="button" class="slot${h === chosenSlot ? ' on' : ''}" data-h="${h}">${h}</button>`).join('');
  }
  slotsEl.addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b) return;
    chosenSlot = b.dataset.h; $$('.slot', slotsEl).forEach(s => s.classList.toggle('on', s === b));
  });
  let via = 'wa';
  $$('button[type=submit]', form).forEach(b => b.addEventListener('click', () => { via = b.dataset.via; }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const name = (f.get('name') || '').trim(), phone = (f.get('phone') || '').trim(), service = f.get('service'),
      style = f.get('cut'), date = f.get('date'), msg = (f.get('msg') || '').trim();
    const err = $('#formError');
    if (!name || !phone || !service || !date || !chosenSlot) {
      err.textContent = t('form.err'); form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); return;
    }
    err.textContent = '';
    const niceDate = new Date(date + 'T12:00').toLocaleDateString(lang === 'ht' ? 'fr' : lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const body = [t('form.msgTitle'), '',
      `• ${t('form.lName')}: ${name}`, `• ${t('form.lPhone')}: ${phone}`, `• ${t('form.lService')}: ${service}`,
      style ? `• ${t('form.lStyle')}: ${style}` : '', `• ${t('form.lDate')}: ${niceDate}`, `• ${t('form.lTime')}: ${chosenSlot}`,
      msg ? `• ${t('form.lMsg')}: ${msg}` : ''].filter(Boolean).join('\n');
    const url = via === 'mail'
      ? `mailto:${EMAIL}?subject=${encodeURIComponent('JT Barber — ' + t('nav.booking') + ' — ' + name)}&body=${encodeURIComponent(body)}`
      : `https://wa.me/${PHONE}?text=${encodeURIComponent(body)}`;
    toast(t('form.ok'));
    setTimeout(() => { via === 'mail' ? (location.href = url) : window.open(url, '_blank', 'noopener'); }, 450);
  });
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* =========================================================
     Smooth scroll (Lenis) + nav
     ========================================================= */
  let lenis = null;
  if (ANIM && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(sel) {
    const el = typeof sel === 'string' ? $(sel) : sel; if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -70, duration: 1.4 }) : el.scrollIntoView({ behavior: 'smooth' });
  }
  $$('a[data-scroll]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (!id || id[0] !== '#') return;
    e.preventDefault(); document.body.classList.remove('menu-open'); lenis && lenis.start();
    id === '#top' ? (lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' })) : scrollToEl(id);
  }));
  $('[data-top]').addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 2 }) : scrollTo({ top: 0, behavior: 'smooth' }));
  $('.burger').addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open && ANIM) gsap.fromTo('.nav a', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .06, duration: .7, ease: 'power4.out', delay: .2 });
  });

  /* header: background + hide on scroll down */
  const header = $('.header'); let lastY = 0;
  function onScroll(y) {
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
  }
  lenis ? lenis.on('scroll', e => onScroll(e.scroll)) : addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  /* =========================================================
     Cursor + magnetic
     ========================================================= */
  if (fine && ANIM) {
    const cur = $('.cursor'), label = $('.cursor__label');
    const xTo = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), yTo = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('mouseover', e => {
      const look = e.target.closest('.look, .reel__frame');
      cur.classList.toggle('is-view', !!look);
      label.textContent = look ? t('styles.view') : '';
      cur.classList.toggle('is-hover', !look && !!e.target.closest('a, button, select, input, textarea, summary'));
    });
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .3); my((e.clientY - r.top - r.height / 2) * .4); });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });
  }

  /* =========================================================
     Scroll-scrubbed "about" text (word by word lights up)
     ========================================================= */
  let scrubST = null;
  function setupScrubText() {
    const el = $('.about__big'); if (!el) return;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w2">${w}</span>`).join(' ');
    if (!ANIM) { $$('.w2', el).forEach(s => s.style.opacity = 1); return; }
    scrubST && scrubST.kill();
    const words = $$('.w2', el);
    scrubST = ScrollTrigger.create({
      trigger: el, start: 'top 85%', end: 'bottom 45%', scrub: true,
      onUpdate: self => { const n = Math.round(self.progress * words.length); words.forEach((w, i) => { w.style.opacity = i < n ? 1 : .15; }); }
    });
  }

  /* =========================================================
     Init
     ========================================================= */
  $('#year').textContent = new Date().getFullYear();
  applyLang(lang, true);
  setupScrubText();

  // hero letters → individual chars
  $$('.hero .chars').forEach(el => { el.innerHTML = [...el.textContent].map(c => `<span class="char">${c === ' ' ? '&nbsp;' : c}</span>`).join(''); });

  if (!ANIM) {
    document.body.classList.remove('is-loading');
    $$('[data-count]').forEach(el => el.textContent = el.dataset.count);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual'; scrollTo(0, 0);
  lenis && lenis.stop();

  /* ---------- PRELOADER → HERO INTRO ---------- */
  gsap.set('.hero .char', { yPercent: 115, rotate: 8 });
  gsap.set('.hero__pill', { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(['.hero__meta', '.hero .fade-in', '.badge', '.header'], { opacity: 0, y: 30 });

  const counter = { v: 0 };
  const intro = gsap.timeline({ delay: .2 });
  intro
    .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { $('#loadCount').textContent = Math.round(counter.v); } })
    .to('.preloader__inner', { opacity: 0, y: -40, duration: .5, ease: 'power3.in' })
    .to('.preloader__panel--top', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '<.3')
    .to('.preloader__panel--bottom', { yPercent: 100, duration: 1, ease: 'expo.inOut' }, '<')
    .add(() => { document.body.classList.remove('is-loading'); $('.preloader').style.display = 'none'; lenis && lenis.start(); ScrollTrigger.refresh(); })
    .to('.hero .char', { yPercent: 0, rotate: 0, duration: 1.2, ease: 'expo.out', stagger: .035 }, '-=.55')
    .to('.hero__pill', { scaleX: 1, duration: 1.2, ease: 'expo.inOut' }, '<.3')
    .to(['.header', '.hero__meta', '.hero .fade-in', '.badge'], { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .08 }, '<.2');

  /* ---------- HERO on scroll ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__row:nth-child(1)', { xPercent: -12 }, 0)
    .to('.hero__row:nth-child(2)', { xPercent: 10 }, 0)
    .to('.hero__row:nth-child(3)', { xPercent: -6 }, 0)
    .to('.hero__pill img', { scale: 1.4 }, 0)
    .to('.hero__bottom', { opacity: 0, y: -60 }, 0);

  /* ---------- REEL: pinned expanding image ---------- */
  const mobile = innerWidth < 600;
  gsap.timeline({ scrollTrigger: { trigger: '.reel', start: 'top top', end: '+=140%', scrub: 1, pin: true, anticipatePin: 1 } })
    .fromTo('.reel__frame', { clipPath: mobile ? 'inset(25% 12% 25% 12% round 20px)' : 'inset(22% 26% 22% 26% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
    .to('.reel__frame img', { scale: 1, filter: 'grayscale(0.2) contrast(1.1) brightness(0.6)', ease: 'none' }, 0)
    .fromTo('.reel__text--a', { xPercent: 0 }, { xPercent: -40, ease: 'none' }, 0)
    .fromTo('.reel__text--b', { xPercent: 0 }, { xPercent: 40, ease: 'none' }, 0)
    .to('.reel__caption', { opacity: 1, y: -20, duration: .3 }, .7);

  /* ---------- MARQUEES (velocity reactive) ---------- */
  const loops = $$('.mq__track').map((track, i) => gsap.to(track, { xPercent: i ? 0 : -50, startAt: { xPercent: i ? -50 : 0 }, duration: 26, ease: 'none', repeat: -1 }));
  ScrollTrigger.create({
    trigger: '.marquees', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      const v = gsap.utils.clamp(-6, 6, self.getVelocity() / 250);
      loops.forEach(l => gsap.to(l, { timeScale: (self.direction) * (1 + Math.abs(v)), duration: .3, overwrite: true }));
    }
  });

  /* ---------- SERVICES: horizontal on desktop ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.services__track');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.services__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
  });
  mm.add('(max-width: 900px)', () => {
    $$('.svc').forEach(c => gsap.from(c, { y: 80, opacity: 0, rotate: 2, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 90%' } }));
  });

  /* ---------- SCISSORS cutting the line ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.cutline', start: 'top 90%', end: 'bottom 20%', scrub: .6 } })
    .fromTo('.scissors', { x: -70 }, { x: () => innerWidth + 10, ease: 'none' }, 0)
    .fromTo('.cutline__cut', { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);

  /* ---------- Titles: word rise ---------- */
  $$('.split').forEach(el => {
    gsap.from(el.querySelectorAll('.w > span'), { yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: .07,
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('.kicker').forEach(el => gsap.from(el, { opacity: 0, x: -30, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  $$('.fade-up').forEach(el => gsap.from(el, { opacity: 0, y: 50, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

  /* ---------- Lookbook reveal ---------- */
  gsap.set('.look', { clipPath: 'inset(100% 0% 0% 0% round 20px)' });
  ScrollTrigger.batch('.look', {
    start: 'top 92%',
    onEnter: batch => {
      gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.2, ease: 'expo.out', stagger: .08 });
      gsap.fromTo(batch.map(b => b.querySelector('.look__media')), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out', stagger: .08 });
    }
  });

  /* ---------- About ---------- */
  gsap.fromTo('.about__img img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.about__media', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.about__img', { clipPath: 'inset(0 0 100% 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.about__media', start: 'top 80%' } });
  gsap.from('.about__logo', { scale: 0, rotate: -180, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.about__media', start: 'top 60%' } });
  $$('[data-count]').forEach(el => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 2, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v), scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- Process line draw ---------- */
  const path = $('.steps__line path');
  if (path) {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 60%', scrub: true } });
  }
  gsap.from('.step', { y: 60, opacity: 0, duration: 1, stagger: .15, ease: 'expo.out', scrollTrigger: { trigger: '.steps', start: 'top 80%' } });

  /* ---------- Booking / contact ---------- */
  gsap.from('.cbtn', { y: 80, opacity: 0, rotate: 3, duration: 1, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.cbtns', start: 'top 88%' } });
  gsap.from('.slot', { scale: .6, opacity: 0, duration: .5, stagger: .03, ease: 'back.out(2)', scrollTrigger: { trigger: '.slots', start: 'top 90%' } });

  /* ---------- CTA + footer ---------- */
  gsap.from('.cta', { scale: .9, borderRadius: 80, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 85%' } });
  gsap.from('.cta__title em', { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
  gsap.from('.footer__big span', { yPercent: 100, opacity: 0, duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });
  gsap.from('.socials a', { scale: 0, duration: .8, stagger: .07, ease: 'back.out(2)', scrollTrigger: { trigger: '.socials', start: 'top 95%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
