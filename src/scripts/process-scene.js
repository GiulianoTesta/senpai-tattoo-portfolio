// Scena 3D del capitolo 4: un solo avambraccio, un solo disegno (ritratto anime) che evolve in sei fasi.
// Tutto è procedurale (geometrie e texture disegnate su canvas): nessun modello o immagine da scaricare.
import { ACESFilmicToneMapping, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, DoubleSide, Fog, Group, HemisphereLight, Matrix4, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, PCFShadowMap, PMREMGenerator, PerspectiveCamera, RepeatWrapping, SRGBColorSpace, Scene, SpotLight, TorusGeometry, TubeGeometry, Vector3, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const R = 3; // raggio dell'avambraccio
const S = 3.2; // lato dell'area del tatuaggio, in unità della scena
const PHI0 = 0.5; // inclinazione dell'area verso la camera
const TEX = 1024, K = TEX / 400; // il disegno è definito in coordinate 400×400, come l'SVG di riserva
const NS = 'http://www.w3.org/2000/svg';

const X = new Vector3(1, 0, 0);
const N0 = new Vector3(0, Math.cos(PHI0), Math.sin(PHI0)); // normale al centro del tatuaggio
const T0 = new Vector3(0, -Math.sin(PHI0), Math.cos(PHI0)); // "verso il basso" del disegno
const P0 = N0.clone().multiplyScalar(R);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const cnv = (w, h = w) => Object.assign(document.createElement('canvas'), { width: w, height: h });

/* il disegno: ritratto anime originale (ragazza con frangia a punte e petali di sakura), coordinate 400×400 */
const ell = (cx, cy, rx, ry) => `M${cx + rx} ${cy} A${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}`;
const BANGS = 'M136 200 L146 160 L158 186 L172 150 L186 182 L200 146 L214 182 L228 150 L242 186 L254 160 L266 200';
const JAW = 'C260 262 232 302 200 318 C168 302 140 262 137 214';
const HAIR = new Path2D('M132 338 C116 300 106 250 110 196 C114 120 140 52 204 50 C268 50 286 120 290 196 C294 250 286 300 270 338 C262 300 262 250 266 200 L254 160 L242 186 L228 150 L214 182 L200 146 L186 182 L172 150 L158 186 L146 160 L136 200 C138 250 140 300 132 338 Z');
const FACE = new Path2D(`${BANGS} L265 214 ${JAW} Z`);
const CLOTH = new Path2D('M96 392 C118 352 150 342 186 336 L214 336 C250 342 282 352 304 392 Z');
const RIBBON = new Path2D('M188 372 L200 382 L212 372 L214 392 L200 385 L186 392 Z');
const IRIS = [[166, 214], [234, 214]];
const PETALS = [
  'M330 90 C340 100 340 112 330 116 C320 112 320 100 330 90 Z',
  'M64 120 C74 110 86 110 90 120 C86 130 74 130 64 120 Z',
  'M350 244 C360 254 360 266 350 270 C340 266 340 254 350 244 Z',
  'M44 250 C54 240 66 240 70 250 C66 260 54 260 44 250 Z',
];
// [tracciato, spessore]: l'ordine è quello in cui l'ago li ripassa
const LINE_W = [
  ['M132 338 C116 300 106 250 110 196 C114 120 140 52 204 50 C268 50 286 120 290 196 C294 250 286 300 270 338', 3.4],
  [BANGS, 3.4],
  ['M136 200 C138 250 140 300 132 338', 3], ['M266 200 C262 250 262 300 270 338', 3],
  [`M137 214 C140 262 168 302 200 318 C232 302 260 262 265 214`, 3.2],
  ['M140 200 C152 186 178 184 194 198', 6.5], ['M206 198 C222 184 248 186 260 200', 6.5],
  [ell(166, 214, 15, 20), 3], [ell(234, 214, 15, 20), 3],
  ['M154 238 C162 241 172 241 180 237', 2.2], ['M220 237 C228 241 238 241 246 238', 2.2],
  ['M201 248 L197 258 L203 259', 2.2], ['M188 280 C196 286 206 286 214 280', 2.8],
  ['M184 312 L186 336', 3], ['M216 312 L214 336', 3],
  ['M186 336 C150 342 118 352 96 388', 3.2], ['M214 336 C250 342 282 352 304 388', 3.2],
  ['M150 346 L200 382 L250 346', 3], ['M188 372 L200 382 L212 372 L214 392 L200 385 L186 392 Z', 2.4],
  ['M150 258 L156 250 M158 260 L164 252 M166 261 L172 253', 1.8], ['M228 261 L234 253 M236 260 L242 252 M244 258 L250 250', 1.8],
  ['M170 72 C160 92 156 112 158 132', 2], ['M232 68 C246 88 252 108 250 130', 2], ['M122 230 C124 270 126 300 124 320', 1.8],
  ...PETALS.map((d) => [d, 2.2]),
];
const LINE_D = LINE_W.map(([d]) => d);
const GUIDE_D = [ell(200, 180, 82, 92), 'M200 40 L200 330', 'M118 212 L282 212', 'M100 360 C150 330 250 330 300 360'];

/* posizione della camera per fase: [posizione, punto guardato] relativi al centro del tatuaggio */
const at = (n, t, x) => P0.clone().addScaledVector(N0, n).addScaledVector(T0, t).addScaledVector(X, x);
const POSES = [
  [at(5.3, 0.6, 0), at(0.3, 0.05, 0)],
  [at(4.5, 2.5, -1.5), at(0, 0.1, 0)],
  [at(3.7, 1.6, 1.1), at(0, 0, 0)],
  [at(3.8, 2, -1.7), at(0, 0, 0)],
  [at(3.8, 1.4, 1.6), at(0, 0, 0)],
  [at(5, 3.5, -0.6), at(0, 0.2, 0)],
];
const FOLLOW = [0.12, 0, 0.9, 0.7, 0.85, 0]; // quanto la camera segue la punta dello strumento
const KEY = [120, 120, 130, 150, 130, 165];
const RIM = [20, 30, 35, 45, 40, 80];

export async function createScene(canvas, { reduce = false, onFail = () => {} } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setClearColor('#0d0b12');
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new Scene();
  scene.fog = new Fog('#0d0b12', 7, 16);
  const pmrem = new PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.18;

  const camera = new PerspectiveCamera(35, 1, 0.1, 40);
  camera.up.copy(T0).negate();
  const camPos = POSES[0][0].clone(), camLook = POSES[0][1].clone();
  camera.position.copy(camPos);

  /* luci: chiave calda con ombre morbide, controluce ciano del brand, ambiente tenue */
  scene.add(new HemisphereLight('#ffe9dc', '#1a1022', 0.35));
  const key = new SpotLight('#fff0e2', KEY[0], 0, 0.55, 0.85, 2);
  key.position.copy(at(6, -1.5, -3.5));
  key.target.position.copy(P0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 5;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 20;
  const rim = new SpotLight('#22d3ee', RIM[0], 0, 0.6, 1, 2);
  rim.position.copy(at(2.5, -5, 4.5));
  rim.target.position.copy(P0);
  scene.add(key, key.target, rim, rim.target);

  /* misura dei tracciati: serve per disegnarli progressivamente e per guidare matita e ago */
  const host = document.createElementNS(NS, 'svg');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  document.body.append(host);
  const strokes = (list) => {
    const out = list.map((d) => {
      const el = document.createElementNS(NS, 'path');
      el.setAttribute('d', d);
      host.append(el);
      return { el, p: new Path2D(d), len: el.getTotalLength() };
    });
    out.total = out.reduce((a, s) => a + s.len, 0);
    return out;
  };
  const lines = strokes(LINE_D);
  const sketch = strokes([...GUIDE_D, ...LINE_D]);
  const pointAlong = (ss, f) => {
    let l = clamp01(f) * ss.total;
    for (const s of ss) {
      if (l <= s.len) { const p = s.el.getPointAtLength(l); return { x: p.x, y: p.y, gap: l < 3 || s.len - l < 3 }; }
      l -= s.len;
    }
    const s = ss[ss.length - 1], p = s.el.getPointAtLength(s.len);
    return { x: p.x, y: p.y, gap: true };
  };
  const strokeAlong = (g, ss, f, style) => {
    let l = f * ss.total;
    ss.forEach((s, i) => {
      const d = Math.min(s.len, l);
      l -= s.len;
      if (d <= 0) return;
      style?.(g, i);
      g.setLineDash([d, s.len + 2]);
      g.stroke(s.p);
    });
    g.setLineDash([]);
  };

  /* superfici: punto sulla pelle o sul foglio per una coordinata del disegno */
  const skinPoint = (x, y, lift, out) => {
    const phi = PHI0 + (y / 400 - 0.5) * S / R, r = R + lift;
    return out.set((x / 400 - 0.5) * S, r * Math.cos(phi), r * Math.sin(phi));
  };
  const skinNormal = (y, out) => { const phi = PHI0 + (y / 400 - 0.5) * S / R; return out.set(0, Math.cos(phi), Math.sin(phi)); };
  const PAPER_H = 0.3;
  const paperPoint = (x, y, h, out) => out.copy(P0).addScaledVector(N0, h).addScaledVector(X, (x / 400 - 0.5) * S).addScaledVector(T0, (y / 400 - 0.5) * S);

  const grid = (nu, nv, fn) => {
    const g = new BufferGeometry(), n = (nu + 1) * (nv + 1);
    const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [], p = new Vector3();
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const k = j * (nu + 1) + i;
      fn(i / nu, j / nv, p);
      pos.set([p.x, p.y, p.z], k * 3);
      uv.set([i / nu, 1 - j / nv], k * 2);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    g.setIndex(idx);
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  };
  const canvasTex = (c, srgb = true) => {
    const t = new CanvasTexture(c);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = aniso;
    return t;
  };

  /* pelle: tono, pori e micro-pieghe generati su canvas, ripetibili senza cuciture */
  const skinC = cnv(1024), bumpC = cnv(1024);
  {
    const W = 1024, m = skinC.getContext('2d'), b = bumpC.getContext('2d');
    m.fillStyle = '#d6a083'; m.fillRect(0, 0, W, W);
    b.fillStyle = '#808080'; b.fillRect(0, 0, W, W);
    const wrap = (x, y, r, fn) => {
      for (const ox of [0, -W, W]) for (const oy of [0, -W, W]) {
        const cx = x + ox, cy = y + oy;
        if (cx > -r && cx < W + r && cy > -r && cy < W + r) fn(cx, cy);
      }
    };
    for (let i = 0; i < 160; i++) {
      const x = rnd() * W, y = rnd() * W, r = 40 + rnd() * 160, col = rnd() < 0.5 ? 'rgba(178,92,76,.10)' : 'rgba(242,200,176,.09)';
      wrap(x, y, r, (cx, cy) => {
        const gr = m.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        m.fillStyle = gr; m.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      });
    }
    b.lineWidth = 1.2;
    for (let i = 0; i < 900; i++) {
      const x = rnd() * W, y = rnd() * W, a = (rnd() < 0.5 ? 0.6 : 2.3) + rnd() * 0.5, l = 20 + rnd() * 60, al = 0.05 + rnd() * 0.08;
      wrap(x, y, l, (cx, cy) => {
        b.strokeStyle = `rgba(0,0,0,${al})`;
        b.beginPath(); b.moveTo(cx, cy); b.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); b.stroke();
      });
    }
    m.fillStyle = 'rgba(120,60,45,.16)'; b.fillStyle = 'rgba(0,0,0,.45)';
    for (let i = 0; i < 14000; i++) {
      const x = rnd() * W, y = rnd() * W, r = 0.6 + rnd() * 1.2;
      wrap(x, y, 3, (cx, cy) => { m.fillRect(cx, cy, r, r); b.fillRect(cx, cy, r * 1.2, r * 1.2); });
    }
  }
  const skinMap = canvasTex(skinC), bumpMap = canvasTex(bumpC, false);
  for (const t of [skinMap, bumpMap]) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(6, 3.5); }
  const skinMat = new MeshPhysicalMaterial({
    map: skinMap, bumpMap, bumpScale: 1.2, roughness: 0.55,
    sheen: 0.5, sheenColor: new Color('#ffcfb8'), sheenRoughness: 0.5,
    clearcoat: 0, clearcoatRoughness: 0.45,
  });
  const arm = new Mesh(grid(180, 110, (u, v, p) => {
    const phi = PHI0 + (v - 0.5) * 3.8;
    return p.set((u - 0.5) * 14, R * Math.cos(phi), R * Math.sin(phi));
  }), skinMat);
  arm.receiveShadow = true;
  scene.add(arm);

  /* inchiostro: una texture sola che contiene stencil, linee, ombre e colore della fase corrente */
  const inkC = cnv(TEX), ink = inkC.getContext('2d');
  const workC = cnv(TEX), work = workC.getContext('2d');
  const irrC = cnv(TEX / 4), irrG = irrC.getContext('2d'); // alone a bassa risoluzione: la sfocatura costa 16 volte meno
  const inkTex = canvasTex(inkC);
  const inkMat = new MeshPhysicalMaterial({
    map: inkTex, transparent: true, depthWrite: false, roughness: 0.45,
    clearcoat: 0, clearcoatRoughness: 0.3,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
  const decal = new Mesh(grid(64, 64, (u, v, p) => skinPoint(u * 400, v * 400, 0.003, p)), inkMat);
  decal.receiveShadow = true;
  scene.add(decal);

  // ombre black & grey pre-disegnate una volta, poi rivelate dall'ago (taglio netto, come nel cel shading anime)
  const shadeC = cnv(TEX);
  {
    const g = shadeC.getContext('2d');
    g.scale(K, K);
    const dark = (a) => `rgba(20,18,24,${a})`;
    // capelli: più scuri verso il basso, ciocche d'ombra
    g.save(); g.clip(HAIR);
    const hg = g.createLinearGradient(0, 50, 0, 340);
    hg.addColorStop(0, dark(0.08)); hg.addColorStop(1, dark(0.6));
    g.fillStyle = hg; g.fillRect(90, 40, 220, 310);
    g.fillStyle = dark(0.35);
    g.fill(new Path2D('M150 70 C140 100 150 130 160 150 L172 150 C160 120 158 96 170 72 Z M236 66 C252 96 252 126 242 152 L228 150 C240 124 240 96 228 68 Z'));
    g.restore();
    // viso: ombra netta sotto la frangia e sotto il mento
    g.save(); g.clip(FACE);
    g.fillStyle = dark(0.22); g.translate(0, 12); g.fill(HAIR); g.translate(0, -12);
    g.fillStyle = dark(0.2); g.fill(new Path2D('M137 214 C140 262 168 302 200 318 L200 330 L130 330 Z'));
    g.restore();
    g.fillStyle = dark(0.4); g.fill(new Path2D('M184 312 C192 322 208 322 216 312 L214 336 L186 336 Z'));
    // iridi: metà superiore scura
    IRIS.forEach(([x, y]) => {
      g.save(); g.clip(new Path2D(ell(x, y, 15, 20)));
      const ig = g.createLinearGradient(0, y - 20, 0, y + 20);
      ig.addColorStop(0, dark(0.75)); ig.addColorStop(0.55, dark(0.15)); ig.addColorStop(1, dark(0));
      g.fillStyle = ig; g.fillRect(x - 16, y - 21, 32, 42);
      g.fillStyle = dark(0.9); g.beginPath(); g.ellipse(x, y + 3, 6, 9, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    });
    // divisa: retino da manga che si infittisce verso il basso
    g.save(); g.clip(CLOTH);
    g.fillStyle = dark(0.55);
    for (let y = 340, row = 0; y < 396; y += 5, row++) for (let x = 96 + (row % 2) * 2.5; x < 306; x += 5) {
      g.beginPath(); g.arc(x, y, 0.4 + 1.6 * ((y - 340) / 56), 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  const SHADE_X = [96, 304]; // l'ago scorre da sinistra a destra su questa fascia

  // colore: capelli, occhi, divisa, dettagli
  const drawColor = (g, c) => {
    const a1 = seg(c, 0, 0.42), a2 = seg(c, 0.42, 0.6), a3 = seg(c, 0.6, 0.84), a4 = seg(c, 0.84, 1);
    const wipe = (a, x0, x1, path, col, al) => {
      if (a <= 0) return;
      g.save(); g.beginPath(); g.rect(0, 0, x0 + (x1 - x0) * a, 400); g.clip();
      g.globalAlpha = al; g.fillStyle = col; g.fill(path); g.restore();
    };
    wipe(a1, 108, 298, HAIR, '#d81f5a', 0.86);
    IRIS.forEach(([x, y], i) => {
      const a = seg(a2, i * 0.5, i * 0.5 + 0.5);
      if (a <= 0) return;
      const ring = new Path2D();
      ring.arc(x, y, 22, 0, Math.PI * 2);
      ring.arc(x, y, 22 * (1 - a), 0, Math.PI * 2, true);
      g.save(); g.clip(ring); g.globalAlpha = 0.9; g.fillStyle = '#17a6c8'; g.fill(new Path2D(ell(x, y, 15, 20))); g.restore();
    });
    wipe(a3, 96, 304, CLOTH, '#2552d4', 0.86);
    if (a4 > 0) {
      g.save(); g.globalAlpha = a4 * 0.9;
      g.fillStyle = '#e0263f'; g.fill(RIBBON);
      g.fillStyle = '#f28aa8'; PETALS.forEach((d) => g.fill(new Path2D(d)));
      g.globalAlpha = a4 * 0.35; g.fillStyle = '#ef6f8f';
      IRIS.forEach(([x]) => { g.beginPath(); g.ellipse(x, 254, 17, 7, 0, 0, Math.PI * 2); g.fill(); });
      g.restore();
    }
  };
  // riflessi bianchi negli occhi: ultimo tocco del colore, sopra le linee
  const drawSparkle = (g, a) => {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a * 0.95; g.fillStyle = '#fbf7f2';
    IRIS.forEach(([x, y]) => { g.beginPath(); g.arc(x - 6, y - 8, 5, 0, Math.PI * 2); g.arc(x + 6, y + 9, 2.2, 0, Math.PI * 2); g.fill(); });
    g.restore();
  };

  const drawInk = (s, t) => {
    const g = work;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, TEX, TEX);
    g.setTransform(K, 0, 0, K, 0, 0);
    g.lineCap = g.lineJoin = 'round';
    const heal = s === 5 ? ease(t) : 0;
    const lineF = s === 2 ? t : s > 2 ? 1 : 0;

    // stencil viola: appare dove il foglio si è già staccato, poi sbiadisce sotto l'inchiostro
    const stA = s === 1 ? 0.85 : s === 2 ? 0.85 * (1 - 0.65 * t) : s === 3 ? 0.3 * (1 - t) : 0;
    if (stA > 0) {
      g.save();
      if (s === 1) { g.beginPath(); g.rect(0, 0, 400 * clamp01(peelOf(t) * 1.35), 400); g.clip(); }
      g.globalAlpha = stA; g.strokeStyle = '#5d3fb0'; g.lineWidth = 1.3; g.filter = 'blur(1.2px)';
      lines.forEach((l) => g.stroke(l.p));
      g.restore();
    }
    // pelle appena lavorata: leggero alone rosato attorno alle linee, sparisce con la guarigione
    const irr = s === 2 ? Math.min(1, t * 1.5) : s === 3 || s === 4 ? 1 : s === 5 ? 1 - heal : 0;
    if (irr > 0 && lineF > 0) {
      const q = irrG;
      q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, TEX / 4, TEX / 4); q.filter = 'blur(3.5px)';
      q.setTransform(K / 4, 0, 0, K / 4, 0, 0); q.lineCap = 'round'; q.strokeStyle = '#c2413d'; q.lineWidth = 9;
      strokeAlong(q, lines, lineF);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 0.18 * irr; g.drawImage(irrC, 0, 0, TEX, TEX); g.restore();
    }
    if (s >= 4) drawColor(g, s === 4 ? t : 1);
    if (s >= 3) {
      const f = s === 3 ? t : 1;
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      g.beginPath(); g.rect(0, 0, TEX * (SHADE_X[0] + (SHADE_X[1] - SHADE_X[0]) * f) / 400, TEX); g.clip();
      g.drawImage(shadeC, 0, 0); g.restore();
    }
    if (lineF > 0) { g.strokeStyle = '#141217'; strokeAlong(g, lines, lineF, (gg, i) => (gg.lineWidth = LINE_W[i][1])); }
    if (s >= 4) drawSparkle(g, s === 4 ? seg(t, 0.9, 1) : 1);

    // guarigione: l'inchiostro si assesta sotto la pelle, bordi appena più morbidi e colori meno accesi
    ink.clearRect(0, 0, TEX, TEX);
    ink.filter = heal > 0 ? `blur(${(heal * 1.4).toFixed(2)}px) saturate(${(1 - heal * 0.18).toFixed(3)})` : 'none';
    ink.globalAlpha = 1 - heal * 0.08;
    ink.drawImage(workC, 0, 0);
    ink.filter = 'none'; ink.globalAlpha = 1;
    inkTex.needsUpdate = true;
  };

  /* foglio della bozza: si appoggia sull'avambraccio e si stacca lasciando lo stencil */
  const paperBaseC = cnv(TEX);
  {
    const g = paperBaseC.getContext('2d');
    g.fillStyle = '#f3eee4'; g.fillRect(0, 0, TEX, TEX);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * TEX, y = rnd() * TEX, a = rnd() * Math.PI, l = 4 + rnd() * 14;
      g.strokeStyle = `rgba(90,80,70,${0.03 + rnd() * 0.05})`; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const v = g.createRadialGradient(TEX / 2, TEX / 2, TEX * 0.3, TEX / 2, TEX / 2, TEX * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(80,60,40,.12)');
    g.fillStyle = v; g.fillRect(0, 0, TEX, TEX);
  }
  const paperC = cnv(TEX), paperG = paperC.getContext('2d');
  const paperTex = canvasTex(paperC);
  const drawPaper = (f) => {
    const g = paperG;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(paperBaseC, 0, 0);
    g.setTransform(K, 0, 0, K, 0, 0);
    g.lineCap = 'round';
    const style = (gg, i) => {
      const guide = i < GUIDE_D.length;
      gg.strokeStyle = guide ? 'rgba(70,70,82,.28)' : 'rgba(44,44,52,.78)';
      gg.lineWidth = guide ? 0.7 : 1.1;
    };
    strokeAlong(g, sketch, f, style);
    // seconda passata leggermente sfalsata: il tratto a matita non è mai unico
    g.globalAlpha = 0.35; g.translate(0.7, 0.4);
    strokeAlong(g, sketch, Math.max(0, f - 0.04), style);
    g.globalAlpha = 1;
    paperTex.needsUpdate = true;
  };

  let press = 0, peel = 0;
  const peelOf = (t) => seg(t, 0.35, 1);
  const flat = new Vector3(), wrapped = new Vector3(), nrm = new Vector3();
  const paperFn = (u, v, p) => {
    paperPoint(u * 400, v * 400, PAPER_H, flat);
    skinPoint(u * 400, v * 400, 0.012, wrapped);
    p.copy(flat).lerp(wrapped, press);
    const d = peel * 1.35 - u;
    if (d > 0) p.addScaledVector(skinNormal(v * 400, nrm), d * d * 2.2 + d * 0.12).addScaledVector(X, d * 0.55);
    return p;
  };
  const paperGeo = grid(40, 40, paperFn);
  const paperMat = new MeshStandardMaterial({ map: paperTex, roughness: 0.9, side: DoubleSide, transparent: true });
  const paper = new Mesh(paperGeo, paperMat);
  paper.castShadow = true; paper.receiveShadow = true;
  scene.add(paper);
  const reshapePaper = () => {
    const pos = paperGeo.attributes.position, p = new Vector3();
    for (let j = 0, k = 0; j <= 40; j++) for (let i = 0; i <= 40; i++, k++) { paperFn(i / 40, j / 40, p); pos.setXYZ(k, p.x, p.y, p.z); }
    pos.needsUpdate = true;
    paperGeo.computeVertexNormals();
  };

  /* strumenti: matita per la bozza, macchinetta per linee, ombre e colore */
  const std = (color, roughness, metalness = 0, extra = {}) => new MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const part = (geo, mat, y, rx = 0) => { const m = new Mesh(geo, mat); m.position.y = y; m.rotation.x = rx; m.castShadow = true; return m; };
  const pencil = new Group();
  pencil.add(
    part(new ConeGeometry(0.022, 0.065, 12), std('#2a2a30', 0.35, 0.5), 0.0325, Math.PI),
    part(new ConeGeometry(0.07, 0.22, 6), std('#d8b48c', 0.8), 0.11, Math.PI),
    part(new CylinderGeometry(0.07, 0.07, 2.4, 6), std('#1b1920', 0.45), 1.42),
    part(new CylinderGeometry(0.073, 0.073, 0.14, 24), std('#b8b2a8', 0.3, 1), 2.69),
    part(new CylinderGeometry(0.068, 0.068, 0.1, 24), std('#ff2e63', 0.7), 2.81),
  );
  // macchinetta a bobine classica: ago, punta, grip, tubo, telaio, due bobine di rame, armatura, molla e cavo
  const machine = new Group();
  machine.scale.setScalar(0.75); // proporzionata al tatuaggio (lato ~12 cm): la macchinetta intera resta in inquadratura
  const chrome = std('#d9d9de', 0.18, 1), frameMat = std('#c8264f', 0.42, 0.3), copper = std('#b8733d', 0.32, 1);
  const steel = std('#8f8e96', 0.3, 1), capMat = std('#141217', 0.4), brass = std('#c9a45c', 0.3, 1);
  const put = (geo, mat, x, y, z) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; machine.add(m); return m; };
  put(new CylinderGeometry(0.004, 0.006, 0.34, 8), chrome, 0, 0.17, 0);
  put(new CylinderGeometry(0.05, 0.028, 0.24, 32), chrome, 0, 0.44, 0);
  put(new CylinderGeometry(0.078, 0.078, 0.62, 32), std('#4a4950', 0.55, 0.8), 0, 0.87, 0);
  for (let y = 0.62; y < 1.14; y += 0.075) put(new TorusGeometry(0.08, 0.008, 6, 32), steel, 0, y, 0).rotation.x = Math.PI / 2;
  put(new CylinderGeometry(0.032, 0.032, 0.5, 24), chrome, 0, 1.42, 0);
  put(new BoxGeometry(0.13, 0.13, 0.16), frameMat, 0, 1.62, 0.03);
  put(new BoxGeometry(0.07, 0.06, 0.64), frameMat, 0, 1.66, 0.35);
  put(new BoxGeometry(0.07, 0.5, 0.07), frameMat, 0, 1.9, 0.64);
  put(new BoxGeometry(0.07, 0.06, 0.26), frameMat, 0, 2.3, 0.52);
  for (const z of [0.2, 0.43]) {
    put(new CylinderGeometry(0.085, 0.085, 0.32, 28), copper, 0, 1.86, z);
    put(new CylinderGeometry(0.096, 0.096, 0.025, 28), capMat, 0, 2.03, z);
    put(new CylinderGeometry(0.096, 0.096, 0.025, 28), capMat, 0, 1.7, z);
  }
  put(new BoxGeometry(0.06, 0.035, 0.6), steel, 0, 2.08, 0.3);
  put(new CylinderGeometry(0.012, 0.012, 0.42, 12), chrome, 0, 1.88, 0);
  put(new BoxGeometry(0.05, 0.012, 0.22), steel, 0, 2.11, 0.53);
  put(new CylinderGeometry(0.016, 0.016, 0.2, 12), brass, 0, 2.2, 0.44);
  const cord = new CatmullRomCurve3([new Vector3(0, 1.72, 0.68), new Vector3(0, 1.62, 1.0), new Vector3(0, 2.3, 1.5), new Vector3(0, 3.6, 1.7)]);
  put(new TubeGeometry(cord, 40, 0.02, 10), capMat, 0, 0, 0);
  const PARK = [at(2.8, -3, 4.6), at(2.6, -2.6, 5)];
  const tools = [
    { g: pencil, dir: new Vector3().addScaledVector(N0, 1).addScaledVector(T0, -0.4).addScaledVector(X, 0.45).normalize() },
    { g: machine, dir: new Vector3().addScaledVector(N0, 0.9).addScaledVector(T0, -0.6).addScaledVector(X, 0.8).normalize() },
  ];
  tools.forEach((tl, i) => {
    // asse dello strumento lungo dir, telaio della macchinetta rivolto verso destra/indietro per vederlo di profilo
    const side = new Vector3().addScaledVector(T0, -0.8).addScaledVector(X, -0.6);
    side.addScaledVector(tl.dir, -side.dot(tl.dir)).normalize();
    tl.g.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(new Vector3().crossVectors(tl.dir, side), tl.dir, side));
    tl.g.position.copy(PARK[i]); tl.g.visible = false; scene.add(tl.g);
  });

  // dove deve stare la punta dello strumento in ogni momento
  const toolGoal = (s, t) => {
    if (t >= 1) return null;
    if (s === 0) { const p = pointAlong(sketch, t); return { i: 0, ...p, paper: true }; }
    if (s === 2) { if (t > 0.9) return null; const p = pointAlong(lines, t / 0.9); return { i: 1, ...p }; }
    if (s === 3) return { i: 1, x: SHADE_X[0] + (SHADE_X[1] - SHADE_X[0]) * t, y: 60 + 330 * (0.5 + 0.5 * Math.sin(t * 70)) };
    if (s === 4) {
      if (t < 0.42) { const a = seg(t, 0, 0.42); return { i: 1, x: 108 + 190 * a, y: 60 + 270 * (0.5 + 0.5 * Math.sin(a * 50)) }; }
      if (t < 0.6) {
        const a = seg(t, 0.42, 0.6), e = IRIS[a < 0.5 ? 0 : 1], l = (a * 2) % 1, r = 18 * (1 - l) + 2, an = l * Math.PI * 8;
        return { i: 1, x: e[0] + r * Math.cos(an), y: e[1] + r * Math.sin(an) };
      }
      if (t < 0.84) { const a = seg(t, 0.6, 0.84); return { i: 1, x: 96 + 208 * a, y: 362 + 22 * Math.sin(a * 50) }; }
      const a = seg(t, 0.84, 1), spots = [[200, 382], [330, 104], [350, 258], [56, 250], [76, 120]], d = spots[Math.min(4, Math.floor(a * 5))];
      return { i: 1, x: d[0] + 4 * Math.cos(a * 80), y: d[1] + 4 * Math.sin(a * 80) };
    }
    return null;
  };

  /* qualità adattiva e ciclo di vita */
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const pointer = { x: 0, y: 0 };
  const onPointer = (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = clamp01((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = clamp01((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const fine = matchMedia('(pointer:fine)').matches && !reduce;
  if (fine) addEventListener('pointermove', onPointer, { passive: true });
  const onLost = (e) => { e.preventDefault(); onFail(); };
  canvas.addEventListener('webglcontextlost', onLost);

  let frames = 0, slow = 0, lowered = false;
  const lowerQuality = () => {
    lowered = true;
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
    scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    resize();
  };

  let lastS = -1, lastT = -1, lastPaper = -1, disposed = false;
  const goalPos = new Vector3(), goalLook = new Vector3(), tip = new Vector3(), tipN = new Vector3();
  const tipSeen = P0.clone();

  const render = (s, t, dt, time) => {
    if (disposed) return false;
    const k = (rate) => (reduce ? 1 : 1 - Math.exp(-dt * rate));

    if (s !== lastS || t !== lastT) {
      drawInk(s, t);
      const pf = s === 0 ? t : 1;
      if (pf !== lastPaper) { drawPaper(pf); lastPaper = pf; }
      // foglio: piatto nella bozza, poi appoggiato e staccato nello stencil
      const pPress = s === 1 ? ease(seg(t, 0, 0.32)) : 0, pPeel = s === 1 ? peelOf(t) : 0;
      if (pPress !== press || pPeel !== peel || s !== lastS) { press = pPress; peel = pPeel; reshapePaper(); }
      paper.visible = s === 0 || (s === 1 && t < 1);
      paperMat.opacity = s === 1 ? 1 - seg(peel, 0.7, 1) : 1;
      lastS = s; lastT = t;
    }

    // pelle lucida di crema durante il lavoro, opaca e naturale a guarigione completata
    const heal = s === 5 ? ease(t) : 0;
    const gloss = s >= 2 && s <= 4 ? 1 : s === 5 ? 1 - heal : 0;
    skinMat.clearcoat += (0.14 * gloss - skinMat.clearcoat) * k(3);
    inkMat.clearcoat += (0.4 * gloss - inkMat.clearcoat) * k(3);
    inkMat.roughness = 0.45 + 0.2 * heal;

    // strumenti
    const goal = toolGoal(s, t);
    tools.forEach((tl, i) => {
      const active = goal && goal.i === i;
      if (active) {
        if (goal.paper) { paperPoint(goal.x, goal.y, PAPER_H + 0.004, tip); tipN.copy(N0); }
        else { skinPoint(goal.x, goal.y, 0.004, tip); skinNormal(goal.y, tipN); }
        const lift = (goal.gap ? 0.06 : 0) + (i === 1 && !reduce ? 0.004 * Math.sin(time * 140) : 0);
        tip.addScaledVector(tipN, lift);
        tl.g.position.lerp(tip, k(goal.gap ? 10 : 22));
        tipSeen.lerp(tip, k(4));
      } else tl.g.position.lerp(PARK[i], k(3));
      tl.g.visible = !reduce && tl.g.position.distanceToSquared(PARK[i]) > 0.05;
    });

    // luci: nelle ombre la luce chiave scorre sul disegno, nella guarigione diventa più calda e piena
    const sweep = s === 3 ? Math.sin(ease(t) * Math.PI) : 0;
    key.position.copy(at(6, -1.5, -3.5 + 5 * sweep));
    key.intensity += (KEY[s] - key.intensity) * k(2);
    rim.intensity += (RIM[s] - rim.intensity) * k(2);
    key.color.lerp(_warm.set(s === 5 ? '#ffd9b8' : '#fff0e2'), k(2));

    // camera: segue la fase, un po' la punta dello strumento e il puntatore
    const [pos, look] = POSES[s];
    goalPos.copy(pos);
    if (!reduce) {
      goalPos.addScaledVector(X, pointer.x * 0.35).addScaledVector(T0, pointer.y * 0.25);
      if (s === 5) goalPos.addScaledVector(X, Math.sin(time * 0.25) * 0.9);
    }
    goalLook.copy(look).lerp(tipSeen, goal ? FOLLOW[s] : 0);
    camPos.lerp(goalPos, k(2.4));
    camLook.lerp(goalLook, k(3));
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    renderer.render(scene, camera);

    if (!lowered && !reduce && ++frames > 20) { slow = slow * 0.95 + (dt > 1 / 30 ? 0.05 : 0); if (frames > 90 && slow > 0.5) lowerQuality(); }
    return !reduce || camPos.distanceToSquared(goalPos) > 1e-6;
  };
  const _warm = new Color();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ro.disconnect();
    removeEventListener('pointermove', onPointer);
    canvas.removeEventListener('webglcontextlost', onLost);
    scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) for (const v of Object.values(o.material)) if (v?.isTexture) v.dispose();
      o.material?.dispose();
    });
    envRT.dispose();
    pmrem.dispose();
    renderer.dispose();
    host.remove();
  };

  render(0, reduce ? 1 : 0, 0, 0);
  return { render, dispose };
}
