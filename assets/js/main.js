(() => {
  const projects = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];

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

  /* ===== 스크롤 시 헤더 그림자 ===== */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===== 작업물 렌더링 ===== */
  const list = document.getElementById('project-list');
  const filter = document.querySelector('.filter');

  const escape = (str = '') =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const isExternal = (url) => /^https?:\/\//.test(url);

  const linkHtml = (url, label, title) => {
    if (!url) return '';
    const ext = isExternal(url) ? ' target="_blank" rel="noopener"' : '';
    const sr = isExternal(url) ? '<span class="blind">(새 창)</span>' : '';
    return `<a class="card__link" href="${escape(url)}"${ext}>${label}<span class="blind"> - ${escape(title)}</span>${sr}</a>`;
  };

  const cardHtml = (p) => {
    const thumb = p.thumbnail
      ? `<img src="${escape(p.thumbnail)}" alt="" loading="lazy">`
      : `<span class="card__placeholder" aria-hidden="true">${escape((p.title || '?').charAt(0))}</span>`;
    const meta = [p.period, p.contribution].filter(Boolean).map(escape).join(' · ');
    const tags = (p.tags || []).map((t) => `<li>${escape(t)}</li>`).join('');

    return `
      <li class="card">
        <div class="card__thumb">${thumb}</div>
        <div class="card__body">
          ${p.category ? `<p class="card__category">${escape(p.category)}</p>` : ''}
          <h3 class="card__title">${escape(p.title)}</h3>
          ${p.desc ? `<p class="card__desc">${escape(p.desc)}</p>` : ''}
          ${meta ? `<p class="card__meta">${meta}</p>` : ''}
          ${tags ? `<ul class="card__tags" aria-label="사용 기술">${tags}</ul>` : ''}
          <div class="card__links">
            ${linkHtml(p.demo, '결과물 보기', p.title)}
            ${linkHtml(p.code, '코드 보기', p.title)}
          </div>
        </div>
      </li>`;
  };

  const render = (category) => {
    const items = category === 'All' ? projects : projects.filter((p) => p.category === category);
    list.innerHTML = items.length
      ? items.map(cardHtml).join('')
      : '<li class="projects__empty">등록된 작업물이 아직 없습니다.</li>';
  };

  const categories = ['All', ...new Set(projects.map((p) => p.category).filter(Boolean))];

  if (categories.length > 2) {
    filter.innerHTML = categories
      .map((c, i) => `<button type="button" class="filter__btn" aria-pressed="${i === 0}">${escape(c)}</button>`)
      .join('');
    filter.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter__btn');
      if (!btn) return;
      filter.querySelectorAll('.filter__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render(btn.textContent);
    });
  } else {
    filter.hidden = true;
  }

  render('All');

  /* ===== 푸터 연도 ===== */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
