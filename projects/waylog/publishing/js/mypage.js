/* WayLog — 마이페이지 (내가 쓴 글 · 저장한 항목 · 계정 설정) */
(function () {
  var D = WL.data;
  var NICK_PATTERN = /^[가-힣a-zA-Z0-9]{2,12}$/;
  var RULES = { length: /^.{8,20}$/, letter: /[A-Za-z]/, number: /\d/, special: /[^A-Za-z0-9]/ };
  var kind = 'place';

  function myPosts() { return WL.allPosts().filter(function (p) { return p.author === D.me.id; }); }

  function renderProfile() {
    document.getElementById('profileBio').textContent = D.me.bio;
    document.getElementById('profileMeta').textContent = D.me.email + ' · 가입 ' + WL.formatDate(D.me.joined);
    var saved = ['place', 'enjoy', 'post'].reduce(function (n, k) { return n + WL.savedList(k).length; }, 0);
    var likes = myPosts().reduce(function (n, p) { return n + p.likes; }, 0);
    document.getElementById('profileStats').innerHTML =
      '<div><dt>게시물</dt><dd>' + myPosts().length + '</dd></div><div><dt>저장</dt><dd>' + saved + '</dd></div><div><dt>받은 좋아요</dt><dd>' + likes + '</dd></div>';
  }

  function renderPosts() {
    var posts = myPosts();
    document.getElementById('myPosts').innerHTML = posts.map(WL.postCard).join('');
    document.getElementById('myPostsEmpty').hidden = posts.length > 0;
  }

  var EMPTY = {
    place: ['저장한 여행지가 없어요', 'destinations.html', '여행지 둘러보기'],
    enjoy: ['저장한 즐길거리가 없어요', 'enjoy.html', '즐길거리 둘러보기'],
    post: ['저장한 게시물이 없어요', 'feed.html', '피드 둘러보기']
  };
  function renderSaved() {
    ['place', 'enjoy', 'post'].forEach(function (k) {
      document.querySelector('[data-saved-count="' + k + '"]').textContent = WL.savedList(k).length;
    });
    var ids = WL.savedList(kind);
    var html = '';
    if (kind === 'place') html = '<div class="card-grid">' + ids.map(WL.find.place).filter(Boolean).map(function (p) { return WL.placeCard(p); }).join('') + '</div>';
    if (kind === 'enjoy') html = '<div class="card-grid">' + ids.map(WL.find.enjoy).filter(Boolean).map(WL.enjoyCard).join('') + '</div>';
    if (kind === 'post') html = '<div class="post-list post-list--grid">' + ids.map(WL.find.post).filter(Boolean).map(WL.postCard).join('') + '</div>';
    document.getElementById('savedGrid').innerHTML = ids.length ? html : '';
    document.getElementById('savedEmpty').hidden = ids.length > 0;
    document.getElementById('savedEmptyText').textContent = EMPTY[kind][0];
    var link = document.getElementById('savedEmptyLink');
    link.href = EMPTY[kind][1];
    link.textContent = EMPTY[kind][2];
    WL.syncToggles();
  }

  /* 저장 해제하면 목록과 숫자를 바로 갱신 */
  document.addEventListener('waylog:saved', function () { renderSaved(); renderProfile(); });

  document.getElementById('savedFilter').addEventListener('click', function (e) {
    var b = e.target.closest('[data-kind]');
    if (!b) return;
    kind = b.getAttribute('data-kind');
    this.querySelectorAll('[data-kind]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    renderSaved();
  });

  /* ---------- 탭 (화살표 키 이동 · 주소 ?tab= 동기화) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"][data-tab]'));
  function selectTab(name, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
    history.replaceState(null, '', location.pathname + (name === 'posts' ? '' : '?tab=' + name));
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      selectTab(tabs[(next + tabs.length) % tabs.length].getAttribute('data-tab'), true);
    });
  });

  /* ---------- 계정 설정 ---------- */
  function setMsg(input, el, type, text) {
    if (el.dataset.help === undefined) el.dataset.help = el.hidden ? '' : el.textContent;
    input.setAttribute('aria-invalid', String(type === 'error'));
    if (!type) { el.className = 'field__help'; el.textContent = el.dataset.help; el.hidden = !el.dataset.help; return; }
    el.className = type === 'error' ? 'field__error' : 'field__ok';
    el.innerHTML = WL.icon(type === 'error' ? 'alert' : 'check') + '<span>' + WL.esc(text) + '</span>';
    el.hidden = false;
  }
  function submitting(form, done) {
    var btn = form.querySelector('[type="submit"]');
    btn.classList.add('is-loading');
    setTimeout(function () { btn.classList.remove('is-loading'); done(); }, 700);
  }

  var nick = document.getElementById('nicknameInput');
  var nickMsg = document.getElementById('nicknameMsg');
  nick.value = D.me.nickname;
  nick.addEventListener('input', function () { setMsg(nick, nickMsg, ''); });
  document.getElementById('nicknameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = nick.value.trim();
    if (!NICK_PATTERN.test(v)) { setMsg(nick, nickMsg, 'error', '한글 · 영문 · 숫자 2~12자로 입력해 주세요.'); nick.focus(); return; }
    if (v === '숲길걷기' || v === '야경수집가') { setMsg(nick, nickMsg, 'error', '이미 사용 중인 닉네임이에요.'); nick.focus(); return; }
    submitting(this, function () {
      D.me.nickname = v;
      D.users.u1.nickname = v;
      document.querySelectorAll('[data-me-nickname]').forEach(function (el) { el.textContent = v; });
      document.querySelectorAll('[data-me-initial]').forEach(function (el) { el.textContent = v.charAt(0); });
      setMsg(nick, nickMsg, 'ok', '닉네임을 바꿨어요. (데모: 새로고침하면 처음 값으로 돌아갑니다)');
      renderPosts();
    });
  });

  var cur = document.getElementById('currentPw');
  var curMsg = document.getElementById('currentPwMsg');
  var pw = document.getElementById('newPw');
  var pwMsg = document.getElementById('newPwMsg');
  pw.addEventListener('input', function () {
    document.querySelectorAll('#newPwRules [data-rule]').forEach(function (li) {
      li.classList.toggle('is-ok', RULES[li.getAttribute('data-rule')].test(pw.value));
    });
    setMsg(pw, pwMsg, '');
  });
  cur.addEventListener('input', function () { setMsg(cur, curMsg, ''); });
  document.getElementById('passwordForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    if (!cur.value) { setMsg(cur, curMsg, 'error', '현재 비밀번호를 입력해 주세요.'); ok = false; }
    else if (cur.value !== 'waylog123!') { setMsg(cur, curMsg, 'error', '현재 비밀번호가 맞지 않아요.'); ok = false; }
    var rulesOk = Object.keys(RULES).every(function (k) { return RULES[k].test(pw.value); });
    if (!rulesOk) { setMsg(pw, pwMsg, 'error', '비밀번호 조건을 모두 충족해 주세요.'); ok = false; }
    else if (pw.value === cur.value) { setMsg(pw, pwMsg, 'error', '현재 비밀번호와 다른 비밀번호를 입력해 주세요.'); ok = false; }
    if (!ok) { (cur.getAttribute('aria-invalid') === 'true' ? cur : pw).focus(); return; }
    var form = this;
    submitting(form, function () {
      form.reset();
      document.querySelectorAll('#newPwRules li').forEach(function (li) { li.classList.remove('is-ok'); });
      setMsg(pw, pwMsg, 'ok', '비밀번호를 변경했어요.');
      WL.toast('비밀번호를 변경했어요.');
    });
  });

  if (WL.auth.isMember()) {
    renderProfile();
    renderPosts();
    renderSaved();
    var tab = WL.param('tab');
    selectTab(tab === 'saved' || tab === 'account' ? tab : 'posts');
  }
})();
