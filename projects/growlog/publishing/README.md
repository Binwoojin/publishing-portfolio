# GrowLog 리디자인 — 웹 퍼블리싱

> 목표와 하루의 기록을 쌓아 성장 과정을 돌아보는 개인 성장 아카이브 **GrowLog**를
> 새 디자인 시스템으로 리디자인하고, 9개 화면을 HTML · CSS · JavaScript로 퍼블리싱했습니다.

- **원본 프로젝트**: Spring Boot + JSP → Vue 3 SPA로 리뉴얼한 서비스 (`../` 폴더에 원본 소스와 개발 문서 보관)
- **이번 작업**: 원본의 화면 구성 · 데이터 구조 · 검증 규칙을 바탕으로 **디자인을 새로 잡고**, 서버 없이도 동작하는 **정적 퍼블리싱본**으로 다시 만들었습니다.
- **역할**: 디자인 · 퍼블리싱 100%

## 화면 구성

| 화면 | 파일 | 확인 포인트 |
|---|---|---|
| 랜딩 | `index.html` | 히어로 미리보기 카드, 기능 소개 4단, 성장 과정 스텝, 스크롤 등장 효과 |
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

## 디자인 시스템 — "Warm Journal"

크림색 노트 위에 기록이 쌓이는 느낌을 컨셉으로, 포인트 컬러는 두 가지만 씁니다.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--c-bg` | `#FBF7EF` | 크림색 배경 |
| `--c-amber` | `#F59E0B` | 주요 버튼 · 연속 기록 · 진행 중 (위 글자는 `#1C1917`, 대비 8.1:1) |
| `--c-amber-text` | `#A1490A` | 흰 배경 위 강조 글자 (대비 6.0:1) |
| `--c-green` | `#047857` | 성장 · 완료 |
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
- 필터 버튼은 `aria-pressed`, 현재 메뉴는 `aria-current="page"`, 진행률은 `role="progressbar"`
- 로딩 중 영역은 `aria-busy`, 상태 변화는 `aria-live` 영역으로 스크린리더에 알림
- 히트맵은 `role="img"` + 요약 문장으로 대체 텍스트 제공
- 아이콘은 SVG 스프라이트(`aria-hidden`), 아이콘만 있는 버튼에는 `aria-label`
- 클릭 영역 최소 44×44px, 키보드 포커스 링 표시, `prefers-reduced-motion` 설정 시 애니메이션 끔

**레이아웃 · 반응형**
- 모바일 우선 작성, 주요 분기 640 · 768 · 1024 · 1280px
- 서비스 화면 셸: 모바일은 **하단 탭바**, 1024px 이상은 **왼쪽 사이드바**로 같은 마크업을 CSS만으로 전환
- 375 · 390 · 768 · 1440px에서 가로 스크롤 없음 확인

**인터랙션 (Vanilla JS, 라이브러리 없음)**
- 더미 데이터(`js/data.js`)는 원본 API 응답 타입(`frontend/src/types/*.ts`)과 같은 필드 구성
- 회원가입 검증 정규식은 원본 `join.js`의 규칙을 그대로 사용
- 사용자 입력은 모두 이스케이프 후 출력 (XSS 방지)

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
