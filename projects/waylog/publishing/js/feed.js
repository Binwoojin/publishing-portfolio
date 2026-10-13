/* WayLog — 여행 피드 (더 보기 · 태그 필터 · 글쓰기) */
(function () {
  var D = WL.data;
  var PAGE = 4;
  var shown = PAGE;
  var tag = WL.param('tag') || '';

  var list = document.getElementById('postList');
  var moreBtn = document.getElementById('loadMore');

  function posts() {
    return WL.allPosts().filter(function (p) { return !tag || p.tags.indexOf(tag) > -1; });
  }

  function render() {
    var all = posts();
    var filterBar = tag ? '<p class="feed-filter"><span>#' + WL.esc(tag) + ' 이야기 ' + all.length + '개</span><button class="btn btn--ghost btn--sm" type="button" data-clear-tag>' + WL.icon('x') + '필터 해제</button></p>' : '';
    list.innerHTML = filterBar + all.slice(0, shown).map(WL.postCard).join('');
    var done = shown >= all.length;
    moreBtn.hidden = done;
    document.getElementById('feedEnd').hidden = !done || all.length === 0;
    WL.syncToggles(list);
  }

  /* 사이드: 태그 · 코스 */
  function renderAside() {
    var counts = {};
    WL.allPosts().forEach(function (p) { p.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 10);
    document.getElementById('tagCloud').innerHTML = tags.map(function (t) {
      return '<li><button class="filter-chip" type="button" data-tag="' + WL.esc(t) + '" aria-pressed="' + (t === tag) + '">#' + WL.esc(t) + ' <span class="count">' + counts[t] + '</span></button></li>';
    }).join('');
    var ranked = D.courses.map(function (c) {
      return { c: c, n: WL.allPosts().filter(function (p) { return p.course === c.id; }).length };
    }).sort(function (a, b) { return b.n - a.n; });
    document.getElementById('asideCourses').innerHTML = ranked.map(function (x) {
      return '<li><a href="course.html?id=' + x.c.id + '"><span>' + WL.esc(x.c.title) + '</span><span class="mono">' + x.n + '개</span></a></li>';
    }).join('');
  }

  function setTag(next) {
    tag = next;
    shown = PAGE;
    history.replaceState(null, '', location.pathname + (tag ? '?tag=' + encodeURIComponent(tag) : ''));
    renderAside();
    view.load();
  }

  document.getElementById('tagCloud').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tag]');
    if (b) setTag(b.getAttribute('data-tag') === tag ? '' : b.getAttribute('data-tag'));
  });
  list.addEventListener('click', function (e) {
    if (e.target.closest('[data-clear-tag]')) setTag('');
  });

  moreBtn.addEventListener('click', function () {
    moreBtn.classList.add('is-loading');
    moreBtn.textContent = '불러오는 중';
    setTimeout(function () {
      var before = shown;
      shown += PAGE;
      moreBtn.classList.remove('is-loading');
      moreBtn.textContent = '더 보기';
      render();
      /* 새로 불러온 첫 게시물로 포커스를 옮겨 이어서 읽게 한다 */
      var cards = list.querySelectorAll('.post-card');
      if (cards[before]) {
        cards[before].setAttribute('tabindex', '-1');
        cards[before].focus();
      }
      WL.announce('게시물 ' + Math.min(PAGE, cards.length - before) + '개를 더 불러왔습니다.');
    }, 700);
  });

  var view = WL.stateView(document.getElementById('feedView'), {
    resolve: function () { return posts().length ? 'success' : 'empty'; },
    render: render,
    messages: { success: '피드를 불러왔습니다.', empty: '등록된 이야기가 없습니다.' }
  });
  renderAside();

  /* ==========================================================================
     글쓰기
     ========================================================================== */
  var composer = document.getElementById('composer');
  var form = document.getElementById('composerForm');
  var text = document.getElementById('postText');
  var photoInput = document.getElementById('photoInput');
  var photoList = document.getElementById('photoList');
  var photoMsg = document.getElementById('photoMsg');
  var tagInput = document.getElementById('tagInput');
  var tagList = document.getElementById('tagList');
  var alertBox = document.getElementById('composerAlert');
  var photos = [];
  var tags = [];

  document.getElementById('postPlace').insertAdjacentHTML('beforeend', D.places.map(function (p) {
    return '<option value="' + p.id + '">' + WL.esc(p.name) + ' (' + WL.esc(WL.find.region(p.region).name) + ')</option>';
  }).join(''));
  document.getElementById('postCourse').insertAdjacentHTML('beforeend', D.courses.map(function (c) {
    return '<option value="' + c.id + '">' + WL.esc(c.title) + '</option>';
  }).join(''));

  function resetComposer() {
    form.reset();
    photos = [];
    tags = [];
    renderPhotos();
    renderTags();
    alertBox.hidden = true;
    text.removeAttribute('aria-invalid');
    document.getElementById('postTextCount').textContent = '0 / 1000';
  }

  document.getElementById('openComposer').addEventListener('click', function (e) {
    if (!WL.requireLogin(e.currentTarget, '글쓰기')) return;
    resetComposer();
    WL.openDialog(composer, e.currentTarget);
    text.focus();
  });

  text.addEventListener('input', function () {
    var c = document.getElementById('postTextCount');
    c.textContent = text.value.length + ' / 1000';
    c.classList.toggle('is-over', text.value.length >= 1000);
    if (text.value.trim()) { text.removeAttribute('aria-invalid'); alertBox.hidden = true; }
  });

  /* 사진: 형식 · 용량 · 개수 확인 후 640px 로 줄여 미리보기 (데모 저장용) */
  function shrink(file, done) {
    var url = URL.createObjectURL(file);
    var image = new Image();
    image.onload = function () {
      var w = Math.min(640, image.naturalWidth);
      var h = Math.round(image.naturalHeight * w / image.naturalWidth);
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(image, 0, 0, w, h);
      URL.revokeObjectURL(url);
      done(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = function () { URL.revokeObjectURL(url); done(null); };
    image.src = url;
  }
  function renderPhotos() {
    photoList.innerHTML = photos.map(function (p, i) {
      return '<li><img src="' + p.src + '" alt="' + WL.esc(p.name) + '"><button type="button" data-remove="' + i + '" aria-label="' + WL.esc(p.name) + ' 삭제">' + WL.icon('x') + '</button></li>';
    }).join('');
    document.querySelector('.photo-picker__add').hidden = photos.length >= 3;
  }
  function photoMessage(msg, isError) {
    photoMsg.className = isError ? 'field__error' : 'field__help';
    photoMsg.textContent = msg;
    photoMsg.hidden = !msg;
  }
  photoInput.addEventListener('change', function () {
    var files = Array.prototype.slice.call(photoInput.files);
    photoInput.value = '';
    var errors = [];
    files.forEach(function (f) {
      if (['image/jpeg', 'image/png', 'image/webp'].indexOf(f.type) === -1) errors.push(f.name + ': JPG · PNG · WebP만 올릴 수 있어요.');
      else if (f.size > 5 * 1024 * 1024) errors.push(f.name + ': 5MB 이하만 올릴 수 있어요.');
      else if (photos.length >= 3) errors.push(f.name + ': 사진은 3장까지 올릴 수 있어요.');
      else {
        var slot = { name: f.name, src: '' };
        photos.push(slot);
        shrink(f, function (src) {
          if (!src) { photos.splice(photos.indexOf(slot), 1); photoMessage(f.name + ': 이미지를 읽을 수 없어요.', true); }
          else slot.src = src;
          renderPhotos();
        });
      }
    });
    photoMessage(errors.join(' '), errors.length > 0);
  });
  photoList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-remove]');
    if (!b) return;
    var removed = photos.splice(Number(b.getAttribute('data-remove')), 1)[0];
    renderPhotos();
    photoMessage(removed.name + ' 사진을 뺐어요.', false);
    photoInput.focus();
  });

  /* 해시태그 */
  function renderTags() {
    tagList.innerHTML = tags.map(function (t, i) {
      return '<li class="chip chip--sea">#' + WL.esc(t) + '<button type="button" data-untag="' + i + '" aria-label="' + WL.esc(t) + ' 태그 삭제">' + WL.icon('x') + '</button></li>';
    }).join('');
  }
  function addTag() {
    var v = tagInput.value.replace(/[#,\s]/g, '').trim();
    tagInput.value = '';
    if (!v) return;
    if (tags.length >= 5) { WL.announce('해시태그는 5개까지 넣을 수 있어요.'); return; }
    if (tags.indexOf(v) === -1) tags.push(v);
    renderTags();
    WL.announce('#' + v + ' 태그를 추가했습니다.');
  }
  tagInput.addEventListener('keydown', function (e) {
    if (e.isComposing) return; /* 한글 조합 중 Enter 무시 */
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !tagInput.value && tags.length) { tags.pop(); renderTags(); }
  });
  tagInput.addEventListener('blur', addTag);
  tagList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-untag]');
    if (!b) return;
    tags.splice(Number(b.getAttribute('data-untag')), 1);
    renderTags();
    tagInput.focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!text.value.trim()) {
      text.setAttribute('aria-invalid', 'true');
      document.getElementById('composerAlertText').textContent = '내용을 입력해 주세요.';
      alertBox.hidden = false;
      text.focus();
      return;
    }
    var btn = document.getElementById('publishBtn');
    btn.classList.add('is-loading');
    btn.textContent = '게시 중';
    composer.setAttribute('data-busy', '');
    setTimeout(function () {
      var post = {
        id: 'm' + Date.now(), author: 'u1', date: new Date().toISOString().slice(0, 19),
        place: document.getElementById('postPlace').value || null,
        course: document.getElementById('postCourse').value || null,
        images: photos.filter(function (p) { return p.src; }).map(function (p) { return p.src; }),
        text: text.value.trim(), tags: tags.slice(), likes: 0, comments: []
      };
      WL.store.set('my-posts', [post].concat(WL.store.get('my-posts', [])));
      btn.classList.remove('is-loading');
      btn.textContent = '게시하기';
      composer.removeAttribute('data-busy');
      composer.dataset.skipReturn = '1';
      composer.close();
      tag = '';
      shown = PAGE;
      renderAside();
      view.set('success', true);
      var first = list.querySelector('.post-card');
      if (first) { first.setAttribute('tabindex', '-1'); first.focus(); }
      WL.toast('여행 이야기를 게시했어요.');
    }, 900);
  });
})();
