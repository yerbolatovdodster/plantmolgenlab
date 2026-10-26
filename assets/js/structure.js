// Рисует на главной полосу в стиле графика ADMIXTURE (K = 4).
// Данные иллюстративные, но генерируются детерминированно: картинка всегда одинаковая.
(function () {
  var svg = document.getElementById('structure-strip');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var W = 1200, H = 200, N = 120;
  var colors = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)'];
  var sampleLabel = svg.getAttribute('data-sample') || 'Sample';
  var ancLabel = svg.getAttribute('data-ancestry') || 'K';

  // простой ГПСЧ с фиксированным зерном
  var seed = 20261026;
  function rnd() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  // четыре «популяции» разного размера, внутри — сортировка по доминирующему компоненту
  var groups = [34, 28, 32, 26];
  var samples = [];
  groups.forEach(function (size, k) {
    var g = [];
    for (var i = 0; i < size; i++) {
      var main = 0.55 + rnd() * 0.44;
      var rest = [rnd(), rnd() * 0.5, rnd() * 0.3];
      var sum = rest[0] + rest[1] + rest[2];
      var q = [0, 0, 0, 0];
      q[k] = main;
      var others = [0, 1, 2, 3].filter(function (j) { return j !== k; });
      others.forEach(function (j, idx) { q[j] = (1 - main) * rest[idx] / sum; });
      g.push({ q: q, k: k });
    }
    g.sort(function (a, b) { return b.q[b.k] - a.q[a.k]; });
    samples = samples.concat(g);
  });

  var bw = W / N;
  var frag = document.createDocumentFragment();
  samples.forEach(function (s, i) {
    var bar = document.createElementNS(NS, 'g');
    bar.setAttribute('class', 'bar');
    bar.style.animationDelay = (i * 7) + 'ms';
    var y = H;
    // доминирующий компонент снизу, остальные сверху
    var order = [s.k].concat([0, 1, 2, 3].filter(function (j) { return j !== s.k; }));
    order.forEach(function (j) {
      var h = s.q[j] * H;
      y -= h;
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', (i * bw).toFixed(2));
      r.setAttribute('y', y.toFixed(2));
      r.setAttribute('width', (bw - 1).toFixed(2));
      r.setAttribute('height', h.toFixed(2));
      r.setAttribute('fill', colors[j]);
      bar.appendChild(r);
    });
    var title = document.createElementNS(NS, 'title');
    title.textContent = sampleLabel + ' ' + (i + 1) + ': ' + order.map(function (j) {
      return ancLabel + ' ' + (j + 1) + ' ' + Math.round(s.q[j] * 100) + '%';
    }).join(', ');
    bar.appendChild(title);
    frag.appendChild(bar);
  });
  svg.appendChild(frag);
  svg.classList.add('is-drawing');
})();
