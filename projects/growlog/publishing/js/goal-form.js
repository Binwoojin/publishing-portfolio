/* GrowLog — 새 목표 폼 */
(function () {
  var form = document.getElementById('goalForm');
  var title = document.getElementById('goalTitle');
  var content = document.getElementById('goalContent');
  var start = document.getElementById('startDate');
  var end = document.getElementById('endDate');
  var alertBox = document.getElementById('goalAlert');

  /* 분류 선택지 — 데이터의 분류 목록으로 만든다 */
  document.getElementById('categoryList').innerHTML = GL.data.categories.map(function (c) {
    return '<label class="choice"><input type="radio" name="categoryNum" value="' + c.categoryNum + '">' +
      '<span class="choice__box">' + GL.icon(c.categoryIcon) + GL.esc(c.categoryName) + '</span></label>';
  }).join('');

  start.value = GL.data.today;

  /* 글자 수 카운터 */
  function bindCounter(input, counterId) {
    var counter = document.getElementById(counterId);
    var max = Number(input.getAttribute('maxlength'));
    function update() {
      counter.textContent = input.value.length + ' / ' + max;
      counter.classList.toggle('is-over', input.value.length >= max);
    }
    input.addEventListener('input', update);
    update();
  }
  bindCounter(title, 'goalTitleCount');
  bindCounter(content, 'goalContentCount');

  /* 메시지 표시 — 원래 도움말은 data-help 로 보관 */
  function show(input, msgEl, text) {
    if (msgEl.dataset.help === undefined) msgEl.dataset.help = msgEl.hidden ? '' : msgEl.textContent;
    if (input) input.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (text) {
      msgEl.className = 'field__error';
      msgEl.innerHTML = GL.icon('alert') + '<span>' + GL.esc(text) + '</span>';
      msgEl.hidden = false;
    } else {
      msgEl.className = 'field__help';
      msgEl.textContent = msgEl.dataset.help;
      msgEl.hidden = !msgEl.dataset.help;
    }
  }

  var categoryGroup = document.getElementById('categoryGroup');
  var categoryError = document.getElementById('categoryError');
  categoryGroup.addEventListener('change', function () { show(null, categoryError, ''); });
  title.addEventListener('input', function () {
    if (title.value.trim()) show(title, document.getElementById('goalTitleMsg'), '');
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var errors = [];
    var category = form.querySelector('input[name="categoryNum"]:checked');

    if (!category) {
      show(null, categoryError, '분류를 선택해 주세요.');
      errors.push({ focus: form.querySelector('input[name="categoryNum"]'), text: '분류를 선택해 주세요.' });
    }
    if (!title.value.trim()) {
      show(title, document.getElementById('goalTitleMsg'), '목표 이름을 입력해 주세요.');
      errors.push({ focus: title, text: '목표 이름을 입력해 주세요.' });
    }
    if (!start.value) {
      show(start, document.getElementById('startDateMsg'), '시작일을 선택해 주세요.');
      errors.push({ focus: start, text: '시작일을 선택해 주세요.' });
    } else {
      show(start, document.getElementById('startDateMsg'), '');
    }
    if (end.value && start.value && end.value < start.value) {
      show(end, document.getElementById('endDateMsg'), '목표일은 시작일과 같거나 이후여야 합니다.');
      errors.push({ focus: end, text: '목표일은 시작일과 같거나 이후여야 합니다.' });
    } else {
      show(end, document.getElementById('endDateMsg'), '');
    }

    if (errors.length) {
      var list = document.getElementById('goalAlertList');
      list.innerHTML = errors.map(function (e, i) {
        return '<li><a href="#" data-index="' + i + '">' + GL.esc(e.text) + '</a></li>';
      }).join('');
      list.onclick = function (ev) {
        var link = ev.target.closest('a');
        if (!link) return;
        ev.preventDefault();
        errors[Number(link.getAttribute('data-index'))].focus.focus();
      };
      alertBox.hidden = false;
      alertBox.focus();
      return;
    }

    alertBox.hidden = true;
    var submit = form.querySelector('[type="submit"]');
    submit.classList.add('is-loading');
    setTimeout(function () {
      GL.flash('‘' + title.value.trim() + '’ 목표를 등록했어요.');
      location.href = 'goals.html';
    }, 800);
  });
})();
