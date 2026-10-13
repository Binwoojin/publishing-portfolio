/*
 * 퍼블리싱 데모용 더미 데이터
 * 원본 GrowLog API 응답 타입(frontend/src/types/*.ts)과 같은 필드 구성을 따른다.
 * 화면 확인 날짜를 고정하기 위해 오늘 날짜를 DEMO_TODAY 로 둔다.
 */
window.GROWLOG = (function () {
  var DEMO_TODAY = '2026-09-22';

  var me = { memberNo: 1, email: 'grower@growlog.kr', nickname: '성장러', userName: '김성장' };

  var categories = [
    { categoryNum: 1, categoryName: '공부', categoryIcon: 'book', categoryColor: 'amber' },
    { categoryNum: 2, categoryName: '프로젝트', categoryIcon: 'target', categoryColor: 'green' },
    { categoryNum: 3, categoryName: '운동', categoryIcon: 'flame', categoryColor: 'rose' },
    { categoryNum: 4, categoryName: '습관', categoryIcon: 'sprout', categoryColor: 'sky' }
  ];

  function cat(num) {
    return categories.filter(function (c) { return c.categoryNum === num; })[0];
  }

  var goals = [
    { goalNum: 1, goalTitle: '포트폴리오 사이트 완성하기', goalContent: '작업물 5개를 정리하고 반응형 · 접근성 점검까지 마친 뒤 GitHub Pages로 배포한다.', goalProgress: 85, goalStatus: '진행중', startDate: '2026-08-20', endDate: '2026-09-30', createdAt: '2026-08-20', category: cat(2) },
    { goalNum: 2, goalTitle: '웹 접근성 KWCAG 2.2 정리하기', goalContent: '33개 검사 항목을 직접 실습 예제로 만들어 보고, 스크린리더(NVDA · VoiceOver)로 확인한다.', goalProgress: 72, goalStatus: '진행중', startDate: '2026-09-01', endDate: '2026-10-15', createdAt: '2026-09-01', category: cat(1) },
    { goalNum: 3, goalTitle: '주 3회 러닝 5km', goalContent: '퇴근 후 한강에서 달리기. 페이스보다 꾸준함을 목표로 한다.', goalProgress: 55, goalStatus: '진행중', startDate: '2026-09-01', endDate: '2026-12-31', createdAt: '2026-09-01', category: cat(3) },
    { goalNum: 4, goalTitle: '정보처리기사 실기 합격', goalContent: '기출 10회분을 풀고 오답 노트를 만든다.', goalProgress: 40, goalStatus: '진행중', startDate: '2026-08-01', endDate: '2026-11-20', createdAt: '2026-08-01', category: cat(1) },
    { goalNum: 5, goalTitle: 'GrowLog 리뉴얼 배포', goalContent: 'JSP 화면을 Vue SPA로 옮기고 운영 환경 설정까지 검증한다.', goalProgress: 100, goalStatus: '완료', startDate: '2026-07-13', endDate: '2026-07-30', createdAt: '2026-07-13', category: cat(2) },
    { goalNum: 6, goalTitle: 'SCSS 모듈 구조 익히기', goalContent: '@use · @forward 로 토큰 · 믹스인 · 컴포넌트 파일을 나누는 구조를 정리한다.', goalProgress: 100, goalStatus: '완료', startDate: '2026-07-10', endDate: '2026-08-15', createdAt: '2026-07-10', category: cat(1) },
    { goalNum: 7, goalTitle: '매일 영어 단어 30개 외우기', goalContent: '출근길 20분 동안 단어 앱으로 복습한다.', goalProgress: 20, goalStatus: '중단', startDate: '2026-06-01', endDate: '2026-07-31', createdAt: '2026-06-01', category: cat(4) },
    { goalNum: 8, goalTitle: '사이드 프로젝트 기획서 쓰기', goalContent: '동네 소모임 일정 공유 서비스 아이디어를 기획서로 정리한다.', goalProgress: 10, goalStatus: '중단', startDate: '2026-06-15', endDate: null, createdAt: '2026-06-15', category: cat(2) }
  ];

  function goalRef(num) {
    var g = goals.filter(function (x) { return x.goalNum === num; })[0];
    return g ? { goalNum: g.goalNum, goalTitle: g.goalTitle } : null;
  }

  var records = [
    { recordNum: 12, title: '포트폴리오 메인 반응형 점검', content: '375 · 768 · 1024 · 1440px 네 구간에서 메인 화면을 다시 확인했다. 태블릿 구간에서 프로젝트 카드가 2단으로 바뀔 때 썸네일 비율이 깨지는 문제가 있었다.', todayLearning: 'aspect-ratio 속성으로 썸네일 비율을 고정하면 이미지가 늦게 로드돼도 레이아웃이 밀리지 않는다(CLS 방지).', difficulty: 'NORMAL', solution: '썸네일 래퍼에 aspect-ratio: 16 / 10 을 주고 img 는 object-fit: cover 로 채웠다.', retrospective: '작은 화면부터 확인하는 습관을 들이자. 데스크톱 기준으로 만들고 줄이면 놓치는 게 많다.', createdAt: '2026-09-22T21:10:00', goal: goalRef(1), mediaList: [{ mediaNum: 1, mediaType: 'IMAGE', mediaUrl: 'images/record-1.svg', sortOrder: 1 }, { mediaNum: 2, mediaType: 'IMAGE', mediaUrl: 'images/record-2.svg', sortOrder: 2 }] },
    { recordNum: 11, title: '모달 포커스 트랩 구현', content: '삭제 확인 모달을 열었을 때 Tab 키 포커스가 모달 밖으로 빠져나가는 문제를 고쳤다.', todayLearning: '<dialog> 요소의 showModal() 을 쓰면 브라우저가 바깥 영역을 inert 처리해 준다. ESC 닫기도 기본 제공된다.', difficulty: 'HARD', solution: '직접 만든 div 모달을 <dialog> 로 바꾸고, 닫힌 뒤에는 모달을 연 버튼으로 포커스를 되돌렸다.', retrospective: '접근성은 기능을 덧붙이는 것보다 맞는 요소를 고르는 게 먼저다.', createdAt: '2026-09-21T22:30:00', goal: goalRef(2), mediaList: [] },
    { recordNum: 10, title: '한강 러닝 5.2km', content: '오늘은 페이스를 신경 쓰지 않고 끝까지 쉬지 않고 달리는 데 집중했다.', todayLearning: '처음 1km 를 천천히 달리면 후반이 훨씬 편하다.', difficulty: 'NORMAL', solution: null, retrospective: '이번 주 3회 달성!', createdAt: '2026-09-20T07:40:00', goal: goalRef(3), mediaList: [{ mediaNum: 3, mediaType: 'IMAGE', mediaUrl: 'images/record-3.svg', sortOrder: 1 }] },
    { recordNum: 9, title: '오랜만에 여유로운 주말', content: '카페에서 읽고 싶던 디자인 책을 읽었다. 기록할 만한 큰 일은 없었지만 쉬는 것도 성장의 일부라고 생각하기로 했다.', todayLearning: null, difficulty: 'EASY', solution: null, retrospective: '다음 주 계획을 미리 적어두니 마음이 편하다.', createdAt: '2026-09-19T16:00:00', goal: null, mediaList: [] },
    { recordNum: 8, title: '스크린리더로 폼 오류 메시지 확인', content: 'NVDA 로 회원가입 폼을 끝까지 입력해 보며 오류 메시지가 읽히는지 확인했다.', todayLearning: 'aria-describedby 로 입력창과 오류 문구를 연결하고, aria-invalid 로 오류 상태를 알려야 스크린리더가 함께 읽어 준다.', difficulty: 'NORMAL', solution: '오류 문구 영역에 id 를 주고 입력창의 aria-describedby 에 도움말 id 와 함께 넣었다.', retrospective: '눈으로 보는 것과 들리는 것이 완전히 달랐다. 테스트 도구로 꼭 확인할 것.', createdAt: '2026-09-18T20:15:00', goal: goalRef(2), mediaList: [] },
    { recordNum: 7, title: '프로젝트 상세 페이지 마크업', content: '작업물 상세 페이지를 article · section 단위로 나누고 제목 레벨을 정리했다.', todayLearning: '제목 태그는 크기가 아니라 문서 구조로 고른다. 스타일은 클래스로 따로 맞춘다.', difficulty: 'EASY', solution: null, retrospective: null, createdAt: '2026-09-16T23:00:00', goal: goalRef(1), mediaList: [] },
    { recordNum: 6, title: '실기 기출 2023년 1회', content: '시간을 재고 풀었다. SQL 문제에서 GROUP BY · HAVING 순서를 헷갈렸다.', todayLearning: 'WHERE 는 그룹화 전, HAVING 은 그룹화 후 조건이다.', difficulty: 'HARD', solution: '오답 노트에 실행 순서(FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY)를 적어 두었다.', retrospective: '68점. 다음 회차는 70점 넘기기.', createdAt: '2026-09-14T22:00:00', goal: goalRef(4), mediaList: [] },
    { recordNum: 5, title: '접근성 검사 항목 1~10 정리', content: '적절한 대체 텍스트부터 키보드 사용 보장까지 첫 10개 항목을 예제 코드와 함께 정리했다.', todayLearning: '장식 이미지는 alt="" 로 비워 스크린리더가 건너뛰게 한다.', difficulty: 'NORMAL', solution: null, retrospective: '하루 10개씩이면 4일이면 끝난다. 생각보다 할 만하다.', createdAt: '2026-09-08T21:30:00', goal: goalRef(2), mediaList: [] },
    { recordNum: 4, title: '포트폴리오 디자인 시안 확정', content: '모노톤 + 블루 포인트로 방향을 정했다. 큰 타이포와 얇은 구분선 위주.', todayLearning: null, difficulty: 'EASY', solution: null, retrospective: '고민하는 시간보다 만들어 보고 고치는 게 빠르다.', createdAt: '2026-09-03T19:00:00', goal: goalRef(1), mediaList: [] },
    { recordNum: 3, title: 'Vue SPA 새로고침 404 해결', content: '배포 후 상세 페이지에서 새로고침하면 404 가 났다.', todayLearning: 'History 모드 SPA 는 서버가 모든 경로를 index.html 로 돌려줘야 한다.', difficulty: 'HARD', solution: 'Spring 에 forward 컨트롤러를 추가해 API 가 아닌 경로를 index.html 로 넘겼다.', retrospective: '로컬에서는 dev 서버가 알아서 해 줘서 몰랐던 문제.', createdAt: '2026-07-28T23:40:00', goal: goalRef(5), mediaList: [] },
    { recordNum: 2, title: 'Loading · Empty · Error 상태 정리', content: '대시보드 · 타임라인 · 목표 화면의 상태별 UI 를 모두 캡처해서 점검했다.', todayLearning: '빈 상태 화면에는 다음 행동(버튼)을 함께 보여줘야 사용자가 멈추지 않는다.', difficulty: 'NORMAL', solution: null, retrospective: null, createdAt: '2026-07-24T22:10:00', goal: goalRef(5), mediaList: [] },
    { recordNum: 1, title: 'SCSS @use 로 파일 분리', content: '변수 · 믹스인 · 컴포넌트 파일을 나누고 @use 로 불러오도록 바꿨다.', todayLearning: '@import 는 전역 오염이 있어 deprecated 예정. @use 는 네임스페이스가 생긴다.', difficulty: 'NORMAL', solution: null, retrospective: '구조를 먼저 잡으니 이후 작업이 빨라졌다.', createdAt: '2026-07-20T21:00:00', goal: goalRef(6), mediaList: [] }
  ];

  /* Timeline: 목표 등록 + 기록 작성을 같은 형태(TimelineItem)로 합친다 */
  var timeline = goals.map(function (g) {
    return { type: 'GOAL', itemNum: g.goalNum, title: g.goalTitle, content: g.goalContent, createdAt: g.createdAt + 'T09:00:00', detailUrl: 'goals.html' };
  }).concat(records.map(function (r) {
    return { type: 'RECORD', itemNum: r.recordNum, title: r.title, content: r.content, createdAt: r.createdAt, detailUrl: 'record.html?id=' + r.recordNum };
  })).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });

  /* 최근 12주 기록 활동량 (히트맵용) — 날짜 문자열 → 기록 수 */
  function buildActivity() {
    var map = {};
    var today = new Date(DEMO_TODAY + 'T00:00:00');
    for (var i = 0; i < 84; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() - i);
      var key = toKey(d);
      var seed = (d.getDate() * 7 + d.getMonth() * 13) % 10;
      var count = seed < 4 ? 0 : seed < 7 ? 1 : seed < 9 ? 2 : 3;
      if (i < 12) count = Math.max(count, 1); // 최근 12일 연속 기록
      if (i === 12) count = 0;
      map[key] = count;
    }
    return map;
  }

  function toKey(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  return {
    today: DEMO_TODAY,
    me: me,
    categories: categories,
    goals: goals,
    records: records,
    timeline: timeline,
    activity: buildActivity(),
    summary: {
      activeGoalCount: goals.filter(function (g) { return g.goalStatus === '진행중'; }).length,
      recordsThisMonth: records.filter(function (r) { return r.createdAt.indexOf('2026-09') === 0; }).length,
      streakDays: 12
    }
  };
})();
