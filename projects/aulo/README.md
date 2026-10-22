# Aulo Cafe Service

Aulo는 사용자의 목적에 따라 좌석을 추천하고,
카페 좌석 예약과 음료 주문을 지원하는 AI 기반 카페 서비스입니다.

원본 저장소: [Binwoojin/aulo-reservation-app](https://github.com/Binwoojin/aulo-reservation-app) (브랜치 `claude/kind-galileo-f34efw`, 커밋 `9066e7e` 기준으로 옮김)

## 구성

- `java-basic/` — Java 기초 학습 콘솔 프로그램
- `webapp/` — 공간 추천·예약·음료 주문 데모 웹앱 소스 (React + Vite) → [실행 방법](./webapp/README.md)
- `publishing/` — 포트폴리오의 Live Demo. 원본의 GitHub Pages 배포 구조와 같습니다.
  - `publishing/` — 브랜드 랜딩페이지 (원본 `brand-landing/`, 작업 메모 `CLAUDE_HANDOFF.md`는 제외) — 헤더 '앱 체험'·맨 아래 '공간 이용 체험하기'가 `app/`으로 이동
  - `publishing/app/` — `webapp/`을 `npm run build`로 만든 정적 빌드

### 원본과 다른 점 · 원본에 함께 반영한 것

- (포트폴리오 데모 전용) 홈 '머무름에 곁들이는 한 잔'의 음료 목록을 데스크톱(마우스)에서 끌어서 넘길 수 있습니다 (`webapp/src/lib/useDragScroll.js`, `HomePage.jsx`, `app.css`). 터치 기기는 원본과 같은 스와이프입니다. 원본 저장소에는 넣지 않았습니다.
- 접근성 보정 (2026-10-22) — 원본 저장소에도 같은 내용을 반영함(커밋 `c58c144`): 보이는 글자와 다른 aria-label을 없애고 보이는 글자 + 숨김 안내로 이름을 만듦(웹앱 `HomePage.jsx` · `SeatOrderPage.jsx` · `ReservePage.jsx`, 랜딩 제목 · 바닥글 로고), 랜딩 브랜드 문장의 읽기 전 단어를 투명도 대신 대비 4.6:1 회색으로(`publishing/styles.css`), 대문자 DOCTYPE · `<meta />` 표기 정리(웹앱 `index.html`, 랜딩 `index.html`).

---

## 개발 기록

- [2026-05-27 학습 기록](./study-log/2026-05-27.md)
