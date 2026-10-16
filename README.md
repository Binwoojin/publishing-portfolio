# Publishing Portfolio

웹 퍼블리싱 작업물을 모아두는 포트폴리오 저장소입니다.
HTML · CSS · JavaScript 기반의 마크업, 반응형 레이아웃, 웹 접근성, 인터랙션 작업을 정리합니다.

## 폴더 구조

```
publishing-portfolio/
├── index.html              # 포트폴리오 메인 (Hero · Projects · About · Skills · Contact)
├── project.html            # 작업물 상세 (project.html?id=growlog)
├── assets/
│   ├── css/style.css       # 사이트 스타일 (라이트/다크 모드, 반응형)
│   ├── js/main.js          # 모바일 메뉴, 작업물 목록 렌더링 · 필터
│   └── images/             # 작업물 썸네일 이미지
├── data/
│   ├── projects.json       # ★ 작업물 목록
│   ├── site.json           # ★ 이름 · 연락처 · 소개 문구 · 기술 목록
│   └── cases/              # ★ 작업물 상세 내용 (growlog.json, waylog.json)
├── .pages.yml              # 관리 화면(Pages CMS) 설정
├── common/css/reset.css    # 공통 리셋 CSS
├── projects/
│   ├── _template/          # 새 작업물 시작용 템플릿 (복사해서 사용)
│   └── <project-name>/     # 개별 작업물 결과물
└── .github/workflows/pages.yml  # GitHub Pages 자동 배포
```

## 관리 화면 (Pages CMS)

작업물과 사이트 정보는 [Pages CMS](https://pagescms.org) 관리 화면에서 코드 없이 수정할 수 있습니다.

1. https://app.pagescms.org 에 접속해 **GitHub 계정으로 로그인**합니다.
2. 처음 한 번은 Pages CMS GitHub App 설치 화면이 나오면 이 저장소(`publishing-portfolio`)를 선택해 허용합니다.
3. 저장소 목록에서 `publishing-portfolio` 를 열고, GitHub Pages 에 연결한 브랜치를 선택합니다.
4. 왼쪽 메뉴에서 수정합니다.
   - **작업물**: 작업물 추가 · 수정 · 삭제 · 순서 변경, 썸네일 이미지 업로드 (권장 비율 16:10)
   - **사이트 정보**: 이름, 직무, 이메일, GitHub 주소, 소개 문구, 기술 목록
5. **Save** 를 누르면 저장소에 바로 반영되고, 1~2분 뒤 사이트에도 반영됩니다.

> 관리 화면 메뉴 구성은 `.pages.yml` 에서 바꿀 수 있습니다. 업로드한 이미지는 `assets/images/` 에 저장됩니다.

### 직접 수정할 때

관리 화면 없이 `data/projects.json`, `data/site.json` 을 직접 수정해도 됩니다. (JSON 형식을 지켜야 합니다)

```json
[
  {
    "title": "프로젝트 이름",
    "desc": "한 줄 설명",
    "category": "반응형",
    "tags": ["HTML", "CSS", "JavaScript"],
    "thumbnail": "assets/images/project-name.jpg",
    "period": "2026.09",
    "contribution": "1인 프로젝트 · Claude Code 보조 구현",
    "demo": "projects/project-name/",
    "caseStudy": "project-name"
  }
]
```

결과물 페이지는 `projects/_template` 폴더를 복사해 `projects/<project-name>` 으로 만들어 작업하고, `demo` 에 그 경로를 적으면 됩니다.

## 작업물 상세페이지

메인의 작업물 카드에서 **Case Study 보기**를 누르면 `project.html?id=<아이디>` 로 이동하고, `data/cases/<아이디>.json` 의 내용을 아래 9개 구성으로 보여줍니다. 내용이 비어 있는 구성은 자동으로 빠지고 번호가 다시 매겨집니다.

| 순서 | 구성 | 내용 |
| --- | --- | --- |
| 01 | Project Overview | 프로젝트 소개 · 요약 정보 |
| 02 | My Role | 담당 범위 — 직접 판단 · 확인한 일 / Claude Code가 보조한 일 |
| 03 | Before & After | 1차 버전 · 리디자인 화면 비교(영역 비교 · 슬라이더) + 유지한 점 / 개선한 점 |
| 04 | Design Process | 디자인 개선 과정 · 주요 색상 토큰 |
| 05 | Publishing | HTML · CSS · JS 구현 내용 |
| 06 | Responsive | PC · 태블릿 · 모바일 화면 |
| 07 | Accessibility | 접근성 개선 내용 |
| 08 | Troubleshooting | 구현 중 해결한 문제 (문제 / 해결) |
| 09 | Result | 결과 수치 · 회고 |

- 관리 화면(Pages CMS)의 **작업물 상세** 메뉴에서 수정할 수 있습니다. 작업물 목록의 **상세페이지 ID** 와 파일 이름이 같아야 카드에 버튼이 생깁니다.
- 상세 이미지는 `assets/images/cases/<아이디>/` 에 있습니다. Before & After 이미지는 **개선 전 · 후를 같은 크기로 캡처**해야 슬라이더에서 정확히 겹칩니다.

## 검증 (html-validate · axe-core · Lighthouse)

작업물 화면을 같은 조건으로 다시 검사하고, 결과를 `reports/<프로젝트>/` 에 보고서로 남깁니다.

```bash
cd tools/verify
npm install
npx playwright install chromium
npm run verify              # html-validate + axe-core (전 화면 × 데스크톱 · 모바일 × 라이트 · 다크)
npm run verify:lighthouse   # 위 검사 + Lighthouse (대표 화면, 모바일 · 데스크톱)
```

- 결과: `reports/<프로젝트>/report.json`(원본 데이터), `reports/<프로젝트>/index.html`(화면별 보고서)
- 보고서에는 측정일 · 도구 버전 · 브라우저 버전 · 검사 조건이 함께 기록됩니다.
- 상세페이지 09 Result 의 **측정 근거**는 이 보고서를 옮겨 적은 것입니다. 다시 측정하면 `data/cases/<프로젝트>.json` 의 `result.verification` 도 함께 고쳐 주세요.

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 `.github/workflows/pages.yml` 이 사이트를 자동 배포합니다.

1. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정합니다. (최초 1회)
2. `main` 브랜치에 push 하면 `https://binwoojin.github.io/publishing-portfolio/` 에 배포됩니다.

## 작업 원칙

- **시맨틱 마크업**: 의미에 맞는 HTML 요소 사용
- **반응형**: 모바일 · 태블릿 · 데스크톱 대응
- **웹 접근성**: KWCAG / WCAG 2.1 기준 준수 (대체 텍스트, 키보드 접근, 명도 대비 등)
- **크로스 브라우징**: 최신 Chrome · Edge · Safari · Firefox 확인

## 디자인 스킬 (UI UX Pro Max)

`.claude/skills/ui-ux-pro-max/` 에 [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT) 스킬이 설치되어 있어,
Claude Code로 UI 작업을 요청하면 스타일 · 컬러 · 폰트 · UX 가이드라인 데이터를 참고해 작업합니다.

현재 사이트 디자인은 이 스킬의 추천을 바탕으로 합니다.

- **레이아웃**: Portfolio Grid — Hero → Projects → About → Skills → Contact
- **스타일**: Minimalism & Swiss Style — 12단 그리드, 얇은 구분선, 큰 타이포그래피
- **컬러**: Monochrome + Blue accent (`#18181B` / `#FAFAFA` / `#2563EB`), 다크 모드 지원
- **폰트**: 페이퍼로지(Paperlogy) — `assets/fonts/` 에 포함 (400 · 500 · 600 · 700 · 800)
- **UX**: 클릭 영역 44px 이상, 키보드 포커스 표시, 모션 감소 설정 시 애니메이션 끔

## 로컬에서 보기

별도 빌드 과정은 없습니다. 데이터를 JSON 파일에서 불러오므로 `index.html` 을 더블클릭해 열면 내용이 보이지 않고, 아래처럼 로컬 서버를 띄워 확인해야 합니다.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```
