# GrowLog 리뉴얼 최종 로드맵 (Day 11~15)

> 이 문서는 `renewal-roadmap.md`(v3)의 Day 11 이후 계획을 대체하는
> **최종 기준 문서**다. Day 1~10(인증/CORS/CSRF 기반, Landing,
> Dashboard, Timeline, Goal List/Create/Update/Delete)은 이미 완료된
> 상태를 전제로 하며, 이후 작업은 이 문서를 우선한다.

## 0. 이 개정의 배경

현재 진행 상황:

- Day 10까지 핵심 기능 작업 완료
- Landing 및 전반적인 Visual Design / Responsive / Motion /
  Typography / Section Storytelling 작업도 대부분 마무리 단계

따라서 기존 v3의 Day 11~14 계획을 그대로 수행하지 않고, 실제 진행
상태에 맞춰 로드맵을 재정리한다. 앞으로는 기능 범위를 무작정
확장하지 않고 다음 순서로 마무리한다.

```text
서비스 완성도
  ↓
코드 구조 정리
  ↓
최소 Record Read
  ↓
Production QA
  ↓
Portfolio Case Study
```

---

## 1. 현재 GrowLog Renewal 상태

### Frontend Architecture

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Axios

### Auth / Security

- Spring Security Session 기반 인증 유지
- `/api/me`
- Session Cookie
- CSRF
- CORS
- Axios `withCredentials`
- Axios XSRF
- Pinia Auth Store
- Router Guard
- Axios 401 Interceptor
- Login / Logout / Session Restore

> JWT로 전환하지 않는다. 현재 Session 기반 인증 구조가 Renewal의
> 기준이다.

### 주요 화면

- Landing
- Dashboard
- Timeline
- Goal List
- Goal Create
- Goal Update
- Goal Delete

### Landing / Visual Design

다음 작업까지 대부분 완료된 상태다.

- Product Story 구조
- Hero Product Preview
- Why GrowLog Storytelling
- Feature Product Story
- Vertical Growth Journey
- Final CTA
- Responsive
- IntersectionObserver Motion
- prefers-reduced-motion
- Landing 전용 Color Rhythm
- Section Separation
- Typography QA
- Horizontal Overflow QA

> Landing 구조를 앞으로 다시 크게 변경하지 않는다.

---

## 2. GrowLog Renewal의 최종 프로젝트 포지션

GrowLog는 **모든 JSP 기능을 Vue로 완전히 재구현하는 프로젝트가
아니다.**

최종 포지션:

> 기존 Spring Boot + JSP 기반 프로젝트의 Backend / Service 구조는
> 최대한 재사용하면서, 핵심 사용자 흐름을 Vue 3 + TypeScript SPA로
> 현대화한 Frontend Renewal 프로젝트

따라서 이후 새로운 기능을 계속 추가하는 방식으로 범위를 확장하지
않는다.

---

## 3. Day 11 — UI/UX State Completion

목표:

> 현재 구현된 화면이 정상 상태뿐 아니라 실제 서비스에서 발생할 수
> 있는 다양한 상태까지 안정적으로 표현되도록 마감한다.

새로운 디자인 작업을 하는 날이 아니다.

### 11-1. Dashboard

확인 대상:

- Loading
- API Error
- Empty recent activity
- Goal count 0
- Record count 0
- Streak 0
- 정상 데이터

필요한 경우 Skeleton 또는 Loading UI를 사용한다. 단 모든 카드에
skeleton을 과하게 사용하지 않는다.

### 11-2. Timeline

확인 대상:

- Loading
- Empty Timeline
- Error
- Goal item
- Record item
- 긴 제목
- 긴 본문
- 날짜 표시
- Mobile

Empty State가 단순 공백으로 끝나지 않도록 한다.

### 11-3. Goal List

확인 대상:

- Goal 없음
- Goal 1개
- Goal 여러 개
- Loading
- API Error
- 긴 제목
- 긴 기간
- Progress 0%
- Progress 100%
- 완료 Goal
- 중단 Goal
- Mobile

### 11-4. Goal Create / Update

확인 대상:

- 필수값 validation
- 빈 제목
- 너무 긴 제목
- 잘못된 기간
- progress 값
- submit loading
- submit error
- 중복 클릭 방지
- 성공 후 이동
- Mobile form

버튼은 요청 중 disabled 상태가 필요하면 적용한다.

### 11-5. Delete UX

Goal 삭제 시 다음 흐름을 확인한다.

- Confirm
- Cancel
- Delete loading
- Delete failure
- Delete success

단 Toast Library 등을 새로 무겁게 도입하지 않는다. 현재 구조에서
필요한 최소 feedback을 구현한다.

### 11-6. Day 11 완료 조건

아래 상태가 모두 자연스럽게 보여야 한다.

```text
Loading / Empty / Error / Success / Validation
```

Day 11에서는 새로운 Landing Design이나 신규 기능을 추가하지 않는다.

---

## 4. Day 12 — Frontend Architecture & State Review

목표:

> 현재 기능은 유지하면서 Frontend 코드 구조를 포트폴리오에서 설명
> 가능한 상태로 정리한다.

큰 Refactoring이 목적이 아니다.

### 12-1. Pinia Review

확인:

- Auth 외에 Global Store가 꼭 필요한지
- Page Local State를 불필요하게 Store로 올리고 있지 않은지
- Global / Local State 기준이 명확한지

기준: **공유 상태 → Pinia 검토 / 한 화면에서만 사용 → Component
/ View Local State 우선**

### 12-2. API Layer

확인:

- Axios 호출 중복
- API endpoint 관리
- Error handling 중복
- response typing
- credential 설정
- 401 interceptor

API 호출이 View마다 제각각 작성되어 있다면 최소한의 정리는
허용한다. 다만 새로운 대규모 API abstraction layer를 만들지 않는다.

### 12-3. TypeScript

확인:

- `any`
- 중복 interface
- API Response Type
- Goal Type
- Timeline Type
- User Type
- nullable 처리
- props typing
- emits typing

Type을 지나치게 복잡한 generic 구조로 만들지 않는다. 포트폴리오
프로젝트에 적절한 수준으로 명확하게 유지한다.

### 12-4. Component Review

확인:

- 지나치게 큰 View
- 불필요한 component 분리
- 중복 UI
- BaseButton / BaseCard / Badge 등 기존 공통 컴포넌트 재사용
- props / emits 책임

원칙: **재사용되지 않는 작은 UI까지 전부 component화하지 않는다.**

### 12-5. Composable

현재 존재하는 composable(viewport reveal, auth 관련, 반복 async
pattern 등)의 책임을 확인한다. 단 새로운 generic utility framework를
만들지 않는다.

### 12-6. Error Handling

책임을 구분한다.

| 문제 유형 | 예시 | 처리 위치 |
|---|---|---|
| API 공통 문제 | 401 session expiration | interceptor |
| Page-specific Error | Goal list load failure | 해당 View |
| Form Error | — | 해당 Form |

이 책임 분리가 코드에서 드러나는지 확인한다.

### 12-7. Router / Auth 구조 재확인

아래 구조는 유지한다.

- **Router Guard** = Navigation Access Control
- **Axios 401 Interceptor** = API 요청 도중 Session Expiry 처리

둘의 역할을 합치지 않는다.

### Day 12 완료 후

다음을 짧게 정리해 `docs/decisions.md` 또는 기존 문서에 기록한다.

- Global vs Local State 결정
- 주요 Type 구조
- API Layer 구조
- Error Handling 책임
- Component 분리 기준

---

## 5. Day 13 — Record Detail Read

목표:

> Timeline에서 Record를 확인하고 상세 내용을 읽을 수 있는 최소 Read
> Flow를 완성한다.

Record 전체 CRUD를 Vue로 재구현하지 않는다.

### 최소 사용자 Flow

```text
Timeline
  ↓
Record Item Click
  ↓
/record/:id
  ↓
Record Detail
```

### Record Detail 포함 정보

기존 Backend에서 실제 제공 가능한 범위 기준:

- Record Title
- 작성일
- 연결된 Goal
- 본문
- Image
- YouTube Link / Media
- 뒤로가기

실제 데이터가 없는 필드를 임의로 만들어내지 않는다.

### API

가능하면 기존 Record Service / Entity / DTO / Repository를
재사용한다. REST Controller는 thin하게 유지한다.

```text
Vue RecordDetail
        ↓
GET /api/records/{id}
        ↓
REST Controller
        ↓
기존 Record Service
```

Backend 전체 구조를 다시 설계하지 않는다.

### 상태

Record Detail에서도 Loading / Not Found / Error / 정상 상태를
구현한다.

### 디자인

현재 GrowLog Application Design System과 동일하게 한다. Landing처럼
화려한 Storytelling Design을 적용하지 않는다. Application UI 기준:
**Calm / Focus / Information**을 유지한다.

### 이번 Day에서 하지 않을 것

- Record Create Vue 전환
- Record Edit Vue 전환
- 새로운 Media 기능
- 새로운 Comment
- 새로운 Badge

필요하면 기존 JSP Record Create/Edit는 Legacy 기능으로 남겨도 된다.

---

## 6. Day 14 — Deployment & Production QA

목표:

> 로컬 개발 프로젝트를 실제 접속 가능한 Portfolio Product로 마감한다.

### 14-1. Vue Production Build

- `npm run build`
- TypeScript error
- Vite build
- asset path
- environment variable
- production API baseURL

### 14-2. Spring Production

- production profile
- DB
- RDS
- S3
- mail configuration
- secret management
- environment variable

Secret을 Git Repository에 commit하지 않는다.

### 14-3. Session / Cookie

배포 환경에서 반드시 테스트한다.

```text
Vue
  ↓
Spring
  ↓
JSESSIONID
  ↓
Cookie
  ↓
SameSite
  ↓
Secure
```

Localhost에서 되는 것만으로 완료 처리하지 않는다.

### 14-4. CORS

Production Frontend Origin 기준으로 정확히 제한한다. 필요 없는
wildcard를 사용하지 않는다. Credentialed request 기준을 유지한다.

### 14-5. CSRF

배포 환경에서도 CSRF Cookie / Request Header / Axios XSRF / POST
/ PUT / DELETE 정상 동작을 확인한다. 보안을 위해 CSRF를 끄는 방식으로
해결하지 않는다.

### 14-6. SPA Routing

Production에서 직접 URL 접근 테스트: `/`, `/login`, `/dashboard`,
`/timeline`, `/goals`, `/record/:id`. 브라우저 Refresh 시 404가
발생하지 않는지 확인한다.

### 14-7. Authentication Flow

실제 배포에서 전체를 검증한다.

```text
1. Landing
2. Login
3. /api/me
4. Dashboard
5. Browser Refresh
6. Session Restore
7. Logout
8. Protected route 접근
9. Session expiration
```

### 14-8. Responsive

실기기 또는 Browser Emulator로 Desktop / Tablet / Mobile을
확인한다. 특히 horizontal overflow / modal / form / timeline / goal
/ record / navigation을 검증한다.

---

## 7. Day 15 — Portfolio Case Study & Documentation

기능 구현이 아니라 GrowLog를 취업용 Portfolio Project로 만드는
단계다.

### 15-1. README 구조

- **GrowLog** — 한 줄 설명: *목표와 일상의 기록을 쌓아 자신의 성장
  과정을 발견하는 개인 성장 아카이브*
- Project Background — 기존 Spring Boot + JSP 프로젝트의 Frontend
  구조를 Vue SPA로 Renewal하게 된 이유
- Renewal Goal — Frontend/Backend 관심사 분리, SPA Interaction,
  Type Safety, Client State Management, UX 개선, Responsive,
  Production-ready frontend
- Tech Stack
  - Frontend: Vue 3, TypeScript, Vite, Vue Router, Pinia, Axios
  - Backend: Spring Boot, Spring Security, JPA, MySQL, AWS

### 15-2. Before / After

```text
Before                        After
Spring MVC                    Vue SPA
  ↓                             ↓
Controller                    Axios
  ↓                             ↓
JSP                           REST API
                                 ↓
                               Existing Service
                                 ↓
                               JPA
```

핵심 메시지: **Backend Rewrite가 아니라 Existing Service Layer를
유지하면서 Frontend Layer를 현대화.**

### 15-3. 주요 화면

Landing / Dashboard / Timeline / Goals / Record Detail. 스크린샷은
최종 UI 완료 후 별도로 준비한다.

### 15-4. Architecture Decisions

- **왜 Vue?** 기존 JSP 화면과 분리된 SPA Renewal 경험
- **왜 TypeScript?** API / UI Data Contract 명확화
- **왜 Pinia?** 공유 Auth State
- **왜 Session 유지?** 기존 Spring Security 인증 구조 재사용
- **왜 JWT 전환 안 했나?** Renewal 목적이 인증 Backend Rewrite가
  아니기 때문

### 15-5. Troubleshooting (최소 4건)

1. **Login POST 403**
   - Problem: Browser login request가 403
   - Cause: Cross-origin XSRF 처리
   - Solution: Axios XSRF configuration
   - Learning: CSRF Token이 존재하는 것과 Request에 전달되는 것은
     다른 문제
2. **Login 성공 후 `/api/me` 401**
   - Problem: Authentication 성공했지만 Current User API는
     unauthenticated
   - Cause: Session Cookie / SameSite 정책
   - Solution: Credential / Cookie policy 조정
3. **Public Landing에서 `/api/me` 401 Redirect**
   - Problem: Landing Page인데 Login으로 이동
   - Cause: Axios 401 Interceptor가 모든 401을 동일 처리
   - Solution: Public Route / Redirect context에 맞게 처리
4. **JSP → SPA Renewal**
   - Problem: 이미 완성된 Backend를 SPA 때문에 다시 만들 위험
   - Solution: Existing Service → Thin REST Controller → Vue 구조
   - Learning: Frontend Renewal을 Backend Rewrite와 분리

### 15-6. UX / Design Decisions

Calm Productivity, Growth Archive, Landing은 Expressive / Application은
Calm, Primary Green, Visual Language, Responsive, reduced-motion,
Product Story Landing. 디자인 설명은 장황하지 않게 핵심 의도 위주로
작성한다.

### 15-7. Interview Preparation

최종적으로 아래 질문에 답할 수 있도록 정리한다.

1. 왜 JSP 프로젝트를 Vue로 리뉴얼했나요?
2. 왜 React가 아니라 Vue를 사용했나요?
3. Session 방식은 SPA에서 어떻게 유지했나요?
4. JWT를 쓰지 않은 이유는?
5. CORS란?
6. CSRF란?
7. SameSite란?
8. Router Guard와 Interceptor 차이는?
9. Pinia에는 어떤 State를 넣었나요?
10. Backend를 왜 다시 만들지 않았나요?
11. 가장 어려웠던 오류는?
12. UI/UX에서 가장 많이 개선한 부분은?
13. responsive는 어떻게 설계했나요?
14. accessibility에서 고려한 부분은?
15. 이 프로젝트를 다시 만든다면 무엇을 바꾸겠나요?

---

## 8. 최종 GrowLog 범위 Freeze

Day 15 완료 후에는 GrowLog에 새로운 기능을 계속 추가하지 않는다.

향후 아이디어(Badge, Statistics, AI, Community, 추가 Record CRUD,
새로운 Dashboard Widget 등)는 현재 Portfolio Scope에서는 구현하지
않는다. 필요하면 README의 Future Improvements에만 작성한다.

---

## 9. GrowLog가 Portfolio에서 보여줄 핵심

최종적으로 GrowLog가 보여줘야 하는 것은 기능 개수가 아니다. 다음
역량이다.

1. **Legacy Modernization** — JSP → Vue SPA
2. **Frontend Architecture** — Vue / Router / Pinia / Axios /
   TypeScript
3. **Security Integration** — Session / Cookie / CORS / CSRF
4. **Backend Reuse** — Existing Spring Service 재사용
5. **UI/UX** — Design System / Responsive / Async State /
   Accessibility
6. **Troubleshooting** — 실제 Browser 환경 문제 해결 경험
7. **Production** — Build / Deployment / Production Auth

---

## 10. 작업 방식

앞으로 Day 단위로 작업한다. 한 번에 Day 11~15를 전부 구현하지
않는다.

`Day 11 진행하자`처럼 특정 Day가 요청되면, 먼저 현재 코드를 확인한
뒤 해당 Day 범위만 수행한다. 각 Day 시작 시:

1. 현재 코드 상태 확인
2. 해당 Day에서 실제로 필요한 작업 목록 작성
3. 불필요한 작업 제거
4. 바로 구현
5. 테스트
6. 완료 결과 보고

순서로 진행한다.

---

이 로드맵은 이후 GrowLog Renewal의 최종 기준 문서다. `renewal-
roadmap.md`(v3)의 Day 11 이후 계획보다 이 문서를 우선한다.
