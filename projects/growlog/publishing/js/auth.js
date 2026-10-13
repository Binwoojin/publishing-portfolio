/*
 * GrowLog — 로그인 · 회원가입
 * 검증 규칙은 원본(join.js / SignupView.vue)의 정규식을 그대로 사용한다.
 */
(function () {
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
  var USERNAME_PATTERN = /^[가-힣a-zA-Z]{2,20}$/;
  var NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,12}$/;
  var DEMO = { email: 'grower@growlog.kr', password: 'growlog123!', code: '123456', takenNickname: '성장러' };

  /* ---------- 필드 메시지 헬퍼 ---------- */
  /* 메시지 요소의 원래 도움말을 기억해 두었다가 상태가 풀리면 되돌린다 */
  function setMessage(input, msgEl, type, message) {
    if (!msgEl) return;
    if (msgEl.dataset.help === undefined) msgEl.dataset.help = msgEl.hidden ? '' : msgEl.textContent;
    if (input) input.setAttribute('aria-invalid', type === 'error' ? 'true' : 'false');

    if (type === 'reset') {
      msgEl.className = 'field__help';
      msgEl.textContent = msgEl.dataset.help;
      msgEl.hidden = !msgEl.dataset.help;
      return;
    }
    var iconName = type === 'error' ? 'alert' : 'check';
    msgEl.className = type === 'error' ? 'field__error' : 'field__ok';
    msgEl.innerHTML = GL.icon(iconName) + '<span>' + GL.esc(message) + '</span>';
    msgEl.hidden = false;
  }

  function withLoading(button, ms, done) {
    button.classList.add('is-loading');
    button.setAttribute('aria-disabled', 'true');
    setTimeout(function () {
      button.classList.remove('is-loading');
      button.removeAttribute('aria-disabled');
      done();
    }, ms);
  }

  /* ---------- 비밀번호 보기 토글 ---------- */
  document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
    var input = document.getElementById(btn.getAttribute('data-toggle-password'));
    btn.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
      btn.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
    });
  });

  document.querySelectorAll('[data-not-ready]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      GL.toast('데모에서는 지원하지 않는 기능입니다.');
    });
  });

  /* ==========================================================================
     로그인
     ========================================================================== */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var alertBox = document.getElementById('loginAlert');

    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      alertBox.hidden = true;
      var firstInvalid = null;

      if (!email.value.trim()) {
        setMessage(email, document.getElementById('emailError'), 'error', '이메일을 입력해 주세요.');
        firstInvalid = email;
      } else if (!EMAIL_PATTERN.test(email.value.trim())) {
        setMessage(email, document.getElementById('emailError'), 'error', '이메일 형식이 올바르지 않습니다.');
        firstInvalid = email;
      } else {
        setMessage(email, document.getElementById('emailError'), 'reset');
      }

      if (!password.value) {
        setMessage(password, document.getElementById('passwordError'), 'error', '비밀번호를 입력해 주세요.');
        firstInvalid = firstInvalid || password;
      } else {
        setMessage(password, document.getElementById('passwordError'), 'reset');
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var submit = loginForm.querySelector('[type="submit"]');
      withLoading(submit, 900, function () {
        if (email.value.trim() === DEMO.email && password.value === DEMO.password) {
          GL.flash(GL.data.me.nickname + '님, 다시 만나서 반가워요!');
          location.href = 'dashboard.html';
          return;
        }
        document.getElementById('loginAlertText').textContent = '이메일 또는 비밀번호가 일치하지 않습니다.';
        alertBox.hidden = false;
        alertBox.focus();
      });
    });
  }

  /* ==========================================================================
     회원가입
     ========================================================================== */
  var signupForm = document.getElementById('signupForm');
  if (!signupForm) return;

  var f = {
    email: document.getElementById('email'),
    code: document.getElementById('emailCode'),
    password: document.getElementById('password'),
    passwordCheck: document.getElementById('passwordCheck'),
    userName: document.getElementById('userName'),
    nickname: document.getElementById('nickname'),
    agree: document.getElementById('agree')
  };
  var msg = {
    email: document.getElementById('emailMsg'),
    code: document.getElementById('codeMsg'),
    password: document.getElementById('passwordError'),
    passwordCheck: document.getElementById('passwordCheckMsg'),
    userName: document.getElementById('userNameMsg'),
    nickname: document.getElementById('nicknameMsg'),
    agree: document.getElementById('agreeMsg')
  };
  var sendCodeBtn = document.getElementById('sendCodeBtn');
  var verifyCodeBtn = document.getElementById('verifyCodeBtn');
  var checkNicknameBtn = document.getElementById('checkNicknameBtn');
  var codeField = document.getElementById('codeField');
  var timerEl = document.getElementById('codeTimer');

  var state = { codeSent: false, verified: false, nicknameChecked: false };
  var timerId = null;
  var remain = 0;

  /* --- 이메일 인증 --- */
  function startTimer() {
    clearInterval(timerId);
    remain = 180;
    renderTimer();
    timerId = setInterval(function () {
      remain -= 1;
      renderTimer();
      if (remain <= 0) {
        clearInterval(timerId);
        setMessage(f.code, msg.code, 'error', '인증 시간이 지났습니다. 인증번호를 다시 받아 주세요.');
      }
    }, 1000);
  }
  function renderTimer() {
    var m = Math.floor(Math.max(remain, 0) / 60);
    var s = Math.max(remain, 0) % 60;
    timerEl.textContent = '0' + m + ':' + String(s).padStart(2, '0');
  }

  sendCodeBtn.addEventListener('click', function () {
    var value = f.email.value.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setMessage(f.email, msg.email, 'error', value ? '이메일 형식이 올바르지 않습니다.' : '이메일을 입력해 주세요.');
      f.email.focus();
      return;
    }
    if (value === DEMO.email) {
      setMessage(f.email, msg.email, 'error', '이미 가입된 이메일입니다.');
      f.email.focus();
      return;
    }
    withLoading(sendCodeBtn, 800, function () {
      state.codeSent = true;
      setMessage(f.email, msg.email, 'ok', '인증번호를 보냈습니다. 메일함을 확인해 주세요.');
      sendCodeBtn.textContent = '다시 받기';
      codeField.hidden = false;
      setMessage(f.code, msg.code, 'reset');
      f.code.value = '';
      startTimer();
      f.code.focus();
    });
  });

  verifyCodeBtn.addEventListener('click', function () {
    if (remain <= 0) {
      setMessage(f.code, msg.code, 'error', '인증 시간이 지났습니다. 인증번호를 다시 받아 주세요.');
      return;
    }
    if (!/^\d{6}$/.test(f.code.value)) {
      setMessage(f.code, msg.code, 'error', '인증번호 6자리 숫자를 입력해 주세요.');
      f.code.focus();
      return;
    }
    withLoading(verifyCodeBtn, 600, function () {
      if (f.code.value !== DEMO.code) {
        setMessage(f.code, msg.code, 'error', '인증번호가 일치하지 않습니다.');
        f.code.focus();
        return;
      }
      clearInterval(timerId);
      state.verified = true;
      timerEl.hidden = true;
      f.email.readOnly = true;
      f.code.readOnly = true;
      sendCodeBtn.disabled = true;
      verifyCodeBtn.disabled = true;
      verifyCodeBtn.textContent = '인증 완료';
      setMessage(f.code, msg.code, 'ok', '이메일 인증이 완료되었습니다.');
    });
  });

  f.email.addEventListener('input', function () {
    if (!state.codeSent) {
      if (f.email.getAttribute('aria-invalid') === 'true') setMessage(f.email, msg.email, 'reset');
      return;
    }
    /* 인증번호를 보낸 뒤 이메일을 바꾸면 이전 인증은 무효 */
    state.codeSent = false;
    state.verified = false;
    clearInterval(timerId);
    codeField.hidden = true;
    sendCodeBtn.textContent = '인증번호 받기';
    setMessage(f.email, msg.email, 'reset');
  });

  /* --- 비밀번호 --- */
  var RULES = {
    letter: /[A-Za-z]/,
    number: /\d/,
    special: /[!@#$%^&*]/,
    length: /^.{8,20}$/
  };
  f.password.addEventListener('input', function () {
    var value = f.password.value;
    document.querySelectorAll('#passwordRules [data-rule]').forEach(function (li) {
      li.classList.toggle('is-ok', RULES[li.getAttribute('data-rule')].test(value));
    });
    if (f.password.getAttribute('aria-invalid') === 'true' && PASSWORD_PATTERN.test(value)) {
      setMessage(f.password, msg.password, 'reset');
    }
    if (f.passwordCheck.value) checkPasswordMatch();
  });

  function checkPasswordMatch() {
    if (!f.passwordCheck.value) {
      setMessage(f.passwordCheck, msg.passwordCheck, 'reset');
      return false;
    }
    if (f.passwordCheck.value === f.password.value) {
      setMessage(f.passwordCheck, msg.passwordCheck, 'ok', '비밀번호가 일치합니다.');
      return true;
    }
    setMessage(f.passwordCheck, msg.passwordCheck, 'error', '비밀번호가 일치하지 않습니다.');
    return false;
  }
  f.passwordCheck.addEventListener('input', checkPasswordMatch);

  /* --- 이름 --- */
  f.userName.addEventListener('blur', function () {
    if (!f.userName.value) return;
    if (USERNAME_PATTERN.test(f.userName.value)) setMessage(f.userName, msg.userName, 'reset');
    else setMessage(f.userName, msg.userName, 'error', '이름은 한글 또는 영문 2~20자로 입력해 주세요.');
  });

  /* --- 닉네임 중복 확인 --- */
  f.nickname.addEventListener('input', function () {
    state.nicknameChecked = false;
    setMessage(f.nickname, msg.nickname, 'reset');
  });

  checkNicknameBtn.addEventListener('click', function () {
    var value = f.nickname.value.trim();
    if (!NICKNAME_PATTERN.test(value)) {
      setMessage(f.nickname, msg.nickname, 'error', '닉네임은 한글 · 영문 · 숫자 2~12자로 입력해 주세요.');
      f.nickname.focus();
      return;
    }
    withLoading(checkNicknameBtn, 600, function () {
      if (value === DEMO.takenNickname) {
        setMessage(f.nickname, msg.nickname, 'error', '이미 사용 중인 닉네임입니다.');
        f.nickname.focus();
        return;
      }
      state.nicknameChecked = true;
      setMessage(f.nickname, msg.nickname, 'ok', '사용할 수 있는 닉네임입니다.');
    });
  });

  f.agree.addEventListener('change', function () {
    if (f.agree.checked) setMessage(f.agree, msg.agree, 'reset');
  });

  /* --- 제출: 오류는 각 필드 아래 + 상단 요약에 함께 표시 --- */
  signupForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var errors = [];

    function fail(key, text, target) {
      setMessage(f[key], msg[key], 'error', text);
      errors.push({ id: (target || f[key]).id, text: text });
    }

    if (!EMAIL_PATTERN.test(f.email.value.trim())) fail('email', '이메일을 올바르게 입력해 주세요.');
    else if (!state.verified) {
      if (state.codeSent) fail('code', '이메일 인증을 완료해 주세요.');
      else fail('email', '이메일 인증을 진행해 주세요.');
    }

    if (!PASSWORD_PATTERN.test(f.password.value)) fail('password', '비밀번호는 영문 · 숫자 · 특수문자를 포함해 8~20자로 입력해 주세요.');
    if (!f.passwordCheck.value || f.passwordCheck.value !== f.password.value) fail('passwordCheck', '비밀번호 확인이 일치하지 않습니다.');
    if (!USERNAME_PATTERN.test(f.userName.value)) fail('userName', '이름은 한글 또는 영문 2~20자로 입력해 주세요.');
    if (!NICKNAME_PATTERN.test(f.nickname.value.trim())) fail('nickname', '닉네임을 올바르게 입력해 주세요.');
    else if (!state.nicknameChecked) fail('nickname', '닉네임 중복 확인을 해 주세요.');
    if (!f.agree.checked) fail('agree', '필수 약관에 동의해 주세요.');

    var alertBox = document.getElementById('signupAlert');
    if (errors.length) {
      document.getElementById('signupAlertList').innerHTML = errors.map(function (e) {
        return '<li><a href="#' + e.id + '">' + GL.esc(e.text) + '</a></li>';
      }).join('');
      alertBox.hidden = false;
      alertBox.focus();
      return;
    }

    alertBox.hidden = true;
    withLoading(signupForm.querySelector('[type="submit"]'), 1000, function () {
      GL.flash('가입이 완료되었습니다. 로그인해 주세요.');
      location.href = 'login.html';
    });
  });

  /* 오류 요약의 링크를 누르면 해당 입력창으로 포커스 이동 */
  document.getElementById('signupAlertList').addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (target) target.focus();
  });
})();
