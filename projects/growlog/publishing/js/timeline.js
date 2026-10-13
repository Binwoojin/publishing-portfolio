/* GrowLog — Timeline */
(function () {
  var d = GL.data;
  var CURRENT = d.today.slice(0, 7);
  var FIRST = d.timeline[d.timeline.length - 1].createdAt.slice(0, 7);
  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  var month = /^\d{4}-\d{2}$/.test(GL.param('month') || '') ? GL.param('month') : CURRENT;
  var filter = 'ALL';

  var prevBtn = document.getElementById('prevMonth');
  var nextBtn = document.getElementById('nextMonth');
  var title = document.getElementById('monthTitle');

  function shift(ym, diff) {
    var y = Number(ym.slice(0, 4));
    var m = Number(ym.slice(5, 7)) - 1 + diff;
    var date = new Date(y, m, 1);
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
  }

  function render() {
    title.textContent = month.slice(0, 4) + '년 ' + Number(month.slice(5, 7)) + '월';
    prevBtn.disabled = month <= FIRST;
    nextBtn.disabled = month >= CURRENT;

    var inMonth = d.timeline.filter(function (item) { return item.createdAt.indexOf(month) === 0; });
    var goals = inMonth.filter(function (i) { return i.type === 'GOAL'; }).length;
    var records = inMonth.length - goals;

    var summary = [
      '<li>' + GL.icon('pen') + '기록 <strong>' + records + '</strong>개</li>',
      '<li>' + GL.icon('target') + '목표 등록 <strong>' + goals + '</strong>개</li>'
    ];
    if (month === CURRENT) summary.push('<li>' + GL.icon('flame') + '연속 기록 <strong>' + d.summary.streakDays + '</strong>일</li>');
    document.getElementById('monthSummary').innerHTML = summary.join('');

    var items = inMonth.filter(function (i) { return filter === 'ALL' || i.type === filter; });
    var list = document.getElementById('timelineList');

    if (!items.length) {
      var what = filter === 'GOAL' ? '등록한 목표가' : filter === 'RECORD' ? '남긴 기록이' : '기록이';
      list.innerHTML = '<div class="state-box"><span class="state-box__icon">' + GL.icon('inbox') + '</span>' +
        '<p class="state-box__title">이 달에는 ' + what + ' 없어요</p>' +
        '<p class="state-box__desc">다른 달로 이동하거나 필터를 바꿔 보세요.</p></div>';
      return;
    }

    /* 날짜별로 묶기 (데이터는 이미 최신순) */
    var groups = [];
    items.forEach(function (item) {
      var day = item.createdAt.slice(0, 10);
      var last = groups[groups.length - 1];
      if (!last || last.day !== day) groups.push({ day: day, items: [item] });
      else last.items.push(item);
    });

    list.innerHTML = '<ol class="tl">' + groups.map(function (group) {
      var date = new Date(group.day + 'T00:00:00');
      return '<li class="tl__day">' +
        '<h3 class="tl__date"><time datetime="' + group.day + '">' + GL.formatDate(group.day, 'short') + '</time><small>' + WEEKDAYS[date.getDay()] + '요일</small></h3>' +
        '<ol class="tl__items">' + group.items.map(renderItem).join('') + '</ol></li>';
    }).join('') + '</ol>';
  }

  function renderItem(item) {
    var isGoal = item.type === 'GOAL';
    var meta = '<div class="tl-item__meta">' +
      (isGoal ? '<span class="chip chip--green">' + GL.icon('target') + '목표 등록</span>' : '<span class="chip chip--amber">' + GL.icon('pen') + '기록</span>') +
      (isGoal ? '' : '<time datetime="' + item.createdAt + '">' + GL.formatDate(item.createdAt, 'time') + '</time>') +
      '</div>';
    return '<li class="tl-item tl-item--' + (isGoal ? 'goal' : 'record') + '">' +
      '<a class="card tl-item__card" href="' + item.detailUrl + '">' + meta +
      '<h4 class="tl-item__title">' + GL.esc(item.title) + '</h4>' +
      '<p class="tl-item__text">' + GL.esc(item.content) + '</p></a></li>';
  }

  function move(diff) {
    month = shift(month, diff);
    history.replaceState(null, '', '?month=' + month);
    view.load();
  }

  prevBtn.addEventListener('click', function () { move(-1); });
  nextBtn.addEventListener('click', function () { move(1); });

  document.querySelectorAll('[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filter = btn.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      render();
      GL.announce(btn.textContent + ' 항목을 보여줍니다.');
    });
  });

  var view = GL.stateView(document.getElementById('timelineView'), {
    successMessage: '타임라인을 불러왔습니다.',
    emptyMessage: '타임라인이 비어 있습니다.',
    render: render
  });
})();
