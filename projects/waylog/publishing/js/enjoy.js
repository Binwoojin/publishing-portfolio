/* WayLog — 여행 즐기기 (분류 탭 · 행사 기간 필터 · 주소 동기화) */
(function () {
  var D = WL.data;
  var cats = [{ id: 'all', name: '전체', icon: 'compass', image: 'hero-illustration', desc: '축제부터 레포츠, 음식점, 쇼핑, 숙박까지 여행 중 필요한 정보를 분류별로 확인해 보세요.' }].concat(D.enjoyCategories);
  var current = WL.find.category(WL.param('category')) ? WL.param('category') : 'all';
  var period = 'all';

  var tabs = document.getElementById('categoryTabs');
  var panel = document.getElementById('enjoyPanel');
  var periodFilter = document.getElementById('periodFilter');

  tabs.innerHTML = cats.map(function (c) {
    var n = c.id === 'all' ? D.enjoy.length : D.enjoy.filter(function (e) { return e.category === c.id; }).length;
    return '<button class="tab" type="button" role="tab" id="ctab-' + c.id + '" aria-controls="enjoyPanel" data-cat="' + c.id + '">' + WL.icon(c.icon) + WL.esc(c.name) + ' <span class="count">' + n + '</span></button>';
  }).join('');

  function periodOf(e) {
    if (!e.start) return 'none';
    if (WL.daysFromToday(e.end) < 0) return 'ended';
    return WL.daysFromToday(e.start) <= 0 ? 'now' : 'soon';
  }

  function render(fromUser) {
    var cat = cats.filter(function (c) { return c.id === current; })[0];
    tabs.querySelectorAll('[role="tab"]').forEach(function (t) {
      var on = t.getAttribute('data-cat') === current;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', 'ctab-' + current);

    document.getElementById('enjoyCover').innerHTML = WL.img(cat.image, '', { eager: true, sizes: '100vw' });
    document.getElementById('enjoyCrumb').textContent = cat.name;
    document.getElementById('enjoyTitle').textContent = current === 'all' ? '여행을 더 즐겁게' : cat.name;
    document.getElementById('enjoyDesc').textContent = cat.desc;
    document.title = (current === 'all' ? '여행 즐기기' : cat.name) + ' | WayLog';

    var showPeriod = current === 'festivals';
    periodFilter.hidden = !showPeriod;
    if (!showPeriod) period = 'all';

    var items = D.enjoy.filter(function (e) {
      return (current === 'all' || e.category === current) && (period === 'all' || periodOf(e) === period);
    });
    /* 행사는 진행 중 → 예정 → 종료 순, 같은 그룹 안에서는 시작일 순 */
    var order = { now: 0, soon: 1, none: 1, ended: 2 };
    items.sort(function (a, b) { return order[periodOf(a)] - order[periodOf(b)] || ((a.start || '') < (b.start || '') ? -1 : 1); });

    document.getElementById('enjoyCount').innerHTML = '총 <strong>' + items.length + '</strong>곳';
    document.getElementById('enjoyGrid').innerHTML = items.map(function (e) {
      return WL.enjoyCard(e).replace('<article class="place-card"', '<article class="place-card" id="' + e.id + '"');
    }).join('');
    document.getElementById('enjoyEmpty').hidden = items.length > 0;
    WL.syncToggles(panel);
    if (fromUser) WL.announce((current === 'all' ? '전체' : cat.name) + ' ' + items.length + '곳을 보여줍니다.');

    /* #e3 처럼 특정 항목으로 들어오면 해당 카드로 스크롤 */
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && !fromUser) {
      target.classList.add('is-target');
      target.scrollIntoView({ block: 'center' });
    }
  }

  function selectCat(id, focus) {
    current = id;
    history.replaceState(null, '', location.pathname + (id === 'all' ? '' : '?category=' + id));
    render(true);
    if (focus) tabs.querySelector('[data-cat="' + id + '"]').focus();
  }

  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]');
    if (t) selectCat(t.getAttribute('data-cat'));
  });
  tabs.addEventListener('keydown', function (e) {
    var list = Array.prototype.slice.call(tabs.querySelectorAll('[role="tab"]'));
    var i = list.indexOf(document.activeElement);
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    selectCat(list[(next + list.length) % list.length].getAttribute('data-cat'), true);
  });
  periodFilter.addEventListener('click', function (e) {
    var b = e.target.closest('[data-period]');
    if (!b) return;
    period = b.getAttribute('data-period');
    periodFilter.querySelectorAll('[data-period]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    render(true);
  });

  render(false);
})();
