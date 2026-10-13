/* WayLog — 홈 */
(function () {
  var D = WL.data;

  /* 지역 레일 */
  document.getElementById('regionRail').innerHTML = D.regions.map(function (r) {
    var count = D.places.filter(function (p) { return p.region === r.id; }).length;
    return '<li><a class="region-tile" href="destinations.html?region=' + r.id + '">' + WL.img(r.image, '', { sizes: '(min-width: 1200px) 25vw, 60vw' }) +
      '<span class="region-tile__coord">' + r.lat.toFixed(2) + '°N ' + r.lng.toFixed(2) + '°E</span>' +
      '<span class="region-tile__en">' + r.en + '</span>' +
      '<span class="region-tile__name">' + WL.esc(r.name) + '</span>' +
      '<span class="region-tile__desc">' + WL.esc(r.desc) + ' · 여행지 ' + count + '곳</span></a></li>';
  }).join('');

  /* 추천 코스 3개 */
  document.getElementById('homeCourses').innerHTML = D.courses.slice(0, 3).map(WL.courseCard).join('');

  /* 즐길거리 탭 — 화살표 키로 탭 이동 (WAI-ARIA Tabs 패턴) */
  var cats = [{ id: 'all', name: '전체', icon: 'compass' }].concat(D.enjoyCategories);
  var tabs = document.getElementById('enjoyTabs');
  var panel = document.getElementById('enjoyPanel');
  tabs.innerHTML = cats.map(function (c, i) {
    return '<button class="tab" type="button" role="tab" id="etab-' + c.id + '" aria-controls="enjoyPanel" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-cat="' + c.id + '">' +
      WL.icon(c.icon) + WL.esc(c.name) + '</button>';
  }).join('');

  function select(tab, focus) {
    tabs.querySelectorAll('[role="tab"]').forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    var id = tab.getAttribute('data-cat');
    var items = D.enjoy.filter(function (e) {
      return (id === 'all' || e.category === id) && !(e.end && WL.daysFromToday(e.end) < 0);
    }).slice(0, 4);
    panel.setAttribute('aria-labelledby', tab.id);
    panel.innerHTML = '<div class="card-grid">' + items.map(WL.enjoyCard).join('') + '</div>';
    WL.syncToggles(panel);
  }
  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t) select(t);
  });
  tabs.addEventListener('keydown', function (e) {
    var list = Array.prototype.slice.call(tabs.querySelectorAll('[role="tab"]'));
    var i = list.indexOf(document.activeElement);
    if (i < 0) return;
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(list[(next + list.length) % list.length], true);
  });
  select(tabs.querySelector('[role="tab"]'));

  /* 이번 주 여행 소식: 진행 중 · 예정 행사 (가까운 순) */
  var festivals = D.enjoy.filter(function (e) { return e.category === 'festivals' && WL.daysFromToday(e.end) >= 0; })
    .sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  document.getElementById('newsList').innerHTML = festivals.map(function (f) {
    var st = WL.festivalStatus(f);
    var d = new Date(f.start + 'T00:00:00');
    return '<li class="news-item"><span class="news-item__date" aria-hidden="true"><strong>' + String(d.getDate()).padStart(2, '0') + '</strong><small>' + (d.getMonth() + 1) + '월</small></span>' +
      '<div><h3 class="news-item__title"><a href="enjoy.html?category=festivals#' + f.id + '">' + WL.esc(f.name) + '</a><span class="chip ' + st.cls + '">' + st.label + '</span></h3>' +
      '<p class="news-item__meta"><span>' + WL.icon('calendar') + '<span class="mono">' + WL.formatDate(f.start) + (f.end !== f.start ? ' – ' + WL.formatDate(f.end).slice(5) : '') + '</span></span>' +
      '<span>' + WL.icon('pin') + WL.esc(f.place) + '</span></p></div></li>';
  }).join('');

  /* 공지 */
  document.getElementById('noticeList').innerHTML = D.notices.map(function (n) {
    return '<li><span>' + WL.esc(n.title) + '</span><time datetime="' + n.date + '">' + WL.formatDate(n.date) + '</time></li>';
  }).join('');

  WL.syncToggles();
})();
