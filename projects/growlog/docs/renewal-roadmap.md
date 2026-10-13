# GrowLog 프론트엔드 리뉴얼 로드맵 v3

### 2~3주 집중 리뉴얼 / 프론트엔드 신입 취업 포트폴리오 최적화

> **Day 11 이후 계획은 [`renewal-roadmap-final.md`](./renewal-roadmap-final.md)로
> 대체되었다.** Day 1~10(이 문서의 Week 1 + Week 2 Day 8~10에 해당하는
> 인증/CORS/CSRF, Landing, Dashboard, Timeline, Goal List/Create/
> Update/Delete)은 완료된 상태를 전제로, 이후 작업은 반드시
> `renewal-roadmap-final.md`를 기준으로 진행한다. 이 문서(v3)는
> Day 1~10까지의 배경/전략 기록으로만 참고한다.

## 0. v3 개정 목적

v3는 기존 v2의 장점이었던 **UI/UX 강화, Dashboard + Timeline 중심의 시그니처 화면 전략, TypeScript 타입 설계, 컴포넌트 재사용, 상태관리 원칙**을 유지하면서, 다음 3가지 구조적 리스크를 수정한 실행용 로드맵이다.

1. Record 전체 CRUD를 Must로 올리면서 스코프가 다시 커진 문제
2. Login이 후반부에 있어 Dashboard/Timeline/Goal 개발 순서와 맞지 않았던 문제
3. 세션 쿠키 기반 인증 + CORS + CSRF 연동 리스크를 배포 직전까지 미뤘던 문제

> **가장 위험한 연동 문제를 먼저 제거하고, 가장 중요한 대표 화면을 먼저 완성하며, 중복되는 기능은 과감하게 줄인다.**

---

## 1. 이번 리뉴얼의 최종 목표

이번 GrowLog 리뉴얼의 목적은 단순히 JSP 화면을 Vue로 옮기는 것이 아니다.

> **기존 GrowLog의 백엔드 자산은 최대한 유지하면서, 프론트엔드 구조와 UI/UX를 다시 설계해 “프론트엔드 관점에서 문제를 분석하고 개선할 수 있는 개발자”라는 점을 보여주는 것**이 핵심 목표다.

성공 기준은 다음과 같다.

- 처음 진입했을 때 UI가 포트폴리오답게 보일 것
- 핵심 화면에서 Vue / TypeScript / 상태관리 / 컴포넌트 설계 역량이 드러날 것
- 주요 API 화면에서 Loading / Error / Empty / Success 상태가 설계될 것
- 각 기술적 선택을 왜 그렇게 했는지 설명할 수 있을 것
- 2~3주 안에 배포 가능한 완성본이 남을 것

---

## 2. 기존 GrowLog의 현재 위치

기존 자산:

- Spring Boot
- JSP / JSTL
- JPA
- MySQL
- 로그인 / 회원가입
- 이메일 인증
- 비밀번호 재설정
- Goal CRUD
- Growth Record CRUD
- Dashboard
- Timeline
- 마이페이지
- 출석
- S3 이미지 업로드

따라서 이번 리뉴얼에서는 **기존 기능을 전부 다시 구현하지 않는다.**

기존 프로젝트의 프론트엔드 관점 문제:

- 서버 렌더링 중심 구조
- JSP와 백엔드의 높은 결합도
- DOM 직접 조작 중심 JavaScript
- 컴포넌트 재사용 구조 부족
- 상태관리 경험을 보여주기 어려움
- TypeScript 기반 타입 설계 경험 없음
- 프론트엔드 포트폴리오로서 UI/UX 완성도가 약함

---

## 3. 리뉴얼 스토리

### Before

```text
Browser
  ↓
Spring MVC
  ↓
JSP
  ↓
HTML / CSS / Vanilla JS
```

### 문제 인식

```text
서버 렌더링 중심
↓
화면과 백엔드 결합도 높음
↓
컴포넌트 / 상태관리 / 타입 설계 경험을 보여주기 어려움
```

### After

```text
Vue 3 + TypeScript SPA
        ↓
      Axios
        ↓
Spring Boot REST API
        ↓
       JPA
        ↓
      MySQL
```

핵심 메시지:

> 기존 Spring Boot 비즈니스 로직과 데이터 모델은 유지하고, 프론트엔드를 SPA 구조로 분리하여 컴포넌트 재사용성, 상태 관리, 타입 안정성, UI/UX를 개선했다.

---

## 4. 목표 기술 스택

### 반드시 사용

| 영역 | 기술 | 목적 |
|---|---|---|
| Framework | Vue 3 | Composition API 기반 컴포넌트 설계 |
| Language | TypeScript | 타입 안정성과 데이터 모델링 |
| Build | Vite | 현대적인 개발 환경 |
| Router | Vue Router | SPA 라우팅 및 인증 가드 |
| State | Pinia | 필요한 공유 상태만 전역 관리 |
| HTTP | Axios | API 통신 및 공통 에러 처리 |

### 선택

- Tailwind CSS
- Vitest

### 우선순위 낮음

- VeeValidate

폼이 복잡하지 않다면 `useEmailVerification()`, `useNicknameCheck()` 같은 composable을 직접 구현한다.

---

## 5. 범위 정의 — Must / Should / Cut

### Must

#### 인증 / 연동

- Login
- Logout
- 현재 사용자 조회
- Router Guard
- CORS
- `withCredentials`
- 세션 쿠키
- CSRF 동작 확인

#### 대표 화면

- Dashboard
- Timeline
- Goal CRUD
- Timeline에서 Record 표시
- Record 상세 Read

#### UI/UX

- Loading
- Error
- Empty
- Success
- Skeleton
- Responsive
- 공통 Button / Card / Modal / Badge
- 최소 접근성 처리

#### 포트폴리오

- 배포
- README
- Before / After
- Architecture
- 기술적 의사결정 기록

### Should

- Record 작성
- 회원가입
- 닉네임 중복확인
- 이메일 인증
- Vitest
- S3 이미지 표시
- Toast 고도화

### Cut

- Record 수정 / 삭제 전체 구현
- 비밀번호 재설정
- 마이페이지 상세
- 출석 캘린더
- 뱃지
- 다크모드
- 복잡한 애니메이션
- 관리자 기능
- JWT 전환
- 백엔드 대규모 리팩토링
- 이미지 업로드 UX 고도화

---

## 6. 대표 화면 우선순위

### Must 1 — Dashboard + Timeline

GrowLog 리뉴얼의 대표 화면.

> **Personal Growth Dashboard**

예시:

```text
안녕하세요 👋
이번 달에도 꾸준히 성장하고 있어요.

[ 12 ] 이번 달 기록
[ 3 ] 진행 중 목표
[ 🔥 7일 ] 연속 기록
```

그 아래 Timeline:

```text
2026.09.14

🌱 목표
프론트엔드 포트폴리오 완성하기
████████░░ 80%

📖 성장 기록
Vue Composition API 학습
오늘 컴포넌트 구조를 정리했다.
```

이 화면에서 보여줄 것:

- 실제 로그인 사용자 데이터
- Timeline
- TypeScript Union Type
- 필터
- Loading
- Error
- Empty State
- Skeleton
- 반응형
- API 데이터 가공

### Must 2 — Goal 관리

권장 컴포넌트:

```text
GoalCard
GoalProgress
GoalStatusBadge
```

보여줄 역량:

- CRUD
- props 설계
- 컴포넌트 재사용
- API 상태 관리
- Form validation
- Progress UI
- Confirm Dialog
- 상태별 UI

### Must 3 — Record Read

Record는 도메인 존재 자체는 반드시 보여주되, CRUD 전체를 다시 만들지 않는다.

필수:

```text
Timeline에서 Record 표시
Record 상세 조회
```

선택:

```text
Record 작성
```

제외:

```text
Record 수정
Record 삭제
이미지 업로드 고도화
```

원칙:

> **Goal CRUD = Must / Record Read = Must / Record Create = Should / Record Update/Delete = Cut**

### Must 4 — Login

구현:

```text
Email
Password
Login
Logout
현재 사용자 조회
Router Guard
Loading
Error
```

회원가입은 Should로 둔다.

---

## 7. UI/UX 리뉴얼 전략

v3에서도 UI/UX는 핵심 축이다.

GrowLog의 디자인 방향:

> **Calm Productivity + Personal Growth Dashboard**

시각 원칙:

```text
넓은 여백
부드러운 카드
명확한 정보 계층
작은 아이콘
낮은 대비의 보조 텍스트
명확한 CTA
```

단순 CRUD 화면처럼 보이지 않도록 Dashboard, Goal, Record의 시각적 계층과 사용자 행동 흐름을 설계한다.

---

## 8. 작은 Design System

정의 대상:

```text
Typography
Color
Spacing
Button
Card
Input
Modal
Badge
```

Color 역할:

```text
Primary
Success
Warning
Error
Background
Surface
Border
Text Primary
Text Secondary
```

목표:

```text
화면별 CSS
→
공통 UI 규칙 + 재사용 가능한 UI
```

---

## 9. UX State 원칙

모든 주요 API 화면:

```text
Loading
Success
Empty
Error
```

### Empty State 예시

나쁜 예:

```text
데이터가 없습니다.
```

좋은 예:

```text
아직 이번 달 기록이 없어요.
오늘의 성장을 기록해보세요.

[ 기록 남기기 ]
```

### Goal 저장 UX

```text
입력
↓
저장 중
↓
성공 또는 실패
```

### 삭제 UX

```text
삭제 클릭
↓
ConfirmDialog
↓
삭제 요청
↓
성공 Toast / 실패 Error
```

---

## 10. 인증 / CORS / Session 연동 전략

이 부분은 v3에서 **가장 먼저 검증한다.**

개발 환경:

```text
Vue: http://localhost:5173
Spring Boot: http://localhost:8080
```

Origin이 다르므로 Day 1부터 아래를 확인한다.

```text
CORS
withCredentials
Session Cookie
CSRF
```

### Day 1 기술 검증 목표

```text
Vue
↓
Login Request
↓
Spring Security
↓
Session 생성
↓
Cookie 저장
↓
GET /api/me
↓
로그인 사용자 JSON 응답
```

Axios:

```ts
withCredentials: true
```

배포 단계에서는 처음 인증을 붙이는 것이 아니라, 실제 배포 도메인에서도 동일 구조가 동작하는지 최종 검증한다.

---

## 11. Pinia 사용 원칙

> **공유되어야 하는 상태만 Pinia로 관리한다.**

### Pinia

```text
로그인 사용자 정보
Goal 목록
Timeline 필터
여러 페이지에서 공유하는 서버 상태
```

### Local State

```text
Modal Open / Close
현재 Input 값
Hover
단일 화면 UI 상태
```

설명 포인트:

> 모든 상태를 전역 상태로 관리하지 않고, 여러 컴포넌트에서 공유할 필요가 있는 상태만 Pinia로 관리했다.

---

## 12. TypeScript 핵심 어필 포인트

```ts
type TimelineItem =
  | {
      type: "GOAL";
      id: number;
      title: string;
      progress: number;
    }
  | {
      type: "RECORD";
      id: number;
      title: string;
      mood: number;
    };
```

면접 설명:

> 서로 다른 Goal과 GrowthRecord 데이터를 하나의 Timeline에서 표현해야 했기 때문에 TypeScript Discriminated Union을 사용해 안전하게 타입을 분기하도록 설계했다.

---

## 13. 권장 폴더 구조

```text
src
├─ api
│  ├─ axios.ts
│  ├─ auth.api.ts
│  ├─ goal.api.ts
│  └─ record.api.ts
├─ components
│  ├─ common
│  │  ├─ BaseButton.vue
│  │  ├─ BaseModal.vue
│  │  ├─ EmptyState.vue
│  │  ├─ ConfirmDialog.vue
│  │  └─ LoadingSkeleton.vue
│  ├─ goal
│  │  ├─ GoalCard.vue
│  │  ├─ GoalProgress.vue
│  │  └─ GoalStatusBadge.vue
│  └─ timeline
│     ├─ TimelineItem.vue
│     └─ TimelineFilter.vue
├─ composables
├─ stores
├─ types
├─ views
├─ router
└─ main.ts
```

중요한 것은 폴더 수가 아니라 **왜 이렇게 나눴는지를 설명할 수 있는가**다.

---

## 14. 백엔드 수정 범위

백엔드는 리뉴얼 대상이 아니다.

SPA 연동에 필요한 최소 수정만 한다.

- CORS
- 기존 세션 기반 인증 유지
- `withCredentials`
- CSRF 확인
- 기존 Service / DTO 최대 재사용
- 필요한 JSON API만 얇게 노출

JWT 전환은 하지 않는다.

---

## 15. 결정 로그 전략

`docs/decisions.md`를 유지한다.

예:

```md
## Timeline 데이터 구조

Goal과 GrowthRecord를 하나의 Timeline에서 표시해야 했다.

각각 별도 배열로 관리하면 렌더링 분기가 복잡해져
TimelineItem Union Type으로 공통 구조를 설계했다.
```

목적:

> **README 작성 + 면접에서 “왜 이렇게 했나요?”에 답하기 위한 기록**

---

# 16. 3주 리뉴얼 로드맵

## Week 1 — 연동 리스크 제거 + 대표 UI

### Day 1 — 프로젝트 기반 + 인증 기술 검증

설정:

```text
Vue 3
Vite
TypeScript
Vue Router
Pinia
Axios
```

동시에 확인:

```text
CORS
withCredentials
Session Cookie
CSRF
```

성공 기준:

```text
Login → Session → Cookie 유지 → GET /api/me 성공
```

이 날은 UI보다 **연동 리스크 제거**가 우선이다.

### Day 2 — 인증 최소 흐름 완성

```text
Login
Logout
현재 사용자 조회
Router Guard
401 / 403 처리
```

### Day 3 — Design System + Dashboard UX 설계

```text
Color
Typography
Spacing
Button
Card
Input
Badge
Modal
```

Dashboard 와이어프레임:

```text
Greeting
Summary Cards
Quick Action
Recent Timeline
```

디자인 방향:

> Calm Productivity + Personal Growth Dashboard

### Day 4 — Dashboard 구현

실제 사용자 데이터 연결.

```text
Greeting
이번 달 기록 수
진행 중 Goal 수
연속 기록
Quick Action
Recent Timeline Preview
```

### Day 5 — Timeline + TypeScript 설계

```ts
type TimelineItem =
  | GoalTimelineItem
  | RecordTimelineItem;
```

Goal / Record → `normalizeTimeline()` → `TimelineItem[]`

### Day 6 — Timeline UX 완성

```text
Loading
Error
Empty
Success
Skeleton
Filter
```

필터:

```text
전체
목표
기록
```

### Day 7 — Responsive + Buffer

```text
Desktop
Tablet
Mobile
```

수정:

```text
Card Width
Grid
Spacing
Typography
Navigation
Overflow
```

---

## Week 2 — Goal 집중 + Record Read

### Day 8 — Goal List

```text
GoalCard
GoalProgress
GoalStatusBadge
```

### Day 9 — Goal 작성

```text
입력 오류
저장 중
저장 성공
저장 실패
```

### Day 10 — Goal 수정 / 삭제

```text
BaseModal
ConfirmDialog
```

### Day 11 — Goal UI/UX 고도화

점검:

```text
Progress 표현
Status Badge
Empty State
Loading
Error
Success Feedback
Mobile Layout
```

### Day 12 — State Management Review

질문:

> 이 State가 정말 전역이어야 하는가?

`authStore`, `goalStore`, `timelineStore` 구조 점검.

### Day 13 — Record 상세 Read

```text
Timeline Record 클릭
↓
Record 상세
```

표시:

```text
작성 날짜
내용
기분
연결 Goal
이미지
```

수정 / 삭제는 만들지 않는다.

### Day 14 — Quality Review

새 기능 추가 금지.

```text
UI 일관성
반응형
컴포넌트 중복
TypeScript any
console.log
API 구조
Error 처리
Loading 처리
Empty State
접근성
```

여기까지가 **필수 포트폴리오 완성선**이다.

---

## Week 3 — 선택 기능 + 품질 + 배포

### Day 15 — Record 작성 (Should)

시간이 가능하면 구현한다.

일정이 밀렸다면 제거한다.

### Day 16 — 회원가입 / 이메일 인증 (Should)

```text
Nickname Check
Email Verification
Validation
```

### Day 17 — 공통 UX + 접근성 정리

```text
Loading
Toast
Error
Empty State
Confirm Dialog
Focus
Keyboard
aria-label
Button State
```

### Day 18 — Test

Vitest.

추천:

```text
GoalProgress
TimelineFilter
```

### Day 19 — Deploy + 실제 도메인 연동 검증

Frontend:

```text
Vercel
```

최종 검증:

```text
Production CORS
Cookie
HTTPS
Session
CSRF
Environment Variable
API URL
```

주의:

> 이 날 처음 인증 구조를 붙이는 것이 아니라 Day 1에 검증한 구조가 실제 배포 도메인에서도 동작하는지 확인한다.

### Day 20 — README / Portfolio

README:

```text
1. 프로젝트 소개
2. 기존 GrowLog
3. 리뉴얼 배경
4. Before / After
5. Architecture
6. 핵심 화면
7. 기술 Stack
8. 기술적 의사결정
9. 문제 해결
10. UI/UX 개선
11. 상태관리 설계
12. TypeScript 설계
13. 개선 전 / 개선 후
14. 향후 개선
```

스크린샷 / GIF 추가.

### Day 21 — Interview Preparation

1분 설명 핵심:

> GrowLog는 처음에는 Spring Boot와 JSP 기반으로 개발했습니다.
> 프론트엔드 취업 준비 과정에서 서버 렌더링 중심 구조로는 컴포넌트 설계, 상태관리, 타입 설계 역량을 충분히 보여주기 어렵다고 판단했습니다.
> 그래서 기존 백엔드 도메인 로직은 유지하면서 Vue 3와 TypeScript 기반 SPA로 프론트엔드를 재구성했습니다.
> 초기 단계에서 세션 쿠키 기반 인증과 CORS를 먼저 검증해 기술적 리스크를 줄였고, Goal과 GrowthRecord를 하나의 Timeline에서 표현하기 위해 TypeScript Union Type을 활용했습니다.
> 또한 Loading / Empty / Error 상태와 반응형 UI를 함께 설계해 단순 기능 이전이 아니라 실제 사용자 경험을 개선하는 데 초점을 맞췄습니다.

---

## 17. 2주 압축 버전

### 제거

```text
Record 작성
회원가입
이메일 인증
S3 고도화
복잡한 테스트
추가 애니메이션
```

### 반드시 유지

```text
Day 1 인증/CORS 기술 검증
Login / Logout / 현재 사용자
Dashboard
Timeline
Goal CRUD
Record 상세 Read
Loading / Error / Empty / Success
Responsive
Deploy
README
```

---

## 18. Portfolio 핵심 어필 포인트

1. JSP → SPA 구조 전환
2. 인증 리스크 조기 해결
3. 기존 Backend 자산 재사용
4. Component Design
5. Pinia와 Local State 범위 구분
6. TypeScript Union Type
7. Loading / Error / Empty / Success
8. UI/UX Renewal
9. Responsive
10. Technical Decision Log

---

## 19. GrowLog와 WayLog의 역할 구분

### GrowLog

```text
Legacy / SSR → SPA Renewal
Vue 3
TypeScript
State Management
Component Design
Frontend Architecture
UI/UX Renewal
```

핵심:

> 기존 프로젝트를 분석하고 프론트엔드 관점에서 구조와 사용성을 개선한 경험

### WayLog

```text
React
Travel SNS
Feed UX
Map
Recommendation
Social Interaction
```

핵심:

> React 기반 신규 서비스를 처음부터 설계하고 개발한 경험

---

## 20. 이번 리뉴얼의 7가지 원칙

1. **가장 위험한 인증 / CORS 문제를 Day 1에 검증한다.**
2. **GrowLog 대표 화면은 Dashboard + Timeline이다.**
3. **Goal CRUD에서 CRUD 역량을 보여주고 Record는 Read 중심으로 축소한다.**
4. **기능 개수보다 UI 상태와 완성도를 챙긴다.**
5. **Vue를 사용했다는 사실보다 왜 그렇게 설계했는지가 중요하다.**
6. **Pinia는 필요한 상태에만 사용한다.**
7. **매일 기술적 의사결정을 기록한다.**

---

## Final Goal

이번 GrowLog 리뉴얼의 최종 결과는:

> “JSP 프로젝트를 Vue로 바꿨습니다.”

가 아니다.

최종적으로 보여줘야 하는 것은:

> **“기존 서비스의 구조적 문제를 분석하고, 프론트엔드 관점에서 인증 구조, UI/UX, 상태관리, 컴포넌트 구조, 타입 설계를 다시 설계했습니다.”**

라는 경험이다.

이 목표를 직접 강화하지 않는 기능은 이번 2~3주 리뉴얼 범위에서 과감히 제거한다.
