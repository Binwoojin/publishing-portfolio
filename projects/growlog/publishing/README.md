# GrowLog 리디자인 — 웹 퍼블리싱

> 목표와 하루의 기록을 쌓아 성장 과정을 돌아보는 개인 성장 아카이브 **GrowLog**를
> 새 디자인 시스템으로 리디자인하고, 9개 화면을 HTML · CSS · JavaScript로 퍼블리싱했습니다.

- **원본 프로젝트**: Spring Boot + JSP → Vue 3 SPA로 리뉴얼한 서비스 (`../` 폴더에 원본 소스와 개발 문서 보관)
- **이번 작업**: 원본의 화면 구성 · 데이터 구조 · 검증 규칙을 바탕으로 **디자인을 새로 잡고**, 서버 없이도 동작하는 **정적 퍼블리싱본**으로 다시 만들었습니다.
- **역할**: 디자인 · 퍼블리싱 100%

## 화면 구성

| 화면 | 파일 | 확인 포인트 |
|---|---|---|
| 랜딩 | `index.html` | **모션 히어로**(성장 곡선 · 히트맵 물결 · 카운트업 · 실시간 기록 · 마우스 깊이), 기능 소개 4단, 성장 과정 스텝, 스크롤 등장 효과 |
| 로그인 | `login.html` | 입력 검증, 비밀번호 보기 토글, 로그인 실패 알림 (데모 계정 `grower@growlog.kr` / `growlog123!`) |
| 회원가입 | `signup.html` | 이메일 인증(타이머) · 닉네임 중복 확인 · 비밀번호 규칙 실시간 표시 · 오류 요약 (데모 인증번호 `123456`) |
| 대시보드 | `dashboard.html` | 요약 카드 3종, 12주 활동 히트맵, 진행 중 목표, 최근 활동 |
| 타임라인 | `timeline.html` | 월 이동, 목표/기록 필터, 날짜별 묶음 + 고정 날짜 헤더 |
| 목표 목록 | `goals.html` | 상태 필터 · 정렬, 진행률 수정 다이얼로그(슬라이더), 삭제 확인 다이얼로그 |
| 목표 추가 | `goal-new.html` | 분류 선택 카드, 글자 수 카운터, 기간 검증 |
| 기록 작성 · 수정 | `record-new.html` (`?id=11` 수정 모드) | 목표 기록 / 자유 기록 전환, 이미지 끌어다 놓기 + 미리보기, YouTube 주소 검증 |
| 기록 상세 | `record.html?id=12` | 배운 점 · 해결 방법 · 회고 구분, 첨부 이미지, 이전 · 다음 기록 |

대시보드 · 타임라인 · 목표 · 기록 상세 화면 상단의 **화면 상태 미리보기** 도구로
`기본 / 로딩 / 빈 상태 / 오류` 화면을 바로 바꿔 볼 수 있습니다. (`?state=empty` 처럼 주소로도 가능)

## 디자인 시스템 — "Growth Archive"

노트 위에 기록이 쌓여 성장이 보이는 느낌을 컨셉으로, 색상은 **원본 GrowLog 디자인 토큰**(`../frontend/src/styles/tokens.css`)의 Muted Green + Warm Neutral 조합을 그대로 따랐습니다.

| 토큰 | 값 | 원본 근거 · 용도 |
|---|---|---|
| `--c-primary` | `#3F7D63` | 원본 Primary Green — 주요 버튼 · 연속 기록 · 활성 메뉴 (흰 글자 대비 4.9:1) |
| `--c-primary-text` | `#35694F` | 원본 Primary Hover — 밝은 면 위 초록 글자 (대비 6.0:1) |
| `--c-primary-soft` | `#DDEBE3` | 원본 Primary Background — 선택 · 안내 면 |
| `--c-accent` | `#C9D7A8` | 원본 Accent — 히트맵 · 어두운 면 위 강조 |
| `--c-bg` · `--c-line` | `#F7F8F5` · `#E5E9E1` | 원본 Warm Neutral 배경 · 테두리 |
| `--c-ink` · `--c-ink-3` | `#222824` · `#667068` | 원본 글자색. 보조 글자는 원본 `#727872`(4.2:1)를 4.5:1 이 되도록 조금 진하게 |
| `--c-deep` | `#142C22` | 원본 랜딩의 짙은 초록 — 반전 섹션 · 로그인 사진 영역 |
| `--c-success` / `--c-warning-text` | `#16A34A` / `#B45309` | 원본처럼 브랜드와 분리한 상태색 — 완료 / 진행 중 · D-day |
| 히트맵 | `#E6EAE2 → #C9D7A8 → #7BA788 → #35694F` | 원본의 성장 단계 표현(primary-bg → accent → primary → hover) |
| 폰트 | Pretendard Variable | 본문 16px · 행간 1.6, 제목 자간 -0.02em 이하 |

- 색 · 간격 · 모서리 · 그림자 · 모션을 모두 CSS 변수(`css/base.css`)로 정의하고, 화면 CSS에서는 변수만 사용
- 다크 모드는 같은 토큰 이름에 값만 바꿔서 지원 (`prefers-color-scheme: dark`)
- 모든 텍스트 색 조합은 라이트 · 다크 모두 명도 대비 4.5:1 이상으로 맞춤

## 퍼블리싱 포인트

**마크업 · 접근성**
- 랜드마크(`header` · `nav` · `main` · `aside`)와 제목 단계를 문서 구조에 맞게 구성, 본문 바로가기 제공
- 폼: 모든 입력에 `label` 연결, 오류 문구를 `aria-describedby`로 연결하고 `aria-invalid`로 상태 표시
- 제출 실패 시 **오류 요약**(`role="alert"`)으로 포커스를 옮기고, 요약의 각 항목을 누르면 해당 입력으로 이동
- 다이얼로그는 네이티브 `<dialog>` + `showModal()` — 바깥 영역 비활성화, ESC 닫기, 닫힌 뒤 원래 버튼으로 포커스 복귀
- 필터 버튼은 `aria-pressed`, 현재 메뉴는 `aria-current="page"`, 진행률은 네이티브 `<progress>` 요소(값 · 최댓값을 스크린리더가 그대로 읽음)
- 로딩 중 영역은 `aria-busy`, 상태 변화는 `aria-live` 영역으로 스크린리더에 알림
- 히트맵은 `role="img"` + 요약 문장으로 대체 텍스트 제공
- 아이콘은 SVG 스프라이트(`aria-hidden`), 아이콘만 있는 버튼에는 `aria-label`
- 클릭 영역 최소 44×44px, 키보드 포커스 링 표시, `prefers-reduced-motion` 설정 시 애니메이션 끔

**레이아웃 · 반응형**
- 모바일 우선 작성, 주요 분기 640 · 768 · 1024 · 1280px
- 서비스 화면 셸: 모바일은 **하단 탭바**, 1024px 이상은 **왼쪽 사이드바**로 같은 마크업을 CSS만으로 전환
- 320(WCAG 1.4.10 리플로우 기준) · 375 · 390 · 768 · 1440px에서 가로 스크롤 없음 확인
- 화면 CSS에 인라인 `style` 속성 없음 (JS 가 계산하는 슬라이더 채움 값만 CSS 변수로 전달)

**첫 화면 모션 — "기록이 쌓여 성장이 된다"**
- 제목이 한 줄씩 올라오고 `내일의 성장`에 형광펜이 그어짐, 새싹 아이콘이 자라남
- 배경에 성장 곡선이 왼쪽 아래 → 오른쪽 위로 그려지고(`stroke-dashoffset`), 빛이 곡선을 타고 반복해서 오름
- 미리보기 카드가 튀어오르듯 놓이고, 히트맵 84칸이 오래된 날부터 물결처럼 채워짐
- 통계 숫자 · 진행률이 0부터 올라가고, 이후 '오늘 배운 점'이 한 글자씩 새로 쓰이며 저장될 때마다 오늘 칸과 이번 달 기록 수가 올라감
- 넓은 화면 + 마우스에서는 마우스 위치와 스크롤에 따라 카드가 서로 다른 깊이로 움직임
- 등장(`opacity` · `scale` · `rotate`), 떠 있기(`transform`), 깊이(`translate`)를 서로 다른 속성으로 나눠 애니메이션끼리 덮어쓰지 않게 함 — 모두 합성 단계에서 처리되는 속성만 사용
- **움직임 멈추기 버튼**(`aria-pressed`, WCAG 2.2.2), 화면 밖 · 탭 숨김 시 반복 정지, `prefers-reduced-motion` 이면 완성된 화면을 바로 표시
- 장식 영역은 `aria-hidden`, 숫자 원래 값은 HTML 에 그대로 두어 JS 없이도 올바르게 보임

**인터랙션 (Vanilla JS, 라이브러리 없음)**
- 더미 데이터(`js/data.js`)는 원본 API 응답 타입(`frontend/src/types/*.ts`)과 같은 필드 구성
- 회원가입 검증 정규식은 원본 `join.js`의 규칙을 그대로 사용
- 사용자 입력은 모두 이스케이프 후 출력 (XSS 방지)

## 검증 결과

| 도구 | 결과 |
|---|---|
| html-validate (권장 규칙) | 오류 0 |
| axe-core (WCAG 2.1 · 2.2 AA + 모범 사례) | 위반 0 — 전 화면 × 데스크톱 · 모바일 × 라이트 · 다크, 다이얼로그 · 오류 · 빈 상태, 랜딩 모션 재생 중 포함 |
| Lighthouse (모바일 / 데스크톱) | 성능 94~97 / 100, 접근성 100, SEO 100, CLS 0 (랜딩은 모션 추가 후 모바일 94 · LCP 2.1초) |
| 키보드 | 모든 화면 첫 Tab 이 본문 바로가기, 포커스 링 표시, 숨은 요소로 포커스 이동 없음 |
| 링크 | 깨진 링크 · 이미지 0 |

Chromium 기준 결과이며, Safari · Firefox 와 실제 스크린리더(NVDA · VoiceOver)는 직접 확인이 필요합니다.

## 폴더 구조

```
publishing/
├── index.html · login.html · signup.html
├── dashboard.html · timeline.html · goals.html · goal-new.html
├── record-new.html · record.html
├── css/
│   ├── base.css        # 디자인 토큰 · 다크 모드 · 기본 스타일
│   ├── components.css  # 버튼 · 폼 · 배지 · 카드 · 상태 화면 · 다이얼로그 · 토스트
│   ├── layout.css      # 헤더 · 푸터 · 서비스 셸(사이드바 ↔ 하단 탭바)
│   ├── landing.css · auth.css · app.css   # 화면별 스타일
├── js/
│   ├── icons.js        # SVG 아이콘 스프라이트 (Lucide)
│   ├── data.js         # 데모 데이터
│   ├── common.js       # 공통 헬퍼 · 화면 상태 전환 · 토스트 · 다이얼로그
│   └── *.js            # 화면별 스크립트
└── images/
```

공통 리셋은 저장소의 `common/css/reset.css`를 사용합니다.

## 로컬에서 보기

저장소 루트에서 로컬 서버를 띄운 뒤 `/projects/growlog/publishing/`으로 접속합니다.

```bash
python3 -m http.server 8000
# http://localhost:8000/projects/growlog/publishing/
```

## 사용한 리소스

- 폰트: [Pretendard](https://github.com/orioncactus/pretendard) (SIL OFL 1.1)
- 아이콘: [Lucide](https://lucide.dev) (ISC)
