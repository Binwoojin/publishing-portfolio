/* WayLog — 홈 */
(function () {
  var D = WL.data;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var indicator = null;

  /* 지역 레일 */
  document.getElementById('regionRail').innerHTML = D.regions.map(function (r) {
    var count = D.places.filter(function (p) { return p.region === r.id; }).length;
    return '<li><a class="region-tile" href="destinations.html?region=' + r.id + '">' + WL.img(r.image, '', { sizes: '(min-width: 1200px) 290px, 220px' }) +
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
    onTabChange(tab);
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

  /* ==========================================================================
     홈 모션 (모션 줄이기 설정이면 아무것도 하지 않고 완성된 화면을 그대로 둔다)
     ========================================================================== */

  /* 즐길거리 탭: 표시줄을 선택한 탭 아래로 미끄러뜨리고, 카드를 다시 등장시킨다 */
  function onTabChange(tab, positionOnly) {
    if (reduce) return;
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'tabs__indicator';
      indicator.setAttribute('aria-hidden', 'true');
      tabs.appendChild(indicator);
      tabs.classList.add('has-indicator');
    }
    var inset = 12;
    indicator.style.width = Math.max(tab.offsetWidth - inset * 2, 0) + 'px';
    indicator.style.transform = 'translateX(' + (tab.offsetLeft + inset) + 'px)';
    if (positionOnly) return;
    panel.classList.remove('is-swapping');
    void panel.offsetWidth;
    panel.classList.add('is-swapping');
  }
  if (!reduce) {
    /* 글꼴 · 화면 폭이 바뀌면 탭 너비가 달라지므로 표시줄 위치만 다시 맞춘다 */
    var realign = function () { onTabChange(tabs.querySelector('[aria-selected="true"]'), true); };
    window.addEventListener('resize', realign);
    if (document.fonts) document.fonts.ready.then(realign);
  }

  if (reduce) return;

  /* 영문 머리글을 잠깐 뒤섞었다가 원래 글자로 맞춘다 */
  var GLYPHS = 'ABCDEFGHJKLMNOPRSTUVWXYZ0123456789·';
  function scramble(el, duration) {
    var text = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', text);
    /* 글자를 바꿀 때마다 스타일 · 레이아웃을 다시 계산하므로 매 프레임이 아니라 약 15회/초로만 바꾼다 */
    var start = Date.now();
    (function step() {
      var t = Math.min((Date.now() - start) / duration, 1);
      var fixed = Math.floor(text.length * t);
      el.textContent = t < 1 ? text.split('').map(function (ch, i) {
        if (i < fixed || ch === ' ' || ch === '–' || ch === '.') return ch;
        return GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }).join('') : text;
      if (t < 1) setTimeout(step, 66);
    })();
  }

  /* 1) 히어로 ------------------------------------------------------------ */
  var hero = document.querySelector('.hero');

  /* 검색어 예시를 한 글자씩 바꿔 쓴다 (입력을 시작하면 멈춤) */
  var keyword = document.getElementById('heroKeyword');
  var examples = ['야경 명소', '숲길 산책', '성산일출봉', '바다 드라이브', '전통시장'];
  var exIndex = 0, typing = null, typingStopped = false;
  function typeExample() {
    if (typingStopped) return;
    var word = examples[exIndex % examples.length];
    exIndex += 1;
    var i = 0;
    (function tick() {
      if (typingStopped) return;
      i += 1;
      keyword.setAttribute('placeholder', '예: ' + word.slice(0, i));
      typing = setTimeout(i < word.length ? tick : typeExample, i < word.length ? 110 : 2200);
    })();
  }
  function stopTyping() {
    typingStopped = true;
    clearTimeout(typing);
    keyword.setAttribute('placeholder', '예: 야경, 숲길, 성산일출봉');
  }
  keyword.addEventListener('focus', stopTyping);
  keyword.addEventListener('input', stopTyping);
  setTimeout(typeExample, 1600);

  /* 여행자 점이 경로를 따라 계속 돈다 — 지나는 핀을 튕기고 HUD 에 지금 · 다음 지점을 표시한다 */
  var path = document.getElementById('heroRoutePath');
  var traveler = document.getElementById('routeTraveler');
  var pins = Array.prototype.slice.call(document.querySelectorAll('.route-pin'));
  var hud = document.querySelector('.hero__hud');
  var hudName = document.getElementById('hudName');
  var hudNext = document.getElementById('hudNext');
  var hudLeg = document.getElementById('hudLeg');
  var heroVisible = true;
  /* 경로는 넓은 화면에서만 보이므로, 그때만 첫 화면을 다 그린 뒤 계산 · 재생한다 */
  var routeShown = window.matchMedia('(min-width: 1024px)').matches;
  if (path && traveler && path.getTotalLength && routeShown) setTimeout(startTraveler, 3400);
  function startTraveler() {
    var total = path.getTotalLength();
    /* 핀 좌표와 가장 가까운 경로 위치(길이): 굵게 훑은 뒤 그 주변만 촘촘히 찾는다 */
    function nearest(x, y, from, to, step) {
      var best = from, bestD = Infinity;
      for (var l = Math.max(from, 0); l <= Math.min(to, total); l += step) {
        var pt = path.getPointAtLength(l);
        var d = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y);
        if (d < bestD) { bestD = d; best = l; }
      }
      return best;
    }
    var stops = pins.map(function (pin) {
      var m = /translate\(([\d.]+) ([\d.]+)\)/.exec(pin.getAttribute('transform'));
      var x = Number(m[1]), y = Number(m[2]);
      var rough = nearest(x, y, 0, total, 24);
      var label = pin.querySelector('text');
      return { at: nearest(x, y, rough - 24, rough + 24, 2), pin: pin, name: label.textContent };
    });
    var LOOP = 11000;
    var startAt = null, lastStop = -1, elapsed = 0, prevNow = null;
    function hit(i) {
      var s = stops[i];
      s.pin.classList.remove('is-hit'); void s.pin.getBoundingClientRect(); s.pin.classList.add('is-hit');
      hudName.textContent = s.name;
      hudNext.textContent = i < stops.length - 1 ? '다음 · ' + stops[i + 1].name : '도착 · 다시 출발';
      hudLeg.textContent = (i + 1) + '/' + stops.length;
      hud.classList.remove('is-tick'); void hud.offsetWidth; hud.classList.add('is-tick');
    }
    function move(now) {
      if (prevNow !== null && heroVisible) elapsed += now - prevNow;
      prevNow = now;
      if (heroVisible) {
        var t = (elapsed % LOOP) / LOOP;
        /* 출발 · 도착 부근에서 천천히 */
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var len = e * total;
        var pt = path.getPointAtLength(len);
        traveler.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
        var reached = -1;
        stops.forEach(function (s, i) { if (len >= s.at - 1) reached = i; });
        if (reached !== lastStop) { lastStop = reached; if (reached >= 0) hit(reached); }
      }
      requestAnimationFrame(move);
    }
    traveler.classList.add('is-moving');
    requestAnimationFrame(move);
  }

  /* 2) 섹션 등장 ---------------------------------------------------------- */
  document.querySelectorAll('.region-rail li, .course-grid .course-card, .news-list .news-item, .notices li').forEach(function (el) {
    el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentNode.children, el));
  });
  document.querySelectorAll('.course-card__stops li').forEach(function (li, i, all) {
    li.style.setProperty('--s', Array.prototype.indexOf.call(li.parentNode.children, li));
  });
  var inviewTargets = document.querySelectorAll('.section-head, .notices__title, .region-rail, .course-grid, .news-list, .record-banner, .notices');
  var flipped = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-in');
      io.unobserve(el);
      el.querySelectorAll('.section-head__eyebrow, .region-tile__en').forEach(function (s, i) {
        setTimeout(function () { scramble(s, 900); }, i * 60);
      });
      if (el.classList.contains('news-list') && !flipped) { flipped = true; flipDates(el); }
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  inviewTargets.forEach(function (el) { io.observe(el); });

  /* 날짜가 출발 안내판처럼 몇 번 넘어간 뒤 실제 날짜에 멈춘다 */
  function flipDates(list) {
    list.querySelectorAll('.news-item__date strong').forEach(function (el, n) {
      var target = el.textContent;
      var flips = 6 + n * 2;
      var k = 0;
      (function flip() {
        k += 1;
        el.classList.remove('is-flip'); void el.offsetWidth; el.classList.add('is-flip');
        el.textContent = k >= flips ? target : String(Math.floor(Math.random() * 31) + 1).padStart(2, '0');
        if (k < flips) setTimeout(flip, 90);
      })();
    });
  }

  /* 3) 스크롤 연동: 경로 진행 막대 · 히어로 사진 시차 · 사진 시차(--p) -------- */
  var header = document.querySelector('.site-header');
  var progress = document.createElement('span');
  progress.className = 'route-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span class="route-progress__fill"></span><span class="route-progress__pin"></span>';
  header.appendChild(progress);
  var fill = progress.firstChild, head = progress.lastChild;
  var heroImg = document.querySelector('.hero__media img');
  var scrubs = Array.prototype.slice.call(document.querySelectorAll('.course-card, .record-banner'));
  var frame = null;
  function update() {
    frame = null;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    var r = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    /* 먼저 모두 읽고(위치) 나중에 한꺼번에 쓴다 — 읽기 · 쓰기를 섞으면 매번 레이아웃을 다시 계산한다 */
    var rects = scrubs.map(function (el) { return el.getBoundingClientRect(); });
    fill.style.transform = 'scaleX(' + r.toFixed(4) + ')';
    head.style.transform = 'translate(calc(' + (r * headerWidth).toFixed(1) + 'px - 50%), -50%)';
    head.style.opacity = r > 0.004 ? '1' : '0';
    if (heroImg && window.scrollY < vh * 1.2) heroImg.style.setProperty('--hy', (window.scrollY * 0.35).toFixed(1));
    scrubs.forEach(function (el, i) {
      var b = rects[i];
      if (b.bottom < 0 || b.top > vh) return;
      el.style.setProperty('--p', Math.min(Math.max((vh - b.top) / (vh + b.height), 0), 1).toFixed(3));
    });
  }
  var headerWidth = header.clientWidth;
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', function () { headerWidth = header.clientWidth; schedule(); });
  schedule();

  /* 히어로가 화면 밖이면 반복 모션을 멈춘다 */
  new IntersectionObserver(function (list) {
    heroVisible = list[0].isIntersecting;
    hero.classList.toggle('is-offscreen', !heroVisible);
  }).observe(hero);
})();
