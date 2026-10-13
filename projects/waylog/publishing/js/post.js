/* WayLog — 게시물 상세 (좋아요 · 저장 · 댓글 작성/삭제 · 내 글 삭제) */
(function () {
  var D = WL.data;
  var id = WL.param('id') || 'f1';
  var post = WL.find.post(id);
  var confirmDialog = document.getElementById('confirmDialog');
  var confirmOk = document.getElementById('confirmOk');
  var pending = null; /* 확인 다이얼로그에서 실행할 동작 */

  function commentItem(c) {
    var u = WL.find.user(c.author);
    var mine = c.author === D.me.id && WL.auth.isMember();
    return '<li class="comment" id="comment-' + c.id + '">' + WL.avatar(u, 'sm') +
      '<div><p class="comment__head"><strong>' + WL.esc(u.nickname) + '</strong><time datetime="' + c.date + '">' + WL.formatDate(c.date, 'relative') + '</time></p>' +
      '<p class="comment__text">' + WL.esc(c.text) + '</p></div>' +
      (mine ? '<button class="btn btn--ghost btn--sm" type="button" data-delete-comment="' + c.id + '">삭제<span class="blind"> - 내 댓글</span></button>' : '<span></span>') + '</li>';
  }

  function renderComments() {
    var list = WL.commentsOf(post);
    document.getElementById('commentCount').textContent = list.length;
    document.getElementById('commentList').innerHTML = list.map(commentItem).join('');
    document.getElementById('commentEmpty').hidden = list.length > 0;
  }

  function render() {
    if (!post) return;
    var u = WL.find.user(post.author);
    document.title = u.nickname + '님의 여행 이야기 | WayLog';
    document.getElementById('postHeading').textContent = u.nickname + '님의 여행 이야기';
    var html = WL.postCard(post);
    /* 내 글이면 머리에 삭제 버튼 추가 */
    if (post.author === D.me.id && WL.auth.isMember()) {
      html = html.replace('</p></header>', '</p><button class="btn btn--ghost btn--sm post-owner" type="button" id="deletePost">' + WL.icon('trash') + '삭제</button></header>');
    }
    document.getElementById('postContent').innerHTML = html;
    renderComments();
    WL.syncToggles();

    var del = document.getElementById('deletePost');
    if (del) del.addEventListener('click', function () {
      ask('게시물을 삭제할까요?', '삭제한 게시물과 댓글은 되돌릴 수 없어요.', del, function () {
        WL.store.set('removed-posts', WL.store.get('removed-posts', []).concat(post.id));
        WL.flash('게시물을 삭제했어요.');
        location.href = 'feed.html';
      });
    });
  }

  function ask(title, desc, trigger, action) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDesc').textContent = desc;
    pending = action;
    WL.openDialog(confirmDialog, trigger);
  }
  confirmOk.addEventListener('click', function () {
    confirmOk.classList.add('is-loading');
    confirmDialog.setAttribute('data-busy', '');
    setTimeout(function () {
      confirmOk.classList.remove('is-loading');
      confirmDialog.removeAttribute('data-busy');
      var run = pending;
      pending = null;
      confirmDialog.dataset.skipReturn = '1';
      confirmDialog.close();
      if (run) run();
    }, 600);
  });

  /* 댓글 삭제 */
  document.getElementById('commentList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-delete-comment]');
    if (!b) return;
    var cid = b.getAttribute('data-delete-comment');
    ask('댓글을 삭제할까요?', '삭제한 댓글은 되돌릴 수 없어요.', b, function () {
      WL.store.set('removed-comments', WL.store.get('removed-comments', []).concat(cid));
      renderComments();
      document.getElementById('commentTitle').setAttribute('tabindex', '-1');
      document.getElementById('commentTitle').focus();
      WL.toast('댓글을 삭제했어요.');
    });
  });

  /* 댓글 작성 */
  var form = document.getElementById('commentForm');
  var text = document.getElementById('commentText');
  var msg = document.getElementById('commentMsg');
  function setMsg(error) {
    msg.className = error ? 'field__error' : 'field__help';
    msg.innerHTML = error ? WL.icon('alert') + '<span>' + error + '</span>' : '<span id="commentCountText">' + text.value.length + ' / 300</span>';
    text.setAttribute('aria-invalid', String(!!error));
  }
  text.addEventListener('focus', function () {
    if (!WL.auth.isMember()) { text.blur(); WL.requireLogin(text, '댓글 작성'); }
  });
  text.addEventListener('input', function () { setMsg(''); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!WL.requireLogin(form.querySelector('[type="submit"]'), '댓글 작성')) return;
    var value = text.value.trim();
    if (!value) { setMsg('댓글 내용을 입력해 주세요.'); text.focus(); return; }
    var c = { id: 'c' + Date.now(), author: D.me.id, date: new Date().toISOString().slice(0, 19), text: value };
    var key = 'comments-' + post.id;
    WL.store.set(key, WL.store.get(key, []).concat(c));
    text.value = '';
    setMsg('');
    renderComments();
    /* 방금 단 댓글을 잠깐 강조 */
    var item = document.getElementById('comment-' + c.id);
    if (item) item.classList.add('is-new');
    WL.announce('댓글을 등록했습니다.');
    WL.syncToggles();
  });

  WL.stateView(document.getElementById('postView'), {
    resolve: function () { return post ? 'success' : 'empty'; },
    render: render,
    messages: { success: '게시물을 불러왔습니다.', empty: '게시물을 찾을 수 없습니다.' }
  });
})();
