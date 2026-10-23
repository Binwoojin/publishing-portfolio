(() => {
  let projects = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== 글자 단위로 나누기 (제목 모션용) =====
     글자마다 <span class="{className}" style="--i:n"> 로 감싸고, 다음 번호를 돌려줍니다. */
  const splitChars = (node, className, start = 0) => {
    let index = start;
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...child.textContent.replace(/\s+/g, ' ')].forEach((ch) => {
          if (ch === ' ') {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const span = document.createElement('span');
          span.className = className;
          span.style.setProperty('--i', index++);
          span.textContent = ch;
          frag.appendChild(span);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        index = splitChars(child, className, index);
      }
    });
    return index;
  };

  /* ===== 첫 화면 제목 모션 ===== */
  const hero = document.querySelector('.hero');
  const heroTitle = hero && hero.querySelector('.hero__title');
  if (heroTitle && document.documentElement.classList.contains('hero-anim')) {
    // 스크린리더는 글자 조각 대신 문장 전체를 읽도록
    heroTitle.setAttribute('aria-label', heroTitle.textContent.replace(/\s+/g, ' ').trim());

    let index = 0;
    heroTitle.querySelectorAll('.hero__line').forEach((line) => {
      line.setAttribute('aria-hidden', 'true');
      index = splitChars(line, 'hero__char', index);
    });

    const titleEnd = index * 35 + 120 + 500;
    hero.style.setProperty('--mark-delay', `${titleEnd}ms`);
    hero.style.setProperty('--after-title', `${Math.max(titleEnd - 300, 400)}ms`);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      hero.classList.add('is-ready');
      // 등장이 끝난 뒤에 hover 반응 켜기
      setTimeout(() => {
        heroTitle.querySelectorAll('.hero__char').forEach((c) => c.classList.add('is-settled'));
      }, titleEnd + 400);
    }));
  }

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

  /* ===== 스크롤 시 헤더 구분선 + 읽기 진행 막대 ===== */
  const progress = header.querySelector('.header__progress');
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
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
  const safeUrl = (url = '') => (/^\s*(javascript|data|vbscript):/i.test(url) ? '' : String(url).trim());
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

  const linkHtml = (url, label, title, iconId, modifier = '') => {
    url = safeUrl(url);
    if (!url) return '';
    const ext = isExternal(url) ? ' target="_blank" rel="noopener"' : '';
    const sr = isExternal(url) ? '(새 창)' : '';
    return `<a class="card__link ${modifier}" href="${escape(url)}"${ext}>${label}<span class="blind"> - ${escape(title)}${sr}</span>${icon(iconId)}</a>`;
  };

  // 상세페이지(data/cases/{caseStudy}.json)가 있는 작업물은 'Case Study 보기'를 먼저 보여줌
  const caseLink = (p) => (/^[a-z0-9-]+$/.test(p.caseStudy || '')
    ? `<a class="card__link" href="work/${p.caseStudy}/">Case Study 보기<span class="blind"> - ${escape(p.title)} 개선 과정</span>${icon('i-arrow-right')}</a>`
    : '');

  const cardHtml = (p, i) => {
    const thumbSrc = safeUrl(p.thumbnail);
    const thumb = thumbSrc
      ? `<img src="${escape(thumbSrc)}" alt="" loading="lazy" decoding="async">`
      : `<span class="card__placeholder" aria-hidden="true">${escape((p.title || '?').charAt(0))}</span>`;
    const meta = [p.period, p.contribution].filter(Boolean).map(escape).join(' · ');
    const tags = (p.tags || []).map((t) => `<li>${escape(t)}</li>`).join('');

    return `
      <li class="card" data-reveal style="--i:${i % 2}">
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
            ${caseLink(p)}
            ${linkHtml(p.demo, 'Live Demo 보기', p.title, 'i-arrow-up-right', p.caseStudy ? 'card__link--sub' : '')}
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
    // data-stagger: 자식 요소가 차례로 등장
    root.querySelectorAll('[data-stagger]').forEach((group) => {
      [...group.children].forEach((child, i) => child.style.setProperty('--i', i));
    });
    root.querySelectorAll('[data-reveal]:not(.is-visible), [data-stagger]:not(.is-visible)').forEach((el) => revealer.observe(el));
  }

  if (revealer) {
    document.documentElement.classList.add('js-reveal');
    // 섹션 제목을 글자 단위로 나눠 한 글자씩 올라오게
    document.querySelectorAll('.section__title').forEach((title) => {
      title.setAttribute('aria-label', title.textContent.trim());
      const inner = document.createElement('span');
      inner.className = 'section__title-inner';
      inner.setAttribute('aria-hidden', 'true');
      inner.append(...title.childNodes);
      title.appendChild(inner);
      splitChars(inner, 'section__char');
    });
  }

  const setupFilter = () => {
    const categories = ['All', ...new Set(projects.map((p) => p.category).filter(Boolean))];
    const countOf = (c) => (c === 'All' ? projects.length : projects.filter((p) => p.category === c).length);

    if (categories.length <= 2) {
      filter.hidden = true;
      return;
    }
    filter.innerHTML = categories
      .map((c, i) => `<button type="button" class="filter__btn" data-category="${escape(c)}" aria-pressed="${i === 0}">${escape(c)}<span class="filter__count">${countOf(c)}</span></button>`)
      .join('');
    filter.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter__btn');
      if (!btn) return;
      filter.querySelectorAll('.filter__btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render(btn.dataset.category);
    });
  };

  /* ===== 사이트 정보 (data/site.json) ===== */
  const applySite = (site) => {
    document.querySelectorAll('[data-site]').forEach((el) => {
      const value = site[el.dataset.site];
      if (typeof value === 'string' && value.trim()) el.textContent = value.trim();
    });

    if (site.name) document.title = `${site.name} | Web Publisher Portfolio`;

    const email = (site.email || '').trim();
    if (email) {
      document.querySelectorAll('[data-site-email]').forEach((el) => {
        el.href = `mailto:${email}`;
        if (!el.children.length) el.textContent = email;
      });
      document.querySelectorAll('[data-site-email-text]').forEach((el) => { el.textContent = email; });
    }

    const github = safeUrl(site.github);
    if (github) {
      document.querySelectorAll('[data-site-github]').forEach((el) => { el.href = github; });
      // 보이는 글자에는 아이디(닉네임)를 쓰지 않고 'GitHub 프로필'로 둔다 (사이트 이름 외에는 본명만 노출)
    }

    const skills = Array.isArray(site.skills) ? site.skills.filter((s) => s && s.name) : [];
    if (skills.length) {
      const skillList = document.getElementById('skill-list');
      skillList.innerHTML = skills.map((s) => `
          <li class="skill">
            ${s.area ? `<p class="skill__area" lang="en">${escape(s.area)}</p>` : ''}
            <h3 class="skill__name">${escape(s.name)}</h3>
            ${s.desc ? `<p class="skill__desc">${escape(s.desc)}</p>` : ''}
          </li>`).join('');
      [...skillList.children].forEach((li, i) => li.style.setProperty('--i', i));
    }

    // 걸어온 과정: 경력을 단계별로 요약 (회사별 세부 업무는 이력서에)
    const journey = Array.isArray(site.journey) ? site.journey.filter((j) => j && j.title) : [];
    if (journey.length) {
      const journeyList = document.getElementById('journey-list');
      journeyList.innerHTML = journey.map((j) => `
            <li class="journey__item">
              ${j.period ? `<p class="journey__period">${escape(j.period)}</p>` : ''}
              <div class="journey__head">
                <h4 class="journey__title">${escape(j.title)}</h4>
                ${j.places ? `<p class="journey__places">${escape(j.places)}</p>` : ''}
              </div>
              ${j.text ? `<p class="journey__text">${escape(j.text)}</p>` : ''}
            </li>`).join('');
      [...journeyList.children].forEach((li, i) => li.style.setProperty('--i', i));
    }
  };

  const loadJson = (url) => fetch(url, { cache: 'no-cache' }).then((res) => {
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  });

  observeReveal(document);
  list.innerHTML = '<li class="projects__empty">작업물을 불러오는 중입니다.</li>';

  loadJson('data/site.json')
    .then(applySite)
    .catch((err) => console.warn('사이트 정보를 불러오지 못했습니다.', err));

  loadJson('data/projects.json')
    .then((data) => { projects = Array.isArray(data) ? data.filter((p) => p && p.title) : []; })
    .catch((err) => console.warn('작업물 목록을 불러오지 못했습니다.', err))
    .finally(() => {
      setupFilter();
      render('All');
    });

  /* ===== 푸터 연도 ===== */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
