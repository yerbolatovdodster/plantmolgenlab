// Анимированное демо CropPopStructure: курсор проходит путь от загрузки VCF до результатов.
// Сцена рисуется в фиксированном размере 960×580 и масштабируется под ширину страницы.
(function () {
  var root = document.getElementById('app-demo');
  if (!root) return;

  var W = 960;
  var viewport = root.querySelector('.demo-viewport');
  var stage = root.querySelector('.demo-stage');
  var toggle = root.querySelector('.demo-toggle');
  var steps = root.querySelectorAll('.demo-steps li');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  function el(name) { return stage.querySelector('[data-el="' + name + '"]'); }
  stage.appendChild(stage.querySelector('[data-el="tip"]')); // подсказка позиционируется от сцены
  function screen(name) { return stage.querySelector('[data-screen="' + name + '"]'); }
  function plot(name) { return stage.querySelector('[data-plot="' + name + '"]'); }

  // ── масштаб ──
  function fit() { stage.style.setProperty('--s', viewport.clientWidth / W); }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(viewport);
  else window.addEventListener('resize', fit);

  // ── данные (детерминированные) ──
  var seed = 86;
  function rnd() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) / 1.5; }
  var COLORS = ['#1F5A3A', '#6FB04F', '#D9A62E', '#5F86C0'];
  var POPS = ['Kazakhstan', 'Russia', 'USA', 'Landraces'];
  var SIZES = [26, 20, 22, 18]; // = 86
  var CENTERS = [[-0.55, 0.35], [-0.15, -0.5], [0.5, 0.25], [0.15, 0.75]];

  // PCA
  var pcaSvg = el('pca');
  (function drawPca() {
    var g = '';
    g += '<line x1="40" y1="270" x2="510" y2="270" stroke="#D5DCD2"/><line x1="40" y1="12" x2="40" y2="270" stroke="#D5DCD2"/>';
    g += '<text x="275" y="294" class="ax">PC1 (14.2%)</text><text x="14" y="140" class="ax" transform="rotate(-90 14 140)">PC2 (8.7%)</text>';
    var n = 0;
    SIZES.forEach(function (size, k) {
      for (var i = 0; i < size; i++) {
        var x = 275 + (CENTERS[k][0] + gauss() * 0.24) * 210;
        var y = 141 - (CENTERS[k][1] - 0.12 + gauss() * 0.24) * 135;
        g += '<circle class="pt" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5.5" fill="' + COLORS[k] + '" style="--d:' + (n * 12) + 'ms"/>';
        n++;
      }
    });
    var lx = 360;
    POPS.forEach(function (p, k) {
      g += '<circle cx="' + lx + '" cy="' + (22 + k * 18) + '" r="5" fill="' + COLORS[k] + '"/><text x="' + (lx + 11) + '" y="' + (26 + k * 18) + '" class="lg">' + p + '</text>';
    });
    pcaSvg.innerHTML = g;
  })();

  // sNMF barplot
  var snmfSvg = el('snmf');
  var samples = [];
  (function drawSnmf() {
    SIZES.forEach(function (size, k) {
      var grp = [];
      for (var i = 0; i < size; i++) {
        var main = 0.64 + rnd() * 0.35;
        var rest = [rnd(), rnd() * 0.5, rnd() * 0.3], sum = rest[0] + rest[1] + rest[2];
        var q = [0, 0, 0, 0]; q[k] = main;
        [0, 1, 2, 3].filter(function (j) { return j !== k; }).forEach(function (j, idx) { q[j] = (1 - main) * rest[idx] / sum; });
        grp.push({ q: q, k: k });
      }
      grp.sort(function (a, b) { return b.q[b.k] - a.q[a.k]; });
      samples = samples.concat(grp);
    });
    var H = 250, bw = 520 / samples.length, g = '';
    samples.forEach(function (s, i) {
      var y = H, order = [s.k].concat([0, 1, 2, 3].filter(function (j) { return j !== s.k; }));
      g += '<g class="bar" data-i="' + i + '" style="--d:' + (i * 9) + 'ms">';
      order.forEach(function (j) {
        var h = s.q[j] * H; y -= h;
        g += '<rect x="' + (i * bw).toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + (bw - 0.8).toFixed(2) + '" height="' + h.toFixed(2) + '" fill="' + COLORS[j] + '"/>';
      });
      g += '</g>';
    });
    snmfSvg.innerHTML = g;
  })();

  // ── курсор ──
  var cursor = el('cursor'), ripple = el('ripple');
  var pos = { x: 700, y: 520 };
  function place(x, y, ms) {
    cursor.style.transitionDuration = (ms || 0) + 'ms';
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    pos = { x: x, y: y };
  }
  function center(node, dx, dy) {
    var s = parseFloat(getComputedStyle(stage).getPropertyValue('--s')) || 1;
    var r = node.getBoundingClientRect(), b = stage.getBoundingClientRect();
    return {
      x: (r.left - b.left) / s + Math.min(r.width / s / 2, 70) + (dx || 0),
      y: (r.top - b.top) / s + r.height / s / 2 + (dy || 0)
    };
  }

  // ── управление временем (пауза и прерывание) ──
  var paused = false, gen = 0;
  function wait(ms) {
    var my = gen;
    return new Promise(function (resolve, reject) {
      var left = ms, last = performance.now();
      (function tick(now) {
        if (my !== gen) return reject('stop');
        if (!paused) left -= (now - last);
        last = now;
        if (left <= 0) resolve(); else requestAnimationFrame(tick);
      })(last);
    });
  }
  async function moveTo(node, ms, dx, dy) {
    var p = center(node, dx, dy);
    place(p.x, p.y, ms);
    await wait(ms + 60);
  }
  async function click(node) {
    ripple.style.left = pos.x + 'px'; ripple.style.top = pos.y + 'px';
    ripple.classList.remove('go'); void ripple.offsetWidth; ripple.classList.add('go');
    cursor.classList.add('down'); node && node.classList.add('pressed');
    await wait(160);
    cursor.classList.remove('down'); node && node.classList.remove('pressed');
    await wait(120);
  }
  function step(n) {
    steps.forEach(function (li) { li.classList.toggle('is-on', +li.getAttribute('data-step') === n); });
  }
  async function upload(nameEl, barEl, name) {
    barEl.parentNode.classList.add('on');
    barEl.style.transition = 'none'; barEl.style.width = '0';
    void barEl.offsetWidth;
    barEl.style.transition = 'width 700ms ease-out'; barEl.style.width = '100%';
    await wait(760);
    nameEl.textContent = name; nameEl.classList.add('has');
    barEl.parentNode.classList.remove('on');
  }

  // ── исходное состояние ──
  function reset() {
    el('vcf-name').textContent = 'No file selected'; el('vcf-name').classList.remove('has');
    el('pop-name').textContent = 'No file selected'; el('pop-name').classList.remove('has');
    el('name-text').textContent = ''; el('name-input').classList.remove('focus');
    el('check').textContent = 'Upload a VCF and a population file to start.'; el('check').classList.remove('ok');
    el('run-label').textContent = 'Run analysis'; el('run-btn').classList.remove('busy');
    el('runs-card').classList.remove('gone'); el('progress').classList.remove('on');
    el('pbar').style.width = '0'; el('pct').textContent = '0%';
    stage.querySelectorAll('.d-steps li').forEach(function (li) { li.className = ''; });
    screen('form').classList.add('is-on'); screen('results').classList.remove('is-on');
    el('nav-new').classList.add('is-on'); el('nav-results').classList.remove('is-on');
    el('tab-pca').classList.add('is-on'); el('tab-snmf').classList.remove('is-on');
    plot('pca').classList.add('is-on'); plot('snmf').classList.remove('is-on');
    pcaSvg.classList.remove('draw'); snmfSvg.classList.remove('draw');
    el('tip').classList.remove('on');
    stage.querySelectorAll('.bar.hl').forEach(function (b) { b.classList.remove('hl'); });
    step(0);
  }

  // ── финальный кадр (для prefers-reduced-motion) ──
  function finalFrame() {
    reset();
    el('vcf-name').textContent = 'barley_86acc.vcf.gz'; el('vcf-name').classList.add('has');
    el('pop-name').textContent = 'populations.txt'; el('pop-name').classList.add('has');
    screen('form').classList.remove('is-on'); screen('results').classList.add('is-on');
    el('nav-new').classList.remove('is-on'); el('nav-results').classList.add('is-on');
    el('tab-pca').classList.remove('is-on'); el('tab-snmf').classList.add('is-on');
    plot('pca').classList.remove('is-on'); plot('snmf').classList.add('is-on');
    snmfSvg.classList.add('draw', 'instant');
    cursor.style.display = 'none';
    steps.forEach(function (li) { li.classList.add('is-on'); });
    toggle.hidden = true;
  }

  // ── сценарий ──
  async function play() {
    reset();
    place(720, 560, 0);
    await wait(700);

    step(1);
    await moveTo(el('vcf-btn'), 900);
    await click(el('vcf-btn'));
    await upload(el('vcf-name'), el('vcf-bar'), 'barley_86acc.vcf.gz');
    await wait(250);

    step(2);
    await moveTo(el('pop-btn'), 650);
    await click(el('pop-btn'));
    await upload(el('pop-name'), el('pop-bar'), 'populations.txt');

    await moveTo(el('name-input'), 600, -40);
    await click(el('name-input'));
    el('name-input').classList.add('focus');
    var text = 'Barley 86 accessions';
    for (var i = 1; i <= text.length; i++) { el('name-text').textContent = text.slice(0, i); await wait(42); }
    el('check').textContent = '✓ 86 samples · 4 populations · 24 318 SNPs · ready to run';
    el('check').classList.add('ok');
    await wait(700);

    step(3);
    el('name-input').classList.remove('focus');
    await moveTo(el('run-btn'), 700);
    await click(el('run-btn'));
    el('run-btn').classList.add('busy'); el('run-label').textContent = 'Running…';
    el('runs-card').classList.add('gone'); el('progress').classList.add('on');
    var lis = stage.querySelectorAll('.d-steps li');
    for (var s = 0; s < lis.length; s++) {
      lis[s].className = 'run';
      await wait(560);
      lis[s].className = 'done';
      var pct = Math.round((s + 1) / lis.length * 100);
      el('pbar').style.width = pct + '%'; el('pct').textContent = pct + '%';
    }
    await wait(400);

    step(4);
    el('run-btn').classList.remove('busy'); el('run-label').textContent = 'Run analysis';
    el('nav-new').classList.remove('is-on'); el('nav-results').classList.add('is-on');
    screen('form').classList.remove('is-on'); screen('results').classList.add('is-on');
    await wait(250);
    pcaSvg.classList.add('draw');
    await wait(1900);

    await moveTo(el('tab-snmf'), 800);
    await click(el('tab-snmf'));
    el('tab-pca').classList.remove('is-on'); el('tab-snmf').classList.add('is-on');
    plot('pca').classList.remove('is-on'); plot('snmf').classList.add('is-on');
    snmfSvg.classList.add('draw');
    await wait(1200);

    // наведение на столбец
    var idx = 33, bar = snmfSvg.querySelector('.bar[data-i="' + idx + '"]');
    await moveTo(bar, 800, 0, 40);
    bar.classList.add('hl');
    var q = samples[idx].q, tip = el('tip');
    tip.innerHTML = '<b>Sample ' + (idx + 1) + ' · ' + POPS[samples[idx].k] + '</b>' +
      q.map(function (v, j) { return '<span><i style="background:' + COLORS[j] + '"></i>K' + (j + 1) + ' ' + Math.round(v * 100) + '%</span>'; }).join('');
    var tp = center(bar);
    tip.style.left = (tp.x + 16) + 'px'; tip.style.top = (tp.y - 30) + 'px';
    tip.classList.add('on');
    await wait(2600);

    stage.classList.add('fade');
    await wait(500);
    stage.classList.remove('fade');
  }

  async function loop() {
    var my = gen;
    try {
      while (my === gen) { await play(); }
    } catch (e) { /* остановлено */ }
  }

  if (reduce) { finalFrame(); return; }

  toggle.addEventListener('click', function () {
    paused = !paused;
    stage.classList.toggle('is-paused', paused);
    toggle.textContent = toggle.getAttribute(paused ? 'data-play' : 'data-pause');
    toggle.setAttribute('aria-pressed', String(paused));
  });

  // запускаем, когда демо появилось на экране; ставим на паузу, когда ушло
  var started = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !started) { started = true; loop(); }
      if (started && toggle.getAttribute('aria-pressed') !== 'true') paused = !e.isIntersecting;
    });
  }, { threshold: 0.35 });
  io.observe(root);
})();
