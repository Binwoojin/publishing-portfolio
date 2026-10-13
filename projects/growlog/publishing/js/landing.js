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
  });

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
})();
