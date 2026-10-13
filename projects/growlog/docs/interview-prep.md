# GrowLog 면접 대비 Q&A

Day 15(리뉴얼 로드맵 최종 문서) 기준으로 정리한 15개 질문과 답변.
실제 코드/커밋/`docs/decisions.md`에 있는 근거를 바탕으로 작성했고,
과장하거나 하지 않은 것까지 "했다"고 적지 않았다.

---

### 1. 왜 JSP 프로젝트를 Vue로 리뉴얼했나요?

기존 Spring Boot + JSP 구조는 화면 전환마다 서버가 전체 페이지를
다시 렌더링해야 해서, Loading/Error/Empty 같은 세밀한 상태 UX나
클라이언트 상태 관리를 만들기 어려웠다. 반면 `Goal`/`GrowthRecord`
Service·Repository·Entity 계층은 이미 검증된 로직이라 다시 만들
이유가 없었다. 그래서 "Backend Rewrite"가 아니라 "Frontend만 Vue
SPA로 현대화"하는 걸 리뉴얼의 목표로 잡았다 — 실무에서 흔히 겪는
Legacy Modernization 경험을 만들고 싶었던 이유이기도 하다.

### 2. 왜 React가 아니라 Vue를 사용했나요?

프로젝트 규모(화면 5~6개, 상태 대부분 서버 데이터 fetch + 폼)에는
Vue의 `<script setup>` + Composition API가 상태와 템플릿을 한 파일
안에서 바로 대응시켜 보여줘서 가독성이 좋았다. `ref`/`computed`의
반응성 모델이 명시적이라 Pinia store(auth 하나)와 로컬 상태의
경계를 코드로 바로 확인할 수 있었던 것도 이유다.

### 3. Session 방식은 SPA에서 어떻게 유지했나요?

Spring Security의 세션 쿠키(JSESSIONID) 인증을 그대로 쓰고, Axios
인스턴스에 `withCredentials: true`로 쿠키를 요청에 함께 보내도록
했다. CSRF는 `CookieCsrfTokenRepository`로 XSRF-TOKEN 쿠키를
내려주고, Axios가 기본으로 그 쿠키를 읽어 `X-XSRF-TOKEN` 헤더에
실어 보낸다(`xsrfCookieName`/`xsrfHeaderName`/`withXSRFToken: true`).
세션 쿠키 자체는 `SameSite=None; Secure`로 설정해서 Vue 개발
서버(5173)와 Spring Boot(8080)처럼 Origin이 다른 요청에도 쿠키가
실리게 했다.

### 4. JWT를 쓰지 않은 이유는?

이번 리뉴얼의 목표가 "인증 백엔드를 다시 만드는 것"이 아니라
"프론트엔드를 SPA로 현대화하는 것"이었다. 기존 Spring Security 세션
인증이 이미 안정적으로 동작하고 있었고, JWT로 바꾸면 토큰 저장
위치(로컬스토리지는 XSS에 취약, 메모리는 새로고침마다 재인증
필요), Refresh Token 회전, 토큰 무효화(로그아웃 시 즉시 무효화가
세션보다 복잡) 같은 새로운 문제를 만들 뿐 이번 프로젝트 범위에 이득이
없었다.

### 5. CORS란?

브라우저의 Same-Origin Policy상 기본적으로 차단되는 다른 Origin으로의
요청을, 서버가 응답 헤더(`Access-Control-Allow-Origin` 등)로 명시적
으로 허용하는 메커니즘이다. GrowLog는 `SecurityConfig`의
`CorsConfigurationSource`에서 `app.cors.allowed-origins` 환경변수로
받은 Origin만 허용하고, 세션 쿠키를 주고받아야 해서
`allowCredentials(true)`를 켰다(이 경우 Origin에 `*`를 쓸 수 없어서
구체적인 목록을 넣어야 한다).

### 6. CSRF란?

사용자가 이미 인증된 세션을 가진 상태에서, 공격자가 사용자 모르게
그 세션으로 상태 변경 요청(예: 비밀번호 변경, 게시물 삭제)을 보내게
만드는 공격이다. 요청에 서버만 아는 토큰을 함께 보내도록 강제해서
막는다. GrowLog는 `CookieCsrfTokenRepository`로 토큰을 쿠키로
내려주고, Axios가 자동으로 헤더에 실어 보내는 방식을 쓴다 — Vue
SPA에는 JSP처럼 `${_csrf.token}`을 렌더링할 화면이 없기 때문에
이 방식이 필요했다.

### 7. SameSite란?

쿠키가 크로스사이트 요청에 언제 함께 전송될지 제어하는 속성이다
(`Strict`/`Lax`/`None`). 기본값에 가까운 `Lax`는 XHR/fetch 같은
sub-request에는 method와 무관하게 쿠키를 아예 안 보낸다. Vue
개발 서버(5173)와 Spring Boot(8080)는 서로 다른 Origin이라, 세션
쿠키를 Axios 요청에 실으려면 `SameSite=None`으로 명시하고(대신
브라우저가 `Secure`도 함께 요구한다) 설정해야 했다.

### 8. Router Guard와 Interceptor 차이는?

Router Guard(`router/index.ts`의 `beforeEach`)는 **네비게이션
시작 시점**에 "이 사용자가 이 라우트에 들어갈 자격이 있는가"를
판단한다 — 처음 앱이 로드될 때 한 번 `fetchCurrentUser()`로 세션을
확인하고, 보호 라우트인데 비로그인이면 `/login`으로 보낸다.
Axios 401 Interceptor(`interceptors.ts`)는 **API 요청 도중** 세션이
끊겼을 때만 반응한다 — 이미 인증된 화면에서 세션 만료로 401을
받으면 그때 `/login`으로 리다이렉트한다. `/api/me` 요청은
Interceptor에서 명시적으로 제외해서, Router Guard의
`fetchCurrentUser()` 실패 처리와 겹치지 않게 했다(안 그러면
비로그인 사용자가 공개 페이지에 들어올 때마다 401 한 번에 튕겨
나가게 된다).

### 9. Pinia에는 어떤 State를 넣었나요?

`auth.store`(로그인 사용자 정보) 하나뿐이다. 이 값은 Header/AppNav,
Dashboard 인사말, Router Guard 세 곳이 동시에 참조하기 때문에
전역이 맞다. 반대로 모달 열림 여부, 폼 저장 상태, Timeline 필터
선택 같은 건 그 화면을 벗어나는 순간 의미가 없어서 컴포넌트 로컬
상태로 남겨뒀다 — Day 12에서 이 기준으로 다시 점검했고 전역으로
승격된 로컬 상태는 없었다.

### 10. Backend를 왜 다시 만들지 않았나요?

`GoalService`/`GrowthRecordService`/`MediaService`와 그 아래
Repository/Entity가 이미 검증된 비즈니스 로직(날짜 검증, 진행률
검증, 다른 회원 데이터 접근 차단 등)을 갖고 있었다. Vue가 쓸 JSON
API가 필요할 때마다 새 로직을 쓰는 대신, `GoalApiController`/
`GrowthRecordApiController`처럼 기존 Service 메서드를 그대로
호출하는 얇은 `@RestController`만 추가했다 — 검증 로직 중복 없이
같은 규칙을 프론트에도 그대로 적용할 수 있었다.

### 11. 가장 어려웠던 오류는?

`docs/trouble_shooting/`에 날짜별로 기록해뒀는데, 대표적으로 Spring
Security 도입 초반 CSRF 토큰 없이 보낸 POST 요청이 403으로 막힌 문제,
로그인은 성공했는데 이어지는 `/api/me`가 401을 반환한 세션 쿠키
정책 문제가 있었다. 가장 최근(Day 14)에는 문서에는 "로컬/운영
프로필을 분리했다"고 적혀 있었지만 실제 코드에는 그 분리가 없어서
`ddl-auto: update`가 그대로 운영에 나갈 뻔했던 걸 발견해서 고쳤다 —
문서와 코드가 어긋날 수 있다는 걸 실감한 사례였다.

### 12. UI/UX에서 가장 많이 개선한 부분은?

Day 11에서 Dashboard/Timeline/Goal List/Goal Create·Update가
정상 데이터일 때만이 아니라 Loading/Empty/Error/Validation 상태에서도
자연스럽게 보이도록 마감했다. 특히 Goal 생성/수정 폼에 제출 전
클라이언트 검증(빈 제목, 200자 초과, 기간 역전)을 추가해서 서버
왕복 없이 바로 피드백을 주게 했다. 또한 Landing(화려한 스토리텔링)과
Dashboard/Timeline 같은 실제 서비스 화면(Calm Application Design)의
톤을 의도적으로 분리했다.

### 13. Responsive는 어떻게 설계했나요?

각 화면마다 좁은 뷰포트(390px 근처)에서 Playwright로 실제
스크린샷을 찍어 가로 스크롤(overflow) 여부를 확인하는 걸 기본
검증 절차로 삼았다. 날짜 두 개를 나란히 두는 grid 같은 레이아웃은
`@media (max-width: 480px)`에서 `grid-template-columns: 1fr`로
접히게 했다.

### 14. Accessibility에서 고려한 부분은?

`GoalProgress`에 ARIA `progressbar` role을 명시했고,
`prefers-reduced-motion`을 감지해 Landing의 스크롤 reveal
애니메이션(`useInViewOnce`)과 `LoadingSkeleton`의 shimmer 애니메이션을
둘 다 끌 수 있게 했다(끌 때도 콘텐츠 자체는 항상 보이는 상태를
기본값으로 뒀다 — Progressive Enhancement). 폼 입력은
`BaseInput`이 `<label>`로 감싸는 구조라 별도 `aria-label` 없이도
label과 input이 연결된다.

### 15. 이 프로젝트를 다시 만든다면 무엇을 바꾸겠나요?

Day 14에서 발견했듯, 운영/로컬 프로필 분리(`application-prod.yaml`)를
프로젝트 초반부터 만들어뒀을 것이다 — 나중에 발견하면 이미 위험한
설정으로 운영에 나갔을 수도 있는 문제라서, "나중에 정리"가 아니라
처음부터 profile을 분리하는 습관을 들이고 싶다. 테스트 커버리지도
Service 계층 위주였는데, 프론트엔드 컴포넌트/composable에 대한
자동화 테스트(Vitest 등)를 추가했다면 Day 11~13의 상태 검증을
스크린샷보다 빠르게 반복할 수 있었을 것이다.
