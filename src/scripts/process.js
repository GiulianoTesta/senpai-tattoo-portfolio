// Capitolo 4 "Dal foglio alla pelle": stato delle sei fasi, navigazione, riproduzione automatica.
// La scena 3D (three.js) si carica solo quando la sezione si avvicina; senza WebGL resta l'SVG.
const sec = document.getElementById('process');

if (sec) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), gl = $('gl'), note = $('note'), lbl = $('lbl'), pbar = $('pbar');
  const playBtn = $('play'), playTxt = $('playTxt');
  const btns = [...sec.querySelectorAll('#layers button')];
  const names = btns.map((b) => b.querySelector('.ln').textContent);
  const N = btns.length;
  const DUR = [3.2, 2.6, 4.2, 3, 3.6, 3]; // secondi di animazione per fase
  const HOLD = 1.1; // pausa sul risultato prima della fase successiva

  let step = 0, t = reduce ? 1 : 0, held = 0, playing = false, visible = false, scene = null, raf = 0, last = 0;

  /* SVG di riserva: stessi strati di prima, guidati dalla fase invece che dallo scroll */
  const L = [0, 1, 2, 3, 4, 5].map((i) => $('L' + i));
  const draws = [...sec.querySelectorAll('#L2 > *')];
  const svgState = () => {
    draws.forEach((e) => e.style.setProperty('--p', step > 2 ? 1 : step === 2 ? t : 0));
    L[0].style.opacity = step <= 2 ? 1 : 0;
    L[1].style.opacity = step >= 1 && step <= 2 ? 1 : 0;
    [3, 4, 5].forEach((k) => (L[k].style.opacity = step >= k ? 1 : 0));
    $('art').style.filter = step >= 5 ? 'saturate(.85) contrast(.95)' : 'none';
  };

  const ui = () => {
    btns.forEach((b, i) => {
      b.classList.toggle('on', i <= step);
      if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    note.textContent = btns[step].dataset.note;
    lbl.textContent = `Fase ${String(step + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`;
    gl.setAttribute('aria-label', `Fase ${step + 1} di ${N}, ${names[step]}: ${btns[step].dataset.note}`);
  };

  const setPlaying = (on) => {
    playing = on && !reduce;
    playBtn.setAttribute('aria-pressed', String(playing));
    playTxt.textContent = playing ? 'Pausa' : 'Riproduci';
    wake();
  };

  const go = (k) => {
    step = (k + N) % N; t = reduce ? 1 : 0; held = 0;
    ui(); svgState(); wake();
  };
  const userGo = (k) => { setPlaying(false); go(k); };

  btns.forEach((b, i) => b.addEventListener('click', () => userGo(i)));
  $('prev').addEventListener('click', () => userGo(step - 1));
  $('next').addEventListener('click', () => userGo(step + 1));
  playBtn.addEventListener('click', () => {
    if (!playing && step === N - 1 && t >= 1) go(0);
    setPlaying(!playing);
  });
  sec.querySelector('.side').addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d || !e.target.closest('#layers')) return;
    e.preventDefault(); userGo(step + d); btns[step].focus();
  });

  /* ciclo di animazione: gira solo con la sezione visibile e finché c'è qualcosa che si muove */
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (t < 1) t = Math.min(1, t + dt / DUR[step]);
    else if (playing && (held += dt) > (step === N - 1 ? HOLD * 2 : HOLD)) go(step + 1);
    pbar.style.transform = `scaleX(${t})`;
    if (step === 2) svgState();
    const moving = scene ? scene.render(step, t, dt, now / 1000) : false;
    if (visible && (t < 1 || playing || moving)) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  function wake() { if (visible && !raf) raf = requestAnimationFrame(frame); }

  const fallback = () => { stage.classList.remove('gl'); scene?.dispose(); scene = null; };
  const hasWebGL = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
  const weak = (navigator.hardwareConcurrency || 4) <= 2 || (navigator.deviceMemory || 4) <= 1;

  let loading = false;
  const load = () => {
    if (loading || weak || !hasWebGL()) return;
    loading = true;
    import('./process-scene.js')
      .then((m) => m.createScene(gl, { reduce, onFail: fallback }))
      .then((s) => { scene = s; stage.classList.add('gl'); wake(); })
      .catch((err) => { console.warn('Scena 3D non disponibile, resta il disegno 2D.', err); fallback(); });
  };

  new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '600px 0px' }).observe(sec);
  let started = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !started) { started = true; go(0); setPlaying(!reduce); }
    wake();
  }, { threshold: 0.25 }).observe(stage);

  addEventListener('pagehide', (e) => { if (!e.persisted) scene?.dispose(); });

  ui(); svgState();
}
