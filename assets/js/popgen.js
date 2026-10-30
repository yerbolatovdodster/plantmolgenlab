// Интерактивные рисунки для страницы «Что такое популяционная структура?»
// Рисунки строятся по формулам из Hahn (2018), гл. 5. Данные в рисунках 3–4 условные.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var C = { A: '#4E9A35', a: '#D9A62E', k: ['#1F5A3A', '#D9A62E', '#5F86C0', '#C0564B', '#8A6BB1'], ink: 'currentColor', grid: 'rgba(120,130,125,.25)' };

  function svg(w, h, cls) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    s.setAttribute('class', cls || '');
    s.setAttribute('role', 'img');
    return s;
  }
  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function html(tag, cls, parent, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  function slider(parent, label, min, max, step, value, fmt) {
    var w = html('label', 'pf-slider', parent);
    var top = html('span', 'pf-slider-top', w);
    html('span', '', top, label);
    var out = html('output', '', top, fmt(value));
    var inp = html('input', '', w);
    inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = value;
    inp.setAttribute('aria-label', label);
    return { input: inp, out: out, fmt: fmt };
  }

  // Овал популяции с «хромосомами» A/a
  function popOval(g, cx, cy, rx, ry, p, n, seed, title) {
    el('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: 'none', stroke: 'currentColor', 'stroke-opacity': .35, 'stroke-width': 1.5 }, g);
    el('text', { x: cx, y: cy + ry + 22, 'text-anchor': 'middle', class: 'pf-lbl' }, g, title);
    var r = rng(seed), nA = Math.round(p * n), pts = [];
    // раскладка без пересечений внутри овала
    var tries = 0;
    while (pts.length < n && tries < 4000) {
      tries++;
      var x = cx + (r() * 2 - 1) * (rx - 16), y = cy + (r() * 2 - 1) * (ry - 14);
      if (((x - cx) / (rx - 14)) ** 2 + ((y - cy) / (ry - 12)) ** 2 > 1) continue;
      var ok = true;
      for (var i = 0; i < pts.length; i++) if (Math.hypot(pts[i][0] - x, pts[i][1] - y) < 22) { ok = false; break; }
      if (ok) pts.push([x, y]);
    }
    pts.forEach(function (pt, i) {
      var isA = i < nA;
      el('circle', { cx: pt[0], cy: pt[1], r: 9.5, fill: isA ? C.A : C.a }, g);
      el('text', { x: pt[0], y: pt[1] + 4, 'text-anchor': 'middle', class: 'pf-allele' + (isA ? '' : ' pf-allele-dark') }, g, isA ? 'A' : 'a');
    });
  }

  // ── Рисунок 1. Эффект Валунда ──
  function wahlund(root, L) {
    var ctl = html('div', 'pf-controls', root);
    var s1 = slider(ctl, L.freqA + ' — ' + L.pop1, 0, 1, 0.05, 0.8, f2);
    var s2 = slider(ctl, L.freqA + ' — ' + L.pop2, 0, 1, 0.05, 0.2, f2);
    var wrap = html('div', 'pf-row', root);
    var pic = svg(520, 230, 'pf-svg'); wrap.appendChild(pic);
    var bars = svg(360, 230, 'pf-svg'); wrap.appendChild(bars);
    function draw() {
      var p1 = +s1.input.value, p2 = +s2.input.value;
      s1.out.textContent = f2(p1); s2.out.textContent = f2(p2);
      var pb = (p1 + p2) / 2, qb = 1 - pb;
      var hexp = 2 * pb * qb, hobs = (2 * p1 * (1 - p1) + 2 * p2 * (1 - p2)) / 2;
      var v = ((p1 - pb) * (p1 - pb) + (p2 - pb) * (p2 - pb)) / 2;
      var fst = pb * qb > 0 ? v / (pb * qb) : 0;
      pic.innerHTML = '';
      var g = el('g', {}, pic);
      popOval(g, 130, 100, 115, 80, p1, 20, 7, L.pop1);
      popOval(g, 390, 100, 115, 80, p2, 20, 11, L.pop2);
      bars.innerHTML = '';
      var H = 170, x0 = 40, bw = 110, gap = 60, y0 = 190;
      el('line', { x1: x0 - 10, y1: y0, x2: 350, y2: y0, stroke: C.grid }, bars);
      [[hexp, L.hexp, '#9FB3A6'], [hobs, L.hobs, '#1F5A3A']].forEach(function (b, i) {
        var h = b[0] * 2 * H; // 0.5 → полная высота
        var x = x0 + i * (bw + gap);
        el('rect', { x: x, y: y0 - h, width: bw, height: h, fill: b[2], rx: 4 }, bars);
        el('text', { x: x + bw / 2, y: y0 - h - 8, 'text-anchor': 'middle', class: 'pf-num' }, bars, pct(b[0]));
        var t = el('text', { x: x + bw / 2, y: y0 + 16, 'text-anchor': 'middle', class: 'pf-lbl pf-small' }, bars);
        wrapText(t, b[1], 18, x + bw / 2);
      });
      res.innerHTML = '';
      kv(res, L.deficit, pct(Math.max(0, hexp - hobs)));
      kv(res, L.fst, f2(fst));
    }
    var res = html('div', 'pf-result', root);
    s1.input.addEventListener('input', draw); s2.input.addEventListener('input', draw);
    draw();
  }
  function kv(parent, k, v) {
    var d = html('div', 'pf-kv', parent);
    html('span', '', d, k); html('b', '', d, v);
  }
  function wrapText(t, text, max, x) {
    var words = String(text).split(' '), line = '', lines = [];
    words.forEach(function (w) { if ((line + ' ' + w).trim().length > max) { lines.push(line.trim()); line = w; } else line += ' ' + w; });
    lines.push(line.trim());
    lines.forEach(function (l, i) { el('tspan', { x: x, dy: i ? 14 : 0 }, t, l); });
  }

  // ── Рисунок 2. Миграция против дрейфа: FST = 1 / (1 + 4Nm) ──
  function migration(root, L) {
    var steps = [0, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];
    var ctl = html('div', 'pf-controls', root);
    var s = slider(ctl, L.nm, 0, steps.length - 1, 1, 3, function (i) { return String(steps[i]); });
    var wrap = html('div', 'pf-row', root);
    var pic = svg(520, 230, 'pf-svg'); wrap.appendChild(pic);
    var chart = svg(360, 230, 'pf-svg'); wrap.appendChild(chart);
    var res = html('div', 'pf-result', root);
    // кривая
    var X = function (nm) { return 40 + (Math.log10(nm + 0.02) - Math.log10(0.02)) / (Math.log10(10.02) - Math.log10(0.02)) * 300; };
    var Y = function (f) { return 190 - f * 165; };
    function draw() {
      var nm = steps[+s.input.value];
      s.out.textContent = String(nm);
      var fst = 1 / (1 + 4 * nm);
      // популяции: доля «чужих» аллелей ~ 1 − FST (от полностью разных к одинаковым)
      var mix = (1 - fst) / 2;
      pic.innerHTML = '';
      var g = el('g', {}, pic);
      popOval(g, 130, 100, 115, 80, 1 - mix, 20, 21, L.pop1);
      popOval(g, 390, 100, 115, 80, mix, 20, 23, L.pop2);
      var arrowO = Math.min(1, nm / 2) * .8 + .1;
      el('path', { d: 'M248 80 C 260 64, 272 64, 284 80', fill: 'none', stroke: 'currentColor', 'stroke-opacity': arrowO, 'stroke-width': 1 + Math.min(nm, 5) * .6, 'marker-end': '' }, g);
      el('path', { d: 'M284 120 C 272 136, 260 136, 248 120', fill: 'none', stroke: 'currentColor', 'stroke-opacity': arrowO, 'stroke-width': 1 + Math.min(nm, 5) * .6 }, g);
      el('text', { x: 266, y: 104, 'text-anchor': 'middle', class: 'pf-lbl pf-small' }, g, L.shared);
      chart.innerHTML = '';
      el('line', { x1: 40, y1: 190, x2: 345, y2: 190, stroke: C.grid }, chart);
      el('line', { x1: 40, y1: 20, x2: 40, y2: 190, stroke: C.grid }, chart);
      [0, .5, 1].forEach(function (v) { el('text', { x: 32, y: Y(v) + 4, 'text-anchor': 'end', class: 'pf-axis' }, chart, String(v)); });
      [0, 0.1, 1, 10].forEach(function (v) { el('text', { x: X(v), y: 206, 'text-anchor': 'middle', class: 'pf-axis' }, chart, String(v)); });
      el('text', { x: 192, y: 224, 'text-anchor': 'middle', class: 'pf-axis' }, chart, 'Nm');
      el('text', { x: 14, y: 105, 'text-anchor': 'middle', class: 'pf-axis', transform: 'rotate(-90 14 105)' }, chart, L.fst_axis);
      var d = '';
      for (var i = 0; i <= 120; i++) { var v = Math.pow(10, Math.log10(0.02) + i / 120 * (Math.log10(10.02) - Math.log10(0.02))) - 0.02; d += (i ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(1 / (1 + 4 * v)).toFixed(1); }
      el('path', { d: d, fill: 'none', stroke: '#1F5A3A', 'stroke-width': 2.5 }, chart);
      el('circle', { cx: X(nm), cy: Y(fst), r: 7, fill: '#D9A62E', stroke: '#fff', 'stroke-width': 2 }, chart);
      res.innerHTML = '';
      kv(res, 'Nm', String(nm)); kv(res, L.fst, f2(fst));
    }
    s.input.addEventListener('input', draw);
    draw();
  }

  // ── Рисунок 3. Ложные ассоциации в GWAS ──
  function gwas(root, L) {
    var ctl = html('div', 'pf-toggle', root);
    var b1 = html('button', 'is-on', ctl, L.uncorrected); b1.type = 'button';
    var b2 = html('button', '', ctl, L.corrected); b2.type = 'button';
    var pic = svg(880, 280, 'pf-svg pf-wide'); root.appendChild(pic);
    var res = html('div', 'pf-result', root);
    var r = rng(5), nChr = 7, per = 70, snps = [];
    for (var c = 0; c < nChr; c++) for (var i = 0; i < per; i++) {
      var p = -Math.log10(r());
      var strat = r() < 0.16 ? 2 + r() * 5.5 : 0; // SNP, частоты которых сильно различаются между группами
      var trueSig = (c === 4 && Math.abs(i - 38) < 4) ? (9.5 - Math.abs(i - 38) * 1.6) : 0;
      snps.push({ c: c, i: i, base: p, strat: strat, sig: trueSig });
    }
    function draw(corr) {
      pic.innerHTML = '';
      var x0 = 50, W = 810, y0 = 240, Hh = 210, max = 11, cw = W / nChr;
      var Y = function (v) { return y0 - Math.min(v, max) / max * Hh; };
      el('line', { x1: x0, y1: Y(7.3), x2: x0 + W, y2: Y(7.3), stroke: '#C0564B', 'stroke-dasharray': '5 5', 'stroke-width': 1.2 }, pic);
      [0, 5, 10].forEach(function (v) { el('text', { x: x0 - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'pf-axis' }, pic, String(v)); });
      el('text', { x: 14, y: 140, 'text-anchor': 'middle', class: 'pf-axis', transform: 'rotate(-90 14 140)' }, pic, L.logp);
      snps.forEach(function (s) {
        var v = s.base + (corr ? 0 : s.strat) + s.sig;
        if (!corr && s.sig === 0) v *= 1.25;
        var x = x0 + s.c * cw + 8 + s.i / per * (cw - 16);
        el('circle', { cx: x.toFixed(1), cy: Y(v).toFixed(1), r: 2.8, fill: s.c % 2 ? '#5F86C0' : '#1F5A3A', opacity: .85 }, pic);
      });
      for (var c = 0; c < nChr; c++) el('text', { x: x0 + c * cw + cw / 2, y: y0 + 18, 'text-anchor': 'middle', class: 'pf-axis' }, pic, String(c + 1));
      el('text', { x: x0 + W / 2, y: y0 + 36, 'text-anchor': 'middle', class: 'pf-axis' }, pic, L.chrom);
      var tx = x0 + 4 * cw + 8 + 38 / per * (cw - 16);
      el('text', { x: tx + 10, y: Y(9.6) - 6, class: 'pf-lbl pf-small' }, pic, '← ' + L.true_locus);
      res.innerHTML = '';
      kv(res, L.lambda, corr ? '1.02' : '2.37');
      b1.classList.toggle('is-on', !corr); b2.classList.toggle('is-on', corr);
      b1.setAttribute('aria-pressed', !corr); b2.setAttribute('aria-pressed', corr);
    }
    b1.addEventListener('click', function () { draw(false); });
    b2.addEventListener('click', function () { draw(true); });
    draw(false);
  }

  // ── Рисунок 4. Как находят структуру: PCA и доли предков ──
  function detect(root, L) {
    var ctl = html('div', 'pf-toggle pf-k', root);
    html('span', 'pf-toggle-lbl', ctl, L.k + ':');
    var btns = [2, 3, 4, 5].map(function (k) { var b = html('button', '', ctl, String(k)); b.type = 'button'; b.dataset.k = k; return b; });
    var wrap = html('div', 'pf-row', root);
    var pca = svg(330, 280, 'pf-svg'); wrap.appendChild(pca);
    var right = html('div', 'pf-col', wrap);
    var bars = svg(540, 170, 'pf-svg'); right.appendChild(bars);
    var ce = svg(540, 110, 'pf-svg'); right.appendChild(ce);
    // три истинные группы + немного смешанных образцов
    var r = rng(42), G = [[-0.6, 0.35], [0.55, 0.45], [0.05, -0.62]], n = [30, 26, 24], S = [];
    function gauss() { return (r() + r() + r() - 1.5) / 1.5; }
    n.forEach(function (m, g) {
      for (var i = 0; i < m; i++) {
        var adm = r() < 0.15 ? 0.25 + r() * 0.35 : r() * 0.08;
        var other = (g + 1 + Math.floor(r() * 2)) % 3;
        var q = [0, 0, 0]; q[g] = 1 - adm; q[other] = adm;
        var x = G[g][0] * q[g] + G[other][0] * q[other] + gauss() * 0.11;
        var y = G[g][1] * q[g] + G[other][1] * q[other] + gauss() * 0.11;
        S.push({ g: g, q: q, x: x, y: y, sub: r() < 0.45 });
      }
    });
    S.sort(function (a, b) { return a.g - b.g || b.q[b.g] - a.q[a.g]; });
    var CEv = { 2: 0.62, 3: 0.48, 4: 0.495, 5: 0.51 };
    function qFor(s, K) {
      if (K === 2) return [s.q[0] + s.q[2] * .5, s.q[1] + s.q[2] * .5];
      if (K === 3) return s.q.slice();
      var q = s.q.slice();
      if (K >= 4) { var t = s.g === 0 && s.sub ? .55 : .05; q = [q[0] * (1 - t), q[1], q[2], q[0] * t]; }
      if (K === 5) { var u = s.g === 1 && s.sub ? .4 : .04; q = [q[0], q[1] * (1 - u), q[2], q[3], q[1] * u]; }
      return q;
    }
    function draw(K) {
      btns.forEach(function (b) { var on = +b.dataset.k === K; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
      // PCA
      pca.innerHTML = '';
      var X = function (v) { return 165 + v * 130; }, Y = function (v) { return 140 - v * 115; };
      el('line', { x1: 20, y1: 140, x2: 310, y2: 140, stroke: C.grid }, pca);
      el('line', { x1: 165, y1: 15, x2: 165, y2: 265, stroke: C.grid }, pca);
      el('text', { x: 305, y: 155, 'text-anchor': 'end', class: 'pf-axis' }, pca, L.pc1);
      el('text', { x: 172, y: 24, class: 'pf-axis' }, pca, L.pc2);
      S.forEach(function (s) {
        var q = qFor(s, K), m = 0; q.forEach(function (v, i) { if (v > q[m]) m = i; });
        el('circle', { cx: X(s.x).toFixed(1), cy: Y(s.y).toFixed(1), r: 5, fill: C.k[m], opacity: .9, stroke: '#fff', 'stroke-width': .8 }, pca);
      });
      // столбцы долей
      bars.innerHTML = '';
      var W = 520, bw = W / S.length, H = 140;
      S.forEach(function (s, i) {
        var q = qFor(s, K), y = 150;
        q.forEach(function (v, j) { var h = v * H; y -= h; el('rect', { x: (10 + i * bw).toFixed(2), y: y.toFixed(2), width: (bw - .6).toFixed(2), height: h.toFixed(2), fill: C.k[j] }, bars); });
      });
      el('text', { x: 10, y: 166, class: 'pf-axis' }, bars, L.samples);
      // кросс-энтропия
      ce.innerHTML = '';
      var xs = function (k) { return 60 + (k - 2) * 140; }, ys = function (v) { return 80 - (v - .45) / .2 * 65; };
      el('text', { x: 10, y: 14, class: 'pf-axis' }, ce, L.ce);
      var d = '';
      [2, 3, 4, 5].forEach(function (k, i) { d += (i ? 'L' : 'M') + xs(k) + ' ' + ys(CEv[k]).toFixed(1); });
      el('path', { d: d, fill: 'none', stroke: '#1F5A3A', 'stroke-width': 2 }, ce);
      [2, 3, 4, 5].forEach(function (k) {
        el('circle', { cx: xs(k), cy: ys(CEv[k]), r: k === K ? 7 : 4.5, fill: k === 3 ? '#D9A62E' : '#1F5A3A', stroke: '#fff', 'stroke-width': 1.5 }, ce);
        el('text', { x: xs(k), y: 104, 'text-anchor': 'middle', class: 'pf-axis' }, ce, 'K=' + k);
      });
      el('text', { x: xs(3) + 12, y: ys(CEv[3]) + 16, class: 'pf-lbl pf-small' }, ce, '↑ ' + L.best);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { draw(+b.dataset.k); }); });
    draw(3);
  }

  var FIG = { wahlund: wahlund, migration: migration, gwas: gwas, detect: detect };
  document.querySelectorAll('figure.pf').forEach(function (f) {
    var fn = FIG[f.dataset.fig];
    if (!fn) return;
    var L = {};
    try { L = JSON.parse(f.dataset.l || '{}'); } catch (e) {}
    fn(f.querySelector('.pf-body'), L);
  });
})();
