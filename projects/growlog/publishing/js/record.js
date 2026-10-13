/* GrowLog — 기록 상세 */
(function () {
  var d = GL.data;
  var id = Number(GL.param('id')) || d.records[0].recordNum;
  var index = -1;
  d.records.forEach(function (r, i) { if (r.recordNum === id) index = i; });
  var record = d.records[index];

  var DIFFICULTY = {
    GOAL: { EASY: ['쉬움', 1], NORMAL: ['보통', 2], HARD: ['어려움', 3] },
    FREE: { EASY: ['좋은 하루', 1], NORMAL: ['보통', 2], HARD: ['힘든 하루', 3] }
  };

  function note(type, iconName, label, text) {
    if (!text) return '';
    return '<section class="note note--' + type + '"><h2 class="note__title">' + GL.icon(iconName) + label + '</h2><p>' + GL.esc(text) + '</p></section>';
  }

  function render() {
    if (!record) return;
    var kind = record.goal ? 'GOAL' : 'FREE';
    var level = record.difficulty ? DIFFICULTY[kind][record.difficulty] : null;
    var images = record.mediaList.filter(function (m) { return m.mediaType === 'IMAGE'; });
    var video = record.mediaList.filter(function (m) { return m.mediaType === 'YOUTUBE'; })[0];

    document.title = record.title + ' | GrowLog';

    var labels = record.goal
      ? '<a class="chip chip--green" href="goals.html">' + GL.icon('target') + '<span class="blind">연결된 목표: </span>' + GL.esc(record.goal.goalTitle) + '</a>'
      : '<span class="chip chip--plain">' + GL.icon('book') + '자유 기록</span>';

    var levelHtml = level
      ? '<span class="level" data-level="' + level[1] + '">' + (kind === 'GOAL' ? '체감 난이도' : '오늘의 기분') + ' <strong>' + level[0] + '</strong>' +
        '<span class="level__bars" aria-hidden="true"><i></i><i></i><i></i></span></span>'
      : '';

    document.getElementById('recordArticle').innerHTML =
      '<header>' +
        '<div class="record__labels">' + labels + '</div>' +
        '<h1 class="record__title" id="recordTitle">' + GL.esc(record.title) + '</h1>' +
        '<div class="record__meta">' +
          '<span><time datetime="' + record.createdAt + '">' + GL.formatDate(record.createdAt, 'long') + ' ' + GL.formatDate(record.createdAt, 'time') + '</time>' +
          (levelHtml ? ' · ' + levelHtml : '') + '</span>' +
          '<div class="record__actions">' +
            '<a class="btn btn--outline btn--sm" href="record-new.html?id=' + record.recordNum + '">' + GL.icon('edit') + '수정</a>' +
            '<button class="btn btn--ghost btn--sm" type="button" id="deleteBtn">' + GL.icon('trash') + '삭제</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<p class="record__body">' + GL.esc(record.content) + '</p>' +
      (record.todayLearning || record.solution || record.retrospective
        ? '<div class="record__notes">' +
            note('learn', 'book', '오늘 배운 점', record.todayLearning) +
            note('solution', 'check', '어려웠던 점과 해결 방법', record.solution) +
            note('retro', 'pen', '회고', record.retrospective) +
          '</div>'
        : '') +
      (images.length
        ? '<div class="gallery">' + images.map(function (m, i) {
            return '<figure><img src="' + m.mediaUrl + '" alt="' + GL.esc(record.title) + ' 첨부 이미지 ' + (i + 1) + '" width="800" height="500" loading="lazy">' +
              '<figcaption>첨부 이미지 ' + (i + 1) + ' / ' + images.length + '</figcaption></figure>';
          }).join('') + '</div>'
        : '') +
      (video
        ? '<a class="video-link" href="' + GL.esc(video.mediaUrl) + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="video-link__thumb">' + GL.icon('play') + '</span>' +
            '<span><strong>첨부 영상 보기<span class="blind"> (새 창)</span></strong><span>' + GL.esc(video.mediaUrl) + '</span></span></a>'
        : '');

    /* 이전(더 최근) · 다음(더 오래된) 기록 */
    var newer = d.records[index - 1];
    var older = d.records[index + 1];
    document.getElementById('pager').innerHTML =
      (newer ? '<a href="record.html?id=' + newer.recordNum + '" rel="prev"><small>' + GL.icon('chevron-left') + '최근 기록</small><strong>' + GL.esc(newer.title) + '</strong></a>' : '') +
      (older ? '<a class="pager__next" href="record.html?id=' + older.recordNum + '" rel="next"><small>이전 기록' + GL.icon('chevron-right') + '</small><strong>' + GL.esc(older.title) + '</strong></a>' : '');

    document.getElementById('deleteBtn').addEventListener('click', function (event) {
      GL.openDialog(deleteDialog, event.currentTarget);
    });
  }

  var deleteDialog = document.getElementById('deleteDialog');
  var confirmBtn = document.getElementById('deleteConfirm');
  deleteDialog.addEventListener('cancel', function (event) {
    if (deleteDialog.hasAttribute('data-busy')) event.preventDefault();
  });
  confirmBtn.addEventListener('click', function () {
    confirmBtn.classList.add('is-loading');
    deleteDialog.setAttribute('data-busy', '');
    setTimeout(function () {
      GL.flash('‘' + record.title + '’ 기록을 삭제했어요.');
      location.href = 'timeline.html';
    }, 800);
  });

  GL.stateView(document.getElementById('recordView'), {
    successMessage: '기록을 불러왔습니다.',
    emptyMessage: '기록을 찾을 수 없습니다.',
    resolve: function () { return record ? 'success' : 'empty'; },
    render: render
  });

  /* 없는 id 로 들어오면 '기본' 상태 버튼은 쓸 수 없다 */
  if (!record) {
    document.querySelectorAll('[data-demo-state="success"]').forEach(function (b) { b.disabled = true; });
  }
})();
