/* WayLog — 로그인 · 회원가입 (원본 SignupPage 의 검증 흐름을 정적 데모로 옮김) */
(function () {
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var NICK = /^[가-힣a-zA-Z0-9]{2,12}$/;
  var RULES = { length: /^.{8,20}$/, letter: /[A-Za-z]/, number: /\d/, special: /[^A-Za-z0-9]/ };
  var DEMO = { email: 'traveler@waylog.kr', password: 'waylog123!', code: '246810', nick: '바다산책' };

  function setMsg(input, el, type, text) {
    if (el.dataset.help === undefined) el.dataset.help = el.hidden ? '' : el.textContent;
    if (input) input.setAttribute('aria-invalid', String(type === 'error'));
    if (!type) { el.className = 'field__help'; el.textContent = el.dataset.help; el.hidden = !el.dataset.help; return; }
    el.className = type === 'error' ? 'field__error' : 'field__ok';
    el.innerHTML = WL.icon(type === 'error' ? 'alert' : 'check') + '<span>' + WL.esc(text) + '</span>';
    el.hidden = false;
  }
  function busy(btn, ms, done) {
    btn.classList.add('is-loading');
    btn.setAttribute('aria-disabled', 'true');
    setTimeout(function () { btn.classList.remove('is-loading'); btn.removeAttribute('aria-disabled'); done(); }, ms);
  }

  document.querySelectorAll('[data-toggle-password]').forEach(function (b) {
    var input = document.getElementById(b.getAttribute('data-toggle-password'));
    b.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.setAttribute('aria-pressed', String(show));
      b.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
      b.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
    });
  });
  document.querySelectorAll('[data-not-ready]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); WL.toast('데모에서는 지원하지 않는 기능이에요.'); });
  });

  /* ==========================================================================
     로그인
     ========================================================================== */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    var email = document.getElementById('email');
    var pw = document.getElementById('password');
    var alertBox = document.getElementById('loginAlert');

    document.getElementById('fillDemo').addEventListener('click', function () {
      email.value = DEMO.email;
      pw.value = DEMO.password;
      setMsg(email, document.getElementById('emailError'), '');
      setMsg(pw, document.getElementById('passwordError'), '');
      loginForm.querySelector('[type="submit"]').focus();
    });

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      alertBox.hidden = true;
      var first = null;
      if (!EMAIL.test(email.value.trim())) {
        setMsg(email, document.getElementById('emailError'), 'error', email.value.trim() ? '이메일 형식이 올바르지 않아요.' : '이메일을 입력해 주세요.');
        first = email;
      } else setMsg(email, document.getElementById('emailError'), '');
      if (!pw.value) {
        setMsg(pw, document.getElementById('passwordError'), 'error', '비밀번호를 입력해 주세요.');
        first = first || pw;
      } else setMsg(pw, document.getElementById('passwordError'), '');
      if (first) { first.focus(); return; }

      busy(loginForm.querySelector('[type="submit"]'), 800, function () {
        if (email.value.trim() !== DEMO.email || pw.value !== DEMO.password) {
          document.getElementById('loginAlertText').textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
          alertBox.hidden = false;
          alertBox.focus();
          return;
        }
        WL.auth.login();
        WL.flash(WL.data.me.nickname + '님, 다시 만나서 반가워요!');
        /* 로그인 전에 보던 화면으로 돌아간다 (같은 폴더의 페이지만 허용) */
        var next = WL.param('next') || 'index.html';
        location.href = /^[a-z-]+\.html(\?[\w=&%.-]*)?$/.test(next) ? next : 'index.html';
      });
    });
    return;
  }

  /* ==========================================================================
     회원가입: 1 약관 → 2 정보 입력 → 3 완료
     ========================================================================== */
  var steps = { 1: document.getElementById('stepTerms'), 2: document.getElementById('stepInfo'), 3: document.getElementById('stepDone') };
  var labels = document.querySelectorAll('.stepper li');
  function goStep(n) {
    Object.keys(steps).forEach(function (k) { steps[k].hidden = Number(k) !== n; });
    labels.forEach(function (li, i) {
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.classList.toggle('is-done', i + 1 < n);
    });
    document.getElementById('signupSwitch').hidden = n === 3;
    var heading = steps[n].querySelector('.auth__step-title');
    heading.setAttribute('tabindex', '-1');
    heading.focus();
  }

  /* --- 1단계: 약관 --- */
  var all = document.getElementById('agreeAll');
  var agrees = Array.prototype.slice.call(document.querySelectorAll('.agree'));
  var termsError = document.getElementById('termsError');
  all.addEventListener('change', function () { agrees.forEach(function (a) { a.checked = all.checked; }); termsError.hidden = true; });
  agrees.forEach(function (a) {
    a.addEventListener('change', function () {
      all.checked = agrees.every(function (x) { return x.checked; });
      termsError.hidden = true;
    });
  });
  steps[1].addEventListener('submit', function (e) {
    e.preventDefault();
    var missing = agrees.filter(function (a) { return a.dataset.required && !a.checked; });
    if (missing.length) {
      termsError.innerHTML = WL.icon('alert') + '<span>필수 약관에 모두 동의해 주세요.</span>';
      termsError.hidden = false;
      missing[0].focus();
      return;
    }
    goStep(2);
  });

  /* --- 2단계: 정보 입력 --- */
  var f = {
    email: document.getElementById('suEmail'), code: document.getElementById('suCode'),
    pw: document.getElementById('suPw'), pw2: document.getElementById('suPw2'), nick: document.getElementById('suNick')
  };
  var m = {
    email: document.getElementById('suEmailMsg'), code: document.getElementById('suCodeMsg'),
    pw: document.getElementById('suPwMsg'), pw2: document.getElementById('suPw2Msg'), nick: document.getElementById('suNickMsg')
  };
  var st = { emailChecked: false, verified: false, nickChecked: false };
  var timer = null, remain = 0;
  var checkEmailBtn = document.getElementById('checkEmailBtn');
  var verifyBtn = document.getElementById('verifyCodeBtn');
  var codeField = document.getElementById('codeField');
  var timerEl = document.getElementById('codeTimer');

  function tick() {
    remain -= 1;
    timerEl.textContent = String(Math.floor(Math.max(remain, 0) / 60)).padStart(2, '0') + ':' + String(Math.max(remain, 0) % 60).padStart(2, '0');
    if (remain <= 0) { clearInterval(timer); setMsg(f.code, m.code, 'error', '인증 시간이 지났어요. 인증번호를 다시 받아 주세요.'); checkEmailBtn.textContent = '다시 받기'; checkEmailBtn.disabled = false; }
  }

  /* 원본과 같은 흐름: 중복 확인 → 통과하면 인증번호 발송 */
  checkEmailBtn.addEventListener('click', function () {
    var v = f.email.value.trim();
    if (!EMAIL.test(v)) { setMsg(f.email, m.email, 'error', v ? '올바른 이메일 주소를 입력해 주세요.' : '이메일을 입력해 주세요.'); f.email.focus(); return; }
    busy(checkEmailBtn, 700, function () {
      if (v === DEMO.email) { setMsg(f.email, m.email, 'error', '이미 사용 중인 이메일입니다.'); f.email.focus(); return; }
      st.emailChecked = true;
      setMsg(f.email, m.email, 'ok', '사용 가능한 이메일이에요. 인증번호를 보냈어요.');
      checkEmailBtn.textContent = '다시 받기';
      codeField.hidden = false;
      f.code.value = '';
      setMsg(f.code, m.code, '');
      clearInterval(timer);
      remain = 301;
      tick();
      timer = setInterval(tick, 1000);
      f.code.focus();
    });
  });
  f.email.addEventListener('input', function () {
    if (!st.emailChecked && !st.verified) { setMsg(f.email, m.email, ''); return; }
    st.emailChecked = st.verified = false;
    clearInterval(timer);
    codeField.hidden = true;
    checkEmailBtn.textContent = '중복 확인';
    setMsg(f.email, m.email, '');
  });
  verifyBtn.addEventListener('click', function () {
    if (!/^\d{6}$/.test(f.code.value)) { setMsg(f.code, m.code, 'error', '인증번호 6자리를 입력해 주세요.'); f.code.focus(); return; }
    if (remain <= 0) return;
    busy(verifyBtn, 600, function () {
      if (f.code.value !== DEMO.code) { setMsg(f.code, m.code, 'error', '인증번호가 일치하지 않아요.'); f.code.focus(); return; }
      clearInterval(timer);
      st.verified = true;
      timerEl.hidden = true;
      f.email.readOnly = f.code.readOnly = true;
      checkEmailBtn.disabled = verifyBtn.disabled = true;
      verifyBtn.textContent = '인증 완료';
      setMsg(f.code, m.code, 'ok', '이메일 인증이 완료되었습니다.');
    });
  });

  function rulesOk(v) { return Object.keys(RULES).every(function (k) { return RULES[k].test(v); }); }
  f.pw.addEventListener('input', function () {
    document.querySelectorAll('#suPwRules [data-rule]').forEach(function (li) {
      li.classList.toggle('is-ok', RULES[li.getAttribute('data-rule')].test(f.pw.value));
    });
    if (rulesOk(f.pw.value)) setMsg(f.pw, m.pw, '');
    if (f.pw2.value) matchPw();
  });
  function matchPw() {
    if (!f.pw2.value) { setMsg(f.pw2, m.pw2, ''); return false; }
    var ok = f.pw2.value === f.pw.value;
    setMsg(f.pw2, m.pw2, ok ? 'ok' : 'error', ok ? '비밀번호가 일치해요.' : '비밀번호가 일치하지 않습니다.');
    return ok;
  }
  f.pw2.addEventListener('input', matchPw);

  var checkNickBtn = document.getElementById('checkNickBtn');
  f.nick.addEventListener('input', function () { st.nickChecked = false; setMsg(f.nick, m.nick, ''); });
  checkNickBtn.addEventListener('click', function () {
    var v = f.nick.value.trim();
    if (!NICK.test(v)) { setMsg(f.nick, m.nick, 'error', '닉네임은 한글 · 영문 · 숫자 2~12자로 입력해 주세요.'); f.nick.focus(); return; }
    busy(checkNickBtn, 600, function () {
      if (v === DEMO.nick) { setMsg(f.nick, m.nick, 'error', '이미 사용 중인 닉네임이에요.'); f.nick.focus(); return; }
      st.nickChecked = true;
      setMsg(f.nick, m.nick, 'ok', '사용할 수 있는 닉네임이에요.');
    });
  });

  document.getElementById('backToTerms').addEventListener('click', function () { goStep(1); });

  steps[2].addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = [];
    function fail(key, text, target) { setMsg(f[key], m[key], 'error', text); errors.push({ el: target || f[key], text: text }); }

    if (!EMAIL.test(f.email.value.trim())) fail('email', '이메일을 올바르게 입력해 주세요.');
    else if (!st.emailChecked) fail('email', '이메일 중복 확인을 진행해 주세요.');
    else if (!st.verified) fail('code', '이메일 인증을 완료해 주세요.');
    if (!rulesOk(f.pw.value)) fail('pw', '비밀번호 조건을 모두 충족해 주세요.');
    if (!f.pw2.value || f.pw2.value !== f.pw.value) fail('pw2', '비밀번호 확인이 일치하지 않습니다.');
    if (!NICK.test(f.nick.value.trim())) fail('nick', '닉네임은 2자 이상 입력해 주세요.');
    else if (!st.nickChecked) fail('nick', '닉네임 중복 확인을 완료해 주세요.');

    var alertBox = document.getElementById('infoAlert');
    if (errors.length) {
      var list = document.getElementById('infoAlertList');
      list.innerHTML = errors.map(function (x, i) { return '<li><a href="#" data-i="' + i + '">' + WL.esc(x.text) + '</a></li>'; }).join('');
      list.onclick = function (ev) {
        var a = ev.target.closest('a');
        if (!a) return;
        ev.preventDefault();
        errors[Number(a.getAttribute('data-i'))].el.focus();
      };
      alertBox.hidden = false;
      alertBox.focus();
      return;
    }
    alertBox.hidden = true;
    var btn = steps[2].querySelector('[type="submit"]');
    btn.textContent = '가입 처리 중';
    busy(btn, 900, function () {
      document.getElementById('doneNick').textContent = f.nick.value.trim();
      goStep(3);
    });
  });
})();
