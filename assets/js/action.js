// «Наука в действии»: фильтр по типу фото и просмотр во весь экран.
(function () {
  var root = document.querySelector('[data-action]');
  if (!root) return;
  var grid = root.querySelector('.action-grid');
  var items = Array.prototype.slice.call(root.querySelectorAll('.action-item'));
  var btns = root.querySelectorAll('.action-filter button');
  var filter = 'all', matched = items;

  // в режиме «Все» показываем только полные ряды мозаики; остальные фото доступны в просмотре и по фильтрам
  function layout() {
    matched = items.filter(function (it) { return filter === 'all' || it.getAttribute('data-type') === filter; });
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length, show = matched.length;
    if (filter === 'all') {
      var cells = function (n) { return n + (n && matched[0].classList.contains('big') ? 3 : 0); };
      while (show > cols && cells(show) % cols) show--;
    }
    items.forEach(function (it) { it.hidden = true; });
    matched.forEach(function (it, i) { it.hidden = i >= show; });
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.getAttribute('data-f');
      btns.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      root.classList.toggle('is-filtered', filter !== 'all');
      layout();
    });
  });
  layout();
  window.addEventListener('resize', layout);

  var lb = root.querySelector('.lightbox'), lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), cur = 0;
  function show(i) {
    cur = (i + matched.length) % matched.length;
    var img = matched[cur].querySelector('img'), t = matched[cur].querySelector('.action-text');
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lbCap.textContent = t ? t.textContent : '';
  }
  items.forEach(function (it) {
    it.querySelector('.action-open').addEventListener('click', function () {
      show(matched.indexOf(it));
      if (lb.showModal) lb.showModal(); else window.open(lbImg.src, '_blank');
    });
  });
  lb.querySelector('.lb-close').addEventListener('click', function () { lb.close(); });
  lb.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
})();
