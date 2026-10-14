/* GrowLog — Landing */
(function () {
  var activity = GL.data.activity;

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

  initHeroMotion();

  /* 스크롤 시 헤더 하단 구분선 표시 */
  var header = document.getElementById('siteHeader');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 스크롤 등장 효과 — 한 번 보이면 관찰 해제 */
  var targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  targets.forEach(function (el) { observer.observe(el); });

  /* ==========================================================================
     히어로 모션
     - 숫자 · 진행률을 0부터 올린다
     - 이후 '오늘 배운 점'을 한 글자씩 새로 쓰고, 저장되면 오늘 칸과 이번 달 기록 수가 올라간다
     - 넓은 화면 + 마우스에서는 마우스 위치 · 스크롤에 따라 카드가 서로 다른 깊이로 움직인다
     - 모션 줄이기 설정이면 아무것도 하지 않고(완성된 화면), 멈춤 버튼 · 화면 밖 · 탭 숨김 시 반복을 멈춘다
     ========================================================================== */
  function initHeroMotion() {
    var hero = document.getElementById('hero');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!hero || reduce.matches) return;

    var toggle = document.getElementById('motionToggle');
    var visual = hero.querySelector('.hero__visual');
    var note = hero.querySelector('[data-typing]');
    var saved = hero.querySelector('.mock-card__saved');
    var today = hero.querySelector('.mock-heatmap .is-today');
    var monthCount = hero.querySelector('.mock-stats [data-count="9"]');
    var paused = false;
    var visible = true;
    var timers = [];

    function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    /* 1) 숫자 · 진행률 카운트업 */
    function countUp(el, to, delay, duration, onFrame) {
      el.textContent = '0';
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
    hero.querySelectorAll('.mock-stats [data-count]').forEach(function (el, i) {
      countUp(el, Number(el.getAttribute('data-count')), 700 + i * 120, 1300);
    });
    var bar = hero.querySelector('[data-progress]');
    var barValue = hero.querySelector('.progress__value [data-count]');
    if (bar && barValue) {
      bar.value = 0;
      countUp(barValue, Number(bar.getAttribute('data-progress')), 1000, 1600, function (v) { bar.value = v; });
    }

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
      if (paused || !visible) return;
      entryIndex = (entryIndex + 1) % entries.length;
      if (entryIndex === 0) { added = 0; if (today) today.setAttribute('data-level', baseLevel); }
      var text = entries[entryIndex];
      var i = 0;
      note.textContent = '';
      note.classList.add('is-typing');
      (function typeChar() {
        if (paused || !visible) return;
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

    /* 3) 마우스 · 스크롤 깊이 (넓은 화면 + 정밀 포인터) */
    var wide = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    var frame = null;
    var px = 0, py = 0;
    function apply() {
      frame = null;
      var sy = Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1);
      visual.style.setProperty('--px', px.toFixed(3));
      visual.style.setProperty('--py', py.toFixed(3));
      visual.style.setProperty('--sy', sy.toFixed(3));
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(apply); }
    hero.addEventListener('pointermove', function (e) {
      if (!wide.matches || paused) return;
      var r = hero.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      schedule();
    });
    hero.addEventListener('pointerleave', function () { px = 0; py = 0; schedule(); });
    window.addEventListener('scroll', function () { if (wide.matches && visible) schedule(); }, { passive: true });

    /* 4) 멈춤 버튼 (WCAG 2.2.2 — 5초 넘게 자동으로 움직이는 내용은 멈출 수 있어야 한다) */
    toggle.hidden = false;
    var toggleText = toggle.querySelector('.motion-toggle__text');
    toggle.addEventListener('click', function () {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggleText.textContent = paused ? '움직임 다시 재생' : '움직임 멈추기';
      hero.classList.toggle('is-paused', paused);
      if (paused) { clearTimers(); note.classList.remove('is-typing'); px = 0; py = 0; schedule(); }
      else startLoop(600);
    });

    /* 화면 밖 · 탭 숨김이면 반복을 멈춘다 */
    function setVisible(v) {
      if (v === visible) return;
      visible = v;
      hero.classList.toggle('is-offscreen', !v);
      if (!v) { clearTimers(); note.classList.remove('is-typing'); }
      else if (!paused) startLoop(800);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { setVisible(entries[0].isIntersecting && !document.hidden); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { setVisible(!document.hidden); });

    startLoop(4200);
  }
})();
