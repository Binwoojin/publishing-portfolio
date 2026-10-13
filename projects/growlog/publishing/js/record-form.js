/* GrowLog — 기록 작성 · 수정 폼 (record-new.html, ?id= 가 있으면 수정 모드) */
(function () {
  var d = GL.data;
  var form = document.getElementById('recordForm');
  var goalField = document.getElementById('goalField');
  var goalSelect = document.getElementById('goalSelect');
  var alertBox = document.getElementById('recordAlert');
  var MAX_FILES = 5;
  var MAX_SIZE = 5 * 1024 * 1024;
  var YOUTUBE_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{6,}/;
  var LABELS = {
    GOAL: { legend: '체감 난이도', EASY: '쉬움', NORMAL: '보통', HARD: '어려움' },
    FREE: { legend: '오늘의 기분', EASY: '좋은 하루', NORMAL: '보통', HARD: '힘든 하루' }
  };

  /* 진행 중인 목표만 연결할 수 있다 */
  goalSelect.insertAdjacentHTML('beforeend', d.goals.filter(function (g) { return g.goalStatus === '진행중'; }).map(function (g) {
    return '<option value="' + g.goalNum + '">[' + GL.esc(g.category.categoryName) + '] ' + GL.esc(g.goalTitle) + '</option>';
  }).join(''));

  /* ---------- 기록 종류에 따라 목표 선택 · 난이도 문구 변경 ---------- */
  function syncType() {
    var type = form.querySelector('input[name="recordType"]:checked').value;
    goalField.hidden = type !== 'GOAL';
    document.getElementById('difficultyLegend').textContent = LABELS[type].legend;
    form.querySelectorAll('[data-label]').forEach(function (el) {
      el.textContent = LABELS[type][el.getAttribute('data-label')];
    });
  }
  form.querySelectorAll('input[name="recordType"]').forEach(function (r) { r.addEventListener('change', syncType); });

  /* ---------- 글자 수 ---------- */
  function bindCounter(id) {
    var input = document.getElementById(id);
    var counter = document.getElementById(id + 'Count');
    var max = Number(input.getAttribute('maxlength'));
    function update() {
      counter.textContent = input.value.length + ' / ' + max;
      counter.classList.toggle('is-over', input.value.length >= max);
    }
    input.addEventListener('input', update);
    return update;
  }
  var counters = [bindCounter('title'), bindCounter('content')];

  /* ---------- 메시지 ---------- */
  function show(input, msgEl, text, type) {
    if (msgEl.dataset.help === undefined) msgEl.dataset.help = msgEl.hidden ? '' : msgEl.textContent;
    if (input) input.setAttribute('aria-invalid', text && type !== 'help' ? 'true' : 'false');
    if (text) {
      msgEl.className = type === 'help' ? 'field__help' : 'field__error';
      msgEl.innerHTML = (type === 'help' ? '' : GL.icon('alert')) + '<span>' + GL.esc(text) + '</span>';
      msgEl.hidden = false;
    } else {
      msgEl.className = 'field__help';
      msgEl.textContent = msgEl.dataset.help;
      msgEl.hidden = !msgEl.dataset.help;
    }
  }

  ['title', 'content'].forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener('input', function () {
      if (input.value.trim()) show(input, document.getElementById(id + 'Msg'), '');
    });
  });
  goalSelect.addEventListener('change', function () {
    if (goalSelect.value) show(goalSelect, document.getElementById('goalSelectMsg'), '');
  });

  /* ---------- 이미지 첨부 (미리보기 · 개수/용량 제한) ---------- */
  var files = [];
  var imageInput = document.getElementById('imageInput');
  var imageMsg = document.getElementById('imageMsg');
  var previews = document.getElementById('previews');
  var dropzone = document.getElementById('dropzone');

  function addFiles(list) {
    var rejected = [];
    Array.prototype.forEach.call(list, function (file) {
      if (!/^image\//.test(file.type)) rejected.push(file.name + ': 이미지 파일이 아닙니다.');
      else if (file.size > MAX_SIZE) rejected.push(file.name + ': 5MB를 넘습니다.');
      else if (files.length >= MAX_FILES) rejected.push(file.name + ': 최대 5장까지 첨부할 수 있습니다.');
      else files.push({ name: file.name, url: URL.createObjectURL(file) });
    });
    renderPreviews();
    if (rejected.length) show(null, imageMsg, rejected.join(' '));
    else show(null, imageMsg, files.length + '장 첨부됨 (최대 5장)', 'help');
  }

  function renderPreviews() {
    previews.innerHTML = files.map(function (f, i) {
      return '<li class="preview"><img src="' + f.url + '" alt="' + GL.esc(f.name) + '">' +
        '<button type="button" data-remove="' + i + '" aria-label="' + GL.esc(f.name) + ' 첨부 삭제">' + GL.icon('x') + '</button></li>';
    }).join('');
  }

  imageInput.addEventListener('change', function () {
    addFiles(imageInput.files);
    imageInput.value = '';
  });
  ['dragenter', 'dragover'].forEach(function (type) {
    dropzone.addEventListener(type, function (e) { e.preventDefault(); dropzone.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    dropzone.addEventListener(type, function () { dropzone.classList.remove('is-over'); });
  });
  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  });

  previews.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    var index = Number(btn.getAttribute('data-remove'));
    var removed = files.splice(index, 1)[0];
    if (removed.url.indexOf('blob:') === 0) URL.revokeObjectURL(removed.url);
    renderPreviews();
    show(null, imageMsg, removed.name + ' 첨부를 삭제했습니다.', 'help');
    /* 지운 버튼 자리의 다음 버튼(없으면 업로드 영역)으로 포커스 이동 */
    var next = previews.querySelectorAll('[data-remove]')[Math.min(index, files.length - 1)];
    (next || imageInput).focus();
  });

  /* ---------- 수정 모드: 기존 기록 채우기 ---------- */
  var editId = Number(GL.param('id'));
  var editing = d.records.filter(function (r) { return r.recordNum === editId; })[0];
  if (editing) {
    document.title = '기록 수정 | GrowLog';
    document.getElementById('formTitle').textContent = '기록 수정';
    document.getElementById('submitBtn').lastChild.textContent = '수정 완료';
    ['backLink', 'cancelLink'].forEach(function (id) {
      document.getElementById(id).href = 'record.html?id=' + editing.recordNum;
    });
    document.getElementById('backLink').lastChild.textContent = '기록 상세';

    form.querySelector('input[name="recordType"][value="' + (editing.goal ? 'GOAL' : 'FREE') + '"]').checked = true;
    if (editing.goal) {
      if (!goalSelect.querySelector('option[value="' + editing.goal.goalNum + '"]')) {
        goalSelect.insertAdjacentHTML('beforeend', '<option value="' + editing.goal.goalNum + '">' + GL.esc(editing.goal.goalTitle) + '</option>');
      }
      goalSelect.value = editing.goal.goalNum;
    }
    ['title', 'content', 'todayLearning', 'solution', 'retrospective'].forEach(function (key) {
      document.getElementById(key).value = editing[key] || '';
    });
    if (editing.difficulty) form.querySelector('input[name="difficulty"][value="' + editing.difficulty + '"]').checked = true;
    editing.mediaList.forEach(function (m) {
      if (m.mediaType === 'IMAGE') files.push({ name: '첨부 이미지 ' + m.sortOrder, url: m.mediaUrl });
      if (m.mediaType === 'YOUTUBE') document.getElementById('youtubeUrl').value = m.mediaUrl;
    });
    renderPreviews();
  }
  syncType();
  counters.forEach(function (fn) { fn(); });

  /* ---------- 제출 ---------- */
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var errors = [];
    var type = form.querySelector('input[name="recordType"]:checked').value;
    var title = document.getElementById('title');
    var content = document.getElementById('content');
    var youtube = document.getElementById('youtubeUrl');

    function check(ok, input, msgId, text) {
      show(input, document.getElementById(msgId), ok ? '' : text);
      if (!ok) errors.push({ input: input, text: text });
    }

    check(type !== 'GOAL' || goalSelect.value, goalSelect, 'goalSelectMsg', '연결할 목표를 선택해 주세요.');
    check(title.value.trim(), title, 'titleMsg', '제목을 입력해 주세요.');
    check(content.value.trim(), content, 'contentMsg', '내용을 입력해 주세요.');
    check(!youtube.value || YOUTUBE_PATTERN.test(youtube.value), youtube, 'youtubeMsg', 'YouTube 영상 주소 형식이 아닙니다. (youtube.com/watch?v= 또는 youtu.be/)');

    if (errors.length) {
      var list = document.getElementById('recordAlertList');
      list.innerHTML = errors.map(function (e, i) {
        return '<li><a href="#" data-index="' + i + '">' + GL.esc(e.text) + '</a></li>';
      }).join('');
      list.onclick = function (ev) {
        var link = ev.target.closest('a');
        if (!link) return;
        ev.preventDefault();
        errors[Number(link.getAttribute('data-index'))].input.focus();
      };
      alertBox.hidden = false;
      alertBox.focus();
      return;
    }

    alertBox.hidden = true;
    document.getElementById('submitBtn').classList.add('is-loading');
    setTimeout(function () {
      GL.flash(editing ? '기록을 수정했어요.' : '오늘의 기록을 남겼어요. 내일도 이어가 볼까요?');
      location.href = 'record.html?id=' + (editing ? editing.recordNum : d.records[0].recordNum);
    }, 900);
  });
})();
