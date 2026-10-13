/*
 * WayLog 퍼블리싱 공통 스크립트
 * - 데이터 조회 · 문자열 이스케이프 · 날짜 포맷 · 이미지 경로
 * - 데모 로그인 상태, 저장(북마크) · 좋아요 상태 (localStorage, 실패 시 메모리)
 * - 헤더 회원 메뉴 · 모바일 메뉴 · 토스트 · 다이얼로그 · 화면 상태 전환
 * - 여러 화면에서 쓰는 카드 마크업
 */
window.WL = (function () {
  var D = window.WAYLOG;
  var HIDPI = ['hero-main', 'region-jeju', 'course-jeju', 'login-background', 'category-festival', 'hero-illustration'];

  /* ---------- 조회 ---------- */
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0] || null; }
  var find = {
    place: function (id) { return byId(D.places, id); },
    course: function (id) { return byId(D.courses, id); },
    region: function (id) { return byId(D.regions, id); },
    enjoy: function (id) { return byId(D.enjoy, id); },
    category: function (id) { return byId(D.enjoyCategories, id); },
    user: function (id) { return D.users[id] || { nickname: '알 수 없음' }; },
    post: function (id) { return byId(allPosts(), id); }
  };

  /* ---------- 문자열 · 날짜 ---------- */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function toDate(v) { return new Date(v.length === 10 ? v + 'T00:00:00' : v); }
  function formatDate(v, type) {
    var d = toDate(v);
    if (type === 'short') return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
    if (type === 'datetime') return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (type === 'relative') {
      var now = new Date(D.today + 'T23:00:00');
      var diff = Math.round((now - d) / 60000);
      if (diff < 60) return Math.max(diff, 1) + '분 전';
      if (diff < 1440) return Math.round(diff / 60) + '시간 전';
      if (diff < 1440 * 7) return Math.round(diff / 1440) + '일 전';
      return formatDate(v);
    }
    return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
  }
  function daysFromToday(v) { return Math.round((toDate(v) - toDate(D.today)) / 86400000); }
  function coord(lat, lng) { return lat.toFixed(4) + '°N ' + lng.toFixed(4) + '°E'; }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function icon(name, cls) { return '<svg class="icon' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>'; }

  /* 이미지: 800px WebP 기본, 큰 사진은 1600px 를 srcset 으로 */
  function img(name, alt, attrs) {
    /* 사용자가 올린 사진(data URL)은 그대로 쓴다 */
    if (/^(data|blob):/.test(name)) return '<img src="' + name + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async">';
    var src = 'images/' + name + '.webp';
    var set = HIDPI.indexOf(name) > -1 ? ' srcset="' + src + ' 800w, images/' + name + '@2x.webp 1600w" sizes="' + ((attrs && attrs.sizes) || '100vw') + '"' : '';
    return '<img src="' + src + '"' + set + ' alt="' + esc(alt || '') + '" loading="' + ((attrs && attrs.eager) ? 'eager' : 'lazy') + '" decoding="async" width="800" height="533">';
  }

  /* ---------- 저장소 (localStorage → 실패 시 메모리) ---------- */
  var memory = {};
  var store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem('waylog:' + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return key in memory ? memory[key] : fallback;
      }
    },
    set: function (key, value) {
      memory[key] = value;
      try { localStorage.setItem('waylog:' + key, JSON.stringify(value)); } catch (e) { /* 메모리만 사용 */ }
    }
  };

  /* ---------- 데모 로그인 ---------- */
  var auth = {
    isMember: function () { return store.get('auth', false) === true; },
    login: function () { store.set('auth', true); syncAuth(); },
    logout: function () { store.set('auth', false); syncAuth(); }
  };
  function syncAuth() {
    var member = auth.isMember();
    document.documentElement.classList.toggle('is-member', member);
    document.documentElement.classList.toggle('is-guest', !member);
  }

  /* ---------- 저장 · 좋아요 ---------- */
  function savedList(kind) { return store.get('saved-' + kind, defaults.saved[kind] || []); }
  var defaults = { saved: { place: ['p1', 'p8'], enjoy: ['e3'], post: ['f2'] }, liked: ['f2'] };
  function isSaved(kind, id) { return savedList(kind).indexOf(id) > -1; }
  function toggleSaved(kind, id) {
    var list = savedList(kind).slice();
    var i = list.indexOf(id);
    if (i > -1) list.splice(i, 1); else list.unshift(id);
    store.set('saved-' + kind, list);
    return i === -1;
  }
  function likedList() { return store.get('liked', defaults.liked); }
  function isLiked(id) { return likedList().indexOf(id) > -1; }
  function likeCount(post) { return post.likes + (isLiked(post.id) && defaults.liked.indexOf(post.id) === -1 ? 1 : 0) - (!isLiked(post.id) && defaults.liked.indexOf(post.id) > -1 ? 1 : 0); }
  function toggleLiked(id) {
    var list = likedList().slice();
    var i = list.indexOf(id);
    if (i > -1) list.splice(i, 1); else list.unshift(id);
    store.set('liked', list);
    return i === -1;
  }

  /* 내가 쓴 글 · 댓글 (데모: 브라우저에만 저장) */
  function allPosts() {
    var mine = store.get('my-posts', []);
    var removed = store.get('removed-posts', []);
    return mine.concat(D.posts).filter(function (p) { return removed.indexOf(p.id) === -1; });
  }
  function commentsOf(post) {
    var added = store.get('comments-' + post.id, []);
    var removed = store.get('removed-comments', []);
    return post.comments.concat(added).filter(function (c) { return removed.indexOf(c.id) === -1; });
  }

  /* ---------- 토스트 · 스크린리더 알림 ---------- */
  var live;
  function announce(msg) {
    if (!live) {
      live = document.createElement('div');
      live.className = 'blind';
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 50);
  }
  function toast(msg) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var t = document.createElement('p');
    t.className = 'toast';
    t.innerHTML = icon('check') + '<span>' + esc(msg) + '</span>';
    wrap.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-leaving');
      setTimeout(function () { t.remove(); }, 250);
    }, 2600);
  }
  function flash(msg) { try { sessionStorage.setItem('waylog:flash', msg); } catch (e) { /* 무시 */ } }

  /* ---------- 다이얼로그 ---------- */
  var lastTrigger = null;
  function openDialog(dialog, trigger) {
    lastTrigger = trigger || document.activeElement;
    dialog.showModal();
  }
  function bindDialog(dialog) {
    if (dialog.dataset.bound) return;
    dialog.dataset.bound = '1';
    dialog.addEventListener('close', function () {
      /* 닫은 뒤 포커스를 직접 옮긴 경우(예: 새 게시물)에는 트리거로 되돌리지 않는다 */
      if (dialog.dataset.skipReturn) { delete dialog.dataset.skipReturn; return; }
      if (!lastTrigger) return;
      var key = lastTrigger.getAttribute && lastTrigger.getAttribute('data-focus-key');
      var target = document.contains(lastTrigger) ? lastTrigger : key ? document.querySelector('[data-focus-key="' + key + '"]') : null;
      if (target) target.focus();
    });
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog && !dialog.hasAttribute('data-busy')) dialog.close();
    });
    dialog.addEventListener('cancel', function (e) {
      if (dialog.hasAttribute('data-busy')) e.preventDefault();
    });
    dialog.querySelectorAll('[data-dialog-close]').forEach(function (b) {
      b.addEventListener('click', function () { dialog.close(); });
    });
  }

  /* 로그인이 필요한 동작 → 안내 다이얼로그 */
  function requireLogin(trigger, what) {
    if (auth.isMember()) return true;
    var dialog = document.getElementById('loginRequired');
    if (!dialog) {
      document.body.insertAdjacentHTML('beforeend',
        '<dialog class="dialog" id="loginRequired" aria-labelledby="loginRequiredTitle">' +
        '<div class="dialog__inner"><h2 class="dialog__title" id="loginRequiredTitle">로그인이 필요해요</h2>' +
        '<p class="dialog__desc" id="loginRequiredDesc"></p>' +
        '<div class="dialog__actions"><button class="btn btn--outline" type="button" data-dialog-close>닫기</button>' +
        '<a class="btn btn--primary" id="loginRequiredGo" href="login.html">로그인하기</a></div></div></dialog>');
      dialog = document.getElementById('loginRequired');
      bindDialog(dialog);
    }
    document.getElementById('loginRequiredDesc').textContent = (what || '이 기능') + '은(는) 로그인한 뒤 이용할 수 있어요. 데모 계정으로 바로 로그인할 수 있습니다.';
    document.getElementById('loginRequiredGo').href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
    openDialog(dialog, trigger);
    return false;
  }

  /* ---------- 저장 · 좋아요 버튼 (위임) ---------- */
  var KIND_LABEL = { place: '여행지', enjoy: '즐길거리', post: '게시물' };
  function syncToggles(root) {
    (root || document).querySelectorAll('[data-save]').forEach(function (btn) {
      var parts = btn.getAttribute('data-save').split(':');
      var on = auth.isMember() && isSaved(parts[0], parts[1]);
      btn.setAttribute('aria-pressed', String(on));
      var label = btn.querySelector('[data-save-label]');
      if (label) label.textContent = on ? '저장됨' : '저장';
    });
    (root || document).querySelectorAll('[data-like]').forEach(function (btn) {
      var id = btn.getAttribute('data-like');
      var post = find.post(id);
      var on = auth.isMember() && isLiked(id);
      btn.setAttribute('aria-pressed', String(on));
      var count = btn.querySelector('[data-like-count]');
      if (count && post) count.textContent = auth.isMember() ? likeCount(post) : post.likes;
    });
  }
  document.addEventListener('click', function (e) {
    var save = e.target.closest('[data-save]');
    var like = e.target.closest('[data-like]');
    if (save) {
      e.preventDefault();
      var p = save.getAttribute('data-save').split(':');
      if (!requireLogin(save, KIND_LABEL[p[0]] + ' 저장')) return;
      var on = toggleSaved(p[0], p[1]);
      syncToggles();
      toast(on ? KIND_LABEL[p[0]] + '을(를) 저장했어요.' : '저장을 해제했어요.');
      document.dispatchEvent(new CustomEvent('waylog:saved'));
    }
    if (like) {
      e.preventDefault();
      if (!requireLogin(like, '좋아요')) return;
      var liked = toggleLiked(like.getAttribute('data-like'));
      syncToggles();
      announce(liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.');
    }
  });

  /* ---------- 카드 마크업 ---------- */
  function saveFab(kind, id, name) {
    return '<button class="save-fab" type="button" data-save="' + kind + ':' + id + '" aria-pressed="false" aria-label="' + esc(name) + ' 저장">' + icon('bookmark') + '</button>';
  }
  function placeCard(p, opts) {
    var r = find.region(p.region);
    return '<article class="place-card">' +
      '<div class="place-card__media">' + img(p.image, '', { sizes: '(min-width: 1024px) 25vw, 50vw' }) +
      '<span class="place-card__badge chip chip--photo">' + esc(D.types[p.type]) + '</span>' + saveFab('place', p.id, p.name) + '</div>' +
      '<div><h3 class="place-card__title"><a href="place.html?id=' + p.id + '">' + esc(p.name) + '</a></h3>' +
      '<p class="place-card__meta"><span>' + icon('pin') + esc(r.name) + '</span><span class="mono">' + coord(p.lat, p.lng) + '</span></p></div>' +
      ((opts && opts.desc) ? '<p class="place-card__desc">' + esc(p.desc) + '</p>' : '') +
      '</article>';
  }
  function festivalStatus(item) {
    if (!item.start) return null;
    var s = daysFromToday(item.start), e = daysFromToday(item.end);
    if (e < 0) return { label: '종료', cls: '' };
    if (s <= 0) return { label: '진행 중', cls: 'chip--coral' };
    return { label: 'D-' + s, cls: 'chip--sea' };
  }
  function enjoyCard(item) {
    var cat = find.category(item.category);
    var st = festivalStatus(item);
    var period = item.start ? '<span>' + icon('calendar') + '<span class="mono">' + formatDate(item.start) + (item.end !== item.start ? ' – ' + formatDate(item.end).slice(5) : '') + '</span></span>' : '';
    return '<article class="place-card">' +
      '<div class="place-card__media">' + img(item.image, '', { sizes: '(min-width: 1024px) 25vw, 50vw' }) +
      '<span class="place-card__badge chip ' + (st ? st.cls || 'chip--photo' : 'chip--photo') + '">' + (st ? st.label : esc(cat.name)) + '</span>' + saveFab('enjoy', item.id, item.name) + '</div>' +
      '<div><h3 class="place-card__title"><a href="enjoy.html?category=' + item.category + '#' + item.id + '">' + esc(item.name) + '</a></h3>' +
      '<p class="place-card__meta">' + period + '<span>' + icon('pin') + esc(item.place) + '</span></p></div>' +
      '<p class="place-card__desc">' + esc(item.desc) + '</p></article>';
  }
  function courseCard(c) {
    var r = find.region(c.region);
    var stops = c.stops.map(function (s) { return '<li>' + esc(s.name) + '</li>'; }).join('');
    return '<article class="course-card">' +
      '<div class="course-card__media">' + img(c.image, '', { sizes: '(min-width: 1024px) 33vw, 90vw' }) + '</div>' +
      '<div class="course-card__body">' +
      '<p class="course-card__meta"><span class="chip chip--sea">' + esc(c.days) + '</span><span>' + esc(r.name) + ' · ' + esc(c.theme) + '</span></p>' +
      '<h3 class="course-card__title"><a href="course.html?id=' + c.id + '">' + esc(c.title) + '</a></h3>' +
      '<ol class="course-card__stops" aria-label="코스 경로 ' + c.stops.length + '곳">' + stops + '</ol>' +
      '</div></article>';
  }
  function avatar(user, size) {
    return '<span class="avatar' + (size ? ' avatar--' + size : '') + '" aria-hidden="true">' +
      (user.image ? '<img src="images/' + user.image + '.webp" alt="">' : esc(user.nickname.charAt(0))) + '</span>';
  }
  function postCard(post) {
    var u = find.user(post.author);
    var place = post.place ? find.place(post.place) : null;
    var course = post.course ? find.course(post.course) : null;
    var imgs = post.images.slice(0, 3);
    var gallery = imgs.length ? '<div class="post-card__gallery post-card__gallery--' + imgs.length + '">' + imgs.map(function (name, i) {
      return '<figure>' + img(name, post.images.length > 1 ? '사진 ' + (i + 1) + ' / ' + post.images.length : '첨부 사진', { sizes: '(min-width: 768px) 640px, 100vw' }) + '</figure>';
    }).join('') + '</div>' : '';
    var commentCount = commentsOf(post).length;
    return '<article class="post-card" aria-labelledby="post-' + post.id + '-author">' +
      '<header class="post-card__head">' + avatar(u) +
      '<p class="post-card__who"><strong id="post-' + post.id + '-author">' + esc(u.nickname) + '</strong>' +
      '<time datetime="' + post.date + '">' + formatDate(post.date, 'relative') + '</time></p></header>' +
      gallery +
      '<p class="post-card__text">' + esc(post.text) + '</p>' +
      ((place || course || post.tags.length) ? '<ul class="post-card__tags" aria-label="태그">' +
        (place ? '<li><a class="chip chip--coral" href="place.html?id=' + place.id + '">' + icon('pin') + esc(place.name) + '</a></li>' : '') +
        (course ? '<li><a class="chip chip--sea" href="course.html?id=' + course.id + '">' + icon('route') + esc(course.title) + '</a></li>' : '') +
        post.tags.map(function (t) { return '<li><span class="chip">#' + esc(t) + '</span></li>'; }).join('') + '</ul>' : '') +
      '<footer class="post-card__actions">' +
      '<button class="toggle" type="button" data-like="' + post.id + '" aria-pressed="false">' + icon('heart') + '<span class="blind">좋아요</span><span data-like-count>' + post.likes + '</span></button>' +
      '<a class="toggle" href="post.html?id=' + post.id + '">' + icon('comment') + '<span class="blind">댓글</span>' + commentCount + '<span class="blind">개 · 게시물 보기</span></a>' +
      '<button class="toggle toggle--save" type="button" data-save="post:' + post.id + '" aria-pressed="false" style="margin-left:auto">' + icon('bookmark') + '<span data-save-label>저장</span></button>' +
      '</footer></article>';
  }

  /* ---------- 화면 상태 전환 ---------- */
  function stateView(root, options) {
    options = options || {};
    var panels = root.querySelectorAll('[data-state]');
    var demoButtons = document.querySelectorAll('[data-demo-state]');
    function set(name, silent) {
      panels.forEach(function (p) { p.hidden = p.getAttribute('data-state') !== name; });
      root.setAttribute('aria-busy', String(name === 'loading'));
      demoButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-demo-state') === name)); });
      if (name === 'success' && options.render) options.render();
      if (!silent && options.messages && options.messages[name]) announce(options.messages[name]);
    }
    function load() {
      set('loading', true);
      setTimeout(function () { set(options.resolve ? options.resolve() : 'success'); }, 600);
    }
    demoButtons.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-demo-state')); }); });
    root.addEventListener('click', function (e) { if (e.target.closest('[data-retry]')) load(); });
    var initial = param('state');
    if (initial && root.querySelector('[data-state="' + initial + '"]')) set(initial, true); else load();
    return { set: set, load: load };
  }

  /* ---------- 공통 초기화 ---------- */
  function init() {
    syncAuth();
    document.querySelectorAll('dialog').forEach(bindDialog);
    document.querySelectorAll('[data-me-nickname]').forEach(function (el) { el.textContent = D.me.nickname; });
    document.querySelectorAll('[data-me-initial]').forEach(function (el) { el.textContent = D.me.nickname.charAt(0); });

    /* 회원 메뉴 펼침 */
    var menuBtn = document.getElementById('userMenuBtn');
    var menuList = document.getElementById('userMenuList');
    if (menuBtn) {
      var close = function (focus) {
        menuBtn.setAttribute('aria-expanded', 'false');
        menuList.hidden = true;
        if (focus) menuBtn.focus();
      };
      menuBtn.addEventListener('click', function () {
        var open = menuBtn.getAttribute('aria-expanded') !== 'true';
        menuBtn.setAttribute('aria-expanded', String(open));
        menuList.hidden = !open;
        if (open) menuList.querySelector('a, button').focus();
      });
      document.addEventListener('click', function (e) { if (!e.target.closest('.user-menu')) close(); });
      menuList.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
    }

    /* 모바일 메뉴 */
    var drawer = document.getElementById('drawer');
    document.querySelectorAll('[data-open-drawer]').forEach(function (b) {
      b.addEventListener('click', function () { openDialog(drawer, b); });
    });

    /* 데모 로그아웃 */
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function () {
        auth.logout();
        syncToggles();
        flash('로그아웃했어요.');
        location.href = 'index.html';
      });
    });

    var msg = null;
    try { msg = sessionStorage.getItem('waylog:flash'); sessionStorage.removeItem('waylog:flash'); } catch (e) { /* 무시 */ }
    if (msg) toast(msg);
    syncToggles();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return {
    data: D, find: find, esc: esc, formatDate: formatDate, daysFromToday: daysFromToday, coord: coord, param: param, icon: icon, img: img,
    store: store, auth: auth, isSaved: isSaved, savedList: savedList, allPosts: allPosts, commentsOf: commentsOf,
    toast: toast, flash: flash, announce: announce, openDialog: openDialog, bindDialog: bindDialog, requireLogin: requireLogin,
    syncToggles: syncToggles, placeCard: placeCard, enjoyCard: enjoyCard, courseCard: courseCard, postCard: postCard, avatar: avatar,
    festivalStatus: festivalStatus, stateView: stateView
  };
})();
