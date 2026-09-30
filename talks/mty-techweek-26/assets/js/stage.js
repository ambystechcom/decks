// The particle stage: one WebGL layer behind every slide, drawn with Three.js.
//
// The talk's thesis is that an agent never sees your interface; it reads your tools. The stage
// shows that literally: on the cover the particles draw a web page and then re-form as a tool
// signature. After that it stays quiet (a dim drift) except on the slides that ask for a scene
// with `data-stage` on their <section>:
//
//   cover   a screen (fuchsia: what people see) dissolves into apartar_asientos(...) (cyan: what
//           the agent reads)
//   swarm   every particle awake, for "10,000 M agents"
//   read    a cyan beam sweeping the tool definition, the agent reading it
//   split   version A as noise, version B as an ordered grid (`split-dim` behind content)
//   orbit   a ring around the QR code on the closing slide
//
// Particles live in slide space (1280×720) and are mapped onto Reveal's scaled slide box, so
// they line up with the DOM at any window size. Under reduced motion and in the PDF export
// every scene is drawn once, settled: the finished picture, no animation.
(() => {
  'use strict';
  if (!window.THREE || !window.Reveal) return;

  const still =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.body.classList.contains('exporting');

  const W = 1280, H = 720, N = 3400;
  const C = {
    fuchsia: [0.933, 0.067, 0.6],
    orchid:  [0.6, 0.196, 0.8],
    blue:    [0.235, 0.412, 0.906],
    cyan:    [0.0, 0.8, 1.0],
    bad:     [0.79, 0.376, 0.431],
    fg:      [0.91, 0.918, 0.94],
  };
  const DRIFT = [C.orchid, C.blue, C.fuchsia, C.cyan];

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: still });
  } catch (e) {
    return; // no WebGL: the CSS background stays, nothing else changes
  }
  const canvas = renderer.domElement;
  canvas.id = 'stage';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(canvas, document.body.firstChild);
  renderer.setClearColor(0x000000, 0);

  // ---------- particle state ----------
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const size = new Float32Array(N), alpha = new Float32Array(N);
  const tx = new Float32Array(N), ty = new Float32Array(N), tc = new Float32Array(N * 3);
  const ts = new Float32Array(N), ta = new Float32Array(N);
  const wander = new Float32Array(N), delay = new Float32Array(N);
  const seedA = new Float32Array(N), seedB = new Float32Array(N);
  const homeX = new Float32Array(N), homeY = new Float32Array(N);
  const rnd = (a, b) => a + Math.random() * (b - a);

  for (let i = 0; i < N; i++) {
    seedA[i] = Math.random();
    seedB[i] = Math.random();
    homeX[i] = rnd(-40, W + 40);
    homeY[i] = rnd(-40, H + 40);
    pos[i * 3] = homeX[i];
    pos[i * 3 + 1] = homeY[i];
    size[i] = 2;
  }

  const geo = new THREE.BufferGeometry();
  const attr = (name, arr, n) => {
    const a = new THREE.BufferAttribute(arr, n);
    a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute(name, a);
    return a;
  };
  const aPos = attr('position', pos, 3), aCol = attr('aColor', col, 3);
  const aSize = attr('aSize', size, 1), aAlpha = attr('aAlpha', alpha, 1);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRect: { value: new THREE.Vector3(0, 0, 1) },
      uView: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      uniform vec3 uRect;   // slide box: left, top (CSS px), scale
      uniform vec2 uView;   // viewport, CSS px
      uniform float uDpr;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 s = uRect.xy + position.xy * uRect.z;
        gl_Position = vec4(s.x / uView.x * 2.0 - 1.0, 1.0 - s.y / uView.y * 2.0, 0.0, 1.0);
        gl_PointSize = aSize * uRect.z * uDpr;
        vColor = aColor;
        vAlpha = aAlpha;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(points);
  const camera = new THREE.Camera(); // the vertex shader does its own projection

  // ---------- shapes ----------
  const outline = (x, y, w, h, n) => {
    const out = [], per = 2 * (w + h);
    for (let k = 0; k < n; k++) {
      const d = (k / n) * per;
      if (d < w) out.push([x + d, y]);
      else if (d < w + h) out.push([x + w, y + d - w]);
      else if (d < 2 * w + h) out.push([x + w - (d - w - h), y + h]);
      else out.push([x, y + h - (d - 2 * w - h)]);
    }
    return out;
  };
  const fill = (x, y, w, h, n) => Array.from({ length: n }, () => [rnd(x, x + w), rnd(y, y + h)]);
  const disc = (cx, cy, r, n) => Array.from({ length: n }, () => {
    const a = rnd(0, Math.PI * 2), q = Math.sqrt(Math.random()) * r;
    return [cx + Math.cos(a) * q, cy + Math.sin(a) * q];
  });

  // Rasterise text on a 2D canvas and sample its lit pixels.
  const sampleText = (lines, font, x, y, lh, n) => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.font = font;
    g.textBaseline = 'top';
    lines.forEach((l, k) => g.fillText(l, x, y + k * lh));
    const data = g.getImageData(0, 0, W, H).data, hits = [];
    for (let py = 0; py < H; py += 2) {
      for (let px = 0; px < W; px += 2) if (data[(py * W + px) * 4 + 3] > 140) hits.push([px, py]);
    }
    for (let k = hits.length - 1; k > 0; k--) {
      const j = (Math.random() * (k + 1)) | 0;
      [hits[k], hits[j]] = [hits[j], hits[k]];
    }
    return Array.from({ length: n }, (_, k) => {
      const p = hits[k % Math.max(1, hits.length)] || [x, y];
      return k < hits.length ? p : [p[0] + rnd(-1, 1), p[1] + rnd(-1, 1)];
    });
  };

  // The web page on the cover: what people see.
  const screenGroups = () => [
    { pts: outline(760, 150, 440, 400, 520), c: C.fuchsia, a: 1, s: 2.4 },
    { pts: fill(760, 185, 440, 1.5, 150), c: C.orchid, a: 0.7, s: 1.8 },
    { pts: disc(782, 168, 5, 30), c: C.fuchsia, a: 0.9, s: 2 },
    { pts: disc(800, 168, 5, 30), c: C.orchid, a: 0.9, s: 2 },
    { pts: disc(818, 168, 5, 30), c: C.blue, a: 0.9, s: 2 },
    { pts: fill(1010, 203, 170, 5, 60), c: C.fg, a: 0.35, s: 1.8 },
    { pts: fill(780, 225, 400, 150, 520), c: C.orchid, a: 0.45, s: 2.4 },
    { pts: fill(780, 395, 300, 18, 170), c: C.fg, a: 0.8, s: 2.2 },
    { pts: fill(780, 423, 220, 18, 130), c: C.fg, a: 0.8, s: 2.2 },
    { pts: fill(780, 458, 380, 5, 70), c: C.fg, a: 0.5, s: 1.8 },
    { pts: fill(780, 474, 350, 5, 70), c: C.fg, a: 0.5, s: 1.8 },
    { pts: fill(780, 490, 290, 5, 60), c: C.fg, a: 0.5, s: 1.8 },
    { pts: fill(780, 512, 140, 26, 220), c: C.fuchsia, a: 0.9, s: 2.2 },
  ];

  // The same particles as the agent sees the business: one tool, as text.
  let signature = null;
  const signaturePts = () => signature || (signature = sampleText(
    ['apartar_asientos(', '  asientos_ids,', '  clave_idempotencia', ')'],
    '700 40px Consolas, "Cascadia Mono", monospace', 760, 196, 62, 2900,
  ));

  // ---------- assigning targets ----------
  const set = (i, x, y, c, a, s, w = 0) => {
    tx[i] = x; ty[i] = y;
    tc[i * 3] = c[0]; tc[i * 3 + 1] = c[1]; tc[i * 3 + 2] = c[2];
    ta[i] = a; ts[i] = s; wander[i] = w;
  };
  const drift = (i, a = 0.16) => set(i, homeX[i], homeY[i], DRIFT[i % 4], a, 1.6 + seedA[i] * 1.6, 1);
  const assign = (groups, from = 0) => {
    let i = from;
    for (const g of groups) for (const [x, y] of g.pts) if (i < N) set(i++, x, y, g.c, g.a, g.s);
    for (; i < N; i++) drift(i, 0.1);
  };
  const stagger = (max) => { for (let i = 0; i < N; i++) delay[i] = still ? 0 : Math.random() * max; };

  // ---------- scenes ----------
  let current = null, sceneStart = 0, rate = 2.4, wanderAmp = 26, wanderSpeed = 0.12;
  let tick = null;
  const timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));

  // A DOM element's box in slide space.
  const boxOf = (el) => {
    const s = slidesBox(), r = el.getBoundingClientRect();
    return { x: (r.left - s.left) / s.scale, y: (r.top - s.top) / s.scale, w: r.width / s.scale, h: r.height / s.scale };
  };

  const scenes = {
    drift() {
      rate = 1.2; wanderAmp = 26; wanderSpeed = 0.12;
      for (let i = 0; i < N; i++) drift(i);
      stagger(0.8);
    },

    cover() {
      rate = 2.2; wanderAmp = 18; wanderSpeed = 0.1;
      const toText = () => {
        rate = 2.6;
        const pts = signaturePts();
        assign([{ pts, c: C.cyan, a: 1, s: 2.7 }]);
        stagger(1.1);
        sceneStart = now();
      };
      if (still) return toText();
      assign(screenGroups());
      stagger(0.6);
      later(3600, toText);
    },

    swarm() {
      rate = 1.6; wanderAmp = 70; wanderSpeed = 0.35;
      for (let i = 0; i < N; i++) {
        const c = [C.cyan, C.fuchsia, C.orchid, C.blue][i % 4];
        set(i, homeX[i], homeY[i], c, 0.45 + seedB[i] * 0.5, 1.8 + seedA[i] * 2.6, 1);
      }
      stagger(1.2);
    },

    read(slide) {
      rate = 7; wanderAmp = 26; wanderSpeed = 0.12;
      const target = slide.querySelector('.anatomy');
      const BEAM = 900;
      for (let i = BEAM; i < N; i++) drift(i, 0.1);
      tick = (t) => {
        if (!target) return;
        const b = boxOf(target);
        if (still) {
          // settled: the beam has read the whole line and rests as an underline beneath it
          for (let i = 0; i < BEAM; i++) set(i, b.x + seedA[i] * b.w, b.y + b.h + 3 + seedB[i] * 4, C.cyan, 0.7, 2);
          return;
        }
        const x = b.x + Math.min(1, (t * 0.32) % 1.35) * b.w;
        for (let i = 0; i < BEAM; i++) {
          const tail = seedA[i] * seedA[i];
          set(i, x - tail * 90 + (seedB[i] - 0.5) * 6, b.y - 10 + ((seedB[i] * 7.3) % 1) * (b.h + 20), C.cyan, 0.95 - tail * 0.8, 2.6 - tail);
        }
      };
      stagger(0.4);
    },

    split(slide, dim) {
      rate = 1.8; wanderAmp = 0; wanderSpeed = 0.12;
      const A = 900, B = 900, a = dim ? 0.22 : 0.62;
      const noise = disc(300, 385, 190, A);
      for (let i = 0; i < A; i++) set(i, noise[i][0], noise[i][1], C.bad, a * (0.5 + seedA[i] * 0.5), 1.8 + seedB[i] * 1.8, 2.2);
      for (let i = 0; i < B; i++) {
        const gx = i % 30, gy = (i / 30) | 0;
        set(A + i, 830 + gx * 10.4, 230 + gy * 10.4, C.cyan, a, 2.1);
      }
      for (let i = A + B; i < N; i++) drift(i, 0.08);
      stagger(0.9);
    },

    orbit(slide) {
      rate = 5; wanderAmp = 22; wanderSpeed = 0.1;
      const qr = slide.querySelector('img.qr');
      const RING = 1100;
      for (let i = RING; i < N; i++) drift(i, 0.12);
      tick = (t) => {
        if (!qr) return;
        const b = boxOf(qr);
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2, r = Math.max(b.w, b.h) * 0.74;
        for (let i = 0; i < RING; i++) {
          const ang = seedA[i] * Math.PI * 2 + (still ? 0 : t * 0.22);
          const rr = r + (seedB[i] - 0.5) * 34;
          const m = (Math.sin(ang) + 1) / 2;
          const c = [C.fuchsia[0] * (1 - m) + C.cyan[0] * m, C.fuchsia[1] * (1 - m) + C.cyan[1] * m, C.fuchsia[2] * (1 - m) + C.cyan[2] * m];
          set(i, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, c, 0.35 + (1 - Math.abs(seedB[i] - 0.5) * 2) * 0.55, 2);
        }
      };
      stagger(0.8);
    },
  };

  const enter = (slide) => {
    if (!slide) return;
    timers.splice(0).forEach(clearTimeout);
    tick = null;
    const name = slide.dataset.stage || 'drift';
    current = name;
    sceneStart = now();
    if (name === 'split-dim') scenes.split(slide, true);
    else (scenes[name] || scenes.drift)(slide);
    countUp(slide);
    if (still) settle();
  };

  // ---------- frame ----------
  const now = () => performance.now() / 1000;
  const slidesEl = document.querySelector('.reveal .slides');
  const slidesBox = () => {
    const r = slidesEl.getBoundingClientRect();
    return { left: r.left, top: r.top, scale: r.width / W || 1 };
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mat.uniforms.uView.value.set(window.innerWidth, window.innerHeight);
    mat.uniforms.uDpr.value = dpr;
  };

  const target = (i, t) => {
    if (!wander[i]) return [tx[i], ty[i]];
    const amp = wanderAmp * wander[i], sp = wanderSpeed;
    return [
      tx[i] + Math.sin(t * sp * (0.7 + seedA[i]) + seedB[i] * 40) * amp,
      ty[i] + Math.cos(t * sp * (0.6 + seedB[i]) + seedA[i] * 23) * amp * 0.8,
    ];
  };

  const upload = () => {
    const s = slidesBox();
    mat.uniforms.uRect.value.set(s.left, s.top, s.scale);
    aPos.needsUpdate = aCol.needsUpdate = aSize.needsUpdate = aAlpha.needsUpdate = true;
    renderer.render(scene, camera);
  };

  // Settled frame, for the PDF and reduced motion.
  const settle = () => {
    if (tick) tick(0);
    for (let i = 0; i < N; i++) {
      const [gx, gy] = target(i, 0);
      pos[i * 3] = gx; pos[i * 3 + 1] = gy;
      col[i * 3] = tc[i * 3]; col[i * 3 + 1] = tc[i * 3 + 1]; col[i * 3 + 2] = tc[i * 3 + 2];
      alpha[i] = ta[i]; size[i] = ts[i];
    }
    upload();
  };

  let last = now();
  const frame = () => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = now(), dt = Math.min(0.05, t - last);
    last = t;
    if (tick) tick(t);
    const k = 1 - Math.exp(-rate * dt), kc = 1 - Math.exp(-2.4 * dt);
    const since = t - sceneStart;
    for (let i = 0; i < N; i++) {
      if (since < delay[i]) continue;
      const [gx, gy] = target(i, t);
      pos[i * 3] += (gx - pos[i * 3]) * k;
      pos[i * 3 + 1] += (gy - pos[i * 3 + 1]) * k;
      col[i * 3] += (tc[i * 3] - col[i * 3]) * kc;
      col[i * 3 + 1] += (tc[i * 3 + 1] - col[i * 3 + 1]) * kc;
      col[i * 3 + 2] += (tc[i * 3 + 2] - col[i * 3 + 2]) * kc;
      alpha[i] += (ta[i] - alpha[i]) * kc;
      size[i] += (ts[i] - size[i]) * kc;
    }
    upload();
  };

  // ---------- slide details the stage also owns ----------

  // "10,000 M" counts up when its slide arrives.
  function countUp(slide) {
    const v = slide.querySelector('[data-count] .v, .scale .stat .v') ||
      (slide.classList.contains('scale') ? slide.querySelector('.stat .v') : null);
    if (!v) return;
    const final = v.dataset.final || (v.dataset.final = v.textContent);
    const m = final.match(/^([\d,]+)(.*)$/);
    if (!m || still) { v.textContent = final; return; }
    const goal = Number(m[1].replace(/,/g, '')), t0 = performance.now();
    const step = (tNow) => {
      const p = Math.min(1, (tNow - t0) / 1800), e = 1 - Math.pow(1 - p, 3);
      if (p < 1 && slide.classList.contains('present')) {
        v.textContent = Math.round(goal * e).toLocaleString('en-US') + m[2];
        requestAnimationFrame(step);
      } else v.textContent = final;
    };
    requestAnimationFrame(step);
  }


  // ---------- go ----------
  resize();
  window.addEventListener('resize', () => { resize(); if (still) settle(); });
  Reveal.on('slidechanged', (e) => enter(e.currentSlide));
  Reveal.on('resize', () => { if (still) settle(); });
  // a slide transition moves the incoming slide; settle again once it is in place
  Reveal.on('slidetransitionend', () => { if (still) settle(); });
  (window.deckReady || Promise.resolve()).then(() => {
    enter(Reveal.getCurrentSlide());
    if (!still) requestAnimationFrame(frame);
  });
})();
