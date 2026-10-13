/*
 * GrowLog 퍼블리싱 공통 스크립트
 * - 문자열 이스케이프 · 날짜 포맷 · 배지/진행률 마크업 헬퍼
 * - 화면 상태(Loading / Empty / Error / Success) 전환
 * - 토스트 알림, 다이얼로그 열기/닫기
 */
window.GL = (function () {
  var data = window.GROWLOG;

  /* ---------- 문자열 · 날짜 ---------- */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toDate(value) {
    return new Date(value.length === 10 ? value + 'T00:00:00' : value);
  }

  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  function formatDate(value, type) {
    if (!value) return '';
    var d = toDate(value);
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    switch (type) {
      case 'dot': return y + '.' + pad(m) + '.' + pad(day);
      case 'short': return m + '월 ' + day + '일';
      case 'long': return y + '년 ' + m + '월 ' + day + '일 ' + WEEKDAYS[d.getDay()] + '요일';
      case 'time': return pad(d.getHours()) + ':' + pad(d.getMinutes());
      case 'iso': return y + '-' + pad(m) + '-' + pad(day);
      default: return y + '.' + pad(m) + '.' + pad(day);
    }
  }

  /* 데모 기준일(today)과 비교한 D-day */
  function dday(endDate) {
    if (!endDate) return null;
    var diff = Math.round((toDate(endDate) - toDate(data.today)) / 86400000);
    if (diff === 0) return 'D-Day';
    return diff > 0 ? 'D-' + diff : '기한 지남';
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  /* ---------- 마크업 헬퍼 ---------- */
  var STATUS_CLASS = { '진행중': 'progress', '완료': 'done', '중단': 'paused' };

  function statusBadge(status) {
    return '<span class="badge badge--' + STATUS_CLASS[status] + '">' + esc(status) + '</span>';
  }

  function categoryBadge(category) {
    return '<span class="chip chip--' + esc(category.categoryColor) + '">' +
      '<svg class="icon" aria-hidden="true"><use href="#i-' + esc(category.categoryIcon) + '"></use></svg>' +
      esc(category.categoryName) + '</span>';
  }

  /* label: 화면에 보이는 이름, ariaLabel: 스크린리더용 이름(목표 이름 포함) */
  function progressBar(value, label, ariaLabel) {
    return '<div class="progress">' +
      '<div class="progress__head"><span class="progress__label">' + esc(label || '진행률') + '</span>' +
      '<strong class="progress__value">' + value + '%</strong></div>' +
      '<div class="progress__track" role="progressbar" aria-label="' + esc(ariaLabel || label || '진행률') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + value + '">' +
      '<span class="progress__bar' + (value === 100 ? ' is-done' : '') + '" style="--value:' + value + '%"></span></div></div>';
  }

  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  /* ---------- 스크린리더 알림 ---------- */
  var liveRegion;
  function announce(message) {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.className = 'blind';
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    setTimeout(function () { liveRegion.textContent = message; }, 50);
  }

  /* ---------- 토스트 ---------- */
  function toast(message, type) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('role', 'status');
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var item = document.createElement('p');
    item.className = 'toast' + (type ? ' toast--' + type : '');
    item.innerHTML = icon(type === 'error' ? 'alert' : 'check') + '<span>' + esc(message) + '</span>';
    wrap.appendChild(item);
    setTimeout(function () {
      item.classList.add('is-leaving');
      setTimeout(function () { item.remove(); }, 250);
    }, 2800);
  }

  /* 페이지 이동 후 보여줄 토스트 (예: 저장 후 상세 화면으로 이동) */
  function flash(message) {
    try { sessionStorage.setItem('gl-flash', message); } catch (e) { /* 저장소 사용 불가 시 무시 */ }
  }

  function showFlash() {
    var message = null;
    try {
      message = sessionStorage.getItem('gl-flash');
      sessionStorage.removeItem('gl-flash');
    } catch (e) { /* 무시 */ }
    if (message) toast(message);
  }

  /* ---------- 다이얼로그 ---------- */
  var lastTrigger = null;

  function openDialog(dialog, trigger) {
    lastTrigger = trigger || document.activeElement;
    dialog.showModal();
  }

  function closeDialog(dialog) {
    dialog.close();
  }

  function bindDialogs() {
    document.querySelectorAll('dialog').forEach(function (dialog) {
      dialog.addEventListener('close', function () {
        if (!lastTrigger) return;
        /* 목록이 다시 그려져 버튼이 바뀐 경우 같은 data-focus-key 를 가진 새 버튼으로 이동 */
        var key = lastTrigger.getAttribute('data-focus-key');
        var target = document.contains(lastTrigger) ? lastTrigger
          : key ? document.querySelector('[data-focus-key="' + key + '"]') : null;
        if (target) target.focus();
      });
      /* 바깥(backdrop) 클릭 시 닫기 */
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog && !dialog.hasAttribute('data-busy')) dialog.close();
      });
      dialog.querySelectorAll('[data-dialog-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { dialog.close(); });
      });
    });
  }

  /* ---------- 화면 상태 전환 (Loading / Empty / Error / Success) ---------- */
  /*
   * root 안의 [data-state="..."] 패널 중 하나만 보여준다.
   * 상단 데모 도구(.demo-bar)의 버튼이나 ?state= 파라미터로 상태를 바꿔 볼 수 있다.
   */
  function stateView(root, options) {
    options = options || {};
    var panels = root.querySelectorAll('[data-state]');
    var demoButtons = document.querySelectorAll('[data-demo-state]');
    var messages = {
      loading: '불러오는 중입니다.',
      empty: options.emptyMessage || '아직 내용이 없습니다.',
      error: '불러오지 못했습니다. 다시 시도해 주세요.',
      success: options.successMessage || '불러왔습니다.'
    };

    function set(name, silent) {
      panels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-state') !== name; });
      root.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');
      demoButtons.forEach(function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-demo-state') === name ? 'true' : 'false');
      });
      if (name === 'success' && options.render) options.render();
      if (!silent) announce(messages[name]);
    }

    function load() {
      set('loading', true);
      /* resolve: 데이터 유무에 따라 로딩 후 상태를 정한다 (예: 없는 기록 → empty) */
      setTimeout(function () { set(options.resolve ? options.resolve() : 'success'); }, 700);
    }

    demoButtons.forEach(function (btn) {
      btn.addEventListener('click', function () { set(btn.getAttribute('data-demo-state')); });
    });

    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-retry]')) load();
    });

    var initial = param('state');
    if (initial && root.querySelector('[data-state="' + initial + '"]')) set(initial, true);
    else load();

    return { set: set, load: load };
  }

  /* ---------- 공통 초기화 ---------- */
  function init() {
    bindDialogs();
    showFlash();

    /* 현재 사용자 이름 채우기 */
    document.querySelectorAll('[data-me-nickname]').forEach(function (el) { el.textContent = data.me.nickname; });
    document.querySelectorAll('[data-me-initial]').forEach(function (el) { el.textContent = data.me.nickname.charAt(0); });
    document.querySelectorAll('[data-me-email]').forEach(function (el) { el.textContent = data.me.email; });

    /* 로그아웃 (데모) */
    document.querySelectorAll('[data-logout]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        flash('로그아웃되었습니다.');
        location.href = 'index.html';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return {
    data: data,
    esc: esc,
    formatDate: formatDate,
    dday: dday,
    param: param,
    statusBadge: statusBadge,
    categoryBadge: categoryBadge,
    progressBar: progressBar,
    icon: icon,
    announce: announce,
    toast: toast,
    flash: flash,
    openDialog: openDialog,
    closeDialog: closeDialog,
    stateView: stateView
  };
})();
