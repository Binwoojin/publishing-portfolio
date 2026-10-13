/* GrowLog — Goals (목록 · 진행률 수정 · 삭제) */
(function () {
  var goals = GL.data.goals.slice(); // 화면 안에서만 바뀌는 사본
  var status = '전체';
  var sort = 'recent';
  var current = null; // 수정/삭제 대상 목표

  var grid = document.getElementById('goalGrid');
  var filterEmpty = document.getElementById('filterEmpty');

  var SORTERS = {
    recent: function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; },
    deadline: function (a, b) {
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return a.endDate > b.endDate ? 1 : -1;
    },
    progress: function (a, b) { return b.goalProgress - a.goalProgress; }
  };

  function updateCounts() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var key = el.getAttribute('data-count');
      el.textContent = key === '전체' ? goals.length : goals.filter(function (g) { return g.goalStatus === key; }).length;
    });
  }

  function render() {
    updateCounts();
    var list = goals
      .filter(function (g) { return status === '전체' || g.goalStatus === status; })
      .sort(SORTERS[sort]);

    filterEmpty.hidden = list.length > 0;
    document.getElementById('filterEmptyText').textContent = (status === '전체' ? '' : status + ' 상태의 ') + '목표가 없어요';

    grid.innerHTML = list.map(function (g) {
      var dday = g.goalStatus === '진행중' ? GL.dday(g.endDate) : null;
      var period = GL.formatDate(g.startDate, 'dot') + ' – ' + (g.endDate ? GL.formatDate(g.endDate, 'dot') : '기한 없음');
      var stateClass = g.goalStatus === '완료' ? ' is-done' : g.goalStatus === '중단' ? ' is-paused' : '';
      return '<li class="card goal-card' + stateClass + '">' +
        '<div class="goal-card__top">' + GL.categoryBadge(g.category) + GL.statusBadge(g.goalStatus) + '</div>' +
        '<div><h3 class="goal-card__title">' + GL.esc(g.goalTitle) + '</h3>' +
        (g.goalContent ? '<p class="goal-card__desc">' + GL.esc(g.goalContent) + '</p>' : '') + '</div>' +
        GL.progressBar(g.goalProgress, '진행률', g.goalTitle + ' 진행률') +
        '<p class="goal-card__period"><span>' + GL.icon('calendar') + '<span class="blind">기간 </span>' + period + '</span>' +
        (dday ? '<span class="goal-card__dday' + (dday === '기한 지남' ? ' is-over' : '') + '">' + dday + '</span>' : '') + '</p>' +
        '<div class="goal-card__actions">' +
        '<button class="btn btn--outline btn--sm" type="button" data-edit="' + g.goalNum + '" data-focus-key="edit-' + g.goalNum + '">' + GL.icon('edit') + '진행 상황 수정<span class="blind">: ' + GL.esc(g.goalTitle) + '</span></button>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-delete="' + g.goalNum + '">' + GL.icon('trash') + '삭제<span class="blind">: ' + GL.esc(g.goalTitle) + '</span></button>' +
        '</div></li>';
    }).join('');
  }

  function find(num) {
    return goals.filter(function (g) { return g.goalNum === Number(num); })[0];
  }

  /* ---------- 필터 · 정렬 ---------- */
  document.querySelectorAll('[data-status]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      status = btn.getAttribute('data-status');
      document.querySelectorAll('[data-status]').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      render();
      GL.announce(status + ' 목표 ' + grid.children.length + '개를 보여줍니다.');
    });
  });

  document.getElementById('sortSelect').addEventListener('change', function (event) {
    sort = event.target.value;
    render();
  });

  /* ---------- 진행 상황 수정 다이얼로그 ---------- */
  var editDialog = document.getElementById('editDialog');
  var editForm = document.getElementById('editForm');
  var range = document.getElementById('progressRange');
  var output = document.getElementById('progressOutput');
  var hint = document.getElementById('editHint');

  function syncRange() {
    output.textContent = range.value + '%';
    range.style.setProperty('--fill', range.value + '%');
    range.setAttribute('aria-valuetext', range.value + '퍼센트');
  }

  function checkedStatus() {
    return editForm.querySelector('input[name="status"]:checked').value;
  }

  /* 진행률 100% ↔ 완료 상태가 서로 어긋나지 않도록 안내 */
  function syncHint() {
    var s = checkedStatus();
    if (s === '완료' && Number(range.value) < 100) {
      hint.textContent = '완료로 바꾸면 진행률이 100%로 저장됩니다.';
      hint.hidden = false;
    } else if (s === '진행중' && Number(range.value) === 100) {
      hint.textContent = '진행률이 100%예요. 상태를 완료로 바꿔 보세요.';
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
  }

  range.addEventListener('input', function () { syncRange(); syncHint(); });
  editForm.addEventListener('change', function (event) {
    if (event.target.name === 'status') syncHint();
  });

  editForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var save = document.getElementById('editSave');
    var nextStatus = checkedStatus();
    save.classList.add('is-loading');
    editDialog.setAttribute('data-busy', '');
    setTimeout(function () {
      current.goalStatus = nextStatus;
      current.goalProgress = nextStatus === '완료' ? 100 : Number(range.value);
      save.classList.remove('is-loading');
      editDialog.removeAttribute('data-busy');
      GL.closeDialog(editDialog);
      render();
      GL.toast('‘' + current.goalTitle + '’ 진행 상황을 저장했어요.');
    }, 700);
  });

  /* ---------- 삭제 다이얼로그 ---------- */
  var deleteDialog = document.getElementById('deleteDialog');
  var deleteBtn = document.getElementById('deleteConfirm');

  deleteBtn.addEventListener('click', function () {
    deleteBtn.classList.add('is-loading');
    deleteDialog.setAttribute('data-busy', '');
    setTimeout(function () {
      var title = current.goalTitle;
      goals = goals.filter(function (g) { return g !== current; });
      deleteBtn.classList.remove('is-loading');
      deleteDialog.removeAttribute('data-busy');
      GL.closeDialog(deleteDialog);
      render();
      /* 삭제된 카드 대신 목록 제목 쪽으로 포커스를 옮겨 길을 잃지 않게 한다 */
      document.querySelector('.page-head__title').setAttribute('tabindex', '-1');
      document.querySelector('.page-head__title').focus();
      GL.toast('‘' + title + '’ 목표를 삭제했어요.');
      if (!goals.length) view.set('empty');
    }, 800);
  });

  /* 다이얼로그가 바쁠 때(저장 중) ESC 로 닫히지 않게 */
  [editDialog, deleteDialog].forEach(function (dialog) {
    dialog.addEventListener('cancel', function (event) {
      if (dialog.hasAttribute('data-busy')) event.preventDefault();
    });
  });

  grid.addEventListener('click', function (event) {
    var editBtn = event.target.closest('[data-edit]');
    var delBtn = event.target.closest('[data-delete]');
    if (editBtn) {
      current = find(editBtn.getAttribute('data-edit'));
      document.getElementById('editGoalName').textContent = current.goalTitle;
      range.value = current.goalProgress;
      editForm.querySelector('input[value="' + current.goalStatus + '"]').checked = true;
      syncRange();
      syncHint();
      GL.openDialog(editDialog, editBtn);
    }
    if (delBtn) {
      current = find(delBtn.getAttribute('data-delete'));
      document.getElementById('deleteDesc').textContent = '‘' + current.goalTitle + '’ 목표를 삭제하면 되돌릴 수 없어요. 연결된 기록은 자유 기록으로 남습니다.';
      GL.openDialog(deleteDialog, delBtn);
    }
  });

  var view = GL.stateView(document.getElementById('goalsView'), {
    successMessage: '목표 목록을 불러왔습니다.',
    emptyMessage: '등록한 목표가 없습니다.',
    render: render
  });
})();
