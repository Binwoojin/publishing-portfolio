# Publishing Portfolio

웹 퍼블리싱 작업물을 모아두는 포트폴리오 저장소입니다.
HTML · CSS · JavaScript 기반의 마크업, 반응형 레이아웃, 웹 접근성, 인터랙션 작업을 정리합니다.

## 폴더 구조

```
publishing-portfolio/
├── index.html              # 포트폴리오 메인 (Hero · Projects · About · Skills · Contact)
├── project.html            # 작업물 상세 틀 (work/<아이디>/ 페이지를 만드는 바탕, 예전 주소 ?id= 는 work/ 로 이동)
├── work/<아이디>/index.html # 작업물마다 만든 상세 페이지 (tools/seo/build.mjs 가 만듦)
├── 404.html                # 없는 주소 안내
├── sitemap.xml · robots.txt # 검색 엔진용 (tools/seo/build.mjs 가 만듦)
├── assets/
│   ├── css/style.css       # 사이트 스타일 (라이트/다크 모드, 반응형)
│   ├── js/main.js          # 모바일 메뉴, 작업물 목록 렌더링 · 필터
│   └── images/             # 작업물 썸네일 이미지
├── data/
│   ├── projects.json       # ★ 작업물 목록
│   ├── site.json           # ★ 이름 · 연락처 · 소개 문구 · 기술 목록
│   └── cases/              # ★ 작업물 상세 내용 (growlog.json, waylog.json, aulo.json)
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
> **주의**: Pages CMS는 `.pages.yml` 에 정의되지 않은 항목을 저장할 때 지웁니다. `data/` JSON에 새 항목을 넣을 때는 같은 이름의 필드를 `.pages.yml` 에도 함께 추가하세요.

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

메인의 작업물 카드에서 **Case Study 보기**를 누르면 `work/<아이디>/` 로 이동하고, `data/cases/<아이디>.json` 의 내용을 아래 9개 구성으로 보여줍니다. 내용이 비어 있는 구성은 자동으로 빠지고 번호가 다시 매겨집니다.

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

### UX 프로세스 구성 (`"layout": "ux"`)

케이스 데이터에 `"layout": "ux"` 를 넣으면 UX 프로세스 순서로 보여줍니다 (지금은 Aulo만 사용).

| 순서 | 구성 | 데이터 | 내용 |
| --- | --- | --- | --- |
| 01 | Overview | `overview` | 프로젝트 소개 · 요약 정보 |
| 02 | My Role | `role` | 담당 범위 |
| 03 | Problem | `problem` | 문제와 근거, 해결 기준 |
| 04 | Users & Scenarios | `users` | 사용자 유형 · 이용 상황, 사용자 상태 |
| 05 | IA & User Flow | `flow` | 정보 구조, 주요 사용자 흐름 |
| 06 | Design Decisions | `process` | 대표 결정 (문제 → 선택 이유 → 구현 → 확인 결과) · 디자인 과정 |
| 07 | Before & After | `beforeAfter` | 기본 구성과 같음 |
| 08 | Design System | `designSystem` | 색 · 글꼴 · 공통 컴포넌트 · 간격 · 모션 기준 |
| 09 | Outcome | `result` | 결과 수치 · 한계 · 회고 (측정 근거는 10에서) |
| 10 | Build & QA | `publishing` · `responsive` · `accessibility` · `troubleshooting` · `result.verification` | 구현 · 검증 요약 |

- 관리 화면(Pages CMS)의 **작업물 상세** 메뉴에서 수정할 수 있습니다. 작업물 목록의 **상세페이지 ID** 와 파일 이름이 같아야 카드에 버튼이 생깁니다.
- 상세페이지의 **작업 기간 · 기여도**를 비워 두면 작업물 목록(카드)의 값이 그대로 보입니다. 두 값은 작업물 목록 한 곳에서만 고치면 됩니다.
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
- Aulo처럼 해시 라우터 웹앱은 `verify.mjs` 의 `PROJECTS.aulo.app.routes` 에 화면 주소를 적어 두면 주소마다 검사하고, 로그인이 필요한 화면은 데모 계정으로 로그인한 뒤 검사합니다.
- 상세페이지 09 Result 의 **측정 근거**는 이 보고서를 옮겨 적은 것입니다. 다시 측정하면 `data/cases/<프로젝트>.json` 의 `result.verification` 도 함께 고쳐 주세요.

## 배포 (GitHub Pages)

`main` 브랜치에 push 하면 `.github/workflows/pages.yml` 이 사이트를 자동 배포합니다.

1. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 설정합니다. (최초 1회)
2. `main` 브랜치에 push 하면 `https://binwoojin.github.io/publishing-portfolio/` 에 배포됩니다.
3. 배포할 때 `tools/seo/build.mjs` 로 작업물 상세 페이지(`work/`)와 `sitemap.xml` 을 다시 만들고, 사이트가 쓰지 않는 템플릿 · 원본 소스 폴더(`projects/<작업물>/publishing` 외)와 `tools/` 는 올리지 않습니다.

## 글꼴 경량화

- Paperlogy 원본(굵기별 약 157KB)에서 사이트에 실제로 쓰인 글자만 담은 작은 글꼴(`assets/fonts/subset/*-site.woff2`, 굵기별 약 41KB)을 `tools/fonts/subset.py` 로 만듭니다 (`pip install fonttools brotli`).
- `assets/css/style.css` 의 글꼴 블록은 이 스크립트가 다시 씁니다. 원본을 먼저, 작은 글꼴(unicode-range)을 나중에 선언해 평소에는 작은 글꼴만 내려받고, 없는 글자가 나올 때만 원본을 내려받아 같은 글꼴로 보여 줍니다.
- 배포 때마다 다시 만들므로 관리 화면에서 새로 쓴 글자도 반영됩니다. 로컬에서 문구를 많이 바꿨다면 직접 실행해 주세요.

## 검색 엔진 · 공유 미리보기 (SEO)

- **작업물 상세**: 작업물마다 `work/<아이디>/` 페이지가 있어 제목 · 설명 · 대표 주소(canonical) · 공유 미리보기(Open Graph · Twitter, 대표 이미지는 작업물 썸네일) · 구조화 데이터(CreativeWork · BreadcrumbList)를 따로 가집니다. JS 없이 열어도 제목과 요약이 보입니다.
- **메인**: 대표 주소, 공유 미리보기(`assets/images/og-image.jpg`, 1200×630), 구조화 데이터(Person · WebSite)를 넣었습니다.
- **이름**: 사이트 이름(로고 · 탭 제목 · 저작권)은 `site.json` 의 `name`, 소개 · Name 칸 · 구조화 데이터는 본명 `realName` 을 씁니다.
- **다시 만들기**: 작업물 데이터를 직접 고쳤다면 `node tools/seo/build.mjs` 를 실행하세요. 배포 때도 자동으로 다시 만듭니다.
- **검색에서 빼는 페이지**: 예전 주소용 `project.html`, `404.html`, 검증 보고서(`reports/`)는 `noindex` 입니다.
- **검색 엔진 등록 스위치**: `data/site.json` 의 `searchIndexing`(관리 화면 사이트 정보 → '검색 엔진 등록')이 꺼져 있으면(지금 상태), 배포할 때 `tools/seo/indexing.mjs` 가 모든 페이지에 `noindex, nofollow` 를 넣고 `robots.txt` 를 막아 검색에 나오지 않습니다. 링크로 제출 · 공유하는 것과 공유 미리보기는 그대로 됩니다. 저장소 파일에는 noindex 를 넣지 않으므로, 켜기만 하면 다음 배포부터 등록될 수 있습니다.
- **Search Console** (검색 등록을 켠 뒤): `robots.txt` 는 도메인 맨 위(`https://binwoojin.github.io/robots.txt`)에 있어야 검색 엔진이 읽습니다. 이 사이트는 `/publishing-portfolio/` 아래라 그 파일은 참고용이고, [Google Search Console](https://search.google.com/search-console) · [네이버 서치어드바이저](https://searchadvisor.naver.com)에 사이트를 등록한 뒤 `https://binwoojin.github.io/publishing-portfolio/sitemap.xml` 을 직접 제출해야 합니다.

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
- **Skills**: 기술 이름을 큰 글자로 쌓고, 스크롤 · 마우스로 지금 항목을 파랗게 채웁니다. 데스크톱에서는 옆 고정 패널에 영역 · 설명 · '쓴 작업물'이 바뀝니다. 숙련도 %는 근거가 없어 쓰지 않고, 관리 화면 기술 목록의 **연결할 작업물 태그**와 같은 태그를 가진 작업물을 근거로 보여 줍니다.

## 로컬에서 보기

별도 빌드 과정은 없습니다. 데이터를 JSON 파일에서 불러오므로 `index.html` 을 더블클릭해 열면 내용이 보이지 않고, 아래처럼 로컬 서버를 띄워 확인해야 합니다.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```
