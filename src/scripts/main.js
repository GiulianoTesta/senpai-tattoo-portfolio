// Animazioni del sito: loader, HUD, scroll, cursore, linee cinetiche.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const pad = (v, n = 2) => String(Math.floor(v)).padStart(n, '0');
const pointer = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

/* loader: una volta per sessione, poi parte subito */
const loader = $('#loader');
const done = () => { loader.classList.add('out'); document.body.classList.add('ready'); setTimeout(() => loader.remove(), 1000); };
let seen = false;
try { seen = sessionStorage.getItem('senpai-seen') === '1'; sessionStorage.setItem('senpai-seen', '1'); } catch {}
if (reduce || seen) done();
else {
  let n = 0;
  const step = () => { n = Math.min(100, n + Math.ceil(Math.random() * 9)); $('#ld').textContent = pad(n, 3); n < 100 ? setTimeout(step, 35) : done(); };
  step();
}

/* manifesto parola per parola */
const mf = $('#manifesto');
const words = $$('#manifesto .w');
const manifesto = () => {
  const r = mf.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
  words.forEach((w, i) => w.classList.toggle('on', reduce || i < p * words.length + 0.5));
};

/* il processo (capitolo 4) ha il suo script: src/scripts/process.js */

/* capitolo corrente: fumetto in alto + vignette in basso che si riempiono */
const chapters = $$('[data-ch]');
const koma = $$('.koma');
const bubble = $('#bubble');
let lastCh = 0;
const chapterScroll = () => {
  let cur = 0;
  chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * 0.5) cur = i; });
  const r = chapters[cur].getBoundingClientRect();
  const fill = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / r.height));
  koma.forEach((k, i) => {
    k.classList.toggle('done', i < cur);
    k.classList.toggle('now', i === cur);
    k.style.setProperty('--fill', i === cur ? fill : '');
    if (i === cur) k.setAttribute('aria-current', 'true'); else k.removeAttribute('aria-current');
  });
  if (cur !== lastCh) {
    lastCh = cur;
    $('#bubbleJp').textContent = koma[cur].dataset.jp;
    $('#bubbleTitle').textContent = koma[cur].dataset.title;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }
};

const onScroll = () => {
  chapterScroll();
  manifesto();
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* reveal solo per ciò che parte fuori schermo */
if (!reduce) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove('hide'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('hide'); io.observe(el); } });
}

/* cursore + anteprima stili */
const cursor = $('#cursor'), peek = $('#peek');
$$('a,.card,.styles li,.panel,.ch').forEach((el) => {
  el.addEventListener('pointerenter', () => cursor.classList.add('hot'));
  el.addEventListener('pointerleave', () => cursor.classList.remove('hot'));
});
$$('#styles li').forEach((li) => {
  if (li.dataset.img && matchMedia('(pointer:fine)').matches) new Image().src = li.dataset.img; // precarica: niente scatto al primo hover
  li.addEventListener('pointerenter', () => { $('#peekG').textContent = li.dataset.g; const pi = $('#peekI'); pi.hidden = !li.dataset.img; if (li.dataset.img) pi.src = li.dataset.img; peek.style.setProperty('--pk', getComputedStyle(li).getPropertyValue('--k')); peek.classList.add('on'); });
  li.addEventListener('pointerleave', () => peek.classList.remove('on'));
});
if (matchMedia('(pointer:fine)').matches) {
  let cx = pointer.x, cy = pointer.y, px = cx, py = cy;
  (function follow() {
    cx += (pointer.x - cx) * 0.25; cy += (pointer.y - cy) * 0.25;
    px += (pointer.x - px) * 0.12; py += (pointer.y - py) * 0.12;
    cursor.style.transform = `translate(${cx}px,${cy}px)`;
    peek.style.left = `${px + 90}px`; peek.style.top = `${py}px`;
    requestAnimationFrame(follow);
  })();
}

/* linee cinetiche manga colorate nel hero, a ~12fps come l'animazione giapponese */
if (!reduce) {
  const cv = $('#speed'), ctx = cv.getContext('2d');
  const palette = ['#ff2e63', '#ffd23f', '#22d3ee', '#a3e635', '#ff7a1a', '#fff6ec'];
  let W, H, lastT = 0, visible = true;
  const size = () => { const d = Math.min(devicePixelRatio, 2); W = cv.width = cv.offsetWidth * d; H = cv.height = cv.offsetHeight * d; };
  size(); addEventListener('resize', size);
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe($('#hero'));
  (function speed(t) {
    requestAnimationFrame(speed);
    if (!visible || t - lastT < 83) return;
    lastT = t;
    ctx.clearRect(0, 0, W, H);
    const ox = W * 0.5 + (pointer.x / innerWidth - 0.5) * W * 0.12, oy = H * 0.45, R = Math.hypot(W, H);
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2, w = Math.random() * 0.012 + 0.002, r0 = R * (0.22 + Math.random() * 0.18);
      ctx.fillStyle = palette[i % palette.length];
      ctx.beginPath();
      ctx.moveTo(ox + Math.cos(a) * r0, oy + Math.sin(a) * r0);
      ctx.lineTo(ox + Math.cos(a - w) * R, oy + Math.sin(a - w) * R);
      ctx.lineTo(ox + Math.cos(a + w) * R, oy + Math.sin(a + w) * R);
      ctx.fill();
    }
  })(0);
}
