# 기술적 의사결정 기록

리뉴얼 진행 중 내린 기술적 판단과 그 이유를 하루 단위로 남긴다.
목적은 README 작성과 면접에서 "왜 이렇게 했나요?"에 바로 답할 수 있도록 하는 것.

---

## Day 1 (2026-09-14) — 인증/CORS 기술 검증

### 1. CookieCsrfTokenRepository + 커스텀 필터로 CSRF 쿠키를 강제 로드

기존 프로젝트는 JSP가 `${_csrf.token}`을 직접 렌더링해서 CSRF 토큰을 세션에
저장하는 방식(`HttpSessionCsrfTokenRepository`, 기본값)을 썼다. Vue SPA는
서버가 렌더링하는 화면이 없으므로 이 방식으로는 토큰을 읽을 방법이 없다.

`CookieCsrfTokenRepository.withHttpOnlyFalse()`로 바꿔 XSRF-TOKEN 쿠키로
토큰을 내려주도록 했다. Axios는 기본적으로 이 쿠키 이름(XSRF-TOKEN)과 헤더
이름(X-XSRF-TOKEN)을 그대로 사용하므로 프론트엔드에서 별도 코드 없이 CSRF
토큰이 자동으로 요청에 실린다.

다만 Spring Security의 CsrfToken은 기본적으로 "지연 로딩"된다 — 누군가
`csrfToken.getToken()`을 실제로 호출해야 그제서야 쿠키가 응답에 실린다.
JSP는 `${_csrf.token}`을 렌더링하면서 자연스럽게 이 호출이 일어나지만,
REST API만 호출하는 SPA 흐름에는 그런 코드가 없다. 그래서 `CsrfFilter`
바로 뒤에 토큰을 강제로 한 번 읽는 작은 필터(`csrfCookieFilter`)를
추가해서 매 요청마다 쿠키가 항상 내려가도록 했다. (Spring Security 공식
"CSRF for a SPA using cookies" 가이드에서 제시하는 표준 패턴이다.)

### 2. /api/** 는 인증 실패 시 401을 반환하도록 별도 EntryPoint 등록

formLogin의 기본 동작은 미인증 요청을 `/login` 페이지로 302 리다이렉트하는
것이다. Axios로 `GET /api/me`를 호출하는 SPA 입장에서는 이 리다이렉트를
그대로 따라가면 HTML 응답을 받게 되어 로그인 여부를 코드로 구분하기 어렵다.
그래서 `/api/**` 경로에는 `HttpStatusEntryPoint(401)`을 등록해 JSON API와
서버 렌더링 페이지의 미인증 처리 방식을 분리했다.

구현 중 발견한 함정: `ExceptionHandlingConfigurer.defaultAuthenticationEntryPointFor()`로
등록한 매핑 중 "가장 먼저 등록된 것"이 전체 fallback이 된다. formLogin이
등록하는 로그인 리다이렉트 매핑은 `http.build()` 시점에 뒤늦게 추가되므로,
내가 등록한 `/api/**` 매핑이 항상 먼저 들어가 fallback이 되어버려
`/home` 같은 일반 페이지까지 401을 받는 문제가 있었다. `/api/**` 매핑과
나머지 전체를 위한 로그인 리다이렉트 매핑을 직접, 이 순서로 함께 등록해서
해결했다.

### 3. CORS는 명시적 Origin 목록 + credentials 허용

Vue 개발 서버(`localhost:5173`)와 Spring Boot(`localhost:8080`)가 다른
Origin이므로 세션 쿠키를 주고받으려면 CORS에서 `allowCredentials(true)`가
필요하다. 이 옵션을 쓰려면 `allowedOrigins`에 `"*"`를 쓸 수 없어서 허용할
Origin을 `app.cors.allowed-origins` 설정값(환경변수 `CORS_ALLOWED_ORIGINS`로
배포 시 교체 가능)으로 명시했다.

또한 CORS preflight(OPTIONS) 요청은 자격 증명 없이 오기 때문에
`authorizeHttpRequests`에서 `OPTIONS` 메서드는 인증 규칙보다 먼저
무조건 허용하도록 별도 규칙을 추가했다. 이게 없으면 모든 Cross-Origin
요청이 preflight 단계에서부터 막힌다.

### 4. 로그인 성공 여부는 POST /login 응답이 아니라 GET /api/me로 판단

Spring Security formLogin은 성공/실패 모두 302로 응답한다(성공 → `/home`,
실패 → `/login?error`). SPA에서 이 리다이렉트 자체를 파싱해서 성공 여부를
판단하는 건 취약하므로, `POST /login` 이후 항상 `GET /api/me`를 호출해서
실제로 세션이 인증된 상태인지로 로그인 성공 여부를 판단하도록 설계했다.

### 5. 검증 방법: MockMvc 기반 통합 테스트로 자동화

브라우저로 직접 CORS/쿠키 흐름을 확인하는 대신, 실제 `SecurityFilterChain`
Bean이 동작하는 MockMvc 통합 테스트(`AuthControllerTest`)로 아래 5가지를
자동 검증했다.

- 미인증 `GET /api/me` → 401 (로그인 페이지로 리다이렉트되지 않음)
- 인증된 `GET /api/me` → 200 + 로그인 회원 JSON
- 응답에 `XSRF-TOKEN` 쿠키가 실제로 내려가는지
- 허용된 Origin(`localhost:5173`)의 CORS preflight → 200 + `Access-Control-Allow-Origin` 헤더
- 허용되지 않은 Origin의 CORS preflight → `Access-Control-Allow-Origin` 헤더 없음

### 6. (실제 브라우저 검증에서 발견) Axios의 `withXSRFToken: true`가 빠지면 로그인이 403으로 막힌다

로컬에서 실제 브라우저로 로그인을 처음 테스트했을 때 `POST /login`이 403으로
거부됐다. 원인은 Axios 1.6부터 추가된 보안 정책 때문이었다 — Axios는 기본적으로
XSRF 쿠키→헤더 자동 변환을 **같은 Origin 요청에만** 적용하고, Cross-Origin
요청(Vue `:5173` → Spring Boot `:8080`)에는 적용하지 않는다. `withXSRFToken: true`를
명시적으로 켜야 우리 SPA 구조에서도 CSRF 토큰이 실제로 헤더에 실린다.

MockMvc 통합 테스트만으로는 이 문제를 잡을 수 없었다 — MockMvc는 백엔드
필터 체인만 검증할 뿐, Axios가 실제로 어떤 헤더를 보내는지는 검증 범위 밖이기
때문이다. 실제 두 서버를 띄우고 브라우저로 로그인해본 뒤에야 발견했다. 이후
로드맵에서도 인증/CORS/CSRF처럼 "여러 계층이 맞물리는" 기능은 로컬 실기동
검증을 반드시 한 번은 거쳐야 한다는 교훈으로 남긴다.

### 7. (실제 브라우저 검증에서 발견) 세션 쿠키에 SameSite=None을 명시해야 한다

`withXSRFToken` 문제를 고친 뒤에도 로그인 후 `GET /api/me`가 계속 401이었다.
`POST /login`은 성공(세션 생성)했는데도 그랬다. 원인은 세션 쿠키
(`JSESSIONID`)의 기본 `SameSite` 값이 `Lax`였기 때문이다.

`SameSite=Lax`는 "같은 사이트로의 최상위 이동(링크 클릭 등)"에만 쿠키를
허용하고, XHR/fetch 같은 하위 요청(sub-request)에는 GET이든 POST든 무조건
차단한다. CSRF 토큰(XSRF-TOKEN)은 JS가 `document.cookie`로 직접 읽어서
헤더로 수동 전달하기 때문에 이 제약을 안 받지만(브라우저가 자동으로
Cookie 헤더에 붙이는 게 아니라 우리 코드가 값을 직접 옮겨 심는 것이라
SameSite 검사 대상이 아니다), 세션 쿠키는 브라우저가 요청마다 자동으로
붙여주는 방식이라 이 정책의 영향을 그대로 받는다.

`server.servlet.session.cookie.same-site=none` (+ `secure=true`)로
명시해서 해결했다. `SameSite=None`은 `Secure` 속성을 반드시 요구하는데,
`http://localhost`는 최신 브라우저에서 예외적으로 "안전한 컨텍스트"로
취급되어 HTTPS 없이도 정상 동작한다. 실제 배포 환경은 어차피 HTTPS를
쓰게 되므로, 이 설정은 로컬 개발용 임시방편이 아니라 배포 환경에서도
그대로 유효한 설정이다.

### 부수적으로 고친 것: 백엔드 빌드가 애초에 깨져 있었음

`SecurityConfig`/`LoginMemberPrincipal`/`S3Config`가 참조하는
`spring-boot-starter-security`, AWS S3 SDK(`software.amazon.awssdk:s3`)가
`pom.xml`에 없어서 `mvn compile`이 실패하는 상태였다. Day 1 작업을
검증하려면 애초에 빌드가 되어야 하므로 함께 추가했다. 테스트용 H2
드라이버도 `application-test.yaml`은 참조하지만 의존성이 없어서 같이 추가했다.

### 최종 결과

로컬에서 IntelliJ(실제 RDS 연결) + `npm run dev`로 실제 브라우저 로그인까지
전부 성공 확인. 6~7번 항목에서 정리한 CSRF/SameSite 버그를 순서대로
고친 뒤, 마지막으로 남은 원인은 단순 비밀번호 오타였다 — 즉 인증/CORS/CSRF
연동 자체는 완전히 정상 동작한다는 뜻이다. Day 1 목표 달성.

---

## Day 2 (2026-09-14) — 인증 최소 흐름 완성

Login/Logout/현재 사용자 조회/Router Guard는 Day 1에서 이미 구현해뒀기 때문에,
Day 2에 실제로 필요했던 건 "세션이 화면을 쓰는 도중에 끊기는 경우"에 대한
처리 하나였다.

### 401은 두 가지 상황에서 발생하고, 처리 위치가 다르다

1. **앱을 처음 열었을 때** — 로그인 여부를 몰라서 확인차 보내는 `GET /api/me`.
   이건 로그인 안 한 사용자에게는 항상, 정상적으로 401이 난다. 이 경우는
   `authStore.fetchCurrentUser()`가 자체적으로 `catch`해서 `user = null`로만
   처리하고 끝낸다 — Router Guard가 그 결과를 보고 어차피 `/login`으로
   보내줄 것이기 때문에 별도 리다이렉트가 필요 없다.
2. **이미 로그인된 화면을 쓰던 도중** — 세션 만료, 서버 재시작, 쿠키 삭제
   등으로 API 호출이 갑자기 401을 반환하는 경우. 이건 Router Guard가 잡을
   수 없다(네비게이션이 발생하지 않으니까). Axios 응답 인터셉터
   (`frontend/src/api/interceptors.ts`)를 추가해서, 현재 라우트가 `/login`이
   아닐 때만 로그인 화면으로 강제 이동시키도록 했다.

이 인터셉터를 `axios.ts` 안에 바로 넣지 않고 별도 `interceptors.ts` 파일로
분리해서 `main.ts`에서 pinia/router가 준비된 뒤에 등록한 이유: 인터셉터가
Router와 Pinia store를 둘 다 참조해야 하는데, `axios.ts <- auth.api.ts <-
auth.store.ts <- router <- axios.ts` 순으로 순환 참조가 생긴다. 인터셉터
콜백 안에서만 `router`/`useAuthStore`를 쓰면(모듈 로드 시점이 아니라 호출
시점에 접근하면) 순환 참조 자체는 동작하지만, 굳이 그 구조를 만들지 않고
`axios.ts`는 인스턴스 생성만 책임지게 하는 게 더 명확하다고 판단했다.

### 로그인 후 원래 가려던 화면으로 돌아가기

Router Guard와 401 인터셉터 둘 다 `?redirect=원래경로`를 붙여서 로그인
화면으로 보낸다. `LoginView.vue`가 로그인 성공 시 이 쿼리 파라미터를 읽어서
무조건 Dashboard로 보내지 않고 원래 가려던 화면으로 돌려보내도록 했다.

---

## Day 4 (2026-09-14) — Dashboard 실제 데이터 연결 (+ 브랜치/보안 점검)

### master와의 관계: 지금은 병합하지 않기로 결정

Day 4 시작 전 `origin/master`와의 차이를 확인했다. 공통 조상(2026-07-30)
이후 master가 7개, 이 브랜치가 18개 커밋을 각자 진행해서 갈라져 있었고,
공통 조상 이후 양쪽에서 모두 손댄 파일이 67개였다. master는 우리가 모르는
사이에 레거시 JSP 백엔드 작업이 별도로 계속된 것으로 보인다 — 특히
`SecurityConfig.java`를 독자적으로 다시 작성했는데(CORS 없음, CSRF는
`disable()`로 완전히 꺼둠, `LoginSuccessHandler` 신규 추가), 이건 Day 1에서
공들여 맞춘 CORS/CSRF/SameSite 구조와 정면으로 충돌한다. 뱃지/타임라인
관련 파일 삭제 등 다른 실질적 충돌도 많았다.

지금 병합하면 (1) 67개 파일의 실제 충돌을 수작업으로 풀어야 하고 (2) 잘못
풀면 Day 1~3 인증 구조가 깨질 위험이 있고 (3) Day 4 작업 자체엔 master의
변경사항이 전혀 필요 없다. 그래서 지금은 병합을 미루고, 이 브랜치만으로
Day 4를 진행하기로 했다. 병합은 사람이 파일 단위로 리뷰할 시간이 있을 때
(예: master의 `DB_URL` 환경변수화, `open-in-view: false`, multipart 업로드
제한처럼 리뉴얼과 무관하고 안전한 개선사항만 선별해서) 별도로 진행한다.

### DB_URL도 환경변수로 분리

기존엔 `DB_USERNAME`/`DB_PASSWORD`만 환경변수였고 RDS 호스트가 포함된
`url`은 하드코딩되어 있었다. master가 독립적으로 같은 결론(`${DB_URL}`)에
도달한 걸 보고, 우리도 반영했다. 기본값을 기존 RDS 주소로 그대로 둬서
이미 만들어둔 `env.sh`/`env.bat`는 수정 없이 계속 동작한다 — `DB_URL`을
새로 설정해야만 다른 값으로 바뀐다.

### Dashboard API는 새 로직 없이 기존 Service 재사용만으로 구성

`HomeController.homePage()`가 기존 JSP `/home` 화면에 넘기던 값들
(`goalService.countThisWeekInProgressGoals`, `growthRecordService.countThisMonthRecords`,
`attendanceService.getAttendanceSummary().currentStreak`, `timelineService.getTimeline()`)을
그대로 호출해서 `GET /api/dashboard`로 JSON 재포장만 했다. Service/Repository
변경은 전혀 없다.

`countThisWeekInProgressGoals`는 이름상 "이번 주 등록된 진행중" 목표
개수라 로드맵 문구("진행 중 목표 수")와 완전히 같은 의미는 아니지만,
기존 JSP `/home` 화면도 같은 메서드를 쓰고 있어서 그대로 재사용했다 —
그래야 JSP 홈 화면과 Vue Dashboard가 같은 숫자를 보여준다. 통계 정의를
새로 내리는 건 이번 리뉴얼 범위(백엔드 재설계 금지) 밖이라고 판단했다.

Recent Timeline Preview는 `TimelineItem` DTO(GOAL/RECORD를 합쳐서
최신순 정렬해주는 기존 DTO)를 그대로 쓰고 상위 3개만 잘라서 내려준다.
Day 5에서 전체 Timeline 화면을 만들 때 프론트엔드 타입도 그대로 확장해서
쓸 수 있도록 `frontend/src/types/dashboard.ts`의 `DashboardTimelineItem`을
백엔드 DTO 필드명과 1:1로 맞춰뒀다.

### 새 공통 컴포넌트는 추가하지 않음

Day 3에서 만든 `BaseCard`/`BaseButton`/`BaseBadge`만으로 Summary Card,
Quick Action, Timeline Preview를 전부 조립할 수 있어서 새 컴포넌트를
만들지 않았다. Loading/Error 상태는 아직 전용 컴포넌트 없이 텍스트로만
처리했다 — Skeleton 등 제대로 된 UX는 Timeline을 만드는 Day 6에서 함께
다듬을 계획이다.

### 실제 RDS 데이터 기준 검증 (사용자가 DBeaver로 직접 확인)

이 환경에서는 RDS에 접속이 안 돼서 Playwright로 API 응답을 모킹한 화면만
확인할 수 있었다. 실제 데이터와 일치하는지는 사용자가 로컬에서 DBeaver로
RDS에 직접 붙어 검증했다.

방법: `GET /api/dashboard`가 호출하는 4개 값 각각에 대응하는 SQL을 Service
로직과 동일한 조건(이번 주 월요일 기준, 이번 달 1일 기준 등)으로 작성해서
전달하고, 화면에 뜨는 값과 SQL 결과를 하나씩 대조했다.

검증 결과 (member_no=1, 테스트 계정):
- 이번 달 기록 수: SQL 0 = 화면 0
- 진행 중 목표 수: SQL 0 = 화면 0
- 연속 기록: 출석일이 7/28, 7/30뿐이라 오늘/어제와 이어지지 않아 계산상
  0일이 나와야 하는데, 화면도 0일로 일치
- Recent Timeline: 이번 달 데이터가 없어 SQL도 0건, 화면은 카드 없이
  Empty State 문구("아직 이번 달 기록이 없어요...")를 정상 표시

4개 항목 모두 일치 확인. 다만 테스트 계정에 최근 데이터가 없어서 전부
0/빈 상태로만 검증됐다 — "값이 있을 때도 정확히 맞는지"는 아직 실데이터로
확인 못 했다. Goal/Record 작성 화면이 아직 JSP에만 있어서(Vue 전환은
Day 8~9, 13), 실제로 값이 있는 케이스를 보려면 JSP 화면에서 데이터를
등록해보거나 Day 8 이후에 재검증이 필요하다.

---

## master 병합 (2026-09-14) — 저위험 항목만 선별 반영

`claude/keen-darwin-2f77lc`와 `master`가 공통 조상(2026-07-30) 이후 각자
7개/20개 커밋으로 갈라져 있어서, 전체 병합 전에 파일 단위로 위험도를
분류했다. 이번엔 그중 **가장 안전한 항목만** 먼저 반영하고, 나머지는
의도적으로 손대지 않았다.

### 가져온 것 (master → 이 브랜치)

- **`pom.xml`**: AWS S3 SDK 버전을 `2.29.52` → `2.31.67`로 올림. master가
  독립적으로 이 버전을 채택했고, 우리 쪽엔 이 버전을 고정해야 할 이유가
  없어서 최신 쪽에 맞췄다. `spring-security-test`(CSRF 테스트용, master엔
  없음)는 그대로 유지.
- **`application.yaml` — `spring.jpa.open-in-view: false`**: Open Session
  In View 안티패턴을 끈다. master가 독립적으로 같은 결론에 도달한 걸
  보고 반영. 기존 `database-platform` 설정과 무관한 설정이라 그대로 뒀다.
- **`application.yaml` — `spring.servlet.multipart`**: 이미지 업로드 요청
  크기 제한(`max-file-size: 5MB`, `max-request-size: 25MB`). 리뉴얼과
  무관하고 순수하게 누락되어 있던 설정이라 반영.

### 의도적으로 제외한 것

- **`SecurityConfig.java` 전체** — master는 CORS 설정이 없고 CSRF를
  `disable()`로 완전히 꺼둔, 우리와 근본적으로 다른 구조다. Day 1~4에서
  맞춘 CORS/CSRF-쿠키/SameSite 구조를 그대로 유지해야 하므로 손대지 않음.
- **`application.yaml`의 CORS/세션 쿠키 관련 설정** — 위와 동일한 이유.
- **`server.port`/`server.address`** — 이번 선별 반영 범위(S3, multipart,
  open-in-view)에 포함되지 않아서 제외. 필요해지면 별도로 검토.
- **`MemberController.java`, `HomeController.java`, `MyPageController.java`**
  — master가 `@AuthenticationPrincipal` 대신 `HttpSession.getAttribute
  ("loginMember")` 레거시 패턴으로 되돌아가 있다. 우리 쪽엔 그 세션
  속성을 채워주는 `LoginSuccessHandler`가 없어서, 그대로 가져오면 로그인
  후에도 로그인 안 된 것처럼 동작하는 회귀가 생긴다. `LoginSuccessHandler`
  도입 여부를 포함해서 별도로 검토해야 할 대상으로 남겨둔다.
- **뱃지/타임라인 삭제, Goal/Record/MyPage 관련 JSP·CSS·JS 다수** — 아직
  세부 검토 전. 이번 작업 범위 밖.

빌드 및 전체 테스트(28개) 통과 확인. 변경 파일은 `pom.xml`,
`application.yaml` 단 2개뿐이고, `SecurityConfig.java`는 diff 없음.

---

## activeGoalCount 라벨 정합성 (2026-09-14)

Dashboard의 "진행 중 목표" 카드가 실제로는 `GoalService.
countThisWeekInProgressGoals()`를 재사용한 값이라 "전체 진행중 목표"가
아니라 "이번 주에 등록한 진행중 목표"였다. 라벨과 실제 집계 의미가
어긋나 있었다.

새 집계 로직을 만들지 않고 고치는 방법을 먼저 검토했다. 기존 JSP
`home.jsp`를 다시 보니 **같은 값을 같은 이름("진행 중인 목표")으로
보여주면서, 숫자 아래 작은 문구("이번 주 목표를 이어가고 있어요.")로
범위를 명시**하는 방식을 이미 쓰고 있었다 — 즉 이 애매함은 새로 생긴
문제가 아니라 원래 JSP 설계에도 있던 것이고, JSP는 라벨이 아니라
부연 문구로 풀어낸 것이었다.

그래서 Vue Dashboard도 같은 패턴을 그대로 가져왔다:
- 라벨을 "진행 중 목표" → "진행 중인 목표"로 JSP와 동일하게 맞춤
- 숫자 아래에 JSP와 완전히 같은 문구("이번 주 목표를 이어가고 있어요.")를
  `summary-card__hint`로 추가
- "이번 달 기록" 카드도 JSP의 "꾸준히 기록하고 있어요." 문구를 그대로 가져와
  톤을 통일

백엔드/Service 변경 없음 — `DashboardView.vue` 텍스트만 수정했다.
"연속 기록" 카드는 JSP가 `attendedToday` 여부에 따라 다른 문구를
보여주는데, 이 값은 아직 `DashboardResponse`에 없어서(순수 라벨 수정
범위를 벗어나므로) 이번엔 손대지 않았다 — 필요해지면 별도로 검토.

---

## Day 5 (2026-09-15) — Timeline + TypeScript 설계

### normalizeTimeline()을 프론트에서 새로 만들지 않았다

로드맵 원안은 "Goal/Record를 각각 조회 → 프론트에서 normalizeTimeline()으로
병합"하는 흐름을 가정하고 있었다. 그런데 백엔드 `TimelineService.
getTimeline(memberNo, yearMonth)`가 이미 정확히 그 일을 하고 있었다
(Goal/Record를 `TimelineItem` DTO로 변환 후 `createdAt` 기준 병합·정렬).
JSP `PageController.timeline()`이 이미 이 Service를 그대로 쓰고 있어서,
새 `GET /api/timeline`도 같은 Service를 재사용해 JSON으로만 다시
포장했다 — 월 선택/보정 로직(미래 달 요청 시 이번 달로 clamp 등)까지
JSP와 동일하게 맞췄다.

결과적으로 "Goal/Record → TimelineItem[]" 변환은 프론트가 아니라
**백엔드에서 이미 끝난 상태로 내려온다.** 프론트의 `TimelineItem`
Discriminated Union 타입(`frontend/src/types/timeline.ts`)은 그 JSON을
그대로 받아서 타입 안전하게 `type` 필드로 분기하는 역할만 한다. 병합
로직을 새로 만들지 않고 기존 Service를 재사용한다는 이번 리뉴얼의
원칙과도 맞는 선택이라고 판단했다.

### Discriminated Union을 실제로 쓰는 이유

지금은 `GoalTimelineItem`과 `RecordTimelineItem`의 필드가 완전히
동일하다(둘 다 title/content/createdAt/detailUrl). 그래서 얼핏 Union을
쓸 이유가 없어 보일 수 있는데, 굳이 유지한 이유는:
1. 백엔드 `TimelineItem` DTO 자체가 두 도메인을 하나의 구조로 뭉뚱그린
   것이라, 이후 목표에만 `progress`, 기록에만 `mood` 같은 필드가 추가될
   가능성이 높다(로드맵 12번 항목의 원래 예시가 그렇다). 그때 Union이면
   `item.type === 'GOAL'`로 분기한 블록 안에서 TS가 자동으로
   `GoalTimelineItem`으로 좁혀줘서 안전하게 확장할 수 있다.
2. `types/dashboard.ts`의 `DashboardSummary.recentTimeline`도 이 타입을
   그대로 재사용하도록 정리해서, Dashboard 미리보기와 Timeline 전체
   화면이 같은 타입을 공유한다.

### Day 6로 미룬 것

Loading/Error/Empty 상태는 Day 4 Dashboard와 동일하게 최소 텍스트로만
처리했고, 필터(전체/목표/기록)는 아직 없다. 로드맵상 Day 6이 "Timeline
UX 완성" 담당이라 그쪽에서 함께 다듬을 계획이다.

---

## Day 6 (2026-09-15) — Timeline UX 완성

### Skeleton을 새 공통 컴포넌트로 뺀 이유

로드맵 13번 섹션(권장 폴더 구조)에 원래 `components/common/
LoadingSkeleton.vue`가 명시되어 있었고, Day 6 체크리스트에도 명시적으로
Skeleton이 들어있어서 "필요성이 명확한 경우"로 판단해 새로 만들었다.
Dashboard도 같은 로딩 스켈레톤을 그대로 재사용하도록 바꿔서(기존엔
"불러오는 중..." 텍스트였다), 두 화면의 로딩 UX가 통일됐다.

### 필터는 서버 재요청 없이 클라이언트에서만 처리

전체/목표/기록 필터를 누를 때마다 `GET /api/timeline`을 다시 부르지
않고, 이미 받아온 `timelineItems`를 `computed`로 걸러서 보여준다.
한 달치 데이터량이 크지 않고(대시보드/타임라인 모두 월 단위 스코프),
새 API 파라미터나 백엔드 변경 없이 필터를 구현할 수 있어서 이 방식을
택했다. 필터 문구도 상황별로 다르게 뒀다 — "아직 이번 달 기록이
없어요"(전체가 비었을 때)와 "이번 달 등록한 목표가 없어요"(목표만
필터링했는데 없을 때)를 구분해서, 빈 상태가 "원래 데이터가 없는 것"인지
"필터링해서 안 보이는 것"인지 헷갈리지 않게 했다.

Playwright로 목표 필터를 실제로 클릭해서 성장 기록 카드가 화면에서
사라지고 선택된 필터 버튼 색이 바뀌는 것까지 확인했다.

---

## Day 7 (2026-09-15) — Responsive 점검

Login/Dashboard/Timeline 3개 화면을 1280/768/390px 세 폭에서 Playwright로
스크린샷을 찍어 점검했다. 가로 스크롤(overflow)은 어느 화면·폭에서도
발생하지 않았다.

### 발견한 버그: 모바일에서 헤더 버튼 글자가 중간에서 줄바꿈됨

390px 폭에서 Dashboard 헤더의 "타임라인" 링크와 "로그아웃" 버튼 텍스트가
`타임\n라인`, `로그\n아웃`처럼 글자 중간에서 잘려 두 줄로 표시됐다.
원인은 헤더가 `justify-content: space-between`으로 인사말(h1)과
액션 영역을 한 줄에 욱여넣으려 하면서, 액션 영역 쪽 공간이 좁아져
버튼/링크 텍스트까지 줄바꿈된 것이었다.

고친 방법:
1. `BaseButton.vue`에 `white-space: nowrap`을 컴포넌트 레벨로 추가 —
   Dashboard뿐 아니라 Login, Timeline 필터 버튼 등 `BaseButton`을 쓰는
   모든 곳에 한 번에 적용됨
2. `.dashboard__nav-link`에도 동일하게 `white-space: nowrap` 추가
3. `.dashboard__header`에 `flex-wrap: wrap` 추가 — 좁은 화면에서는
   액션 영역(타임라인/로그아웃)이 인사말 아래 새 줄로 자연스럽게 내려가도록

버튼 텍스트 줄바꿈 방지를 개별 컴포넌트가 아니라 `BaseButton` 자체에
넣은 이유: 앞으로 만들 Goal/Record 화면의 버튼에서도 같은 문제가 생길 걸
미리 막기 위함이다 — 디자인 시스템 컴포넌트를 만든 목적이 정확히 이런
반복 버그를 한 곳에서 막는 것이라고 판단했다.

이 로드맵엔 Day 7에 "밀린 작업 버퍼" 항목이 있었는데, 지금까지 밀린
작업이 없어서 버퍼 시간을 따로 쓰지 않았다.

---

## Day 8 (2026-09-15) — Goal List

### Goal CRUD API를 Day 8에 한 번에 설계한 이유

Day 8은 목록(조회)만 필요하지만, Day 9(작성)·Day 10(수정/삭제)이 결국
같은 도메인(Goal)을 다루고 같은 `GoalService`를 재사용하게 될 걸 알고
있어서, `GoalApiController`에 CRUD 전체(GET 목록, GET 카테고리, POST,
PUT, DELETE)를 한 번에 만들었다. 기존 JSP `GoalController`가 이미
`saveGoal`/`updateGoal`/`deleteGoal`/`findGoalsByMember`/`findAllCategories`를
전부 갖추고 있어서, 새로 만든 건 그 메서드들을 JSON으로 노출하는 얇은
Controller 계층뿐이다 — Service/Repository/검증 로직은 전혀 손대지 않았다.

검증 실패(날짜 역순, 진행률 범위 초과, 잘못된 상태값, 권한 없는 목표
접근 등)는 기존 코드에서 전부 `IllegalArgumentException`으로 던지고
있었다. JSP는 이걸 잡아서 flash message로 보여주지만, API는
`@ExceptionHandler(IllegalArgumentException.class)`로 잡아 400 +
`{"message": "..."}`로 응답하도록 했다 — Day 9에서 폼 에러 메시지를
그대로 이 값을 꺼내 보여줄 수 있게 프론트에 `extractErrorMessage()`
유틸도 미리 만들어뒀다.

### GoalResponse를 따로 만든 이유

`Goal` Entity를 그대로 JSON으로 직렬화하지 않고 `GoalResponse` DTO로
한 번 감쌌다. `Goal`은 `Member`/`Category`를 지연 로딩(LAZY) 연관관계로
갖고 있어서, Entity를 그대로 반환하면 Jackson이 프록시 객체를 직렬화하려
하다 예외가 나거나 불필요한 회원 정보까지 노출될 위험이 있다. `Category`만
필요한 필드로 골라 `CategoryResponse`로 중첩시켰다.

### 공용 네비게이션(AppNav) 신설

Dashboard/Timeline/Goal 3개 화면이 생기면서 각 화면 헤더에 링크를
따로따로 심으면 나중에 화면이 늘어날 때마다 3곳을 동시에 고쳐야 하는
문제가 보여서, `components/common/AppNav.vue`로 뺐다. Day 7에서 고친
"버튼 텍스트가 좁은 화면에서 줄바꿈되는" 문제의 재발을 막기 위해
`white-space: nowrap`도 그대로 적용했다.

### Day 9~10으로 미룬 것

- Goal 작성 폼, 입력 오류/저장 중/성공/실패 상태 (Day 9)
- Goal 수정 모달, 삭제 확인 다이얼로그(`BaseModal`/`ConfirmDialog`) (Day 10)
- `GoalCard`에는 아직 수정/삭제 버튼이 없다 — Day 10에서 모달과 함께 추가한다.

---

## Day 9 (2026-09-15) — Goal 작성

### 작성 폼은 모달이 아니라 별도 페이지로 만들었다

로드맵 Day 10에 "BaseModal"이 명시되어 있어서 수정은 모달로 만들
계획인데, 작성(Day 9)은 그렇게 하지 않고 `/goals/new`라는 별도
라우트/페이지로 만들었다. 이유는 기존 JSP도 같은 패턴이다 — `goal/write`는
독립된 페이지고, 수정은 `goal/list?openGoal=`으로 목록 페이지 위에서
모달을 여는 방식이다(TimelineService가 만드는 `detailUrl`에서 이미
확인했다). 새로 설계하지 않고 기존 UX 패턴을 그대로 따라간 것이다.

### 생성 요청에 진행률/상태를 보내지 않는다

`GoalService.saveGoal()`은 `goalProgress`/`goalStatus`를 요청에서 읽지
않고 Entity의 `@Builder.Default`(0%, "진행중")에 맡긴다. 그래서
`GoalFormView.vue`의 생성 폼에는 진행률/상태 입력 필드를 아예 넣지
않았다 — 백엔드가 안 쓰는 필드를 프론트에서 굳이 받을 이유가 없다.
(수정 폼은 다르다 — `updateGoal()`은 이 두 값을 검증하고 반영하므로,
Day 10에서는 진행률/상태 입력이 필요하다.)

### 카테고리 선택은 새 공통 컴포넌트를 만들지 않았다

폼에 select 하나가 필요했는데, 지금 이 앱에서 select를 쓰는 곳이
이 카테고리 선택 하나뿐이라 `BaseInput`을 확장하거나 새
`BaseSelect.vue`를 만들 이유가 없다고 판단해서 그냥 일반 `<select>`를
디자인 토큰(색/여백/폰트)만 맞춰 인라인으로 썼다. select를 쓰는 곳이
하나 더 생기면 그때 공통 컴포넌트로 뺄 만하다.

### 에러 메시지 표시 우선순위

클라이언트 측 검증(카테고리 미선택)을 서버 호출보다 먼저 확인해서,
불필요한 API 호출 없이 바로 에러를 보여준다. 서버 쪽 검증 실패는
`extractErrorMessage()`로 백엔드가 내려준 실제 메시지를 그대로 쓴다 —
"저장 실패" 같은 뭉뚱그린 메시지 대신, GoalService가 이미 친절하게
써둔 메시지("목표 종료일은 시작일보다 빠를 수 없습니다" 등)를 그대로
재사용하는 것도 로드맵의 "재사용 우선" 원칙과 맞다고 판단했다.

Playwright로 4가지 상태(빈 폼, 클라이언트 검증 오류, 서버 오류 메시지
노출, 저장 중 버튼 비활성화)를 전부 스크린샷으로 확인했다.

---

## Day 10 (2026-09-15) — Goal 수정/삭제

### 수정은 Day 9와 반대로 모달을 썼다

Day 9에서 정리한 것처럼 기존 JSP는 작성은 별도 페이지, 수정은
`goal/list?openGoal=`로 목록 페이지 위에서 모달을 여는 방식이다. Day
10은 딱 그 "수정" 쪽이라, 로드맵에도 명시된 대로 `BaseModal` 위에
`GoalEditModal.vue`를 새로 만들어 목록 페이지(`GoalListView.vue`)에서
바로 열고 닫히게 했다. 새 라우트를 만들지 않은 이유도 같다 — 기존
UX 패턴을 그대로 따라간 것.

### 수정 폼에만 상태/진행률 입력이 있다

Day 9에서 미리 언급했던 대로, `GoalService.updateGoal()`은
`goalProgress`/`goalStatus`를 검증하고 반영하므로 (`saveGoal()`과
다름) `GoalEditModal`에는 상태 select와 진행률 range 슬라이더를
추가했다. `watch(() => props.goal, ..., { immediate: true })`로 모달이
열릴 때마다 선택된 Goal의 현재 값들로 폼을 채운다.

### `ConfirmDialog`는 `BaseModal`의 얇은 래퍼로 만들었다

로드맵에 `ConfirmDialog`가 별도 컴포넌트로 명시돼 있고, 삭제 확인은
Goal뿐 아니라 앞으로 다른 도메인(Record 등)에서도 재사용할 여지가
있어서 `goal/` 하위가 아니라 `components/common/`에 범용으로 뺐다.
`open`/`title`/`message`/`confirmLabel`/`cancelLabel`/`confirmVariant`/
`busy` props와 `confirm`/`cancel` emit만 갖는 얇은 래퍼로, 메시지에
삭제 대상 목표 제목을 보간해서 어떤 목표를 지우는지 명확히 보여준다.
삭제 처리 중에는 `busy`로 두 버튼을 모두 비활성화하고 "처리 중..."을
표시해 중복 요청을 막았다.

### 백엔드는 손대지 않았다

`PUT/DELETE /api/goals/{goalNum}`은 Day 8에서 `GoalApiController`를
만들 때 이미 같이 구현하고 MockMvc 테스트까지 끝내둔 상태였다(Day
8~10 백엔드 재작업을 최소화하려는 의도였다고 Day 8에 적어뒀다). 그래서
Day 10은 프론트엔드 4개 파일(`GoalCard.vue`, `GoalListView.vue`,
`GoalEditModal.vue`, `ConfirmDialog.vue`)만 수정/신규 작성했다.

### 검증

`npm run build`로 타입/빌드 오류 없음을 확인한 뒤, Playwright로
`/api/me`, `/api/goals`, `/api/categories`, `DELETE /api/goals/1`을
모킹해서 세 가지 시나리오를 스크린샷으로 확인했다: 수정 모달이 선택한
Goal의 값(제목/설명/카테고리/상태/진행률/기간)으로 정확히 채워지는지,
삭제 확인 다이얼로그가 목표 제목을 포함한 올바른 메시지를 보여주는지,
삭제 성공 후 목록에서 해당 Goal이 사라지고 헤더/네비게이션/추가 버튼은
그대로 유지된 채 빈 상태 문구가 나타나는지.

---

## Landing Page + 와이어프레임 단계 디자인 초기화 (2026-09-15)

Day 5~10과 별개로 진행한 작업. 목적은 최종 디자인이 아니라 "GrowLog가
어떤 서비스인지 설명하는 진입 구조"와 "장식 요소를 걷어낸 구조 중심
UI"를 먼저 세우는 것이었다.

### `/`는 Landing, Dashboard는 `/dashboard`로 이동

지금까지 `/`가 Dashboard였는데, 비로그인 사용자가 서비스 소개 없이
곧장 Dashboard/Login만 보는 구조를 바꾸기 위해 `/`를 `LandingView`로,
Dashboard는 `/dashboard`로 옮겼다. `AppNav.vue`의 대시보드 링크도
`/dashboard`로 같이 고쳤다 — 안 고치면 Dashboard/Timeline/Goal 화면의
공용 네비게이션이 Landing으로 되돌아가 버린다.

### Landing 컴포넌트는 Hero/Feature/GrowthJourney만 분리

`components/landing/HeroSection.vue`, `FeatureSection.vue`,
`GrowthJourney.vue`만 별도 파일로 만들고, Header/GrowLog 소개/Final
CTA는 로직 없는 마크업이라 `LandingView.vue`에 그대로 뒀다(사용자
지시). 구조가 확정되면 필요할 때 분리한다.

### 로그인 인터셉터의 숨어있던 버그를 같이 고쳤다

Landing(`/`)을 공개 라우트로 만들고 나서 Playwright로 확인하는 중,
비로그인 상태로 Landing에 들어가자마자 `/login`으로 튕기는 문제를
발견했다. 원인은 `api/interceptors.ts`의 401 인터셉터가 요청 URL을
구분하지 않고 모든 401에 대해 무조건 `/login`으로 리다이렉트하고
있었기 때문이다 — `GET /api/me`는 로그인 여부를 "조용히" 확인하는
용도라 `authStore.fetchCurrentUser()`가 이미 401을 정상 처리하는데도,
인터셉터가 같은 401에 반응해 중복으로 리다이렉트를 걸고 있었다.
지금까지는 Dashboard(보호된 라우트)가 `/`였고, Login 화면 자체도
`/api/me`를 호출하지 않아서 이 버그가 드러나지 않았을 뿐이다.
`error.config.url`이 `/api/me`를 포함하면 인터셉터가 아무 것도 하지
않도록 고쳤다 — 인증/CORS/CSRF/Session 구조는 그대로 두고, 리다이렉트
판단 로직만 수정했다.

같은 파일에서 로그인 후 원래 화면으로 돌려보내는 `redirect` 쿼리 값도
`router.currentRoute.value.fullPath` 대신 `window.location.pathname`
기준으로 계산하도록 고쳤다. 앱 부팅 직후(첫 네비게이션이 끝나기 전)에는
`router.currentRoute`가 실제 요청 경로가 아니라 Vue Router의 내부
placeholder(`/`)를 가리켜서, `/dashboard`로 직접 들어온 비로그인
사용자가 로그인 후에도 `/`(Landing)로 돌아가는 문제가 있었다. Dashboard가
`/`였을 때는 이 값도 우연히 `/`와 같아서 문제가 안 보였던 것 — Landing
분리로 두 버그가 같이 드러났다.

### `--shadow-card`를 없애서 앱 전체를 구조 중심으로

`BaseCard.vue`가 `--shadow-card` 변수 하나만 사용하므로,
`tokens.css`에서 이 값을 `none`으로 바꾸는 것만으로 Dashboard/
Timeline/Goal 카드를 포함한 앱 전체가 그림자 없이 테두리(border)만
남는 와이어프레임 상태가 됐다. 기능/API/상태관리 로직은 전혀
건드리지 않았다 — 순수 CSS 토큰 값 변경.

### Growth Journey / Feature 아이콘은 임시 placeholder

이모지(🎯📝🗓️📈)는 위치 구분용 placeholder이며 최종 디자인 요소가
아니다. 최종 Visual Design 단계에서 실제 아이콘 세트로 교체될
것을 전제로 넣었다.

### 검증

`npm run build`로 타입/빌드 오류 없음을 확인한 뒤, Playwright로
다음을 스크린샷 확인했다: 비로그인 Landing(전체 섹션 구조),
로그인 Landing(CTA가 "Dashboard로 이동"으로 바뀌는지), 390px
모바일 Landing(섹션이 세로로 쌓이고 Growth Journey 화살표가
90도 회전하는지), 비로그인 `/dashboard` 접근 시 `/login?redirect=
/dashboard`로 정확히 리다이렉트되는지, 로그인 후 Dashboard가
그림자 없는 카드로 정상 렌더링되는지, `/goals` 목록도 그림자 없이
정상적으로 보이는지.

---

## Landing Page 콘텐츠/카피 재정리 (2026-09-15)

구조(Header→Hero→Why GrowLog→Features→Growth Journey→Final CTA)는
그대로 두고, 섹션별 역할이 겹치던 문제만 텍스트 레벨에서 정리했다.
라우팅/컴포넌트 트리/인증/API는 무변경.

### 무엇이 겹쳤나

"주요 기능"(Goal Management/Growth Record/Timeline/Growth Dashboard
카드)과 "Growth Journey"(Goal→Record→Timeline→Growth 스텝)가 같은
4항목을 카드형/스텝형으로만 다르게 나열하고 있었고, 옛 `intro`
섹션의 3-STEP("목표를 세운다→기록한다→성장을 확인한다")도 같은
흐름을 또 반복해서, 정작 "왜 필요한가"와 "사용하면 어떤 변화가
생기는가"를 설명하는 섹션이 없었다.

### 섹션별 역할 재배정

- Hero → GrowLog가 무엇인가 (헤드라인 유지, subcopy만 "목표+기록+
  축적+성장"이 드러나도록 교체)
- `intro`(id 유지, `#intro`) → **Why GrowLog**로 역할 전환. 3-STEP
  카드 그리드를 없애고, 문제 제기 3줄 리스트 + 결론 문장 1개로
  단순화했다(BaseCard 1장 안에 `<ul>` + 구분선 + 결론 문단). STEP
  나열 구조 자체가 Growth Journey와 겹치는 원인이라 판단해서, 카드
  개수를 늘리는 대신 리스트+결론이라는 다른 형태를 썼다.
- 주요 기능 → 실제 기능 나열 그대로 유지하되, 영문 타이틀(Goal
  Management 등)을 화면에서 없애고 한글 타이틀(목표 관리/성장 기록/
  성장 타임라인/성장 대시보드)만 노출하도록 바꿨다. 영문은 UI에
  아예 넣지 않았다(요청대로).
- Growth Journey → 기능명 나열(Goal/Record/Timeline/Growth)을
  버리고 사용자가 겪는 변화 과정(방향을 정합니다→오늘을 남깁니다→
  시간이 쌓입니다→변화를 발견합니다)으로 라벨/설명을 전부 교체했다.
  스텝 박스+화살표 UI 구조는 그대로 두고 텍스트만 바꿨다. 문장이
  길어져서 박스 폭만 140px→180px로 조정했다(순수 레이아웃 조정,
  새 디자인 효과 아님).
- Final CTA → 한 줄 문구를 제목("당신의 성장은 이미 시작되고
  있습니다.") + context 문단 + 버튼 구조로 확장했다.

### CTA 문구를 두 개의 computed로 분리

Header/Hero의 CTA(`ctaLabel`: "로그인"/"로그인하고 시작하기" ↔
"Dashboard로 이동")와 Final CTA의 CTA(`finalCtaLabel`: "나의 성장
기록 시작하기" ↔ "내 성장 대시보드 보기")는 역할이 달라서 하나의
computed를 공유하지 않고 분리했다 — Header/Hero는 "바로 이동", Final
CTA는 "성장 기록을 시작하라"는 클로징 메시지이기 때문이다.

### 검증

`npm run build`로 오류 없음을 확인한 뒤, Playwright로 비로그인/
로그인 두 상태의 Landing을 스크린샷 확인했다: 5개 섹션이 각자 다른
메시지를 보여주는지(주요 기능/Growth Journey가 더 이상 같은 문구를
반복하지 않는지), Header/Hero의 CTA와 Final CTA의 버튼 문구가
로그인 상태에 따라 각각 올바르게(그리고 서로 다르게) 바뀌는지.

---

## Visual Design 1차 적용 — Growth Archive 브랜드 토큰 (2026-09-15)

목표는 "완성된 화려한 Landing"이 아니라 GrowLog 브랜드 아이덴티티가
처음 화면에 드러나는 디자인 시스템 골격(Color/Typography/Spacing/
Surface/Dot·Line Visual Language)이다. SVG 아이콘 시스템, 고급
interaction, 애니메이션, Badge 디자인, 일러스트는 이번 범위에서
의도적으로 제외했다.

### Typography 전역 변경을 최소화한 이유

`--font-size-xl`(22px)/`--font-size-2xl`(28px)을 Section/Page Title
스케일(24px/30px)로 올리는 방안을 처음 제안했지만, 이 두 토큰은
Dashboard/Timeline/Goal/Login 전체가 그대로 참조하고 있어서 전역
값을 바꾸면 Landing 작업 때문에 Application UI 타이포 계층까지
의도치 않게 바뀐다. 그래서 전역 값은 그대로 두고 `--font-size-hero`
(44px, Landing Hero 전용)만 새로 추가했고, Landing의 Section
Title(24px/semibold)·Final CTA 제목(28px)은 각 컴포넌트 scoped
style 안에 로컬 값으로만 넣었다. Application UI 타이포 스케일은
다음 단계에서 다시 검토한다.

### Brand Color와 Semantic Color 분리

`BaseBadge.vue`의 `variant-success`가 `background: var(--color-
primary-bg)`를 그대로 재사용하고 있었다 — Primary Green이 브랜드
색으로 바뀌면 "완료" 배지 색도 함께 바뀌는 구조였다. 그래서 예전
`--color-primary-bg`(`#e9f7f0`) 값을 그대로 얼려서 `--color-
success-bg`라는 독립 토큰으로 분리하고, `variant-success`가 이
토큰을 쓰도록 고쳤다 — 시각적으로는 완전히 동일하게 유지되면서
구조적으로는 브랜드 토큰과 완전히 분리됐다. `variant-warning`의
하드코딩된 `#fef3e2`도 같은 이유로 `--color-warning-bg` 토큰으로
승격했다(값은 동일, 향후 상태색만 따로 조정할 수 있게). `error`는
원래부터 `--color-error`/`--color-error-bg`로 독립돼 있어서 손대지
않았다. `BaseInput`의 focus(브랜드 primary)/에러(semantic error)
테두리 색도 이미 분리돼 있어 그대로 유지했다. `GoalStatusBadge`가
"진행중"→primary, "완료"→success로 매핑하는 것은 "진행중"이
성장 관련 강조(브랜드)이고 "완료"가 상태 의미(semantic)라 원래도
올바른 분리였다.

### Landing Visual Language 적용

- **Hero**: 헤드라인만 `--font-size-hero`로 승격. 헤드라인 위에
  커지는 점 3개("점→선")를 아주 작게 추가했다(accent 2개 + primary
  1개, 순수 CSS, 정적). Dashboard Preview 박스는 점선 테두리 대신
  `--shadow-card` + Soft Green 톤(`--color-primary-bg`) placeholder
  블록으로 다듬었다.
- **Why GrowLog**: 3줄 리스트 왼쪽에 점(accent) + 세로 연결선
  (`::before` pseudo-element, border 톤)을 넣어 "기록이 쌓인다"는
  rail을 표현했다. 결론 문장은 구분선 아래 별도 문단으로 유지.
- **주요 기능**: emoji는 배경/테두리 없는 고정 크기(32px) 슬롯에만
  넣어서, 최종 SVG 아이콘(목표 관리→target/flag, 성장 기록→
  notebook/pen, 성장 타임라인→nodes/path, 성장 대시보드→chart/grid)
  이 들어올 자리만 확보했다. 원형 chip 같은 강한 장식은 넣지 않았다
  — emoji 자체가 최종 디자인처럼 보이지 않도록.
- **Growth Journey**: 박스+화살표 구조를 완전히 버리고 번호
  (1→2→3→4)가 들어간 점(primary green 채움) + 가로 연결선으로
  다시 만들었다 — GrowLog Visual Language "점→선→흐름→축적→성장"을
  가장 직접적으로 대표하는 섹션으로 재설계했다. 모바일에서는 세로
  스택 + 왼쪽 세로 연결선으로 전환된다. 정적 레이아웃만 쓰고
  애니메이션은 넣지 않았다.
- **Final CTA**: 단색 `--color-primary-bg`(Soft Green) 배경 블록으로
  섹션 전체를 감싸 페이지를 닫는 톤 차이를 줬다. 그라데이션은 쓰지
  않았다.

### BaseButton / BaseCard

두 컴포넌트 모두 이미 토큰만 참조하고 있어서 컴포넌트 코드 자체는
바뀌지 않았다(props/API 변화 없음) — `tokens.css`의 색/그림자 값이
바뀌면서 자동으로 새 브랜드가 반영된다. `--shadow-card`는 `none`에서
`0 1px 2px rgba(34,40,36,.04), 0 2px 8px rgba(34,40,36,.05)`로
복원하되, 카드가 "떠 있는" 느낌이 아니라 Surface(#fff)와
Background(#f7f8f5)를 미세하게만 구분하는 수준으로 낮은 강도만
썼다.

### Application UI(Dashboard/Timeline/Goal/Login)에 생긴 변화

토큰이 전역 공유이므로 구조/레이아웃은 그대로지만 아래는 함께
바뀐다: 전체 폰트가 Pretendard로 교체, Primary Green 색상 변경(버튼/
활성 네비게이션/GoalProgress 바/BaseBadge primary), `--shadow-card`
복원으로 Summary/Timeline/Goal 카드가 다시 옅은 그림자를 가짐. 위에
정리한 success/warning 토큰 분리 덕분에 "완료" 배지 등 상태 색은
바뀌지 않는다. `--font-size-xl`/`--font-size-2xl`은 이번에 보류했으므로
Dashboard 인사말, GoalList/Timeline 제목, Login 타이틀 크기는
그대로다.

### Pretendard

`pretendard`(static build) npm 패키지를 설치해 `main.ts`에서
`pretendard/dist/web/static/pretendard.css`를 import하는 self-host
방식으로 적용했다(CDN 의존 없음). static 빌드가 선언하는 폰트
패밀리명이 `'Pretendard Variable'`이 아니라 `'Pretendard'`라는 걸
빌드 결과로 확인하고 `--font-sans`도 그에 맞게 `Pretendard, system-
ui, ...`로 맞췄다. 기존 system font fallback 스택은 그대로 뒤에
남겨뒀다.

### 검증

`npm run build`로 오류 없음을 확인한 뒤, Playwright로 다음을
스크린샷 확인했다: Landing 1280px/390px(브랜드 컬러·Pretendard·
Hero 모티프·Why GrowLog rail·Growth Journey 번호-점-선·Final CTA
Soft Green 블록이 데스크톱/모바일 모두 정상), Dashboard(요약 카드
그림자 복원, 배지/버튼 브랜드 컬러 반영), Goal List(진행중/완료/중단
세 상태 배지가 서로 다른 톤으로 정상 구분되는지 — success가 primary
와 섞이지 않았는지 육안 확인), Login(에러 색 미변경, 카드 그림자
반영).

---

## Landing + Dashboard + Timeline + Goal 디자인 시스템 정돈 (2026-09-15)

Day One(여백/콘텐츠 중심) + Sunsama(Calm Productivity, 상태/숫자
우선) + Reflect(점-선 연결, Timeline 흐름) + Linear(얇은 border/낮은
shadow/일관된 spacing·typography)를 레퍼런스로 참고하되, 특정 UI를
복제하지 않고 레이아웃 원리만 GrowLog 기존 토큰(`tokens.css`)으로
재현했다. 새 컬러/아이콘/공용 컴포넌트를 들이지 않고 기존 컴포넌트를
다듬는 방식으로만 진행했다.

### `--font-size-xl`/`--font-size-2xl` 전역 변경은 이번에도 보류

지난 Visual Design 1차 때 "Dashboard/Timeline/Goal을 다루는 다음
단계에서 재검토"하기로 했던 걸 이번에 다시 검토했지만, 이 두 토큰이
Login처럼 이번 검토 범위 밖 화면까지 동시에 참조하고 있어서 이번에도
전역 값은 건드리지 않았다. 대신 각 화면에서 필요한 위계는 spacing/
font-weight/색 대비(예: GoalCard 제목을 medium→semibold, summary
card hint에 opacity 적용)로 만들었다. `page-title`/`section-title`
같은 역할 기반 토큰은 필요하면 추가할 수 있지만, 이번 단계에서
필수는 아니라고 판단해 추가하지 않았다.

### AppNav — pill 대신 얇은 밑줄

Linear의 "명확한 active state"만 참고하고, 강한 배경색/pill은 Calm
Productivity 톤과 맞지 않아 피했다. active 링크에 `border-bottom:
2px solid var(--color-primary)`만 추가해서 텍스트+얇은 밑줄로 표현
했다. Dashboard/Timeline/Goal 3개 화면이 공용 컴포넌트라 동시에
반영됨.

### Timeline·Dashboard의 점-선 rail은 종류 구분에 쓰지 않는다

Reflect 스타일 점-선 rail을 `TimelineView`와 Dashboard의 "최근
타임라인"에 추가했다. rail의 점/선 색은 Goal/Record와 무관하게
`--color-accent`(점)·`--color-primary-bg`(선)로 통일했고, Goal/
Record 구분은 카드 내부 `BaseBadge`(🌱목표 vs 📖성장 기록)에만
맡겼다. 목적을 "종류 구분"이 아니라 "시간에 따라 기록이 이어진다"는
흐름 전달에 두었기 때문이다. `Dashboard`는 이전에 `BaseCard`를
직접 나열하던 마크업을 `<ul><li>` 구조로 바꿔야 rail을 달 수 있어서
그 부분만 구조가 바뀌었고, 데이터/로직은 그대로다.

### Goal — 상태/진행률 대비만 높이고 순서는 그대로

`GoalCard`는 카테고리→상태 배지→제목→설명→진행률→기간→액션 순서를
그대로 유지했다. 대신 제목을 medium→semibold로, 진행률 바 두께를
8px→10px + 테두리 추가, 진행률 라벨을 secondary→primary 색 + medium
weight로 올려서 "상태와 진행률이 먼저 읽히도록" 대비만 높였다.
액션 버튼 영역에 상단 구분선을 추가해 카드 본문과 시각적으로
분리했다. `BaseBadge`의 padding도 살짝 키워서(2px→3px 수직) 배지
텍스트가 더 또렷하게 보이도록 했다 — Goal 상태 배지와 Timeline의
Goal/Record 타입 배지 양쪽에 공통 반영됨.

### Dashboard — Sunsama 정보 계층

Summary Card의 숫자→라벨→힌트 순서 자체는 이미 있었으므로 구조는
바꾸지 않고, 카드 사이 gap을 4→6으로 넓히고 hint 텍스트에
`opacity: 0.85`를 줘서 "숫자가 가장 먼저, 힌트는 가장 약하게"라는
위계를 더 분명히 했다. Quick Action 버튼 gap도 3→4로 넓혔다. API
연결과 상태 관리 로직은 전혀 건드리지 않았다.

### BaseModal — 기능은 그대로, 정돈만

`padding`/`border`/`box-shadow`만 정돈하고(헤더 아래 구분선 추가,
헤더-바디 여백 확장), `open`/`title` props와 ESC/backdrop-click
닫기 동작은 전혀 손대지 않았다. `GoalEditModal`/`ConfirmDialog`는
이 변경을 그대로 물려받고, Playwright로 수정 모달이 여전히 정상
동작(사전 채움, 저장/취소)하는 것까지 확인했다.

### Landing — 재구축이 아니라 polish

Hero의 copy 사이 gap(4→6)과 좌우 padding(12→12×1.5), subcopy
line-height(1.7), Why GrowLog 리스트 gap(4→6) + line-height(1.7),
Feature 카드 gap(4→6), Growth Journey 연결선 두께(1px→2px)와 색을
`--color-border`에서 `--color-primary-bg`로, Final CTA padding
(12→12×1.5)만 조정했다. 섹션 순서/카피/컴포넌트 구조는 전혀
바꾸지 않았다.

### Record 화면은 이번에도 유보

Record Detail/Create 화면은 아직 구현돼 있지 않다(로드맵 Day 13
예정, Record 작성/수정/삭제 자체는 2주 계획의 Cut 대상). 이번
작업에서도 새 Record 화면이나 그 전용 컴포넌트를 만들지 않았고,
Record의 유일한 현재 표현인 Timeline/Dashboard의 기록 카드에만
Day One(콘텐츠 중심)·Reflect(연결) 톤을 입혔다. Record 상세 페이지가
실제로 만들어질 때 이번에 정리한 토큰(색/타이포/rail 패턴/BaseModal
정돈 원칙)을 그대로 이어서 적용하면 된다.

### 검증

`npm run build` 통과 확인 후, Playwright로 Landing/Dashboard/
Timeline/Goal List 각각 1280px·390px 스크린샷과 Goal 수정 모달
(BaseModal 정돈 + 기존 동작 확인)까지 캡처했다. Timeline 목 라우트를
`**/api/timeline*`로 잡았다가 Vite dev 서버의 `/src/api/
timeline.api.ts` 모듈 요청까지 가로채 앱이 깨지는 걸 발견 —
백엔드 origin(`http://localhost:8080/...`)으로 패턴을 좁혀서 해결한
것은 테스트 스크립트 버그였고 실제 앱 코드 문제는 아니었다. Login도
별도로 캡처해서 이번 변경이 cascade되지 않았음을 확인했다.

---

## Visual Design 고도화 — 와이어프레임 단계 종료 (2026-09-15)

목표는 "와이어프레임 + 색상만 입힌 화면"에서 "실제 출시를 준비하는
Product UI"로 넘어가는 것. Day One/Sunsama/Reflect/Linear의 레이아웃
원리만 가져오고 GrowLog 기존 브랜드 토큰으로만 구현했다. 기능/API/
Router/Pinia는 전혀 건드리지 않았다.

### 아이콘 — `lucide-vue-next` 대신 `@lucide/vue`

승인받은 `lucide-vue-next`를 설치하자 `npm warn deprecated
lucide-vue-next@1.0.0: Please use @lucide/vue instead`가 떠서, 같은
Lucide 아이콘 세트의 유지보수되는 공식 후속 패키지인 `@lucide/vue`
(v1.46.0)로 바로 교체했다. import 방식(named export)은 동일해서
설계에 영향 없음. 트리쉐이킹이 정상 동작해서(`npm run build` 결과
아이콘 1개당 별도 청크가 0.3~3KB 수준) 실제 쓰는 아이콘만 번들에
포함된다.

이모지를 대체한 아이콘: 목표 관리→`Target`, 성장 기록→`NotebookPen`,
성장 타임라인→`Route`, 성장 대시보드→`LayoutDashboard`, 연속 기록→
`Flame`, Timeline/Dashboard의 기록 타입 배지→`NotebookText`, Goal
상태 배지(진행중/완료/중단)→`Flag`/`CircleCheck`/`CircleX`, Goal
카드 액션→`Pencil`/`Trash2`, 기간→`Calendar`, Timeline 필터
"전체"→`LayoutGrid`, AppNav→`LayoutDashboard`/`Route`/`Target`.
색상은 `--color-primary` 또는 `--color-text-secondary` 두 가지로만
제한하고 `stroke-width`는 1.75로 통일했다. Goal 카테고리 아이콘
(`goal.category.categoryIcon`, 예: 📁)은 이모지가 아니라 사용자가
고른 실제 카테고리 데이터라서 교체하지 않았다.

### 역할 기반 타이포 토큰 — `--font-size-xl/2xl`은 여전히 그대로

`--font-size-page-title`(28px)/`--font-size-section-title`(24px)/
`--font-size-display`(32px) 3개를 새로 추가했다. `--font-size-xl`
(22px)/`--font-size-2xl`(28px) 값 자체는 전혀 바꾸지 않았다 —
`LoginView.vue`가 지금도 `--font-size-2xl`을 그대로 쓰고 있어서,
가지고 있는 모든 화면의 h1(Dashboard 인사말/Timeline/GoalList/
GoalForm 제목)만 새 `--font-size-page-title`로 옮겨 실제로 커지게
하고 Login은 옛 토큰을 그대로 참조하니 영향이 없다. Landing의 섹션
제목(Why GrowLog/주요 기능/Growth Journey)도 각자 하드코딩했던
"24px"를 `--font-size-section-title`로 통일했다(값은 그대로라 시각
변화 없음). Dashboard Summary Card의 큰 숫자는 `--font-size-display`
(32px)로 승격해서 "숫자가 가장 강하게" 원칙을 강화했다 — 이 토큰은
Login의 `--font-size-2xl`(28px)과 별개라 서로 영향을 주지 않는다.

### `--shadow-elevated` — Depth는 2단계까지만

기본 카드는 `--shadow-card`, Hero Preview의 레이어드 카드나 hover
강조가 필요한 곳(Feature 카드/Goal 카드/Timeline·Dashboard 타임라인
아이템)만 `--shadow-elevated` 한 단계 더 쓰는 것으로 제한했다. 3단계
이상 elevation은 만들지 않았다.

### Hero Product Preview

`HeroSection.vue`를 다시 썼다. 실제 API를 연결하지 않고 정적
프레젠테이션 데이터만 쓰되, GrowLog Dashboard가 실제로 보여주는
정보(이번 달 기록/진행 중 목표/연속 기록 3개 숫자, Goal Progress,
최근 타임라인 1개)만 축약해서 보여준다 — 존재하지 않는 기능을 새로
지어내지 않았다. Soft Green 배경 카드를 흰 카드 뒤에 살짝 어긋나게
겹쳐서(layered surface) depth를 표현했고, elevation은
`--shadow-elevated` 한 단계만 썼다.

### Why GrowLog — rail을 infographic처럼 만들지 않기

점 크기를 리스트 아래로 갈수록 키우거나 대비를 강하게 주면 "진행률
그래프"처럼 보일 위험이 있어서, rail 자체(점 크기/색)는 손대지 않고
결론 문단만 옅은 Soft Green 배경으로 구분해 "도착 지점"만 표시하는
정도로 절제했다. 카피가 계속 중심이다.

### Growth Journey — 대표 Visual Identity로 재설계

박스+화살표 구조를 점(dot)+연결선 구조로 이미 바꿔뒀던 걸, 이번엔
"진행"을 실제로 표현하도록 발전시켰다: 노드 크기가 30→32→34→36px로
아주 조금씩 커지고, 배경색이 `--color-primary-bg`→`--color-accent`→
`--color-primary`→`--color-primary-hover` 순서로 짙어진다. Desktop
연결선도 같은 3톤을 구간별로 나눠서(각 구간은 flex 컬럼 폭 기준
정확한 %라 텍스트 길이와 무관하게 항상 정확하다) "line progress"를
표현했다. Mobile(세로 스택)에서는 각 노드의 실제 렌더링 높이가
설명 텍스트 길이에 따라 달라져서 CSS만으로 정확한 구간 경계를 계산할
수 없다 — 그래서 mobile은 연결선을 은은한 단일 톤으로 단순화했고,
"진행"은 각 점의 크기/색으로 계속 보여준다. 애니메이션은 없다.

### Timeline — 핵심 브랜드 화면

Dashboard의 rail보다 한 단계 더 또렷하게(점 8px vs 7px, 선 1.5px vs
1px) 만들어서 "이 화면이 진짜"라는 위계를 뒀다. 카드 내부를 유형+
아이콘 배지 → 제목 → 본문 → 날짜 순으로 정리했다. 날짜는 백엔드가
이미 내려주던 `TimelineItem.createdAt` 필드를 처음으로 화면에 노출한
것뿐이라 새 API가 필요 없었다 — `frontend/src/utils/date.ts`의
`formatTimelineDate()`로 "M월 D일" 형식으로만 축약한다. Goal/Record
구분은 여전히 rail 색이 아니라 배지+아이콘에만 맡겼다.

### Dashboard

Summary Card는 숫자(`--font-size-display`, 가장 진하게) → label →
hint(`opacity: 0.75`, 가장 약하게) 순서의 대비를 더 벌렸다. Accent
bar는 모든 카드에 넣지 않았다 — Primary Green을 카드 3개에 전부
쓰면 오히려 단조로워진다는 지적을 반영해 surface/typography 대비로만
위계를 만들었다(연속 기록의 Flame 아이콘 하나만 예외적으로 강조).
Quick Action은 아이콘+텍스트를 넣되 패딩/폰트 크기를 줄여서
(`.quick-action`) Summary Card보다 작게 유지했다. Recent Timeline도
Timeline과 같은 방식으로 날짜/아이콘/hover를 추가했다. API 연동
(`fetchDashboard`)과 상태 관리는 전혀 건드리지 않았다.

### Goal Card

title → status(아이콘 배지) → 기간(Calendar 아이콘) → progress →
action 순서는 그대로 유지하고 대비만 올렸다. Progress bar만 Primary
Green을 강조하는 핵심 요소로 남겨두고(두께 12px, % 라벨도 Primary
Green), 그 외 요소(제목/기간)는 Primary Green을 쓰지 않아서 "progress
만 성장을 상징"하도록 분리했다. 카드 전체에 hover(translateY -1px +
`--shadow-elevated`)를 추가했다. `GoalEditModal`/`ConfirmDialog`가
쓰는 클릭/수정/삭제 로직은 전혀 건드리지 않았다.

### AppNav 아이콘 — 적용하기로 결정

필수는 아니었지만, 이제 Feature 카드/필터/배지 전체에 이미 같은
아이콘 세트(`Route`=타임라인, `Target`=목표, `LayoutDashboard`=
대시보드)를 쓰고 있어서 nav만 텍스트로 남으면 오히려 일관성이
깨진다고 판단해 추가했다. 크기(15px)를 텍스트와 맞춰서 nav가 복잡해
보이지 않게 했다.

### Section Background — Stripe 대신 반복 등장

Background/Surface/Soft Green 3개 표면만 썼다. 전체 섹션을 번갈아
채우는 "stripe" 대신, 헤더만 Surface(흰색, 페이지 캔버스와
구분되는 상단 바)로 두고 나머지는 Background를 기본으로 유지하면서
Soft Green을 Hero Preview backdrop·Why GrowLog 결론·Final CTA에서
반복 등장시키는 방식을 택했다 — "리듬은 필요하지만 명확하게 잘리는
느낌은 피하고 싶다"는 요청에 맞춰, 전체 폭 배경색 전환보다 이 쪽이
더 안전하다고 판단했다.

### Record 화면은 여전히 유보

Record Detail/Create 화면은 만들지 않았다. Dashboard Recent
Timeline과 TimelineView의 Record 표현만 위 내용대로 개선했다.

### 검증

`npm run build` 통과(트리쉐이킹된 아이콘 청크 확인) 후, Playwright로
Landing(1280px/390px, Hero Preview 클로즈업 포함)·Dashboard·
Timeline·Goal List(1280px/390px)·Goal 수정 모달·Login을 전부
캡처했다. Timeline 목록 하단에 정체불명의 점이 더 있는 것처럼
보이는 스크린샷이 있어서 DOM 높이를 직접 측정해 확인했는데,
`.timeline__list`의 실제 bounding rect는 카드 3개 높이에 정확히
맞았고 그 아래는 `#app`의 `min-height: 100vh`가 만드는 배경일
뿐이었다 — 이미지 압축으로 인한 착시였고 실제 버그는 아니었다.

---

## Landing Dynamic Interaction — "기록 → 연결 → 축적 → 성장"을 동적으로 (2026-09-15)

Day One(Product Preview) / Framer Sticky Scroll Reveal(Growth Journey) /
SaaS Feature Reveal(주요 기능) / Dot Grid ambient motion(Hero/Why
GrowLog/Final CTA) / Raycast(Final CTA 마무리)의 상호작용 원리만
가져오고, 특정 사이트를 복제하지 않았다. GSAP 등 별도 motion
library는 쓰지 않았다 — CSS transition/animation + 네이티브
IntersectionObserver만으로 요청된 모든 효과를 구현할 수 있었다.

### `useInViewOnce` — 단일 타깃 1회 reveal 전용

Why GrowLog/Growth Journey처럼 "여러 타깃을 독립적으로 관찰"해야
하는 경우는 이 composable을 쓰지 않고 해당 컴포넌트에서 직접
IntersectionObserver를 구성했다(아래 참고). `useInViewOnce`는
Feature Section(그리드 전체 1회 트리거, stagger는 CSS nth-child
delay로 처리)과 Final CTA(섹션 전체 1회 트리거)에만 썼다 — "뷰포트
진입 시 1회 reveal"이라는 좁은 범위를 넘어서 확장하지 않았다.

### Progressive Enhancement — 모든 reveal의 공통 원칙

전 구간에 걸쳐 같은 패턴을 썼다: **기본 CSS(모션용 클래스가 없는
상태)는 항상 콘텐츠가 완전히 보이는 최종 모습**이다. `.will-reveal`
/ `.points--motion` / `.journey--motion` 같은 클래스는 컴포넌트가
`onMounted`에서 `prefers-reduced-motion`이 아닐 때만 스스로 붙인다.
그 클래스가 붙어야만 요소가 "숨어서 대기하는" 상태가 되고,
IntersectionObserver가 `is-visible`/`is-active`를 붙이면 원래
모습으로 돌아온다. 즉 "JS가 있어야 콘텐츠가 보인다"가 아니라
"JS가 있어야(그리고 motion이 허용돼야) 콘텐츠가 숨었다가 나타난다"
구조로 뒤집었다. reduced-motion이면 이 클래스 자체가 안 붙으므로
관찰자 없이 즉시 최종 상태다 — Playwright로 `reducedMotion:'reduce'`
컨텍스트에서 스크롤 없이 로드 직후 모든 opacity가 1임을 확인했다.

### Hero — mount 트리거 진입 시퀀스 (850ms) + ambient motif

Hero는 뷰포트 진입이 아니라 마운트 즉시 재생된다(첫 화면이라
IntersectionObserver가 필요 없음). `PERSONAL GROWTH ARCHIVE` supporting
label을 헤드라인 위에 새로 추가했다(11px/semibold/letter-spacing,
Secondary Text 색 — headline보다 항상 약하게). 모티프(0ms)→
label(50ms)→headline(110ms)→subcopy(170ms)→CTA(230ms)/Preview(200ms)→
Preview 내부(header 280ms~timeline 500ms, 각 350ms 재생)까지 총
850ms로 끝난다. `animation-fill-mode: both`를 써서 각 요소가 자기
delay 전까지는 `from` 프레임(opacity:0)을 유지하다가 애니메이션이
끝나면 `to` 프레임(opacity:1)에 고정되므로 별도 "끝난 뒤 정적으로
고정" 처리가 필요 없다. 진입 애니메이션 도중에도 CTA는 `pointer-
events`를 막지 않아서 150ms 시점에 클릭 가능함을 Playwright로 확인
(실제 클릭 → `/login` 이동까지 성공). Ambient motif(점 opacity 펄스,
4~6초 루프)는 진입 시퀀스가 끝난 뒤(1~1.6초 delay)부터 시작하고,
`@media (min-width:721px)`로 묶어서 모바일에서는 비활성화했다.

### Why GrowLog — 항목별 reveal + rail 비례 성장

각 `<li>`를 개별 IntersectionObserver로 관찰해서 뷰포트 진입 시
순서대로 reveal하고, 본 항목은 `unobserve`해서 다시 숨기지 않는다.
rail 선은 원래 있던 연속된 `::before` 하나를 유지하되, reveal된
항목 수에 비례해 `scaleY(0.34/0.67/1)`로 자라게 했다 — 항목마다
정확한 픽셀 위치에 맞춰 개별 선 segment를 긋는 것은 문장이 몇 줄로
줄바꿈될지 미리 알 수 없어 어렵기 때문에(Growth Journey 모바일과
같은 이유) 택한 단순화다.

### Feature Section — 그리드 1회 트리거 + CSS stagger + hover guard

`useInViewOnce`로 그리드 전체가 진입할 때 1회 트리거하고, 카드별
시간차는 `nth-child` `transition-delay`(Desktop 0/80/160/240ms,
Mobile 0/40/80/120ms)로만 처리해서 카드마다 관찰자를 따로 두지
않았다. hover(translateY -2px + shadow/border)는 `@media (hover:
hover) and (pointer: fine)`로 감쌌다.

### Growth Journey — 가장 크게 헤맨 부분

처음에는 Why GrowLog와 같은 방식으로 노드 4개를 각각
IntersectionObserver로 관찰했는데, **Desktop에서는 노드 4개가 가로로
나란히 배치돼 있어 뷰포트 진입 Y좌표가 사실상 동일**해서 스크롤
아주 조금만 해도 4개가 동시에 활성화되는 문제를 Playwright 테스트로
발견했다. 그래서 개별 노드 관찰을 버리고, **rail 전체의 스크롤
진행률을 계산**해서 4단계에 매핑하는 방식으로 바꿨다: rail이
IntersectionObserver로 뷰포트에 들어와 있는 동안에만(전역 상시
리스너 아님) `requestAnimationFrame`로 스로틀된 `scroll` 리스너를
붙이고, `progress = (뷰포트높이*0.85 - rect.top) / (뷰포트높이*0.85 -
뷰포트높이*0.45)`로 0~1 진행률을 계산해 `Math.floor(progress*4)`를
활성화한다(`activateUpTo`가 단방향으로만 누적 — 뒤로 스크롤해도
비활성화하지 않음). 이 두 번째 버전도 처음엔 계수(뷰포트 중간까지 +
rail 자기 높이만큼 더)가 잘못돼서, Growth Journey 바로 다음이
페이지의 마지막 섹션(Final CTA)이라 **문서 맨 아래에 도달해도 진행률
100%에 못 미쳐 마지막 단계가 영영 활성화되지 않는 버그**가
Playwright 스크롤 시뮬레이션에서 나왔다 — 뷰포트 비율 기반 구간(85%→
45%)으로 다시 조정해서 해결했고, 실제로 처음/끝(step0→step3)까지
`[true,false,false,false]→[true,true,false,false]→[true,true,true,false]
→[true,true,true,true]`로 정확히 순차 누적되는 것과 다 활성화된
뒤 위로 스크롤해도 비활성화되지 않는 것까지 확인했다. connector
3구간(flex 컬럼 폭 기준이라 텍스트 길이와 무관하게 항상 정확한 desktop
전용) 색은 이전 단계 그대로(`--color-primary-bg`→`--color-accent`→
`--color-primary`) 유지하고 `scaleX`로, 노드는 `opacity 0.5→1 / scale
0.85→1`로 활성화된다. Mobile 세로 rail은 (항목별 실제 렌더링 높이를
CSS만으로 알 수 없어서) 활성화 개수 비례 `scaleY`로 단순화했다 —
Why GrowLog와 동일한 이유.

### Final CTA

`useInViewOnce`로 섹션 진입 시 1회, 자식 4개(모티프/제목/본문/버튼)를
`nth-child` `transition-delay`(0/100/200/300ms)로 순서대로 fade-up
했다. Soft Green 배경 자체는 움직이지 않는다.

### Application UI(Dashboard/Timeline/Goal) — hover pointer guard만

실제 `transform` 기반 hover가 있는 3곳(`DashboardView`/`TimelineView`의
`.timeline-item:hover`, `GoalCard`의 `.goal-card:hover`)에만
`@media (hover: hover) and (pointer: fine)`를 추가했다. `AppNav`/
`BaseButton`의 hover는 transform 없는 단순 색상 전환이고 앱 전역
공용 컴포넌트라 범위(Dashboard/Timeline/Goal 실제 hover/transform)
밖이라 건드리지 않았다. Landing처럼 stagger entrance나 scroll
reveal을 Application 화면에 확장하지 않았다.

### 전역 `prefers-reduced-motion` 안전망

`style.css`에 `*`의 `animation-duration`/`transition-duration`을
`0.01ms`로 강제하는 규칙을 추가했다 — 각 컴포넌트가 이미
prefers-reduced-motion을 개별적으로 확인해서 모션용 클래스 자체를
안 붙이지만(핵심 방어선), 실수로 그 체크를 빠뜨리는 경우까지 대비한
2차 안전망이다.

### 검증

`npm run build` 통과 후 Playwright로: Hero 진입 애니메이션 도중
(150ms) CTA가 클릭 가능하고 실제 클릭 시 `/login`으로 이동하는지,
전체 시퀀스가 끝난 뒤(1050ms) 모든 요소 opacity가 1인지, Why
GrowLog/Feature가 뷰포트 진입 전엔 숨어있다가(Feature는 opacity 0
확인) 진입 후 보이는지, **Growth Journey가 스크롤에 따라 정확히
순차적으로(동시에 아님) 누적 활성화되고 뒤로 스크롤해도 유지되는지
6단계 스크롤 시뮬레이션으로 확인**, Final CTA reveal, reduced-motion
컨텍스트에서 스크롤 없이 즉시 전부 보이는지(`.journey--motion`
클래스 자체가 안 붙는 것 포함), Mobile(390px) 세로 Growth Journey와
Hero, `(hover:hover) and (pointer:fine)`가 실제 터치 기기 에뮬레이션
(iPhone 13 디바이스 디스크립터)에서 정확히 false로 평가되는지(뷰포트
크기만 바꾼 컨텍스트에서는 여전히 true로 나와 테스트 방법 자체를
수정해 재확인), Login 화면과 Goal 카드 hover-guard 이후에도 수정
모달이 정상 동작하는지까지 확인했다.

## Landing Page Composition/Visual Design 재구성 — Editorial Product Storytelling (2026-09-15)

이전 라운드까지 Landing은 기능적으로는 완성됐지만, "가운데 정렬
제목 → 카드 그리드"가 섹션마다 반복되고(Why GrowLog/Feature Section
모두 이 패턴), Feature Section의 카드 4장이 아이콘만 다를 뿐 완전히
동일한 형태였고, 점/선 모티프가 Hero/Why GrowLog/Growth Journey/
Final CTA 네 곳에 기계적으로 반복돼서 "AI가 만든 전형적인 SaaS
템플릿"처럼 읽힌다는 지적을 받았다. 이번 라운드의 목표는 애니메이션을
더 넣는 게 아니라 **Composition 자체를 GrowLog만의 것으로 바꾸는
것**이었다 — 기준은 "animation을 모두 꺼도 좋은 디자인"(정지 화면만
봐도 layout이 잘 설계돼 있어야 한다)이었다.

### 변경 파일

`HeroSection.vue`, `LandingView.vue`(Why GrowLog/Final CTA),
`FeatureSection.vue`(전체 재작성), `GrowthJourney.vue`(CSS만, 스크립트
로직은 100% 유지)까지 총 4개 컴포넌트. API/Router/Pinia/Auth나
Dashboard/Goal/Timeline의 실제 기능 로직은 전혀 건드리지 않았다.

### 폭 — 섹션마다 ~960px → ~1180~1220px

Hero는 `max-width: 1220px`(copy 자체는 여전히 520~560px 상한 유지),
Why GrowLog/Feature Section/Growth Journey는 `max-width: 1180px`로
넓혔다. Final CTA는 배경을 여전히 화면 끝까지 full-bleed로 채워야
해서(`.final-cta-band` 래퍼) 안쪽 콘텐츠에만 `max-width: 1180px`를
줘서 좌우 padding 리듬만 다른 섹션과 맞췄다.

### Hero — "카드 하나"가 아니라 3-레이어 layered composition

기존엔 Dashboard 미니어처를 담은 카드 1장 + 점/선 장식 모티프였다.
지금은 그 모티프를 완전히 제거하고, 대신 세 개의 실제 화면 요소가
겹치는 장면으로 바꿨다: **Dashboard Main Panel**(현재 성장 상태 —
가장 크고 `--shadow-elevated`, z-index 최상단, 우상단) / **Goal
Progress Panel**(그 목표 정보에서 파생된 세부 — main panel 좌하단에
걸쳐 겹침, `--shadow-card`) / **Record Card**(최근 기록이 Dashboard/
Timeline과 이어진다는 관계 — main panel 우하단에 걸쳐 겹침,
`--shadow-card`). 세 레이어는 2D 절대 위치 오프셋 + 겹침 + 2단계
shadow depth만으로 위계를 표현하고, rotate/perspective/3D transform/
계속 움직이는 floating은 전혀 쓰지 않았다. `≤720px`에서는 세 레이어가
`position: static`으로 풀리며 자연스러운 세로 stack(main → goal →
record)으로 전환된다.

### Why GrowLog — BaseCard 제거, 번호가 읽는 순서인 editorial statement

카드+점선 rail 구조를 없애고, 01/02/03 번호가 붙은 문장을 세로로
나열하되 01은 왼쪽 끝, 02/03은 `clamp()`로 점점 오른쪽으로 밀려서
계단처럼 읽히게 했다(`≤720px`에서는 오프셋을 0으로 되돌린다). 번호는
`--color-accent`(01) → `--color-primary`(02) → `--color-primary-
hover`(03) 순으로 짙어지는데, 이는 Growth Journey 노드가 진행에 따라
짙어지는 것과 같은 컬러 언어를 재사용한 것이다. 번호 폰트 크기는
13px로 제한해서 본문(18px)보다 항상 작게 뒀다 — "번호가 장식처럼
비대해져서 카피보다 강해 보이면 안 된다"는 요청 때문이다. 결론 문장은
Soft Green 배경 박스를 없애고, 충분한 상단 여백(`space-12 * 1.1`)과
Primary Green 텍스트 컬러만으로 "도착 지점"임을 표시한다. 점/선 rail도
이 섹션에서 완전히 제거했다(대표 사용처를 Growth Journey/Timeline
Preview로 좁힘).

### Feature Section — 4-card grid 제거, alternating Product Story row

동일한 카드 4장을 없애고, 각 기능마다 완전히 다른 내부 구성을 가진
row 4개로 바꿨다: **01 목표 관리**(텍스트\|Goal 미니 카드 — 카테고리/
상태 배지/제목/진행바), **02 성장 기록**(Record 미니 카드 2개\|텍스트),
**03 성장 타임라인**(텍스트\|점+선으로 이어진 Goal/Record 노드 2~3개),
**04 성장 대시보드**(요약 통계 카드\|텍스트). Desktop은 `.story--
reverse`(02/04에만 적용)로 시각적 좌우만 바꾸고, 마크업은 4개 row
모두 항상 "텍스트 먼저" 순서를 유지한다 — 그래서 `≤900px`에서
`flex-direction: column`으로 강제 전환될 때 row-reverse가 같이
꺼지기만 해도 4개 row 전부 자동으로 텍스트 → 프리뷰 순서가 된다(별도
DOM 재정렬 없이 CSS 한 줄로 해결). row 사이 간격은 기존 grid gap
(`space-6`)보다 훨씬 넓은 `space-12 * 1.8`로 뒀다. Preview에 쓰인
정보는 전부 GrowLog가 실제로 보여주는 값(이번 달 기록 12/진행 중
목표 3/연속 기록 7일, Goal 진행률 72%, Timeline 항목명)의 축약이고,
Record는 아직 Create/Detail 화면이 없어서 Timeline의 Record 항목
형태까지만 표현했다(입력 폼처럼 보이는 UI는 만들지 않음).

row마다 `useInViewOnce()`를 독립적으로 하나씩(총 4개) 붙였다 — 그리드
전체를 하나의 observer로 묶으면 row마다 다른 시점에 트리거할 수 없기
때문이다. reduced-motion이면 애초에 observer 자체가 안 만들어지므로
인스턴스 4개가 늘어나는 비용은 실질적으로 "motion이 켜진 경우에만"
발생한다.

### Motion Language — 4개가 아니라 3개 계열로 통합

모든 row가 서로 다른 애니메이션 시스템이 되는 걸 피하려고, 공통
베이스(텍스트/프리뷰가 opacity+translateY로 나타남) 위에 family당
한 가지 요소만 얹는 구조로 통일했다:

- **A. Progress**(Goal row 전용) — 진행바 `width`가 0%에서 72%로
  채워진다.
- **B. Accumulation/Connection**(Record + Timeline row가 공유) —
  Record는 두 번째 기록 카드가 살짝 늦게(220ms) 나타나 "방금 추가된
  기록"처럼 읽히고, Timeline은 connector 선이 `scaleY(0→1)`로 자라며
  노드가 순서대로(140ms/280ms 간격) 나타난다 — 둘 다 "무언가 더해지고
  이어진다"는 같은 언어를 공유한다.
- **C. Reveal/Highlight**(Dashboard row 전용) — 요약 통계 항목들이
  순서대로(90ms/180ms/270ms 간격) opacity로 나타난다. count-up은
  쓰지 않았다(요청사항).

### Growth Journey — 로직은 그대로, 폭/여백/마지막 단계 강조만

`computeProgressStep`/`activateUpTo`/observer attach-detach 로직은
한 글자도 건드리지 않았다. `max-width`만 960→1180px로 넓혀서 4개
flex:1 노드가 자연스럽게 더 넓게 벌어지게 했다 — `gap`을 추가하는
방식은 시도하지 않았다: connector 3개가 "노드 사이 gap 없음"을
전제로 12.5%/37.5%/62.5% 고정 비율로 그려지기 때문에, gap을 주면
connector와 노드 중심이 어긋난다. 마지막 단계("변화를 발견합니다")는
별도 카드/배경 없이 라벨만 `font-weight: bold` + `color: var(--
color-primary)`로 강조했고, motion이 켜진 상태에서 active가 될 때도
이 강조가 유지되도록 `.journey--motion .journey__node--3.is-active
.journey__label` 규칙을 기존 active 규칙 뒤에 추가했다(같은
specificity에서 source order로 승리). 섹션 제목은 `margin: 0 auto`로
가운데 정렬된 640px 박스 안에서 `text-align: left`를 써서, Hero/Why
GrowLog/Feature의 완전한 left 정렬과 Final CTA의 완전한 center 정렬
사이 "slightly offset center"로 뒀다 — 요청된 heading 정렬 리듬
(억지로 전부 다르게 만들 필요는 없지만 "가운데 제목 → 콘텐츠" 패턴이
기계적으로 반복되진 않게)을 따른 것이다.

### Final CTA — motif/stagger 제거, headline/context/button/whitespace만

점 2개+선 모티프 마크업을 제거하고, 4단계 nth-child stagger(0/100/
200/300ms)도 없앴다. 지금은 섹션 전체가 한 번의 subtle fade-up
(opacity+translateY, 500ms)으로만 나타난다.

### 검증

`npm run build`(vue-tsc + vite) 통과. Playwright로 Desktop(1440px)/
Tablet(820px)/Mobile(390px) 전 구간을 스크린샷과 computed style로
확인했다: Hero 3-레이어 겹침이 데스크톱에서 의도한 위치에 렌더링되고
`≤720px`에서 세로 stack으로 정상 전환되는지, Goal 진행바가
`width: 0% → 72%`로 실제 채워지는지, Record 두 번째 카드/Timeline
connector+노드/Dashboard 통계가 각각 의도한 지연으로 나타나는지(단,
Playwright의 `scrollIntoViewIfNeeded()`가 요소를 뷰포트 최하단
경계에 최소한으로만 걸치게 스크롤할 경우 `rootMargin: -10%`
때문에 관찰자가 아직 안 뜨는 케이스가 있어, 약간 더 스크롤하면
정상적으로 트리거됨을 별도로 재확인 — 실제 사용자 스크롤에서는
발생하지 않는 테스트 스크롤 방식의 한계였다), Growth Journey가
기존과 동일하게 스크롤에 따라 순차 누적 활성화되고 뒤로 스크롤해도
유지되는지 6단계로 재확인, `reducedMotion:'reduce'` 컨텍스트에서
스크롤 없이 로드 직후 Hero/Why GrowLog/Feature 4-row/Journey/Final
CTA가 전부 최종 상태로 보이는지(Goal 진행바도 스크롤 없이 이미
72%), Mobile에서 `.story--record`(desktop에서 프리뷰가 왼쪽인
row)의 실제 DOM 자식 순서가 `story__text` → `story__preview`임을
확인해 "Mobile은 항상 텍스트 먼저" 요구사항이 마크업 순서 자체로
보장됨을 검증했다. Dashboard/Timeline/Goal/Login 등 다른 화면은
이번 라운드에서 전혀 건드리지 않았다.

## Landing Storytelling + Color Impact Polish (2026-09-15)

Landing의 레이아웃/section separation은 그대로 두고 두 가지만
고도화했다: Why GrowLog가 하나의 Story Arc로 읽히도록 강화하는 것,
그리고 "Calm Application UI + Expressive Landing" 원칙에 따라
Landing에만 브랜드 컬러의 명암/면적 대비를 더 적극적으로 쓰는 것.
Dashboard/Goal/Timeline/Login 등 Application UI는 전혀 건드리지
않았다.

### 새로 추가한 Landing 전용 컬러 토큰

`--landing-green-deep: #142c22` 하나만 추가했다(`LandingView.vue`의
`.landing` 셀렉터에 선언 — 전역 `tokens.css`는 건드리지 않았고, Vue
scoped 컴포넌트 경계와 무관하게 실제 DOM 트리 최상위에 있어 Hero/
FeatureSection/GrowthJourney 어디서든 상속받아 쓸 수 있다).

**왜 필요했나**: Final CTA를 Landing의 color climax로 만들려고
배경을 `--color-primary`로 바로 쓰면, 그 위에 얹는 CTA 버튼
(`BaseButton variant="primary"`도 동일하게 `--color-primary` 배경)이
배경과 거의 같은 색이 되어 묻힌다. 버튼은 Application UI에서도 쓰는
전역 공용 컴포넌트라 여기서 손댈 수 없었다. 그래서 배경만 한 단계 더
짙게 둬서 버튼이 뚜렷하게 떠 보이게 했다. 값은 WCAG 대비를 실제로
계산해서 골랐다(button-bg vs band-bg 3.06:1 — WCAG 1.4.11 non-text
3:1 기준 통과, title/text vs band 14.86:1 — 텍스트 AA 4.5:1 기준을
크게 상회).

그 외 "Deep Green"이 필요한 곳(Feature Dashboard preview의 streak
stat, Hero의 streak stat)은 새 토큰을 만들지 않고 기존
`--color-primary-hover`를 재사용했다 — 이미 충분히 짙어서 별도
토큰이 필요 없었다.

### Why GrowLog — Story Arc

- 01(목표 흐려짐): 첫 줄 체크박스만 Primary Green으로 채워 체크
  표시를 넣고(`✓`, 순수 CSS pseudo-element), 아래 두 줄은 기존처럼
  빈 체크박스+opacity 하락 — "처음엔 선명했던 목표 하나가 점점
  미확인 상태로 흐려진다"가 체크 여부로도 읽히게 했다.
- 03(축적): 가장 위(가장 선명한) 카드에 작은 Primary Green dot을
  하나 얹어 "변화가 보이는 지점"을 표시했다.
- Motion: 기존 문장별 IntersectionObserver는 그대로 두고(새 observer
  추가 없음), `.intro__visual`에 문장보다 200ms 늦게 나타나는 별도
  opacity transition을 하나 얹어 "문장 등장 → visual 변화"라는 순서가
  느껴지게 했다. 03의 stack card 3장은 220/300/380ms로 짧게
  stagger해서 "정돈되는" 느낌을 줬다.
- Conclusion: Story의 resolution이라는 걸 표시하려고 상단 여백을
  키우고(1.1x→1.3x), font-size/weight를 올리고(18px medium→20px
  semibold), 색을 `--color-primary`→`--color-primary-hover`로,
  그리고 위에 40×3px Primary Green accent rule 하나를 추가했다. 별도
  카드/배경 박스는 여전히 쓰지 않았다.
- Section band: `.intro-band`/`.journey-band`의 배경을 단색에서
  `linear-gradient`로 바꿔서, 각 섹션 안에서 아래로 갈수록
  `--color-primary-bg` 쪽으로 아주 미세하게 기우는 색 흐름을 만들었다
  (두 번째 stop을 130~140%로 잡아 실제 전환은 섹션 절반도 못 가서
  끝난다 — 눈에 띄는 색 블록이 아니라 tonal drift 수준).

### Hero / Feature / Growth Journey 컬러

- Hero: `.hero::before`로 viewport 전체에 걸치는 아주 옅은
  radial-gradient(`rgba(63,125,99,0.08)`, Product Scene 쪽에서
  번짐)를 새 wrapper 없이 추가했다. Dashboard Frame 테두리를 중립
  회색→`--color-primary-bg`로, streak stat 한 칸만
  `--color-primary-hover` 배경의 강조 타일로, Goal 블록에 Primary
  Green 왼쪽 accent bar, Record 카드에 Accent 색 상단 테두리를 각각
  추가했다 — 3개 카드를 전부 초록으로 만들지 않았다.
- Feature: Goal(Primary Green 상단 accent bar) / Record(Accent 색
  날짜 배지) / Timeline(테두리를 Soft Green으로) / Dashboard(streak
  stat을 Hero와 같은 Deep Green 강조 타일로) — Green family 안에서
  기능마다 다른 강조를 줬다.
- Growth Journey: rail의 단색 배경을 `--color-primary-bg → --color-
  accent → --color-primary → --color-primary-hover` 4-stop
  gradient로 바꿨다. `scaleY` 애니메이션/observer 로직/node
  구조는 전혀 손대지 않았다.

### 검증

`npm run build` 통과. Playwright로 1440/1200/1024/768/390에서
`.hero`/`.intro`/`.feature-section`/`.journey`/`.final-cta`의
bounding box가 색상 작업 전후로 픽셀 단위까지 동일함을 확인해(레이아웃
무영향), horizontal overflow가 전 구간에서 없음을 확인했다.
`reducedMotion:'reduce'` 컨텍스트의 전체 페이지 스크린샷으로 모든 색
강조(체크마크, streak highlight, accent rule, gradient rail, deep
green CTA)가 스크롤/애니메이션 없이 로드 즉시 최종 상태로 보이는 것도
확인했다.

---

## Day 11 (2026-09-16) — UI/UX State Completion

### 기존 상태 확인부터 시작

`renewal-roadmap-final.md`가 요구하는 Loading/Empty/Error/Success 상태를
Dashboard/Timeline/Goal List/Goal Card/Goal Progress/Status Badge/
LoadingSkeleton 순서로 하나씩 다시 읽어서 확인했다. 대부분 이미 이전
Day들에서 구현되어 있었다:

- DashboardView: skeleton loading, 에러 문구, 빈 상태(목표 없음/기록
  없음 각각), streak 등 3개 요약 카드 — 이미 완결.
- TimelineView: 필터(ALL/GOAL/RECORD)별로 다른 empty 문구, 에러, 로딩
  — 이미 완결.
- GoalListView: 목록 로딩/에러/빈 상태 + ConfirmDialog를 통한 삭제
  확인→삭제 중→삭제 실패 흐름 — 이미 완결.
- GoalCard/GoalProgress/GoalStatusBadge: 진행률 0-100 clamp, 상태별
  variant/아이콘 매핑, ARIA progressbar — 이미 완결.
- LoadingSkeleton: `prefers-reduced-motion`에서 shimmer 애니메이션
  비활성화 — 이미 완결.

그래서 Day 11에서 실제로 손댄 부분은 **목표 생성/수정 폼의 제출 전
검증** 하나뿐이었다. 새 기능을 추가하는 대신, 원래 이 Day의 취지(있는
화면의 상태 처리를 완성한다)에 맞춰 빠진 상태만 채웠다.

### 목표 생성/수정 폼 클라이언트 검증 추가

`GoalFormView.vue`(생성)와 `GoalEditModal.vue`(수정) 둘 다 카테고리
미선택 검사만 있고, 제목 공백/길이나 기간 역전은 서버 왕복 후에야
`extractErrorMessage`로 에러 문구를 보여주는 방식이었다. 서버
(`GoalService`)가 이미 이 규칙들을 검증하고 있으므로 새 규칙을
발명하지 않고 그대로 클라이언트에 미러링했다:

- 빈 제목("목표 제목을 입력해주세요.")
- 200자 초과 — 임의 숫자가 아니라 `Goal` 엔티티의
  `GOAL_TITLE` 컬럼이 `length=200`(VARCHAR(200))인 데서 그대로 가져온
  기준이다.
- 종료일 < 시작일("종료일은 시작일보다 빠를 수 없어요.")

`BaseInput`의 루트 엘리먼트가 `<label>`이라 네이티브 `maxlength`
속성을 넘겨도 내부 `<input>`까지 전달되지 않는다는 걸 컴포넌트를 읽고
확인했다 — 그래서 HTML 속성이 아니라 JS `validate()` 함수로 제출 시점
검증을 구현했다. 두 파일 모두 동일한 `validate()`를 갖게 됐는데,
공유 composable로 뽑기엔 로직이 너무 짧고(각 6줄) 두 파일의 상태
변수 이름/구조가 이미 다르므로 추상화를 만들지 않고 중복을 그대로
뒀다.

### 검증 — Playwright 스크린샷 18장

`/api/me`를 목으로 채워 라우터 가드를 통과시킨 뒤, Dashboard/
Timeline/Goal List/Goal Form 각각의 Loading(지연 응답)/Error(500)/
Empty(빈 배열)/Success 상태와, Goal List의 삭제 확인→삭제 중→삭제
실패 흐름, Goal Form의 빈 제목/200자 초과+기간 역전 동시 에러/제출
중 중복 클릭 방지(버튼 disabled)/모바일 뷰포트 오버플로우 여부까지
총 18장을 `docs/screenshots/day11/`에 저장하고 육안으로 확인했다.
결과: 검증 에러 문구가 필드 아래 올바르게 렌더링되고, 삭제
확인 모달이 정상 동작하며, 모바일(375px) Goal Form에서 가로
스크롤이 발생하지 않음(`document.documentElement.scrollWidth <=
window.innerWidth` 확인)을 모두 확인했다.

캡처에 사용한 스크립트가 스크린샷을 전부 저장하고 "DONE"을 출력한
직후, teardown 과정에서 이미 닫힌 context에 걸려 있던 라우트 핸들러
하나가 뒤늦게 실행되며 `route.fulfill` 호출 시 TypeError를 던졌다.
18개 스크린샷 파일은 모두 정상 생성된 것을 확인했고, 앱 코드가 아니라
검증 스크립트 자체의 정리(teardown) 순서 문제였으므로 트러블슈팅
목록에는 올리지 않았다(실제 애플리케이션 동작에 영향 없음).

### 이번 Day에서 하지 않은 것

로드맵 지시대로 새 디자인/새 기능은 추가하지 않았다. Record 관련
"기록 남기기" 버튼이 Dashboard에 여전히 disabled로 남아 있는 것도
그대로 뒀다(Day 13에서 연결 예정).

---

## Day 12 (2026-09-16) — Frontend Architecture & State Review

큰 리팩토링 없이 현재 구조를 점검하고 "왜 이렇게 되어 있는가"를
문서로 남기는 게 목적이다. `stores/`, `api/`, `composables/`,
`types/`, `router/`, 그리고 모든 View/컴포넌트를 다시 훑었다.

### 1. Global vs Local State — Pinia는 auth.store 하나만

`useAuthStore` 하나만 존재하고, 나머지(모달 열림/닫힘, 폼
saveStatus/errorMessage, Timeline 필터 선택, 삭제 확인 대상 등)는
전부 컴포넌트 로컬 `ref`다. 이게 의도된 것인지 "아직 안 만든" 것인지
확인이 필요했는데, 각 상태가 실제로 여러 컴포넌트에 걸쳐 공유되는지를
기준으로 보면 정당하다:

- `auth.store`의 `user`는 AppNav/Header, Dashboard 인사말, Router
  Guard(`isAuthenticated`) 세 곳이 동시에 참조한다 — 전역이 맞다.
- 반대로 GoalEditModal의 `saveStatus`, GoalListView의
  `deleteStatus`, TimelineView의 필터 선택은 그 화면을 벗어나는 순간
  의미가 없다 — props/emit으로 부모-자식 간에만 오가면 충분하고,
  실제로 그렇게 되어 있다.

즉 "전역 상태로 승격된 로컬 상태"가 없다. 새 Pinia store를
추가하지 않았다.

### 2. API 레이어 — 도메인별 4개 파일 + 공유 axios 인스턴스 1개

`api/axios.ts`가 `baseURL`/`withCredentials`/CSRF 쿠키↔헤더 매핑을
한 곳에서만 설정하고, `auth.api.ts`/`dashboard.api.ts`/
`goal.api.ts`/`timeline.api.ts`는 전부 이 인스턴스를 가져다 쓰는
얇은 함수들이다. 각 함수는 요청 하나당 한 함수, 응답 타입을
제네릭으로 명시(`api.get<Goal[]>(...)`)해서 호출부에서 타입 추론이
되게 했다. 이 4개 파일 사이에 설정 중복이나 별도 axios 인스턴스
생성이 없는지 grep으로 확인했다 — 없음.

### 3. TypeScript — `any` 미사용, 타입 중복 없음

`src/` 전체에서 `any` 사용을 grep했고 0건이었다. 타입은 API 파일과
1:1로 대응하는 `types/*.ts`(auth/dashboard/goal/timeline)로 나뉘어
있고, `DashboardSummary.recentTimeline`이 `TimelineItem[]`을 그대로
재사용하는 등 같은 개념을 다른 이름으로 중복 정의한 곳이 없었다.
`GoalRequest`는 생성(POST)과 수정(PUT)이 같은 엔드포인트 모양이
아니라는 걸 옵셔널 필드(`goalProgress?`/`goalStatus?`)로 표현해서
백엔드 `GoalService.saveGoal()`이 이 두 값을 무시한다는 사실을
타입에 그대로 반영하고 있었다 — 실제 API 계약과 타입이 일치.

### 4. 컴포넌트 구조 — `common/`(재사용 Base*) vs `goal/`(도메인)
   vs `landing/`(Landing 전용)

`common/`에는 Base* 원시 컴포넌트(Input/Button/Card/Modal/Badge)와
AppNav/ConfirmDialog/LoadingSkeleton처럼 도메인에 묶이지 않는
공용 UI만 있고, Goal 관련 컴포넌트(Card/Progress/StatusBadge/
EditModal)는 `goal/`에, Landing 전용 섹션은 `landing/`에 분리되어
있다. DashboardView.vue가 319줄로 파일 중 가장 크지만 `<script
setup>` 자체는 40줄이 안 되고 나머지는 템플릿 3개 섹션(요약 카드/
빠른 실행/최근 타임라인)과 scoped style이다 — 로직이 얽혀서 커진
게 아니라 화면에 실제로 보여줄 섹션이 많아서 길다. 인위적으로
쪼개면 오히려 props 전달만 늘어나므로 분리하지 않았다.

### 5. Composables — `useInViewOnce` 하나, 범위 확장 없음

`composables/`에는 Landing 전용 `useInViewOnce` 하나뿐이다.
Dashboard/Timeline/Goal 쪽 데이터 로딩은 각 View의 `onMounted` +
try/catch로 충분히 짧아서(6~10줄) 아직 composable로 뽑을 만큼
반복되지 않았다 — 억지로 `useFetch` 같은 범용 composable을 만들지
않았다.

### 6. 에러 처리 책임 분리 확인

- **API 공통(세션 만료)** → `api/interceptors.ts`. `/api/me` 요청은
  명시적으로 제외하고(주석에 이유가 이미 적혀 있음: 비로그인 사용자가
  공개 페이지에 들어올 때마다 튕기는 걸 막기 위해), 그 외 401만
  전역으로 `/login`에 리다이렉트한다.
- **화면 단위(데이터 조회 실패)** → 각 View의 `status`
  ref(`loading`/`success`/`error`) + `onMounted` try/catch. 화면
  전체를 못 그릴 정도의 실패를 담당한다.
- **폼 단위(제출 실패/검증)** → Form/Modal의 `saveStatus`/
  `errorMessage` + `extractErrorMessage(error, fallback)`. 서버가
  `IllegalArgumentException` → 400 + `{message}`로 내려주는 걸 그대로
  보여주고, Day 11에서 추가한 클라이언트 사전 검증은 그 앞단에서
  왕복 없이 막는다.

세 계층이 실제 코드에서 겹치지 않고 정확히 이 경계대로 나뉘어 있는
것을 파일별로 확인했다.

### 7. Router Guard vs Axios 401 Interceptor — 역할 분리 확인

Router Guard(`router/index.ts`)는 "네비게이션 시작 시점에 인증
여부를 한 번 확정"하는 역할만 한다 — `initialized`가 false일 때만
`fetchCurrentUser()`를 호출하고, 그 결과로 보호 라우트 진입을
막거나 로그인 상태에서 `/login` 접근을 막는다. Axios
interceptor(`interceptors.ts`)는 "이미 인증된 화면에서 세션이
도중에 끊겼을 때"만 반응한다 — `/api/me` 요청은 걸러내므로 Router
Guard의 `fetchCurrentUser()` 실패 처리와 겹치지 않는다. 두 메커니즘이
서로의 역할을 침범하지 않는 것을 인터셉터 주석과 실제 조건문으로
재확인했다.

### 결론

이번 점검에서 발견된 구조적 문제는 없었다. 리팩토링 없이 위 6개
항목을 문서화하는 것으로 Day 12를 마친다.

---

## Day 13 (2026-09-16) — Record Detail Read

로드맵 범위를 그대로 지켰다: `Timeline → 기록 카드 클릭 → /record/:id
→ Record Detail` 최소 읽기 흐름만 구현하고, Record 생성/수정 Vue
전환이나 새 미디어/댓글/배지 기능은 손대지 않았다.

### 백엔드 — 새 비즈니스 로직 없이 기존 Service/Entity 재사용

`GrowthRecordController`(JSP)의 `recordDetail()`이 이미
`GrowthRecordService.findRecordById(recordNum, memberNo)`(다른 회원의
기록이면 `IllegalArgumentException`)와
`MediaService.findMediaByGrowthRecord(recordNum)`(이미지는 S3
Presigned URL, YouTube는 `https://www.youtube.com/embed/{videoId}`로
변환까지 끝낸 `MediaResponse` 목록)를 쓰고 있었다. 이 두 메서드를
그대로 다시 호출하는 얇은 `GrowthRecordApiController`
(`GET /api/records/{recordNum}`)와 `GrowthRecordResponse` DTO만
추가했다 — `GoalApiController`와 동일하게
`@ExceptionHandler(IllegalArgumentException.class)` → 400 + message
패턴을 그대로 따랐다. `GrowthRecordResponse`는 `GoalResponse`와 같은
이유(Member 지연 로딩 필드를 실수로 직렬화하지 않기 위해)로 Entity를
직접 반환하지 않고 필요한 필드만 옮겨 담는다. `mvn compile`로 컴파일
확인했다.

### 프론트엔드 — 새 라우트 1개 + View 1개

- `types/record.ts` / `api/record.api.ts`: 기존 goal/dashboard/
  timeline과 동일한 패턴(도메인 타입 1개 + 얇은 fetch 함수 1개).
- `router/index.ts`에 `/record/:recordNum` → `RecordDetailView.vue`
  추가.
- `RecordDetailView.vue`: Loading/Not Found/Error/Success 4개 상태.
  기존 View들과 같은 `status` ref 패턴을 그대로 따랐고, 백엔드가
  "없음"과 "다른 회원 소유"를 구분하지 않고 동일하게 400을 주므로
  Axios 에러의 `response.status === 400`이면 `'not-found'`, 그 외(네트워크
  단절/500 등)는 `'error'`로 나눠서 문구를 다르게 보여준다 — 재시도가
  의미 있는 경우와 없는 경우를 사용자가 구분할 수 있게 하기 위함이다.
  화면 구성은 로드맵이 명시한 항목(제목/작성일/연결된 목표/본문/
  Image·YouTube/뒤로가기)만 그대로 넣었고, `GrowthRecord`에 있는
  `todayLearning`/`difficulty`/`solution`/`retrospective`는 이번 Day
  범위 밖이라 타입에는 있지만 화면에는 렌더링하지 않았다. 스타일은
  Landing의 표현적 톤을 쓰지 않고 Dashboard/Timeline과 같은 Calm
  Application Design(BaseCard/BaseBadge/BaseButton 재사용, 새 색
  토큰 없음)을 그대로 따랐다.
- `TimelineView.vue`: 이전부터 있었지만 실제 링크로 쓰이지 않던
  `TimelineItem.detailUrl`을 RECORD 타입 카드에서만
  `<RouterLink :to="item.detailUrl">`로 연결했다. 백엔드가 내려주는
  `detailUrl`이 이미 `/record/{recordNum}` 형식이라 프론트에서 URL을
  직접 조립하지 않고 그대로 썼다. GOAL 카드는 Vue에 목표 상세 화면이
  없으므로(이번 Day 범위 아님) 그대로 비클릭 상태로 뒀고, hover
  강조도 클릭 가능한 RECORD 카드에만 남도록 CSS를 나눴다.

### 검증

`npm run build` 통과. Playwright로 Loading(지연 응답)/Not
Found(400)/Error(500)/Success(목표 연결+이미지+YouTube 미디어 포함,
그리고 목표 없는 자유 기록) 4~5개 상태와, Timeline에서 기록 카드
클릭 시 실제로 `/record/101`로 이동하는 것까지 총 7장을
`docs/screenshots/day13/`에 저장했다. 이미지 렌더링은 실제 데이터
URI로 별도 확인해 정상 표시됨을 확인했다(아래 트러블슈팅 참고 —
YouTube iframe은 이 샌드박스 환경의 외부 네트워크 제한 때문에
스크린샷에서는 비어 보이지만, 레이아웃 높이는 정상적으로 예약되고
실제 배포 환경에서는 일반적인 iframe 임베드와 동일하게 로드된다).

---

## Day 14 (2026-09-16) — Deployment & Production QA

### 먼저 밝혀야 할 것 — 이 세션에서 실제로 할 수 있는 것과 없는 것

이 세션은 격리된 샌드박스 컨테이너에서 실행되고 있고, 실제 운영
도메인·운영 RDS·프론트엔드 정적 호스팅(S3/CloudFront/Vercel 등) 같은
배포 인프라가 이 저장소/환경에 존재하지 않는다(Dockerfile, nginx
설정, CI/CD 설정, 호스팅 설정 파일 모두 없음을 확인했다). 그래서
"실제로 배포된 환경에서" 세션 쿠키/CORS/CSRF/SPA 라우팅을 눈으로
확인하는 것은 이 세션에서는 불가능하다 — 이 사실을 숨기지 않고
그대로 밝힌다.

대신 실제로 할 수 있었던 것, 즉 **코드/설정 자체가 운영 환경 기준을
만족하는지**를 점검하고, 로컬에서 재현 가능한 범위(프로덕션
빌드 산출물 + Vite preview 정적 서버)에서 검증 가능한 부분은
실제로 검증했다.

### 1. (발견 및 수정) 운영 프로필이 아예 없었다 — `ddl-auto: update`가
   그대로 운영에 나갈 뻔한 상태

`application.yaml`을 다시 읽어보니 `spring.profiles.active`를 설정하는
곳이 코드 어디에도 없고, `application-prod.yaml` 같은 운영 전용 파일도
없었다 — 즉 로컬 개발용으로 튜닝된 단일 `application.yaml`
(`ddl-auto: update`, `show-sql: true`, `app.cors.allowed-origins`
기본값이 `http://localhost:5173`)이 프로필 구분 없이 그대로 운영에도
나가는 구조였다.

`docs/trouble_shooting/260730.md` 13번 항목에 "로컬과 운영 프로필을
분리했다"고 이미 적혀 있었지만, 실제 코드에는 그 분리가 존재하지
않았다 — 과거에 의도했던 것이 실제로 반영되지 못했거나 이후 커밋에서
사라진 것으로 보인다. Day 14가 "운영 설정 확인"이 목적이므로 새
디자인/기능이 아니라 **설정 결함 수정**으로 판단해 그 자리에서
고쳤다:

- `src/main/resources/application-prod.yaml` 추가.
  `ddl-auto: validate`(운영 DB 스키마를 애플리케이션이 자동으로
  바꾸지 않고, Entity와 실제 스키마가 다르면 조용히 넘어가는 대신
  즉시 기동 실패하게 함), `show-sql: false`(운영 로그에 SQL 원문이
  남지 않게 함), `app.cors.allowed-origins: ${CORS_ALLOWED_ORIGINS}`
  (fallback 기본값을 없애서, 운영에 이 값을 안 넣으면 `localhost`로
  조용히 열리는 대신 기동 자체가 실패하게 함)만 오버라이드했다.
  나머지(세션 쿠키 `SameSite=None`/`Secure`, CSRF 쿠키 설정 등)는
  Day 1에서 이미 HTTPS 운영 환경을 기준으로 설계되어 있어 프로필
  분리가 필요 없었다.
  `python3 -c "import yaml; yaml.safe_load(...)"`로 YAML 문법만
  로컬에서 확인했다 — 실제 운영 DB/도메인이 없어 이 프로필로 애플리
  케이션을 완전히 기동해보는 것까지는 이 세션에서 할 수 없었다.
- 배포 시 `SPRING_PROFILES_ACTIVE=prod` 환경변수로 이 프로필을
  활성화해야 한다는 것을 여기 문서와 README에 남긴다(Day 15).

### 2. 프론트엔드 — `.env.production` 템플릿 부재

`frontend/`에는 `.env.development`(`VITE_API_BASE_URL=http://localhost:8080`)만
있고 `.env.production`이 없었다. Vite는 `vite build`(=`npm run
build`) 실행 시 자동으로 `.env.production`을 읽어 빌드 시점에 값을
정적 자산에 박아 넣으므로, 이 파일이 없으면 운영 빌드를 만들 때마다
실제 배포 도메인을 직접 기억해서 다른 방법(쉘 환경변수 등)으로
주입해야 하는 번거로움과 실수 가능성이 있었다. 템플릿
`frontend/.env.production`을 추가했다(`VITE_API_BASE_URL=https://api.growlog.example.com`
placeholder) — 실제 배포 도메인이 정해지면 이 값만 바꾸고 다시
빌드하면 된다는 것을 주석으로 남겼다.

### 3. SPA 새로고침 시 404 여부 — 로컬에서 검증 가능한 범위까지 확인

`vue-router`가 `createWebHistory()`(해시가 아닌 진짜 경로)를 쓰고
있어서, 정적 파일을 서빙하는 쪽(향후 선택할 호스팅)이 "존재하지
않는 경로 요청은 index.html로 fallback"하도록 설정되어 있지 않으면
`/dashboard`를 새로고침했을 때 404가 난다. 이건 앱 코드가 아니라
호스팅 설정의 책임이라 이 저장소만으로는 완전히 검증할 수 없지만,
`npm run build` 산출물을 `vite preview`(정적 파일 서버 + SPA
fallback 내장)로 띄운 뒤 `/`, `/login`, `/dashboard`, `/timeline`,
`/goals`, `/record/123` 전부에 직접 GET을 보내서 전부 200을 받는 것을
확인했다.

```text
/            -> 200
/login       -> 200
/dashboard   -> 200
/timeline    -> 200
/goals       -> 200
/record/123  -> 200
```

`/timeline`에서 Playwright로 실제 브라우저 하드 리프레시까지
재현했을 때도 404 없이 `index.html`이 다시 로드되고, Router
Guard가 정상적으로 `/login?redirect=/timeline`으로 리다이렉트하는 것도
확인했다(`docs/screenshots/day14/01-spa-refresh-no-404.png`) — 즉
애플리케이션 자체(라우터 설정)는 운영 배포 기준을 만족한다.

**다만** 이건 Vite 자체 정적 서버의 fallback 동작이다. 실제 운영에서
쓸 호스팅(S3+CloudFront, Nginx, Vercel/Netlify 등)이 아직 정해지지
않았으므로, 그 호스팅에도 동일한 "unknown path → index.html" 규칙을
반드시 설정해야 한다는 걸 후속 작업으로 명시한다 — 예를 들어 Nginx라면
`try_files $uri /index.html;`, S3+CloudFront라면 403/404 커스텀
오류 응답을 `/index.html`로 매핑, Netlify라면 `_redirects`에
`/* /index.html 200`.

### 4. CORS / CSRF / 세션 쿠키 — 이미 Day 1에서 운영(HTTPS) 기준으로
   설계됨, 이번엔 설정값만 재확인

`SecurityConfig`의 CORS는 `app.cors.allowed-origins` 환경변수로
Origin을 주입받는 구조라 운영 도메인을 그 값에 넣기만 하면 된다(2번
항목에서 fallback을 없애 실수로 localhost로 열리는 걸 막음). CSRF는
`CookieCsrfTokenRepository` + 강제 resolve 필터로 이미 SPA에 맞게
구성되어 있다(Day 1). 세션 쿠키는 `SameSite=None`/`Secure=true`로
이미 HTTPS 운영 환경을 전제로 설정되어 있다(로컬 개발은 `localhost`가
"안전한 컨텍스트"로 취급되는 브라우저 동작 덕분에 우회 동작).
셋 다 이번 Day에서 코드를 바꿀 이유가 없었다 — 다만 실제 운영
도메인에 대해 로그인 → `/api/me` → Goal 생성/수정/삭제까지 전체
플로우가 실제로 통과하는지는 진짜 배포 환경에서만 확인할 수 있는
부분이라 이 세션에서는 검증하지 못했다는 걸 명시한다.

### 5. 이 세션에서 검증하지 못한 것 (있는 그대로)

- 실제 운영 도메인/HTTPS에서의 로그인 → 세션 유지 → 로그아웃 전체
  플로우
- 실제 운영 RDS에 대해 `ddl-auto: validate`가 기동 시점에 통과하는지
  (Entity와 실제 운영 스키마가 정말 일치하는지)
- 선택할 정적 호스팅의 실제 SPA fallback 설정
- 실제 기기(모바일 등)에서의 반응형 확인 — 이번 Day는 새 화면을
  만들지 않았고, 반응형은 이미 Day 11 이전 라운드들에서 확인이
  끝난 화면들을 재사용하므로 다시 캡처하지 않았다.

### 검증

`mvn compile`(prod 프로필 YAML 문법 확인 포함), `npm run build`
(정상 종료 확인), Vite preview 서버에 대한 6개 경로 curl 200 확인,
Playwright로 `/timeline` 하드 리프레시 스크린샷 1장을
`docs/screenshots/day14/`에 저장했다.

---

## Day 15 (2026-09-16) — Portfolio Case Study & Documentation

로드맵 15-1~15-7을 그대로 채웠다. 새 기능/디자인 작업은 없었고,
지금까지 실제로 한 일만 문서로 옮기는 게 목적이라 여기서 새로운
결정을 만들지 않았다(그래서 이 항목 자체는 짧다).

- **README.md**: 기존에 있던 Notion 기획서 링크는 그대로 보존하고,
  그 위에 한 줄 소개/프로젝트 배경/Renewal 목표/Tech Stack/
  Before-After/주요 화면 스크린샷/Architecture Decisions 요약/
  Troubleshooting 4건/UX·Design Decisions/Future Improvements를
  추가했다. 스크린샷은 Day 11/13/14에서 이미 찍어둔 것(Dashboard/
  Timeline/Goal List/Record Detail/로그인 화면)을 그대로 재사용하고,
  Landing만 이번에 새로 한 장 찍었다(`docs/screenshots/readme/landing.png`)
  — Landing은 Day 11~14 어디에서도 캡처 대상이 아니었어서 README를
  쓰는 지금 처음 필요해졌다.
- **docs/interview-prep.md**: 로드맵이 지정한 15개 질문 전부에 답을
  적었다. 실제로 하지 않은 것(예: 자동화 테스트, 처음부터 profile
  분리)은 "했다"고 쓰지 않고 15번(다시 만든다면 무엇을 바꿀지)
  질문에서 정직하게 남겼다.
- **Troubleshooting**: 로드맵이 예시로 준 4건(Login 403/로그인 후
  /api/me 401/Public Landing 오탐 리다이렉트/JSP→SPA 리뉴얼 포지션)
  중 앞의 3건은 실제 `docs/trouble_shooting/` 과거 기록에 있는
  내용을 README용으로 요약해 옮겼고, 4번째는 로드맵 예시("JSP → SPA
  Renewal") 대신 오늘 Day 14에서 실제로 발견하고 고친 운영 프로필
  누락 건으로 바꿔 넣었다 — 오늘 실제로 겪은 일이라 더 정직한
  4번째 사례라고 판단했다.

### 최종 범위 Freeze

로드맵 8번 항목대로, Badge/통계/AI 요약/Community/Record Create·Edit
Vue 전환/새 Dashboard Widget은 전부 README의 Future Improvements로만
남기고 이번 Portfolio Scope에서 구현하지 않는다.
