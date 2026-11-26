/* NỀN DEMO 19 "Blue Curtain" — rèm nhung xanh chuyển động (chép nguyên shader + nhịp từ bộ 100 demo, core3.js) */
(function () {
  var cv = document.querySelector('.bgfx'); if (!cv) return;
  var R = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gl = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) { cv.classList.add('no-gl'); return; }
  var FRAG = 'precision mediump float;uniform float u_t,u_scroll,u_sec;uniform vec2 u_res,u_mouse;\n' +
    'float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}\n' +
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*ns(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}\n' +
    'void main(){vec2 uv=gl_FragCoord.xy/u_res;float t=u_t*.4;float x=uv.x*18.+sin(uv.y*3.+t+u_sec)*.8+fbm(vec2(uv.x*3.,t*.2))*1.5;\n' +
    'float fold=.5+.5*sin(x);vec3 col=mix(vec3(.02,.03,.1),vec3(.08,.14,.42),pow(fold,3.))+vec3(.4,.55,1.)*pow(fold,24.)*.15;col+=vec3(.91,.79,.55)*exp(-pow((uv.y-.98)*12.,2.))*.2;col*=.75+.25*uv.y;col*=1.-.35*length(uv-.5);gl_FragColor=vec4(col,1.);}';
  function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
  var v = sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'), f = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!v || !f) { cv.classList.add('no-gl'); return; }
  var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr); gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['u_t', 'u_res', 'u_mouse', 'u_scroll', 'u_sec'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
  var scale = 0.5;   // giống demo 19: MCX.shader(..., {scale: 0.5})
  function size() { var dpr = Math.min(devicePixelRatio || 1, 2) * scale; cv.width = Math.max(1, cv.clientWidth * dpr | 0); cv.height = Math.max(1, cv.clientHeight * dpr | 0); gl.viewport(0, 0, cv.width, cv.height); }
  size(); addEventListener('resize', size);
  /* chương đang xem → u_sec (0 = màn đầu), nếp rèm dịch pha khi sang chương mới */
  var chs = [].slice.call(document.querySelectorAll('[data-ch]')), sec = 0, secT = 0, scroll = 0;
  function upd() {
    var c = innerHeight * .5, val = 0; chs.forEach(function (e) { if (e.getBoundingClientRect().top < c) val = +e.dataset.ch; }); secT = val;
    var h = document.documentElement.scrollHeight - innerHeight; scroll = h > 0 ? scrollY / h : 0;
  }
  addEventListener('scroll', upd, { passive: true }); upd();
  function draw(t) {
    gl.uniform1f(U.u_t, t); gl.uniform2f(U.u_res, cv.width, cv.height); gl.uniform2f(U.u_mouse, .5, .5);
    gl.uniform1f(U.u_scroll, scroll); sec += (secT - sec) * .03; gl.uniform1f(U.u_sec, sec); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  if (R) { draw(6); return; }   // giảm chuyển động: vẽ một khung đứng yên
  var t0 = performance.now(), raf = 0, hiddenAt = 0;
  function frame(now) { draw((now - t0) / 1000); raf = document.hidden ? 0 : requestAnimationFrame(frame); }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = performance.now(); return; }
    if (hiddenAt) { t0 += performance.now() - hiddenAt; hiddenAt = 0; }
    if (!raf) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);
})();
/* MC Thuỳ Linh — tương tác: màn nhung, menu, hiện dần khi cuộn, phóng to ảnh */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Màn nhung đầu trang mở khi ảnh chính tải xong (tối đa chờ 1,2 giây) */
  const hero = $('.hero');
  const heroImg = $('.hero-cut, .hc-cut');
  let opened = false;
  const open = () => { if (!opened) { opened = true; requestAnimationFrame(() => hero.classList.add('is-open')); } };
  if (reduce || !heroImg) open();
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

  /* 7. Phương án B: nút "Xem thêm" mở danh sách chương trình còn lại */
  const expand = (more, on) => {
    const b = $('.more-btn', more); if (!b) return;
    more.classList.toggle('is-open', on); b.setAttribute('aria-expanded', on);
    const t = $('.more-txt', b);
    if (!b.dataset.label) b.dataset.label = t.textContent;
    t.textContent = on ? 'Thu gọn' : b.dataset.label;
  };
  $$('.more').forEach(m => $('.more-btn', m).addEventListener('click', () => {
    const on = !m.classList.contains('is-open'); expand(m, on);
    if (!on) m.scrollIntoView({ block: 'nearest' });
  }));
  // bấm tên chương trình ở mục lục (hoặc mở link có #) → tự mở phần "Xem thêm" chứa nó
  const openFor = (hash) => {
    const el = hash && hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
    const m = el && el.closest('.more');
    if (m && !m.classList.contains('is-open')) {
      expand(m, true);
      requestAnimationFrame(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
    }
  };
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#"]'); if (a) openFor(a.getAttribute('href')); });
  openFor(location.hash);
  window.__tl = 1;   // báo cho trang biết hiệu ứng đã chạy xong (không thì sau 4 giây trang tự hiện hết nội dung)
})();
