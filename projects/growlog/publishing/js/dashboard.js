/* GrowLog — Dashboard */
(function () {
  var d = GL.data;

  document.getElementById('todayLabel').textContent = GL.formatDate(d.today, 'long');

  function renderStats() {
    document.getElementById('statGoals').innerHTML = d.summary.activeGoalCount + '<small>개</small>';
    document.getElementById('statRecords').innerHTML = d.summary.recordsThisMonth + '<small>개</small>';
    document.getElementById('statStreak').innerHTML = d.summary.streakDays + '<small>일</small>';
  }

  /* 최근 12주 히트맵 — 열은 주(일~토), 오늘이 있는 주가 마지막 열 */
  function renderHeatmap() {
    var today = new Date(d.today + 'T00:00:00');
    var end = new Date(today);
    end.setDate(today.getDate() + (6 - today.getDay())); // 이번 주 토요일
    var start = new Date(end);
    start.setDate(end.getDate() - 83);

    var cells = [];
    var months = [];
    var activeDays = 0;
    var total = 0;
    var lastMonth = -1;

    for (var i = 0; i < 84; i++) {
      var day = new Date(start);
      day.setDate(start.getDate() + i);
      var key = toKey(day);
      var future = day > today;
      var count = future ? 0 : (d.activity[key] || 0);
      if (count > 0) { activeDays += 1; total += count; }

      /* 주의 첫날(일요일)에 달이 바뀌면 월 라벨 표시 */
      if (i % 7 === 0) {
        var label = '';
        if (day.getMonth() !== lastMonth) { label = (day.getMonth() + 1) + '월'; lastMonth = day.getMonth(); }
        months.push('<span>' + label + '</span>');
      }

      var cls = 'heatmap__cell' + (future ? ' is-empty' : '') + (key === d.today ? ' is-today' : '');
      var title = future ? '' : ' title="' + GL.formatDate(key, 'short') + ' · 기록 ' + count + '개"';
      cells.push('<span class="' + cls + '" data-level="' + Math.min(count, 3) + '"' + title + '></span>');
    }

    var grid = document.getElementById('heatGrid');
    grid.innerHTML = cells.join('');
    grid.setAttribute('aria-label', '최근 12주 동안 ' + activeDays + '일 기록, 총 ' + total + '개의 기록을 남겼습니다. 오늘까지 ' + d.summary.streakDays + '일 연속 기록 중입니다.');
    document.getElementById('heatMonths').innerHTML = months.join('');
    document.getElementById('heatSummary').innerHTML = '84일 중 <strong>' + activeDays + '일</strong> 기록';
  }

  function toKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function renderGoals() {
    var list = d.goals
      .filter(function (g) { return g.goalStatus === '진행중'; })
      .sort(function (a, b) { return b.goalProgress - a.goalProgress; })
      .slice(0, 3);

    document.getElementById('miniGoals').innerHTML = list.map(function (g) {
      var dday = GL.dday(g.endDate);
      return '<li class="mini-goal">' +
        '<div class="mini-goal__head">' + GL.categoryBadge(g.category) +
        '<strong class="mini-goal__title">' + GL.esc(g.goalTitle) + '</strong>' +
        (dday ? '<span class="mini-goal__dday">' + dday + '</span>' : '') + '</div>' +
        GL.progressBar(g.goalProgress, '진행률', g.goalTitle + ' 진행률') +
        '</li>';
    }).join('');
  }

  function renderFeed() {
    document.getElementById('feed').innerHTML = d.timeline.slice(0, 5).map(function (item) {
      var isGoal = item.type === 'GOAL';
      return '<li class="feed__item">' +
        '<span class="feed__type feed__type--' + (isGoal ? 'goal' : 'record') + '">' + GL.icon(isGoal ? 'target' : 'pen') + '</span>' +
        '<span><a class="feed__title" href="' + item.detailUrl + '">' + GL.esc(item.title) + '</a>' +
        '<span class="feed__sub">' + (isGoal ? '목표 등록' : '기록 작성') + '</span></span>' +
        '<time class="feed__date" datetime="' + item.createdAt + '">' + GL.formatDate(item.createdAt, 'short') + '</time>' +
        '</li>';
    }).join('');
  }

  GL.stateView(document.getElementById('dashboardView'), {
    successMessage: '대시보드를 불러왔습니다.',
    emptyMessage: '아직 기록이 없습니다. 첫 목표를 세워 보세요.',
    render: function () {
      renderStats();
      renderHeatmap();
      renderGoals();
      renderFeed();
    }
  });
})();
