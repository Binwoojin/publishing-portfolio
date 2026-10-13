(() => {
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== 모바일 메뉴 ===== */
  const header = document.getElementById('header');
  const toggle = header.querySelector('.header__toggle');
  const toggleLabel = toggle.querySelector('.blind');

  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? '메뉴 닫기' : '메뉴 열기';
  };

  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  header.querySelectorAll('.gnb a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* ===== 스크롤 시 헤더 구분선 ===== */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===== 현재 섹션 메뉴 표시 ===== */
  const navLinks = [...header.querySelectorAll('.gnb a')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          const current = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-current', current);
          if (current) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => {
      const section = document.querySelector(a.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* ===== 작업물 렌더링 ===== */
  const list = document.getElementById('project-list');
  const filter = document.querySelector('.filter');

  const escape = (str = '') =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const isExternal = (url) => /^https?:\/\//.test(url);
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

  const linkHtml = (url, label, title, iconId, modifier = '') => {
    if (!url) return '';
    const ext = isExternal(url) ? ' target="_blank" rel="noopener"' : '';
    const sr = isExternal(url) ? '(새 창)' : '';
    return `<a class="card__link ${modifier}" href="${escape(url)}"${ext}>${label}<span class="blind"> - ${escape(title)}${sr}</span>${icon(iconId)}</a>`;
  };

  const cardHtml = (p, i) => {
    const thumb = p.thumbnail
      ? `<img src="${escape(p.thumbnail)}" alt="" loading="lazy" decoding="async">`
      : `<span class="card__placeholder" aria-hidden="true">${escape((p.title || '?').charAt(0))}</span>`;
    const meta = [p.period, p.contribution].filter(Boolean).map(escape).join(' · ');
    const tags = (p.tags || []).map((t) => `<li>${escape(t)}</li>`).join('');

    return `
      <li class="card" data-reveal>
        <div class="card__thumb">
          ${thumb}
          <span class="card__index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        </div>
        <div class="card__body">
          <div class="card__top">
            ${p.category ? `<p class="card__category">${escape(p.category)}</p>` : '<span></span>'}
            ${meta ? `<p class="card__meta">${meta}</p>` : ''}
          </div>
          <h3 class="card__title">${escape(p.title)}</h3>
          ${p.desc ? `<p class="card__desc">${escape(p.desc)}</p>` : ''}
          ${tags ? `<ul class="card__tags" aria-label="사용 기술">${tags}</ul>` : ''}
          <div class="card__links">
            ${linkHtml(p.demo, '결과물 보기', p.title, 'i-arrow-up-right')}
            ${linkHtml(p.code, '코드 보기', p.title, 'i-code', 'card__link--sub')}
          </div>
        </div>
      </li>`;
  };

  const render = (category) => {
    const items = category === 'All' ? projects : projects.filter((p) => p.category === category);
    list.innerHTML = items.length
      ? items.map(cardHtml).join('')
      : '<li class="projects__empty">등록된 작업물이 아직 없습니다.</li>';
    observeReveal(list);
  };

  /* ===== 스크롤 등장 효과 ===== */
  const revealer = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' })
    : null;

  function observeReveal(root) {
    if (!revealer) return;
    root.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => revealer.observe(el));
  }

  if (revealer) document.documentElement.classList.add('js-reveal');

  const categories = ['All', ...new Set(projects.map((p) => p.category).filter(Boolean))];
  const countOf = (c) => (c === 'All' ? projects.length : projects.filter((p) => p.category === c).length);

  if (categories.length > 2) {
    filter.innerHTML = categories
      .map((c, i) => `<button type="button" class="filter__btn" data-category="${escape(c)}" aria-pressed="${i === 0}">${escape(c)}<span class="filter__count">${countOf(c)}</span></button>`)
      .join('');
    filter.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter__btn');
      if (!btn) return;
      filter.querySelectorAll('.filter__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render(btn.dataset.category);
    });
  } else {
    filter.hidden = true;
  }

  render('All');
  observeReveal(document);

  /* ===== 푸터 연도 ===== */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
