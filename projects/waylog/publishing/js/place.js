/* WayLog — 여행지 상세 */
(function () {
  var D = WL.data;
  var place = WL.find.place(WL.param('id') || 'p1');

  function miniPost(p) {
    var u = WL.find.user(p.author);
    return '<li class="mini-post">' + (p.images[0] ? '<img src="' + WL.thumb(p.images[0]) + '" alt="" loading="lazy" width="88" height="66">' : '<span></span>') +
      '<div><p class="mini-post__text"><a href="post.html?id=' + p.id + '">' + WL.esc(p.text) + '</a></p>' +
      '<p class="mini-post__meta">' + WL.esc(u.nickname) + ' · ' + WL.formatDate(p.date, 'relative') + ' · 좋아요 ' + p.likes + '</p></div></li>';
  }

  function render() {
    if (!place) return;
    var r = WL.find.region(place.region);
    document.title = place.name + ' | WayLog';
    var posts = WL.allPosts().filter(function (p) { return p.place === place.id; });
    var inCourses = D.courses.filter(function (c) { return c.stops.some(function (s) { return s.place === place.id; }); });
    var near = D.places.filter(function (p) { return p.region === place.region && p.id !== place.id; })
      .concat(D.places.filter(function (p) { return p.region !== place.region; })).slice(0, 4);
    var mapUrl = 'https://map.kakao.com/link/map/' + encodeURIComponent(place.name) + ',' + place.lat + ',' + place.lng;

    var info = [
      ['pin', '주소', place.address], ['clock', '운영시간', place.hours], ['calendar', '휴무일', place.closed],
      ['ticket', '이용요금', place.fee], ['car', '주차', place.parking], ['phone', '문의', place.tel]
    ];

    document.getElementById('placeContent').innerHTML =
      '<nav class="breadcrumb" aria-label="현재 위치"><ol><li><a href="index.html">홈</a></li><li><a href="destinations.html">여행지</a></li>' +
      '<li><a href="destinations.html?region=' + r.id + '">' + WL.esc(r.name) + '</a></li><li><span aria-current="page">' + WL.esc(place.name) + '</span></li></ol></nav>' +
      '<header class="detail-head"><div class="detail-head__chips"><span class="chip chip--primary">' + D.types[place.type] + '</span><span class="chip">' + WL.esc(r.name) + '</span></div>' +
      '<div class="detail-head__row"><div><h1 class="detail-head__title">' + WL.esc(place.name) + '</h1>' +
      '<p class="detail-head__sub"><span>' + WL.icon('pin') + WL.esc(place.address) + '</span><span class="mono">' + WL.coord(place.lat, place.lng) + '</span></p></div>' +
      '<div class="detail-actions"><button class="toggle toggle--save" type="button" data-save="place:' + place.id + '" aria-pressed="false">' + WL.icon('bookmark') + '<span data-save-label>저장</span></button>' +
      '<button class="toggle" type="button" id="shareBtn">' + WL.icon('share') + '공유</button></div></div></header>' +
      '<figure class="detail-photo">' + WL.img(place.image, place.name + ' 풍경', { eager: true, sizes: '(min-width: 1024px) 840px, 100vw' }) +
      '<figcaption class="detail-photo__coord">' + WL.coord(place.lat, place.lng) + '</figcaption></figure>' +
      '<div class="detail-body"><div>' +
        '<section class="detail-section" aria-labelledby="introTitle"><h2 class="detail-section__title" id="introTitle">소개</h2>' +
        '<p class="detail-lead">' + WL.esc(place.desc) + '</p>' +
        '<ul class="detail-tags">' + place.tags.map(function (t) { return '<li><a class="chip" href="destinations.html?q=' + encodeURIComponent(t) + '">#' + WL.esc(t) + '</a></li>'; }).join('') + '</ul></section>' +
        '<section class="detail-section"><div class="notice-box" role="note">' + WL.icon('info') + '<p><strong>방문 전 확인하세요</strong>운영시간과 휴무일은 현지 사정에 따라 바뀔 수 있어요. 방문 전에 문의 전화로 확인해 주세요.</p></div></section>' +
        '<section class="detail-section" aria-labelledby="storyTitle"><h2 class="detail-section__title" id="storyTitle">이곳을 다녀온 여행 이야기 <span class="mono">' + posts.length + '</span></h2>' +
        (posts.length ? '<ul class="mini-posts">' + posts.map(miniPost).join('') + '</ul>' : '<p class="empty-line">아직 이곳을 태그한 이야기가 없어요. <a class="text-link" href="feed.html">첫 이야기 남기기</a></p>') + '</section>' +
      '</div>' +
      '<aside class="detail-aside" aria-label="이용 안내"><div class="info-card"><h2 class="info-card__title">이용 안내</h2><dl class="info-list">' +
        info.map(function (i) { return '<div>' + WL.icon(i[0]) + '<dt>' + i[1] + '</dt><dd>' + WL.esc(i[2]) + '</dd></div>'; }).join('') +
        '</dl><a class="btn btn--outline btn--block" href="' + mapUrl + '" target="_blank" rel="noopener noreferrer">' + WL.icon('pin') + '지도에서 보기<span class="blind"> (새 창)</span></a>' +
        (inCourses.length ? '<p class="info-card__source">이 여행지가 포함된 코스: ' + inCourses.map(function (c) { return '<a class="text-link" href="course.html?id=' + c.id + '">' + WL.esc(c.title) + '</a>'; }).join(', ') + '</p>' : '') +
        '<p class="info-card__source">원본 서비스의 관광 정보는 한국관광공사 TourAPI로 제공됩니다.</p></div></aside>' +
      '</div>' +
      '<section class="related" aria-labelledby="nearTitle"><div class="section-head"><h2 class="section-head__title" id="nearTitle">함께 둘러보면 좋은 여행지</h2></div>' +
      '<div class="card-grid">' + near.map(function (p) { return WL.placeCard(p); }).join('') + '</div></section>';

    WL.syncToggles();
    document.getElementById('shareBtn').addEventListener('click', function () {
      var url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { WL.toast('링크를 복사했어요.'); }, function () { WL.toast('주소창의 링크를 복사해 주세요.'); });
      } else {
        WL.toast('주소창의 링크를 복사해 주세요.');
      }
    });
  }

  WL.stateView(document.getElementById('placeView'), {
    resolve: function () { return place ? 'success' : 'empty'; },
    render: render,
    messages: { success: '여행지 정보를 불러왔습니다.', empty: '여행지를 찾을 수 없습니다.' }
  });
})();
