(() => {
  /* 작업물 상세 페이지
     project.html?id=growlog → data/cases/growlog.json 을 읽어 9개 구성으로 그립니다.
     데이터가 비어 있는 구성은 건너뛰고, 번호는 보이는 순서대로 다시 매깁니다. */

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.getElementById('case');

  const escape = (str = '') =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (url = '') => (/^\s*(javascript|data|vbscript):/i.test(url) ? '' : String(url).trim());
  const isExternal = (url) => /^https?:\/\//.test(url);
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const pad = (n) => String(n).padStart(2, '0');
  const list = (arr) => (Array.isArray(arr) ? arr.filter((v) => v !== null && v !== undefined && v !== '') : []);
  const has = (v) => (Array.isArray(v) ? list(v).length > 0 : typeof v === 'string' ? v.trim() !== '' : !!v);

  const linkAttrs = (url) => (isExternal(url) ? ' target="_blank" rel="noopener"' : '');
  const newWin = (url) => (isExternal(url) ? '<span class="blind">(새 창)</span>' : '');

  const loadJson = (url) => fetch(url, { cache: 'no-cache' }).then((res) => {
    if (!res.ok) throw Object.assign(new Error(`${url}: ${res.status}`), { status: res.status });
    return res.json();
  });

  /* ===== 헤더 진행 막대 · 구분선 ===== */
  const header = document.getElementById('header');
  const progress = header.querySelector('.header__progress');
  let ticking = false;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ===== 이미지 크게 보기 버튼 (dialog#zoom 으로 엶) ===== */
  const zoomBtn = (src, alt, label, extra = '') =>
    `<button type="button" class="zoom-btn${extra}" data-zoom="${escape(src)}" data-zoom-alt="${escape(alt)}">${icon('i-zoom')}<span class="zoom-btn__text">${escape(label)}</span></button>`;

  /* ===== 구조 비교: 1차 버전 · 리디자인 화면을 나란히 두고 같은 역할의 영역에 같은 번호 표시 =====
     regions[].before / after = [x, y, 너비, 높이] (이미지 크기에 대한 %). before 가 없으면 새로 추가한 영역(+) */
  const validBox = (b) => Array.isArray(b) && b.length === 4 && b.every((n) => typeof n === 'number' && Number.isFinite(n));
  const boxStyle = (b) => `left:${b[0]}%;top:${b[1]}%;width:${b[2]}%;height:${b[3]}%`;

  const structureHtml = (p, regions, before, after) => {
    let n = 0;
    const marks = regions.map((r) => (validBox(r.before) ? String(++n) : '+'));
    const boxes = (side) => regions.map((r, i) => {
      const b = side === 'before' ? r.before : r.after;
      if (!validBox(b)) return '';
      const isNew = marks[i] === '+';
      return `<span class="ba__box${isNew ? ' ba__box--new' : ''}" data-region="${i}" style="${boxStyle(b)}"><span class="ba__badge">${marks[i]}</span></span>`;
    }).join('');
    return `
            <div class="ba__structure">
              <div class="ba__panes">
                <figure class="ba__pane">
                  <figcaption class="ba__pane-label"><span>Before</span>1차 버전</figcaption>
                  <div class="ba__shot">
                    <img src="${escape(before)}" alt="개선 전: ${escape(p.beforeAlt || '')}" loading="lazy" decoding="async">
                    <div class="ba__boxes" aria-hidden="true">${boxes('before')}</div>
                    ${zoomBtn(before, `개선 전: ${p.beforeAlt || ''}`, `${p.title || ''} 개선 전 크게 보기`, ' zoom-btn--icon')}
                  </div>
                </figure>
                <figure class="ba__pane">
                  <figcaption class="ba__pane-label ba__pane-label--after"><span>After</span>리디자인</figcaption>
                  <div class="ba__shot">
                    <img src="${escape(after)}" alt="개선 후: ${escape(p.afterAlt || '')}" loading="lazy" decoding="async">
                    <div class="ba__boxes" aria-hidden="true">${boxes('after')}</div>
                    ${zoomBtn(after, `개선 후: ${p.afterAlt || ''}`, `${p.title || ''} 개선 후 크게 보기`, ' zoom-btn--icon')}
                  </div>
                </figure>
              </div>
              <ol class="ba__legend">${regions.map((r, i) => `
                <li>
                  <button type="button" class="ba__key${marks[i] === '+' ? ' ba__key--new' : ''}" data-region="${i}" aria-pressed="false">
                    <span class="ba__badge" aria-hidden="true">${marks[i]}</span>
                    <span class="ba__key-text">
                      <span class="ba__key-label">${marks[i] === '+' ? '<span class="blind">새로 추가: </span>' : ''}${escape(r.label)}</span>
                      ${r.note ? `<span class="ba__key-note">${escape(r.note)}</span>` : ''}
                    </span>
                  </button>
                </li>`).join('')}
              </ol>
            </div>`;
  };

  /* ===== 구성별 마크업 ===== */
  const SECTIONS = [
    { key: 'overview', title: 'Project Overview', ko: '프로젝트 소개' },
    { key: 'role', title: 'My Role', ko: '담당 범위' },
    { key: 'beforeAfter', title: 'Before & After', ko: '개선 전 · 후 비교' },
    { key: 'process', title: 'Design Process', ko: '디자인 개선 과정' },
    { key: 'publishing', title: 'Publishing', ko: 'HTML · CSS · JS 구현' },
    { key: 'responsive', title: 'Responsive', ko: 'PC · 태블릿 · 모바일 대응' },
    { key: 'accessibility', title: 'Accessibility', ko: '접근성 개선' },
    { key: 'troubleshooting', title: 'Troubleshooting', ko: '구현 중 해결한 문제' },
    { key: 'result', title: 'Result', ko: '결과 · 회고' },
  ];

  const render = {
    overview: (d) => {
      const o = d.overview || {};
      const facts = list(o.facts).filter((f) => f.label && f.value);
      if (!has(o.text) && !facts.length) return '';
      return `
        <div class="case-overview">
          ${has(o.text) ? `<p class="case-lead">${escape(o.text)}</p>` : ''}
          ${facts.length ? `<dl class="case-facts" data-stagger>${facts.map((f) => `
            <div><dt>${escape(f.label)}</dt><dd>${escape(f.value)}</dd></div>`).join('')}
          </dl>` : ''}
        </div>`;
    },

    role: (d) => {
      const r = d.role || {};
      const items = list(r.items);
      const ai = list(r.ai);
      if (!has(r.text) && !items.length && !ai.length) return '';
      const listHtml = (arr) => `<ol class="case-role" data-stagger>${arr.map((it, i) => `
          <li><span class="case-role__num" aria-hidden="true">${pad(i + 1)}</span><span>${escape(it)}</span></li>`).join('')}
        </ol>`;
      return `
        ${has(r.text) ? `<p class="case-lead">${escape(r.text)}</p>` : ''}
        ${items.length || ai.length ? `
        <div class="case-role-cols">
          ${items.length ? `<div><h3 class="case-sub">직접 판단 · 확인한 일</h3>${listHtml(items)}</div>` : ''}
          ${ai.length ? `<div><h3 class="case-sub">Claude Code가 보조한 일</h3>${listHtml(ai)}</div>` : ''}
        </div>` : ''}`;
    },

    beforeAfter: (d) => {
      const pairs = list(d.beforeAfter).filter((p) => p.before && p.after);
      if (!pairs.length) return '';
      const anyRegions = pairs.some((p) => list(p.regions).length);
      const intro = has(d.beforeAfterIntro)
        ? escape(d.beforeAfterIntro)
        : '가운데 손잡이를 좌우로 끌거나, 손잡이에 포커스를 두고 ← → 키로 1차 버전(왼쪽)과 리디자인(오른쪽)을 비교할 수 있습니다.';
      return `
        <p class="case-lead">${intro}</p>
        <div class="ba-list">${pairs.map((p, i) => {
          const before = safeUrl(p.before);
          const after = safeUrl(p.after);
          const name = escape(p.title || `화면 ${i + 1}`);
          const regions = list(p.regions).filter((r) => r && r.label && validBox(r.after));
          return `
          <div class="ba" data-reveal>
            <div class="ba__top">
              <h3 class="ba__title"><span aria-hidden="true">${pad(i + 1)}</span>${name}</h3>
              ${regions.length ? `
              <div class="ba__modes" role="group" aria-label="${name} 비교 방식">
                <button type="button" class="ba__mode" data-mode="structure" aria-pressed="true">영역 비교</button>
                <button type="button" class="ba__mode" data-mode="slider" aria-pressed="false">슬라이더 비교</button>
              </div>` : ''}
            </div>
            ${regions.length ? structureHtml(p, regions, before, after) : ''}
            <div class="ba__slider"${regions.length ? ' hidden' : ''}>
              <figure class="compare" style="--pos:50%">
                <img class="compare__img" src="${escape(before)}" alt="개선 전: ${escape(p.beforeAlt || '')}" loading="lazy" decoding="async">
                <div class="compare__after">
                  <img class="compare__img" src="${escape(after)}" alt="개선 후: ${escape(p.afterAlt || '')}" loading="lazy" decoding="async">
                </div>
                <span class="compare__tag compare__tag--before" aria-hidden="true">Before</span>
                <span class="compare__tag compare__tag--after" aria-hidden="true">After</span>
                <span class="compare__handle" aria-hidden="true">${icon('i-drag')}</span>
                <input class="compare__range" type="range" min="0" max="100" value="50"
                  aria-label="${name} 개선 전 · 후 비교 위치. 값이 클수록 개선 전 화면이 넓게 보입니다.">
                <figcaption class="blind">${name} 화면의 개선 전 · 후 비교</figcaption>
              </figure>
              <div class="ba__jump" role="group" aria-label="${name} 비교 위치 바로 이동">
                <button type="button" data-pos="100">개선 전</button>
                <button type="button" data-pos="50">반반</button>
                <button type="button" data-pos="0">개선 후</button>
              </div>
              <div class="ba__zooms">
                ${zoomBtn(before, `개선 전: ${p.beforeAlt || ''}`, '개선 전 크게 보기')}
                ${zoomBtn(after, `개선 후: ${p.afterAlt || ''}`, '개선 후 크게 보기')}
              </div>
            </div>
            <div class="ba__notes">
              ${has(p.kept) ? `<div class="ba__note ba__note--before"><p class="ba__label">${icon('i-check')}유지한 정보 · 흐름</p><p>${escape(p.kept)}</p></div>` : ''}
              ${has(p.redesign) ? `<div class="ba__note ba__note--after"><p class="ba__label">${icon('i-spark')}개선한 레이아웃 · 기능</p><p>${escape(p.redesign)}</p></div>` : ''}
              ${!has(p.kept) && has(p.problem) ? `<div class="ba__note ba__note--before"><p class="ba__label">${icon('i-alert')}개선 전 문제</p><p>${escape(p.problem)}</p></div>` : ''}
              ${!has(p.redesign) && has(p.improvement) ? `<div class="ba__note ba__note--after"><p class="ba__label">${icon('i-spark')}개선 내용</p><p>${escape(p.improvement)}</p></div>` : ''}
            </div>
          </div>`;
        }).join('')}
        </div>`;
    },

    process: (d) => {
      const pr = d.process || {};
      const steps = list(pr.steps).filter((s) => s.title || s.text);
      const tokens = list(pr.tokens).filter((t) => t.value);
      const decisions = list(pr.decisions).filter((x) => x.title);
      if (!has(pr.text) && !steps.length && !tokens.length && !decisions.length) return '';
      const STEPS = [['problem', '문제'], ['reason', '선택 이유'], ['implementation', '구현'], ['result', '확인 결과']];
      return `
        ${has(pr.text) ? `<p class="case-lead">${escape(pr.text)}</p>` : ''}
        ${decisions.length ? `
        <h3 class="case-sub">대표 개선 판단</h3>
        <ol class="case-decisions">${decisions.map((x, i) => `
          <li class="decision" data-reveal>
            <h4 class="decision__title"><span aria-hidden="true">${pad(i + 1)}</span>${escape(x.title)}</h4>
            <dl class="decision__flow">${STEPS.filter(([k]) => has(x[k])).map(([k, label]) => `
              <div class="decision__step decision__step--${k}"><dt>${label}</dt><dd>${escape(x[k])}</dd></div>`).join('')}
            </dl>
          </li>`).join('')}
        </ol>
        <h3 class="case-sub">디자인 과정</h3>` : ''}
        ${steps.length ? `<ol class="case-steps" data-stagger>${steps.map((s, i) => `
          <li class="case-step">
            <span class="case-step__num">Step ${pad(i + 1)}</span>
            <h3 class="case-step__title">${escape(s.title || '')}</h3>
            ${s.text ? `<p>${escape(s.text)}</p>` : ''}
          </li>`).join('')}
        </ol>` : ''}
        ${tokens.length ? `
        <h3 class="case-sub">주요 색상 토큰</h3>
        <ul class="case-tokens" data-stagger>${tokens.map((t) => {
          const color = /^#[0-9a-f]{3,8}$/i.test(t.value) ? t.value : 'transparent';
          return `
          <li class="case-token">
            <span class="case-token__swatch" style="background:${color}" aria-hidden="true"></span>
            <span class="case-token__name">${escape(t.name || '')}</span>
            <code class="case-token__value">${escape(t.value)}</code>
            ${t.note ? `<span class="case-token__note">${escape(t.note)}</span>` : ''}
          </li>`;
        }).join('')}
        </ul>` : ''}`;
    },

    publishing: (d) => {
      const groups = list(d.publishing).filter((g) => list(g.items).length);
      if (!groups.length) return '';
      return `
        <div class="case-pub" data-stagger>${groups.map((g) => `
          <div class="case-pub__col">
            <h3 class="case-pub__title">${escape(g.title || '')}</h3>
            <ul class="case-bullets">${list(g.items).map((it) => `<li>${escape(it)}</li>`).join('')}</ul>
          </div>`).join('')}
        </div>`;
    },

    responsive: (d) => {
      const r = d.responsive || {};
      const shots = list(r.shots).filter((s) => s.image);
      if (!has(r.text) && !shots.length) return '';
      return `
        ${has(r.text) ? `<p class="case-lead">${escape(r.text)}</p>` : ''}
        ${shots.length ? `<ul class="case-devices" data-stagger>${shots.map((s) => `
          <li class="case-device">
            <figure>
              <div class="case-device__frame"><img src="${escape(safeUrl(s.image))}" alt="${escape(s.alt || '')}" loading="lazy" decoding="async">
                ${zoomBtn(safeUrl(s.image), s.alt || '', `${s.label || ''} 화면 크게 보기`, ' zoom-btn--icon')}</div>
              <figcaption>${escape(s.label || '')}</figcaption>
            </figure>
          </li>`).join('')}
        </ul>` : ''}`;
    },

    accessibility: (d) => {
      const items = list(d.accessibility);
      if (!items.length) return '';
      return `
        <ul class="case-checks" data-stagger>${items.map((it) => `
          <li>${icon('i-check')}<span>${escape(it)}</span></li>`).join('')}
        </ul>`;
    },

    troubleshooting: (d) => {
      const items = list(d.troubleshooting).filter((t) => t.title || t.problem);
      if (!items.length) return '';
      return `
        <ol class="case-trouble">${items.map((t, i) => `
          <li class="trouble" data-reveal>
            <h3 class="trouble__title"><span aria-hidden="true">${pad(i + 1)}</span>${escape(t.title || '')}</h3>
            <dl class="trouble__body">
              ${t.problem ? `<div><dt>문제</dt><dd>${escape(t.problem)}</dd></div>` : ''}
              ${t.solution ? `<div><dt>해결</dt><dd>${escape(t.solution)}</dd></div>` : ''}
            </dl>
          </li>`).join('')}
        </ol>`;
    },

    result: (d) => {
      const r = d.result || {};
      const metrics = list(r.metrics).filter((m) => m.value);
      const v = r.verification || null;
      const limits = list(r.limitations);
      if (!metrics.length && !has(r.text) && !has(r.retrospective) && !v && !limits.length) return '';
      const report = v ? safeUrl(v.report) : '';
      return `
        ${metrics.length ? `<dl class="case-metrics" data-stagger>${metrics.map((m) => `
          <div><dt>${escape(m.label || '')}</dt><dd>${escape(m.value)}</dd>${m.note ? `<dd class="case-metrics__note">${escape(m.note)}</dd>` : ''}</div>`).join('')}
        </dl>` : ''}
        ${has(r.text) ? `<p class="case-lead case-lead--small">${escape(r.text)}</p>` : ''}
        ${v ? `
        <div class="case-verify" data-reveal>
          <div class="case-verify__head">
            <h3 class="case-sub">측정 근거</h3>
            ${v.measuredAt ? `<p class="case-verify__date">측정일 <time datetime="${escape(v.measuredAt)}">${escape(String(v.measuredAt).replace(/-/g, '.'))}</time></p>` : ''}
          </div>
          ${list(v.items).length ? `<table class="case-verify__table">
            <caption class="blind">자동 검사 결과</caption>
            <thead><tr><th scope="col">검사</th><th scope="col">결과</th><th scope="col">범위</th></tr></thead>
            <tbody>${list(v.items).map((it) => `<tr><th scope="row">${escape(it.label || '')}</th><td>${escape(it.value || '')}</td><td>${escape(it.scope || '')}</td></tr>`).join('')}</tbody>
          </table>` : ''}
          ${list(v.conditions).length ? `<p class="case-verify__label">검사 조건</p><ul class="case-bullets">${list(v.conditions).map((c) => `<li>${escape(c)}</li>`).join('')}</ul>` : ''}
          ${has(v.note) ? `<p class="case-verify__note">${escape(v.note)}</p>` : ''}
          ${report ? `<a class="btn btn--line case-verify__link" href="${escape(report)}"${linkAttrs(report)}>화면별 검증 보고서 보기${icon('i-arrow-up-right')}</a>` : ''}
        </div>` : ''}
        ${limits.length ? `
        <div class="case-limits" data-reveal>
          <h3 class="case-sub">한계와 다음 단계</h3>
          <ul class="case-bullets">${limits.map((l) => `<li>${escape(l)}</li>`).join('')}</ul>
        </div>` : ''}
        ${has(r.retrospective) ? `
        <div class="case-retro" data-reveal>
          <h3 class="case-sub">회고</h3>
          ${String(r.retrospective).split(/\n{2,}/).map((para) => `<p>${escape(para.trim())}</p>`).join('')}
        </div>` : ''}`;
    },
  };

  /* 대표 미디어: coverVideo(.mp4, 같은 이름의 .webm 도 함께 둔다) 가 있으면 자동 재생 · 반복 · 음소거 영상(포스터 = coverPoster 또는 cover), 없으면 대표 이미지.
     모션 줄이기 설정이면 자동 재생하지 않고 포스터와 재생 버튼(controls)만 보여 준다. */
  const coverMedia = (d) => {
    const cover = safeUrl(d.cover);
    const video = safeUrl(d.coverVideo);
    /* 같은 이름의 .webm 이 있으면 먼저 쓰고(VP9), 지원하지 않는 브라우저는 .mp4(H.264)로 */
    const webm = video && /\.mp4$/i.test(video) ? video.replace(/\.mp4$/i, '.webm') : '';
    const poster = safeUrl(d.coverPoster) || cover;
    const label = `${d.title || ''} 리디자인 화면`;
    if (video) {
      return `<figure class="inner case-hero__cover case-hero__cover--video">
          <video class="case-hero__video"${poster ? ` poster="${escape(poster)}"` : ''} width="1280" height="800"
            muted loop playsinline preload="${reduceMotion ? 'none' : 'auto'}"${reduceMotion ? ' controls' : ' autoplay'}
            aria-label="${escape(label)} 동작 미리보기 (소리 없음)">
            ${webm ? `<source src="${escape(webm)}" type="video/webm">` : ''}
            <source src="${escape(video)}" type="video/mp4">
          </video>
        </figure>`;
    }
    return cover ? `<figure class="inner case-hero__cover"><img src="${escape(cover)}" alt="${escape(label)}" fetchpriority="high"></figure>` : '';
  };

  const heroHtml = (d) => {
    const demo = safeUrl(d.demo);
    const tools = list(d.tools);
    return `
      <header class="case-hero">
        <div class="inner">
          <p class="case-hero__eyebrow"><span class="hero__dot" aria-hidden="true"></span>Case Study${d.subtitle ? ` · ${escape(d.subtitle)}` : ''}</p>
          <h1 class="case-hero__title">${escape(d.title || '')}</h1>
          ${has(d.summary) ? `<p class="case-hero__summary">${escape(d.summary)}</p>` : ''}
          <dl class="case-hero__meta">
            ${d.period ? `<div><dt>Period</dt><dd>${escape(d.period)}</dd></div>` : ''}
            ${d.contribution ? `<div><dt>Contribution</dt><dd>${escape(d.contribution)}</dd></div>` : ''}
            ${tools.length ? `<div><dt>Tools</dt><dd>${tools.map(escape).join(' · ')}</dd></div>` : ''}
          </dl>
          <div class="case-hero__actions">
            ${demo ? `<a class="btn btn--primary" href="${escape(demo)}"${linkAttrs(demo)}>Live Demo 보기${newWin(demo)}${icon('i-arrow-up-right')}</a>` : ''}
          </div>
        </div>
        ${coverMedia(d)}
      </header>`;
  };

  const nextHtml = (next) => (next ? `
    <nav class="case-next" aria-label="다른 작업물">
      <div class="inner">
        <a class="case-next__link" href="project.html?id=${encodeURIComponent(next.caseStudy)}">
          <span class="case-next__label">다음 작업물</span>
          <span class="case-next__title">${escape(next.title)}${icon('i-arrow-right')}</span>
        </a>
      </div>
    </nav>` : '');

  /* ===== Before & After 비교 슬라이더 ===== */
  const setupCompare = () => {
    root.querySelectorAll('.compare').forEach((fig) => {
      const range = fig.querySelector('.compare__range');
      const firstImg = fig.querySelector('.compare__img');
      const update = () => {
        const v = Number(range.value);
        fig.style.setProperty('--pos', `${v}%`);
        range.setAttribute('aria-valuetext', `개선 전 ${v}% · 개선 후 ${100 - v}%`);
      };
      range.addEventListener('input', update);
      update();

      // 원본 이미지 비율대로 틀 크기 맞추기
      const fit = () => {
        if (firstImg.naturalWidth) fig.style.aspectRatio = `${firstImg.naturalWidth} / ${firstImg.naturalHeight}`;
      };
      if (firstImg.complete) fit();
      else firstImg.addEventListener('load', fit, { once: true });

      const jump = fig.nextElementSibling;
      jump.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-pos]');
        if (!btn) return;
        fig.classList.add('is-jumping');
        range.value = btn.dataset.pos;
        update();
        setTimeout(() => fig.classList.remove('is-jumping'), 450);
      });
    });
  };

  /* ===== 구조 비교 상호작용 + 비교 방식 전환 ===== */
  const setupStructure = () => {
    root.querySelectorAll('.ba').forEach((ba) => {
      const structure = ba.querySelector('.ba__structure');
      const slider = ba.querySelector('.ba__slider');
      const modes = ba.querySelectorAll('.ba__mode');
      modes.forEach((btn) => btn.addEventListener('click', () => {
        const toSlider = btn.dataset.mode === 'slider';
        modes.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        if (structure) structure.hidden = toSlider;
        slider.hidden = !toSlider;
      }));
      if (!structure) return;

      let pinned = null;
      const highlight = (idx) => {
        structure.classList.toggle('has-active', idx !== null);
        structure.querySelectorAll('[data-region]').forEach((el) => {
          el.classList.toggle('is-active', idx !== null && el.dataset.region === idx);
        });
      };
      const keys = structure.querySelectorAll('.ba__key');
      keys.forEach((key) => {
        const idx = key.dataset.region;
        key.addEventListener('mouseenter', () => highlight(idx));
        key.addEventListener('mouseleave', () => highlight(pinned));
        key.addEventListener('focus', () => highlight(idx));
        key.addEventListener('blur', () => highlight(pinned));
        key.addEventListener('click', () => {
          pinned = pinned === idx ? null : idx;
          keys.forEach((k) => k.setAttribute('aria-pressed', String(k.dataset.region === pinned)));
          highlight(pinned);
        });
      });
      structure.querySelectorAll('.ba__box').forEach((box) => {
        box.addEventListener('mouseenter', () => highlight(box.dataset.region));
        box.addEventListener('mouseleave', () => highlight(pinned));
      });
    });
  };

  /* ===== 대표 영상: 화면에 보일 때만 재생 ===== */
  const setupCoverVideo = () => {
    const video = root.querySelector('.case-hero__video');
    if (!video || reduceMotion) return;
    video.muted = true; // innerHTML 로 넣은 muted 속성만으로는 자동 재생이 막히는 브라우저가 있어 직접 지정
    const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };
    if (!('IntersectionObserver' in window)) { play(); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) play(); else video.pause(); });
    }, { threshold: 0.15 }).observe(video);
  };

  /* ===== 이미지 크게 보기 ===== */
  const setupZoom = () => {
    const dialog = document.getElementById('zoom');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = dialog.querySelector('.zoom__img');
    const title = dialog.querySelector('.zoom__title');
    const fit = dialog.querySelector('.zoom__fit');
    const setNatural = (on) => {
      dialog.classList.toggle('is-natural', on);
      fit.setAttribute('aria-pressed', String(on));
      fit.textContent = on ? '화면에 맞추기' : '원본 크기로 보기';
    };
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-zoom]');
      if (!btn) return;
      img.src = btn.dataset.zoom;
      img.alt = btn.dataset.zoomAlt || '';
      title.textContent = btn.querySelector('.zoom-btn__text').textContent.replace(/ ?크게 보기$/, '');
      setNatural(false);
      dialog.showModal();
    });
    fit.addEventListener('click', () => setNatural(!dialog.classList.contains('is-natural')));
    dialog.querySelector('.zoom__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  };

  /* ===== 목차 + 현재 구성 표시 ===== */
  const setupToc = () => {
    const links = [...root.querySelectorAll('.case-toc a, .case-toc-mobile a')];
    const mobile = root.querySelector('.case-toc-mobile');
    const current = mobile && mobile.querySelector('.case-toc-mobile__current');
    if (mobile) mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { mobile.open = false; }));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          const on = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
        const sec = SECTIONS.find((x) => x.key === entry.target.id);
        if (current && sec) current.textContent = sec.title;
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    root.querySelectorAll('.case-section').forEach((s) => spy.observe(s));
  };

  /* ===== 스크롤 등장 효과 (main.js 와 같은 규칙) ===== */
  const setupReveal = () => {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    root.querySelectorAll('[data-stagger]').forEach((g) => {
      [...g.children].forEach((c, i) => c.style.setProperty('--i', i));
    });
    root.querySelectorAll('[data-reveal], [data-stagger], .section__head').forEach((el) => io.observe(el));
  };

  const showError = (message) => {
    root.removeAttribute('aria-busy');
    root.innerHTML = `
      <div class="inner case__status">
        <p>${escape(message)}</p>
        <a class="btn btn--line" href="./#projects">${icon('i-arrow-left')}전체 작업물로 돌아가기</a>
      </div>`;
  };

  /* ===== 시작 ===== */
  const id = new URLSearchParams(location.search).get('id') || '';
  if (!/^[a-z0-9-]+$/.test(id)) {
    showError('작업물을 찾을 수 없습니다.');
    return;
  }

  loadJson('data/site.json').then((site) => {
    if (site.name) document.querySelectorAll('[data-site="name"]').forEach((el) => { el.textContent = site.name; });
  }).catch(() => {});

  Promise.all([
    loadJson(`data/cases/${id}.json`),
    loadJson('data/projects.json').catch(() => []),
  ]).then(([data, projects]) => {
    const visible = SECTIONS
      .map((s) => ({ ...s, html: render[s.key](data) }))
      .filter((s) => s.html && s.html.trim());

    const withCase = (Array.isArray(projects) ? projects : []).filter((p) => p && p.caseStudy && p.title);
    const idx = withCase.findIndex((p) => p.caseStudy === id);
    const next = withCase.length > 1 && idx !== -1 ? withCase[(idx + 1) % withCase.length] : null;

    document.title = `${data.title || '작업물 상세'} | Binwoojin`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && data.summary) desc.setAttribute('content', data.summary);

    root.innerHTML = `
      ${heroHtml(data)}
      <details class="case-toc-mobile">
        <summary class="inner"><span class="case-toc-mobile__label">${icon('i-list')}목차</span><span class="case-toc-mobile__current" aria-hidden="true">${visible[0] ? visible[0].title : ''}</span></summary>
        <nav class="inner" aria-label="상세 목차 (모바일)">
          <ol>${visible.map((s, i) => `
            <li><a href="#${s.key}"><span aria-hidden="true">${pad(i + 1)}</span>${s.title}</a></li>`).join('')}
          </ol>
        </nav>
      </details>
      <div class="inner case__body">
        <nav class="case-toc" aria-label="상세 목차">
          <ol>${visible.map((s, i) => `
            <li><a href="#${s.key}"><span aria-hidden="true">${pad(i + 1)}</span>${s.title}</a></li>`).join('')}
          </ol>
        </nav>
        <div class="case__content">${visible.map((s, i) => `
          <section class="case-section" id="${s.key}" aria-labelledby="${s.key}-title">
            <header class="section__head case-section__head">
              <p class="section__num">${pad(i + 1)}</p>
              <h2 class="section__title case-section__title" id="${s.key}-title">${s.title}</h2>
              <p class="section__desc">${s.ko}</p>
            </header>
            ${s.html}
          </section>`).join('')}
        </div>
      </div>
      ${nextHtml(next)}`;
    root.removeAttribute('aria-busy');

    setupCompare();
    setupStructure();
    setupZoom();
    setupToc();
    setupReveal();
    setupCoverVideo();
    onScroll();

    // 주소에 #before-after 처럼 위치가 있으면 그리기 후 이동
    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }).catch((err) => {
    console.warn('작업물 상세를 불러오지 못했습니다.', err);
    showError(err.status === 404
      ? '작업물을 찾을 수 없습니다.'
      : '작업물 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
