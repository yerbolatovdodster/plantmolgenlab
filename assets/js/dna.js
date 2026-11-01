/* Анимация из частиц на главной: ДНК → пшеница → ячмень → соя → ДНК …
   Частицы перетекают из одной фигуры в другую; колосья покачиваются, всё медленно вращается.
   Чистый canvas, без библиотек. Пауза, когда блок не виден; при prefers-reduced-motion — статичная ДНК.
   Клик по анимации — следующая фигура. */
(function () {
  var cv = document.querySelector('[data-dna]');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var tag = document.querySelector('[data-dna-tag]');
  var names = [];
  try { names = JSON.parse(cv.getAttribute('data-names') || '[]'); } catch (e) {}
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Цвета ──
  function cssVar(n, d) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || d; }
  function hex(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  var COL = {};
  function readColors() {
    var dark = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    COL = {
      s1: hex(cssVar('--k1', '#1F5A3A')), s2: hex(cssVar('--k2', '#6FB04F')),
      at: hex(cssVar('--k3', '#D9A62E')), gc: hex(cssVar('--k4', '#5F86C0')),
      dust: hex(cssVar('--muted', '#5B665F')),
      grain: hex('#D9A62E'), grain2: hex(dark ? '#E9C15A' : '#B9871C'),
      straw: hex(dark ? '#E7CF86' : '#C9A443'), awn: hex(dark ? '#F0DC9C' : '#A9852A'),
      stem: hex(dark ? '#5FA36F' : '#3F7F3A'), leaf: hex('#4E9A35'), leaf2: hex(dark ? '#8CCB6A' : '#6FB04F'),
      pod: hex(dark ? '#D2B86A' : '#B08B3A'), seed: hex(dark ? '#E8D49A' : '#8A6A24')
    };
  }
  readColors();

  // ── Случайные числа с фиксированным зерном ──
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function jit(a) { return (rnd() - 0.5) * a; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }

  var N = 2600, LEN = 2.6, TOP = -1.3, BOT = 1.3;

  // точки на поверхности эллипсоида, вытянутого вдоль направления (dx, dy)
  function ellipsoid(out, cx, cy, cz, a, b, c, dx, dy, n, col) {
    var l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    for (var i = 0; i < n; i++) {
      var u = rnd() * 2 - 1, th = rnd() * 6.283, s = Math.sqrt(1 - u * u);
      var lx = s * Math.cos(th) * a, ly = u * b, lz = s * Math.sin(th) * c;
      // поворот: локальная ось y → (dx, dy)
      out.push([cx + lx * -dy + ly * dx, cy + lx * dx + ly * dy, cz + lz, col]);
    }
  }
  function line(out, x1, y1, z1, x2, y2, z2, n, w, col) {
    for (var i = 0; i < n; i++) { var u = rnd(); out.push([x1 + (x2 - x1) * u + jit(w), y1 + (y2 - y1) * u + jit(w), z1 + (z2 - z1) * u + jit(w), col]); }
  }
  function dust(out, n, spread) {
    for (var i = 0; i < n; i++) { var a = rnd() * 6.283, r = 0.55 + rnd() * spread; out.push([Math.cos(a) * r, (rnd() - 0.5) * LEN * 1.15, Math.sin(a) * r, 'dust', 1]); }
  }

  // ── Фигуры ──
  function shapeDNA() {
    var o = [], TURNS = 3.2, R = 0.42, PER = 10.5, nB = Math.round(TURNS * PER);
    for (var i = 0; i < 1250; i++) {
      var t = i / 1250, a = t * TURNS * 6.283, y = (t - 0.5) * LEN;
      for (var s = 0; s < 2; s++) { var ph = a + s * Math.PI * 0.82, rr = R + jit(0.07); o.push([Math.cos(ph) * rr, y + jit(0.03), Math.sin(ph) * rr, s ? 's2' : 's1']); }
    }
    for (var b = 0; b < nB; b++) {
      var tb = (b + 0.5) / nB, ab = tb * TURNS * 6.283, yb = (tb - 0.5) * LEN, ab2 = ab + Math.PI * 0.82;
      var x1 = Math.cos(ab) * R, z1 = Math.sin(ab) * R, x2 = Math.cos(ab2) * R, z2 = Math.sin(ab2) * R, ty = rnd() < 0.5 ? 'at' : 'gc';
      for (var k = 1; k < 9; k++) { var u = k / 9; o.push([x1 + (x2 - x1) * u, yb + jit(0.015), z1 + (z2 - z1) * u, u < 0.5 ? ty : (ty === 'at' ? 'gc' : 'at')]); }
    }
    return o;
  }

  function shapeWheat() {
    // плотный безостый/короткоостый колос мягкой пшеницы: колоски поочерёдно слева и справа от стержня
    var o = [], top = -1.22, base = 0.18, n = 17;
    line(o, 0, top + 0.05, 0, 0, base, 0, 60, 0.012, 'stem');
    for (var k = 0; k < n; k++) {
      var t = k / (n - 1), y = top + 0.1 + t * (base - top - 0.12), side = k % 2 ? 1 : -1;
      var sz = 0.72 + 0.28 * Math.sin(Math.PI * (0.15 + t * 0.8)); // колос сужается к концам
      for (var f = -1; f <= 1; f++) {
        var gx = side * (0.13 + (f === 0 ? 0.045 : 0)) * sz, gz = f * 0.11 * sz;
        ellipsoid(o, gx, y - 0.02, gz, 0.07 * sz, 0.125 * sz, 0.065 * sz, side * 0.5, -1, 30, f === 0 ? 'grain' : 'grain2');
        if (t < 0.35) line(o, gx, y - 0.13 * sz, gz, gx + side * 0.07, y - 0.36 * sz, gz, 8, 0.006, 'awn');
      }
    }
    // стебель с изгибом и флаговый лист
    for (var i = 0; i < 160; i++) { var u = rnd(), yy = base + u * (BOT - base); o.push([0.08 * u * u + jit(0.018), yy, jit(0.018), 'stem']); }
    for (var j = 0; j < 220; j++) {
      var v = rnd(), w = Math.sin(Math.PI * Math.min(1, v * 1.15)) * 0.06;
      o.push([0.05 + v * 0.55 + jit(w), 0.75 - v * 0.55 + v * v * 0.5, jit(0.02) + w * (rnd() - 0.5) * 2, 'leaf']);
    }
    return o;
  }

  function shapeBarley() {
    // поникающий колос ячменя с длинными остями
    var o = [], top = -0.42, base = 0.45, n = 20;
    function bend(y) { var d = Math.max(0, base - y); return -0.12 * d * d; }
    line(o, 0, top, 0, 0, base, 0, 50, 0.01, 'straw');
    for (var k = 0; k < n; k++) {
      var t = k / (n - 1), y = top + t * (base - top), side = k % 2 ? 1 : -1, bx = bend(y);
      for (var f = -1; f <= 1; f++) { // шестирядный: три зерна на узле
        var gx = bx + side * (f === 0 ? 0.095 : 0.065), gz = f * 0.075;
        ellipsoid(o, gx, y, gz, 0.045, 0.11, 0.042, side * 0.3, -1, 16, 'straw');
        var len = 0.8 + rnd() * 0.25 - t * 0.15, ax = gx + side * (0.1 + 0.06 * f * f) + jit(0.06);
        line(o, gx, y - 0.1, gz, ax, y - 0.1 - len, gz + f * 0.09, 24, 0.004, 'awn');
      }
    }
    for (var i = 0; i < 180; i++) { var u = rnd(), yy = base + u * (BOT - base); o.push([-0.06 * u + jit(0.016), yy, jit(0.016), 'stem']); }
    for (var j = 0; j < 200; j++) {
      var v = rnd(), w = Math.sin(Math.PI * Math.min(1, v * 1.1)) * 0.055;
      o.push([-0.04 - v * 0.5 + jit(w), 0.85 - v * 0.4 + v * v * 0.45, jit(0.02), 'leaf2']);
    }
    return o;
  }

  function shapeSoy() {
    // стебель сои с бобами в пазухах и тройчатым листом наверху
    var o = [];
    var nodes = [[0, 1.3], [0.05, 0.7], [-0.04, 0.15], [0.04, -0.38], [0, -0.75]];
    for (var s = 0; s < nodes.length - 1; s++) line(o, nodes[s][0], nodes[s][1], 0, nodes[s + 1][0], nodes[s + 1][1], 0, 60, 0.02, 'stem');
    function pod(x, y, z, dx, dy, dz, len) {
      var l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
      for (var i = 0; i < 95; i++) {
        var u = rnd(), seeds = 3, bulge = 0.6 + 0.4 * Math.abs(Math.sin(u * Math.PI * seeds)), wdt = 0.11 * Math.sin(Math.PI * (0.06 + u * 0.88)) * bulge;
        var th = rnd() * 6.283, cu = u * len, curve = 0.12 * Math.sin(u * Math.PI) * len;
        var px = x + dx * cu - dy * curve + Math.cos(th) * wdt, py = y + dy * cu + dx * curve + Math.sin(th) * wdt * 0.6, pz = z + dz * cu + Math.sin(th) * wdt * 0.5;
        o.push([px, py, pz, rnd() < 0.18 ? 'seed' : 'pod']);
      }
      for (var h = 0; h < 10; h++) { var uu = rnd(); o.push([x + dx * uu * len + jit(0.16), y + dy * uu * len + jit(0.16), z + dz * uu * len + jit(0.16), 'dust', 1]); }
    }
    var clusters = [[0.7, 0.4], [0.15, 2.4], [-0.38, 4.3]];
    clusters.forEach(function (c, ci) {
      var nx = ci === 0 ? 0.05 : ci === 1 ? -0.04 : 0.04, ny = c[0];
      for (var p = 0; p < 3; p++) {
        var a = c[1] + p * 2.0;
        pod(nx, ny - 0.02, 0, Math.cos(a) * 0.9, 0.55 + p * 0.1, Math.sin(a) * 0.9, 0.52 + rnd() * 0.1);
      }
    });
    // тройчатый лист
    var px = 0, py = -0.75;
    line(o, px, py, 0, 0.02, -0.98, 0, 18, 0.008, 'stem');
    function leaflet(cx, cy, ang, L, Wd, yaw) {
      var ca = Math.cos(ang), sa = Math.sin(ang), cyw = Math.cos(yaw), syw = Math.sin(yaw);
      for (var i = 0; i < 120; i++) {
        var u = rnd(), v = (rnd() * 2 - 1), half = Math.sin(Math.PI * Math.pow(u, 0.8)) * Wd;
        var lx = v * half, ly = -u * L, z = (1 - v * v) * 0.03 * Math.sin(Math.PI * u);
        var X = lx * ca - ly * sa, Z = z + v * 0.06;
        o.push([cx + X * cyw - Z * syw, cy + lx * sa + ly * ca, X * syw + Z * cyw, Math.abs(v) < 0.08 ? 'leaf2' : 'leaf']);
      }
    }
    leaflet(0.02, -0.98, 0, 0.36, 0.13, 0.3);
    leaflet(0.02, -0.98, -1.05, 0.33, 0.12, 1.2);
    leaflet(0.02, -0.98, 1.05, 0.33, 0.12, -0.6);
    // нижние листья
    leaflet(0.05, 0.7, -1.9, 0.38, 0.13, 0.9);
    leaflet(-0.04, 0.15, 1.9, 0.36, 0.12, -1.0);
    return o;
  }

  // приводим фигуру к N точкам и сортируем по высоте, чтобы частицы перетекали «сверху вниз»
  function normalize(pts, spread) {
    var out = [];
    var target = N - 240;
    if (pts.length > target) { for (var i = pts.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = pts[i]; pts[i] = pts[j]; pts[j] = t; } pts.length = target; }
    while (pts.length < target) { var p = pts[Math.floor(rnd() * pts.length)]; pts.push([p[0] + jit(0.02), p[1] + jit(0.02), p[2] + jit(0.02), p[3], p[4]]); }
    dust(pts, N - pts.length, spread);
    pts.sort(function (a, b) { return a[1] - b[1]; });
    for (var k = 0; k < pts.length; k++) out.push({ x: pts[k][0], y: pts[k][1], z: pts[k][2], c: pts[k][3], d: pts[k][4] ? 1 : 0 });
    return out;
  }

  var SHAPES = [
    { pts: normalize(shapeDNA(), 0.9), tilt: [-0.72, -1.02], spin: 0.4, sway: 0 },
    { pts: normalize(shapeWheat(), 0.8), tilt: [-0.28, -0.42], spin: 0.16, sway: 1 },
    { pts: normalize(shapeBarley(), 0.8), tilt: [-0.22, -0.36], spin: 0.16, sway: 1 },
    { pts: normalize(shapeSoy(), 0.8), tilt: [-0.12, -0.3], spin: 0.14, sway: 0.6 }
  ];

  // частицы: собственный размер, фаза и случайное направление «вихря» при перестроении
  var PART = [];
  for (var i = 0; i < N; i++) {
    var th = rnd() * 6.283, ph = Math.acos(rnd() * 2 - 1);
    PART.push({ r: 0.75 + rnd() * 0.6, w: rnd() * 6.283, delay: rnd() * 0.35,
      vx: Math.sin(ph) * Math.cos(th), vy: Math.cos(ph), vz: Math.sin(ph) * Math.sin(th), sw: 0.25 + rnd() * 0.45 });
  }

  // ── Состояние анимации ──
  var cur = 0, prev = 0, morphT = 9, HOLD = 5.2, MORPH = 2.0, clock = 0, holdT = 0, ang = 1.2;
  function ease(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  function setTag() {
    if (!tag) return;
    var nm = names[cur] || '';
    tag.textContent = nm + '  ' + String(cur + 1).padStart(2, '0') + '/' + String(SHAPES.length).padStart(2, '0');
  }
  function next() { prev = cur; cur = (cur + 1) % SHAPES.length; morphT = 0; holdT = 0; setTag(); }

  // ── Отрисовка ──
  var W = 0, H = 0, dpr = 1;
  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  var mx = 0, my = 0, tx = 0, ty = 0, buf = new Array(N);
  for (var b = 0; b < N; b++) buf[b] = [0, 0, 0, 0, 0, 0, 0, 0];
  function frame() {
    var t = clock;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    ctx.clearRect(0, 0, W, H);
    var A = SHAPES[prev], B = SHAPES[cur], wide = W / H > 1.25 ? 1 : 0;
    var m = Math.min(1, morphT / MORPH), em = ease(m);
    var tilt = A.tilt[wide] + (B.tilt[wide] - A.tilt[wide]) * em + Math.sin(t * 0.3) * 0.04;
    var sway = A.sway + (B.sway - A.sway) * em;
    var rotY = ang + mx * 0.7, rotX = 0.22 + my * 0.3;
    var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX), ct = Math.cos(tilt), st = Math.sin(tilt);
    var cam = 3.2, R = 0.5, at = Math.abs(st), ac = Math.abs(ct), pad = 0.95 * (cam - R) / cam;
    var scale = Math.min((W / 2) / (at * LEN / 2 + R * ac + 0.12), (H / 2) / (ac * LEN / 2 + R * at + 0.12)) * pad, ox = W / 2, oy = H / 2;
    var wind = Math.sin(t * 1.1) * 0.06 + Math.sin(t * 2.3 + 1) * 0.025;

    for (var i = 0; i < N; i++) {
      var pa = A.pts[i], pb = B.pts[i], q = PART[i];
      var u = m >= 1 ? 1 : ease(Math.max(0, Math.min(1, (m - q.delay) / 0.65)));
      var burst = Math.sin(Math.PI * u) * q.sw;
      var x = pa.x + (pb.x - pa.x) * u + q.vx * burst, y = pa.y + (pb.y - pa.y) * u + q.vy * burst * 0.6, z = pa.z + (pb.z - pa.z) * u + q.vz * burst;
      var isDust = u < 0.5 ? pa.d : pb.d, wob = Math.sin(t * 1.3 + q.w) * (isDust ? 0.035 : 0.006);
      x += wob; z += wob;
      if (isDust) y += Math.sin(t * 0.4 + q.w) * 0.05;
      // ветер: колосья качаются, основание стебля неподвижно
      var h = (BOT - y) / LEN; x += sway * wind * h * h * 1.6;
      var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      var x2 = x1 * ct - y1 * st, y2 = x1 * st + y1 * ct;
      var f = cam / (cam - z2), ca = COL[pa.c], cb = COL[pb.c], o = buf[i];
      o[0] = ox + x2 * scale * f; o[1] = oy + y2 * scale * f; o[2] = z2; o[3] = f;
      o[4] = ca[0] + (cb[0] - ca[0]) * u; o[5] = ca[1] + (cb[1] - ca[1]) * u; o[6] = ca[2] + (cb[2] - ca[2]) * u; o[7] = isDust ? 1 : 0;
      o[8] = q.r;
    }
    buf.sort(function (a, b) { return a[2] - b[2]; });
    var small = W < 420 ? 0.85 : 1;
    for (var j = 0; j < N; j++) {
      var p = buf[j], depth = (p[2] + 1) / 2;
      var al = p[7] ? 0.12 + depth * 0.25 : 0.25 + depth * 0.75;
      ctx.fillStyle = 'rgba(' + (p[4] | 0) + ',' + (p[5] | 0) + ',' + (p[6] | 0) + ',' + al.toFixed(3) + ')';
      var rad = p[8] * p[3] * small;
      ctx.fillRect(p[0] - rad, p[1] - rad, rad * 2, rad * 2);
    }
  }

  var running = false, visible = true, raf = 0, last = 0;
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    clock += dt;
    var mm = ease(Math.min(1, morphT / MORPH)); ang += dt * (SHAPES[prev].spin + (SHAPES[cur].spin - SHAPES[prev].spin) * mm + Math.sin(Math.PI * mm) * 1.2);
    if (morphT < MORPH) morphT += dt; else { holdT += dt; if (holdT > HOLD) next(); }
    frame();
    if (running) raf = requestAnimationFrame(loop);
  }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  clock = 4; resize(); setTag(); frame();
  window.addEventListener('resize', function () { resize(); if (!running) frame(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  var host = cv.parentElement;
  host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
  host.addEventListener('pointerleave', function () { tx = ty = 0; });
  host.addEventListener('click', function () { if (reduce) return; if (morphT >= MORPH) next(); });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColors(); if (!running) frame(); });
  start();
})();
