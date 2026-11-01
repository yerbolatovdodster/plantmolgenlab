/* Анимированная двойная спираль ДНК из частиц для главной страницы.
   Чистый canvas, без библиотек. Останавливается, когда не видна на экране,
   и рисует один статичный кадр при prefers-reduced-motion. */
(function () {
  var cv = document.querySelector('[data-dna]');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cssVar(n, d) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || d; }
  function hex(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

  var col = {};
  function readColors() {
    col.s1 = hex(cssVar('--k1', '#1F5A3A'));
    col.s2 = hex(cssVar('--k2', '#6FB04F'));
    col.at = hex(cssVar('--k3', '#D9A62E'));
    col.gc = hex(cssVar('--k4', '#5F86C0'));
    col.dust = hex(cssVar('--muted', '#5B665F'));
  }
  readColors();

  // ── Модель: точки в 3D ──
  var P = [];
  var TURNS = 3.2, LEN = 2.6, R = 0.42, PER_TURN = 10.5; // ~10,5 пар оснований на виток, как у B-ДНК
  var nBp = Math.round(TURNS * PER_TURN);
  var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(7);
  function jit(a) { return (rnd() - 0.5) * a; }

  // сахарофосфатные цепи: плотные облака частиц вдоль двух спиралей
  var nS = 1300;
  for (var i = 0; i < nS; i++) {
    var t = i / nS, a = t * TURNS * Math.PI * 2, y = (t - 0.5) * LEN;
    for (var s = 0; s < 2; s++) {
      var ph = a + s * Math.PI * 0.82; // малая и большая бороздки
      var rr = R + jit(0.07);
      P.push({ x: Math.cos(ph) * rr, y: y + jit(0.03), z: Math.sin(ph) * rr, c: s ? 's2' : 's1', r: 0.8 + rnd() * 0.55, w: rnd() * 6.28 });
    }
  }
  // пары оснований: пунктирные «ступеньки» между цепями
  for (var b = 0; b < nBp; b++) {
    var tb = (b + 0.5) / nBp, ab = tb * TURNS * Math.PI * 2, yb = (tb - 0.5) * LEN;
    var x1 = Math.cos(ab) * R, z1 = Math.sin(ab) * R, ab2 = ab + Math.PI * 0.82, x2 = Math.cos(ab2) * R, z2 = Math.sin(ab2) * R;
    var type = rnd() < 0.5 ? 'at' : 'gc', steps = 14;
    for (var k = 1; k < steps; k++) {
      var u = k / steps;
      P.push({ x: x1 + (x2 - x1) * u + jit(0.015), y: yb + jit(0.015), z: z1 + (z2 - z1) * u + jit(0.015), c: (u < 0.5) === (b % 3 !== 0) ? type : (type === 'at' ? 'gc' : 'at'), r: 0.7 + rnd() * 0.45, w: rnd() * 6.28 });
    }
  }
  // «пыль» вокруг — для глубины
  for (var d = 0; d < 260; d++) {
    var ad = rnd() * 6.28, rd = 0.6 + rnd() * 0.9;
    P.push({ x: Math.cos(ad) * rd, y: (rnd() - 0.5) * LEN * 1.15, z: Math.sin(ad) * rd, c: 'dust', r: 0.6 + rnd() * 0.7, w: rnd() * 6.28, dust: 1 });
  }

  // ── Отрисовка ──
  var W = 0, H = 0, dpr = 1;
  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  var mx = 0, my = 0, tx = 0, ty = 0;
    function frame(time) {
    var t = time / 1000;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    ctx.clearRect(0, 0, W, H);
    var rotY = t * 0.35 + mx * 0.6, rotX = 0.25 + my * 0.3, tilt = (W / H > 1.25 ? -1.02 : -0.72) + Math.sin(t * 0.3) * 0.04;
    var cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX), ct = Math.cos(tilt), st = Math.sin(tilt);
    var cam = 3.2, at = Math.abs(st), ac = Math.abs(ct), pad = 0.97 * (cam - R) / cam;
    var scale = Math.min((W / 2) / (at * LEN / 2 + R * ac + 0.12), (H / 2) / (ac * LEN / 2 + R * at + 0.12)) * pad, ox = W / 2, oy = H / 2;
    var out = [];
    for (var i = 0; i < P.length; i++) {
      var p = P[i], wob = Math.sin(t * 1.3 + p.w) * (p.dust ? 0.03 : 0.006);
      var x = p.x + wob, y = p.y, z = p.z + wob;
      // вращение вокруг оси спирали
      var x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      // лёгкий наклон к зрителю
      var y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      // наклон всей спирали в плоскости экрана
      var x2 = x1 * ct - y1 * st, y2 = x1 * st + y1 * ct;
      var f = cam / (cam - z2);
      out.push([ox + x2 * scale * f, oy + y2 * scale * f, z2, p, f]);
    }
    out.sort(function (a, b) { return a[2] - b[2]; });
    for (var j = 0; j < out.length; j++) {
      var o = out[j], q = o[3], c = col[q.c];
      var depth = (o[2] + 1) / 2; // 0 — далеко, 1 — близко
      var al = q.dust ? 0.12 + depth * 0.25 : 0.25 + depth * 0.75;
      ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al.toFixed(3) + ')';
      var rad = q.r * o[4] * (W < 420 ? 0.85 : 1);
      ctx.fillRect(o[0] - rad, o[1] - rad, rad * 2, rad * 2);
    }
  }

  var running = false, visible = true, raf = 0;
  function loop(t) { frame(t); if (running) raf = requestAnimationFrame(loop); }
  function start() { if (running || reduce || !visible || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize(); frame(4000);
  window.addEventListener('resize', function () { resize(); if (!running) frame(4000); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  var host = cv.parentElement;
  host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
  host.addEventListener('pointerleave', function () { tx = ty = 0; });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColors(); if (!running) frame(4000); });
  start();
})();
