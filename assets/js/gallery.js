// Карусель фотографий на странице «Команда»: стрелки, свайп, автопрокрутка и просмотр во весь экран.
(function () {
  var root = document.querySelector('.gallery');
  if (!root) return;
  var track = root.querySelector('.car-track');
  var items = Array.prototype.slice.call(track.querySelectorAll('.car-item'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step(dir) {
    var x = track.scrollLeft, w = track.clientWidth, target = null;
    var lefts = items.map(function (it) { return it.offsetLeft - track.offsetLeft; });
    if (dir > 0) {
      for (var i = 0; i < lefts.length; i++) if (lefts[i] > x + 8) { target = lefts[i]; break; }
      if (target === null || x + w >= track.scrollWidth - 8) target = 0; // в конце — к началу
    } else {
      for (var j = lefts.length - 1; j >= 0; j--) if (lefts[j] < x - 8) { target = lefts[j]; break; }
      if (target === null) target = track.scrollWidth;
    }
    track.scrollTo({ left: target, behavior: reduce ? 'auto' : 'smooth' });
  }
  root.querySelectorAll('.car-btn').forEach(function (b) {
    b.addEventListener('click', function () { step(+b.getAttribute('data-dir')); restart(); });
  });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });

  // автопрокрутка: пауза при наведении, фокусе, касании и когда карусель не видна
  var timer = null, hover = false, visible = false;
  function tick() { if (!hover && visible && !lb.open) step(1); }
  function restart() { if (reduce) return; clearInterval(timer); timer = setInterval(tick, 4500); }
  track.addEventListener('mouseenter', function () { hover = true; });
  track.addEventListener('mouseleave', function () { hover = false; });
  track.addEventListener('focusin', function () { hover = true; });
  track.addEventListener('focusout', function () { hover = false; });
  track.addEventListener('touchstart', function () { hover = true; restart(); }, { passive: true });
  track.addEventListener('touchend', function () { setTimeout(function () { hover = false; }, 4000); }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.4 }).observe(track);
  } else { visible = true; }

  // просмотр во весь экран
  var lb = root.querySelector('.lightbox');
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), cur = 0;
  function show(i) {
    cur = (i + items.length) % items.length;
    var img = items[cur].querySelector('img'), cap = items[cur].querySelector('figcaption');
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
    lbCap.textContent = cap ? cap.textContent : '';
  }
  items.forEach(function (it, i) {
    it.querySelector('.car-open').addEventListener('click', function () {
      show(i);
      if (lb.showModal) lb.showModal(); else window.open(lbImg.src, '_blank');
    });
  });
  lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });

  restart();
})();
