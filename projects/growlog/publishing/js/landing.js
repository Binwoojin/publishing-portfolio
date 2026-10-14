/* GrowLog — Landing */
(function () {
  var activity = GL.data.activity;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 히어로 · 대시보드 미리보기 히트맵 채우기 (최근 N일, 오래된 날짜부터) */
  document.querySelectorAll('[data-heatmap]').forEach(function (el) {
    var days = Number(el.getAttribute('data-heatmap'));
    var keys = Object.keys(activity).sort().slice(-days);
    el.innerHTML = keys.map(function (key) {
      return '<i data-level="' + Math.min(activity[key], 3) + '"></i>';
    }).join('');
    /* 등장 순서용 열(주) · 행(요일) 번호 */
    Array.prototype.forEach.call(el.children, function (cell, i) {
      cell.style.setProperty('--c', Math.floor(i / 7));
      cell.style.setProperty('--r', i % 7);
    });
    if (el.hasAttribute('data-live') && el.lastElementChild) el.lastElementChild.classList.add('is-today');
  });

  /* 스크롤 시 헤더 하단 구분선 표시 */
  var header = document.getElementById('siteHeader');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 공통: 0 → 목표값 카운트업 (원래 값은 HTML 에 있으므로 JS 가 없어도 올바르게 보인다) */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function countUp(el, to, delay, duration, onFrame) {
    el.textContent = '0';
    if (onFrame) onFrame(0);
    setTimeout(function () {
      var start = null;
      function step(now) {
        if (start === null) start = now;
        var t = Math.min((now - start) / duration, 1);
        var v = Math.round(to * easeOut(t));
        el.textContent = v;
        if (onFrame) onFrame(v);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
  }
  /* 영역 안의 [data-count] 숫자와 [data-progress] 진행 막대를 함께 올린다 */
  function countWithin(root, delay) {
    var bar = root.querySelector('[data-progress]');
    root.querySelectorAll('[data-count]').forEach(function (el, i) {
      var to = Number(el.getAttribute('data-count'));
      var isBarValue = bar && el.closest('.progress');
      countUp(el, to, delay + (isBarValue ? 300 : i * 120), isBarValue ? 1600 : 1300, isBarValue ? function (v) { bar.value = v; } : null);
    });
  }

  initHeroMotion();
  initSectionMotion();

  /* ==========================================================================
     히어로 모션
     - 숫자 · 진행률을 0부터 올린다
     - 이후 '오늘 배운 점'을 한 글자씩 새로 쓰고, 저장되면 오늘 칸과 이번 달 기록 수가 올라간다
     - 넓은 화면 + 마우스에서는 마우스 위치 · 스크롤에 따라 카드가 서로 다른 깊이로 움직인다
     - 모션 줄이기 설정이면 아무것도 하지 않고(완성된 화면), 화면 밖 · 탭 숨김 시 반복을 멈춘다
     ========================================================================== */
  function initHeroMotion() {
    var hero = document.getElementById('hero');
    if (!hero || reduce) return;

    var visual = hero.querySelector('.hero__visual');
    var note = hero.querySelector('[data-typing]');
    var saved = hero.querySelector('.mock-card__saved');
    var today = hero.querySelector('.mock-heatmap .is-today');
    var monthCount = hero.querySelector('.mock-stats [data-count="9"]');
    var visible = true;
    var timers = [];

    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* 1) 숫자 · 진행률 카운트업 */
    countWithin(hero.querySelector('.mock-card--main'), 700);
    countWithin(hero.querySelector('.mock-card--goal'), 700);

    /* 2) '오늘의 기록'이 계속 새로 쓰이는 반복 */
    var entries = [
      note.textContent,
      'IntersectionObserver 로 화면에 들어올 때만 애니메이션을 시작했다.',
      '모션 줄이기 설정을 켠 사용자에게는 완성된 화면을 바로 보여 준다.',
      'transform 과 opacity 만 움직이면 레이아웃을 다시 계산하지 않는다.'
    ];
    var entryIndex = 0;
    var baseLevel = today ? Number(today.getAttribute('data-level')) : 0;
    var baseCount = 9;
    var added = 0;

    function typeNext() {
      if (!visible) return;
      entryIndex = (entryIndex + 1) % entries.length;
      if (entryIndex === 0) { added = 0; if (today) today.setAttribute('data-level', baseLevel); }
      var text = entries[entryIndex];
      var i = 0;
      note.textContent = '';
      note.classList.add('is-typing');
      (function typeChar() {
        if (!visible) return;
        i += 1;
        note.textContent = text.slice(0, i);
        if (i < text.length) { later(typeChar, 38); return; }
        later(function () {
          note.classList.remove('is-typing');
          onSaved();
          later(typeNext, 3200);
        }, 450);
      })();
    }
    function onSaved() {
      added += 1;
      if (saved) { saved.classList.remove('is-on'); void saved.offsetWidth; saved.classList.add('is-on'); }
      if (monthCount) monthCount.textContent = baseCount + added;
      if (today) {
        today.setAttribute('data-level', Math.min(baseLevel + added, 3));
        today.classList.remove('is-bump'); void today.offsetWidth; today.classList.add('is-bump');
      }
    }
    function startLoop(delay) { clearTimers(); later(typeNext, delay); }

    /* 3) 마우스 깊이 (넓은 화면 + 정밀 포인터). 스크롤 깊이(--sy)는 아래 스크롤 루프에서 갱신 */
    var wide = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    var frame = null;
    var px = 0, py = 0;
    function apply() {
      frame = null;
      visual.style.setProperty('--px', px.toFixed(3));
      visual.style.setProperty('--py', py.toFixed(3));
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(apply); }
    hero.addEventListener('pointermove', function (e) {
      if (!wide.matches) return;
      var r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    });
    hero.addEventListener('pointerleave', function () { px = 0; py = 0; schedule(); });

    /* 화면 밖 · 탭 숨김이면 반복을 멈춘다 */
    function setVisible(v) {
      if (v === visible) return;
      visible = v;
      hero.classList.toggle('is-offscreen', !v);
      if (!v) { clearTimers(); note.classList.remove('is-typing'); }
      else startLoop(800);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (list) { setVisible(list[0].isIntersecting && !document.hidden); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { setVisible(!document.hidden); });

    startLoop(4200);
  }

  /* ==========================================================================
     히어로 아래 섹션 모션
     - [data-inview]: 화면에 들어오면 is-in → CSS 가 등장 연출을 시작
     - [data-split="words"]: 제목을 단어 단위로 나눠 흐릿한 글자가 하나씩 선명해진다(“보이지 않던 성장이 보인다”)
     - [data-scrub]: 스크롤 위치에 따라 0~1 의 --p 를 넣어, 흩어진 카드 정렬 · 성장 경로 채우기 등을 스크롤에 맞춰 움직인다
     - 페이지 맨 위 진행 막대, CTA 버튼이 마우스를 살짝 따라오는 효과
     ========================================================================== */
  function initSectionMotion() {
    var inview = document.querySelectorAll('[data-inview]');
    if (reduce || !('IntersectionObserver' in window)) {
      inview.forEach(function (el) { el.classList.add('is-in'); });
      document.querySelectorAll('.journey__step').forEach(function (el) { el.classList.add('is-active'); });
      return;
    }

    /* 단어 나누기 — 화면에는 단어 조각, 스크린리더에는 원래 문장 그대로 읽히도록 aria-label 은 두지 않고 텍스트만 감싼다 */
    document.querySelectorAll('[data-split="words"]').forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w, i) {
        return '<span class="word" style="--i:' + i + '">' + GL.esc(w) + '</span>';
      }).join(' ');
    });

    var counted = new WeakSet();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        observer.unobserve(el);
        if (el.hasAttribute('data-feature') && !counted.has(el)) {
          counted.add(el);
          countWithin(el, 500);
        }
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    inview.forEach(function (el) { observer.observe(el); });

    /* 스크롤 연동 (--p: 요소 위쪽이 화면 90% 지점에 닿을 때 0 → 요소가 화면 가운데쯤 오면 1) */
    var scrubs = Array.prototype.slice.call(document.querySelectorAll('[data-scrub]'));
    var steps = document.querySelectorAll('.journey__step');
    var bar = document.querySelector('.scroll-progress');
    var heroVisual = document.querySelector('.hero__visual');
    var hero = document.getElementById('hero');
    var frame = null;

    function update() {
      frame = null;
      var vh = window.innerHeight;
      scrubs.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var p = (vh * 0.9 - r.top) / (vh * 0.45 + r.height * 0.55);
        p = Math.min(Math.max(p, 0), 1);
        el.style.setProperty('--p', p.toFixed(3));
        if (el.classList.contains('journey-wrap')) {
          steps.forEach(function (step, i) { step.classList.toggle('is-active', p >= (i + 0.15) / steps.length); });
        }
      });
      var max = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ')';
      if (hero && heroVisual) heroVisual.style.setProperty('--sy', Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1).toFixed(3));
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();

    /* CTA 버튼: 넓은 화면 + 마우스에서 버튼이 포인터 쪽으로 살짝 끌려온다 */
    var band = document.querySelector('.cta-band');
    var cta = band && band.querySelector('.btn');
    var fine = window.matchMedia('(pointer: fine)');
    if (band && cta) {
      band.addEventListener('pointermove', function (e) {
        if (!fine.matches) return;
        var r = cta.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var dist = Math.hypot(dx, dy);
        var pull = dist < 220 ? (1 - dist / 220) : 0;
        cta.style.translate = (dx * pull * 0.35).toFixed(1) + 'px ' + (dy * pull * 0.35).toFixed(1) + 'px';
      });
      band.addEventListener('pointerleave', function () { cta.style.translate = ''; });
    }
  }

  /* 스크롤 등장 효과 — 한 번 보이면 관찰 해제 */
  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  targets.forEach(function (el) { revealObserver.observe(el); });
})();
