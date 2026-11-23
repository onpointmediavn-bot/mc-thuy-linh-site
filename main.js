/* MC Thuỳ Linh — tương tác: màn nhung, menu, hiện dần khi cuộn, phóng to ảnh */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Màn nhung đầu trang mở khi ảnh chính tải xong (tối đa chờ 1,2 giây) */
  const hero = $('.hero');
  const heroImg = $('.hero-cut');
  let opened = false;
  const open = () => { if (!opened) { opened = true; requestAnimationFrame(() => hero.classList.add('is-open')); } };
  if (reduce) open();
  else {
    if (heroImg.complete) setTimeout(open, 150); else heroImg.addEventListener('load', () => setTimeout(open, 150), { once: true });
    setTimeout(open, 800);
  }

  /* 2. Thanh đầu trang: nền đặc khi cuộn + đánh dấu mục đang xem */
  const bar = $('#top-bar');
  const onScroll = () => bar.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const links = $$('.nav a[href^="#"]');
  const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(es => {
      es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => spy.observe(t));
  }

  /* 3. Menu điện thoại */
  const btn = $('.menu-btn'), nav = $('#nav');
  const setMenu = (on) => {
    btn.setAttribute('aria-expanded', on); nav.classList.toggle('is-open', on);
    $('.menu-txt', btn).textContent = on ? 'Đóng' : 'Menu';
  };
  btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); } });

  /* 4. Hiện dần khi cuộn tới + màn nhung mở ở đầu mỗi chương */
  const items = $$('.reveal, .reveal-curtain');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('is-in'));

  /* 5. Ảnh tách nền trôi nhẹ khi cuộn (chỉ máy tính) */
  if (!reduce && matchMedia('(min-width: 861px)').matches) {
    const cuts = $$('.pg-cut');
    let ticking = false;
    const drift = () => {
      const vh = innerHeight;
      cuts.forEach(c => {
        const r = c.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;         // -1 … 1
        c.style.translate = `0 ${(p * -22).toFixed(1)}px`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  }

  /* 6. Phóng to ảnh: theo từng chương trình, có nút trước/sau, phím mũi tên, vuốt */
  const lb = $('#lightbox'), img = document.createElement('img'), title = $('.lx-title', lb), count = $('.lx-count', lb);
  img.className = 'lx-img'; img.alt = '';
  let list = [], idx = 0, lastFocus = null;
  const show = (i) => {
    idx = (i + list.length) % list.length;
    const t = list[idx];
    img.removeAttribute('src');
    img.width = +t.dataset.w; img.height = +t.dataset.h;
    img.src = t.dataset.full; img.alt = t.dataset.alt || '';
    img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    count.textContent = `${idx + 1} / ${list.length}`;
    $('.lx-prev', lb).hidden = $('.lx-next', lb).hidden = list.length < 2;
    // tải trước ảnh kế tiếp
    const nx = list[(idx + 1) % list.length]; if (nx) { const p = new Image(); p.src = nx.dataset.full; }
  };
  const openLb = (el) => {
    const g = el.closest('[data-gallery]');
    list = g ? $$('[data-full]', g) : [el];
    title.textContent = g ? g.dataset.title : '';
    if (!img.parentNode) $('.lx-fig', lb).prepend(img);
    lastFocus = el; lb.hidden = false; document.body.classList.add('lx-open');
    show(list.indexOf(el)); $('.lx-close', lb).focus();
  };
  const closeLb = () => { lb.hidden = true; document.body.classList.remove('lx-open'); img.remove(); lastFocus && lastFocus.focus(); };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-full]');
    if (t && !lb.contains(t)) { e.preventDefault(); openLb(t); }
  });
  $('.lx-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lx-next', lb).addEventListener('click', () => show(idx + 1));
  $('.lx-close', lb).addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lx-fig')) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'Tab') {          // giữ con trỏ bàn phím trong hộp xem ảnh
      const f = $$('button:not([hidden])', lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });
})();
