/* WayLog — 여행지 찾기 (필터 · 정렬 · 페이지가 주소와 함께 움직인다) */
(function () {
  var D = WL.data;
  var PAGE_SIZE = 8;
  var TYPES = [{ id: '', name: '전체' }, { id: 'attraction', name: '관광지' }, { id: 'culture', name: '문화시설' }, { id: 'course', name: '여행코스' }];

  var q = new URLSearchParams(location.search);
  var state = {
    region: q.get('region') || '',
    type: q.get('type') || '',
    q: (q.get('q') || '').trim(),
    sort: q.get('sort') || 'popular',
    page: Math.max(1, parseInt(q.get('page'), 10) || 1)
  };
  if (!WL.find.region(state.region)) state.region = '';
  if (!TYPES.some(function (t) { return t.id === state.type; })) state.type = '';

  var keyword = document.getElementById('keyword');
  var sortSelect = document.getElementById('sortSelect');
  keyword.value = state.q;
  sortSelect.value = state.sort;

  /* ---------- 필터링 ---------- */
  function matchText(text) {
    if (!state.q) return true;
    return text.toLowerCase().indexOf(state.q.toLowerCase()) > -1;
  }
  function placeText(p) { return [p.name, p.desc, p.address, p.tags.join(' '), WL.find.region(p.region).name].join(' '); }
  function courseText(c) { return [c.title, c.desc, c.theme, c.stops.map(function (s) { return s.name; }).join(' '), WL.find.region(c.region).name].join(' '); }

  function filtered(type, region) {
    region = region === undefined ? state.region : region;
    if (type === 'course') {
      return D.courses.filter(function (c) { return (!region || c.region === region) && matchText(courseText(c)); });
    }
    return D.places.filter(function (p) {
      return (!type || p.type === type) && (!region || p.region === region) && matchText(placeText(p));
    });
  }
  function sorted(list) {
    var s = state.sort;
    return list.slice().sort(function (a, b) {
      if (s === 'name') return (a.name || a.title).localeCompare(b.name || b.title, 'ko');
      if (s === 'recent') return (b.updated || '') < (a.updated || '') ? -1 : 1;
      return (b.views || 0) - (a.views || 0);
    });
  }
  function currentList() {
    if (state.type === 'course') return sorted(filtered('course'));
    var list = filtered(state.type);
    /* '전체'일 때는 장소 뒤에 코스도 함께 보여준다 */
    if (!state.type) list = list.concat(filtered('course'));
    return sorted(list);
  }

  /* ---------- 필터 UI ---------- */
  function renderFilters() {
    var chips = [{ id: '', name: '전국' }].concat(D.regions);
    document.getElementById('regionChips').innerHTML = chips.map(function (r) {
      var n = filtered(state.type === 'course' ? 'course' : state.type, r.id).length + (state.type ? 0 : filtered('course', r.id).length);
      return '<button class="filter-chip" type="button" data-region="' + r.id + '" aria-pressed="' + (state.region === r.id) + '">' +
        WL.esc(r.name) + ' <span class="count">' + n + '</span></button>';
    }).join('');

    document.getElementById('typeTabs').innerHTML = TYPES.map(function (t) {
      var n = t.id === '' ? filtered('').length + filtered('course').length : filtered(t.id).length;
      var on = state.type === t.id;
      return '<button class="tab" type="button" role="tab" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" aria-controls="resultsView" data-type="' + t.id + '">' +
        t.name + ' <span class="count">' + n + '</span></button>';
    }).join('');
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.region) p.set('region', state.region);
    if (state.type) p.set('type', state.type);
    if (state.q) p.set('q', state.q);
    if (state.sort !== 'popular') p.set('sort', state.sort);
    if (state.page > 1) p.set('page', state.page);
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function summary(n) {
    var parts = [];
    if (state.q) parts.push('‘' + WL.esc(state.q) + '’ 검색 결과');
    if (state.region) parts.push(WL.esc(WL.find.region(state.region).name));
    var t = TYPES.filter(function (x) { return x.id === state.type; })[0];
    if (state.type) parts.push(t.name);
    return (parts.length ? parts.join(' · ') + ' — ' : '') + '총 <strong>' + n + '</strong>' + (state.type === 'course' ? '개 코스' : '곳');
  }

  /* ---------- 결과 ---------- */
  function renderResults() {
    var list = currentList();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(state.page, pages);
    var slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    document.getElementById('resultCount').innerHTML = summary(list.length);
    var onlyCourses = slice.every(function (x) { return x.stops; });
    document.getElementById('resultGrid').innerHTML = '<div class="' + (onlyCourses ? 'course-grid' : 'card-grid') + '">' + slice.map(function (x) {
      return x.stops ? WL.courseCard(x) : WL.placeCard(x, { desc: true });
    }).join('') + '</div>';

    var nav = document.getElementById('pagination');
    if (pages < 2) { nav.innerHTML = ''; } else {
      var html = '<button type="button" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? ' disabled' : '') + ' aria-label="이전 페이지">' + WL.icon('chevron-left') + '</button>';
      for (var i = 1; i <= pages; i++) {
        html += '<button type="button" data-page="' + i + '"' + (i === state.page ? ' aria-current="page"' : '') + ' aria-label="' + i + ' 페이지">' + i + '</button>';
      }
      html += '<button type="button" data-page="' + (state.page + 1) + '"' + (state.page === pages ? ' disabled' : '') + ' aria-label="다음 페이지">' + WL.icon('chevron-right') + '</button>';
      nav.innerHTML = html;
    }
    WL.syncToggles(document.getElementById('resultGrid'));
  }

  var view = WL.stateView(document.getElementById('resultsView'), {
    resolve: function () { return currentList().length ? 'success' : 'empty'; },
    render: renderResults,
    messages: { success: '검색 결과를 불러왔습니다.', empty: '조건에 맞는 여행지가 없습니다.' }
  });

  function update(changes, opts) {
    Object.keys(changes).forEach(function (k) { state[k] = changes[k]; });
    if (!('page' in changes)) state.page = 1;
    syncUrl();
    renderFilters();
    document.getElementById('resultCount').innerHTML = summary(currentList().length);
    if (opts && opts.instant) {
      view.set(currentList().length ? 'success' : 'empty');
    } else {
      view.load();
    }
  }

  /* ---------- 이벤트 ---------- */
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    update({ q: keyword.value.trim() });
  });
  document.getElementById('regionChips').addEventListener('click', function (e) {
    var b = e.target.closest('[data-region]');
    if (b) update({ region: b.getAttribute('data-region') });
  });
  var typeTabs = document.getElementById('typeTabs');
  typeTabs.addEventListener('click', function (e) {
    var b = e.target.closest('[data-type]');
    if (b) update({ type: b.getAttribute('data-type') });
  });
  typeTabs.addEventListener('keydown', function (e) {
    var list = Array.prototype.slice.call(typeTabs.querySelectorAll('[role="tab"]'));
    var i = list.indexOf(document.activeElement);
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    var target = list[(next + list.length) % list.length];
    update({ type: target.getAttribute('data-type') });
    typeTabs.querySelector('[data-type="' + target.getAttribute('data-type') + '"]').focus();
  });
  sortSelect.addEventListener('change', function () { update({ sort: sortSelect.value }, { instant: true }); });
  document.getElementById('pagination').addEventListener('click', function (e) {
    var b = e.target.closest('[data-page]');
    if (!b || b.disabled) return;
    update({ page: Number(b.getAttribute('data-page')) }, { instant: true });
    document.getElementById('resultCount').scrollIntoView({ block: 'start' });
    WL.announce(state.page + '페이지를 보여줍니다.');
  });
  document.getElementById('resetFilters').addEventListener('click', function () {
    keyword.value = '';
    update({ region: '', type: '', q: '' });
    keyword.focus();
  });

  renderFilters();
})();
