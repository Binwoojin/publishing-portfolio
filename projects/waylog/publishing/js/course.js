/* WayLog — 여행 코스 상세 (경로 타임라인 + 좌표로 그린 경로 지도) */
(function () {
  var D = WL.data;
  var course = WL.find.course(WL.param('id') || 'c1');

  /* 두 좌표 사이 직선거리(km) — 하버사인 공식 */
  function distance(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function km(v) { return v < 1 ? Math.round(v * 1000) + 'm' : v.toFixed(1) + 'km'; }

  /* 등장방형 투영: 위도에 따라 경도 간격을 cos(위도)만큼 줄여 실제 비율에 가깝게 그린다 */
  function routeMap(stops) {
    var W = 600, PAD = 56;
    var meanLat = stops.reduce(function (s, p) { return s + p.lat; }, 0) / stops.length;
    var k = Math.cos(meanLat * Math.PI / 180);
    var xs = stops.map(function (p) { return p.lng * k; });
    var ys = stops.map(function (p) { return -p.lat; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var spanX = Math.max(maxX - minX, 1e-4), spanY = Math.max(maxY - minY, 1e-4);
    var scale = Math.min((W - PAD * 2) / spanX, 380 / spanY);
    var H = Math.max(320, Math.round(spanY * scale + PAD * 2));
    var offX = (W - spanX * scale) / 2;
    var offY = (H - spanY * scale) / 2;
    var pts = stops.map(function (p, i) {
      return { x: offX + (xs[i] - minX) * scale, y: offY + (ys[i] - minY) * scale, name: p.name };
    });

    /* 축척 막대: 지도 폭의 1/4 근처의 보기 좋은 거리 */
    var unitsPerKm = scale / 111.32;
    var nice = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100].filter(function (v) { return v * unitsPerKm <= W / 4; }).pop() || 0.1;
    var barW = nice * unitsPerKm;

    var grid = '';
    for (var gx = 60; gx < W; gx += 60) grid += '<line class="route-map__grid" x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + H + '"/>';
    for (var gy = 60; gy < H; gy += 60) grid += '<line class="route-map__grid" x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '"/>';

    var path = 'M' + pts.map(function (p) { return p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' L');
    /* 라벨 겹침 피하기: 오른쪽 위 → 오른쪽 아래 → 왼쪽 위 → 왼쪽 아래 순으로 빈 자리를 찾는다 */
    var boxes = pts.map(function (p) { return { x1: p.x - 12, y1: p.y - 12, x2: p.x + 12, y2: p.y + 12 }; });
    function hits(b) {
      return b.x1 < 4 || b.x2 > W - 4 || b.y1 < 4 || b.y2 > H - 4 || boxes.some(function (o) { return b.x1 < o.x2 && b.x2 > o.x1 && b.y1 < o.y2 && b.y2 > o.y1; });
    }
    var marks = pts.map(function (p, i) {
      var last = i === pts.length - 1;
      var w = p.name.length * 12.5;
      var spots = [[1, -1], [1, 1], [-1, -1], [-1, 1]].map(function (d) {
        var tx = p.x + d[0] * 16, ty = p.y + (d[1] < 0 ? -14 : 24);
        return { tx: tx, ty: ty, anchor: d[0] > 0 ? 'start' : 'end', box: { x1: d[0] > 0 ? tx : tx - w, y1: ty - 13, x2: d[0] > 0 ? tx + w : tx, y2: ty + 4 } };
      });
      var spot = spots.filter(function (c) { return !hits(c.box); })[0] || spots[0];
      boxes.push(spot.box);
      return '<circle class="route-map__dot' + (last ? ' route-map__dot--end' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="11"/>' +
        '<text class="route-map__num" x="' + p.x.toFixed(1) + '" y="' + p.y.toFixed(1) + '">' + (i + 1) + '</text>' +
        '<text class="route-map__label" x="' + spot.tx.toFixed(1) + '" y="' + spot.ty.toFixed(1) + '" text-anchor="' + spot.anchor + '">' + WL.esc(p.name) + '</text>';
    }).join('');

    return '<figure class="route-map"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="mapDesc">' +
      '<desc id="mapDesc">' + stops.length + '개 지점의 위치를 실제 좌표 비율로 그린 경로 지도. 순서: ' + WL.esc(stops.map(function (s) { return s.name; }).join(' → ')) + '</desc>' +
      grid + '<path class="route-map__path" d="' + path + '"/>' + marks +
      '<g transform="translate(' + (W - 24 - barW).toFixed(1) + ' ' + (H - 20) + ')"><line class="route-map__scale" x1="0" y1="0" x2="' + barW.toFixed(1) + '" y2="0"/>' +
      '<line class="route-map__scale" x1="0" y1="-4" x2="0" y2="4"/><line class="route-map__scale" x1="' + barW.toFixed(1) + '" y1="-4" x2="' + barW.toFixed(1) + '" y2="4"/>' +
      '<text class="route-map__scale-text" x="' + (barW / 2).toFixed(1) + '" y="-8" text-anchor="middle">' + km(nice) + '</text></g>' +
      '<text class="route-map__north" x="24" y="28">N ↑</text></svg>' +
      '<figcaption class="route-map__caption">좌표를 같은 축척으로 그린 개략도입니다. 실제 이동 경로는 도로 사정에 따라 달라요.</figcaption></figure>';
  }

  function render() {
    if (!course) return;
    var r = WL.find.region(course.region);
    document.title = course.title + ' | WayLog';
    var legs = course.stops.slice(1).map(function (s, i) { return distance(course.stops[i], s); });
    var total = legs.reduce(function (a, b) { return a + b; }, 0);
    var posts = WL.allPosts().filter(function (p) { return p.course === course.id; });
    var others = D.courses.filter(function (c) { return c.id !== course.id; });

    var stops = course.stops.map(function (s, i) {
      var name = s.place ? '<a href="place.html?id=' + s.place + '">' + WL.esc(s.name) + '</a>' : WL.esc(s.name);
      return '<li class="route__stop"><span class="route__marker" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<div class="route__card"><p class="route__time"><span class="blind">' + (i + 1) + '번째 지점, </span>' + WL.esc(s.time) + '</p>' +
        '<h3 class="route__name">' + name + '</h3><p class="route__note">' + WL.esc(s.note) + '</p>' +
        (legs[i] !== undefined ? '<p class="route__leg">' + WL.icon('route') + '다음 지점까지 직선 ' + km(legs[i]) + '</p>' : '') +
        '</div></li>';
    }).join('');

    document.getElementById('courseContent').innerHTML =
      '<nav class="breadcrumb" aria-label="현재 위치"><ol><li><a href="index.html">홈</a></li><li><a href="destinations.html?type=course">여행코스</a></li><li><span aria-current="page">' + WL.esc(course.title) + '</span></li></ol></nav>' +
      '<header class="detail-head"><div class="detail-head__chips"><span class="chip chip--primary">' + WL.esc(course.days) + '</span><span class="chip">' + WL.esc(r.name) + '</span><span class="chip">' + WL.esc(course.theme) + '</span></div>' +
      '<h1 class="detail-head__title">' + WL.esc(course.title) + '</h1><p class="detail-lead">' + WL.esc(course.desc) + '</p>' +
      '<dl class="course-stats"><div><dt>코스 일정</dt><dd>' + WL.esc(course.days) + '</dd></div><div><dt>들르는 곳</dt><dd><span class="mono">' + course.stops.length + '</span>곳</dd></div>' +
      '<div><dt>직선거리 합계</dt><dd><span class="mono">' + km(total) + '</span></dd></div><div><dt>작성</dt><dd>' + WL.esc(course.author) + '</dd></div></dl></header>' +
      '<div class="detail-body detail-body--course"><section aria-labelledby="routeTitle"><h2 class="detail-section__title" id="routeTitle">여행 일정</h2><ol class="route">' + stops + '</ol></section>' +
      '<aside class="detail-aside" aria-label="경로 지도">' + routeMap(course.stops) + '</aside></div>' +
      '<section class="related" aria-labelledby="storyTitle"><div class="section-head"><h2 class="section-head__title" id="storyTitle">이 코스를 다녀온 사람들의 이야기</h2></div>' +
      (posts.length ? '<div class="post-list post-list--grid">' + posts.map(WL.postCard).join('') + '</div>' : '<p class="empty-line">아직 이 코스로 남긴 이야기가 없어요.</p>') + '</section>' +
      '<section class="related" aria-labelledby="otherTitle"><div class="section-head"><h2 class="section-head__title" id="otherTitle">다른 추천 코스</h2></div>' +
      '<div class="course-grid">' + others.map(WL.courseCard).join('') + '</div></section>';
    WL.syncToggles();
  }

  WL.stateView(document.getElementById('courseView'), {
    resolve: function () { return course ? 'success' : 'empty'; },
    render: render,
    messages: { success: '코스 정보를 불러왔습니다.', empty: '코스를 찾을 수 없습니다.' }
  });
})();
